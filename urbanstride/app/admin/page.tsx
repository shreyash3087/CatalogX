'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type UserProfile = {
  name: string;
  email: string;
  avatar: string;
  isLoggedIn: boolean;
};

declare global {
  interface Window {
    google?: any;
    __gsiAdminInit?: boolean;
  }
}

export function parseGoogleJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default function MerchantAdminPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'inventory'>('overview');
  const [stockUpdatingId, setStockUpdatingId] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const ROOT_ADMINS = ['shreyash3087@gmail.com', 'owner@catalogx.ai'];
  const isRootAdmin = user?.isLoggedIn && ROOT_ADMINS.includes(user.email.toLowerCase());

  // 1. Fetch Metrics & Data
  const fetchData = async () => {
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // 5s live polling
    return () => clearInterval(interval);
  }, []);

  // 2. Initialize Google Sign-In
  useEffect(() => {
    const clientId = '69996615501-m4eclgq75cl1qd0q6kqckspg7q066epg.apps.googleusercontent.com';
    let checkInterval: NodeJS.Timeout;

    const initGsi = () => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id) return;

      if (!window.__gsiAdminInit) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              const data = parseGoogleJwt(response.credential);
              if (data) {
                const u: UserProfile = {
                  name: data.name || data.given_name || 'Admin',
                  email: data.email || '',
                  avatar: data.picture || '',
                  isLoggedIn: true,
                };
                setUser(u);
                localStorage.setItem('urbanstride_admin_user', JSON.stringify(u));
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.__gsiAdminInit = true;
      }

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'signin_with',
          logo_alignment: 'left',
          width: 260,
        });
      }
    };

    const stored = localStorage.getItem('urbanstride_admin_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {}
    }

    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      initGsi();
    } else {
      checkInterval = setInterval(() => {
        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
          clearInterval(checkInterval);
          initGsi();
        }
      }, 200);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('urbanstride_admin_user');
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (e) {}
    }
  };

  const handleStockUpdate = async (productId: string, newStock: number) => {
    setStockUpdatingId(productId);
    try {
      await fetch('/api/admin/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, stock: newStock }),
      });
      await fetchData();
    } catch (e) {
      alert('Failed to update stock');
    } finally {
      setStockUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="bg-[#0B0F19] border-b border-slate-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-black font-extrabold text-sm">
              ⚡
            </div>
            <span className="text-base font-black text-white tracking-tight">UrbanStride Admin</span>
          </Link>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-orange-500/10 text-orange-400 border border-orange-500/30">
            Database: urbanstride_db
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Back to Store
          </Link>

          {user?.isLoggedIn && (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
              <div className="text-right">
                <div className="text-xs font-bold text-white">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 rounded-lg border border-slate-700 hover:border-red-500 hover:text-red-400 text-xs font-semibold transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Authentication Gate / Lock Screen */}
        {!user?.isLoggedIn ? (
          <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-[#0E1524] border border-slate-800 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500 text-orange-400 text-2xl flex items-center justify-center mx-auto">
              🔒
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Merchant Admin Authentication</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Sign in with your authorized Google Account to access the UrbanStride merchant dashboard, live orders ledger, and stock controls.
              </p>
            </div>

            <div className="flex justify-center pt-2">
              <div ref={googleBtnRef} className="min-h-[44px]" />
            </div>

            <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-4">
              Restricted to root administrator accounts (<span className="text-slate-400 font-mono">shreyash3087@gmail.com</span>)
            </div>
          </div>
        ) : !isRootAdmin ? (
          <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-rose-950/20 border border-rose-900/50 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500 text-rose-400 text-2xl flex items-center justify-center mx-auto">
              ⛔
            </div>
            <h2 className="text-lg font-bold text-white">Access Restricted</h2>
            <p className="text-xs text-slate-300">
              You are signed in as <strong className="text-white font-mono">{user.email}</strong>, but this account is not authorized as a Root Admin for UrbanStride Footwear.
            </p>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold"
            >
              Sign In with Another Account
            </button>
          </div>
        ) : (
          /* Authorized Root Admin Dashboard */
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Agent Discovery Counter */}
              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-sm space-y-1">
                <div className="text-[11px] font-bold uppercase text-orange-400 font-mono">Agent Discoveries</div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {metrics?.catalog_discoveries || 0}
                </div>
                <div className="text-[11px] text-slate-400">Hits on /.well-known/agent-catalog</div>
              </div>

              {/* Total Revenue */}
              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-sm space-y-1">
                <div className="text-[11px] font-bold uppercase text-emerald-400 font-mono">Gross Agent Revenue</div>
                <div className="text-3xl font-black text-white tracking-tight">
                  ₹{Number(metrics?.revenue_inr || 0).toLocaleString('en-IN')}.00
                </div>
                <div className="text-[11px] text-slate-400">From {metrics?.orders_paid || 0} completed payments</div>
              </div>

              {/* Orders Created */}
              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-sm space-y-1">
                <div className="text-[11px] font-bold uppercase text-blue-400 font-mono">Total Orders Created</div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {metrics?.orders_created || 0}
                </div>
                <div className="text-[11px] text-slate-400">Via CatalogX AI Buyer Agent</div>
              </div>

              {/* Search Queries */}
              <div className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 shadow-sm space-y-1">
                <div className="text-[11px] font-bold uppercase text-purple-400 font-mono">Semantic Searches</div>
                <div className="text-3xl font-black text-white tracking-tight">
                  {metrics?.search_queries || 0}
                </div>
                <div className="text-[11px] text-slate-400">Product vector search queries</div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 Store Overview & Feed
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📦 Orders Ledger ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏷️ Live Stock & Inventory ({products.length})
              </button>
            </div>

            {/* Tab 1: Overview & Live Orders Table */}
            {activeTab === 'overview' || activeTab === 'orders' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Autonomous Orders Ledger (urbanstride_db.orders)
                  </h3>
                  <button
                    onClick={fetchData}
                    className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 cursor-pointer"
                  >
                    🔄 Refresh
                  </button>
                </div>

                <div className="bg-[#0D1322] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  {orders.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 space-y-2">
                      <div className="text-3xl">📦</div>
                      <div className="text-xs font-bold">No orders recorded in urbanstride_db yet</div>
                      <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                        Ask the CatalogX buyer agent on Port 3000 to buy running shoes, and the order will appear here in real time.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#090E17] text-[10.5px] uppercase font-bold text-slate-400 border-b border-slate-800">
                            <th className="py-3.5 px-4">Order ID</th>
                            <th className="py-3.5 px-4">Item & Size</th>
                            <th className="py-3.5 px-4">Customer & Address</th>
                            <th className="py-3.5 px-4">Amount</th>
                            <th className="py-3.5 px-4">Status</th>
                            <th className="py-3.5 px-4">Payment ID</th>
                            <th className="py-3.5 px-4">Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {orders.map((o) => (
                            <tr key={o.orderId} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-orange-400 select-all">
                                {o.orderId}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-white">{o.productName}</div>
                                <div className="text-[10.5px] text-slate-400 font-mono">Size: {o.size || 'N/A'}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-200">{o.customer?.name} ({o.customer?.phone})</div>
                                <div className="text-[10.5px] text-slate-400">
                                  {o.shippingAddress?.street}, {o.shippingAddress?.city} - {o.shippingAddress?.postal_code}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-white">
                                ₹{(o.amountPaise / 100).toLocaleString('en-IN')}.00
                              </td>
                              <td className="py-3.5 px-4">
                                {o.status === 'PAID' ? (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    PAID
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    CREATED
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 font-mono text-[10.5px] text-slate-400 select-all">
                                {o.razorpayPaymentId || '—'}
                              </td>
                              <td className="py-3.5 px-4 text-[10.5px] text-slate-500">
                                {new Date(o.createdAt).toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Tab 2: Inventory & Stock Controls */
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Inventory & Stock Management (urbanstride_db.inventory)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-[#0D1322] border border-slate-800 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] text-orange-400 uppercase font-mono font-bold">{p.brand}</div>
                        <div className="text-sm font-bold text-white truncate">{p.name}</div>
                        <div className="text-xs text-slate-400 font-mono">₹{(p.price_paise / 100).toLocaleString('en-IN')}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded text-xs font-bold font-mono ${
                          p.stock <= 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {p.stock} in stock
                        </span>

                        <button
                          onClick={() => handleStockUpdate(p.id, p.stock + 10)}
                          disabled={stockUpdatingId === p.id}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                          title="Restock +10 units"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => handleStockUpdate(p.id, 0)}
                          disabled={stockUpdatingId === p.id}
                          className="px-2 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs font-bold cursor-pointer"
                          title="Set to Out of Stock"
                        >
                          0
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
