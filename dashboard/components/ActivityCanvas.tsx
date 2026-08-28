'use client';

import React, { useState } from 'react';
import { AgentEvent } from '@/hooks/useAgentFeed';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  events: AgentEvent[];
  selectedId: string | null;
  onSelect: (event: AgentEvent) => void;
  selectedEvent: AgentEvent | null;
  theme: 'light' | 'dark';
};

export default function ActivityCanvas({
  isOpen,
  onClose,
  events,
  selectedId,
  onSelect,
  selectedEvent,
  theme,
}: Props) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'inspector'>('timeline');
  const isLight = theme === 'light';

  return (
    <aside
      className={`h-full flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen
          ? 'w-[420px] max-w-[420px] opacity-100 border-l'
          : 'w-0 max-w-0 opacity-0 pointer-events-none border-l-0'
      } ${
        isLight
          ? 'bg-white text-slate-900 border-slate-200'
          : 'bg-[#0E1012] text-slate-200 border-[#202734]'
      }`}
    >
      <div className="w-[420px] min-w-[420px] h-full flex flex-col">
        {/* Canvas Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0 ${
            isLight ? 'border-slate-200 bg-slate-50/90' : 'border-[#202734] bg-[#12161f]'
          }`}
        >
          <div className="flex items-center gap-2">
            <i className="fa-regular fa-rectangle-list text-[#0c6cf2] text-xs" />
            <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Activity Log & Audit Trail
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                isLight ? 'bg-slate-200/80 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {events.length} events
            </span>
            <button
              onClick={onClose}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Close Canvas"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* View Switcher: Timeline vs Raw Inspector */}
        <div
          className={`px-5 py-2 border-b flex items-center justify-between gap-2 flex-shrink-0 ${
            isLight ? 'border-slate-200 bg-white' : 'border-[#202734] bg-[#0E1012]'
          }`}
        >
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                activeTab === 'timeline'
                  ? 'bg-[#0c6cf2] text-white font-medium shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab('inspector')}
              className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-[#0c6cf2] text-white font-medium shadow-xs'
                  : isLight
                  ? 'text-slate-600 hover:bg-slate-100 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Inspector
            </button>
          </div>

          {selectedEvent && (
            <span
              className={`text-[10px] font-mono truncate max-w-[150px] ${
                isLight ? 'text-slate-600 font-medium' : 'text-slate-400'
              }`}
            >
              {selectedEvent.type}
            </span>
          )}
        </div>

        {/* Content Area without visible scrollbar */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {events.length === 0 ? (
            <div className="py-16 text-center space-y-1.5">
              <svg
                className="w-7 h-7 mx-auto text-slate-400 dark:text-slate-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h3.375l2.25-6 3.75 12 2.25-6h5.25" />
              </svg>
              <div className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                No audit events logged yet
              </div>
              <p className={`text-[11px] max-w-[200px] mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Submit a shopping query in the chat to stream agent reasoning here.
              </p>
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="space-y-2">
              {events
                .slice()
                .reverse()
                .map((ev) => {
                  const isSelected = selectedId === ev.id;
                  const isPaid = ev.type === 'PAYMENT_CAPTURED' || ev.type === 'PAYMENT_VERIFIED';
                  const isOrder = ev.type === 'ORDER_CREATED';

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        onSelect(ev);
                        setActiveTab('inspector');
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-blue-50/90 border-[#0c6cf2] shadow-xs'
                            : 'bg-[#152030] border-blue-600 shadow-xs'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                          : 'bg-[#12161f] border-[#202734] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isPaid
                                ? 'bg-emerald-500'
                                : isOrder
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                            }`}
                          />
                          <span className={`text-xs font-semibold truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                            {ev.type}
                          </span>
                        </div>
                        <span className={`text-[10.5px] font-mono flex-shrink-0 ${isLight ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                          {new Date(ev.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>

                      {ev.reasoning && (
                        <p className={`text-[11.5px] mt-1 leading-relaxed ${isLight ? 'text-slate-700 font-normal' : 'text-slate-300'}`}>
                          {ev.reasoning}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="space-y-3">
              {selectedEvent ? (
                <>
                  <div
                    className={`p-3.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#12161f] border-[#202734]'
                    }`}
                  >
                    <div className={`text-xs font-semibold mb-1 flex items-center justify-between ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                      <span>Event: {selectedEvent.type}</span>
                      <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {new Date(selectedEvent.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {selectedEvent.reasoning && (
                      <p className={`text-xs leading-relaxed italic ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        "{selectedEvent.reasoning}"
                      </p>
                    )}
                  </div>

                  <div>
                    <div className={`text-[10px] uppercase font-semibold tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Input Data
                    </div>
                    <pre
                      className={`p-3 rounded-xl text-[11px] font-mono overflow-x-auto border no-scrollbar ${
                        isLight
                          ? 'bg-slate-900 text-emerald-300 border-slate-800'
                          : 'bg-[#0B0D0E] text-emerald-400 border-[#202734]'
                      }`}
                    >
                      {JSON.stringify(selectedEvent.input_data || {}, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div className={`text-[10px] uppercase font-semibold tracking-wider mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Output Payload
                    </div>
                    <pre
                      className={`p-3 rounded-xl text-[11px] font-mono overflow-x-auto border no-scrollbar ${
                        isLight
                          ? 'bg-slate-900 text-emerald-300 border-slate-800'
                          : 'bg-[#0B0D0E] text-emerald-400 border-[#202734]'
                      }`}
                    >
                      {JSON.stringify(selectedEvent.output_data || {}, null, 2)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className={`py-12 text-center text-xs ${isLight ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
                  Select an event from the timeline to inspect its payload.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
