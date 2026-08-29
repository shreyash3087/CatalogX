'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/products';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
};

export default function CheckoutModal({ isOpen, onClose, product }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [postalCode, setPostalCode] = useState('560038');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  if (!isOpen || !product) return null;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !street || !postalCode) {
      alert('Please fill all required fulfillment fields');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          customer: { name, email, phone },
          shipping_address: {
            street,
            city,
            state: 'Karnataka',
            postal_code: postalCode,
            country: 'India',
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to create order');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa',
        amount: orderData.amount.paise,
        currency: 'INR',
        name: 'TechCart Electronics',
        description: product.name,
        order_id: orderData.razorpay_order_id,
        prefill: { name, email, contact: phone },
        theme: { color: '#06b6d4' },
        handler: async (response: any) => {
          await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          setIsProcessing(false);
          setOrderSuccess({
            orderId: orderData.order_id,
            paymentId: response.razorpay_payment_id,
            productName: product.name,
            amountDisplay: orderData.amount.display,
          });
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert((err as Error).message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b0f19] border border-cyan-950/80 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg p-1"
        >
          ✕
        </button>

        {orderSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500 text-cyan-400 text-3xl flex items-center justify-center mx-auto">
              ✓
            </div>
            <h3 className="text-xl font-bold">Payment Verified!</h3>
            <p className="text-xs text-slate-300">
              Your order for <strong>{orderSuccess.productName}</strong> ({orderSuccess.amountDisplay}) has been placed successfully.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl font-mono text-[11px] text-slate-400">
              Payment ID: {orderSuccess.paymentId}
            </div>
            <button
              onClick={() => {
                setOrderSuccess(null);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handlePay} className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xl">
                🎧
              </div>
              <div>
                <h3 className="text-base font-bold">{product.name}</h3>
                <div className="text-xs text-slate-400">
                  {product.brand} · ₹{(product.price_paise / 100).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                Customer & Delivery Information
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Shreyash Srivastava"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Delivery Address *</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Flat 402, Skyline Residency, 100ft Road"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? 'Processing with Razorpay...' : `Pay ₹${(product.price_paise / 100).toLocaleString('en-IN')}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
