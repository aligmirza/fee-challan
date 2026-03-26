import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');

    let query = 'SELECT * FROM concession_templates WHERE 1=1';
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND (campus_id = ? OR campus_id IS NULL)';
      params.push(Number(campus_id));
    }

    query += ' ORDER BY name';

    const concessions = db.prepare(query).all(...params);
    return NextResponse.json(concessions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch concession templates', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, name, type, value, applicable_fee_heads, eligibility } = body;

    if (!name || !type || value === undefined) {
      return NextResponse.json({ error: 'name, type, and value are required' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO concession_templates (campus_id, name, type, value, applicable_fee_heads, eligibility) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(campus_id || null, name, type, value, applicable_fee_heads || null, eligibility || null);

    const concession = db.prepare('SELECT * FROM concession_templates WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(concession, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create concession template', details: String(error) },
      { status: 500 }
    );
  }
}
