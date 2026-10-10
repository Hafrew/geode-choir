import assert from 'node:assert/strict';
import test from 'node:test';
import { createState } from '../src/state.js';
import { AUTOMATION_STAGES, buyAutomationStage, categoryUnlocked, shoppingSlots, shoppingInterval, slotShoppingHorn, normalizeShoppingRack, normalizeCaveAutomation } from '../src/automation.js';
import { hornBonuses, bestLoadout, acquireHorn } from '../src/horns.js';
const fresh = () => createState('1.10.7');
const horn = (id, r, gold = false) => ({ id, r, gold, name: 'Test Horn', seed: id, lines: [{ stat: 'hum', kind: 'pct', v: 100 }] });
test('verses require sequential purchases, their Heartstone gate, and exact funds', () => {
  const S = fresh(); S.sea.fathoms = 1e9;
  assert.equal(buyAutomationStage(S, 0), false); S.hearts = 2;
  assert(buyAutomationStage(S, 0)); assert(categoryUnlocked(S, 'voices')); assert.equal(categoryUnlocked(S, 'wonders'), false);
  assert.equal(buyAutomationStage(S, 2), false); assert(buyAutomationStage(S, 1)); assert(categoryUnlocked(S, 'wonders'));
  assert.equal(buyAutomationStage(S, 2), false); S.hearts = 3; S.sea.fathoms = AUTOMATION_STAGES[2].cost - 1;
  assert.equal(buyAutomationStage(S, 2), false); S.sea.fathoms++; assert(buyAutomationStage(S, 2));
  S.hearts = 4; S.sea.fathoms = AUTOMATION_STAGES[3].cost; assert(buyAutomationStage(S, 3));
  assert.equal(S.sea.fathoms, 0); assert(categoryUnlocked(S, 'horns')); assert.equal(buyAutomationStage(S, 3), false);
});
test('old paid Choir owners retain all categories without a second charge', () => {
  const S = fresh(); S.caveAutomation = { unlocked: true, categories: { horns: true } };
  normalizeCaveAutomation(S); assert.equal(S.caveAutomation.stages, 4); assert(categoryUnlocked(S, 'gold'));
  assert.equal(S.caveAutomation.categories.horns, true); assert.equal(buyAutomationStage(S, 1), false);
});
test('rack slots, rarity factors, gilding and exclusion from worn stats', () => {
  const S = fresh(); S.hearts = 2; S.sea.fathoms = 100000; buyAutomationStage(S, 0);
  S.horns = [horn(1, 2), horn(2, 3), horn(3, 4), horn(4, 1, true), horn(5, 5)];
  assert.equal(shoppingSlots(S), 1); assert(slotShoppingHorn(S, 1)); assert.equal(slotShoppingHorn(S, 2), false);
  assert.equal(shoppingInterval(S), .45); assert.equal(hornBonuses(S).hum, 1);
  assert.equal(bestLoadout(S).equipped.includes(1), false);
  S.hearts = 4; assert(slotShoppingHorn(S, 2)); assert(slotShoppingHorn(S, 3));
  assert(Math.abs(shoppingInterval(S) - .5 * .9 * .8 * .65) < 1e-12);
  assert(slotShoppingHorn(S, 1)); assert(slotShoppingHorn(S, 4)); assert.equal(slotShoppingHorn(S, 5), false);
  S.caveAutomation.rack = [3, 3, 99, 5, 4]; S.equipped = [3]; normalizeShoppingRack(S);
  assert.deepEqual(S.caveAutomation.rack, [4]);
});
test('full-inventory salvage protects shopping horns while auto-equip excludes them', () => {
  const S = fresh(); S.hearts = 4; S.caveAutomation.unlocked = true; S.caveAutomation.stages = 4;
  S.horns = Array.from({ length: 300 }, (_, i) => horn(i + 1, i === 0 ? 2 : 0)); S.caveAutomation.rack = [1];
  S.hornInventory.autoEquip = true; acquireHorn(S, horn(301, 4));
  assert(S.horns.some(h => h.id === 1)); assert.equal(S.equipped.includes(1), false);
});
