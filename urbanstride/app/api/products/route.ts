import { NextResponse } from 'next/server';
import { getUrbanStrideProducts } from '@/lib/db';

export async function GET() {
  const products = await getUrbanStrideProducts();
  return NextResponse.json({
    products,
    total: products.length,
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
