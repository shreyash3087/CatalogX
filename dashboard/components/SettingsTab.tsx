'use strict';
'use client';

import React, { useState } from 'react';
import { MandateRecord } from './MandateVaultModal';
import GoogleSignInRender, { UserProfile, GUEST_USER } from './GoogleAuthButton';
import { NotificationOptions, NotificationType } from './NotificationModal';

declare global {
  interface Window {
    google?: any;
  }
}

type Props = {
  mandate: MandateRecord | null;
  onOpenVault: () => void;
  user: UserProfile;
  onUserChange: (user: UserProfile) => void;
  theme: 'light' | 'dark';
  showAlert?: (options: NotificationOptions | string, type?: NotificationType) => void;
};

export default function SettingsTab({
  mandate,
  onOpenVault,
  user,
  onUserChange,
  theme,
  showAlert,
}: Props) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [showEditDelivery, setShowEditDelivery] = useState(false);

  // Delivery form state
  const [inputPhone, setInputPhone] = useState(user.phone || '');
  const [inputStreet, setInputStreet] = useState(user.delivery_address?.street || '');
  const [inputCity, setInputCity] = useState(user.delivery_address?.city || '');
  const [inputState, setInputState] = useState(user.delivery_address?.state || '');
  const [inputPostalCode, setInputPostalCode] = useState(user.delivery_address?.postal_code || '');
  const [inputCountry, setInputCountry] = useState(user.delivery_address?.country || 'India');

  const isLight = theme === 'light';
  const isMandateActive = !!(user.isLoggedIn && mandate && mandate.status === 'ACTIVE');
  const hasCompleteDelivery = !!(user.phone && user.delivery_address?.street && user.delivery_address?.city && user.delivery_address?.postal_code);

  const notify = (opts: NotificationOptions | string, type: NotificationType = 'info') => {
    if (showAlert) {
      showAlert(opts, type);
    }
  };

  const handleGoogleSuccess = (loggedUser: UserProfile) => {
    onUserChange(loggedUser);
    localStorage.setItem('catalogx_user', JSON.stringify(loggedUser));
    notify({
      title: 'Google Sign-In Successful',
      message: `Welcome back, ${loggedUser.name}! Please set up your delivery details below if you haven't already.`,
      type: 'success',
    });
  };

  const handleSaveDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPhone.trim() || !inputStreet.trim() || !inputCity.trim() || !inputPostalCode.trim()) {
      notify({
        title: 'Missing Required Details',
        message: 'Please fill in your Phone Number, Street Address, City, and PIN Code to complete your delivery profile.',
        type: 'warning',
      });
      return;
    }
    const updated: UserProfile = {
      ...user,
      phone: inputPhone.trim(),
      delivery_address: {
        street: inputStreet.trim(),
        city: inputCity.trim(),
        state: inputState.trim() || 'Karnataka',
        postal_code: inputPostalCode.trim(),
        country: inputCountry.trim() || 'India',
      },
    };
    onUserChange(updated);
    localStorage.setItem('catalogx_user', JSON.stringify(updated));
    setShowEditDelivery(false);
    notify({
      title: 'Delivery Address Saved',
      message: 'Your shipping location & contact details are saved! Your AI Buyer Agent is now ready to execute orders.',
      type: 'success',
    });
  };

  const handleSignOut = () => {
    onUserChange(GUEST_USER);
    localStorage.removeItem('catalogx_user');
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
    notify({
      title: 'Signed Out',
      message: 'You have signed out of your Google account.',
      type: 'info',
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 w-full max-w-6xl mx-auto no-scrollbar animate-fade-in">
      {/* 1. Profile Section */}
      <div className="space-y-3">
        <h2 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
          User Profile & Authentication
        </h2>

        <div
          className={`p-6 rounded-2xl border transition-all ${
            isLight
              ? 'bg-[#F2F7FD] border-[#D9E6F7] shadow-xs'
              : 'bg-[#0B1019] border-[#1C283B] shadow-xs'
          }`}
        >
          {user.isLoggedIn ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left: Real User Info */}
              <div className="lg:col-span-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#131B2A] border border-slate-200 dark:border-[#22314A] flex items-center justify-center text-slate-400 flex-shrink-0 shadow-xs overflow-hidden">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
                      {user.name ? user.name.charAt(0) : 'U'}
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {user.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                      Google Verified
                    </span>
                  </div>
                  <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {user.email}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                    {user.phone ? `Phone: ${user.phone}` : '⚠️ Phone number not configured'}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="lg:col-span-6 flex flex-wrap items-center justify-start lg:justify-end gap-3">
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold text-xs hover:bg-red-100 dark:hover:bg-red-900/40 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-regular fa-arrow-right-from-bracket text-xs" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-[#131B2A] border border-slate-300 dark:border-[#22314A] flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    User Not Logged In
                  </h3>
                  <p className={`text-xs mt-0.5 max-w-md ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Sign in with your Google account to configure your delivery details and start shopping with the CatalogX Buyer Agent.
                  </p>
                </div>
              </div>

              <div className="flex-shrink-0">
                <GoogleSignInRender onSuccess={handleGoogleSuccess} theme={theme} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Delivery Location & Fulfillment Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            Delivery Location & Fulfillment
          </h2>
          {user.isLoggedIn && hasCompleteDelivery && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Ready for Autonomous Checkout</span>
            </span>
          )}
        </div>

        <div
          className={`p-6 rounded-2xl border transition-all ${
            isLight
              ? 'bg-[#F2F7FD] border-[#D9E6F7] shadow-xs'
              : 'bg-[#0B1019] border-[#1C283B] shadow-xs'
          }`}
        >
          {!user.isLoggedIn ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                No Delivery Details Configured
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Please sign in with Google above. You will be prompted to enter your shipping address and contact number so the agent can fulfill your orders.
              </p>
            </div>
          ) : !hasCompleteDelivery || showEditDelivery ? (
            <form onSubmit={handleSaveDelivery} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {!hasCompleteDelivery ? 'Complete Your Delivery & Contact Setup' : 'Edit Delivery Address'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    These details are required to enable the AI Buyer Agent to place orders on merchant stores without needing individual store accounts.
                  </p>
                </div>
                {hasCompleteDelivery && (
                  <button
                    type="button"
                    onClick={() => setShowEditDelivery(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <i className="fa-regular fa-xmark text-sm" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    required
                    className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:border-blue-600 ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0E17] border-[#22314A] text-white'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Street Address / House No. / Flat No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputStreet}
                    onChange={(e) => setInputStreet(e.target.value)}
                    placeholder="e.g. Flat 402, Skyline Residency, 100ft Road"
                    required
                    className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:border-blue-600 ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0E17] border-[#22314A] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    required
                    className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:border-blue-600 ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0E17] border-[#22314A] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputState}
                    onChange={(e) => setInputState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    required
                    className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:border-blue-600 ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0E17] border-[#22314A] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    PIN Code / Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputPostalCode}
                    onChange={(e) => setInputPostalCode(e.target.value)}
                    placeholder="e.g. 560038"
                    required
                    className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:border-blue-600 ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0E17] border-[#22314A] text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={inputCountry}
                    onChange={(e) => setInputCountry(e.target.value)}
                    placeholder="India"
                    className={`w-full px-3.5 py-2 rounded-xl border focus:outline-none focus:border-blue-600 ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0A0E17] border-[#22314A] text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <i className="fa-regular fa-check text-xs" />
                  <span>Save Delivery Details & Activate Agent</span>
                </button>
                {hasCompleteDelivery && (
                  <button
                    type="button"
                    onClick={() => setShowEditDelivery(false)}
                    className="px-4 py-2.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Primary Shipping Address
                    </div>
                    <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {user.delivery_address?.street}, {user.delivery_address?.city}, {user.delivery_address?.state} - {user.delivery_address?.postal_code}, {user.delivery_address?.country || 'India'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setInputPhone(user.phone || '');
                    setInputStreet(user.delivery_address?.street || '');
                    setInputCity(user.delivery_address?.city || '');
                    setInputState(user.delivery_address?.state || '');
                    setInputPostalCode(user.delivery_address?.postal_code || '');
                    setShowEditDelivery(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-semibold text-xs transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                <div>
                  <span className={`font-medium block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Contact Phone</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {user.phone}
                  </span>
                </div>
                <div>
                  <span className={`font-medium block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>City & State</span>
                  <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {user.delivery_address?.city}, {user.delivery_address?.state}
                  </span>
                </div>
                <div>
                  <span className={`font-medium block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>PIN Code</span>
                  <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                    {user.delivery_address?.postal_code}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Account and Product Settings (Mandate Vault) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
            Account and product settings
          </h2>
          <a
            href="https://razorpay.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <span>Documentation</span>
            <i className="fa-regular fa-share-from-square text-[10px]" />
          </a>
        </div>

        {/* Card 1: Pre-Authorized Mandate Vault */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isLight
              ? 'bg-[#F2F7FD] border-[#D9E6F7] shadow-xs'
              : 'bg-[#0B1019] border-[#1C283B] shadow-xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg flex-shrink-0">
                <i className="fa-regular fa-credit-card" />
              </div>
              <div>
                <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Pre-Authorized Mandate Vault
                </div>
                <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  NPCI UAP / Razorpay TokenHQ e-mandate enabling zero-click micro-spends under ₹1,500.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isMandateActive ? (
                <span className="px-3 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  MANDATE ACTIVE
                </span>
              ) : (
                <span className={`px-3 py-1 rounded-full text-[10.5px] font-bold border ${
                  isLight
                    ? 'bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-[#182338] text-slate-200 border-[#2b3c5a]'
                }`}>
                  NO ACTIVE MANDATE
                </span>
              )}
              <button
                onClick={() => {
                  if (!user.isLoggedIn) {
                    notify({
                      title: 'Google Sign-In Required',
                      message: 'Please sign in with your Google account above first to configure Mandates & TokenHQ.',
                      type: 'warning',
                    });
                    return;
                  }
                  onOpenVault();
                }}
                className="px-4 py-2 rounded-xl bg-[#0c6cf2] hover:bg-blue-700 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <i className="fa-regular fa-shield-keyhole text-xs" />
                <span>Manage TokenHQ Vault</span>
              </button>
            </div>
          </div>

          {isMandateActive && mandate ? (
            <div className="pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Active Cryptographic Token</span>
                <button
                  onClick={() => handleCopy(mandate.mandate_token || mandate.id || '')}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <i className={`fa-regular ${copiedToken ? 'fa-circle-check text-emerald-500' : 'fa-copy'}`} />
                  <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                </button>
              </div>
              <div className={`p-3 rounded-xl font-mono text-[11px] select-all truncate ${
                isLight ? 'bg-white border border-slate-200 text-slate-800' : 'bg-[#0A0D15] border border-[#182335] text-slate-300'
              }`}>
                {mandate.mandate_token || mandate.id}
              </div>
            </div>
          ) : (
            <div className="pt-4 text-xs text-slate-500 dark:text-slate-400">
              {user.isLoggedIn
                ? 'Create an e-mandate in the TokenHQ Vault to authorize autonomous 1-click agent purchases.'
                : 'Sign in with Google above to configure Pre-Authorized Mandates and enable zero-click micro-spends.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
