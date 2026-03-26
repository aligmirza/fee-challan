import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campus_id');

    const templates = campusId
      ? db.prepare('SELECT * FROM voucher_templates WHERE (campus_id = ? OR campus_id IS NULL) AND is_active = 1').all(campusId)
      : db.prepare('SELECT * FROM voucher_templates WHERE is_active = 1').all();

    return Response.json(templates);
  } catch {
    return Response.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, name, size_width_mm, size_height_mm, orientation, copies_per_voucher, layout_json, colors_json, border_style, bg_type, bg_value, is_default } = body;

    if (is_default) {
      db.prepare('UPDATE voucher_templates SET is_default = 0 WHERE campus_id = ? OR (campus_id IS NULL AND ? IS NULL)')
        .run(campus_id, campus_id);
    }

    const result = db.prepare(`
      INSERT INTO voucher_templates (campus_id, name, size_width_mm, size_height_mm, orientation, copies_per_voucher, layout_json, colors_json, border_style, bg_type, bg_value, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(campus_id || null, name, size_width_mm || 210, size_height_mm || 297, orientation || 'portrait', copies_per_voucher || 3, layout_json, colors_json, border_style || 'thin', bg_type || 'solid', bg_value || '#ffffff', is_default ? 1 : 0);

    return Response.json({ id: result.lastInsertRowid });
  } catch {
    return Response.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
