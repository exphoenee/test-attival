---
name: build-feature
description: Workflow új funkció vagy módosítás elkészítéséhez a sima HTML/CSS/JS projektben. Négy ágenst (html-iro, css-keszito, javascript-programozo, dokumentum-iro) hív egyszerre, majd összeveti az eredményt. Használd, ha a felhasználó új feature-t, oldalt, komponenst vagy változtatást kér a projekthez.
---

# Feature workflow: négy ágens egyszerre

A projekt sima HTML, build lépés és keretrendszer nélkül. Az adatok a localStorage-ban vannak. A felület nyelve magyar. Te vagy a koordinátor: te tervezel és ellenőrzöl, a fájlokat az ágensek írják.

Előbb olvasd el a `.claude/rules/` mappa szabályait, és tartsd be őket. Ezek mindenben elsőbbséget élveznek.

| Ágens | Mit ír | Mihez nyúlhat |
|---|---|---|
| `html-iro` | szerkezet, feliratok | csak `.html` |
| `css-keszito` | megjelenés, téma, reszponzivitás | csak `.css` |
| `javascript-programozo` | viselkedés, adatok | csak `.js` |
| `dokumentum-iro` | használati kézikönyv (minden szabály az ágensben van; önállóan a `dokumentum-keszites` vékony dispatcher is indítja) | csak `docs/` |

## 1. Megértés
- Olvasd el a meglévő fájlokat (`index.html`, `style.css`, `app.js`, `theme.js`, további oldalak), hogy tudd, mihez illeszkedjen az új feature.
- Ha a kérés félreérthető, és a válasz megváltoztatná a megvalósítást, kérdezz. Egyébként válassz észszerű alapértelmezést, és jelezd.
- Ha a feature új adatot tárol, ne törd meg a meglévő localStorage-formátumot. Ha mégis változik, a migrációt is a szerződésbe írd.

## 2. Szerződés
A három kódágens egyszerre dolgozik, és nem látják egymás munkáját, ezért **előbb írd meg a közös szerződést**. Ez tartalmazza:
- a feature rövid leírását és a felhasználói működést,
- minden új vagy módosuló elemet: `id`, osztálynév, `data-` attribútum, és a felületi felirat szó szerint (magyarul),
- az új vagy módosuló fájlokat (a `<link>` és `<script src>` hivatkozásokkal együtt),
- az adatformátumot (localStorage-kulcs, mezők, migráció),
- az új CSS-változókat, ha van.

Az ágensek ezt a szöveget kapják meg, és szó szerint ehhez tartják magukat.

## 3. Négy ágens egyszerre
Hívd meg mind a négy ágenst **egyetlen üzenetben, egyszerre** (az Agent eszköz négy hívása egy válaszban, a `subagent_type` értékei: `html-iro`, `css-keszito`, `javascript-programozo`, `dokumentum-iro`). Ne várj az egyikre, mielőtt a többit elindítod.

Mindegyik promptja tartalmazza:
- a feature leírását és a teljes szerződést,
- a saját fájljait, amelyeket írhat,
- azt, hogy más ágensek fájljaihoz ne nyúljon.

A hívások a háttérben futnak. Várd meg mind a négy befejezését, mielőtt a 4. lépésre lépsz.

## 4. Összevetés (te végzed)
Amikor mind a négy kész, ellenőrizd az összhangot:
- Minden `id`, amelyre a JS hivatkozik (`getElementById`, `querySelector`), létezik a HTML-ben.
- Minden osztály, amelyre a CSS szabályt ír, vagy amelyet a JS beállít, létezik, és a nevek szó szerint egyeznek.
- Minden `<script src>` és `<link>` létező fájlra mutat.
- A HTML-ben nincs inline `<style>`, `<script>`, `style=""` vagy `onclick=""` (kivéve a futásidőben dőlő értékeket).
- A kézikönyv feliratai egyeznek a kész HTML feliratokkal, és csak működő funkciót ír le.
- A `docs/README.md` listájában szerepel az új kézikönyv.
- `node --check` lefut minden módosított `.js` fájlon.
- Világos és sötét témában is van értéke minden új CSS-változónak.

Ha eltérést találsz, mondd meg pontosan az érintett ágensnek (`SendMessage`-dzsel, vagy új hívással), mit javítson. A javítást ne te írd át, hacsak nem egyetlen szó az egész.

## 5. Kipróbálás
Ha lehet, próbáld ki a feature-t böngészőben. Ha nem tudtad kipróbálni, mondd ki.

## 6. Lezárás
Foglald össze röviden: mely fájlok változtak (HTML, CSS, JS, kézikönyv külön felsorolva), mit javítottál az összevetés során, hol van a kézikönyv, és mit nem sikerült kipróbálni.
