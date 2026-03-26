import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');
    const date = searchParams.get('date');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');
    const search = searchParams.get('search');
    const payment_mode = searchParams.get('payment_mode');

    let query = `
      SELECT p.*,
        s.name as student_name,
        ch.challan_no,
        fv.voucher_no
      FROM payments p
      LEFT JOIN challans ch ON p.challan_id = ch.id
      LEFT JOIN students s ON ch.student_id = s.id
      LEFT JOIN family_vouchers fv ON p.voucher_id = fv.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND p.campus_id = ?';
      params.push(Number(campus_id));
    }
    if (date) {
      query += ' AND p.payment_date = ?';
      params.push(date);
    }
    if (date_from) {
      query += ' AND p.payment_date >= ?';
      params.push(date_from);
    }
    if (date_to) {
      query += ' AND p.payment_date <= ?';
      params.push(date_to);
    }
    if (payment_mode) {
      query += ' AND p.payment_mode = ?';
      params.push(payment_mode);
    }
    if (search) {
      query += ' AND (p.receipt_no LIKE ? OR s.name LIKE ? OR ch.challan_no LIKE ? OR fv.voucher_no LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    query += ' ORDER BY p.created_at DESC';

    const payments = db.prepare(query).all(...params);
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const {
      campus_id, challan_id, voucher_id, amount_paid, payment_date,
      payment_mode, receipt_no, cheque_no, reference_no, bank_account_id, recorded_by, notes
    } = body;

    if (!campus_id || !amount_paid || !payment_date || !payment_mode) {
      return NextResponse.json(
        { error: 'campus_id, amount_paid, payment_date, and payment_mode are required' },
        { status: 400 }
      );
    }

    if (!challan_id && !voucher_id) {
      return NextResponse.json(
        { error: 'Either challan_id or voucher_id is required' },
        { status: 400 }
      );
    }

    const recordPayment = db.transaction(() => {
      const result = db.prepare(
        `INSERT INTO payments (campus_id, challan_id, voucher_id, amount_paid, payment_date, payment_mode, receipt_no, cheque_no, reference_no, bank_account_id, recorded_by, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        campus_id, challan_id || null, voucher_id || null, amount_paid, payment_date,
        payment_mode, receipt_no || null, cheque_no || null, reference_no || null,
        bank_account_id || null, recorded_by || null, notes || null
      );

      // Update challan status if challan_id provided
      if (challan_id) {
        const challan = db.prepare('SELECT grand_total FROM challans WHERE id = ?').get(challan_id) as { grand_total: number } | undefined;
        if (challan) {
          // Sum all payments for this challan
          const totalPaid = db.prepare(
            'SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE challan_id = ?'
          ).get(challan_id) as { total: number };

          let newStatus = 'unpaid';
          if (totalPaid.total >= challan.grand_total) {
            newStatus = 'paid';
          } else if (totalPaid.total > 0) {
            newStatus = 'partially_paid';
          }

          db.prepare('UPDATE challans SET status = ? WHERE id = ?').run(newStatus, challan_id);
        }
      }

      // Update family voucher status if voucher_id provided
      if (voucher_id) {
        const voucher = db.prepare('SELECT net_amount FROM family_vouchers WHERE id = ?').get(voucher_id) as { net_amount: number } | undefined;
        if (voucher) {
          const totalPaid = db.prepare(
            'SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE voucher_id = ?'
          ).get(voucher_id) as { total: number };

          let newStatus = 'unpaid';
          if (totalPaid.total >= voucher.net_amount) {
            newStatus = 'paid';
          } else if (totalPaid.total > 0) {
            newStatus = 'partially_paid';
          }

          db.prepare('UPDATE family_vouchers SET status = ? WHERE id = ?').run(newStatus, voucher_id);
        }
      }

      return result.lastInsertRowid;
    });

    const paymentId = recordPayment();
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record payment', details: String(error) },
      { status: 500 }
    );
  }
}
