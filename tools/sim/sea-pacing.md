# Sea pacing and currency pass

Baseline: the isolated 0.25 fathom curve from the first Sea foundations pass (PR #20; results recorded in `sea-foundations.md`). Candidate: the combined Sea timer, gate, threshold, Ceiling, and offering changes in this branch. No shell drops, fixture items, granted money, or gifted progression occur in these natural runs.

## Implemented rules

- Tide requirement: `50,000 × 3^actualSoundings`, replacing ×4.
- Settling: 600 work seconds after sounding one; each milestone at 2/5/10/20 actual soundings subtracts 120, down to 120. Faster Tick advances remaining work once in either world, and offline work follows existing efficiency. First Sea entry starts unlocked. Stored original lock duration drives the progress display; Heartstones preserve remaining work.
- Heartstone sounding gates: 0 for the first, then cumulative 20/24/28/… minus equipped shell discounts (floor 1). Shells never change actual counts or the timer milestones.
- Undersong: 25 actual soundings, 3 Heartstones, 20 feats, and **50,000 fathoms**. Completed finales are preserved.
- Open the Ceiling: new purchases stop at 15, cost `ceil(1500 × 3.5^level)`; paid legacy levels above 15 keep the existing bonus and get an explicit legacy label.
- Fathom overrun multiplier: quarter-root through ratio 10,000; above that use the lower of `ratio^0.25` and `10 × (1 + log10(ratio / 10,000))`. It remains continuous/monotonic and never exceeds the preceding quarter-root curve. Threshold payouts, Plumb Line, horn multipliers, and cave fossils are unchanged.

An exploratory run with settling but only the quarter-root reward earned about 38.7 billion fathoms in 26 soundings. This exposed timer-driven overrun and Plumb Line reinvestment feedback; the logarithmic tail addresses that issue. It is a diagnostic, not a clean final comparison.

## Five natural-purchasing seeds

Smart policy, 3 clicks/s, 25% Sea share, ratio target 2, ordinary horn upgrades, 12-hour candidate horizon. Baseline results are the five completed runs from the foundations pass. The bot stops at finale readiness; balances below are **before paying** the offering. The real payment and its once-only guard are covered in the browser check.

| Seed | Baseline finish h | New finish h | Second Heartstone h | 25th sounding h | Total fathoms earned | Unspent fathoms |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 3.183 | 4.609 | 3.667 | 3.958 | 96,944 | 52,183 |
| 2 | 3.349 | 4.683 | 3.667 | 3.958 | 1,608,229 | 187,591 |
| 3 | 3.698 | 4.625 | 3.667 | 3.958 | 29,661,228 | 4,147,683 |
| 4 | 3.729 | 4.792 | 3.834 | 4.125 | 616,091 | 69,064 |
| 5 | 3.760 | 4.625 | 3.667 | 3.958 | 576,815 | 139,396 |

Mean finish: **3.544h → 4.667h (+31.68%)**. Every candidate reaches 3 Heartstones, 25 actual soundings, 32 feats, and an affordable offering, with no JavaScript errors. First Heartstone time matches the baseline exactly for every seed. The requested higher gates deliberately change pacing.

Fathom income varies substantially with horn rolls, purchases, and reinvestment: these runs earn roughly 97,000 to 29.7 million. The offering is affordable in the weakest sampled profile; wealthier builds retain a larger surplus. This is not evidence that every player strategy has the same economy.

Across the default runs, time spent in the Sea with sufficient tide but a positive lock is about 0.61–0.65h; Sea time below the tide threshold is about 0.014–0.027h (these measures may overlap). Timer milestones and world switching dominate Sea pacing, while the tuned threshold does not strand these sampled runs.

## Time-share and competing-purchase checks

| Profile, seed 1 | Finish h | Actual soundings | Earned fathoms | Unspent fathoms | Patient Choir owned |
|---|---:|---:|---:|---:|---|
| 10% Sea time | 5.245 | 25 | 4,065,962 | 261,266 | No |
| 50% Sea time | 4.016 | 25 | 59,267 | 50,562 | No |
| Save for Patient Choir + reserve 2,000 | 4.594 | 25 | 18,813,381 | 1,691,852 | Yes |

The targeted profile buys the real **100,000-fathom Patient Choir** at **3.667h**, immediately after the second Heartstone. It protects the 50,000 offering and 2,000 extra currency reserve and still reaches finale readiness at 4.594h. No price reduction or free unlock is used. The extra reserve is a sensitivity check for future shell spending, not a claim that shell upgrade prices or their natural drop/minigame outcomes are already implemented.

The default speed policy skips the inactive purchase-automation unlock. `--patientChoir 1` adds its actual shop to the simulator, saves toward it, and waits for both purchase and finale readiness. Dynamic targets follow actual requirements and can continue beyond 25 if a currency target still needs funding; an explicit `--maxSoundings` is only a diagnostic override.

## Save and browser verification

- Old saves begin with no new lock. If the old Sea prerequisite for their pending Heartstone was already met, preserve that one requirement until kindling. A saved exception survives reload but is consumed by the next Heartstone; counters are never fabricated. Legacy Ceiling levels/bonuses, balances and completed finales stay intact.
- 28 rule tests pass, including threshold/timer eligibility, milestone work, tick/offline scaling, all resets, legacy grace, shell discounts, once-only discovery, reward bounds and cave fossil preservation.
- All six browser suites pass at 1100px and 390px: general new/legacy saves, horns, inventory, QOL, shell contracts, and Sea pacing. Sea pacing checks the real UI, locked clicks/API calls, zero-income offline advancement, cave ticking, reload, one reward per sounding, legacy level 22, the level-15 purchase cap, actual 25-sounding finale eligibility, and one 50,000-fathom payment.

The lower-of-curves guard was added during the run sweep. Every recorded sounding ratio in the completed profiles was checked: the final guard chooses exactly the same multiplier at every such input, so it does not change the recorded gameplay results. Boundary/low-ratio cases are separately covered by rule tests. The targeted Patient Choir run was rerun after its missing simulator shop was corrected.

## Next slice

Enable shell discovery after a successful sounding, then build the spinner, minigame/Auto, inventory/equipment, and discovery/second-slot purchases. The current natural runs use **no shells**, proving they are not required to reach the new gates or fund upgrades. Validate natural shell outcomes and both equipment slots once that UI path exists; shell prices and manual feel still need tuning. The optional special Sea layer remains separate.

## Reproduce

```bash
node --test tools/horns.test.mjs tools/automation.test.mjs tools/seashells.test.mjs tools/sea-pacing.test.mjs
CHROMIUM=/usr/bin/chromium node tools/sea-pacing-smoke.js
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 12 --seed 1 --out /tmp/sea-pacing-final-1.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 12 --seed 1 --sea 0.1 --out /tmp/sea-pacing-sea10.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 12 --seed 1 --sea 0.5 --out /tmp/sea-pacing-sea50.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 12 --seed 1 --patientChoir 1 --reserveFathoms 2000 --out /tmp/sea-pacing-patient.json
```

Repeat the default run for seeds 2–5. Other browser commands are listed in README.md. Relevant raw results were written to `/tmp/sea-pacing-{final-1..5,sea10,sea50,patient}.json`; the tables retain the metrics needed for review.
