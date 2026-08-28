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
      customer = {},
      shipping_address = {},
      buyer_agent_id,
      session_id,
      human_instruction,
    } = req.body;

    // Validate required fields
    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const custName = customer.name || req.body.customer_name || 'Customer';
    const custEmail = customer.email || req.body.customer_email || 'customer@catalogx.ai';
    const custPhone = customer.phone || req.body.customer_phone || '+91 98765 43210';
    
    const shipStreet = shipping_address.street || req.body.shipping_street || 'Flat 402, Skyline Residency, Indiranagar';
    const shipCity = shipping_address.city || req.body.shipping_city || 'Bengaluru';
    const shipState = shipping_address.state || req.body.shipping_state || 'Karnataka';
    const shipPostalCode = shipping_address.postal_code || req.body.shipping_postal_code || '560038';
    const shipCountry = shipping_address.country || req.body.shipping_country || 'India';

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
        customer_name: custName,
        customer_email: custEmail,
        customer_phone: custPhone,
        shipping_destination: `${shipStreet}, ${shipCity}, ${shipState} - ${shipPostalCode}`,
      },
    });

    // Save to local DB with fulfillment & customer details
    const orderId = `order_${uuidv4()}`;
    db.prepare(`
      INSERT INTO orders (
        id, razorpay_order_id, product_id, product_name, quantity,
        size, color, amount_paise, status, buyer_agent_id, session_id, human_instruction,
        customer_name, customer_email, customer_phone,
        shipping_street, shipping_city, shipping_state, shipping_postal_code, shipping_country
      ) VALUES (
        @id, @razorpay_order_id, @product_id, @product_name, @quantity,
        @size, @color, @amount_paise, 'created', @buyer_agent_id, @session_id, @human_instruction,
        @customer_name, @customer_email, @customer_phone,
        @shipping_street, @shipping_city, @shipping_state, @shipping_postal_code, @shipping_country
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
      customer_name: custName,
      customer_email: custEmail,
      customer_phone: custPhone,
      shipping_street: shipStreet,
      shipping_city: shipCity,
      shipping_state: shipState,
      shipping_postal_code: shipPostalCode,
      shipping_country: shipCountry,
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
      customer: { name: custName, email: custEmail, phone: custPhone },
      shipping_address: { street: shipStreet, city: shipCity, state: shipState, postal_code: shipPostalCode, country: shipCountry },
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
      agentic_upsell: (product.category && (product.category.includes('shoes') || product.category.includes('sneakers') || product.category.includes('boot')))
        ? {
            id: 'upsell_socks_01',
            name: 'UrbanStride Anti-Blister Running Socks (3-Pack)',
            bundle_price_paise: 29900,
            original_price_paise: 49900,
            discount: '40% Bundle Deal',
            category: 'accessories',
            reason: 'Optimized arch support and blister prevention for running & casual shoes.'
          }
        : {
            id: 'upsell_cable_01',
            name: 'TechCart Braided 100W Fast-Charge Cable',
            bundle_price_paise: 24900,
            original_price_paise: 49900,
            discount: '50% Bundle Deal',
            category: 'accessories',
            reason: 'High-speed braided power delivery cable for your new audio & computing device.'
          },
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

// ─── GET /api/orders ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const limit = parseInt(req.query.limit) || 50;
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT ?').all(limit);
    return res.json({
      orders: orders.map(o => ({
        ...o,
        amount_inr: (o.amount_paise / 100).toFixed(2),
      })),
      total: orders.length,
    });
  } catch (err) {
    console.error('[Orders] List error:', err);
    res.status(500).json({ error: 'Failed to list orders' });
  }
});

module.exports = router;
