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
      <div className="empty-state">
        <div className="empty-icon">📡</div>
        <div className="empty-title">Waiting for agent activity</div>
        <div className="empty-desc">
          Start the buyer agent to see live events here.
          <br />
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent-blue)' }}>
            node buyer-agent/src/index.js
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="event-list">
      {reversed.map((event) => {
        const meta = getEventMeta(event.type);
        const isActive = event.id === selectedId;
        return (
          <div
            key={event.id}
            className={`event-card ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(event)}
          >
            <div className="event-header">
              <div
                className="event-dot"
                style={{ background: meta.dotColor }}
              />
              <span className="event-type" style={{ color: meta.color }}>
                {meta.icon} {event.type}
              </span>
              <span className="event-time">{formatTime(event.timestamp)}</span>
            </div>
            <div className="event-summary">{formatEventSummary(event)}</div>
            {event.session_id && event.session_id !== 'system' && (
              <div style={{ marginTop: 4 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '1px 5px',
                  borderRadius: 3,
                }}>
                  {event.session_id}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
