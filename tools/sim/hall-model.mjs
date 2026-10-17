// A greedy player in the Second Verse, to see how long the Hall's content lasts. Placeholder numbers.
// Usage: node tools/sim/hall-model.mjs [depth] [hearts] [soundings] [hours] [echoes]
import { createState } from '../../src/state.js';
import { resetSecondVerse } from '../../src/progression.js';
import { advanceFoundations, buyEngine, engineCost, foundationRate } from '../../src/foundations.js';
import { DISTRICTS, SONGS, LEVEL_MAX, districtCost, districtOpen, capacity, recruitCost, assigned, buildDistrict, recruit, assign, buySong, songOpen, songCost, cadenceRate } from '../../src/hall.js';
const [depth = 105, hearts = 5, soundings = 40, hours = 8, echoes = 104] = process.argv.slice(2).map(Number);
const S0 = createState('1.11.0');
Object.assign(S0, { hearts, depth, finale: 1 }); S0.stats.maxDepth = depth; S0.sea.soundings = soundings; S0.chorus.done = 1; S0.chorus.results = [0.7];
const S = resetSecondVerse(S0, '1.11.0').state; S.verse.echoes = echoes;
const H = S.verse.hall, F = S.verse.foundations;
const marks = {}, mark = (name, t) => { if (!(name in marks)) marks[name] = t; };
const afford = c => F.stone >= c.stone && F.tide >= c.tide;
const STEP = 5;
for (let t = 0; t < hours * 3600; t += STEP) {
  advanceFoundations(S, STEP);
  for (let guard = 0; guard < 50; guard++) {
    let did = false;
    for (const s of SONGS) if (songOpen(H, s.id) && !H.songs[s.id] && buySong(S, s.id)) { did = true; mark('song:' + s.id, t); }
    // keep the choir balanced: add each recruit to the emptiest part
    while (assigned(H) < H.singers) { assign(S, H.parts.indexOf(Math.min(...H.parts)), 1); did = true; }
    // cheapest affordable thing among districts, recruits and engines
    const options = [];
    for (const d of DISTRICTS) if (H.districts[d.id] < LEVEL_MAX && districtOpen(H, d.id)) { const c = districtCost(d.id, H.districts[d.id]); options.push({ key: 'district:' + d.id + (H.districts[d.id] + 1), cost: c.stone + c.tide, run: () => buildDistrict(S, d.id) }); }
    if (H.singers < capacity(H)) { const c = recruitCost(H); options.push({ key: 'singers' + (H.singers + 1), cost: c.stone + c.tide, run: () => recruit(S) }); }
    options.push({ key: 'engine:cave' + (S.verse.foundations.engine.cave + 1), cost: engineCost(S.verse.foundations.engine.cave), run: () => buyEngine(S, 'cave') });
    options.push({ key: 'engine:sea' + (S.verse.foundations.engine.sea + 1), cost: engineCost(S.verse.foundations.engine.sea), run: () => buyEngine(S, 'sea') });
    // Hall purchases first, cheapest first; an engine only when it leaves the next Hall purchase within reach.
    const hall = options.filter(o => !o.key.startsWith('engine')).sort((a, b) => a.cost - b.cost);
    const engines = options.filter(o => o.key.startsWith('engine')).sort((a, b) => a.cost - b.cost);
    const next = hall[0]?.cost ?? 0, spare = Math.min(F.stone, F.tide) > 3 * next;
    options.length = 0; options.push(...hall, ...(spare || !hall.length ? engines : []));
    if (DISTRICTS.every(d => H.districts[d.id] >= LEVEL_MAX)) mark('all districts max', t);
    if (SONGS.every(x => H.songs[x.id])) mark('all songs', t);
    for (const o of options) if (o.run()) { did = true; mark(o.key, t); break; }
    if (!did) break;
  }
}
const fmtT = t => t == null ? '—' : t < 3600 ? (t / 60).toFixed(0) + ' min' : (t / 3600).toFixed(2) + ' h';
const fmtN = n => n >= 1e6 ? n.toExponential(2) : n.toFixed(n < 100 ? 1 : 0);
console.log(`start: depth ${depth}, ${hearts} hearts, ${soundings} soundings, ${echoes} Echoes`);
for (const k of ['district:quarry1', 'district:harbor1', 'singers1', 'district:belfry1', 'district:hall1', 'song:firstLight', 'song:round', 'song:deepHymn', 'song:canon', 'district:gardens1', 'singers20', 'all songs', 'all districts max', 'engine:cave10', 'engine:cave20', 'engine:sea10']) console.log(k.padEnd(18), fmtT(marks[k]));
const lv = Object.fromEntries(DISTRICTS.map(d => [d.id, H.districts[d.id]]));
console.log(`after ${hours} h: districts ${JSON.stringify(lv)}, ${H.singers}/${capacity(H)} singers, ${Object.keys(H.songs).length}/${SONGS.length} songs, cadence ${fmtN(cadenceRate(S))}/s, engines ${F.engine.cave}/${F.engine.sea}`);
