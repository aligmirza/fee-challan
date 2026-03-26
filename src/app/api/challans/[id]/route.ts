import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const challan = db.prepare(`
      SELECT ch.*,
        s.name as student_name,
        s.father_name,
        s.roll_no,
        s.contact_phone,
        c.name as class_name,
        sec.name as section_name,
        cam.name as campus_name,
        cam.code as campus_code,
        cam.address as campus_address,
        cam.contact_phone as campus_phone
      FROM challans ch
      LEFT JOIN students s ON ch.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN campuses cam ON ch.campus_id = cam.id
      WHERE ch.id = ?
    `).get(Number(id));

    if (!challan) {
      return NextResponse.json({ error: 'Challan not found' }, { status: 404 });
    }

    const items = db.prepare(`
      SELECT ci.*, fh.name as fee_head_name
      FROM challan_items ci
      LEFT JOIN fee_heads fh ON ci.fee_head_id = fh.id
      WHERE ci.challan_id = ?
    `).all(Number(id));

    // Fetch institute settings (campus-specific first, then global fallback)
    const challanObj = challan as Record<string, unknown>;
    const campusId = challanObj.campus_id;
    const allSettings = db.prepare(
      'SELECT key, value FROM institute_settings WHERE campus_id = ? OR campus_id IS NULL ORDER BY campus_id DESC'
    ).all(campusId) as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    // Global first, then campus-specific overrides
    for (const s of allSettings.reverse()) { settings[s.key] = s.value; }

    // Fetch primary bank account
    const bank = db.prepare(
      'SELECT bank_name, branch_name, account_title, account_number, iban FROM bank_accounts WHERE (campus_id = ? OR campus_id IS NULL) AND is_active = 1 ORDER BY is_primary DESC LIMIT 1'
    ).get(campusId) || null;

    return NextResponse.json({ ...challanObj, items, settings, bank });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch challan', details: String(error) },
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

    const existing = db.prepare('SELECT id FROM challans WHERE id = ?').get(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Challan not found' }, { status: 404 });
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    const updatable = [
      'status', 'due_date', 'total_amount', 'concession_amount',
      'net_amount', 'arrears', 'late_fee', 'grand_total', 'template_id'
    ];

    for (const field of updatable) {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (fields.length > 0) {
      values.push(Number(id));
      db.prepare(`UPDATE challans SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }

    // If items are provided, replace all challan items (for editing fee details)
    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const updateItems = db.transaction(() => {
        db.prepare('DELETE FROM challan_items WHERE challan_id = ?').run(Number(id));
        const insertItem = db.prepare(
          'INSERT INTO challan_items (challan_id, fee_head_id, original_amount, concession_amount, concession_reason, net_amount) VALUES (?, ?, ?, ?, ?, ?)'
        );
        let totalAmount = 0, totalConcession = 0;
        for (const item of body.items) {
          insertItem.run(Number(id), item.fee_head_id, item.original_amount, item.concession_amount, item.concession_reason || null, item.net_amount);
          totalAmount += item.original_amount;
          totalConcession += item.concession_amount;
        }
        const netAmount = totalAmount - totalConcession;
        db.prepare('UPDATE challans SET total_amount = ?, concession_amount = ?, net_amount = ?, grand_total = ? WHERE id = ?')
          .run(totalAmount, totalConcession, netAmount, netAmount, Number(id));
      });
      updateItems();
    }

    const challan = db.prepare('SELECT * FROM challans WHERE id = ?').get(Number(id));
    const items = db.prepare(
      'SELECT ci.*, fh.name as fee_head_name FROM challan_items ci LEFT JOIN fee_heads fh ON ci.fee_head_id = fh.id WHERE ci.challan_id = ?'
    ).all(Number(id));
    return NextResponse.json({ ...challan as object, items });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update challan', details: String(error) },
      { status: 500 }
    );
  }
}
