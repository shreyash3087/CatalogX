'use client';

import React from 'react';

type Props = {
  currentTier: string | null;
};

const TIERS = [
  {
    tier: 'AUTO',
    label: 'Tier 1: Auto Mandate',
    threshold: '≤ ₹1,500',
    description: 'Executes autonomously via pre-authorized mandate with zero human friction.',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dotColor: '#10b981',
    activeBg: 'bg-emerald-950/20 border-emerald-500/50 shadow-emerald-500/10',
  },
  {
    tier: 'REVIEW',
    label: 'Tier 2: 1-Click Consent',
    threshold: '₹1,501 – ₹5,000',
    description: 'Order created on Razorpay. Requires 1-click human checkout authorization.',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dotColor: '#f59e0b',
    activeBg: 'bg-amber-950/20 border-amber-500/50 shadow-amber-500/10',
  },
  {
    tier: 'HIGH_VALUE_2FA',
    label: 'Tier 3: High-Value 2FA Gated',
    threshold: '> ₹5,000',
    description: 'High-ticket purchase. Mandatory 2FA OTP verification required on Razorpay.',
    badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    dotColor: '#f97316',
    activeBg: 'bg-orange-950/20 border-orange-500/50 shadow-orange-500/10',
  },
  {
    tier: 'REJECT',
    label: 'Tier 4: Policy Rejection',
    threshold: 'Exceeds Budget',
    description: 'Immediate refusal. Product price exceeds user requested budget constraint.',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
    dotColor: '#ef4444',
    activeBg: 'bg-red-950/20 border-red-500/50 shadow-red-500/10',
  },
];

export default function GatingIndicator({ currentTier }: Props) {
  return (
    <div className="space-y-4 p-4">
      {/* Banner */}
      <div className="bg-[#171a22] border border-[#232837] rounded-xl p-4 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-200">
            Autonomous Spend Governor (Guardrails)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Every transaction is bounded, explainable, and gated before touching Razorpay APIs.
          </p>
        </div>
        {currentTier ? (
          <div className="px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
            Active: {currentTier}
          </div>
        ) : (
          <div className="px-3 py-1 rounded-full text-[11px] font-mono text-slate-400 bg-[#0f1217] border border-[#222736]">
            Idle
          </div>
        )}
      </div>

      {/* Tier Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TIERS.map((t) => {
          const isActive = currentTier === t.tier;
          return (
            <div
              key={t.tier}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isActive
                  ? `${t.activeBg} shadow-lg scale-[1.01]`
                  : 'bg-[#141720] border-[#222736] hover:border-[#2d3448]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.dotColor }}
                  />
                  <span className="text-xs font-bold text-slate-200">{t.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${t.badgeColor}`}>
                  {t.threshold}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
