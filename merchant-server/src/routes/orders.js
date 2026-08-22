'use strict';

/**
 * CatalogX — Orders Route
 * ========================
 * POST /api/orders      — Create a new order (creates Razorpay order)
 * GET  /api/orders/:id  — Get order status
 */

const express = require('express');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { broadcast } = require('../services/auditBroadcast');

const router = express.Router();

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── POST /api/orders ───────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const {
      product_id,
      size,
      color,
      quantity = 1,
      buyer_agent_id,
      session_id,
      human_instruction,
    } = req.body;

    // Validate required fields
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const db = getDb();

    // Fetch product
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found', product_id });
    }

    // Validate size
    const availableSizes = JSON.parse(product.sizes);
    if (size && !availableSizes.includes(size)) {
      return res.status(400).json({
        error: 'Size not available for this product',
        requested_size: size,
        available_sizes: availableSizes,
      });
    }

    // Stock check — critical gate before creating order
    if (product.stock < quantity) {
      broadcast({
        type: 'STOCK_GATE',
        session_id,
        product_id,
        product_name: product.name,
        requested: quantity,
        available: product.stock,
        timestamp: new Date().toISOString(),
      });

      return res.status(409).json({
        error: 'Insufficient stock',
        product_id,
        product_name: product.name,
        requested_quantity: quantity,
        available_stock: product.stock,
        code: 'STOCK_OUT',
      });
    }

    // Calculate amount
    const amount_paise = product.price_paise * quantity;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount_paise,
      currency: 'INR',
      receipt: `rcpt_${uuidv4().slice(0, 16)}`,
      notes: {
        product_id,
        product_name: product.name,
        size: size || 'N/A',
        buyer_agent_id: buyer_agent_id || 'unknown',
        session_id: session_id || 'unknown',
      },
    });

    // Save to local DB
    const orderId = `order_${uuidv4()}`;
    db.prepare(`
      INSERT INTO orders (
        id, razorpay_order_id, product_id, product_name, quantity,
        size, color, amount_paise, status, buyer_agent_id, session_id, human_instruction
      ) VALUES (
        @id, @razorpay_order_id, @product_id, @product_name, @quantity,
        @size, @color, @amount_paise, 'created', @buyer_agent_id, @session_id, @human_instruction
      )
    `).run({
      id: orderId,
      razorpay_order_id: razorpayOrder.id,
      product_id,
      product_name: product.name,
      quantity,
      size: size || null,
      color: color || null,
      amount_paise,
      buyer_agent_id: buyer_agent_id || null,
      session_id: session_id || null,
      human_instruction: human_instruction || null,
    });

    // Broadcast to dashboard
    broadcast({
      type: 'ORDER_CREATED',
      session_id,
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      product_name: product.name,
      amount_paise,
      amount_inr: (amount_paise / 100).toFixed(2),
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        size,
        color,
      },
      amount: {
        paise: amount_paise,
        inr: (amount_paise / 100).toFixed(2),
        currency: 'INR',
        display: `₹${(amount_paise / 100).toLocaleString('en-IN')}`,
      },
      status: 'created',
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[Orders] Create error:', err);
    return res.status(500).json({
      error: 'Failed to create order',
      details: err.message,
      code: err.error?.code || 'INTERNAL_ERROR',
    });
  }
});

// ─── GET /api/orders/:id ────────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? OR razorpay_order_id = ?')
      .get(req.params.id, req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({
      ...order,
      amount_inr: (order.amount_paise / 100).toFixed(2),
    });
  } catch (err) {
    console.error('[Orders] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
