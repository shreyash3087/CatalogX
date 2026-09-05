'use strict';

/**
 * CatalogX — Open Agentic Commerce Buyer Core
 * ============================================
 * Search-First, Consultative Autonomous Commerce Orchestrator.
 * Fully supports the Recommend ➔ Review ➔ Confirm ➔ Create Order flow.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { chatJSON } = require('../../../llm/index');
const { parseInstruction, buildSearchFilters, checkHardConstraints } = require('./constraints');
const { executeGate } = require('./gating');
const { handleStockOut, handlePaymentFailure } = require('./recovery');
const { AuditLogger } = require('../audit/logger');
const { printReport } = require('../audit/reporter');
const { loadSession, appendMessage, updateSessionProductState } = require('../db/sessionStore');

const MERCHANTS = process.env.MERCHANT_URLS
  ? process.env.MERCHANT_URLS.split(',').map((u) => u.trim())
  : [
      process.env.URBANSTRIDE_URL || process.env.NEXT_PUBLIC_URBANSTRIDE_URL || 'http://localhost:3001',
      process.env.TECHCART_URL || process.env.NEXT_PUBLIC_TECHCART_URL || 'http://localhost:3002',
    ];
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;

if (!global._CATALOGX_SESSION_MEMORY) {
  global._CATALOGX_SESSION_MEMORY = new Map();
}
const _SESSION_RESPONSE_MAP = global._CATALOGX_SESSION_MEMORY;

async function retryWithBackoff(fn, retries = 3, delayMs = 600, label = 'Operation') {
  let lastErr = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        console.log(chalk.gray(`  [Retry] ${label} failed (attempt ${attempt}/${retries}). Retrying in ${delayMs * attempt}ms...`));
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
  }
  throw lastErr;
}

class BuyerAgent {
  constructor(customSessionId = null, customUserId = null) {
    this.sessionId = customSessionId || process.env.AGENT_SESSION_ID || `sess_${uuidv4().slice(0, 12)}`;
    this.userId = customUserId || process.env.CATALOGX_USER_ID || 'user_shreyash_001';
    this.agentId = `agent_catalogx_buyer`;
    this.audit = new AuditLogger(this.sessionId, this.agentId, this.userId);
    this.excludedProductIds = [];
    this.activeMerchantUrl = 'http://localhost:3001';
    this.lastRecommendedProduct = null;
    this.selectedSize = null;
  }

  async _loadSessionHistory() {
    const history = [];

    // 1. Scan authoritative audit log on disk
    try {
      const logFile = path.resolve(__dirname, '../../logs', `${this.sessionId}.json`);
      if (fs.existsSync(logFile)) {
        const raw = fs.readFileSync(logFile, 'utf8');
        const entries = JSON.parse(raw);
        if (Array.isArray(entries)) {
          for (let i = entries.length - 1; i >= 0; i--) {
            const e = entries[i];
            if (e.action === 'CLARIFICATION_REQUESTED' && e.output_data?.candidates && (!this.candidateProducts || this.candidateProducts.length === 0)) {
              this.candidateProducts = e.output_data.candidates;
            }
            if (e.action === 'PRODUCT_RECOMMENDED' && !this.lastRecommendedProduct) {
              const prod = e.output_data?.product || {
                id: e.output_data?.recommended_id || e.output_data?.selected_id,
                name: e.output_data?.recommended_name || e.output_data?.selected_name,
                brand: e.output_data?.brand,
                price: e.output_data?.price,
                image_url: e.output_data?.image_url,
                category: e.output_data?.category,
                merchant_url: e.output_data?.merchant_url,
                product_url: e.output_data?.product_url,
                required_options: e.output_data?.required_options,
                offers: e.output_data?.offers,
              };
              if (prod.id && prod.name) {
                this.lastRecommendedProduct = prod;
                if (prod.merchant_url || e.output_data?.merchant_url) {
                  this.activeMerchantUrl = prod.merchant_url || e.output_data?.merchant_url;
                }
              }
            }
            if (e.output_data?.required_size && !this.selectedSize) {
              this.selectedSize = e.output_data.required_size;
            }
            if (e.input_data?.required_size && !this.selectedSize) {
              this.selectedSize = e.input_data.required_size;
            }
          }

          for (const e of entries) {
            if (
              e.action === 'INSTRUCTION_PARSED' ||
              e.action === 'CONVERSATIONAL_REPLIED' ||
              e.action === 'CLARIFICATION_REQUESTED' ||
              e.action === 'PRODUCT_RECOMMENDED' ||
              e.action === 'ORDER_CREATED'
            ) {
              if (e.input_data?.instruction) {
                history.push({ role: 'user', content: e.input_data.instruction });
              }
              if (e.output_data?.reply) {
                history.push({ role: 'assistant', content: e.output_data.reply });
              }
            }
          }
        }
      }
    } catch (_) {}

    // 2. Supplement with MongoDB session store
    try {
      const mongoData = await loadSession(this.userId, this.sessionId);
      if (mongoData) {
        if (!this.lastRecommendedProduct && mongoData.session?.selectedProduct) {
          this.lastRecommendedProduct = mongoData.session.selectedProduct;
        }
        if (mongoData.session?.activeMerchantUrl) {
          this.activeMerchantUrl = mongoData.session.activeMerchantUrl;
        }
        if (!this.candidateProducts && mongoData.session?.candidateProducts) {
          this.candidateProducts = mongoData.session.candidateProducts;
        }
        if (history.length === 0 && Array.isArray(mongoData.messages)) {
          for (let i = mongoData.messages.length - 1; i >= 0; i--) {
            const m = mongoData.messages[i];
            if (m.data?.recommendedProduct && !this.lastRecommendedProduct) {
              this.lastRecommendedProduct = m.data.recommendedProduct;
            }
          }
          return mongoData.messages.map((m) => ({
            role: m.role || (m.sender === 'human' ? 'user' : 'assistant'),
            content: m.text,
          }));
        }
      }
    } catch (_) {}

    return history;
  }

  /**
   * Main entry point — runs conversational recommendation or order creation.
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
      await appendMessage(this.userId, this.sessionId, {
        role: 'user',
        text: instruction,
      });

      // ── STEP 1: Understand Intent & Constraints ───────────────────────
      console.log(chalk.bold('\n  Phase 1: Understanding your request...'));
      const conversationHistory = await this._loadSessionHistory();
      const prevResponseId = _SESSION_RESPONSE_MAP.get(this.sessionId) || null;

      constraints = await parseInstruction(instruction, {
        conversationHistory,
        previous_response_id: prevResponseId,
      });

      if (constraints.response_id) {
        _SESSION_RESPONSE_MAP.set(this.sessionId, constraints.response_id);
      }

      // Handle conversational / greeting queries
      if (constraints.intent === 'conversational') {
        await this.audit.log(
          'CONVERSATIONAL_REPLIED',
          { instruction },
          { reply: constraints.conversational_reply },
          constraints.reasoning || 'Conversational interaction answered.'
        );
        await appendMessage(this.userId, this.sessionId, {
          role: 'assistant',
          text: constraints.conversational_reply,
        });
        console.log(chalk.green(`  💬 Reply: ${constraints.conversational_reply}`));
        return {
          status: 'conversational',
          reply: constraints.conversational_reply,
        };
      }

      await this.audit.log('INSTRUCTION_PARSED', { instruction }, constraints, constraints.reasoning);
      console.log(
        chalk.gray(
          `  Intent: ${constraints.intent} | Budget: ${constraints.budget_max_paise ? '₹' + constraints.budget_max_paise / 100 : 'not specified'} | Query: "${constraints.query}"`
        )
      );

      // ── BRANCH: ORDER CONFIRMATION TURN ────────────────────────────────
      if (constraints.intent === 'order_confirmation') {
        console.log(chalk.bold.green('\n  Phase: Processing Order Confirmation...'));

        // Use last recommended product if available, or search matching item
        if (this.lastRecommendedProduct) {
          selectedProduct = this.lastRecommendedProduct;
          if (selectedProduct.merchant_url) {
            this.activeMerchantUrl = selectedProduct.merchant_url;
          }
        } else {
          await this.discoverCatalog(constraints, instruction);
          const searchResults = await this.searchProducts(constraints);
          selectedProduct = searchResults?.[0];
        }

        if (this.selectedSize && !constraints.required_size) {
          constraints.required_size = this.selectedSize;
        }

        if (!selectedProduct) {
          const errMsg = 'Could not find the product to confirm order for. Please search again.';
          await appendMessage(this.userId, this.sessionId, { role: 'assistant', text: errMsg });
          return this.reportFailure(instruction, constraints, errMsg);
        }

        return await this._executeOrderCreation(selectedProduct, constraints, instruction);
      }

      // ── STEP 2: Discover merchant catalog (Skip if continuing parameter turn on active merchant) ──
      const isContinuationTurn =
        Array.isArray(this.candidateProducts) &&
        this.candidateProducts.length > 0 &&
        (constraints.required_size || Object.keys(constraints.user_provided_options || {}).length > 0);

      let catalog = null;
      if (!isContinuationTurn) {
        console.log(chalk.bold('\n  Phase 2: Discovering merchant catalog...'));
        catalog = await this.discoverCatalog(constraints, instruction);
        await this.audit.log(
          'CATALOG_DISCOVERED',
          { url: `${this.activeMerchantUrl}/.well-known/agent-catalog` },
          { merchant: catalog.merchant.name, products: catalog.catalog.total_products },
          `Discovered ${catalog.merchant.name} with ${catalog.catalog.total_products} products`
        );
      } else {
        console.log(chalk.gray(`  Continuing parameter turn on active merchant: ${this.activeMerchantUrl}`));
      }

      // ── BRANCH: SHOPPING & RECOMMENDATION TURN ──────────────────────────
      console.log(chalk.bold('\n  Phase 3: Searching catalog / filtering candidates...'));
      let searchResults = [];

      if (isContinuationTurn && this.candidateProducts && this.candidateProducts.length > 0) {
        searchResults = this.candidateProducts;
      } else {
        const searchConstraints = { ...constraints };
        searchResults = await this.searchProducts({
          ...searchConstraints,
          required_size: null,
        });
      }

      if (!searchResults || searchResults.length === 0) {
        const relaxedResults = await this.searchProducts({ query: constraints.query });
        let noResultMsg = `No products found matching "${constraints.query || instruction}"`;
        if (constraints.budget_max_paise) {
          noResultMsg += ` under ₹${(constraints.budget_max_paise / 100).toLocaleString('en-IN')}`;
        }
        noResultMsg += '.';

        if (relaxedResults && relaxedResults.length > 0) {
          const suggestions = relaxedResults
            .slice(0, 2)
            .map((p) => `"${p.name}" at ${p.price?.display || '₹' + p.price_paise / 100}`)
            .join(', ');
          noResultMsg += ` The closest available items are ${suggestions}.`;
        }

        await this.audit.log('SEARCH_NO_RESULTS', { query: constraints.query, budget: constraints.budget_max_paise }, null, noResultMsg);
        await appendMessage(this.userId, this.sessionId, {
          role: 'assistant',
          text: noResultMsg,
        });
        return this.reportFailure(instruction, constraints, noResultMsg, relaxedResults);
      }

      if (!isContinuationTurn) {
        await this.audit.log(
          'SEARCH_COMPLETED',
          { query: constraints.query, filters: buildSearchFilters(constraints) },
          { count: searchResults.length, top: searchResults[0]?.name },
          `Found ${searchResults.length} matching products. Top candidate: "${searchResults[0]?.name}" at ${searchResults[0]?.price?.display}`
        );
      }
      console.log(chalk.gray(`  Candidate items: ${searchResults.length} products. Top: ${searchResults[0].name} (${searchResults[0].price?.display || '₹' + searchResults[0].price_paise / 100})`));

      // ── STEP 4: Inspect Product-Level Required Options ──────────────────
      const topCandidates = searchResults.slice(0, 3);
      const topProduct = topCandidates[0];

      const requiredOptions = Array.isArray(topProduct.required_options)
        ? topProduct.required_options.filter((opt) => opt.required === true)
        : [];

      let missingRequiredOption = null;
      for (const opt of requiredOptions) {
        const userVal =
          constraints.user_provided_options?.[opt.key] ||
          (opt.key === 'size' ? constraints.required_size : null);

        if (!userVal) {
          missingRequiredOption = opt;
          break;
        }
      }

      if (missingRequiredOption) {
        const availableList = missingRequiredOption.available_options || [];
        const optLabel = missingRequiredOption.label || missingRequiredOption.key;

        const candidateSummary = topCandidates
          .map((p) => `"${p.name}" (${p.price.display})`)
          .join(' and ');

        const optionsStr = availableList.map((o) => (missingRequiredOption.key === 'size' ? `UK ${o}` : o)).join(', ');
        const budgetStr = constraints.budget_max_paise
          ? ` under ₹${(constraints.budget_max_paise / 100).toLocaleString('en-IN')}`
          : '';

        const question = `I found great in-stock options${budgetStr} on ${catalog.merchant.name}: ${candidateSummary}. What ${optLabel} (available: ${optionsStr}) should I order for you?`;

        await this.audit.log(
          'CLARIFICATION_REQUESTED',
          { instruction, missing_option: missingRequiredOption.key, candidates: topCandidates.map((p) => p.id) },
          {
            reply: question,
            product: topProduct,
            candidates: topCandidates,
            required_option: missingRequiredOption,
            offers: topProduct.offers || [],
          },
          `Candidate product "${topProduct.name}" requires ${optLabel}. Prompting user with available options: ${optionsStr}.`
        );
        await appendMessage(this.userId, this.sessionId, {
          role: 'assistant',
          text: question,
          data: { candidates: topCandidates, offers: topProduct.offers || [] },
        });

        await updateSessionProductState(this.sessionId, {
          candidateProducts: topCandidates,
          activeMerchantUrl: this.activeMerchantUrl,
        });

        console.log(chalk.yellow(`  ❓ Option Needed: ${question}`));
        return {
          status: 'clarification_needed',
          reply: question,
          candidates: topCandidates,
          offers: topProduct.offers || [],
        };
      }

      // Filter candidates for selected size/option
      let eligibleProducts = searchResults;
      if (constraints.required_size) {
        eligibleProducts = searchResults.filter(
          (p) => !p.sizes || p.sizes.includes(String(constraints.required_size)) || p.sizes.includes('onesize')
        );

        if (eligibleProducts.length === 0) {
          const availSizes = Array.from(new Set(searchResults.flatMap((p) => p.sizes || []))).sort((a, b) => Number(a) - Number(b));
          const sizeErrMsg = `None of the matching products under ₹${(constraints.budget_max_paise || 150000) / 100} are in stock for size ${constraints.required_size}. In-stock sizes are UK ${availSizes.join(', ')}.`;
          await this.audit.log('SEARCH_NO_RESULTS', { required_size: constraints.required_size }, null, sizeErrMsg);
          await appendMessage(this.userId, this.sessionId, {
            role: 'assistant',
            text: sizeErrMsg,
          });
          return this.reportFailure(instruction, constraints, sizeErrMsg, searchResults);
        }
      }

      // ── STEP 5: Select Best Match & PROPOSE (Without premature order creation) ──
      console.log(chalk.bold('\n  Phase 4: Selecting best match & formulating recommendation...'));
      selectedProduct = await this.selectBestProduct(eligibleProducts, constraints);

      if (!selectedProduct) {
        selectedProduct = eligibleProducts[0];
      }

      this.lastRecommendedProduct = selectedProduct;
      alternativesConsidered = eligibleProducts.filter((p) => p.id !== selectedProduct.id);

      const productOffer = Array.isArray(selectedProduct.offers) && selectedProduct.offers.length > 0 ? selectedProduct.offers[0] : null;

      let recommendReply = `I found the **${selectedProduct.name}** (${selectedProduct.price.display})`;
      if (constraints.required_size) {
        recommendReply += ` in UK Size ${constraints.required_size}`;
      }
      recommendReply += `. ${selectedProduct._selectionReasoning || selectedProduct.description || ''}`;

      if (productOffer) {
        recommendReply += `\n\n**Special Add-on Offer**: ${productOffer.name} for +₹${productOffer.bundle_price_paise / 100} (${productOffer.discount}).`;
      }
      recommendReply += `\n\nWould you like me to place the order for this, or would you like to see other options?`;

      await this.audit.log(
        'PRODUCT_RECOMMENDED',
        { candidates: eligibleProducts.map((p) => p.id) },
        {
          product: selectedProduct,
          reply: recommendReply,
          recommended_id: selectedProduct.id,
          recommended_name: selectedProduct.name,
          brand: selectedProduct.brand,
          price: selectedProduct.price,
          image_url: selectedProduct.image_url,
          category: selectedProduct.category,
          merchant_url: this.activeMerchantUrl,
          product_url: selectedProduct.product_url || `${this.activeMerchantUrl}/product/${selectedProduct.id}`,
          required_options: selectedProduct.required_options || [],
          offers: selectedProduct.offers || [],
        },
        selectedProduct._selectionReasoning || `Recommended "${selectedProduct.name}" within budget. Awaiting user order confirmation.`
      );
      console.log(chalk.green(`  [Recommended] ${selectedProduct.name} — ${selectedProduct.price.display} (Awaiting user review)`));

      await appendMessage(this.userId, this.sessionId, {
        role: 'assistant',
        text: recommendReply,
        data: {
          recommendedProduct: selectedProduct,
          candidates: topCandidates,
          offers: selectedProduct.offers || [],
        },
      });

      await updateSessionProductState(this.sessionId, {
        selectedProduct: {
          id: selectedProduct.id,
          name: selectedProduct.name,
          brand: selectedProduct.brand,
          price: selectedProduct.price,
          priceDisplay: selectedProduct.price?.display,
          imageUrl: selectedProduct.image_url,
          category: selectedProduct.category,
          size: constraints.required_size || null,
          merchant_url: this.activeMerchantUrl,
          product_url: selectedProduct.product_url || `${this.activeMerchantUrl}/product/${selectedProduct.id}`,
        },
        activeMerchantUrl: this.activeMerchantUrl,
        candidateProducts: eligibleProducts,
      });

      return {
        status: 'product_recommended',
        reply: recommendReply,
        recommendedProduct: selectedProduct,
        candidates: topCandidates,
        offers: selectedProduct.offers || [],
        sessionId: this.sessionId,
      };
    } catch (err) {
      await this.audit.log('AGENT_ERROR', null, { error: err.message }, `Unexpected error: ${err.message}`);
      console.error(chalk.red(`\n  ❌ Unexpected error: ${err.message}`));
      this.reportFailure(instruction, constraints, err.message, alternativesConsidered, orderResult);
    }
  }

  /**
   * Internal order creation upon explicit confirmation
   */
  async _executeOrderCreation(selectedProduct, constraints, instruction) {
    // ── Phase: Gate Check ──
    console.log(chalk.bold('\n  Phase 5: Checking spend gate...'));
    const gateResult = await executeGate(
      selectedProduct.price.paise,
      selectedProduct,
      constraints,
      (action, input, output, reasoning) => this.audit.log(action, input, output, reasoning)
    );

    const gateTier = gateResult.tier;
    if (!gateResult.approved) {
      return this.reportFailure(instruction, constraints, `Purchase blocked: ${gateResult.reasoning}`, []);
    }

    // ── Phase: Stock Verification ──
    console.log(chalk.bold('\n  Phase 6: Verifying stock availability...'));
    const stockCheck = await this.checkStock(selectedProduct.id);
    if (!stockCheck.in_stock) {
      return this.reportFailure(instruction, constraints, 'Product out of stock.', []);
    }
    await this.audit.log('STOCK_VERIFIED', { product_id: selectedProduct.id }, { stock: stockCheck.stock }, `Stock confirmed: ${stockCheck.stock} units available.`);

    // ── Phase: Create Order on Merchant / Razorpay ──
    console.log(chalk.bold('\n  Phase 7: Creating order on Razorpay...'));
    const orderResult = await this.createOrder(selectedProduct, constraints);
    const productOffer = Array.isArray(selectedProduct.offers) && selectedProduct.offers.length > 0 ? selectedProduct.offers[0] : null;

    const merchantName = this.activeMerchantUrl.includes('3002') ? 'TechCart Electronics' : 'UrbanStride Footwear';
    const customer = orderResult.customer || {
      name: 'Customer',
      email: 'customer@catalogx.ai',
      phone: '',
    };
    const shippingAddress = orderResult.shipping_address || {};
    const shipDest = [shippingAddress.street, shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ') + (shippingAddress.postal_code ? ` - ${shippingAddress.postal_code}` : '');

    await this.audit.log(
      'ORDER_CREATED',
      {
        product_id: selectedProduct.id,
        options: constraints.user_provided_options || {},
        selected_size: constraints.required_size || 'Standard',
        customer,
        shipping_address: shippingAddress,
      },
      {
        razorpay_order_id: orderResult.razorpay_order_id,
        amount: orderResult.amount,
        amount_inr: orderResult.amount.inr,
        product_name: selectedProduct.name,
        brand: selectedProduct.brand,
        image_url: selectedProduct.image_url,
        merchant_url: this.activeMerchantUrl,
        merchant_name: merchantName,
        customer,
        shipping_address: shippingAddress,
        shipping_destination: shipDest || 'Primary Address',
        product_id: selectedProduct.id,
        product_url: selectedProduct.product_url || `${this.activeMerchantUrl}/product/${selectedProduct.id}`,
        gate_tier: gateTier,
        agentic_upsell: productOffer || orderResult.agentic_upsell,
        offers: selectedProduct.offers || [],
      },
      `Razorpay order created: ${orderResult.razorpay_order_id} for ₹${orderResult.amount.inr} [${gateTier}]`
    );
    console.log(chalk.green(`  ✅ Order: ${orderResult.razorpay_order_id} | Amount: ${orderResult.amount.display}`));

    await appendMessage(this.userId, this.sessionId, {
      role: 'assistant',
      text: `Order created for ${selectedProduct.name} (${selectedProduct.price.display}). Ready for checkout.`,
      data: { orderResult, selectedProduct, gateTier, offers: selectedProduct.offers || [] },
    });

    await updateSessionProductState(this.sessionId, {
      selectedProduct: {
        id: selectedProduct.id,
        name: selectedProduct.name,
        brand: selectedProduct.brand,
        price: selectedProduct.price,
        priceDisplay: selectedProduct.price?.display,
        imageUrl: selectedProduct.image_url,
        category: selectedProduct.category,
      },
      lastOrder: {
        orderId: orderResult.razorpay_order_id,
        amount: orderResult.amount,
        productName: selectedProduct.name,
        gateTier,
        status: 'CREATED',
      },
    });

    if (process.env.AGENT_SESSION_ID) {
      return {
        status: 'order_created',
        orderResult,
        selectedProduct,
        gateTier,
        sessionId: this.sessionId,
        offers: selectedProduct.offers || [],
      };
    }

    // Standalone Headless CLI Mode:
    if (gateTier === 'AUTO') {
      console.log(chalk.bold.green('\n  🟢 Tier 1 Pre-Authorized Mandate: Executing autonomous payment...\n'));
      await this.audit.log(
        'MANDATE_APPLIED',
        { order_id: orderResult.razorpay_order_id, amount: orderResult.amount },
        { mandate_status: 'ACTIVE_PRE_AUTHORIZED', max_limit: '₹1,500' },
        `Pre-authorized autonomous mandate applied for ₹${orderResult.amount.inr}. Executing zero-click payment.`
      );

      const paymentResult = await this.executePaymentWithRetry(orderResult.razorpay_order_id);
      if (paymentResult && paymentResult.success) {
        await this.audit.log(
          'PAYMENT_VERIFIED',
          { razorpay_order_id: orderResult.razorpay_order_id },
          { razorpay_payment_id: paymentResult.razorpay_payment_id, amount_inr: orderResult.amount.inr, autonomous: true },
          `Autonomous payment captured & verified! Transaction ID: ${paymentResult.razorpay_payment_id}`
        );

        await updateSessionProductState(this.sessionId, {
          isPaid: true,
          lastOrder: {
            orderId: orderResult.razorpay_order_id,
            amount: orderResult.amount,
            productName: selectedProduct.name,
            gateTier,
            status: 'PAID',
            paymentId: paymentResult.razorpay_payment_id,
          },
        });

        return {
          status: 'completed',
          orderResult,
          paymentResult,
          selectedProduct,
          sessionId: this.sessionId,
          autonomous: true,
          offers: selectedProduct.offers || [],
        };
      }
    }

    return {
      status: 'order_created',
      orderResult,
      selectedProduct,
      gateTier,
      sessionId: this.sessionId,
      offers: selectedProduct.offers || [],
    };
  }

  // ── Private methods ────────────────────────────────────────────────────────

  async discoverCatalog(constraints, instruction = '') {
    let manifests = [];

    const fetchManifests = async () => {
      const results = [];
      for (const url of MERCHANTS) {
        try {
          const resp = await axios.get(`${url}/.well-known/agent-catalog`, { timeout: 6000 });
          if (resp.data && resp.data.merchant) {
            results.push({ url, manifest: resp.data });
          }
        } catch (err) {}
      }
      return results;
    };

    try {
      manifests = await retryWithBackoff(fetchManifests, 3, 500, 'Federated Catalog Discovery');
    } catch (e) {
      manifests = [];
    }

    // Static fallback if storefront servers are booting or momentarily unreachable
    if (manifests.length === 0) {
      console.log(chalk.yellow('  [Discovery] Using fallback merchant federation manifests.'));
      manifests = [
        {
          url: 'http://localhost:3001',
          manifest: {
            merchant: { id: 'merchant_urbanstride_001', name: 'UrbanStride Footwear', category: 'footwear' },
            catalog: { total_products: 17, categories: [{ id: 'footwear', name: 'footwear' }, { id: 'shoes', name: 'shoes' }, { id: 'running', name: 'running' }] },
          },
        },
        {
          url: 'http://localhost:3002',
          manifest: {
            merchant: { id: 'merchant_techcart_002', name: 'TechCart Electronics', category: 'electronics' },
            catalog: { total_products: 15, categories: [{ id: 'electronics', name: 'electronics' }, { id: 'audio', name: 'audio' }, { id: 'keyboards', name: 'keyboards' }] },
          },
        },
      ];
    }

    // ── LLM Semantic Federated Merchant Routing ─────────────────────────────
    let selected = await this.routeMerchantWithLLM(instruction, constraints, manifests);

    // Dynamic metadata fallback if LLM routing didn't select
    if (!selected) {
      const category = (constraints.category || '').toLowerCase();
      const query = (constraints.query || instruction || '').toLowerCase();

      for (const item of manifests) {
        const catMatch = category && item.manifest?.catalog?.categories?.some(
          (c) => c.id === category || category.includes(c.id) || c.id.includes(category)
        );
        if (catMatch) {
          selected = item;
          break;
        }

        const keywordMatch = item.manifest?.catalog?.categories?.some(
          (c) => query.includes(c.id.toLowerCase()) || (c.name && query.includes(c.name.toLowerCase()))
        );
        if (keywordMatch) {
          selected = item;
          break;
        }
      }
    }

    if (!selected) {
      selected = manifests[0];
    }

    this.activeMerchantUrl = selected.url;
    return selected.manifest;
  }

  async routeMerchantWithLLM(instruction, constraints, manifests) {
    if (!manifests || manifests.length === 0) return null;
    if (manifests.length === 1) return manifests[0];

    try {
      const merchantSummaries = manifests.map((m) => ({
        url: m.url,
        name: m.manifest?.merchant?.name || 'Unknown',
        category: m.manifest?.merchant?.category || 'General',
        description: m.manifest?.merchant?.description || '',
        categories: m.manifest?.catalog?.categories?.map((c) => c.name || c.id) || [],
      }));

      const systemPrompt = `You are the federated routing coordinator for CatalogX.
Given the user's shopping request and constraints, select the most appropriate merchant catalog URL from the available merchants list.

Respond ONLY with valid JSON in this format:
{
  "selected_url": "http://localhost:300X",
  "reasoning": "brief explanation"
}`;

      const userPrompt = `User Request: "${instruction || constraints.query || ''}"
Parsed Constraints: ${JSON.stringify({ query: constraints.query, category: constraints.category, budget: constraints.budget_max_paise })}

Available Federated Merchants:
${JSON.stringify(merchantSummaries, null, 2)}`;

      const result = await chatJSON(systemPrompt, userPrompt, { temperature: 0.1 });
      if (result && result.selected_url) {
        const match = manifests.find((m) => m.url === result.selected_url || result.selected_url.includes(m.url));
        if (match) {
          console.log(chalk.cyan(`  [Semantic Router] LLM routed to ${match.manifest?.merchant?.name} (${result.reasoning || 'Semantic fit'})`));
          return match;
        }
      }
    } catch (err) {
      console.log(chalk.gray(`  [Semantic Router] Fallback: ${err.message}`));
    }
    return null;
  }

  async searchProducts(constraints, excludeIds = []) {
    const filters = buildSearchFilters(constraints);
    let searchResults = [];

    // 1. Query primary active merchant
    try {
      const resp = await retryWithBackoff(
        () =>
          axios.post(
            `${this.activeMerchantUrl}/api/products/search`,
            {
              query: constraints.query || constraints.instruction,
              filters,
              limit: 25,
            },
            { timeout: 8000 }
          ),
        2,
        300,
        `Product Search on ${this.activeMerchantUrl}`
      );
      searchResults = resp.data.results || [];
    } catch (err) {}

    // 2. If no matching results on active merchant, search federated peers
    if (searchResults.length === 0) {
      for (const merchantUrl of MERCHANTS) {
        if (merchantUrl === this.activeMerchantUrl) continue;
        try {
          const resp = await axios.post(
            `${merchantUrl}/api/products/search`,
            {
              query: constraints.query || constraints.instruction,
              filters,
              limit: 25,
            },
            { timeout: 8000 }
          );
          const peerResults = resp.data.results || [];
          if (peerResults.length > 0) {
            searchResults = peerResults;
            this.activeMerchantUrl = merchantUrl;
            console.log(chalk.cyan(`  [Federation] Found ${peerResults.length} matching products on federated merchant: ${merchantUrl}`));
            break;
          }
        } catch (err) {}
      }
    }

    const allExcluded = [...this.excludedProductIds, ...excludeIds];
    const unexcluded = searchResults.filter((p) => !allExcluded.includes(p.id));
    return unexcluded.filter((p) => checkHardConstraints(p, constraints).passes);
  }

  async selectBestProduct(products, constraints) {
    if (products.length === 0) return null;

    try {
      const productList = products.slice(0, 15).map((p, i) => ({
        index: i,
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price?.display || `₹${p.price_paise / 100}`,
        price_paise: p.price_paise,
        sizes: p.sizes,
        colors: p.colors,
        tags: p.tags,
      }));

      const selection = await chatJSON([
        {
          role: 'system',
          content: `You are an expert e-commerce buyer assistant.
Evaluate all candidates and select the single best matching product for the user's requirements.

CRITICAL SELECTION RULES:
1. BUDGET & VALUE:
   - When user sets a budget (e.g. under ₹1,500), pick the highest-quality product that fits strictly within that price limit.
   - Respect user-provided preferences (brand, color, size).
2. REASONING:
   - Provide a 1-2 sentence concise explanation of why this product was chosen.

Return JSON format:
{
  "matches_found": true,
  "selected_index": number,
  "reasoning": string
}`,
        },
        {
          role: 'user',
          content: `User wants: "${constraints.instruction}"
Budget: ${constraints.budget_max_paise ? '₹' + constraints.budget_max_paise / 100 : 'flexible'}
User options: ${JSON.stringify(constraints.user_provided_options || {})}
Candidates:
${JSON.stringify(productList, null, 2)}`,
        },
      ]);

      if (selection.matches_found === false) return null;
      if (selection.selected_index >= 0 && selection.selected_index < products.length) {
        const best = products[selection.selected_index];
        best._selectionReasoning = selection.reasoning;
        return best;
      }

      return products[0];
    } catch (e) {
      return products[0];
    }
  }

  async checkStock(productId) {
    const resp = await retryWithBackoff(
      () => axios.get(`${this.activeMerchantUrl}/api/products/${productId}/stock`, { timeout: 10000 }),
      3,
      500,
      `Stock check for ${productId} on ${this.activeMerchantUrl}`
    );
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
      name: userProfile?.name || 'Customer',
      email: userProfile?.email || 'customer@catalogx.ai',
      phone: userProfile?.phone || '',
    };

    const shipping_address = {
      street: userProfile?.delivery_address?.street || userProfile?.street || '',
      city: userProfile?.delivery_address?.city || userProfile?.city || '',
      state: userProfile?.delivery_address?.state || userProfile?.state || '',
      postal_code: userProfile?.delivery_address?.postal_code || userProfile?.delivery_address?.postalCode || userProfile?.postal_code || userProfile?.postalCode || '',
      country: userProfile?.delivery_address?.country || userProfile?.country || 'India',
    };

    const resp = await retryWithBackoff(
      () =>
        axios.post(
          `${this.activeMerchantUrl}/api/orders`,
          {
            product_id: product.id,
            size: constraints.required_size || constraints.user_provided_options?.size || (product.sizes && product.sizes[0]) || null,
            color: constraints.preferred_color || constraints.user_provided_options?.color || (product.colors && product.colors[0]) || null,
            quantity: 1,
            customer,
            shipping_address,
            buyer_agent_id: this.agentId,
            session_id: this.sessionId,
            human_instruction: constraints.instruction,
            selected_options: constraints.user_provided_options || {},
            apply_offer: !!constraints.apply_offer,
            offer_id: constraints.offer_id || (product.offers && product.offers[0]?.id) || null,
          },
          { timeout: 15000 }
        ),
      3,
      600,
      `Order creation on ${this.activeMerchantUrl}`
    );
    return resp.data;
  }

  async executePaymentWithRetry(razorpayOrderId) {
    const attempt = async () => {
      const resp = await axios.post(
        `${this.activeMerchantUrl}/api/payments/simulate`,
        {
          razorpay_order_id: razorpayOrderId,
          session_id: this.sessionId,
        },
        { timeout: 10000 }
      );
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
    console.log(chalk.white(`  User    : ${this.userId}`));
    console.log(chalk.white(`  Agent   : ${this.agentId}`));
    console.log(chalk.white(`  Merchant: Federated Routing (Ports 3001/3002)`));
    console.log(chalk.blue(divider));
    console.log(chalk.bold(`\n  🎯 Goal: "${instruction}"\n`));
  }
}

module.exports = { BuyerAgent };
