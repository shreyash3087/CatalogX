import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCatalogXDb } from '@/lib/db';

/**
 * Normalize a raw event document from MongoDB so it always has:
 *  - `type`       — alias for `action` (required by the frontend switch)
 *  - `session_id` — required by the frontend filtering logic
 */
function normalizeEvent(event: any, fallbackSessionId: string): any {
  return {
    ...event,
    type: event.type || event.action || 'UNKNOWN',
    session_id: event.session_id || fallbackSessionId,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ events: [] });
    }

    // 1. Try MongoDB Atlas chat_sessions (multi-tenant store)
    try {
      const db = await getCatalogXDb();
      if (db) {
        const sessionDoc = await db.collection('chat_sessions').findOne({ sessionId });

        if (sessionDoc && Array.isArray(sessionDoc.events) && sessionDoc.events.length > 0) {
          const normalized = sessionDoc.events.map((e: any) => normalizeEvent(e, sessionId));
          return NextResponse.json({ events: normalized });
        }
      }
    } catch (dbErr: any) {
      console.warn('[API /events] DB read notice:', dbErr.message);
    }

    // 2. Check local fallback log file (buyer-agent/logs/<sessionId>.json)
    const rootDir = process.cwd().includes('dashboard') ? path.resolve(process.cwd(), '..') : process.cwd();
    const logFile = path.join(rootDir, 'buyer-agent', 'logs', `${sessionId}.json`);
    if (fs.existsSync(logFile)) {
      try {
        const raw = fs.readFileSync(logFile, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((e: any) => normalizeEvent(e, sessionId));
          return NextResponse.json({ events: normalized });
        }
      } catch {}
    }

    return NextResponse.json({ events: [] });
  } catch (err: any) {
    return NextResponse.json({ events: [], error: err?.message || String(err) }, { status: 500 });
  }
}
