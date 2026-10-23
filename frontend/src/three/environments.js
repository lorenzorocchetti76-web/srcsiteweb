import * as THREE from "three";

export const SEG = 60;

export const ENVS = [
  { id: "roma",     idx: "01", name: "Roma",     bg: "#84b5dd", camY: 2.4, lookY: 1.2 },
  { id: "newyork",  idx: "02", name: "New York", bg: "#6aa3d8", camY: 3.0, lookY: 3.0 },
  { id: "londra",   idx: "03", name: "Londra",   bg: "#93a8b8", camY: 2.6, lookY: 1.6 },
  { id: "dubai",    idx: "04", name: "Dubai",    bg: "#8fc3e2", camY: 3.4, lookY: 4.0 },
  { id: "mosca",    idx: "05", name: "Mosca",    bg: "#b5cadd", camY: 2.4, lookY: 1.8 },
];

export function buildEnvironment(i, q) {
  return [roma, newyork, londra, dubai, mosca][i](q);
}

/* ================= helpers ================= */
function glowTexture(inner, mid) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.4, mid);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function facadeTextures(base, litPalette, litProb) {
  const mc = document.createElement("canvas"); mc.width = 64; mc.height = 96;
  const ec = document.createElement("canvas"); ec.width = 64; ec.height = 96;
  const mg = mc.getContext("2d"), eg = ec.getContext("2d");
  mg.fillStyle = base; mg.fillRect(0, 0, 64, 96);
  eg.fillStyle = "#000000"; eg.fillRect(0, 0, 64, 96);
  for (let r = 0; r < 11; r++) {
    for (let c = 0; c < 5; c++) {
      const x = 6 + c * 11, y = 6 + r * 8;
      const lit = Math.random() < litProb;
      const col = lit ? litPalette[(Math.random() * litPalette.length) | 0] : "rgba(12,14,18,0.9)";
      mg.fillStyle = col; mg.fillRect(x, y, 7, 5);
      if (lit) { eg.fillStyle = col; eg.fillRect(x, y, 7, 5); }
    }
  }
  const map = new THREE.CanvasTexture(mc); map.colorSpace = THREE.SRGBColorSpace;
  const emap = new THREE.CanvasTexture(ec); emap.colorSpace = THREE.SRGBColorSpace;
  return { map, emap };
}

function slab(color, sizeX, topY, thick, sizeZ) {
  const t = thick || 2.4;
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(sizeX, t, sizeZ || 60),
    new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 }));
  m.position.y = topY - t / 2;
  m.receiveShadow = true;
  return m;
}

function coloredPoints(count, spreadX, spreadZ, yMin, yMax, palette, size, additive) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const cs = palette.map((h) => new THREE.Color(h));
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spreadX;
    pos[i * 3 + 1] = yMin + Math.random() * (yMax - yMin);
    pos[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;
    const c = cs[(Math.random() * cs.length) | 0];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({
    size, vertexColors: true, transparent: true, opacity: 0.95,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !additive,
  }));
}

function blockCity(opts) {
  const { count, palette, area, hMin, hMax, clearR, groundY, camX, roads = [], variants } = opts;
  const K = variants.length;
  const per = Math.ceil(count / K) + 2;
  const meshes = variants.map((v) => {
    const mat = new THREE.MeshStandardMaterial({
      map: v.map, emissiveMap: v.emap, emissive: 0xffffff,
      emissiveIntensity: 0.25,
      roughness: v.roughness !== undefined ? v.roughness : 0.92,
      metalness: v.metalness !== undefined ? v.metalness : 0.05,
    });
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, per);
    im.castShadow = true; im.receiveShadow = true;
    return im;
  });
  const d = new THREE.Object3D(); const c = new THREE.Color();
  const placed = []; const counts = new Array(K).fill(0);
  let guard = 0;
  while (placed.length < count && guard < count * 8) {
    guard++;
    const x = (Math.random() - 0.5) * area[0], z = (Math.random() - 0.5) * area[1];
    if (Math.hypot(x, z) < clearR) continue;
    if (Math.abs(x) < 11.5) continue;
    if (roads.some((rz) => Math.abs(z - rz) < 2.6)) continue;
    const edge = 0.55 + Math.min(1, Math.abs(x) / (area[0] / 2)) * 0.9;
    const h = (hMin + Math.random() * (hMax - hMin)) * edge;
    const w = 1 + Math.random() * 2.2, dep = 1 + Math.random() * 2.2;
    d.position.set(x, groundY + h / 2, z);
    d.scale.set(w, h, dep);
    d.rotation.y = Math.random() * 0.2 - 0.1;
    d.updateMatrix();
    const k = placed.length % K;
    meshes[k].setMatrixAt(counts[k], d.matrix);
    c.set(palette[(Math.random() * palette.length) | 0]);
    meshes[k].setColorAt(counts[k], c);
    counts[k]++;
    placed.push({ x, z, w, dep, h });
  }
  meshes.forEach((m, k) => {
    m.count = counts[k];
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  const g = new THREE.Group();
  meshes.forEach((m) => g.add(m));
  return { group: g, placed, mats: meshes.map((m) => m.material) };
}

function onionDome(r, colorMain, colorBand) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshStandardMaterial({ color: colorMain, roughness: 0.55, metalness: 0.2 }));
  s.scale.y = 1.3; s.castShadow = true;
  const band = new THREE.Mesh(new THREE.TorusGeometry(r * 0.82, r * 0.1, 6, 18), new THREE.MeshStandardMaterial({ color: colorBand, roughness: 0.4, metalness: 0.5 }));
  band.rotation.x = Math.PI / 2; band.position.y = r * 0.35;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.24, r * 0.9, 8), new THREE.MeshStandardMaterial({ color: colorBand, metalness: 0.6, roughness: 0.35 }));
  tip.position.y = r * 1.72;
  g.add(s, band, tip);
  g.userData.dome = s;
  return g;
}

function roadTexture(base, side, line) {
  const c = document.createElement("canvas");
  c.width = 128; c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, 128, 512);
  g.fillStyle = side;
  g.fillRect(0, 0, 18, 512); g.fillRect(110, 0, 18, 512);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = "rgba(0,0,0," + (Math.random() * 0.08) + ")";
    g.fillRect(Math.random() * 128, Math.random() * 512, 1, 1);
  }
  g.fillStyle = line;
  for (let y = 0; y < 512; y += 32) g.fillRect(62, y, 4, 18);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 3);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function avenue(base, side, line) {
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(14, 0.08, 60),
    new THREE.MeshStandardMaterial({ map: roadTexture(base, side, line), roughness: 0.95 }));
  strip.position.y = -3.985;
  strip.receiveShadow = true;
  return strip;
}

function crossStreet(color, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(130, 0.06, 5.6),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
  m.position.set(0, -3.93, z);
  m.receiveShadow = true;
  return m;
}

function godRays(color, n, sx, sz) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(2.2 + i * 0.8, 22, 12, 1, true),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.position.set(sx + i * 3, 6, sz - i * 2);
    cone.rotation.z = 0.35;
    g.add(cone);
  }
  return g;
}

function envLights(cfg, q) {
  const sun = new THREE.DirectionalLight(cfg.sunColor, cfg.sunI);
  sun.position.set(cfg.sunPos[0], cfg.sunPos[1], cfg.sunPos[2]);
  if (!q.mobile) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26;
    sc.near = 1; sc.far = 90;
  }
  const hemi = new THREE.HemisphereLight(cfg.sky, cfg.ground, cfg.hemiI);
  const rim = new THREE.DirectionalLight(cfg.rimColor || 0xffffff, cfg.rimI !== undefined ? cfg.rimI : 0.8);
  rim.position.set(0, 18, -42);
  return { sun, hemi, rim, cfg };
}

function peopleDetailed(count, colors, xr, zr, groundY) {
  const torsoG = new THREE.CylinderGeometry(0.09, 0.12, 0.5, 6);
  const headG = new THREE.SphereGeometry(0.095, 8, 8);
  const armG = new THREE.BoxGeometry(0.05, 0.42, 0.05);
  armG.translate(0, -0.21, 0);
  const legG = new THREE.BoxGeometry(0.06, 0.5, 0.06);
  legG.translate(0, -0.25, 0);
  const torsos = new THREE.InstancedMesh(torsoG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), count);
  const heads = new THREE.InstancedMesh(headG, new THREE.MeshStandardMaterial({ color: 0xd9b28c, roughness: 0.8 }), count);
  const arms = new THREE.InstancedMesh(armG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 }), count * 2);
  const legs = new THREE.InstancedMesh(legG, new THREE.MeshStandardMaterial({ color: 0x23242a, roughness: 0.95 }), count * 2);
  [torsos, heads, arms, legs].forEach((m) => { m.castShadow = true; });
  const d = new THREE.Object3D(); const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const x = xr[0] + Math.random() * (xr[1] - xr[0]);
    const z = zr[0] + Math.random() * (zr[1] - zr[0]);
    const s = 0.85 + Math.random() * 0.3;
    const rot = Math.random() * Math.PI * 2;
    const col = colors[(Math.random() * colors.length) | 0];
    d.scale.setScalar(s); d.rotation.set(0, rot, 0);
    d.position.set(x, groundY + 0.62 * s, z); d.updateMatrix();
    torsos.setMatrixAt(i, d.matrix);
    c.set(col); torsos.setColorAt(i, c);
    d.position.y = groundY + 0.98 * s; d.updateMatrix();
    heads.setMatrixAt(i, d.matrix);
    d.position.set(x, groundY + 0.85 * s, z);
    d.rotation.z = 0.3; d.updateMatrix();
    arms.setMatrixAt(i * 2, d.matrix);
    d.rotation.z = -0.3; d.updateMatrix();
    arms.setMatrixAt(i * 2 + 1, d.matrix);
    c.set(col); arms.setColorAt(i * 2, c); arms.setColorAt(i * 2 + 1, c);
    d.rotation.set(0, rot, 0);
    d.position.set(x - 0.05, groundY + 0.5 * s, z); d.updateMatrix();
    legs.setMatrixAt(i * 2, d.matrix);
    d.position.set(x + 0.05, groundY + 0.5 * s, z); d.updateMatrix();
    legs.setMatrixAt(i * 2 + 1, d.matrix);
  }
  [torsos, heads, arms, legs].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  const g = new THREE.Group();
  g.add(torsos, heads, arms, legs);
  return g;
}

function umbrellaPeople(count, colors, xr, zr, groundY) {
  const g = peopleDetailed(count, ["#2a2d33"], xr, zr, groundY);
  const umbs = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.36, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), count);
  const d = new THREE.Object3D(); const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    d.position.set(xr[0] + Math.random() * (xr[1] - xr[0]), groundY + 1.12, zr[0] + Math.random() * (zr[1] - zr[0]));
    d.rotation.y = Math.random() * Math.PI;
    d.updateMatrix(); umbs.setMatrixAt(i, d.matrix);
    c.set(colors[(Math.random() * colors.length) | 0]);
    umbs.setColorAt(i, c);
  }
  if (umbs.instanceColor) umbs.instanceColor.needsUpdate = true;
  g.add(umbs);
  return g;
}

function figure(color, s, skin) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 6), mat);
  torso.position.y = 0.62;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.095, 8, 8), new THREE.MeshStandardMaterial({ color: skin || 0xd9b28c, roughness: 0.8 }));
  head.position.y = 0.98;
  const armG = new THREE.BoxGeometry(0.05, 0.42, 0.05); armG.translate(0, -0.21, 0);
  const legG = new THREE.BoxGeometry(0.06, 0.5, 0.06); legG.translate(0, -0.25, 0);
  const armL = new THREE.Mesh(armG, mat); armL.position.set(-0.13, 0.85, 0);
  const armR = new THREE.Mesh(armG, mat); armR.position.set(0.13, 0.85, 0);
  const legL = new THREE.Mesh(legG, new THREE.MeshStandardMaterial({ color: 0x23242a, roughness: 0.95 }));
  legL.position.set(-0.06, 0.5, 0);
  const legR = legL.clone(); legR.position.x = 0.06;
  g.add(torso, head, armL, armR, legL, legR);
  g.scale.setScalar(s || 1);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData = { armL, armR, legL, legR, ph: Math.random() * 6 };
  return g;
}

function walkCycle(f, t, sp) {
  const u = f.userData;
  const w = Math.sin(t * sp + u.ph) * 0.55;
  u.legL.rotation.x = w; u.legR.rotation.x = -w;
  u.armL.rotation.x = -w * 0.8; u.armR.rotation.x = w * 0.8;
}

function argueCycle(f, t) {
  const u = f.userData;
  u.armL.rotation.x = -1.7 + Math.sin(t * 5 + u.ph) * 0.7;
  u.armR.rotation.x = -1.7 + Math.sin(t * 5 + u.ph + Math.PI) * 0.7;
  u.armL.rotation.z = 0.35; u.armR.rotation.z = -0.35;
}

function makeCar(color, len, headlights) {
  const L = len || 1.15;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 0.5), new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.6 }));
  body.position.y = 0.26; body.castShadow = true;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(L * 0.55, 0.22, 0.44), new THREE.MeshStandardMaterial({ color: 0x0d1117, roughness: 0.15, metalness: 0.4 }));
  cab.position.y = 0.5;
  const wheelG = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8);
  wheelG.rotateX(Math.PI / 2);
  const wheelM = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.9 });
  [[-L * 0.32, 0.24], [L * 0.32, 0.24], [-L * 0.32, -0.24], [L * 0.32, -0.24]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(wheelG, wheelM);
    w.position.set(wx, 0.09, wz);
    g.add(w);
  });
  g.add(body, cab);
  if (headlights) {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5),
      new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,240,190,0.5)", "rgba(255,200,120,0.12)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    h.position.set(L / 2 + 0.6, 0.26, 0);
    h.rotation.y = Math.PI / 2;
    g.add(h);
  }
  return g;
}

function makeBus() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.95, 0.7), new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: 0.4, metalness: 0.3 }));
  body.position.y = 0.6; body.castShadow = true;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.1, 0.72), new THREE.MeshStandardMaterial({ color: 0xf2ead2 }));
  stripe.position.y = 0.78;
  const wins = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.72), new THREE.MeshStandardMaterial({ color: 0x101820, roughness: 0.2 }));
  wins.position.y = 0.97;
  const wheelG = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 8);
  wheelG.rotateX(Math.PI / 2);
  const wheelM = new THREE.MeshStandardMaterial({ color: 0x0a0a0c });
  [[-0.8, 0.32], [0.8, 0.32], [-0.8, -0.32], [0.8, -0.32]].forEach(([wx, wz]) => {
    const w = new THREE.Mesh(wheelG, wheelM);
    w.position.set(wx, 0.12, wz);
    g.add(w);
  });
  g.add(body, stripe, wins);
  return g;
}

function traffic(items) {
  return { update(t) {
    items.forEach((it) => {
      const x = ((it.off + t * it.sp) % 46) - 23;
      it.mesh.position.set(it.dir > 0 ? x : -x, it.y, it.lane);
      it.mesh.rotation.y = it.dir > 0 ? 0 : Math.PI;
    });
  }};
}

function birds(count, color, yBase, maxR, zCenter) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const b = new THREE.Group();
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.14), new THREE.MeshStandardMaterial({ color }));
    w1.position.x = -0.22;
    const w2 = w1.clone(); w2.position.x = 0.22;
    b.add(w1, w2);
    b.userData = { ph: Math.random() * Math.PI * 2, r: 6 + Math.random() * maxR, sp: 0.15 + Math.random() * 0.25, y: yBase + Math.random() * 4, w1, w2 };
    g.add(b);
  }
  g.userData.update = function (t) {
    g.children.forEach((b) => {
      const u = b.userData;
      b.position.set(Math.cos(u.ph + t * u.sp) * u.r, u.y + Math.sin(t * 0.9 + u.ph) * 0.6, Math.sin(u.ph + t * u.sp) * u.r * 0.6 + zCenter);
      b.rotation.y = -(u.ph + t * u.sp) - Math.PI / 2;
      const f = 0.35 + Math.sin(t * 9 + u.ph) * 0.35;
      u.w1.rotation.z = f; u.w2.rotation.z = -f;
    });
  };
  return g;
}

function pigeons(count, groundY, xr, zr) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const p = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6),
      new THREE.MeshStandardMaterial({ color: [0x8a8f96, 0x6e7378, 0xa8adb2][i % 3], roughness: 0.9 }));
    body.scale.set(1, 0.9, 1.25); body.position.y = 0.1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), new THREE.MeshStandardMaterial({ color: 0x4e5459 }));
    head.position.set(0, 0.2, 0.12);
    p.add(body, head);
    p.position.set(xr[0] + Math.random() * (xr[1] - xr[0]), groundY, zr[0] + Math.random() * (zr[1] - zr[0]));
    p.rotation.y = Math.random() * Math.PI * 2;
    p.userData = { ph: Math.random() * Math.PI * 2, head };
    g.add(p);
  }
  g.userData.update = function (t) {
    g.children.forEach((p) => {
      p.userData.head.position.y = 0.2 - Math.max(0, Math.sin(t * 3 + p.userData.ph)) * 0.09;
    });
  };
  return g;
}

function dog(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.18), mat);
  body.position.y = 0.3;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), mat);
  head.position.set(0.3, 0.42, 0);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), mat);
  tail.position.set(-0.3, 0.4, 0); tail.rotation.z = 0.5;
  const legG = new THREE.BoxGeometry(0.05, 0.2, 0.05);
  [[0.18, 0.06], [0.18, -0.06], [-0.18, 0.06], [-0.18, -0.06]].forEach(([lx, lz]) => {
    const l = new THREE.Mesh(legG, mat);
    l.position.set(lx, 0.1, lz);
    g.add(l);
  });
  g.add(body, head, tail);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData = { tail };
  return g;
}

function cat(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), mat);
  body.scale.set(1, 0.9, 1.3); body.position.y = 0.14;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), mat);
  head.position.set(0, 0.3, 0.16);
  const earG = new THREE.ConeGeometry(0.035, 0.07, 4);
  const e1 = new THREE.Mesh(earG, mat); e1.position.set(-0.05, 0.39, 0.16);
  const e2 = e1.clone(); e2.position.x = 0.05;
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 6, 10, Math.PI * 0.8), mat);
  tail.position.set(0, 0.1, -0.2); tail.rotation.x = -0.6;
  g.add(body, head, e1, e2, tail);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData = { tail };
  return g;
}

function airplane(q) {
  const g = new THREE.Group();
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 2.4, 8), new THREE.MeshStandardMaterial({ color: 0xe8ecf0, roughness: 0.3, metalness: 0.6 }));
  fus.rotation.z = Math.PI / 2;
  const wings = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 2.8), new THREE.MeshStandardMaterial({ color: 0xc8ccd4, metalness: 0.5, roughness: 0.4 }));
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: 0xc0392b }));
  tail.position.set(-1.1, 0.25, 0);
  const lightL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff4040 }));
  lightL.position.set(0, 0, 1.4);
  const lightR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), new THREE.MeshBasicMaterial({ color: 0x40ff80 }));
  lightR.position.set(0, 0, -1.4);
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(7, 0.18),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }));
  trail.position.set(-4.8, 0.1, 0);
  g.add(fus, wings, tail, lightL, lightR, trail);
  g.userData = { lightL, lightR, off: Math.random() * 90, sp: 7 + Math.random() * 3, y: 14 + Math.random() * 4, z: -24 - Math.random() * 6 };
  return g;
}

function flyPlane(p, t) {
  const u = p.userData;
  const x = ((u.off + t * u.sp) % 90) - 45;
  p.position.set(x, u.y, u.z);
  const blink = Math.sin(t * 6) > 0;
  u.lightL.visible = blink; u.lightR.visible = !blink;
}

function ufo() {
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.SphereGeometry(1.6, 18, 12), new THREE.MeshStandardMaterial({ color: 0x9aa2b0, metalness: 0.9, roughness: 0.25 }));
  disc.scale.y = 0.32; disc.castShadow = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.65, 14, 10), new THREE.MeshStandardMaterial({ color: 0x7ef0ff, emissive: 0x2a8aa0, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 }));
  dome.position.y = 0.45;
  g.add(disc, dome);
  const rim = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), new THREE.MeshBasicMaterial({ color: [0xff5050, 0x50ff9a, 0x50a0ff, 0xffd050][i % 4] }));
    l.position.set(Math.cos(a) * 1.45, -0.15, Math.sin(a) * 1.45);
    g.add(l); rim.push(l);
  }
  const beam = new THREE.Mesh(new THREE.ConeGeometry(1.3, 4.5, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x9affc8, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.y = -2.4;
  g.add(beam);
  g.userData = { rim, beam, s: 1 };
  return g;
}

function flyUfo(u, t, cx, cy, cz) {
  u.position.set(cx + Math.sin(t * 0.3) * 6, cy + Math.sin(t * 0.8) * 0.8, cz + Math.cos(t * 0.22) * 4);
  u.rotation.y = t * 0.9;
  u.rotation.z = Math.sin(t * 0.5) * 0.08;
  u.userData.rim.forEach((l, i) => { l.visible = ((Math.floor(t * 6) + i) % 8) < 3; });
  u.userData.beam.material.opacity = 0.08 + Math.max(0, Math.sin(t * 0.7)) * 0.12;
}

function clouds(count, color, yMin, yMax, q) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, transparent: true, opacity: 0.92 });
  for (let i = 0; i < count; i++) {
    const cl = new THREE.Group();
    const puffs = 3 + ((Math.random() * 3) | 0);
    for (let p = 0; p < puffs; p++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1 + Math.random() * 1.6, 10, 8), mat);
      s.position.set(p * 1.6 - puffs * 0.8, Math.random() * 0.7, Math.random() * 1.2 - 0.6);
      s.scale.y = 0.55;
      cl.add(s);
    }
    cl.position.set((Math.random() - 0.5) * 70, yMin + Math.random() * (yMax - yMin), -14 - Math.random() * 20);
    cl.userData = { sp: 0.2 + Math.random() * 0.35 };
    g.add(cl);
  }
  g.userData.update = function (t, dt) {
    g.children.forEach((cl) => {
      cl.position.x += cl.userData.sp * dt;
      if (cl.position.x > 42) cl.position.x = -42;
    });
  };
  return g;
}

function dayNight(t, phase) {
  return 0.6 + 0.4 * Math.sin(t * 0.045 + phase);
}

function colosseum() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xe0cfae, roughness: 0.9 });
  const matDark = new THREE.MeshStandardMaterial({ color: 0xb89a72, roughness: 0.95 });
  for (let lvl = 0; lvl < 3; lvl++) {
    const yy = 0.55 + lvl * 1.15;
    const rx = 6 - lvl * 0.4, rz = 4.4 - lvl * 0.3;
    const seg = 26;
    for (let i = 0; i < seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.1, 0.42), lvl === 1 ? matDark : mat);
      pier.position.set(Math.cos(a) * rx, yy, Math.sin(a) * rz);
      pier.rotation.y = -a;
      pier.castShadow = true;
      g.add(pier);
    }
    const band = new THREE.Mesh(new THREE.TorusGeometry(1, 0.14, 6, 40), mat);
    band.scale.set(rx + 0.2, rz + 0.2, 1);
    band.rotation.x = -Math.PI / 2;
    band.position.y = yy + 0.62;
    g.add(band);
  }
  return g;
}

function liberty() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x8a9490, roughness: 0.9 });
  const copper = new THREE.MeshStandardMaterial({ color: 0x4fa08a, roughness: 0.55, metalness: 0.35 });
  const ped = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 1.7), stone);
  ped.position.y = 1.2; ped.castShadow = true;
  const robe = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.3, 8), copper);
  robe.position.y = 3.5; robe.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), copper);
  head.position.y = 4.8;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.4, 7), copper);
  crown.position.y = 5.1;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.15, 6), copper);
  arm.position.set(0.48, 4.5, 0); arm.rotation.z = -0.7;
  const torch = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffc46a }));
  torch.position.set(0.88, 5.05, 0);
  g.add(ped, robe, head, crown, arm, torch);
  return g;
}

function towerBridge() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xb8b0a0, roughness: 0.85 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x5a8ac8, metalness: 0.5, roughness: 0.4 });
  [-3.4, 3.4].forEach((x) => {
    const tw = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.8, 1.1), stone);
    tw.position.set(x, -1.4, 4); tw.castShadow = true;
    const roofT = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.95, 4), steel);
    roofT.position.set(x, 1.45, 4); roofT.rotation.y = Math.PI / 4;
    g.add(tw, roofT);
  });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.3, 1.4), steel);
  deck.position.set(0, -2.3, 4);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.5, 0.7), steel);
  upper.position.set(0, 0.5, 4);
  g.add(deck, upper);
  return g;
}

function spasskaya() {
  const g = new THREE.Group();
  const red = new THREE.MeshStandardMaterial({ color: 0x9e352a, roughness: 0.85 });
  const green = new THREE.MeshStandardMaterial({ color: 0x1f6e3a, roughness: 0.6 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 4.6, 1.7), red);
  base.position.y = 2.3; base.castShadow = true;
  const tier = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.3, 1.15), red);
  tier.position.y = 5.2;
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.42, 18), new THREE.MeshBasicMaterial({ color: 0xf2ead2 }));
  clock.position.set(0, 3.6, 0.87);
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.3, 4), green);
  spire.position.y = 7; spire.rotation.y = Math.PI / 4;
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.24), new THREE.MeshBasicMaterial({ color: 0xff3b30 }));
  star.position.y = 8.4;
  g.add(base, tier, clock, spire, star);
  g.userData = { star };
  return g;
}

function moonSphere(r, color) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.7 }));
}

/* ================= 01 ROMA ================= */
function roma(q) {
  const group = new THREE.Group(); const interactive = [];
  const L = envLights({ sunColor: 0xfff0c8, sunI: 2.2, sunPos: [18, 26, 10], sky: 0x9ec8e8, ground: 0x8a6248, hemiI: 0.75, rimColor: 0xffd0a0, rimI: 0.9, phase: 0 }, q);
  group.add(L.sun, L.hemi, L.rim);

  group.add(slab(0x4a3020, 130, -4));
  group.add(avenue("#8a7355", "#cbb494", "#e8dcc0"));
  group.add(crossStreet(0x6b5138, 15.5));
  group.add(godRays(0xffd9a0, 3, -8, -6));
  const piazza = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.18, 28), new THREE.MeshStandardMaterial({ color: 0xd9c6a2, roughness: 0.9 }));
  piazza.position.set(0, -3.95, 0); piazza.receiveShadow = true;
  group.add(piazza);

  const fv = [
    { ...facadeTextures("#c8b89a", ["#ffd76a", "#ffb347"], 0.3), roughness: 0.95, metalness: 0.02 },
    { ...facadeTextures("#b89878", ["#ffd76a"], 0.2), roughness: 0.95, metalness: 0.02 },
    { ...facadeTextures("#d0bfa0", ["#ffcf8a"], 0.35), roughness: 0.9, metalness: 0.05 },
  ];
  const city = blockCity({ count: q.mobile ? 70 : 130, palette: [0xa85838, 0x96522f, 0xb86844, 0x8a4a2e], area: [92, 58], hMin: 2, hMax: 9, clearR: 8, groundY: -4, camX: -7, roads: [14, 15.5, 17], variants: fv });
  group.add(city.group);

  const cupola = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 3, 18), new THREE.MeshStandardMaterial({ color: 0xead8ba, roughness: 0.8 }));
  drum.castShadow = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xdbb06a, roughness: 0.45, metalness: 0.35 }));
  dome.position.y = 1.5; dome.castShadow = true; dome.userData.s = 1; interactive.push(dome);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xead8ba }));
  lantern.position.y = 4.4;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd28a }));
  tip.position.y = 5.2;
  cupola.add(drum, dome, lantern, tip);
  cupola.position.set(0, -1.2, -4);
  group.add(cupola);

  const d = new THREE.Object3D();
  const colN = q.mobile ? 14 : 22;
  const colonnade = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.34, 1, 8), new THREE.MeshStandardMaterial({ color: 0xdccaa8, roughness: 0.85 }), colN);
  colonnade.castShadow = true;
  for (let i = 0; i < colN; i++) {
    const a = (i / colN - 0.5) * Math.PI * 0.95;
    d.position.set(Math.sin(a) * 10, -4 + 1.8, -Math.cos(a) * 10 + 7);
    d.scale.set(1, 3.6, 1); d.rotation.set(0, 0, 0); d.updateMatrix();
    colonnade.setMatrixAt(i, d.matrix);
  }
  group.add(colonnade);

  const ruinN = q.mobile ? 6 : 10;
  const ruins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.36, 1, 8), new THREE.MeshStandardMaterial({ color: 0xcbb494, roughness: 0.9 }), ruinN);
  ruins.castShadow = true;
  for (let i = 0; i < ruinN; i++) {
    const h = 1 + Math.random() * 2.2;
    d.position.set((Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4), -4 + h / 2, -2 + Math.random() * 10);
    d.scale.set(1, h, 1); d.updateMatrix();
    ruins.setMatrixAt(i, d.matrix);
  }
  group.add(ruins);

  const cyN = q.mobile ? 8 : 14;
  const cypress = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1, 7), new THREE.MeshStandardMaterial({ color: 0x1e4030, roughness: 1 }), cyN);
  cypress.castShadow = true;
  for (let i = 0; i < cyN; i++) {
    const h = 3 + Math.random() * 2.5;
    d.position.set((Math.random() - 0.5) * 36, -4 + h / 2, (Math.random() - 0.5) * 40);
    d.scale.set(1, h, 1); d.updateMatrix();
    cypress.setMatrixAt(i, d.matrix);
  }
  group.add(cypress);

  const sun = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 24), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
  sun.position.set(-12, 9.5, -26); sun.userData.s = 1; group.add(sun); interactive.push(sun);
  const sunHalo = new THREE.Mesh(new THREE.PlaneGeometry(15, 15),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,230,160,0.5)", "rgba(255,180,90,0.18)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sunHalo.position.copy(sun.position);
  group.add(sunHalo);
  const colosseo = colosseum();
  colosseo.position.set(-10.5, -4, -5);
  group.add(colosseo);
  const moon = moonSphere(1.1, 0xe8e4da);
  moon.position.set(13, 10.5, -26); group.add(moon);

  const dust = coloredPoints(q.mobile ? 120 : 240, 40, 50, -3, 7, ["#ffd28a", "#ffb347", "#ff9a5a"], 0.08, true);
  group.add(dust);

  const cloudLayer = clouds(q.mobile ? 4 : 6, 0xf2dfc0, 11, 16, q);
  group.add(cloudLayer);
  const plane = airplane(q);
  group.add(plane);

  const folks = peopleDetailed(q.mobile ? 12 : 20, [0xd96b4f, 0xe8d5b7, 0x5a6e8c, 0x8c3a3a, 0x2f2f38], [-11, 11], [-1, 11], -3.86);
  group.add(folks);

  const kids = [];
  const kidCols = [0xffcf3f, 0x4da3ff, 0xff6b8a];
  for (let i = 0; i < 3; i++) {
    const k = figure(kidCols[i], 0.58);
    k.userData.ca = (i / 3) * Math.PI * 2;
    group.add(k); kids.push(k);
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), new THREE.MeshStandardMaterial({ color: 0xff5040, roughness: 0.5 }));
  ball.castShadow = true;
  group.add(ball);

  const walkerA = figure(0x5a6e8c, 1); group.add(walkerA);
  const walkerB = figure(0x8c3a3a, 0.95); group.add(walkerB);
  const pup = dog(0x6b4a2e); group.add(pup);
  const birdsGround = pigeons(q.mobile ? 6 : 10, -3.86, [-8, 8], [2, 10]);
  group.add(birdsGround);
  const swallows = birds(q.mobile ? 4 : 7, 0x1a1a22, 9, 12, -6);
  group.add(swallows);

  const vespe = [0xd96b6b, 0x6baed6, 0xe8d5b7].map((c) => makeCar(c, 0.7));
  const auto = [makeCar(0xf0f0ea, 1.1), makeCar(0x3a4a5a, 1.1)];
  [...vespe, ...auto].forEach((v) => group.add(v));
  const traff = traffic([
    { mesh: vespe[0], lane: 14, dir: 1, sp: 7, off: 0, y: -3.9 },
    { mesh: vespe[1], lane: 15.5, dir: -1, sp: 6, off: 15, y: -3.9 },
    { mesh: vespe[2], lane: 14, dir: 1, sp: 8, off: 30, y: -3.9 },
    { mesh: auto[0], lane: 17, dir: -1, sp: 9, off: 8, y: -3.9 },
    { mesh: auto[1], lane: 15.5, dir: -1, sp: 10, off: 25, y: -3.9 },
  ]);

  return { group, interactive, lights: [L.sun, L.hemi, L.rim], update(t, dt) {
    const day = dayNight(t, 0);
    L.sun.intensity = 0.9 + day * 1.3;
    L.hemi.intensity = 0.45 + day * 0.35;
    L.rim.intensity = 0.5 + (1 - day) * 0.8;
    city.mats.forEach((m) => { m.emissiveIntensity = 0.1 + (1 - day) * 0.6; });
    sunHalo.material.opacity = 0.4 + day * 0.6;
    dust.rotation.y = t * 0.02;
    dust.position.y = Math.sin(t * 0.3) * 0.4;
    tip.scale.setScalar(1 + Math.sin(t * 2) * 0.15);
    traff.update(t);
    swallows.userData.update(t);
    birdsGround.userData.update(t);
    cloudLayer.userData.update(t, dt);
    flyPlane(plane, t);
    kids.forEach((k) => {
      const a = k.userData.ca + t * 0.85;
      k.position.set(3.5 + Math.cos(a) * 2.3, -3.86, 6 + Math.sin(a) * 2.3);
      k.rotation.y = -a;
      walkCycle(k, t, 8);
    });
    ball.position.set(3.5, -3.75 + Math.abs(Math.sin(t * 3.2)) * 0.55, 6);
    const wAx = Math.sin(t * 0.22) * 10;
    walkerA.position.set(wAx, -3.86, 8.5);
    walkerA.rotation.y = Math.cos(t * 0.22) > 0 ? Math.PI / 2 : -Math.PI / 2;
    walkCycle(walkerA, t, 5);
    const wBx = Math.sin(t * 0.18 + 2) * 8;
    walkerB.position.set(wBx, -3.86, 4.5);
    walkerB.rotation.y = Math.cos(t * 0.18 + 2) > 0 ? Math.PI / 2 : -Math.PI / 2;
    walkCycle(walkerB, t, 4.5);
    const dx = Math.sin(t * 0.4) * 7;
    pup.position.set(dx + 2, -3.86, 10);
    pup.rotation.y = Math.cos(t * 0.4) > 0 ? 0 : Math.PI;
    pup.userData.tail.rotation.z = 0.5 + Math.sin(t * 6) * 0.3;
  }};
}

/* ================= 02 NEW YORK ================= */
function newyork(q) {
  const group = new THREE.Group(); const interactive = [];
  const L = envLights({ sunColor: 0xfff2dc, sunI: 1.9, sunPos: [-14, 24, 10], sky: 0x8ab8e8, ground: 0x3a4252, hemiI: 0.7, rimColor: 0x7fb0ff, rimI: 1.0, phase: 2 }, q);
  group.add(L.sun, L.hemi, L.rim);

  group.add(slab(0x11151f, 130, -4));
  group.add(avenue("#1c2129", "#2a3242", "#ffd76a"));
  group.add(crossStreet(0x14181f, 4.8));
  [-3, 7.6].forEach((z) => {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(66, 0.14, 1.6), new THREE.MeshStandardMaterial({ color: 0x232c3c, roughness: 0.95 }));
    walk.position.set(0, -3.95, z); walk.receiveShadow = true;
    group.add(walk);
  });

  const fv = [
    { ...facadeTextures("#9aa4b8", ["#ffd76a", "#9fd8ff", "#ffffff"], 0.42), roughness: 0.22, metalness: 0.75 },
    { ...facadeTextures("#8892a8", ["#ffd76a", "#ffc46a"], 0.3), roughness: 0.35, metalness: 0.55 },
    { ...facadeTextures("#aab4c8", ["#9fd8ff", "#ffffff"], 0.5), roughness: 0.18, metalness: 0.85 },
  ];
  const city = blockCity({ count: q.mobile ? 130 : 260, palette: [0x4a5878, 0x5a6a8c, 0x3c4a66, 0x6a7a9c], area: [92, 60], hMin: 3, hMax: 22, clearR: 9, groundY: -4, camX: 7, roads: [3.8, 4.8, 5.8], variants: fv });
  group.add(city.group);

  const tower = new THREE.Group();
  let y = -4;
  [[3.2, 8], [2.6, 5], [2, 3.5], [1.4, 2.5]].forEach(([w, h]) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ color: 0x2c3c5c, roughness: 0.6, metalness: 0.3 }));
    seg.position.y = y + h / 2; seg.castShadow = true; y += h; tower.add(seg);
  });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.3, 3.4, 6), new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
  spire.position.y = y + 1.7; spire.userData.s = 1; interactive.push(spire);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
  beacon.position.y = y + 3.5;
  tower.add(spire, beacon);
  tower.position.set(0, 0, -8);
  group.add(tower);

  const sunNY = new THREE.Mesh(new THREE.SphereGeometry(2.3, 24, 24), new THREE.MeshBasicMaterial({ color: 0xfff3cf }));
  sunNY.position.set(-12, 12, -27); sunNY.userData.s = 1; group.add(sunNY); interactive.push(sunNY);
  const sunNYHalo = new THREE.Mesh(new THREE.PlaneGeometry(13, 13),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,235,180,0.45)", "rgba(255,200,120,0.15)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sunNYHalo.position.copy(sunNY.position); group.add(sunNYHalo);
  const moon = moonSphere(1.1, 0xdde6f2);
  moon.position.set(14, 9, -28); group.add(moon);
  const statue = liberty();
  statue.position.set(-11, -4, -12);
  group.add(statue);
  statue.children[1].userData.s = 1; interactive.push(statue.children[1]);
  const moonHalo = new THREE.Mesh(new THREE.PlaneGeometry(11, 11),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(200,215,255,0.4)", "rgba(120,140,220,0.15)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  moonHalo.position.copy(moon.position); group.add(moonHalo);
  const horizon = new THREE.Mesh(new THREE.PlaneGeometry(36, 8),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,140,70,0.28)", "rgba(180,60,120,0.12)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  horizon.position.set(-18, 0, -32); group.add(horizon);

  const sky = coloredPoints(q.mobile ? 90 : 180, 80, 20, 10, 26, ["#ffffff", "#9fd8ff"], 0.07, true);
  sky.position.z = -30; group.add(sky);

  const bill = new THREE.Mesh(new THREE.PlaneGeometry(7, 4.5),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,80,180,0.55)", "rgba(60,120,255,0.25)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  bill.position.set(-9, 4, -14); group.add(bill);

  const cloudLayer = clouds(q.mobile ? 3 : 5, 0x2c3852, 12, 17, q);
  group.add(cloudLayer);
  const plane = airplane(q); group.add(plane);
  const saucer = ufo(); interactive.push(saucer.children[1]);
  group.add(saucer);

  const carCols = [0xffcf3f, 0xffcf3f, 0xffcf3f, 0xc0392b, 0xf0f0ea, 0x3a6ea8];
  const cars = carCols.map((c) => makeCar(c, 1.15, true));
  const busNY = makeBus();
  cars.forEach((c) => group.add(c)); group.add(busNY);
  const traff = traffic([
    ...cars.map((c, i) => ({ mesh: c, lane: i % 2 ? 5.8 : 3.8, dir: i % 2 ? -1 : 1, sp: 7 + Math.random() * 5, off: i * 7, y: -3.9 })),
    { mesh: busNY, lane: 4.8, dir: 1, sp: 5, off: 20, y: -3.9 },
  ]);

  const folksA = peopleDetailed(q.mobile ? 8 : 14, [0xd9d9d9, 0x8c3a3a, 0x2f4a6e, 0xd9a441], [-16, 16], [-3.6, -2.4], -3.88);
  const folksB = peopleDetailed(q.mobile ? 8 : 14, [0xd9d9d9, 0x2f4a6e, 0xc0392b, 0x5a6e8c], [-16, 16], [7.0, 8.2], -3.88);
  group.add(folksA, folksB);

  const argA = figure(0xc0392b, 1); argA.position.set(4, -3.88, 6.6); argA.rotation.y = Math.PI / 2;
  const argB = figure(0x2f4a6e, 1.02); argB.position.set(5, -3.88, 6.6); argB.rotation.y = -Math.PI / 2;
  group.add(argA, argB);

  const kitty = cat(0x2a2d33); kitty.position.set(-6, -3.88, 7.6); kitty.rotation.y = 0.8;
  group.add(kitty);
  const birdsGround = pigeons(q.mobile ? 4 : 7, -3.88, [-10, 10], [6.8, 8]);
  group.add(birdsGround);

  const rainN = q.mobile ? 150 : 320;
  const rain = new THREE.InstancedMesh(new THREE.BoxGeometry(0.015, 1, 0.015),
    new THREE.MeshBasicMaterial({ color: 0x9fc4e8, transparent: true, opacity: 0 }), rainN);
  const rd = new THREE.Object3D(); const rainDrops = [];
  for (let i = 0; i < rainN; i++) rainDrops.push({ x: (Math.random() - 0.5) * 40, y: Math.random() * 24 - 8, z: (Math.random() - 0.5) * 50, sp: 10 + Math.random() * 6 });
  group.add(rain);

  const steamTex = glowTexture("rgba(220,230,255,0.25)", "rgba(160,180,220,0.1)");
  const steams = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.2),
      new THREE.MeshBasicMaterial({ map: steamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set(-12 + i * 11, -2.4, 2.6);
    s.userData = { ph: i * 2.1 };
    group.add(s); steams.push(s);
  }

  return { group, interactive, lights: [L.sun, L.hemi, L.rim], update(t, dt) {
    const day = dayNight(t, 2);
    L.sun.intensity = 0.7 + day * 1.1;
    L.hemi.intensity = 0.4 + day * 0.3;
    L.rim.intensity = 0.5 + (1 - day) * 0.9;
    city.mats.forEach((m) => { m.emissiveIntensity = 0.25 + (1 - day) * 0.7; });
    const wet = day < 0.45 ? 1 : 0;
    rain.material.opacity += ((wet ? 0.5 : 0) - rain.material.opacity) * 0.02;
    if (rain.material.opacity > 0.02) {
      for (let i = 0; i < rainN; i++) {
        const dr = rainDrops[i];
        dr.y -= dr.sp * dt;
        if (dr.y < -8) { dr.y = 14; dr.x = (Math.random() - 0.5) * 40; }
        rd.position.set(dr.x, dr.y, dr.z); rd.updateMatrix();
        rain.setMatrixAt(i, rd.matrix);
      }
      rain.instanceMatrix.needsUpdate = true;
    }
    traff.update(t);
    bill.material.opacity = 0.8 + Math.sin(t * 7) * 0.12 + (Math.random() < 0.02 ? -0.3 : 0);
    beacon.scale.setScalar(1 + Math.sin(t * 4) * 0.3);
    steams.forEach((s) => {
      const p = (t * 0.25 + s.userData.ph) % 1;
      s.position.y = -3 + p * 3.4;
      s.material.opacity = 0.9 * (1 - p);
    });
    argueCycle(argA, t); argueCycle(argB, t + 1.2);
    kitty.userData.tail.rotation.z = Math.sin(t * 1.8) * 0.4;
    birdsGround.userData.update(t);
    cloudLayer.userData.update(t, dt);
    flyPlane(plane, t);
    flyUfo(saucer, t, 13, 13, -18);
  }};
}

/* ================= 03 LONDRA ================= */
function londra(q) {
  const group = new THREE.Group(); const interactive = [];
  const L = envLights({ sunColor: 0xf0f2ee, sunI: 1.5, sunPos: [10, 24, 12], sky: 0xa8bccf, ground: 0x3a454c, hemiI: 0.85, rimColor: 0xcfe0ee, rimI: 0.8, phase: 4 }, q);
  group.add(L.sun, L.hemi, L.rim);

  group.add(slab(0x232b31, 130, -4));
  group.add(avenue("#2c343b", "#3a454e", "#cfd8e0"));
  group.add(crossStreet(0x1d2429, 12.2));
  const thames = slab(0x2a4a5c, 130, -3.8, 0.6, 12);
  thames.position.z = 4;
  group.add(thames);

  const fv = [
    { ...facadeTextures("#a8a8a0", ["#ffd76a"], 0.25), roughness: 0.92, metalness: 0.05 },
    { ...facadeTextures("#98989a", ["#ffcf8a", "#ffffff"], 0.3), roughness: 0.88, metalness: 0.08 },
  ];
  const city = blockCity({ count: q.mobile ? 50 : 85, palette: [0x6a747c, 0x5a646c, 0x767e86, 0x626c74], area: [88, 56], hMin: 3, hMax: 13, clearR: 10, groundY: -4, camX: -7, roads: [11.5, 12.8], variants: fv });
  group.add(city.group);

  const ben = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9, 1.6), new THREE.MeshStandardMaterial({ color: 0xaab2b8, roughness: 0.85 }));
  shaft.position.y = 4.5; shaft.castShadow = true;
  const clockBox = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 2), new THREE.MeshStandardMaterial({ color: 0x9aa2a8 }));
  clockBox.position.y = 9.6;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), new THREE.MeshBasicMaterial({ color: 0xf2ead2 }));
  face.position.set(0, 9.6, 1.02);
  const handA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0x222222 }));
  handA.position.set(0, 9.75, 1.05);
  const handB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0x222222 }));
  handB.position.set(0.15, 9.6, 1.05);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2, 4), new THREE.MeshStandardMaterial({ color: 0x3a444d, roughness: 0.6 }));
  roof.position.y = 11.4; roof.rotation.y = Math.PI / 4;
  roof.userData.s = 1; interactive.push(roof);
  ben.add(shaft, clockBox, face, handA, handB, roof);
  ben.position.set(6.5, -4, -6);
  group.add(ben);

  const eye = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.12, 8, 48), new THREE.MeshStandardMaterial({ color: 0xdde3e8, metalness: 0.6, roughness: 0.35 }));
  ring.userData.s = 1; interactive.push(ring);
  eye.add(ring);
  const capsules = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.4 }));
    cap.position.set(Math.cos(a) * 5.5, Math.sin(a) * 5.5, 0);
    capsules.add(cap);
  }
  eye.add(capsules);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x9aa3a8 });
  const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.5, 6), legMat);
  legA.position.set(-1.4, -4.5, 0); legA.rotation.z = 0.3;
  const legB = legA.clone(); legB.position.x = 1.4; legB.rotation.z = -0.3;
  eye.add(legA, legB);
  eye.position.set(-8, 1.8, -10);
  group.add(eye);

  const bridge = towerBridge();
  group.add(bridge);

  const paleSun = new THREE.Mesh(new THREE.CircleGeometry(2, 24),
    new THREE.MeshBasicMaterial({ color: 0xf4f6f2, transparent: true, opacity: 0.9 }));
  paleSun.position.set(-15, 10, -28); group.add(paleSun);
  const moon = moonSphere(0.9, 0xdde3e8);
  moon.position.set(14, 12, -28); group.add(moon);

  const cloudLayer = clouds(q.mobile ? 5 : 8, 0x7a8794, 9, 14, q);
  group.add(cloudLayer);
  const plane = airplane(q); group.add(plane);

  const busA = makeBus(), busB = makeBus();
  const cabA = makeCar(0x14161a), cabB = makeCar(0x14161a), cabC = makeCar(0x2a2d33);
  [busA, busB, cabA, cabB, cabC].forEach((v) => group.add(v));
  const traff = traffic([
    { mesh: busA, lane: 11.5, dir: 1, sp: 5.5, off: 0, y: -3.9 },
    { mesh: busB, lane: 12.8, dir: -1, sp: 5, off: 22, y: -3.9 },
    { mesh: cabA, lane: 11.5, dir: 1, sp: 8, off: 14, y: -3.9 },
    { mesh: cabB, lane: 12.8, dir: -1, sp: 9, off: 33, y: -3.9 },
    { mesh: cabC, lane: 11.5, dir: 1, sp: 7.5, off: 38, y: -3.9 },
  ]);

  const n = q.mobile ? 140 : 260;
  const drizzle = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.012, 0.7, 0.012),
    new THREE.MeshBasicMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0.4 }), n);
  const dd = new THREE.Object3D(); const drops = [];
  for (let i = 0; i < n; i++) drops.push({ x: (Math.random() - 0.5) * 40, y: Math.random() * 22 - 6, z: (Math.random() - 0.5) * 50, sp: 5 + Math.random() * 4 });
  group.add(drizzle);

  const lamps = coloredPoints(q.mobile ? 40 : 70, 50, 44, -3.6, -3, ["#ffd76a", "#ffb347"], 0.16, true);
  group.add(lamps);

  const folks = umbrellaPeople(q.mobile ? 10 : 16, [0xc0392b, 0x2f4a6e, 0x111111, 0x5a3a6e], [-15, 15], [14.5, 19], -4);
  group.add(folks);
  const birdsGround = pigeons(q.mobile ? 5 : 8, -4, [-10, 2], [14, 18]);
  group.add(birdsGround);
  const crows = birds(q.mobile ? 3 : 5, 0x14161a, 10, 10, -8);
  group.add(crows);
  const pup = dog(0x3a2c1e); group.add(pup);
  const kitty = cat(0x4a4e55); kitty.position.set(-4, -4, 8.6); kitty.rotation.y = -0.6;
  group.add(kitty);

  return { group, interactive, lights: [L.sun, L.hemi, L.rim], update(t, dt) {
    const day = dayNight(t, 4);
    L.sun.intensity = 0.6 + day * 0.9;
    L.hemi.intensity = 0.5 + day * 0.35;
    L.rim.intensity = 0.4 + (1 - day) * 0.7;
    city.mats.forEach((m) => { m.emissiveIntensity = 0.15 + (1 - day) * 0.55; });
    const rainAmt = 0.25 + (1 - day) * 0.45;
    drizzle.material.opacity += (rainAmt - drizzle.material.opacity) * 0.02;
    for (let i = 0; i < n; i++) {
      const dr = drops[i];
      dr.y -= dr.sp * dt;
      if (dr.y < -6) { dr.y = 14; dr.x = (Math.random() - 0.5) * 40; }
      dd.position.set(dr.x, dr.y, dr.z); dd.rotation.z = 0.1; dd.updateMatrix();
      drizzle.setMatrixAt(i, dd.matrix);
    }
    drizzle.instanceMatrix.needsUpdate = true;
    paleSun.material.opacity = 0.3 + day * 0.55;
    capsules.rotation.z = t * 0.1;
    traff.update(t);
    handA.rotation.z = -t * 0.02;
    const dx = Math.sin(t * 0.35) * 9;
    pup.position.set(dx, -4, 9.5);
    pup.rotation.y = Math.cos(t * 0.35) > 0 ? 0 : Math.PI;
    pup.userData.tail.rotation.z = 0.5 + Math.sin(t * 6) * 0.3;
    kitty.userData.tail.rotation.z = Math.sin(t * 1.5) * 0.4;
    birdsGround.userData.update(t);
    crows.userData.update(t);
    cloudLayer.userData.update(t, dt);
    flyPlane(plane, t);
  }};
}

/* ================= 04 DUBAI ================= */
function dubai(q) {
  const group = new THREE.Group(); const interactive = [];
  const L = envLights({ sunColor: 0xfff0c8, sunI: 2.2, sunPos: [-16, 26, 10], sky: 0x9ec8e0, ground: 0xa88a62, hemiI: 0.75, rimColor: 0xffe0b8, rimI: 1.0, phase: 1 }, q);
  group.add(L.sun, L.hemi, L.rim);

  group.add(slab(0x7a5f42, 130, -4));
  group.add(avenue("#4a4034", "#8a7355", "#f0e8d0"));
  group.add(crossStreet(0x3e362c, 6.4));
  group.add(godRays(0xfff0c8, 3, -10, -8));

  const fv = [
    { ...facadeTextures("#c8d0dc", ["#7ef0ff", "#ffffff", "#ffd76a"], 0.5), roughness: 0.2, metalness: 0.8 },
    { ...facadeTextures("#d8d0b8", ["#ffd76a", "#ffcf8a"], 0.4), roughness: 0.4, metalness: 0.5 },
    { ...facadeTextures("#b8c4d8", ["#9fd8ff", "#ffffff"], 0.45), roughness: 0.15, metalness: 0.9 },
  ];
  const city = blockCity({ count: q.mobile ? 80 : 150, palette: [0xe8ecf2, 0xd0dae8, 0xd8c8a0, 0xd8dce8], area: [90, 58], hMin: 4, hMax: 20, clearR: 9, groundY: -4, camX: 7, roads: [5.6, 7.2], variants: fv });
  group.add(city.group);

  const burj = new THREE.Group();
  let by = -4;
  [2.4, 1.9, 1.45, 1.0, 0.6].forEach((r) => {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, 5, 10), new THREE.MeshStandardMaterial({ color: 0xe8e8f0, metalness: 0.7, roughness: 0.25 }));
    seg.position.y = by + 2.5; seg.castShadow = true; by += 5; burj.add(seg);
  });
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.3, 4.5, 6), new THREE.MeshBasicMaterial({ color: 0xffd28a }));
  needle.position.y = by + 2.2; needle.userData.s = 1; interactive.push(needle);
  burj.add(needle);
  burj.position.set(0, 0, -8);
  group.add(burj);

  const twist = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 2.2), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd9a441 : 0xb98a34, metalness: 0.65, roughness: 0.3 }));
    seg.position.y = -4 + 0.65 + i * 1.3;
    seg.rotation.y = i * 0.16;
    seg.castShadow = true;
    twist.add(seg);
  }
  twist.children[13].userData.s = 1; interactive.push(twist.children[13]);
  twist.position.set(-9, 0, -3);
  group.add(twist);

  const sail = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.6, 11, 8, 1), new THREE.MeshStandardMaterial({ color: 0xf0ede4, metalness: 0.4, roughness: 0.35 }));
  sail.scale.z = 0.28;
  sail.position.set(8, 1.5, -6);
  sail.castShadow = true;
  sail.userData.s = 1; interactive.push(sail);
  group.add(sail);

  const fountains = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 40),
      new THREE.MeshBasicMaterial({ color: 0x4de3ff, transparent: true, opacity: 0.7 }));
    r.rotation.x = -Math.PI / 2;
    r.position.set(5, -3.85, 3);
    r.userData = { off: i / 3 };
    group.add(r); fountains.push(r);
  }
  const fGlow = new THREE.Mesh(new THREE.PlaneGeometry(6, 6),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(80,220,255,0.5)", "rgba(40,120,200,0.18)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  fGlow.rotation.x = -Math.PI / 2; fGlow.position.set(5, -3.8, 3);
  group.add(fGlow);

  const dusk = new THREE.Mesh(new THREE.PlaneGeometry(40, 24),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,150,80,0.35)", "rgba(150,60,160,0.15)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  dusk.position.set(0, 8, -34); group.add(dusk);

  const sunsetSun = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 20), new THREE.MeshBasicMaterial({ color: 0xfff0c0 }));
  sunsetSun.position.set(-16, 11, -28); group.add(sunsetSun);
  const crescent = moonSphere(1.2, 0xf2ead8);
  crescent.position.set(16, 11, -28); crescent.userData.s = 1; group.add(crescent); interactive.push(crescent);

  const palms = coloredPoints(q.mobile ? 50 : 90, 56, 50, -3.7, -2.8, ["#ffd76a", "#ff9a5a"], 0.14, true);
  group.add(palms);

  const cloudLayer = clouds(q.mobile ? 3 : 5, 0xe8c8b0, 12, 17, q);
  group.add(cloudLayer);
  const plane = airplane(q); group.add(plane);
  const saucer = ufo();
  group.add(saucer);

  const lux = [0xf0f0ea, 0xd9a441, 0x111111, 0x8fa3c8].map((c) => makeCar(c, 1.25, true));
  lux.forEach((c) => group.add(c));
  const traff = traffic(lux.map((c, i) => ({
    mesh: c, lane: i % 2 ? 7.2 : 5.6, dir: i % 2 ? -1 : 1, sp: 9 + Math.random() * 4, off: i * 11, y: -3.9,
  })));

  const falcons = birds(q.mobile ? 3 : 4, 0x2a2118, 14, 10, -10);
  group.add(falcons);
  const folks = peopleDetailed(q.mobile ? 8 : 12, [0xf0ede4, 0xd9a441, 0x5a6e8c, 0x8c3a3a], [11, 18], [0, 8], -4);
  group.add(folks);
  const kitty = cat(0xc8b08a); kitty.position.set(12.5, -4, 6); kitty.rotation.y = 2.2;
  group.add(kitty);

  return { group, interactive, lights: [L.sun, L.hemi, L.rim], update(t, dt) {
    const day = dayNight(t, 1);
    L.sun.intensity = 0.8 + day * 1.3;
    L.hemi.intensity = 0.45 + day * 0.35;
    L.rim.intensity = 0.5 + (1 - day) * 0.9;
    city.mats.forEach((m) => { m.emissiveIntensity = 0.2 + (1 - day) * 0.7; });
    twist.rotation.y = t * 0.1;
    fountains.forEach((r) => {
      const p = (t * 0.3 + r.userData.off) % 1;
      r.scale.setScalar(1 + p * 4);
      r.material.opacity = 0.7 * (1 - p);
    });
    needle.scale.setScalar(1 + Math.sin(t * 2.4) * 0.06);
    traff.update(t);
    falcons.userData.update(t);
    cloudLayer.userData.update(t, dt);
    flyPlane(plane, t);
    flyUfo(saucer, t, -14, 12, -20);
    kitty.userData.tail.rotation.z = Math.sin(t * 1.6) * 0.4;
  }};
}

/* ================= 05 MOSCA ================= */
function mosca(q) {
  const group = new THREE.Group(); const interactive = [];
  const L = envLights({ sunColor: 0xeef2ff, sunI: 1.5, sunPos: [14, 22, 10], sky: 0xa8c4e0, ground: 0xdfe6f0, hemiI: 0.8, rimColor: 0xcfe0ff, rimI: 0.8, phase: 3 }, q);
  group.add(L.sun, L.hemi, L.rim);

  group.add(slab(0xdfe6f0, 130, -4));
  group.add(avenue("#cfd8e4", "#e8eef4", "#9aa8b8"));
  group.add(crossStreet(0xbcc8d6, 10.3));

  const d = new THREE.Object3D();
  const wallN = 9;
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x8e2f24, roughness: 0.85 }), wallN);
  wall.castShadow = true;
  for (let i = 0; i < wallN; i++) {
    d.position.set(-16 + i * 4, -4 + 1.5, -13);
    d.scale.set(3.8, 3, 1.2);
    d.updateMatrix(); wall.setMatrixAt(i, d.matrix);
  }
  group.add(wall);
  for (let i = 0; i < 3; i++) {
    const tw = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 5, 8), new THREE.MeshStandardMaterial({ color: 0x9e352a, roughness: 0.85 }));
    base.castShadow = true;
    const roofG = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x1f6e3a }));
    roofG.position.y = 3.4;
    tw.add(base, roofG);
    tw.position.set(-12 + i * 12, -4 + 2.5, -13);
    group.add(tw);
  }

  const basil = new THREE.Group();
  const mainBase = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2, 6, 10), new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.8 }));
  mainBase.position.y = 3; mainBase.castShadow = true;
  basil.add(mainBase);
  const mainDome = onionDome(1.9, 0xc0392b, 0xf1c40f);
  mainDome.position.y = 7.4;
  mainDome.userData.dome.userData.s = 1;
  interactive.push(mainDome.userData.dome);
  basil.add(mainDome);
  const sideCfg = [
    { x: -3, z: -1.5, c: 0x27ae60, b: 0xf1c40f, h: 3.6, r: 1.15 },
    { x: 3, z: -1.5, c: 0x2980b9, b: 0xe8e0d0, h: 4.2, r: 1.2 },
    { x: -2.2, z: 2, c: 0xf1c40f, b: 0xc0392b, h: 3.2, r: 1.0 },
    { x: 2.2, z: 2, c: 0x8e44ad, b: 0xf1c40f, h: 3.8, r: 1.05 },
  ];
  sideCfg.forEach((cfg) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(cfg.r * 0.75, cfg.r * 0.9, cfg.h, 8), new THREE.MeshStandardMaterial({ color: 0xd8ccb8, roughness: 0.85 }));
    b.position.set(cfg.x, cfg.h / 2, cfg.z);
    b.castShadow = true;
    basil.add(b);
    const dm = onionDome(cfg.r, cfg.c, cfg.b);
    dm.position.set(cfg.x, cfg.h + cfg.r * 0.9, cfg.z);
    basil.add(dm);
  });
  basil.position.set(0, -4, -3);
  group.add(basil);

  const spass = spasskaya();
  spass.position.set(0, -4, -13);
  group.add(spass);

  const moon = moonSphere(1.6, 0xdde6f2);
  moon.position.set(13, 9, -27); group.add(moon);
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(2, 20, 20), new THREE.MeshBasicMaterial({ color: 0xfff8e0 }));
  sunM.position.set(-12, 10, -27); sunM.userData.s = 1; group.add(sunM); interactive.push(sunM);
  const moonHalo = new THREE.Mesh(new THREE.PlaneGeometry(13, 13),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(200,215,255,0.4)", "rgba(120,140,220,0.15)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  moonHalo.position.copy(moon.position); group.add(moonHalo);
  const sunGlow = new THREE.Mesh(new THREE.PlaneGeometry(24, 7),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,160,90,0.22)", "rgba(150,80,60,0.1)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sunGlow.position.set(-16, 0.5, -30); group.add(sunGlow);

  const snowCount = q.mobile ? 260 : 520;
  const sPos = new Float32Array(snowCount * 3);
  const sDrops = [];
  for (let i = 0; i < snowCount; i++) {
    sPos[i * 3] = (Math.random() - 0.5) * 50;
    sPos[i * 3 + 1] = Math.random() * 22 - 6;
    sPos[i * 3 + 2] = (Math.random() - 0.5) * 56;
    sDrops.push({ sp: 1 + Math.random() * 1.6, ph: Math.random() * Math.PI * 2 });
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  const snow = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.1, transparent: true, opacity: 0.9 }));
  group.add(snow);

  const lamps = coloredPoints(q.mobile ? 36 : 60, 46, 40, -3.6, -2.8, ["#ffd76a", "#ffb347"], 0.15, true);
  group.add(lamps);

  const cloudLayer = clouds(q.mobile ? 3 : 5, 0xc8d4e4, 11, 16, q);
  group.add(cloudLayer);
  const plane = airplane(q); group.add(plane);

  const folks = peopleDetailed(q.mobile ? 10 : 18, [0x8c3a3a, 0x2f4a6e, 0x1f6e3a, 0x8e44ad, 0xd9d9d9], [8, 18], [-6, 8], -4);
  group.add(folks);
  const kidA = figure(0xff6b8a, 0.58); group.add(kidA);
  const kidB = figure(0x4da3ff, 0.6); group.add(kidB);
  const snowball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  group.add(snowball);
  const pup = dog(0x4a3a2a); group.add(pup);
  const crows = birds(q.mobile ? 3 : 5, 0x111111, 9, 10, -6);
  group.add(crows);

  const carsM = [makeCar(0x2f4a6e, 1.1, true), makeCar(0x8c3a3a, 1.1, true), makeCar(0x3a3f45, 1.1, true)];
  carsM.forEach((c) => group.add(c));
  const traff = traffic(carsM.map((c, i) => ({
    mesh: c, lane: i % 2 ? 11 : 9.6, dir: i % 2 ? -1 : 1, sp: 4 + Math.random() * 2, off: i * 15, y: -3.9,
  })));

  return { group, interactive, lights: [L.sun, L.hemi, L.rim], update(t, dt) {
    const day = dayNight(t, 3);
    L.sun.intensity = 0.6 + day * 0.9;
    L.hemi.intensity = 0.45 + day * 0.35;
    L.rim.intensity = 0.4 + (1 - day) * 0.7;
    snow.material.opacity = 0.4 + (1 - day) * 0.55;
    const p = sg.attributes.position;
    const fall = 0.6 + (1 - day) * 0.8;
    for (let i = 0; i < snowCount; i++) {
      let y2 = p.array[i * 3 + 1] - sDrops[i].sp * fall * dt;
      if (y2 < -4) y2 = 14;
      p.array[i * 3 + 1] = y2;
      p.array[i * 3] += Math.sin(t * 0.8 + sDrops[i].ph) * 0.004;
    }
    p.needsUpdate = true;
    traff.update(t);
    crows.userData.update(t);
    cloudLayer.userData.update(t, dt);
    flyPlane(plane, t);
    const kAx = Math.sin(t * 0.5) * 5;
    kidA.position.set(kAx, -4, 5);
    kidA.rotation.y = Math.cos(t * 0.5) > 0 ? Math.PI / 2 : -Math.PI / 2;
    walkCycle(kidA, t, 7);
    kidB.position.set(-kAx * 0.8, -4, 6.5);
    kidB.rotation.y = Math.cos(t * 0.5) > 0 ? -Math.PI / 2 : Math.PI / 2;
    walkCycle(kidB, t + 1, 7);
    snowball.position.set(kAx * 0.5, -3.9 + Math.abs(Math.sin(t * 2.6)) * 0.4, 5.7);
    const dx = Math.sin(t * 0.3) * 6;
    pup.position.set(dx, -4, 8.5);
    pup.rotation.y = Math.cos(t * 0.3) > 0 ? 0 : Math.PI;
    pup.userData.tail.rotation.z = 0.5 + Math.sin(t * 6) * 0.3;
  }};
}
