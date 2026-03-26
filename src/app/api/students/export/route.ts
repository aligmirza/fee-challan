import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');
    const format = searchParams.get('format') || 'csv';

    let query = `
      SELECT s.id, s.name, s.father_name, s.mother_name, s.dob, s.gender, s.cnic_bform,
        c.name as class_name, sec.name as section_name, s.roll_no, s.family_id,
        s.status, s.enrollment_date, s.contact_phone, s.address,
        cam.name as campus_name, f.guardian_name, f.family_name
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

    query += ' ORDER BY cam.name, c.display_order, s.name';

    const students = db.prepare(query).all(...params) as Record<string, unknown>[];

    if (format === 'json') {
      return NextResponse.json(students);
    }

    // CSV format
    const headers = ['ID', 'Name', 'Father Name', 'Mother Name', 'DOB', 'Gender', 'CNIC/B-Form',
      'Class', 'Section', 'Roll No', 'Guardian Contact', 'Status', 'Enrollment Date',
      'Contact Phone', 'Address', 'Campus', 'Guardian Name', 'Family Name'];

    const csvRows = [headers.join(',')];
    for (const s of students) {
      const row = [
        s.id, escapeCsv(s.name), escapeCsv(s.father_name), escapeCsv(s.mother_name),
        s.dob || '', s.gender || '', s.cnic_bform || '',
        escapeCsv(s.class_name), escapeCsv(s.section_name), s.roll_no || '',
        s.family_id || '', s.status || '', s.enrollment_date || '',
        s.contact_phone || '', escapeCsv(s.address), escapeCsv(s.campus_name),
        escapeCsv(s.guardian_name), escapeCsv(s.family_name),
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="students_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to export students', details: String(error) }, { status: 500 });
  }
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
