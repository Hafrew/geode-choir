import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/state.js';
import { resetSecondVerse } from '../src/progression.js';
import { serializeState, restoreState } from '../src/saves.js';
import { UNLOCK_COSTS, CATCHUP_CAP, ECHO_CAP, ENGINE_MAX, freshVerse, verseActive, verseOffered, echoGain, foundationRate,
  engineCost, buyEngine, buyUnlock, advanceFoundations, normalizeVerse } from '../src/foundations.js';
const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} },
  TABS: ['cave', 'sea', 'deep'], GILT_CAP: 45, AWAY_CAP: 21600 };
const reload = S => restoreState(serializeState(S), '1.11.0', catalog).state;
function finished() {
  const S = createState('1.11.0');
  S.hearts = 5; S.depth = 90; S.stats.maxDepth = 130; S.sea.soundings = 40; S.sea.unlocked = true; S.feats = { a: 1, b: 1 };
  S.finale = 1000; S.chorus.paid = 900; S.chorus.done = 1000; S.chorus.results = [1, .5, .75];
  S.horns = [{ id: 1 }]; S.coll = { 'x:3': { seed: 5, name: 'Old Horn', ls: ['a'], n: 2, r: 3 } };
  S.shells.owned = ['shell']; S.look = { bright: 1.2, glow: 1, size: 1 }; S.theme = 'light';
  return S;
}
const entered = () => { const { state } = resetSecondVerse(finished(), '1.11.0'); return state; };

test('the reset is offered only after the Last Chorus', () => {
  const S = createState('1.11.0');
  assert.equal(verseOffered(S), false);
  assert.equal(resetSecondVerse(S, '1.11.0'), null);
  assert.equal(verseOffered(finished()), true);
});

test('everything resets; only meta, Echoes, unlocks and a Collection record survive', () => {
  const before = finished(), { state: S, gain } = resetSecondVerse(before, '1.11.0');
  assert.equal(S.hearts, 0); assert.equal(S.depth, 0); assert.equal(S.hum, 0);
  assert.equal(S.sea.soundings, 0); assert.deepEqual(S.horns, []); assert.deepEqual(S.coll, {});
  assert.notDeepEqual(S.shells, before.shells);
  assert.equal(S.stats.maxDepth, 130); assert.deepEqual(S.feats, { a: 1, b: 1 });
  assert.equal(S.finale, 1000); assert.equal(S.chorus.done, 1000);
  assert.equal(S.theme, 'light'); assert.equal(S.look.bright, 1.2);
  assert.equal(S.verse.laps, 1); assert.equal(S.verse.echoes, gain); assert(gain > 0);
  assert.deepEqual(S.verse.best, { depth: 130, hearts: 5, soundings: 40, harmony: .75 });
  assert.deepEqual(S.verse.record['x:3'], { name: 'Old Horn', r: 3, n: 2 });
  assert.equal(verseActive(S), true);
});

test('Echoes are capped per lap and accumulate across laps', () => {
  const S = finished(); S.stats.maxDepth = 1e6; S.hearts = 1e6;
  assert.equal(echoGain(S), ECHO_CAP);
  const a = resetSecondVerse(finished(), '1.11.0'), b = resetSecondVerse(Object.assign(a.state, { hearts: 3 }), '1.11.0');
  assert.equal(b.state.verse.laps, 2); assert.equal(b.state.verse.echoes, a.gain + b.gain);
  assert.equal(b.state.verse.best.hearts, 5, 'best-ever hearts never shrink');
  assert.equal(b.state.verse.record['x:3'].n, 2, 'the record keeps the most owned, not a sum');
});

test('Foundation rates grow with best-ever stats, engines and Echoes; each lap starts from a baseline', () => {
  const S = entered(), cave0 = foundationRate(S, 'cave'), sea0 = foundationRate(S, 'sea');
  assert(cave0 > 1 && sea0 > 0.6);
  S.verse.foundations.stone = engineCost(0);
  assert.equal(buyEngine(S, 'cave'), true);
  assert.equal(S.verse.foundations.engine.cave, 1); assert.equal(S.verse.foundations.stone, 0);
  assert(foundationRate(S, 'cave') > cave0 * 1.5);
  const again = resetSecondVerse(Object.assign(S, { chorus: S.chorus }), '1.11.0').state;
  assert.equal(again.verse.foundations.engine.cave, 0); assert.equal(again.verse.foundations.stone, 0);
  assert(foundationRate(again, 'cave') > cave0, 'a later lap is stronger through Echoes and best-ever stats');
});

test('engines respect cost and the level cap', () => {
  const S = entered();
  assert.equal(buyEngine(S, 'sea'), false);
  S.verse.foundations.tide = 1e30; S.verse.foundations.engine.sea = ENGINE_MAX - 1;
  assert.equal(buyEngine(S, 'sea'), true); assert.equal(buyEngine(S, 'sea'), false);
  assert.equal(createState('1.11.0').verse.laps, 0);
  assert.equal(buyEngine(createState('1.11.0'), 'cave'), false, 'nothing is bought before the layer is entered');
});

test('unlocks cost Echoes, are bought once, and Sea automation has tiers', () => {
  const S = entered(); S.verse.echoes = 1000;
  assert.equal(buyUnlock(S, 'keepTime'), true); assert.equal(buyUnlock(S, 'keepTime'), false);
  assert.equal(S.verse.echoes, 1000 - UNLOCK_COSTS.keepTime);
  for (let t = 0; t < UNLOCK_COSTS.seaAuto.length; t++) assert.equal(buyUnlock(S, 'seaAuto'), true);
  assert.equal(buyUnlock(S, 'seaAuto'), false); assert.equal(S.verse.unlocks.seaAuto, UNLOCK_COSTS.seaAuto.length);
  assert.equal(buyUnlock(S, 'nope'), false);
  S.verse.echoes = 0; assert.equal(buyUnlock(S, 'caveAuto'), false);
  const T = entered(), U = entered(); T.verse.echoes = U.verse.echoes = 100; buyUnlock(T, 'caveAuto'); U.verse.echoes = T.verse.echoes;
  assert.equal(foundationRate(T, 'cave') / foundationRate(U, 'cave'), 1.5, 'Cave auto raises Stone by half at equal Echoes');
});

test('time away pays the away share without Keep Time and everything with it, capped once per return', () => {
  const S = entered(), rate = foundationRate(S, 'cave');
  const live = advanceFoundations(S, 100); assert.equal(live.stone, rate * 100);
  const s0 = entered(), away = advanceFoundations(s0, 1000, true);
  assert.ok(Math.abs(away.stone - rate * 1000 * 0.35) < 1e-6);
  const k = entered(); k.verse.echoes = 100; buyUnlock(k, 'keepTime');
  const kt = advanceFoundations(k, 1000, true); assert.ok(Math.abs(kt.stone - foundationRate(k, 'cave') * 1000) < 1e-6);
  const long = advanceFoundations(k, CATCHUP_CAP * 5, true);
  assert.equal(long.seconds, CATCHUP_CAP); assert.equal(long.capped, true);
  assert.equal(advanceFoundations(createState('1.11.0'), 1000, true).stone, 0, 'inactive before the reset');
  assert.equal(advanceFoundations(k, -5, true).stone, 0); assert.equal(advanceFoundations(k, NaN, true).stone, 0);
});

test('the layer survives a reload and malformed data is repaired', () => {
  const S = entered(); S.verse.echoes = 12.5; S.verse.unlocks.keepTime = 1; S.verse.foundations.stone = 42;
  const R = reload(S);
  assert.equal(R.verse.laps, 1); assert.equal(R.verse.echoes, 12.5); assert.equal(R.verse.unlocks.keepTime, 1);
  assert.equal(R.verse.foundations.stone, 42); assert.deepEqual(R.verse.record, S.verse.record);
  const bad = createState('1.11.0'); bad.verse = { laps: -3, echoes: 'x', best: 7, unlocks: { seaAuto: 99, caveAuto: 'y' }, foundations: { engine: { cave: 1e9, sea: NaN }, stone: -1 }, record: 5 };
  const V = normalizeVerse(bad);
  assert.equal(V.laps, 0); assert.equal(V.echoes, 0); assert.equal(V.unlocks.seaAuto, UNLOCK_COSTS.seaAuto.length);
  assert.equal(V.unlocks.caveAuto, 1); assert.equal(V.foundations.engine.cave, ENGINE_MAX); assert.equal(V.foundations.engine.sea, 0);
  assert.equal(V.foundations.stone, 0); assert.deepEqual(V.record, {});
  const old = serializeState(createState('1.11.0')); delete old.verse;
  assert.deepEqual(restoreState(old, '1.11.0', catalog).state.verse, freshVerse());
});
