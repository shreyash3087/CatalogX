import { NextRequest, NextResponse } from 'next/server';
import { updateUrbanStrideStock } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, stock } = body;

    if (!product_id || typeof stock !== 'number') {
      return NextResponse.json({ error: 'Missing product_id or stock number' }, { status: 400 });
    }

    const success = await updateUrbanStrideStock(product_id, stock);
    if (!success) {
      return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product_id,
      new_stock: stock,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update stock', details: (err as Error).message }, { status: 500 });
  }
}
