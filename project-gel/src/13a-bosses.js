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

// ---------- Wrecking Bot (chapter 3): wrecking-ball spins, rocket barrages and lane slams ----------
function botHand(e, out) {
  // right hand, roughly, in world space (the ball's chain hangs from it)
  const s = e.scale, c = Math.cos(e.yaw), sn = Math.sin(e.yaw), lx = -0.36 * s, lz = 0.12 * s;
  out[0] = e.x + c * lx + sn * lz; out[1] = 0.5 * s; out[2] = e.z - sn * lx + c * lz;
  return out;
}
const _hand = [0, 0, 0];
function laneHit(x0, z0, rot, len, w, px, pz) {
  const ax = Math.sin(rot), az = Math.cos(rot), dx = px - x0, dz = pz - z0;
  const along = dx * ax + dz * az, perp = Math.abs(dx * az - dz * ax);
  return along > -0.5 && along < len && perp < w;
}
BOSS_AI.wreckbot = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, s = e.scale, rage = isRage(e);
  if (!ai.ball) { ai.ball = { x: e.x, z: e.z - 3, vx: 0, vz: 0, y: 0.5 }; ai.next = 0; ai.cd = 2; }
  const ball = ai.ball;
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.25 : 1)); bossFace(e, dt);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const kind = ['swing', 'rockets', 'slam'][ai.next++ % 3];
        if (kind === 'swing') { ai.state = 'swingWind'; ai.t = 0.9; addTele({ kind: 'circle', x: e.x, z: e.z, r: 6, dur: 0.9 }); ai.cx = e.x; ai.cz = e.z; }
        else if (kind === 'rockets') { ai.state = 'rockets'; ai.t = 1.5; ai.fired = 0; ai.fireT = 0; }
        else {
          ai.state = 'slamWind'; ai.t = 0.9; ai.lanes = [];
          const n = rage ? 5 : 3, base = Math.atan2(dx, dz);
          for (let i = 0; i < n; i++) {
            const rot = base + (i - (n - 1) / 2) * 0.42;
            ai.lanes.push(rot);
            addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.9, len: 15, rot, dur: 0.9 });
          }
        }
      }
      break;
    }
    case 'swingWind':
      e.clip = 'throw'; e.clipU = (1 - ai.t / 0.9) * 0.5; e.vx *= 0.8; e.vz *= 0.8;
      if (ai.t <= 0) { ai.state = 'swing'; ai.t = rage ? 2.1 : 1.4; ai.swingA = Math.atan2(ball.x - e.x, ball.z - e.z); ai.hitCd = 0; AUDIO.play('throw'); }
      break;
    case 'swing': {
      // the ball whips round in a ring; right next to the bot is the safe spot
      e.clip = 'throw'; e.clipU = 0.55;
      ai.swingA += dt * TAU * 1.45;
      e.yaw = ai.swingA;
      ball.x = e.x + Math.sin(ai.swingA) * 4.6; ball.z = e.z + Math.cos(ai.swingA) * 4.6; ball.y = 1.1; ball.vx = ball.vz = 0;
      ai.hitCd -= dt;
      if (ai.hitCd <= 0 && Math.hypot(h[0] - ball.x, h[2] - ball.z) < 1.3 + HERO_R) { ai.hitCd = 0.5; hurtHero(28 * run.info.dmgMul, ball.x, ball.z); run.vel[0] += (h[0] - e.x) * 2; run.vel[2] += (h[2] - e.z) * 2; }
      enemiesInRadius(ball.x, ball.z, 1.3, o => { if (o !== e && !o.boss) { o.kx += (o.x - e.x) * 2 / o.mass; o.kz += (o.z - e.z) * 2 / o.mass; } });
      if (Math.random() < 0.6) FX.smoke(ball.x, 0.3, ball.z, 0.7, [0.7, 0.7, 0.75], 0.5, 0.5);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.5 : 2.3; }
      break;
    }
    case 'rockets': {
      e.clip = 'idle'; e.phase += dt; bossFace(e, dt, 8); e.vx *= 0.8; e.vz *= 0.8;
      const n = rage ? 11 : 7;
      ai.fireT -= dt;
      if (ai.fired < n && ai.fireT <= 0) {
        ai.fireT = 0.11;
        let tx = h[0] + run.vel[0] * 0.8, tz = h[2] + run.vel[2] * 0.8;
        if (ai.fired) { const a = rand(0, TAU), r = rand(1.5, 5); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
        const o = { x: tx, z: tz }; resolveCircle(o, 0.5);
        addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.4, dur: 1.15 });
        run.eShots.push({ kind: 'rocket', sx: e.x, sy: 2.4 * s * 0.6, sz: e.z, tx: o.x, tz: o.z, x: e.x, y: 2.2, z: e.z, t: 0, dur: 1.15, radius: 1.4, dmg: 22 * run.info.dmgMul, life: 2, spin: 0, peak: 6.5 });
        ai.fired++;
        AUDIO.play('throw', 1.3);
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.2; }
      break;
    }
    case 'slamWind':
      e.clip = 'slam'; e.clipU = (1 - ai.t / 0.9) * 0.6; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t <= 0) {
        // shockwaves run along each lane
        for (const rot of ai.lanes) {
          if (laneHit(e.x, e.z, rot, 15, 0.9 + HERO_R * 0.5, h[0], h[2])) { hurtHero(32 * run.info.dmgMul, e.x, e.z); break; }
        }
        for (const rot of ai.lanes) for (let k = 1; k <= 7; k++) {
          const px = e.x + Math.sin(rot) * k * 2, pz = e.z + Math.cos(rot) * k * 2;
          FX.burst(px, 0.2, pz, 4, [0.62, 0.6, 0.58], 4, 0.14, 0.45, 2); if (k % 2) FX.crack(px, pz, 1.2, 1.4);
          enemiesInRadius(px, pz, 1, o => { if (!o.boss) hurtEnemy(o, 15, Math.sin(rot) * 6, Math.cos(rot) * 6, { sound: false }); });
        }
        G.cam.shake = Math.max(G.cam.shake, 0.25); AUDIO.play('boom');
        ai.state = 'recover'; ai.t = 0.55;
      }
      break;
    case 'recover':
      e.clip = 'slam'; e.clipU = 0.6 + (1 - ai.t / 0.55) * 0.399;
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.2; }
      break;
  }
  // between swings the ball drags along behind on its chain
  if (ai.state !== 'swing') {
    botHand(e, _hand);
    const bx = _hand[0] - Math.sin(e.yaw) * 2.4, bz = _hand[2] - Math.cos(e.yaw) * 2.4;
    ball.vx += ((bx - ball.x) * 14 - ball.vx * 5) * dt; ball.vz += ((bz - ball.z) * 14 - ball.vz * 5) * dt;
    ball.x += ball.vx * dt; ball.z += ball.vz * dt; ball.y += (0.55 - ball.y) * Math.min(1, dt * 6);
  }
};
BOSS_DRAW.wreckbot = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, L = R.frame.lightDir;
  if (R.enemyDraw.wreckbot) pushEnemy('wreckbot', false, e.x, e.y || 0, e.z, e.yaw, e.portrait ? MODELS.defs.wreckbot.clips.idle.row + 2 : enemyRow(e), e.scale, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  if (!e.portrait) pushDecal(e.x - L[0] * 0.5, e.z - L[2] * 0.5, 0.36 * e.scale, 0.5 * e.scale, -Math.atan2(L[0], L[2]), 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  if (!R.enemyDraw.wreckball || dead > 0.5) return;
  const ball = e.portrait ? { x: -0.9, y: 0.3, z: 0.7 } : e.ai.ball;
  if (!ball) return;
  botHand(e, _hand);
  const bs = e.portrait ? 1.2 : 1.9;
  pushEnemy('wreckball', false, ball.x, ball.y - 0.5 * bs, ball.z, e.phase, MODELS.defs.wreckball.clips.still.row, bs, 1, dead, 0, 0, 1, 1, 1);
  // the chain: a sagging dark ribbon from hand to ball
  const n = 10, pts = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    pts.push(lerp(_hand[0], ball.x, u), lerp(_hand[1], ball.y + 0.3, u) - Math.sin(u * Math.PI) * 0.5, lerp(_hand[2], ball.z, u));
  }
  R.ribStrip(pts, n, 0.13, [0.22, 0.23, 0.27, 1], 1, 0, 2);
  if (!e.portrait) pushDecal(ball.x + 0.2, ball.z + 0.15, 0.7, 0.6, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.45);
};

// ---------- Big Bounce (chapter 4): a giant beach ball that hops, pinballs around and spits rubber balls ----------
BOSS_AI.bigbounce = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, s = e.scale, rage = isRage(e);
  if (ai.state === 'walk') { ai.state = 'hopStart'; ai.hops = 3; ai.cycle = 0; }
  ai.sq = ai.sq ?? 1; ai.sqV = ai.sqV ?? 0;
  e.contactDmg = e.dmg;
  switch (ai.state) {
    case 'hopStart': {
      // crouch, then leap at where the hero is heading; the landing spot is telegraphed
      const dur = rage ? 0.62 : 0.85;
      let tx = h[0] + run.vel[0] * dur * 0.8, tz = h[2] + run.vel[2] * dur * 0.8;
      const jx = tx - e.x, jz = tz - e.z, jl = Math.hypot(jx, jz);
      if (jl > 8) { tx = e.x + jx / jl * 8; tz = e.z + jz / jl * 8; }
      const o = { x: tx, z: tz }; resolveCircle(o, e.radius); ai.sx = e.x; ai.sz = e.z; ai.tx = o.x; ai.tz = o.z;
      addTele({ kind: 'circle', x: ai.tx, z: ai.tz, r: 3.1, dur: dur + 0.2 });
      ai.state = 'crouch'; ai.t = 0.2; ai.dur = dur; ai.sqV -= 3;
      break;
    }
    case 'crouch':
      if (ai.t <= 0) { ai.state = 'hop'; ai.t = ai.dur; ai.sqV += 6; }
      break;
    case 'hop': {
      const u = 1 - ai.t / ai.dur;
      e.x = lerp(ai.sx, ai.tx, u); e.z = lerp(ai.sz, ai.tz, u); e.y = Math.sin(u * Math.PI) * 4.6;
      e.yaw = angleLerp(e.yaw, Math.atan2(dx, dz), Math.min(1, dt * 6));
      if (ai.t <= 0) {
        e.y = 0; ai.sqV -= 9;
        if (Math.hypot(h[0] - e.x, h[2] - e.z) < 3.1 + HERO_R * 0.5) hurtHero(30 * run.info.dmgMul, e.x, e.z);
        enemiesInRadius(e.x, e.z, 3.4, o => { if (o !== e && !o.boss) { const ox = o.x - e.x, oz = o.z - e.z, od = Math.hypot(ox, oz) || 1; o.kx += ox / od * 10 / o.mass; o.kz += oz / od * 10 / o.mass; } });
        arenaBlast(e.x, e.z, 7, 1.6);
        FX.ring(e.x, e.z, 7.5, [1, 0.6, 0.7], 0.5); FX.burst(e.x, 0.3, e.z, 18, [1, 0.85, 0.9], 6, 0.16, 0.6, 2);
        G.cam.shake = Math.max(G.cam.shake, 0.2); AUDIO.play('boom');
        ai.hops--;
        if (ai.hops > 0) { ai.state = 'hopStart'; }
        else { ai.cycle++; ai.state = ai.cycle % 2 || rage ? 'rollAim' : 'spitWind'; ai.t = ai.state === 'rollAim' ? 0.7 : 0.55; if (ai.state === 'rollAim') ai.tele = null; }
      }
      break;
    }
    case 'rollAim': {
      e.yaw = angleLerp(e.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10));
      if (!ai.tele) ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: 2.0, len: 16, rot: e.yaw, dur: 0.7 });
      ai.tele.rot = e.yaw; ai.tele.x = e.x; ai.tele.z = e.z;
      ai.sqV -= dt * 20;
      if (ai.t <= 0) { ai.state = 'roll'; ai.t = rage ? 3.6 : 3; ai.dir = [Math.sin(e.yaw), Math.cos(e.yaw)]; ai.tele.done = true; AUDIO.play('throw'); }
      break;
    }
    case 'roll': {
      // pinball: full speed, ricocheting off walls and scenery
      const sp = rage ? 15 : 12.5;
      const ox = e.x + ai.dir[0] * sp * dt, oz = e.z + ai.dir[1] * sp * dt, p = { x: ox, z: oz };
      e.contactDmg = 30 * run.info.dmgMul;
      if (resolveCircle(p, e.radius)) {
        const nx = p.x - ox, nz = p.z - oz, nl = Math.hypot(nx, nz) || 1, vn = ai.dir[0] * nx / nl + ai.dir[1] * nz / nl;
        ai.dir[0] -= 2 * vn * nx / nl; ai.dir[1] -= 2 * vn * nz / nl;
        // steer each bounce a little back toward the hero so it stays dangerous
        const ha = Math.atan2(dx, dz), da = Math.atan2(ai.dir[0], ai.dir[1]), na = turnToward(da, ha, 0.5);
        ai.dir = [Math.sin(na), Math.cos(na)];
        ai.sqV -= 4; G.cam.shake = Math.max(G.cam.shake, 0.08); AUDIO.play('pop', 0.6); arenaBlast(p.x, p.z, 4, 1);
      }
      e.x = p.x; e.z = p.z; e.yaw = Math.atan2(ai.dir[0], ai.dir[1]);
      e.y = Math.abs(Math.sin(run.t * 9)) * 0.5;
      enemiesInRadius(e.x, e.z, e.radius + 0.3, o => { if (o !== e && !o.boss) { o.kx += ai.dir[1] * 9 * (Math.random() < 0.5 ? 1 : -1); o.kz -= ai.dir[0] * 9; } });
      arenaBlast(e.x, e.z, 2.6, 0.6);
      if (ai.t <= 0) { e.y = 0; ai.state = 'hopStart'; ai.hops = rage ? 4 : 3; }
      break;
    }
    case 'spitWind':
      ai.sqV -= dt * 30; e.yaw += dt * 4;
      if (ai.t <= 0) {
        // a ring of bouncing rubber balls
        const n = rage ? 18 : 12, off = rand(0, TAU);
        for (let i = 0; i < n; i++) {
          const a = off + (i / n) * TAU, sp = rand(6, 8);
          run.eShots.push({ kind: 'rball', x: e.x + Math.sin(a) * 2, y: 1.5, z: e.z + Math.cos(a) * 2, vx: Math.sin(a) * sp, vy: rand(3, 6), vz: Math.cos(a) * sp, r: 0.45, dmg: 12 * run.info.dmgMul, life: 4.5, col: BALL_COLORS[i % BALL_COLORS.length] });
        }
        ai.sqV += 10; AUDIO.play('pop'); FX.ring(e.x, e.z, 5, [1, 0.7, 0.8], 0.4);
        ai.state = 'hopStart'; ai.hops = rage ? 4 : 3;
      }
      break;
  }
  // squash-and-stretch spring
  ai.sqV += (110 * (1 - ai.sq) - 9 * ai.sqV) * dt; ai.sq = clamp(ai.sq + ai.sqV * dt, 0.55, 1.4);
  e.phase += dt;
};
BOSS_DRAW.bigbounce = function (e) {
  const s = e.scale, dead = e.dying ? clamp(e.dying, 0, 1) : 0, sq = e.ai.sq || 1, L = R.frame.lightDir;
  const sc = s * (1 - dead * 0.8), y = (e.y || 0) + 0.9 * sc * sq;
  pushImp(e.x, y, e.z, sc, Math.sin(e.yaw), 0, Math.cos(e.yaw), 1, 35, 0, e.flash > 0 ? 0.6 : 0, e.phase, sq, 0, 0, 1 - dead);
  if (!e.portrait) pushDecal(e.x - L[0] * 0.4, e.z - L[2] * 0.4, 0.95 * s, 0.85 * s, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.5 * (1 - clamp((e.y || 0) / 6, 0, 0.7)));
};
