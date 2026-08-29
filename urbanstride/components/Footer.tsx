'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#05080E] border-t border-slate-900 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-black font-extrabold text-sm">
                ⚡
              </div>
              <span className="text-sm font-bold text-white tracking-tight">UrbanStride Footwear</span>
            </div>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              Engineered for velocity, long-distance road runs, and rough mountain trails. Fully enabled for the CatalogX Agentic Commerce Protocol and Razorpay TokenHQ e-mandates.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Manifest: <a href="/.well-known/agent-catalog" className="text-blue-400 hover:underline">/.well-known/agent-catalog</a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <div className="text-white font-bold uppercase tracking-wider text-[11px]">Collections</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/products?category=running-shoes" className="hover:text-white transition-colors">Marathon & Road Running</Link></li>
              <li><Link href="/products?category=hiking-boots" className="hover:text-white transition-colors">Waterproof Trail Boots</Link></li>
              <li><Link href="/products?category=casual-sneakers" className="hover:text-white transition-colors">Streetwear Lifestyle</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">All 25 Footwear Drops</Link></li>
            </ul>
          </div>

          {/* Integration & Admin Portal */}
          <div className="space-y-2">
            <div className="text-white font-bold uppercase tracking-wider text-[11px]">Agent & Staff</div>
            <ul className="space-y-1.5 text-[11px]">
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
                  className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-orange-400 font-semibold border-b border-dashed border-slate-700 hover:border-orange-400 pb-0.5 transition-colors"
                >
                  <span>Merchant Admin Portal</span>
                  <span>🔒</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-500">
          <div>© {new Date().getFullYear()} UrbanStride Footwear. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-slate-300 transition-colors">Staff Login</Link>
            <span>·</span>
            <span>Powered by Razorpay Agentic Commerce</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
