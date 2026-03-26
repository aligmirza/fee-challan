import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');

    let query = 'SELECT c.*, cam.name as campus_name FROM classes c LEFT JOIN campuses cam ON c.campus_id = cam.id WHERE 1=1';
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND c.campus_id = ?';
      params.push(Number(campus_id));
    }

    query += ' ORDER BY c.campus_id, c.display_order';

    const classes = db.prepare(query).all(...params);
    return NextResponse.json(classes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch classes', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, name, display_order, academic_year } = body;

    if (!campus_id || !name) {
      return NextResponse.json({ error: 'campus_id and name are required' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO classes (campus_id, name, display_order, academic_year) VALUES (?, ?, ?, ?)'
    ).run(campus_id, name, display_order || 0, academic_year || null);

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(cls, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create class', details: String(error) },
      { status: 500 }
    );
  }
}
