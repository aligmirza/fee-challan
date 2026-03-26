import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ImportRow {
  name: string;
  father_name?: string;
  mother_name?: string;
  dob?: string;
  gender?: string;
  cnic_bform?: string;
  class_name?: string;
  section_name?: string;
  roll_no?: string;
  guardian_contact?: string;
  contact_phone?: string;
  address?: string;
  campus_name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { rows, campus_id } = body as { rows: ImportRow[]; campus_id: number };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
    }

    if (!campus_id) {
      return NextResponse.json({ error: 'campus_id is required' }, { status: 400 });
    }

    // Pre-load classes and sections for this campus
    const classes = db.prepare('SELECT id, name FROM classes WHERE campus_id = ?').all(campus_id) as { id: number; name: string }[];
    const classMap = new Map(classes.map(c => [c.name.toLowerCase().trim(), c.id]));

    const sections = db.prepare(`
      SELECT sec.id, sec.name, sec.class_id FROM sections sec
      INNER JOIN classes c ON sec.class_id = c.id WHERE c.campus_id = ?
    `).all(campus_id) as { id: number; name: string; class_id: number }[];

    const results = { imported: 0, skipped: 0, errors: [] as string[] };

    const importAll = db.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row.name || !row.name.trim()) {
          results.skipped++;
          results.errors.push(`Row ${i + 1}: Missing student name`);
          continue;
        }

        // Resolve class
        let classId: number | null = null;
        if (row.class_name) {
          classId = classMap.get(row.class_name.toLowerCase().trim()) || null;
          if (!classId) {
            results.errors.push(`Row ${i + 1}: Class "${row.class_name}" not found`);
          }
        }

        // Resolve section
        let sectionId: number | null = null;
        if (classId && row.section_name) {
          const sec = sections.find(s => s.class_id === classId && s.name.toLowerCase().trim() === row.section_name!.toLowerCase().trim());
          sectionId = sec?.id || null;
        }

        // Auto-create family if guardian_contact provided
        const familyId = row.guardian_contact?.trim() || null;
        if (familyId) {
          const existingFamily = db.prepare('SELECT id FROM families WHERE contact_phone = ?').get(familyId);
          if (!existingFamily) {
            db.prepare('INSERT INTO families (family_name, guardian_name, contact_phone, address) VALUES (?, ?, ?, ?)')
              .run(`${row.father_name || row.name}'s Family`, row.father_name || null, familyId, row.address || null);
          }
        }

        // Check for duplicate (same name + father + campus)
        const existing = db.prepare(
          'SELECT id FROM students WHERE name = ? AND father_name = ? AND campus_id = ?'
        ).get(row.name.trim(), row.father_name?.trim() || null, campus_id);

        if (existing) {
          results.skipped++;
          results.errors.push(`Row ${i + 1}: "${row.name}" already exists`);
          continue;
        }

        db.prepare(
          `INSERT INTO students (campus_id, name, father_name, mother_name, dob, gender, cnic_bform,
            class_id, section_id, roll_no, family_id, contact_phone, address, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`
        ).run(
          campus_id, row.name.trim(), row.father_name?.trim() || null, row.mother_name?.trim() || null,
          row.dob || null, row.gender || null, row.cnic_bform || null,
          classId, sectionId, row.roll_no?.trim() || null, familyId,
          row.contact_phone?.trim() || null, row.address?.trim() || null
        );

        results.imported++;
      }
    });

    importAll();

    return NextResponse.json({
      message: `Import complete: ${results.imported} imported, ${results.skipped} skipped`,
      ...results,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to import students', details: String(error) }, { status: 500 });
  }
}
