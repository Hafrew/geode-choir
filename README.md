# Geode Choir

An idle / incremental game in two worlds. Shout into a buried crystal cave to wake the town of Hollowmere, descend through older and older caves, kindle the Heartstone, then skip stones across a sunless sea where crossing ripples ring the drowned bells.

It's a static browser game with no build step. Progress is saved in your browser's localStorage.

Current version: **1.9.1**. See [CHANGELOG.md](CHANGELOG.md) for what changed.

## Run locally

Serve the repository folder (JavaScript modules require HTTP):

```bash
python -m http.server 8000
```

Open the server's address in your browser. Keep `styles.css` and `src/` alongside `index.html` when copying or deploying the game.

## Development layout

- `index.html`: page markup.
- `styles.css`: page styling.
- `src/state.js`: independent factories for fresh cave, sea, and lifetime state. `createState(version)` takes the release version explicitly.
- `src/main.js`: initialization and the game loop; currently also contains gameplay, rendering, audio, UI, and save migration. These will move into modules incrementally as their dependencies are separated.
- `tools/sim/`: seeded gameplay simulation through an explicit, opt-in interface. It serves the real application over HTTP without rewriting source files.

The next module boundaries and function navigation anchors are in [PLAN.md](PLAN.md).

## Validation

Browser checks and simulations require Node and Playwright. Install Playwright with `npm install -g playwright@1.64.0`, then either install its browser with `playwright install chromium` or point `CHROMIUM` at an existing compatible Chromium executable.

```bash
node tools/smoke.js
node tools/sim/run.js --hours 0.1 --seed 1 --out /tmp/geode-smoke.json
```

Both commands start and stop their own temporary local server. The smoke test covers desktop and mobile gameplay, settings, saved progress, and legacy save migration. Both checks use fallback fonts to avoid external network dependencies; they do not test Google Fonts delivery.

The short simulation checks setup and early progression. For balance work, run the longer, multi-seed comparisons described in `PLAN.md`. `finished: false` is expected when a short run stops before the finale; JavaScript errors cause a failing exit status.

## Deploy

Any static host that serves JavaScript modules works. Deploy the repository's HTML, CSS, and `src/` assets together. On Vercel: **Add New → Project → import this repo**, framework preset **Other**, no build command, output directory `.`.
