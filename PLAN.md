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
| Saves | `src/saves.js`: `serializeState`, `restoreState`, compatibility migration |
| Horn rules | `src/horns.js`: rarity odds, rolling, trait effects, rack rules, difficulty |
| Progression resets | `src/progression.js`: descent/sounding/Heartstone resets, decay/Gilt rules |
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

Completed: extracted markup, styles, JavaScript, and independent state factories; save serialization/restoration/migration (`src/saves.js`); horn rules (`src/horns.js`); and progression reset/decay rules (`src/progression.js`). The simulation loads the real modules over HTTP through an opt-in interface. The module extraction preserves level-zero gameplay and seeded draw order; new horn progression is an intentional gameplay change in 1.9.2.

Module boundary status:

1. **Done:** save serialization and migration are separate from DOM updates. Storage keys, backups, and existing save compatibility are retained.
2. **Done:** horn generation, rarity odds, bonuses, traits, and rack rules take explicit state inputs. Descent/sounding rewards and thresholds, Heartstone eligibility and resets, plus decay/Gilt rules are independent of presentation. Runtime code orchestrates the outcomes and presents them. Seeded random draw order at level zero is preserved.
3. **Remaining:** move canvas rendering, audio, and UI into modules after their dependencies are explicit. Avoid shared global variables or generic event plumbing just to split files.

Static hosting stays build-free. A bundled single-file release can be added separately if needed; it is not required for development.

### QOL and balance backlog

Requested after the first file-layout refactor. Completed entries record delivered features; unchecked entries remain planned. The save/horn/reset module boundaries are established. The user prioritized the horn rarity/Primordial pass next; remaining controls and balance changes will follow in small, independently validated changes.

- [x] **Auto-equip horns (1.9.4).** Optional saved Inventory control with Balanced, Cave, and Sea priorities. Scores whole loadouts using effective stats, caps, and trait interactions, fills both racks independently, and improves by deterministic swaps. Balanced weights both worlds equally; rarity alone does not determine value. Preserves worn choices on ties. Runs on new finds, horn upgrades, manual salvage, settings changes, and reload. At full capacity, a newly equipped upgrade replaces the weakest unprotected spare; Gilded spares require a matching enabled salvage permission. If all spares are protected, salvage the incoming horn. Manual equip controls return when automation is off.
- [x] **Automatic horn salvage by rarity (1.9.4).** Individual saved rarity selections apply only to newly found spare horns, after loadout selection. Keep equipped horns and require separate Gilded permission. Enabling a filter never sweeps existing inventory. Discovery and salvage rewards remain additive. Primordial selection stays hidden until the rarity upgrade is maxed. Defaults off and persists through all resets and reloads.
- [x] **Ivory income and Ivory Echo (1.9.3).** Salvage pays **3 / 10 / 35 / 75 / 250 / 500** for Common / Rare / Epic / Legendary / Mythic / Primordial. Every newly found horn grants **5 ivory**, whether kept or salvaged, from all sources including manual/auto soundings, extra horns, purchased calls, and progression rewards. **Ivory Echo** is one upgrade in the Horns section: five levels add 5 ivory each (5 → 30 per horn), at initial costs 25 / 50 / 100 / 200 / 400 ivory. Keep upgrade prices for Rarity Weaving and Primordial unchanged for the isolated income comparison. Grants happen once when a horn is created, never on reload/equip/inspection/salvage or retroactively for old horns; discovery and salvage both count toward lifetime ivory. The upgrade persists through descents and Heartstones. Costs and natural unlock timing remain open to playtest tuning.
- [x] **Horn rarity-curve upgrade.** Add a persistent horn upgrade that progressively shifts the rarity distribution upward. At level zero, keep today's base odds: Common 58%, Rare 27%, Epic 10%, Legendary 4%, Mythic 1%. At max level, target **Mythic around 15%**, **Common in single digits**, and most rolls spread across **Rare, Epic, and Legendary**. Implemented first-pass endpoint: Common 5%, Rare 25%, Epic 30%, Legendary 25%, Mythic 15%. Ten levels linearly interpolate from the original odds; prices are `ceil(25 * 1.65^level)` ivory (5,720 total). Prices remain open to tuning. Show current and next-level odds in the upgrade UI and use the same distribution for the Sounding odds display and actual rolls. Preserve the Epic-or-better pity guarantee; distinguish base odds from pity-adjusted outcomes. Measure the intentional progression speedup across several seeds.
- [x] **Unlockable horn tier above Mythic.** Add one additional rarity, gated behind an explicit unlock, with a **special trait** beyond normal stat scaling. The tier and its unlock upgrade must stay completely hidden until the horn rarity-curve upgrade is maxed: no odds row, Collection silhouette, filter entry, or shop teaser before then. Maxing the rarity upgrade reveals a separate purchase that unlocks drops; reveal and purchase are distinct. The tier is **Primordial**. Awaken the First Voice costs 2,500 ivory and enables a 2% drop chance, taken from Epic (30% to 28%). These are initial tuning values. Keep Mythic around 15% and Common in single digits at max rarity upgrade after the new tier unlocks; allocate the new tier's probability explicitly and normalize the full distribution to 100%. Before unlock, its drop chance is zero. This rarity is separate from the existing Gilded modifier. Traits are included in simulator loadout scoring, inspect/equip UI, Collection, filters, and simulation. The in-game auto-equip/auto-salvage controls support the new tier. Migrate saves without changing existing horns and keep the upgrade/unlock persistent through descents and Heartstones.
- [x] **Dedicated Primordial slots.** Unlocking Primordial horns grants **two dedicated equip slots**, separate from the normal horn rack. Primordial horns use these slots only; normal horns cannot occupy them. First Voice Rack is a one-time 4,000 ivory upgrade adding a third slot; these are initial tuning values. Keep the slots and their upgrade hidden until the rarity-curve upgrade is maxed, and enable equipping only after the Primordial unlock purchase. Include the separate capacity and trait interactions in auto-equip scoring, UI, saves, and simulation. Preserve equipped Primordials and slot upgrades through descents and Heartstones.
- [x] **Primordial sounding and trait quality.** Primordial minigames are harder and slightly longer than ordinary horn minigames. Keep the per-stat-line sounding flow, with average overall performance giving the trait's base effect, poor performance reducing its percentage, and stronger performance increasing it continuously. Very strong overall performance additionally lets the player choose the trait; below that threshold, assign a random trait. Initial tuning: a 6–8 second lead-in per line, 35% narrower timing windows and a 10% faster needle, a trait multiplier of `0.5 + averagePerformance` (performance from 0 to 1), and trait choice at >=0.9. There is no miss timer. These values remain open to playtest tuning. Example for a base 10% trait: 0 performance gives 5%, 0.5 gives 10%, and 1 gives 15%, with continuous values between. Implemented base traits: Deep Memory (10% slower floor freshness decay), Resonance (other equipped horns' stat bonuses +10%), Golden Echo (Sunvein arrival Gilt +25%), and Undertow (tide production +15%). Duplicate traits use the strongest equipped copy; Resonance must not recursively amplify trait effects. Auto-resolve gives average stat and trait strength with a random trait. Away time cannot lower performance; persist unfinished soundings and pending trait choices across save/load, and keep auto-finish available. Persist each horn's chosen trait and quality rather than recalculating them on equip. Validate performance scaling, trait-choice eligibility, separate slot capacity, save compatibility, and the combined pacing effect.
- [ ] **Shorter Sunless Sea waits.** Investigate the reported ten-minute timer and reduce the wait as cave descent waits improve. Current `sound()` and the sea HUD do not impose a timed settling lock: sea progress is gated by `soundAt()` and tide earned. Identify the actual wait before choosing a timer or threshold change; do not add a new cooldown. Cover early and later soundings in pacing checks.
- [ ] **Undersong fathom cost.** Increase the offering from its current **25 fathoms**, which is negligible beside the supplied example's 15.3K balance. Choose the replacement cost using late-game earning rates and simulation; no replacement amount has been specified yet.
- [ ] **Undersong sea requirement: 25 soundings.** Raise "Sound the depths" from **6 to 25**; this is a progression count, separate from the offering's fathom cost. Update the UI and bot's sounding limit (currently defaults to 6), and check the effect of exponentially increasing sounding thresholds. Keep already-completed finales completed.
- [ ] **Open the Ceiling cap and prices.** Cap at **level 15** and increase the level-scaled prices. Currently it has no explicit cap and costs `ceil(500 * 3^level)` tide. Specify the new cost curve and a migration policy for existing levels above 15 (the supplied save shows level 22), preserving the player's investment rather than silently deleting it.
- [x] **Sunless Sea canvas Fuse/Crush controls (1.9.5).** Canvas zones accept bells in the sea, crystals in the cave, and no other objects. Fuse joins any eligible same-tier twin, stops at Abyssal/Moonstone, and restores position when no twin exists. Crush removes only the dragged object without refund. Cave zones retain the first-descent gate; Sea zones are available once the sea is unlocked. Desktop/mobile pointer checks cover successful merges, absent twins, top tiers, removal, and protected oysters/pearl works.
- [x] **Complete cave upgrade automation (1.9.5).** Audited every manually purchasable cave upgrade: voices, tuning, attunement, Strata, Glow, wonders, and any remaining shop categories. Existing `Patient Hands`, `Crystal Seeker`, and `Sinking Stone` only automate crystal fusion, crystal purchases, and descents. Patient Choir in Strata automates all nine cave shop categories, available after **two Heartstones** as a persistent unlock costing **100,000 fathoms**. All categories default off. Per-category controls and numeric reserves for hum/shards/fossils/lumen/ivory/Gilt keep spending under player control. One affordable purchase per enabled category every half-second uses the existing manual purchase rules. Horn calls are excluded; owned automation toggles are not changed. It runs only in the active cave, survives all resets/reloads, and makes existing Crystal Seeker honor the hum reserve. This in-game feature is separate from the simulator's automatic shopping.

Completed first: horn rarity-curve upgrade and Primordial tier, as prioritized by the user. Horn inventory controls are now complete (1.9.4). The user will manually test pacing and sounding feel before further tuning. Sea canvas controls and broader cave automation are complete (1.9.5), along with the live horn countdown fix. Remaining delivery order: a coordinated sea/Undersong/Open the Ceiling balance pass after manual playtest feedback. Measure each balance change separately before combining them.

The requested balance changes intentionally revise the earlier unchanged-duration goal. Report their effect on finish time rather than treating every pacing difference as a refactor regression. Refactor-only changes still require unchanged behavior. Preserve saves, test automation persistence through descents and Heartstones, and run representative cave/sea browser checks plus multi-seed pacing comparisons.

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

## Horn first-pass validation (1.9.2)

All five refactor-only seeds match original finish times and progression marks exactly. Desktop/mobile legacy and horn integration checks pass. With the rarity upgrade and Primordial rack fully unlocked from the start, mean finish time is 3.572h versus 3.754h baseline (about 4.9% shorter); this is a diagnostic scenario, not natural unlock timing. The default shopping bot only reaches rarity levels 0–1 before finale readiness, so prices and natural unlock timing remain playtest targets. See `tools/sim/horn-first-pass.md` for exact results and methods.

## Ivory income validation (1.9.3)

Eight rule tests and desktop/mobile checks pass, including base/upgraded rewards, full inventory paying discovery plus salvage, once-only payouts, legacy migration, and reset persistence. Across five natural-purchasing seeds, the bot reaches rarity levels **5–7** instead of **0–1**, and Ivory Echo levels 4–5. Mean finish time is **3.766h versus 3.754h (+0.3%)**; individual seeds vary. It still does not unlock Primordial before the finale, so natural unlock timing remains a playtest target. See `tools/sim/ivory-income.md` for exact results.

## QOL validation (1.9.5)

17 rule tests and all desktop/mobile checks pass. Five seeded default-pacing comparisons against merged 1.9.4 match exactly in finish times, progression marks, purchases, rewards, and final horn upgrades. The new automation is locked/off in these comparisons; its optional speedup remains a manual playtest question. See `tools/sim/qol.md` for coverage and exact results.

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
