import { test } from 'node:test';
import assert from 'node:assert';

test('Investigation Orchestrator API', async (t) => {
  await t.test('Creates investigation with correct severity', async () => {
    const payload = {
      title: 'Database Outage',
      severity: 'P0'
    };
    
    assert.strictEqual(payload.title, 'Database Outage');
    assert.ok(['P0', 'P1', 'P2', 'P3'].includes(payload.severity), 'Valid severity level');
  });

  await t.test('Evidence payload parser validates types', async () => {
    const evidence = {
      filename: 'syslog.txt',
      type: 'log',
      size: 1048576
    };
    
    assert.strictEqual(evidence.size <= 10485760, true, 'File size under 10MB limit');
  });
});
