import { createState, freshStats, freshSea } from './state.js';
import { RARITY, HSTATS, hash32, famOf, recordCollection, normalizeHornState } from './horns.js';
import { KNEE } from './progression.js';
const cmpVer = (a, b) => {
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d < 0 ? -1 : 1; }
  return 0;
};
function serializeState(S, now = Date.now()) {
  const q = S.sea;
  return {
    ...S,
    crystals: S.crystals.map(c => ({ t: c.t, x: c.x, y: c.y, strain: c.strain || 0 })),
    wonders: S.wonders.map(o => ({ k: o.k, x: o.x, y: o.y, charge: o.charge || 0 })),
    sea: {
      ...q,
      bells: q.bells.map(b => ({ bt: b.bt, x: b.x, y: b.y })),
      oysters: q.oysters.map(o => ({ oy: 1, x: o.x, y: o.y, wash: o.wash || 0 })),
      objs: q.objs.map(o => ({ pk: o.pk, x: o.x, y: o.y })),
    },
    saved: now,
  };
}
function mergeObj(def, got) { return Object.assign(def, got && typeof got === 'object' ? got : {}); }
function fixArr(a) { const r = Array.isArray(a) ? a.slice(0, 4) : []; while (r.length < 4) r.push(0); return r; }
// 1.1.0 soft-capped four multipliers and shrank Wide Cavern. Levels past the knee now give about half
// the bonus, and each Wide Cavern level gives 3 slots instead of 4, so hand back that share of what was spent.
function migrate(d, from) {
  if (cmpVer(from, '1.1.0') >= 0) return null;
  const spent = (base, g, from0, to) => { let t = 0; for (let i = from0; i < to; i++) t += Math.ceil(base * Math.pow(g, i)); return t; };
  const lost = b => 1 - Math.log(1 + (b - 1) / 2) / Math.log(b);
  const n = v => Math.max(0, Math.floor(+v || 0));
  const st = d.strata || {}, il = d.illum || {}, sea = d.sea || {}, dp = sea.deep || {};
  const fossils = Math.round(lost(1.3) * spent(2, 1.9, KNEE, n(st.old)) + 0.25 * spent(5, 2.4, 0, n(st.wide)));
  const lumen = Math.round(lost(1.3) * spent(8, 2.3, KNEE, n(il.lantern)) + lost(1.35) * spent(12, 2, KNEE, n(il.silk)));
  const fathoms = Math.round(lost(1.3) * spent(2, 1.9, KNEE, n(dp.current)));
  if (!(fossils || lumen || fathoms)) return null;
  d.fossils = n(d.fossils) + fossils;
  d.lumen = (+d.lumen || 0) + lumen;
  if (d.sea) d.sea.fathoms = n(d.sea.fathoms) + fathoms;
  return { fossils, lumen, fathoms };
}
function restoreState(data, VERSION, { WONDERS, PEARLOBJ, FLOORS, OMENS, TABS, GILT_CAP, AWAY_CAP }, now = Date.now()) {
  if (!data || typeof data.hum !== 'number') return null;
  const d = structuredClone(data), from = d.ver || '1.0.0';
  const fresh = () => createState(VERSION);
  const refund = migrate(d, from);
  const f = fresh();
  const S = Object.assign(f, d);
  S.ver = VERSION;
  S.seenVer = d.seenVer || from;
  S.refund = refund || d.refund || null;
  S.hornPity = Math.max(0, +d.hornPity || 0);
  for (const k of ['lv', 'strata', 'illum', 'toggles', 'wBought', 'hornUp']) S[k] = mergeObj(fresh()[k], d[k]);
  S.bought = fixArr(d.bought); S.attune = fixArr(d.attune);
  S.seen = d.seen || {};
  S.lore = d.lore && typeof d.lore === 'object' ? d.lore : {};
  S.feats = d.feats && typeof d.feats === 'object' ? d.feats : {};
  S.stats = mergeObj(freshStats(), d.stats);
  // Lifetime counters that older saves did not keep: start from what the save still knows.
  S.stats.fossilsLife = Math.max(+S.stats.fossilsLife || 0, +d.fossilsTotal || 0);
  S.stats.lumenLife = Math.max(+S.stats.lumenLife || 0, +d.lumenTotal || 0);
  S.stats.ivoryLife = Math.max(+S.stats.ivoryLife || 0, +d.ivory || 0);
  // Saves from before the Chronicle: rebuild what the stats can tell us.
  S.stats.maxDepth = Math.max(S.stats.maxDepth, S.depth || 0);
  S.stats.descents = Math.max(S.stats.descents || 0, S.stats.maxDepth);
  if (Array.isArray(d.horns)) {
    S.stats.hornsFound = Math.max(S.stats.hornsFound, d.horns.length);
    for (const h of d.horns) if (h && RARITY[h.r]) S.stats.bestHorn = Math.max(S.stats.bestHorn, h.r);
  }
  if (!Array.isArray(S.crystals) || !S.crystals.length) S.crystals = fresh().crystals;
  S.wonders = Array.isArray(S.wonders) ? S.wonders.filter(o => WONDERS[o.k]) : [];
  S.horns = Array.isArray(S.horns) ? S.horns.filter(h => h && RARITY[h.r] && Array.isArray(h.lines)) : [];
  S.coll = S.coll && typeof S.coll === 'object' && !Array.isArray(S.coll) ? S.coll : {};
  S.hornQueue = Math.max(0, Math.min(9, Math.floor(+S.hornQueue) || 0));
  S.hornAuto = !!S.hornAuto;
  if (S.floor !== 'sunvein' && !FLOORS[S.floor]) S.floor = 'still';
  if (S.depth < 3 && S.floor !== 'still') S.floor = 'still';
  S.gilt = Math.max(0, +S.gilt || 0); S.giltFloor = Math.max(0, Math.min(GILT_CAP, +S.giltFloor || 0));
  S.goldUp = { vein: Math.max(0, Math.min(4, Math.floor(+(S.goldUp && S.goldUp.vein)) || 0)), breath: Math.max(0, Math.min(5, Math.floor(+(S.goldUp && S.goldUp.breath)) || 0)) };
  {
    const pl = S.hornPlan;
    const ok = pl && typeof pl === 'object' && RARITY[pl.ri] && Array.isArray(pl.lines) && pl.lines.length >= 1 && pl.lines.length <= 4
      && pl.lines.every(l => l && HSTATS[l.stat] && typeof l.v === 'number') && Array.isArray(pl.perfs) && pl.perfs.length <= pl.lines.length;
    S.hornPlan = ok ? { ri: pl.ri, lines: pl.lines.map(l => ({ stat: l.stat, kind: l.kind, v: l.v })), perfs: pl.perfs.map(x => Math.max(0, Math.min(1, +x || 0))), ...(pl.gold ? { gold: true } : {}) } : null;
  }
  for (const h of S.horns) { if (!h.seed) h.seed = hash32(h.id * 0x9E3779B1 + h.r * 7919) || 1; }
  for (const h of S.horns) { const k = famOf(h) + ':' + (h.gold ? 'g' : h.r); if (!S.coll[k]) recordCollection(S, h); }
  normalizeHornState(S);
  const fs = freshSea(), ds = d.sea || {};
  S.sea = Object.assign(fs, ds);
  for (const k of ['lv', 'deep', 'choir', 'pBought']) S.sea[k] = mergeObj(freshSea()[k], ds[k]);
  S.sea.bought = fixArr(ds.bought); S.sea.tune = fixArr(ds.tune);
  if (!Array.isArray(S.sea.bells) || !S.sea.bells.length) S.sea.bells = freshSea().bells;
  S.sea.oysters = Array.isArray(S.sea.oysters) ? S.sea.oysters : [];
  S.sea.objs = Array.isArray(S.sea.objs) ? S.sea.objs.filter(o => PEARLOBJ[o.pk]) : [];
  if (S.world !== 'sea' || !S.sea.unlocked) S.world = 'cave';
  if (!TABS.includes(S.tab)) S.tab = S.world;
  if (!['auto', 'full', 'calm'].includes(S.fx)) S.fx = 'auto';
  if (!['dark', 'light', 'system'].includes(S.theme)) S.theme = 'dark';
  if (![0.9, 1, 1.15, 1.3].includes(S.ts)) S.ts = 1;
  if (!['short', 'sci'].includes(S.numfmt)) S.numfmt = 'short';
  S.finale = Math.max(0, +d.finale || 0);
  if (!OMENS[S.omen]) S.omen = 'steady';
  S.rubble = d.rubble ? 1 : 0;
  S.cool = Math.max(0, +d.cool || 0);
  S.age = Math.max(0, +d.age || 0); S.wind = d.wind ? 1 : 0;
  S.quests = d.quests && typeof d.quests === 'object' ? d.quests : {};
  return { state: S, away: Math.max(0, Math.min((now - (d.saved || now)) / 1000, AWAY_CAP)) };
}

export { serializeState, restoreState, cmpVer };
