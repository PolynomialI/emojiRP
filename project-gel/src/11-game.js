// ============================================================
// Game state, runs, spawning, combat, pickups, camera
// ============================================================
const G = {
  state: 'loading', stateT: 0,
  hero: null, run: null, save: null,
  cam: { x: 0, z: 0, vx: 0, vz: 0, shake: 0, eye: [0, 10, 10], target: [0, 0, 0], dist: 18 },
  input: { x: 0, z: 0 },
  numbers: [], bolts: [],
  timeScale: 1,
  homeTap: 0,
};
const ORANGE = [0.95, 0.53, 0.13];
const HERO_R = 0.42;
const HERO_PT = { x: 0, z: 0 };

// ---------- spatial hash over enemies ----------
const GRID = { cell: 2, map: new Map() };
const gkey = (cx, cz) => (cx + 32768) * 65536 + (cz + 32768);
function gridBuild(list) {
  GRID.map.clear();
  for (const e of list) {
    if (e.dying) continue;
    const k = gkey(Math.floor(e.x / GRID.cell), Math.floor(e.z / GRID.cell));
    let a = GRID.map.get(k);
    if (!a) GRID.map.set(k, (a = []));
    a.push(e);
  }
}
function gridQuery(x, z, r, fn) {
  const c = GRID.cell, x0 = Math.floor((x - r) / c), x1 = Math.floor((x + r) / c), z0 = Math.floor((z - r) / c), z1 = Math.floor((z + r) / c);
  for (let cx = x0; cx <= x1; cx++) for (let cz = z0; cz <= z1; cz++) {
    const a = GRID.map.get(gkey(cx, cz));
    if (a) for (const e of a) if (!e.dying) fn(e);
  }
}
function enemiesInRadius(x, z, r, fn) {
  gridQuery(x, z, r + 1.6, e => { const dx = e.x - x, dz = e.z - z, rr = r + e.radius; if (dx * dx + dz * dz <= rr * rr) fn(e); });
}
function nearestEnemy(x, z, range, exclude) {
  let best = null, bd = range * range;
  gridQuery(x, z, range, e => {
    if (exclude && exclude.has(e)) return;
    const dx = e.x - x, dz = e.z - z, d = dx * dx + dz * dz;
    if (d < bd) { bd = d; best = e; }
  });
  return best;
}

// ---------- the visible ground area ----------
const VIEW = { corners: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], radius: 12 };
function updateView() {
  const W = R.cssW, H = R.cssH, h = G.hero.pos;
  const pts = [[0, 0], [W, 0], [W, H], [0, H]];
  let rad = 6;
  for (let i = 0; i < 4; i++) {
    const c = VIEW.corners[i];
    if (!R.unprojectGround(pts[i][0], pts[i][1], c)) { c[0] = h[0] + (i === 1 || i === 2 ? 15 : -15); c[2] = h[2] + (i < 2 ? -25 : 10); }
    rad = Math.max(rad, Math.hypot(c[0] - h[0], c[2] - h[2]));
  }
  VIEW.radius = Math.min(rad, 40);
}
function onScreen(x, z, margin = 0) {
  const C = VIEW.corners;
  for (let i = 0; i < 4; i++) {
    const a = C[i], b = C[(i + 1) % 4];
    const ex = b[0] - a[0], ez = b[2] - a[2], len = Math.hypot(ex, ez) || 1;
    // corners go clockwise on screen; the inside is to the right of each edge in world x/z
    const cross = (ex * (z - a[2]) - ez * (x - a[0])) / len;
    if (cross < -margin) return false;
  }
  return true;
}
function spawnPoint(margin = 1.8) {
  for (let tries = 0; tries < 10; tries++) {
    const p = screenEdgePoint(margin);
    if (!blockedAt(p[0], p[1], 0.8)) return p;
  }
  // the hero is near a wall: anywhere in the arena that is off screen
  for (let tries = 0; tries < 40; tries++) {
    const x = rand(-ARENA.hw, ARENA.hw), z = rand(-ARENA.hd, ARENA.hd);
    if (!blockedAt(x, z, 0.8) && !onScreen(x, z, 1)) return [x, z];
  }
  const p = screenEdgePoint(margin), o = { x: p[0], z: p[1] };
  resolveCircle(o, 0.8);
  return [o.x, o.z];
}
function screenEdgePoint(margin) {
  const C = VIEW.corners;
  const lens = [0, 1, 2, 3].map(i => Math.hypot(C[(i + 1) % 4][0] - C[i][0], C[(i + 1) % 4][2] - C[i][2]));
  let r = Math.random() * lens.reduce((a, b) => a + b, 0), i = 0;
  while (r > lens[i] && i < 3) { r -= lens[i]; i++; }
  const a = C[i], b = C[(i + 1) % 4], t = clamp(r / (lens[i] || 1), 0, 1);
  const px = a[0] + (b[0] - a[0]) * t, pz = a[2] + (b[2] - a[2]) * t;
  const hx = G.hero.pos[0], hz = G.hero.pos[2];
  const dx = px - hx, dz = pz - hz, d = Math.hypot(dx, dz) || 1;
  return [px + dx / d * margin, pz + dz / d * margin];
}

// ---------- arena look ----------
function applyArena(i) {
  const a = ARENAS[i], f = R.frame;
  f.arena = i; f.stoneA = hexToRgb(a.stoneA); f.stoneB = hexToRgb(a.stoneB); f.grout = hexToRgb(a.grout); f.accent = hexToRgb(a.accent);
  f.fogCol = hexToRgb(a.fog); f.skyCol = hexToRgb(a.sky); f.groundCol = hexToRgb(a.ground); f.lightCol = hexToRgb(a.light);
  f.spotMin = a.spotMin; f.shadowTint = hexToRgb(a.shadowTint);
  f.rockCol = hexToRgb(a.rock); f.poolCol = hexToRgb(a.pool); f.poolGlow = a.poolGlow;
}
function applySkin(id) {
  const s = SKINS.find(k => k.id === id) || SKINS[0];
  R.goo.base = hexToRgb(s.base); R.goo.accent = hexToRgb(s.accent); R.goo.rim = hexToRgb(s.rim);
}

// ---------- runs ----------
function makeEvents() {
  return [{ t: 90, kind: 'swarm', n: 24 }, { t: 120, kind: 'elite' }, { t: 210, kind: 'swarm', n: 40 }, { t: 240, kind: 'elite' }, { t: 270, kind: 'surge' }, { t: 300, kind: 'boss' }];
}
const RATE_KEYS = [[0, 0.35], [30, 0.55], [60, 0.8], [120, 1.3], [180, 1.8], [240, 2.3], [270, 3.0], [300, 3.0]];
function spawnRate(t) {
  for (let i = 1; i < RATE_KEYS.length; i++) {
    const [t1, r1] = RATE_KEYS[i], [t0, r0] = RATE_KEYS[i - 1];
    if (t <= t1) return lerp(r0, r1, (t - t0) / (t1 - t0));
  }
  return RATE_KEYS[RATE_KEYS.length - 1][1];
}

function startRun(chapter) {
  const info = chapterInfo(chapter);
  const run = G.run = {
    chapter, info, t: 0, kills: 0, coins: 0, level: 1, xp: 0, xpNext: xpFor(1), pending: 0, rerolls: 2,
    hp: 100, maxHp: 100, invuln: 1.2, revived: false, over: false, won: false, endT: 0,
    slots: [], stats: null,
    enemies: [], proj: [], eShots: [], gems: [], pickups: [], mines: [], bombs: [], worms: [], buddies: [], axes: [], beams: [],
    nextId: 1, spawnAcc: 0, events: makeEvents(), bosses: [], bossStarted: false, bossTotalHp: 0,
    vel: [0, 0, 0], contactSlow: 0, gemCombo: 0, gemComboT: 0, hurtFlash: 0, bladeAngle: 0, shield: null, regenAcc: 0,
  };
  applyArena(info.arena);
  buildArena(chapter);
  G.hero.reset(0, 0);
  G.hero.scale = 1;
  FX.clear(); G.numbers.length = 0; G.bolts.length = 0;
  addOrLevel('ball');
  recomputeStats();
  run.hp = run.maxHp;
  G.cam.x = 0; G.cam.z = 0; G.cam.vx = 0; G.cam.vz = 0;
  G.timeScale = 1;
  setState('run');
}

function slotOf(id) { return G.run.slots.find(s => s.id === id); }
function lvlOf(id) { const s = slotOf(id); return s ? s.lvl : 0; }
function addOrLevel(id) {
  const run = G.run;
  let s = slotOf(id);
  const oldMax = run.maxHp;
  if (s) s.lvl++;
  else { s = { id, kind: SKILLS[id] ? 'skill' : 'passive', lvl: 1, st: {} }; run.slots.push(s); }
  recomputeStats();
  if (id === 'thick') run.hp = Math.min(run.maxHp, run.hp + (run.maxHp - oldMax));
  if (SKILL_HOOKS[id] && SKILL_HOOKS[id].onLevel) SKILL_HOOKS[id].onLevel(s);
  return s;
}
function recomputeStats() {
  const run = G.run, meta = G.save.upgrades, lv = lvlOf;
  const oldMax = run.maxHp;
  run.stats = {
    dmgMul: (1 + 0.05 * lv('power')) * (1 + 0.03 * meta.damage),
    speedMul: (1 + 0.04 * lv('speed')) * (1 + 0.01 * meta.speed),
    magnet: 1.6 * (1 + 0.15 * lv('magnet')) * (1 + 0.05 * meta.magnet),
    armorMul: Math.pow(0.97, lv('armor')),
    cdMul: Math.pow(0.97, lv('haste')),
    areaMul: 1 + 0.05 * lv('reach'),
    extra: lv('multishot'),
    xpMul: 1 + 0.04 * lv('growth'),
    regen: 0.002 * lv('regen'),
  };
  run.maxHp = 100 * (1 + 0.1 * lv('thick')) * (1 + 0.05 * meta.health);
  if (run.hp > run.maxHp) run.hp = run.maxHp;
  const h = G.hero;
  h.scale = 1 + 0.01 * lv('thick');
  h.bubbles = lv('regen') ? 0.35 + 0.06 * lv('regen') : 0;
  h.stretchMul = 1 + 0.06 * lv('speed');
  h.glow = 0.025 * lv('power');
  h.gloss = 1 + 0.06 * lv('armor');
  h.wobbleMul = (1 + 0.125 * lv('haste')) * (1 - 0.05 * lv('armor'));
  h.topSpeed = 4.5 * run.stats.speedMul;
  h.setArmCount(lv('fists') ? SKILLS.fists.levels[lv('fists') - 1].fists : 2);
  return oldMax;
}

// ---------- enemies ----------
function spawnEnemy(type, x, z, opts = {}) {
  const run = G.run, d = ENEMY_TYPES[type], info = run.info;
  const elite = !!opts.elite;
  // the chapter's extra toughness eases in over the first 90 seconds, while the hero has few skills
  const chapterHp = 1 + (info.hpMul - 1) * clamp(0.5 + run.t / 180, 0.5, 1);
  const hpMul = chapterHp * (1 + 0.12 * run.t / 60) * (elite ? (d.hp >= 40 ? 15 : 25) : 1);
  const e = {
    id: run.nextId++, type, def: d, model: d.model, boss: false, elite,
    x, z, vx: 0, vz: 0, kx: 0, kz: 0, yaw: Math.atan2(G.hero.pos[0] - x, G.hero.pos[2] - z),
    hp: d.hp * hpMul, maxHp: d.hp * hpMul,
    speed: d.speed * (elite ? 0.9 : 1) * rand(0.92, 1.08), dmg: d.dmg * info.dmgMul * (elite ? 1.5 : 1),
    radius: d.radius * (elite ? 1.5 : 1) * (opts.scale || 1), scale: d.scale * (elite ? 1.5 : 1) * (opts.scale || 1), mass: d.mass * (elite ? 3 : 1),
    xp: elite ? 25 : d.xp, phase: rand(0, 1), flash: 0, squash: 1, squashV: 0, dying: 0, contactCd: 0,
    slowT: 0, slowMul: 1, auraTint: 0, bladeT: 0, budT: 0, tint: hexToRgb(opts.tint || d.tint),
    aim: 0, reload: rand(1, 2.5), spawnT: 0,
  };
  run.enemies.push(e);
  return e;
}

function hurtEnemy(e, dmg, kx = 0, kz = 0, opts = {}) {
  if (e.dying || e.hp <= 0) return false;
  dmg *= G.run.stats.dmgMul;
  if (e.boss && e.dizzy > 0) dmg *= 1.5;
  e.hp -= dmg;
  // flash white on a hit, but under constant fire strobe instead of staying solid white
  if (!(e.flashCd > 0)) { e.flash = 0.07; e.flashCd = 0.16; }
  e.squashV -= e.boss ? 0.8 : 2.4;
  if (!e.boss) { e.kx += kx / e.mass; e.kz += kz / e.mass; }
  addNumber(e, dmg, opts.color);
  if (opts.sound !== false) AUDIO.play('hit');
  if (e.hp <= 0) killEnemy(e);
  return true;
}

function killEnemy(e) {
  const run = G.run;
  e.dying = 0.0001;
  run.kills++;
  const s = e.scale;
  FX.splat(e.x, e.z, 0.75 * s, ORANGE, 2.0);
  FX.droplets(e.x, 0.55 * s, e.z, e.boss ? 30 : 5, 5, e.boss ? 7 : 3.2, 0.05 * Math.min(s, 2), ORANGE);
  FX.burst(e.x, 0.6 * s, e.z, e.boss ? 30 : 4, ORANGE, e.boss ? 7 : 3, 0.1, 0.4, 0);
  AUDIO.play('squish');
  if (e.boss) { onBossKilled(e); return; }
  dropGem(e.x, e.z, e.xp);
  if (e.elite) {
    spawnPickup('chest', e.x, e.z);
    for (let i = 0; i < 6; i++) spawnPickup('coin', e.x + rand(-0.8, 0.8), e.z + rand(-0.8, 0.8), 2);
  } else {
    const r = Math.random();
    if (r < 0.02) spawnPickup('coin', e.x, e.z, randInt(1, 3));
    else if (r < 0.03) spawnPickup('heart', e.x, e.z);
    else if (r < 0.035) spawnPickup('magnet', e.x, e.z);
  }
  if (e.def.splits) {
    for (const sx of [-1, 1]) {
      const m = spawnEnemy('mini', e.x + sx * 0.35, e.z + rand(-0.2, 0.2));
      m.kx = sx * 3; m.kz = rand(-1, 1); m.spawnT = 0.2;
    }
    AUDIO.play('split');
  }
}

// ---------- hero damage ----------
function hurtHero(dmg, fromX, fromZ) {
  const run = G.run;
  if (G.state !== 'run' || run.invuln > 0 || run.over) return;
  if (SKILL_HOOKS.shield.absorb(run, fromX, fromZ)) return;
  dmg *= run.stats.armorMul;
  run.hp -= dmg;
  run.invuln = 0.2;
  G.hero.hit([fromX, 0.8, fromZ]);
  run.hurtFlash = 0.55;
  G.cam.shake = Math.max(G.cam.shake, 0.08);
  addNumberAt(G.hero.pos[0], 1.7, G.hero.pos[2], dmg, [1, 0.35, 0.35]);
  AUDIO.play('hurt');
  if (navigator.vibrate) { try { if (G.save.settings.haptics) navigator.vibrate(12); } catch (_) {} }
  if (run.hp <= 0) heroDown();
}
function heroDown() {
  const run = G.run;
  run.hp = 0;
  G.hero.meltTarget = 1;
  FX.droplets(G.hero.pos[0], 0.8, G.hero.pos[2], 16, 0, 4, 0.08, R.goo.base);
  setState('dying');
}
function reviveHero() {
  const run = G.run;
  run.revived = true;
  run.hp = run.maxHp;
  run.invuln = 1.2;
  G.hero.meltTarget = 0;
  G.hero.sqV += 3;
  const h = G.hero.pos;
  enemiesInRadius(h[0], h[2], 4.5, e => { const dx = e.x - h[0], dz = e.z - h[2], d = Math.hypot(dx, dz) || 1; if (!e.boss) { e.kx += dx / d * 14 / e.mass; e.kz += dz / d * 14 / e.mass; } });
  FX.ring(h[0], h[2], 5, COLORS.cyanHi, 0.6);
  FX.droplets(h[0], 0.4, h[2], 20, 0, 6, 0.07, R.goo.base);
  AUDIO.play('levelup');
  setState('run');
}

// ---------- gems and pickups ----------
function dropGem(x, z, value) {
  const run = G.run;
  if (run.gems.length > 320) {
    const g0 = run.gems.shift();
    const g1 = run.gems[Math.floor(Math.random() * run.gems.length)];
    if (g1) { g1.value += g0.value; g1.tier = g1.value >= 25 ? 2 : g1.value >= 5 ? 1 : 0; }
  }
  const a = rand(0, TAU);
  run.gems.push({ x, z, y: 0.3, vx: Math.cos(a) * 1.2, vz: Math.sin(a) * 1.2, vy: 3.2, value, tier: value >= 25 ? 2 : value >= 5 ? 1 : 0, pull: false, sp: 0, ph: rand(0, 10) });
}
function spawnPickup(kind, x, z, value = 1) {
  const a = rand(0, TAU);
  G.run.pickups.push({ kind, x, z, y: 0.3, vx: Math.cos(a) * 1.5, vz: Math.sin(a) * 1.5, vy: 4, value, ph: rand(0, 10), pull: false, sp: 0, t: 0 });
}
function gainXp(v) {
  const run = G.run;
  run.xp += v * run.stats.xpMul;
  while (run.xp >= run.xpNext) { run.xp -= run.xpNext; run.level++; run.xpNext = xpFor(run.level); run.pending++; }
}

// ---------- damage numbers ----------
function addNumber(e, v, color) {
  if (!G.save.settings.numbers) return;
  const now = G.run.t;
  if (e.num && now - e.numT < 0.2 && G.numbers.includes(e.num)) { e.num.v += v; e.num.t = 0; e.numT = now; return; }
  e.num = addNumberAt(e.x, 0.9 * e.scale + 0.4, e.z, v, color);
  e.numT = now;
}
function addNumberAt(x, y, z, v, color) {
  if (G.numbers.length > 40) G.numbers.shift();
  const n = { x: x + rand(-0.2, 0.2), y, z, v, t: 0, color: color || null };
  G.numbers.push(n);
  return n;
}

// ---------- state ----------
function setState(s) {
  G.state = s; G.stateT = 0;
  if (typeof UI !== 'undefined') UI.onState(s);
}

// ---------- main run update ----------
function updateRun(dt) {
  const run = G.run, hero = G.hero, h = hero.pos;
  const live = G.state === 'run';
  run.invuln = Math.max(0, run.invuln - dt);
  run.hurtFlash = Math.max(0, run.hurtFlash - dt * 1.8);
  if (live) {
    run.t += dt;
    // timeline events
    while (run.events.length && run.t >= run.events[0].t) runEvent(run.events.shift());
    // continuous spawning
    const alive = run.enemies.length;
    const rate = run.bossStarted ? 1.0 : spawnRate(run.t) * lerp(1, run.info.rateMul, clamp(run.t / 120, 0, 1));
    run.spawnAcc += rate * dt;
    while (run.spawnAcc >= 1) {
      run.spawnAcc -= 1;
      if (alive < 380) spawnFromMix();
    }
  }

  // hero movement
  const top = hero.topSpeed * (1 - run.contactSlow);
  const k = 1 - Math.exp(-dt / 0.045);
  run.vel[0] += (G.input.x * top - run.vel[0]) * k;
  run.vel[2] += (G.input.z * top - run.vel[2]) * k;
  h[0] += run.vel[0] * dt; h[2] += run.vel[2] * dt;
  HERO_PT.x = h[0]; HERO_PT.z = h[2];
  if (resolveCircle(HERO_PT, HERO_R)) { h[0] = HERO_PT.x; h[2] = HERO_PT.z; }
  hero.update(dt, run.vel, true);

  gridBuild(run.enemies);
  updateEnemies(dt);
  updateSkills(dt);
  updateProjectiles(dt);
  updateEnemyShots(dt);
  updatePickups(dt);

  // regen
  if (run.stats.regen > 0 && run.hp > 0) run.hp = Math.min(run.maxHp, run.hp + run.maxHp * run.stats.regen * dt);
  R.frame.lowHp = run.hp / run.maxHp < 0.25 ? 0.35 : 0;

  // victory check: the remaining enemies melt and every gem and coin flies to the hero
  if (live && run.bossStarted && run.bosses.length && run.bosses.every(b => b.dying)) {
    run.won = true; run.endT = 0;
    for (const e of run.enemies) if (!e.dying && !e.boss) { e.dying = 0.0001; FX.splat(e.x, e.z, 0.6 * e.scale, ORANGE, 2.0); }
    for (const g of run.gems) g.pull = true;
    for (const p of run.pickups) if (p.kind === 'coin') p.pull = true;
    setState('victory');
  }
}

function runEvent(ev) {
  const run = G.run;
  if (ev.kind === 'swarm') {
    const h = G.hero.pos, r = VIEW.radius + 1.5, off = rand(0, TAU);
    for (let i = 0; i < ev.n; i++) { const a = off + (i / ev.n) * TAU; const e = spawnEnemy('stickman', h[0] + Math.cos(a) * r, h[2] + Math.sin(a) * r); resolveCircle(e, e.radius); }
  } else if (ev.kind === 'elite') {
    const has = run.info.has;
    const types = ['stickman'].concat(has.brute ? ['brute'] : [], has.archer ? ['archer'] : [], has.shield ? ['shield'] : []);
    const [x, z] = spawnPoint(2);
    spawnEnemy(pick(types), x, z, { elite: true });
  } else if (ev.kind === 'surge') {
    for (let i = 0; i < 30; i++) spawnFromMix();
  } else if (ev.kind === 'boss') {
    startBoss();
  }
}

function spawnFromMix() {
  const run = G.run, t = run.t, has = run.info.has;
  const w = { stickman: 1 };
  if (t > 45) w.sprinter = 0.22;
  if (has.brute && t > (run.chapter >= 3 ? 120 : 180)) w.brute = 0.1;
  if (has.archer && t > 90) w.archer = 0.1;
  if (has.splitter && t > 60) w.splitter = 0.12;
  if (has.shield && t > 150) w.shield = 0.1;
  let total = 0; for (const k in w) total += w[k];
  let r = Math.random() * total, type = 'stickman';
  for (const k in w) { r -= w[k]; if (r <= 0) { type = k; break; } }
  const [x, z] = spawnPoint();
  if (type === 'sprinter') {
    const n = randInt(3, 5), h = G.hero.pos, dx = h[0] - x, dz = h[2] - z, d = Math.hypot(dx, dz) || 1;
    for (let i = 0; i < n; i++) spawnEnemy('sprinter', x - dx / d * i * 0.65, z - dz / d * i * 0.65);
  } else if (type === 'stickman') {
    // stickmen arrive in small clumps
    const n = t < 60 ? randInt(1, 2) : randInt(1, 3);
    for (let i = 0; i < n; i++) spawnEnemy('stickman', x + rand(-0.9, 0.9), z + rand(-0.9, 0.9));
  } else spawnEnemy(type, x, z);
}

function updateEnemies(dt) {
  const run = G.run, h = G.hero.pos;
  let touching = 0;
  for (const e of run.enemies) {
    if (e.dying) { e.dying += dt / (e.boss ? 0.6 : 0.14); continue; }
    e.flash = Math.max(0, e.flash - dt); e.flashCd = (e.flashCd || 0) - dt;
    e.contactCd -= dt;
    e.slowT -= dt; if (e.slowT <= 0) e.slowMul = 1;
    e.spawnT = Math.max(0, e.spawnT - dt);
    e.auraTint = Math.max(0, e.auraTint - dt * 2);
    if (e.boss) updateBoss(e, dt);
    else updateEnemyAI(e, dt);
    // knockback
    e.x += e.kx * dt; e.z += e.kz * dt;
    const kd = Math.exp(-7 * dt); e.kx *= kd; e.kz *= kd;
    // squash spring
    e.squashV += (300 * (1 - e.squash) - 14 * e.squashV) * dt;
    e.squash = clamp(e.squash + e.squashV * dt, 0.6, 1.3);
    // hero contact
    const dx = e.x - h[0], dz = e.z - h[2], d = Math.hypot(dx, dz), rr = e.radius + HERO_R;
    if (d < rr && G.hero.melt < 0.5) {
      touching++;
      const push = (rr - d) * (e.boss ? 0.15 : 0.85);
      if (d > 1e-4) { e.x += dx / d * push; e.z += dz / d * push; }
      if (e.contactCd <= 0 && G.state === 'run' && e.spawnT <= 0) { hurtHero(e.contactDmg || e.dmg, e.x, e.z); e.contactCd = 0.75; }
    }
  }
  run.contactSlow = Math.min(0.3, touching * 0.05);
  // separation between enemies
  for (const e of run.enemies) {
    if (e.dying) continue;
    gridQuery(e.x, e.z, e.radius + 1.2, o => {
      if (o.id <= e.id) return;
      const dx = o.x - e.x, dz = o.z - e.z, rr = e.radius + o.radius, d2 = dx * dx + dz * dz;
      if (d2 >= rr * rr || d2 < 1e-8) return;
      const d = Math.sqrt(d2), ov = (rr - d) * 0.5, tot = e.mass + o.mass;
      const ex = dx / d * ov, ez = dz / d * ov;
      e.x -= ex * (o.mass / tot) * 2; e.z -= ez * (o.mass / tot) * 2;
      o.x += ex * (e.mass / tot) * 2; o.z += ez * (e.mass / tot) * 2;
    });
  }
  for (const e of run.enemies) {
    if (e.dying || (e.y || 0) > 0.6) continue;
    const hit = resolveCircle(e, e.radius);
    if (hit && e.boss && e.ai.state === 'charge') bossBonk(e, hit);
  }
  run.enemies = run.enemies.filter(e => !(e.dying >= 1));
}

const STEER = [0, 0];
function updateEnemyAI(e, dt) {
  const h = G.hero.pos;
  let dx = h[0] - e.x, dz = h[2] - e.z;
  const d = Math.hypot(dx, dz) || 1;
  dx /= d; dz /= d;
  // relocate stragglers far behind to the front
  if (d > VIEW.radius * 1.7 && !e.elite) {
    const [x, z] = spawnPoint(); e.x = x; e.z = z; return;
  }
  steerAround(e.x, e.z, e.radius, dx, dz, d, STEER); dx = STEER[0]; dz = STEER[1];
  let want = e.speed * e.slowMul;
  if (e.def.ranged) {
    if (e.aim > 0) {
      want = 0;
      e.aim += dt;
      if (e.aim > 0.45) { fireArrow(e); e.aim = 0; e.reload = 2.5; }
    } else {
      e.reload -= dt;
      if (d < 6.5 && e.reload <= 0 && onScreen(e.x, e.z, -0.5)) { e.aim = 0.001; AUDIO.play('throw'); }
      if (d < 4.5) want = -e.speed * 0.6;
    }
  }
  const tvx = dx * want, tvz = dz * want;
  const k = 1 - Math.exp(-8 * dt);
  e.vx += (tvx - e.vx) * k; e.vz += (tvz - e.vz) * k;
  e.x += e.vx * dt; e.z += e.vz * dt;
  e.yaw = angleLerp(e.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10));
  e.phase += dt * Math.hypot(e.vx, e.vz) / (0.85 * e.scale);
}

function fireArrow(e) {
  const h = G.hero.pos, dx = h[0] - e.x, dz = h[2] - e.z, d = Math.hypot(dx, dz) || 1;
  G.run.eShots.push({ kind: 'arrow', x: e.x + dx / d * 0.4, y: 0.75, z: e.z + dz / d * 0.4, vx: dx / d * 10, vy: 0, vz: dz / d * 10, dmg: e.def.shot * G.run.info.dmgMul * (e.elite ? 2 : 1), r: 0.2, life: 1.2 });
}

function updateEnemyShots(dt) {
  const run = G.run, h = G.hero.pos;
  for (const s of run.eShots) {
    s.life -= dt;
    if (s.kind === 'boulder') {
      s.t += dt;
      const u = clamp(s.t / s.dur, 0, 1);
      s.x = lerp(s.sx, s.tx, u); s.z = lerp(s.sz, s.tz, u); s.y = lerp(s.sy, 0.4, u) + Math.sin(u * Math.PI) * 5;
      s.spin += dt * 6;
      if (u >= 1) {
        s.life = 0;
        if (Math.hypot(h[0] - s.tx, h[2] - s.tz) < s.radius + HERO_R * 0.6) hurtHero(s.dmg, s.tx, s.tz);
        FX.ring(s.tx, s.tz, s.radius * 1.4, [1, 0.8, 0.6], 0.4);
        FX.crack(s.tx, s.tz, s.radius * 1.6);
        FX.burst(s.tx, 0.3, s.tz, 10, [0.55, 0.5, 0.45], 4, 0.14, 0.5, 2);
        G.cam.shake = Math.max(G.cam.shake, 0.1);
        AUDIO.play('boom');
      }
      continue;
    }
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    if (inRock(s.x, s.z) || arenaSd(s.x, s.z) > 0.5) { s.life = 0; FX.burst(s.x, s.y, s.z, 4, [0.8, 0.7, 0.6], 2.5, 0.07, 0.3, 1); continue; }
    if (Math.hypot(s.x - h[0], s.z - h[2]) < s.r + HERO_R && s.y < 2) { s.life = 0; hurtHero(s.dmg, s.x, s.z); FX.burst(s.x, s.y, s.z, 4, [1, 0.6, 0.2], 3, 0.08, 0.3, 1); }
  }
  run.eShots = run.eShots.filter(s => s.life > 0);
}

function updatePickups(dt) {
  const run = G.run, h = G.hero.pos, mag = run.stats.magnet;
  run.gemComboT -= dt;
  if (run.gemComboT <= 0) run.gemCombo = 0;
  for (const g of run.gems) {
    if (g.vy !== 0 || g.y > 0.25) {
      g.vy -= 14 * dt; g.y += g.vy * dt; g.x += g.vx * dt; g.z += g.vz * dt;
      if (g.y <= 0.25) { g.y = 0.25; g.vy = 0; g.vx = 0; g.vz = 0; resolveCircle(g, 0.2); }
    }
    const dx = h[0] - g.x, dz = h[2] - g.z, d = Math.hypot(dx, dz);
    if (!g.pull && d < mag) g.pull = true;
    if (g.pull) {
      g.sp = Math.min(g.sp + 40 * dt, 30);
      const step = Math.max(4, g.sp) * dt;
      if (d < 0.45 || step >= d) {
        g.dead = true;
        gainXp(g.value);
        run.gemCombo++; run.gemComboT = 0.4;
        AUDIO.play('gem', 1 + Math.min(run.gemCombo, 12) * 0.04);
      } else { g.x += dx / d * step; g.z += dz / d * step; }
    }
  }
  run.gems = run.gems.filter(g => !g.dead);
  for (const p of run.pickups) {
    p.t += dt;
    if (p.vy !== 0 || p.y > 0.3) {
      p.vy -= 14 * dt; p.y += p.vy * dt; p.x += p.vx * dt; p.z += p.vz * dt;
      if (p.y <= 0.3) { p.y = 0.3; p.vy = 0; p.vx = 0; p.vz = 0; resolveCircle(p, 0.3); }
    }
    const dx = h[0] - p.x, dz = h[2] - p.z, d = Math.hypot(dx, dz);
    if (p.kind === 'coin' && !p.pull && d < mag) p.pull = true;
    if (p.pull) { p.sp = Math.min(p.sp + 40 * dt, 30); const st = Math.max(4, p.sp) * dt; if (st < d) { p.x += dx / d * st; p.z += dz / d * st; } }
    if (d < (p.kind === 'chest' ? 0.85 : 0.6) && p.t > 0.35) {
      p.dead = true;
      if (p.kind === 'coin') { run.coins += p.value; AUDIO.play('coin'); FX.star(p.x, 0.6, p.z, 0.35, COLORS.gold); }
      else if (p.kind === 'heart') { run.hp = Math.min(run.maxHp, run.hp + run.maxHp * 0.3); AUDIO.play('levelup'); FX.burst(h[0], 1, h[2], 12, [1, 0.4, 0.55], 3, 0.12, 0.6, 3); addNumberAt(h[0], 1.8, h[2], run.maxHp * 0.3, [0.4, 1, 0.6]); }
      else if (p.kind === 'magnet') { for (const g of run.gems) g.pull = true; for (const q of run.pickups) if (q.kind === 'coin') q.pull = true; AUDIO.play('shield'); FX.ring(h[0], h[2], 3, COLORS.mint, 0.5); }
      else if (p.kind === 'chest') { run.chestQueued = (run.chestQueued || 0) + 1; AUDIO.play('chest'); }
    }
  }
  run.pickups = run.pickups.filter(p => !p.dead);
}

// ---------- camera ----------
function updateCamera(dt, snap, noShake) {
  const c = G.cam, h = G.hero.pos, run = G.run;
  const vel = run ? run.vel : [0, 0, 0];
  const tx = h[0] + clamp(vel[0] * 0.17, -0.8, 0.8), tz = h[2] + clamp(vel[2] * 0.17, -0.8, 0.8);
  if (snap) { c.x = tx; c.z = tz; c.vx = c.vz = 0; }
  const w = 2 / 0.12;
  const ax = w * w * (tx - c.x) - 2 * w * c.vx, az = w * w * (tz - c.z) - 2 * w * c.vz;
  c.vx += ax * dt; c.vz += az * dt; c.x += c.vx * dt; c.z += c.vz * dt;
  c.shake = Math.max(0, c.shake - dt * 0.6);
  const sh = !noShake && G.save && G.save.settings.shake ? c.shake : 0;
  const sx = (Math.random() * 2 - 1) * sh, sz = (Math.random() * 2 - 1) * sh;
  const aspect = R.w / R.h, fov = 0.55, pitch = 52 * Math.PI / 180;
  const half = Math.tan(fov / 2);
  const dist = aspect < 1 ? 10.5 / (2 * half * aspect) : 11.5 / (2 * half);
  c.dist = dist;
  const place = () => {
    c.target = [c.x + sx, 0.4, c.z + sz];
    c.eye = [c.target[0], c.target[1] + Math.sin(pitch) * dist, c.target[2] + Math.cos(pitch) * dist];
    R.setCamera(c.eye, c.target, fov);
  };
  place();
  // keep the view from drifting far past the arena walls
  if (run) {
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
    const W = R.cssW, H = R.cssH, q = CAM_Q;
    for (const [px, py] of [[0, 0], [W, 0], [W, H], [0, H]]) {
      if (!R.unprojectGround(px, py, q)) continue;
      x0 = Math.min(x0, q[0] - c.target[0]); x1 = Math.max(x1, q[0] - c.target[0]);
      z0 = Math.min(z0, q[2] - c.target[2]); z1 = Math.max(z1, q[2] - c.target[2]);
    }
    if (x0 < x1) {
      const pad = 2.5, ex = ARENA.hw + pad, ez = ARENA.hd + pad;
      const lx = -ex - x0, hx = ex - x1, lz = -ez - z0, hz = ez - z1;
      const cx = lx > hx ? 0 : clamp(c.x, lx, hx), cz = lz > hz ? (lz + hz) / 2 : clamp(c.z, lz, hz);
      if (cx !== c.x || cz !== c.z) { c.x = cx; c.z = cz; place(); }
    }
  }
}
const CAM_Q = [0, 0, 0];

// ---------- victory / results ----------
function finishRun(won) {
  const run = G.run;
  if (run.over) return;
  run.over = true;
  run.won = won;
  const sv = G.save;
  const reward = won ? run.info.reward : 0;
  run.reward = reward;
  run.earned = run.coins + reward;
  sv.coins += run.earned;
  const best = sv.best[run.chapter] || 0;
  if (run.t > best) sv.best[run.chapter] = Math.round(run.t);
  if (won) { sv.cleared[run.chapter] = true; sv.chapter = Math.max(sv.chapter, run.chapter + 1); }
  sv.stats.runs++; sv.stats.kills += run.kills;
  saveGame();
  AUDIO.play(won ? 'win' : 'lose');
  setState('results');
}
