// Usage: node run.js [--policy smart|naive] [--clicks 3] [--sea 0.25] [--k 2] [--hours 40] [--seed 1] [--out file.json]
const fs = require('fs');
const path = require('path');
const { serve } = require('../serve');
const { loadPlaywright } = require('../browser');
const installBot = require('./bot');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const cfg = {
  shells: arg('shells', '1') !== '0', finaleReserve: Math.max(0, +arg('finaleReserve', 0)),
  extraFathomReserve: Math.max(0, +arg('reserveFathoms', 0)), patientChoir: arg('patientChoir', '0') === '1',
  policy: arg('policy', 'smart'), clicks: +arg('clicks', 3), seaShare: +arg('sea', 0.25), k: +arg('k', 2),
  hornStart: arg('hornStart', 'base'), hornUpgrades: arg('hornUpgrades', '1') !== '0', maxSoundings: +arg('maxSoundings', 0), autobuy: arg('autobuy', '0') === '1',
  stepMs: +arg('step', 50), actionGap: +arg('gap', 0), noBuy: arg('noBuy', '0') === '1', noFuse: arg('noFuse', '0') === '1', noDescend: arg('noDescend', '0') === '1',
};
const maxHours = +arg('hours', 40), seed = +arg('seed', 1);

(async () => {
  const { chromium } = loadPlaywright();
  const server = await serve();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    const pg = await (await browser.newContext({ viewport: { width: 1100, height: 800 } })).newPage();
    await pg.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
    const errs = []; pg.on('pageerror', e => errs.push(String(e)));
    await pg.addInitScript(seed => {
      let a = seed >>> 0;                                   // seeded Math.random for repeatable runs
      Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      window.__raf = []; window.requestAnimationFrame = cb => { window.__raf.push(cb); return 0; };
      window.__geodeSimulation = { fast: true, items: [] };
    }, seed);
    await pg.goto(server.url);
    await pg.waitForFunction(() => !!window.__geodeSimulation?.api);
    await pg.waitForTimeout(400);
    await pg.evaluate(`(${installBot.toString()})(${JSON.stringify(cfg)})`);

    const wall0 = Date.now();
    let status = 'ok', t = 0;
    const CH = 120;
    while (t < maxHours * 3600 && status !== 'done') {
      status = await pg.evaluate(s => window.__bot.run(s), CH);
      if (status === 'kindle') {
        for (let i = 0; i < 80; i++) {                       // let the kindling cinematic's timers play out
          await pg.waitForTimeout(100);
          const open = await pg.evaluate(() => { const s = window.__geodeSimulation.api; if (s.sceneOpen) s.endScene(); return s.cinematic; });
          if (!open) break;
        }
        status = 'ok';
      }
      t = await pg.evaluate(() => window.__bot.t);
      if (arg('stopAtSunvein', '0') === '1') {                // sanity check: stop at the first Sunvein
        const sun = await pg.evaluate(() => { const S = window.__geodeSimulation.api.S; return S.stats.sunveins > 0 ? { sunveins: S.stats.sunveins, floor: S.floor, giltFloor: S.giltFloor, gilt: S.gilt, depth: S.depth, descents: S.stats.descents } : null; });
        if (sun) { console.log('FIRST SUNVEIN at', (t / 3600).toFixed(2) + 'h game', JSON.stringify(sun)); status = 'done'; break; }
      }
      if (Math.round(t) % 3600 < CH) {
        process.stderr.write(`  game ${(t / 3600).toFixed(1)}h  wall ${((Date.now() - wall0) / 1000).toFixed(0)}s\n`);
        if (arg('out', null)) {                                // hourly snapshot so long runs can be inspected while running
          const snap = await pg.evaluate(() => { const b = window.__bot, S = window.__geodeSimulation.api.S; return { marks: b.marks, log: b.log.slice(-6), gameSeconds: b.t,
            final: { depth: S.depth, sunveins: S.stats.sunveins, giltLife: S.stats.giltLife, hearts: S.hearts, soundings: S.sea.soundings, feats: Object.keys(S.feats).length, fathoms: S.sea.fathoms, fathomsEarned: S.sea.fathomsTotal, shells: S.shells, seaCool: S.sea.cool || 0, ceilingLevel: S.sea.choir.open, patientChoirOwned: S.caveAutomation.unlocked, deep: S.sea.deep, world: S.world, lumen: S.lumen, fossils: S.fossils, rate: S.rate, tideRate: S.sea.rate } }; });
          fs.mkdirSync(path.dirname(arg('out', null)), { recursive: true });
          fs.writeFileSync(arg('out', null).replace(/\.json$/, '.snap.json'), JSON.stringify(snap, null, 1));
        }
      }
    }
    const out = await pg.evaluate(() => {
      const b = window.__bot, S = window.__geodeSimulation.api.S;
      return { marks: b.marks, log: b.log, buys: b.buys, descents: b.descents, soundings: b.soundings, soundingLog: b.soundingLog, shellLog: b.shellLog, timerWaitSeaSec: b.timerWaitSeaSec, tideWaitSeaSec: b.tideWaitSeaSec, gameSeconds: b.t,
        final: { depth: S.depth, sunveins: S.stats.sunveins, giltLife: S.stats.giltLife, hearts: S.hearts, soundings: S.sea.soundings, feats: Object.keys(S.feats).length, fathoms: S.sea.fathoms, fathomsEarned: S.sea.fathomsTotal, shells: S.shells, seaCool: S.sea.cool || 0, ceilingLevel: S.sea.choir.open, patientChoirOwned: S.caveAutomation.unlocked, deep: S.sea.deep, world: S.world, hornUp: S.hornUp, ivory: S.ivory, hornsFound: S.stats.hornsFound, ivoryLifetime: S.stats.ivoryLife, rarityLevel: S.hornUp.rarity || 0, primordialUnlocked: !!S.hornUp.firstVoice, primordialHeld: S.horns.filter(h => h.r === 5).length } };
    });
    out.cfg = cfg; out.seed = seed; out.wallSeconds = (Date.now() - wall0) / 1000; out.errors = errs.slice(0, 5); out.finished = status === 'done';
    const file = arg('out', null);
    if (file) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(out, null, 1)); }
    const h = s => s == null ? '-' : (s / 3600).toFixed(2) + 'h';
    console.log(JSON.stringify(cfg), 'seed', seed, out.finished ? 'FINISHED' : 'not finished', `game ${h(out.gameSeconds)} wall ${out.wallSeconds.toFixed(0)}s`);
    console.log(Object.entries(out.marks).map(([k, v]) => `${k}=${h(v)}`).join('  '));
    console.log('final', JSON.stringify(out.final), 'errors', out.errors.length);
    if (errs.length) process.exitCode = 1;
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
