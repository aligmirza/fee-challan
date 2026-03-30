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
    const { name, class_teacher } = body;

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    db.prepare('UPDATE sections SET name = ?, class_teacher = ? WHERE id = ?')
      .run(name, class_teacher ?? null, Number(id));

    const section = db.prepare('SELECT * FROM sections WHERE id = ?').get(Number(id));
    return NextResponse.json(section);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update section', details: String(error) }, { status: 500 });
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
      'SELECT COUNT(*) as count FROM students WHERE section_id = ?'
    ).get(Number(id)) as { count: number };

    if (studentCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${studentCount.count} student(s) assigned to this section` },
        { status: 400 }
      );
    }

    db.prepare('DELETE FROM sections WHERE id = ?').run(Number(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete section', details: String(error) }, { status: 500 });
  }
}
