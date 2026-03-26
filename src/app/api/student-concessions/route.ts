import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    const concessions = db.prepare(`
      SELECT sc.*,
        ct.name as template_name,
        fh.name as fee_head_name
      FROM student_concessions sc
      LEFT JOIN concession_templates ct ON sc.template_id = ct.id
      LEFT JOIN fee_heads fh ON sc.fee_head_id = fh.id
      WHERE sc.student_id = ?
      ORDER BY sc.created_at DESC
    `).all(Number(student_id));

    return NextResponse.json(concessions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch student concessions', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      student_id, template_id, type, value, fee_head_id,
      reason, is_permanent, start_date, end_date, approved_by
    } = body;

    if (!student_id || !type || value === undefined) {
      return NextResponse.json({ error: 'student_id, type, and value are required' }, { status: 400 });
    }

    const result = db.prepare(
      `INSERT INTO student_concessions (student_id, template_id, type, value, fee_head_id, reason, is_permanent, start_date, end_date, approved_by, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
    ).run(
      student_id, template_id || null, type, value, fee_head_id || null,
      reason || null, is_permanent !== undefined ? is_permanent : 1,
      start_date || null, end_date || null, approved_by || null
    );

    const concession = db.prepare(`
      SELECT sc.*, ct.name as template_name, fh.name as fee_head_name
      FROM student_concessions sc
      LEFT JOIN concession_templates ct ON sc.template_id = ct.id
      LEFT JOIN fee_heads fh ON sc.fee_head_id = fh.id
      WHERE sc.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json(concession, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create student concession', details: String(error) },
      { status: 500 }
    );
  }
}
