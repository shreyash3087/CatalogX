'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import { ELECTRONICS_PRODUCTS, Product } from '@/lib/products';

export default function TechCartProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return ELECTRONICS_PRODUCTS.filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search]);

  const handleQuickBuy = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#06080F]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cyan-950/80">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Electronics & Hardware Catalog</h1>
            <p className="text-xs text-slate-400 mt-1">
              Explore wireless audio, gaming gear, and smartwatches · Auto-purchasable via CatalogX
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search earbuds, keyboard, watch..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-white placeholder:text-slate-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="text-4xl">🎧</div>
            <div className="text-sm font-bold text-white">No hardware items found</div>
            <p className="text-xs text-slate-500">Try searching for earbuds, keyboards, or smartwatches.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="group bg-[#0A1020] border border-cyan-950/80 rounded-2xl p-5 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 flex items-center justify-center relative p-4 bg-slate-900/40 rounded-xl mb-4 group-hover:scale-105 transition-transform overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image || '/assets/techcart/headphones.jpg'}
                      alt={p.name}
                      className="max-h-36 w-auto object-contain rounded-xl"
                    />
                    {p.stock <= 0 && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold">
                        Sold Out
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-cyan-400 uppercase font-mono font-semibold">
                    <span>{p.brand}</span>
                    <span className="text-slate-500">⭐ {p.rating || '4.8'}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1 mt-0.5">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-white">₹{(p.price_paise / 100).toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-500">{p.stock} in stock</div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/product/${p.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleQuickBuy(p)}
                      disabled={p.stock <= 0}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
