const assert = require('node:assert/strict');
const { loadPlaywright } = require('./browser');
const { serve } = require('./serve');
const SAVE = { ver: '1.10.8', seenVer: '1.11.0', hum: 1e6, hearts: 3, depth: 60, lumen: 1e30, lore: { prologue: 1 }, sea: { unlocked: true }, hornsOn: true, hornTimer: 5, lv: { harmony: 3 } };
(async () => {
  const { chromium } = loadPlaywright(), server = await serve(); let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--no-sandbox'] });
    for (const width of [1500, 1100, 700, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 800 } }), page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(String(e)));
      await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ body: '', contentType: 'text/css' }));
      await page.addInitScript(save => { window.requestAnimationFrame = () => 0; window.__geodeSimulation = { fast: false, items: [] }; localStorage.setItem('geode-choir-v1', JSON.stringify({ ...save, saved: Date.now() })); }, SAVE);
      await page.goto(server.url); await page.waitForFunction(() => !!window.__geodeSimulation?.api, null, { polling: 100 });
      if (await page.locator('#mnote').isVisible()) await page.locator('#mnoteBtn').click();
      await page.evaluate(() => window.__geodeSimulation.api.endScene());
      // Below about 58 characters of stage width the chips stay compact (icon and value), including when they wrap to a second row.
      const compact = await page.evaluate(() => ({ stage: document.getElementById('stage').clientWidth / parseFloat(getComputedStyle(document.documentElement).fontSize),
        label: getComputedStyle(document.getElementById('chipDescL')).display, dots: getComputedStyle(document.querySelector('#chord .dots')).display }));
      if (compact.stage <= 58) assert.deepEqual([compact.label, compact.dots], ['none', 'none'], `compact chips at ${width}px`);
      else assert.equal(compact.label, 'block', `full chips at ${width}px`);
      // Opening either popover must leave the top bar and the popover inside the stage.
      for (const [chip, pop] of [['#chipDesc', '#popDesc'], ['#chipHeart', '#popHeart']]) {
        await page.locator(chip).click(); await page.waitForTimeout(350);
        const geo = await page.evaluate(([chip, pop]) => {
          const stage = document.getElementById('stage').getBoundingClientRect(), box = s => document.querySelector(s).getBoundingClientRect();
          const within = r => r.left >= stage.left - 1 && r.right <= stage.right + 1 && r.top >= stage.top - 1 && r.bottom <= stage.bottom + 1;
          return { stage: within(box('#strip')) && within(box('#chipDesc')) && within(box('#setBtn')), popInside: within(box(pop)), popBelowBar: box(pop).top >= box(chip).bottom - 1 };
        }, [chip, pop]);
        assert.deepEqual(geo, { stage: true, popInside: true, popBelowBar: true }, `${chip} at ${width}px`);
        await page.locator(chip).click();
      }
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS hud ${width}px: top bar and popovers stay inside the stage`);
    }
  } finally { if (browser) await browser.close(); server.close && server.close(); }
})().catch(e => { console.error(e); process.exit(1); });
