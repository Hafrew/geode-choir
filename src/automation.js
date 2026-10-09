const CAVE_AUTOMATION_COST = 100000;
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
const createCaveAutomation = () => ({ unlocked: false,
  categories: Object.fromEntries(Object.keys(CAVE_CATEGORIES).map(k => [k, false])),
  reserves: Object.fromEntries(Object.keys(CAVE_RESERVES).map(k => [k, 0])),
});
function normalizeCaveAutomation(S) {
  const old = S.caveAutomation || {}, settings = createCaveAutomation();
  settings.unlocked = old.unlocked === true;
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
    if (!settings.categories[key] || !categoryOpen(category)) continue;
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
export { CAVE_AUTOMATION_COST, CAVE_CATEGORIES, CAVE_RESERVES, createCaveAutomation, normalizeCaveAutomation, runCaveShopping };
