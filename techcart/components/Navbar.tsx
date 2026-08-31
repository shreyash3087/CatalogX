'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  cartCount?: number;
  onOpenCart?: () => void;
};

export default function Navbar({ cartCount = 0, onOpenCart }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 nav-pure-blur">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 flex items-center justify-center group-hover:scale-105 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/techcart/logo.png"
              alt="TechCart Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(37,99,235,0.6)]"
            />
          </div>
          <div>
            <div className="font-heading font-bold text-xl text-white tracking-tight leading-none">
              TechCart
            </div>
            <span className="text-[7.5px] font-semibold tracking-[0.25em] text-slate-400 block mt-0.5 uppercase font-mono">
              ELECTRONICS
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-9 font-medium text-xs sm:text-[13px] text-slate-300">
          <Link href="/#hero" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/products" className="hover:text-white transition-colors font-bold text-white">
            Collections
          </Link>
          <Link href="/products?category=audio" className="hover:text-white transition-colors">
            Audio & ANC
          </Link>
          <Link href="/products?category=wearables" className="hover:text-white transition-colors">
            Wearables
          </Link>
          <Link href="/products?category=computing" className="hover:text-white transition-colors">
            Computing
          </Link>
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-5">
          <Link
            href="/products"
            className="text-slate-300 hover:text-white transition-colors p-1"
            title="Search Hardware"
          >
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </Link>

          {/* Interactive Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative text-slate-300 hover:text-white transition-colors p-1 flex items-center cursor-pointer"
            title="Open Hardware Cart"
          >
            <i className="fa-solid fa-bag-shopping text-base"></i>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#2563EB] text-white font-mono text-[9px] font-bold flex items-center justify-center ml-1 shadow">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
