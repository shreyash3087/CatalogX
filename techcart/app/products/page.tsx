'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TechCartCartDrawer, { CartItem } from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { ELECTRONICS_PRODUCTS, Product } from '@/lib/products';

export default function TechCartProductsPage() {
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('techcart_cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {}
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
    setIsModalOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#04060A] text-slate-100 font-sans selection:bg-[#2563EB] selection:text-white">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      <main className="max-w-[1360px] mx-auto px-6 sm:px-10 pt-28 pb-20 w-full flex-1 space-y-10">
        {/* Header Title & Breadcrumb */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span className="text-white font-bold">Hardware Catalog</span>
            </div>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-white uppercase tracking-tight">
              Electronics Hardware Drops ({filteredProducts.length})
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal max-w-xl">
              High-fidelity audio, AMOLED smartwatches, and mechanical keyboards with instant Razorpay checkout.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audio, watch, keyboard..."
              className="w-full bg-white/5 border border-white/15 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:bg-white/10 transition-all font-sans"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Hardware' },
              { id: 'audio', label: 'Headphones & ANC' },
              { id: 'earbuds', label: 'TWS Earbuds' },
              { id: 'wearables', label: 'Smartwatches' },
              { id: 'computing', label: 'Keyboards & Mice' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategory(tab.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                  category === tab.id
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/30'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Price Ceiling Quick Filters */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-500 font-bold uppercase">Budget Cap:</span>
            <button
              onClick={() => setMaxPrice(null)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                maxPrice === null ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Any
            </button>
            <button
              onClick={() => setMaxPrice(200000)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                maxPrice === 200000 ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              ≤ ₹2,000
            </button>
            <button
              onClick={() => setMaxPrice(500000)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                maxPrice === 500000 ? 'bg-[#2563EB] text-white' : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              ≤ ₹5,000
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <div className="text-5xl">🎧</div>
            <h3 className="font-heading font-bold text-2xl text-white uppercase">No Hardware Found</h3>
            <p className="text-xs text-slate-400">Try clearing your search query or price cap filter.</p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('all');
                setMaxPrice(null);
              }}
              className="px-6 py-2.5 rounded-full bg-[#2563EB] text-white font-bold text-xs uppercase"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="tech-card p-6 flex flex-col justify-between group"
              >
                <div>
                  <Link href={`/product/${p.id}`} className="block">
                    <div className="h-52 flex items-center justify-center relative p-4 bg-black/40 rounded-2xl mb-5 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image || '/assets/techcart/headphones.jpg'}
                        alt={p.name}
                        className="max-h-44 w-auto object-contain rounded-xl drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
                      />
                      {p.stock <= 0 && (
                        <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase font-mono">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center justify-between text-[11px] text-[#2563EB] uppercase font-mono font-semibold">
                    <span>{p.brand}</span>
                    <span className="text-slate-400 font-sans">★ {p.rating || '4.8'}</span>
                  </div>

                  <Link href={`/product/${p.id}`}>
                    <h3 className="font-heading font-bold text-xl text-white uppercase tracking-wide mt-1 group-hover:text-[#2563EB] transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                    {p.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-heading font-bold text-xl text-white">
                      ₹{(p.price_paise / 100).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{p.stock} in stock</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${p.id}`}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleQuickBuy(p)}
                      disabled={p.stock <= 0}
                      className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
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

      <TechCartCartDrawer
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
      />
    </div>
  );
}
