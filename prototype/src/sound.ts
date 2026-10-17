// DEV-009 — UI sound event router. Az esemény hangazonosítóra hivatkozik, nem fájlra (spec 8.).
// A hangminták itt szintetizált helyőrzők: a végleges karakter JAVASLAT, nem döntés (spec 13.).

export type SoundId = 'UI-SND-001' | 'UI-SND-002' | 'UI-SND-003' | 'UI-SND-004' | 'UI-SND-005' | 'UI-SND-006';

type Voice = { f: number; at: number; dur: number; type?: OscillatorType };

// Helyőrző minták: papír-pöccintés (zaj) + rövid hangmagasság. Cserélhető a router kódja nélkül.
const PATCHES: Record<SoundId, { noise?: number; voices: Voice[] }> = {
  'UI-SND-001': { noise: 0.05, voices: [{ f: 520, at: 0, dur: 0.05 }, { f: 660, at: 0.04, dur: 0.05 }] }, // kategória
  'UI-SND-002': { noise: 0.025, voices: [{ f: 880, at: 0, dur: 0.03 }] },                               // sor
  'UI-SND-003': { voices: [{ f: 1180, at: 0, dur: 0.025, type: 'square' }] },                           // érték
  'UI-SND-004': { voices: [{ f: 440, at: 0, dur: 0.07 }, { f: 587, at: 0.07, dur: 0.09 }] },           // megerősítés
  'UI-SND-005': { voices: [{ f: 523, at: 0, dur: 0.07 }, { f: 659, at: 0.07, dur: 0.07 }, { f: 784, at: 0.14, dur: 0.14 }] }, // siker
  'UI-SND-006': { voices: [{ f: 494, at: 0, dur: 0.06 }, { f: 370, at: 0.06, dur: 0.09 }] },           // vissza / mégse
};

export class SoundRouter {
  private ctx: AudioContext | null = null;
  /** Sound Effects × Master, 0..1 — a hívó adja meg (spec 6.1). */
  gain = 1;
  onPlay: (id: SoundId) => void = () => {};

  unlock(): void {
    if (!this.ctx) {
      try { this.ctx = new AudioContext(); } catch { this.ctx = null; }
    }
    void this.ctx?.resume();
  }

  get enabled(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  play(id: SoundId): void {
    this.onPlay(id);
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running' || this.gain <= 0) return;
    const p = PATCHES[id];
    const t0 = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 0.18 * this.gain;
    out.connect(ctx.destination);
    for (const v of p.voices) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = v.type ?? 'triangle';
      o.frequency.value = v.f;
      g.gain.setValueAtTime(0.0001, t0 + v.at);
      g.gain.exponentialRampToValueAtTime(1, t0 + v.at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + v.at + v.dur);
      o.connect(g).connect(out);
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
      bp.type = 'bandpass';
      bp.frequency.value = 3200;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      src.buffer = buf;
      src.connect(bp).connect(g).connect(out);
      src.start(t0);
    }
  }
}
