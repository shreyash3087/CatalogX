import { MongoClient, Db } from 'mongodb';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'catalogx_db';

let client: MongoClient | null = null;
let db: Db | null = null;
let isInitialized = false;

export async function getCatalogXDb(): Promise<Db | null> {
  if (db) return db;

  try {
    if (!client) {
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
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
  } catch (err) {
    client = null;
    db = null;
    return null;
  }
}
