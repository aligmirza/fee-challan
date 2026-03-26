import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');
    const class_id = searchParams.get('class_id');

    let query = `
      SELECT fs.*,
        fh.name as fee_head_name,
        c.name as class_name
      FROM fee_structures fs
      LEFT JOIN fee_heads fh ON fs.fee_head_id = fh.id
      LEFT JOIN classes c ON fs.class_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND fs.campus_id = ?';
      params.push(Number(campus_id));
    }
    if (class_id) {
      query += ' AND fs.class_id = ?';
      params.push(Number(class_id));
    }

    query += ' ORDER BY c.display_order, fh.name';

    const structures = db.prepare(query).all(...params);
    return NextResponse.json(structures);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch fee structures', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, class_id, section_id, fee_head_id, amount, frequency, effective_from, effective_to } = body;

    if (!campus_id || !class_id || !fee_head_id || amount === undefined) {
      return NextResponse.json(
        { error: 'campus_id, class_id, fee_head_id, and amount are required' },
        { status: 400 }
      );
    }

    // Check if structure already exists for this combination
    const existing = db.prepare(
      `SELECT id, version FROM fee_structures
       WHERE campus_id = ? AND class_id = ? AND fee_head_id = ?
       AND (section_id IS ? OR (section_id = ?))
       AND (effective_to IS NULL OR effective_to >= date('now'))`
    ).get(campus_id, class_id, fee_head_id, section_id || null, section_id || null) as { id: number; version: number } | undefined;

    if (existing) {
      // Expire old and create new version
      db.prepare("UPDATE fee_structures SET effective_to = date('now') WHERE id = ?").run(existing.id);

      const result = db.prepare(
        `INSERT INTO fee_structures (campus_id, class_id, section_id, fee_head_id, amount, frequency, effective_from, effective_to, version)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        campus_id, class_id, section_id || null, fee_head_id, amount,
        frequency || 'monthly', effective_from || null, effective_to || null,
        existing.version + 1
      );

      const structure = db.prepare('SELECT * FROM fee_structures WHERE id = ?').get(result.lastInsertRowid);
      return NextResponse.json(structure, { status: 200 });
    }

    const result = db.prepare(
      `INSERT INTO fee_structures (campus_id, class_id, section_id, fee_head_id, amount, frequency, effective_from, effective_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      campus_id, class_id, section_id || null, fee_head_id, amount,
      frequency || 'monthly', effective_from || null, effective_to || null
    );

    const structure = db.prepare('SELECT * FROM fee_structures WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(structure, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create/update fee structure', details: String(error) },
      { status: 500 }
    );
  }
}
