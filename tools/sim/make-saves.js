// Usage: node make-saves.js [--seed 1] [--hearts 4] [--hours 16] [--dir tools/saves]
// Plays the bot to each Heartstone and writes an importable GC1 save for it (Settings → import).
const fs = require('fs');
const path = require('path');
const { serve } = require('../serve');
const { loadPlaywright } = require('../browser');
const installBot = require('./bot');

const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : d; };
const seed = +arg('seed', 1), target = +arg('hearts', 4), maxHours = +arg('hours', 16), dir = arg('dir', path.join(__dirname, '..', 'saves'));
const cfg = { shells: true, finaleReserve: 100000, extraFathomReserve: 0, patientChoir: true, policy: 'smart', clicks: 3, seaShare: 0.25, k: 2,
  hornStart: 'base', hornUpgrades: true, maxSoundings: 0, autobuy: false, stepMs: 50, actionGap: 0, noBuy: false, noFuse: false, noDescend: false };

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
      let a = seed >>> 0;
      Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      window.__raf = []; window.requestAnimationFrame = cb => { window.__raf.push(cb); return 0; };
      window.__geodeSimulation = { fast: true, items: [] };
    }, seed);
    await pg.goto(server.url);
    await pg.waitForFunction(() => !!window.__geodeSimulation?.api);
    await pg.waitForTimeout(400);
    await pg.evaluate(`(${installBot.toString()})(${JSON.stringify(cfg)})`);
    fs.mkdirSync(dir, { recursive: true });
    const taken = new Set();
    let status = 'ok';
    while (taken.size < target) {
      status = await pg.evaluate(s => window.__bot.run(s), 120);
      if (status === 'kindle') {
        for (let i = 0; i < 80; i++) {
          await pg.waitForTimeout(100);
          const open = await pg.evaluate(() => { const s = window.__geodeSimulation.api; if (s.sceneOpen) s.endScene(); return s.cinematic; });
          if (!open) break;
        }
        const info = await pg.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S;
          return { hearts: S.hearts, code: 'GC1:' + btoa(unescape(encodeURIComponent(JSON.stringify(api.serialize())))),
            t: window.__bot.t, soundings: S.sea.soundings, depth: S.stats.maxDepth, fathoms: S.sea.fathoms, horns: S.horns.length, feats: Object.keys(S.feats).length, caveAuto: S.caveAutomation.unlocked };
        });
        if (info.hearts >= 1 && info.hearts <= target && !taken.has(info.hearts)) {
          taken.add(info.hearts);
          fs.writeFileSync(path.join(dir, `heartstone-${info.hearts}.txt`), info.code + '\n');
          console.log(`heartstone ${info.hearts}: ${(info.t / 3600).toFixed(2)}h game, soundings ${info.soundings}, best depth ${info.depth}, fathoms ${info.fathoms}, horns ${info.horns}, feats ${info.feats}, Patient Choir ${info.caveAuto}`);
        }
      }
      const t = await pg.evaluate(() => window.__bot.t);
      if (t > maxHours * 3600 || status === 'done') break;
    }
    if (errs.length) { console.error('page errors', errs.slice(0, 3)); process.exitCode = 1; }
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
