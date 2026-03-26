import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campus_id');

    let settings;
    if (campusId) {
      settings = db.prepare(
        'SELECT * FROM institute_settings WHERE campus_id = ? OR campus_id IS NULL ORDER BY campus_id DESC'
      ).all(campusId);
    } else {
      settings = db.prepare('SELECT * FROM institute_settings WHERE campus_id IS NULL').all();
    }

    return Response.json(settings);
  } catch {
    return Response.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = getDb();
    const body = await request.json();
    const { campus_id, key, value } = body;

    const existing = db.prepare(
      campus_id
        ? 'SELECT id FROM institute_settings WHERE campus_id = ? AND key = ?'
        : 'SELECT id FROM institute_settings WHERE campus_id IS NULL AND key = ?'
    ).get(...(campus_id ? [campus_id, key] : [key])) as { id: number } | undefined;

    if (existing) {
      db.prepare('UPDATE institute_settings SET value = ?, updated_at = datetime("now") WHERE id = ?')
        .run(value, existing.id);
    } else {
      db.prepare('INSERT INTO institute_settings (campus_id, key, value) VALUES (?, ?, ?)')
        .run(campus_id || null, key, value);
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}
