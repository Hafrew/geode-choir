# The Last Chorus (1.11.0) validation

The 1.11.0 bot plays as before until finale readiness, then pays the 50,000-fathom offering and completes the Last Chorus with Auto assistance (average 50% results; each encounter resolves 25 active seconds after it opens). It reports four marks: `finaleEligible` (requirements met), `finaleReady` (also holds the offering), `finaleEntry` (paid) and `finaleComplete` (last encounter sung).

```bash
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 10 --seed 1 --out results/seed-1.json
# Baseline: the same command on unmodified main (1.10.8), which stops at readiness.
# Expedition only, from a finale-ready save:
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 1 --seed 1 --save ready.json
```

## Results

All runs finished without page errors.

| Seed | 1.10.8 readiness | 1.11.0 readiness | Entry | Completion | Expedition | Fathoms held at entry |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 6.40 h | 6.40 h | 6.40 h | 6.98 h | 0.58 h | 4.87M |
| 2 | 6.11 h | 6.11 h | 6.11 h | 6.68 h | 0.57 h | 3.59M |
| 3 | 5.88 h | 5.88 h | 5.88 h | 6.45 h | 0.57 h | 0.52M |

- **Ordinary play is unchanged.** Every recorded milestone for seeds 1–3 is identical to unmodified main. Readiness here differs from the 1.10.7 table in [Patient Verses](patient-verses.md) (5.94/6.79/6.67 h) because 1.10.8 changed seeded runs (new games start in Calm effects, which sets the particle budget); that predates this release.
- **Eligibility, readiness and entry coincide** for the bot: it already holds far more than the offering when the last requirement (the fifth Heartstone) lands. The 50,000-fathom offering is 1–10% of what it holds, and the proposed 100,000 would be equally small, so the entry price is not a pacing lever.
- **An assisted expedition takes 0.57–0.58 game-hours** (about 34.5 minutes: 1,570 s of encounter gaps plus 20 × 25 s of assistance). Active play skips the 25 s waits, so it should take about 28–30 minutes depending on how quickly encounters are answered. The bot keeps its ordinary production running throughout.
- **Natural mean to completion is 6.70 h** for seeds 1–3, against 6.13 h to readiness.

## Limits

The bot never plays an encounter by hand, so harmony is always 50% (the Quiet ending) and these runs do not measure the timing, clue or pulse difficulty. Manual feel, the harmony thresholds (55%/80%) and the assistance wait need checking with real players. Seeds 4–5 were not rerun for this release.
