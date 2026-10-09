# Ivory income validation (1.9.3)

Validated on 2026-10-08. The 1.9.2 natural-purchasing runs from the preceding pass are the baseline. All runs use the smart bot, 3 clicks/second, 25% sea share, normal horn progression from the start, and 50ms physics steps. The simulator retains gameplay/seeded draws while skipping canvas painting. Each allows up to 40 game hours and stops at finale readiness.

## Implementation

- Common / Rare / Epic / Legendary / Mythic / Primordial salvage: **3 / 10 / 35 / 75 / 250 / 500 ivory**.
- Discovery grants **5 ivory per new horn**. Ivory Echo adds 5 per level across five levels, reaching 30. Initial costs are 25 / 50 / 100 / 200 / 400 ivory (775 total).
- Discovery and salvage grants are separate. A newly found Primordial at maximum Ivory Echo with a full inventory grants 30 + 500 = 530 ivory.
- The grant is recorded on the newly created horn. Loading, equipping, viewing, later salvaging, or upgrading does not repay it. Existing saves are not granted discovery ivory retroactively.
- The upgrade persists through descents, sea soundings, Heartstones, and save/reload. All generation and salvage paths share the same payout rules. Both grants count toward lifetime ivory; the simulator now accounts for its salvage as well.

## Checks

Eight rule tests pass, including exact payouts, once-only accounting, upgrade persistence, and legacy migration. Desktop/mobile browser checks pass at 1100px and 390px: base discovery reward, purchasing all Ivory Echo levels, paying the next horn at 30, reload persistence, later salvage paying only salvage, actual game resets retaining the upgrade, and full-inventory combined payouts. Existing legacy/new-game smoke checks pass. No JavaScript errors were reported.

## Natural-purchasing comparison

| Seed | Previous finish (hours) | Current finish (hours) | Previous rarity level | Current rarity level | Ivory Echo level | Lifetime ivory earned |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 3.776 | 3.500 | 0 | 6 | 5 | 3,653 |
| 2 | 3.500 | 4.094 | 0 | 7 | 5 | 4,690 |
| 3 | 3.745 | 3.443 | 0 | 5 | 4 | 1,809 |
| 4 | 3.958 | 3.865 | 1 | 6 | 4 | 3,420 |
| 5 | 3.792 | 3.927 | 0 | 7 | 5 | 5,084 |

Mean finish time: **3.754h → 3.766h (+0.3%)**. Individual seeds vary; earlier upgrades alter subsequent randomized horns and gameplay. This is a balance change, not a refactor equivalence check.

The default bot now reaches **rarity levels 5–7**, compared with **0–1** before, and Ivory Echo levels 4–5. It still does not max rarity or unlock Primordial before the finale. These payouts clearly accelerate horn upgrades, while natural max/unlock timing remains a playtest target. The game continues after finale readiness. Rarity Weaving, Primordial unlock, and slot prices were retained for this isolated income change.

Reproduce:

```bash
node --test tools/horns.test.mjs
CHROMIUM=/usr/bin/chromium node tools/smoke.js
CHROMIUM=/usr/bin/chromium node tools/horns-smoke.js
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 40 --seed 1 --out /tmp/ivory-1.json
```

Repeat the simulation for seeds 2–5. Historical pre-income results are recorded in `horn-first-pass.md`.
