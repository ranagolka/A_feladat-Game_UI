// DEV-004/006/007 — Fókusz- és navigációs motor, ActionBar tri-state, modalfolyamok.
import { CATEGORIES, CategoryId, SettingDef, settingsOf } from './schema';
import { ResetPolicy, SettingsStore } from './store';
import { Action, BINDINGS, Button, Context, InputAdapter } from './input';
import { Lang, t } from './i18n';
import { SoundId, SoundRouter } from './sound';

const ASSETS_MODAL = (window as unknown as { __ASSETS_MODAL: { arrow: string; arrowBorder: string; shadowArrow: string } }).__ASSETS_MODAL;

/** A Figma-eszközök data: URI-jai — a build tölti ki (template: window.__ASSETS). */
const ASSETS = (window as unknown as { __ASSETS: { ring: string; ringFocused: string; ringDisabled: string; bumper: string } }).__ASSETS;

type ModalKind = 'unsaved' | 'reset';
type ModalAction = 'discard' | 'apply' | 'cancel' | 'reset';
type Glyph = 'A' | 'B' | 'X' | 'Y';

/** A modal gombsora a terv szerint (Figma 28:7907): gombjel + felirat; a destruktív művelet a „focused" (piros) változat. */
const MODAL_BUTTONS: Record<ModalKind, { act: ModalAction; btn: Glyph; key: string; state: BtnState }[]> = {
  unsaved: [
    { act: 'discard', btn: 'X', key: 'unsaved_changes/actions/secondary', state: 'focused' },
    { act: 'apply', btn: 'A', key: 'unsaved_changes/actions/primary', state: 'default' },
    { act: 'cancel', btn: 'B', key: 'unsaved_changes/actions/cancel', state: 'default' },
  ],
  reset: [
    { act: 'reset', btn: 'A', key: 'reset_defaults/actions/primary', state: 'focused' },
    { act: 'cancel', btn: 'B', key: 'unsaved_changes/actions/cancel', state: 'default' },
  ],
};

/** ⚑ NYITOTT (spec 4.1): wrap vagy clamp a kategória- és listahatáron. Munkaérték: clamp. */
const WRAP = false;

interface UIState {
  screen: 'settings' | 'closed';
  cat: CategoryId;
  rowByCat: Record<CategoryId, number>;
  modal: null | { kind: ModalKind };
  lang: Lang;
  readable: boolean;
  resetPolicy: ResetPolicy;
}

interface LogEntry { button: Button; action: Action | '—'; sound?: SoundId; note?: string }

export class SettingsApp {
  store = new SettingsStore();
  sound = new SoundRouter();
  ui: UIState = {
    screen: 'settings',
    cat: 'audio',
    rowByCat: { game: 0, graphics: 0, audio: 0, controller: 0, accessibility: 0 },
    modal: null,
    lang: 'hu',
    readable: false,
    resetPolicy: 'draft',
  };
  log: LogEntry[] = [];
  private pending: LogEntry | null = null;
  private padConnected = false;
  private fontDiag = 'mérés folyamatban…';

  constructor(private stage: HTMLElement, private dev: HTMLElement) {
    this.sound.onPlay = (id) => { if (this.pending) this.pending.sound = id; };
  }

  start(): void {
    new InputAdapter(
      (b) => this.press(b),
      (c) => { this.padConnected = c; this.renderDev(); },
    ).start();
    this.stage.addEventListener('pointerdown', () => { this.sound.unlock(); this.renderDev(); });
    this.render();
    void this.measureFonts();
  }

  // ---------- bemenet ----------

  private context(): Context {
    if (this.ui.screen === 'closed') return 'closed';
    return this.ui.modal ? 'modal' : 'list';
  }

  press(b: Button): void {
    const action = BINDINGS[this.context()][b];
    this.pending = { button: b, action: action ?? '—' };
    if (action) this.dispatch(action);
    this.log.unshift(this.pending);
    this.log.length = Math.min(this.log.length, 8);
    this.pending = null;
    this.render();
  }

  private play(id: SoundId) {
    const sfx = this.store.get('audio.sfx') as number;
    const master = this.store.get('audio.master') as number;
    this.sound.gain = (sfx / 100) * (master / 100); // Sound Effects × Master, a draftból — élő előnézet
    this.sound.play(id);
  }

  private rows(cat = this.ui.cat): SettingDef[] {
    return settingsOf(cat).filter((d) => !d.disabled); // disabled sor nem kap fókuszt (4.1)
  }

  private move(cur: number, dir: -1 | 1, len: number): number {
    if (len === 0) return cur;
    const next = cur + dir;
    if (WRAP) return (next + len) % len;
    return Math.min(len - 1, Math.max(0, next));
  }

  dispatch(a: Action): void {
    const ui = this.ui;
    if (a === 'OpenSettings') {
      ui.screen = 'settings';
      ui.cat = 'audio';
      ui.rowByCat.audio = 0; // UI-NAV-004: determinált kezdő fókusz
      this.play('UI-SND-004');
      return;
    }

    if (ui.modal) {
      // a gombjel a kötés: minden gomb a saját jelével váltódik ki
      const btn: Glyph | null = a === 'Confirm' ? 'A' : a === 'SecondaryAction' ? 'X' : a === 'Back' ? 'B' : null;
      const hit = MODAL_BUTTONS[ui.modal.kind].find((m) => m.btn === btn);
      if (hit) this.runModal(hit.act);
      return;
    }

    switch (a) {
      case 'PreviousCategory':
      case 'NextCategory': {
        const i = CATEGORIES.indexOf(ui.cat);
        const j = this.move(i, a === 'NextCategory' ? 1 : -1, CATEGORIES.length);
        if (j !== i) { ui.cat = CATEGORIES[j]; this.play('UI-SND-001'); } // a draft megmarad (UI-NAV-001)
        return;
      }
      case 'PreviousItem':
      case 'NextItem': {
        const rows = this.rows();
        const cur = ui.rowByCat[ui.cat];
        const next = this.move(cur, a === 'NextItem' ? 1 : -1, rows.length);
        if (next !== cur) { ui.rowByCat[ui.cat] = next; this.play('UI-SND-002'); }
        return;
      }
      case 'DecreaseValue':
      case 'IncreaseValue': {
        const row = this.rows()[ui.rowByCat[ui.cat]];
        if (row && this.store.step(row.id, a === 'IncreaseValue' ? 1 : -1)) this.play('UI-SND-003');
        else if (this.pending) this.pending.note = 'határ — hang nyitott (UI-NAV-005)';
        return;
      }
      case 'ApplySettings':
        if (this.store.canApply()) { this.store.apply(); this.play('UI-SND-005'); }
        return;
      case 'ResetToDefaults':
        if (this.store.canReset(ui.cat)) ui.modal = { kind: 'reset' };
        return;
      case 'Back':
        if (this.store.isDirty()) ui.modal = { kind: 'unsaved' };
        else { ui.screen = 'closed'; this.play('UI-SND-006'); }
        return;
    }
  }

  private runModal(act: ModalAction): void {
    const ui = this.ui;
    ui.modal = null; // a fókusz a kiváltó sorra tér vissza (4.1)
    switch (act) {
      case 'cancel': this.play('UI-SND-006'); return;
      case 'discard': this.store.discard(); ui.screen = 'closed'; this.play('UI-SND-004'); return;
      case 'apply': this.store.apply(); ui.screen = 'closed'; this.play('UI-SND-005'); return;
      case 'reset': this.store.resetCategory(ui.cat, ui.resetPolicy); this.play('UI-SND-004'); return;
    }
  }

  // ---------- megjelenítés ----------

  private L = (k: string, v?: Record<string, string | number>) => t(k, this.ui.lang, v);

  render(): void {
    const root = document.documentElement;
    root.lang = this.ui.lang;
    this.stage.classList.toggle('readable', this.ui.readable);
    this.stage.innerHTML = this.ui.screen === 'closed' ? this.closedHTML() : this.settingsHTML();
    const target = this.stage.querySelector<HTMLElement>('[data-focus]');
    target?.focus({ preventScroll: true });
    this.renderDev();
  }

  private settingsHTML(): string {
    const { ui, store } = this;
    const modalOpen = !!ui.modal;
    const tabs = CATEGORIES.map((c) => {
      const on = c === ui.cat;
      return `<div class="tab${on ? ' is-active hatch' : ''}" role="tab" id="tab-${c}" aria-selected="${on}" aria-controls="panel">
        <i class="ln ln-t" aria-hidden="true"></i><i class="ln ln-b" aria-hidden="true"></i><i class="ln ln-r" aria-hidden="true"></i>${on || c === CATEGORIES[0] ? '<i class="ln ln-l" aria-hidden="true"></i>' : ''}
        ${on ? '<i class="shadow" aria-hidden="true"></i>' : ''}<span class="tab-label">${this.L('category_' + c)}</span></div>`;
    }).join('');

    const rows = settingsOf(ui.cat);
    const focusIdx = ui.rowByCat[ui.cat];
    const body = rows.length
      ? rows.map((d, i) => this.rowHTML(d, i === focusIdx && !modalOpen)).join('')
      : `<div class="placeholder"><p class="ph-title">${this.L('proto/placeholder/title')}</p><p>${this.L('proto/placeholder/body')}</p></div>`;

    const bar = [
      store.canApply() ? this.barItem('A', 'actions/apply') : '',
      store.canReset(ui.cat) ? this.barItem('Y', 'actions/reset') : '',
      this.barItem('B', 'actions/back'),
    ].join('');

    return `
      <div class="screen" ${modalOpen ? 'inert' : ''}>
        <div class="navbar">
          <div class="navctl lb">${bumper('LB')}</div>
          <div class="tabs" role="tablist" aria-label="Settings">${tabs}</div>
          <div class="navctl rb">${bumper('RB')}</div>
        </div>
        <div class="panel" id="panel" role="tabpanel" aria-labelledby="tab-${ui.cat}">${body}</div>
        <div class="actionbar"><div class="bar-items">${bar}</div></div>
      </div>
      ${ui.modal ? this.modalHTML() : ''}`;
  }

  private rowHTML(d: SettingDef, focused: boolean): string {
    const v = this.store.get(d.id);
    const lo = this.store.atBound(d.id, -1);
    const hi = this.store.atBound(d.id, 1);
    let control: string;
    let aria: string;
    if (d.kind === 'segmented') {
      const n = (d.max - d.min) / d.step;
      const on = ((v as number) - d.min) / d.step;
      const segs = Array.from({ length: n }, (_, i) => `<span class="seg${i < on ? ' on' : ''}"></span>`).join('');
      control = `${chev('<', lo)}<span class="meter" aria-hidden="true">${segs}</span>${chev('>', hi)}`;
      aria = `role="slider" aria-valuemin="${d.min}" aria-valuemax="${d.max}" aria-valuenow="${v}" aria-valuetext="${this.L('proto/a11y/percent', { v: v as number })}"`;
    } else {
      const opt = d.options.find((o) => o.value === v)!;
      const label = this.L(opt.labelKey);
      control = `${chev('<', lo)}<span class="value">${label}</span>${chev('>', hi)}`;
      aria = `role="slider" aria-valuemin="0" aria-valuemax="${d.options.length - 1}" aria-valuenow="${d.options.indexOf(opt)}" aria-valuetext="${label}"`;
    }
    return `<div class="row${focused ? ' is-focused hatch' : ''}${d.disabled ? ' is-disabled' : ''}" tabindex="-1" ${focused ? 'data-focus' : ''}
        ${aria} aria-label="${this.L(d.labelKey)}" ${d.disabled ? 'aria-disabled="true"' : ''}>
        <span class="marker" aria-hidden="true">&gt;</span>
        <span class="label">${this.L(d.labelKey)}</span>
        <span class="control">${control}</span>
      </div>`;
  }

  private barItem(btn: 'A' | 'B' | 'Y', key: string): string {
    return ctrlButton({ btn, label: this.L(key) });
  }

  private modalHTML(): string {
    const m = this.ui.modal!;
    const kind = m.kind === 'unsaved' ? 'unsaved_changes' : 'reset_defaults';
    const btns = MODAL_BUTTONS[m.kind].map((b) => ctrlButton({ btn: b.btn, label: this.L(b.key), state: b.state })).join('');
    // Figma 28:7907 — rétegsorrend: shadow2 · shadowArrow · shadow1 · paper · addon · tartalom · border · arrow · arrowBorder
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

  private closedHTML(): string {
    return `<div class="closed" tabindex="-1" data-focus>
        <p class="closed-title">${this.L('proto/closed/title')}</p>
        ${ctrlButton({ btn: 'A', label: this.L('proto/closed/hint') })}
      </div>`;
  }

  /** Betűdiagnosztika: betöltődött-e a beágyazott Comic Neue, és mekkora a normál ↔ félkövér szélességkülönbség. */
  private async measureFonts(): Promise<void> {
    try {
      await document.fonts.ready;
      await Promise.all([document.fonts.load('400 28px "Comic Neue"', 'ŐŰ'), document.fonts.load('700 28px "Comic Neue"', 'ŐŰ')]);
      const faces = [...document.fonts].filter((f) => f.family.replace(/"/g, '') === 'Comic Neue').map((f) => `${f.weight}: ${f.status}`);
      const probe = (w: number) => {
        const sp = document.createElement('span');
        sp.textContent = 'CONTROLLER LAYOUTS';
        sp.style.cssText = `position:absolute;left:0;top:0;white-space:nowrap;font-family:var(--font-ui);font-size:28px;font-weight:${w};visibility:hidden`;
        this.stage.appendChild(sp);
        const scale = this.stage.getBoundingClientRect().width / 1920 || 1;
        const x = sp.getBoundingClientRect().width / scale;
        sp.remove();
        return x;
      };
      const r = probe(400), b = probe(700);
      const ok400 = document.fonts.check('400 28px "Comic Neue"', 'A'), ok700 = document.fonts.check('700 28px "Comic Neue"', 'A');
      this.fontDiag = `Comic Neue — ${faces.join(' · ') || 'nincs @font-face'} · check 400: ${ok400 ? '✓' : '✗'} · 700: ${ok700 ? '✓' : '✗'}<br>`
        + `„CONTROLLER LAYOUTS" 28 px: normál ${r.toFixed(1)} px · félkövér ${b.toFixed(1)} px · eltérés ${(b - r >= 0 ? '+' : '') + (b - r).toFixed(1)} px <span class="muted">(Figma: 286 / 285)</span><br>`
        + `<span class="muted">${navigator.userAgent}</span>`;
    } catch (e) {
      this.fontDiag = 'a mérés hibára futott: ' + String(e);
    }
    this.renderDev();
  }

  // ---------- fejlesztői panel (nem része a játék UI-jának) ----------

  private renderDev(): void {
    const { ui, store } = this;
    const stateName = ui.screen === 'closed' ? 'closed' : store.categoryState(ui.cat);
    const ctx = this.context();
    const row = (id: string) => {
      const d = store.def(id);
      const cls = store.draft[id] !== store.saved[id] ? ' class="diff"' : '';
      return `<tr${cls}><td>${id}</td><td>${d.default}</td><td>${store.saved[id]}</td><td>${store.draft[id]}</td></tr>`;
    };
    const log = this.log.map((e) =>
      `<li><b>${e.button}</b> → ${e.action}${e.sound ? ` · <span class="snd">${e.sound}</span>` : ''}${e.note ? ` · <i>${e.note}</i>` : ''}</li>`).join('');

    this.dev.innerHTML = `
      <div class="dev-col">
        <h3>Állapot</h3>
        <p class="state"><span class="pill">${stateName}</span> <span class="ctx">kontextus: ${ctx}</span></p>
        <table><thead><tr><th>beállítás</th><th>default</th><th>saved</th><th>draft</th></tr></thead>
        <tbody>${store.defs.map((d) => row(d.id)).join('')}</tbody></table>
      </div>
      <div class="dev-col">
        <h3>Események</h3>
        <ol class="log">${log || '<li class="muted">Még nincs bemenet.</li>'}</ol>
      </div>
      <div class="dev-col">
        <h3>Próbakapcsolók</h3>
        <div class="seg-ctl" role="group" aria-label="Nyelv">
          <button id="dev-hu" aria-pressed="${ui.lang === 'hu'}">Magyar</button><button id="dev-en" aria-pressed="${ui.lang === 'en'}">English</button>
        </div>
        <label class="chk"><input type="checkbox" id="dev-readable" ${ui.readable ? 'checked' : ''}> Readable Font (Comic Neue → Inter + nagyobb méret)</label>
        <label class="chk"><input type="checkbox" id="dev-immediate" ${ui.resetPolicy === 'immediate' ? 'checked' : ''}> Reset azonnal ment <span class="muted">(nyitott policy)</span></label>
        <button id="dev-sound" class="wide">${this.sound.enabled ? 'Hang bekapcsolva ✓' : 'Hang bekapcsolása'}</button>
        <p class="muted small">Kontroller: ${this.padConnected ? '<b>csatlakoztatva</b>' : 'nincs — nyomj meg rajta egy gombot'}.<br>
        Billentyű (csak fejlesztéshez): nyilak · Q/E = LB/RB · Enter = A · Esc = B · Y = Y</p>
      </div>
      <div class="dev-col dev-wide">
        <h3>Betűdiagnosztika</h3>
        <p class="small" id="font-diag">${this.fontDiag}</p>
      </div>`;

    const on = (id: string, fn: () => void, ev = 'click') =>
      this.dev.querySelector(`#${id}`)?.addEventListener(ev, () => { fn(); this.render(); });
    on('dev-hu', () => { ui.lang = 'hu'; });
    on('dev-en', () => { ui.lang = 'en'; });
    on('dev-readable', () => { ui.readable = !ui.readable; }, 'change');
    on('dev-immediate', () => { ui.resetPolicy = ui.resetPolicy === 'draft' ? 'immediate' : 'draft'; }, 'change');
    on('dev-sound', () => { this.sound.unlock(); setTimeout(() => this.renderDev(), 50); });
  }
}

// ---------- rajzolt jelek ----------

// ---------- ControllerButton — újrahasználható komponens (Figma 20:4891) ----------
// állapot: default · focused · disabled  ·  igazítás: left (jel balra) · right (jel jobbra)  ·  showController

type BtnState = 'default' | 'focused' | 'disabled';

function glyph(letter: Glyph, state: BtnState = 'default'): string {
  const ring = state === 'focused' ? ASSETS.ringFocused : state === 'disabled' ? ASSETS.ringDisabled : ASSETS.ring;
  return `<span class="glyph" aria-hidden="true"><b>${letter}</b><img alt="" src="${ring}"></span>`;
}

function ctrlButton(o: { btn: Glyph; label: string; state?: BtnState; align?: 'left' | 'right'; showController?: boolean }): string {
  const state = o.state ?? 'default';
  const g = o.showController === false ? '' : glyph(o.btn, state);
  const label = `<span class="cb-label">${o.label}</span>`;
  const inner = o.align === 'right' ? label + g : g + label;
  return `<span class="ctrl-btn is-${state}${o.align === 'right' ? ' is-right' : ''}">${inner}</span>`;
}

function bumper(label: 'LB' | 'RB'): string {
  return `<span class="bumper ${label.toLowerCase()}" aria-hidden="true"><img alt="" src="${ASSETS.bumper}"><span>${label}</span></span>`;
}

function chev(dir: '<' | '>', disabled: boolean): string {
  return `<span class="chev${disabled ? ' is-off' : ''}" aria-hidden="true">${dir === '<' ? '&lt;' : '&gt;'}</span>`;
}
