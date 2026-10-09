import { SHELL_RARITIES, shellSlots, shellDiscoveryChance, shellDiscounts,
  finishShell, equipShell, shellNeedle, hitShell } from './seashells.js';

// Presentation owns no rewards or currency rules. Pending timing state lives in the save.
export function createShellUI({ state, active, changed }) {
  const $ = id => document.getElementById(id);
  let key = '', resultKey = '';
  const rarity = r => SHELL_RARITIES[r].name;
  $('shellSection').addEventListener('click', e => {
    const button = e.target.closest('button[data-shell-action]');
    if (!button) return;
    const S = state(), id = +button.dataset.id, action = button.dataset.shellAction;
    const plan = S.shells.pending.find(p => p.id === id);
    if (action === 'auto' || action === 'claim') finishShell(S, id);
    else if (action === 'equip') equipShell(S, id);
    else if (action === 'start' && plan && !Array.isArray(plan.notes)) { plan.notes = []; plan.elapsed = 0; }
    else if (action === 'hit') { if (!active()) return; hitShell(S, id); }
    else return;
    const focused = document.activeElement === button;
    changed();
    if (focused) {
      let nextAction = action;
      if (action === 'start') nextAction = 'hit';
      else if (action === 'auto' || action === 'claim' || action === 'hit' && !S.shells.pending.some(p => p.id === id)) nextAction = 'equip';
      $('shellSection').querySelector(`[data-shell-action="${nextAction}"][data-id="${id}"]`)?.focus();
    }
  });
  function render() {
    if (!active()) return;
    const S = state(), sh = S.shells, bonus = shellDiscounts(S);
    // Elapsed timing changes the needle, never replaces a focused button.
    const next = JSON.stringify({ ...sh, pending: sh.pending.map(({ elapsed, ...p }) => p) });
    if (next !== key) {
      key = next;
      $('shellSummary').textContent = `${sh.equipped.length}/${shellSlots(S)} equipped · −${bonus.depth} depth · −${bonus.soundings} Heartstone soundings · ${Math.round(100 * shellDiscoveryChance(S))}% discovery chance · Common 75% / Epic 20% / Mythic 5% of finds`;
      const result = sh.lastResult, nextResult = JSON.stringify(result);
      if (nextResult !== resultKey) {
        resultKey = nextResult;
        $('shellDiscovery').innerHTML = result
          ? `<span class="shell-spin" aria-hidden="true">◉</span> Sounding ${result.sounding}: ${result.r === null ? 'no shell answered.' : `${rarity(result.r)} shell discovered.`}`
          : 'Your next Sea sounding can discover a shell. Common 75% · Epic 20% · Mythic 5%.';
      }
      $('shellPending').innerHTML = sh.pending.map(p => {
        const r = SHELL_RARITIES[p.r], started = Array.isArray(p.notes);
        return `<article class="shell-call"><h3>${r.name} shell #${p.id}</h3>
          <p>Depth reduction ${r.minDepth === r.maxDepth ? r.minDepth : `${r.minDepth}–${r.maxDepth}`} · sounding reduction ${r.soundings}, fixed.</p>
          ${p.r === 0 ? '<p>Common shells always reduce depth by one. Claim it directly.</p>' : started ? `<p>Note ${p.notes.length + 1} of 3. Sound when the needle meets the center. You can wait for another pass.</p>
            <div class="shell-track" aria-hidden="true"><span class="shell-target" style="width:${p.r === 2 ? 28 : 40}%"></span><i id="shellNeedle${p.id}"></i></div>
            <p id="shellTiming${p.id}" class="note"></p>` : '<p>Three timing notes set depth strength. Mythic windows are narrower. Leaving pauses your notes.</p>'}
          <button type="button" data-shell-action="${p.r === 0 ? 'claim' : started ? 'hit' : 'start'}" data-id="${p.id}">${p.r === 0 ? 'Claim shell' : started ? 'Sound note' : 'Begin sounding'}</button>
          <button type="button" data-shell-action="auto" data-id="${p.id}">Finish with Auto</button>
          <p class="note">Auto gives ${[1,3,8][p.r]} depth reduction, including after a partial performance. Equip the shell to use it.</p></article>`;
      }).join('');
      // Strongest first, keep every distinct item: there is no inventory cap or forced salvage.
      $('shellInventory').innerHTML = [...sh.items].sort((a, b) => b.r - a.r || b.depth - a.depth || a.id - b.id).map(p => {
        const worn = sh.equipped.includes(p.id), full = sh.equipped.length >= shellSlots(S);
        return `<article class="stat shell-card"><b>${rarity(p.r)} shell #${p.id}${worn ? ' · Equipped' : ''}</b><p>−${p.depth} depth · −${SHELL_RARITIES[p.r].soundings} soundings</p>
          <button type="button" data-shell-action="equip" data-id="${p.id}" ${!worn && full ? 'disabled' : ''}>${worn ? 'Unequip' : 'Equip'}</button></article>`;
      }).join('') || '<p class="note">No shells yet. Discovery starts at 20% per successful Sea sounding.</p>';
    }
    for (const p of sh.pending) {
      if (!Array.isArray(p.notes)) continue;
      const needle = $(`shellNeedle${p.id}`), button = $('shellPending').querySelector(`[data-shell-action="hit"][data-id="${p.id}"]`);
      if (needle) needle.style.left = `${100 * shellNeedle(p.elapsed)}%`;
      if (button) button.setAttribute('aria-disabled', String(p.elapsed < 1));
      const timing = $(`shellTiming${p.id}`);
      if (timing) timing.textContent = p.elapsed < 1 ? 'Listen…' : 'Ready. Aim for the center.';
    }
  }
  return { render, tick(dt) {
    if (!active()) return;
    for (const p of state().shells.pending) if (Array.isArray(p.notes)) p.elapsed += dt;
    render();
  } };
}
