import { hash32, rng32 } from './horns.js';

// Pearl items: found in oysters, kept through Soundings and Heartstones, worn on a strand for small Sea bonuses.
// Pearl dust (the old pearl currency, `S.sea.pearls`) is separate and still resets with each Sounding.
const PEARL_RARITY = [
  { name: 'Common',    col: '#bdb5cc', p: 0.62,  lines: 1, mag: [0.02, 0.05], dust: 5 },
  { name: 'Rare',      col: '#7fb8ff', p: 0.26,  lines: 1, mag: [0.05, 0.09], dust: 15 },
  { name: 'Epic',      col: '#b58cff', p: 0.09,  lines: 2, mag: [0.09, 0.15], dust: 45 },
  { name: 'Legendary', col: '#ffcf86', p: 0.025, lines: 2, mag: [0.15, 0.22], dust: 120 },
  { name: 'Mythic',    col: '#ff8fa3', p: 0.005, lines: 3, mag: [0.22, 0.32], dust: 400 },
];
// Sea-only stats that already exist in the horn bonus table, so pearls plug into the same places.
const PEARL_STATS = {
  tide: 'Tide', bell: 'Bell value', interf: 'Crossing bonus', fathoms: 'Fathoms', pearls: 'Pearl dust from oysters',
};
const PEARL_SLOTS = 3;
const PEARL_STAT_CAP = 1.6;          // the strand can raise any one stat by at most 60%
// Oysters open thousands of times an hour, so finds are limited by time, not by chance per opening: a pearl forms
// every two minutes spent in the Sea, and the next oyster to open reveals it.
const PEARL_FORM_SECONDS = 120;
const KINDS = ['Slag', 'Foundry', 'Tidal', 'Bell', 'Brine', 'Moon'];
const ADJ = [
  ['Dull', 'Plain', 'Dusky', 'Grey'],
  ['Pale', 'Smooth', 'Milky', 'Soft'],
  ['Lustrous', 'Banded', 'Shimmering', 'Deep'],
  ['Radiant', 'Gilded', 'Glowing', 'Ember'],
  ['Starlit', 'Unending', 'Crowned', 'First'],
];

const freshPearls = () => ({ items: [], equipped: [], seq: 0, opens: 0, nacre: 0 });
const int = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.floor(Number(v)) || 0));
const validId = id => Number.isSafeInteger(id) && id > 0;
const validRarity = r => Number.isInteger(r) && r >= 0 && r < PEARL_RARITY.length;
const round3 = v => Math.round(v * 1000) / 1000;

// Names depend only on the stored seed and rarity, so a save file can never supply its own text.
function pearlName(r, seed) {
  const random = rng32(hash32(`pearl-name:${r}:${seed}`));
  const adj = ADJ[r][Math.floor(random() * ADJ[r].length)], kind = KINDS[Math.floor(random() * KINDS.length)];
  return `${adj} ${kind} Pearl`;
}
const pearlSlots = () => PEARL_SLOTS;

function rollRarity(random) {
  let x = random();
  for (let i = 0; i < PEARL_RARITY.length; i++) { if (x < PEARL_RARITY[i].p) return i; x -= PEARL_RARITY[i].p; }
  return 0;
}
function makePearl(S, random) {
  const P = S.pearls, r = rollRarity(random), spec = PEARL_RARITY[r];
  const stats = Object.keys(PEARL_STATS);
  for (let i = stats.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [stats[i], stats[j]] = [stats[j], stats[i]]; }
  const lines = stats.slice(0, spec.lines).map(stat => ({ stat, v: round3(1 + spec.mag[0] + (spec.mag[1] - spec.mag[0]) * random()) }));
  const item = { id: ++P.seq, r, seed: 1 + Math.floor(random() * 0x7ffffffe), lines };
  item.name = pearlName(r, item.seed);
  P.items.push(item);
  return item;
}
// Time in the Sea slowly forms the next pearl.
function tickPearls(S, dt) {
  if (S.world !== 'sea' || !(dt > 0)) return;
  S.pearls.nacre = Math.min(PEARL_FORM_SECONDS, S.pearls.nacre + dt);
}
// One oyster opening. Returns the new pearl when one has formed, or null. Every item is a distinct saved result.
function openOyster(S, random = Math.random) {
  const P = S.pearls;
  P.opens++;
  if (P.nacre < PEARL_FORM_SECONDS) return null;
  P.nacre = 0;
  return makePearl(S, random);
}
function equipPearl(S, id) {
  const P = S.pearls;
  if (!P.items.some(p => p.id === id)) return false;
  const at = P.equipped.indexOf(id);
  if (at >= 0) { P.equipped.splice(at, 1); return true; }
  if (P.equipped.length >= PEARL_SLOTS) return false;
  P.equipped.push(id); return true;
}
// Grinding a pearl returns pearl dust, like salvaging a horn returns ivory.
function grindPearl(S, id) {
  const P = S.pearls, at = P.items.findIndex(p => p.id === id);
  if (at < 0) return 0;
  const [p] = P.items.splice(at, 1), dust = PEARL_RARITY[p.r].dust;
  P.equipped = P.equipped.filter(x => x !== id);
  S.sea.pearls += dust; S.stats.pearls += dust;
  return dust;
}
function pearlBonuses(S) {
  const bonus = Object.fromEntries(Object.keys(PEARL_STATS).map(k => [k, 1])), eq = new Set(S.pearls.equipped);
  for (const p of S.pearls.items) {
    if (!eq.has(p.id)) continue;
    for (const l of p.lines) bonus[l.stat] *= l.v;
  }
  for (const k of Object.keys(bonus)) bonus[k] = Math.min(PEARL_STAT_CAP, bonus[k]);
  return bonus;
}
function applyPearls(HB, S) {
  const b = pearlBonuses(S);
  for (const k of Object.keys(b)) HB[k] = (HB[k] || 1) * b[k];
  return HB;
}
// Rank pearls for automatic play: log of the value of a strand under the stat cap.
function bestPearls(S, slots = PEARL_SLOTS) {
  const worth = p => p.lines.reduce((a, l) => a + Math.log(l.v), 0);
  return [...S.pearls.items].sort((a, b) => worth(b) - worth(a) || a.id - b.id).slice(0, slots).map(p => p.id);
}
function normalizePearls(S) {
  const raw = S.pearls && typeof S.pearls === 'object' ? S.pearls : {};
  const P = freshPearls(), ids = new Set();
  for (const it of Array.isArray(raw.items) ? raw.items : []) {
    if (!validRarity(it?.r) || !validId(it.id) || ids.has(it.id) || !validId(it.seed) || it.seed > 0x7fffffff) continue;
    const spec = PEARL_RARITY[it.r], lines = Array.isArray(it.lines) ? it.lines : [];
    const seen = new Set();
    if (lines.length !== spec.lines || lines.some(l => !PEARL_STATS[l?.stat] || seen.has(l.stat) || !seen.add(l.stat)
      || !Number.isFinite(l.v) || l.v < 1 + spec.mag[0] - 1e-9 || l.v > 1 + spec.mag[1] + 1e-9)) continue;
    ids.add(it.id);
    P.items.push({ id: it.id, r: it.r, seed: it.seed, name: pearlName(it.r, it.seed), lines: lines.map(l => ({ stat: l.stat, v: round3(l.v) })) });
  }
  P.equipped = [...new Set(Array.isArray(raw.equipped) ? raw.equipped : [])].filter(id => ids.has(id)).slice(0, PEARL_SLOTS);
  P.seq = Math.max(int(raw.seq, 0, Number.MAX_SAFE_INTEGER), ...ids);
  P.opens = int(raw.opens, 0, Number.MAX_SAFE_INTEGER);
  P.nacre = Number.isFinite(raw.nacre) ? Math.max(0, Math.min(PEARL_FORM_SECONDS, raw.nacre)) : 0;
  S.pearls = P;
}

export { PEARL_RARITY, PEARL_STATS, PEARL_SLOTS, PEARL_STAT_CAP, PEARL_FORM_SECONDS,
  freshPearls, pearlName, pearlSlots, tickPearls, openOyster, makePearl, equipPearl, grindPearl, pearlBonuses, applyPearls, bestPearls, normalizePearls };
