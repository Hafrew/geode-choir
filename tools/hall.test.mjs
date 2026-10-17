import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/state.js';
import { resetSecondVerse } from '../src/progression.js';
import { serializeState, restoreState } from '../src/saves.js';
import { foundationRate, advanceFoundations } from '../src/foundations.js';
import { PARTS, DISTRICTS, SONGS, LEVEL_MAX, freshHall, districtCost, districtOpen, capacity, assigned, recruitCost, balance, songCost,
  songOpen, hallMult, cadenceRate, buildDistrict, recruit, assign, buySong, advanceHall, normalizeHall } from '../src/hall.js';
const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} }, TABS: ['cave', 'sea', 'deep', 'found', 'hall'], GILT_CAP: 45, AWAY_CAP: 21600 };
const reload = S => restoreState(serializeState(S), '1.11.0', catalog).state;
function entered() {
  const S = createState('1.11.0');
  Object.assign(S, { hearts: 5, depth: 90, finale: 1 }); S.stats.maxDepth = 120; S.sea.soundings = 40; S.chorus.done = 1;
  const { state } = resetSecondVerse(S, '1.11.0');
  state.verse.foundations.stone = state.verse.foundations.tide = 1e15;
  return state;
}
const H = S => S.verse.hall;

test('nothing is built or bought before the layer is entered', () => {
  const S = createState('1.11.0'); S.verse.foundations.stone = S.verse.foundations.tide = 1e15;
  assert.equal(buildDistrict(S, 'quarry'), false); assert.equal(recruit(S), false); assert.equal(assign(S, 0, 1), false);
  assert.equal(buySong(S, 'firstLight'), false); assert.equal(advanceHall(S, 100), 0);
});

test('districts cost Stone and Tide, need their neighbours, and cap at the top level', () => {
  const S = entered(), before = S.verse.foundations.stone, c = districtCost('quarry', 0);
  assert.equal(buildDistrict(S, 'quarry'), true); assert.equal(H(S).districts.quarry, 1); assert.equal(before - S.verse.foundations.stone, c.stone);
  assert.equal(buildDistrict(S, 'belfry'), false, 'the Belfry needs the Harbor too');
  assert.equal(districtOpen(H(S), 'belfry'), false);
  buildDistrict(S, 'harbor'); assert.equal(buildDistrict(S, 'belfry'), true);
  for (let i = 0; i < 30; i++) buildDistrict(S, 'quarry');
  assert.equal(H(S).districts.quarry, LEVEL_MAX);
  assert(districtCost('quarry', 3).stone > districtCost('quarry', 2).stone);
  const poor = entered(); poor.verse.foundations.stone = 1; assert.equal(buildDistrict(poor, 'quarry'), false);
  assert.equal(poor.verse.foundations.stone, 1, 'a failed purchase spends nothing');
});

test('districts house singers, and the Hall houses twice as many', () => {
  const S = entered();
  assert.equal(capacity(H(S)), 0); assert.equal(recruit(S), false, 'no room yet');
  buildDistrict(S, 'quarry'); assert.equal(capacity(H(S)), 4);
  buildDistrict(S, 'harbor'); buildDistrict(S, 'belfry'); buildDistrict(S, 'hall');
  assert.equal(capacity(H(S)), 4 + 4 + 4 + 8);
  for (let i = 0; i < 20; i++) assert.equal(recruit(S), true);
  assert.equal(recruit(S), false); assert.equal(H(S).singers, 20);
  assert(recruitCost(H(S)).stone > recruitCost(freshHall()).stone);
});

test('singers are assigned to parts, and a balanced choir sings at full strength', () => {
  const S = entered(); buildDistrict(S, 'quarry'); for (let i = 0; i < 4; i++) recruit(S);
  assert.equal(assign(S, 0, -1), false); assert.equal(assign(S, 9, 1), false);
  for (let i = 0; i < 4; i++) assert.equal(assign(S, 0, 1), true);
  assert.equal(assign(S, 0, 1), false, 'only recruited singers can be assigned');
  const lopsided = cadenceRate(S);
  assert.equal(lopsided, 4 * 0.5 * 0.5, 'a lopsided choir sings at half strength');
  assign(S, 0, -1); assign(S, 0, -1); assign(S, 1, 1); assign(S, 2, 1);
  assert(cadenceRate(S) > 0);
  const full = entered(); H(full).districts.quarry = 5; H(full).singers = 5; H(full).parts = [1, 1, 1, 1, 1];
  assert.equal(balance(H(full)), 1); assert.equal(cadenceRate(full), 5 * 0.5);
  assert.equal(PARTS.length, 5); assert.equal(balance(freshHall()), 1);
});

test('Cadence accrues in closed form and buys songs that lift the Foundations', () => {
  const S = entered(); H(S).districts.quarry = 3; H(S).singers = 5; H(S).parts = [1, 1, 1, 1, 1];
  const rate = cadenceRate(S); assert.equal(advanceHall(S, 100), rate * 100); assert.equal(H(S).cadence, rate * 100);
  assert.equal(buySong(S, 'firstLight'), false, 'not enough Cadence yet');
  H(S).cadence = 1e6;
  const cave0 = foundationRate(S, 'cave'), tide0 = foundationRate(S, 'sea');
  assert.equal(buySong(S, 'firstLight'), true); assert.equal(buySong(S, 'firstLight'), false);
  assert.equal(foundationRate(S, 'cave') / cave0, 1.5); assert.equal(foundationRate(S, 'sea'), tide0, 'a Stone song leaves Tide alone');
  assert.equal(buySong(S, 'deepHymn'), false, 'the second songbook needs the Hall');
  assert.equal(songOpen(H(S), 'deepHymn'), false);
  H(S).districts = { quarry: 3, harbor: 1, belfry: 1, hall: 1, gardens: 0 }; assert.equal(buySong(S, 'deepHymn'), true);
  const r = cadenceRate(S); buySong(S, 'round'); assert.equal(cadenceRate(S) / r, 1.5);
});

test('district bonuses lift the Foundations, and Gardens cheapen songs', () => {
  const S = entered(), base = foundationRate(S, 'cave');
  H(S).districts.quarry = 2; assert.equal(foundationRate(S, 'cave') / base, 1.25 ** 2);
  assert.equal(hallMult(S, 'sea'), 1);
  H(S).districts = { quarry: 1, harbor: 1, belfry: 1, hall: 1, gardens: 2 };
  assert.equal(songCost(H(S), 'firstLight'), Math.ceil(300 * 0.92 ** 2));
});

test('the Hall works through the same live and away accounting as the Foundations', () => {
  const S = entered(); H(S).districts.quarry = 2; H(S).singers = 5; H(S).parts = [1, 1, 1, 1, 1];
  const rate = cadenceRate(S);
  advanceFoundations(S, 10); assert.ok(Math.abs(H(S).cadence - rate * 10) < 1e-6);
  advanceFoundations(S, 1000, true); assert.ok(Math.abs(H(S).cadence - (rate * 10 + rate * 1000 * 0.35)) < 1e-6, 'away share without Keep Time');
});

test('a new lap clears the Hall but keeps Echoes; saves round-trip and malformed data is repaired', () => {
  const S = entered(); H(S).districts.quarry = 2; H(S).districts.harbor = 1; H(S).singers = 3; H(S).parts = [1, 1, 1, 0, 0]; H(S).cadence = 99; H(S).cadenceLife = 99; H(S).songs.firstLight = 1;
  const R = reload(S); assert.deepEqual(R.verse.hall, S.verse.hall);
  S.chorus.done = 1; S.chorus.results = [1];
  const next = resetSecondVerse(S, '1.11.0').state;
  assert.deepEqual(next.verse.hall, freshHall()); assert(next.verse.echoes > 0);
  const bad = normalizeHall({ districts: { quarry: 99, belfry: 4 }, singers: 1e9, parts: [50, -3, 'x'], cadence: -5, songs: { deepHymn: 1, nope: 1, firstLight: 1 }, renown: NaN });
  assert.equal(bad.districts.quarry, LEVEL_MAX); assert.equal(bad.districts.belfry, 0, 'a district needs its neighbours');
  assert.equal(bad.singers, capacity(bad)); assert(assigned(bad) <= bad.singers); assert.equal(bad.cadence, 0);
  assert.deepEqual(bad.songs, { firstLight: 1 }); assert.equal(bad.renown, 0);
  assert.deepEqual(normalizeHall(undefined), freshHall());
  assert.equal(DISTRICTS.length, 5); assert.equal(SONGS.length, 6);
});
