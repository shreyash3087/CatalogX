'use strict';

/**
 * CatalogX — Constraint Engine
 * =============================
 * Parses a natural-language instruction into structured constraints
 * using the LLM, and provides constraint-checking utilities.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { chatJSON } = require('../../../llm/index');

/**
 * Parse a human's natural-language instruction into structured constraints.
 * @param {string} instruction - e.g. "Buy me running shoes, size 9, under ₹3000"
 * @returns {Promise<object>} - Parsed constraints
 */
async function parseInstruction(instruction) {
  const result = await chatJSON([
    {
      role: 'system',
      content: `You are a shopping intent parser. Extract structured constraints from a user's shopping instruction.
Return a JSON object with these fields:
{
  "intent": "buy",
  "category": string or null,  // e.g. "running-shoes", "casual-sneakers", "hiking-boots", "electronics", or null
  "query": string,             // clean search query for the catalog (e.g. "running shoes lightweight")
  "budget_max_paise": number or null,  // max price in paise (₹1 = 100 paise). null if no budget mentioned
  "budget_min_paise": number or null,  // min price in paise. null if no min
  "required_size": string or null,     // e.g. "9", "10", null
  "preferred_color": string or null,   // e.g. "black", "white", null
  "preferred_brand": string or null,   // e.g. "Nike", "Adidas", null
  "other_preferences": string[],       // e.g. ["waterproof", "lightweight"]
  "urgency": "low" | "normal" | "high",
  "reasoning": string                  // brief explanation of how you parsed this
}

Category values must be one of: "running-shoes", "casual-sneakers", "hiking-boots", "electronics", or null.
Convert rupee amounts to paise (multiply by 100). E.g. ₹3000 → 300000 paise.`,
    },
    {
      role: 'user',
      content: instruction,
    },
  ]);

  return {
    instruction,
    ...result,
    // Ensure numeric fields are numbers
    budget_max_paise: result.budget_max_paise ? parseInt(result.budget_max_paise) : null,
    budget_min_paise: result.budget_min_paise ? parseInt(result.budget_min_paise) : null,
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
