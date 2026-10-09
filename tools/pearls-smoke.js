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
            ver: '1.10.3', seenVer: '1.10.4', hum: 1, hearts: 1, world: 'sea', tab: 'pearls',
            lore: { prologue: 1 }, saved: Date.now(), sea: { unlocked: true, soundings: 3, pearls: 40 },
            pearls: { items: [
              { id: 1, r: 0, seed: 11, lines: [{ stat: 'tide', v: 1.04 }] },
              { id: 2, r: 4, seed: 22, lines: [{ stat: 'tide', v: 1.3 }, { stat: 'bell', v: 1.25 }, { stat: 'fathoms', v: 1.22 }] },
            ], equipped: [], seq: 2, opens: 5, nacre: 0 },
          }));
        }, KEY);
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        const run = fn => page.evaluate(fn);
        await run(() => { const api = window.__geodeSimulation.api; api.endScene(); api.setWorld('sea'); api.setTab('pearls'); api.updateUI(); });
        assert.equal(await page.locator('#pearlInventory .pearl-card').count(), 2);
        assert.equal(await page.locator('#pearlInventory .pearl-art').count(), 2);
        assert.equal(await page.locator('#pearlStrand .pearl-slot.empty').count(), 3);
        const tide0 = await run(() => window.__geodeSimulation.api.HB.tide);
        await page.locator('[data-pearl-action="equip"][data-id="2"]').click();
        assert.equal(await page.locator('#pearlStrand .pearl-slot:not(.empty)').count(), 1);
        const tide1 = await run(() => window.__geodeSimulation.api.HB.tide);
        assert(Math.abs(tide1 / tide0 - 1.3) < 1e-9, `tide ${tide0} -> ${tide1}`);
        assert((await page.locator('#pearlSummary').innerText()).includes('1/3 on the strand'));
        // A formed pearl is revealed by the next oyster to open, exactly once.
        const reveal = await run(() => {
          const api = window.__geodeSimulation.api, S = api.S, o = { px: 100, py: 100, r: 10 };
          const dust = S.sea.pearls; S.pearls.nacre = 120;
          api.oysterOpened(o);
          const first = { items: S.pearls.items.length, nacre: S.pearls.nacre, gained: S.sea.pearls - dust };
          api.oysterOpened(o);
          return { first, second: S.pearls.items.length, opens: S.pearls.opens, equipped: S.pearls.equipped.length };
        });
        assert.equal(reveal.first.items, 3); assert.equal(reveal.first.nacre, 0); assert(reveal.first.gained > 0);
        assert.equal(reveal.second, 3); assert.equal(reveal.opens, 7); assert.equal(reveal.equipped, 2);   // the new pearl is worn
        await run(() => window.__geodeSimulation.api.updateUI());
        assert.equal(await page.locator('#pearlInventory .pearl-card').count(), 3);
        // Pearls stay through a Sounding while pearl dust resets.
        const sounding = await run(() => {
          const api = window.__geodeSimulation.api, S = api.S;
          S.sea.run = 1e60; S.sea.cool = 0; api.sound();
          return { items: S.pearls.items.length, dust: S.sea.pearls, soundings: S.sea.soundings };
        });
        assert.equal(sounding.items, 3); assert.equal(sounding.dust, 0); assert.equal(sounding.soundings, 4);
        // Grinding pays dust and removes the pearl.
        await run(() => { window.__geodeSimulation.api.setTab('pearls'); window.__geodeSimulation.api.updateUI(); });
        await page.locator('[data-pearl-action="grind"][data-id="1"]').click();
        assert.equal(await run(() => window.__geodeSimulation.api.S.pearls.items.length), 2);
        assert.equal(await run(() => window.__geodeSimulation.api.S.sea.pearls), 5);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        assert.equal(await run(() => window.__geodeSimulation.api.S.pearls.items.length), 2);
        assert.equal(await run(() => window.__geodeSimulation.api.S.pearls.equipped.length), 2);
        await run(() => { const api = window.__geodeSimulation.api; api.setWorld('sea'); api.setTab('pearls'); api.updateUI(); });
        assert.equal(await page.locator('#pearlInventory .pearl-art').evaluateAll(nodes => nodes.every(el => {
          const box = el.getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.right <= innerWidth;
        })), true);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}px: pearl case, wearing, oyster reveal, Sounding persistence, grinding and reload`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
