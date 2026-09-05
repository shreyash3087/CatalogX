import { NextRequest, NextResponse } from 'next/server';
import { getCatalogXDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, title, userEmail, messages, selectedProduct, lastOrder, isPaid } = body;

    if (!sessionId || !userEmail) {
      return NextResponse.json({ error: 'Missing sessionId or userEmail' }, { status: 400 });
    }

    const db = await getCatalogXDb();
    const doc = {
      sessionId,
      title: title || 'New Conversation',
      userEmail: userEmail.toLowerCase(),
      messages: messages || [],
      selectedProduct: selectedProduct || null,
      lastOrder: lastOrder || null,
      isPaid: Boolean(isPaid),
      updatedAt: new Date(),
    };

    if (db) {
      await db.collection('chat_sessions').findOneAndUpdate(
        { sessionId },
        { $set: doc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, session: doc });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 200 });
  }
}
