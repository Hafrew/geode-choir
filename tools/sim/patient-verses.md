# Patient Verses — 1.10.7 combined release validation

This release combines the planned 1.10.6 cave variety pass with 1.10.7 shopping horns and staged Patient Choir. The user-approved design batches ordinary descents; each landing earns its normal haul and charges its normal lock. It supersedes the earlier landing-only skip-reward idea.

## Method

The baseline is merged 1.10.5 (`748a1a5`), archived to a separate directory before changes. Release gameplay code is `2634263`. Both builds run the actual application in Chromium with seeded randomness, smart shop policy, three taps/second, 25% Sea share, a descent threshold of twice the required hum, natural horn upgrades, and a ten-hour limit. No currencies, horns or Heartstones are granted. Completion means the existing finale requirements are ready, not that the future 1.11.0 expedition has been implemented.

```sh
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 10 --seed 1 --out results/seed-1.json
# Repeat ordinary play for seeds 1–5 in both builds.
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 10 --seed 1 --dive 3 --out results/dive-3.json
# Identical purchasing policy with Patient Choir enabled; only shopping toggles/rack differ.
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 10 --seed 1 --patientChoir 1 --shopping 0 --out results/shopping-off.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 10 --seed 1 --patientChoir 1 --shopping 1 --out results/shopping-on.json
```

`--dive 3` uses the real queued-dive control. The bot reserves the initial Choir price only after Heartstone 2; reserving it before that gate starves early Deep investment and makes an automation comparison misleading. Shopping toggles follow the same stage gates as the UI. The bot slots eligible spare horns and excludes them from wear and salvage. Manual purchases and fusing remain enabled in both cases, so this measures optional automation alongside an active player.

## Results

All five ordinary runs finished without errors.

| Seed | 1.10.5 hours | 1.10.7 hours | Difference |
|---|---:|---:|---:|
| 1 | 5.943 | 5.943 | +0.00% |
| 2 | 6.788 | 6.788 | +0.00% |
| 3 | 6.667 | 6.667 | +0.00% |
| 4 | 6.775 | 6.775 | +0.00% |
| 5 | 6.500 | 6.500 | +0.00% |

Mean finale readiness: **6.535 hours**, versus 6.535 hours before (+0.00%).
Every recorded ordinary-play milestone matches exactly for the same seed.

| Interval | Baseline mean hours | Release mean hours |
|---|---:|---:|
| Start → Heartstone 1 | 1.302 | 1.302 |
| Heartstone 1 → 2 | 2.299 | 2.299 |
| Heartstone 2 → 3 | 0.895 | 0.895 |
| Heartstone 3 → 4 | 1.002 | 1.002 |
| Heartstone 4 → 5 | 1.037 | 1.037 |

Seed 1 with three-descent dives finished in **6.587 hours**, with 90 dive requests performing 262 ordinary descents. The ordinary seed-1 policy took 5.943 hours. Action timing changes later random rolls, so the finish-time difference combines policy and random outcomes. The controlled equal-stream check below verifies the charged locks and outcomes separately.

With the corrected optional Patient Choir purchasing policy, seed 1 finished in **6.083 hours with shopping off** and **5.878 hours with shopping on**. Off/on bought 2/1 verses; the on case ended with 3 shopping horns. Verse purchase marks (game hours):
- off: verse1: 3.500, verse2: 4.333.
- on: verse1: 3.500.

All scenarios use the existing five-Heartstone, 36-sounding and 20-feat finale gates. Optional shopping can alter spending order and random outcomes; its late verses remain choices, not mandatory progression payments.

## Rules and compatibility checks

- 69 unit tests pass, including stage sequencing, exact funds, Heartstone gates, old-owner migration, rarity factors, rack validation/protection, milestone crossings, once-only event payments, paused timers and scaled freshness trades.
- All 11 browser suites pass on desktop and 390px mobile. The new suite covers queued locks, Sea pause, cancellation, reload, milestone safety, shopping slots, legacy ownership and actual wear/salvage protection.
- A controlled browser comparison uses the same random stream for three manual descents and a three-descent dive. Total charged locks, depth, fossils, Sunvein dry count, descents and shaft outcomes match exactly. Dives reduce requests, without a mechanical lock or reward shortcut.
- All four recorded Heartstone saves load with balances, horn ids and progression intact.
- A safe event paused during a Sea visit resolves when the ordinary descent lock has been paid, without adding a wait on return. A ready Heartstone can finish committed neutral/Auto events immediately; manual unchosen events and trades remain blocked until resolved. Neutral events no longer refresh unrelated bonus caches.
- Manual event choices persist, cannot be changed after commitment, and resolve once. No new shopping or event advancement occurs offline. Gilded ownership-based Sunvein luck remains unchanged by rack placement.

## Prices

Patient Choir costs 100K fathoms at Heartstone 2, Second Verse 3M at Heartstone 2, Deep Verse 15M at Heartstone 3, and Final Verse 25M at Heartstone 4. They are sequential, permanent and optional. Legacy paid owners receive all four verses without another charge.

Across baseline seeds 1–5, median hauls in each run's last six soundings were 0.25–0.58M fathoms. Settling falls to about 43–56 seconds with the natural Faster Tick levels. That implies roughly 16–48M fathoms per active Sea hour; 25M is about 31–94 minutes, with the middle runs near the intended 30–60 minutes. This reduced the proposed 60M Final Verse. Active Sea income differs from elapsed play at 25% Sea share, and prices compete with Deep purchases. There is no guarantee that every player earns a verse within a fixed wall-clock time, and no verse is added to finale requirements.

The interval factors remain Epic 0.90, Legendary 0.80 and Mythic 0.65, applied to a 0.5-second round with a 0.1-second floor. Gilding raises effective rarity by one; Primordial horns are ineligible. An interval is sampled by the ordinary frame loop, so live rounds have frame granularity.

## Limits

Seeded physics shares randomness with progression rolls: different action timing can change later horns, falls and omens, so a single seed's finish-time difference combines policy and random outcomes. The matched lock/reward check isolates the mechanical effect; full-run results measure the resulting play policy. Automation-on/off is one seed rather than an exhaustive strategy comparison. Browser checks are local Chromium diagnostics, not physical-phone performance measurements. Real player timings remain useful for further price calibration.
