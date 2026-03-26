import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const voucher = db.prepare(`
      SELECT fv.*,
        f.family_name, f.guardian_name, f.contact_phone, f.address as family_address,
        cam.name as campus_name, cam.code as campus_code, cam.address as campus_address,
        cam.contact_phone as campus_phone, cam.email as campus_email, cam.tagline as campus_tagline
      FROM family_vouchers fv
      LEFT JOIN families f ON fv.family_id = f.id
      LEFT JOIN campuses cam ON fv.campus_id = cam.id
      WHERE fv.id = ?
    `).get(Number(id));

    if (!voucher) {
      return NextResponse.json({ error: 'Family voucher not found' }, { status: 404 });
    }

    const voucherObj = voucher as Record<string, unknown>;

    // Get students with their fee details
    const students = db.prepare(`
      SELECT fvs.subtotal,
        s.id as student_id, s.name as student_name, s.father_name, s.roll_no, s.cnic_bform,
        c.name as class_name, sec.name as section_name,
        cam.name as campus_name
      FROM family_voucher_students fvs
      LEFT JOIN students s ON fvs.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN campuses cam ON fvs.campus_id = cam.id
      WHERE fvs.voucher_id = ?
      ORDER BY c.display_order, s.name
    `).all(Number(id)) as Record<string, unknown>[];

    // For each student, get fee breakdown from their challan for the same month/year
    const enrichedStudents = students.map(s => {
      const challan = db.prepare(`
        SELECT id FROM challans WHERE student_id = ? AND month = ? AND year = ?
        ORDER BY id DESC LIMIT 1
      `).get(s.student_id, voucherObj.month, voucherObj.year) as { id: number } | undefined;

      let fees: { fee_head_name: string; original_amount: number; concession_amount: number; net_amount: number }[] = [];
      if (challan) {
        fees = db.prepare(`
          SELECT fh.name as fee_head_name, ci.original_amount, ci.concession_amount, ci.net_amount
          FROM challan_items ci
          LEFT JOIN fee_heads fh ON ci.fee_head_id = fh.id
          WHERE ci.challan_id = ?
        `).all(challan.id) as typeof fees;
      }

      return { ...s, fees };
    });

    // Get institute settings
    const settings = db.prepare(`
      SELECT key, value FROM institute_settings
      WHERE campus_id IS NULL OR campus_id = ?
      ORDER BY campus_id DESC
    `).all(voucherObj.campus_id) as { key: string; value: string }[];

    const settingsMap: Record<string, string> = {};
    settings.forEach(s => { if (!settingsMap[s.key]) settingsMap[s.key] = s.value; });

    // Get bank accounts
    const banks = db.prepare(`
      SELECT * FROM bank_accounts WHERE is_active = 1
      ORDER BY is_primary DESC LIMIT 1
    `).all();

    return NextResponse.json({
      ...voucherObj,
      students: enrichedStudents,
      settings: settingsMap,
      bank: banks[0] || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch family voucher', details: String(error) },
      { status: 500 }
    );
  }
}
