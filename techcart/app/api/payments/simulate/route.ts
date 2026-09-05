import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getTechCartDb, saveTechCartOrder } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { razorpay_order_id } = body;

    if (!razorpay_order_id) {
      return NextResponse.json({ error: 'Missing razorpay_order_id' }, { status: 400 });
    }

    const cleanOrderId = razorpay_order_id.replace(/^(order_)+/, 'order_');
    const mockPaymentId = `pay_sim_${crypto.randomBytes(8).toString('hex')}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'IbXWmU2CVsUxLwX5wrCsKVya';
    const mockSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${mockPaymentId}`)
      .digest('hex');

    const db = await getTechCartDb();
    let amountPaise = 0;
    let orderDoc: any = null;

    if (db) {
      orderDoc = await db.collection('orders').findOne({
        $or: [{ orderId: cleanOrderId }, { razorpayOrderId: cleanOrderId }],
      });

      if (orderDoc) {
        amountPaise = orderDoc.amountPaise || 0;
        await db.collection('orders').updateOne(
          { _id: orderDoc._id },
          {
            $set: {
              status: 'PAID',
              razorpayPaymentId: mockPaymentId,
              updatedAt: new Date(),
            },
          }
        );
      }

      // Sync to catalogx_db.orders
      try {
        const client = (db as any).client || (global as any).mongoClient;
        if (client) {
          await client.db('catalogx_db').collection('orders').updateOne(
            { orderId: cleanOrderId },
            {
              $set: {
                status: 'PAID',
                razorpayPaymentId: mockPaymentId,
                updatedAt: new Date(),
              },
            }
          );
        }
      } catch {}

      // Update analytics
      await db.collection('analytics').updateOne(
        { key: 'agent_metrics' },
        {
          $inc: {
            orders_paid: 1,
            revenue_paise: amountPaise,
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );
    }

    const sessionId = body.session_id;
    if (sessionId && db) {
      try {
        const paymentEvent = {
          id: `evt_pay_${Date.now()}`,
          action: 'PAYMENT_VERIFIED',
          input_data: { razorpay_order_id: cleanOrderId },
          output_data: {
            razorpay_payment_id: mockPaymentId,
            razorpay_order_id: cleanOrderId,
            amount_inr: (amountPaise / 100).toFixed(2),
            autonomous: true,
          },
          reasoning: `Autonomous payment captured & verified! Transaction ID: ${mockPaymentId}`,
          timestamp: new Date(),
        };

        const client = (db as any).client || (global as any).mongoClient;
        if (client) {
          await client.db('catalogx_db').collection('chat_sessions').updateOne(
            { sessionId },
            {
              $push: { events: paymentEvent },
              $set: { isPaid: true, updatedAt: new Date() },
            }
          );
        }
      } catch {}
    }

    return NextResponse.json(
      {
        success: true,
        simulated: true,
        order_id: cleanOrderId,
        razorpay_order_id: cleanOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        amount_paise: amountPaise,
        amount_inr: (amountPaise / 100).toFixed(2),
        status: 'captured',
        timestamp: new Date().toISOString(),
      },
      {
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Payment simulation failed', details: (err as Error).message }, { status: 500 });
  }
}
