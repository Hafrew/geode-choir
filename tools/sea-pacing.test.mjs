import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/state.js';
import { seaLock, seaThreshold, soundingReady, advanceSeaTimer, resetSounding, resetHeartstone,
  heartSeaRequired, FINALE_SOUNDINGS, FINALE_HEARTS, HEART_LUMEN_GROWTH, PLUMB_STEP, heartLumenCost, fathomReward } from '../src/progression.js';
import { serializeState, restoreState } from '../src/saves.js';
const fresh = () => createState('1.9.8');
const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} },
  TABS: ['cave', 'sea', 'horns'], GILT_CAP: 45, AWAY_CAP: 21600 };

test('Sea thresholds grow by three and both tide and settling gate actual eligibility', () => {
  const S = fresh(); S.sea.unlocked = true;
  for (const n of [0, 1, 10, 19, 24]) {
    S.sea.soundings = n; S.sea.run = seaThreshold(S);
    assert.equal(seaThreshold(S), 50000 * 3 ** n);
    S.sea.cool = 1; assert.equal(soundingReady(S), false);
    S.sea.cool = 0; assert.equal(soundingReady(S), true);
    S.sea.run *= .999; assert.equal(soundingReady(S), false);
  }
  S.sea.run = Infinity; S.sea.unlocked = false; assert.equal(soundingReady(S), false);
});

test('actual soundings shorten future locks; tick/offline work is applied once and survives kindling', () => {
  assert.deepEqual([0, 1, 2, 5, 10, 20, 25].map(seaLock), [600, 600, 480, 360, 240, 120, 120]);
  let S = fresh(); resetSounding(S, 4);
  assert.equal(S.sea.cool, 600); assert.equal(S.sea.coolTotal, 600);
  advanceSeaTimer(S, 10, 2); assert.equal(S.sea.cool, 580);
  S.world = 'cave'; advanceSeaTimer(S, 100, 2, .35);
  assert.equal(S.sea.cool, 510); assert.equal(S.sea.coolTotal, 600);
  S = resetHeartstone(S, '1.9.8'); assert.equal(S.sea.cool, 510);
  advanceSeaTimer(S, 1000, 2); assert.equal(S.sea.cool, 0);
  assert.equal(S.sea.soundings, 1); assert.equal(S.sea.fathoms, 4);
  resetSounding(S, 6); assert.equal(S.sea.cool, 480);
});

test('Heartstones use cumulative 0/20/24/28 gates; shells never change actual counts or finale', () => {
  const S = fresh();
  for (const [hearts, expected] of [[0, 0], [1, 20], [2, 24], [3, 28]]) {
    S.hearts = hearts; assert.equal(heartSeaRequired(S), expected);
  }
  S.hearts = 1; S.sea.soundings = 14;
  S.shells.extraSlot = 1; S.shells.items = [{ id: 1, r: 2, depth: 10 }, { id: 2, r: 2, depth: 10 }];
  S.shells.equipped = [1, 2];
  assert.equal(heartSeaRequired(S), 14); assert.equal(S.sea.soundings, 14);
  assert.equal(FINALE_SOUNDINGS, 36);
  assert.equal(seaLock(S.sea.soundings), 240);
});

test('migration honors one met Sea gate and preserves paid levels, balances, and completed finales', () => {
  let S = fresh(); S.ver = '1.9.7'; S.hearts = 2; S.sea.soundings = 4;
  S.sea.choir.open = 22; S.sea.fathoms = 9876; S.finale = 1;
  S = restoreState(serializeState(S), '1.9.8', catalog).state;
  assert.equal(heartSeaRequired(S), 4); assert.equal(S.sea.cool, 0);
  assert.equal(S.sea.choir.open, 22); assert.equal(S.sea.fathoms, 9876); assert.equal(S.finale, 1);
  S.sea.cool = 120; S.sea.coolTotal = 240;
  S = restoreState(serializeState(S), '1.9.8', catalog).state;
  assert.equal(heartSeaRequired(S), 4); assert.equal(S.sea.cool, 120); assert.equal(S.sea.coolTotal, 240);
  S = resetHeartstone(S, '1.9.8'); assert.equal(S.heartSeaLegacy, null);
  assert.equal(heartSeaRequired(S), 28); assert.equal(S.sea.soundings, 4); assert.equal(S.sea.cool, 120);
  const notMet = fresh(); notMet.ver = '1.9.7'; notMet.hearts = 2; notMet.sea.soundings = 3;
  const migrated = restoreState(serializeState(notMet), '1.9.8', catalog).state;
  assert.equal(migrated.heartSeaLegacy, null); assert.equal(heartSeaRequired(migrated), 24);
});

test('1.10.2 balance: five-Heartstone finale, steeper lumen cost, softer Plumb Line', () => {
  const S = fresh(), omen = { lumen: 1 };
  assert.equal(FINALE_HEARTS, 5);
  assert.ok(FINALE_SOUNDINGS > heartSeaRequired({ ...S, hearts: FINALE_HEARTS - 1, shells: S.shells, heartSeaLegacy: null }));
  assert.equal(HEART_LUMEN_GROWTH, 25);
  S.hearts = 0; assert.equal(heartLumenCost(S, omen), 1e7);
  S.hearts = 2; assert.equal(heartLumenCost(S, omen), 1e7 * 625);
  S.hearts = 4; assert.equal(heartLumenCost(S, omen), 1e7 * 25 ** 4);
  assert.equal(PLUMB_STEP, 1.2);
  const q = fresh(); q.sea.run = seaThreshold(q) * 2;
  const base = fathomReward(q, 1e6); q.sea.deep.record = 10;
  const ratio = fathomReward(q, 1e6) / base;
  assert.ok(Math.abs(ratio - 1.2 ** 10) < 0.001, `Plumb Line ratio ${ratio}`);
});
