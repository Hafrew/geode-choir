# Plan: progression, rewards, and less repetition

Goal: make cave and Sea progression more engaging, with persistent equipment and controlled automation. The requested Sea gates, cooldown, and harsher fathom rewards intentionally change pacing; their combined effect must be measured.

Status: gameplay through **1.9.5** is shipped. The Sea/seashell balance pass below and the descent minigame are **planned**, not implemented. This document integrates the latest requests and supersedes older conflicting timing/balance proposals. The user explicitly relaxed the old no-Sea-cooldown and unchanged-completion-time restrictions; this does not confirm the draft timer durations or reward exponent.

## Ground rules

1. **Separate refactors from balance changes.** Refactor-only changes must preserve seeded outcomes and finish times (±2% over several seeds). Intentional changes—including horn progression, seashells, Sea requirements/timers, fathom rewards, Sunvein, and purchase automation—must report their effect rather than satisfy an unchanged-duration target. Auto uses the documented baseline/average outcome for that mechanic, not an invented guarantee of the old full-game duration.
2. **Failure costs bonus, not progress**, except the explicitly opt-in Risky Descent. Failed shell discovery consumes no additional payment and grants no shell.
3. **No attention penalties.** Minigames have Auto/finish options, save their pending results, and never fail because the tab was backgrounded. Settling timers advance in both worlds and through the existing offline-rate policy; minigame lead-ins and cooldown work are separate clocks.
4. **Preserve earned saves.** Keep currencies, lifetime counters, items, completed finales, and purchased upgrades. Back up before migration. Do not reroll rewards on reload, grant retroactive shells, or silently delete legacy levels above a new cap. Specify migration for newly increased requirements before implementation.
5. One version bump, CHANGELOG entry, and in-game What's new per delivered gameplay release. Versions for unfinished phases remain tentative; a planning-only change does not bump the game version.

## Scope

Delivered: Sinking Stone controls, status strip and lifetime stats, horn inventory/Collection and minigame, floor identities/Sunvein/biomes, Rarity Weaving and Primordial traits/slots, Ivory Echo, horn auto-equip/salvage, live Sounding countdown, Sea Fuse/Crush, and Patient Choir cave automation (through 1.9.5).

In: seashell equipment and discovery minigame, higher Heartstone/Undersong Sea gates, Sea settling timer, harsher fathom rewards, optional Pearlbright Sea; top status strip, hover lifetime/max stats, Horns tab rebuild, procedural then 3D horns, horn minigame, descent minigame with Risky Descent, floor identities, biomes, Chronicle drip, offline return report, horn sets, session goals, horn/bell music.

Out (by request): choose-1-of-3 on arrival, rhythm shouts, cave events, crystal resonance puzzles, settling mini-tasks.

## Code map

| Area | Where |
|---|---|
| Saves | `src/saves.js`: `serializeState`, `restoreState`, compatibility migration |
| Horn rules | `src/horns.js`: rarity odds, rolling, trait effects, rack rules, difficulty |
| Progression resets | `src/progression.js`: descent/sounding/Heartstone resets, decay/Gilt rules |
| State defaults | `src/state.js`: `createState(version)`, `freshCave`, `freshSea`, `freshStats` |
| Runtime state and saves | `src/main.js`: `S`, `serialize`, `load`, `grantAway`; migration in `src/saves.js` |
| Horns | `src/main.js`: `gainHorn`, `renderHorns`, `hornBoost`, `buildShop`; panel markup in `index.html` |
| Descent | `src/main.js`: `descend`, `descentLock`, `tickRate`, `checkQuests` |
| Heartstone | `src/main.js`: `kindle`, `canKindle`; pure requirements in `src/progression.js` |
| Cave purchase automation | `src/automation.js`: categories, reserves, normalization, `runCaveShopping`; game shop rules supplied by `src/main.js` |
| Seashells / Sea cooldown | Planned modules/state; do not add another independent requirement formula to UI or bot |
| Tabs | markup in `index.html`; `src/main.js`: `setTab` |
| Chronicle | `src/main.js`: `renderChronicle` |
| Styles | `styles.css` |
| Sim | `tools/sim/{bot,run}.js`, Playwright + seeded `Math.random`; `window.__geodeSimulation` is supplied only by the runner |
| Browser checks | `tools/{smoke,horns-smoke,horn-inventory-smoke,qol-smoke}.js`; ephemeral HTTP serving in `tools/serve.js` |

The Descend and Heartstone panels live in status-strip popovers in `index.html`.

### File layout refactor (in progress, before Phase 5)

Completed: cave purchase automation rules (`src/automation.js`); extracted markup, styles, JavaScript, and independent state factories; save serialization/restoration/migration (`src/saves.js`); horn rules (`src/horns.js`); and progression reset/decay rules (`src/progression.js`). The simulation loads the real modules over HTTP through an opt-in interface. The module extraction preserves level-zero gameplay and seeded draw order; new horn progression is an intentional gameplay change in 1.9.2.

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
- [ ] **Sea settling timer and tide thresholds.** Latest request supersedes the earlier instruction against a cooldown. Add a cave-style Sea lock while retuning the exponential tide requirement for 20–25 soundings. Canonical rules and draft numbers are in the Sea/seashell pass below.
- [ ] **Undersong fathom cost.** Raise the current 25-fathom offering only after validating the harsher reward curve and competing Deep/shell/Patient Choir purchases. Price remains open; do not infer it from one large saved balance. Keep the 25-sounding count separate from this offering.
- [ ] **Undersong sea requirement: 25 soundings.** Require 25 actual cumulative soundings; shells do not reduce this finale requirement. Retain the current three-Heartstone and 20-feat requirements. Replace the bot’s six-sounding stop with dynamic targets and preserve completed finales.
- [ ] **Open the Ceiling cap and prices.** Limit new purchases to level 15 and raise level-scaled prices after the Sea curve comparison. Preserve existing levels/bonuses above 15 (including the supplied level-22 save), mark them as legacy, and prevent further purchases. Price curve remains open; cap plus harsher fathoms plus new tide gates must be tested together.
- [x] **Sunless Sea canvas Fuse/Crush controls (1.9.5).** Canvas zones accept bells in the sea, crystals in the cave, and no other objects. Fuse joins any eligible same-tier twin, stops at Abyssal/Moonstone, and restores position when no twin exists. Crush removes only the dragged object without refund. Cave zones retain the first-descent gate; Sea zones are available once the sea is unlocked. Desktop/mobile pointer checks cover successful merges, absent twins, top tiers, removal, and protected oysters/pearl works.
- [x] **Complete cave upgrade automation (1.9.5).** Audited every manually purchasable cave upgrade: voices, tuning, attunement, Strata, Glow, wonders, and any remaining shop categories. Existing `Patient Hands`, `Crystal Seeker`, and `Sinking Stone` only automate crystal fusion, crystal purchases, and descents. Patient Choir in Strata automates all nine cave shop categories, available after **two Heartstones** as a persistent unlock costing **100,000 fathoms**. All categories default off. Per-category controls and numeric reserves for hum/shards/fossils/lumen/ivory/Gilt keep spending under player control. One affordable purchase per enabled category every half-second uses the existing manual purchase rules. Horn calls are excluded; owned automation toggles are not changed. It runs only in the active cave, survives all resets/reloads, and makes existing Crystal Seeker honor the hum reserve. This in-game feature is separate from the simulator's automatic shopping.

Completed first: horn rarity-curve upgrade and Primordial tier, as prioritized by the user. Horn inventory controls are now complete (1.9.4). The user will manually test pacing and sounding feel before further tuning. Sea canvas controls and broader cave automation are complete (1.9.5), along with the live horn countdown fix. Remaining delivery order: the Sea/seashell pass below, then the descent minigame/Risky Descent, then remaining story/cosmetic/music/3D work. Preserve manual horn playtest feedback as a separate tuning input. Measure each balance component separately and then the combined pass.

The requested balance changes intentionally revise the earlier unchanged-duration goal. Report their effect on finish time rather than treating every pacing difference as a refactor regression. Refactor-only changes still require unchanged behavior. Preserve saves, test automation persistence through descents and Heartstones, and run representative cave/sea browser checks plus multi-seed pacing comparisons.


## Sea, seashells, and Heartstone balance pass (planned)

The requested direction is confirmed; formulas labelled **draft** and prices/difficulty not specified by the user still need pacing validation. The earlier shell proposal that made sounding reductions depend on performance is superseded.

### Seashell rules

| Rarity (conditional on finding a shell) | Depth reduction | Fixed sounding reduction |
|---|---:|---:|
| Common · 75% | 1 | **0** |
| Epic · 20% | 2–4, based on minigame performance | **1** |
| Mythic · 5% | 5–10, based on minigame performance | **3** |

- Only a successfully completed **Sunless Sea sounding** triggers discovery. A cosmetic spinner shows the already-determined result: **80% no shell / 20% shell**, upgradeable with fathoms to **50% / 50%**. The rarity roll happens only on success. Base per-sounding probabilities are therefore 80% none / 15% Common / 4% Epic / 1% Mythic; at max discovery, 50% none / 37.5% Common / 10% Epic / 2.5% Mythic.
- First-pass depth scoring: quality `q` in [0,1]; Epic `2 + round(2*q)`, Mythic `5 + round(5*q)`. Common stays 1. Auto uses `q=0.5`, giving Common/Epic/Mythic **1/3/8 depth**, with **0/1/3 soundings**. Average-auto outcomes are explicit; integer rounding does not imply a uniform manual-quality distribution has the same expectation.
- Sounding reductions depend only on rarity. Minigame quality, discovery upgrades, equipment upgrades, horns/Whetstone/Resonance, and a special Sea layer cannot change either reduction beyond its listed range. Save the final integer depth reduction on the item; equipping/reloading never recalculates it.
- One dedicated equipped shell slot, with a permanent fathom purchase for a second. Equipped reductions add; owning spare shells grants no reduction. Two perfect Mythics can reduce depth by **20** and soundings by **6**, and can never go further. Slot/discovery upgrade prices and discovery level count remain open. Upgrades affect slots or chance only, never item potency.
- Shells, equipped IDs, discovery/slot upgrades, and unfinished shell minigames persist through Sea soundings, cave descents, Heartstones, and saves. Keep inventory separate from the 30-horn cap and both horn racks. Allow two distinct shells with identical values to occupy both slots; duplicate rarity does not disable their reductions. Inventory capacity, duplicate handling, and Collection presentation remain open before implementation.
- Do not make the minigame block further progression: a successful sounding grants its normal rewards and starts the next settling lock at once; its shell can wait to be played or finished with Auto. Save the discovery/rarity outcome once, associate it with that sounding, and persist pending work. Completing it cannot grant another sounding, horn, fathom payout, or discovery spin. No timeout penalty or reroll on reload. Minigame shape and difficulty remain open.

### Heartstone and finale requirements

Let `h` be Heartstones already kindled, `D` the sum of equipped depth reductions, and `R` the sum of equipped fixed sounding reductions. These are eligibility discounts only: never alter actual cave depth, Sea sounding count, fossils, tide multipliers, feats, unlocks, or rewards.

- Existing depth baseline stays `12 + 22*h + omenDepth`; planned requirement is `max(1, baseline - D)`.
- **Draft sounding baseline:** 0 before the first Heartstone; otherwise `20 + 4*(h-1)`, giving **20 / 24 / 28 / …** for the second / third / fourth Heartstone. Planned effective requirement is 0 at `h=0`, otherwise `max(1, baseline - R)`.
- Use the existing **cumulative, persistent Sea sounding count**. These are total milestones, not 20 new soundings after every Heartstone. The first Heartstone still opens the Sea, so it cannot ask for a shell or a Sea sounding.
- Lumen costs are unchanged by shells. Use one pure requirement calculation for `canKindle`, the Heartstone panel, chip, action labels, and bot. Recompute immediately on equip/unequip and at the actual kindle action; shell changes never subtract already-earned progression.
- Example, ignoring omen depth: before the second Heartstone, an average Epic plus average Mythic lowers depth **34 − 11 = 23** and soundings **20 − 4 = 16**. Before the third, the same pair gives depth **56 − 11 = 45** and soundings **24 − 4 = 20**.
- Undersong still needs **three Heartstones, 20 feats, and 25 actual cumulative soundings**, plus the separately tuned fathom offering. Shell discounts affect Heartstones only. This keeps finale progression beyond the discounted third-Heartstone gate rather than letting shells erase the finale milestone.

### Sea settling and tide curve

- Add a distinct persistent Sea cooldown, separate from cave `S.cool`. Successful sounding resets the Sea run, awards the normal horn/fathoms, resolves one shell discovery, and starts the next Sea settling lock. First Sea unlock has **no inherited cooldown**. Failed/locked action attempts do none of these.
- **Draft timer:** 600 work-seconds, reduced by 120 for each Sea milestone at **2 / 5 / 10 / 20 actual soundings**, with a 120-work-second floor. Milestones persist and depend on actual counts, not shell-discounted requirements. They can all unlock before needing another Heartstone, avoiding a circular shortcut dependency. These milestone numbers are proposed tuning, not a user-specified requirement.
- Existing Faster Tick speeds remaining Sea cooldown work through the shared `tickRate()`; it does not also shorten the stored base duration. Progress ticks in either world and with the existing offline efficiency. Preserve the remaining Sea lock across Heartstones, rather than resetting it to zero or restarting a full lock. Do not replay elapsed soundings/rewards while away.
- A sounding needs both enough tide **and** an expired lock. Use the same eligibility predicate for button, chip, manual/automatic actions, and bot. Show live countdown/remaining tide; estimated real seconds are `remainingWork / tickRate`, with the lock's original work duration retained for progress display.
- Current source uses threshold `50,000 * 4^n` and permanent Sea tide multiplier `1.6^n`. The effective gap grows about **2.5× per sounding**, before other income effects. The 20th sounding currently requires about **1.3744e16 tide** (at `n=19`). Keeping this curve while demanding 20–25 soundings, adding a lock, and capping Open the Ceiling would compound three barriers.
- Retune the tide threshold independently of the harsher fathom reward. Choose the new curve against actual income, cave/Sea time share, Choir, Deep Current, shells, and the level-15 Ceiling cap. A lower tide requirement supports more distinct Sea stages; a lower fathom overrun exponent limits camping windfalls. No replacement threshold curve is fixed yet.
- Clock-budget check at `tickRate=1`, excluding tide wait/offline effects: plain ten-minute locks after each sounding require **190 minutes to reach 20** and **240 to reach 25**, since the first sounding is unlocked. The draft milestones lower these timer-only floors to **104 / 114 minutes**. Shells reduce a Heartstone milestone, not these cooldowns or the 25-sounding finale. Validate whether these floors fit the desired full-game pace before fixing difficulty/prices.

### Harsher fathom reward curve (requested balance fix)

- Current reward: `floor(2 * (1 + 0.5*n) * max(1, r)^0.3662 * 1.25^PlumbLine * hornFathomBonus)`, for completed run ratio `r = tideRun / tideThreshold >= 1`. Below threshold, payout remains zero.
- **First-pass proposal:** change only the **fathom** overrun exponent from **0.3662 to 0.25**. Keep the per-sounding base, Plumb Line, and horn multiplier for the first isolated comparison. Fossil rewards retain their own 0.3662 curve; split the shared helper so a Sea nerf cannot silently change cave rewards.
- Before rounding and with the same modifiers: at `r=1`, payout is unchanged; at `r=10`, the overrun multiplier falls **2.324 → 1.778 (−23.5%)**; at `r=100`, **5.400 → 3.162 (−41.4%)**; at `r=10,000`, **29.161 → 10 (−65.7%)**; at `r=1e8`, **850.354 → 100 (−88.2%)**. The exponent is a concrete harsher candidate, not a claim of validated pacing.
- Rewards must remain nonnegative, monotonic with tide earned, and at least the threshold payout on an eligible sounding. Preserve existing fathom balances and lifetime totals; apply the new curve to future rewards only.
- The settling lock may force large overrun ratios while the player waits. Measure fathoms per real hour and per sounding, rather than declaring the nerf effective from exponent math alone. Plumb Line's uncapped `1.25^level` multiplier can still offset the nerf; audit its purchase loop without silently changing its curve in the isolated exponent comparison.
- Fathoms fund Deep upgrades, shell discovery/slot upgrades, Patient Choir (**100,000**, an existing user-specified price), and Undersong. Resolve their affordability together. Do not reduce Patient Choir's price to hide a pacing failure; classify whether its unlock is intended before or after the finale. New shell prices and the increased offering remain open until this check.

### Pearlbright Sea (optional draft)

A special Sea layer was discussed, but its chance, reward multiplier, and implementation are not confirmed. Keep it optional for the first shell pass. Suggested direction: a rare arrival layer with a bounded fathom bonus and pearlescent artwork, while shells retain the three rarities, the 20%→50% discovery bounds, and fixed 0/1/3 sounding reductions. A rarity/material buff must not become an implicit item-potency upgrade.

If introduced, the layer on the **departing** Sea determines that sounding's bonus; roll the next layer afterward and save it. Do not apply the arriving layer retroactively to the payout that rolled it, reward a visit twice, or alter the current floor from repeatedly loading. Validate separately because a fathom bonus may counteract the requested harsher reward curve. Chance/multiplier remain open.

### Migration and delivery

- Legacy saves start with no shells and no retrospective discovery rewards, while retaining all existing Sea counts, currencies, upgrades, horns, and finales. Introduce the new Sea cooldown at zero on migration. Preserve legacy Open the Ceiling levels/bonuses above 15; only new purchases are capped.
- **Draft fairness policy:** if the old Sea prerequisite for the current pending Heartstone was already met, keep a one-use legacy requirement for that Heartstone and switch to the new curve after kindling. Store a requirement exception, not fabricated soundings. Confirm this migration policy before coding increased gates; completed Heartstones/finales stay completed in every case.
- First establish shared shell/Heartstone/sounding rules and save fields; validate the fathom exponent in isolation. Next tune tide thresholds, timers, higher gates, and currency budgets together. Then add discovery/minigame/equipment UI and upgrades, followed by the optional layer. Deliver tested slices; do not ship the higher gate with the old tide curve or the bot's six-sounding cap.
- Shells must be obtainable without buying a fathom-funded upgrade: first Sea entry is unlocked, threshold reward is positive, and base discovery is 20%. Neither shell ownership nor Patient Choir can be a prerequisite to producing the fathoms that purchase their upgrades.
- Extend the bot to use real sounding eligibility, cumulative dynamic targets, average shell completion, and documented shell loadout choices; no granted counts/currencies/unlocks in natural runs. Record shell discovery, first Epic/Mythic, slot/chance upgrades, effective Heartstone gates, timer/tide stalls, Plumb Line levels, Patient Choir affordability, and finale offering reserves.

### Full-plan logic review

| Finding | Resolution / required check |
|---|---|
| Old unchanged-duration rule contradicted deliberate balance requests | Restrict equality checks to refactors/default-off QOL; measure intentional pacing changes |
| Backlog said no new Sea cooldown | Latest request supersedes it; one shared cooldown/eligibility model |
| Shells previously reduced soundings according to performance | Performance affects depth only; sounding reduction fixed at 0/1/3 |
| A first-Heartstone Sea requirement would block unlocking the Sea | First requirement is 0; later counts are cumulative |
| Shell discounts could become free progress/reward farming | Eligibility-only discounts; never change actual depth/counts or grant rewards |
| Raising counts with ×4 thresholds could make the Sea unreachable | Retune thresholds alongside gates/timer/Level-15 Ceiling; verify stages 20–25 |
| A harsher shared reward helper could nerf cave fossils too | Separate fathom exponent from fossil exponent |
| Timer-driven overrun or Plumb Line could erase the fathom nerf | Compare real-hour income, multipliers, and all currency sinks |
| Six-sounding bot / finite old simulator horizon would stall | Dynamic targets; allow horizons beyond 40h if required and report stalls |
| New gates/caps could retroactively damage saves | Explicit legacy migration; preserve counters, paid levels and completed finales |
| Descent failure/freshness rules were underspecified | Resolve below before implementing Risky Descent; never reuse a success reward path on failure |

The dependency logic is consistent with these resolutions. **Pacing is not yet validated**: the tide curve, upgrade/offering prices, timer milestones, legacy-gate policy, and optional layer remain explicit open choices. Do not label the combined design balanced until natural multi-seed runs and manual playtests support it.

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
2. **One minigame per stat line.** A horn with 1 stat gives 1 minigame, 2 stats gives 2, and so on up to the line count for its rarity (Branching's extra stat adds one more). Each has a timing window and no miss deadline; performance sets that stat's roll within the rarity. Primordial notes add the shipped 6–8 second lead-in.
3. The average performance across the minigames also sets the chance of an extra horn.
4. Horn upgrades scale it: Keen Ear shortens the wait and widens timing windows, Whetstone raises the ceiling, Branching adds a stat (and so a minigame), Rack adds a pick slot.

Auto baseline and skill bonus:
- Performance maps to a stat multiplier in **0.5 to 1.5** (`0.5 + performance`), and an average performance of 0.5 is exactly 1.0. The extra-horn chance is `(avg - 0.5) * 0.5`, up to 25%.
- **Auto-resolve** (the saved Sound horns automatically setting) takes performance = 0.5 for every line. Away time does not force-finish a manual pending horn. A "finish with auto" button skips the remaining lines mid-sounding. This is the sim bot's path.
- A sounding that expires while you're away waits in the Sounding screen with no loss. Several can queue, up to a cap.

Sim impact: the bot uses auto. Add an assertion that horn stat totals match the old averages over many seeded rolls.

## Phase 4: Floor identities, Sunvein and biomes (1.9.0, done)

**Floor identities.** Rolled on arrival (from depth ~3), shown in the Descend chip and the cave header, stored as `S.floor`. The shipped `FLOORS` table and normalized modifiers in `src/main.js` are authoritative: Echoing, Hushed, Glowworm Bloom, Cracked, and Still. Each table averages 1.0 on income so the finish time doesn't move. They sit alongside the existing descent surprises (rubble, vein, double fall). The Chronicle records the identities you've met.

**Sunvein** (the Golden Floor; named *Sunvein*). A rare floor that can replace the normal roll on arrival.
- **Chance:** 5% by default. Each Golden Horn you own (equipped or not) adds +2%, capped at 15% from that source. The planned Risky Descent would add a flat +10% to that one roll on top of the cap (25% at most); that minigame is not shipped.
- **On a Golden Floor, base effects:** decay is 25% slower (decay rate x0.75), fossils from that floor get **+10%**, and **50%** of horn soundings there are Golden Horns.
- **Golden upgrades** can only be bought while standing on a Golden Floor, and their levels persist:
  - *Rich Vein:* the fossil bonus rises from +10% to +30%.
  - *Gilded Breath:* the Golden Horn chance rises from 50% to 100%.
- **Golden Horns:** the minigame result gets a further x1.25 on top, plus a distinct look (gold material, glow, particles) and their own Collection entries. Each one you own adds +2% to the Golden Floor chance, so a collection of 5 reaches the 15% cap.
- Heartstone: the Golden Floor chance, Golden upgrades and owned Golden Horns carry over, since horns are kept.

**Golden currency (shipped): Gilt.**
- A new currency that **only accrues while you are on a Golden Floor**, as time-based income: a steady trickle that fades with the floor's freshness, plus a small lump when you arrive. It's never earned on normal floors.
- It is **never reset** by descents or Heartstones, so the Golden upgrades keep their levels and any unspent Gilt keeps too.
- Golden upgrades cost Gilt only. Costs rise with each level, and the whole tree is sized to take about 4 to 6 Golden Floor visits to max. That keeps it a long-tail goal that doesn't need camping on the floor.
- Why time-based and capped per floor: you pick when to leave, so a cap per floor stops "stay forever" from beating "descend and re-roll", which would stretch the game out.
- Shown as a new pill (visible once you've seen a Golden Floor) with the same hover stats (held, lifetime, best per floor).

Pacing: this is a real bonus. The sim will model it and I'll report the speedup before shipping; you've said you're fine with a modest one.

**Biomes.** Every 4 depths, a new look: palette tint, crystal geometry, ambient layer. Purely visual, no effect on the numbers. Heartstone resets the biome to the first. The Golden Floor overrides the biome with a gold tint.

Sim impact: identities change variance, not mean. The Golden Floor changes the mean; test several seeds and the decay interaction.

## Phase 5: Descent minigame and Risky Descent (planned, after Sea pass)

**Standard descent.** Pressing Descend opens a short minigame (a controlled drop, with timing or steering).
- *Clean descent:* you land normally and receive a **bonus** (extra fossils and/or a bounded freshness benefit), scaled by performance up to a cap. A fresh floor already starts at age zero, so model a freshness extension/decay offset explicitly rather than using negative age or income above its defined maximum.
- *Poor performance:* you still descend normally with no bonus. **No penalty.**
- *Auto-descend / Sinking Stone:* the baseline, with no bonus.
- The settling lock and quests are unchanged.

**Risky Descent (opt-in).** A second button.
- Success: a bigger bonus than a clean descent, **and +10% flat to the Golden Floor chance** for that landing.
- Failure: you **fall back to the last gate**, clamped at depth zero. All purchased upgrades and earned balances stay intact. The floor's decay carries over, and the lock is **twice the current base settling work**, with Faster Tick applied once when advancing time. Before implementation, specify placement/floor identity and reset the new floor's run counter so retained old-floor earnings cannot be claimed again. Award no success fossils, horn, shell, or arrival bonus on failure. Any good-performance decay offset needs an explicit cap.
- Tuning: a player who succeeds about 70% of the time should come out modestly ahead, and a poor one behind. The sim models a player at a fixed success rate. The bot's default is to never take the risk.
- Needs a clear confirm dialog showing the exact penalty.

The last gate is the previous depth (depth - 1). Confirmed.

## Phase 6: Story, report, goals, collection, music (planned)

- **Chronicle drip.** Lore lines unlock one at a time over the settling timer. Pure flavor, with a "new page" marker on the Chronicle button.
- **Offline return report.** Extend the existing away report with a short scene showing what happened while away (hum, floors faded, horns waiting, quests completed). Reuses the existing away calculation, with no new rewards.
- **Horn sets.** Complete a set of 3 related designs for a cosmetic or a small flat passive, capped so it can't snowball.
- **Session goals.** Three small goals per day (local date). They pay **cosmetics only**: horn skins, cave tints, strip themes.
- **Music.** Equipped horns and rung bells contribute notes to a procedural song, so a bigger collection sounds fuller. I'll read the existing audio code first and reuse its scale (minor pentatonic) and the Sound on/off setting.

## Phase 7: 3D horns (planned; version undecided)

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

- Compare seeds 1–5 before/after each gameplay slice, recording finish and Heartstone times. Refactors/default-off QOL must match the baseline (±2%); deliberate balance passes must report their changes. Use 40h as an initial horizon, extend it when new gates require more, and distinguish a reachable slow run from a stalled/unreachable prerequisite.
- Add rule checks for shell ranges and fixed sounding reductions, conditional odds, separate slots, once-only rewards, all resets, legacy migration, live eligibility, timer/offline semantics, fossil curve preservation, and monotonic harsher fathom rewards. Compare no shells / average natural shells / two best Mythics, base/max discovery, multiple Sea shares, and automation on/off. Test the combined 20–25-sounding gates, timer, tide curve, Plumb Line, all fathom sinks, and legacy level-22 Ceiling bonus.
- Extend `bot.js` for shell completion/loadouts and real Sea cooldown eligibility, then descent Auto and a `--risk p` option for fixed success rates. Horn auto-resolve already exists. Risky failure must never replay success rewards.
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
| More Sea stages plus cooldown become dead waiting | Retune tide thresholds; compare clock floors and real pacing; timers advance in both worlds |
| Harsher fathoms strand shell upgrades or Patient Choir | Audit per-hour income, Plumb Line, reserves, and competing prices |
| Shells bypass milestones or duplicate rewards | Eligibility-only discounts, fixed rarity values, persisted once-only discovery outcomes |

## Decisions so far

- Seashells primarily reduce Heartstone depth; their sounding reductions are fixed at Common 0 / Epic 1 / Mythic 3. Discovery starts at 20% and caps at 50%; one slot can be upgraded to two. Item potency has no upgrade.
- Raise later Heartstone Sea requirements toward 20 and add a Sea settling timer; exact 20/+4 curve and timer milestones remain drafts. Soundings remain cumulative; first Heartstone has no Sea prerequisite; Undersong targets 25 actual soundings.
- Use a harsher future fathom gain curve; initial isolated candidate exponent 0.25, with cave fossils unchanged.

- Last gate on a failed Risky Descent: depth - 1.
- Horn minigame: one minigame per stat line.
- Golden Floor: 5% base, +2% per Golden Horn owned, 15% cap on that part, +10% flat from a successful Risky Descent on top.
- Golden Floor fossil bonus starts at +10% and upgrades to +30%. Golden Horn chance starts at 50% and upgrades to 100%. Golden upgrades are bought on a Golden Floor only.
- Session goals reset at local midnight (default), phase order as above (default).

## Resolved
- Golden upgrades are paid in **Gilt**, as proposed in Phase 4. *Slow Gold* is dropped: the Golden upgrades are *Rich Vein* and *Gilded Breath* only.
