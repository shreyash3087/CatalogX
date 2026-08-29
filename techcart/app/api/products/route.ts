import { NextResponse } from 'next/server';
import { getTechCartProducts } from '@/lib/db';

export async function GET() {
  const products = await getTechCartProducts();
  return NextResponse.json({
    products,
    total: products.length,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
