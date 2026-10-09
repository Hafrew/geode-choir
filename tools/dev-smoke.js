// Needs the access code in GEODE_DEV_CODE to exercise the unlocked toolbar; without it only the locked behavior is checked.
const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
const KEY = 'geode-choir-v1';
(async () => {
  const { chromium } = loadPlaywright(), server = await serve(); let browser;
  const code = process.env.GEODE_DEV_CODE || '';
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const width of [1100, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      try {
        const page = await context.newPage(), errors = [], fetched = [];
        page.on('pageerror', error => errors.push(String(error)));
        page.on('request', r => fetched.push(new URL(r.url()).pathname));
        await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
        await page.addInitScript(key => {
          window.requestAnimationFrame = () => 0;
          window.__geodeSimulation = { fast: false, items: [] };
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
            ver: '1.10.4', seenVer: '1.10.4', hum: 1, hearts: 1, world: 'sea', tab: 'sea', depth: 5,
            lore: { prologue: 1 }, saved: Date.now(), sea: { unlocked: true, soundings: 3, fathoms: 10 },
          }));
        }, KEY);
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        // Locked by default: no toolbar, and the dev module is not even downloaded.
        assert.equal(await page.locator('#devbar').count(), 0);
        assert.equal(fetched.some(p => p.endsWith('/src/dev.js')), false);
        await page.locator('#setBtn').click();
        await page.locator('#codeBox').fill('WRONG-CODE-0000');
        await page.locator('#codeBtn').click();
        await page.waitForFunction(() => document.getElementById('codeMsg').textContent.length > 0, null, { polling: 100 });
        assert.equal(await page.locator('#codeMsg').innerText(), 'That code was not recognised.');
        assert.equal(await page.locator('#devbar').count(), 0);
        assert.equal(fetched.some(p => p.endsWith('/src/dev.js')), false);
        if (code) {
          await page.locator('#codeBox').fill(code);
          await page.locator('#codeBtn').click();
          await page.waitForSelector('#devbar');
          await page.locator('#setBtn').click().catch(() => {});
          await page.keyboard.press('Escape');
          await page.locator('.devbar-head').click();
          const fathoms0 = await page.evaluate(() => window.__geodeSimulation.api.S.sea.fathoms);
          await page.locator('#devRes').selectOption('fathoms'); await page.locator('#devAmt').fill('5000');
          await page.locator('#devAdd').click();
          assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.sea.fathoms), fathoms0 + 5000);
          await page.locator('#devSun').click();
          assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.stats.sunDry), 29);
          await page.locator('#devPearlR').selectOption('4'); await page.locator('#devPearl').click();
          assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.pearls.items.some(p => p.r === 4)), true);
          await page.locator('#devHornR').selectOption('3'); await page.locator('#devHorn').click();
          assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.horns.some(h => h.r === 3)), true);
          assert((await page.evaluate(() => window.__geodeSimulation.api.S.stats.devUsed)) >= 4);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
          await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
          await page.waitForSelector('#devbar');                              // stays unlocked on this device
          await page.locator('.devbar-head').click();
          await page.locator('#devLock').click();
          assert.equal(await page.locator('#devbar').count(), 0);
          await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
          await page.waitForTimeout(300);
          assert.equal(await page.locator('#devbar').count(), 0);            // and stays locked after Lock
        }
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}px: locked by default, wrong code rejected${code ? ', unlock, actions, persistence and lock' : ' (set GEODE_DEV_CODE to test unlocking)'}`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
