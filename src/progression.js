import { freshCave, freshSea, createState } from './state.js';
const KNEE = 10;
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
  };
  S.stats.bestFathomHaul = Math.max(S.stats.bestFathomHaul, got);
  S.sea = Object.assign(freshSea(), keep);
}
function resetHeartstone(S, version) {
  const keep = {
    total: S.total, world: 'sea', hearts: S.hearts + 1,
    caveAutomation: S.caveAutomation,
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
const seaThreshold = S => 5e4 * Math.pow(4, S.sea.soundings);
const bend = r => r <= 1 ? 1 : Math.pow(r, 0.3662);
function fossilReward(S, bonus, floorMultiplier, sunBonus) {
  const need = depthThreshold(S);
  return S.run < need ? 0 : Math.floor((1 + 0.5 * S.depth) * 2 * bend(S.run / need)
    * Math.pow(1.25, S.strata.record) * bonus * floorMultiplier * sunBonus);
}
function fathomReward(S, bonus) {
  const q = S.sea, need = seaThreshold(S);
  return q.run < need ? 0 : Math.floor((1 + 0.5 * q.soundings) * 2 * bend(q.run / need) * Math.pow(1.25, q.deep.record) * bonus);
}
const heartLumenCost = (S, omen) => 1e7 * Math.pow(10, S.hearts) * omen.lumen;
const heartDepthRequired = (S, omen) => 12 + 22 * S.hearts + omen.depth;
const heartSeaRequired = S => 2 * S.hearts;
const kindleReady = (S, omen) => S.lumen >= heartLumenCost(S, omen) && S.depth >= heartDepthRequired(S, omen) && S.sea.soundings >= heartSeaRequired(S);
export { KNEE, resetDescent, resetSounding, resetHeartstone, decayTime, sunveinArrival,
  depthThreshold, seaThreshold, fossilReward, fathomReward, heartLumenCost, heartDepthRequired, heartSeaRequired, kindleReady };
