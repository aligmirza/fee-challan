import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');

    let query = 'SELECT * FROM fee_heads WHERE 1=1';
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND (campus_id = ? OR campus_id IS NULL)';
      params.push(Number(campus_id));
    }

    query += ' ORDER BY name';

    const feeHeads = db.prepare(query).all(...params);
    return NextResponse.json(feeHeads);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch fee heads', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO fee_heads (campus_id, name, description) VALUES (?, ?, ?)'
    ).run(campus_id || null, name, description || null);

    const feeHead = db.prepare('SELECT * FROM fee_heads WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(feeHead, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create fee head', details: String(error) },
      { status: 500 }
    );
  }
}
