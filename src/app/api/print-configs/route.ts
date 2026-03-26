import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campus_id');

    const configs = campusId
      ? db.prepare('SELECT * FROM print_configs WHERE campus_id = ? OR campus_id IS NULL ORDER BY campus_id DESC').all(campusId)
      : db.prepare('SELECT * FROM print_configs').all();

    return Response.json(configs);
  } catch {
    return Response.json({ error: 'Failed to fetch print configs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, paper_size, paper_orientation, page_margins_json, vouchers_per_page, layout_grid, cut_marks, separate_family_voucher } = body;

    const existing = db.prepare(
      campus_id ? 'SELECT id FROM print_configs WHERE campus_id = ?' : 'SELECT id FROM print_configs WHERE campus_id IS NULL'
    ).get(...(campus_id ? [campus_id] : [])) as { id: number } | undefined;

    if (existing) {
      db.prepare(`UPDATE print_configs SET paper_size=?, paper_orientation=?, page_margins_json=?, vouchers_per_page=?, layout_grid=?, cut_marks=?, separate_family_voucher=? WHERE id=?`)
        .run(paper_size, paper_orientation, page_margins_json, vouchers_per_page, layout_grid, cut_marks ? 1 : 0, separate_family_voucher ? 1 : 0, existing.id);
      return Response.json({ id: existing.id });
    }

    const result = db.prepare(`
      INSERT INTO print_configs (campus_id, paper_size, paper_orientation, page_margins_json, vouchers_per_page, layout_grid, cut_marks, separate_family_voucher)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(campus_id || null, paper_size || 'A4', paper_orientation || 'portrait', page_margins_json || '{"top":10,"bottom":10,"left":10,"right":10}', vouchers_per_page || 1, layout_grid || '1x1', cut_marks ? 1 : 0, separate_family_voucher ? 1 : 0);

    return Response.json({ id: result.lastInsertRowid });
  } catch {
    return Response.json({ error: 'Failed to save print config' }, { status: 500 });
  }
}
