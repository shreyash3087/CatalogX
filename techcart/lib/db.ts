import { MongoClient, Db } from 'mongodb';
import { ELECTRONICS_PRODUCTS, Product } from './products';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'techcart_db';

let client: MongoClient | null = null;
let db: Db | null = null;
let isInitialized = false;

export async function getTechCartDb(): Promise<Db> {
  if (db) return db;

  if (!client) {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
  }

  db = client.db(DB_NAME);

  if (!isInitialized) {
    try {
      await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
      await db.collection('orders').createIndex({ createdAt: -1 });
      await db.collection('analytics').createIndex({ key: 1 }, { unique: true });
      await db.collection('inventory').createIndex({ id: 1 }, { unique: true });

      // Seed initial inventory if empty
      const count = await db.collection('inventory').countDocuments();
      if (count === 0) {
        await db.collection('inventory').insertMany(
          ELECTRONICS_PRODUCTS.map((p) => ({
            ...p,
            updatedAt: new Date(),
          }))
        );
      }

      // Initialize analytics counters if missing
      await db.collection('analytics').updateOne(
        { key: 'agent_metrics' },
        {
          $setOnInsert: {
            catalog_discoveries: 0,
            search_queries: 0,
            orders_created: 0,
            orders_paid: 0,
            revenue_paise: 0,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      isInitialized = true;
    } catch (e) {
      console.warn('[TechCart DB] Index/Init notice:', (e as Error).message);
    }
  }

  return db;
}

// ─── Analytics Tracking ─────────────────────────────────────────────────────
export async function trackTechCartDiscovery(): Promise<void> {
  try {
    const database = await getTechCartDb();
    await database.collection('analytics').updateOne(
      { key: 'agent_metrics' },
      { $inc: { catalog_discoveries: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[TechCart] trackTechCartDiscovery err:', err);
  }
}

export async function trackTechCartSearch(): Promise<void> {
  try {
    const database = await getTechCartDb();
    await database.collection('analytics').updateOne(
      { key: 'agent_metrics' },
      { $inc: { search_queries: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[TechCart] trackTechCartSearch err:', err);
  }
}

// ─── Orders Management ──────────────────────────────────────────────────────
export interface TechCartOrder {
  orderId: string;
  razorpayOrderId: string;
  productId: string;
  productName: string;
  brand: string;
  size: string;
  color?: string;
  quantity: number;
  amountPaise: number;
  amountInr: number;
  status: 'CREATED' | 'PAID' | 'FAILED' | 'CANCELLED';
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  buyerAgentId?: string;
  sessionId?: string;
  razorpayPaymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function saveTechCartOrder(order: Partial<TechCartOrder>): Promise<void> {
  try {
    const database = await getTechCartDb();
    const doc = {
      ...order,
      updatedAt: new Date(),
    };
    await database.collection('orders').findOneAndUpdate(
      { orderId: order.orderId },
      { $set: doc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    // Update analytics
    if (order.status === 'CREATED') {
      await database.collection('analytics').updateOne(
        { key: 'agent_metrics' },
        { $inc: { orders_created: 1 }, $set: { updatedAt: new Date() } },
        { upsert: true }
      );
    } else if (order.status === 'PAID') {
      await database.collection('analytics').updateOne(
        { key: 'agent_metrics' },
        {
          $inc: {
            orders_paid: 1,
            revenue_paise: order.amountPaise || 0,
          },
          $set: { updatedAt: new Date() },
        },
        { upsert: true }
      );
    }
  } catch (err) {
    console.error('[TechCart DB] saveTechCartOrder err:', err);
  }
}

export async function getTechCartOrders(limit = 100): Promise<TechCartOrder[]> {
  try {
    const database = await getTechCartDb();
    const docs = await database
      .collection('orders')
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    return docs as unknown as TechCartOrder[];
  } catch (err) {
    console.error('[TechCart DB] getTechCartOrders err:', err);
    return [];
  }
}

export async function getTechCartAnalytics() {
  try {
    const database = await getTechCartDb();
    const metrics = await database.collection('analytics').findOne({ key: 'agent_metrics' });
    const ordersCount = await database.collection('orders').countDocuments();
    const paidCount = await database.collection('orders').countDocuments({ status: 'PAID' });
    const totalRevenueDocs = await database
      .collection('orders')
      .aggregate([
        { $match: { status: 'PAID' } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ])
      .toArray();

    const totalRevenuePaise = totalRevenueDocs[0]?.total || 0;

    return {
      catalog_discoveries: metrics?.catalog_discoveries || 0,
      search_queries: metrics?.search_queries || 0,
      orders_created: ordersCount,
      orders_paid: paidCount,
      revenue_inr: (totalRevenuePaise / 100).toFixed(2),
      revenue_paise: totalRevenuePaise,
    };
  } catch (err) {
    console.error('[TechCart DB] getTechCartAnalytics err:', err);
    return {
      catalog_discoveries: 0,
      search_queries: 0,
      orders_created: 0,
      orders_paid: 0,
      revenue_inr: '0.00',
      revenue_paise: 0,
    };
  }
}

// ─── Products & Stock ───────────────────────────────────────────────────────
export async function getTechCartProducts(): Promise<Product[]> {
  try {
    const database = await getTechCartDb();
    const prods = await database.collection('inventory').find({}).toArray();
    if (prods.length > 0) return prods as unknown as Product[];
  } catch (e) {}
  return ELECTRONICS_PRODUCTS;
}

export async function updateTechCartStock(productId: string, newStock: number): Promise<boolean> {
  try {
    const database = await getTechCartDb();
    await database.collection('inventory').updateOne(
      { id: productId },
      { $set: { stock: Math.max(0, newStock), updatedAt: new Date() } }
    );
    return true;
  } catch (err) {
    console.error('[TechCart DB] updateTechCartStock err:', err);
    return false;
  }
}
