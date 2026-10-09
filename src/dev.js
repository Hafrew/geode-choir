import { SHELL_RARITIES, shellDepth } from './seashells.js';
import { PEARL_RARITY, makePearl } from './pearls.js';
import { RARITY } from './horns.js';

// Developer toolbar for testing. Loaded only after the access code is accepted (see dev-lock.js).
// Every action marks the save (`stats.devUsed`) so a save that used these tools can be told apart.
const RESOURCES = {
  hum: 'Hum', fossils: 'Fossils', lumen: 'Lumen', shards: 'Shards', tide: 'Tide',
  fathoms: 'Fathoms', dust: 'Pearl dust', ivory: 'Ivory', gilt: 'Gilt',
};
function addResource(S, key, a) {
  const q = S.sea;
  switch (key) {
    case 'hum': S.hum += a; S.run += a; S.total += a; break;
    case 'fossils': S.fossils += a; S.fossilsTotal += a; S.stats.fossilsLife += a; break;
    case 'lumen': S.lumen += a; S.lumenTotal += a; S.stats.lumenLife += a; break;
    case 'shards': S.shards += a; S.stats.shards += a; break;
    case 'tide': q.tide += a; q.run += a; q.total += a; break;
    case 'fathoms': q.fathoms += a; q.fathomsTotal += a; break;
    case 'dust': q.pearls += a; S.stats.pearls += a; break;
    case 'ivory': S.ivory += a; S.stats.ivoryLife += a; break;
    case 'gilt': S.gilt += a; S.stats.giltLife += a; break;
  }
}
function setResource(S, key, a) {
  const q = S.sea, fields = { hum: [S, 'hum'], fossils: [S, 'fossils'], lumen: [S, 'lumen'], shards: [S, 'shards'], tide: [q, 'tide'],
    fathoms: [q, 'fathoms'], dust: [q, 'pearls'], ivory: [S, 'ivory'], gilt: [S, 'gilt'] };
  const [o, k] = fields[key];
  if (a > o[k]) addResource(S, key, a - o[k]); else o[k] = a;
}
const number = text => { const v = Number(String(text).trim()); return Number.isFinite(v) && v >= 0 ? v : null; };

export function initDevTools(ctx) {
  const doc = document;
  if (doc.getElementById('devbar')) return { destroy() {} };
  const el = (tag, props = {}, ...kids) => {
    const node = doc.createElement(tag);
    for (const [k, v] of Object.entries(props)) { if (k === 'text') node.textContent = v; else node.setAttribute(k, v); }
    for (const kid of kids) node.append(kid);
    return node;
  };
  const S = () => ctx.state();
  const done = message => {
    S().stats.devUsed = (S().stats.devUsed || 0) + 1;
    ctx.refreshAll(); ctx.save(); ctx.updateUI(); status(message);
  };
  const bar = el('aside', { id: 'devbar', class: 'devbar', 'aria-label': 'Developer toolbar' });
  const head = el('button', { type: 'button', class: 'devbar-head', 'aria-expanded': 'false' }, el('b', { text: 'Dev' }), el('span', { id: 'devState' }));
  const body = el('div', { class: 'devbar-body', hidden: '' });
  const msg = el('div', { class: 'devbar-msg', role: 'status', id: 'devMsg' });
  const status = text => { msg.textContent = text; };
  const section = (title, ...kids) => el('section', {}, el('h3', { text: title }), ...kids);
  const row = (...kids) => el('div', { class: 'devbar-row' }, ...kids);
  const button = (label, fn, id) => { const b = el('button', { type: 'button', ...(id ? { id } : {}), text: label }); b.addEventListener('click', fn); return b; };
  const select = (id, options) => { const s = el('select', { id }); for (const [v, t] of options) s.append(el('option', { value: v, text: t })); return s; };
  const input = (id, placeholder, value = '') => el('input', { id, type: 'text', inputmode: 'decimal', placeholder, value, autocomplete: 'off', size: '9' });

  // Resources
  const resSel = select('devRes', Object.entries(RESOURCES)), resAmt = input('devAmt', '1e9', '1e9');
  const needNumber = fn => () => { const v = number(resAmt.value); if (v === null) return status('Enter a number such as 5000 or 1e9.'); fn(v); };
  body.append(section('Resources', row(resSel, resAmt),
    row(button('Add', needNumber(v => { addResource(S(), resSel.value, v); done(`Added ${ctx.fmt(v)} ${RESOURCES[resSel.value].toLowerCase()}.`); }), 'devAdd'),
      button('Set to', needNumber(v => { setResource(S(), resSel.value, v); done(`Set ${RESOURCES[resSel.value].toLowerCase()} to ${ctx.fmt(v)}.`); }), 'devSet'))));

  // Progress
  const hearts = input('devHearts', 'hearts'), depth = input('devDepth', 'depth'), sounds = input('devSoundings', 'soundings');
  const apply = (box, label, fn) => button(label, () => { const v = number(box.value); if (v === null || !Number.isInteger(v)) return status('Enter a whole number.'); fn(v); done(`${label} ${v}.`); });
  const floorSel = select('devFloor', ctx.floors.map(f => [f, f])), omenSel = select('devOmen', ctx.omens.map(f => [f, f]));
  body.append(section('Progress',
    row(hearts, apply(hearts, 'Hearts', v => { S().hearts = v; })),
    row(depth, apply(depth, 'Depth', v => { S().depth = v; S().stats.maxDepth = Math.max(S().stats.maxDepth, v); })),
    row(sounds, apply(sounds, 'Soundings', v => { S().sea.soundings = v; })),
    row(floorSel, button('Set floor', () => { S().floor = floorSel.value; done(`Floor is now ${floorSel.value}.`); })),
    row(omenSel, button('Set omen', () => { S().omen = omenSel.value; done(`Omen is now ${omenSel.value}.`); })),
    row(button('Clear cooldowns', () => { S().cool = 0; S().sea.cool = 0; done('Cooldowns cleared.'); }, 'devCool'),
      button('Next descent: Sunvein', () => { S().stats.sunDry = 29; done('The next eligible descent will be a Sunvein.'); }, 'devSun')),
    row(button('Form a pearl now', () => { S().pearls.nacre = 120; done('A pearl is ready: the next oyster to open reveals it.'); }))));

  // Time
  const warp = (label, seconds) => button(label, () => { ctx.grantAway(seconds); done(`Warped ${label}.`); });
  body.append(section('Time away', row(warp('1 min', 60), warp('10 min', 600), warp('1 hour', 3600), warp('6 hours', 21600))));

  // Items
  const horn = select('devHornR', RARITY.slice(0, 5).map((r, i) => [String(i), r.name]));
  const shell = select('devShellR', SHELL_RARITIES.map((r, i) => [String(i), r.name]));
  const pearl = select('devPearlR', PEARL_RARITY.map((r, i) => [String(i), r.name]));
  body.append(section('Items',
    row(horn, button('Grant horn', () => {
      const r = +horn.value; let plan = null;
      for (let i = 0; i < 800 && !(plan && plan.ri === r); i++) plan = ctx.rollPlan(r);
      const h = ctx.buildHorn(plan, null); done(`Granted a ${RARITY[h.r].name} horn: ${h.name}.`);
    }, 'devHorn')),
    row(shell, button('Grant shell', () => {
      const r = +shell.value, sh = S().shells; sh.items.push({ id: ++sh.seq, r, depth: shellDepth(r, 0.5) }); done(`Granted a ${SHELL_RARITIES[r].name} shell.`);
    }, 'devShell')),
    row(pearl, button('Grant pearl', () => {
      const r = +pearl.value; let p = null; const P = S().pearls;
      for (let i = 0; i < 20000 && !(p && p.r === r); i++) { if (p) { P.items.pop(); P.seq--; } p = makePearl(S(), Math.random); }
      done(`Granted a ${PEARL_RARITY[r].name} pearl: ${p.name}.`);
    }, 'devPearl'))));

  // State
  body.append(section('Save and tools', row(
    button('Copy save', async () => { try { await navigator.clipboard.writeText(ctx.encodeSave()); status('Save copied.'); } catch (_) { status('Could not copy; use Settings → Copy save.'); } }),
    button('Hide toolbar', () => toggle(false)),
    button('Lock dev tools', () => ctx.lock(), 'devLock'))), msg);

  head.addEventListener('click', () => toggle(body.hidden));
  function toggle(open) { body.hidden = !open; head.setAttribute('aria-expanded', String(open)); }
  bar.append(head, body); doc.body.append(bar);
  const stateTimer = setInterval(() => {
    const s = S(); if (!s) return;
    $state.textContent = `H${s.hearts} · d${s.depth} · s${s.sea.soundings} · dry ${s.stats.sunDry || 0}${s.stats.devUsed ? ' · marked' : ''}`;
  }, 700);
  const $state = head.querySelector('#devState');
  const onKey = e => { if (e.key === '`' && !/INPUT|TEXTAREA|SELECT/.test(doc.activeElement?.tagName || '')) toggle(body.hidden); };
  doc.addEventListener('keydown', onKey);
  return { destroy() { clearInterval(stateTimer); doc.removeEventListener('keydown', onKey); bar.remove(); } };
}
