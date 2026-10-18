"use strict";
(() => {
  // src/schema.ts
  var CATEGORIES = ["game", "graphics", "audio", "controller", "accessibility"];
  var SETTINGS = [
    { kind: "segmented", id: "audio.master", category: "audio", labelKey: "audio/options/master_volume", min: 0, max: 100, step: 10, default: 100 },
    { kind: "segmented", id: "audio.music", category: "audio", labelKey: "audio/options/music", min: 0, max: 100, step: 10, default: 70 },
    { kind: "segmented", id: "audio.sfx", category: "audio", labelKey: "audio/options/sound_effects", min: 0, max: 100, step: 10, default: 100 },
    {
      kind: "selector",
      id: "audio.profile",
      category: "audio",
      labelKey: "audio/options/speaker_type",
      default: "tv",
      // A Figma „Language / Settings" tokenjei szerint három érték, ebben a sorrendben.
      options: [
        { value: "headphones", labelKey: "audio/speaker_type/option_values/value_1" },
        { value: "tv", labelKey: "audio/speaker_type/option_values/value_2" },
        { value: "sound_system", labelKey: "audio/speaker_type/option_values/value_3" }
      ]
    },
    // Grafika (Figma 28:8012, UI-GFX-1-default). A címke és az értékek a Language / Settings tokenjei.
    // ⚑ NYITOTT: a fényerő tartománya és lépésköze — a terv 5+5 szegmense szerint −50…+50, 10-es lépés, alapérték 0 (közép).
    {
      kind: "segmented",
      id: "graphics.brightness",
      category: "graphics",
      labelKey: "graphics/brightness/label",
      min: -50,
      max: 50,
      step: 10,
      default: 0,
      bipolar: true,
      preview: "brightness"
    },
    // ⚑ NYITOTT: alapérték a terv default képernyőjéről (Teljes); nem forog körbe, mint a hangszóró-típus
    {
      kind: "selector",
      id: "graphics.screen_shake",
      category: "graphics",
      labelKey: "graphics/screen_shake/label",
      default: "full",
      options: [
        { value: "off", labelKey: "graphics/screen_shake/value_1" },
        { value: "reduced", labelKey: "graphics/screen_shake/value_2" },
        { value: "full", labelKey: "graphics/screen_shake/value_3" }
      ]
    },
    // Kontroller (Figma 28:1709 UI-CON-1-default · 28:2646 UI-CON-2-default-layout).
    // A rezgés szegmentált csúszka (3 szegmens = 4 fok), hogy látsszon, hány lehetőség van — szándékos tervdöntés a Figmában.
    // A fokok neve a Language / Settings controller/vibration/value_1…4 tokenje (Ki · Alacsony · Közepes · Magas).
    {
      kind: "segmented",
      id: "controller.vibration",
      category: "controller",
      labelKey: "controller/vibration/label",
      min: 0,
      max: 3,
      step: 1,
      default: 3,
      valueKeys: [1, 2, 3, 4].map((i) => `controller/vibration/value_${i}`)
    },
    // ⚑ NYITOTT: csak az Alapértelmezett kiosztás van megtervezve; az Alternatív A / B ábrája egyelőre ugyanazt mutatja
    {
      kind: "selector",
      id: "controller.layout",
      category: "controller",
      labelKey: "controller/layout/label",
      default: "default",
      preview: "controller",
      options: [
        { value: "default", labelKey: "controller/layout/value_1" },
        { value: "alt_a", labelKey: "controller/layout/value_2" },
        { value: "alt_b", labelKey: "controller/layout/value_3" }
      ]
    },
    // Akadálymentesség (Figma 27:10126, UI-ACC-1-default). A címke, leírás és értékek a Language / Settings tokenjei.
    // ⚑ NYITOTT: az alapértékek a Figma default képernyőjéről (minden Ki, Nyomvatartással); a kétértékű sor körbeforog.
    toggle("accessibility.readable_font", "accessibility/readable_font"),
    toggle("accessibility.invert_speach_bubbles", "accessibility/invert_speach_bubbles"),
    {
      kind: "selector",
      id: "accessibility.run_mode",
      category: "accessibility",
      wrap: true,
      default: "hold",
      labelKey: "accessibility/run_mode/label",
      descKey: "accessibility/run_mode/description",
      options: [
        { value: "hold", labelKey: "accessibility/run_mode/value_1" },
        { value: "toggle", labelKey: "accessibility/run_mode/value_2" }
      ]
    },
    toggle("accessibility.jump_assist", "accessibility/jump_assist"),
    toggle("accessibility.mono_audio", "accessibility/mono_audio")
  ];
  function toggle(id, key) {
    return {
      kind: "selector",
      id,
      category: "accessibility",
      wrap: true,
      default: "off",
      labelKey: `${key}/label`,
      descKey: `${key}/description`,
      options: [
        { value: "on", labelKey: `${key}/value_1` },
        { value: "off", labelKey: `${key}/value_2` }
      ]
    };
  }
  function settingsOf(cat, defs = SETTINGS) {
    return defs.filter((d) => d.category === cat);
  }
  function defaultsOf(defs = SETTINGS) {
    return Object.fromEntries(defs.map((d) => [d.id, d.default]));
  }

  // src/store.ts
  var SettingsStore = class {
    constructor(defs = SETTINGS, saved) {
      this.defs = defs;
      this.defaults = defaultsOf(defs);
      this.saved = { ...this.defaults, ...saved ?? {} };
      this.draft = { ...this.saved };
    }
    def(id) {
      const d = this.defs.find((x) => x.id === id);
      if (!d) throw new Error(`Ismeretlen be\xE1ll\xEDt\xE1s: ${id}`);
      return d;
    }
    get(id) {
      return this.draft[id];
    }
    /** Egy lépés a vezérlő saját lépésközével. Határon nem lép túl (UI-NAV-005).
     *  Igazat ad, ha az érték ténylegesen változott — csak ekkor szól UI-SND-003. */
    step(id, dir) {
      const d = this.def(id);
      if (d.disabled) return false;
      const cur = this.draft[id];
      let next;
      if (d.kind === "segmented") {
        next = Math.min(d.max, Math.max(d.min, cur + dir * d.step));
      } else {
        const i = d.options.findIndex((o) => o.value === cur);
        const n = d.options.length;
        const j = d.wrap ? (i + dir + n) % n : Math.min(n - 1, Math.max(0, i + dir));
        next = d.options[j].value;
      }
      if (next === cur) return false;
      this.draft[id] = next;
      return true;
    }
    /** A határ elérése (a chevron disabled állapotához). */
    atBound(id, dir) {
      const d = this.def(id);
      const cur = this.draft[id];
      if (d.kind === "segmented") return dir < 0 ? cur === d.min : cur === d.max;
      if (d.wrap) return false;
      const i = d.options.findIndex((o) => o.value === cur);
      return dir < 0 ? i <= 0 : i >= d.options.length - 1;
    }
    isDirty() {
      return this.defs.some((d) => this.draft[d.id] !== this.saved[d.id]);
    }
    isCategoryDirty(cat) {
      return settingsOf(cat, this.defs).some((d) => this.draft[d.id] !== this.saved[d.id]);
    }
    isCategoryDefault(cat) {
      return settingsOf(cat, this.defs).every((d) => this.draft[d.id] === d.default);
    }
    canApply() {
      return this.isDirty();
    }
    /** Reset csak akkor érhető el, ha a kategória nem egyezik az alapértékekkel (spec 5.1). */
    canReset(cat) {
      return settingsOf(cat, this.defs).length > 0 && !this.isCategoryDefault(cat);
    }
    apply() {
      this.saved = { ...this.draft };
    }
    discard() {
      this.draft = { ...this.saved };
    }
    resetCategory(cat, policy) {
      for (const d of settingsOf(cat, this.defs)) {
        this.draft[d.id] = d.default;
        if (policy === "immediate") this.saved[d.id] = d.default;
      }
    }
    /** A spec 5. táblájának négy állapota, kategóriára. */
    categoryState(cat) {
      const dirty = this.isCategoryDirty(cat);
      const isDefault = this.isCategoryDefault(cat);
      if (!dirty) return isDefault ? "default" : "saved_custom";
      return isDefault ? "modified_default" : "modified_custom";
    }
  };

  // src/input.ts
  var BINDINGS = {
    list: {
      LB: "PreviousCategory",
      RB: "NextCategory",
      Up: "PreviousItem",
      Down: "NextItem",
      Left: "DecreaseValue",
      Right: "IncreaseValue",
      A: "ApplySettings",
      Y: "ResetToDefaults",
      B: "Back"
    },
    // ⚠ 10.17 (Figma 28:7907): a modal gombjai ControllerButtonok — a rajzolt gombjel maga a kötés.
    // X = másodlagos (Elvetés) · A = elsődleges (Mentés / Visszaállítás) · B = Mégsem. (Eltér a UI-NAV-009 fókuszmodelljétől.)
    modal: { X: "SecondaryAction", A: "Confirm", B: "Back" },
    // Nyitóoldal (Figma 1:678): függőleges menü; az A a fókuszált menüpontot választja.
    start: { Up: "PreviousItem", Down: "NextItem", A: "Confirm" }
  };
  var INPUT_TUNING = {
    stickDeadzone: 0.5,
    repeatInitialMs: 400,
    repeatRateMs: 110,
    repeatable: /* @__PURE__ */ new Set(["Up", "Down", "Left", "Right"])
  };
  var PAD_BUTTONS = [
    [0, "A"],
    [1, "B"],
    [2, "X"],
    [3, "Y"],
    [4, "LB"],
    [5, "RB"],
    [9, "Menu"],
    [12, "Up"],
    [13, "Down"],
    [14, "Left"],
    [15, "Right"]
  ];
  var DEV_KEYS = {
    ArrowUp: "Up",
    ArrowDown: "Down",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    Enter: "A",
    Escape: "B",
    Backspace: "B",
    KeyY: "Y",
    KeyX: "X",
    KeyQ: "LB",
    KeyE: "RB",
    Tab: "Menu"
  };
  var RUMBLE_PREVIEW = { magnitudes: [0, 0.35, 0.65, 1], durationMs: 220 };
  function rumble(magnitude, durationMs = RUMBLE_PREVIEW.durationMs) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const pad = [...pads].find((p) => !!p && p.connected);
    if (!pad) return "no-pad";
    const act = pad.vibrationActuator;
    if (!act || typeof act.playEffect !== "function") return "unsupported";
    if (magnitude <= 0) {
      void act.reset?.().catch(() => {
      });
      return "off";
    }
    void act.playEffect("dual-rumble", { startDelay: 0, duration: durationMs, strongMagnitude: magnitude, weakMagnitude: magnitude }).catch(() => {
    });
    return "ok";
  }
  var InputAdapter = class {
    constructor(onButton, onConnection) {
      this.onButton = onButton;
      this.onConnection = onConnection;
      this.held = /* @__PURE__ */ new Map();
      this.raf = 0;
      this.connected = false;
    }
    start() {
      window.addEventListener("gamepadconnected", () => this.setConnected(true));
      window.addEventListener("gamepaddisconnected", () => this.setConnected(this.pad() !== null));
      window.addEventListener("keydown", (e) => {
        const b = DEV_KEYS[e.code];
        if (!b) return;
        const t2 = e.target;
        if (t2 && t2.closest("[data-dev-panel]")) return;
        e.preventDefault();
        if (e.repeat && !INPUT_TUNING.repeatable.has(b)) return;
        this.onButton(b, "keyboard");
      });
      const loop = () => {
        this.poll();
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }
    setConnected(c) {
      if (c !== this.connected) {
        this.connected = c;
        this.onConnection(c);
      }
    }
    pad() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const p of pads) if (p && p.connected) return p;
      return null;
    }
    poll() {
      const p = this.pad();
      this.setConnected(p !== null);
      if (!p) {
        this.held.clear();
        return;
      }
      const down = /* @__PURE__ */ new Set();
      for (const [i, b] of PAD_BUTTONS) if (p.buttons[i]?.pressed) down.add(b);
      const [ax, ay] = [p.axes[0] ?? 0, p.axes[1] ?? 0];
      const dz = INPUT_TUNING.stickDeadzone;
      if (Math.abs(ax) > Math.abs(ay)) {
        if (ax < -dz) down.add("Left");
        if (ax > dz) down.add("Right");
      } else {
        if (ay < -dz) down.add("Up");
        if (ay > dz) down.add("Down");
      }
      const now = performance.now();
      for (const b of down) {
        const h = this.held.get(b);
        if (!h) {
          this.held.set(b, { since: now, last: now });
          this.onButton(b, "gamepad");
        } else if (INPUT_TUNING.repeatable.has(b) && now - h.since >= INPUT_TUNING.repeatInitialMs && now - h.last >= INPUT_TUNING.repeatRateMs) {
          h.last = now;
          this.onButton(b, "gamepad");
        }
      }
      for (const b of [...this.held.keys()]) if (!down.has(b)) this.held.delete(b);
    }
  };

  // src/i18n.ts
  var SHY = "\xAD";
  var STRINGS = {
    // --- Figma: Language / Settings ---
    category_game: { en: "Game", hu: "J\xE1t\xE9k" },
    category_graphics: { en: "Graphics", hu: "Grafika" },
    category_audio: { en: "Audio", hu: "Hang" },
    category_controller: { en: "Controller", hu: "Kontroller" },
    category_accessibility: { en: "Accessibility", hu: `Akad\xE1ly${SHY}mentess\xE9g` },
    "audio/options/master_volume": { en: "Master volume", hu: "Hanger\u0151" },
    "audio/options/music": { en: "Music", hu: "Zene" },
    "audio/options/sound_effects": { en: "Sound effects", hu: "Hanghat\xE1sok" },
    "audio/options/speaker_type": { en: "Speaker type", hu: "Hangsz\xF3r\xF3 t\xEDpusa" },
    "audio/speaker_type/option_values/value_1": { en: "Headphones", hu: "Fejhallgat\xF3" },
    "audio/speaker_type/option_values/value_2": { en: "TV speakers", hu: "TV hangsz\xF3r\xF3" },
    "audio/speaker_type/option_values/value_3": { en: "Sound system", hu: "Hangrendszer" },
    "graphics/brightness/label": { en: "Brightness", hu: "F\xE9nyer\u0151" },
    "graphics/screen_shake/label": { en: "Screen shake", hu: "K\xE9perny\u0151r\xE1zk\xF3d\xE1s" },
    "graphics/screen_shake/value_1": { en: "Off", hu: "Kikapcsolva" },
    "graphics/screen_shake/value_2": { en: "Reduced", hu: "Cs\xF6kkentett" },
    "graphics/screen_shake/value_3": { en: "Full", hu: "Teljes" },
    "controller/vibration/label": { en: "Vibration", hu: "Vibr\xE1ci\xF3 er\u0151ss\xE9ge" },
    "controller/vibration/value_1": { en: "Off", hu: "Kikapcsolva" },
    "controller/vibration/value_2": { en: "Low", hu: "Alacsony" },
    "controller/vibration/value_3": { en: "Medium", hu: "K\xF6zepes" },
    "controller/vibration/value_4": { en: "High", hu: "Magas" },
    "controller/layout/label": { en: "Controller layout", hu: "Vez\xE9rl\u0151kioszt\xE1s" },
    "controller/layout/value_1": { en: "Default", hu: "Alap\xE9rtelmezett" },
    "controller/layout/value_2": { en: "Alternative A", hu: "Alternat\xEDv A" },
    "controller/layout/value_3": { en: "Alternative B", hu: "Alternat\xEDv B" },
    // ⚠ a Figma HU értéke elírt („Egyszerűsitett") — itt javítva; a tokent a Figmában is javítani kell
    "accessibility/readable_font/label": { en: "Simplified font", hu: "Egyszer\u0171s\xEDtett bet\u0171t\xEDpus" },
    "accessibility/readable_font/description": {
      en: "Uses a larger, easier-to-read font throughout the game.",
      hu: "Nagyobb, k\xF6nnyebben olvashat\xF3 bet\u0171t\xEDpust haszn\xE1l a j\xE1t\xE9kban."
    },
    "accessibility/readable_font/value_1": { en: "On", hu: "Be" },
    "accessibility/readable_font/value_2": { en: "Off", hu: "Ki" },
    // ⚠ a 27:10126 képernyőn a leírás a Simplified font szövegének másolata — a token a helyes
    "accessibility/invert_speach_bubbles/label": { en: "Invert speach bubbles", hu: "Inverz p\xE1rbesz\xE9d bubor\xE9k" },
    "accessibility/invert_speach_bubbles/description": {
      en: "Switches speech bubbles to a high-contrast dark style.",
      hu: "S\xF6t\xE9t, kontrasztos megjelen\xE9sre v\xE1ltja a besz\xE9dbubor\xE9kokat."
    },
    "accessibility/invert_speach_bubbles/value_1": { en: "On", hu: "Be" },
    "accessibility/invert_speach_bubbles/value_2": { en: "Off", hu: "Ki" },
    "accessibility/run_mode/label": { en: "Run mode", hu: "Fut\xE1s m\xF3dja" },
    "accessibility/run_mode/description": { en: "Choose how to activate running.", hu: "V\xE1laszd ki a fut\xE1s aktiv\xE1l\xE1s\xE1nak m\xF3dj\xE1t." },
    "accessibility/run_mode/value_1": { en: "Hold to run", hu: "Nyomvatart\xE1ssal" },
    "accessibility/run_mode/value_2": { en: "Toggle to run", hu: "Ki / be kapcsol\xE1ssal" },
    "accessibility/jump_assist/label": { en: "Jump assist", hu: "Ugr\xE1s r\xE1seg\xEDt\xE9s" },
    "accessibility/jump_assist/description": { en: "Makes jump timing more forgiving.", hu: "Megk\xF6nny\xEDti az ugr\xE1sok id\u0151z\xEDt\xE9s\xE9t." },
    "accessibility/jump_assist/value_1": { en: "On", hu: "Be" },
    "accessibility/jump_assist/value_2": { en: "Off", hu: "Ki" },
    "accessibility/mono_audio/label": { en: "Mono audio", hu: "Mono hang" },
    "accessibility/mono_audio/description": {
      en: "Plays the same sounds through both audio channels.",
      hu: "Mindk\xE9t hangcsatorn\xE1n ugyanazokat a hangokat j\xE1tssza le."
    },
    "accessibility/mono_audio/value_1": { en: "On", hu: "Be" },
    "accessibility/mono_audio/value_2": { en: "Off", hu: "Ki" },
    "actions/apply": { en: "Apply", hu: "Ment\xE9s" },
    "actions/reset": { en: "Reset to default", hu: "Alap\xE9rtelmezett be\xE1ll\xEDt\xE1sok" },
    "actions/back": { en: "Back", hu: "Vissza" },
    "unsaved_changes/title": { en: "Unsaved changes", hu: "Nem mentett be\xE1ll\xEDt\xE1sok" },
    "unsaved_changes/description": {
      en: "Your changes haven\u2019t been saved. What would you like to do?",
      hu: "A m\xF3dos\xEDt\xE1said m\xE9g nincsenek mentve. Mit szeretn\xE9l tenni?"
    },
    "unsaved_changes/actions/primary": { en: "Apply", hu: "Ment\xE9s" },
    "unsaved_changes/actions/secondary": { en: "Discard", hu: "Elvet\xE9s" },
    "unsaved_changes/actions/cancel": { en: "Cancel", hu: "M\xE9gsem" },
    // --- Figma: Language / Start (a mainMenu komponens label tulajdonságára kötve) ---
    // ⚠ a Figma HU értéke elírt („Folyatatás") — itt javítva; a tokent a Figmában is javítani kell
    main_continue: { en: "Continue", hu: "Folytat\xE1s" },
    main_new: { en: "New game", hu: "\xDAj j\xE1t\xE9k" },
    main_settings: { en: "Settings", hu: "Be\xE1ll\xEDt\xE1sok" },
    // --- spec v1.0, 7. fejezet (a Figmában még nincs token) ---
    "reset_defaults/title": { en: "Reset to defaults", hu: "Alap\xE9rt\xE9kek vissza\xE1ll\xEDt\xE1sa" },
    "reset_defaults/description": {
      en: "Reset all settings in this category to their default values?",
      hu: "Vissza\xE1ll\xEDtod a kateg\xF3ria \xF6sszes be\xE1ll\xEDt\xE1s\xE1t az alap\xE9rt\xE9k\xE9re?"
    },
    "reset_defaults/actions/primary": { en: "Reset", hu: "Vissza\xE1ll\xEDt\xE1s" },
    // --- Figma 53:2283 kiosztásábra (Controllerlabel feliratok) — a Language / Settingsben még nincs token; a HU fordítás javaslat ---
    "controller/bindings/settings": { en: "Settings", hu: "Be\xE1ll\xEDt\xE1sok" },
    "controller/bindings/movement": { en: "Movement", hu: "Mozg\xE1s" },
    "controller/bindings/change_weapon": { en: "Change weapon", hu: "Fegyverv\xE1lt\xE1s" },
    "controller/bindings/restore_health": { en: "Restore health", hu: "Gy\xF3gyul\xE1s" },
    "controller/bindings/weapon_mode": { en: "Weapon mode", hu: "Fegyverm\xF3d" },
    "controller/bindings/pause": { en: "Pause / Menu", hu: "Sz\xFCnet / Men\xFC" },
    "controller/bindings/pick_up": { en: "Pick up / grab", hu: "Felv\xE9tel / fog\xE1s" },
    // rövid: Egyszerűsített betűvel is a panelen belül marad
    "controller/bindings/sneak": { en: "Sneak toggle", hu: "Lopakod\xE1s be / ki" },
    "controller/bindings/jump": { en: "Jump / Dodge", hu: "Ugr\xE1s / kit\xE9r\xE9s" },
    "controller/bindings/attack": { en: "Attack", hu: "T\xE1mad\xE1s" },
    "controller/bindings/look": { en: "Look around", hu: "K\xF6r\xFCln\xE9z\xE9s" },
    // --- csak a prototípushoz ---
    "proto/hint/select": { en: "Select", hu: "Kiv\xE1laszt\xE1s" },
    "proto/placeholder/title": { en: "Not part of this slice", hu: "Nem r\xE9sze ennek a szeletnek" },
    "proto/placeholder/body": {
      en: "The prototype implements the Graphics, Audio, Controller and Accessibility tabs. LB / RB still switches category.",
      hu: "A protot\xEDpus a Grafika, a Hang, a Kontroller \xE9s az Akad\xE1lymentess\xE9g f\xFClet val\xF3s\xEDtja meg. Az LB / RB itt is kateg\xF3ri\xE1t v\xE1lt."
    },
    "proto/a11y/percent": { en: "{v} percent", hu: "{v} sz\xE1zal\xE9k" }
  };
  function t(key, lang, vars) {
    const entry = STRINGS[key];
    if (!entry) return `\u27E6${key}\u27E7`;
    let s = entry[lang];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  }

  // src/sound.ts
  var PATCHES = {
    "UI-SND-001": { noise: 0.05, voices: [{ f: 520, at: 0, dur: 0.05 }, { f: 660, at: 0.04, dur: 0.05 }] },
    // kategória
    "UI-SND-002": { noise: 0.025, voices: [{ f: 880, at: 0, dur: 0.03 }] },
    // sor
    "UI-SND-003": { voices: [{ f: 1180, at: 0, dur: 0.025, type: "square" }] },
    // érték
    "UI-SND-004": { voices: [{ f: 440, at: 0, dur: 0.07 }, { f: 587, at: 0.07, dur: 0.09 }] },
    // megerősítés
    "UI-SND-005": { voices: [{ f: 523, at: 0, dur: 0.07 }, { f: 659, at: 0.07, dur: 0.07 }, { f: 784, at: 0.14, dur: 0.14 }] },
    // siker
    "UI-SND-006": { voices: [{ f: 494, at: 0, dur: 0.06 }, { f: 370, at: 0.06, dur: 0.09 }] }
    // vissza / mégse
  };
  var SoundRouter = class {
    constructor() {
      this.ctx = null;
      /** Sound Effects × Master, 0..1 — a hívó adja meg (spec 6.1). */
      this.gain = 1;
      this.onPlay = () => {
      };
    }
    unlock() {
      if (!this.ctx) {
        try {
          this.ctx = new AudioContext();
        } catch {
          this.ctx = null;
        }
      }
      void this.ctx?.resume();
    }
    get enabled() {
      return !!this.ctx && this.ctx.state === "running";
    }
    play(id) {
      this.onPlay(id);
      const ctx = this.ctx;
      if (!ctx || ctx.state !== "running" || this.gain <= 0) return;
      const p = PATCHES[id];
      const t0 = ctx.currentTime;
      const out = ctx.createGain();
      out.gain.value = 0.18 * this.gain;
      out.connect(ctx.destination);
      for (const v of p.voices) {
        const o = ctx.createOscillator();
        const g2 = ctx.createGain();
        o.type = v.type ?? "triangle";
        o.frequency.value = v.f;
        g2.gain.setValueAtTime(1e-4, t0 + v.at);
        g2.gain.exponentialRampToValueAtTime(1, t0 + v.at + 5e-3);
        g2.gain.exponentialRampToValueAtTime(1e-4, t0 + v.at + v.dur);
        o.connect(g2).connect(out);
        o.start(t0 + v.at);
        o.stop(t0 + v.at + v.dur + 0.02);
      }
      if (p.noise) {
        const len = Math.floor(ctx.sampleRate * p.noise);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctx.createBufferSource();
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 3200;
        const g2 = ctx.createGain();
        g2.gain.value = 0.5;
        src.buffer = buf;
        src.connect(bp).connect(g2).connect(out);
        src.start(t0);
      }
    }
  };
  var MusicPlayer = class {
    constructor(src) {
      this.started = false;
      this.el = new Audio(src);
      this.el.loop = true;
      this.el.preload = "auto";
    }
    /** Master × Music, 0..1 — a hívó a draftból adja: élő előnézet (spec 6.1). */
    set volume(v) {
      this.el.volume = Math.min(1, Math.max(0, v));
    }
    get playing() {
      return this.started && !this.el.paused;
    }
    /** Indítási kísérlet; ha a böngésző még tiltja, a következő gesztusnál újrapróbálható. */
    start() {
      if (this.playing) return Promise.resolve(true);
      return this.el.play().then(() => this.started = true, () => false);
    }
  };

  // src/app.ts
  var ASSETS_MUSIC = window.__ASSETS_MUSIC;
  var ASSETS_MODAL = window.__ASSETS_MODAL;
  var ASSETS = window.__ASSETS;
  var ASSETS_GFX = window.__ASSETS_GFX;
  var ASSETS_CTL = window.__ASSETS_CTL;
  var CONTROLLER_BINDINGS = [
    { side: "left", top: 50, icon: "system-screen", key: "controller/bindings/settings" },
    { side: "left", top: 139, icon: "stick-left", key: "controller/bindings/movement" },
    { side: "left", top: 222, icon: "dpad-left", key: "controller/bindings/change_weapon" },
    { side: "left", top: 291, icon: "dpad-down", key: "controller/bindings/restore_health" },
    { side: "left", top: 356, icon: "dpad-right", key: "controller/bindings/weapon_mode" },
    { side: "right", top: 0, icon: "system-menu", key: "controller/bindings/pause" },
    { side: "right", top: 89, icon: "Y", key: "controller/bindings/pick_up" },
    { side: "right", top: 154, icon: "B", key: "controller/bindings/sneak" },
    { side: "right", top: 217, icon: "A", key: "controller/bindings/jump" },
    { side: "right", top: 281, icon: "X", key: "controller/bindings/attack" },
    { side: "right", top: 369, icon: "stick-right", key: "controller/bindings/look" }
  ];
  var ASSETS_START = window.__ASSETS_START;
  var START_MENU = ["main_continue", "main_new", "main_settings"];
  var MODAL_BUTTONS = {
    unsaved: [
      { act: "discard", btn: "X", key: "unsaved_changes/actions/secondary", state: "focused" },
      { act: "apply", btn: "A", key: "unsaved_changes/actions/primary", state: "default" },
      { act: "cancel", btn: "B", key: "unsaved_changes/actions/cancel", state: "default" }
    ],
    reset: [
      { act: "reset", btn: "A", key: "reset_defaults/actions/primary", state: "focused" },
      { act: "cancel", btn: "B", key: "unsaved_changes/actions/cancel", state: "default" }
    ]
  };
  var WRAP = false;
  var SettingsApp = class {
    constructor(stage2, dev2) {
      this.stage = stage2;
      this.dev = dev2;
      this.store = new SettingsStore();
      this.sound = new SoundRouter();
      this.music = new MusicPlayer(ASSETS_MUSIC);
      this.ui = {
        screen: "start",
        startIdx: 0,
        // a terv szerint a Folytatás a kezdő fókusz
        cat: "audio",
        rowByCat: { game: 0, graphics: 0, audio: 0, controller: 0, accessibility: 0 },
        modal: null,
        lang: "hu",
        resetPolicy: "draft"
      };
      this.log = [];
      this.pending = null;
      this.padConnected = false;
      this.fontDiag = "m\xE9r\xE9s folyamatban\u2026";
      this.video = document.getElementById("start-video");
      // ---------- megjelenítés ----------
      this.L = (k, v) => t(k, this.ui.lang, v);
      this.sound.onPlay = (id) => {
        if (this.pending) this.pending.sound = id;
      };
    }
    start() {
      new InputAdapter(
        (b) => {
          this.startMusic();
          this.press(b);
        },
        // gamepadról a böngésző általában elutasítja — a következő gesztus pótolja
        (c) => {
          this.padConnected = c;
          this.renderDev();
        }
      ).start();
      this.stage.addEventListener("pointerdown", () => {
        this.sound.unlock();
        this.startMusic();
      });
      void this.loadVideo();
      this.render();
      this.startMusic();
      void this.measureFonts();
    }
    // ---------- bemenet ----------
    context() {
      if (this.ui.screen === "start") return "start";
      return this.ui.modal ? "modal" : "list";
    }
    press(b) {
      const action = BINDINGS[this.context()][b];
      this.pending = { button: b, action: action ?? "\u2014" };
      if (action) this.dispatch(action);
      this.log.unshift(this.pending);
      this.log.length = Math.min(this.log.length, 8);
      this.pending = null;
      this.render();
    }
    /** Többfájlos buildben a videó közvetlenül, folyamatosan töltődik. Az egyfájlos (--single) buildben blob URL-ről indul:
     *  a nagy data: URI-t nem minden böngésző játssza le / loopolja megbízhatóan. */
    async loadVideo() {
      const v = this.video;
      if (!v) return;
      v.poster = ASSETS_START.bg;
      if (!ASSETS_START.video.startsWith("data:")) v.src = ASSETS_START.video;
      else try {
        v.src = URL.createObjectURL(await (await fetch(ASSETS_START.video)).blob());
      } catch {
        v.src = ASSETS_START.video;
      }
      this.syncVideo();
    }
    /** Csak a nyitóoldalon látszik és fut; prefers-reduced-motion esetén állókép marad. */
    syncVideo() {
      const v = this.video;
      if (!v) return;
      const on = this.ui.screen === "start";
      v.hidden = !on;
      if (on && v.src && !matchMedia("(prefers-reduced-motion: reduce)").matches) void v.play().catch(() => {
      });
      else v.pause();
    }
    startMusic() {
      if (!this.music.playing) void this.music.start().then(() => this.renderDev());
    }
    play(id) {
      const sfx = this.store.get("audio.sfx");
      const master = this.store.get("audio.master");
      this.sound.gain = sfx / 100 * (master / 100);
      this.sound.play(id);
    }
    rows(cat = this.ui.cat) {
      return settingsOf(cat).filter((d) => !d.disabled);
    }
    move(cur, dir, len) {
      if (len === 0) return cur;
      const next = cur + dir;
      if (WRAP) return (next + len) % len;
      return Math.min(len - 1, Math.max(0, next));
    }
    dispatch(a) {
      const ui2 = this.ui;
      if (ui2.screen === "start") {
        if (a === "PreviousItem" || a === "NextItem") {
          const next = this.move(ui2.startIdx, a === "NextItem" ? 1 : -1, START_MENU.length);
          if (next !== ui2.startIdx) {
            ui2.startIdx = next;
            this.play("UI-SND-002");
          }
        } else if (a === "Confirm") {
          if (START_MENU[ui2.startIdx] === "main_settings") this.openSettings();
          else if (this.pending) this.pending.note = "nem r\xE9sze ennek a szeletnek";
        }
        return;
      }
      if (ui2.modal) {
        const btn = a === "Confirm" ? "A" : a === "SecondaryAction" ? "X" : a === "Back" ? "B" : null;
        const hit = MODAL_BUTTONS[ui2.modal.kind].find((m) => m.btn === btn);
        if (hit) this.runModal(hit.act);
        return;
      }
      switch (a) {
        case "PreviousCategory":
        case "NextCategory": {
          const i = CATEGORIES.indexOf(ui2.cat);
          const j = this.move(i, a === "NextCategory" ? 1 : -1, CATEGORIES.length);
          if (j !== i) {
            ui2.cat = CATEGORIES[j];
            this.play("UI-SND-001");
          }
          return;
        }
        case "PreviousItem":
        case "NextItem": {
          const rows = this.rows();
          const cur = ui2.rowByCat[ui2.cat];
          const next = this.move(cur, a === "NextItem" ? 1 : -1, rows.length);
          if (next !== cur) {
            ui2.rowByCat[ui2.cat] = next;
            this.play("UI-SND-002");
          }
          return;
        }
        case "DecreaseValue":
        case "IncreaseValue": {
          const row = this.rows()[ui2.rowByCat[ui2.cat]];
          if (row && this.store.step(row.id, a === "IncreaseValue" ? 1 : -1)) {
            this.play("UI-SND-003");
            if (row.id === "controller.vibration") this.previewRumble();
          } else if (this.pending) this.pending.note = "hat\xE1r \u2014 hang nyitott (UI-NAV-005)";
          return;
        }
        case "ApplySettings":
          if (this.store.canApply()) {
            this.store.apply();
            this.play("UI-SND-005");
          }
          return;
        case "ResetToDefaults":
          if (this.store.canReset(ui2.cat)) ui2.modal = { kind: "reset" };
          return;
        case "Back":
          if (this.store.isDirty()) ui2.modal = { kind: "unsaved" };
          else {
            this.closeSettings();
            this.play("UI-SND-006");
          }
          return;
      }
    }
    /** Rezgés-előnézet: a kontroller az éppen beállított fokon rezdül egyet (a draftból, mint a hangerő előhallgatása). */
    previewRumble() {
      const level = this.store.get("controller.vibration");
      const res = rumble(RUMBLE_PREVIEW.magnitudes[level]);
      const note = { ok: `rezg\xE9s ${Math.round(RUMBLE_PREVIEW.magnitudes[level] * 100)}% \xB7 ${RUMBLE_PREVIEW.durationMs} ms`, off: "rezg\xE9s ki", "no-pad": "rezg\xE9s: nincs kontroller", unsupported: "rezg\xE9s: a b\xF6ng\xE9sz\u0151 nem t\xE1mogatja" }[res];
      if (this.pending) this.pending.note = note;
    }
    openSettings() {
      const ui2 = this.ui;
      ui2.screen = "settings";
      ui2.cat = "audio";
      ui2.rowByCat.audio = 0;
      this.play("UI-SND-004");
    }
    /** Kilépés a nyitóoldalra; a fókusz a Beállítások menüponton marad. */
    closeSettings() {
      this.ui.screen = "start";
      this.ui.startIdx = START_MENU.indexOf("main_settings");
    }
    runModal(act) {
      const ui2 = this.ui;
      ui2.modal = null;
      switch (act) {
        case "cancel":
          this.play("UI-SND-006");
          return;
        case "discard":
          this.store.discard();
          this.closeSettings();
          this.play("UI-SND-004");
          return;
        case "apply":
          this.store.apply();
          this.closeSettings();
          this.play("UI-SND-005");
          return;
        case "reset":
          this.store.resetCategory(ui2.cat, ui2.resetPolicy);
          this.play("UI-SND-004");
          return;
      }
    }
    render() {
      const root = document.documentElement;
      root.lang = this.ui.lang;
      this.stage.classList.toggle("readable", this.store.get("accessibility.readable_font") === "on");
      this.music.volume = this.store.get("audio.music") / 100 * (this.store.get("audio.master") / 100);
      this.stage.innerHTML = this.ui.screen === "start" ? this.startHTML() : this.settingsHTML();
      this.syncVideo();
      const target = this.stage.querySelector("[data-focus]");
      target?.focus({ preventScroll: true });
      this.renderDev();
    }
    settingsHTML() {
      const { ui: ui2, store } = this;
      const modalOpen = !!ui2.modal;
      const tabs = CATEGORIES.map((c) => {
        const on = c === ui2.cat;
        return `<div class="tab${on ? " is-active hatch" : ""}" role="tab" id="tab-${c}" aria-selected="${on}" aria-controls="panel">
        <i class="ln ln-t" aria-hidden="true"></i><i class="ln ln-b" aria-hidden="true"></i><i class="ln ln-r" aria-hidden="true"></i>${on || c === CATEGORIES[0] ? '<i class="ln ln-l" aria-hidden="true"></i>' : ""}
        ${on ? '<i class="shadow" aria-hidden="true"></i>' : ""}<span class="tab-label">${this.L("category_" + c)}</span></div>`;
      }).join("");
      const rows = settingsOf(ui2.cat);
      const focusIdx = ui2.rowByCat[ui2.cat];
      const body = rows.length ? rows.map((d, i) => this.rowHTML(d, i === focusIdx && !modalOpen)).join("") : `<div class="placeholder"><p class="ph-title">${this.L("proto/placeholder/title")}</p><p>${this.L("proto/placeholder/body")}</p></div>`;
      const bar = [
        store.canApply() ? this.barItem("A", "actions/apply") : "",
        store.canReset(ui2.cat) ? this.barItem("Y", "actions/reset") : "",
        this.barItem("B", "actions/back")
      ].join("");
      return `
      <div class="screen" ${modalOpen ? "inert" : ""}>
        <div class="navbar">
          <div class="navctl lb">${bumper("LB")}</div>
          <div class="tabs" role="tablist" aria-label="Settings">${tabs}</div>
          <div class="navctl rb">${bumper("RB")}</div>
        </div>
        <div class="panel" id="panel" role="tabpanel" aria-labelledby="tab-${ui2.cat}">${body}</div>
        <div class="actionbar"><div class="bar-items">${bar}</div></div>
      </div>
      ${ui2.modal ? this.modalHTML() : ""}`;
    }
    rowHTML(d, focused) {
      const v = this.store.get(d.id);
      const lo = this.store.atBound(d.id, -1);
      const hi = this.store.atBound(d.id, 1);
      let control;
      let aria;
      if (d.kind === "segmented" && d.bipolar) {
        const half = (d.max - d.min) / d.step / 2;
        const k = v / d.step;
        const left = Array.from({ length: half }, (_, i) => `<span class="seg${k <= -(half - i) ? " on" : ""}"></span>`).join("");
        const right = Array.from({ length: half }, (_, i) => `<span class="seg${k >= i + 1 ? " on" : ""}"></span>`).join("");
        control = `${chev("<", lo)}<span class="meter bipolar" aria-hidden="true"><span class="half">${left}</span><span class="mid">i</span><span class="half">${right}</span></span>${chev(">", hi)}`;
        aria = `role="slider" aria-valuemin="${d.min}" aria-valuemax="${d.max}" aria-valuenow="${v}" aria-valuetext="${v > 0 ? "+" : ""}${v}"`;
      } else if (d.kind === "segmented") {
        const n = (d.max - d.min) / d.step;
        const on = (v - d.min) / d.step;
        const segs = Array.from({ length: n }, (_, i) => `<span class="seg${i < on ? " on" : ""}"></span>`).join("");
        control = `${chev("<", lo)}<span class="meter" aria-hidden="true">${segs}</span>${chev(">", hi)}`;
        const text = d.valueKeys ? this.L(d.valueKeys[(v - d.min) / d.step]) : this.L("proto/a11y/percent", { v });
        aria = `role="slider" aria-valuemin="${d.min}" aria-valuemax="${d.max}" aria-valuenow="${v}" aria-valuetext="${text}"`;
      } else {
        const opt = d.options.find((o) => o.value === v);
        const label = this.L(opt.labelKey);
        control = `${chev("<", lo)}<span class="value">${label}</span>${chev(">", hi)}`;
        aria = `role="slider" aria-valuemin="0" aria-valuemax="${d.options.length - 1}" aria-valuenow="${d.options.indexOf(opt)}" aria-valuetext="${label}"`;
      }
      const preview = d.preview === "brightness" ? brightnessPreview(v) : d.preview === "controller" ? this.controllerDiagram() : "";
      const desc = d.preview === "controller" ? CONTROLLER_BINDINGS.map((b) => `${b.icon}: ${this.L(b.key)}`).join(", ") : d.descKey ? this.L(d.descKey) : "";
      return `<div class="row${focused ? " is-focused hatch" : ""}${d.disabled ? " is-disabled" : ""}${preview ? ` has-preview preview-${d.preview}` : ""}" tabindex="-1" ${focused ? "data-focus" : ""}
        ${aria} aria-label="${this.L(d.labelKey)}" ${desc ? `aria-description="${desc}"` : ""} ${d.disabled ? 'aria-disabled="true"' : ""}>
        <span class="text"><span class="marker" aria-hidden="true">&gt;</span><span class="label">${this.L(d.labelKey)}</span>${d.descKey ? `<span class="desc">${this.L(d.descKey)}</span>` : ""}</span>
        <span class="control">${control}</span>${preview}
      </div>`;
    }
    /** Kiosztásábra (Figma 53:2283): kontrollerkép + vonalak/pontok (egy SVG-ben) + a két oldali Controllerlabel-oszlop. */
    controllerDiagram() {
      const label = (b) => {
        const icon = b.icon.length === 1 ? glyph(b.icon) : `<span class="ctl-icon ctl-${b.icon}" aria-hidden="true"><img alt="" src="${ASSETS_CTL.icons[b.icon]}"></span>`;
        const text = `<span class="cl-label">${this.L(b.key)}</span>`;
        return `<span class="ctl-label is-${b.side}" style="top:${b.top}px">${b.side === "left" ? text + icon : icon + text}</span>`;
      };
      return `<span class="ctl-diagram" aria-hidden="true">
        <img class="ctl-photo" alt="" src="${ASSETS_CTL.photo}">
        <img class="ctl-lines" alt="" src="${ASSETS_CTL.lines}">
        ${CONTROLLER_BINDINGS.map(label).join("")}
      </span>`;
    }
    barItem(btn, key) {
      return ctrlButton({ btn, label: this.L(key) });
    }
    modalHTML() {
      const m = this.ui.modal;
      const kind = m.kind === "unsaved" ? "unsaved_changes" : "reset_defaults";
      const btns = MODAL_BUTTONS[m.kind].map((b) => ctrlButton({ btn: b.btn, label: this.L(b.key), state: b.state })).join("");
      return `<div class="scrim scrim-warning"></div>
      <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="dlg-t" aria-describedby="dlg-b" tabindex="-1" data-focus>
        <span class="m-shadow2" aria-hidden="true"></span>
        <img class="m-shadow-arrow" alt="" aria-hidden="true" src="${ASSETS_MODAL.shadowArrow}">
        <span class="m-shadow1" aria-hidden="true"></span>
        <span class="m-paper" aria-hidden="true"></span>
        <div class="m-content">
          <h2 id="dlg-t">${this.L(`${kind}/title`)}</h2>
          <p id="dlg-b">${this.L(`${kind}/description`)}</p>
        </div>
        <div class="m-actions">${btns}</div>
        <span class="m-border" aria-hidden="true"></span>
        <img class="m-arrow" alt="" aria-hidden="true" src="${ASSETS_MODAL.arrow}">
        <img class="m-arrow-border" alt="" aria-hidden="true" src="${ASSETS_MODAL.arrowBorder}">
      </div>`;
    }
    /** Nyitóoldal (Figma 1:678): a háttér a tartós #start-video (alatta), erre jön a világos szegélydísz, cím + logó, menü, stúdiónév. */
    startHTML() {
      const S = ASSETS_START;
      const items = START_MENU.map((id, i) => {
        const on = i === this.ui.startIdx;
        const deco = on ? '<span class="mi-shadow2" aria-hidden="true"></span><span class="mi-shadow1" aria-hidden="true"></span><span class="mi-bg" aria-hidden="true"></span>' : "";
        return `<div class="menu-item${on ? " is-focused" : ""}" role="menuitem" tabindex="-1" ${on ? "data-focus" : ""}>
          ${deco}<span class="mi-label">${this.L(id)}</span>
          <span class="mi-corner" aria-hidden="true"><img alt="" src="${on ? S.cornerFocused : S.corner}"></span>
        </div>`;
      }).join("");
      return `<div class="start">
        <img class="side side-top" alt="" aria-hidden="true" src="${S.sideTop}">
        <img class="side side-bottom" alt="" aria-hidden="true" src="${S.sideBottom}">
        <div class="side side-v side-right" aria-hidden="true"><img alt="" src="${S.sideRight}"></div>
        <div class="side side-v side-left" aria-hidden="true"><img alt="" src="${S.sideLeft}"></div>
        <h1 class="start-heading" aria-label="The Assignment">
          <span class="start-the" aria-hidden="true">The</span>
          <img class="start-title" alt="" aria-hidden="true" src="${S.title}">
        </h1>
        <div class="start-logo-box" aria-hidden="true"><img class="start-logo" alt="" src="${S.logo}"></div>
        <div class="start-menu" role="menu" aria-label="Main menu">${items}</div>
        <p class="start-credit">ranagol</p>
      </div>`;
    }
    /** Betűdiagnosztika: betöltődött-e a beágyazott Comic Neue, és mekkora a normál ↔ félkövér szélességkülönbség. */
    async measureFonts() {
      try {
        await document.fonts.ready;
        await Promise.all([document.fonts.load('400 28px "Comic Neue"', "\u0150\u0170"), document.fonts.load('700 28px "Comic Neue"', "\u0150\u0170")]);
        const faces = [...document.fonts].filter((f) => f.family.replace(/"/g, "") === "Comic Neue").map((f) => `${f.weight}: ${f.status}`);
        const probe = (w) => {
          const sp = document.createElement("span");
          sp.textContent = "CONTROLLER LAYOUTS";
          sp.style.cssText = `position:absolute;left:0;top:0;white-space:nowrap;font-family:var(--font-ui);font-size:28px;font-weight:${w};visibility:hidden`;
          this.stage.appendChild(sp);
          const scale = this.stage.getBoundingClientRect().width / 1920 || 1;
          const x = sp.getBoundingClientRect().width / scale;
          sp.remove();
          return x;
        };
        const r = probe(400), b = probe(700);
        const ok400 = document.fonts.check('400 28px "Comic Neue"', "A"), ok700 = document.fonts.check('700 28px "Comic Neue"', "A");
        this.fontDiag = `Comic Neue \u2014 ${faces.join(" \xB7 ") || "nincs @font-face"} \xB7 check 400: ${ok400 ? "\u2713" : "\u2717"} \xB7 700: ${ok700 ? "\u2713" : "\u2717"}<br>\u201ECONTROLLER LAYOUTS" 28 px: norm\xE1l ${r.toFixed(1)} px \xB7 f\xE9lk\xF6v\xE9r ${b.toFixed(1)} px \xB7 elt\xE9r\xE9s ${(b - r >= 0 ? "+" : "") + (b - r).toFixed(1)} px <span class="muted">(Figma: 286 / 285)</span><br><span class="muted">${navigator.userAgent}</span>`;
      } catch (e) {
        this.fontDiag = "a m\xE9r\xE9s hib\xE1ra futott: " + String(e);
      }
      this.renderDev();
    }
    // ---------- fejlesztői panel (nem része a játék UI-jának) ----------
    renderDev() {
      const { ui: ui2, store } = this;
      const stateName = ui2.screen === "start" ? "start \xB7 " + START_MENU[ui2.startIdx] : store.categoryState(ui2.cat);
      const ctx = this.context();
      const row = (id) => {
        const d = store.def(id);
        const cls = store.draft[id] !== store.saved[id] ? ' class="diff"' : "";
        return `<tr${cls}><td>${id}</td><td>${d.default}</td><td>${store.saved[id]}</td><td>${store.draft[id]}</td></tr>`;
      };
      const log = this.log.map((e) => `<li><b>${e.button}</b> \u2192 ${e.action}${e.sound ? ` \xB7 <span class="snd">${e.sound}</span>` : ""}${e.note ? ` \xB7 <i>${e.note}</i>` : ""}</li>`).join("");
      this.dev.innerHTML = `
      <div class="dev-col">
        <h3>\xC1llapot</h3>
        <p class="state"><span class="pill">${stateName}</span> <span class="ctx">kontextus: ${ctx}</span></p>
        <table><thead><tr><th>be\xE1ll\xEDt\xE1s</th><th>default</th><th>saved</th><th>draft</th></tr></thead>
        <tbody>${store.defs.map((d) => row(d.id)).join("")}</tbody></table>
      </div>
      <div class="dev-col">
        <h3>Esem\xE9nyek</h3>
        <ol class="log">${log || '<li class="muted">M\xE9g nincs bemenet.</li>'}</ol>
      </div>
      <div class="dev-col">
        <h3>Pr\xF3bakapcsol\xF3k</h3>
        <div class="seg-ctl" role="group" aria-label="Nyelv">
          <button id="dev-hu" aria-pressed="${ui2.lang === "hu"}">Magyar</button><button id="dev-en" aria-pressed="${ui2.lang === "en"}">English</button>
        </div>
        <label class="chk"><input type="checkbox" id="dev-immediate" ${ui2.resetPolicy === "immediate" ? "checked" : ""}> Reset azonnal ment <span class="muted">(nyitott policy)</span></label>
        <button id="dev-sound" class="wide">${this.sound.enabled ? "Hang bekapcsolva \u2713" : "Hang bekapcsol\xE1sa"}</button>
        <p class="muted small">H\xE1tt\xE9rzene (Frost Ritual): ${this.music.playing ? "<b>sz\xF3l</b>" : "\xE1ll \u2014 egy billenty\u0171 vagy kattint\xE1s ind\xEDtja (a gamepad-gombot a b\xF6ng\xE9sz\u0151 nem veszi gesztusnak)"}.</p>
        <p class="muted small">Kontroller: ${this.padConnected ? "<b>csatlakoztatva</b>" : "nincs \u2014 nyomj meg rajta egy gombot"}.<br>
        Billenty\u0171 (csak fejleszt\xE9shez): nyilak \xB7 Q/E = LB/RB \xB7 Enter = A \xB7 Esc = B \xB7 Y = Y</p>
      </div>
      <div class="dev-col dev-wide">
        <h3>Bet\u0171diagnosztika</h3>
        <p class="small" id="font-diag">${this.fontDiag}</p>
      </div>`;
      const on = (id, fn, ev = "click") => this.dev.querySelector(`#${id}`)?.addEventListener(ev, () => {
        fn();
        this.render();
      });
      on("dev-hu", () => {
        ui2.lang = "hu";
      });
      on("dev-en", () => {
        ui2.lang = "en";
      });
      on("dev-immediate", () => {
        ui2.resetPolicy = ui2.resetPolicy === "draft" ? "immediate" : "draft";
      }, "change");
      on("dev-sound", () => {
        this.sound.unlock();
        this.startMusic();
        setTimeout(() => this.renderDev(), 50);
      });
    }
  };
  function glyph(letter, state = "default") {
    const ring = state === "focused" ? ASSETS.ringFocused : state === "disabled" ? ASSETS.ringDisabled : ASSETS.ring;
    return `<span class="glyph" aria-hidden="true"><b>${letter}</b><img alt="" src="${ring}"></span>`;
  }
  function ctrlButton(o) {
    const state = o.state ?? "default";
    const g2 = o.showController === false ? "" : glyph(o.btn, state);
    const label = `<span class="cb-label">${o.label}</span>`;
    const inner = o.align === "right" ? label + g2 : g2 + label;
    return `<span class="ctrl-btn is-${state}${o.align === "right" ? " is-right" : ""}">${inner}</span>`;
  }
  function bumper(label) {
    return `<span class="bumper ${label.toLowerCase()}" aria-hidden="true"><img alt="" src="${ASSETS.bumper}"><span>${label}</span></span>`;
  }
  var GREY_SCALE = [0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100];
  function brightnessPreview(v) {
    const cells = GREY_SCALE.map((a) => `<i style="background:rgba(17,17,16,${a / 100})"></i>`).join("");
    return `<span class="gfx-preview" aria-hidden="true" style="--gfx-brightness:${1 + v / 100}">
      <span class="gfx-pic"><span><img alt="" src="${ASSETS_GFX.preview}"></span></span>
      <span class="gfx-scale"><span>${cells}</span></span>
    </span>`;
  }
  function chev(dir, disabled) {
    return `<span class="chev${disabled ? " is-off" : ""}" aria-hidden="true">${dir === "<" ? "&lt;" : "&gt;"}</span>`;
  }

  // src/main.ts
  var viewport = document.getElementById("viewport");
  var stage = document.getElementById("stage");
  var ui = document.getElementById("ui");
  var dev = document.getElementById("dev");
  var grid = document.getElementById("grid");
  var g = "";
  for (let cx = 60; cx <= 1860; cx += 120) {
    for (let cy = 60; cy <= 1020; cy += 120) {
      g += `<i class="av" style="left:${cx - 0.375}px;top:${cy - 61}px"></i><i class="av" style="left:${cx - 0.375}px;top:${cy + 5}px"></i><i class="ah" style="left:${cx - 61}px;top:${cy - 0.375}px"></i><i class="ah" style="left:${cx + 6}px;top:${cy - 0.375}px"></i><i class="dot" style="left:${cx - 1}px;top:${cy - 1}px"></i>`;
    }
  }
  grid.innerHTML = g;
  var fit = () => {
    stage.style.transform = `scale(${viewport.clientWidth / 1920})`;
  };
  new ResizeObserver(fit).observe(viewport);
  fit();
  new SettingsApp(ui, dev).start();
})();
