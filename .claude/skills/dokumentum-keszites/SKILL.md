---
name: dokumentum-keszites
description: Vékony dispatcher: csak a dokumentum-iro ágenst indítja el a megadott feature kézikönyvének elkészítéséhez. Használd, ha csak dokumentációt kell írni vagy frissíteni a ./docs mappába.
---

# Dokumentum dispatcher

Nincs saját logikád. Ne írj kézikönyvet, ne olvass kódot, ne dönts a tartalomról. Minden szabály és lépés a `dokumentum-iro` ágensben van.

Tedd csak ezt: indítsd el a `dokumentum-iro` ágenst (Agent eszköz, `subagent_type: dokumentum-iro`), és add át neki szó szerint azt, amit a felhasználó kért (a feature leírását és a szerződést, ha van).

Amikor az ágens végzett, add tovább a válaszát röviden.
