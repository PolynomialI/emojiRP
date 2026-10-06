// ============================================================
// The arena: a walled rounded square with boulders and goo pools.
// Boulders and pools both block movement; boulders also stop shots.
// ============================================================
const ARENA = { hw: 50, hd: 50, cr: 8, rocks: [], pools: [], wall: [], obstacles: [], grid: null, cols: 0, rows: 0 };
// obstacles are bucketed into a coarse grid; each bucket also holds obstacles within OB_PAD of it
const OB_CELL = 4, OB_PAD = 4, NO_OBS = [];

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
  // obstacle counts follow the floor area (the first 40x40 arenas had 4 pools and 11 boulders)
  const area = (ARENA.hw * ARENA.hd) / 400;
  place('pool', Math.round(4 * area * 0.8), 1.7, 2.6);
  place('rock', Math.round(11 * area * 0.8), 0.8, 1.4);
  ARENA.obstacles = placed;
  gridObstacles();
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

function gridObstacles() {
  const cols = ARENA.cols = Math.ceil((ARENA.hw * 2 + 8) / OB_CELL), rows = ARENA.rows = Math.ceil((ARENA.hd * 2 + 8) / OB_CELL);
  const grid = ARENA.grid = Array.from({ length: cols * rows }, () => []);
  const x0 = -ARENA.hw - 4, z0 = -ARENA.hd - 4;
  for (const ob of ARENA.obstacles) {
    const e = ob.r + OB_PAD;
    const c0 = Math.max(0, Math.floor((ob.x - e - x0) / OB_CELL)), c1 = Math.min(cols - 1, Math.floor((ob.x + e - x0) / OB_CELL));
    const r0 = Math.max(0, Math.floor((ob.z - e - z0) / OB_CELL)), r1 = Math.min(rows - 1, Math.floor((ob.z + e - z0) / OB_CELL));
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid[r * cols + c].push(ob);
  }
}
// Obstacles that can matter for a circle of radius r (plus up to 2.2 of steering room) at (x, z)
function obsNear(x, z, r = 0) {
  if (!ARENA.grid || r > OB_PAD - 2.2) return ARENA.obstacles;
  const c = Math.floor((x + ARENA.hw + 4) / OB_CELL), w = Math.floor((z + ARENA.hd + 4) / OB_CELL);
  if (c < 0 || w < 0 || c >= ARENA.cols || w >= ARENA.rows) return NO_OBS;
  return ARENA.grid[w * ARENA.cols + c];
}

// Push a circle (o.x, o.z, radius r) out of obstacles and back inside the arena.
// Returns the obstacle it touched, 'wall', or null.
const _n2 = [0, 0];
function resolveCircle(o, r) {
  let hit = null;
  for (const ob of obsNear(o.x, o.z, r)) {
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
  for (const ob of obsNear(x, z, pad)) if (ob.kind === 'rock' && Math.hypot(x - ob.x, z - ob.z) < ob.r + pad) return true;
  return false;
}
function blockedAt(x, z, r) {
  if (arenaSd(x, z) > -r) return true;
  for (const ob of obsNear(x, z, r)) if (Math.hypot(x - ob.x, z - ob.z) < ob.r + r) return true;
  return false;
}
// Bend a chase direction (dx, dz, unit) around obstacles between the walker and its goal
function steerAround(x, z, r, dx, dz, goalDist, out) {
  for (const ob of obsNear(x, z, r)) {
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
