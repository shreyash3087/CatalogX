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

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/', discoveryRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);

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
