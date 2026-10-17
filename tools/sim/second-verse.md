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
