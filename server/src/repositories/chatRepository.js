import { query } from '../db/pool.js';

export async function getChatHistory(investigationId, limit = 50) {
  const result = await query(
    `SELECT id, role, content, metadata, created_at
     FROM chat_messages
     WHERE investigation_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [investigationId, limit]
  );
  return result.rows;
}

export async function saveChatMessage({ investigationId, userId, role, content, metadata = {} }) {
  const result = await query(
    `INSERT INTO chat_messages (investigation_id, user_id, role, content, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [investigationId, userId || null, role, content, JSON.stringify(metadata)]
  );
  return result.rows[0];
}
