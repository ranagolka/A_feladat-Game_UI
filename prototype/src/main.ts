import { SettingsApp } from './app';

const viewport = document.getElementById('viewport')!;
const stage = document.getElementById('stage')!;
const ui = document.getElementById('ui')!;
const dev = document.getElementById('dev')!;

// Rácsmetszéspontok a Figma „patterns" csoportja szerint: x = 60…1860, y = 60…1020, 120 px-enként;
// mindegyiknél négy 56 px-es kar 5 px réssel és egy 2 px-es pont. A halványítást a csoport maszkja adja.
const grid = document.getElementById('grid')!;
let g = '';
for (let cx = 60; cx <= 1860; cx += 120) {
  for (let cy = 60; cy <= 1020; cy += 120) {
    g += `<i class="av" style="left:${cx - 0.375}px;top:${cy - 61}px"></i><i class="av" style="left:${cx - 0.375}px;top:${cy + 5}px"></i>`
      + `<i class="ah" style="left:${cx - 61}px;top:${cy - 0.375}px"></i><i class="ah" style="left:${cx + 6}px;top:${cy - 0.375}px"></i>`
      + `<i class="dot" style="left:${cx - 1}px;top:${cy - 1}px"></i>`;
  }
}
grid.innerHTML = g;

// Az 1920×1080 referencia-vászon a rendelkezésre álló szélességre skálázva (spec 9.2).
const fit = () => { stage.style.transform = `scale(${viewport.clientWidth / 1920})`; };
new ResizeObserver(fit).observe(viewport);
fit();

new SettingsApp(ui, dev).start();
