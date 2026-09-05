import { NextRequest, NextResponse } from 'next/server';
import { getCatalogXDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body?.email;

    const db = await getCatalogXDb();
    if (db) {
      const query: any = { status: 'ACTIVE' };
      if (email) {
        query.email = email.toLowerCase();
      }

      await db.collection('mandates').updateMany(query, {
        $set: { status: 'REVOKED', revoked_at: new Date().toISOString() },
      });
    }

    return NextResponse.json({ success: true, message: 'Active mandate revoked' });
  } catch (err: any) {
    console.error('[Mandates API] Revoke error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke mandate', details: err?.message || String(err) },
      { status: 200 }
    );
  }
}
