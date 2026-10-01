// Builds a patched copy of ../../index.html for simulation. The game logic is untouched; the patch only
// (1) records every shop item, (2) lets the UI refresh be skipped, and (3) exposes internals as window.__sim.
const fs = require('fs');
const path = require('path');

function must(src, needle, label) {
  if (!src.includes(needle)) throw new Error(`patch anchor not found: ${label}`);
}

function build(outFile) {
  let s = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');

  must(s, '  function addItem(spec) {', 'addItem');
  s = s.replace('  function addItem(spec) {', '  function addItem(spec) {\n    (window.__items = window.__items || []).push(spec);');

  must(s, '  function updateUI() {', 'updateUI');
  s = s.replace('  function updateUI() {', '  function updateUI() {\n    if (window.__fast) return;');

  // Fixed particle budget: the real game shrinks it when frames run slow, which would make runs depend on this machine.
  must(s, '    if (frameMs > 10) {', 'govern shrink');
  s = s.replace('    if (frameMs > 10) {', '    if (false) {');
  must(s, '    else if (frameMs < 5) {', 'govern grow');
  s = s.replace('    else if (frameMs < 5) {', '    else {');

  const anchor = '  window.claude?.hot?.ready ?';
  must(s, anchor, 'start anchor');
  const expose = `
  window.__sim = {
    get S() { return S; }, set S(v) { S = v; },
    frame, tap, randomInside, fuse, endScene, setWorld, refreshAll, syncVoices, afterStateChange, save,
    descend, sound, kindle, canKindle, answerSong, songReady, songReqs, SONG_COST,
    fossilGain, fathomGain, deepenAt, soundAt, heartCost, hornSlots, hornBoost, computeHB, gainHorn,
    maxCrystals, bellCap, have, TIERS, BELLS, RARITY, FEATS, HEART_DEPTH,
    get sceneOpen() { return sceneOpen; }, get cinematic() { return cinematic; }, get capP() { return capP; },
    get chordNow() { return chordNow; },
  };
`;
  s = s.replace(anchor, expose + anchor);
  fs.writeFileSync(outFile, s);
  return outFile;
}

module.exports = { build };
if (require.main === module) console.log(build(process.argv[2] || path.join(__dirname, '.sim.html')));
