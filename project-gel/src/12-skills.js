// ============================================================
// Skills: behaviors, hero body actions, projectiles and visuals
// ============================================================
const SKILL_HOOKS = {};
const areaMul = () => G.run.stats.areaMul;
const cdMul = () => G.run.stats.cdMul;
const extraShots = () => G.run.stats.extra;

function updateSkills(dt) {
  const run = G.run;
  G.hero.auraLevel = 0;
  for (const s of run.slots) {
    if (s.kind !== 'skill') continue;
    const L = SKILLS[s.id].levels[s.lvl - 1];
    SKILL_HOOKS[s.id].update(s, L, dt);
  }
  updateMines(dt); updateBombs(dt); updateWorms(dt); updateBuddies(dt); updateAxes(dt);
  for (const b of G.bolts) b.life -= dt;
  G.bolts = G.bolts.filter(b => b.life > 0);
}
function emitSkills() {
  const run = G.run;
  for (const s of run.slots) {
    if (s.kind !== 'skill') continue;
    const hook = SKILL_HOOKS[s.id];
    if (hook.emit) hook.emit(s, SKILLS[s.id].levels[s.lvl - 1]);
  }
}

// Densest cluster of enemies within range of a point -> [x, z] or null
function clusterTarget(x, z, range) {
  const c = GRID.cell;
  let best = null, bestN = 0;
  for (const [, list] of GRID.map) {
    if (!list.length) continue;
    const e0 = list[0];
    const cx = (Math.floor(e0.x / c) + 0.5) * c, cz = (Math.floor(e0.z / c) + 0.5) * c;
    if (Math.hypot(cx - x, cz - z) > range) continue;
    let n = 0, sx = 0, sz = 0;
    for (const e of list) if (!e.dying) { n++; sx += e.x; sz += e.z; }
    if (n > bestN || (n === bestN && Math.random() < 0.3)) { bestN = n; best = [sx / n, sz / n]; }
  }
  return best;
}
function shieldBlocks(e, px, pz) {
  if (!e.def || !e.def.shield || e.dying) return false;
  const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw);
  const dx = px - e.x, dz = pz - e.z, d = Math.hypot(dx, dz) || 1;
  return (fx * dx + fz * dz) / d > 0.35;
}
function blockedFx(x, y, z) { FX.burst(x, y, z, 6, [1, 0.85, 0.5], 4, 0.07, 0.25, 1); AUDIO.play('hit'); }

function addBolt(x0, y0, z0, x1, y1, z1, w, col, life = 0.14) {
  G.bolts.push({ a: [x0, y0, z0], b: [x1, y1, z1], w, col, life, max: life, seed: Math.random() * 100, jag: Math.hypot(x1 - x0, y1 - y0, z1 - z0) * 0.08 });
}

// ---------- Blob Ball ----------
SKILL_HOOKS.ball = {
  update(s, L, dt) {
    const st = s.st;
    st.t = (st.t ?? 0.4) - dt;
    if (st.t > 0) return;
    const hero = G.hero, h = hero.pos;
    const tgt = nearestEnemy(h[0], h[2], 8);
    if (!tgt) return;
    st.t = L.cd * cdMul();
    const count = L.count + extraShots();
    const tw = [tgt.x, 0.6 * tgt.scale, tgt.z];
    const fire = from => {
      const base = Math.atan2(tgt.x - from[0], tgt.z - from[2]);
      for (let i = 0; i < count; i++) {
        const a = base + (i - (count - 1) / 2) * 0.15;
        spawnProj('ball', from, [Math.sin(a) * 12, -0.3, Math.cos(a) * 12], { dmg: L.dmg, pierce: L.pierce, life: 0.85, r: 0.18 * areaMul(), hitR: 0.34 * areaMul() });
      }
      AUDIO.play('pop');
    };
    const arm = hero.freeArm(tw);
    if (arm >= 0) hero.thrust(arm, tw, 0.16 * areaMul(), 0, wp => fire(wp));
    else fire(hero.jointWorld('chest'));
  },
};

function spawnProj(kind, from, vel, o) {
  const p = { kind, x: from[0], y: from[1], z: from[2], vx: vel[0], vy: vel[1], vz: vel[2], t: 0, hit: new Set(), trail: [], ph: Math.random() * 10, ...o };
  G.run.proj.push(p);
  return p;
}

function updateProjectiles(dt) {
  const run = G.run;
  for (const p of run.proj) {
    p.t += dt; p.life -= dt;
    if (p.kind === 'ball') {
      p.x += p.vx * dt; p.y = Math.max(0.35, p.y + p.vy * dt); p.z += p.vz * dt;
      if (arenaSd(p.x, p.z) > 0) p.dead = true;
      enemiesInRadius(p.x, p.z, p.hitR, e => {
        if (p.dead || p.hit.has(e)) return;
        if (shieldBlocks(e, p.x, p.z)) { p.dead = true; blockedFx(p.x, p.y, p.z); return; }
        p.hit.add(e);
        const sp = Math.hypot(p.vx, p.vz) || 1;
        hurtEnemy(e, p.dmg, p.vx / sp * 3, p.vz / sp * 3);
        FX.droplets(p.x, p.y, p.z, 4, 0, 2.5, 0.045, R.goo.base);
        if (p.pierce-- <= 0) p.dead = true;
      });
      if (p.dead || p.life <= 0) { p.dead = true; FX.splat(p.x, p.z, 0.55 * areaMul(), R.goo.base, 1.4); FX.droplets(p.x, p.y, p.z, 3, 0, 2, 0.04, null); }
    } else if (p.kind === 'missile') {
      if (p.t < 0.28) { p.vy -= 14 * dt; }
      else {
        if (!p.target || p.target.dying) {
          const h = G.hero.pos, cands = [];
          gridQuery(h[0], h[2], 10, e => cands.push(e));
          p.target = cands.length ? pick(cands) : null;
        }
        const sp = Math.min(9, Math.hypot(p.vx, p.vy, p.vz) + 18 * dt);
        if (p.target) {
          const t = p.target, dx = t.x - p.x, dy = 0.6 * t.scale - p.y, dz = t.z - p.z, d = Math.hypot(dx, dy, dz) || 1;
          const k = Math.min(1, dt * 5.5);
          p.vx += (dx / d * sp - p.vx) * k; p.vy += (dy / d * sp - p.vy) * k; p.vz += (dz / d * sp - p.vz) * k;
        } else p.vy -= 6 * dt;
        const v = Math.hypot(p.vx, p.vy, p.vz) || 1;
        p.vx *= sp / v; p.vy *= sp / v; p.vz *= sp / v;
      }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 1.4) {
        enemiesInRadius(p.x, p.z, p.hitR, e => {
          if (p.dead) return;
          if (shieldBlocks(e, p.x, p.z)) { p.dead = true; blockedFx(p.x, p.y, p.z); return; }
          p.dead = true;
          hurtEnemy(e, p.dmg, p.vx * 0.3, p.vz * 0.3);
          if (p.splash > 0) enemiesInRadius(p.x, p.z, p.splash, o => { if (o !== e) hurtEnemy(o, p.dmg * 0.5, 0, 0, { sound: false }); });
        });
      }
      if (p.y <= 0.05) p.dead = true;
      if (p.dead || p.life <= 0) {
        p.dead = true;
        FX.droplets(p.x, Math.max(0.2, p.y), p.z, p.splash > 0 ? 8 : 4, 0.8, 3, 0.045, R.goo.accent);
        FX.glow(p.x, Math.max(0.2, p.y), p.z, 0.6 + p.splash, COLORS.violetHi, 0.15);
        if (p.splash > 0) FX.ring(p.x, p.z, p.splash * 1.2, COLORS.violetHi, 0.3);
      }
    }
    if (!p.dead) { p.trail.unshift([p.x, p.y, p.z]); if (p.trail.length > (p.kind === 'missile' ? 12 : 7)) p.trail.pop(); }
  }
  run.proj = run.proj.filter(p => !p.dead);
}

function explode(x, z, radius, dmg, colw, col) {
  const h = G.hero.pos;
  enemiesInRadius(x, z, radius, e => {
    const dx = e.x - x, dz = e.z - z, d = Math.hypot(dx, dz) || 1;
    hurtEnemy(e, dmg, dx / d * 6, dz / d * 6, { sound: false });
  });
  FX.splat(x, z, radius * 1.15, col, 2.2);
  FX.ring(x, z, radius * 1.25, colw > 1.5 ? [1, 0.6, 0.85] : COLORS.violetHi, 0.4);
  FX.droplets(x, 0.3, z, 14, colw, 5.5, 0.06, col);
  FX.glow(x, 0.6, z, radius * 1.4, colw > 1.5 ? [1, 0.6, 0.9] : [0.8, 0.7, 1.0], 0.22);
  for (let i = 0; i < 4; i++) FX.smoke(x + rand(-0.5, 0.5), 0.4, z + rand(-0.5, 0.5), radius * 0.45, [0.45, 0.4, 0.6], 0.7, 0.9);
  G.cam.shake = Math.max(G.cam.shake, 0.06 + (Math.hypot(x - h[0], z - h[2]) < 6 ? 0.03 : 0));
  AUDIO.play('boom');
}

// ---------- Blob Fists ----------
SKILL_HOOKS.fists = {
  onLevel(s) { G.hero.setArmCount(SKILLS.fists.levels[s.lvl - 1].fists); },
  update(s, L, dt) {
    const st = s.st, hero = G.hero, h = hero.pos;
    if (!st.timers) { st.timers = [0.2, 0.2 + L.cd * 0.5, 0.2 + L.cd * 0.25, 0.2 + L.cd * 0.75]; st.trails = [[], [], [], []]; }
    const reach = L.reach * areaMul();
    for (let i = 0; i < L.fists; i++) {
      st.timers[i] -= dt;
      const arm = hero.arms[i];
      // swoosh trail of the fist while it is moving
      const tr = st.trails[i];
      if (arm.action && arm.action.type === 'punch') { tr.unshift(hero.fistWorld(i)); if (tr.length > 10) tr.pop(); }
      else if (tr.length) tr.pop();
      if (st.timers[i] > 0 || arm.action || arm.grow < 0.9) continue;
      const tgt = nearestEnemy(h[0], h[2], reach + 0.4);
      if (!tgt) { st.timers[i] = 0.12; continue; }
      st.timers[i] = L.cd * cdMul();
      hero.punch(i, [tgt.x, 0.55 * tgt.scale + 0.25, tgt.z], reach, imp => fistImpact(imp, L));
    }
  },
  emit(s, L) {
    if (!s.st.trails) return;
    for (const tr of s.st.trails) {
      if (tr.length < 3) continue;
      const pts = [];
      for (const p of tr) pts.push(p[0], p[1], p[2]);
      R.ribStrip(pts, tr.length, 0.16, [0.75, 0.95, 1.0, u => (1 - u) * 0.85], 0, 0, 1, u => 1 - u * 0.8);
    }
  },
};
function fistImpact(imp, L) {
  const h = G.hero.pos;
  let hitAny = false;
  enemiesInRadius(imp[0], imp[2], 0.65 * areaMul(), e => {
    const dx = e.x - h[0], dz = e.z - h[2], d = Math.hypot(dx, dz) || 1;
    hurtEnemy(e, L.dmg, dx / d * 20, dz / d * 20, { sound: false }); hitAny = true;
  });
  if (L.shock) {
    enemiesInRadius(imp[0], imp[2], L.shock * areaMul(), e => { const dx = e.x - imp[0], dz = e.z - imp[2], d = Math.hypot(dx, dz) || 1; hurtEnemy(e, L.dmg * 0.5, dx / d * 8, dz / d * 8, { sound: false }); });
    FX.ring(imp[0], imp[2], L.shock * 2.2 * areaMul(), COLORS.violetHi, 0.35);
  }
  FX.ring(imp[0], imp[2], 1.1, [1, 1, 1], 0.22, 0.7);
  FX.glow(imp[0], imp[1], imp[2], 0.9, COLORS.violetHi, 0.14);
  FX.burst(imp[0], imp[1], imp[2], 6, [1, 1, 1], 5, 0.06, 0.2, 1, 0.5);
  if (hitAny) { FX.droplets(imp[0], imp[1], imp[2], 4, 5, 3, 0.05, ORANGE); G.cam.shake = Math.max(G.cam.shake, 0.035); }
  AUDIO.play('punch');
}

// ---------- Blob Grenade: a fused bomb dropped at your feet ----------
SKILL_HOOKS.grenade = {
  update(s, L, dt) {
    const st = s.st, run = G.run, hero = G.hero, h = hero.pos;
    st.t = (st.t ?? 1.5) - dt;
    if (st.t > 0) return;
    // wait until a small group is close, so the blast catches a few of them
    let near = 0;
    enemiesInRadius(h[0], h[2], 3.5, () => { near++; });
    if (near < 2) { st.t = 0.25; return; }
    st.t = L.cd * cdMul();
    const n = L.count + extraShots();
    for (let i = 0; i < n; i++) {
      hero.addBud({
        joint: i % 2 ? 'footA' : 'footB', off: [0, 0.05, -0.14], r: 0.15, grow: 0.2 + i * 0.12, colw: 1, glow: 0.3,
        onRelease: wp => {
          const a = rand(0, TAU), r = i ? rand(0.7, 1.3) : 0;
          run.bombs.push({ x: wp[0] + Math.cos(a) * r, z: wp[2] + Math.sin(a) * r, t: 0, fuse: L.fuse + i * 0.15, dmg: L.dmg, radius: L.radius * areaMul(), ph: rand(0, 10) });
          AUDIO.play('drip');
        },
      });
    }
  },
};
function updateBombs(dt) {
  const run = G.run;
  for (const b of run.bombs) {
    b.t += dt;
    if (b.t >= b.fuse) { b.dead = true; explode(b.x, b.z, b.radius, b.dmg, 1, R.goo.accent); }
  }
  run.bombs = run.bombs.filter(b => !b.dead);
}

// ---------- Blob Missile ----------
SKILL_HOOKS.missile = {
  update(s, L, dt) {
    const st = s.st;
    st.t = (st.t ?? 1) - dt;
    if (st.t > 0) return;
    const hero = G.hero, h = hero.pos;
    if (!nearestEnemy(h[0], h[2], 10)) return;
    st.t = L.cd * cdMul();
    const n = L.count + extraShots();
    for (let i = 0; i < n; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      hero.addBud({
        joint: 'chest', off: [(col - 1) * 0.17 + (row ? 0.085 : 0), 0.06 + row * 0.15, -0.24], r: 0.11, grow: 0.22 + i * 0.035, colw: 0.8, glow: 0.3,
        onRelease: wp => {
          spawnProj('missile', wp, [rand(-1.8, 1.8), 6.8, rand(-1.8, 1.8) - 0.8], { dmg: L.dmg, splash: L.splash * areaMul(), life: 3.2, target: null, hitR: 0.42 });
          AUDIO.play('pop', 0.8);
        },
      });
    }
  },
};

// ---------- Blob Mine ----------
SKILL_HOOKS.mine = {
  update(s, L, dt) {
    const st = s.st, run = G.run, hero = G.hero;
    st.t = (st.t ?? 1) - dt;
    if (st.t > 0) return;
    if (run.mines.length >= L.max) { st.t = 0.25; return; }
    st.t = L.cd * cdMul();
    st.foot = !st.foot;
    hero.addBud({
      joint: st.foot ? 'footA' : 'footB', off: [0, 0.03, -0.13], r: 0.085, grow: 0.16, colw: 0.3, glow: 0.2,
      onRelease: wp => { run.mines.push({ x: wp[0], z: wp[2], t: 0, life: 12, dmg: L.dmg, radius: L.radius * areaMul(), ph: rand(0, 10) }); AUDIO.play('drip'); },
    });
  },
};
function updateMines(dt) {
  const run = G.run;
  for (const m of run.mines) {
    m.t += dt; m.life -= dt;
    if (m.life <= 0) { m.dead = true; FX.splat(m.x, m.z, 0.4, R.goo.base, 1.2); continue; }
    if (m.t < 0.5) continue;
    let trig = false;
    enemiesInRadius(m.x, m.z, 0.9, () => { trig = true; });
    if (trig) { m.dead = true; explode(m.x, m.z, m.radius, m.dmg, 1.8, R.goo.pink); }
  }
  run.mines = run.mines.filter(m => !m.dead);
}

// ---------- Blade ----------
SKILL_HOOKS.blade = {
  update(s, L, dt) {
    const st = s.st, run = G.run, h = G.hero.pos;
    st.ang = (st.ang || 0) + L.spin * Math.PI / 180 * dt;
    const R2 = L.radius * areaMul();
    for (let i = 0; i < L.count; i++) {
      const a = st.ang + (i / L.count) * TAU;
      const bx = h[0] + Math.cos(a) * R2, bz = h[2] + Math.sin(a) * R2;
      enemiesInRadius(bx, bz, 0.5 * areaMul(), e => {
        if (run.t - e.bladeT < 0.5) return;
        e.bladeT = run.t;
        hurtEnemy(e, L.dmg, -Math.sin(a) * 4, Math.cos(a) * 4);
        FX.part(e.x, 0.55 * e.scale, e.z, -Math.sin(a) * 6, 0.5, Math.cos(a) * 6, 0.18, 0.05, 0.16, [1, 1, 1], 1, 1, 0, 3);
        FX.droplets(e.x, 0.5 * e.scale, e.z, 2, 5, 2.5, 0.04, null);
      });
    }
  },
  emit(s, L) {
    const st = s.st, h = G.hero.pos, R2 = L.radius * areaMul();
    for (let i = 0; i < L.count; i++) {
      const a = (st.ang || 0) + (i / L.count) * TAU;
      const bx = h[0] + Math.cos(a) * R2, bz = h[2] + Math.sin(a) * R2;
      pushImp(bx, 0.7, bz, 0.44 * areaMul(), -Math.sin(a), 0, Math.cos(a), 1, 3, 0.3, 0.12, G.run.t, 0, 0, 0, 1);
      const pts = [];
      for (let k = 0; k < 14; k++) { const b = a - k * 0.06; pts.push(h[0] + Math.cos(b) * R2, 0.7, h[2] + Math.sin(b) * R2); }
      R.ribStrip(pts, 14, 0.2 * areaMul(), [0.7, 0.92, 1.0, u => (1 - u) * 0.55], 0, 0, 1, u => 1 - u);
      pushDecal(bx + 0.12, bz + 0.08, 0.28, 0.2, 0, 1, 0, 0, 0.02, 0.04, 0.08, 0.35);
    }
  },
};

// ---------- Lightning ----------
SKILL_HOOKS.lightning = {
  update(s, L, dt) {
    const st = s.st, run = G.run;
    st.t = (st.t ?? 1) - dt;
    if (st.queue && st.queue.length) {
      for (const q of st.queue) q.d -= dt;
      for (const q of st.queue) if (q.d <= 0 && !q.done) { q.done = true; if (!q.e.dying) strike(q.e, L, L.chain, 1); }
      st.queue = st.queue.filter(q => !q.done);
    }
    if (st.t > 0) return;
    const cands = run.enemies.filter(e => !e.dying && onScreen(e.x, e.z, -0.6));
    if (!cands.length) return;
    st.t = L.cd * cdMul();
    const n = Math.min(cands.length, L.strikes + extraShots());
    st.queue = st.queue || [];
    for (let i = 0; i < n; i++) {
      const k = Math.floor(Math.random() * cands.length);
      st.queue.push({ e: cands[k], d: 0.06 + i * 0.06 });
      cands.splice(k, 1);
    }
    G.hero.spark = 1;
  },
};
function strike(e, L, chainLeft, mul) {
  const x = e.x, z = e.z, top = 3.6;
  if (mul === 1) {
    addBolt(x + rand(-0.2, 0.2), top, z + rand(-0.2, 0.2), x, 0.5 * e.scale, z, 0.13, [0.75, 0.95, 1.0]);
    FX.smoke(x, top, z, 0.55, [0.85, 0.95, 1.0], 0.45, 0.05);
    FX.smoke(x + 0.3, top + 0.1, z, 0.45, [0.85, 0.95, 1.0], 0.45, 0.05);
    FX.glow(x, top, z, 0.9, [0.7, 0.9, 1.0], 0.2);
  }
  enemiesInRadius(x, z, L.radius * areaMul(), o => hurtEnemy(o, L.dmg * mul, 0, 0, { sound: false, color: [0.75, 0.95, 1] }));
  FX.scorch(x, z, 0.8 + L.radius * areaMul());
  FX.glow(x, 0.4, z, 1.1, [0.7, 0.9, 1.0], 0.18);
  FX.burst(x, 0.3, z, 7, [0.8, 0.95, 1.0], 5, 0.07, 0.3, 1);
  AUDIO.play('zap');
  if (chainLeft > 0) {
    const nx = nearestEnemy(x, z, 2.5, new Set([e]));
    if (nx) {
      addBolt(x, 0.6, z, nx.x, 0.6 * nx.scale, nx.z, 0.08, [0.75, 0.95, 1.0]);
      strike(nx, L, chainLeft - 1, 0.6);
    }
  }
}

// ---------- Aura ----------
SKILL_HOOKS.aura = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos;
    G.hero.auraLevel = s.lvl;
    st.t = (st.t ?? 0.5) - dt;
    const R2 = L.radius * areaMul();
    enemiesInRadius(h[0], h[2], R2, e => {
      e.auraTint = 1;
      if (L.slow) { e.slowMul = Math.min(e.slowMul, 1 - L.slow / 100); e.slowT = 0.3; }
    });
    if (st.t <= 0) {
      st.t = 0.5;
      enemiesInRadius(h[0], h[2], R2, e => { hurtEnemy(e, L.dmg, 0, 0, { sound: false, color: [0.6, 1, 1] }); e.squashV -= 1; });
      for (let i = 0; i < 3; i++) { const a = rand(0, TAU), r = rand(0.5, R2 * 0.9); FX.part(h[0] + Math.cos(a) * r, 0.05, h[2] + Math.sin(a) * r, 0, 0.8, 0, 0.09, 0.02, 0.6, COLORS.cyanHi, 0.8, 0, 0, 0); }
    }
  },
  emit(s, L) { SCENE.aura = { x: G.hero.pos[0], z: G.hero.pos[2], r: L.radius * areaMul() * 1.08, level: s.lvl }; },
};

// ---------- Worms ----------
SKILL_HOOKS.worms = {
  update(s, L, dt) {
    const st = s.st, hero = G.hero, h = hero.pos;
    st.t = (st.t ?? 1.5) - dt;
    if (st.t > 0) return;
    if (!nearestEnemy(h[0], h[2], 11)) return;
    st.t = L.cd * cdMul();
    for (let i = 0; i < L.count; i++) {
      hero.addBud({ joint: 'pelvis', off: [rand(-0.12, 0.12), -0.73, 0.12], r: 0.12, grow: 0.18 + i * 0.1, colw: 3, glow: 0.15, onRelease: wp => spawnWorm(wp, L) });
    }
  },
};
function spawnWorm(wp, L) {
  G.run.worms.push({ x: wp[0], z: wp[2], state: 'burrow', target: null, E: 0, life: L.life, dmg: L.dmg, burst: L.burst, biteT: 0.3, bite: 0, yaw: rand(0, TAU), ph: rand(0, 10), ripT: 0 });
  FX.splat(wp[0], wp[2], 0.4, COLORS.worm, 1);
  AUDIO.play('drip');
}
function updateWorms(dt) {
  const run = G.run, h = G.hero.pos;
  for (const w of run.worms) {
    w.life -= dt; w.ph += dt; w.bite = Math.max(0, w.bite - dt * 5);
    if (w.life <= 0 && w.state !== 'sink') w.state = 'sink';
    if (w.state === 'burrow') {
      w.E = Math.max(0, w.E - dt * 5);
      if (!w.target || w.target.dying) {
        let best = null, bd = 1e9;
        gridQuery(h[0], h[2], 9, e => { const d = Math.hypot(e.x - w.x, e.z - w.z) + rand(0, 1.5); if (d < bd) { bd = d; best = e; } });
        w.target = best;
      }
      if (!w.target) continue;
      const dx = w.target.x - w.x, dz = w.target.z - w.z, d = Math.hypot(dx, dz) || 1;
      w.yaw = Math.atan2(dx, dz);
      const step = Math.min(d, 6 * dt);
      w.x += dx / d * step; w.z += dz / d * step;
      w.ripT -= dt;
      if (w.ripT <= 0) { w.ripT = 0.12; FX.decal(w.x, w.z, 0.95, 3, [0.5, 1, 0.85], 0.45, { add: true, a: 0.4, rot: 0 }); }
      if (d < 0.75 + w.target.radius) {
        w.state = 'surface';
        FX.burst(w.x, 0.1, w.z, 6, [0.5, 0.45, 0.4], 3, 0.1, 0.4, 2);
        if (w.burst) { enemiesInRadius(w.x, w.z, 1.2 * areaMul(), e => hurtEnemy(e, w.burst, 0, 0, { sound: false })); FX.ring(w.x, w.z, 2.6, COLORS.worm, 0.35); }
        AUDIO.play('drip');
      }
    } else if (w.state === 'surface') {
      w.E = Math.min(1, w.E + dt * 4);
      const t = w.target;
      if (!t || t.dying) { w.state = 'burrow'; w.target = null; continue; }
      const dx = t.x - w.x, dz = t.z - w.z, d = Math.hypot(dx, dz) || 1;
      w.yaw = angleLerp(w.yaw, Math.atan2(dx, dz), Math.min(1, dt * 8));
      if (d > 0.5 + t.radius) { const st2 = Math.min(d, 2 * dt); w.x += dx / d * st2; w.z += dz / d * st2; }
      if (d > 2.4) { w.state = 'burrow'; continue; }
      w.biteT -= dt;
      if (w.biteT <= 0 && w.E > 0.8) {
        w.biteT = 0.5; w.bite = 1;
        hurtEnemy(t, w.dmg, dx / d * 2, dz / d * 2, { color: [0.6, 1, 0.8] });
        FX.droplets(t.x, 0.5, t.z, 3, 5, 2.5, 0.04, null);
      }
    } else {
      w.E = Math.max(0, w.E - dt * 3);
      if (w.E <= 0) { w.dead = true; FX.splat(w.x, w.z, 0.5, COLORS.worm, 1.2); }
    }
  }
  run.worms = run.worms.filter(w => !w.dead);
}

// ---------- Blob Buddies ----------
SKILL_HOOKS.buddies = {
  update(s, L, dt) {
    const st = s.st, hero = G.hero;
    st.t = (st.t ?? 2) - dt;
    if (st.t > 0) return;
    st.t = L.cd * cdMul();
    for (let i = 0; i < L.count; i++) {
      const side = i % 2 ? -1 : 1;
      hero.addBud({ joint: 'chest', off: [side * 0.36, -0.12 + Math.floor(i / 2) * 0.17, 0.04], r: 0.26, grow: 0.36 + i * 0.12, colw: 0, glow: 0.04, onRelease: wp => spawnBuddy(wp, L, side) });
    }
    AUDIO.play('split');
  },
};
function spawnBuddy(wp, L, side) {
  const hero = G.hero, c = Math.cos(hero.yaw), sn = Math.sin(hero.yaw);
  G.run.buddies.push({ x: wp[0], z: wp[2], y: 0.25, vx: c * side * 2.5, vz: -sn * side * 2.5, vy: 3.5, life: L.life, dmg: L.dmg, hitT: 0, hopT: 0.4, sq: 1, sqV: 0, state: 'fight', ph: rand(0, 10), yaw: hero.yaw });
  G.hero.impulse(0.6);
}
function updateBuddies(dt) {
  const run = G.run, h = G.hero.pos;
  for (const b of run.buddies) {
    b.life -= dt; b.hitT -= dt; b.ph += dt;
    if (b.life <= 0) b.state = 'return';
    b.vy -= 18 * dt;
    b.x += b.vx * dt; b.z += b.vz * dt; b.y += b.vy * dt;
    if (b.y <= 0) {
      if (b.vy < -2) { b.sqV -= 5; FX.droplets(b.x, 0.05, b.z, 2, 0, 1.5, 0.035, null); }
      b.y = 0; b.vy = 0; b.vx *= 0.2; b.vz *= 0.2;
      b.hopT -= dt;
      if (b.hopT <= 0) {
        let tx, tz;
        if (b.state === 'fight') {
          const t = nearestEnemy(b.x, b.z, 8);
          if (t) { tx = t.x; tz = t.z; b.target = t; } else { tx = h[0] + rand(-1.5, 1.5); tz = h[2] + rand(-1.5, 1.5); b.target = null; }
        } else { tx = h[0]; tz = h[2]; }
        const dx = tx - b.x, dz = tz - b.z, d = Math.hypot(dx, dz) || 1;
        const sp = Math.min(3.6, d * 2.4);
        b.vx = dx / d * sp; b.vz = dz / d * sp; b.vy = 4.2; b.hopT = 0.38; b.sqV += 4;
        b.yaw = Math.atan2(dx, dz);
      }
    }
    b.sqV += (220 * (1 - b.sq) - 12 * b.sqV) * dt;
    b.sq = clamp(b.sq + b.sqV * dt, 0.55, 1.4);
    if (b.state === 'fight' && b.target && !b.target.dying && b.hitT <= 0) {
      const t = b.target, dx = t.x - b.x, dz = t.z - b.z, d = Math.hypot(dx, dz) || 1;
      if (d < 0.45 + t.radius) { b.hitT = 0.6; hurtEnemy(t, b.dmg, dx / d * 4, dz / d * 4); b.sqV -= 4; }
    }
    if (b.state === 'return' && Math.hypot(h[0] - b.x, h[2] - b.z) < 0.7) {
      b.dead = true; G.hero.impulse(0.8); FX.glow(h[0], 0.7, h[2], 0.8, COLORS.cyanHi, 0.2); AUDIO.play('drip');
    }
    if (b.life < -6) b.dead = true;
  }
  run.buddies = run.buddies.filter(b => !b.dead);
}

// ---------- Goo Axe ----------
SKILL_HOOKS.axe = {
  update(s, L, dt) {
    const st = s.st, hero = G.hero, h = hero.pos;
    st.t = (st.t ?? 0.8) - dt;
    if (st.t > 0) return;
    const tgt = nearestEnemy(h[0], h[2], L.range + 1);
    if (!tgt) return;
    st.t = L.cd * cdMul();
    const base = Math.atan2(tgt.x - h[0], tgt.z - h[2]);
    const n = L.count + extraShots();
    const launch = wp => {
      for (let i = 0; i < n; i++) {
        const a = base + (n > 1 ? (i / (n - 1) - 0.5) * 1.05 : 0);
        G.run.axes.push({ x: wp[0], y: 0.8, z: wp[2], dx: Math.sin(a), dz: Math.cos(a), dist: 0, range: L.range * areaMul(), state: 'out', dmg: L.dmg, t: 0, hits: new Map(), trail: [] });
      }
      AUDIO.play('throw');
    };
    const tw = [tgt.x, 0.6, tgt.z];
    const arm = hero.freeArm(tw);
    if (arm >= 0) hero.throwAt(arm, tw, 0.12, 0.5, launch);
    else launch(hero.jointWorld('chest'));
  },
};
function updateAxes(dt) {
  const run = G.run, h = G.hero.pos;
  for (const a of run.axes) {
    a.t += dt;
    if (a.state === 'out') {
      const sp = 10 * dt;
      a.x += a.dx * sp; a.z += a.dz * sp; a.dist += sp;
      if (a.dist >= a.range) a.state = 'back';
    } else {
      const dx = h[0] - a.x, dz = h[2] - a.z, d = Math.hypot(dx, dz) || 1;
      const sp = Math.min(d, 12 * dt);
      a.x += dx / d * sp; a.z += dz / d * sp;
      if (d < 0.6) { a.dead = true; G.hero.impulse(0.3); continue; }
    }
    enemiesInRadius(a.x, a.z, 0.7 * areaMul(), e => {
      const last = a.hits.get(e.id);
      if (last !== undefined && a.t - last < 0.35) return;
      if (shieldBlocks(e, a.x, a.z) && a.state === 'out') { blockedFx(a.x, 0.7, a.z); a.state = 'back'; return; }
      a.hits.set(e.id, a.t);
      hurtEnemy(e, a.dmg, a.dx * 3, a.dz * 3);
      FX.droplets(e.x, 0.5, e.z, 2, 5, 2.5, 0.04, null);
    });
    a.trail.unshift([a.x, a.y, a.z]); if (a.trail.length > 8) a.trail.pop();
  }
  run.axes = run.axes.filter(a => !a.dead);
}

// ---------- Blob Laser ----------
SKILL_HOOKS.laser = {
  update(s, L, dt) {
    const st = s.st, hero = G.hero, h = hero.pos;
    st.t = (st.t ?? 1.5) - dt;
    if (st.active > 0) {
      st.active -= dt;
      const tgt = nearestEnemy(h[0], h[2], 8);
      if (tgt) {
        const want = Math.atan2(tgt.x - h[0], tgt.z - h[2]);
        const d = angleDiff(st.ang, want);
        st.ang += clamp(d, -1.57 * dt, 1.57 * dt);
      }
      hero.chestGlow = 1;
      st.tick -= dt;
      if (st.tick <= 0) {
        st.tick = 0.1;
        const len = 7 * areaMul(), w = 0.3 * areaMul();
        for (let b = 0; b < L.beams; b++) {
          const a = st.ang + b * Math.PI, dx = Math.sin(a), dz = Math.cos(a);
          const seen = new Set();
          for (let k = 0; k <= len; k += 1.5) {
            gridQuery(h[0] + dx * k, h[2] + dz * k, 1.6, e => {
              if (seen.has(e)) return;
              const ex = e.x - h[0], ez = e.z - h[2], along = ex * dx + ez * dz;
              if (along < 0 || along > len) return;
              const perp = Math.abs(ex * dz - ez * dx);
              if (perp < w + e.radius) { seen.add(e); hurtEnemy(e, L.dmg, dx * 1.5, dz * 1.5, { sound: false, color: [0.6, 0.95, 1] }); }
            });
          }
        }
      }
      if (st.active <= 0) st.active = 0;
      return;
    }
    if (st.t > 0) return;
    const tgt = nearestEnemy(h[0], h[2], 7.5);
    if (!tgt) return;
    st.t = L.cd * cdMul() + L.dur;
    st.active = L.dur; st.tick = 0;
    st.ang = Math.atan2(tgt.x - h[0], tgt.z - h[2]);
    hero.impulse(-0.8);
    AUDIO.play('laser');
  },
  emit(s, L) {
    const st = s.st;
    if (!(st.active > 0)) return;
    const hero = G.hero, ch = hero.jointWorld('chest'), t = G.run.t;
    const len = 7 * areaMul(), w = 0.3 * areaMul();
    const fade = Math.min(1, st.active / 0.15) * Math.min(1, (L.dur - st.active) / 0.08 + 0.2);
    for (let b = 0; b < L.beams; b++) {
      const a = st.ang + b * Math.PI, dx = Math.sin(a), dz = Math.cos(a);
      const n = 16, pts = [];
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1);
        pts.push(ch[0] + dx * (0.25 + u * len), ch[1] - u * 0.35 + Math.sin(u * 9 - t * 18) * 0.03, ch[2] + dz * (0.25 + u * len));
      }
      R.ribStrip(pts, n, w * fade, [R.goo.base[0], R.goo.base[1], R.goo.base[2], 0.95], 1, -t * 3, 3, u => 0.75 + 0.25 * Math.sin(u * 24 - t * 26) + (u < 0.1 ? (0.1 - u) * 3 : 0));
      const ex = ch[0] + dx * (0.25 + len), ez = ch[2] + dz * (0.25 + len);
      if (Math.random() < 0.6) FX.droplets(ex, 0.4, ez, 1, 0, 3, 0.05, Math.random() < 0.3 ? R.goo.base : null);
      FX.glow(ex, 0.45, ez, 0.5, COLORS.cyanHi, 0.06, 0.6);
    }
  },
};

// ---------- Bubble Shield ----------
SKILL_HOOKS.shield = {
  update(s, L, dt) {
    const st = s.st;
    if (st.hits === undefined) { st.hits = L.hits; st.inflate = 0; st.hitT = 9; st.rt = L.recharge; }
    if (st.hits < L.hits) {
      st.rt -= dt;
      if (st.rt <= 0) { st.hits = L.hits; st.rt = L.recharge; st.inflate = 0; AUDIO.play('shield'); }
    }
    st.inflate = Math.min(1, st.inflate + dt / 0.3);
    st.hitT += dt;
  },
  absorb(run, fx, fz) {
    const s = slotOf('shield');
    if (!s || !(s.st.hits > 0)) return false;
    const L = SKILLS.shield.levels[s.lvl - 1], h = G.hero.pos;
    s.st.hits--; s.st.hitT = 0; s.st.hitPos = [fx, 0.9, fz];
    run.invuln = 0.35;
    if (s.st.hits <= 0) {
      s.st.rt = L.recharge;
      FX.droplets(h[0], 0.9, h[2], 18, 0, 5, 0.05, null);
      FX.ring(h[0], h[2], 2.6, COLORS.cyanHi, 0.35);
      AUDIO.play('bubblepop');
      if (L.pop) enemiesInRadius(h[0], h[2], L.push + 0.6, e => { const dx = e.x - h[0], dz = e.z - h[2], d = Math.hypot(dx, dz) || 1; hurtEnemy(e, L.pop, dx / d * L.push * 7, dz / d * L.push * 7, { sound: false }); });
    } else AUDIO.play('shield');
    return true;
  },
  emit(s, L) {
    const st = s.st;
    if (!(st.hits > 0)) return;
    const h = G.hero.pos, sc = G.hero.scale;
    const inf = easeOutBack(clamp(st.inflate, 0, 1));
    const hp = st.hitPos || [0, 0, 0];
    SCENE.bubble = { x: h[0], y: 1.0 * sc, z: h[2], r: 1.15 * sc * Math.max(0.05, inf), hit: [hp[0], hp[1], hp[2], st.hitT < 1 ? st.hitT + 0.001 : 0], fade: 1 };
  },
};

// ---------- passives have no per-frame behavior ----------
for (const id in PASSIVES) SKILL_HOOKS[id] = SKILL_HOOKS[id] || {};
