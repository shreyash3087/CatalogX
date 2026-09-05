'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';

export default function TechCartAdminPage() {
  const router = useRouter();
  const { user: authUser, isAdmin, isLoading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory'>('overview');
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Auth Guard
  useEffect(() => {
    if (isLoading) return;
    if (!authUser) {
      router.replace('/login?next=/admin');
      return;
    }
    if (!isAdmin) {
      router.replace('/');
      return;
    }
    setAuthChecked(true);
  }, [router, authUser, isAdmin, isLoading]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [mRes, oRes, pRes] = await Promise.all([
        fetch('/api/admin/metrics'),
        fetch('/api/orders'),
        fetch('/api/products'),
      ]);

      if (mRes.ok) {
        const d = await mRes.json();
        setMetrics(d.analytics || d);
        if (d.orders && Array.isArray(d.orders) && d.orders.length > 0) {
          setOrders(d.orders);
        }
        if (d.products && Array.isArray(d.products) && d.products.length > 0) {
          setProducts(d.products);
        }
      }
      if (oRes.ok) {
        const d = await oRes.json();
        if (d.orders && Array.isArray(d.orders)) {
          setOrders(d.orders);
        }
      }
      if (pRes.ok) {
        const d = await pRes.json();
        if (d.products && Array.isArray(d.products)) {
          setProducts(d.products);
        }
      }
    } catch (err) {
      console.warn('[Admin] Fetch error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (authChecked) {
      fetchData();
      const interval = setInterval(fetchData, 8000);
      return () => clearInterval(interval);
    }
  }, [authChecked]);

  const handleStockUpdate = async (productId: string, newStock: number) => {
    setStockUpdatingId(productId);
    try {
      const res = await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, stock: newStock }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stock: newStock } : p))
        );
      }
    } catch (err) {
      console.warn('[Admin] Stock update error:', err);
    } finally {
      setStockUpdatingId(null);
    }
  };

  const analytics = metrics?.analytics || metrics || {};
  const paidOrdersList = orders.filter((o) => o.status === 'PAID');
  const paidCount = paidOrdersList.length || analytics.orders_paid || 0;

  const totalRevenuePaise =
    paidOrdersList.reduce(
      (sum, o) => sum + (o.amountPaise || (o.amountInr ? Math.round(o.amountInr * 100) : 0)),
      0
    ) ||
    analytics.revenue_paise ||
    (analytics.revenue_inr ? Math.round(Number(analytics.revenue_inr) * 100) : 0) ||
    0;

  const catalogDiscoveries =
    analytics.catalog_discoveries ??
    metrics?.catalog_discoveries ??
    metrics?.catalog_hits ??
    0;

  const totalOrdersCount = orders.length || analytics.orders_created || 0;
  const searchQueriesCount =
    analytics.search_queries ??
    metrics?.search_queries ??
    0;

  const kpiData = [
    {
      label: 'Catalog Discoveries',
      value: catalogDiscoveries,
      sub: 'Agent index calls on /.well-known/agent-catalog',
      color: '#0284c7',
    },
    {
      label: 'Gross Revenue',
      value: `₹${(totalRevenuePaise / 100).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      sub: `From ${paidCount} verified payment${paidCount === 1 ? '' : 's'}`,
      color: '#16a34a',
    },
    {
      label: 'Total Orders',
      value: totalOrdersCount,
      sub: 'Live checkout & agentic transactions',
      color: '#d97706',
    },
    {
      label: 'Product Queries',
      value: searchQueriesCount,
      sub: 'Semantic hardware search calls',
      color: '#9333ea',
    },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#C67D3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#0C1220] font-sans selection:bg-[#C67D3A] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-[1280px] mx-auto px-6 sm:px-8 py-8 w-full space-y-8">
        {/* Admin Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E0D4]">
          <div>
            <div className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-[#C67D3A] mb-1">
              Terminal Dashboard
            </div>
            <h1 className="font-heading font-extrabold text-[32px] text-[#0C1220] uppercase tracking-tight leading-none">
              STORE ANALYTICS
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#9C9589] font-mono">
              <i className="fa-solid fa-database text-[10px] text-[#9C9589]" />
              <span>techcart_db</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 ml-1">
                ONLINE
              </span>
            </div>
          </div>

          {/* Admin User Chip & Refresh Action */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#FAF7F2] active:scale-95 border border-[#E8E0D4] text-[#0C1220] rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className={`w-3.5 h-3.5 text-[#C67D3A] ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {authUser && (
              <div className="flex items-center gap-3 bg-white border border-[#E8E0D4] rounded-xl px-4 py-2.5 shadow-xs">
                <UserAvatar
                  src={authUser.avatar}
                  name={authUser.name}
                  size="lg"
                  borderColor="border-emerald-500"
                />
                <div className="hidden sm:block">
                  <div className="text-[12px] font-bold text-[#0C1220] leading-tight flex items-center gap-1.5">
                    <span>{authUser.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active"></span>
                  </div>
                  <div className="text-[10px] text-[#9C9589] font-mono leading-tight">{authUser.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <div key={kpi.label} className="p-5 rounded-2xl bg-white border border-[#E8E0D4] shadow-xs space-y-1.5">
              <div className="text-[10.5px] font-mono font-bold uppercase tracking-wider" style={{ color: kpi.color }}>
                {kpi.label}
              </div>
              <div className="text-[30px] font-mono font-black text-[#0C1220] tracking-tight leading-none">
                {kpi.value}
              </div>
              <div className="text-[11.5px] text-[#9C9589]">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Tab Selector */}
        <div className="border-b border-[#E8E0D4]">
          <div className="flex items-center gap-1">
            {[
              { id: 'overview', label: 'Store Overview', icon: 'fa-chart-bar' },
              { id: 'orders', label: `Orders (${orders.length})`, icon: 'fa-box' },
              { id: 'inventory', label: `Inventory (${products.length})`, icon: 'fa-tag' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 text-[12px] font-mono font-semibold transition-all cursor-pointer border-b-2 -mb-[1px] flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-[#C67D3A] text-[#C67D3A] bg-[#C67D3A]/5 font-bold'
                    : 'border-transparent text-[#9C9589] hover:text-[#0C1220]'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-[11px]`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        {(activeTab === 'overview' || activeTab === 'orders') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[12px] font-mono font-bold text-[#0C1220] uppercase tracking-wider inline">
                  Store Orders Ledger
                </h3>
                <span className="text-[#9C9589] font-mono ml-2 text-[10px]">techcart_db.orders</span>
              </div>
              <button
                onClick={fetchData}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E8E0D4] hover:border-[#D4C9B9] text-[12px] text-[#5A5549] hover:text-[#0C1220] cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <i className="fa-solid fa-rotate text-[10px]" /> Refresh
              </button>
            </div>

            <div className="bg-white border border-[#E8E0D4] rounded-2xl overflow-hidden shadow-xs">
              {orders.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-[#FDFBF7] border border-[#E8E0D4] flex items-center justify-center mx-auto text-[#9C9589]">
                    <i className="fa-solid fa-box text-[16px]" />
                  </div>
                  <div className="text-[12.5px] font-bold text-[#0C1220]">No orders recorded yet</div>
                  <p className="text-[11.5px] text-[#9C9589] max-w-sm mx-auto">
                    Customer checkouts and agentic transactions will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[#FAF7F2] text-[10.5px] font-mono uppercase font-bold text-[#9C9589] border-b border-[#E8E0D4]">
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Item</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Payment ID</th>
                        <th className="py-3.5 px-4">Created</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EBE1] font-mono">
                      {orders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-[#FDFBF7] transition-colors">
                          <td className="py-3.5 px-4 font-bold text-blue-600 select-all text-[11px]">
                            {o.orderId}
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <div className="font-bold text-[#0C1220]">{o.productName}</div>
                            <div className="text-[10px] text-[#9C9589] font-mono">
                              {o.brand ? `${o.brand} · ` : ''}Qty: {o.quantity || 1}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-sans">
                            <div className="font-semibold text-[#0C1220]">
                              {o.customer?.name || 'Customer'}
                            </div>
                            <div className="text-[10px] text-[#9C9589] font-mono">
                              {[o.shippingAddress?.street, o.shippingAddress?.city].filter(Boolean).join(', ') || 'Primary Address'} {o.customer?.phone ? `· ${o.customer.phone}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#0C1220]">
                            ₹{(o.amountPaise / 100).toLocaleString('en-IN')}.00
                          </td>
                          <td className="py-3.5 px-4">
                            {o.status === 'PAID' ? (
                              <span className="px-2.5 py-0.5 rounded text-[9.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                PAID
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                CREATED
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-[10px] text-[#9C9589] select-all">
                            {o.razorpayPaymentId || o.paymentId || (o.status === 'PAID' ? 'pay_sim_' + (o.orderId || '').slice(-8) : '—')}
                          </td>
                          <td className="py-3.5 px-4 text-[10px] text-[#9C9589]">
                            {new Date(o.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-3 py-1.5 rounded-lg bg-[#C67D3A]/10 hover:bg-[#C67D3A]/20 active:scale-95 text-[#C67D3A] border border-[#C67D3A]/25 font-bold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-[#C67D3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Details Modal Popup */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#E8E0D4] max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-hidden text-[#0C1220]">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-[#E8E0D4] flex items-center justify-between bg-[#FAF7F2]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C67D3A]/10 border border-[#C67D3A]/20 text-[#C67D3A] flex items-center justify-center font-bold font-mono text-sm">
                    TC
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-[#0C1220] tracking-tight">
                        Order Breakdown &amp; Audit
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                          selectedOrder.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#C67D3A]">
                      {selectedOrder.orderId}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-[#5A5549] hover:text-[#0C1220] flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* 1. Item Information */}
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8E0D4] space-y-3">
                  <div className="text-[10px] font-mono font-bold text-[#9C9589] uppercase tracking-wider">
                    Purchased Item
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold font-mono text-[#C67D3A] uppercase">
                        {selectedOrder.brand || 'TechCart'}
                      </div>
                      <div className="text-[15px] font-bold text-[#0C1220]">
                        {selectedOrder.productName || 'Electronics Item'}
                      </div>
                      <div className="text-[12px] text-[#5A5549] mt-1 space-x-3 font-sans">
                        <span>Quantity: <strong className="text-[#0C1220] font-mono">{selectedOrder.quantity || 1}</strong></span>
                        {selectedOrder.color && <span>· Color: <strong className="text-[#0C1220]">{selectedOrder.color}</strong></span>}
                      </div>
                      {selectedOrder.productId && (
                        <div className="text-[10px] font-mono text-[#9C9589] mt-1">
                          Product ID: {selectedOrder.productId}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[16px] font-black text-[#0C1220]">
                        ₹{(selectedOrder.amountPaise / 100).toLocaleString('en-IN')}.00
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        {selectedOrder.status === 'PAID' ? 'Settled via TokenHQ' : 'Payment Awaiting'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Customer & Delivery Address Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="p-4 rounded-xl border border-[#E8E0D4] bg-[#FAF7F2] space-y-2">
                    <div className="text-[10px] font-mono font-bold text-[#9C9589] uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#C67D3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Details
                    </div>
                    <div className="text-[13px] font-bold text-[#0C1220]">
                      {selectedOrder.customer?.name || 'Shreyash Srivastava'}
                    </div>
                    <div className="text-[11px] text-[#5A5549] font-mono">
                      {selectedOrder.customer?.email || 'shreyash3087@gmail.com'}
                    </div>
                    <div className="text-[11px] text-[#5A5549]">
                      Phone: <strong className="text-[#0C1220] font-mono">{selectedOrder.customer?.phone || '8707336921'}</strong>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="p-4 rounded-xl border border-[#E8E0D4] bg-[#FAF7F2] space-y-2">
                    <div className="text-[10px] font-mono font-bold text-[#9C9589] uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#C67D3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Shipping Address
                    </div>
                    <div className="text-[12px] font-medium text-[#5A5549] leading-relaxed font-sans">
                      {selectedOrder.shippingAddress?.street && <span>{selectedOrder.shippingAddress.street},<br /></span>}
                      <span>
                        {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state].filter(Boolean).join(', ')}
                        {selectedOrder.shippingAddress?.postal_code ? ` - ${selectedOrder.shippingAddress.postal_code}` : ''}
                      </span>
                      <br />
                      <span className="text-[11px] text-[#9C9589]">{selectedOrder.shippingAddress?.country || 'India'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Payment & Channel Audit */}
                <div className="p-4 rounded-xl border border-[#E8E0D4] bg-[#FAF7F2] space-y-2 text-[11px] font-mono">
                  <div className="text-[10px] font-bold text-[#9C9589] uppercase tracking-wider">
                    Razorpay &amp; Agent Channel Audit
                  </div>
                  <div className="flex items-center justify-between text-[#5A5549] py-1 border-b border-[#E8E0D4]">
                    <span>Razorpay Order ID</span>
                    <span className="font-bold text-blue-600 select-all">{selectedOrder.razorpayOrderId || selectedOrder.orderId}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5A5549] py-1 border-b border-[#E8E0D4]">
                    <span>Payment ID / Token</span>
                    <span className="font-bold text-emerald-700 select-all">{selectedOrder.razorpayPaymentId || selectedOrder.paymentId || (selectedOrder.status === 'PAID' ? 'pay_sim_' + (selectedOrder.orderId || '').slice(-8) : 'Pending')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5A5549] py-1 border-b border-[#E8E0D4]">
                    <span>Agent Session</span>
                    <span className="text-[#9C9589] select-all">{selectedOrder.sessionId || 'Autonomous'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5A5549] pt-1">
                    <span>Order Timestamp</span>
                    <span className="text-[#9C9589]">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#FAF7F2] border-t border-[#E8E0D4] flex items-center justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 rounded-xl bg-[#C67D3A] hover:bg-[#b06f33] text-white font-bold text-xs cursor-pointer transition-colors shadow-xs"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[12px] font-mono font-bold text-[#0C1220] uppercase tracking-wider inline">
                Inventory &amp; Stock Telemetry
              </h3>
              <span className="text-[#9C9589] font-mono ml-2 text-[10px]">techcart_db.inventory</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="p-4 rounded-2xl bg-white border border-[#E8E0D4] shadow-xs flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[9.5px] text-[#C67D3A] uppercase font-mono font-bold">{p.brand}</div>
                    <div className="text-[13px] font-bold text-[#0C1220] truncate">{p.name}</div>
                    <div className="text-[11px] text-[#9C9589] font-mono">
                      ₹{(p.price_paise / 100).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${
                        p.stock <= 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {p.stock} units
                    </span>
                    <button
                      onClick={() => handleStockUpdate(p.id, p.stock + 10)}
                      disabled={stockUpdatingId === p.id}
                      className="px-2.5 py-1 rounded bg-[#FAF7F2] border border-[#E8E0D4] hover:bg-[#F0EBE1] text-[11.5px] font-mono font-bold cursor-pointer disabled:opacity-50 transition-colors text-[#0C1220]"
                      title="Restock +10"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleStockUpdate(p.id, 0)}
                      disabled={stockUpdatingId === p.id}
                      className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11.5px] font-mono font-bold cursor-pointer transition-colors"
                      title="Set Out of Stock"
                    >
                      0
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}