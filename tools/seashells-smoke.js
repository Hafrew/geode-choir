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
            ver: '1.9.8', seenVer: '1.9.8', hum: 1, hearts: 1, depth: 26, lumen: 1e8,
            lore: { prologue: 1 }, saved: Date.now(), sea: { unlocked: true, soundings: 17, fathoms: 777 },
            shells: { items: [{ id: 1, r: 2, depth: 8 }], equipped: [],
              pending: [{ id: 2, r: 1, sounding: 1 }], seq: 2, discovery: 6, extraSlot: 1, lastSounding: 1 },
          }));
        }, KEY);
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        assert((await page.locator('#heartText').innerText()).includes('depth 34'));
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.canKindle()), false);
        await page.evaluate(() => { window.__geodeSimulation.api.setWorld('sea'); window.__geodeSimulation.api.setTab('deep'); window.__geodeSimulation.api.updateUI(); });
        await page.locator('[data-shell-equip="1"]').click();
        await page.evaluate(() => { window.__geodeSimulation.api.setWorld('cave'); window.__geodeSimulation.api.updateUI(); });
        assert((await page.locator('#heartText').innerText()).includes('depth 26'));
        assert((await page.locator('#heartText').innerText()).includes('17 soundings'));
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.canKindle()), true);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        const saved = await page.evaluate(() => {
          const S = window.__geodeSimulation.api.S;
          return { equipped: S.shells.equipped, pending: S.shells.pending,
            depth: S.depth, soundings: S.sea.soundings, fathoms: S.sea.fathoms };
        });
        assert.deepEqual(saved, { equipped: [1], pending: [{ id: 2, r: 1, sounding: 1 }],
          depth: 26, soundings: 17, fathoms: 777 });
        assert((await page.locator('#heartText').innerText()).includes('depth 26'));
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}px: shared Heartstone discounts, actual eligibility, pending shell and save persistence`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
