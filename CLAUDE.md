# A Feladat — Settings UI prototípus

Kontrolleres Settings-menü prototípus egy Xbox/PC narratív sidescrollerhez (Zsoldos Péter: A Feladat). Nyelv: a kommunikáció és a kódkommentek **magyarul**.

## Parancsok
- Build: `cd prototype && npm install && node build.mjs` → `prototype/dist/a-feladat-beallitasok.html`
- Közzététel: a buildet másold `docs/index.html`-be (a GitHub Pages a `main` ág `/docs` mappájából publikál)
- Típusellenőrzés: `cd prototype && npx tsc -p .`
- Tesztek: `cd prototype && npx esbuild test/store.test.ts --bundle --platform=node --outfile=build/store.test.js && node build/store.test.js`

## Felépítés (prototype/)
- `src/schema.ts` beállítás-definíciók · `src/store.ts` default/saved/draft, dirty, tri-state (tiszta logika, tesztelt)
- `src/input.ts` Gamepad → logikai gomb → kontextusonkénti akció (`BINDINGS`)
- `src/app.ts` állapotgép, render, fókusz, modalok, `ctrlButton()` komponens · `src/i18n.ts` EN/HU (kulcsok = Figma `Language / Settings` tokenek)
- `template.html` CSS + markup; `__ASSET:fájl__` → a build data: URI-vá alakítja (`assets/`)

## Szabályok
- **A Figma az igazság.** Fájl: `U3RgihQeDTZezzsHujjd9r` (Game UI). Vizuális eszközt ne rajzolj újra: a Figma SVG/PNG-jét használd. 1920×1080 referencia, border-box méretezés.
- **A spec:** „A feladat – Settings UI | Funkcionális specifikáció" v1.0 (Google Docs). Ahol nyitott, ott ⚑-gel jelölt munkaérték-konstans van a kódban.
- **Betű:** Comic Neue (teljes TTF beágyazva — a Google Fonts részhalmazából hiányzik az ő/ű és a lengyel). Readable Font: Inter. A Controller/Small (LB/RB) még Kalam.
- **Modal:** a gombjel maga a kötés (X elvetés · A mentés · B mégsem), nincs fókuszmozgatás.
- **Prototípus-eltérés:** a gombgyűrű SVG-k `-1.5px` változata +0,2 px körvonalat kap; az eredetit ne módosítsd.
- Minden változás után: típusellenőrzés + tesztek + build, és vizuális összevetés a Figmával.

## Licenc
© 2026 ZupaGut, minden jog fenntartva. Comic Neue: OFL. A regény és szereplői Zsoldos Péter szellemi tulajdona.
