import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const class_id = searchParams.get('class_id');

    let query = `
      SELECT sec.*, c.name as class_name
      FROM sections sec
      LEFT JOIN classes c ON sec.class_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (class_id) {
      query += ' AND sec.class_id = ?';
      params.push(Number(class_id));
    }

    query += ' ORDER BY sec.name';

    const sections = db.prepare(query).all(...params);
    return NextResponse.json(sections);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sections', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { class_id, name, class_teacher } = body;

    if (!class_id || !name) {
      return NextResponse.json({ error: 'class_id and name are required' }, { status: 400 });
    }

    const result = db.prepare(
      'INSERT INTO sections (class_id, name, class_teacher) VALUES (?, ?, ?)'
    ).run(class_id, name, class_teacher || null);

    const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create section', details: String(error) },
      { status: 500 }
    );
  }
}
