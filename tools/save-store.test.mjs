import test from 'node:test';
import assert from 'node:assert/strict';
import { createSaveStore } from '../src/save-store.js';
function fixture() {
  const local = new Map(), session = new Map(); let reloads = 0;
  const adapter = map => ({ getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: k => map.delete(k) });
  const storage = adapter(local), sessionStorage = adapter(session);
  const store = createSaveStore({ key: 'gc', serialize: () => ({ hum: 3, name: '歌 🎺' }),
    storage: () => storage, session: () => sessionStorage, reload: () => reloads++, now: () => 123 });
  return { store, local, storage, reloads: () => reloads };
}
test('GC1 codes roundtrip Unicode and whitespace and reject invalid inputs', () => {
  const { store } = fixture();
  assert.deepEqual(store.decodeSave(' \n' + store.encodeSave() + '\n'), { hum: 3, name: '歌 🎺' });
  for (const bad of ['GC2:abc', 'GC1:!!!', 'GC1:' + btoa('{}')]) assert.equal(store.decodeSave(bad), null);
});
test('replacement keeps the previous backup, suppresses old-state writes and consumes the import marker once', () => {
  const { store, local, reloads } = fixture();
  assert.equal(store.replaceSaveAndReload({ hum: 9 }), true);
  assert.equal(reloads(), 1);
  assert.deepEqual(JSON.parse(store.readBackup().data), { hum: 3, name: '歌 🎺' });
  assert.equal(store.readBackup().at, 123);
  store.save();
  assert.deepEqual(JSON.parse(local.get('gc')), { hum: 9 });
  assert.equal(store.consumeImport(), true);
  assert.equal(store.consumeImport(), false);
});
test('failed import preserves state and does not reload or suppress later saves', () => {
  const { store, storage, reloads } = fixture();
  store.save(); const original = storage.setItem;
  storage.setItem = () => { throw Error('full'); };
  assert.equal(store.replaceSaveAndReload({ hum: 9 }), false);
  assert.equal(reloads(), 0);
  storage.setItem = original;
  store.save(); assert.equal(store.read().hum, 3);
});

test('save, backup and replacement write failures warn only once per session and successful retries still write', () => {
  for (const first of ['save', 'backupNow', 'replaceSaveAndReload']) {
    let warnings = 0, blocked = true;
    const map = new Map([['gc', '{"hum":1}']]);
    const storage = { getItem: k => map.get(k), setItem: (k, v) => { if (blocked) throw Error('quota'); map.set(k, v); } };
    const store = createSaveStore({ key: 'gc', serialize: () => ({ hum: 2 }), storage: () => storage,
      session: () => storage, reload: () => {}, onFailure: () => warnings++ });
    store[first]({ hum: 3 });
    store.save(); store.backupNow(); store.replaceSaveAndReload({ hum: 3 });
    assert.equal(warnings, 1, first);
    blocked = false; store.save(); assert.equal(store.read().hum, 2);
  }
});
