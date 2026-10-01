# Changelog

Versions follow [semver](https://semver.org). The newest release is also shown in the game, under Settings → What's new.

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
