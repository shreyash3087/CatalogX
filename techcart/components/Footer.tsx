'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/* TC Logo (matches Navbar) */
function TCLogo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="40" height="40" rx="10" fill="#C67D3A" />
      <path d="M10 12H22V15.5H18V28H14V15.5H10V12Z" fill="#FDFBF7" />
      <path d="M30 16.5C30 16.5 28.5 14 25.5 14C22.5 14 21 16.5 21 20C21 23.5 22.5 26 25.5 26C28.5 26 30 23.5 30 23.5V27.5C30 27.5 28 29 25 29C21 29 17.5 25.5 17.5 20C17.5 14.5 21 11 25 11C28 11 30 12.5 30 12.5V16.5Z" fill="#FDFBF7" />
    </svg>
  );
}

export default function Footer() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const { user: authUser, isAdmin: userIsAdmin, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert('Thank you for subscribing! Use code TECH15 for 15% off your first order.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#0C1220] text-[#9C9589] text-xs mt-auto relative z-20">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand & Newsletter Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group inline-flex">
              <TCLogo className="w-8 h-8" />
              <div>
                <div className="font-heading font-extrabold text-xl text-white tracking-tight leading-none">
                  TechCart
                </div>
                <span className="text-[7.5px] font-mono font-semibold tracking-[0.22em] text-[#706B62] block mt-0.5 uppercase leading-none">
                  ELECTRONICS
                </span>
              </div>
            </Link>

            <p className="text-[#8A8479] text-[12px] max-w-sm leading-relaxed font-normal">
              High-fidelity audio, studio-grade ANC, AMOLED displays, and mechanical computing gear engineered for peak digital performance.
            </p>

            {/* Newsletter Input */}
            <div className="pt-2">
              <div className="text-[11.5px] font-bold text-[#E8E0D4] uppercase tracking-wider mb-2 font-mono">
                Hardware Drop Alerts
              </div>
              <form onSubmit={handleSubscribe} className="flex max-w-sm rounded-lg overflow-hidden border border-white/10 bg-white/[0.04] p-1 focus-within:border-[#C67D3A] transition-colors">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter work or personal email"
                  className="bg-transparent text-white px-3 py-1.5 text-[12px] placeholder-[#5A554A] focus:outline-none flex-1 font-sans"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#C67D3A] hover:bg-[#A8622C] text-white font-bold text-[11px] uppercase tracking-wider transition-colors rounded-md cursor-pointer flex-shrink-0"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Hardware Categories */}
          <div className="space-y-3">
            <div className="font-heading font-bold text-white uppercase tracking-wider text-[13px]">
              Hardware
            </div>
            <ul className="space-y-2 text-[12px]">
              <li><Link href="/products?category=audio" className="hover:text-white transition-colors">Wireless Audio &amp; ANC</Link></li>
              <li><Link href="/products?category=wearables" className="hover:text-white transition-colors">AMOLED Smartwatches</Link></li>
              <li><Link href="/products?category=computing" className="hover:text-white transition-colors">Mechanical Keyboards</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">All Electronics Catalog</Link></li>
            </ul>
          </div>

          {/* Top Brands */}
          <div className="space-y-3">
            <div className="font-heading font-bold text-white uppercase tracking-wider text-[13px]">
              Authorized Brands
            </div>
            <ul className="space-y-2 text-[12px]">
              <li><Link href="/products" className="hover:text-white transition-colors">Sony High-Resolution</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Keychron Mechanicals</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">OnePlus Nord Audio</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">boAt Rockerz Series</Link></li>
              <li><Link href="/products" className="hover:text-white transition-colors">Noise Wearables</Link></li>
            </ul>
          </div>

          {/* Account & Portal */}
          <div className="space-y-3">
            <div className="font-heading font-bold text-white uppercase tracking-wider text-[13px]">
              Account &amp; Support
            </div>
            <ul className="space-y-2 text-[12px]">
              {authUser ? (
                <>
                  {userIsAdmin ? (
                    <li>
                      <Link href="/admin" className="text-[#C67D3A] font-semibold hover:underline flex items-center gap-1.5">
                        Merchant Dashboard
                      </Link>
                    </li>
                  ) : (
                    <li className="text-[#E8E0D4] font-medium">Signed in as {authUser.name.split(' ')[0]}</li>
                  )}
                  <li>
                    <button onClick={handleSignOut} className="text-[#9C9589] hover:text-red-400 transition-colors cursor-pointer text-left">
                      Sign Out
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link href="/login" className="text-[#C67D3A] font-semibold hover:underline">
                    Sign In / Register
                  </Link>
                </li>
              )}
              <li><Link href="/products" className="hover:text-white transition-colors">Orders &amp; Tracking</Link></li>
              <li><Link href="/#about" className="hover:text-white transition-colors">1-Year TechCart Warranty</Link></li>
              <li><Link href="/#about" className="hover:text-white transition-colors">Support &amp; Returns</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.08] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#5A554A]">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} TechCart Electronics Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <span>Secure Payments by Razorpay</span>
            <span>·</span>
            {userIsAdmin ? (
              <Link href="/admin" className="text-[#C67D3A] hover:underline font-mono">
                Terminal
              </Link>
            ) : (
              <Link href="/login?next=/admin" className="hover:text-[#9C9589] transition-colors font-mono">
                Staff Portal
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}