'use strict';
'use client';

import React from 'react';
import { UserProfile } from './GoogleAuthButton';

export type SessionItem = {
  id: string;
  title: string;
  createdAt: string;
  eventCount: number;
};

type Props = {
  sessions: SessionItem[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (id: string) => void;
  activeTab: 'chat' | 'orders' | 'settings';
  onTabChange: (tab: 'chat' | 'orders' | 'settings') => void;
  user: UserProfile;
  onUserChange?: (user: UserProfile) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

/** Razorpay Glowing Line & Aura Active Indicator (Image 2 style) */
function ActiveRazorpayIndicator() {
  return (
    <>
      {/* 1. Ambient blue glow radiating upward behind the selected option */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(37,99,235,0.45)_0%,_rgba(37,99,235,0.12)_55%,_transparent_80%)] pointer-events-none" />

      {/* 2. Razorpay glowing line at the bottom with in & out breathing animation */}
      <div className="absolute bottom-0 inset-x-1 h-[2px] flex items-center justify-center pointer-events-none overflow-visible">
        {/* Soft wide neon pulse */}
        <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-[2px] animate-glow-pulse" />
        {/* Sharp electric center core expanding on select */}
        <div className="absolute w-[80%] h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_10px_#60a5fa] animate-line-expand" />
      </div>
    </>
  );
}

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  activeTab,
  onTabChange,
  user,
  theme,
  onToggleTheme,
}: Props) {
  return (
    <aside className="w-[260px] h-screen bg-[#080B11] text-slate-200 flex flex-col justify-between flex-shrink-0 select-none border-r border-[#151C2C]">
      {/* Top Section */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#151C2C]">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/razorpay-logo-normal.png"
              alt="Razorpay Blade"
              className="h-6 w-auto object-contain"
            />
            <span className="text-sm font-bold text-white tracking-tight">Razorpay Agent</span>
            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold font-mono uppercase bg-blue-950 text-[#60a5fa] border border-blue-800/60">
              BETA
            </span>
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1.5">
            CatalogX · Agentic Commerce
          </div>
        </div>

        {/* Main Navigation Menu */}
        <div className="px-3 pt-4 space-y-4 flex-1 overflow-y-auto no-scrollbar">
          {/* CATALOG Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Catalog
            </div>
            <button
              onClick={() => onTabChange('settings')}
              className={`relative w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer overflow-hidden ${
                activeTab === 'settings'
                  ? 'text-white bg-[#0A0D15]'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              {activeTab === 'settings' && <ActiveRazorpayIndicator />}
              <svg className={`w-3.5 h-3.5 relative z-10 transition-colors ${activeTab === 'settings' ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="relative z-10">System & Mandates</span>
            </button>
          </div>

          {/* MANAGE Section */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Manage
            </div>

            <button
              onClick={() => onTabChange('chat')}
              className={`relative w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer overflow-hidden ${
                activeTab === 'chat'
                  ? 'text-white bg-[#0A0D15]'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              {activeTab === 'chat' && <ActiveRazorpayIndicator />}
              <svg className={`w-3.5 h-3.5 relative z-10 transition-colors ${activeTab === 'chat' ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="relative z-10">Chat & Checkout</span>
            </button>

            <button
              onClick={() => onTabChange('orders')}
              className={`relative w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer overflow-hidden ${
                activeTab === 'orders'
                  ? 'text-white bg-[#0A0D15]'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              {activeTab === 'orders' && <ActiveRazorpayIndicator />}
              <svg className={`w-3.5 h-3.5 relative z-10 transition-colors ${activeTab === 'orders' ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
              <span className="relative z-10">Orders Ledger</span>
            </button>
          </div>

          {/* Recent Chat Sessions */}
          {activeTab === 'chat' && (
            <div className="space-y-1.5 pt-2 border-t border-[#151C2C]/80">
              <div className="flex items-center justify-between px-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Recent Chat
                </span>
                <button
                  onClick={onNewSession}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Start New Chat Session"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>

              <div className="space-y-0.5 max-h-52 overflow-y-auto no-scrollbar">
                {sessions.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] text-slate-500 font-normal">
                    No past session
                  </div>
                ) : (
                  sessions.map((sess) => {
                    const isActive = activeSessionId === sess.id;
                    return (
                      <div
                        key={sess.id}
                        onClick={() => onSelectSession(sess.id)}
                        className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                          isActive
                            ? 'text-blue-400 font-semibold bg-white/[0.04]'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <svg className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span className="truncate max-w-[150px]">{sess.title}</span>
                        </div>

                        {onDeleteSession && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSession(sess.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 rounded transition-all cursor-pointer"
                            title="Delete Session"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-[#151C2C] space-y-2 bg-[#05070A]">
        {/* User Profile Pill & Theme Toggle */}
        <div className="flex items-center justify-between px-2 py-1.5">
          <div
            onClick={() => onTabChange('settings')}
            className="flex items-center gap-2 min-w-0 cursor-pointer group"
          >
            {user.isLoggedIn && user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-emerald-500 flex-shrink-0"
              />
            ) : user.isLoggedIn ? (
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/10 text-slate-400 text-xs flex items-center justify-center flex-shrink-0 border border-white/10">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                {user.isLoggedIn ? user.name : 'Not Logged In'}
              </div>
              <div className="text-[9px] text-slate-400 truncate">
                {user.isLoggedIn ? user.email : 'Sign in in Settings'}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? (
              <svg className="w-3.5 h-3.5 text-amber-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>

        <div className="text-[9.5px] text-slate-500 px-2 flex items-center justify-between">
          <span>© 2026 Razorpay</span>
          <span className="font-mono">v1.2</span>
        </div>
      </div>
    </aside>
  );
}
