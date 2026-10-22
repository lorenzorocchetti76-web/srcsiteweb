import * as THREE from "three";
import gsap from "gsap";

export function setupInteractions(camera, getActiveEnv, dom) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  let down = false, lx = 0, ly = 0, travel = 0, hovered = null;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function castAt(cx, cy) {
    const env = getActiveEnv();
    if (!env) return null;
    ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(env.interactive, false);
    return hits.length ? hits[0].object : null;
  }

  function pulse(o) {
    const s = o.userData.s || 1;
    gsap.fromTo(o.scale,
      { x: s * 1.3, y: s * 1.3, z: s * 1.3 },
      { x: s, y: s, z: s, duration: 1.1, ease: "elastic.out(1,.45)", overwrite: true });
  }

  function onMove(e) {
    if (down) {
      look.tx = THREE.MathUtils.clamp(look.tx + (e.clientX - lx) * 0.0022, -0.45, 0.45);
      look.ty = THREE.MathUtils.clamp(look.ty + (e.clientY - ly) * 0.0022, -0.3, 0.3);
      travel += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly);
      lx = e.clientX; ly = e.clientY;
    } else if (finePointer && !reduced) {
      const o = castAt(e.clientX, e.clientY);
      if (o !== hovered) {
        if (hovered) {
          const s = hovered.userData.s || 1;
          gsap.to(hovered.scale, { x: s, y: s, z: s, duration: 0.5, ease: "power3.out", overwrite: true });
        }
        hovered = o;
        dom.style.cursor = o ? "pointer" : "";
        if (o) {
          const s = o.userData.s || 1;
          gsap.to(o.scale, { x: s * 1.14, y: s * 1.14, z: s * 1.14, duration: 0.5, ease: "power3.out", overwrite: true });
        }
      }
    }
  }

  function onDown(e) { down = true; travel = 0; lx = e.clientX; ly = e.clientY; }

  function onUp(e) {
    if (down && travel < 8) {
      const o = castAt(e.clientX, e.clientY);
      if (o) pulse(o);
    }
    down = false;
  }

  dom.addEventListener("pointermove", onMove, { passive: true });
  dom.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });

  return {
    applyLook(cam) {
      if (reduced) return;
      look.x += (look.tx - look.x) * 0.06;
      look.y += (look.ty - look.y) * 0.06;
      cam.rotateY(-look.x);
      cam.rotateX(-look.y);
    },
    destroy() {
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    },
  };
}
