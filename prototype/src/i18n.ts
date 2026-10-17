// DEV-008 — Kulcsalapú EN/HU szövegkészlet. Az alapnyelv a magyar.
// FORRÁS: a Figma „Language / Settings" és „Language / Start" változógyűjteménye (English / Hungarian mód) — a kulcsok a tokenek nevei.
// Ami ott nincs (Reset modal, prototípus-segédszövegek), az a spec v1.0-ból vagy a prototípusból jön, és jelölve van.

export type Lang = 'hu' | 'en';

const SHY = '­'; // lágy kötőjel: a hosszú magyar fülnév törhet, vágás nélkül

const STRINGS: Record<string, Record<Lang, string>> = {
  // --- Figma: Language / Settings ---
  category_game: { en: 'Game', hu: 'Játék' },
  category_graphics: { en: 'Graphics', hu: 'Grafika' },
  category_audio: { en: 'Audio', hu: 'Hang' },
  category_controller: { en: 'Controller', hu: 'Kontroller' },
  category_accessibility: { en: 'Accessibility', hu: `Akadály${SHY}mentesség` },

  'audio/options/master_volume': { en: 'Master volume', hu: 'Hangerő' },
  'audio/options/music': { en: 'Music', hu: 'Zene' },
  'audio/options/sound_effects': { en: 'Sound effects', hu: 'Hanghatások' },
  'audio/options/speaker_type': { en: 'Speaker type', hu: 'Hangszóró típusa' },
  'audio/speaker_type/option_values/value_1': { en: 'Headphones', hu: 'Fejhallgató' },
  'audio/speaker_type/option_values/value_2': { en: 'TV speakers', hu: 'TV hangszóró' },
  'audio/speaker_type/option_values/value_3': { en: 'Sound system', hu: 'Hangrendszer' },

  'actions/apply': { en: 'Apply', hu: 'Mentés' },
  'actions/reset': { en: 'Reset to default', hu: 'Alapértelmezett beállítások' },
  'actions/back': { en: 'Back', hu: 'Vissza' },

  'unsaved_changes/title': { en: 'Unsaved changes', hu: 'Nem mentett beállítások' },
  'unsaved_changes/description': {
    en: 'Your changes haven’t been saved. What would you like to do?',
    hu: 'A módosításaid még nincsenek mentve. Mit szeretnél tenni?',
  },
  'unsaved_changes/actions/primary': { en: 'Apply', hu: 'Mentés' },
  'unsaved_changes/actions/secondary': { en: 'Discard', hu: 'Elvetés' },
  'unsaved_changes/actions/cancel': { en: 'Cancel', hu: 'Mégsem' },

  // --- Figma: Language / Start (a mainMenu komponens label tulajdonságára kötve) ---
  // ⚠ a Figma HU értéke elírt („Folyatatás") — itt javítva; a tokent a Figmában is javítani kell
  main_continue: { en: 'Continue', hu: 'Folytatás' },
  main_new: { en: 'New game', hu: 'Új játék' },
  main_settings: { en: 'Settings', hu: 'Beállítások' },

  // --- spec v1.0, 7. fejezet (a Figmában még nincs token) ---
  'reset_defaults/title': { en: 'Reset to defaults', hu: 'Alapértékek visszaállítása' },
  'reset_defaults/description': {
    en: 'Reset all settings in this category to their default values?',
    hu: 'Visszaállítod a kategória összes beállítását az alapértékére?',
  },
  'reset_defaults/actions/primary': { en: 'Reset', hu: 'Visszaállítás' },

  // --- csak a prototípushoz ---
  'proto/hint/select': { en: 'Select', hu: 'Kiválasztás' },
  'proto/placeholder/title': { en: 'Not part of this slice', hu: 'Nem része ennek a szeletnek' },
  'proto/placeholder/body': {
    en: 'The prototype implements the Audio tab first. LB / RB still switches category.',
    hu: 'A prototípus először a Hang fület valósítja meg. Az LB / RB itt is kategóriát vált.',
  },
  'proto/a11y/percent': { en: '{v} percent', hu: '{v} százalék' },
};

export function t(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  const entry = STRINGS[key];
  if (!entry) return `⟦${key}⟧`;
  let s = entry[lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
