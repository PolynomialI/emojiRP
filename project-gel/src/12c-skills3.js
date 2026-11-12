// ============================================================
// Power-ups of chapters 16-19: Clockwork Turret, Spore Cloud, Ptero Strike, Rolling Pin
// (data in SKILLS / EVOLUTIONS in 10-data.js; icons are impostor types 48-51)
// ============================================================

// ---------- Clockwork Turret (chapter 16): brass turrets unfold beside you and pepper the nearest enemies with bolts ----------
const TURRET = { range: 7.5, boltV: 24, boltLife: 0.45 };
SKILL_HOOKS.turret = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos;
    st.tur = st.tur || []; st.bolts = st.bolts || [];
    st.t = (st.t ?? 0.6) - dt;
    if (st.t <= 0) {
      // a fresh turret unfolds next to you; with all of them out, the oldest folds away for it
      st.t = L.cd * cdMul();
      if (st.tur.length >= L.count) st.tur.shift();
      const a = rand(0, TAU), o = { x: h[0] + Math.cos(a) * 1.5, z: h[2] + Math.sin(a) * 1.5 };
      resolveCircle(o, 0.45);
      st.tur.push({ x: o.x, z: o.z, life: L.life, fire: 0.35, yaw: a, pop: 0, recoil: 0, ph: rand(0, 10) });
      FX.burst(o.x, 0.3, o.z, 8, [1, 0.8, 0.35], 2.5, 0.07, 0.35, 1);
      AUDIO.play('click');
    }
    const range = TURRET.range * areaMul();
    for (const t of st.tur) {
      t.life -= dt; t.pop = Math.min(1, t.pop + dt * 5); t.recoil = Math.max(0, t.recoil - dt * 8); t.ph += dt;
      let best = null, bd = range;
      enemiesInRadius(t.x, t.z, range, e => { const dd = Math.hypot(e.x - t.x, e.z - t.z); if (dd < bd) { bd = dd; best = e; } });
      if (!best) continue;
      t.yaw = angleLerp(t.yaw, Math.atan2(best.x - t.x, best.z - t.z), Math.min(1, dt * 14));
      t.fire -= dt;
      if (t.fire <= 0) {
        t.fire += 1 / L.rate; t.recoil = 1;
        const fx = Math.sin(t.yaw), fz = Math.cos(t.yaw);
        st.bolts.push({ x: t.x + fx * 0.5, z: t.z + fz * 0.5, vx: fx * TURRET.boltV, vz: fz * TURRET.boltV, life: TURRET.boltLife });
        FX.glow(t.x + fx * 0.6, 0.45, t.z + fz * 0.6, 0.45, [1, 0.85, 0.45], 0.05, 1);
        AUDIO.play('hit', 1.6);
      }
    }
    st.tur = st.tur.filter(t => t.life > 0);
    for (const b of st.bolts) {
      b.life -= dt; b.x += b.vx * dt; b.z += b.vz * dt;
      if (inRock(b.x, b.z) || arenaSd(b.x, b.z) > 0) { b.life = 0; FX.burst(b.x, 0.4, b.z, 3, [1, 0.8, 0.4], 2, 0.05, 0.2, 1); continue; }
      let hit = null;
      enemiesInRadius(b.x, b.z, 0.5, e => { if (!hit) hit = e; });
      if (hit) { b.life = 0; hurtEnemy(hit, L.dmg, b.vx * 0.08, b.vz * 0.08, { sound: false }); FX.burst(b.x, 0.5, b.z, 4, [1, 0.85, 0.5], 2.5, 0.05, 0.22, 1); }
    }
    st.bolts = st.bolts.filter(b => b.life > 0);
  },
  emit(s) {
    const st = s.st;
    if (!st.tur) return;
    for (const t of st.tur) {
      // pops up out of the floor, and sinks back as it winds down
      const k = Math.min(t.pop, clamp(t.life / 0.3, 0, 1)), fx = Math.sin(t.yaw), fz = Math.cos(t.yaw), sc = 0.55 * k;
      pushImp(t.x - fx * t.recoil * 0.06, 0.33 * k, t.z - fz * t.recoil * 0.06, sc, fx, 0, fz, 1, 48, 0, 0.1, t.ph, s.evo ? 1 : 0, 0, 0, 1);
      pushDecal(t.x + 0.08, t.z + 0.06, 0.4 * k, 0.4 * k, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.45);
    }
    for (const b of st.bolts) {
      const sp = Math.hypot(b.vx, b.vz) || 1;
      R.ribStrip([b.x - b.vx / sp * 0.7, 0.45, b.z - b.vz / sp * 0.7, b.x, 0.45, b.z], 2, 0.08, s.evo ? [1, 0.9, 0.35, 1] : [1, 0.78, 0.4, 1], 0);
      FX.glow(b.x, 0.45, b.z, 0.25, [1, 0.85, 0.45], 0.04, 0.8);
    }
  },
};

// ---------- Spore Cloud (chapter 17): clouds of glowing spores drift into crowds and linger, poisoning everything
// inside; evolved (Fungal Bloom), every enemy that dies in a cloud bursts into a new one ----------
const SPORE = { tick: 0.4, drift: 7, max: 14 };
SKILL_HOOKS.spore = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, rad = L.radius * areaMul();
    st.clouds = st.clouds || [];
    st.t = (st.t ?? 0.8) - dt;
    if (st.t <= 0) {
      const near = [];
      enemiesInRadius(h[0], h[2], 9, e => near.push(e));
      if (near.length) {
        st.t = L.cd * cdMul();
        for (let i = 0; i < L.count; i++) {
          const tg = near[Math.floor(Math.random() * near.length)];
          st.clouds.push({ x: h[0], z: h[2], tx: tg.x, tz: tg.z, r: rad, life: L.life, tick: 0.2, ph: rand(0, 10), grow: 0 });
        }
        AUDIO.play('drip', 0.7);
      } else st.t = 0.3;
    }
    const born = [];
    for (const c of st.clouds) {
      c.life -= dt; c.grow = Math.min(1, c.grow + dt * 2.5); c.ph += dt;
      const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz);
      if (d > 0.1) { const v = Math.min(d, SPORE.drift * dt); c.x += dx / d * v; c.z += dz / d * v; }
      c.tick -= dt;
      if (c.tick > 0) continue;
      c.tick = SPORE.tick;
      enemiesInRadius(c.x, c.z, c.r * c.grow, e => {
        hurtEnemy(e, L.dmg, 0, 0, { sound: false });
        e.auraTint = Math.max(e.auraTint || 0, 0.6);
        if (s.evo && e.hp <= 0 && st.clouds.length + born.length < SPORE.max) born.push({ x: e.x, z: e.z, tx: e.x, tz: e.z, r: rad * 0.7, life: 2.2, tick: 0.2, ph: rand(0, 10), grow: 0 });
      });
    }
    st.clouds = st.clouds.filter(c => c.life > 0).concat(born);
  },
  emit(s) {
    const st = s.st;
    if (!st.clouds) return;
    const gold = s.evo;
    for (const c of st.clouds) {
      const k = c.grow * Math.min(1, c.life / 0.5), R = c.r * k;
      pushDecal(c.x, c.z, R, R, c.ph * 0.6, 3, 0, 0.5, gold ? 1 : 0.75, gold ? 0.75 : 0.4, gold ? 0.3 : 1.0, 0.3 * k, true);
      pushDecal(c.x, c.z, R * 0.7, R * 0.7, -c.ph * 0.9, 3, 0, 0.5, 0.5, 1.0, 0.6, 0.2 * k, true);
      if (Math.random() < 0.7) FX.part(c.x + rand(-0.7, 0.7) * R, rand(0.1, 0.5), c.z + rand(-0.7, 0.7) * R, 0, rand(0.4, 1.0), 0, 0.09, 0.02, 1.2, gold ? [1, 0.85, 0.4] : [0.8, 0.5, 1], 0.9, 0, -0.2, 0.5);
      if (Math.random() < 0.3) FX.smoke(c.x + rand(-0.5, 0.5) * R, 0.35, c.z + rand(-0.5, 0.5) * R, R * 0.45, gold ? [0.9, 0.8, 0.5] : [0.7, 0.5, 0.9], 1, 0.25);
    }
  },
};
