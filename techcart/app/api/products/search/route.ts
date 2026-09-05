import { NextRequest, NextResponse } from 'next/server';
import { trackTechCartSearch, getTechCartProducts } from '@/lib/db';
import { ELECTRONICS_PRODUCTS } from '@/lib/products';

export async function POST(req: NextRequest) {
  try {
    await trackTechCartSearch();
    const body = await req.json().catch(() => ({}));
    const { query = '', filters = {}, limit = 25 } = body;
    const products = await getTechCartProducts();

    const q = (query || '').toLowerCase().trim();
    const maxPrice = filters.max_price_paise;
    const category = filters.category ? String(filters.category).toLowerCase().trim() : '';
    const inStockOnly = filters.in_stock_only !== false;

    // Fast-reject non-electronics categories
    const nonElectronicsCategories = ['footwear', 'shoes', 'sneakers', 'running', 'boots', 'sandals', 'slides'];
    if (category && nonElectronicsCategories.some((c) => category.includes(c) || c.includes(category))) {
      return NextResponse.json({ count: 0, results: [] }, { headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const acceptedCategories = ['electronics', 'tech', 'audio', 'earphones', 'earphone', 'headphones', 'headphone', 'earbuds', 'earbud', 'keyboards', 'keyboard', 'smartwatches', 'watch', 'watches', 'gadget', 'gear'];

    let filtered = products.filter((p) => {
      if (inStockOnly && p.stock <= 0) return false;
      if (maxPrice && p.price_paise > maxPrice) return false;
      if (category && !acceptedCategories.some((c) => category.includes(c) || c.includes(category)) && p.category !== category) return false;
      return true;
    });

    if (q) {
      const terms = q.split(/\s+/).filter(Boolean);
      const audioTerms = ['earphone', 'earphones', 'earbud', 'earbuds', 'headphone', 'headphones', 'tws', 'audio', 'sound', 'buds', 'airpods', 'headset'];
      const keyboardTerms = ['keyboard', 'keyboards', 'mechanical', 'keys', 'typing'];
      const watchTerms = ['watch', 'watches', 'smartwatch', 'smartwatches', 'fitness', 'tracker'];

      filtered = filtered
        .map((p) => {
          let score = 0;
          const text = `${p.name} ${p.description} ${p.brand} ${p.category} ${p.tags?.join(' ') || ''}`.toLowerCase();
          const isAudioProduct = p.tags?.some((t: string) => ['earbuds', 'earphones', 'headphones', 'wireless', 'audio'].includes(t));
          const isKeyboardProduct = p.tags?.some((t: string) => ['keyboard', 'mechanical'].includes(t));
          const isWatchProduct = p.tags?.some((t: string) => ['smartwatch', 'calling', 'fitness'].includes(t));

          for (const term of terms) {
            if (p.name.toLowerCase().includes(term)) score += 6;
            if (p.brand.toLowerCase().includes(term)) score += 4;
            if (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(term))) score += 4;
            if (text.includes(term)) score += 2;
            const singular = term.replace(/s$/, '');
            if (singular && text.includes(singular)) score += 2;

            // Synonym scoring
            if (audioTerms.includes(term) && isAudioProduct) score += 3;
            if (keyboardTerms.includes(term) && isKeyboardProduct) score += 3;
            if (watchTerms.includes(term) && isWatchProduct) score += 3;
          }
          return { product: p, score };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product);
    }

    const catalogMap = new Map(ELECTRONICS_PRODUCTS.map((p) => [p.id, p]));

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
        image_url: p.image || '/assets/techcart/headphones.jpg',
        product_url: `http://localhost:3002/product/${p.id}`,
        merchant_url: 'http://localhost:3002',
        rating: p.rating || 4.8,
        reviews_count: p.reviews_count || 150,
        required_options: catProd?.required_options || [],
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
