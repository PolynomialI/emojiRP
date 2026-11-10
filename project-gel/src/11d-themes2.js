// ============================================================
// Chapters 11-15: set pieces and moving parts (layouts and features for 11a-arena.js)
// ============================================================

// ---------- Haunted Graveyard: will-o'-wisps drifting between the graves, and the jack-o'-lanterns flickering ----------
ARENA_FEATURES.graveyard = {
  init(st) { st.lanterns = ARENA.props.filter(o => o.kind === 'pumpkin'); st.acc = 0; },
  update(st, dt) {
    const h = G.hero.pos;
    st.acc += dt * (FX.reduced ? 1.5 : 4);
    for (; st.acc >= 1; st.acc--) FX.part(h[0] + rand(-14, 14), rand(0.3, 1.6), h[2] + rand(-11, 8), rand(-0.4, 0.4), rand(0.05, 0.3), rand(-0.4, 0.4), rand(0.1, 0.16), 0.03, rand(2, 3.5), [0.72, 0.58, 1], 1, 0, 0, 0.2);
  },
  emit(st) {
    const t = G.run ? G.run.t : 0;
    for (const o of st.lanterns) {
      if (!onScreen(o.x, o.z, 2)) continue;
      const sc = o.r / PROP_KINDS.pumpkin.unit, fl = 0.75 + 0.25 * Math.sin(t * 9 + o.ph * 5) * Math.sin(t * 5.3 + o.ph);
      FX.glow(o.x, 0.35 * sc, o.z, 1.1 * sc, [1, 0.6, 0.2], 0.05, 0.55 * fl);
    }
  },
};

// ---------- Crystal Caverns: the crystals glow, and sparkles drift up through the dark ----------
ARENA_FEATURES.caverns = {
  init(st) { st.crystals = ARENA.props.filter(o => o.kind === 'crystal'); st.acc = 0; },
  update(st, dt) {
    const h = G.hero.pos;
    st.acc += dt * (FX.reduced ? 2 : 6);
    for (; st.acc >= 1; st.acc--) FX.part(h[0] + rand(-14, 14), rand(0.1, 1.2), h[2] + rand(-11, 8), rand(-0.2, 0.2), rand(0.2, 0.5), rand(-0.2, 0.2), rand(0.06, 0.1), 0.02, rand(1.5, 3), Math.random() < 0.5 ? [0.5, 0.95, 1] : [1, 0.55, 0.95], 1, 3, 0, 0.2);
  },
  emit(st) {
    const t = G.run ? G.run.t : 0;
    for (const o of st.crystals) {
      if (!onScreen(o.x, o.z, 2)) continue;
      const sc = o.r / PROP_KINDS.crystal.unit;
      FX.glow(o.x, 0.6 * sc, o.z, 1.3 * sc, o.tint || [0.5, 0.9, 1], 0.05, 0.3 + 0.12 * Math.sin(t * 2 + o.ph));
    }
  },
};

// ---------- Sky Islands: wisps of cloud and wind streaks blowing past, and bird shadows wheeling overhead ----------
ARENA_FEATURES.sky = {
  init(st, rnd) { st.acc = 0; st.birds = Array.from({ length: 3 }, () => ({ a: rnd() * TAU, r: 5 + rnd() * 7, w: (rnd() < 0.5 ? -1 : 1) * (0.35 + rnd() * 0.25), cx: 0, cz: 0 })); },
  update(st, dt) {
    const h = G.hero.pos;
    st.acc += dt * (FX.reduced ? 2 : 5);
    for (; st.acc >= 1; st.acc--) {
      if (Math.random() < 0.5) FX.part(h[0] - 15, rand(0.2, 2.2), h[2] + rand(-11, 8), rand(6, 9), 0, rand(-0.5, 0.5), 0.07, 0.02, rand(2.5, 4), [1, 1, 1], 0.6, 1, 0, 0);
      else FX.smoke(h[0] + rand(-14, 14), rand(0.1, 0.5), h[2] + rand(-11, 8), rand(0.6, 1.1), [1, 1, 1], rand(1.5, 2.5), 0.05);
    }
    for (const b of st.birds) { b.a += b.w * dt; b.cx += (h[0] - b.cx) * dt * 0.3; b.cz += (h[2] - b.cz) * dt * 0.3; }
  },
  emit(st) {
    for (const b of st.birds) {
      const x = b.cx + Math.cos(b.a) * b.r, z = b.cz + Math.sin(b.a) * b.r, flap = 0.8 + 0.2 * Math.sin(G.run ? G.run.t * 7 + b.r : 0);
      pushDecal(x, z, 0.9 * flap, 0.32, -(b.a + (b.w > 0 ? Math.PI / 2 : -Math.PI / 2)) + Math.PI / 2, 1, 0, 0, 0.15, 0.25, 0.45, 0.18);
    }
  },
};

// ---------- Toy Workshop: wind-up cars zip across the floor and bounce off anything in their way (and off you) ----------
ARENA_FEATURES.toys = {
  init(st) { st.cars = []; st.spawnT = 1; },
  update(st, dt) {
    const h = G.hero.pos;
    st.spawnT -= dt;
    if (st.cars.length < 5 && st.spawnT <= 0) {
      st.spawnT = rand(1, 2.4);
      const a = rand(0, TAU), c = { x: h[0] + Math.cos(a) * 16, z: h[2] + Math.sin(a) * 13, dir: a + Math.PI + rand(-0.5, 0.5), sp: rand(4, 6.5), life: 9, tint: hexToRgb(pick(PROP_KINDS.toyblock.tints)), hop: 0 };
      if (arenaSd(c.x, c.z) < -1) st.cars.push(c);
    }
    for (const c of st.cars) {
      c.life -= dt; c.hop = Math.max(0, c.hop - dt * 4);
      c.x += Math.cos(c.dir) * c.sp * dt; c.z += Math.sin(c.dir) * c.sp * dt;
      if (resolveCircle(c, 0.3)) { c.dir += Math.PI + rand(-0.6, 0.6); c.hop = 1; }
      const hx = c.x - h[0], hz = c.z - h[2];
      if (Math.hypot(hx, hz) < 0.3 + HERO_R) { c.dir = Math.atan2(hz, hx) + rand(-0.4, 0.4); c.hop = 1; }
      if (Math.random() < 0.15) FX.smoke(c.x - Math.cos(c.dir) * 0.35, 0.15, c.z - Math.sin(c.dir) * 0.35, 0.2, [1, 1, 1], 0.4, 0.2);
    }
    st.cars = st.cars.filter(c => c.life > 0 && arenaSd(c.x, c.z) < 0);
  },
  emit(st) {
    if (!R.enemyDraw.toycar) return;
    const row = MODELS.defs.toycar.clips.still.row;
    for (const c of st.cars) {
      if (!onScreen(c.x, c.z, 1)) continue;
      pushEnemy('toycar', false, c.x, Math.sin(c.hop * Math.PI) * 0.25, c.z, Math.PI / 2 - c.dir, row, 1, 1, 0, 0, 0, c.tint[0], c.tint[1], c.tint[2]);
      pushDecal(c.x + 0.06, c.z + 0.05, 0.25, 0.4, -(Math.PI / 2 - c.dir), 1, 0, 0, 0.02, 0.02, 0.05, 0.35);
    }
  },
};

// ---------- Coral Reef: bubbles rising from the clams and the sand, and the shadows of fish swimming over ----------
ARENA_FEATURES.reef = {
  init(st, rnd) {
    st.acc = 0; st.clams = ARENA.props.filter(o => o.kind === 'clam');
    st.fish = Array.from({ length: 5 }, () => ({ a: rnd() * TAU, r: 4 + rnd() * 8, w: (rnd() < 0.5 ? -1 : 1) * (0.4 + rnd() * 0.35), cx: 0, cz: 0, s: 0.6 + rnd() * 0.6 }));
  },
  update(st, dt) {
    const h = G.hero.pos;
    st.acc += dt * (FX.reduced ? 2 : 6);
    for (; st.acc >= 1; st.acc--) FX.part(h[0] + rand(-14, 14), 0.1, h[2] + rand(-11, 8), rand(-0.2, 0.2), rand(1.0, 1.8), rand(-0.2, 0.2), rand(0.06, 0.12), 0.02, rand(1.2, 2), [0.85, 0.97, 1], 0.6, 4, 0, 0.2);
    for (const o of st.clams) if (Math.random() < dt * 3 && onScreen(o.x, o.z, 1)) FX.part(o.x + rand(-0.2, 0.2), 0.5, o.z + rand(-0.2, 0.2), 0, rand(1.2, 2), 0, rand(0.08, 0.14), 0.03, 1.5, [0.9, 1, 1], 0.7, 4, 0, 0.2);
    for (const f of st.fish) { f.a += f.w * dt; f.cx += (h[0] - f.cx) * dt * 0.3; f.cz += (h[2] - f.cz) * dt * 0.3; }
  },
  emit(st) {
    for (const f of st.fish) {
      const x = f.cx + Math.cos(f.a) * f.r, z = f.cz + Math.sin(f.a) * f.r, rot = -(f.a + (f.w > 0 ? Math.PI / 2 : -Math.PI / 2)) + Math.PI / 2;
      pushDecal(x, z, 0.22 * f.s, 0.55 * f.s, rot, 1, 0, 0, 0.02, 0.15, 0.25, 0.2);
    }
  },
};
