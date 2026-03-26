import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');
    const student_id = searchParams.get('student_id');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = `
      SELECT ch.*,
        s.name as student_name,
        s.father_name,
        s.roll_no,
        c.name as class_name,
        sec.name as section_name,
        cam.name as campus_name
      FROM challans ch
      LEFT JOIN students s ON ch.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      LEFT JOIN campuses cam ON ch.campus_id = cam.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND ch.campus_id = ?';
      params.push(Number(campus_id));
    }
    if (student_id) {
      query += ' AND ch.student_id = ?';
      params.push(Number(student_id));
    }
    if (month) {
      query += ' AND ch.month = ?';
      params.push(Number(month));
    }
    if (year) {
      query += ' AND ch.year = ?';
      params.push(Number(year));
    }
    if (status) {
      query += ' AND ch.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (ch.challan_no LIKE ? OR s.name LIKE ? OR s.father_name LIKE ? OR s.roll_no LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY ch.generated_at DESC';

    const challans = db.prepare(query).all(...params);
    return NextResponse.json(challans);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch challans', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, challan_no, student_id, month, year, total_amount, concession_amount, net_amount, arrears, late_fee, grand_total, due_date, status, template_id, items } = body;

    if (!campus_id || !challan_no || !student_id || !month || !year) {
      return NextResponse.json(
        { error: 'campus_id, challan_no, student_id, month, and year are required' },
        { status: 400 }
      );
    }

    const insertChallan = db.transaction(() => {
      const result = db.prepare(
        `INSERT INTO challans (campus_id, challan_no, student_id, month, year, total_amount, concession_amount, net_amount, arrears, late_fee, grand_total, due_date, status, template_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        campus_id, challan_no, student_id, month, year,
        total_amount || 0, concession_amount || 0, net_amount || 0,
        arrears || 0, late_fee || 0, grand_total || 0,
        due_date || null, status || 'unpaid', template_id || null
      );

      const challanId = result.lastInsertRowid;

      if (items && Array.isArray(items)) {
        const insertItem = db.prepare(
          `INSERT INTO challan_items (challan_id, fee_head_id, original_amount, concession_amount, concession_reason, net_amount)
           VALUES (?, ?, ?, ?, ?, ?)`
        );
        for (const item of items) {
          insertItem.run(
            challanId, item.fee_head_id, item.original_amount,
            item.concession_amount || 0, item.concession_reason || null, item.net_amount
          );
        }
      }

      return challanId;
    });

    const challanId = insertChallan();
    const challan = db.prepare('SELECT * FROM challans WHERE id = ?').get(challanId);
    const challanItems = db.prepare('SELECT * FROM challan_items WHERE challan_id = ?').all(challanId);

    return NextResponse.json({ ...challan as object, items: challanItems }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create challan', details: String(error) },
      { status: 500 }
    );
  }
}
