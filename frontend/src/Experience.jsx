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

const CAPTIONS = [
  {
    id: "foresta", idx: "01", name: "Foresta",
    lines: ["Nel buio,", "ogni suono", "è direzione."],
    text: "L'esplorazione inizia tra i tronchi: le lucciole blu guidano lo sguardo. Tocca la pietra sospesa, osserva la luna.",
  },
  {
    id: "oceano", idx: "02", name: "Oceano",
    lines: ["Lasciati", "attraversare", "dalla corrente."],
    text: "Una superficie d'acqua che respira sotto di te. Le gocce fluttuano: sfiorale e guardale reagire.",
  },
  {
    id: "ghiacciaio", idx: "03", name: "Ghiacciaio",
    lines: ["La luce", "scolpisce", "il silenzio."],
    text: "Rocce nere su un orizzonte bianco, cristalli di ghiaccio in deriva lenta. Il contrasto è il paesaggio.",
  },
  {
    id: "tempesta", idx: "04", name: "Tempesta",
    lines: ["La pioggia", "tiene", "il ritmo."],
    text: "Seicento gocce cadono insieme e nessuna si ripete. I lampi arrivano quando meno te lo aspetti.",
  },
  {
    id: "cielo", idx: "05", name: "Cielo",
    lines: ["Ogni idea", "trova la sua", "orbita."],
    text: "Il viaggio finisce dove comincia lo spazio. Cinque satelliti, una luna, infinite stelle: la prossima orbita può essere la tua.",
    cta: true,
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
      const items = cap.querySelectorAll(".li, .cap-idx, .cap-text, .cap-cta");
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
        const rig = setupRig(camera, scene, envs.length);
        const inter = setupInteractions(camera, () => envs[rig.active], canvasRef.current);
        const clock = new THREE.Clock();
        setReady(true);
        const loop = () => {
          raf = requestAnimationFrame(loop);
          const dt = Math.min(clock.getDelta(), 0.05);
          const t = clock.elapsedTime;
          rig.apply();
          inter.applyLook(camera);
          const a = rig.active;
          for (let k = Math.max(0, a - 1); k <= Math.min(envs.length - 1, a + 1); k++) envs[k].update(t, dt);
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
        {CAPTIONS.map((c, i) => (
          <section className={"panel" + (i % 2 ? " right" : "")} key={c.id} data-panel={i}>
            <div className="caption" data-testid={"caption-" + c.id}>
              <span className="cap-idx">{c.idx} — {c.name}</span>
              <h2 className="cap-title">
                {c.lines.map((l, j) => (
                  <span className="line" key={j}><span className="li">{l}</span></span>
                ))}
              </h2>
              <p className="cap-text">{c.text}</p>
              {c.cta && (
                <a className="cap-cta" href="mailto:hello@studiorocchetti.it" data-testid="cta-finale">
                  Iniziamo un progetto ↗
                </a>
              )}
            </div>
          </section>
        ))}
      </div>
      <Overlay loadPct={loadPct} ready={ready} failed={failed} />
    </>
  );
}
