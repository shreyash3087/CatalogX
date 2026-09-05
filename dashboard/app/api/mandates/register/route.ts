import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { customer_name, max_limit_inr } = body;
    const limitInr = max_limit_inr || 1500;
    const receipt = `mnd_auth_${Date.now()}`;

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'IbXWmU2CVsUxLwX5wrCsKVya';

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    // Create an authorization order on Razorpay for ₹1.00 (100 paise)
    const order = await razorpay.orders.create({
      amount: 100, // ₹1.00 Authorization fee
      currency: 'INR',
      receipt,
      notes: {
        type: 'agent_mandate_authorization',
        protocol: 'NPCI_UAP_V1',
        agent_name: 'CatalogX Autonomous Buyer Agent',
        max_limit_paise: limitInr * 100,
        customer_name: customer_name || 'CatalogX Buyer',
      },
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: 100,
      currency: 'INR',
      key_id,
      max_limit_inr: limitInr,
      receipt,
    });
  } catch (err: any) {
    console.error('[Mandates API] Register error:', err);
    return NextResponse.json(
      { error: 'Failed to create mandate authorization order', details: err?.message || String(err) },
      { status: 500 }
    );
  }
}
