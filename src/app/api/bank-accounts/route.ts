import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campus_id = searchParams.get('campus_id');

    let query = 'SELECT * FROM bank_accounts WHERE 1=1';
    const params: (string | number)[] = [];

    if (campus_id) {
      query += ' AND (campus_id = ? OR campus_id IS NULL)';
      params.push(Number(campus_id));
    }

    query += ' ORDER BY is_primary DESC, bank_name';

    const accounts = db.prepare(query).all(...params);
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, bank_name, branch_name, account_title, account_number, iban, is_primary } = body;

    if (!bank_name || !account_title || !account_number) {
      return NextResponse.json(
        { error: 'bank_name, account_title, and account_number are required' },
        { status: 400 }
      );
    }

    const result = db.prepare(
      'INSERT INTO bank_accounts (campus_id, bank_name, branch_name, account_title, account_number, iban, is_primary) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(campus_id || null, bank_name, branch_name || null, account_title, account_number, iban || null, is_primary || 0);

    const account = db.prepare('SELECT * FROM bank_accounts WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create bank account', details: String(error) },
      { status: 500 }
    );
  }
}
