'use strict';

/**
 * CatalogX — Mandates Route
 * =========================
 * Implements NPCI UAP / Razorpay TokenHQ Pre-Authorized e-Mandates.
 * 
 * Endpoints:
 *   POST /api/mandates/register  — Create a 1-time ₹1.00 mandate authorization order on Razorpay
 *   POST /api/mandates/verify    — Cryptographically verify the auth payment & issue mandate token
 *   GET  /api/mandates/status    — Fetch current mandate status & token details
 *   POST /api/mandates/revoke    — Revoke the pre-authorized mandate
 */

const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { getDb } = require('../db/init');
const { broadcast } = require('../services/auditBroadcast');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'g3rJ5aWnN9Uu3y2oR9m9A8v7',
});

// ─── POST /api/mandates/register ───────────────────────────────────────────
// Creates a 1-time ₹1.00 authorization order for setting up the user's e-mandate
router.post('/register', async (req, res) => {
  try {
    const { customer_name, max_limit_inr } = req.body;
    const limitInr = max_limit_inr || 1500;
    const receipt = `mnd_auth_${Date.now()}`;

    // Create an authorization order on Razorpay for ₹1.00 (100 paise)
    const order = await razorpay.orders.create({
      amount: 100, // ₹1.00 Authorization fee
      currency: 'INR',
      receipt,
      notes: {
        type: 'agent_mandate_authorization',
        protocol: 'NPCI_UAP_V1',
        agent_name: 'CatalogX Autonomous Buyer Agent',
        max_limit_paise: limitInr * 100,
        customer_name: customer_name || 'AI Agent Human Owner',
      },
    });

    return res.json({
      success: true,
      order_id: order.id,
      amount: 100,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa',
      max_limit_inr: limitInr,
      receipt,
    });
  } catch (err) {
    console.error('[Mandates] Register error:', err);
    return res.status(500).json({ error: 'Failed to create mandate authorization order', details: err.message });
  }
});

// ─── POST /api/mandates/verify ─────────────────────────────────────────────
// Verifies HMAC-SHA256 signature and issues the cryptographic mandate token
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, max_limit_inr } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
      });
    }

    // Verify cryptographic signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'g3rJ5aWnN9Uu3y2oR9m9A8v7';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) {
      return res.status(400).json({
        error: 'Signature mismatch: mandate authorization verification failed',
      });
    }

    const db = getDb();
    const limitPaise = (max_limit_inr || 1500) * 100;
    const mandateToken = `tok_mnd_${crypto.randomBytes(12).toString('hex')}`;
    const mandateId = `mnd_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(); // 30 days validity

    // Revoke any previous active mandates to ensure single clean active mandate
    db.prepare("UPDATE mandates SET status = 'REVOKED' WHERE status = 'ACTIVE'").run();

    // Insert new active mandate
    db.prepare(`
      INSERT INTO mandates (id, mandate_token, status, auth_payment_id, auth_order_id, max_limit_paise, protocol, customer_id, created_at, expires_at)
      VALUES (?, ?, 'ACTIVE', ?, ?, ?, 'NPCI_UAP_V1', 'cust_catalogx_owner', datetime('now'), ?)
    `).run(mandateId, mandateToken, razorpay_payment_id, razorpay_order_id, limitPaise, expiresAt);

    const mandateRecord = {
      id: mandateId,
      mandate_token: mandateToken,
      status: 'ACTIVE',
      auth_payment_id: razorpay_payment_id,
      auth_order_id: razorpay_order_id,
      max_limit_inr: limitPaise / 100,
      protocol: 'NPCI UAP / Razorpay TokenHQ',
      expires_at: expiresAt,
    };

    // Broadcast mandate registration to dashboard WebSocket
    broadcast({
      type: 'MANDATE_REGISTERED',
      mandate: mandateRecord,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Mandate successfully authorized & token issued',
      mandate: mandateRecord,
    });
  } catch (err) {
    console.error('[Mandates] Verify error:', err);
    return res.status(500).json({ error: 'Mandate verification failed', details: err.message });
  }
});

// ─── GET /api/mandates/status ──────────────────────────────────────────────
router.get('/status', (req, res) => {
  try {
    const db = getDb();
    const mandate = db.prepare("SELECT * FROM mandates WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1").get();

    if (!mandate) {
      return res.json({ active: false, mandate: null });
    }

    return res.json({
      active: true,
      mandate: {
        id: mandate.id,
        mandate_token: mandate.mandate_token,
        status: mandate.status,
        auth_payment_id: mandate.auth_payment_id,
        auth_order_id: mandate.auth_order_id,
        max_limit_inr: mandate.max_limit_paise / 100,
        protocol: mandate.protocol,
        created_at: mandate.created_at,
        expires_at: mandate.expires_at,
      },
    });
  } catch (err) {
    console.error('[Mandates] Status error:', err);
    return res.status(500).json({ error: 'Failed to fetch mandate status', details: err.message });
  }
});

// ─── POST /api/mandates/revoke ─────────────────────────────────────────────
router.post('/revoke', (req, res) => {
  try {
    const db = getDb();
    db.prepare("UPDATE mandates SET status = 'REVOKED' WHERE status = 'ACTIVE'").run();

    broadcast({
      type: 'MANDATE_REVOKED',
      timestamp: new Date().toISOString(),
    });

    return res.json({ success: true, message: 'Active mandate revoked' });
  } catch (err) {
    console.error('[Mandates] Revoke error:', err);
    return res.status(500).json({ error: 'Failed to revoke mandate', details: err.message });
  }
});

module.exports = router;
