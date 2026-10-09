import assert from 'node:assert/strict';
import test from 'node:test';
import { createState } from '../src/state.js';
import { SHELL_RARITIES, shellDepth, shellSlots, shellDiscoveryChance, shellDiscounts,
  normalizeShells, equipShell, discoverShell, finishShell } from '../src/seashells.js';
import { resetDescent, resetSounding, resetHeartstone, heartDepthRequired, heartSeaRequired,
  kindleReady, seaThreshold, depthThreshold, fathomReward, fossilReward } from '../src/progression.js';
import { serializeState, restoreState } from '../src/saves.js';
import { rng32 } from '../src/horns.js';
const fresh = () => createState('1.9.8');
const omen = { depth: 0, lumen: 1 };
const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} },
  TABS: ['cave', 'sea', 'horns'], GILT_CAP: 45, AWAY_CAP: 21600 };

test('quality changes depth only, Auto is 1/3/8, and rarity fixes sounding discounts', () => {
  assert.deepEqual([0, 1, 2].map(r => shellDepth(r)), [1, 3, 8]);
  assert.deepEqual([0, 1, 2].map(r => SHELL_RARITIES[r].soundings), [0, 1, 3]);
  for (let r = 0; r < 3; r++) {
    for (const q of [-1, 0, .25, .5, .75, 1, 2]) {
      const depth = shellDepth(r, q), rarity = SHELL_RARITIES[r];
      assert(depth >= rarity.minDepth && depth <= rarity.maxDepth);
      const S = fresh();
      S.shells.items = [{ id: 1, r, depth }]; S.shells.equipped = [1];
      S.hornUp.whet = 100; S.hornUp.rarity = 10;
      assert.deepEqual(shellDiscounts(S), { depth, soundings: rarity.soundings });
      S.shells.discovery = 6;
      assert.deepEqual(shellDiscounts(S), { depth, soundings: rarity.soundings });
    }
  }
  assert.deepEqual([0, 1, 2].map(r => shellDepth(r, 0)), [1, 2, 5]);
  assert.deepEqual([0, 1, 2].map(r => shellDepth(r, 1)), [1, 4, 10]);
});

test('one slot upgrades to two; distinct duplicate-rarity shells stack, spares do not', () => {
  const S = fresh();
  S.shells.items = [{ id: 1, r: 2, depth: 10 }, { id: 2, r: 2, depth: 10 }, { id: 3, r: 1, depth: 4 }];
  assert.equal(shellSlots(S), 1);
  assert(equipShell(S, 1)); assert.equal(equipShell(S, 2), false);
  assert.deepEqual(shellDiscounts(S), { depth: 10, soundings: 3 });
  S.shells.extraSlot = 1;
  assert(equipShell(S, 2)); assert.equal(equipShell(S, 3), false);
  assert.deepEqual(shellDiscounts(S), { depth: 20, soundings: 6 });
  assert.equal(equipShell(S, 999), false);
  assert(equipShell(S, 1));
  assert.deepEqual(shellDiscounts(S), { depth: 10, soundings: 3 });
  S.shells.equipped = [2, 2];
  assert.deepEqual(shellDiscounts(S), { depth: 10, soundings: 3 });
});

test('shells discount Heartstone eligibility without adding depth, soundings, or rewards', () => {
  const S = fresh();
  S.hearts = 1; S.depth = 26; S.lumen = 1e8; S.sea.soundings = 17;
  S.shells.items = [{ id: 1, r: 2, depth: 8 }];
  const before = { depth: S.depth, soundings: S.sea.soundings, fossils: S.fossils, fathoms: S.sea.fathoms };
  assert.equal(kindleReady(S, omen), false);
  equipShell(S, 1);
  assert.equal(heartDepthRequired(S, omen), 26);
  assert.equal(heartSeaRequired(S), 17);
  assert.equal(kindleReady(S, omen), true);
  assert.deepEqual({ depth: S.depth, soundings: S.sea.soundings, fossils: S.fossils, fathoms: S.sea.fathoms }, before);
  S.hearts = 0;
  assert.equal(heartSeaRequired(S), 0);
  S.shells.items.push({ id: 2, r: 2, depth: 10 }); S.shells.extraSlot = 1; equipShell(S, 2);
  assert.equal(heartDepthRequired(S, omen), 1);
});

test('discovery has conditional 75/20/5 rarity, 20% to 50% chance, and once-only results', () => {
  for (const discovery of [0, 6]) {
    const S = fresh(), random = rng32(37), counts = [0, 0, 0, 0]; S.shells.discovery = discovery;
    assert.equal(shellDiscoveryChance(S), discovery ? .5 : .2);
    for (let i = 1; i <= 30000; i++) {
      S.sea.soundings = i;
      const plan = discoverShell(S, random);
      counts[plan ? plan.r + 1 : 0]++;
      if (plan) finishShell(S, plan.id);
      assert.equal(discoverShell(S, () => { throw Error('reroll'); }), null);
    }
    const chance = shellDiscoveryChance(S), expected = [1 - chance, chance * .75, chance * .2, chance * .05];
    counts.forEach((n, i) => assert(Math.abs(n / 30000 - expected[i]) < .008));
  }
  const S = fresh();
  assert.equal(discoverShell(S, () => { throw Error('first Sea entry is not a sounding'); }), null);
  S.sea.soundings = 1;
  assert.equal(discoverShell(S, () => .9), null);
  assert.equal(discoverShell(S, () => { throw Error('failed discovery rerolled'); }), null);
});

test('pending discoveries and finished potency survive saves and every progression reset', () => {
  let S = fresh(); S.sea.soundings = 1; S.shells.discovery = 6; S.shells.extraSlot = 1;
  const rolls = [0, .99], plan = discoverShell(S, () => rolls.shift());
  assert.equal(plan.r, 2);
  S = restoreState(serializeState(S), '1.9.8', catalog).state;
  assert.deepEqual(S.shells.pending, [plan]);
  assert.equal(discoverShell(S, () => { throw Error('reload reroll'); }), null);
  const item = finishShell(S, plan.id, .75);
  assert.equal(item.depth, 9); assert.equal(finishShell(S, plan.id, 0), null);
  equipShell(S, item.id);
  S.sea.soundings = 2;
  const second = discoverShell(S, () => 0);
  const saved = structuredClone(S.shells), horns = structuredClone(S.horns);
  resetDescent(S, 4); assert.deepEqual(S.shells, saved);
  resetSounding(S, 5); assert.deepEqual(S.shells, saved);
  S = resetHeartstone(S, '1.9.8'); assert.deepEqual(S.shells, saved);
  S = restoreState(serializeState(S), '1.9.8', catalog).state;
  assert.deepEqual(S.shells.items, [item]); assert.deepEqual(S.shells.pending, [second]);
  assert.deepEqual(S.shells.equipped, [item.id]); assert.equal(S.shells.discovery, 6);
  assert.equal(S.shells.extraSlot, 1); assert.deepEqual(S.horns, horns);
});

test('migration grants no shells; normalization rejects malformed IDs, potency, and plans', () => {
  const S = restoreState({ ver: '1.9.5', hum: 1, sea: { soundings: 12, fathoms: 777 } }, '1.9.8', catalog).state;
  assert.equal(S.sea.fathoms, 777); assert.equal(S.sea.soundings, 12);
  assert.deepEqual(S.shells.items, []); assert.equal(S.shells.lastSounding, 12);
  assert.equal(discoverShell(S, () => { throw Error('retroactive discovery'); }), null);
  S.shells = { discovery: 99, extraSlot: 99, seq: 0,
    items: [null, { id: 1, r: 2, depth: 10 }, { id: 1, r: 0, depth: 1 }, { id: 2, r: 2, depth: 50 }, { id: 9, r: 'length', depth: 7 }],
    equipped: [1, 1, 999], pending: [null, { id: 1, r: 1, sounding: 2 }, { id: 3, r: 2, sounding: 12 }, { id: 4, r: 1, sounding: 12 }, { id: 5, r: 0, sounding: 13 }] };
  normalizeShells(S);
  assert.equal(S.shells.seq, 3); assert.equal(S.shells.discovery, 6); assert.equal(S.shells.extraSlot, 1);
  assert.deepEqual(S.shells.items, [{ id: 1, r: 2, depth: 10 }]);
  assert.deepEqual(S.shells.equipped, [1]); assert.deepEqual(S.shells.pending, [{ id: 3, r: 2, sounding: 12 }]);
});

test('harsher fathoms preserve the threshold payout and fossil curve, and increase monotonically', () => {
  const S = fresh(); S.sea.soundings = 4; S.sea.deep.record = 3; S.depth = 8; S.strata.record = 2;
  const seaNeed = seaThreshold(S), caveNeed = depthThreshold(S), bonus = 1.35;
  S.sea.run = seaNeed - 1; assert.equal(fathomReward(S, bonus), 0);
  let previous = 0;
  for (const [ratio, factor] of [[1, 1], [2, 2 ** .25], [10, 10 ** .25], [100, 100 ** .25], [10000, 10], [1e8, 50]]) {
    S.sea.run = seaNeed * ratio; S.run = caveNeed * ratio;
    const reward = fathomReward(S, bonus);
    assert(reward >= previous); previous = reward;
    assert.equal(reward, Math.floor(6 * factor * 1.25 ** 3 * bonus));
    assert(reward <= Math.floor(6 * ratio ** .3662 * 1.25 ** 3 * bonus));
    assert.equal(fossilReward(S, bonus, 1, 1), Math.floor(10 * ratio ** .3662 * 1.25 ** 2 * bonus));
  }
});
