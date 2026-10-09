# Plan: less repetition between descents

Goal: make the gaps between descents more engaging **without changing how long the game takes**.

## Ground rules

1. **Baseline equals today.** Every new mechanic has an auto path that pays exactly today's expected value. Skill moves you above or below it within a cap. `tools/sim` must still land at the same finish time (±2% over several seeds) with the bot on auto.
2. **Failure costs bonus, not progress**, except the opt-in Risky Descent.
3. **Nothing important depends on being at the screen.** Minigames pause on a timestamp, not on frame ticks, and every one can be auto-resolved. Away time never triggers a failure.
4. **Saves migrate silently.** Nothing is removed or refunded. Old horns get a seed and keep their stats.
5. One version bump and one CHANGELOG entry per phase, plus the in-game "What's new" (see 1.5.0 for the format).

## Scope

In: top status strip, hover lifetime/max stats, Horns tab rebuild, procedural then 3D horns, horn minigame, descent minigame with Risky Descent, floor identities, biomes, Chronicle drip, offline return report, horn sets, session goals, horn/bell music.

Out (by request): choose-1-of-3 on arrival, rhythm shouts, cave events, crystal resonance puzzles, settling mini-tasks.

## Code map (all in `index.html`)

| Area | Where |
|---|---|
| State | `fresh()` ~L840, `S`, `serialize()`/`load()` ~L3612/3660 |
| Horns | `gainHorn` ~L2819, `renderHorns` ~L2862, `hornBoost` ~L855, shop items ~L2781, panel markup ~L496 |
| Descent | `descend()` ~L2987, lock/`tickRate()` ~L900, quests ~L923 |
| Heartstone | `kindle()` ~L3061 |
| Tabs | nav ~L392, panels ~L496+ |
| Chronicle | `renderChronicle` ~L3423 |
| Sim | `tools/sim/{build,bot,run}.js`, Playwright + seeded `Math.random` |

The Descend and Heartstone panels currently live in the Glow tab column under the upgrade list. The Sunless Sea gets its own equivalent chip.

---

## Phase 1: Chrome and visibility (1.6.0)

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

## Phase 2: Horns tab rebuild and horn visuals (1.7.0)

**Horns tab sub-tabs:** *Upgrades* (rack, ear, whetstone, branching, and the shop) · *Inventory* · *Sounding* (placeholder until Phase 3) · *Collection*.

**Inventory** as an RPG screen: equipped slots around a central figure or rack, a grid of owned horns, a detail panel on selection (stats, rarity, equip/salvage), sort and filter. The existing 30-horn cap and salvage-for-ivory stay.

**Unique horns.** Add `h.seed` and derive everything from `{seed, rarity, stat lines}`:
- Body shape family (curve, taper, bell flare, segment rings), length from the main stat, material and glow from rarity, inlays and engraving from extra stat lines. Rarer horns get more ornamentation and a particle or aura.
- `hornSVG(h)` is a pure deterministic function. Used in the grid, detail view, and the Collection.
- Old horns: `seed = hash(h.id)`, so each keeps a stable look.

**Collection.** Records discovered designs by `family + material` (and the best rarity seen). It's a gallery with silhouettes for undiscovered ones. Horn sets (Phase 6) hook in here.

Sim impact: none (visual and UI only).

## Phase 3: Horn minigame (1.8.0)

Flow, per your design:
1. When the horn timer expires, the chip pulses. Opening the **Sounding** screen **spins rarity first** (existing odds and pity unchanged).
2. A short minigame follows (about 10 to 15 s), a breath/pitch hold or timing lane in keeping with the theme. **Performance** (0 to 1) sets the stat roll within the rarity and how many horns you get.
3. Horn upgrades scale the minigame: Keen Ear shortens the wait and widens the timing window, Whetstone raises the ceiling, Branching adds the extra-stat chance, Rack gives a bonus pick slot.

EV neutrality:
- Performance maps to a stat multiplier in **0.6 to 1.5** and an extra-horn chance, with the mean set to 1.0 for a typical player.
- **Auto-resolve** setting (and automatic when the tab is away for more than N minutes) takes performance = the mean. It's the sim bot's path.
- If the timer expires while you're away, the horn waits in the Sounding screen, with no loss. Multiple unsounded horns can queue, up to a cap.

Sim impact: the bot uses auto. Add an assertion that horn stat totals match the old averages over many seeded rolls.

## Phase 4: Floor identities and biomes (1.9.0)

**Floor identities.** Rolled on arrival (from depth ~3), shown in the Descend chip and the cave header, stored as `S.floorId`. Examples: *Echoing* (shards ×2, hum ×0.85), *Glowworm bloom* (lumen ×1.6, shards ×0.8), *Cracked* (more fossil veins, slower decay), *Still* (steady, no modifiers). Rule: each is tuned so the average across the roll table is 1.0 on income, so the finish time doesn't move. Sits alongside the existing descent surprises (rubble, vein, double fall). Make the Chronicle record the identities you've met.

**Biomes.** Every 4 depths, a new look: palette tint, crystal geometry, ambient layer. Purely visual, no effect on the numbers. Heartstone resets the biome to the first.

Sim impact: floor identities change variance, not mean. Check at several seeds. Note that identities with a decay effect interact with the floor-freshness curve, so test those explicitly.

## Phase 5: Descent minigame and Risky Descent (1.10.0)

**Standard descent.** Pressing Descend opens a short minigame (a controlled drop, with timing or steering).
- *Clean descent:* you land normally and receive a **bonus** (extra fossils and/or a freshness head start), scaled by performance up to a cap.
- *Poor performance:* you still descend normally with no bonus. **No penalty.**
- *Auto-descend / Sinking Stone:* the baseline, with no bonus.
- The settling lock and quests are unchanged.

**Risky Descent (opt-in).** A second button.
- Success: a bigger bonus than a clean descent, and uses the same landing rules.
- Failure: you **fall back to the last gate**. All upgrades stay intact. The floor's decay carries over, and you take a lock of **current settling time ÷ 0.5** (that is, double). Good performance can raise the decay offset, per your note.
- Tuning: a player who succeeds about 70% of the time should come out modestly ahead, and a poor one behind. The sim models a player at a fixed success rate. The bot's default is to never take the risk.
- Needs a clear confirm dialog showing the exact penalty.

Open item for you: define "last gate" precisely. My default is the previous depth you descended from (depth − 1).

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
- Keeps `index.html` as a single file with no build step.

---

## Testing

- `node tools/sim/run.js --hours 40 --seed N` before and after each phase, for seeds 1 to 5, comparing the marks (finish time, Heartstone times). Fail the phase if finish time moves more than ±2%.
- Extend `bot.js` for auto-resolve of the horn and descent minigames, and a `--risk p` option to model a given success rate.
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

## Open questions (defaults in brackets)

1. "Last gate" for a failed Risky Descent: [depth − 1].
2. Minigame style for horns and descents: [timing-based, one-button, works with touch and keyboard].
3. Session goals reset: [local midnight].
4. Phase order: [as above]. Phases 1 and 2 are independent and could ship in either order.
