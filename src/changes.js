// Newest first. `head` is the release's headline; everywhere else it is just called by its number.
export const CHANGES = [
  { ver: '1.10.5', date: '2026-10-10', head: 'A Steadier Choir', items: [
    'If a save or backup cannot be written, a warning appears once per session. Copy a save code from Settings to keep your progress when browser storage is full or blocked.',
    'Horn, shell and pearl inventories keep their cards in place until the inventory changes. Shell timing and pearl formation still update live.',
    'Large offerings, rewards, progression counts and upgrade descriptions now follow your number-format setting. Imported horn names and collection data are validated before display.',
  ] },
  { ver: '1.10.4', date: '2026-10-09', head: 'Pearl Case', items: [
    'Oysters now sometimes hold a real pearl. Time spent in the Sea slowly forms one (about two minutes), and the next oyster to open reveals it. Each pearl has a rarity, its own name and art, and one to three small Sea bonuses: tide, bell value, crossing bonus, fathoms, or more pearl dust from oysters.',
    'The new Pearl case in the Pearls tab holds every pearl you find. Wear up to three on the strand (bonuses multiply, and any one stat tops out at +60%), take them off, or grind one into pearl dust.',
    'Pearls are kept through every Sounding and Heartstone. The old pearl number is now called pearl dust: it still comes from oysters, still pays for Pearl works and bell casting, and still resets when you sound the depths. Your current dust is unchanged.',
  ] },
  { ver: '1.10.3', date: '2026-10-09', head: 'Luck Evens Out', items: [
    'Sunveins now have bad-luck protection. Every descent from depth 3 down that is not a Sunvein adds one point to the chance, up to five extra points, and the 30th descent in a row without one is always a Sunvein.',
    'The counter resets when a Sunvein arrives and is kept in your save. Open the Gilt chip to see your chance and how many dry descents you have had. Saves from before this update start the count at zero.',
  ] },
  { ver: '1.10.2', date: '2026-10-09', head: 'The Longer Road', items: [
    'The Undersong now asks for five Heartstones and 36 actual soundings (it was three Heartstones and 25), with the same 20 feats and 50,000-fathom offering. Heartstones you already kindled still count.',
    'Heartstones cost more lumen: each one multiplies the price by 25 instead of 10. The first is unchanged. Your next Heartstone may cost noticeably more than it did before this update.',
    'Plumb Line now multiplies fathoms by 1.2 per level instead of 1.25, so fathom income grows more slowly the higher you push it. Levels you already bought are kept.',
  ] },
  { ver: '1.10.1', date: '2026-10-09', head: 'Pearl and Pattern', items: [
    'Seashell inventory and sounding cards now show stable 2D art: ridged Common scallops, patterned Epic spirals, and pearlescent Mythic conches with gold details.',
    'Every shell keeps its appearance through sounding, equipment changes and reloads. Artwork is cosmetic; shell effects, discovery odds and costs are unchanged.',
  ] },
  { ver: '1.10.0', date: '2026-10-09', head: 'Shells Answer', items: [
    'Each successful Sea sounding checks once for a seashell. Discovery starts at 20%; Common, Epic and Mythic are 75%, 20% and 5% of finds. The saved spinner result cannot reroll on reload.',
    'In The Deep, claim Common shells directly. For Epic/Mythic, sound three notes to set depth reduction, or finish with average-quality Auto. Notes pause when you leave. Sounding reductions are fixed at 0, 1 and 3; horn upgrades cannot strengthen shells.',
    'Equip one shell in its own rack. A 500-fathom purchase adds a second slot; Shell Listening costs 25/50/100/200/400/800 fathoms and raises discovery to 50%. Items, upgrades and pending notes survive every reset.',
    'Shell discounts ease Heartstone eligibility only. The Undersong still needs 25 actual soundings and its current 50,000-fathom offering.',
  ] },
  { ver: '1.9.8', date: '2026-10-09', head: 'The Sea Settles', items: [
    'Sea soundings now have a settling timer. It starts at ten minutes and shortens at 2, 5, 10 and 20 actual soundings, down to two minutes. Faster Tick speeds it in either world and while away.',
    'Later Heartstones need 20, 24, 28 and onward total Sea soundings. The first still opens the Sea. An already-met Sea milestone in an old save stays valid for its current Heartstone.',
    'Fathom windfalls from very long waits now taper more sharply; rewards at the tide requirement stay the same.',
    'Tide requirements grow by three per sounding instead of four. Open the Ceiling has higher prices and a 15-level purchase limit; existing levels above 15 keep their bonuses.',
    'The Undersong asks for 25 actual soundings and 50,000 fathoms. Seashell discovery and its minigame are still to come.',
  ] },
  { ver: '1.9.7', date: '2026-10-09', head: 'A Measured Haul', items: [
    'Fathoms grow more slowly when you stay beyond a Sea sounding’s tide requirement. The payout at the requirement is unchanged, as are cave fossil rewards and fathoms already earned.',
  ] },
  { ver: '1.9.6', date: '2026-10-09', head: 'A Faster Call', items: [
    'Faster Tick now speeds horn calls as described. The Horn chip and Sounding countdown show the time remaining at your current tick speed.',
  ] },
  { ver: '1.9.5', date: '2026-10-09', head: 'Patient Choir', items: [
    'The countdown inside Horns → Sounding now updates while you stay on the page, and the waiting call count follows new calls immediately.',
    'The Sunless Sea now has Fuse and Crush corner zones while dragging bells. Fuse joins any twin and stops at Abyssal. Crush removes a bell without a refund. Oysters and pearl works are protected.',
    'After two Heartstones, Patient Choir in Strata costs 100,000 fathoms and permanently unlocks cave upgrade automation. Choose categories and currency reserves; all categories start off. It buys from the ordinary shops while you are in the cave, honoring unlocks, limits and reserves. Owned automation switches keep their on/off setting; horn calls are excluded. Settings survive descents, soundings, Heartstones and reloads.',
  ] },
  { ver: '1.9.4', date: '2026-10-08', head: 'A Listening Rack', items: [
    'Inventory can now equip horns automatically, with Balanced, Cave or Sea priorities. It compares stat and trait effects across both racks, including caps and duplicate traits. Turn it off to wear horns manually.',
    'Choose rarities to salvage newly found spare horns automatically. Equipped horns are kept, and Gilded horns need a separate permission. Filters leave your existing inventory alone. At full capacity, auto-equip keeps a stronger new horn by salvaging the weakest unprotected spare; if everything is protected, the new horn is salvaged instead.',
    'Both settings are off by default and persist through reloads, descents and Heartstones.',
  ] },
  { ver: '1.9.3', date: '2026-10-08', head: 'Ivory Echoes', items: [
    'Every new horn now brings 5 ivory, even when you keep it. Ivory Echo in the Horns upgrades adds 5 per level, up to 30 ivory per horn. It works for manual sounding, auto sounding and progression rewards, and persists through descents and Heartstones.',
    'Salvage now pays 3 ivory for Common, 10 for Rare, 35 for Epic, 75 for Legendary, 250 for Mythic, and 500 for the awakened tier. This is separate from the discovery ivory, so a full inventory pays both. Existing horns keep their stats and can be salvaged at the new prices.',
  ] },
  { ver: '1.9.2', date: '2026-10-08', head: 'The First Voice', items: [
    'Rarity Weaving shifts horn odds upward over ten ivory upgrades. At its peak: Common 5%, Rare 25%, Epic 30%, Legendary 25%, Mythic 15%. The shop shows current and next odds; the Epic-or-better guarantee stays.',
    'Max Rarity Weaving to reveal Awaken the First Voice. Buy it to unlock Primordial horns at 2% (Epic becomes 28%), with Mythic-strength stats and one special passive trait. They have two slots of their own; First Voice Rack adds a third. Gilded Primordials can still appear on Sunveins.',
    'Primordial notes have narrower timing windows and a 6–8 second lead-in. Trait strength scales smoothly from half to one and a half times its base effect. Average gives the base effect; 90% overall performance lets you choose the trait. Auto gives average strength with a random trait. Duplicate traits use the strongest worn copy.',
    'Your horns, slot upgrades, unlock and unfinished soundings carry through descents and Heartstones. Pending trait choices survive save and reload.',
  ] },
  { ver: '1.9.1', date: '2026-10-09', head: 'Text That Scales', items: [
    'The Text size setting now works everywhere. Before, only a few things followed it, because almost all the text was set in fixed pixels. Small, Normal, Large and Huge now scale the side panel, the status strip and its panels, tooltips, buttons, the Horns pages and every dialog. The cave itself stays the same size.',
  ] },
  { ver: '1.9.0', date: '2026-10-09', head: 'The Sunvein', items: [
    'Every floor from depth 3 down now has a character. A floor can be Still, Echoing, Hushed, a Glowworm Bloom or Cracked, and each shifts what the floor gives (hum, lumen, shards, fossils) and how fast it fades. They are balanced so that on average a floor is worth what it always was. You see yours beside the depth, and in the Descend panel.',
    'Sometimes a descent lands on a Sunvein, a floor shot through with gold: 5% of the time, plus 2% for every Golden Horn you own, up to 15%. On a Sunvein the fade is 25% slower, fossils from that floor are +10%, and about half the horns you sound there come out Gilded: a golden look and a further x1.25 on their stats.',
    'A Sunvein also pays Gilt, a new currency that only comes while you stand on one and is never lost. Spend it on the Sunvein section of Strata, and only while you are on a Sunvein: Rich Vein (fossils +10% up to +30%) and Gilded Breath (Gilded horns 50% up to 100% of the time).',
    'The caves now have biomes: every 4 depths the stone changes colour and name (Quartz Hollow, Moss Vaults, Ember Galleries, Brine Caverns, Ashen Deeps, Rose Grotto). Kindling a Heartstone starts again from the Quartz Hollow.',
    'The Collection has a gold column for each shape.',
  ] },
  { ver: '1.8.2', date: '2026-10-09', head: 'A Note for Phones', items: [
    'On a phone or tablet, a small note at the top now says the game is made to be played on a computer. It plays fine on a touch screen, but a mouse and a wide window suit it best. Tap Got it to hide the note; it stays hidden on that device.',
  ] },
  { ver: '1.8.1', date: '2026-10-09', head: 'A Wider Ledger', items: [
    'Drag the edge between the cave and the side panel to make the side panel wider or narrower. Double-click the edge to put it back, or focus it and use the arrow keys. Your width is remembered on this device. On narrow screens the panel stays full width.',
  ] },
  { ver: '1.8.0', date: '2026-10-09', head: 'The Sounding', items: [
    'Horn calls are now sounded by you. When the horn timer runs out, a call waits for you (up to 3). Open it from the Horn chip or the Sounding page: the rarity is spun first, then you play one note for each stat the horn has. Hit the glowing zone with the needle (click, tap, or Space) to set how strong that stat rolls, from half to one and a half times its usual value. Good play also gives a chance at an extra horn.',
    'Prefer not to play? Turn on Sound horns automatically on the Sounding page and every call gives an average result, the same as before. You can also finish a horn with Auto at any point. Keen Ear widens the glowing zone.',
    'Horns that come from descending, sounding the depths and kindling a Heartstone still arrive at once.',
  ] },
  { ver: '1.7.0', date: '2026-10-09', head: 'The Horn Rack', items: [
    'The Horns tab is now four pages: Upgrades, Inventory, Sounding and Collection.',
    'Every horn has its own look, drawn from its shape family, rarity and stats: the body and curl follow the animal, the material follows the rarity, and a gem for each stat sits along it. Your worn horns sit in slots at the top of Inventory; click any horn to inspect, wear or salvage it. Filter by rarity.',
    'Sounding shows the timer to your next horn, the odds, and how close you are to a guaranteed Epic or better.',
    'Collection keeps a gallery of every design you have found, one for each shape and rarity (40 in all).',
    'Horns you already own get a look of their own and are added to the Collection. Nothing about their bonuses changed.',
  ] },
  { ver: '1.6.0', date: '2026-10-09', head: 'The Status Strip', items: [
    'A strip at the top of the cave now shows Descend, the Heartstone and your next horn wherever you are. Each chip has a ring that fills, a countdown or percentage, and a glow when it is ready. Click Descend or Heartstone to open its full panel over the cave, click Horn to jump to the Horns tab. Press Esc or click away to close.',
    'Hover (or tap, or focus) any currency, or the hum count and rate, to see its lifetime total across descents and Heartstones and its best. Fossils, lumen and ivory now keep a lifetime count that Heartstones no longer reset. Saves start from what they already had.',
  ] },
  { ver: '1.5.1', date: '2026-10-09', head: 'Sinking Deeper', items: [
    'The Sinking Stone has a setting: − and + beside it choose how many times what the floor needs you must have sung before it descends on its own, from 1× to 10×. It stays at 2× until you change it. Turning it off, or waiting longer, still pays more fossils than descending early.',
  ] },
  { ver: '1.5.0', date: '2026-10-06', head: 'The Fading Update', items: [
    'Floors go stale. Hum and lumen fade the longer you stay on one floor, from full strength toward a floor of 15%, about every 10 minutes. Descending or kindling starts a fresh floor. The fade runs on real time. The Descend panel shows how fresh the floor is.',
    'Every Heartstone unlocks something against the fade: Deep Roots (the floor rises to 30%), Slow Pulse (the fade takes twice as long), Second Wind (once per floor, a button takes half the age off it), then Echo Memory for each one after.',
    'Faster Tick (Strata, in fossils) makes time gates run 10% faster per level: the descent lock and horn timers. Each Heartstone raises how many levels you can buy.',
    'Heartstones after the first need the sea: 2 soundings for the second, 4 for the third, and so on.',
    'Fossils and fathoms grow with the cube-root-ish curve (run ^ 0.3662), about 850× for a run 100 million times past its threshold. Fuse and Crush drop zones appear after your first descent.',
  ] },
  { ver: '1.4.0', date: '2026-10-05', head: 'The Settling Update', items: [
    'Every repeatable upgrade now has ×5 and Max buttons beside it. ×5 buys up to five levels, Max buys as many as you can afford.',
    'Descents have to settle. After each descent the floor is locked for 10 minutes before you can descend again, and the lock only shortens through four quests, 2 minutes each: Settling In (descend 6 times), Horn Collector (find 8 horns), Voice of the Sea (sound the depths 4 times) and The Mountain\u2019s Mood (kindle 2 Heartstones). See them under Strata.',
    'Fossils and fathoms now grow more slowly the longer you stay in a floor or a sea. A huge run is still better than a small one, but no longer by the square root.',
    'The lock counts while you are away, at your away rate.',
  ] },
  { ver: '1.3.3', date: '2026-10-04', head: 'The Restless Mountain', items: [
    'Heartstones ask for much deeper caves: depth 12 for the first, then about 34, then about 56. Each one now makes you climb a long way down again.',
    'The mountain has moods. Each time you kindle a Heartstone it rolls a mood for the next one: Steady, Generous (a shallower cave will do), Stubborn (a deeper one) or Hungry (twice the lumen). The Heartstone panel tells you before you start climbing.',
    'Below the fifth floor, descents can surprise you: the floor may give way twice and drop you two levels, bury you in rubble (the next floor needs half again as much hum), or open on a vein of extra fossils.',
    'Two new Chronicle pages and a new feat, Freefall.',
  ] },
  { ver: '1.3.2', date: '2026-10-01', head: 'Pacing Pass', items: [
    'Heartstones are slower to earn. Each one now costs 10× the lumen of the one before (10M, 100M, 1B, and so on; it was 5×), and each asks for a deeper cave: depth 12, then 16, then 20.',
    'This stretches the road to the Undersong. The first Heartstone is unchanged in cost and only slightly later in practice.',
    'If you are partway to a Heartstone, you keep everything you have. You may just need more lumen or a deeper cave than before.',
  ] },
  { ver: '1.3.1', date: '2026-10-01', head: 'Freeze Fix', items: [
    'Fixed a freeze: with a lot of Lungs, a single shout in a quiet cave could have more echoes than the cave is allowed to ring at once, which stopped the game. Those echoes now ring together, each one heavier, so no hum is lost.',
  ] },
  { ver: '1.3.0', date: '2026-10-01', head: 'The Finale Update', items: [
    'The story has an ending. From sounding 3 the Deep tab shows the Undersong: three things to do (sound the depths 6 times, kindle 3 Heartstones, earn 20 feats) and a small offering of 25 fathoms to answer it.',
    'Answering plays the finale, then a credits card with your own numbers. Nothing ends: you can keep playing, replay the finale from the Chronicle, and your Stats and Chronicle remember that the Song is complete.',
    'Six new Chronicle pages along the way (depth 5, depth 10, soundings 2, 4 and 6) and a final chapter, so the story keeps pace with you.',
    'New feat The Whole Song, worth +3% to hum and tide.',
    'Version history you can always see: tap the version in the top bar, or Settings → Version history, to read every release.',
    'Fixed: feats worth +3% now say so in their pop-up.',
  ] },
  { ver: '1.2.0', date: '2026-09-30', head: 'The Safekeeping Update', items: [
    'Save codes: copy your save as a line of text and load it back from Settings, on this device or another. A backup of your previous save is kept whenever you load one, reset, or update.',
    'A Stats tab in the Chronicle: time played, shouts, skips, everything you have sung, and how many horns you hold of each rarity.',
    'Keyboard shortcuts: Space shouts, 1 to 9 switch tabs, C opens the Chronicle, M mutes, ? opens Settings.',
    'A Numbers setting: short (1.2M) or scientific (1.2e6).',
    'A welcome-back card after a long time away, showing how long you were gone and what the world sang without you.',
    'The first click on Descend or Sound now tells you what will be reset and what you keep.',
  ] },
  { ver: '1.1.0', date: '2026-09-30', head: 'The Balance Update', items: [
    'Old Echoes, Lantern, Silk Threads and Deep Current now grow at full strength up to level 10, then at half strength. Level 15 Old Echoes is ×27.7 instead of ×51.2.',
    'Amethyst, Citrine and Moonstone crystals, and Bronze, Silver and Abyssal bells, are cheaper, so the upper tiers pay back sooner.',
    'Away earnings start at 35% of your idle rate (was 50%) and stop after 6 hours (was 8). Long Sleep horns still add up to +50%.',
    'Mythic horns roll their multiplier from ×2.5 to ×4 (was up to ×5). Horns you already own keep theirs.',
    'Horn luck: after 25 horns below Epic, the next one is at least Epic.',
    'Wide Cavern makes room for 3 more crystals per level (was 4).',
    'Late feats are worth +3% to hum and tide instead of +2%: Cathedral, Mountain Song, The Bottomless, Lantern Bearer, Thrice Kindled, Tidecaller, Fathomless, Spring Tide, Gilded and Worldsong.',
    'New: this What\u2019s new page, a version line in Settings, and a version stamp on saves.',
  ] },
  { ver: '1.0.0', date: '2026-09-26', head: 'Geode Choir', items: [
    'Two worlds: shout into the crystal cave and descend through older caves, then kindle the Heartstone and skip stones across the Sunless Sea.',
    'Slower pacing, staged unlocks, the Heartstone gate, horns, the Chronicle and feats, light mode and settings.',
  ] },
];
