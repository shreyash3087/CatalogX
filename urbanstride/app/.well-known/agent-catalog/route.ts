import { NextResponse } from 'next/server';
import { trackAgentDiscovery, getUrbanStrideProducts } from '@/lib/db';

export async function GET() {
  trackAgentDiscovery().catch(() => {});
  let products = [];
  try {
    products = await getUrbanStrideProducts();
  } catch (e) {
    const { FOOTWEAR_PRODUCTS } = await import('@/lib/products');
    products = FOOTWEAR_PRODUCTS;
  }

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const brands = Array.from(new Set(products.map((p) => p.brand)));
  const allSizes = Array.from(new Set(products.flatMap((p) => p.sizes || []))).sort((a, b) => Number(a) - Number(b));
  const inStockCount = products.filter((p) => p.stock > 0).length;

  const manifest = {
    schema_version: '1.0.0',
    merchant: {
      id: process.env.MERCHANT_ID || 'merchant_urbanstride_001',
      name: process.env.MERCHANT_NAME || 'UrbanStride Footwear',
      category: 'footwear',
      description: 'Premium performance running shoes, trail boots, and casual sneakers with Razorpay 1-click agentic checkout.',
      base_url: 'http://localhost:3001',
      sizing_standard: 'UK / India standard sizing (UK 6, UK 7, UK 8, UK 9, UK 10, UK 11, UK 12)',
      currency: 'INR',
    },
    capabilities: {
      discovery: true,
      semantic_search: true,
      real_time_stock: true,
      autonomous_order_creation: true,
      razorpay_integrated: true,
      tokenhq_mandate_supported: true,
      options_supported: {
        sizing: true,
        size_type: 'UK / India size',
        available_sizes: allSizes.length > 0 ? allSizes : ['6', '7', '8', '9', '10', '11', '12'],
        colors: true,
      },
    },
    catalog: {
      total_products: products.length,
      in_stock_products: inStockCount,
      categories: categories.map((c) => ({ id: c, name: c })),
      brands,
      supported_sizes: allSizes.length > 0 ? allSizes : ['6', '7', '8', '9', '10', '11', '12'],
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
      supported_sizes: allSizes.length > 0 ? allSizes : ['6', '7', '8', '9', '10', '11', '12'],
      sizing_standard: 'UK / India',
      price_range_inr: {
        min: Math.min(...products.map((p) => p.price_paise)) / 100,
        max: Math.max(...products.map((p) => p.price_paise)) / 100,
      },
    },
    policies: {
      returns: '7-day hassle-free return and exchange window',
      authenticity: '100% Original Brand Guarantee',
      shipping: 'Free express delivery across India with Razorpay Buyer Protection',
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
        description: 'Semantic search with natural language queries and budget/size filters',
      },
      order_creation: {
        path: '/api/orders',
        method: 'POST',
        description: 'Create Razorpay order for autonomous or 2FA purchase',
        required_fields: [
          'product_id',
          'size',
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
