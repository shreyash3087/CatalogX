'use strict';

/**
 * CatalogX — Human-Readable Purchase Report Generator
 */

const chalk = require('chalk');

/**
 * Generate and print the final purchase report.
 * @param {object} params
 */
function printReport({
  instruction,
  sessionId,
  status,
  selectedProduct,
  constraints,
  orderResult,
  paymentResult,
  gateTier,
  alternativesConsidered,
  failureReason,
  auditSummary,
}) {
  const divider = '═'.repeat(62);
  const thin = '─'.repeat(62);

  console.log('\n' + chalk.blue(divider));
  console.log(chalk.bold.blue('  CATALOGX — PURCHASE REPORT'));
  console.log(chalk.blue(divider));

  console.log(chalk.gray(`  Session : ${sessionId}`));
  console.log(chalk.gray(`  Steps   : ${auditSummary.total_steps}`));
  console.log(chalk.gray(`  Duration: ${auditSummary.duration_seconds}s`));
  console.log(chalk.blue(thin));

  console.log(chalk.white(`\n  📋 Instruction:`));
  console.log(chalk.italic(`     "${instruction}"\n`));

  if (status === 'completed') {
    console.log(chalk.green.bold('  ✅ Status: PURCHASE COMPLETED'));
    console.log('');
    console.log(chalk.white('  🛍️  Product:'));
    console.log(`     Name  : ${selectedProduct.name}`);
    console.log(`     Brand : ${selectedProduct.brand}`);
    console.log(`     Price : ${selectedProduct.price.display}`);
    if (selectedProduct._selectedSize) console.log(`     Size  : ${selectedProduct._selectedSize}`);
    if (selectedProduct._selectedColor) console.log(`     Color : ${selectedProduct._selectedColor}`);

    console.log('');
    console.log(chalk.white('  💳 Payment:'));
    console.log(`     Razorpay Order ID  : ${orderResult?.razorpay_order_id || 'N/A'}`);
    console.log(`     Razorpay Payment ID: ${paymentResult?.razorpay_payment_id || 'N/A'}`);
    console.log(`     Amount             : ₹${(orderResult?.amount?.paise / 100).toFixed(2) || 'N/A'}`);
    console.log(`     Gate Tier          : ${gateTier}`);

  } else {
    console.log(chalk.red.bold('  ❌ Status: PURCHASE FAILED'));
    if (failureReason) {
      console.log(chalk.red(`\n  Reason: ${failureReason}`));
    }
  }

  if (alternativesConsidered && alternativesConsidered.length > 0) {
    console.log('');
    console.log(chalk.white('  🔎 Alternatives Considered:'));
    alternativesConsidered.slice(0, 3).forEach((alt, i) => {
      const score = alt.relevance_score ? ` (score: ${alt.relevance_score})` : '';
      console.log(chalk.gray(`     ${i + 1}. ${alt.name} — ${alt.price.display}${score}`));
    });
  }

  console.log('');
  console.log(chalk.blue(thin));
  console.log(chalk.gray(`  Audit log saved to: ${auditSummary.log_file}`));
  console.log(chalk.gray(`  Dashboard: http://localhost:3000`));
  console.log(chalk.blue(divider));
  console.log('');
}

module.exports = { printReport };
