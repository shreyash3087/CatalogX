'use client';

import { getStatsFromEvents } from '@/lib/eventUtils';
import { AgentEvent } from '@/hooks/useAgentFeed';

type Props = { events: AgentEvent[] };

export default function StatsBar({ events }: Props) {
  const stats = getStatsFromEvents(events);

  const cards = [
    {
      label: 'Sessions',
      value: stats.sessions,
      color: 'var(--accent-blue)',
      icon: '🤖',
    },
    {
      label: 'Purchases',
      value: stats.completedPurchases,
      color: 'var(--accent-green)',
      icon: '✅',
    },
    {
      label: 'Revenue',
      value: `₹${stats.totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
      color: 'var(--accent-gold)',
      icon: '💰',
    },
    {
      label: 'Stock-Outs',
      value: stats.stockOuts,
      color: stats.stockOuts > 0 ? 'var(--accent-red)' : 'var(--text-muted)',
      icon: '📦',
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => (
        <div key={card.label} className="stat-card">
          <div style={{ fontSize: 20, marginBottom: 6 }}>{card.icon}</div>
          <div className="stat-value" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="stat-label">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
