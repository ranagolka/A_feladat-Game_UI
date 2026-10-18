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

test('Akadálymentesség: alapból minden Ki és Nyomvatartással, default/clean', () => {
  const s = new SettingsStore();
  assert.deepEqual(
    ['readable_font', 'invert_speach_bubbles', 'run_mode', 'jump_assist', 'mono_audio'].map((k) => s.get(`accessibility.${k}`)),
    ['off', 'off', 'hold', 'off', 'off'],
  );
  assert.equal(s.categoryState('accessibility'), 'default');
});

test('kétértékű kapcsoló körbeforog: nincs határ, mindkét irány vált', () => {
  const s = new SettingsStore();
  assert.equal(s.atBound('accessibility.jump_assist', -1), false);
  assert.equal(s.atBound('accessibility.jump_assist', 1), false);
  assert.equal(s.step('accessibility.jump_assist', 1), true);
  assert.equal(s.get('accessibility.jump_assist'), 'on');
  assert.equal(s.step('accessibility.jump_assist', 1), true);
  assert.equal(s.get('accessibility.jump_assist'), 'off');
  assert.equal(s.step('accessibility.run_mode', -1), true);
  assert.equal(s.get('accessibility.run_mode'), 'toggle');
  assert.equal(s.categoryState('accessibility'), 'modified_custom');
  assert.equal(s.isCategoryDirty('audio'), false); // a kategóriák draftja független
});

test('grafika: a fényerő középről indul, ±50-nél megáll; a rázkódás Teljesről csak lefelé léptethető', () => {
  const s = new SettingsStore();
  assert.equal(s.get('graphics.brightness'), 0);
  assert.equal(s.categoryState('graphics'), 'default');
  for (let i = 0; i < 5; i++) assert.equal(s.step('graphics.brightness', -1), true);
  assert.equal(s.get('graphics.brightness'), -50);
  assert.equal(s.step('graphics.brightness', -1), false);
  assert.equal(s.atBound('graphics.brightness', -1), true);
  assert.equal(s.get('graphics.screen_shake'), 'full');
  assert.equal(s.atBound('graphics.screen_shake', 1), true);
  assert.equal(s.step('graphics.screen_shake', -1), true);
  assert.equal(s.get('graphics.screen_shake'), 'reduced');
  assert.equal(s.categoryState('graphics'), 'modified_custom');
  assert.equal(s.canReset('graphics'), true);
  s.resetCategory('graphics', 'draft');
  assert.equal(s.get('graphics.brightness'), 0);
  assert.equal(s.categoryState('graphics'), 'default');
});

console.log(`\n${passed} teszt átment.`);
