'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer, { CartItem } from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { FOOTWEAR_PRODUCTS, Product } from '@/lib/products';

const PRODUCT_COLORS: string[][] = [
  ['#1a1a2e', '#e8e8e8'],
  ['#2d4a22', '#f0e6c8', '#1a3a5c'],
  ['#8B6914', '#333333', '#5a3e6e'],
  ['#4a6741', '#c8b89a', '#2a2a2a'],
  ['#1c3a5e', '#c8c8c8', '#6e3a2a'],
  ['#2e2e2e', '#e0d8c8'],
];

export default function UrbanStrideProductsPage() {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('9');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeColorIdx, setActiveColorIdx] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('urbanstride_cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {}
  }, []);

  // Sync URL category param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get('category');
      if (cat) setCategory(cat);
    }
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try { localStorage.setItem('urbanstride_cart', JSON.stringify(newCart)); } catch (e) {}
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) { handleRemoveItem(index); return; }
    const updated = [...cart];
    updated[index].quantity = newQty;
    saveCart(updated);
  };

  const handleRemoveItem = (index: number) => saveCart(cart.filter((_, i) => i !== index));
  const handleClearCart = () => saveCart([]);

  const filteredProducts = useMemo(() => {
    return FOOTWEAR_PRODUCTS.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
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

  const handleQuickBuy = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || '9');
    setIsModalOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F7F4] text-[#0f0f0f] font-sans selection:bg-[#0f0f0f] selection:text-[#F8F7F4]">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="max-w-[1200px] mx-auto px-6 sm:px-8 pt-8 pb-16 w-full flex-1 space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pb-6 border-b border-[#E0DDD9]">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-[#999] font-medium uppercase tracking-wider mb-2">
              <Link href="/" className="hover:text-[#555] transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#0f0f0f] font-bold">Catalog</span>
            </div>
            <h1 className="font-heading font-extrabold text-[38px] sm:text-[48px] text-[#0f0f0f] uppercase tracking-tight leading-none">
              All Footwear
              <span className="text-[#bbb] ml-3 text-[26px]">({filteredProducts.length})</span>
            </h1>
            <p className="text-[13px] text-[#777] mt-2 font-normal max-w-xl">
              Curated performance running shoes, rugged hiking boots, and everyday sneakers.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sneakers, brand, trail..."
              className="w-full bg-white border border-[#D8D5D0] rounded-full pl-10 pr-4 py-2.5 text-[12.5px] text-[#0f0f0f] placeholder-[#aaa] focus:outline-none focus:border-[#0f0f0f] transition-all font-sans"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#aaa]" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 flex-wrap">
            {[
              { id: 'all', label: 'All Sneakers' },
              { id: 'running-shoes', label: 'Road Running' },
              { id: 'hiking-boots', label: 'Hiking & Trekking' },
              { id: 'casual-sneakers', label: 'Lifestyle & Skate' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`filter-pill ${category === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Price Filter */}
          <div className="flex items-center gap-2 text-[12px] font-medium flex-shrink-0">
            <span className="text-[#999] uppercase text-[10px] tracking-wider font-bold">Budget:</span>
            {[
              { label: 'Any', val: null },
              { label: '≤ ₹3,000', val: 300000 },
              { label: '≤ ₹5,000', val: 500000 },
            ].map((b) => (
              <button
                key={b.label}
                onClick={() => setMaxPrice(b.val)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                  maxPrice === b.val
                    ? 'bg-[#0f0f0f] border-[#0f0f0f] text-white'
                    : 'border-[#D0CEC9] text-[#555] hover:border-[#0f0f0f]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* SNEAKERS watermark */}
        <div className="relative overflow-hidden pointer-events-none select-none h-10 flex items-center">
          <span
            className="font-heading font-black uppercase absolute -top-4 left-0 opacity-[0.06] whitespace-nowrap"
            style={{ fontSize: 'clamp(60px, 8vw, 120px)', letterSpacing: '-0.02em', color: '#0f0f0f' }}
          >
            COLLECTION
          </span>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#EEECEA] border border-[#D0CEC9] flex items-center justify-center mx-auto">
              <i className="fa-solid fa-shoe-prints text-xl text-[#aaa]"></i>
            </div>
            <h3 className="font-heading font-bold text-2xl text-[#0f0f0f] uppercase">No Sneakers Found</h3>
            <p className="text-[12px] text-[#888]">Try clearing your search or filter.</p>
            <button
              onClick={() => { setSearch(''); setCategory('all'); setMaxPrice(null); }}
              className="px-6 py-2.5 rounded-full bg-[#0f0f0f] text-white font-bold text-[12px] uppercase cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((p, idx) => {
              const colors = PRODUCT_COLORS[idx % PRODUCT_COLORS.length];
              const activeColor = activeColorIdx[p.id] ?? 0;
              return (
                <div key={p.id} className="product-card group">
                  {/* Image Area */}
                  <div className="relative bg-[#EEECEA] rounded-xl overflow-hidden" style={{ height: '240px' }}>
                    <div className="badge-new">NEW</div>
                    <Link href={`/product/${p.id}`} className="flex items-center justify-center w-full h-full p-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image || '/assets/urbanstride/Shoe1.png'}
                        alt={p.name}
                        className="product-img max-h-[180px] w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.1)]"
                      />
                    </Link>

                    {/* Quick Buy hover overlay */}
                    <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <button
                        onClick={() => handleQuickBuy(p)}
                        disabled={p.stock <= 0}
                        className="w-full py-2.5 bg-[#0f0f0f] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {p.stock <= 0 ? 'Sold Out' : 'Quick Buy'}
                      </button>
                    </div>

                    {p.stock <= 0 && (
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded bg-white/80 text-[#888] border border-[#D0CEC9] text-[9px] font-bold uppercase">
                        Sold Out
                      </span>
                    )}
                  </div>

                  {/* Card Info */}
                  <div className="p-4 bg-[#F8F7F4]">
                    <div className="flex items-center justify-between text-[10.5px] text-[#aaa] uppercase tracking-wider font-semibold mb-0.5">
                      <span>{p.brand}</span>
                      <span>★ {p.rating || '4.8'}</span>
                    </div>
                    <Link href={`/product/${p.id}`}>
                      <h3 className="font-heading font-bold text-[17px] text-[#0f0f0f] uppercase leading-tight tracking-wide line-clamp-1 group-hover:opacity-70 transition-opacity">
                        {p.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="font-semibold text-[13.5px] text-[#0f0f0f]">
                        ₹{(p.price_paise / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {colors.map((c, ci) => (
                          <button
                            key={ci}
                            onClick={() => setActiveColorIdx((prev) => ({ ...prev, [p.id]: ci }))}
                            className={`color-dot ${activeColor === ci ? 'active' : ''}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        selectedSize={selectedSize}
      />
    </div>
  );
}
