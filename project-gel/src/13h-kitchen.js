// ============================================================
// Chapter 19, the Giant Kitchen: the stew pots and teapots steam, the burners glow and spit sparks. The boss is
// Chef Cleaver.
// ============================================================
ARENA_FEATURES.kitchen = {
  init(st) { st.steamers = ARENA.props.filter(o => o.kind === 'pot' || o.kind === 'teapot'); st.burners = ARENA.zones.filter(o => o.kind === 'hotplate'); },
  update(st, dt) {
    for (const o of st.steamers) {
      if (!onScreen(o.x, o.z, 3) || Math.random() > dt * 4) continue;
      const sc = o.r / PROP_KINDS[o.kind].unit;
      if (o.kind === 'pot') FX.smoke(o.x + rand(-0.3, 0.3) * sc, 0.68 * sc, o.z + rand(-0.3, 0.3) * sc, 0.5, [0.95, 0.95, 0.97], 1.4, 1.2);
      else { const c = Math.cos(o.yaw), sn = Math.sin(o.yaw); FX.smoke(o.x + c * 0.52 * sc, 0.6 * sc, o.z - sn * 0.52 * sc, 0.25, [0.95, 0.95, 0.97], 1, 1.4); }
    }
    for (const o of st.burners) {
      if (!onScreen(o.x, o.z, o.r) || Math.random() > dt * 5) continue;
      const a = rand(0, TAU), r = rand(0.2, 0.8) * o.r;
      FX.part(o.x + Math.cos(a) * r, 0.1, o.z + Math.sin(a) * r, rand(-0.4, 0.4), rand(1, 2.5), rand(-0.4, 0.4), 0.06, 0.01, 0.5, [1, 0.6, 0.2], 1, 1, 2);
    }
  },
};

// ---------- Chef Cleaver: three (stage 2: four) quick cleaver chops down marked lanes, pancakes flipped from his pan
// onto marked circles that splash hot grease, pepper bombs that leave stinging clouds, and in stage 2 a volley of big
// bouncing meatballs ----------
const CHEF = { chopLen: 11, chopW: 0.85, flipR: 1.45, pepperR: 1.7 };
BOSS_AI.chef = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.next === undefined) { ai.next = 0; ai.cd = 1.4; ai.puffs = []; }
  chefPuffs(ai, dt);
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.3 : 1)); bossFace(e, dt, 5);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const plan = rage ? ['chop', 'flip', 'pepper', 'meatballs', 'chop', 'flip'] : ['chop', 'flip', 'chop', 'pepper'];
        const k = plan[ai.next++ % plan.length];
        if (k === 'chop') { ai.chops = rage ? 4 : 3; chefChopAim(e, ai, 0.6); }
        else if (k === 'flip') {
          ai.state = 'flip'; ai.t = 1.1; ai.tossed = 0; ai.tossT = 0.25; AUDIO.play('throw');
        } else if (k === 'pepper') {
          ai.state = 'pepper'; ai.t = 1.2;
          const n = rage ? 7 : 5;
          for (let i = 0; i < n; i++) { const a = rand(0, TAU), r = i ? rand(2, 6) : 0, o = { x: h[0] + run.vel[0] * 0.5 + Math.cos(a) * r, z: h[2] + run.vel[2] * 0.5 + Math.sin(a) * r }; resolveCircle(o, 0.8); ai.puffs.push({ x: o.x, z: o.z, t: 1.0 + i * 0.08 }); addTele({ kind: 'circle', x: o.x, z: o.z, r: CHEF.pepperR, dur: 1.0 + i * 0.08 }); }
        } else {
          // stage 2: big meatballs that bounce round the kitchen
          ai.state = 'meatballs'; ai.t = 0.9;
          for (let i = 0; i < 3; i++) {
            const a = Math.atan2(dx, dz) + (i - 1) * 0.6;
            run.eShots.push({ kind: 'rball', x: e.x + Math.sin(a) * 1.5, y: 1.4, z: e.z + Math.cos(a) * 1.5, vx: Math.sin(a) * 8, vy: 5, vz: Math.cos(a) * 8, r: 0.75, dmg: 22 * run.info.dmgMul, life: 6, col: [0.55, 0.28, 0.16] });
          }
          AUDIO.play('boing'); AUDIO.play('throw');
        }
      }
      break;
    }
    case 'chopWind':
      e.clip = 'slam'; e.clipU = (1 - ai.t / ai.dur) * 0.55; e.vx *= 0.6; e.vz *= 0.6;
      e.yaw = angleLerp(e.yaw, ai.rot, Math.min(1, dt * 12));
      if (ai.t <= 0) {
        if (laneHit(e.x, e.z, ai.rot, CHEF.chopLen, CHEF.chopW + HERO_R * 0.5, h[0], h[2])) hurtHero(30 * run.info.dmgMul, e.x, e.z);
        const sx = Math.sin(ai.rot), sz = Math.cos(ai.rot);
        for (let k = 1; k <= 5; k++) {
          const px = e.x + sx * k * 2.1, pz = e.z + sz * k * 2.1;
          FX.burst(px, 0.15, pz, 3, [0.95, 0.95, 1], 3, 0.06, 0.3, 1); if (k % 2) FX.crack(px, pz, 1.0, 1.2);
          enemiesInRadius(px, pz, 1, o => { if (!o.boss) hurtEnemy(o, 18, -sz * 3, sx * 3, { sound: false }); });
        }
        FX.ring(e.x + sx * 5, e.z + sz * 5, 1.2, [1, 1, 1], 0.2);
        G.cam.shake = Math.max(G.cam.shake, 0.14); AUDIO.play('punch'); AUDIO.play('hit', 0.6);
        if (--ai.chops > 0) chefChopAim(e, ai, 0.42);
        else { ai.state = 'recover'; ai.t = 0.6; }
      }
      break;
    case 'flip': {
      // flips pancakes high out of the pan; each lands on a marked circle and spatters hot grease
      e.clip = 'throw'; e.clipU = Math.min(0.7, e.clipU + dt * 2); e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt, 6);
      const n = rage ? 8 : 5;
      ai.tossT -= dt;
      if (ai.tossed < n && ai.tossT <= 0) {
        ai.tossT = 0.11;
        let tx = h[0] + run.vel[0] * 0.9, tz = h[2] + run.vel[2] * 0.9;
        if (ai.tossed) { const a = rand(0, TAU), r = rand(2, 6); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
        const o = { x: tx, z: tz }; resolveCircle(o, 0.6);
        addTele({ kind: 'circle', x: o.x, z: o.z, r: CHEF.flipR, dur: 1.2 });
        const hx = e.x + Math.sin(e.yaw) * 0.6 * e.scale, hz = e.z + Math.cos(e.yaw) * 0.6 * e.scale;
        run.eShots.push({ kind: 'pancake', lob: true, sx: hx, sy: 1.6 * e.scale * 0.6, sz: hz, tx: o.x, tz: o.z, x: hx, y: 2, z: hz, t: 0, dur: 1.2, radius: CHEF.flipR, dmg: 20 * run.info.dmgMul, life: 2, spin: rand(0, TAU), peak: 5.5, onLand: s => tempZone('grease', s.tx, s.tz, 1.1, 3) });
        ai.tossed++;
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.2 : 2.0; }
      break;
    }
    case 'pepper': case 'meatballs':
      e.clip = 'throw'; e.clipU = Math.min(0.7, e.clipU + dt * 1.5); e.vx *= 0.8; e.vz *= 0.8;
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.2 : 2.0; }
      break;
    case 'recover':
      e.clipU = Math.min(0.99, e.clipU + dt);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.2 : 2.0; }
      break;
  }
};
function chefChopAim(e, ai, dur) {
  const h = G.hero.pos;
  ai.state = 'chopWind'; ai.t = ai.dur = dur; ai.rot = Math.atan2(h[0] - e.x, h[2] - e.z);
  addTele({ kind: 'lane', x: e.x, z: e.z, r: CHEF.chopW, len: CHEF.chopLen, rot: ai.rot, dur });
}
// pepper bombs: dark puffs falling onto marked circles, leaving clouds of stinging pepper
function chefPuffs(ai, dt) {
  const h = G.hero.pos, run = G.run;
  for (const p of ai.puffs) {
    p.t -= dt;
    if (p.t > 0) { if (p.t < 0.35 && Math.random() < 0.6) FX.smoke(p.x + rand(-0.3, 0.3), 5 * p.t + 0.5, p.z + rand(-0.3, 0.3), 0.4, [0.22, 0.2, 0.2], 0.4, -2); continue; }
    p.done = true;
    if (Math.hypot(h[0] - p.x, h[2] - p.z) < CHEF.pepperR + HERO_R * 0.5) hurtHero(16 * run.info.dmgMul, p.x, p.z);
    tempZone('peppercloud', p.x, p.z, CHEF.pepperR, 4);
    for (let i = 0; i < 6; i++) FX.smoke(p.x + rand(-0.8, 0.8), 0.4, p.z + rand(-0.8, 0.8), 0.9, [0.25, 0.23, 0.22], 1.2, 0.6);
    AUDIO.play('pop', 0.6);
  }
  ai.puffs = ai.puffs.filter(p => !p.done);
}
SHOT_DRAW.pancake = s => {
  if (R.enemyDraw.pancake) pushEnemy('pancake', false, s.x, s.y - 0.2, s.z, s.spin, MODELS.defs.pancake.clips.still.row, 1.5, 1, 0, 0, 0, 1, 1, 1);
  const g = clamp(s.t / s.dur, 0, 1);
  pushDecal(s.x, s.z, 0.4 + g * 0.5, 0.4 + g * 0.5, 0, 1, 0, 0, 0.02, 0.03, 0.06, 0.2 + g * 0.3);
};
SHOT_DRAW.pepper = s => {
  FX.glow(s.x, s.y, s.z, 0.45, [0.3, 0.27, 0.25], 0.05, 0.9);
  if (Math.random() < 0.6) FX.smoke(s.x, s.y, s.z, 0.25, [0.28, 0.26, 0.25], 0.4, 0.2);
  pushDecal(s.x + 0.1, s.z + 0.08, 0.3, 0.25, 0, 1, 0, 0, 0.03, 0.03, 0.03, 0.3);
};
