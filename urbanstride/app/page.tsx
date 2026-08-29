'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import { FOOTWEAR_PRODUCTS, Product } from '@/lib/products';

export default function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('9');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const featured = FOOTWEAR_PRODUCTS.slice(0, 4);

  const handleQuickBuy = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize(product.sizes[0] || '9');
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-28 bg-gradient-to-b from-[#080C14] via-[#0E1524] to-[#080C14]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(249,115,22,0.15)_0%,_transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold">
              <span>🔥 2026 Spring Marathon Drop</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Unstoppable Velocity</span>.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Ultra-lightweight foam cushioning, high-traction mountain rubber, and instant autonomous AI purchasing enabled by CatalogX and Razorpay.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 transition-all"
              >
                Explore Footwear Drops →
              </Link>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all"
              >
                Try AI Buyer Agent 🤖
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/60 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <div className="text-2xl font-black text-white">25+</div>
                <div className="text-[11px] text-slate-500 font-medium">Curated Drops</div>
              </div>
              <div>
                <div className="text-2xl font-black text-orange-400">100%</div>
                <div className="text-[11px] text-slate-500 font-medium">Agent Transactable</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white">₹1.5k</div>
                <div className="text-[11px] text-slate-500 font-medium">Auto-Spend Cap</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Card */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="absolute w-72 h-72 rounded-full bg-orange-500/20 blur-3xl animate-glow pointer-events-none" />
            <div className="relative bg-gradient-to-b from-slate-800/40 to-slate-900/60 p-8 rounded-3xl border border-slate-700/60 backdrop-blur-md shadow-2xl max-w-md w-full">
              <div className="relative h-64 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/urbanstride/Shoe1.png"
                  alt="Nike Revolution 6"
                  className="max-h-60 w-auto object-contain animate-float drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
                />
              </div>

              <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-orange-400 uppercase font-mono">Featured Hero</div>
                  <div className="text-base font-bold text-white">Nike Revolution 6</div>
                  <div className="text-xs text-slate-400">Road Running · Responsive Foam</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">₹2,499</div>
                  <button
                    onClick={() => handleQuickBuy(FOOTWEAR_PRODUCTS[0])}
                    className="mt-1 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Drops Grid */}
      <section className="py-16 bg-[#080C14] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Trending Performance Drops</h2>
            <p className="text-xs text-slate-400 mt-1">Autonomous 1-click purchases enabled with TokenHQ</p>
          </div>
          <Link href="/products" className="text-xs font-bold text-orange-400 hover:text-orange-300">
            View All 25 Shoes →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
            <div
              key={p.id}
              className="group bg-[#0D1322] border border-slate-800/80 rounded-2xl p-5 hover:border-orange-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-44 flex items-center justify-center relative p-4 bg-slate-900/40 rounded-xl mb-4 group-hover:scale-105 transition-transform">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image || '/assets/urbanstride/Shoe1.png'}
                    alt={p.name}
                    className="max-h-36 w-auto object-contain"
                  />
                  {p.stock <= 0 && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold">
                      Sold Out
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-orange-400 uppercase font-mono font-semibold">{p.brand}</div>
                <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
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
                    className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        selectedSize={selectedSize}
      />
    </div>
  );
}
