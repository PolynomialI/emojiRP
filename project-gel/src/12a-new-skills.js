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
