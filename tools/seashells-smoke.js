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
            ver: '1.9.8', seenVer: '1.10.3', hum: 1, hearts: 1, depth: 26, lumen: 1e9,
            lore: { prologue: 1 }, saved: Date.now(), sea: { unlocked: true, soundings: 17, fathoms: 777 },
            shells: { items: [{ id: 1, r: 2, depth: 8 }], equipped: [],
              pending: [{ id: 2, r: 1, sounding: 1 }], seq: 2, discovery: 0, extraSlot: 0, lastSounding: 1 },
          }));
        }, KEY);
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        assert((await page.locator('#heartText').innerText()).includes('depth 34'));
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.canKindle()), false);
        await page.evaluate(() => { window.__geodeSimulation.api.setWorld('sea'); window.__geodeSimulation.api.setTab('deep'); window.__geodeSimulation.api.updateUI(); });
        const mythicArt = await page.locator('#shellInventory [data-shell-art-id="1"]').evaluate(el => el.outerHTML);
        const epicArt = await page.locator('#shellPending [data-shell-art-id="2"] g').evaluate(el => el.outerHTML.replaceAll('shell-pending-2', 'shell-item-2'));
        await page.locator('[data-shell-action="equip"][data-id="1"]').click();
        assert.equal(await page.locator('#shellInventory [data-shell-art-id="1"]').evaluate(el => el.outerHTML), mythicArt);
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
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.setWorld('sea'); api.setTab('deep'); api.updateUI(); });
        await page.locator('[data-shell-action="start"][data-id="2"]').click();
        const clocks = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, p = api.S.shells.pending[0];
          api.shellTick(.4); const shown = p.elapsed;
          api.setTab('sea'); api.shellTick(100); const left = p.elapsed;
          api.setTab('deep');
          Object.defineProperty(document, 'hidden', { value: true, configurable: true });
          api.shellTick(100); const hidden = p.elapsed;
          Object.defineProperty(document, 'hidden', { value: false, configurable: true });
          api.updateUI(); return { shown, left, hidden };
        });
        assert.deepEqual(clocks, { shown: .4, left: .4, hidden: .4 });
        assert.equal(await page.locator('[data-shell-action="hit"][data-id="2"]').evaluate(el => el === document.activeElement), true);
        // A perfect first note, then reload: preserve the partial result and do not pay again.
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.shells.pending[0].elapsed = 1.6; api.updateUI(); });
        await page.locator('[data-shell-action="hit"][data-id="2"]').press('Enter');
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.shells.pending[0].notes.length), 1);
        await page.evaluate(() => window.__geodeSimulation.api.updateUI());
        await page.locator('[data-shell-action="auto"][data-id="2"]').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.shells.items.find(p => p.id === 2).depth), 3);
        assert.equal(await page.locator('#shellInventory [data-shell-art-id="1"]').evaluate(el => el.outerHTML), mythicArt);
        assert.equal(await page.locator('#shellInventory [data-shell-art-id="2"] g').evaluate(el => el.outerHTML.replaceAll('shell-inventory-2', 'shell-item-2')), epicArt);
        assert.equal(await page.locator('[data-shell-action="equip"][data-id="2"]').isDisabled(), true);
        await page.locator('#shopShells .item').filter({ hasText: 'Shell Listening' }).click();
        await page.locator('#shopShells .item').filter({ hasText: 'Second Shell Slot' }).click();
        await page.locator('[data-shell-action="equip"][data-id="2"]').click();
        assert.deepEqual(await page.evaluate(() => ({ equipped: window.__geodeSimulation.api.S.shells.equipped,
          money: window.__geodeSimulation.api.S.sea.fathoms })), { equipped: [1, 2], money: 252 });
        assert((await page.locator('#shellSummary').innerText()).includes('−11 depth'));
        // A real sounding discovers once, grants its normal rewards once, then locks.
        const sounding = await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          api.S.sea.cool = 0; api.S.sea.run = api.soundAt();
          const random = Math.random; Math.random = () => 0;
          try {
            const ok = api.sound(), after = api.S.sea.fathoms, second = api.sound();
            api.updateUI();
            return { ok, second, after, money: api.S.sea.fathoms, pending: api.S.shells.pending,
              result: api.S.shells.lastResult, count: api.S.sea.soundings };
          } finally { Math.random = random; }
        });
        assert(sounding.ok); assert.equal(sounding.second, false);
        assert.equal(sounding.after, sounding.money); assert.equal(sounding.count, 18);
        assert.equal(sounding.pending.length, 1); assert.equal(sounding.pending[0].r, 0);
        assert.deepEqual(sounding.result, { sounding: 18, r: 0 });
        assert((await page.locator('#shellDiscovery').innerText()).includes('Common shell discovered'));
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        assert.deepEqual(await page.evaluate(() => window.__geodeSimulation.api.S.shells.lastResult), sounding.result);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.shells.pending.length), 1);
        await page.evaluate(() => window.__geodeSimulation.api.updateUI());
        await page.locator('[data-shell-action="claim"][data-id="3"]').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.shells.items.find(p => p.id === 3).depth), 1);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.sea.soundings), 18);
        assert.equal(await page.locator('#shellInventory .shell-art').count(), 3);
        assert.equal(await page.locator('#shellInventory .shell-art').evaluateAll(nodes => nodes.every(el => {
          const box = el.getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.right <= innerWidth;
        })), true);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        assert.equal(overflow, false);
        await page.locator('#shellSection').screenshot({ path: `/tmp/geode-shells-${width}.png` });
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}px: live shell discovery, manual/Auto, paused notes, purchases, equipment, reload and Heartstone eligibility`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
