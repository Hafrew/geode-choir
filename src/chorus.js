// The Last Chorus: the finale expedition, paid for once with the Undersong offering.
// Rules only, without DOM, audio or storage. Its clock is active real time: callers advance it only while the
// expedition is underway and visible, and never scale it by Faster Tick. Waiting never worsens a result.
// No imports, so state and progression can both depend on this module without a cycle.
const CHORUS_COST = 50000;
const AUTO_QUALITY = .5, ROUTE_STEADY = .6, ASSIST_WAIT = 25, LISTEN = 1, NOTES = 3, CLUE_SHOW = 3;
const PHRASE_WIDTH = .18, PULSE_A = 1.5, PULSE_B = 2.5, PULSE_WIDTH = .2;
// Seconds of active time before each encounter opens, about six minutes a chapter with interactions.
const GAPS = [[15, 85, 80, 90], [70, 85, 80, 90], [70, 85, 80, 90], [70, 85, 80, 90], [70, 85, 80, 90]];
const CHORUS_CHAPTERS = [
  { name: 'Find the First Voice', steps: [['clue', 'sea'], ['clue', 'cave'], ['clue', 'sea'], ['clue', 'cave']] },
  { name: 'Wake the Choir', steps: [['phrase'], ['phrase'], ['phrase'], ['clue']] },
  { name: 'Cross the Quiet Sea', steps: [['route', 'sea'], ['route', 'sea'], ['route', 'sea'], ['route', 'sea']] },
  { name: 'Mend the Fracture', steps: [['pulse', 'cave'], ['pulse', 'sea'], ['pulse', 'cave'], ['pulse', 'sea']] },
  { name: 'Sound the Last Chorus', steps: [['clue'], ['phrase'], ['pulse'], ['phrase']] },
];
const CHORUS_STEPS = CHORUS_CHAPTERS.flatMap((ch, chapter) => ch.steps.map(([kind, where], i) =>
  ({ chapter, index: i, kind, where: where || null, gap: GAPS[chapter][i] })));
const CHORUS_TOTAL = CHORUS_STEPS.length;
const ENDINGS = [[.8, 'Radiant'], [.55, 'Full'], [0, 'Quiet']];

const freshChorus = () => ({ paid: 0, underway: false, step: 0, clock: 0, open: null, results: [], assist: false, done: 0, legacy: false });
const clamp01 = q => Number.isFinite(q) ? Math.min(1, Math.max(0, q)) : 0;
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
const frac = x => x - Math.floor(x);
const chorusStep = S => S.chorus && !S.chorus.done ? CHORUS_STEPS[S.chorus.step] || null : null;
const chorusActive = S => !!(S.chorus?.paid && !S.chorus.done);
// The interaction actually being played: a route becomes the timing or listening challenge it chose.
const playKind = open => !open ? null : open.kind !== 'route' ? open.kind
  : open.mode === 'timing' ? 'phrase' : open.mode === 'listening' ? 'clue' : 'route';
// An encounter tied to one world is answered from there. Auto is always available anywhere.
const atPlace = S => { const st = chorusStep(S); return !!st && (!st.where || S.world === st.where); };

// Three notes, each low (0), middle (1) or high (2). Decoys differ from the clue in at least one note.
function makeClue(random) {
  const pick = () => [0, 1, 2].map(() => Math.floor(random() * 3) % 3);
  const motif = pick(), options = [motif], same = (a, b) => a.every((n, i) => n === b[i]);
  for (let guard = 0; options.length < 3 && guard < 50; guard++) { const o = pick(); if (!options.some(x => same(x, o))) options.push(o); }
  for (let n = 0; options.length < 3; n++) { const o = motif.map((v, i) => i === n % 3 ? (v + 1 + Math.floor(n / 3)) % 3 : v); if (!options.some(x => same(x, o))) options.push(o); }
  for (let i = options.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)) % (i + 1); [options[i], options[j]] = [options[j], options[i]]; }
  return { motif, options, wrong: [] };
}
const clueAnswer = open => open.options.findIndex(o => o.every((n, i) => n === open.motif[i]));

function payChorus(S, ready, now = Date.now()) {
  const C = S.chorus;
  if (!ready || C.paid || C.done || !(S.sea.fathoms >= CHORUS_COST)) return false;
  S.sea.fathoms -= CHORUS_COST;
  Object.assign(C, { paid: now, underway: true, step: 0, clock: 0, open: null, results: [] });
  return true;
}
function setUnderway(S, on) {
  if (!chorusActive(S)) return false;
  S.chorus.underway = !!on;
  return true;
}
function openEncounter(S, random = Math.random) {
  const st = chorusStep(S);
  if (!st) return null;
  const open = { step: S.chorus.step, kind: st.kind, elapsed: 0 };
  if (st.kind === 'clue') Object.assign(open, makeClue(random));
  if (st.kind === 'phrase' || st.kind === 'pulse') open.notes = [];
  if (st.kind === 'route') open.mode = null;
  S.chorus.open = open;
  return open;
}
function resolveEncounter(S, quality, now = Date.now()) {
  const C = S.chorus;
  if (!C.open) return null;
  C.results.push(clamp01(quality));
  C.step++; C.clock = 0; C.open = null;
  if (C.step < CHORUS_TOTAL) return 'resolved';
  C.done = now; C.underway = false;
  if (!S.finale) S.finale = now;
  return 'complete';
}
// Advances only the expedition clock. Returns 'opened', 'resolved' (assisted), 'complete' or null.
function tickChorus(S, dt, random = Math.random, now = Date.now()) {
  const C = S.chorus;
  if (!chorusActive(S) || !C.underway || !(dt > 0)) return null;
  if (C.open) {
    C.open.elapsed = Math.min(3600, C.open.elapsed + dt);
    return C.assist && C.open.elapsed >= ASSIST_WAIT ? finishChorusAuto(S, now) : null;
  }
  const st = chorusStep(S);
  C.clock = Math.min(st.gap, C.clock + dt);
  if (C.clock < st.gap) return null;
  openEncounter(S, random);
  return 'opened';
}
// Average quality; notes already played count, and Auto fills the rest.
function finishChorusAuto(S, now = Date.now()) {
  const open = S.chorus?.open;
  if (!open) return null;
  const notes = Array.isArray(open.notes) ? open.notes : [];
  const quality = notes.length ? mean([...notes, ...Array(NOTES - notes.length).fill(AUTO_QUALITY)]) : AUTO_QUALITY;
  return resolveEncounter(S, quality, now);
}
function chooseRoute(S, mode, random = Math.random, now = Date.now()) {
  const open = S.chorus?.open;
  if (!open || open.kind !== 'route' || open.mode || !atPlace(S)) return null;
  if (mode === 'steady') { open.mode = 'steady'; return resolveEncounter(S, ROUTE_STEADY, now); }
  if (mode === 'timing') Object.assign(open, { mode, notes: [], elapsed: 0 });
  else if (mode === 'listening') Object.assign(open, { mode, elapsed: 0 }, makeClue(random));
  else return null;
  return 'chosen';
}
// A wrong answer removes that option and lowers the result; the right one always advances.
function answerClue(S, index, now = Date.now()) {
  const open = S.chorus?.open;
  if (playKind(open) !== 'clue' || !atPlace(S) || !Number.isInteger(index) || index < 0 || index > 2 || open.wrong.includes(index)) return null;
  if (index === clueAnswer(open)) return { correct: true, event: resolveEncounter(S, [1, .5, .25][open.wrong.length], now) };
  open.wrong.push(index);
  return { correct: false };
}
// A clue is shown (and heard) for a few seconds, then hidden while the player chooses. Replaying is free.
const clueShown = open => playKind(open) === 'clue' && open.elapsed < CLUE_SHOW;
function replayClue(S) {
  const open = S.chorus?.open;
  if (playKind(open) !== 'clue') return false;
  open.elapsed = 0;
  return true;
}
const phraseNeedle = elapsed => (1 - Math.cos(Math.max(0, elapsed - LISTEN) * Math.PI / 1.1)) / 2;
// Two pulses at different speeds drift in and out of step; 0 is aligned, .5 is opposite.
function pulseGap(elapsed) {
  const d = Math.abs(frac(elapsed / PULSE_A) - frac(elapsed / PULSE_B));
  return Math.min(d, 1 - d);
}
const pulseSizes = elapsed => [frac(elapsed / PULSE_A), frac(elapsed / PULSE_B)];
function hitChorus(S, now = Date.now()) {
  const open = S.chorus?.open, kind = playKind(open);
  if ((kind !== 'phrase' && kind !== 'pulse') || !atPlace(S) || open.elapsed < LISTEN) return null;
  const quality = kind === 'phrase'
    ? Math.max(0, 1 - Math.abs(phraseNeedle(open.elapsed) - .5) / PHRASE_WIDTH)
    : Math.max(0, 1 - pulseGap(open.elapsed) / PULSE_WIDTH);
  open.notes.push(quality); open.elapsed = 0;
  if (open.notes.length >= NOTES) return { quality, event: resolveEncounter(S, mean(open.notes), now) };
  return { quality };
}
const chorusHarmony = S => S.chorus?.results?.length ? mean(S.chorus.results) : null;
const chorusEnding = harmony => harmony == null ? null : ENDINGS.find(([min]) => harmony >= min)[1];
const chorusRemaining = S => { const st = chorusStep(S); return st && !S.chorus.open ? Math.max(0, st.gap - S.chorus.clock) : 0; };

function normalizeChorus(S, now = Date.now()) {
  const raw = S.chorus && typeof S.chorus === 'object' ? S.chorus : {};
  const C = freshChorus(), time = v => Number.isFinite(+v) && +v > 0 ? +v : 0;
  C.assist = !!raw.assist;
  C.paid = time(raw.paid); C.done = time(raw.done);
  // Finales answered before the expedition existed stay complete; replay is cosmetic.
  if (S.finale > 0 && !C.done) { C.done = S.finale; C.legacy = !C.paid || !!raw.legacy; }
  else C.legacy = !!raw.legacy && C.done > 0;
  if (C.done) {
    C.paid = C.paid || C.done;
    if (!(S.finale > 0)) S.finale = C.done;
  }
  if (C.paid) {
    const results = Array.isArray(raw.results) ? raw.results.filter(q => Number.isFinite(q) && q >= 0 && q <= 1).slice(0, CHORUS_TOTAL) : [];
    C.results = results;
    C.step = C.done ? Math.max(results.length, Math.min(CHORUS_TOTAL, Number.isInteger(raw.step) ? raw.step : 0)) : results.length;
    if (!C.done && C.step >= CHORUS_TOTAL) { C.done = now; S.finale = S.finale || now; }
  }
  if (chorusActive({ chorus: C })) {
    C.underway = !!raw.underway;
    const st = CHORUS_STEPS[C.step];
    C.clock = Number.isFinite(+raw.clock) ? Math.min(st.gap, Math.max(0, +raw.clock)) : 0;
    C.open = validOpen(raw.open, C.step, st);
    // An unreadable encounter reopens fresh at once rather than costing time.
    if (raw.open && !C.open) C.clock = st.gap;
  }
  S.chorus = C;
  return C;
}
function validOpen(o, step, st) {
  if (!o || typeof o !== 'object' || o.step !== step || o.kind !== st.kind) return null;
  const open = { step, kind: st.kind, elapsed: Number.isFinite(+o.elapsed) ? Math.min(3600, Math.max(0, +o.elapsed)) : 0 };
  if (st.kind === 'route') {
    if (![null, undefined, 'timing', 'listening'].includes(o.mode)) return null;
    open.mode = o.mode || null;
  }
  const kind = playKind(open), note = n => Number.isInteger(n) && n >= 0 && n <= 2;
  if (kind === 'phrase' || kind === 'pulse') {
    if (!Array.isArray(o.notes)) return null;
    open.notes = o.notes.filter(q => Number.isFinite(q) && q >= 0 && q <= 1).slice(0, NOTES - 1);
  }
  if (kind === 'clue') {
    const triple = a => Array.isArray(a) && a.length === 3 && a.every(note);
    if (!triple(o.motif) || !Array.isArray(o.options) || o.options.length !== 3 || !o.options.every(triple)) return null;
    open.motif = [...o.motif]; open.options = o.options.map(a => [...a]);
    const answer = clueAnswer(open);
    if (answer < 0) return null;
    open.wrong = [...new Set(Array.isArray(o.wrong) ? o.wrong : [])].filter(i => note(i) && i !== answer).slice(0, 2);
  }
  return open;
}

export { CHORUS_COST, CHORUS_CHAPTERS, CHORUS_STEPS, CHORUS_TOTAL, AUTO_QUALITY, ROUTE_STEADY, ASSIST_WAIT, LISTEN, NOTES, CLUE_SHOW,
  freshChorus, chorusStep, chorusActive, playKind, atPlace, clueAnswer, payChorus, setUnderway, openEncounter, tickChorus,
  finishChorusAuto, chooseRoute, answerClue, clueShown, replayClue, hitChorus, phraseNeedle, pulseGap, pulseSizes, chorusHarmony, chorusEnding,
  chorusRemaining, normalizeChorus };
