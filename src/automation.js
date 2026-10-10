const CAVE_AUTOMATION_COST = 100000;
const AUTOMATION_STAGES = [
  { name: 'Patient Choir', hearts: 2, cost: 100000, categories: ['voices', 'tuning', 'crystals'] },
  { name: 'Second Verse', hearts: 2, cost: 3000000, categories: ['wonders', 'attunement'] },
  { name: 'Deep Verse', hearts: 3, cost: 15000000, categories: ['strata', 'glow'] },
  { name: 'Final Verse', hearts: 4, cost: 25000000, categories: ['horns', 'gold'] },
];
const automationStage = S => S.caveAutomation.stages || (S.caveAutomation.unlocked ? 4 : 0);
const categoryUnlocked = (S, key) => AUTOMATION_STAGES.slice(0, automationStage(S)).some(stage => stage.categories.includes(key));
const shoppingSlots = S => S.caveAutomation.unlocked ? 1 + (S.hearts >= 3 ? 1 : 0) + (S.hearts >= 4 ? 1 : 0) : 0;
const shoppingRarity = h => h && h.r < 5 ? h.r + (h.gold ? 1 : 0) : -1;
const shoppingEligible = h => shoppingRarity(h) >= 2;
function normalizeShoppingRack(S) {
  const worn = [...S.equipped, ...(S.primordialEquipped || [])];
  S.caveAutomation.rack = [...new Set(S.caveAutomation.rack || [])]
    .filter(id => Number.isSafeInteger(id) && !worn.includes(id) && S.horns.some(h => h.id === id && shoppingEligible(h)))
    .slice(0, shoppingSlots(S));
}
function slotShoppingHorn(S, id) {
  const rack = S.caveAutomation.rack, at = rack.indexOf(id);
  if (at >= 0) { rack.splice(at, 1); return true; }
  const horn = S.horns.find(h => h.id === id);
  if (!shoppingEligible(horn) || [...S.equipped, ...S.primordialEquipped].includes(id) || rack.length >= shoppingSlots(S)) return false;
  rack.push(id); return true;
}
function shoppingInterval(S) {
  let seconds = .5;
  for (const id of S.caveAutomation.rack) {
    const h = S.horns.find(h => h.id === id), r = shoppingRarity(h);
    if (r >= 2) seconds *= r >= 4 ? .65 : r === 3 ? .8 : .9;
  }
  return Math.max(.1, seconds);
}
function buyAutomationStage(S, index) {
  const stage = AUTOMATION_STAGES[index];
  if (!stage || index !== automationStage(S) || S.hearts < stage.hearts || S.sea.fathoms < stage.cost) return false;
  S.sea.fathoms -= stage.cost; S.caveAutomation.stages = index + 1; S.caveAutomation.unlocked = true;
  return true;
}
const CAVE_CATEGORIES = {
  voices: { name: 'Voices', parent: 'shopVoices', tab: 'cave' },
  tuning: { name: 'Tuning', parent: 'shopTuning', tab: 'cave' },
  crystals: { name: 'Crystals', parent: 'shopCrystals', tab: 'cave' },
  wonders: { name: 'Wonders', parent: 'shopWonders', tab: 'wonders' },
  attunement: { name: 'Attunement', parent: 'shopAttune', tab: 'wonders' },
  strata: { name: 'Strata', parent: 'shopStrata', tab: 'strata' },
  glow: { name: 'Illuminations', parent: 'shopGlow', tab: 'glow' },
  horns: { name: 'Horn upgrades', parent: 'shopHorns', tab: 'horns' },
  gold: { name: 'Sunvein upgrades', parent: 'shopGold', tab: 'strata' },
};
const CAVE_RESERVES = { hum: 'Hum', shard: 'Shards', fossil: 'Fossils', lumen: 'Lumen', ivory: 'Ivory', gilt: 'Gilt' };
const createCaveAutomation = () => ({ unlocked: false, stages: 0, rack: [],
  categories: Object.fromEntries(Object.keys(CAVE_CATEGORIES).map(k => [k, false])),
  reserves: Object.fromEntries(Object.keys(CAVE_RESERVES).map(k => [k, 0])),
});
function normalizeCaveAutomation(S) {
  const old = S.caveAutomation || {}, settings = createCaveAutomation();
  settings.unlocked = old.unlocked === true;
  settings.stages = settings.unlocked ? (Number.isInteger(old.stages) && old.stages > 0 ? Math.min(4, old.stages) : 4) : 0;
  settings.rack = Array.isArray(old.rack) ? old.rack.filter(Number.isSafeInteger).slice(0, 3) : [];
  for (const k of Object.keys(settings.categories)) settings.categories[k] = old.categories?.[k] === true;
  for (const k of Object.keys(settings.reserves)) {
    const value = old.reserves?.[k];
    settings.reserves[k] = Number.isFinite(value) ? Math.max(0, value) : 0;
  }
  S.caveAutomation = settings;
}
// Use the same shop rules as manual purchases, including unlocks, maxima, and placement.
// One purchase per enabled category per tick keeps work bounded and gives every category a turn.
function runCaveShopping(S, items, have, afterBuy, categoryOpen = () => true) {
  const settings = S.caveAutomation;
  if (S.world !== 'cave' || !settings.unlocked) return 0;
  let bought = 0;
  for (const [key, category] of Object.entries(CAVE_CATEGORIES)) {
    if (!categoryUnlocked(S, key) || !settings.categories[key] || !categoryOpen(category)) continue;
    const choices = [];
    for (const item of items) {
      if (item.parent !== category.parent || item.auto === false || item.show && !item.show()
        || item.state && item.state() || item.blocked && item.blocked()) continue;
      const unit = typeof item.unit === 'function' ? item.unit() : item.unit;
      const cost = item.cost();
      if (cost == null || !Number.isFinite(cost) || cost < 0 || !(unit in settings.reserves)
        || have(unit) - cost < settings.reserves[unit]) continue;
      choices.push({ item, cost });
    }
    choices.sort((a, b) => a.cost - b.cost);
    for (const { item } of choices) if (item.buy()) {
      bought++; afterBuy(); break;
    }
  }
  return bought;
}
export { AUTOMATION_STAGES, automationStage, categoryUnlocked, shoppingSlots, shoppingEligible, shoppingInterval, normalizeShoppingRack, slotShoppingHorn, buyAutomationStage, CAVE_AUTOMATION_COST, CAVE_CATEGORIES, CAVE_RESERVES, createCaveAutomation, normalizeCaveAutomation, runCaveShopping };
