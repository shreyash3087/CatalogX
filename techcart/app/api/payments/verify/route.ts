import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTechCartDb, saveTechCartOrder } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({
        error: 'Missing verification fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
      }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || 'IbXWmU2CVsUxLwX5wrCsKVya';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) {
      return NextResponse.json({ error: 'Signature mismatch: payment verification failed' }, { status: 400 });
    }

    const db = await getTechCartDb();
    const order = await db.collection('orders').findOne({ razorpayOrderId: razorpay_order_id });

    if (order) {
      await saveTechCartOrder({
        orderId: order.orderId,
        status: 'PAID',
        razorpayPaymentId: razorpay_payment_id,
        amountPaise: order.amountPaise,
      });
    }

    return NextResponse.json({
      verified: true,
      order_id: order?.orderId,
      razorpay_order_id,
      razorpay_payment_id,
      status: 'paid',
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Payment verification failed', details: (err as Error).message }, { status: 500 });
  }
}
