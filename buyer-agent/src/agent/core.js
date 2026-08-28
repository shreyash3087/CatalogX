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

const MERCHANTS = [
  'http://localhost:3001', // UrbanStride (Footwear)
  'http://localhost:3002'  // TechCart (Electronics)
];
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
// Global persistent session response ID cache for conversational thread continuity
if (!global._CATALOGX_SESSION_MEMORY) {
  global._CATALOGX_SESSION_MEMORY = new Map();
}
const _SESSION_RESPONSE_MAP = global._CATALOGX_SESSION_MEMORY;

class BuyerAgent {
  constructor(customSessionId = null) {
    this.sessionId = customSessionId || process.env.AGENT_SESSION_ID || `sess_${uuidv4().slice(0, 12)}`;
    this.agentId = `agent_catalogx_buyer`;
    this.audit = new AuditLogger(this.sessionId, this.agentId);
    this.excludedProductIds = [];
    this.activeMerchantUrl = 'http://localhost:3001';
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
      // ── STEP 1: Understand Intent & Constraints with Responses API Session Memory ──
      console.log(chalk.bold('\n  Phase 1: Understanding your request...'));
      const prevResponseId = _SESSION_RESPONSE_MAP.get(this.sessionId) || null;
      constraints = await parseInstruction(instruction, { previous_response_id: prevResponseId });

      if (constraints.response_id) {
        _SESSION_RESPONSE_MAP.set(this.sessionId, constraints.response_id);
      }

      // Handle conversational / greeting / out-of-context messages naturally without searching products
      if (constraints.intent === 'conversational') {
        await this.audit.log(
          'CONVERSATIONAL_REPLIED',
          { instruction },
          { reply: constraints.conversational_reply },
          constraints.reasoning || 'Conversational interaction addressed with context guidance.'
        );
        console.log(chalk.green(`  💬 Reply: ${constraints.conversational_reply}`));
        return {
          status: 'conversational',
          reply: constraints.conversational_reply,
        };
      }

      // If essential detail like shoe size is missing, ask the user concisely before buying
      if (constraints.needs_clarification && constraints.clarification_question) {
        await this.audit.log(
          'CLARIFICATION_REQUESTED',
          { instruction, missing: 'size' },
          { reply: constraints.clarification_question },
          constraints.reasoning || 'Requested essential sizing details before placing order.'
        );
        console.log(chalk.yellow(`  ❓ Clarification Needed: ${constraints.clarification_question}`));
        return {
          status: 'clarification_needed',
          reply: constraints.clarification_question,
        };
      }

      await this.audit.log('INSTRUCTION_PARSED', { instruction }, constraints, constraints.reasoning);
      console.log(chalk.gray(`  Budget: ${constraints.budget_max_paise ? '₹' + (constraints.budget_max_paise/100) : 'not specified'} | Size: ${constraints.required_size || 'any'} | Category: ${constraints.category || 'any'}`));

      // ── STEP 2: Discover merchant catalog ──────────────────────────────
      console.log(chalk.bold('\n  Phase 2: Discovering merchant catalog...'));
      const catalog = await this.discoverCatalog(constraints);
      await this.audit.log('CATALOG_DISCOVERED',
        { url: `${this.activeMerchantUrl}/.well-known/agent-catalog` },
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
        await this.audit.log('SEARCH_NO_RESULTS',
          { query: constraints.query || instruction },
          null,
          `No matching products found for "${instruction}" in the merchant catalog.`
        );
        return this.reportFailure(instruction, constraints, `No matching products found for "${instruction}" in the merchant catalog.`, alternativesConsidered);
      }

      await this.audit.log('PRODUCT_SELECTED',
        { candidates: searchResults.map(p => p.id) },
        { 
          selected_id: selectedProduct.id, 
          selected_name: selectedProduct.name,
          brand: selectedProduct.brand,
          price: selectedProduct.price,
          image_url: selectedProduct.image_url,
          category: selectedProduct.category,
          merchant_url: this.merchantUrl,
          product_url: selectedProduct.product_url || `${this.merchantUrl}/product.html?id=${selectedProduct.id}`,
        },
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
        { 
          razorpay_order_id: orderResult.razorpay_order_id, 
          amount: orderResult.amount,
          amount_inr: orderResult.amount.inr,
          product_name: selectedProduct.name,
          brand: selectedProduct.brand,
          image_url: selectedProduct.image_url,
          merchant_url: this.merchantUrl,
          product_id: selectedProduct.id,
          product_url: selectedProduct.product_url || `${this.merchantUrl}/product.html?id=${selectedProduct.id}`,
          gate_tier: gateTier,
          agentic_upsell: orderResult.agentic_upsell,
        },
        `Razorpay order created: ${orderResult.razorpay_order_id} for ₹${orderResult.amount.inr} [${gateTier}]`
      );
      console.log(chalk.green(`  ✅ Order: ${orderResult.razorpay_order_id} | Amount: ${orderResult.amount.display}`));

      // ── STEP 7b: Dynamic AI Upsell / Cross-Sell Evaluation (Track 01 Growth) ──
      if (orderResult.agentic_upsell) {
        const upsell = orderResult.agentic_upsell;
        const potentialTotal = orderResult.amount.paise + upsell.bundle_price_paise;
        const budgetCeiling = constraints.budget_max_paise || (gateTier === 'AUTO' ? 150000 : 5000000);
        
        if (potentialTotal <= budgetCeiling) {
          await this.audit.log('UPSELL_OFFERED',
            { base_product: selectedProduct.name, upsell_item: upsell.name, bundle_price: `₹${upsell.bundle_price_paise/100}` },
            { original_price: `₹${upsell.original_price_paise/100}`, discount: upsell.discount },
            `Merchant Agent proposed bundle: ${upsell.name} (${upsell.discount}) for +₹${upsell.bundle_price_paise/100}. Fits within user budget.`
          );
          console.log(chalk.cyan(`  💡 Merchant Upsell Opportunity: ${upsell.name} (+₹${upsell.bundle_price_paise/100}) [${upsell.discount}]`));
        }
      }

      // ── STEP 8: Payment Execution Policy ──
      // In Dashboard / Conversational Mode:
      // Present the selected item and order in chat so the user can review and click "1-Click Buy via Mandate" (Tier 1) or "Pay with Razorpay 2FA" (Tier 2/3)
      if (process.env.AGENT_SESSION_ID) {
        console.log(chalk.bold.cyan(`\n  💳 Order created on Razorpay [Tier: ${gateTier}]. Awaiting user checkout in dashboard...\n`));
        return {
          status: 'order_created',
          orderResult,
          selectedProduct,
          gateTier,
          sessionId: this.sessionId,
        };
      }

      // Standalone Headless CLI Mode:
      // In Tier 1 (AUTO mandate), execute payment automatically without requiring a human button click!
      if (gateTier === 'AUTO') {
        console.log(chalk.bold.green('\n  🟢 Tier 1 Pre-Authorized Mandate active: Executing autonomous payment...\n'));

        await this.audit.log('MANDATE_APPLIED',
          { order_id: orderResult.razorpay_order_id, amount: orderResult.amount },
          { mandate_status: 'ACTIVE_PRE_AUTHORIZED', max_limit: '₹1,500' },
          `Pre-authorized autonomous mandate applied for ₹${orderResult.amount.inr}. Executing zero-click payment.`
        );

        await this.audit.log('PAYMENT_INITIATED',
          { razorpay_order_id: orderResult.razorpay_order_id, method: 'pre_authorized_mandate' },
          null,
          `Initiating autonomous payment execution for order ${orderResult.razorpay_order_id}`
        );

        paymentResult = await this.executePaymentWithRetry(orderResult.razorpay_order_id);

        if (!paymentResult || !paymentResult.success) {
          return this.reportFailure(instruction, constraints, 'Autonomous mandate payment failed.', alternativesConsidered, orderResult);
        }

        await this.audit.log('PAYMENT_VERIFIED',
          { razorpay_order_id: orderResult.razorpay_order_id },
          { razorpay_payment_id: paymentResult.razorpay_payment_id, amount_inr: orderResult.amount.inr, autonomous: true },
          `Autonomous payment captured & verified! Transaction ID: ${paymentResult.razorpay_payment_id}`
        );
        console.log(chalk.green(`  ✅ Autonomous Payment Captured: ${paymentResult.razorpay_payment_id}`));

        return {
          status: 'completed',
          orderResult,
          paymentResult,
          selectedProduct,
          sessionId: this.sessionId,
          autonomous: true,
        };
      }

      // Tier 2 (REVIEW) and Tier 3 (HIGH_VALUE_2FA): Await user checkout
      console.log(chalk.bold.cyan(`\n  💳 Tier [${gateTier}] requires human authorization.\n`));
      return {
        status: 'order_created',
        orderResult,
        selectedProduct,
        gateTier,
        sessionId: this.sessionId,
      };

      // ── STEP 8: Execute payment (Headless CLI Simulation Mode) ─────────
      console.log(chalk.bold('\n  Phase 8: Processing payment simulation...'));
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
        { razorpay_payment_id: paymentResult.razorpay_payment_id, amount_inr: orderResult.amount.inr },
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

  async discoverCatalog(constraints) {
    const manifests = [];
    
    // Connect to all merchants in parallel
    for (const url of MERCHANTS) {
      try {
        const resp = await axios.get(`${url}/.well-known/agent-catalog`, { timeout: 3000 });
        manifests.push({ url, manifest: resp.data });
      } catch (err) {
        // Silent capture — ignore unreachable merchant
      }
    }

    if (manifests.length === 0) {
      throw new Error('No active merchants available in federation.');
    }

    // Category & Keyword routing logic: match query category against merchant manifest categories
    const category = (constraints.category || '').toLowerCase();
    const query = (constraints.query || constraints.instruction || '').toLowerCase();
    let selected = manifests[0]; // fallback default to first reachable

    for (const item of manifests) {
      // 1. Direct category ID match
      const catMatch = category && item.manifest.catalog.categories.some(
        c => c.id === category || category.includes(c.id) || c.id.includes(category)
      );
      if (catMatch) {
        selected = item;
        break;
      }

      // 2. Keyword match in category name or ID
      const keywordMatch = item.manifest.catalog.categories.some(
        c => query.includes(c.id.toLowerCase()) || (c.name && query.includes(c.name.toLowerCase()))
      );
      if (keywordMatch) {
        selected = item;
        break;
      }

      // 3. Electronics vs Footwear heuristic
      if (item.manifest.merchant.category === 'electronics' && (query.includes('earbud') || query.includes('headphone') || query.includes('watch') || query.includes('keyboard') || query.includes('audio') || query.includes('anc'))) {
        selected = item;
        break;
      }
    }

    // Set targeted URL
    this.activeMerchantUrl = selected.url;
    return selected.manifest;
  }

  async searchProducts(constraints, excludeIds = []) {
    const filters = buildSearchFilters(constraints);
    const resp = await axios.post(`${this.activeMerchantUrl}/api/products/search`, {
      query: constraints.query || constraints.instruction,
      filters,
      limit: 25,
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

    // Use LLM to check relevance, quality, and budget-tier alignment
    try {
      const productList = products.slice(0, 15).map((p, i) => ({
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
          content: `You are an expert, consultative personal shopper and e-commerce buyer assistant.
Given a user's instruction and candidate products from the catalog, evaluate all options and select the absolute best matching product.

CRITICAL SELECTION & BUDGET-TIER ALIGNMENT RULES:
1. BUDGET TIER & INTENT ALIGNMENT:
   - When the user specifies a high or generous budget (e.g. ₹10,000 to ₹30,000+), do NOT select a cheap low-end entry product unless they specifically asked for "cheap" or "affordable"! Prioritize flagship, high-durability, premium materials, and top-tier models (e.g. Salomon X Ultra 4 GTX, Nike Air Force 1, Adidas Superstar, Sony Flagship ANC) that best utilize the budget for quality, pedigree, and longevity.
   - When the user specifies a low or tight budget (e.g. under ₹1,500 or under ₹3,000), prioritize high-value options within that cap (e.g. HRX RUN, Campus Hurricane, Nike Revolution, Skechers GO RUN).
   - If the user specifies a specific brand or feature (e.g. "Nike", "waterproof", "noise cancelling"), honor that as the primary requirement.
2. ACCURACY:
   - If the user is asking for an item type that is NOT present among the candidates (e.g. "laptop" when only shoes or mouse are shown), return:
     { "matches_found": false, "reasoning": "None of the products match the requested item type." }
3. CONSULTATIVE EXPLAINABLE REASONING:
   - Provide a 2-3 sentence explanation detailing WHY this specific model was chosen (mentioning brand reputation, materials, cushioning, or price-to-performance value within their budget), and briefly state why it beats alternative candidates.

Return JSON format:
{
  "matches_found": true,
  "selected_index": number,  // 0-based index of the best matching product from the Candidates list
  "reasoning": string,       // 2-3 sentence explainable rationale
  "rejected_reasons": { [index]: string }
}`,
        },
        {
          role: 'user',
          content: `User wants: "${constraints.instruction}"
Budget: ${constraints.budget_max_paise ? '₹' + constraints.budget_max_paise/100 : 'flexible'}
Required size: ${constraints.required_size || 'any'}
Preferred: ${JSON.stringify(constraints.other_preferences)}

Candidates:
${JSON.stringify(productList, null, 2)}`,
        },
      ]);

      if (selection.matches_found === false) {
        console.log(chalk.yellow(`  ⚠️ No relevant product match: ${selection.reasoning}`));
        return null;
      }

      if (selection.selected_index === undefined || selection.selected_index === null || selection.selected_index < 0 || selection.selected_index >= products.length) {
        return null;
      }

      const best = products[selection.selected_index];
      if (!best) return null;
      best._selectionReasoning = selection.reasoning;
      return best;
    } catch (e) {
      console.error('selectBestProduct error:', e);
      return products[0];
    }
  }

  async checkStock(productId) {
    const resp = await axios.get(`${this.activeMerchantUrl}/api/products/${productId}/stock`, { timeout: 5000 });
    return resp.data;
  }

  async createOrder(product, constraints) {
    let userProfile = null;
    try {
      if (process.env.CATALOGX_USER_PROFILE) {
        userProfile = JSON.parse(process.env.CATALOGX_USER_PROFILE);
      }
    } catch (e) {}

    const customer = {
      name: userProfile?.name || 'Shreyas',
      email: userProfile?.email || 'shreyas@agentic.ai',
      phone: userProfile?.phone || '+91 98765 43210',
    };

    const shipping_address = userProfile?.delivery_address || {
      street: 'Flat 402, Skyline Residency, 100ft Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postal_code: '560038',
      country: 'India',
    };

    const resp = await axios.post(`${this.activeMerchantUrl}/api/orders`, {
      product_id: product.id,
      size: constraints.required_size || (product.sizes && product.sizes[0]) || null,
      color: constraints.preferred_color || (product.colors && product.colors[0]) || null,
      quantity: 1,
      customer,
      shipping_address,
      buyer_agent_id: this.agentId,
      session_id: this.sessionId,
      human_instruction: constraints.instruction,
    }, { timeout: 10000 });
    return resp.data;
  }

  async executePaymentWithRetry(razorpayOrderId) {
    const attempt = async () => {
      const resp = await axios.post(`${this.activeMerchantUrl}/api/payments/simulate`, {
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
    console.log(chalk.white(`  Merchant: Federated Routing (Ports 3001/3002)`));
    console.log(chalk.blue(divider));
    console.log(chalk.bold(`\n  🎯 Goal: "${instruction}"\n`));
  }

}

module.exports = { BuyerAgent };
