// DEV-002 — Default / saved / draft store. Tiszta logika, DOM nélkül.
// Spec 5. fejezet: dirty = draft ≠ saved; a tri-state ebből számolódik.

import { CategoryId, SettingDef, SETTINGS, Value, defaultsOf, settingsOf } from './schema';

/** ⚑ NYITOTT (spec 5.1): a Reset jóváhagyása azonnal ment, vagy csak draftot ír.
 *  Ez az egyetlen policy-pont. Munkaérték: 'draft' — ezt a Figma „dirty default" állapota feltételezi. */
export type ResetPolicy = 'draft' | 'immediate';

export type CategoryState = 'default' | 'saved_custom' | 'modified_custom' | 'modified_default';

export class SettingsStore {
  readonly defs: SettingDef[];
  readonly defaults: Record<string, Value>;
  saved: Record<string, Value>;
  draft: Record<string, Value>;

  constructor(defs: SettingDef[] = SETTINGS, saved?: Record<string, Value>) {
    this.defs = defs;
    this.defaults = defaultsOf(defs);
    this.saved = { ...this.defaults, ...(saved ?? {}) };
    this.draft = { ...this.saved };
  }

  def(id: string): SettingDef {
    const d = this.defs.find((x) => x.id === id);
    if (!d) throw new Error(`Ismeretlen beállítás: ${id}`);
    return d;
  }

  get(id: string): Value {
    return this.draft[id];
  }

  /** Egy lépés a vezérlő saját lépésközével. Határon nem lép túl (UI-NAV-005).
   *  Igazat ad, ha az érték ténylegesen változott — csak ekkor szól UI-SND-003. */
  step(id: string, dir: -1 | 1): boolean {
    const d = this.def(id);
    if (d.disabled) return false;
    const cur = this.draft[id];
    let next: Value;
    if (d.kind === 'segmented') {
      next = Math.min(d.max, Math.max(d.min, (cur as number) + dir * d.step));
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
  atBound(id: string, dir: -1 | 1): boolean {
    const d = this.def(id);
    const cur = this.draft[id];
    if (d.kind === 'segmented') return dir < 0 ? cur === d.min : cur === d.max;
    if (d.wrap) return false;
    const i = d.options.findIndex((o) => o.value === cur);
    return dir < 0 ? i <= 0 : i >= d.options.length - 1;
  }

  isDirty(): boolean {
    return this.defs.some((d) => this.draft[d.id] !== this.saved[d.id]);
  }

  isCategoryDirty(cat: CategoryId): boolean {
    return settingsOf(cat, this.defs).some((d) => this.draft[d.id] !== this.saved[d.id]);
  }

  isCategoryDefault(cat: CategoryId): boolean {
    return settingsOf(cat, this.defs).every((d) => this.draft[d.id] === d.default);
  }

  canApply(): boolean {
    return this.isDirty();
  }

  /** Reset csak akkor érhető el, ha a kategória nem egyezik az alapértékekkel (spec 5.1). */
  canReset(cat: CategoryId): boolean {
    return settingsOf(cat, this.defs).length > 0 && !this.isCategoryDefault(cat);
  }

  apply(): void {
    this.saved = { ...this.draft };
  }

  discard(): void {
    this.draft = { ...this.saved };
  }

  resetCategory(cat: CategoryId, policy: ResetPolicy): void {
    for (const d of settingsOf(cat, this.defs)) {
      this.draft[d.id] = d.default;
      if (policy === 'immediate') this.saved[d.id] = d.default;
    }
  }

  /** A spec 5. táblájának négy állapota, kategóriára. */
  categoryState(cat: CategoryId): CategoryState {
    const dirty = this.isCategoryDirty(cat);
    const isDefault = this.isCategoryDefault(cat);
    if (!dirty) return isDefault ? 'default' : 'saved_custom';
    return isDefault ? 'modified_default' : 'modified_custom';
  }
}
