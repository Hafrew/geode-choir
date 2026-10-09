import assert from 'node:assert/strict';
import test from 'node:test';
import { createState } from '../src/state.js';
import { RARITY, HSTATS, rarityOdds, visibleRarities, rollHornPlan, createHorn, rng32, traitValue,
  discoveryIvory, grantDiscoveryIvory, hornBonuses, lineValue, normalizeHornState, normalSlots, primordialSlots, soundingDifficulty } from '../src/horns.js';
import { resetDescent, resetSounding, resetHeartstone, decayTime, sunveinArrival } from '../src/progression.js';
import { serializeState, restoreState } from '../src/saves.js';
const fresh = () => createState('1.9.3');
const awakened = () => { const S = fresh(); Object.assign(S.hornUp, { rarity: 10, firstVoice: 1 }); return S; };
const horn = (id, trait, quality = 0.5, v = 10) => ({ id, r: 5, name: 'First Ram Horn', lines: [{ stat: 'hum', kind: 'pct', v }], trait: { id: trait, quality }, seed: id });
const close = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} != ${b}`);
const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} }, TABS: ['cave', 'sea', 'horns'], GILT_CAP: 45, AWAY_CAP: 21600 };

test('rarity curve stays normalized, reaches target, and gates Primordial independently of reveal', () => {
  const S = fresh();
  assert.deepEqual(rarityOdds(S), [.58, .27, .1, .04, .01]);
  for (let level = 0; level <= 10; level++) {
    S.hornUp.rarity = level;
    close(rarityOdds(S).reduce((a, p) => a + p, 0), 1);
    assert.equal(visibleRarities(S).length, level === 10 ? 6 : 5);
  }
  rarityOdds(S).forEach((p, i) => close(p, [.05, .25, .3, .25, .15][i]));
  assert.equal(primordialSlots(S), 0);
  S.hornUp.firstVoice = 1;
  rarityOdds(S).forEach((p, i) => close(p, [.05, .25, .28, .25, .15, .02][i]));
  assert.equal(primordialSlots(S), 2);
  S.hornUp.firstRack = 1;
  assert.equal(primordialSlots(S), 3);
});

test('seeded rolls match displayed odds and pity guarantees Epic without unlocking Primordial', () => {
  for (const S of [fresh(), awakened()]) {
    const counts = Array(6).fill(0), random = rng32(42), odds = rarityOdds(S);
    for (let i = 0; i < 60000; i++) { S.hornPity = 0; counts[rollHornPlan(S, 0, random).ri]++; }
    for (let i = 0; i < 6; i++) assert(Math.abs(counts[i] / 60000 - (odds[i] || 0)) < .006);
  }
  const S = fresh(); S.hornPity = 25;
  assert.equal(rollHornPlan(S, 0, rng32(1)).ri, 2);
  const min = rollHornPlan(S, 4, rng32(7));
  assert.equal(min.ri, 4);
});

test('level-zero horn rolls keep the legacy random draw order and outcomes', () => {
  // Independent legacy algorithm: protects the refactor from shifting existing seeded gameplay.
  function legacy(S, random) {
    let x = random(), ri = 0;
    for (; ri < 4; ri++) { if (x < RARITY[ri].p) break; x -= RARITY[ri].p; }
    if (S.hornPity >= 25) ri = Math.max(ri, 2);
    S.hornPity = ri >= 2 ? 0 : S.hornPity + 1;
    const R = RARITY[ri], keys = Object.keys(HSTATS), used = new Set(), lines = [];
    const n = Math.min(4, R.lines + (random() < S.hornUp.branch * .2 ? 1 : 0));
    while (lines.length < n) {
      const stat = keys[Math.floor(random() * keys.length)]; if (used.has(stat)) continue; used.add(stat);
      const st = HSTATS[stat], u = random(); let l;
      if (st.kind === 'scale') {
        if (R.mult && random() < R.multP) l = { stat, kind: 'mult', v: +(R.mult[0] + (R.mult[1] - R.mult[0]) * u).toFixed(2) };
        else l = { stat, kind: 'pct', v: Math.round(R.pct[0] + (R.pct[1] - R.pct[0]) * u) };
      } else l = { stat, kind: st.kind, v: Math.max(1, Math.round(st.per * R.flatK * (.6 + .8 * u))) };
      lines.push(l);
    }
    const plan = { ri, lines, perfs: [] };
    if (S.floor === 'sunvein' && S.world !== 'sea' && random() < .5 + .1 * S.goldUp.breath) plan.gold = true;
    return plan;
  }
  for (let seed = 1; seed <= 5; seed++) {
    const a = fresh(), b = fresh(), ra = rng32(seed), rb = rng32(seed);
    a.hornUp.branch = b.hornUp.branch = 3; a.floor = b.floor = 'sunvein';
    for (let i = 0; i < 1000; i++) assert.deepEqual(rollHornPlan(a, 0, ra), legacy(b, rb));
    assert.equal(ra(), rb());
  }
});

test('trait strength is continuous, choice requires 90%, and auto is average', () => {
  const plan = { ri: 5, lines: [{ stat: 'hum', kind: 'mult', v: 3 }], perfs: [] };
  for (const quality of [0, .25, .5, .75, .9, 1]) {
    const h = createHorn(awakened(), plan, [quality], 'golden', rng32(5));
    close(traitValue(h), ({ memory: 10, resonance: 10, golden: 25, undertow: 15 }[h.trait.id]) / 100 * (.5 + quality));
    if (quality >= .9) assert.equal(h.trait.id, 'golden');
  }
  assert.deepEqual(createHorn(awakened(), plan, [.8], 'golden', rng32(8)), createHorn(awakened(), plan, [.8], undefined, rng32(8)));
  const auto = createHorn(awakened(), plan, null, undefined, rng32(7));
  assert.equal(auto.trait.quality, .5); assert.equal(auto.lines[0].v, 3);
  const randomPoor = createHorn(awakened(), plan, [0], 'invalid', rng32(7));
  assert(['memory', 'resonance', 'golden', 'undertow'].includes(randomPoor.trait.id));
  const ordinary = soundingDifficulty({ ri: 4, perfs: [] }, 12);
  const primordial = soundingDifficulty({ ri: 5, perfs: [] }, 12);
  assert(primordial.hw < ordinary.hw); assert.equal(primordial.readyMs, 6000);
  assert.equal(soundingDifficulty({ ri: 5, perfs: [.5, .5] }, 12).readyMs, 8000);
});

test('traits use strongest copy, Resonance excludes its source and never amplifies traits', () => {
  const S = awakened(); S.hornUp.firstRack = 1;
  S.horns = [horn(1, 'resonance'), horn(2, 'resonance', 1), horn(3, 'undertow')];
  S.primordialEquipped = [1, 2, 3];
  const hb = hornBonuses(S);
  close(hb.traits.resonance, .15); close(hb.traits.undertow, .15); close(hb.tide, 1.15);
  close(lineValue(S, S.horns[0], S.horns[0].lines[0]), 11.5);
  close(lineValue(S, S.horns[1], S.horns[1].lines[0]), 10);
  close(lineValue(S, S.horns[2], S.horns[2].lines[0]), 11.5);
  close(decayTime(S, 1, .1), 600 / .9);
  close(sunveinArrival(5, .25), 6.25);
});

test('normal and Primordial capacities are independent and survive all resets and saves', () => {
  let S = awakened(); S.hornUp.firstRack = 1; S.hornUp.rack = 2;
  S.horns = [{ id: 9, r: 0, name: 'Plain Ram Horn', lines: [{ stat: 'hum', kind: 'pct', v: 10 }] }, horn(1, 'memory'), horn(2, 'golden'), horn(3, 'undertow')];
  S.equipped = [9, 1, 9]; S.primordialEquipped = [1, 2, 3, 9, 1];
  normalizeHornState(S);
  assert.deepEqual(S.equipped, [9]); assert.deepEqual(S.primordialEquipped, [1, 2, 3]); assert.equal(normalSlots(S), 3);
  const keep = structuredClone({ horns: S.horns, primordialEquipped: S.primordialEquipped, hornUp: S.hornUp });
  resetDescent(S, 10); resetSounding(S, 10); S = resetHeartstone(S, '1.9.3');
  assert.deepEqual({ horns: S.horns, primordialEquipped: S.primordialEquipped, hornUp: S.hornUp }, keep);
  const restored = restoreState(serializeState(S, 10000), '1.9.3', catalog, 10000).state;
  assert.deepEqual(restored.primordialEquipped, [1, 2, 3]); assert.deepEqual(restored.hornUp, S.hornUp);
  assert.deepEqual(restored.horns.map(h => h.trait), S.horns.map(h => h.trait));
});

test('legacy saves keep stats and complete pending soundings survive reload without new rolls', () => {
  const legacy = { ver: '1.6.0', hum: 123, fossils: 7, fossilsTotal: 12, horns: [{ id: 1, r: 0, name: 'Plain Ram Horn', lines: [{ stat: 'hum', kind: 'pct', v: 10 }] }], equipped: [1], saved: 10000 };
  const restored = restoreState(legacy, '1.9.3', catalog, 10000).state;
  assert.equal(restored.fossils, 7); assert.equal(restored.stats.fossilsLife, 12);
  assert.deepEqual(restored.horns[0].lines, legacy.horns[0].lines); assert.equal(restored.hornUp.rarity, 0);
  const S = awakened(); S.hornPlan = { ri: 5, lines: [{ stat: 'hum', kind: 'pct', v: 250 }], perfs: [.95], gold: true };
  const loaded = restoreState(serializeState(S, 10000), '1.9.3', catalog, 10000).state;
  assert.deepEqual(loaded.hornPlan, S.hornPlan);
  const corrupt = serializeState(S, 10000); corrupt.hornUp.rarity = 0; corrupt.hornUp.firstRack = 100;
  const clean = restoreState(corrupt, '1.9.3', catalog, 10000).state;
  assert.equal(clean.hornUp.firstVoice, 0); assert.equal(clean.hornUp.firstRack, 0);
});


test('ivory discovery pays once, upgrades from 5 to 30, and migration grants no catch-up rewards', () => {
  assert.deepEqual(RARITY.map(r => r.ivory), [3, 10, 35, 75, 250, 500]);
  let S = fresh(), h = horn(1, 'memory');
  assert.equal(grantDiscoveryIvory(S, h), 5);
  assert.equal(S.ivory, 5); assert.equal(S.stats.ivoryLife, 5);
  assert.equal(grantDiscoveryIvory(S, h), 0);
  S.hornUp.ivory = 5;
  assert.equal(discoveryIvory(S), 30);
  assert.equal(grantDiscoveryIvory(S, h), 0); // Raising the upgrade cannot repay an old horn.
  S.horns = [h];
  resetDescent(S, 1); resetSounding(S, 1); S = resetHeartstone(S, '1.9.3');
  assert.equal(discoveryIvory(S), 30);
  const loaded = restoreState(serializeState(S, 10000), '1.9.3', catalog, 10000).state;
  assert.equal(loaded.hornUp.ivory, 5);
  assert.equal(loaded.horns[0].ivoryFound, 5);
  assert.equal(grantDiscoveryIvory(loaded, loaded.horns[0]), 0);
  assert.equal(grantDiscoveryIvory(loaded, horn(2, 'undertow')), 30);
  assert.equal(loaded.ivory, 35); assert.equal(loaded.stats.ivoryLife, 35);
  const legacy = restoreState({ ver: '1.9.2', hum: 0, ivory: 123, stats: { ivoryLife: 456, hornsFound: 1000 }, horns: [horn(1, 'memory')] }, '1.9.3', catalog).state;
  assert.equal(legacy.ivory, 123); assert.equal(legacy.stats.ivoryLife, 456);
  assert.equal(legacy.hornUp.ivory, 0); assert.equal(legacy.horns[0].ivoryFound, undefined);
});

const ordinary = (id, stat = 'hum', v = 10, r = 0, gold = false) => ({ id, r, gold, name: `Ram Horn ${id}`, seed: id, lines: [{ stat, kind: 'pct', v }] });

test('automatic loadouts respect world priorities, caps, traits, separate racks, and stable ties', async () => {
  const { applyAutoEquip, loadoutScore } = await import('../src/horns.js');
  const S = awakened(); S.hornInventory.autoEquip = true;
  S.horns = [ordinary(1, 'hum', 300), ordinary(2, 'tide', 300), ordinary(3, 'hum', 1, 4),
    horn(4, 'memory'), horn(5, 'memory', .25), horn(6, 'resonance')];
  S.hornInventory.focus = 'cave'; applyAutoEquip(S);
  assert.deepEqual(S.equipped, [1]); assert.deepEqual(new Set(S.primordialEquipped), new Set([4, 6]));
  S.hornInventory.focus = 'sea'; applyAutoEquip(S); assert.deepEqual(S.equipped, [2]);
  const chosen = structuredClone({ equipped: S.equipped, primordialEquipped: S.primordialEquipped });
  assert.equal(applyAutoEquip(S), false); assert.deepEqual({ equipped: S.equipped, primordialEquipped: S.primordialEquipped }, chosen);
  S.hornInventory.focus = 'cave'; S.hornUp.rack = 1;
  S.horns = [ordinary(7, 'cost', 60), ordinary(8, 'cost', 60), ordinary(9, 'hum', 100)];
  S.equipped = [7, 8]; S.primordialEquipped = [];
  const before = loadoutScore(S); applyAutoEquip(S);
  assert(loadoutScore(S) > before); assert(S.equipped.includes(9));
  assert.equal(S.equipped.length, 2); assert.equal(new Set(S.equipped).size, 2);
  S.hornUp.rack = 0; S.equipped = [7]; S.horns = [ordinary(7), ordinary(8)];
  assert.equal(applyAutoEquip(S), false); assert.deepEqual(S.equipped, [7]);
});

test('filters affect new spare finds after auto-equip and require separate Gilded permission', async () => {
  const { applyAutoEquip, acquireHorn } = await import('../src/horns.js');
  const S = fresh(); S.hornInventory.autoEquip = true; S.hornInventory.focus = 'cave';
  S.horns = [ordinary(1, 'hum', 10)]; S.equipped = [1]; S.hornInventory.salvage[0] = true;
  applyAutoEquip(S); assert.equal(S.horns.length, 1); // No retroactive salvage.
  const better = ordinary(2, 'hum', 30); grantDiscoveryIvory(S, better); acquireHorn(S, better);
  assert.deepEqual(S.equipped, [2]); assert.equal(better.salvaged, undefined); assert.equal(S.horns.length, 2);
  const weak = ordinary(3, 'hum', 1); grantDiscoveryIvory(S, weak); acquireHorn(S, weak);
  assert.equal(weak.salvageReason, 'filter'); assert.equal(S.ivory, 13); assert.equal(S.stats.ivoryLife, 13);
  const gold = ordinary(4, 'hum', 1, 0, true); acquireHorn(S, gold); assert(S.horns.includes(gold));
  S.hornInventory.gilded = true;
  const goldSpare = ordinary(5, 'hum', 1, 0, true); acquireHorn(S, goldSpare); assert.equal(goldSpare.salvageReason, 'filter');
  const rare = ordinary(6, 'hum', 1, 1, true); acquireHorn(S, rare); assert(S.horns.includes(rare));
  S.hornInventory.autoEquip = false; S.equipped = [];
  const filtered = ordinary(7); acquireHorn(S, filtered); assert.equal(filtered.salvageReason, 'filter'); assert.deepEqual(S.equipped, []);
});

test('full inventory keeps automatic upgrades, protects worn and Gilded horns, and retains default behavior', async () => {
  const { acquireHorn } = await import('../src/horns.js');
  const S = fresh(); S.hornInventory.autoEquip = true; S.hornInventory.focus = 'cave';
  S.horns = [ordinary(1, 'hum', 10), ordinary(2, 'hum', 1, 0, true), ordinary(3, 'hum', 2)]; S.equipped = [1];
  const upgrade = ordinary(4, 'hum', 100); acquireHorn(S, upgrade, 3);
  assert.deepEqual(S.equipped, [4]); assert.deepEqual(S.horns.map(h => h.id), [1, 2, 4]);
  assert.equal(upgrade.replacedHorn.ivory, 3); assert.equal(S.ivory, 3);
  S.horns.forEach(h => h.gold = true);
  const protectedUpgrade = ordinary(5, 'hum', 200); acquireHorn(S, protectedUpgrade, 3);
  assert.equal(protectedUpgrade.salvageReason, 'full'); assert.deepEqual(S.equipped, [4]); assert.equal(S.horns.length, 3);
  S.hornInventory.salvage[0] = true; S.hornInventory.gilded = true;
  const allowedUpgrade = ordinary(6, 'hum', 300); acquireHorn(S, allowedUpgrade, 3);
  assert.equal(allowedUpgrade.salvaged, undefined); assert.deepEqual(S.equipped, [6]); assert.equal(S.horns.length, 3);
  const defaults = fresh(); defaults.horns = [ordinary(1)]; defaults.equipped = [1];
  const incoming = ordinary(2, 'hum', 1000, 4); acquireHorn(defaults, incoming, 1);
  assert.equal(incoming.salvageReason, 'full'); assert.deepEqual(defaults.equipped, [1]); assert.equal(defaults.ivory, 250);
});

test('inventory automation survives resets/reload and legacy saves default to manual rules', async () => {
  let S = awakened(); S.hornInventory = { autoEquip: true, focus: 'sea', salvage: [true, true, false, false, false, true], gilded: true };
  const keep = structuredClone(S.hornInventory);
  resetDescent(S, 5); resetSounding(S, 5); S = resetHeartstone(S, '1.9.4');
  assert.deepEqual(S.hornInventory, keep);
  assert.deepEqual(restoreState(serializeState(S, 10000), '1.9.4', catalog, 10000).state.hornInventory, keep);
  assert.deepEqual(restoreState({ ver: '1.9.3', hum: 0 }, '1.9.4', catalog).state.hornInventory, fresh().hornInventory);
  S.hornInventory = { autoEquip: 'false', focus: 'bogus', salvage: [1, true], gilded: 'false' }; normalizeHornState(S);
  assert.deepEqual(S.hornInventory, { autoEquip: false, focus: 'balanced', salvage: [false, true, false, false, false, false], gilded: false });
});
