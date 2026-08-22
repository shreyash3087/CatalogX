'use strict';

type PaymentState = {
  orderCreated: boolean;
  orderID: string;
  paymentInitiated: boolean;
  paymentDone: boolean;
  paymentID: string;
  paymentFailed: boolean;
};

type Props = { state: PaymentState };

const STEPS = [
  { key: 'order',   label: 'Order',   icon: '🧾', desc: 'Order Created' },
  { key: 'init',    label: 'Authorize',icon: '💳', desc: 'Payment Prefilled' },
  { key: 'capture', label: 'Capture', icon: '💸', desc: 'Payment Captured' },
  { key: 'verify',  label: 'Verify',   icon: '✅', desc: 'Verified Signature' },
];

export default function PaymentFlow({ state }: Props) {
  const stepStatus = {
    order:   state.orderCreated ? 'done' : 'pending',
    init:    state.paymentInitiated ? 'done' : state.orderCreated ? 'active' : 'pending',
    capture: state.paymentDone ? 'done' : state.paymentFailed ? 'error' : state.paymentInitiated ? 'active' : 'pending',
    verify:  state.paymentDone ? 'done' : 'pending',
  } as Record<string, string>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between py-2">
        {STEPS.map((step, i) => {
          const status = stepStatus[step.key];
          
          let circleBg = 'bg-white border-slate-200 text-slate-400';
          let textColor = 'text-slate-400';
          let borderLine = 'border-slate-200';

          if (status === 'done') {
            circleBg = 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm';
            textColor = 'text-emerald-700 font-bold';
          } else if (status === 'active') {
            circleBg = 'bg-blue-50 border-blue-600 text-blue-600 animate-pulse-step';
            textColor = 'text-blue-700 font-bold';
          } else if (status === 'error') {
            circleBg = 'bg-rose-50 border-rose-500 text-rose-600';
            textColor = 'text-rose-700 font-bold';
          }

          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative text-center">
              
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div 
                  className={`absolute top-[18px] left-[50%] right-[-50%] h-[2px] -z-10 transition-colors duration-300 ${
                    stepStatus[STEPS[i + 1].key] === 'done' || status === 'done'
                      ? 'bg-emerald-500' 
                      : 'bg-slate-200'
                  }`}
                />
              )}

              {/* Step Circle */}
              <div className={`h-9 w-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold z-10 transition-all ${circleBg}`}>
                {status === 'done' ? '✓' : status === 'error' ? '✗' : step.icon}
              </div>

              {/* Label */}
              <div className={`text-[10px] uppercase tracking-wider mt-2.5 ${textColor}`}>
                {step.label}
              </div>

              {/* Detail Code tags */}
              {step.key === 'order' && state.orderID && (
                <div className="text-[9px] font-mono text-slate-400 mt-1 max-w-[80px] truncate" title={state.orderID}>
                  {state.orderID}
                </div>
              )}
              {step.key === 'verify' && state.paymentID && (
                <div className="text-[9px] font-mono text-slate-400 mt-1 max-w-[80px] truncate" title={state.paymentID}>
                  {state.paymentID}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Identifiers list */}
      <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-500 justify-between items-center">
        <div className="flex gap-4 flex-wrap">
          {state.orderID && (
            <div>
              <span className="text-slate-400 font-semibold">Razorpay Order:</span>{' '}
              <code className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{state.orderID}</code>
            </div>
          )}
          {state.paymentID && (
            <div>
              <span className="text-slate-400 font-semibold">Payment Capture ID:</span>{' '}
              <code className="font-mono text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{state.paymentID}</code>
            </div>
          )}
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-2">
          {state.paymentFailed && !state.paymentDone && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              ● Payment Failed
            </span>
          )}
          {state.paymentDone && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Verified Paid
            </span>
          )}
        </div>
      </div>
    </div>
  );

}
