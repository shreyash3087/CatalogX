import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'catalogx_db';

let client: MongoClient | null = null;
let db: Db | null = null;
let isInitialized = false;

export async function getCatalogXDb(): Promise<Db> {
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
      await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
      await db.collection('chat_sessions').createIndex({ sessionId: 1 }, { unique: true });
      await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
      await db.collection('mandates').createIndex({ email: 1 }, { unique: true, sparse: true });
      isInitialized = true;
    } catch (e) {
      console.warn('[CatalogX DB] Index notice:', (e as Error).message);
    }
  }

  return db;
}
