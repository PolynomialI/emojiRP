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

// ---------- Neon City: a street grid with office blocks, a giant tower, parked cars and lamps ----------
// Streets run every 24 m (see the city floor style); blocks sit between them, centred at ±12 and ±36.
const CITY_GREYS = ['#c9c2b6', '#b4bccb', '#d6c9b8', '#a9b2c4', '#c7b3b0', '#bfc8bd'];
const CAR_COLORS = ['#e8433a', '#3a7be8', '#f2c230', '#f4f4f4', '#3ab06a', '#a24fd8', '#ff8a1f', '#2b2f3a'];
ARENA_LAYOUTS.city = (A) => {
  const rnd = A.rnd, pick = arr => arr[Math.floor(rnd() * arr.length)], C = hexToRgb;
  const B = [-36, -12, 12, 36];
  for (const bx of B) for (const bz of B) {
    if (bx === 12 && bz === -12) {
      // the landmark tower, right next to where you start
      A.prop('tower', bx, bz, 0, { shape: 'box', hw: 4.7, hd: 4.7, scale: 9.6, yaw: 0, model: 'tower', tint: C('#9aa6bd'), height: 28 });
      continue;
    }
    if (rnd() < 0.2) {
      // a little park: trees around a fountain
      A.zone('fountain', bx, bz, 2.4);
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rnd() * 0.4; A.prop('tree', bx + Math.cos(a) * 4.6, bz + Math.sin(a) * 4.6, 0.4 + rnd() * 0.15); }
      continue;
    }
    const w = 3.6 + rnd() * 0.9, model = pick(['building0', 'building1', 'building2', 'building0']);
    const H = { building0: 1.06, building1: 1.54, building2: 0.74 }[model] * w * 2;
    A.prop('building', bx + (rnd() - 0.5) * 1.5, bz + (rnd() - 0.5) * 1.5, 0, { shape: 'box', hw: w, hd: w, scale: w * 2, yaw: Math.floor(rnd() * 4) * Math.PI / 2, model, tint: C(pick(CITY_GREYS)), height: H });
  }
  // parked cars along the kerbs, never in the middle of a crossing or on the start
  for (const road of [-48, -24, 0, 24, 48]) {
    for (let t = -46; t <= 46; t += 5.5) {
      if (rnd() > 0.32) continue;
      const lane = (rnd() < 0.5 ? -1 : 1) * 3.1, along = t + (rnd() - 0.5) * 2;
      if (Math.abs(along - 24 * Math.round(along / 24)) < 6.5) continue;
      for (const vertical of [true, false]) {
        if (rnd() < 0.5) continue;
        const x = vertical ? road + lane : along, z = vertical ? along : road + lane;
        if (Math.hypot(x, z) < 9 || arenaSd(x, z) > -2) continue;
        const s = 2.5, yaw = (vertical ? 0 : Math.PI / 2) + (lane > 0 ? Math.PI : 0);
        A.prop('car', x, z, 0, { shape: 'box', hw: vertical ? 0.24 * s : 0.5 * s, hd: vertical ? 0.5 * s : 0.24 * s, scale: s, yaw, tint: C(pick(CAR_COLORS)) });
      }
    }
  }
  // streetlamps on the corners, facing the road
  for (const rx of [-48, -24, 0, 24, 48]) for (const rz of [-48, -24, 0, 24, 48]) {
    for (const [sx, sz] of [[1, 1], [-1, -1]]) {
      const x = rx + sx * 5.6, z = rz + sz * 5.6;
      if (rnd() < 0.35 || arenaSd(x, z) > -2) continue;
      A.prop('streetlamp', x, z, 0.22, { scale: 1.9, yaw: sx > 0 ? -Math.PI * 0.75 : Math.PI * 0.25 });
    }
  }
};
ARENA_FEATURES.city = {
  init(st) { st.lamps = ARENA.props.filter(o => o.kind === 'streetlamp'); st.tall = ARENA.props.filter(o => o.height); },
  update(st, dt) {
    // see-through: a building that hides the hero fades out (the camera looks north, so "behind" is smaller z)
    const h = G.hero.pos;
    for (const o of st.tall) {
      const behind = Math.abs(h[0] - o.x) < o.hw + 1.5 && h[2] < o.z + o.hd + 0.5 && h[2] > o.z - o.hd - o.height * 0.85;
      o.fade = clamp((o.fade || 0) + (behind ? 3 : -3) * dt, 0, 0.72);
    }
  },
  emit(st) {
    // warm pools of light under the lamps
    for (const o of st.lamps) {
      if (!onScreen(o.x, o.z, 3)) continue;
      const fx = o.x + Math.sin(o.yaw) * 0.5, fz = o.z + Math.cos(o.yaw) * 0.5;
      pushDecal(fx, fz, 2.6, 2.6, 0, 1, 0, 0, 1.0, 0.82, 0.45, 0.32, true);
    }
  },
};
