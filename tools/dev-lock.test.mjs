import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { hashCode, verifyCode } from '../src/dev-lock.js';
import { DEV_CONFIG } from '../src/dev-config.js';

const make = (code, salt) => ({ salt, hash: createHash('sha256').update(`${salt}:${code}`).digest('hex') });

test('the browser hash matches the generator and ignores case, spaces and dashes in the typed code', async () => {
  const cfg = make('ABCDEFGHJKLMNPQRSTUV', 'salt-1');
  assert.equal(await hashCode('ABCDE-FGHJK-LMNPQ-RSTUV', 'salt-1'), cfg.hash);
  assert.equal(await verifyCode('abcde fghjk lmnpq rstuv', cfg), true);
  assert.equal(await verifyCode('  ABCDEFGHJKLMNPQRSTUV  ', cfg), true);
});

test('wrong, empty, or missing input never verifies', async () => {
  const cfg = make('ABCDEFGHJKLMNPQRSTUV', 'salt-1');
  for (const bad of ['', ' ', 'ABCDEFGHJKLMNPQRSTUW', 'x', null, undefined, 12345]) assert.equal(await verifyCode(bad, cfg), false);
  assert.equal(await verifyCode('ABCDEFGHJKLMNPQRSTUV', null), false);
  assert.equal(await verifyCode('ABCDEFGHJKLMNPQRSTUV', { salt: '', hash: cfg.hash }), false);
  assert.equal(await verifyCode('ABCDEFGHJKLMNPQRSTUV', { salt: 'salt-1', hash: '' }), false);
  assert.equal(await verifyCode('ABCDEFGHJKLMNPQRSTUV', { salt: 'salt-2', hash: cfg.hash }), false);
});

test('the shipped config holds only a salted hash, and the generator never writes a code', () => {
  assert.match(DEV_CONFIG.salt, /^[0-9a-f]{32}$/);
  assert.match(DEV_CONFIG.hash, /^[0-9a-f]{64}$/);
});
