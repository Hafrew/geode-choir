import assert from 'node:assert/strict';
import test from 'node:test';
import { createState } from '../src/state.js';
import { serializeState, restoreState } from '../src/saves.js';

const catalog = { WONDERS: {}, PEARLOBJ: {}, FLOORS: { still: {} }, OMENS: { steady: {} }, TABS: ['cave', 'sea', 'horns'], GILT_CAP: 45, AWAY_CAP: 21600 };
const load = patch => restoreState({ ...serializeState(createState('1.10.4'), 1000), ...patch }, '1.10.4', catalog, 1000).state;
const horn = (over = {}) => ({ id: 1, r: 2, name: 'Singing Ram Horn of the Deep Choir', seed: 7, lines: [{ stat: 'hum', kind: 'pct', v: 50 }], ...over });

test('a clean horn survives an import untouched', () => {
  const S = load({ horns: [horn({ gold: true, q: 0.6 })], hornSeq: 1 });
  assert.equal(S.horns.length, 1);
  assert.equal(S.horns[0].name, 'Singing Ram Horn of the Deep Choir');
  assert.equal(S.horns[0].gold, true);
});

test('markup in a horn or collection name is stripped on import', () => {
  const evil = '<img src=x onerror=alert(1)>Ram "Horn"';
  const S = load({ horns: [horn({ name: evil })], coll: { 'curl:2': { seed: 3, name: evil, ls: ['hum'], n: 1, r: 2 } } });
  assert.doesNotMatch(S.horns[0].name, /[<>"&=]/);
  assert.doesNotMatch(S.coll['curl:2'].name, /[<>"&=]/);
});

test('hostile horn fields are coerced or dropped', () => {
  const S = load({
    horns: [
      horn({ id: '1"><b>', r: 'length' }), horn({ id: 2, r: 99 }), horn({ id: 3, lines: [{ stat: '__proto__', kind: 'pct', v: 5 }] }),
      horn({ id: 4, lines: [{ stat: 'hum', kind: '<x>', v: 5 }] }), horn({ id: 5, seed: '<s>' }), horn({ id: 5 }), null, 'x',
    ],
    coll: { 'bad:1': { name: 'x' }, 'curl:<q>': { name: 'x' }, 'tines:9': { name: 'x' } },
  });
  assert.deepEqual(S.horns.map(h => h.id), [5]);
  assert.equal(typeof S.horns[0].seed, 'number');
  assert.deepEqual(Object.keys(S.coll), ['curl:2']); // rebuilt from the surviving horn, bad keys gone
  assert.ok(Number.isFinite(S.stats.bestHorn) && S.hornSeq >= 5);
});

test('line values are bounded', () => {
  const S = load({ horns: [horn({ lines: [{ stat: 'hum', kind: 'pct', v: 1e300 }] })] });
  assert.ok(S.horns[0].lines[0].v <= 1e4);
});
