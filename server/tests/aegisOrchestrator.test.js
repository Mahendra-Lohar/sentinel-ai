import test from 'node:test';
import assert from 'node:assert/strict';
import { redisTimeoutScenario } from '../src/ai/orchestrator/demoScenario.js';

test('redis timeout demo scenario has evidence-backed root cause', () => {
  assert.equal(redisTimeoutScenario.confidence, 96);
  assert.match(redisTimeoutScenario.rootCause, /Redis memory exhaustion/);
  assert.ok(redisTimeoutScenario.agents.length >= 6);
  assert.ok(redisTimeoutScenario.timeline.length >= 5);
  assert.ok(redisTimeoutScenario.recommendations.some((item) => item.title.includes('Rollback')));
});
