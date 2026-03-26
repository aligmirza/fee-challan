import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    // Support lookup by ID or by contact_phone
    const isNumeric = /^\d+$/.test(id) && id.length < 6;
    const family = isNumeric
      ? db.prepare('SELECT * FROM families WHERE id = ?').get(Number(id))
      : db.prepare('SELECT * FROM families WHERE contact_phone = ?').get(id);

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const familyObj = family as Record<string, unknown>;

    const siblings = db.prepare(`
      SELECT s.*,
        c.name as class_name,
        sec.name as section_name,
        cam.name as campus_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN campuses cam ON s.campus_id = cam.id
      WHERE s.family_id = ?
      ORDER BY c.display_order, s.name
    `).all(familyObj.contact_phone);

    // Enrich each sibling with fee breakdown
    const members = (siblings as Record<string, unknown>[]).map(s => {
      const fees: { fee_head_name: string; amount: number }[] = [];
      let subtotal = 0;

      if (s.class_id && s.campus_id) {
        const feeStructures = db.prepare(`
          SELECT fs.amount, fh.name as fee_head_name
          FROM fee_structures fs
          LEFT JOIN fee_heads fh ON fs.fee_head_id = fh.id
          WHERE fs.campus_id = ? AND fs.class_id = ?
            AND (fs.effective_to IS NULL OR fs.effective_to >= date('now'))
            AND fh.is_active = 1
          ORDER BY fh.name
        `).all(s.campus_id, s.class_id) as { amount: number; fee_head_name: string }[];

        for (const fs of feeStructures) {
          fees.push({ fee_head_name: fs.fee_head_name, amount: fs.amount });
          subtotal += fs.amount;
        }
      }

      return { ...s, fees, subtotal };
    });

    return NextResponse.json({ ...familyObj, siblings, members });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch family', details: String(error) },
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

    const existing = db.prepare('SELECT * FROM families WHERE id = ?').get(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const { family_name, guardian_name, address, voucher_preference } = body;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (family_name !== undefined) { fields.push('family_name = ?'); values.push(family_name); }
    if (guardian_name !== undefined) { fields.push('guardian_name = ?'); values.push(guardian_name); }
    if (address !== undefined) { fields.push('address = ?'); values.push(address); }
    if (voucher_preference !== undefined) { fields.push('voucher_preference = ?'); values.push(voucher_preference); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    fields.push("updated_at = datetime('now')");
    values.push(Number(id));

    db.prepare(`UPDATE families SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const familyUpdated = db.prepare('SELECT * FROM families WHERE id = ?').get(Number(id));
    return NextResponse.json(familyUpdated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update family', details: String(error) },
      { status: 500 }
    );
  }
}
