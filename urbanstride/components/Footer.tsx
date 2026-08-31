'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer id="about" className="bg-[#050608] border-t border-slate-900 text-slate-400 text-xs mt-auto relative z-20">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-8 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/urbanstride/logo.png"
                  alt="UrbanStride"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="font-heading font-semibold text-2xl text-white tracking-wider">
                UrbanStride
              </div>
            </Link>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              Crafting premium footwear designed for peak human performance and streetwear luxury. Every pair is engineered with aerospace-grade cushioning and anti-abrasion outsoles.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Agent Discovery: <a href="/.well-known/agent-catalog" className="text-blue-400 hover:underline">/.well-known/agent-catalog</a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <div className="font-heading font-bold text-white uppercase tracking-wider text-sm">Collections</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products?category=running-shoes" className="hover:text-white transition-colors">Marathon Running</Link></li>
              <li><Link href="/products?category=hiking-boots" className="hover:text-white transition-colors">Waterproof Trail Boots</Link></li>
              <li><Link href="/products?category=casual-sneakers" className="hover:text-white transition-colors">Lifestyle Sneakers</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">All 25 Footwear Drops</Link></li>
            </ul>
          </div>

          {/* Brands */}
          <div className="space-y-3">
            <div className="font-heading font-bold text-white uppercase tracking-wider text-sm">Top Brands</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products" className="hover:text-white transition-colors">Nike Revolution Series</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Adidas Cloudfoam</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Puma Velocity NITRO</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">New Balance Fresh Foam</Link></li>
            </ul>
          </div>

          {/* Integration & Admin Portal */}
          <div className="space-y-3">
            <div className="font-heading font-bold text-white uppercase tracking-wider text-sm">Protocol & Staff</div>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="http://localhost:3000" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                  CatalogX AI Buyer Agent ↗
                </a>
              </li>
              <li>
                <a href="https://razorpay.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Razorpay TokenHQ Vault
                </a>
              </li>
              <li className="pt-2">
                {/* Subtle Merchant Admin Login Link */}
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold border-b border-dashed border-slate-700 hover:border-white pb-0.5 transition-colors"
                >
                  <span>Merchant Admin Portal</span>
                  <span>🔒</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} UrbanStride Footwear Inc. All rights reserved.</div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="hover:text-slate-300 transition-colors">Staff Login</Link>
            <span>·</span>
            <span>Powered by Razorpay Agentic Commerce</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
