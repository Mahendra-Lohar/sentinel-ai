import test from 'node:test';
import assert from 'node:assert';
import { z } from 'zod';
import { validate } from '../src/middleware/validate.js';

test('Investigation Validation Middleware', async (t) => {
  const schema = z.object({
    title: z.string().min(3),
    severity: z.enum(['P0', 'P1', 'P2', 'P3'])
  });

  const middleware = validate(schema);

  await t.test('passes valid payload', () => {
    let called = false;
    const req = { body: { title: 'DB Down', severity: 'P0' } };
    const res = {};
    const next = (err) => {
      assert.strictEqual(err, undefined);
      called = true;
    };

    middleware(req, res, next);
    assert.ok(called);
    assert.strictEqual(req.body.title, 'DB Down');
  });

  await t.test('fails invalid payload', () => {
    let errorCaught = null;
    const req = { body: { title: 'DB', severity: 'P0' } }; // title too short
    const res = {};
    const next = (err) => {
      errorCaught = err;
    };

    middleware(req, res, next);
    assert.ok(errorCaught instanceof z.ZodError);
    assert.strictEqual(errorCaught.errors[0].path[0], 'title');
  });
});
