import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface StudentRow {
  id: number;
  campus_id: number;
  class_id: number | null;
  section_id: number | null;
  name: string;
  father_name: string | null;
  roll_no: string | null;
  class_name: string | null;
  section_name: string | null;
}

interface FeeStructureRow {
  fee_head_id: number;
  amount: number;
  frequency: string;
  fee_head_name: string;
}

interface ConcessionRow {
  type: string;
  value: number;
  fee_head_id: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { family_id, month, year } = body;

    if (!family_id || !month || !year) {
      return NextResponse.json(
        { error: 'family_id, month, and year are required' },
        { status: 400 }
      );
    }

    // Get family info - support both numeric ID and contact_phone
    const isNumeric = /^\d+$/.test(String(family_id)) && String(family_id).length < 6;
    const family = isNumeric
      ? db.prepare('SELECT * FROM families WHERE id = ?').get(Number(family_id)) as Record<string, unknown> | undefined
      : db.prepare('SELECT * FROM families WHERE contact_phone = ?').get(String(family_id)) as Record<string, unknown> | undefined;
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const familyNumericId = family.id as number;

    // Check for existing voucher
    const existingVoucher = db.prepare(
      'SELECT id, voucher_no FROM family_vouchers WHERE family_id = ? AND month = ? AND year = ?'
    ).get(familyNumericId, month, year);

    if (existingVoucher) {
      // Return existing voucher details so frontend can show/edit it
      const existingId = (existingVoucher as { id: number }).id;
      const fullVoucher = db.prepare('SELECT * FROM family_vouchers WHERE id = ?').get(existingId);
      return NextResponse.json(
        { ...fullVoucher as object, already_exists: true },
        { status: 200 }
      );
    }

    // Find all active siblings in this family (family_id = contact_phone)
    const contactPhone = family.contact_phone as string;
    const siblings = db.prepare(`
      SELECT s.id, s.campus_id, s.class_id, s.section_id, s.name, s.father_name, s.roll_no,
        c.name as class_name, sec.name as section_name
      FROM students s
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE s.family_id = ? AND s.status = 'active'
      ORDER BY c.display_order
    `).all(contactPhone) as StudentRow[];

    if (siblings.length === 0) {
      return NextResponse.json({ error: 'No active students found in this family' }, { status: 404 });
    }

    // Determine campus_id from first sibling
    const primaryCampusId = siblings[0].campus_id;

    // Get campus code for voucher_no
    const campus = db.prepare('SELECT code FROM campuses WHERE id = ?').get(primaryCampusId) as { code: string } | undefined;
    const campusCode = campus?.code || 'UNK';

    // Generate voucher_no
    const monthPadded = String(month).padStart(2, '0');
    const lastVoucher = db.prepare(
      'SELECT voucher_no FROM family_vouchers WHERE month = ? AND year = ? ORDER BY id DESC LIMIT 1'
    ).get(month, year) as { voucher_no: string } | undefined;

    let seq = 1;
    if (lastVoucher) {
      const parts = lastVoucher.voucher_no.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    const voucher_no = `${campusCode}-FV-${year}-${monthPadded}-${String(seq).padStart(5, '0')}`;

    // Get due date
    const dueDateSetting = db.prepare(
      "SELECT value FROM institute_settings WHERE key = 'default_due_date' AND (campus_id IS NULL OR campus_id = ?) ORDER BY campus_id DESC LIMIT 1"
    ).get(primaryCampusId) as { value: string } | undefined;
    const dueDay = dueDateSetting ? parseInt(dueDateSetting.value, 10) : 10;
    const dueDate = `${year}-${monthPadded}-${String(dueDay).padStart(2, '0')}`;

    let grandTotal = 0;
    let grandConcession = 0;

    const studentDetails: {
      student_id: number;
      campus_id: number;
      student_name: string;
      class_name: string | null;
      subtotal: number;
      items: { fee_head_id: number; fee_head_name: string; original_amount: number; concession_amount: number; net_amount: number }[];
    }[] = [];

    for (const student of siblings) {
      if (!student.class_id) continue;

      // Get fee structure
      const feeStructures = db.prepare(`
        SELECT fs.fee_head_id, fs.amount, fs.frequency, fh.name as fee_head_name
        FROM fee_structures fs
        LEFT JOIN fee_heads fh ON fs.fee_head_id = fh.id
        WHERE fs.campus_id = ? AND fs.class_id = ?
          AND (fs.effective_to IS NULL OR fs.effective_to >= date('now'))
          AND fh.is_active = 1
      `).all(student.campus_id, student.class_id) as FeeStructureRow[];

      // Get student concessions
      const concessions = db.prepare(`
        SELECT sc.type, sc.value, sc.fee_head_id
        FROM student_concessions sc
        WHERE sc.student_id = ? AND sc.status = 'active'
          AND (sc.is_permanent = 1 OR (sc.start_date <= date('now') AND (sc.end_date IS NULL OR sc.end_date >= date('now'))))
      `).all(student.id) as ConcessionRow[];

      let studentTotal = 0;
      const items: { fee_head_id: number; fee_head_name: string; original_amount: number; concession_amount: number; net_amount: number }[] = [];

      for (const fs of feeStructures) {
        if (fs.frequency === 'quarterly' && ![1, 4, 7, 10].includes(month)) continue;
        if (fs.frequency === 'annually' && month !== 1) continue;

        let discount = 0;
        for (const c of concessions) {
          if (c.fee_head_id === null || c.fee_head_id === fs.fee_head_id) {
            if (c.type === 'percentage') {
              discount += Math.round((fs.amount * c.value) / 100);
            } else if (c.type === 'waiver') {
              discount += fs.amount; // Full waiver
            } else if (c.type === 'fixed') {
              discount += c.value;
            }
          }
        }

        discount = Math.min(discount, fs.amount);
        const netAmt = fs.amount - discount;

        grandTotal += fs.amount;
        grandConcession += discount;
        studentTotal += netAmt;

        items.push({
          fee_head_id: fs.fee_head_id,
          fee_head_name: fs.fee_head_name,
          original_amount: fs.amount,
          concession_amount: discount,
          net_amount: netAmt,
        });
      }

      studentDetails.push({
        student_id: student.id,
        campus_id: student.campus_id,
        student_name: student.name,
        class_name: student.class_name,
        subtotal: studentTotal,
        items,
      });
    }

    const netTotal = grandTotal - grandConcession;

    // Insert in transaction
    const generate = db.transaction(() => {
      const voucherResult = db.prepare(
        `INSERT INTO family_vouchers (campus_id, voucher_no, family_id, month, year, total_amount, concession_amount, net_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')`
      ).run(primaryCampusId, voucher_no, familyNumericId, month, year, grandTotal, grandConcession, netTotal);

      const voucherId = voucherResult.lastInsertRowid;

      const insertStudent = db.prepare(
        'INSERT INTO family_voucher_students (voucher_id, student_id, campus_id, subtotal) VALUES (?, ?, ?, ?)'
      );

      for (const sd of studentDetails) {
        insertStudent.run(voucherId, sd.student_id, sd.campus_id, sd.subtotal);

        // Also generate individual challan for each student
        const challanMonthPadded = String(month).padStart(2, '0');
        const studentCampus = db.prepare('SELECT code FROM campuses WHERE id = ?').get(sd.campus_id) as { code: string };

        const lastCh = db.prepare(
          'SELECT challan_no FROM challans WHERE campus_id = ? AND month = ? AND year = ? ORDER BY id DESC LIMIT 1'
        ).get(sd.campus_id, month, year) as { challan_no: string } | undefined;

        let chSeq = 1;
        if (lastCh) {
          const parts = lastCh.challan_no.split('-');
          const lastSeq = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(lastSeq)) chSeq = lastSeq + 1;
        }
        const challanNo = `${studentCampus.code}-CHN-${year}-${challanMonthPadded}-${String(chSeq).padStart(5, '0')}`;

        const origTotal = sd.items.reduce((s, i) => s + i.original_amount, 0);
        const concTotal = sd.items.reduce((s, i) => s + i.concession_amount, 0);

        const challanResult = db.prepare(
          `INSERT INTO challans (campus_id, challan_no, student_id, month, year, total_amount, concession_amount, net_amount, arrears, late_fee, grand_total, due_date, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'unpaid')`
        ).run(sd.campus_id, challanNo, sd.student_id, month, year, origTotal, concTotal, sd.subtotal, sd.subtotal, dueDate);

        // Insert challan items for each fee head
        const challanId = challanResult.lastInsertRowid;
        const insertItem = db.prepare(
          `INSERT INTO challan_items (challan_id, fee_head_id, original_amount, concession_amount, concession_reason, net_amount)
           VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const item of sd.items) {
          insertItem.run(challanId, item.fee_head_id, item.original_amount, item.concession_amount, null, item.net_amount);
        }
      }

      return voucherId;
    });

    const voucherId = generate();
    const voucher = db.prepare('SELECT * FROM family_vouchers WHERE id = ?').get(voucherId);

    return NextResponse.json(
      { ...voucher as object, students: studentDetails },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate family voucher', details: String(error) },
      { status: 500 }
    );
  }
}
