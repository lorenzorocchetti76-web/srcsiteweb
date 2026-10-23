# PRD — Studio Rocchetti Comunicazione (Landing Page)

## Problem statement (originale)
Landing page completa e responsive in un UNICO file HTML, zero dipendenze esterne, palette esclusiva Nero / Bianco / #224d8a. Animazioni: hero con reveal parola per parola, parallax, griglia prospettica, background che cambia colore attraverso 5 fasi (nero → blu → bianco → blu → nero) sincronizzato con lo scroll, progress bar, reveal cinematici, mask animation, testi outline che si riempiono in hover, card 3D tilt con glow che segue il cursore, numerazione animata + grande numerazione in background, sezione finale con orbita, marquee infinito, contatori animati, navbar glassmorphism, prefers-reduced-motion, mobile responsive. Brand: Studio Rocchetti Comunicazione.

## Architettura
- Home = esperienza 3D React (`src/Experience.jsx`): Three.js + GSAP ScrollTrigger, 5 ambienti natura procedurali (`src/three/environments.js`): 01 Foresta (nero), 02 Oceano (blu profondo), 03 Ghiacciaio (bianco), 04 Tempesta (blu #224d8a), 05 Cielo (nero)
- Camera rig scroll-driven (`src/three/rig.js`): GSAP scrub, waypoint per ambiente, fog/background interpolati
- Interazioni (`src/three/interactions.js`): raycaster hover/tap (pulse elastico), drag look-around, touch `pan-y`
- Overlay UI (`src/components/Overlay.jsx`): loader con %, dots nav, hint gesti, mix-blend-difference per contrasto automatico
- Cache offline: service worker `public/sw.js` (network-first + fallback cache, registrato in `src/index.js`)
- Error logging real-time: `src/utils/logger.js` (coda localStorage, batch POST, flush on online) → backend `POST/GET /api/logs` (Mongo `error_logs`)
- Landing classica preservata: `public/landing.html` (single-file, zero dipendenze), linkata come "Versione classica"
- Performance: DPR cap (1.5 mobile / 2 desktop), no antialias mobile, instancing, particelle ridotte su mobile, update solo ambienti attivi±1, caricamento asincrono progressivo degli ambienti

## Personas
- Potenziale cliente (azienda/brand) che valuta lo studio
- Visitatore da mobile che scorre velocemente
- Utente con prefers-reduced-motion (accessibilità)

## Requisiti core (statici)
- Single-file HTML, palette rigorosa, 5 fasi con transizione cromatica graduale scroll-synced
- Contenuti in italiano, tono editoriale/contemporaneo, tipografia non compressa

## Implementato (23/10/2026) — Branding, testi ufficiali e upgrade cinematico
- Header: "Studio Rocchetti & Partners"; titolo pagina e meta aggiornati
- Percorso: intro ("Dal briefing al risultato.") + 5 fasi ufficiali mappate sulle città (01 Briefing/Ascolto→Roma, 02 Analisi/Strategia→New York, 03 Sviluppo Creativo→Londra, 04 Lancio→Dubai, 05 Monitoraggio→Mosca) con sotto-voci numerate, finale "Diamoci da fare." con CTA mailto INFO@STUDIOROCCHETTI.COM e riga ©
- Grafica "cinematica": materiali PBR + RoomEnvironment (GI simulata via PMREM), tone mapping ACES, rim light posteriore per città, god-ray volumetrici (Roma/Dubai), facciate vetro (metalness alta) vs pietra opaca, ombre PCFSoft desktop
- Città espanse (fino a 260 edifici, altezze crescenti verso i bordi), viali centrali con texture asfalto/strisce generati via canvas, strade trasversali rialzate (no z-fighting), corridoio centrale libero: la camera non attraversa mai gli edifici; le auto non collidono (corsie escluse dal posizionamento edifici)
- Monumenti: Colosseo (Roma), Statua della Libertà (NYC), Tower Bridge (Londra), torre Spasskaja (Mosca); pavimenti lastre spesse 2.4 e larghe 130
- Ciclo orario sempre diurno (0.6..1): intensità sole/rim/finestre oscillano senza mai scendere a notte; meteo variabile (pioggia NYC/Londra, neve Mosca legata al ciclo)
- Verificato via screenshot: Roma (piazza, Colosseo, god-ray), New York (viale, taxi/bus, finestre, Liberty), mapping caption↔città corretto; zero errori console. NOTA: in ambiente headless (rendering software) gli screenshot richiedono attese lunghe; su browser reali con GPU la fluidità è normale

## Implementato (23/10/2026) — Città + vita urbana
- Sostituiti i 5 ambienti natura con 5 città procedurali: Roma (cupola, colonnato, rovine, cipressi, vespe, sole+luna, polvere dorata), New York (170 grattacieli con ~1400 finestre illuminate, Empire-style tower con beacon, taxi e auto in doppia corsia, vapore dai tombini, luna), Londra (Big Ben con orologio animato, London Eye rotante, Tamigi, 2 bus double-decker + 3 black cab, pioggerella, persone con ombrello, cane che passeggia), Dubai (Burj-style spire, torre elicoidale rotante, vela, fontane luminose, falconi, auto di lusso, tramonto+luna), Mosca (San Basilio con 5 cupole colorate, Cremlino, neve, auto con fari accesi, corvi, luna grande)
- Vita urbana ovunque: persone (istanziate con colori casuali), piccioni che beccano, uccelli che volano in cerchio con battito d'ali, traffico animato
- Fix pavimento: lastre solide spesse 0.9 che si affiancano senza sovrapposizioni (eliminato z-fighting e colori sbagliati in transizione); corridoio libero sul percorso camera; nebbia regolata per non far "sbucare" la città vicina
- Sole e luna presenti in ogni città con aloni luminosi
- Verificato via screenshot: Roma, New York, Londra, Dubai, Mosca + transizione intermedia; zero errori console

## Implementato (22/10/2026) — Upgrade cromatico ambienti
- Palette multicolore in tutti gli ambienti: foresta con lucciole ciano/viola/ambra e funghi luminosi pulsanti (corallo, teal, viola), tracce viola sui tronchi; oceano con onde a gradiente turchese→blu→viola (vertex colors), plancton bioluminescente, gocce colorate, anelli di marea attorno alla perla; ghiacciaio con aurora boreale animata (3 nastri verde/ciano/viola/rosa) e cristalli colorati; tempesta indaco con doppio strato di pioggia e arcobaleno che appare dopo ogni lampo; cielo con stelle multicolore, via lattea, 3 nebulose additive (viola/teal/magenta), luna con alone dorato, satelliti colorati collegati da linee di costellazione aggiornate in tempo reale
- Texture generate proceduralmente via canvas (bagliori, aurora) — zero asset esterni
- Verificato via screenshot su tutti e 5 gli ambienti

## Implementato (22/10/2026) — Esperienza 3D natura
- Home sostituita da viaggio 3D a scroll: camera guidata da GSAP ScrollTrigger con scrub inerziale attraverso 5 ambienti natura (foresta con lucciole e luna, oceano con onde animate, ghiacciaio bianco con cristalli in deriva, tempesta con 620 gocce di pioggia e lampi, cielo stellato con luna e satelliti orbitali)
- Ogni ambiente: caption con reveal titolo riga-per-riga + testo (GSAP), numerazione 01-05
- Modelli interattivi: hover scale + tap/click con pulse elastico (raycaster), drag per guardarsi intorno (desktop e touch)
- Caricamento asincrono progressivo degli ambienti con loader %
- Cache persistente offline via service worker (network-first)
- Sistema di log errori real-time: frontend batch → MongoDB, endpoint GET /api/logs per monitoraggio
- Fallback WebGL assente → link versione classica; prefers-reduced-motion rispettato
- Verificato via screenshot: foresta, ghiacciaio, tempesta, cielo su desktop; foresta e tempesta su mobile 375px; POST/GET /api/logs con curl; zero errori console

## Implementato (06/10/2026) — Landing classica (ora su /landing.html)
- Hero: reveal parola per parola con clip+rotazione, griglia prospettica animata, ghost text "ROCCHETTI" outline con parallax, luce dinamica che segue il mouse, scroll hint
- Marquee infinito editoriale (pausa in hover), parole alternate pieno/outline
- Sezione Studio con contatori animati (12 anni, 140+ progetti, 96%, 9 riconoscimenti)
- 5 fasi: 01 Ascolto (nero), 02 Strategia (blu), 03 Identità (bianco, contrasto auto-adattato), 04 Produzione (blu), 05 Lancio (nero) — ciascuna con numero gigante in parallax, elemento grafico astratto dedicato con drift 3D al mouse (desktop), testo con tonalità che passa bianco→azzurro tenue→bianco, lista attività con hover sweep blu
- Attività: 6 card con 3D tilt + glow radiale che segue il cursore
- Finale: orbita con anelli rotanti e CTA magnetica + email outline che si riempie in hover
- Footer: wordmark gigante ROCCHETTI outline→pieno in hover, contatti placeholder, social con micro-rotazioni
- Progress bar top con gradiente animato, navbar glassmorphism che reagisce allo scroll
- prefers-reduced-motion: disattiva parallax, tilt, glow, animazioni; mobile: layout e animazioni semplificate
- Verificato via screenshot: hero, fase blu, fase bianca, finale, mobile 375px — transizione cromatica confermata

## Credenziali
Nessuna (nessuna area riservata).

## Backlog prioritizzato
- P0: sostituire contatti placeholder (email, telefono, indirizzo, P.IVA) con dati reali
- P1: collegare social reali (Instagram/LinkedIn/Behance attualmente "#")
- P1: form contatto funzionante (es. Resend) al posto del solo mailto
- P2: sezione portfolio/case study con immagini reali
- P2: versione inglese con toggle lingua
