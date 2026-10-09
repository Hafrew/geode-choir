# Playable seashell validation — 1.10.0

## Natural runs with a proposed 100,000-fathom reserve

Accelerated seeded Chromium runs load the real application. The bot clicks three times per second, spends actual earned currency through game shops, fuses normally, sounds horns at average quality, and spends 25% of time in the Sea until the third Heartstone. It completes actual discovered shells with Auto, equips the strongest rarity/depth loadout through real equip actions, and includes both shell purchases in normal shop selection. No counts, shells, currencies, or progression unlocks are gifted.

The bot protects **100,000 fathoms from sounding three onward**. It continues past 25 sounds if the budget is short. “Finished” here means three Heartstones, at least 25 actual soundings, 20 feats, and the protected balance; it does **not** pay a hypothetical 100k offering or play the unimplemented expedition. The runtime still charges **50,000**; actual once-only payment is covered by the existing Sea browser suite. Post-100k balances below are arithmetic projections.

| Seed | Readiness time | Actual sounds | Common / Epic / Mythic | Purchases | Lifetime fathoms | Held before entry | After proposed 100k payment |
|---|---:|---:|---|---|---:|---:|---:|
| 1 | 3.958h | 25 | 5 / 1 / 1 | 6/6 · 2 slots | 529,543 | 171,334 | 71,334 |
| 2 | 4.078h | 25 | 9 / 2 / 1 | 6/6 · 2 slots | 9,532,746 | 864,720 | 764,720 |
| 3 | 4.125h | 25 | 5 / 2 / 1 | 6/6 · 2 slots | 144,455,934 | 3,045,272 | 2,945,272 |
| 4 | 4.849h | 26 | 5 / 0 / 0 | 1/6 · 1 slots | 1,106,602 | 1,105,966 | 1,005,966 |
| 5 | 4.260h | 25 | 4 / 2 / 0 | 6/6 · 2 slots | 2,620,756 | 261,356 | 161,356 |

Mean readiness is **4.254h**, range **3.958–4.849h**. All five finish with no browser errors. Four buy maximum discovery and both slots; seed 4 only buys the first discovery level, finds five Commons, and still finishes with one equipped slot. Three seeds naturally find a Mythic; seed 5 equips two distinct Epics. Natural Mythic finds are not a prerequisite.

The four fully upgraded runs buy the second slot / max discovery around **2.63–3.79h**. Common/Epic/Mythic conditional odds and 20%/50% discovery bounds are independently checked with 60,000 seeded rule trials; these five gameplay samples alone do not establish odds accuracy. Browser/rule fixtures cover two identical Mythics, maximum discounts, and manual perfect/poor quality ranges separately.

## Budget and time-share sensitivity

| Seed-1 policy | Finish time | Actual sounds | Shells C/E/M | Discovery / slots | Held | Patient Choir owned |
|---|---:|---:|---|---|---:|---|
| Ignore shells and their shops | 4.594h | 26 | 0 / 0 / 0 | 0/6 · 1 | 696,881 | No |
| Reserve another 100k and buy Patient Choir | 4.869h | 54 | 3 / 3 / 2 | 0/6 · 1 | 124,842 | Yes |
| 50% Sea time | 4.467h | 39 | 3 / 4 / 0 | 1/6 · 1 | 104,187 | No |

Ignoring shells leaves discoveries pending, while preserving actual discovery draws; it disables completion, equipment and shell purchases, not the runtime discovery path. That run finishes in **4.594h**, versus **3.958h** using shells (13.84% shorter for this paired seed). Later random draw order may diverge through changed progression; this is not a universal shell speedup estimate. The older 1.9.8 five-seed mean of 4.667h used a 50k reserve and no discovery, so it is context rather than a controlled comparison of this pass.

Patient Choir is actually bought at **4.869h**, with **124,842 fathoms remaining** and the 100k finale budget protected. Its earlier finale-budget readiness mark is **4.729h**; the table reports completion of both goals. This policy buys no shell upgrades and uses a naturally found Mythic in one slot. The 50%-Sea profile also finishes, but needs 39 sounds to fund the reserve. Lower reinvestment under large reserves can require extra soundings; these targets are dynamic, not a hard stop at 25.

**Balance limitation:** lifetime fathoms vary from about 530k to 144m in the five main runs; Plumb Line reinvestment and overrun/production variance still produce a wide economy. The 100k proposal is reachable in every sampled policy, but this is not evidence that it is an equally meaningful sink for every player. Prices and manual timing need playtest feedback; do not raise the runtime offering in this shell release based solely on the largest balance.

## Gameplay and saves

- 29 horn/automation/shell/Sea rule tests pass. Shell checks include odds, fixed sounding reductions, quality ranges, two-slot stacking, real Heartstone eligibility, malformed-save normalization, once-only discoveries/completion, all resets, saved partial notes and separate fossil/fathom curves.
- All six browser suites pass at 1100px and 390px. The shell suite exercises real equipment and purchase clicks, manual first note plus reload, average Auto after partial play, paused clocks off-screen/hidden, full-slot blocking, a real successful sounding and immediate locked retry, saved discovery result, direct Common claim, and overflow/error checks.
- UI needles update without rebuilding focused buttons each frame; keyboard focus is preserved across note progression. Spinner animation presents the persisted result and does not replay on equipment changes. Reduced-motion disables reveal rotation; Auto remains available for timing.
- Shell inventory is uncapped in this pass, with no forced salvage or Collection expansion. Common shells can be claimed directly because performance cannot alter their fixed benefit. Epic/Mythic use three notes, one-second lead-ins, narrower Mythic windows and no miss deadline. Manual notes pause rather than consuming offline time.

## Reproduce

```bash
node --test tools/horns.test.mjs tools/automation.test.mjs tools/seashells.test.mjs tools/sea-pacing.test.mjs
CHROMIUM=/usr/bin/chromium node tools/seashells-smoke.js
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 12 --seed 1 --finaleReserve 100000 --out /tmp/shells-1.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 12 --seed 1 --finaleReserve 100000 --shells 0 --out /tmp/shells-noshell.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 12 --seed 1 --finaleReserve 100000 --patientChoir 1 --out /tmp/shells-patient.json
CHROMIUM=/usr/bin/chromium node tools/sim/run.js --hours 12 --seed 1 --finaleReserve 100000 --sea 0.5 --out /tmp/shells-sea50.json
```

Repeat the main run for seeds 2–5. Raw JSON includes shell outcome logs, shop levels, real counters, earned/held fathoms and effective-gate snapshots. Files were written to `/tmp/shells-*.json`; this report retains the key results if temporary files expire.

## Next pass

**1.11.0 — The Last Chorus:** implement persisted once-only entry and chapter progress, five accessible encounters, harmony/cosmetic ending variations, average assistance, and the separate paused active-time expedition clock. Extend simulation from readiness to actual paid completion. Decide the offering using these budget results and manual shell feedback; 100k remains proposed.
