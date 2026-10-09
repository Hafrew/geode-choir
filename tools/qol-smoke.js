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
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ ver: '1.9.8', seenVer: '1.10.4', hum: 1,
            hornsOn: true, hornTimer: 3, hearts: 1, depth: 1, sea: { unlocked: true, fathoms: 100000 },
            lore: { prologue: 1 }, saved: Date.now() }));
        }, KEY);
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        await page.locator('#tab-horns').click(); await page.locator('#hornTabs [data-sub="sounding"]').click();
        assert.equal(await page.locator('#sndNext').innerText(), '0:03');
        // Stay on Sounding and advance the actual frame loop; this previously froze at 0:03.
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.endScene(); const start = performance.now(); for (let i = 1; i <= 25; i++) api.frame(start + i * 50); });
        assert.equal(await page.locator('#sndNext').innerText(), '0:01');
        assert((await page.locator('#hornTimer').innerText()).includes('0:01'));
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.hornTimer = .01; const start = performance.now() + 5000; for (let i = 1; i <= 3; i++) api.frame(start + i * 50); });
        assert.equal(await page.locator('#sndStage [data-act="start"]').isVisible(), true);
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.hornQueue = 2; api.updateUI(); });
        assert((await page.locator('#sndStage').innerText()).includes('2 calls waiting'));

        // Faster Tick must change both actual arrival time and visible countdowns.
        const faster = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S; api.endScene();
          S.hornQueue = 0; S.hornTimer = 10; S.strata.tick = 4; api.updateUI();
          const displayed = document.getElementById('sndNext').textContent;
          const start = performance.now() + 10000;
          for (let i = 1; i <= 20; i++) api.frame(start + i * 50);
          return { displayed, remaining: S.hornTimer };
        });
        assert.equal(faster.displayed, '0:06');
        assert(Math.abs(faster.remaining - (10 - Math.pow(1.1, 4))) < 1e-8);
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api; api.S.hornTimer = 1.2;
          const start = performance.now() + 20000;
          for (let i = 1; i <= 20; i++) api.frame(start + i * 50);
        });
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.hornQueue), 1);

        const arrange = async (world, kind = 'bell', tiers = [0, 0]) => {
          await page.evaluate(({ world, kind, tiers }) => {
            const api = window.__geodeSimulation.api, S = api.S; api.endScene();
            S.sea.unlocked = true; S.stats.maxDepth = 1; S.world = world;
            S.sea.bells = []; S.sea.objs = []; S.sea.oysters = []; S.wonders = [];
            const positions = [{ x: -.32, y: 0 }, { x: .32, y: 0 }];
            if (kind === 'bell') S.sea.bells = tiers.map((bt, i) => ({ bt, ...positions[i] }));
            if (kind === 'crystal') S.crystals = tiers.map((t, i) => ({ t, ...positions[i] }));
            if (kind === 'oyster') S.sea.oysters = [{ oy: 1, ...positions[0] }];
            if (kind === 'raft') S.sea.objs = [{ pk: 'raft', ...positions[0] }];
            api.afterStateChange(); api.endScene();
          }, { world, kind, tiers });
          await page.locator('#cv').scrollIntoViewIfNeeded();
        };
        const drop = async (bin, kind = 'bell', expected = bin) => {
          const box = await page.locator('#cv').boundingBox();
          const points = await page.evaluate(({ bin, kind }) => {
            const api = window.__geodeSimulation.api, S = api.S;
            const obj = kind === 'crystal' ? S.crystals[0] : kind === 'oyster' ? S.sea.oysters[0] : kind === 'raft' ? S.sea.objs[0] : S.sea.bells[0];
            const rect = api.binRect(bin);
            return { x: obj.px, y: obj.py, bx: rect.x + rect.w / 2, by: rect.y + rect.h / 2 };
          }, { bin, kind });
          await page.mouse.move(box.x + points.x, box.y + points.y); await page.mouse.down();
          await page.mouse.move(box.x + points.bx, box.y + points.by, { steps: 5 });
          assert.equal(await page.evaluate(() => window.__geodeSimulation.api.drag?.bin), expected);
          if (expected) {
            const labels = await page.evaluate(() => {
              const api = window.__geodeSimulation.api, ctx = document.getElementById('cv').getContext('2d'), original = ctx.fillText, labels = [];
              ctx.fillText = text => labels.push(text);
              try { api.drawBins(); } finally { ctx.fillText = original; }
              return labels;
            }); assert.deepEqual(labels, ['Fuse', 'Crush']);
          }
          await page.mouse.up();
        };
        await arrange('sea'); await drop('fuse');
        assert.deepEqual(await page.evaluate(() => window.__geodeSimulation.api.S.sea.bells.map(b => b.bt)), [1]);
        await arrange('sea', 'bell', [3, 3]); await drop('fuse');
        assert.deepEqual(await page.evaluate(() => window.__geodeSimulation.api.S.sea.bells.map(b => b.bt)), [3, 3]);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.sea.bells[0].x), -.32);
        await arrange('sea', 'bell', [0]); await drop('fuse');
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.sea.bells[0].x), -.32);
        await drop('crush'); assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.sea.bells.length), 0);
        for (const kind of ['oyster', 'raft']) {
          await arrange('sea', kind); await drop('crush', kind, null);
          assert.equal(await page.evaluate(kind => { const S = window.__geodeSimulation.api.S; return (kind === 'oyster' ? S.sea.oysters : S.sea.objs).length; }, kind), 1);
        }
        await arrange('cave', 'crystal'); await drop('fuse', 'crystal');
        assert.deepEqual(await page.evaluate(() => window.__geodeSimulation.api.S.crystals.map(c => c.t)), [1]);

        await page.locator('#tab-strata').click();
        assert.equal(await page.locator('#caveAutomationSec').isVisible(), false);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.items.find(it => it.parent === 'shopCaveAutomation').buy()), false);
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.hearts = 2; api.S.sea.fathoms = 99999; api.updateUI(); });
        assert.equal(await page.locator('#caveAutomationSec').isVisible(), true);
        await page.getByRole('button', { name: /^Patient Choir/ }).click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.caveAutomation.unlocked), false);
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.sea.fathoms = 100000; api.updateUI(); });
        await page.getByRole('button', { name: /^Patient Choir/ }).click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.sea.fathoms), 0);
        assert.equal(await page.locator('#caveAutoControls').isVisible(), true);
        assert.equal(await page.locator('#caveAutoCategories input:checked').count(), 0);
        await page.locator('[data-cave-reserve="hum"]').fill('1000'); await page.locator('[data-cave-reserve="hum"]').press('Tab');
        await page.locator('[data-cave-category="voices"]').check();
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.hum = 1025; api.S.run = 50; api.runAutomation(); });
        assert.deepEqual(await page.evaluate(() => { const S = window.__geodeSimulation.api.S; return [S.hum, S.lv.lungs]; }), [1000, 1]);
        await page.evaluate(() => window.__geodeSimulation.api.runAutomation());
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.lv.lungs), 1);
        await page.locator('[data-cave-category="voices"]').uncheck();
        const legacySeeker = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S; S.illum.autobuy = 1; S.toggles.autobuy = 1;
          const before = S.crystals.length; api.runAutomation(); S.toggles.autobuy = 0;
          return { before, after: S.crystals.length, hum: S.hum };
        }); assert.equal(legacySeeker.before, legacySeeker.after); assert.equal(legacySeeker.hum, 1000);
        await page.locator('[data-cave-category="wonders"]').check();
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.shards = 100; api.runAutomation(); api.updateUI(); });
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.toggles.autobuy), 0);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.wonders.length), 0); // Shards ledger is still locked at depth 1.
        await page.evaluate(() => { const api = window.__geodeSimulation.api; api.S.depth = 3; api.runAutomation(); api.updateUI(); });
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.wonders.length), 1);
        await page.locator('[data-cave-category="horns"]').check();
        const hornChecks = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S; S.ivory = 1000; S.fossils = 1e8;
          const found = S.stats.hornsFound, queued = S.hornQueue; api.runAutomation(); api.save();
          return { found: S.stats.hornsFound - found, queued: S.hornQueue - queued, levels: Object.values(S.hornUp).reduce((a,b) => a + b, 0) };
        }); assert.equal(hornChecks.found, 0); assert.equal(hornChecks.queued, 0); assert(hornChecks.levels > 0);
        await page.locator('[data-cave-category="gold"]').check();
        const gold = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, S = api.S; S.gilt = 20; S.floor = 'still'; api.runAutomation();
          const ordinary = S.goldUp.vein + S.goldUp.breath; S.floor = 'sunvein'; S.stats.sunveins = 1; api.runAutomation(); api.save();
          return { ordinary, onSun: S.goldUp.vein + S.goldUp.breath };
        }); assert.equal(gold.ordinary, 0); assert.equal(gold.onSun, 1);
        const paused = await page.evaluate(() => {
          const api = window.__geodeSimulation.api; api.S.world = 'sea';
          const before = JSON.stringify(api.S); api.runAutomation(); const unchanged = before === JSON.stringify(api.S);
          api.S.world = 'cave'; api.save(); return unchanged;
        }); assert(paused);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        await page.locator('#tab-strata').click();
        assert.equal(await page.locator('#caveAutoControls').isVisible(), true);
        assert.equal(await page.locator('[data-cave-category="horns"]').isChecked(), true);
        assert.equal(await page.locator('[data-cave-reserve="hum"]').inputValue(), '1000');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}px: live Sounding, Sea/Cave drag zones, automation gate, reserves, real purchases and reload`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
