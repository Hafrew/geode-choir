// Usage: node run.js [--policy smart|naive] [--clicks 3] [--sea 0.25] [--k 2] [--hours 40] [--seed 1] [--out file.json]
const fs = require('fs');
const path = require('path');
const { build } = require('./build');
const installBot = require('./bot');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const cfg = {
  policy: arg('policy', 'smart'), clicks: +arg('clicks', 3), seaShare: +arg('sea', 0.25), k: +arg('k', 2),
  maxSoundings: +arg('maxSoundings', 6), autobuy: arg('autobuy', '0') === '1',
  stepMs: +arg('step', 50), actionGap: +arg('gap', 0), noBuy: arg('noBuy', '0') === '1', noFuse: arg('noFuse', '0') === '1', noDescend: arg('noDescend', '0') === '1',
};
const maxHours = +arg('hours', 40), seed = +arg('seed', 1);

(async () => {
  const NP = require('child_process').execSync('npm root -g').toString().trim();
  const { chromium } = require(NP + '/playwright');
  const html = build(path.join(require('os').tmpdir(), `geode-sim-${process.pid}.html`));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const pg = await (await browser.newContext({ viewport: { width: 1100, height: 800 } })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.addInitScript(seed => {
    let a = seed >>> 0;                                   // seeded Math.random for repeatable runs
    Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    window.__raf = []; window.requestAnimationFrame = cb => { window.__raf.push(cb); return 0; };
    window.__fast = true;
  }, seed);
  await pg.goto('file://' + html);
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
        const open = await pg.evaluate(() => { const s = window.__sim; if (s.sceneOpen) s.endScene(); return s.cinematic; });
        if (!open) break;
      }
      status = 'ok';
    }
    t = await pg.evaluate(() => window.__bot.t);
    if (Math.round(t) % 3600 < CH) {
      process.stderr.write(`  game ${(t / 3600).toFixed(1)}h  wall ${((Date.now() - wall0) / 1000).toFixed(0)}s\n`);
      if (arg('out', null)) {                                // hourly snapshot so long runs can be inspected while running
        const snap = await pg.evaluate(() => { const b = window.__bot, S = window.__sim.S; return { marks: b.marks, log: b.log.slice(-6), gameSeconds: b.t,
          final: { depth: S.depth, hearts: S.hearts, soundings: S.sea.soundings, feats: Object.keys(S.feats).length, fathoms: S.sea.fathoms, world: S.world, lumen: S.lumen, fossils: S.fossils, rate: S.rate, tideRate: S.sea.rate } }; });
        fs.mkdirSync(path.dirname(arg('out', null)), { recursive: true });
        fs.writeFileSync(arg('out', null).replace(/\.json$/, '.snap.json'), JSON.stringify(snap, null, 1));
      }
    }
  }
  const out = await pg.evaluate(() => {
    const b = window.__bot, S = window.__sim.S;
    return { marks: b.marks, log: b.log, buys: b.buys, descents: b.descents, soundings: b.soundings, gameSeconds: b.t,
      final: { depth: S.depth, hearts: S.hearts, soundings: S.sea.soundings, feats: Object.keys(S.feats).length, fathoms: S.sea.fathoms, world: S.world } };
  });
  out.cfg = cfg; out.seed = seed; out.wallSeconds = (Date.now() - wall0) / 1000; out.errors = errs.slice(0, 5); out.finished = status === 'done';
  const file = arg('out', null);
  if (file) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(out, null, 1)); }
  const h = s => s == null ? '-' : (s / 3600).toFixed(2) + 'h';
  console.log(JSON.stringify(cfg), 'seed', seed, out.finished ? 'FINISHED' : 'not finished', `game ${h(out.gameSeconds)} wall ${out.wallSeconds.toFixed(0)}s`);
  console.log(Object.entries(out.marks).map(([k, v]) => `${k}=${h(v)}`).join('  '));
  console.log('final', JSON.stringify(out.final), 'errors', out.errors.length);
  await browser.close();
  fs.unlinkSync(html);
})();
