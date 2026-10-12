import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/state.js';
import { resetHeartstone, resetSounding, SONG_FATHOMS } from '../src/progression.js';
import { serializeState, restoreState } from '../src/saves.js';
import { CHORUS_COST, CHORUS_CHAPTERS, CHORUS_STEPS, CHORUS_TOTAL, ASSIST_WAIT, LISTEN, payChorus, setUnderway, tickChorus,
  finishChorusAuto, chooseRoute, answerClue, hitChorus, clueAnswer, phraseNeedle, pulseGap, chorusHarmony, chorusEnding,
  chorusRemaining, playKind } from '../src/chorus.js';
const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} },
  TABS: ['cave', 'sea', 'deep'], GILT_CAP: 45, AWAY_CAP: 21600 };
const reload = S => restoreState(serializeState(S), '1.11.0', catalog).state;
const seeded = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
function paid() {
  const S = createState('1.11.0'); S.sea.unlocked = true; S.sea.fathoms = CHORUS_COST + 10;
  assert.equal(payChorus(S, true, 1000), true);
  return S;
}
// Opens the next encounter, standing in the world it asks for.
function openNext(S, random = seeded()) {
  const st = CHORUS_STEPS[S.chorus.step];
  if (st.where) S.world = st.where;
  const event = tickChorus(S, st.gap - S.chorus.clock, random);
  assert.equal(event, 'opened');
  return S.chorus.open;
}

test('five chapters of four encounters, spaced 60–90 seconds apart after the first, about half an hour in all', () => {
  assert.equal(CHORUS_CHAPTERS.length, 5); assert.equal(CHORUS_TOTAL, 20);
  assert.equal(SONG_FATHOMS, CHORUS_COST); assert.equal(CHORUS_COST, 50000);
  for (const st of CHORUS_STEPS.slice(1)) assert(st.gap >= 60 && st.gap <= 90, `gap ${st.gap}`);
  const waits = CHORUS_STEPS.reduce((a, st) => a + st.gap, 0);
  assert(waits >= 24 * 60 && waits <= 28 * 60, `waits ${waits}`);
  assert.deepEqual(CHORUS_CHAPTERS.map(c => c.steps.length), [4, 4, 4, 4, 4]);
  assert.deepEqual([...new Set(CHORUS_STEPS.map(s => s.kind))].sort(), ['clue', 'phrase', 'pulse', 'route']);
});

test('the offering is paid once, only when ready and affordable', () => {
  const S = createState('1.11.0'); S.sea.fathoms = CHORUS_COST - 1;
  assert.equal(payChorus(S, true), false); assert.equal(S.sea.fathoms, CHORUS_COST - 1);
  S.sea.fathoms = CHORUS_COST * 3;
  assert.equal(payChorus(S, false), false); assert.equal(S.sea.fathoms, CHORUS_COST * 3);
  assert.equal(payChorus(S, true, 5), true); assert.equal(S.sea.fathoms, CHORUS_COST * 2);
  assert.equal(payChorus(S, true, 6), false); assert.equal(S.sea.fathoms, CHORUS_COST * 2);
  assert.equal(S.chorus.paid, 5); assert.equal(S.chorus.underway, true); assert.equal(S.finale, 0);
  const R = reload(S);
  assert.equal(payChorus(R, true), false); assert.equal(R.sea.fathoms, CHORUS_COST * 2); assert.equal(R.chorus.paid, 5);
});

test('the clock is real active time: it runs only while underway and holds once an encounter opens', () => {
  const S = paid();
  assert.equal(tickChorus(S, 10), null); assert.equal(S.chorus.clock, 10);
  assert.equal(chorusRemaining(S), CHORUS_STEPS[0].gap - 10);
  setUnderway(S, false);
  assert.equal(tickChorus(S, 1000), null); assert.equal(S.chorus.clock, 10);
  setUnderway(S, true);
  assert.equal(tickChorus(S, 1000), 'opened'); assert.equal(S.chorus.clock, CHORUS_STEPS[0].gap);
  assert.equal(chorusRemaining(S), 0);
  assert.equal(tickChorus(S, 3000), null);
  assert.equal(S.chorus.open.step, 0); assert.equal(S.chorus.step, 0);
});

test('clues: wrong answers lower the result but never fail, and world-tied clues are answered from that world', () => {
  const S = paid(), open = openNext(S), answer = clueAnswer(open);
  assert(answer >= 0);
  S.world = CHORUS_STEPS[0].where === 'sea' ? 'cave' : 'sea';
  assert.equal(answerClue(S, answer), null);
  S.world = CHORUS_STEPS[0].where;
  const wrong = [0, 1, 2].filter(i => i !== answer);
  assert.deepEqual(answerClue(S, wrong[0]), { correct: false });
  assert.equal(answerClue(S, wrong[0]), null, 'a tried option cannot be tried again');
  assert.deepEqual(answerClue(S, answer), { correct: true, event: 'resolved' });
  assert.deepEqual(S.chorus.results, [.5]); assert.equal(S.chorus.step, 1); assert.equal(S.chorus.open, null);
  for (const [tries, expect] of [[0, 1], [2, .25]]) {
    const o = openNext(S), a = clueAnswer(o);
    for (const i of [0, 1, 2].filter(i => i !== a).slice(0, tries)) answerClue(S, i);
    answerClue(S, a);
    assert.equal(S.chorus.results.at(-1), expect);
  }
});

test('phrases and pulses take three timed notes after a listening pause', () => {
  const S = paid();
  while (CHORUS_STEPS[S.chorus.step].kind !== 'phrase') { openNext(S); finishChorusAuto(S); }
  openNext(S);
  assert.equal(hitChorus(S), null, 'listening first');
  // The needle crosses the centre partway through each pass.
  let best = 0, at = LISTEN;
  for (let t = LISTEN; t < LISTEN + 1.1; t += .001) { const d = Math.abs(phraseNeedle(t) - .5); if (d < Math.abs(phraseNeedle(at) - .5)) at = t; }
  for (let n = 0; n < 3; n++) { S.chorus.open && (S.chorus.open.elapsed = at); const r = hitChorus(S); best = Math.max(best, r.quality); }
  assert(best > .99); assert(S.chorus.results.at(-1) > .99);
  assert.equal(pulseGap(0), 0); assert(pulseGap(1) > .2);
  while (CHORUS_STEPS[S.chorus.step].kind !== 'pulse') { openNext(S); finishChorusAuto(S); }
  openNext(S);
  S.chorus.open.elapsed = 3.75; const aligned = hitChorus(S);
  assert(aligned.quality > .99, `pulse ${aligned.quality}`);
  S.chorus.open.elapsed = 1; assert.equal(hitChorus(S).quality, 0);
  assert.equal(finishChorusAuto(S), 'resolved');
  assert(Math.abs(S.chorus.results.at(-1) - (1 + 0 + .5) / 3) < 1e-12, 'Auto fills unplayed notes with the average');
});

test('routes: steady always advances; timing and listening become their challenges', () => {
  const S = paid();
  while (CHORUS_STEPS[S.chorus.step].kind !== 'route') { openNext(S); finishChorusAuto(S); }
  openNext(S);
  S.world = 'cave'; assert.equal(chooseRoute(S, 'steady'), null, 'the Quiet Sea is crossed from the Sea');
  S.world = 'sea'; assert.equal(chooseRoute(S, 'steady'), 'resolved'); assert.equal(S.chorus.results.at(-1), .6);
  openNext(S); assert.equal(chooseRoute(S, 'timing'), 'chosen'); assert.equal(playKind(S.chorus.open), 'phrase');
  assert.equal(chooseRoute(S, 'steady'), null, 'a route is chosen once');
  finishChorusAuto(S);
  openNext(S, seeded(3)); assert.equal(chooseRoute(S, 'listening', seeded(4)), 'chosen'); assert.equal(playKind(S.chorus.open), 'clue');
  assert.equal(answerClue(S, clueAnswer(S.chorus.open)).event, 'resolved');
  assert.equal(S.chorus.results.at(-1), 1);
});

test('Auto assistance gives average quality and takes longer than playing; completion sets the finale once', () => {
  const S = paid(); S.chorus.assist = true;
  let t = 0, last;
  while (!S.chorus.done && t < 4000) { last = tickChorus(S, .5, seeded(), 1e6 + t); t += .5; }
  assert.equal(last, 'complete');
  const waits = CHORUS_STEPS.reduce((a, st) => a + st.gap, 0);
  assert(Math.abs(t - (waits + CHORUS_TOTAL * ASSIST_WAIT)) <= CHORUS_TOTAL, `assisted time ${t}`);
  assert.equal(chorusHarmony(S), .5); assert.equal(chorusEnding(.5), 'Quiet');
  assert.equal(S.finale, S.chorus.done); assert.equal(S.chorus.underway, false);
  const done = S.finale;
  assert.equal(tickChorus(S, 100), null); assert.equal(finishChorusAuto(S), null);
  assert.equal(payChorus(S, true), false);
  assert.deepEqual([chorusEnding(.55), chorusEnding(.8), chorusEnding(null)], ['Full', 'Radiant', null]);
  const R = reload(S);
  assert.equal(R.finale, done); assert.equal(R.chorus.done, done); assert.equal(R.chorus.results.length, CHORUS_TOTAL);
});

test('progress survives reloads and every reset; an open encounter keeps its notes and answers', () => {
  let S = paid();
  openNext(S); finishChorusAuto(S);
  const clue = openNext(S, seeded(11)), wrong = [0, 1, 2].find(i => i !== clueAnswer(clue));
  answerClue(S, wrong);
  tickChorus(S, 4);
  S = reload(S);
  assert.equal(S.chorus.step, 1); assert.deepEqual(S.chorus.results, [.5]);
  assert.deepEqual(S.chorus.open.wrong, [wrong]); assert.deepEqual(S.chorus.open.motif, clue.motif); assert.equal(S.chorus.open.elapsed, 4);
  resetSounding(S, 3);
  S = resetHeartstone(S, '1.11.0');
  assert.equal(S.chorus.step, 1); assert.deepEqual(S.chorus.open.wrong, [wrong]); assert.equal(S.chorus.paid, 1000);
  S.world = CHORUS_STEPS[1].where;
  assert.equal(answerClue(S, clueAnswer(S.chorus.open)).event, 'resolved');
});

test('saves cannot invent progress, and unreadable encounters reopen fresh', () => {
  const S = paid();
  const data = serializeState(S);
  data.chorus = { ...data.chorus, step: 15, results: [1, 1, 'x', 2], clock: 1e9, open: { step: 2, kind: 'clue' } };
  let R = restoreState(data, '1.11.0', catalog).state;
  assert.equal(R.chorus.step, 2); assert.deepEqual(R.chorus.results, [1, 1]);
  assert.equal(R.chorus.open, null); assert.equal(R.chorus.clock, CHORUS_STEPS[2].gap);
  assert.equal(tickChorus(R, .1), 'opened');
  data.chorus = { paid: 0, step: 9, results: [1, 1, 1], open: { step: 0 }, underway: true };
  R = restoreState(data, '1.11.0', catalog).state;
  assert.deepEqual([R.chorus.paid, R.chorus.step, R.chorus.results.length, R.chorus.open, R.chorus.underway], [0, 0, 0, null, false]);
  data.chorus = { paid: 1, step: 20, results: Array(20).fill(.9) };
  R = restoreState(data, '1.11.0', catalog, 77).state;
  assert.equal(R.chorus.done, 77); assert.equal(R.finale, 77);
});

test('finales answered before 1.11.0 stay complete and never charge again', () => {
  const S = createState('1.10.8'); S.finale = 123; S.sea.fathoms = 1e6; delete S.chorus;
  const R = restoreState(serializeState(S), '1.11.0', catalog).state;
  assert.equal(R.finale, 123); assert.equal(R.chorus.done, 123); assert.equal(R.chorus.legacy, true);
  assert.equal(chorusHarmony(R), null);
  assert.equal(payChorus(R, true), false); assert.equal(R.sea.fathoms, 1e6);
  assert.equal(tickChorus(R, 100), null);
});
