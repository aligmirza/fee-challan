import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const campuses = db.prepare('SELECT * FROM campuses ORDER BY name').all();
    return NextResponse.json(campuses);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch campuses', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, code, address, contact_phone, email, website, logo_path, secondary_logo_path, tagline } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    const result = db.prepare(
      `INSERT INTO campuses (name, code, address, contact_phone, email, website, logo_path, secondary_logo_path, tagline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(name, code, address || null, contact_phone || null, email || null, website || null, logo_path || null, secondary_logo_path || null, tagline || null);

    const campus = db.prepare('SELECT * FROM campuses WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(campus, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create campus', details: String(error) },
      { status: 500 }
    );
  }
}
