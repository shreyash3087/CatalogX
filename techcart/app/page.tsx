'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TechCartCartDrawer, { CartItem } from '@/components/CartDrawer';
import { ELECTRONICS_PRODUCTS, Product } from '@/lib/products';

const HARDWARE_COLLECTIONS = [
  {
    title: 'High-Res Audio & ANC',
    category: 'audio',
    tag: 'Studio Fidelity',
    price: 'From 1,499',
    image: '/assets/techcart/headphones.jpg',
    desc: '40mm dynamic drivers with up to 45dB hybrid noise cancellation.',
  },
  {
    title: 'True Wireless Earbuds',
    category: 'audio',
    tag: 'IP55 Sweatproof',
    price: 'From 2,199',
    image: '/assets/techcart/earbuds.jpg',
    desc: '12.4mm titanium drivers with ultra-low latency gaming mode.',
  },
  {
    title: 'Mechanical Keyboards',
    category: 'computing',
    tag: 'Hot-Swappable',
    price: 'From 7,499',
    image: '/assets/techcart/keyboard.jpg',
    desc: 'Gateron G-Pro switches with Mac & Windows wireless support.',
  },
  {
    title: 'AMOLED Smartwatches',
    category: 'wearables',
    tag: '60Hz AMOLED',
    price: 'From 2,999',
    image: '/assets/techcart/smartwatch.jpg',
    desc: '1.96-inch high-refresh display with Bluetooth calling & health sensors.',
  },
];

const BRAND_NAMES = ['SONY', 'KEYCHRON', 'ONEPLUS', 'BOAT', 'NOISE', 'SONY', 'KEYCHRON', 'ONEPLUS', 'BOAT', 'NOISE'];

/* Inline SVG Icons for value props */
function WaveformIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 13a2 2 0 0 0 2-2V7a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0V4a2 2 0 0 1 4 0v13a2 2 0 0 0 4 0v-4a2 2 0 0 1 2-2"/>
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
function TruckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>
    </svg>
  );
}
function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}

export default function TechCartHomePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 14;
      const y = (e.clientY / window.innerHeight - 0.5) * 14;
      setMouseOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFBF7] text-[#0C1220] font-sans">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      {/* =============================================
          1. HERO SECTION
         ============================================= */}
      <section
        id="hero"
        className="relative overflow-hidden bg-[#FDFBF7] min-h-[85vh] flex items-center"
      >
        {/* Subtle background circle behind hero image */}
        <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#F0E9DE] via-[#E8DFD0] to-[#F5F0E8] opacity-70 pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 py-14">

          {/* Hero Left: Content */}
          <div className="lg:col-span-5 space-y-6">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F5F0E8] border border-[#E8E0D4] text-[11px] font-mono text-[#9C9589]">
              <span className="w-2 h-2 rounded-full bg-[#C67D3A]" />
              <span>NEXT-GEN AUDIO 2026</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-extrabold text-[48px] sm:text-[60px] xl:text-[72px] leading-[0.92] tracking-tight text-[#0C1220]">
              Hear It.<br />
              Feel It.<br />
              <span className="text-[#C67D3A]">Own It.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[14px] text-[#5A5549] font-normal max-w-md leading-relaxed">
              Premium audio gear for those who expect more from every beat. Studio-grade acoustics and next-gen computing hardware, delivered to your doorstep.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="tc-chip">45dB Hybrid ANC</span>
              <span className="tc-chip">70H Battery</span>
              <span className="tc-chip">Hot-Swappable</span>
              <span className="tc-chip">Hi-Res Audio</span>
            </div>

            {/* CTA Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/products"
                className="px-7 py-3.5 rounded-xl bg-[#C67D3A] hover:bg-[#A8622C] text-white font-heading font-bold text-[13px] uppercase tracking-wider transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-[#C67D3A]/20"
              >
                <span>EXPLORE COLLECTION</span>
                <ArrowRightIcon size={14} />
              </Link>

              <Link
                href="/#matrix"
                className="px-6 py-3.5 rounded-xl border border-[#D4C9B9] hover:border-[#0C1220] text-[#0C1220] font-heading font-bold text-[13px] uppercase tracking-wider transition-colors"
              >
                SPEC MATRIX
              </Link>
            </div>
          </div>

          {/* Hero Right: Floating Headphone Showcase */}
          <div className="lg:col-span-7 relative flex items-center justify-center min-h-[400px]">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
              <span
                className="font-heading font-extrabold uppercase text-[#0C1220]/[0.03] whitespace-nowrap"
                style={{ fontSize: 'clamp(80px, 12vw, 160px)', letterSpacing: '-0.02em' }}
              >
                TECHCART
              </span>
            </div>

            <div
              className="relative z-10 transition-transform duration-200 ease-out"
              style={{ transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/techcart/hero_headphones.png"
                alt="TechCart Premium Headphones"
                className="w-full max-w-[440px] drop-shadow-[0_30px_60px_rgba(12,18,32,0.15)] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          2. SCROLLING BRAND MARQUEE
         ============================================= */}
      <section className="py-6 bg-[#F5F0E8] border-y border-[#E8E0D4] overflow-hidden">
        <div className="tc-marquee-track">
          {[...BRAND_NAMES, ...BRAND_NAMES].map((name, i) => (
            <div key={i} className="flex items-center gap-12 px-6 flex-shrink-0">
              <span className="font-heading font-extrabold text-[22px] text-[#0C1220]/20 uppercase tracking-widest whitespace-nowrap">
                {name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4C9B9]" />
            </div>
          ))}
        </div>
      </section>

      {/* =============================================
          3. CATEGORY CARDS (Staggered 2-Column)
         ============================================= */}
      <section id="matrix" className="py-16 bg-[#FDFBF7]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#C67D3A] mb-1">
                Precision Categories
              </div>
              <h2 className="font-heading font-extrabold text-[36px] sm:text-[44px] text-[#0C1220] uppercase tracking-tight leading-none">
                Hardware Matrix
              </h2>
            </div>
            <Link
              href="/products"
              className="text-[12px] font-bold text-[#9C9589] hover:text-[#0C1220] uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <span>View All Products</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>

          {/* Staggered grid: 2 columns with offset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {HARDWARE_COLLECTIONS.map((col, idx) => (
              <Link
                key={col.title}
                href={`/products?category=${col.category}`}
                className={`tc-category-card group flex flex-col ${idx % 2 === 1 ? 'sm:mt-8' : ''}`}
              >
                {/* Image area */}
                <div className="bg-[#F5F0E8] p-6 flex items-center justify-center h-[220px] sm:h-[260px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={col.image}
                    alt={col.title}
                    className="tc-cat-img max-h-44 w-auto object-contain"
                  />
                </div>

                {/* Info */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="tc-chip">{col.tag}</span>
                    <span className="text-[12px] font-mono font-semibold text-[#C67D3A]">{col.price}</span>
                  </div>
                  <h3 className="font-heading font-bold text-[18px] text-[#0C1220] uppercase tracking-wide group-hover:text-[#C67D3A] transition-colors">
                    {col.title}
                  </h3>
                  <p className="text-[12px] text-[#9C9589] leading-relaxed mt-1.5">
                    {col.desc}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          4. FLAGSHIP HARDWARE SHOWCASE
         ============================================= */}
      <section id="flagship" className="py-16 bg-[#F5F0E8] border-y border-[#E8E0D4]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#C67D3A] mb-1">
                Featured Releases
              </div>
              <h2 className="font-heading font-extrabold text-[36px] sm:text-[44px] text-[#0C1220] uppercase tracking-tight leading-none">
                Flagship Gear
              </h2>
            </div>
            <Link
              href="/products"
              className="text-[12px] font-bold text-[#9C9589] hover:text-[#0C1220] uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <span>Browse Complete Catalog</span>
              <ArrowRightIcon size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ELECTRONICS_PRODUCTS.map((p) => (
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

                {/* Card Body */}
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
        </div>
      </section>

      {/* =============================================
          5. WHY TECHCART (Value Props - 2x2 grid)
         ============================================= */}
      <section id="about" className="py-16 bg-[#FDFBF7]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8">
          <div className="text-center mb-10">
            <div className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#C67D3A] mb-2">
              Why TechCart
            </div>
            <h2 className="font-heading font-extrabold text-[36px] sm:text-[44px] text-[#0C1220] uppercase tracking-tight leading-none">
              Built for Precision
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[900px] mx-auto">
            {[
              { icon: <WaveformIcon />, title: 'Studio-Grade Acoustics', sub: 'Custom tuned 12.4mm to 40mm drivers for flat, reference-quality audio response across the entire frequency range.' },
              { icon: <ShieldIcon />, title: '1-Year Warranty', sub: 'Direct hassle-free hardware replacement on all verified gear. Zero paperwork, zero excuses.' },
              { icon: <TruckIcon />, title: 'Express Dispatch', sub: 'Bluedart air express delivery across all metro pincodes. Track every step from warehouse to doorstep.' },
              { icon: <LockIcon />, title: 'Secure Razorpay Checkout', sub: 'Instant payment verification with 100% tokenized protection. Your card data never touches our servers.' },
            ].map((b) => (
              <div key={b.title} className="p-6 rounded-2xl bg-white border border-[#E8E0D4] space-y-3 hover:border-[#D4C9B9] transition-colors">
                <div className="w-11 h-11 rounded-xl bg-[#C67D3A]/10 border border-[#C67D3A]/20 flex items-center justify-center text-[#C67D3A]">
                  {b.icon}
                </div>
                <div className="font-heading font-bold text-[16px] text-[#0C1220] uppercase">{b.title}</div>
                <p className="text-[12.5px] text-[#9C9589] leading-relaxed">{b.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          6. AUTHORIZED HARDWARE BRANDS
         ============================================= */}
      <section id="brands" className="py-10 bg-[#F5F0E8] border-t border-[#E8E0D4]">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 text-center space-y-5">
          <div className="text-[9.5px] font-mono font-bold tracking-[0.25em] uppercase text-[#9C9589]">
            Authorized Hardware Partners
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {['SONY PRO', 'KEYCHRON', 'ONEPLUS', 'BOAT AUDIO', 'NOISE'].map((b) => (
              <div
                key={b}
                className="py-3.5 px-4 rounded-xl bg-white border border-[#E8E0D4] font-heading font-bold text-[13px] text-[#9C9589] hover:text-[#0C1220] hover:border-[#D4C9B9] transition-all cursor-default"
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

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