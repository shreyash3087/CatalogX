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

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg flex-shrink-0 border border-emerald-500/20">
            <i className="fa-regular fa-circle-check" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg flex-shrink-0 border border-amber-500/20">
            <i className="fa-regular fa-triangle-exclamation" />
          </div>
        );
      case 'error':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg flex-shrink-0 border border-rose-500/20">
            <i className="fa-regular fa-circle-xmark" />
          </div>
        );
      case 'confirm':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg flex-shrink-0 border border-rose-500/20">
            <i className="fa-regular fa-shield-exclamation" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg flex-shrink-0 border border-blue-500/20">
            <i className="fa-regular fa-circle-info" />
          </div>
        );
    }
  };

  const getTitle = () => {
    if (options.title) return options.title;
    switch (type) {
      case 'success':
        return 'Success';
      case 'warning':
        return 'Attention Required';
      case 'error':
        return 'Notice';
      case 'confirm':
        return 'Please Confirm';
      case 'info':
      default:
        return 'Information';
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
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all space-y-4 ${
          isLight
            ? 'bg-white text-slate-950 border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.2)]'
            : 'bg-[#0f141d] text-white border-[#22314a] shadow-[0_0_40px_rgba(0,0,0,0.9)]'
        }`}
      >
        {/* Header with Icon and Title */}
        <div className="flex items-start gap-3.5">
          {getIcon()}
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className={`text-sm font-bold tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              {getTitle()}
            </h3>
            <p className={`text-xs leading-relaxed whitespace-pre-line ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              {options.message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2 justify-end border-t border-slate-100 dark:border-slate-800/80">
          {isConfirm ? (
            <>
              <button
                onClick={handleCancel}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isLight
                    ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-700 text-slate-300 hover:bg-white/5'
                }`}
              >
                {options.cancelText || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
              >
                {options.confirmText || 'Confirm'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
            >
              {options.confirmText || 'Got it'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
