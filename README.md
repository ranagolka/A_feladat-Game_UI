# A_feladat-Game_UI
A Feladat videójáték UI tesztelésére készített html prototípus

Kontrollerrel (vagy fejlesztői billentyűkkel) végigjárható Settings-prototípus, a Game UI Figma-terv és a „Settings UI — Funkcionális specifikáció v1.0" alapján. Jelenleg az Audio fül teljes állapotgépe működik (default / modified / saved custom / unsaved), két modallal, hat UI-hanggal, EN/HU szövegekkel.

## Élő oldal (GitHub Pages)

`docs/index.html` — egyetlen önálló fájl, minden Figma-eszköz és a teljes Comic Neue font beágyazva.

Bekapcsolás: **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `/docs` → Save.**
Cím: `https://ranagolka.github.io/A_feladat-Game_UI/`

## Irányítás

Kontroller (Xbox / standard mapping): LB/RB kategória · D-pad fel/le sor · bal/jobb érték · A alkalmazás · Y alapérték · B vissza. Modalban: X elvetés · A mentés · B mégsem.
Fejlesztői billentyűk: nyilak · Q/E = LB/RB · Enter = A · Esc = B · Y = Y · X = X.

## Fejlesztés

```bash
cd prototype
npm install
node build.mjs                 # → dist/a-feladat-beallitasok.html
cp dist/a-feladat-beallitasok.html ../docs/index.html
npx esbuild test/store.test.ts --bundle --platform=node --outfile=build/store.test.js && node build/store.test.js
```

## Licenc

A Comic Neue betűtípus a SIL Open Font License alatt áll (`prototype/assets/OFL-ComicNeue.txt`) — a repó CC0-licence erre nem vonatkozik. A Figma-eszközök (háttér, keretek, gyűrűk) a projekt saját tervei.
