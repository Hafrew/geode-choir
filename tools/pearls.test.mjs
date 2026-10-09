import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/state.js';
import { rng32 } from '../src/horns.js';
import { PEARL_RARITY, PEARL_STATS, PEARL_SLOTS, PEARL_STAT_CAP, PEARL_FORM_SECONDS, freshPearls, pearlName,
  tickPearls, openOyster, makePearl, equipPearl, grindPearl, pearlBonuses, applyPearls, bestPearls, normalizePearls } from '../src/pearls.js';
import { serializeState, restoreState } from '../src/saves.js';
import { resetSounding, resetHeartstone } from '../src/progression.js';

const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} },
  TABS: ['cave', 'sea', 'horns'], GILT_CAP: 45, AWAY_CAP: 21600 };
const fresh = () => { const S = createState('1.10.4'); S.world = 'sea'; S.sea.unlocked = true; return S; };
const give = (S, rarity, random) => { let p; do { p = makePearl(S, random); } while (p.r !== rarity && (S.pearls.items.pop(), S.pearls.seq--, true)); return p; };

test('rarity odds sum to one and each rarity has the intended line count and size range', () => {
  assert.ok(Math.abs(PEARL_RARITY.reduce((a, r) => a + r.p, 0) - 1) < 1e-9);
  assert.deepEqual(PEARL_RARITY.map(r => r.lines), [1, 1, 2, 2, 3]);
  for (let i = 1; i < PEARL_RARITY.length; i++) assert.ok(PEARL_RARITY[i].mag[0] >= PEARL_RARITY[i - 1].mag[0]);
  assert.ok(PEARL_RARITY[4].mag[1] < 0.5, 'a single pearl line stays well under a horn');
});

test('a pearl forms after two minutes in the Sea and the next oyster reveals it, once', () => {
  const S = fresh(), random = rng32(3);
  assert.equal(openOyster(S, random), null);
  S.world = 'cave'; tickPearls(S, 500); assert.equal(S.pearls.nacre, 0);
  S.world = 'sea'; tickPearls(S, PEARL_FORM_SECONDS - 1); assert.equal(openOyster(S, random), null);
  tickPearls(S, 5);
  const found = openOyster(S, random);
  assert.ok(found && found.id === 1 && S.pearls.items.length === 1);
  assert.equal(S.pearls.nacre, 0); assert.equal(openOyster(S, random), null);
  assert.equal(S.pearls.opens, 4);
});

test('generation is deterministic for a seed and keeps lines distinct and in range', () => {
  const a = fresh(), b = fresh();
  for (let i = 0; i < 300; i++) { makePearl(a, rng32(100 + i)); makePearl(b, rng32(100 + i)); }
  assert.deepEqual(a.pearls, b.pearls);
  for (const p of a.pearls.items) {
    const spec = PEARL_RARITY[p.r];
    assert.equal(p.lines.length, spec.lines);
    assert.equal(new Set(p.lines.map(l => l.stat)).size, p.lines.length);
    for (const l of p.lines) { assert.ok(PEARL_STATS[l.stat]); assert.ok(l.v >= 1 + spec.mag[0] - 1e-9 && l.v <= 1 + spec.mag[1] + 1e-9); }
    assert.equal(p.name, pearlName(p.r, p.seed));
  }
});

test('the strand holds three pearls, bonuses multiply and are capped per stat', () => {
  const S = fresh();
  S.pearls.items = [1, 2, 3, 4].map(id => ({ id, r: 4, seed: id, name: '', lines: [{ stat: 'tide', v: 1.3 }, { stat: 'bell', v: 1.25 }, { stat: 'fathoms', v: 1.22 }] }));
  S.pearls.seq = 4;
  assert.equal(equipPearl(S, 1), true); assert.equal(equipPearl(S, 2), true); assert.equal(equipPearl(S, 3), true);
  assert.equal(equipPearl(S, 4), false); assert.equal(S.pearls.equipped.length, PEARL_SLOTS);
  const b = pearlBonuses(S);
  assert.equal(b.tide, PEARL_STAT_CAP);                       // 1.3^3 = 2.2 is capped
  assert.ok(Math.abs(b.fathoms - Math.min(PEARL_STAT_CAP, 1.22 ** 3)) < 1e-9);
  assert.equal(b.interf, 1); assert.equal(b.pearls, 1);
  assert.equal(equipPearl(S, 1), true); assert.equal(S.pearls.equipped.length, 2);   // take off
  const HB = { tide: 2, bell: 1, interf: 1, fathoms: 1, pearls: 1 };
  assert.equal(applyPearls(HB, S).tide > 2, true);
});

test('grinding removes the pearl and pays pearl dust', () => {
  const S = fresh(), random = rng32(9), p = give(S, 2, random);
  equipPearl(S, p.id);
  const dust = S.sea.pearls, got = grindPearl(S, p.id);
  assert.equal(got, PEARL_RARITY[2].dust);
  assert.equal(S.sea.pearls, dust + got); assert.equal(S.pearls.items.length, 0); assert.deepEqual(S.pearls.equipped, []);
  assert.equal(grindPearl(S, p.id), 0);
});

test('pearls survive Soundings and Heartstones while pearl dust resets with the Sounding', () => {
  const S = fresh(), random = rng32(21);
  give(S, 1, random); give(S, 0, random); equipPearl(S, 1);
  S.sea.pearls = 500; S.pearls.nacre = 40;
  const before = JSON.stringify(S.pearls);
  resetSounding(S, 100);
  assert.equal(S.sea.pearls, 0); assert.equal(JSON.stringify(S.pearls), before);
  const next = resetHeartstone(S, '1.10.4');
  assert.equal(JSON.stringify(next.pearls), before);
});

test('pearls save, load, and reject tampered data; names always come from the seed', () => {
  const S = fresh(), random = rng32(5);
  for (let i = 0; i < 6; i++) makePearl(S, random);
  equipPearl(S, 2); equipPearl(S, 4);
  S.pearls.nacre = 33; S.pearls.opens = 77;
  const back = restoreState(JSON.parse(JSON.stringify(serializeState(S))), '1.10.4', catalog).state;
  assert.deepEqual(back.pearls, S.pearls);
  const bad = JSON.parse(JSON.stringify(serializeState(S)));
  bad.pearls.items[0].name = '<img src=x onerror=alert(1)>';
  bad.pearls.items[1].lines[0].v = 99;                 // out of range: dropped
  bad.pearls.items[2].r = 17;                          // unknown rarity: dropped
  bad.pearls.items[3].id = bad.pearls.items[4].id;     // duplicate id: dropped
  bad.pearls.equipped = [1, 1, 2, 999, 3, 5, 6];
  bad.pearls.nacre = 'x'; bad.pearls.opens = -5;
  const got = restoreState(bad, '1.10.4', catalog).state.pearls;
  assert.equal(got.items.find(p => p.id === 1).name, pearlName(got.items.find(p => p.id === 1).r, got.items.find(p => p.id === 1).seed));
  assert.ok(!got.items.some(p => p.name.includes('<')));
  assert.equal(got.items.length, 3);                    // the out-of-range, unknown-rarity and duplicate items are gone
  assert.ok(got.equipped.every(id => got.items.some(p => p.id === id)) && got.equipped.length <= PEARL_SLOTS);
  assert.equal(got.nacre, 0); assert.equal(got.opens, 0);
  assert.ok(got.seq >= Math.max(...got.items.map(p => p.id)));
});

test('older saves without pearls start with an empty case', () => {
  const S = fresh(), data = serializeState(S); delete data.pearls;
  const got = restoreState(data, '1.10.4', catalog).state.pearls;
  assert.deepEqual(got, freshPearls());
});

test('bestPearls picks the strongest three by total value', () => {
  const S = fresh(), random = rng32(2);
  for (let i = 0; i < 20; i++) makePearl(S, random);
  const best = bestPearls(S), worth = id => S.pearls.items.find(p => p.id === id).lines.reduce((a, l) => a + Math.log(l.v), 0);
  assert.equal(best.length, PEARL_SLOTS);
  const cutoff = Math.min(...best.map(worth));
  for (const p of S.pearls.items) if (!best.includes(p.id)) assert.ok(worth(p.id) <= cutoff + 1e-12);
});
