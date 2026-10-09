const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
const KEY = 'geode-choir-v1';
(async () => {
  const { chromium } = loadPlaywright(), server = await serve(); let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const width of [1100, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      try {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(String(error)));
        await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
        await page.addInitScript(key => {
          window.requestAnimationFrame = () => 0;
          window.__geodeSimulation = { fast: false, items: [] };
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
            ver: '1.9.8', seenVer: '1.10.3', hum: 1, hearts: 1, world: 'sea', tab: 'sea',
            strata: { tick: 2 }, lore: { prologue: 1, sea1: 1 }, saved: Date.now(),
            sea: { unlocked: true, soundings: 0, run: 50000, tide: 50000, cool: 60, coolTotal: 600 },
          }));
        }, KEY);
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        assert((await page.locator('#descBtn').innerText()).includes('0:49'));
        assert.equal(await page.locator('#chipDesc').evaluate(el => el.classList.contains('ready')), false);
        await page.locator('#chipDesc').click();
        await page.locator('#descBtn').click();
        const blocked = await page.evaluate(() => {
          const api = window.__geodeSimulation.api; api.endScene();
          const before = JSON.stringify({ q: api.S.sea, horns: api.S.horns, ivory: api.S.ivory });
          return { result: api.sound(), unchanged: before === JSON.stringify({ q: api.S.sea, horns: api.S.horns, ivory: api.S.ivory }) };
        });
        assert.equal(blocked.result, false); assert(blocked.unchanged);
        const remaining = await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          api.grantAway(30); // No idle income: the clock must still advance.
          api.setWorld('cave'); api.endScene();
          const start = performance.now();
          for (let i = 1; i <= 20; i++) api.frame(start + i * 50);
          api.setWorld('sea'); api.endScene(); api.updateUI(); api.save();
          return api.S.sea.cool;
        });
        assert(Math.abs(remaining - (60 - 30 * .35 * 1.21 - 1.21)) < 1e-8);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        assert(Math.abs(await page.evaluate(() => window.__geodeSimulation.api.S.sea.cool) - remaining) < 1e-8);
        const completed = await page.evaluate(() => {
          const api = window.__geodeSimulation.api; api.S.sea.cool = 0; api.updateUI();
          const before = api.S.stats.hornsFound, ready = api.canSound();
          const result = api.sound();
          return { ready, result, n: api.S.sea.soundings, cool: api.S.sea.cool,
            total: api.S.sea.coolTotal, horns: api.S.stats.hornsFound - before, second: api.sound() };
        });
        assert.deepEqual(completed, { ready: true, result: true, n: 1, cool: 600, total: 600, horns: 1, second: false });
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S;
          S.sea.choir.open = 22; S.sea.tide = 1e30; api.updateUI();
        });
        await page.locator('#tab-choir').click();
        assert((await page.locator('#shopChoir').innerText()).includes('Legacy level 22'));
        assert.equal(await page.evaluate(() => window.__geodeSimulation.items.find(it => it.name().startsWith('Open the Ceiling')).buy()), false);
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          api.S.sea.choir.open = 14;
          window.__geodeSimulation.items.find(it => it.name().startsWith('Open the Ceiling')).buy();
          api.updateUI();
        });
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.sea.choir.open), 15);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.items.find(it => it.name().startsWith('Open the Ceiling')).buy()), false);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.songReqs()[0].need), 36);
        const finale = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S; api.endScene();
          S.hearts = 5; S.sea.soundings = 35; S.sea.fathoms = api.SONG_COST;
          S.feats = Object.fromEntries(api.FEATS.slice(0, 20).map(feat => [feat.id, 1]));
          const blocked = api.songReady(); api.answerSong();
          const held = S.sea.fathoms;
          S.sea.soundings = 36;
          const ready = api.songReady(); api.answerSong();
          const paid = S.sea.fathoms; api.answerSong();
          return { blocked, held, ready, paid, done: S.finale > 0, repeat: S.sea.fathoms };
        });
        assert.deepEqual(finale, { blocked: false, held: 50000, ready: true, paid: 0, done: true, repeat: 0 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}px: live countdown, locked actions, offline/cave ticking, reload, once-only rewards, legacy Ceiling/cap and finale payment`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
