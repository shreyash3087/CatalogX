'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#020306] border-t border-white/5 text-slate-400 text-xs mt-auto relative z-20">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/techcart/logo.png"
                  alt="TechCart Logo"
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                />
              </div>
              <div className="font-heading font-bold text-xl text-white tracking-tight leading-none">
                TechCart
              </div>
            </Link>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed font-normal">
              High-fidelity audio, studio-grade ANC, AMOLED displays and powerful computing gear. Engineered for the modern digital lifestyle with instant Razorpay checkout.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              Agent Discovery: <a href="/.well-known/agent-catalog" className="text-blue-400 hover:underline">/.well-known/agent-catalog</a>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <div className="font-heading font-bold text-white uppercase tracking-wider text-sm">Hardware</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products" className="hover:text-white transition-colors">Wireless Audio & ANC</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Bluetooth Smartwatches</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Mechanical Keyboards</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">All Electronics Catalog</Link></li>
            </ul>
          </div>

          {/* Brands */}
          <div className="space-y-3">
            <div className="font-heading font-bold text-white uppercase tracking-wider text-sm">Top Brands</div>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products" className="hover:text-white transition-colors">Sony High-Resolution</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">boAt Rockerz Audio</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Samsung Galaxy Gear</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Logitech Computing</Link></li>
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
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>© {new Date().getFullYear()} TechCart Electronics Inc. All rights reserved.</div>
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
