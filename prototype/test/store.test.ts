// A spec 5. táblájának és 5.1-ének tesztje. Futtatás: npm test
import assert from 'node:assert/strict';
import { SettingsStore } from '../src/store';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✔ ${name}`);
}

test('alapállapot: 100 / 70 / 100, TV, default/clean — Apply és Reset rejtett', () => {
  const s = new SettingsStore();
  assert.deepEqual([s.get('audio.master'), s.get('audio.music'), s.get('audio.sfx'), s.get('audio.profile')], [100, 70, 100, 'tv']);
  assert.equal(s.categoryState('audio'), 'default');
  assert.equal(s.canApply(), false);
  assert.equal(s.canReset('audio'), false);
});

test('határon nem lép túl, és ekkor nincs változás (nincs UI-SND-003)', () => {
  const s = new SettingsStore();
  assert.equal(s.step('audio.master', 1), false);
  assert.equal(s.get('audio.master'), 100);
  assert.equal(s.atBound('audio.master', 1), true);
  // hangszóró-típus: Headphones / TV speakers / Sound system — a TV a középső, mindkét irányba léptethető
  assert.equal(s.step('audio.profile', -1), true);
  assert.equal(s.get('audio.profile'), 'headphones');
  assert.equal(s.step('audio.profile', -1), false);
  assert.equal(s.atBound('audio.profile', -1), true);
  s.discard();
});

test('10-es lépés, a draft dirty lesz: modified_custom — Apply és Reset látható', () => {
  const s = new SettingsStore();
  assert.equal(s.step('audio.music', 1), true);
  assert.equal(s.get('audio.music'), 80);
  assert.equal(s.categoryState('audio'), 'modified_custom');
  assert.equal(s.canApply(), true);
  assert.equal(s.canReset('audio'), true);
});

test('Apply után saved_custom: Apply rejtett, Reset látható', () => {
  const s = new SettingsStore();
  s.step('audio.music', 1);
  s.apply();
  assert.equal(s.categoryState('audio'), 'saved_custom');
  assert.equal(s.canApply(), false);
  assert.equal(s.canReset('audio'), true);
});

test('Reset draft-policyvel: modified_default — Apply látható, Reset rejtett', () => {
  const s = new SettingsStore();
  s.step('audio.music', 1);
  s.apply();
  s.resetCategory('audio', 'draft');
  assert.equal(s.categoryState('audio'), 'modified_default');
  assert.equal(s.canApply(), true);
  assert.equal(s.canReset('audio'), false);
  assert.equal(s.saved['audio.music'], 80);
});

test('Reset immediate-policyvel: rögtön default/clean', () => {
  const s = new SettingsStore();
  s.step('audio.music', 1);
  s.apply();
  s.resetCategory('audio', 'immediate');
  assert.equal(s.categoryState('audio'), 'default');
  assert.equal(s.canApply(), false);
});

test('Discard: a draft visszaáll a saved értékre', () => {
  const s = new SettingsStore();
  s.step('audio.sfx', -1);
  s.discard();
  assert.equal(s.get('audio.sfx'), 100);
  assert.equal(s.isDirty(), false);
});

test('ha a draft visszaér a saved értékre, a dirty magától megszűnik', () => {
  const s = new SettingsStore();
  s.step('audio.music', 1);
  s.step('audio.music', -1);
  assert.equal(s.isDirty(), false);
});

console.log(`\n${passed} teszt átment.`);
