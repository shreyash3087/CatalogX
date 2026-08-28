'use strict';

/**
 * CatalogX — Agent Catalog Discovery Route
 * ==========================================
 * GET /.well-known/agent-catalog
 *
 * Returns a machine-readable manifest describing this merchant's full
 * capabilities, catalog schema, and purchase endpoints.
 *
 * This is the "agent-readable web" protocol endpoint — analogous to:
 * - robots.txt (web crawlers)
 * - .well-known/openid-configuration (OpenID Connect)
 * - .well-known/apple-app-site-association (iOS Universal Links)
 *
 * Any buyer agent should hit this endpoint first to understand what
 * this merchant sells and how to buy from them.
 */

const express = require('express');
const { getDb } = require('../db/init');

const router = express.Router();

router.get('/.well-known/agent-catalog', (req, res) => {
  const db = getDb();

  // Compute live catalog stats
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_products,
      MIN(price_paise) as min_price,
      MAX(price_paise) as max_price,
      SUM(CASE WHEN stock > 0 THEN 1 ELSE 0 END) as in_stock_count
    FROM products
  `).get();

  const categories = db.prepare(`
    SELECT category, COUNT(*) as count FROM products GROUP BY category
  `).all();

  const brands = db.prepare(`
    SELECT DISTINCT brand FROM products ORDER BY brand
  `).all().map(r => r.brand);

  const catalog = {
    protocol: 'agent-catalog/1.0',
    generated_at: new Date().toISOString(),

    merchant: {
      id: process.env.MERCHANT_ID || 'merchant_urbanstride_001',
      name: process.env.MERCHANT_NAME || 'UrbanStride Footwear',
      category: process.env.MERCHANT_CATEGORY || 'footwear',
      description: 'Premium footwear for every journey — running shoes, casual sneakers, and hiking boots from top brands.',
      trust_level: 'verified',
      supported_currencies: ['INR'],
      payment_provider: 'razorpay',
      payment_mode: 'test',
      country: 'IN',
    },

    catalog: {
      total_products: stats.total_products,
      in_stock_products: stats.in_stock_count,
      categories: categories.map(c => ({
        id: c.category,
        name: c.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count: c.count,
      })),
      brands,
      price_range: {
        min_paise: stats.min_price,
        max_paise: stats.max_price,
        min_inr: (stats.min_price / 100).toFixed(2),
        max_inr: (stats.max_price / 100).toFixed(2),
        currency: 'INR',
      },
      filterable_fields: ['category', 'brand', 'price_range', 'size', 'color', 'stock'],
      supports_semantic_search: true,
      supports_embedding_search: true,
    },

    endpoints: {
      base_url: `http://localhost:${process.env.PORT || 3001}`,
      search: {
        method: 'POST',
        path: '/api/products/search',
        description: 'Semantic + filtered product search',
        request_schema: {
          query: 'string — natural language search query',
          filters: {
            category: 'string (optional) — e.g. running-shoes',
            brand: 'string (optional)',
            min_price_paise: 'integer (optional)',
            max_price_paise: 'integer (optional)',
            size: 'string (optional) — e.g. "9"',
            color: 'string (optional)',
            in_stock_only: 'boolean (optional, default: true)',
          },
          limit: 'integer (optional, default: 10, max: 50)',
        },
      },
      product_detail: {
        method: 'GET',
        path: '/api/products/:id',
        description: 'Full product details in schema.org JSON-LD format',
      },
      product_page: {
        method: 'GET',
        url_template: `http://localhost:${process.env.PORT || 3001}/product.html?id={product_id}`,
        description: 'Dynamic customer-facing product details page with specifications and Razorpay checkout',
      },
      stock_check: {
        method: 'GET',
        path: '/api/products/:id/stock',
        description: 'Real-time stock availability check',
      },
      create_order: {
        method: 'POST',
        path: '/api/orders',
        description: 'Create a Razorpay order for a product with customer contact and delivery fulfillment address',
        request_schema: {
          product_id: 'string (required)',
          size: 'string (optional for non-sized items, required for footwear)',
          color: 'string (optional)',
          quantity: 'integer (default: 1)',
          customer: {
            name: 'string (required)',
            email: 'string (required)',
            phone: 'string (required)',
          },
          shipping_address: {
            street: 'string (required)',
            city: 'string (required)',
            state: 'string (required)',
            postal_code: 'string (required)',
            country: 'string (default: India)',
          },
          buyer_agent_id: 'string (optional)',
          session_id: 'string (optional)',
          human_instruction: 'string (optional)',
        },
      },
      verify_payment: {
        method: 'POST',
        path: '/api/payments/verify',
        description: 'Verify Razorpay payment signature and complete the purchase',
        request_schema: {
          razorpay_order_id: 'string',
          razorpay_payment_id: 'string',
          razorpay_signature: 'string',
        },
      },
      simulate_payment: {
        method: 'POST',
        path: '/api/payments/simulate',
        description: 'TEST MODE ONLY — simulate payment capture without Razorpay modal',
        note: 'Only available in test mode. Uses test card: 4111 1111 1111 1111',
      },
    },

    policies: {
      min_order_paise: 100,
      max_order_paise: 10000000,  // ₹1,00,000
      max_quantity_per_order: 10,
      requires_agent_registration: false,
      rate_limit: '100 requests/minute per IP',
      refund_policy: 'Returns accepted within 7 days of delivery for manufacturing defects',
    },

    agent_instructions: {
      recommended_flow: [
        '1. Read this manifest to understand catalog structure',
        '2. POST /api/products/search with user\'s requirements',
        '3. GET /api/products/:id for full details on top match',
        '4. GET /api/products/:id/stock to confirm availability',
        '5. POST /api/orders to create a Razorpay order',
        '6. Process payment (use simulate endpoint in test mode)',
        '7. POST /api/payments/verify to confirm purchase',
      ],
      search_tips: [
        'Include user\'s natural language query in the "query" field',
        'Use filters.max_price_paise to enforce budget constraints',
        'Always check stock before creating an order',
        'If stock-out: re-search excluding the out-of-stock product',
      ],
    },
  };

  res.json(catalog);
});

module.exports = router;
