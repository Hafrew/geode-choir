const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
const KEY = 'geode-choir-v1';
(async () => {
  const server = await serve(); let browser;
  try {
    browser = await loadPlaywright().chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const width of [1100, 390]) for (const auto of [false, true]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      try {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', e => errors.push(String(e)));
        await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
        await page.addInitScript(({ key, auto }) => {
          window.__testNow = Date.now(); Date.now = () => window.__testNow;
          window.requestAnimationFrame = () => 0;
          window.__geodeSimulation = { fast: false, items: [] };
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ hum: 1, ver: '1.10.4', seenVer: '1.10.5',
            hornsOn: true, hornAuto: auto, hornQueue: 2, hornTimer: 360, lore: { prologue: 1 },
            hornInventory: { autoEquip: auto, focus: 'balanced', salvage: [true, true, true, true, true, true], gilded: false },
            saved: Date.now() - 21600000 }));
        }, { key: KEY, auto });
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        const read = () => page.evaluate(() => {
          const S = window.__geodeSimulation.api.S;
          return { queue: S.hornQueue, found: S.stats.hornsFound, ivory: S.ivory, timer: S.hornTimer, saved: JSON.parse(localStorage.getItem('geode-choir-v1')) };
        });
        const first = await read();
        assert.equal(first.queue, auto ? 2 : 7); // old calls are untouched in Auto, only new arrivals are processed
        assert.equal(first.found, auto ? 5 : 0);
        if (auto) assert(first.ivory >= 25);
        assert.equal(first.saved.hornQueue, first.queue);
        assert.equal(first.saved.stats.hornsFound, first.found);
        assert.match(await page.locator('#awayRows').innerText(), auto ? /Horns discovered\s*\+5/ : /Horn calls\s*\+5/);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        const again = await read();
        assert.equal(again.queue, first.queue); assert.equal(again.found, first.found); assert.equal(again.ivory, first.ivory);
        // Pending manual notes and existing calls survive hidden-tab accounting.
        const hidden = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S;
          api.endScene(); S.hornAuto = false; S.hornQueue = 1; S.hornPlan = api.rollPlan(2);
          S.hornPlan.perfs = [.8]; S.hornTimer = 360;
          const plan = JSON.stringify(S.hornPlan);
          Object.defineProperty(document, 'hidden', { configurable: true, value: true });
          document.dispatchEvent(new Event('visibilitychange'));
          const found = S.stats.hornsFound, hum = S.hum;
          window.__testNow += 21600000;
          api.frame(performance.now() + 21600000);
          if (S.stats.hornsFound !== found || S.hum !== hum) throw Error('hidden frames produced rewards');
          window.dispatchEvent(new Event('pagehide'));
          const hiddenSaved = JSON.parse(localStorage.getItem('geode-choir-v1')).saved;
          Object.defineProperty(document, 'hidden', { configurable: true, value: false });
          document.dispatchEvent(new Event('visibilitychange'));
          document.dispatchEvent(new Event('visibilitychange'));
          return { queue: S.hornQueue, samePlan: plan === JSON.stringify(S.hornPlan),
            saved: JSON.parse(localStorage.getItem('geode-choir-v1')), hiddenSaved, now: Date.now() };
        });
        assert.equal(hidden.queue, 6); assert.equal(hidden.samePlan, true);
        assert.equal(hidden.saved.hornQueue, 6);
        assert.equal(hidden.saved.saved, hidden.now);
        assert.equal(hidden.now - hidden.hiddenSaved, 21600000);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        assert.equal((await read()).queue, 6);
        // Full legacy queues receive no extra calls, and their current plan remains intact.
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.hornQueue = 9; api.grantAway(21600); });
        assert.equal((await read()).queue, 9);
        assert.deepEqual(errors, []);
        console.log(`PASS offline horns ${width}px ${auto ? 'Auto' : 'manual'}`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
