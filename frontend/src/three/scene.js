import * as THREE from "three";
import { logEvent } from "@/utils/logger";

export function detectQuality() {
  const mobile = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 820;
  return {
    mobile,
    antialias: !mobile,
    dpr: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2),
    particles: mobile ? 700 : 1800,
  };
}

export function createScene(canvas, q) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: q.antialias,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(q.dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050505, 14, 62);
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(-7, 2.6, 24);
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    logEvent("error", "webgl context lost");
  });
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  return { renderer, scene, camera };
}
