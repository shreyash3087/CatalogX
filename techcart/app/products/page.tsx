'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TechCartCartDrawer, { CartItem } from '@/components/CartDrawer';
import { ELECTRONICS_PRODUCTS, Product } from '@/lib/products';

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}
function CpuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>
    </svg>
  );
}

export default function TechCartProductsPage() {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('techcart_cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat) setCategory(cat);
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('techcart_cart', JSON.stringify(newCart));
    } catch (e) {}
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = newQty;
    saveCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    saveCart(updated);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const filteredProducts = useMemo(() => {
    return ELECTRONICS_PRODUCTS.filter((p) => {
      if (category !== 'all') {
        if (category === 'audio' && !p.tags.some((t) => ['headphones', 'earbuds', 'wireless', 'bass', 'tws'].includes(t))) return false;
        if (category === 'wearables' && !p.tags.some((t) => ['smartwatch', 'calling', 'fitness', 'noise'].includes(t))) return false;
        if (category === 'computing' && !p.tags.some((t) => ['keyboard', 'mechanical', 'mac', 'keychron'].includes(t))) return false;
      }
      if (maxPrice && p.price_paise > maxPrice) return false;
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
  }, [category, search, maxPrice]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#0C1220] font-sans">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="max-w-[1280px] mx-auto px-6 sm:px-8 pt-8 pb-16 w-full flex-1 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E8E0D4]">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-[#9C9589] font-mono uppercase tracking-wider mb-2">
              <Link href="/" className="hover:text-[#5A5549] transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#C67D3A] font-semibold">Hardware Catalog</span>
            </div>
            <h1 className="font-heading font-extrabold text-[36px] sm:text-[46px] text-[#0C1220] uppercase tracking-tight leading-none">
              ALL HARDWARE
              <span className="text-[#9C9589] ml-3 text-[26px] font-mono">({filteredProducts.length})</span>
            </h1>
            <p className="text-[12.5px] text-[#9C9589] mt-2 max-w-lg">
              Precision audio gear, studio-grade hybrid ANC, mechanical keyboards, and AMOLED wearables.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audio, keyboard, ANC..."
              className="w-full bg-white border border-[#E8E0D4] rounded-xl pl-9 pr-4 py-2.5 text-[12px] text-[#0C1220] placeholder-[#B0A99E] focus:outline-none focus:border-[#C67D3A] transition-colors font-sans"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B0A99E]">
              <SearchIcon />
            </span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 flex-wrap">
            {[
              { id: 'all', label: 'All Gear' },
              { id: 'audio', label: 'Audio & ANC' },
              { id: 'wearables', label: 'Wearables' },
              { id: 'computing', label: 'Keyboards & Desk' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`px-4 py-1.5 rounded-lg text-[11.5px] font-mono font-semibold border transition-all cursor-pointer ${
                  category === tab.id
                    ? 'bg-[#0C1220] border-[#0C1220] text-white'
                    : 'bg-white border-[#E8E0D4] text-[#9C9589] hover:text-[#0C1220] hover:border-[#D4C9B9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Budget Filter */}
          <div className="flex items-center gap-2 text-[11.5px] font-mono flex-shrink-0">
            <span className="text-[#9C9589] uppercase text-[10px] tracking-wider">Budget:</span>
            {[
              { label: 'Any', val: null },
              { label: '≤ 3,000', val: 300000 },
              { label: '≤ 7,500', val: 750000 },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => setMaxPrice(b.val)}
                className={`px-3 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                  maxPrice === b.val
                    ? 'bg-[#0C1220] text-white font-bold'
                    : 'bg-white border border-[#E8E0D4] text-[#9C9589] hover:text-[#0C1220]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F5F0E8] border border-[#E8E0D4] flex items-center justify-center mx-auto text-[#9C9589]">
              <CpuIcon />
            </div>
            <h3 className="font-heading font-bold text-2xl text-[#0C1220] uppercase">No Hardware Found</h3>
            <p className="text-[12px] text-[#9C9589]">Try clearing your search query or filters.</p>
            <button
              onClick={() => { setSearch(''); setCategory('all'); setMaxPrice(null); }}
              className="px-5 py-2 rounded-lg bg-[#C67D3A] hover:bg-[#A8622C] text-white font-bold text-[11px] uppercase cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} className="tc-card group flex flex-col justify-between">
                {/* Image Section */}
                <div className="relative bg-[#F5F0E8] p-5 h-[210px] flex items-center justify-center">
                  <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-[#C67D3A]/10 text-[#C67D3A] border border-[#C67D3A]/20">
                    {p.brand}
                  </span>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image || '/assets/techcart/headphones.jpg'}
                    alt={p.name}
                    className="tc-card-img max-h-36 w-auto object-contain"
                  />

                  {p.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-500 border border-red-300 px-3 py-1 rounded bg-white">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#9C9589] font-mono mb-1">
                      <span>{p.rating || '4.8'} / 5</span>
                      <span className="text-emerald-600 font-semibold">{p.stock} in stock</span>
                    </div>
                    <h3 className="font-heading font-bold text-[15px] text-[#0C1220] uppercase leading-tight line-clamp-1 group-hover:text-[#C67D3A] transition-colors">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E0D4]">
                    <div className="font-mono font-bold text-[15px] text-[#0C1220]">
                      {'\u20B9'}{(p.price_paise / 100).toLocaleString('en-IN')}
                    </div>

                    <span
                      className="px-3.5 py-1.5 rounded-lg bg-[#0C1220] text-white font-heading font-bold text-[10px] uppercase tracking-wider group-hover:bg-[#C67D3A] transition-colors"
                    >
                      View Details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Cart Drawer */}
      <TechCartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />
    </div>
  );
}