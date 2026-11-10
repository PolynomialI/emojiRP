// ============================================================
// Chapter power-ups for chapters 11-15 (data in SKILLS, 10-data.js). Cheap to draw: impostors, ribbons, decals.
// ============================================================

// ---------- Spirit Wisps (chapter 11): ghost wisps circle you, dart through a line of enemies and drift back ----------
SKILL_HOOKS.wisps = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, n = L.count;
    st.w = st.w || [];
    // new wisps join with their dart timers spread out, so they don't all fly at once
    while (st.w.length < n) st.w.push({ x: h[0], y: 1.3, z: h[2], state: 'orbit', cd: 0.4 + st.w.length * 0.5, ph: rand(0, 10), trail: [], hits: null });
    st.a = (st.a || 0) + dt * 2.4;
    st.w.forEach((w, i) => {
      const a = st.a + (i / n) * TAU, ox = h[0] + Math.cos(a) * 1.4, oz = h[2] + Math.sin(a) * 1.4, oy = 1.25 + Math.sin(st.a * 2 + i) * 0.15;
      if (w.state === 'orbit') {
        const k = Math.min(1, dt * 10);
        w.x += (ox - w.x) * k; w.y += (oy - w.y) * k; w.z += (oz - w.z) * k;
        w.vx = -Math.sin(a); w.vz = Math.cos(a);
        w.cd -= dt;
        if (w.cd <= 0) {
          const tgt = nearestEnemy(w.x, w.z, 7.5);
          if (tgt) {
            const dx = tgt.x - w.x, dz = tgt.z - w.z, d = Math.hypot(dx, dz) || 1;
            w.state = 'dart'; w.vx = dx / d; w.vz = dz / d; w.left = d + 2.5; w.hits = new Set(); w.pierce = L.pierce;
            AUDIO.play('pop', 0.35);
          } else w.cd = 0.25;
        }
      } else if (w.state === 'dart') {
        // straight through the line of enemies; each one is hit once
        const step = 15 * dt;
        w.x += w.vx * step; w.z += w.vz * step; w.y += (0.9 - w.y) * Math.min(1, dt * 8); w.left -= step;
        enemiesInRadius(w.x, w.z, 0.55, e => {
          if (w.pierce <= 0 || w.hits.has(e)) return;
          w.hits.add(e); w.pierce--;
          hurtEnemy(e, L.dmg, w.vx * 2, w.vz * 2, { sound: false, color: [0.85, 0.9, 1] });
          FX.burst(e.x, 0.9, e.z, 5, [0.85, 0.92, 1], 3, 0.06, 0.3, 1);
        });
        if (w.left <= 0 || w.pierce <= 0 || arenaSd(w.x, w.z) > -0.3) w.state = 'back';
      } else {
        // drift home to its place in the circle
        const dx = ox - w.x, dz = oz - w.z, d = Math.hypot(dx, dz);
        if (d < 0.4) { w.state = 'orbit'; w.cd = L.cd * cdMul(); }
        else { const sp = Math.min(d, 11 * dt); w.x += dx / d * sp; w.z += dz / d * sp; w.y += (oy - w.y) * Math.min(1, dt * 4); w.vx = dx / d; w.vz = dz / d; }
      }
      w.trail.unshift([w.x, w.y, w.z]); if (w.trail.length > 8) w.trail.pop();
    });
  },
  emit(s) {
    const st = s.st, t = G.run.t;
    if (!st.w) return;
    for (const w of st.w) {
      const big = w.state === 'dart' ? 1.15 : 1;
      pushImp(w.x, w.y, w.z, 0.38 * big, w.vx, 0, w.vz, 1, 43, 0, 0.45, w.ph + t, 0, 0, 0, 0.92);
      trailRibbon(w.trail, 0.16, [0.75, 0.85, 1], w.state === 'dart' ? 0.55 : 0.25);
    }
  },
};

// ---------- Prism Beam (chapter 12): a beam to the nearest enemy that splits on to the next, cutting through everything on each line ----------
const PRISM_COLS = [[1, 0.45, 0.9], [0.45, 0.85, 1], [0.6, 1, 0.55], [1, 0.9, 0.45], [0.75, 0.55, 1]];
SKILL_HOOKS.prism = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos;
    st.beams = (st.beams || []).filter(b => (b.t += dt) < 0.3);
    st.t = (st.t ?? 0.6) - dt;
    if (st.t > 0) return;
    let tgt = nearestEnemy(h[0], h[2], 8);
    if (!tgt) { st.t = 0.2; return; }
    st.t = L.cd * cdMul();
    const w = L.width * areaMul(), hit = new Set(), pts = [[h[0], 1.1, h[2]]];
    let x = h[0], z = h[2];
    for (let i = 0; i <= L.bounces && tgt; i++) {
      // each line runs on a little past its target, so it also cuts whatever stands behind
      const dx = tgt.x - x, dz = tgt.z - z, d = Math.hypot(dx, dz) || 1, len = d + 1.2, rot = Math.atan2(dx, dz);
      enemiesInRadius(x + dx / d * len / 2, z + dz / d * len / 2, len / 2 + w + 0.5, e => {
        if (hit.has(e) || !laneHit(x, z, rot, len, w + (e.radius || 0.4) * 0.5, e.x, e.z)) return;
        hit.add(e); hurtEnemy(e, L.dmg, dx / d * 1.5, dz / d * 1.5, { sound: false, color: [1, 0.75, 1] });
      });
      hit.add(tgt);
      pts.push([tgt.x, 0.9, tgt.z]);
      x = tgt.x; z = tgt.z;
      // refract to the nearest enemy this beam hasn't touched yet
      let best = null, bd = 6;
      enemiesInRadius(x, z, 6, e => { if (hit.has(e)) return; const ed = Math.hypot(e.x - x, e.z - z); if (ed < bd) { bd = ed; best = e; } });
      tgt = best;
    }
    st.beams.push({ pts, t: 0, w });
    AUDIO.play('zap', 0.4);
  },
  emit(s) {
    const st = s.st;
    if (!st.beams) return;
    for (const b of st.beams) {
      const a = 1 - b.t / 0.3;
      for (let i = 0; i < b.pts.length - 1; i++) {
        const p = b.pts[i], q = b.pts[i + 1], c = PRISM_COLS[i % PRISM_COLS.length], seg = [p[0], p[1], p[2], q[0], q[1], q[2]];
        R.ribStrip(seg, 2, b.w * 0.45, [1, 1, 1, a], 0);
        R.ribStrip(seg, 2, b.w * 1.5, [c[0], c[1], c[2], 0.55 * a], 0);
        pushImp(q[0], q[1], q[2], 0.22 * (0.5 + a), 0, 0, 1, 1, 44, 0, 0.6, G.run.t * 2 + i, 0, 2, 0, a);
      }
    }
  },
};

// ---------- Gale Crescents (chapter 13): crescents of wind slash at the nearest crowd, cutting through and blowing enemies back ----------
SKILL_HOOKS.gale = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos;
    st.blades = st.blades || [];
    st.t = (st.t ?? 0.8) - dt;
    if (st.t <= 0) {
      let tgt = clusterTarget(h[0], h[2], 9);
      if (!tgt) { const e = nearestEnemy(h[0], h[2], 9); if (e) tgt = [e.x, e.z]; }
      if (tgt) {
        st.t = L.cd * cdMul();
        const base = Math.atan2(tgt[0] - h[0], tgt[1] - h[2]), n = L.count, size = L.size * areaMul();
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.32;
          st.blades.push({ x: h[0] + Math.sin(a) * 0.6, z: h[2] + Math.cos(a) * 0.6, dx: Math.sin(a), dz: Math.cos(a), t: 0, life: 0.75, size, hits: new Set(), ph: rand(0, 10) });
        }
        AUDIO.play('throw', 0.45);
      } else st.t = 0.2;
    }
    for (const b of st.blades) {
      b.t += dt;
      b.x += b.dx * 12 * dt; b.z += b.dz * 12 * dt;
      enemiesInRadius(b.x, b.z, 0.8 * b.size, e => {
        if (b.hits.has(e)) return;
        b.hits.add(e);
        const push = e.boss ? 0.5 : 6;
        hurtEnemy(e, L.dmg, b.dx * push, b.dz * push, { sound: false, color: [0.85, 0.95, 1] });
      });
      if (Math.random() < 0.5) FX.part(b.x + rand(-0.4, 0.4) * b.size, 0.8, b.z + rand(-0.4, 0.4) * b.size, b.dx * 3, 0, b.dz * 3, 0.06, 0.02, 0.3, [0.9, 0.97, 1], 0.7, 1, 0, 0);
      if (arenaSd(b.x, b.z) > 0) b.t = b.life;
    }
    st.blades = st.blades.filter(b => b.t < b.life);
  },
  emit(s) {
    const st = s.st;
    if (!st.blades) return;
    for (const b of st.blades) {
      const a = Math.min(1, (b.life - b.t) / 0.15);
      pushImp(b.x, 0.85, b.z, 0.62 * b.size, b.dx, 0, b.dz, 1, 45, 0, 0.5, b.ph, 0, 0, 0, 0.85 * a);
      pushDecal(b.x, b.z, 0.7 * b.size, 0.3 * b.size, -Math.atan2(b.dx, b.dz), 1, 0, 0, 0.1, 0.2, 0.4, 0.15 * a);
    }
  },
};

// ---------- Yo-Yo (chapter 14): yo-yos spin out at enemies, hang for a moment and zip back, hitting everything both ways ----------
SKILL_HOOKS.yoyo = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, range = L.range * areaMul();
    st.yo = st.yo || [];
    st.t = (st.t ?? 0.5) - dt;
    if (st.t <= 0 && !st.yo.length) {
      // the nearest few enemies, one yo-yo each
      const near = [];
      enemiesInRadius(h[0], h[2], range + 1, e => near.push([Math.hypot(e.x - h[0], e.z - h[2]), e]));
      near.sort((a, b) => a[0] - b[0]);
      if (near.length) {
        st.t = L.cd * cdMul();
        for (let i = 0; i < L.count; i++) {
          const e = near[i] ? near[i][1] : near[0][1], spread = near[i] ? 0 : (i % 2 ? 1 : -1) * 0.5;
          const a = Math.atan2(e.x - h[0], e.z - h[2]) + spread;
          st.yo.push({ x: h[0], z: h[2], dx: Math.sin(a), dz: Math.cos(a), d: 0, state: 'out', t: 0, hits: new Set(), ph: rand(0, 10), col: i % 3 });
        }
        AUDIO.play('throw', 0.35);
      } else st.t = 0.2;
    }
    for (const y of st.yo) {
      y.ph += dt;
      if (y.state === 'out') {
        y.d = Math.min(range, y.d + 16 * dt);
        y.x = h[0] + y.dx * y.d; y.z = h[2] + y.dz * y.d;
        if (y.d >= range || arenaSd(y.x, y.z) > -0.3) { y.state = 'hang'; y.t = 0.15; }
      } else if (y.state === 'hang') {
        y.x = h[0] + y.dx * y.d; y.z = h[2] + y.dz * y.d;
        if ((y.t -= dt) <= 0) { y.state = 'back'; y.hits = new Set(); }
      } else {
        // reels back to wherever you are now
        y.d -= 18 * dt;
        y.x = h[0] + y.dx * Math.max(0, y.d); y.z = h[2] + y.dz * Math.max(0, y.d);
        if (y.d <= 0.3) y.done = true;
      }
      enemiesInRadius(y.x, y.z, 0.75, e => {
        if (y.hits.has(e)) return;
        y.hits.add(e);
        hurtEnemy(e, L.dmg, y.dx * (y.state === 'back' ? -3 : 3), y.dz * (y.state === 'back' ? -3 : 3), { sound: false });
        FX.burst(e.x, 0.8, e.z, 4, [1, 0.9, 0.6], 3, 0.06, 0.25, 1);
      });
    }
    st.yo = st.yo.filter(y => !y.done);
  },
  emit(s) {
    const st = s.st, h = G.hero.pos;
    if (!st.yo) return;
    for (const y of st.yo) {
      pushImp(y.x, 0.85, y.z, 0.36, y.dx, 0, y.dz, 1, 46, 0, 0.12, y.ph, [0, 2, 4][y.col], 0, 0, 1);
      R.ribStrip([h[0], 1.1, h[2], y.x, 0.9, y.z], 2, 0.035, [1, 1, 1, 0.85], 0);
      pushDecal(y.x + 0.06, y.z + 0.05, 0.3, 0.3, 0, 1, 0, 0, 0.02, 0.03, 0.07, 0.35);
    }
  },
};
