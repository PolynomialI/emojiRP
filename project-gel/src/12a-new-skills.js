// ============================================================
// Chapter power-ups: one new skill or ability per chapter from chapter 2 (data in SKILLS / PASSIVES)
// ============================================================

// ---------- Sandstorm (chapter 2): wandering goo tornadoes that pull crowds in ----------
SKILL_HOOKS.sandstorm = {
  update(s, L, dt) {
    const st = s.st, run = G.run, h = G.hero.pos;
    run.storms = run.storms || [];
    st.t = (st.t ?? 1.2) - dt;
    if (st.t <= 0 && nearestEnemy(h[0], h[2], 9)) {
      st.t = L.cd * cdMul();
      for (let i = 0; i < L.count; i++) {
        const a = rand(0, TAU);
        run.storms.push({ x: h[0] + Math.cos(a) * 1.5, z: h[2] + Math.sin(a) * 1.5, t: 0, life: L.life, dmg: L.dmg, r: L.radius * areaMul(), tick: 0.1, ph: rand(0, TAU), tx: h[0], tz: h[2], seekT: 0 });
      }
      AUDIO.play('zap');
    }
  },
  emit() {},
};
function updateStorms(dt) {
  const run = G.run;
  if (!run.storms || !run.storms.length) return;
  for (const w of run.storms) {
    w.t += dt;
    // drift toward the nearest enemy, picking a new one now and then
    w.seekT -= dt;
    if (w.seekT <= 0) { w.seekT = 0.7; const e = nearestEnemy(w.x, w.z, 10); if (e) { w.tx = e.x; w.tz = e.z; } }
    const dx = w.tx - w.x, dz = w.tz - w.z, d = Math.hypot(dx, dz);
    if (d > 0.3) { w.x += dx / d * Math.min(d, 2.6 * dt); w.z += dz / d * Math.min(d, 2.6 * dt); }
    const o = { x: w.x, z: w.z }; resolveCircle(o, 0.4); w.x = o.x; w.z = o.z;
    // pull everything nearby toward the eye of the storm
    enemiesInRadius(w.x, w.z, w.r * 1.7, e => {
      if (e.boss) return;
      const ex = w.x - e.x, ez = w.z - e.z, ed = Math.hypot(ex, ez) || 1;
      e.kx += (ex / ed * 9 - ez / ed * 5) * dt / e.mass; e.kz += (ez / ed * 9 + ex / ed * 5) * dt / e.mass;
    });
    w.tick -= dt;
    if (w.tick <= 0) {
      w.tick = 0.3;
      enemiesInRadius(w.x, w.z, w.r, e => hurtEnemy(e, w.dmg, 0, 0, { sound: false, color: [1, 0.86, 0.55] }));
    }
    if (Math.random() < 0.5) FX.smoke(w.x + rand(-0.5, 0.5), 0.2, w.z + rand(-0.5, 0.5), 0.6 + w.r * 0.3, [0.85, 0.7, 0.48], 0.6, 1.4);
  }
  run.storms = run.storms.filter(w => w.t < w.life);
}
function emitStorms() {
  const run = G.run;
  if (!run.storms) return;
  for (const w of run.storms) {
    if (!onScreen(w.x, w.z, 3)) continue;
    const grow = Math.min(1, w.t / 0.35) * Math.min(1, (w.life - w.t) / 0.4), sc = w.r * 0.55 * grow;
    if (sc < 0.02) continue;
    // a spinning goo funnel wrapped in sand ribbons
    pushImp(w.x, sc * 1.05, w.z, sc, 0, 0, 1, 1, 32, 0, 0.15, w.t * 1.6 + w.ph, 0, 0, 0, 0.6);
    for (let k = 0; k < 3; k++) {
      const pts = [], n = 18;
      for (let j = 0; j < n; j++) {
        const u = j / (n - 1), y = u * sc * 2.6, rad = (0.4 + u * 1.3) * sc, a = u * 7 + w.t * 9 + k * 2.09 + w.ph;
        pts.push(w.x + Math.cos(a) * rad, y + 0.05, w.z + Math.sin(a) * rad);
      }
      R.ribStrip(pts, n, 0.1 * grow, [0.95, 0.82, 0.58, u => 0.7 * Math.sin(u * Math.PI)], 0, 0, 1);
    }
    pushDecal(w.x, w.z, w.r * 1.1, w.r * 1.1, w.t * 3, 3, 0, 0.3, 0.9, 0.75, 0.5, 0.35 * grow, true);
  }
}

// ---------- Neon Drone (chapter 3): orbiting drones that zap the nearest enemy ----------
const ZAP_COLS = [[1, 0.35, 0.85], [0.3, 0.95, 1]];
SKILL_HOOKS.drone = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, run = G.run;
    st.ang = (st.ang || 0) + dt * 1.6;
    st.fire = st.fire || []; st.pos = st.pos || []; st.aim = st.aim || [];
    run.zaps = run.zaps || [];
    for (let i = 0; i < L.count; i++) {
      const a = st.ang + i * TAU / L.count, p = st.pos[i] = [h[0] + Math.cos(a) * 1.7, 1.9 + Math.sin(st.ang * 3 + i) * 0.12, h[2] + Math.sin(a) * 1.7];
      st.fire[i] = (st.fire[i] ?? i * 0.25) - dt;
      if (st.fire[i] > 0) continue;
      const e = nearestEnemy(p[0], p[2], L.range);
      if (!e) { st.fire[i] = 0.15; continue; }
      st.fire[i] = L.cd * cdMul();
      const col = ZAP_COLS[i % 2], tx = e.x, ty = 0.6 * e.scale, tz = e.z;
      st.aim[i] = Math.atan2(tx - p[0], tz - p[2]);
      hurtEnemy(e, L.dmg, (tx - h[0]) * 0.4, (tz - h[2]) * 0.4, { sound: false, color: col });
      run.zaps.push({ a: p.slice(), b: [tx, ty, tz], life: 0.12, col });
      FX.glow(tx, ty, tz, 0.55, col, 0.1);
      AUDIO.play('zap', 1.7);
    }
  },
  emit(s, L) {
    const st = s.st;
    if (!st.pos) return;
    for (let i = 0; i < L.count; i++) {
      const p = st.pos[i];
      if (!p) continue;
      const a = st.aim[i] ?? st.ang;
      pushImp(p[0], p[1], p[2], 0.3, Math.sin(a), 0, Math.cos(a), 1, 34, i % 2 ? 0.2 : 1.85, 0.7, st.ang * 6 + i, 0, 0, 0, 1);
      pushDecal(p[0] + 0.15, p[2] + 0.1, 0.25, 0.2, 0, 1, 0, 0, 0.01, 0.02, 0.05, 0.3);
    }
  },
};
function updateZaps(dt) {
  const run = G.run;
  if (!run.zaps || !run.zaps.length) return;
  for (const z of run.zaps) z.life -= dt;
  run.zaps = run.zaps.filter(z => z.life > 0);
}
function emitZaps() {
  const run = G.run;
  if (!run.zaps) return;
  for (const z of run.zaps) {
    const k = z.life / 0.12, pts = [z.a[0], z.a[1], z.a[2], z.b[0], z.b[1], z.b[2]];
    R.ribStrip(pts, 2, 0.08 * k, [z.col[0], z.col[1], z.col[2], 1], 0, 0, 1);
    R.ribStrip(pts, 2, 0.28 * k, [z.col[0], z.col[1], z.col[2], 0.35], 0, 0, 1);
  }
}

// ---------- Bouncy Ball (chapter 4): rubber goo balls that ricochet between enemies ----------
SKILL_HOOKS.bouncy = {
  update(s, L, dt) {
    const st = s.st, run = G.run, h = G.hero.pos;
    run.bouncy = run.bouncy || [];
    st.t = (st.t ?? 0.8) - dt;
    if (st.t > 0) return;
    const tgt = nearestEnemy(h[0], h[2], 9);
    if (!tgt) return;
    st.t = L.cd * cdMul();
    const n = L.count + extraShots(), base = Math.atan2(tgt.x - h[0], tgt.z - h[2]);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * 0.35;
      run.bouncy.push({ x: h[0], z: h[2], y: 1, vx: Math.sin(a) * 10, vz: Math.cos(a) * 10, vy: 3, r: L.size * areaMul(), dmg: L.dmg, left: L.bounces, last: null, cd: 0, life: 6, sq: 1, ph: rand(0, 10) });
    }
    AUDIO.play('pop');
  },
  emit() {},
};
function updateBouncy(dt) {
  const run = G.run;
  if (!run.bouncy || !run.bouncy.length) return;
  for (const b of run.bouncy) {
    b.life -= dt; b.cd -= dt;
    b.x += b.vx * dt; b.z += b.vz * dt;
    b.vy -= 22 * dt; b.y += b.vy * dt;
    if (b.y < b.r) { b.y = b.r; b.vy = 5.5; b.sq = 0.7; }
    b.sq += (1 - b.sq) * Math.min(1, dt * 10);
    const ox = b.x, oz = b.z;
    if (resolveCircle(b, b.r)) {
      const nx = b.x - ox, nz = b.z - oz, nl = Math.hypot(nx, nz) || 1, vn = (b.vx * nx + b.vz * nz) / nl;
      if (vn < 0) { b.vx -= 2 * vn * nx / nl; b.vz -= 2 * vn * nz / nl; }
      b.left--; b.sq = 0.65; AUDIO.play('pop', 1.4);
    }
    if (b.cd <= 0) enemiesInRadius(b.x, b.z, b.r, e => {
      if (b.cd > 0 || e === b.last) return;
      hurtEnemy(e, b.dmg, b.vx * 0.4, b.vz * 0.4, { sound: false });
      FX.burst(b.x, b.y, b.z, 5, [1, 0.9, 0.5], 3, 0.08, 0.3, 1);
      b.last = e; b.cd = 0.08; b.left--; b.sq = 0.6;
      // ricochet toward the next closest enemy, or bounce straight back
      const ex = new Set([e]), nxt = nearestEnemy(b.x, b.z, 7, ex), sp = Math.hypot(b.vx, b.vz);
      if (nxt) { const dx = nxt.x - b.x, dz = nxt.z - b.z, dl = Math.hypot(dx, dz) || 1; b.vx = dx / dl * sp; b.vz = dz / dl * sp; }
      else { b.vx = -b.vx; b.vz = -b.vz; }
      AUDIO.play('pop', 1.2);
    });
    if (b.left < 0 || b.life <= 0) { b.dead = true; FX.droplets(b.x, b.y, b.z, 6, 0, 3, 0.05, null); }
  }
  run.bouncy = run.bouncy.filter(b => !b.dead);
}
function emitBouncy() {
  const run = G.run;
  if (!run.bouncy) return;
  for (const b of run.bouncy) {
    if (!onScreen(b.x, b.z, 1)) continue;
    pushImp(b.x, b.y, b.z, b.r, b.vx, 0, b.vz, 1, 35, 0, 0.1, b.ph, b.sq, 0, 0, 1);
    pushDecal(b.x + 0.08, b.z + 0.06, b.r * 0.9, b.r * 0.8, 0, 1, 0, 0, 0.02, 0.03, 0.08, 0.4 * (1 - Math.min(1, b.y / 3)));
  }
}

// ---------- Sugar Rush (chapter 5 ability): every 25 kills, a burst of speed and faster skills ----------
function sugarKill(run) {
  const lv = lvlOf('sugar');
  if (!lv) return;
  run.sugar = (run.sugar || 0) + 1;
  if (run.sugar >= 25) {
    run.sugar = 0;
    run.rushT = 4; run.rushPower = 0.12 + 0.03 * (lv - 1);
    const h = G.hero.pos;
    FX.ring(h[0], h[2], 3.5, [1, 0.5, 0.8], 0.5);
    for (let i = 0; i < 14; i++) FX.star(h[0] + rand(-1, 1), rand(0.4, 1.8), h[2] + rand(-1, 1), 0.3, [[1, 0.4, 0.7], [0.5, 0.9, 1], [1, 0.9, 0.4], [0.6, 1, 0.6]][i % 4], 0.6);
    AUDIO.play('levelup', 1.3);
    G.hero.impulse(1.6);
  }
}
function updateSugar(run, dt) {
  if (!(run.rushT > 0)) return;
  run.rushT -= dt;
  // candy sparkles while it lasts
  if (Math.random() < 0.6) { const h = G.hero.pos; FX.star(h[0] + rand(-0.6, 0.6), rand(0.3, 1.6), h[2] + rand(-0.6, 0.6), 0.22, [[1, 0.4, 0.7], [0.5, 0.9, 1], [1, 0.9, 0.4]][Math.floor(Math.random() * 3)], 0.4); }
}

// ---------- Frost Nova (chapter 6): a ring of frost bursts out, hurting and freezing what it touches ----------
SKILL_HOOKS.frostnova = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, r = L.radius * areaMul();
    st.t = (st.t ?? 1) - dt;
    if (st.t <= 0 && nearestEnemy(h[0], h[2], r)) {
      st.t = L.cd * cdMul();
      st.nova = { x: h[0], z: h[2], R: r, t: 0, id: (st.nova ? st.nova.id : 0) + 1 };
      FX.ring(h[0], h[2], r, [0.62, 0.9, 1], 0.4, 1);
      FX.ring(h[0], h[2], r * 0.7, [0.9, 0.97, 1], 0.3, 0.7);
      for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU, sp = r / 0.35; FX.part(h[0] + Math.cos(a) * 0.4, rand(0.3, 0.9), h[2] + Math.sin(a) * 0.4, Math.cos(a) * sp, rand(0, 1), Math.sin(a) * sp, 0.12, 0.04, 0.4, [0.8, 0.95, 1], 1, 1, 0, 1.5); }
      AUDIO.play('zap', 0.8);
    }
    // the ring grows over a third of a second, catching each enemy once as it passes
    const n = st.nova;
    if (!n || n.t > 0.35) return;
    n.t += dt;
    const cur = n.R * Math.min(1, n.t / 0.35);
    enemiesInRadius(n.x, n.z, cur, e => {
      if (e.novaHit === n.id) return;
      e.novaHit = n.id;
      const ex = e.x - n.x, ez = e.z - n.z, ed = Math.hypot(ex, ez) || 1;
      hurtEnemy(e, L.dmg, ex / ed * 3, ez / ed * 3, { sound: false, color: [0.6, 0.9, 1] });
      if (e.boss) { e.slowMul = Math.min(e.slowMul, 0.65); e.slowT = Math.max(e.slowT, L.freeze); }
      else if (!e.dying) e.frozen = Math.max(e.frozen || 0, L.freeze);
      FX.burst(e.x, 0.6, e.z, 3, [0.8, 0.95, 1], 2.5, 0.07, 0.35, 1);
    });
  },
  emit() {},
};

// ---------- Meteor (chapter 7): flaming rocks fall on the thickest crowds and leave the ground burning ----------
const METEOR_FALL = 0.75;
SKILL_HOOKS.meteor = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, r = L.radius * areaMul();
    st.rocks = st.rocks || []; st.fires = st.fires || [];
    st.t = (st.t ?? 1.5) - dt;
    if (st.t <= 0 && nearestEnemy(h[0], h[2], 10)) {
      st.t = L.cd * cdMul();
      for (let i = 0; i < L.count; i++) {
        let tgt = clusterTarget(h[0], h[2], 10);
        if (!tgt || i) { const e = nearestEnemy(h[0] + rand(-4, 4), h[2] + rand(-4, 4), 10); if (e) tgt = [e.x, e.z]; }
        if (!tgt) break;
        // they come in at a slant from up and behind, a little apart
        st.rocks.push({ tx: tgt[0], tz: tgt[1], sx: tgt[0] + 5, sy: 15, sz: tgt[1] - 7, t: -i * 0.18, r, ph: rand(0, 10) });
      }
    }
    for (const m of st.rocks) {
      m.t += dt;
      if (m.t < METEOR_FALL) { if (m.t > 0 && Math.random() < 0.8) { const u = m.t / METEOR_FALL; FX.smoke(lerp(m.sx, m.tx, u), lerp(m.sy, 0, u), lerp(m.sz, m.tz, u), 0.5, [0.35, 0.3, 0.28], 0.6, 0.2); } continue; }
      m.done = true;
      enemiesInRadius(m.tx, m.tz, m.r, e => { const ex = e.x - m.tx, ez = e.z - m.tz, ed = Math.hypot(ex, ez) || 1; hurtEnemy(e, L.dmg, ex / ed * 8, ez / ed * 8, { sound: false, color: [1, 0.6, 0.2] }); });
      FX.ring(m.tx, m.tz, m.r * 1.6, [1, 0.6, 0.2], 0.45); FX.crack(m.tx, m.tz, m.r * 1.3, 2.2); FX.scorch(m.tx, m.tz, m.r * 1.1, 2.5);
      FX.burst(m.tx, 0.4, m.tz, 18, [1, 0.55, 0.15], 6, 0.16, 0.6, 0); FX.burst(m.tx, 0.3, m.tz, 8, [0.4, 0.35, 0.32], 4, 0.18, 0.7, 2);
      arenaBlast(m.tx, m.tz, m.r * 1.5, 1.2);
      G.cam.shake = Math.max(G.cam.shake, 0.12); AUDIO.play('boom', 0.7);
      st.fires.push({ x: m.tx, z: m.tz, r: m.r * 0.85, life: 2, tick: 0.2 });
    }
    st.rocks = st.rocks.filter(m => !m.done);
    // burning ground where they landed
    for (const f of st.fires) {
      f.life -= dt; f.tick -= dt;
      if (f.tick <= 0) { f.tick = 0.4; enemiesInRadius(f.x, f.z, f.r, e => hurtEnemy(e, Math.max(1, Math.round(L.dmg * 0.12)), 0, 0, { sound: false, color: [1, 0.6, 0.2] })); }
      if (Math.random() < 0.6) FX.part(f.x + rand(-f.r, f.r) * 0.7, 0.2, f.z + rand(-f.r, f.r) * 0.7, 0, rand(1.5, 3), 0, rand(0.15, 0.3), 0.05, 0.5, [1, rand(0.35, 0.7), 0.1], 1, 0);
    }
    st.fires = st.fires.filter(f => f.life > 0);
  },
  emit(s) {
    const st = s.st;
    if (!st.rocks) return;
    for (const m of st.rocks) {
      if (m.t < 0) continue;
      const u = m.t / METEOR_FALL, x = lerp(m.sx, m.tx, u), y = lerp(m.sy, 0.4, u), z = lerp(m.sz, m.tz, u);
      const dx = m.tx - m.sx, dy = -m.sy, dz = m.tz - m.sz, l = Math.hypot(dx, dy, dz);
      pushImp(x, y, z, 0.9, dx / l, dy / l, dz / l, 1.2, 39, 0, 0.3, m.ph + m.t * 3, 0, 0, 0, 1);
      FX.glow(x, y, z, 1.6, [1, 0.5, 0.15], 0.05, 0.6);
      pushDecal(m.tx, m.tz, m.r * u, m.r * u, 0, 1, 0, 0, 1, 0.4, 0.1, 0.35 * u, true);
    }
    for (const f of st.fires) pushDecal(f.x, f.z, f.r * 1.2, f.r * 1.2, 0, 1, 0, 0, 1, 0.45, 0.1, 0.5 * Math.min(1, f.life) * (0.85 + 0.15 * Math.sin(G.run.t * 20 + f.x)), true);
  },
};

// ---------- Thorns (chapter 8): enemies touching you get pricked and shoved away ----------
function thornsTouch(e, dx, dz, d) {
  const lv = lvlOf('thorns'), run = G.run;
  if (!lv || e.thornAt > run.t || G.state !== 'run') return;
  e.thornAt = run.t + 0.5;
  const l = d || 1;
  hurtEnemy(e, 10 + 5 * (lv - 1), dx / l * 7, dz / l * 7, { sound: false, color: [0.6, 1, 0.4] });
  FX.burst(e.x - dx / l * e.radius, 0.6, e.z - dz / l * e.radius, 4, [0.55, 0.85, 0.3], 3, 0.08, 0.3, 1);
}
