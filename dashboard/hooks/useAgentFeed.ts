'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type AgentEvent = {
  id?: string;
  type: string;
  session_id?: string;
  timestamp: string;
  reasoning?: string;
  [key: string]: any;
};

type WSState = 'connecting' | 'connected' | 'disconnected';

export function useAgentFeed(wsUrl: string) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [wsState, setWsState] = useState<WSState>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsState('connected');
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          // Handle bulk history payload on connect
          if (data.type === 'HISTORY' && Array.isArray(data.events)) {
            setEvents(data.events.map((e: Record<string, unknown>, i: number) => ({
              ...e,
              // DB rows use 'action' column; normalize to 'type'
              type: (e.type || e.action || 'UNKNOWN') as string,
              id: (e.id as string) || `hist_${i}`,
            })) as AgentEvent[]);
          } else {
            // Single event — normalize action→type for consistency
            const event: AgentEvent = {
              ...data,
              type: data.type || data.action || 'UNKNOWN',
              id: data.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
              timestamp: data.timestamp || new Date().toISOString(),
            };
            setEvents(prev => [...prev, event].slice(-200)); // keep last 200
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        setWsState('disconnected');
        // Auto-reconnect after 3s
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (_) {
      setWsState('disconnected');
      reconnectTimer.current = setTimeout(connect, 3000);
    }
  }, [wsUrl]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, wsState, clearEvents };
}
