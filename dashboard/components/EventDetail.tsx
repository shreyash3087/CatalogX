'use client';

import { AgentEvent } from '@/hooks/useAgentFeed';
import { getEventMeta } from '@/lib/eventUtils';

type Props = {
  event: AgentEvent | null;
};

export default function EventDetail({ event }: Props) {
  if (!event) {
    return (
      <div className="empty-state">
        <div className="empty-icon">👆</div>
        <div className="empty-title">Select an event</div>
        <div className="empty-desc">Click any event in the feed to inspect its input, output, and reasoning.</div>
      </div>
    );
  }

  const meta = getEventMeta(event.type);

  // Extract fields to display separately
  const { type, timestamp, reasoning, input_data, output_data, id, session_id, ...rest } = event;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{meta.icon}</span>
        <div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            color: meta.color,
          }}>
            {type}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {new Date(timestamp).toLocaleString('en-IN')}
            {session_id && session_id !== 'system' && ` · ${session_id}`}
          </div>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Reasoning
          </div>
          <div className="detail-reasoning">{reasoning}</div>
        </div>
      )}

      {/* Input */}
      {input_data && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Input
          </div>
          <pre className="detail-json">
            {typeof input_data === 'string'
              ? input_data
              : JSON.stringify(input_data, null, 2)}
          </pre>
        </div>
      )}

      {/* Output */}
      {output_data && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Output
          </div>
          <pre className="detail-json">
            {typeof output_data === 'string'
              ? output_data
              : JSON.stringify(output_data, null, 2)}
          </pre>
        </div>
      )}

      {/* Other fields */}
      {Object.keys(rest).length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
            Payload
          </div>
          <pre className="detail-json">{JSON.stringify(rest, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
