'use strict';
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AgentEvent } from '@/hooks/useAgentFeed';

type OrderItem = {
  orderId: string;
  productName: string;
  merchantName: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingDest: string;
  amountDisplay: string;
  amountNumber: number;
  gateTier: string;
  status: 'Paid' | 'Created';
  payId?: string;
  receipt?: string;
  attempts?: number;
  timestamp?: string;
};

type Props = {
  events: AgentEvent[];
  theme: 'light' | 'dark';
};

function parseNumericInr(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 1499 : val;
  }
  if (!val) return 1499;
  const str = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(str);
  return isNaN(num) || num <= 0 ? 1499 : num;
}

export default function OrdersTab({ events, theme }: Props) {
  const [filter, setFilter] = useState<'All' | 'Paid' | 'Created'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [serverOrders, setServerOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isLight = theme === 'light';

  // 1. Fetch persistent orders from MongoDB
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          setServerOrders(data.orders);
        }
      }
    } catch (err) {
      console.warn('[OrdersTab] Failed to fetch server orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 4000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  // 2. Map verified payments from real-time events stream
  const paymentMap = new Map<string, string>();
  for (const e of events) {
    const action = e.type || e.action || '';
    if (action === 'PAYMENT_VERIFIED' || action === 'PAYMENT_CAPTURED') {
      const out = (e.output_data || {}) as Record<string, any>;
      const inp = (e.input_data || {}) as Record<string, any>;
      const orderId = out.razorpay_order_id || inp.razorpay_order_id || e.razorpay_order_id;
      const payId = out.razorpay_payment_id || inp.razorpay_payment_id || e.razorpay_payment_id;
      if (orderId && payId) {
        paymentMap.set(orderId, payId);
      }
    }
  }

  // 3. Merge server orders with event orders
  const ordersMap = new Map<string, OrderItem>();

  // Add server orders first
  for (const o of serverOrders) {
    const payId = paymentMap.get(o.orderId) || o.payId;
    const isPaid = o.status === 'Paid' || !!payId;
    const numAmt = parseNumericInr(o.amountNumber);
    ordersMap.set(o.orderId, {
      ...o,
      amountNumber: numAmt,
      amountDisplay: `₹${numAmt.toLocaleString('en-IN')}`,
      status: isPaid ? 'Paid' : 'Created',
      payId: payId || o.payId,
    });
  }

  // Parse in-memory events to add any freshly created orders not yet in DB
  for (const ev of events) {
    const action = ev.type || ev.action || '';
    if (action === 'ORDER_CREATED') {
      const out = (ev.output_data || {}) as Record<string, any>;
      const inp = (ev.input_data || {}) as Record<string, any>;
      const orderId = out.razorpay_order_id || inp.razorpay_order_id || ev.razorpay_order_id;
      if (orderId) {
        const payId = paymentMap.get(orderId);
        const existing = ordersMap.get(orderId);

        if (existing) {
          if (payId && existing.status !== 'Paid') {
            ordersMap.set(orderId, {
              ...existing,
              status: 'Paid',
              payId,
            });
          }
        } else {
          const numAmt = parseNumericInr(out.amount?.inr || ev.amount_inr || 1499);
          const prodName = out.product_name || inp.product_name || ev.product_name || 'HRX by Hrithik Roshan RUN';
          const gateTier = out.gate_tier || inp.gate_tier || 'AUTO';
          const isPaid = !!payId;

          const custName =
            out.customer?.name ||
            inp.customer?.name ||
            (ev as any).customer?.name ||
            (ev as any).user_name ||
            'Shreyash Srivastava';

          const street = out.shipping_address?.street || inp.shipping_address?.street || '';
          const city = out.shipping_address?.city || inp.shipping_address?.city || '';
          const state = out.shipping_address?.state || inp.shipping_address?.state || '';
          const postal = out.shipping_address?.postal_code || inp.shipping_address?.postal_code || '';
          const destParts = [street, city, state].filter(Boolean);
          let shipDest = destParts.join(', ');
          if (postal) shipDest += ` - ${postal}`;
          if (!shipDest) shipDest = 'Sehore, Bhopal, Madhya Pradesh - 123456';

          const merchName = out.merchant_name || (out.merchant_url?.includes('3002') ? 'TechCart Electronics' : 'UrbanStride Footwear');

          ordersMap.set(orderId, {
            orderId,
            productName: prodName,
            merchantName: merchName,
            customerName: custName,
            shippingDest: shipDest,
            amountDisplay: `₹${numAmt.toLocaleString('en-IN')}`,
            amountNumber: numAmt,
            gateTier,
            status: isPaid ? 'Paid' : 'Created',
            payId,
            receipt: out.receipt || inp.receipt || `rcpt_${orderId.slice(-8)}`,
            attempts: isPaid ? 1 : 0,
            timestamp: ev.timestamp || new Date().toISOString(),
          });
        }
      }
    }
  }

  const allOrders = Array.from(ordersMap.values());

  // Calculate overview metrics safely as pure numbers
  const paidOrders = allOrders.filter((o) => o.status === 'Paid');
  const totalCollected = paidOrders.reduce((sum, o) => sum + (Number(o.amountNumber) || 0), 0);

  // Filter orders
  const filteredOrders = allOrders.filter((o) => {
    if (filter === 'Paid' && o.status !== 'Paid') return false;
    if (filter === 'Created' && o.status !== 'Created') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderId.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        (o.payId && o.payId.toLowerCase().includes(q)) ||
        o.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 w-full max-w-6xl mx-auto no-scrollbar animate-fade-in">
      {/* Overview Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className={isLight ? 'text-slate-950 font-extrabold text-sm' : 'text-white font-extrabold text-sm'}>
              Overview
            </span>
            <span className="text-blue-600 font-semibold cursor-pointer">Today ▾</span>
          </div>
          <a
            href="https://razorpay.com/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
          >
            <span>Documentation</span>
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Collected Amount */}
          <div
            className={`p-4 rounded-2xl border shadow-sm transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#11161f] border-[#202c3f]'
            }`}
          >
            <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Collected Amount
            </div>
            <div className={`text-2xl font-extrabold mt-1 tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-[11.5px] mt-0.5 font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              from {paidOrders.length} captured payment{paidOrders.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Refunds */}
          <div
            className={`p-4 rounded-2xl border shadow-sm transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#11161f] border-[#202c3f]'
            }`}
          >
            <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Refunds
            </div>
            <div className={`text-2xl font-extrabold mt-1 tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              ₹0.00
            </div>
            <div className={`text-[11.5px] mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              0 processed
            </div>
          </div>

          {/* Disputes */}
          <div
            className={`p-4 rounded-2xl border shadow-sm transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#11161f] border-[#202c3f]'
            }`}
          >
            <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Disputes
            </div>
            <div className={`text-2xl font-extrabold mt-1 tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              ₹0.00
            </div>
            <div className={`text-[11.5px] mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              0 under-review
            </div>
          </div>

          {/* Failed */}
          <div
            className={`p-4 rounded-2xl border shadow-sm transition-all ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#11161f] border-[#202c3f]'
            }`}
          >
            <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Failed
            </div>
            <div className={`text-2xl font-extrabold mt-1 tracking-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
              0
            </div>
            <div className={`text-[11.5px] mt-0.5 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              0 payments
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#11161f] border-[#202c3f]'
        }`}
      >
        {/* Table Filters & Search */}
        <div
          className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isLight ? 'border-slate-200 bg-slate-50/60' : 'border-[#202c3f] bg-[#141b27]'
          }`}
        >
          {/* Filter Tabs */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-[#0B1019] border-[#22314A]'
            }`}
          >
            {(['All', 'Paid', 'Created'] as const).map((tab) => {
              const isSelected = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-white text-slate-950 shadow-sm border border-slate-300'
                        : 'bg-[#182338] text-white shadow-xs border border-blue-500/40'
                      : isLight
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
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
              className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}
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
              placeholder="Search in Order ID, product, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:border-blue-500 transition-all ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-950 placeholder:text-slate-500 shadow-xs'
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
            <div className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              {isLoading ? 'Loading orders from database...' : 'No orders found'}
            </div>
            <p className={`text-[11px] max-w-sm mx-auto ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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
                      ? 'bg-slate-100/90 border-slate-300 text-slate-700'
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
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-[#1C2638]'}`}>
                {filteredOrders.map((o) => (
                  <tr
                    key={o.orderId}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-slate-50 text-slate-900' : 'hover:bg-white/[0.02] text-slate-200'
                    }`}
                  >
                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
                      {o.orderId}
                    </td>

                    {/* Item & Merchant */}
                    <td className="py-3.5 px-4">
                      <div className={`font-bold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {o.productName}
                      </div>
                      <div className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {o.merchantName || 'CatalogX Merchant Network'}
                      </div>
                    </td>

                    {/* Customer & Shipping */}
                    <td className="py-3.5 px-4">
                      <div className={`font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        <svg className={`w-3 h-3 ${isLight ? 'text-slate-700' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{o.customerName}</span>
                      </div>
                      <div className={`text-[11px] flex items-center gap-1 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        <svg className={`w-2.5 h-2.5 flex-shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate max-w-[200px]">{o.shippingDest}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className={`py-3.5 px-4 font-mono font-extrabold ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      {o.amountDisplay}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">
                      {o.status === 'Paid' ? (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border inline-flex items-center gap-1.5 shadow-2xs ${
                            isLight
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold'
                              : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/70 font-bold'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border inline-flex items-center gap-1.5 shadow-2xs ${
                            isLight
                              ? 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold'
                              : 'bg-amber-950/70 text-amber-300 border-amber-600/70 font-bold'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>Created</span>
                        </span>
                      )}
                    </td>

                    {/* Payment ID */}
                    <td className={`py-3.5 px-4 font-mono text-[11px] select-all ${isLight ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
                      {o.payId || '—'}
                    </td>

                    {/* Timestamp */}
                    <td className={`py-3.5 px-4 text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
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
