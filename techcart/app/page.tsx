'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TechCartCartDrawer, { CartItem } from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { ELECTRONICS_PRODUCTS, Product } from '@/lib/products';

export default function TechCartHomePage() {
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

  const featured = ELECTRONICS_PRODUCTS.slice(0, 4);

  const handleQuickBuy = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#04060A] text-slate-100 font-sans selection:bg-[#2563EB] selection:text-white">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      {/* 1. HERO SECTION */}
      <section
        id="hero"
        className="relative min-h-[92vh] pt-28 pb-16 flex items-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/techcart/hero_bg.png')",
          backgroundColor: '#04060A',
        }}
      >
        {/* Subtle dark overlay on left for typography contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#04060A]/90 via-[#04060A]/60 to-transparent pointer-events-none z-0" />

        <div className="max-w-[1360px] mx-auto px-6 sm:px-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Hero Left: Content */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Star Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-slate-300 font-medium tracking-wide">
              <span className="text-slate-400 text-xs">✦</span>
              <span>NEW 2026 HARDWARE COLLECTION</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading font-extrabold text-5xl sm:text-6xl xl:text-[68px] leading-[1.0] tracking-tight uppercase text-white">
              PRECISION AUDIO <br />
              & <span className="text-[#2563EB]">NEXT-GEN</span> <br />
              WEARABLES
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] text-slate-300 font-normal max-w-md leading-relaxed">
              High-fidelity audio, studio-grade ANC, AMOLED displays and powerful computing gear, engineered for the way you live.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/products"
                className="px-7 py-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
              >
                SHOP COLLECTION
              </Link>
              <a
                href="#categories"
                className="px-7 py-3 rounded-lg border border-white/20 bg-white/[0.03] text-white font-heading font-bold text-xs uppercase tracking-wider hover:bg-white/10 hover:border-white transition-all"
              >
                BROWSE CATEGORIES
              </a>
            </div>

            {/* 3 Hardware Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10 max-w-lg">
              <div className="flex items-start gap-2.5">
                <i className="fa-solid fa-shield-halved text-slate-400 text-sm mt-0.5"></i>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Ultra-Low Latency</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Bluetooth 5.4 High-Res</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <i className="fa-solid fa-headphones text-slate-400 text-sm mt-0.5"></i>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Studio ANC</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dual Noise Sensor V1</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <i className="fa-solid fa-bolt text-slate-400 text-sm mt-0.5"></i>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Instant Buy</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Razorpay 1-Click</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Right: Product Visual */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="ambient-glow" />
            <div className="relative z-10 w-full max-w-[520px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/techcart/hero.png"
                alt="TechCart Headphones Hero"
                className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE CATEGORIES (WITH GENEROUS BOTTOM PADDING) */}
      <section id="categories" className="pt-24 pb-44 bg-[#04060A] border-t border-white/5 relative z-20">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-16 gap-4">
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-bold text-[#2563EB] uppercase tracking-widest">
                HARDWARE CATEGORIES
              </div>
              <h2 className="font-heading font-extrabold text-4xl sm:text-5xl text-white uppercase tracking-tight">
                Explore Categories
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>View All Electronics</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12">
            {[
              {
                code: '01 // SOUND',
                title: 'WIRELESS AUDIO & ANC',
                category: 'audio',
                image: '/assets/techcart/headphones.jpg',
                desc: 'Over-ear studio monitors and active noise cancelling earbuds.',
                price: 'FROM ₹1,499',
              },
              {
                code: '02 // WIRELESS',
                title: 'TRUE WIRELESS EARBUDS',
                category: 'audio',
                image: '/assets/techcart/earbuds.jpg',
                desc: 'Dynamic bass drivers, IP55 sweatproof, dual mic clarity.',
                price: 'FROM ₹2,199',
              },
              {
                code: '03 // TELEMETRY',
                title: 'SMARTWATCHES & AMOLED',
                category: 'wearables',
                image: '/assets/techcart/smartwatch.jpg',
                desc: 'Bluetooth calling, SpO2 fitness tracking, rotating bezels.',
                price: 'FROM ₹1,399',
              },
              {
                code: '04 // HARDWARE',
                title: 'MECHANICAL KEYBOARDS',
                category: 'computing',
                image: '/assets/techcart/keyboard.jpg',
                desc: 'RGB tactile mechanical switches and multi-device combos.',
                price: 'FROM ₹1,299',
              },
            ].map((col, idx) => (
              <Link
                key={idx}
                href="/products"
                className="group flex flex-col justify-between cursor-pointer space-y-4 pb-6"
              >
                <div className="relative aspect-square flex items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent group-hover:from-white/[0.08] transition-colors border border-white/5 group-hover:border-white/15 overflow-hidden shadow-lg">
                  <div className="ambient-glow"></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={col.image}
                    alt={col.title}
                    className="w-48 h-48 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)] rounded-2xl relative z-10 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] font-mono text-[#2563EB] font-bold uppercase tracking-wider">
                    {col.price}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide group-hover:text-[#2563EB] transition-colors">
                    {col.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-normal line-clamp-2 leading-relaxed">
                    {col.desc}
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-300 group-hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                      <span>EXPLORE MODELS</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRENDING HARDWARE DROPS */}
      <section className="py-24 bg-[#080C14] border-t border-white/5 relative z-20">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-[#2563EB] uppercase tracking-widest mb-1">
                FEATURED HARDWARE
              </div>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white uppercase tracking-tight">
                Trending Electronics Drops
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider"
            >
              Browse All 9 Models →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((p) => (
              <div
                key={p.id}
                className="tech-card p-6 flex flex-col justify-between group"
              >
                <div>
                  <Link href={`/product/${p.id}`} className="block">
                    <div className="h-48 flex items-center justify-center relative p-4 bg-black/40 rounded-2xl mb-5 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image || '/assets/techcart/headphones.jpg'}
                        alt={p.name}
                        className="max-h-40 w-auto object-contain rounded-xl drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)] group-hover:scale-105 transition-transform duration-300"
                      />
                      {p.stock <= 0 && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold uppercase font-mono">
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
                    <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide mt-1 group-hover:text-[#2563EB] transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                    {p.description}
                  </p>
                </div>

                <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-heading font-bold text-lg text-white">
                      ₹{(p.price_paise / 100).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{p.stock} in stock</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/product/${p.id}`}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
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
        </div>
      </section>

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
