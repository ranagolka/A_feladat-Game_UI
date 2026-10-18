// Egyfájlos build: a TypeScript bundle beágyazva a sablonba → dist/a-feladat-beallitasok.html
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const out = await build({
  entryPoints: ['src/main.ts'], bundle: true, format: 'iife', target: 'es2020',
  minify: false, write: false, legalComments: 'none',
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
// A Figma-eszközök data: URI-ként ágyazódnak be (az Artifact csak beágyazott képet enged).
const mime = { png: 'image/png', jpg: 'image/jpeg', mp3: 'audio/mpeg', mp4: 'video/mp4', svg: 'image/svg+xml', ttf: 'font/ttf', webp: 'image/webp' };
const html = readFileSync('template.html', 'utf8')
  .replace(/__ASSET:([\w.-]+)__/g, (_, f) => {
    const ext = f.split('.').pop();
    return `data:${mime[ext]};base64,${readFileSync('assets/' + f).toString('base64')}`;
  })
  .replace('/*__BUNDLE__*/', () => js);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/a-feladat-beallitasok.html', html);
console.log(`dist/a-feladat-beallitasok.html — ${(html.length / 1024).toFixed(1)} KB`);
