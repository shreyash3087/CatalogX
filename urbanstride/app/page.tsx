'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer, { CartItem } from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import { FOOTWEAR_PRODUCTS, Product } from '@/lib/products';

export default function UrbanStrideHomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('9');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Mouse Parallax on Hero Shoe
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 26;
      const y = (e.clientY / window.innerHeight - 0.5) * 26;
      setMouseOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('urbanstride_cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {}
  }, []);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('urbanstride_cart', JSON.stringify(newCart));
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

  const featured = FOOTWEAR_PRODUCTS.slice(0, 4);

  const handleQuickBuy = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || '9');
    setIsModalOpen(true);
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen bg-[#080B11] text-slate-100 font-sans selection:bg-white selection:text-black">
      <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

      {/* 1. HERO SECTION WITH MOUSE MOVE PARALLAX */}
      <section
        id="hero"
        className="relative min-h-[92vh] pt-28 pb-16 flex items-center overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/urbanstride/hero_bg.png')",
          backgroundColor: '#080B11',
        }}
      >
        {/* Subtle gradient overlay on left for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#080B11]/90 via-[#080B11]/50 to-transparent pointer-events-none z-0" />

        {/* Large Rock Base Layer anchored to absolute bottom-right */}
        <div className="absolute bottom-0 right-0 w-full max-w-[850px] lg:max-w-[1050px] xl:max-w-[1200px] z-10 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/urbanstride/hero_layer_2_rock.png"
            alt="Rock Base"
            className="w-full h-auto object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
          />
        </div>

        {/* Floating Shoes Hero Layer with Interactive Mouse Move Parallax */}
        <div
          className="absolute bottom-16 right-8 sm:right-16 lg:right-24 xl:right-32 w-[340px] sm:w-[480px] lg:w-[560px] xl:w-[640px] z-20 pointer-events-none transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${mouseOffset.x}px, ${mouseOffset.y}px, 0)`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/urbanstride/hero_layer_1_shoes.png"
            alt="UrbanStride Hero Shoes"
            className="w-full h-auto object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.9)]"
          />
        </div>

        {/* Right Social & Vertical Scroll Bar */}
        <div className="hidden xl:flex flex-col items-center gap-6 absolute right-8 top-1/2 -translate-y-1/2 z-30 text-slate-400 text-xs font-mono">
          <div className="writing-vertical uppercase text-[9px] tracking-[0.25em] text-slate-300 mb-1">
            SCROLL TO EXPLORE
          </div>
          <div className="w-[1px] h-10 bg-slate-600 mb-1" />
          <a href="#" className="hover:text-white transition-colors"><i className="fa-brands fa-instagram"></i></a>
          <a href="#" className="hover:text-white transition-colors"><i className="fa-brands fa-facebook-f"></i></a>
          <a href="#" className="hover:text-white transition-colors"><i className="fa-brands fa-x-twitter"></i></a>
        </div>

        {/* Left Hero Content Box */}
        <div className="max-w-7xl mx-auto px-6 sm:px-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-20">
          <div className="lg:col-span-7 space-y-6 text-left max-w-2xl">
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold uppercase tracking-wider text-slate-200">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Spring 2026 Marathon Collection</span>
            </div>

            {/* Headline */}
            <h1 className="font-heading font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight uppercase text-white drop-shadow-lg">
              UNLEASH YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">STRIDE</span> WITH <br />
              <span className="text-blue-500">MAXIMUM VELOCITY</span>.
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-lg drop-shadow">
              Aerospace foam cushioning, dynamic energy return, and anti-slip mountain outsoles. Designed for relentless athletes and streetwear connoisseurs.
            </p>

            {/* CTA Buttons (Exact Image 4 Design) */}
            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <Link
                href="/products"
                className="px-8 py-3.5 rounded-2xl bg-white text-black hover:bg-slate-200 font-heading font-bold text-xs uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>SHOP COLLECTION</span>
                <span>→</span>
              </Link>
              <a
                href="#brands"
                className="px-8 py-3.5 rounded-2xl bg-white/[0.03] border border-white/20 hover:border-white text-white font-heading font-bold text-xs uppercase tracking-wider transition-all hover:bg-white/10"
              >
                EXPLORE BRANDS
              </a>
            </div>

            {/* 3 Trust Badges (Exact Image 4 Design) */}
            <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-white/10 max-w-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-xs flex-shrink-0">
                  <i className="fa-solid fa-check"></i>
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">100% Authentic</div>
                  <div className="text-[10px] text-slate-400">Sourced Genuine</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-xs flex-shrink-0">
                  <i className="fa-solid fa-rotate-left"></i>
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Easy Returns</div>
                  <div className="text-[10px] text-slate-400">Hassle Free</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white text-xs flex-shrink-0">
                  <i className="fa-solid fa-truck-fast"></i>
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Free Shipping</div>
                  <div className="text-[10px] text-slate-400">On all orders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CURATED COLLECTIONS GRID */}
      <section id="collections" className="py-20 bg-[#080B11] relative z-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest mb-1">
                SEASONAL HIGHLIGHTS
              </div>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white uppercase tracking-tight">
                Curated Collections
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>View All Sneakers</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Marathon & Road Running',
                category: 'running-shoes',
                image: '/assets/urbanstride/Image1.png',
                desc: 'Ultra-light responsive foam for long miles and road speed.',
                price: 'From ₹1,499',
              },
              {
                title: 'Trail & Mountain Trekking',
                category: 'hiking-boots',
                image: '/assets/urbanstride/Image2.png',
                desc: 'Waterproof Gore-Tex lining with heavy-duty rock grip outsoles.',
                price: 'From ₹2,999',
              },
              {
                title: 'Streetwear Lifestyle',
                category: 'casual-sneakers',
                image: '/assets/urbanstride/Image3.png',
                desc: 'Timeless low-top and high-top silhouettes in premium leather.',
                price: 'From ₹3,899',
              },
              {
                title: 'All-Terrain Athletics',
                category: 'running-shoes',
                image: '/assets/urbanstride/Image4.png',
                desc: 'Cross-functional athletic shoes for track, court, and gym training.',
                price: 'From ₹999',
              },
            ].map((col, idx) => (
              <Link
                key={idx}
                href={`/products?category=${col.category}`}
                className="collection-card group block h-[400px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={col.image}
                  alt={col.title}
                  className="collection-img"
                />

                <div className="collection-content-bottom">
                  <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest">
                    {col.price}
                  </span>
                  <h3 className="font-heading font-bold text-xl text-white uppercase tracking-wide mt-1 leading-tight">
                    {col.title}
                  </h3>

                  <div className="collection-hover-details">
                    <p className="text-xs text-slate-300 leading-relaxed font-normal">
                      {col.desc}
                    </p>
                    <span className="inline-block mt-3 text-xs font-bold text-white uppercase tracking-wider border-b border-white pb-0.5">
                      Explore Drops →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. TRENDING FOOTWEAR DROPS */}
      <section className="py-20 bg-[#0C1017] border-t border-slate-900 relative z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest mb-1">
                TOP PICKS
              </div>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white uppercase tracking-tight">
                Trending Performance Drops
              </h2>
            </div>
            <Link
              href="/products"
              className="text-xs font-bold text-slate-300 hover:text-white uppercase tracking-wider"
            >
              Browse 25 Models →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((p) => (
              <div
                key={p.id}
                className="sneaker-card p-6 flex flex-col justify-between group"
              >
                <div>
                  <Link href={`/product/${p.id}`} className="block">
                    <div className="h-48 flex items-center justify-center relative p-4 bg-black/40 rounded-2xl mb-5 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image || '/assets/urbanstride/Shoe1.png'}
                        alt={p.name}
                        className="sneaker-img max-h-40 w-auto object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
                      />
                      {p.stock <= 0 && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold uppercase">
                          Sold Out
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center justify-between text-[11px] text-blue-400 uppercase font-mono font-semibold">
                    <span>{p.brand}</span>
                    <span className="text-slate-400">★ {p.rating || '4.8'}</span>
                  </div>

                  <Link href={`/product/${p.id}`}>
                    <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide mt-1 group-hover:text-blue-400 transition-colors line-clamp-1">
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
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
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

      {/* 4. BRAND PARTNERS GRID */}
      <section id="brands" className="py-14 bg-[#080B11] border-t border-slate-900 relative z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 text-center space-y-6">
          <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest">
            AUTHENTIC AUTHORIZED RETAILER
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center justify-center opacity-70">
            {['NIKE', 'ADIDAS', 'PUMA', 'NEW BALANCE', 'SKECHERS', 'SALOMON'].map((b) => (
              <div
                key={b}
                className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 font-heading font-bold text-base text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-default"
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SPLIT SECTION (EXACT IMAGE 3 COMPACT DESIGN: WHY CHOOSE US & 15% OFF PROMO) */}
      <section id="about" className="w-full border-t border-slate-900 relative z-20">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 min-h-[300px]">
          {/* Left Half: Cream Container (Why Choose Us) */}
          <div className="lg:col-span-6 bg-[#EFECE7] text-slate-900 px-8 sm:px-12 py-8 sm:py-10 flex flex-col justify-center">
            <div className="max-w-xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Part of Cream: Headline & CTA */}
              <div className="md:col-span-6 space-y-3">
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-500">
                  WHY CHOOSE US
                </div>
                <h2 className="font-heading font-bold text-3xl sm:text-4xl text-black uppercase leading-[0.95] tracking-tight">
                  MORE THAN <br />
                  JUST SNEAKERS
                </h2>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  We bring you the best quality, top brands and a seamless shopping experience.
                </p>
                <div className="pt-1">
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-slate-900 transition-colors shadow"
                  >
                    <span>LEARN MORE</span>
                    <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </Link>
                </div>
              </div>

              {/* Right Part of Cream: 4 Features */}
              <div className="md:col-span-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg border border-slate-400/40 flex items-center justify-center text-slate-900 text-xs flex-shrink-0">
                    <i className="fa-regular fa-circle-check text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black leading-tight">Premium Quality</div>
                    <div className="text-[10px] text-slate-500 font-normal">Top grade materials</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg border border-slate-400/40 flex items-center justify-center text-slate-900 text-xs flex-shrink-0">
                    <i className="fa-regular fa-credit-card text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black leading-tight">Secure Payments</div>
                    <div className="text-[10px] text-slate-500 font-normal">100% protected</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg border border-slate-400/40 flex items-center justify-center text-slate-900 text-xs flex-shrink-0">
                    <i className="fa-solid fa-headset text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black leading-tight">Customer Support</div>
                    <div className="text-[10px] text-slate-500 font-normal">We're here to help</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg border border-slate-400/40 flex items-center justify-center text-slate-900 text-xs flex-shrink-0">
                    <i className="fa-regular fa-gem text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-black leading-tight">Member Benefits</div>
                    <div className="text-[10px] text-slate-500 font-normal">Exclusive perks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Half: Dark Full-Width Container with limited_offer_section_bg.png */}
          <div
            className="lg:col-span-6 bg-cover bg-center text-white px-8 sm:px-12 py-8 sm:py-10 flex flex-col justify-center relative overflow-hidden"
            style={{ backgroundImage: "url('/assets/urbanstride/limited_offer_section_bg.png')" }}
          >
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            <div className="max-w-md space-y-3 relative z-10">
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-slate-400">
                LIMITED TIME OFFER
              </div>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white uppercase leading-[0.95] tracking-tight">
                GET 15% OFF <br />
                ON YOUR FIRST ORDER
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
                Join our community and unlock exclusive footwear drops and promotions.
              </p>

              {/* Newsletter Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you for subscribing! 15% discount code STRIDE15 has been activated.');
                }}
                className="flex max-w-sm rounded-xl overflow-hidden border border-white/20 bg-black/50 p-1"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="bg-transparent text-white px-3 py-2 text-xs placeholder-slate-400 focus:outline-none flex-1 font-sans"
                />
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#EFECE7] hover:bg-white text-black font-heading font-bold text-xs uppercase tracking-wider transition-colors rounded-lg cursor-pointer"
                >
                  SUBSCRIBE
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Direct Buy Checkout Modal */}
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        selectedSize={selectedSize}
      />
    </div>
  );
}
