import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getCatalogXDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, max_limit_inr, customer_email } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature' },
        { status: 400 }
      );
    }

    // Verify cryptographic signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'IbXWmU2CVsUxLwX5wrCsKVya';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) {
      return NextResponse.json(
        { error: 'Signature mismatch: mandate authorization verification failed' },
        { status: 400 }
      );
    }

    const limitInr = Number(max_limit_inr) || 1500;
    const mandateToken = `tok_mnd_${crypto.randomBytes(12).toString('hex')}`;
    const mandateId = `mnd_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const email = (customer_email || 'buyer@catalogx.ai').toLowerCase();

    const mandateRecord = {
      id: mandateId,
      mandate_token: mandateToken,
      status: 'ACTIVE' as const,
      auth_payment_id: razorpay_payment_id,
      auth_order_id: razorpay_order_id,
      max_limit_inr: limitInr,
      protocol: 'NPCI UAP / Razorpay TokenHQ',
      email,
      userEmail: email,
      created_at: new Date().toISOString(),
      expires_at: expiresAt,
    };

    // Store in MongoDB
    try {
      const db = await getCatalogXDb();
      if (db) {
        await db.collection('mandates').updateMany(
          { $or: [{ email }, { status: 'ACTIVE' }] },
          { $set: { status: 'REVOKED' } }
        );
        await db.collection('mandates').insertOne(mandateRecord);
      }
    } catch (dbErr) {
      console.warn('[Mandates DB] MongoDB save notice:', (dbErr as Error).message);
    }

    return NextResponse.json({
      success: true,
      message: 'Mandate successfully authorized & token issued',
      mandate: mandateRecord,
    });
  } catch (err: any) {
    console.error('[Mandates API] Verify error:', err);
    return NextResponse.json(
      { error: 'Mandate verification failed', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
