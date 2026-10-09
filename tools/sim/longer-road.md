# The Longer Road validation — 1.10.2

Natural seeded Chromium runs of the real application on the 1.10.2 balance: finale needs **five Heartstones and 36 actual soundings**, Heartstone lumen cost grows **×25** per Heartstone, Plumb Line gives **×1.2** per level. The bot plays as in the [playable shell validation](playable-seashells.md) (three clicks per second, real purchases, average-quality Auto, 100,000-fathom finale reserve, no Patient Choir). "Finished" means the finale is affordable, not that it has been paid.

## Finish times, seeds 1–3

| Seed | Heartstone 1 | 2 | 3 | 4 | 5 (finale ready) | Actual soundings done |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1.37h | 3.50h | 4.28h | 5.21h | **6.26h** | 4.64h |
| 2 | 1.39h | 3.67h | 4.74h | 5.76h | **6.87h** | 4.64h |
| 3 | 1.36h | 3.50h | 4.46h | 5.43h | **6.54h** | 4.65h |

Mean **6.56h**, range 6.26–6.87h, no browser errors. The 1.10.0 balance (three Heartstones, 25 soundings) had a mean readiness of **4.25h** (3.96–4.85h, seeds 1–5). Waiting on the Sea settling timer cost about 0.77h per run; waiting on tide was about 0.04h.

## What the runs show

- **Cave depth is the gate.** After the first Heartstone, each later one arrives about 0.8–1.1h apart. Depth needed is `12 + 22h + omen - shell`.
- **The 36 soundings are not binding.** They are done about 1.6–2.2h before the fifth Heartstone.
- **Lumen is not a gate.** Lumen produced in each run (decoded from the generated saves): about 3e7 to Heartstone 1 (depth 12), 7e12 to Heartstone 2 (depth 51), 5e12 to Heartstone 3 (depth 53), 3e19 to Heartstone 4 (depth 83). Lumen income rises about 1.25× or more per depth, so any lumen cost is worth only a few extra depth levels; trillions would add minutes. The old costs (1e9 to 1.6e11) are far below the lumen on hand.
- **The early Heartstones were not slowed by the lumen change.** In matching runs with the Patient Choir bot policy, seed 1 reached Heartstone 3 at 4.67h both before and after (the new 6.25e9 cost was already met).

## Comparison with a real save

A player save at 2.58h played had two Heartstones, 32 soundings, 50 descents, best depth 33, and no Sunvein. The bot reaches Heartstone 2 at 3.5–3.7h, so a human can be faster than the bot; a human finish may land nearer 5h than 6.5h. The 21.7 million fathoms held in that save came mostly from one single haul of 21.1 million recorded before the harsher fathom curve; typical income was about 150,000 fathoms per sounding at one sounding per two minutes. A later save (65 descents, 0 Sunveins) is consistent with chance: 0.95^63 is about 4%.

A forced-descent check of 4,000 descents from depth 3 gave a Sunvein rate of 7.4% with one Gilded horn, matching the 5% + 2% rule.

## Pacing lever experiments (not shipped)

Run on scratch copies of `main`, seeds 1–3, same bot flags.

| Variant | Seed 1 | Seed 2 | Seed 3 | Mean | Soundings done at |
|---|---:|---:|---:|---:|---:|
| 1.10.2 (gates 20/24/28/32, finale 36) | 6.26h | 6.87h | 6.54h | 6.56h | 4.65h |
| Sea gates 20/28/36/44, finale 52 | 6.12h | 6.86h | 6.20h | 6.39h | 5.3h |
| Sea gates 20/30/40/50, finale 60 | 6.12h | 7.00h | 6.22h | 6.45h | 5.5–5.65h |

The Sea gates never bind: the soundings are done 0.5–1.5h before Heartstone 5, so the finish time does not move (differences are seed noise). Binding would need about 80+ soundings, which would be a chore of identical actions, so this lever is not used.

Depth step (`12 + 22 × hearts`) variants, same seeds and flags:

| Variant | Seed 1 | Seed 2 | Seed 3 | Mean | Change vs 1.10.2 |
|---|---:|---:|---:|---:|---:|
| Step 22 (1.10.2) | 6.26h | 6.87h | 6.54h | 6.56h | - |
| Step 24 | 6.50h | 7.08h | 6.72h | 6.77h | +0.21h |
| Step 26 | 6.69h | 7.52h | 7.05h | 7.09h | +0.53h |

The effect is much smaller than the naive estimate (about +0.9h and +1.8h from the extra levels): levels get cheaper as lumen and hum income grow with depth, so deeper levels take less time each. A depth step is therefore a weak and nonlinear lever, and it adds more of the repetitive cave loop that players already find flat. It is not the preferred direction (see PLAN.md, 1.10.4).

## Reproduce

```
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 16 --seed 1 --finaleReserve 100000 --out /tmp/final-1.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --seed 1 --hours 6 --stopAtSunvein 1      # stops at the first Sunvein
CHROMIUM=/usr/bin/chromium node tools/sim/make-saves.js --seed 1 --hearts 4                 # writes tools/saves/heartstone-1..4.txt
```

`tools/saves/heartstone-N.txt` hold importable `GC1:` codes (Settings → import) taken just after each Heartstone, from seed 1 with the Patient Choir bot policy (so times differ slightly from the table above): Heartstone 1 at 1.37h, 2 at 3.67h, 3 at 4.67h, 4 at 5.83h.
