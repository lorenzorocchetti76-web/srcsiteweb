# PRD — Studio Rocchetti Comunicazione (Landing Page)

## Problem statement (originale)
Landing page completa e responsive in un UNICO file HTML, zero dipendenze esterne, palette esclusiva Nero / Bianco / #224d8a. Animazioni: hero con reveal parola per parola, parallax, griglia prospettica, background che cambia colore attraverso 5 fasi (nero → blu → bianco → blu → nero) sincronizzato con lo scroll, progress bar, reveal cinematici, mask animation, testi outline che si riempiono in hover, card 3D tilt con glow che segue il cursore, numerazione animata + grande numerazione in background, sezione finale con orbita, marquee infinito, contatori animati, navbar glassmorphism, prefers-reduced-motion, mobile responsive. Brand: Studio Rocchetti Comunicazione.

## Architettura
- Un unico file: `/app/frontend/public/index.html` (HTML + CSS + JS inline, nessuna libreria, nessun font esterno — system font stack Helvetica/Georgia)
- Servito come pagina principale dal dev server CRA; `src/App.js` reso neutro (render null), `src/index.css` svuotato per garantire zero richieste esterne
- Favicon: SVG inline data-URI (mark quadrato blu + dot bianco, stesso del logo in navbar)
- Nessun backend, nessun database, nessuna autenticazione

## Personas
- Potenziale cliente (azienda/brand) che valuta lo studio
- Visitatore da mobile che scorre velocemente
- Utente con prefers-reduced-motion (accessibilità)

## Requisiti core (statici)
- Single-file HTML, palette rigorosa, 5 fasi con transizione cromatica graduale scroll-synced
- Contenuti in italiano, tono editoriale/contemporaneo, tipografia non compressa

## Implementato (06/10/2026)
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
