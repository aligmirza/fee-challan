import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface FeeStructureRow {
  id: number;
  fee_head_id: number;
  amount: number;
  frequency: string;
  fee_head_name: string;
}

interface ConcessionRow {
  id: number;
  type: string;
  value: number;
  fee_head_id: number | null;
}

interface StudentRow {
  id: number;
  campus_id: number;
  class_id: number | null;
  section_id: number | null;
  name: string;
  father_name: string | null;
  family_id: string | null;
}

interface RuntimeItem {
  fee_head_id: number;
  original_amount: number;
  concession_amount: number;
  one_time_adjustment: number;
  one_time_reason: string | null;
  net_amount: number;
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { student_id, month, year, campus_id, items: runtimeItems } = body;

    if (!student_id || !month || !year || !campus_id) {
      return NextResponse.json(
        { error: 'student_id, month, year, and campus_id are required' },
        { status: 400 }
      );
    }

    // Check for existing challan
    const existingChallan = db.prepare(
      'SELECT id, challan_no FROM challans WHERE student_id = ? AND month = ? AND year = ? AND campus_id = ?'
    ).get(student_id, month, year, campus_id);

    if (existingChallan) {
      // Return existing challan with full details so frontend can show/edit it
      const existingId = (existingChallan as { id: number }).id;
      const fullChallan = db.prepare(`
        SELECT ch.*, s.name as student_name, s.father_name, s.roll_no,
          c.name as class_name, sec.name as section_name
        FROM challans ch
        LEFT JOIN students s ON ch.student_id = s.id
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN sections sec ON s.section_id = sec.id
        WHERE ch.id = ?
      `).get(existingId);
      const existingItems = db.prepare(`
        SELECT ci.*, fh.name as fee_head_name
        FROM challan_items ci LEFT JOIN fee_heads fh ON ci.fee_head_id = fh.id
        WHERE ci.challan_id = ?
      `).all(existingId);
      return NextResponse.json(
        { ...fullChallan as object, items: existingItems, already_exists: true },
        { status: 200 }
      );
    }

    // Get student info
    const student = db.prepare(
      'SELECT id, campus_id, class_id, section_id, name, father_name, family_id FROM students WHERE id = ? AND status = ?'
    ).get(student_id, 'active') as StudentRow | undefined;

    if (!student) {
      return NextResponse.json({ error: 'Active student not found' }, { status: 404 });
    }

    if (!student.class_id) {
      return NextResponse.json({ error: 'Student has no class assigned' }, { status: 400 });
    }

    // Get campus code for challan_no
    const campus = db.prepare('SELECT code FROM campuses WHERE id = ?').get(campus_id) as { code: string } | undefined;
    if (!campus) {
      return NextResponse.json({ error: 'Campus not found' }, { status: 404 });
    }

    // Generate challan_no
    const monthPadded = String(month).padStart(2, '0');
    const lastChallan = db.prepare(
      `SELECT challan_no FROM challans WHERE campus_id = ? AND month = ? AND year = ? ORDER BY id DESC LIMIT 1`
    ).get(campus_id, month, year) as { challan_no: string } | undefined;

    let seq = 1;
    if (lastChallan) {
      const parts = lastChallan.challan_no.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }
    const challan_no = `${campus.code}-CHN-${year}-${monthPadded}-${String(seq).padStart(5, '0')}`;

    let totalAmount = 0;
    let totalConcession = 0;
    let totalOneTime = 0;

    const items: { fee_head_id: number; original_amount: number; concession_amount: number; concession_reason: string | null; net_amount: number }[] = [];

    if (runtimeItems && Array.isArray(runtimeItems) && runtimeItems.length > 0) {
      // Use runtime-edited items from frontend (user edited amounts/concessions/adjustments)
      for (const ri of runtimeItems as RuntimeItem[]) {
        const concTotal = ri.concession_amount + (ri.one_time_adjustment || 0);
        const net = Math.max(0, ri.original_amount - concTotal);
        const reason = ri.one_time_adjustment > 0
          ? `one-time(${ri.one_time_adjustment}${ri.one_time_reason ? ': ' + ri.one_time_reason : ''})`
          : null;

        totalAmount += ri.original_amount;
        totalConcession += concTotal;
        totalOneTime += (ri.one_time_adjustment || 0);

        items.push({
          fee_head_id: ri.fee_head_id,
          original_amount: ri.original_amount,
          concession_amount: concTotal,
          concession_reason: reason,
          net_amount: net,
        });
      }
    } else {
      // Fallback: calculate from DB fee structures and concessions
      const feeStructures = db.prepare(`
        SELECT fs.id, fs.fee_head_id, fs.amount, fs.frequency, fh.name as fee_head_name
        FROM fee_structures fs
        LEFT JOIN fee_heads fh ON fs.fee_head_id = fh.id
        WHERE fs.campus_id = ? AND fs.class_id = ?
          AND (fs.effective_to IS NULL OR fs.effective_to >= date('now'))
          AND fh.is_active = 1
      `).all(campus_id, student.class_id) as FeeStructureRow[];

      if (feeStructures.length === 0) {
        return NextResponse.json({ error: 'No fee structure found for this class' }, { status: 404 });
      }

      const concessions = db.prepare(`
        SELECT sc.id, sc.type, sc.value, sc.fee_head_id
        FROM student_concessions sc
        WHERE sc.student_id = ? AND sc.status = 'active'
          AND (sc.is_permanent = 1 OR (sc.start_date <= date('now') AND (sc.end_date IS NULL OR sc.end_date >= date('now'))))
      `).all(student_id) as ConcessionRow[];

      for (const fs of feeStructures) {
        if (fs.frequency === 'quarterly' && ![1, 4, 7, 10].includes(month)) continue;
        if (fs.frequency === 'annually' && month !== 1) continue;

        let discount = 0;
        let reason: string | null = null;

        for (const c of concessions) {
          if (c.fee_head_id === null || c.fee_head_id === fs.fee_head_id) {
            if (c.type === 'percentage') {
              const pctAmt = Math.round((fs.amount * c.value) / 100);
              discount += pctAmt;
              reason = reason ? `${reason}; ${c.value}% off` : `${c.value}% off`;
            } else if (c.type === 'waiver') {
              // Waiver = 100% off the fee
              discount += fs.amount;
              reason = reason ? `${reason}; full waiver` : 'full waiver';
            } else if (c.type === 'fixed') {
              discount += c.value;
              reason = reason ? `${reason}; Rs.${c.value} off` : `Rs.${c.value} off`;
            }
          }
        }

        discount = Math.min(discount, fs.amount);
        const netAmount = fs.amount - discount;

        totalAmount += fs.amount;
        totalConcession += discount;

        items.push({
          fee_head_id: fs.fee_head_id,
          original_amount: fs.amount,
          concession_amount: discount,
          concession_reason: reason,
          net_amount: netAmount,
        });
      }
    }

    const netAmount = totalAmount - totalConcession;

    // Get due date from settings
    const dueDateSetting = db.prepare(
      "SELECT value FROM institute_settings WHERE key = 'default_due_date' AND (campus_id IS NULL OR campus_id = ?) ORDER BY campus_id DESC LIMIT 1"
    ).get(campus_id) as { value: string } | undefined;

    const dueDay = dueDateSetting ? parseInt(dueDateSetting.value, 10) : 10;
    const dueDate = `${year}-${monthPadded}-${String(dueDay).padStart(2, '0')}`;

    // Insert challan and items in a transaction
    const generate = db.transaction(() => {
      const result = db.prepare(
        `INSERT INTO challans (campus_id, challan_no, student_id, month, year, total_amount, concession_amount, net_amount, arrears, late_fee, grand_total, due_date, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'unpaid')`
      ).run(campus_id, challan_no, student_id, month, year, totalAmount, totalConcession, netAmount, netAmount, dueDate);

      const challanId = result.lastInsertRowid;

      const insertItem = db.prepare(
        `INSERT INTO challan_items (challan_id, fee_head_id, original_amount, concession_amount, concession_reason, net_amount)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      for (const item of items) {
        insertItem.run(challanId, item.fee_head_id, item.original_amount, item.concession_amount, item.concession_reason, item.net_amount);
      }

      return challanId;
    });

    const challanId = generate();
    const challan = db.prepare(`
      SELECT ch.*, s.name as student_name, s.father_name, s.roll_no,
        c.name as class_name, sec.name as section_name
      FROM challans ch
      LEFT JOIN students s ON ch.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE ch.id = ?
    `).get(challanId);

    const challanItems = db.prepare(`
      SELECT ci.*, fh.name as fee_head_name
      FROM challan_items ci
      LEFT JOIN fee_heads fh ON ci.fee_head_id = fh.id
      WHERE ci.challan_id = ?
    `).all(challanId);

    return NextResponse.json({ ...challan as object, items: challanItems }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate challan', details: String(error) },
      { status: 500 }
    );
  }
}
