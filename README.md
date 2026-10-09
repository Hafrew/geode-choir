# Geode Choir

An idle / incremental game in two worlds. Shout into a buried crystal cave to wake the town of Hollowmere, descend through older and older caves, kindle the Heartstone, then skip stones across a sunless sea where crossing ripples ring the drowned bells.

It's a static browser game with no build step. Progress is saved in your browser's localStorage.

Current version: **1.9.7**. See [CHANGELOG.md](CHANGELOG.md) for what changed.

## Run locally

Serve the repository folder (JavaScript modules require HTTP):

```bash
python -m http.server 8000
```

Open the server's address in your browser. Keep `styles.css` and `src/` alongside `index.html` when copying or deploying the game.

## Cave upgrade automation

After two Heartstones, **Strata → Patient Choir** unlocks permanently for **100,000 fathoms**. All categories start off. Select Voices, Tuning, Crystals, Wonders, Attunement, Strata, Illuminations, Horn upgrades, or Sunvein upgrades, and set how much hum/shards/fossils/lumen/ivory/Gilt to reserve. It buys one affordable upgrade per enabled category every half-second, using the normal shops. It runs in the cave while the game is active. Horn calls are excluded. Existing Crystal Seeker also respects the hum reserve after unlock; turn off one crystal purchase option if you prefer to use only the other. Settings survive all resets and reloads.

## Development layout

- `index.html`: page markup.
- `styles.css`: page styling.
- `src/state.js`: independent factories for fresh cave, sea, and lifetime state. `createState(version)` takes the release version explicitly.
- `src/automation.js`: cave shop category rules, currency reserves, and saved automation defaults.
- `src/horns.js`: rarity curves, seeded horn rolling, stat/trait effects, dedicated rack rules, inventory automation, save normalization, and sounding difficulty.
- `src/seashells.js`: shell discovery/scoring, dedicated slots, fixed sounding discounts, pending completion, and normalization. Discovery/UI remain planned.
- `src/saves.js`: serialization, compatibility migration, and restoration without DOM or storage access.
- `src/progression.js`: descent/sea rewards and thresholds, Heartstone eligibility and state resets, plus trait-aware decay/Gilt rules.
- `src/main.js`: initialization, the game loop, gameplay orchestration, rendering, audio, and UI. Canvas, audio, and UI extraction remains a later refactor.
- `tools/sim/`: seeded gameplay simulation through an explicit, opt-in interface. It serves the real application over HTTP without rewriting source files.

The next module boundaries and function navigation anchors are in [PLAN.md](PLAN.md).

## Validation

Browser checks and simulations require Node and Playwright. Install Playwright with `npm install -g playwright@1.64.0`, then either install its browser with `playwright install chromium` or point `CHROMIUM` at an existing compatible Chromium executable.

```bash
node tools/smoke.js
node --test tools/horns.test.mjs tools/automation.test.mjs tools/seashells.test.mjs
node tools/horns-smoke.js
node tools/horn-inventory-smoke.js
node tools/qol-smoke.js
node tools/seashells-smoke.js
node tools/sim/run.js --hours 0.1 --seed 1 --out /tmp/geode-smoke.json
```

Both commands start and stop their own temporary local server. The smoke test covers desktop and mobile gameplay, settings, saved progress, and legacy save migration. Both checks use fallback fonts to avoid external network dependencies; they do not test Google Fonts delivery.

Use `--hornStart primordial` for a diagnostic run with the rarity upgrade and Primordial rack already unlocked (no free horns or currency). This measures the maximum-upgrade effect, not natural unlock timing. Use `--hornUpgrades 0` to disable Rarity Weaving and Primordial purchases while retaining the current ivory economy. Fast simulations skip canvas painting while retaining the physics and seeded gameplay draws.

The short simulation checks setup and early progression. For balance work, run the longer, multi-seed comparisons described in `PLAN.md`. `finished: false` is expected when a short run stops before the finale; JavaScript errors cause a failing exit status.

## Deploy

Any static host that serves JavaScript modules works. Deploy the repository's HTML, CSS, and `src/` assets together. On Vercel: **Add New → Project → import this repo**, framework preset **Other**, no build command, output directory `.`.
