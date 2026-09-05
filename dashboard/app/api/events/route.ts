import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCatalogXDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId') || 'user_shreyash_001';

    if (!sessionId) {
      return NextResponse.json({ events: [] });
    }

    // 1. Try MongoDB Atlas chat_sessions (multi-tenant store)
    try {
      const db = await getCatalogXDb();
      if (db) {
        const sessionDoc = await db.collection('chat_sessions').findOne({
          sessionId,
          ...(userId ? { userId } : {}),
        });

        if (sessionDoc && Array.isArray(sessionDoc.events) && sessionDoc.events.length > 0) {
          return NextResponse.json({ events: sessionDoc.events });
        }
      }
    } catch {}

    // 2. Check local fallback log file
    const rootDir = path.resolve(process.cwd(), '..');
    const logFile = path.join(rootDir, 'buyer-agent', 'logs', `${sessionId}.json`);
    if (fs.existsSync(logFile)) {
      try {
        const raw = fs.readFileSync(logFile, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data) && data.length > 0) {
          return NextResponse.json({ events: data });
        }
      } catch {}
    }

    return NextResponse.json({ events: [] });
  } catch (err: any) {
    return NextResponse.json({ events: [], error: err?.message || String(err) }, { status: 500 });
  }
}
