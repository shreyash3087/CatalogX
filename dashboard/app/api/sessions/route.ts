import { NextRequest, NextResponse } from 'next/server';
import { getCatalogXDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const db = await getCatalogXDb();
    if (!db) {
      return NextResponse.json({ sessions: [] });
    }

    const sessions = await db
      .collection('chat_sessions')
      .find({ userEmail: email.toLowerCase() })
      .sort({ updatedAt: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ sessions: [], error: (err as Error).message }, { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    const db = await getCatalogXDb();
    if (db) {
      const res = await db.collection('chat_sessions').deleteMany({ sessionId });
      console.log(`[Dashboard DB] Deleted session ${sessionId} from chat_sessions: ${res.deletedCount} docs removed.`);
    }

    // Also remove local fallback log if present
    try {
      const rootDir = path.resolve(process.cwd(), '..');
      const logFile = path.join(rootDir, 'buyer-agent', 'logs', `${sessionId}.json`);
      if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
      }
    } catch {}

    return NextResponse.json({ success: true, deletedSessionId: sessionId });
  } catch (err) {
    console.error('[Dashboard DB] Delete session error:', err);
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 200 });
  }
}
