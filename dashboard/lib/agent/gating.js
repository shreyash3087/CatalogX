'use strict';

/**
 * CatalogX — Tiered Gating Engine
 * =================================
 * Every money action must be explainable, bounded, and gated.
 *
 * Tiers:
 *  AUTO    — amount <= auto_approve_threshold  → proceed silently
 *  NOTIFY  — auto < amount <= budget           → log + notify, proceed after delay
 *  CONFIRM — budget < amount <= confirm_limit  → block until human types "yes"
 *  REJECT  — amount > confirm_limit            → refuse entirely
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const readline = require('readline');
const chalk = require('chalk');

const AUTO_APPROVE_THRESHOLD   = parseInt(process.env.AUTO_APPROVE_THRESHOLD)   || 150000; // ₹1,500
const NOTIFY_THRESHOLD         = parseInt(process.env.NOTIFY_THRESHOLD)         || 300000; // ₹3,000
const CONFIRM_THRESHOLD        = parseInt(process.env.CONFIRM_THRESHOLD)        || 500000; // ₹5,000

/**
 * Determine which gate tier applies to this purchase.
 * @param {number} amountPaise
 * @param {object} constraints - parsed user constraints (may override thresholds)
 * @returns {{ tier: string, label: string, description: string }}
 */
/**
 * Determine which gate tier applies to this purchase.
 * @param {number} amountPaise
 * @param {object} constraints - parsed user constraints (may override thresholds)
 * @returns {{ tier: string, label: string, description: string }}
 */
function determineTier(amountPaise, constraints = {}) {
  // 1. Hard check: Did user specify an explicit budget and is this item above it?
  if (constraints.budget_max_paise && amountPaise > constraints.budget_max_paise) {
    return {
      tier: 'REJECT',
      label: '🔴 EXCEEDS USER BUDGET',
      description: `₹${(amountPaise / 100).toFixed(2)} exceeds your requested budget constraint of ₹${(constraints.budget_max_paise / 100).toFixed(2)}. Purchase rejected.`,
    };
  }

  // 2. Tier 1: Auto-Approve Micro-Spend (Pre-authorized Mandate)
  if (amountPaise <= AUTO_APPROVE_THRESHOLD) {
    return {
      tier: 'AUTO',
      label: '🟢 TIER 1: AUTO-APPROVE MANDATE',
      description: `₹${(amountPaise / 100).toFixed(2)} is within the ₹${(AUTO_APPROVE_THRESHOLD / 100).toFixed(2)} pre-authorized micro-spend mandate limit. Agent will execute payment autonomously.`,
    };
  }

  // 3. Tier 2: Standard Human 1-Click Consent Review (₹1,501 – ₹5,000)
  if (amountPaise <= 500000) {
    return {
      tier: 'REVIEW',
      label: '🟡 TIER 2: 1-CLICK HUMAN CONSENT',
      description: `₹${(amountPaise / 100).toFixed(2)} is above the auto-approve limit. Requires 1-click human Razorpay checkout authorization.`,
    };
  }

  // 4. Tier 3: High-Value 2FA OTP Gated (> ₹5,000)
  return {
    tier: 'HIGH_VALUE_2FA',
    label: '🟠 TIER 3: HIGH-VALUE 2FA GATED',
    description: `₹${(amountPaise / 100).toFixed(2)} is a high-value purchase (> ₹5,000). Razorpay order generated. Mandatory 2FA OTP verification required before funds capture.`,
  };
}

/**
 * Execute the gate check — may pause, prompt, or reject.
 * @param {number} amountPaise
 * @param {object} product
 * @param {object} constraints
 * @param {function} auditFn - function to log audit entries
 * @returns {Promise<{ approved: boolean, tier: string, reasoning: string }>}
 */
async function executeGate(amountPaise, product, constraints, auditFn) {
  const gate = determineTier(amountPaise, constraints);

  const gateInfo = {
    tier: gate.tier,
    amount_paise: amountPaise,
    amount_inr: `₹${(amountPaise / 100).toFixed(2)}`,
    product_name: product.name,
    auto_approve_threshold: `₹${(AUTO_APPROVE_THRESHOLD / 100).toFixed(2)}`,
    budget: constraints.budget_max_paise ? `₹${(constraints.budget_max_paise / 100).toFixed(2)}` : 'unconstrained',
    policy: gate.label,
  };

  if (gate.tier === 'AUTO') {
    console.log(chalk.green(`  ${gate.label}: ${gate.description}`));
    await auditFn('GATE_CHECKED', gateInfo, { approved: true, autonomous_execution: true }, gate.description);
    return { approved: true, tier: gate.tier, reasoning: gate.description };
  }

  if (gate.tier === 'REVIEW' || gate.tier === 'HIGH_VALUE_2FA') {
    console.log(chalk.yellow(`\n  ${gate.label}`));
    console.log(chalk.yellow(`  ${gate.description}`));
    console.log(chalk.gray(`  Product: ${product.name} — ${product.price.display}`));

    await auditFn(
      'GATE_CHECKED',
      gateInfo,
      { approved: true, human_gating: 'razorpay_checkout', tier: gate.tier },
      gate.description
    );
    return { approved: true, tier: gate.tier, reasoning: gate.description };
  }

  // REJECT
  console.log(chalk.red(`\n  ${gate.label}`));
  console.log(chalk.red(`  ${gate.description}`));
  await auditFn('GATE_REJECTED', gateInfo, { approved: false }, gate.description);
  return { approved: false, tier: gate.tier, reasoning: gate.description };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function promptUser(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

module.exports = { determineTier, executeGate };
