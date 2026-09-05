import { NextRequest, NextResponse } from 'next/server';
import { getCatalogXDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

function getUserCachePath(email: string) {
  const rootDir = path.resolve(process.cwd(), '..');
  const dir = path.join(rootDir, 'buyer-agent', 'logs', 'users');
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  const safeEmail = email.toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
  return path.join(dir, `${safeEmail}.json`);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email query param' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase();

    // 1. Try MongoDB Atlas
    try {
      const db = await getCatalogXDb();
      if (db) {
        const user = await db.collection('users').findOne({ email: cleanEmail });
        if (user) {
          return NextResponse.json({ found: true, profile: user });
        }
      }
    } catch {}

    // 2. Fallback to persistent local storage
    const cacheFile = getUserCachePath(cleanEmail);
    if (fs.existsSync(cacheFile)) {
      try {
        const raw = fs.readFileSync(cacheFile, 'utf8');
        const user = JSON.parse(raw);
        if (user && user.email) {
          return NextResponse.json({ found: true, profile: user });
        }
      } catch {}
    }

    return NextResponse.json({ found: false, profile: null });
  } catch (err) {
    return NextResponse.json({ found: false, profile: null, error: (err as Error).message }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body?.email;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase();
    const updateDoc: any = {
      email: cleanEmail,
      name: body.name || '',
      avatar: body.avatar || '',
      phone: body.phone || '',
      street: body.street || body.delivery_address?.street || '',
      city: body.city || body.delivery_address?.city || '',
      state: body.state || body.delivery_address?.state || '',
      postalCode: body.postalCode || body.delivery_address?.postal_code || body.delivery_address?.postalCode || '',
      country: body.country || body.delivery_address?.country || 'India',
      delivery_address: {
        street: body.street || body.delivery_address?.street || '',
        city: body.city || body.delivery_address?.city || '',
        state: body.state || body.delivery_address?.state || '',
        postal_code: body.postalCode || body.delivery_address?.postal_code || body.delivery_address?.postalCode || '',
        country: body.country || body.delivery_address?.country || 'India',
      },
      updatedAt: new Date(),
    };

    // 1. Save to local disk immediately
    try {
      const cacheFile = getUserCachePath(cleanEmail);
      fs.writeFileSync(cacheFile, JSON.stringify(updateDoc, null, 2), 'utf8');
    } catch {}

    // 2. Save to MongoDB Atlas
    try {
      const db = await getCatalogXDb();
      if (db) {
        await db.collection('users').findOneAndUpdate(
          { email: cleanEmail },
          { $set: updateDoc, $setOnInsert: { createdAt: new Date() } },
          { upsert: true }
        );
      }
    } catch (dbErr) {
      console.warn('[Users Profile DB] Atlas write notice:', (dbErr as Error).message);
    }

    return NextResponse.json({ success: true, profile: updateDoc });
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 200 });
  }
}
