'use client';

import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#080C14]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-black font-extrabold text-lg shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>UrbanStride</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Agent-Ready
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Performance Footwear</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/products" className="hover:text-white transition-colors">
            Catalog & Shoes
          </Link>
          <Link href="/products?category=running-shoes" className="hover:text-white transition-colors">
            Running
          </Link>
          <Link href="/products?category=hiking-boots" className="hover:text-white transition-colors">
            Trail & Hiking
          </Link>
          <Link href="/products?category=casual-sneakers" className="hover:text-white transition-colors">
            Sneakers
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>CatalogX Agent</span>
          </a>

          <Link
            href="/products"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </header>
  );
}
