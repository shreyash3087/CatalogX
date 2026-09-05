import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getCatalogXDb } from '@/lib/db';

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

        if (sessionDoc && Array.isArray(sessionDoc.events)) {
          return NextResponse.json({ events: sessionDoc.events });
        }
      }
    } catch (dbErr: any) {
      console.warn('[API /events] DB read notice:', dbErr.message);
    }

    // 2. Check local fallback log file
    const rootDir = process.cwd().includes('dashboard') ? path.resolve(process.cwd(), '..') : process.cwd();
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
