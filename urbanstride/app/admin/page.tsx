'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';

export default function MerchantAdminPage() {
  const router = useRouter();
  const { user: authUser, isAdmin, isLoading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory'>('overview');
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // ── Auth guard ──────────────────────────────────────────
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

  // ── Data fetching (on-demand) ────────────────
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/metrics');
      const data = await res.json();
      if (res.ok) {
        setMetrics(data.analytics);
        setOrders(data.orders || []);
        setProducts(data.products || []);
      }
    } catch (e) {
      console.error('Failed to fetch admin metrics:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authChecked) return;
    fetchData();
  }, [authChecked]);

  const handleStockUpdate = async (productId: string, newStock: number) => {
    setStockUpdatingId(productId);
    try {
      await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, stock: newStock }),
      });
      await fetchData();
    } catch {
      alert('Failed to update stock');
    } finally {
      setStockUpdatingId(null);
    }
  };

  // KPI data
  const kpiData = [
    {
      label: 'Agent Discoveries',
      value: metrics?.catalog_discoveries ?? '—',
      sub: 'Hits on /.well-known/agent-catalog',
      color: '#f59e0b',
    },
    {
      label: 'Gross Agent Revenue',
      value: metrics ? `₹${Number(metrics.revenue_inr || 0).toLocaleString('en-IN')}` : '—',
      sub: `From ${metrics?.orders_paid ?? 0} completed payments`,
      color: '#10b981',
    },
    {
      label: 'Total Orders',
      value: metrics?.orders_created ?? '—',
      sub: 'Via CatalogX AI Buyer Agent',
      color: '#3b82f6',
    },
    {
      label: 'Semantic Searches',
      value: metrics?.search_queries ?? '—',
      sub: 'Product vector search queries',
      color: '#8b5cf6',
    },
  ];

  // ── Loading / redirecting state ─────────────────────────
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#0f0f0f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F3F0] text-[#0f0f0f] font-sans">
      {/* Shared Navbar — no cart on admin */}
      <Navbar />

      <main className="flex-1 max-w-[1200px] mx-auto px-6 sm:px-8 py-8 w-full space-y-8">

        {/* Admin Page Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E8E6E2]">
          <div>
            <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#aaa] mb-1">
              Merchant Dashboard
            </div>
            <h1 className="font-heading font-bold text-[34px] text-[#0f0f0f] uppercase tracking-tight leading-none">
              Store Analytics
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#aaa]">
              <i className="fa-solid fa-database text-[10px]" />
              <span className="font-mono">urbanstride_db</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-200 ml-1">
                LIVE
              </span>
            </div>
          </div>

          {/* Admin action & user pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 active:scale-95 border border-[#E0DDD9] text-[#0f0f0f] rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            {authUser && (
              <div className="flex items-center gap-3 bg-white border border-[#E0DDD9] rounded-xl px-4 py-2.5 shadow-xs">
                <UserAvatar
                  src={authUser.avatar}
                  name={authUser.name}
                  size="lg"
                  borderColor="border-emerald-500"
                />
                <div className="hidden sm:block">
                  <div className="text-[12px] font-bold text-[#0f0f0f] leading-tight flex items-center gap-1.5">
                    <span>{authUser.name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Active"></span>
                  </div>
                  <div className="text-[10px] text-[#aaa] leading-tight font-mono">{authUser.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => (
            <div key={kpi.label} className="admin-card space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: kpi.color }}>
                {kpi.label}
              </div>
              <div className="text-[30px] font-black text-[#0f0f0f] tracking-tight leading-none">
                {kpi.value}
              </div>
              <div className="text-[11px] text-[#999]">{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-[#E8E6E2]">
          <div className="flex items-center gap-0">
            {[
              { id: 'overview', label: 'Store Overview', icon: 'fa-chart-bar' },
              { id: 'orders', label: `Orders (${orders.length})`, icon: 'fa-box' },
              { id: 'inventory', label: `Inventory (${products.length})`, icon: 'fa-tag' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-2.5 text-[12px] font-bold transition-all cursor-pointer border-b-2 -mb-[1px] flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'border-[#0f0f0f] text-[#0f0f0f]'
                    : 'border-transparent text-[#aaa] hover:text-[#555]'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-[10px]`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders / Overview */}
        {(activeTab === 'overview' || activeTab === 'orders') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[12px] font-bold text-[#0f0f0f] uppercase tracking-wider inline">
                  Store Orders Ledger
                </h3>
                <span className="text-[#aaa] font-mono ml-2 text-[10px]">urbanstride_db.orders</span>
              </div>
              <button
                onClick={fetchData}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E0DDD9] hover:bg-[#F8F7F4] text-[12px] text-[#555] cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <i className="fa-solid fa-rotate text-[10px]" /> Refresh
              </button>
            </div>

            <div className="bg-white border border-[#E8E6E2] rounded-2xl overflow-hidden shadow-sm">
              {orders.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#EEECEA] border border-[#D0CEC9] flex items-center justify-center mx-auto">
                    <i className="fa-solid fa-box text-[16px] text-[#bbb]" />
                  </div>
                  <div className="text-[12.5px] font-bold text-[#555]">No orders recorded yet</div>
                  <p className="text-[11.5px] text-[#bbb] max-w-sm mx-auto">
                    Orders and customer purchases will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[#F8F7F4] text-[11px] uppercase font-bold text-[#aaa] border-b border-[#E8E6E2]">
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Item &amp; Size</th>
                        <th className="py-3.5 px-4">Customer</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Payment ID</th>
                        <th className="py-3.5 px-4">Created</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EDE9]">
                      {orders.map((o) => (
                        <tr key={o.orderId} className="hover:bg-[#FAFAF9] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-600 select-all text-[11px]">
                            {o.orderId}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#0f0f0f]">{o.productName}</div>
                            <div className="text-[10px] text-[#aaa] font-mono">
                              {o.brand ? `${o.brand} · ` : ''}Size: {o.size || 'Standard'} {o.quantity > 1 ? `(x${o.quantity})` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#333]">
                              {o.customer?.name || 'Customer'}
                            </div>
                            <div className="text-[10px] text-[#aaa]">
                              {[o.shippingAddress?.street, o.shippingAddress?.city].filter(Boolean).join(', ') || 'Primary Address'} {o.customer?.phone ? `· ${o.customer.phone}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-[#0f0f0f]">
                            ₹{(o.amountPaise / 100).toLocaleString('en-IN')}.00
                          </td>
                          <td className="py-3.5 px-4">
                            {o.status === 'PAID' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                PAID
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                CREATED
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px] text-[#aaa] select-all">
                            {o.razorpayPaymentId || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-[10px] text-[#bbb]">
                            {new Date(o.createdAt).toLocaleTimeString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedOrder(o)}
                              className="px-3 py-1.5 rounded-lg bg-[#0f0f0f] hover:bg-[#252525] active:scale-95 text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#E0DDD9] max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-[#E8E6E2] flex items-center justify-between bg-[#FAF9F6]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0f0f0f] text-white flex items-center justify-center font-bold text-sm">
                    US
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-black text-[#0f0f0f] tracking-tight">
                        Order Breakdown
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          selectedOrder.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#888]">
                      {selectedOrder.orderId}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 rounded-lg bg-[#EDEBE6] hover:bg-[#E0DDD9] text-[#666] flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* 1. Item Information */}
                <div className="p-4 rounded-xl bg-[#F8F7F4] border border-[#E8E6E2] space-y-3">
                  <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider">
                    Purchased Item
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-bold font-mono text-amber-600 uppercase">
                        {selectedOrder.brand || 'UrbanStride'}
                      </div>
                      <div className="text-[15px] font-bold text-[#0f0f0f]">
                        {selectedOrder.productName || 'Footwear Product'}
                      </div>
                      <div className="text-[12px] text-[#666] mt-1 space-x-3">
                        <span>Size: <strong className="text-[#0f0f0f]">{selectedOrder.size || 'Standard'}</strong></span>
                        {selectedOrder.color && <span>· Color: <strong className="text-[#0f0f0f]">{selectedOrder.color}</strong></span>}
                        <span>· Quantity: <strong className="text-[#0f0f0f]">{selectedOrder.quantity || 1}</strong></span>
                      </div>
                      {selectedOrder.productId && (
                        <div className="text-[10px] font-mono text-[#aaa] mt-1">
                          Product ID: {selectedOrder.productId}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-[16px] font-black text-[#0f0f0f] font-mono">
                        ₹{(selectedOrder.amountPaise / 100).toLocaleString('en-IN')}.00
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold">
                        {selectedOrder.status === 'PAID' ? 'Amount Settled' : 'Payment Awaiting'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Customer & Delivery Address Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div className="p-4 rounded-xl border border-[#E8E6E2] bg-white space-y-2">
                    <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Customer Details
                    </div>
                    <div className="text-[13px] font-bold text-[#0f0f0f]">
                      {selectedOrder.customer?.name || 'Shreyash Srivastava'}
                    </div>
                    <div className="text-[11px] text-[#666] font-mono">
                      {selectedOrder.customer?.email || 'shreyash3087@gmail.com'}
                    </div>
                    <div className="text-[11px] text-[#666]">
                      Phone: <strong className="text-[#0f0f0f]">{selectedOrder.customer?.phone || '8707336921'}</strong>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="p-4 rounded-xl border border-[#E8E6E2] bg-white space-y-2">
                    <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Shipping Address
                    </div>
                    <div className="text-[12px] font-medium text-[#0f0f0f] leading-relaxed">
                      {selectedOrder.shippingAddress?.street && <span>{selectedOrder.shippingAddress.street},<br /></span>}
                      <span>
                        {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state].filter(Boolean).join(', ')}
                        {selectedOrder.shippingAddress?.postal_code ? ` - ${selectedOrder.shippingAddress.postal_code}` : ''}
                      </span>
                      <br />
                      <span className="text-[11px] text-[#888]">{selectedOrder.shippingAddress?.country || 'India'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Payment & Channel Audit */}
                <div className="p-4 rounded-xl border border-[#E8E6E2] bg-[#FAF9F6] space-y-2 text-[11px] font-mono">
                  <div className="text-[10.5px] font-bold text-[#888] uppercase tracking-wider font-sans">
                    Razorpay &amp; Agent Channel Audit
                  </div>
                  <div className="flex items-center justify-between text-[#555] py-1 border-b border-[#E8E6E2]">
                    <span>Razorpay Order ID</span>
                    <span className="font-bold text-[#0f0f0f] select-all">{selectedOrder.razorpayOrderId || selectedOrder.orderId}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#555] py-1 border-b border-[#E8E6E2]">
                    <span>Payment ID / Token</span>
                    <span className="font-bold text-emerald-700 select-all">{selectedOrder.razorpayPaymentId || 'Pending'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#555] py-1 border-b border-[#E8E6E2]">
                    <span>Agent Session</span>
                    <span className="text-[#888] select-all">{selectedOrder.sessionId || 'Autonomous'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#555] pt-1">
                    <span>Order Placed At</span>
                    <span className="text-[#888]">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-[#F8F7F4] border-t border-[#E8E6E2] flex items-center justify-end">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 rounded-xl bg-[#0f0f0f] hover:bg-[#252525] text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-[12px] font-bold text-[#0f0f0f] uppercase tracking-wider inline">
                Inventory &amp; Stock Management
              </h3>
              <span className="text-[#aaa] font-mono ml-2 text-[10px]">urbanstride_db.inventory</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="admin-card flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] text-amber-600 uppercase font-mono font-bold">{p.brand}</div>
                    <div className="text-[13px] font-bold text-[#0f0f0f] truncate">{p.name}</div>
                    <div className="text-[11px] text-[#aaa] font-mono">
                      ₹{(p.price_paise / 100).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded text-[10.5px] font-bold ${
                        p.stock <= 0
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {p.stock} left
                    </span>
                    <button
                      onClick={() => handleStockUpdate(p.id, p.stock + 10)}
                      disabled={stockUpdatingId === p.id}
                      className="px-2.5 py-1.5 rounded-lg bg-[#F8F7F4] border border-[#E0DDD9] hover:bg-[#EEECEA] text-[12px] font-bold cursor-pointer disabled:opacity-50 transition-colors"
                      title="Restock +10"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleStockUpdate(p.id, 0)}
                      disabled={stockUpdatingId === p.id}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[12px] font-bold cursor-pointer transition-colors"
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
