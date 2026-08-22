'use strict';

/**
 * CatalogX — Audit WebSocket Broadcaster
 * ========================================
 * Maintains a set of connected WebSocket clients and broadcasts
 * real-time agent events to all connected dashboard clients.
 *
 * Events are also persisted to the audit_log table via auditLog().
 */

const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');

let wss = null;
const clients = new Set();

/**
 * Initialize the WebSocket server on the given HTTP server instance.
 * @param {http.Server} httpServer
 */
function initWebSocket(httpServer) {
  wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws, req) => {
    clients.add(ws);
    console.log(`[WS] Client connected. Total: ${clients.size}`);

    // Send recent audit log on connection
    try {
      const db = getDb();
      const recent = db.prepare(
        'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 50'
      ).all();
      ws.send(JSON.stringify({ type: 'HISTORY', events: recent.reverse() }));
    } catch (e) {
      // DB may not be ready yet
    }

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected. Total: ${clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
      clients.delete(ws);
    });
  });

  console.log('[WS] WebSocket server attached to HTTP server');
}

/**
 * Broadcast an event to all connected WebSocket clients.
 * @param {object} event
 */
function broadcast(event) {
  const payload = JSON.stringify(event);

  // Persist to audit log
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (id, session_id, step, action, input_data, output_data, reasoning, merchant_id, agent_id)
      VALUES (@id, @session_id, @step, @action, @input_data, @output_data, @reasoning, @merchant_id, @agent_id)
    `).run({
      id: uuidv4(),
      session_id: event.session_id || 'system',
      step: 0,
      action: event.type,
      input_data: JSON.stringify(event),
      output_data: null,
      reasoning: event.reasoning || null,
      merchant_id: process.env.MERCHANT_ID || 'merchant_urbanstride_001',
      agent_id: event.agent_id || null,
    });
  } catch (e) {
    // Non-critical — don't let DB errors break payment flows
  }

  // Broadcast to all connected clients
  for (const client of clients) {
    if (client.readyState === 1 /* OPEN */) {
      try {
        client.send(payload);
      } catch (e) {
        clients.delete(client);
      }
    }
  }
}

/**
 * Get the number of connected clients (for health checks).
 */
function getClientCount() {
  return clients.size;
}

module.exports = { initWebSocket, broadcast, getClientCount };
