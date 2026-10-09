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
          window.__raf = []; window.requestAnimationFrame = cb => { window.__raf.push(cb); return 0; };
          window.__geodeSimulation = { fast: false, items: [] };
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ ver: '1.9.5', seenVer: '1.10.0', hum: 1, hornsOn: true, ivory: 30000, lore: { prologue: 1 }, saved: Date.now() }));
        }, KEY);
        await page.goto(server.url);
        await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        await page.locator('#tab-horns').click();
        await page.locator('#hornTabs [data-sub="sounding"]').click();
        assert(!((await page.locator('#hornOdds').innerText()).includes('Primordial')));
        await page.locator('#hornTabs [data-sub="collection"]').click();
        assert(!((await page.locator('#hornColl').innerText()).includes('Prim')));
        await page.locator('#hornTabs [data-sub="inventory"]').click();
        assert.equal(await page.locator('#primordialRack').isVisible(), false);
        await page.locator('#hornTabs [data-sub="upgrades"]').click();
        assert.equal(await page.getByRole('button', { name: /^Awaken the First Voice/ }).count(), 0);
        const rarity = page.locator('#shopHorns .itemrow').filter({ has: page.locator('.nm', { hasText: 'Rarity Weaving' }) });
        assert((await rarity.innerText()).includes('Next:'));
        await rarity.locator('[data-n="max"]').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.hornUp.rarity), 10);
        assert.equal(await page.getByRole('button', { name: /^Awaken the First Voice/ }).count(), 1);
        const blocked = await page.evaluate(() => window.__geodeSimulation.items.find(it => it.name() === 'First Voice Rack').buy());
        assert.equal(blocked, false);
        await page.locator('#hornTabs [data-sub="sounding"]').click();
        const before = await page.locator('#hornOdds').innerText(); assert(before.includes('Primordial')); assert(before.includes('0%'));
        await page.locator('#hornTabs [data-sub="upgrades"]').click();
        await page.getByRole('button', { name: /^Awaken the First Voice/ }).click();
        await page.getByRole('button', { name: /^First Voice Rack/ }).click();
        await page.locator('#hornTabs [data-sub="sounding"]').click();
        const after = await page.locator('#hornOdds').innerText(); assert(after.includes('28%')); assert(after.includes('2%')); assert(after.includes('15%'));
        const ivoryBeforeSounding = await page.evaluate(() => window.__geodeSimulation.api.S.ivory);
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          api.S.hornPlan = { ri: 5, lines: [{ stat: 'hum', kind: 'pct', v: 250 }, { stat: 'tide', kind: 'mult', v: 3 }, { stat: 'lumen', kind: 'pct', v: 250 }], perfs: [] };
          api.setHornSub('sounding'); api.renderSounding();
          api.sndHit(); // premature hits must not count
        });
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.hornPlan.perfs.length), 0);
        assert((await page.locator('#sndStage').innerText()).includes('6–8 seconds'));
        await page.locator('#sndStage [data-act="auto"]').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.horns[0].trait.quality), .5);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.ivory), ivoryBeforeSounding + 5);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.primordialEquipped.length), 1);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.equipped.length), 0);
        await page.locator('#sndStage [data-act="done"]').click();
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          api.S.hornPlan = { ri: 5, lines: [{ stat: 'hum', kind: 'pct', v: 250 }], perfs: [.95], gold: true };
          api.finishSounding(); api.save();
        });
        assert.equal(await page.locator('#sndStage [data-act="trait"]').count(), 4);
        const savedPlan = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).hornPlan, KEY);
        assert.equal(savedPlan.perfs[0], .95);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        await page.locator('#tab-horns').click(); await page.locator('#hornTabs [data-sub="sounding"]').click();
        assert.equal(await page.locator('#sndStage [data-act="trait"]').count(), 4);
        await page.locator('#sndStage [data-trait="golden"]').click();
        const chosen = await page.evaluate(() => window.__geodeSimulation.api.S.horns.find(h => h.trait?.id === 'golden' && h.gold));
        assert(chosen); assert.equal(chosen.trait.quality, .95);
        await page.locator('#sndStage [data-act="done"]').click();
        await page.locator('#hornTabs [data-sub="inventory"]').click();
        assert.equal(await page.locator('#primordialSlotRow .hslot').count(), 3);
        assert((await page.locator('#hornDetail').innerText()).includes('Golden Echo'));
        assert.equal(await page.locator('#hornFilter [data-r="5"]').count(), 1);
        await page.locator('#hornTabs [data-sub="sounding"]').click();
        await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          api.S.hornPlan = { ri: 5, lines: [{ stat: 'hum', kind: 'pct', v: 250 }], perfs: [] };
          api.renderSounding();
          const r = api.sndRound; r.t0 -= r.readyMs; r.speed = 0; r.phase = r.c / 2;
        });
        await page.locator('#sndBar').dispatchEvent('pointerdown');
        await page.locator('#sndBar').dispatchEvent('pointerdown');
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.hornPlan.perfs.length), 1);
        assert((await page.locator('#sndFb').innerText()).includes('Perfect'));
        await page.waitForTimeout(850);
        assert.equal(await page.locator('#sndStage [data-act="trait"]').count(), 4);
        await page.locator('#sndStage [data-trait="undertow"]').click();
        await page.locator('#sndStage [data-act="done"]').click();
        await page.locator('#hornTabs [data-sub="inventory"]').click();
        await page.screenshot({ path: `/tmp/geode-primordial-${width}.png`, fullPage: true });
        const persisted = await page.evaluate(() => {
          const api = window.__geodeSimulation.api; api.save();
          return { slots: api.S.hornUp.firstRack, ids: api.S.primordialEquipped, trait: api.S.horns.find(h => h.gold).trait };
        });
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        const restored = await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          return { slots: api.S.hornUp.firstRack, ids: api.S.primordialEquipped, trait: api.S.horns.find(h => h.gold).trait };
        }); assert.deepEqual(restored, persisted);
        await page.locator('#tab-horns').click();
        await page.locator('#hornTabs [data-sub="upgrades"]').click();
        const echo = page.locator('#shopHorns .itemrow').filter({ has: page.locator('.nm', { hasText: 'Ivory Echo' }) });
        assert((await echo.innerText()).includes('5 → 10 ivory'));
        const ivoryBeforeUpgrade = await page.evaluate(() => window.__geodeSimulation.api.S.ivory);
        await echo.locator('[data-n="max"]').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.hornUp.ivory), 5);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.ivory), ivoryBeforeUpgrade - 775);
        assert((await echo.innerText()).includes('30 ivory'));
        const award = await page.evaluate(() => {
          const api = window.__geodeSimulation.api, before = api.S.ivory, lifetime = api.S.stats.ivoryLife;
          const h = api.buildHorn({ ri: 0, lines: [{ stat: 'hum', kind: 'pct', v: 10 }], perfs: [] }, null);
          api.save(); return { id: h.id, reward: h.ivoryFound, gain: api.S.ivory - before, life: api.S.stats.ivoryLife - lifetime };
        });
        assert.equal(award.reward, 30); assert.equal(award.gain, 30); assert.equal(award.life, 30);
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.hornUp.ivory), 5);
        // Later salvage pays only the salvage amount, never the discovery grant a second time.
        await page.locator('#tab-horns').click(); await page.locator('#hornTabs [data-sub="inventory"]').click();
        await page.locator(`.hcard[data-id="${award.id}"]`).click();
        const ivoryBeforeSalvage = await page.evaluate(() => window.__geodeSimulation.api.S.ivory);
        await page.locator('#hornDetail [data-act="sal"]').click();
        await page.locator('#hornDetail [data-act="sal"]').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.S.ivory), ivoryBeforeSalvage + 3);
        const resetChecks = await page.evaluate(async () => {
          const api = window.__geodeSimulation.api, ids = [...api.S.primordialEquipped];
          const upgrades = { ...api.S.hornUp }, existing = api.S.horns.map(h => ({ id: h.id, trait: h.trait }));
          api.S.world = 'cave'; api.S.depth = 2; api.S.run = api.deepenAt() * 2; api.S.cool = 0;
          api.refreshAll();
          const expectedGilt = 5 * (1 + (api.activeTraits().golden || 0)), random = Math.random;
          try { Math.random = () => .01; api.descend(); } finally { Math.random = random; }
          const arrival = api.S.giltFloor;
          api.S.sea.run = api.soundAt() * 2; api.sound();
          api.S.depth = api.heartDepth(); api.S.lumen = api.heartCost();
          api.S.hornPlan = { ri: 5, lines: [{ stat: 'hum', kind: 'pct', v: 250 }], perfs: [.95] };
          api.S.lore.heart1 = 1; api.kindle();
          await new Promise(resolve => setTimeout(resolve, 2500));
          return { ids, afterIds: api.S.primordialEquipped, upgrades, afterUpgrades: api.S.hornUp,
            arrival, expectedGilt, hearts: api.S.hearts, pending: api.S.hornPlan,
            traitsPreserved: existing.every(x => JSON.stringify(x.trait) === JSON.stringify(api.S.horns.find(h => h.id === x.id)?.trait)) };
        });
        assert.deepEqual(resetChecks.afterIds, resetChecks.ids);
        assert.deepEqual(resetChecks.afterUpgrades, resetChecks.upgrades);
        assert.equal(resetChecks.arrival, resetChecks.expectedGilt);
        assert.equal(resetChecks.hearts, 1); assert(resetChecks.traitsPreserved);
        assert.equal(resetChecks.pending.perfs[0], .95);
        const fullRack = await page.evaluate(() => {
          const api = window.__geodeSimulation.api;
          while (api.S.horns.length < 30) api.S.horns.push({ id: ++api.S.hornSeq, r: 0, name: 'Plain Ram Horn', seed: api.S.hornSeq, lines: [{ stat: 'hum', kind: 'pct', v: 10 }] });
          const before = api.S.ivory, life = api.S.stats.ivoryLife;
          const h = api.buildHorn({ ri: 5, lines: [{ stat: 'hum', kind: 'pct', v: 10 }], perfs: [] }, null);
          return { reward: h.ivoryFound, salvaged: h.salvaged, gain: api.S.ivory - before, life: api.S.stats.ivoryLife - life };
        });
        assert.equal(fullRack.reward, 30); assert(fullRack.salvaged);
        assert.equal(fullRack.gain, 530); assert.equal(fullRack.life, 530);
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        console.log(`PASS ${width}px: hidden reveal, purchases, odds, dedicated rack, harder sounding, auto, trait choice and reload`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
