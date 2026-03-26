import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const feeHead = db.prepare('SELECT * FROM fee_heads WHERE id = ?').get(Number(id));
    if (!feeHead) {
      return NextResponse.json({ error: 'Fee head not found' }, { status: 404 });
    }
    return NextResponse.json(feeHead);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fee head', details: String(error) }, { status: 500 });
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

    const existing = db.prepare('SELECT id FROM fee_heads WHERE id = ?').get(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Fee head not found' }, { status: 404 });
    }

    const { name, description, is_active, campus_id } = body;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (campus_id !== undefined) { fields.push('campus_id = ?'); values.push(campus_id); }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(Number(id));
    db.prepare(`UPDATE fee_heads SET ${fields.join(', ')} WHERE id = ?`).run(...values);

    const feeHead = db.prepare('SELECT * FROM fee_heads WHERE id = ?').get(Number(id));
    return NextResponse.json(feeHead);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update fee head', details: String(error) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM fee_heads WHERE id = ?').get(Number(id));
    if (!existing) {
      return NextResponse.json({ error: 'Fee head not found' }, { status: 404 });
    }

    // Check if fee head is used in fee_structures or challan_items
    const inUse = db.prepare(
      'SELECT COUNT(*) as cnt FROM fee_structures WHERE fee_head_id = ?'
    ).get(Number(id)) as { cnt: number };

    if (inUse.cnt > 0) {
      // Soft delete - deactivate instead of removing
      db.prepare('UPDATE fee_heads SET is_active = 0 WHERE id = ?').run(Number(id));
      return NextResponse.json({ message: 'Fee head deactivated (in use by fee structures)' });
    }

    db.prepare('DELETE FROM fee_heads WHERE id = ?').run(Number(id));
    return NextResponse.json({ message: 'Fee head deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete fee head', details: String(error) }, { status: 500 });
  }
}
