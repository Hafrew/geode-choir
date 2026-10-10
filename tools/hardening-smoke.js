const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
(async () => {
  const server = await serve(); let browser;
  try {
    browser = await loadPlaywright().chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const width of [1100, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      try {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
        await page.addInitScript(() => {
          window.requestAnimationFrame = () => 0;
          window.__geodeSimulation = { fast: false, items: [] };
          localStorage.setItem('geode-choir-v1', JSON.stringify({ hum: 1, ver: '1.10.5', seenVer: '1.10.5',
            lore: { prologue: 1 }, hornsOn: true, hearts: 1, sea: { unlocked: true, soundings: 1, run: 10000 }, saved: Date.now(),
            horns: [{ id: 1, r: 2, seed: 7, name: '<img src=x onerror="window.pwned=1">Ram Horn', lines: [{ stat: 'hum', kind: 'pct', v: 50 }] }] }));
        });
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          api.endScene(); api.setTab('horns'); api.setHornSub('inventory'); api.updateUI();
        });
        assert.equal(await page.locator('#hornGrid img').count(), 0);
        assert.equal(await page.evaluate(() => window.pwned), undefined);
        assert.doesNotMatch(await page.locator('#hornDetail').innerText(), /[<>]/);
        const stable = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S;
          const template = S.horns[0];
          // Diagnostic oversized inventory: normal gameplay still caps horns at 30.
          S.horns = Array.from({ length: 300 }, (_, i) => ({ ...template, id: i + 1, seed: i + 7, name: `Ram Horn ${i}`, lines: template.lines.map(l => ({ ...l })) }));
          api.refreshAll(); api.updateUI();
          const grid = document.getElementById('hornGrid'), first = grid.firstElementChild;
          first.focus();
          const start = performance.now();
          for (let i = 0; i < 30; i++) { api.refreshAll(); api.updateUI(); }
          return { count: grid.children.length, stable: grid.firstElementChild === first,
            focused: document.activeElement === first, milliseconds: performance.now() - start };
        });
        assert.equal(stable.count, 300); assert(stable.stable && stable.focused);
        // Content, equipment and formatting changes must still invalidate the view.
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          api.S.horns[0].lines[0].v = 65; api.refreshAll(); api.updateUI();
        });
        assert.match(await page.locator('#hornDetail').innerText(), /65%/);
        const shell = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S;
          S.shells.items = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, r: 0, depth: 1 }));
          S.shells.pending = [{ id: 301, r: 1, sounding: 1, notes: [], elapsed: 0 }];
          S.world = 'sea'; api.setTab('deep'); api.afterStateChange(); api.endScene(); api.updateUI();
          const first = document.getElementById('shellInventory').firstElementChild;
          S.shells.pending[0].notes.push(.6);
          S.shells.pending[0].elapsed = 1.2; api.updateUI();
          return { stable: document.getElementById('shellInventory').firstElementChild === first,
            count: document.getElementById('shellInventory').children.length, timing: document.getElementById('shellTiming301').textContent };
        });
        assert.equal(shell.count, 300); assert(shell.stable); assert.match(shell.timing, /Ready/);
        await page.locator('#shellInventory [data-id="1"]').click();
        assert.match(await page.locator('#shellSummary').innerText(), /1\/1 equipped/);
        const pearl = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S;
          S.pearls.items = [{ id: 1, r: 0, seed: 7, name: 'Test Pearl', lines: [{ stat: 'tide', v: 1.04 }] }];
          api.setTab('pearls'); api.updateUI();
          const first = document.getElementById('pearlInventory').firstElementChild;
          S.pearls.nacre = 60; S.pearls.opens++; api.updateUI();
          return { stable: document.getElementById('pearlInventory').firstElementChild === first, summary: document.getElementById('pearlSummary').textContent };
        });
        assert(pearl.stable); assert.match(pearl.summary, /50%/);
        const numbers = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S;
          S.sea.fathoms = 384738384; S.sea.soundings = 123456789; S.sea.deep.rain = 900000000;
          S.numfmt = 'short'; api.setTab('deep'); api.updateUI();
          const short = document.getElementById('songBtn').textContent;
          S.numfmt = 'sci'; api.updateUI();
          const rain = [...document.querySelectorAll('#shopDeep .item')].find(b => b.textContent.includes('Old Rain'))?.textContent;
          return { short, rain, requirements: document.getElementById('songReqs').textContent };
        });
        assert.match(numbers.short, /50\.0K fathoms/);
        assert.match(numbers.rain, /1\.80e9/);
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.shouts = 123456789; api.S.stats.maxDepth = 123456789; });
        await page.locator('#chronBtn').click();
        assert.match(await page.locator('#statGrid').textContent(), /1\.23e8/);
        await page.locator('#chronClose').click();
        assert.doesNotMatch(numbers.rain, /1800000000/);
        const failed = await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function(key, value) { if (key === 'geode-choir-v1') throw Error('quota'); return original.call(this, key, value); };
          api.save(); api.save(); api.save();
          const warnings = [...document.querySelectorAll('#toasts .toast')].filter(t => t.textContent.includes('Save failed'));
          Storage.prototype.setItem = original;
          api.save();
          return { count: warnings.length, message: warnings[0]?.textContent,
            saved: JSON.parse(localStorage.getItem('geode-choir-v1')).ver };
        });
        assert.equal(failed.count, 1); assert.match(failed.message, /Copy a save code/); assert.equal(failed.saved, '1.10.5');
        assert.deepEqual(errors, []);
        console.log(`PASS hardening ${width}px: safe import, 300-item grids, live timing, format audit, save warning (${stable.milliseconds.toFixed(0)}ms/30 updates)`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
