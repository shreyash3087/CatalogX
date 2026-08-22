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
function determineTier(amountPaise, constraints = {}) {
  const budget = constraints.budget_max_paise || NOTIFY_THRESHOLD;
  const autoThreshold = Math.min(AUTO_APPROVE_THRESHOLD, budget);

  if (amountPaise <= autoThreshold) {
    return {
      tier: 'AUTO',
      label: '🟢 AUTO-APPROVED',
      description: `₹${(amountPaise / 100).toFixed(2)} is within auto-approve limit (₹${(autoThreshold / 100).toFixed(2)})`,
    };
  }

  if (amountPaise <= budget) {
    return {
      tier: 'NOTIFY',
      label: '🟡 NOTIFYING',
      description: `₹${(amountPaise / 100).toFixed(2)} is within budget but above auto-approve. Proceeding in 5 seconds...`,
    };
  }

  if (amountPaise <= CONFIRM_THRESHOLD) {
    return {
      tier: 'CONFIRM',
      label: '🟠 REQUIRES CONFIRMATION',
      description: `₹${(amountPaise / 100).toFixed(2)} exceeds the stated budget (₹${(budget / 100).toFixed(2)}). Human approval required.`,
    };
  }

  return {
    tier: 'REJECT',
    label: '🔴 REJECTED',
    description: `₹${(amountPaise / 100).toFixed(2)} exceeds the maximum allowed spend (₹${(CONFIRM_THRESHOLD / 100).toFixed(2)}). Purchase refused.`,
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
    budget: constraints.budget_max_paise ? `₹${(constraints.budget_max_paise / 100).toFixed(2)}` : 'not set',
    confirm_threshold: `₹${(CONFIRM_THRESHOLD / 100).toFixed(2)}`,
  };

  if (gate.tier === 'AUTO') {
    console.log(chalk.green(`  ${gate.label}: ${gate.description}`));
    await auditFn('GATE_CHECKED', gateInfo, { approved: true }, gate.description);
    return { approved: true, tier: gate.tier, reasoning: gate.description };
  }

  if (gate.tier === 'NOTIFY') {
    console.log(chalk.yellow(`\n  ${gate.label}`));
    console.log(chalk.yellow(`  ${gate.description}`));
    console.log(chalk.yellow('  Proceeding in 5 seconds... (Ctrl+C to cancel)\n'));
    await auditFn('GATE_CHECKED', gateInfo, { approved: true, delay: '5s' }, gate.description);
    await sleep(5000);
    return { approved: true, tier: gate.tier, reasoning: gate.description };
  }

  if (gate.tier === 'CONFIRM') {
    console.log(chalk.red(`\n  ${gate.label}`));
    console.log(chalk.red(`  ${gate.description}`));
    console.log(chalk.red(`  Product: ${product.name} — ${product.price.display}`));

    const answer = await promptUser(
      chalk.bold.yellow('\n  Type "yes" to approve or anything else to cancel: ')
    );

    const approved = answer.trim().toLowerCase() === 'yes';
    await auditFn(
      'GATE_CHECKED',
      { ...gateInfo, human_response: answer },
      { approved },
      approved ? 'Human approved the purchase' : 'Human rejected the purchase'
    );

    if (!approved) {
      console.log(chalk.red('  ❌ Purchase cancelled by human.'));
    }

    return { approved, tier: gate.tier, reasoning: gate.description };
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
