'use strict';

/**
 * CatalogX — Multi-Tenant MongoDB Session & Event Store
 * ========================================================
 * Provides persistent, user-isolated chat session history, message turns,
 * and structured audit trail storage in MongoDB Atlas (`catalogx_db.chat_sessions`).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { MongoClient } = require('mongodb');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://shreyash3087_db_user:NOMnwQ33KaQriDfx@cluster0.u43ndu4.mongodb.net/?appName=Cluster0';
const DB_NAME = process.env.MONGODB_DB_NAME || 'catalogx_db';

let client = null;
let db = null;

async function getMongoDb() {
  if (db) return db;
  if (!client) {
    try {
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
    } catch (err) {
      client = null;
      db = null;
      throw err;
    }
  }
  db = client.db(DB_NAME);
  return db;
}

/**
 * Load complete session history for a user and session ID from MongoDB Atlas.
 * @param {string} userId - e.g. "user_shreyash_001" or user email
 * @param {string} sessionId - e.g. "sess_xxx"
 * @returns {Promise<{ messages: Array, events: Array, session: object | null }>}
 */
async function loadSession(userId, sessionId) {
  try {
    const database = await getMongoDb();
    const session = await database.collection('chat_sessions').findOne({
      sessionId,
      ...(userId ? { userId } : {}),
    });

    if (session) {
      return {
        messages: Array.isArray(session.messages) ? session.messages : [],
        events: Array.isArray(session.events) ? session.events : [],
        session,
      };
    }
  } catch (err) {
    console.warn('[SessionStore] loadSession notice:', err.message);
  }

  return { messages: [], events: [], session: null };
}

/**
 * Append a conversational message turn to the session document in MongoDB Atlas.
 * Includes deduplication to prevent double-logging human prompts.
 * @param {string} userId
 * @param {string} sessionId
 * @param {{ id?: string, role?: string, sender?: 'human' | 'agent', text: string, data?: object }} message
 */
async function appendMessage(userId, sessionId, message) {
  try {
    const database = await getMongoDb();
    const sender = message.sender || (message.role === 'assistant' ? 'agent' : 'human');
    const role = message.role || (sender === 'human' ? 'user' : 'assistant');

    // Deduplicate: If this is a human/user message and the last message in DB is already the exact same human message, skip inserting duplicate
    const existing = await database.collection('chat_sessions').findOne({ sessionId });
    if (existing && Array.isArray(existing.messages) && existing.messages.length > 0) {
      const lastMsg = existing.messages[existing.messages.length - 1];
      const isHumanSender = sender === 'human' || role === 'user';
      const lastIsHuman = lastMsg.sender === 'human' || lastMsg.role === 'user';
      const isSameText = (lastMsg.text || '').trim().toLowerCase() === (message.text || '').trim().toLowerCase();

      if (isHumanSender && lastIsHuman && isSameText) {
        return; // Skip duplicate message
      }
    }

    const msgObj = {
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sender,
      role,
      text: message.text,
      data: message.data || null,
      timestamp: new Date(),
    };

    await database.collection('chat_sessions').updateOne(
      { sessionId },
      {
        $push: { messages: msgObj },
        $setOnInsert: {
          sessionId,
          userId: userId || 'user_shreyash_001',
          createdAt: new Date(),
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.warn('[SessionStore] appendMessage notice:', err.message);
  }
}

/**
 * Update the session product state (active candidate, last order) in MongoDB Atlas.
 * @param {string} sessionId
 * @param {{ selectedProduct?: object, lastOrder?: object, isPaid?: boolean }} state
 */
async function updateSessionProductState(sessionId, state = {}) {
  try {
    const database = await getMongoDb();
    const updateFields = { updatedAt: new Date() };

    if (state.selectedProduct !== undefined) updateFields.selectedProduct = state.selectedProduct;
    if (state.candidateProducts !== undefined) updateFields.candidateProducts = state.candidateProducts;
    if (state.activeMerchantUrl !== undefined) updateFields.activeMerchantUrl = state.activeMerchantUrl;
    if (state.lastOrder !== undefined) updateFields.lastOrder = state.lastOrder;
    if (state.isPaid !== undefined) updateFields.isPaid = Boolean(state.isPaid);

    await database.collection('chat_sessions').updateOne(
      { sessionId },
      { $set: updateFields }
    );
  } catch (err) {
    console.warn('[SessionStore] updateSessionProductState notice:', err.message);
  }
}

/**
 * Append a structured audit event to the session document in MongoDB Atlas.
 * @param {string} userId
 * @param {string} sessionId
 * @param {{ action: string, input_data: any, output_data: any, reasoning?: string, agentId?: string }} event
 */
async function appendEvent(userId, sessionId, event) {
  try {
    const database = await getMongoDb();
    const eventObj = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      action: event.action,
      input_data: event.input_data || null,
      output_data: event.output_data || null,
      reasoning: event.reasoning || '',
      agentId: event.agentId || 'agent_catalogx_buyer',
      timestamp: new Date(),
    };

    await database.collection('chat_sessions').updateOne(
      { sessionId },
      {
        $push: { events: eventObj },
        $setOnInsert: {
          sessionId,
          userId: userId || 'user_shreyash_001',
          createdAt: new Date(),
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Sync to catalogx_db.orders
    if (event.action === 'ORDER_CREATED' && event.output_data) {
      const out = event.output_data;
      const inp = event.input_data || {};
      const orderId = out.razorpay_order_id;
      if (orderId) {
        const orderDoc = {
          orderId,
          razorpayOrderId: orderId,
          productId: out.product_id || inp.product_id,
          productName: out.product_name,
          brand: out.brand,
          merchantUrl: out.merchant_url,
          amountPaise: out.amount?.paise || (out.amount_inr ? out.amount_inr * 100 : 0),
          amountInr: out.amount_inr || (out.amount?.inr ? parseFloat(out.amount.inr) : 0),
          amountDisplay: out.amount?.display || `₹${out.amount_inr || (out.amount?.paise ? out.amount.paise / 100 : 0)}`,
          status: 'CREATED',
          gateTier: out.gate_tier,
          customer: inp.customer || { name: 'Shreyash', email: 'shreyash3087@gmail.com' },
          shippingAddress: inp.shipping_address || {},
          sessionId,
          userId: userId || 'user_shreyash_001',
          updatedAt: new Date(),
        };
        await database.collection('orders').findOneAndUpdate(
          { orderId },
          { $set: orderDoc, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        );
      }
    } else if ((event.action === 'PAYMENT_VERIFIED' || event.action === 'PAYMENT_CAPTURED') && event.output_data) {
      const out = event.output_data;
      const orderId = out.razorpay_order_id;
      const paymentId = out.razorpay_payment_id;
      if (orderId) {
        await database.collection('orders').updateOne(
          { orderId },
          { $set: { status: 'PAID', razorpayPaymentId: paymentId, updatedAt: new Date() } }
        );

        // Also sync to merchant databases
        try {
          if (client) {
            await client.db('techcart_db').collection('orders').updateMany(
              { $or: [{ orderId }, { razorpayOrderId: orderId }] },
              { $set: { status: 'PAID', razorpayPaymentId: paymentId, updatedAt: new Date() } }
            );
            await client.db('urbanstride_db').collection('orders').updateMany(
              { $or: [{ orderId }, { razorpayOrderId: orderId }] },
              { $set: { status: 'PAID', razorpayPaymentId: paymentId, updatedAt: new Date() } }
            );
          }
        } catch (dbErr) {
          console.warn('[SessionStore] Merchant DB payment sync notice:', dbErr.message);
        }
      }
    }
  } catch (err) {
    console.warn('[SessionStore] appendEvent notice:', err.message);
  }
}

/**
 * Fetch all events for a session from MongoDB Atlas.
 * @param {string} userId
 * @param {string} sessionId
 * @returns {Promise<Array>}
 */
async function getSessionEvents(userId, sessionId) {
  try {
    const database = await getMongoDb();
    const session = await database.collection('chat_sessions').findOne({
      sessionId,
      ...(userId ? { userId } : {}),
    });
    return session?.events || [];
  } catch (err) {
    console.warn('[SessionStore] getSessionEvents notice:', err.message);
    return [];
  }
}

async function deleteSession(sessionId) {
  try {
    const database = await getMongoDb();
    await database.collection('chat_sessions').deleteMany({ sessionId });
  } catch (err) {
    console.warn('[SessionStore] deleteSession notice:', err.message);
  }
}

module.exports = {
  getMongoDb,
  loadSession,
  appendMessage,
  updateSessionProductState,
  appendEvent,
  getSessionEvents,
  deleteSession,
};
