// Shell potency is fixed when its minigame finishes. Upgrades affect discovery or slots only.
const SHELL_RARITIES = [
  { name: 'Common', chance: .75, minDepth: 1, maxDepth: 1, soundings: 0 },
  { name: 'Epic', chance: .20, minDepth: 2, maxDepth: 4, soundings: 1 },
  { name: 'Mythic', chance: .05, minDepth: 5, maxDepth: 10, soundings: 3 },
];
const SHELL_DISCOVERY_LEVELS = 6;
const freshShells = () => ({ items: [], equipped: [], pending: [], seq: 0, discovery: 0, extraSlot: 0, lastSounding: 0 });
const level = (value, max) => Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));
const shellSlots = S => 1 + level(S.shells?.extraSlot, 1);
const shellDiscoveryChance = S => .2 + .05 * level(S.shells?.discovery, SHELL_DISCOVERY_LEVELS);
const validId = id => Number.isSafeInteger(id) && id > 0;
const validRarity = r => Number.isInteger(r) && r >= 0 && r < SHELL_RARITIES.length;
function shellDepth(rarity, quality = .5) {
  if (!validRarity(rarity)) throw new RangeError('Unknown seashell rarity');
  const r = SHELL_RARITIES[rarity];
  const q = Number.isFinite(quality) ? Math.min(1, Math.max(0, quality)) : .5;
  return r.minDepth + Math.round((r.maxDepth - r.minDepth) * q);
}
function normalizeShells(S) {
  const raw = S.shells && typeof S.shells === 'object' ? S.shells : {};
  const shells = freshShells(), ids = new Set();
  shells.discovery = level(raw.discovery, SHELL_DISCOVERY_LEVELS);
  shells.extraSlot = level(raw.extraSlot, 1);
  for (const item of Array.isArray(raw.items) ? raw.items : []) {
    if (!validRarity(item?.r)) continue;
    const r = SHELL_RARITIES[item?.r];
    if (!r || !validId(item.id) || ids.has(item.id) || !Number.isInteger(item.depth)
      || item.depth < r.minDepth || item.depth > r.maxDepth) continue;
    ids.add(item.id);
    shells.items.push({ id: item.id, r: item.r, depth: item.depth });
  }
  shells.equipped = [...new Set(Array.isArray(raw.equipped) ? raw.equipped : [])]
    .filter(id => ids.has(id)).slice(0, 1 + shells.extraSlot);
  for (const plan of Array.isArray(raw.pending) ? raw.pending : []) {
    if (!validRarity(plan?.r) || !validId(plan.id) || ids.has(plan.id)
      || !validId(plan.sounding) || plan.sounding > S.sea.soundings) continue;
    // Each actual sounding can create only one shell, including unfinished results.
    if (shells.pending.some(p => p.sounding === plan.sounding)) continue;
    ids.add(plan.id);
    shells.pending.push({ id: plan.id, r: plan.r, sounding: plan.sounding });
  }
  shells.seq = level(raw.seq, Number.MAX_SAFE_INTEGER);
  for (const id of ids) shells.seq = Math.max(shells.seq, id);
  // Old saves never receive retrospective discovery rolls.
  shells.lastSounding = Math.max(level(raw.lastSounding, S.sea.soundings), S.sea.soundings);
  S.shells = shells;
  return shells;
}
function shellDiscounts(S) {
  const shells = S.shells || freshShells();
  const ids = [...new Set(shells.equipped)].slice(0, shellSlots(S));
  let depth = 0, soundings = 0;
  for (const id of ids) {
    const item = shells.items.find(h => h.id === id), rarity = SHELL_RARITIES[item?.r];
    if (!rarity) continue;
    depth += item.depth;
    soundings += rarity.soundings;
  }
  return { depth, soundings };
}
function equipShell(S, id) {
  const shells = S.shells;
  if (!shells.items.some(item => item.id === id)) return false;
  if (shells.equipped.includes(id)) shells.equipped = shells.equipped.filter(other => other !== id);
  else if (shells.equipped.length < shellSlots(S)) shells.equipped.push(id);
  else return false;
  return true;
}
// Called only after the actual sounding counter has advanced. Persist even a failed discovery.
function discoverShell(S, random = Math.random) {
  const shells = S.shells, sounding = S.sea.soundings;
  if (!sounding || sounding <= shells.lastSounding) return null;
  shells.lastSounding = sounding;
  if (shells.seq >= Number.MAX_SAFE_INTEGER) return null;
  if (random() >= shellDiscoveryChance(S)) return null;
  const roll = random();
  let r = 0, cumulative = SHELL_RARITIES[0].chance;
  while (roll >= cumulative && r < SHELL_RARITIES.length - 1) cumulative += SHELL_RARITIES[++r].chance;
  const plan = { id: ++shells.seq, r, sounding };
  shells.pending.push(plan);
  return plan;
}
function finishShell(S, id, quality = .5) {
  const shells = S.shells, index = shells.pending.findIndex(plan => plan.id === id);
  if (index < 0) return null;
  const plan = shells.pending[index];
  const item = { id: plan.id, r: plan.r, depth: shellDepth(plan.r, quality) };
  shells.pending.splice(index, 1);
  shells.items.push(item);
  return item;
}
export { SHELL_RARITIES, SHELL_DISCOVERY_LEVELS, freshShells, shellSlots, shellDiscoveryChance,
  shellDepth, normalizeShells, shellDiscounts, equipShell, discoverShell, finishShell };
