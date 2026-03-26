import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
    for (const key of ['type', 'value', 'fee_head_id', 'reason', 'is_permanent', 'start_date', 'end_date', 'approved_by', 'status']) {
      if (body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    if (fields.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    values.push(Number(id));
    db.prepare(`UPDATE student_concessions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const updated = db.prepare('SELECT * FROM student_concessions WHERE id = ?').get(Number(id));
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
    db.prepare('DELETE FROM student_concessions WHERE id = ?').run(Number(id));
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete', details: String(error) }, { status: 500 });
  }
}
