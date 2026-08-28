'use strict';

/**
 * CatalogX — Merchant Server Entry Point
 * ========================================
 * UrbanStride Footwear — Agent-readable merchant catalog
 *
 * Endpoints:
 *   GET  /.well-known/agent-catalog    — Machine-readable catalog manifest
 *   POST /api/products/search          — Semantic product search
 *   GET  /api/products                 — List all products
 *   GET  /api/products/:id             — Product detail (schema.org)
 *   GET  /api/products/:id/stock       — Real-time stock check
 *   POST /api/orders                   — Create order (Razorpay)
 *   GET  /api/orders/:id               — Order status
 *   POST /api/payments/verify          — Verify payment signature
 *   POST /api/payments/simulate        — TEST MODE: simulate payment
 *   GET  /api/payments/status/:id      — Payment status
 *   GET  /api/audit                    — Audit log
 *   GET  /health                       — Health check
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');

const { getDb } = require('./db/init');
const { seedProducts } = require('./db/seed');
const { initWebSocket, broadcast } = require('./services/auditBroadcast');

const discoveryRouter = require('./routes/discovery');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const paymentsRouter = require('./routes/payments');
const mandatesRouter = require('./routes/mandates');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
}));

// Webhook route needs raw body — mount BEFORE json parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (lightweight)
app.use((req, _res, next) => {
  if (!req.path.includes('/health')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// Serve merchant-specific storefront pages from their respective directory
const isElectronics = process.env.MERCHANT_CATEGORY === 'electronics' || String(PORT) === '3002';
const merchantDir = isElectronics ? 'techcart' : 'urbanstride';

console.log(`[Storefront] Serving ${isElectronics ? 'TechCart Electronics' : 'UrbanStride Footwear'} from /public/${merchantDir} on port ${PORT}`);
app.use(express.static(path.join(__dirname, `../public/${merchantDir}`)));

// Fallback to shared public root for shared assets (/assets/...)
app.use(express.static(path.join(__dirname, '../public')));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/', discoveryRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/mandates', mandatesRouter);

// ─── Audit log endpoint ─────────────────────────────────────────────────────
app.get('/api/audit', (req, res) => {
  try {
    const db = getDb();
    const { session_id, limit = 100 } = req.query;

    let query = 'SELECT * FROM audit_log';
    const params = [];

    if (session_id) {
      query += ' WHERE session_id = ?';
      params.push(session_id);
    }

    query += ` ORDER BY timestamp DESC LIMIT ${Math.min(parseInt(limit) || 100, 500)}`;

    const logs = db.prepare(query).all(...params);
    res.json({ logs: logs.reverse(), total: logs.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// ─── Agent pushes audit entries here (from buyer-agent) ─────────────────────
app.post('/api/audit/agent', (req, res) => {
  try {
    const db = getDb();
    const { id, session_id, step, action, input_data, output_data, reasoning, agent_id, merchant_id } = req.body;
    const { v4: uuidv4 } = require('uuid');

    db.prepare(`
      INSERT OR IGNORE INTO audit_log
        (id, session_id, step, action, input_data, output_data, reasoning, merchant_id, agent_id)
      VALUES
        (@id, @session_id, @step, @action, @input_data, @output_data, @reasoning, @merchant_id, @agent_id)
    `).run({
      id: id || uuidv4(),
      session_id: session_id || 'unknown',
      step: step || 0,
      action,
      input_data: typeof input_data === 'string' ? input_data : JSON.stringify(input_data),
      output_data: typeof output_data === 'string' ? output_data : JSON.stringify(output_data),
      reasoning: reasoning || null,
      merchant_id: merchant_id || process.env.MERCHANT_ID,
      agent_id: agent_id || null,
    });

    // Broadcast to dashboard
    broadcast({ ...req.body, type: action, timestamp: req.body.timestamp || new Date().toISOString() });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save audit entry', details: err.message });
  }
});

// ─── Trigger Buyer Agent Execution (Dashboard Integration) ───────────────────
app.post('/api/agent/run', async (req, res) => {
  const { instruction, sessionId, userProfile } = req.body;
  if (!instruction) {
    return res.status(400).json({ error: 'Instruction is required' });
  }

  res.json({ ok: true, status: 'started', sessionId });

  (async () => {
    try {
      if (userProfile) {
        process.env.CATALOGX_USER_PROFILE = JSON.stringify(userProfile);
      }
      const { BuyerAgent } = require('../../buyer-agent/src/agent/core');
      process.env.AGENT_SESSION_ID = sessionId;
      const agent = new BuyerAgent(sessionId);
      await agent.run(instruction);
    } catch (err) {
      console.error('[Agent Execution Error]:', err);
    }
  })();
});

// ─── Summarize Session Title with Small LLM Call ────────────────────────────
app.post('/api/agent/title', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.json({ title: 'New Chat' });
  }

  try {
    const { chat } = require('../../llm/index');
    const response = await chat(
      [
        {
          role: 'system',
          content:
            'Generate a short 2 to 4 word title summarizing this shopping request. Return ONLY the title with no punctuation and no quotes. Examples: "Running Shoes Search", "Wireless Earbuds", "Mechanical Keyboard".',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      { maxTokens: 12, temperature: 0.3 }
    );

    const cleanTitle = (response || '')
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/[.]+$/, '');

    res.json({ title: cleanTitle || message.slice(0, 24) });
  } catch (err) {
    console.error('[Title Summary Fallback]:', err.message);
    const fallback = message.slice(0, 24).trim();
    res.json({ title: fallback.charAt(0).toUpperCase() + fallback.slice(1) });
  }
});

// ─── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const db = getDb();
  const productCount = db.prepare('SELECT COUNT(*) as n FROM products').get().n;
  const orderCount = db.prepare('SELECT COUNT(*) as n FROM orders').get().n;

  res.json({
    status: 'ok',
    merchant: process.env.MERCHANT_NAME,
    merchant_id: process.env.MERCHANT_ID,
    mode: 'test',
    products: productCount,
    orders: orderCount,
    razorpay_configured: !!process.env.RAZORPAY_KEY_ID,
    llm_configured: !!process.env.AZURE_OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    hint: 'See /.well-known/agent-catalog for available endpoints',
  });
});

// ─── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ─── Startup ────────────────────────────────────────────────────────────────
async function start() {
  // Init DB and seed if needed
  getDb();
  seedProducts();

  // Attach WebSocket server
  initWebSocket(server);

  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║          CatalogX — Merchant Server                     ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Merchant: ${(process.env.MERCHANT_NAME || 'UrbanStride').padEnd(44)}║`);
    console.log(`║  HTTP:     http://localhost:${PORT}${' '.repeat(28)}║`);
    console.log(`║  Catalog:  http://localhost:${PORT}/.well-known/agent-catalog  ║`);
    console.log('║  Mode:     TEST (no real money)                         ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log('');

    broadcast({
      type: 'SERVER_STARTED',
      merchant: process.env.MERCHANT_NAME,
      port: PORT,
      timestamp: new Date().toISOString(),
    });
  });
}

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});

module.exports = { app, server };
