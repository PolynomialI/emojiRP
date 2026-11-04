// ============================================================
// Chapter bosses 2-10: behaviour (BOSS_AI) and drawing (BOSS_DRAW). Stats live in BOSS_TYPES (10-data.js).
// ============================================================
const isRage = e => e.hp < e.maxHp * 0.5;
// turn a heading toward a target angle at a limited rate
function turnToward(a, want, rate) { return a + clamp(angleDiff(a, want), -rate, rate); }
function sandBurst(x, z, n, r) {
  FX.burst(x, 0.3, z, n, [0.86, 0.68, 0.42], 6, 0.2, 0.8, 2, 2);
  FX.ring(x, z, r * 2.4, [1, 0.85, 0.6], 0.5); FX.crack(x, z, r * 1.6, 1.6);
  for (let i = 0; i < 4; i++) FX.smoke(x + rand(-1, 1), 0.4, z + rand(-1, 1), 1.4, [0.8, 0.65, 0.45], 1.1, 1.2);
}
// a short-lived ground zone (quicksand the worm leaves, lava trails...) that fades out
function tempZone(kind, x, z, r, life) {
  const o = { kind, x, z, r, ph: rand(0, 10), block: false, life };
  ARENA.zones.push(o);
  return o;
}
function updateTempZones(dt) {
  let any = false;
  for (const o of ARENA.zones) if (o.life !== undefined) { o.life -= dt; any = true; }
  if (any) ARENA.zones = ARENA.zones.filter(o => o.life === undefined || o.life > 0);
}

// ---------- Sand Worm (chapter 2): burrows, breaches under you in big arcs, slithers and spits sand ----------
const WORM = { segs: 11, gap: 0.6 };
BOSS_AI.sandworm = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, s = e.scale, rage = isRage(e);
  ai.path = ai.path || [];
  if (ai.heading === undefined) ai.heading = Math.atan2(dx, dz);
  const steer = (tx, tz, speed, rate) => {
    ai.heading = turnToward(ai.heading, Math.atan2(tx - e.x, tz - e.z), rate * dt);
    e.x += Math.sin(ai.heading) * speed * dt; e.z += Math.cos(ai.heading) * speed * dt;
    const o = { x: e.x, z: e.z }; resolveCircle(o, 0.5); e.x = o.x; e.z = o.z;
  };
  const underY = -0.45 * s, surfY = 0.42 * s;
  switch (ai.state) {
    case 'intro':
      e.hidden = true; e.y = underY;
      if (Math.random() < 0.5) FX.smoke(e.x + rand(-1, 1), 0.3, e.z + rand(-1, 1), 1.2, [0.8, 0.65, 0.45], 0.9, 1);
      if (ai.t <= 0) { ai.state = 'breach'; ai.t = ai.dur = 1.5; ai.bx = e.x; ai.bz = e.z; ai.breaches = 1; ai.hit = false; }
      break;
    case 'under':
    case 'tele': {
      // tunnelling: only the back spikes break the sand, and nothing can hit it
      e.hidden = true; e.y = underY;
      const sp = rage ? 8 : 6.5;
      if (ai.state === 'under') {
        steer(h[0], h[2], sp, 3.5);
        if (d < 2.2 || ai.t <= 0) {
          ai.state = 'tele'; ai.t = rage ? 0.7 : 0.9; ai.bx = h[0]; ai.bz = h[2];
          const o = { x: ai.bx, z: ai.bz }; resolveCircle(o, 1.5); ai.bx = o.x; ai.bz = o.z;
          addTele({ kind: 'circle', x: ai.bx, z: ai.bz, r: 2.4, dur: ai.t });
        }
      } else {
        steer(ai.bx, ai.bz, Math.max(sp, Math.hypot(ai.bx - e.x, ai.bz - e.z) / Math.max(ai.t, 0.05)), 8);
        if (ai.t <= 0) { e.x = ai.bx; e.z = ai.bz; ai.state = 'breach'; ai.t = ai.dur = 1.5; ai.hit = false; }
      }
      if (Math.random() < 0.7) FX.smoke(e.x + rand(-0.6, 0.6), 0.2, e.z + rand(-0.6, 0.6), 1.0, [0.82, 0.66, 0.44], 0.8, 0.7);
      if (Math.random() < 0.3) FX.burst(e.x, 0.2, e.z, 2, [0.86, 0.7, 0.45], 2.5, 0.1, 0.4, 1);
      break;
    }
    case 'breach': {
      // bursts up through the telegraphed spot and arcs back into the sand ahead
      e.hidden = false;
      const u = 1 - ai.t / ai.dur;
      if (!ai.hit) {
        ai.hit = true;
        ai.heading = Math.atan2(h[0] - ai.bx, h[2] - ai.bz) + rand(-0.6, 0.6);
        if (Math.hypot(h[0] - ai.bx, h[2] - ai.bz) < 2.4 + HERO_R * 0.5) { hurtHero(34 * run.info.dmgMul, ai.bx, ai.bz); run.vel[0] += (h[0] - ai.bx) * 3; run.vel[2] += (h[2] - ai.bz) * 3; }
        enemiesInRadius(ai.bx, ai.bz, 2.4, o => { if (o !== e && !o.boss) { const ox = o.x - ai.bx, oz = o.z - ai.bz, od = Math.hypot(ox, oz) || 1; o.kx += ox / od * 8 / o.mass; o.kz += oz / od * 8 / o.mass; } });
        sandBurst(ai.bx, ai.bz, 30, 2.4);
        G.cam.shake = Math.max(G.cam.shake, 0.24); AUDIO.play('boom');
        if (rage) tempZone('quicksand', ai.bx, ai.bz, 2.2, 9);
      }
      e.x = ai.bx + Math.sin(ai.heading) * u * 6.5; e.z = ai.bz + Math.cos(ai.heading) * u * 6.5;
      const o = { x: e.x, z: e.z }; resolveCircle(o, 0.5); e.x = o.x; e.z = o.z;
      e.y = underY + Math.sin(u * Math.PI) * 5.2;
      if (ai.t <= 0) {
        sandBurst(e.x, e.z, 14, 1.4);
        ai.breaches--;
        if (ai.breaches > 0) { ai.state = 'under'; ai.t = 1.1; }
        else { ai.state = 'rise'; ai.t = 0.9; }
      }
      break;
    }
    case 'rise':
      e.hidden = ai.t > 0.5;
      e.y = lerp(surfY, underY, clamp(ai.t / 0.9, 0, 1));
      steer(h[0], h[2], 1.5, 4);
      if (ai.t <= 0) { ai.state = 'slither'; ai.t = rage ? 4 : 5; ai.spitT = 1.4; }
      break;
    case 'slither':
      e.hidden = false;
      e.y = surfY + Math.sin(run.t * 6) * 0.06 * s;
      ai.spitT -= dt;
      steer(h[0] + Math.sin(run.t * 2.4) * 2.5, h[2] + Math.cos(run.t * 2.4) * 2.5, e.speed * (rage ? 1.3 : 1), 2.4);
      if (ai.spitT <= 0 && d < 12) { ai.state = 'spit'; ai.st = ai.t; ai.t = 0.9; ai.fired = 0; }
      else if (ai.t <= 0) { ai.state = 'dive'; ai.t = 0.8; }
      break;
    case 'spit': {
      // rears up and sprays a fan of sand clods
      const u = 1 - ai.t / 0.9;
      ai.heading = turnToward(ai.heading, Math.atan2(dx, dz), dt * 6);
      e.y = surfY + Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * 1.2 * s * (1 - smoothstep(0.75, 1, u));
      const volleys = rage ? 2 : 1;
      if (ai.fired < volleys && u > 0.45 + ai.fired * 0.2) {
        ai.fired++;
        const n = rage ? 9 : 7, base = Math.atan2(dx, dz);
        for (let i = 0; i < n; i++) {
          const a = base + (i / (n - 1) - 0.5) * 1.4 + (ai.fired - 1) * 0.08;
          run.eShots.push({ kind: 'sand', x: e.x, y: 1.1, z: e.z, vx: Math.sin(a) * 6.5, vy: 0, vz: Math.cos(a) * 6.5, dmg: 13 * run.info.dmgMul, r: 0.35, life: 2.6, ph: rand(0, 10) });
        }
        AUDIO.play('throw');
      }
      if (ai.t <= 0) { ai.state = 'slither'; ai.t = ai.st; ai.spitT = rage ? 1.6 : 2.4; }
      break;
    }
    case 'dive':
      e.y = lerp(underY, surfY, clamp(ai.t / 0.8, 0, 1));
      steer(h[0], h[2], e.speed, 2);
      if (ai.t <= 0) { ai.state = 'under'; ai.t = rage ? 1.2 : 1.6; ai.breaches = rage ? 3 : 2; }
      break;
  }
  e.yaw = ai.heading;
  e.phase += dt;
  // the body trails the head's path; record where the head has been
  const last = ai.path[0];
  if (!last || Math.hypot(e.x - last[0], e.y - last[1], e.z - last[2]) > 0.08) ai.path.unshift([e.x, e.y, e.z]);
  if (ai.path.length > 400) ai.path.length = 400;
  // the body hurts too
  if (G.state === 'run') for (const b of wormBody(e)) {
    if (b.y < -0.3 * b.s) continue;
    if (Math.hypot(b.x - h[0], b.z - h[2]) < 0.34 * b.s + HERO_R) { hurtHero(e.dmg * 0.8, b.x, b.z); break; }
  }
};
// segment positions spaced along the recorded head path
function wormBody(e) {
  const out = [], P = e.ai.path || [], s = e.scale;
  let want = WORM.gap * s, acc = 0, i = 1;
  for (let k = 0; k < WORM.segs; k++) {
    const segS = s * (1 - 0.045 * k);
    while (i < P.length) {
      const a = P[i - 1], b = P[i], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      if (acc + l >= want) {
        const u = (want - acc) / (l || 1);
        out.push({ x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), z: lerp(a[2], b[2], u), yaw: Math.atan2(a[0] - b[0], a[2] - b[2]), s: segS });
        break;
      }
      acc += l; i++;
    }
    if (i >= P.length) break;
    want += WORM.gap * segS;
  }
  return out;
}
BOSS_DRAW.sandworm = function (e) {
  if (!R.enemyDraw.wormhead || !R.enemyDraw.wormseg) return;
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint;
  const row = MODELS.defs.wormhead.clips.still.row, srow = MODELS.defs.wormseg.clips.still.row, L = R.frame.lightDir;
  let body;
  if (e.portrait) {
    // a coil rising out of the sand for the portrait
    body = [];
    for (let k = 0; k < 4; k++) body.push({ x: -0.5 * k * e.scale * 0.5, y: (0.42 - 0.25 * k) * e.scale, z: -0.55 * k * e.scale * 0.5, yaw: 0.45, s: e.scale * (1 - 0.05 * k) });
  } else body = wormBody(e);
  for (let k = body.length - 1; k >= 0; k--) {
    const b = body[k];
    if (b.y < -0.7 * b.s) continue;
    pushEnemy('wormseg', false, b.x, b.y, b.z, b.yaw, srow, b.s, 1, dead, fl, 0, t[0], t[1], t[2]);
    if (b.y > -0.2 * b.s) pushDecal(b.x - L[0] * 0.3, b.z - L[2] * 0.3, 0.4 * b.s, 0.34 * b.s, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.45);
  }
  if (e.hidden) {
    // the mound of churned sand over its head
    pushDecal(e.x, e.z, 1.6, 1.6, e.phase, 0, 3, 0, 0.45, 0.3, 0.16, 0.5);
    return;
  }
  pushEnemy('wormhead', false, e.x, e.portrait ? 0.62 * e.scale : e.y, e.z, e.yaw, row, e.scale * e.squash, 1, dead, fl, 0, t[0], t[1], t[2]);
  if (!e.portrait) pushDecal(e.x - L[0] * 0.4, e.z - L[2] * 0.4, 0.5 * e.scale, 0.42 * e.scale, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.5 * (1 - clamp(e.y / 6, 0, 0.8)));
};
