import { NextRequest, NextResponse } from 'next/server';
import { getCatalogXDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Missing email query param' }, { status: 400 });
    }

    const db = await getCatalogXDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ found: false, profile: null });
    }

    return NextResponse.json({ found: true, profile: user });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, avatar, phone, street, city, state, postalCode, country } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const db = await getCatalogXDb();
    const updateDoc: any = {
      email: email.toLowerCase(),
      name: name || '',
      avatar: avatar || '',
      phone: phone || '',
      street: street || '',
      city: city || '',
      state: state || '',
      postalCode: postalCode || '',
      country: country || 'India',
      updatedAt: new Date(),
    };

    await db.collection('users').findOneAndUpdate(
      { email: email.toLowerCase() },
      { $set: updateDoc, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true, profile: updateDoc });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
