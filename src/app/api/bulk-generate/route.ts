import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, class_id, section_id, month, year, family_mode = 'smart' } = body;

    // Get campus code
    const campus = db.prepare('SELECT code FROM campuses WHERE id = ?').get(campus_id) as { code: string } | undefined;
    if (!campus) return Response.json({ error: 'Campus not found' }, { status: 404 });

    // Get students
    let studentQuery = `SELECT s.*, c.name as class_name, sec.name as section_name
      FROM students s
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN sections sec ON sec.id = s.section_id
      WHERE s.campus_id = ? AND s.status = 'active' AND s.class_id = ?`;
    const params: (string | number)[] = [campus_id, class_id];
    if (section_id) {
      studentQuery += ' AND s.section_id = ?';
      params.push(section_id);
    }
    const students = db.prepare(studentQuery).all(...params) as {
      id: number; family_id: number | null; name: string; class_id: number;
    }[];

    // Get fee structure for this class
    const feeStructures = db.prepare(`
      SELECT fs.*, fh.name as fee_head_name FROM fee_structures fs
      JOIN fee_heads fh ON fh.id = fs.fee_head_id
      WHERE fs.campus_id = ? AND fs.class_id = ?
    `).all(campus_id, class_id) as { fee_head_id: number; amount: number; fee_head_name: string }[];

    // Get existing challan count for sequence
    const existingCount = db.prepare(
      `SELECT COUNT(*) as count FROM challans WHERE campus_id = ? AND month = ? AND year = ?`
    ).get(campus_id, month, year) as { count: number };
    let seq = existingCount.count;

    const generatedChallans: number[] = [];
    const generatedVouchers: number[] = [];
    const processedFamilies = new Set<number>();

    const insertChallan = db.prepare(`
      INSERT INTO challans (campus_id, challan_no, student_id, month, year, total_amount, concession_amount, net_amount, arrears, late_fee, grand_total, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, 0, 0, ?, ?, 'unpaid')
    `);
    const insertItem = db.prepare(`
      INSERT INTO challan_items (challan_id, fee_head_id, original_amount, concession_amount, net_amount)
      VALUES (?, ?, ?, 0, ?)
    `);

    for (const student of students) {
      // Check if challan already exists
      const existing = db.prepare(
        'SELECT id FROM challans WHERE student_id = ? AND month = ? AND year = ?'
      ).get(student.id, month, year);
      if (existing) continue;

      const shouldGroupFamily = family_mode === 'family' || (family_mode === 'smart' && student.family_id);

      if (shouldGroupFamily && student.family_id && !processedFamilies.has(student.family_id)) {
        processedFamilies.add(student.family_id);
        // Generate family voucher - for now just generate individual challans for each sibling
      }

      // Generate individual challan
      seq++;
      const challanNo = `${campus.code}-CHN-${year}-${String(month).padStart(2, '0')}-${String(seq).padStart(5, '0')}`;
      const totalAmount = feeStructures.reduce((sum, fs) => sum + fs.amount, 0);
      const dueDate = `${year}-${String(month).padStart(2, '0')}-10`;

      const result = insertChallan.run(campus_id, challanNo, student.id, month, year, totalAmount, totalAmount, totalAmount, dueDate);
      const challanId = result.lastInsertRowid as number;

      for (const fs of feeStructures) {
        insertItem.run(challanId, fs.fee_head_id, fs.amount, fs.amount);
      }
      generatedChallans.push(challanId);
    }

    return Response.json({
      success: true,
      challansGenerated: generatedChallans.length,
      vouchersGenerated: generatedVouchers.length,
      totalStudents: students.length,
      totalAmount: feeStructures.reduce((sum, fs) => sum + fs.amount, 0) * generatedChallans.length,
    });
  } catch (error) {
    return Response.json({ error: 'Bulk generation failed' }, { status: 500 });
  }
}
