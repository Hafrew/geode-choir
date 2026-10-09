# Sea/seashell foundations: isolated reward comparison

Baseline: horn-clock commit `09e9722` (PR #19). Candidate: the shell foundations and isolated fathom exponent change in `c2fd9b0`, with release metadata added separately. The confirmed design is documented in plan PR #18; this implements its first delivery slice.

Only the fathom overrun exponent changes natural gameplay in this slice: **0.3662 → 0.25**. No shell drops or upgrades are enabled, and the existing tide thresholds, sounding/Heartstone gates, Sea timer behavior, Plumb Line, Open the Ceiling, and finale offering remain unchanged. Shell rules/defaults introduce no random draws during gameplay. Cave fossil rewards retain 0.3662.

## Natural purchasing runs

Smart policy, 3 clicks/second, 25% Sea time, sounding/descend ratio 2, ordinary horn upgrades enabled, no gifted currencies/items/unlocks, seeds 1–5, 40-hour maximum. Both versions finish all five runs with three Heartstones, six actual soundings, 32 feats, and no JavaScript errors. These compare the old six-sounding finale, not the planned 25-sounding pass.

| Seed | Baseline finish (h) | Candidate finish (h) | Change | Baseline second Heartstone (h) | Candidate second Heartstone (h) | Final fathoms baseline / candidate |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 3.198 | 3.183 | -0.49% | 2.250 | 2.334 | 27 / 26 |
| 2 | 3.609 | 3.349 | -7.20% | 2.625 | 2.500 | 28 / 27 |
| 3 | 3.698 | 3.698 | +0.00% | 2.750 | 2.750 | 26 / 25 |
| 4 | 3.714 | 3.729 | +0.42% | 2.834 | 2.708 | 26 / 26 |
| 5 | 3.760 | 3.760 | +0.00% | 2.667 | 2.750 | 26 / 27 |

Mean finish: **3.596h → 3.544h (-1.45%)**. First Heartstone time matches exactly for every seed. A harsher payout can still lead to a faster individual run because changed purchases change later physics and random outcomes; finish-time direction alone does not measure the reward nerf. Final fathoms are unspent balances, not total fathoms earned.

## Reward and shell verification

At equal tide, sounding count, and modifiers, fathoms are never above the old formula. Before rounding, overrun multipliers change as follows:

| Tide / requirement | Old multiplier | Candidate multiplier | Reduction |
|---|---:|---:|---:|
| 1 | 1 | 1 | 0% |
| 10 | 2.324 | 1.778 | 23.5% |
| 100 | 5.400 | 3.162 | 41.4% |
| 10,000 | 29.161 | 10 | 65.7% |
| 100,000,000 | 850.354 | 100 | 88.2% |

24 rule tests pass. Shell coverage includes depth scoring/average Auto, fixed 0/1/3 sounding discounts, dedicated one/two-slot capacity, two distinct Mythics stacking, spare/duplicate-ID exclusion, actual eligibility without counter changes, 60,000 seeded discovery trials across base/max chance, once-only success/failure, pending completion, all resets, save normalization, legacy balances, and no retrospective grants. Reward checks cover threshold eligibility, monotonic payouts, old-vs-new formula, and unchanged cave fossils.

Desktop (1100px) and phone (390px) checks pass for new/legacy saves, horns, inventory, QOL/automation, and the new shell-contract check. The shell check uses fixture items to verify the real Heartstone display/action eligibility and reload persistence; it does not claim there is a player-facing shell screen yet.

## Next slice

1. Tune tide thresholds, persistent Sea settling, higher cumulative Heartstone gates, 25 actual finale soundings, the level-15 Ceiling cap, and currency budgets together. Update the bot to dynamic targets and actual timer eligibility before running the combined comparison. Preserve legacy purchased levels and completed progress.
2. Enable the saved discovery outcome after successful sounding, then build spinner, minigame/Auto, inventory/equipment, and fathom upgrades. Six discovery levels in the foundation are an initial 5-percentage-point step proposal; prices and final upgrade pacing remain open.
3. Consider the optional special Sea layer separately.

Current six-sounding runs do **not** establish affordability of shell purchases or the 100,000-fathom Patient Choir under the future gates/timer, nor validate the optional layer. Timer-forced overrun and Plumb Line can change hourly income materially; measure total earned/spent fathoms and competing sinks in the next pass. No combined-pacing claim is made here.

## Reproduce

```bash
node --test tools/horns.test.mjs tools/automation.test.mjs tools/seashells.test.mjs
CHROMIUM=/usr/bin/chromium node tools/smoke.js
CHROMIUM=/usr/bin/chromium node tools/horns-smoke.js
CHROMIUM=/usr/bin/chromium node tools/horn-inventory-smoke.js
CHROMIUM=/usr/bin/chromium node tools/qol-smoke.js
CHROMIUM=/usr/bin/chromium node tools/seashells-smoke.js
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 40 --seed 1 --out /tmp/sea-candidate-1.json
```

Repeat the simulation for seeds 2–5 and run the same command in a checkout of `09e9722` for the baseline. Raw run artifacts were written to `/tmp/sea-{baseline,candidate}-{1..5}.json` during verification; this document records their relevant metrics.
