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

/* Custom SVG TC Monogram Logo */
function TCLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded square background */}
      <rect width="40" height="40" rx="10" fill="#C67D3A" />
      {/* T letterform */}
      <path
        d="M10 12H22V15.5H18V28H14V15.5H10V12Z"
        fill="#FDFBF7"
      />
      {/* C letterform */}
      <path
        d="M30 16.5C30 16.5 28.5 14 25.5 14C22.5 14 21 16.5 21 20C21 23.5 22.5 26 25.5 26C28.5 26 30 23.5 30 23.5V27.5C30 27.5 28 29 25 29C21 29 17.5 25.5 17.5 20C17.5 14.5 21 11 25 11C28 11 30 12.5 30 12.5V16.5Z"
        fill="#FDFBF7"
      />
    </svg>
  );
}

/* Inline SVG Icons */
function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}
function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  );
}
function BagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
    </svg>
  );
}

export default function Navbar({ cartCount = 0, onOpenCart }: Props) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user: authUser, isAdmin: userIsAdmin, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = () => {
    logout();
    router.push('/');
  };

  const navLinks = [
    { label: 'All Hardware', href: '/products' },
    { label: 'Audio & ANC', href: '/products?category=audio' },
    { label: 'Wearables', href: '/products?category=wearables' },
    { label: 'Computing', href: '/products?category=computing' },
    { label: 'Brands', href: '/#brands' },
    ...(userIsAdmin ? [{ label: 'Dashboard', href: '/admin', admin: true }] : []),
  ];

  return (
    <>
      {/* Announcement Bar */}
      <div className="tc-announcement">
        <span>2026 Hardware Lineup Live -- Use code <strong className="text-white font-mono">TECH15</strong> for 15% off first order.</span>
      </div>

      {/* Main Navbar */}
      <header
        className={`sticky top-0 left-0 right-0 z-50 tc-nav-blur transition-shadow duration-300 ${
          scrolled ? 'shadow-lg shadow-black/[0.04]' : ''
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-[60px] flex items-center justify-between gap-6">

          {/* Left: Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <TCLogo className="w-8 h-8" />
            <div>
              <div className="font-heading font-extrabold text-[20px] text-[#0C1220] tracking-tight leading-none">
                TechCart
              </div>
              <span className="text-[7.5px] font-mono font-semibold tracking-[0.22em] text-[#9C9589] block mt-0.5 uppercase leading-none">
                ELECTRONICS
              </span>
            </div>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-[12.5px] font-semibold text-[#5A5549] tracking-wide">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`relative hover:text-[#0C1220] transition-colors py-1 group ${
                  'admin' in link && link.admin
                    ? 'text-[#C67D3A] hover:text-[#A8622C]'
                    : ''
                }`}
              >
                {'admin' in link && link.admin && (
                  <span className="inline-block mr-1.5 align-middle"><DashboardIcon /></span>
                )}
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#C67D3A] group-hover:w-full transition-all duration-200" />
              </Link>
            ))}
          </nav>

          {/* Right: Auth State & Tool Actions */}
          <div className="flex items-center gap-4 text-[#5A5549]">
            {authUser ? (
              /* Signed In */
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={authUser.avatar}
                    name={authUser.name}
                    size="md"
                    borderColor="border-emerald-500"
                  />
                  <span className="text-[12px] font-semibold text-[#0C1220] max-w-[120px] truncate">
                    {authUser.name.split(' ')[0]}
                  </span>
                  {userIsAdmin && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase bg-[#C67D3A]/10 text-[#C67D3A] border border-[#C67D3A]/25">
                      ADMIN
                    </span>
                  )}
                </div>

                <span className="text-[#E8E0D4]">|</span>

                <button
                  onClick={handleSignOut}
                  className="text-[11.5px] font-semibold text-[#9C9589] hover:text-red-500 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              /* Signed Out */
              <div className="hidden lg:flex items-center gap-3 text-[11.5px] text-[#9C9589] font-medium">
                <Link href="/products" className="hover:text-[#0C1220] transition-colors">
                  Order Status
                </Link>
                <span className="text-[#E8E0D4]">|</span>
                <Link href="/#about" className="hover:text-[#0C1220] transition-colors">
                  Support
                </Link>
                <span className="text-[#E8E0D4]">|</span>
                <Link href="/login" className="hover:text-[#0C1220] text-[#0C1220] font-semibold transition-colors">
                  Sign In
                </Link>
              </div>
            )}

            {/* Search */}
            <Link
              href="/products"
              className="text-[#5A5549] hover:text-[#0C1220] transition-colors p-1"
              title="Search Hardware"
            >
              <SearchIcon />
            </Link>

            {/* Wishlist */}
            <button
              className="text-[#5A5549] hover:text-[#0C1220] transition-colors p-1 cursor-pointer"
              title="Saved Gear"
            >
              <HeartIcon />
            </button>

            {/* Cart Trigger */}
            <button
              onClick={onOpenCart}
              className="relative text-[#5A5549] hover:text-[#0C1220] transition-colors p-1 flex items-center cursor-pointer"
              title="Hardware Cart"
            >
              <BagIcon />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C67D3A] text-white text-[9px] font-bold font-mono flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-[#5A5549] hover:text-[#0C1220] p-1 cursor-pointer"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#FDFBF7] border-t border-[#E8E0D4] px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-[13px] font-semibold py-2 border-b border-[#F5F0E8] transition-colors ${
                  'admin' in link && link.admin
                    ? 'text-[#C67D3A]'
                    : 'text-[#5A5549] hover:text-[#0C1220]'
                }`}
              >
                {'admin' in link && link.admin && (
                  <span className="inline-block mr-1.5 align-middle"><DashboardIcon /></span>
                )}
                {link.label}
              </Link>
            ))}

            {authUser ? (
              <div className="pt-3 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    src={authUser.avatar}
                    name={authUser.name}
                    size="sm"
                    borderColor="border-emerald-500"
                  />
                  <span className="text-[#0C1220] font-semibold">{authUser.name}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-red-500 font-semibold cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[13px] font-bold text-[#C67D3A] py-2 mt-1"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
}