'use strict';

/**
 * CatalogX — Buyer Agent Core Orchestrator
 * ==========================================
 * Executes the full autonomous purchase flow:
 *  1. Parse instruction → constraints
 *  2. Discover merchant catalog
 *  3. Search & rank products
 *  4. Select best match (LLM reasoning)
 *  5. Gate check (tiered approval)
 *  6. Create Razorpay order
 *  7. Simulate/execute payment
 *  8. Verify payment
 *  9. Report results
 *
 * Handles failures: stock-out fallback, payment retry, graceful errors.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const chalk = require('chalk');
const { v4: uuidv4 } = require('uuid');

const { chatJSON } = require('../../../llm/index');
const { parseInstruction, buildSearchFilters, checkHardConstraints } = require('./constraints');
const { executeGate } = require('./gating');
const { handleStockOut, handlePaymentFailure } = require('./recovery');
const { AuditLogger } = require('../audit/logger');
const { printReport } = require('../audit/reporter');

const MERCHANT_URL = process.env.MERCHANT_SERVER_URL || 'http://localhost:3001';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;

class BuyerAgent {
  constructor() {
    this.sessionId = `sess_${uuidv4().slice(0, 12)}`;
    this.agentId = `agent_catalogx_buyer`;
    this.audit = new AuditLogger(this.sessionId, this.agentId);
    this.excludedProductIds = [];
  }

  /**
   * Main entry point — takes a human instruction and runs the full purchase flow.
   * @param {string} instruction
   */
  async run(instruction) {
    this.printHeader(instruction);

    let selectedProduct = null;
    let constraints = null;
    let orderResult = null;
    let paymentResult = null;
    let gateTier = null;
    let alternativesConsidered = [];

    try {
      // ── STEP 1: Parse instruction ──────────────────────────────────────
      console.log(chalk.bold('\n  Phase 1: Understanding your request...'));
      constraints = await parseInstruction(instruction);
      await this.audit.log('INSTRUCTION_PARSED', { instruction }, constraints, constraints.reasoning);
      console.log(chalk.gray(`  Budget: ${constraints.budget_max_paise ? '₹' + (constraints.budget_max_paise/100) : 'not specified'} | Size: ${constraints.required_size || 'any'} | Category: ${constraints.category || 'any'}`));

      // ── STEP 2: Discover merchant catalog ──────────────────────────────
      console.log(chalk.bold('\n  Phase 2: Discovering merchant catalog...'));
      const catalog = await this.discoverCatalog();
      await this.audit.log('CATALOG_DISCOVERED',
        { url: `${MERCHANT_URL}/.well-known/agent-catalog` },
        { merchant: catalog.merchant.name, products: catalog.catalog.total_products },
        `Discovered ${catalog.merchant.name} with ${catalog.catalog.total_products} products in ${catalog.catalog.categories.length} categories`
      );
      console.log(chalk.gray(`  Merchant: ${catalog.merchant.name} | ${catalog.catalog.in_stock_products} in-stock products`));

      // ── STEP 3: Search & rank products ────────────────────────────────
      console.log(chalk.bold('\n  Phase 3: Searching catalog...'));
      const searchResults = await this.searchProducts(constraints);

      if (!searchResults || searchResults.length === 0) {
        await this.audit.log('SEARCH_NO_RESULTS', { constraints }, null,
          'No products found matching the given constraints.');
        return this.reportFailure(instruction, constraints, 'No products found matching your requirements.', alternativesConsidered);
      }

      await this.audit.log('SEARCH_COMPLETED',
        { query: constraints.query, filters: buildSearchFilters(constraints) },
        { count: searchResults.length, top: searchResults[0]?.name },
        `Found ${searchResults.length} matching products. Top result: "${searchResults[0]?.name}" at ${searchResults[0]?.price?.display}`
      );
      console.log(chalk.gray(`  Found ${searchResults.length} products. Top: ${searchResults[0].name} (${searchResults[0].price.display})`));
      alternativesConsidered = searchResults.slice(1);

      // ── STEP 4: Select best product ───────────────────────────────────
      console.log(chalk.bold('\n  Phase 4: Selecting best match...'));
      selectedProduct = await this.selectBestProduct(searchResults, constraints);

      if (!selectedProduct) {
        return this.reportFailure(instruction, constraints, 'Could not select a suitable product.', alternativesConsidered);
      }

      await this.audit.log('PRODUCT_SELECTED',
        { candidates: searchResults.map(p => p.id) },
        { selected_id: selectedProduct.id, selected_name: selectedProduct.name },
        selectedProduct._selectionReasoning || `Selected "${selectedProduct.name}" as best match for the requirements`
      );
      console.log(chalk.green(`  ✅ Selected: ${selectedProduct.name} — ${selectedProduct.price.display}`));
      if (selectedProduct._selectionReasoning) {
        console.log(chalk.gray(`  Reasoning: ${selectedProduct._selectionReasoning.slice(0, 100)}...`));
      }

      // ── STEP 5: Gate check ────────────────────────────────────────────
      console.log(chalk.bold('\n  Phase 5: Checking spend gate...'));
      const gateResult = await executeGate(
        selectedProduct.price.paise,
        selectedProduct,
        constraints,
        (action, input, output, reasoning) => this.audit.log(action, input, output, reasoning)
      );

      gateTier = gateResult.tier;

      if (!gateResult.approved) {
        return this.reportFailure(instruction, constraints, `Purchase blocked: ${gateResult.reasoning}`, alternativesConsidered);
      }

      // ── STEP 6: Stock verification (real-time, before placing order) ──
      console.log(chalk.bold('\n  Phase 6: Verifying stock availability...'));
      const stockCheck = await this.checkStock(selectedProduct.id);

      if (!stockCheck.in_stock) {
        await this.audit.log('STOCK_OUT_PRE_ORDER',
          { product_id: selectedProduct.id },
          { stock: stockCheck.stock },
          `Stock-out detected before order placement. Triggering fallback.`
        );

        // Recovery: find fallback
        const fallback = await handleStockOut({
          failedProductId: selectedProduct.id,
          searchFn: (c, exclude) => this.searchProducts(c, exclude),
          constraints,
          excludeIds: this.excludedProductIds,
          auditFn: (a, i, o, r) => this.audit.log(a, i, o, r),
        });

        if (!fallback) {
          return this.reportFailure(instruction, constraints, 'Product out of stock and no alternatives available.', alternativesConsidered);
        }

        this.excludedProductIds.push(selectedProduct.id);
        selectedProduct = fallback;
        alternativesConsidered.push(...searchResults.filter(p => p.id !== fallback.id).slice(0, 2));
      } else {
        await this.audit.log('STOCK_VERIFIED',
          { product_id: selectedProduct.id },
          { stock: stockCheck.stock },
          `Stock confirmed: ${stockCheck.stock} units available for "${selectedProduct.name}"`
        );
        console.log(chalk.green(`  ✅ Stock OK: ${stockCheck.stock} units available`));
      }

      // ── STEP 7: Create order ──────────────────────────────────────────
      console.log(chalk.bold('\n  Phase 7: Creating order...'));
      orderResult = await this.createOrder(selectedProduct, constraints);

      await this.audit.log('ORDER_CREATED',
        { product_id: selectedProduct.id, size: constraints.required_size },
        { razorpay_order_id: orderResult.razorpay_order_id, amount: orderResult.amount },
        `Razorpay order created: ${orderResult.razorpay_order_id} for ₹${orderResult.amount.inr}`
      );
      console.log(chalk.green(`  ✅ Order: ${orderResult.razorpay_order_id} | Amount: ${orderResult.amount.display}`));

      // ── STEP 8: Execute payment ───────────────────────────────────────
      console.log(chalk.bold('\n  Phase 8: Processing payment...'));
      await this.audit.log('PAYMENT_INITIATED',
        { razorpay_order_id: orderResult.razorpay_order_id },
        null,
        `Initiating test-mode payment simulation for order ${orderResult.razorpay_order_id}`
      );

      paymentResult = await this.executePaymentWithRetry(orderResult.razorpay_order_id);

      if (!paymentResult || !paymentResult.success) {
        return this.reportFailure(instruction, constraints, 'Payment failed after all retries.', alternativesConsidered, orderResult);
      }

      await this.audit.log('PAYMENT_VERIFIED',
        { razorpay_order_id: orderResult.razorpay_order_id },
        { razorpay_payment_id: paymentResult.razorpay_payment_id },
        `Payment verified successfully. Payment ID: ${paymentResult.razorpay_payment_id}`
      );
      console.log(chalk.green(`  ✅ Payment: ${paymentResult.razorpay_payment_id}`));

      // ── STEP 9: Done! ─────────────────────────────────────────────────
      console.log(chalk.bold.green('\n  🎉 Purchase completed successfully!\n'));
      printReport({
        instruction,
        sessionId: this.sessionId,
        status: 'completed',
        selectedProduct,
        constraints,
        orderResult,
        paymentResult,
        gateTier,
        alternativesConsidered,
        auditSummary: this.audit.getSummary(),
      });

    } catch (err) {
      await this.audit.log('AGENT_ERROR', null, { error: err.message }, `Unexpected error: ${err.message}`);
      console.error(chalk.red(`\n  ❌ Unexpected error: ${err.message}`));
      this.reportFailure(instruction, constraints, err.message, alternativesConsidered, orderResult);
    }
  }

  // ── Private methods ────────────────────────────────────────────────────────

  async discoverCatalog() {
    const resp = await axios.get(`${MERCHANT_URL}/.well-known/agent-catalog`, { timeout: 5000 });
    return resp.data;
  }

  async searchProducts(constraints, excludeIds = []) {
    const filters = buildSearchFilters(constraints);
    const resp = await axios.post(`${MERCHANT_URL}/api/products/search`, {
      query: constraints.query || constraints.instruction,
      filters,
      limit: 10,
    }, { timeout: 15000 });

    let results = resp.data.results || [];

    // Exclude any products we've already tried
    const allExcluded = [...this.excludedProductIds, ...excludeIds];
    results = results.filter(p => !allExcluded.includes(p.id));

    // Apply hard constraint validation
    return results.filter(p => checkHardConstraints(p, constraints).passes);
  }

  async selectBestProduct(products, constraints) {
    if (products.length === 0) return null;
    if (products.length === 1) return products[0];

    // Use LLM to rank and explain the selection
    try {
      const productList = products.slice(0, 5).map((p, i) => ({
        index: i,
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price.display,
        price_paise: p.price.paise,
        sizes: p.sizes,
        colors: p.colors,
        relevance_score: p.relevance_score,
        tags: p.tags,
      }));

      const selection = await chatJSON([
        {
          role: 'system',
          content: `You are a smart shopping assistant. Given a user's requirements and a list of products, 
select the BEST product and explain why. Return JSON:
{
  "selected_index": number,  // 0-based index of the best product
  "reasoning": string,       // 2-3 sentence explanation of why this is the best choice
  "rejected_reasons": { [index]: string }  // why other products were not selected
}`,
        },
        {
          role: 'user',
          content: `User wants: "${constraints.instruction}"
Budget: ${constraints.budget_max_paise ? '₹' + constraints.budget_max_paise/100 : 'flexible'}
Required size: ${constraints.required_size || 'any'}
Preferred: ${JSON.stringify(constraints.other_preferences)}

Products:
${JSON.stringify(productList, null, 2)}`,
        },
      ]);

      const best = products[selection.selected_index] || products[0];
      best._selectionReasoning = selection.reasoning;
      return best;
    } catch (e) {
      // Fallback: return highest relevance score
      return products[0];
    }
  }

  async checkStock(productId) {
    const resp = await axios.get(`${MERCHANT_URL}/api/products/${productId}/stock`, { timeout: 5000 });
    return resp.data;
  }

  async createOrder(product, constraints) {
    const resp = await axios.post(`${MERCHANT_URL}/api/orders`, {
      product_id: product.id,
      size: constraints.required_size || product.sizes[0],
      color: constraints.preferred_color || product.colors[0],
      quantity: 1,
      buyer_agent_id: this.agentId,
      session_id: this.sessionId,
      human_instruction: constraints.instruction,
    }, { timeout: 10000 });
    return resp.data;
  }

  async executePaymentWithRetry(razorpayOrderId) {
    const attempt = async () => {
      const resp = await axios.post(`${MERCHANT_URL}/api/payments/simulate`, {
        razorpay_order_id: razorpayOrderId,
        session_id: this.sessionId,
      }, { timeout: 10000 });
      return resp.data;
    };

    try {
      return await attempt();
    } catch (err) {
      return await handlePaymentFailure({
        error: err,
        attemptFn: attempt,
        maxRetries: MAX_RETRIES,
        auditFn: (a, i, o, r) => this.audit.log(a, i, o, r),
        orderId: razorpayOrderId,
      });
    }
  }

  reportFailure(instruction, constraints, reason, alternatives, orderResult) {
    printReport({
      instruction,
      sessionId: this.sessionId,
      status: 'failed',
      selectedProduct: null,
      constraints,
      orderResult,
      paymentResult: null,
      gateTier: null,
      alternativesConsidered: alternatives || [],
      failureReason: reason,
      auditSummary: this.audit.getSummary(),
    });
  }

  printHeader(instruction) {
    const divider = '─'.repeat(62);
    console.log('\n' + chalk.blue(divider));
    console.log(chalk.bold.blue('  CATALOGX — Buyer Agent'));
    console.log(chalk.blue(divider));
    console.log(chalk.white(`  Session : ${this.sessionId}`));
    console.log(chalk.white(`  Agent   : ${this.agentId}`));
    console.log(chalk.white(`  Merchant: ${MERCHANT_URL}`));
    console.log(chalk.blue(divider));
    console.log(chalk.bold(`\n  🎯 Goal: "${instruction}"\n`));
  }
}

module.exports = { BuyerAgent };
