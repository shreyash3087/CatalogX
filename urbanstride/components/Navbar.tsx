'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';

type Props = {
  cartCount?: number;
  onOpenCart?: () => void;
};

export default function Navbar({ cartCount = 0, onOpenCart }: Props) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user: authUser, isAdmin: userIsAdmin, logout } = useAuth();

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { label: 'Shop All', href: '/products' },
    { label: 'Running', href: '/products?category=running-shoes' },
    { label: 'Hiking', href: '/products?category=hiking-boots' },
    { label: 'Casual', href: '/products?category=casual-sneakers' },
    { label: 'Brands', href: '/#brands' },
    { label: 'About', href: '/#about' },
    // Dashboard only visible for admins
    ...(userIsAdmin ? [{ label: 'Dashboard', href: '/admin', admin: true }] : []),
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        Enjoy an exclusive 15% coupon for your first purchase.&nbsp;
        <Link href="/products" className="underline underline-offset-2 opacity-80 hover:opacity-100">
          Shop Now &rarr;
        </Link>
      </div>

      {/* Main Navbar */}
      <header
        className={`sticky top-0 left-0 right-0 z-50 nav-light transition-shadow duration-300 ${
          scrolled ? 'shadow-sm' : ''
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 sm:px-8 h-[52px] flex items-center justify-between gap-6">

          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-[#0f0f0f] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-shoe-prints text-white text-[13px]" />
            </div>
            <div className="font-heading font-bold text-[20px] text-[#0f0f0f] tracking-wide leading-none">
              UrbanStride
            </div>
          </Link>

          {/* Center: Category Nav */}
          <nav className="hidden md:flex items-center gap-5 text-[12px] font-semibold text-[#555] tracking-wide">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`relative hover:text-[#0f0f0f] transition-colors group py-1 ${
                  'admin' in link && link.admin
                    ? 'text-amber-600 hover:text-amber-700'
                    : ''
                }`}
              >
                {'admin' in link && link.admin && (
                  <i className="fa-solid fa-gauge-high text-[10px] mr-1" />
                )}
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#0f0f0f] group-hover:w-full transition-all duration-200" />
              </Link>
            ))}
          </nav>

          {/* Right: Auth + icons */}
          <div className="flex items-center gap-3 text-[#444]">

            {authUser ? (
              /* ── Signed-in state ── */
              <div className="hidden lg:flex items-center gap-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={authUser.avatar}
                    name={authUser.name}
                    size="md"
                    borderColor="border-emerald-500"
                  />
                  <span className="text-[12px] font-semibold text-[#333] max-w-[120px] truncate">
                    {authUser.name.split(' ')[0]}
                  </span>
                  {userIsAdmin && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-200 leading-none">
                      Admin
                    </span>
                  )}
                </div>

                <span className="text-[#E0DDD9]">|</span>

                <button
                  onClick={handleSignOut}
                  className="text-[11px] font-semibold text-[#888] hover:text-rose-600 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* ── Signed-out state ── */
              <div className="hidden lg:flex items-center gap-3 text-[11px] text-[#888] font-medium">
                <Link href="/products" className="hover:text-[#0f0f0f] transition-colors">
                  Order Status
                </Link>
                <span className="text-[#D0CEC9]">|</span>
                <Link href="/#about" className="hover:text-[#0f0f0f] transition-colors">
                  Help
                </Link>
                <span className="text-[#D0CEC9]">|</span>
                <Link href="/login" className="hover:text-[#0f0f0f] transition-colors font-semibold">
                  Sign In
                </Link>
              </div>
            )}

            {/* Search */}
            <Link
              href="/products"
              className="text-[#666] hover:text-[#0f0f0f] transition-colors p-1"
              title="Search"
            >
              <i className="fa-solid fa-magnifying-glass text-[13px]" />
            </Link>

            {/* Wishlist */}
            <button
              className="text-[#666] hover:text-[#0f0f0f] transition-colors p-1 cursor-pointer"
              title="Wishlist"
            >
              <i className="fa-regular fa-heart text-[13px]" />
            </button>

            {/* Cart */}
            <button
              onClick={onOpenCart}
              className="relative text-[#666] hover:text-[#0f0f0f] transition-colors p-1 flex items-center cursor-pointer"
              title="Shopping Bag"
            >
              <i className="fa-solid fa-bag-shopping text-[13px]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#0f0f0f] text-[#F8F7F4] text-[8px] font-bold flex items-center justify-center font-mono shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#555] hover:text-[#0f0f0f] p-1 cursor-pointer"
            >
              <i className={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-[14px]`} />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F8F7F4] border-t border-[#E0DDD9] px-6 py-4 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-[13px] font-semibold py-2 border-b border-[#EEECEA] transition-colors ${
                  'admin' in link && link.admin
                    ? 'text-amber-600 hover:text-amber-700'
                    : 'text-[#333] hover:text-[#0f0f0f]'
                }`}
              >
                {'admin' in link && link.admin && (
                  <i className="fa-solid fa-gauge-high text-[10px] mr-1.5" />
                )}
                {link.label}
              </Link>
            ))}

            {/* Mobile auth */}
            {authUser ? (
              <div className="pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={authUser.avatar}
                    name={authUser.name}
                    size="sm"
                    borderColor="border-emerald-500"
                  />
                  <div className="text-[12px] font-semibold text-[#333]">{authUser.name}</div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-[11px] font-semibold text-rose-600 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[13px] font-bold text-[#0f0f0f] py-2 mt-1"
              >
                Sign In &rarr;
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}
