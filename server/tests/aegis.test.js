import test from 'node:test';
import assert from 'node:assert';
import { getScenario, scenarios } from '../src/ai/scenarios/index.js';
import { BaseAgent } from '../src/ai/agents/baseAgent.js';

test('AEGIS Scenarios and Base Agent', async (t) => {
  await t.test('getScenario returns correct scenario by ID', () => {
    const scenario = getScenario('incident-04-dns-failure');
    assert.strictEqual(scenario.id, 'incident-04-dns-failure');
    assert.strictEqual(scenario.businessImpact.severity, 'P1');
  });

  await t.test('getScenario returns fallback for unknown ID', () => {
    const scenario = getScenario('unknown-incident-id');
    assert.strictEqual(scenario.id, 'incident-01-redis-timeout');
  });

  await t.test('BaseAgent emits events correctly', () => {
    const emitted = [];
    const mockIo = {
      to: (room) => ({
        emit: (event, payload) => emitted.push({ room, event, payload })
      })
    };

    const agent = new BaseAgent('Test Agent', { io: mockIo, investigationId: 'inv-123' });
    agent.emit('agent:progress', { progress: 50 });

    assert.strictEqual(emitted.length, 1);
    assert.strictEqual(emitted[0].room, 'inv-123');
    assert.strictEqual(emitted[0].event, 'agent:progress');
    assert.strictEqual(emitted[0].payload.progress, 50);
  });
});
