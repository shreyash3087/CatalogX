'use strict';
'use client';

import React from 'react';

export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'confirm';

export type NotificationOptions = {
  title?: string;
  message: string;
  type?: NotificationType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

type Props = {
  isOpen: boolean;
  options: NotificationOptions | null;
  onClose: () => void;
  theme?: 'light' | 'dark';
};

export default function NotificationModal({ isOpen, options, onClose, theme = 'light' }: Props) {
  if (!isOpen || !options) return null;

  const isLight = theme === 'light';
  const type = options.type || 'info';
  const isConfirm = type === 'confirm';

  const getAuraColor = () => {
    switch (type) {
      case 'success':
        return 'from-emerald-500/20 via-emerald-500/5 to-transparent';
      case 'warning':
        return 'from-amber-500/20 via-amber-500/5 to-transparent';
      case 'error':
      case 'confirm':
        return 'from-rose-500/20 via-rose-500/5 to-transparent';
      case 'info':
      default:
        return 'from-blue-500/20 via-blue-500/5 to-transparent';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'confirm':
        return (
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 border border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.002A11.959 11.959 0 0112 2.714z" />
            </svg>
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
        );
    }
  };

  const getTitle = () => {
    if (options.title) return options.title;
    switch (type) {
      case 'success':
        return 'Operation Successful';
      case 'warning':
        return 'Attention Required';
      case 'error':
        return 'Notice';
      case 'confirm':
        return 'Please Confirm';
      case 'info':
      default:
        return 'System Information';
    }
  };

  const handleConfirm = () => {
    if (options.onConfirm) options.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (options.onCancel) options.onCancel();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border transition-all overflow-hidden ${
          isLight
            ? 'bg-white text-slate-950 border-slate-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)]'
            : 'bg-[#0A0E18] text-white border-[#1C253B] shadow-[0_0_50px_rgba(0,0,0,0.85)]'
        }`}
      >
        {/* Subtle Ambient Radial Glow on Top */}
        <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${getAuraColor()} pointer-events-none`} />

        {/* Content Body */}
        <div className="relative p-6 sm:p-7 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              {getIcon()}
              <div className="space-y-1 pt-0.5">
                <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                  {getTitle()}
                </h3>
                <p className={`text-xs leading-relaxed whitespace-pre-line font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {options.message}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer flex-shrink-0 ${
                isLight
                  ? 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-2.5 pt-4 justify-end border-t ${
            isLight ? 'border-slate-100' : 'border-[#172033]'
          }`}>
            {isConfirm ? (
              <>
                <button
                  onClick={handleCancel}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isLight
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-700 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  {options.confirmText || 'Confirm'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer active:scale-95"
              >
                {options.confirmText || 'Got it'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
