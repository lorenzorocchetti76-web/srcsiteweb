import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createScene, detectQuality } from "@/three/scene";
import { ENVS, SEG, buildEnvironment } from "@/three/environments";
import { setupRig } from "@/three/rig";
import { setupInteractions } from "@/three/interactions";
import { logEvent } from "@/utils/logger";
import Overlay from "@/components/Overlay";

gsap.registerPlugin(ScrollTrigger);

const PANELS = [
  {
    id: "intro", idx: "Studio Rocchetti — Comunicazione", name: "Il metodo",
    lines: ["Dal briefing", "al risultato."],
    text: [
      "Una direzione precisa. Un processo che trasforma ascolto, strategia e creatività in comunicazione misurabile.",
      "Un'idea forte nasce da un'osservazione precisa. Dall'ascolto alla misurazione, ogni fase costruisce la successiva.",
    ],
  },
  {
    id: "roma", idx: "01 / 05", name: "Briefing e Ascolto — Onboarding",
    lines: ["Prima", "ascoltiamo."],
    text: ["L'agenzia incontra il cliente per capire obiettivi, valori, budget e pubblico di riferimento. Si definiscono i messaggi chiave e ciò che il brand vuole comunicare — e ciò che non vuole comunicare."],
    subs: ["Raccolta informazioni", "Analisi iniziale"],
  },
  {
    id: "newyork", idx: "02 / 05", name: "Analisi e Strategia",
    lines: ["Poi", "definiamo."],
    text: ["Studiamo il mercato, i concorrenti e il posizionamento attuale del brand. Il team delinea la strategia di comunicazione, il piano editoriale o il progetto creativo."],
    subs: ["Studio del mercato", "Pianificazione"],
  },
  {
    id: "londra", idx: "03 / 05", name: "Sviluppo Creativo e Tecnico",
    lines: ["Trasformiamo", "le idee."],
    text: ["Art director, copywriter e designer realizzano loghi, grafiche, testi, siti web e campagne pubblicitarie. Le bozze vengono presentate al cliente per raccogliere feedback e revisionare."],
    subs: ["Creazione degli asset", "Revisione e feedback"],
  },
  {
    id: "dubai", idx: "04 / 05", name: "Lancio ed Esecuzione",
    lines: ["Poi", "accendiamo."],
    text: ["Si pubblicano i contenuti, si attivano le campagne media — social, Google, stampa — e si distribuisce il materiale. L'agenzia coordina canali e scadenze in tempo reale."],
    subs: ["Messa online", "Gestione operativa"],
  },
  {
    id: "mosca", idx: "05 / 05", name: "Monitoraggio e Ottimizzazione",
    lines: ["E infine", "misuriamo."],
    text: ["Controlliamo i risultati rispetto agli obiettivi iniziali. L'agenzia condivide report periodici con il cliente e usa i dati per ottimizzare le strategie future."],
    subs: ["Analisi dei dati", "Reportistica"],
  },
  {
    id: "finale", idx: "Non facciamo solo comunicazione. Costruiamo direzione.", name: "Contatti",
    lines: ["Diamoci", "da fare."],
    text: ["Un processo chiaro. Una comunicazione che resta.", "STRATEGIA / CREATIVITÀ / DIGITALE"],
    cta: true,
    footer: "© STUDIO ROCCHETTI comunicazione",
  },
];

export default function Experience() {
  const canvasRef = useRef(null);
  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return undefined;
    const tweens = [];
    gsap.utils.toArray(".caption").forEach((cap) => {
      const items = cap.querySelectorAll(".li, .cap-idx, .cap-text, .cap-sub, .cap-cta, .cap-foot");
      const tw = gsap.fromTo(items,
        { yPercent: 130, opacity: 0 },
        {
          yPercent: 0, opacity: 1, duration: 1.25, stagger: 0.09, ease: "expo.out",
          scrollTrigger: { trigger: cap, start: "top 78%", toggleActions: "play none none reverse" },
        });
      tweens.push(tw);
    });
    return () => tweens.forEach((tw) => { if (tw.scrollTrigger) tw.scrollTrigger.kill(); tw.kill(); });
  }, []);

  useEffect(() => {
    let disposed = false, raf = 0;
    const cleanups = [];
    (async () => {
      try {
        const q = detectQuality();
        const { renderer, scene, camera } = createScene(canvasRef.current, q);
        const envs = [];
        for (let i = 0; i < ENVS.length; i++) {
          await new Promise((r) => setTimeout(r, 80));
          if (disposed) return;
          const env = buildEnvironment(i, q);
          env.group.position.z = -i * SEG;
          scene.add(env.group);
          envs.push(env);
          setLoadPct(Math.round(((i + 1) / ENVS.length) * 100));
        }
        if (disposed) return;
        const rig = setupRig(camera, scene);
        const inter = setupInteractions(camera, () => envs[rig.active], canvasRef.current);
        const clock = new THREE.Clock();
        setReady(true);
        const loop = () => {
          raf = requestAnimationFrame(loop);
          const dt = Math.min(clock.getDelta(), 0.05);
          const t = clock.elapsedTime;
          rig.apply();
          inter.applyLook(camera);
          const ef = rig.envF;
          envs.forEach((e, idx) => {
            const vis = Math.abs(idx - ef) < 1.7;
            e.group.visible = vis;
            if (e.lights) e.lights.forEach((l) => { l.visible = vis; });
          });
          for (let k = Math.max(0, Math.floor(ef) - 1); k <= Math.min(envs.length - 1, Math.ceil(ef) + 1); k++) envs[k].update(t, dt);
          renderer.render(scene, camera);
        };
        loop();
        cleanups.push(() => { cancelAnimationFrame(raf); inter.destroy(); rig.destroy(); renderer.dispose(); });
      } catch (err) {
        logEvent("error", "init: " + ((err && err.message) || err), { stack: (err && err.stack) || "" });
        setFailed(true);
      }
    })();
    return () => { disposed = true; cleanups.forEach((fn) => fn()); };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="gl" data-testid="gl-canvas" aria-hidden="true" />
      <div id="track">
        {PANELS.map((c, i) => (
          <section className={"panel" + (i % 2 ? " right" : "")} key={c.id} data-panel={i}>
            <div className="caption" data-testid={"caption-" + c.id}>
              <span className="cap-idx">{c.idx}</span>
              <h2 className="cap-title">
                {c.lines.map((l, j) => (
                  <span className="line" key={j}><span className="li">{l}</span></span>
                ))}
              </h2>
              {c.text.map((p, j) => (
                <p className="cap-text" key={j}>{p}</p>
              ))}
              {c.subs && (
                <ul className="cap-subs" data-testid={"subs-" + c.id}>
                  {c.subs.map((s, j) => (
                    <li className="cap-sub" key={j}><i>0{j + 1}</i><b>{s}</b></li>
                  ))}
                </ul>
              )}
              {c.cta && (
                <a className="cap-cta" href="mailto:INFO@STUDIOROCCHETTI.COM" data-testid="cta-finale">
                  Scrivici — info@studiorocchetti.com ↗
                </a>
              )}
              {c.footer && <p className="cap-foot" data-testid="footer-line">{c.footer}</p>}
            </div>
          </section>
        ))}
      </div>
      <Overlay loadPct={loadPct} ready={ready} failed={failed} />
    </>
  );
}
