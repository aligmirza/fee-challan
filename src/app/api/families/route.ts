import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = `
      SELECT f.*,
        (SELECT COUNT(*) FROM students s WHERE s.family_id = f.contact_phone AND s.status = 'active') as member_count
      FROM families f WHERE 1=1
    `;
    const params: string[] = [];

    if (search) {
      query += ' AND (f.family_name LIKE ? OR f.guardian_name LIKE ? OR f.contact_phone LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY f.family_name';

    const families = db.prepare(query).all(...params);
    return NextResponse.json(families);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch families', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { family_name, guardian_name, contact_phone, address, voucher_preference } = body;

    if (!contact_phone) {
      return NextResponse.json({ error: 'Guardian contact number is required' }, { status: 400 });
    }

    // Check if family with this contact already exists
    const existing = db.prepare('SELECT * FROM families WHERE contact_phone = ?').get(contact_phone.trim());
    if (existing) {
      return NextResponse.json({ error: 'A family with this contact number already exists', existing }, { status: 409 });
    }

    const result = db.prepare(
      'INSERT INTO families (family_name, guardian_name, contact_phone, address, voucher_preference) VALUES (?, ?, ?, ?, ?)'
    ).run(family_name || 'Unnamed Family', guardian_name || null, contact_phone.trim(), address || null, voucher_preference || 'individual');

    const family = db.prepare('SELECT * FROM families WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create family', details: String(error) },
      { status: 500 }
    );
  }
}
