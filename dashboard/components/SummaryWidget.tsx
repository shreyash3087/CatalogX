'use client';

import React from 'react';

type Props = {
  stats: {
    sessions: number;
    completedPurchases: number;
    totalSpend: number;
    stockOuts: number;
  };
};

export default function SummaryWidget({ stats }: Props) {
  return (
    <div className="space-y-4">
      {/* 1. Summary Card */}
      <div className="bg-[#13161c] border border-[#20242f] rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-200 mb-3 tracking-wide">Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm">👥</span>
              <span>Total Sessions</span>
            </div>
            <span className="font-bold text-slate-100 font-mono">{stats.sessions || 1}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm">🛒</span>
              <span>Total Purchases</span>
            </div>
            <span className="font-bold text-slate-100 font-mono">{stats.completedPurchases}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm">💳</span>
              <span>Total Spends</span>
            </div>
            <span className="font-bold text-amber-400 font-mono">
              ₹{stats.totalSpend.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="text-sm">🔔</span>
              <span>Inventory Alerts</span>
            </div>
            <span className="font-bold text-slate-100 font-mono">{stats.stockOuts}</span>
          </div>
        </div>
      </div>

      {/* 2. Sessions (Last 7 days) Chart */}
      <div className="bg-[#13161c] border border-[#20242f] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-200 tracking-wide">
            Sessions <span className="text-[11px] font-normal text-slate-400">(Last 7 days)</span>
          </h3>
        </div>

        {/* SVG Smooth Curve */}
        <div className="w-full h-24 relative pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 280 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Filled Area */}
            <path
              d="M 10 55 Q 50 60 75 58 T 140 18 T 205 45 T 270 38 L 270 80 L 10 80 Z"
              fill="url(#chartGlow)"
            />

            {/* Stroke Line */}
            <path
              d="M 10 55 Q 50 60 75 58 T 140 18 T 205 45 T 270 38"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Glowing Data Dots */}
            <circle cx="10" cy="55" r="3.5" fill="#fbbf24" stroke="#13161c" strokeWidth="2" />
            <circle cx="75" cy="58" r="3.5" fill="#fbbf24" stroke="#13161c" strokeWidth="2" />
            <circle cx="140" cy="18" r="4.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" className="animate-pulse" />
            <circle cx="205" cy="45" r="3.5" fill="#fbbf24" stroke="#13161c" strokeWidth="2" />
            <circle cx="270" cy="38" r="3.5" fill="#fbbf24" stroke="#13161c" strokeWidth="2" />
          </svg>
        </div>

        {/* Date Labels */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-[#1e232e]">
          <span>May 22</span>
          <span>May 23</span>
          <span className="text-amber-400 font-bold">May 24</span>
          <span>May 25</span>
          <span>May 26</span>
        </div>
      </div>

      {/* 3. Top Categories Card */}
      <div className="bg-[#13161c] border border-[#20242f] rounded-2xl p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-200 mb-3 tracking-wide">Top Categories</h3>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#1b1e26] border border-[#272d3b] flex items-center justify-center text-slate-400 text-lg mb-2">
            📦
          </div>
          <span className="text-xs text-slate-400">Footwear & Electronics</span>
          <span className="text-[10px] text-slate-500 mt-0.5">2 active federated merchants</span>
        </div>
      </div>
    </div>
  );
}
