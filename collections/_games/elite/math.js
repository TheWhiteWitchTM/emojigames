// Spatial helpers for Elite. Ship forward is local −z, up is +y, right is +x.
(function (root) {
  "use strict";

  function add(a, b) {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }
  function sub(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  function scale(a, s) {
    return [a[0] * s, a[1] * s, a[2] * s];
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
  }
  function len(a) {
    return Math.hypot(a[0], a[1], a[2]);
  }
  function norm(a) {
    const n = len(a);
    if (n < 1e-8) return [0, 0, -1];
    return [a[0] / n, a[1] / n, a[2] / n];
  }
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function qId() {
    return [1, 0, 0, 0];
  }
  function qMul(a, b) {
    const aw = a[0], ax = a[1], ay = a[2], az = a[3];
    const bw = b[0], bx = b[1], by = b[2], bz = b[3];
    return [
      aw * bw - ax * bx - ay * by - az * bz,
      aw * bx + ax * bw + ay * bz - az * by,
      aw * by - ax * bz + ay * bw + az * bx,
      aw * bz + ax * by - ay * bx + az * bw
    ];
  }
  function qNorm(q) {
    const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
  }
  function qAxis(ax, ay, az, ang) {
    const h = ang * 0.5;
    const s = Math.sin(h);
    const n = Math.hypot(ax, ay, az) || 1;
    return [Math.cos(h), (ax / n) * s, (ay / n) * s, (az / n) * s];
  }
  function qRot(q, v) {
    const w = q[0], x = q[1], y = q[2], z = q[3];
    const vx = v[0], vy = v[1], vz = v[2];
    const tx = 2 * (y * vz - z * vy);
    const ty = 2 * (z * vx - x * vz);
    const tz = 2 * (x * vy - y * vx);
    return [
      vx + w * tx + (y * tz - z * ty),
      vy + w * ty + (z * tx - x * tz),
      vz + w * tz + (x * ty - y * tx)
    ];
  }
  function qInvRot(q, v) {
    return qRot([q[0], -q[1], -q[2], -q[3]], v);
  }
  // Right-handed body rotation. Pilot signs are not these signs: use steer().
  function qLocal(q, pitch, yaw, roll) {
    let out = q;
    if (pitch) out = qMul(out, qAxis(1, 0, 0, pitch));
    if (yaw) out = qMul(out, qAxis(0, 1, 0, yaw));
    if (roll) out = qMul(out, qAxis(0, 0, 1, roll));
    return qNorm(out);
  }
  function basis(q) {
    return {
      right: qRot(q, [1, 0, 0]),
      up: qRot(q, [0, 1, 0]),
      forward: qRot(q, [0, 0, -1])
    };
  }
  // Quaternion whose −z axis lies along `forward` and whose up favours `upHint`.
  // Pilot axes: positive pitchUp raises the nose, yawRight turns right, rollRight drops the right wing.
  function steer(q, pitchUp, yawRight, rollRight) {
    return qLocal(q, pitchUp, -yawRight, -rollRight);
  }
  function qLook(forward, upHint) {
    const f = norm(forward);
    let r = cross(f, upHint || [0, 1, 0]);
    if (len(r) < 1e-6) r = cross(f, [1, 0, 0]);
    r = norm(r);
    const u = cross(r, f);
    // Columns of the rotation matrix are the body axes in world space.
    return qNorm(qFromBasis(r, u, [-f[0], -f[1], -f[2]]));
  }
  function qFromBasis(right, up, back) {
    // back is local +z. Standard matrix-to-quaternion, column-major body axes.
    const m00 = right[0], m01 = up[0], m02 = back[0];
    const m10 = right[1], m11 = up[1], m12 = back[1];
    const m20 = right[2], m21 = up[2], m22 = back[2];
    const trace = m00 + m11 + m22;
    let w, x, y, z;
    if (trace > 0) {
      const s = Math.sqrt(trace + 1) * 2;
      w = 0.25 * s;
      x = (m21 - m12) / s;
      y = (m02 - m20) / s;
      z = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
      const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
      w = (m21 - m12) / s;
      x = 0.25 * s;
      y = (m01 + m10) / s;
      z = (m02 + m20) / s;
    } else if (m11 > m22) {
      const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
      w = (m02 - m20) / s;
      x = (m01 + m10) / s;
      y = 0.25 * s;
      z = (m12 + m21) / s;
    } else {
      const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
      w = (m10 - m01) / s;
      x = (m02 + m20) / s;
      y = (m12 + m21) / s;
      z = 0.25 * s;
    }
    return [w, x, y, z];
  }

  // Column-major view matrix. `forward` is the way the camera looks.
  function viewMatrix(eye, right, up, forward) {
    const r = right, u = up, f = forward;
    const out = new Float32Array(16);
    out[0] = r[0]; out[1] = u[0]; out[2] = -f[0]; out[3] = 0;
    out[4] = r[1]; out[5] = u[1]; out[6] = -f[1]; out[7] = 0;
    out[8] = r[2]; out[9] = u[2]; out[10] = -f[2]; out[11] = 0;
    out[12] = -dot(r, eye); out[13] = -dot(u, eye); out[14] = dot(f, eye); out[15] = 1;
    return out;
  }
  function perspective(fovDeg, aspect, near, far) {
    const out = new Float32Array(16);
    const f = 1 / Math.tan(fovDeg * Math.PI / 360);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    return out;
  }
  function multiply(a, b) {
    const out = new Float32Array(16);
    for (let col = 0; col < 4; col += 1) {
      const b0 = b[col * 4], b1 = b[col * 4 + 1], b2 = b[col * 4 + 2], b3 = b[col * 4 + 3];
      out[col * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
      out[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
      out[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      out[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
  }
  function transformPoint(m, x, y, z) {
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    return {
      x: (m[0] * x + m[4] * y + m[8] * z + m[12]) / w,
      y: (m[1] * x + m[5] * y + m[9] * z + m[13]) / w,
      z: (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
      w: w
    };
  }

  const api = {
    add, sub, scale, dot, cross, len, norm, clamp, lerp,
    qId, qMul, qNorm, qAxis, qRot, qInvRot, qLocal, steer, qLook, basis,
    viewMatrix, perspective, multiply, transformPoint
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EliteMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
