import { createCaveAutomation } from './automation.js';
import { freshShells } from './seashells.js';
const freshCave = () => ({
  hum: 0, run: 0, depth: 0, age: 0, wind: 0,
  crystals: [{ t: 0, x: 0, y: -0.12 }], bought: [0, 0, 0, 0],
  lv: { lungs: 0, drips: 0, bats: 0, resonance: 0, polish: 0, harmony: 0, chisel: 0 },
  shards: 0, attune: [0, 0, 0, 0], wonders: [], wBought: { prism: 0, lodestone: 0, gong: 0 },
  fossils: 0, fossilsTotal: 0,
  strata: { tick: 0, old: 0, lungs: 0, water: 0, seed: 0, wide: 0, fault: 0, record: 0, nest: 0, worm: 0 },
  lumen: 0, lumenTotal: 0,
  illum: { firefly: 0, lantern: 0, silk: 0, autofuse: 0, autobuy: 0, autodescend: 0, carry: 0 },
  toggles: { autofuse: 1, autobuy: 1, autodescend: 1, sinkMult: 2 },
  idleRate: 0, lumenIdle: 0, rate: 0,
});
const freshSeaRun = () => ({
  tide: 0, run: 0,
  bells: [{ bt: 0, x: 0, y: -0.1 }], bought: [0, 0, 0, 0],
  lv: { skips: 0, rain: 0, fish: 0, light: 0, still: 0, bronze: 0, interf: 0, line: 0 },
  pearls: 0, tune: [0, 0, 0, 0], oysters: [], oBought: 0, objs: [], pBought: { breakwater: 0, raft: 0, whirlpool: 0 },
});
const freshSea = () => ({
  ...freshSeaRun(), unlocked: false, soundings: 0, fathoms: 0, fathomsTotal: 0,
  cool: 0, coolTotal: 0,
  deep: { current: 0, rain: 0, buoys: 0, beds: 0, record: 0, light: 0 },
  choir: { open: 0, listen: 0 },
  total: 0, idleRate: 0, rate: 0, throws: 0,
});
const createState = version => ({
  ...freshCave(), total: 0, world: 'cave', hearts: 0,
  floor: 'still', gilt: 0, giltFloor: 0, goldUp: { vein: 0, breath: 0 },
  horns: [], coll: {}, hornQueue: 0, hornPlan: null, hornAuto: false, equipped: [], hornPity: 0, hornSeq: 0, hornBuys: 0, hornsOn: false, hornTimer: 360, ivory: 0,
  hornUp: { rack: 0, ear: 0, whet: 0, branch: 0, ivory: 0, rarity: 0, firstVoice: 0, firstRack: 0 },
  primordialEquipped: [],
  hornInventory: { autoEquip: false, focus: 'balanced', salvage: [false, false, false, false, false, false], gilded: false },
  caveAutomation: createCaveAutomation(),
  shells: freshShells(),
  heartSeaLegacy: null,
  sea: freshSea(), seen: {}, muted: false, fx: 'auto', theme: 'dark', ts: 1, saved: Date.now(), shouts: 0, tab: 'cave',
  lore: {}, feats: {}, stats: freshStats(),
  ver: version, seenVer: version, refund: null, numfmt: 'short', finale: 0, omen: 'steady', rubble: 0, cool: 0, quests: {},
});
function freshStats() {
  return { fuses: 0, maxChord: 0, maxDepth: 0, shards: 0, booms: 0, crossings: 0, pearls: 0, hornsFound: 0, bestHorn: -1, longAway: 0, playSec: 0, shafts: 0, rockfalls: 0, veins: 0, descents: 0, sunveins: 0, giltLife: 0,
    sunDry: 0, fossilsLife: 0, lumenLife: 0, ivoryLife: 0, bestRate: 0, bestTide: 0, bestLumenRate: 0, bestHaul: 0, bestFathomHaul: 0 };
}

export { freshCave, freshSeaRun, freshSea, freshStats, createState };
