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

export function useAgentFeed(wsUrl: string = '/api/events') {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [wsState, setWsState] = useState<WSState>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const normalizeTimestamp = (ts: any): string => {
    if (!ts) return new Date().toISOString();
    if (typeof ts === 'string') {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(ts)) {
        return ts.replace(' ', 'T') + 'Z';
      }
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(ts)) {
        return ts + 'Z';
      }
    }
    try {
      return new Date(ts).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  const parsePayload = (val: any) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  };

  const processEvents = useCallback((rawEvents: any[]) => {
    if (!Array.isArray(rawEvents)) return;

    setEvents((prev) => {
      const existingIds = new Set(prev.map((e) => e.id || `${e.session_id}_${e.timestamp}_${e.type}`));
      const newItems: AgentEvent[] = [];

      for (const e of rawEvents) {
        const type = (e.type || e.action || 'UNKNOWN') as string;
        const id = (e.id as string) || `evt_${e.session_id || 's'}_${e.step || ''}_${e.timestamp || Date.now()}`;
        const key = id || `${e.session_id}_${e.timestamp}_${type}`;

        if (!existingIds.has(key)) {
          newItems.push({
            ...e,
            type,
            id,
            timestamp: normalizeTimestamp(e.timestamp),
            input_data: parsePayload(e.input_data),
            output_data: parsePayload(e.output_data),
          });
        }
      }

      if (newItems.length === 0) return prev;
      return [...prev, ...newItems].slice(-500);
    });
  }, []);

  const fetchHttpEvents = useCallback(async () => {
    try {
      const endpoint = wsUrl.startsWith('/') ? wsUrl : '/api/events';
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.events)) {
          processEvents(data.events);
          setWsState('connected');
        }
      }
    } catch {
      // Keep silent on transient network poll hiccups
    }
  }, [wsUrl, processEvents]);

  useEffect(() => {
    let isMounted = true;

    // Check if WS is available or fallback to HTTP polling
    const isWebSocketUrl = wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://');

    if (isWebSocketUrl) {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setWsState('connected');
        };

        ws.onmessage = (msg) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(msg.data);
            if (data.type === 'HISTORY' && Array.isArray(data.events)) {
              processEvents(data.events);
            } else {
              processEvents([data]);
            }
          } catch (_) {}
        };

        ws.onerror = () => {
          // Fallback to HTTP polling if WS fails
          ws.close();
        };

        ws.onclose = () => {
          if (isMounted) {
            // Start polling as fallback
            fetchHttpEvents();
            if (!pollTimerRef.current) {
              pollTimerRef.current = setInterval(fetchHttpEvents, 1000);
            }
          }
        };
      } catch {
        // Start polling fallback
        fetchHttpEvents();
        pollTimerRef.current = setInterval(fetchHttpEvents, 1000);
      }
    } else {
      // Direct HTTP event polling on mount / session change with responsive 1.2s interval
      fetchHttpEvents();
      pollTimerRef.current = setInterval(fetchHttpEvents, 1200);
    }

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [wsUrl, fetchHttpEvents, processEvents]);

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, wsState, clearEvents, refreshEvents: fetchHttpEvents };
}
