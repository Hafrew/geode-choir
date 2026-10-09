const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');

const KEY = 'geode-choir-v1';
const legacyHorn = { id: 1, r: 0, name: 'Plain Ram Horn', lines: [{ stat: 'hum', kind: 'pct', v: 10 }] };

(async () => {
  const { chromium } = loadPlaywright();
  const server = await serve();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const viewport of [{ width: 1100, height: 800 }, { width: 390, height: 844 }]) {
      for (const legacy of [false, true]) {
        const context = await browser.newContext({ viewport });
        try {
          const page = await context.newPage();
          const errors = [], assetFailures = [];
          page.on('pageerror', error => errors.push(String(error)));
          page.on('response', response => {
            if (response.url().startsWith(server.url) && response.status() >= 400) assetFailures.push(response.url());
          });
          // External typography is not part of this offline functional check.
          await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
          if (legacy) await page.addInitScript(({ key, horn }) => {
            if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
              ver: '1.6.0', hum: 123, fossils: 7, fossilsTotal: 12, shouts: 9,
              horns: [horn], equipped: [1], saved: Date.now(), lore: { prologue: 1 },
            }));
          }, { key: KEY, horn: legacyHorn });
          const response = await page.goto(server.url);
          assert.equal(response.status(), 200);
          assert.equal(await page.title(), 'Geode Choir');
          await page.locator('#cv').waitFor({ state: 'visible' });
          // Returning saves show the release dialog after the initial scene settles.
          await page.waitForTimeout(1000);
          assert.equal(await page.evaluate(() => typeof window.__geodeSimulation), 'undefined');
          assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--hum').trim()), '#ffcf86');
          if (await page.locator('#news').isVisible()) await page.locator('#newsClose').click();
          if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
          for (let i = 0; i < 3; i++) {
            if (await page.locator('#scene').isVisible()) await page.locator('#sceneSkip').click();
            if (await page.locator('#news').isVisible()) await page.locator('#newsClose').click();
            const box = await page.locator('#cv').boundingBox();
            await page.locator('#cv').click({ position: { x: box.width / 2, y: box.height / 2 } });
            await page.waitForTimeout(180);
          }
          if (await page.locator('#scene').isVisible()) await page.locator('#sceneSkip').click();
          await page.locator('#setBtn').click();
          await page.locator('#settings').waitFor({ state: 'visible' });
          // Settings save immediately, so this also exercises persistence without waiting for autosave.
          await page.locator('[data-snd-opt="off"]').click();
          await page.locator('#setClose').click();
          const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
          assert(saved.shouts >= (legacy ? 12 : 3));
          if (legacy) {
            assert.equal(saved.fossils, 7);
            assert.equal(saved.stats.fossilsLife, 12);
            assert.deepEqual(saved.horns[0].lines, legacyHorn.lines);
            assert(saved.horns[0].seed > 0);
            assert.equal(saved.floor, 'still');
            assert.equal(saved.gilt, 0);
          }
          await page.reload();
          await page.locator('#cv').waitFor({ state: 'visible' });
          await page.waitForTimeout(1000);
          // Trigger a fresh serialization after reload, rather than reading the old stored save.
          if (await page.locator('#scene').isVisible()) await page.locator('#sceneSkip').click();
          if (await page.locator('#news').isVisible()) await page.locator('#newsClose').click();
          if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
          await page.locator('#setBtn').click();
          await page.locator('[data-snd-opt="off"]').click();
          const restored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY);
          assert.equal(restored.shouts, saved.shouts);
          assert.deepEqual(restored.horns, saved.horns);
          assert.deepEqual(errors, []);
          assert.deepEqual(assetFailures, []);
          console.log(`PASS ${viewport.width}px: ${legacy ? 'legacy migration' : 'new game'}, gameplay, settings, save/reload, assets`);
        } finally { await context.close(); }
      }
    }
  } finally {
    await browser?.close();
    await server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
