// ============================================================
// Signed distance fields -> smooth connected meshes (surface nets)
// ============================================================
function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1);
  return lerp(b, a, h) - k * h * (1 - h);
}
function smax(a, b, k) { return -smin(-a, -b, k); }
function sdSegDist(px, py, pz, ax, ay, az, bx, by, bz) {
  const pax = px - ax, pay = py - ay, paz = pz - az, bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz || 1e-9), 0, 1);
  return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h);
}

// planes for a 'crag': n seeded directions (spread over the sphere) at slightly uneven distances
const CRAG_ONE = [1, 1, 1];
function cragPlanes(seed, n, r) {
  let a = (seed * 2654435761) >>> 0;
  const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out = [];
  for (let i = 0; i < n; i++) {
    // a golden-spiral spread, jittered, so no side is left uncut
    const y = 1 - 2 * (i + 0.5) / n, rr = Math.sqrt(1 - y * y), ph = i * 2.39996 + rnd() * 0.9;
    let nx = Math.cos(ph) * rr + (rnd() - 0.5) * 0.35, ny = y + (rnd() - 0.5) * 0.35, nz = Math.sin(ph) * rr + (rnd() - 0.5) * 0.35;
    const l = Math.hypot(nx, ny, nz) || 1;
    out.push(nx / l, ny / l, nz / l, r * (0.78 + rnd() * 0.32));
  }
  return out;
}
// Part shapes. Every part: { s: shape, ...params, k: blend into the union, sub: true to carve, col: fixed color or null, bone: rigid bone or undefined }
function partDist(pt, x, y, z) {
  switch (pt.s) {
    case 'sph': return Math.hypot(x - pt.c[0], y - pt.c[1], z - pt.c[2]) - pt.r;
    case 'cap': {
      // capsule with radius tapering from r to r2
      const ax = pt.a[0], ay = pt.a[1], az = pt.a[2], bx = pt.b[0], by = pt.b[1], bz = pt.b[2];
      const pax = x - ax, pay = y - ay, paz = z - az, bax = bx - ax, bay = by - ay, baz = bz - az;
      const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
      const r = pt.r2 === undefined ? pt.r : lerp(pt.r, pt.r2, h);
      return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r;
    }
    case 'ell': {
      const qx = (x - pt.c[0]) / pt.rr[0], qy = (y - pt.c[1]) / pt.rr[1], qz = (z - pt.c[2]) / pt.rr[2];
      const k0 = Math.hypot(qx, qy, qz);
      const k1 = Math.hypot(qx / pt.rr[0], qy / pt.rr[1], qz / pt.rr[2]);
      return k1 > 1e-9 ? k0 * (k0 - 1) / k1 : -Math.min(pt.rr[0], pt.rr[1], pt.rr[2]);
    }
    case 'cyl': {
      // rounded cylinder along axis 'ax' ('x','y','z'), center c, radius r, half height hh, rounding rd
      const dx = x - pt.c[0], dy = y - pt.c[1], dz = z - pt.c[2];
      let rad, ax;
      if (pt.ax === 'y') { rad = Math.hypot(dx, dz); ax = dy; } else if (pt.ax === 'x') { rad = Math.hypot(dy, dz); ax = dx; } else { rad = Math.hypot(dx, dy); ax = dz; }
      const qx = rad - pt.r + pt.rd, qy = Math.abs(ax) - pt.hh + pt.rd;
      return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - pt.rd;
    }
    case 'tor': {
      // torus arc in the plane perpendicular to axis 'ax' (only y or z supported), major R, minor r, keeping angles within [a0,a1]
      const dx = x - pt.c[0], dy = y - pt.c[1], dz = z - pt.c[2];
      let u, v, w;
      if (pt.ax === 'z') { u = dx; v = dy; w = dz; } else if (pt.ax === 'x') { u = dz; v = dy; w = dx; } else { u = dx; v = dz; w = dy; }
      let ang = Math.atan2(v, u);
      const a = clamp(ang, pt.a0, pt.a1);
      const cx = Math.cos(a) * pt.R, cy = Math.sin(a) * pt.R;
      return Math.hypot(u - cx, v - cy, w) - pt.r;
    }
    case 'box': {
      const qx = Math.abs(x - pt.c[0]) - pt.hs[0] + pt.rd, qy = Math.abs(y - pt.c[1]) - pt.hs[1] + pt.rd, qz = Math.abs(z - pt.c[2]) - pt.hs[2] + pt.rd;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - pt.rd;
    }
    case 'gable': {
      // a pitched roof: an isosceles triangle (half base w, height h, base at c.y) run along 'ax' ('z', or 'x') for half length hh
      let px, pz;
      if (pt.ax === 'x') { px = Math.abs(z - pt.c[2]); pz = Math.abs(x - pt.c[0]) - pt.hh; } else { px = Math.abs(x - pt.c[0]); pz = Math.abs(z - pt.c[2]) - pt.hh; }
      const py = pt.c[1] + pt.h - y, qx = pt.w, qy = pt.h;
      const ta = clamp((px * qx + py * qy) / (qx * qx + qy * qy), 0, 1), ax = px - qx * ta, ay = py - qy * ta;
      const bx = px - qx * clamp(px / qx, 0, 1), by = py - qy;
      const dd = Math.min(ax * ax + ay * ay, bx * bx + by * by), sg = Math.min(py * qx - px * qy, qy - py);
      const d2 = -Math.sqrt(dd) * Math.sign(sg);
      return Math.min(Math.max(d2, pz), 0) + Math.hypot(Math.max(d2, 0), Math.max(pz, 0));
    }
    case 'crag': {
      // faceted rock: a jagged convex chunk cut by seeded planes (sc squashes it per axis)
      const pl = pt._pl || (pt._pl = cragPlanes(pt.seed || 1, pt.n || 9, pt.r));
      const sc = pt.sc || CRAG_ONE, qx = (x - pt.c[0]) / sc[0], qy = (y - pt.c[1]) / sc[1], qz = (z - pt.c[2]) / sc[2];
      let d = -1e9;
      for (let i = 0; i < pl.length; i += 4) d = Math.max(d, pl[i] * qx + pl[i + 1] * qy + pl[i + 2] * qz - pl[i + 3]);
      return d * Math.min(sc[0], sc[1], sc[2]);
    }
    case 'rock': {
      // lumpy sphere: sphere plus low-frequency bumps
      const dx = x - pt.c[0], dy = y - pt.c[1], dz = z - pt.c[2];
      const b = Math.sin(dx * 13 + 1.3) * Math.sin(dy * 11 + 0.7) * Math.sin(dz * 12 + 2.1) * 0.5 + Math.sin(dx * 27) * Math.sin(dy * 23 + 1.0) * Math.sin(dz * 25) * 0.25;
      return Math.hypot(dx, dy, dz) - pt.r * (1 + b * pt.bump);
    }
  }
  return 1e9;
}

// Bounding sphere per part, so far-away parts can be skipped cheaply
function partBounds(pt) {
  switch (pt.s) {
    case 'sph': return [pt.c, pt.r];
    case 'cap': return [[(pt.a[0] + pt.b[0]) / 2, (pt.a[1] + pt.b[1]) / 2, (pt.a[2] + pt.b[2]) / 2], Math.hypot(pt.a[0] - pt.b[0], pt.a[1] - pt.b[1], pt.a[2] - pt.b[2]) / 2 + Math.max(pt.r, pt.r2 || 0)];
    case 'ell': return [pt.c, Math.max(...pt.rr)];
    case 'cyl': return [pt.c, Math.hypot(pt.r, pt.hh)];
    case 'tor': return [pt.c, pt.R + pt.r];
    case 'box': return [pt.c, Math.hypot(...pt.hs)];
    case 'rock': return [pt.c, pt.r * (1 + pt.bump * 0.8)];
    case 'crag': { const sc = pt.sc || CRAG_ONE; return [pt.c, pt.r * 1.75 * Math.max(sc[0], sc[1], sc[2])]; }
    case 'gable': return [[pt.c[0], pt.c[1] + pt.h / 2, pt.c[2]], Math.hypot(pt.w, pt.h / 2, pt.hh)];
  }
  return [[0, 0, 0], 1e9];
}
function prepParts(parts) {
  // (boxes and cylinders without a rounding radius would give NaN)
  for (const pt of parts) { if ((pt.s === 'box' || pt.s === 'cyl') && pt.rd === undefined) pt.rd = 0; const [c, r] = partBounds(pt); pt.bc = c; pt.br = r; }
  return parts;
}
function modelSdf(parts, x, y, z) {
  let d = 1e9;
  for (let i = 0; i < parts.length; i++) {
    const pt = parts[i];
    const k = pt.k || 0;
    const lb = Math.hypot(x - pt.bc[0], y - pt.bc[1], z - pt.bc[2]) - pt.br;
    if (pt.sub) {
      if (lb - k > -d) continue;
      d = smax(d, -partDist(pt, x, y, z), k);
    } else {
      if (i > 0 && lb - k > d) continue;
      const di = partDist(pt, x, y, z);
      d = i === 0 ? di : smin(d, di, k);
    }
  }
  return d;
}
function partsBox(parts, pad) {
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const pt of parts) {
    if (pt.sub) continue;
    for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], pt.bc[a] - pt.br); mx[a] = Math.max(mx[a], pt.bc[a] + pt.br); }
  }
  return [mn.map(v => v - pad), mx.map(v => v + pad)];
}

// Naive surface nets with vertex projection onto the surface and gradient normals
function surfaceNets(f, bmin, bmax, h) {
  const nx = Math.ceil((bmax[0] - bmin[0]) / h) + 1, ny = Math.ceil((bmax[1] - bmin[1]) / h) + 1, nz = Math.ceil((bmax[2] - bmin[2]) / h) + 1;
  const vals = new Float32Array(nx * ny * nz);
  const id = (i, j, k) => i + nx * (j + ny * k);
  // a coarse pass first: a coarse cell whose corners all sit farther from the surface than the cell is wide
  // holds no surface (the fields are distance bounds), so its samples take that sign without being evaluated.
  // Only the masks of empty cells change, and empty cells make no vertices, so the mesh is the same.
  const S = 4, cnx = Math.ceil((nx - 1) / S) + 1, cny = Math.ceil((ny - 1) / S) + 1, cnz = Math.ceil((nz - 1) / S) + 1;
  const cval = new Float32Array(cnx * cny * cnz), cidx = (i, j, k) => i + cnx * (j + cny * k);
  for (let k = 0; k < cnz; k++) for (let j = 0; j < cny; j++) for (let i = 0; i < cnx; i++)
    cval[cidx(i, j, k)] = f(bmin[0] + Math.min(i * S, nx - 1) * h, bmin[1] + Math.min(j * S, ny - 1) * h, bmin[2] + Math.min(k * S, nz - 1) * h);
  const margin = S * h * 1.75 * 1.2, far = new Float32Array((cnx - 1) * (cny - 1) * (cnz - 1));
  for (let k = 0; k < cnz - 1; k++) for (let j = 0; j < cny - 1; j++) for (let i = 0; i < cnx - 1; i++) {
    let lo = 1e9, hi = -1e9;
    for (let c = 0; c < 8; c++) { const v = cval[cidx(i + (c & 1), j + ((c >> 1) & 1), k + (c >> 2))]; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    far[i + (cnx - 1) * (j + (cny - 1) * k)] = lo > margin ? 1 : hi < -margin ? -1 : 0;
  }
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const fc = far[Math.min((i / S) | 0, cnx - 2) + (cnx - 1) * (Math.min((j / S) | 0, cny - 2) + (cny - 1) * Math.min((k / S) | 0, cnz - 2))];
    vals[id(i, j, k)] = fc ? fc * margin : f(bmin[0] + i * h, bmin[1] + j * h, bmin[2] + k * h);
  }

  const cx = nx - 1, cy = ny - 1, cz = nz - 1;
  const cid = (i, j, k) => i + cx * (j + cy * k);
  const cellVert = new Int32Array(cx * cy * cz).fill(-1);
  const pos = [];
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const cv = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { const v = vals[id(i + C[c][0], j + C[c][1], k + C[c][2])]; cv[c] = v; if (v < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) {
      if ((cv[a] < 0) === (cv[b] < 0)) continue;
      const t = cv[a] / (cv[a] - cv[b]);
      sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t; n++;
    }
    cellVert[cid(i, j, k)] = pos.length / 3;
    pos.push(bmin[0] + (i + sx / n) * h, bmin[1] + (j + sy / n) * h, bmin[2] + (k + sz / n) * h);
  }

  const quads = [];
  const q = (a, b, c, d) => { if (a >= 0 && b >= 0 && c >= 0 && d >= 0) quads.push(a, b, c, d); };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v0 = vals[id(i, j, k)] < 0;
    if (i < nx - 1 && j >= 1 && k >= 1 && j < ny - 1 && k < nz - 1 && v0 !== (vals[id(i + 1, j, k)] < 0))
      q(cellVert[cid(i, j - 1, k - 1)], cellVert[cid(i, j, k - 1)], cellVert[cid(i, j, k)], cellVert[cid(i, j - 1, k)]);
    if (j < ny - 1 && i >= 1 && k >= 1 && i < nx - 1 && k < nz - 1 && v0 !== (vals[id(i, j + 1, k)] < 0))
      q(cellVert[cid(i - 1, j, k - 1)], cellVert[cid(i, j, k - 1)], cellVert[cid(i, j, k)], cellVert[cid(i - 1, j, k)]);
    if (k < nz - 1 && i >= 1 && j >= 1 && i < nx - 1 && j < ny - 1 && v0 !== (vals[id(i, j, k + 1)] < 0))
      q(cellVert[cid(i - 1, j - 1, k)], cellVert[cid(i, j - 1, k)], cellVert[cid(i, j, k)], cellVert[cid(i - 1, j, k)]);
  }

  // Project vertices onto the surface and take normals from the field gradient
  const nv = pos.length / 3;
  const P = new Float32Array(pos), N = new Float32Array(nv * 3);
  const e = h * 0.25;
  const grad = (x, y, z, out) => {
    out[0] = f(x + e, y, z) - f(x - e, y, z); out[1] = f(x, y + e, z) - f(x, y - e, z); out[2] = f(x, y, z + e) - f(x, y, z - e);
    return out;
  };
  const g = [0, 0, 0];
  for (let v = 0; v < nv; v++) {
    let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    const ox = x, oy = y, oz = z;
    for (let it = 0; it < 3; it++) {
      const d = f(x, y, z);
      grad(x, y, z, g);
      const gl2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (gl2 < 1e-12) break;
      const s = d * (2 * e) / gl2;
      x -= g[0] * s; y -= g[1] * s; z -= g[2] * s;
    }
    const mx = x - ox, my = y - oy, mz = z - oz, ml = Math.hypot(mx, my, mz), lim = h * 0.8;
    if (ml > lim) { x = ox + mx / ml * lim; y = oy + my / ml * lim; z = oz + mz / ml * lim; }
    P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z;
    grad(x, y, z, g);
    const l = Math.hypot(g[0], g[1], g[2]) || 1;
    N[v * 3] = g[0] / l; N[v * 3 + 1] = g[1] / l; N[v * 3 + 2] = g[2] / l;
  }

  // Triangulate quads with consistent outward winding
  const idx = [];
  for (let qi = 0; qi < quads.length; qi += 4) {
    const a = quads[qi], b = quads[qi + 1], c = quads[qi + 2], d = quads[qi + 3];
    const dAC = Math.hypot(P[a * 3] - P[c * 3], P[a * 3 + 1] - P[c * 3 + 1], P[a * 3 + 2] - P[c * 3 + 2]);
    const dBD = Math.hypot(P[b * 3] - P[d * 3], P[b * 3 + 1] - P[d * 3 + 1], P[b * 3 + 2] - P[d * 3 + 2]);
    const tris = dAC < dBD ? [[a, b, c], [a, c, d]] : [[a, b, d], [b, c, d]];
    for (const [t0, t1, t2] of tris) {
      const ux = P[t1 * 3] - P[t0 * 3], uy = P[t1 * 3 + 1] - P[t0 * 3 + 1], uz = P[t1 * 3 + 2] - P[t0 * 3 + 2];
      const vx = P[t2 * 3] - P[t0 * 3], vy = P[t2 * 3 + 1] - P[t0 * 3 + 1], vz = P[t2 * 3 + 2] - P[t0 * 3 + 2];
      const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
      const nx2 = N[t0 * 3] + N[t1 * 3] + N[t2 * 3], ny2 = N[t0 * 3 + 1] + N[t1 * 3 + 1] + N[t2 * 3 + 1], nz2 = N[t0 * 3 + 2] + N[t1 * 3 + 2] + N[t2 * 3 + 2];
      if (fx * nx2 + fy * ny2 + fz * nz2 >= 0) idx.push(t0, t1, t2); else idx.push(t0, t2, t1);
    }
  }
  return { P, N, idx: nv > 65535 ? new Uint32Array(idx) : new Uint16Array(idx), nv };
}

// Build a skinned mesh from a model: parts + bones (rest pose).
// Vertex layout (14 floats): pos3, nrm3, bone0, bone1, w0, ao, col rgb, bodyFlag
// The same field as modelSdf, but each sample only looks at the parts near it: the box is cut into bins and every
// bin keeps (in order) the parts whose bounds come within reach of it. Anywhere within reach of the surface the
// value is unchanged, so models with hundreds of small parts mesh many times faster.
function binnedSdf(parts, bmin, bmax, reach) {
  const ext = [0, 1, 2].map(a => bmax[a] - bmin[a]), bs = Math.max(...ext) / 22;
  const nb = ext.map(e => Math.max(1, Math.ceil(e / bs))), lists = [], hd = bs * 0.8661;
  for (let k = 0; k < nb[2]; k++) for (let j = 0; j < nb[1]; j++) for (let i = 0; i < nb[0]; i++) {
    const cx = bmin[0] + (i + 0.5) * bs, cy = bmin[1] + (j + 0.5) * bs, cz = bmin[2] + (k + 0.5) * bs;
    lists.push(parts.filter(pt => Math.hypot(cx - pt.bc[0], cy - pt.bc[1], cz - pt.bc[2]) - pt.br - (pt.k || 0) < hd + reach));
  }
  return (x, y, z) => {
    // (a NaN coordinate lands in bin 0 rather than off the end)
    let i = Math.floor((x - bmin[0]) / bs) | 0, j = Math.floor((y - bmin[1]) / bs) | 0, kk = Math.floor((z - bmin[2]) / bs) | 0;
    i = i < 0 ? 0 : i >= nb[0] ? nb[0] - 1 : i; j = j < 0 ? 0 : j >= nb[1] ? nb[1] - 1 : j; kk = kk < 0 ? 0 : kk >= nb[2] ? nb[2] - 1 : kk;
    const L = lists[i + nb[0] * (j + nb[1] * kk)];
    let d = 1e9, first = true;
    for (let n = 0; n < L.length; n++) {
      const pt = L[n], k = pt.k || 0;
      const lb = Math.hypot(x - pt.bc[0], y - pt.bc[1], z - pt.bc[2]) - pt.br;
      if (pt.sub) {
        if (lb - k > -d) continue;
        d = smax(d, -partDist(pt, x, y, z), k);
      } else {
        if (!first && lb - k > d) continue;
        const di = partDist(pt, x, y, z);
        d = first ? di : smin(d, di, k);
        first = false;
      }
    }
    return d;
  };
}
function buildSkinnedMesh(model, cell) {
  prepParts(model.parts);
  const [bmin, bmax] = partsBox(model.parts, cell * 2.5);
  // reach: the farthest any sample is taken from the surface (ambient occlusion probes, the coarse pass)
  const f = model.parts.length > 24 ? binnedSdf(model.parts, bmin, bmax, Math.max(0.12 * (model.aoScale || 1), cell * 10) + 0.05) : (x, y, z) => modelSdf(model.parts, x, y, z);
  const mesh = surfaceNets(f, bmin, bmax, cell);
  const { P, N, nv } = mesh;
  const V = new Float32Array(nv * 14);
  const bones = model.bones;
  const aoH = [0.018, 0.04, 0.07, 0.11].map(v => v * (model.aoScale || 1));
  for (let v = 0; v < nv; v++) {
    const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    const nx = N[v * 3], ny = N[v * 3 + 1], nz = N[v * 3 + 2];
    // closest part decides color and rigid binding
    let best = 1e9, bp = null;
    for (const pt of model.parts) { if (pt.sub) continue; if (Math.hypot(x - pt.bc[0], y - pt.bc[1], z - pt.bc[2]) - pt.br > best) continue; const d = Math.abs(partDist(pt, x, y, z)); if (d < best) { best = d; bp = pt; } }
    let b0 = 0, b1 = 0, w0 = 1;
    if (bp && bp.bone !== undefined) { b0 = b1 = bp.bone; w0 = 1; }
    else {
      let d0 = 1e9, d1 = 1e9, i0 = 0, i1 = 0;
      for (let b = 0; b < bones.length; b++) {
        const bn = bones[b];
        if (bn.noSkin) continue;
        const d = sdSegDist(x, y, z, bn.p[0], bn.p[1], bn.p[2], bn.e[0], bn.e[1], bn.e[2]) - bn.r;
        if (d < d0) { d1 = d0; i1 = i0; d0 = d; i0 = b; } else if (d < d1) { d1 = d; i1 = b; }
      }
      const sigma = model.skinSoft || 0.03;
      const wa = 1, wb = Math.exp(-(d1 - d0) / sigma);
      b0 = i0; b1 = i1; w0 = wa / (wa + wb);
    }
    // ambient occlusion from the field
    let occ = 0, wgt = 1;
    for (const hh of aoH) { occ += (hh - f(x + nx * hh, y + ny * hh, z + nz * hh)) / hh * wgt; wgt *= 0.6; }
    const ao = clamp(1 - occ * 0.42, 0.25, 1);
    const o = v * 14;
    V[o] = x; V[o + 1] = y; V[o + 2] = z; V[o + 3] = nx; V[o + 4] = ny; V[o + 5] = nz;
    V[o + 6] = b0; V[o + 7] = b1; V[o + 8] = w0; V[o + 9] = ao;
    if (bp && bp.col) { V[o + 10] = bp.col[0]; V[o + 11] = bp.col[1]; V[o + 12] = bp.col[2]; V[o + 13] = 0; }
    else { V[o + 10] = 1; V[o + 11] = 1; V[o + 12] = 1; V[o + 13] = 1; }
  }
  return { verts: V, idx: mesh.idx, nv, ni: mesh.idx.length };
}
