'use client';

import React from 'react';

type Props = {
  paymentState: {
    orderCreated: boolean;
    orderID: string;
    paymentInitiated: boolean;
    paymentDone: boolean;
    paymentID: string;
    paymentFailed: boolean;
  };
  onTriggerCheckout?: (orderId: string) => void;
};

export default function PaymentFlow({ paymentState, onTriggerCheckout }: Props) {
  const steps = [
    { title: 'Order Created', done: paymentState.orderCreated, detail: paymentState.orderID || '—', icon: 'fa-regular fa-file-lines' },
    { title: 'Spend Gate Verified', done: paymentState.orderCreated, detail: 'Budget approved', icon: 'fa-regular fa-shield-halved' },
    { title: 'Payment Authorized', done: paymentState.paymentDone, active: paymentState.paymentInitiated && !paymentState.paymentDone, detail: paymentState.paymentID || '—', icon: 'fa-regular fa-lock' },
    { title: 'Signature Verified', done: paymentState.paymentDone, detail: paymentState.paymentDone ? 'HMAC-SHA256 valid' : '—', icon: 'fa-regular fa-circle-check' },
  ];

  return (
    <div className="p-4 space-y-4 overflow-y-auto max-h-full">
      {/* CTA if order exists but payment not done */}
      {paymentState.orderCreated && !paymentState.paymentDone && onTriggerCheckout && (
        <div className="p-3.5 rounded-lg bg-[#141210] border border-[#2a2520] flex items-center justify-between">
          <div>
            <div className="text-[12px] font-semibold text-[#ddb95f]">Order ready for checkout</div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{paymentState.orderID}</div>
          </div>
          <button
            onClick={() => onTriggerCheckout(paymentState.orderID)}
            className="px-4 py-2 bg-[#c8a44e] hover:bg-[#b8943e] text-black font-bold text-[11px] rounded-lg transition-all flex items-center gap-1.5"
          >
            <i className="fa-regular fa-credit-card text-[10px]" />
            Pay with Razorpay
          </button>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border flex items-center gap-3 transition-all ${
              step.done
                ? 'bg-[#111113] border-[#1a2e1a]'
                : step.active
                ? 'bg-[#13120f] border-[#2a2520]'
                : 'bg-[#0c0c0e] border-[#151518] opacity-40'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] flex-shrink-0 ${
                step.done
                  ? 'bg-[#16301a] text-emerald-400 border border-[#1a3a1e]'
                  : step.active
                  ? 'bg-[#1a1710] text-[#c8a44e] border border-[#2a2520] animate-pulse'
                  : 'bg-[#111113] text-zinc-600 border border-[#1a1a1e]'
              }`}
            >
              {step.done ? <i className="fa-regular fa-circle-check text-emerald-400" /> : <i className={step.icon} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-zinc-300">{step.title}</div>
              <div className="text-[10px] text-zinc-600 font-mono truncate mt-0.5">{step.detail}</div>
            </div>
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
              step.done ? 'text-emerald-500' : step.active ? 'text-[#c8a44e]' : 'text-zinc-600'
            }`}>
              {step.done ? 'Done' : step.active ? 'Active' : 'Pending'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
