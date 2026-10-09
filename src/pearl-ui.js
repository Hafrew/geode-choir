import { PEARL_RARITY, PEARL_STATS, PEARL_SLOTS, PEARL_STAT_CAP, PEARL_FORM_SECONDS, equipPearl, grindPearl, pearlBonuses } from './pearls.js';
import { pearlSVG } from './pearl-art.js';

const pct = v => `+${Math.round((v - 1) * 100)}%`;
// Presentation only: every rule lives in pearls.js.
export function createPearlUI({ state, active, changed }) {
  const $ = id => document.getElementById(id);
  let key = '';
  $('pearlSection').addEventListener('click', e => {
    const button = e.target.closest('button[data-pearl-action]');
    if (!button) return;
    const S = state(), id = +button.dataset.id, action = button.dataset.pearlAction;
    if (action === 'equip') equipPearl(S, id);
    else if (action === 'grind') grindPearl(S, id);
    else return;
    const focused = document.activeElement === button;
    changed();
    if (focused) {
      const next = $('pearlSection').querySelector(`[data-pearl-action="${action === 'grind' ? 'equip' : action}"][data-id="${id}"]`)
        || $('pearlSection').querySelector('[data-pearl-action]');
      next?.focus();
    }
  });
  const lines = p => p.lines.map(l => `${PEARL_STATS[l.stat]} <b>${pct(l.v)}</b>`).join(' · ');
  function render() {
    if (!active()) return;
    const S = state(), P = S.pearls, next = JSON.stringify({ ...P, nacre: Math.floor(P.nacre / 10) });
    if (next === key) return;
    key = next;
    const bonus = pearlBonuses(S), total = Object.entries(bonus).filter(([, v]) => v > 1.0001)
      .map(([k, v]) => `${PEARL_STATS[k]} ${pct(v)}${v >= PEARL_STAT_CAP - 1e-9 ? ' (cap)' : ''}`).join(' · ');
    $('pearlSummary').textContent = `${P.equipped.length}/${PEARL_SLOTS} on the strand${total ? ' · ' + total : ''} · ${P.items.length} kept · `
      + (P.nacre >= PEARL_FORM_SECONDS ? 'A pearl has formed: the next oyster to open reveals it.' : `Next pearl forming in the Sea (${Math.floor(100 * P.nacre / PEARL_FORM_SECONDS)}%).`);
    const byId = new Map(P.items.map(p => [p.id, p]));
    $('pearlStrand').innerHTML = Array.from({ length: PEARL_SLOTS }, (_, i) => {
      const p = byId.get(P.equipped[i]);
      return p ? `<div class="pearl-slot" style="--rc:${PEARL_RARITY[p.r].col}">${pearlSVG(p, 'strand', 64)}<span>${p.name}</span></div>`
        : '<div class="pearl-slot empty"><span>Empty slot</span></div>';
    }).join('');
    $('pearlInventory').innerHTML = [...P.items].sort((a, b) => b.r - a.r || b.lines[0].v - a.lines[0].v || a.id - b.id).map(p => {
      const worn = P.equipped.includes(p.id), full = P.equipped.length >= PEARL_SLOTS, spec = PEARL_RARITY[p.r];
      return `<article class="stat pearl-card" style="--rc:${spec.col}">${pearlSVG(p, 'case', 96)}<b>${spec.name} · ${p.name}${worn ? ' · Worn' : ''}</b>
        <p>${lines(p)}</p>
        <button type="button" data-pearl-action="equip" data-id="${p.id}" ${!worn && full ? 'disabled' : ''}>${worn ? 'Take off' : 'Wear'}</button>
        <button type="button" data-pearl-action="grind" data-id="${p.id}">Grind · ${spec.dust} dust</button></article>`;
    }).join('') || '<p class="note">No pearls yet. Oysters sometimes hold a real pearl; it is kept even when you sound the depths.</p>';
  }
  return { render };
}
