'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseGoogleJwt, isAdmin, AuthUser } from '@/lib/auth';
import { useAuth } from '@/context/AuthContext';

declare global {
  interface Window {
    google?: any;
    __gsiLoginInit?: boolean;
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { user: authUser, login, isLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  // Redirect destination after login
  const next = searchParams.get('next') || '/';

  // On mount — check if already authenticated
  useEffect(() => {
    if (isLoading) return;
    if (authUser) {
      if (isAdmin(authUser.email)) {
        router.replace('/admin');
      } else {
        router.replace(next === '/admin' ? '/' : next);
      }
      return;
    }
    setChecking(false);
  }, [router, next, authUser, isLoading]);

  // Initialize Google Sign-In button
  useEffect(() => {
    if (checking) return;

    const GSI_CLIENT_ID =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '69996615501-m4eclgq75cl1qd0q6kqckspg7q066epg.apps.googleusercontent.com';

    let checkInterval: NodeJS.Timeout;

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;
      if (!window.__gsiLoginInit) {
        window.google.accounts.id.initialize({
          client_id: GSI_CLIENT_ID,
          callback: (response: any) => {
            if (!response?.credential) return;
            const data = parseGoogleJwt(response.credential);
            if (!data) return;

            const u: AuthUser = {
              name: data.name || data.given_name || 'Google User',
              email: data.email || '',
              avatar: data.picture || '',
              isLoggedIn: true,
            };
            login(u);

            if (isAdmin(u.email)) {
              router.replace('/admin');
            } else {
              router.replace(next === '/admin' ? '/' : next);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false,
        });
        window.__gsiLoginInit = true;
      }

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 320,
        });
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGsi();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [checking, router, next]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0f0f0f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#0f0f0f] flex flex-col lg:flex-row">
      {/* ── LEFT EDITORIAL HERO PANEL ── */}
      <div className="relative lg:w-1/2 min-h-[340px] lg:min-h-screen bg-[#0f0f0f] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden">
        {/* Background Image with Dark Tint & Grain Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-luminosity scale-105 transition-transform duration-1000"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1600&q=85')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-[#0f0f0f]/60 to-transparent pointer-events-none" />

        {/* Top Branding Pill */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <i className="fa-solid fa-shoe-prints text-[#0f0f0f] text-[13px]" />
            </div>
            <span className="font-heading font-extrabold text-[22px] tracking-wider uppercase text-white">
              UrbanStride
            </span>
          </Link>
          <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono font-semibold uppercase tracking-widest text-white/80">
            Member Access
          </span>
        </div>

        {/* Center Tagline */}
        <div className="relative z-10 my-auto py-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-[11px] font-semibold text-white/90">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Autumn/Winter Collection Drop Live
          </div>

          <h2 className="font-heading font-extrabold text-[42px] sm:text-[54px] lg:text-[62px] leading-[0.92] tracking-tight uppercase">
            Step Into The<br />
            <span className="text-white/40">Future Of</span><br />
            Footwear.
          </h2>

          <p className="text-[13px] sm:text-[14px] text-white/70 max-w-md leading-relaxed font-normal">
            Unlock exclusive footwear drops, member-only discounts, and seamless order tracking.
          </p>

          {/* Member Benefits Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 max-w-lg">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white text-[12px] font-bold mb-1">
                <i className="fa-solid fa-truck-fast text-amber-400 text-[11px]" />
                <span>Express Delivery</span>
              </div>
              <p className="text-[11px] text-white/60">Fast, secure doorstep delivery on all orders.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white text-[12px] font-bold mb-1">
                <i className="fa-solid fa-tags text-emerald-400 text-[11px]" />
                <span>15% Welcome Pass</span>
              </div>
              <p className="text-[11px] text-white/60">Automatic discount applied on your first drop.</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
          <span>&copy; {new Date().getFullYear()} UrbanStride Inc.</span>
          <span>All rights reserved.</span>
        </div>
      </div>

      {/* ── RIGHT AUTHENTICATION CARD PANEL ── */}
      <div className="lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-16">
        {/* Top Nav Action */}
        <div className="flex justify-end items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D0CEC9] text-[12px] font-semibold text-[#555] hover:text-[#0f0f0f] hover:border-[#0f0f0f] bg-white transition-all shadow-xs group"
          >
            <i className="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Store</span>
          </Link>
        </div>

        {/* Center Auth Card Form */}
        <div className="max-w-[420px] w-full mx-auto my-auto py-8">
          <div className="bg-white border border-[#E0DDD9] rounded-3xl p-8 sm:p-10 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.06)] space-y-7">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#0f0f0f] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <i className="fa-solid fa-shoe-prints text-white text-[16px]" />
              </div>
              <h1 className="font-heading font-extrabold text-[28px] sm:text-[32px] text-[#0f0f0f] uppercase tracking-tight leading-none">
                Welcome Back
              </h1>
              <p className="text-[12.5px] text-[#777] leading-relaxed max-w-xs mx-auto">
                Sign in with Google to access your order history and account dashboard.
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[#E8E6E2]" />
              <span className="absolute bg-white px-3 text-[10.5px] font-mono uppercase tracking-widest text-[#aaa]">
                Sign In
              </span>
            </div>

            {/* Google Sign-In Container */}
            <div className="flex flex-col items-center justify-center space-y-3 pt-1">
              <div
                ref={googleBtnRef}
                className="min-h-[44px] flex items-center justify-center transform hover:scale-[1.01] transition-transform"
              />
            </div>
          </div>

          {/* Footer Terms Note */}
          <div className="text-center pt-6 space-y-2">
            <p className="text-[11px] text-[#999]">
              By signing in, you agree to UrbanStride&apos;s{' '}
              <Link href="/#about" className="text-[#0f0f0f] underline underline-offset-2 hover:opacity-80">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/#about" className="text-[#0f0f0f] underline underline-offset-2 hover:opacity-80">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        {/* Bottom spacer for balance */}
        <div className="hidden lg:block text-transparent text-[11px]">.</div>
      </div>
    </div>
  );
}
