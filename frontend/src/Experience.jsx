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
    id: "intro", idx: "Un progetto di Studio Rocchetti Comunicazione", name: "Galleria",
    lines: ["Un viaggio", "nel mondo."],
    text: [
      "Studio Rocchetti Comunicazione presenta un percorso immersivo attraverso cinque città del mondo.",
      "Monumenti, strade e vita quotidiana ricostruiti in 3D. Scorri e lasciati guidare da Roma a Mosca.",
    ],
  },
  {
    id: "roma", idx: "01 / 05", name: "Roma",
    lines: ["L'eternità", "in laterizio", "e oro."],
    text: ["Cupole, colonnati e cipressi sotto un sole che non tramonta mai davvero. La città eterna, dal Colosseo alla piazza."],
    subs: ["Colosseo", "Cupolone"],
  },
  {
    id: "newyork", idx: "02 / 05", name: "New York",
    lines: ["Nove milioni", "di sogni", "accesi."],
    text: ["Migliaia di finestre illuminate, taxi gialli che attraversano la città, un grattacielo che svetta. Ogni luce è una storia."],
    subs: ["Statua della Libertà", "Central Park"],
  },
  {
    id: "londra", idx: "03 / 05", name: "Londra",
    lines: ["Nebbia, pioggia", "e grigio", "perfetto."],
    text: ["Il Big Ben scandisce il tempo, l'Occhio gira lento sul Tamigi e un double-decker rosso taglia la foschia."],
    subs: ["Big Ben", "London Eye"],
  },
  {
    id: "dubai", idx: "04 / 05", name: "Dubai",
    lines: ["Il deserto", "che tocca", "il cielo."],
    text: ["Guglie d'oro e vetro, una torre che ruota su se stessa, fontane di luce nella luce dorata del deserto."],
    subs: ["Burj Khalifa", "Dubai Frame"],
  },
  {
    id: "mosca", idx: "05 / 05", name: "Mosca",
    lines: ["Cupole colorate", "nella", "neve."],
    text: ["Il rosso del Cremlino, le cupole di San Basilio, la neve che cade senza rumore. Il viaggio finisce qui."],
    subs: ["Piazza Rossa", "San Basilio"],
  },
  {
    id: "finale", idx: "Un progetto di Studio Rocchetti Comunicazione", name: "Contatti",
    lines: ["Il prossimo", "viaggio?"],
    text: ["Scrivici e costruiamolo insieme."],
    cta: true,
    footer: "© STUDIO ROCCHETTI comunicazione",
    black: true,
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
          <section className={"panel" + (i % 2 && !c.black ? " right" : "") + (c.black ? " black" : "")} key={c.id} data-panel={i}>
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
