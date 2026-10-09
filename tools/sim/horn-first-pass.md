# Horn upgrade first-pass validation (historical 1.9.2)

These results precede the 1.9.3 ivory income changes. They document the first implementation and do not describe current economy pacing.

Validated on 2026-10-08 with Chromium, the smart bot, 3 clicks/second, 25% sea share, 50ms physics steps, and seeds 1–5. Each run allowed up to 40 game hours and stopped at finale readiness. Fast runs skip canvas painting in both the archived baseline and updated game; physics, random draws, and gameplay remain active.

## Compatibility and behavior

- Original baseline: commit `bb5370d` with only the same simulation-only canvas painting guard applied.
- With new upgrade purchases disabled (`--hornUpgrades 0`), **all five finish times and every progression mark match the baseline exactly**.
- Rule tests: normalized odds across all levels; 120,000 seeded base/max rolls; pity; legacy random draw order; continuous trait quality; duplicate-trait behavior; separate capacities; legacy saves and pending choices; all reset types.
- Browser checks at 1100px and 390px: hidden reveal, purchases and gating, displayed odds, dedicated slots, lead-in and hit feedback, auto, trait choice/reload, trait preservation through actual descent/sounding/Heartstone actions, Golden Echo arrival rewards, and no JavaScript errors or horizontal overflow. Existing new-game and legacy-save smoke checks also pass.

## Pacing sensitivity

`--hornStart primordial` grants the max rarity level, Primordial unlock, and third dedicated slot at the start, **without free horns or currency**. This isolates the upgrade's effects; it does not represent natural unlock timing.

| Seed | Baseline finish (hours) | Fully unlocked finish (hours) | Change | Primordials held at finish |
|---|---:|---:|---:|---:|
| 1 | 3.776 | 3.563 | -5.6% | 1 |
| 2 | 3.500 | 3.625 | +3.6% | 4 |
| 3 | 3.745 | 3.594 | -4.0% | 1 |
| 4 | 3.958 | 3.547 | -10.4% | 2 |
| 5 | 3.792 | 3.532 | -6.9% | 2 |

Mean finish time changes from **3.754h to 3.572h (-4.9%)**. One seed takes longer; the distribution is stochastic and this is a five-seed diagnostic, not a universal speedup.

With natural purchasing enabled (`--hornStart base`), all five runs retain their baseline finish times. The default bot reaches rarity level 0 in four seeds and level 1 in one, with no Primordial unlock before the finale. This means natural availability/cost tuning is still unresolved; these runs do not validate the full mechanic's pacing for a normal player. Play continues after the finale.

Initial prices: Rarity Weaving `ceil(25 × 1.65^level)` ivory across 10 levels (5,720 total); Awaken the First Voice 2,500 ivory; First Voice Rack 4,000 ivory. Leave these as first-pass values pending player testing of ivory income and shopping priorities.

Reproduce:

```bash
node --test tools/horns.test.mjs
CHROMIUM=/usr/bin/chromium node tools/smoke.js
CHROMIUM=/usr/bin/chromium node tools/horns-smoke.js
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hornUpgrades 0 --hours 40 --seed 1 --out /tmp/refactor-1.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 40 --seed 1 --out /tmp/natural-1.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hornStart primordial --hours 40 --seed 1 --out /tmp/maxed-1.json
```

Repeat simulations for seeds 2–5. Raw run outputs are temporary diagnostics; this file records the reviewed comparison.
