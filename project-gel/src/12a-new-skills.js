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
