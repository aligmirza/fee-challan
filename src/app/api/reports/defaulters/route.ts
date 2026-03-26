import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campus_id') || '1';
    const classId = searchParams.get('class_id');
    const sectionId = searchParams.get('section_id');

    let query = `
      SELECT DISTINCT s.id, s.name, s.father_name, s.contact_phone, s.roll_no,
             c.name as class_name, sec.name as section_name,
             ch.grand_total as amount_due, ch.month, ch.year, ch.due_date, ch.status
      FROM challans ch
      JOIN students s ON s.id = ch.student_id
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      WHERE ch.campus_id = ? AND ch.status IN ('unpaid', 'overdue')
    `;
    const params: (string | number)[] = [campusId];

    if (classId) { query += ' AND s.class_id = ?'; params.push(classId); }
    if (sectionId) { query += ' AND s.section_id = ?'; params.push(sectionId); }

    query += ' ORDER BY ch.due_date ASC';

    const defaulters = db.prepare(query).all(...params);
    return Response.json(defaulters);
  } catch {
    return Response.json({ error: 'Failed to fetch defaulters' }, { status: 500 });
  }
}
