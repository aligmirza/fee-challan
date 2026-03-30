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
    const { name, display_order, academic_year, is_active } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    db.prepare(
      'UPDATE classes SET name = ?, display_order = ?, academic_year = ?, is_active = ? WHERE id = ?'
    ).run(name, display_order ?? 0, academic_year ?? null, is_active ?? 1, Number(id));

    const cls = db.prepare('SELECT * FROM classes WHERE id = ?').get(Number(id));
    return NextResponse.json(cls);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update class', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const studentCount = db.prepare(
      'SELECT COUNT(*) as count FROM students WHERE class_id = ?'
    ).get(Number(id)) as { count: number };

    if (studentCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${studentCount.count} student(s) assigned to this class` },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM sections WHERE class_id = ?').run(Number(id));
    db.prepare('DELETE FROM classes WHERE id = ?').run(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete class', details: String(error) }, { status: 500 });
  }
}
