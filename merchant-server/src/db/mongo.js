const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://shreyash3087_db_user:NOMnwQ33KaQriDfx@cluster0.u43ndu4.mongodb.net/?appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB_NAME || 'catalogx_db';

let client = null;
let db = null;
let isConnecting = false;

async function connectMongo() {
  if (db) return db;
  if (isConnecting) {
    while (isConnecting) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    if (db) return db;
  }

  try {
    isConnecting = true;
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(DB_NAME);
    console.log(`[MongoDB] Connected to database: ${DB_NAME}`);

    // Create indexes for high performance
    try {
      await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
      await db.collection('chat_sessions').createIndex({ sessionId: 1 }, { unique: true });
      await db.collection('chat_sessions').createIndex({ userEmail: 1 });
      await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
      await db.collection('orders').createIndex({ 'customer.email': 1 });
      await db.collection('payments').createIndex({ paymentId: 1 }, { unique: true, sparse: true });
      await db.collection('mandates').createIndex({ mandateToken: 1 }, { unique: true });
    } catch (idxErr) {
      console.warn('[MongoDB] Index initialization notice:', idxErr.message);
    }

    return db;
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    return null;
  } finally {
    isConnecting = false;
  }
}

// User Profile Operations
async function saveUserProfile(userProfile) {
  if (!userProfile || !userProfile.email) return null;
  try {
    const database = await connectMongo();
    if (!database) return null;

    const doc = {
      email: userProfile.email,
      name: userProfile.name || '',
      phone: userProfile.phone || '',
      avatar: userProfile.avatar || '',
      delivery_address: userProfile.delivery_address || null,
      updatedAt: new Date(),
    };

    const result = await database.collection('users').findOneAndUpdate(
      { email: userProfile.email },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    return result;
  } catch (err) {
    console.error('[MongoDB] saveUserProfile error:', err.message);
    return null;
  }
}

async function getUserProfile(email) {
  if (!email) return null;
  try {
    const database = await connectMongo();
    if (!database) return null;
    return await database.collection('users').findOne({ email });
  } catch (err) {
    console.error('[MongoDB] getUserProfile error:', err.message);
    return null;
  }
}

// Chat Session Operations
async function saveChatSession({ sessionId, userEmail, title, messages, events }) {
  if (!sessionId) return null;
  try {
    const database = await connectMongo();
    if (!database) return null;

    const doc = {
      sessionId,
      userEmail: userEmail || 'guest',
      title: title || 'New Chat',
      messages: messages || [],
      events: events || [],
      updatedAt: new Date(),
    };

    const result = await database.collection('chat_sessions').findOneAndUpdate(
      { sessionId },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    return result;
  } catch (err) {
    console.error('[MongoDB] saveChatSession error:', err.message);
    return null;
  }
}

async function getChatSessions(userEmail) {
  try {
    const database = await connectMongo();
    if (!database) return [];
    const query = userEmail ? { userEmail } : {};
    return await database.collection('chat_sessions').find(query).sort({ updatedAt: -1 }).toArray();
  } catch (err) {
    console.error('[MongoDB] getChatSessions error:', err.message);
    return [];
  }
}

// Orders Operations
async function saveOrder(order) {
  if (!order || (!order.orderId && !order.razorpay_order_id && !order.id)) return null;
  try {
    const database = await connectMongo();
    if (!database) return null;

    const orderId = order.orderId || order.razorpay_order_id || order.id;
    const doc = {
      orderId,
      merchantId: order.merchantId || order.merchant_id || '',
      merchantName: order.merchantName || order.merchant_name || 'Merchant',
      productId: order.productId || order.product_id || '',
      productName: order.productName || order.product_name || '',
      amountInr: order.amountInr || order.amount_inr || 0,
      amountDisplay: order.amountDisplay || (order.amountInr ? `₹${order.amountInr}` : ''),
      currency: order.currency || 'INR',
      status: order.status || 'CREATED',
      customer: order.customer || {
        name: order.customer_name || '',
        email: order.customer_email || '',
        phone: order.customer_phone || '',
      },
      shippingAddress: order.shippingAddress || order.shipping_address || {
        street: order.shipping_street || '',
        city: order.shipping_city || '',
        state: order.shipping_state || '',
        postal_code: order.shipping_postal_code || '',
        country: order.shipping_country || 'India',
      },
      razorpayOrderId: order.razorpayOrderId || order.razorpay_order_id || orderId,
      razorpayPaymentId: order.razorpayPaymentId || order.razorpay_payment_id || null,
      receipt: order.receipt || '',
      gateTier: order.gateTier || order.gate_tier || 'AUTO',
      updatedAt: new Date(),
    };

    const result = await database.collection('orders').findOneAndUpdate(
      { orderId },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
    return result;
  } catch (err) {
    console.error('[MongoDB] saveOrder error:', err.message);
    return null;
  }
}

async function getOrders(userEmail) {
  try {
    const database = await connectMongo();
    if (!database) return [];
    const query = userEmail ? { 'customer.email': userEmail } : {};
    return await database.collection('orders').find(query).sort({ createdAt: -1 }).toArray();
  } catch (err) {
    console.error('[MongoDB] getOrders error:', err.message);
    return [];
  }
}

// Payment Records
async function savePayment(payment) {
  if (!payment || !payment.paymentId) return null;
  try {
    const database = await connectMongo();
    if (!database) return null;

    const doc = {
      paymentId: payment.paymentId,
      orderId: payment.orderId || '',
      sessionId: payment.sessionId || '',
      amountInr: payment.amountInr || 0,
      status: payment.status || 'captured',
      verified: payment.verified !== false,
      createdAt: new Date(),
    };

    return await database.collection('payments').insertOne(doc);
  } catch (err) {
    console.error('[MongoDB] savePayment error:', err.message);
    return null;
  }
}

// Mandate Operations
async function saveMandate(mandate) {
  if (!mandate || (!mandate.mandate_token && !mandate.mandateToken)) return null;
  try {
    const database = await connectMongo();
    if (!database) return null;

    const token = mandate.mandate_token || mandate.mandateToken;
    const doc = {
      mandateToken: token,
      userEmail: mandate.userEmail || mandate.user_email || '',
      maxLimitInr: mandate.max_limit_inr || mandate.maxLimitInr || 1500,
      status: mandate.status || 'ACTIVE',
      authPaymentId: mandate.auth_payment_id || mandate.authPaymentId || '',
      authOrderId: mandate.auth_order_id || mandate.authOrderId || '',
      protocol: mandate.protocol || 'NPCI_UPI_2.0_DELEGATED',
      expiresAt: mandate.expires_at || mandate.expiresAt ? new Date(mandate.expires_at || mandate.expiresAt) : new Date(Date.now() + 30 * 86400 * 1000),
      updatedAt: new Date(),
    };

    return await database.collection('mandates').findOneAndUpdate(
      { mandateToken: token },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true, returnDocument: 'after' }
    );
  } catch (err) {
    console.error('[MongoDB] saveMandate error:', err.message);
    return null;
  }
}

async function getActiveMandate(userEmail) {
  try {
    const database = await connectMongo();
    if (!database) return null;
    const query = userEmail ? { userEmail, status: 'ACTIVE' } : { status: 'ACTIVE' };
    return await database.collection('mandates').findOne(query, { sort: { createdAt: -1 } });
  } catch (err) {
    console.error('[MongoDB] getActiveMandate error:', err.message);
    return null;
  }
}

module.exports = {
  connectMongo,
  saveUserProfile,
  getUserProfile,
  saveChatSession,
  getChatSessions,
  saveOrder,
  getOrders,
  savePayment,
  saveMandate,
  getActiveMandate,
};
