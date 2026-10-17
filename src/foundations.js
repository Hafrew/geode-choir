// Second Verse: after the Last Chorus, the Cave and the Sea become Foundations that make Stone and Tide.
// Rules only, without DOM, audio or storage, and no imports, so state and progression can both depend on this module.
// Every number here is a placeholder until simulated (see PLAN.md, "Second Verse").
const KEEP_TIME_UNLOCK = 'keepTime', CAVE_AUTO_UNLOCK = 'caveAuto';
const UNLOCK_COSTS = { keepTime: 10, caveAuto: 25, seaAuto: [15, 40, 90] };
// A browser cannot run a closed tab, so time away is applied on return. Without Keep Time it pays the usual away
// share; with it, everything. Either way one return is capped, and excess time is consumed, never banked.
const AWAY_EFFICIENCY = 0.35, KEEP_TIME_EFFICIENCY = 1, CATCHUP_CAP = 8 * 3600;
const ENGINE_MAX = 40, ENGINE_BASE_COST = 50, ENGINE_GROWTH = 1.9, ENGINE_STEP = 1.6;
const CAVE_BASE = 1, SEA_BASE = 0.6, ECHO_STEP = 0.1;
const CAVE_AUTO_BONUS = 1.5, SEA_AUTO_BONUS = 0.25;
const ECHO_BASE = 5, ECHO_CAP = 200;

const freshVerse = () => ({
  laps: 0, echoes: 0, echoesLife: 0,
  best: { depth: 0, hearts: 0, soundings: 0, harmony: 0 },
  unlocks: { keepTime: 0, caveAuto: 0, seaAuto: 0 },
  foundations: { stone: 0, tide: 0, stoneLife: 0, tideLife: 0, engine: { cave: 0, sea: 0 }, last: 0 },
  record: {},
});
const whole = (v, max = Infinity) => Math.min(max, Math.max(0, Math.floor(+v) || 0));
const num = v => Number.isFinite(+v) ? Math.max(0, +v) : 0;
const verseOf = S => S.verse || (S.verse = freshVerse());
// The layer is on once the player has reset into it; it is offered as soon as the Last Chorus is done.
const verseActive = S => !!(S.verse && S.verse.laps > 0);
const verseOffered = S => !!(S.chorus && S.chorus.done);

// Echoes for a lap: a base plus the lap's performance. Each term is bounded so a lap cannot be farmed for more than the cap.
function echoGain(S, renown = 0) {
  const best = Math.max(S.depth || 0, S.stats?.maxDepth || 0), hearts = S.hearts || 0, soundings = S.sea?.soundings || 0;
  const feats = Object.keys(S.feats || {}).length;
  const results = S.chorus?.results || [];
  const harmony = results.length ? results.reduce((a, b) => a + b, 0) / results.length : 0;
  const raw = ECHO_BASE + 0.5 * best + 2 * hearts + 0.5 * soundings + 0.5 * feats + 10 * harmony + 2 * Math.sqrt(num(renown));
  return Math.min(ECHO_CAP, Math.floor(raw));
}

const echoMult = V => 1 + ECHO_STEP * num(V.echoes);
// Rates are closed-form in time, so catching up after an absence is exact.
function foundationRate(S, kind) {
  const V = verseOf(S), eng = V.foundations.engine[kind] || 0;
  if (kind === 'cave') {
    return CAVE_BASE * (1 + 0.15 * V.best.depth) * (1 + 0.5 * V.best.hearts) * Math.pow(ENGINE_STEP, eng) * echoMult(V)
      * (V.unlocks.caveAuto ? CAVE_AUTO_BONUS : 1);
  }
  return SEA_BASE * (1 + 0.1 * V.best.soundings) * (1 + 0.5 * V.best.hearts) * Math.pow(ENGINE_STEP, eng) * echoMult(V)
    * (1 + SEA_AUTO_BONUS * V.unlocks.seaAuto);
}
const engineCost = level => Math.ceil(ENGINE_BASE_COST * Math.pow(ENGINE_GROWTH, level));
function buyEngine(S, kind) {
  const F = verseOf(S).foundations, key = kind === 'sea' ? 'tide' : 'stone', level = F.engine[kind];
  if (!verseActive(S) || level >= ENGINE_MAX) return false;
  const cost = engineCost(level);
  if (!(F[key] >= cost)) return false;
  F[key] -= cost; F.engine[kind]++;
  return true;
}
function buyUnlock(S, name) {
  const V = verseOf(S);
  if (!verseActive(S)) return false;
  let cost;
  if (name === KEEP_TIME_UNLOCK || name === CAVE_AUTO_UNLOCK) cost = V.unlocks[name] ? null : UNLOCK_COSTS[name];
  else if (name === 'seaAuto') cost = V.unlocks.seaAuto >= UNLOCK_COSTS.seaAuto.length ? null : UNLOCK_COSTS.seaAuto[V.unlocks.seaAuto];
  else return false;
  if (cost == null || !(V.echoes >= cost)) return false;
  V.echoes -= cost;
  V.unlocks[name] = name === 'seaAuto' ? V.unlocks.seaAuto + 1 : 1;
  return true;
}
// Applies elapsed time to both Foundations. `away` is true for time the page was not live: it uses the away
// share (or Keep Time's full rate) and the per-return cap. Returns what was added.
function advanceFoundations(S, seconds, away = false) {
  const V = verseOf(S), F = V.foundations;
  const dt = verseActive(S) && Number.isFinite(+seconds) ? Math.max(0, +seconds) : 0;
  const used = away ? Math.min(dt, CATCHUP_CAP) : dt;
  const work = used * (away ? (V.unlocks.keepTime ? KEEP_TIME_EFFICIENCY : AWAY_EFFICIENCY) : 1);
  const stone = foundationRate(S, 'cave') * work, tide = foundationRate(S, 'sea') * work;
  F.stone += stone; F.tide += tide; F.stoneLife += stone; F.tideLife += tide;
  return { stone, tide, seconds: used, capped: away && dt > CATCHUP_CAP };
}
function normalizeVerse(S) {
  const raw = S.verse && typeof S.verse === 'object' ? S.verse : {}, V = freshVerse();
  V.laps = whole(raw.laps); V.echoes = num(raw.echoes); V.echoesLife = Math.max(V.echoes, num(raw.echoesLife));
  const b = raw.best && typeof raw.best === 'object' ? raw.best : {};
  V.best = { depth: whole(b.depth), hearts: whole(b.hearts), soundings: whole(b.soundings), harmony: Math.min(1, num(b.harmony)) };
  const u = raw.unlocks && typeof raw.unlocks === 'object' ? raw.unlocks : {};
  V.unlocks = { keepTime: u.keepTime ? 1 : 0, caveAuto: u.caveAuto ? 1 : 0, seaAuto: whole(u.seaAuto, UNLOCK_COSTS.seaAuto.length) };
  const f = raw.foundations && typeof raw.foundations === 'object' ? raw.foundations : {};
  const e = f.engine && typeof f.engine === 'object' ? f.engine : {};
  V.foundations = { stone: num(f.stone), tide: num(f.tide), stoneLife: Math.max(num(f.stone), num(f.stoneLife)), tideLife: Math.max(num(f.tide), num(f.tideLife)),
    engine: { cave: whole(e.cave, ENGINE_MAX), sea: whole(e.sea, ENGINE_MAX) }, last: num(f.last) };
  V.record = raw.record && typeof raw.record === 'object' ? raw.record : {};
  S.verse = V;
  return V;
}

export { UNLOCK_COSTS, AWAY_EFFICIENCY, KEEP_TIME_EFFICIENCY, CATCHUP_CAP, ENGINE_MAX, ECHO_CAP, freshVerse, verseActive, verseOffered,
  echoGain, echoMult, foundationRate, engineCost, buyEngine, buyUnlock, advanceFoundations, normalizeVerse };
