import * as THREE from "three";

export const SEG = 60;

export const ENVS = [
  { id: "roma",     idx: "01", name: "Roma",     bg: "#2a160e", camY: 2.4, lookY: 1.2 },
  { id: "newyork",  idx: "02", name: "New York", bg: "#050914", camY: 3.0, lookY: 3.0 },
  { id: "londra",   idx: "03", name: "Londra",   bg: "#1b2833", camY: 2.6, lookY: 1.6 },
  { id: "dubai",    idx: "04", name: "Dubai",    bg: "#1c1026", camY: 3.4, lookY: 4.0 },
  { id: "mosca",    idx: "05", name: "Mosca",    bg: "#0a0f1e", camY: 2.4, lookY: 1.8 },
];

export function buildEnvironment(i, q) {
  return [roma, newyork, londra, dubai, mosca][i](q);
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

function slab(color, sizeX, topY, thick, sizeZ) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(sizeX, thick || 0.9, sizeZ || 60),
    new THREE.MeshBasicMaterial({ color }));
  m.position.y = topY - (thick || 0.9) / 2;
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

function cityBlocks(count, palette, area, hMin, hMax, clearR, groundY, camX) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const m = new THREE.InstancedMesh(geo, mat, count);
  const d = new THREE.Object3D(); const c = new THREE.Color();
  const placed = []; let guard = 0;
  while (placed.length < count && guard < count * 6) {
    guard++;
    const x = (Math.random() - 0.5) * area[0], z = (Math.random() - 0.5) * area[1];
    if (Math.hypot(x, z) < clearR) continue;
    if (z > 8 && Math.abs(x - camX) < 9) continue;
    const h = hMin + Math.random() * (hMax - hMin);
    const w = 1 + Math.random() * 2.2, dep = 1 + Math.random() * 2.2;
    d.position.set(x, groundY + h / 2, z);
    d.scale.set(w, h, dep);
    d.rotation.y = Math.random() * 0.2 - 0.1;
    d.updateMatrix();
    m.setMatrixAt(placed.length, d.matrix);
    c.set(palette[(Math.random() * palette.length) | 0]);
    m.setColorAt(placed.length, c);
    placed.push({ x, z, w, dep, h });
  }
  m.count = placed.length;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.userData.placed = placed;
  return m;
}

function onionDome(r, colorMain, colorBand) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), new THREE.MeshBasicMaterial({ color: colorMain }));
  s.scale.y = 1.3;
  const band = new THREE.Mesh(new THREE.TorusGeometry(r * 0.82, r * 0.1, 6, 18), new THREE.MeshBasicMaterial({ color: colorBand }));
  band.rotation.x = Math.PI / 2; band.position.y = r * 0.35;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.24, r * 0.9, 8), new THREE.MeshBasicMaterial({ color: colorBand }));
  tip.position.y = r * 1.72;
  g.add(s, band, tip);
  g.userData.dome = s;
  return g;
}

function people(count, colors, xr, zr, groundY) {
  const bodies = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.09, 0.12, 0.62, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }), count);
  const heads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.09, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x2a211c }), count);
  const d = new THREE.Object3D(); const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const x = xr[0] + Math.random() * (xr[1] - xr[0]);
    const z = zr[0] + Math.random() * (zr[1] - zr[0]);
    const s = 0.85 + Math.random() * 0.3;
    d.position.set(x, groundY + 0.31 * s, z);
    d.scale.set(s, s, s);
    d.rotation.y = Math.random() * Math.PI * 2;
    d.updateMatrix(); bodies.setMatrixAt(i, d.matrix);
    c.set(colors[(Math.random() * colors.length) | 0]);
    bodies.setColorAt(i, c);
    d.position.y = groundY + 0.72 * s;
    d.updateMatrix(); heads.setMatrixAt(i, d.matrix);
  }
  if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  const g = new THREE.Group(); g.add(bodies, heads);
  return g;
}

function umbrellaPeople(count, colors, xr, zr, groundY) {
  const g = people(count, ["#2a2d33"], xr, zr, groundY);
  const umbs = new THREE.InstancedMesh(
    new THREE.ConeGeometry(0.36, 0.22, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff }), count);
  const d = new THREE.Object3D(); const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const x = xr[0] + Math.random() * (xr[1] - xr[0]);
    const z = zr[0] + Math.random() * (zr[1] - zr[0]);
    d.position.set(x, groundY + 1.05, z);
    d.rotation.y = Math.random() * Math.PI;
    d.updateMatrix(); umbs.setMatrixAt(i, d.matrix);
    c.set(colors[(Math.random() * colors.length) | 0]);
    umbs.setColorAt(i, c);
  }
  if (umbs.instanceColor) umbs.instanceColor.needsUpdate = true;
  g.add(umbs);
  return g;
}

function makeCar(color, len) {
  const L = len || 1.15;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 0.5), new THREE.MeshBasicMaterial({ color }));
  body.position.y = 0.22;
  const cab = new THREE.Mesh(new THREE.BoxGeometry(L * 0.55, 0.22, 0.44), new THREE.MeshBasicMaterial({ color: 0x0d1117 }));
  cab.position.y = 0.44;
  g.add(body, cab);
  return g;
}

function makeBus() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.95, 0.7), new THREE.MeshBasicMaterial({ color: 0xc0392b }));
  body.position.y = 0.55;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.1, 0.72), new THREE.MeshBasicMaterial({ color: 0xf2ead2 }));
  stripe.position.y = 0.72;
  const wins = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.72), new THREE.MeshBasicMaterial({ color: 0x101820 }));
  wins.position.y = 0.9;
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
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.14), new THREE.MeshBasicMaterial({ color }));
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
      new THREE.MeshBasicMaterial({ color: [0x8a8f96, 0x6e7378, 0xa8adb2][i % 3] }));
    body.scale.set(1, 0.9, 1.25); body.position.y = 0.1;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), new THREE.MeshBasicMaterial({ color: 0x4e5459 }));
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
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.18), new THREE.MeshBasicMaterial({ color }));
  body.position.y = 0.24;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), new THREE.MeshBasicMaterial({ color }));
  head.position.set(0.3, 0.36, 0);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), new THREE.MeshBasicMaterial({ color }));
  tail.position.set(-0.3, 0.34, 0); tail.rotation.z = 0.5;
  g.add(body, head, tail);
  return g;
}

function moonSphere(r, color) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 20, 20), new THREE.MeshBasicMaterial({ color }));
}

/* ---------- 01 ROMA ---------- */
function roma(q) {
  const group = new THREE.Group(); const interactive = [];
  group.add(slab(0x3a2418, 92, -4));
  const piazza = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 0.18, 28), new THREE.MeshBasicMaterial({ color: 0xcbb494 }));
  piazza.position.set(0, -3.95, 0); group.add(piazza);

  group.add(cityBlocks(q.mobile ? 50 : 90, [0x8a4a2e, 0xa85838, 0x7a3c28, 0x96522f], [64, 58], 2, 7, 7, -4, -7));

  const cupola = new THREE.Group();
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 3, 18), new THREE.MeshBasicMaterial({ color: 0xe8d5b7 }));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd9b87a }));
  dome.position.y = 1.5; dome.userData.s = 1; interactive.push(dome);
  const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1.2, 8), new THREE.MeshBasicMaterial({ color: 0xe8d5b7 }));
  lantern.position.y = 4.4;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffd28a }));
  tip.position.y = 5.2;
  cupola.add(drum, dome, lantern, tip);
  cupola.position.set(0, -1.2, -4);
  group.add(cupola);

  const d = new THREE.Object3D();
  const colN = q.mobile ? 14 : 22;
  const colonnade = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.34, 1, 8), new THREE.MeshBasicMaterial({ color: 0xd9c6a5 }), colN);
  for (let i = 0; i < colN; i++) {
    const a = (i / colN - 0.5) * Math.PI * 0.95;
    d.position.set(Math.sin(a) * 10, -4 + 1.8, -Math.cos(a) * 10 + 7);
    d.scale.set(1, 3.6, 1); d.rotation.set(0, 0, 0); d.updateMatrix();
    colonnade.setMatrixAt(i, d.matrix);
  }
  group.add(colonnade);

  const ruinN = q.mobile ? 6 : 10;
  const ruins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.36, 1, 8), new THREE.MeshBasicMaterial({ color: 0xcbb494 }), ruinN);
  for (let i = 0; i < ruinN; i++) {
    const h = 1 + Math.random() * 2.2;
    d.position.set((Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4), -4 + h / 2, -2 + Math.random() * 10);
    d.scale.set(1, h, 1); d.updateMatrix();
    ruins.setMatrixAt(i, d.matrix);
  }
  group.add(ruins);

  const cyN = q.mobile ? 8 : 14;
  const cypress = new THREE.InstancedMesh(new THREE.ConeGeometry(0.5, 1, 7), new THREE.MeshBasicMaterial({ color: 0x1a3a24 }), cyN);
  for (let i = 0; i < cyN; i++) {
    const h = 3 + Math.random() * 2.5;
    d.position.set((Math.random() - 0.5) * 36, -4 + h / 2, (Math.random() - 0.5) * 40);
    d.scale.set(1, h, 1); d.updateMatrix();
    cypress.setMatrixAt(i, d.matrix);
  }
  group.add(cypress);

  const sun = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffb347 }));
  sun.position.set(-13, 6.5, -24); sun.userData.s = 1; group.add(sun); interactive.push(sun);
  const sunHalo = new THREE.Mesh(new THREE.PlaneGeometry(15, 15),
    new THREE.MeshBasicMaterial({ map: glowTexture("rgba(255,180,90,0.55)", "rgba(200,90,40,0.2)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  sunHalo.position.copy(sun.position);
  group.add(sunHalo);
  const moon = moonSphere(1.1, 0xe8e4da);
  moon.position.set(13, 10.5, -26); group.add(moon);

  const dust = coloredPoints(q.mobile ? 120 : 240, 40, 50, -3, 7, ["#ffd28a", "#ffb347", "#ff9a5a"], 0.08, true);
  group.add(dust);

  const folks = people(q.mobile ? 14 : 24, [0xd96b4f, 0xe8d5b7, 0x5a6e8c, 0x8c3a3a, 0x2f2f38], [-11, 11], [-1, 11], -3.86);
  group.add(folks);
  const birdsGround = pigeons(q.mobile ? 6 : 10, -3.86, [-8, 8], [2, 10]);
  group.add(birdsGround);
  const swallows = birds(q.mobile ? 4 : 7, 0x1a1a22, 9, 12, -6);
  group.add(swallows);

  const vespaColors = [0xd96b6b, 0x6baed6, 0xe8d5b7];
  const vespe = vespaColors.map((c) => makeCar(c, 0.7));
  const auto = [makeCar(0xf0f0ea, 1.1), makeCar(0x3a4a5a, 1.1)];
  vespe.forEach((v) => group.add(v));
  auto.forEach((a) => group.add(a));
  const traff = traffic([
    { mesh: vespe[0], lane: 13.5, dir: 1, sp: 7, off: 0, y: -3.9 },
    { mesh: vespe[1], lane: 14.5, dir: -1, sp: 6, off: 15, y: -3.9 },
    { mesh: vespe[2], lane: 13.5, dir: 1, sp: 8, off: 30, y: -3.9 },
    { mesh: auto[0], lane: 16.5, dir: -1, sp: 9, off: 8, y: -3.9 },
    { mesh: auto[1], lane: 17.5, dir: 1, sp: 10, off: 25, y: -3.9 },
  ]);

  return { group, interactive, update(t, dt) {
    dust.rotation.y = t * 0.02;
    dust.position.y = Math.sin(t * 0.3) * 0.4;
    tip.scale.setScalar(1 + Math.sin(t * 2) * 0.15);
    traff.update(t);
    swallows.userData.update(t);
    birdsGround.userData.update(t);
  }};
}

/* ---------- 02 NEW YORK ---------- */
function newyork(q) {
  const group = new THREE.Group(); const interactive = [];
  group.add(slab(0x0a0e18, 92, -4));
  [-3, 7.6].forEach((z) => {
    const walk = new THREE.Mesh(new THREE.BoxGeometry(66, 0.14, 1.6), new THREE.MeshBasicMaterial({ color: 0x1a2433 }));
    walk.position.set(0, -3.95, z); group.add(walk);
  });

  const blocks = cityBlocks(q.mobile ? 90 : 170, [0x0d1420, 0x111a2a, 0x0a1018, 0x131e30], [66, 60], 3, 16, 8, -4, 7);
  group.add(blocks);

  const winPos = [], winCol = [];
  const winPalette = ["#ffd76a", "#9fd8ff", "#ffffff", "#ffc46a"].map((h) => new THREE.Color(h));
  blocks.userData.placed.forEach((b) => {
    const nW = q.mobile ? 4 : 8;
    for (let k = 0; k < nW; k++) {
      winPos.push(b.x + (Math.random() - 0.5) * b.w * 0.8, -3 + Math.random() * (b.h - 1), b.z + b.dep / 2 + 0.04);
      const c = winPalette[(Math.random() * winPalette.length) | 0];
      winCol.push(c.r, c.g, c.b);
    }
  });
  const wg = new THREE.BufferGeometry();
  wg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(winPos), 3));
  wg.setAttribute("color", new THREE.BufferAttribute(new Float32Array(winCol), 3));
  group.add(new THREE.Points(wg, new THREE.PointsMaterial({ size: 0.14, vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })));

  const tower = new THREE.Group();
  let y = -4;
  [[3.2, 8], [2.6, 5], [2, 3.5], [1.4, 2.5]].forEach(([w, h]) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshBasicMaterial({ color: 0x16233c }));
    seg.position.y = y + h / 2; y += h; tower.add(seg);
  });
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.3, 3.4, 6), new THREE.MeshBasicMaterial({ color: 0x9fd8ff }));
  spire.position.y = y + 1.7; spire.userData.s = 1; interactive.push(spire);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
  beacon.position.y = y + 3.5;
  tower.add(spire, beacon);
  tower.position.set(0, 0, -8);
  group.add(tower);

  const moon = moonSphere(2.2, 0xe8ecf2);
  moon.position.set(11, 13, -27); moon.userData.s = 1; group.add(moon); interactive.push(moon);
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

  const carCols = [0xffcf3f, 0xffcf3f, 0xffcf3f, 0xc0392b, 0xf0f0ea, 0x3a6ea8, 0x222831];
  const cars = carCols.map((c) => makeCar(c));
  cars.forEach((c) => group.add(c));
  const traff = traffic(cars.map((c, i) => ({
    mesh: c, lane: i % 2 ? 5.8 : 3.8, dir: i % 2 ? -1 : 1, sp: 7 + Math.random() * 5, off: i * 7, y: -3.9,
  })));

  const folksA = people(q.mobile ? 10 : 16, [0xd9d9d9, 0x8c3a3a, 0x2f4a6e, 0xd9a441], [-16, 16], [-3.6, -2.4], -3.88);
  const folksB = people(q.mobile ? 10 : 16, [0xd9d9d9, 0x2f4a6e, 0xc0392b, 0x5a6e8c], [-16, 16], [7.0, 8.2], -3.88);
  group.add(folksA, folksB);
  const birdsGround = pigeons(q.mobile ? 4 : 7, -3.88, [-10, 10], [6.8, 8]);
  group.add(birdsGround);

  const steamTex = glowTexture("rgba(220,230,255,0.25)", "rgba(160,180,220,0.1)");
  const steams = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.2),
      new THREE.MeshBasicMaterial({ map: steamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.position.set(-12 + i * 11, -2.4, 2.6);
    s.userData = { ph: i * 2.1 };
    group.add(s); steams.push(s);
  }

  return { group, interactive, update(t, dt) {
    traff.update(t);
    bill.material.opacity = 0.8 + Math.sin(t * 7) * 0.12 + (Math.random() < 0.02 ? -0.3 : 0);
    beacon.scale.setScalar(1 + Math.sin(t * 4) * 0.3);
    steams.forEach((s) => {
      const p = (t * 0.25 + s.userData.ph) % 1;
      s.position.y = -3 + p * 3.4;
      s.material.opacity = 0.9 * (1 - p);
    });
    birdsGround.userData.update(t);
  }};
}

/* ---------- 03 LONDRA ---------- */
function londra(q) {
  const group = new THREE.Group(); const interactive = [];
  group.add(slab(0x1a2126, 92, -4));
  const thames = slab(0x24404f, 92, -3.8, 0.4, 12);
  thames.position.z = 4;
  group.add(thames);

  group.add(cityBlocks(q.mobile ? 40 : 62, [0x3a4148, 0x2f363d, 0x454e55, 0x39424a], [62, 56], 3, 10, 10, -4, -7));

  const ben = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9, 1.6), new THREE.MeshBasicMaterial({ color: 0x9aa3a8 }));
  shaft.position.y = 4.5;
  const clockBox = new THREE.Mesh(new THREE.BoxGeometry(2, 1.6, 2), new THREE.MeshBasicMaterial({ color: 0x8a9398 }));
  clockBox.position.y = 9.6;
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), new THREE.MeshBasicMaterial({ color: 0xf2ead2 }));
  face.position.set(0, 9.6, 1.02);
  const handA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.02), new THREE.MeshBasicMaterial({ color: 0x222222 }));
  handA.position.set(0, 9.75, 1.05);
  const handB = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0x222222 }));
  handB.position.set(0.15, 9.6, 1.05);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2, 4), new THREE.MeshBasicMaterial({ color: 0x2f363d }));
  roof.position.y = 11.4; roof.rotation.y = Math.PI / 4;
  roof.userData.s = 1; interactive.push(roof);
  ben.add(shaft, clockBox, face, handA, handB, roof);
  ben.position.set(6.5, -4, -6);
  group.add(ben);

  const eye = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.5, 0.12, 8, 48), new THREE.MeshBasicMaterial({ color: 0xdde3e8 }));
  ring.userData.s = 1; interactive.push(ring);
  eye.add(ring);
  const capsules = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), new THREE.MeshBasicMaterial({ color: 0xcc3333 }));
    cap.position.set(Math.cos(a) * 5.5, Math.sin(a) * 5.5, 0);
    capsules.add(cap);
  }
  eye.add(capsules);
  const legA = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.5, 6), new THREE.MeshBasicMaterial({ color: 0x9aa3a8 }));
  legA.position.set(-1.4, -4.5, 0); legA.rotation.z = 0.3;
  const legB = legA.clone(); legB.position.x = 1.4; legB.rotation.z = -0.3;
  eye.add(legA, legB);
  eye.position.set(-8, 1.8, -10);
  group.add(eye);

  const paleSun = new THREE.Mesh(new THREE.CircleGeometry(2, 24),
    new THREE.MeshBasicMaterial({ color: 0xd8dde0, transparent: true, opacity: 0.85 }));
  paleSun.position.set(-15, 9, -28); group.add(paleSun);
  const moon = moonSphere(0.9, 0xdde3e8);
  moon.position.set(14, 12, -28); group.add(moon);

  const busA = makeBus(), busB = makeBus();
  const cabA = makeCar(0x111111), cabB = makeCar(0x111111), cabC = makeCar(0x2a2d33);
  [busA, busB, cabA, cabB, cabC].forEach((v) => group.add(v));
  const traff = traffic([
    { mesh: busA, lane: 11.5, dir: 1, sp: 5.5, off: 0, y: -3.9 },
    { mesh: busB, lane: 12.8, dir: -1, sp: 5, off: 22, y: -3.9 },
    { mesh: cabA, lane: 11.5, dir: 1, sp: 8, off: 14, y: -3.9 },
    { mesh: cabB, lane: 12.8, dir: -1, sp: 9, off: 33, y: -3.9 },
    { mesh: cabC, lane: 11.5, dir: 1, sp: 7.5, off: 38, y: -3.9 },
  ]);

  const n = q.mobile ? 120 : 220;
  const drizzle = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.012, 0.7, 0.012),
    new THREE.MeshBasicMaterial({ color: 0x9fb4c8, transparent: true, opacity: 0.35 }), n);
  const dd = new THREE.Object3D(); const drops = [];
  for (let i = 0; i < n; i++) drops.push({ x: (Math.random() - 0.5) * 40, y: Math.random() * 22 - 6, z: (Math.random() - 0.5) * 50, sp: 5 + Math.random() * 4 });
  group.add(drizzle);

  const lamps = coloredPoints(q.mobile ? 40 : 70, 50, 44, -3.6, -3, ["#ffd76a", "#ffb347"], 0.16, true);
  group.add(lamps);

  const folks = umbrellaPeople(q.mobile ? 10 : 16, [0xc0392b, 0x2f4a6e, 0x111111, 0x5a3a6e], [-14, 14], [-1, 9], -4);
  group.add(folks);
  const birdsGround = pigeons(q.mobile ? 5 : 8, -4, [-10, 2], [0, 8]);
  group.add(birdsGround);
  const crows = birds(q.mobile ? 3 : 5, 0x14161a, 10, 10, -8);
  group.add(crows);
  const pup = dog(0x3a2c1e);
  group.add(pup);

  return { group, interactive, update(t, dt) {
    capsules.rotation.z = t * 0.1;
    traff.update(t);
    for (let i = 0; i < n; i++) {
      const dr = drops[i];
      dr.y -= dr.sp * dt;
      if (dr.y < -6) { dr.y = 14; dr.x = (Math.random() - 0.5) * 40; }
      dd.position.set(dr.x, dr.y, dr.z); dd.rotation.z = 0.1; dd.updateMatrix();
      drizzle.setMatrixAt(i, dd.matrix);
    }
    drizzle.instanceMatrix.needsUpdate = true;
    handA.rotation.z = -t * 0.02;
    const dx = Math.sin(t * 0.35) * 9;
    pup.position.set(dx, -4, 9.5);
    pup.rotation.y = Math.cos(t * 0.35) > 0 ? 0 : Math.PI;
    birdsGround.userData.update(t);
    crows.userData.update(t);
  }};
}

/* ---------- 04 DUBAI ---------- */
function dubai(q) {
  const group = new THREE.Group(); const interactive = [];
  group.add(slab(0x6b5236, 92, -4));

  group.add(cityBlocks(q.mobile ? 55 : 100, [0xd8dce8, 0xb9c4d8, 0x8fa3c8, 0xe8e0c8], [64, 58], 4, 14, 9, -4, 7));

  const burj = new THREE.Group();
  let by = -4;
  [2.4, 1.9, 1.45, 1.0, 0.6].forEach((r) => {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, 5, 10), new THREE.MeshBasicMaterial({ color: 0xe8e8f0 }));
    seg.position.y = by + 2.5; by += 5; burj.add(seg);
  });
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.3, 4.5, 6), new THREE.MeshBasicMaterial({ color: 0xffd28a }));
  needle.position.y = by + 2.2; needle.userData.s = 1; interactive.push(needle);
  burj.add(needle);
  burj.position.set(0, 0, -8);
  group.add(burj);

  const twist = new THREE.Group();
  for (let i = 0; i < 14; i++) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.3, 2.2), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xd9a441 : 0xb98a34 }));
    seg.position.y = -4 + 0.65 + i * 1.3;
    seg.rotation.y = i * 0.16;
    twist.add(seg);
  }
  twist.children[13].userData.s = 1; interactive.push(twist.children[13]);
  twist.position.set(-9, 0, -3);
  group.add(twist);

  const sail = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 2.6, 11, 8, 1), new THREE.MeshBasicMaterial({ color: 0xf0ede4 }));
  sail.scale.z = 0.28;
  sail.position.set(8, 1.5, -6);
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

  const sunsetSun = new THREE.Mesh(new THREE.SphereGeometry(3, 20, 20), new THREE.MeshBasicMaterial({ color: 0xff9a50 }));
  sunsetSun.position.set(-19, -0.5, -30); group.add(sunsetSun);
  const crescent = moonSphere(1.2, 0xf2ead8);
  crescent.position.set(16, 11, -28); crescent.userData.s = 1; group.add(crescent); interactive.push(crescent);

  const palms = coloredPoints(q.mobile ? 50 : 90, 56, 50, -3.7, -2.8, ["#ffd76a", "#ff9a5a"], 0.14, true);
  group.add(palms);

  const luxCols = [0xf0f0ea, 0xd9a441, 0x111111, 0x8fa3c8];
  const lux = luxCols.map((c) => makeCar(c, 1.25));
  lux.forEach((c) => group.add(c));
  const traff = traffic(lux.map((c, i) => ({
    mesh: c, lane: i % 2 ? 7.2 : 5.6, dir: i % 2 ? -1 : 1, sp: 9 + Math.random() * 4, off: i * 11, y: -3.9,
  })));

  const falcons = birds(q.mobile ? 3 : 4, 0x2a2118, 14, 10, -10);
  group.add(falcons);
  const folks = people(q.mobile ? 8 : 12, [0xf0ede4, 0xd9a441, 0x5a6e8c, 0x8c3a3a], [2, 10], [0, 8], -4);
  group.add(folks);

  return { group, interactive, update(t) {
    twist.rotation.y = t * 0.1;
    fountains.forEach((r) => {
      const p = (t * 0.3 + r.userData.off) % 1;
      r.scale.setScalar(1 + p * 4);
      r.material.opacity = 0.7 * (1 - p);
    });
    needle.scale.setScalar(1 + Math.sin(t * 2.4) * 0.06);
    traff.update(t);
    falcons.userData.update(t);
  }};
}

/* ---------- 05 MOSCA ---------- */
function mosca(q) {
  const group = new THREE.Group(); const interactive = [];
  group.add(slab(0xdfe6f0, 92, -4));

  const d = new THREE.Object3D();
  const wallN = 9;
  const wall = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x8e2f24 }), wallN);
  for (let i = 0; i < wallN; i++) {
    d.position.set(-16 + i * 4, -4 + 1.5, -13);
    d.scale.set(3.8, 3, 1.2);
    d.updateMatrix(); wall.setMatrixAt(i, d.matrix);
  }
  group.add(wall);
  for (let i = 0; i < 3; i++) {
    const tw = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 5, 8), new THREE.MeshBasicMaterial({ color: 0x9e352a }));
    const roofG = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 8), new THREE.MeshBasicMaterial({ color: 0x1f6e3a }));
    roofG.position.y = 3.4;
    tw.add(base, roofG);
    tw.position.set(-12 + i * 12, -4 + 2.5, -13);
    group.add(tw);
  }

  const basil = new THREE.Group();
  const mainBase = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2, 6, 10), new THREE.MeshBasicMaterial({ color: 0xe8e0d0 }));
  mainBase.position.y = 3;
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
    const b = new THREE.Mesh(new THREE.CylinderGeometry(cfg.r * 0.75, cfg.r * 0.9, cfg.h, 8), new THREE.MeshBasicMaterial({ color: 0xd8ccb8 }));
    b.position.set(cfg.x, cfg.h / 2, cfg.z);
    basil.add(b);
    const dm = onionDome(cfg.r, cfg.c, cfg.b);
    dm.position.set(cfg.x, cfg.h + cfg.r * 0.9, cfg.z);
    basil.add(dm);
  });
  basil.position.set(0, -4, -3);
  group.add(basil);

  const moon = moonSphere(2.6, 0xe8ecf2);
  moon.position.set(11, 11, -26); moon.userData.s = 1; group.add(moon); interactive.push(moon);
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

  const folks = people(q.mobile ? 10 : 18, [0x8c3a3a, 0x2f4a6e, 0x1f6e3a, 0x8e44ad, 0xd9d9d9], [-14, 14], [-6, 8], -4);
  group.add(folks);

  const headTex = glowTexture("rgba(255,240,190,0.5)", "rgba(255,200,120,0.15)");
  const carsM = [makeCar(0x2f4a6e, 1.1), makeCar(0x8c3a3a, 1.1), makeCar(0x3a3f45, 1.1)];
  carsM.forEach((c) => {
    const h = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.7),
      new THREE.MeshBasicMaterial({ map: headTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    h.position.set(0.85, 0.25, 0);
    c.add(h);
    group.add(c);
  });
  const traff = traffic(carsM.map((c, i) => ({
    mesh: c, lane: i % 2 ? 11 : 9.6, dir: i % 2 ? -1 : 1, sp: 4 + Math.random() * 2, off: i * 15, y: -3.9,
  })));

  const crows = birds(q.mobile ? 3 : 5, 0x111111, 9, 10, -6);
  group.add(crows);

  return { group, interactive, update(t, dt) {
    const p = sg.attributes.position;
    for (let i = 0; i < snowCount; i++) {
      let y2 = p.array[i * 3 + 1] - sDrops[i].sp * dt;
      if (y2 < -4) y2 = 14;
      p.array[i * 3 + 1] = y2;
      p.array[i * 3] += Math.sin(t * 0.8 + sDrops[i].ph) * 0.004;
    }
    p.needsUpdate = true;
    traff.update(t);
    crows.userData.update(t);
  }};
}
