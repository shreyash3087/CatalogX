import { NextRequest, NextResponse } from 'next/server';
import { getCatalogXDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    const db = await getCatalogXDb();
    if (!db) {
      return NextResponse.json({ active: false, mandate: null });
    }

    const query: any = { status: 'ACTIVE' };
    if (email) {
      query.email = email.toLowerCase();
    }

    const mandate = await db.collection('mandates').findOne(query, { sort: { created_at: -1 } });

    if (!mandate) {
      return NextResponse.json({ active: false, mandate: null });
    }

    return NextResponse.json({
      active: true,
      mandate: {
        id: mandate.id || mandate._id?.toString(),
        mandate_token: mandate.mandate_token,
        status: mandate.status,
        auth_payment_id: mandate.auth_payment_id,
        auth_order_id: mandate.auth_order_id,
        max_limit_inr: mandate.max_limit_inr,
        protocol: mandate.protocol || 'NPCI UAP / Razorpay TokenHQ',
        created_at: mandate.created_at,
        expires_at: mandate.expires_at,
      },
    });
  } catch (err) {
    console.error('[Mandates API] Status error:', err);
    return NextResponse.json({ active: false, mandate: null });
  }
}
