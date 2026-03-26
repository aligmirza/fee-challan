import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');
    const family_id = searchParams.get('family_id');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let query = `
      SELECT fv.*,
        f.family_name,
        f.guardian_name
      FROM family_vouchers fv
      LEFT JOIN families f ON fv.family_id = f.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND fv.campus_id = ?';
      params.push(Number(campus_id));
    }
    if (family_id) {
      query += ' AND fv.family_id = ?';
      params.push(Number(family_id));
    }
    if (status) {
      query += ' AND fv.status = ?';
      params.push(status);
    }
    if (month) {
      query += ' AND fv.month = ?';
      params.push(Number(month));
    }
    if (year) {
      query += ' AND fv.year = ?';
      params.push(Number(year));
    }
    if (search) {
      query += ' AND (fv.voucher_no LIKE ? OR f.family_name LIKE ? OR f.guardian_name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY fv.generated_at DESC';

    const vouchers = db.prepare(query).all(...params);

    // Attach students for each voucher
    const getStudents = db.prepare(`
      SELECT fvs.*, s.name as student_name, s.roll_no, c.name as class_name, sec.name as section_name
      FROM family_voucher_students fvs
      LEFT JOIN students s ON fvs.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN sections sec ON s.section_id = sec.id
      WHERE fvs.voucher_id = ?
    `);

    const result = (vouchers as Record<string, unknown>[]).map((v) => ({
      ...v,
      students: getStudents.all(v.id),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch family vouchers', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, voucher_no, family_id, month, year, total_amount, concession_amount, net_amount, status, template_id } = body;

    if (!voucher_no || !family_id || !month || !year) {
      return NextResponse.json(
        { error: 'voucher_no, family_id, month, and year are required' },
        { status: 400 }
      );
    }

    const result = db.prepare(
      `INSERT INTO family_vouchers (campus_id, voucher_no, family_id, month, year, total_amount, concession_amount, net_amount, status, template_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      campus_id || null, voucher_no, family_id, month, year,
      total_amount || 0, concession_amount || 0, net_amount || 0,
      status || 'unpaid', template_id || null
    );

    const voucher = db.prepare('SELECT * FROM family_vouchers WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create family voucher', details: String(error) },
      { status: 500 }
    );
  }
}
