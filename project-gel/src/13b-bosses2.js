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
