'use strict';

/**
 * CatalogX — Structured Audit Logger
 * =====================================
 * Every agent decision gets logged with:
 *   - What action was taken
 *   - What the input was
 *   - What the output was
 *   - Why (human-readable reasoning)
 *   - Multi-tenant persistence to MongoDB Atlas (`catalogx_db.chat_sessions`)
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');
const { appendEvent } = require('../db/sessionStore');

const LOGS_DIR = path.resolve(__dirname, '../../logs');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

class AuditLogger {
  constructor(sessionId, agentId, userId = null) {
    this.sessionId = sessionId;
    this.agentId = agentId;
    this.userId = userId || process.env.CATALOGX_USER_ID || 'user_shreyash_001';
    this.stepCount = 0;
    this.entries = [];
    this.startTime = Date.now();
    this.logFile = path.join(LOGS_DIR, `${sessionId}.json`);
  }

  /**
   * Log a single agent step.
   * @param {string} action - e.g. 'CATALOG_DISCOVERED', 'PRODUCT_SELECTED', 'GATE_CHECKED'
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
      user_id: this.userId,
      step: this.stepCount,
      action,
      input_data: input,
      output_data: output,
      reasoning,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startMs,
    };

    this.entries.push(entry);

    // 1. Persist to MongoDB Atlas `catalogx_db.chat_sessions`
    try {
      await appendEvent(this.userId, this.sessionId, {
        action,
        input_data: input,
        output_data: output,
        reasoning,
        agentId: this.agentId,
      });
    } catch (_) {}

    // 2. Write to local file as secondary fallback
    try {
      fs.writeFileSync(this.logFile, JSON.stringify(this.entries, null, 2));
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
      user_id: this.userId,
      total_steps: this.stepCount,
      duration_seconds: duration,
      entries: this.entries,
      log_file: this.logFile,
    };
  }

  _actionColor(action) {
    if (action.includes('FAIL') || action.includes('REJECT') || action.includes('OUT') || action.includes('ERROR'))
      return chalk.red;
    if (action.includes('RETRY') || action.includes('FALLBACK') || action.includes('CLARIFICATION') || action.includes('QUESTION'))
      return chalk.yellow;
    if (action.includes('VERIFIED') || action.includes('SUCCESS') || action.includes('PAID') || action.includes('COMPLETED') || action.includes('SELECTED'))
      return chalk.green;
    return chalk.cyan;
  }
}

module.exports = { AuditLogger };
