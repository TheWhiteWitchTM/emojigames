// WebGL view for the Elite canvas. The engine clears the frame; this draws into it.
(function (root) {
  "use strict";

  const M = () => root.EliteMath;
  const G = () => root.EliteGalaxy;
  const S = () => root.EliteShips;

  const ECON_COLOR = [
    [0.55, 0.48, 0.42],
    [0.46, 0.44, 0.42],
    [0.36, 0.30, 0.28],
    [0.40, 0.38, 0.34],
    [0.28, 0.50, 0.32],
    [0.20, 0.46, 0.62],
    [0.26, 0.52, 0.34],
    [0.52, 0.40, 0.24]
  ];

  const LIT_VS = `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=1) in vec3 a_nrm;
layout(location=2) in vec3 a_col;
uniform mat4 u_vp;
out vec3 v_col;
out vec3 v_nrm;
out vec3 v_world;
void main() {
  v_world = a_pos;
  v_nrm = a_nrm;
  v_col = a_col;
  gl_Position = u_vp * vec4(a_pos, 1.0);
}`;

  const LIT_FS = `#version 300 es
precision highp float;
in vec3 v_col;
in vec3 v_nrm;
in vec3 v_world;
uniform vec3 u_light;
uniform vec3 u_eye;
uniform vec3 u_fog;
uniform float u_fogFar;
out vec4 fragColor;
void main() {
  vec3 n = normalize(v_nrm);
  vec3 l = normalize(u_light);
  vec3 viewDir = normalize(u_eye - v_world);
  float ndl = max(dot(n, l), 0.0);
  float rim = pow(1.0 - max(dot(n, viewDir), 0.0), 2.2);
  float head = pow(max(dot(n, viewDir), 0.0), 3.0);
  vec3 col = v_col * (0.3 + 0.7 * ndl + 0.38 * head) + vec3(0.6, 0.72, 0.85) * rim * 0.38;
  float fog = clamp(distance(u_eye, v_world) / u_fogFar, 0.0, 1.0);
  fragColor = vec4(mix(col, u_fog, fog * fog), 1.0);
}`;

  const ADD_FS = `#version 300 es
precision highp float;
in vec3 v_col;
out vec4 fragColor;
void main() {
  fragColor = vec4(v_col, 1.0);
}`;

  const POINT_VS = `#version 300 es
layout(location=0) in vec3 a_pos;
uniform mat4 u_vp;
out float v_seed;
void main() {
  v_seed = fract(sin(dot(a_pos, vec3(12.9, 78.2, 45.5))) * 43758.5453);
  gl_Position = u_vp * vec4(a_pos, 1.0);
  gl_PointSize = 2.2 + v_seed * 2.6;
}`;

  const POINT_FS = `#version 300 es
precision highp float;
in float v_seed;
out vec4 fragColor;
void main() {
  vec2 p = gl_PointCoord * 2.0 - 1.0;
  float d = dot(p, p);
  if (d > 1.0) discard;
  float a = 1.0 - d;
  vec3 col = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.92, 0.75), v_seed);
  fragColor = vec4(col * a, 1.0);
}`;

  function compile(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || "shader");
    }
    return shader;
  }
  function program(gl, vs, fs) {
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || "link");
    }
    return prog;
  }

  function Grow() {
    this.pos = [];
    this.nrm = [];
    this.col = [];
  }
  function pushVert(g, p, n, c) {
    g.pos.push(p[0], p[1], p[2]);
    g.nrm.push(n[0], n[1], n[2]);
    g.col.push(c[0], c[1], c[2]);
  }
  function bakeMesh(g, mesh, pos, q, scale, tint, colors) {
    const b = M().basis(q);
    const rx = b.right, uy = b.up, fz = b.forward;
    const n = mesh.pos.length / 3;
    for (let i = 0; i < n; i += 1) {
      const x = mesh.pos[i * 3] * scale;
      const y = mesh.pos[i * 3 + 1] * scale;
      const z = mesh.pos[i * 3 + 2] * scale;
      const nx = mesh.nor[i * 3], ny = mesh.nor[i * 3 + 1], nz = mesh.nor[i * 3 + 2];
      const world = [
        pos[0] + rx[0] * x + uy[0] * y - fz[0] * z,
        pos[1] + rx[1] * x + uy[1] * y - fz[1] * z,
        pos[2] + rx[2] * x + uy[2] * y - fz[2] * z
      ];
      const normal = [
        rx[0] * nx + uy[0] * ny - fz[0] * nz,
        rx[1] * nx + uy[1] * ny - fz[1] * nz,
        rx[2] * nx + uy[2] * ny - fz[2] * nz
      ];
      const cr = colors ? colors[i * 3] : mesh.col[i * 3];
      const cg = colors ? colors[i * 3 + 1] : mesh.col[i * 3 + 1];
      const cb = colors ? colors[i * 3 + 2] : mesh.col[i * 3 + 2];
      pushVert(g, world, normal, [cr * tint[0], cg * tint[1], cb * tint[2]]);
    }
  }
  function board(g, center, size, color, right, up) {
    const rx = M().scale(right, size), uy = M().scale(up, size);
    const a = M().sub(M().sub(center, rx), uy);
    const b = M().add(M().sub(center, rx), uy);
    const c = M().add(M().add(center, rx), uy);
    const d = M().sub(M().add(center, rx), uy);
    const nrm = [0, 1, 0];
    pushVert(g, a, nrm, color); pushVert(g, b, nrm, color); pushVert(g, c, nrm, color);
    pushVert(g, a, nrm, color); pushVert(g, c, nrm, color); pushVert(g, d, nrm, color);
  }
  function bolt(g, a, b, width, color, up) {
    const dir = M().sub(b, a);
    let side = M().cross(dir, up);
    const n = M().len(side);
    if (n < 1e-4) side = [width, 0, 0];
    else side = M().scale(side, width / n);
    const a1 = M().sub(a, side), a2 = M().add(a, side);
    const b1 = M().sub(b, side), b2 = M().add(b, side);
    const nrm = [0, 0, 1];
    pushVert(g, a1, nrm, color); pushVert(g, a2, nrm, color); pushVert(g, b2, nrm, color);
    pushVert(g, a1, nrm, color); pushVert(g, b2, nrm, color); pushVert(g, b1, nrm, color);
  }

  function enginePoint(mesh, index, pos, q, scale) {
    const e = mesh.engines[index];
    const b = M().basis(q);
    const x = e[0] * scale, y = e[1] * scale, z = e[2] * scale;
    return [
      pos[0] + b.right[0] * x + b.up[0] * y - b.forward[0] * z,
      pos[1] + b.right[1] * x + b.up[1] * y - b.forward[1] * z,
      pos[2] + b.right[2] * x + b.up[2] * y - b.forward[2] * z
    ];
  }

  const colorCache = new Map();
  function planetColors(system) {
    const key = system.name + ":" + system.x + ":" + system.y + ":" + system.craters;
    const hit = colorCache.get(key);
    if (hit) return hit;
    const mesh = S().meshes.planet;
    const base = ECON_COLOR[system.economy] || ECON_COLOR[0];
    const cols = new Float32Array(mesh.pos.length);
    for (let i = 0; i < mesh.pos.length; i += 3) {
      const x = mesh.pos[i], y = mesh.pos[i + 1], z = mesh.pos[i + 2];
      let k = 0.78 + 0.22 * Math.sin(y * 11 + system.x * 0.17);
      k *= 0.9 + 0.1 * Math.sin(x * 6 + z * 5 + system.y);
      if (system.craters) {
        const h = Math.abs(Math.sin(x * 17.2 + system.y) * Math.cos(z * 15.1 + y * 9));
        if (h > 0.93) k *= 0.42;
      } else if (Math.abs(y) < 0.025 || Math.abs(Math.atan2(z, x)) < 0.04) {
        k *= 0.35;
      }
      cols[i] = base[0] * k;
      cols[i + 1] = base[1] * k;
      cols[i + 2] = base[2] * k;
    }
    colorCache.set(key, cols);
    return cols;
  }

  function makeStars(system) {
    let s = (system.x * 131 + system.y * 57 + system.goat.a * 17 + system.goat.d) >>> 0;
    function rnd() {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    }
    const data = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i += 1) {
      const theta = rnd() * Math.PI * 2;
      const phi = Math.acos(2 * rnd() - 1);
      const r = 32000;
      data[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = r * Math.cos(phi);
      data[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return data;
  }

  function buildScene(state, mode, time) {
    const math = M();
    const meshes = S().meshes;
    const scene = {
      eye: [0, 0, 20],
      q: math.qId(),
      fov: 68,
      light: [0.4, 0.8, 0.3],
      fog: [0.012, 0.016, 0.03],
      fogFar: 24000,
      stars: null,
      starLock: true,
      lit: [],
      emit: [],
      speeders: [],
      boards: [],
      bolts: []
    };
    if (mode === "title") {
      const sys = G().galaxies()[0][G().LAVE];
      scene.stars = makeStars(sys);
      scene.eye = [4 + Math.sin(time * 0.15) * 4, 8 + Math.sin(time * 0.2) * 1.5, 30];
      scene.q = math.qLook(math.norm(math.sub([-10, 0, 2], scene.eye)), [0, 1, 0]);
      const cobraQ = math.qLocal(math.qId(), 0.2, time * 0.35, 0.35);
      scene.lit.push({ mesh: meshes.cobra3, pos: [-14, -1, 4], q: cobraQ, scale: 1.45, tint: [0.9, 0.94, 1] });
      scene.speeders.push({ mesh: meshes.cobra3, pos: [-14, -1, 4], q: cobraQ, scale: 1.45, glow: 0.7 });
      const stationQ = math.qLocal(math.qLook([-0.2, 0.05, -1], [0, 1, 0]), 0, 0, time * 0.4);
      scene.lit.push({ mesh: meshes.station, pos: [0, 30, -520], q: stationQ, scale: 1.4, tint: [1, 1, 1] });
      scene.lit.push({ mesh: meshes.planet, pos: [-700, -80, -1600], q: math.qId(), scale: 520, tint: [1, 1, 1], colors: planetColors(sys) });
      scene.boards.push({ pos: [900, 400, -1800], size: 220, color: [0.55, 0.32, 0.12] });
      scene.light = [0.6, 0.5, -0.4];
      return scene;
    }
    if (state.docked) {
      scene.stars = state.stars;
      scene.eye = [20 + Math.sin(time * 0.25) * 3, 8, 26];
      scene.q = math.qLook(math.norm(math.sub([0, 1, 0], scene.eye)), [0, 1, 0]);
      scene.lit.push({ mesh: meshes.hangar, pos: [0, 0, 0], q: math.qId(), scale: 1, tint: [1, 1, 1] });
      const q = math.qLocal(math.qId(), 0, -0.5, 0);
      scene.lit.push({ mesh: meshes.cobra3, pos: [0, 0, 4], q: q, scale: 1, tint: [0.9, 0.92, 1] });
      scene.speeders.push({ mesh: meshes.cobra3, pos: [0, 0, 4], q: q, scale: 1, glow: 0.25 });
      scene.boards.push({ pos: [-20, 16, -20], size: 2.5, color: [0.35, 0.28, 0.12] });
      scene.boards.push({ pos: [20, 16, -20], size: 2.5, color: [0.35, 0.28, 0.12] });
      scene.fogFar = 400;
      scene.light = [0.2, 1, 0.3];
      return scene;
    }
    const view = viewQuat(state.player.q, state.player.view);
    scene.eye = state.player.pos.slice();
    scene.q = view;
    scene.stars = state.stars;
    if (state.hyper > 0 && state.hyper < 1.6) scene.fov = 68 + (1.6 - state.hyper) * 18;
    if (state.witch) {
      scene.fog = [0.08, 0.02, 0.04];
      scene.light = [0.2, 0.9, 0.3];
    } else if (state.sun) {
      scene.light = math.norm(math.sub(state.sun.pos, state.planet.pos));
    }
    if (state.planet) {
      scene.lit.push({
        mesh: meshes.planet, pos: state.planet.pos, q: math.qId(), scale: state.planet.radius,
        tint: [1, 1, 1], colors: planetColors(state.planet.system)
      });
    }
    if (state.sun) {
      scene.boards.push({ pos: state.sun.pos, size: state.sun.radius * 2.4, color: [0.45, 0.22, 0.05] });
      scene.boards.push({ pos: state.sun.pos, size: state.sun.radius * 1.3, color: [0.7, 0.45, 0.15] });
      scene.emit.push({ mesh: meshes.sun, pos: state.sun.pos, q: math.qId(), scale: state.sun.radius, tint: [0.55, 0.38, 0.14] });
    }
    if (state.station) {
      scene.lit.push({ mesh: meshes.station, pos: state.station.pos, q: state.station.q, scale: 1, tint: [1, 1, 1] });
      const outward = math.scale(math.basis(state.station.q).forward, -1);
      const slot = math.add(state.station.pos, math.scale(outward, S().STATION.face));
      const aligned = math.dot(math.basis(view).forward, math.scale(outward, -1)) > 0.9;
      scene.boards.push({ pos: slot, size: aligned ? 22 : 14, color: aligned ? [0.15, 0.7, 0.35] : [0.55, 0.12, 0.08] });
    }
    for (let i = 0; i < state.ships.length; i += 1) {
      const ship = state.ships[i];
      if (ship.gone) continue;
      const mesh = ship.kind === "asteroid" ? meshes.asteroid[ship.variant % 3] : meshes[ship.kind];
      if (!mesh) continue;
      const scale = ship.kind === "asteroid" ? ship.radius : 1;
      scene.lit.push({ mesh: mesh, pos: ship.pos, q: ship.q, scale: scale, tint: ship.tint });
      if (mesh.engines && mesh.engines.length && ship.speed > 1) {
        scene.speeders.push({ mesh: mesh, pos: ship.pos, q: ship.q, scale: scale, glow: Math.min(1, ship.speed / 30) });
      }
    }
    for (let i = 0; i < state.bolts.length; i += 1) scene.bolts.push(state.bolts[i]);
    for (let i = 0; i < state.fx.length; i += 1) {
      const fx = state.fx[i];
      scene.boards.push({ pos: fx.pos, size: fx.size * (fx.life / fx.max), color: fx.color });
    }
    return scene;
  }

  function viewQuat(q, view) {
    const math = M();
    if (view === "rear") return math.qLocal(q, 0, Math.PI, 0);
    if (view === "left") return math.qLocal(q, 0, Math.PI / 2, 0);
    if (view === "right") return math.qLocal(q, 0, -Math.PI / 2, 0);
    return q;
  }

  function createRenderer(gl) {
    const litProg = program(gl, LIT_VS, LIT_FS);
    const addProg = program(gl, LIT_VS, ADD_FS);
    const pointProg = program(gl, POINT_VS, POINT_FS);
    const litBuf = gl.createBuffer();
    const glowBuf = gl.createBuffer();
    const starBuf = gl.createBuffer();
    const litVao = gl.createVertexArray();
    const glowVao = gl.createVertexArray();
    const starVao = gl.createVertexArray();
    function bindInterleaved(vao, buf) {
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const stride = 9 * 4;
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 12);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 24);
      gl.bindVertexArray(null);
    }
    bindInterleaved(litVao, litBuf);
    bindInterleaved(glowVao, glowBuf);
    gl.bindVertexArray(starVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    function upload(buf, grow) {
      const count = grow.pos.length / 3;
      const data = new Float32Array(count * 9);
      for (let i = 0; i < count; i += 1) {
        data[i * 9] = grow.pos[i * 3];
        data[i * 9 + 1] = grow.pos[i * 3 + 1];
        data[i * 9 + 2] = grow.pos[i * 3 + 2];
        data[i * 9 + 3] = grow.nrm[i * 3];
        data[i * 9 + 4] = grow.nrm[i * 3 + 1];
        data[i * 9 + 5] = grow.nrm[i * 3 + 2];
        data[i * 9 + 6] = grow.col[i * 3];
        data[i * 9 + 7] = grow.col[i * 3 + 1];
        data[i * 9 + 8] = grow.col[i * 3 + 2];
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      return count;
    }

    function draw(scene, width, height) {
      const math = M();
      const b = math.basis(scene.q);
      const view = math.viewMatrix(scene.eye, b.right, b.up, b.forward);
      const proj = math.perspective(scene.fov || 68, width / Math.max(1, height), 0.35, 90000);
      const vp = math.multiply(proj, view);
      const lit = new Grow();
      const glow = new Grow();
      for (let i = 0; i < scene.lit.length; i += 1) {
        const item = scene.lit[i];
        bakeMesh(lit, item.mesh, item.pos, item.q, item.scale || 1, item.tint || [1, 1, 1], item.colors);
      }
      for (let i = 0; i < scene.emit.length; i += 1) {
        const item = scene.emit[i];
        bakeMesh(glow, item.mesh, item.pos, item.q, item.scale || 1, item.tint || [1, 1, 1], item.colors);
      }
      for (let i = 0; i < scene.speeders.length; i += 1) {
        const item = scene.speeders[i];
        const mesh = item.mesh;
        for (let e = 0; e < mesh.engines.length; e += 1) {
          const p = enginePoint(mesh, e, item.pos, item.q, item.scale || 1);
          const heat = 0.35 + item.glow * 0.9;
          board(glow, p, (2.2 + item.glow * 3.5) * (item.scale || 1), [heat, heat * 0.45, 0.08], b.right, b.up);
        }
      }
      for (let i = 0; i < scene.boards.length; i += 1) {
        const item = scene.boards[i];
        board(glow, item.pos, item.size, item.color, b.right, b.up);
      }
      for (let i = 0; i < scene.bolts.length; i += 1) {
        const item = scene.bolts[i];
        bolt(glow, item.a, item.b, item.width || 0.7, item.color, b.up);
      }
      gl.viewport(0, 0, width, height);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      if (scene.stars) {
        let stars = scene.stars;
        if (scene.starLock) {
          stars = new Float32Array(scene.stars.length);
          const ex = scene.eye[0], ey = scene.eye[1], ez = scene.eye[2];
          for (let i = 0; i < stars.length; i += 3) {
            stars[i] = scene.stars[i] + ex;
            stars[i + 1] = scene.stars[i + 1] + ey;
            stars[i + 2] = scene.stars[i + 2] + ez;
          }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, starBuf);
        gl.bufferData(gl.ARRAY_BUFFER, stars, gl.DYNAMIC_DRAW);
        gl.useProgram(pointProg);
        gl.uniformMatrix4fv(gl.getUniformLocation(pointProg, "u_vp"), false, vp);
        gl.bindVertexArray(starVao);
        gl.drawArrays(gl.POINTS, 0, scene.stars.length / 3);
      }
      const litCount = upload(litBuf, lit);
      if (litCount) {
        gl.useProgram(litProg);
        gl.uniformMatrix4fv(gl.getUniformLocation(litProg, "u_vp"), false, vp);
        gl.uniform3fv(gl.getUniformLocation(litProg, "u_light"), scene.light);
        gl.uniform3fv(gl.getUniformLocation(litProg, "u_eye"), scene.eye);
        gl.uniform3fv(gl.getUniformLocation(litProg, "u_fog"), scene.fog);
        gl.uniform1f(gl.getUniformLocation(litProg, "u_fogFar"), scene.fogFar);
        gl.bindVertexArray(litVao);
        gl.drawArrays(gl.TRIANGLES, 0, litCount);
      }
      const glowCount = upload(glowBuf, glow);
      if (glowCount) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.depthMask(false);
        gl.useProgram(addProg);
        gl.uniformMatrix4fv(gl.getUniformLocation(addProg, "u_vp"), false, vp);
        gl.bindVertexArray(glowVao);
        gl.drawArrays(gl.TRIANGLES, 0, glowCount);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
      }
      gl.bindVertexArray(null);
    }

    return { draw: draw, buildScene: buildScene };
  }

  root.EliteView = { createRenderer: createRenderer, buildScene: buildScene, makeStars: makeStars, viewQuat: viewQuat };
})(typeof globalThis !== "undefined" ? globalThis : this);
