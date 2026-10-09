# Changelog

Versions follow [semver](https://semver.org). The newest release is also shown in the game, under Settings → What's new.

## 1.8.0: The Sounding (2026-10-09)

### Added
- **Horn calls are sounded by you.** When the horn timer runs out a call waits (up to 3; the clock holds while they wait). The Horn chip turns into "Sound horn" and opens the Sounding page. The rarity is spun first, then you play one note for each stat on the horn: a needle sweeps a bar, and you click, tap or press Space when it is in the glowing zone. How close you get sets that stat, from 0.5x to 1.5x its usual value. A mid result is exactly the usual value.
- **Extra horns.** Playing above average gives up to a 25% chance of a second horn with the call.
- **Sound horns automatically** (Sounding page): every call gives an average result straight away, as horns always did before. "Finish with an average result" does the same mid-sounding.
- **Keen Ear** widens the glowing zone as well as shortening the timer.
- Half-played horns are saved: reloading the page keeps your place and the rarity already spun, so a reload can't reroll it.

### Unchanged
- Horns from descending, sounding the depths, kindling a Heartstone and the Horn Call in the rack still arrive at once (or, for the rack, as a waiting call unless auto is on).
- Odds, pity and the horn cap.

### Sim
- `tools/sim` turns on automatic sounding so a bot run behaves as before. With it on, horn rolls use the same random draws in the same order as 1.7.0.

## 1.7.0: The Horn Rack (2026-10-09)

### Added
- **Horns tab in four pages:** Upgrades, Inventory, Sounding, Collection.
- **Unique horn art.** Every horn is drawn from a seed, its shape family (from the animal in its name: curl, tines, sweep, spear, twist, tusk, crescent, conch), its rarity (material, rim, glow, sparkles) and its stats (a gem for each stat, more growth rings on better horns).
- **Inventory:** worn horns sit in slots, a detail view shows the selected horn with Wear/Take off/Salvage, and a rarity filter narrows the grid.
- **Sounding:** the timer to the next horn, the odds, and how many horns remain before a guaranteed Epic or better.
- **Collection:** 40 designs (8 shapes x 5 rarities). Finding a horn, even one salvaged at once, adds it, and it counts how many you've found.

### Existing saves
- Old horns get a seed (so a stable look) and are added to the Collection. Bonuses, odds and pity are unchanged. Horns do not use `Math.random` for their look, so the random stream the sim sees is the same as before apart from the horn name picks.

## 1.6.0: The Status Strip (2026-10-09)

### Added
- **Status strip** at the top of the stage: Descend (or Sound, in the sea), Heartstone and Horn chips, visible on every tab. Each has a ring that fills, a countdown or percentage, and a glow when ready. Descend and Heartstone open their full panel over the cave; Horn jumps to the Horns tab. Esc or a click elsewhere closes the panel, and descending closes it too. The chips drop to a second row on narrower screens.
- **Hover stats.** Hover (or focus, or tap) the hum count and rate, or any currency pill, to see held now, this floor or Heartstone, lifetime, and best. Fossils, lumen and ivory now keep lifetime counts that Heartstones don't reset.

### Changed
- The Descend and Heartstone panels moved out of the side column into the strip's panels. Nothing about how they work changed.

### Existing saves
- Lifetime fossils, lumen and ivory start from what your save still knows (this Heartstone's totals and held ivory), so they may start low. Bests start at 0 and fill in as you play.

## 1.5.1: Sinking Deeper (2026-10-09)

### Added
- **Sinking Stone setting.** A − and + beside the Sinking Stone set how many times what the floor needs you must have sung before it descends on its own, from 1x to 10x. The default stays at 2x, so nothing changes until you touch it. Turning the stone off, or waiting longer, still pays more fossils than descending early, because fossils grow with how far past the threshold you sang.

### Existing saves
- Saves get 2x. Nothing is removed or refunded.

## 1.5.0: The Fading Update (2026-10-06)

### Added
- **Floor freshness (decay).** Hum and lumen fade the longer you stay on one floor: income is `floor + (1 - floor) * e^(-t / τ)`, with t the real seconds since your last descent or Heartstone. It starts at a floor of 15% and τ of 10 minutes. It runs on real time and is never sped up by Faster Tick. The Descend panel shows the current freshness, and away time fades too.
- **One offset per Heartstone.** 1st: Deep Roots (floor 30%). 2nd: Slow Pulse (τ ×2). 3rd: Second Wind (once per floor, a button takes half the age off). Each one after: Echo Memory (+5% floor, τ +25%). The Heartstone panel names the next one.
- **Faster Tick** (Strata, fossils): +10% time-gate speed per level (the descent lock, horn timers). Costs 3 × 3.2^level fossils. The level cap is 2 + 3 per Heartstone kindled.
- **Sea requirement for Heartstones.** After the first, each needs 2 more soundings than the last (2, 4, 6, ...).
- **Fuse and Crush zones.** Unlocked by your first descent (saves that have already descended get them at once). While you drag a crystal in the cave, two drop zones appear at the foot of the screen. Dropping a stone on Fuse joins it with any twin in the cave; dropping it on Crush breaks it up to free the space. Not available for wonders or in the sea.

### Changed
- **Gentler bend on fossils and fathoms.** The multiplier from a long run is now (how far past the threshold)^0.3662 (was 1 + 0.7 ln). A floor sung 100 times past its threshold gives about 5.4x (was 4.2x), 10,000 times about 29x (was 7.4x), and 100 million times about 850x (was 13.9x). Just past the threshold it is a little lower (1.66x at 4x, was 2.0x).

### Existing saves
- Nothing is removed or refunded. A save partway to a Heartstone may need more soundings than before. Your current floor starts at full freshness.

## 1.4.0: The Settling Update (2026-10-05)

### Added
- **×5 and Max buttons** beside every repeatable upgrade (levelled upgrades, crystals and bells). They repeat the normal purchase up to 5 times, or as many times as you can afford.
- **Descent lock ("settling").** After each descent the floor is locked for 10 minutes. Four quests each shorten it by 2 minutes, down to 2: Settling In (descend 6 times), Horn Collector (find 8 horns), Voice of the Sea (sound the depths 4 times) and The Mountain's Mood (kindle 2 Heartstones). The quests are listed under Strata. The lock counts while you are away at your away rate. Heartstones reset it. Completing a quest also takes 2 minutes off a lock already running. The Sinking Stone respects it too.
- A `tickRate()` hook that every time gate now runs through, ready for upgrades that speed time up.

### Changed
- **Fossils and fathoms bend.** Gain from a descent or sounding used to grow with the square root of what you sang or rang. It now grows as 1 + 0.7 ln(ratio), so a floor sung 100 times past its threshold gives about 8 fossils at depth 0 (was 20) and one sung 100 million times past gives 27 (was 20,000).

### Existing saves
- Nothing is removed or refunded. Quests you already qualify for complete silently. The descents quest counts your deepest cave as descents so far.

## 1.3.3: The Restless Mountain (2026-10-04)

### Changed
- **Steeper Heartstone depth gates.** The first Heartstone still asks for depth 12. Each later one asks for 22 more depth than the one before (about 34, then about 56), instead of 4 more.

### Added
- **Mountain moods.** Each time you kindle a Heartstone, the mountain rolls a mood for the next one: Steady (40%, no change), Generous (20%, 6 less depth), Stubborn (20%, 8 more depth) or Hungry (20%, twice the lumen). The Heartstone panel shows it, so a climb can be planned. The first Heartstone is always Steady.
- **Descent surprises** from depth 6: 8% the floor gives way twice (you fall one floor further), 10% you land in rubble (that floor needs 1.5x the hum), 12% you land on a vein (+25% fossils, at least 1).
- Two Chronicle pages ("Moods", "Uneven Ground") and the feat Freefall (35 feats in total).

### Why
Simulated play with `tools/sim` showed the finale arriving in about 4 to 5 game-hours at a 2-second action pace, with the Heartstone climbs repeating the same way each time. Lumen cost alone barely moved it, because lumen income roughly doubles every 15 minutes while climbing. Depth is the roughly linear lever, and the moods and surprises keep each climb from playing out the same.

### Existing saves
- Nothing is removed. A save partway to a Heartstone keeps everything but may need a deeper cave than before. Saves from before this version count as Steady.

## 1.3.2: Pacing Pass (2026-10-01)

### Changed
- **Heartstones cost more lumen:** each costs 10× the previous (10M, 100M, 1B, 10B), was 5× (10M, 50M, 250M, 1.25B).
- **Heartstones ask for a deeper cave:** depth 12 for the first, 16 for the second, 20 for the third, and so on (was 12 every time).
- The first Heartstone's lumen cost and depth are unchanged.

### Why
The progression simulator (`tools/sim`) showed a bot acting every 2 seconds reaching the finale in about 4.5 to 6 game-hours, with lumen for the later Heartstones as the limiting step. The target is about 10 hours at that pace, and the slower 5-second pace should land in the 15 to 20 hour range.

### Existing saves
- Nothing is removed or refunded. A save partway to a Heartstone keeps its lumen and depth but may need more of either than before.

## 1.3.1: Freeze Fix (2026-10-01)

### Fixed
- A freeze when one shout had more echoes than the particle budget while the cave was empty (possible late-game with a lot of Lungs, or on a slow device where the budget shrinks). The echoes now ring together, each one heavier, so no hum is lost.

### Added
- `tools/sim/`: a progression simulator that plays the real game with a bot to estimate time to the finale. It is development tooling and is not part of the game.

## 1.3.0: The Finale Update (2026-10-01)

### Added
- **The Undersong.** From sounding 3 the Deep tab shows the final goal at the top: sound the depths 6 times, kindle 3 Heartstones, earn 20 feats, then make an offering of 25 fathoms.
- **The finale scene** (five cards, with your own totals in the text) and a **credits card** with your stats. Answering does not end the run. The finale can be replayed from the Chronicle or from the Deep tab.
- **Six new Chronicle pages** at depth 5, depth 10 and soundings 2, 4 and 6, plus a seventh chapter, "The Whole Song". Existing saves are credited quietly for pages they already qualify for.
- **Feat: The Whole Song** (+3% hum and tide, like the other late feats). There are now 34 feats.
- **Version history, always visible.** The version sits next to the title and opens the full history; Settings → Version history opens the same list. Every release is listed, the newest expanded. Opening the history does not mark an update as seen.
- The Chronicle header and the Stats tab show that the Song is complete.

### Fixed
- The pop-up for +3% feats said +2%.

### Notes
- The finale gate (6 soundings, 3 Heartstones, 20 feats, 25 fathoms) is untested against real play. If it feels too easy or too hard it is four numbers to change.
- No other balance changed, apart from the new feat's +3%.

## 1.2.0: The Safekeeping Update (2026-09-30)

### Added
- **Save codes.** Settings → Save code copies your whole save as one line of text (`GC1:…`) and loads it back, on this device or another. Loading asks for a second click.
- **Backup slot.** The save as it was before it was replaced is kept whenever you load a code, restore, forget everything, or open the game after an update. Settings → Restore backup swaps it back (your current save becomes the backup).
- **Stats tab** in the Chronicle: time played, shouts, stones thrown, hum and tide sung, deepest cave, soundings, Heartstones, fuses, biggest chord, booms, shards, crossings, pearls, horns found and held by rarity, feats and pages.
- **Keyboard shortcuts:** Space shouts or throws a stone, 1–9 switch tabs, C opens the Chronicle, M mutes, ? opens Settings. Shortcuts are listed in Settings and are off while typing or while a window is open.
- **Numbers setting:** short (1.2M) or scientific (1.2e6, from a million up).
- **Welcome-back card** after 5 or more minutes away: how long, what was earned, and the away rate. Shorter absences still use the whisper. The What's new page waits until the card is closed.
- **Descend and Sound warning.** The first click now says what resets and what you keep.

### Notes
- Time played counts from 1.2.0 for existing saves.
- No balance numbers changed.

## 1.1.0: The Balance Update (2026-09-30)

### Balance
- **Soft cap on uncapped multipliers.** Old Echoes, Lantern, Silk Threads and Deep Current grow at full strength up to level 10, then at half strength (×1.3 becomes ×1.15 per level; Silk ×1.35 becomes ×1.175). Prices are unchanged. Old Echoes at level 15 is ×27.7 instead of ×51.2, and at level 20 ×55.8 instead of ×190.
- **Cheaper upper tiers.** Base costs now: Amethyst 110 (was 150), Citrine 1,500 (was 2,500), Moonstone 22,000 (was 40,000); Bronze Bell 150 (was 200), Silver Bell 2,000 (was 3,500), Abyssal Bell 30,000 (was 60,000). Cost per point of value at the first purchase of each tier: crystals 12 / 36.7 / 166.7 / 814.8 (was 12 / 50 / 277.8 / 1481.5), bells 15 / 50 / 222.2 / 1111.1 (was 15 / 66.7 / 388.9 / 2222.2).
- **Away earnings.** Base rate 35% of idle rate (was 50%), capped at 6 hours (was 8). Long Sleep horns still add up to +50%.
- **Mythic horns.** Multiplier lines roll ×2.5 to ×4 (was ×2.5 to ×5). Horns you already own keep their values.
- **Horn pity.** After 25 horns in a row below Epic, the next horn is at least Epic. The counter survives descents and Heartstones.
- **Wide Cavern** makes room for 3 more crystals per level (was 4). Maximum cave size is 38 crystals (was 44).
- **Feats.** Ten late feats are worth +3% to hum and tide instead of +2%: Cathedral, Mountain Song, The Bottomless, Lantern Bearer, Thrice Kindled, Tidecaller, Fathomless, Spring Tide, Gilded, Worldsong.

### Existing saves
- Saves from 1.0.0 get a one-time refund for what the nerfs took away: about 47% of the fossils, lumen or fathoms spent on levels past 10 of the capped multipliers, and 25% of the fossils spent on Wide Cavern. The refund is shown in the What's new page.
- Nothing else is removed. Crystals above the new Wide Cavern limit stay in place; you just can't buy more until you have room.

### Added
- What's new page (opens once after an update; reopen it from Settings).
- Version line in Settings, and a version stamp on saves so later updates can migrate them.
- This changelog.

## 1.0.0 (2026-09-26)
- Geode Choir: an idle game in two worlds. Slower pacing, staged unlocks, the Heartstone gate, horns, the Chronicle and feats, light mode and settings.
