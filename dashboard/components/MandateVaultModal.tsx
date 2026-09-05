'use strict';
'use client';

import React, { useState } from 'react';
import { NotificationOptions, NotificationType } from './NotificationModal';

export type MandateRecord = {
  id?: string;
  mandate_token: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  auth_payment_id?: string;
  auth_order_id?: string;
  max_limit_inr: number;
  protocol: string;
  created_at: string;
  expires_at: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  mandate: MandateRecord | null;
  onMandateUpdated: (m: MandateRecord | null) => void;
  theme?: 'light' | 'dark';
  showAlert?: (options: NotificationOptions | string, type?: NotificationType) => void;
};

export default function MandateVaultModal({
  isOpen,
  onClose,
  mandate,
  onMandateUpdated,
  theme = 'light',
  showAlert,
}: Props) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const isActive = mandate && mandate.status === 'ACTIVE';

  const notify = (opts: NotificationOptions | string, type: NotificationType = 'info') => {
    if (showAlert) {
      showAlert(opts, type);
    } else {
      console.log('Notification:', opts);
    }
  };

  const handleCopyToken = () => {
    if (mandate?.mandate_token) {
      navigator.clipboard.writeText(mandate.mandate_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Real ₹1.00 Mandate Registration on Razorpay
  const handleSetupMandate = async () => {
    if (typeof window === 'undefined' || !(window as any).Razorpay) {
      notify({
        title: 'Checkout SDK Loading',
        message: 'Razorpay Checkout SDK is still loading. Please try again in a moment.',
        type: 'warning',
      });
      return;
    }

    setIsRegistering(true);
    try {
      // 1. Create ₹1.00 mandate registration authorization order
      const regRes = await fetch('/api/mandates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: 'CatalogX Buyer',
          max_limit_inr: 1500,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok) throw new Error(regData.error || 'Failed to initiate mandate registration');

      // 2. Open Razorpay Checkout modal for ₹1.00 authorization
      const options = {
        key: regData.key_id,
        name: 'Razorpay TokenHQ Vault',
        description: 'Pre-Authorized e-Mandate Setup (₹1.00 Verification)',
        order_id: regData.order_id,
        amount: regData.amount,
        currency: 'INR',
        prefill: {
          name: 'CatalogX Buyer',
          email: 'buyer@catalogx.ai',
          contact: '9876543210',
        },
        theme: {
          color: '#0c6cf2',
        },
        handler: async function (response: any) {
          try {
            // 3. Cryptographically verify signature and issue mandate token
            const vRes = await fetch('/api/mandates/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                max_limit_inr: 1500,
              }),
            });

            const vData = await vRes.json();
            if (vRes.ok && vData.mandate) {
              onMandateUpdated(vData.mandate);
              localStorage.setItem('catalogx_active_mandate', JSON.stringify(vData.mandate));
              notify({
                title: 'Mandate Activated',
                message: 'Your NPCI UPI 2.0 / TokenHQ mandate is active. AI Buyer Agent is now authorized for zero-click purchases up to ₹1,500.',
                type: 'success',
              });
            } else {
              throw new Error(vData.error || 'Verification failed');
            }
          } catch (err: any) {
            console.error('[Mandate Setup] Verification Error:', err);
            notify({
              title: 'Verification Error',
              message: `Mandate verification failed: ${err.message}`,
              type: 'error',
            });
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('[Mandate Setup] Error:', err);
      notify({
        title: 'Registration Error',
        message: `Setup error: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRevokeMandate = () => {
    notify({
      title: 'Revoke Mandate Authorization',
      message: 'Are you sure you want to revoke this cryptographic mandate? Your AI Buyer Agent will require manual 2FA authorization for all future purchases.',
      type: 'confirm',
      confirmText: 'Revoke Mandate',
      cancelText: 'Keep Mandate',
      onConfirm: async () => {
        setIsRevoking(true);
        try {
          const res = await fetch('/api/mandates/revoke', { method: 'POST' });
          if (res.ok) {
            onMandateUpdated(null);
            localStorage.removeItem('catalogx_active_mandate');
            notify({
              title: 'Mandate Revoked',
              message: 'The standing mandate has been revoked. All purchases will now require 2FA OTP approval.',
              type: 'info',
            });
          }
        } catch (err: any) {
          console.error('[Mandate Revoke] Error:', err);
        } finally {
          setIsRevoking(false);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div
        className={`w-full max-w-2xl lg:max-w-3xl rounded-2xl shadow-2xl border transition-all overflow-hidden ${
          isLight
            ? 'bg-white text-slate-950 border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)]'
            : 'bg-[#0A0E18] text-slate-100 border-[#1C253B] shadow-[0_0_50px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 sm:px-8 py-5 border-b flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-[#1C253B] bg-[#070A12]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg border flex-shrink-0 ${
                isLight
                  ? 'bg-blue-50 border-blue-200 text-[#0c6cf2]'
                  : 'bg-blue-950/60 border-blue-700/50 text-blue-400'
              }`}
            >
              <i className="fa-regular fa-shield-halved" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  Agentic Mandate Vault
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide uppercase border ${
                    isLight
                      ? 'bg-blue-100/70 text-blue-800 border-blue-200'
                      : 'bg-blue-950/60 text-blue-300 border-blue-800/60'
                  }`}
                >
                  Razorpay TokenHQ
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wide uppercase border ${
                    isLight
                      ? 'bg-slate-200/70 text-slate-800 border-slate-300'
                      : 'bg-[#151C2C] text-slate-400 border-[#222E47]'
                  }`}
                >
                  NPCI UPI 2.0
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-normal ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Cryptographic standing authorization enabling autonomous, zero-click micro-spends.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isLight ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Close dialog"
          >
            <i className="fa-regular fa-xmark text-sm" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 sm:p-4.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isActive
                ? isLight
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-emerald-950/30 border-emerald-800/50 text-emerald-200'
                : isLight
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-amber-950/30 border-amber-800/50 text-amber-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <div className="space-y-0.5">
                <div className={`text-xs font-bold tracking-wide ${isLight ? (isActive ? 'text-emerald-950' : 'text-amber-950') : (isActive ? 'text-emerald-200' : 'text-amber-200')}`}>
                  {isActive
                    ? 'Cryptographic Mandate Active & Pre-Authorized'
                    : 'Mandate Inactive — Authorization Required'}
                </div>
                <p
                  className={`text-[11.5px] leading-relaxed font-normal ${
                    isLight ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  {isActive
                    ? 'Your AI Buyer Agent is cryptographically authorized to execute purchases up to ₹1,500 autonomously without 2FA OTP delays.'
                    : 'Authorize a one-time ₹1.00 verification charge via Razorpay to issue your agent an RBI-compliant standing mandate token.'}
                </p>
              </div>
            </div>

            <span
              className={`self-start sm:self-center px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider flex-shrink-0 border ${
                isActive
                  ? isLight
                    ? 'bg-emerald-200/90 text-emerald-950 border-emerald-400'
                    : 'bg-emerald-900/50 text-emerald-300 border-emerald-700/60'
                  : isLight
                  ? 'bg-amber-200/90 text-amber-950 border-amber-400'
                  : 'bg-amber-900/50 text-amber-300 border-amber-700/60'
              }`}
            >
              {isActive ? 'HEADLESS READY' : 'REQUIRES AUTH'}
            </span>
          </div>

          {/* Policy & Compliance Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-[#0F1422] border-[#1C253B]'
              }`}
            >
              <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Per-Order Cap
              </div>
              <div className={`text-lg font-extrabold mt-1 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                ₹1,500.00
              </div>
              <div className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Autonomous micro-spend limit
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-[#0F1422] border-[#1C253B]'
              }`}
            >
              <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Monthly RBI Limit
              </div>
              <div className={`text-lg font-extrabold mt-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                ₹15,000.00
              </div>
              <div className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                RBI e-Mandate recurring framework
              </div>
            </div>

            <div
              className={`p-4 rounded-xl border ${
                isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-[#0F1422] border-[#1C253B]'
              }`}
            >
              <div className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Cryptographic Model
              </div>
              <div className={`text-lg font-extrabold font-mono mt-1 ${isLight ? 'text-[#0c6cf2]' : 'text-blue-400'}`}>
                HMAC-SHA256
              </div>
              <div className={`text-[10.5px] mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Zero-Knowledge token verification
              </div>
            </div>
          </div>

          {/* Active Mandate Token Section */}
          {isActive && mandate && (
            <div
              className={`p-4 rounded-xl border space-y-3 ${
                isLight ? 'bg-[#F8FAFC] border-slate-200' : 'bg-[#06080F] border-[#1C253B]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-slate-950' : 'text-slate-200'}`}>
                  <i className="fa-regular fa-key text-blue-600 text-xs" />
                  <span>Issued Cryptographic Mandate Token</span>
                </span>
                <button
                  onClick={handleCopyToken}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100 shadow-2xs'
                      : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <i
                    className={`fa-regular ${
                      copied ? 'fa-circle-check text-emerald-600' : 'fa-copy'
                    } text-xs`}
                  />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div
                className={`p-3 rounded-lg font-mono text-xs break-all select-all border ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-950 font-bold shadow-2xs'
                    : 'bg-[#090D16] border-[#182030] text-slate-200'
                }`}
              >
                {mandate.mandate_token}
              </div>

              <div className={`flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-1 gap-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span>
                  Auth Payment ID:{' '}
                  <strong className={`font-mono ${isLight ? 'text-slate-950 font-bold' : 'text-slate-300 font-normal'}`}>
                    {mandate.auth_payment_id || 'pay_test_mnd_858f72709'}
                  </strong>
                </span>
                <span className="flex items-center gap-1">
                  <i className="fa-regular fa-calendar-check text-[10px]" />
                  <span>Valid for 30 Days (Renewable)</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div
          className={`px-6 sm:px-8 py-4 border-t flex items-center justify-between gap-3 ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-[#1C253B] bg-[#070A12]'
          }`}
        >
          {isActive ? (
            <button
              onClick={handleRevokeMandate}
              disabled={isRevoking}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                isLight
                  ? 'border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 shadow-2xs'
                  : 'border-rose-900/60 text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              <i className="fa-regular fa-trash-can text-xs" />
              <span>{isRevoking ? 'Revoking Authorization...' : 'Revoke Mandate'}</span>
            </button>
          ) : (
            <button
              onClick={handleSetupMandate}
              disabled={isRegistering}
              className="py-2.5 px-5 rounded-xl bg-[#0c6cf2] hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <i className="fa-regular fa-credit-card text-xs" />
              <span>{isRegistering ? 'Connecting Razorpay...' : 'Authorize Mandate (₹1.00 Auth)'}</span>
            </button>
          )}

          <button
            onClick={onClose}
            className={`py-2.5 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-950'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
