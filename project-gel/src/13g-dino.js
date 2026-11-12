// ============================================================
// Chapter 18, Dino Valley: tar pits bubble, pterosaur shadows glide over the grass, and ash drifts down from a
// far-off volcano. The boss is the Goo T-Rex.
// ============================================================
ARENA_FEATURES.dino = {
  init(st) { st.tar = ARENA.zones.filter(o => o.kind === 'tarpit'); st.birds = [0, 1, 2].map(i => ({ a: i * 2.1, r: 14 + i * 4, w: 0.12 + i * 0.03 })); st.acc = 0; },
  update(st, dt) {
    const h = G.hero.pos;
    for (const o of st.tar) {
      if (!onScreen(o.x, o.z, o.r) || Math.random() > dt * 3) continue;
      const a = rand(0, TAU), r = rand(0, o.r * 0.7), x = o.x + Math.cos(a) * r, z = o.z + Math.sin(a) * r;
      FX.part(x, 0.08, z, 0, 0.2, 0, 0.18, 0.3, 0.5, [0.12, 0.1, 0.09], 0.9, 2);
      if (Math.random() < 0.3) FX.ring(x, z, 0.5, [0.25, 0.2, 0.18], 0.4, 0.5);
    }
    for (const b of st.birds) b.a += b.w * dt;
    st.acc += dt * (FX.reduced ? 1 : 3);
    for (; st.acc >= 1; st.acc--) FX.part(h[0] + rand(-14, 14), rand(5, 7), h[2] + rand(-11, 8), rand(-0.2, 0.2), -0.4, rand(-0.2, 0.2), 0.05, 0.04, 6, [0.45, 0.42, 0.4], 0.6, 2, 0, 0.05);
  },
  emit(st) {
    // the shadows of pterosaurs circling high overhead
    const h = G.hero.pos, t = G.run ? G.run.t : 0;
    for (const b of st.birds) {
      const x = h[0] * 0.6 + Math.cos(b.a) * b.r, z = h[2] * 0.6 + Math.sin(b.a) * b.r * 0.7, flap = 0.85 + 0.15 * Math.sin(t * 5 + b.r);
      if (!onScreen(x, z, 3)) continue;
      pushDecal(x, z, 1.6 * flap, 0.45, -(b.a + Math.PI / 2), 1, 0, 0, 0.02, 0.04, 0.03, 0.25);
      pushDecal(x, z, 0.35, 0.8, -(b.a + Math.PI / 2), 1, 0, 0, 0.02, 0.04, 0.03, 0.25);
    }
  },
};

// ---------- the Goo T-Rex: a roar that blasts a marked cone in front, a tail sweep across a marked fan behind (stand
// in front of it!), stomping charges down marked lanes that shake rocks loose onto marked circles, and in stage 2 a
// rain of volcanic rocks ----------
const TREX = { roarR: 9.5, roarHalf: 0.72, tailR: 5.4, tailHalf: 2.0, chargeV: 16, rockR: 1.35 };
BOSS_AI.trex = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.next === undefined) { ai.next = 0; ai.cd = 1.4; ai.rocks = []; }
  trexRocks(ai, dt);
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.3 : 1)); bossFace(e, dt, 3.5);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const plan = rage ? ['roar', 'charge', 'tail', 'meteor', 'charge', 'roar', 'tail'] : ['roar', 'charge', 'tail', 'charge'];
        const k = plan[ai.next++ % plan.length];
        if (k === 'roar') { ai.state = 'roarWind'; ai.t = ai.dur = 1.0; ai.cone = addTele({ kind: 'cone', x: e.x, z: e.z, r: TREX.roarR, rot: e.yaw, half: TREX.roarHalf, dur: 1.0 }); }
        else if (k === 'tail') { ai.state = 'tailWind'; ai.t = ai.dur = 0.85; addTele({ kind: 'cone', x: e.x, z: e.z, r: TREX.tailR, rot: e.yaw + Math.PI, half: TREX.tailHalf, dur: 0.85 }); }
        else if (k === 'charge') { ai.charges = rage ? 3 : 2; trexAim(e, ai); }
        else {
          ai.state = 'meteor'; ai.t = 1.6;
          for (let i = 0; i < 11; i++) { const a = rand(0, TAU), r = i ? rand(1.5, 8) : 0, o = { x: h[0] + Math.cos(a) * r, z: h[2] + Math.sin(a) * r }; resolveCircle(o, 0.6); trexRock(ai, o.x, o.z, 1.2 + i * 0.07); }
          AUDIO.play('roar', 0.6);
        }
      }
      break;
    }
    case 'roarWind':
      e.clip = 'throw'; e.clipU = (1 - ai.t / ai.dur) * 0.5; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t > 0.3) { bossFace(e, dt, 4); ai.cone.rot = e.yaw; ai.cone.x = e.x; ai.cone.z = e.z; }
      if (ai.t <= 0) {
        const hx = h[0] - e.x, hz = h[2] - e.z, hd = Math.hypot(hx, hz);
        if (hd < TREX.roarR && Math.abs(angleDiff(Math.atan2(hx, hz), e.yaw)) < TREX.roarHalf + 0.08) { hurtHero(32 * run.info.dmgMul, e.x, e.z); run.vel[0] += hx / hd * 14; run.vel[2] += hz / hd * 14; }
        for (let k = 0; k < 14; k++) {
          const a = e.yaw + rand(-TREX.roarHalf, TREX.roarHalf), r = rand(2, TREX.roarR);
          FX.burst(e.x + Math.sin(a) * r, 0.3, e.z + Math.cos(a) * r, 3, [0.8, 0.72, 0.58], 5, 0.12, 0.45, 2);
        }
        enemiesInRadius(e.x, e.z, TREX.roarR, o => { if (!o.boss && Math.abs(angleDiff(Math.atan2(o.x - e.x, o.z - e.z), e.yaw)) < TREX.roarHalf) hurtEnemy(o, 20, (o.x - e.x) * 2, (o.z - e.z) * 2, { sound: false }); });
        FX.ring(e.x + Math.sin(e.yaw) * 2, e.z + Math.cos(e.yaw) * 2, 5, [1, 0.85, 0.6], 0.5);
        G.cam.shake = Math.max(G.cam.shake, 0.35); AUDIO.play('roar'); AUDIO.play('boom', 0.6);
        ai.state = 'recover'; ai.t = 0.7;
      }
      break;
    case 'tailWind':
      e.clip = 'idle'; e.phase += dt * 2; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t <= 0) {
        // the tail whips round the back: everywhere in the fan behind it is hit, the front is safe
        const hx = h[0] - e.x, hz = h[2] - e.z, hd = Math.hypot(hx, hz);
        if (hd < TREX.tailR + HERO_R * 0.5 && Math.abs(angleDiff(Math.atan2(hx, hz), e.yaw + Math.PI)) < TREX.tailHalf) { hurtHero(28 * run.info.dmgMul, e.x, e.z); run.vel[0] += hx / (hd || 1) * 12; run.vel[2] += hz / (hd || 1) * 12; }
        enemiesInRadius(e.x, e.z, TREX.tailR, o => { if (!o.boss) hurtEnemy(o, 18, (o.x - e.x) * 3, (o.z - e.z) * 3, { sound: false }); });
        for (let k = 0; k < 10; k++) { const a = e.yaw + Math.PI + (k / 9 - 0.5) * 2 * TREX.tailHalf; FX.burst(e.x + Math.sin(a) * TREX.tailR * 0.8, 0.3, e.z + Math.cos(a) * TREX.tailR * 0.8, 3, [0.8, 0.72, 0.58], 4, 0.1, 0.4, 2); }
        G.cam.shake = Math.max(G.cam.shake, 0.18); AUDIO.play('throw'); AUDIO.play('punch');
        ai.state = 'spin'; ai.t = 0.35; ai.spin = e.yaw;
      }
      break;
    case 'spin':
      e.clip = 'idle'; e.yaw = ai.spin + (1 - ai.t / 0.35) * TAU;
      if (ai.t <= 0) { e.yaw = ai.spin; ai.state = 'recover'; ai.t = 0.3; }
      break;
    case 'chargeWind':
      e.clip = 'slam'; e.clipU = (1 - ai.t / ai.dur) * 0.5; e.vx *= 0.7; e.vz *= 0.7;
      e.yaw = angleLerp(e.yaw, ai.rot, Math.min(1, dt * 10));
      if (ai.t <= 0) { ai.state = 'charge'; ai.t = 0.95; ai.hit = false; ai.step = 0; AUDIO.play('roar', 0.7); }
      break;
    case 'charge': {
      e.clip = 'run'; e.phase += dt * 3.5;
      const sx = Math.sin(ai.rot), sz = Math.cos(ai.rot);
      e.x += sx * TREX.chargeV * dt; e.z += sz * TREX.chargeV * dt; e.vx = e.vz = 0; e.yaw = ai.rot;
      if (!ai.hit && Math.hypot(h[0] - e.x, h[2] - e.z) < e.radius + HERO_R + 0.3) { ai.hit = true; hurtHero(34 * run.info.dmgMul, e.x, e.z); run.vel[0] += sx * 14; run.vel[2] += sz * 14; }
      enemiesInRadius(e.x, e.z, e.radius + 0.6, o => { if (!o.boss) hurtEnemy(o, 25, sx * 10, sz * 10, { sound: false }); });
      // every heavy footstep shakes rocks loose ahead of it and to the sides
      ai.step -= dt;
      if (ai.step <= 0) {
        ai.step = 0.3;
        G.cam.shake = Math.max(G.cam.shake, 0.12); AUDIO.play('boom', 0.5); FX.crack(e.x, e.z, 1.5, 1.2);
        for (let i = 0; i < 2; i++) { const a = ai.rot + rand(-1.3, 1.3), r = rand(3, 7), o = { x: e.x + Math.sin(a) * r, z: e.z + Math.cos(a) * r }; resolveCircle(o, 0.6); trexRock(ai, o.x, o.z, 0.9); }
      }
      if (ai.t <= 0 || arenaSd(e.x + sx * e.radius, e.z + sz * e.radius) > -0.5) {
        if (--ai.charges > 0) trexAim(e, ai);
        else { ai.state = 'recover'; ai.t = 0.9; }
      }
      break;
    }
    case 'meteor':
      e.clip = 'throw'; e.clipU = Math.min(0.6, e.clipU + dt); e.vx *= 0.8; e.vz *= 0.8;
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = 1.2; }
      break;
    case 'recover':
      e.clipU = Math.min(0.99, e.clipU + dt * 0.8);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.2 : 2.0; }
      break;
  }
};
function trexAim(e, ai) {
  const h = G.hero.pos;
  ai.state = 'chargeWind'; ai.t = ai.dur = 0.8; ai.rot = Math.atan2(h[0] - e.x, h[2] - e.z);
  addTele({ kind: 'lane', x: e.x, z: e.z, r: e.radius * 0.95, len: TREX.chargeV * 0.95 + e.radius, rot: ai.rot, dur: 0.8 });
}
// a rock falls out of the sky onto a marked circle
function trexRock(ai, x, z, dur) { ai.rocks.push({ x, z, t: dur, dur, spin: rand(0, TAU) }); addTele({ kind: 'circle', x, z, r: TREX.rockR, dur }); }
function trexRocks(ai, dt) {
  const h = G.hero.pos, run = G.run;
  for (const r of ai.rocks) {
    r.t -= dt; r.spin += dt * 4;
    if (r.t > 0) continue;
    r.done = true;
    if (Math.hypot(h[0] - r.x, h[2] - r.z) < TREX.rockR + HERO_R * 0.5) hurtHero(22 * run.info.dmgMul, r.x, r.z);
    enemiesInRadius(r.x, r.z, TREX.rockR, o => { if (!o.boss) hurtEnemy(o, 20, 0, 0, { sound: false }); });
    FX.burst(r.x, 0.4, r.z, 12, [0.5, 0.42, 0.38], 5, 0.14, 0.5, 2); FX.burst(r.x, 0.4, r.z, 6, [1, 0.5, 0.15], 4, 0.1, 0.4, 0);
    FX.crack(r.x, r.z, TREX.rockR * 1.1); FX.scorch(r.x, r.z, TREX.rockR * 0.9);
    G.cam.shake = Math.max(G.cam.shake, 0.08); AUDIO.play('boom', 0.6);
  }
  ai.rocks = ai.rocks.filter(r => !r.done);
}
BOSS_DRAW.trex = function (e) {
  const D = MODELS.defs, dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, L = R.frame.lightDir;
  if (R.enemyDraw.trex) pushEnemy('trex', false, e.x, e.y || 0, e.z, e.portrait ? e.yaw + 0.5 : e.yaw, e.portrait ? D.trex.clips.idle.row + 3 : enemyRow(e), e.scale, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  if (e.portrait) return;
  const ss = e.scale * (1 - dead * 0.5);
  pushDecal(e.x - L[0] * 0.5 * ss, e.z - L[2] * 0.5 * ss, 0.32 * ss, 0.7 * ss, -e.yaw, 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  if (!R.enemyDraw.dinorock || !e.ai.rocks) return;
  const row = D.dinorock.clips.still.row;
  for (const r of e.ai.rocks) {
    const u = 1 - r.t / r.dur, y = 12 * (1 - u * u) + 0.0;
    if (u < 0.35) continue;
    pushEnemy('dinorock', false, r.x, y, r.z, r.spin, row, 1.6, 1, 0, 0, 0, 1, 1, 1);
    if (Math.random() < 0.5) FX.smoke(r.x, y + 0.6, r.z, 0.5, [0.35, 0.3, 0.28], 0.5, 0.2);
  }
};
