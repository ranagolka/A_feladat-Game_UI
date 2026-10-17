// DEV-001 — Típusos settings schema. Minden érték egy forrásból renderelődik.
// Forrás: „A feladat – Settings UI" spec v1.0, 6. fejezet.

export type CategoryId = 'game' | 'graphics' | 'audio' | 'controller' | 'accessibility';

export const CATEGORIES: CategoryId[] = ['game', 'graphics', 'audio', 'controller', 'accessibility'];

export type Value = number | string;

interface BaseSetting {
  id: string;
  category: CategoryId;
  labelKey: string;
  descKey?: string;
  disabled?: boolean;
}

export interface SegmentedSetting extends BaseSetting {
  kind: 'segmented';
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface SelectorSetting extends BaseSetting {
  kind: 'selector';
  options: { value: string; labelKey: string }[];
  default: string;
}

export type SettingDef = SegmentedSetting | SelectorSetting;

export const SETTINGS: SettingDef[] = [
  { kind: 'segmented', id: 'audio.master', category: 'audio', labelKey: 'audio/options/master_volume', min: 0, max: 100, step: 10, default: 100 },
  { kind: 'segmented', id: 'audio.music', category: 'audio', labelKey: 'audio/options/music', min: 0, max: 100, step: 10, default: 70 },
  { kind: 'segmented', id: 'audio.sfx', category: 'audio', labelKey: 'audio/options/sound_effects', min: 0, max: 100, step: 10, default: 100 },
  {
    kind: 'selector', id: 'audio.profile', category: 'audio', labelKey: 'audio/options/speaker_type', default: 'tv',
    // A Figma „Language / Settings" tokenjei szerint három érték, ebben a sorrendben.
    options: [
      { value: 'headphones', labelKey: 'audio/speaker_type/option_values/value_1' },
      { value: 'tv', labelKey: 'audio/speaker_type/option_values/value_2' },
      { value: 'sound_system', labelKey: 'audio/speaker_type/option_values/value_3' },
    ],
  },
];

export function settingsOf(cat: CategoryId, defs: SettingDef[] = SETTINGS): SettingDef[] {
  return defs.filter((d) => d.category === cat);
}

export function defaultsOf(defs: SettingDef[] = SETTINGS): Record<string, Value> {
  return Object.fromEntries(defs.map((d) => [d.id, d.default]));
}
