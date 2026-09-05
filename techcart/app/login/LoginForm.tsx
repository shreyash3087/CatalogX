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

  const next = searchParams.get('next') || '/';

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
          theme: 'filled_black',
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
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C67D3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0C1220] flex flex-col lg:flex-row font-sans">
      {/* ── LEFT HARDWARE EDITORIAL PANEL ── */}
      <div className="relative lg:w-1/2 min-h-[360px] lg:min-h-screen bg-[#0C1220] text-white flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08]">
        {/* Background Image with Dark Tint */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-luminosity scale-105"
          style={{
            backgroundImage:
              "url('/assets/techcart/headphones.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0C1220] via-[#0C1220]/70 to-transparent pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
              <rect width="40" height="40" rx="10" fill="#C67D3A" />
              <path d="M10 12H22V15.5H18V28H14V15.5H10V12Z" fill="#FDFBF7" />
              <path d="M30 16.5C30 16.5 28.5 14 25.5 14C22.5 14 21 16.5 21 20C21 23.5 22.5 26 25.5 26C28.5 26 30 23.5 30 23.5V27.5C30 27.5 28 29 25 29C21 29 17.5 25.5 17.5 20C17.5 14.5 21 11 25 11C28 11 30 12.5 30 12.5V16.5Z" fill="#FDFBF7" />
            </svg>
            <span className="font-heading font-extrabold text-[22px] tracking-tight uppercase text-white">
              TechCart
            </span>
          </Link>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-slate-400">
            Hardware Portal
          </span>
        </div>

        {/* Tagline Content */}
        <div className="relative z-10 my-auto py-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C67D3A]/10 border border-[#C67D3A]/20 text-[11px] font-mono text-[#C67D3A]">
            <span className="w-2 h-2 rounded-full bg-[#C67D3A] animate-pulse" />
            2026 Audio &amp; Computing Architecture
          </div>

          <h2 className="font-heading font-extrabold text-[38px] sm:text-[48px] lg:text-[54px] leading-[0.94] tracking-tight uppercase">
            ENGINEERED<br />
            <span className="text-[#C67D3A]">PRECISION</span><br />
            FOR CREATORS.
          </h2>

          <p className="text-[13px] sm:text-[14px] text-slate-300 max-w-md leading-relaxed font-normal">
            Sign in to access your order history, verified hardware warranties, and member drop pricing.
          </p>

          {/* Member Perks */}
          <div className="grid grid-cols-2 gap-3 pt-2 max-w-lg">
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white text-[12px] font-bold mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C67D3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                <span>Tracked Dispatch</span>
              </div>
              <p className="text-[11px] text-slate-400">Real-time delivery telemetry across metro zones.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-white text-[12px] font-bold mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L12 24"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 1-1-1V1"/><path d="M7 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>
                <span>15% Welcome Pass</span>
              </div>
              <p className="text-[11px] text-slate-400">Automatic discount on your first hardware order.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>&copy; {new Date().getFullYear()} TechCart Electronics Inc.</span>
          <span>Verified Merchant</span>
        </div>
      </div>

      {/* ── RIGHT AUTHENTICATION CARD PANEL ── */}
      <div className="lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-16">
        {/* Top Return Button */}
        <div className="flex justify-end items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E8E0D4] text-[12px] font-semibold text-[#5A5549] hover:text-[#0C1220] hover:border-[#D4C9B9] bg-white transition-all group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-0.5 transition-transform"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            <span>Back to Store</span>
          </Link>
        </div>

        {/* Center Auth Card */}
        <div className="max-w-[400px] w-full mx-auto my-auto py-8">
          <div className="bg-white border border-[#E8E0D4] rounded-2xl p-8 sm:p-10 shadow-2xl space-y-7">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-[#C67D3A]/10 border border-[#C67D3A]/20 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7"><rect width="40" height="40" rx="10" fill="#C67D3A" /><path d="M10 12H22V15.5H18V28H14V15.5H10V12Z" fill="#FDFBF7" /><path d="M30 16.5C30 16.5 28.5 14 25.5 14C22.5 14 21 16.5 21 20C21 23.5 22.5 26 25.5 26C28.5 26 30 23.5 30 23.5V27.5C30 27.5 28 29 25 29C21 29 17.5 25.5 17.5 20C17.5 14.5 21 11 25 11C28 11 30 12.5 30 12.5V16.5Z" fill="#FDFBF7" /></svg>
              </div>
              <h1 className="font-heading font-extrabold text-[28px] sm:text-[32px] text-[#0C1220] uppercase tracking-tight leading-none">
                Welcome Back
              </h1>
              <p className="text-[12.5px] text-[#9C9589] leading-relaxed max-w-xs mx-auto">
                Sign in with your Google Account to access your hardware orders and warranty telemetry.
              </p>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-[#E8E0D4]" />
              <span className="absolute bg-white px-3 text-[10px] font-mono uppercase tracking-widest text-[#9C9589]">
                Google Sign In
              </span>
            </div>

            {/* Google Button */}
            <div className="flex flex-col items-center justify-center space-y-3 pt-1">
              <div
                ref={googleBtnRef}
                className="min-h-[44px] flex items-center justify-center transform hover:scale-[1.01] transition-transform"
              />
            </div>
          </div>

          {/* Footer Terms */}
          <div className="text-center pt-6 space-y-2">
            <p className="text-[11px] text-[#9C9589]">
              By signing in, you agree to TechCart&apos;s{' '}
              <Link href="/#about" className="text-[#5A5549] underline underline-offset-2 hover:text-[#0C1220]">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/#about" className="text-[#5A5549] underline underline-offset-2 hover:text-[#0C1220]">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>

        <div className="hidden lg:block text-transparent text-[11px]">.</div>
      </div>
    </div>
  );
}