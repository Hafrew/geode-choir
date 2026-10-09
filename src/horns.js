const RARITY = [
  { name: 'Common',    col: '#bdb5cc', p: 0.58, lines: 1, pct: [5, 15],    flatK: 1, ivory: 3 },
  { name: 'Rare',      col: '#7fb8ff', p: 0.27, lines: 1, pct: [15, 40],   flatK: 2, ivory: 10 },
  { name: 'Epic',      col: '#b58cff', p: 0.10, lines: 2, pct: [40, 90],   flatK: 3, ivory: 35, mult: [1.2, 1.5], multP: 0.3 },
  { name: 'Legendary', col: '#ffcf86', p: 0.04, lines: 2, pct: [90, 200],  flatK: 4, ivory: 75, mult: [1.5, 2.5], multP: 0.5 },
  { name: 'Mythic',    col: '#ff8fa3', p: 0.01, lines: 3, pct: [200, 400], flatK: 6, ivory: 250, mult: [2.5, 4], multP: 1 },
  { name: 'Primordial', col: '#83f5dc', p: 0, lines: 3, pct: [200, 400], flatK: 6, ivory: 500, mult: [2.5, 4], multP: 1 },
];
const HSTATS = {
  hum:     { label: 'Hum',               kind: 'scale', of: 'the Deep Choir' },
  lumen:   { label: 'Lumen',             kind: 'scale', of: 'the Glowworm' },
  shards:  { label: 'Shards',            kind: 'scale', of: 'Cracked Stone' },
  fossils: { label: 'Fossils',           kind: 'scale', of: 'Old Bones' },
  crystal: { label: 'Crystal value',     kind: 'scale', of: 'Quartz' },
  wall:    { label: 'Stone echoes',      kind: 'scale', of: 'the Walls' },
  tide:    { label: 'Tide',              kind: 'scale', of: 'the Sunless Sea' },
  pearls:  { label: 'Pearls',            kind: 'scale', of: 'the Oyster' },
  fathoms: { label: 'Fathoms',           kind: 'scale', of: 'the Plumb Line' },
  bell:    { label: 'Bell value',        kind: 'scale', of: 'Bronze' },
  interf:  { label: 'Crossing bonus',    kind: 'scale', of: 'Crossing Waves' },
  lungs:   { label: 'Echoes per shout',  kind: 'flat', per: 1, of: 'Great Lungs' },
  skips:   { label: 'Stone skips',       kind: 'flat', per: 0.5, of: 'the Skipping Stone' },
  offline: { label: 'Away earnings',     kind: 'flatpct', per: 4, of: 'Long Sleep' },
  cost:    { label: 'Crystal & bell prices', kind: 'discount', per: 3, of: 'the Haggler' },
};
const ANIMALS = ['Ram', 'Stag', 'Ibex', 'Oryx', 'Kudu', 'Narwhal', 'Markhor', 'Auroch', 'Conch', 'Wyrm'];
const ADJ = [
  ['Chipped', 'Plain', 'Dusty', 'Worn'],
  ['Carved', 'Polished', 'Humming', 'Banded'],
  ['Singing', 'Spiral', 'Moonlit', 'Hollow'],
  ['Gilded', 'Thundering', 'Ancient', 'Crowned'],
  ['Starborn', 'Worldsong', 'Unending', 'First'],
  ['Primordial', 'Dawn', 'Origin', 'First Voice'],
];
const hash32 = n => { n = Math.imul((n | 0) ^ ((n | 0) >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return (n ^ (n >>> 16)) >>> 0; };
function rng32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const FAMS = ['curl', 'tines', 'sweep', 'spear', 'twist', 'tusk', 'crescent', 'conch'];
const FAM_OF = { Ram: 'curl', Stag: 'tines', Ibex: 'sweep', Oryx: 'spear', Kudu: 'twist', Narwhal: 'tusk', Markhor: 'twist', Auroch: 'crescent', Conch: 'conch', Wyrm: 'sweep' };
const famOf = h => {
  const a = ANIMALS.find(x => h.name && h.name.includes(' ' + x + ' '));
  return FAM_OF[a] || FAMS[hash32(h.seed || h.id || 1) % FAMS.length];
};
const PRIMORDIAL = 5, RARITY_LEVELS = 10, PITY_AT = 25, TRAIT_CHOICE_AT = 0.9;
const RARITY_TARGET = [0.05, 0.25, 0.30, 0.25, 0.15];
const TRAITS = [
  { id: 'memory', name: 'Deep Memory', base: 10, effect: 'slower floor freshness decay' },
  { id: 'resonance', name: 'Resonance', base: 10, effect: 'stronger stats on other equipped horns' },
  { id: 'golden', name: 'Golden Echo', base: 25, effect: 'more Gilt on Sunvein arrival' },
  { id: 'undertow', name: 'Undertow', base: 15, effect: 'more tide production' },
];
const IVORY_LEVELS = 5;
const discoveryIvory = S => 5 + 5 * (S.hornUp.ivory || 0);
function grantDiscoveryIvory(S, h) {
  if (h.ivoryFound != null) return 0;
  const amount = discoveryIvory(S);
  h.ivoryFound = amount;
  S.ivory += amount; S.stats.ivoryLife += amount;
  return amount;
}
const rarityRevealed = S => S.hornUp.rarity >= RARITY_LEVELS;
const primordialUnlocked = S => rarityRevealed(S) && !!S.hornUp.firstVoice;
function rarityOdds(S, level = S.hornUp.rarity) {
  const t = Math.max(0, Math.min(RARITY_LEVELS, level || 0)) / RARITY_LEVELS;
  const odds = RARITY_TARGET.map((p, i) => RARITY[i].p + (p - RARITY[i].p) * t);
  if (primordialUnlocked(S)) { odds[2] -= 0.02; odds.push(0.02); }
  return odds;
}
const visibleRarities = S => RARITY.slice(0, rarityRevealed(S) ? 6 : 5);
const normalSlots = S => 1 + S.hornUp.rack;
const primordialSlots = S => primordialUnlocked(S) ? 2 + S.hornUp.firstRack : 0;
const equippedIds = S => [...S.equipped, ...(S.primordialEquipped || [])];
const traitQuality = perfs => perfs?.length ? perfs.reduce((a, p) => a + p, 0) / perfs.length : 0.5;
function traitValue(h) {
  const t = TRAITS.find(t => t.id === h.trait?.id);
  return h.r === PRIMORDIAL && t ? t.base * (0.5 + h.trait.quality) / 100 : 0;
}
function activeTraits(S, excludeId) {
  const eq = new Set(equippedIds(S)), strongest = {};
  for (const h of S.horns) {
    if (!eq.has(h.id) || h.r !== PRIMORDIAL || !h.trait) continue;
    const value = traitValue(h), old = strongest[h.trait.id];
    if (!old || value > old.value) strongest[h.trait.id] = { id: h.id, value };
  }
  const effects = {};
  for (const [trait, source] of Object.entries(strongest))
    if (source.id !== excludeId) effects[trait] = source.value;
  return effects;
}
function hornBoost(S, h) { return 1 + S.hornUp.whet * 0.08 * (1 + Math.min(h.r, 4) * 0.5); }
function lineValue(S, h, l) {
  const b = hornBoost(S, h) * (1 + (activeTraits(S, h.id).resonance || 0));
  return l.kind === 'mult' ? 1 + (l.v - 1) * b : l.v * b;
}
function hornBonuses(S) {
  const add = {}, mul = {}; let lungs = 0, skips = 0, offline = 0, cost = 0;
  const eq = new Set(equippedIds(S));
  for (const h of S.horns) {
    if (!eq.has(h.id)) continue;
    for (const l of h.lines) {
      const st = HSTATS[l.stat]; if (!st) continue;
      const v = lineValue(S, h, l);
      if (st.kind === 'scale') {
        if (l.kind === 'mult') mul[l.stat] = (mul[l.stat] || 1) * v; else add[l.stat] = (add[l.stat] || 0) + v;
      } else if (l.stat === 'lungs') lungs += Math.round(v);
      else if (l.stat === 'skips') skips += Math.round(v);
      else if (l.stat === 'offline') offline += v;
      else if (l.stat === 'cost') cost += v;
    }
  }
  const traits = activeTraits(S);
  const hb = { lungs, skips, offline: Math.min(0.5, offline / 100), cost: Math.min(0.6, cost / 100), traits };
  for (const k of Object.keys(HSTATS)) if (HSTATS[k].kind === 'scale') hb[k] = (1 + (add[k] || 0) / 100) * (mul[k] || 1);
  hb.tide *= 1 + (traits.undertow || 0);
  return hb;
}
// Score whole loadouts so caps, duplicate traits, and Resonance affect the choice.
function loadoutScore(S) {
  const h = hornBonuses(S), log = value => Math.log(Math.max(1e-9, value));
  const cave = (log(h.hum) + log(h.crystal) + .5 * log(h.wall) + .6 * log(h.lumen)
    + .5 * log(h.fossils) + .2 * log(h.shards) + .7 * log(1 + h.lungs / 6)
    - .6 * log(1 - (h.traits.memory || 0)) + .3 * log(1 + (h.traits.golden || 0))) / 5.4;
  const sea = (log(h.tide) + log(h.bell) + .3 * log(h.interf) + .5 * log(h.fathoms)
    + .3 * log(h.pearls) + .7 * log(1 + h.skips / 6)) / 3.8;
  const shared = -.4 * log(1 - h.cost) + .2 * log(1 + h.offline / .35);
  return shared + (S.hornInventory.focus === 'cave' ? cave : S.hornInventory.focus === 'sea' ? sea : (cave + sea) / 2);
}
function bestLoadout(S) {
  const draft = { ...S, equipped: [...S.equipped], primordialEquipped: [...S.primordialEquipped] };
  const racks = [
    { key: 'equipped', cap: normalSlots(S), pool: S.horns.filter(h => h.r !== PRIMORDIAL) },
    { key: 'primordialEquipped', cap: primordialSlots(S), pool: S.horns.filter(h => h.r === PRIMORDIAL) },
  ];
  // Keep the current loadout on ties, then greedily fill and improve each slot.
  // Every accepted swap strictly improves the full score; no random draws are used.
  for (const rack of racks) draft[rack.key] = [...new Set(draft[rack.key])]
    .filter(id => rack.pool.some(h => h.id === id)).slice(0, rack.cap);
  let score = loadoutScore(draft), improved;
  do {
    improved = false;
    for (const { key, cap, pool } of racks) {
      for (let slot = 0; slot < Math.min(cap, pool.length); slot++) {
        const current = draft[key][slot]; let bestId = current, bestScore = score;
        for (const h of pool) {
          if (h.id === current || draft[key].includes(h.id)) continue;
          draft[key][slot] = h.id;
          const next = loadoutScore(draft);
          if (next > bestScore + 1e-9 || (bestId == null && next >= bestScore - 1e-9)) {
            bestScore = next; bestId = h.id;
          }
        }
        if (bestId == null) draft[key].splice(slot, 1); else draft[key][slot] = bestId;
        if (bestScore > score + 1e-9 || current == null && bestId != null) improved = true;
        score = bestScore;
      }
    }
  } while (improved);
  return { equipped: draft.equipped, primordialEquipped: draft.primordialEquipped };
}
function applyAutoEquip(S) {
  if (!S.hornInventory.autoEquip) return false;
  const next = bestLoadout(S);
  const changed = next.equipped.join() !== S.equipped.join() || next.primordialEquipped.join() !== S.primordialEquipped.join();
  if (changed) Object.assign(S, next);
  return changed;
}
function matchesSalvageFilter(S, h) {
  return !!S.hornInventory.salvage[h.r] && (!h.gold || S.hornInventory.gilded);
}
function salvageSpare(S, h) {
  if (equippedIds(S).includes(h.id)) return false;
  const index = S.horns.indexOf(h); if (index < 0) return false;
  S.horns.splice(index, 1);
  const amount = RARITY[h.r].ivory;
  S.ivory += amount; S.stats.ivoryLife += amount;
  h.salvaged = true;
  return true;
}
function singleHornScore(S, h) {
  return loadoutScore({ ...S, horns: [h], equipped: h.r === PRIMORDIAL ? [] : [h.id],
    primordialEquipped: h.r === PRIMORDIAL && primordialSlots(S) ? [h.id] : [] });
}
function acquireHorn(S, h, capacity = 30) {
  S.horns.push(h);
  if (S.hornInventory.autoEquip) applyAutoEquip(S);
  if (matchesSalvageFilter(S, h) && salvageSpare(S, h)) {
    h.salvageReason = 'filter'; return;
  }
  if (S.horns.length > capacity) {
    if (equippedIds(S).includes(h.id)) {
      // Keep a newly equipped upgrade by replacing an unprotected spare.
      const worn = new Set(equippedIds(S));
      const spare = S.horns.filter(x => x.id !== h.id && !worn.has(x.id) && (!x.gold || matchesSalvageFilter(S, x)))
        .sort((a, b) => singleHornScore(S, a) - singleHornScore(S, b) || a.id - b.id)[0];
      if (spare && salvageSpare(S, spare)) { h.replacedHorn = { name: spare.name, ivory: RARITY[spare.r].ivory }; return; }
      // An entirely protected inventory cannot make room: restore the existing loadout.
      for (const key of ['equipped', 'primordialEquipped']) S[key] = S[key].filter(id => id !== h.id);
    }
    salvageSpare(S, h); h.salvageReason = 'full'; applyAutoEquip(S); return;
  }
  if (!S.hornInventory.autoEquip) {
    const eq = h.r === PRIMORDIAL ? S.primordialEquipped : S.equipped;
    const cap = h.r === PRIMORDIAL ? primordialSlots(S) : normalSlots(S);
    if (eq.length < cap) eq.push(h.id);
  }
}
function normalizeHornState(S) {
  const settings = S.hornInventory || {};
  S.hornInventory = { autoEquip: settings.autoEquip === true,
    focus: ['balanced', 'cave', 'sea'].includes(settings.focus) ? settings.focus : 'balanced',
    salvage: RARITY.map((_, i) => Array.isArray(settings.salvage) && settings.salvage[i] === true),
    gilded: settings.gilded === true };
  const level = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  S.hornUp.ivory = level(S.hornUp.ivory, IVORY_LEVELS);
  S.hornUp.rarity = level(S.hornUp.rarity, RARITY_LEVELS);
  S.hornUp.firstVoice = rarityRevealed(S) ? level(S.hornUp.firstVoice, 1) : 0;
  S.hornUp.firstRack = S.hornUp.firstVoice ? level(S.hornUp.firstRack, 1) : 0;
  for (const h of S.horns) if (h.r === PRIMORDIAL) {
    const id = TRAITS.some(t => t.id === h.trait?.id) ? h.trait.id : 'memory';
    const quality = Number.isFinite(h.trait?.quality) ? Math.max(0, Math.min(1, h.trait.quality)) : 0.5;
    h.trait = { id, quality };
  }
  const clean = (ids, primordial, cap) => [...new Set(Array.isArray(ids) ? ids : [])]
    .filter(id => S.horns.some(h => h.id === id && (h.r === PRIMORDIAL) === primordial)).slice(0, cap);
  S.equipped = clean(S.equipped, false, normalSlots(S));
  S.primordialEquipped = clean(S.primordialEquipped, true, primordialSlots(S));
}
function recordCollection(S, h) {
  if (!h.seed) return;
  const k = famOf(h) + ':' + (h.gold ? 'g' : h.r), c = S.coll[k];
  if (c) c.n++; else S.coll[k] = { seed: h.seed, name: h.name, ls: h.lines.map(l => l.stat), n: 1, r: h.r };
}
function soundingDifficulty(plan, ear) {
  const primordial = plan.ri === PRIMORDIAL;
  return {
    hw: Math.min(0.2, 0.1 + 0.008 * ear) * (primordial ? 0.65 : 1),
    // Primordial notes are deliberate: each has a six-second lead-in, with no miss timer.
    readyMs: primordial ? 6000 + Math.min(plan.perfs.length, 2) * 1000 : 0,
    speed: (0.5 + 0.09 * plan.perfs.length + 0.05 * plan.ri) * (primordial ? 1.1 : 1),
  };
}
function rollLine(stat, R, random) {
  const st = HSTATS[stat], u = random();
  if (st.kind === 'scale') {
    if (R.mult && random() < R.multP) return { stat, kind: 'mult', v: +(R.mult[0] + (R.mult[1] - R.mult[0]) * u).toFixed(2) };
    return { stat, kind: 'pct', v: Math.round(R.pct[0] + (R.pct[1] - R.pct[0]) * u) };
  }
  return { stat, kind: st.kind, v: Math.max(1, Math.round(st.per * R.flatK * (0.6 + 0.8 * u))) };
}
// A horn call has two halves: the plan (rarity first, then which stats it has) and the build (the stats scaled by how well you played).
// Auto sounding builds the plan at once with an average result, so the order of random draws is the same as it always was.
function rollHornPlan(S, minR = 0, random = Math.random) {
  const odds = rarityOdds(S);
  let x = random(), ri = 0;
  for (; ri < odds.length - 1; ri++) { if (x < odds[ri]) break; x -= odds[ri]; }
  if ((S.hornPity || 0) >= PITY_AT) ri = Math.max(ri, 2);
  ri = Math.max(ri, minR || 0);
  S.hornPity = ri >= 2 ? 0 : (S.hornPity || 0) + 1;
  const R = RARITY[ri];
  let n = R.lines + (random() < S.hornUp.branch * 0.2 ? 1 : 0);
  n = Math.min(4, n);
  const keys = Object.keys(HSTATS), used = new Set(), lines = [];
  while (lines.length < n) {
    const s = keys[Math.floor(random() * keys.length)]; if (used.has(s)) continue;
    used.add(s); lines.push(rollLine(s, R, random));
  }
  const plan = { ri, lines, perfs: [] };
  if (S.floor === 'sunvein' && S.world !== 'sea' && random() < Math.min(1, 0.5 + 0.1 * S.goldUp.breath)) plan.gold = true;
  return plan;
}
const AUTO_P = 0.5, perfMult = p => 0.5 + p; // an average result is exactly the usual value; the range is half to one and a half times
function scaleLine(l, m) {
  const st = HSTATS[l.stat];
  if (l.kind === 'mult') return { ...l, v: +(1 + (l.v - 1) * m).toFixed(2) };
  if (l.kind === 'pct') return { ...l, v: Math.max(1, Math.round(l.v * m)) };
  return { ...l, v: Math.max(1, Math.round(l.v * m)) };
}
function createHorn(S, plan, perfs, chosenTrait, random = Math.random) {
  const ri = plan.ri;
  const gm = plan.gold ? 1.25 : 1; // a gilded horn is a quarter stronger on top of how well you played
  const lines = plan.lines.map((l, i) => (perfs || plan.gold) ? scaleLine(l, (perfs ? perfMult(perfs[i] == null ? AUTO_P : perfs[i]) : 1) * gm) : { ...l });
  const adj = ADJ[ri][Math.floor(random() * ADJ[ri].length)], animal = ANIMALS[Math.floor(random() * ANIMALS.length)];
  const h = { id: ++S.hornSeq, r: ri, name: `${plan.gold ? 'Gilded' : adj} ${animal} Horn of ${HSTATS[lines[0].stat].of}`, lines };
  if (plan.gold) h.gold = true;
  if (perfs && perfs.length) h.q = +(perfs.reduce((a, b) => a + b, 0) / perfs.length).toFixed(2);
  h.seed = hash32(h.id * 0x9E3779B1 + ri * 7919 + S.stats.hornsFound * 40503) || 1; // not from Math.random, so the random stream is unchanged
  if (ri === PRIMORDIAL) {
    const quality = traitQuality(perfs);
    const id = TRAITS.some(t => t.id === chosenTrait) && quality >= TRAIT_CHOICE_AT
      ? chosenTrait : TRAITS[Math.floor(random() * TRAITS.length)].id;
    h.trait = { id, quality };
  }
  return h;
}

export { loadoutScore, bestLoadout, applyAutoEquip, matchesSalvageFilter, acquireHorn, IVORY_LEVELS, discoveryIvory, grantDiscoveryIvory, RARITY, HSTATS, ANIMALS, ADJ, PRIMORDIAL, RARITY_LEVELS, PITY_AT, TRAITS, TRAIT_CHOICE_AT,
hash32, rng32, FAMS, FAM_OF, famOf, rarityOdds, rarityRevealed, primordialUnlocked, visibleRarities,
normalSlots, primordialSlots, equippedIds, AUTO_P, traitQuality, traitValue, activeTraits, hornBoost,
lineValue, hornBonuses, normalizeHornState, recordCollection, rollHornPlan, createHorn, soundingDifficulty };
