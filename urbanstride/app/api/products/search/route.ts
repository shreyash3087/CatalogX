import { NextRequest, NextResponse } from 'next/server';
import { trackAgentSearch, getUrbanStrideProducts } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await trackAgentSearch();
    const body = await req.json();
    const { query = '', filters = {}, limit = 10 } = body;
    const products = await getUrbanStrideProducts();

    const q = query.toLowerCase();
    const maxPrice = filters.max_price_paise;
    const reqSize = filters.size;
    const category = filters.category;
    const inStockOnly = filters.in_stock_only !== false;

    let filtered = products.filter((p) => {
      if (inStockOnly && p.stock <= 0) return false;
      if (maxPrice && p.price_paise > maxPrice) return false;
      if (category && p.category !== category) return false;
      if (reqSize && !p.sizes.includes(String(reqSize))) return false;
      return true;
    });

    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      filtered = filtered.map((p) => {
        let score = 0;
        const text = `${p.name} ${p.description} ${p.brand} ${p.category} ${p.tags.join(' ')}`.toLowerCase();
        for (const term of terms) {
          if (p.name.toLowerCase().includes(term)) score += 5;
          if (p.brand.toLowerCase().includes(term)) score += 4;
          if (p.tags.some((t) => t.toLowerCase().includes(term))) score += 3;
          if (text.includes(term)) score += 1;
        }
        return { product: p, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);
    }

    return NextResponse.json({
      results: filtered.slice(0, limit),
      total_matches: filtered.length,
      query,
      filters,
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Search failed', details: (err as Error).message }, { status: 500 });
  }
}
