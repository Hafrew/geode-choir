import assert from 'node:assert/strict';
import test from 'node:test';
import { createState } from '../src/state.js';
import { CAVE_CATEGORIES, CAVE_AUTOMATION_COST, runCaveShopping, normalizeCaveAutomation } from '../src/automation.js';
import { resetDescent, resetSounding, resetHeartstone } from '../src/progression.js';
import { serializeState, restoreState } from '../src/saves.js';
const fresh = () => createState('1.9.5');
const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} }, TABS: ['cave', 'sea', 'strata'], GILT_CAP: 45, AWAY_CAP: 21600 };

test('automatic shopping requires ownership and enabled categories and pauses in the sea', () => {
  const S = fresh(); S.hum = 1000;
  let count = 0;
  const item = { parent: 'shopVoices', unit: 'hum', cost: () => 25, buy: () => { S.hum -= 25; count++; return true; } };
  const run = () => runCaveShopping(S, [item], () => S.hum, () => {});
  assert.equal(run(), 0); S.caveAutomation.unlocked = true; assert.equal(run(), 0);
  S.caveAutomation.categories.voices = true; S.world = 'sea'; assert.equal(run(), 0);
  S.world = 'cave'; assert.equal(run(), 1); assert.equal(count, 1); assert.equal(S.hum, 975);
});

test('shop automation covers every cave category, buys at most one each, and respects reserves and gates', () => {
  const S = fresh(); S.caveAutomation.unlocked = true;
  const wallets = { hum: 100, shard: 20, fossil: 20, lumen: 20, ivory: 20, gilt: 20 };
  const bought = [], refreshed = [];
  const item = (parent, unit, cost, name, overrides = {}) => ({ parent, unit, cost: () => cost,
    buy: () => { wallets[unit] -= cost; bought.push(name); return true; }, ...overrides });
  S.caveAutomation.categories.voices = true; S.caveAutomation.reserves.hum = 75;
  const choices = [item('shopVoices', 'hum', 20, 'locked', { show: () => false }),
    item('shopVoices', 'hum', 10, 'blocked', { blocked: () => true }),
    item('shopVoices', 'hum', null, 'maxed'), item('shopVoices', 'hum', Infinity, 'overflow'),
    item('shopVoices', 'hum', 40, 'over reserve'), item('shopVoices', 'hum', 25, 'exact reserve'),
    item('shopVoices', 'hum', 0, 'owned switch', { state: () => 'off' }),
    item('shopVoices', 'hum', 0, 'manual action', { auto: false })];
  assert.equal(runCaveShopping(S, choices, u => wallets[u], () => refreshed.push(true)), 1);
  assert.deepEqual(bought, ['exact reserve']); assert.equal(wallets.hum, 75); assert.equal(refreshed.length, 1);
  assert.equal(runCaveShopping(S, choices, u => wallets[u], () => {}), 0);
  S.caveAutomation.reserves.hum = 0;
  const all = Object.entries(CAVE_CATEGORIES).map(([key, { parent }], i) => {
    S.caveAutomation.categories[key] = true;
    const unit = ['hum', 'hum', 'hum', 'shard', 'shard', 'fossil', 'lumen', 'ivory', 'gilt'][i];
    return item(parent, unit, 1, key);
  });
  assert.equal(runCaveShopping(S, all, u => wallets[u], () => {}), 9);
  assert.deepEqual(bought.slice(1), Object.keys(CAVE_CATEGORIES));
});

test('failed placement tries another candidate without charging and refreshes between categories', () => {
  const S = fresh(); S.caveAutomation.unlocked = true; Object.assign(S.caveAutomation.categories, { wonders: true, attunement: true });
  S.shards = 10; let refreshes = 0;
  const buy = cost => { S.shards -= cost; return true; };
  const items = [{ parent: 'shopWonders', unit: 'shard', cost: () => 1, buy: () => false },
    { parent: 'shopWonders', unit: 'shard', cost: () => 2, buy: () => buy(2) },
    { parent: 'shopAttune', unit: () => 'shard', cost: () => refreshes ? 8 : 20, buy: () => buy(8) }];
  assert.equal(runCaveShopping(S, items, () => S.shards, () => refreshes++), 2);
  assert.equal(S.shards, 0); assert.equal(refreshes, 2);
});

test('automation unlock, selections and reserves persist through all resets; legacy settings are off', () => {
  let S = fresh(); S.hearts = 2; S.caveAutomation.unlocked = true;
  S.caveAutomation.categories.glow = true; S.caveAutomation.reserves.lumen = 12345;
  const keep = structuredClone(S.caveAutomation);
  resetDescent(S, 5); resetSounding(S, 5); S = resetHeartstone(S, '1.9.5');
  assert.deepEqual(S.caveAutomation, keep);
  assert.deepEqual(restoreState(serializeState(S, 10000), '1.9.5', catalog, 10000).state.caveAutomation, keep);
  assert.deepEqual(restoreState({ ver: '1.9.4', hum: 0 }, '1.9.5', catalog).state.caveAutomation, fresh().caveAutomation);
  S.caveAutomation = { unlocked: 'yes', categories: { glow: true, voices: 1 }, reserves: { hum: Infinity, lumen: -9, ivory: '300' } };
  normalizeCaveAutomation(S); assert.equal(S.caveAutomation.unlocked, false);
  assert.equal(S.caveAutomation.categories.voices, false); assert.equal(S.caveAutomation.categories.glow, true);
  assert(Object.values(S.caveAutomation.reserves).every(v => v === 0));
  assert.equal(CAVE_AUTOMATION_COST, 100000);
});

test('locked shop ledgers remain unavailable even when individual items have no gate', () => {
  const S = fresh(); S.caveAutomation.unlocked = true; S.caveAutomation.categories.glow = true;
  let count = 0;
  const items = [{ parent: 'shopGlow', unit: 'lumen', cost: () => 4, buy: () => { count++; return true; } }];
  assert.equal(runCaveShopping(S, items, () => 1000, () => {}, category => category.tab !== 'glow'), 0);
  assert.equal(count, 0);
  assert.equal(runCaveShopping(S, items, () => 1000, () => {}, () => true), 1);
});
