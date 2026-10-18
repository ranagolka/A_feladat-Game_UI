// Build: a TypeScript bundle + a sablon.
//   node build.mjs            → dist/site/ — többfájlos oldal (index.html · app.js · assets/), ezt publikálja a GitHub Pages
//   node build.mjs --publish  → ugyanez, és a dist/site tartalma a ../docs mappába kerül (a régi docs/assets törlődik)
//   node build.mjs --single   → dist/a-feladat-beallitasok.html — egyetlen önálló fájl, minden eszköz data: URI-ként beágyazva
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const single = process.argv.includes('--single');
const publish = process.argv.includes('--publish');

const out = await build({
  entryPoints: ['src/main.ts'], bundle: true, format: 'iife', target: 'es2020',
  minify: false, write: false, legalComments: 'none',
});
const js = out.outputFiles[0].text;
const hash = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const template = readFileSync('template.html', 'utf8');

if (single) {
  const mime = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', mp3: 'audio/mpeg', mp4: 'video/mp4', svg: 'image/svg+xml', ttf: 'font/ttf' };
  const html = template
    .replace(/__ASSET:([\w.-]+)__/g, (_, f) => `data:${mime[f.split('.').pop()]};base64,${readFileSync('assets/' + f).toString('base64')}`)
    .replace('<!--__BUNDLE__-->', () => `<script>\n${js.replace(/<\/script/gi, '<\\/script')}</script>`);
  mkdirSync('dist', { recursive: true });
  writeFileSync('dist/a-feladat-beallitasok.html', html);
  console.log(`dist/a-feladat-beallitasok.html — ${(html.length / 1024).toFixed(1)} KB`);
} else {
  // Csak a sablonban hivatkozott eszközök kerülnek ki; a ?v= tartalom-hash miatt módosításkor a böngésző nem a régit tölti gyorsítótárból.
  rmSync('dist/site', { recursive: true, force: true });
  mkdirSync('dist/site/assets', { recursive: true });
  const used = new Set();
  const html = template
    .replace(/__ASSET:([\w.-]+)__/g, (_, f) => {
      const buf = readFileSync('assets/' + f);
      if (!used.has(f)) { used.add(f); writeFileSync('dist/site/assets/' + f, buf); }
      return `assets/${f}?v=${hash(buf)}`;
    })
    .replace('<!--__BUNDLE__-->', () => `<script src="app.js?v=${hash(js)}"></script>`);
  writeFileSync('dist/site/app.js', js);
  writeFileSync('dist/site/index.html', html);
  writeFileSync('dist/site/.nojekyll', '');
  let bytes = html.length + js.length;
  for (const f of used) bytes += readFileSync('assets/' + f).length;
  console.log(`dist/site/ — index.html ${(html.length / 1024).toFixed(1)} KB · app.js ${(js.length / 1024).toFixed(1)} KB · ${used.size} eszköz · összesen ${(bytes / 1024 / 1024).toFixed(2)} MB`);
  if (publish) {
    rmSync('../docs/assets', { recursive: true, force: true });
    cpSync('dist/site', '../docs', { recursive: true });
    console.log('→ ../docs frissítve');
  }
}
