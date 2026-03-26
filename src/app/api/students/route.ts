import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');
    const class_id = searchParams.get('class_id');
    const section_id = searchParams.get('section_id');
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query = `
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
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND s.campus_id = ?';
      params.push(Number(campus_id));
    }
    if (class_id) {
      query += ' AND s.class_id = ?';
      params.push(Number(class_id));
    }
    if (section_id) {
      query += ' AND s.section_id = ?';
      params.push(Number(section_id));
    }
    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (s.name LIKE ? OR s.father_name LIKE ? OR s.roll_no LIKE ? OR s.family_id LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY s.name';

    const students = db.prepare(query).all(...params);
    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch students', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      campus_id, name, father_name, mother_name, dob, gender, cnic_bform,
      class_id, section_id, roll_no, family_id, enrollment_date, contact_phone, address,
      guardian_name, family_name, family_address
    } = body;

    if (!campus_id || !name) {
      return NextResponse.json({ error: 'campus_id and name are required' }, { status: 400 });
    }

    // If family_id (guardian contact) provided, auto-create or update family record
    if (family_id && family_id.trim()) {
      const existingFamily = db.prepare('SELECT id FROM families WHERE contact_phone = ?').get(family_id.trim());
      if (!existingFamily) {
        db.prepare(
          'INSERT INTO families (family_name, guardian_name, contact_phone, address) VALUES (?, ?, ?, ?)'
        ).run(
          family_name || `${father_name || name}'s Family`,
          guardian_name || father_name || null,
          family_id.trim(),
          family_address || address || null
        );
      }
    }

    const result = db.prepare(
      `INSERT INTO students (campus_id, name, father_name, mother_name, dob, gender, cnic_bform,
        class_id, section_id, roll_no, family_id, enrollment_date, contact_phone, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
    ).run(
      campus_id, name, father_name || null, mother_name || null, dob || null,
      gender || null, cnic_bform || null, class_id || null, section_id || null,
      roll_no || null, family_id?.trim() || null, enrollment_date || null,
      contact_phone || null, address || null
    );

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create student', details: String(error) },
      { status: 500 }
    );
  }
}
