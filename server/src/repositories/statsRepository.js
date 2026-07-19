import { query } from '../db/pool.js';

export async function getStats() {
  const result = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('draft','investigating')) AS open_count,
      COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
      COUNT(*) FILTER (WHERE status = 'investigating') AS active_count,
      ROUND(AVG(mttr_minutes) FILTER (WHERE mttr_minutes IS NOT NULL)) AS avg_mttr,
      ROUND(AVG(confidence) FILTER (WHERE confidence > 0)) AS avg_confidence,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS this_week,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days') AS last_week
    FROM investigations
  `);
  return result.rows[0];
}

export async function getTrend(days = 30) {
  const result = await query(`
    SELECT
      DATE(created_at) AS date,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE severity = 'P0') AS p0,
      COUNT(*) FILTER (WHERE severity = 'P1') AS p1,
      COUNT(*) FILTER (WHERE severity = 'P2') AS p2,
      COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
      ROUND(AVG(confidence) FILTER (WHERE confidence > 0)) AS avg_confidence
    FROM investigations
    WHERE created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  return result.rows;
}

export async function getSeverityBreakdown() {
  const result = await query(`
    SELECT severity, COUNT(*) AS count
    FROM investigations
    GROUP BY severity
    ORDER BY severity
  `);
  return result.rows;
}

export async function getRecentActivity(limit = 10) {
  const result = await query(`
    SELECT i.id, i.title, i.severity, i.status, i.confidence, i.created_at,
           u.name AS created_by_name
    FROM investigations i
    LEFT JOIN users u ON u.id = i.created_by
    ORDER BY i.created_at DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
}
