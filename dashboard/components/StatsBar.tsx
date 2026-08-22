'use strict';

import { getStatsFromEvents } from '@/lib/eventUtils';
import { AgentEvent } from '@/hooks/useAgentFeed';

type Props = { events: AgentEvent[] };

export default function StatsBar({ events }: Props) {
  const stats = getStatsFromEvents(events);

  const cards = [
    {
      label: 'Active Sessions',
      value: stats.sessions,
      color: 'text-chambray',
      bg: 'bg-chambray/5 border-chambray/10',
      icon: '🤖',
    },
    {
      label: 'Agent Purchases',
      value: stats.completedPurchases,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
      icon: '✅',
    },
    {
      label: 'Total Spends',
      value: `₹${stats.totalSpend.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
      icon: '💰',
    },
    {
      label: 'Inventory Alerts',
      value: stats.stockOuts,
      color: stats.stockOuts > 0 ? 'text-rose-600' : 'text-slate-400',
      bg: stats.stockOuts > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100',
      icon: '📦',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div 
          key={card.label} 
          className={`p-5 rounded-xl border flex flex-col justify-between shadow-sm bg-white hover:translate-y-[-2px] transition-all duration-200`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{card.label}</span>
            <span className="text-xl">{card.icon}</span>
          </div>
          <div className={`text-2xl font-extrabold tracking-tight ${card.color}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );

}
