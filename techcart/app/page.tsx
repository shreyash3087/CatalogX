'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import { ELECTRONICS_PRODUCTS, Product } from '@/lib/products';

export default function TechCartHomePage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const featured = ELECTRONICS_PRODUCTS.slice(0, 4);

  const handleQuickBuy = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:py-28 bg-gradient-to-b from-[#06080F] via-[#0A1020] to-[#06080F]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.15)_0%,_transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold font-mono">
              <span>⚡ Quantum Hardware & Audio</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
              Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Autonomous Computing</span> & Audio.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Wireless noise-cancelling headphones, Bluetooth calling smartwatches, and tactile mechanical keyboards — ready for 1-click autonomous purchasing.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="/products"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition-all"
              >
                Browse Hardware Drops →
              </Link>
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-all"
              >
                Launch CatalogX Buyer Agent 🤖
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/60 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <div className="text-2xl font-black text-white">15+</div>
                <div className="text-[11px] text-slate-500 font-medium">Gadget Models</div>
              </div>
              <div>
                <div className="text-2xl font-black text-cyan-400">100%</div>
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
            <div className="absolute w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl animate-cyber-glow pointer-events-none" />
            <div className="relative bg-gradient-to-b from-slate-900/60 to-[#0B132B]/80 p-8 rounded-3xl border border-cyan-500/30 backdrop-blur-md shadow-2xl max-w-md w-full">
              <div className="relative h-64 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/techcart/headphones.jpg"
                  alt="boAt Rockerz 450 Pro"
                  className="max-h-60 w-auto object-contain rounded-2xl drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-cyan-400 uppercase font-mono">Featured Audio</div>
                  <div className="text-base font-bold text-white">boAt Rockerz 450 Pro</div>
                  <div className="text-xs text-slate-400">70h Playback · Extra Bass</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-white">₹1,499</div>
                  <button
                    onClick={() => handleQuickBuy(ELECTRONICS_PRODUCTS[0])}
                    className="mt-1 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Hardware Drops */}
      <section className="py-16 bg-[#06080F] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Trending Hardware Drops</h2>
            <p className="text-xs text-slate-400 mt-1">Autonomous 1-click purchases enabled with Razorpay TokenHQ</p>
          </div>
          <Link href="/products" className="text-xs font-bold text-cyan-400 hover:text-cyan-300">
            View All Hardware →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
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

                <div className="text-[10px] text-cyan-400 uppercase font-mono font-semibold">{p.brand}</div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
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
      </section>

      <Footer />

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
}
