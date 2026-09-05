'use strict';

/**
 * CatalogX — Domain-Agnostic Intent & Constraint Engine
 * ========================================================
 * Universal Natural Language Understanding for Open Agentic Commerce (UAP/ACP).
 * Handles shopping requests, conversational queries, and explicit order confirmations / modifications.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { chatJSON } = require('../../../llm/index');

/**
 * Parse a human instruction into intent and structured constraints.
 * @param {string} instruction - e.g. "Buy me running shoes under 1500", "8 would work", "Place order", "Add socks and order"
 * @param {object} options - Optional: conversationHistory (array of messages/events), previous_response_id
 * @returns {Promise<object>} - Parsed intent, constraints, and reasoning
 */
async function parseInstruction(instruction, options = {}) {
  const prevResponseId = options.previous_response_id || options.prev_response_id || null;
  const history = Array.isArray(options.conversationHistory) ? options.conversationHistory : [];

  const historyContext = history.length > 0
    ? `\n\nCONVERSATION HISTORY:\n${history.map(m => `${m.role === 'user' || m.sender === 'human' ? 'User' : 'Agent'}: "${m.text || m.content}"`).join('\n')}`
    : '';

  const systemPrompt = `You are the AI brain of CatalogX — an open autonomous commerce buyer agent powered by Razorpay.
Analyze the user's message in the context of the conversation history and classify into one of three intents:

1. "order_confirmation": The user is confirming, approving, or placing the order for a previously recommended product.
   Examples: "Place order", "Yes, place the order", "Go ahead", "Buy it", "Looks good", "Proceed with order", "Add bundle and place order", "Add socks and place order".
   
2. "shopping": The user is searching, browsing, asking for options, providing a size/color, or asking for alternatives.
   Examples: "Buy me running shoes under 1500", "8 would work", "Show blue ones", "Do you have Adidas?", "Show other options", "Find wireless earbuds".

3. "conversational": General greetings, pleasantries, questions about the system, or off-topic messages.
   Examples: "Hello", "How does this work?", "Who are you?".

Return a JSON object with this EXACT schema:
{
  "intent": "shopping" | "order_confirmation" | "conversational",
  
  // IF intent is "conversational":
  "conversational_reply": string or null,
  
  // IF intent is "order_confirmation":
  "apply_offer": boolean,              // true if the user confirmed WITH a bundle/add-on offer (e.g. "Add bundle and place order", "Add socks and buy")
  "offer_id": string or null,          // specific offer id if mentioned or null
  
  // IF intent is "shopping" or "order_confirmation":
  "query": string or null,             // clean search keywords ONLY (e.g. "running shoes", "wireless earbuds"). NEVER include price phrases in this query!
  "category": string or null,          // broad category keyword or null
  "budget_max_paise": number or null,  // max budget in paise (₹1 = 100 paise). E.g. "under 1500" -> 150000.
  "budget_min_paise": number or null,  // min price in paise.
  "user_provided_options": {           // ANY specific product option mentioned
    "size": string or null,            // e.g. "8", "9", "M", "XL"
    "color": string or null,           // e.g. "black", "white", "blue"
    "brand": string or null,           // e.g. "Nike", "Adidas", "boAt", "Sony"
    "volume": string or null,
    "weight": string or null
  },
  "other_preferences": string[],       // e.g. ["lightweight", "cushioned"]
  "urgency": "low" | "normal" | "high",
  "reasoning": string                  // concise explanation of parsing
}

CRITICAL RULES & GROUNDING:
1. ORDER CONFIRMATION RECOGNITION:
   - If a product was already recommended in the conversation history and the user says "Place order", "Yes, go ahead", "Buy it", "Looks good", or clicks the place order button, set "intent": "order_confirmation".
   - If the user says "Add socks and place order" or "Add bundle and buy", set "intent": "order_confirmation" and "apply_offer": true.
2. MULTI-TURN CONTEXT RESOLUTION:
   - If user provides an option (e.g. "8 would work", "size 9", "black ones"), carry forward previous query and budget from history.
3. BUDGET CONVERSION:
   - ₹1 = 100 paise. Convert "1500" -> 150000. "2000" -> 200000.`;

  const userContent = `User Message: "${instruction}"${historyContext}`;

  const result = await chatJSON(
    [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userContent,
      },
    ],
    {
      previous_response_id: prevResponseId,
    }
  );

  const responseId = result.response_id || null;

  if (result.intent === 'conversational') {
    return {
      instruction,
      intent: 'conversational',
      conversational_reply:
        result.conversational_reply ||
        "I'm here and ready to help! What products are you looking to find or purchase today?",
      reasoning: result.reasoning || 'Conversational interaction answered.',
      response_id: responseId,
    };
  }

  // Clean query of any residual budget phrases
  let cleanQuery = (result.query || '')
    .replace(/\b(under|below|less than|within|around|budget)\s*(rs\.?|inr|₹)?\s*\d+\s*(k|lakh)?\b/gi, '')
    .replace(/\b(rs\.?|inr|₹)\s*\d+\b/gi, '')
    .trim();

  if (!cleanQuery) {
    cleanQuery = instruction
      .replace(/\b(buy|order|purchase|get|find|me|a|some|pair|of|place|confirm|yes)\b/gi, '')
      .replace(/\b(under|below|less than|within|around|budget)\s*(rs\.?|inr|₹)?\s*\d+\s*(k|lakh)?\b/gi, '')
      .replace(/\b(rs\.?|inr|₹)\s*\d+\b/gi, '')
      .trim();
  }

  // Normalize user-provided options
  const userOptions = result.user_provided_options || {};
  let size = userOptions.size ? String(userOptions.size).replace(/^(uk|us|eu)\s*/i, '').trim() : null;

  if (!size) {
    const sizeMatch = instruction.match(/\b(?:size|uk)?\s*([6-9]|1[0-2]|s|m|l|xl|xxl)\b/i);
    if (sizeMatch) {
      size = sizeMatch[1];
    }
  }

  return {
    instruction,
    intent: result.intent || 'shopping',
    apply_offer: !!result.apply_offer,
    offer_id: result.offer_id || null,
    query: cleanQuery || 'products',
    category: result.category || null,
    budget_max_paise: result.budget_max_paise ? parseInt(result.budget_max_paise) : null,
    budget_min_paise: result.budget_min_paise ? parseInt(result.budget_min_paise) : null,
    required_size: size,
    user_provided_options: {
      ...userOptions,
      size,
    },
    preferred_color: userOptions.color || null,
    preferred_brand: userOptions.brand || null,
    other_preferences: Array.isArray(result.other_preferences) ? result.other_preferences : [],
    urgency: result.urgency || 'normal',
    reasoning: result.reasoning || `Parsed intent ${result.intent}.`,
    response_id: responseId,
  };
}

/**
 * Build filter params for the merchant's search endpoint from constraints.
 * @param {object} constraints
 * @returns {object} - filters object for POST /api/products/search
 */
function buildSearchFilters(constraints) {
  const filters = { in_stock_only: true };

  if (constraints.category) filters.category = constraints.category;
  if (constraints.budget_max_paise) filters.max_price_paise = constraints.budget_max_paise;
  if (constraints.budget_min_paise) filters.min_price_paise = constraints.budget_min_paise;
  if (constraints.required_size) filters.size = constraints.required_size;
  if (constraints.preferred_color) filters.color = constraints.preferred_color;
  if (constraints.preferred_brand) filters.brand = constraints.preferred_brand;

  return filters;
}

/**
 * Check if a product satisfies the hard constraints.
 * @param {object} product - Product from catalog
 * @param {object} constraints - Parsed constraints
 * @returns {{ passes: boolean, reasons: string[] }}
 */
function checkHardConstraints(product, constraints) {
  const reasons = [];
  const pricePaise = product.price?.paise || product.price_paise || 0;

  if (constraints.budget_max_paise && pricePaise > constraints.budget_max_paise) {
    reasons.push(`Price ₹${pricePaise / 100} exceeds budget ₹${constraints.budget_max_paise / 100}`);
  }

  if (constraints.required_size && Array.isArray(product.sizes) && product.sizes.length > 0 && !product.sizes.includes('onesize')) {
    const available = product.sizes || [];
    const normalizedReq = String(constraints.required_size).replace(/^(uk|us|eu)\s*/i, '').trim();
    if (!available.includes(normalizedReq)) {
      reasons.push(`Size ${normalizedReq} not available (available: ${available.join(', ')})`);
    }
  }

  if (product.in_stock === false || (product.stock !== undefined && product.stock <= 0)) {
    reasons.push('Product is out of stock');
  }

  return { passes: reasons.length === 0, reasons };
}

module.exports = { parseInstruction, buildSearchFilters, checkHardConstraints };
