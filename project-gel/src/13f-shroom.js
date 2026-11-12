// ============================================================
// Chapter 17, the Mushroom Forest: glowing spores drift up everywhere, and toadstools puff spores when you brush
// past them. The boss is the Mycelium Monarch.
// ============================================================
ARENA_FEATURES.shroom = {
  init(st) { st.caps = ARENA.props.filter(o => o.kind === 'toadstool' || o.kind === 'bigshroom'); st.acc = 0; },
  update(st, dt) {
    const h = G.hero.pos;
    st.acc += dt * (FX.reduced ? 3 : 9);
    for (; st.acc >= 1; st.acc--) {
      const c = Math.random() < 0.5 ? [0.85, 0.5, 1] : [0.45, 1, 0.85];
      FX.part(h[0] + rand(-14, 14), rand(0.1, 1.5), h[2] + rand(-11, 8), rand(-0.15, 0.15), rand(0.15, 0.4), rand(-0.15, 0.15), rand(0.05, 0.08), 0.02, rand(2.5, 4), c, 0.9, 0, -0.03, 0.2);
    }
    for (const o of st.caps) {
      o.puffCd = (o.puffCd || 0) - dt;
      if (o.puffCd > 0 || Math.hypot(h[0] - o.x, h[2] - o.z) > o.r + 0.9) continue;
      o.puffCd = 2.5; o.squash = 0.85;
      const top = (o.kind === 'toadstool' ? 1.2 : 1.75) * o.r / PROP_KINDS[o.kind].unit;
      for (let i = 0; i < 8; i++) FX.part(o.x + rand(-0.6, 0.6) * o.r, top, o.z + rand(-0.6, 0.6) * o.r, rand(-1, 1), rand(0.5, 1.5), rand(-1, 1), 0.1, 0.02, 1.5, [0.85, 0.6, 1], 0.9, 0, -0.2, 0.6);
      AUDIO.play('pop', 0.5);
    }
    for (const o of st.caps) if (o.squash) o.squash = Math.min(1, o.squash + dt * 0.8);
  },
};

// ---------- the Mycelium Monarch: spore spirals, glowing mycelium lanes that race along the ground and burst into
// mushrooms, spore showers on a checkerboard of marked circles that leave poison puddles, and sporelings sprouting
// round you. Stage 2: more spiral arms turning both ways, and the shower's other half follows ----------
const MONARCH = { sporeV: 4.4, laneLen: 15, laneW: 0.85, laneV: 15, showerR: 1.45 };
BOSS_AI.monarch = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.next === undefined) { ai.next = 0; ai.cd = 1.4; ai.runs = []; ai.drops = []; }
  monarchLanes(e, ai, dt); monarchShower(ai, dt);
  if (Math.random() < 0.3) FX.part(e.x + rand(-1, 1) * e.radius, rand(1.4, 2.4) * e.scale * 0.6, e.z + rand(-1, 1) * e.radius, 0, rand(0.3, 0.8), 0, 0.09, 0.02, 1.4, [0.8, 1, 0.5], 0.9, 0, -0.1, 0.4);
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.25 : 1)); bossFace(e, dt, 4);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['spiral', 'lanes', 'shower', 'spiral', 'sprout'][ai.next++ % 5];
        if (k === 'spiral') { ai.state = 'spiral'; ai.t = 2.4; ai.fireT = 0; ai.spin = Math.atan2(dx, dz); ai.dir = Math.random() < 0.5 ? 1 : -1; AUDIO.play('wind', 0.5); }
        else if (k === 'lanes') {
          ai.state = 'lanesWind'; ai.t = ai.dur = 0.9; ai.lanes = [];
          const n = rage ? 5 : 3, base = Math.atan2(dx, dz);
          for (let i = 0; i < n; i++) { const rot = base + (i - (n - 1) / 2) * 0.55; ai.lanes.push(rot); addTele({ kind: 'lane', x: e.x, z: e.z, r: MONARCH.laneW, len: MONARCH.laneLen, rot, dur: 0.9 }); }
        } else if (k === 'shower') {
          ai.state = 'shower'; ai.t = 1.3;
          monarchCheckers(ai, h, 0, 1.1);
          if (rage) monarchCheckers(ai, h, 1, 1.9);
        } else {
          ai.state = 'sprout'; ai.t = 0.9;
          const n = rage ? 6 : 4;
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU + rand(-0.3, 0.3), r = rand(3.5, 5.5), o = { x: h[0] + Math.cos(a) * r, z: h[2] + Math.sin(a) * r };
            resolveCircle(o, 0.6);
            const m = spawnEnemy('sporeling', o.x, o.z); m.spawnT = 0.6;
            FX.burst(o.x, 0.2, o.z, 10, [0.55, 0.4, 0.3], 3, 0.1, 0.5, 2); FX.part(o.x, 0.3, o.z, 0, 2, 0, 0.3, 0.05, 0.6, [0.85, 0.6, 1], 0.9, 0);
          }
          AUDIO.play('pop');
        }
      }
      break;
    }
    case 'spiral': {
      // spore arms turning round it; stage 2 adds a second set turning the other way
      e.clip = 'idle'; e.phase += dt; e.vx *= 0.8; e.vz *= 0.8;
      ai.spin += dt * 1.5 * ai.dir;
      ai.fireT -= dt;
      if (ai.fireT <= 0) {
        ai.fireT = rage ? 0.1 : 0.13;
        const arms = rage ? 5 : 4;
        const shoot = a => run.eShots.push({ kind: 'spore', x: e.x + Math.sin(a) * e.radius, y: 1.0, z: e.z + Math.cos(a) * e.radius, vx: Math.sin(a) * MONARCH.sporeV, vy: 0, vz: Math.cos(a) * MONARCH.sporeV, dmg: 9 * run.info.dmgMul, r: 0.3, life: 4, ph: rand(0, 10) });
        for (let i = 0; i < arms; i++) shoot(ai.spin + i * TAU / arms);
        if (rage) for (let i = 0; i < 3; i++) shoot(-ai.spin * 1.3 + i * TAU / 3 + 0.5);
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.0; }
      break;
    }
    case 'lanesWind':
      e.clip = 'slam'; e.clipU = (1 - ai.t / ai.dur) * 0.55; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t <= 0) {
        for (const rot of ai.lanes) ai.runs.push({ x0: e.x, z0: e.z, rot, d: 0, hit: false, pop: 0 });
        G.cam.shake = Math.max(G.cam.shake, 0.15); AUDIO.play('boom', 0.7);
        ai.state = 'recover'; ai.t = 0.6;
      }
      break;
    case 'shower': case 'sprout':
      e.clip = 'throw'; e.clipU = Math.min(0.6, e.clipU + dt * 0.8); e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt, 4);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.0; }
      break;
    case 'recover':
      e.clip = 'slam'; e.clipU = Math.min(0.99, e.clipU + dt);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.0; }
      break;
  }
};
// the spore shower: a 3x3 checkerboard of marked circles round you (half 0: corners and middle, half 1: the rest)
function monarchCheckers(ai, h, half, dur) {
  const g = 3.1;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    if ((((i + j) % 2) + 2) % 2 !== half) continue;
    const o = { x: h[0] + i * g, z: h[2] + j * g };
    if (arenaSd(o.x, o.z) > -0.6) continue;
    ai.drops.push({ x: o.x, z: o.z, t: dur });
    addTele({ kind: 'circle', x: o.x, z: o.z, r: MONARCH.showerR, dur });
  }
}
function monarchShower(ai, dt) {
  const h = G.hero.pos, run = G.run;
  for (const p of ai.drops) {
    p.t -= dt;
    if (p.t > 0.25 && Math.random() < 0.5) FX.part(p.x + rand(-1, 1), 6, p.z + rand(-1, 1), 0, -9, 0, 0.12, 0.05, 0.6, [0.85, 0.55, 1], 0.9, 0);
    if (p.t > 0) continue;
    p.done = true;
    if (Math.hypot(h[0] - p.x, h[2] - p.z) < MONARCH.showerR + HERO_R * 0.5) hurtHero(20 * run.info.dmgMul, p.x, p.z);
    tempZone('sporezone', p.x, p.z, MONARCH.showerR * 0.9, 4);
    FX.burst(p.x, 0.4, p.z, 12, [0.8, 0.5, 1], 4, 0.1, 0.5, 0); FX.ring(p.x, p.z, MONARCH.showerR * 1.4, [0.85, 0.55, 1], 0.4);
    AUDIO.play('pop', 0.8);
  }
  ai.drops = ai.drops.filter(p => !p.done);
}
// a glowing thread races down each lane; mushrooms burst up behind it
function monarchLanes(e, ai, dt) {
  const h = G.hero.pos, run = G.run;
  for (const r of ai.runs) {
    r.d += MONARCH.laneV * dt;
    const sx = Math.sin(r.rot), sz = Math.cos(r.rot), x = r.x0 + sx * r.d, z = r.z0 + sz * r.d;
    if (!r.hit && laneHit(r.x0, r.z0, r.rot, Math.min(r.d, MONARCH.laneLen), MONARCH.laneW + HERO_R * 0.5, h[0], h[2]) && Math.hypot(h[0] - x, h[2] - z) < 2.2) { r.hit = true; hurtHero(24 * run.info.dmgMul, x, z); }
    while (r.pop < r.d && r.pop < MONARCH.laneLen) {
      r.pop += 1.1;
      const px = r.x0 + sx * r.pop, pz = r.z0 + sz * r.pop;
      FX.burst(px, 0.2, pz, 5, [0.55, 0.45, 0.35], 3, 0.1, 0.45, 2);
      FX.part(px, 0.4, pz, 0, 2.5, 0, 0.35, 0.08, 0.5, [0.85, 0.55, 1], 0.9, 0);
      enemiesInRadius(px, pz, 1, o => { if (!o.boss) hurtEnemy(o, 12, sx * 4, sz * 4, { sound: false }); });
    }
    if (r.d > MONARCH.laneLen) r.done = true;
  }
  ai.runs = ai.runs.filter(r => !r.done);
}
SHOT_DRAW.spore = s => {
  FX.glow(s.x, s.y, s.z, 0.6, [0.75, 0.4, 1], 0.05, 0.9);
  FX.glow(s.x, s.y, s.z, 0.28, [1, 0.9, 1], 0.05, 1);
  pushDecal(s.x + 0.1, s.z + 0.08, 0.3, 0.25, 0, 1, 0, 0, 0.03, 0.01, 0.05, 0.3);
};
