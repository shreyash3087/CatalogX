import { AgentEvent } from '@/hooks/useAgentFeed';

// Map event types to colors and dot classes
export const EVENT_META: Record<string, { color: string; dotColor: string; icon: string; category: string }> = {
  SERVER_STARTED:          { color: 'var(--text-secondary)', dotColor: '#6b7280', icon: '🚀', category: 'system' },
  INSTRUCTION_PARSED:      { color: 'var(--accent-blue)',    dotColor: '#3b82f6', icon: '🎯', category: 'agent' },
  CATALOG_DISCOVERED:      { color: 'var(--accent-blue)',    dotColor: '#3b82f6', icon: '🗺️', category: 'agent' },
  SEARCH_COMPLETED:        { color: 'var(--accent-blue)',    dotColor: '#3b82f6', icon: '🔍', category: 'agent' },
  SEARCH_NO_RESULTS:       { color: 'var(--accent-yellow)',  dotColor: '#eab308', icon: '⚠️', category: 'agent' },
  PRODUCT_SELECTED:        { color: 'var(--accent-green)',   dotColor: '#10b981', icon: '✅', category: 'agent' },
  GATE_CHECKED:            { color: 'var(--accent-gold)',    dotColor: '#f59e0b', icon: '🔒', category: 'gate' },
  GATE_REJECTED:           { color: 'var(--accent-red)',     dotColor: '#ef4444', icon: '🚫', category: 'gate' },
  STOCK_VERIFIED:          { color: 'var(--accent-green)',   dotColor: '#10b981', icon: '📦', category: 'stock' },
  STOCK_GATE:              { color: 'var(--accent-yellow)',  dotColor: '#eab308', icon: '⚠️', category: 'stock' },
  STOCK_OUT:               { color: 'var(--accent-red)',     dotColor: '#ef4444', icon: '❌', category: 'stock' },
  STOCK_OUT_PRE_ORDER:     { color: 'var(--accent-red)',     dotColor: '#ef4444', icon: '❌', category: 'stock' },
  FALLBACK_SELECTED:       { color: 'var(--accent-yellow)',  dotColor: '#eab308', icon: '🔄', category: 'recovery' },
  FALLBACK_FAILED:         { color: 'var(--accent-red)',     dotColor: '#ef4444', icon: '💀', category: 'recovery' },
  ORDER_CREATED:           { color: 'var(--accent-blue)',    dotColor: '#3b82f6', icon: '🧾', category: 'payment' },
  PAYMENT_INITIATED:       { color: 'var(--accent-blue)',    dotColor: '#3b82f6', icon: '💳', category: 'payment' },
  PAYMENT_CAPTURED:        { color: 'var(--accent-green)',   dotColor: '#10b981', icon: '💚', category: 'payment' },
  PAYMENT_VERIFIED:        { color: 'var(--accent-green)',   dotColor: '#10b981', icon: '✅', category: 'payment' },
  PAYMENT_FAILED:          { color: 'var(--accent-red)',     dotColor: '#ef4444', icon: '❌', category: 'payment' },
  PAYMENT_SIGNATURE_MISMATCH: { color: 'var(--accent-red)', dotColor: '#ef4444', icon: '🔐', category: 'payment' },
  PAYMENT_RETRY_SUCCESS:   { color: 'var(--accent-green)',   dotColor: '#10b981', icon: '🔄', category: 'recovery' },
  PAYMENT_RETRY_FAILED:    { color: 'var(--accent-yellow)',  dotColor: '#eab308', icon: '🔄', category: 'recovery' },
  AGENT_ERROR:             { color: 'var(--accent-red)',     dotColor: '#ef4444', icon: '💥', category: 'system' },
  WEBHOOK_EVENT:           { color: 'var(--text-secondary)', dotColor: '#6b7280', icon: '🪝', category: 'system' },
};

export function getEventMeta(type: string) {
  return EVENT_META[type] || { color: 'var(--text-secondary)', dotColor: '#6b7280', icon: '•', category: 'other' };
}

export function formatEventSummary(event: AgentEvent): string {
  const out = (event.output_data || {}) as Record<string, any>;
  const inp = (event.input_data || {}) as Record<string, any>;

  switch (event.type) {
    case 'INSTRUCTION_PARSED': {
      const instr = inp.instruction || event.instruction || out.instruction || '';
      return `Parsed: "${instr.slice(0, 60)}"`;
    }
    case 'CATALOG_DISCOVERED': {
      const merchant = out.merchant || event.merchant || '';
      const products = out.products ?? event.products ?? 0;
      return `${merchant || 'Merchant'} — ${products} products`;
    }
    case 'SEARCH_COMPLETED': {
      const count = out.count ?? event.count ?? 0;
      return `Found ${count} matches`;
    }
    case 'PRODUCT_SELECTED': {
      return out.selected_name || out.product?.name || event.selected_name || 'Selected product';
    }
    case 'ORDER_CREATED': {
      const orderId = out.razorpay_order_id || inp.razorpay_order_id || event.razorpay_order_id || event.order_id || '';
      const amount = out.amount?.inr || out.amount_inr || event.amount_inr || '';
      return `${orderId}${amount ? ` — ₹${amount}` : ''}`;
    }
    case 'PAYMENT_VERIFIED':
    case 'PAYMENT_CAPTURED': {
      const payId = out.razorpay_payment_id || inp.razorpay_payment_id || event.razorpay_payment_id || '';
      return `Payment ID: ${payId || 'Captured'}`;
    }
    case 'GATE_CHECKED':
      return (event.reasoning || 'Gate evaluated').slice(0, 80);
    case 'STOCK_OUT':
    case 'STOCK_GATE': {
      const prod = out.product_name || inp.product_name || event.product_name || '';
      return `${prod || 'Item'} — out of stock`;
    }
    case 'FALLBACK_SELECTED': {
      const fallback = out.fallback_name || event.fallback_name || '';
      return `Fallback: ${fallback}`;
    }
    default:
      return (event.reasoning || event.type.replace(/_/g, ' ').toLowerCase()).slice(0, 80);
  }
}

export function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export function getSessionsFromEvents(events: AgentEvent[]): string[] {
  const seen = new Set<string>();
  const sessions: string[] = [];
  for (const e of events) {
    if (e.session_id && e.session_id !== 'system' && !seen.has(e.session_id)) {
      seen.add(e.session_id);
      sessions.push(e.session_id);
    }
  }
  return sessions;
}

export function getPaymentStateFromEvents(events: AgentEvent[]) {
  const state = {
    orderCreated: false,
    orderID: '',
    paymentInitiated: false,
    paymentDone: false,
    paymentID: '',
    paymentFailed: false,
  };
  for (const e of events) {
    const out = (e.output_data || {}) as Record<string, any>;
    const inp = (e.input_data || {}) as Record<string, any>;

    if (e.type === 'ORDER_CREATED') {
      state.orderCreated = true;
      state.orderID = (out.razorpay_order_id || inp.razorpay_order_id || e.razorpay_order_id || '') as string;
    }
    if (e.type === 'PAYMENT_INITIATED') state.paymentInitiated = true;
    if (e.type === 'PAYMENT_VERIFIED' || e.type === 'PAYMENT_CAPTURED') {
      state.paymentDone = true;
      state.paymentID = (out.razorpay_payment_id || inp.razorpay_payment_id || e.razorpay_payment_id || '') as string;
    }
    if (e.type === 'PAYMENT_FAILED') state.paymentFailed = true;
  }
  return state;
}

export function getGateTierFromEvents(events: AgentEvent[]): string | null {
  for (const e of [...events].reverse()) {
    if (e.type === 'GATE_CHECKED' || e.type === 'GATE_REJECTED') {
      const input = (e.input_data || {}) as Record<string, any>;
      const out = (e.output_data || {}) as Record<string, any>;
      return (input.tier || out.tier || e.tier as string) || null;
    }
  }
  return null;
}

export function getStatsFromEvents(events: AgentEvent[]) {
  let sessions = new Set<string>();
  let purchasedOrders = new Set<string>();
  let completedPurchases = 0;
  let totalSpend = 0;
  let stockOuts = 0;

  for (const e of events) {
    const out = (e.output_data || {}) as Record<string, any>;
    const inp = (e.input_data || {}) as Record<string, any>;

    if (e.session_id) sessions.add(e.session_id);

    if (e.type === 'PAYMENT_VERIFIED' || e.type === 'PAYMENT_CAPTURED') {
      const orderKey = (out.razorpay_order_id || inp.razorpay_order_id || e.session_id || e.id) as string;
      if (!purchasedOrders.has(orderKey)) {
        purchasedOrders.add(orderKey);
        completedPurchases++;
        const inr = parseFloat((out.amount?.inr || out.amount_inr || e.amount_inr || '0') as string);
        totalSpend += inr;
      }
    }
    if (e.type === 'STOCK_OUT' || e.type === 'STOCK_OUT_PRE_ORDER') stockOuts++;
  }

  return {
    sessions: sessions.size,
    completedPurchases,
    totalSpend,
    stockOuts,
  };
}
