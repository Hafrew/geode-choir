const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
const KEY = 'geode-choir-v1';
const SAVE = { ver: '1.10.7', seenVer: '1.10.8', hum: 1234, hearts: 2, depth: 12, lore: { prologue: 1 }, saved: Date.now() };
(async () => {
  const { chromium } = loadPlaywright(), server = await serve(); let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const width of [1100, 390]) {
      const open = async (save, sim) => {
        const context = await browser.newContext({ viewport: { width, height: 844 } }), page = await context.newPage(), errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
        await page.addInitScript(([key, save, sim]) => {
          if (sim) { window.requestAnimationFrame = () => 0; window.__geodeSimulation = { fast: false, items: [], menu: true }; }
          if (save && !localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(save));
        }, [KEY, save, sim]);
        await page.goto(server.url);
        return { page, context, errors };
      };
      // A returning player sees the menu with a save summary; Continue closes it.
      let { page, context, errors } = await open(SAVE, true);
      await page.waitForFunction(() => !!window.__geodeSimulation?.api, null, { polling: 100 });
      assert.equal(await page.locator('#menu').isVisible(), true);
      assert.equal(await page.locator('#menuContinue').innerText(), 'Continue');
      assert.match(await page.locator('#menuSub').innerText(), /Depth 12 · 2 Heartstones/);
      const box = await page.locator('.menu-card').boundingBox();
      assert(box.x >= 0 && box.x + box.width <= width + 1, 'menu card fits the viewport ' + JSON.stringify(box));
      await page.locator('#menuContinue').click();
      assert.equal(await page.locator('#menu').isVisible(), false);
      // Reopen it from Settings; it resumes without touching the save.
      await page.locator('#setBtn').click(); await page.locator('#menuOpenBtn').click();
      assert.equal(await page.locator('#menu').isVisible(), true);
      assert.equal(await page.locator('#menuContinue').innerText(), 'Resume');
      // Settings opens over the menu.
      await page.locator('#menuSettings').click();
      assert.equal(await page.locator('#settings').isVisible(), true);
      await page.locator('#setClose').click();
      // New game needs a second click, then erases the cave and starts the prologue.
      await page.locator('#menuNew').click();
      assert.equal(await page.locator('#menu').isVisible(), true, 'one click only arms New game');
      assert.match(await page.locator('#menuNew').innerText(), /again/);
      await page.locator('#menuNew').click();
      assert.equal(await page.locator('#menu').isVisible(), false);
      assert.equal(await page.evaluate(() => window.__geodeSimulation.api.sceneOpen || window.__geodeSimulation.api.cinematic), true);
      assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.depth), 0);
      assert.deepEqual(errors, []);
      await context.close();

      // A brand new player gets Begin and no New game button.
      ({ page, context, errors } = await open(null, true));
      await page.waitForFunction(() => !!window.__geodeSimulation?.api, null, { polling: 100 });
      assert.equal(await page.locator('#menuContinue').innerText(), 'Begin');
      assert.equal(await page.locator('#menuNew').isVisible(), false);
      assert.equal(await page.locator('#menuSkipRow').isVisible(), false);
      await page.locator('#menuContinue').click();
      assert.equal(await page.evaluate(() => window.__geodeSimulation.api.sceneOpen || window.__geodeSimulation.api.cinematic), true);
      assert.deepEqual(errors, []);
      await context.close();

      // Without the test harness, "skip" is remembered and honoured on the next visit.
      ({ page, context } = await open(SAVE, false));
      await page.waitForSelector('#menu:not([hidden])');
      await page.locator('#menuSkip').check();
      await page.reload();
      await page.waitForTimeout(400);
      assert.equal(await page.locator('#menu').isVisible(), false);
      await context.close();
      console.log(`PASS menu ${width}px: summary, continue, resume, settings over menu, armed new game, begin, skip`);
    }
  } finally { if (browser) await browser.close(); server.close && server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
