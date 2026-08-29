import { NextRequest, NextResponse } from 'next/server';
import { getTechCartProducts } from '@/lib/db';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const products = await getTechCartProducts();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return NextResponse.json({ error: 'Product not found', product_id: id }, { status: 404 });
  }

  return NextResponse.json({
    product_id: product.id,
    name: product.name,
    stock: product.stock,
    in_stock: product.stock > 0,
    sizes: product.sizes,
    price_paise: product.price_paise,
    price_inr: (product.price_paise / 100).toFixed(2),
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}
