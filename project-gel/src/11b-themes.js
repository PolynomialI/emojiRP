// ============================================================
// Theme set pieces and moving parts (layouts and features for 11a-arena.js)
// ============================================================

// ---------- Desert Dunes: tumbleweeds roll across with the wind, hopping and bouncing off you ----------
ARENA_FEATURES.desert = {
  init(st, rnd) { st.weeds = []; st.wind = rnd() * TAU; st.spawnT = 1; },
  update(st, dt) {
    const h = G.hero.pos, wx = Math.sin(st.wind), wz = Math.cos(st.wind);
    st.wind += dt * 0.02;
    st.spawnT -= dt;
    if (st.weeds.length < 7 && st.spawnT <= 0) {
      // arrive from upwind, just off screen
      st.spawnT = rand(1.2, 2.6);
      const side = rand(-14, 14), w = { x: h[0] - wx * 20 - wz * side, z: h[2] - wz * 20 + wx * side, y: 0, vy: 2, r: rand(0.45, 0.7), ph: rand(0, 1), sp: rand(2.6, 4.2), dx: wx, dz: wz };
      if (arenaSd(w.x, w.z) < -1) st.weeds.push(w);
    }
    for (const w of st.weeds) {
      // steer back toward the wind, roll, and hop over the ripples
      w.dx += (wx - w.dx) * dt * 0.8; w.dz += (wz - w.dz) * dt * 0.8;
      const l = Math.hypot(w.dx, w.dz) || 1;
      w.x += w.dx / l * w.sp * dt; w.z += w.dz / l * w.sp * dt;
      w.ph += w.sp * dt / (TAU * w.r);
      w.vy -= 14 * dt; w.y += w.vy * dt;
      if (w.y <= 0) { w.y = 0; w.vy = rand(1.2, 3.2); }
      const hit = resolveCircle(w, w.r);
      if (hit) { w.dx = -w.dx + rand(-0.5, 0.5); w.dz = -w.dz + rand(-0.5, 0.5); w.vy = 3; }
      // running into one sends it bouncing away (no damage)
      const hx = w.x - h[0], hz = w.z - h[2], hd = Math.hypot(hx, hz);
      if (hd < w.r + HERO_R && hd > 1e-3) {
        w.dx = hx / hd * 2; w.dz = hz / hd * 2; w.vy = 4.5; w.x = h[0] + hx / hd * (w.r + HERO_R);
        FX.burst(w.x, 0.5, w.z, 6, [0.72, 0.55, 0.32], 3, 0.06, 0.4, 1);
      }
      if (Math.hypot(w.x - h[0], w.z - h[2]) > 34) w.dead = true;
    }
    st.weeds = st.weeds.filter(w => !w.dead);
  },
  emit(st) {
    if (!R.enemyDraw.tumbleweed) return;
    const clip = MODELS.defs.tumbleweed.clips.roll;
    for (const w of st.weeds) {
      if (!onScreen(w.x, w.z, 2)) continue;
      const sc = w.r / 0.45, row = clip.row + Math.floor((w.ph - Math.floor(w.ph)) * clip.frames);
      // the model's pivot sits 0.5 up, so lift it until the ball touches the ground
      pushEnemy('tumbleweed', false, w.x, w.y + (0.45 - 0.5) * sc, w.z, Math.atan2(w.dx, w.dz), row, sc, 1, 0, 0, 0, 1, 1, 1);
      pushDecal(w.x + 0.15, w.z + 0.1, w.r * 0.9, w.r * 0.7, 0, 1, 0, 0, 0.01, 0.02, 0.05, 0.4 * (1 - Math.min(1, w.y / 3)));
    }
  },
};
