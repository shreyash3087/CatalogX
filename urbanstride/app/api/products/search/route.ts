import { NextRequest, NextResponse } from 'next/server';
import { trackAgentSearch, getUrbanStrideProducts } from '@/lib/db';
import { FOOTWEAR_PRODUCTS } from '@/lib/products';

export async function POST(req: NextRequest) {
  try {
    await trackAgentSearch();
    const body = await req.json().catch(() => ({}));
    const { query = '', filters = {}, limit = 25 } = body;
    const products = await getUrbanStrideProducts();

    const q = (query || '').toLowerCase().trim();
    const maxPrice = filters.max_price_paise;
    const reqSize = filters.size ? String(filters.size).replace(/^uk\s*/i, '').trim() : null;
    const category = filters.category ? String(filters.category).toLowerCase().trim() : '';
    const inStockOnly = filters.in_stock_only !== false;

    // Fast-reject non-footwear category queries
    const nonFootwearCategories = ['electronics', 'audio', 'earphones', 'earphone', 'headphones', 'headphone', 'earbuds', 'earbud', 'keyboards', 'keyboard', 'smartwatches', 'watch', 'watches', 'tech', 'gadget'];
    if (category && nonFootwearCategories.some((c) => category.includes(c) || c.includes(category))) {
      return NextResponse.json({ count: 0, results: [] }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const acceptedFootwearCategories = [
      'footwear', 'shoes', 'shoe', 'running', 'running shoes', 'sneakers', 'sneaker',
      'sports', 'sports shoes', 'casual', 'boots', 'sandals', 'slides', 'trainers', 'loafers'
    ];

    let filtered = products.filter((p) => {
      if (inStockOnly && p.stock <= 0) return false;
      if (maxPrice && p.price_paise > maxPrice) return false;
      if (category && !acceptedFootwearCategories.some((c) => category.includes(c) || c.includes(category)) && p.category !== category) return false;
      if (reqSize && Array.isArray(p.sizes) && !p.sizes.includes(reqSize)) return false;
      return true;
    });

    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      filtered = filtered
        .map((p) => {
          let score = 0;
          const text = `${p.name} ${p.description} ${p.brand} ${p.category} ${p.tags?.join(' ') || ''}`.toLowerCase();
          for (const term of terms) {
            if (p.name.toLowerCase().includes(term)) score += 5;
            if (p.brand.toLowerCase().includes(term)) score += 4;
            if (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(term))) score += 3;
            if (text.includes(term)) score += 1;
            const singular = term.replace(/s$/, '');
            if (singular && text.includes(singular)) score += 1;
          }
          return { product: p, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product);
    }

    const catalogMap = new Map(FOOTWEAR_PRODUCTS.map((p) => [p.id, p]));

    const mappedResults = filtered.slice(0, limit).map((p) => {
      const catProd = catalogMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        brand: p.brand,
        price: {
          paise: p.price_paise,
          inr: (p.price_paise / 100).toFixed(2),
          display: `₹${(p.price_paise / 100).toLocaleString('en-IN')}`,
        },
        price_paise: p.price_paise,
        sizes: p.sizes,
        colors: p.colors,
        stock: p.stock,
        in_stock: p.stock > 0,
        tags: p.tags,
        image_url: p.image || '/assets/urbanstride/Shoe1.png',
        product_url: `http://localhost:3001/product/${p.id}`,
        merchant_url: 'http://localhost:3001',
        rating: p.rating || 4.7,
        reviews_count: p.reviews_count || 120,
        required_options: catProd?.required_options || [
          { key: 'size', label: 'UK / India Shoe Size', type: 'select', available_options: p.sizes || ['6', '7', '8', '9', '10', '11'], required: true },
        ],
        offers: catProd?.offers || [],
      };
    });

    return NextResponse.json(
      {
        results: mappedResults,
        total_matches: mappedResults.length,
        query,
        filters,
      },
      {
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Search failed', details: (err as Error).message }, { status: 500 });
  }
}
