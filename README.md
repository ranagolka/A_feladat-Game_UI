# A_feladat-Game_UI
A Feladat videójáték UI tesztelésére készített html prototípus

Kontrollerrel (vagy fejlesztői billentyűkkel) végigjárható Settings-prototípus, a Game UI Figma-terv és a „Settings UI — Funkcionális specifikáció v1.0" alapján. Jelenleg az Audio fül teljes állapotgépe működik (default / modified / saved custom / unsaved), két modallal, hat UI-hanggal, EN/HU szövegekkel.

## Élő oldal (GitHub Pages)

`docs/` — a build kimenete: `index.html`, `app.js` és az `assets/` mappa (Figma-eszközök, Comic Neue, videó, zene).

Bekapcsolás: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `/docs` → Save.**
Cím: `https://ranagolka.github.io/A_feladat-Game_UI/`

## Irányítás

Kontroller (Xbox / standard mapping): LB/RB kategória · D-pad fel/le sor · bal/jobb érték · A alkalmazás · Y alapérték · B vissza. Modalban: X elvetés · A mentés · B mégsem.
Fejlesztői billentyűk: nyilak · Q/E = LB/RB · Enter = A · Esc = B · Y = Y · X = X.

## Fejlesztés

```bash
cd prototype
npm install
node build.mjs --publish       # → dist/site/, és a tartalma a ../docs mappába
node build.mjs --single        # → dist/a-feladat-beallitasok.html — egyetlen önálló fájl
npx esbuild test/store.test.ts --bundle --platform=node --outfile=build/store.test.js && node build/store.test.js
```

## Licenc

© 2026 ZupaGut — minden jog fenntartva (lásd `LICENSE`). A Comic Neue betűtípus a SIL Open Font License 1.1 alatt áll (`prototype/assets/OFL-ComicNeue.txt`). A Feladat című regény és szereplői Zsoldos Péter szellemi tulajdonát képezik.
