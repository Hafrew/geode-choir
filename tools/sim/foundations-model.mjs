// Prints placeholder Second Verse numbers for a typical finished run (five Heartstones, 36+ soundings, 20 feats).
// Usage: node tools/sim/foundations-model.mjs [depth] [soundings] [harmony]
import { createState } from '../../src/state.js';
import { resetSecondVerse } from '../../src/progression.js';
import { foundationRate, engineCost, advanceFoundations, buyUnlock } from '../../src/foundations.js';
const [depth = 105, soundings = 40, harmony = 0.7] = process.argv.slice(2).map(Number);
let S = createState('1.11.0');
Object.assign(S, { hearts: 5, depth, finale: 1, world: 'cave' }); S.stats.maxDepth = depth; S.sea.soundings = soundings;
S.feats = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i, 1])); S.chorus.done = 1; S.chorus.results = [harmony];
const fmt = n => n >= 1e6 ? n.toExponential(2) : n.toFixed(n < 10 ? 2 : 0);
console.log('lap  echoes  stone/s  tide/s   engines to double per min  1h away (no Keep Time)  1h away (Keep Time)');
for (let lap = 1; lap <= 5; lap++) {
  const r = resetSecondVerse(S, '1.11.0'); S = r.state;
  S.chorus.results = [harmony]; S.hearts = 5; S.depth = depth; S.sea.soundings = soundings;
  const cave = foundationRate(S, 'cave'), sea = foundationRate(S, 'sea');
  const T = structuredClone(S); const away = advanceFoundations(T, 3600, true);
  T.verse.echoes += 100; buyUnlock(T, 'keepTime'); const kt = advanceFoundations(T, 3600, true);
  console.log(String(lap).padEnd(4), String(S.verse.echoes).padEnd(7), fmt(cave).padEnd(8), fmt(sea).padEnd(8), ('engine 1 costs ' + engineCost(0) + ' Stone').padEnd(26), fmt(away.stone).padEnd(23), fmt(kt.stone));
  // keep the lap's Echoes as spent on nothing, so the table shows growth from Echoes alone
}
