import assert from 'node:assert/strict';
import test from 'node:test';
import { createState } from '../src/state.js';
import { freshCaveVariety, normalizeCaveVariety, queueCaveEvents, chooseCaveEvent, finishCaveEvent, tickCaveEvents } from '../src/cave-variety.js';
import { serializeState, restoreState } from '../src/saves.js';
import { resetHeartstone } from '../src/progression.js';
const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} }, TABS: ['cave'], GILT_CAP: 45, AWAY_CAP: 21600 };
const setup = () => { const S = createState('1.10.7'); S.depth = 11; S.fossils = 200; S.age = 100; S.cool = 50; queueCaveEvents(S, 4, 100); return S; };
test('crossing milestones queues each floor once, including falls; old saves get no retroactive event', () => {
  const S = setup(); assert.deepEqual(S.caveVariety.pending.map(p => p.floor), [5, 10]);
  queueCaveEvents(S, 11, 100); assert.equal(S.caveVariety.pending.length, 2);
  assert.deepEqual(restoreState({ depth: 100, hum: 1 }, '1.10.7', catalog).state.caveVariety, freshCaveVariety());
});
test('event choices persist through reload, cannot be changed, and pay exactly once', () => {
  let S = setup(); const id = S.caveVariety.pending[0].id;
  assert(chooseCaveEvent(S, id, 'fossils')); assert.equal(chooseCaveEvent(S, id, 'fresh'), false);
  assert.equal(finishCaveEvent(S, id), false);
  S = restoreState(serializeState(S, 1000), '1.10.7', catalog, 1000).state;
  tickCaveEvents(S, 15, true); assert.equal(S.fossils, 210); assert.equal(S.cool, 80); assert.equal(S.stats.fossilsLife, 10);
  assert.equal(finishCaveEvent(S, id, true), false); assert.equal(S.fossils, 210);
});
test('Auto is neutral and paused events consume no hidden or Sea time', () => {
  const S = setup(); const before = JSON.stringify(S);
  tickCaveEvents(S, 100, false, true); assert.equal(JSON.stringify(S), before);
  tickCaveEvents(S, 14, true, true); assert.equal(S.caveVariety.pending.length, 2);
  tickCaveEvents(S, 1, true, true); assert.equal(S.caveVariety.pending.length, 0);
  assert.equal(S.fossils, 200); assert.equal(S.age, 100); assert.equal(S.cool, 50);
});
test('freshness trade is paid from current fossils and scales down if the haul was spent', () => {
  const S = setup(); S.fossils = 5; const id = S.caveVariety.pending[0].id;
  chooseCaveEvent(S, id, 'fresh'); assert(finishCaveEvent(S, id, true));
  assert.equal(S.fossils, 0); assert.equal(S.age, 70); assert.equal(S.cool, 50);
});
test('invalid event records are dropped and Heartstones cancel queued dives while retaining choices', () => {
  let S = setup(); S.caveVariety.remaining = 2; S.caveVariety.pending.push({ id: 9, floor: 1000, type: 0, haul: 10 });
  normalizeCaveVariety(S); assert.equal(S.caveVariety.pending.length, 2);
  S = resetHeartstone(S, '1.10.7'); assert.equal(S.caveVariety.remaining, 0); assert.equal(S.caveVariety.pending.length, 2);
});
