// ============================================================
// The sea's enemies and upgrades. Every upgrade is mounted on the ship: each ship lists where its mounts
// go (SHIP_MOUNTS), so a new ship takes all of them along, each in its own place.
// ============================================================
Object.assign(ENEMY_TYPES, {
  // goo pirates treading water; floats (arm bands, an inner tube) soak up damage until they pop
  pswim: { model: 'pswim', hp: 11, speed: 2.0, dmg: 4, xp: 1, radius: 0.42, scale: 1.25, tint: '#e8414a', mass: 1, sea: true },
  pfloat: { model: 'pfloat', hp: 12, shell: 14, speed: 1.85, dmg: 5, xp: 2, radius: 0.46, scale: 1.25, tint: '#8a5ad8', mass: 1.3, sea: true },
  ptube: { model: 'ptube', hp: 14, shell: 30, speed: 1.6, dmg: 6, xp: 3, radius: 0.58, scale: 1.3, tint: '#2fae6a', mass: 2, sea: true },
});

// Where things go on each ship (local x across, z along the keel, y height above the waterline).
// guns: cannon spots in the order they fill; ms: how big the mounted things are drawn
const SHIP_MOUNTS = {
  raft: { ms: 0.78, guns: [[0.55, 0.78, 0.17], [-0.55, 0.78, 0.17], [0.55, -0.6, 0.17], [-0.55, -0.6, 0.17]] },
  canoe: { ms: 0.8, guns: [[0, 1.25, 0.14], [0, -1.35, 0.14], [0, 0.8, 0.14], [0, -0.95, 0.14]] },
  sloop: { ms: 1.0, guns: [[0.75, 1.0, 0.62], [-0.75, 1.0, 0.62], [0.75, -0.2, 0.62], [-0.75, -0.2, 0.62]] },
  galleon: { ms: 1.12, guns: [[1.0, 1.6, 0.85], [-1.0, 1.6, 0.85], [1.0, 0.2, 0.85], [-1.0, 0.2, 0.85]] },
  yacht: { ms: 1.2, guns: [[1.0, -1.2, 1.0], [-1.0, -1.2, 1.0], [1.0, -2.6, 1.0], [-1.0, -2.6, 1.0]] },
  cruise: { ms: 1.35, guns: [[1.2, 3.5, 2.1], [-1.2, 3.5, 2.1], [1.2, 0.5, 2.1], [-1.2, 0.5, 2.1]] },
  cargo: { ms: 1.5, guns: [[1.3, 2.0, 2.5], [-1.3, 2.0, 2.5], [1.3, -2.0, 2.5], [-1.3, -2.0, 2.5]] },
};
const mountsOf = D => SHIP_MOUNTS[D.id] || SHIP_MOUNTS.raft;

// ---------- the upgrades ----------
Object.assign(SKILLS, {
  // the ship itself: always in the first slot; every level is a bigger, tougher ship that rams harder
  ship: {
    sea: true, max: SHIPS.length, name: 'Ship', intro: 'Your ship. Each level builds a bigger, tougher one that rams harder; everything mounted on it comes along.', icon: { type: 13, colw: 0 },
    fields: [['name', 'Ship'], ['hull', 'Hull', '%'], ['ram', 'Ram']],
    levels: SHIPS.map(D => ({ name: D.name, hull: Math.round(100 * (1 + D.hull)), ram: D.ram })),
  },
  cannon: {
    sea: true, name: 'Homing Cannon', intro: 'Deck cannons that turn to fire cannonballs which curve onto their target.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Cannons'], ['splash', 'Splash', 'm']],
    levels: L10({ dmg: [10, 11, 12, 13, 15, 16, 18, 20, 22, 25], cd: [1.3, 1.25, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95, 0.9, 0.85], count: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4], splash: [0, 0, 0, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4] }),
  },
});

SKILL_HOOKS.ship = {
  update() {},
  // a new ship: the old one bursts apart in a splash and the new one rises out of it
  onLevel(s) {
    const run = G.run, S = OC.ship;
    if (!run || !run.sea || s.lvl < 2) return;
    const before = run.maxHp;
    seaStats(run);
    run.hp = Math.min(run.maxHp, run.hp + (run.maxHp - before) + run.maxHp * 0.25);
    const D = shipDef();
    FX.ring(S.x, S.z, D.len * 0.9, [0.85, 0.97, 1], 0.7, 1);
    FX.burst(S.x, 0.4, S.z, 40, [0.85, 0.95, 1], 7, 0.14, 0.7, 2, 3);
    FX.burst(S.x, D.deck + 0.3, S.z, 26, [1, 0.85, 0.4], 5, 0.1, 0.6, 3, 2);
    for (const e of run.enemies) if (e.grab) seaUnboard(e, 6);
    G.cam.shake = Math.max(G.cam.shake, 0.2);
    AUDIO.play('splash'); AUDIO.play('levelup', 0.8);
    UI.banner(D.name.toUpperCase() + '!');
  },
};

// the cannons: each turns toward its own target and fires a ball that arcs up and curves onto it
SKILL_HOOKS.cannon = {
  update(s, L, dt) {
    const run = G.run, D = shipDef(), M = mountsOf(D), S = OC.ship;
    s.st.cd = (s.st.cd ?? 0.5) - dt;
    s.st.aim = s.st.aim || [];
    const n = Math.min(L.count, M.guns.length);
    for (let i = 0; i < n; i++) {
      const g = M.guns[i], w = shipW(g[0], g[1]);
      const tgt = nearestEnemy(w[0], w[1], 15, s.st.taken);
      const want = tgt ? Math.atan2(tgt.x - w[0], tgt.z - w[1]) - S.yaw : (g[1] < 0 ? Math.PI : 0);
      s.st.aim[i] = angleLerp(s.st.aim[i] ?? want, want, Math.min(1, dt * 8));
    }
    if (s.st.cd > 0 || OC.sink) return;
    const taken = new Set();
    let fired = false;
    for (let i = 0; i < n; i++) {
      const g = M.guns[i], w = shipW(g[0], g[1]);
      const tgt = nearestEnemy(w[0], w[1], 15, taken) || nearestEnemy(w[0], w[1], 15);
      if (!tgt) continue;
      taken.add(tgt);
      const a = S.yaw + s.st.aim[i], ms = M.ms;
      const mx = w[0] + Math.sin(a) * 0.45 * ms, mz = w[1] + Math.cos(a) * 0.45 * ms, my = g[2] + 0.32 * ms + S.y;
      OC.balls.push({ x: mx, y: my, z: mz, vx: Math.sin(a) * 11, vy: 3.2, vz: Math.cos(a) * 11, tgt, t: 0, dmg: L.dmg, splash: L.splash, spin: rand(0, TAU) });
      FX.smoke(mx, my, mz, 0.3, [0.9, 0.9, 0.92], 0.6, 0.8);
      FX.glow(mx, my, mz, 0.5, [1, 0.75, 0.35], 0.08);
      s.st.kick = s.st.kick || []; s.st.kick[i] = 1;
      fired = true;
    }
    if (fired) { AUDIO.play('cannon'); s.st.cd = L.cd * cdMul(); }
    else s.st.cd = 0.15;
    if (s.st.kick) for (let i = 0; i < s.st.kick.length; i++) s.st.kick[i] = Math.max(0, (s.st.kick[i] || 0) - dt * 5);
  },
};
// cannonballs: homing, with a little arc; they splash into the sea if they lose their target
function updateSeaBalls(dt) {
  const run = G.run;
  for (const b of OC.balls) {
    b.t += dt;
    const T = b.tgt && !b.tgt.dying ? b.tgt : null;
    if (T) {
      const dx = T.x - b.x, dz = T.z - b.z, d = Math.hypot(dx, dz) || 1, sp = Math.max(11, Math.hypot(b.vx, b.vz) + dt * 10);
      const turn = Math.min(1, dt * (4 + b.t * 10));
      b.vx += (dx / d * sp - b.vx) * turn; b.vz += (dz / d * sp - b.vz) * turn;
      // drop onto it as it closes in
      const want = (0.45 - b.y) * sp / Math.max(d, 0.5);
      b.vy += (want - b.vy) * Math.min(1, dt * 6);
    } else b.vy -= 14 * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (Math.random() < 0.5) FX.part(b.x, b.y, b.z, 0, 0.3, 0, 0.12, 0.3, 0.4, [0.85, 0.85, 0.9], 0.35, 2, 0, 1);
    let hit = null;
    if (T && Math.hypot(T.x - b.x, T.z - b.z) < T.radius + 0.25 && b.y < 1.4 * T.scale) hit = T;
    if (!hit) enemiesInRadius(b.x, b.z, 0.5, e => { if (!hit && !e.dying && b.y < 1.2) hit = e; });
    if (hit) {
      b.dead = true;
      const d = Math.hypot(b.vx, b.vz) || 1;
      hurtEnemy(hit, b.dmg, b.vx / d * 3, b.vz / d * 3);
      if (b.splash > 0) enemiesInRadius(b.x, b.z, b.splash * areaMul(), e => { if (e !== hit) hurtEnemy(e, b.dmg * 0.5, 0, 0, { sound: false }); });
      FX.burst(b.x, 0.4, b.z, 10, [1, 0.7, 0.3], 4, 0.1, 0.35, 1, 1.5);
      FX.burst(b.x, 0.2, b.z, 8, [0.85, 0.95, 1], 4, 0.1, 0.45, 2, 2.5);
      if (b.splash > 0) FX.ring(b.x, b.z, b.splash * areaMul() * 1.2, [1, 0.8, 0.5], 0.3, 0.7);
    } else if (b.y < 0 || b.t > 2.2) {
      b.dead = true;
      FX.burst(b.x, 0.1, b.z, 10, [0.85, 0.95, 1], 3.5, 0.1, 0.5, 2, 3);
      FX.ring(b.x, b.z, 0.9, [0.85, 0.97, 1], 0.4, 0.6);
      if (Math.random() < 0.5) AUDIO.play('splash', 0.6);
    }
  }
  OC.balls = OC.balls.filter(b => !b.dead);
}
function emitSeaShots() {
  for (const b of OC.balls) {
    pushImp(b.x, b.y, b.z, 0.26, Math.sin(b.spin + b.t * 6), Math.cos(b.spin + b.t * 6), 0.3, 1, 13, 0, 0, 0, 0, 0, 0, 1);
    pushDecal(b.x + 0.1, b.z + 0.08, 0.22, 0.2, 0, 1, 0, 0, 0.02, 0.06, 0.12, 0.3);
  }
}

// everything mounted on the ship, drawn where this ship keeps it
function seaDrawMounts(x, y, z, yaw, D) {
  const run = G.run, M = mountsOf(D), c = Math.cos(yaw), s = Math.sin(yaw);
  const at = (lx, lz) => [x + c * lx + s * lz, z - s * lx + c * lz];
  const cs = slotOf('cannon');
  if (cs && R.enemyDraw.scannon) {
    const L = skillL(cs), n = Math.min(L.count, M.guns.length), row = MODELS.defs.scannon.clips.still.row;
    for (let i = 0; i < n; i++) {
      const g = M.guns[i], a = yaw + ((cs.st.aim && cs.st.aim[i]) ?? (g[1] < 0 ? Math.PI : 0)), k = (cs.st.kick && cs.st.kick[i]) || 0;
      const p = at(g[0], g[1]);
      pushEnemy('scannon', false, p[0] - Math.sin(a) * k * 0.08, y + g[2], p[1] - Math.cos(a) * k * 0.08, a, row, M.ms * (1 + k * 0.06), 1, 0, 0, 0, 1, 1, 1);
    }
  }
}

// icons for the sea's upgrades: [icon key, model, framing]
const SEA_ICON_SHOTS = [
  ['skill-ship', 'raft', { yaw: 0.6, s: 1, d: 3.2, mid: 0.1 }],
  ['skill-cannon', 'scannon', { yaw: 0.9, s: 1.6, d: 1.9, mid: 0.35 }],
];
