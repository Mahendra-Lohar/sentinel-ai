import { query } from '../db/pool.js';

export async function getAllSettings() {
  const result = await query(`SELECT key, value FROM system_settings`);
  const settings = {};
  result.rows.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function getSetting(key) {
  const result = await query(`SELECT value FROM system_settings WHERE key = $1`, [key]);
  return result.rows[0]?.value || '';
}

export async function updateSettings(settingsData) {
  // settingsData is an object: { slack_webhook_url: '...', jira_host: '...' }
  const keys = Object.keys(settingsData);
  
  for (const key of keys) {
    const value = settingsData[key] || '';
    await query(
      `INSERT INTO system_settings (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, value]
    );
  }
  
  return await getAllSettings();
}
