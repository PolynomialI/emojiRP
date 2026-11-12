// ============================================================
// Chapter 16, the Clockwork Factory: the gear stacks turn, the presses slam, the boilers puff steam, and
// turntables (ZONE_KINDS.turntable) carry you round. The boss is the Clockwork Colossus.
// ============================================================
ARENA_FEATURES.factory = {
  init(st, rnd) {
    st.gears = ARENA.props.filter(o => o.kind === 'gearstack');
    for (const o of st.gears) o.spin = (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.5);
    st.presses = ARENA.props.filter(o => o.kind === 'press');
    for (const o of st.presses) { o.cyc = rnd() * 3; o.drop = 0; }
    st.boilers = ARENA.props.filter(o => o.kind === 'boiler');
  },
  update(st, dt) {
    for (const o of st.gears) o.yaw += o.spin * dt;
    // each press rises slowly, waits, slams down, waits
    for (const o of st.presses) {
      o.cyc = (o.cyc + dt) % 3.2;
      const c = o.cyc, was = o.drop;
      o.drop = c < 1.2 ? 1 - c / 1.2 : c < 2.2 ? 0 : c < 2.32 ? (c - 2.2) / 0.12 : 1;
      if (was < 1 && o.drop >= 1 && onScreen(o.x, o.z, 2)) {
        const sc = o.r / 0.5;
        FX.burst(o.x, 0.25 * sc, o.z, 8, [0.85, 0.85, 0.9], 3, 0.08, 0.3, 2);
        G.cam.shake = Math.max(G.cam.shake, 0.03);
        AUDIO.play('punch', 0.6);
      }
    }
    for (const o of st.boilers) {
      if (!onScreen(o.x, o.z, 3) || Math.random() > dt * 3) continue;
      const sc = o.r / PROP_KINDS.boiler.unit, c = Math.cos(o.yaw), sn = Math.sin(o.yaw);
      FX.smoke(o.x + c * 0.22 * sc, 1.25 * sc, o.z - sn * 0.22 * sc, 0.5, [0.92, 0.92, 0.95], 1.3, 1.2);
    }
  },
  emit(st) {
    if (!R.enemyDraw.piston) return;
    const row = MODELS.defs.piston.clips.still.row;
    for (const o of st.presses) {
      if (!onScreen(o.x, o.z, 3)) continue;
      const sc = o.r / 0.5;
      pushEnemy('piston', false, o.x, lerp(0.62, 0.19, o.drop) * sc, o.z, o.yaw, row, sc, 1, 0, 0, 0, 1, 1, 1, o.fade || 0);
    }
  },
};

// ---------- the Clockwork Colossus: throws saw blades that fly out and come back, punches piston shockwaves in a
// cross and then an X, opens steam vents under you, and (stage 2) winds its key and rampages down a lane ----------
const COLOSSUS = { sawV: 13, sawR: 0.95, sawLen: 15, punchLen: 13, punchW: 0.9, ventR: 1.45 };
BOSS_AI.colossus = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.next === undefined) { ai.next = 0; ai.cd = 1.4; ai.saws = []; ai.vents = []; }
  colossusSaws(e, ai, dt); colossusVents(ai, dt);
  // steam from its chimney while it walks
  if (Math.random() < 0.25) FX.smoke(e.x + Math.sin(e.yaw) * -0.1 * e.scale, 1.42 * e.scale, e.z - Math.cos(e.yaw) * 0.12 * e.scale, 0.5, [0.85, 0.85, 0.9], 1, 1.4);
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.3 : 1)); bossFace(e, dt, 4);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const plan = rage ? ['saws', 'punch', 'vents', 'rampage'] : ['saws', 'punch', 'vents'];
        const k = plan[ai.next++ % plan.length];
        if (k === 'saws') {
          // a fan of marked lanes toward you; a saw flies down each and comes back
          ai.state = 'sawWind'; ai.t = ai.dur = 0.9; ai.lanes = [];
          const n = rage ? 5 : 3, base = Math.atan2(dx, dz);
          for (let i = 0; i < n; i++) {
            const rot = base + (i - (n - 1) / 2) * 0.5;
            ai.lanes.push(rot);
            addTele({ kind: 'lane', x: e.x, z: e.z, r: COLOSSUS.sawR, len: COLOSSUS.sawLen, rot, dur: 0.9 });
          }
        } else if (k === 'punch') {
          ai.state = 'punchWind'; ai.t = ai.dur = 1.0; ai.round = 0; colossusPunchLanes(e, ai, 0);
        } else if (k === 'vents') {
          // steam vents open under you and around it
          ai.state = 'vents'; ai.t = 1.2;
          const n = rage ? 8 : 5;
          for (let i = 0; i < n; i++) {
            const a = rand(0, TAU), r = i ? rand(2.2, 6.5) : 0, o = { x: h[0] + run.vel[0] * 0.5 + Math.cos(a) * r, z: h[2] + run.vel[2] * 0.5 + Math.sin(a) * r };
            resolveCircle(o, 0.8);
            ai.vents.push({ x: o.x, z: o.z, t: 1.1, life: 1.6, tick: 0 });
            addTele({ kind: 'circle', x: o.x, z: o.z, r: COLOSSUS.ventR, dur: 1.1 });
          }
          AUDIO.play('wind', 0.6);
        } else {
          // stage 2: winds the key in its back, then charges down a lane
          ai.state = 'windup'; ai.t = 1.0; ai.rot = Math.atan2(dx, dz);
          ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: e.radius * 0.9, len: 16, rot: ai.rot, dur: 1.0 });
        }
      }
      break;
    }
    case 'sawWind':
      e.clip = 'throw'; e.clipU = (1 - ai.t / ai.dur) * 0.55; e.vx *= 0.8; e.vz *= 0.8;
      if (ai.t <= 0) {
        for (const rot of ai.lanes) ai.saws.push({ x: e.x, z: e.z, dx: Math.sin(rot), dz: Math.cos(rot), d: 0, state: 'out', hit: false, spin: rand(0, TAU) });
        AUDIO.play('throw'); AUDIO.play('zap', 0.6);
        ai.state = 'recover'; ai.t = 0.5;
      }
      break;
    case 'punchWind':
      e.clip = 'slam'; e.clipU = (1 - ai.t / ai.dur) * 0.55; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t <= 0) {
        const s = e.scale;
        for (const rot of ai.lanes) if (laneHit(e.x, e.z, rot, COLOSSUS.punchLen, COLOSSUS.punchW + HERO_R * 0.5, h[0], h[2])) { hurtHero(30 * run.info.dmgMul, e.x, e.z); break; }
        for (const rot of ai.lanes) for (let k = 1; k <= 6; k++) {
          const px = e.x + Math.sin(rot) * k * 2.1, pz = e.z + Math.cos(rot) * k * 2.1;
          FX.burst(px, 0.2, pz, 4, [0.8, 0.8, 0.85], 4, 0.12, 0.4, 2); FX.smoke(px, 0.3, pz, 0.6, [0.9, 0.9, 0.95], 0.7, 1);
          if (k % 2) FX.crack(px, pz, 1.1, 1.4);
          enemiesInRadius(px, pz, 1, o => { if (!o.boss) hurtEnemy(o, 15, Math.sin(rot) * 6, Math.cos(rot) * 6, { sound: false }); });
        }
        FX.ring(e.x, e.z, 2.2 * s / 3, [1, 0.85, 0.5], 0.4);
        G.cam.shake = Math.max(G.cam.shake, 0.22); AUDIO.play('boom');
        // the cross, then the X (and in stage 2 the cross once more)
        if (++ai.round < (rage ? 3 : 2)) { ai.t = ai.dur = 0.75; colossusPunchLanes(e, ai, ai.round); }
        else { ai.state = 'recover'; ai.t = 0.6; }
      }
      break;
    case 'vents':
      e.clip = 'idle'; e.phase += dt; e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt, 3);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.2 : 2.0; }
      break;
    case 'windup':
      e.clip = 'idle'; e.phase += dt * 3; e.vx *= 0.7; e.vz *= 0.7;
      e.yaw = angleLerp(e.yaw, ai.rot, Math.min(1, dt * 8));
      if (Math.random() < 0.5) FX.burst(e.x - Math.sin(e.yaw) * 0.4 * e.scale, 0.75 * e.scale, e.z - Math.cos(e.yaw) * 0.4 * e.scale, 1, [1, 0.85, 0.4], 2, 0.06, 0.3, 1);
      if (ai.t <= 0) { ai.state = 'rampage'; ai.t = 1.05; ai.hit = false; AUDIO.play('roar', 0.8); }
      break;
    case 'rampage': {
      e.clip = 'run'; e.phase += dt * 4;
      const sx = Math.sin(ai.rot), sz = Math.cos(ai.rot);
      e.x += sx * 15 * dt; e.z += sz * 15 * dt; e.vx = e.vz = 0; e.yaw = ai.rot;
      if (!ai.hit && Math.hypot(h[0] - e.x, h[2] - e.z) < e.radius + HERO_R + 0.3) { ai.hit = true; hurtHero(34 * run.info.dmgMul, e.x, e.z); run.vel[0] += sx * 12; run.vel[2] += sz * 12; }
      enemiesInRadius(e.x, e.z, e.radius + 0.6, o => { if (!o.boss) hurtEnemy(o, 25, sx * 10, sz * 10, { sound: false }); });
      if (Math.random() < 0.7) FX.burst(e.x, 0.2, e.z, 2, [0.85, 0.85, 0.9], 3, 0.1, 0.35, 2);
      if (ai.t <= 0 || arenaSd(e.x + sx * e.radius, e.z + sz * e.radius) > -0.5) {
        G.cam.shake = Math.max(G.cam.shake, 0.2); AUDIO.play('boom');
        ai.state = 'dizzy'; ai.t = 1.3; e.dizzy = 1.3;
      }
      break;
    }
    case 'dizzy':
      e.clip = 'idle'; e.phase += dt * 0.5;
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = 1.4; }
      break;
    case 'recover':
      e.clip = e.clip === 'slam' ? 'slam' : 'throw'; e.clipU = Math.min(0.99, e.clipU + dt * 0.8);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.1; }
      break;
  }
};
// the piston lanes: a + around it (round 0 and 2), then an X (round 1)
function colossusPunchLanes(e, ai, round) {
  const a0 = e.yaw + (round % 2 ? Math.PI / 4 : 0);
  ai.lanes = [0, 1, 2, 3].map(i => a0 + i * Math.PI / 2);
  for (const rot of ai.lanes) addTele({ kind: 'lane', x: e.x, z: e.z, r: COLOSSUS.punchW, len: COLOSSUS.punchLen, rot, dur: ai.dur });
}
// saw blades fly out along their lanes, then come back to wherever the Colossus is now
function colossusSaws(e, ai, dt) {
  const h = G.hero.pos, run = G.run;
  for (const w of ai.saws) {
    w.spin += dt * 14;
    if (w.state === 'out') {
      w.d += COLOSSUS.sawV * dt; w.x += w.dx * COLOSSUS.sawV * dt; w.z += w.dz * COLOSSUS.sawV * dt;
      if (w.d >= COLOSSUS.sawLen || arenaSd(w.x, w.z) > -0.6) { w.state = 'back'; w.hit = false; FX.burst(w.x, 0.6, w.z, 6, [1, 0.85, 0.5], 3, 0.06, 0.3, 1); }
    } else {
      const bx = e.x - w.x, bz = e.z - w.z, bd = Math.hypot(bx, bz) || 1;
      w.x += bx / bd * COLOSSUS.sawV * 1.15 * dt; w.z += bz / bd * COLOSSUS.sawV * 1.15 * dt;
      if (bd < e.radius) w.done = true;
    }
    if (!w.hit && Math.hypot(h[0] - w.x, h[2] - w.z) < COLOSSUS.sawR + HERO_R * 0.6) { w.hit = true; hurtHero(18 * run.info.dmgMul, w.x, w.z); }
    enemiesInRadius(w.x, w.z, COLOSSUS.sawR, o => { if (!o.boss) hurtEnemy(o, 12, (o.x - w.x) * 3, (o.z - w.z) * 3, { sound: false }); });
    if (Math.random() < 0.6) FX.part(w.x, 0.35, w.z, rand(-3, 3), rand(1, 3), rand(-3, 3), 0.05, 0.01, 0.3, [1, 0.8, 0.4], 1, 1, 6);
  }
  ai.saws = ai.saws.filter(w => !w.done);
}
// vents: a marked circle, then a column of scalding steam for a moment
function colossusVents(ai, dt) {
  const h = G.hero.pos, run = G.run;
  for (const v of ai.vents) {
    if (v.t > 0) { v.t -= dt; if (v.t <= 0) { FX.ring(v.x, v.z, COLOSSUS.ventR * 1.5, [1, 1, 1], 0.4); AUDIO.play('wind', 0.9); } continue; }
    v.life -= dt; v.tick -= dt;
    if (Math.random() < 0.9) FX.smoke(v.x + rand(-0.5, 0.5), 0.3, v.z + rand(-0.5, 0.5), rand(0.6, 1.0), [0.95, 0.95, 1], 0.9, rand(3, 5));
    if (v.tick <= 0 && Math.hypot(h[0] - v.x, h[2] - v.z) < COLOSSUS.ventR + HERO_R * 0.5) { v.tick = 0.45; hurtHero(14 * run.info.dmgMul, v.x, v.z); }
  }
  ai.vents = ai.vents.filter(v => v.t > 0 || v.life > 0);
}
BOSS_DRAW.colossus = function (e) {
  const D = MODELS.defs, dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, L = R.frame.lightDir;
  if (R.enemyDraw.colossus) pushEnemy('colossus', false, e.x, e.y || 0, e.z, e.yaw, e.portrait ? D.colossus.clips.idle.row + 3 : enemyRow(e), e.scale, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  if (e.portrait) return;
  const ss = e.scale * (1 - dead * 0.5);
  pushDecal(e.x - L[0] * 0.5 * ss, e.z - L[2] * 0.5 * ss, 0.32 * ss, 0.45 * ss, -Math.atan2(-L[0], -L[2]), 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  if (!R.enemyDraw.sawblade || !e.ai.saws) return;
  const row = D.sawblade.clips.still.row;
  for (const w of e.ai.saws) {
    pushEnemy('sawblade', false, w.x, 0.45, w.z, w.spin, row, 2.1, 1, 0, 0, 0, 1, 1, 1);
    pushDecal(w.x + 0.15, w.z + 0.12, 0.9, 0.9, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.4);
  }
};
