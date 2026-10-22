import * as THREE from "three";

export const SEG = 60;
const PAPER = 0xf6f6f4, INK = 0x0a0a0a;

export const ENVS = [
  { id: "foresta",    idx: "01", name: "Foresta",    bg: "#070512" },
  { id: "oceano",     idx: "02", name: "Oceano",     bg: "#062b3d" },
  { id: "ghiacciaio", idx: "03", name: "Ghiacciaio", bg: "#f0eef2" },
  { id: "tempesta",   idx: "04", name: "Tempesta",   bg: "#1f2a68" },
  { id: "cielo",      idx: "05", name: "Cielo",      bg: "#0a0618" },
];

export function buildEnvironment(i, q) {
  return [foresta, oceano, ghiacciaio, tempesta, cielo][i](q);
}

/* ---------- helpers ---------- */
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

function auroraTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 256, 0);
  grd.addColorStop(0, "rgba(46,230,168,0)");
  grd.addColorStop(0.2, "rgba(46,230,168,0.85)");
  grd.addColorStop(0.45, "rgba(64,180,255,0.9)");
  grd.addColorStop(0.7, "rgba(150,90,255,0.85)");
  grd.addColorStop(0.88, "rgba(255,110,180,0.6)");
  grd.addColorStop(1, "rgba(255,110,180,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 64);
  g.globalCompositeOperation = "destination-out";
  const fade = g.createLinearGradient(0, 0, 0, 64);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(0.45, "rgba(0,0,0,0)");
  fade.addColorStop(1, "rgba(0,0,0,1)");
  g.fillStyle = fade;
  g.fillRect(0, 0, 256, 64);
  return new THREE.CanvasTexture(c);
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

/* ---------- 01 FORESTA ---------- */
function foresta(q) {
  const group = new THREE.Group(); const interactive = [];
  const n = q.mobile ? 46 : 90;
  const d = new THREE.Object3D();
  const trunksA = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.09, 0.16, 1, 5),
    new THREE.MeshBasicMaterial({ color: 0x0d0b16 }), n);
  const trunksB = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.07, 0.13, 1, 5),
    new THREE.MeshBasicMaterial({ color: 0x241b4d }), q.mobile ? 24 : 48);
  for (let i = 0; i < n; i++) {
    const h = 12 + Math.random() * 12;
    d.position.set((Math.random() < 0.5 ? -1 : 1) * (3.5 + Math.random() * 11), h / 2 - 6, (Math.random() - 0.5) * 58);
    d.scale.set(1 + Math.random() * 1.6, h, 1 + Math.random() * 1.6);
    d.rotation.y = Math.random() * Math.PI;
    d.updateMatrix(); trunksA.setMatrixAt(i, d.matrix);
  }
  for (let i = 0; i < trunksB.count; i++) {
    const h = 10 + Math.random() * 10;
    d.position.set((Math.random() < 0.5 ? -1 : 1) * (5 + Math.random() * 13), h / 2 - 6, (Math.random() - 0.5) * 58);
    d.scale.set(1, h, 1);
    d.rotation.y = Math.random() * Math.PI;
    d.updateMatrix(); trunksB.setMatrixAt(i, d.matrix);
  }
  group.add(trunksA, trunksB);

  const flies = coloredPoints(q.mobile ? 160 : 340, 30, 54, -3, 6,
    ["#7ef0ff", "#b78aff", "#ffd28a", "#5affc4"], 0.11, true);
  group.add(flies);
  const canopy = coloredPoints(q.mobile ? 80 : 160, 44, 58, 8, 16, ["#ffffff", "#cdd8ff"], 0.06, true);
  group.add(canopy);

  const shrooms = new THREE.Group();
  const shroomPalette = [0xff6b8a, 0x3ee6c4, 0xb78aff, 0xffd28a];
  const sn = q.mobile ? 8 : 15;
  for (let i = 0; i < sn; i++) {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.16 + Math.random() * 0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: shroomPalette[i % shroomPalette.length] }));
    const a = Math.random() * Math.PI * 2, r = 2.5 + Math.random() * 6;
    m.position.set(Math.cos(a) * r, -5 + Math.random() * 0.4, Math.sin(a) * r * 0.8);
    m.userData = { ph: Math.random() * Math.PI * 2, s: 1 };
    shrooms.add(m);
  }
  group.add(shrooms);

  const moon = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 24), new THREE.MeshBasicMaterial({ color: PAPER }));
  moon.position.set(7, 8, -16); moon.userData = { s: 1 };
  group.add(moon); interactive.push(moon);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 9),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(180,200,255,0.5)", "rgba(120,90,255,0.18)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  halo.position.copy(moon.position);
  group.add(halo);

  const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), new THREE.MeshBasicMaterial({ color: 0x7ef0ff, wireframe: true }));
  stone.position.set(0, 0.6, 0); stone.userData = { s: 1 };
  group.add(stone); interactive.push(stone);

  return { group, interactive, update(t) {
    flies.rotation.y = Math.sin(t * 0.05) * 0.2;
    flies.position.y = Math.sin(t * 0.4) * 0.25;
    shrooms.children.forEach((m) => {
      const p = 1 + Math.sin(t * 1.6 + m.userData.ph) * 0.25;
      m.scale.setScalar(p);
    });
    stone.position.y = 0.6 + Math.sin(t * 0.9) * 0.35;
    stone.rotation.y = t * 0.5; stone.rotation.x = t * 0.2;
    halo.lookAt(0, 2.6, 24);
  }};
}

/* ---------- 02 OCEANO ---------- */
function oceano(q) {
  const group = new THREE.Group(); const interactive = [];
  const sx = q.mobile ? 42 : 76, sy = q.mobile ? 20 : 36;
  const geo = new THREE.PlaneGeometry(90, 46, sx, sy);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const cA = new THREE.Color("#2ee6c8"), cB = new THREE.Color("#2b6cff"), cC = new THREE.Color("#7a4dff");
  const cols = new Float32Array(geo.attributes.position.count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < geo.attributes.position.count; i++) {
    const fx = (base[i * 3] + 45) / 90;
    if (fx < 0.5) tmp.copy(cA).lerp(cB, fx * 2);
    else tmp.copy(cB).lerp(cC, (fx - 0.5) * 2);
    cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
  const wave = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, wireframe: true, transparent: true, opacity: 0.65 }));
  wave.position.y = -4; group.add(wave);

  const plankton = coloredPoints(q.mobile ? 120 : 260, 70, 44, -5.5, -3.4, ["#3ee6c4", "#2ee6c8", "#7ef0ff"], 0.1, true);
  group.add(plankton);

  const dropPalette = [0xff7a6b, 0xffd28a, 0x7ef0ff, 0xb78aff, 0x3ee6c4];
  const drops = new THREE.Group();
  const tetGeo = new THREE.TetrahedronGeometry(1);
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(tetGeo, new THREE.MeshBasicMaterial({ color: dropPalette[i % dropPalette.length], wireframe: true }));
    m.position.set((Math.random() - 0.5) * 22, Math.random() * 6 - 1, (Math.random() - 0.5) * 26);
    const s = 0.6 + Math.random() * 1.1;
    m.scale.setScalar(s);
    m.userData = { s, ph: Math.random() * Math.PI * 2, sp: 0.4 + Math.random() * 0.6 };
    drops.add(m); interactive.push(m);
  }
  group.add(drops);

  const pearl = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), new THREE.MeshBasicMaterial({ color: PAPER, wireframe: true }));
  pearl.position.set(0, 2.2, -6); pearl.userData = { s: 1 };
  group.add(pearl); interactive.push(pearl);

  const ripples = [];
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.05, 6, 48),
      new THREE.MeshBasicMaterial({ color: 0x2ee6c8, transparent: true, opacity: 0.6 }));
    r.rotation.x = -Math.PI / 2;
    r.position.set(0, -2.6, -6);
    r.userData = { off: i / 3 };
    group.add(r); ripples.push(r);
  }

  const pos = geo.attributes.position;
  return { group, interactive, update(t) {
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], z = base[i * 3 + 2];
      pos.array[i * 3 + 1] = Math.sin(x * 0.22 + t * 1.1) * 1.1 + Math.cos(z * 0.28 + t * 0.8) * 0.9;
    }
    pos.needsUpdate = true;
    drops.children.forEach((m) => {
      m.position.y += Math.sin(t * m.userData.sp + m.userData.ph) * 0.004;
      m.rotation.y = t * m.userData.sp * 0.4;
    });
    pearl.rotation.y = t * 0.3; pearl.rotation.x = t * 0.12;
    ripples.forEach((r) => {
      const p = (t * 0.25 + r.userData.off) % 1;
      r.scale.setScalar(1 + p * 5);
      r.material.opacity = 0.6 * (1 - p);
    });
    plankton.position.y = Math.sin(t * 0.5) * 0.3;
  }};
}

/* ---------- 03 GHIACCIAIO ---------- */
function ghiacciaio(q) {
  const group = new THREE.Group(); const interactive = [];
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(92, 92), new THREE.MeshBasicMaterial({ color: 0xe9e6ee }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -5; group.add(ground);

  const n = q.mobile ? 18 : 30;
  const rocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x14101f }), n);
  const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, r = 9 + Math.random() * 16;
    const h = 2.5 + Math.random() * 11;
    d.position.set(Math.cos(a) * r, h / 2 - 5, Math.sin(a) * r);
    d.scale.set(1 + Math.random() * 1.8, h, 1 + Math.random() * 1.8);
    d.rotation.y = Math.random() * Math.PI;
    d.updateMatrix(); rocks.setMatrixAt(i, d.matrix);
  }
  group.add(rocks);

  const berg = new THREE.Mesh(new THREE.ConeGeometry(2.6, 7, 5), new THREE.MeshBasicMaterial({ color: PAPER }));
  berg.add(new THREE.LineSegments(new THREE.EdgesGeometry(berg.geometry), new THREE.LineBasicMaterial({ color: 0x00c2ff })));
  berg.position.y = -0.5; berg.userData = { s: 1 };
  group.add(berg); interactive.push(berg);

  const shardPalette = [0x00c2ff, 0xff4fa3, 0xffb84d, 0x7a4dff];
  const shards = new THREE.Group();
  const ns = q.mobile ? 8 : 14;
  for (let i = 0; i < ns; i++) {
    const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.4 + Math.random() * 0.5),
      new THREE.MeshBasicMaterial({ color: shardPalette[i % shardPalette.length], wireframe: true }));
    s.userData = { a: Math.random() * Math.PI * 2, r: 4.5 + Math.random() * 5, y: Math.random() * 7 - 1.5, sp: 0.15 + Math.random() * 0.35, s: 1 };
    shards.add(s); interactive.push(s);
  }
  group.add(shards);

  const aurTex = auroraTexture();
  const auroras = [];
  const aurCfg = [
    { y: 16, z: -30, w: 70, h: 9, sp: 0.5 },
    { y: 20, z: -38, w: 80, h: 12, sp: 0.3 },
    { y: 13, z: -24, w: 55, h: 6, sp: 0.7 },
  ];
  aurCfg.forEach((cfg) => {
    const g = new THREE.PlaneGeometry(cfg.w, cfg.h, q.mobile ? 30 : 60, 1);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      map: aurTex, transparent: true, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.9,
    }));
    m.position.set(0, cfg.y, cfg.z);
    m.userData = { base: g.attributes.position.array.slice(), sp: cfg.sp };
    group.add(m); auroras.push(m);
  });

  const snow = coloredPoints(q.mobile ? 120 : 240, 50, 56, -4, 12, ["#ffffff", "#cdd8ff", "#b78aff"], 0.09, false);
  group.add(snow);

  return { group, interactive, update(t) {
    berg.rotation.y = t * 0.12;
    shards.children.forEach((s) => {
      const u = s.userData;
      s.position.set(Math.cos(u.a + t * u.sp) * u.r, u.y + Math.sin(t * 0.7 + u.a) * 0.5, Math.sin(u.a + t * u.sp) * u.r);
      s.rotation.x = t * u.sp; s.rotation.y = t * u.sp * 1.4;
    });
    auroras.forEach((m, k) => {
      const p = m.geometry.attributes.position;
      const b = m.userData.base;
      for (let i = 0; i < p.count; i++) {
        const x = b[i * 3];
        p.array[i * 3 + 1] = b[i * 3 + 1] + Math.sin(x * 0.12 + t * m.userData.sp + k * 2) * 1.6;
      }
      p.needsUpdate = true;
      m.position.x = Math.sin(t * 0.05 + k) * 4;
    });
    snow.rotation.y = t * 0.02;
  }};
}

/* ---------- 04 TEMPESTA ---------- */
function tempesta(q) {
  const group = new THREE.Group(); const interactive = [];
  const d = new THREE.Object3D();

  const n1 = q.mobile ? 200 : 450;
  const rain1 = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.02, 1.5, 0.02),
    new THREE.MeshBasicMaterial({ color: 0xcfe4ff, transparent: true, opacity: 0.6 }), n1);
  const drops1 = [];
  for (let i = 0; i < n1; i++) drops1.push({ x: (Math.random() - 0.5) * 36, y: Math.random() * 24 - 8, z: (Math.random() - 0.5) * 56, sp: 9 + Math.random() * 8 });
  group.add(rain1);

  const n2 = q.mobile ? 120 : 300;
  const rain2 = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.015, 0.9, 0.015),
    new THREE.MeshBasicMaterial({ color: 0x8a9aff, transparent: true, opacity: 0.4 }), n2);
  const drops2 = [];
  for (let i = 0; i < n2; i++) drops2.push({ x: (Math.random() - 0.5) * 44, y: Math.random() * 26 - 8, z: (Math.random() - 0.5) * 60, sp: 6 + Math.random() * 5 });
  group.add(rain2);

  const cloudTints = [0x2b2f6e, 0x3a2a6e, 0x232a5c];
  const clouds = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 3, 12, 12),
      new THREE.MeshBasicMaterial({ color: cloudTints[i % 3], transparent: true, opacity: 0.9 }));
    c.position.set((Math.random() - 0.5) * 30, 8 + Math.random() * 4, (Math.random() - 0.5) * 40);
    c.scale.y = 0.45; clouds.add(c);
  }
  group.add(clouds);

  const pts = []; let bx = 0, by = 10;
  pts.push(new THREE.Vector3(bx, by, -14));
  for (let i = 0; i < 6; i++) { bx += (Math.random() - 0.5) * 3; by -= 2.2; pts.push(new THREE.Vector3(bx, by, -14)); }
  const bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0xd9c8ff, transparent: true, opacity: 0 }));
  group.add(bolt);

  const arcGeo = new THREE.TorusGeometry(17, 0.32, 8, 80, Math.PI);
  const ap = arcGeo.attributes.position;
  const acols = new Float32Array(ap.count * 3);
  const hue = new THREE.Color();
  for (let i = 0; i < ap.count; i++) {
    const ang = Math.atan2(ap.getY(i), ap.getX(i));
    hue.setHSL((ang / Math.PI) * 0.78, 0.85, 0.6);
    acols[i * 3] = hue.r; acols[i * 3 + 1] = hue.g; acols[i * 3 + 2] = hue.b;
  }
  arcGeo.setAttribute("color", new THREE.BufferAttribute(acols, 3));
  const rainbow = new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 }));
  rainbow.position.set(0, -5, -26);
  group.add(rainbow);

  const crystal = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), new THREE.MeshBasicMaterial({ color: 0xffd28a, wireframe: true }));
  crystal.userData = { s: 1 };
  group.add(crystal); interactive.push(crystal);

  let nextFlash = 2, flashV = 0;
  return { group, interactive, update(t, dt) {
    for (let i = 0; i < n1; i++) {
      const dr = drops1[i];
      dr.y -= dr.sp * dt; dr.x += dt * 2.2;
      if (dr.y < -9) { dr.y = 15; dr.x = (Math.random() - 0.5) * 36; }
      d.position.set(dr.x, dr.y, dr.z); d.rotation.z = 0.22; d.updateMatrix();
      rain1.setMatrixAt(i, d.matrix);
    }
    rain1.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < n2; i++) {
      const dr = drops2[i];
      dr.y -= dr.sp * dt; dr.x += dt * 1.4;
      if (dr.y < -9) { dr.y = 16; dr.x = (Math.random() - 0.5) * 44; }
      d.position.set(dr.x, dr.y, dr.z); d.rotation.z = 0.16; d.updateMatrix();
      rain2.setMatrixAt(i, d.matrix);
    }
    rain2.instanceMatrix.needsUpdate = true;
    clouds.position.x = Math.sin(t * 0.1) * 2;
    crystal.rotation.y = t * 0.4; crystal.rotation.z = t * 0.15;
    if (t > nextFlash) { flashV = 1; nextFlash = t + 3 + Math.random() * 4; }
    flashV *= 0.94;
    bolt.material.opacity = flashV * 0.9;
    rainbow.material.opacity = Math.max(0, flashV - 0.25) * 0.55;
  }};
}

/* ---------- 05 CIELO ---------- */
function cielo(q) {
  const group = new THREE.Group(); const interactive = [];

  const count = q.particles;
  const arr = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const starPalette = ["#ffffff", "#ffd28a", "#7ef0ff", "#ffb3d9"].map((h) => new THREE.Color(h));
  for (let i = 0; i < count; i++) {
    const r = 20 * Math.cbrt(Math.random()) + 4;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
    arr[i * 3 + 1] = r * Math.cos(ph) * 0.7;
    arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    const c = starPalette[(Math.random() * starPalette.length) | 0];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, vertexColors: true, transparent: true, opacity: 0.95 }));
  group.add(stars);

  const bandCount = q.mobile ? 250 : 600;
  const barr = new Float32Array(bandCount * 3), bcol = new Float32Array(bandCount * 3);
  const bandPalette = ["#cdd8ff", "#b78aff", "#7ef0ff", "#ffffff"].map((h) => new THREE.Color(h));
  for (let i = 0; i < bandCount; i++) {
    const t01 = Math.random();
    const x = t01 * 56 - 28;
    barr[i * 3] = x + (Math.random() - 0.5) * 5;
    barr[i * 3 + 1] = x * 0.35 + (Math.random() - 0.5) * 3.5;
    barr[i * 3 + 2] = -18 + (Math.random() - 0.5) * 7;
    const c = bandPalette[(Math.random() * bandPalette.length) | 0];
    bcol[i * 3] = c.r; bcol[i * 3 + 1] = c.g; bcol[i * 3 + 2] = c.b;
  }
  const bgeo = new THREE.BufferGeometry();
  bgeo.setAttribute("position", new THREE.BufferAttribute(barr, 3));
  bgeo.setAttribute("color", new THREE.BufferAttribute(bcol, 3));
  const milky = new THREE.Points(bgeo, new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(milky);

  const nebulae = [];
  const nebCfg = [
    { tex: glowTexture("rgba(150,90,255,0.4)", "rgba(80,40,180,0.15)"), pos: [-16, 7, -26], s: [26, 16] },
    { tex: glowTexture("rgba(46,230,196,0.32)", "rgba(20,120,120,0.12)"), pos: [15, -5, -30], s: [30, 18] },
    { tex: glowTexture("rgba(255,110,180,0.3)", "rgba(150,40,90,0.1)"), pos: [4, 12, -34], s: [24, 15] },
  ];
  nebCfg.forEach((cfg, k) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(cfg.s[0], cfg.s[1]),
      new THREE.MeshBasicMaterial({ map: cfg.tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    m.userData = { k };
    group.add(m); nebulae.push(m);
  });

  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 32), new THREE.MeshBasicMaterial({ color: PAPER }));
  moon.userData = { s: 1 };
  group.add(moon); interactive.push(moon);
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 11),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,240,200,0.45)", "rgba(255,180,120,0.15)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  group.add(halo);

  const orbPalette = [0xff7a6b, 0xffd28a, 0x7ef0ff, 0x5affc4, 0xb78aff];
  const orbiters = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0),
      new THREE.MeshBasicMaterial({ color: orbPalette[i], wireframe: true }));
    s.userData = { a: (i / 5) * Math.PI * 2, r: 5 + i * 1.5, sp: 0.25 + 0.08 * i, s: 1 };
    orbiters.add(s); interactive.push(s);
  }
  group.add(orbiters);

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6 * 3), 3));
  const constellation = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x7ef0ff, transparent: true, opacity: 0.4 }));
  group.add(constellation);

  const shoot = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.04, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0 }));
  group.add(shoot);
  let nextShoot = 3;

  return { group, interactive, update(t, dt) {
    stars.rotation.y = t * 0.02;
    milky.rotation.z = Math.sin(t * 0.04) * 0.03;
    nebulae.forEach((m) => {
      m.rotation.z = Math.sin(t * 0.05 + m.userData.k) * 0.1;
      m.material.opacity = 0.85 + Math.sin(t * 0.3 + m.userData.k * 2) * 0.15;
    });
    halo.position.copy(moon.position);
    halo.lookAt(0, 2.6, 24);
    orbiters.children.forEach((s) => {
      const u = s.userData;
      s.position.set(Math.cos(u.a + t * u.sp) * u.r, Math.sin(t * 0.5 + u.a) * 1.5, Math.sin(u.a + t * u.sp) * u.r);
      s.rotation.x = t * 0.8;
    });
    const lp = lineGeo.attributes.position;
    for (let i = 0; i <= 5; i++) {
      const o = orbiters.children[i % 5];
      lp.setXYZ(i, o.position.x, o.position.y, o.position.z);
    }
    lp.needsUpdate = true;
    if (t > nextShoot) { shoot.userData = { x: -18 }; nextShoot = t + 4 + Math.random() * 5; }
    if (shoot.userData.x !== undefined) {
      shoot.userData.x += dt * 16;
      const sx = shoot.userData.x;
      shoot.position.set(sx, 8 - (sx + 18) * 0.12, -10);
      shoot.rotation.z = -0.12;
      shoot.material.opacity = Math.max(0, 1 - Math.abs(sx) / 18);
      if (sx > 18) shoot.userData = {};
    }
  }};
}
