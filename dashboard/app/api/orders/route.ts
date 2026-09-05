import { NextResponse } from 'next/server';
import { getCatalogXDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

function parseAmountToInr(raw: any): number {
  if (typeof raw === 'number') {
    return isNaN(raw) ? 1499 : raw;
  }
  if (!raw) return 1499;
  const str = String(raw).replace(/[^0-9.]/g, '');
  const num = parseFloat(str);
  return isNaN(num) || num <= 0 ? 1499 : num;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');

    const db = await getCatalogXDb();
    if (!db) {
      return NextResponse.json({ success: false, orders: [], error: 'Database unavailable' }, { status: 503 });
    }

    const query: Record<string, any> = {};
    if (userId) {
      query.userId = userId;
    } else if (email) {
      query.$or = [{ 'customer.email': email }, { userId: email }];
    }

    const rawOrders = await db
      .collection('orders')
      .find(query)
      .sort({ createdAt: -1, updatedAt: -1 })
      .limit(100)
      .toArray();

    const orders = rawOrders.map((o) => {
      const isPaid = (o.status || '').toUpperCase() === 'PAID' || !!o.razorpayPaymentId;

      let inrVal = 0;
      if (typeof o.amountInr === 'number' && o.amountInr > 0) {
        inrVal = o.amountInr;
      } else if (typeof o.amountPaise === 'number' && o.amountPaise > 0) {
        inrVal = o.amountPaise / 100;
      } else if (o.amount?.inr) {
        inrVal = parseAmountToInr(o.amount.inr);
      } else if (o.amountDisplay) {
        inrVal = parseAmountToInr(o.amountDisplay);
      } else {
        inrVal = 1499;
      }

      const customerName =
        o.customer?.name ||
        o.customerName ||
        o.user_name ||
        (o.userId && !o.userId.startsWith('user_') ? o.userId : 'Shreyash Srivastava');

      const street = o.shippingAddress?.street || o.shipping_address?.street || '';
      const city = o.shippingAddress?.city || o.shipping_address?.city || '';
      const state = o.shippingAddress?.state || o.shipping_address?.state || '';
      const postalCode = o.shippingAddress?.postal_code || o.shipping_address?.postal_code || '';

      const destParts = [street, city, state].filter(Boolean);
      let shippingDest = destParts.join(', ');
      if (postalCode) shippingDest += ` - ${postalCode}`;
      if (!shippingDest) shippingDest = 'Sehore, Bhopal, Madhya Pradesh - 123456';

      return {
        orderId: o.orderId || o.razorpayOrderId || o._id?.toString(),
        productName: o.productName || o.product_name || 'HRX by Hrithik Roshan RUN',
        merchantName: o.merchantName || o.merchant_name || (o.merchantUrl?.includes('3002') ? 'TechCart Electronics' : 'UrbanStride Footwear'),
        customerName,
        customerEmail: o.customer?.email || '',
        customerPhone: o.customer?.phone || '',
        shippingDest,
        amountDisplay: `₹${inrVal.toLocaleString('en-IN')}`,
        amountNumber: inrVal,
        gateTier: o.gateTier || 'AUTO',
        status: isPaid ? 'Paid' : 'Created',
        payId: o.razorpayPaymentId || o.paymentId || (isPaid ? 'pay_sim_auto' : undefined),
        receipt: o.receipt || `rcpt_${(o.orderId || '').slice(-8)}`,
        attempts: isPaid ? 1 : 0,
        timestamp: o.createdAt || o.updatedAt || new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    console.error('[API /api/orders] Error fetching orders:', err);
    return NextResponse.json({ success: false, orders: [], error: err.message }, { status: 500 });
  }
}
