// ============================================================
// The arena: a walled rounded square with boulders and goo pools.
// Boulders and pools both block movement; boulders also stop shots.
// ============================================================
const ARENA = { hw: 20, hd: 20, cr: 5, rocks: [], pools: [], wall: [], obstacles: [] };

// Signed distance to the arena edge (negative inside)
function arenaSd(x, z) {
  const qx = Math.abs(x) - (ARENA.hw - ARENA.cr), qz = Math.abs(z) - (ARENA.hd - ARENA.cr);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - ARENA.cr;
}
// Outward normal of the arena edge nearest to (x, z)
function arenaNormal(x, z, out) {
  const qx = Math.abs(x) - (ARENA.hw - ARENA.cr), qz = Math.abs(z) - (ARENA.hd - ARENA.cr);
  if (qx > 0 && qz > 0) { const l = Math.hypot(qx, qz); out[0] = Math.sign(x) * qx / l; out[1] = Math.sign(z) * qz / l; }
  else if (qx > qz) { out[0] = Math.sign(x) || 1; out[1] = 0; }
  else { out[0] = 0; out[1] = Math.sign(z) || 1; }
  return out;
}

function buildArena(chapter) {
  const rnd = mulberry32(chapter * 7919 + 17);
  const placed = [];
  ARENA.rocks = []; ARENA.pools = []; ARENA.wall = [];
  const free = (x, z, r) => Math.hypot(x, z) > 7 + r && arenaSd(x, z) < -(r + 2.5)
    && placed.every(o => Math.hypot(o.x - x, o.z - z) > o.r + r + 2.4);
  const place = (kind, n, rmin, rmax) => {
    for (let i = 0, tries = 0; i < n && tries < 500; tries++) {
      const r = rmin + rnd() * (rmax - rmin);
      const x = (rnd() * 2 - 1) * ARENA.hw, z = (rnd() * 2 - 1) * ARENA.hd;
      if (!free(x, z, r)) continue;
      const o = { kind, x, z, r, yaw: rnd() * TAU, v: Math.floor(rnd() * 3), ph: rnd() * 10 };
      placed.push(o);
      (kind === 'rock' ? ARENA.rocks : ARENA.pools).push(o);
      i++;
    }
  };
  place('pool', 4, 1.7, 2.5);
  place('rock', 11, 0.8, 1.35);
  ARENA.obstacles = placed;
  // a ring of boulders just outside the edge (movement is held in by the edge itself)
  const { hw, hd, cr } = ARENA, out = 0.9, pts = [];
  const sx = hw - cr, sz = hd - cr, step = 1.7;
  for (let x = -sx; x <= sx; x += step) { pts.push([x, -hd - out]); pts.push([x, hd + out]); }
  for (let z = -sz; z <= sz; z += step) { pts.push([-hw - out, z]); pts.push([hw + out, z]); }
  for (const [cx, cz, a0] of [[sx, sz, 0], [-sx, sz, Math.PI / 2], [-sx, -sz, Math.PI], [sx, -sz, Math.PI * 1.5]]) {
    const n = Math.ceil((cr + out) * Math.PI / 2 / step);
    for (let i = 1; i < n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * (cr + out), cz + Math.sin(a) * (cr + out)]); }
  }
  for (const [x, z] of pts) ARENA.wall.push({ x: x + (rnd() - 0.5) * 0.4, z: z + (rnd() - 0.5) * 0.4, r: 1.0 + rnd() * 0.45, yaw: rnd() * TAU, v: Math.floor(rnd() * 3) });
}

// Push a circle (o.x, o.z, radius r) out of obstacles and back inside the arena.
// Returns the obstacle it touched, 'wall', or null.
const _n2 = [0, 0];
function resolveCircle(o, r) {
  let hit = null;
  for (const ob of ARENA.obstacles) {
    const dx = o.x - ob.x, dz = o.z - ob.z, min = ob.r + r, d2 = dx * dx + dz * dz;
    if (d2 >= min * min) continue;
    const d = Math.sqrt(d2) || 1e-4;
    o.x = ob.x + dx / d * min; o.z = ob.z + dz / d * min;
    hit = ob;
  }
  const sd = arenaSd(o.x, o.z);
  if (sd > -r) {
    arenaNormal(o.x, o.z, _n2);
    o.x -= _n2[0] * (sd + r); o.z -= _n2[1] * (sd + r);
    hit = hit || 'wall';
  }
  return hit;
}
function inRock(x, z, pad = 0) {
  for (const ob of ARENA.rocks) if (Math.hypot(x - ob.x, z - ob.z) < ob.r + pad) return true;
  return false;
}
function blockedAt(x, z, r) {
  if (arenaSd(x, z) > -r) return true;
  for (const ob of ARENA.obstacles) if (Math.hypot(x - ob.x, z - ob.z) < ob.r + r) return true;
  return false;
}
// Bend a chase direction (dx, dz, unit) around obstacles between the walker and its goal
function steerAround(x, z, r, dx, dz, goalDist, out) {
  for (const ob of ARENA.obstacles) {
    const ox = ob.x - x, oz = ob.z - z, od = Math.hypot(ox, oz) || 1e-4;
    const clear = ob.r + r + 0.6;
    if (od > clear + 1.6 || od - ob.r > goalDist) continue;
    const ahead = (ox * dx + oz * dz) / od;
    if (ahead < 0.2) continue;
    let tx = -oz / od, tz = ox / od;
    if (tx * dx + tz * dz < 0) { tx = -tx; tz = -tz; }
    const w = clamp((clear + 1.6 - od) / 1.6, 0, 1) * ahead;
    dx = dx * (1 - w) + tx * w; dz = dz * (1 - w) + tz * w;
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
  }
  out[0] = dx; out[1] = dz;
  return out;
}
