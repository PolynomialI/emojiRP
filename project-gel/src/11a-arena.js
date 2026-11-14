// ============================================================
// The arena: a walled rounded square dressed by the chapter's theme (ARENAS in 10-data.js).
// Props are static meshes (round or box footprints); blocking ones stop movement, some also stop shots.
// Zones are ground patches: pools block, others slow, burn or make you slide.
// ============================================================
const ARENA = { hw: 50, hd: 50, cr: 8, boxes: null, theme: null, props: [], zones: [], wall: [], obstacles: [], grid: null, cols: 0, rows: 0, fx: null };
// obstacles are bucketed into a coarse grid; each bucket also holds obstacles within OB_PAD of it
const OB_CELL = 4, OB_PAD = 4, NO_OBS = [];

// A map can instead be a union of rounded boxes (theme.boxes: { x, z, hw, hd, cr }), like the Wild West town's
// street and square; hw/hd then bound them all
function boxSd(x, z, B) {
  const qx = Math.abs(x - B.x) - (B.hw - B.cr), qz = Math.abs(z - B.z) - (B.hd - B.cr);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - B.cr;
}
// Signed distance to the arena edge (negative inside)
function arenaSd(x, z) {
  if (ARENA.boxes) { let d = 1e9; for (const B of ARENA.boxes) d = Math.min(d, boxSd(x, z, B)); return d; }
  const qx = Math.abs(x) - (ARENA.hw - ARENA.cr), qz = Math.abs(z) - (ARENA.hd - ARENA.cr);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - ARENA.cr;
}
// Outward normal of the arena edge nearest to (x, z)
function arenaNormal(x, z, out) {
  if (ARENA.boxes) {
    const e = 0.05, gx = arenaSd(x + e, z) - arenaSd(x - e, z), gz = arenaSd(x, z + e) - arenaSd(x, z - e), l = Math.hypot(gx, gz) || 1;
    out[0] = gx / l; out[1] = gz / l; return out;
  }
  const qx = Math.abs(x) - (ARENA.hw - ARENA.cr), qz = Math.abs(z) - (ARENA.hd - ARENA.cr);
  if (qx > 0 && qz > 0) { const l = Math.hypot(qx, qz); out[0] = Math.sign(x) * qx / l; out[1] = Math.sign(z) * qz / l; }
  else if (qx > qz) { out[0] = Math.sign(x) || 1; out[1] = 0; }
  else { out[0] = 0; out[1] = Math.sign(z) || 1; }
  return out;
}

function buildArena(chapter) {
  const info = chapterInfo(chapter), T = ARENAS[info.arena];
  const rnd = mulberry32(chapter * 7919 + 17);
  ARENA.theme = T;
  // the map's shape: the usual walled square, or the theme's own union of boxes
  if (T.boxes) {
    ARENA.boxes = T.boxes; ARENA.cr = 1;
    ARENA.hw = Math.max(...T.boxes.map(B => Math.abs(B.x) + B.hw)); ARENA.hd = Math.max(...T.boxes.map(B => Math.abs(B.z) + B.hd));
  } else if (ARENA.boxes) { ARENA.boxes = null; ARENA.hw = ARENA.hd = 50; ARENA.cr = 8; }
  ARENA.props = []; ARENA.zones = []; ARENA.wall = []; ARENA.fx = null;
  const placed = [];
  const fits = (x, z, r, spawnClear = 7) => Math.hypot(x, z) > spawnClear + r && arenaSd(x, z) < -(r + 2.5)
    && placed.every(o => Math.hypot(o.x - x, o.z - z) > o.r + r + 2.4);
  const api = {
    rnd, fits,
    // add one prop or zone exactly where asked (layouts use this)
    prop(kind, x, z, r, extra = {}) {
      const K = PROP_KINDS[kind], models = K.models;
      const o = { kind, x, z, r, yaw: rnd() * TAU, model: models[Math.floor(rnd() * models.length)], ph: rnd() * 10, block: K.block !== false, shots: !!K.shots, ...extra };
      if (K.tints && !o.tint) o.tint = hexToRgb(K.tints[Math.floor(rnd() * K.tints.length)]);
      if (o.shape === 'box') o.r = Math.hypot(o.hw, o.hd);
      placed.push(o); ARENA.props.push(o);
      return o;
    },
    zone(kind, x, z, r, extra = {}) {
      const o = { kind, x, z, r, ph: rnd() * 10, block: !!ZONE_KINDS[kind].block, ...extra };
      placed.push(o); ARENA.zones.push(o);
      return o;
    },
    // scatter n of a kind wherever they fit
    scatter(type, kind, n, rmin, rmax, test) {
      for (let i = 0, tries = 0; i < n && tries < 600; tries++) {
        const r = rmin + rnd() * (rmax - rmin);
        const x = (rnd() * 2 - 1) * ARENA.hw, z = (rnd() * 2 - 1) * ARENA.hd;
        if (!fits(x, z, r) || (test && !test(x, z, r))) continue;
        api[type](kind, x, z, r);
        i++;
      }
    },
  };
  // obstacle counts follow the floor area (the first 40x40 arenas had 4 pools and 11 boulders)
  const area = (ARENA.hw * ARENA.hd) / 400 * 0.8;
  if (ARENA_LAYOUTS[T.id]) ARENA_LAYOUTS[T.id](api, area);
  for (const [kind, n, rmin, rmax] of T.zones || []) api.scatter('zone', kind, Math.round(n * area), rmin, rmax);
  for (const [kind, n, rmin, rmax] of T.props || []) api.scatter('prop', kind, Math.round(n * area), rmin, rmax);
  ARENA.obstacles = placed.filter(o => o.block);
  gridObstacles();
  // a ring of props just outside the edge (movement is held in by the edge itself); a theme with noWall builds its own
  const W = PROP_KINDS[T.wall || 'rock'], { hw, hd, cr } = ARENA, out = 0.9, pts = [];
  const sx = hw - cr, sz = hd - cr, step = W.wallStep || 1.7;
  for (let x = -sx; x <= sx; x += step) { pts.push([x, -hd - out]); pts.push([x, hd + out]); }
  for (let z = -sz; z <= sz; z += step) { pts.push([-hw - out, z]); pts.push([hw + out, z]); }
  for (const [cx, cz, a0] of [[sx, sz, 0], [-sx, sz, Math.PI / 2], [-sx, -sz, Math.PI], [sx, -sz, Math.PI * 1.5]]) {
    const n = Math.ceil((cr + out) * Math.PI / 2 / step);
    for (let i = 1; i < n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * (cr + out), cz + Math.sin(a) * (cr + out)]); }
  }
  if (!T.noWall) for (const [x, z] of pts) {
    const r = (W.wallR || [1.0, 1.45]);
    ARENA.wall.push({ kind: T.wall || 'rock', x: x + (rnd() - 0.5) * 0.4, z: z + (rnd() - 0.5) * 0.4, r: r[0] + rnd() * (r[1] - r[0]), yaw: W.faceIn ? Math.atan2(-x, -z) : rnd() * TAU, model: W.models[Math.floor(rnd() * W.models.length)], ph: rnd() * 10, tint: W.tints ? hexToRgb(W.tints[Math.floor(rnd() * W.tints.length)]) : undefined });
  }
  // the theme's moving parts (tumbleweeds, ball pits, vents...)
  const F = ARENA_FEATURES[T.id];
  if (F) { ARENA.fx = { def: F, st: {} }; if (F.init) F.init(ARENA.fx.st, rnd); }
}

function gridObstacles() {
  const cols = ARENA.cols = Math.ceil((ARENA.hw * 2 + 8) / OB_CELL), rows = ARENA.rows = Math.ceil((ARENA.hd * 2 + 8) / OB_CELL);
  const grid = ARENA.grid = Array.from({ length: cols * rows }, () => []);
  const x0 = -ARENA.hw - 4, z0 = -ARENA.hd - 4;
  for (const ob of ARENA.obstacles) {
    const ex = (ob.shape === 'box' ? ob.hw : ob.r) + OB_PAD, ez = (ob.shape === 'box' ? ob.hd : ob.r) + OB_PAD;
    const c0 = Math.max(0, Math.floor((ob.x - ex - x0) / OB_CELL)), c1 = Math.min(cols - 1, Math.floor((ob.x + ex - x0) / OB_CELL));
    const r0 = Math.max(0, Math.floor((ob.z - ez - z0) / OB_CELL)), r1 = Math.min(rows - 1, Math.floor((ob.z + ez - z0) / OB_CELL));
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
// Distance from (x, z) to an obstacle's edge (negative inside); for boxes also the outward direction in _n2
const _n2 = [0, 0];
function obDist(ob, x, z, out) {
  if (ob.shape === 'box') {
    const dx = x - ob.x, dz = z - ob.z, qx = Math.abs(dx) - ob.hw, qz = Math.abs(dz) - ob.hd;
    if (qx > 0 || qz > 0) {
      const ox = Math.max(qx, 0) * Math.sign(dx), oz = Math.max(qz, 0) * Math.sign(dz), l = Math.hypot(ox, oz) || 1e-4;
      if (out) { out[0] = ox / l; out[1] = oz / l; }
      return l;
    }
    if (out) { if (qx > qz) { out[0] = Math.sign(dx) || 1; out[1] = 0; } else { out[0] = 0; out[1] = Math.sign(dz) || 1; } }
    return Math.max(qx, qz);
  }
  const dx = x - ob.x, dz = z - ob.z, d = Math.hypot(dx, dz) || 1e-4;
  if (out) { out[0] = dx / d; out[1] = dz / d; }
  return d - ob.r;
}

// Push a circle (o.x, o.z, radius r) out of obstacles and back inside the arena.
// Returns the obstacle it touched, 'wall', or null.
const _n3 = [0, 0];
function resolveCircle(o, r) {
  let hit = null;
  for (const ob of obsNear(o.x, o.z, r)) {
    const d = obDist(ob, o.x, o.z, _n3);
    if (d >= r) continue;
    o.x += _n3[0] * (r - d); o.z += _n3[1] * (r - d);
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
// Is (x, z) inside something that stops enemy shots (boulders, buildings...)?
function inRock(x, z, pad = 0) {
  for (const ob of obsNear(x, z, pad)) if (ob.shots && obDist(ob, x, z) < pad) return true;
  return false;
}
function blockedAt(x, z, r) {
  if (arenaSd(x, z) > -r) return true;
  for (const ob of obsNear(x, z, r)) if (obDist(ob, x, z) < r) return true;
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
// The zone under (x, z), if any (zones never overlap)
function zoneAt(x, z) {
  for (const o of ARENA.zones) if (!o.block && Math.hypot(x - o.x, z - o.z) < o.r * 0.95) return o;
  return null;
}

// ---------- theme hooks ----------
// ARENA_LAYOUTS[id](api, area): hand-placed set pieces before the random scatter
// ARENA_FEATURES[id]: { init(st, rnd), update(st, dt), emit(st) } for moving parts
const ARENA_LAYOUTS = {};
const ARENA_FEATURES = {};
// a blast at (x, z) shoves the theme's loose objects (the bounce house balls)
function arenaBlast(x, z, r, power) { const F = ARENA.fx; if (F && F.def.blast) F.def.blast(F.st, x, z, r, power); }
function updateArenaFx(dt) { fadeOccluders(dt); const F = ARENA.fx; if (F && F.def.update) F.def.update(F.st, dt); }
// tall scenery (trees, palms...) between the camera and the hero fades out; the camera looks north, so "behind" is smaller z
// (the city's buildings do their own fading)
// Does a box [x0, x1] x [0, top] x [z0, z1] stand between the camera and the blob? Straight lines from the camera to
// the blob's middle and top and to either side of it, tested against the box: this holds wherever the camera is
// (in a corner of the arena it stops following the blob, which then sits off to one side of the view)
const SIGHT = [[0, 0.5], [0, 1.7], [-0.5, 1.0], [0.5, 1.0]];
function hidesHero(x0, x1, top, z0, z1) {
  const c = R.cam.pos, h = G.hero.pos, lo = [x0, 0, z0], hi = [x1, top, z1];
  for (const [ox, oy] of SIGHT) {
    const d = [h[0] + ox - c[0], (h[1] || 0) + oy - c[1], h[2] - c[2]];
    let t0 = 0, t1 = 1, hit = true;
    for (let k = 0; k < 3 && hit; k++) {
      if (Math.abs(d[k]) < 1e-6) { if (c[k] < lo[k] || c[k] > hi[k]) hit = false; continue; }
      let a = (lo[k] - c[k]) / d[k], b = (hi[k] - c[k]) / d[k];
      if (a > b) { const q = a; a = b; b = q; }
      t0 = Math.max(t0, a); t1 = Math.min(t1, b);
      if (t0 > t1) hit = false;
    }
    if (hit) return true;
  }
  return false;
}
function fadeOccluders(dt) {
  const h = G.hero.pos;
  for (const o of ARENA.props) {
    const K = PROP_KINDS[o.kind], m = MODELS.defs[o.model];
    if (!(K.tall >= 2) || o.height || !m) continue;
    const sc = o.scale || o.r / K.unit, w = m.bmax[0] * sc + 0.6, top = m.top * sc;
    const behind = (Math.abs(h[0] - o.x) < w && h[2] < o.z + w * 0.5 && h[2] > o.z - top * 0.8 - w) || hidesHero(o.x - w + 0.4, o.x + w - 0.4, top, o.z - w + 0.4, o.z + w - 0.4);
    if (behind || o.fade) o.fade = clamp((o.fade || 0) + (behind ? 3 : -3) * dt, 0, 0.72);
  }
}
function emitArenaFx() { const F = ARENA.fx; if (F && F.def.emit) F.def.emit(F.st); }
