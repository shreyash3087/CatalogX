'use strict';

/**
 * CatalogX — Products Route
 * ==========================
 * POST /api/products/search  — Semantic + filtered search
 * GET  /api/products         — List all products
 * GET  /api/products/:id     — Product detail (schema.org JSON-LD)
 * GET  /api/products/:id/stock — Real-time stock check
 */

const express = require('express');
const { getDb } = require('../db/init');
const { embed, cosineSimilarity } = require('../../../llm/index');

const router = express.Router();

// ─── Helper: format a raw DB row as a clean product object ─────────────────
function formatProduct(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    brand: row.brand,
    price: {
      paise: row.price_paise,
      inr: (row.price_paise / 100).toFixed(2),
      display: `₹${(row.price_paise / 100).toLocaleString('en-IN')}`,
      currency: 'INR',
    },
    sizes: JSON.parse(row.sizes || '[]'),
    colors: JSON.parse(row.colors || '[]'),
    stock: row.stock,
    in_stock: row.stock > 0,
    tags: JSON.parse(row.tags || '[]'),
    created_at: row.created_at,
  };
}

// ─── POST /api/products/search ─────────────────────────────────────────────
router.post('/search', async (req, res) => {
  try {
    const {
      query = '',
      filters = {},
      limit = 10,
    } = req.body;

    const db = getDb();

    // Build SQL with filters
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = {};

    if (filters.category) {
      sql += ' AND category = @category';
      params.category = filters.category;
    }
    if (filters.brand) {
      sql += " AND lower(brand) = lower(@brand)";
      params.brand = filters.brand;
    }
    if (filters.min_price_paise != null) {
      sql += ' AND price_paise >= @min_price';
      params.min_price = filters.min_price_paise;
    }
    if (filters.max_price_paise != null) {
      sql += ' AND price_paise <= @max_price';
      params.max_price = filters.max_price_paise;
    }
    if (filters.size) {
      // sizes is a JSON array stored as text — check if size is in it
      sql += ` AND sizes LIKE @size`;
      params.size = `%"${filters.size}"%`;
    }
    if (filters.color) {
      sql += ` AND lower(colors) LIKE lower(@color)`;
      params.color = `%${filters.color}%`;
    }
    if (filters.in_stock_only !== false) {
      sql += ' AND stock > 0';
    }

    const rows = db.prepare(sql).all(params);

    if (rows.length === 0) {
      return res.json({
        results: [],
        total: 0,
        query,
        filters,
        message: 'No products match the given filters.',
      });
    }

    // Semantic ranking if query provided
    let rankedProducts;
    if (query && query.trim().length > 0) {
      // Generate embedding for the query
      const queryEmbedding = await embed(query);

      // Score each product using name + description + tags
      const scored = await Promise.all(rows.map(async (row) => {
        let score = 0;

        if (row.embedding) {
          // Use stored embedding if available
          const productEmbedding = Array.from(new Float32Array(row.embedding.buffer));
          score = cosineSimilarity(queryEmbedding, productEmbedding);
        } else {
          // Fallback: simple keyword matching
          const productText = `${row.name} ${row.description} ${row.tags}`.toLowerCase();
          const queryWords = query.toLowerCase().split(/\s+/);
          const matchCount = queryWords.filter(w => productText.includes(w)).length;
          score = matchCount / queryWords.length;
        }

        return { ...row, relevance_score: score };
      }));

      rankedProducts = scored
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, Math.min(limit, 50));
    } else {
      // No query — return by price (ascending)
      rankedProducts = rows
        .slice(0, Math.min(limit, 50))
        .map(r => ({ ...r, relevance_score: null }));
    }

    const results = rankedProducts.map(row => ({
      ...formatProduct(row),
      relevance_score: row.relevance_score ? parseFloat(row.relevance_score.toFixed(4)) : null,
    }));

    return res.json({
      results,
      total: results.length,
      total_unfiltered: rows.length,
      query,
      filters,
    });
  } catch (err) {
    console.error('[Products] Search error:', err);
    return res.status(500).json({ error: 'Search failed', details: err.message });
  }
});

// ─── GET /api/products ─────────────────────────────────────────────────────
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM products ORDER BY category, price_paise').all();
    res.json({
      products: rows.map(formatProduct),
      total: rows.length,
    });
  } catch (err) {
    console.error('[Products] List error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ─── GET /api/products/:id ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Product not found', id: req.params.id });
    }

    const product = formatProduct(row);

    // Return schema.org compatible JSON-LD
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      productID: product.id,
      name: product.name,
      description: product.description,
      brand: { '@type': 'Brand', name: product.brand },
      category: product.category,
      offers: {
        '@type': 'Offer',
        price: (product.price.paise / 100).toString(),
        priceCurrency: 'INR',
        availability: product.in_stock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        priceValidUntil: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      },
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'availableSizes', value: product.sizes.join(', ') },
        { '@type': 'PropertyValue', name: 'availableColors', value: product.colors.join(', ') },
        { '@type': 'PropertyValue', name: 'stockCount', value: product.stock.toString() },
      ],
    };

    return res.json({ ...product, schema_org: jsonLd });
  } catch (err) {
    console.error('[Products] Detail error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ─── GET /api/products/:id/stock ───────────────────────────────────────────
router.get('/:id/stock', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(req.params.id);

    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({
      product_id: row.id,
      product_name: row.name,
      stock: row.stock,
      in_stock: row.stock > 0,
      checked_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Products] Stock check error:', err);
    res.status(500).json({ error: 'Stock check failed' });
  }
});

module.exports = router;
