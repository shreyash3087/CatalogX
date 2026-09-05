import { MongoClient, Db } from 'mongodb';
import dns from 'dns';
import { FOOTWEAR_PRODUCTS, Product } from './products';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const ATLAS_FALLBACK_URI = 'mongodb+srv://shreyash3087_db_user:NOMnwQ33KaQriDfx@cluster0.u43ndu4.mongodb.net/?appName=Cluster0';
const MONGODB_URI = process.env.MONGODB_URI || ATLAS_FALLBACK_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'urbanstride_db';

let client: MongoClient | null = null;
let db: Db | null = null;
let isInitialized = false;

export let lastDbError: string | null = null;

export async function getUrbanStrideDb(): Promise<Db | null> {
  if (db) return db;

  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 20000,
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
            FOOTWEAR_PRODUCTS.map((p) => ({
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
        console.warn('[UrbanStride DB] Index/Init notice:', (e as Error).message);
      }
    }

    lastDbError = null;
    return db;
  } catch (err) {
    lastDbError = `${(err as Error).message} | ${(err as Error).stack}`;
    console.error('[UrbanStride DB] Connection error:', lastDbError);
    client = null;
    db = null;
    return null;
  }
}

// ─── Analytics Tracking ─────────────────────────────────────────────────────
export async function trackAgentDiscovery(): Promise<void> {
  try {
    const database = await getUrbanStrideDb();
    if (!database) return;
    await database.collection('analytics').updateOne(
      { key: 'agent_metrics' },
      { $inc: { catalog_discoveries: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[UrbanStride] trackAgentDiscovery err:', err);
  }
}

export async function trackAgentSearch(): Promise<void> {
  try {
    const database = await getUrbanStrideDb();
    if (!database) return;
    await database.collection('analytics').updateOne(
      { key: 'agent_metrics' },
      { $inc: { search_queries: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('[UrbanStride] trackAgentSearch err:', err);
  }
}

// ─── Orders Management ──────────────────────────────────────────────────────
export interface UrbanStrideOrder {
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

export async function saveUrbanStrideOrder(order: Partial<UrbanStrideOrder>): Promise<void> {
  try {
    const rawId = order.orderId || order.razorpayOrderId || `order_${Date.now()}`;
    const cleanOrderId = rawId.replace(/^(order_)+/, 'order_');
    const cleanRazorpayOrderId = (order.razorpayOrderId || cleanOrderId).replace(/^(order_)+/, 'order_');

    // Fill product details if missing
    let prodName = order.productName;
    let prodBrand = order.brand;
    if ((!prodName || !prodBrand) && order.productId) {
      const p = FOOTWEAR_PRODUCTS.find((item) => item.id === order.productId);
      if (p) {
        prodName = prodName || p.name;
        prodBrand = prodBrand || p.brand;
      }
    }

    const doc: any = {
      ...order,
      orderId: cleanOrderId,
      razorpayOrderId: cleanRazorpayOrderId,
      productName: prodName || order.productName || 'Footwear',
      brand: prodBrand || order.brand || 'UrbanStride',
      customer: {
        name: order.customer?.name || '',
        email: order.customer?.email || '',
        phone: order.customer?.phone || '',
      },
      shippingAddress: {
        street: order.shippingAddress?.street || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        postal_code: order.shippingAddress?.postal_code || '',
        country: order.shippingAddress?.country || 'India',
      },
      updatedAt: new Date(),
    };

    const { createdAt, _id, ...setFields } = doc;
    const initialCreatedAt = order.createdAt ? new Date(order.createdAt) : new Date();

    // Save exclusively to urbanstride_db.orders in MongoDB Atlas
    const database = await getUrbanStrideDb();
    if (database) {
      await database.collection('orders').findOneAndUpdate(
        { orderId: cleanOrderId },
        {
          $set: { ...setFields, updatedAt: new Date() },
          $setOnInsert: { createdAt: initialCreatedAt },
        },
        { upsert: true }
      );

      // Also sync to catalogx_db.orders in MongoDB Atlas
      try {
        if (client) {
          const catalogxDb = client.db('catalogx_db');
          await catalogxDb.collection('orders').findOneAndUpdate(
            { orderId: cleanOrderId },
            {
              $set: {
                ...setFields,
                merchantId: 'merchant_urbanstride_001',
                merchantName: 'UrbanStride Footwear',
                updatedAt: new Date(),
              },
              $setOnInsert: { createdAt: initialCreatedAt },
            },
            { upsert: true }
          );
        }
      } catch (catErr) {
        console.warn('[UrbanStride DB] CatalogX orders sync notice:', (catErr as Error).message);
      }

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
    }
  } catch (err) {
    console.error('[UrbanStride DB] saveUrbanStrideOrder err:', err);
  }
}

export async function getUrbanStrideOrders(limit = 100): Promise<UrbanStrideOrder[]> {
  try {
    const database = await getUrbanStrideDb();
    if (database) {
      const docs = await database
        .collection('orders')
        .find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return docs as unknown as UrbanStrideOrder[];
    }
  } catch (err) {
    console.error('[UrbanStride DB] getUrbanStrideOrders err:', err);
  }
  return [];
}

export async function getUrbanStrideAnalytics() {
  try {
    const database = await getUrbanStrideDb();
    if (!database) {
      return {
        catalog_discoveries: 0,
        search_queries: 0,
        orders_created: 0,
        orders_paid: 0,
        revenue_inr: '0.00',
        revenue_paise: 0,
      };
    }
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
    console.error('[UrbanStride DB] getUrbanStrideAnalytics err:', err);
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
export async function getUrbanStrideProducts(): Promise<Product[]> {
  try {
    const database = await getUrbanStrideDb();
    if (database) {
      const prods = await database.collection('inventory').find({}).toArray();
      if (prods.length > 0) return prods as unknown as Product[];
    }
  } catch (e) {}
  return FOOTWEAR_PRODUCTS;
}

export async function updateUrbanStrideStock(productId: string, newStock: number): Promise<boolean> {
  try {
    const database = await getUrbanStrideDb();
    if (!database) return false;
    await database.collection('inventory').updateOne(
      { id: productId },
      { $set: { stock: Math.max(0, newStock), updatedAt: new Date() } }
    );
    return true;
  } catch (err) {
    console.error('[UrbanStride DB] updateUrbanStrideStock err:', err);
    return false;
  }
}
