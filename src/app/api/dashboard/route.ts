import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const campusId = searchParams.get('campus_id') || '1';

    const today = new Date().toISOString().split('T')[0];

    const todayCollections = db.prepare(
      `SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments WHERE campus_id = ? AND payment_date = ?`
    ).get(campusId, today) as { total: number };

    const pendingChallans = db.prepare(
      `SELECT COUNT(*) as count FROM challans WHERE campus_id = ? AND status = 'unpaid'`
    ).get(campusId) as { count: number };

    const overdueCount = db.prepare(
      `SELECT COUNT(*) as count FROM challans WHERE campus_id = ? AND status = 'overdue'`
    ).get(campusId) as { count: number };

    const activeStudents = db.prepare(
      `SELECT COUNT(*) as count FROM students WHERE campus_id = ? AND status = 'active'`
    ).get(campusId) as { count: number };

    const monthlyCollections = db.prepare(`
      SELECT
        CASE CAST(c.month AS INTEGER)
          WHEN 1 THEN 'Jan' WHEN 2 THEN 'Feb' WHEN 3 THEN 'Mar' WHEN 4 THEN 'Apr'
          WHEN 5 THEN 'May' WHEN 6 THEN 'Jun' WHEN 7 THEN 'Jul' WHEN 8 THEN 'Aug'
          WHEN 9 THEN 'Sep' WHEN 10 THEN 'Oct' WHEN 11 THEN 'Nov' WHEN 12 THEN 'Dec'
        END as month,
        COALESCE(SUM(p.amount_paid), 0) as amount
      FROM challans c
      LEFT JOIN payments p ON p.challan_id = c.id
      WHERE c.campus_id = ? AND c.year = 2026
      GROUP BY c.month
      ORDER BY c.month
    `).all(campusId) as { month: string; amount: number }[];

    const recentPayments = db.prepare(`
      SELECT p.id, p.receipt_no, p.amount_paid, p.payment_date, p.payment_mode,
             s.name as student_name
      FROM payments p
      LEFT JOIN challans c ON c.id = p.challan_id
      LEFT JOIN students s ON s.id = c.student_id
      WHERE p.campus_id = ?
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all(campusId);

    return Response.json({
      todayCollections: todayCollections.total,
      pendingChallans: pendingChallans.count,
      overdueCount: overdueCount.count,
      activeStudents: activeStudents.count,
      monthlyCollections,
      recentPayments,
    });
  } catch (error) {
    return Response.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
