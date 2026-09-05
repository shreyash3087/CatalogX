'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/products';

export interface CartItem {
  product: Product;
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

/* Inline SVG Icons */
function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    </svg>
  );
}
function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}
function BagEmptyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

export default function TechCartCartDrawer({
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
    (sum, item) => sum + Math.round(item.product.price_paise * 0.35) * item.quantity,
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
          quantity: primaryItem.quantity,
          customer: {
            name,
            email: 'customer@techcart.store',
            phone,
          },
          shipping_address: {
            street,
            city,
            state: 'Karnataka',
            postal_code: postalCode,
            country: 'India',
          },
          buyer_agent_id: 'techcart_cart_web',
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Order creation failed');

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa',
        amount: orderData.amount.paise,
        currency: 'INR',
        name: 'TechCart Electronics',
        description: `${primaryItem.product.name} (${primaryItem.quantity} unit)`,
        order_id: orderData.razorpay_order_id,
        prefill: {
          name,
          contact: phone,
        },
        theme: {
          color: '#C67D3A',
        },
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
          ondismiss: () => {
            setIsProcessing(false);
          },
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
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm font-sans">
      <div className="flex-1" onClick={onClose} />

      <div className="w-full max-w-md bg-[#FDFBF7] border-l border-[#E8E0D4] text-[#0C1220] h-full flex flex-col shadow-2xl relative z-10">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#E8E0D4] flex items-center justify-between">
          <div>
            <h3 className="font-heading font-extrabold text-xl text-[#0C1220] uppercase tracking-wider">
              {step === 'cart' && `Hardware Bag (${totalQuantity})`}
              {step === 'checkout' && 'Shipping & Dispatch'}
              {step === 'success' && 'Order Confirmed'}
            </h3>
            <p className="text-[11px] text-[#C67D3A] font-mono mt-0.5">
              Free Express Shipping via Bluedart
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9C9589] hover:text-[#0C1220] rounded-lg hover:bg-[#F5F0E8] transition-colors cursor-pointer"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="py-24 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#F5F0E8] border border-[#E8E0D4] flex items-center justify-center mx-auto text-[#9C9589]">
                    <BagEmptyIcon />
                  </div>
                  <div className="font-heading font-bold text-xl text-[#0C1220] uppercase">Your Bag Is Empty</div>
                  <p className="text-xs text-[#9C9589] max-w-xs mx-auto">
                    Explore our precision audio, wearables, and computing hardware.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {cart.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-white border border-[#E8E0D4] flex gap-4 items-center"
                    >
                      <div className="w-16 h-16 rounded-lg bg-[#F5F0E8] p-2 flex items-center justify-center flex-shrink-0 border border-[#E8E0D4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.image || '/assets/techcart/headphones.jpg'}
                          alt={item.product.name}
                          className="max-h-12 w-auto object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-mono font-bold text-[#C67D3A] uppercase">
                          {item.product.brand}
                        </div>
                        <h4 className="font-heading font-bold text-sm text-[#0C1220] truncate uppercase">
                          {item.product.name}
                        </h4>
                        <div className="text-xs text-[#5A5549] font-mono mt-0.5">
                          {'\u20B9'}{((item.product.price_paise * item.quantity) / 100).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                          className="w-7 h-7 rounded-md bg-[#F5F0E8] hover:bg-[#E8E0D4] text-xs text-[#0C1220] font-bold flex items-center justify-center cursor-pointer transition-colors"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                          className="w-7 h-7 rounded-md bg-[#F5F0E8] hover:bg-[#E8E0D4] text-xs text-[#0C1220] font-bold flex items-center justify-center cursor-pointer transition-colors"
                        >
                          +
                        </button>
                        <button
                          onClick={() => onRemoveItem(idx)}
                          className="text-[#B0A99E] hover:text-red-500 text-xs p-1 ml-1 cursor-pointer"
                          title="Remove item"
                        >
                          <TrashIcon />
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
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[#5A5549] mb-1 font-mono uppercase tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E8E0D4] text-[#0C1220] focus:outline-none focus:border-[#C67D3A] text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A5549] mb-1 font-mono uppercase tracking-wider">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E8E0D4] text-[#0C1220] focus:outline-none focus:border-[#C67D3A] text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A5549] mb-1 font-mono uppercase tracking-wider">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Flat 402, Prestige Tower, 100ft Road"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E8E0D4] text-[#0C1220] focus:outline-none focus:border-[#C67D3A] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A5549] mb-1 font-mono uppercase tracking-wider">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E8E0D4] text-[#0C1220] focus:outline-none focus:border-[#C67D3A] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#5A5549] mb-1 font-mono uppercase tracking-wider">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-[#E8E0D4] text-[#0C1220] focus:outline-none focus:border-[#C67D3A] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}

          {step === 'success' && completedOrder && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#C67D3A]/10 border border-[#C67D3A]/30 text-[#C67D3A] flex items-center justify-center mx-auto">
                <CheckCircleIcon />
              </div>
              <h3 className="font-heading font-extrabold text-2xl text-[#0C1220] uppercase">Order Confirmed</h3>
              <p className="text-xs text-[#5A5549] max-w-xs mx-auto">
                Your hardware order for {completedOrder.amountDisplay} has been successfully placed.
              </p>
              <div className="p-3 bg-[#F5F0E8] rounded-lg font-mono text-[11px] text-[#9C9589] border border-[#E8E0D4]">
                Payment ID: {completedOrder.paymentId}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-6 border-t border-[#E8E0D4] bg-white space-y-4">
          {step === 'cart' && cart.length > 0 && (
            <>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[#9C9589]">
                  <span>Hardware Subtotal</span>
                  <span className="font-bold text-[#0C1220] text-base">{'\u20B9'}{(subtotalPaise / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-emerald-600 text-[11px]">
                  <span>Member Savings</span>
                  <span>{'\u20B9'}{(savingsPaise / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                onClick={() => setStep('checkout')}
                className="w-full py-3.5 rounded-xl bg-[#0C1220] hover:bg-[#1a2436] text-white font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>PROCEED TO CHECKOUT</span>
                <ArrowRightIcon />
              </button>
            </>
          )}

          {step === 'checkout' && (
            <div className="space-y-2">
              <button
                type="submit"
                form="cart-checkout-form"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-[#C67D3A] hover:bg-[#A8622C] text-white font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <span>DISPATCHING ORDER...</span>
                ) : (
                  <span>COMPLETE ORDER -- {'\u20B9'}{(subtotalPaise / 100).toLocaleString('en-IN')}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="w-full py-2 text-xs text-[#9C9589] hover:text-[#0C1220] font-medium cursor-pointer"
              >
                Back to Bag
              </button>
            </div>
          )}

          {step === 'success' && (
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-[#0C1220] text-white font-heading font-bold text-xs uppercase tracking-wider hover:bg-[#1a2436] transition-colors cursor-pointer"
            >
              CONTINUE SHOPPING
            </button>
          )}
        </div>
      </div>
    </div>
  );
}