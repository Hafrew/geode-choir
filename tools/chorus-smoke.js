// The Last Chorus in the real page: payment, every interaction kind, world-tied encounters, pausing, reload and completion.
const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
const { version } = require('../package.json');
const KEY = 'geode-choir-v1';
const FEATS = ['shout', 'hoarse', 'hum3', 'hum6', 'hum9', 'hum12', 'fuse', 'moon', 'full', 'chord8', 'depth1', 'depth5', 'depth10', 'shaft', 'shard', 'boom', 'prisms', 'lumen3', 'lumen6', 'hands'];
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
        await page.addInitScript(({ key, version, feats }) => {
          window.requestAnimationFrame = () => 0;
          window.__geodeSimulation = { fast: false, items: [] };
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({
            ver: '1.10.8', seenVer: version, hum: 1, hearts: 5, world: 'sea', tab: 'deep', lore: { prologue: 1 }, saved: Date.now(),
            feats: Object.fromEntries(feats.map(f => [f, 1])), sea: { unlocked: true, soundings: 36, fathoms: 60000 },
          }));
        }, { key: KEY, version, feats: FEATS });
        const api = fn => page.evaluate(fn);
        const load = async () => { await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api); };
        const tick = s => page.evaluate(s => { const a = window.__geodeSimulation.api; for (let t = 0; t < s; t += .25) a.chorusTick(.25); }, s);
        const toNext = () => page.evaluate(() => { const a = window.__geodeSimulation.api; for (let i = 0; i < 1000 && !a.S.chorus.open; i++) a.chorusTick(.5); });
        const state = () => api(() => JSON.parse(JSON.stringify(window.__geodeSimulation.api.S.chorus)));
        const card = page.locator('#chorus');
        await load();
        if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
        await page.evaluate(() => { const a = window.__geodeSimulation.api; a.endScene(); a.setTab('deep'); a.updateUI(); });
        assert.match(await page.locator('#songBtn').innerText(), /Begin the Last Chorus/);
        assert.equal(await card.isHidden(), true);

        await page.locator('#songBtn').click();
        await page.waitForFunction(() => !window.__geodeSimulation.api.cinematic, null, { polling: 100 });
        let C = await state();
        assert(C.paid > 0); assert.equal(C.underway, true);
        assert.equal(await api(() => window.__geodeSimulation.api.S.sea.fathoms), 10000);
        assert.equal(await api(() => window.__geodeSimulation.api.S.finale), 0);
        assert.match(await card.innerText(), /Chapter I · Find the First Voice · 1 of 4/);
        assert.match(await card.innerText(), /next in 0:15/);
        assert.match(await page.locator('#songBtn').innerText(), /Leave the Last Chorus/);
        await page.locator('#songBtn').click();
        assert.equal(await page.evaluate(() => window.__geodeSimulation.api.answerSong()), false, 'the offering is paid once');
        assert.equal(await api(() => window.__geodeSimulation.api.S.sea.fathoms), 10000);

        // Paused: no clock, until resumed from the card.
        assert.match(await card.innerText(), /paused/);
        await tick(60); assert.equal((await state()).clock, 0);
        // A hidden page does not advance it either.
        await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); window.__geodeSimulation.api.chorusTick(30); delete document.hidden; });
        await card.getByRole('button', { name: 'Resume' }).click();
        await tick(5); assert.equal((await state()).clock, 5);
        await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); window.__geodeSimulation.api.chorusTick(30); delete document.hidden; });
        assert.equal((await state()).clock, 5);

        // Encounter 1: a Sea clue, heard (and shown) first, then chosen with one wrong try.
        await toNext();
        assert.match(await card.innerText(), /Listen: (low|middle|high)/);
        await tick(3.25);
        const answer = await api(() => { const o = window.__geodeSimulation.api.S.chorus.open; return o.options.findIndex(x => x.join() === o.motif.join()); });
        const wrong = [0, 1, 2].find(i => i !== answer);
        await card.locator(`[data-chorus="answer"][data-index="${wrong}"]`).click();
        assert.equal(await card.locator(`[data-chorus="answer"][data-index="${wrong}"]`).getAttribute('aria-disabled'), 'true');
        await card.locator(`[data-chorus="answer"][data-index="${answer}"]`).click();
        assert.deepEqual((await state()).results, [.5]);

        // Encounter 2 is in the cave: the card offers the way there, and Auto works from anywhere.
        await toNext();
        await card.getByRole('button', { name: 'Go to the Cave' }).click();
        assert.equal(await api(() => window.__geodeSimulation.api.S.world), 'cave');
        assert.equal(await card.locator('[data-chorus="replay"]').count() + await card.locator('.chorus-clue').count(), 1);
        await card.getByRole('button', { name: 'Finish with Auto' }).click();
        assert.deepEqual((await state()).results, [.5, .5]);

        // Reload in the middle of an encounter keeps its answers.
        await toNext();
        await page.evaluate(() => { const a = window.__geodeSimulation.api; a.setWorld('sea'); a.chorusTick(3.5); });
        const tried = await api(() => { const o = window.__geodeSimulation.api.S.chorus.open; const a = o.options.findIndex(x => x.join() === o.motif.join()); return [0, 1, 2].find(i => i !== a); });
        await card.locator(`[data-chorus="answer"][data-index="${tried}"]`).click();
        await page.evaluate(() => window.__geodeSimulation.api.save());
        await load();
        await page.evaluate(() => { const a = window.__geodeSimulation.api; a.endScene(); a.chorusTick(3.5); });
        C = await state();
        assert.equal(C.step, 2); assert.deepEqual(C.open.wrong, [tried]);
        assert.equal(await card.locator(`[data-chorus="answer"][data-index="${tried}"]`).getAttribute('aria-disabled'), 'true');
        await card.getByRole('button', { name: 'Finish with Auto' }).click();
        await toNext(); await card.getByRole('button', { name: 'Go to the Cave' }).click(); await card.getByRole('button', { name: 'Finish with Auto' }).click();

        // Chapter II: horn phrases, timed on the needle.
        await toNext();
        assert.match(await card.innerText(), /Wake the Choir/);
        assert.equal(await card.locator('[data-chorus="hit"]').getAttribute('aria-disabled'), 'true');
        for (let n = 0; n < 3; n++) {
          await page.evaluate(() => { const a = window.__geodeSimulation.api, o = a.S.chorus.open; o.elapsed = 1.55; a.chorusTick(.001); });
          await card.locator('[data-chorus="hit"]').click();
        }
        C = await state();
        assert.equal(C.step, 5); assert(C.results[4] > .9, `phrase ${C.results[4]}`);
        for (let i = 0; i < 3; i++) { await toNext(); await card.getByRole('button', { name: 'Finish with Auto' }).click(); }

        // Chapter III: routes across the Quiet Sea.
        await toNext();
        await page.evaluate(() => window.__geodeSimulation.api.setWorld('sea'));
        await card.locator('[data-chorus="route"][data-mode="steady"]').click();
        assert.equal((await state()).results[8], .6);
        await toNext();
        await card.locator('[data-chorus="route"][data-mode="timing"]').click();
        assert.equal(await card.locator('[data-chorus="hit"]').count(), 1);
        await card.getByRole('button', { name: 'Finish with Auto' }).click();
        for (let i = 0; i < 2; i++) { await toNext(); await card.getByRole('button', { name: 'Finish with Auto' }).click(); }

        // Chapter IV: pulse alignment in the cave half, with a text meter.
        await toNext();
        await card.getByRole('button', { name: 'Go to the Cave' }).click();
        for (let n = 0; n < 3; n++) {
          await page.evaluate(() => { const a = window.__geodeSimulation.api; a.S.chorus.open.elapsed = 3.75; a.chorusTick(.001); });
          assert.match(await card.innerText(), /In step: 100%/);
          await card.locator('[data-chorus="hit"]').click();
        }
        C = await state();
        assert.equal(C.step, 13); assert(C.results[12] > .99, `pulse ${C.results[12]}`);

        // The rest with Auto assistance, which takes longer than playing; completion plays the ending.
        await toNext();
        await card.locator('[data-chorus-assist]').check();
        assert.equal(await api(() => window.__geodeSimulation.api.S.chorus.assist), true);
        await card.locator('[data-chorus-assist]').uncheck();
        await page.evaluate(() => { const a = window.__geodeSimulation.api; a.setWorld('sea'); a.setTab('deep'); a.updateUI(); });
        await page.locator('#songAssist').check();
        const before = await page.evaluate(() => window.__geodeSimulation.api.S.chorus.step);
        await page.evaluate(() => { const a = window.__geodeSimulation.api; for (let i = 0; i < 20000 && !a.S.chorus.done; i++) a.chorusTick(.25); });
        C = await state();
        assert(C.done > 0); assert.equal(C.results.length, 20); assert.equal(before, 13);
        const done = await api(() => { const a = window.__geodeSimulation.api; return { finale: a.S.finale, feat: !!a.S.feats.song, scene: a.sceneOpen }; });
        assert.equal(done.finale, C.done); assert.equal(done.scene, true);
        assert.match(await page.locator('#sceneEyebrow').innerText(), /The Whole Song/i);
        let sawEnding = false;
        for (let i = 0; i < 8 && await api(() => window.__geodeSimulation.api.sceneOpen); i++) {
          if (/A (Quiet|Full|Radiant) Ending/i.test(await page.locator('#sceneTitle').innerText())) sawEnding = true;
          await page.locator('#sceneNext').click();
        }
        assert(sawEnding);
        assert.match(await page.locator('#creditsRows').innerText(), /Harmony\s+\d+%[\s\S]*Ending\s+(Quiet|Full|Radiant)/i);
        await page.locator('#creditsClose').click();
        assert.equal(await card.isHidden(), true);

        // Complete across reloads; replay is cosmetic and charges nothing.
        await page.evaluate(() => window.__geodeSimulation.api.save());
        await load();
        await page.evaluate(() => { const a = window.__geodeSimulation.api; a.endScene(); a.setTab('deep'); a.updateUI(); });
        assert.equal((await state()).done, C.done);
        assert.equal(await page.locator('#songBtn').innerText(), 'Hear it again');
        assert.match(await page.locator('#songNote').innerText(), /harmony/);
        const fathoms = await api(() => window.__geodeSimulation.api.S.sea.fathoms);
        await page.locator('#songBtn').click();
        assert.equal(await api(() => window.__geodeSimulation.api.sceneOpen), true);
        assert.equal(await api(() => window.__geodeSimulation.api.S.sea.fathoms), fathoms);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        console.log(`PASS chorus ${width}px: once-only offering, pause and hidden clock, clues, world-tied encounters, reload, phrases, routes, pulses, assisted completion, ending and replay`);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
