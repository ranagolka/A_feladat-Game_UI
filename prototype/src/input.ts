// DEV-003 — Controller input adapter: fizikai gomb → logikai gomb → (kontextus) → akció.
// A fizikai kiosztás csak az első adapter (Xbox / standard gamepad mapping).

export type Button = 'A' | 'B' | 'X' | 'Y' | 'LB' | 'RB' | 'Up' | 'Down' | 'Left' | 'Right' | 'Menu';

export type Action =
  | 'PreviousCategory' | 'NextCategory'
  | 'PreviousItem' | 'NextItem'
  | 'DecreaseValue' | 'IncreaseValue'
  | 'Confirm' | 'SecondaryAction' | 'ApplySettings' | 'ResetToDefaults' | 'Back';

export type Context = 'start' | 'list' | 'modal';

/** A kontextusonkénti kötéstábla. Egyetlen helyen cserélhető. */
export const BINDINGS: Record<Context, Partial<Record<Button, Action>>> = {
  list: {
    LB: 'PreviousCategory', RB: 'NextCategory',
    Up: 'PreviousItem', Down: 'NextItem',
    Left: 'DecreaseValue', Right: 'IncreaseValue',
    A: 'ApplySettings', Y: 'ResetToDefaults', B: 'Back',
  },
  // ⚠ 10.17 (Figma 28:7907): a modal gombjai ControllerButtonok — a rajzolt gombjel maga a kötés.
  // X = másodlagos (Elvetés) · A = elsődleges (Mentés / Visszaállítás) · B = Mégsem. (Eltér a UI-NAV-009 fókuszmodelljétől.)
  modal: { X: 'SecondaryAction', A: 'Confirm', B: 'Back' },
  // Nyitóoldal (Figma 1:678): függőleges menü; az A a fókuszált menüpontot választja.
  start: { Up: 'PreviousItem', Down: 'NextItem', A: 'Confirm' },
};

/** ⚑ NYITOTT (spec 14.): deadzone, initial delay, repeat rate. Munkaértékek. */
export const INPUT_TUNING = {
  stickDeadzone: 0.5,
  repeatInitialMs: 400,
  repeatRateMs: 110,
  repeatable: new Set<Button>(['Up', 'Down', 'Left', 'Right']),
};

// Standard gamepad mapping (W3C): 0 A · 1 B · 2 X · 3 Y · 4 LB · 5 RB · 9 Menu · 12–15 D-pad
const PAD_BUTTONS: [number, Button][] = [
  [0, 'A'], [1, 'B'], [2, 'X'], [3, 'Y'], [4, 'LB'], [5, 'RB'], [9, 'Menu'],
  [12, 'Up'], [13, 'Down'], [14, 'Left'], [15, 'Right'],
];

// Fejlesztői billentyű-adapter: csak a próbához, a képernyőn nem jelenik meg súgóként (SCOPE-001).
const DEV_KEYS: Record<string, Button> = {
  ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
  Enter: 'A', Escape: 'B', Backspace: 'B', KeyY: 'Y', KeyX: 'X',
  KeyQ: 'LB', KeyE: 'RB', Tab: 'Menu',
};

/** ⚑ NYITOTT: a rezgés-előnézet munkaértékei — fokonkénti erősség (Ki · Alacsony · Közepes · Magas) és impulzushossz. */
export const RUMBLE_PREVIEW = { magnitudes: [0, 0.35, 0.65, 1], durationMs: 220 };

export type RumbleResult = 'ok' | 'off' | 'no-pad' | 'unsupported';

/** Egy rövid rezgés az első csatlakoztatott kontrolleren (Gamepad API, „dual-rumble": Chrome / Edge; Safari és Firefox nem támogatja). */
export function rumble(magnitude: number, durationMs = RUMBLE_PREVIEW.durationMs): RumbleResult {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const pad = [...pads].find((p): p is Gamepad => !!p && p.connected);
  if (!pad) return 'no-pad';
  const act = pad.vibrationActuator as GamepadHapticActuator | null | undefined;
  if (!act || typeof act.playEffect !== 'function') return 'unsupported';
  if (magnitude <= 0) { void act.reset?.().catch(() => {}); return 'off'; } // Ki: a futó rezgést is leállítja
  void act.playEffect('dual-rumble', { startDelay: 0, duration: durationMs, strongMagnitude: magnitude, weakMagnitude: magnitude }).catch(() => {});
  return 'ok';
}

export type ButtonHandler =(b: Button, source: 'gamepad' | 'keyboard') => void;

export class InputAdapter {
  private held = new Map<Button, { since: number; last: number }>();
  private raf = 0;
  connected = false;

  constructor(private onButton: ButtonHandler, private onConnection: (c: boolean) => void) {}

  start(): void {
    window.addEventListener('gamepadconnected', () => this.setConnected(true));
    window.addEventListener('gamepaddisconnected', () => this.setConnected(this.pad() !== null));
    window.addEventListener('keydown', (e) => {
      const b = DEV_KEYS[e.code];
      if (!b) return;
      const t = e.target as HTMLElement | null;
      if (t && t.closest('[data-dev-panel]')) return; // a fejlesztői panel saját vezérlői
      e.preventDefault();
      if (e.repeat && !INPUT_TUNING.repeatable.has(b)) return;
      this.onButton(b, 'keyboard');
    });
    const loop = () => {
      this.poll();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private setConnected(c: boolean) {
    if (c !== this.connected) {
      this.connected = c;
      this.onConnection(c);
    }
  }

  private pad(): Gamepad | null {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) if (p && p.connected) return p;
    return null;
  }

  private poll(): void {
    const p = this.pad();
    this.setConnected(p !== null);
    if (!p) {
      this.held.clear();
      return;
    }
    const down = new Set<Button>();
    for (const [i, b] of PAD_BUTTONS) if (p.buttons[i]?.pressed) down.add(b);
    const [ax, ay] = [p.axes[0] ?? 0, p.axes[1] ?? 0];
    const dz = INPUT_TUNING.stickDeadzone;
    if (Math.abs(ax) > Math.abs(ay)) {
      if (ax < -dz) down.add('Left');
      if (ax > dz) down.add('Right');
    } else {
      if (ay < -dz) down.add('Up');
      if (ay > dz) down.add('Down');
    }
    const now = performance.now();
    for (const b of down) {
      const h = this.held.get(b);
      if (!h) {
        this.held.set(b, { since: now, last: now });
        this.onButton(b, 'gamepad');
      } else if (INPUT_TUNING.repeatable.has(b)
        && now - h.since >= INPUT_TUNING.repeatInitialMs
        && now - h.last >= INPUT_TUNING.repeatRateMs) {
        h.last = now;
        this.onButton(b, 'gamepad');
      }
    }
    for (const b of [...this.held.keys()]) if (!down.has(b)) this.held.delete(b);
  }
}
