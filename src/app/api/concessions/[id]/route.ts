import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const concession = db.prepare('SELECT * FROM concession_templates WHERE id = ?').get(Number(id));
    if (!concession) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(concession);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch', details: String(error) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await request.json();

    const fields: string[] = [];
    const values: unknown[] = [];
    for (const key of ['name', 'type', 'value', 'applicable_fee_heads', 'eligibility', 'is_active', 'campus_id']) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    values.push(Number(id));
    db.prepare(`UPDATE concession_templates SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM concession_templates WHERE id = ?').get(Number(id));
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Check if in use by student_concessions
    const inUse = db.prepare('SELECT COUNT(*) as cnt FROM student_concessions WHERE template_id = ?').get(Number(id)) as { cnt: number };
    if (inUse.cnt > 0) {
      db.prepare('UPDATE concession_templates SET is_active = 0 WHERE id = ?').run(Number(id));
      return NextResponse.json({ message: 'Deactivated (in use by students)' });
    }

    db.prepare('DELETE FROM concession_templates WHERE id = ?').run(Number(id));
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete', details: String(error) }, { status: 500 });
  }
}
