import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../../..');

export async function loadDemoScenarioFiles(scenarioId = 'incident-01-redis-timeout') {
  const scenarioDir = path.join(repoRoot, 'demo-data', scenarioId);
  const entries = await fs.readdir(scenarioDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filepath = path.join(scenarioDir, entry.name);
    const content = await fs.readFile(filepath, 'utf8');
    files.push({
      filename: entry.name,
      filepath,
      type: path.extname(entry.name).replace('.', '') || 'txt',
      summary: content.slice(0, 240),
      metadata: { scenarioId, demo: true }
    });
  }

  return files;
}
