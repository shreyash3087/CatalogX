'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CheckoutModal from '@/components/CheckoutModal';
import { ELECTRONICS_PRODUCTS } from '@/lib/products';

export default function TechCartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const product = ELECTRONICS_PRODUCTS.find((p) => p.id === id) || ELECTRONICS_PRODUCTS[0];
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#06080F]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link href="/" className="hover:text-cyan-400">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-cyan-400">Electronics</Link>
          <span>/</span>
          <span className="text-slate-300 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Product Image */}
          <div className="lg:col-span-7 bg-[#0A1020] border border-cyan-950/80 rounded-3xl p-10 flex items-center justify-center relative min-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || '/assets/techcart/headphones.jpg'}
              alt={product.name}
              className="max-h-80 w-auto object-contain rounded-2xl drop-shadow-[0_25px_35px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-300"
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
              <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                {product.brand} · {product.category}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight mt-1">{product.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-2xl font-black text-white">₹{(product.price_paise / 100).toLocaleString('en-IN')}</span>
                <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Sold Out'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              {product.description}
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="text-white font-bold">Hardware Specifications:</div>
              <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
                <div>Brand: <span className="text-slate-200">{product.brand}</span></div>
                <div>Category: <span className="text-slate-200">{product.category}</span></div>
                <div>Tags: <span className="text-slate-200">{product.tags.join(', ')}</span></div>
                <div>Protocol: <span className="text-cyan-400 font-mono font-bold">TokenHQ Agent</span></div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={product.stock <= 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <span>⚡ Buy Now with Razorpay</span>
              </button>

              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1 text-xs text-slate-400">
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
      />
    </div>
  );
}
