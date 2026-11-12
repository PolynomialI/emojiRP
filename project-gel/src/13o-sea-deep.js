// ============================================================
// Ocean chapters 11-20, after the Pirate King: myths and wonders. Each has its own crowd (new swimmers below),
// islands (04o-sea-deep-models.js), weather and light (SEA_CHAPTERS in 13k-ocean.js), a miniboss, a boss
// (13p-sea-deep-bosses.js), and a mechanic of its own that runs through the whole chapter:
//   11 Glowtide Lagoon   night water that glows; glowing jellyfish sting the hull
//   12 Sargasso Snarl    drifting weed mats grip the ship; weed-tangled boarders weigh it down
//   13 Maelstrom Reach   whirlpools drag the ship round and in
//   14 Sunken Atlantis   marble columns burst up out of the sea; merfolk throw tridents
//   15 Soda Sea          fizz geysers erupt; gummy bears split in two
//   16 Bermuda Triangle  warp rifts throw the ship elsewhere; lost pilots blink about
//   17 Sky Sea           wind lanes shove the ship; balloon pirates drop bombs from above
//   18 Leviathan Trench  a vast shadow passes beneath and breaches; anglerfish lunge
//   19 Davy Jones' Locker cursed ghost-fire burns on the water; skeletons pull themselves back together
//   20 World's Edge      a bit of everything, and a current toward the edge of the world
// ============================================================
Object.assign(ENEMY_TYPES, {
  pjelly: { model: 'pjelly', hp: 12, speed: 1.3, dmg: 4, xp: 2, radius: 0.5, scale: 1.3, tint: '#5affd8', mass: 0.8, sea: true, onTouch: e => seaJellySting(e) },
  pweed: { model: 'pweed', hp: 20, speed: 1.8, dmg: 5, xp: 2, radius: 0.46, scale: 1.3, tint: '#4a7a2a', mass: 1.4, sea: true, weedy: true },
  pmer: { model: 'pmer', hp: 18, speed: 2.4, dmg: 6, xp: 3, radius: 0.45, scale: 1.3, tint: '#2ac8b0', mass: 1.2, sea: true },
  pgummy: { model: 'pgummy', hp: 16, speed: 2.0, dmg: 5, xp: 2, radius: 0.48, scale: 1.3, tint: '#ff4a7a', mass: 1.1, sea: true, onKill: e => seaGummySplit(e) },
  pblink: { model: 'pblink', hp: 14, speed: 2.2, dmg: 5, xp: 2, radius: 0.42, scale: 1.25, tint: '#7a5a3a', mass: 1, sea: true },
  pballoon: { model: 'pballoon', hp: 14, speed: 2.1, dmg: 6, xp: 3, radius: 0.5, scale: 1.3, tint: '#ff8a3a', mass: 1, sea: true },
  pangler: { model: 'pangler', hp: 13, speed: 2.5, dmg: 6, xp: 2, radius: 0.5, scale: 1.4, tint: '#2a3a5a', mass: 1, sea: true },
  pskel: { model: 'pskel', hp: 14, speed: 2.1, dmg: 5, xp: 2, radius: 0.42, scale: 1.25, tint: '#9a2a2a', mass: 1, sea: true, onKill: e => seaSkelCollapse(e) },
});

// crowds, islands, mechanic and miniboss for oceans 11-20 (mix: [type, from second, weight])
const SEA_DEEP_THEMES = [
  { mech: 'glow', isles: ['iglow'], fogK: 0.8, mix: [['pjelly', 0, 1], ['pswim', 0, 0.7], ['pdiver', 30, 0.45], ['phat', 60, 0.35], ['pangler', 110, 0.3]],
    mini: { name: 'Lantern Lou', ride: 'canoe', tint: '#3affd0', atk: ['ram', 'volley', 'call'] } },
  { mech: 'weed', isles: ['iweed'], current: 0.25, mix: [['pweed', 0, 1], ['pswim', 0, 0.6], ['phat', 30, 0.35], ['pbomb', 70, 0.25], ['ptube', 110, 0.3]],
    mini: { name: 'Bogwater Bess', ride: 'raft', tint: '#6a8a3a', atk: ['bombs', 'ram', 'call'] } },
  { mech: 'whirl', isles: ['istack'], current: 0.6, mix: [['pswim', 0, 1], ['phat', 0, 0.45], ['pfloat', 30, 0.35], ['pbomb', 60, 0.3], ['pdiver', 90, 0.35]],
    mini: { name: 'Captain Spindrift', ride: 'canoe', tint: '#4a8a9a', atk: ['ram', 'volley', 'bombs'] } },
  { mech: 'pillar', isles: ['iruin'], mix: [['pmer', 0, 1], ['pswim', 0, 0.7], ['pdiver', 30, 0.45], ['phat', 60, 0.35], ['ptube', 90, 0.3]],
    mini: { name: 'Sentinel Thalos', ride: 'canoe', tint: '#e8b84a', atk: ['volley', 'ram', 'call'] } },
  { mech: 'fizz', isles: ['icandy'], mix: [['pgummy', 0, 1], ['pswim', 0, 0.6], ['pfloat', 30, 0.4], ['pbomb', 60, 0.3], ['ptube', 90, 0.4]],
    mini: { name: 'Licorice Lars', ride: 'raft', tint: '#ff5aa8', atk: ['bombs', 'call', 'ram'] } },
  { mech: 'rift', isles: ['itri'], fogK: 0.65, current: 0.4, mix: [['pblink', 0, 1], ['pswim', 0, 0.7], ['phat', 30, 0.4], ['pdiver', 60, 0.4], ['pbomb', 90, 0.3]],
    mini: { name: 'Navigator Null', ride: 'canoe', tint: '#3affa8', ghost: true, atk: ['ram', 'call', 'volley'] } },
  { mech: 'gust', isles: ['isky'], mix: [['pballoon', 0, 1], ['pswim', 0, 0.7], ['pfloat', 20, 0.4], ['phat', 60, 0.35], ['ptube', 90, 0.3]],
    mini: { name: 'Sky Admiral Zephyr', ride: 'canoe', tint: '#8ab8ff', atk: ['bombs', 'volley', 'ram'] } },
  { mech: 'shadow', isles: ['ibones'], fogK: 0.72, current: 0.5, mix: [['pangler', 0, 1], ['pswim', 0, 0.7], ['pdiver', 0, 0.5], ['phat', 40, 0.4], ['pbomb', 80, 0.3]],
    mini: { name: 'Abyssal Ahab', ride: 'canoe', tint: '#2a4a8a', atk: ['ram', 'call', 'bombs'] } },
  { mech: 'gfire', isles: ['ilocker'], fogK: 0.6, mix: [['pskel', 0, 1], ['pghost', 0, 0.6], ['phat', 20, 0.4], ['pdiver', 50, 0.4], ['pbomb', 80, 0.3]],
    mini: { name: 'Bosun Bones', ride: 'raft', tint: '#d8d8c0', ghost: true, atk: ['call', 'ram', 'volley'] } },
  { mech: 'edge', isles: ['iedge', 'iruin'], current: 0.7, zap: true, mix: [['pswim', 0, 1], ['phat', 20, 0.6], ['pmer', 40, 0.45], ['pskel', 50, 0.45], ['pjelly', 60, 0.35], ['pgummy', 80, 0.35], ['pangler', 100, 0.35], ['pballoon', 120, 0.3], ['pweed', 140, 0.3]],
    mini: { name: 'Herald Triton', ride: 'canoe', tint: '#ffd34a', atk: ['volley', 'ram', 'bombs', 'call'] } },
];
SEA_DEEP_THEMES.forEach((T, i) => Object.assign(SEA_CHAPTERS[10 + i], T));
// (the bosses come from 13p-sea-deep-bosses.js; until then, borrow)
SEA_CHAPTERS.forEach(C => { if (!C.boss) C.boss = 'sking'; });
// the hazards this file runs and draws (the generic hazard code leaves them alone)
SEA_HZ_LIVE.push('whirl', 'pillar', 'geyser', 'rift', 'gust', 'lev', 'breach', 'gfire', 'bones');
const seaDmg = k => k * G.run.info.dmgMul;

// ---------- the new swimmers ----------
// glowing jellyfish drift in and sting the hull, then burst (rammed hard, they just burst)
function seaJellySting(e) {
  if (e.dying || OC.sink) return;
  hurtHero(e.dmg, e.x, e.z);
  addBolt(e.x, 0.6, e.z, OC.ship.x, 0.8, OC.ship.z, 0.08, [0.5, 1, 0.9]);
  FX.burst(e.x, 0.4, e.z, 14, [0.5, 1, 0.9], 4, 0.08, 0.4, 1, 1); AUDIO.play('zap', 1.2);
  e.hp = 0; killEnemy(e);
}
SEA_AI.pjelly = (e, dt) => { e.sp0 = e.sp0 ?? e.speed; e.speed = e.sp0 * (0.7 + 0.5 * Math.max(0, Math.sin(OC.t * 2.2 + e.bobPh))); return false; };
SEA_DRAW.pjelly = e => seaDrawOwn(e, 'jpulse', -0.12, 0.6, [0.35, 1, 0.85]);
// weed-tangled swimmers: aboard, they weigh the ship down (counted in seaDeepTick)
// merfolk hold off at a throwing range and hurl golden tridents
SEA_AI.pmer = (e, dt) => {
  if (e.grab) return false;
  const S = OC.ship, d = hullDist(e.x, e.z);
  e.throwT = (e.throwT ?? rand(0.6, 2)) - dt; e.actT = (e.actT || 0) - dt;
  if (d > 9.5 || d < 3.2 || e.stun > 0 || e.netT > 0) { if (e.actT <= 0) e.act = null; return false; }
  e.vx *= 0.9; e.vz *= 0.9; e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt; e.kx *= 0.9; e.kz *= 0.9;
  e.yaw = angleLerp(e.yaw, Math.atan2(S.x - e.x, S.z - e.z), Math.min(1, dt * 5));
  e.phase += dt * 0.6;
  if (e.throwT <= 0 && !OC.sink) {
    e.throwT = rand(4, 5.5); e.actT = 0.5;
    const tx = S.x + S.vx * 0.5, tz = S.z + S.vz * 0.5, dx = tx - e.x, dz = tz - e.z, l = Math.hypot(dx, dz) || 1;
    OC.hz.push({ k: 'ball', trident: true, x: e.x, y: 0.9, z: e.z, vx: dx / l * 11, vz: dz / l * 11, life: 1.6, dmg: e.dmg * 0.7 });
    AUDIO.play('throw');
  }
  e.act = e.actT > 0 ? { clip: 'throw', u: clamp(1 - e.actT / 0.5, 0, 0.999) } : null;
  return true;
};
// gummy bears split in two when sunk (the halves don't)
function seaGummySplit(e) {
  if (e.half || !G.run || !G.run.sea) return;
  for (const s of [-1, 1]) {
    const o = seaFoe('pgummy', e.x + s * 0.5, e.z - s * 0.3);
    o.half = true; o.scale *= 0.68; o.radius *= 0.7; o.hp = o.maxHp = e.maxHp * 0.4; o.xp = 1; o.tint = e.tint.slice(); o.spawnT = 0.25;
    o.kx = s * 3; o.kz = -s * 2;
  }
  FX.burst(e.x, 0.6, e.z, 12, e.tint, 4, 0.1, 0.4, 1, 1); AUDIO.play('boing');
}
SEA_DRAW.pgummy = e => seaDrawOwn(e, 'gbob', -0.36, 0);
// lost pilots blink: every few seconds they vanish and reappear a few metres closer
SEA_AI.pblink = (e, dt) => {
  if (e.grab) return false;
  e.blinkT = (e.blinkT ?? rand(1.5, 3.5)) - dt;
  if (e.blinkT <= 0) {
    e.blinkT = rand(2.6, 4);
    const d = hullDist(e.x, e.z);
    if (d > 3.5 && d < 22) {
      const S = OC.ship, dx = S.x - e.x, dz = S.z - e.z, l = Math.hypot(dx, dz) || 1, j = Math.min(4.5, d - 2.2);
      FX.ring(e.x, e.z, 0.8, [0.5, 1, 0.8], 0.3, 0.6); FX.burst(e.x, 0.5, e.z, 8, [0.5, 1, 0.8], 3, 0.06, 0.3, 1, 1);
      e.x += dx / l * j + rand(-1, 1); e.z += dz / l * j + rand(-1, 1);
      FX.ring(e.x, e.z, 0.8, [0.5, 1, 0.8], 0.3, 0.6); AUDIO.play('ghost', 1.6);
    }
  }
  return false;
};
// balloon pirates float over the water: they hang off to the side of the ship and drop bombs on it; only shot down
SEA_AI.pballoon = (e, dt) => {
  const S = OC.ship, D = shipDef();
  e.y = 2.3 + Math.sin(OC.t * 1.3 + e.bobPh) * 0.15;
  e.side = e.side ?? (Math.random() < 0.5 ? -1 : 1);
  const a = Math.atan2(e.x - S.x, e.z - S.z) + e.side * 0.25 * dt, r = D.len * 0.5 + 3.2;
  const tx = S.x + Math.sin(a) * r, tz = S.z + Math.cos(a) * r, dx = tx - e.x, dz = tz - e.z, l = Math.hypot(dx, dz) || 1, sp = Math.min(e.speed * e.slowMul, l * 2);
  e.vx += (dx / l * sp - e.vx) * Math.min(1, dt * 1.5); e.vz += (dz / l * sp - e.vz) * Math.min(1, dt * 1.5);
  e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt; e.kx *= 0.95; e.kz *= 0.95;
  e.yaw = angleLerp(e.yaw, Math.atan2(S.x - e.x, S.z - e.z), Math.min(1, dt * 2));
  e.phase += dt * 0.5;
  e.bombT = (e.bombT ?? rand(2, 4)) - dt;
  if (e.bombT <= 0 && l < 4 && !OC.sink) {
    e.bombT = rand(4, 5.5);
    OC.hz.push({ k: 'lob', sx: e.x, sy: e.y - 0.3, sz: e.z, tx: S.x + S.vx * 0.9, tz: S.z + S.vz * 0.9, x: e.x, y: e.y, z: e.z, t: 0, dur: 1.0, r: 1.3, dmg: e.dmg, col: [1, 0.6, 0.25] });
    AUDIO.play('throw', 0.8);
  }
  return true;
};
SEA_DRAW.pballoon = e => {
  if (!R.enemyDraw.pballoon) return true;
  const M = MODELS.defs.pballoon, c = M.clips.hang, dead = e.dying ? clamp(e.dying, 0, 1) : 0, appear = e.spawnT > 0 ? 1 - e.spawnT / 0.5 : 1;
  const y = (e.y || 2.3) - dead * 2.3;
  pushEnemy('pballoon', e.elite, e.x, y, e.z, e.yaw, c.row + Math.floor((e.phase % 1) * c.frames), e.scale * clamp(appear, 0.2, 1), e.squash, dead, e.flash > 0 ? 0.85 : 0, e.auraTint || 0, e.tint[0], e.tint[1], e.tint[2]);
  pushDecal(e.x + 0.25, e.z - 0.2, 0.55, 0.55, 0, 1, 0, 0, SEA_SH[0], SEA_SH[1], SEA_SH[2], 0.45 * (1 - dead));
  return true;
};
// anglerfish swim in and every so often lunge at the hull, bite and bounce off
SEA_AI.pangler = (e, dt) => {
  if (e.lungeT > 0) {
    e.lungeT -= dt;
    e.x += e.vx * dt; e.z += e.vz * dt;
    const n = [0, 0];
    if (hullDist(e.x, e.z, n) < e.radius * 0.6) {
      if (!OC.sink) { hurtHero(e.dmg, e.x, e.z); AUDIO.play('chop'); FX.burst(e.x, 0.5, e.z, 8, [0.85, 0.95, 1], 3, 0.08, 0.35, 2, 1); }
      e.lungeT = 0; e.vx = n[0] * 5; e.vz = n[1] * 5; e.stun = 0.8;
    }
    return true;
  }
  e.lungeCd = (e.lungeCd ?? rand(1, 3)) - dt;
  const d = hullDist(e.x, e.z);
  if (e.lungeCd <= 0 && d < 6 && d > 1.2 && !e.grab && e.stun <= 0) {
    e.lungeCd = rand(3.2, 4.4); e.lungeT = 0.45;
    const S = OC.ship, dx = S.x - e.x, dz = S.z - e.z, l = Math.hypot(dx, dz) || 1;
    e.vx = dx / l * 13; e.vz = dz / l * 13; e.yaw = Math.atan2(dx, dz);
    seaSplash(e.x, e.z, 0.5); AUDIO.play('splash', 1.3);
    return true;
  }
  return false;
};
SEA_DRAW.pangler = e => {
  const r = seaDrawOwn(e, 'aswim', -0.28, 0.55, [0.9, 1, 0.5]);
  if (e.lungeT > 0 && Math.random() < 0.7) pushDecal(e.x - e.vx * 0.05, e.z - e.vz * 0.05, 0.5, 0.4, 0, 0, Math.random() * 10, 0, 0.95, 0.99, 1, 0.45);
  return r;
};
// skeletons collapse into a pile of bones and pull themselves back together once
function seaSkelCollapse(e) {
  if (e.rebuilt || !G.run || !G.run.sea || OC.sink) return;
  OC.hz.push({ k: 'bones', x: e.x, z: e.z, t: 0, dur: 2.4, hp: e.maxHp * 0.6, tint: e.tint.slice(), elite: e.elite });
  FX.burst(e.x, 0.5, e.z, 14, [0.95, 0.92, 0.85], 4, 0.07, 0.4, 1, 1); AUDIO.play('crumble', 1.3);
}
// a swimmer drawn with its own clip (not the goo pirates' paddle): y its height in the water (of its scale),
// glow: a light under it in the water (col)
function seaDrawOwn(e, clip, y, glow, col) {
  if (!R.enemyDraw[e.model]) return true;
  const M = MODELS.defs[e.model], c = M.clips[clip], t = OC.t, dead = e.dying ? clamp(e.dying, 0, 1) : 0, appear = e.spawnT > 0 ? 1 - e.spawnT / 0.5 : 1;
  const bob = Math.sin(t * 2.4 + e.bobPh) * 0.04 * e.scale, sc = e.scale * clamp(appear, 0.2, 1);
  seaShadow(e.x, e.z, e.radius * 1.4, e.radius * 1.8, -e.yaw, 0.6 * (1 - dead) * clamp(appear, 0, 1));
  pushEnemy(e.model, e.elite, e.x, y * e.scale + bob - dead * 0.6 * e.scale, e.z, e.yaw, c.row + Math.floor((e.phase - Math.floor(e.phase)) * c.frames), sc, e.squash, dead, e.flash > 0 ? 0.85 : 0, e.auraTint || 0, e.tint[0], e.tint[1], e.tint[2]);
  if (glow) pushDecal(e.x, e.z, e.radius * 2.2, e.radius * 2.2, 0, 1, 0, 0, col[0], col[1], col[2], glow * (1 - dead) * (0.75 + 0.25 * Math.sin(t * 3 + e.bobPh)), true);
  const rr = e.radius * 1.15 * (1 + 0.05 * Math.sin(t * 3 + e.bobPh));
  pushDecal(e.x, e.z, rr, rr, 0, 3, 0, 0.5, 1, 1, 1, 0.42 * (1 - dead), true);
  return true;
}

// ---------- each chapter's mechanic ----------
// (ahead of the ship: where its hazards land, so you have to steer round them)
function seaAhead(dist, spread) {
  const S = OC.ship, sp = Math.hypot(S.vx, S.vz), a = sp > 1 ? Math.atan2(S.vx, S.vz) + rand(-spread, spread) : rand(0, TAU), d = (sp > 1 ? dist : dist * 0.5) + rand(-2, 2);
  return [S.x + Math.sin(a) * d, S.z + Math.cos(a) * d];
}
const DEEP_SPAWN = {
  weed() { for (let i = 0; i < 2; i++) { const [x, z] = seaAhead(9, 0.9); if (!inIsle(x, z, 2)) OC.hz.push({ k: 'snare', weed: true, x, z, t: 0, life: 13, r: rand(2.0, 2.8) }); } return rand(4.5, 7); },
  whirl() { const [x, z] = seaAhead(11, 0.7); if (!inIsle(x, z, 4)) { OC.hz.push({ k: 'whirl', x, z, t: 0, life: 15, r: 4.2, tick: 0 }); AUDIO.play('wind', 0.6); } return rand(8, 12); },
  pillar() { const [x, z] = seaAhead(7, 0.8); if (!inIsle(x, z, 2)) OC.hz.push({ k: 'pillar', x, z, t: 0, dur: 1.5, r: 1.7 }); return rand(3.5, 5.5); },
  fizz() { for (let i = 0; i < 2; i++) { const [x, z] = seaAhead(6 + i * 3, 1.0); OC.hz.push({ k: 'geyser', x, z, t: -i * 0.4, dur: 1.3, r: 1.9 }); } return rand(3.5, 5); },
  rift() { const n = OC.hz.filter(h => h.k === 'rift').length; if (n < 3) { const [x, z] = seaAhead(12, 1.2); if (!inIsle(x, z, 3)) OC.hz.push({ k: 'rift', x, z, t: 0, life: 16, r: 1.7, seed: rand(0, 6) }); } return rand(3, 5); },
  gust() { const S = OC.ship, a = rand(0, TAU), [x, z] = seaAhead(4, 0.5); OC.hz.push({ k: 'gust', x, z, rot: a, len: 18, w: 4.5, t: 0, tele: 1.1, dur: 3.2 }); return rand(6, 9); },
  shadow() { const S = OC.ship, a = rand(0, TAU), r = 26; OC.hz.push({ k: 'lev', x: S.x - Math.sin(a) * r, z: S.z - Math.cos(a) * r, vx: Math.sin(a) * 8, vz: Math.cos(a) * 8, t: 0, life: 7, yaw: a, hit: false }); AUDIO.play('rumble', 0.5); return rand(15, 21); },
  gfire() { for (let i = 0; i < 2; i++) { const [x, z] = seaAhead(8 + i * 3, 1.0); if (!inIsle(x, z, 2)) OC.hz.push({ k: 'gfire', x, z, t: 0, life: 9, r: rand(1.8, 2.4), tick: 0 }); } return rand(4, 6); },
  edge() { return DEEP_SPAWN[pick(['whirl', 'pillar', 'fizz', 'gust'])]() * 0.7; },
};
function seaDeepTick(dt) {
  const run = G.run, S = OC.ship, C = seaTheme(), D = shipDef();
  if (!C.mech || OC.sink) return;
  const live = G.state === 'run';
  // the chapter's hazards come along every so often (after the first ten seconds)
  // (sparser early on: half again as long between them at the start, normal after two and a half minutes)
  if (live && run.t > 15 && DEEP_SPAWN[C.mech]) { OC.mechT = (OC.mechT ?? 2) - dt; if (OC.mechT <= 0) OC.mechT = DEEP_SPAWN[C.mech]() * (1.5 - 0.5 * Math.min(1, run.t / 150)); }
  // weed-tangled boarders weigh the ship down
  let weedy = 0;
  for (const e of run.enemies) if (e.grab && e.def.weedy && !e.dying) weedy++;
  if (weedy) OC.snared = Math.max(OC.snared || 0, Math.min(0.5, weedy * 0.08));
  for (const h of OC.hz) {
    if (h.k === 'whirl') {
      h.t += dt; if (h.t > h.life) h.dead = true;
      const grow = clamp(h.t / 1.5, 0, 1) * clamp((h.life - h.t) / 1.5, 0, 1), R2 = h.r * 1.7 * grow;
      const dx = h.x - S.x, dz = h.z - S.z, d = Math.hypot(dx, dz) || 1;
      if (d < R2 + D.len * 0.3) {
        // dragged round and in, and spun
        const k = (1 - d / (R2 + D.len * 0.3)) * grow;
        S.vx += (dx / d * 3.2 + dz / d * 4.5) * k * dt; S.vz += (dz / d * 3.2 - dx / d * 4.5) * k * dt;
        S.yaw += 0.9 * k * dt;
        if (d < h.r * 0.45 && (h.tick -= dt) <= 0) { h.tick = 0.7; hurtHero(seaDmg(3), h.x, h.z); AUDIO.play('splash', 0.7); }
      }
      enemiesInRadius(h.x, h.z, R2, e => { if (!e.boss && !e.grab && !e.y) { const ex = h.x - e.x, ez = h.z - e.z, ed = Math.hypot(ex, ez) || 1; e.kx += (ex / ed * 2 + ez / ed * 3) * dt * 3; e.kz += (ez / ed * 2 - ex / ed * 3) * dt * 3; } });
      if (Math.random() < dt * 20 * grow) { const a = rand(0, TAU), rr = rand(0.5, R2); FX.part(h.x + Math.cos(a) * rr, 0.1, h.z + Math.sin(a) * rr, -Math.sin(a) * 4, 0.3, Math.cos(a) * 4, 0.12, 0.04, 0.5, [0.92, 0.97, 1], 0.9, 2, 0); }
    } else if (h.k === 'pillar') {
      h.t += dt;
      if (!h.done && h.t >= h.dur) {
        h.done = true; h.dead = true;
        if (hullDist(h.x, h.z) < h.r) { hurtHero(seaDmg(6), h.x, h.z); const n = [0, 0]; hullDist(h.x, h.z, n); S.vx -= n[0] * 6; S.vz -= n[1] * 6; G.cam.shake = Math.max(G.cam.shake, 0.25); }
        enemiesInRadius(h.x, h.z, h.r, e => { if (!e.boss) hurtEnemy(e, 60, 0, 0, { sound: false }); });
        if (hullDist(h.x, h.z) > h.r * 0.6) {
          const I = { x: h.x, z: h.z, r: h.r, kind: 'icol', yaw: rand(0, TAU), key: 'col' + Math.random(), deco: [], floe: 9, rise: 0, ob: { x: h.x, z: h.z, r: h.r * 0.9, shape: 'circle', shots: false, isle: true } };
          OC.isles.push(I); ARENA.obstacles = OC.isles.map(J => J.ob);
        }
        seaSplash(h.x, h.z, h.r * 1.2); FX.burst(h.x, 1, h.z, 20, [0.95, 0.95, 0.9], 6, 0.12, 0.6, 2, 3); AUDIO.play('crumble'); AUDIO.play('splash');
      }
    } else if (h.k === 'geyser') {
      h.t += dt;
      if (h.t >= 0 && !h.done && h.t >= h.dur) {
        h.done = true; h.end = h.t + 0.9;
        if (hullDist(h.x, h.z) < h.r) { hurtHero(seaDmg(5), h.x, h.z); S.speed *= 0.3; G.cam.shake = Math.max(G.cam.shake, 0.2); }
        enemiesInRadius(h.x, h.z, h.r, e => { if (!e.boss) hurtEnemy(e, 40, 0, 0, { sound: false }); });
        AUDIO.play('splash'); AUDIO.play('pop', 0.7);
      }
      if (h.done) {
        for (let i = 0; i < 3; i++) FX.part(h.x + rand(-0.5, 0.5), rand(0.2, 1), h.z + rand(-0.5, 0.5), rand(-1.5, 1.5), rand(6, 11), rand(-1.5, 1.5), rand(0.12, 0.25), 0.05, 0.9, i % 2 ? [1, 0.75, 0.9] : [1, 0.97, 1], 0.95, 2, -9);
        if (h.t > h.end) h.dead = true;
      }
    } else if (h.k === 'rift') {
      h.t += dt; if (h.t > h.life) h.dead = true;
      const S2 = OC.ship;
      if (h.t > 0.6 && Math.hypot(S2.x - h.x, S2.z - h.z) < h.r + 0.6) {
        // through the rift: thrown some way off, wherever is clear
        h.dead = true;
        let nx = S2.x, nz = S2.z;
        for (let i = 0; i < 10; i++) { const a = rand(0, TAU), d = rand(12, 18), x = S2.x + Math.sin(a) * d, z = S2.z + Math.cos(a) * d; if (!inIsle(x, z, D.len * 0.6 + 1)) { nx = x; nz = z; break; } }
        FX.ring(S2.x, S2.z, D.len, [0.5, 1, 0.8], 0.5, 1); FX.burst(S2.x, 1, S2.z, 24, [0.5, 1, 0.8], 6, 0.1, 0.5, 1, 2);
        S2.x = nx; S2.z = nz; G.cam.x = nx; G.cam.z = nz;
        FX.ring(nx, nz, D.len, [0.5, 1, 0.8], 0.5, 1); R.frame.flashW = Math.max(R.frame.flashW, 0.4); AUDIO.play('ghost'); AUDIO.play('zap', 0.6);
      }
    } else if (h.k === 'gust') {
      h.t += dt; if (h.t > h.tele + h.dur) h.dead = true;
      if (h.t > h.tele) {
        const fx = Math.sin(h.rot), fz = Math.cos(h.rot), on = (x, z) => { const ox = x - h.x, oz = z - h.z, al = ox * fx + oz * fz; return Math.abs(al) < h.len / 2 && Math.abs(ox * fz - oz * fx) < h.w / 2; };
        if (on(S.x, S.z)) { S.vx += fx * 9 * dt; S.vz += fz * 9 * dt; }
        for (const e of run.enemies) if (!e.boss && !e.grab && on(e.x, e.z)) { e.kx += fx * 12 * dt; e.kz += fz * 12 * dt; }
        if (Math.random() < 0.8) { const u = rand(-0.5, 0.5) * h.len, v = rand(-0.5, 0.5) * h.w; FX.part(h.x + fx * u + fz * v, rand(0.3, 1.6), h.z + fz * u - fx * v, fx * 14, 0, fz * 14, 0.05, 0.4, 0.35, [1, 1, 1], 0.6, 1, 0, 0); }
      }
    } else if (h.k === 'lev') {
      // the leviathan's shadow glides under; when it is under the ship it marks a circle and breaches
      h.t += dt; h.x += h.vx * dt; h.z += h.vz * dt; if (h.t > h.life) h.dead = true;
      if (!h.hit && Math.hypot(h.x - S.x, h.z - S.z) < 4) { h.hit = true; OC.hz.push({ k: 'breach', x: S.x + S.vx * 0.6, z: S.z + S.vz * 0.6, t: 0, dur: 1.3, r: 3.2 }); AUDIO.play('rumble'); }
    } else if (h.k === 'breach') {
      h.t += dt;
      if (!h.done && h.t >= h.dur) {
        h.done = true; h.end = h.t + 1.2;
        if (hullDist(h.x, h.z) < h.r) { hurtHero(seaDmg(10), h.x, h.z); S.speed *= 0.4; G.cam.shake = Math.max(G.cam.shake, 0.45); }
        enemiesInRadius(h.x, h.z, h.r, e => { if (!e.boss) hurtEnemy(e, 80, 0, 0, { sound: false }); });
        seaSplash(h.x, h.z, h.r * 1.4); FX.ring(h.x, h.z, h.r * 1.6, [0.85, 0.95, 1], 0.6, 1); AUDIO.play('splash'); AUDIO.play('roar', 0.6);
      }
      if (h.done && h.t > h.end) h.dead = true;
    } else if (h.k === 'gfire') {
      h.t += dt; if (h.t > h.life) h.dead = true;
      if (hullDist(h.x, h.z) < h.r * 0.8 && (h.tick -= dt) <= 0) { h.tick = 0.7; hurtHero(seaDmg(2.5), h.x, h.z); }
      if (Math.random() < 0.6) FX.part(h.x + rand(-h.r, h.r) * 0.7, 0.15, h.z + rand(-h.r, h.r) * 0.7, 0, rand(1.5, 3), 0, rand(0.15, 0.3), 0.05, 0.6, [0.4, 1, 0.55], 1, 0);
    } else if (h.k === 'bones') {
      h.t += dt;
      if (h.t >= h.dur) { h.dead = true; const o = seaFoe('pskel', h.x, h.z, { elite: h.elite }); o.rebuilt = true; o.hp = o.maxHp = h.hp; o.tint = h.tint; o.spawnT = 0.4; FX.burst(h.x, 0.5, h.z, 10, [0.95, 0.92, 0.85], 3, 0.07, 0.35, 1, 1); AUDIO.play('crumble', 1.6); }
    }
  }
  // the Atlantis columns rise and sink again
  for (const I of OC.isles) if (I.rise !== undefined) I.rise = I.floe < 1 ? Math.max(0, I.floe) : Math.min(1, I.rise + dt * 2.5);
  // the World's Edge pulls toward the edge (north-east), whatever the weather
  if (C.mech === 'edge') { S.x += 0.35 * dt; S.z -= 0.35 * dt; }
}
function emitSeaDeep() {
  const C = seaTheme(), t = OC.t;
  if (!C.mech) return;
  // glowing water: the wake and everything moving through it lights up
  if (C.vt === 1) for (const w of OC.wake) { const u = w.t / 1.7, r = (0.5 + u * 0.6) * w.w; pushDecal(w.x, w.z, r, r, w.seed, 1, 0, 0, 0.25, 1, 0.8, (1 - u) * 0.35 * w.k, true); }
  for (const h of OC.hz) {
    if (h.k === 'whirl') { const grow = clamp(h.t / 1.5, 0, 1) * clamp((h.life - h.t) / 1.5, 0, 1); pushDecal(h.x, h.z, h.r * 1.7 * grow, h.r * 1.7 * grow, 0, 13, h.x, 0, SEA_SH[0] * 2, SEA_SH[1] * 2, SEA_SH[2] * 2, 0.95); }
    else if (h.k === 'pillar') pushDecal(h.x, h.z, h.r, h.r, 0, 4, 0, clamp(h.t / h.dur, 0, 1), 1, 0.85, 0.4, 0.9);
    else if (h.k === 'geyser') { if (h.t >= 0 && !h.done) pushDecal(h.x, h.z, h.r, h.r, 0, 4, 0, clamp(h.t / h.dur, 0, 1), 1, 0.45, 0.75, 0.9); if (h.done) pushDecal(h.x, h.z, h.r * 1.2, h.r * 1.2, 0, 3, 0, clamp((h.t - h.dur) / 0.9, 0, 1), 1, 0.85, 0.95, 0.6, true); }
    else if (h.k === 'rift') { const a = clamp(Math.min(h.t * 2, h.life - h.t), 0, 1); pushDecal(h.x, h.z, h.r, h.r, 0, 14, h.seed, 0, 0.45, 1, 0.75, a, true); if (Math.random() < 0.3) FX.part(h.x + rand(-1, 1), 0.2, h.z + rand(-1, 1), 0, rand(0.6, 1.4), 0, 0.08, 0.03, 0.6, [0.5, 1, 0.8], 1, 3); }
    else if (h.k === 'gust') { const a = h.t < h.tele ? 0.5 + 0.4 * Math.sin(h.t * 18) : 0.8 * clamp((h.tele + h.dur - h.t) * 2, 0, 1); pushDecal(h.x, h.z, h.w / 2, h.len / 2, -h.rot, 11, 0, 0, 0.92, 0.97, 1, a, true); }
    else if (h.k === 'lev') { const a = clamp(Math.min(h.t, h.life - h.t), 0, 1); seaShadow(h.x, h.z, 3.2, 13, -h.yaw, 0.75 * a, 0.02); seaShadow(h.x - Math.sin(h.yaw) * 9, h.z - Math.cos(h.yaw) * 9, 1.4, 5, -h.yaw, 0.6 * a, 0.02); }
    else if (h.k === 'breach') {
      if (!h.done) { pushDecal(h.x, h.z, h.r, h.r, 0, 4, 0, clamp(h.t / h.dur, 0, 1), 1, 0.22, 0.18, 0.9); seaShadow(h.x, h.z, h.r * 0.9, h.r * 0.9, 0, 0.7 * clamp(h.t / h.dur, 0, 1)); }
      else {
        // the leviathan's head bursting up through the water and sinking back
        const up = clamp((h.t - h.dur) * 3, 0, 1) * clamp((h.end - h.t) * 2, 0, 1), pts = [];
        for (let i = 0; i < 6; i++) { const v = i / 5; pts.push(h.x + v * 0.6, -0.6 + v * 5 * up, h.z + Math.sin(v * 2) * 0.4); }
        R.ribStrip(pts, 6, h.r * 0.8, [0.18, 0.24, 0.34, 1], 1, 0, 1, u2 => 1 - u2 * 0.55);
      }
    }
    else if (h.k === 'gfire') { const a = clamp(Math.min(h.t * 2, h.life - h.t), 0, 1); pushDecal(h.x, h.z, h.r, h.r, h.t * 0.2, 2, h.x, 0, 0.3, 1, 0.5, 0.55 * a, true); }
    else if (h.k === 'bones') { pushDecal(h.x, h.z, 0.7, 0.7, 0, 3, 0, h.t / h.dur % 1, 0.95, 0.92, 0.85, 0.6, true); }
    else if (h.k === 'ball' && h.trident) { const l = Math.hypot(h.vx, h.vz) || 1, ux = h.vx / l, uz = h.vz / l; R.ribStrip([h.x - ux * 0.5, h.y, h.z - uz * 0.5, h.x + ux * 0.4, h.y, h.z + uz * 0.4], 2, 0.06, [1, 0.82, 0.3, 1], 1, 0, 1); FX.glow(h.x, h.y, h.z, 0.4, [1, 0.85, 0.4], 0.04, 0.5); }
  }
  // the islands' own light: glowing mushrooms, ghost lanterns, the lighthouse
  for (const I of OC.isles) {
    if (!onScreen(I.x, I.z, I.r + 2)) continue;
    if (I.kind === 'iglow') pushDecal(I.x, I.z, I.r * 1.5, I.r * 1.5, 0, 1, 0, 0, 0.3, 1, 0.85, 0.22 + 0.05 * Math.sin(t * 1.5 + I.x), true);
    else if (I.kind === 'ilocker') pushDecal(I.x, I.z, I.r * 1.4, I.r * 1.4, 0, 1, 0, 0, 0.35, 1, 0.5, 0.16, true);
    else if (I.kind === 'iedge' && Math.random() < 0.2) FX.part(I.x + rand(-I.r, I.r), rand(0.5, 2.5), I.z + rand(-I.r, I.r), 0, 0.5, 0, 0.08, 0.03, 0.9, [1, 0.9, 0.5], 1, 3);
  }
}
