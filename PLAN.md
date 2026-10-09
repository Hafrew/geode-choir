# Versioned plan: Geode Choir progression and finale

This replaces the earlier phase-only roadmap and conflicting Sea drafts. It combines the original phases with the added horn, Sea, seashell, and finale passes. Future versions are proposed release slots, not implemented features. A documentation change does not bump the runtime version.

Current release: **1.10.2 beta** on `main` (plus an unreleased number-format fix). Everything through 1.10.2 is merged. The game is labelled **beta** in the version chip, credits, and page title until the 1.11.0 finale lands and the beta hardening is done; the label is presentation only, and saves and version checks use the plain version number. Natural simulations now finish in a mean **6.56 hours** (see [The Longer Road validation](tools/sim/longer-road.md)); a real save suggests humans can be faster than the bot. Implementation status does not imply deployment. Check merge/deployment status before starting each release.

## Principles

- Refactors preserve seeded behavior and progression (±2% finish-time check). Intentional balance changes report their effect; there is no blanket unchanged-completion-time requirement.
- Every challenge has an accessible Auto/finish path. Poor standard performance loses bonus, never progress. Only explicitly selected Risky Descent can move depth backward.
- Pending challenges persist and never fail because a tab is hidden. Production/settling clocks follow the existing offline policy; interactive challenge clocks pause when inactive.
- Preserve earned balances, items, paid levels, actual counters, and completed finales. Back up before migration. Outcomes and payments are once-only and cannot reroll on reload.
- UI, automation, and simulations use the same rules and purchase functions. No duplicate eligibility or reward formulas.
- Keep static hosting build-free. Extract rules and state boundaries as features need them; do not make a full canvas/audio/UI rewrite a prerequisite.
- Each gameplay release updates the runtime version, CHANGELOG, and What's new, with relevant rule/browser checks. A version bump also bumps `seenVer` in the browser-test save fixtures, or the What's-new dialog opens and blocks clicks. Costs and difficulty marked proposed remain tunable.
- Pacing is judged against both the simulator (seeds 1–5) and real player saves. The bot is a baseline, not a person: real saves have reached Heartstones faster than the bot, so measure and calibrate before locking numbers.
- Do not use a currency that grows exponentially with depth (lumen) as the main pacing gate: any lumen price converts to only a few depth levels. Pace with depth, time-gated Sea requirements, or timers.

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
| **1.10.2** | The Longer Road: five-Heartstone finale (36 soundings), lumen cost ×25 per Heartstone, Plumb Line ×1.2 | Delivered; measured mean 6.56 h to finale readiness |
| Unreleased | Fossil and fathom gains follow the number format setting | Delivered (#31); audit for other raw numbers is in 1.10.3 |
| **1.10.3** | Beta hardening: safe save import, save-failure warning, inventory render cost, test command and CI, number-format audit | **Next pass**; no balance changes |
| **1.10.4** | Variety pass: Sunvein pity, cave events, skippable descents | Proposed; Sunvein pity design agreed, numbers to confirm. Replaces the earlier pacing-lever ideas (see findings) |
| **1.10.5** | Auto-buy horns and staged Patient Choir unlocks | Proposed; prices depend on the 1.10.4 pacing |
| **1.11.0** | The Last Chorus finale expedition and entry-price tuning | After 1.10.5, using the measured economy |
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
- Finale as of 1.9.8: **25 actual soundings, three Heartstones, 20 feats, 50,000 fathoms** (1.10.2 raised it to 36 soundings and five Heartstones). Shells never discount its actual-sounding requirement.
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

## 1.10.2 results and findings

Measured on seeds 1–3 (details in [tools/sim/longer-road.md](tools/sim/longer-road.md)):

| Seed | Heartstone 1 | 2 | 3 | 4 | 5 (finale ready) |
|---:|---:|---:|---:|---:|---:|
| 1 | 1.37h | 3.50h | 4.28h | 5.21h | 6.26h |
| 2 | 1.39h | 3.67h | 4.74h | 5.76h | 6.87h |
| 3 | 1.36h | 3.50h | 4.46h | 5.43h | 6.54h |

Mean **6.56h**, up from **4.25h**. Findings that shape the next passes:

- **Depth is the gate.** After Heartstone 1, each Heartstone takes about 0.8–1.1h. Depth needed is `12 + 22h + omen - shell`; the omen swings it from -6 (Generous) to +8 (Stubborn).
- **Lumen is not a gate and cannot be made one.** Lumen income grows with depth, so costs in the trillions only add minutes; see the principle above. The ×25 growth stays as a mild check.
- **The 36 soundings are done 1.6–2.2h early**, so the Sea side does not pace the run. The Sea settling timer cost about 0.77h per run.
- **Sea gates do not pace the run.** Tested on seeds 1–3: cumulative sounding gates 20/28/36/44 with a 52-sounding finale finished in a mean 6.39h, and 20/30/40/50 with 60 soundings in 6.45h, against 6.56h for the 1.10.2 balance. The bot finishes the soundings 0.5–1.5h before Heartstone 5 even then, so the extra soundings never bind; making them bind would need about 80+ identical soundings. Not shipped.
- **A bigger depth step lengthens the run but adds the repetition players already feel** (see player feedback below). Depth steps of 24 and 26 were simulated; results are recorded in [tools/sim/longer-road.md](tools/sim/longer-road.md) when complete.
- **Player feedback: the cave depth leg is repetitive** ("flat clicking", no events), and a real run had 65 descents with no Sunvein. The response is variety, not length: see 1.10.4.
- **Real saves are faster than the bot early.** One save had two Heartstones at 2.6h played, against 3.5–3.7h for the bot. Expect real finishes below 6.5h; calibrate with player saves.
- **Fathoms have little to spend on.** Typical income is about 150,000 per sounding; a large held balance in one save was a single old windfall, not income. Staged Patient Choir prices (1.10.5) are the planned sink.
- **Sunveins work as designed.** Forced-descent testing gave 7.4% with one Gilded horn (expected 7%); a 0-in-65 dry spell is about a 4% event. The system has no bad-luck protection and no way to raise the 5% base other than Gilded horns, which only Sunveins produce.

## 1.10.3 — Beta hardening

From the post-merge code review of 1.10.1. No balance or progression changes; the seeded parity rule applies.

- **Safe save import (security).** Shared `GC1:` save codes are only checked for a numeric `hum`, and horn/collection names from a save reach `innerHTML` (`title` attributes, Sounding results, Collection cells). A crafted code could inject markup or script into the importing player's page. In `restoreState`, regenerate horn names from their seeds (or accept only a strict name pattern) and coerce `id`/`seed` to integers; add one `esc()` helper for interpolated template HTML. Add a test that imports a hostile name and asserts that it renders as text.
- **Save-failure warning.** `save()` swallows storage errors, so a full or blocked localStorage silently loses progress. Show one toast per session when a save or backup write fails.
- **Inventory render cost.** The UI refreshes every 0.12 s; rebuild horn/shell grids only when their contents change (an inventory revision counter), so large inventories stay smooth on phones. Verify with a several-hundred-horn fixture at 390px.
- **One test command and CI.** Add a `package.json` `test` script that runs the unit tests and every browser smoke suite, and a GitHub Action that runs the unit tests on each PR to `main`. Stacked PRs that merge only into their parent branch (#20–#24) should be caught by a check that their changes reached `main`.
- **Number-format audit.** Fossil and fathom gains were printed as raw integers (for example 384738384) and are fixed (#31). Search the UI for any other interpolated numbers that bypass `fmt()` (shop prices, popovers, toasts, the Chronicle, Deep/Choir upgrade text) and fix them, with one browser check at large values.
- **Check the Sunvein arrival lump.** In one sim run the arrival lump was 9.05 gilt while the balance read 3.01 right after arrival. Probably gilt draining over the first chunk, but unconfirmed; verify against `sunveinArrival` and the gilt cap before treating it as correct.
- Optional: one formatting pass (about 150 lines in `main.js` exceed 200 characters), in its own PR so review diffs stay readable.

The beta label is removed when 1.11.0 lands and this hardening is complete.

## 1.10.4 — Variety pass (proposed)

Why: the cave depth leg is the pacing gate (see findings) and is also the repetitive part: a run has roughly 250–280 descents of the same sing, wait, descend, rebuy loop, with no events, and one real run reached 65 descents without a single Sunvein. Making the run longer would add more of the same, so this pass keeps the length near **6.5 hours** and adds variety and fairness. Order: Sunvein pity first (small, testable), then skippable descents, then cave events.

### Sunvein pity (design agreed; some numbers to confirm)
- A saved counter of consecutive eligible descents (depth 3 or deeper) without a Sunvein. It resets when a Sunvein arrives and is kept in the save with the stats; it is not reset by Heartstones.
- **Pity bonus:** each dry descent adds to the arrival chance, up to a maximum of **+5 percentage points** (agreed maximum). The per-descent step is not yet fixed; proposed **+1 point per dry descent**, so the maximum is reached after five dry descents.
- **Hard guarantee:** the **30th** consecutive dry eligible descent is a Sunvein.
- Base chance stays 5% plus 2 points per Gilded horn, capped at 15%. Open: whether the pity bonus counts inside that cap or on top of it, and how it stacks with a future Risky Descent bonus (proposed: pity on top of the cap, Risky Descent unchanged).
- Open: the counter starts at zero for existing saves (proposed) or is seeded from a save's recorded descents and Sunveins.
- Validation: unit tests for the counter, the maximum bonus, the guarantee, and migration; a forced-descent check of rates with and without pity; the longest dry streak never exceeds 29; sim finish times unchanged within noise (Sunvein effects are modest: 25% slower decay, 10% more fossils).

### Skippable descents (idea agreed; must not shorten the run)
Players like the idea of skipping descents, but the descent settling lock is what keeps the game from being quick, and fossils and lumen grow steeply with depth, so a descent that drops several levels for the price of one would break pacing. Constraints:
- **Time to depth must not drop.** A skip of N levels charges the settling lock for each skipped level (N locks, paid up front or as a lock debt), so skipping saves clicks, not time. Simulate before and after; the finish time must stay within about ±2% for the same play.
- **Rewards are not multiplied.** Fossils come from the landing only (or a reduced share for skipped floors); no per-level rewards are paid twice. Lumen and hum keep accruing normally. No skipped floor can strand a quest or milestone that needs landing on it (events and the Heartstone depth are checked at the landing depth).
- **Forms to choose from:** a "Dive" control that lets you pay several locks at once; skip charges earned from events or a Sunvein arrival (still charging the lock); or an automation option that batches ready descents. Auto-descend remains available and must not silently skip more than the player allows.
- Open: whether Sunveins and floor identities are rolled only at the landing floor (proposed) and how skipped floors count for stats such as best depth.

### Cave events (proposed; reverses the earlier exclusion of ordinary cave events)
- Milestone floors: every fifth level, a short event of about 10–20 seconds with a real choice and a trade-off (for example freshness against fossils, or a one-off hum boost against a longer lock), not extra clicking.
- Auto mode picks the safe option, in line with the rule that every challenge has an accessible Auto path. Outcomes are saved, once-only, and cannot be rerolled by reloading. Events do not change the Heartstone depth requirement or strand progress.
- Open: the shape (small choices, or a timing or aiming moment), the number of event types for a first pass, and how events interact with skippable descents and the future descent minigame (1.12.0).
- Validation: seeded sim with Auto choices; finish time stays near 6.5h; no event can be skipped to lose a reward permanently.

Process for the whole pass: simulate seeds 1–5 with `tools/sim/run.js`, compare finish times and per-Heartstone gaps, check the Heartstone saves in `tools/saves` still load, and gather real player timings to calibrate. Changes preserve earned balances, items, and paid levels; existing saves keep their Heartstones.

## 1.10.5 — Auto-buy horns, staged automation

The goal is automation that has to be earned instead of arriving as one flat unlock. Staged prices depend on the pacing chosen in 1.10.4 and should be set from measured income at the time each Heartstone gate opens.

### Auto-buy horns
- A dedicated rack of up to **3 slots** for **Epic, Legendary, and Mythic** horns, used only to speed up Patient Choir shopping. Slotted horns give **no stat effect** anywhere; their only effect is a shorter shopping interval.
- Slots: **1st** with Patient Choir, **2nd at Heartstone 3**, **3rd at Heartstone 4**. No fathom cost for the slots.
- Interval: base 0.5 s, multiplied per horn (proposed Epic ×0.90, Legendary ×0.80, Mythic ×0.65), with a **0.1 s floor**. Gilded counts one rarity higher.
- A slotted horn cannot also be in the normal or Primordial racks, and auto-salvage and fusing skip it. Ids are validated on load, so a missing or ineligible horn is dropped.
- Offline behavior is unchanged (no offline shopping).

### Staged Patient Choir
Replace the single 100,000-fathom switch that opens all nine categories with a ladder. Costs and gates are **proposed** and must be tuned with the simulator. They are scaled to a real mid-run save (about 2.6 hours played, two Heartstones, 32 soundings): typical income was about 150,000 fathoms per sounding, one sounding per two-minute settling lock, so roughly 4–5 million fathoms an hour. The 21.7 million held in that save was mostly one old windfall (a recorded single haul of 21.1 million, from before the harsher fathom curve), so it is not typical income. Aim for each stage to cost roughly 30–60 minutes of income at the time its Heartstone gate opens.

| Stage | Opens | Gate | Proposed price |
|---|---|---|---|
| Patient Choir | Voices, Tuning, Crystals | Heartstone 2 | 100,000 fathoms (unchanged) |
| Second Verse | Wonders, Attunement | Heartstone 2 | ~3,000,000 fathoms |
| Deep Verse | Strata, Illuminations | Heartstone 3 | ~15,000,000 fathoms |
| Final Verse | Horn upgrades, Sunvein upgrades | Heartstone 4 | ~60,000,000 fathoms |

Existing saves that already own Patient Choir keep what they have paid for: their categories open, no refund, no double charge, and the new stages are bought normally.

### Validation
Unit tests for the shopping interval and for loading bad ids. Browser smoke checks for slotting, unlocking at Heartstones 3 and 4, staged purchases, old-save migration, and reload. Seeds 1–5 rerun for finish time, with an automation-on and automation-off comparison. The unlock prices and the interval multipliers stay marked proposed until then.

## 1.11.0 — The Last Chorus

Replace immediate first-time finale completion with a **roughly 30-minute interactive expedition** after paying the entry offering. Proposed cost **100,000 fathoms**, subject to 1.10.0 natural-economy checks; current cost remains 50,000 until a gameplay release changes it. No further mandatory payments. Entry requires **36 actual soundings, five Heartstones** (set in 1.10.2; 1.10.4 may raise the soundings), and 20 feats. The 100,000-fathom entry price is trivial at measured mid-run balances and is rescaled with the staged automation prices.

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

## Ongoing — `main.js` module split

`src/main.js` holds about 3,800 lines in one closure. Continue the incremental extraction already used for shells, automation, progression, and saves, one reviewable PR each, with the smoke suites as the guard:

1. Changelog data (`CHANGES`) to `src/changes.js`.
2. Horn Sounding minigame and inventory UI (around lines 2280–2640) to a `horn-ui.js`, matching `shell-ui.js`.
3. Save/load, backup, and import/export codes into `saves.js`.
4. Reward and cost formulas (`fossilGain`, `fathomGain`, `heartCost`, and related) into `progression.js`, so tests and the simulator import them directly instead of through `simulation.api`.

Extraction never blocks a feature release, and the canvas/audio rewrite stays out of scope.

## Conflict review

| Conflict / ambiguity | Resolution or remaining decision |
|---|---|
| Old goal banned duration changes and Sea cooldowns | Superseded: intentional pacing changes are measured; only refactors require parity |
| Old backlog still listed implemented Sea gates/prices as unfinished | Baseline above records 1.9.8 behavior separately from future tuning |
| Original Phases 5–7 used versions now needed by added passes | New release map reserves 1.10–1.17 and retains original phase references |
| Newly approved finale order versus original descent-first order | Seashells → Last Chorus → descent; neither finale nor descent depends on the other |
| 100k offering discussed as though already implemented | Proposed, pending natural shell-budget checks; runtime remains 50k |
| First Heartstone required Sea before unlocking it | First Sea gate stays zero |
| Shell discounts could fake milestones/finale soundings | Eligibility only; finale still needs its full count of actual sounds (36 since 1.10.2) |
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
| Raising the lumen cost to trillions looked like an easy way to lengthen the run | Lumen grows exponentially with depth; the cost converts to a few depth levels, so pacing uses depth and Sea gates instead |
| A real save and the bot disagree on early pace | Measure against both; calibrate with player saves before locking numbers |
| The 36-sounding finale requirement stopped mattering | Tested raising the Sea gates (finale 52 and 60): no change in finish time, so it is not used for pacing |
| Sunveins have no bad-luck protection and Gilded horns only come from Sunveins | 1.10.4: pity (+ up to 5 points) with a guarantee on the 30th dry descent; base rates verified by forced-descent testing |
| Dropping several levels per descent could break pacing because fossils and lumen grow with depth | Skips charge the descent lock per level skipped and pay landing rewards only; verify finish time stays within about ±2% |
| Lengthening the run with a larger depth step adds repetition | Not used; 1.10.4 adds variety and keeps the length near 6.5h |
| A version bump opens the What's-new dialog in browser tests | Bump `seenVer` in smoke fixtures with each release |
| Full module refactor blocks feature delivery | Extract necessary boundaries incrementally; canvas/audio/UI split remains ongoing work |

The dependency order is consistent with these resolutions. **Balance and manual feel remain open**: shell price/manual-feel tuning, final entry price, assistance duration, harmony thresholds, risky rewards/failure placement/Auto, optional Sea layer, and set rewards require concrete tuning. No speculative number is a shipped promise.

## Validation and delivery

For each gameplay slice, run relevant existing rule/browser suites plus targeted new coverage, with desktop and mobile, old saves, all reset paths, hidden tabs, Auto, disabled sound, and reduced motion where relevant. Documentation-only edits need link/consistency and diff checks, not gameplay simulations.

Natural progression comparisons use seeds 1–5 with real currency generation, purchases, discovery, and average Auto; diagnostic best-item fixtures must be labelled separately. Compare several Cave/Sea shares and Patient Choir reserves. Record timer/tide stalls, Heartstone timing, actual sounds, shell outcomes/upgrades, Plumb Line, total/held fathoms, and final entry budgets. Extend horizons only when necessary and distinguish slow completion from an unreachable prerequisite.

Simulator tools: `tools/sim/run.js` (finale runs; `--stopAtSunvein 1` for a Sunvein sanity check; the final output includes Sunvein and gilt counts) and `tools/sim/make-saves.js` (writes importable Heartstone 1–4 saves to `tools/saves/` for manual testing). Run long sims on an otherwise idle machine; browser suites time out when CPU is shared.

Existing reports: [The Longer Road](tools/sim/longer-road.md), [horn first pass](tools/sim/horn-first-pass.md), [ivory income](tools/sim/ivory-income.md), [QOL](tools/sim/qol.md), [Sea foundations](tools/sim/sea-foundations.md), [Sea pacing](tools/sim/sea-pacing.md). Natural shell results are recorded in [playable shell validation](tools/sim/playable-seashells.md); the expedition remains unimplemented. The earlier no-shell readiness results do not validate expedition duration.

Deliver reviewable PRs in release order, keeping the existing stacked branch dependencies until merged. Planning edits do not claim gameplay implementation. Update this roadmap's status as each release actually lands.
