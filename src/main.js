import { createShellUI } from './shell-ui.js';
import { createPearlUI } from './pearl-ui.js';
import { PEARL_RARITY, PEARL_SLOTS, tickPearls, openOyster, applyPearls, bestPearls, equipPearl as equipPearlItem, grindPearl as grindPearlItem } from './pearls.js';
import { discoverShell, finishShell, equipShell, SHELL_SLOT_COST, shellDiscoveryCost, shellDiscoveryChance } from './seashells.js';
import { CAVE_AUTOMATION_COST, CAVE_CATEGORIES, CAVE_RESERVES, runCaveShopping } from './automation.js';
import { KNEE, resetDescent, resetSounding, resetHeartstone, decayTime, sunveinArrival,
  soundingReady, advanceSeaTimer, seaLock, FINALE_SOUNDINGS, FINALE_HEARTS, PLUMB_STEP, SONG_FATHOMS, CEILING_MAX, CEILING_BASE, CEILING_GROWTH,
  depthThreshold, seaThreshold, fossilReward, fathomReward, sunPityBonus, sunveinRoll, SUN_GUARANTEE, heartLumenCost, heartDepthRequired, heartSeaRequired, kindleReady } from './progression.js';
import { serializeState, restoreState, cmpVer } from './saves.js';
import { applyAutoEquip, acquireHorn, IVORY_LEVELS, discoveryIvory, grantDiscoveryIvory, RARITY, HSTATS, PRIMORDIAL, RARITY_LEVELS, PITY_AT, TRAITS, TRAIT_CHOICE_AT,
  hash32, rng32, FAMS, FAM_OF, famOf, rarityOdds, rarityRevealed, primordialUnlocked, visibleRarities,
  normalSlots, primordialSlots, equippedIds, AUTO_P, traitValue, traitQuality, activeTraits,
  hornBoost as hornRuleBoost, lineValue, hornBonuses, recordCollection,
  rollHornPlan, createHorn, soundingDifficulty } from './horns.js';
import { createState } from './state.js';

(() => {
  // Only the simulation runner supplies this object, before the module loads.
  const simulation = window.__geodeSimulation;
  const $ = id => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const bg = document.createElement('canvas'), bctx = bg.getContext('2d');
  const KEY = 'geode-choir-v1';
  const VERSION = '1.10.4';
  // Release channel shown beside the version; saves and version checks use VERSION alone.
  const CHANNEL = 'beta';
  // Newest first. `head` is the release's headline; everywhere else it is just called by its number.
  const CHANGES = [
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


  // =====================================================================
  // content
  // =====================================================================
  const TIERS = [
    { name: 'Quartz',    color: '#e3edf5', glow: '#bcdcff', value: 1,  base: 12,    g: 1.30, r: 11 },
    { name: 'Amethyst',  color: '#b58cff', glow: '#b58cff', value: 3,  base: 110,   g: 1.30, r: 12.5 },
    { name: 'Citrine',   color: '#ffc766', glow: '#ffbf5a', value: 9,  base: 1500,  g: 1.30, r: 14 },
    { name: 'Moonstone', color: '#a4f2d6', glow: '#8ff2e6', value: 27, base: 22000, g: 1.30, r: 15.5 },
  ];
  const WONDERS = {
    prism:     { name: 'Prism',     r: 13, base: 6,  g: 1.8, max: 4, desc: 'Splits echoes: one bounces back, a twin passes straight through.' },
    lodestone: { name: 'Lodestone', r: 11, base: 10, g: 2.0, max: 3, desc: 'Bends nearby echoes toward itself. Put crystals around it.' },
    gong:      { name: 'Gong',      r: 20, base: 25, g: 2.2, max: 3, desc: 'Drinks echoes until full, then booms: a double shout that rings every crystal near it.' },
  };
  const BELLS = [
    { name: 'Tin Bell',     color: '#bdb8b0', value: 1,  base: 15,    g: 1.30, r: 11 },
    { name: 'Bronze Bell',  color: '#d0955a', value: 3,  base: 150,   g: 1.30, r: 12.5 },
    { name: 'Silver Bell',  color: '#dfe6ee', value: 9,  base: 2000,  g: 1.30, r: 14 },
    { name: 'Abyssal Bell', color: '#6fe3d0', value: 27, base: 30000, g: 1.30, r: 15.5 },
  ];
  const PEARLOBJ = {
    breakwater: { name: 'Breakwater', r: 12, base: 6,  g: 1.8, max: 4, desc: 'When a ripple reaches it, it sends out a ripple of its own.' },
    raft:       { name: 'Drum Raft',  r: 12, base: 10, g: 2.0, max: 3, desc: 'Beats a ripple every 3 seconds, forever.' },
    whirlpool:  { name: 'Whirlpool',  r: 14, base: 20, g: 2.2, max: 3, desc: 'Bells inside its pull ring for ×2.' },
  };
  const OYSTER_R = 12;
  const MODES = [
    { name: 'Major pentatonic', steps: [0, 2, 4, 7, 9] },
    { name: 'Minor pentatonic', steps: [0, 3, 5, 7, 10] },
    { name: 'Hirajoshi',        steps: [0, 2, 3, 7, 8] },
    { name: 'Dorian',           steps: [0, 2, 3, 5, 7, 9, 10] },
    { name: 'Whole tone',       steps: [0, 2, 4, 6, 8, 10] },
    { name: 'Lydian',           steps: [0, 2, 4, 6, 7, 9, 11] },
  ];
  const MAX_P = 1400, GONG_CAP = 25, MAX_R = 220, HORN_CAP = 30;
  // Live budgets. The governor shrinks these when frames run slow; extra voices fold into the survivors.
  let capP = 900, capR = 160, frameMs = 6;

  // =====================================================================
  // state
  // =====================================================================
  const fresh = () => createState(VERSION);
  let S = fresh();

  // =====================================================================
  // derived numbers
  // =====================================================================
  let HB = {};
  const hornBoost = h => hornRuleBoost(S, h);
  const lineVal = (h, l) => lineValue(S, h, l);
  function computeHB() { HB = applyPearls(hornBonuses(S), S); }
  computeHB();

  // Multipliers that never cap grow at full strength up to a knee, then at half strength.
  const softPow = (b, l) => Math.pow(b, Math.min(l, KNEE)) * Math.pow(1 + (b - 1) / 2, Math.max(0, l - KNEE));
  const featMult = () => 1 + FEATS.reduce((a, f) => a + (S.feats[f.id] ? (f.w || 2) : 0), 0) / 100;
  const heartMult = () => Math.pow(3, S.hearts) * featMult();
  const priceK = () => 1 - HB.cost;
  const AWAY_CAP = 6 * 3600;
  const offlineEff = () => Math.min(1, 0.35 + HB.offline);
  // cave
  const shoutN = l => 6 + 3 * l + HB.lungs;
  const retainAt = l => Math.min(0.95, 1 - 0.4 * Math.pow(0.88, l));
  const polishAt = l => Math.pow(1.4, l);
  const humMult = () => Math.pow(1.6, S.depth) * softPow(1.3, S.strata.old) * softPow(1.3, S.illum.lantern) * heartMult() * HB.hum;
  const sinkMult = () => { const m = Math.round(+S.toggles.sinkMult); return m >= 1 && m <= 10 ? m : 2; };
  const deepenAt = () => depthThreshold(S);
  // After every descent the floor has to settle. Only quests shorten it. All time gates run through tickRate().
  const LOCK_BASE = 600, LOCK_STEP = 120, LOCK_MIN = 120;
  // Faster Tick speeds every time gate (the descent lock, Sea settling, horn timers). It never touches the floor's fade, which runs on real time.
  const tickMax = () => 2 + 3 * S.hearts;
  const tickRate = () => Math.pow(1.1, S.strata.tick || 0);
  // Floor freshness: hum and lumen fade the longer you stay on one floor, from full strength toward a floor.
  // Each Heartstone unlocks something that offsets it. Descending or kindling starts a fresh floor.
  const decayFloor = () => 0.15 + (S.hearts >= 1 ? 0.15 : 0) + 0.05 * Math.max(0, S.hearts - 3);
  const decayTau = () => decayTime(S, floorTau(), HB.traits.memory || 0);
  const freshAt = t => { const f = decayFloor(); return f + (1 - f) * Math.exp(-t / decayTau()); };
  const freshAvg = (t0, t1) => {
    if (t1 - t0 < 1e-6) return freshAt(t0);
    const f = decayFloor(), tau = decayTau();
    return f + (1 - f) * tau * (Math.exp(-t0 / tau) - Math.exp(-t1 / tau)) / (t1 - t0);
  };
  const HOFFSETS = [
    ['Deep Roots', 'the freshness floor rises from 15% to 30%'],
    ['Slow Pulse', 'the fade takes twice as long'],
    ['Second Wind', 'once per floor, a button takes half the age off it'],
    ['Echo Memory', 'the floor rises by 5% and the fade slows by a quarter'],
  ];
  const nextOffset = () => HOFFSETS[Math.min(S.hearts, HOFFSETS.length - 1)];
  const windReady = () => S.hearts >= 3 && !S.wind;
  let decayF = 1;

  // ---------------------------------------------------------------------
  // floor identities, the Sunvein, and biomes
  // ---------------------------------------------------------------------
  // From depth 3 each floor has a character. The multipliers are scaled so that, weighted by how often each turns up,
  // hum, lumen, shards and fossils average exactly 1.0 over many floors: a floor is worth what it always was, but not every floor is the same.
  const FLOORS = {
    still:   { name: 'Still',          p: 0.28, hum: 1,    lumen: 1,   shards: 1,   fossils: 1,    tau: 1,    text: 'Nothing sets this floor apart.' },
    echoing: { name: 'Echoing',        p: 0.18, hum: 1.25, lumen: 1,   shards: 0.9, fossils: 1,    tau: 0.75, text: 'Every echo carries further, and fades sooner.' },
    hushed:  { name: 'Hushed',         p: 0.18, hum: 0.85, lumen: 1,   shards: 1,   fossils: 1.1,  tau: 1.4,  text: 'A quiet floor that keeps its voice.' },
    bloom:   { name: 'Glowworm Bloom', p: 0.18, hum: 0.9,  lumen: 1.6, shards: 0.8, fossils: 1,    tau: 1,    text: 'The ceiling is thick with light.' },
    cracked: { name: 'Cracked',        p: 0.18, hum: 1,    lumen: 0.9, shards: 1.8, fossils: 0.95, tau: 1,    text: 'The stone sheds more than it should.' },
  };
  const FLOOR_N = {};
  for (const k of ['hum', 'lumen', 'shards', 'fossils']) FLOOR_N[k] = 1 / Object.values(FLOORS).reduce((a, f) => a + f.p * f[k], 0);
  const onSun = () => S.floor === 'sunvein';
  const floorMod = k => (onSun() ? 1 : (FLOORS[S.floor] || FLOORS.still)[k] * FLOOR_N[k]);
  const floorTau = () => (onSun() ? 1 / 0.75 : (FLOORS[S.floor] || FLOORS.still).tau);
  const rollFloor = () => { let x = Math.random(); for (const k of Object.keys(FLOORS)) { if (x < FLOORS[k].p) return k; x -= FLOORS[k].p; } return 'still'; };
  // The Sunvein: a rare gold floor. The chance rises with every Golden Horn you own; Risky Descents (later) add a flat bonus on top.
  const SUN_BASE = 0.05, SUN_PER_HORN = 0.02, SUN_CAP = 0.15, GILT_RATE = 0.08, GILT_CAP = 45, GILT_LUMP = 5;
  const goldHorns = () => S.horns.reduce((n, h) => n + (h.gold ? 1 : 0), 0);
  const sunChance = (bonus = 0) => Math.min(SUN_CAP, SUN_BASE + SUN_PER_HORN * goldHorns()) + bonus;
  const sunFossilBonus = () => 0.10 + 0.05 * S.goldUp.vein;
  const goldHornChance = () => Math.min(1, 0.5 + 0.1 * S.goldUp.breath);
  const BIOMES = [
    { name: 'Quartz Hollow', hue: 268 }, { name: 'Moss Vaults', hue: 140 }, { name: 'Ember Galleries', hue: 18 },
    { name: 'Brine Caverns', hue: 195 }, { name: 'Ashen Deeps', hue: 232 }, { name: 'Rose Grotto', hue: 330 },
  ];
  const biomeIdx = d => Math.floor(Math.max(0, d) / 4) % BIOMES.length;
  const fmt2 = n => String(+n.toFixed(2));
  function floorBlurb() {
    const bi = BIOMES[biomeIdx(S.depth)].name;
    if (onSun()) return `<b class="gold">Sunvein</b> in the ${bi}: the fade is 25% slower, fossils from this floor are +${Math.round(sunFossilBonus() * 100)}%, and horns you sound here are gilded ${Math.round(goldHornChance() * 100)}% of the time. Gilt this floor: <b class="gold">${Math.floor(S.giltFloor)} / ${GILT_CAP}</b>.`;
    const f = FLOORS[S.floor] || FLOORS.still;
    const d = [['hum', 'hum'], ['lumen', 'lumen'], ['shards', 'shards'], ['fossils', 'fossils']].map(([k, l]) => { const m = floorMod(k); return Math.abs(m - 1) > 0.02 ? `${l} ×${fmt2(m)}` : ''; }).filter(Boolean);
    if (f.tau < 1) d.push('fades sooner'); else if (f.tau > 1) d.push('fades later');
    return `<b>${f.name}</b> floor in the ${bi}. ${f.text}${d.length ? ' ' + d.join(', ') + '.' : ''}`;
  }
  const QUESTS = [
    { id: 'settle', name: 'Settling In',          desc: 'Descend 6 times.',            have: () => S.stats.descents,   need: 6 },
    { id: 'horns',  name: 'Horn Collector',       desc: 'Find 8 horns.',               have: () => S.stats.hornsFound, need: 8 },
    { id: 'sea',    name: 'Voice of the Sea',     desc: 'Sound the depths 4 times.',   have: () => S.sea.soundings,    need: 4 },
    { id: 'moods',  name: 'The Mountain\u2019s Mood', desc: 'Kindle 2 Heartstones.',  have: () => S.hearts,           need: 2 },
  ];
  const questsDone = () => QUESTS.filter(q => S.quests[q.id]).length;
  const descentLock = () => Math.max(LOCK_MIN, LOCK_BASE - LOCK_STEP * questsDone());
  // Gains from a long run bend: a bigger run is still worth more, but ever more slowly.
  const fossilGain = () => fossilReward(S, HB.fossils, floorMod('fossils'), onSun() ? 1 + sunFossilBonus() : 1);
  const maxCrystals = () => 8 + S.lv.chisel + 3 * S.strata.wide;
  const crackAt = () => 40 * Math.pow(0.8, S.strata.fault);
  const shardsOn = () => S.depth >= 3;
  const lumenMult = () => softPow(1.35, S.illum.silk) * Math.pow(1.25, S.depth) * Math.pow(2, S.hearts) * HB.lumen;
  const crystalCost = t => Math.ceil(TIERS[t].base * Math.pow(TIERS[t].g, S.bought[t] || 0) * priceK());
  const wonderCost = k => Math.ceil(WONDERS[k].base * Math.pow(WONDERS[k].g, S.wBought[k] || 0));
  const attuneCost = t => Math.ceil(4 * (t + 1) * Math.pow(2.1, S.attune[t]));
  // Each Heartstone asks for a deeper cave and more lumen, and the mountain rolls a mood for the next one when you kindle.
  const OMENS = {
    steady:   { name: 'Steady',   p: 0.4, depth: 0,  lumen: 1, text: 'It asks what it always asks.' },
    generous: { name: 'Generous', p: 0.2, depth: -6, lumen: 1, text: 'The stone is thin: a shallower cave will do.' },
    stubborn: { name: 'Stubborn', p: 0.2, depth: 8,  lumen: 1, text: 'The stone is thick: it wants a deeper cave.' },
    hungry:   { name: 'Hungry',   p: 0.2, depth: 0,  lumen: 2, text: 'It will take twice the lumen.' },
  };
  const omen = () => OMENS[S.omen] || OMENS.steady;
  const rollOmen = () => { let x = Math.random(); for (const k of Object.keys(OMENS)) { if (x < OMENS[k].p) return k; x -= OMENS[k].p; } return 'steady'; };
  const heartCost = () => heartLumenCost(S, omen());
  const heartDepth = () => heartDepthRequired(S, omen());
  // The first Heartstone opens the sea. Each one after that asks the sea to have been sounded 2 more times.
  const heartSea = () => heartSeaRequired(S);
  // sea
  const bellCap = () => 8 + S.sea.lv.line + 2 * S.sea.deep.buoys;
  const bellCost = t => Math.ceil(BELLS[t].base * Math.pow(BELLS[t].g, S.sea.bought[t] || 0) * priceK());
  const tuneCost = t => Math.ceil(4 * (t + 1) * Math.pow(2.1, S.sea.tune[t]));
  const oysterCost = () => Math.ceil(300 * Math.pow(1.8, S.sea.oBought));
  const pobjCost = k => Math.ceil(PEARLOBJ[k].base * Math.pow(PEARLOBJ[k].g, S.sea.pBought[k] || 0));
  const soundAt = () => seaThreshold(S);
  const canSound = () => soundingReady(S);
  const fathomGain = () => fathomReward(S, HB.fathoms);
  const quietEff = () => 0.25 + 0.1 * S.sea.choir.listen;
  const choirK = () => 0.1 * (1 + S.sea.choir.open);
  const choirBonus = () => 1 + choirK() * Math.log10(1 + (S.idleRate || 0));
  const tideMult = () => Math.pow(1.6, S.sea.soundings) * softPow(1.3, S.sea.deep.current) * heartMult() * HB.tide * choirBonus() * Math.pow(1.4, S.sea.lv.bronze);
  const skipsN = l => 1 + l + HB.skips;
  const seaDecayAt = l => 0.3 * Math.pow(0.86, l);
  const openAt = () => 30 * Math.pow(0.8, S.sea.deep.beds);
  const crossAt = l => (3 + l) * HB.interf;
  const pearlsOn = () => S.sea.soundings >= 1;
  // horns
  const hornSlots = () => normalSlots(S);
  const hornInterval = () => 360 * Math.pow(0.85, S.hornUp.ear);
  const hornRollCost = () => Math.ceil(5 * Math.pow(1.6, S.hornBuys));
  const pct = x => (x * 100).toFixed(x > 0.95 ? 1 : 0) + '%';

  let K = {}, SK = {};
  function refreshK() {
    K = {
      ret: retainAt(S.lv.resonance), pol: polishAt(S.lv.polish), dm: humMult(), harm: S.lv.harmony,
      att: S.attune.map(a => Math.pow(1.6, a)), crack: crackAt(), shards: shardsOn(), lm: lumenMult() * floorMod('lumen'), fh: floorMod('hum'),
      crys: HB.crystal, wall: HB.wall, sh: HB.shards * floorMod('shards'),
    };
  }
  function refreshSK() {
    const q = S.sea;
    SK = {
      decay: seaDecayAt(q.lv.still), tm: tideMult(), cross: crossAt(q.lv.interf),
      tune: q.tune.map(a => Math.pow(1.6, a)), open: openAt(), bell: HB.bell, pearl: HB.pearls,
    };
  }
  function refreshAll() { computeHB(); refreshK(); refreshSK(); hornsDirty = true; }

  const WHISPERS = {
    firstShout: 'The cave answers.',
    firstQuartz: 'The quartz hums back.',
    firstDrip: 'Water keeps time where you can’t.',
    firstBat: 'Something else in here is singing.',
    firstFuse: 'Two stones, one voice.',
    firstAmethyst: 'Violet light. A lower, rounder note.',
    firstCitrine: 'Citrine burns like a held breath.',
    firstMoonstone: 'Moonstone. The dark itself seems to listen.',
    firstHarmony: 'Ring them together. The cave pays for chords.',
    canDescend: 'The floor sounds hollow. You could descend.',
    twins: 'Two of a kind. Drag one onto the other.',
    full: 'The cave is full. Fuse twins, or chisel out more room.',
    firstShard: 'A crystal cracks. Shards glitter in the dust. Spend them on Wonders.',
    firstPrism: 'Light and sound both split here.',
    firstLodestone: 'The echoes lean toward it like iron filings.',
    firstGong: 'Feed it echoes. It will answer for everyone.',
    firstBoom: 'The gong booms, and every crystal near it sings at once.',
    nest: 'Glowworms uncoil from the ceiling. They are hungry for sound.',
    firstFirefly: 'A firefly hand drifts in and starts shouting for you.',
    heartSeen: 'Something beneath the glow is beating. The Heartstone.',
    firstThrow: 'The water answers, softer than stone.',
    firstCross: 'Two ripples met at a bell, and it rang three times as hard. Aim for the crossings.',
    firstRain: 'Rain on still water. Every drop is a voice.',
    firstFish: 'Something leaps in the black water.',
    firstLight: 'A lighthouse with no ships to warn. It rings the bells instead.',
    firstPearl: 'An oyster opens. A pearl, pale as the moon.',
    canSound: 'The water goes deeper still. You could sound the depths.',
    firstBreakwater: 'Ripples break against it and start again.',
    firstRaft: 'A little drum, keeping time on the water.',
    firstWhirlpool: 'The sea turns slowly around it.',
    bellTwins: 'Two bells alike. Drag one onto the other.',
    bellFull: 'No room for another bell. Fuse twins, or lay more buoy line.',
    firstBellFuse: 'Two bells melt into one deeper note.',
    firstHorn: 'You found a horn. Open the Horns tab to wear it.',
  };

  // =====================================================================
  // utilities
  // =====================================================================
  function fmt(n) {
    if (!isFinite(n)) return '∞';
    if (n < 10) return (Math.floor(n * 10) / 10).toString();
    if (n < 1000) return Math.floor(n).toString();
    if (S.numfmt === 'sci' && n >= 1e6) { const e = Math.floor(Math.log10(n)); return (n / Math.pow(10, e)).toFixed(2) + 'e' + e; }
    const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
    let i = -1;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    if (n >= 1000) return n.toExponential(2);
    return (n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : n.toFixed(0)) + u[i];
  }
  const fmtX = x => x < 10 ? x.toFixed(2).replace(/\.?0+$/, '') : fmt(x);
  function rng(seed) {
    return () => {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const pick = a => a[(Math.random() * a.length) | 0];
  let whisperTimer = 0;
  function whisper(text) {
    const el = $('whisper');
    el.textContent = text; el.classList.add('show');
    clearTimeout(whisperTimer);
    whisperTimer = setTimeout(() => el.classList.remove('show'), 5800);
  }
  function once(key) {
    if (S.seen[key]) return;
    S.seen[key] = 1; whisper(WHISPERS[key]);
  }
  const UNIT = {
    hum:    { get: () => S.hum,          set: v => { S.hum = v; } },
    shard:  { get: () => S.shards,       set: v => { S.shards = v; } },
    fossil: { get: () => S.fossils,      set: v => { S.fossils = v; } },
    lumen:  { get: () => S.lumen,        set: v => { S.lumen = v; } },
    tide:   { get: () => S.sea.tide,     set: v => { S.sea.tide = v; } },
    pearl:  { get: () => S.sea.pearls,   set: v => { S.sea.pearls = v; } },
    fathom: { get: () => S.sea.fathoms,  set: v => { S.sea.fathoms = v; } },
    ivory:  { get: () => S.ivory,        set: v => { S.ivory = v; } },
    gilt:   { get: () => Math.floor(S.gilt), set: v => { S.gilt = v; } },
  };
  const have = u => UNIT[u].get();
  function spend(u, c) { if (have(u) < c) return false; UNIT[u].set(have(u) - c); return true; }

  // =====================================================================
  // geometry (shared by both worlds)
  // =====================================================================
  let W = 0, H = 0, DPR = 1, cx = 0, cy = 0, rx = 1, ry = 1, SC = 1, V = 230;
  let shape = [], seaPath = null;
  function buildShape() {
    if (S.world === 'sea') {
      const R = rng(S.sea.soundings * 6007 + 91);
      shape = [
        { k: 2, a: 0.02 + R() * 0.03, p: R() * 6.283 },
        { k: 3, a: 0.03 + R() * 0.03, p: R() * 6.283 },
        { k: 4, a: 0.015 + R() * 0.015, p: R() * 6.283 },
        { k: 7, a: 0.01, p: R() * 6.283 },
      ];
    } else {
      const R = rng(S.depth * 7919 + 17);
      shape = [
        { k: 2, a: 0.03 + R() * 0.03, p: R() * 6.283 },
        { k: 3, a: 0.04 + R() * 0.04, p: R() * 6.283 },
        { k: 5, a: 0.025 + R() * 0.02, p: R() * 6.283 },
        { k: 8, a: 0.01 + R() * 0.01, p: R() * 6.283 },
        { k: 13, a: 0.006, p: R() * 6.283 },
      ];
    }
  }
  function rho(t) { let r = 0.88; for (const h of shape) r += h.a * Math.sin(h.k * t + h.p); return r; }
  function drho(t) { let r = 0; for (const h of shape) r += h.a * h.k * Math.cos(h.k * t + h.p); return r; }
  function insideBy(x, y, marginPx) {
    const u = (x - cx) / rx, v = (y - cy) / ry;
    return Math.sqrt(u * u + v * v) < rho(Math.atan2(v, u)) - marginPx / Math.min(rx, ry);
  }
  const objR = o => (o.k ? WONDERS[o.k].r : o.pk ? PEARLOBJ[o.pk].r : o.oy ? OYSTER_R : o.bt != null ? BELLS[o.bt].r : TIERS[o.t].r) * SC;
  function placeObj(o) { o.px = cx + o.x * rx; o.py = cy + o.y * ry; o.r = objR(o); }
  function setObjPx(o, x, y) { o.x = (x - cx) / rx; o.y = (y - cy) / ry; placeObj(o); }
  const objLists = () => S.world === 'sea' ? [S.sea.bells, S.sea.objs, S.sea.oysters] : [S.crystals, S.wonders];
  function validSpot(x, y, r, ignore) {
    if (!insideBy(x, y, r * 1.7)) return false;
    for (const list of objLists()) {
      for (const o of list) {
        if (o === ignore) continue;
        if (Math.hypot(o.px - x, o.py - y) < (o.r + r) * 1.45) return false;
      }
    }
    return true;
  }
  function twinAt(x, y, tier, ignore, list, key) {
    if (tier >= 3) return null;
    for (const o of list) {
      if (o === ignore || o[key] !== tier) continue;
      if (Math.hypot(o.px - x, o.py - y) < o.r * 1.6) return o;
    }
    return null;
  }
  function twinOf(o) {
    if (o.bt != null) return twinAt(o.px, o.py, o.bt, o, S.sea.bells, 'bt');
    if (o.t != null && !o.k) return twinAt(o.px, o.py, o.t, o, S.crystals, 't');
    return null;
  }
  function objAt(x, y) {
    const lists = objLists();
    for (let li = lists.length - 1; li >= 0; li--) {
      const list = lists[li];
      for (let i = list.length - 1; i >= 0; i--) {
        const o = list[i];
        if (Math.hypot(o.px - x, o.py - y) < o.r * 1.5) return o;
      }
    }
    return null;
  }
  function randomSpot(r) {
    for (let i = 0; i < 400; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 0.85;
      const x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
      if (validSpot(x, y, r, null)) return { x, y };
    }
    return null;
  }
  function randomInside() {
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * 0.8;
      const x = cx + Math.cos(a) * d * rx, y = cy + Math.sin(a) * d * ry;
      if (insideBy(x, y, 8)) return { x, y };
    }
    return { x: cx, y: cy };
  }
  function placeNew(list, o, fullMsg) {
    const s = randomSpot(objR(o));
    if (!s) { whisper(WHISPERS[fullMsg] || 'No open space left. Fuse twins to make room.'); return false; }
    setObjPx(o, s.x, s.y); o.ring = 1;
    list.push(o);
    rings.push({ x: o.px, y: o.py, r: o.r, life: 1 });
    return true;
  }

  function resize() {
    const r = cv.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    // Calm mode draws at 1× density: a quarter of the pixels on a high-DPI screen.
    DPR = S.fx === 'calm' ? 1 : Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    bg.width = cv.width; bg.height = cv.height;
    cx = W / 2; cy = H / 2 + 8;
    rx = W * 0.47; ry = H * (S.world === 'sea' ? 0.42 : 0.44);
    SC = Math.max(0.72, Math.min(1.35, Math.min(W, H) / 600));
    V = 150 * SC;
    for (const list of objLists()) list.forEach(placeObj);
    P.length = 0; drops.length = 0; ripples.length = 0; skipsQ.length = 0; jumps.length = 0;
    buildWorms();
    if (S.world === 'sea') drawSeaBG(); else drawCaveBG();
  }

  // =====================================================================
  // shared effects + level-of-detail
  // =====================================================================
  const rings = [];  // expanding rings
  const floats = []; // +numbers
  let T = 0, lite = 0;
  function entityCount() {
    const objs = objLists().reduce((a, l) => a + l.length, 0);
    return P.length + ripples.length + objs + bats.length + drops.length + jumps.length + floats.length + rings.length + worms.length;
  }
  function updateLite() {
    if (S.fx === 'full') { lite = 0; return; }
    const n = entityCount();
    if (S.fx === 'calm') { lite = n > 400 ? 2 : 1; return; }
    if (lite === 0 && n > 110) lite = 1;
    else if (lite === 1 && n < 90) lite = 0;
    if (lite === 1 && n > 420) lite = 2;
    else if (lite === 2 && n < 380) lite = 1;
  }
  function pushFloat(f) {
    if (lite && floats.length > 12) return;
    floats.push(f);
  }

  // =====================================================================
  // CAVE
  // =====================================================================
  const P = [], drops = [];
  let bats = [], dripTimers = [], worms = [];
  let chordNow = 0, fireT = 1, autoT = 0;
  let secAcc = 0, idleAcc = 0, lumAcc = 0; let hist = [], ihist = [], lhist = [];
  let lumenRate = 0;

  function caveHue() { if (onSun()) return 44; return (BIOMES[biomeIdx(S.depth)].hue + (S.depth % 4) * 7 - 10 + 360) % 360; }
  function echoHue() { return (172 + S.depth * 41) % 360; }

  function drawCaveBG() {
    const b = bctx, R = rng(S.depth * 104729 + 3);
    const h = caveHue();
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    b.fillStyle = LT ? `hsl(${h}, 10%, 76%)` : `hsl(${h}, 22%, 3.5%)`; b.fillRect(0, 0, W, H);
    for (let i = 0; i < 1100; i++) {
      b.fillStyle = LT ? `rgba(40,30,60,${0.02 + R() * 0.05})` : `rgba(255,255,255,${0.012 + R() * 0.035})`;
      const s = R() < 0.9 ? 1 : 2;
      b.fillRect(R() * W, R() * H, s, s);
    }
    const path = outlinePath();
    const grd = b.createRadialGradient(cx, cy + ry * 0.25, 10, cx, cy, Math.max(rx, ry));
    if (LT) { grd.addColorStop(0, `hsl(${h}, 24%, 97%)`); grd.addColorStop(0.65, `hsl(${h}, 18%, 91%)`); grd.addColorStop(1, `hsl(${h}, 14%, 85%)`); }
    else { grd.addColorStop(0, `hsl(${h}, 30%, 13%)`); grd.addColorStop(0.65, `hsl(${h}, 28%, 8%)`); grd.addColorStop(1, `hsl(${h}, 26%, 5.5%)`); }
    b.fillStyle = grd; b.fill(path);
    if (onSun()) {
      const g2 = b.createRadialGradient(cx, cy, 10, cx, cy, Math.max(rx, ry));
      g2.addColorStop(0, LT ? 'rgba(220,160,40,.18)' : 'rgba(255,205,90,.13)'); g2.addColorStop(1, 'rgba(255,205,90,0)');
      b.fillStyle = g2; b.fill(path);
    }
    b.save(); b.clip(path);
    for (let i = 0; i < 18; i++) {
      const y0 = cy - ry + (i / 18) * ry * 2 + R() * 10;
      b.beginPath();
      for (let x = cx - rx; x <= cx + rx; x += 12) {
        const y = y0 + Math.sin(x * 0.012 + i) * 6 * SC + Math.sin(x * 0.041 + i * 3) * 2;
        x === cx - rx ? b.moveTo(x, y) : b.lineTo(x, y);
      }
      b.strokeStyle = LT ? `rgba(60,40,90,${0.02 + R() * 0.03})` : `rgba(255,255,255,${0.012 + R() * 0.02})`; b.lineWidth = 1 + R() * 2; b.stroke();
    }
    for (let i = 0; i < 140; i++) {
      b.fillStyle = LT ? `hsla(${h + R() * 60 - 30}, 50%, 45%, ${0.08 + R() * 0.15})` : `hsla(${h + R() * 60 - 30}, 70%, 80%, ${0.05 + R() * 0.12})`;
      b.fillRect(cx + (R() - 0.5) * rx * 2, cy + (R() - 0.5) * ry * 2, 1, 1);
    }
    b.restore();
    const rock = LT ? `hsl(${h}, 10%, 76%)` : `hsl(${h}, 22%, 3.5%)`;
    const tooth = (t, len, wid) => {
      const r = rho(t) * 1.01;
      const bx = cx + Math.cos(t) * r * rx, by = cy + Math.sin(t) * r * ry;
      let dx = cx - bx, dy = cy - by; const d = Math.hypot(dx, dy); dx /= d; dy /= d;
      const tx = -dy, ty = dx;
      b.beginPath();
      b.moveTo(bx + tx * wid - dx * 3, by + ty * wid - dy * 3);
      b.quadraticCurveTo(bx + tx * wid * 0.3 + dx * len * 0.5, by + ty * wid * 0.3 + dy * len * 0.5, bx + dx * len, by + dy * len);
      b.quadraticCurveTo(bx - tx * wid * 0.3 + dx * len * 0.5, by - ty * wid * 0.3 + dy * len * 0.5, bx - tx * wid - dx * 3, by - ty * wid - dy * 3);
      b.closePath();
      b.fillStyle = rock; b.fill();
      b.strokeStyle = LT ? `hsla(${h}, 20%, 40%, .15)` : `hsla(${h}, 30%, 60%, .08)`; b.lineWidth = 1; b.stroke();
    };
    for (let i = 0; i < 30; i++) tooth(-Math.PI + 0.35 + R() * (Math.PI - 0.7), (8 + R() * 26) * SC, (3 + R() * 6) * SC);
    for (let i = 0; i < 16; i++) tooth(0.4 + R() * (Math.PI - 0.8), (5 + R() * 13) * SC, (4 + R() * 7) * SC);
    b.strokeStyle = LT ? `hsla(${h}, 30%, 35%, .3)` : `hsla(${h}, 40%, 75%, .16)`; b.lineWidth = 1.5; b.stroke(path);
  }
  function outlinePath() {
    const path = new Path2D(), N = 260;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2 - Math.PI, r = rho(t);
      const x = cx + Math.cos(t) * r * rx, y = cy + Math.sin(t) * r * ry;
      i ? path.lineTo(x, y) : path.moveTo(x, y);
    }
    path.closePath();
    return path;
  }

  function gain(g, idle) {
    S.hum += g; S.run += g; S.total += g; secAcc += g;
    if (idle) idleAcc += g;
  }

  function spawn(x, y, n, e, idle, dir, spread, offset) {
    let w = 1;
    const load = P.length / capP;
    if (load > 0.45) {
      const n2 = Math.max(1, Math.round(n * Math.max(0.06, (1 - load) / 0.55)));
      w = n / n2; n = n2;
    }
    if (P.length + n > capP) {
      if (P.length) {
        // The cave is saturated: fold this voice into echoes already ringing.
        for (let i = 0; i < n; i++) {
          const q = P[(Math.random() * P.length) | 0];
          q.w += (w * e) / Math.max(q.e, 0.15);
        }
        return;
      }
      // A quiet cave, but one shout has more echoes than the budget: ring what fits, each one heavier.
      w *= n / capP; n = capP;
    }
    const full = dir == null;
    const a0 = full ? Math.random() * Math.PI * 2 : dir - spread / 2;
    for (let i = 0; i < n; i++) {
      const a = full ? a0 + (i * Math.PI * 2) / n : a0 + spread * (n === 1 ? 0.5 : i / (n - 1));
      const ca = Math.cos(a), sa = Math.sin(a), o = offset || 0;
      P.push({ x: x + ca * o, y: y + sa * o, vx: ca * V, vy: sa * V, e, w, idle, g: 0 });
    }
  }

  let lastShout = -1;
  function shout(x, y, fromObj) {
    if (T - lastShout < 0.11) return;
    if (!fromObj && !insideBy(x, y, 2)) return;
    lastShout = T;
    spawn(x, y, shoutN(S.lv.lungs), 1, false, null, 0, fromObj ? fromObj.r + 3 : 0);
    rings.push({ x, y, r: 4, life: 1 });
    S.shouts++;
    once('firstShout');
    if (S.shouts >= 3) $('hint').hidden = true;
  }

  function ringCrystal(c, e, w, idle) {
    c.ring = 1; c.last = T;
    // chordNow is counted once per frame, not once per hit
    const voices = Math.max(1, chordNow);
    const hm = 1 + 0.15 * K.harm * Math.min(voices - 1, 10);
    const g = TIERS[c.t].value * K.att[c.t] * K.crys * e * w * K.pol * K.dm * K.fh * decayF * hm;
    gain(g, idle);
    c.pend = (c.pend || 0) + g;
    if (K.shards) {
      c.strain = (c.strain || 0) + e * Math.min(w, 4);
      if (c.strain >= K.crack) {
        c.strain -= K.crack;
        const n = (c.t + 1) * K.sh;
        S.shards += n; c.crack = 1; S.stats.shards += n;
        pushFloat({ x: c.px, y: c.py + c.r * 2.4, s: `+${fmt(n)} shard${n >= 2 ? 's' : ''}`, life: 1.2, col: '214,168,255' });
        once('firstShard');
      }
    }
    note(c.y, c.t, e, c);
  }

  function boom(o) {
    o.charge = 0; o.ring = 1;
    spawn(o.px, o.py, shoutN(S.lv.lungs) * 2, 1, true, null, 0, o.r + 3);
    rings.push({ x: o.px, y: o.py, r: o.r, life: 1.6, col: '224,164,88' });
    const R2 = Math.pow(190 * SC, 2);
    for (const c of S.crystals) if ((c.px - o.px) ** 2 + (c.py - o.py) ** 2 < R2) ringCrystal(c, 1, 1, true);
    boomSound();
    S.stats.booms++;
    once('firstBoom');
  }

  // Broad-phase grid: each echo only tests the handful of stones in its own cell.
  const CELL = 40, EMPTY = [];
  let gridW = 1, gridH = 1, grid = [], lodes = [];
  function buildGrid() {
    gridW = Math.max(1, Math.ceil(W / CELL) + 1); gridH = Math.max(1, Math.ceil(H / CELL) + 1);
    const n = gridW * gridH;
    if (grid.length !== n) grid = Array.from({ length: n }, () => []);
    else for (let i = 0; i < n; i++) if (grid[i].length) grid[i].length = 0;
    const add = o => {
      const pad = o.r + 8;
      const x0 = Math.max(0, ((o.px - pad) / CELL) | 0), x1 = Math.min(gridW - 1, ((o.px + pad) / CELL) | 0);
      const y0 = Math.max(0, ((o.py - pad) / CELL) | 0), y1 = Math.min(gridH - 1, ((o.py + pad) / CELL) | 0);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) grid[y * gridW + x].push(o);
    };
    for (const c of S.crystals) add(c);
    lodes = [];
    for (const o of S.wonders) { if (o.k === 'lodestone') lodes.push(o); else add(o); }
  }

  function stepParticles(dt) {
    const dec = Math.exp(-0.2 * dt), ret = K.ret;
    const pull = 1400 * SC * dt, LR = 120 * SC, LR2 = LR * LR, lodeDec = Math.exp(-0.35 * dt);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.e *= dec;
      const gx = (p.x / CELL) | 0, gy = (p.y / CELL) | 0;
      const cell = gx >= 0 && gy >= 0 && gx < gridW && gy < gridH ? grid[gy * gridW + gx] : EMPTY;
      for (let j = 0; j < cell.length; j++) {
        const o = cell[j];
        const dx = p.x - o.px, dy = p.y - o.py, rr = o.r + 1.5, d2 = dx * dx + dy * dy;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 1, nx = dx / d, ny = dy / d;
        const ivx = p.vx, ivy = p.vy, dot = p.vx * nx + p.vy * ny;
        if (dot < 0) { p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny; }
        p.x = o.px + nx * rr; p.y = o.py + ny * rr;
        if (!o.k) { ringCrystal(o, p.e, p.w, p.idle); p.e *= ret; continue; }
        o.ring = 1;
        if (o.k === 'prism') {
          if (p.g < 2) {
            p.g++; p.e *= 0.9;
            if (dot < 0 && P.length < capP) {
              const a = 0.3 * (Math.random() < 0.5 ? -1 : 1), ca = Math.cos(a), sa = Math.sin(a);
              P.push({ x: o.px - nx * rr, y: o.py - ny * rr, vx: ivx * ca - ivy * sa, vy: ivx * sa + ivy * ca, e: p.e, w: p.w, idle: p.idle, g: p.g });
            }
          } else p.e *= ret;
        } else {
          o.charge = (o.charge || 0) + p.e * Math.min(p.w, 4);
          p.e *= ret;
          if (o.charge >= GONG_CAP) boom(o);
        }
      }
      for (let j = 0; j < lodes.length; j++) {
        const o = lodes[j];
        const dx = p.x - o.px, dy = p.y - o.py, d2 = dx * dx + dy * dy;
        if (d2 < LR2 && d2 > 16) {
          const d = Math.sqrt(d2), f = pull * (1 - d / LR);
          p.vx -= (dx / d) * f; p.vy -= (dy / d) * f;
          const sp = Math.hypot(p.vx, p.vy) || 1;
          p.vx *= V / sp; p.vy *= V / sp;
          p.e *= lodeDec;
        }
      }
      for (let j = 0; j < worms.length; j++) {
        const w = worms[j];
        if (p.y > w.y0 && p.y < w.y1 && Math.abs(p.x - w.x) < 4 * SC) {
          const l = 0.05 * p.e * Math.min(p.w, 30) * K.lm * decayF;
          S.lumen += l; S.lumenTotal += l; S.stats.lumenLife += l; lumAcc += l;
          w.glow = 1; w.pend += l; p.e = 0;
          break;
        }
      }
      const u = (p.x - cx) / rx, v = (p.y - cy) / ry, d = Math.sqrt(u * u + v * v);
      if (d > 0.6 && p.e > 0) {
        const t = Math.atan2(v, u), r = rho(t);
        if (d > r) {
          const ct = Math.cos(t), st = Math.sin(t), k = drho(t) / d;
          let nx = (ct + k * st) / rx, ny = (st - k * ct) / ry;
          const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
          const dot = p.vx * nx + p.vy * ny;
          if (dot > 0) {
            p.vx -= 2 * dot * nx; p.vy -= 2 * dot * ny;
            // rough stone: nudge the angle so echoes never fall into a perfect loop
            const j = (Math.random() - 0.5) * 0.12, cj = Math.cos(j), sj = Math.sin(j);
            const vx = p.vx * cj - p.vy * sj; p.vy = p.vx * sj + p.vy * cj; p.vx = vx;
          }
          const s = (r - 0.004) / d;
          p.x = cx + u * s * rx; p.y = cy + v * s * ry;
          gain(0.15 * p.e * p.w * K.dm * K.fh * K.wall * decayF, p.idle);
          p.e *= ret;
        }
      }
      if (p.e < 0.04) { P[i] = P[P.length - 1]; P.pop(); }
    }
  }

  function buildWorms() {
    worms = [];
    if (S.world !== 'cave') return;
    const n = S.strata.nest ? 1 + S.strata.worm : 0;
    const R = rng(S.depth * 31 + 7);
    for (let i = 0; i < n; i++) {
      const t = -Math.PI / 2 + ((i + 0.5) / n - 0.5) * 1.9 + (R() - 0.5) * 0.12;
      const r = rho(t) * 0.99;
      const x = cx + Math.cos(t) * r * rx, y0 = cy + Math.sin(t) * r * ry;
      worms.push({ x, y0, y1: y0 + (40 + R() * 60) * SC, glow: 0, pend: 0, ph: R() * 6.283 });
    }
  }

  function syncCaveVoices() {
    while (bats.length < S.lv.bats) bats.push({ ph: Math.random() * 6.283, fx: 0.18 + Math.random() * 0.22, fy: 0.25 + Math.random() * 0.3, timer: 1 + Math.random() * 4, x: cx, y: cy });
    bats.length = S.lv.bats;
    while (dripTimers.length < S.lv.drips) dripTimers.push(Math.random() * 3);
    dripTimers.length = S.lv.drips;
    if (worms.length !== (S.strata.nest ? 1 + S.strata.worm : 0)) buildWorms();
  }

  function updateCaveVoices(dt) {
    for (const b of bats) {
      b.x = cx + rx * 0.46 * Math.sin(T * b.fx + b.ph);
      b.y = cy - ry * 0.06 + ry * 0.4 * Math.sin(T * b.fy + b.ph * 1.7);
      b.timer -= dt;
      if (b.timer <= 0) {
        b.timer = 4.5 + Math.random();
        spawn(b.x, b.y, shoutN(S.lv.lungs), 0.9, true, null, 0, 0);
        if (!lite) rings.push({ x: b.x, y: b.y, r: 3, life: 0.7, idle: true });
      }
    }
    for (let i = 0; i < dripTimers.length; i++) {
      dripTimers[i] -= dt;
      if (dripTimers[i] <= 0) {
        dripTimers[i] = 2.6 + Math.random() * 0.8;
        const t = -Math.PI / 2 + (Math.random() - 0.5) * 1.7, r = rho(t) * 0.96;
        drops.push({ x: cx + Math.cos(t) * r * rx, y: cy + Math.sin(t) * r * ry, vy: 0, py: 0 });
      }
    }
    if (S.illum.firefly > 0) {
      fireT -= dt;
      if (fireT <= 0) {
        fireT = Math.max(0.3, 3 * Math.pow(0.8, S.illum.firefly - 1));
        const q = randomInside();
        spawn(q.x, q.y, shoutN(S.lv.lungs), 1, true, null, 0, 0);
        if (!lite) rings.push({ x: q.x, y: q.y, r: 3, life: 0.8, col: '255,220,140' });
      }
    }
  }

  function updateDrops(dt) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.py = d.y; d.vy += 900 * SC * dt; d.y += d.vy * dt;
      let splashY = null;
      for (const c of S.crystals) {
        if (Math.abs(d.x - c.px) < c.r * 0.8 && d.y > c.py - c.r * 1.3 && d.py <= c.py - c.r * 1.3) {
          ringCrystal(c, 0.8, 1, true);
          splashY = c.py - c.r * 1.3 - 3;
          break;
        }
      }
      if (splashY == null && !insideBy(d.x, d.y, 0)) splashY = d.py - 2;
      if (splashY != null) {
        spawn(d.x, splashY, 4, 0.7, true, -Math.PI / 2, 1.9, 0);
        if (!lite) rings.push({ x: d.x, y: splashY, r: 2, life: 0.5, idle: true });
        drops.splice(i, 1);
      }
    }
  }

  let floatT = 0;
  function updateCaveFx(dt) {
    for (const c of S.crystals) {
      c.ring = Math.max(0, (c.ring || 0) - dt * 2.4);
      c.crack = Math.max(0, (c.crack || 0) - dt * 1.5);
    }
    for (const o of S.wonders) o.ring = Math.max(0, (o.ring || 0) - dt * 2.4);
    for (const w of worms) w.glow = Math.max(0, w.glow - dt * 1.2);
    floatT += dt;
    if (floatT > 0.75) {
      floatT = 0;
      if (lite) {
        // One summary number instead of one per crystal.
        let sum = 0; for (const c of S.crystals) { sum += c.pend || 0; c.pend = 0; }
        if (sum > 0) pushFloat({ x: cx, y: cy - ry * 0.75, s: '+' + fmt(sum), life: 1 });
        let ls = 0; for (const w of worms) { ls += w.pend; w.pend = 0; }
        if (ls >= 0.1) pushFloat({ x: cx, y: cy - ry * 0.62, s: '+' + fmt(ls) + ' lumen', life: 1, col: '127,184,255' });
      } else {
        for (const c of S.crystals) if (c.pend > 0) { pushFloat({ x: c.px, y: c.py - c.r * 1.8, s: '+' + fmt(c.pend), life: 1 }); c.pend = 0; }
        for (const w of worms) if (w.pend >= 0.1) { pushFloat({ x: w.x, y: w.y1 + 16, s: '+' + fmt(w.pend) + ' lumen', life: 1, col: '127,184,255' }); w.pend = 0; }
      }
    }
    chordNow = 0;
    for (const o of S.crystals) if (T - (o.last ?? -9) < 0.3) chordNow++;
  }

  // ---------- cave buying (everything places itself) ----------
  function buyCrystal(t) {
    if (S.crystals.length >= maxCrystals()) { once('full'); return false; }
    const cost = crystalCost(t);
    if (S.hum < cost) return false;
    const c = { t, x: 0, y: 0 };
    if (!placeNew(S.crystals, c, 'full')) return false;
    S.hum -= cost; S.bought[t]++;
    if (t === 0) once('firstQuartz'); else tierWhisper(t);
    if (t < 3 && S.crystals.filter(o => o.t === t).length === 2) once('twins');
    return true;
  }
  function buyWonder(k) {
    if (S.wonders.filter(o => o.k === k).length >= WONDERS[k].max) return false;
    const cost = wonderCost(k);
    if (S.shards < cost) return false;
    const o = { k, x: 0, y: 0, charge: 0 };
    if (!placeNew(S.wonders, o)) return false;
    S.shards -= cost; S.wBought[k]++;
    once('first' + WONDERS[k].name);
    return true;
  }
  function tierWhisper(t) {
    if (t === 1) once('firstAmethyst');
    if (t === 2) once('firstCitrine');
    if (t === 3) once('firstMoonstone');
  }

  function runAutomation() {
    if (S.world !== 'cave') return;
    if (S.illum.autofuse && S.toggles.autofuse) {
      for (let t = 0; t < TIERS.length - 1; t++) {
        const pair = S.crystals.filter(c => c.t === t && !(drag && drag.o === c));
        if (pair.length >= 2) { fuse(pair[0], pair[1]); break; }
      }
    }
    if (S.illum.autobuy && S.toggles.autobuy && S.crystals.length < maxCrystals()) {
      for (let t = TIERS.length - 1; t >= 0; t--) {
        if (t > 0 && S.run < TIERS[t].base * 0.4) continue;
        if (S.hum - crystalCost(t) >= (S.caveAutomation.unlocked ? S.caveAutomation.reserves.hum : 0)) { buyCrystal(t); break; }
      }
    }
    runCaveShopping(S, shopSpecs, have, () => { refreshAll(); syncVoices(); }, category => tabVisible(category.tab));
    if (S.illum.autodescend && S.toggles.autodescend && S.cool <= 0 && S.run >= sinkMult() * deepenAt()) descend();
  }

  // =====================================================================
  // SEA
  // =====================================================================
  const ripples = [], skipsQ = [], jumps = [];
  let rippleSeq = 0, rainTimers = [], fishTimers = [], lightT = 1, beamA = 0;

  function seaHue() { return (195 - S.sea.soundings * 14 + 360) % 360; }
  function lighthousePos() {
    const t = -0.85, r = rho(t) * 1.04;
    return { x: cx + Math.cos(t) * r * rx, y: cy + Math.sin(t) * r * ry };
  }

  function drawSeaBG() {
    const b = bctx, R = rng(S.sea.soundings * 3571 + 11), h = seaHue();
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    b.fillStyle = LT ? `hsl(${h}, 10%, 78%)` : `hsl(${h}, 18%, 4%)`; b.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      b.fillStyle = LT ? `rgba(20,50,60,${0.02 + R() * 0.04})` : `rgba(200,230,235,${0.01 + R() * 0.03})`;
      b.fillRect(R() * W, R() * H, 1, 1);
    }
    seaPath = outlinePath();
    const grd = b.createRadialGradient(cx, cy - ry * 0.2, 10, cx, cy, Math.max(rx, ry) * 1.05);
    if (LT) { grd.addColorStop(0, `hsl(${h}, 45%, 88%)`); grd.addColorStop(0.7, `hsl(${h}, 42%, 78%)`); grd.addColorStop(1, `hsl(${h}, 38%, 70%)`); }
    else { grd.addColorStop(0, `hsl(${h}, 42%, 15%)`); grd.addColorStop(0.7, `hsl(${h}, 48%, 9%)`); grd.addColorStop(1, `hsl(${h}, 50%, 6%)`); }
    b.fillStyle = grd; b.fill(seaPath);
    b.save(); b.clip(seaPath);
    for (let i = 0; i < 26; i++) {
      const x0 = cx + (R() - 0.5) * rx * 2, y0 = cy + (R() - 0.5) * ry * 2, L = (40 + R() * 90) * SC;
      b.beginPath(); b.moveTo(x0, y0);
      b.bezierCurveTo(x0 + L * 0.3, y0 - 8, x0 + L * 0.6, y0 + 8, x0 + L, y0);
      b.strokeStyle = LT ? `rgba(255,255,255,${0.2 + R() * 0.2})` : `rgba(170,235,240,${0.02 + R() * 0.03})`; b.lineWidth = 1 + R(); b.stroke();
    }
    b.restore();
    // shore stones
    for (let i = 0; i < 70; i++) {
      const t = R() * Math.PI * 2, r = rho(t) * (1.0 + R() * 0.06);
      const x = cx + Math.cos(t) * r * rx, y = cy + Math.sin(t) * r * ry, s = (3 + R() * 9) * SC;
      b.beginPath(); b.ellipse(x, y, s, s * 0.7, R() * 3, 0, Math.PI * 2);
      b.fillStyle = LT ? `hsl(${h}, 8%, ${55 + R() * 12}%)` : `hsl(${h}, 12%, ${5 + R() * 5}%)`; b.fill();
    }
    b.strokeStyle = LT ? 'rgba(20,70,80,.35)' : 'rgba(190,235,240,.22)'; b.lineWidth = 1.5; b.stroke(seaPath);
    b.setLineDash([2, 7]); b.strokeStyle = LT ? 'rgba(255,255,255,.7)' : 'rgba(230,250,250,.12)'; b.lineWidth = 3; b.stroke(seaPath); b.setLineDash([]);
  }

  function seaGain(g, idle) {
    const q = S.sea; q.tide += g; q.run += g; q.total += g; secAcc += g;
    if (idle) idleAcc += g;
  }
  function makeRipple(x, y, e, w, idle, gen, skip) {
    if (ripples.length >= capR) {
      const q = ripples[(Math.random() * ripples.length) | 0];
      if (q) q.w += (w * e) / Math.max(q.e, 0.2);
      return null;
    }
    // Everything this ripple will ever reach, nearest first. Each frame just walks the list.
    const q = S.sea, tq = [];
    for (const b of q.bells) tq.push({ o: b, k: 0, d: Math.hypot(b.px - x, b.py - y) });
    for (const o of q.oysters) tq.push({ o, k: 1, d: Math.hypot(o.px - x, o.py - y) });
    for (const o of q.objs) if (o.pk === 'breakwater' && o !== skip) tq.push({ o, k: 2, d: Math.hypot(o.px - x, o.py - y) });
    tq.sort((a, b) => a.d - b.d);
    const rp = { id: ++rippleSeq, x, y, r: 0, t: 0, e0: e, e, w, idle, gen: gen || 0, tq, ti: 0 };
    ripples.push(rp);
    return rp;
  }
  function throwStone(x, y, fromObj) {
    if (T - lastShout < 0.11) return;
    if (!fromObj && !insideBy(x, y, 2)) return;
    lastShout = T;
    const n = skipsN(S.sea.lv.skips), a = Math.random() * Math.PI * 2, step = 45 * SC;
    for (let i = 0; i < n; i++) {
      skipsQ.push({ x: x + Math.cos(a) * step * i, y: y + Math.sin(a) * step * i, t: i * 0.13, e: Math.pow(0.88, i), idle: false });
    }
    S.sea.throws++;
    once('firstThrow');
    if (S.sea.throws >= 3) $('hint').hidden = true;
  }

  function ringBell(b, rp) {
    let cross = 1;
    if (b.lastT != null && T - b.lastT < 0.18 && b.lastId !== rp.id) {
      cross = SK.cross; b.flash = 1; S.stats.crossings++;
      once('firstCross');
      if (!lite) pushFloat({ x: b.px, y: b.py + b.r * 2.6, s: `crossing ×${fmtX(SK.cross)}`, life: 1, col: '255,207,134' });
    }
    b.lastT = T; b.lastId = rp.id; b.ring = 1;
    let aura = 1;
    for (const o of S.sea.objs) if (o.pk === 'whirlpool' && Math.hypot(o.px - b.px, o.py - b.py) < 90 * SC) aura *= 2;
    const g = BELLS[b.bt].value * SK.tune[b.bt] * SK.bell * rp.e * rp.w * SK.tm * cross * aura;
    seaGain(g, rp.idle);
    b.pend = (b.pend || 0) + g;
    bellNote(b, rp.e, cross > 1);
  }

  function stepSea(dt) {
    const q = S.sea, sp = 110 * SC, maxR = Math.hypot(rx, ry) * 2.1;
    for (let i = skipsQ.length - 1; i >= 0; i--) {
      const s = skipsQ[i]; s.t -= dt;
      if (s.t <= 0) {
        skipsQ.splice(i, 1);
        if (insideBy(s.x, s.y, 3)) { makeRipple(s.x, s.y, s.e, 1, s.idle, 0); if (!lite) rings.push({ x: s.x, y: s.y, r: 2, life: 0.6, col: '220,250,250' }); }
      }
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.t += dt; rp.r += sp * dt; rp.e = rp.e0 * Math.exp(-SK.decay * rp.t);
      if (rp.e < 0.04 || rp.r > maxR) { ripples[i] = ripples[ripples.length - 1]; ripples.pop(); continue; }
      while (rp.ti < rp.tq.length && rp.tq[rp.ti].d <= rp.r) {
        const { o, k } = rp.tq[rp.ti++];
        if (o.dead) continue;
        if (k === 0) ringBell(o, rp);
        else if (k === 1) {
          o.wash = (o.wash || 0) + rp.e * Math.min(rp.w, 4);
          if (o.wash >= SK.open) {
            o.wash -= SK.open; o.open = 1;
            oysterOpened(o);
          }
        } else if (rp.gen < 2) {
          o.ring = 1;
          makeRipple(o.px, o.py, rp.e * 0.7, rp.w, rp.idle, rp.gen + 1, o);
        }
      }
    }
  }

  function syncSeaVoices() {
    const q = S.sea;
    while (rainTimers.length < q.lv.rain) rainTimers.push(Math.random() * 3);
    rainTimers.length = q.lv.rain;
    while (fishTimers.length < q.lv.fish) fishTimers.push(1 + Math.random() * 4);
    fishTimers.length = q.lv.fish;
  }
  function updateSeaVoices(dt) {
    const q = S.sea;
    for (let i = 0; i < rainTimers.length; i++) {
      rainTimers[i] -= dt;
      if (rainTimers[i] <= 0) {
        rainTimers[i] = 2.6 + Math.random() * 0.8;
        const s = randomInside();
        makeRipple(s.x, s.y, 0.55, 1, true, 0);
        if (!lite) rings.push({ x: s.x, y: s.y, r: 1, life: 0.4, col: '200,240,250' });
      }
    }
    for (let i = 0; i < fishTimers.length; i++) {
      fishTimers[i] -= dt;
      if (fishTimers[i] <= 0) {
        fishTimers[i] = 5 + Math.random();
        const a = randomInside(), ang = Math.random() * Math.PI * 2, dist = (60 + Math.random() * 40) * SC;
        let bx = a.x + Math.cos(ang) * dist, by = a.y + Math.sin(ang) * dist;
        if (!insideBy(bx, by, 8)) { bx = a.x - Math.cos(ang) * dist; by = a.y - Math.sin(ang) * dist; }
        if (!insideBy(bx, by, 8)) { bx = cx; by = cy; }
        jumps.push({ ax: a.x, ay: a.y, bx, by, t: 0, dur: 0.7 });
        makeRipple(a.x, a.y, 0.9, 1, true, 0);
      }
    }
    for (let i = jumps.length - 1; i >= 0; i--) {
      const j = jumps[i]; j.t += dt;
      if (j.t >= j.dur) { makeRipple(j.bx, j.by, 0.9, 1, true, 0); jumps.splice(i, 1); }
    }
    if (q.lv.light > 0) {
      beamA += dt * 0.7;
      lightT -= dt;
      if (lightT <= 0) {
        lightT = Math.max(0.4, 2.2 * Math.pow(0.8, q.lv.light - 1));
        const L = lighthousePos(), dir = beamDir(L), reach = Math.hypot(cx - L.x, cy - L.y) * (0.35 + Math.random() * 1.2);
        const x = L.x + Math.cos(dir) * reach, y = L.y + Math.sin(dir) * reach;
        if (insideBy(x, y, 6)) makeRipple(x, y, 0.8, 1, true, 0);
      }
    }
    for (const o of q.objs) {
      if (o.pk !== 'raft') continue;
      o.timer = (o.timer ?? Math.random() * 3) - dt;
      if (o.timer <= 0) { o.timer = 3; o.ring = 1; makeRipple(o.px, o.py, 1, 1, true, 0); }
    }
  }
  function beamDir(L) { return Math.atan2(cy - L.y, cx - L.x) + Math.sin(beamA) * 0.9; }

  function updateSeaFx(dt) {
    const q = S.sea;
    for (const b of q.bells) { b.ring = Math.max(0, (b.ring || 0) - dt * 1.8); b.flash = Math.max(0, (b.flash || 0) - dt * 1.5); }
    for (const o of q.oysters) o.open = Math.max(0, (o.open || 0) - dt * 0.8);
    for (const o of q.objs) o.ring = Math.max(0, (o.ring || 0) - dt * 2);
    floatT += dt;
    if (floatT > 0.75) {
      floatT = 0;
      if (lite) {
        let sum = 0; for (const b of q.bells) { sum += b.pend || 0; b.pend = 0; }
        if (sum > 0) pushFloat({ x: cx, y: cy - ry * 0.75, s: '+' + fmt(sum), life: 1, col: '134,216,230' });
      } else {
        for (const b of q.bells) if (b.pend > 0) { pushFloat({ x: b.px, y: b.py - b.r * 1.9, s: '+' + fmt(b.pend), life: 1, col: '134,216,230' }); b.pend = 0; }
      }
    }
  }

  function buyBell(t) {
    const q = S.sea;
    if (q.bells.length >= bellCap()) { once('bellFull'); return false; }
    const cost = bellCost(t);
    if (q.tide < cost) return false;
    const b = { bt: t, x: 0, y: 0 };
    if (!placeNew(q.bells, b, 'bellFull')) return false;
    q.tide -= cost; q.bought[t]++;
    if (t < 3 && q.bells.filter(o => o.bt === t).length === 2) once('bellTwins');
    return true;
  }
  function buyOyster() {
    const q = S.sea;
    if (q.oysters.length >= 6) return false;
    const cost = oysterCost();
    if (q.tide < cost) return false;
    if (!placeNew(q.oysters, { oy: 1, x: 0, y: 0, wash: 0 })) return false;
    q.tide -= cost; q.oBought++;
    return true;
  }
  function buyPobj(k) {
    const q = S.sea;
    if (q.objs.filter(o => o.pk === k).length >= PEARLOBJ[k].max) return false;
    const cost = pobjCost(k);
    if (q.pearls < cost) return false;
    if (!placeNew(q.objs, { pk: k, x: 0, y: 0 })) return false;
    q.pearls -= cost; q.pBought[k]++;
    once('first' + (k === 'raft' ? 'Raft' : PEARLOBJ[k].name));
    return true;
  }

  // =====================================================================
  // drawing
  // =====================================================================
  const GEM = [[0, -1.35], [0.72, -0.55], [0.72, 0.55], [0, 1.05], [-0.72, 0.55], [-0.72, -0.55]];
  function gemPath(r) { ctx.beginPath(); GEM.forEach(([a, b], i) => i ? ctx.lineTo(a * r, b * r) : ctx.moveTo(a * r, b * r)); ctx.closePath(); }
  function drawGem(x, y, r, color, alpha, tint, ring) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
    gemPath(r); ctx.fillStyle = tint || color; ctx.fill();
    ctx.fillStyle = 'rgba(10,6,20,.32)';
    ctx.beginPath(); ctx.moveTo(0, -1.35 * r); ctx.lineTo(0, 1.05 * r); ctx.lineTo(-0.72 * r, 0.55 * r); ctx.lineTo(-0.72 * r, -0.55 * r); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.38)';
    ctx.beginPath(); ctx.moveTo(0, -1.35 * r); ctx.lineTo(0.72 * r, -0.55 * r); ctx.lineTo(0.18 * r, -0.25 * r); ctx.fill();
    if (ring > 0) { gemPath(r); ctx.fillStyle = `rgba(255,255,255,${ring * 0.45})`; ctx.fill(); }
    gemPath(r); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }

  function drawWonder(o, alpha, tint) {
    const r = o.r;
    ctx.save(); ctx.translate(o.px, o.py); ctx.globalAlpha = alpha;
    if (o.k === 'prism') {
      const spin = lite ? 0 : T * 0.3;
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3) + spin;
        i ? ctx.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2) : ctx.moveTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2);
      }
      ctx.closePath();
      const g = ctx.createLinearGradient(-r, -r, r, r);
      g.addColorStop(0, '#ff9ad5'); g.addColorStop(0.35, '#ffe38a'); g.addColorStop(0.65, '#8ff2e6'); g.addColorStop(1, '#a58bff');
      ctx.fillStyle = tint || 'rgba(255,255,255,.12)'; ctx.fill();
      ctx.strokeStyle = g; ctx.lineWidth = 2 + (o.ring || 0) * 2; ctx.stroke();
    } else if (o.k === 'lodestone') {
      ctx.strokeStyle = `rgba(165,139,255,${0.08 + (o.ring || 0) * 0.1})`;
      ctx.setLineDash([3, 6]); ctx.lineDashOffset = lite ? 0 : -T * 12;
      ctx.beginPath(); ctx.arc(0, 0, 120 * SC, 0, Math.PI * 2); ctx.stroke();
      if (!lite) { ctx.beginPath(); ctx.arc(0, 0, 70 * SC, 0, Math.PI * 2); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = tint || '#2a2233'; ctx.fill();
      ctx.strokeStyle = '#8c7aa8'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#b58cff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 1, 0, 0, r);
      g.addColorStop(0, '#f3c27a'); g.addColorStop(1, '#8a5a24');
      ctx.fillStyle = tint || g; ctx.fill();
      ctx.strokeStyle = 'rgba(40,20,5,.5)'; ctx.lineWidth = 1;
      for (const k of [0.4, 0.65, 0.85]) { ctx.beginPath(); ctx.arc(0, 0, r * k, 0, Math.PI * 2); ctx.stroke(); }
      if (o.ring > 0) { ctx.fillStyle = `rgba(255,240,200,${o.ring * 0.4})`; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); }
      const fill = Math.min(1, (o.charge || 0) / GONG_CAP);
      ctx.strokeStyle = 'rgba(255,207,134,.2)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, r + 5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#ffcf86';
      ctx.beginPath(); ctx.arc(0, 0, r + 5, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }

  function drawBat(b) {
    const s = SC, flap = lite ? 2 * s : Math.sin(T * 17 + b.ph) * 5 * s;
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle = LT ? 'rgba(45,36,64,.85)' : 'rgba(214,202,236,.85)';
    ctx.beginPath();
    ctx.moveTo(0, -2 * s);
    ctx.quadraticCurveTo(-5 * s, -3 * s - flap, -11 * s, -flap);
    ctx.quadraticCurveTo(-7 * s, 0, -6 * s, 3 * s);
    ctx.quadraticCurveTo(-3 * s, 1 * s, 0, 3.5 * s);
    ctx.quadraticCurveTo(3 * s, 1 * s, 6 * s, 3 * s);
    ctx.quadraticCurveTo(7 * s, 0, 11 * s, -flap);
    ctx.quadraticCurveTo(5 * s, -3 * s - flap, 0, -2 * s);
    ctx.fill();
    ctx.restore();
  }

  function drawWorms() {
    for (const w of worms) {
      const sway = lite ? 0 : Math.sin(T * 0.9 + w.ph) * 1.5;
      ctx.strokeStyle = `rgba(127,184,255,${0.18 + w.glow * 0.4})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w.x, w.y0); ctx.lineTo(w.x + sway, w.y1); ctx.stroke();
      if (!lite) {
        ctx.fillStyle = `rgba(160,205,255,${0.35 + w.glow * 0.6})`;
        for (let y = w.y0 + 6; y < w.y1; y += 7 * SC) {
          const k = (y - w.y0) / (w.y1 - w.y0);
          ctx.beginPath(); ctx.arc(w.x + sway * k, y, 1.2 * SC, 0, Math.PI * 2); ctx.fill();
        }
      }
      const rr = 14 * SC * (1 + w.glow);
      ctx.globalAlpha = Math.min(1, 0.5 + w.glow * 0.5);
      ctx.drawImage(glowSprite('#7fb8ff'), w.x + sway - rr, w.y1 - rr, rr * 2, rr * 2);
      ctx.globalAlpha = 1;
    }
  }
  // Soft glows are painted once into a small sprite and stamped, instead of building a gradient every frame.
  const glowCache = {};
  function glowSprite(col) {
    if (glowCache[col]) return glowCache[col];
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(0.4, col + '66'); gr.addColorStop(1, col + '00');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (glowCache[col] = c);
  }

  function drawRings(hue) {
    for (const r of rings) {
      ctx.strokeStyle = r.col ? `rgba(${r.col},${r.life * 0.5})` :
        r.idle ? `hsla(${hue}, 60%, ${LT ? 35 : 80}%, ${r.life * 0.25})` : `hsla(${hue}, 80%, ${LT ? 32 : 82}%, ${r.life * 0.55})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2); ctx.stroke();
    }
  }
  function drawFloats() {
    ctx.font = `600 ${Math.round(11 * Math.max(1, SC))}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.textAlign = 'center';
    for (const f of floats) {
      ctx.fillStyle = `rgba(${inkCol(f.col || '255,207,134')},${Math.min(1, f.life * 1.4)})`;
      ctx.fillText(f.s, f.x, f.y);
    }
  }

  const buckets = [[], [], [], []];
  const BUCKET_A = [0.2, 0.38, 0.62, 0.92];
  function drawCave() {
    if (simulation?.fast) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(bg, 0, 0, W, H);

    ctx.globalCompositeOperation = ADD();
    for (const c of S.crystals) {
      if (lite && c.ring < 0.3) continue;
      const rr = c.r * (2.4 + 2.2 * c.ring);
      ctx.globalAlpha = Math.min(1, 0.14 + 0.5 * c.ring);
      ctx.drawImage(glowSprite(TIERS[c.t].glow), c.px - rr, c.py - rr, rr * 2, rr * 2);
    }
    ctx.globalAlpha = 1;
    drawWorms();

    const hue = echoHue();
    for (const b of buckets) b.length = 0;
    // Busy caves draw a sample of the echoes, each a little brighter, so the screen stays readable.
    const every = lite === 2 ? Math.ceil(P.length / 300) : 1;
    for (let i = 0; i < P.length; i += every) {
      const p = P[i];
      buckets[p.e > 0.65 ? 3 : p.e > 0.35 ? 2 : p.e > 0.15 ? 1 : 0].push(p);
    }
    ctx.lineCap = 'round';
    const tail = lite ? 0.018 : 0.032;
    for (let k = 0; k < 4; k++) {
      const bk = buckets[k]; if (!bk.length) continue;
      ctx.strokeStyle = `hsla(${hue}, ${LT ? '75%, 30%' : '85%, 74%'}, ${lite ? BUCKET_A[k] * 0.8 : BUCKET_A[k]})`;
      ctx.lineWidth = 1.2 + k * 0.35;
      ctx.beginPath();
      for (const p of bk) { ctx.moveTo(p.x - p.vx * tail, p.y - p.vy * tail); ctx.lineTo(p.x, p.y); }
      ctx.stroke();
    }
    drawRings(hue);
    ctx.globalCompositeOperation = 'source-over';

    for (const o of S.wonders) {
      const lifted = drag && drag.o === o && drag.moved;
      drawWonder(o, 1, lifted && !validSpot(o.px, o.py, o.r, o) ? 'rgba(255,138,122,.6)' : null);
    }
    for (const c of S.crystals) {
      if (!lite && c.ring > 0.02) {
        ctx.strokeStyle = TIERS[c.t].glow + hexA(c.ring * 0.5); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(c.px, c.py, c.r * (1.3 + (1 - c.ring) * 2.2), 0, Math.PI * 2); ctx.stroke();
      }
      if (K.shards) {
        const f = Math.min(1, (c.strain || 0) / K.crack);
        if (f > 0.02) {
          ctx.strokeStyle = 'rgba(214,168,255,.45)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(c.px, c.py, c.r * 1.75, Math.PI * 0.5 - f * Math.PI, Math.PI * 0.5 + f * Math.PI); ctx.stroke();
        }
        if (!lite && c.crack > 0) {
          ctx.strokeStyle = `rgba(214,168,255,${c.crack})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(c.px, c.py, c.r * (1.6 + (1 - c.crack) * 2), 0, Math.PI * 2); ctx.stroke();
        }
      }
      const lifted = drag && drag.o === c && drag.moved;
      let tint = null;
      if (lifted) {
        const tw = twinOf(c);
        if (!tw && !validSpot(c.px, c.py, c.r, c)) tint = '#ff8a7a';
        if (tw) { ctx.strokeStyle = '#ffcf86'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tw.px, tw.py, tw.r * 1.9, 0, Math.PI * 2); ctx.stroke(); }
      }
      drawGem(c.px, c.py, c.r * (lifted ? 1.12 : 1), TIERS[c.t].color, 1, tint, c.ring);
    }

    ctx.strokeStyle = LT ? `hsla(${hue}, 70%, 32%, .85)` : `hsla(${hue}, 70%, 85%, .85)`; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const d of drops) { ctx.moveTo(d.x, d.y - Math.min(9, d.vy * 0.012)); ctx.lineTo(d.x, d.y); }
    ctx.stroke();
    for (const b of bats) drawBat(b);
    drawBins();
    drawFloats();
  }

  function drawBell(x, y, r, color, swing, ring, flash, tint) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = 'rgba(16,34,42,.92)';
    ctx.beginPath(); ctx.ellipse(0, r * 0.95, r * 1.05, r * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(160,220,230,.25)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.rotate(swing);
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, r * 0.55);
    ctx.quadraticCurveTo(-r * 0.75, -r * 0.2, -r * 0.45, -r * 0.7);
    ctx.quadraticCurveTo(0, -r * 1.15, r * 0.45, -r * 0.7);
    ctx.quadraticCurveTo(r * 0.75, -r * 0.2, r * 0.85, r * 0.55);
    ctx.closePath();
    ctx.fillStyle = tint || color; ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(-r * 0.85, r * 0.4, r * 1.7, r * 0.15);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.stroke();
    if (ring > 0) { ctx.fillStyle = `rgba(255,255,255,${ring * 0.35})`; ctx.fill(); }
    ctx.fillStyle = 'rgba(20,20,20,.8)'; ctx.beginPath(); ctx.arc(0, r * 0.62, r * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (flash > 0) {
      ctx.strokeStyle = `rgba(255,207,134,${flash})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, r * (1.5 + (1 - flash) * 2.5), 0, Math.PI * 2); ctx.stroke();
    }
  }
  function drawOyster(o) {
    const r = o.r, f = Math.min(1, (o.wash || 0) / SK.open), open = Math.max(o.open || 0, f * 0.25);
    ctx.save(); ctx.translate(o.px, o.py);
    ctx.fillStyle = '#4a4655';
    ctx.beginPath(); ctx.ellipse(0, 2, r * 1.15, r * 0.6, 0, 0, Math.PI); ctx.fill();
    ctx.save(); ctx.rotate(-open * 0.7);
    ctx.fillStyle = '#6a6577';
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.15, r * 0.7, 0, Math.PI, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(k * r * 0.4, -r * 0.62); ctx.stroke(); }
    ctx.restore();
    if (open > 0.2) { ctx.fillStyle = `rgba(245,240,230,${open})`; ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fill(); }
    ctx.strokeStyle = 'rgba(239,230,216,.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.6, Math.PI * 0.5 - f * Math.PI, Math.PI * 0.5 + f * Math.PI); ctx.stroke();
    ctx.restore();
  }
  function drawPobj(o, tint) {
    const r = o.r;
    ctx.save(); ctx.translate(o.px, o.py);
    if (o.pk === 'breakwater') {
      ctx.fillStyle = tint || '#39414a';
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.3, r * 0.75, -0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = `rgba(200,240,245,${0.25 + (o.ring || 0) * 0.5})`; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (o.pk === 'raft') {
      ctx.rotate(lite ? 0 : Math.sin(T * 1.3 + o.px) * 0.08);
      ctx.fillStyle = tint || '#7a5a3a'; ctx.fillRect(-r, -r * 0.7, r * 2, r * 1.4);
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1;
      for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(k * r * 0.66, -r * 0.7); ctx.lineTo(k * r * 0.66, r * 0.7); ctx.stroke(); }
      ctx.fillStyle = '#d9c3a0'; ctx.beginPath(); ctx.arc(0, 0, r * 0.5 * (1 + (o.ring || 0) * 0.3), 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(134,216,230,.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 90 * SC, 0, Math.PI * 2); ctx.stroke();
      const spin = lite ? 0 : -T * 1.2;
      ctx.strokeStyle = tint || (LT ? 'rgba(20,80,95,.6)' : 'rgba(170,235,240,.55)'); ctx.lineWidth = 1.6;
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath();
        for (let s = 0; s <= 20; s++) {
          const a = spin + arm * 2.094 + s * 0.25, rr = r * 0.15 + s * r * 0.07;
          s ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  function drawSea() {
    if (simulation?.fast) return;
    const q = S.sea;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.drawImage(bg, 0, 0, W, H);

    // lighthouse beam under the ripples
    if (q.lv.light > 0) {
      const L = lighthousePos(), dir = beamDir(L), len = Math.max(rx, ry) * 2.2;
      ctx.save(); ctx.globalCompositeOperation = ADD();
      const g = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, len);
      g.addColorStop(0, 'rgba(255,230,170,.18)'); g.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(L.x, L.y);
      ctx.arc(L.x, L.y, len, dir - 0.12, dir + 0.12); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    ctx.save(); ctx.clip(seaPath);
    ctx.globalCompositeOperation = ADD();
    for (const b of buckets) b.length = 0;
    const every = lite === 2 ? Math.ceil(ripples.length / 90) : 1;
    for (let i = 0; i < ripples.length; i += every) {
      const rp = ripples[i];
      buckets[rp.e > 0.65 ? 3 : rp.e > 0.35 ? 2 : rp.e > 0.15 ? 1 : 0].push(rp);
    }
    for (let k = 0; k < 4; k++) {
      const bk = buckets[k]; if (!bk.length) continue;
      ctx.strokeStyle = `rgba(${LT ? '15,70,85' : '190,240,240'},${BUCKET_A[k] * 0.7})`;
      ctx.lineWidth = 1.2 + k * 0.4;
      ctx.beginPath();
      for (const rp of bk) { ctx.moveTo(rp.x + rp.r, rp.y); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); }
      ctx.stroke();
      if (!lite && k >= 2) {
        ctx.strokeStyle = `rgba(${LT ? '15,70,85' : '190,240,240'},${BUCKET_A[k] * 0.2})`;
        ctx.beginPath();
        for (const rp of bk) { const r2 = Math.max(0, rp.r - 6 * SC); ctx.moveTo(rp.x + r2, rp.y); ctx.arc(rp.x, rp.y, r2, 0, Math.PI * 2); }
        ctx.stroke();
      }
    }
    drawRings(185);
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    for (const o of q.oysters) drawOyster(o);
    for (const o of q.objs) {
      const lifted = drag && drag.o === o && drag.moved;
      drawPobj(o, lifted && !validSpot(o.px, o.py, o.r, o) ? 'rgba(255,138,122,.8)' : null);
    }
    for (const b of q.bells) {
      const lifted = drag && drag.o === b && drag.moved;
      let tint = null;
      if (lifted) {
        const tw = twinOf(b);
        if (!tw && !validSpot(b.px, b.py, b.r, b)) tint = '#ff8a7a';
        if (tw) { ctx.strokeStyle = '#ffcf86'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tw.px, tw.py, tw.r * 1.9, 0, Math.PI * 2); ctx.stroke(); }
      }
      const swing = lite ? 0 : Math.sin(T * 14 + b.px) * 0.35 * (b.ring || 0);
      drawBell(b.px, b.py, b.r * (lifted ? 1.12 : 1), BELLS[b.bt].color, swing, b.ring || 0, lite ? 0 : (b.flash || 0), tint);
    }
    for (const j of jumps) {
      const u = j.t / j.dur, x = j.ax + (j.bx - j.ax) * u, y = j.ay + (j.by - j.ay) * u - Math.sin(u * Math.PI) * 34 * SC;
      const ang = Math.atan2((j.by - j.ay) - Math.cos(u * Math.PI) * 34 * SC * Math.PI, j.bx - j.ax);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = '#a9dbe4';
      ctx.beginPath(); ctx.ellipse(0, 0, 8 * SC, 3 * SC, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-7 * SC, 0); ctx.lineTo(-12 * SC, -4 * SC); ctx.lineTo(-12 * SC, 4 * SC); ctx.fill();
      ctx.restore();
    }
    if (q.lv.light > 0) {
      const L = lighthousePos();
      ctx.fillStyle = '#d9d2c4'; ctx.fillRect(L.x - 4 * SC, L.y - 6 * SC, 8 * SC, 16 * SC);
      ctx.fillStyle = '#b54848'; ctx.fillRect(L.x - 4 * SC, L.y - 1 * SC, 8 * SC, 3 * SC);
      ctx.fillStyle = '#ffe6aa'; ctx.beginPath(); ctx.arc(L.x, L.y - 9 * SC, 4 * SC, 0, Math.PI * 2); ctx.fill();
    }
    drawBins();
    drawFloats();
  }
  // Light mode draws on a pale ground: additive light would vanish, so marks are inked instead.
  let LT = false;
  const ADD = () => LT ? 'source-over' : 'lighter';
  const inkCol = c => LT ? c.split(',').map(v => Math.round(+v * 0.55)).join(',') : c;
  function hexA(a) { return Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0'); }

  function updateSharedFx(dt) {
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i]; r.r += 160 * SC * dt; r.life -= dt * 1.4;
      if (r.life <= 0) rings.splice(i, 1);
    }
    if (rings.length > (lite ? 24 : 60)) rings.splice(0, rings.length - (lite ? 24 : 60));
    if (floats.length > 30) floats.splice(0, floats.length - 30);
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i]; f.y -= 22 * dt; f.life -= dt * 0.9;
      if (f.life <= 0) floats.splice(i, 1);
    }
  }

  // =====================================================================
  // sound
  // =====================================================================
  let AC = null, master = null, noteBudget = 8;
  function makeImpulse(sec) {
    const len = Math.floor(AC.sampleRate * sec), buf = AC.createBuffer(2, len, AC.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }
  function initAudio() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
      master = AC.createGain(); master.gain.value = S.muted ? 0 : 0.55;
      const dry = AC.createGain(); dry.gain.value = 0.55;
      const wet = AC.createGain(); wet.gain.value = 0.6;
      const verb = AC.createConvolver(); verb.buffer = makeImpulse(3.4);
      master.connect(dry); dry.connect(AC.destination);
      master.connect(verb); verb.connect(wet); wet.connect(AC.destination);
    } catch (e) { AC = null; }
  }
  const audible = () => AC && !S.muted && AC.state === 'running';
  function freqFor(y, tier, base, mode) {
    const steps = MODES[mode % MODES.length].steps;
    const deg = Math.max(0, Math.round(((1 - y) / 2) * 9)) + tier * 2;
    const midi = base + Math.floor(deg / steps.length) * 12 + steps[deg % steps.length];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  // Every note is two oscillators; cap how many can ring at once so fast play can't flood the audio thread.
  let liveOsc = 0;
  const oscCap = () => S.fx === 'calm' ? 16 : lite ? 28 : 48;
  function tone(freq, vol, dur, partial, pg = 0.22) {
    if (liveOsc >= oscCap()) return;
    liveOsc += 2;
    const now = AC.currentTime;
    const g = AC.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    g.connect(master);
    const o1 = AC.createOscillator(); o1.type = 'sine'; o1.frequency.value = freq;
    const o2 = AC.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * partial;
    const g2 = AC.createGain(); g2.gain.value = pg;
    o1.connect(g); o2.connect(g2); g2.connect(g);
    o1.onended = () => { liveOsc -= 2; g.disconnect(); };
    o1.start(now); o2.start(now); o1.stop(now + dur + 0.1); o2.stop(now + dur + 0.1);
  }
  function note(y, tier, e, o) {
    if (!audible()) return;
    const now = AC.currentTime;
    if (now - (o.lastNote || 0) < 0.13 || noteBudget < 1) return;
    noteBudget -= 1; o.lastNote = now;
    tone(freqFor(y, tier, 50, S.depth), 0.05 * (0.25 + 0.75 * e), 1.6, 2.76);
  }
  function bellNote(b, e, crossed) {
    if (!audible()) return;
    const now = AC.currentTime;
    if (now - (b.lastNote || 0) < 0.15 || noteBudget < 1) return;
    noteBudget -= 1; b.lastNote = now;
    const f = freqFor(b.y, b.bt, 45, S.sea.soundings + 1);
    tone(f, 0.055 * (0.25 + 0.75 * e), 2.6, 2.0, 0.3);
    if (crossed) tone(f * 2, 0.04, 1.4, 1.5);
  }
  function boomSound() {
    if (!audible()) return;
    const root = 440 * Math.pow(2, (38 - 69) / 12);
    tone(root, 0.14, 3.2, 1.5); tone(root * 1.5, 0.06, 2.4, 2.2);
  }
  function chordSound() {
    if (!audible()) return;
    const seen = new Set();
    for (const c of S.crystals) {
      const f = Math.round(freqFor(c.y, c.t, 50, S.depth));
      if (seen.has(f) || seen.size >= 8) continue;
      seen.add(f); tone(f, 0.06, 3.5, 2.76);
    }
  }
  function waterSound() {
    if (!audible()) return;
    const len = AC.sampleRate * 3, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len);
    const src = AC.createBufferSource(); src.buffer = buf;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    const g = AC.createGain(); g.gain.value = 0.25;
    src.connect(lp); lp.connect(g); g.connect(master); src.start();
  }
  function setMuted(m) {
    S.muted = m;
    if (master) master.gain.value = m ? 0 : 0.55;
    const b = $('soundBtn');
    b.textContent = m ? 'Sound off' : 'Sound on';
    b.setAttribute('aria-pressed', String(!m));
    syncSeg('snd', m ? 'off' : 'on');
  }

  // =====================================================================
  // input
  // =====================================================================
  let drag = null, cinematic = false;
  function ptr(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function tap(x, y, fromObj) { if (S.world === 'sea') throwStone(x, y, fromObj); else shout(x, y, fromObj); }

  cv.addEventListener('pointerdown', e => {
    initAudio();
    if (cinematic || sceneOpen) return;
    const p = ptr(e);
    const o = objAt(p.x, p.y);
    if (o) {
      drag = { o, sx: p.x, sy: p.y, ox: o.x, oy: o.y, moved: false };
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      return;
    }
    tap(p.x, p.y, null);
  });
  cv.addEventListener('pointermove', e => {
    if (!drag) return;
    const p = ptr(e);
    if (!drag.moved && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 5) drag.moved = true;
    if (drag.moved) { setObjPx(drag.o, p.x, p.y); drag.bin = binObjects().includes(drag.o) ? binAt(p.x, p.y) : null; }
  });
  cv.addEventListener('pointerup', () => {
    if (!drag) return;
    const o = drag.o;
    if (!drag.moved) tap(o.px, o.py, o);
    else if (drag.bin) dropInBin(o, drag.bin);
    else {
      const tw = twinOf(o);
      if (tw) fuse(o, tw);
      else if (!validSpot(o.px, o.py, o.r, o)) { o.x = drag.ox; o.y = drag.oy; placeObj(o); }
    }
    drag = null;
  });
  cv.addEventListener('pointercancel', () => {
    if (drag) { drag.o.x = drag.ox; drag.o.y = drag.oy; placeObj(drag.o); drag = null; }
  });

  // Drop zones accept only the current world's crystals or bells.
  // Fuse joins any available twin; Crush removes the dragged object without a reward.
  const BIN_W = 120, BIN_H = 46, BIN_LABEL = { fuse: 'Fuse', crush: 'Crush' };
  const binsOn = () => S.world === 'sea' ? S.sea.unlocked : S.stats.maxDepth >= 1;
  const binObjects = () => S.world === 'sea' ? S.sea.bells : S.crystals;
  const binRect = k => ({ x: k === 'fuse' ? 12 : W - 12 - BIN_W, y: H - 12 - BIN_H, w: BIN_W, h: BIN_H });
  function binAt(x, y) {
    if (!binsOn()) return null;
    for (const k of ['fuse', 'crush']) {
      const r = binRect(k);
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return k;
    }
    return null;
  }
  function dropInBin(o, bin) {
    const list = binObjects(), isBell = S.world === 'sea', key = isBell ? 'bt' : 't';
    if (!binsOn() || !list.includes(o)) return;
    if (bin === 'fuse') {
      const tw = o[key] >= 3 ? null : list.find(c => c !== o && c[key] === o[key]);
      if (tw) { fuse(o, tw); updateUI(); save(); return; }
      whisper(o[key] >= 3 ? `This ${isBell ? 'bell' : 'stone'} is as deep as it goes.` : 'No twin to fuse it with.');
    } else if (bin === 'crush') {
      list.splice(list.indexOf(o), 1); o.dead = true;
      rings.push({ x: o.px, y: o.py, r: o.r, life: 1 });
      whisper(isBell ? 'The bell breaks. There is room again.' : 'The stone crumbles. There is room again.');
      updateUI(); save(); return;
    }
    if (drag && drag.o === o) { o.x = drag.ox; o.y = drag.oy; placeObj(o); }
  }
  function drawBins() {
    if (!drag || !drag.moved || !binObjects().includes(drag.o) || !binsOn()) return;
    ctx.save();
    ctx.font = '600 13px ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const k of ['fuse', 'crush']) {
      const r = binRect(k), hot = drag.bin === k;
      ctx.fillStyle = k === 'fuse' ? (hot ? 'rgba(255,207,134,.32)' : 'rgba(255,207,134,.12)') : (hot ? 'rgba(255,138,122,.34)' : 'rgba(255,138,122,.12)');
      ctx.strokeStyle = k === 'fuse' ? '#ffcf86' : '#ff8a7a'; ctx.lineWidth = hot ? 2.5 : 1.5; ctx.setLineDash(hot ? [] : [6, 5]);
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(r.x, r.y, r.w, r.h, 10) : ctx.rect(r.x, r.y, r.w, r.h); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]); ctx.fillStyle = k === 'fuse' ? '#ffcf86' : '#ff8a7a';
      ctx.fillText(BIN_LABEL[k], r.x + r.w / 2, r.y + r.h / 2);
    }
    ctx.restore();
  }

  function fuse(c, into) {
    const isBell = c.bt != null;
    const list = isBell ? S.sea.bells : S.crystals, key = isBell ? 'bt' : 't';
    const i = list.indexOf(c);
    if (i < 0 || c === into || !list.includes(into) || c[key] !== into[key] || c[key] >= 3) return;
    list.splice(i, 1);
    c.dead = true; S.stats.fuses++;
    into[key] += 1; placeObj(into); into.ring = 1;
    into.strain = (into.strain || 0) + (c.strain || 0);
    rings.push({ x: into.px, y: into.py, r: into.r, life: 1 });
    if (isBell) once('firstBellFuse');
    else { once('firstFuse'); tierWhisper(into.t); }
  }
  $('soundBtn').addEventListener('click', () => { initAudio(); setMuted(!S.muted); });

  // ---------- settings ----------
  const segButtons = kind => document.querySelectorAll ? [...document.querySelectorAll(`[data-${kind}-opt]`)] : [];
  function syncSeg(kind, val) { for (const b of segButtons(kind)) b.setAttribute('aria-pressed', String(b.dataset[kind + 'Opt'] === val)); }
  function setFx(v) {
    S.fx = v;
    capP = Math.min(capP, fxLimits().p); capR = Math.min(capR, fxLimits().r);
    syncSeg('fx', v);
    updateLite(); resize(); updateUI();
  }
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;
  function applyTheme() {
    const t = S.theme === 'system' ? (mq && mq.matches ? 'light' : 'dark') : S.theme;
    const was = LT; LT = t === 'light';
    if (document.documentElement) document.documentElement.setAttribute('data-gc-theme', t);
    syncSeg('theme', S.theme);
    if (was !== LT && W > 0) resize();
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => { if (S.theme === 'system') applyTheme(); });
  function applyTs() { document.documentElement.style.setProperty('--ts', S.ts); syncSeg('ts', String(S.ts)); }
  for (const b of segButtons('ts')) b.addEventListener('click', () => { S.ts = +b.dataset.tsOpt; applyTs(); save(); });
  for (const b of segButtons('theme')) b.addEventListener('click', () => { S.theme = b.dataset.themeOpt; applyTheme(); save(); });
  for (const b of segButtons('fx')) b.addEventListener('click', () => { setFx(b.dataset.fxOpt); save(); });
  for (const b of segButtons('snd')) b.addEventListener('click', () => { initAudio(); setMuted(b.dataset.sndOpt === 'off'); save(); });
  let setOpen = false;
  function openSettings() { setOpen = true; $('settings').hidden = false; saveMsg(''); syncNum(); syncBackupBtn(); syncSeg('theme', S.theme); syncSeg('ts', String(S.ts)); syncSeg('fx', S.fx); syncSeg('snd', S.muted ? 'off' : 'on'); $('setClose').focus(); }
  function closeSettings() { setOpen = false; $('settings').hidden = true; $('setBtn').focus(); }
  $('setBtn').addEventListener('click', () => { initAudio(); setOpen ? closeSettings() : openSettings(); });
  $('setClose').addEventListener('click', closeSettings);
  $('settings').addEventListener('click', e => { if (e.target === $('settings')) closeSettings(); });
  window.addEventListener('keydown', e => { if (setOpen && e.key === 'Escape') closeSettings(); });

  // ---------- what's new ----------
  let newsOpen = false, awayOpen = false;
  let newsMode = 'auto';
  function renderNews() {
    const cur = CHANGES[0], hist = newsMode === 'history';
    $('newsTitle').textContent = hist ? 'Version history' : `${cur.ver}: ${cur.head}`;
    $('newsSub').textContent = hist ? `You are on ${VERSION}. Newest first.` : `Released ${cur.date}`;
    const refund = !hist && S.refund && (S.refund.fossils || S.refund.lumen || S.refund.fathoms) ? S.refund : null;
    const bits = refund ? [['fossil', refund.fossils], ['lumen', refund.lumen], ['fathom', refund.fathoms]].filter(b => b[1] > 0).map(b => `${fmt(b[1])} ${b[0]}${b[0] === 'lumen' || b[1] === 1 ? '' : 's'}`) : [];
    $('newsBody').innerHTML =
      (bits.length ? `<div class="page"><h3>A refund for the changes</h3><p>Levels past 10 in the four multipliers, and Wide Cavern levels, now give less than they did, so the cave paid you back ${bits.join(', ')}.</p></div>` : '') +
      '<div>' + CHANGES.map((c, i) => {
        const open = i === 0 || (!hist && cmpVer(c.ver, S.seenVer) > 0);
        return `<details class="ver"${open ? ' open' : ''}><summary><b>${c.ver}</b><span>${c.head}</span>${i === 0 ? '<span class="now">current</span>' : ''}<em>${c.date}</em></summary><ul>${c.items.map(t => `<li>${t}</li>`).join('')}</ul></details>`;
      }).join('') + '</div>';
  }
  function openNews(mode) { newsMode = mode === 'history' ? 'history' : 'auto'; newsOpen = true; renderNews(); $('news').hidden = false; $('newsClose').focus(); }
  function closeNews() {
    newsOpen = false; $('news').hidden = true;
    if (newsMode === 'auto') { S.seenVer = VERSION; S.refund = null; save(); }
  }
  function maybeShowNews() { if (cmpVer(S.seenVer, VERSION) < 0 && !newsOpen && !awayOpen) setTimeout(() => { if (!awayOpen) openNews('auto'); }, 600); }
  $('newsBtn').addEventListener('click', () => { closeSettings(); openNews('history'); });
  $('verChip').textContent = `v${VERSION} ${CHANNEL}`;
  $('verChip').addEventListener('click', () => { if (!newsOpen && !sceneOpen && !cinematic) openNews('history'); });
  $('newsClose').addEventListener('click', closeNews);
  window.addEventListener('keydown', e => { if (newsOpen && e.key === 'Escape') closeNews(); });
  $('verNote').textContent = `Geode Choir ${VERSION} (${CHANNEL})`;

  // ---------- numbers, save codes ----------
  function syncNum() { syncSeg('num', S.numfmt); }
  document.querySelectorAll('[data-num-opt]').forEach(b => b.addEventListener('click', () => { S.numfmt = b.dataset.numOpt; syncNum(); updateUI(); }));
  const saveMsg = t => { $('saveMsg').textContent = t; };
  let loadArmed = 0, restoreArmed = 0;
  function syncBackupBtn() {
    const b = readBackup();
    $('saveRestore').hidden = !b;
    if (b) $('saveRestore').title = `Backup from ${new Date(b.at).toLocaleString()}`;
  }
  $('saveCopy').addEventListener('click', () => {
    let code;
    try { code = encodeSave(); } catch (_) { saveMsg('Could not make a code.'); return; }
    const box = $('saveBox'); box.value = code; box.focus(); box.select();
    const done = () => saveMsg('Copied. Keep it somewhere safe.');
    const manual = () => saveMsg('Select the text above and copy it.');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done, manual); else manual();
  });
  $('saveLoad').addEventListener('click', () => {
    const d = decodeSave($('saveBox').value);
    if (!d) { saveMsg('That is not a Geode Choir save code.'); loadArmed = 0; return; }
    if (Date.now() - loadArmed > 4000) { loadArmed = Date.now(); saveMsg('This replaces your current save. Click again to load it. A backup is kept.'); return; }
    loadArmed = 0;
    if (!replaceSaveAndReload(d)) saveMsg('Could not write the save. Storage may be full or blocked.');
  });
  $('saveRestore').addEventListener('click', () => {
    const b = readBackup(); if (!b) return;
    if (Date.now() - restoreArmed > 4000) { restoreArmed = Date.now(); saveMsg(`Click again to swap back to the backup from ${new Date(b.at).toLocaleString()}. Your current save becomes the backup.`); return; }
    restoreArmed = 0;
    let d = null; try { d = JSON.parse(b.data); } catch (_) {}
    if (!d || typeof d.hum !== 'number' || !replaceSaveAndReload(d)) saveMsg('That backup could not be restored.');
  });

  // =====================================================================
  // shop
  // =====================================================================
  const ICONS = {
    gem: c => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><polygon points="15,2 24,9 24,20 15,27 6,20 6,9" fill="${c}"/><polygon points="15,2 15,27 6,20 6,9" fill="rgba(10,6,20,.32)"/><polygon points="15,2 24,9 17,12" fill="rgba(255,255,255,.4)"/></svg>`,
    tune: (c, ring = '#d6a8ff') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><polygon points="15,5 21,10 21,18 15,23 9,18 9,10" fill="${c}"/><circle cx="15" cy="14" r="12.5" fill="none" stroke="${ring}" stroke-width="1.2" stroke-dasharray="2 3"/></svg>`,
    bell: c => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 21Q7 12 10 8Q15 3 20 8Q23 12 24 21Z" fill="${c}"/><rect x="5" y="20" width="20" height="3" rx="1" fill="${c}" opacity=".7"/><circle cx="15" cy="25" r="2" fill="#222"/></svg>`,
    lungs: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="3" fill="#8ff2e6"/><circle cx="15" cy="15" r="8" fill="none" stroke="#8ff2e6" stroke-width="1.5" opacity=".7"/><circle cx="15" cy="15" r="13" fill="none" stroke="#8ff2e6" stroke-width="1.2" opacity=".35"/></svg>`,
    drip: (c = '#86c9ff') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 3C15 3 7 13 7 18a8 8 0 0 0 16 0C23 13 15 3 15 3Z" fill="${c}"/><path d="M11 18a4 4 0 0 0 4 4" stroke="#fff" stroke-width="1.5" fill="none" opacity=".6"/></svg>`,
    bat: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 12Q10 9 3 12Q7 14 7 18Q11 16 15 19Q19 16 23 18Q23 14 27 12Q20 9 15 12Z" fill="#d6caec"/></svg>`,
    wave: (c = '#8ff2e6') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M2 15q3.25-9 6.5 0t6.5 0 6.5 0 6.5 0" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/></svg>`,
    spark: (c = '#ffcf86') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 2L17.5 12.5L28 15L17.5 17.5L15 28L12.5 17.5L2 15L12.5 12.5Z" fill="${c}"/></svg>`,
    fork: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M10 3v11a5 5 0 0 0 10 0V3" fill="none" stroke="#b58cff" stroke-width="2.2" stroke-linecap="round"/><path d="M15 19v9" stroke="#b58cff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    chisel: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M6 24L18 12M18 12l4-4 3 3-4 4z" fill="none" stroke="#e3edf5" stroke-width="2" stroke-linecap="round"/><path d="M4 26l3-1-1-1z" fill="#e3edf5"/></svg>`,
    prism: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9ad5"/><stop offset=".4" stop-color="#ffe38a"/><stop offset=".7" stop-color="#8ff2e6"/><stop offset="1" stop-color="#a58bff"/></linearGradient></defs><polygon points="15,3 27,25 3,25" fill="rgba(255,255,255,.1)" stroke="url(#pg)" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
    lode: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="13" fill="none" stroke="#8c7aa8" stroke-dasharray="2 3"/><circle cx="15" cy="15" r="7" fill="#2a2233" stroke="#8c7aa8" stroke-width="1.5"/><circle cx="15" cy="15" r="2.4" fill="#b58cff"/></svg>`,
    gong: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12" fill="#c98f45"/><circle cx="15" cy="15" r="8" fill="none" stroke="rgba(40,20,5,.5)"/><circle cx="15" cy="15" r="4.5" fill="none" stroke="rgba(40,20,5,.5)"/></svg>`,
    bone: (c = '#e8d5b0') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 4a11 11 0 1 0 0.01 0M15 9a6 6 0 1 1-0.01 0M15 13a2 2 0 1 0 0.01 0" fill="none" stroke="${c}" stroke-width="1.8"/></svg>`,
    layers: (c = '#e8d5b0') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M3 9q6-3 12 0t12 0M3 15q6-3 12 0t12 0M3 21q6-3 12 0t12 0" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    widen: (c = '#e8d5b0') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M4 15h22M4 15l5-5M4 15l5 5M26 15l-5-5M26 15l-5 5" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    crack: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><polygon points="15,3 24,9 24,20 15,27 6,20 6,9" fill="none" stroke="#e8d5b0" stroke-width="1.5"/><path d="M15 6l-3 7 5 3-4 8" fill="none" stroke="#d6a8ff" stroke-width="1.8"/></svg>`,
    worm: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 2v20" stroke="#7fb8ff" stroke-width="1" opacity=".6"/><circle cx="15" cy="7" r="1.3" fill="#a0cdff"/><circle cx="15" cy="12" r="1.3" fill="#a0cdff"/><circle cx="15" cy="17" r="1.3" fill="#a0cdff"/><circle cx="15" cy="24" r="4.5" fill="#7fb8ff"/></svg>`,
    firefly: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="9" fill="rgba(255,220,140,.18)"/><circle cx="15" cy="15" r="4" fill="#ffdc8c"/><path d="M8 9l3 3M22 9l-3 3" stroke="#ffdc8c" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    lantern: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><rect x="9" y="8" width="12" height="16" rx="3" fill="none" stroke="#7fb8ff" stroke-width="1.8"/><circle cx="15" cy="16" r="3.5" fill="#ffcf86"/><path d="M12 8V5h6v3" fill="none" stroke="#7fb8ff" stroke-width="1.8"/></svg>`,
    silk: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 3v24M5 8l20 14M25 8L5 22" stroke="#7fb8ff" stroke-width="1.2"/><circle cx="15" cy="15" r="6" fill="none" stroke="#7fb8ff" stroke-width="1.2"/><circle cx="15" cy="15" r="10" fill="none" stroke="#7fb8ff" stroke-width="1" opacity=".6"/></svg>`,
    gear: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="6" fill="none" stroke="#7fb8ff" stroke-width="2"/><path d="M15 3v5M15 22v5M3 15h5M22 15h5M6.5 6.5l3.5 3.5M20 20l3.5 3.5M6.5 23.5l3.5-3.5M20 10l3.5-3.5" stroke="#7fb8ff" stroke-width="2" stroke-linecap="round"/></svg>`,
    down: (c = '#7fb8ff') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 4v18M8 15l7 7 7-7" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/><path d="M5 27h20" stroke="#e8d5b0" stroke-width="2" stroke-linecap="round"/></svg>`,
    chest: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><polygon points="15,4 26,24 4,24" fill="none" stroke="#7fb8ff" stroke-width="1.8"/><circle cx="15" cy="18" r="3" fill="#c98f45"/></svg>`,
    stone: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><ellipse cx="9" cy="18" rx="5" ry="3" fill="#8a96a0"/><circle cx="17" cy="18" r="2.5" fill="none" stroke="#86d8e6"/><circle cx="24" cy="18" r="2" fill="none" stroke="#86d8e6" opacity=".6"/></svg>`,
    fish: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M5 20Q15 4 25 14" fill="none" stroke="#86d8e6" stroke-width="1" stroke-dasharray="2 2"/><ellipse cx="14" cy="11" rx="6" ry="2.6" fill="#a9dbe4" transform="rotate(-25 14 11)"/></svg>`,
    lighthouse: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M12 27l1.5-16h3L18 27z" fill="#d9d2c4"/><rect x="12.5" y="17" width="5" height="2.5" fill="#b54848"/><circle cx="15" cy="8" r="3" fill="#ffe6aa"/><path d="M18 8L29 4v8z" fill="rgba(255,230,170,.35)"/></svg>`,
    cross: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><circle cx="11" cy="15" r="8" fill="none" stroke="#86d8e6" stroke-width="1.5"/><circle cx="19" cy="15" r="8" fill="none" stroke="#86d8e6" stroke-width="1.5"/><circle cx="15" cy="9" r="2.2" fill="#ffcf86"/><circle cx="15" cy="21" r="2.2" fill="#ffcf86"/></svg>`,
    buoy: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M2 20h26" stroke="#86d8e6" stroke-width="1.2" stroke-dasharray="3 3"/><circle cx="8" cy="18" r="3" fill="#c96a5a"/><circle cx="22" cy="18" r="3" fill="#c96a5a"/></svg>`,
    oyster: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M4 17a11 7 0 0 0 22 0z" fill="#4a4655"/><path d="M4 16a11 8 0 0 1 22 0z" fill="#6a6577" transform="rotate(-12 15 16)"/><circle cx="15" cy="16" r="3" fill="#f5f0e6"/></svg>`,
    breakwater: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><ellipse cx="15" cy="16" rx="11" ry="6" fill="#39414a" stroke="#a9dbe4" stroke-width="1"/><path d="M3 24q3-3 6 0t6 0 6 0 6 0" fill="none" stroke="#86d8e6" stroke-width="1.2"/></svg>`,
    raft: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><rect x="5" y="9" width="20" height="13" fill="#7a5a3a"/><circle cx="15" cy="15.5" r="5" fill="#d9c3a0"/></svg>`,
    whirl: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M15 15m-2 0a2 2 0 1 1 4 0a5 5 0 1 1-9 0a8 8 0 1 1 15 2" fill="none" stroke="#86d8e6" stroke-width="1.8" stroke-linecap="round"/></svg>`,
    horn: (c = '#ff8fa3') => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M4 25C5 13 13 5 26 4C21 8 15 14 11 25Z" fill="${c}"/><path d="M8 20l4 1M10 15l4 1.5M14 10l3 2" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/></svg>`,
    rack: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M4 8h22" stroke="#f6efe2" stroke-width="2"/><path d="M8 8v14M15 8v14M22 8v14" stroke="#f6efe2" stroke-width="1.2" opacity=".7"/></svg>`,
    ear: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="11" fill="none" stroke="#f6efe2" stroke-width="1.6"/><path d="M15 8v7l5 3" stroke="#f6efe2" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>`,
    whet: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><rect x="4" y="17" width="22" height="7" rx="2" fill="#8a8494"/><path d="M8 14L22 6" stroke="#f6efe2" stroke-width="2.2" stroke-linecap="round"/></svg>`,
    branch: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M8 27C9 18 12 11 20 5M12 16C15 14 19 13 25 13" fill="none" stroke="#f6efe2" stroke-width="2" stroke-linecap="round"/></svg>`,
    choir: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><path d="M3 12h24" stroke="#86d8e6" stroke-width="1" opacity=".5"/><polygon points="10,2 13,5 13,9 10,11 7,9 7,5" fill="#b58cff"/><polygon points="20,3 22,5 22,8 20,10 18,8 18,5" fill="#e3edf5"/><path d="M4 22q3-3 6 0t6 0 6 0 6 0" fill="none" stroke="#86d8e6" stroke-width="1.5"/></svg>`,
    stones: () => `<svg class="sw" viewBox="0 0 30 30" aria-hidden="true"><ellipse cx="10" cy="20" rx="6" ry="4" fill="#5b5566"/><ellipse cx="20" cy="19" rx="5" ry="3.5" fill="#6a6577"/><path d="M15 4v8M11 8l4 4 4-4" stroke="#ffcf86" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`,
  };
  const UNIT_LABEL = { hum: '', tide: '', shard: ' shards', fossil: ' fossils', lumen: ' lumen', pearl: ' pearl dust', fathom: ' fathoms', ivory: ' ivory', gilt: ' gilt' };

  const shopEls = [], shopSpecs = [];
  // spec: { parent, icon, unit | unit(), name(), cost() -> number|null, desc(), show(), buy() -> bool, state()?, blocked()? }
  function addItem(spec) {
    shopSpecs.push(spec);
    simulation?.items.push(spec);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'item';
    b.innerHTML = `${spec.icon}<span class="nm"></span><span class="cs"></span><span class="ds"></span>`;
    const nm = b.querySelector('.nm'), cs = b.querySelector('.cs'), ds = b.querySelector('.ds');
    b.addEventListener('click', () => {
      initAudio();
      if (spec.buy()) {
        refreshAll(); syncVoices();
        b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
        updateUI();
      }
    });
    // Repeatable upgrades get ×5 and Max beside them. Each click is just the normal buy, repeated.
    const row = document.createElement('div');
    row.className = 'itemrow';
    row.appendChild(b);
    let bulk = null;
    if (spec.bulk) {
      bulk = document.createElement('div');
      bulk.className = 'bulk';
      bulk.innerHTML = '<button type="button" data-n="5" title="Buy up to 5">×5</button><button type="button" data-n="max" title="Buy as many as you can afford">Max</button>';
      row.appendChild(bulk);
      bulk.addEventListener('click', e => {
        const t = e.target.closest('button[data-n]');
        if (!t) return;
        initAudio();
        const n = t.dataset.n === 'max' ? 999 : +t.dataset.n;
        let c = 0;
        while (c < n && spec.buy()) c++;
        if (c) { refreshAll(); syncVoices(); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); updateUI(); }
      });
    }
    let step = null;
    if (spec.stepper) {
      step = document.createElement('div');
      step.className = 'bulk';
      step.innerHTML = '<button type="button" data-d="-1" title="Descend sooner" aria-label="Lower">\u2212</button><button type="button" data-d="1" title="Wait for more" aria-label="Raise">+</button>';
      row.appendChild(step);
      step.addEventListener('click', e => {
        const t = e.target.closest('button[data-d]');
        if (!t) return;
        spec.stepper.set(+t.dataset.d);
        updateUI();
      });
    }
    $(spec.parent).appendChild(row);
    const panel = $(spec.parent).closest ? $(spec.parent).closest('.panel') : null;
    // Only touch the DOM when something actually changed; skip rows on hidden tabs entirely.
    const last = {};
    const put = (key, v, apply) => { if (last[key] !== v) { last[key] = v; apply(v); } };
    shopEls.push({
      update() {
        if (panel && panel.hidden) return;
        const shown = spec.show ? spec.show() : true;
        put('hidden', !shown, v => { row.hidden = v; });
        if (!shown) return;
        if (step) put('step', !spec.stepper.show(), v => { step.hidden = v; });
        const unit = typeof spec.unit === 'function' ? spec.unit() : spec.unit;
        put('nm', spec.name(), v => { nm.innerHTML = v; });
        put('ds', spec.desc(), v => { ds.textContent = v; });
        const st = spec.state ? spec.state() : null;
        const cost = st ? null : spec.cost();
        let csHtml, csCls, maxed = false;
        if (st === 'on' || st === 'off') { csHtml = st === 'on' ? 'On' : 'Off'; csCls = 'cs state' + (st === 'off' ? ' off' : ''); }
        else if (cost == null) { csHtml = 'Max'; csCls = 'cs state off'; maxed = true; }
        else { csHtml = fmt(cost) + (UNIT_LABEL[unit] ? `<small>${UNIT_LABEL[unit]}</small>` : ''); csCls = 'cs' + (unit !== 'hum' ? ' ' + unit : ''); }
        put('csH', csHtml, v => { cs.innerHTML = v; });
        put('csC', csCls, v => { cs.className = v; });
        put('max', maxed, v => { b.classList.toggle('maxed', v); if (bulk) bulk.hidden = v; });
        put('poor', !st && cost != null && (have(unit) < cost || !!(spec.blocked && spec.blocked())), v => { b.classList.toggle('poor', v); if (bulk) bulk.classList.toggle('dim', v); });
      },
    });
  }
  const lvl = (label, n, pre = 'Lv ') => `${label}<span class="lv">${pre}${n}</span>`;
  // A levelled upgrade. o: parent, icon, unit, name, get(), inc(), base, g, max, desc(l), show(), gate, pre, single, onBuy
  function lvItem(o) {
    const costOf = () => Math.ceil(o.base * Math.pow(o.g, o.get()));
    const maxOf = () => typeof o.max === 'function' ? o.max() : (o.max ?? 1e9);
    addItem({
      bulk: !o.single && maxOf() > 1, blocked: o.blocked,
      parent: o.parent, icon: o.icon, unit: o.unit,
      show: () => {
        if (!o.gate) return o.show ? o.show() : true;
        if (o.get() > 0 || S.seen[o.gate]) return true;
        if (o.show()) { S.seen[o.gate] = 1; return true; }
        return false;
      },
      name: () => o.single ? o.name : lvl(o.name, o.get(), o.pre || 'Lv '),
      cost: () => o.get() >= maxOf() ? null : costOf(),
      desc: () => o.desc(o.get()),
      buy: () => {
        if (o.get() >= maxOf()) return false;
        if (o.blocked && o.blocked()) return false;
        if (!spend(o.unit, costOf())) return false;
        o.inc(); if (o.onBuy) o.onBuy();
        return true;
      },
    });
  }

  const pearlUI = createPearlUI({ state: () => S,
    active: () => S.tab === 'pearls' && !document.hidden && !cinematic && !sceneOpen && !awayOpen && !newsOpen,
    changed: () => { refreshAll(); save(); updateUI(); },
  });
  const shellUI = createShellUI({ state: () => S,
    active: () => S.tab === 'deep' && !document.hidden && !cinematic && !sceneOpen && !awayOpen && !newsOpen,
    changed: () => { save(); updateUI(); },
  });

  // An oyster has washed open: it pays pearl dust, and reveals a pearl when one has formed.
  function oysterOpened(o) {
    const q = S.sea, n = SK.pearl; q.pearls += n; S.stats.pearls += n;
    pushFloat({ x: o.px, y: o.py - o.r * 1.8, s: `+${fmt(n)} dust`, life: 1.2, col: '239,230,216' });
    once('firstPearl');
    const found = openOyster(S);
    if (found) pearlFound(found, o);
  }
  function pearlFound(p, o) {
    const spec = PEARL_RARITY[p.r];
    if (S.pearls.equipped.length < PEARL_SLOTS) equipPearlItem(S, p.id);
    pushFloat({ x: o.px, y: o.py - o.r * 2.6, s: `${spec.name} pearl!`, life: 1.8, col: '255,230,170' });
    toast('Pearl', `${spec.name}: the ${p.name}. Wear it from the Pearls tab.`, p.r >= 2 ? 'lore' : '');
    delete S.seen.tab_pearls; computeHB(); refreshSK();
  }

  function buildShop() {
    $('caveAutoCategories').innerHTML = Object.entries(CAVE_CATEGORIES).map(([k, c]) =>
      `<label><input type="checkbox" data-cave-category="${k}"> ${c.name}</label>`).join('');
    $('caveAutoReserves').innerHTML = Object.entries(CAVE_RESERVES).map(([k, name]) =>
      `<label>${name}<input type="number" min="0" step="any" inputmode="decimal" data-cave-reserve="${k}" aria-label="Reserve ${name.toLowerCase()}"></label>`).join('');
    addItem({ parent: 'shopCaveAutomation', icon: ICONS.gear(), unit: 'fathom',
      name: () => 'Patient Choir', show: () => S.hearts >= 2 || S.caveAutomation.unlocked,
      cost: () => S.caveAutomation.unlocked ? null : CAVE_AUTOMATION_COST,
      blocked: () => S.hearts < 2,
      desc: () => S.caveAutomation.unlocked ? 'Cave upgrade automation is unlocked forever. Choose categories and reserves below.'
        : 'Unlock cave upgrade automation forever. Requires two Heartstones. Categories start off; choose which shops can spend and how much to reserve.',
      buy: () => {
        if (S.hearts < 2 || S.caveAutomation.unlocked || !spend('fathom', CAVE_AUTOMATION_COST)) return false;
        S.caveAutomation.unlocked = true; save(); return true;
      },
    });
    // ------------------------------- cave: crystals, voices, tuning (hum)
    TIERS.forEach((tier, t) => addItem({
      bulk: true, parent: 'shopCrystals', icon: ICONS.gem(tier.color), unit: 'hum',
      show: () => t === 0 || S.crystals.some(c => c.t === t) || S.bought[t] > 0 || S.run >= tier.base * 0.4,
      name: () => lvl(tier.name, S.crystals.filter(c => c.t === t).length, '×'),
      cost: () => crystalCost(t),
      blocked: () => S.crystals.length >= maxCrystals(),
      desc: () => S.crystals.length >= maxCrystals() ? 'The cave is full. Fuse twins, or chisel out more room.' :
        `Rings for ${fmt(tier.value * K.att[t] * K.crys * K.pol * K.dm * K.fh)} hum per echo`,
      buy: () => buyCrystal(t),
    }));
    const cv_ = (parent, k, name, icon, base, g, show, desc, extra = {}) => lvItem({
      parent, icon, unit: 'hum', name, base, g, show, desc, gate: 'u_' + k,
      get: () => S.lv[k], inc: () => { S.lv[k]++; }, ...extra,
    });
    cv_('shopVoices', 'lungs', 'Lungs', ICONS.lungs(), 25, 1.55, () => true, l => `Each shout: ${shoutN(l)} → ${shoutN(l + 1)} echoes`);
    cv_('shopVoices', 'drips', 'Drip', ICONS.drip(), 40, 1.42, () => S.run >= 12, () => 'Water falls every ~3s and splashes 4 echoes. Rings any crystal it lands on.', { pre: '×', onBuy: () => once('firstDrip') });
    cv_('shopVoices', 'bats', 'Bat', ICONS.bat(), 700, 1.45, () => S.run >= 250, () => 'Flutters through the dark, shouting every ~5s with your lungs.', { pre: '×', onBuy: () => once('firstBat') });
    cv_('shopTuning', 'chisel', 'Chisel', ICONS.chisel(), 400, 2.4, () => S.run >= 100 || S.crystals.length >= 6, l => `Room for ${maxCrystals()} → ${maxCrystals() + 1} crystals`, { max: 12 });
    cv_('shopTuning', 'resonance', 'Resonance', ICONS.wave(), 60, 2.1, () => S.run >= 20, l => `Echoes keep ${pct(retainAt(l))} → ${pct(retainAt(l + 1))} of their voice per bounce`);
    cv_('shopTuning', 'polish', 'Polish', ICONS.spark(), 250, 3, () => S.run >= 120, l => `Crystals ring ×${fmtX(polishAt(l))} → ×${fmtX(polishAt(l + 1))}`);
    cv_('shopTuning', 'harmony', 'Harmony', ICONS.fork(), 1800, 3.4, () => S.run >= 900 && S.crystals.length >= 3, l => `+${15 * (l + 1)}% hum for every extra crystal ringing in the same breath`, { onBuy: () => once('firstHarmony') });

    // ------------------------------- cave: wonders & attunement (shards)
    const wIcon = { prism: ICONS.prism(), lodestone: ICONS.lode(), gong: ICONS.gong() };
    for (const k of Object.keys(WONDERS)) {
      const wd = WONDERS[k];
      addItem({
        parent: 'shopWonders', icon: wIcon[k], unit: 'shard',
        name: () => lvl(wd.name, `${S.wonders.filter(o => o.k === k).length}/${wd.max}`, ''),
        cost: () => S.wonders.filter(o => o.k === k).length >= wd.max ? null : wonderCost(k),
        desc: () => wd.desc,
        buy: () => buyWonder(k),
      });
    }
    TIERS.forEach((tier, t) => lvItem({
      parent: 'shopAttune', icon: ICONS.tune(tier.color), unit: 'shard', name: `Attune ${tier.name}`,
      get: () => S.attune[t], inc: () => { S.attune[t]++; }, base: 4 * (t + 1), g: 2.1,
      show: () => t === 0 || S.attune[t] > 0 || S.crystals.some(c => c.t === t),
      desc: l => `Every ${tier.name.toLowerCase()} rings ×${fmtX(Math.pow(1.6, l))} → ×${fmtX(Math.pow(1.6, l + 1))}`,
    }));

    // ------------------------------- cave: strata (fossils)
    const st = (k, name, icon, base, g, max, desc, show, extra = {}) => lvItem({
      parent: 'shopStrata', icon, unit: 'fossil', name, base, g, max, desc, show,
      get: () => S.strata[k], inc: () => { S.strata[k]++; }, ...extra,
    });
    st('tick', 'Faster Tick', ICONS.gear(), 3, 3.2, tickMax,
      l => l >= tickMax() ? 'Time gates run as fast as this Heartstone allows. Another Heartstone raises the limit.' : `Time gates (the descent lock, Sea settling, horn timers) run ×${fmtX(Math.pow(1.1, l))} → ×${fmtX(Math.pow(1.1, l + 1))} faster. The floor's fade stays on real time.`,
      () => S.depth >= 1 || S.strata.tick > 0);
    st('old', 'Old Echoes', ICONS.layers(), 2, 1.9, 1e9, l => `All hum ×${fmtX(softPow(1.3, l))} → ×${fmtX(softPow(1.3, l + 1))}`);
    st('lungs', 'Deep Lungs', ICONS.lungs(), 2, 1.7, 1e9, l => `Every descent starts with Lungs Lv ${2 * l} → ${2 * (l + 1)}`);
    st('water', 'Old Water', ICONS.drip(), 2, 1.7, 1e9, l => `Every descent starts with ${2 * l} → ${2 * (l + 1)} extra drips`);
    st('seed', 'Seed Crystals', ICONS.gem('#b58cff'), 4, 2, 6, l => `Every descent starts with ${l} → ${l + 1} amethyst already placed`);
    st('wide', 'Wide Cavern', ICONS.widen(), 5, 2.4, 6, l => `Room for 3 more crystals (+${3 * l} → +${3 * (l + 1)})`);
    st('fault', 'Fault Lines', ICONS.crack(), 4, 2, 12, l => `Crystals crack after ${fmt(40 * Math.pow(0.8, l))} → ${fmt(40 * Math.pow(0.8, l + 1))} ringing, shedding shards sooner`);
    st('record', 'Fossil Record', ICONS.bone(), 6, 2.3, 1e9, l => `Fossils from each descent ×${fmt(Math.pow(1.25, l))} → ×${fmt(Math.pow(1.25, l + 1))}`);
    st('nest', 'Glowworm Nest', ICONS.worm(), 15, 1, 1,
      l => l ? 'Glowworms hang from the ceiling of every cave. Opens the Glow ledger.' : 'A glowworm moves in. It eats echoes and turns them into lumen. Opens the Glow ledger, and the road to the Heartstone.',
      () => S.strata.nest > 0 || S.depth >= 10, { single: true, onBuy: () => { once('nest'); buildWorms(); } });
    st('worm', 'Glowworm', ICONS.worm(), 6, 1.8, 19, l => `${1 + l} → ${2 + l} glowworms on the ceiling`, () => S.strata.nest > 0, { onBuy: () => buildWorms() });

    // ------------------------------- cave: illuminations (lumen)
    const il = (k, name, icon, base, g, max, desc, extra = {}) => lvItem({
      parent: 'shopGlow', icon, unit: 'lumen', name, base, g, max, desc,
      get: () => S.illum[k], inc: () => { S.illum[k]++; }, ...extra,
    });
    const toggle = (k, name, icon, cost, desc, parent = 'shopGlow', unit = 'lumen', extra = {}) => addItem({
      parent, icon, unit, name: () => name,
      state: () => S.illum[k] ? (S.toggles[k] ? 'on' : 'off') : null,
      cost: () => cost,
      desc: () => { const d = typeof desc === 'function' ? desc() : desc; return S.illum[k] ? `${d} Click to turn ${S.toggles[k] ? 'off' : 'on'}.` : d; },
      buy: () => {
        if (S.illum[k]) { S.toggles[k] = S.toggles[k] ? 0 : 1; return true; }
        if (!spend(unit, cost)) return false;
        S.illum[k] = 1; S.toggles[k] = 1;
        return true;
      },
      ...extra,
    });
    il('firefly', 'Firefly Hands', ICONS.firefly(), 4, 2, 15, l => l ? `Shouts somewhere random every ${Math.max(0.3, 3 * Math.pow(0.8, l - 1)).toFixed(1)}s → ${Math.max(0.3, 3 * Math.pow(0.8, l)).toFixed(1)}s` : 'Something shouts for you every 3s, even while you’re away.', { onBuy: () => once('firstFirefly') });
    il('lantern', 'Lantern', ICONS.lantern(), 8, 2.3, 1e9, l => `All hum ×${fmtX(softPow(1.3, l))} → ×${fmtX(softPow(1.3, l + 1))}`);
    il('silk', 'Silk Threads', ICONS.silk(), 12, 2.0, 1e9, l => `Glowworms make lumen ×${fmtX(softPow(1.35, l))} → ×${fmtX(softPow(1.35, l + 1))}`);
    toggle('autofuse', 'Patient Hands', ICONS.gear(), 12, 'Fuses twin crystals for you. Stays with you through every descent.', 'shopStrata', 'fossil');
    toggle('autobuy', 'Crystal Seeker', ICONS.gear(), 60, 'Buys the best crystal you can afford. Stays with you through every descent.', 'shopWonders', 'shard');
    il('carry', 'Carry Wonders', ICONS.chest(), 60, 1, 1, l => l ? 'Your wonders come with you when you descend.' : 'Wonders come down with you when you descend, instead of being lost.', { single: true });
    toggle('autodescend', 'Sinking Stone', ICONS.down(), 90,
      () => `Descends on its own once you’ve sung ${sinkMult()}× what the floor needs.`, 'shopGlow', 'lumen', {
      stepper: { show: () => !!S.illum.autodescend, set: d => { S.toggles.sinkMult = Math.min(10, Math.max(1, sinkMult() + d)); save(); } },
    });

    // ------------------------------- sea: bells, voices, tuning (tide)
    BELLS.forEach((bell, t) => addItem({
      bulk: true, parent: 'shopBells', icon: ICONS.bell(bell.color), unit: 'tide',
      show: () => t === 0 || S.sea.bells.some(b => b.bt === t) || S.sea.bought[t] > 0 || S.sea.run >= bell.base * 0.4,
      name: () => lvl(bell.name, S.sea.bells.filter(b => b.bt === t).length, '×'),
      cost: () => bellCost(t),
      blocked: () => S.sea.bells.length >= bellCap(),
      desc: () => S.sea.bells.length >= bellCap() ? 'No room for another bell. Fuse twins, or lay more buoy line.' :
        `Rings for ${fmt(bell.value * SK.tune[t] * SK.bell * SK.tm)} tide per ripple`,
      buy: () => buyBell(t),
    }));
    const sv = (parent, k, name, icon, base, g, show, desc, extra = {}) => lvItem({
      parent, icon, unit: 'tide', name, base, g, show, desc, gate: 'v_' + k,
      get: () => S.sea.lv[k], inc: () => { S.sea.lv[k]++; }, ...extra,
    });
    sv('shopSeaVoices', 'skips', 'Skipping Stones', ICONS.stone(), 25, 1.6, () => true, l => `Each throw skips ${skipsN(l)} → ${skipsN(l + 1)} times across the water`);
    sv('shopSeaVoices', 'rain', 'Rain', ICONS.drip('#a9dbe4'), 40, 1.42, () => S.sea.run >= 12, () => 'A drop lands somewhere every ~3s and makes a small ripple.', { pre: '×', onBuy: () => once('firstRain') });
    sv('shopSeaVoices', 'fish', 'Leaping Fish', ICONS.fish(), 700, 1.45, () => S.sea.run >= 250, () => 'Jumps every ~5s: a ripple where it leaves and another where it lands. They often cross.', { pre: '×', onBuy: () => once('firstFish') });
    sv('shopSeaVoices', 'light', 'Lighthouse', ICONS.lighthouse(), 5000, 2.6, () => S.sea.run >= 2500,
      l => l ? `Its beam starts a ripple every ${Math.max(0.4, 2.2 * Math.pow(0.8, l - 1)).toFixed(1)}s → ${Math.max(0.4, 2.2 * Math.pow(0.8, l)).toFixed(1)}s` : 'A sweeping beam that starts ripples wherever it falls.', { max: 8, onBuy: () => once('firstLight') });
    sv('shopSeaTuning', 'line', 'Buoy Line', ICONS.buoy(), 400, 2.4, () => S.sea.run >= 100 || S.sea.bells.length >= 6, () => `Room for ${bellCap()} → ${bellCap() + 1} bells`, { max: 12 });
    sv('shopSeaTuning', 'still', 'Stillness', ICONS.wave('#86d8e6'), 60, 2.1, () => S.sea.run >= 20, l => `Ripples fade ${pct(1 - seaDecayAt(l + 1) / seaDecayAt(l))} slower (lasting ~${Math.round(Math.log(25) / seaDecayAt(l))}s → ~${Math.round(Math.log(25) / seaDecayAt(l + 1))}s)`);
    sv('shopSeaTuning', 'bronze', 'Bronze Casting', ICONS.spark('#d0955a'), 250, 3, () => S.sea.run >= 120, l => `Bells ring ×${fmtX(Math.pow(1.4, l))} → ×${fmtX(Math.pow(1.4, l + 1))}`);
    sv('shopSeaTuning', 'interf', 'Crossing Waves', ICONS.cross(), 1800, 3.4, () => S.sea.run >= 900 && S.sea.bells.length >= 2, l => `When two ripples cross at a bell it rings ×${fmtX(crossAt(l))} → ×${fmtX(crossAt(l + 1))}`);

    // ------------------------------- sea: pearls
    addItem({
      parent: 'shopOysters', icon: ICONS.oyster(), unit: 'tide',
      name: () => lvl('Oyster', `${S.sea.oysters.length}/6`, ''),
      cost: () => S.sea.oysters.length >= 6 ? null : oysterCost(),
      desc: () => `Opens after ${fmt(SK.open)} ripples' worth of washing and gives up ${fmt(SK.pearl)} pearl dust.`,
      buy: () => buyOyster(),
    });
    const pIcon = { breakwater: ICONS.breakwater(), raft: ICONS.raft(), whirlpool: ICONS.whirl() };
    for (const k of Object.keys(PEARLOBJ)) {
      const po = PEARLOBJ[k];
      addItem({
        parent: 'shopPearlObjs', icon: pIcon[k], unit: 'pearl',
        name: () => lvl(po.name, `${S.sea.objs.filter(o => o.pk === k).length}/${po.max}`, ''),
        cost: () => S.sea.objs.filter(o => o.pk === k).length >= po.max ? null : pobjCost(k),
        desc: () => po.desc,
        buy: () => buyPobj(k),
      });
    }
    BELLS.forEach((bell, t) => lvItem({
      parent: 'shopBellTune', icon: ICONS.tune(bell.color, '#efe6d8'), unit: 'pearl', name: `Recast ${bell.name}s`,
      get: () => S.sea.tune[t], inc: () => { S.sea.tune[t]++; }, base: 4 * (t + 1), g: 2.1,
      show: () => t === 0 || S.sea.tune[t] > 0 || S.sea.bells.some(b => b.bt === t),
      desc: l => `Every ${bell.name.toLowerCase()} rings ×${fmtX(Math.pow(1.6, l))} → ×${fmtX(Math.pow(1.6, l + 1))}`,
    }));

    // ------------------------------- sea: the deep (fathoms)
    const dp = (k, name, icon, base, g, max, desc, extra = {}) => lvItem({
      parent: 'shopDeep', icon, unit: 'fathom', name, base, g, max, desc,
      get: () => S.sea.deep[k], inc: () => { S.sea.deep[k]++; }, ...extra,
    });
    dp('current', 'Deep Current', ICONS.layers('#9aa7ff'), 2, 1.9, 1e9, l => `All tide ×${fmtX(softPow(1.3, l))} → ×${fmtX(softPow(1.3, l + 1))}`);
    dp('rain', 'Old Rain', ICONS.drip('#9aa7ff'), 2, 1.7, 1e9, l => `Every sounding starts with ${2 * l} → ${2 * (l + 1)} extra rain`);
    dp('buoys', 'Long Moorings', ICONS.widen('#9aa7ff'), 5, 2.4, 6, l => `Room for 2 more bells (+${2 * l} → +${2 * (l + 1)})`);
    dp('beds', 'Pearl Beds', ICONS.oyster(), 4, 2, 12, l => `Oysters open after ${fmt(30 * Math.pow(0.8, l))} → ${fmt(30 * Math.pow(0.8, l + 1))} washing`);
    dp('record', 'Plumb Line', ICONS.down('#9aa7ff'), 6, 2.3, 1e9, l => `Fathoms from each sounding ×${fmt(Math.pow(PLUMB_STEP, l))} → ×${fmt(Math.pow(PLUMB_STEP, l + 1))}`);
    dp('light', 'Pale Lighthouse', ICONS.lighthouse(), 8, 1, 1, l => l ? 'Every sounding starts with a lighthouse already lit.' : 'Every sounding starts with a lighthouse already lit.', { single: true });

    addItem({ parent: 'shopShells', icon: ICONS.oyster(), unit: 'fathom',
      name: () => lvl('Shell Listening', S.shells.discovery), cost: () => shellDiscoveryCost(S),
      desc: () => S.shells.discovery >= 6 ? 'Discovery is at its 50% maximum.' : `Shell discovery ${pct(shellDiscoveryChance(S))} → ${pct(shellDiscoveryChance(S) + .05)}. Rarity odds and item strength stay fixed.`,
      buy: () => { const cost = shellDiscoveryCost(S); if (cost === null || !spend('fathom', cost)) return false; S.shells.discovery++; save(); return true; },
    });
    addItem({ parent: 'shopShells', icon: ICONS.oyster(), unit: 'fathom', name: () => 'Second Shell Slot',
      cost: () => S.shells.extraSlot ? null : SHELL_SLOT_COST,
      desc: () => S.shells.extraSlot ? 'Two permanent dedicated shell slots.' : 'Equip two shells at once. Their Heartstone discounts add; item strength stays fixed.',
      buy: () => { if (S.shells.extraSlot || !spend('fathom', SHELL_SLOT_COST)) return false; S.shells.extraSlot = 1; save(); return true; },
    });

    // ------------------------------- sea: the choir above (tide, never resets)
    lvItem({
      parent: 'shopChoir', icon: ICONS.choir(), unit: 'tide', name: 'Open the Ceiling', base: CEILING_BASE, g: CEILING_GROWTH, max: CEILING_MAX,
      get: () => S.sea.choir.open, inc: () => { S.sea.choir.open++; },
      desc: l => l >= CEILING_MAX ? (l > CEILING_MAX ? `Legacy level ${l}: your full bonus is kept. New purchases stop at level ${CEILING_MAX}.` : `The Ceiling is fully open at level ${CEILING_MAX}.`) : `The cave's song lifts tide by ${fmtX(0.1 * (1 + l))} → ${fmtX(0.1 * (2 + l))} per power of ten of its hum/s`,
    });
    lvItem({
      parent: 'shopChoir', icon: ICONS.stones(), unit: 'tide', name: 'Listening Stones', base: 2000, g: 3.2, max: 5,
      get: () => S.sea.choir.listen, inc: () => { S.sea.choir.listen++; },
      desc: l => `The world you're not in keeps earning ${pct(0.25 + 0.1 * l)} → ${pct(0.35 + 0.1 * l)} of its idle rate`,
    });

    // ------------------------------- horns (ivory, fossils/fathoms)
    addItem({
      auto: false, parent: 'shopHorns', icon: ICONS.horn('#ffcf86'), unit: () => S.world === 'sea' ? 'fathom' : 'fossil',
      name: () => 'Sound the Horn Call',
      cost: () => hornRollCost(),
      desc: () => S.hornAuto ? 'Find a new random horn right now.' : 'Adds a horn call to sound right now.',
      buy: () => {
        const u = S.world === 'sea' ? 'fathom' : 'fossil';
        if (!spend(u, hornRollCost())) return false;
        S.hornBuys++;
        if (S.hornAuto) { const h = gainHorn(0); whisper(hornMsg(h)); } else addHornCall();
        return true;
      },
    });
    const hu = (k, name, icon, base, g, max, desc, extra = {}) => lvItem({
      parent: 'shopHorns', icon, unit: 'ivory', name, base, g, max, desc,
      get: () => S.hornUp[k], inc: () => { S.hornUp[k]++; applyAutoEquip(S); hornsDirty = true; save(); }, ...extra,
    });
    // ------------------------------- the Sunvein (gilt), bought only while standing on one
    const gu = (k, name, icon, base, g, max, desc) => lvItem({
      parent: 'shopGold', icon, unit: 'gilt', name, base, g, max, desc: l => desc(l) + (onSun() ? '' : ' Buy only on a Sunvein.'),
      get: () => S.goldUp[k], inc: () => { S.goldUp[k]++; }, show: () => S.stats.sunveins > 0, blocked: () => !onSun(),
    });
    gu('vein', 'Rich Vein', ICONS.gem('#ffd54a'), 6, 1.8, 4, l => `Fossils from a Sunvein +${10 + 5 * l}% → +${10 + 5 * (l + 1)}%.`);
    gu('breath', 'Gilded Breath', ICONS.horn('#ffd54a'), 8, 1.7, 5, l => `Horns sounded on a Sunvein are gilded ${50 + 10 * l}% → ${50 + 10 * (l + 1)}% of the time.`);
    hu('rack', 'Horn Rack', ICONS.rack(), 15, 6, 2, l => `Wear ${1 + l} → ${2 + l} horns at once`);
    hu('ear', 'Keen Ear', ICONS.ear(), 5, 1.7, 12, l => `A horn turns up every ${mmss(360 * Math.pow(0.85, l))} → ${mmss(360 * Math.pow(0.85, l + 1))}`);
    hu('whet', 'Whetstone', ICONS.whet(), 8, 1.8, 15, l => `Horn bonuses +${Math.round(l * 8)}% → +${Math.round((l + 1) * 8)}% stronger, and rarer horns gain up to 3× as much`);
    hu('branch', 'Branching', ICONS.branch(), 10, 2.2, 5, l => `New horns have a ${l * 20}% → ${(l + 1) * 20}% chance of one extra stat`);
    hu('ivory', 'Ivory Echo', ICONS.horn('#efe6d8'), 25, 2, IVORY_LEVELS,
      l => l >= IVORY_LEVELS ? `Every new horn brings ${discoveryIvory(S)} ivory, plus its salvage value if you salvage it.`
        : `Every new horn brings ${5 + 5 * l} → ${10 + 5 * l} ivory, whether kept or salvaged. Applies to every horn source.`);
    const oddsText = l => rarityOdds(S, l).map((p, i) => `${RARITY[i].name} ${(p * 100).toFixed(1).replace(/\.0$/, '')}%`).join(', ');
    hu('rarity', 'Rarity Weaving', ICONS.horn(), 25, 1.65, RARITY_LEVELS,
      l => `Now: ${oddsText(l)}.${l < RARITY_LEVELS ? ` Next: ${oddsText(l + 1)}.` : ' The rarity curve is complete.'}`);
    hu('firstVoice', 'Awaken the First Voice', ICONS.horn('#83f5dc'), 2500, 1, 1,
      () => primordialUnlocked(S) ? 'Primordial horns are awakened: 2% of rolls and two dedicated slots.' : 'Awaken Primordial horns: 2% of rolls, Mythic-strength stats, a special trait and two dedicated slots.',
      { single: true, show: () => rarityRevealed(S), blocked: () => !rarityRevealed(S) });
    hu('firstRack', 'First Voice Rack', ICONS.rack(), 4000, 1, 1,
      l => l ? 'Wear three Primordial horns in their own slots.' : 'Add a third dedicated Primordial slot. Requires Awaken the First Voice.',
      { single: true, show: () => rarityRevealed(S), blocked: () => !primordialUnlocked(S) });
  }
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // =====================================================================
  // horns
  // =====================================================================
  let hornsDirty = true;
  const rollPlan = minR => rollHornPlan(S, minR);
  function buildHorn(plan, perfs, trait) {
    const h = createHorn(S, plan, perfs, trait), ri = h.r;
    grantDiscoveryIvory(S, h);
    noteColl(h);
    S.hornsOn = true;
    S.stats.hornsFound++; S.stats.bestHorn = Math.max(S.stats.bestHorn, ri);
    acquireHorn(S, h, HORN_CAP);
    delete S.seen.tab_horns;
    hornsDirty = true;
    refreshAll();
    return h;
  }
  function gainHorn(minR) { return buildHorn(rollPlan(minR), null); }
  // A call that waits for you to sound it (or sounds itself, when Sound horns automatically is on).
  const HORN_QUEUE_CAP = 3;
  const hornsWaiting = () => S.hornQueue + (S.hornPlan ? 1 : 0);
  function addHornCall() {
    if (S.hornAuto) { const h = gainHorn(0); whisper('A horn turns up. ' + hornMsg(h)); return; }
    S.hornQueue++; delete S.seen.tab_horns; hornsDirty = true;
    whisper('A horn call is ready. Sound it from the Horn chip or the Sounding page.');
  }
  function hornMsg(h) {
    const rn = RARITY[h.r].name.toLowerCase();
    const base = `${/^[aeiou]/.test(rn) ? 'An' : 'A'} ${rn} horn: the ${h.name}. +${h.ivoryFound} discovery ivory.`;
    if (h.salvaged) return `${base} ${h.salvageReason === 'filter' ? 'Your salvage filter' : 'Your full inventory'} turned it into ${RARITY[h.r].ivory} salvage ivory.`;
    if (h.replacedHorn) return `${base} You’re wearing it. ${h.replacedHorn.name} was salvaged for ${h.replacedHorn.ivory} ivory to make room.`;
    return equippedIds(S).includes(h.id) ? `${base} You're wearing it.` : `${base} Equip it in the Horns tab.`;
  }
  function lineText(h, l) {
    const st = HSTATS[l.stat], v = lineVal(h, l);
    if (l.kind === 'mult') return `${st.label} <b>×${fmtX(v)}</b>`;
    if (l.kind === 'pct') return `${st.label} <b>+${Math.round(v)}%</b>`;
    if (st.kind === 'flat') return `${st.label} <b>+${Math.round(v)}</b>`;
    if (st.kind === 'flatpct') return `${st.label} <b>+${Math.round(v)}%</b>`;
    return `${st.label} <b>−${Math.round(v)}%</b>`;
  }
  function traitMarkup(h) {
    if (h.r !== PRIMORDIAL || !h.trait) return '';
    const t = TRAITS.find(t => t.id === h.trait.id);
    return `<li class="horntrait"><b>${t.name}</b>: ${(traitValue(h) * 100).toFixed(1).replace(/\.0$/, '')}% ${t.effect}. Strongest worn copy applies.</li>`;
  }
  // ---------------------------------------------------------------------
  // horn art: every horn is drawn from its seed, rarity and stats
  // ---------------------------------------------------------------------
  const HMAT = [ // light, mid, dark
    ['#efe8d6', '#c4bba4', '#7d7766'], ['#d4e6ff', '#7fb8ff', '#35588f'], ['#e6d6ff', '#b58cff', '#5a3a96'],
    ['#fff1c8', '#ffcf86', '#a2702a'], ['#ffd9e0', '#ff8fa3', '#9c3856'], ['#dcfff4', '#83f5dc', '#247c70'],
  ];
  const STAT_COL = {
    hum: '#ffcf86', lumen: '#7fb8ff', shards: '#d6a8ff', fossils: '#e8d5b0', crystal: '#8ff2e6', wall: '#a79fb8', tide: '#86d8e6', pearls: '#efe6d8',
    fathoms: '#9aa7ff', bell: '#d9a066', interf: '#6fe0c8', lungs: '#a8e6a3', skips: '#8fd0ff', offline: '#b58cff', cost: '#ffb86b',
  };

  const bez = (p0, p1, p2, p3) => t => {
    const u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  };
  // The centreline and thickness of each family, in a 100 x 100 box. Seeded nudges keep two horns of a family from matching.
  function hornShape(fam, rn) {
    const j = (v, a = 5) => v + (rn() - 0.5) * 2 * a;
    switch (fam) {
      case 'sweep': return { P: bez([14, 84], [j(8), j(30)], [j(40), j(6)], [j(90, 4), j(24)]), w0: 13, tip: 1.2, tp: 1.4 };
      case 'crescent': return { P: bez([12, 66], [j(26), j(100)], [j(76), j(98)], [j(90, 4), j(28)]), w0: 14, tip: 1.2, tp: 1.2 };
      case 'spear': return { P: bez([16, 86], [j(34), j(62)], [j(58), j(36)], [j(86, 4), j(12, 4)]), w0: 11, tip: 0.8, tp: 1.1 };
      case 'tusk': return { P: bez([18, 84], [j(40), j(58)], [j(60), j(40)], [j(86, 3), j(14, 3)]), w0: 7, tip: 1.6, tp: 0.7, twist: true };
      case 'twist': return { P: bez([16, 86], [j(2), j(52)], [j(62), j(56)], [j(82), j(12)]), w0: 12, tip: 1, tp: 1.2, twist: true };
      case 'conch': return { P: bez([22, 80], [j(34), j(62)], [j(52), j(44)], [j(78), j(26)]), w0: 24, tip: 2, tp: 1.9, flare: true };
      case 'curl': {
        const cx = 54, cy = 50, R = j(36, 3), turns = 1.2 + rn() * 0.15;
        return { P: t => { const a = Math.PI + t * turns * 2 * Math.PI, r = R * (1 - 0.72 * t); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }, w0: 13, tip: 1.2, tp: 1.1 };
      }
      default: { // tines
        const main = bez([16, 86], [j(10), j(40)], [j(30), j(10)], [j(66), j(14)]);
        const tines = [0.4, 0.58, 0.76].map(t0 => { const m = main(t0), o = 4 + rn() * 4; return bez(m, [m[0] + 2, m[1] - 10], [m[0] + o, m[1] - 18], [m[0] + o + 3, m[1] - 24 - rn() * 8]); });
        return { P: main, w0: 11, tip: 1.2, tp: 1.3, tines };
      }
    }
  }
  function tube(P, w0, tip, tp, n = 44) {
    const L = [], Rt = [], C = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, [x, y] = P(t), [x2, y2] = P(Math.min(1, t + 0.012)), [x1, y1] = P(Math.max(0, t - 0.012));
      const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, w = (tip + (w0 - tip) * Math.pow(1 - t, tp)) / 2;
      L.push([x + nx * w, y + ny * w]); Rt.push([x - nx * w, y - ny * w]); C.push([x, y, nx, ny, w, dx / d, dy / d]);
    }
    return { L, R: Rt, C };
  }
  const pts = a => a.map(q => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
  const hornCache = new Map();
  // ctx keeps gradient ids unique when one horn is drawn in several places (slot, grid, detail).
  function hornSVG(h, size, ctx) {
    const key = `${ctx}|${h.id}|${h.seed}|${h.r}|${h.gold ? 1 : 0}|${size}|${h.lines.map(l => l.stat).join()}`;
    const hit = hornCache.get(key); if (hit) return hit;
    if (hornCache.size > 600) hornCache.clear();
    const id = `hg${ctx}${String(h.id).replace(/\W/g, '')}`, rn = rng32(hash32((h.seed || h.id || 1) + 17)), fam = famOf(h), sh = hornShape(fam, rn);
    const mat = h.gold ? ['#fff6c8', '#ffd54a', '#a8780a'] : HMAT[h.r], flip = rn() < 0.5, glow = h.r >= 3 || h.gold;
    const m = tube(sh.P, sh.w0 * 1.3 * (0.9 + rn() * 0.22), sh.tip * 1.3, sh.tp), body = tp => `${pts(tp.L)} ${pts(tp.R.slice().reverse())}`;
    let g = '';
    const tubes = [m];
    for (const T of sh.tines || []) tubes.push(tube(T, 5, 1, 1.2, 20));
    for (const T of tubes) g += `<polygon points="${body(T)}" fill="url(#${id}g)" stroke="${mat[2]}" stroke-width=".8" stroke-linejoin="round"/>`;
    // light along one edge, shade along the other
    for (const T of tubes) {
      g += `<polyline points="${pts(T.C.map(c => [c[0] + c[2] * c[4] * 0.45, c[1] + c[3] * c[4] * 0.45]))}" fill="none" stroke="#fff" stroke-opacity=".38" stroke-width="1.1" stroke-linecap="round"/>`;
      g += `<polyline points="${pts(T.C.map(c => [c[0] - c[2] * c[4] * 0.5, c[1] - c[3] * c[4] * 0.5]))}" fill="none" stroke="${mat[2]}" stroke-opacity=".45" stroke-width="1.3" stroke-linecap="round"/>`;
    }
    // growth rings, slanted on twisted horns; more rings on better horns
    const nr = 3 + h.lines.length * 2 + h.r;
    for (let k = 1; k <= nr; k++) {
      const i = Math.round((k / (nr + 1)) * 0.92 * (m.C.length - 1)), c = m.C[i], sl = sh.twist ? c[4] * 0.9 : 0;
      g += `<line x1="${(m.L[i][0]).toFixed(1)}" y1="${(m.L[i][1]).toFixed(1)}" x2="${(m.R[i][0] + c[5] * sl).toFixed(1)}" y2="${(m.R[i][1] + c[6] * sl).toFixed(1)}" stroke="${mat[2]}" stroke-opacity="${sh.twist ? .55 : .4}" stroke-width=".8"/>`;
    }
    // mouthpiece band, in the rarity colour from Epic up
    const bandN = Math.max(3, Math.round(m.C.length * 0.09));
    g += `<polygon points="${pts(m.L.slice(0, bandN + 1))} ${pts(m.R.slice(0, bandN + 1).reverse())}" fill="${h.r >= 2 || h.gold ? RARITY[h.r].col : mat[1]}" fill-opacity="${h.r >= 2 || h.gold ? .85 : .5}" stroke="${mat[2]}" stroke-width=".7"/>`;
    g += `<ellipse cx="${m.C[0][0].toFixed(1)}" cy="${m.C[0][1].toFixed(1)}" rx="${(m.C[0][4] * 0.9).toFixed(1)}" ry="${(m.C[0][4] * 0.34).toFixed(1)}" transform="rotate(${(Math.atan2(m.C[0][3], m.C[0][2]) * 180 / Math.PI).toFixed(0)} ${m.C[0][0].toFixed(1)} ${m.C[0][1].toFixed(1)})" fill="${mat[2]}" fill-opacity=".55"/>`;
    // one gem per stat
    h.lines.forEach((l, i) => {
      const c = m.C[Math.min(m.C.length - 1, Math.round((0.2 + 0.17 * i + rn() * 0.04) * (m.C.length - 1)))], r = Math.max(1.3, c[4] * 0.34), col = STAT_COL[l.stat] || '#fff';
      g += `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r.toFixed(1)}" fill="${col}" stroke="#fff" stroke-opacity=".7" stroke-width=".5"/><circle cx="${(c[0] - r * .3).toFixed(1)}" cy="${(c[1] - r * .3).toFixed(1)}" r="${(r * .3).toFixed(1)}" fill="#fff" fill-opacity=".75"/>`;
    });
    if (h.r >= 4 || h.gold) for (let k = 0; k < 3; k++) {
      const c = m.C[Math.round((0.55 + k * 0.17) * (m.C.length - 1))], x = c[0] + c[2] * (6 + rn() * 4) * (k % 2 ? 1 : -1), y = c[1] + c[3] * (6 + rn() * 4) * (k % 2 ? 1 : -1), q = 1.4 + rn();
      g += `<path d="M${x.toFixed(1)} ${(y - q * 1.6).toFixed(1)}L${(x + q * .5).toFixed(1)} ${(y - q * .5).toFixed(1)}L${(x + q * 1.6).toFixed(1)} ${y.toFixed(1)}L${(x + q * .5).toFixed(1)} ${(y + q * .5).toFixed(1)}L${x.toFixed(1)} ${(y + q * 1.6).toFixed(1)}L${(x - q * .5).toFixed(1)} ${(y + q * .5).toFixed(1)}L${(x - q * 1.6).toFixed(1)} ${y.toFixed(1)}L${(x - q * .5).toFixed(1)} ${(y - q * .5).toFixed(1)}Z" fill="#fff" fill-opacity=".9"/>`;
    }
    const svg = `<svg class="hsvg" viewBox="-6 -6 112 112" width="${size}" height="${size}" aria-hidden="true"><defs>` +
      `<linearGradient id="${id}g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${mat[2]}"/><stop offset=".45" stop-color="${mat[1]}"/><stop offset="1" stop-color="${mat[0]}"/></linearGradient>` +
      (glow ? `<filter id="${id}f" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '') +
      `</defs><g${flip ? ' transform="translate(100 0) scale(-1 1)"' : ''}${glow ? ` filter="url(#${id}f)"` : ''}>${g}</g></svg>`;
    hornCache.set(key, svg);
    return svg;
  }
  // The collection: one entry for every shape and rarity.
  const noteColl = h => recordCollection(S, h);
  const collHorn = (fam, r) => {
    const c = S.coll[fam + ':' + r], animal = Object.keys(FAM_OF).find(a => FAM_OF[a] === fam), g = r === 'g';
    return { id: 'c' + fam + r, r: g ? (c ? c.r : 3) : r, gold: g, seed: c ? c.seed : hash32(FAMS.indexOf(fam) * 31 + (g ? 9 : r)), name: c ? c.name : `x ${animal} Horn`, lines: (c ? c.ls : []).map(stat => ({ stat })) };
  };

  // ---------------------------------------------------------------------
  // the Horns tab
  // ---------------------------------------------------------------------
  let hornSub = 'inventory', hornSel = 0, hornFilterR = -1;
  const HSUBS = ['upgrades', 'inventory', 'sounding', 'collection'];
  function setHornSub(sub) {
    hornSub = HSUBS.includes(sub) ? sub : 'inventory';
    hornsDirty = true; updateUI();
  }
  $('hornTabs').addEventListener('click', e => { const b = e.target.closest('button[data-sub]'); if (b) setHornSub(b.dataset.sub); });
  const rcOf = h => h.gold ? '#ffd54a' : RARITY[h.r].col;
  function renderHorns() {
    hornsDirty = false;
    for (const b of $('hornTabs').children) b.setAttribute('aria-selected', String(b.dataset.sub === hornSub));
    for (const sec of document.querySelectorAll('#panel-horns .hsec')) sec.hidden = sec.dataset.sub !== hornSub;
    if (hornSub === 'inventory') renderInventory();
    else if (hornSub === 'sounding') renderSounding();
    else if (hornSub === 'collection') renderColl();
  }
  function renderInventory() {
    const settings = S.hornInventory;
    $('hornAutoEquip').checked = settings.autoEquip;
    $('hornEquipFocus').value = settings.focus;
    $('hornSalvageGilded').checked = settings.gilded;
    const rarities = visibleRarities(S), filters = $('hornSalvageRarities');
    if (filters.children.length !== rarities.length) filters.innerHTML = rarities.map((r, i) =>
      `<label><input type="checkbox" data-salvage-r="${i}"> ${r.name}</label>`).join('');
    for (const input of filters.querySelectorAll('input')) input.checked = settings.salvage[+input.dataset.salvageR];
    const eq = new Set(equippedIds(S)), slots = hornSlots();
    if (!S.horns.some(h => h.id === hornSel)) hornSel = (S.equipped[0] || (S.horns[0] && S.horns[0].id)) || 0;
    let row = '';
    for (let i = 0; i < slots; i++) {
      const h = S.horns.find(x => x.id === S.equipped[i]);
      row += h ? `<button type="button" class="hslot${h.id === hornSel ? ' sel' : ''}" data-id="${h.id}" style="--rc:${rcOf(h)}" title="${h.name}">${hornSVG(h, 58, 's')}<small>${h.gold ? 'Gilded' : RARITY[h.r].name}</small></button>`
        : `<div class="hslot empty"><span>Empty</span></div>`;
    }
    $('hornSlotRow').innerHTML = row;
    $('primordialRack').hidden = !rarityRevealed(S);
    setT('primordialSlots', primordialUnlocked(S) ? `${S.primordialEquipped.length} / ${primordialSlots(S)}` : 'Not awakened');
    let primordialRow = '';
    for (let i = 0; i < primordialSlots(S); i++) {
      const h = S.horns.find(x => x.id === S.primordialEquipped[i]);
      primordialRow += h ? `<button type="button" class="hslot${h.id === hornSel ? ' sel' : ''}" data-id="${h.id}" style="--rc:${rcOf(h)}" title="${h.name}">${hornSVG(h, 58, 'p')}<small>Primordial</small></button>`
        : '<div class="hslot empty"><span>Empty</span></div>';
    }
    $('primordialSlotRow').innerHTML = primordialRow;
    // detail of the selected horn
    const sel = S.horns.find(h => h.id === hornSel), det = $('hornDetail');
    det.hidden = !sel;
    if (sel) {
      const on = eq.has(sel.id);
      det.style.setProperty('--rc', rcOf(sel));
      det.innerHTML = `<div class="art">${hornSVG(sel, 124, 'd')}</div>
        <div><div class="hn">${sel.name}</div><div class="hr">${sel.gold ? 'Gilded · ' : ''}${RARITY[sel.r].name}${on ? ' · worn' : ''}</div></div>
        <ul>${sel.lines.map(l => `<li style="--gc:${STAT_COL[l.stat] || '#fff'}"><i></i>${lineText(sel, l)}</li>`).join('')}${traitMarkup(sel)}</ul>
        <div class="hb"><button type="button" data-act="eq" data-id="${sel.id}" ${settings.autoEquip ? 'disabled title="Turn off auto-equip to change worn horns manually"' : ''}>${on ? 'Take off' : 'Wear'}</button><button type="button" class="sal" data-act="sal" data-id="${sel.id}">Salvage for ${RARITY[sel.r].ivory} ivory${sel.gold ? ' (lowers the Sunvein chance)' : ''}</button></div>`;
    }
    // rarity filter
    const names = ['All', ...visibleRarities(S).map(r => r.name)];
    $('hornFilter').innerHTML = names.map((n, i) => `<button type="button" data-r="${i - 1}" aria-pressed="${hornFilterR === i - 1}"${i ? ` style="--rc:${RARITY[i - 1].col}"` : ''}>${n}</button>`).join('');
    const list = [...S.horns].filter(h => hornFilterR < 0 || h.r === hornFilterR)
      .sort((a, b) => (eq.has(b.id) - eq.has(a.id)) || (b.r - a.r) || (b.id - a.id));
    $('hornGrid').innerHTML = list.map(h => `<button type="button" class="hcard${eq.has(h.id) ? ' worn' : ''}${h.id === hornSel ? ' sel' : ''}" data-id="${h.id}" style="--rc:${rcOf(h)}" title="${h.name}">${hornSVG(h, 50, 'g')}<small>${h.gold ? 'Gilded' : RARITY[h.r].name}</small></button>`).join('')
      || `<p class="note">${S.horns.length ? 'No horns of that rarity.' : 'No horns yet.'}</p>`;
    // summary of worn bonuses
    const parts = [];
    for (const k of Object.keys(HSTATS)) {
      const st = HSTATS[k];
      if (st.kind === 'scale' && Math.abs(HB[k] - 1) > 1e-6) parts.push(`<span>${st.label}</span><b>×${fmtX(HB[k])}</b>`);
    }
    if (HB.lungs) parts.push(`<span>Echoes per shout</span><b>+${HB.lungs}</b>`);
    if (HB.skips) parts.push(`<span>Stone skips</span><b>+${HB.skips}</b>`);
    if (HB.offline) parts.push(`<span>Away earnings</span><b>+${Math.round(HB.offline * 100)}%</b>`);
    if (HB.cost) parts.push(`<span>Prices</span><b>−${Math.round(HB.cost * 100)}%</b>`);
    for (const t of TRAITS) if (HB.traits[t.id]) parts.push(`<span>${t.name}</span><b>${(HB.traits[t.id] * 100).toFixed(1).replace(/\.0$/, '')}%</b>`);
    $('hornSum').innerHTML = parts.length ? parts.map(p => `<div>${p}</div>`).join('') : '<div class="empty">Wear a horn to feel its bonus here.</div>';
  }
  // ---------------------------------------------------------------------
  // the Sounding page: spin the rarity, then play a note for each stat
  // ---------------------------------------------------------------------
  let sndKey = '', sndRaf = 0, sndReel = 0, sndRound = null, sndResult = null;
  const tri = x => 1 - Math.abs(2 * (x - Math.floor(x)) - 1);
  const sndMode = () => {
    if (sndResult) return 'result';
    if (sndReel) return 'reel';
    const pl = S.hornPlan;
    if (!pl) return 'idle';
    if (sndRound && sndRound.frozen !== null) return 'play';
    if (pl.perfs.length < pl.lines.length) return 'play';
    return pl.ri === PRIMORDIAL && traitQuality(pl.perfs) >= TRAIT_CHOICE_AT ? 'choice' : 'complete';
  };
  const perfWord = p => p >= 0.9 ? 'Perfect' : p >= 0.6 ? 'Good' : p >= 0.3 ? 'Okay' : 'Off the note';
  const perfCol = p => p >= 0.9 ? 'var(--echo)' : p >= 0.6 ? 'var(--hum)' : p >= 0.3 ? 'var(--muted)' : 'var(--warn)';
  function openSounding() {
    closePops(); hornSub = 'sounding'; setTab('horns'); hornsDirty = true; updateUI();
  }
  function startSounding() {
    if (S.hornPlan || sndReel || sndResult || S.hornQueue < 1) return;
    S.hornQueue--; S.hornPlan = rollPlan(0); save();
    const plan = S.hornPlan; let i = 0;
    sndKey = ''; sndReel = setInterval(() => { i++; const e = $('sndReelTxt'); if (e) { const shown = visibleRarities(S), r = shown[i % shown.length]; e.textContent = r.name; e.parentNode.style.setProperty('--rc', r.col); } }, 85);
    hornsDirty = true; updateUI();
    setTimeout(() => {
      clearInterval(sndReel);
      const e = $('sndReelTxt'); if (e) { e.textContent = (plan.gold ? 'Gilded ' : '') + RARITY[plan.ri].name; e.parentNode.style.setProperty('--rc', plan.gold ? '#ffd54a' : RARITY[plan.ri].col); }
      setTimeout(() => { sndReel = 0; sndKey = ''; hornsDirty = true; updateUI(); }, 900);
    }, 1400);
  }
  function newRound() {
    const pl = S.hornPlan, k = pl.perfs.length;
    sndRound = { k, ...soundingDifficulty(pl, S.hornUp.ear), c: 0.2 + Math.random() * 0.6,
      phase: Math.random(), t0: performance.now(), frozen: null };
  }
  function sndHit() {
    if (sndMode() !== 'play' || !sndRound || sndRound.frozen !== null) return;
    if (performance.now() - sndRound.t0 < sndRound.readyMs) return;
    const r = sndRound, pos = tri(r.phase + (performance.now() - r.t0) / 1000 * r.speed), d = Math.abs(pos - r.c);
    const p = d <= r.hw * 0.25 ? 1 : Math.max(0, 1 - (d - r.hw * 0.25) / (r.hw * 1.8));
    r.frozen = pos;
    const plan = S.hornPlan;
    plan.perfs.push(+p.toFixed(3)); save();
    const fb = $('sndFb'); if (fb) { fb.textContent = perfWord(p); fb.style.color = perfCol(p); }
    const dots = $('sndDots'); if (dots) dots.children[r.k].style.background = perfCol(p);
    setTimeout(() => {
      if (S.hornPlan !== plan) return;
      sndRound = null;
      if (S.hornPlan.perfs.length >= S.hornPlan.lines.length) finishSounding();
      else { sndRound = null; sndKey = ''; hornsDirty = true; updateUI(); }
    }, 750);
  }
  function finishSounding(chosenTrait) {
    const pl = S.hornPlan; if (!pl) return;
    while (pl.perfs.length < pl.lines.length) pl.perfs.push(AUTO_P);
    const avg = traitQuality(pl.perfs);
    if (pl.ri === PRIMORDIAL && avg >= TRAIT_CHOICE_AT && !chosenTrait) {
      sndRound = null; save(); sndKey = ''; hornsDirty = true; updateUI(); return;
    }
    const h = buildHorn(pl, pl.perfs, chosenTrait);
    S.hornPlan = null; sndRound = null;
    let extra = null;
    if (Math.random() < Math.max(0, avg - AUTO_P) * 0.5) extra = gainHorn(0);
    sndResult = { h, extra, avg };
    whisper(hornMsg(h) + (extra ? ' And a second horn came with it.' : ''));
    save(); sndKey = ''; hornsDirty = true; updateUI();
  }
  function sndLoop() {
    sndRaf = 0;
    const needle = $('sndNeedle');
    if (!needle || sndMode() !== 'play' || !sndRound || $('panel-horns').hidden || hornSub !== 'sounding') return;
    const r = sndRound;
    if (r.readyMs) setT('sndLead', performance.now() - r.t0 < r.readyMs ? `The first voice gathers… ${Math.ceil((r.readyMs - (performance.now() - r.t0)) / 1000)}s` : 'Ready. Hit the glowing zone.');
    if (r.frozen === null) needle.style.left = (tri(r.phase + (performance.now() - r.t0) / 1000 * r.speed) * 100).toFixed(1) + '%';
    else needle.style.left = (r.frozen * 100).toFixed(1) + '%';
    sndRaf = requestAnimationFrame(sndLoop);
  }
  function sndRender() {
    const mode = sndMode(), st = $('sndStage');
    if (mode === 'complete') { finishSounding(); return; }
    const key = mode + (mode === 'play' ? ':' + (sndRound && sndRound.frozen !== null ? sndRound.k : S.hornPlan.perfs.length) : mode === 'idle' ? ':' + S.hornQueue : mode === 'result' ? ':' + sndResult.h.id : '');
    if (key !== sndKey) {
      sndKey = key;
      if (mode === 'idle') {
        st.style.setProperty('--rc', 'var(--line-2)');
        st.innerHTML = S.hornQueue > 0
          ? `<button type="button" class="big" data-act="start">Sound the horn</button><div class="sub"><b>${S.hornQueue}</b> call${S.hornQueue > 1 ? 's' : ''} waiting. The rarity is spun first, then you play a note for each stat.</div>`
          : `<div class="sub">No horn call is waiting.<br>The next one comes in <b id="sndNext"></b>.</div>`;
      } else if (mode === 'reel') {
        st.innerHTML = `<div class="sub">Spinning the horn…</div><div class="reel"><span id="sndReelTxt">…</span></div>`;
      } else if (mode === 'choice') {
        const quality = traitQuality(S.hornPlan.perfs);
        st.style.setProperty('--rc', RARITY[PRIMORDIAL].col);
        st.innerHTML = `<div class="head"><b>Choose the first voice</b><span>${Math.round(quality * 100)}% played</span></div>
          <div class="sub">Your performance earned a choice. Each trait has ${Math.round((0.5 + quality) * 100)}% of its base strength.</div>
          <div class="traitchoices">${TRAITS.map(t => `<button type="button" class="big" data-act="trait" data-trait="${t.id}">${t.name}<small>${(t.base * (0.5 + quality)).toFixed(1).replace(/\.0$/, '')}% ${t.effect}</small></button>`).join('')}</div>
          <button type="button" class="small" data-act="random-trait">Choose a random trait</button>`;
      } else if (mode === 'play') {
        const pl = S.hornPlan, R = RARITY[pl.ri];
        if (!sndRound || (sndRound.frozen === null && sndRound.k !== pl.perfs.length)) newRound();
        const l = pl.lines[sndRound.k], r = sndRound;
        st.style.setProperty('--rc', pl.gold ? '#ffd54a' : R.col); st.style.setProperty('--gc', STAT_COL[l.stat] || 'var(--echo)');
        st.innerHTML = `<div class="head"><span style="color:${pl.gold ? '#ffd54a' : R.col}">${pl.gold ? 'Gilded ' : ''}${R.name} horn</span><span>Note ${r.k + 1} of ${pl.lines.length}: <b>${HSTATS[l.stat].label}</b></span></div>
          <div class="sbar" id="sndBar" data-act="hit" role="button" tabindex="0" aria-label="Hit the note"><div class="szone" style="left:${((r.c - r.hw) * 100).toFixed(1)}%;width:${(r.hw * 200).toFixed(1)}%"></div><div class="sneedle" id="sndNeedle"></div></div>
          <div class="sfb" id="sndFb"></div>${pl.ri === PRIMORDIAL ? '<div class="sub" id="sndLead" aria-live="polite"></div>' : ''}
          <div class="sdots" id="sndDots">${pl.lines.map((_, i) => `<i${i === r.k ? ' class="cur"' : ''} style="${i < r.k ? `background:${perfCol(pl.perfs[i])}` : ''}"></i>`).join('')}</div>
          <div class="sub">Click, tap or press Space when the needle is in the glowing zone.${pl.ri === PRIMORDIAL ? ' Each note gathers for 6–8 seconds. Trait strength follows your overall performance; 90% earns trait choice. There is no miss timer.' : ''}</div>
          <button type="button" class="small" data-act="auto">Finish with an average result</button>`;
      } else {
        const { h, extra, avg } = sndResult, hs = [h, extra].filter(Boolean);
        st.style.setProperty('--rc', rcOf(h));
        st.innerHTML = hs.map(x => `<div class="sndres" style="--rc:${rcOf(x)}"><div>${hornSVG(x, 104, 'r' + x.id)}</div><div><div class="hn">${x.name}</div><div class="hr">${x.gold ? 'Gilded · ' : ''}${RARITY[x.r].name}${x.salvaged ? ' · salvaged for ivory' : ''}${x.q != null ? ` · ${Math.round(x.q * 100)}% played` : ''}</div><ul>${x.lines.map(l => `<li>${lineText(x, l)}</li>`).join('')}${traitMarkup(x)}</ul></div></div>`).join('')
          + `<div class="sub">${h.salvaged ? (h.salvageReason === 'filter' ? 'Your filter salvaged this horn for ivory. ' : 'Inventory full: this horn was salvaged for ivory. ') : ''}${extra ? 'Good playing brought a second horn. ' : ''}${avg > AUTO_P ? 'Above average.' : avg < AUTO_P ? 'Below average.' : 'Average.'}</div><button type="button" class="big" data-act="done">Continue</button>`;
      }
    }
    if (mode === 'idle' && S.hornQueue < 1) setT('sndNext', S.hornsOn ? mmss(Math.max(0, S.hornTimer) / tickRate()) : 'a while');
    if (mode === 'play' && !sndRaf) sndRaf = requestAnimationFrame(sndLoop);
  }
  $('sndStage').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'start') startSounding();
    else if (act === 'auto') finishSounding();
    else if (act === 'trait' && sndMode() === 'choice') finishSounding(b.dataset.trait);
    else if (act === 'random-trait' && sndMode() === 'choice') finishSounding('random');
    else if (act === 'done') { hornSel = sndResult ? sndResult.h.id : hornSel; sndResult = null; sndKey = ''; hornsDirty = true; updateUI(); }
  });
  $('sndStage').addEventListener('pointerdown', e => { if (e.target.closest('[data-act="hit"]')) { e.preventDefault(); sndHit(); } });
  document.addEventListener('keydown', e => {
    if ((e.key !== ' ' && e.key !== 'Enter') || e.repeat || sndMode() !== 'play' || $('panel-horns').hidden || hornSub !== 'sounding') return;
    if (setOpen || newsOpen || chronOpen || awayOpen || creditsOpen || cinematic) return;
    const t = e.target; if (t && t !== document.body && t.id !== 'sndBar') return;
    e.preventDefault(); sndHit();
  });
  $('hornAuto').addEventListener('change', e => {
    S.hornAuto = e.target.checked;
    if (S.hornAuto) while (S.hornQueue > 0) { S.hornQueue--; const h = gainHorn(0); whisper('A horn turns up. ' + hornMsg(h)); }
    save(); hornsDirty = true; updateUI();
  });
  function renderSounding() {
    $('hornAuto').checked = !!S.hornAuto;
    setT('sndQueue', hornsWaiting() ? `${hornsWaiting()} waiting` : '');
    sndRender();
    const odds = rarityOdds(S);
    $('hornOdds').innerHTML = visibleRarities(S).map((r, i) => `<span style="color:${r.col}">${r.name}</span><div class="bar" style="--rc:${r.col}"><i style="width:${((odds[i] || 0) * 100).toFixed(1)}%"></i></div><b>${((odds[i] || 0) * 100).toFixed(1).replace(/\.0$/, '')}%</b>`).join('');
    const left = PITY_AT - (S.hornPity || 0);
    $('hornPity').textContent = left > 0 ? `${left} more horn${left > 1 ? 's' : ''} below Epic and the next one is Epic or better, guaranteed.` : 'The next horn is Epic or better, guaranteed.';
  }
  function renderColl() {
    const cols = [...visibleRarities(S).map((_, i) => i), 'g'], colName = r => r === 'g' ? 'Gold' : RARITY[r].name, colCol = r => r === 'g' ? '#ffd54a' : RARITY[r].col;
    let n = 0, html = '<span></span>' + cols.map(r => `<span class="hd" style="--rc:${colCol(r)}" title="${colName(r)}">${colName(r).slice(0, 4)}</span>`).join('');
    for (const f of FAMS) {
      html += `<span class="fam">${f}</span>`;
      for (const r of cols) {
        const c = S.coll[f + ':' + r];
        if (c) n++;
        html += `<div class="hcell${c ? '' : ' locked'}" style="--rc:${colCol(r)}" title="${c ? c.name : 'Not found yet'}">${hornSVG(collHorn(f, r), 40, 'c' + f + r)}${c ? `<em>×${c.n}</em>` : ''}</div>`;
      }
    }
    $('hornColl').style.setProperty('--rarity-columns', cols.length);
    $('hornColl').innerHTML = html;
    setT('collCount', `${n} / ${FAMS.length * cols.length}`);
  }
  const salvageArmed = {};
  $('panel-horns').addEventListener('click', e => {
    const f = e.target.closest('#hornFilter button[data-r]');
    if (f) { hornFilterR = +f.dataset.r; hornsDirty = true; updateUI(); return; }
    const card = e.target.closest('.hcard, .hslot[data-id]');
    if (card) { hornSel = +card.dataset.id; hornsDirty = true; updateUI(); return; }
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = +btn.dataset.id, h = S.horns.find(x => x.id === id);
    if (!h) return;
    if (btn.dataset.act === 'eq') {
      if (S.hornInventory.autoEquip) return;
      const eq = h.r === PRIMORDIAL ? S.primordialEquipped : S.equipped;
      const slots = h.r === PRIMORDIAL ? primordialSlots(S) : hornSlots();
      const i = eq.indexOf(id);
      if (i >= 0) eq.splice(i, 1);
      else if (eq.length >= slots) { whisper(`You can only wear ${slots} ${h.r === PRIMORDIAL ? 'Primordial ' : ''}horn${slots === 1 ? '' : 's'} here. Take one off first, or upgrade this rack.`); return; }
      else eq.push(id);
    } else {
      if (!salvageArmed[id] || Date.now() - salvageArmed[id] > 3000) { salvageArmed[id] = Date.now(); btn.textContent = 'Click again to salvage'; return; }
      S.horns.splice(S.horns.indexOf(h), 1);
      for (const eq of [S.equipped, S.primordialEquipped]) { const i = eq.indexOf(id); if (i >= 0) eq.splice(i, 1); }
      S.ivory += RARITY[h.r].ivory; S.stats.ivoryLife += RARITY[h.r].ivory;
    }
    applyAutoEquip(S); refreshAll(); save(); hornsDirty = true; updateUI();
  });
  $('hornInventoryRules').addEventListener('change', e => {
    const input = e.target, settings = S.hornInventory;
    if (input.id === 'hornAutoEquip') settings.autoEquip = input.checked;
    else if (input.id === 'hornEquipFocus') settings.focus = input.value;
    else if (input.id === 'hornSalvageGilded') settings.gilded = input.checked;
    else if (input.dataset.salvageR != null) settings.salvage[+input.dataset.salvageR] = input.checked;
    else return;
    applyAutoEquip(S); refreshAll(); save(); updateUI();
  });

  function renderCaveAutomation() {
    const settings = S.caveAutomation;
    $('caveAutomationSec').hidden = S.hearts < 2 && !settings.unlocked;
    $('caveAutoControls').hidden = !settings.unlocked;
    if (!settings.unlocked || S.tab !== 'strata') return;
    for (const input of $('caveAutoCategories').querySelectorAll('input')) input.checked = settings.categories[input.dataset.caveCategory];
    for (const input of $('caveAutoReserves').querySelectorAll('input')) {
      if (document.activeElement !== input) input.value = settings.reserves[input.dataset.caveReserve];
    }
  }
  $('caveAutoControls').addEventListener('change', e => {
    const input = e.target, settings = S.caveAutomation;
    if (!settings.unlocked) return;
    if (input.dataset.caveCategory) settings.categories[input.dataset.caveCategory] = input.checked;
    else if (input.dataset.caveReserve) {
      const value = Number(input.value);
      settings.reserves[input.dataset.caveReserve] = Number.isFinite(value) ? Math.max(0, value) : 0;
      input.value = settings.reserves[input.dataset.caveReserve];
    } else return;
    save(); updateUI();
  });

  // =====================================================================
  // tabs
  // =====================================================================
  const TABDEF = {
    cave:    { world: 'cave', open: () => true },
    wonders: { world: 'cave', open: () => shardsOn() },
    strata:  { world: 'cave', open: () => S.depth >= 1 || S.fossilsTotal > 0 || S.hearts >= 2 || S.caveAutomation.unlocked },
    glow:    { world: 'cave', open: () => S.strata.nest > 0 },
    sea:     { world: 'sea',  open: () => true },
    pearls:  { world: 'sea',  open: () => pearlsOn() },
    deep:    { world: 'sea',  open: () => S.sea.soundings >= 1 || S.sea.fathomsTotal > 0 },
    choir:   { world: 'sea',  open: () => true },
    horns:   { world: 'both', open: () => S.hornsOn },
  };
  const TABS = Object.keys(TABDEF);
  const tabVisible = t => (TABDEF[t].world === 'both' || TABDEF[t].world === S.world) && TABDEF[t].open();
  function setTab(name) {
    if (!tabVisible(name)) name = S.world;
    S.tab = name;
    S.seen['tab_' + name] = 1;
    for (const t of TABS) {
      $('tab-' + t).setAttribute('aria-selected', String(t === name));
      $('panel-' + t).hidden = t !== name;
    }
    if (name === 'horns') hornsDirty = true;
  }
  for (const t of TABS) $('tab-' + t).addEventListener('click', () => { setTab(t); updateUI(); });

  // =====================================================================
  // worlds
  // =====================================================================
  function setWorld(w) {
    if (w === S.world || cinematic) return;
    if (w === 'sea' && !S.sea.unlocked) return;
    S.world = w; S.tab = w;
    drag = null;
    afterStateChange();
    whisper(w === 'sea' ? 'Down to the sunless sea. Up above, the cave keeps singing quietly.' : 'Back up to the cave. Below, the sea keeps rolling quietly.');
  }
  $('wCave').addEventListener('click', () => setWorld('cave'));
  $('wSea').addEventListener('click', () => setWorld('sea'));

  // =====================================================================
  // prestige: descend, sound, kindle
  // =====================================================================
  let descArmed = 0, resetArmed = 0;
  $('windBtn').addEventListener('click', () => {
    if (!windReady() || S.world === 'sea') return;
    S.age *= 0.5; S.wind = 1; decayF = freshAt(S.age);
    whisper('A second wind. The floor is half as stale as it was.');
    updateUI();
  });
  $('descBtn').addEventListener('click', () => {
    if (S.world !== 'sea' && S.cool > 0) { whisper(`The floor is still settling: ${mmss(S.cool)} to go. Quests shorten it.`); return; }
    const ready = S.world === 'sea' ? canSound() : fossilGain() > 0;
    if (!ready) return;
    if (Date.now() - descArmed > 3000) {
      descArmed = Date.now(); $('descBtn').textContent = S.world === 'sea' ? 'Click again to sound' : 'Click again to descend';
      whisper(S.world === 'sea'
        ? 'Sounding resets your bells, tide, pearl dust and tide upgrades. Your pearls stay. You keep fathoms, the Deep and the Choir.'
        : `Descending resets your crystals, hum, shards, attunement and hum upgrades${S.illum.carry ? '' : ', and your wonders'}. You keep fossils, strata, lumen and glow.`);
      return;
    }
    descArmed = 0;
    if (S.world === 'sea') sound(); else descend();
  });
  $('resetBtn').addEventListener('click', () => {
    if (Date.now() - resetArmed > 3000) { resetArmed = Date.now(); $('resetBtn').textContent = 'Click again to forget'; return; }
    resetArmed = 0;
    const muted = S.muted, fx = S.fx, theme = S.theme, numfmt = S.numfmt, ts = S.ts;
    save(); backupNow();
    S = fresh(); S.muted = muted; S.fx = fx; S.theme = theme; S.ts = ts; S.numfmt = numfmt; S.lore.prologue = 1;
    try { localStorage.removeItem(KEY); } catch (_) {}
    refreshAll();
    afterStateChange();
    $('hint').hidden = false;
    hornsDirty = true;
    whisper('The cave forgets you. Shout again.');
  });

  function descend(opts) {
    const got = fossilGain();
    if (got <= 0 || S.cool > 0) return;
    const oldBiome = biomeIdx(S.depth);
    const carry = S.illum.carry;
    const oldWonders = S.wonders.map(o => ({ k: o.k, x: o.x, y: o.y, charge: 0 })), oldWB = S.wBought;
    // Below the fifth floor the ground can surprise you.
    let fall = 0, rubble = 0, vein = 0;
    if (S.depth + 1 >= 6) {
      const r = Math.random();
      if (r < 0.08) fall = 1; else if (r < 0.18) rubble = 1; else if (r < 0.30) vein = Math.max(1, Math.ceil(got * 0.25));
    }
    resetDescent(S, got, fall, vein);
    S.rubble = rubble;
    // The next floor: from depth 3 it has a character, and now and then it is a Sunvein.
    S.floor = 'still'; S.giltFloor = 0;
    if (S.depth >= 3) {
      if (sunveinRoll(S.stats.sunDry, sunChance(opts && opts.goldBonus || 0), Math.random())) {
        S.floor = 'sunvein'; S.stats.sunDry = 0;
        const arrival = sunveinArrival(GILT_LUMP, HB.traits.golden || 0);
        S.gilt += arrival; S.giltFloor = arrival; S.stats.giltLife += arrival; S.stats.sunveins++;
      } else { S.floor = rollFloor(); S.stats.sunDry = Math.min(SUN_GUARANTEE - 1, S.stats.sunDry + 1); }
    }
    S.cool = descentLock(); S.stats.descents++;
    S.stats.fossilsLife += got + vein; S.stats.bestHaul = Math.max(S.stats.bestHaul, got + vein);
    if (fall) S.stats.shafts++; if (rubble) S.stats.rockfalls++; if (vein) S.stats.veins++;
    if (carry) { S.wonders = oldWonders; S.wBought = oldWB; }
    S.stats.maxDepth = Math.max(S.stats.maxDepth, S.depth);
    S.lv.lungs = 2 * S.strata.lungs;
    S.lv.drips = S.depth + 2 * S.strata.water;
    for (const k of Object.keys(S.seen)) if (k.startsWith('u_') || k === 'canDescend') delete S.seen[k];
    refreshAll();
    afterStateChange();
    for (let i = 0; i < S.strata.seed; i++) {
      const spot = randomSpot(TIERS[1].r * SC);
      if (!spot) break;
      const c = { t: 1, x: 0, y: 0 }; setObjPx(c, spot.x, spot.y);
      S.crystals.push(c);
    }
    let msg = `Depth ${S.depth}. You carry ${fmt(got)} fossil${got > 1 ? 's' : ''} down. The cave now sings in ${MODES[S.depth % MODES.length].name.toLowerCase()}.`;
    if (fall) msg += ` The floor gave way twice, and you fell a floor further.`;
    if (rubble) msg += ' You land in rubble: this floor will need half again as much to break through.';
    if (vein) msg += ` You land on a vein: ${vein} extra fossil${vein > 1 ? 's' : ''}.`;
    if (onSun()) msg += ' A Sunvein: gold runs through the stone.';
    else if (S.floor !== 'still') msg += ` A ${FLOORS[S.floor].name.toLowerCase()} floor. ${FLOORS[S.floor].text}`;
    if (biomeIdx(S.depth) !== oldBiome) msg += ` You enter the ${BIOMES[biomeIdx(S.depth)].name}.`;
    if (S.depth >= 5 && (!S.hornsOn || Math.random() < 0.4)) { const h = gainHorn(0); msg += ' ' + hornMsg(h); }
    if (S.stats.descents === 1) msg += ' Drag a crystal to the foot of the cave: Fuse joins it with any twin, Crush breaks it up.';
    whisper(msg);
    save();
  }

  function sound() {
    const q = S.sea, got = fathomGain();
    if (!canSound() || got <= 0) return false;
    resetSounding(S, got);
    const shell = discoverShell(S);
    S.sea.lv.rain = S.sea.soundings + 2 * S.sea.deep.rain;
    S.sea.lv.light = S.sea.deep.light ? 1 : 0;
    for (const k of Object.keys(S.seen)) if (k.startsWith('v_') || k === 'canSound') delete S.seen[k];
    refreshAll();
    afterStateChange();
    const h = gainHorn(0);
    whisper(`Sounding ${S.sea.soundings}. You haul up ${fmt(got)} fathom${got > 1 ? 's' : ''} of line. ${hornMsg(h)}${shell ? ' A seashell answers. Sound it in The Deep, or finish with Auto.' : ''}`);
    save();
    return true;
  }

  // ---------- the Heartstone: press and hold ----------
  let holding = false, holdT = 0;
  const heartBtn = $('heartBtn');
  const canKindle = () => kindleReady(S, omen());
  const startHold = () => { if (canKindle() && !cinematic) { initAudio(); holding = true; } };
  const stopHold = () => { holding = false; };
  heartBtn.addEventListener('pointerdown', e => { e.preventDefault(); startHold(); });
  heartBtn.addEventListener('pointerup', stopHold);
  heartBtn.addEventListener('pointerleave', stopHold);
  heartBtn.addEventListener('pointercancel', stopHold);
  heartBtn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
  heartBtn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stopHold(); });
  heartBtn.addEventListener('contextmenu', e => e.preventDefault());

  function kindle() {
    if (!canKindle() || cinematic) return;
    cinematic = true;
    for (const c of S.crystals) { c.ring = 1; spawn(c.px, c.py, 10, 1, false, null, 0, c.r + 2); }
    chordSound();
    whisper('The Heartstone wakes. Every crystal sings at once, and then the floor gives way.');
    $('veil').classList.add('on');
    setTimeout(() => {
      S = resetHeartstone(S, VERSION);
      S.omen = rollOmen();
      for (const k of Object.keys(S.seen)) if (k.startsWith('u_') || k === 'canDescend') delete S.seen[k];
      const h = gainHorn(2);
      refreshAll();
      afterStateChange();
      waterSound();
      save();
      const wake = () => {
        $('veil').classList.remove('on');
        cinematic = false;
        whisper(`Heartstone ${S.hearts}. All hum and tide are now ×${fmt(Math.pow(3, S.hearts))}. The mountain feels ${omen().name.toLowerCase()}. ${hornMsg(h)}`);
        $('hint').hidden = S.sea.throws >= 3;
      };
      // The first kindling is told as a scene over the dark; later ones just wake you.
      if (!S.lore.heart1) { S.lore.heart1 = 1; S.seen.chron = 0; setTimeout(() => playScene('heart1', wake), 300); }
      else setTimeout(wake, 400);
    }, 1900);
  }

  function syncVoices() { syncCaveVoices(); syncSeaVoices(); }
  function afterStateChange() {
    closePops();
    buildShape(); refreshAll();
    bats = []; dripTimers = []; rainTimers = []; fishTimers = [];
    resize(); syncVoices();
    rings.length = 0; floats.length = 0;
    setTab(S.tab);
    $('hint').textContent = S.world === 'sea' ? 'Click the water to skip a stone.' : 'Click the dark to shout.';
    $('hint').hidden = S.world === 'sea' ? S.sea.throws >= 3 : S.shouts >= 3;
    cv.setAttribute('aria-label', S.world === 'sea'
      ? 'The sunless sea. Click or tap to skip a stone; drag bells to move, fuse twins, or crush in the corner zones.'
      : 'The cave. Click or tap to shout; drag crystals to move or fuse them.');
    updateUI();
  }

  // =====================================================================
  // STORY: the Chronicle, cutscenes, feats
  // =====================================================================
  const CHAPTERS = ['The Long Quiet', 'The Floor of the World', 'The Lamplighters', 'The Heartstone', 'The Sunless Sea', 'The Undersong', 'The Whole Song'];
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  // Each page unlocks when `when` turns true. Pages with cards play as a cutscene the first time.
  const LORE = [
    { id: 'prologue', ch: 0, title: 'Hollowmere', when: () => true, cards: [
      ['Hollowmere', 'There was a town called Hollowmere, built into the side of a singing mountain. Its people cut crystal by day and sang to it by night, because crystal that has been sung to keeps the song.'],
      ['The Long Quiet', 'One winter the mountain closed its mouth. No rockfall, no thunder. It simply swallowed the town, the way a held breath swallows a word. Nobody heard it happen. That was the worst part.'],
      ['The Listener', 'You were in the deepest gallery, listening for flaws in the stone. You are still there. It is dark, and you have one thing left: your voice.'],
      ['', 'Shout. See what answers.'],
    ] },
    { id: 'quartz', ch: 0, title: 'What the Quartz Remembers', when: () => S.bought[0] > 0 || S.stats.maxDepth > 0 || S.hearts > 0,
      text: 'Hold a piece of Hollowmere quartz to your ear and you will hear a street: carts, a dog, someone laughing at the well. The crystals down here are not stones. They are the town, remembering itself one note at a time.' },
    { id: 'fuse', ch: 0, title: 'Two Voices, One Stone', when: () => S.stats.fuses > 0,
      text: 'The old cutters had a saying: two songs sung together are older than either. Press twin crystals together and they do not break. They agree.' },
    { id: 'descend1', ch: 1, title: 'The Floor Gives Way', when: () => S.stats.maxDepth >= 1, cards: [
      ['The floor gives', 'The gallery floor was never a floor. It was a lid. Under it lies a second cave, older, its walls ribbed with bone.'],
      ['Fossils', 'Not animal bones. Singers’. Hollowmere was not the first town the mountain kept. Their ribs still hold the shape of the last breath they took, and the stone around them remembers every note.'],
      ['Deeper', 'Every floor you break is an older choir, and every one makes your voice carry further. Keep going down.'],
    ] },
    { id: 'shard', ch: 1, title: 'Why Stones Crack', when: () => S.stats.shards > 0,
      text: 'A crystal can only hold so much singing before it has to let some go. What falls away is sharp and bright and still humming. The foundry masters called these shards overflow, and built their strangest instruments from them.' },
    { id: 'depth3', ch: 1, title: 'The Choirs Below', when: () => S.stats.maxDepth >= 3,
      text: 'On the third floor down there are rows of stone benches facing nothing, and a conductor’s rail worn smooth by hands. Someone led a choir here while the mountain closed over them. They did not stop.' },
    { id: 'sunvein', ch: 1, title: 'Seams of Gold', when: () => S.stats.sunveins > 0,
      text: 'Now and then the floor gives way onto a seam that is not stone at all. The old singers called it a sunvein: a place where a note was held so long and so hard that it set, and went gold. It slows the fade, enriches the bones, and the horns you sound beside it come out gilded. It does not last. Nothing that bright does.' },
    { id: 'horn', ch: 1, title: 'Herders’ Horns', when: () => S.stats.hornsFound > 0,
      text: 'Above the town, herders called their goats off the cliffs with horns carved from the animals themselves. The horns are turning up down here now, one at a time, as if something were handing them back. Each still carries the call it was made for.' },
    { id: 'nest', ch: 2, title: 'The Lamplighters', when: () => S.strata.nest > 0, cards: [
      ['Lights in the ceiling', 'Hollowmere kept lamplighters, children mostly, who walked the galleries at dusk. When the mountain closed, the lamplighters were in the high tunnels.'],
      ['Glowworms', 'They are small now, and patient, and they hang from the ceiling on threads of light. They drink the echoes you make. It is the only warmth left down here, and they turn it into lumen.'],
      ['A trade', 'Every echo they eat is hum you will not ring. But lumen does not fade when you descend. They are saving it for something.'],
    ] },
    { id: 'heartseen', ch: 2, title: 'A Beat in the Stone', when: () => S.lumenTotal >= 1e4 || S.hearts > 0,
      text: 'Past a certain depth you can feel it through your feet: a slow pulse, very far below. The lamplighters’ light bends toward it. Lumen, it turns out, is fuel.' },
    { id: 'heart1', ch: 3, title: 'Kindling the Heartstone', when: () => S.hearts >= 1, cards: [
      ['The Heartstone', 'At the root of the mountain sits a stone the size of a house, and it is warm. For a hundred years it has held one chord: the last one Hollowmere sang before the Quiet.'],
      ['Kindling', 'You pour the lumen in. The chord breaks loose. Every crystal in every cave rings it back at once, and the mountain, for the first time in a century, opens its mouth.'],
      ['Water', 'It is not air that rushes in. It is the sea, the one that has been lying under the town all along. When the ringing stops you are standing on a black shore.'],
    ] },
    { id: 'heart2', ch: 3, title: 'Again, the Fire', when: () => S.hearts >= 2,
      text: 'You climb back to the caves and find they have healed shut, as caves do. But you remember the chord now. Kindling it a second time is easier to decide and harder to do.' },
    { id: 'omens', ch: 3, title: 'Moods', when: () => S.hearts >= 1,
      text: 'After the first kindling the mountain stops asking the same thing twice. Some days the stone is thin and the Heartstone wakes early. Some days it is thick, or hungry. The old singers called these its moods, and learned to read them before they began to climb.' },
    { id: 'heart3', ch: 3, title: 'What the Mountain Wants', when: () => S.hearts >= 3,
      text: 'After the third kindling you understand. The mountain did not swallow Hollowmere out of spite. It was cold and it was lonely, and a town full of singers is warm. Every Heartstone you light gives a little of that warmth back.' },
    { id: 'sea', ch: 4, title: 'The Sunless Sea', when: () => S.sea.unlocked && S.world === 'sea',
      text: 'Lower Hollowmere drowned long before the Quiet: the foundry quarter, where they cast the bells. The bells are still here, floating on their buoys, waiting to be struck. Stone will not carry your voice across water, so you skip stones instead.' },
    { id: 'cross', ch: 4, title: 'Crossing Songs', when: () => S.stats.crossings > 0,
      text: 'Foundry apprentices were taught to strike two bells so that their notes met in the air. Where they met, the sound doubled. The sea still remembers the lesson.' },
    { id: 'pearl', ch: 4, title: 'Foundry Pearls', when: () => S.stats.pearls > 0,
      text: 'The oysters grew on slag from the bell furnaces. Their pearls come out warm, and each one hums a single low note.' },
    { id: 'sound1', ch: 4, title: 'The Drowned Tower', when: () => S.sea.soundings >= 1, cards: [
      ['Sounding', 'You drop a plumb line off the shore. It keeps going. Far down it knocks against something that rings: the bell tower of Hollowmere, standing on the sea floor, still upright.'],
      ['Fathoms', 'Every fathom of line you haul back up is wet with an older song. The deeper you sound, the more of it you bring up.'],
    ] },
    { id: 'undersong', ch: 5, title: 'The Undersong', when: () => S.sea.soundings >= 3,
      text: 'Below the tower the line goes slack, as if it had reached open air. Then it pulls back, gently, three times, like someone on the other end is testing it. Something under the sea is singing, and it has noticed you.' },
    { id: 'listener', ch: 5, title: 'The Listener’s Name', when: () => Object.keys(S.feats).length >= 12,
      text: 'On one of the stone benches in the old choir you find a name cut among the others. It is yours. You do not remember sitting there. Perhaps everyone who listens long enough ends up singing.' },
    { id: 'depth5', ch: 1, title: 'The Fifth Floor', when: () => S.stats.maxDepth >= 5,
      text: 'By the fifth floor the walls have stopped echoing you and started answering. Not in words: in the shape of the next note, a half-beat before you sing it. Whoever carved these caves was listening for the same thing.' },
    { id: 'uneven', ch: 1, title: 'Uneven Ground', when: () => S.stats.shafts + S.stats.rockfalls + S.stats.veins > 0,
      text: 'Below the fifth floor the ground is not always where it should be. Sometimes the floor gives way twice. Sometimes it buries you in rubble, and sometimes it opens on a vein of old fossils. None of it is aimed at you. The mountain is simply very old.' },
    { id: 'depth10', ch: 2, title: 'The Bottom of the Bottomless', when: () => S.stats.maxDepth >= 10,
      text: 'The tenth floor has no floor. You stand on a ledge of old song, packed so hard it has turned to stone, and far beneath it something warm is keeping time.' },
    { id: 'sound2', ch: 4, title: 'Slack Water', when: () => S.sea.soundings >= 2,
      text: 'On the second sounding the water goes still. Not calm: attentive. Every bell on its buoy stops swaying at once, as if a conductor had raised a hand.' },
    { id: 'sound4', ch: 5, title: 'Four Knocks', when: () => S.sea.soundings >= 4,
      text: 'The line pulls back once, twice, three times, four. Four knocks is how a foundry apprentice told the master caster that the mould was ready. Someone under the tower is asking whether you are.' },
    { id: 'sound6', ch: 5, title: 'The Last Interval', when: () => S.sea.soundings >= 6,
      text: 'The line goes slack and stays slack. It is not testing you any more. Between the bell and the floor of the sea there is one interval left unsung, and it is waiting for you to sing it.' },
    { id: 'finale', ch: 6, title: 'The Undersong', when: () => S.finale > 0, cards: () => [
      ['The Answer', 'You pour the offering into the water and shout once, the way you did on the first day, into a dark you no longer remember being small.'],
      ['Below the Tower', 'The sea lets go of the line. Beneath the bell tower the air fills with voices: not ghosts, not echoes, but a choir, every singer of Hollowmere, mid-breath, holding the note they were singing when the mountain closed.'],
      ['What They Were Waiting For', `They had not been lost. They had been holding the note, all of them, until someone sang the next one. It took ${fmt(S.shouts)} ${S.shouts === 1 ? 'shout' : 'shouts'}, ${S.sea.soundings} soundings, ${S.hearts} Heartstones and ${Object.keys(S.feats).length} feats. It took exactly as long as it took.`],
      ['The Song Closes', 'Hum from the cave above and tide from the sea below meet at the tower, and the interval resolves. The mountain is warm. The water is bright. Somewhere, a door that was never locked swings open.'],
      ['Hollowmere', 'The town does not come back. It does not need to. It sings, and you are in the choir, third bench from the left, where your name was cut before you arrived. The song is complete. It will keep going anyway.'],
    ] },
  ];
  const cardsOf = l => typeof l.cards === 'function' ? l.cards() : l.cards;
  const LORE_BY_ID = Object.fromEntries(LORE.map(l => [l.id, l]));

  const FEATS = [
    { id: 'shout', name: 'First Word', desc: 'Shout into the dark.', check: () => S.shouts >= 1 },
    { id: 'hoarse', name: 'Hoarse', desc: 'Shout or skip a stone 1,000 times.', check: () => S.shouts + S.sea.throws >= 1000 },
    { id: 'hum3', name: 'Murmur', desc: 'Sing 1K hum, all told.', check: () => S.total >= 1e3 },
    { id: 'hum6', name: 'Chorus', desc: 'Sing 1M hum, all told.', check: () => S.total >= 1e6 },
    { id: 'hum9', name: 'Cathedral', desc: 'Sing 1B hum, all told.', w: 3, check: () => S.total >= 1e9 },
    { id: 'hum12', name: 'Mountain Song', desc: 'Sing 1T hum, all told.', w: 3, check: () => S.total >= 1e12 },
    { id: 'fuse', name: 'Two Become One', desc: 'Fuse two crystals or bells.', check: () => S.stats.fuses >= 1 },
    { id: 'moon', name: 'Moonlit', desc: 'Own a moonstone.', check: () => S.crystals.some(c => c.t === 3) },
    { id: 'full', name: 'Crowded Dark', desc: 'Fill every crystal slot in a cave.', check: () => S.crystals.length >= maxCrystals() },
    { id: 'chord8', name: 'Eightfold', desc: 'Ring 8 crystals in the same breath.', check: () => S.stats.maxChord >= 8 },
    { id: 'depth1', name: 'Breaking Ground', desc: 'Descend for the first time.', check: () => S.stats.maxDepth >= 1 },
    { id: 'depth5', name: 'Deeper Still', desc: 'Reach depth 5.', check: () => S.stats.maxDepth >= 5 },
    { id: 'depth10', name: 'The Bottomless', desc: 'Reach depth 10.', w: 3, check: () => S.stats.maxDepth >= 10 },
    { id: 'shaft', name: 'Freefall', desc: 'Fall two floors at once.', check: () => S.stats.shafts >= 1 },
    { id: 'shard', name: 'Cracked Open', desc: 'Make a crystal shed shards.', check: () => S.stats.shards > 0 },
    { id: 'boom', name: 'Thunder Below', desc: 'Make a gong boom.', check: () => S.stats.booms >= 1 },
    { id: 'prisms', name: 'Split Light', desc: 'Place 4 prisms in one cave.', check: () => S.wonders.filter(o => o.k === 'prism').length >= 4 },
    { id: 'lumen3', name: 'Kindling', desc: 'Gather 1K lumen in one cave.', check: () => S.lumenTotal >= 1e3 },
    { id: 'lumen6', name: 'Lantern Bearer', desc: 'Gather 1M lumen in one cave.', w: 3, check: () => S.lumenTotal >= 1e6 },
    { id: 'hands', name: 'Many Hands', desc: 'Own all three automations at once.', check: () => !!(S.illum.autofuse && S.illum.autobuy && S.illum.autodescend) },
    { id: 'heart1', name: 'Heartfire', desc: 'Kindle a Heartstone.', check: () => S.hearts >= 1 },
    { id: 'heart3', name: 'Thrice Kindled', desc: 'Kindle three Heartstones.', w: 3, check: () => S.hearts >= 3 },
    { id: 'cross', name: 'Crossing', desc: 'Ring a bell with crossing ripples.', check: () => S.stats.crossings >= 1 },
    { id: 'cross1k', name: 'Tidecaller', desc: 'Ring 1,000 crossings.', w: 3, check: () => S.stats.crossings >= 1000 },
    { id: 'pearl', name: 'Pale Moon', desc: 'Open an oyster.', check: () => S.stats.pearls > 0 },
    { id: 'abyss', name: 'Abyssal', desc: 'Own an abyssal bell.', check: () => S.sea.bells.some(b => b.bt === 3) },
    { id: 'sound1', name: 'Plumb Line', desc: 'Sound the depths.', check: () => S.sea.soundings >= 1 },
    { id: 'sound5', name: 'Fathomless', desc: 'Reach sounding 5.', w: 3, check: () => S.sea.soundings >= 5 },
    { id: 'tide9', name: 'Spring Tide', desc: 'Ring 1B tide, all told.', w: 3, check: () => S.sea.total >= 1e9 },
    { id: 'horn', name: 'Horned', desc: 'Find a horn.', check: () => S.stats.hornsFound >= 1 },
    { id: 'legend', name: 'Gilded', desc: 'Find a legendary horn.', w: 3, check: () => S.stats.bestHorn >= 3 },
    { id: 'mythic', name: 'Worldsong', desc: 'Find a mythic horn.', w: 3, check: () => S.stats.bestHorn >= 4 },
    { id: 'rack', name: 'Full Rack', desc: 'Wear three horns at once.', check: () => S.equipped.length >= 3 },
    { id: 'song', name: 'The Whole Song', desc: 'Answer the Undersong.', w: 3, check: () => S.finale > 0 },
    { id: 'dream', name: 'Dreamer', desc: 'Come back after an hour away to find the world still singing.', check: () => S.stats.longAway >= 1 },
  ];

  // ---------- the Undersong ----------
  const SONG_COST = SONG_FATHOMS;
  const songReqs = () => [
    { label: 'Sound the depths', have: S.sea.soundings, need: FINALE_SOUNDINGS },
    { label: 'Kindle Heartstones', have: S.hearts, need: FINALE_HEARTS },
    { label: 'Earn feats', have: Object.keys(S.feats).length, need: 20 },
  ];
  const songReady = () => songReqs().every(r => r.have >= r.need);
  const songOn = () => S.finale > 0 || S.sea.soundings >= 3;
  const AFTER_SCENE = { finale: () => openCredits() };
  let creditsOpen = false;
  function openCredits() {
    creditsOpen = true;
    $('creditsSub').textContent = `Geode Choir ${VERSION} (${CHANNEL})`;
    $('creditsText').textContent = 'Thank you for listening. The caves are still singing, and so is the sea. Keep going for as long as you like: nothing here ends, it only gets deeper.';
    $('creditsRows').innerHTML = [
      ['Time played', fmtDur(S.stats.playSec || 0)], ['Shouts and stones', fmt(S.shouts + S.sea.throws)],
      ['Hum sung', fmt(S.total)], ['Tide rung', fmt(S.sea.total)], ['Deepest cave', S.stats.maxDepth], ['Soundings', S.sea.soundings],
      ['Heartstones', S.hearts], ['Feats', `${Object.keys(S.feats).length} / ${FEATS.length}`],
    ].map(r => `<div class="stat"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
    $('credits').hidden = false; $('creditsClose').focus();
  }
  function closeCredits() { creditsOpen = false; $('credits').hidden = true; }
  $('creditsClose').addEventListener('click', closeCredits);
  $('credits').addEventListener('click', e => { if (e.target === $('credits')) closeCredits(); });
  function answerSong() {
    if (S.finale || cinematic || sceneOpen || !songReady()) return;
    if (!spend('fathom', SONG_COST)) return;
    S.finale = Date.now();
    cinematic = true;
    $('veil').classList.add('on');
    if (audible()) { chordSound(); setTimeout(waterSound, 600); }
    whisper('You answer. The line goes still, and then the whole sea listens.');
    save();
    setTimeout(() => { $('veil').classList.remove('on'); cinematic = false; checkStory(); updateUI(); }, 1600);
  }
  function updateSong() {
    const on = songOn();
    setHid('songSec', !on);
    if (!on) return;
    const done = S.finale > 0, ready = songReady(), afford = S.sea.fathoms >= SONG_COST;
    setT('songNote', done ? 'The Song is complete. The choir under the tower keeps singing, and so do you.'
      : ready ? `Everything is in place. Answering costs ${SONG_COST} fathoms, an offering poured into the water.`
      : 'Something under the tower is waiting for an answer. It wants proof that you have heard the whole mountain and the whole sea.');
    setH('songReqs', done ? '' : songReqs().map(r => `<div class="stat${r.have >= r.need ? ' done' : ''}"><span>${r.label}</span><b>${r.have >= r.need ? '✓' : `${r.have} / ${r.need}`}</b></div>`).join(''));
    const btn = $('songBtn');
    setT('songBtn', done ? 'Hear it again' : `Answer the Undersong · ${SONG_COST} fathoms`);
    btn.classList.toggle('poor', !done && !(ready && afford));
  }
  $('songBtn').addEventListener('click', () => {
    initAudio();
    if (S.finale) { if (!sceneOpen && !cinematic) playScene('finale', AFTER_SCENE.finale); return; }
    if (!songReady()) { whisper('Not yet. The tower wants more than this.'); return; }
    if (S.sea.fathoms < SONG_COST) { whisper(`You need ${SONG_COST} fathoms to make the offering.`); return; }
    answerSong();
  });

  function checkQuests(silent) {
    let any = false;
    for (const qd of QUESTS) {
      if (S.quests[qd.id] || qd.have() < qd.need) continue;
      S.quests[qd.id] = 1; any = true;
      if (S.cool > 0) S.cool = Math.max(0, S.cool - LOCK_STEP);
      if (!silent) toast('Quest', `<b>${qd.name}</b> done · descents settle ${mmss(LOCK_STEP)} faster`, 'lore');
    }
    if (any) refreshAll();
  }
  function updateQuests() {
    setT('questNote', `After a descent the floor takes ${mmss(descentLock())} to settle. Each quest below makes it ${mmss(LOCK_STEP)} shorter, down to ${mmss(LOCK_MIN)}.`);
    setH('questList', QUESTS.map(qd => { const done = !!S.quests[qd.id]; return `<div class="stat${done ? ' done' : ''}"><span><b style="font-weight:600;color:var(--text)">${qd.name}</b> · ${qd.desc}</span><b>${done ? '✓' : Math.min(qd.have(), qd.need) + ' / ' + qd.need}</b></div>`; }).join(''));
  }

  // ---------- toasts ----------
  function toast(kind, text, cls) {
    const box = $('toasts');
    while (box.children.length >= 3) box.removeChild(box.firstChild);
    const t = document.createElement('div');
    t.className = 'toast' + (cls ? ' ' + cls : '');
    t.innerHTML = `<span class="k">${kind}</span><span>${text}</span>`;
    box.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 4300);
  }

  // ---------- unlocking ----------
  function checkStory(silent) {
    const caught = { lore: 0, feats: 0 };
    if (!silent && (cinematic || sceneOpen)) return caught;
    let changed = false;
    for (const f of FEATS) {
      if (S.feats[f.id] || !f.check()) continue;
      S.feats[f.id] = 1; caught.feats++; changed = true;
      if (!silent) toast('Feat', `<b>${f.name}</b> · hum &amp; tide +${f.w || 2}%`);
    }
    for (const l of LORE) {
      if (S.lore[l.id] || !l.when()) continue;
      S.lore[l.id] = 1; caught.lore++;
      if (silent) continue;
      if (l.cards) { playScene(l.id, AFTER_SCENE[l.id]); break; }   // one cutscene at a time; anything after it waits for the next check
      toast('Chronicle', `A new page: <b>${l.title}</b>`, 'lore');
    }
    if (caught.lore || caught.feats) S.seen.chron = 0;
    if (changed) refreshAll();
    if (chronOpen) renderChronicle();
    return caught;
  }

  // ---------- cutscenes ----------
  let sceneOpen = false, sceneCards = [], sceneIdx = 0, sceneDone = null, sceneId = '';
  const sceneEl = $('scene');
  function playScene(id, onDone) {
    const l = LORE_BY_ID[id];
    if (!l || !l.cards) { if (onDone) onDone(); return; }
    sceneOpen = true; sceneCards = cardsOf(l); sceneIdx = 0; sceneDone = onDone || null; sceneId = id;
    $('sceneEyebrow').textContent = `Chapter ${ROMAN[l.ch]} · ${CHAPTERS[l.ch]}`;
    $('sceneDots').innerHTML = '<i></i>'.repeat(sceneCards.length);
    sceneEl.hidden = false;
    drag = null; holding = false;
    showCard();
    if (audible()) tone(110, 0.05, 4, 1.5, 0.3);
  }
  function showCard() {
    const [title, text] = sceneCards[sceneIdx];
    $('sceneTitle').textContent = title;
    $('sceneTitle').hidden = !title;
    $('sceneText').textContent = text;
    const card = $('sceneCard');
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    const dots = $('sceneDots').children;
    for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i === sceneIdx);
    const last = sceneIdx === sceneCards.length - 1;
    $('sceneNext').textContent = last ? (sceneId === 'prologue' ? 'Begin' : 'Close') : 'Continue';
    $('sceneSkip').hidden = last;
    $('sceneNext').focus();
  }
  function nextCard() {
    if (!sceneOpen) return;
    if (sceneIdx < sceneCards.length - 1) { sceneIdx++; showCard(); if (audible()) tone(165, 0.03, 2.5, 2, 0.2); }
    else endScene();
  }
  function endScene() {
    if (!sceneOpen) return;
    sceneOpen = false; sceneEl.hidden = true;
    const cb = sceneDone; sceneDone = null;
    if (cb) cb();
  }
  sceneEl.addEventListener('click', e => { initAudio(); if (e.target.closest('#sceneSkip')) return; nextCard(); });
  $('sceneSkip').addEventListener('click', e => { e.stopPropagation(); endScene(); });
  window.addEventListener('keydown', e => {
    if (sceneOpen) {
      if (e.key === 'Escape') { e.preventDefault(); endScene(); }
      else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); nextCard(); }
      return;
    }
    if (chronOpen && e.key === 'Escape') closeChronicle();
    if (awayOpen && e.key === 'Escape') closeAway();
    if (creditsOpen && e.key === 'Escape') closeCredits();
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const tg = e.target, tag = tg && tg.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT') return;
    if (setOpen || newsOpen || chronOpen || awayOpen || creditsOpen || cinematic) return;
    if (e.key === ' ' && tag !== 'BUTTON') { e.preventDefault(); initAudio(); const q = randomInside(); tap(q.x, q.y, null); }
    else if (e.key >= '1' && e.key <= '9') { const t = [...document.querySelectorAll('#tabs .tab:not([hidden])')][+e.key - 1]; if (t) t.click(); }
    else if (e.key === 'c' || e.key === 'C') { initAudio(); openChronicle(); }
    else if (e.key === 'm' || e.key === 'M') { initAudio(); setMuted(!S.muted); }
    else if (e.key === '?') openSettings();
  });

  // ---------- the Chronicle ----------
  let chronOpen = false;
  function openChronicle() {
    chronOpen = true; S.seen.chron = 1;
    $('chron').hidden = false;
    renderChronicle();
    $('chronClose').focus();
  }
  function closeChronicle() { chronOpen = false; $('chron').hidden = true; $('chronBtn').focus(); }
  function fmtDur(sec) {
    sec = Math.max(0, Math.round(sec));
    const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
    if (d) return `${d}d ${h}h`;
    if (h) return `${h}h ${m}m`;
    return m ? `${m}m` : `${sec}s`;
  }
  function setChronTab(t) {
    $('ctab-story').setAttribute('aria-selected', String(t === 'story'));
    $('ctab-feats').setAttribute('aria-selected', String(t === 'feats'));
    $('chronStory').hidden = t !== 'story';
    $('chronFeats').hidden = t !== 'feats';
    $('ctab-stats').setAttribute('aria-selected', String(t === 'stats'));
    $('chronStats').hidden = t !== 'stats';
  }
  function renderChronicle() {
    const got = Object.keys(S.feats).length, pages = LORE.filter(l => S.lore[l.id]).length;
    $('chronSub').textContent = `${pages} of ${LORE.length} pages · ${got} of ${FEATS.length} feats (hum & tide ×${fmtX(featMult())})${S.finale ? ' · The Song is complete' : ''}`;
    let html = '';
    CHAPTERS.forEach((name, ch) => {
      const entries = LORE.filter(l => l.ch === ch);
      // Hide chapters the story hasn't reached yet, but show the next one as a row of empty pages.
      const reached = entries.some(l => S.lore[l.id]) || LORE.some(l => l.ch === ch - 1 && S.lore[l.id]);
      if (!reached) return;
      html += `<div class="chapter"><div class="chapter-name">Chapter ${ROMAN[ch]} · ${name}</div>`;
      for (const l of entries) {
        if (!S.lore[l.id]) { html += '<div class="page locked"><p>A page not yet found.</p></div>'; continue; }
        const paras = l.cards ? cardsOf(l).map(c => c[1]) : [l.text];
        html += `<div class="page"><h3>${l.title}</h3>${paras.map(t => `<p>${t}</p>`).join('')}${l.cards ? `<button type="button" data-replay="${l.id}">Replay scene</button>` : ''}</div>`;
      }
      html += '</div>';
    });
    $('chronStory').innerHTML = html;
    const st = S.stats, held = visibleRarities(S).map((r, i) => S.horns.filter(h => h.r === i).length);
    const rows = [
      ['Time played', fmtDur(st.playSec || 0)],
      ['Shouts', fmt(S.shouts)], ['Stones thrown', fmt(S.sea.throws)],
      ['Hum sung, all told', fmt(S.total)], ['Tide rung, all told', fmt(S.sea.total)],
      ['Deepest cave', st.maxDepth], ['Soundings', S.sea.soundings], ['Heartstones', S.hearts],
      ['Crystals fused', fmt(st.fuses)], ['Biggest chord', st.maxChord], ['Gong booms', fmt(st.booms)],
      ['Shards shed', fmt(st.shards)], ['Crossings rung', fmt(st.crossings)], ['Pearl dust gathered', fmt(st.pearls)],
      ['Horns found', fmt(st.hornsFound)], ['Horns held', S.horns.length],
      ...visibleRarities(S).map((r, i) => [`${r.name} horns held`, held[i]]),
      ['The Song', S.finale ? new Date(S.finale).toLocaleDateString() : 'Unsung'],
      ['Feats', `${got} / ${FEATS.length}`], ['Pages', `${pages} / ${LORE.length}`],
    ];
    $('statGrid').innerHTML = rows.map(r => `<div class="stat"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
    $('featGrid').innerHTML = FEATS.map(f => `<div class="feat${S.feats[f.id] ? ' got' : ''}"><b>${S.feats[f.id] ? f.name : 'Unfound feat'}</b><span>${f.desc}</span></div>`).join('');
  }
  $('chronBtn').addEventListener('click', () => { initAudio(); chronOpen ? closeChronicle() : openChronicle(); });
  $('chronClose').addEventListener('click', closeChronicle);
  $('chron').addEventListener('click', e => { if (e.target === $('chron')) closeChronicle(); });
  $('ctab-story').addEventListener('click', () => setChronTab('story'));
  $('ctab-feats').addEventListener('click', () => setChronTab('feats'));
  $('ctab-stats').addEventListener('click', () => setChronTab('stats'));
  $('chronStory').addEventListener('click', e => {
    const b = e.target.closest('button[data-replay]');
    if (!b) return;
    closeChronicle();
    playScene(b.dataset.replay);
  });

  // =====================================================================
  // HUD
  // =====================================================================
  const chordDots = $('chord').querySelector('.dots');
  chordDots.innerHTML = '<i></i>'.repeat(8);
  // Cached DOM writes: the ledger refreshes ~8x a second but only touches what changed.
  function setT(id, v) { const e = $(id); v = String(v); if (e._t !== v) { e._t = v; e.textContent = v; } }
  function setH(id, v) { const e = $(id); if (e._h !== v) { e._h = v; e.innerHTML = v; } }
  function setHid(id, v) { const e = $(id); v = !!v; if (e.hidden !== v) e.hidden = v; }

  // =====================================================================
  // the status strip (Descend, Heartstone, Horn) and the hover stats
  // =====================================================================
  const POPS = [['chipDesc', 'popDesc'], ['chipHeart', 'popHeart']];
  function closePops(except) {
    for (const [c, p] of POPS) {
      if (p === except || $(p).hidden) continue;
      $(p).hidden = true; $(c).setAttribute('aria-expanded', 'false');
    }
  }
  for (const [c, p] of POPS) $(c).addEventListener('click', () => {
    const open = $(p).hidden;
    closePops(open ? p : null);
    $(p).hidden = !open; $(c).setAttribute('aria-expanded', String(open));
    updateUI();
  });
  $('chipHorn').addEventListener('click', () => openSounding());
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.pop, .schip')) closePops(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePops(); });
  function chip(id, label, val, frac, ready) {
    const e = $(id);
    setT(id + 'L', label); setT(id + 'V', val);
    const p = Math.round(Math.max(0, Math.min(1, frac || 0)) * 100);
    if (e._p !== p) { e._p = p; e.style.setProperty('--p', p); }
    e.classList.toggle('ready', !!ready);
  }
  function updateStrip(sea, prog, locked, got) {
    const ready = prog >= 1 && !locked;
    chip('chipDesc', locked ? 'Settling' : sea ? 'Sound' : 'Descend', locked ? mmss(sea ? S.sea.cool / tickRate() : S.cool) : ready ? '+' + fmt(got) : Math.floor(prog * 100) + '%', prog, ready);
    $('chipDesc').classList.toggle('sea', sea);
    const showHeart = !sea && (S.lumenTotal >= 1e4 || S.hearts > 0);
    setHid('chipHeart', !showHeart);
    if (showHeart) {
      const cost = heartCost(), can = canKindle(), f = Math.min(1, S.lumen / cost);
      chip('chipHeart', 'Heartstone', can ? 'Ready' : Math.floor(f * 100) + '%', f, can);
    } else if (!$('popHeart').hidden) closePops();
    const waiting = hornsWaiting();
    setHid('chipHorn', !S.hornsOn && !waiting);
    if (waiting) chip('chipHorn', 'Sound horn', '×' + waiting, 1, true);
    else if (S.hornsOn) { const t = Math.max(0, S.hornTimer); chip('chipHorn', 'Horn', mmss(t / tickRate()), 1 - t / hornInterval(), false); }
  }

  // Hover (or focus, or tap) a currency for its lifetime total and best.
  function tipData(id) {
    const q = S.sea, st = S.stats, sea = S.world === 'sea', F = fmt;
    switch (id) {
      case 'hum': return sea
        ? { t: 'Tide', rows: [['This sounding', F(q.run)], ['All told', F(q.total)], ['Best rate', F(st.bestTide) + '/s']] }
        : { t: 'Hum', rows: [['This floor', F(S.run)], ['All told', F(S.total)], ['Best rate', F(st.bestRate) + '/s']] };
      case 'shard': return { t: 'Shards', rows: [['Held now', F(S.shards)], ['Lifetime', F(st.shards)]] };
      case 'fossil': return { t: 'Fossils', rows: [['Held now', F(S.fossils)], ['This Heartstone', F(S.fossilsTotal)], ['Lifetime', F(st.fossilsLife)], ['Best haul', F(st.bestHaul)]] };
      case 'lumen': return { t: 'Lumen', rows: [['Held now', F(S.lumen)], ['This Heartstone', F(S.lumenTotal)], ['Lifetime', F(st.lumenLife)], ['Best rate', F(st.bestLumenRate) + '/s']] };
      case 'pearl': return { t: 'Pearl dust', rows: [['Held now', F(q.pearls)], ['Lifetime', F(st.pearls)], ['Pearls kept', F(S.pearls.items.length)], ['Oysters opened', F(S.pearls.opens)]] };
      case 'fathom': return { t: 'Fathoms', rows: [['Held now', F(q.fathoms)], ['Lifetime', F(q.fathomsTotal)], ['Best sounding', F(st.bestFathomHaul)]] };
      case 'ivory': return { t: 'Ivory', rows: [['Held now', F(S.ivory)], ['Lifetime', F(st.ivoryLife)], ['Horns found', F(st.hornsFound)]] };
      case 'gilt': return { t: 'Gilt', rows: [['Held now', F(Math.floor(S.gilt))], ['Lifetime', F(Math.floor(st.giltLife))], ['This floor', onSun() ? `${Math.floor(S.giltFloor)} / ${GILT_CAP}` : 'not on a Sunvein'],
        ['Sunvein chance', Math.round((sunChance() + sunPityBonus(st.sunDry)) * 100) + '% a descent'], ['Dry descents', `${F(st.sunDry)} of ${SUN_GUARANTEE - 1} (a Sunvein is guaranteed after ${SUN_GUARANTEE})`], ['Gilded horns owned', F(goldHorns())], ['Sunveins found', F(st.sunveins)]] };
      case 'hearts': return { t: 'Heartstones', rows: [['Kindled', F(S.hearts)], ['Deepest cave', F(st.maxDepth)], ['Descents', F(st.descents)]] };
    }
    return null;
  }
  const tipEl = document.createElement('div');
  tipEl.className = 'tip'; tipEl.hidden = true; tipEl.setAttribute('role', 'tooltip');
  document.body.appendChild(tipEl);
  let tipFor = null, lastPointer = 'mouse';
  function hideTip() { tipFor = null; tipEl.hidden = true; }
  function renderTip() {
    if (!tipFor) return;
    const d = tipData(tipFor.dataset.tip);
    if (!d || tipFor.offsetParent === null) { hideTip(); return; }
    const html = `<h4>${d.t}</h4>` + d.rows.map(r => `<div class="r"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('');
    if (tipEl._h !== html) { tipEl._h = html; tipEl.innerHTML = html; }
    tipEl.hidden = false;
    const r = tipFor.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    let x = Math.min(Math.max(8, r.left), innerWidth - w - 8), y = r.bottom + 8;
    if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 8);
    tipEl.style.left = x + 'px'; tipEl.style.top = y + 'px';
  }
  const tipTarget = e => e.target.closest && e.target.closest('[data-tip]');
  document.addEventListener('pointerdown', e => { lastPointer = e.pointerType || 'mouse'; if (lastPointer === 'touch' && !tipTarget(e)) hideTip(); });
  document.addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; const el = tipTarget(e); if (el) { tipFor = el; renderTip(); } else if (tipFor) hideTip(); });
  document.addEventListener('focusin', e => { const el = tipTarget(e); if (el) { tipFor = el; renderTip(); } });
  document.addEventListener('focusout', () => hideTip());
  document.addEventListener('click', e => {
    if (lastPointer !== 'touch') return;
    const el = tipTarget(e);
    if (!el) return;
    if (tipFor === el) hideTip(); else { tipFor = el; renderTip(); }
  });

  function updateUI() {
    if (simulation?.fast) return;
    const sea = S.world === 'sea', q = S.sea;
    setT('tagline', sea ? 'A sea that pays you in ripples.' : 'A cave that pays you in echoes.');
    $('purse').classList.toggle('sea', sea);
    setT('humVal', fmt(sea ? q.tide : S.hum));
    setT('humUnit', sea ? 'tide' : 'hum');
    setT('rateVal', fmt(sea ? q.rate || 0 : S.rate || 0));
    if (sea) { if ((q.rate || 0) > S.stats.bestTide) S.stats.bestTide = q.rate; }
    else if ((S.rate || 0) > S.stats.bestRate) S.stats.bestRate = S.rate;
    setT('rateUnit', sea ? 'tide/s' : 'hum/s');
    setT('echoVal', sea ? ripples.length : P.length);
    setT('echoUnit', sea ? 'ripples spreading' : 'echoes ringing');
    setT('crystalCount', `${S.crystals.length} / ${maxCrystals()}`);
    setT('bellCount', `${q.bells.length} / ${bellCap()}`);
    setH('depthChip', sea
      ? `<b>Sounding ${q.soundings}</b><span>${MODES[(q.soundings + 1) % MODES.length].name}</span>${SK.tm > 1.001 ? `<span class="mono">×${fmt(SK.tm)}</span>` : ''}`
      : `<b>Depth ${S.depth}</b><span>${MODES[S.depth % MODES.length].name}</span>${K.dm > 1.001 ? `<span class="mono">×${fmt(K.dm)}</span>` : ''}${onSun() ? '<span class="ftag gold">Sunvein</span>' : S.floor !== 'still' ? `<span class="ftag">${FLOORS[S.floor].name}</span>` : ''}`);
    { const ct = sea ? '' : floorBlurb().replace(/<[^>]*>/g, ''); const dc = $('depthChip'); if (dc.title !== ct) dc.title = ct; }
    setT('lifetime', q.unlocked ? `${fmt(S.total)} hum · ${fmt(q.total)} tide, all told` : `${fmt(S.total)} hum sung, all told`);
    setHid('worlds', !q.unlocked);
    $('wCave').setAttribute('aria-pressed', String(!sea));
    $('wSea').setAttribute('aria-pressed', String(sea));
    if (setOpen) setT('fxNote', `Auto trims glows and halos when more than about 100 things are moving. Calm always does, and draws at lower resolution.${S.fx === 'auto' ? (lite ? ' Right now it is trimming.' : ' Right now it is drawing everything.') : ''}`);

    setHid('pillShard', sea || !shardsOn()); setT('shardVal', fmt(S.shards));
    setHid('pillFossil', sea || !(S.depth >= 1 || S.fossilsTotal > 0)); setT('fossilVal', fmt(S.fossils));
    setHid('pillLumen', sea || !S.strata.nest); setT('lumenVal', fmt(S.lumen));
    setT('lumenRate', lumenRate > 0 ? `+${fmt(lumenRate)}/s` : '');
    if (lumenRate > S.stats.bestLumenRate) S.stats.bestLumenRate = lumenRate;
    setHid('pillPearl', !sea || !pearlsOn()); setT('pearlVal', fmt(q.pearls));
    setHid('pillFathom', !sea || !(q.soundings >= 1 || q.fathomsTotal > 0)); setT('fathomVal', fmt(q.fathoms));
    setHid('pillIvory', !S.hornsOn); setT('ivoryVal', fmt(S.ivory));
    setHid('pillGilt', !(S.stats.sunveins > 0 || S.gilt > 0)); setT('giltVal', fmt(Math.floor(S.gilt)));
    setHid('pillHeart', !S.hearts); setT('heartVal', S.hearts);
    setHid('chronDot', !!S.seen.chron);

    let others = 0;
    for (const t of TABS) {
      const vis = tabVisible(t);
      $('tab-' + t).hidden = !vis;
      if (vis && t !== S.world) others++;
      const dot = $('tab-' + t).querySelector('.new');
      if (dot) dot.hidden = !vis || !!S.seen['tab_' + t];
    }
    setHid('tabs', others === 0);
    if (!tabVisible(S.tab)) setTab(S.world);

    for (const it of shopEls) it.update();

    // chord meter (cave)
    const chord = $('chord');
    chord.hidden = sea || S.lv.harmony === 0;
    if (!chord.hidden) {
      const on = Math.min(8, chordNow);
      [...chordDots.children].forEach((d, i) => d.classList.toggle('on', i < on));
      setT('chordMult', '×' + (1 + 0.15 * S.lv.harmony * Math.max(0, Math.min(chordNow - 1, 10))).toFixed(1));
    }

    // heartstone
    const showHeart = !sea && (S.lumenTotal >= 1e4 || S.hearts > 0);
    setHid('heartBox', !showHeart);
    if (showHeart) {
      once('heartSeen');
      const cost = heartCost(), can = canKindle();
      const tick = ok => ok ? '✓' : '·';
      setT('heartCount', S.hearts ? `${S.hearts} kindled` : '');
      setH('heartText', `Needs <b>${tick(S.depth >= heartDepth())} depth ${heartDepth()}</b> (you're at ${S.depth}), <b>${tick(S.lumen >= cost)} ${fmt(cost)} lumen</b> (you have ${fmt(S.lumen)})${S.hearts ? ` and <b>${tick(S.sea.soundings >= heartSea())} ${heartSea()} soundings</b> of the sea (you have ${S.sea.soundings})` : ''}. ${S.hearts ? `The mountain feels <b>${omen().name.toLowerCase()}</b> this time. ${omen().text} ` : ''}Kindling it resets the whole cave: hum, depth, shards, fossils, strata, lumen and illuminations. You keep your horns${S.hearts ? ' and the sea' : ''}.${S.heartSeaLegacy ? ' Your already-met Sea milestone is preserved for this Heartstone; the next uses the new requirement.' : ''} Every Heartstone makes all hum and tide <b>×3</b> forever and brings an epic-or-better horn. It also unlocks <b>${nextOffset()[0]}</b>: ${nextOffset()[1]}.${S.hearts ? '' : ' The first one opens the Sunless Sea.'}`);
      heartBtn.classList.toggle('poor', !can);
      setT('heartLabel', can ? (holding ? 'Keep holding…' : 'Hold to kindle') : S.depth < heartDepth() ? `Reach depth ${heartDepth()} first` : S.sea.soundings < heartSea() ? `Sound the sea ${heartSea()} times first` : 'Not enough lumen');
    }

    // choir
    updateSong(); updateQuests();
    setH('choirInfo', `The cave above sings <b>${fmt(S.idleRate || 0)} hum/s</b> on its own, lifting all tide <b>×${fmtX(choirBonus())}</b>. Whichever world you aren't in keeps earning <b>${pct(quietEff())}</b> of its idle rate. Choir upgrades are never lost.`);

    renderCaveAutomation();
    shellUI.render();
    pearlUI.render();

    // horns
    setT('hornSlots', `${S.equipped.length} / ${hornSlots()}`);
    setT('hornCount', `${S.horns.length} / ${HORN_CAP}`);
    setT('hornTimer', S.hornsOn ? `Next horn turns up in ${mmss(Math.max(0, S.hornTimer) / tickRate())}.` : '');
    if (S.tab === 'horns') {
      if (hornsDirty) renderHorns();
      else if (hornSub === 'sounding') sndRender();
    }

    // prestige panel
    let need, prog, got, locked = false;
    if (sea) {
      need = soundAt(); const tideProg = Math.min(1, q.run / need); got = fathomGain();
      locked = q.cool > 0;
      prog = locked ? Math.min(tideProg, 1 - q.cool / Math.max(1, q.coolTotal)) : tideProg;
      setT('descTitle', 'Sound the depths');
      setH('descText', locked
        ? `The sea is still settling: <b>${mmss(q.cool / tickRate())}</b> before you can sound again. Faster Tick speeds it; 2, 5, 10 and 20 total soundings shorten it.${tideProg < 1 ? ` Ring <b>${fmt(need)}</b> tide to reach the depths.` : ''}`
        : tideProg < 1
        ? `Ring <b>${fmt(need)}</b> tide in this sea to sound deeper. You lose its bells, voices, oysters and pearl dust (your pearls stay), but gain <b class="fat">fathoms</b> for the Deep, tide ×1.6 per sounding, and a horn.`
        : `Sound now for <b class="fat">${fmt(got)} fathom${got > 1 ? 's' : ''}</b> and a horn, or keep ringing: fathoms grow more slowly the more you ring here.`);
      if (canSound()) once('canSound');
    } else {
      need = deepenAt(); const humProg = Math.min(1, S.run / need); got = fossilGain();
      locked = S.cool > 0;
      prog = locked ? Math.min(humProg, 1 - S.cool / descentLock()) : humProg;
      setT('descTitle', 'Descend');
      setH('descText', locked
        ? `The floor is still settling: <b>${mmss(S.cool)}</b> before you can descend again. Quests under Strata shorten this.${humProg < 1 ? ` Sing <b>${fmt(need)}</b> hum to break through.` : ''}`
        : humProg < 1
        ? `${S.rubble ? 'Rubble from the fall: this floor asks for half again as much. ' : ''}Sing <b>${fmt(need)}</b> hum in this cave to break through the floor. You lose its crystals, voices and shards, but carry down <b class="fos">fossils</b> for Strata, hum ×2 per depth, and maybe a horn.`
        : `Descend now for <b class="fos">${fmt(got)} fossil${got > 1 ? 's' : ''}</b>, or keep singing: fossils grow more slowly the more you sing here.`);
      if (prog >= 1) once('canDescend');
    }
    setHid('freshText', sea);
    if (!sea) setH('freshText', `Floor freshness <b>${Math.round(decayF * 100)}%</b>: hum and lumen fade toward ${Math.round(decayFloor() * 100)}% the longer you stay (about ${Math.round(decayTau() / 60)} min per fade). Descending starts a fresh floor.`);
    setHid('floorText', sea || (S.depth < 3 && !onSun()));
    if (!sea) setH('floorText', floorBlurb());
    setHid('goldSec', S.stats.sunveins < 1);
    setH('goldNote', onSun() ? `You are on a Sunvein. Gilt comes in while you stay (up to ${GILT_CAP} a floor, fading as the floor does), and the upgrades below can be bought now.` : `Gilt only comes while you stand on a Sunvein, and these upgrades can only be bought there. Each descent has a ${Math.round(sunChance() * 100)}% chance of one: 5%, plus 2% for every gilded horn you own, up to 15%.`);
    setHid('windBtn', sea || S.hearts < 3);
    $('windBtn').disabled = !windReady();
    $('windBtn').textContent = S.wind ? 'Second Wind used' : 'Second Wind · refresh the floor';
    $('descBar').style.width = (prog * 100).toFixed(1) + '%';
    setT('descPct', Math.floor(prog * 100) + '%');
    updateStrip(sea, prog, locked, got);
    const btn = $('descBtn');
    btn.classList.toggle('poor', prog < 1);
    if (!descArmed || Date.now() - descArmed > 3000) {
      descArmed = 0;
      const unit = sea ? 'fathom' : 'fossil';
      btn.textContent = locked ? `Settling · ${mmss(sea ? q.cool / tickRate() : S.cool)}` : prog < 1 ? (sea ? 'Sound the depths' : 'Descend') : `${sea ? 'Sound' : 'Descend'} · +${fmt(got)} ${unit}${got > 1 ? 's' : ''}`;
    }
    if (!resetArmed || Date.now() - resetArmed > 3000) { resetArmed = 0; if ($('resetBtn').textContent !== 'Forget everything') $('resetBtn').textContent = 'Forget everything'; }
    renderTip();
  }

  // =====================================================================
  // persistence
  // =====================================================================
  const serialize = () => serializeState(S);
  let noSave = false; // set while the page reloads into an imported save, so the old state doesn't overwrite it
  // On phones and tablets, a small dismissible note that the game is made for a computer. Remembered per device, outside the save.
  function initDeviceNote() {
    const KEY_N = KEY + '-devnote', note = $('mnote');
    let gone = false;
    try { gone = localStorage.getItem(KEY_N) === '1'; } catch (_) {}
    const small = window.matchMedia('(max-width: 820px), (pointer: coarse)');
    const show = () => { note.hidden = gone || !small.matches; };
    show();
    small.addEventListener('change', show);
    $('mnoteBtn').addEventListener('click', () => { gone = true; try { localStorage.setItem(KEY_N, '1'); } catch (_) {} show(); });
  }
  // The edge between the cave and the side panel can be dragged. The width is a per-device preference, kept outside the save.
  function initSplitter() {
    const app = document.querySelector('.app'), sp = $('splitter'), root = document.documentElement, DEF = 368, MIN = 300, KEY_W = KEY + '-ledger';
    const maxW = () => Math.max(MIN, Math.min(760, app.clientWidth - 48 - 360));
    let want = DEF, frame = 0, drag = false;
    try { want = +localStorage.getItem(KEY_W) || DEF; } catch (_) {}
    const show = () => {
      frame = 0;
      const w = Math.round(Math.max(MIN, Math.min(maxW(), want)));
      root.style.setProperty('--lw', w + 'px'); sp.setAttribute('aria-valuenow', String(w)); sp.setAttribute('aria-valuemax', String(maxW()));
    };
    const set = w => { want = w; if (!frame) frame = requestAnimationFrame(show); };
    const store = () => { try { localStorage.setItem(KEY_W, String(Math.round(want))); } catch (_) {} };
    show();
    window.addEventListener('resize', show);
    sp.addEventListener('pointerdown', e => { drag = true; sp.setPointerCapture(e.pointerId); sp.classList.add('drag'); document.body.classList.add('dragging'); e.preventDefault(); });
    sp.addEventListener('pointermove', e => { if (drag) set(app.getBoundingClientRect().right - 16 - e.clientX - 8); });
    const end = () => { if (!drag) return; drag = false; sp.classList.remove('drag'); document.body.classList.remove('dragging'); store(); };
    sp.addEventListener('pointerup', end); sp.addEventListener('pointercancel', end);
    sp.addEventListener('dblclick', () => { set(DEF); store(); });
    sp.addEventListener('keydown', e => {
      const cur = parseFloat(getComputedStyle(root).getPropertyValue('--lw')) || DEF;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); set(cur + (e.key === 'ArrowLeft' ? 24 : -24)); store(); }
      else if (e.key === 'Home') { e.preventDefault(); set(DEF); store(); }
    });
  }
  function save() { if (noSave) return; try { localStorage.setItem(KEY, JSON.stringify(serialize())); } catch (_) {} }
  // One backup slot: the save as it was before it was replaced (import, restore, forget, or a version update).
  const BACKUP = KEY + '-backup';
  function backupNow(raw) {
    try {
      const data = raw != null ? raw : localStorage.getItem(KEY);
      if (data) localStorage.setItem(BACKUP, JSON.stringify({ at: Date.now(), data }));
    } catch (_) {}
  }
  function readBackup() {
    try { const b = JSON.parse(localStorage.getItem(BACKUP) || 'null'); return b && typeof b.data === 'string' ? b : null; } catch (_) { return null; }
  }
  function encodeSave() { return 'GC1:' + btoa(unescape(encodeURIComponent(JSON.stringify(serialize())))); }
  function decodeSave(text) {
    try {
      const t = String(text).replace(/\s+/g, '');
      if (!t.startsWith('GC1:')) return null;
      const d = JSON.parse(decodeURIComponent(escape(atob(t.slice(4)))));
      return d && typeof d === 'object' && typeof d.hum === 'number' ? d : null;
    } catch (_) { return null; }
  }
  function replaceSaveAndReload(d) {
    save(); backupNow();
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (_) { return false; }
    noSave = true;
    try { sessionStorage.setItem('gc-fresh-import', '1'); } catch (_) {}
    location.reload();
    return true;
  }
  function load(data) {
    let d = data && typeof data.hum === 'number' ? data : null;
    if (!d) { try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) {} }
    if (!d || typeof d.hum !== 'number') return null;
    let imported = false;
    try { imported = sessionStorage.getItem('gc-fresh-import') === '1'; sessionStorage.removeItem('gc-fresh-import'); } catch (_) {}
    if (!imported && cmpVer(d.ver || '1.0.0', VERSION) < 0) backupNow(JSON.stringify(d));
    const restored = restoreState(d, VERSION, { WONDERS, PEARLOBJ, FLOORS, OMENS, TABS, GILT_CAP, AWAY_CAP });
    if (!restored) return null;
    S = restored.state;
    applyAutoEquip(S);
    return restored.away;
  }
  function grantAway(seconds) {
    if (seconds < 20) return;
    if (seconds >= 3600) S.stats.longAway++;
    const eff = offlineEff(), qe = quietEff(), q = S.sea, sea = S.world === 'sea';
    if (S.cool > 0) S.cool = Math.max(0, S.cool - seconds * eff * tickRate());
    advanceSeaTimer(S, seconds, tickRate(), eff);
    // The rate you left at was measured at your floor's freshness then; the fade carries on while you are away.
    const fadeK = freshAvg(S.age, S.age + seconds) / Math.max(1e-9, freshAt(S.age));
    S.age += seconds;
    const h = S.idleRate * seconds * eff * fadeK * (sea ? qe : 1);
    const l = sea ? 0 : S.lumenIdle * seconds * eff * fadeK;
    const t = q.unlocked ? q.idleRate * seconds * eff * (sea ? 1 : qe) : 0;
    if (!(h > 0 || l > 0 || t > 0)) return;
    S.hum += h; S.run += h; S.total += h;
    S.lumen += l; S.lumenTotal += l; S.stats.lumenLife += l;
    q.tide += t; q.run += t; q.total += t;
    const bits = [];
    if (h > 0) bits.push(`${fmt(h)} hum`);
    if (l > 0) bits.push(`${fmt(l)} lumen`);
    if (t > 0) bits.push(`${fmt(t)} tide`);
    const mins = Math.round(seconds / 60);
    if (seconds >= 300 && !sceneOpen) {
      awayOpen = true;
      $('awaySub').textContent = `You were away for ${fmtDur(seconds)}.`;
      $('awayRows').innerHTML = [['Hum', h], ['Lumen', l], ['Tide', t]].filter(r => r[1] > 0).map(r => `<div class="stat"><span>${r[0]}</span><b>+${fmt(r[1])}</b></div>`).join('');
      $('awayNote').textContent = `The world kept singing at ${Math.round(eff * 100)}% of its idle rate${seconds >= AWAY_CAP - 1 ? `, for up to ${AWAY_CAP / 3600} hours` : ''}.`;
      $('away').hidden = false; $('awayClose').focus();
    } else {
      whisper(`While you were away${mins >= 1 ? ` (${mins} min)` : ''}, the world sang ${bits.join(', ')} on its own.`);
    }
  }
  function closeAway() { awayOpen = false; $('away').hidden = true; maybeShowNews(); }
  $('awayClose').addEventListener('click', closeAway);
  $('away').addEventListener('click', e => { if (e.target === $('away')) closeAway(); });

  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); save(); }
    else if (hiddenAt) { grantAway(Math.min((Date.now() - hiddenAt) / 1000, AWAY_CAP)); hiddenAt = 0; last = performance.now(); }
  });
  window.addEventListener('pagehide', save);

  // =====================================================================
  // loop
  // =====================================================================
  let last = performance.now(), secT = 0, uiT = 0, saveT = 0, liteT = 0, storyT = 0;
  function fxLimits() { return S.fx === 'full' ? { p: MAX_P, r: MAX_R } : S.fx === 'calm' ? { p: 450, r: 80 } : { p: 1000, r: 160 }; }
  // Watches how long each frame's work takes and trims the echo/ripple budgets before the game can stutter.
  function govern() {
    const lim = fxLimits();
    if (!simulation && frameMs > 10) { capP = Math.max(150, capP * 0.8); capR = Math.max(40, capR * 0.8); }
    else if (simulation || frameMs < 5) { capP = Math.min(lim.p, capP * 1.08 + 5); capR = Math.min(lim.r, capR * 1.08 + 2); }
    capP = Math.min(capP, lim.p); capR = Math.min(capR, lim.r);
    // Anything over budget folds its voice into a survivor, so no hum is lost.
    while (P.length > capP * 1.1) {
      const p = P.pop();
      if (P.length) { const q = P[(Math.random() * P.length) | 0]; q.w += (p.w * p.e) / Math.max(q.e, 0.15); }
    }
    while (ripples.length > capR * 1.1) {
      const rp = ripples.pop();
      if (ripples.length) { const q = ripples[(Math.random() * ripples.length) | 0]; q.w += (rp.w * rp.e) / Math.max(q.e, 0.2); }
    }
  }
  function frame(now) {
    const t0 = performance.now();
    // A long frame no longer buys more physics steps; the world just runs a touch slower until it catches up.
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; T += dt;
    noteBudget = Math.min(8, noteBudget + dt * (lite ? 10 : 20));
    if (W > 0) {
      if (S.world === 'sea') {
        stepSea(dt); updateSeaVoices(dt); updateSeaFx(dt); updateSharedFx(dt);
        drawSea();
      } else {
        buildGrid();
        const sub = Math.min(3, Math.max(1, Math.ceil((dt * V) / 5))), h = dt / sub;
        for (let i = 0; i < sub; i++) stepParticles(h);
        updateCaveVoices(dt); updateDrops(dt); updateCaveFx(dt); updateSharedFx(dt);
        drawCave();
      }
    }
    liteT += dt; if (liteT > 0.25) { liteT = 0; updateLite(); govern(); }
    autoT += dt; if (autoT >= 0.5) { autoT = 0; if (!cinematic) runAutomation(); }
    if (S.cool > 0) S.cool = Math.max(0, S.cool - dt * tickRate());
    advanceSeaTimer(S, dt, tickRate());
    tickPearls(S, dt);
    shellUI.tick(dt);
    storyT += dt; if (storyT >= 0.5) { storyT = 0; checkStory(false); checkQuests(false); }
    if (holding) {
      holdT += dt;
      if (holdT >= 3) { holding = false; holdT = 0; kindle(); }
    } else holdT = Math.max(0, holdT - dt * 3);
    const fill = (holdT / 3 * 100).toFixed(1) + '%';
    if (heartFill.style.width !== fill) heartFill.style.width = fill;
    if (onSun() && S.world === 'cave' && !cinematic && S.giltFloor < GILT_CAP) {
      const g = Math.min(GILT_CAP - S.giltFloor, GILT_RATE * dt * decayF);
      S.gilt += g; S.giltFloor += g; S.stats.giltLife += g;
    }
    if (S.hornsOn && !cinematic) {
      S.hornTimer -= dt * tickRate();
      if (S.hornTimer <= 0) {
        if (S.hornAuto || hornsWaiting() < HORN_QUEUE_CAP) { S.hornTimer = hornInterval(); addHornCall(); }
        else S.hornTimer = 0; // the calls are waiting for you; the clock holds
      }
    }
    if (!cinematic) S.age += dt;
    decayF = freshAt(S.age);
    secT += dt;
    if (secT >= 1) {
      secT -= 1;
      S.stats.playSec = (S.stats.playSec || 0) + 1;
      hist.push(secAcc); ihist.push(idleAcc); lhist.push(lumAcc); secAcc = idleAcc = lumAcc = 0;
      if (hist.length > 5) hist.shift();
      if (ihist.length > 12) ihist.shift();
      if (lhist.length > 8) lhist.shift();
      const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
      const q = S.sea;
      if (S.world === 'sea') { q.rate = avg(hist); q.idleRate = avg(ihist); }
      else { S.rate = avg(hist); S.idleRate = avg(ihist); lumenRate = avg(lhist); S.lumenIdle = lumenRate; }
      // the other world sings quietly
      if (q.unlocked && !cinematic) {
        const qe = quietEff();
        if (S.world === 'sea') { const g = (S.idleRate || 0) * qe; S.hum += g; S.run += g; S.total += g; }
        else { const g = (q.idleRate || 0) * qe; q.tide += g; q.run += g; q.total += g; }
      }
      refreshSK(); // the choir bonus follows the cave's song
    }
    uiT += dt; if (uiT > 0.12) { uiT = 0; updateUI(); }
    saveT += dt; if (saveT > 5) { saveT = 0; save(); }
    frameMs = frameMs * 0.9 + (performance.now() - t0) * 0.1;
    requestAnimationFrame(frame);
  }
  const heartFill = $('heartFill');

  function world_reset_hist() { hist = []; ihist = []; lhist = []; }
  $('wCave').addEventListener('click', world_reset_hist);
  $('wSea').addEventListener('click', world_reset_hist);

  function start(data) {
    const away = load(data);
    const returning = away != null;
    refreshAll(); buildShop();
    applyTheme(); applyTs();
    setMuted(S.muted);
    new ResizeObserver(resize).observe($('stage'));
    initSplitter();
    initDeviceNote();
    afterStateChange();
    if (away != null) grantAway(away);
    // Pages and feats earned before the Chronicle existed are remembered quietly, then the story begins.
    const needPrologue = !S.lore.prologue;
    const caught = checkStory(true);
    checkQuests(true);
    if (needPrologue && caught.lore) caught.lore--;
    updateUI();
    window.claude?.hot?.snapshot?.(() => serialize());
    requestAnimationFrame(t => { last = t; frame(t); });
    if (returning && !needPrologue) maybeShowNews();
    if (needPrologue) {
      S.seen.chron = 0;
      playScene('prologue', () => {
        maybeShowNews();
        if (returning && (caught.lore || caught.feats)) toast('Chronicle', `The Chronicle remembers ${caught.lore} page${caught.lore === 1 ? '' : 's'} and ${caught.feats} feat${caught.feats === 1 ? '' : 's'} from before.`, 'lore');
      });
    }
  }
  if (simulation) simulation.api = {
    get S() { return S; }, set S(v) { S = v; },
    frame, tap, randomInside, runAutomation, binRect, drawBins, get drag() { return drag; }, fuse, endScene, setWorld, refreshAll, syncVoices, afterStateChange, save,
    descend, sound, canSound, seaLock, tickRate, grantAway, heartSea, FINALE_SOUNDINGS, FINALE_HEARTS, kindle, floorMod, sunChance, onSun, goldHorns, canKindle, answerSong, songReady, songReqs, SONG_COST,
    shellTick: dt => shellUI.tick(dt),
    oysterOpened, bestPearls: () => bestPearls(S), equipPearl: id => equipPearlItem(S, id), grindPearl: id => grindPearlItem(S, id),
    finishShell: (id, quality) => finishShell(S, id, quality), equipShell: id => equipShell(S, id),
    fossilGain, fathomGain, deepenAt, soundAt, heartCost, hornSlots, hornBoost, computeHB, gainHorn,
    maxCrystals, bellCap, have, TIERS, BELLS, RARITY, FEATS, heartDepth,
    serialize, load, updateUI, setTab, rollPlan, buildHorn, startSounding, finishSounding, sndHit, renderSounding, renderInventory, renderColl, setHornSub,
    primordialSlots: () => primordialSlots(S), rarityOdds: () => rarityOdds(S), traitValue, discoveryIvory: () => discoveryIvory(S), activeTraits: () => activeTraits(S),
    get HB() { return HB; }, get sndRound() { return sndRound; },
    get sceneOpen() { return sceneOpen; }, get cinematic() { return cinematic; }, get capP() { return capP; },
    get chordNow() { return chordNow; },
  };

  window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
