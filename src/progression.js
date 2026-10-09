import { freshCave, freshSea, createState } from './state.js';
import { shellDiscounts } from './seashells.js';
const KNEE = 10;
const SEA_MILESTONES = [2, 5, 10, 20];
const FINALE_SOUNDINGS = 36;
const FINALE_HEARTS = 5;
const SONG_FATHOMS = 50000;
const PLUMB_STEP = 1.2;
// Sunvein bad-luck protection: each eligible descent without a Sunvein adds a step to the chance (up to a maximum),
// and the 30th such descent is a Sunvein.
const SUN_PITY_STEP = 0.01, SUN_PITY_MAX = 0.05, SUN_GUARANTEE = 30;
const sunPityBonus = dry => Math.min(SUN_PITY_MAX, SUN_PITY_STEP * Math.max(0, Math.floor(dry) || 0));
const sunveinRoll = (dry, chance, roll) => (Math.max(0, Math.floor(dry) || 0) + 1 >= SUN_GUARANTEE) || roll < chance + sunPityBonus(dry);
const CEILING_MAX = 15;
const CEILING_BASE = 1500, CEILING_GROWTH = 3.5;
const seaLock = soundings => Math.max(120, 600 - 120 * SEA_MILESTONES.filter(n => soundings >= n).length);
function advanceSeaTimer(S, seconds, tickRate = 1, efficiency = 1) {
  S.sea.cool = Math.max(0, S.sea.cool - Math.max(0, seconds) * tickRate * efficiency);
}
function resetDescent(S, got, fall = 0, vein = 0) {
  const keep = {
    depth: S.depth + 1 + fall, fossils: S.fossils + got + vein, fossilsTotal: S.fossilsTotal + got + vein, strata: S.strata,
    lumen: S.lumen, lumenTotal: S.lumenTotal, illum: S.illum, toggles: S.toggles, idleRate: S.idleRate, lumenIdle: S.lumenIdle,
  };
  Object.assign(S, freshCave(), keep);
}
function resetSounding(S, got) {
  const q = S.sea;
  const keep = {
    unlocked: true, soundings: q.soundings + 1, fathoms: q.fathoms + got, fathomsTotal: q.fathomsTotal + got,
    deep: q.deep, choir: q.choir, total: q.total, idleRate: q.idleRate, throws: q.throws,
    cool: seaLock(q.soundings + 1), coolTotal: seaLock(q.soundings + 1),
  };
  S.stats.bestFathomHaul = Math.max(S.stats.bestFathomHaul, got);
  S.sea = Object.assign(freshSea(), keep);
}
function resetHeartstone(S, version) {
  const keep = {
    total: S.total, world: 'sea', hearts: S.hearts + 1,
    caveAutomation: S.caveAutomation,
    shells: S.shells, pearls: S.pearls,
    horns: S.horns, coll: S.coll, hornQueue: S.hornQueue, hornPlan: S.hornPlan, hornAuto: S.hornAuto, hornInventory: S.hornInventory, gilt: S.gilt, goldUp: S.goldUp, equipped: S.equipped, primordialEquipped: S.primordialEquipped, hornPity: S.hornPity, ver: S.ver, seenVer: S.seenVer, refund: S.refund, hornSeq: S.hornSeq, hornBuys: S.hornBuys, hornsOn: true, hornTimer: S.hornTimer,
    ivory: S.ivory, hornUp: S.hornUp, sea: S.sea, seen: S.seen, muted: S.muted, fx: S.fx, theme: S.theme, ts: S.ts, numfmt: S.numfmt, finale: S.finale, quests: S.quests, shouts: S.shouts, tab: 'sea',
    lore: S.lore, feats: S.feats, stats: S.stats,
  };
  keep.sea.unlocked = true;
  return Object.assign(createState(version), keep);
}
function decayTime(S, floorTau, memory = 0) {
  return 600 * (S.hearts >= 2 ? 2 : 1) * (1 + 0.25 * Math.max(0, S.hearts - 3)) * floorTau / (1 - memory);
}
function sunveinArrival(base, golden = 0) { return base * (1 + golden); }
const depthThreshold = S => 2e4 * Math.pow(3.5, S.depth) * (S.rubble ? 1.5 : 1);
const seaThreshold = S => 5e4 * Math.pow(3, S.sea.soundings);
const soundingReady = S => S.sea.unlocked && S.sea.cool <= 0 && S.sea.run >= seaThreshold(S);
const bend = r => r <= 1 ? 1 : Math.pow(r, 0.3662);
const FATHOM_EXPONENT = 0.25;
// Settling forces overrun: after 10,000×, logarithmic growth limits camping windfalls.
const fathomBend = ratio => ratio <= 1e4 ? Math.pow(ratio, FATHOM_EXPONENT) : Math.min(Math.pow(ratio, FATHOM_EXPONENT), 10 * (1 + Math.log10(ratio / 1e4)));
function fossilReward(S, bonus, floorMultiplier, sunBonus) {
  const need = depthThreshold(S);
  return S.run < need ? 0 : Math.floor((1 + 0.5 * S.depth) * 2 * bend(S.run / need)
    * Math.pow(1.25, S.strata.record) * bonus * floorMultiplier * sunBonus);
}
function fathomReward(S, bonus) {
  const q = S.sea, need = seaThreshold(S);
  return q.run < need ? 0 : Math.floor((1 + 0.5 * q.soundings) * 2 * fathomBend(q.run / need) * Math.pow(PLUMB_STEP, q.deep.record) * bonus);
}
const HEART_LUMEN_GROWTH = 25;
const heartLumenCost = (S, omen) => 1e7 * Math.pow(HEART_LUMEN_GROWTH, S.hearts) * omen.lumen;
const heartDepthRequired = (S, omen) => Math.max(1, 12 + 22 * S.hearts + omen.depth - shellDiscounts(S).depth);
const heartSeaBaseline = hearts => hearts === 0 ? 0 : 20 + 4 * (hearts - 1);
const heartSeaRequired = S => {
  if (S.hearts === 0) return 0;
  const grace = S.heartSeaLegacy;
  const baseline = grace && grace.hearts === S.hearts ? grace.required : heartSeaBaseline(S.hearts);
  return Math.max(1, baseline - shellDiscounts(S).soundings);
};
const kindleReady = (S, omen) => S.lumen >= heartLumenCost(S, omen) && S.depth >= heartDepthRequired(S, omen) && S.sea.soundings >= heartSeaRequired(S);
export { KNEE, resetDescent, resetSounding, resetHeartstone, decayTime, sunveinArrival,
  SEA_MILESTONES, FINALE_SOUNDINGS, FINALE_HEARTS, HEART_LUMEN_GROWTH, PLUMB_STEP, SUN_PITY_STEP, SUN_PITY_MAX, SUN_GUARANTEE, sunPityBonus, sunveinRoll, SONG_FATHOMS, CEILING_MAX, CEILING_BASE, CEILING_GROWTH,
  seaLock, advanceSeaTimer, soundingReady, heartSeaBaseline,
  depthThreshold, seaThreshold, fossilReward, fathomReward, FATHOM_EXPONENT, heartLumenCost, heartDepthRequired, heartSeaRequired, kindleReady };
