'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
      alert('Thank you! Use code STRIDE15 for 15% off your first order.');
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#F8F7F4] border-t border-[#E0DDD9] mt-auto">
      <div className="max-w-[1200px] mx-auto">
        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* LEFT: Feature rows + Subscribe */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#E0DDD9]">
            {/* Feature Row 1 */}
            <div className="flex items-start gap-4 px-10 sm:px-14 py-7 border-b border-[#E0DDD9]">
              <div className="flex-shrink-0 mt-0.5">
                <i className="fa-regular fa-circle-user text-[22px] text-[#0f0f0f]"></i>
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#0f0f0f] mb-1">Unmatched Comfort and Durability</div>
                <p className="text-[12px] text-[#777] leading-relaxed max-w-xs">
                  Experience long-lasting comfort with premium materials and expert craftsmanship designed to support every step, day after day.
                </p>
              </div>
            </div>

            {/* Feature Row 2 */}
            <div className="flex items-start gap-4 px-10 sm:px-14 py-7 border-b border-[#E0DDD9]">
              <div className="flex-shrink-0 mt-0.5">
                <i className="fa-regular fa-credit-card text-[22px] text-[#0f0f0f]"></i>
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#0f0f0f] mb-1">Stylish Design, Superior Performance</div>
                <p className="text-[12px] text-[#777] leading-relaxed max-w-xs">
                  Step into style with sleek, modern designs while enjoying top-tier performance for all your active adventures.
                </p>
              </div>
            </div>

            {/* Subscribe Row */}
            <div className="px-10 sm:px-14 py-7">
              <div className="text-[13px] font-bold text-[#0f0f0f] mb-1">Subscribe</div>
              <p className="text-[12px] text-[#777] mb-5 leading-relaxed">
                Subscribe to our newsletter for early access<br />and exclusive content.
              </p>
              <form onSubmit={handleSubscribe} className="flex items-end gap-3 max-w-[280px]">
                <div className="flex-1 border-b border-[#C0BDB8]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="w-full bg-transparent text-[13px] text-[#0f0f0f] placeholder-[#BBB8B4] focus:outline-none pb-1.5 font-sans"
                  />
                </div>
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-[#0f0f0f] text-white flex items-center justify-center flex-shrink-0 hover:bg-[#333] transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-arrow-right text-[11px]"></i>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Copyright + Explore + Links */}
          <div className="px-10 sm:px-14 py-7 flex flex-col justify-between gap-7">
            {/* Copyright block */}
            <div>
              <p className="text-[12px] text-[#999] mb-1">© {new Date().getFullYear()}</p>
              <h2 className="font-heading font-bold text-[34px] sm:text-[40px] text-[#0f0f0f] leading-[1.05] tracking-tight">
                UrbanStride Inc.<br />All rights reserved.
              </h2>
            </div>

            {/* Explore Pill */}
            <div>
              <Link
                href="/products"
                className="inline-flex items-center gap-3 bg-[#0f0f0f] text-white rounded-full pl-4 pr-2 py-2 text-[12px] font-semibold hover:bg-[#2a2a2a] transition-colors"
              >
                <span className="tracking-wide">Explore</span>
                <span className="w-6 h-6 rounded-full bg-white text-[#0f0f0f] flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-arrow-right text-[10px]"></i>
                </span>
              </Link>
            </div>

            {/* Links — two columns with vertical divider */}
            <div className="border-t border-[#E0DDD9] pt-6 grid grid-cols-2 gap-x-6">
              <div className="space-y-2.5">
                {authUser ? (
                  <>
                    {userIsAdmin ? (
                      <Link href="/admin" className="block text-[12px] text-amber-700 font-semibold hover:text-amber-800 transition-colors">
                        Merchant Dashboard
                      </Link>
                    ) : (
                      <span className="block text-[12px] text-[#0f0f0f] font-semibold">
                        Signed in as {authUser.name.split(' ')[0]}
                      </span>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block text-[12px] text-[#888] hover:text-rose-600 transition-colors text-left cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block text-[12px] text-[#555] hover:text-[#0f0f0f] transition-colors">
                      Sign In / Register
                    </Link>
                  </>
                )}
                <Link href="/products" className="block text-[12px] text-[#555] hover:text-[#0f0f0f] transition-colors">
                  Orders &amp; Tracking
                </Link>
                <Link href="/#about" className="block text-[12px] text-[#555] hover:text-[#0f0f0f] transition-colors">
                  Shipping &amp; Returns
                </Link>
              </div>
              <div className="space-y-2.5 border-l border-[#E0DDD9] pl-6">
                <Link href="/#about" className="block text-[12px] text-[#555] hover:text-[#0f0f0f] transition-colors">
                  FAQ
                </Link>
                <Link href="/#about" className="block text-[12px] text-[#555] hover:text-[#0f0f0f] transition-colors">
                  Contact Us
                </Link>
                <Link href="/products" className="block text-[12px] text-[#555] hover:text-[#0f0f0f] transition-colors">
                  Store Catalog
                </Link>
                <Link href="/#brands" className="block text-[12px] text-[#555] hover:text-[#0f0f0f] transition-colors">
                  Brands
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#E0DDD9] px-8 py-4 flex items-center justify-between text-[11px] text-[#aaa]">
          <span>Secure Payments by Razorpay</span>
          {userIsAdmin ? (
            <Link href="/admin" className="text-amber-700 hover:text-amber-800 font-semibold transition-colors">
              Merchant Terminal
            </Link>
          ) : (
            <Link href="/login?next=/admin" className="hover:text-[#555] transition-colors">
              Staff Portal
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
