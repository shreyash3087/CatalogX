import { NextResponse } from 'next/server';
import { trackTechCartDiscovery, getTechCartProducts } from '@/lib/db';

export async function GET() {
  await trackTechCartDiscovery();
  const products = await getTechCartProducts();

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const inStockCount = products.filter((p) => p.stock > 0).length;

  const manifest = {
    schema_version: '1.0.0',
    merchant: {
      id: process.env.MERCHANT_ID || 'merchant_techcart_002',
      name: process.env.MERCHANT_NAME || 'TechCart Electronics',
      category: 'electronics',
      description: 'Next-gen audio gear, mechanical keyboards, and smartwatches with Razorpay 1-click agentic checkout.',
      base_url: 'http://localhost:3002',
    },
    capabilities: {
      discovery: true,
      semantic_search: true,
      real_time_stock: true,
      autonomous_order_creation: true,
      razorpay_integrated: true,
      tokenhq_mandate_supported: true,
    },
    catalog: {
      total_products: products.length,
      in_stock_products: inStockCount,
      categories: categories.map((c) => ({ id: c, name: c })),
      brands,
      price_range_inr: {
        min: Math.min(...products.map((p) => p.price_paise)) / 100,
        max: Math.max(...products.map((p) => p.price_paise)) / 100,
      },
    },
    catalog_summary: {
      total_products: products.length,
      in_stock_products: inStockCount,
      categories,
      brands,
      price_range_inr: {
        min: Math.min(...products.map((p) => p.price_paise)) / 100,
        max: Math.max(...products.map((p) => p.price_paise)) / 100,
      },
    },
    endpoints: {
      catalog_manifest: {
        path: '/.well-known/agent-catalog',
        method: 'GET',
        description: 'Returns machine-readable merchant catalog metadata & API contract',
      },
      product_search: {
        path: '/api/products/search',
        method: 'POST',
        description: 'Semantic search with natural language queries and budget/specs filters',
      },
      order_creation: {
        path: '/api/orders',
        method: 'POST',
        description: 'Create Razorpay order for autonomous or 2FA purchase',
        required_fields: [
          'product_id',
          'customer.name',
          'customer.email',
          'customer.phone',
          'shipping_address.street',
          'shipping_address.city',
          'shipping_address.state',
          'shipping_address.postal_code',
        ],
      },
    },
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    },
  });
}
