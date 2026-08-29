import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUrbanStrideDb, saveUrbanStrideOrder } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { razorpay_order_id } = body;

    if (!razorpay_order_id) {
      return NextResponse.json({ error: 'Missing razorpay_order_id' }, { status: 400 });
    }

    const db = await getUrbanStrideDb();
    const order = await db.collection('orders').findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      return NextResponse.json({ error: 'Order not found', razorpay_order_id }, { status: 404 });
    }

    const mockPaymentId = `pay_sim_${crypto.randomBytes(8).toString('hex')}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'IbXWmU2CVsUxLwX5wrCsKVya';
    const mockSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${mockPaymentId}`)
      .digest('hex');

    await saveUrbanStrideOrder({
      orderId: order.orderId,
      status: 'PAID',
      razorpayPaymentId: mockPaymentId,
      amountPaise: order.amountPaise,
    });

    return NextResponse.json({
      success: true,
      simulated: true,
      order_id: order.orderId,
      razorpay_order_id,
      razorpay_payment_id: mockPaymentId,
      razorpay_signature: mockSignature,
      amount_paise: order.amountPaise,
      amount_inr: (order.amountPaise / 100).toFixed(2),
      status: 'captured',
      timestamp: new Date().toISOString(),
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Payment simulation failed', details: (err as Error).message }, { status: 500 });
  }
}
