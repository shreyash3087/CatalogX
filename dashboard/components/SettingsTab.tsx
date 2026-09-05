'use strict';
'use client';

import React, { useState } from 'react';
import { MandateRecord } from './MandateVaultModal';
import GoogleSignInRender, { UserProfile, GUEST_USER } from './GoogleAuthButton';
import { NotificationOptions, NotificationType } from './NotificationModal';

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
  const [avatarError, setAvatarError] = useState(false);

  // Delivery form state - strictly empty unless previously saved by user
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
    setAvatarError(false);
    onUserChange(loggedUser);
    localStorage.setItem('catalogx_user', JSON.stringify(loggedUser));

    // Immediately persist user to MongoDB users collection & restore existing profile
    fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loggedUser),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.profile?.delivery_address?.street || data?.profile?.phone) {
          const merged: UserProfile = {
            ...loggedUser,
            phone: data.profile.phone || loggedUser.phone || '',
            delivery_address: data.profile.delivery_address,
          };
          onUserChange(merged);
          localStorage.setItem('catalogx_user', JSON.stringify(merged));
          if (merged.phone) setInputPhone(merged.phone);
          if (merged.delivery_address?.street) setInputStreet(merged.delivery_address.street);
          if (merged.delivery_address?.city) setInputCity(merged.delivery_address.city);
          if (merged.delivery_address?.state) setInputState(merged.delivery_address.state);
          if (merged.delivery_address?.postal_code) setInputPostalCode(merged.delivery_address.postal_code);
          if (merged.delivery_address?.country) setInputCountry(merged.delivery_address.country);
        }
      })
      .catch(() => {});

    notify({
      title: 'Google Sign-In Successful',
      message: `Welcome, ${loggedUser.name}! Please configure your delivery address below to enable the AI Buyer Agent.`,
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

    // Sync with MongoDB backend
    fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});

    notify({
      title: 'Delivery Address Saved',
      message: 'Your shipping location & contact details are saved! Your AI Buyer Agent is now ready to execute orders.',
      type: 'success',
    });
  };

  const handleSignOut = () => {
    onUserChange(GUEST_USER);
    localStorage.removeItem('catalogx_user');
    setInputPhone('');
    setInputStreet('');
    setInputCity('');
    setInputState('');
    setInputPostalCode('');
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
    notify({
      title: 'Signed Out',
      message: 'You have signed out of your account.',
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
        <h2 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
          User Profile & Authentication
        </h2>

        <div
          className={`p-6 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#0B1019] border-[#1C283B] shadow-xs'
          }`}
        >
          {user.isLoggedIn ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left: Real User Info */}
              <div className="lg:col-span-8 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-[#131B2A] border-[#22314A] text-slate-300'
                }`}>
                  {user.avatar && !avatarError ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={() => setAvatarError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-xl flex items-center justify-center">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-base font-bold truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      {user.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span>Google Verified</span>
                    </span>
                  </div>
                  <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {user.email}
                  </div>
                  <div className={`text-[11px] pt-0.5 ${user.phone ? (isLight ? 'text-slate-700 font-medium' : 'text-slate-300') : 'text-amber-500 font-medium'}`}>
                    {user.phone ? `Contact: ${user.phone}` : '⚠️ Phone number not configured'}
                  </div>
                </div>
              </div>

              {/* Right: Sign Out Action */}
              <div className="lg:col-span-4 flex items-center justify-start lg:justify-end">
                <button
                  onClick={handleSignOut}
                  className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    isLight
                      ? 'border-slate-300 text-slate-700 hover:border-red-500 hover:text-red-600 hover:bg-red-50/50 shadow-2xs'
                      : 'border-slate-700 text-slate-300 hover:border-red-500 hover:text-red-400 hover:bg-red-950/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${
                  isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-[#131B2A] border-[#22314A] text-slate-400'
                }`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
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
          <h2 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            Delivery Location & Fulfillment
          </h2>
          {user.isLoggedIn && hasCompleteDelivery && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Ready for Autonomous Checkout</span>
            </span>
          )}
        </div>

        <div
          className={`p-6 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#0B1019] border-[#1C283B] shadow-xs'
          }`}
        >
          {!user.isLoggedIn ? (
            <div className="py-8 text-center space-y-2.5">
              <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border ${
                isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                No Delivery Details Configured
              </div>
              <p className={`text-xs max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Please sign in with Google above. You will be prompted to enter your shipping address and contact number so the agent can fulfill your orders.
              </p>
            </div>
          ) : !hasCompleteDelivery || showEditDelivery ? (
            <form onSubmit={handleSaveDelivery} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className={`text-sm font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                    {!hasCompleteDelivery ? 'Complete Your Delivery & Contact Setup' : 'Edit Delivery Address'}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    These details are required to enable the AI Buyer Agent to place orders on merchant stores without needing individual store accounts.
                  </p>
                </div>
                {hasCompleteDelivery && (
                  <button
                    type="button"
                    onClick={() => setShowEditDelivery(false)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* High Contrast Form Labels & Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                    Contact Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-blue-600 transition-all ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white'
                        : 'bg-[#0A0E17] border-[#22314A] text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                    Street Address / House No. / Flat No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputStreet}
                    onChange={(e) => setInputStreet(e.target.value)}
                    placeholder="e.g. Flat 402, Skyline Residency, 100ft Road, Indiranagar"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-blue-600 transition-all ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white'
                        : 'bg-[#0A0E17] border-[#22314A] text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputCity}
                    onChange={(e) => setInputCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-blue-600 transition-all ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white'
                        : 'bg-[#0A0E17] border-[#22314A] text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputState}
                    onChange={(e) => setInputState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-blue-600 transition-all ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white'
                        : 'bg-[#0A0E17] border-[#22314A] text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                    PIN Code / Postal Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={inputPostalCode}
                    onChange={(e) => setInputPostalCode(e.target.value)}
                    placeholder="e.g. 560038"
                    required
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-blue-600 transition-all ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white'
                        : 'bg-[#0A0E17] border-[#22314A] text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`text-xs font-bold block mb-1.5 ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                    Country
                  </label>
                  <input
                    type="text"
                    value={inputCountry}
                    onChange={(e) => setInputCountry(e.target.value)}
                    placeholder="India"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-blue-600 transition-all ${
                      isLight
                        ? 'bg-slate-50/70 border-slate-300 text-slate-950 placeholder:text-slate-400 focus:bg-white'
                        : 'bg-[#0A0E17] border-[#22314A] text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <span>Save Delivery Details & Activate Agent</span>
                </button>
                {hasCompleteDelivery && (
                  <button
                    type="button"
                    onClick={() => setShowEditDelivery(false)}
                    className={`px-4 py-2.5 font-bold text-xs rounded-xl transition-all cursor-pointer ${
                      isLight ? 'bg-slate-200 text-slate-800 hover:bg-slate-300' : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
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
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 border ${
                    isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      Primary Shipping Address
                    </div>
                    <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
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
                  className="px-3.5 py-1.5 rounded-xl border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-bold text-xs transition-all cursor-pointer flex-shrink-0 flex items-center gap-1.5 shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 text-xs">
                <div>
                  <span className={`font-semibold block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Contact Phone</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-950' : 'text-slate-100'}`}>
                    {user.phone}
                  </span>
                </div>
                <div>
                  <span className={`font-semibold block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>City & State</span>
                  <span className={`font-bold ${isLight ? 'text-slate-950' : 'text-slate-100'}`}>
                    {user.delivery_address?.city}, {user.delivery_address?.state}
                  </span>
                </div>
                <div>
                  <span className={`font-semibold block mb-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>PIN Code</span>
                  <span className={`font-mono font-bold ${isLight ? 'text-slate-950' : 'text-slate-100'}`}>
                    {user.delivery_address?.postal_code}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Account and Product Settings (Mandate Vault) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            Account and product settings
          </h2>
          <a
            href="https://razorpay.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
          >
            <span>Documentation</span>
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Card 1: Pre-Authorized Mandate Vault */}
        <div
          className={`p-6 rounded-2xl border transition-all ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-[#0B1019] border-[#1C283B] shadow-xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 border ${
                isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <div className={`text-sm font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Pre-Authorized Mandate Vault
                </div>
                <div className={`text-xs mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  NPCI UAP / Razorpay TokenHQ e-mandate enabling zero-click micro-spends under ₹1,500.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              {isMandateActive ? (
                <span
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold flex items-center gap-1.5 border shadow-2xs ${
                    isLight
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>MANDATE ACTIVE</span>
                </span>
              ) : (
                <span
                  className={`px-3 py-1 rounded-full text-[10.5px] font-bold border ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : 'bg-[#182338] text-slate-200 border-[#2b3c5a]'
                  }`}
                >
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
                className="px-4 py-2 rounded-xl bg-[#0c6cf2] hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span>Manage TokenHQ Vault</span>
              </button>
            </div>
          </div>

          {isMandateActive && mandate ? (
            <div className="pt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Active Cryptographic Token</span>
                <button
                  onClick={() => handleCopy(mandate.mandate_token || mandate.id || '')}
                  className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                  </svg>
                  <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                </button>
              </div>
              <div className={`p-3 rounded-xl font-mono text-[11px] select-all truncate ${
                isLight ? 'bg-slate-50 border border-slate-300 text-slate-950 font-bold' : 'bg-[#0A0D15] border border-[#182335] text-slate-300'
              }`}>
                {mandate.mandate_token || mandate.id}
              </div>
            </div>
          ) : (
            <div className={`pt-4 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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
