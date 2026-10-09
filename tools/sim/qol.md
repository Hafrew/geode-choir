# QOL validation (1.9.5)

Validated 2026-10-09 against merged 1.9.4 (`a52a9b0`).

17 rule tests pass, including all cave purchase categories, currency reserves, disabled/locked shops, failed placement, per-tick limits, unchanged owned switches, save normalization, and persistence through all resets. Browser checks pass at 1100px and 390px for the live Sounding countdown/queue, actual bell/crystal dragging, top-tier and missing-twin restoration, Crush, protected oysters and pearl works, the Heartstone/price unlock gate, actual shop purchases, currency reserves, existing Crystal Seeker, Sunvein gating, excluded horn calls, and save/reload. Existing new/legacy gameplay and horn progression/inventory browser checks also pass. No JavaScript errors or horizontal overflow were reported.

## Cave shop coverage

| Category | Shop | Currency | Additional gates |
|---|---|---|---|
| Voices | shopVoices | Hum | Individual upgrade reveals |
| Tuning | shopTuning | Hum | Individual upgrade reveals/caps |
| Crystals | shopCrystals | Hum | Tier reveals, capacity, placement |
| Wonders | shopWonders | Shards | Shard ledger (depth 3), caps, placement; owned switches skipped |
| Attunement | shopAttune | Shards | Shard ledger and tier availability |
| Strata | shopStrata | Fossils | Upgrade reveals/caps; owned switches skipped |
| Illuminations | shopGlow | Lumen | Glowworm Nest opens the ledger; owned switches skipped |
| Horn upgrades | shopHorns | Ivory | Horn ledger, rarity/unlock prerequisites; calls excluded |
| Sunvein upgrades | shopGold | Gilt | Visited a Sunvein, currently on a Sunvein, caps |

## Default progression equivalence

Smart bot; 3 clicks/second; 25% Sea share; normal horn progression; 50ms steps; up to 40 game hours, stopping at finale readiness. The new optional automation remains locked/off, and the existing bot policy is unchanged.

| Seed | Merged baseline finish (hours) | Current finish (hours) | Progression/rewards |
|---|---:|---:|---|
| 1 | 3.500417 | 3.500417 | Exact |
| 2 | 4.093750 | 4.093750 | Exact |
| 3 | 3.442639 | 3.442639 | Exact |
| 4 | 3.864861 | 3.864861 | Exact |
| 5 | 3.927083 | 3.927083 | Exact |

All progression marks, purchases, descent/sounding counts, final state metrics (including horn upgrades, ivory, and horns found), and finish times match exactly in all five seeds. Every run finishes with zero browser errors. This establishes unchanged default pacing; it does not estimate the speedup from player-selected automation after its 100,000-fathom unlock. Manual playtest feedback remains the basis for the pending balance pass.

Reproduce on each version for seeds 1–5:

```bash
node --test tools/horns.test.mjs tools/automation.test.mjs
CHROMIUM=/usr/bin/chromium node tools/qol-smoke.js
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 40 --seed 1 --out /tmp/qol.json
```
