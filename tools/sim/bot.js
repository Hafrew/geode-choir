// The bot runs inside the page next to the real game code (window.__sim, window.__items from build.js).
// It only uses actions a player has: tap, fuse twins, buy shop items, descend, sound, kindle, wear horns.
// Source of the in-page function is exported as a string so run.js can inject it.
module.exports = function installBot(cfg) {
  const sim = window.__sim;
  const CAVE = new Set(['shopCrystals', 'shopVoices', 'shopTuning', 'shopWonders', 'shopAttune', 'shopStrata', 'shopGlow', 'shopHorns', 'shopGold']);
  const SEA = new Set(['shopBells', 'shopSeaVoices', 'shopSeaTuning', 'shopOysters', 'shopPearlObjs', 'shopBellTune', 'shopDeep', 'shopChoir', 'shopHorns']);
  const bot = { now: 0, t: 0, frames: 0, tapAcc: 0, marks: {}, log: [], started: false, done: false, stuckAt: 0, buys: 0, descents: 0, soundings: 0, budget: 0 };
  const strip = h => String(h).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  // ---- purchase weights: effective price = cost / weight, cheapest wins ----
  function weight(it, S) {
    if (cfg.policy === 'naive') return 1;
    const n = strip(it.name());
    if (/^(Polish|Attune|Recast|Bronze Casting|Old Echoes|Lantern|Silk|Deep Current|Harmony|Crossing Waves)/.test(n)) return 4;
    if (/^(Resonance|Lungs|Skipping Stones|Stillness)/.test(n)) return 2;
    if (/^(Drip|Rain|Bat|Leaping Fish|Lighthouse|Firefly)/.test(n)) return 1.5;
    if (/^(Chisel|Buoy Line|Wide Cavern|Long Moorings)/.test(n)) {
      const full = S.world === 'sea' ? S.sea.bells.length >= sim.bellCap() - 1 : S.crystals.length >= sim.maxCrystals() - 1;
      return full ? 6 : 0.5;
    }
    if (/^(Deep Lungs|Old Water|Seed Crystals|Old Rain)/.test(n)) return 2;
    if (/^(Fossil Record|Plumb Line)/.test(n)) return 3;
    if (/^Fault Lines/.test(n)) return 0.2;
    if (/^Glowworm Nest/.test(n)) return 10;
    if (/^Glowworm/.test(n)) return 3;
    if (/^(Patient Hands|Crystal Seeker|Sinking Stone|Carry Wonders|Pale Lighthouse)/.test(n)) return 6;
    if (/^(Horn Rack|Keen Ear|Whetstone|Branching|Open the Ceiling|Listening Stones)/.test(n)) return 3;
    if (/^(Rich Vein|Gilded Breath)/.test(n)) return 3;
    if (/^Oyster/.test(n)) return 2;
    const tier = ['Quartz', 'Amethyst', 'Citrine', 'Moonstone', 'Tin Bell', 'Bronze Bell', 'Silver Bell', 'Abyssal Bell'].findIndex(x => n.startsWith(x));
    if (tier >= 0) return [1, 1.2, 1.5, 2][tier % 4];
    return 1;
  }
  // Human pacing: with cfg.actionGap > 0 the bot gets one shop/fuse/descend action per gap seconds (small bursts allowed).
  const canAct = () => { if (!cfg.actionGap) return true; if (bot.budget >= 1) { bot.budget -= 1; return true; } return false; };
  const unitOf = it => typeof it.unit === 'function' ? it.unit() : it.unit;
  const fathomReserve = S => (S.sea.soundings >= 3 && !S.finale) ? sim.SONG_COST : 0;

  function buyLoop(S) {
    const parents = S.world === 'sea' ? SEA : CAVE;
    for (let n = 0; n < 8; n++) {
      let best = null, bestScore = Infinity;
      for (const it of window.__items) {
        if (!parents.has(it.parent)) continue;
        if (it.show && !it.show()) continue;
        if (it.state && it.state()) continue;               // toggles already owned
        const name = strip(it.name());
        if (/^Sound the Horn Call/.test(name)) continue;    // never rolled: keeps fossils/fathoms for upgrades
        const c = it.cost(); if (c == null) continue;
        if (it.blocked && it.blocked()) continue;
        const u = unitOf(it);
        const have = sim.have(u) - (u === 'fathom' ? fathomReserve(S) : 0);
        if (have < c) continue;
        const sc = c / weight(it, S);
        if (sc < bestScore) { best = it; bestScore = sc; }
      }
      if (!best) return;
      if (!canAct()) return;
      if (!best.buy()) return;
      sim.refreshAll(); sim.syncVoices(); bot.buys++;
    }
  }

  function fuseAll(S) {
    const sea = S.world === 'sea', list = sea ? S.sea.bells : S.crystals, key = sea ? 'bt' : 't';
    for (let guard = 0; guard < 6; guard++) {
      let did = false;
      for (let t = 0; t < 3; t++) {
        const same = list.filter(c => c[key] === t);
        if (same.length >= 2) { if (!canAct()) return; sim.fuse(same[0], same[1]); did = true; break; }
      }
      if (!did) return;
    }
  }

  // ---- horns ----
  const W = { hum: 1, crystal: 1, tide: 1, bell: 1, lumen: 0.6, fossils: 0.5, fathoms: 0.5, pearls: 0.3, shards: 0.2, wall: 0.5, interf: 0.3, lungs: 0.7, skips: 0.7, cost: 0.4, offline: 0 };
  function hornScore(h) {
    const boost = sim.hornBoost(h); let s = 0;
    for (const l of h.lines) {
      const w = W[l.stat] ?? 0.3;
      if (l.kind === 'mult') s += w * Math.log(1 + (l.v - 1) * boost);
      else if (l.kind === 'pct') s += w * Math.log(1 + l.v * boost / 100);
      else if (l.stat === 'cost') s += w * Math.log(1 / (1 - Math.min(0.6, l.v * boost / 100)));
      else s += w * Math.log(1 + l.v * boost / 20);
    }
    return s;
  }
  function manageHorns(S) {
    const scored = S.horns.map(h => [hornScore(h), h]).sort((a, b) => b[0] - a[0]);
    const slots = sim.hornSlots();
    const want = scored.slice(0, slots).map(x => x[1].id);
    if (want.join() !== S.equipped.join()) { S.equipped = want; sim.refreshAll(); }
    while (S.horns.length > 14) {                            // salvage the weakest spare horn for ivory
      const spare = scored.filter(x => !S.equipped.includes(x[1].id)).pop();
      if (!spare) break;
      const h = spare[1];
      S.horns.splice(S.horns.indexOf(h), 1); S.ivory += sim.RARITY[h.r].ivory;
      scored.splice(scored.indexOf(spare), 1);
    }
  }

  // ---- progression ----
  function mark(k, S) { if (bot.marks[k] == null) bot.marks[k] = Math.round(bot.t); }
  function pickWorld(S) {
    if (!S.sea.unlocked) return 'cave';
    if (S.hearts >= 3) return 'sea';
    const block = 600, phase = (bot.t % block) / block;     // each 10 minutes: cave first, then sea
    return phase < 1 - cfg.seaShare ? 'cave' : 'sea';
  }
  function progress(S) {
    const want = pickWorld(S);
    if (want !== S.world && canAct()) sim.setWorld(want);
    if (S.world === 'cave') {
      if (sim.canKindle()) { if (canAct()) bot.kindleNow = true; return; }
      if (!cfg.noDescend && S.cool <= 0 && sim.fossilGain() > 0 && S.run >= cfg.k * sim.deepenAt() && canAct()) { sim.descend(); bot.descents++; }
    } else {
      if (sim.fathomGain() > 0 && S.sea.run >= cfg.k * sim.soundAt() && S.sea.soundings < cfg.maxSoundings && canAct()) { sim.sound(); bot.soundings++; }
    }
    if (S.finale === 0 && sim.songReady() && S.sea.fathoms >= sim.SONG_COST) { mark('finaleReady', S); bot.done = true; }
  }
  function marks(S) {
    if (S.depth >= 1) mark('depth1', S); if (S.depth >= 5) mark('depth5', S); if (S.depth >= 10) mark('depth10', S); if (S.depth >= 12) mark('depth12', S);
    for (const d of [20, 30, 40, 50]) if (S.depth >= d) mark('depth' + d, S);
    for (let h = 1; h <= 3; h++) if (S.hearts >= h) mark('heart' + h, S);
    for (let n = 1; n <= 6; n++) if (S.sea.soundings >= n) mark('sounding' + n, S);
    if (S.strata.nest) mark('nest', S);
    if (Object.keys(S.feats).length >= 20) mark('feats20', S);
    if (S.hearts >= 3) mark('reqHearts', S); if (S.sea.soundings >= 6) mark('reqSoundings', S);
  }

  function decide() {
    const S = sim.S;
    if (sim.sceneOpen) sim.endScene();
    if (sim.cinematic) return;
    if (cfg.actionGap) bot.budget = Math.min(2, bot.budget + 0.5 / cfg.actionGap);
    S.toggles.autodescend = 0; S.toggles.autobuy = cfg.autobuy ? 1 : 0;
    progress(S);                                  // descend / sound / kindle / switch world come first, or shopping eats every action
    if (!cfg.noFuse) fuseAll(S);
    if (!cfg.noBuy) buyLoop(S);
    if (Math.round(bot.t) % 30 === 0) manageHorns(S);
    marks(S);
    if (bot.t - (bot.lastLog || -1e9) >= 300) {
      bot.lastLog = bot.t;
      bot.log.push({ t: Math.round(bot.t), world: S.world, depth: S.depth, hearts: S.hearts, soundings: S.sea.soundings, feats: Object.keys(S.feats).length,
        hum: S.total, tide: S.sea.total, rate: S.rate, tideRate: S.sea.rate, crystals: S.crystals.length, bells: S.sea.bells.length, horns: S.horns.length,
        lumen: S.lumen, fossils: S.fossils, fathoms: S.sea.fathoms, capP: sim.capP, omen: S.omen, rubble: S.rubble, shafts: S.stats.shafts, rockfalls: S.stats.rockfalls, veins: S.stats.veins });
    }
  }

  bot.run = function (seconds) {
    if (!bot.started) { const first = window.__raf.shift(); first(0); sim.S.lore.prologue = 1; bot.started = true; }
    sim.S.hornAuto = true; // horn calls are sounded by hand in the game; the bot takes an average result, as horns always did before 1.8.0
    const step = cfg.stepMs || 50, frames = Math.round(seconds * 1000 / step), decideEvery = Math.round(500 / step);
    for (let i = 0; i < frames && !bot.done; i++) {
      bot.now += step; bot.t += step / 1000; bot.frames++;
      const S = sim.S;
      if (!sim.cinematic && !sim.sceneOpen) {
        bot.tapAcc += cfg.clicks * step / 1000;
        while (bot.tapAcc >= 1) { bot.tapAcc -= 1; const q = sim.randomInside(); sim.tap(q.x, q.y, null); }
      }
      sim.frame(bot.now);
      if (bot.frames % decideEvery === 0) { decide(); if (bot.kindleNow) { bot.kindleNow = false; sim.kindle(); return 'kindle'; } }
    }
    return bot.done ? 'done' : 'ok';
  };
  window.__bot = bot;
  return bot;
};
