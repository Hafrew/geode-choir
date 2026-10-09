# Plan: less repetition between descents

Goal: make the gaps between descents more engaging **without changing how long the game takes**.

## Ground rules

1. **Baseline equals today.** Every new mechanic has an auto path that pays exactly today's expected value. Skill moves you above or below it within a cap. `tools/sim` must still land at the same finish time (±2% over several seeds) with the bot on auto. **One deliberate exception:** the Golden Floor (Phase 4) is a real bonus. I'll measure how much it speeds the run up and report it, and we decide then whether to offset it.
2. **Failure costs bonus, not progress**, except the opt-in Risky Descent.
3. **Nothing important depends on being at the screen.** Minigames pause on a timestamp, not on frame ticks, and every one can be auto-resolved. Away time never triggers a failure.
4. **Saves migrate silently.** Nothing is removed or refunded. Old horns get a seed and keep their stats.
5. One version bump and one CHANGELOG entry per phase, plus the in-game "What's new" (see 1.5.0 for the format).

## Scope

Done already: **1.5.1 Sinking Stone multiplier** (1x to 10x, default 2x) **1.6.0 Phase 1** (status strip and hover stats) and **1.7.0 Phase 2** (Horns tab rebuild, procedural SVG horns, Collection) and **1.8.0 Phase 3** (horn minigame), on this branch.

In: top status strip, hover lifetime/max stats, Horns tab rebuild, procedural then 3D horns, horn minigame, descent minigame with Risky Descent, floor identities, biomes, Chronicle drip, offline return report, horn sets, session goals, horn/bell music.

Out (by request): choose-1-of-3 on arrival, rhythm shouts, cave events, crystal resonance puzzles, settling mini-tasks.

## Code map

| Area | Where |
|---|---|
| State defaults | `src/state.js`: `createState(version)`, `freshCave`, `freshSea`, `freshStats` |
| Runtime state and saves | `src/main.js`: `S`, `serialize`, `load`, `migrate`, `grantAway` |
| Horns | `src/main.js`: `gainHorn`, `renderHorns`, `hornBoost`, `buildShop`; panel markup in `index.html` |
| Descent | `src/main.js`: `descend`, `descentLock`, `tickRate`, `checkQuests` |
| Heartstone | `src/main.js`: `kindle`, `canKindle` |
| Tabs | markup in `index.html`; `src/main.js`: `setTab` |
| Chronicle | `src/main.js`: `renderChronicle` |
| Styles | `styles.css` |
| Sim | `tools/sim/{bot,run}.js`, Playwright + seeded `Math.random`; `window.__geodeSimulation` is supplied only by the runner |
| Browser checks | `tools/smoke.js`; ephemeral HTTP serving in `tools/serve.js` |

The Descend and Heartstone panels live in status-strip popovers in `index.html`.

### File layout refactor (in progress, before Phase 5)

Completed first stage: extracted markup, styles, JavaScript, and independent state factories. The simulation now loads the real modules over HTTP through an opt-in interface instead of patching source text. No gameplay or save-format changes.

Next stages, each validated independently:

1. Separate save serialization and migration from DOM updates. Keep the storage key, backups, and existing save compatibility.
2. Extract progression and horn rules with explicit state inputs and outcomes; UI code applies and presents those outcomes. Preserve seeded random draw order.
3. Move canvas rendering, audio, and UI into modules after their dependencies are explicit. Avoid shared global variables or generic event plumbing just to split files.

Static hosting stays build-free. A bundled single-file release can be added separately if needed; it is not required for development.

---

## Phase 1: Chrome and visibility (1.6.0, done)

**Status strip (top center).** A compact bar visible on every tab and both worlds.
- *Descend chip:* ring showing settling progress, countdown, a glow when ready. Click opens a popover with the current Descend panel content.
- *Heartstone chip:* lumen progress to the cost, plus depth and sea requirements as small pips. Click opens the existing panel.
- *Sunless Sea chip:* appears in the sea. The same pattern covers the next layer when it exists.
- *Horn chip:* a timer to the next horn call, and a pulse when the sounding is ready (used in Phase 3).
- Reuse the existing panel render functions inside popovers rather than rewriting them. Remove the in-tab copies. Handle phone width (chips collapse to icons) and keyboard/focus (`role="button"`, Esc closes).

**Hover stats.** Add `S.life` (never reset by descent, Heartstone, or sea) and `S.best`.
- Track: lifetime hum, shards, fossils, lumen, ivory, fathoms, horns found; best hum/s, best depth, best chord, longest floor.
- Tooltip shows three rows: this floor, this Heartstone, all-time (plus max where it makes sense).
- Migration: seed `S.life` from existing `S.stats` and current totals; mark approximated fields.

Sim impact: none.

## Phase 2: Horns tab rebuild and horn visuals (1.7.0, done)

**Horns tab sub-tabs:** *Upgrades* (rack, ear, whetstone, branching, and the shop) · *Inventory* · *Sounding* (placeholder until Phase 3) · *Collection*.

**Inventory** as an RPG screen: equipped slots around a central figure or rack, a grid of owned horns, a detail panel on selection (stats, rarity, equip/salvage), sort and filter. The existing 30-horn cap and salvage-for-ivory stay.

**Unique horns.** Add `h.seed` and derive everything from `{seed, rarity, stat lines}`:
- Body shape family (curve, taper, bell flare, segment rings), length from the main stat, material and glow from rarity, inlays and engraving from extra stat lines. Rarer horns get more ornamentation and a particle or aura.
- `hornSVG(h)` is a pure deterministic function. Used in the grid, detail view, and the Collection.
- Old horns: `seed = hash(h.id)`, so each keeps a stable look.

**Collection.** Records discovered designs by `family + material` (and the best rarity seen). It's a gallery with silhouettes for undiscovered ones. Horn sets (Phase 6) hook in here.

Sim impact: none (visual and UI only).

## Phase 3: Horn minigame (1.8.0, done)

Flow:
1. When the horn timer expires, the chip pulses. Opening the **Sounding** screen **spins rarity first** (existing odds and pity unchanged).
2. **One minigame per stat line.** A horn with 1 stat gives 1 minigame, 2 stats gives 2, and so on up to the line count for its rarity (Branching's extra stat adds one more). Each is short (about 4 to 6 s), and the performance of each sets that stat's roll within the rarity.
3. The average performance across the minigames also sets the chance of an extra horn.
4. Horn upgrades scale it: Keen Ear shortens the wait and widens timing windows, Whetstone raises the ceiling, Branching adds a stat (and so a minigame), Rack adds a pick slot.

EV neutrality:
- Performance maps to a stat multiplier in **0.5 to 1.5** (`0.5 + performance`), and an average performance of 0.5 is exactly 1.0. The extra-horn chance is `(avg - 0.5) * 0.5`, up to 25%.
- **Auto-resolve** (a setting, and automatic after N minutes away) takes performance = the mean for every line. A "finish with auto" button skips the remaining lines mid-sounding. This is the sim bot's path.
- A sounding that expires while you're away waits in the Sounding screen with no loss. Several can queue, up to a cap.

Sim impact: the bot uses auto. Add an assertion that horn stat totals match the old averages over many seeded rolls.

## Phase 4: Floor identities, Sunvein and biomes (1.9.0, done)

**Floor identities.** Rolled on arrival (from depth ~3), shown in the Descend chip and the cave header, stored as `S.floorId`. Examples: *Echoing* (shards x2, hum x0.85), *Glowworm bloom* (lumen x1.6, shards x0.8), *Cracked* (more fossil veins, slower decay), *Still* (steady, no modifiers). Each table averages 1.0 on income so the finish time doesn't move. They sit alongside the existing descent surprises (rubble, vein, double fall). The Chronicle records the identities you've met.

**Sunvein** (the Golden Floor; named *Sunvein*). A rare floor that can replace the normal roll on arrival.
- **Chance:** 5% by default. Each Golden Horn you own (equipped or not) adds +2%, capped at 15% from that source. A successful Risky Descent adds a flat +10% to that one roll on top of the cap (25% at most).
- **On a Golden Floor, base effects:** decay is 25% slower (decay rate x0.75), fossils from that floor get **+10%**, and **50%** of horn soundings there are Golden Horns.
- **Golden upgrades** can only be bought while standing on a Golden Floor, and their levels persist:
  - *Rich Vein:* the fossil bonus rises from +10% to +30%.
  - *Gilded Breath:* the Golden Horn chance rises from 50% to 100%.
- **Golden Horns:** the minigame result gets a further x1.25 on top, plus a distinct look (gold material, glow, particles) and their own Collection entries. Each one you own adds +2% to the Golden Floor chance, so a collection of 5 reaches the 15% cap.
- Heartstone: the Golden Floor chance, Golden upgrades and owned Golden Horns carry over, since horns are kept.

**Golden currency (proposal): Gilt.**
- A new currency that **only accrues while you are on a Golden Floor**, as time-based income: a steady trickle that fades with the floor's freshness, plus a small lump when you arrive. It's never earned on normal floors.
- It is **never reset** by descents or Heartstones, so the Golden upgrades keep their levels and any unspent Gilt keeps too.
- Golden upgrades cost Gilt only. Costs rise with each level, and the whole tree is sized to take about 4 to 6 Golden Floor visits to max. That keeps it a long-tail goal that doesn't need camping on the floor.
- Why time-based and capped per floor: you pick when to leave, so a cap per floor stops "stay forever" from beating "descend and re-roll", which would stretch the game out.
- Shown as a new pill (visible once you've seen a Golden Floor) with the same hover stats (held, lifetime, best per floor).
- Alternative: pay in fossils (no new currency). Simpler, but then Golden upgrades compete with Strata, and it doesn't make the floor feel special.

Pacing: this is a real bonus. The sim will model it and I'll report the speedup before shipping; you've said you're fine with a modest one.

**Biomes.** Every 4 depths, a new look: palette tint, crystal geometry, ambient layer. Purely visual, no effect on the numbers. Heartstone resets the biome to the first. The Golden Floor overrides the biome with a gold tint.

Sim impact: identities change variance, not mean. The Golden Floor changes the mean; test several seeds and the decay interaction.

## Phase 5: Descent minigame and Risky Descent (1.10.0)

**Standard descent.** Pressing Descend opens a short minigame (a controlled drop, with timing or steering).
- *Clean descent:* you land normally and receive a **bonus** (extra fossils and/or a freshness head start), scaled by performance up to a cap.
- *Poor performance:* you still descend normally with no bonus. **No penalty.**
- *Auto-descend / Sinking Stone:* the baseline, with no bonus.
- The settling lock and quests are unchanged.

**Risky Descent (opt-in).** A second button.
- Success: a bigger bonus than a clean descent, **and +10% flat to the Golden Floor chance** for that landing.
- Failure: you **fall back to the last gate**. All upgrades stay intact. The floor's decay carries over, and you take a lock of **current settling time ÷ 0.5** (that is, double). Good performance can raise the decay offset, per your note.
- Tuning: a player who succeeds about 70% of the time should come out modestly ahead, and a poor one behind. The sim models a player at a fixed success rate. The bot's default is to never take the risk.
- Needs a clear confirm dialog showing the exact penalty.

The last gate is the previous depth (depth - 1). Confirmed.

## Phase 6: Story, report, goals, collection, music (1.11.0)

- **Chronicle drip.** Lore lines unlock one at a time over the settling timer. Pure flavor, with a "new page" marker on the Chronicle button.
- **Offline return report.** A short scene on load showing what happened while away (hum, floors faded, horns waiting, quests completed). Reuses the existing away calculation, with no new rewards.
- **Horn sets.** Complete a set of 3 related designs for a cosmetic or a small flat passive, capped so it can't snowball.
- **Session goals.** Three small goals per day (local date). They pay **cosmetics only**: horn skins, cave tints, strip themes.
- **Music.** Equipped horns and rung bells contribute notes to a procedural song, so a bigger collection sounds fuller. I'll read the existing audio code first and reuse its scale (minor pentatonic) and the Sound on/off setting.

## Phase 7: 3D horns (1.12.0 or 2.0)

- Optional upgrade over the SVG horns: a three.js tube/lathe geometry built from the same `{seed, rarity, stats}`.
- Lazy-load three.js from a pinned CDN version, only when the Inventory or Collection is opened. If it fails to load or WebGL is missing, fall back to SVG.
- Slow idle rotation, with a drag-to-rotate in the detail view. Keep the render loop paused when the view is hidden.
- Keeps static hosting build-free; load three.js from the Inventory/Collection module.

---

## Testing

- `node tools/sim/run.js --hours 40 --seed N` before and after each phase, for seeds 1 to 5, comparing the marks (finish time, Heartstone times). Fail the phase if finish time moves more than ±2%.
- Extend `bot.js` for auto-resolve of the descent minigame, and a `--risk p` option to model a given success rate. Horn auto-resolve already exists.
- Playwright smoke tests: each new screen opens at desktop and phone width with no `pageerror`, and an old save loads and migrates.
- Manual: backgrounded tab, away for hours, fast clock changes, reduced-motion preference.

## Risks

| Risk | Mitigation |
|---|---|
| Minigames feel like chores | Auto-resolve, short length, and skippable from the first use |
| Timer throttling in background tabs | Timestamps, not ticks |
| Single file grows large (3.9k lines now) | Group new code in clearly marked sections, and consider a build step only if it becomes unmanageable (not planned) |
| 3D load weight or WebGL absence | Lazy-load, with SVG fallback |
| Floor identities skew pacing | Mean-1.0 tables, sim-verified at several seeds |
| Risky Descent feels punishing | Opt-in only, exact penalty shown before confirming |

## Decisions so far

- Last gate on a failed Risky Descent: depth - 1.
- Horn minigame: one minigame per stat line.
- Golden Floor: 5% base, +2% per Golden Horn owned, 15% cap on that part, +10% flat from a successful Risky Descent on top.
- Golden Floor fossil bonus starts at +10% and upgrades to +30%. Golden Horn chance starts at 50% and upgrades to 100%. Golden upgrades are bought on a Golden Floor only.
- Session goals reset at local midnight (default), phase order as above (default).

## Resolved
- Golden upgrades are paid in **Gilt**, as proposed in Phase 4. *Slow Gold* is dropped: the Golden upgrades are *Rich Vein* and *Gilded Breath* only.
