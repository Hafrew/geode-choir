// Batched descents use the normal descent function at each landing. No depth
// shortcut, virtual reward, or second timer competes with the normal cave lock.
export const CAVE_EVENT_SECONDS = 15;
export const CAVE_EVENTS = [
  { name: 'The Fossil Choir', text: 'Old voices hum inside a seam. Leave it singing, loosen a few fossils, or quiet it for a fresher floor.' },
  { name: 'The Breathing Stone', text: 'A warm draft moves through the rock. Follow its rhythm, gather the loose fossils, or open the draft to cool the cave.' },
  { name: 'The Quiet Vein', text: 'A pale seam catches the last echo. Keep its balance, work the seam, or leave part of your haul to keep the floor young.' },
];
export const freshCaveVariety = () => ({ diveSize: 1, ratio: 1, remaining: 0, autoEvents: false, pending: [], nextId: 0, completed: 0 });
export function normalizeCaveVariety(S) {
  const raw = S.caveVariety || {}, fresh = freshCaveVariety();
  fresh.diveSize = [1, 2, 3].includes(raw.diveSize) ? raw.diveSize : 1;
  fresh.ratio = Number.isFinite(raw.ratio) ? Math.min(100, Math.max(1, raw.ratio)) : 1;
  fresh.remaining = Math.min(2, Math.max(0, Math.floor(raw.remaining) || 0));
  fresh.autoEvents = raw.autoEvents === true;
  fresh.nextId = Number.isSafeInteger(raw.nextId) && raw.nextId >= 0 ? raw.nextId : 0;
  fresh.completed = Number.isSafeInteger(raw.completed) && raw.completed >= 0 ? raw.completed : 0;
  const seen = new Set();
  fresh.pending = (Array.isArray(raw.pending) ? raw.pending : []).filter(p => p && Number.isSafeInteger(p.id) && p.id > 0
    && !seen.has(p.id) && seen.add(p.id) && Number.isSafeInteger(p.floor) && p.floor > 0 && p.floor <= S.depth
    && Number.isInteger(p.type) && p.type >= 0 && p.type < CAVE_EVENTS.length && Number.isFinite(p.haul) && p.haul >= 0)
    .slice(0, 3).map(p => ({ id: p.id, floor: p.floor, type: p.type, haul: p.haul,
      elapsed: Math.min(CAVE_EVENT_SECONDS, Math.max(0, +p.elapsed || 0)), choice: ['safe', 'fossils', 'fresh'].includes(p.choice) ? p.choice : null }));
  for (const p of fresh.pending) fresh.nextId = Math.max(fresh.nextId, p.id);
  S.caveVariety = fresh;
}
export function queueCaveEvents(S, oldDepth, haul) {
  const V = S.caveVariety;
  for (let floor = Math.floor(oldDepth / 5) * 5 + 5; floor <= S.depth; floor += 5) {
    V.pending.push({ id: ++V.nextId, floor, type: (floor / 5 + S.hearts) % CAVE_EVENTS.length,
      haul, elapsed: 0, choice: null });
  }
}
export function chooseCaveEvent(S, id, choice) {
  const p = S.caveVariety.pending.find(p => p.id === id);
  if (!p || p.choice || !['safe', 'fossils', 'fresh'].includes(choice)) return false;
  p.choice = choice; return true;
}
export function finishCaveEvent(S, id, auto = false) {
  const V = S.caveVariety, at = V.pending.findIndex(p => p.id === id), p = V.pending[at];
  if (!p) return false;
  if (auto) { if (!p.choice) p.choice = 'safe'; p.elapsed = CAVE_EVENT_SECONDS; }
  if (!p.choice || p.elapsed < CAVE_EVENT_SECONDS) return false;
  const trade = Math.floor(p.haul * .1);
  if (p.choice === 'fossils') {
    S.fossils += trade; S.fossilsTotal += trade; S.stats.fossilsLife += trade;
    S.cool += 30; // thirty work seconds, following the ordinary tick/offline policy
  } else if (p.choice === 'fresh') {
    const paid = Math.min(S.fossils, trade);
    // If the haul was spent, the trade scales down; no negative balance or free benefit.
    S.fossils -= paid; S.age = Math.max(0, S.age - (trade > 0 ? 60 * paid / trade : 0));
  }
  V.pending.splice(at, 1); V.completed++; return true;
}
export function tickCaveEvents(S, dt, active, auto = false) {
  if (!active) return false;
  let changed = false;
  for (const p of [...S.caveVariety.pending]) {
    p.elapsed = Math.min(CAVE_EVENT_SECONDS, p.elapsed + Math.max(0, dt));
    if (auto && !p.choice) p.choice = 'safe';
    if (finishCaveEvent(S, p.id)) changed = true;
  }
  return changed;
}
