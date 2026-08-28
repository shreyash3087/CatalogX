'use strict';

/**
 * CatalogX — Intent & Constraint Engine
 * =====================================
 * Intelligent natural-language understanding that accurately classifies
 * user intents (shopping vs conversational/out-of-context), retains session
 * memory via previous_response_id (Responses API), asks minimum essential
 * clarification questions (e.g. shoe size), and extracts structured constraints.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { chatJSON } = require('../../../llm/index');

/**
 * Parse a human instruction into intent and structured constraints.
 * @param {string} instruction - e.g. "Buy me running shoes under ₹2100" or "How are you?"
 * @param {object} options - Optional: previous_response_id
 * @returns {Promise<object>} - Parsed intent, constraints, clarification flags, and new response_id
 */
async function parseInstruction(instruction, options = {}) {
  const prevResponseId = options.previous_response_id || options.prev_response_id || null;

  const result = await chatJSON(
    [
      {
        role: 'system',
        content: `You are the AI brain of CatalogX — an autonomous commerce buyer agent powered by Razorpay.
Analyze the user's message in the context of the conversation history and determine whether it is a "shopping" request or a "conversational" / out-of-context query.

Return a JSON object with this EXACT schema:
{
  "intent": "shopping" | "conversational",
  
  // IF intent is "conversational" (greetings, pleasantries, follow-ups like "how are you doing", "what was my first question", "can you write a poem", "what is this", "tell me a joke"):
  "conversational_reply": string or null, // A natural, friendly response.
  
  // IF intent is "shopping" (searching, browsing, comparing, or buying products like shoes, sneakers, headphones, keyboards, etc.):
  "category": string or null,          // "running-shoes", "casual-sneakers", "hiking-boots", "audio", "wearables", "computing", or null
  "query": string or null,             // clean product keywords ONLY (e.g. "running shoes", "noise cancelling headphones", "nike sneakers"). NEVER include price, budget, or words like "under 3k", "below 5000" in this query string!
  "budget_max_paise": number or null,  // max price in paise (₹1 = 100 paise). null if no budget mentioned. E.g. "under 1500" -> 150000. "under 2100" -> 210000. "under 30k" -> 3000000.
  "budget_min_paise": number or null,  // min price in paise.
  "required_size": string or null,     // e.g. "7", "8", "9", "10", "11", null
  "preferred_color": string or null,   // e.g. "black", "white", null
  "preferred_brand": string or null,   // e.g. "Nike", "Adidas", "Sony", null
  "other_preferences": string[],       // e.g. ["waterproof", "lightweight", "flagship"]
  "urgency": "low" | "normal" | "high",
  "needs_clarification": boolean,      // true if an essential detail (like shoe size for footwear) is missing and MUST be clarified to complete an order accurately.
  "clarification_question": string or null, // Concise question to ask the user. E.g. "What shoe size (e.g., UK 7, 8, 9, 10, 11) would you prefer? I'll check live inventory for you."
  "reasoning": string                  // brief explanation of how you classified and parsed this message
}

CRITICAL CONVERSATIONAL & MEMORY RULES:
1. NATURAL CONVERSATION & AVOID REPETITION:
   - Do NOT introduce yourself or repeat "I'm CatalogX, your autonomous shopping assistant powered by Razorpay..." in every single prompt!
   - Only introduce yourself in the initial greeting if not done yet. In ongoing conversation, speak naturally and concisely like a friendly, intelligent human shopping assistant.
   - If the user asks follow-up questions (e.g., "what was my first question?", "how are you today?", "can you do this?"), use the conversation history to answer them accurately and directly.
2. MINIMUM QUESTIONS / SIZING CLARIFICATION RULE:
   - For footwear (shoes, sneakers, running shoes, boots): shoe size is essential to complete an order. If the user has NOT provided a size in this message or previous conversation context, set "needs_clarification": true and ask: "What shoe size (e.g., UK 7, 8, 9, 10, 11) would you prefer? I'll find the best pair in stock for you."
   - If the user ALREADY provided a size (e.g. "size 9", "9", "UK 8"), set "needs_clarification": false and extract "required_size".
   - For electronics, audio, or computing (headphones, keyboards, watches, cables), "needs_clarification" is false because sizes are not required.
   - Do NOT ask too many questions. Stick to minimum essential questions only when critical for order accuracy.
3. SHOPPING CATEGORY & QUERY RULES:
   - If user says generic "shoes", "sneakers", "footwear", set category: null so all shoe types are searched.
   - Strip all price mentions like "under 3k", "below 3000", "for 1500", "under 2100" from the query.
4. BUDGET CONVERSION:
   - Convert 'k' notation: "1.5k" or "1500" = ₹1,500 = 150000 paise. "2100" = ₹2,100 = 210000 paise. "30k" = ₹30,000 = 3000000 paise.`,
      },
      {
        role: 'user',
        content: instruction,
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

  // Clean query of any residual budget phrases for shopping
  let cleanQuery = (result.query || '')
    .replace(/\b(under|below|less than|within|around|budget)\s*(rs\.?|inr|₹)?\s*\d+\s*(k|lakh)?\b/gi, '')
    .replace(/\b(rs\.?|inr|₹)\s*\d+\b/gi, '')
    .trim();

  if (!cleanQuery) {
    cleanQuery = instruction
      .replace(/\b(buy|order|purchase|get|find|me|a|some|pair|of)\b/gi, '')
      .replace(/\b(under|below|less than|within|around|budget)\s*(rs\.?|inr|₹)?\s*\d+\s*(k|lakh)?\b/gi, '')
      .replace(/\b(rs\.?|inr|₹)\s*\d+\b/gi, '')
      .trim();
  }

  let category = result.category;
  if (category === 'shoes' || category === 'sneakers' || category === 'footwear') {
    category = null;
  }

  return {
    instruction,
    intent: 'shopping',
    ...result,
    category,
    query: cleanQuery || 'footwear',
    budget_max_paise: result.budget_max_paise ? parseInt(result.budget_max_paise) : null,
    budget_min_paise: result.budget_min_paise ? parseInt(result.budget_min_paise) : null,
    needs_clarification: !!result.needs_clarification,
    clarification_question: result.clarification_question || null,
    reasoning: result.reasoning || `Parsed shopping query for "${cleanQuery || 'items'}".`,
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

  if (constraints.budget_max_paise && product.price.paise > constraints.budget_max_paise) {
    reasons.push(`Price ${product.price.display} exceeds budget ₹${constraints.budget_max_paise / 100}`);
  }

  if (constraints.required_size) {
    const available = product.sizes || [];
    if (!available.includes(constraints.required_size)) {
      reasons.push(`Size ${constraints.required_size} not available (available: ${available.join(', ')})`);
    }
  }

  if (!product.in_stock) {
    reasons.push('Product is out of stock');
  }

  return { passes: reasons.length === 0, reasons };
}

module.exports = { parseInstruction, buildSearchFilters, checkHardConstraints };
