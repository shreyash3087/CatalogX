'use client';

import React, { useState } from 'react';
import { AgentEvent } from '@/hooks/useAgentFeed';
import { formatEventSummary, formatTime } from '@/lib/eventUtils';

type Props = {
  events: AgentEvent[];
  selectedId: string | null;
  onSelect: (event: AgentEvent) => void;
  selectedEvent: AgentEvent | null;
};

export default function EventFeed({ events, selectedId, onSelect, selectedEvent }: Props) {
  const [activeView, setActiveView] = useState<'timeline' | 'inspector'>('timeline');

  const reversed = [...events].reverse();

  const getDotColor = (type: string) => {
    if (type.includes('VERIFIED') || type.includes('CAPTURED') || type.includes('SUCCESS'))
      return '#22c55e';
    if (type.includes('FAIL') || type.includes('REJECT') || type.includes('ERROR'))
      return '#ef4444';
    if (type.includes('GATE'))
      return '#D9A52E';
    if (type.includes('ORDER') || type.includes('INITIATED'))
      return '#D9A52E';
    return '#A9A49A';
  };

  return (
    <div className="flex flex-col h-full bg-[#111315] border border-[#292C2F] rounded-2xl overflow-hidden shadow-sm">
      {/* Header with toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#292C2F] bg-[#0E1012]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-[#F5F1E8]">Activity Log</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#D9A52E] animate-pulse" />
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-[#181B1E] border border-[#292C2F] rounded-lg p-0.5 text-[11px] font-semibold">
          <button
            onClick={() => setActiveView('timeline')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeView === 'timeline'
                ? 'bg-[#D9A52E] text-black font-bold shadow-sm'
                : 'text-[#A9A49A] hover:text-[#F5F1E8]'
            }`}
          >
            Timeline ({events.length})
          </button>
          <button
            onClick={() => setActiveView('inspector')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeView === 'inspector'
                ? 'bg-[#D9A52E] text-black font-bold shadow-sm'
                : 'text-[#A9A49A] hover:text-[#F5F1E8]'
            }`}
          >
            Inspector
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {activeView === 'timeline' ? (
          reversed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16">
              <i className="fa-regular fa-clock text-2xl text-zinc-600 mb-2" />
              <div className="text-xs font-semibold text-[#F5F1E8]">Waiting for agent steps</div>
              <div className="text-[11px] text-[#A9A49A] mt-1 max-w-[200px] leading-relaxed">
                Send a shopping request in the chat to see the live execution timeline.
              </div>
            </div>
          ) : (
            reversed.map((event) => {
              const isSelected = event.id === selectedId;
              const summary = formatEventSummary(event);
              const dotColor = getDotColor(event.type);

              return (
                <div
                  key={event.id}
                  onClick={() => {
                    onSelect(event);
                    setActiveView('inspector');
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#181B1E] border-[#D9A52E]/50 shadow-sm'
                      : 'bg-[#141618] hover:bg-[#181A1D] border-[#222528]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: dotColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-[#F5F1E8] truncate capitalize">
                          {event.type.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        <span className="text-[10px] font-mono text-[#A9A49A]/60 flex-shrink-0">
                          {formatTime(event.timestamp)}
                        </span>
                      </div>

                      <div className="text-[11px] text-[#A9A49A] truncate leading-snug">
                        {summary || event.reasoning || event.type}
                      </div>

                      {event.reasoning && (
                        <div className="text-[10px] text-[#A9A49A]/80 mt-1 line-clamp-1 italic">
                          "{event.reasoning}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* Inspector View */
          selectedEvent ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#141618] p-3 rounded-xl border border-[#292C2F]">
                <div>
                  <div className="text-xs font-bold text-[#D9A52E] font-mono uppercase">
                    {selectedEvent.type}
                  </div>
                  <div className="text-[10px] text-[#A9A49A] font-mono mt-0.5">
                    {new Date(selectedEvent.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('timeline')}
                  className="text-[10px] font-semibold text-[#D9A52E] hover:underline"
                >
                  ← Back to timeline
                </button>
              </div>

              {selectedEvent.reasoning && (
                <div>
                  <div className="text-[10px] font-bold text-[#A9A49A] uppercase tracking-wider mb-1">
                    Agent Decision Reasoning
                  </div>
                  <div className="p-3 rounded-xl bg-[#141618] border-l-2 border-[#D9A52E] text-xs text-[#F5F1E8] leading-relaxed">
                    {selectedEvent.reasoning}
                  </div>
                </div>
              )}

              {selectedEvent.input_data && (
                <div>
                  <div className="text-[10px] font-bold text-[#A9A49A] uppercase tracking-wider mb-1">
                    Input Parameters
                  </div>
                  <pre className="p-3 rounded-xl bg-[#0B0D0E] border border-[#292C2F] text-[10px] text-[#A9A49A] font-mono overflow-x-auto max-h-[140px]">
                    {typeof selectedEvent.input_data === 'string'
                      ? selectedEvent.input_data
                      : JSON.stringify(selectedEvent.input_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedEvent.output_data && (
                <div>
                  <div className="text-[10px] font-bold text-[#A9A49A] uppercase tracking-wider mb-1">
                    Merchant Response Output
                  </div>
                  <pre className="p-3 rounded-xl bg-[#0B0D0E] border border-[#292C2F] text-[10px] text-[#D9A52E] font-mono overflow-x-auto max-h-[140px]">
                    {typeof selectedEvent.output_data === 'string'
                      ? selectedEvent.output_data
                      : JSON.stringify(selectedEvent.output_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="py-16 text-center px-4">
              <i className="fa-regular fa-hand-pointer text-zinc-600 text-2xl mb-2" />
              <div className="text-xs font-semibold text-[#F5F1E8]">No event selected</div>
              <div className="text-[11px] text-[#A9A49A] mt-1">
                Click any step in the timeline to inspect its payloads.
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
