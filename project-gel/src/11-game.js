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
    // burrowed or otherwise untouchable enemies are left out, so nothing can target them
    if (e.dying || e.hidden) continue;
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
  f.rockCol = hexToRgb(a.rock); f.poolCol = hexToRgb(a.pool); f.poolGlow = a.poolGlow; f.floorStyle = a.floor || 0;
}
function applySkin(id, costume, hat) {
  const s = SKINS.find(k => k.id === id) || SKINS[0];
  R.goo.base = hexToRgb(s.base); R.goo.accent = hexToRgb(s.accent); R.goo.rim = hexToRgb(s.rim);
  if (G.hero) {
    const g = G.hero.out.grad;
    if (s.top) { g.set(hexToRgb(s.top)); g[3] = 1; } else g[3] = 0;
    G.hero.setCostume(costume ?? (G.save ? G.save.costume : 'none'), hat ?? (G.save ? G.save.hat : 'none'));
    G.hero.setGear(G.save && G.save.gear);
  }
}

// ---------- runs ----------
function makeEvents(chapter) {
  let ev = [{ t: 60, kind: 'swarm', n: 24 }, { t: 120, kind: 'elite' }, { t: 150, kind: 'swarm', n: 40 }, { t: 210, kind: 'swarm', n: 60 }, { t: 255, kind: 'surge', n: 40 }, { t: 280, kind: 'swarm', n: 80 }, { t: 300, kind: 'boss' }];
  // the chapter's miniboss, three times (30%, 55%, 80% of the way to the boss)
  MINI_VISITS.forEach(([f], k) => ev.push({ t: 300 * f, kind: 'mini', k }));
  // most runs get a visit from the Golden Gooblin somewhere in the middle
  if (Math.random() < 0.8) ev.push({ t: rand(70, 230), kind: 'gooblin' });
  // the cave chapter has no boss on the arena floor: its boss is inside the cave (11f-crater.js)
  if (BOSS_TYPES[CHAPTER_BOSSES[chapter - 1]]?.cave) ev = ev.filter(e => e.kind !== 'boss');
  return ev.sort((a, b) => a.t - b.t);
}
// spawns a second: a steady stream from the start (standing still is never safe), then a flood near the end
const RATE_KEYS = [[0, 0.45], [30, 0.7], [60, 1.0], [120, 2.0], [180, 3.4], [240, 5.5], [270, 8.5], [300, 10.0]];
const MAX_ALIVE = 300;
function spawnRate(t) {
  for (let i = 1; i < RATE_KEYS.length; i++) {
    const [t1, r1] = RATE_KEYS[i], [t0, r0] = RATE_KEYS[i - 1];
    if (t <= t1) return lerp(r0, r1, (t - t0) / (t1 - t0));
  }
  return RATE_KEYS[RATE_KEYS.length - 1][1];
}

function startRun(chapter, opts = {}) {
  const info = { ...chapterInfo(chapter) };
  const run = G.run = {
    chapter, info, t: 0, kills: 0, bossKills: 0, eliteKills: 0, gooblins: 0, evos: 0, coins: 0, level: 1, xp: 0, xpNext: xpFor(1), pending: 0, rerolls: 2,
    hp: 100, maxHp: 100, invuln: 1.2, revived: false, over: false, won: false, endT: 0,
    slots: [], stats: null,
    enemies: [], proj: [], eShots: [], gems: [], pickups: [], mines: [], bombs: [], worms: [], buddies: [], axes: [], beams: [],
    nextId: 1, spawnAcc: 0, events: opts.endless ? endlessEvents() : opts.rush ? [] : makeEvents(chapter), bosses: [], bossStarted: false, bossTotalHp: 0,
    endless: !!opts.endless, rush: !!opts.rush, rushK: 0, powerCap: opts.powerCap || chapter, tier: 0,
    vel: [0, 0, 0], contactSlow: 0, gemCombo: 0, gemComboT: 0, hurtFlash: 0, bladeAngle: 0, shield: null, regenAcc: 0,
  };
  run.gear = gearStats();
  applyArena(info.arena);
  buildArena(chapter);
  G.hero.reset(0, 0);
  G.hero.scale = 1;
  FX.clear(); G.numbers.length = 0; G.bolts.length = 0;
  addOrLevel('ball');
  recomputeStats();
  run.hp = run.maxHp;
  G.cam.x = 0; G.cam.z = 0; G.cam.vx = 0; G.cam.vz = 0;
  if (run.rush) rushStart(run);
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
  checkEvolutions();
  return s;
}
// ---------- evolutions ----------
// a skill's current stats: its level row, or the evolved row once evolved
function skillL(s) { return s.evoL || SKILLS[s.id].levels[s.lvl - 1]; }
// skills ready to evolve: max level, not evolved yet, partner ability owned
function evolvable() { return G.run.slots.filter(s => s.kind === 'skill' && !s.evo && EVOLUTIONS[s.id] && s.lvl >= maxLevel(s.id) && slotOf(EVOLUTIONS[s.id].with)); }
// the first time an evolution becomes possible, a glowing chest drops nearby so it can't slip by
function checkEvolutions() {
  const run = G.run;
  if (!run || !run.slots) return;
  run.evoSeen = run.evoSeen || {};
  for (const s of evolvable()) {
    if (run.evoSeen[s.id]) continue;
    run.evoSeen[s.id] = true;
    // (no chest of its own: any chest now has a small chance to evolve it)
    if (G.state === 'run' || G.state === 'levelup') UI.toast(`${SKILLS[s.id].name} can evolve! Chests sometimes evolve a skill.`, 2.6);
  }
}
function evolveSkill(id) {
  const run = G.run, s = slotOf(id), E = EVOLUTIONS[id], rows = SKILLS[id].levels, top = rows[rows.length - 1];
  s.evo = true;
  run.evos++;
  s.evoL = { ...top, ...E.boost(top) };
  if (id === 'frostnova') run.absZero = true;
  recomputeStats();
  if (SKILL_HOOKS[id].onLevel) SKILL_HOOKS[id].onLevel(s);
  // a golden burst around the blob
  const h = G.hero.pos;
  FX.ring(h[0], h[2], 7, [1, 0.82, 0.3], 0.8, 1); FX.ring(h[0], h[2], 4, [1, 0.95, 0.6], 0.6, 1);
  for (let i = 0; i < 36; i++) FX.star(h[0] + rand(-1.6, 1.6), rand(0.3, 2.6), h[2] + rand(-1.6, 1.6), rand(0.2, 0.4), [1, rand(0.75, 0.95), rand(0.2, 0.5)], rand(0.6, 1.1));
  G.hero.impulse(3);
  UI.toast(`★ ${E.name}!`, 2);
}
function recomputeStats() {
  const run = G.run, lv = lvlOf;
  const oldMax = run.maxHp;
  if (run.sea) { seaStats(run); return oldMax; }
  // skin, costume and artifact bonuses (percent), fixed for the run
  const gb = run.gear || {}, g = k => (gb[k] || 0) / 100;
  run.stats = {
    dmgMul: (1 + 0.05 * lv('power')) * (1 + g('dmg')),
    speedMul: (1 + 0.04 * lv('speed')) * (1 + g('speed')),
    magnet: 1.6 * (1 + 0.15 * lv('magnet')) * (1 + g('magnet')),
    armorMul: Math.pow(0.96, lv('armor')) * (1 - Math.min(0.6, g('armor'))),
    cdMul: Math.pow(0.96, lv('haste')) * (1 - Math.min(0.5, g('cd'))),
    areaMul: (1 + 0.05 * lv('reach')) * (1 + g('area')),
    extra: lv('multishot'),
    xpMul: (1 + 0.04 * lv('growth')) * (1 + g('xp')),
    regen: 0.003 * lv('regen') + g('regen'),
    crit: 0.03 * lv('crit'), leech: 0.015 * lv('leech'), dodge: 0.025 * lv('dodge'), second: lv('second'),
  };
  run.maxHp = 140 * (1 + 0.12 * lv('thick')) * (1 + g('hp'));
  if (run.hp > run.maxHp) run.hp = run.maxHp;
  const h = G.hero;
  h.scale = 1 + 0.01 * lv('thick');
  h.bubbles = lv('regen') ? 0.35 + 0.06 * lv('regen') : 0;
  h.stretchMul = 1 + 0.06 * lv('speed');
  h.glow = 0.025 * lv('power');
  h.gloss = 1 + 0.06 * lv('armor');
  h.wobbleMul = (1 + 0.125 * lv('haste')) * (1 - 0.05 * lv('armor'));
  h.topSpeed = 4.5 * run.stats.speedMul;
  h.setArmCount(lv('fists') ? skillL(slotOf('fists')).fists : 2);
  return oldMax;
}

// ---------- enemies ----------
// regular enemies are a little frailer than their table says (with weaker power-ups, the numbers do the work)
const ENEMY_HP = 0.7, XP_MUL = 0.75;
function spawnEnemy(type, x, z, opts = {}) {
  const run = G.run, d = ENEMY_TYPES[type], info = run.info;
  const elite = !!opts.elite;
  // the chapter's extra toughness eases in over the first 90 seconds, while the hero has few skills. Within a
  // run enemies barely toughen: by the end of a chapter each one dies easily, but there are a great many.
  const chapterHp = 1 + (info.hpMul - 1) * clamp(0.5 + run.t / 180, 0.5, 1);
  const hpMul = ENEMY_HP * chapterHp * (1 + 0.03 * run.t / 60) * (elite ? (d.hp >= 40 ? 12 : d.hp >= 20 ? 16 : 25) : 1);
  const e = {
    id: run.nextId++, type, def: d, model: d.model, boss: false, elite,
    x, z, vx: 0, vz: 0, kx: 0, kz: 0, yaw: Math.atan2(G.hero.pos[0] - x, G.hero.pos[2] - z),
    hp: d.hp * hpMul, maxHp: d.hp * hpMul,
    speed: d.speed * (info.speedMul || 1) * (elite ? 0.9 : 1) * rand(0.92, 1.08), dmg: d.dmg * info.dmgMul * (elite ? 1.5 : 1),
    radius: d.radius * (elite ? 1.5 : 1) * (opts.scale || 1), scale: d.scale * (elite ? 1.5 : 1) * (opts.scale || 1), mass: d.mass * (elite ? 3 : 1),
    xp: elite ? 25 : d.xp, phase: rand(0, 1), flash: 0, squash: 1, squashV: 0, dying: 0, contactCd: 0,
    slowT: 0, slowMul: 1, auraTint: 0, bladeT: 0, budT: 0, tint: hexToRgb(opts.tint || d.tint),
    aim: 0, reload: rand(1, 2.5), spawnT: 0,
  };
  run.enemies.push(e);
  return e;
}

// the skill behind the damage being dealt right now (set around each skill's update, its projectiles and
// blasts), so a boss can shrug it off or take extra from it (BOSS_TYPES[id].immune / .weak)
let DMG_SRC = null;
const WEAK_MUL = 1.8;
function hurtEnemy(e, dmg, kx = 0, kz = 0, opts = {}) {
  if (e.dying || e.hp <= 0) return false;
  if (e.boss && DMG_SRC && e.def.immune && e.def.immune.includes(DMG_SRC)) {
    if (!(e.immuneAt > G.run.t)) { e.immuneAt = G.run.t + 0.6; addNumberAt(e.x, e.scale * 0.9 + 0.8, e.z, 'IMMUNE', [0.75, 0.78, 0.85]); }
    return false;
  }
  let weak = false;
  if (e.boss && DMG_SRC && e.def.weak && e.def.weak.includes(DMG_SRC)) { dmg *= WEAK_MUL; weak = true; opts = { ...opts, color: [1, 0.55, 0.15] }; }
  dmg *= G.run.stats.dmgMul;
  // Lucky Splat: now and then a hit does double
  if (G.run.stats.crit && Math.random() < G.run.stats.crit) { dmg *= 2; opts = { ...opts, color: [1, 0.9, 0.2] }; }
  if (e.boss && e.dizzy > 0) dmg *= 1.5;
  if (e.frozen > 0 && G.run.absZero) dmg *= 1.2;
  // a sea pirate's floats take the damage first (13k-ocean.js)
  if (e.shell > 0) {
    const a = Math.min(e.shell, dmg);
    e.shell -= a; dmg -= a;
    if (e.shell <= 0) seaPop(e);
    if (dmg <= 0) { if (!(e.flashCd > 0)) { e.flash = 0.07; e.flashCd = 0.16; } e.squashV -= 1.6; addNumber(e, a, [1, 0.85, 0.55]); if (opts.sound !== false) AUDIO.play('boing'); return true; }
  }
  e.hp -= dmg;
  // flash white on a hit, but under constant fire strobe instead of staying solid white
  if (!(e.flashCd > 0)) { e.flash = 0.07; e.flashCd = 0.16; }
  e.squashV -= e.boss ? 0.8 : 2.4;
  if (!e.boss) { e.kx += kx / e.mass; e.kz += kz / e.mass; }
  addNumber(e, dmg, opts.color);
  if (e.def.flee) gooblinHit(e);
  if (opts.sound !== false) AUDIO.play('hit');
  if (e.hp <= 0) killEnemy(e);
  return true;
}

function killEnemy(e) {
  const run = G.run;
  e.dying = 0.0001;
  run.kills++;
  if (e.elite) run.eliteKills++;
  sugarKill(run);
  const s = e.scale;
  FX.droplets(e.x, 0.55 * s, e.z, e.boss ? 30 : 5, 5, e.boss ? 7 : 3.2, 0.05 * Math.min(s, 2), null);
  FX.burst(e.x, 0.6 * s, e.z, e.boss ? 30 : 4, ORANGE, e.boss ? 7 : 3, 0.1, 0.4, 0);
  AUDIO.play('squish');
  if (e.def.onKill) e.def.onKill(e);
  // Goo Leech: some kills heal a little
  if (run.stats.leech && Math.random() < run.stats.leech && run.hp > 0) { run.hp = Math.min(run.maxHp, run.hp + run.maxHp * 0.01); FX.glow(G.hero.pos[0], 1.2, G.hero.pos[2], 0.5, [0.4, 1, 0.6], 0.15); }
  if (e.mini) { onMiniKilled(e); return; }
  if (e.boss) { onBossKilled(e); return; }
  if (e.def.flee) gooblinLoot(e);
  // tougher enemies (tier 2 and up) sometimes drop an emerald instead, and sometimes a scroll; elites always drop one
  const tough = e.elite || e.def.xp >= 2;
  if (e.elite || (tough && Math.random() < EMERALD_CHANCE)) dropGem(e.x, e.z, e.elite ? e.xp : e.xp * 3 + 2, 1);
  else dropGem(e.x, e.z, e.xp, 0);
  if ((e.elite || (tough && Math.random() < SCROLL_CHANCE)) && Math.random() < scrollOdds()) spawnPickup('scroll', e.x + 0.5, e.z);
  if (e.elite) {
    spawnPickup('chest', e.x, e.z);
    for (let i = 0; i < 6; i++) spawnPickup('coin', e.x + rand(-0.8, 0.8), e.z + rand(-0.8, 0.8), 2);
  } else {
    const r = Math.random();
    if (r < 0.02) spawnPickup('coin', e.x, e.z, randInt(1, 3));
    else if (r < 0.03) spawnPickup('heart', e.x, e.z);
    else if (r < 0.045) spawnPickup('magnet', e.x, e.z);
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
  if (G.state !== 'run' || run.invuln > 0 || run.over || DEV.god) return;
  // Slippery: now and then a hit misses entirely
  if (run.stats.dodge && Math.random() < run.stats.dodge) { run.invuln = 0.25; addNumberAt(G.hero.pos[0], 2.2, G.hero.pos[2], 'DODGE', [0.6, 0.95, 1]); AUDIO.play('pop', 1.4); return; }
  if (SKILL_HOOKS.shield.absorb(run, fromX, fromZ)) return;
  if (run.sea) dmg *= seaThreat();
  dmg *= run.stats.armorMul;
  run.hp -= dmg;
  run.invuln = 0.35;
  G.hero.hit([fromX, 0.8, fromZ]);
  run.hurtFlash = 0.55;
  G.cam.shake = Math.max(G.cam.shake, 0.08);
  addNumberAt(G.hero.pos[0], 2.0, G.hero.pos[2], dmg, [1, 0.35, 0.35]);
  AUDIO.play('hurt');
  if (navigator.vibrate) { try { if (G.save.settings.haptics) navigator.vibrate(12); } catch (_) {} }
  if (run.hp <= 0) heroDown();
}
function heroDown() {
  const run = G.run;
  if (run.sea) { seaSinkStart(); return; }
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
  if (run.sea) seaRevive();
  const h = G.hero.pos;
  enemiesInRadius(h[0], h[2], 4.5, e => { const dx = e.x - h[0], dz = e.z - h[2], d = Math.hypot(dx, dz) || 1; if (!e.boss) { e.kx += dx / d * 14 / e.mass; e.kz += dz / d * 14 / e.mass; } });
  FX.ring(h[0], h[2], 5, COLORS.cyanHi, 0.6);
  FX.droplets(h[0], 0.4, h[2], 20, 0, 6, 0.07, R.goo.base);
  AUDIO.play('levelup');
  setState('run');
}

// Second Wind: dropping under 30% health heals a chunk, once every 45 s
function secondWind(run) {
  const lv = run.stats.second;
  if (!lv || run.hp <= 0 || run.hp > run.maxHp * 0.3 || (run.secondAt || -1e9) > run.t) return;
  run.secondAt = run.t + 45;
  const heal = run.maxHp * (0.06 + 0.02 * (lv - 1));
  run.hp = Math.min(run.maxHp, run.hp + heal);
  const h = G.hero.pos;
  FX.ring(h[0], h[2], 3, [0.4, 1, 0.6], 0.6, 1); FX.burst(h[0], 1, h[2], 16, [0.4, 1, 0.6], 4, 0.1, 0.5, 3);
  addNumberAt(h[0], 2.1, h[2], heal, [0.4, 1, 0.6]); AUDIO.play('levelup', 1.3);
}

// ---------- gems and pickups ----------
// tier 0 is the small blue crystal, tier 1 the big green emerald
const EMERALD_CHANCE = 0.1, SCROLL_CHANCE = 0.028;
// every random scroll drop passes this: 3 in 4 (scrolls are 25% rarer), and half of that again in Endless
// (Endless and Boss Rush: a quarter of that again, and Endless half of what is left)
const scrollOdds = () => 0.75 * (G.run && (G.run.endless || G.run.rush) ? 0.25 : 1) * (G.run && G.run.endless ? 0.5 : 1);
function dropGem(x, z, value, tier = 0) {
  const run = G.run;
  if (run.gems.length > 320) {
    // too many on the floor: fold the oldest into another one
    const g0 = run.gems.shift();
    const g1 = run.gems[Math.floor(Math.random() * run.gems.length)];
    if (g1) { g1.value += g0.value; if (g1.value >= 20) g1.tier = 1; }
  }
  const a = rand(0, TAU);
  run.gems.push({ x, z, y: 0.3, vx: Math.cos(a) * 1.2, vz: Math.sin(a) * 1.2, vy: 3.2, value, tier, pull: false, sp: 0, ph: rand(0, 10) });
}
function spawnPickup(kind, x, z, value = 1) {
  const a = rand(0, TAU);
  G.run.pickups.push({ kind, x, z, y: 0.3, vx: Math.cos(a) * 1.5, vz: Math.sin(a) * 1.5, vy: 4, value, ph: rand(0, 10), pull: false, sp: 0, t: 0 });
}
function gainXp(v) {
  const run = G.run;
  // (Endless and Boss Rush level up far more slowly: 40% of the XP)
  run.xp += v * run.stats.xpMul * XP_MUL * (run.endless || run.rush ? 0.4 : 1);
  const need = run.sea ? xpForSea : xpFor;
  while (run.xp >= run.xpNext) { run.xp -= run.xpNext; run.level++; run.xpNext = need(run.level); run.pending++; }
}

// ---------- damage numbers ----------
function addNumber(e, v, color) {
  if (!G.save.settings.numbers) return;
  const now = G.run.t;
  if (e.num && now - e.numT < 0.2 && G.numbers.includes(e.num) && typeof e.num.v === 'number') { e.num.v += v; e.num.t = 0; e.numT = now; return; }
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
  // inside the cave (chapter 20) nothing of the arena runs: the cave is its own game (13i-cave.js)
  if (G.run.cave) { G.run.t += dt; updateCave(dt); return; }
  // at sea (13k-ocean.js)
  if (G.run.sea) { updateOcean(dt); return; }
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
    if (run.endless) endlessTick(run);
    const rate = run.endless ? endlessRate(run.t) : run.rush ? 1.6 : (run.bossStarted ? 2.5 : spawnRate(run.t)) * run.info.rateMul;
    run.spawnAcc += rate * dt;
    while (run.spawnAcc >= 1) {
      run.spawnAcc -= 1;
      if (alive < MAX_ALIVE) spawnFromMix();
    }
  }

  // hero movement; the ground underfoot can slow you, make you slide, or burn
  const zone = zoneAt(h[0], h[2]), Z = zone ? ZONE_KINDS[zone.kind] : null;
  run.zone = zone;
  updateSugar(run, dt);
  // chilled by frost breath: slower for a moment
  if (run.chillT > 0) { run.chillT -= dt; if (Math.random() < 0.3) FX.part(h[0] + rand(-0.4, 0.4), rand(0.3, 1.2), h[2] + rand(-0.4, 0.4), 0, 0.4, 0, 0.1, 0.02, 0.6, [0.75, 0.92, 1], 0.9, 3); }
  // snared by roots: can't move at all for a moment
  if (run.rootT > 0) run.rootT -= dt;
  const top = hero.topSpeed * (1 - run.contactSlow) * (Z && Z.slow ? Z.slow : 1) * (run.rushT > 0 ? 1 + run.rushPower : 1) * (run.chillT > 0 ? 0.6 : 1) * (run.rootT > 0 ? 0 : 1);
  const k = 1 - Math.exp(-dt / (Z && Z.slide ? 0.55 : 0.045));
  if (Z && Z.burn) {
    run.burnT = (run.burnT || 0) - dt;
    if (run.burnT <= 0) { run.burnT = 0.5; hurtHero(Z.burn * 0.5 * run.info.dmgMul, h[0], h[2] + 0.01); FX.burst(h[0], 0.3, h[2], 6, [1, 0.5, 0.1], 2, 0.1, 0.4, 0); }
  }
  run.vel[0] += (G.input.x * top - run.vel[0]) * k;
  run.vel[2] += (G.input.z * top - run.vel[2]) * k;
  h[0] += run.vel[0] * dt; h[2] += run.vel[2] * dt;
  // a turntable carries you round with it
  if (Z && Z.spin) zoneCarry(zone, Z, h, 0, 2, dt);
  HERO_PT.x = h[0]; HERO_PT.z = h[2];
  if (resolveCircle(HERO_PT, HERO_R)) { h[0] = HERO_PT.x; h[2] = HERO_PT.z; }
  hero.update(dt, run.vel, true);
  updateArenaFx(dt);
  updateTempZones(dt);

  gridBuild(run.enemies);
  updateEnemies(dt);
  updateSkills(dt);
  if (live) tickAbilities(dt);
  updateProjectiles(dt);
  updateEnemyShots(dt);
  updatePickups(dt);

  // regen
  if (run.stats.regen > 0 && run.hp > 0) run.hp = Math.min(run.maxHp, run.hp + run.maxHp * run.stats.regen * dt);
  secondWind(run);
  R.frame.lowHp = run.hp / run.maxHp < 0.25 ? 0.35 : 0;

  // victory check: the remaining enemies melt and every gem and coin flies to the hero
  const bossesDown = live && run.bossStarted && run.bosses.length && run.bosses.every(b => b.dying);
  if (bossesDown && run.endless) endlessBossDown(run);
  else if (bossesDown && run.rush && !rushBossDown(run)) { /* Boss Rush goes on to the next boss */ }
  else if (bossesDown) {
    run.won = true; run.endT = 0;
    for (const e of run.enemies) if (!e.dying && !e.boss) e.dying = 0.0001;
    for (const g of run.gems) g.pull = true;
    for (const p of run.pickups) if (p.kind === 'coin' || p.kind === 'scroll') p.pull = true;
    setState('victory');
  }
}

function runEvent(ev) {
  const run = G.run;
  if (ev.kind === 'swarm') {
    const h = G.hero.pos, r = VIEW.radius + 1.5, off = rand(0, TAU), n = Math.round(ev.n * run.info.rateMul);
    // a ring of stickmen closing in, with a gap to break out through (bigger in later chapters)
    for (let i = 0; i < n; i++) { const a = off + (i / n) * TAU * 0.75; const e = spawnEnemy('stickman', h[0] + Math.cos(a) * r, h[2] + Math.sin(a) * r); resolveCircle(e, e.radius); }
  } else if (ev.kind === 'elite') {
    const types = ELITE_TYPES.filter(k => k === 'stickman' || run.info.has[k]);
    const [x, z] = spawnPoint(2);
    spawnEnemy(pick(types), x, z, { elite: true });
  } else if (ev.kind === 'surge') {
    for (let i = 0; i < Math.round((ev.n || 18) * run.info.rateMul); i++) spawnFromMix();
  } else if (ev.kind === 'boss') {
    startBoss();
  } else if (ev.kind === 'mini') {
    spawnMiniboss(ev.k);
  } else if (ev.kind === 'gooblin') {
    spawnGooblin();
  } else if (ev.kind === 'eboss') {
    if (!run.bossStarted) startBoss(ev.ids);
  }
}

function spawnFromMix() {
  const run = G.run, t = run.t, ch = run.chapter;
  // Endless: any enemy at all, picked at random
  if (run.endless) {
    const type = pick(ENDLESS_POOL()), [x, z] = spawnPoint();
    spawnEnemy(type, x, z, { elite: ELITE_TYPES.includes(type) && Math.random() < ENDLESS.elite });
    return;
  }
  const w = { stickman: 1 };
  // each type joins after its unlock time; in later chapters it shows up sooner
  for (const k in ENEMY_MIX) { const [c0, t0, wt] = ENEMY_MIX[k]; if (ch >= c0 && t > t0 * (ch > c0 ? 0.8 : 1)) w[k] = wt; }
  // this map's own creatures
  const theme = THEME_ENEMIES[ARENA.theme && ARENA.theme.id];
  if (theme) for (const k in theme) if (t > theme[k][0]) w[k] = theme[k][1];
  let total = 0; for (const k in w) total += w[k];
  let r = Math.random() * total, type = 'stickman';
  for (const k in w) { r -= w[k]; if (r <= 0) { type = k; break; } }
  const [x, z] = spawnPoint();
  if (type === 'sprinter') {
    const n = randInt(3, 5), h = G.hero.pos, dx = h[0] - x, dz = h[2] - z, d = Math.hypot(dx, dz) || 1;
    for (let i = 0; i < n; i++) spawnEnemy('sprinter', x - dx / d * i * 0.8, z - dz / d * i * 0.8);
  } else if (type === 'stickman') {
    // stickmen arrive in small clumps
    const n = t < 60 ? randInt(1, 2) : randInt(1, 3);
    for (let i = 0; i < n; i++) spawnEnemy('stickman', x + rand(-0.9, 0.9), z + rand(-0.9, 0.9));
  } else if (type === 'rat' || type === 'pigeon') {
    const n = randInt(2, type === 'rat' ? 4 : 3);
    for (let i = 0; i < n; i++) spawnEnemy(type, x + rand(-0.8, 0.8), z + rand(-0.8, 0.8));
  } else if (type === 'toysoldier' || type === 'crabling' || type === 'ghost') {
    // toy soldiers march in a rank; crablings and ghosts come in little groups
    const n = type === 'ghost' ? randInt(2, 3) : 3, h = G.hero.pos, dx = h[0] - x, dz = h[2] - z, d = Math.hypot(dx, dz) || 1;
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 0.95; spawnEnemy(type, x - dz / d * o, z + dx / d * o); }
  } else spawnEnemy(type, x, z);
}

function updateEnemies(dt) {
  const run = G.run, h = G.hero.pos;
  let touching = 0;
  // big crowds: the slower checks (slowing ground, separation, scenery) run for half the crowd each frame
  const fr = run.frameN = (run.frameN || 0) + 1, crowd = run.enemies.length > 220;
  for (const e of run.enemies) {
    if (e.dying) { e.dying += dt / (e.boss ? 0.6 : 0.14); continue; }
    e.flash = Math.max(0, e.flash - dt); e.flashCd = (e.flashCd || 0) - dt;
    e.contactCd -= dt;
    e.slowT -= dt; if (e.slowT <= 0) e.slowMul = 1;
    if (ARENA.zones.length && !e.boss && (e.id + fr) % 3 === 0) {
      const z = zoneAt(e.x, e.z), Z = z && ZONE_KINDS[z.kind];
      if (Z && Z.slow) { e.slowMul = Math.min(e.slowMul, Z.slow); e.slowT = Math.max(e.slowT, 0.12); }
      if (Z && Z.spin) zoneCarry(z, Z, e, 'x', 'z', dt * 3);
    }
    e.spawnT = Math.max(0, e.spawnT - dt);
    e.auraTint = Math.max(0, e.auraTint - dt * 2);
    // frozen enemies (Frost Nova, the yeti's breath) stand still and do no harm until they thaw
    if (e.frozen > 0) { e.frozen -= dt; e.vx = e.vz = 0; if (e.act) e.act = null; e.aim = 0; }
    // trapped in a bubble (Bubble Trap): held off the ground, harmless, until it pops
    else if (e.bubbled > 0) { e.bubbled -= dt; e.vx = e.vz = 0; if (e.act) e.act = null; e.aim = 0; }
    else if (e.boss) updateBoss(e, dt);
    else if (e.mini) updateMini(e, dt);
    else updateEnemyAI(e, dt);
    // knockback
    e.x += e.kx * dt; e.z += e.kz * dt;
    const kd = Math.exp(-7 * dt); e.kx *= kd; e.kz *= kd;
    // squash spring
    e.squashV += (300 * (1 - e.squash) - 14 * e.squashV) * dt;
    e.squash = clamp(e.squash + e.squashV * dt, 0.6, 1.3);
    // hero contact
    const dx = e.x - h[0], dz = e.z - h[2], d = Math.hypot(dx, dz), rr = e.radius + HERO_R;
    // (anything well off the ground, a boss mid-leap or a hovering saucer, is overhead and can't be touched)
    if (d < rr && (e.y || 0) < 1 && G.hero.melt < 0.5 && !e.hidden && !(e.frozen > 0) && !(e.bubbled > 0) && !e.def.flee) {
      touching++;
      const push = (rr - d) * (e.boss ? 0.15 : 0.85);
      if (d > 1e-4) { e.x += dx / d * push; e.z += dz / d * push; }
      if (e.contactCd <= 0 && G.state === 'run' && e.spawnT <= 0) { hurtHero(e.contactDmg || e.dmg, e.x, e.z); e.contactCd = 0.75; }
      thornsTouch(e, dx, dz, d);
    }
  }
  run.contactSlow = Math.min(0.3, touching * 0.05);
  // separation between enemies (inline grid scan: this is the hottest loop with a big crowd)
  const cell = GRID.cell, map = GRID.map;
  for (const e of run.enemies) {
    if (e.dying || (crowd && !e.boss && (e.id + fr) % 2)) continue;
    const r = e.radius + (e.boss ? 1.6 : 0.7);
    const x0 = Math.floor((e.x - r) / cell), x1 = Math.floor((e.x + r) / cell), z0 = Math.floor((e.z - r) / cell), z1 = Math.floor((e.z + r) / cell);
    // in a packed crowd a handful of neighbours is plenty: stop after 18 looks
    let looks = e.boss ? 1e9 : 18;
    for (let cx = x0; cx <= x1 && looks > 0; cx++) for (let cz = z0; cz <= z1 && looks > 0; cz++) {
      const a = map.get(gkey(cx, cz));
      if (!a) continue;
      for (let i = 0; i < a.length && looks > 0; i++) {
        const o = a[i];
        looks--;
        if (o === e || o.dying || (o.id < e.id && !(crowd && !o.boss && (o.id + fr) % 2))) continue;
        const dx = o.x - e.x, dz = o.z - e.z, rr = e.radius + o.radius, d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr || d2 < 1e-8) continue;
        const d = Math.sqrt(d2), ov = (rr - d) * 0.5, tot = e.mass + o.mass;
        const ex = dx / d * ov, ez = dz / d * ov;
        e.x -= ex * (o.mass / tot) * 2; e.z -= ez * (o.mass / tot) * 2;
        o.x += ex * (e.mass / tot) * 2; o.z += ez * (e.mass / tot) * 2;
      }
    }
  }
  for (const e of run.enemies) {
    if (e.dying || (e.y || 0) > 0.6 || e.def.ghost || (crowd && !e.boss && (e.id + fr) % 2 === 1)) continue;
    const hit = resolveCircle(e, e.radius);
    if (hit && e.boss && e.ai.state === 'charge') bossBonk(e, hit);
  }
  run.enemies = run.enemies.filter(e => !(e.dying >= 1));
}

// move a point (o[ix], o[iz]) round a turntable zone: rim speed Z.spin, slower toward the middle
function zoneCarry(zone, Z, o, ix, iz, dt) {
  const rx = o[ix] - zone.x, rz = o[iz] - zone.z, r = Math.hypot(rx, rz) || 1, v = Z.spin * Math.min(1, r / zone.r) / r;
  o[ix] += -rz * v * dt; o[iz] += rx * v * dt;
}
const STEER = [0, 0];
function updateEnemyAI(e, dt) {
  if (e.def.flee) { fleeAI(e, dt); return; }
  if (e.def.burrow && burrowAI(e, dt)) return;
  const h = G.hero.pos;
  let dx = h[0] - e.x, dz = h[2] - e.z;
  const d = Math.hypot(dx, dz) || 1;
  dx /= d; dz /= d;
  // relocate stragglers far behind to the front
  if (d > VIEW.radius * 1.7 && !e.elite) {
    const [x, z] = spawnPoint(); e.x = x; e.z = z; return;
  }
  // ghosts drift straight through scenery; everything else steers around it
  if (!e.def.ghost) { steerAround(e.x, e.z, e.radius, dx, dz, d, STEER); dx = STEER[0]; dz = STEER[1]; }
  if (e.def.weave && d > 1.5) {
    // sway from side to side on the way in
    const w = Math.sin(G.run.t * 2.4 + e.id * 1.7) * e.def.weave, c = Math.cos(w), s = Math.sin(w), ox = dx;
    dx = ox * c - dz * s; dz = ox * s + dz * c;
  }
  if (e.def.float && !(e.bubbled > 0)) e.y = e.def.float + Math.sin(G.run.t * 3 + e.id) * 0.1;
  e.cool = (e.cool || 0) - dt;
  if (e.act) { enemyAct(e, dt, d, dx, dz); return; }
  if (e.def.ai && e.cool <= 0 && e.spawnT <= 0 && startEnemyAct(e, d, dx, dz)) return;
  let want = e.speed * e.slowMul;
  if (e.def.ai === 'toss' && d < 4.5) want = -e.speed * 0.6;
  if (e.def.ranged) {
    if (e.aim > 0) {
      want = 0;
      e.aim += dt;
      if (e.aim > 0.45) { fireArrow(e); e.aim = 0; e.reload = 3.2; }
    } else {
      e.reload -= dt;
      if (d < 6.5 && e.reload <= 0 && onScreen(e.x, e.z, -0.5)) { e.aim = 0.001; if (e.def.shotKind !== 'bullet') AUDIO.play('throw'); }
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

// the mole: tunnels unseen toward the hero (only a moving mound of dirt shows, and nothing can hit it), bursts up
// close by to lunge, and after a while dives back under. Returns true while it is underground.
function burrowAI(e, dt) {
  const h = G.hero.pos;
  if (e.under === undefined) { e.under = true; e.hidden = true; e.upT = 0; e.underT = 0; }
  if (!e.under) {
    e.upT += dt;
    if (e.upT > 6 && !e.act && Math.hypot(h[0] - e.x, h[2] - e.z) > 3.5) {
      e.under = true; e.hidden = true; e.underT = 0;
      FX.burst(e.x, 0.3, e.z, 10, [0.42, 0.34, 0.26], 3, 0.12, 0.5, 1, 2);
    }
    return false;
  }
  let dx = h[0] - e.x, dz = h[2] - e.z;
  const d = Math.hypot(dx, dz) || 1;
  e.underT += dt;
  if (d < 2.6 || e.underT > 9) {
    e.under = false; e.hidden = false; e.upT = 0; e.cool = 0.25; e.squash = 0.62; e.squashV = 6;
    FX.burst(e.x, 0.4, e.z, 16, [0.45, 0.36, 0.28], 4.5, 0.14, 0.6, 1, 3);
    FX.crack(e.x, e.z, 1.1);
    AUDIO.play('punch', 0.7);
    return false;
  }
  if (d > VIEW.radius * 1.7) { const [x, z] = spawnPoint(); e.x = x; e.z = z; return true; }
  dx /= d; dz /= d;
  steerAround(e.x, e.z, e.radius, dx, dz, d, STEER);
  e.x += STEER[0] * e.speed * 1.35 * dt; e.z += STEER[1] * e.speed * 1.35 * dt;
  e.yaw = Math.atan2(STEER[0], STEER[1]);
  if (Math.random() < dt * 9) FX.part(e.x + rand(-0.3, 0.3), 0.1, e.z + rand(-0.3, 0.3), rand(-0.6, 0.6), rand(1, 2.2), rand(-0.6, 0.6), 0.07, 0.03, 0.5, [0.4, 0.32, 0.25], 1, 1, 6);
  return true;
}

// ---------- weapon attacks: a short wind-up over a floor warning, then the hit ----------
function startEnemyAct(e, d, dx, dz) {
  const D = e.def, reach = D.reach || 1.0;
  let a = null;
  if (D.ai === 'lunge' && d < 2.8 && onScreen(e.x, e.z, -0.3)) {
    a = { kind: 'lunge', clip: 'throw', dir: [dx, dz] };
    addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.32, len: 2.8, rot: Math.atan2(dx, dz), dur: 0.45 });
  } else if (D.ai === 'chop' && d < reach + e.radius + HERO_R + 0.35) {
    const off = reach * 0.75 + e.radius * 0.4;
    a = { kind: 'chop', clip: 'slam', cx: e.x + dx * off, cz: e.z + dz * off, r: reach * 0.8 + 0.25 };
    addTele({ kind: 'circle', x: a.cx, z: a.cz, r: a.r, dur: D.wind || 0.55 });
  } else if (D.ai === 'toss' && d > 3.5 && d < 8.5 && onScreen(e.x, e.z, -0.5)) {
    a = { kind: 'toss', clip: 'throw' };
  } else if (D.ai === 'charge' && d > 2 && d < 7.5 && onScreen(e.x, e.z, -0.3)) {
    // paws the ground over a long lane warning, then thunders straight down it
    a = { kind: 'charge', clip: 'slam', dir: [dx, dz] };
    addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.6, len: 8.5, rot: Math.atan2(dx, dz), dur: 0.75 });
  } else if (D.ai === 'bomb' && d < 1.6) {
    a = { kind: 'bomb', clip: 'idle' };
    addTele({ kind: 'circle', x: e.x, z: e.z, r: 1.8, dur: 0.75 });
    AUDIO.play('drip');
  }
  if (!a) return false;
  a.t = 0; a.u = 0;
  e.act = a; e.vx = e.vz = 0;
  return true;
}
function enemyAct(e, dt, d, dx, dz) {
  const a = e.act, run = G.run, h = G.hero.pos, D = e.def, mul = run.info.dmgMul * (e.elite ? 1.3 : 1);
  a.t += dt;
  e.vx *= 0.8; e.vz *= 0.8;
  if (a.kind === 'lunge') {
    e.yaw = angleLerp(e.yaw, Math.atan2(a.dir[0], a.dir[1]), Math.min(1, dt * 14));
    if (a.t < 0.45) a.u = a.t / 0.45 * 0.55;
    else if (a.t < 0.65) {
      a.u = 0.55 + (a.t - 0.45) / 0.2 * 0.2;
      e.x += a.dir[0] * 11 * dt; e.z += a.dir[1] * 11 * dt;
      const reach = 0.95 * e.scale, tx = e.x + a.dir[0] * reach, tz = e.z + a.dir[1] * reach;
      if (!a.hit && (Math.hypot(h[0] - tx, h[2] - tz) < HERO_R + 0.45 || d < e.radius + HERO_R + 0.2)) { a.hit = true; hurtHero(D.hit * mul, e.x, e.z); }
    } else if (a.t < 1.0) a.u = 0.75 + (a.t - 0.65) / 0.35 * 0.24;
    else { e.act = null; e.cool = 3.6; }
  } else if (a.kind === 'chop') {
    const W = D.wind || 0.55;
    e.yaw = angleLerp(e.yaw, Math.atan2(a.cx - e.x, a.cz - e.z), Math.min(1, dt * 10));
    if (a.t < W) a.u = a.t / W * 0.55;
    else if (!a.done) {
      a.done = true; a.u = 0.6;
      if (Math.hypot(h[0] - a.cx, h[2] - a.cz) < a.r + HERO_R * 0.5) hurtHero(D.hit * mul, a.cx, a.cz);
      FX.ring(a.cx, a.cz, a.r * 1.3, [1, 0.85, 0.6], 0.3); FX.crack(a.cx, a.cz, a.r * 1.1);
      FX.burst(a.cx, 0.2, a.cz, 8, [0.6, 0.55, 0.5], 3.5, 0.1, 0.4, 2);
      G.cam.shake = Math.max(G.cam.shake, 0.04); AUDIO.play('punch');
    } else if (a.t < W + 0.45) a.u = 0.6 + (a.t - W) / 0.45 * 0.39;
    else { e.act = null; e.cool = 2.2; }
  } else if (a.kind === 'toss') {
    e.yaw = angleLerp(e.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10));
    if (a.t < 0.5) a.u = a.t / 0.5 * 0.6;
    else if (!a.done) { a.done = true; a.u = 0.62; throwJavelin(e, D.hit * mul); }
    else if (a.t < 0.85) a.u = 0.62 + (a.t - 0.5) / 0.35 * 0.37;
    else { e.act = null; e.cool = 3.2; }
  } else if (a.kind === 'charge') {
    e.yaw = angleLerp(e.yaw, Math.atan2(a.dir[0], a.dir[1]), Math.min(1, dt * 14));
    if (a.t < 0.75) a.u = a.t / 0.75 * 0.5;
    else if (a.t < 1.33) {
      a.clip = 'run'; a.u = (a.t * 3.2) % 1;
      e.x += a.dir[0] * 14 * dt; e.z += a.dir[1] * 14 * dt;
      if (!a.hit && Math.hypot(h[0] - e.x, h[2] - e.z) < e.radius + HERO_R + 0.25) { a.hit = true; hurtHero(D.hit * mul, e.x, e.z); run.vel[0] += a.dir[0] * 8; run.vel[2] += a.dir[1] * 8; }
      if (Math.random() < 0.6) FX.burst(e.x - a.dir[0] * 0.5, 0.15, e.z - a.dir[1] * 0.5, 1, [0.78, 0.62, 0.45], 2, 0.12, 0.45, 2);
    } else { e.act = null; e.cool = 4.2; }
  } else if (a.kind === 'bomb') {
    e.flash = Math.sin(a.t * 32) > 0 ? 0.05 : 0;
    a.u = (a.t * 2) % 1;
    e.squashV += Math.sin(a.t * 40) * 0.6;
    if (a.t >= 0.75) {
      if (Math.hypot(h[0] - e.x, h[2] - e.z) < 1.8 + HERO_R * 0.5) hurtHero(D.hit * mul, e.x, e.z);
      enemiesInRadius(e.x, e.z, 1.8, o => { if (o !== e && !o.boss) hurtEnemy(o, 20, (o.x - e.x) * 3, (o.z - e.z) * 3, { sound: false }); });
      if (D.burstZone) tempZone(D.burstZone, e.x, e.z, 1.7, 3.5);
      FX.ring(e.x, e.z, 2.6, [1, 0.7, 0.3], 0.4); FX.scorch(e.x, e.z, 2.0);
      FX.burst(e.x, 0.6, e.z, 22, [1, 0.6, 0.2], 6, 0.14, 0.5, 0);
      FX.glow(e.x, 0.6, e.z, 2.4, [1, 0.6, 0.25], 0.25);
      for (let i = 0; i < 4; i++) FX.smoke(e.x + rand(-0.6, 0.6), 0.5, e.z + rand(-0.6, 0.6), 0.9, [0.3, 0.28, 0.3], 0.8, 0.9);
      G.cam.shake = Math.max(G.cam.shake, 0.09); AUDIO.play('boom');
      e.act = null; e.hp = 0; killEnemy(e);
    }
  }
}
function throwJavelin(e, dmg) {
  const run = G.run, h = G.hero.pos, v = run.vel;
  const o = { x: h[0] + v[0] * 0.55, z: h[2] + v[2] * 0.55 };
  resolveCircle(o, 0.3);
  const dist = Math.hypot(o.x - e.x, o.z - e.z);
  const dur = Math.max(0.55, dist / 10);
  addTele({ kind: 'circle', x: o.x, z: o.z, r: 0.6, dur });
  run.eShots.push({ kind: 'javelin', sx: e.x, sy: 1.3, sz: e.z, tx: o.x, tz: o.z, x: e.x, y: 1.3, z: e.z, t: 0, dur, radius: 0.6, dmg, life: dur + 0.5, peak: 2.2 });
  AUDIO.play('throw');
}

function fireArrow(e) {
  if (e.def.shotKind === 'bullet') AUDIO.play('bang');
  const h = G.hero.pos, dx = h[0] - e.x, dz = h[2] - e.z, d = Math.hypot(dx, dz) || 1;
  G.run.eShots.push({ kind: e.def.shotKind || 'arrow', ph: rand(0, 10), x: e.x + dx / d * 0.4, y: 0.75, z: e.z + dz / d * 0.4, vx: dx / d * (e.def.shotSpeed || 10), vy: 0, vz: dz / d * (e.def.shotSpeed || 10), dmg: e.def.shot * G.run.info.dmgMul * (e.elite ? 2 : 1), r: 0.2, life: 1.2 });
}

function updateEnemyShots(dt) {
  const run = G.run, h = G.hero.pos;
  for (const s of run.eShots) {
    s.life -= dt;
    if (s.kind === 'javelin') {
      s.t += dt;
      const u = clamp(s.t / s.dur, 0, 1);
      s.x = lerp(s.sx, s.tx, u); s.z = lerp(s.sz, s.tz, u); s.y = lerp(s.sy, 0.3, u) + Math.sin(u * Math.PI) * s.peak;
      if (u >= 1) {
        s.life = 0;
        if (Math.hypot(h[0] - s.tx, h[2] - s.tz) < s.radius + HERO_R * 0.6) hurtHero(s.dmg, s.tx, s.tz);
        FX.burst(s.tx, 0.2, s.tz, 6, [0.6, 0.55, 0.5], 3, 0.08, 0.35, 2);
        FX.crack(s.tx, s.tz, 0.6);
      }
      continue;
    }
    if (s.kind === 'rball') {
      // rubber balls: bounce on the floor and off walls and scenery, then wear out
      s.vy -= 16 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (s.y < s.r) { s.y = s.r; s.vy = Math.abs(s.vy) * 0.72; }
      const ox = s.x, oz = s.z;
      if (resolveCircle(s, s.r)) {
        const nx = s.x - ox, nz = s.z - oz, nl = Math.hypot(nx, nz);
        if (nl > 1e-5) { const vn = (s.vx * nx + s.vz * nz) / nl; if (vn < 0) { s.vx -= 2 * vn * nx / nl; s.vz -= 2 * vn * nz / nl; } }
      }
      if (Math.hypot(s.x - h[0], s.z - h[2]) < s.r + HERO_R && s.y < 1.4) { s.life = 0; hurtHero(s.dmg, s.x, s.z); FX.burst(s.x, s.y, s.z, 6, s.col, 3, 0.1, 0.3, 1); }
      continue;
    }
    if (s.kind === 'icicle') {
      // icicles drop straight onto a telegraphed spot and stay stuck in the ground for a while
      s.t += dt;
      const u = clamp(s.t / s.dur, 0, 1);
      s.y = s.sy * (1 - u * u);
      if (u >= 1) {
        s.life = 0;
        if (Math.hypot(h[0] - s.x, h[2] - s.z) < s.radius + HERO_R * 0.6) hurtHero(s.dmg, s.x, s.z);
        enemiesInRadius(s.x, s.z, s.radius, o => { if (!o.boss) hurtEnemy(o, 20, 0, 0, { sound: false }); });
        FX.burst(s.x, 0.4, s.z, 12, [0.8, 0.94, 1], 4.5, 0.1, 0.5, 1);
        FX.ring(s.x, s.z, s.radius * 1.6, [0.7, 0.9, 1], 0.35);
        tempProp('icespike', s.x, s.z, 0.5, s.stay);
        G.cam.shake = Math.max(G.cam.shake, 0.06);
        AUDIO.play('hit', 0.7);
      }
      continue;
    }
    if (s.lob || s.kind === 'boulder' || s.kind === 'rocket' || s.kind === 'magma' || s.kind === 'cannon') {
      // lobbed shots: fly in an arc to a telegraphed spot and burst there
      s.t += dt;
      const u = clamp(s.t / s.dur, 0, 1);
      s.x = lerp(s.sx, s.tx, u); s.z = lerp(s.sz, s.tz, u); s.y = lerp(s.sy, 0.4, u) + Math.sin(u * Math.PI) * (s.peak ?? 5);
      s.spin += dt * 6;
      if ((s.kind === 'rocket' || s.kind === 'cannon') && Math.random() < 0.8) FX.smoke(s.x, s.y, s.z, 0.35, [0.75, 0.75, 0.8], 0.6, 0.3);
      if (u >= 1) {
        s.life = 0;
        if (Math.hypot(h[0] - s.tx, h[2] - s.tz) < s.radius + HERO_R * 0.6) hurtHero(s.dmg, s.tx, s.tz);
        FX.ring(s.tx, s.tz, s.radius * 1.4, [1, 0.8, 0.6], 0.4);
        FX.crack(s.tx, s.tz, s.radius * 1.6);
        FX.burst(s.tx, 0.3, s.tz, 10, [0.55, 0.5, 0.45], 4, 0.14, 0.5, 2);
        // magma splashes into a puddle of lava that burns for a while
        if (s.kind === 'magma') { tempZone('lava', s.tx, s.tz, s.pool, s.stay); FX.burst(s.tx, 0.4, s.tz, 14, [1, 0.55, 0.15], 5, 0.12, 0.6, 0); }
        if (s.onLand) s.onLand(s);
        G.cam.shake = Math.max(G.cam.shake, 0.1);
        AUDIO.play('boom');
      }
      continue;
    }
    // bubbles drift toward the hero and bob as they go
    if (s.home) {
      const hx = h[0] - s.x, hz = h[2] - s.z, hl = Math.hypot(hx, hz) || 1, sp = Math.hypot(s.vx, s.vz);
      s.vx += (hx / hl * sp - s.vx) * s.home * dt; s.vz += (hz / hl * sp - s.vz) * s.home * dt;
      s.y = 0.9 + Math.sin(s.life * 3 + s.ph) * 0.25;
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
    // (at sea everything floats over to the ship)
    if ((p.kind === 'coin' || p.kind === 'scroll' || run.sea) && !p.pull && d < mag) p.pull = true;
    if (p.pull) { p.sp = Math.min(p.sp + 40 * dt, 30); const st = Math.max(4, p.sp) * dt; if (st < d) { p.x += dx / d * st; p.z += dz / d * st; } }
    if (d < (p.kind === 'chest' || p.kind === 'heart' ? 0.85 : 0.6) && p.t > 0.35) {
      p.dead = true;
      if (p.kind === 'coin') { run.coins += p.value; AUDIO.play('coin'); FX.star(p.x, 0.6, p.z, 0.35, COLORS.gold); }
      else if (p.kind === 'heart') { run.hp = Math.min(run.maxHp, run.hp + run.maxHp * 0.3); AUDIO.play('levelup'); FX.burst(h[0], 1, h[2], 12, [1, 0.4, 0.55], 3, 0.12, 0.6, 3); addNumberAt(h[0], 2.1, h[2], run.maxHp * 0.3, [0.4, 1, 0.6]); }
      else if (p.kind === 'magnet') { for (const g of run.gems) g.pull = true; for (const q of run.pickups) if (q.kind === 'coin' || q.kind === 'scroll') q.pull = true; AUDIO.play('shield'); FX.ring(h[0], h[2], 3, COLORS.mint, 0.5); }
      else if (p.kind === 'chest') { run.chestQueued = (run.chestQueued || 0) + 1; AUDIO.play('chest'); }
      else if (p.kind === 'scroll') { run.scrolls = (run.scrolls || 0) + 1; AUDIO.play('chest'); FX.burst(p.x, 0.6, p.z, 14, COLORS.gold, 3, 0.12, 0.6, 3); }
    }
  }
  run.pickups = run.pickups.filter(p => !p.dead);
}

// ---------- camera ----------
function updateCamera(dt, snap, noShake) {
  if (G.run && G.run.cave) { caveCamera(dt); return; }
  if (G.run && G.run.sea) { seaCamera(dt, snap); return; }
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
      // (a theme can let the view run further past its top edge: the crater shows off its cave mouth)
      const pad = 2.5, ex = ARENA.hw + pad, ez = ARENA.hd + pad, ezTop = ARENA.hd + (ARENA.theme && ARENA.theme.topPad || pad);
      const lx = -ex - x0, hx = ex - x1, lz = -ezTop - z0, hz = ez - z1;
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
  // Endless and Boss Rush pay a quarter
  const modeMul = run.endless || run.rush ? 0.25 : 1;
  const reward = Math.round((run.rush ? run.rushK * 70 * (1 + run.rushK * 0.1) : won ? run.info.reward : run.endless ? run.t / 3 : 0) * modeMul);
  run.coins = Math.round(run.coins * (1 + ((run.gear && run.gear.gold) || 0) / 100) * modeMul);
  run.reward = reward;
  run.earned = run.coins + reward;
  sv.coins += run.earned;
  if (run.sea) seaFinish(run, won);
  else if (run.endless) { run.newBest = run.t > (sv.endlessBest || 0); if (run.newBest) sv.endlessBest = Math.round(run.t); }
  else if (run.rush) {
    // best = most bosses beaten; a full clear also keeps its fastest time
    run.newBest = run.rushK > (sv.rushBest || 0) || (won && (!sv.rushTime || run.t < sv.rushTime));
    sv.rushBest = Math.max(sv.rushBest || 0, run.rushK);
    if (won && (!sv.rushTime || run.t < sv.rushTime)) sv.rushTime = Math.round(run.t);
  } else { const best = sv.best[run.chapter] || 0; if (run.t > best) sv.best[run.chapter] = Math.round(run.t); }
  if (won && !run.rush && !run.endless && !run.sea) { sv.cleared[run.chapter] = true; sv.chapter = Math.min(CHAPTER_COUNT, Math.max(sv.chapter, run.chapter + 1)); }
  sv.scrolls = (sv.scrolls || 0) + (run.scrolls || 0);
  // achievements count chapter runs only
  if (!run.endless && !run.rush) { sv.stats.runs++; sv.stats.kills += run.kills; goalsAddRun(run); }
  saveGame();
  AUDIO.play(won ? 'win' : 'lose');
  setState('results');
}
