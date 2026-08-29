'use client';

import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#06080F]/90 backdrop-blur-md border-b border-cyan-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-extrabold text-lg shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <div className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              <span>TechCart</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Agent-Ready
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Next-Gen Electronics</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <Link href="/products" className="hover:text-cyan-400 transition-colors">
            All Hardware
          </Link>
          <Link href="/products" className="hover:text-cyan-400 transition-colors">
            Audio & TWS
          </Link>
          <Link href="/products" className="hover:text-cyan-400 transition-colors">
            Smartwatches
          </Link>
          <Link href="/products" className="hover:text-cyan-400 transition-colors">
            Keyboards
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>CatalogX Agent</span>
          </a>

          <Link
            href="/products"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            Explore Drops
          </Link>
        </div>
      </div>
    </header>
  );
}
