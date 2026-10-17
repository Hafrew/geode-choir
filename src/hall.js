// The Choir Hall: Hollowmere rebuilt as a choir, the third world of the Second Verse. Districts house Singers,
// Singers are assigned to choir parts, parts make Cadence, and Cadence buys Repertoire songs that boost the Foundations.
// Rules only, without DOM, audio or storage, and no imports. Stone and Tide live on S.verse.foundations.
// Every number is a placeholder until simulated (see PLAN.md, "Second Verse").
const PARTS = ['Bass', 'Tenor', 'Alto', 'Treble', 'Descant'];
const LEVEL_MAX = 10, COST_GROWTH = 2.2, HOUSING = 4, HALL_HOUSING = 8;
const RECRUIT_STONE = 2e4, RECRUIT_TIDE = 1.5e4, RECRUIT_GROWTH = 1.3, SINGER_CADENCE = 0.5;
const DISTRICTS = [
  { id: 'quarry', name: 'Quarry Steps', stone: 4e4, tide: 0, need: [], text: 'Stone ×1.25 a level' },
  { id: 'harbor', name: 'Harbor Stairs', stone: 0, tide: 3e4, need: [], text: 'Tide ×1.25 a level' },
  { id: 'belfry', name: 'Belfry', stone: 1.2e5, tide: 6e4, need: ['quarry', 'harbor'], text: 'Cadence ×1.2 a level' },
  { id: 'hall', name: 'Hall', stone: 4e5, tide: 2e5, need: ['belfry'], text: 'Houses twice the singers; opens the second songbook' },
  { id: 'gardens', name: 'Gardens', stone: 3e5, tide: 3e5, need: ['hall'], text: 'Songs cost 8% less a level' },
];
// Repertoire: one-time songs bought with Cadence. Tier two opens with the Hall district.
const SONGS = [
  { id: 'firstLight', name: 'First Light', tier: 1, cost: 300, effect: 'cave', mult: 1.5, text: 'Stone ×1.5' },
  { id: 'lowTide', name: 'Low Tide', tier: 1, cost: 300, effect: 'sea', mult: 1.5, text: 'Tide ×1.5' },
  { id: 'round', name: 'The Round', tier: 1, cost: 600, effect: 'cadence', mult: 1.5, text: 'Cadence ×1.5' },
  { id: 'deepHymn', name: 'Deep Hymn', tier: 2, cost: 6000, effect: 'cave', mult: 2, text: 'Stone ×2' },
  { id: 'moonPsalm', name: 'Moon Psalm', tier: 2, cost: 6000, effect: 'sea', mult: 2, text: 'Tide ×2' },
  { id: 'canon', name: 'The Canon', tier: 2, cost: 12000, effect: 'cadence', mult: 2, text: 'Cadence ×2' },
];
const DISTRICT = Object.fromEntries(DISTRICTS.map(d => [d.id, d]));
const SONG = Object.fromEntries(SONGS.map(s => [s.id, s]));

const freshHall = () => ({
  districts: Object.fromEntries(DISTRICTS.map(d => [d.id, 0])), singers: 0, parts: PARTS.map(() => 0),
  cadence: 0, cadenceLife: 0, songs: {}, renown: 0,
});
const whole = (v, max = Infinity) => Math.min(max, Math.max(0, Math.floor(+v) || 0));
const num = v => Number.isFinite(+v) ? Math.max(0, +v) : 0;
const hallOf = S => (S.verse.hall || (S.verse.hall = freshHall()));
const level = (H, id) => H.districts[id] || 0;

const districtCost = (id, lv) => ({ stone: Math.ceil(DISTRICT[id].stone * Math.pow(COST_GROWTH, lv)), tide: Math.ceil(DISTRICT[id].tide * Math.pow(COST_GROWTH, lv)) });
const districtOpen = (H, id) => DISTRICT[id].need.every(n => level(H, n) >= 1);
const capacity = H => DISTRICTS.reduce((a, d) => a + level(H, d.id) * (d.id === 'hall' ? HALL_HOUSING : HOUSING), 0);
const assigned = H => H.parts.reduce((a, b) => a + b, 0);
const recruitCost = H => ({ stone: Math.ceil(RECRUIT_STONE * Math.pow(RECRUIT_GROWTH, H.singers)), tide: Math.ceil(RECRUIT_TIDE * Math.pow(RECRUIT_GROWTH, H.singers)) });
// A balanced choir sings at full strength; a lopsided one at half. Empty parts count as the lowest part.
function balance(H) {
  const n = assigned(H);
  return n > 0 ? 0.5 + 0.5 * Math.min(...H.parts) / (n / H.parts.length) : 1;
}
const songBought = (H, id) => !!H.songs[id];
const songOpen = (H, id) => SONG[id].tier === 1 || level(H, 'hall') >= 1;
const songCost = (H, id) => Math.ceil(SONG[id].cost * Math.pow(0.92, level(H, 'gardens')));
const songMult = (H, effect) => SONGS.reduce((a, s) => a * (s.effect === effect && H.songs[s.id] ? s.mult : 1), 1);
// What the Hall adds to a Foundation's rate.
const hallMult = (S, kind) => {
  const H = hallOf(S);
  return Math.pow(1.25, level(H, kind === 'cave' ? 'quarry' : 'harbor')) * songMult(H, kind);
};
const cadenceRate = S => {
  const H = hallOf(S);
  return assigned(H) * SINGER_CADENCE * balance(H) * Math.pow(1.2, level(H, 'belfry')) * songMult(H, 'cadence');
};

const pool = (S, kind) => kind === 'stone' ? 'stone' : 'tide';
function spend(S, cost) {
  const F = S.verse.foundations;
  if (!(F.stone >= cost.stone && F.tide >= cost.tide)) return false;
  F.stone -= cost.stone; F.tide -= cost.tide;
  return true;
}
function buildDistrict(S, id) {
  const H = hallOf(S);
  if (!S.verse.laps || !DISTRICT[id] || level(H, id) >= LEVEL_MAX || !districtOpen(H, id)) return false;
  if (!spend(S, districtCost(id, level(H, id)))) return false;
  H.districts[id]++;
  return true;
}
function recruit(S) {
  const H = hallOf(S);
  if (!S.verse.laps || H.singers >= capacity(H) || !spend(S, recruitCost(H))) return false;
  H.singers++;
  return true;
}
// Moves one singer into (delta 1) or out of (delta -1) a part. Unassigned singers make no Cadence.
function assign(S, part, delta) {
  const H = hallOf(S);
  if (!S.verse.laps || !(part >= 0 && part < PARTS.length)) return false;
  if (delta > 0) { if (assigned(H) >= H.singers) return false; H.parts[part]++; return true; }
  if (H.parts[part] <= 0) return false;
  H.parts[part]--;
  return true;
}
function buySong(S, id) {
  const H = hallOf(S);
  if (!S.verse.laps || !SONG[id] || H.songs[id] || !songOpen(H, id) || !(H.cadence >= songCost(H, id))) return false;
  H.cadence -= songCost(H, id);
  H.songs[id] = 1;
  return true;
}
// `work` is effective seconds, already scaled for time away. The rate is constant over it, so this is exact.
function advanceHall(S, work) {
  if (!S.verse.laps || !(work > 0) || !Number.isFinite(work)) return 0;
  const H = hallOf(S), c = cadenceRate(S) * work;
  H.cadence += c; H.cadenceLife += c;
  return c;
}
function normalizeHall(raw) {
  const r = raw && typeof raw === 'object' ? raw : {}, H = freshHall();
  const d = r.districts && typeof r.districts === 'object' ? r.districts : {};
  for (const x of DISTRICTS) H.districts[x.id] = whole(d[x.id], LEVEL_MAX);
  // A district cannot stand without what it needs.
  for (const x of DISTRICTS) if (H.districts[x.id] > 0 && !x.need.every(n => H.districts[n] >= 1)) H.districts[x.id] = 0;
  H.singers = Math.min(whole(r.singers), capacity(H));
  const p = Array.isArray(r.parts) ? r.parts : [];
  H.parts = PARTS.map((_, i) => whole(p[i], H.singers));
  while (assigned(H) > H.singers) { const i = H.parts.indexOf(Math.max(...H.parts)); H.parts[i]--; }
  H.cadence = num(r.cadence); H.cadenceLife = Math.max(H.cadence, num(r.cadenceLife));
  const s = r.songs && typeof r.songs === 'object' ? r.songs : {};
  for (const x of SONGS) if (s[x.id] && (x.tier === 1 || H.districts.hall >= 1)) H.songs[x.id] = 1;
  H.renown = num(r.renown);
  return H;
}

export { PARTS, LEVEL_MAX, DISTRICTS, SONGS, freshHall, hallOf, districtCost, districtOpen, capacity, assigned, recruitCost, balance,
  songBought, songOpen, songCost, songMult, hallMult, cadenceRate, buildDistrict, recruit, assign, buySong, advanceHall, normalizeHall };
