'use client';

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
  { key: 'order',   label: 'Order',   icon: '🧾', desc: 'Razorpay order created' },
  { key: 'init',    label: 'Initiate',icon: '💳', desc: 'Payment initiated' },
  { key: 'capture', label: 'Capture', icon: '💸', desc: 'Payment captured' },
  { key: 'verify',  label: 'Verified',icon: '✅', desc: 'Signature verified' },
];

export default function PaymentFlow({ state }: Props) {
  const stepStatus = {
    order:   state.orderCreated ? (state.paymentFailed ? 'done' : 'done') : 'pending',
    init:    state.paymentInitiated ? 'done' : state.orderCreated ? 'active' : 'pending',
    capture: state.paymentDone ? 'done' : state.paymentFailed ? 'error' : state.paymentInitiated ? 'active' : 'pending',
    verify:  state.paymentDone ? 'done' : 'pending',
  } as Record<string, string>;

  return (
    <div>
      <div className="payment-flow">
        {STEPS.map((step, i) => {
          const status = stepStatus[step.key];
          return (
            <div key={step.key} className={`payment-step ${status}`}>
              <div className="payment-step-icon">
                {status === 'done' ? '✓' : status === 'error' ? '✗' : step.icon}
              </div>
              <div className="payment-step-label">{step.label}</div>
              {step.key === 'order' && state.orderID && (
                <div className="payment-step-id" title={state.orderID}>
                  {state.orderID.slice(0, 18)}...
                </div>
              )}
              {step.key === 'verify' && state.paymentID && (
                <div className="payment-step-id" title={state.paymentID}>
                  {state.paymentID.slice(0, 18)}...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
        {state.orderID && (
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted)' }}>Order: </span>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-blue)' }}>
              {state.orderID}
            </code>
          </div>
        )}
        {state.paymentID && (
          <div style={{ fontSize: 11 }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment: </span>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)' }}>
              {state.paymentID}
            </code>
          </div>
        )}
        {state.paymentFailed && !state.paymentDone && (
          <div style={{ fontSize: 11 }}>
            <span className="badge badge-red">Payment Failed</span>
          </div>
        )}
        {state.paymentDone && (
          <div style={{ fontSize: 11 }}>
            <span className="badge badge-green">Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}
