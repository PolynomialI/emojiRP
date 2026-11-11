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
// a short-lived prop (the ice spikes icicles leave): pops out of the ground, blocks, then sinks away
function tempProp(kind, x, z, r, life) {
  const K = PROP_KINDS[kind];
  const o = { kind, x, z, r, yaw: rand(0, TAU), model: K.models[0], ph: rand(0, 10), block: K.block !== false, shots: !!K.shots, life, age: 0, y: -r * 3 };
  ARENA.props.push(o);
  if (o.block) { ARENA.obstacles.push(o); gridObstacles(); }
  return o;
}
function updateTempZones(dt) {
  let any = false;
  for (const o of ARENA.zones) if (o.life !== undefined) { o.life -= dt; any = true; }
  if (any) ARENA.zones = ARENA.zones.filter(o => o.life === undefined || o.life > 0);
  let gone = false;
  for (const o of ARENA.props) {
    if (o.life === undefined) continue;
    o.life -= dt; o.age += dt;
    const sink = o.r * 3.2;
    o.y = -sink * (1 - clamp(o.age / 0.12, 0, 1)) - sink * (1 - clamp(o.life / 0.35, 0, 1));
    if (o.life <= 0) gone = true;
  }
  if (gone) {
    ARENA.props = ARENA.props.filter(o => o.life === undefined || o.life > 0);
    ARENA.obstacles = ARENA.obstacles.filter(o => o.life === undefined || o.life > 0);
    gridObstacles();
  }
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
          ai.state = 'tele'; ai.t = rage ? 0.9 : 1.05; ai.bx = h[0]; ai.bz = h[2];
          const o = { x: ai.bx, z: ai.bz }; resolveCircle(o, 1.5); ai.bx = o.x; ai.bz = o.z;
          addTele({ kind: 'circle', x: ai.bx, z: ai.bz, r: 2.2, dur: ai.t });
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
        if (Math.hypot(h[0] - ai.bx, h[2] - ai.bz) < 2.2 + HERO_R * 0.5) { hurtHero(30 * run.info.dmgMul, ai.bx, ai.bz); run.vel[0] += (h[0] - ai.bx) * 3; run.vel[2] += (h[2] - ai.bz) * 3; }
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
          run.eShots.push({ kind: 'sand', x: e.x, y: 1.1, z: e.z, vx: Math.sin(a) * 6.5, vy: 0, vz: Math.cos(a) * 6.5, dmg: 10 * run.info.dmgMul, r: 0.35, life: 2.6, ph: rand(0, 10) });
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
        if (kind === 'swing') { ai.state = 'swingWind'; ai.t = 1.15; addTele({ kind: 'circle', x: e.x, z: e.z, r: 5.6, dur: 1.15 }); ai.cx = e.x; ai.cz = e.z; }
        else if (kind === 'rockets') { ai.state = 'rockets'; ai.t = 1.5; ai.fired = 0; ai.fireT = 0; }
        else {
          // calm: a tight fan to step out of; rage: five lanes spread wide, with room to stand between them
          ai.state = 'slamWind'; ai.t = ai.dur = 1.1; ai.lanes = [];
          const n = rage ? 5 : 3, base = Math.atan2(dx, dz);
          for (let i = 0; i < n; i++) {
            const rot = base + (i - (n - 1) / 2) * (rage ? 0.62 : 0.42);
            ai.lanes.push(rot);
            addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.75, len: 15, rot, dur: 1.1 });
          }
        }
      }
      break;
    }
    case 'swingWind':
      e.clip = 'throw'; e.clipU = (1 - ai.t / 1.15) * 0.5; e.vx *= 0.8; e.vz *= 0.8;
      if (ai.t <= 0) { ai.state = 'swing'; ai.t = rage ? 1.8 : 1.4; ai.swingA = Math.atan2(ball.x - e.x, ball.z - e.z); ai.hitCd = 0; AUDIO.play('throw'); }
      break;
    case 'swing': {
      // the ball whips round in a ring; right next to the bot is the safe spot
      e.clip = 'throw'; e.clipU = 0.55;
      ai.swingA += dt * TAU * 1.45;
      e.yaw = ai.swingA;
      ball.x = e.x + Math.sin(ai.swingA) * 4.2; ball.z = e.z + Math.cos(ai.swingA) * 4.2; ball.y = 1.1; ball.vx = ball.vz = 0;
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
      e.clip = 'slam'; e.clipU = (1 - ai.t / 1.1) * 0.6; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t <= 0) {
        // shockwaves run along each lane
        for (const rot of ai.lanes) {
          if (laneHit(e.x, e.z, rot, 15, 0.75 + HERO_R * 0.5, h[0], h[2])) { hurtHero(30 * run.info.dmgMul, e.x, e.z); break; }
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
      const dur = rage ? 0.8 : 1.0;
      let tx = h[0] + run.vel[0] * dur * 0.45, tz = h[2] + run.vel[2] * dur * 0.45;
      const jx = tx - e.x, jz = tz - e.z, jl = Math.hypot(jx, jz);
      if (jl > 8) { tx = e.x + jx / jl * 8; tz = e.z + jz / jl * 8; }
      const o = { x: tx, z: tz }; resolveCircle(o, e.radius); ai.sx = e.x; ai.sz = e.z; ai.tx = o.x; ai.tz = o.z;
      addTele({ kind: 'circle', x: ai.tx, z: ai.tz, r: 2.6, dur: dur + 0.2 });
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
        if (Math.hypot(h[0] - e.x, h[2] - e.z) < 2.6 + HERO_R * 0.5) hurtHero(28 * run.info.dmgMul, e.x, e.z);
        enemiesInRadius(e.x, e.z, 3.4, o => { if (o !== e && !o.boss) { const ox = o.x - e.x, oz = o.z - e.z, od = Math.hypot(ox, oz) || 1; o.kx += ox / od * 10 / o.mass; o.kz += oz / od * 10 / o.mass; } });
        arenaBlast(e.x, e.z, 7, 1.6);
        FX.ring(e.x, e.z, 7.5, [1, 0.6, 0.7], 0.5); FX.burst(e.x, 0.3, e.z, 18, [1, 0.85, 0.9], 6, 0.16, 0.6, 2);
        G.cam.shake = Math.max(G.cam.shake, 0.2); AUDIO.play('boom');
        ai.hops--;
        if (ai.hops > 0) { ai.state = 'hopStart'; }
        else { ai.cycle++; ai.state = ai.cycle % 2 || rage ? 'rollAim' : 'spitWind'; ai.t = ai.state === 'rollAim' ? 0.9 : 0.55; if (ai.state === 'rollAim') ai.tele = null; }
      }
      break;
    }
    case 'rollAim': {
      e.yaw = angleLerp(e.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10));
      if (!ai.tele) ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: 2.0, len: 16, rot: e.yaw, dur: 0.9 });
      ai.tele.rot = e.yaw; ai.tele.x = e.x; ai.tele.z = e.z;
      ai.sqV -= dt * 20;
      if (ai.t <= 0) { ai.state = 'roll'; ai.t = rage ? 3 : 2.6; ai.dir = [Math.sin(e.yaw), Math.cos(e.yaw)]; ai.tele.done = true; AUDIO.play('throw'); }
      break;
    }
    case 'roll': {
      // pinball: full speed, ricocheting off walls and scenery
      const sp = rage ? 12.5 : 10.5;
      const ox = e.x + ai.dir[0] * sp * dt, oz = e.z + ai.dir[1] * sp * dt, p = { x: ox, z: oz };
      e.contactDmg = 30 * run.info.dmgMul;
      if (resolveCircle(p, e.radius)) {
        const nx = p.x - ox, nz = p.z - oz, nl = Math.hypot(nx, nz) || 1, vn = ai.dir[0] * nx / nl + ai.dir[1] * nz / nl;
        ai.dir[0] -= 2 * vn * nx / nl; ai.dir[1] -= 2 * vn * nz / nl;
        // steer each bounce a little back toward the hero so it stays dangerous
        const ha = Math.atan2(dx, dz), da = Math.atan2(ai.dir[0], ai.dir[1]), na = turnToward(da, ha, 0.35);
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

// ---------- Jelly Queen (chapter 5): spiral jelly volleys, slime summons and belly flops that leave sticky jelly ----------
BOSS_AI.jellyqueen = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.5; }
  ai.sq = ai.sq ?? 1; ai.sqV = ai.sqV ?? 0;
  switch (ai.state) {
    case 'walk':
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.3 : 1)); bossFace(e, dt, 4);
      ai.sqV += Math.sin(run.t * 8) * dt * 6;
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const seq = rage ? ['spiral', 'slam', 'summon', 'slam'] : ['spiral', 'summon', 'slam'];
        const k = seq[ai.next++ % seq.length];
        if (k === 'spiral') { ai.state = 'spiral'; ai.t = rage ? 3 : 2.6; ai.emitT = 0; ai.spin = rand(0, TAU); }
        else if (k === 'summon') { ai.state = 'summon'; ai.t = 0.8; }
        else {
          const o = { x: h[0] + run.vel[0] * 0.6, z: h[2] + run.vel[2] * 0.6 }; resolveCircle(o, e.radius);
          ai.state = 'flop'; ai.t = ai.dur = rage ? 1.1 : 1.25; ai.sx = e.x; ai.sz = e.z; ai.tx = o.x; ai.tz = o.z; ai.sqV += 5;
          addTele({ kind: 'circle', x: o.x, z: o.z, r: 3.2, dur: ai.dur });
        }
      }
      break;
    case 'spiral': {
      // spinning arms of jelly blobs: walk along the gaps
      e.vx *= 0.85; e.vz *= 0.85;
      const arms = rage ? 5 : 4;
      ai.spin += dt * (rage ? 1.9 : 1.4);
      ai.emitT -= dt;
      if (ai.emitT <= 0) {
        ai.emitT = 0.14;
        for (let k = 0; k < arms; k++) {
          const a = ai.spin + k * TAU / arms;
          run.eShots.push({ kind: 'jelly', x: e.x + Math.sin(a) * 1.6, y: 1.0, z: e.z + Math.cos(a) * 1.6, vx: Math.sin(a) * 4.4, vy: 0, vz: Math.cos(a) * 4.4, dmg: 11 * run.info.dmgMul, r: 0.34, life: 6, ph: rand(0, 10) });
        }
        ai.sqV -= 1.2;
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.2; }
      break;
    }
    case 'summon':
      ai.sqV -= dt * 25;
      if (ai.t <= 0) {
        const n = rage ? 8 : 5;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU, m = spawnEnemy('slime', e.x + Math.sin(a) * 2.8, e.z + Math.cos(a) * 2.8);
          m.spawnT = 0.4; m.kx = Math.sin(a) * 5; m.kz = Math.cos(a) * 5;
        }
        FX.droplets(e.x, 1.2, e.z, 18, 4, 5, 0.09, null); AUDIO.play('split'); ai.sqV += 8;
        ai.state = 'walk'; ai.cd = rage ? 1.6 : 2.4;
      }
      break;
    case 'flop': {
      const u = 1 - ai.t / ai.dur;
      e.x = lerp(ai.sx, ai.tx, u); e.z = lerp(ai.sz, ai.tz, u); e.y = Math.sin(u * Math.PI) * 6;
      if (ai.t <= 0) {
        e.y = 0; ai.sqV -= 10;
        if (Math.hypot(h[0] - e.x, h[2] - e.z) < 3.2 + HERO_R * 0.5) hurtHero(34 * run.info.dmgMul, e.x, e.z);
        enemiesInRadius(e.x, e.z, 3.4, o => { if (o !== e && !o.boss) { const ox = o.x - e.x, oz = o.z - e.z, od = Math.hypot(ox, oz) || 1; o.kx += ox / od * 9 / o.mass; o.kz += oz / od * 9 / o.mass; } });
        tempZone('jelly', e.x, e.z, rage ? 3.6 : 2.9, 7);
        FX.droplets(e.x, 0.8, e.z, 30, 4, 7, 0.1, null); FX.ring(e.x, e.z, 7, [1, 0.5, 0.65], 0.5);
        G.cam.shake = Math.max(G.cam.shake, 0.24); AUDIO.play('boom');
        ai.state = 'walk'; ai.cd = rage ? 1.2 : 2;
      }
      break;
    }
  }
  ai.sqV += (90 * (1 - ai.sq) - 7 * ai.sqV) * dt; ai.sq = clamp(ai.sq + ai.sqV * dt, 0.6, 1.4);
  e.phase += dt;
};
BOSS_DRAW.jellyqueen = function (e) {
  const s = e.scale, dead = e.dying ? clamp(e.dying, 0, 1) : 0, sq = e.ai.sq || 1, L = R.frame.lightDir;
  const sc = s * (1 - dead * 0.6), y = (e.y || 0) + 0.85 * sc * sq;
  pushImp(e.x, y, e.z, sc, Math.sin(e.yaw), 0, Math.cos(e.yaw), 1, 36, 4, e.flash > 0 ? 0.7 : 0.08, e.phase, sq, 0, 0, 1 - dead);
  if (!e.portrait) pushDecal(e.x - L[0] * 0.4, e.z - L[2] * 0.4, 0.95 * s, 0.85 * s, 0, 1, 0, 0, 0.05, 0.01, 0.03, 0.5 * (1 - clamp((e.y || 0) / 7, 0, 0.7)));
};

// ---------- Frost Yeti (chapter 6): sweeping frost breath, icicle rain and a ring of ice spikes with gaps ----------
const YETI = { range: 9.5, half: 0.4, waveMax: 17 };
// a frost cloud puff rolling out of the yeti's mouth
function frostPuff(x, z, dir, k) {
  const sp = rand(7, 10), a = dir + rand(-0.25, 0.25);
  FX.part(x + Math.sin(a) * 1.2, rand(1.2, 1.9), z + Math.cos(a) * 1.2, Math.sin(a) * sp, rand(-0.6, 0.2), Math.cos(a) * sp, 0.35 * k, 1.3 * k, 0.9, [0.45, 0.78, 1], 0.8, 2, 0, 0.9);
}
BOSS_AI.yeti = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, s = e.scale, rage = isRage(e);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.6; }
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.3 : 1)); bossFace(e, dt);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['breath', 'icicles', 'slam'][ai.next++ % 3];
        if (k === 'breath') {
          // the whole swept slice is telegraphed; the breath then rakes across it from one side
          const mid = Math.atan2(dx, dz), sweep = rage ? 1.7 : 1.15, dir = Math.random() < 0.5 ? 1 : -1;
          ai.state = 'breathWind'; ai.t = ai.dur = rage ? 0.7 : 0.85;
          ai.ang = mid - dir * sweep / 2; ai.angV = dir * sweep / (rage ? 1.9 : 1.6);
          addTele({ kind: 'cone', x: e.x, z: e.z, r: YETI.range, rot: mid, half: YETI.half + sweep / 2, dur: ai.dur });
        } else if (k === 'icicles') { ai.state = 'summon'; ai.t = 0.7; ai.waves = rage ? 4 : 3; }
        else {
          // spikes erupt in a ring rolling outward; a few slices stay clear
          ai.state = 'slamWind'; ai.t = ai.dur = 1.1; ai.rings = rage ? 2 : 1;
          yetiGaps(ai, 3, rand(0, TAU));
          for (const g of ai.danger) addTele({ kind: 'cone', x: e.x, z: e.z, r: 12, rot: g[0], half: g[1], dur: ai.dur });
        }
      }
      break;
    }
    case 'breathWind':
      e.clip = 'idle'; e.phase += dt * 2; e.vx *= 0.8; e.vz *= 0.8;
      e.yaw = angleLerp(e.yaw, ai.ang, Math.min(1, dt * 8));
      if (Math.random() < 0.5) FX.part(e.x + Math.sin(e.yaw) * 1.1, 1.7, e.z + Math.cos(e.yaw) * 1.1, rand(-0.5, 0.5), 0.3, rand(-0.5, 0.5), 0.15, 0.5, 0.5, [0.8, 0.94, 1], 0.6, 2, 0, 1);
      if (ai.t <= 0) { ai.state = 'breath'; ai.t = rage ? 1.9 : 1.6; ai.tick = 0; AUDIO.play('zap', 0.6); }
      break;
    case 'breath': {
      e.clip = 'idle'; e.vx *= 0.8; e.vz *= 0.8;
      ai.ang += ai.angV * dt; e.yaw = ai.ang;
      for (let i = 0; i < 3; i++) frostPuff(e.x, e.z, ai.ang, 1);
      const inCone = (x, z) => { const ox = x - e.x, oz = z - e.z; return Math.hypot(ox, oz) < YETI.range && Math.abs(angleDiff(Math.atan2(ox, oz), ai.ang)) < YETI.half; };
      ai.tick -= dt;
      if (ai.tick <= 0 && inCone(h[0], h[2])) { ai.tick = 0.25; hurtHero(8 * run.info.dmgMul, e.x, e.z); run.chillT = 1.4; }
      // its own minions get frozen solid in the blast
      enemiesInRadius(e.x, e.z, YETI.range, o => { if (o !== e && !o.boss && inCone(o.x, o.z)) o.frozen = Math.max(o.frozen || 0, 2.5); });
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.1; }
      break;
    }
    case 'summon':
      // roars at the sky; icicles rain down in waves around the hero
      e.clip = 'conduct'; e.phase += dt * 1.5; e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt);
      if (ai.t <= 0) {
        const n = rage ? 7 : 5;
        for (let i = 0; i < n; i++) {
          let tx = h[0] + run.vel[0] * 0.9, tz = h[2] + run.vel[2] * 0.9;
          if (i) { const a = rand(0, TAU), r = rand(1.6, 5.5); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
          const o = { x: tx, z: tz }; resolveCircle(o, 0.6);
          const dur = 1.0 + i * 0.05;
          addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.1, dur });
          run.eShots.push({ kind: 'icicle', x: o.x, y: 13, z: o.z, sx: o.x, sy: 13, sz: o.z, tx: o.x, tz: o.z, t: 0, dur, radius: 1.1, dmg: 24 * run.info.dmgMul, life: dur + 1, spin: rand(0, TAU), stay: rage ? 5 : 4 });
        }
        AUDIO.play('throw', 0.7);
        if (--ai.waves > 0) ai.t = 0.65;
        else { ai.state = 'walk'; ai.cd = rage ? 1.6 : 2.4; }
      }
      break;
    case 'slamWind':
      e.clip = 'slam'; e.clipU = (1 - ai.t / ai.dur) * 0.6; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t <= 0) {
        ai.state = 'wave'; ai.waveR = e.radius; ai.hit = false; ai.cx = e.x; ai.cz = e.z; ai.t = 0.6;
        FX.ring(e.x, e.z, 4, [0.7, 0.9, 1], 0.5); FX.crack(e.x, e.z, 3, 1.6);
        G.cam.shake = Math.max(G.cam.shake, 0.25); AUDIO.play('boom');
      }
      break;
    case 'wave': {
      e.clip = 'slam'; e.clipU = Math.min(0.999, 0.6 + (0.6 - Math.max(ai.t, 0)) * 0.66);
      const prev = ai.waveR;
      ai.waveR += (rage ? 9 : 7.5) * dt;
      // the hero is hit when the front passes them, unless they stand in a gap
      const hd = Math.hypot(h[0] - ai.cx, h[2] - ai.cz);
      if (!ai.hit && hd > prev - 0.6 && hd < ai.waveR + 0.4 && !yetiInGap(ai, Math.atan2(h[0] - ai.cx, h[2] - ai.cz))) {
        ai.hit = true; hurtHero(30 * run.info.dmgMul, ai.cx, ai.cz);
        const l = hd || 1; run.vel[0] += (h[0] - ai.cx) / l * 9; run.vel[2] += (h[2] - ai.cz) / l * 9;
      }
      enemiesInRadius(ai.cx, ai.cz, ai.waveR + 0.4, o => {
        if (o.boss || o.waveHit === ai.waveId) return;
        const od = Math.hypot(o.x - ai.cx, o.z - ai.cz);
        if (od > prev - 0.6 && !yetiInGap(ai, Math.atan2(o.x - ai.cx, o.z - ai.cz))) { o.waveHit = ai.waveId; hurtEnemy(o, 18, 0, 0, { sound: false }); }
      });
      if (Math.random() < 0.8) {
        const a = rand(0, TAU);
        if (!yetiInGap(ai, a)) FX.burst(ai.cx + Math.sin(a) * ai.waveR, 0.3, ai.cz + Math.cos(a) * ai.waveR, 2, [0.85, 0.95, 1], 3, 0.08, 0.4, 1);
      }
      if (ai.waveR > YETI.waveMax) {
        if (--ai.rings > 0) {
          // a second ring with the gaps moved: find the new ones
          ai.state = 'slamWind'; ai.t = ai.dur = 0.55;
          yetiGaps(ai, 3, ai.gap0 + Math.PI / 3 + rand(-0.2, 0.2));
          for (const g of ai.danger) addTele({ kind: 'cone', x: e.x, z: e.z, r: 12, rot: g[0], half: g[1], dur: ai.dur });
        } else { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.2; }
      }
      break;
    }
  }
};
// n evenly spaced clear slices, the first at angle a0; ai.danger holds the [centre, half-angle] of the slices between
const YETI_GAP = 0.38;
function yetiGaps(ai, n, a0) {
  ai.gap0 = a0; ai.gaps = n; ai.waveId = (ai.waveId || 0) + 1; ai.danger = [];
  const step = TAU / n;
  for (let i = 0; i < n; i++) ai.danger.push([a0 + step * (i + 0.5), step / 2 - YETI_GAP]);
}
function yetiInGap(ai, a) {
  const step = TAU / ai.gaps, u = ((a - ai.gap0) % step + step * 1.5) % step - step / 2;
  return Math.abs(u) < YETI_GAP;
}
BOSS_DRAW.yeti = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, L = R.frame.lightDir, ai = e.ai;
  if (R.enemyDraw.yeti) pushEnemy('yeti', false, e.x, e.y || 0, e.z, e.yaw, e.portrait ? MODELS.defs.yeti.clips.idle.row + 2 : enemyRow(e), e.scale, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  if (e.portrait) return;
  pushDecal(e.x - L[0] * 0.5, e.z - L[2] * 0.5, 0.4 * e.scale, 0.52 * e.scale, -Math.atan2(L[0], L[2]), 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  // the spike ring: shards burst up along the front and sink behind it
  if (ai.state === 'wave' && R.enemyDraw.icespike && !dead) {
    const row = MODELS.defs.icespike.clips.still.row;
    for (const back of [0, 1.3]) {
      const r = ai.waveR - back;
      if (r < e.radius) continue;
      const n = Math.max(6, Math.floor(TAU * r / 1.15)), sc = back ? 1.1 : 1.6, sink = back ? -0.8 : -0.15;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + ai.waveId;
        if (yetiInGap(ai, a)) continue;
        const x = ai.cx + Math.sin(a) * r, z = ai.cz + Math.cos(a) * r;
        if (!onScreen(x, z, 2)) continue;
        pushEnemy('icespike', false, x, sink, z, a * 3.7, row, sc, 1, 0, 0, 0, 0.5, 0.78, 1);
      }
    }
  }
};

// ---------- Magma Golem (chapter 7): lava fissures, magma lobs, and a core eruption that leaves it cooled and brittle ----------
BOSS_AI.magma = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.8; ai.heat = 0; ai.stepT = 0; }
  ai.heat = Math.max(0, (ai.heat || 0) - dt * 0.8);
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.35 : 1)); bossFace(e, dt);
      // enraged, its crust cracks open and it leaves burning footprints
      if (rage) { ai.stepT -= dt; if (ai.stepT <= 0) { ai.stepT = 0.5; tempZone('lava', e.x, e.z, 1.0, 3.5); } }
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['fissure', 'lob', 'erupt'][ai.next++ % 3];
        if (k === 'fissure') {
          ai.state = 'fissureWind'; ai.t = ai.dur = 0.85; ai.lanes = [];
          const n = rage ? 3 : 1, base = Math.atan2(dx, dz);
          for (let i = 0; i < n; i++) { const rot = base + (i - (n - 1) / 2) * 0.5; ai.lanes.push(rot); addTele({ kind: 'lane', x: e.x, z: e.z, r: 1.0, len: 16, rot, dur: ai.dur }); }
        } else if (k === 'lob') { ai.state = 'lob'; ai.t = 1.6; ai.fired = 0; ai.fireT = 0.3; }
        else { ai.state = 'erupt'; ai.t = ai.dur = rage ? 1.15 : 1.4; addTele({ kind: 'circle', x: e.x, z: e.z, r: 5.5, dur: ai.dur }); }
      }
      break;
    }
    case 'fissureWind':
      e.clip = 'slam'; e.clipU = (1 - ai.t / ai.dur) * 0.6; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t <= 0) {
        ai.state = 'fissure'; ai.front = 0.8; ai.hitLane = false; ai.cx = e.x; ai.cz = e.z; ai.t = 0.6; ai.lastK = 0;
        G.cam.shake = Math.max(G.cam.shake, 0.22); AUDIO.play('boom');
      }
      break;
    case 'fissure': {
      // the crack races out along each lane and lava wells up behind it
      e.clip = 'slam'; e.clipU = 0.6 + Math.min(0.39, (0.6 - Math.max(ai.t, 0)) * 0.65);
      ai.front += 15 * dt;
      while (ai.lastK * 1.5 < Math.min(ai.front, 16)) {
        ai.lastK++;
        for (const rot of ai.lanes) {
          const px = ai.cx + Math.sin(rot) * ai.lastK * 1.5, pz = ai.cz + Math.cos(rot) * ai.lastK * 1.5;
          if (arenaSd(px, pz) > -0.5) continue;
          tempZone('lava', px, pz, 0.95, rage ? 6 : 4.5);
          FX.burst(px, 0.3, pz, 5, [1, 0.5, 0.12], 4, 0.12, 0.5, 0); FX.crack(px, pz, 1.3, 2);
          if (!ai.hitLane && Math.hypot(h[0] - px, h[2] - pz) < 1.0 + HERO_R) { ai.hitLane = true; hurtHero(26 * run.info.dmgMul, px, pz); }
          enemiesInRadius(px, pz, 1.1, o => { if (!o.boss) hurtEnemy(o, 16, 0, 0, { sound: false }); });
        }
      }
      if (ai.front >= 16) { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.1; }
      break;
    }
    case 'lob': {
      e.clip = 'throw'; e.clipU = clamp(1 - ai.t / 1.6, 0, 0.999); bossFace(e, dt, 8); e.vx *= 0.8; e.vz *= 0.8;
      const n = rage ? 6 : 4;
      ai.fireT -= dt;
      if (ai.fired < n && ai.fireT <= 0) {
        ai.fireT = 0.22;
        let tx = h[0] + run.vel[0] * 0.9, tz = h[2] + run.vel[2] * 0.9;
        if (ai.fired) { const a = rand(0, TAU), r = rand(2, 5); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
        const o = { x: tx, z: tz }; resolveCircle(o, 0.8);
        addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.5, dur: 1.1 });
        run.eShots.push({ kind: 'magma', sx: e.x, sy: 2.6, sz: e.z, tx: o.x, tz: o.z, x: e.x, y: 2.6, z: e.z, t: 0, dur: 1.1, radius: 1.5, dmg: 22 * run.info.dmgMul, life: 2, spin: 0, peak: 5.5, pool: 1.7, stay: rage ? 6 : 5 });
        ai.fired++; AUDIO.play('throw', 0.8);
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.2; }
      break;
    }
    case 'erupt': {
      // the core overheats (stand clear), then blows
      e.clip = 'idle'; e.phase += dt * 3; e.vx *= 0.7; e.vz *= 0.7;
      ai.heat = 1 - Math.max(ai.t, 0) / ai.dur;
      if (Math.random() < 0.3 + ai.heat) FX.part(e.x + rand(-1, 1), rand(0.5, 2.5), e.z + rand(-1, 1), 0, rand(1, 3), 0, 0.2, 0.05, 0.5, [1, rand(0.3, 0.7), 0.1], 1, 0);
      if (ai.t <= 0) {
        if (Math.hypot(h[0] - e.x, h[2] - e.z) < 5.5 + HERO_R * 0.5) { hurtHero(36 * run.info.dmgMul, e.x, e.z); run.vel[0] += dx / d * 10; run.vel[2] += dz / d * 10; }
        enemiesInRadius(e.x, e.z, 5.5, o => { if (o !== e && !o.boss) hurtEnemy(o, 30, (o.x - e.x) * 3, (o.z - e.z) * 3, { sound: false }); });
        FX.ring(e.x, e.z, 11, [1, 0.55, 0.15], 0.6); FX.ring(e.x, e.z, 7, [1, 0.85, 0.4], 0.45);
        for (let i = 0; i < 40; i++) { const a = rand(0, TAU), sp = rand(6, 14); FX.part(e.x, rand(0.5, 2), e.z, Math.cos(a) * sp, rand(1, 5), Math.sin(a) * sp, rand(0.15, 0.3), 0.05, rand(0.4, 0.8), [1, rand(0.35, 0.75), 0.1], 1, 0, -4, 2); }
        FX.crack(e.x, e.z, 5, 2.5); arenaBlast(e.x, e.z, 8, 1.5);
        G.cam.shake = Math.max(G.cam.shake, 0.35); AUDIO.play('boom');
        // cooled and crusted over: it stands still and takes extra damage for a moment
        ai.state = 'cooled'; ai.t = 2.4; e.dizzy = 2.4; ai.heat = 0;
      }
      break;
    }
    case 'cooled':
      e.clip = 'idle'; e.phase += dt * 0.3; e.vx *= 0.7; e.vz *= 0.7;
      if (Math.random() < 0.4) FX.smoke(e.x + rand(-0.8, 0.8), rand(1, 2.5), e.z + rand(-0.8, 0.8), 0.9, [0.35, 0.32, 0.3], 1, 1);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.0 : 1.6; }
      break;
  }
};
BOSS_DRAW.magma = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, ai = e.ai, L = R.frame.lightDir, t = e.tint;
  // heats toward orange while erupting (and a little for good once enraged), greys out while cooled
  const k = Math.max(ai.heat || 0, !e.portrait && isRage(e) ? 0.22 : 0), cool = ai.state === 'cooled' ? clamp(ai.t / 0.6, 0, 1) : 0;
  let r = lerp(t[0], 1.0, k), g = lerp(t[1], 0.42, k), b = lerp(t[2], 0.12, k);
  r = lerp(r, 0.4, cool); g = lerp(g, 0.4, cool); b = lerp(b, 0.42, cool);
  if (R.enemyDraw.golem) pushEnemy('golem', false, e.x, e.y || 0, e.z, e.yaw, e.portrait ? MODELS.defs.golem.clips.idle.row + 2 : enemyRow(e), e.scale, e.squash, dead, fl, 0, r, g, b);
  if (e.portrait || dead) return;
  pushDecal(e.x - L[0] * 0.5, e.z - L[2] * 0.5, 0.42 * e.scale, 0.55 * e.scale, -Math.atan2(L[0], L[2]), 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  const s = e.scale, h = ai.heat || 0;
  FX.glow(e.x + Math.sin(e.yaw) * 0.3 * s, 0.66 * s, e.z + Math.cos(e.yaw) * 0.3 * s, (0.5 + h * 1.4) * (1 - cool), [1, 0.55, 0.15], 0.05, 0.5 + h * 0.5);
};

// ---------- Vine Hydra (chapter 8): flower heads on vine necks that snap and spit seeds, and roots that snare ----------
const HYDRA = { reach: 7 };
// where head i of n sways when it isn't attacking: a fan in front of the bulb
function hydraRest(e, i, n, out) {
  const s = e.scale / 2.6, spread = n > 3 ? 0.72 : 1.05, a = e.yaw + (i - (n - 1) / 2) * spread, t = (G.run && G.run.t) || 0;
  out.x = e.x + Math.sin(a) * 2.7 * s + Math.sin(t * 1.3 + i * 2) * 0.25;
  out.z = e.z + Math.cos(a) * 2.7 * s + Math.cos(t * 1.1 + i * 2) * 0.25;
  out.y = 3.0 * s + Math.sin(t * 1.7 + i) * 0.2;
  return out;
}
function hydraHead(e, i, n) { const o = hydraRest(e, i, n, {}); return { x: o.x, y: o.y, z: o.z, yaw: e.yaw, st: 'idle', t: 0, grow: 1, recoil: 0 }; }
const _rest = {};
function updateHydraHead(e, hd, i, n, dt, rage) {
  const h = G.hero.pos, run = G.run, ease = k => { const f = Math.min(1, dt * k); hd.x += (_rest.x - hd.x) * f; hd.z += (_rest.z - hd.z) * f; hd.y += (_rest.y - hd.y) * f; };
  hydraRest(e, i, n, _rest);
  hd.grow = Math.min(1, hd.grow + dt * 1.5);
  hd.recoil = Math.max(0, hd.recoil - dt * 4);
  hd.t -= dt;
  switch (hd.st) {
    case 'wait':
      ease(6); hd.yaw = angleLerp(hd.yaw, Math.atan2(h[0] - hd.x, h[2] - hd.z), Math.min(1, dt * 6));
      if (hd.t <= 0) {
        // rear back and telegraph the lane it will strike along
        hd.st = 'aim'; hd.t = hd.dur = rage ? 0.72 : 0.88;
        hd.sx = _rest.x; hd.sz = _rest.z; hd.rot = Math.atan2(h[0] + run.vel[0] * 0.25 - hd.sx, h[2] + run.vel[2] * 0.25 - hd.sz);
        addTele({ kind: 'lane', x: hd.sx, z: hd.sz, r: 0.9, len: HYDRA.reach, rot: hd.rot, dur: hd.dur });
      }
      break;
    case 'aim': {
      const f = Math.min(1, dt * 8);
      hd.x += (hd.sx - Math.sin(hd.rot) * 0.9 - hd.x) * f; hd.z += (hd.sz - Math.cos(hd.rot) * 0.9 - hd.z) * f; hd.y += (_rest.y + 0.5 - hd.y) * f;
      hd.yaw = hd.rot;
      if (hd.t <= 0) { hd.st = 'strike'; hd.t = 0.16; hd.hit = false; AUDIO.play('throw', 0.8); }
      break;
    }
    case 'strike': {
      const u = 1 - Math.max(hd.t, 0) / 0.16;
      hd.x = hd.sx + Math.sin(hd.rot) * HYDRA.reach * u; hd.z = hd.sz + Math.cos(hd.rot) * HYDRA.reach * u; hd.y = lerp(_rest.y, 0.8, u);
      if (!hd.hit && Math.hypot(h[0] - hd.x, h[2] - hd.z) < 1.0 + HERO_R) { hd.hit = true; hurtHero(24 * run.info.dmgMul, hd.x, hd.z); run.vel[0] += Math.sin(hd.rot) * 8; run.vel[2] += Math.cos(hd.rot) * 8; }
      enemiesInRadius(hd.x, hd.z, 1.0, o => { if (!o.boss && o.snapId !== hd) { o.snapId = hd; hurtEnemy(o, 18, Math.sin(hd.rot) * 6, Math.cos(hd.rot) * 6, { sound: false }); } });
      if (hd.t <= 0) {
        hd.st = 'back'; hd.t = 0.5;
        FX.burst(hd.x, 0.3, hd.z, 8, [0.45, 0.35, 0.22], 4, 0.12, 0.45, 2); FX.crack(hd.x, hd.z, 1.1, 1.2);
        G.cam.shake = Math.max(G.cam.shake, 0.1);
      }
      break;
    }
    case 'back':
      ease(5); hd.yaw = angleLerp(hd.yaw, Math.atan2(h[0] - hd.x, h[2] - hd.z), Math.min(1, dt * 4));
      if (hd.t <= 0) hd.st = 'idle';
      break;
    default:
      ease(4); hd.yaw = angleLerp(hd.yaw, Math.atan2(h[0] - hd.x, h[2] - hd.z), Math.min(1, dt * 4));
  }
}
BOSS_AI.hydra = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (!ai.heads) { ai.heads = [0, 1, 2].map(i => hydraHead(e, i, 3)); ai.next = 0; ai.cd = 1.6; ai.roots = []; }
  // enraged, it sprouts two more heads
  if (rage && ai.heads.length < 5) {
    while (ai.heads.length < 5) { const hd = hydraHead(e, ai.heads.length, 5); hd.grow = 0; ai.heads.push(hd); }
    FX.burst(e.x, 2, e.z, 24, [0.4, 0.9, 0.3], 5, 0.14, 0.6, 1); AUDIO.play('split');
  }
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.3 : 1)); bossFace(e, dt, 2);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['snap', 'seeds', 'roots'][ai.next++ % 3];
        ai.state = k;
        if (k === 'snap') ai.heads.forEach((hd, i) => { hd.st = 'wait'; hd.t = 0.15 + i * (rage ? 0.28 : 0.4); });
        else if (k === 'seeds') { ai.t = 1.6; ai.volley = 0; ai.fireT = 0.35; }
        else { ai.t = 1; ai.rootN = 0; ai.fireT = 0; }
      }
      break;
    }
    case 'snap':
      e.vx *= 0.85; e.vz *= 0.85; bossFace(e, dt, 2);
      if (ai.heads.every(hd => hd.st === 'idle')) { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.1; }
      break;
    case 'seeds': {
      // every head spits a fan of seeds; the second volley fills the gaps of the first
      e.vx *= 0.85; e.vz *= 0.85; bossFace(e, dt, 3);
      ai.fireT -= dt;
      if (ai.fireT <= 0 && ai.volley < 2) {
        ai.fireT = 0.7; ai.volley++;
        for (const hd of ai.heads) {
          const base = Math.atan2(h[0] - hd.x, h[2] - hd.z), m = rage ? 4 : 3;
          for (let j = 0; j < m; j++) {
            const a = base + (j - (m - 1) / 2) * 0.24 + (ai.volley === 2 ? 0.12 : 0);
            run.eShots.push({ kind: 'seed', x: hd.x, y: 1.0, z: hd.z, vx: Math.sin(a) * 7.5, vy: 0, vz: Math.cos(a) * 7.5, dmg: 12 * run.info.dmgMul, r: 0.26, life: 4, ph: rand(0, 10) });
          }
          hd.recoil = 1;
        }
        AUDIO.play('throw', 1.2);
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.1; }
      break;
    }
    case 'roots': {
      // roots burst up where the hero is, again and again
      e.vx *= 0.85; e.vz *= 0.85; e.phase += dt;
      const total = rage ? 8 : 6;
      ai.fireT -= dt;
      if (ai.fireT <= 0 && ai.rootN < total) {
        ai.fireT = rage ? 0.36 : 0.45; ai.rootN++;
        const o = { x: h[0] + run.vel[0] * 0.3, z: h[2] + run.vel[2] * 0.3 }; resolveCircle(o, 0.5);
        addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.3, dur: 0.75 });
        ai.roots.push({ x: o.x, z: o.z, t: 0.75 });
      }
      if (ai.rootN >= total && !ai.roots.length) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.2; }
      break;
    }
  }
  for (const r of ai.roots) {
    r.t -= dt;
    if (r.t > 0) continue;
    r.done = true;
    // caught: hurt and stuck for a moment, then safe from more roots for a little while
    if (Math.hypot(h[0] - r.x, h[2] - r.z) < 1.3 + HERO_R * 0.5 && run.t > (run.rootFree || 0)) { hurtHero(18 * run.info.dmgMul, r.x, r.z); run.rootT = 0.7; run.rootFree = run.t + 1.5; }
    enemiesInRadius(r.x, r.z, 1.3, o => { if (!o.boss) hurtEnemy(o, 14, 0, 0, { sound: false }); });
    tempProp('roots', r.x, r.z, 0.7, 1.4);
    FX.burst(r.x, 0.3, r.z, 10, [0.45, 0.32, 0.2], 4, 0.12, 0.5, 2); FX.crack(r.x, r.z, 1.2, 1.4);
    AUDIO.play('hit', 0.6);
  }
  ai.roots = ai.roots.filter(r => !r.done);
  for (let i = 0; i < ai.heads.length; i++) updateHydraHead(e, ai.heads[i], i, ai.heads.length, dt, rage);
};
BOSS_DRAW.hydra = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, L = R.frame.lightDir, s = e.scale / 2.6;
  const D = MODELS.defs, ok = R.enemyDraw.hydrabody && R.enemyDraw.hydrahead && R.enemyDraw.vineseg;
  if (!ok) return;
  pushEnemy('hydrabody', false, e.x, 0, e.z, e.yaw, D.hydrabody.clips.still.row, e.scale, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  if (!e.portrait) pushDecal(e.x - L[0] * 0.5, e.z - L[2] * 0.5, 1.4 * s, 1.3 * s, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  const heads = e.ai.heads || [0, 1, 2].map(i => hydraHead(e, i, 3)), n = heads.length;
  for (let i = 0; i < n; i++) {
    const hd = heads[i], g = hd.grow * (1 - dead), a = e.yaw + (i - (n - 1) / 2) * 0.5;
    // the neck: a sagging curve of vine segments from the top of the bulb to the head
    const bx = e.x + Math.sin(a) * 0.4 * e.scale, by = 0.85 * e.scale, bz = e.z + Math.cos(a) * 0.4 * e.scale;
    const cx = (bx + hd.x) / 2, cy = Math.max(by, hd.y) + 1.0 * s, cz = (bz + hd.z) / 2;
    const len = Math.hypot(hd.x - bx, hd.y - by, hd.z - bz), m = clamp(Math.ceil(len / 0.55), 5, 16);
    for (let k = 1; k < m; k++) {
      const u = k / m, v = 1 - u;
      const x = v * v * bx + 2 * v * u * cx + u * u * hd.x, y = v * v * by + 2 * v * u * cy + u * u * hd.y, z = v * v * bz + 2 * v * u * cz + u * u * hd.z;
      const ss = (1.15 - u * 0.35) * s * g;
      pushEnemy('vineseg', false, x, y - 0.5 * ss, z, a + k, D.vineseg.clips.still.row, ss, 1, dead, fl, 0, t[0] * 0.85, t[1] * 0.85, t[2] * 0.85);
    }
    const hs = 1.9 * s * g * (1 + hd.recoil * 0.15);
    pushEnemy('hydrahead', false, hd.x, hd.y - 0.5 * hs, hd.z, hd.yaw, D.hydrahead.clips.still.row, hs, 1, dead, fl, 0, t[0], t[1], t[2]);
    if (!e.portrait) pushDecal(hd.x - L[0] * 0.4, hd.z - L[2] * 0.4, 0.6 * s, 0.5 * s, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.35);
  }
};

// ---------- Captain Crab (chapter 9): sidesteps around you, double claw snaps, a line of cannon fire, drifting bubbles ----------
BOSS_AI.crab = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.4; ai.side = 1; }
  ai.claw = Math.max(0, (ai.claw || 0) - dt * 3);
  switch (ai.state) {
    case 'walk': {
      // circle the hero sideways at a few metres, now and then switching direction
      const a = Math.atan2(e.x - h[0], e.z - h[2]) + ai.side * 0.55;
      bossWalk(e, dt, h[0] + Math.sin(a) * 6.5, h[2] + Math.cos(a) * 6.5, e.speed * (rage ? 1.3 : 1)); bossFace(e, dt, 6);
      if (Math.random() < dt * 0.25) ai.side = -ai.side;
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const seq = rage ? ['snap', 'cannons', 'scuttle', 'bubbles', 'cannons', 'scuttle'] : ['snap', 'cannons', 'bubbles'];
        const k = seq[ai.next++ % seq.length];
        if (k === 'snap') { ai.state = 'rush'; ai.t = 0.8; ai.snaps = 2; }
        else if (k === 'cannons') { ai.state = 'aimCannon'; ai.t = 0.6; }
        else if (k === 'bubbles') { ai.state = 'bubbles'; ai.t = 0.7; ai.blown = false; }
        else {
          // a sideways dash right across the sand
          ai.rot = e.yaw + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
          ai.state = 'scuttleWind'; ai.t = ai.dur = 0.7;
          addTele({ kind: 'lane', x: e.x, z: e.z, r: 1.6, len: 15, rot: ai.rot, dur: ai.dur });
        }
      }
      break;
    }
    case 'rush':
      // scuttle in close, then snap
      bossFace(e, dt, 8);
      if (d > 3.4) { e.x += dx / d * 9 * dt; e.z += dz / d * 9 * dt; e.phase += dt * 4; }
      if (d <= 3.4 || ai.t <= 0) crabSnapWind(e, ai, dx, dz, rage);
      break;
    case 'snapWind':
      e.vx *= 0.7; e.vz *= 0.7;
      e.yaw = angleLerp(e.yaw, ai.rot, Math.min(1, dt * 10));
      if (ai.t <= 0) {
        ai.claw = 1;
        const inCone = (x, z) => { const ox = x - e.x, oz = z - e.z; return Math.hypot(ox, oz) < 4.6 && Math.abs(angleDiff(Math.atan2(ox, oz), ai.rot)) < 0.6; };
        if (inCone(h[0], h[2])) { hurtHero(28 * run.info.dmgMul, e.x, e.z); run.vel[0] += Math.sin(ai.rot) * 9; run.vel[2] += Math.cos(ai.rot) * 9; }
        enemiesInRadius(e.x, e.z, 4.8, o => { if (!o.boss && inCone(o.x, o.z)) hurtEnemy(o, 20, Math.sin(ai.rot) * 6, Math.cos(ai.rot) * 6, { sound: false }); });
        FX.burst(e.x + Math.sin(ai.rot) * 3, 0.6, e.z + Math.cos(ai.rot) * 3, 10, [1, 0.85, 0.7], 5, 0.1, 0.4, 1);
        G.cam.shake = Math.max(G.cam.shake, 0.12); AUDIO.play('hit', 0.5);
        const dl = Math.hypot(h[0] - e.x, h[2] - e.z) || 1;
        if (--ai.snaps > 0) crabSnapWind(e, ai, (h[0] - e.x) / dl, (h[2] - e.z) / dl, rage);
        else { ai.state = 'walk'; ai.cd = rage ? 1.2 : 2; }
      }
      break;
    case 'aimCannon':
      bossFace(e, dt, 8); e.vx *= 0.8; e.vz *= 0.8;
      if (ai.t <= 0) {
        // a line of shells lands one after another, walking toward the hero and past them
        const n = rage ? 10 : 7, rot = Math.atan2(dx, dz), start = Math.max(2.5, d - 4.5);
        for (let i = 0; i < n; i++) {
          const dist = start + i * 1.7, x = e.x + Math.sin(rot) * dist, z = e.z + Math.cos(rot) * dist;
          if (arenaSd(x, z) > -1) break;
          const dur = 0.85 + i * (rage ? 0.1 : 0.13);
          addTele({ kind: 'circle', x, z, r: 1.3, dur });
          run.eShots.push({ kind: 'cannon', sx: e.x, sy: 2.2, sz: e.z, tx: x, tz: z, x: e.x, y: 2.2, z: e.z, t: 0, dur, radius: 1.3, dmg: 22 * run.info.dmgMul, life: dur + 1, spin: 0, peak: 4 + i * 0.3 });
        }
        FX.smoke(e.x, 2.2, e.z, 1.2, [0.8, 0.8, 0.8], 0.8, 1); AUDIO.play('boom', 0.6); e.squashV -= 3;
        ai.state = 'walk'; ai.cd = rage ? 1.6 : 2.4;
      }
      break;
    case 'bubbles':
      bossFace(e, dt, 6); e.vx *= 0.8; e.vz *= 0.8;
      if (!ai.blown && ai.t <= 0.35) {
        // a slow fan of bubbles that drift after the hero
        ai.blown = true;
        const n = rage ? 11 : 8, base = Math.atan2(dx, dz);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * (1.9 / (n - 1));
          run.eShots.push({ kind: 'bubble', x: e.x + Math.sin(a) * 1.8, y: 1, z: e.z + Math.cos(a) * 1.8, vx: Math.sin(a) * 2.6, vy: 0, vz: Math.cos(a) * 2.6, dmg: 14 * run.info.dmgMul, r: 0.5, life: 6, home: 0.5, ph: rand(0, 10) });
        }
        AUDIO.play('split', 1.4);
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.2 : 2; }
      break;
    case 'scuttleWind':
      e.vx *= 0.7; e.vz *= 0.7; e.phase += dt * 2;
      if (ai.t <= 0) { ai.state = 'scuttle'; ai.t = 15 / 17; ai.hit = false; }
      break;
    case 'scuttle': {
      e.x += Math.sin(ai.rot) * 17 * dt; e.z += Math.cos(ai.rot) * 17 * dt; e.phase += dt * 8;
      const o = { x: e.x, z: e.z };
      if (resolveCircle(o, e.radius)) { e.x = o.x; e.z = o.z; ai.t = 0; G.cam.shake = Math.max(G.cam.shake, 0.15); }
      if (!ai.hit && Math.hypot(h[0] - e.x, h[2] - e.z) < e.radius + HERO_R + 0.4) { ai.hit = true; hurtHero(30 * run.info.dmgMul, e.x, e.z); run.vel[0] += Math.sin(ai.rot) * 10; run.vel[2] += Math.cos(ai.rot) * 10; }
      enemiesInRadius(e.x, e.z, e.radius + 0.4, o2 => { if (!o2.boss) hurtEnemy(o2, 20, Math.sin(ai.rot) * 8, Math.cos(ai.rot) * 8, { sound: false }); });
      if (Math.random() < 0.7) FX.burst(e.x, 0.2, e.z, 3, [0.9, 0.8, 0.6], 3, 0.1, 0.4, 2);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = 1.4; }
      break;
    }
  }
};
function crabSnapWind(e, ai, dx, dz, rage) {
  ai.state = 'snapWind'; ai.t = ai.dur = rage ? 0.65 : 0.8; ai.rot = Math.atan2(dx, dz);
  addTele({ kind: 'cone', x: e.x, z: e.z, r: 4.6, rot: ai.rot, half: 0.58, dur: ai.dur });
}
BOSS_DRAW.crab = function (e) {
  const D = MODELS.defs;
  if (!R.enemyDraw.crab || !R.enemyDraw.crabclaw || !R.enemyDraw.crableg) return;
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, s = e.scale, ai = e.ai, L = R.frame.lightDir;
  const ph = e.phase * TAU, bob = Math.abs(Math.sin(ph)) * 0.04 * s;
  const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw), rx = Math.cos(e.yaw), rz = -Math.sin(e.yaw);
  pushEnemy('crab', false, e.x, bob, e.z, e.yaw, D.crab.clips.still.row, s, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  // three legs a side, stepping in turn
  for (const side of [1, -1]) for (let k = 0; k < 3; k++) {
    const a = e.yaw + side * (Math.PI / 2 + (k - 1) * 0.55), lift = Math.max(0, Math.sin(ph + k * 2.1 + (side > 0 ? 0 : Math.PI))) * 0.1 * s;
    pushEnemy('crableg', false, e.x + Math.sin(a) * 0.42 * s, lift, e.z + Math.cos(a) * 0.42 * s, a + Math.sin(ph + k) * 0.12, D.crableg.clips.still.row, s * 0.9, 1, dead, fl, 0, t[0] * 0.9, t[1] * 0.9, t[2] * 0.9);
  }
  // the claws pull back before a snap and lunge with it
  const back = ai.state === 'snapWind' ? 1 - Math.max(ai.t, 0) / ai.dur : 0, lunge = ai.claw || 0;
  for (const side of [1, -1]) {
    const off = (0.5 - back * 0.25 + lunge * 0.55) * s, x = e.x + fx * off + rx * side * 0.48 * s, z = e.z + fz * off + rz * side * 0.48 * s;
    pushEnemy('crabclaw', false, x, bob, z, e.yaw - side * (0.3 - lunge * 0.25), D.crabclaw.clips.still.row, s * 1.1, 1, dead, fl, 0, t[0], t[1], t[2]);
  }
  if (!e.portrait) pushDecal(e.x - L[0] * 0.4, e.z - L[2] * 0.4, 0.75 * s, 0.6 * s, -e.yaw, 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
};
