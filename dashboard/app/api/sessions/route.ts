import { NextRequest, NextResponse } from 'next/server';
import { getCatalogXDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const db = await getCatalogXDb();
    const sessions = await db
      .collection('chat_sessions')
      .find({ userEmail: email.toLowerCase() })
      .sort({ updatedAt: -1 })
      .limit(30)
      .toArray();

    return NextResponse.json({ sessions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
