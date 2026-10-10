import test from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../src/state.js';
import { advanceOfflineHorns } from '../src/offline-horns.js';
const state = patch => Object.assign(createState('1.10.4'), { hornsOn: true }, patch);
test('locked horns never advance; partial progress uses away efficiency and tick speed once', () => {
  const locked = state({ hornsOn: false });
  assert.equal(advanceOfflineHorns(locked, 21600, 2, 1, 360), 0);
  assert.equal(locked.hornTimer, 360);
  const S = state();
  assert.equal(advanceOfflineHorns(S, 100, 2, .35, 360), 0);
  assert.equal(S.hornTimer, 290);
  assert.equal(advanceOfflineHorns(S, 145, 2, 1, 360), 1);
  assert.equal(S.hornTimer, 360);
});
test('each absence grants at most five; excess time is consumed rather than banked', () => {
  const S = state({ hornAuto: true });
  assert.equal(advanceOfflineHorns(S, 21600, 1, 1, 360), 5);
  assert.equal(S.hornTimer, 360);
  assert.equal(advanceOfflineHorns(S, 1, 1, 1, 360), 0);
  assert.equal(S.hornTimer, 359);
});
test('manual calls and unfinished notes survive; available save capacity bounds new calls', () => {
  const plan = { perfs: [.9], ri: 2 };
  const S = state({ hornQueue: 2, hornPlan: plan });
  assert.equal(advanceOfflineHorns(S, 21600, 1, 1, 360), 5);
  assert.equal(S.hornQueue, 2);
  assert.equal(S.hornPlan, plan);
  assert.equal(S.hornTimer, 0);
  S.hornQueue = 7;
  assert.equal(advanceOfflineHorns(S, 21600, 1, 1, 360), 1);
  S.hornQueue = 9;
  assert.equal(advanceOfflineHorns(S, 21600, 1, 1, 360), 0);
});
test('short returns keep remaining interval; Keen Ear changes arrival frequency', () => {
  const S = state({ hornTimer: 60 });
  assert.equal(advanceOfflineHorns(S, 190, 1, 1, 120), 2);
  assert.equal(S.hornTimer, 110);
});
