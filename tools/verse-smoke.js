// The Second Verse in the real page: the offer after the Last Chorus, the confirmation, the full reset, the Foundations
// panel, buying with Echoes and Stone, time away, and reload.
const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
const { version } = require('../package.json');
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
        await page.addInitScript(({ key, version }) => {
          window.requestAnimationFrame = () => 0;
          window.__geodeSimulation = { fast: false, items: [] };
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
            ver: version, seenVer: version, hum: 5e6, hearts: 5, depth: 40, world: 'sea', tab: 'deep', lore: { prologue: 1 }, saved: Date.now(),
            stats: { maxDepth: 120 }, finale: 1000, chorus: { paid: 900, done: 1000, results: [0.8, 0.6] }, feats: { shout: 1, hum3: 1 },
            sea: { unlocked: true, soundings: 40, fathoms: 777 },
          }));
        }, { key: KEY, version });
        const A = fn => page.evaluate(fn);
        await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        await A(() => { const a = window.__geodeSimulation.api; a.endScene(); a.S.coll['x:3'] = { seed: 5, name: 'Old Horn', ls: ['a'], n: 2, r: 3 }; a.setTab('deep'); a.updateUI(); });

        // The offer appears only after the finale; cancelling changes nothing.
        assert.equal(await page.locator('#verseBtn').isVisible(), true);
        assert.equal(await A(() => window.__geodeSimulation.api.inVerse()), false);
        await page.locator('#verseBtn').click();
        assert.equal(await page.locator('#verse').isVisible(), true);
        assert.match(await page.locator('#verseRows').innerText(), /Echoes you will earn/);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#verse').isHidden(), true);
        assert.equal(await A(() => window.__geodeSimulation.api.S.hearts), 5);
        assert.equal(await A(() => window.__geodeSimulation.api.S.verse.laps), 0);

        // Confirming resets everything but meta, and the Foundations tab replaces the old ones.
        await page.locator('#verseBtn').click(); await page.locator('#verseConfirm').click();
        const s = await A(() => { const S = window.__geodeSimulation.api.S; return { hearts: S.hearts, hum: S.hum, soundings: S.sea.soundings, fathoms: S.sea.fathoms, laps: S.verse.laps, echoes: S.verse.echoes, tab: S.tab,
          best: S.verse.best, record: Object.keys(S.verse.record), finale: S.finale, maxDepth: S.stats.maxDepth, feats: Object.keys(S.feats).length }; });
        assert.deepEqual({ ...s, best: undefined }, { hearts: 0, hum: 0, soundings: 0, fathoms: 0, laps: 1, echoes: s.echoes, tab: 'hall', best: undefined, record: ['x:3'], finale: 1000, maxDepth: 120, feats: s.feats });
        assert(s.feats >= 2, 'feats survive');
        assert(s.echoes > 0); assert.equal(s.best.hearts, 5);
        assert.equal(await page.locator('#panel-hall').isVisible(), true, 'the Hall is the landing tab');
        assert.equal(await page.locator('#wHall').isVisible(), true);
        for (const t of ['cave', 'sea', 'strata', 'pearls', 'deep', 'choir', 'horns', 'found', 'hall']) assert.equal(await page.locator('#tab-' + t).isHidden(), true, t + ' tab');
        assert.equal(await page.locator('#chipDesc').isHidden(), true);

        // Tapping the world gives nothing, and the two worlds still switch.
        const hum = await A(() => { const a = window.__geodeSimulation.api; a.tap(300, 300); return a.S.hum; });
        assert.equal(hum, 0);
        await page.locator('#wSea').click();
        assert.equal(await A(() => window.__geodeSimulation.api.S.world), 'sea');
        assert.equal(await A(() => window.__geodeSimulation.api.S.tab), 'found');
        assert.equal(await page.locator('#panel-found').isVisible(), true);
        assert.match(await page.locator('#foundRecord').innerText(), /1 horn kinds/);
        await page.locator('#wHall').click();
        assert.equal(await A(() => window.__geodeSimulation.api.S.tab), 'hall');
        assert.equal(await page.locator('#wHall').getAttribute('aria-pressed'), 'true');
        await page.locator('#wCave').click();
        assert.equal(await A(() => window.__geodeSimulation.api.S.tab), 'found');

        // The Hall: build, recruit, assign, rehearse and learn a song.
        await A(() => { const a = window.__geodeSimulation.api, F = a.S.verse.foundations; F.stone = F.tide = 1e12; a.setTab('hall'); a.updateUI(); });
        assert.equal(await page.locator('#hallRecruit').isDisabled(), true, 'no room before a district stands');
        await page.locator('[data-district="quarry"]').click();
        await page.locator('#hallRecruit').click(); await page.locator('#hallRecruit').click();
        await page.locator('[data-part="0"][data-delta="1"]').click(); await page.locator('[data-part="1"][data-delta="1"]').click();
        const hall = await A(() => { const H = window.__geodeSimulation.api.S.verse.hall; return { q: H.districts.quarry, singers: H.singers, parts: H.parts.slice() }; });
        assert.deepEqual(hall, { q: 1, singers: 2, parts: [1, 1, 0, 0, 0] });
        assert.equal(await page.locator('[data-district="belfry"]').isDisabled(), true, 'the Belfry needs its neighbours');
        await A(() => { const a = window.__geodeSimulation.api; a.frame(performance.now() + 1000); });
        await A(() => { const a = window.__geodeSimulation.api; let t = performance.now(); for (let i = 0; i < 60; i++) a.frame(t += 50); a.S.verse.hall.cadence = 1000; a.updateUI(); });
        assert((await A(() => window.__geodeSimulation.api.S.verse.hall.cadence)) >= 1000, 'Cadence accrues');
        await page.locator('[data-song="firstLight"]').click();
        assert.equal(await A(() => window.__geodeSimulation.api.S.verse.hall.songs.firstLight), 1);
        assert.match(await page.locator('[data-song="firstLight"]').innerText(), /known/);
        assert.equal(await page.locator('[data-song="deepHymn"]').isDisabled(), true, 'the second songbook needs the Hall');
        assert.match(await page.locator('#humUnit').innerText(), /cadence/i);
        await A(() => window.__geodeSimulation.api.setTab('found'));

        // The Foundations run on frames and on time away.
        await A(() => { const a = window.__geodeSimulation.api; let t = performance.now(); for (let i = 0; i < 40; i++) a.frame(t += 50); });
        const stone = await A(() => window.__geodeSimulation.api.S.verse.foundations.stone);
        assert(stone > 0, 'Stone accrues while playing');
        const before = await A(() => window.__geodeSimulation.api.S.verse.foundations.tide);
        await A(() => window.__geodeSimulation.api.grantAway(3600));
        const after = await A(() => window.__geodeSimulation.api.S.verse.foundations.tide);
        assert(after > before + 1000, 'time away is applied');
        assert.equal(await page.locator('#away').isVisible(), true);
        await page.locator('#awayClose').click();

        // Spending: an engine with Stone, an unlock with Echoes.
        await A(() => { const V = window.__geodeSimulation.api.S.verse; V.foundations.stone = 1e9; V.echoes = 100; window.__geodeSimulation.api.updateUI(); });
        await page.locator('#buyCaveEngine').click();
        assert.equal(await A(() => window.__geodeSimulation.api.S.verse.foundations.engine.cave), 1);
        await page.locator('#buyKeepTime').click();
        assert.equal(await A(() => window.__geodeSimulation.api.S.verse.unlocks.keepTime), 1);
        assert.equal(await page.locator('#buyKeepTime').isDisabled(), true);
        assert.equal(await A(() => window.__geodeSimulation.api.S.verse.echoes), 90);

        // Reload keeps all of it, and the offer is gone.
        await A(() => window.__geodeSimulation.api.save());
        await page.reload(); await page.waitForFunction(() => !!window.__geodeSimulation?.api);
        const r = await A(() => { const S = window.__geodeSimulation.api.S; return { laps: S.verse.laps, kt: S.verse.unlocks.keepTime, eng: S.verse.foundations.engine.cave, tab: S.tab, inV: window.__geodeSimulation.api.inVerse(), q: S.verse.hall.districts.quarry, song: S.verse.hall.songs.firstLight }; });
        assert.deepEqual(r, { laps: 1, kt: 1, eng: 1, tab: 'found', inV: true, q: 1, song: 1 });
        assert.equal(await page.locator('#verseBtn').isHidden(), true);
        assert.deepEqual(errors, []);
        console.log(`PASS ${width}px: Second Verse offer, confirmation, full reset, Foundations, time away and reload`);
      } finally { await context.close(); }
    }
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exit(1); });
