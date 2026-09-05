'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/products';

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
};

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: Props) {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [postalCode, setPostalCode] = useState('560038');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('cart');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const totalQuantity = cart.reduce((c, i) => c + i.quantity, 0);
  const subtotalPaise = cart.reduce(
    (sum, item) => sum + item.product.price_paise * item.quantity,
    0
  );
  const savingsPaise = cart.reduce(
    (sum, item) => sum + Math.round(item.product.price_paise * 0.4) * item.quantity,
    0
  );

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !street || !postalCode) {
      alert('Please fill all required address fields');
      return;
    }

    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const primaryItem = cart[0];
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: primaryItem.product.id,
          size: primaryItem.size,
          quantity: primaryItem.quantity,
          customer: {
            name,
            email: 'customer@urbanstride.store',
            phone,
          },
          shipping_address: {
            street,
            city,
            state: 'Karnataka',
            postal_code: postalCode,
            country: 'India',
          },
          buyer_agent_id: 'storefront_cart_web',
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Order creation failed');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa',
        amount: orderData.amount.paise,
        currency: 'INR',
        name: 'UrbanStride Footwear',
        description: `${primaryItem.product.name} (UK ${primaryItem.size})`,
        order_id: orderData.razorpay_order_id,
        prefill: { name, contact: phone },
        theme: { color: '#0f0f0f' },
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
          setCompletedOrder({
            orderId: orderData.order_id,
            paymentId: response.razorpay_payment_id,
            amountDisplay: orderData.amount.display,
          });
          setStep('success');
          onClearCart();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in font-sans selection:bg-[#0f0f0f] selection:text-white">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-md bg-[#F8F7F4] border-l border-[#E0DDD9] text-[#0f0f0f] h-full flex flex-col shadow-2xl relative z-10">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E0DDD9] flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-xl text-[#0f0f0f] uppercase tracking-wider">
              {step === 'cart' && `Your Cart (${totalQuantity})`}
              {step === 'checkout' && 'Shipping & Delivery'}
              {step === 'success' && 'Order Placed!'}
            </h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
              ✓ Free Express Shipping on this order
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#aaa] hover:text-[#0f0f0f] rounded-lg hover:bg-[#EEECEA] transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="py-24 text-center space-y-4">
                  <div className="text-4xl opacity-40">👟</div>
                  <div className="font-heading font-bold text-xl text-[#0f0f0f] uppercase">Your Bag Is Empty</div>
                  <p className="text-xs text-[#999] max-w-xs mx-auto">
                    Explore our curated footwear drops and add pairs to your cart.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-[#E8E6E2] flex gap-4 items-center"
                    >
                      <div className="w-16 h-16 rounded-xl bg-[#EEECEA] p-2 flex items-center justify-center flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.image || '/assets/urbanstride/Shoe1.png'}
                          alt={item.product.name}
                          className="max-h-12 w-auto object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono font-bold text-[#aaa] uppercase">
                          {item.product.brand}
                        </div>
                        <h4 className="font-heading font-bold text-sm text-[#0f0f0f] truncate uppercase">
                          {item.product.name}
                        </h4>
                        <div className="text-xs text-[#999] font-mono mt-0.5">
                          Size: UK {item.size} · ₹{((item.product.price_paise * item.quantity) / 100).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-[#EEECEA] hover:bg-[#E0DDD9] text-xs text-[#0f0f0f] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center text-[#0f0f0f]">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-[#EEECEA] hover:bg-[#E0DDD9] text-xs text-[#0f0f0f] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-[#ccc] hover:text-rose-500 text-xs p-1 ml-1 cursor-pointer"
                          title="Remove item"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="cart-checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shreyash Srivastava"
                    className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#D8D5D0] text-[#0f0f0f] focus:outline-none focus:border-[#0f0f0f] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#D8D5D0] text-[#0f0f0f] focus:outline-none focus:border-[#0f0f0f] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#555] mb-1">Delivery Street Address *</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Flat 402, Skyline Residency, 100ft Road"
                    className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#D8D5D0] text-[#0f0f0f] focus:outline-none focus:border-[#0f0f0f] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555] mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#D8D5D0] text-[#0f0f0f] focus:outline-none focus:border-[#0f0f0f] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#555] mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#D8D5D0] text-[#0f0f0f] focus:outline-none focus:border-[#0f0f0f] text-xs"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === 'success' && completedOrder && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600 text-3xl flex items-center justify-center mx-auto">
                <i className="fa-solid fa-check"></i>
              </div>
              <h3 className="font-heading font-bold text-2xl text-[#0f0f0f] uppercase">Order Confirmed!</h3>
              <p className="text-xs text-[#777] max-w-xs mx-auto">
                Your footwear purchase for {completedOrder.amountDisplay} has been successfully placed.
              </p>
              <div className="p-3 bg-[#EEECEA] rounded-xl font-mono text-[11px] text-[#888]">
                Payment ID: {completedOrder.paymentId}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-6 border-t border-[#E0DDD9] bg-white space-y-4">
          {step === 'cart' && cart.length > 0 && (
            <>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[#999]">
                  <span>Estimated Total</span>
                  <span className="font-bold text-[#0f0f0f] text-[15px]">₹{(subtotalPaise / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-700 text-[11px]">
                  <span>You Saved</span>
                  <span>₹{(savingsPaise / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => setStep('checkout')}
                className="w-full py-4 rounded-2xl bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white font-heading font-bold text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>PROCEED TO CHECKOUT</span>
                <i className="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </>
          )}

          {step === 'checkout' && (
            <div className="space-y-2">
              <button
                type="submit"
                form="cart-checkout-form"
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-[#0f0f0f] hover:bg-[#2a2a2a] text-white font-heading font-bold text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>PROCESSING ORDER...</span>
                  </>
                ) : (
                  <>
                    <span>COMPLETE ORDER — ₹{(subtotalPaise / 100).toLocaleString('en-IN')}</span>
                    <i className="fa-solid fa-check text-xs"></i>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="w-full py-2 text-xs text-[#aaa] hover:text-[#0f0f0f] font-medium cursor-pointer"
              >
                ← Back to Cart
              </button>
            </div>
          )}

          {step === 'success' && (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-[#0f0f0f] text-white font-heading font-bold text-xs uppercase tracking-wider hover:bg-[#2a2a2a] transition-colors"
            >
              CONTINUE SHOPPING
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
