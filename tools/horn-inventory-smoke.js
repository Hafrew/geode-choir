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
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ ver: '1.9.5', seenVer: '1.10.0', hum: 1, hornsOn: true,
            ivory: 50000, lore: { prologue: 1 }, saved: Date.now(), horns: [
              { id: 1, r: 0, name: 'Plain Ram Horn', seed: 1, lines: [{ stat: 'hum', kind: 'pct', v: 20 }] },
              { id: 2, r: 4, name: 'Radiant Kudu Horn', seed: 2, lines: [{ stat: 'hum', kind: 'pct', v: 1 }] },
              { id: 3, r: 1, name: 'Sea Ram Horn', seed: 3, lines: [{ stat: 'tide', kind: 'pct', v: 400 }] }
            ], equipped: [2], hornSeq: 3 }));
        }, KEY);
        await page.goto(server.url);
        await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        await page.locator('#tab-horns').click();
        await page.locator('#hornTabs [data-sub="inventory"]').click();
        assert.equal(await page.locator('#hornSalvageRarities input').count(), 5);
        assert.equal(await page.locator('#hornAutoEquip').isChecked(), false);
        assert.equal(await page.locator('#hornSalvageGilded').isChecked(), false);
        await page.locator('#hornEquipFocus').selectOption('cave');
        await page.locator('#hornAutoEquip').check();
        assert.deepEqual(await page.evaluate(() => window.__geodeSimulation.api.S.equipped), [1]);
        assert.equal(await page.locator('#hornDetail [data-act="eq"]').isDisabled(), true);
        await page.locator('#hornEquipFocus').selectOption('sea');
        assert.deepEqual(await page.evaluate(() => window.__geodeSimulation.api.S.equipped), [3]);
        await page.locator('#hornEquipFocus').selectOption('cave');
        await page.locator('[data-salvage-r="0"]').check();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.horns.length), 3);
        const found = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, before = api.S.ivory, foundBefore = api.S.stats.hornsFound;
          const weak = api.buildHorn({ ri: 0, lines: [{ stat: 'hum', kind: 'pct', v: 1 }], perfs: [] }, null);
          const strong = api.buildHorn({ ri: 0, lines: [{ stat: 'hum', kind: 'pct', v: 100 }], perfs: [] }, null);
          api.updateUI(); api.save();
          return { weak: weak.salvageReason, kept: !strong.salvaged && api.S.equipped.includes(strong.id), ivory: api.S.ivory - before, coll: Object.values(api.S.coll).reduce((n, c) => n + c.n, 0), found: api.S.stats.hornsFound - foundBefore };
        });
        assert.deepEqual(found, { weak: 'filter', kept: true, ivory: 13, coll: 5, found: 2 });
        const goldKept = await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          const h = api.buildHorn({ ri: 0, gold: true, lines: [{ stat: 'hum', kind: 'pct', v: 1 }], perfs: [] }, null);
          api.updateUI(); return !h.salvaged;
        }); assert.equal(goldKept, true);
        await page.locator('#hornSalvageGilded').check();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.buildHorn({ ri: 0, gold: true, lines: [{ stat: 'hum', kind: 'pct', v: 1 }], perfs: [] }, null).salvageReason), 'filter');
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        await page.locator('#hornTabs [data-sub="inventory"]').click();
        assert.equal(await page.locator('#hornAutoEquip').isChecked(), true);
        assert.equal(await page.locator('#hornEquipFocus').inputValue(), 'cave');
        assert.equal(await page.locator('[data-salvage-r="0"]').isChecked(), true);
        assert.equal(await page.locator('#hornSalvageGilded').isChecked(), true);
        await page.locator('#hornAutoEquip').uncheck();
        assert.equal(await page.locator('#hornDetail [data-act="eq"]').isEnabled(), true);
        await page.locator('#hornAutoEquip').check();
        await page.locator('#hornTabs [data-sub="upgrades"]').click();
        await page.locator('#shopHorns .itemrow').filter({ has: page.locator('.nm', { hasText: 'Rarity Weaving' }) }).locator('[data-n="max"]').click();
        await page.getByRole('button', { name: /^Awaken the First Voice/ }).click();
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          for (const trait of ['memory', 'memory', 'resonance']) api.buildHorn({ ri: 5, lines: [{ stat: 'hum', kind: 'pct', v: 10 }], perfs: [.95] }, [.95], trait);
          api.setHornSub('inventory'); api.updateUI(); api.save();
        });
        assert.equal(await page.locator('#hornSalvageRarities input').count(), 6);
        const racks = await page.evaluate(() => { const S = window.__geodeSimulation.api.S; return { normal: S.equipped.length, prim: S.primordialEquipped.length, traits: S.horns.filter(h => S.primordialEquipped.includes(h.id)).map(h => h.trait.id).sort() }; });
        assert.deepEqual(racks, { normal: 1, prim: 2, traits: ['memory', 'resonance'] });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        console.log(`horn inventory ${width}: PASS`);
      } finally { await context.close(); }
    }
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exit(1); });
