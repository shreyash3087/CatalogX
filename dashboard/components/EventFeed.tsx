'use client';

import { AgentEvent } from '@/hooks/useAgentFeed';
import { getEventMeta, formatEventSummary, formatTime } from '@/lib/eventUtils';

type Props = {
  events: AgentEvent[];
  selectedId: string | null;
  onSelect: (event: AgentEvent) => void;
  filter: string;
};

export default function EventFeed({ events, selectedId, onSelect, filter }: Props) {
  const filtered = filter
    ? events.filter(e =>
        e.type.toLowerCase().includes(filter.toLowerCase()) ||
        e.session_id?.toLowerCase().includes(filter.toLowerCase())
      )
    : events;

  const reversed = [...filtered].reverse();

  if (reversed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-3xl mb-3">📡</span>
        <div className="text-sm font-bold text-slate-800">Waiting for agent sessions</div>
        <div className="text-xs text-slate-400 max-w-[240px] mt-1 leading-relaxed">
          Type an instruction in the Chat panel below or execute the buyer agent script from your terminal.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3">
      {reversed.map((event) => {
        const meta = getEventMeta(event.type);
        const isActive = event.id === selectedId;
        return (
          <div
            key={event.id}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
              isActive
                ? 'bg-blue-50/70 border-blue-300 shadow-sm translate-x-1'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
            onClick={() => onSelect(event)}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: meta.dotColor }}
              />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider flex-1 truncate" style={{ color: meta.color }}>
                {meta.icon} {event.type}
              </span>
              <span className="text-[10px] font-mono text-slate-400">{formatTime(event.timestamp)}</span>
            </div>
            <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {formatEventSummary(event)}
            </div>
            {event.session_id && event.session_id !== 'system' && (
              <div className="mt-2.5 flex items-center justify-between">
                <span className="font-mono text-[9px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded leading-none">
                  {event.session_id.slice(0, 14)}...
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

}
