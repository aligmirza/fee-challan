import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const campus = db.prepare('SELECT * FROM campuses WHERE id = ?').get(Number(id));
    if (!campus) {
      return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
    }

    const campusObj = campus as Record<string, unknown>;

    // Get stats
    const studentCount = db.prepare(
      "SELECT COUNT(*) as cnt FROM students WHERE campus_id = ? AND status = 'active'"
    ).get(Number(id)) as { cnt: number };

    const challanCount = db.prepare(
      'SELECT COUNT(*) as cnt FROM challans WHERE campus_id = ?'
    ).get(Number(id)) as { cnt: number };

    const defaulterCount = db.prepare(
      "SELECT COUNT(*) as cnt FROM challans WHERE campus_id = ? AND status IN ('unpaid', 'overdue') AND due_date < date('now')"
    ).get(Number(id)) as { cnt: number };

    const totalCollected = db.prepare(
      'SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE campus_id = ?'
    ).get(Number(id)) as { total: number };

    // Get classes for this campus
    const classes = db.prepare(
      'SELECT c.*, (SELECT COUNT(*) FROM sections WHERE class_id = c.id) as section_count FROM classes c WHERE c.campus_id = ? ORDER BY c.display_order'
    ).all(Number(id));

    return NextResponse.json({
      ...campusObj,
      student_count: studentCount.cnt,
      challan_count: challanCount.cnt,
      defaulter_count: defaulterCount.cnt,
      total_collected: totalCollected.total,
      classes,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch campus', details: String(error) }, { status: 500 });
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

    const existing = db.prepare('SELECT id FROM campuses WHERE id = ?').get(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
    }

    const updatable = ['name', 'code', 'address', 'contact_phone', 'email', 'website', 'logo_path', 'secondary_logo_path', 'tagline', 'is_active'];
    const fields: string[] = [];
    const values: unknown[] = [];

    for (const field of updatable) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push("updated_at = datetime('now')");
    values.push(Number(id));

    db.prepare(`UPDATE campuses SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const campus = db.prepare('SELECT * FROM campuses WHERE id = ?').get(Number(id));
    return NextResponse.json(campus);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update campus', details: String(error) }, { status: 500 });
  }
}
