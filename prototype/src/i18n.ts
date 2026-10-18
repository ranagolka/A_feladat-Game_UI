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

  'graphics/brightness/label': { en: 'Brightness', hu: 'Fényerő' },
  'graphics/screen_shake/label': { en: 'Screen shake', hu: 'Képernyőrázkódás' },
  'graphics/screen_shake/value_1': { en: 'Off', hu: 'Kikapcsolva' },
  'graphics/screen_shake/value_2': { en: 'Reduced', hu: 'Csökkentett' },
  'graphics/screen_shake/value_3': { en: 'Full', hu: 'Teljes' },

  // ⚠ a Figma HU értéke elírt („Egyszerűsitett") — itt javítva; a tokent a Figmában is javítani kell
  'accessibility/readable_font/label': { en: 'Simplified font', hu: 'Egyszerűsített betűtípus' },
  'accessibility/readable_font/description': {
    en: 'Uses a larger, easier-to-read font throughout the game.',
    hu: 'Nagyobb, könnyebben olvasható betűtípust használ a játékban.',
  },
  'accessibility/readable_font/value_1': { en: 'On', hu: 'Be' },
  'accessibility/readable_font/value_2': { en: 'Off', hu: 'Ki' },
  // ⚠ a 27:10126 képernyőn a leírás a Simplified font szövegének másolata — a token a helyes
  'accessibility/invert_speach_bubbles/label': { en: 'Invert speach bubbles', hu: 'Inverz párbeszéd buborék' },
  'accessibility/invert_speach_bubbles/description': {
    en: 'Switches speech bubbles to a high-contrast dark style.',
    hu: 'Sötét, kontrasztos megjelenésre váltja a beszédbuborékokat.',
  },
  'accessibility/invert_speach_bubbles/value_1': { en: 'On', hu: 'Be' },
  'accessibility/invert_speach_bubbles/value_2': { en: 'Off', hu: 'Ki' },
  'accessibility/run_mode/label': { en: 'Run mode', hu: 'Futás módja' },
  'accessibility/run_mode/description': { en: 'Choose how to activate running.', hu: 'Válaszd ki a futás aktiválásának módját.' },
  'accessibility/run_mode/value_1': { en: 'Hold to run', hu: 'Nyomvatartással' },
  'accessibility/run_mode/value_2': { en: 'Toggle to run', hu: 'Ki / be kapcsolással' },
  'accessibility/jump_assist/label': { en: 'Jump assist', hu: 'Ugrás rásegítés' },
  'accessibility/jump_assist/description': { en: 'Makes jump timing more forgiving.', hu: 'Megkönnyíti az ugrások időzítését.' },
  'accessibility/jump_assist/value_1': { en: 'On', hu: 'Be' },
  'accessibility/jump_assist/value_2': { en: 'Off', hu: 'Ki' },
  'accessibility/mono_audio/label': { en: 'Mono audio', hu: 'Mono hang' },
  'accessibility/mono_audio/description': {
    en: 'Plays the same sounds through both audio channels.',
    hu: 'Mindkét hangcsatornán ugyanazokat a hangokat játssza le.',
  },
  'accessibility/mono_audio/value_1': { en: 'On', hu: 'Be' },
  'accessibility/mono_audio/value_2': { en: 'Off', hu: 'Ki' },

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
    en: 'The prototype implements the Graphics, Audio and Accessibility tabs. LB / RB still switches category.',
    hu: 'A prototípus a Grafika, a Hang és az Akadálymentesség fület valósítja meg. Az LB / RB itt is kategóriát vált.',
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
