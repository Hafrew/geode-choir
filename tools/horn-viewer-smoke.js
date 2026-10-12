const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');

(async () => {
  const { chromium } = loadPlaywright(), server = await serve(); let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const width of [1100, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: width === 390 });
      try {
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(String(error)));
        await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ body: '', contentType: 'text/css' }));
        await page.addInitScript(() => {
          window.requestAnimationFrame = () => 0;
          window.__geodeSimulation = { fast: false, items: [] };
          if (!localStorage.getItem('geode-choir-v1')) localStorage.setItem('geode-choir-v1', JSON.stringify({
            ver: '1.10.7', seenVer: '1.11.0', hum: 1, hornsOn: true, lore: { prologue: 1 }, saved: Date.now(),
            horns: [{ id: 1, r: 3, name: 'Ancient Ibex Horn', seed: 71,
              lines: [{ stat: 'hum', kind: 'pct', v: 110 }, { stat: 'tide', kind: 'pct', v: 120 }] }], equipped: [1], hornSeq: 1
          }));
        });
        const open = async () => {
          await page.waitForFunction(() => !!window.__geodeSimulation?.api);
          if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
          await page.locator('#tab-horns').click(); await page.locator('#hornTabs [data-sub="inventory"]').click();
        };
        await page.goto(server.url); await open();
        const detail = page.locator('#hornDetail'), canvas = detail.locator('canvas');
        assert.equal(await detail.locator('[data-horn-view="2d"]').getAttribute('aria-pressed'), 'true');
        const svg = await detail.locator('.hsvg').evaluate(el => el.outerHTML);
        const state = await page.evaluate(() => JSON.stringify(window.__geodeSimulation.api.S.horns));
        await detail.locator('[data-horn-view="3d"]').click();
        assert.equal(await canvas.count(), 1);
        assert.equal(await page.locator('#hornGrid svg').count(), 1);
        await canvas.scrollIntoViewIfNeeded();
        const image = () => canvas.evaluate(el => el.toDataURL());
        const initial = await image();
        const colored = await canvas.evaluate(el => {
          const data = el.getContext('2d').getImageData(0, 0, el.width, el.height).data;
          return data.filter((v, i) => i % 4 === 3 && v > 0).length;
        });
        assert.ok(colored > 1000, '3D mesh must draw visible pixels');
        await canvas.focus(); await canvas.press('ArrowRight'); assert.notEqual(await image(), initial);
        await canvas.press('Home'); assert.equal(await image(), initial);
        const bounds = await canvas.boundingBox();
        await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width / 2 + 45, bounds.y + bounds.height / 2 + 15, { steps: 3 }); await page.mouse.up();
        assert.notEqual(await image(), initial);
        await detail.locator('.horn-view-reset').click(); assert.equal(await image(), initial);
        if (width === 390) {
          await canvas.scrollIntoViewIfNeeded();
          const box = await canvas.boundingBox(), session = await context.newCDPSession(page);
          await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x + 60, y: box.y + 60 }] });
          await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x + 100, y: box.y + 75 }] });
          await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await session.detach();
          assert.notEqual(await image(), initial);
        }
        await detail.locator('[data-horn-view="2d"]').click();
        assert.equal(await canvas.count(), 0); assert.equal(await detail.locator('.hsvg').evaluate(el => el.outerHTML), svg);
        assert.equal(await page.evaluate(() => JSON.stringify(window.__geodeSimulation.api.S.horns)), state);
        await detail.locator('[data-horn-view="3d"]').click(); await page.reload(); await open();
        assert.equal(await canvas.count(), 1, 'presentation choice persists');
        // Exercise every family and rarity, including branches, coils and gold.
        for (const animal of ['Ram', 'Stag', 'Ibex', 'Oryx', 'Kudu', 'Narwhal', 'Auroch', 'Conch']) {
          await page.evaluate(animal => {
            const api = window.__geodeSimulation.api;
            api.S.horns = Array.from({ length: 6 }, (_, r) => ({ id: r + 1, r, name: `Ancient ${animal} Horn`, seed: r + 71, gold: r === 4,
              lines: [{ stat: 'hum', kind: 'pct', v: 30 }], ...(r === 5 ? { trait: { id: 'memory', q: .8 } } : {}) }));
            api.setHornSub('inventory');
          }, animal);
          for (let id = 1; id <= 6; id++) {
            await page.locator(`#hornGrid [data-id="${id}"]`).click();
            assert.equal(await canvas.count(), 1);
            assert.ok((await image()).length > 2000);
          }
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        console.log(`horn viewer ${width}: PASS`);
      } finally { await context.close(); }
    }
  } finally { if (browser) await browser.close(); await server.close(); }
})().catch(error => { console.error(error); process.exit(1); });
