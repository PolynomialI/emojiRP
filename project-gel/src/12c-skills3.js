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

// ---------- Ptero Strike (chapter 18): pterodactyls swoop out of the sky onto enemies and slam into them and
// everything around; evolved (Sky Flock), each one swoops onto a second target before flying off ----------
const PTERO = { dive: 0.6, height: 7, hop: 0.45 };
SKILL_HOOKS.ptero = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, rad = L.radius * areaMul();
    st.birds = st.birds || [];
    st.t = (st.t ?? 1) - dt;
    if (st.t <= 0) {
      const near = [];
      enemiesInRadius(h[0], h[2], 10, e => near.push(e));
      if (near.length) {
        st.t = L.cd * cdMul();
        for (let i = 0; i < L.count; i++) {
          const tg = near[Math.floor(Math.random() * near.length)], a = rand(0, TAU);
          st.birds.push({ sx: tg.x + Math.cos(a) * 9, sy: PTERO.height, sz: tg.z + Math.sin(a) * 9, tg, tx: tg.x, tz: tg.z, t: -i * 0.12, dur: PTERO.dive, state: 'dive', hits: s.evo ? 2 : 1, ph: rand(0, 10), x: tg.x, y: PTERO.height, z: tg.z, px: 0, py: 0, pz: 0 });
        }
        AUDIO.play('wind', 0.45);
      } else st.t = 0.3;
    }
    for (const b of st.birds) {
      b.ph += dt; b.t += dt; b.px = b.x; b.py = b.y; b.pz = b.z;
      if (b.state === 'dive') {
        if (b.t < 0) continue;
        if (b.tg && !b.tg.dying) { b.tx = b.tg.x; b.tz = b.tg.z; }
        const u = Math.min(1, b.t / b.dur);
        b.x = lerp(b.sx, b.tx, u); b.z = lerp(b.sz, b.tz, u); b.y = lerp(b.sy, 0.7, u * u);
        if (u < 1) continue;
        enemiesInRadius(b.tx, b.tz, rad, e => hurtEnemy(e, e === b.tg ? L.dmg * 1.5 : L.dmg, (e.x - b.tx) * 3, (e.z - b.tz) * 3, { sound: false }));
        FX.ring(b.tx, b.tz, rad * 1.3, s.evo ? [1, 0.85, 0.35] : [1, 0.6, 0.3], 0.35); FX.burst(b.tx, 0.4, b.tz, 10, [0.85, 0.75, 0.6], 4, 0.1, 0.4, 2); FX.crack(b.tx, b.tz, rad * 0.7, 1);
        G.cam.shake = Math.max(G.cam.shake, 0.04); AUDIO.play('punch', 0.7);
        // Sky Flock: hop up and swoop onto the next enemy nearby
        let next = null;
        if (--b.hits > 0) { let bd = 6; enemiesInRadius(b.tx, b.tz, 6, e => { const dd = Math.hypot(e.x - b.tx, e.z - b.tz); if (e !== b.tg && dd < bd && dd > 0.8) { bd = dd; next = e; } }); }
        if (next) { Object.assign(b, { sx: b.x, sy: 3, sz: b.z, tg: next, tx: next.x, tz: next.z, t: 0, dur: PTERO.hop }); b.y = 3; }
        else { b.state = 'leave'; b.t = 0; const a = rand(0, TAU); b.lx = Math.cos(a); b.lz = Math.sin(a); }
      } else {
        b.x += b.lx * 12 * dt; b.z += b.lz * 12 * dt; b.y += 9 * dt;
        if (b.t > 0.8) b.done = true;
      }
    }
    st.birds = st.birds.filter(b => !b.done);
  },
  emit(s) {
    const st = s.st;
    if (!st.birds) return;
    for (const b of st.birds) {
      if (b.state === 'dive' && b.t < 0) continue;
      let dx = b.x - b.px, dy = b.y - b.py, dz = b.z - b.pz;
      const l = Math.hypot(dx, dy, dz);
      if (l < 1e-4) { dx = 0; dy = -1; dz = 0.01; } else { dx /= l; dy /= l; dz /= l; }
      pushImp(b.x, b.y, b.z, 0.62, dx, dy * 0.6, dz, 1, 50, 0, 0.1, b.ph, s.evo ? 1 : 0, 0, 0, 1);
      const g = clamp(1 - b.y / 8, 0.2, 1);
      pushDecal(b.x, b.z, 0.9 * g, 0.5 * g, -Math.atan2(dx, dz), 1, 0, 0, 0.01, 0.03, 0.07, 0.4 * g);
    }
  },
};

// ---------- Rolling Pin (chapter 19): giant rolling pins roll out across the floor and flatten everything in their
// path; evolved (Steamroller), golden and half again as wide, they roll back to you and flatten everything again ----------
const PIN = { v: 10, range: 9 };
SKILL_HOOKS.rollingpin = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, w = L.width * areaMul();
    st.pins = st.pins || [];
    st.t = (st.t ?? 0.8) - dt;
    if (st.t <= 0) {
      let tgt = null, bd = 9;
      enemiesInRadius(h[0], h[2], 9, e => { const d = Math.hypot(e.x - h[0], e.z - h[2]); if (d < bd) { bd = d; tgt = e; } });
      if (tgt) {
        st.t = L.cd * cdMul();
        const base = Math.atan2(tgt.x - h[0], tgt.z - h[2]);
        for (let i = 0; i < L.count; i++) { const a = base + i * TAU / L.count; st.pins.push({ x: h[0], z: h[2], dx: Math.sin(a), dz: Math.cos(a), d: 0, hits: new Set(), ph: rand(0, 10), back: false }); }
        AUDIO.play('throw', 0.5);
      } else st.t = 0.25;
    }
    for (const p of st.pins) {
      const step = PIN.v * dt;
      if (!p.back) {
        p.d += step; p.x += p.dx * step; p.z += p.dz * step;
        if (p.d >= PIN.range || arenaSd(p.x, p.z) > -0.5 || inRock(p.x, p.z)) { if (s.evo) { p.back = true; p.hits = new Set(); } else p.done = true; }
      } else {
        const bx = h[0] - p.x, bz = h[2] - p.z, bd = Math.hypot(bx, bz) || 1;
        p.dx = -bx / bd; p.dz = -bz / bd;
        p.x += bx / bd * step * 1.2; p.z += bz / bd * step * 1.2;
        if (bd < 0.9) p.done = true;
      }
      p.ph += step / (0.3 * w * 8) * (p.back ? -1 : 1);
      // everything across the pin's width and under it gets flattened
      enemiesInRadius(p.x, p.z, w + 0.5, e => {
        if (p.hits.has(e) || Math.abs((e.x - p.x) * p.dx + (e.z - p.z) * p.dz) > 0.6 + e.radius * 0.5) return;
        p.hits.add(e);
        hurtEnemy(e, L.dmg, p.dx * (p.back ? -5 : 5), p.dz * (p.back ? -5 : 5), { sound: false });
        e.squash = 0.35; e.squashV = 0;
      });
    }
    st.pins = st.pins.filter(p => !p.done);
  },
  emit(s, L) {
    const st = s.st;
    if (!st.pins || !L) return;
    const w = L.width * areaMul(), sc = w / 1.05;
    for (const p of st.pins) {
      pushImp(p.x, 0.33 * sc, p.z, sc, p.dx, 0, p.dz, 1, 51, 0, 0.08, p.ph, s.evo ? 1 : 0, 0, 0, 1);
      pushDecal(p.x + 0.1, p.z + 0.08, w * 1.05, 0.35 * sc, -Math.atan2(p.dz, -p.dx), 1, 0, 0, 0.01, 0.03, 0.07, 0.4);
      if (Math.random() < 0.4) FX.part(p.x - p.dx * 0.3, 0.1, p.z - p.dz * 0.3, rand(-0.5, 0.5), rand(0.3, 0.8), rand(-0.5, 0.5), 0.07, 0.02, 0.6, [1, 0.97, 0.9], 0.7, 2, 0, 1);
    }
  },
};

// ---------- Fissure (chapter 20): cracks race out across the ground toward the nearest enemies, jagged rock spikes
// bursting up along them; evolved (Great Rift), each crack splits in two at its end and the spikes are golden ----------
const FISSURE = { v: 15, width: 0.85, every: 0.75, life: 0.95 };
SKILL_HOOKS.fissure = {
  update(s, L, dt) {
    const st = s.st, h = G.hero.pos, w = FISSURE.width * areaMul();
    st.cracks = st.cracks || []; st.spikes = st.spikes || [];
    st.t = (st.t ?? 0.9) - dt;
    if (st.t <= 0) {
      const near = [];
      enemiesInRadius(h[0], h[2], L.len + 1, e => near.push(e));
      if (near.length) {
        st.t = L.cd * cdMul();
        near.sort((a, b) => Math.hypot(a.x - h[0], a.z - h[2]) - Math.hypot(b.x - h[0], b.z - h[2]));
        const base = Math.atan2(near[0].x - h[0], near[0].z - h[2]);
        for (let i = 0; i < L.count; i++) {
          // one crack at each of the nearest enemies; any left over fan out evenly
          const e = near[i], a = e ? Math.atan2(e.x - h[0], e.z - h[2]) : base + i * TAU / L.count;
          st.cracks.push({ x: h[0], z: h[2], dx: Math.sin(a), dz: Math.cos(a), d: 0, len: L.len, next: 0.7, hits: new Set(), split: !!s.evo });
        }
        AUDIO.play('punch', 0.6);
        G.cam.shake = Math.max(G.cam.shake, 0.05);
      } else st.t = 0.3;
    }
    for (const c of st.cracks) {
      const step = FISSURE.v * dt;
      c.d += step; c.x += c.dx * step; c.z += c.dz * step;
      if (c.d >= c.next) {
        c.next += FISSURE.every;
        st.spikes.push({ x: c.x, z: c.z, t: 0, yaw: rand(0, TAU), s: rand(0.85, 1.15) * w, gold: !!s.evo });
        FX.crack(c.x, c.z, 1.0 * w, 2.2);
        FX.burst(c.x, 0.2, c.z, 5, [0.55, 0.48, 0.4], 3.5, 0.09, 0.45, 1, 2.5);
        enemiesInRadius(c.x, c.z, w + 1, e => {
          if (c.hits.has(e) || Math.hypot(e.x - c.x, e.z - c.z) > w + e.radius) return;
          c.hits.add(e);
          hurtEnemy(e, L.dmg, c.dx * 2, c.dz * 2, { sound: false });
          e.squash = 1.25; e.squashV = -4;
        });
      }
      if (c.d >= c.len || arenaSd(c.x, c.z) > -0.5 || inRock(c.x, c.z)) {
        c.done = true;
        if (c.split) for (const turn of [-0.6, 0.6]) {
          const a = Math.atan2(c.dx, c.dz) + turn;
          st.cracks.push({ x: c.x, z: c.z, dx: Math.sin(a), dz: Math.cos(a), d: 0, len: c.len * 0.45, next: 0.4, hits: c.hits, split: false });
        }
      }
    }
    st.cracks = st.cracks.filter(c => !c.done);
    for (const sp of st.spikes) sp.t += dt;
    st.spikes = st.spikes.filter(sp => sp.t < FISSURE.life);
  },
  emit(s) {
    const st = s.st;
    if (!st.spikes) return;
    const mesh = R.enemyDraw.stalag, rc = R.frame.rockCol;
    for (const sp of st.spikes) {
      // bursts up, holds, then sinks back into the ground
      const up = easeOutBack(clamp(sp.t / 0.14, 0, 1)), down = smoothstep(FISSURE.life - 0.3, FISSURE.life, sp.t), k = up * (1 - down);
      const sc = sp.s * 1.7;
      if (mesh) pushEnemy('stalag', false, sp.x, -(1 - k) * 0.9 * sc, sp.z, sp.yaw, MODELS.defs.stalag.clips.still.row, sc, 1, 0, 0, 0, sp.gold ? 1.25 : rc[0] * 1.1, sp.gold ? 0.95 : rc[1] * 1.1, sp.gold ? 0.3 : rc[2] * 1.1);
      else pushImp(sp.x, (k - 0.5) * 0.7 * sc, sp.z, 0.7 * sc, 0, 1, 0, 1, 52, 0, 0.05, 0, sp.gold ? 1 : 0, 0, 0, 1);
      pushDecal(sp.x, sp.z, 0.7 * sp.s, 0.7 * sp.s, sp.yaw, 1, 0, 0, 0.02, 0.015, 0.01, 0.5 * k);
    }
  },
};
