// Browser persistence orchestration. Rules/migration stay in saves.js; storage
// and navigation are supplied so the same behavior can be verified without a DOM.
export function createSaveStore({ key, serialize, storage, session, reload, now = Date.now, onFailure = () => {} }) {
  const backupKey = key + '-backup';
  let noSave = false, warned = false;
  function writeFailed() {
    if (warned) return;
    warned = true;
    onFailure();
  }
  function save() {
    if (noSave) return;
    try { storage().setItem(key, JSON.stringify(serialize())); } catch (_) { writeFailed(); }
  }
  function read() {
    try { return JSON.parse(storage().getItem(key) || 'null'); } catch (_) { return null; }
  }
  function backupNow(raw) {
    try {
      const data = raw != null ? raw : storage().getItem(key);
      if (data) storage().setItem(backupKey, JSON.stringify({ at: now(), data }));
    } catch (_) { writeFailed(); }
  }
  function readBackup() {
    try {
      const b = JSON.parse(storage().getItem(backupKey) || 'null');
      return b && typeof b.data === 'string' ? b : null;
    } catch (_) { return null; }
  }
  function encodeSave() { return 'GC1:' + btoa(unescape(encodeURIComponent(JSON.stringify(serialize())))); }
  function decodeSave(text) {
    try {
      const t = String(text).replace(/\s+/g, '');
      if (!t.startsWith('GC1:')) return null;
      const d = JSON.parse(decodeURIComponent(escape(atob(t.slice(4)))));
      return d && typeof d === 'object' && typeof d.hum === 'number' ? d : null;
    } catch (_) { return null; }
  }
  function replaceSaveAndReload(d) {
    save(); backupNow();
    try { storage().setItem(key, JSON.stringify(d)); } catch (_) { writeFailed(); return false; }
    noSave = true;
    try { session().setItem('gc-fresh-import', '1'); } catch (_) {}
    reload();
    return true;
  }
  function consumeImport() {
    let imported = false;
    try { imported = session().getItem('gc-fresh-import') === '1'; session().removeItem('gc-fresh-import'); } catch (_) {}
    return imported;
  }
  return { save, read, backupNow, readBackup, encodeSave, decodeSave, replaceSaveAndReload, consumeImport };
}
