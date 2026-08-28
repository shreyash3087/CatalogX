'use client';

import React from 'react';
import { AgentEvent } from '@/hooks/useAgentFeed';
import { getEventMeta } from '@/lib/eventUtils';

type Props = {
  event: AgentEvent | null;
};

export default function EventDetail({ event }: Props) {
  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <i className="fa-regular fa-hand-pointer text-2xl text-zinc-600 mb-3" />
        <div className="text-xs font-semibold text-zinc-400">Select an event</div>
        <div className="text-[11px] text-zinc-600 mt-1 max-w-[240px] leading-relaxed">
          Click any step from the Activity Log to inspect payloads and agent reasoning.
        </div>
      </div>
    );
  }

  const meta = getEventMeta(event.type);
  const { type, timestamp, reasoning, input_data, output_data, id, session_id, ...rest } = event;

  return (
    <div className="space-y-3 p-4 overflow-y-auto max-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#111113] p-3 rounded-lg border border-[#1e1e22]">
        <div className="w-8 h-8 rounded-lg bg-[#151518] border border-[#27272a] flex items-center justify-center text-[#c8a44e] text-sm">
          <i className="fa-regular fa-circle-dot" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-bold font-mono uppercase tracking-wide text-[#ddb95f]">
            {type}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">
            {new Date(timestamp).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {reasoning && (
        <div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Reasoning</div>
          <div className="p-3 rounded-lg bg-[#111113] border-l-2 border-[#c8a44e] text-[11px] text-zinc-400 leading-relaxed">
            {reasoning}
          </div>
        </div>
      )}

      {input_data && (
        <div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Input</div>
          <pre className="p-3 rounded-lg bg-[#0c0c0e] border border-[#1a1a1e] text-[10px] text-zinc-500 font-mono overflow-x-auto max-h-[140px]">
            {typeof input_data === 'string' ? input_data : JSON.stringify(input_data, null, 2)}
          </pre>
        </div>
      )}

      {output_data && (
        <div>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Output</div>
          <pre className="p-3 rounded-lg bg-[#0c0c0e] border border-[#1a1a1e] text-[10px] text-[#a8926a] font-mono overflow-x-auto max-h-[140px]">
            {typeof output_data === 'string' ? output_data : JSON.stringify(output_data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
