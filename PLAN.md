# Versioned plan: Geode Choir progression and finale

This replaces the earlier phase-only roadmap and conflicting Sea drafts. It combines the original phases with the added horn, Sea, seashell, and finale passes. Future versions are proposed release slots, not implemented features. A documentation change does not bump the runtime version.

Current release: **1.10.1 beta** on `main`. All gameplay through 1.10.1 is merged (the stacked 1.9.6–1.10.1 branches landed through PR #25). The game is labelled **beta** in the version chip, credits, and page title until the 1.11.0 finale lands and the beta hardening below is done; the label is presentation only, and saves and version checks use the plain version number. Implementation status does not imply deployment. Check merge/deployment status before starting each release.

## Principles

- Refactors preserve seeded behavior and progression (±2% finish-time check). Intentional balance changes report their effect; there is no blanket unchanged-completion-time requirement.
- Every challenge has an accessible Auto/finish path. Poor standard performance loses bonus, never progress. Only explicitly selected Risky Descent can move depth backward.
- Pending challenges persist and never fail because a tab is hidden. Production/settling clocks follow the existing offline policy; interactive challenge clocks pause when inactive.
- Preserve earned balances, items, paid levels, actual counters, and completed finales. Back up before migration. Outcomes and payments are once-only and cannot reroll on reload.
- UI, automation, and simulations use the same rules and purchase functions. No duplicate eligibility or reward formulas.
- Keep static hosting build-free. Extract rules and state boundaries as features need them; do not make a full canvas/audio/UI rewrite a prerequisite.
- Each gameplay release updates the runtime version, CHANGELOG, and What's new, with relevant rule/browser checks. Costs and difficulty marked proposed remain tunable.

## Release map

| Version | Pass | Status / dependency |
|---|---|---|
| 1.5.1 | Sinking Stone multiplier control | Delivered |
| 1.6.0 · original Phase 1 | Status strip, popovers, lifetime/best stats | Delivered |
| 1.7.0 · original Phase 2 | Horn inventory, deterministic SVG visuals, Collection | Delivered |
| 1.8.0 · original Phase 3 | Horn sounding minigame and Auto | Delivered |
| 1.9.0 · original Phase 4 | Floor identities, Sunvein, Gilt, biomes | Delivered |
| 1.9.1–1.9.2 | Module boundaries, rarity upgrade, Primordial traits/slots/sounding | Implemented; historical release details in CHANGELOG |
| 1.9.3 | Ivory income and Ivory Echo | Delivered |
| 1.9.4 | Horn auto-equip and automatic spare salvage | Delivered |
| 1.9.5 | Live horn screen, Sea Fuse/Crush, Patient Choir | Delivered |
| 1.9.6 | Faster Tick scales horn timer and displayed countdowns | Delivered |
| 1.9.7 | Seashell rules/save foundations, isolated harsher fathom curve | Delivered |
| 1.9.8 | Sea settling, cumulative Heartstone gates, tide curve, Ceiling cap, 50k finale offering | Delivered |
| **1.10.0** | Playable seashell discovery, minigame, equipment, purchases | Delivered; manual tuning pending |
| **1.10.1** | Stable 2D shell art in inventory and sounding | Delivered; released as **beta** |
| **1.10.2** | Beta hardening: safe save import, save-failure warning, inventory render cost, test command and CI | **Next pass**; no balance changes |
| **1.10.3** | Auto-buy horns, staged Patient Choir unlocks, longer Heartstone run (4 or 5 Heartstones) | Proposed; needs simulator rerun before numbers are final |
| **1.11.0** | The Last Chorus finale expedition and entry-price tuning | After 1.10.3, using the natural shell-economy results |
| **1.12.0** · original Phase 5 | Standard descent minigame and Risky Descent | Independent of finale; follows the newly approved delivery order |
| **1.13.0** | Pearlbright Sea | Optional release reservation; skip if unconfirmed |
| **1.14.0** · original Phase 6, part 1 | Chronicle drip and richer offline return report | Reuses actual progression and away accounting |
| **1.15.0** · original Phase 6, part 2 | Horn sets and cosmetic session goals | Collection integration; passive rewards remain undecided |
| **1.16.0** · original Phase 6, part 3 | Broader horn/bell procedural music | Reuses finale audio work; respects sound/accessibility settings |
| **1.17.0** · original Phase 7 | Optional 3D horn presentation | SVG fallback, lazy loading, no progression changes |
| Unassigned | Offline horn arrivals capped at five | Discussed proposal; behavior not confirmed, not a prerequisite |
| Ongoing | Split `src/main.js` into modules | Refactor track; no version bump, ±2% parity rule applies |

Versions formerly suggested for original Phases 5–7 are superseded by this table. Optional reserved releases do not block later work and may be omitted without renumbering the other reservations.

## Existing baseline to preserve

### Presentation, floors, and Sunvein

Status chips/popovers and lifetime/best statistics remain available across tabs/worlds, including mobile keyboard/focus handling. Horn visuals use stable saved seeds and Collection identities; migration does not reroll old horns. Existing floor identities and their normalized income modifiers remain authoritative in the runtime tables.

Sunvein arrival chance is 5% plus two percentage points per owned Gilded horn, capped at 15% before a future Risky Descent bonus. Base effects: 25% slower freshness decay, 10% more fossils, and 50% Gilded horn soundings. Rich Vein raises fossils to 30%; Gilded Breath raises Gilded chance to 100%. Gilded stat quality gets ×1.25. Golden upgrades and unspent Gilt persist; Gilt accrues on Sunvein with freshness-based income and a bounded arrival grant. Biomes change visually every four depths; Sunvein overrides the appearance. No new golden currency or alternative fossil-funded shop is planned.

### Horn progression and automation

- Rarity Weaving: ten levels, odds interpolate from **58/27/10/4/1** to **5/25/30/25/15** for Common/Rare/Epic/Legendary/Mythic. Prices `ceil(25 * 1.65^level)`, 5,720 ivory total. Display current/next odds; retain Epic-or-better pity separately from base odds.
- Max Weaving reveals Awaken the First Voice; before max, Primordial has no shop teaser, odds row, filter, or Collection entry. The separate **2,500-ivory** unlock gives 2% Primordial, taking Epic from 30% to 28%.
- Primordials use two dedicated slots; **4,000 ivory** adds a third. They have Mythic-strength stats plus Deep Memory (10% slower freshness decay), Resonance (other horns' stats +10%), Golden Echo (Sunvein arrival Gilt +25%), or Undertow (tide +15%). Strongest duplicate trait wins; Resonance cannot recursively amplify traits.
- Primordial sounding has 6–8-second lead-ins, narrower/faster timing, trait strength `0.5 + quality` (50%–150%), and trait choice at quality ≥0.9. Auto gives quality 0.5 and a random trait. No miss deadline.
- Horn discoveries give **5 ivory**, including kept/salvaged horns. Ivory Echo adds 5 per level to 30, costing 25/50/100/200/400. Salvage gives **3/10/35/75/250/500**. Discovery and salvage grants are independently once-only; no retrospective payout.
- Auto-equip supports Balanced/Cave/Sea scoring and independent racks. Automatic salvage applies only to new spares; equipped/Gilded protection stays in force. Inventory cap remains 30 horns.
- Faster Tick advances horn work and scales all displayed horn countdowns consistently. Offline horn arrivals are not implemented by this fix.
- Patient Choir costs **100,000 fathoms** after two Heartstones, supports nine cave purchase categories and currency reserves, defaults off, persists through resets, and operates only in the active cave. No offline shop simulation or automatic horn-call purchase.

### Sea balance implemented in 1.9.8

- Tide threshold: `50,000 * 3^actualSoundings`.
- Sea settling starts at 600 work seconds; completed milestones **2/5/10/20** each remove 120, with a 120-second minimum. Sounding requires both sufficient tide and an expired lock.
- Faster Tick applies once to elapsed work. Timer advances in both worlds and through existing offline efficiency/cap; offline advancement does not itself grant soundings or rewards.
- Fathom ratio bend: `r^0.25` through `r=10,000`; above that, the lower of `r^0.25` and `10 * (1 + log10(r/10,000))`. Keep the existing reward factors and Plumb Line. Cave fossil exponent **0.3662** stays unchanged.
- Heartstone depth: `max(1, 12 + 22*h + omenDepth - equippedShellDepth)`.
- Heartstone sounding baseline: **0 for the first Heartstone**, then **20/24/28/...** cumulative actual soundings. Subtract equipped fixed shell reductions; clamp later requirements to at least one. Discounts affect eligibility only.
- Open the Ceiling: new purchases cap at **15**, cost `ceil(1,500 * 3.5^level)`. Legacy higher levels retain their full bonuses and cannot purchase further.
- Current finale: **25 actual soundings, three Heartstones, 20 feats, 50,000 fathoms**. Shells never discount its actual-sounding requirement.
- Legacy saves start with no new cooldown or retrospective shells. If the old Sea requirement for their pending Heartstone was met, persist that one-use old requirement until kindling, then adopt the new gate. Never fabricate actual soundings.

Five natural no-shell seeds reached finale readiness in **4.609–4.792 hours**, averaging **4.667 hours**, an intentional **31.68%** increase over the comparison baseline. Fathom balances at readiness ranged from **52,183 to 4,147,683**. This is reachable, but not evidence of a uniform economy or balanced shell prices. See [Sea pacing results](tools/sim/sea-pacing.md) and [foundation results](tools/sim/sea-foundations.md).

## 1.10.0 — Playable seashells

### Rules

| Rarity, conditional on discovery | Chance | Depth reduction | Fixed sounding reduction |
|---|---:|---:|---:|
| Common | 75% | 1 | 0 |
| Epic | 20% | 2–4 | 1 |
| Mythic | 5% | 5–10 | 3 |

- A successful actual Sea sounding triggers exactly one discovery decision. Base **20% yes / 80% no**; six discovery upgrades add five percentage points each to **50%**. Rarity is rolled only on success. The spinner presents the saved outcome and cannot reroll it.
- Quality `q` in [0,1]: Epic depth `2 + round(2*q)`, Mythic `5 + round(5*q)`; Common always 1. Auto at q=0.5 gives **1/3/8 depth** and **0/1/3 soundings**. Item potency cannot be upgraded or amplified by horn traits.
- One dedicated equip slot; permanent fathom purchase unlocks a second. Distinct identical shells can both equip. Two perfect Mythics provide at most **20 depth / 6 soundings**. Spare ownership gives no effects.
- Persist items, equipped IDs, upgrades, saved discovery outcomes, and pending quality challenges through all resets/reloads. Completing a shell grants only that item, never another sounding, horn, or fathom payout.
- Normal sounding rewards and the next lock happen immediately; a pending shell challenge does not block production or future soundings. Finish with Auto is always available.

### Delivery and open choices

Implemented in 1.10.0: discovery/result spinner in The Deep, direct Common claim, three timing notes for Epic/Mythic (one-second lead-in, narrower Mythic target), saved partial notes that pause off-screen, Auto, inventory/equipment, and upgrades. Discovery costs **25/50/100/200/400/800 fathoms**; second slot costs **500**. Inventory is uncapped with no forced salvage or duplicate restrictions; Collection integration is deferred. Manual feel and prices remain tuning targets. Natural simulations use actual drops/purchases with a 100k finale reserve; see [playable shell validation](tools/sim/playable-seashells.md).

Original delivery intent: wire existing `src/seashells.js` rules into the real sounding path, then add spinner/minigame, inventory/equip controls, and chance/slot purchases. Minigame shape/difficulty, purchase prices, inventory management, and Collection presentation need a concrete first-pass design. Do not silently reuse the horn cap, impose duplicate restrictions, or invent a salvage currency.

Validate natural discovery and purchases, first Epic/Mythic timing, both slots, effective Heartstone gates, reload/reset behavior, and desktop/mobile interaction. Run the bot using actual drops, Auto quality, real purchase prices, and a **proposed 100,000-fathom finale reserve**. Include Patient Choir and Deep purchases as competing sinks; shell upgrades must be optional to reaching the finale.

## 1.10.2 — Beta hardening

From the post-merge code review of 1.10.1. No balance or progression changes; the seeded parity rule applies.

- **Safe save import (security).** Shared `GC1:` save codes are only checked for a numeric `hum`, and horn/collection names from a save reach `innerHTML` (`title` attributes, Sounding results, Collection cells). A crafted code could inject markup or script into the importing player's page. In `restoreState`, regenerate horn names from their seeds (or accept only a strict name pattern) and coerce `id`/`seed` to integers; add one `esc()` helper for interpolated template HTML. Add a test that imports a hostile name and asserts that it renders as text.
- **Save-failure warning.** `save()` swallows storage errors, so a full or blocked localStorage silently loses progress. Show one toast per session when a save or backup write fails.
- **Inventory render cost.** The UI refreshes every 0.12 s; rebuild horn/shell grids only when their contents change (an inventory revision counter), so large inventories stay smooth on phones. Verify with a several-hundred-horn fixture at 390px.
- **One test command and CI.** Add a `package.json` `test` script that runs the unit tests and every browser smoke suite, and a GitHub Action that runs the unit tests on each PR to `main`. Stacked PRs that merge only into their parent branch (#20–#24) should be caught by a check that their changes reached `main`.
- Optional: one formatting pass (about 150 lines in `main.js` exceed 200 characters), in its own PR so review diffs stay readable.

The beta label is removed when 1.11.0 lands and this hardening is complete.

## Ongoing — `main.js` module split

`src/main.js` holds about 3,800 lines in one closure. Continue the incremental extraction already used for shells, automation, progression, and saves, one reviewable PR each, with the smoke suites as the guard:

1. Changelog data (`CHANGES`) to `src/changes.js`.
2. Horn Sounding minigame and inventory UI (around lines 2280–2640) to a `horn-ui.js`, matching `shell-ui.js`.
3. Save/load, backup, and import/export codes into `saves.js`.
4. Reward and cost formulas (`fossilGain`, `fathomGain`, `heartCost`, and related) into `progression.js`, so tests and the simulator import them directly instead of through `simulation.api`.

Extraction never blocks a feature release, and the canvas/audio rewrite stays out of scope.

## 1.10.3 — Auto-buy horns, staged automation, longer run

Natural runs finish in about **4.25 hours** (3.96–4.85 h, seeds 1–5, see [playable shell validation](tools/sim/playable-seashells.md)). The goal here is a longer game, and automation that has to be earned instead of arriving as one flat unlock.

### Auto-buy horns
- A dedicated rack of up to **3 slots** for **Epic, Legendary, and Mythic** horns, used only to speed up Patient Choir shopping. Slotted horns give **no stat effect** anywhere; their only effect is a shorter shopping interval.
- Slots: **1st** with Patient Choir, **2nd at Heartstone 3**, **3rd at Heartstone 4**. No fathom cost for the slots.
- Interval: base 0.5 s, multiplied per horn (proposed Epic ×0.90, Legendary ×0.80, Mythic ×0.65), with a **0.1 s floor**. Gilded counts one rarity higher.
- A slotted horn cannot also be in the normal or Primordial racks, and auto-salvage and fusing skip it. Ids are validated on load, so a missing or ineligible horn is dropped.
- Offline behavior is unchanged (no offline shopping).

### Staged Patient Choir
Replace the single 100,000-fathom switch that opens all nine categories with a ladder. Costs and gates are **proposed** and must be tuned with the simulator.

| Stage | Opens | Gate | Proposed price |
|---|---|---|---|
| Patient Choir | Voices, Tuning, Crystals | Heartstone 2 | 100,000 fathoms (unchanged) |
| Second Verse | Wonders, Attunement | Heartstone 2 | ~250,000 fathoms |
| Deep Verse | Strata, Illuminations | Heartstone 3 | ~1,000,000 fathoms |
| Final Verse | Horn upgrades, Sunvein upgrades | Heartstone 4 | ~4,000,000 fathoms |

Existing saves that already own Patient Choir keep what they have paid for: their categories open, no refund, no double charge, and the new stages are bought normally.

### Longer run: more Heartstones
- Raise the Heartstone requirement for the finale from **3 to 4 or 5**. **Recommended: 5.** With slots arriving at Heartstones 3 and 4, a target of 4 would hand over the last slot at the moment the finale is one step away; 5 gives the new slots time to matter.
- The finale's actual-sounding requirement (currently 25) is already below the cumulative gate for later Heartstones (20/24/28/32…), so it must be raised with the Heartstone count (about 36 for five Heartstones), or the sounding requirement stops mattering.
- Heartstone cost (`1e7 × 10^h` lumen) and depth (`12 + 22h`) keep growing, so Heartstone 4 and 5 are large steps. The sim decides whether they need easing.
- Goal to measure: a mean natural finish of about **6–8 hours** (proposed), with no seed far outside that range. The 20-feat requirement and the 100,000-fathom entry price are re-checked.
- Existing saves with three or four Heartstones keep them; a completed finale stays completed.

### Validation
Unit tests for the shopping interval and for loading bad ids. Browser smoke checks for slotting, unlocking at Heartstones 3 and 4, staged purchases, old-save migration, and reload. Seeds 1–5 rerun for finish time, with an automation-on and automation-off comparison. The unlock prices and the interval multipliers stay marked proposed until then.

## 1.11.0 — The Last Chorus

Replace immediate first-time finale completion with a **roughly 30-minute interactive expedition** after paying the entry offering. Proposed cost **100,000 fathoms**, subject to 1.10.0 natural-economy checks; current cost remains 50,000 until a gameplay release changes it. No further mandatory payments. Entry retains 25 actual soundings, three Heartstones, and 20 feats.

| Chapter, about six minutes each | Interaction |
|---|---|
| Find the First Voice | Follow musical clues between cave and Sea. |
| Wake the Choir | Answer three horn phrases; equipped horns shape sound and visuals. |
| Cross the Quiet Sea | Choose a steady route, timing challenge, or listening puzzle. |
| Mend the Fracture | Charge two sides of a broken Heartstone across both worlds; align pulses. |
| Sound the Last Chorus | Combine earlier interactions into the final performance and scene. |

- Short interactions every **60–90 seconds**, with ordinary production between them. Reuse horn timing and Sea mechanics; add one pulse-alignment interaction. Avoid repeated resource checklists.
- Performance earns **harmony**, changing musical richness and a cosmetic ending distinction. Poor performance advances; route choices never block completion. Exact harmony thresholds/reward presentation remain open.
- Auto assistance gives average quality and may take longer than active play. Listening clues have visual/text equivalents; sound is never required. Reduced motion must preserve all cues.
- Expedition duration uses active real time, **not Faster Tick**, and pauses when the expedition is left/hidden. Existing production/settling retain their own clocks. Save partial chapter progress and every resolved encounter.
- Ordinary resources or cooldowns must not become extra expedition prerequisites: dedicated encounter progress prevents weak production, shells, prestige resets, or automation from stranding the player. Once an encounter opens, waiting does not worsen its result.
- Ordinary horn/Sea rewards and queues stay separate from quest phrases/encounters. Expedition interactions do not secretly grant repeat horn or shell rewards. Existing automation may continue without completing, consuming, or skipping quest encounters.
- Track entry-paid, chapter/encounter progress, harmony, and completed state separately from ordinary progression resets. Payment and completion rewards occur once, including across reloads. Old completed finales remain completed; replay is cosmetic and pays nothing again.
- No game pause should be required to maintain progress: leaving the expedition pauses it while ordinary gameplay remains available. Confirm reset/re-entry UI during implementation.

Measure **eligibility**, **entry**, and **expedition completion** separately. Current simulation “finished” means readiness, not paid completion; extend it to exercise actual payment and every chapter. Record held/lifetime fathoms and post-payment balance. Compare active/assisted completion, interruptions/reloads, disabled sound, and mobile controls.

## 1.12.0 — Descent minigame and Risky Descent (original Phase 5)

Standard Descend opens a short controlled-drop timing/steering challenge. Poor performance still completes an ordinary descent. Good performance adds a bounded fossil bonus and/or explicitly bounded freshness extension. Auto/Sinking Stone use ordinary baseline with no skill bonus; normal settling and quest rules stay intact.

Risky Descent is opt-in with the exact penalty shown before starting:

- Success: larger capped bonus and **+10 percentage points** to that arrival's Sunvein chance, atop the normal 15% cap, for at most **25%**.
- Failure: `max(0, depth - 1)`, retain earned balances/upgrades, carry freshness decay, and apply **twice the normal settling work**, with Faster Tick once. No success fossils, horn, shell, Gilt arrival payout, or other success grant.
- Specify failed-landing identity/object placement and reset run accounting before implementation; revisiting a depth must not replay consumed rewards. Never use negative floor age or freshness above its defined cap.
- Snapshot pending attempts, settle once, and provide a saved safe Auto path. Risky Auto should not silently guarantee the superior success result; its probability/quality contract must be specified before release.

Tune so a roughly 70%-successful risky player is modestly ahead, while poor performance is behind. Simulate Auto/no-risk and several success rates, including failures at depth zero and Sunvein interactions. Keep quest expedition progress independent.

## 1.13.0 — Pearlbright Sea (optional reservation)

Rare arrival layer with pearlescent artwork and a bounded fathom bonus. Chance/multiplier and whether to include it remain **unconfirmed**. No fourth shell rarity, potency increase, or discovery beyond 50%.

The departing layer determines the payout; roll/save the arriving layer afterward. Reload cannot reroll or pay a visit twice. Preserve layers across saves and specify reset semantics before implementation. Compare its income separately, since it may counteract the harsher fathom curve. Skip this reservation if not adopted.

## 1.14.0 — Chronicle and offline return report (original Phase 6, part 1)

- Lore unlocks over settling progress, with a new-page indicator. Flavor only; no rewards or prerequisites for reading.
- Extend the existing away report with actual earned hum, fading floors, queued horns, and completed eligible tasks. Reuse the existing away calculation; displaying the report never awards resources again.
- Persist unlocks, respect reduced motion, and accurately distinguish paused challenges/expedition progress from offline production. Do not imply offline shopping or horn generation exists.

## 1.15.0 — Horn sets and session goals (original Phase 6, part 2)

- Three related horn designs form a set. Use stable Collection identities; final set definitions and whether rewards are cosmetic or capped flat passives remain open. Do not introduce an uncapped multiplier or Primordial reveal before its gate.
- Three small goals per local calendar day, cosmetic rewards only: horn skins, cave tints, strip themes. No requirement to claim at a particular hour and no loss of ordinary progression.
- Persist once-only claims and completed sets; clock/date changes or resets cannot duplicate rewards. Reconcile any passive proposal with progression simulations before adopting it.

## 1.16.0 — Broader procedural music (original Phase 6, part 3)

Equipped horns and rung bells contribute layers to the procedural song. Reuse existing audio scale (minor pentatonic) and Sound setting. The finale release includes the audio it needs; this later pass expands everyday music rather than delaying the finale.

Avoid stacking duplicate audio loops on world changes/reloads. Respect mute, browser audio activation, and accessible visual cues. No stat effects from volume or sound settings.

## 1.17.0 — Optional 3D horns (original Phase 7)

Derive tube/lathe geometry from existing seeds, rarity, and stats. Lazy-load a pinned three.js dependency when Inventory/Collection opens. Keep deterministic SVG as the fallback for load failure or absent WebGL. Support slow idle rotation and drag controls, pause rendering while hidden, and respect reduced motion. No item rerolls or progression changes; static hosting remains build-free.

## Unassigned proposal — Offline horn arrivals

The user suggested offline idle horns capped at **five on return**, regardless of absence length. Exact manual pending-call versus Auto item handling and interaction with an existing queue remain unconfirmed. Keep this separate from the offline report and horn timer fix. If adopted, define timestamp consumption, one-return cap, queue preservation, and once-only processing before assigning a release; no retroactive inventory sweep or lost pending horn.

## Conflict review

| Conflict / ambiguity | Resolution or remaining decision |
|---|---|
| Old goal banned duration changes and Sea cooldowns | Superseded: intentional pacing changes are measured; only refactors require parity |
| Old backlog still listed implemented Sea gates/prices as unfinished | Baseline above records 1.9.8 behavior separately from future tuning |
| Original Phases 5–7 used versions now needed by added passes | New release map reserves 1.10–1.17 and retains original phase references |
| Newly approved finale order versus original descent-first order | Seashells → Last Chorus → descent; neither finale nor descent depends on the other |
| 100k offering discussed as though already implemented | Proposed, pending natural shell-budget checks; runtime remains 50k |
| First Heartstone required Sea before unlocking it | First Sea gate stays zero |
| Shell discounts could fake milestones/finale soundings | Eligibility only; finale still needs 25 actual sounds |
| Shell quality previously changed sounding discounts | Only depth varies; sound reductions stay 0/1/3 |
| Two identical Mythics might be blocked by deduplication | Distinct IDs can equip together; no rarity/value deduplication |
| Sea timer and Faster Tick might double-scale work | Apply speed once; HUD derives remaining real time from shared rules |
| Thirty-minute finale could shrink under Faster Tick or run while absent | Separate active real-time expedition clock; pause inactive challenges |
| Expedition world switching could depend on production/reset resources | Dedicated quest progress; ordinary gameplay/reset state cannot strand it |
| Auto purchases/descent could consume quest objectives | Encounter state/rewards stay independent from normal automation |
| Listening puzzles require sound | Visual/text clues and average-quality assistance |
| Normal horn/Sea actions overlap quest phrases and could pay twice | Quest performance has separate state; no implicit normal reward calls |
| New finale invalidates old completion or charges twice | Preserve completed saves; persisted once-only payment, cosmetic replay |
| Current simulator finishes at eligibility | Add paid expedition completion; report all three time marks |
| Optional Sea bonus might erase fathom nerf | Separate bounded-income validation; chance/multiplier unconfirmed |
| Offline report implies offline horn gains/shop automation | Report implemented accounting only; horn-arrival proposal unassigned |
| Freshness reward starts from an already fresh floor | Bounded extension/offset, no negative age or over-cap freshness |
| Risky failure could replay arrival/depth rewards | Explicit failed-landing rules and consumed reward accounting required |
| Old scope excluded puzzles/events | Ordinary cave events, choose-three arrival choices, rhythm shouts, resonance puzzles, and settling tasks remain excluded. Approved Last Chorus encounters/pulse alignment are a finale-specific exception |
| Full module refactor blocks feature delivery | Extract necessary boundaries incrementally; canvas/audio/UI split remains ongoing work |

The dependency order is consistent with these resolutions. **Balance and manual feel remain open**: shell price/manual-feel tuning, final entry price, assistance duration, harmony thresholds, risky rewards/failure placement/Auto, optional Sea layer, and set rewards require concrete tuning. No speculative number is a shipped promise.

## Validation and delivery

For each gameplay slice, run relevant existing rule/browser suites plus targeted new coverage, with desktop and mobile, old saves, all reset paths, hidden tabs, Auto, disabled sound, and reduced motion where relevant. Documentation-only edits need link/consistency and diff checks, not gameplay simulations.

Natural progression comparisons use seeds 1–5 with real currency generation, purchases, discovery, and average Auto; diagnostic best-item fixtures must be labelled separately. Compare several Cave/Sea shares and Patient Choir reserves. Record timer/tide stalls, Heartstone timing, actual sounds, shell outcomes/upgrades, Plumb Line, total/held fathoms, and final entry budgets. Extend horizons only when necessary and distinguish slow completion from an unreachable prerequisite.

Existing reports: [horn first pass](tools/sim/horn-first-pass.md), [ivory income](tools/sim/ivory-income.md), [QOL](tools/sim/qol.md), [Sea foundations](tools/sim/sea-foundations.md), [Sea pacing](tools/sim/sea-pacing.md). Natural shell results are recorded in [playable shell validation](tools/sim/playable-seashells.md); the expedition remains unimplemented. The earlier no-shell readiness results do not validate expedition duration.

Deliver reviewable PRs in release order, keeping the existing stacked branch dependencies until merged. Planning edits do not claim gameplay implementation. Update this roadmap's status as each release actually lands.
