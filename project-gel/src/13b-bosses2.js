// ============================================================
// Chapter bosses 11-15: behaviour (BOSS_AI) and drawing (BOSS_DRAW), plus their custom shots (SHOT_DRAW).
// Stats live in BOSS_TYPES (10-data.js). Lobbed shots set lob: true and an optional onLand(s).
// ============================================================

// a boss's shadow on the floor, faded with the boss
function bossShadow(e, a = 0.5) {
  const L = R.frame.lightDir;
  pushDecal(e.x - L[0] * 0.5, e.z - L[2] * 0.5, 0.4 * e.scale, 0.52 * e.scale, -Math.atan2(L[0], L[2]), 1, 0, 0, 0.01, 0.03, 0.07, a);
}
// a point offset in the boss's own frame (x to its left, z ahead), in world space
function bossLocal(e, lx, ly, lz) {
  const c = Math.cos(e.yaw), s = Math.sin(e.yaw), k = e.scale;
  return [e.x + (c * lx + s * lz) * k, ly * k, e.z + (-s * lx + c * lz) * k];
}

// ---------- Pumpkin King (chapter 11): lobs jack-o'-lantern bombs, looses rings of ghosts, and vanishes to pounce from the mist ----------
BOSS_AI.pumpking = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.8; }
  switch (ai.state) {
    case 'walk': {
      e.hidden = false; ai.fade = Math.max(0, (ai.fade || 0) - dt * 3);
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.25 : 1)); bossFace(e, dt);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['pumpkins', 'ghosts', 'haunt'][ai.next++ % 3];
        if (k === 'pumpkins') { ai.state = 'throw'; ai.t = ai.dur = 0.7; ai.volleys = rage ? 2 : 1; }
        else if (k === 'ghosts') { ai.state = 'summon'; ai.t = 0.8; ai.rings = rage ? 3 : 2; ai.spin = rand(0, TAU); }
        else { ai.state = 'vanish'; ai.t = 0.5; ai.pounces = rage ? 2 : 1; }
      }
      break;
    }
    case 'throw': {
      // jack-o'-lantern bombs: one where you are heading, the rest scattered around you
      e.clip = 'throw'; e.clipU = clamp(1 - ai.t / ai.dur, 0, 0.999); e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt);
      if (ai.t <= 0) {
        const n = rage ? 6 : 4, hand = bossLocal(e, -0.3, 1.0, 0.1);
        for (let i = 0; i < n; i++) {
          let tx = h[0] + run.vel[0] * 0.8, tz = h[2] + run.vel[2] * 0.8;
          if (i) { const a = rand(0, TAU), r = rand(2, 5); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
          const o = { x: tx, z: tz }; resolveCircle(o, 0.8);
          const dur = 1.05 + i * 0.07;
          addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.6, dur });
          run.eShots.push({ kind: 'pumpkin', lob: true, sx: hand[0], sy: hand[1], sz: hand[2], tx: o.x, tz: o.z, x: hand[0], y: hand[1], z: hand[2], t: 0, dur, peak: 4, radius: 1.6, dmg: 22 * run.info.dmgMul, life: dur + 0.5, spin: rand(0, TAU), onLand: pumpkinBurst });
        }
        AUDIO.play('throw', 0.8);
        if (--ai.volleys > 0) ai.t = ai.dur = 0.55;
        else { ai.state = 'walk'; ai.cd = rage ? 1.6 : 2.4; }
      }
      break;
    }
    case 'summon': {
      // a ring of ghosts drifts outward; a gap in each ring lets you slip through
      e.clip = 'idle'; e.phase += dt * 2; e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt);
      if (Math.random() < 0.6) FX.part(e.x + rand(-1, 1), rand(0.5, 2.5), e.z + rand(-1, 1), 0, 1, 0, 0.12, 0.05, 0.6, [0.75, 0.5, 1], 1, 1, 0, 0);
      if (ai.t <= 0) {
        const n = rage ? 16 : 12, gap = Math.floor(rand(0, n)), sp = rage ? 5 : 4.2;
        for (let i = 0; i < n; i++) {
          if (i === gap || i === (gap + 1) % n) continue;
          const a = ai.spin + (i / n) * TAU;
          run.eShots.push({ kind: 'ghost', x: e.x + Math.sin(a) * 1.2, y: 1.0, z: e.z + Math.cos(a) * 1.2, vx: Math.sin(a) * sp, vy: 0, vz: Math.cos(a) * sp, dmg: 12 * run.info.dmgMul, r: 0.52, life: 4, ph: rand(0, 10) });
        }
        ai.spin += TAU / n / 2;
        AUDIO.play('zap', 0.5);
        if (--ai.rings > 0) ai.t = 0.7;
        else { ai.state = 'walk'; ai.cd = rage ? 1.6 : 2.2; }
      }
      break;
    }
    case 'vanish':
      // fades into the mist...
      e.clip = 'idle'; e.phase += dt; e.vx *= 0.7; e.vz *= 0.7;
      ai.fade = clamp(1 - ai.t / 0.5, 0, 1);
      if (ai.t <= 0) {
        e.hidden = true; ai.state = 'stalk'; ai.t = rage ? 0.85 : 1.0;
        const o = { x: h[0] + run.vel[0] * 0.5, z: h[2] + run.vel[2] * 0.5 }; resolveCircle(o, e.radius);
        ai.tx = o.x; ai.tz = o.z;
        addTele({ kind: 'circle', x: ai.tx, z: ai.tz, r: 2.6, dur: ai.t });
        FX.smoke(e.x, 1, e.z, 2, [0.5, 0.4, 0.7], 0.8, 1.2);
      }
      break;
    case 'stalk':
      // ...and lands on the marked spot
      ai.fade = 1;
      if (ai.t <= 0) {
        e.x = ai.tx; e.z = ai.tz; e.hidden = false; e.vx = e.vz = 0;
        ai.state = 'pounce'; ai.t = 0.45; ai.fade = 0.6;
        e.yaw = Math.atan2(h[0] - e.x, h[2] - e.z);
        const hd = Math.hypot(h[0] - e.x, h[2] - e.z);
        if (hd < 2.6 + HERO_R * 0.5) { hurtHero(28 * run.info.dmgMul, e.x, e.z); const l = hd || 1; run.vel[0] += (h[0] - e.x) / l * 9; run.vel[2] += (h[2] - e.z) / l * 9; }
        enemiesInRadius(e.x, e.z, 2.6, o => { if (o !== e && !o.boss) hurtEnemy(o, 20, 0, 0, { sound: false }); });
        FX.ring(e.x, e.z, 5.2, [0.7, 0.5, 1], 0.5); FX.burst(e.x, 0.5, e.z, 18, [0.75, 0.55, 1], 6, 0.12, 0.6, 1);
        G.cam.shake = Math.max(G.cam.shake, 0.2); AUDIO.play('boom');
      }
      break;
    case 'pounce':
      e.clip = 'slam'; e.clipU = Math.min(0.999, 0.55 + (0.45 - Math.max(ai.t, 0))); e.vx *= 0.7; e.vz *= 0.7;
      ai.fade = Math.max(0, ai.fade - dt * 3);
      if (ai.t <= 0) {
        if (--ai.pounces > 0) { ai.state = 'vanish'; ai.t = 0.4; }
        else { ai.state = 'walk'; ai.cd = rage ? 1.5 : 2.3; }
      }
      break;
  }
};
function pumpkinBurst(s) {
  FX.burst(s.tx, 0.5, s.tz, 16, [1, 0.6, 0.15], 6, 0.12, 0.6, 0);
  FX.glow(s.tx, 0.6, s.tz, 2.4, [1, 0.6, 0.2], 0.25);
  enemiesInRadius(s.tx, s.tz, s.radius, o => { if (!o.boss) hurtEnemy(o, 18, 0, 0, { sound: false }); });
}
BOSS_DRAW.pumpking = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint;
  const fade = e.portrait || dead ? 0 : clamp(e.ai.fade || 0, 0, 1);
  if (R.enemyDraw.pumpking && fade < 0.97) pushEnemy('pumpking', false, e.x, e.y || 0, e.z, e.yaw, e.portrait ? MODELS.defs.pumpking.clips.idle.row + 2 : enemyRow(e), e.scale, e.squash, dead, fl, 0, t[0], t[1], t[2], fade * 0.9);
  if (e.portrait) return;
  bossShadow(e, 0.5 * (1 - fade));
  // the lantern in its left hand flickers
  if (!dead && fade < 0.6) {
    const p = bossLocal(e, 0.3, 0.2, 0.05), f = 0.7 + 0.3 * Math.sin(G.run.t * 11) * Math.sin(G.run.t * 6.3);
    FX.glow(p[0], p[1], p[2], 1.0, [1, 0.75, 0.3], 0.05, 0.7 * f * (1 - fade));
  }
};
SHOT_DRAW.pumpkin = s => {
  if (R.enemyDraw.pumpkin) pushEnemy('pumpkin', false, s.x, s.y - 0.35, s.z, s.spin, MODELS.defs.pumpkin.clips.still.row, 1.0, 1, 0, 0, 0, 1, 1, 1);
  FX.glow(s.x, s.y, s.z, 0.9, [1, 0.6, 0.2], 0.05, 0.5);
  pushDecal(s.x + 0.15, s.z + 0.1, 0.45, 0.35, 0, 1, 0, 0, 0.01, 0.02, 0.05, 0.4);
};
SHOT_DRAW.ghost = s => {
  const sp = Math.hypot(s.vx, s.vz) || 1;
  pushImp(s.x, s.y + Math.sin(s.ph + s.life * 5) * 0.15, s.z, s.r, s.vx / sp, 0, s.vz / sp, 1, 43, 0, 0.35, s.ph + G.run.t, 1, 0, 0, 0.9);
  pushDecal(s.x + 0.08, s.z + 0.06, s.r * 0.7, s.r * 0.6, 0, 1, 0, 0, 0.05, 0.02, 0.08, 0.25);
};

// ---------- Geode Titan (chapter 12): crystal shard volleys, lines of crystal spikes that stay as walls, and a spinning prism laser ----------
const GEODE = { laneLen: 14, laserLen: 13 };
BOSS_AI.geode = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.6; }
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.25 : 1)); bossFace(e, dt);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['shards', 'spikes', 'laser'][ai.next++ % 3];
        if (k === 'shards') { ai.state = 'throw'; ai.t = ai.dur = 0.6; ai.volleys = rage ? 3 : 2; }
        else if (k === 'spikes') {
          ai.state = 'slamWind'; ai.t = ai.dur = 0.9; ai.lanes = [];
          const base = Math.atan2(dx, dz), n = rage ? 5 : 3, spread = rage ? 0.5 : 0.6;
          for (let i = 0; i < n; i++) { const rot = base + (i - (n - 1) / 2) * spread; ai.lanes.push(rot); addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.8, len: GEODE.laneLen, rot, dur: ai.dur }); }
        } else {
          ai.state = 'laserWind'; ai.t = ai.dur = 0.9; ai.beams = rage ? 3 : 2;
          ai.laserA = Math.atan2(dx, dz) + Math.PI / ai.beams; ai.laserV = (Math.random() < 0.5 ? 1 : -1) * (rage ? 0.75 : 0.6);
          for (let i = 0; i < ai.beams; i++) addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.5, len: GEODE.laserLen, rot: ai.laserA + i * TAU / ai.beams, dur: ai.dur });
        }
      }
      break;
    }
    case 'throw': {
      // a fan of crystal shards; alternate volleys fill the gaps of the one before
      e.clip = 'throw'; e.clipU = clamp(1 - ai.t / ai.dur, 0, 0.999); e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt, 10);
      if (ai.t <= 0) {
        const n = rage ? 9 : 7, base = Math.atan2(dx, dz), fan = 0.95, step = fan / (n - 1), from = bossLocal(e, 0, 0.6, 0.35);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * step + (ai.volleys % 2 ? step / 2 : 0), sp = 9;
          run.eShots.push({ kind: 'shard', x: from[0], y: 0.9, z: from[2], vx: Math.sin(a) * sp, vy: 0, vz: Math.cos(a) * sp, dmg: 13 * run.info.dmgMul, r: 0.42, life: 2.2, ph: rand(0, 10) });
        }
        AUDIO.play('throw', 0.6);
        if (--ai.volleys > 0) ai.t = ai.dur = 0.45;
        else { ai.state = 'walk'; ai.cd = rage ? 1.5 : 2.2; }
      }
      break;
    }
    case 'slamWind':
      e.clip = 'slam'; e.clipU = (1 - ai.t / ai.dur) * 0.6; e.vx *= 0.7; e.vz *= 0.7;
      if (ai.t <= 0) {
        // crystal spikes burst up along each marked line and stand for a few seconds as walls
        ai.state = 'slam'; ai.t = 0.6;
        let hit = false;
        for (const rot of ai.lanes) {
          if (!hit && laneHit(e.x, e.z, rot, GEODE.laneLen, 0.8 + HERO_R * 0.5, h[0], h[2])) {
            hit = true; hurtHero(26 * run.info.dmgMul, e.x, e.z);
            run.vel[0] += Math.cos(rot) * 7 * (Math.random() < 0.5 ? 1 : -1); run.vel[2] -= Math.sin(rot) * 7;
          }
          enemiesInRadius(e.x + Math.sin(rot) * 7, e.z + Math.cos(rot) * 7, 7.5, o => { if (!o.boss && laneHit(e.x, e.z, rot, GEODE.laneLen, 0.9, o.x, o.z)) hurtEnemy(o, 20, 0, 0, { sound: false }); });
          for (let k = 1.8; k < GEODE.laneLen; k += 1.5) {
            const x = e.x + Math.sin(rot) * k, z = e.z + Math.cos(rot) * k;
            if (arenaSd(x, z) < -0.8 && !inRock(x, z) && Math.hypot(x - h[0], z - h[2]) > 1.3) tempProp('crystalspike', x, z, 0.45, rage ? 3.5 : 3);
            if (Math.random() < 0.5) FX.burst(x, 0.4, z, 3, [0.85, 0.6, 1], 4, 0.08, 0.4, 1);
          }
        }
        FX.ring(e.x, e.z, 4, [0.8, 0.6, 1], 0.5); FX.crack(e.x, e.z, 3, 1.6);
        G.cam.shake = Math.max(G.cam.shake, 0.25); AUDIO.play('boom');
      }
      break;
    case 'slam':
      e.clip = 'slam'; e.clipU = Math.min(0.999, 0.6 + (0.6 - Math.max(ai.t, 0)) * 0.66);
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.2; }
      break;
    case 'laserWind':
      e.clip = 'idle'; e.phase += dt; e.vx *= 0.7; e.vz *= 0.7;
      e.yaw = angleLerp(e.yaw, ai.laserA, Math.min(1, dt * 8));
      if (ai.t <= 0) { ai.state = 'laser'; ai.t = rage ? 3.4 : 2.8; ai.tick = 0; AUDIO.play('zap'); }
      break;
    case 'laser': {
      // the heart-stone fires beams that sweep slowly around it
      e.clip = 'idle'; e.phase += dt * 2; e.vx *= 0.7; e.vz *= 0.7;
      ai.laserA += ai.laserV * dt; e.yaw = ai.laserA;
      ai.tick -= dt;
      for (let i = 0; i < ai.beams; i++) {
        const rot = ai.laserA + i * TAU / ai.beams;
        if (ai.tick <= 0 && laneHit(e.x, e.z, rot, GEODE.laserLen, 0.45 + HERO_R * 0.5, h[0], h[2])) { ai.tick = 0.3; hurtHero(9 * run.info.dmgMul, e.x, e.z); }
        if (Math.random() < 0.5) FX.burst(e.x + Math.sin(rot) * GEODE.laserLen, 0.3, e.z + Math.cos(rot) * GEODE.laserLen, 1, [1, 0.6, 1], 2, 0.06, 0.3, 1);
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.2; }
      break;
    }
  }
};
BOSS_DRAW.geode = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, ai = e.ai;
  if (R.enemyDraw.geode) pushEnemy('geode', false, e.x, e.y || 0, e.z, e.yaw, e.portrait ? MODELS.defs.geode.clips.idle.row + 2 : enemyRow(e), e.scale, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  if (e.portrait) return;
  bossShadow(e);
  if (dead) return;
  const heart = bossLocal(e, 0, 0.66, 0.3);
  FX.glow(heart[0], heart[1], heart[2], ai.state === 'laser' || ai.state === 'laserWind' ? 1.6 : 0.9, [0.6, 0.95, 1], 0.05, 0.55);
  if (ai.state === 'laser') {
    for (let i = 0; i < ai.beams; i++) {
      const rot = ai.laserA + i * TAU / ai.beams, ex = e.x + Math.sin(rot) * GEODE.laserLen, ez = e.z + Math.cos(rot) * GEODE.laserLen;
      const pts = [heart[0], heart[1], heart[2], e.x + Math.sin(rot) * 2.2, 0.5, e.z + Math.cos(rot) * 2.2, ex, 0.35, ez];
      R.ribStrip(pts, 3, 0.16, [1, 0.85, 1, 1], 0);
      R.ribStrip(pts, 3, 0.6, [0.85, 0.4, 1, 0.4], 0);
    }
  }
};
SHOT_DRAW.shard = s => {
  pushImp(s.x, s.y, s.z, s.r, 0, 0, 1, 1, 44, 0, 0.35, s.ph + G.run.t * 3, 0, 2, 0, 1);
  pushDecal(s.x + 0.08, s.z + 0.06, s.r * 0.6, s.r * 0.6, 0, 1, 0, 0, 0.02, 0.0, 0.06, 0.3);
};

// ---------- Storm King (chapter 13): a floating thundercloud that calls down lightning, blasts gusts of wind and spins up twisters ----------
const STORM = { gustLen: 16, gustW: 2.2, floatY: 1.5 };
// a jagged bolt from the sky (or the cloud) to the ground, drawn for a few frames
function stormBolt(x0, y0, z0, x1, z1) {
  const pts = [], n = 7;
  for (let i = 0; i <= n; i++) {
    const u = i / n, j = i && i < n ? 0.45 : 0;
    pts.push(lerp(x0, x1, u) + rand(-j, j), lerp(y0, 0.1, u), lerp(z0, z1, u) + rand(-j, j));
  }
  G.run.stormBolts = G.run.stormBolts || [];
  G.run.stormBolts.push({ pts, t: 0 });
}
BOSS_AI.storm = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.6; ai.twisters = []; }
  // it floats, bobbing gently
  e.y = lerp(e.y || 0, STORM.floatY + Math.sin(run.t * 1.7) * 0.2, Math.min(1, dt * 3));
  run.stormBolts = (run.stormBolts || []).filter(b => (b.t += dt) < 0.18);
  // its twisters chase you for a while
  for (const w of ai.twisters || []) {
    w.t += dt;
    const tx = h[0] - w.x, tz = h[2] - w.z, tl = Math.hypot(tx, tz) || 1, sp = rage ? 3.2 : 2.7;
    w.vx += (tx / tl * sp - w.vx) * Math.min(1, dt * 1.5); w.vz += (tz / tl * sp - w.vz) * Math.min(1, dt * 1.5);
    w.x += w.vx * dt; w.z += w.vz * dt; resolveCircle(w, 0.6);
    w.tick -= dt;
    if (tl < 1.1 + HERO_R * 0.5 && w.tick <= 0) { w.tick = 0.5; hurtHero(12 * run.info.dmgMul, w.x, w.z); }
    if (tl < 3) { run.vel[0] -= tx / tl * 5 * dt * (3 - tl); run.vel[2] -= tz / tl * 5 * dt * (3 - tl); }
    enemiesInRadius(w.x, w.z, 1.2, o => { if (!o.boss) { o.kx += (Math.random() - 0.5) * 6; o.kz += (Math.random() - 0.5) * 6; } });
    if (Math.random() < 0.5) FX.smoke(w.x + rand(-0.5, 0.5), 0.2, w.z + rand(-0.5, 0.5), 0.6, [0.9, 0.93, 1], 0.5, 0.8);
  }
  if (ai.twisters) ai.twisters = ai.twisters.filter(w => w.t < w.life);
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.25 : 1)); bossFace(e, dt);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['lightning', 'gust', 'twister'][ai.next++ % 3];
        if (k === 'lightning') { ai.state = 'charge'; ai.t = 0.6; ai.strikes = []; ai.waves = rage ? 3 : 2; }
        else if (k === 'gust') {
          ai.state = 'gustWind'; ai.t = ai.dur = 0.9; ai.rot = Math.atan2(dx, dz);
          ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: STORM.gustW, len: STORM.gustLen, rot: ai.rot, dur: ai.dur });
        } else { ai.state = 'brew'; ai.t = 0.8; }
      }
      break;
    }
    case 'charge':
      // rumbles, flickering inside, then marks where the bolts will fall
      e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt);
      if (ai.t <= 0) {
        const n = rage ? 9 : 6;
        for (let i = 0; i < n; i++) {
          let tx = h[0] + run.vel[0] * 0.7, tz = h[2] + run.vel[2] * 0.7;
          if (i) { const a = rand(0, TAU), r = rand(1.6, 5.5); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
          const o = { x: tx, z: tz }; resolveCircle(o, 0.5);
          const dur = 0.95 + i * 0.06;
          addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.4, dur });
          ai.strikes.push({ x: o.x, z: o.z, t: dur });
        }
        AUDIO.play('zap', 0.6);
        ai.state = 'strike'; ai.t = 1.6;
      }
      break;
    case 'strike':
      e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt);
      for (const s of ai.strikes) {
        s.t -= dt;
        if (s.t <= 0 && !s.done) {
          s.done = true;
          stormBolt(s.x + rand(-1, 1), 12, s.z + rand(-1, 1), s.x, s.z);
          if (Math.hypot(h[0] - s.x, h[2] - s.z) < 1.4 + HERO_R * 0.5) hurtHero(22 * run.info.dmgMul, s.x, s.z);
          enemiesInRadius(s.x, s.z, 1.4, o => { if (!o.boss) hurtEnemy(o, 20, 0, 0, { sound: false }); });
          FX.glow(s.x, 0.5, s.z, 2.6, [1, 0.95, 0.6], 0.2); FX.burst(s.x, 0.3, s.z, 10, [1, 0.95, 0.6], 5, 0.08, 0.35, 1);
          FX.crack(s.x, s.z, 1.2);
          G.cam.shake = Math.max(G.cam.shake, 0.08); AUDIO.play('hit', 0.6);
        }
      }
      if (ai.strikes.every(s => s.done)) {
        if (--ai.waves > 0) { ai.state = 'charge'; ai.t = 0.35; ai.strikes = []; }
        else { ai.state = 'walk'; ai.cd = rage ? 1.5 : 2.2; }
      }
      break;
    case 'gustWind':
      // it puffs up, aiming along the marked lane
      e.vx *= 0.7; e.vz *= 0.7;
      e.yaw = angleLerp(e.yaw, ai.rot, Math.min(1, dt * 8)); e.squash = 1 + 0.15 * (1 - ai.t / ai.dur);
      if (ai.t <= 0) {
        ai.state = 'gust'; ai.t = 0.5; e.squash = 0.85;
        const fx = Math.sin(ai.rot), fz = Math.cos(ai.rot);
        if (laneHit(e.x, e.z, ai.rot, STORM.gustLen, STORM.gustW + HERO_R * 0.5, h[0], h[2])) { hurtHero(14 * run.info.dmgMul, e.x, e.z); run.vel[0] += fx * 16; run.vel[2] += fz * 16; }
        enemiesInRadius(e.x + fx * 8, e.z + fz * 8, 9, o => { if (!o.boss && laneHit(e.x, e.z, ai.rot, STORM.gustLen, STORM.gustW, o.x, o.z)) { o.kx += fx * 14 / o.mass; o.kz += fz * 14 / o.mass; } });
        for (let i = 0; i < 26; i++) {
          const along = rand(1, STORM.gustLen), side = rand(-STORM.gustW, STORM.gustW);
          FX.part(e.x + fx * along + fz * side, rand(0.3, 1.6), e.z + fz * along - fx * side, fx * 16, 0, fz * 16, 0.12, 0.02, 0.4, [0.92, 0.96, 1], 0.9, 1, 0, 0);
        }
        AUDIO.play('throw', 0.8);
      }
      break;
    case 'gust':
      e.squash = lerp(e.squash, 1, Math.min(1, dt * 6));
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.1; e.squash = 1; }
      break;
    case 'brew':
      // spins up twisters that drop out of the cloud and chase you
      e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt);
      if (Math.random() < 0.5) FX.smoke(e.x + rand(-1, 1), 1, e.z + rand(-1, 1), 0.8, [0.85, 0.9, 1], 0.6, -0.5);
      if (ai.t <= 0) {
        const n = rage ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const a = Math.atan2(dx, dz) + (i - (n - 1) / 2) * 0.9;
          ai.twisters.push({ x: e.x + Math.sin(a) * 2, z: e.z + Math.cos(a) * 2, vx: Math.sin(a) * 3, vz: Math.cos(a) * 3, t: 0, life: rage ? 6 : 5, tick: 0, ph: rand(0, 10) });
        }
        AUDIO.play('throw', 0.6);
        ai.state = 'walk'; ai.cd = rage ? 1.8 : 2.6;
      }
      break;
  }
};
BOSS_DRAW.storm = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, ai = e.ai;
  const charging = ai.state === 'charge' || ai.state === 'strike';
  // a cloud has no back: its face stays turned to the camera, leaning a little toward its target
  const yaw = e.portrait ? 0.3 : clamp(angleDiff(0, e.yaw), -0.6, 0.6);
  if (R.enemyDraw.stormcloud) pushEnemy('stormcloud', false, e.x, (e.y || 0) - dead * 1.2, e.z, yaw, MODELS.defs.stormcloud.clips.still.row, e.scale, e.squash, dead, Math.max(fl, charging && Math.random() < 0.15 ? 0.6 : 0), 0, t[0], t[1], t[2]);
  if (e.portrait) return;
  bossShadow(e, 0.4);
  if (dead) return;
  // rain falling from its belly, and flashes inside it while it charges
  if (Math.random() < 0.7) { const a = rand(0, TAU), r = rand(0, 1.4); FX.part(e.x + Math.cos(a) * r, (e.y || 0) + 0.4, e.z + Math.sin(a) * r, 0, -9, 0, 0.05, 0.02, 0.25, [0.7, 0.8, 1], 0.7, 1, 0, 0); }
  if (charging && Math.random() < 0.3) FX.glow(e.x + rand(-1, 1), (e.y || 0) + 1.4, e.z + rand(-1, 1), 2, [1, 0.95, 0.7], 0.08, 0.7);
  for (const w of ai.twisters || []) {
    const grow = Math.min(1, w.t / 0.4) * Math.min(1, (w.life - w.t) / 0.4), sc = 1.15 * grow;
    pushImp(w.x, sc * 1.05, w.z, sc, 0, 0, 1, 1, 32, 0, 0.1, w.t * 1.8 + w.ph, 1, 0, 0, 0.7);
    pushDecal(w.x, w.z, 1.1 * grow, 1.1 * grow, w.t * 3, 3, 0, 0.5, 0.75, 0.85, 1, 0.35 * grow, true);
  }
  for (const b of G.run.stormBolts || []) {
    const n = b.pts.length / 3, a = 1 - b.t / 0.18;
    R.ribStrip(b.pts, n, 0.12, [1, 1, 0.85, a], 0);
    R.ribStrip(b.pts, n, 0.5, [1, 0.9, 0.5, 0.4 * a], 0);
  }
};

// ---------- Jack-in-the-Box (chapter 14): hops after you, punches its head out on the spring, pounces, and tosses toy blocks that stay as walls ----------
const JACK = { reach: 9, top: 1.0 };
BOSS_AI.jack = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e), s = e.scale, k = Math.min(1, dt * 8);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.6; ai.ext = 0.55; ai.hop = 0; ai.out = 0; }
  ai.wob = (ai.wob || 0) + dt;
  switch (ai.state) {
    case 'walk': {
      // hops along on the box, its head bobbing on the spring
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.25 : 1)); bossFace(e, dt);
      ai.hop += dt * 5.5;
      e.y = Math.abs(Math.sin(ai.hop)) * 0.3 * s;
      ai.ext = lerp(ai.ext, 0.55 + 0.12 * Math.sin(ai.wob * 4), k); ai.out = 0;
      ai.cd -= dt;
      if (ai.cd <= 0) {
        e.y = 0;
        const kind = ['punch', 'pounce', 'toys'][ai.next++ % 3];
        if (kind === 'punch') { ai.punches = rage ? 3 : 2; jackAim(e, ai, 0.75); }
        else if (kind === 'pounce') { ai.state = 'crouch'; ai.t = 0.5; ai.jumps = rage ? 3 : 2; }
        else { ai.state = 'open'; ai.t = 0.6; ai.volleys = rage ? 2 : 1; }
      }
      break;
    }
    case 'aim':
      // the head winds down into the box, tracking you for a moment, then locks on
      e.vx *= 0.7; e.vz *= 0.7; e.y = 0;
      if (ai.t > 0.3) { ai.rot = turnToward(ai.rot, Math.atan2(dx, dz), dt * 2.2); ai.tele.rot = ai.rot; ai.tele.x = e.x; ai.tele.z = e.z; }
      e.yaw = angleLerp(e.yaw, ai.rot, k); ai.ext = lerp(ai.ext, 0.15, k);
      if (ai.t <= 0) { ai.state = 'punch'; ai.t = ai.dur = 0.55; ai.hit = false; ai.hits = new Set(); AUDIO.play('throw'); }
      break;
    case 'punch': {
      // BOING: out fast along the lane, back slowly
      const u = 1 - Math.max(ai.t, 0) / ai.dur, reach = u < 0.25 ? u / 0.25 : 1 - (u - 0.25) / 0.75;
      ai.out = reach * JACK.reach;
      if (u < 0.3) {
        if (!ai.hit && laneHit(e.x, e.z, ai.rot, ai.out, 1.0 + HERO_R * 0.5, h[0], h[2])) {
          ai.hit = true; hurtHero(26 * run.info.dmgMul, e.x, e.z); run.vel[0] += Math.sin(ai.rot) * 12; run.vel[2] += Math.cos(ai.rot) * 12;
        }
        enemiesInRadius(e.x + Math.sin(ai.rot) * ai.out, e.z + Math.cos(ai.rot) * ai.out, 1.2, o => { if (!o.boss && !ai.hits.has(o)) { ai.hits.add(o); hurtEnemy(o, 20, Math.sin(ai.rot) * 8, Math.cos(ai.rot) * 8, { sound: false }); } });
      }
      if (ai.t <= 0) {
        ai.out = 0;
        if (--ai.punches > 0) jackAim(e, ai, 0.5);
        else { ai.state = 'walk'; ai.cd = rage ? 1.5 : 2.2; }
      }
      break;
    }
    case 'crouch':
      // squashes down on its springs, then leaps at you
      e.vx *= 0.7; e.vz *= 0.7; bossFace(e, dt);
      e.squash = 1 - 0.25 * (1 - Math.max(ai.t, 0) / 0.5); ai.ext = lerp(ai.ext, 0.2, k);
      if (ai.t <= 0) {
        const o = { x: h[0] + run.vel[0] * 0.6, z: h[2] + run.vel[2] * 0.6 }; resolveCircle(o, e.radius);
        ai.sx = e.x; ai.sz = e.z; ai.tx = o.x; ai.tz = o.z;
        addTele({ kind: 'circle', x: o.x, z: o.z, r: 2.4, dur: 0.8 });
        ai.state = 'leap'; ai.t = ai.dur = 0.8; e.hidden = true; e.squash = 1.15; AUDIO.play('throw', 0.8);
      }
      break;
    case 'leap': {
      const u = 1 - Math.max(ai.t, 0) / ai.dur;
      e.x = lerp(ai.sx, ai.tx, u); e.z = lerp(ai.sz, ai.tz, u); e.y = Math.sin(u * Math.PI) * 4.2;
      ai.ext = lerp(ai.ext, 0.9, k);
      if (ai.t <= 0) {
        e.y = 0; e.hidden = false; e.squash = 0.7; e.vx = e.vz = 0;
        const hd = Math.hypot(h[0] - e.x, h[2] - e.z);
        if (hd < 2.4 + HERO_R * 0.5) { hurtHero(28 * run.info.dmgMul, e.x, e.z); const l = hd || 1; run.vel[0] += (h[0] - e.x) / l * 10; run.vel[2] += (h[2] - e.z) / l * 10; }
        enemiesInRadius(e.x, e.z, 2.4, o => { if (o !== e && !o.boss) hurtEnemy(o, 20, 0, 0, { sound: false }); });
        FX.ring(e.x, e.z, 5, [1, 0.8, 0.5], 0.5); FX.burst(e.x, 0.3, e.z, 16, [1, 0.85, 0.4], 6, 0.12, 0.5, 1);
        G.cam.shake = Math.max(G.cam.shake, 0.22); AUDIO.play('boom');
        if (--ai.jumps > 0) { ai.state = 'crouch'; ai.t = 0.35; }
        else { ai.state = 'walk'; ai.cd = rage ? 1.5 : 2.3; }
      }
      break;
    }
    case 'open':
      // pops right up and flings toy blocks that land as walls
      e.vx *= 0.7; e.vz *= 0.7; bossFace(e, dt); e.y = 0;
      ai.ext = lerp(ai.ext, 1.05, k);
      if (ai.t <= 0) {
        const n = rage ? 8 : 6, from = [e.x, (JACK.top + 1) * s, e.z];
        for (let i = 0; i < n; i++) {
          let tx = h[0] + run.vel[0] * 0.8, tz = h[2] + run.vel[2] * 0.8;
          if (i) { const a = rand(0, TAU), r = rand(1.8, 5.5); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
          const o = { x: tx, z: tz }; resolveCircle(o, 0.7);
          const dur = 1.0 + i * 0.06;
          addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.1, dur });
          run.eShots.push({ kind: 'block', lob: true, sx: from[0], sy: from[1], sz: from[2], tx: o.x, tz: o.z, x: from[0], y: from[1], z: from[2], t: 0, dur, peak: 3.5, radius: 1.1, dmg: 20 * run.info.dmgMul, life: dur + 0.5, spin: rand(0, TAU), tint: hexToRgb(pick(PROP_KINDS.toyblock.tints)), onLand: blockLand });
        }
        AUDIO.play('throw', 0.8);
        if (--ai.volleys > 0) ai.t = 0.6;
        else { ai.state = 'walk'; ai.cd = rage ? 1.6 : 2.4; }
      }
      break;
  }
};
function jackAim(e, ai, t) {
  const h = G.hero.pos;
  ai.state = 'aim'; ai.t = t; ai.rot = Math.atan2(h[0] - e.x, h[2] - e.z);
  ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: 1.0, len: JACK.reach, rot: ai.rot, dur: t });
}
function blockLand(s) {
  // the block stays where it lands as a short-lived wall (unless it landed on you)
  if (Math.hypot(G.hero.pos[0] - s.tx, G.hero.pos[2] - s.tz) > 1.2) { const o = tempProp('toyblock', s.tx, s.tz, 0.55, 4); o.tint = s.tint; o.yaw = s.spin; }
  enemiesInRadius(s.tx, s.tz, s.radius, o => { if (!o.boss) hurtEnemy(o, 16, 0, 0, { sound: false }); });
}
// points along a coil spring from a to b
function springPts(a, b, rad, turns, n) {
  const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], l = Math.hypot(ax, ay, az) || 1;
  const fx = ax / l, fy = ay / l, fz = az / l;
  // two directions across the spring's axis
  let ux = -fz, uy = 0, uz = fx; if (Math.hypot(ux, uz) < 0.1) { ux = 1; uy = 0; uz = 0; }
  const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
  const vx = fy * uz - fz * uy, vy = fz * ux - fx * uz, vz = fx * uy - fy * ux;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a2 = u * turns * TAU, c = Math.cos(a2) * rad, sn = Math.sin(a2) * rad;
    pts.push(a[0] + ax * u + ux * c + vx * sn, a[1] + ay * u + uy * c + vy * sn, a[2] + az * u + uz * c + vz * sn);
  }
  return pts;
}
BOSS_DRAW.jack = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, ai = e.ai, s = e.scale, y0 = e.y || 0;
  if (R.enemyDraw.jackbox) pushEnemy('jackbox', false, e.x, y0, e.z, e.yaw, MODELS.defs.jackbox.clips.still.row, s, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  const top = [e.x, y0 + JACK.top * s * (e.squash || 1), e.z];
  let hp;
  if (ai.out > 0.05) hp = [e.x + Math.sin(ai.rot) * ai.out, top[1] + 0.1 * s, e.z + Math.cos(ai.rot) * ai.out];
  else {
    const ext = (e.portrait ? 0.12 : (ai.ext ?? 0.55) * (1 - dead)) * s, sway = e.portrait ? 0 : Math.sin((ai.wob || 0) * 3) * 0.08 * s;
    hp = [top[0] + Math.cos(e.yaw) * sway, top[1] + ext, top[2] - Math.sin(e.yaw) * sway];
  }
  if (R.enemyDraw.jackhead) pushEnemy('jackhead', false, hp[0], hp[1], hp[2], e.yaw, MODELS.defs.jackhead.clips.still.row, s * 0.85, 1, dead, fl, 0, 1, 1, 1);
  if (e.portrait) return;
  if (Math.hypot(hp[0] - top[0], hp[1] - top[1], hp[2] - top[2]) > 0.2) R.ribStrip(springPts(top, hp, 0.17 * s, 7, 42), 43, 0.045 * s, [0.75, 0.78, 0.86, 1], 1, 0, 1);
  bossShadow(e, 0.5 * (1 - clamp(y0 / 5, 0, 0.6)));
  if (ai.out > 0.05) pushDecal(hp[0], hp[2], 0.5 * s * 0.4, 0.5 * s * 0.4, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.4);
};
SHOT_DRAW.block = s => {
  if (R.enemyDraw.toyblock) pushEnemy('toyblock', false, s.x, s.y - 0.4, s.z, s.spin, MODELS.defs.toyblock.clips.still.row, 1.1, 1, 0, 0, 0, s.tint[0], s.tint[1], s.tint[2]);
  pushDecal(s.x + 0.15, s.z + 0.1, 0.45, 0.4, 0, 1, 0, 0, 0.01, 0.02, 0.05, 0.4);
};

// ---------- Kraken (chapter 15): tentacle slams along marked lanes, ink blobs that leave slowing puddles, and a whirlpool that drags you in ----------
const KRAKEN = { slamLen: 11, whirlR: 8, core: 2.8 };
BOSS_AI.kraken = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.state === 'walk' && ai.next === undefined) { ai.next = 0; ai.cd = 1.6; ai.slams = []; ai.spin = 0; }
  ai.wave = (ai.wave || 0) + dt;
  // slammed tentacles lie on the floor for a moment, then lift away
  for (const s of ai.slams || []) s.t += dt;
  if (ai.slams) ai.slams = ai.slams.filter(s => s.t < s.dur + 0.7);
  switch (ai.state) {
    case 'walk': {
      bossWalk(e, dt, h[0], h[2], e.speed * (rage ? 1.3 : 1)); bossFace(e, dt);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['slam', 'ink', 'whirl'][ai.next++ % 3];
        if (k === 'slam') {
          ai.state = 'raise'; ai.slamHit = false;
          const base = Math.atan2(dx, dz), n = rage ? 5 : 3;
          for (let i = 0; i < n; i++) {
            const rot = base + (i - (n - 1) / 2) * 0.55 + rand(-0.08, 0.08), dur = 0.85 + i * 0.12;
            ai.slams.push({ rot, t: 0, dur, hit: false, ph: rand(0, 10) });
            addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.9, len: KRAKEN.slamLen, rot, dur });
          }
        } else if (k === 'ink') { ai.state = 'ink'; ai.t = 0.55; ai.volleys = rage ? 2 : 1; }
        else { ai.state = 'whirlWind'; ai.t = 0.8; addTele({ kind: 'circle', x: e.x, z: e.z, r: KRAKEN.core, dur: 0.8 }); }
      }
      break;
    }
    case 'raise':
      // the tentacles rear up over their lanes, then crash down one after another
      e.vx *= 0.7; e.vz *= 0.7;
      for (const s of ai.slams) {
        if (s.hit || s.t < s.dur) continue;
        s.hit = true;
        if (!ai.slamHit && laneHit(e.x, e.z, s.rot, KRAKEN.slamLen, 0.9 + HERO_R * 0.5, h[0], h[2])) { ai.slamHit = true; hurtHero(26 * run.info.dmgMul, e.x, e.z); }
        enemiesInRadius(e.x + Math.sin(s.rot) * 5.5, e.z + Math.cos(s.rot) * 5.5, 6.5, o => { if (!o.boss && laneHit(e.x, e.z, s.rot, KRAKEN.slamLen, 1, o.x, o.z)) hurtEnemy(o, 20, 0, 0, { sound: false }); });
        for (let k = 2; k < KRAKEN.slamLen; k += 1.8) FX.burst(e.x + Math.sin(s.rot) * k, 0.3, e.z + Math.cos(s.rot) * k, 4, [0.7, 0.9, 1], 4, 0.09, 0.45, 1);
        G.cam.shake = Math.max(G.cam.shake, 0.15); AUDIO.play('boom', 0.7);
      }
      if (ai.slams.every(s => s.hit)) { ai.state = 'walk'; ai.cd = rage ? 1.4 : 2.2; }
      break;
    case 'ink':
      // spits ink blobs that splash into dark, sticky puddles
      e.vx *= 0.7; e.vz *= 0.7; bossFace(e, dt);
      if (ai.t <= 0) {
        const n = rage ? 6 : 4, from = bossLocal(e, 0, 0.4, 0.5);
        for (let i = 0; i < n; i++) {
          let tx = h[0] + run.vel[0] * 0.8, tz = h[2] + run.vel[2] * 0.8;
          if (i) { const a = rand(0, TAU), r = rand(2, 5.5); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
          const o = { x: tx, z: tz }; resolveCircle(o, 0.8);
          const dur = 1.0 + i * 0.07;
          addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.6, dur });
          run.eShots.push({ kind: 'ink', lob: true, sx: from[0], sy: from[1], sz: from[2], tx: o.x, tz: o.z, x: from[0], y: from[1], z: from[2], t: 0, dur, peak: 4, radius: 1.6, dmg: 18 * run.info.dmgMul, life: dur + 0.5, spin: 0, onLand: inkLand });
        }
        AUDIO.play('throw', 0.7);
        if (--ai.volleys > 0) ai.t = 0.5;
        else { ai.state = 'walk'; ai.cd = rage ? 1.6 : 2.4; }
      }
      break;
    case 'whirlWind':
      e.vx *= 0.7; e.vz *= 0.7; ai.spin += dt * 2;
      if (ai.t <= 0) { ai.state = 'whirl'; ai.t = rage ? 3.6 : 3.0; ai.tick = 0; AUDIO.play('zap', 0.6); }
      break;
    case 'whirl': {
      // spins in place: the water swirls round and in, dragging you toward its whirling core
      e.vx *= 0.7; e.vz *= 0.7; ai.spin += dt * 4;
      const ox = e.x - h[0], oz = e.z - h[2], od = Math.hypot(ox, oz) || 1;
      if (od < KRAKEN.whirlR) {
        const pull = (rage ? 2.8 : 2.2) * dt * (0.4 + 0.6 * (1 - od / KRAKEN.whirlR)), swirl = 1.3 * dt;
        h[0] += ox / od * Math.min(pull, od) - oz / od * swirl; h[2] += oz / od * Math.min(pull, od) + ox / od * swirl;
      }
      ai.tick -= dt;
      if (od < KRAKEN.core + HERO_R * 0.5 && ai.tick <= 0) { ai.tick = 0.4; hurtHero(14 * run.info.dmgMul, e.x, e.z); }
      enemiesInRadius(e.x, e.z, KRAKEN.whirlR, o => { if (o === e || o.boss) return; const qx = e.x - o.x, qz = e.z - o.z, ql = Math.hypot(qx, qz) || 1; o.kx += (qx / ql * 3 - qz / ql * 2) * dt * 4; o.kz += (qz / ql * 3 + qx / ql * 2) * dt * 4; });
      if (Math.random() < 0.8) { const a = rand(0, TAU), r = rand(2, KRAKEN.whirlR); FX.part(e.x + Math.cos(a) * r, 0.15, e.z + Math.sin(a) * r, -Math.sin(a) * 5 - Math.cos(a) * 2, 0.2, Math.cos(a) * 5 - Math.sin(a) * 2, 0.1, 0.03, 0.6, [0.75, 0.92, 1], 0.8, 1, 0, 0); }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.5 : 2.3; }
      break;
    }
  }
};
function inkLand(s) {
  tempZone('ink', s.tx, s.tz, 2.0, 5);
  FX.burst(s.tx, 0.4, s.tz, 12, [0.15, 0.1, 0.22], 4, 0.12, 0.5, 2);
}
// a tentacle as points: from (x0, y0, z0) out along angle a; lift raises it into an arch, curl coils the tip
function tentaclePts(x0, y0, z0, a, len, lift, wav, ph, n = 10) {
  const pts = [], sx = Math.sin(a), cz = Math.cos(a);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), dist = u * len, wig = Math.sin(u * 5 + ph) * wav * u;
    pts.push(x0 + sx * dist + cz * wig, Math.max(0.12, y0 * (1 - u) + lift * Math.sin(u * Math.PI * 0.9) + 0.12), z0 + cz * dist - sx * wig);
  }
  return pts;
}
BOSS_DRAW.kraken = function (e) {
  const dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, ai = e.ai, s = e.scale;
  if (R.enemyDraw.kraken) pushEnemy('kraken', false, e.x, e.y || 0, e.z, e.yaw, MODELS.defs.kraken.clips.still.row, s, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  if (e.portrait) return;
  bossShadow(e, 0.45);
  const col = [t[0] * (1 - fl) + fl, t[1] * (1 - fl) + fl, t[2] * (1 - fl) + fl, 1], wide = u => 1 - u * 0.8, tw = 0.26 * s;
  // the resting arms sprawl around it, curling; while it whirls they sweep round
  const spin = ai.state === 'whirl' || ai.state === 'whirlWind' ? ai.spin : 0, wave = ai.wave || 0;
  for (let i = 0; i < 8; i++) {
    const a = e.yaw + (i + 0.5) / 8 * TAU + spin, bx = e.x + Math.sin(a) * 0.55 * s, bz = e.z + Math.cos(a) * 0.55 * s;
    const len = (1.0 + 0.15 * Math.sin(wave * 1.3 + i)) * s * (1 - dead * 0.6);
    R.ribStrip(tentaclePts(bx, 0.15 * s, bz, a + (spin ? 0.6 : 0), len, 0.12 * s, 0.35 * s, wave * 2.2 + i * 1.7), 10, tw * 0.75, col, 1, 0, 1, wide);
  }
  // slam tentacles: rear up over the lane, then lie along it
  for (const sl of ai.slams || []) {
    const bx = e.x + Math.sin(sl.rot) * 0.6 * s, bz = e.z + Math.cos(sl.rot) * 0.6 * s;
    let len, lift;
    if (sl.t < sl.dur) { const u = sl.t / sl.dur; len = KRAKEN.slamLen * (0.35 + 0.15 * u); lift = 3.5 + 2 * u; }
    else { const u = clamp((sl.t - sl.dur) / 0.7, 0, 1); len = KRAKEN.slamLen * (1 - 0.6 * u * u); lift = 0.2 + u * u * 2.5; }
    R.ribStrip(tentaclePts(bx, 0.3 * s, bz, sl.rot, len, lift, 0.25, sl.ph, 12), 12, tw, col, 1, 0, 1, wide);
  }
  if (ai.state === 'whirl') pushDecal(e.x, e.z, KRAKEN.whirlR, KRAKEN.whirlR, -ai.spin, 3, 0, 0.5, 0.6, 0.85, 1, 0.3, true);
};
SHOT_DRAW.ink = s => {
  pushImp(s.x, s.y, s.z, 0.42, 0, 0, 1, 1, 27, 0, 0, s.t * 4, 1, 0, 0, 1);
  pushDecal(s.x + 0.15, s.z + 0.1, 0.45, 0.35, 0, 1, 0, 0, 0.02, 0.02, 0.06, 0.45);
};

// the cloudlings' sparks
SHOT_DRAW.spark = s => {
  pushImp(s.x, s.y, s.z, 0.2, 0, 0, 1, 1, 15, 0, 0.8, s.ph + G.run.t * 3, 0, 0, 0, 1);
  FX.glow(s.x, s.y, s.z, 0.6, [1, 0.95, 0.5], 0.05, 0.6);
};
