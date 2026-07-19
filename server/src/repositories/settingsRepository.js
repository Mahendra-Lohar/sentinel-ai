import { query } from '../db/pool.js';

export async function getAllSettings(userId) {
  const result = await query(`SELECT key, value FROM user_settings WHERE user_id = $1`, [userId]);
  const settings = {};
  result.rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function getSetting(key, userId) {
  const result = await query(`SELECT value FROM user_settings WHERE key = $1 AND user_id = $2`, [key, userId]);
  return result.rows[0]?.value || '';
}

export async function updateSettings(userId, settingsData) {
  const keys = Object.keys(settingsData);
  
  for (const key of keys) {
    const value = settingsData[key] || '';
    await query(
      `INSERT INTO user_settings (user_id, key, value) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [userId, key, value]
    );
  }
  
  return await getAllSettings(userId);
}
