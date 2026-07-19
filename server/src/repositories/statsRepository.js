import { query } from '../db/pool.js';

export async function getStats(userId) {
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
    WHERE created_by = $1
  `, [userId]);
  return result.rows[0];
}

export async function getTrend(days = 30, userId) {
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
    WHERE created_by = $1 AND created_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `, [userId]);
  return result.rows;
}

export async function getSeverityBreakdown(userId) {
  const result = await query(`
    SELECT severity, COUNT(*) AS count
    FROM investigations
    WHERE created_by = $1
    GROUP BY severity
    ORDER BY severity
  `, [userId]);
  return result.rows;
}

export async function getRecentActivity(limit = 10, userId) {
  const result = await query(`
    SELECT i.id, i.title, i.severity, i.status, i.confidence, i.created_at,
           u.name AS created_by_name
    FROM investigations i
    LEFT JOIN users u ON u.id = i.created_by
    WHERE i.created_by = $1
    ORDER BY i.created_at DESC
    LIMIT $2
  `, [userId, limit]);
  return result.rows;
}
