'use client';

import React from 'react';
import Link from 'next/link';

type Props = {
  cartCount?: number;
  onOpenCart?: () => void;
};

export default function Navbar({ cartCount = 0, onOpenCart }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 nav-glass-pure">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 sm:h-[72px] flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-8 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/urbanstride/logo.png"
              alt="UrbanStride Logo"
              className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(255,255,255,0.2)]"
            />
          </div>
          <div>
            <div className="font-heading font-semibold text-xl sm:text-2xl text-white tracking-wider leading-none">
              UrbanStride
            </div>
            <span className="text-[7.5px] font-bold tracking-[0.3em] text-slate-400 block mt-0.5 uppercase font-mono">
              FOOTWEAR
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-medium text-xs sm:text-[13px] text-slate-200">
          <Link href="/products" className="hover:text-white transition-colors font-bold text-white">
            Shop All
          </Link>
          <Link href="/#collections" className="hover:text-white transition-colors">
            Collections
          </Link>
          <Link href="/#brands" className="hover:text-white transition-colors">
            Brands
          </Link>
          <Link href="/products?category=running-shoes" className="hover:text-white transition-colors">
            New Arrivals
          </Link>
          <Link href="/#about" className="hover:text-white transition-colors">
            About Us
          </Link>
        </nav>

        {/* Right Tools */}
        <div className="flex items-center gap-5">
          <Link
            href="/products"
            className="text-slate-200 hover:text-white transition-colors p-1"
            title="Search Shoes"
          >
            <i className="fa-solid fa-magnifying-glass text-sm"></i>
          </Link>

          {/* Interactive Shopping Cart Bag Trigger */}
          <button
            onClick={onOpenCart}
            className="relative text-slate-200 hover:text-white transition-colors p-1 flex items-center cursor-pointer"
            title="Open Shopping Bag"
          >
            <i className="fa-solid fa-bag-shopping text-base"></i>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center font-mono ml-1 shadow-md">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={onOpenCart}
            className="md:hidden text-slate-300 hover:text-white p-1"
          >
            <i className="fa-solid fa-bars text-sm"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
