'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import { FOOTWEAR_PRODUCTS } from '@/lib/products';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = FOOTWEAR_PRODUCTS.find((p) => p.id === id) || FOOTWEAR_PRODUCTS[0];
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || '9');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#080C14]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link href="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-white">Catalog</Link>
          <span>/</span>
          <span className="text-slate-300 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Product Image */}
          <div className="lg:col-span-7 bg-[#0E1524] border border-slate-800 rounded-3xl p-10 flex items-center justify-center relative min-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || '/assets/urbanstride/Shoe1.png'}
              alt={product.name}
              className="max-h-80 w-auto object-contain drop-shadow-[0_25px_35px_rgba(0,0,0,0.7)] hover:scale-105 transition-transform duration-300"
            />
            {product.stock <= 0 && (
              <span className="absolute top-6 right-6 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                Out of Stock
              </span>
            )}
          </div>

          {/* Right: Product Details & Purchase Form */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                {product.brand} · {product.category}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mt-1">{product.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-black text-white">₹{(product.price_paise / 100).toLocaleString('en-IN')}</span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Sold Out'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">Select UK/India Size:</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-12 h-10 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedSize === s
                        ? 'bg-orange-500 text-black border-orange-500 shadow-md shadow-orange-500/20'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={product.stock <= 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <span>⚡ Buy Now with Razorpay</span>
              </button>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs text-slate-400">
                <div className="text-white font-bold flex items-center gap-1.5">
                  <span>🤖 CatalogX Agentic Enabled</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Autonomous AI buyer agents can purchase this item headless via Razorpay TokenHQ e-mandates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        selectedSize={selectedSize}
      />
    </div>
  );
}
