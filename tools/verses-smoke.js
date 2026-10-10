const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
(async () => {
  const { chromium } = loadPlaywright(), server = await serve(); let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const width of [1100, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      try {
        const page = await context.newPage(), errors = []; page.on('pageerror', e => errors.push(String(e)));
        await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
        await page.addInitScript(() => {
          window.requestAnimationFrame = () => 0; window.__geodeSimulation = { fast: false, items: [] };
          if (!localStorage.getItem('geode-choir-v1')) localStorage.setItem('geode-choir-v1', JSON.stringify({ ver: '1.10.5', seenVer: '1.10.7', hum: 1,
            hearts: 2, depth: 4, sea: { unlocked: true, fathoms: 100000 }, lore: { prologue: 1 }, saved: Date.now() }));
        });
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        await page.evaluate(() => window.__geodeSimulation.api.endScene());
        await page.locator('#chipDesc').click();
        await page.locator('#diveSize').selectOption('3');
        const first = await page.evaluate(() => {
          const a = window.__geodeSimulation.api, S = a.S; S.run = 1e10; S.cool = 0;
          const count = S.stats.descents;
          const ok = a.startDive(); a.updateUI();
          return { ok, remaining: S.caveVariety.remaining, count: S.stats.descents - count, lock: S.cool, event: S.caveVariety.pending[0]?.choice };
        });
        assert(first.ok); assert.equal(first.remaining, 2); assert.equal(first.count, 1); assert(first.lock > 0); assert.equal(first.event, 'safe');
        const blocked = await page.evaluate(() => {
          const a = window.__geodeSimulation.api, S = a.S, depth = S.depth; S.run = 1e10; a.runAutomation();
          a.save(); return S.depth === depth;
        }); assert(blocked);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation.api);
        await page.locator('#chipDesc').click();
        assert.equal(await page.locator('#diveSize').inputValue(), '3');
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.caveVariety.remaining), 2);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.caveVariety.pending[0].choice), 'safe');
        await page.locator('[data-event-auto]').click();
        const next = await page.evaluate(() => {
          const a = window.__geodeSimulation.api, S = a.S; a.endScene(); S.world = 'sea'; S.cool = 0; S.run = 1e10;
          const before = S.stats.descents; a.runAutomation(); const paused = S.stats.descents === before;
          S.world = 'cave'; a.runAutomation(); a.updateUI(); return { paused, count: S.stats.descents - before, remaining: S.caveVariety.remaining, lock: S.cool };
        }); assert(next.paused); assert.equal(next.count, 1); assert.equal(next.remaining, 1); assert(next.lock > 0);
        if (await page.locator('#popDesc').isHidden()) await page.locator('#chipDesc').click();
        await page.locator('#diveCancel').click(); assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.caveVariety.remaining), 0);
        const rack = await page.evaluate(() => {
          const a = window.__geodeSimulation.api, S = a.S; S.hearts = 2; S.sea.fathoms = 100000; a.buyAutomationStage(0);
          S.horns = [1, 2, 3].map(id => ({ id, r: id + 1, seed: id, name: 'Shopping Ram Horn', gold: false, lines: [{ stat: 'hum', kind: 'pct', v: 10 }] }));
          S.equipped = []; const one = a.slotShoppingHorn(1), full = !a.slotShoppingHorn(2);
          S.hearts = 3; const two = a.slotShoppingHorn(2); S.hearts = 4; const three = a.slotShoppingHorn(3);
          a.refreshAll(); a.updateUI(); a.save(); return { one, full, two, three, interval: a.shoppingInterval() };
        }); assert(rack.one && rack.full && rack.two && rack.three); assert(Math.abs(rack.interval - .234) < 1e-10);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation.api);
        assert.deepEqual(await page.evaluate(() => window.__geodeSimulation.api.S.caveAutomation.rack), [1, 2, 3]);
        await page.locator('#tab-strata').click(); assert((await page.locator('#shoppingRackNote').innerText()).includes('3/3'));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        const parity = await page.evaluate(() => {
          const a = window.__geodeSimulation.api, initial = structuredClone(a.S);
          const run = queued => {
            a.S = structuredClone(initial); a.S.depth = 0; a.S.lumen = 0; a.S.caveVariety.remaining = 0; a.S.caveVariety.pending = [];
            a.refreshAll(); let seed = 123, debt = 0; const original = Math.random;
            Math.random = () => ((seed = Math.imul(seed, 1664525) + 1013904223 >>> 0) / 4294967296);
            try {
              for (let i = 0; i < 3; i++) {
                a.S.cool = 0; a.S.run = 1e9;
                if (!queued) a.descend(); else if (!i) a.startDive(3); else a.runAutomation(false);
                debt += a.S.cool;
              }
              const S = a.S; return { debt, depth: S.depth, fossils: S.fossils, dry: S.stats.sunDry, descents: S.stats.descents, shafts: S.stats.shafts };
            } finally { Math.random = original; }
          };
          const manual = run(false), queued = run(true); a.S = initial; a.refreshAll(); a.updateUI();
          return { manual, queued };
        });
        assert.deepEqual(parity.queued, parity.manual); assert(parity.queued.debt > 0);
        const readyEvents = await page.evaluate(() => {
          const a = window.__geodeSimulation.api, old = structuredClone(a.S);
          a.S.hearts = 2; a.S.depth = 100; a.S.lumen = 1e100; a.S.sea.soundings = 100; a.S.world = 'cave';
          a.S.caveVariety.remaining = 0; a.S.caveVariety.autoEvents = false;
          a.S.caveVariety.pending = [{ id: 1, floor: 100, type: 0, haul: 10, elapsed: 0, choice: null }];
          const manual = a.canKindle(); a.S.caveVariety.pending[0].choice = 'safe'; const safe = a.canKindle();
          a.S.caveVariety.pending[0].choice = 'fossils'; const trade = a.canKindle();
          a.S = old; a.refreshAll(); a.updateUI(); return { manual, safe, trade };
        }); assert.deepEqual(readyEvents, { manual: false, safe: true, trade: false });
        // A genuine legacy owner keeps every category and is never asked to buy another verse.
        await page.evaluate(() => { const a = window.__geodeSimulation.api; delete a.S.caveAutomation.stages; a.save(); });
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation.api);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.caveAutomation.stages), 4);
        await page.locator('#tab-horns').click(); await page.locator('#hornTabs [data-sub="inventory"]').click();
        await page.locator('#hornGrid [data-id="1"]').click();
        await page.locator('#hornDetail [data-act="eq"]').click();
        await page.locator('#hornDetail [data-act="sal"]').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.equipped.includes(1)), false);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.horns.some(h => h.id === 1)), true);
        await page.locator('#hornDetail [data-act="shopping"]').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.caveAutomation.rack.includes(1)), false);
        assert.deepEqual(errors, []); console.log(`PASS verses ${width}px: queued locks, milestone safety, reload, cancellation, rack slots, migration`);
      } finally { await context.close(); }
    }
    for (let heart = 1; heart <= 4; heart++) {
      const fs = require('node:fs'), path = require('node:path');
      const code = fs.readFileSync(path.join(__dirname, 'saves', `heartstone-${heart}.txt`), 'utf8').trim();
      const old = JSON.parse(Buffer.from(code.slice(4), 'base64').toString('utf8'));
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.addInitScript(old => {
          window.requestAnimationFrame = () => 0; window.__geodeSimulation = { fast: false, items: [] };
          localStorage.setItem('geode-choir-v1', JSON.stringify({ ...old, saved: Date.now(), seenVer: '1.10.7' }));
        }, old);
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation.api);
        const restored = await page.evaluate(() => { const S = window.__geodeSimulation.api.S; return { hearts: S.hearts, fathoms: S.sea.fathoms, fossils: S.fossils, hornIds: S.horns.map(h => h.id), stages: S.caveAutomation.stages }; });
        assert.equal(restored.hearts, old.hearts); assert.equal(restored.fathoms, old.sea.fathoms);
        assert.equal(restored.fossils, old.fossils); assert.deepEqual(restored.hornIds, old.horns.map(h => h.id)); assert.equal(restored.stages, 0);
        console.log(`PASS Heartstone ${heart} real save: balances, horns, paid progression preserved`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
