import { NextRequest, NextResponse } from 'next/server';
import { getUrbanStrideAnalytics, getUrbanStrideOrders, getUrbanStrideProducts } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const analytics = await getUrbanStrideAnalytics();
    const orders = await getUrbanStrideOrders(50);
    const products = await getUrbanStrideProducts();

    return NextResponse.json({
      merchant_name: process.env.MERCHANT_NAME || 'UrbanStride Footwear',
      merchant_id: process.env.MERCHANT_ID || 'merchant_urbanstride_001',
      category: 'footwear',
      analytics,
      orders,
      products,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch admin metrics', details: (err as Error).message }, { status: 500 });
  }
}
