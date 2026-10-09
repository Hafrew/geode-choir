# Plan: less repetition between descents

Goal: make the gaps between descents more engaging **without changing how long the game takes**.

## Ground rules

1. **Baseline equals today.** Every new mechanic has an auto path that pays exactly today's expected value. Skill moves you above or below it within a cap. `tools/sim` must still land at the same finish time (±2% over several seeds) with the bot on auto. **One deliberate exception:** the Golden Floor (Phase 4) is a real bonus. I'll measure how much it speeds the run up and report it, and we decide then whether to offset it.
2. **Failure costs bonus, not progress**, except the opt-in Risky Descent.
3. **Nothing important depends on being at the screen.** Minigames pause on a timestamp, not on frame ticks, and every one can be auto-resolved. Away time never triggers a failure.
4. **Saves migrate silently.** Nothing is removed or refunded. Old horns get a seed and keep their stats.
5. One version bump and one CHANGELOG entry per phase, plus the in-game "What's new" (see 1.5.0 for the format).

## Scope

Done already: **1.5.1 Sinking Stone multiplier** (1x to 10x, default 2x), shipped on this branch.

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

Flow:
1. When the horn timer expires, the chip pulses. Opening the **Sounding** screen **spins rarity first** (existing odds and pity unchanged).
2. **One minigame per stat line.** A horn with 1 stat gives 1 minigame, 2 stats gives 2, and so on up to the line count for its rarity (Branching's extra stat adds one more). Each is short (about 4 to 6 s), and the performance of each sets that stat's roll within the rarity.
3. The average performance across the minigames also sets the chance of an extra horn.
4. Horn upgrades scale it: Keen Ear shortens the wait and widens timing windows, Whetstone raises the ceiling, Branching adds a stat (and so a minigame), Rack adds a pick slot.

EV neutrality:
- Performance maps to a stat multiplier in **0.6 to 1.5**, with the mean set to 1.0 for a typical player.
- **Auto-resolve** (a setting, and automatic after N minutes away) takes performance = the mean for every line. A "finish with auto" button skips the remaining lines mid-sounding. This is the sim bot's path.
- A sounding that expires while you're away waits in the Sounding screen with no loss. Several can queue, up to a cap.

Sim impact: the bot uses auto. Add an assertion that horn stat totals match the old averages over many seeded rolls.

## Phase 4: Floor identities, Golden Floor and biomes (1.9.0)

**Floor identities.** Rolled on arrival (from depth ~3), shown in the Descend chip and the cave header, stored as `S.floorId`. Examples: *Echoing* (shards x2, hum x0.85), *Glowworm bloom* (lumen x1.6, shards x0.8), *Cracked* (more fossil veins, slower decay), *Still* (steady, no modifiers). Each table averages 1.0 on income so the finish time doesn't move. They sit alongside the existing descent surprises (rubble, vein, double fall). The Chronicle records the identities you've met.

**Golden Floor** (name is a placeholder; alternatives: *Sunvein*, *Gilded Hollow*, *Aurelian Floor*). A rare floor that can replace the normal roll on arrival.
- **Chance:** 5% by default. Each Golden Horn you own adds +2%, capped at 15% from that source. A successful Risky Descent adds a flat +10% to that one roll (so up to 25% at most).
- **On a Golden Floor:** decay is 25% slower (decay rate x0.75), fossil gain from that floor is +25%, and horn soundings produce **Golden Horns**.
- **Golden-only upgrades.** A small set of upgrades that can only be bought while you are standing on a Golden Floor. Levels persist afterwards. (My reading of "can only be upgraded once you get there"; see open questions.)
- **Golden Horns:** the minigame result gets a further x1.25 on top, plus a distinct look (gold material, glow, particles) and their own Collection entries. Each one you own adds +2% to the Golden Floor chance, so a collection of 5 reaches the 15% cap.
- Heartstone: the Golden Floor chance and the owned Golden Horns carry over, since horns are kept.

Pacing: this is a real bonus, so the sim must model it. At 5% chance with +25% fossils and 25% slower decay the average gain is small, but it grows with the cap and with Risky Descents. I'll measure it and report before shipping. Offsets, if wanted, are a lower base chance or a smaller fossil bonus.

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

## Decisions so far

- Last gate on a failed Risky Descent: depth - 1. Confirmed.
- Horn minigame: one minigame per stat line. Confirmed.
- Golden Floor: 5% base, +2% per Golden Horn up to 15%, +10% flat on a successful Risky Descent. Confirmed.

## Open questions (defaults in brackets)

1. **Golden Floor upgrades:** [a small set of Golden-only upgrades, bought only while on a Golden Floor, levels kept]. Or did you mean the floor itself levels up?
2. **Golden Horns counted:** [owned, including unequipped, so the 15% cap takes 5 horns]. If only equipped horns count, the cap is out of reach with 1 to 3 slots.
3. **Does the 15% cap include Risky Descent's +10%?** [No: the cap applies to base + horns, and Risky adds on top, up to 25%.]
4. **Golden horn rate on a Golden Floor:** [every horn sounded there is golden]. Or a chance per sounding.
5. **Session goals reset:** [local midnight].
6. **Phase order:** [as above]. Phases 1 and 2 are independent.
