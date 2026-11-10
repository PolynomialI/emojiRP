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
