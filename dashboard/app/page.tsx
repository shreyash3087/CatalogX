'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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

type ChatMessage = {
  id: string;
  sender: 'human' | 'agent';
  text: string;
  timestamp: string;
  session_id?: string;
};

export default function Dashboard() {
  const { events, wsState, clearEvents } = useAgentFeed(WS_URL);
  const [selectedEvent, setSelectedEvent] = useState<AgentEvent | null>(null);
  const [filterText, setFilterText] = useState('');
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'detail' | 'gate' | 'payment'>('chat');
  
  // Chatbot states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSpawning, setIsSpawning] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Filter events by session if selected
  const sessionEvents = useMemo(
    () => activeSession ? events.filter(e => e.session_id === activeSession) : events,
    [events, activeSession]
  );

  const sessions = useMemo(() => getSessionsFromEvents(events), [events]);
  const paymentState = useMemo(() => getPaymentStateFromEvents(sessionEvents), [sessionEvents]);
  const gateTier = useMemo(() => getGateTierFromEvents(sessionEvents), [sessionEvents]);

  // Find the last selected product event
  const selectedProductEvent = useMemo(() =>
    [...sessionEvents].reverse().find(e => e.type === 'PRODUCT_SELECTED'),
    [sessionEvents]
  );

  // Auto-scroll chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-switch sessions when a new session starts
  useEffect(() => {
    if (sessions.length > 0) {
      const lastSession = sessions[sessions.length - 1];
      if (lastSession !== activeSession) {
        setActiveSession(lastSession);
      }
    }
  }, [sessions]);

  // Generate chatbot bubbles from live agent events
  useEffect(() => {
    if (events.length === 0) return;
    
    const lastEvent = events[events.length - 1];
    
    // Ignore duplicate notifications
    const msgId = `msg_${lastEvent.id || lastEvent.timestamp}`;
    if (chatMessages.some(m => m.id === msgId)) return;

    let text = '';
    
    if (lastEvent.type === 'INSTRUCTION_PARSED') {
      text = `🎯 I've parsed your request. Let's find products matching size **${lastEvent.required_size || 'any'}** within budget **${lastEvent.budget_max_paise ? '₹' + (lastEvent.budget_max_paise / 100) : 'unlimited'}**.`;
    } else if (lastEvent.type === 'PRODUCT_SELECTED') {
      text = `🛍️ Selected **${lastEvent.selected_name}** as the best match. Brand: ${lastEvent.brand}. Cost: ${lastEvent.price?.display || ''}.`;
    } else if (lastEvent.type === 'GATE_CHECKED') {
      text = `🔒 Spend Gate Checked. Cost belongs to the **${lastEvent.input_data?.tier || 'AUTO'}** tier. ${lastEvent.reasoning || ''}`;
    } else if (lastEvent.type === 'STOCK_GATE') {
      text = `⚠️ Out of stock! The item **${lastEvent.product_name}** went out of stock. Attempting fallback recovery...`;
    } else if (lastEvent.type === 'FALLBACK_SELECTED') {
      text = `🔄 Fallback selected: **${lastEvent.fallback_name}** (${lastEvent.price?.display}). Swapping order items.`;
    } else if (lastEvent.type === 'ORDER_CREATED') {
      text = `🧾 Created Razorpay order **${lastEvent.razorpay_order_id}** on backend.`;
    } else if (lastEvent.type === 'PAYMENT_VERIFIED' || lastEvent.type === 'PAYMENT_CAPTURED') {
      text = `✅ Cryptographic Payment Verified! Captured Transaction ID: **${lastEvent.razorpay_payment_id}**. Order marked as PAID.`;
    } else if (lastEvent.type === 'AGENT_ERROR') {
      text = `💥 Agent loop terminated with error: ${lastEvent.reasoning || 'unknown'}`;
    }

    if (text) {
      setChatMessages(prev => [
        ...prev,
        {
          id: msgId,
          sender: 'agent',
          text,
          timestamp: lastEvent.timestamp,
          session_id: lastEvent.session_id,
        }
      ]);
    }
  }, [events, chatMessages]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSpawning) return;

    const query = chatInput.trim();
    setChatInput('');
    setIsSpawning(true);

    const humanMsgId = `human_${Date.now()}`;
    const timestamp = new Date().toISOString();

    setChatMessages(prev => [
      ...prev,
      {
        id: humanMsgId,
        sender: 'human',
        text: query,
        timestamp,
      }
    ]);

    // Switch tab to show chatbot output
    setActiveTab('chat');

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: query }),
      });

      const data = await res.json();
      
      if (!data.success) {
        setChatMessages(prev => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'agent',
            text: `❌ Could not activate buyer agent: ${data.error || 'unknown server error'}`,
            timestamp: new Date().toISOString(),
          }
        ]);
      } else {
        // Clear active session to automatically target the incoming one
        setActiveSession(null);
      }
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'agent',
          text: `❌ Network error while initiating agent: ${err.message}`,
          timestamp: new Date().toISOString(),
        }
      ]);
    } finally {
      setIsSpawning(false);
    }
  };

  const handleClearHistory = () => {
    clearEvents();
    setChatMessages([]);
    setSelectedEvent(null);
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10 bg-slate-50">
      
      {/* Navbar header */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-sm px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-chambray to-aqua flex items-center justify-center text-white font-black shadow-md shadow-chambray/25">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="text-slate-900 font-extrabold text-base tracking-tight leading-none">CatalogX</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Agentic Commerce Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          
          {/* Session selection */}
          {sessions.length > 0 && (
            <select
              value={activeSession || ''}
              onChange={e => setActiveSession(e.target.value || null)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-mono focus:outline-none focus:border-chambray focus:ring-1 focus:ring-chambray cursor-pointer transition-colors"
            >
              <option value="">All Agent Sessions ({sessions.length})</option>
              {sessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* Reset buttons */}
          {(events.length > 0 || chatMessages.length > 0) && (
            <button
              onClick={handleClearHistory}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Clear Log
            </button>
          )}

          {/* WebSocket Connection indicator badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600">
            <div className={`w-2 h-2 rounded-full ${wsState === 'connected' ? 'bg-emerald-500 animate-dot-ping' : 'bg-rose-500'}`} />
            {wsState === 'connected' ? 'WS Live' : 'WS Offline'}
          </div>

        </div>
      </nav>

      {/* Main split dashboard panel */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 max-w-7xl w-full mx-auto p-6 gap-6">

        {/* Left Side: Live Feed & Chat Input Panel (w-96 / col-span-4) */}
        <div className="lg:col-span-4 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-120px)] sticky top-20">
          
          {/* Feed Title */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-widest">Agent Activity Log</span>
              <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
            </div>
            <span className="text-xs font-bold font-mono text-chambray bg-chambray/5 px-2 py-0.5 rounded">
              {sessionEvents.length} events
            </span>
          </div>

          {/* Search box */}
          <div className="p-3 border-b border-slate-50 flex-shrink-0">
            <input
              type="text"
              placeholder="Search / Filter events..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-chambray focus:ring-1 focus:ring-chambray transition-colors"
            />
          </div>

          {/* Event Feed */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50">
            <EventFeed
              events={sessionEvents}
              selectedId={selectedEvent?.id || null}
              onSelect={(e) => {
                setSelectedEvent(e);
                setActiveTab('detail');
              }}
              filter={filterText}
            />
          </div>

          {/* Bottom Chatbot Input panel */}
          <div className="border-t border-slate-100 p-4 bg-white flex-shrink-0">
            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask Agent: 'Buy running shoes size 9 under 3000'..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={isSpawning}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:border-chambray focus:ring-1 focus:ring-chambray disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isSpawning}
                className="bg-chambray hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSpawning ? '...' : 'Send'}
              </button>
            </form>
          </div>

        </div>

        {/* Right Side: Main tabs panel (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Stats top bar */}
          <StatsBar events={sessionEvents} />

          {/* Tabs header selector */}
          <div className="flex border-b border-slate-200 flex-shrink-0">
            {(['chat', 'detail', 'gate', 'payment'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 px-6 font-semibold text-xs tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'border-chambray text-chambray font-extrabold' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab === 'chat'    && '💬 Conversational Chat'}
                {tab === 'detail'  && '🔍 Event Inspector'}
                {tab === 'gate'    && '🛡️ Spend Gating'}
                {tab === 'payment' && '💳 Payment Tracker'}
              </button>
            ))}
          </div>

          {/* Main Card View */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex-1 min-h-[400px]">

            {/* TAB 1: Conversational Chat */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full min-h-[380px] justify-between">
                
                {/* Chat window */}
                <div className="flex-1 overflow-y-auto space-y-4 max-h-[360px] pr-2">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                      <span className="text-4xl mb-3">💬</span>
                      <h4 className="text-sm font-bold text-slate-800">Your AI Shopping Assistant</h4>
                      <p className="text-xs text-slate-400 max-w-[280px] mt-1 leading-relaxed">
                        Input a shopping requirement in the input box on the left, and watch the agent navigate merchants autonomously.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((msg) => {
                        const isHuman = msg.sender === 'human';
                        return (
                          <div key={msg.id} className={`flex ${isHuman ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm border ${
                              isHuman
                                ? 'bg-chambray text-white border-chambray/10 rounded-br-none'
                                : 'bg-slate-50 text-slate-700 border-slate-100 rounded-bl-none'
                            }`}>
                              <div className={`text-[9px] font-bold uppercase tracking-wider mb-1 opacity-70 ${isHuman ? 'text-blue-100' : 'text-slate-400'}`}>
                                {isHuman ? 'Owner' : 'CatalogX Buyer Agent'}
                              </div>
                              <p className="font-medium whitespace-pre-line">{msg.text}</p>
                            </div>
                          </div>
                        );
                      })}
                      {isSpawning && (
                        <div className="flex justify-start">
                          <div className="bg-slate-50 border border-slate-100 text-slate-500 rounded-2xl rounded-bl-none p-4 text-xs flex items-center gap-2">
                            <div className="animate-bounce inline-block w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                            <div className="animate-bounce inline-block w-1.5 h-1.5 bg-slate-400 rounded-full [animation-delay:0.2s]"></div>
                            <div className="animate-bounce inline-block w-1.5 h-1.5 bg-slate-400 rounded-full [animation-delay:0.4s]"></div>
                            <span>Agent activating execution loop...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* TAB 2: Event Inspector */}
            {activeTab === 'detail' && (
              <div>
                <EventDetail event={selectedEvent} />
              </div>
            )}

            {/* TAB 3: Spend Gating */}
            {activeTab === 'gate' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-1.5">Spend Gate Verification</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Autonomous buying policies. Low spend limit items clear automatically; budget limits trigger human notification or blocking prompt verification.
                  </p>
                </div>
                
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 shadow-inner">
                  <GatingIndicator tier={gateTier as 'AUTO' | 'NOTIFY' | 'CONFIRM' | 'REJECT' | null} />
                </div>

                {selectedProductEvent && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matched Product Details</h4>
                    <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono overflow-x-auto max-h-[220px]">
                      {JSON.stringify(selectedProductEvent.output_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Payment Tracker */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest mb-1.5">Razorpay Transaction Stepper</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Step-by-step cryptographic audit checklist of the payment lifecycle, verified from backend signatures.
                  </p>
                </div>
                
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60 shadow-inner">
                  <PaymentFlow state={paymentState} />
                </div>

                {/* Info Note */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs flex gap-3 text-blue-700 leading-relaxed font-medium">
                  <span className="text-base">ℹ️</span>
                  <div>
                    <div className="font-bold text-blue-800 uppercase tracking-wider text-[10px] mb-0.5">Test mode enabled</div>
                    All transactions use standard Razorpay test API keys. The buyer agent calls the server-side payment simulation endpoint to complete signature validation without requiring manual HTML modal interaction.
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
