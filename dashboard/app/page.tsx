'use client';

import { useState, useMemo } from 'react';
import { useAgentFeed, AgentEvent } from '@/hooks/useAgentFeed';
import {
  getPaymentStateFromEvents,
  getGateTierFromEvents,
  getSessionsFromEvents,
} from '@/lib/eventUtils';
import EventFeed from '@/components/EventFeed';
import EventDetail from '@/components/EventDetail';
import GatingIndicator from '@/components/GatingIndicator';
import PaymentFlow from '@/components/PaymentFlow';
import StatsBar from '@/components/StatsBar';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export default function Dashboard() {
  const { events, wsState, clearEvents } = useAgentFeed(WS_URL);
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const [filterText, setFilterText] = useState('');
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'detail' | 'gate' | 'payment'>('live');

  // Filter by session if one is selected
  const sessionEvents = useMemo(
    () => activeSession ? events.filter(e => e.session_id === activeSession) : events,
    [events, activeSession]
  );

  const sessions = useMemo(() => getSessionsFromEvents(events), [events]);
  const paymentState = useMemo(() => getPaymentStateFromEvents(sessionEvents), [sessionEvents]);
  const gateTier = useMemo(() => getGateTierFromEvents(sessionEvents), [sessionEvents]);

  // Get last product selected event for display
  const selectedProductEvent = useMemo(() =>
    [...sessionEvents].reverse().find(e => e.type === 'PRODUCT_SELECTED'),
    [sessionEvents]
  );

  return (
    <div className="layout">
      {/* ── Navbar ───────────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">⚡</div>
          <span>CatalogX</span>
          <span className="navbar-badge">Buildathon</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Session selector */}
          {sessions.length > 0 && (
            <select
              value={activeSession || ''}
              onChange={e => setActiveSession(e.target.value || null)}
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              <option value="">All Sessions ({sessions.length})</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Clear button */}
          {events.length > 0 && (
            <button
              onClick={clearEvents}
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              Clear
            </button>
          )}

          {/* WS status */}
          <div className="navbar-status">
            <div className={`status-dot ${wsState !== 'connected' ? 'offline' : ''}`} />
            {wsState === 'connected' ? 'Live' : wsState === 'connecting' ? 'Connecting...' : 'Offline'}
          </div>
        </div>
      </nav>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="main-content">

        {/* ── Sidebar: Live Event Feed ─────────────────────────── */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="live-badge">
                <div className="live-dot" />
                LIVE
              </div>
              <span className="sidebar-title">Event Feed</span>
            </div>
            <span className="event-count">{sessionEvents.length}</span>
          </div>

          {/* Search */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <input
              type="text"
              placeholder="Filter events..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: 11,
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <EventFeed
            events={sessionEvents}
            selectedId={selectedEvent?.id || null}
            onSelect={(e) => {
              setSelectedEvent(e);
              setActiveTab('detail');
            }}
            filter={filterText}
          />
        </aside>

        {/* ── Main Panel ──────────────────────────────────────── */}
        <main className="main-panel">

          {/* Stats */}
          <div>
            <StatsBar events={sessionEvents} />
          </div>

          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {(['live', 'detail', 'gate', 'payment'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  color: activeTab === tab ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: activeTab === tab ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'all 200ms',
                  textTransform: 'capitalize',
                  letterSpacing: '0.02em',
                  fontFamily: 'var(--font-sans)',
                  marginBottom: -1,
                }}
              >
                {tab === 'live'    && '📡 '}
                {tab === 'detail'  && '🔍 '}
                {tab === 'gate'    && '🔒 '}
                {tab === 'payment' && '💳 '}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}

          {/* Live — shows recent events in card format */}
          {activeTab === 'live' && (
            <div className="card">
              <div className="card-title">
                <span className="card-title-icon">📡</span>
                Recent Agent Activity
              </div>
              {sessionEvents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🤖</div>
                  <div className="empty-title">No agent activity yet</div>
                  <div className="empty-desc">
                    Run the buyer agent to see its decision flow here in real time.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[...sessionEvents].reverse().slice(0, 15).map(event => (
                    <ActivityRow
                      key={event.id}
                      event={event}
                      onSelect={() => { setSelectedEvent(event); setActiveTab('detail'); }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Detail — selected event inspector */}
          {activeTab === 'detail' && (
            <div className="card">
              <div className="card-title">
                <span className="card-title-icon">🔍</span>
                Event Inspector
              </div>
              <EventDetail event={selectedEvent} />
            </div>
          )}

          {/* Gate — spending gate visualization */}
          {activeTab === 'gate' && (
            <div className="card">
              <div className="card-title">
                <span className="card-title-icon">🔒</span>
                Spend Gate
              </div>
              <GatingIndicator tier={gateTier as 'AUTO' | 'NOTIFY' | 'CONFIRM' | 'REJECT' | null} />

              {selectedProductEvent && (
                <div style={{ marginTop: 20, padding: '14px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Selected Product
                  </div>
                  <pre className="detail-json" style={{ fontSize: 11 }}>
                    {JSON.stringify(selectedProductEvent.output_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Payment — payment flow stepper */}
          {activeTab === 'payment' && (
            <div className="card">
              <div className="card-title">
                <span className="card-title-icon">💳</span>
                Payment Flow
              </div>
              <PaymentFlow state={paymentState} />

              {/* Razorpay reference */}
              <div style={{ marginTop: 20, padding: '14px', background: 'rgba(59,130,246,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 11 }}>
                <div style={{ color: 'var(--accent-blue)', fontWeight: 600, marginBottom: 4 }}>ℹ️ Test Mode</div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  All payments use Razorpay test keys. No real money is charged.
                  The buyer agent uses the <code style={{ fontFamily: 'var(--font-mono)' }}>/api/payments/simulate</code> endpoint
                  for fully server-side autonomous payment flow.
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

/* ── Activity Row sub-component ─────────────────────────────────── */
function ActivityRow({ event, onSelect }: { event: AgentEvent; onSelect: () => void }) {
  const isGood = ['PAYMENT_VERIFIED', 'PAYMENT_CAPTURED', 'PRODUCT_SELECTED', 'STOCK_VERIFIED'].includes(event.type);
  const isBad  = ['PAYMENT_FAILED', 'STOCK_OUT', 'GATE_REJECTED', 'AGENT_ERROR', 'FALLBACK_FAILED'].includes(event.type);
  const isWarn = ['STOCK_GATE', 'FALLBACK_SELECTED', 'PAYMENT_RETRY_FAILED', 'GATE_CHECKED'].includes(event.type);

  const color = isGood ? 'var(--accent-green)' : isBad ? 'var(--accent-red)' : isWarn ? 'var(--accent-yellow)' : 'var(--accent-blue)';
  const bg    = isGood ? 'rgba(16,185,129,0.08)' : isBad ? 'rgba(239,68,68,0.08)' : isWarn ? 'rgba(234,179,8,0.08)' : 'var(--bg-glass)';

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '10px 14px',
        background: bg,
        border: `1px solid ${color}30`,
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all 200ms',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color, marginBottom: 2 }}>
          {event.type}
        </div>
        {event.reasoning && (
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.reasoning}
          </div>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', flexShrink: 0, paddingTop: 2 }}>
        {new Date(event.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
    </div>
  );
}
