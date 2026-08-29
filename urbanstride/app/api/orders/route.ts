import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { getUrbanStrideProducts, saveUrbanStrideOrder, updateUrbanStrideStock } from '@/lib/db';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'IbXWmU2CVsUxLwX5wrCsKVya',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      product_id,
      size,
      color,
      quantity = 1,
      customer = {},
      shipping_address = {},
      buyer_agent_id,
      session_id,
    } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Missing required field: product_id' }, { status: 400 });
    }

    const products = await getUrbanStrideProducts();
    const product = products.find((p) => p.id === product_id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found', product_id }, { status: 404 });
    }

    if (size && !product.sizes.includes(String(size))) {
      return NextResponse.json({
        error: 'Size not available for this product',
        requested_size: size,
        available_sizes: product.sizes,
      }, { status: 400 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({
        error: 'Insufficient stock',
        product_id,
        product_name: product.name,
        requested_quantity: quantity,
        available_stock: product.stock,
        code: 'STOCK_OUT',
      }, { status: 409 });
    }

    // Customer & Shipping validation
    const custName = customer.name || body.customer_name || 'Guest User';
    const custEmail = customer.email || body.customer_email || 'guest@example.com';
    const custPhone = customer.phone || body.customer_phone || '+91 99999 99999';

    const shipStreet = shipping_address.street || body.shipping_street || 'Indiranagar';
    const shipCity = shipping_address.city || body.shipping_city || 'Bengaluru';
    const shipState = shipping_address.state || body.shipping_state || 'Karnataka';
    const shipPostalCode = shipping_address.postal_code || body.shipping_postal_code || '560038';
    const shipCountry = shipping_address.country || body.shipping_country || 'India';

    const amount_paise = product.price_paise * quantity;
    const orderId = `order_${crypto.randomUUID()}`;
    const receiptId = `rcpt_${crypto.randomBytes(8).toString('hex')}`;

    // Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount_paise,
      currency: 'INR',
      receipt: receiptId,
      notes: {
        product_id,
        product_name: product.name,
        size: size || 'N/A',
        buyer_agent_id: buyer_agent_id || 'unknown',
        session_id: session_id || 'unknown',
        customer_name: custName,
        customer_email: custEmail,
        customer_phone: custPhone,
        shipping_destination: `${shipStreet}, ${shipCity}, ${shipState} - ${shipPostalCode}`,
      },
    });

    // Decrement stock
    await updateUrbanStrideStock(product.id, product.stock - quantity);

    // Persist to urbanstride_db.orders
    await saveUrbanStrideOrder({
      orderId,
      razorpayOrderId: razorpayOrder.id,
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      size: size || 'Standard',
      color: color || 'Default',
      quantity,
      amountPaise: amount_paise,
      amountInr: amount_paise / 100,
      status: 'CREATED',
      customer: {
        name: custName,
        email: custEmail,
        phone: custPhone,
      },
      shippingAddress: {
        street: shipStreet,
        city: shipCity,
        state: shipState,
        postal_code: shipPostalCode,
        country: shipCountry,
      },
      buyerAgentId: buyer_agent_id,
      sessionId: session_id,
      createdAt: new Date(),
    });

    return NextResponse.json({
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      product: {
        id: product.id,
        name: product.name,
        brand: product.brand,
        size,
        color,
      },
      amount: {
        paise: amount_paise,
        inr: (amount_paise / 100).toFixed(2),
        currency: 'INR',
        display: `₹${(amount_paise / 100).toLocaleString('en-IN')}`,
      },
      customer: {
        name: custName,
        email: custEmail,
        phone: custPhone,
      },
      shipping_address: {
        street: shipStreet,
        city: shipCity,
        state: shipState,
        postal_code: shipPostalCode,
        country: shipCountry,
      },
      payment_options: {
        razorpay_key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSjdfOWmYoGtxa',
        currency: 'INR',
        amount_paise,
        receipt: razorpayOrder.receipt,
      },
      created_at: new Date().toISOString(),
    }, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[UrbanStride API /orders] Error:', err);
    return NextResponse.json({ error: 'Order creation failed', details: (err as Error).message }, { status: 500 });
  }
}
