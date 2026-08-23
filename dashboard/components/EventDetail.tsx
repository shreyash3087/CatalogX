'use client';

import { AgentEvent } from '@/hooks/useAgentFeed';
import { getEventMeta } from '@/lib/eventUtils';

type Props = {
  event: AgentEvent | null;
};

export default function EventDetail({ event }: Props) {
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-3xl mb-3">👆</span>
        <div className="text-sm font-bold text-slate-800">Select an event</div>
        <div className="text-xs text-slate-400 max-w-[240px] mt-1 leading-relaxed">
          Click any step from the live feed in the left sidebar to inspect payloads, LLM thoughts, and receipts.
        </div>
      </div>
    );
  }

  const meta = getEventMeta(event.type);

  // Extract fields to display separately
  const { type, timestamp, reasoning, input_data, output_data, id, session_id, ...rest } = event;

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
        <span className="text-3xl">{meta.icon}</span>
        <div>
          <div className="text-sm font-extrabold font-mono uppercase tracking-wide" style={{ color: meta.color }}>
            {type}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {new Date(timestamp).toLocaleString('en-IN')}
            {session_id && session_id !== 'system' && ` · ${session_id}`}
          </div>
        </div>
      </div>

      {/* Rationale / Explanation */}
      {reasoning && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reasoning / Execution Note</h4>
          <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-blue-500 text-xs text-slate-600 leading-relaxed font-medium">
            {reasoning}
          </div>
        </div>
      )}

      {/* Input data block */}
      {input_data && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Input Parameter Block</h4>
          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-[300px]">
            {typeof input_data === 'string'
              ? input_data
              : JSON.stringify(input_data, null, 2)}
          </pre>
        </div>
      )}

      {/* Output data block */}
      {output_data && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Output Response Payload</h4>
          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-[300px]">
            {typeof output_data === 'string'
              ? output_data
              : JSON.stringify(output_data, null, 2)}
          </pre>
        </div>
      )}

      {/* Additional fields */}
      {Object.keys(rest).length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event Metadata Context</h4>
          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono overflow-x-auto">
            {JSON.stringify(rest, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

}
