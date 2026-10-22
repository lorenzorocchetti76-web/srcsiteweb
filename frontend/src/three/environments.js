import * as THREE from "three";

export const SEG = 60;
const SOFT = 0x8aa8d8, PAPER = 0xf6f6f4, INK = 0x0a0a0a, BLUE = 0x224d8a;

export const ENVS = [
  { id: "foresta",    idx: "01", name: "Foresta",    bg: "#050505" },
  { id: "oceano",     idx: "02", name: "Oceano",     bg: "#10294e" },
  { id: "ghiacciaio", idx: "03", name: "Ghiacciaio", bg: "#ecebe5" },
  { id: "tempesta",   idx: "04", name: "Tempesta",   bg: "#224d8a" },
  { id: "cielo",      idx: "05", name: "Cielo",      bg: "#040409" },
];

export function buildEnvironment(i, q) {
  return [foresta, oceano, ghiacciaio, tempesta, cielo][i](q);
}

function foresta(q) {
  const group = new THREE.Group(); const interactive = [];
  const n = q.mobile ? 46 : 90;
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.09, 0.16, 1, 5),
    new THREE.MeshBasicMaterial({ color: 0x101418 }), n);
  const d = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const h = 12 + Math.random() * 12;
    d.position.set((Math.random() < 0.5 ? -1 : 1) * (3.5 + Math.random() * 11), h / 2 - 6, (Math.random() - 0.5) * 58);
    d.scale.set(1 + Math.random() * 1.6, h, 1 + Math.random() * 1.6);
    d.rotation.y = Math.random() * Math.PI;
    d.updateMatrix(); trunks.setMatrixAt(i, d.matrix);
  }
  group.add(trunks);
  const fc = q.mobile ? 140 : 320;
  const fp = new Float32Array(fc * 3);
  for (let i = 0; i < fc; i++) {
    fp[i * 3] = (Math.random() - 0.5) * 30;
    fp[i * 3 + 1] = Math.random() * 9 - 3;
    fp[i * 3 + 2] = (Math.random() - 0.5) * 54;
  }
  const fgeo = new THREE.BufferGeometry();
  fgeo.setAttribute("position", new THREE.BufferAttribute(fp, 3));
  const flies = new THREE.Points(fgeo, new THREE.PointsMaterial({ color: SOFT, size: 0.09, transparent: true, opacity: 0.95 }));
  group.add(flies);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2, 24, 24), new THREE.MeshBasicMaterial({ color: PAPER }));
  moon.position.set(7, 8, -16); moon.userData.s = 1;
  group.add(moon); interactive.push(moon);
  const stone = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 0), new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true }));
  stone.position.set(0, 0.6, 0); stone.userData.s = 1;
  group.add(stone); interactive.push(stone);
  return { group, interactive, update(t) {
    flies.rotation.y = Math.sin(t * 0.05) * 0.2;
    flies.position.y = Math.sin(t * 0.4) * 0.25;
    stone.position.y = 0.6 + Math.sin(t * 0.9) * 0.35;
    stone.rotation.y = t * 0.5; stone.rotation.x = t * 0.2;
  }};
}

function oceano(q) {
  const group = new THREE.Group(); const interactive = [];
  const sx = q.mobile ? 42 : 76, sy = q.mobile ? 20 : 36;
  const geo = new THREE.PlaneGeometry(90, 46, sx, sy);
  geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const wave = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: SOFT, wireframe: true, transparent: true, opacity: 0.5 }));
  wave.position.y = -4; group.add(wave);
  const drops = new THREE.Group();
  const tetGeo = new THREE.TetrahedronGeometry(1);
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Mesh(tetGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? PAPER : SOFT, wireframe: true }));
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
  }};
}

function ghiacciaio(q) {
  const group = new THREE.Group(); const interactive = [];
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(92, 92), new THREE.MeshBasicMaterial({ color: 0xe4e2da }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -5; group.add(ground);
  const n = q.mobile ? 18 : 30;
  const rocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: INK }), n);
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
  berg.add(new THREE.LineSegments(new THREE.EdgesGeometry(berg.geometry), new THREE.LineBasicMaterial({ color: BLUE })));
  berg.position.y = -0.5; berg.userData = { s: 1 };
  group.add(berg); interactive.push(berg);
  const shards = new THREE.Group();
  const ns = q.mobile ? 8 : 14;
  for (let i = 0; i < ns; i++) {
    const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.4 + Math.random() * 0.5), new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true }));
    s.userData = { a: Math.random() * Math.PI * 2, r: 4.5 + Math.random() * 5, y: Math.random() * 7 - 1.5, sp: 0.15 + Math.random() * 0.35, s: 1 };
    shards.add(s); interactive.push(s);
  }
  group.add(shards);
  return { group, interactive, update(t) {
    berg.rotation.y = t * 0.12;
    shards.children.forEach((s) => {
      const u = s.userData;
      s.position.set(Math.cos(u.a + t * u.sp) * u.r, u.y + Math.sin(t * 0.7 + u.a) * 0.5, Math.sin(u.a + t * u.sp) * u.r);
      s.rotation.x = t * u.sp; s.rotation.y = t * u.sp * 1.4;
    });
  }};
}

function tempesta(q) {
  const group = new THREE.Group(); const interactive = [];
  const n = q.mobile ? 260 : 620;
  const rain = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.02, 1.5, 0.02),
    new THREE.MeshBasicMaterial({ color: SOFT, transparent: true, opacity: 0.55 }), n);
  const d = new THREE.Object3D(); const drops = [];
  for (let i = 0; i < n; i++) {
    drops.push({ x: (Math.random() - 0.5) * 36, y: Math.random() * 24 - 8, z: (Math.random() - 0.5) * 56, sp: 9 + Math.random() * 8 });
  }
  group.add(rain);
  const clouds = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(3 + Math.random() * 3, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x16345f, transparent: true, opacity: 0.85 }));
    c.position.set((Math.random() - 0.5) * 30, 8 + Math.random() * 4, (Math.random() - 0.5) * 40);
    c.scale.y = 0.45; clouds.add(c);
  }
  group.add(clouds);
  const pts = []; let bx = 0, by = 10;
  pts.push(new THREE.Vector3(bx, by, -14));
  for (let i = 0; i < 6; i++) { bx += (Math.random() - 0.5) * 3; by -= 2.2; pts.push(new THREE.Vector3(bx, by, -14)); }
  const bolt = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: PAPER, transparent: true, opacity: 0 }));
  group.add(bolt);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), new THREE.MeshBasicMaterial({ color: PAPER, wireframe: true }));
  rock.userData = { s: 1 };
  group.add(rock); interactive.push(rock);
  let nextFlash = 2;
  return { group, interactive, update(t, dt) {
    for (let i = 0; i < n; i++) {
      const dr = drops[i];
      dr.y -= dr.sp * dt; dr.x += dt * 2.2;
      if (dr.y < -9) { dr.y = 15; dr.x = (Math.random() - 0.5) * 36; }
      d.position.set(dr.x, dr.y, dr.z); d.rotation.z = 0.22; d.updateMatrix();
      rain.setMatrixAt(i, d.matrix);
    }
    rain.instanceMatrix.needsUpdate = true;
    clouds.position.x = Math.sin(t * 0.1) * 2;
    rock.rotation.y = t * 0.4; rock.rotation.z = t * 0.15;
    if (t > nextFlash) { bolt.material.opacity = 0.9; nextFlash = t + 2.5 + Math.random() * 4; }
    bolt.material.opacity *= 0.86;
  }};
}

function cielo(q) {
  const group = new THREE.Group(); const interactive = [];
  const count = q.particles;
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 20 * Math.cbrt(Math.random()) + 4;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(ph) * Math.cos(th);
    arr[i * 3 + 1] = r * Math.cos(ph) * 0.7;
    arr[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: SOFT, size: 0.08, transparent: true, opacity: 0.95 }));
  group.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.4, 32, 32), new THREE.MeshBasicMaterial({ color: PAPER }));
  moon.userData = { s: 1 };
  group.add(moon); interactive.push(moon);
  const orbiters = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: BLUE, wireframe: true }));
    s.userData = { a: (i / 5) * Math.PI * 2, r: 5 + i * 1.5, sp: 0.25 + 0.08 * i, s: 1 };
    orbiters.add(s); interactive.push(s);
  }
  group.add(orbiters);
  const shoot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.03, 0.03),
    new THREE.MeshBasicMaterial({ color: PAPER, transparent: true, opacity: 0 }));
  group.add(shoot);
  let nextShoot = 3;
  return { group, interactive, update(t, dt) {
    stars.rotation.y = t * 0.02;
    orbiters.children.forEach((s) => {
      const u = s.userData;
      s.position.set(Math.cos(u.a + t * u.sp) * u.r, Math.sin(t * 0.5 + u.a) * 1.5, Math.sin(u.a + t * u.sp) * u.r);
      s.rotation.x = t * 0.8;
    });
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
