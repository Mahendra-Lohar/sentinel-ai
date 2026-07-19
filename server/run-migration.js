import fs from 'node:fs/promises';
import { query } from './src/db/pool.js';
import path from 'node:path';

async function runMigration() {
  try {
    const sqlPath = path.join(process.cwd(), '../database/migrations/003_evidence_upgrade.sql');
    const sql = await fs.readFile(sqlPath, 'utf8');
    await query(sql);
    console.log('Migration applied successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
