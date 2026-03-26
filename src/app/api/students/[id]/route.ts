import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const student = db.prepare(`
      SELECT s.*,
        c.name as class_name,
        sec.name as section_name,
        cam.name as campus_name,
        f.family_name,
        f.guardian_name,
        f.contact_phone as guardian_phone
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN campuses cam ON s.campus_id = cam.id
      LEFT JOIN families f ON s.family_id = f.contact_phone
      WHERE s.id = ?
    `).get(Number(id));

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get siblings if family_id (guardian contact) exists
    const studentObj = student as Record<string, unknown>;
    if (studentObj.family_id) {
      const siblings = db.prepare(`
        SELECT s.id, s.name, s.class_id, c.name as class_name, sec.name as section_name, s.roll_no, s.status
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        WHERE s.family_id = ? AND s.id != ?
        ORDER BY c.display_order, s.name
      `).all(studentObj.family_id, Number(id));
      studentObj.siblings = siblings;
      studentObj.sibling_count = (siblings as unknown[]).length;
    }

    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch student', details: String(error) },
      { status: 500 }
    );
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

    const existing = db.prepare('SELECT id FROM students WHERE id = ?').get(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // If family_id (guardian contact) is being set/changed, ensure family record exists
    if (body.family_id && body.family_id.trim()) {
      const existingFamily = db.prepare('SELECT id FROM families WHERE contact_phone = ?').get(body.family_id.trim());
      if (!existingFamily) {
        db.prepare(
          'INSERT INTO families (family_name, guardian_name, contact_phone, address) VALUES (?, ?, ?, ?)'
        ).run(
          body.family_name || `${body.father_name || 'Unknown'}'s Family`,
          body.guardian_name || body.father_name || null,
          body.family_id.trim(),
          body.family_address || body.address || null
        );
      }
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    const updatable = [
      'name', 'father_name', 'mother_name', 'dob', 'gender', 'cnic_bform',
      'class_id', 'section_id', 'roll_no', 'family_id', 'status',
      'enrollment_date', 'withdrawal_date', 'photo_path', 'contact_phone', 'address', 'campus_id'
    ];

    for (const field of updatable) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(field === 'family_id' && body[field] ? body[field].trim() : body[field]);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push("updated_at = datetime('now')");
    values.push(Number(id));

    db.prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(Number(id));
    return NextResponse.json(student);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update student', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM students WHERE id = ?').get(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Soft delete
    db.prepare("UPDATE students SET status = 'withdrawn', withdrawal_date = datetime('now'), updated_at = datetime('now') WHERE id = ?")
      .run(Number(id));

    return NextResponse.json({ message: 'Student soft-deleted (withdrawn)' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete student', details: String(error) },
      { status: 500 }
    );
  }
}
