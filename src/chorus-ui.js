import { CHORUS_CHAPTERS, CHORUS_STEPS, NOTES, ASSIST_WAIT, LISTEN, chorusActive, chorusStep, playKind, atPlace,
  tickChorus, setUnderway, finishChorusAuto, chooseRoute, answerClue, clueShown, replayClue, hitChorus,
  phraseNeedle, pulseGap, pulseSizes, chorusHarmony, chorusRemaining } from './chorus.js';

// The expedition card on the stage. Presentation owns no rewards: every result comes from chorus.js,
// and the open encounter (notes, answers, elapsed time) lives in the save.
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const PITCH = ['low', 'middle', 'high'];
const PROMPTS = [
  'A voice under the water hums three notes. Listen, then choose the line you heard.',
  'The same voice, fainter, from a crack in the cave wall.',
  'It has moved again, out past the farthest buoy.',
  'In the oldest cave the First Voice waits for you to sing its line back.',
  'The first singer stirs. Answer her phrase with your horns.',
  'A second bench of singers draws breath.',
  'The back row is listening now. Give them the third phrase.',
  'The choir sings a phrase back to you. Which one was it?',
  'The sea has gone silent. Choose how to cross this stretch.',
  'Fog lies flat on the water. Choose how to cross.',
  'The bells have stopped swaying. Choose how to cross.',
  'The far shore is close. Choose how to cross the last stretch.',
  'Half of the broken Heartstone beats in the cave. Charge it in step with its other half.',
  'The other half lies under the sea, beating slower. Catch them together.',
  'The crack narrows. Charge the cave half again.',
  'One more pulse from the sea closes it.',
  'The choir hums the opening of the Last Chorus. Which line is it?',
  'Your horns carry the middle verse.',
  'Cave and sea must breathe together, once more.',
  'Sing the last line of the Last Chorus.',
];
const mmss = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const worldName = w => w === 'sea' ? 'Sea' : 'Cave';
const bars = (notes, cls = '') => `<span class="chorus-bars${cls}" aria-hidden="true">${notes.map(n => `<i style="--h:${n}"></i>`).join('')}</span>`;
const words = notes => notes.map(n => PITCH[n]).join(', ');

export function createChorusUI({ state, active, draw, changed, sound, goWorld, horns }) {
  const $ = id => document.getElementById(id);
  const root = $('chorus');
  let key = '', last = '';
  root.addEventListener('click', e => {
    const button = e.target.closest('button[data-chorus]');
    if (!button || button.getAttribute('aria-disabled') === 'true') return;
    const S = state(), action = button.dataset.chorus;
    let event = null;
    if (action === 'leave' || action === 'resume') setUnderway(S, action === 'resume');
    else if (action === 'go') { goWorld(button.dataset.world); }
    else if (action === 'auto') { event = finishChorusAuto(S); last = ''; }
    else if (action === 'route') {
      event = chooseRoute(S, button.dataset.mode);
      if (event === 'chosen') { event = null; last = ''; if (playKind(S.chorus.open) === 'clue') sound('clue', S.chorus.open.motif); }
    }
    else if (action === 'replay') { if (replayClue(S)) sound('clue', S.chorus.open.motif); }
    else if (action === 'answer') {
      const r = answerClue(S, +button.dataset.index);
      if (!r) return;
      last = r.correct ? '' : 'Not that one. Try another; the line still counts.';
      sound(r.correct ? 'resolve' : 'miss', r.correct ? S.chorus.results.at(-1) : 0);
      event = r.event || null;
    } else if (action === 'hit') {
      if (!active()) return;
      const r = hitChorus(S);
      if (!r) return;
      last = `Note ${S.chorus.open ? S.chorus.open.notes.length : NOTES}: ${Math.round(r.quality * 100)}%`;
      sound('hit', r.quality);
      if (r.event) last = '';
      event = r.event || null;
    } else return;
    const focused = document.activeElement === button;
    changed(event);
    render();
    if (focused) (root.querySelector(`[data-chorus="${action}"]`) || root.querySelector('button[data-chorus="hit"], button[data-chorus="answer"], button[data-chorus="route"], button[data-chorus]'))?.focus();
  });

  root.addEventListener('change', e => {
    if (!e.target.matches('[data-chorus-assist]')) return;
    state().chorus.assist = e.target.checked;
    changed(null);
    render();
    root.querySelector('[data-chorus-assist]')?.focus();
  });

  function body(S) {
    const C = S.chorus, st = chorusStep(S), open = C.open, kind = playKind(open);
    const where = `Chapter ${ROMAN[st.chapter]} · ${CHORUS_CHAPTERS[st.chapter].name} · ${st.index + 1} of ${CHORUS_CHAPTERS[st.chapter].steps.length}`;
    if (!C.underway) return `<div class="chorus-row"><span><b>The Last Chorus</b> is paused · ${where}</span><button type="button" data-chorus="resume">Resume</button></div>`;
    if (!open) return `<div class="chorus-row"><span><b>The Last Chorus</b> · ${where}</span><span class="mono" id="chorusNext"></span><button type="button" data-chorus="leave">Leave</button></div>`;
    const harmony = chorusHarmony(S);
    let html = `<header class="chorus-head"><b>The Last Chorus</b><span>${where}</span></header><p>${PROMPTS[C.step]}</p>`;
    if (!atPlace(S)) {
      html += `<p>This one is answered from the <b>${worldName(st.where)}</b>.</p><button type="button" data-chorus="go" data-world="${st.where}">Go to the ${worldName(st.where)}</button>`;
    } else if (kind === 'route') {
      html += `<div class="chorus-choices">
        <button type="button" data-chorus="route" data-mode="steady">Steady route<small>Always crosses, with plain harmony.</small></button>
        <button type="button" data-chorus="route" data-mode="timing">Timing challenge<small>Three notes; better timing, richer harmony.</small></button>
        <button type="button" data-chorus="route" data-mode="listening">Listening puzzle<small>Hear a line, then pick it out.</small></button></div>`;
    } else if (kind === 'clue') {
      html += clueShown(open)
        ? `<div class="chorus-clue">${bars(open.motif, ' big')}<p class="note">Listen: <b>${words(open.motif)}</b></p></div>`
        : `<p class="note">Which line did you hear?</p><div class="chorus-options">${open.options.map((o, i) => `<button type="button" data-chorus="answer" data-index="${i}" aria-label="${words(o)}" ${open.wrong.includes(i) ? 'aria-disabled="true" class="tried"' : ''}>${bars(o)}<small>${words(o)}</small></button>`).join('')}</div>
          <button type="button" data-chorus="replay">Hear it again</button>`;
    } else if (kind === 'phrase') {
      const worn = horns();
      html += `<p class="note">${worn.length ? `Your worn horns answer: ${worn.join(', ')}.` : 'You answer with your own voice; worn horns would join in.'} Sound when the needle crosses the centre. You can wait for another pass.</p>
        <div class="shell-track chorus-track" aria-hidden="true"><span class="shell-target" style="width:36%"></span><i id="chorusNeedle"></i></div>
        <button type="button" data-chorus="hit">Sound note ${open.notes.length + 1} of ${NOTES}</button>`;
    } else if (kind === 'pulse') {
      html += `<div class="chorus-pulse" aria-hidden="true"><i id="chorusPulseA"></i><i id="chorusPulseB"></i></div>
        <div class="bar chorus-meter" aria-hidden="true"><i id="chorusMeter"></i></div>
        <button type="button" data-chorus="hit">Charge in step · ${open.notes.length + 1} of ${NOTES}</button>`;
    }
    html += `<p class="note" id="chorusTiming"></p><p class="note chorus-last" aria-live="polite">${last}</p>
      <div class="chorus-foot"><button type="button" data-chorus="auto">Finish with Auto</button><span class="note">Auto gives an average result.${harmony == null ? '' : ` Harmony so far ${Math.round(harmony * 100)}%.`}</span>
        <label class="note"><input type="checkbox" data-chorus-assist ${C.assist ? 'checked' : ''}> Let the choir carry encounters I leave for ${ASSIST_WAIT}s</label></div>`;
    return html;
  }

  function render() {
    if (!draw()) return;
    const S = state(), on = chorusActive(S);
    if (root.hidden === on) root.hidden = !on;
    root.classList.toggle('open', on && !!S.chorus.open && S.chorus.underway);
    if (!on) { key = ''; return; }
    const C = S.chorus, open = C.open;
    const next = JSON.stringify([C.step, C.underway, S.world, C.assist, last, open && { ...open, elapsed: undefined, shown: clueShown(open) }, C.results.length]);
    if (next !== key) { key = next; root.innerHTML = body(S); }
    if (!open) { const t = $('chorusNext'); if (t) t.textContent = `next in ${mmss(chorusRemaining(S))}`; return; }
    const kind = playKind(open), timing = $('chorusTiming'), e = open.elapsed;
    if (kind === 'phrase') { const n = $('chorusNeedle'); if (n) n.style.left = `${100 * phraseNeedle(e)}%`; }
    if (kind === 'pulse') {
      const [a, b] = pulseSizes(e), inStep = Math.max(0, 1 - pulseGap(e) / .5);
      const pa = $('chorusPulseA'), pb = $('chorusPulseB'), m = $('chorusMeter');
      if (pa) pa.style.setProperty('--s', (.35 + .65 * a).toFixed(3));
      if (pb) pb.style.setProperty('--s', (.35 + .65 * b).toFixed(3));
      if (m) m.style.width = `${Math.round(100 * inStep)}%`;
      if (timing && e >= LISTEN) timing.textContent = `In step: ${Math.round(100 * inStep)}%`;
    }
    const hit = root.querySelector('[data-chorus="hit"]');
    if (hit) hit.setAttribute('aria-disabled', String(e < LISTEN || !atPlace(S)));
    if (timing && (kind !== 'pulse' || e < LISTEN)) timing.textContent = (kind === 'phrase' || kind === 'pulse') && e < LISTEN ? 'Listen…'
      : C.assist ? `The choir will carry this one in ${mmss(Math.max(0, ASSIST_WAIT - e))} if you leave it.` : '';
  }

  return {
    render,
    tick(dt) {
      const S = state();
      if (!chorusActive(S)) { render(); return; }
      if (active()) {
        const before = S.chorus.step, event = tickChorus(S, dt);
        if (event === 'opened') { last = ''; sound('open', CHORUS_STEPS[S.chorus.step].kind); if (playKind(S.chorus.open) === 'clue') sound('clue', S.chorus.open.motif); }
        if (event) changed(event, before);
      }
      render();
    },
  };
}
