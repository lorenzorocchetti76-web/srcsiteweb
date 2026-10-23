import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ENVS, SEG } from "./environments";

gsap.registerPlugin(ScrollTrigger);

export function setupRig(camera, scene) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const envN = ENVS.length;
  const wps = [{ pos: new THREE.Vector3(-7, 3.2, 34), look: new THREE.Vector3(0, 1.5, 0) }];
  for (let i = 0; i < envN; i++) {
    wps.push({
      pos: new THREE.Vector3(i % 2 ? 7 : -7, ENVS[i].camY || 2.6, -i * SEG + 24),
      look: new THREE.Vector3(0, ENVS[i].lookY || 1.2, -i * SEG),
    });
  }
  wps.push({
    pos: new THREE.Vector3(4, 2.2, -(envN - 1) * SEG + 15),
    look: new THREE.Vector3(0, 2.4, -(envN - 1) * SEG),
  });
  const colors = [ENVS[0].bg, ...ENVS.map((e) => e.bg), ENVS[envN - 1].bg].map((b) => new THREE.Color(b));
  const count = wps.length;
  const state = { p: 0 };
  const tmpL = new THREE.Vector3();
  const tmpC = new THREE.Color();
  scene.background = new THREE.Color(ENVS[0].bg);
  const tween = gsap.to(state, {
    p: 1,
    ease: "none",
    scrollTrigger: { trigger: "#track", start: "top top", end: "bottom bottom", scrub: reduced ? 0.2 : 1.15 },
  });
  return {
    active: 0,
    f: 0,
    envF: 0,
    apply() {
      const f = state.p * (count - 1);
      this.f = f;
      this.envF = THREE.MathUtils.clamp(f - 1, 0, envN - 1);
      this.active = Math.round(this.envF);
      const i = Math.min(count - 2, Math.max(0, Math.floor(f)));
      let t = f - i;
      t = t * t * (3 - 2 * t);
      camera.position.lerpVectors(wps[i].pos, wps[i + 1].pos, t);
      tmpL.lerpVectors(wps[i].look, wps[i + 1].look, t);
      camera.lookAt(tmpL);
      tmpC.copy(colors[i]).lerp(colors[i + 1], t);
      scene.background.copy(tmpC);
      scene.fog.color.copy(tmpC);
    },
    destroy() {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
    },
  };
}
