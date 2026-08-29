import { NextRequest, NextResponse } from 'next/server';
import { getTechCartAnalytics, getTechCartOrders, getTechCartProducts } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const analytics = await getTechCartAnalytics();
    const orders = await getTechCartOrders(50);
    const products = await getTechCartProducts();

    return NextResponse.json({
      merchant_name: process.env.MERCHANT_NAME || 'TechCart Electronics',
      merchant_id: process.env.MERCHANT_ID || 'merchant_techcart_002',
      category: 'electronics',
      analytics,
      orders,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch admin metrics', details: (err as Error).message }, { status: 500 });
  }
}
