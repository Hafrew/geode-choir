# Second Verse: Foundation model (placeholder numbers)

`node tools/sim/foundations-model.mjs [depth] [soundings] [harmony]` prints the rates and Echoes for a typical finished run
(five Heartstones, depth 105, 40 soundings, 20 feats, harmony 0.7). Output at the defaults:

| Lap | Echoes held | Stone/s | Tide/s | 1 h away, no Keep Time | 1 h away, Keep Time |
|---|---|---|---|---|---|
| 1 | 104 | 668 | 120 | 8.4e5 | 4.3e6 |
| 2 | 208 | 1,278 | 229 | 1.6e6 | 6.5e6 |
| 3 | 312 | 1,888 | 338 | 2.4e6 | 8.7e6 |
| 5 | 520 | 3,107 | 557 | 3.9e6 | 1.3e7 |

Findings, and why nothing here is final:

- **Nothing consumes Stone or Tide yet.** The Choir Hall is step 2, so the engine costs (50 Stone, ×1.9 per level) look trivial against 668 Stone/s. Rates and costs must be tuned together once the Hall's sinks exist.
- **One lap's Echoes (104) buy most of the unlocks** (Keep Time 10, Cave auto 25, Sea automation 15/40/90). That is probably too generous for a first reset; either the unlock costs rise or the payout falls.
- **Keep Time is worth about 5× the unaided away share** (0.35 → 1.0), as designed. The 8-hour per-return cap (`CATCHUP_CAP`) bounds the windfall.
- Echoes grow each lap linearly with the Echoes held; the multiplier (`1 + 0.1 × Echoes`) is unbounded, so a later pass needs a soft cap or diminishing step.
- A browser-driven "lap 2 faster" run needs the reset and Foundation panels wired into `main.js` (step 1b); this model covers the rules only.

## Choir Hall model (step 2, placeholder numbers)

`node tools/sim/hall-model.mjs [depth] [hearts] [soundings] [hours] [echoes]` plays a greedy player through the Hall using the real rules.
It buys songs first, then the cheapest Hall purchase (district or singer), and an engine only when that leaves the next Hall purchase within reach.
It keeps the choir balanced. It is a crude bot, so treat the timings as a rough shape, not a forecast.

| Start | First district | Belfry | Hall district | All songs | After 12 h |
|---|---|---|---|---|---|
| Strong (depth 105, 5 Heartstones, 40 soundings, 104 Echoes) | 1 min | 29 min | 1.4 h | 1.4 h | Quarry 10, Harbor 7, Belfry 6, Hall 5, Gardens 4; 23 singers |
| Weak (depth 50, 3 Heartstones, 25 soundings, 50 Echoes) | 5 min | 1.6 h | 5.1 h | 5.1 h | Quarry 9, Harbor 5, Belfry 4, Hall 2, Gardens 2; 15 singers |

Findings:

- **Engine costs were the first problem.** At ×1.9 a level against a ×1.6 payoff, engines paid back almost as fast at level 40 as at level 1, so income snowballed and everything was bought out inside half an hour. They now cost 5,000 Stone and grow ×2.2 a level.
- **Echoes drive the lap.** The same bot with 0 Echoes needs 11 minutes for its first district; with 104, one minute. The first reset's payout is therefore the main pacing lever and should be tuned with the Hall, not separately.
- **Tide is the bottleneck.** The Harbor and anything that needs Tide arrives much later than Stone items (13 minutes against 1 minute for a strong start), because the Sea Foundation starts at 0.6 a second and the bot buys no Sea engines. Either raise the Sea base rate or let the Harbor cost less Tide.
- **The Hall district gates the second songbook,** so the whole songbook arrives with it. A strong player gets everything at 1.4 hours; a weak one at 5.1. That spread is wide.
- **Singers do little yet.** After 12 hours a strong run has only 23 of 148 housed singers and about 96 Cadence a second. Cadence is a minor currency until the Festival (step 3) gives it more to buy.
