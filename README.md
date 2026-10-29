# SeatFlow

Aplicació local, en català, per organitzar els llocs dels alumnes a l'aula. Primera versió de treball, amb interfície fosca en tons blaus.

## Provar-la al navegador

[Obrir SeatFlow](https://jjbavatares.github.io/SeatFlow/)

La versió web processa els documents al navegador. Les sessions es desen amb el selector de fitxers o com a descàrregues, i s’obren amb «Obrir sessió desada». No es creen carpetes automàticament a l’escriptori des del web. Les llistes i les sessions no s’envien a GitHub. La còpia automàtica depèn del navegador i pot desaparèixer si se n’esborren les dades: desa un fitxer per conservar el treball.

GitHub Pages publica la branca `main`, carpeta arrel; `.nojekyll` evita transformar els recursos. La versió local conserva el desament a Escriptori/SeatFlow.

## Iniciar l'aplicació

Cal tenir **Node.js 20 o posterior** instal·lat. No cal instal·lar paquets amb `npm install`: les biblioteques del navegador ja estan incloses a `vendor/`.

En Windows, fes doble clic a **`Inicia-SeatFlow.cmd`**. També pots obrir un terminal a la carpeta del projecte i executar:

```sh
npm start
```

Obre **http://127.0.0.1:48765/** al navegador. El servidor només escolta al mateix ordinador; no publica l'aplicació a Internet.

## Funcions principals

- Aules verticals i horitzontals amb espai orientatiu, sense escala real.
- Pupitres individuals, parelles, files de tres i grups de quatre o sis.
- Files completes al davant i places sobrants al darrere.
- Moviment, agrupació, desagrupació i gir de pupitres; els noms acompanyen el gir.
- Taula principal del professor, pissarres, portes i finestres mòbils.
- Nom i primer cognom en dues línies amb la mateixa mida de lletra.
- Zoom, vista completa, pantalla completa del plànol i reixeta amb ajust de posició.
- Assignació de noms arrossegant o seleccionant l'alumne i el pupitre.
- Rebuig de l'assignació a una taula ocupada i desfer/refer.
- Impressió A4 en color o blanc i negre, amb els taulells blancs en aquest últim cas.

## Importar alumnes

Pots escriure o enganxar noms, o importar **PDF amb text, DOCX, XLSX, CSV, TSV o TXT**, també arrossegant el document.

La importació busca les columnes de nom i cognoms i ignora numeració, grup i altres camps. Si les columnes no són clares, demana seleccionar-les. En Excel es llegeix el primer full.

**En PDF, el llistat ha de començar amb la fila numerada 1.** S'importen les files numerades següents, sense capçaleres, peus de pàgina ni números. Els PDF escanejats no són compatibles. Si no es troba la fila 1, es mostra un avís en lloc d'importar text aliè a la llista.

Revisa sempre els noms detectats, especialment els compostos i els cognoms amb partícules.

## Desar i obrir sessions

**Desar sessió** crea automàticament la carpeta **SeatFlow a l'escriptori** i hi guarda un fitxer editable `.seatflow.json`. El nom es pot canviar abans de desar. Si ja existeix, s'afegeix `-v2`, `-v3`, etc.; no se sobreescriu l'anterior.

**Recuperar treball** i **Obrir sessió** mostren el selector de sessions d'aquesta carpeta dins l'aplicació. També es pot triar un fitxer d'una altra carpeta.

**Recuperar còpia automàtica** és una opció separada que utilitza la còpia de recuperació d'aquest navegador. Aquesta còpia no substitueix el fitxer de sessió i pot desaparèixer en netejar les dades del navegador.

**Sortir** comprova si hi ha canvis sense desar i permet desar, cancel·lar o sortir sense desar explícitament. Si es cancel·la el desament o falla, es manté obert. En sortir s'atura el servidor local; la pestanya pot requerir tancament manual.

## Privacitat

Els documents i noms es processen al mateix ordinador. Les sessions es guarden localment, sense servei al núvol ni analítica.

Aquest repositori conté el codi i els recursos de l'aplicació. **No s'hi han d'afegir llistes reals d'alumnes, documents importats ni sessions desades.** El `.gitignore` n'exclou els formats principals. Els noms que apareixen als tests són ficticis.

## Comprovacions

```sh
npm test
```

Els tests cobreixen distribucions, grups, gir del text, reixeta, assignacions, filtratge de columnes, PDF numerats i desament/obertura de sessions. Cal revisar també la llegibilitat i la vista prèvia d'impressió al navegador que s'utilitzarà a l'aula.

## Estructura

- `app.js`, `index.html`, `styles.css`, `readability.css`: interfície i editor.
- `domain.js`: distribucions, geometria, assignacions i validació de sessions.
- `imports.js`, `roster-columns.js`: lectura de documents i selecció dels noms.
- `server.cjs`, `session-store.cjs`: servidor local i fitxers de sessió.
- `assets/`: imatges i elements de l'aula.
- `vendor/`: PDF.js, JSZip i recursos necessaris, amb les llicències corresponents.

Repositori privat en desenvolupament. La privacitat del repositori és independent de la configuració del servidor local.
