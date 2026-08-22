'use strict';

/**
 * CatalogX — Payments Route
 * ==========================
 * POST /api/payments/verify    — Verify Razorpay payment signature
 * POST /api/payments/simulate  — TEST MODE: simulate a payment capture
 * GET  /api/payments/status/:orderId — Check payment status
 */

const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getDb } = require('../db/init');
const { broadcast } = require('../services/auditBroadcast');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── POST /api/payments/verify ─────────────────────────────────────────────
router.post('/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
      });
    }

    // Verify signature (HMAC-SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      broadcast({
        type: 'PAYMENT_SIGNATURE_MISMATCH',
        razorpay_order_id,
        razorpay_payment_id,
        timestamp: new Date().toISOString(),
      });

      return res.status(400).json({
        error: 'Payment signature verification failed',
        code: 'SIGNATURE_MISMATCH',
        razorpay_order_id,
      });
    }

    // Update order in DB
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE razorpay_order_id = ?')
      .get(razorpay_order_id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found for this Razorpay order ID' });
    }

    // Decrement stock
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
      .run(order.quantity, order.product_id);

    // Mark order as paid
    db.prepare(`
      UPDATE orders SET
        status = 'paid',
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        updated_at = datetime('now')
      WHERE razorpay_order_id = ?
    `).run(razorpay_payment_id, razorpay_signature, razorpay_order_id);

    // Broadcast success
    broadcast({
      type: 'PAYMENT_VERIFIED',
      session_id: order.session_id,
      order_id: order.id,
      razorpay_order_id,
      razorpay_payment_id,
      product_name: order.product_name,
      amount_paise: order.amount_paise,
      amount_inr: (order.amount_paise / 100).toFixed(2),
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Payment verified and order marked as paid',
      order_id: order.id,
      razorpay_order_id,
      razorpay_payment_id,
      product: order.product_name,
      amount_inr: (order.amount_paise / 100).toFixed(2),
      status: 'paid',
    });
  } catch (err) {
    console.error('[Payments] Verify error:', err);
    res.status(500).json({ error: 'Payment verification failed', details: err.message });
  }
});

// ─── POST /api/payments/simulate ───────────────────────────────────────────
// TEST MODE ONLY — simulates payment without Razorpay modal
// This allows the buyer agent to complete a fully server-side purchase flow
router.post('/simulate', async (req, res) => {
  if (!process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')) {
    return res.status(403).json({
      error: 'Simulate endpoint is only available in test mode',
    });
  }

  try {
    const { razorpay_order_id, session_id } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ error: 'razorpay_order_id is required' });
    }

    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE razorpay_order_id = ?')
      .get(razorpay_order_id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'paid') {
      return res.status(409).json({ error: 'Order already paid', order_id: order.id });
    }

    // Broadcast initiation
    broadcast({
      type: 'PAYMENT_INITIATED',
      session_id: session_id || order.session_id,
      razorpay_order_id,
      amount_paise: order.amount_paise,
      amount_inr: (order.amount_paise / 100).toFixed(2),
      timestamp: new Date().toISOString(),
    });

    // Use Razorpay test payment API to create a payment
    // In test mode, we can fetch the order and mark it — using their test payment approach
    // We generate a fake payment_id and valid signature for the simulation
    const simulatedPaymentId = `pay_test_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${simulatedPaymentId}`)
      .digest('hex');

    // Decrement stock
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?')
      .run(order.quantity, order.product_id);

    // Mark as paid
    db.prepare(`
      UPDATE orders SET
        status = 'paid',
        razorpay_payment_id = ?,
        razorpay_signature = ?,
        updated_at = datetime('now')
      WHERE razorpay_order_id = ?
    `).run(simulatedPaymentId, validSignature, razorpay_order_id);

    // Broadcast success
    broadcast({
      type: 'PAYMENT_CAPTURED',
      session_id: session_id || order.session_id,
      order_id: order.id,
      razorpay_order_id,
      razorpay_payment_id: simulatedPaymentId,
      product_name: order.product_name,
      amount_paise: order.amount_paise,
      amount_inr: (order.amount_paise / 100).toFixed(2),
      simulated: true,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      simulated: true,
      message: 'Payment simulated successfully (test mode)',
      order_id: order.id,
      razorpay_order_id,
      razorpay_payment_id: simulatedPaymentId,
      razorpay_signature: validSignature,
      product: order.product_name,
      amount_inr: (order.amount_paise / 100).toFixed(2),
      status: 'paid',
      note: 'This is a simulated payment. No real money was charged.',
    });
  } catch (err) {
    console.error('[Payments] Simulate error:', err);

    broadcast({
      type: 'PAYMENT_FAILED',
      razorpay_order_id: req.body?.razorpay_order_id,
      error: err.message,
      timestamp: new Date().toISOString(),
    });

    res.status(500).json({
      error: 'Payment simulation failed',
      details: err.message,
      code: 'PAYMENT_FAILED',
    });
  }
});

// ─── GET /api/payments/status/:orderId ─────────────────────────────────────
router.get('/status/:orderId', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare(
      'SELECT id, razorpay_order_id, razorpay_payment_id, status, amount_paise, product_name FROM orders WHERE id = ? OR razorpay_order_id = ?'
    ).get(req.params.orderId, req.params.orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({
      order_id: order.id,
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      status: order.status,
      amount_inr: (order.amount_paise / 100).toFixed(2),
      product: order.product_name,
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed', details: err.message });
  }
});

// ─── POST /api/payments/webhook ────────────────────────────────────────────
// Razorpay webhook endpoint (for production-grade event handling)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');

      if (signature !== expectedSig) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = JSON.parse(req.body.toString());
    console.log(`[Webhook] Event: ${event.event}`, event.payload?.payment?.entity?.id || '');

    broadcast({
      type: 'WEBHOOK_EVENT',
      event: event.event,
      timestamp: new Date().toISOString(),
    });

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[Webhook] Error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
