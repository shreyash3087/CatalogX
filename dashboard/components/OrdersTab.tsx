'use strict';
'use client';

import React, { useState } from 'react';
import { AgentEvent } from '@/hooks/useAgentFeed';

type Props = {
  events: AgentEvent[];
  theme: 'light' | 'dark';
};

export default function OrdersTab({ events, theme }: Props) {
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Created'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isLight = theme === 'light';

  // Map verified payments
  const paymentMap = new Map<string, string>();
  for (const e of events) {
    if (e.type === 'PAYMENT_VERIFIED' || e.type === 'PAYMENT_CAPTURED') {
      const out = (e.output_data || {}) as Record<string, any>;
      const inp = (e.input_data || {}) as Record<string, any>;
      const orderId = out.razorpay_order_id || inp.razorpay_order_id || e.razorpay_order_id;
      const payId = out.razorpay_payment_id || inp.razorpay_payment_id || e.razorpay_payment_id;
      if (orderId && payId) {
        paymentMap.set(orderId, payId);
      }
    }
  }

  // Deduplicate and parse orders
  const orders: any[] = [];
  const seenOrders = new Set<string>();

  for (const ev of events) {
    if (ev.type === 'ORDER_CREATED') {
      const out = (ev.output_data || {}) as Record<string, any>;
      const inp = (ev.input_data || {}) as Record<string, any>;
      const orderId = out.razorpay_order_id || inp.razorpay_order_id || ev.razorpay_order_id;
      if (orderId && !seenOrders.has(orderId)) {
        seenOrders.add(orderId);
        const amountDisplay =
          out.amount?.display ||
          (out.amount?.inr ? `₹${out.amount.inr}` : '') ||
          (ev.amount_inr ? `₹${ev.amount_inr}` : '₹1,499.00');
        const prodName = out.product_name || inp.product_name || ev.product_name || 'Item';
        const gateTier = out.gate_tier || inp.gate_tier || 'AUTO';
        const payId = paymentMap.get(orderId);
        const isPaid = !!payId;

        const custName = (ev as any).customer?.name || out.customer?.name || inp.customer?.name || 'Shreyas';
        const shipDest = (ev as any).shipping_address ? `${(ev as any).shipping_address.city}, ${(ev as any).shipping_address.state}` : (out.shipping_destination || 'Bengaluru, Karnataka');

        orders.push({
          orderId,
          productName: prodName,
          customerName: custName,
          shippingDest: shipDest,
          amountDisplay,
          amountNumber: out.amount?.inr ? parseFloat(out.amount.inr) : 1499,
          gateTier,
          status: isPaid ? 'Paid' : 'Created',
          payId,
          receipt: out.receipt || inp.receipt || `rcpt_${orderId.slice(-8)}`,
          attempts: isPaid ? 1 : 0,
          timestamp: ev.timestamp,
        });
      }
    }
  }

  // Calculate metrics (Image 1 style)
  const paidOrders = orders.filter((o) => o.status === 'Paid');
  const totalCollected = paidOrders.reduce((sum, o) => sum + (o.amountNumber || 0), 0);

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (filter === 'Paid' && o.status !== 'Paid') return false;
    if (filter === 'Created' && o.status !== 'Created') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        (o.payId && o.payId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 w-full max-w-6xl mx-auto no-scrollbar animate-fade-in">
      {/* Overview Cards (Image 1 style) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className={isLight ? 'text-slate-900' : 'text-white'}>Overview</span>
            <span className="text-blue-600 cursor-pointer">Today ▾</span>
          </div>
          <a
            href="https://razorpay.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 font-medium cursor-pointer flex items-center gap-1"
          >
            <span>Documentation</span>
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Collected Amount */}
          <div
            className={`p-4 rounded-2xl border shadow-sm ${
              isLight ? 'bg-white border-slate-200/90' : 'bg-[#11161f] border-[#202c3f]'
            }`}
          >
            <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Collected Amount
            </div>
            <div className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ₹{totalCollected.toLocaleString('en-IN')}.00
            </div>
            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              from {paidOrders.length} captured payments
            </div>
          </div>

          {/* Refunds */}
          <div
            className={`p-4 rounded-2xl border shadow-sm ${
              isLight ? 'bg-white border-slate-200/90' : 'bg-[#11161f] border-[#202c3f]'
            }`}
          >
            <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Refunds
            </div>
            <div className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ₹0.00
            </div>
            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>0 processed</div>
          </div>

          {/* Disputes */}
          <div
            className={`p-4 rounded-2xl border shadow-sm ${
              isLight ? 'bg-white border-slate-200/90' : 'bg-[#11161f] border-[#202c3f]'
            }`}
          >
            <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Disputes
            </div>
            <div className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              ₹0.00
            </div>
            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>0 under-review</div>
          </div>

          {/* Failed */}
          <div
            className={`p-4 rounded-2xl border shadow-sm ${
              isLight ? 'bg-white border-slate-200/90' : 'bg-[#11161f] border-[#202c3f]'
            }`}
          >
            <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Failed
            </div>
            <div className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              0
            </div>
            <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>0 payments</div>
          </div>
        </div>
      </div>

      {/* Orders Table Container (Image 1 style) */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          isLight ? 'bg-white border-slate-200/90' : 'bg-[#11161f] border-[#202c3f]'
        }`}
      >
        {/* Table Filters & Search */}
        <div
          className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'border-slate-200 bg-white' : 'border-[#202c3f] bg-[#141b27]'
          }`}
        >
          {/* Filter Pills with High Contrast Whiter Text */}
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isLight
              ? 'bg-slate-100 border-slate-200'
              : 'bg-[#0B1019] border-[#22314A]'
          }`}>
            {(['All', 'Paid', 'Created'] as const).map((tab) => {
              const isSelected = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-white text-slate-950 shadow-xs border border-slate-200'
                        : 'bg-[#182338] text-white shadow-xs border border-blue-500/40'
                      : isLight
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200/60'
                      : 'text-slate-200 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search in Order Id..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-blue-500 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  : 'bg-[#0a0f18] border-[#22314a] text-white placeholder:text-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Table Body */}
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              No orders found
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Orders created by the AI buyer agent will be recorded here in real time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`border-b text-[10.5px] uppercase font-bold tracking-wider ${
                    isLight
                      ? 'bg-slate-50/70 border-slate-200 text-slate-500'
                      : 'bg-[#0E131C] border-[#202c3f] text-slate-400'
                  }`}
                >
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Item & Merchant</th>
                  <th className="py-3 px-4">Customer & Shipping</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1C2638]">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.orderId}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-slate-50/80 text-slate-800' : 'hover:bg-white/[0.02] text-slate-200'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
                      {o.orderId}
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      <div className="font-semibold text-slate-900 dark:text-white">{o.productName}</div>
                      <div className="text-[10.5px] text-slate-500 font-normal">CatalogX Direct Order</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{o.customerName}</span>
                      </div>
                      <div className="text-[10.5px] text-slate-500 flex items-center gap-1">
                        <svg className="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{o.shippingDest}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">{o.amountDisplay}</td>
                    <td className="py-3.5 px-4">
                      {o.status === 'Paid' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Created</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px] select-all">
                      {o.payId || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {o.timestamp ? new Date(o.timestamp).toLocaleTimeString() : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
