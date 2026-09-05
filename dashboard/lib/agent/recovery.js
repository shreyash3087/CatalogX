'use strict';

/**
 * CatalogX — Failure Recovery Engine
 * =====================================
 * Handles all failure scenarios gracefully:
 *   - Stock-out detected during search or order
 *   - Payment failure
 *   - Network / API errors
 *   - No products matching constraints
 */

'use strict';

const chalk = require('chalk');

/**
 * Handle a stock-out: re-run search excluding the failed product.
 * @param {object} params
 * @returns {Promise<object|null>} - Alternative product or null if none found
 */
async function handleStockOut({ failedProductId, searchFn, constraints, excludeIds = [], auditFn }) {
  const excluded = [...excludeIds, failedProductId];

  console.log(chalk.yellow(`\n  ⚠️  Stock-out detected for product ${failedProductId}`));
  console.log(chalk.yellow('  🔄 Searching for a fallback product...'));

  await auditFn('STOCK_OUT', { product_id: failedProductId, excluded }, null,
    `Product ${failedProductId} is out of stock. Searching for alternatives.`);

  // Re-search excluding all previously failed products
  const results = await searchFn(constraints, excluded);

  if (!results || results.length === 0) {
    console.log(chalk.red('  ❌ No alternative products found within constraints.'));
    await auditFn('FALLBACK_FAILED', { excluded }, null,
      'No alternative products available. Cannot complete purchase.');
    return null;
  }

  const fallback = results[0];
  console.log(chalk.green(`  ✅ Fallback found: ${fallback.name} (${fallback.price.display})`));
  await auditFn('FALLBACK_SELECTED', { fallback_id: fallback.id, fallback_name: fallback.name, excluded },
    { selected: fallback },
    `Falling back to "${fallback.name}" (${fallback.price.display}) — next best match.`);

  return fallback;
}

/**
 * Handle a payment failure with retry logic.
 * @param {object} params
 * @returns {Promise<object|null>} - Payment result or null if all retries fail
 */
async function handlePaymentFailure({ error, attemptFn, maxRetries = 3, auditFn, orderId }) {
  const retryable = isRetryableError(error);

  if (!retryable) {
    console.log(chalk.red(`\n  ❌ Payment failed (non-retryable): ${error.message || error}`));
    await auditFn('PAYMENT_FAILED', { order_id: orderId, error: error.message, retryable: false },
      null, `Payment failed with non-retryable error: ${error.message}`);
    return null;
  }

  console.log(chalk.yellow(`\n  ⚠️  Payment failed (retryable): ${error.message}`));

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const delay = attempt * 1500;
    console.log(chalk.yellow(`  🔄 Retry ${attempt}/${maxRetries} in ${delay}ms...`));
    await sleep(delay);

    try {
      const result = await attemptFn();
      console.log(chalk.green(`  ✅ Payment succeeded on retry ${attempt}`));
      await auditFn('PAYMENT_RETRY_SUCCESS', { attempt, order_id: orderId }, result,
        `Payment succeeded on retry attempt ${attempt}`);
      return result;
    } catch (retryErr) {
      console.log(chalk.yellow(`  Retry ${attempt} failed: ${retryErr.message}`));
      await auditFn('PAYMENT_RETRY_FAILED', { attempt, error: retryErr.message }, null,
        `Retry ${attempt} failed: ${retryErr.message}`);
    }
  }

  console.log(chalk.red(`  ❌ All ${maxRetries} payment retries exhausted.`));
  return null;
}

/**
 * Determine if an error is safe to retry.
 */
function isRetryableError(error) {
  const msg = (error.message || '').toLowerCase();
  const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND'];
  const retryableMessages = ['timeout', 'network', 'connection', 'retry', 'temporarily'];

  if (retryableCodes.some(code => msg.includes(code.toLowerCase()))) return true;
  if (retryableMessages.some(m => msg.includes(m))) return true;

  // Non-retryable: card declined, insufficient funds, invalid credentials
  const nonRetryable = ['signature', 'invalid', 'declined', 'insufficient', 'forbidden', '401', '400'];
  if (nonRetryable.some(m => msg.includes(m))) return false;

  return true; // Default: try retry
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { handleStockOut, handlePaymentFailure };
