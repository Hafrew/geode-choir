import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/state.js';
import { SUN_PITY_STEP, SUN_PITY_MAX, SUN_GUARANTEE, sunPityBonus, sunveinRoll } from '../src/progression.js';
import { serializeState, restoreState } from '../src/saves.js';
import { rng32 } from '../src/horns.js';

const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} },
  TABS: ['cave', 'sea', 'horns'], GILT_CAP: 45, AWAY_CAP: 21600 };

test('pity grows one point per dry descent up to the maximum', () => {
  assert.equal(SUN_PITY_STEP, 0.01); assert.equal(SUN_PITY_MAX, 0.05); assert.equal(SUN_GUARANTEE, 30);
  for (const [dry, bonus] of [[0, 0], [1, 0.01], [3, 0.03], [5, 0.05], [12, 0.05], [29, 0.05]]) {
    assert.ok(Math.abs(sunPityBonus(dry) - bonus) < 1e-12, `dry ${dry}`);
  }
  assert.equal(sunPityBonus(-4), 0); assert.equal(sunPityBonus(NaN), 0);
});

test('the chance includes pity and the 30th dry descent is guaranteed', () => {
  assert.equal(sunveinRoll(0, 0.05, 0.0499), true); assert.equal(sunveinRoll(0, 0.05, 0.05), false);
  assert.equal(sunveinRoll(5, 0.05, 0.0999), true); assert.equal(sunveinRoll(5, 0.05, 0.1), false);
  assert.equal(sunveinRoll(28, 0.05, 0.999), false);
  assert.equal(sunveinRoll(29, 0.05, 0.999), true);
  assert.equal(sunveinRoll(500, 0, 0.999), true);
});

test('simulated descents never go 30 in a row without a Sunvein and keep a sensible rate', () => {
  const random = rng32(7), chance = 0.05; let dry = 0, longest = 0, hits = 0; const N = 200000;
  for (let i = 0; i < N; i++) {
    if (sunveinRoll(dry, chance, random())) { hits++; dry = 0; } else { dry++; longest = Math.max(longest, dry); }
  }
  assert.ok(longest <= SUN_GUARANTEE - 1, `longest dry streak ${longest}`);
  const rate = hits / N;
  assert.ok(rate > 0.09 && rate < 0.11, `rate ${rate}`);
});

test('the dry counter is saved, defaults to zero for old saves, and is clamped on load', () => {
  const S = createState('1.10.3'); assert.equal(S.stats.sunDry, 0);
  S.stats.sunDry = 12;
  assert.equal(restoreState(JSON.parse(JSON.stringify(serializeState(S))), '1.10.3', catalog).state.stats.sunDry, 12);
  const old = serializeState(S); delete old.stats.sunDry;
  assert.equal(restoreState(old, '1.10.3', catalog).state.stats.sunDry, 0);
  for (const bad of [-5, 'x', null, 1e9, NaN]) {
    const d = serializeState(S); d.stats.sunDry = bad;
    const got = restoreState(d, '1.10.3', catalog).state.stats.sunDry;
    assert.ok(Number.isInteger(got) && got >= 0 && got <= SUN_GUARANTEE - 1, `bad ${bad} -> ${got}`);
  }
});
