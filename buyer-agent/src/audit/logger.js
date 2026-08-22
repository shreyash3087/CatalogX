'use strict';

/**
 * CatalogX — Structured Audit Logger
 * =====================================
 * Every agent decision gets logged with:
 *   - What action was taken
 *   - What the input was
 *   - What the output was
 *   - Why (human-readable reasoning)
 *   - How long it took
 *
 * Logs are written to: ./logs/<session_id>.json
 * Also sent to merchant server for real-time dashboard broadcast.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const axios = require('axios');

const MERCHANT_URL = process.env.MERCHANT_SERVER_URL || 'http://localhost:3001';
const LOGS_DIR = path.resolve(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

class AuditLogger {
  constructor(sessionId, agentId) {
    this.sessionId = sessionId;
    this.agentId = agentId;
    this.stepCount = 0;
    this.entries = [];
    this.startTime = Date.now();
    this.logFile = path.join(LOGS_DIR, `${sessionId}.json`);
  }

  /**
   * Log a single agent step.
   * @param {string} action - e.g. 'CATALOG_DISCOVERED', 'PRODUCT_SELECTED'
   * @param {object} input - What triggered this action
   * @param {object} output - What resulted
   * @param {string} reasoning - Human-readable explanation
   * @returns {Promise<object>} - The audit entry
   */
  async log(action, input = null, output = null, reasoning = '') {
    this.stepCount += 1;
    const startMs = Date.now();

    const entry = {
      id: uuidv4(),
      session_id: this.sessionId,
      agent_id: this.agentId,
      step: this.stepCount,
      action,
      input_data: input,
      output_data: output,
      reasoning,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startMs,
    };

    this.entries.push(entry);

    // Write to local file
    fs.writeFileSync(this.logFile, JSON.stringify(this.entries, null, 2));

    // Notify merchant server (non-blocking)
    try {
      await axios.post(`${MERCHANT_URL}/api/audit/agent`, {
        ...entry,
        merchant_id: 'merchant_urbanstride_001',
      }, { timeout: 2000 }).catch(() => {}); // Fire-and-forget, don't block agent
    } catch (_) {}

    // Terminal output
    const actionColor = this._actionColor(action);
    console.log(actionColor(`  [${String(this.stepCount).padStart(2, '0')}] ${action}`));
    if (reasoning) {
      console.log(chalk.gray(`       ${reasoning.slice(0, 120)}${reasoning.length > 120 ? '...' : ''}`));
    }

    return entry;
  }

  /**
   * Generate the full session summary.
   * @returns {object}
   */
  getSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    return {
      session_id: this.sessionId,
      agent_id: this.agentId,
      total_steps: this.stepCount,
      duration_seconds: duration,
      entries: this.entries,
      log_file: this.logFile,
    };
  }

  _actionColor(action) {
    if (action.includes('FAIL') || action.includes('REJECT') || action.includes('OUT'))
      return chalk.red;
    if (action.includes('RETRY') || action.includes('FALLBACK') || action.includes('NOTIFY'))
      return chalk.yellow;
    if (action.includes('VERIFIED') || action.includes('SUCCESS') || action.includes('PAID'))
      return chalk.green;
    return chalk.cyan;
  }
}

module.exports = { AuditLogger };
