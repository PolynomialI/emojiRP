// ============================================================
// The sea's folk beyond the plain swimmers, the chapters' islands and weather:
// tricorn pirates with cutlasses, snorkel divers who come up right beside you, keg pushers who blow up on the
// hull, parka pirates, ghost pirates, musketeers who come out of island huts and forts to shoot, minibosses
// (captains on their own rafts and canoes), and island hazards (fort cannons, volcano bombs, lightning).
// SEA_AI[type](e, dt, shipDef) runs before the default swimming and returns true to replace it;
// SEA_DRAW[type](e) draws instead of the default and returns true.
// ============================================================
const SEA_AI = {}, SEA_DRAW = {};

Object.assign(ENEMY_TYPES, {
  phat: { model: 'phat', hp: 26, speed: 1.9, dmg: 6, xp: 3, radius: 0.46, scale: 1.3, tint: '#c8283a', mass: 1.6, sea: true },
  pdiver: { model: 'pdiver', hp: 12, speed: 2.5, dmg: 5, xp: 2, radius: 0.42, scale: 1.25, tint: '#ff8a2a', mass: 1, sea: true },
  pbomb: { model: 'pbomb', hp: 10, speed: 1.7, dmg: 4, xp: 2, radius: 0.5, scale: 1.25, tint: '#3a8a4a', mass: 1.2, sea: true, keg: 15, onKill: e => seaKegBoom(e, false) },
  pparka: { model: 'pparka', hp: 14, speed: 1.9, dmg: 4, xp: 1, radius: 0.46, scale: 1.3, tint: '#3a8ad8', mass: 1.3, sea: true },
  pghost: { model: 'pswim', hp: 14, speed: 2.3, dmg: 5, xp: 2, radius: 0.42, scale: 1.25, tint: '#a8fff0', mass: 1, sea: true, ghost: true },
  pmusket: { model: 'pmusket', hp: 22, speed: 0, dmg: 7, xp: 3, radius: 0.4, scale: 1.3, tint: '#c8283a', mass: 99, sea: true },
  pcapt: { model: 'pcapt', hp: 40, speed: 3.2, dmg: 10, xp: 0, radius: 1.2, scale: 1.5, tint: '#8a2a3a', mass: 9, sea: true },
});

// each chapter's crowd, islands, weather and miniboss (the boss is in 13n-sea-bosses.js)
// mix: [type, from second, weight]; isles: island models;
// zap: lightning strikes in the storm; fogK: how far you see (share of normal); current: how hard the water pushes the ship about
const SEA_THEMES = [
  { mix: [['pswim', 0, 1], ['pfloat', 50, 0.35], ['ptube', 140, 0.22]], isles: ['isle0', 'isle1'], mini: { name: 'Raft Rascal', ride: 'raft', tint: '#e8414a', atk: ['ram', 'bombs', 'call'] } },
  { mix: [['pswim', 0, 1], ['pdiver', 30, 0.4], ['pfloat', 60, 0.3], ['phat', 120, 0.25], ['ptube', 150, 0.2]], isles: ['icoral', 'isle1'], mini: { name: 'Canoe Corsair', ride: 'canoe', tint: '#ff7aa8', atk: ['ram', 'volley', 'call'] } },
  { mix: [['pswim', 0, 1], ['pdiver', 0, 0.4], ['phat', 40, 0.3], ['pbomb', 90, 0.2], ['ptube', 120, 0.25]], isles: ['ikelp'], mini: { name: 'Kelp Captain', ride: 'canoe', tint: '#4a8a3a', atk: ['ram', 'bombs', 'volley'] } },
  { mix: [['pswim', 0, 1], ['phat', 0, 0.35], ['pbomb', 40, 0.25], ['pdiver', 60, 0.35], ['pfloat', 90, 0.3]], isles: ['ihut', 'isle0'], mini: { name: 'Smuggler Sam', ride: 'canoe', tint: '#3a3a4a', atk: ['volley', 'bombs', 'ram'] } },
  { mix: [['pparka', 0, 1], ['pfloat', 0, 0.35], ['phat', 40, 0.3], ['ptube', 80, 0.3], ['pbomb', 120, 0.2]], isles: ['iice'], mini: { name: 'Frostbeard', ride: 'raft', tint: '#3a8ad8', atk: ['ram', 'bombs', 'call'] } },
  { mix: [['pswim', 0, 1], ['phat', 0, 0.4], ['pbomb', 30, 0.3], ['pdiver', 60, 0.35], ['ptube', 100, 0.3]], isles: ['ivolc'], current: 0.3, mini: { name: 'Cinder Jack', ride: 'canoe', tint: '#ff6a1a', atk: ['bombs', 'ram', 'volley'] } },
  { mix: [['pghost', 0, 1], ['phat', 0, 0.35], ['pdiver', 30, 0.4], ['ptube', 80, 0.3], ['pbomb', 120, 0.2]], isles: ['ighost'], fogK: 0.45, current: 0.35, mini: { name: 'The Ghost Mate', ride: 'raft', tint: '#a8fff0', ghost: true, atk: ['ram', 'call', 'volley'] } },
  { mix: [['pswim', 0, 1], ['phat', 0, 0.4], ['pbomb', 0, 0.3], ['pdiver', 30, 0.4], ['pfloat', 60, 0.3], ['ptube', 90, 0.3]], isles: ['ispire'], zap: true, current: 0.45, mini: { name: 'Storm Mate Gale', ride: 'canoe', tint: '#8a9ab8', atk: ['ram', 'volley', 'bombs'] } },
  { mix: [['pswim', 0, 1], ['phat', 0, 0.45], ['pdiver', 0, 0.45], ['pbomb', 30, 0.3], ['ptube', 60, 0.35]], isles: ['iwreck'], fogK: 0.75, current: 0.5, mini: { name: 'Deep Diver Dan', ride: 'canoe', tint: '#2a4a6a', atk: ['call', 'ram', 'bombs'] } },
  { mix: [['phat', 0, 1], ['pswim', 0, 0.8], ['pbomb', 0, 0.35], ['pdiver', 20, 0.4], ['ptube', 40, 0.35], ['pfloat', 60, 0.3]], isles: ['ifort', 'ihut'], zap: true, current: 0.55, mini: { name: 'First Mate Fang', ride: 'canoe', tint: '#1e1a24', atk: ['volley', 'ram', 'bombs', 'call'] } },
];
SEA_CHAPTERS.forEach((C, i) => Object.assign(C, SEA_THEMES[i]));
// the islands' heights (at radius 4) where musketeers stand, and where on them (share of the radius)
const ISLE_POSTS = {
  ihut: { y: 0.62, at: [[0.55, 0.45], [-0.55, 0.4], [0.1, -0.6]] },
  ifort: { y: 1.5, at: [[0.55, 0.45], [-0.55, 0.45], [0.55, -0.45], [-0.55, -0.45]] },
};
const seaTheme = () => SEA_CHAPTERS[G.run.chapter - 1];

// ---------- divers: under water (only a snorkel shows, and nothing can target them) until close ----------
SEA_AI.pdiver = e => {
  if (e.surfaced) return false;
  if (hullDist(e.x, e.z) < 2.8 || e.hp < e.maxHp) {
    e.surfaced = true; e.hidden = false; e.speed *= 1.35;
    seaSplash(e.x, e.z, 1); AUDIO.play('splash', 0.7);
  } else e.hidden = true;
  return false;
};
SEA_DRAW.pdiver = e => {
  if (e.surfaced || e.dying) return false;
  const M = MODELS.defs.pdiver, c = M.clips.paddle;
  if (R.enemyDraw.pdiver) pushEnemy('pdiver', false, e.x, -1.42 * e.scale / 1.25, e.z, e.yaw, c.row + Math.floor((e.phase % 1) * c.frames), e.scale, 1, 0, 0, 0, e.tint[0], e.tint[1], e.tint[2]);
  seaShadow(e.x, e.z, 0.5, 0.8, -e.yaw, 0.55);
  if (Math.random() < 0.25) FX.part(e.x + rand(-0.2, 0.2), 0.05, e.z + rand(-0.2, 0.2), 0, rand(0.3, 0.6), 0, 0.05, 0.02, 0.4, [0.9, 0.97, 1], 0.9, 4, -0.5);
  return true;
};
// ---------- keg pushers: the keg blows up against the hull, or wherever its pusher is sunk ----------
function seaKegBoom(e, onHull) {
  if (e.kegDone) return;
  e.kegDone = true;
  const run = G.run, r = 2.0;
  if (onHull) { hurtHero(e.def.keg * run.info.dmgMul, e.x, e.z); G.cam.shake = Math.max(G.cam.shake, 0.2); }
  enemiesInRadius(e.x, e.z, r, o => { if (o !== e && !o.dying) { const dx = o.x - e.x, dz = o.z - e.z, d = Math.hypot(dx, dz) || 1; hurtEnemy(o, 24, dx / d * 7, dz / d * 7, { sound: false }); } });
  FX.ring(e.x, e.z, r * 1.2, [1, 0.6, 0.25], 0.45, 1);
  FX.burst(e.x, 0.4, e.z, 22, [1, 0.55, 0.2], 6, 0.14, 0.5, 1, 2);
  seaSplash(e.x, e.z, 1.2); AUDIO.play('boom');
  if (onHull && !e.dying) { e.hp = 0; killEnemy(e); }
}

// ---------- musketeers on island huts and forts ----------
SEA_AI.pmusket = (e, dt) => {
  const S = OC.ship, d = hullDist(e.x, e.z);
  e.yaw = angleLerp(e.yaw, Math.atan2(S.x - e.x, S.z - e.z), Math.min(1, dt * 4));
  e.phase += dt * 0.5;
  e.reload -= dt;
  if (e.aimT > 0) {
    e.aimT -= dt;
    e.act = { clip: 'aim', u: clamp(1 - e.aimT / 0.9, 0, 0.999) };
    if (e.aimT <= 0) {
      const tx = S.x + S.vx * 0.4, tz = S.z + S.vz * 0.4, dx = tx - e.x, dz = tz - e.z, l = Math.hypot(dx, dz) || 1;
      OC.hz.push({ k: 'ball', x: e.x + dx / l * 0.5, y: e.y + 1.0, z: e.z + dz / l * 0.5, vx: dx / l * 13, vz: dz / l * 13, life: 2, dmg: e.dmg });
      FX.smoke(e.x + dx / l * 0.6, e.y + 1.0, e.z + dz / l * 0.6, 0.3, [0.92, 0.92, 0.95], 0.6, 0.8);
      AUDIO.play('bang', 1.2);
      e.reload = rand(2.6, 3.6);
    }
  } else {
    e.act = { clip: 'idle', u: e.phase % 1 };
    if (e.reload <= 0 && d < 17 && !OC.sink) e.aimT = 0.9;
  }
  return true;
};
SEA_DRAW.pmusket = e => {
  if (!R.enemyDraw.pmusket) return true;
  const M = MODELS.defs.pmusket, c = M.clips[e.act ? e.act.clip : 'idle'] || M.clips.idle, u = e.act ? e.act.u : 0;
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0;
  pushEnemy('pmusket', e.elite, e.x, e.y, e.z, e.yaw, c.row + Math.floor(clamp(u, 0, 0.999) * c.frames), e.scale, e.squash, dead, e.flash > 0 ? 0.85 : 0, 0, e.tint[0], e.tint[1], e.tint[2]);
  if (e.aimT > 0 && !e.dying) { const S = OC.ship, dx = S.x - e.x, dz = S.z - e.z, l = Math.hypot(dx, dz) || 1, len = Math.min(l, 16); pushDecal(e.x + dx / l * len / 2, e.z + dz / l * len / 2, 0.08, len / 2, -Math.atan2(dx, dz), 9, 0, 1, 1, 0.25, 0.2, 0.6 * (1 - e.aimT / 0.9), true); }
  return true;
};

// ---------- the islands at work: huts and forts send out musketeers; forts fire cannons, volcanoes erupt ----------
function seaIsleTick(dt) {
  const run = G.run, S = OC.ship;
  if (OC.sink || G.state !== 'run') return;
  for (const I of OC.isles) {
    const d = Math.hypot(I.x - S.x, I.z - S.z) - I.r;
    if (d > 22) continue;
    const post = ISLE_POSTS[I.kind];
    if (post) {
      I.spawnT = (I.spawnT ?? rand(1, 3)) - dt;
      I.guard = (I.guard || []).filter(e => !e.dying && run.enemies.includes(e));
      if (I.spawnT <= 0 && I.guard.length < post.at.length && run.t > 10) {
        I.spawnT = rand(5, 8);
        const free = post.at.filter((_, i) => !I.guard.some(g => g.post === i));
        const i = post.at.indexOf(pick(free)), c = Math.cos(I.yaw), s = Math.sin(I.yaw), [ax, az] = post.at[i];
        const x = I.x + (c * ax + s * az) * I.r, z = I.z + (-s * ax + c * az) * I.r;
        const e = seaFoe('pmusket', x, z);
        e.y = post.y * I.r / 4; e.post = i; e.reload = rand(1, 2); e.aimT = 0; e.spawnT = 0;
        FX.burst(x, e.y + 0.4, z, 8, [0.9, 0.85, 0.7], 3, 0.08, 0.4, 2, 1);
        I.guard.push(e);
      }
    }
    if (I.kind === 'ifort') {
      // the tower's cannon lobs a ball at the ship
      I.gunT = (I.gunT ?? 3) - dt;
      if (I.gunT <= 0 && d < 18) {
        I.gunT = rand(3.5, 5);
        const tx = S.x + S.vx * 1.1, tz = S.z + S.vz * 1.1;
        OC.hz.push({ k: 'lob', sx: I.x, sy: 3.2 * I.r / 4, sz: I.z, tx, tz, x: I.x, y: 3, z: I.z, t: 0, dur: 1.3, r: 1.6, dmg: 11 * run.info.dmgMul, col: [1, 0.6, 0.3] });
        FX.smoke(I.x, 3.3 * I.r / 4, I.z, 0.7, [0.85, 0.85, 0.9], 0.9, 1); AUDIO.play('cannon', 0.8);
      }
    } else if (I.kind === 'ivolc') {
      // the volcano spits lava bombs round the water near it
      I.gunT = (I.gunT ?? 4) - dt;
      if (I.gunT <= 0 && d < 16) {
        I.gunT = rand(4.5, 7);
        for (let k = 0; k < 3; k++) { const tx = S.x + rand(-4, 4) + S.vx * 1.2, tz = S.z + rand(-4, 4) + S.vz * 1.2; OC.hz.push({ k: 'lob', lava: true, sx: I.x, sy: 2.7 * I.r / 4, sz: I.z, tx, tz, x: I.x, y: 2, z: I.z, t: -k * 0.25, dur: 1.4, r: 1.5, dmg: 14 * run.info.dmgMul, col: [1, 0.45, 0.1] }); }
        FX.burst(I.x, 2.8 * I.r / 4, I.z, 20, [1, 0.5, 0.15], 5, 0.14, 0.7, 1, 3); AUDIO.play('rumble');
      }
      if (Math.random() < dt * 4) FX.smoke(I.x + rand(-0.3, 0.3), 2.9 * I.r / 4, I.z + rand(-0.3, 0.3), 0.6, [0.4, 0.38, 0.4], 1.4, 1.2);
    }
  }
}
// hazards in the water: musket balls, lobbed balls and lava, lightning strikes
function updateSeaHazards(dt) {
  const run = G.run;
  for (const h of OC.hz) {
    if (SEA_HZ_LIVE.includes(h.k)) continue;
    if (h.k === 'ball') {
      h.life -= dt; h.x += h.vx * dt; h.z += h.vz * dt;
      if (hullDist(h.x, h.z) < 0.1 && !OC.sink) { h.dead = true; hurtHero(h.dmg, h.x, h.z); FX.burst(h.x, 0.6, h.z, 6, [0.8, 0.6, 0.4], 2.5, 0.06, 0.3, 2, 1); }
      else if (h.life <= 0) { h.dead = true; seaSplash(h.x, h.z, 0.5); }
      continue;
    }
    h.t += dt;
    if (h.t < 0) continue;
    const u = clamp(h.t / h.dur, 0, 1);
    if (h.k === 'lob') { h.x = lerp(h.sx, h.tx, u); h.z = lerp(h.sz, h.tz, u); h.y = lerp(h.sy, 0, u) + Math.sin(u * Math.PI) * 4; }
    if (u >= 1) {
      h.dead = true;
      if (h.k === 'zap') {
        addBolt(h.x, 14, h.z, h.x, 0, h.z, 0.4, [0.8, 0.9, 1]);
        R.frame.flashW = Math.max(R.frame.flashW, 0.5); AUDIO.play('thunder');
        enemiesInRadius(h.x, h.z, h.r, e => hurtEnemy(e, 40, 0, 0, { sound: false, color: [0.8, 0.9, 1] }));
      } else { FX.burst(h.x, 0.4, h.z, 16, h.col, 5, 0.12, 0.5, 1, 2); AUDIO.play('boom', 0.8); }
      if (hullDist(h.x, h.z) < h.r && !OC.sink) hurtHero(h.dmg, h.x, h.z);
      seaSplash(h.x, h.z, h.r * 0.8);
    }
  }
  OC.hz = OC.hz.filter(h => !h.dead);
  R.frame.flashW = Math.max(0, R.frame.flashW - dt * 1.5);
}
// (these the bosses' code runs and draws: 13n-sea-bosses.js)
const SEA_HZ_LIVE = ['snare', 'mine', 'tent', 'ink'];
function emitSeaHazards() {
  for (const h of OC.hz) {
    if (SEA_HZ_LIVE.includes(h.k)) continue;
    if (h.k === 'ball') { if (h.pearl) pushImp(h.x, h.y, h.z, 0.24, 0, 1, 0, 1, 27, 4, 0.5, OC.t, 0, 0, 0, 1); else pushImp(h.x, h.y, h.z, 0.14, 0, 1, 0, 1, 13, 0, 0.1, 0, 0, 0, 0, 1); continue; }
    if (h.t < 0) continue;
    const u = clamp(h.t / h.dur, 0, 1);
    pushDecal(h.tx ?? h.x, h.tz ?? h.z, h.r, h.r, 0, 4, 0, u, 1, h.k === 'zap' ? 0.9 : 0.22, h.k === 'zap' ? 0.95 : 0.18, 0.9);
    if (h.k === 'lob') { pushImp(h.x, h.y, h.z, 0.32, 0, 1, 0, 1, h.lava ? 15 : 13, 0, h.lava ? 0.6 : 0.1, h.t * 3, 0, 0, 0, 1); if (h.lava) FX.glow(h.x, h.y, h.z, 0.7, [1, 0.5, 0.15], 0.05, 0.6); }
  }
}

// ---------- weather: a rougher sea, a current, storms with rain and lightning ----------
function seaWeather(dt) {
  const run = G.run, S = OC.ship, C = seaTheme(), f = R.frame, st = OC.storm;
  // the current: a slow push that turns about over time
  if (C.current && !OC.sink) { const a = OC.t * 0.05 + run.chapter; S.x += Math.cos(a) * C.current * 0.45 * dt; S.z += Math.sin(a) * C.current * 0.45 * dt; }
  // storm light: greyer and darker as it builds
  const base = OC.look || (OC.look = { fog: f.fogCol.slice(), light: f.lightCol.slice(), sky: f.skyCol.slice() });
  for (let i = 0; i < 3; i++) { f.fogCol[i] = lerp(base.fog[i], [0.32, 0.38, 0.45][i], st * 0.8); f.lightCol[i] = lerp(base.light[i], [0.62, 0.68, 0.78][i], st); f.skyCol[i] = lerp(base.sky[i], [0.5, 0.56, 0.66][i], st); }
  if (st > 0.15) {
    // rain streaks across the view
    const n = Math.round(st * 10);
    for (let i = 0; i < n; i++) FX.part(G.cam.x + rand(-14, 14) * SEA.view, rand(4, 7), G.cam.z + rand(-10, 10) * SEA.view, -1.5, -16, 1, 0.035, 0.02, 0.4, [0.8, 0.88, 1], 0.5, 1, 0, 0);
    OC.boltT = (OC.boltT ?? 5) - dt;
    if (OC.boltT <= 0 && st > 0.5) {
      OC.boltT = rand(3.5, 8);
      if (C.zap) OC.hz.push({ k: 'zap', x: S.x + rand(-5, 5), z: S.z + rand(-5, 5), t: 0, dur: 1.2, r: 1.8, dmg: 9 * run.info.dmgMul });
      else { R.frame.flashW = 0.35; AUDIO.play('thunder', 0.7); }
    }
  }
}

// ---------- minibosses: captains on their own rafts and canoes ----------
function seaMini(k) {
  const run = G.run, M = seaTheme().mini, [, hpK, scK] = MINI_VISITS[k], [x, z] = seaSpawnPoint();
  const e = seaFoe('pcapt', x, z);
  e.mini = true; e.name = M.name; e.ride = M.ride; e.atk = M.atk;
  e.hp = e.maxHp = 300 * run.info.hpMul * hpK; e.scale *= scK; e.radius = M.ride === 'raft' ? 1.25 : 1.0;
  e.tint = hexToRgb(M.tint); e.ghost = !!M.ghost; e.spawnT = 0;
  e.ai = { state: 'circle', t: 2.5, ang: Math.atan2(x - OC.ship.x, z - OC.ship.z), n: 0 };
  ensureMeshNow(M.ride);
  UI.banner(M.name.toUpperCase()); AUDIO.play('horn');
}
// a vehicle against the hull: a ram if the ship drives into it, a bump otherwise
function seaVehicleContact(e) {
  const S = OC.ship, D = shipDef(), n = [0, 0], d = hullDist(e.x, e.z, n), top = D.speed * G.run.stats.speedMul;
  if (d >= e.radius * 0.8) return false;
  const vn = -(S.vx * n[0] + S.vz * n[1]);
  if (vn > SEA.ramMin && e.ramCd <= 0) seaRam(e, n, vn, top);
  const ov = e.radius * 0.8 - d;
  e.x += n[0] * ov * 0.7; e.z += n[1] * ov * 0.7; S.x -= n[0] * ov * 0.3; S.z -= n[1] * ov * 0.3;
  return true;
}
SEA_AI.pcapt = (e, dt) => {
  const run = G.run, S = OC.ship, ai = e.ai, D = shipDef();
  ai.t -= dt; e.phase += dt;
  const dx = S.x - e.x, dz = S.z - e.z, d = Math.hypot(dx, dz) || 1;
  const steer = (tx, tz, sp, k = 2) => {
    const ox = tx - e.x, oz = tz - e.z, l = Math.hypot(ox, oz) || 1;
    e.vx += (ox / l * sp - e.vx) * Math.min(1, dt * k); e.vz += (oz / l * sp - e.vz) * Math.min(1, dt * k);
  };
  const ring = D.len * 0.5 + 6;
  if (ai.state === 'circle') {
    ai.ang += dt * 0.35;
    steer(S.x + Math.sin(ai.ang) * ring, S.z + Math.cos(ai.ang) * ring, e.speed);
    e.clip = 'idle';
    if (ai.t <= 0) {
      const a = e.atk[ai.n++ % e.atk.length];
      if (a === 'ram') { ai.state = 'aim'; ai.t = 1.1; ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: e.radius, len: d + 4, rot: Math.atan2(dx, dz), dur: 1.1 }); }
      else if (a === 'bombs') { ai.state = 'throw'; ai.t = 0.8; ai.thrown = 0; }
      else if (a === 'volley') { ai.state = 'volley'; ai.t = 0.6; }
      else { ai.state = 'call'; ai.t = 0.7; }
    }
  } else if (ai.state === 'aim') {
    // wind up along the lane, then charge
    e.vx *= 0.9; e.vz *= 0.9;
    if (ai.tele) { ai.tele.x = e.x; ai.tele.z = e.z; ai.tele.rot = Math.atan2(dx, dz); ai.tele.len = d + 4; }
    if (ai.t <= 0) { ai.state = 'charge'; ai.t = 1.3; ai.dir = [dx / d, dz / d]; AUDIO.play('horn', 1.3); }
  } else if (ai.state === 'charge') {
    e.vx = ai.dir[0] * 10; e.vz = ai.dir[1] * 10;
    if (Math.random() < 0.6) seaSplash(e.x, e.z, 0.5);
    const n = [0, 0];
    if (hullDist(e.x, e.z, n) < e.radius) {
      hurtHero(e.dmg * 1.2, e.x, e.z);
      S.vx -= n[0] * 6; S.vz -= n[1] * 6; S.speed *= 0.5;
      e.vx = n[0] * 5; e.vz = n[1] * 5; e.stun = 0.8;
      G.cam.shake = Math.max(G.cam.shake, 0.25); AUDIO.play('thud'); AUDIO.play('crumble', 0.8);
      ai.state = 'circle'; ai.t = 2.5;
    } else if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2.2; }
  } else if (ai.state === 'throw') {
    e.clip = 'throw'; e.clipU = 1 - ai.t / 0.8;
    e.vx *= 0.95; e.vz *= 0.95;
    if (ai.t < 0.3 && !ai.thrown) {
      ai.thrown = 1;
      for (let k = 0; k < 3; k++) { const tx = S.x + S.vx * 1.2 + rand(-2.2, 2.2), tz = S.z + S.vz * 1.2 + rand(-2.2, 2.2); OC.hz.push({ k: 'lob', sx: e.x, sy: 1.8, sz: e.z, tx, tz, x: e.x, y: 1.8, z: e.z, t: -k * 0.15, dur: 1.15, r: 1.4, dmg: e.dmg * 0.9, col: [1, 0.55, 0.2] }); }
      AUDIO.play('throw');
    }
    if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2.4; }
  } else if (ai.state === 'volley') {
    e.vx *= 0.9; e.vz *= 0.9;
    if (ai.t <= 0) {
      const a0 = Math.atan2(dx, dz);
      for (let k = -2; k <= 2; k++) { const a = a0 + k * 0.16; OC.hz.push({ k: 'ball', x: e.x, y: 1.4, z: e.z, vx: Math.sin(a) * 12, vz: Math.cos(a) * 12, life: 2, dmg: e.dmg * 0.4 }); }
      FX.smoke(e.x, 1.5, e.z, 0.6, [0.92, 0.92, 0.95], 0.7, 1); AUDIO.play('bang');
      ai.state = 'circle'; ai.t = 2.4;
    }
  } else if (ai.state === 'call') {
    e.vx *= 0.9; e.vz *= 0.9;
    if (ai.t <= 0) {
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU; const o = seaFoe(e.ghost ? 'pghost' : 'pswim', e.x + Math.sin(a) * 1.6, e.z + Math.cos(a) * 1.6); o.spawnT = 0.3; seaSplash(o.x, o.z, 0.6); }
      AUDIO.play('horn', 0.8); ai.state = 'circle'; ai.t = 2.8;
    }
  }
  if (e.stun > 0) { e.vx *= 0.92; e.vz *= 0.92; }
  e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt;
  const kd = Math.exp(-3 * dt); e.kx *= kd; e.kz *= kd;
  if (Math.hypot(e.vx, e.vz) > 0.4) e.yaw = angleLerp(e.yaw, Math.atan2(e.vx, e.vz), Math.min(1, dt * 3));
  if (ai.state !== 'charge') seaVehicleContact(e);
  for (const I of OC.isles) { const ix = e.x - I.x, iz = e.z - I.z, id = Math.hypot(ix, iz) || 1, ov = I.ob.r + e.radius - id; if (ov > 0) { e.x += ix / id * ov; e.z += iz / id * ov; } }
  return true;
};
SEA_DRAW.pcapt = e => {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, t = OC.t, bob = Math.sin(t * 1.7 + e.id) * 0.05 - dead * 0.8;
  const V = MODELS.defs[e.ride], deck = e.ride === 'raft' ? 0.17 : 0.125;
  if (V && R.enemyDraw[e.ride]) { const c = V.clips.rock; pushEnemy(e.ride, false, e.x, bob, e.z, e.yaw, c.row + Math.floor(((t * 0.2 + e.id * 0.1) % 1) * c.frames), 1, 1, dead, e.flash > 0 ? 0.6 : 0, 0, 1, 1, 1, e.ghost ? 0.35 : 0); }
  if (R.enemyDraw.pcapt) {
    const M = MODELS.defs.pcapt, clip = M.clips[e.clip] || M.clips.idle, u = e.clip === 'throw' ? clamp(e.clipU || 0, 0, 0.999) : e.phase % 1;
    const S = OC.ship, face = Math.atan2(S.x - e.x, S.z - e.z), tn = e.tint;
    pushEnemy('pcapt', false, e.x, bob + deck, e.z, e.ai.state === 'charge' ? e.yaw : face, clip.row + Math.floor(u * clip.frames), e.scale, e.squash, dead, e.flash > 0 ? 0.85 : 0, 0, tn[0], tn[1], tn[2], e.ghost ? 0.35 : 0);
  }
  seaShadow(e.x, e.z, e.ride === 'raft' ? 1.25 : 0.75, e.ride === 'raft' ? 1.6 : 2.1, -e.yaw, (e.ghost ? 0.3 : 0.6) * (1 - dead));
  pushDecal(e.x, e.z, e.radius * 1.6, e.radius * 1.6, 0, 3, 0, 0.5, 1, 1, 1, 0.4, true);
  emitMiniCrown({ ...e, y: deck + bob });
  if (Math.hypot(e.vx, e.vz) > 1 && Math.random() < 0.4) pushDecal(e.x - e.vx * 0.12, e.z - e.vz * 0.12, 0.5, 0.4, 0, 0, Math.random() * 10, 0, 0.95, 0.99, 1, 0.4);
  return true;
};
