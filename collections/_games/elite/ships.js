// Ship stats and low-poly hulls. Nose points along local −z.
(function (root) {
  "use strict";

  const STATION = { face: 100, halfW: 30, halfH: 12, radius: 104, back: -78 };

  const SHIPS = {
    sidewinder: { name: "Sidewinder", hull: 46, speed: 30, agility: 2.35, damage: 8, cool: 0.62, range: 1700, missiles: 0, bounty: 250, cargo: 1, radius: 14 },
    gecko:      { name: "Gecko", hull: 62, speed: 28, agility: 2.15, damage: 9, cool: 0.55, range: 1800, missiles: 1, bounty: 400, cargo: 1, radius: 15 },
    adder:      { name: "Adder", hull: 78, speed: 26, agility: 1.95, damage: 10, cool: 0.5, range: 1900, missiles: 1, bounty: 500, cargo: 2, radius: 16 },
    krait:      { name: "Krait", hull: 86, speed: 31, agility: 2.1, damage: 11, cool: 0.48, range: 1900, missiles: 1, bounty: 600, cargo: 1, radius: 17 },
    mamba:      { name: "Mamba", hull: 96, speed: 34, agility: 2.25, damage: 12, cool: 0.42, range: 2000, missiles: 1, bounty: 700, cargo: 1, radius: 17 },
    cobra1:     { name: "Cobra Mk I", hull: 110, speed: 28, agility: 1.8, damage: 12, cool: 0.46, range: 2000, missiles: 1, bounty: 800, cargo: 2, radius: 17 },
    worm:       { name: "Worm", hull: 64, speed: 22, agility: 1.5, damage: 8, cool: 0.6, range: 1500, missiles: 0, bounty: 450, cargo: 0, radius: 15 },
    viper:      { name: "Viper", hull: 150, speed: 33, agility: 2.2, damage: 15, cool: 0.34, range: 2300, missiles: 1, bounty: 0, cargo: 0, radius: 16 },
    moray:      { name: "Moray", hull: 160, speed: 25, agility: 1.65, damage: 13, cool: 0.4, range: 2100, missiles: 1, bounty: 950, cargo: 2, radius: 20 },
    cobra3:     { name: "Cobra Mk III", hull: 190, speed: 32, agility: 1.7, damage: 15, cool: 0.38, range: 2300, missiles: 2, bounty: 1300, cargo: 3, radius: 20 },
    asp:        { name: "Asp Mk II", hull: 210, speed: 36, agility: 1.85, damage: 16, cool: 0.36, range: 2500, missiles: 1, bounty: 1600, cargo: 2, radius: 22 },
    ferdelance: { name: "Fer-de-Lance", hull: 230, speed: 34, agility: 1.95, damage: 19, cool: 0.32, range: 2500, missiles: 2, bounty: 2200, cargo: 2, radius: 22 },
    python:     { name: "Python", hull: 340, speed: 22, agility: 1.05, damage: 18, cool: 0.4, range: 2400, missiles: 2, bounty: 2400, cargo: 5, radius: 30 },
    boa:        { name: "Boa", hull: 380, speed: 23, agility: 1.1, damage: 17, cool: 0.42, range: 2300, missiles: 2, bounty: 2800, cargo: 4, radius: 28 },
    anaconda:   { name: "Anaconda", hull: 560, speed: 18, agility: 0.72, damage: 24, cool: 0.48, range: 2700, missiles: 3, bounty: 4500, cargo: 7, radius: 42 },
    thargoid:   { name: "Thargoid", hull: 500, speed: 30, agility: 1.45, damage: 22, cool: 0.26, range: 2700, missiles: 0, bounty: 5000, cargo: 0, radius: 34, alien: true },
    thargon:    { name: "Thargon", hull: 30, speed: 38, agility: 2.7, damage: 9, cool: 0.4, range: 1600, missiles: 0, bounty: 200, cargo: 0, radius: 7, alien: true },
    asteroid:   { name: "Asteroid", hull: 40, speed: 3, agility: 0, damage: 0, cool: 9, range: 0, missiles: 0, bounty: 0, cargo: 0, radius: 20 },
    missile:    { name: "Missile", hull: 6, speed: 50, agility: 3.4, damage: 78, cool: 9, range: 0, missiles: 0, bounty: 0, cargo: 0, radius: 3.2 },
    canister:   { name: "Cargo Canister", hull: 6, speed: 0, agility: 0, damage: 0, cool: 9, range: 0, missiles: 0, bounty: 0, cargo: 0, radius: 5 },
    pod:        { name: "Escape Pod", hull: 8, speed: 10, agility: 0, damage: 0, cool: 9, range: 0, missiles: 0, bounty: 0, cargo: 0, radius: 5 }
  };

  const LASERS = {
    pulse:    { name: "Pulse", damage: 22, cool: 0.26, heat: 13, energy: 3, range: 2700, color: [0.45, 0.9, 1] },
    beam:     { name: "Beam", damage: 8, cool: 0.07, heat: 6, energy: 1.1, range: 2500, color: [1, 0.38, 0.32] },
    military: { name: "Military", damage: 42, cool: 0.34, heat: 17, energy: 4, range: 3100, color: [1, 0.62, 0.25] },
    mining:   { name: "Mining", damage: 6, cool: 0.2, heat: 9, energy: 2, range: 1900, color: [0.55, 1, 0.45], mine: 48 }
  };

  function Mesh() {
    this.pos = [];
    this.nor = [];
    this.col = [];
    this.engines = [];
  }
  function add(m, p, n, c) {
    m.pos.push(p[0], p[1], p[2]);
    m.nor.push(n[0], n[1], n[2]);
    m.col.push(c[0], c[1], c[2]);
  }
  function face(m, a, b, c, col) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    const mid = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    if (n[0] * mid[0] + n[1] * mid[1] + n[2] * mid[2] < 0) tri(m, a, c, b, col);
    else tri(m, a, b, c, col);
  }
  function tri(m, a, b, c, col) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0]
    ];
    const len = Math.hypot(n[0], n[1], n[2]) || 1;
    n = [n[0] / len, n[1] / len, n[2] / len];
    add(m, a, n, col);
    add(m, b, n, col);
    add(m, c, n, col);
  }
  function quad(m, a, b, c, d, col) {
    tri(m, a, b, c, col);
    tri(m, a, c, d, col);
  }
  function box(m, cx, cy, cz, sx, sy, sz, col, yaw) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const c = Math.cos(yaw || 0), s = Math.sin(yaw || 0);
    function p(x, y, z) {
      return [cx + c * x + s * z, cy + y, cz - s * x + c * z];
    }
    const v = [
      p(-hx, -hy, -hz), p(hx, -hy, -hz), p(hx, hy, -hz), p(-hx, hy, -hz),
      p(-hx, -hy, hz), p(hx, -hy, hz), p(hx, hy, hz), p(-hx, hy, hz)
    ];
    const faces = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];
    for (let i = 0; i < faces.length; i += 1) {
      const f = faces[i];
      const a = v[f[0]], b = v[f[1]], c1 = v[f[2]], d = v[f[3]];
      const mid = [(a[0] + b[0] + c1[0] + d[0]) / 4, (a[1] + b[1] + c1[1] + d[1]) / 4, (a[2] + b[2] + c1[2] + d[2]) / 4];
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c1[0] - a[0], c1[1] - a[1], c1[2] - a[2]];
      const n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
      const out = [mid[0] - cx, mid[1] - cy, mid[2] - cz];
      if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) quad(m, a, d, c1, b, col);
      else quad(m, a, b, c1, d, col);
    }
  }
  function prism(m, sides, radius, z0, z1, col) {
    const ring = [];
    for (let i = 0; i < sides; i += 1) {
      const a = (i / sides) * Math.PI * 2;
      ring.push([Math.cos(a) * radius, Math.sin(a) * radius]);
    }
    for (let i = 0; i < sides; i += 1) {
      const j = (i + 1) % sides;
      quad(m,
        [ring[i][0], ring[i][1], z0],
        [ring[j][0], ring[j][1], z0],
        [ring[j][0], ring[j][1], z1],
        [ring[i][0], ring[i][1], z1],
        col);
    }
    for (let i = 1; i < sides - 1; i += 1) {
      face(m, [0, 0, z1], [ring[i + 1][0], ring[i + 1][1], z1], [ring[i][0], ring[i][1], z1], col);
      face(m, [0, 0, z0], [ring[i][0], ring[i][1], z0], [ring[i + 1][0], ring[i + 1][1], z0], col);
    }
  }
  function sphere(stacks, slices, colorFn, smooth) {
    const m = new Mesh();
    for (let y = 0; y < stacks; y += 1) {
      const v0 = y / stacks, v1 = (y + 1) / stacks;
      const p0 = Math.PI * (v0 - 0.5), p1 = Math.PI * (v1 - 0.5);
      for (let x = 0; x < slices; x += 1) {
        const u0 = x / slices, u1 = (x + 1) / slices;
        function vert(p, u) {
          const c = Math.cos(p);
          return [Math.cos(u * Math.PI * 2) * c, Math.sin(p), Math.sin(u * Math.PI * 2) * c];
        }
        const a = vert(p0, u0), b = vert(p0, u1), c = vert(p1, u1), d = vert(p1, u0);
        face(m, a, d, b, colorFn(a));
        face(m, b, d, c, colorFn(c));
      }
    }
    if (smooth) {
      for (let i = 0; i < m.pos.length; i += 3) {
        const n = Math.hypot(m.pos[i], m.pos[i + 1], m.pos[i + 2]) || 1;
        m.nor[i] = m.pos[i] / n;
        m.nor[i + 1] = m.pos[i + 1] / n;
        m.nor[i + 2] = m.pos[i + 2] / n;
      }
    }
    return pack(m);
  }
  function pack(m) {
    return {
      pos: new Float32Array(m.pos),
      nor: new Float32Array(m.nor),
      col: new Float32Array(m.col),
      engines: m.engines.slice()
    };
  }
  function shade(col, k) {
    return [col[0] * k, col[1] * k, col[2] * k];
  }

  function cobra(scale, hull, glass, stripe) {
    const m = new Mesh();
    box(m, 0, 0, 1, 7.2 * scale, 1.7 * scale, 16 * scale, hull);
    box(m, 0, -0.15 * scale, 2 * scale, 20 * scale, 0.42 * scale, 9 * scale, shade(hull, 0.8));
    box(m, 0, 0.95 * scale, -1.2 * scale, 2.3 * scale, 1.15 * scale, 4.2 * scale, glass);
    box(m, -1.15 * scale, 0, -9 * scale, 1.5 * scale, 1.15 * scale, 6 * scale, hull, 0.12);
    box(m, 1.15 * scale, 0, -9 * scale, 1.5 * scale, 1.15 * scale, 6 * scale, hull, -0.12);
    box(m, 0, 0.2 * scale, 0, 0.7 * scale, 0.25 * scale, 14 * scale, stripe);
    box(m, -2.4 * scale, 0, 8.2 * scale, 1.7 * scale, 1.5 * scale, 2.4 * scale, shade(hull, 0.45));
    box(m, 2.4 * scale, 0, 8.2 * scale, 1.7 * scale, 1.5 * scale, 2.4 * scale, shade(hull, 0.45));
    m.engines.push([-2.4 * scale, 0, 9.6 * scale], [2.4 * scale, 0, 9.6 * scale]);
    return pack(m);
  }

  function buildMeshes() {
    const hull = [0.62, 0.66, 0.72];
    const glass = [0.35, 0.62, 0.78];
    const stripe = [0.75, 0.18, 0.16];
    const meshes = {};
    meshes.cobra3 = cobra(1, hull, glass, stripe);
    meshes.cobra1 = cobra(0.82, [0.55, 0.58, 0.62], glass, [0.7, 0.45, 0.15]);
    meshes.ferdelance = cobra(1.05, [0.32, 0.33, 0.38], [0.7, 0.25, 0.22], [0.85, 0.55, 0.15]);

    let m = new Mesh();
    box(m, 0, 0, 0, 2.2, 1.5, 18, [0.78, 0.82, 0.9]);
    box(m, 0, 0, 2, 8.5, 0.28, 5, [0.55, 0.7, 0.95]);
    box(m, 0, 0.7, -2, 1.4, 0.7, 3, glass);
    m.engines.push([0, 0, 9.2]);
    meshes.viper = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 8, 1.6, 6, [0.38, 0.42, 0.36]);
    box(m, 0, 0.55, -1.5, 2.2, 1.1, 3.2, [0.3, 0.34, 0.28]);
    box(m, -2.4, 0, 2.2, 1.3, 1.1, 2, [0.22, 0.24, 0.2]);
    box(m, 2.4, 0, 2.2, 1.3, 1.1, 2, [0.22, 0.24, 0.2]);
    m.engines.push([-2.4, 0, 3.4], [2.4, 0, 3.4]);
    meshes.gecko = pack(m);

    m = new Mesh();
    box(m, 0, 0, 1, 12, 2.2, 8, [0.48, 0.28, 0.26]);
    box(m, 0, 0.4, -3.2, 4, 1.6, 4, [0.4, 0.22, 0.2]);
    box(m, -2.2, 0, 4.5, 2, 1.6, 2, [0.2, 0.16, 0.16]);
    box(m, 2.2, 0, 4.5, 2, 1.6, 2, [0.2, 0.16, 0.16]);
    m.engines.push([-2.2, 0, 5.6], [2.2, 0, 5.6]);
    meshes.sidewinder = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 3.4, 2, 14, [0.5, 0.55, 0.48]);
    box(m, -4.2, 0, 3, 1.4, 1.4, 10, [0.4, 0.44, 0.4]);
    box(m, 4.2, 0, 3, 1.4, 1.4, 10, [0.4, 0.44, 0.4]);
    box(m, -4.2, 0.2, -2, 3.2, 0.25, 2, [0.35, 0.38, 0.34]);
    box(m, 4.2, 0.2, -2, 3.2, 0.25, 2, [0.35, 0.38, 0.34]);
    m.engines.push([-4.2, 0, 8.2], [4.2, 0, 8.2]);
    meshes.adder = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 3, 1.6, 13, [0.45, 0.5, 0.42]);
    box(m, 0, 1.3, 3, 1.5, 1.2, 4, [0.3, 0.34, 0.3]);
    box(m, -2.2, -0.8, 4, 1.4, 1.2, 3.5, [0.25, 0.28, 0.24]);
    box(m, 2.2, -0.8, 4, 1.4, 1.2, 3.5, [0.25, 0.28, 0.24]);
    m.engines.push([0, 1.3, 5.4], [-2.2, -0.8, 6], [2.2, -0.8, 6]);
    meshes.krait = pack(m);

    m = new Mesh();
    box(m, 0, 0, -2, 2.4, 1.3, 16, [0.55, 0.2, 0.22]);
    box(m, 0, 0, 2.5, 14, 0.32, 7, [0.4, 0.14, 0.16]);
    box(m, 0, 0.6, -4, 1.5, 0.6, 3, [0.3, 0.1, 0.12]);
    m.engines.push([0, 0, 8]);
    meshes.mamba = pack(m);

    m = new Mesh();
    box(m, 0, 0, 1, 3.2, 2.4, 8, [0.42, 0.48, 0.32]);
    box(m, 0, 0, -4, 2.4, 2.2, 4, [0.36, 0.42, 0.28]);
    box(m, 0, 0, 6, 2.6, 2.2, 3, [0.3, 0.36, 0.24]);
    box(m, 2.4, 0, 2.5, 1.6, 1.6, 3, [0.28, 0.32, 0.22], 0.4);
    m.engines.push([0, 0, 7.6]);
    meshes.worm = pack(m);

    m = new Mesh();
    box(m, 0, 0, 1, 16, 0.7, 10, [0.4, 0.55, 0.62]);
    box(m, 0, 0.5, -1, 3, 1.3, 8, [0.32, 0.46, 0.55]);
    m.engines.push([-3, 0, 6], [3, 0, 6]);
    meshes.moray = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 1.6, 1.4, 22, [0.7, 0.72, 0.66]);
    box(m, -3.2, 0, 2.5, 1.8, 1.5, 8, [0.5, 0.52, 0.48]);
    box(m, 3.2, 0, 2.5, 1.8, 1.5, 8, [0.5, 0.52, 0.48]);
    box(m, 0, 0.7, -6, 1.3, 0.7, 4, glass);
    m.engines.push([-3.2, 0, 6.8], [3.2, 0, 6.8]);
    meshes.asp = pack(m);

    m = new Mesh();
    box(m, 0, 0.4, 0, 8, 5.5, 28, [0.46, 0.5, 0.56]);
    box(m, 0, 0.2, -16, 11, 4.2, 6, [0.38, 0.42, 0.48]);
    box(m, 0, 2.4, -4, 3, 1.4, 6, glass);
    box(m, -4.2, -0.6, 8, 2.2, 2.2, 6, [0.28, 0.3, 0.34]);
    box(m, 4.2, -0.6, 8, 2.2, 2.2, 6, [0.28, 0.3, 0.34]);
    m.engines.push([-4.2, -0.6, 11.4], [4.2, -0.6, 11.4]);
    meshes.python = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 12, 4.5, 20, [0.52, 0.48, 0.4]);
    box(m, 0, 0.4, -11, 6, 3, 6, [0.44, 0.4, 0.34]);
    box(m, 0, 1.8, -2, 3.2, 1.2, 5, glass);
    m.engines.push([-2.5, -0.4, 10.4], [2.5, -0.4, 10.4]);
    meshes.boa = pack(m);

    m = new Mesh();
    box(m, 0, 0, 2.5, 9, 7, 36, [0.4, 0.42, 0.38]);
    box(m, 0, 0, -18, 7, 6, 10, [0.34, 0.36, 0.32]);
    box(m, 0, 0, 22, 8, 6.5, 8, [0.3, 0.32, 0.28]);
    box(m, 0, 3.2, -6, 3.4, 1.5, 8, glass);
    m.engines.push([-2.2, -1, 26.5], [2.2, -1, 26.5]);
    meshes.anaconda = pack(m);

    m = new Mesh();
    prism(m, 10, 16, -2.2, 2.2, [0.32, 0.55, 0.28]);
    prism(m, 10, 7, -3.4, 3.4, [0.2, 0.35, 0.18]);
    box(m, 0, 3.2, 0, 3, 2.2, 3, [0.55, 0.85, 0.4]);
    m.engines.push([0, -3.2, 0]);
    meshes.thargoid = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 6, 6, 6, [0.45, 0.8, 0.35], 0.4);
    meshes.thargon = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 1.1, 1.1, 7, [0.7, 0.72, 0.66]);
    box(m, 0, 0, 2.2, 2.4, 0.2, 1.2, [0.4, 0.42, 0.4]);
    m.engines.push([0, 0, 3.6]);
    meshes.missile = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 4.2, 3.2, 4.2, [0.25, 0.55, 0.35]);
    box(m, 0, 0, 0, 4.4, 0.4, 0.5, [0.85, 0.75, 0.3]);
    meshes.canister = pack(m);

    m = new Mesh();
    box(m, 0, 0, 0, 2.4, 2.4, 5, [0.85, 0.85, 0.8]);
    box(m, 0, 0, -2.6, 1.6, 1.6, 1.4, [0.4, 0.7, 0.85]);
    meshes.pod = pack(m);

    meshes.asteroid = [];
    for (let v = 0; v < 3; v += 1) {
      const rock = sphere(6, 8, function (p) {
        const n = 0.45 + 0.25 * Math.sin(p[0] * 7 + v) * Math.cos(p[1] * 5 + v * 2);
        return [0.35 * n + 0.15, 0.32 * n + 0.12, 0.26 * n + 0.1];
      });
      meshes.asteroid.push(rock);
    }

    meshes.planet = sphere(16, 24, function () { return [1, 1, 1]; }, true);
    meshes.sun = sphere(12, 16, function () { return [1, 0.9, 0.55]; }, true);

    m = new Mesh();
    prism(m, 6, STATION.radius, STATION.back, STATION.face, [0.72, 0.75, 0.8]);
    const hw = STATION.halfW, hh = STATION.halfH, z = STATION.face + 0.6;
    box(m, 0, hh + 1.2, z, hw * 2.4, 2.2, 3, [0.15, 0.9, 0.55]);
    box(m, 0, -hh - 1.2, z, hw * 2.4, 2.2, 3, [0.15, 0.9, 0.55]);
    box(m, hw + 1.2, 0, z, 2.2, hh * 2.4, 3, [0.15, 0.9, 0.55]);
    box(m, -hw - 1.2, 0, z, 2.2, hh * 2.4, 3, [0.15, 0.9, 0.55]);
    box(m, 0, 0, STATION.face - 6, hw * 1.7, hh * 1.5, 10, [0.02, 0.04, 0.03]);
    meshes.station = pack(m);

    m = new Mesh();
    box(m, 0, -8, 0, 80, 2, 120, [0.12, 0.13, 0.16]);
    box(m, -38, 10, 0, 2.2, 28, 110, [0.16, 0.17, 0.2]);
    box(m, 38, 10, 0, 2.2, 28, 110, [0.16, 0.17, 0.2]);
    box(m, 0, 24, -40, 76, 2, 2.2, [0.16, 0.17, 0.2]);
    box(m, 0, 0.2, 10, 16, 0.4, 22, [0.2, 0.16, 0.1]);
    meshes.hangar = pack(m);

    return meshes;
  }

  const meshes = buildMeshes();

  function pirateKind(gov, roll) {
    const table = [
      ["sidewinder", 28], ["gecko", 16], ["adder", 12], ["krait", 10],
      ["mamba", 9], ["cobra1", 8], ["worm", 5]
    ];
    if (gov <= 3) table.push(["cobra3", 6], ["moray", 4], ["asp", 3]);
    if (gov <= 1) table.push(["python", 3], ["boa", 2], ["ferdelance", 2]);
    if (gov === 0) table.push(["anaconda", 1]);
    return pick(table, roll);
  }
  function traderKind(roll) {
    return pick([["cobra3", 46], ["python", 30], ["boa", 16], ["anaconda", 8]], roll);
  }
  function pick(table, roll) {
    let sum = 0;
    for (let i = 0; i < table.length; i += 1) sum += table[i][1];
    let r = roll() * sum;
    for (let i = 0; i < table.length; i += 1) {
      r -= table[i][1];
      if (r <= 0) return table[i][0];
    }
    return table[0][0];
  }

  const api = { SHIPS, LASERS, STATION, meshes, pirateKind, traderKind };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EliteShips = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
