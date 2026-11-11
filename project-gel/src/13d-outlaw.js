// ============================================================
// The Outlaw (chapter 10): a gunfighter who keeps his distance and circles you. He fans the hammer (a cone of
// bullets sweeping across, two or three volleys), lobs bundles of dynamite at marked spots, and whistles up a
// bison stampede that thunders north or south along marked lanes (down Main Street in his town). Hay and wagons stop bullets.
// Stage 2: a third volley, wider fans, more dynamite, and stampedes from both sides at once.
// ============================================================
const OUTLAW = { spread: 0.95, bulletV: 12, laneLen: 34, laneW: 1.15, herdV: 20 };
// where his guns are (right hand, or left with side = 1), roughly, in world space
function outlawGun(e, side, out) {
  const s = e.scale, c = Math.cos(e.yaw), sn = Math.sin(e.yaw), lx = (side ? 0.27 : -0.27) * s, lz = 0.55 * s;
  out[0] = e.x + c * lx + sn * lz; out[1] = 0.74 * s; out[2] = e.z - sn * lx + c * lz;
  return out;
}
const _gun = [0, 0, 0];
BOSS_AI.outlaw = function (e, dt, d, dx, dz) {
  const ai = e.ai, h = G.hero.pos, run = G.run, rage = isRage(e);
  if (ai.next === undefined) { ai.next = 0; ai.cd = 1.4; ai.herd = []; ai.strafe = 1; }
  updateHerd(e, ai, dt);
  switch (ai.state) {
    case 'walk': {
      // keeps a gunfighter's distance, circling round you
      const a = Math.atan2(e.x - h[0], e.z - h[2]) + ai.strafe * 0.55;
      bossWalk(e, dt, h[0] + Math.sin(a) * 7, h[2] + Math.cos(a) * 7, e.speed * (rage ? 1.25 : 1)); bossFace(e, dt, 6);
      ai.cd -= dt;
      if (ai.cd <= 0) {
        const k = ['fan', 'dynamite', 'fan', 'stampede'][ai.next++ % 4];
        if (Math.random() < 0.35) ai.strafe *= -1;
        if (k === 'fan') { ai.state = 'draw'; ai.t = ai.dur = 0.6; ai.volleys = rage ? 3 : 2; ai.side = 0; }
        else if (k === 'dynamite') { ai.state = 'toss'; ai.t = 1.0; ai.thrown = 0; ai.tossT = 0.25; }
        else {
          // the whistle: marked lanes running north-south around you, with gaps to stand in
          ai.state = 'whistle'; ai.t = 1.45;
          const n = rage ? 4 : 3, gap = OUTLAW.laneW * 2 + 2.3, first = Math.random() < 0.5 ? 1 : -1, span = (n - 1) / 2 * gap + OUTLAW.laneW;
          // keep every lane inside the map: slide the herd toward the middle until the outer lanes fit
          let base = h[0] + rand(-1.2, 1.2);
          for (let k = 0; k < 40 && (arenaSd(base - span, h[2]) > 0 || arenaSd(base + span, h[2]) > 0) && Math.abs(base) > 0.4; k++) base -= Math.sign(base) * 0.5;
          ai.lanes = [];
          for (let i = 0; i < n; i++) {
            const x = base + (i - (n - 1) / 2) * gap, dir = rage && i % 2 ? -first : first;
            const z0 = h[2] - dir * OUTLAW.laneLen / 2;
            ai.lanes.push({ x, dir, z0 });
            addTele({ kind: 'lane', x, z: z0, r: OUTLAW.laneW, len: OUTLAW.laneLen, rot: dir > 0 ? 0 : Math.PI, dur: 1.45 });
          }
          AUDIO.play('whistle');
        }
      }
      break;
    }
    case 'draw':
      // the cone he is about to fill with lead; it follows his aim until the last moment
      e.clip = 'aim'; e.clipU = (1 - ai.t / ai.dur) * 0.55; e.vx *= 0.8; e.vz *= 0.8;
      if (ai.t > 0.2) bossFace(e, dt, 9);
      if (!ai.cone) ai.cone = addTele({ kind: 'cone', x: e.x, z: e.z, r: 10, rot: e.yaw, half: OUTLAW.spread * (rage ? 0.6 : 0.5), dur: ai.dur });
      ai.cone.x = e.x; ai.cone.z = e.z; ai.cone.rot = e.yaw;
      if (ai.t <= 0) { ai.cone = null; ai.state = 'fan'; ai.shots = 0; ai.shotT = 0; }
      break;
    case 'fan': {
      // fanning the hammer: a quick sweep of shots across the cone, alternating guns
      e.clip = 'aim'; e.clipU = 0.8 + 0.19 * ((ai.shots % 2) ? 1 : 0); e.vx *= 0.8; e.vz *= 0.8;
      const n = rage ? 9 : 7, half = OUTLAW.spread * (rage ? 0.6 : 0.5), sweep = ai.volleys % 2 ? 1 : -1;
      ai.shotT -= dt;
      while (ai.shotT <= 0 && ai.shots < n) {
        ai.shotT += 0.045;
        const u = ai.shots / (n - 1), rot = e.yaw + (u * 2 - 1) * half * sweep;
        outlawGun(e, ai.shots % 2, _gun);
        run.eShots.push({ kind: 'bullet', ph: 0, x: _gun[0], y: 1.5, z: _gun[2], vx: Math.sin(rot) * OUTLAW.bulletV, vy: -0.3, vz: Math.cos(rot) * OUTLAW.bulletV, dmg: 9 * run.info.dmgMul, r: 0.24, life: 1.1 });
        FX.glow(_gun[0], _gun[1], _gun[2], 0.9, [1, 0.85, 0.45], 0.06, 1); FX.smoke(_gun[0], _gun[1], _gun[2], 0.35, [0.8, 0.78, 0.75], 0.5, 0.4);
        AUDIO.play('bang');
        ai.shots++;
      }
      if (ai.shots >= n && ai.shotT <= -0.18) {
        if (--ai.volleys > 0) { ai.state = 'draw'; ai.t = ai.dur = 0.42; }
        else { ai.state = 'walk'; ai.cd = rage ? 1.3 : 2.0; }
      }
      break;
    }
    case 'toss': {
      // dynamite: lit bundles lobbed at you and around you, each over a marked circle
      e.clip = 'throw'; e.clipU = 0.3 + 0.4 * ((ai.thrown % 2) ? 1 : (ai.tossT / 0.25)); bossFace(e, dt, 8); e.vx *= 0.8; e.vz *= 0.8;
      const n = rage ? 6 : 4;
      ai.tossT -= dt;
      if (ai.thrown < n && ai.tossT <= 0) {
        ai.tossT = 0.17;
        let tx = h[0] + run.vel[0] * 0.9, tz = h[2] + run.vel[2] * 0.9;
        if (ai.thrown) { const a = rand(0, TAU), r = rand(2, 5.5); tx = h[0] + Math.cos(a) * r; tz = h[2] + Math.sin(a) * r; }
        const o = { x: tx, z: tz }; resolveCircle(o, 0.6);
        addTele({ kind: 'circle', x: o.x, z: o.z, r: 1.9, dur: 1.15 });
        outlawGun(e, 0, _gun);
        run.eShots.push({ kind: 'dynamite', lob: true, sx: _gun[0], sy: _gun[1] + 0.5, sz: _gun[2], tx: o.x, tz: o.z, x: _gun[0], y: _gun[1], z: _gun[2], t: 0, dur: 1.15, radius: 1.9,
          dmg: 22 * run.info.dmgMul, life: 2, spin: rand(0, TAU), peak: 4.2, onLand: dynamiteBlast });
        ai.thrown++;
        AUDIO.play('throw', 0.8);
      }
      if (ai.t <= 0) { ai.state = 'walk'; ai.cd = rage ? 1.2 : 1.9; }
      break;
    }
    case 'whistle':
      // two fingers to his mouth while the ground starts to rumble
      e.clip = 'throw'; e.clipU = 0.35; e.vx *= 0.8; e.vz *= 0.8; bossFace(e, dt, 4);
      G.cam.shake = Math.max(G.cam.shake, 0.03 + 0.06 * (1 - ai.t / 1.45));
      if (ai.t <= 0) {
        // the herd: three bison per lane, bunched up, running the whole lane
        for (const L of ai.lanes) {
          for (let i = 0; i < 3; i++) ai.herd.push({ lane: L, along: -i * 1.7 - rand(0, 0.6), side: (i - 1) * 0.45 + rand(-0.15, 0.15), ph: rand(0, 1), hit: false });
          addTele({ kind: 'lane', x: L.x, z: L.z0, r: OUTLAW.laneW, len: OUTLAW.laneLen, rot: L.dir > 0 ? 0 : Math.PI, dur: (OUTLAW.laneLen + 4) / OUTLAW.herdV, hold: true });
        }
        AUDIO.play('roar', 0.7); AUDIO.play('boom');
        ai.state = 'walk'; ai.cd = rage ? 1.6 : 2.6;
      }
      break;
  }
};
// the stampede runs on its own while he goes back to shooting
function updateHerd(e, ai, dt) {
  if (!ai.herd || !ai.herd.length) return;
  const h = G.hero.pos, run = G.run;
  for (const b of ai.herd) {
    const L = b.lane;
    b.along += OUTLAW.herdV * dt; b.ph += dt * 2.6;
    b.x = L.x + b.side; b.z = L.z0 + L.dir * b.along;
    if (b.along < 0 || b.along > OUTLAW.laneLen) continue;
    if (!L.hit && Math.abs(h[0] - L.x) < OUTLAW.laneW + HERO_R * 0.5 && Math.abs(h[2] - b.z) < 1.3) {
      L.hit = true; hurtHero(26 * run.info.dmgMul, b.x, b.z - L.dir); run.vel[2] += L.dir * 9; run.vel[0] += Math.sign(h[0] - L.x || 1) * 5;
    }
    // anything else in the way gets trampled
    enemiesInRadius(b.x, b.z, 1.1, o => { if (!o.boss && !o.mini && !o.trampled) { o.trampled = true; hurtEnemy(o, 40, (o.x - L.x) * 4, L.dir * 9, { sound: false }); } });
    if (Math.random() < 0.5) FX.smoke(b.x + rand(-0.4, 0.4), 0.25, b.z - L.dir * 0.8, 0.7, [0.78, 0.62, 0.45], 0.7, 0.5);
    if (Math.random() < 0.25) FX.crack(b.x, b.z, 0.5, 0.8);
  }
  ai.herd = ai.herd.filter(b => b.along < OUTLAW.laneLen + 4);
  if (!ai.herd.length) for (const o of run.enemies) o.trampled = false;
}
function dynamiteBlast(s) {
  FX.burst(s.tx, 0.5, s.tz, 22, [1, 0.62, 0.2], 6, 0.14, 0.5, 0); FX.glow(s.tx, 0.7, s.tz, 2.6, [1, 0.6, 0.25], 0.25);
  FX.scorch(s.tx, s.tz, 1.9);
  for (let i = 0; i < 3; i++) FX.smoke(s.tx + rand(-0.7, 0.7), 0.5, s.tz + rand(-0.7, 0.7), 1.0, [0.3, 0.27, 0.26], 0.9, 0.9);
  enemiesInRadius(s.tx, s.tz, 1.9, o => { if (!o.boss) hurtEnemy(o, 30, (o.x - s.tx) * 4, (o.z - s.tz) * 4, { sound: false }); });
  G.cam.shake = Math.max(G.cam.shake, 0.16);
}
BOSS_DRAW.outlaw = function (e) {
  const D = MODELS.defs, dead = e.dying ? clamp(e.dying, 0, 1) : 0, fl = e.flash > 0 ? 0.55 : 0, t = e.tint, L = R.frame.lightDir;
  if (R.enemyDraw.outlaw) pushEnemy('outlaw', false, e.x, e.y || 0, e.z, e.yaw, e.portrait ? D.outlaw.clips.idle.row + 3 : enemyRow(e), e.scale, e.squash, dead, fl, 0, t[0], t[1], t[2]);
  if (e.portrait) return;
  const ss = e.scale * (1 - dead * 0.5);
  pushDecal(e.x - L[0] * 0.5 * ss, e.z - L[2] * 0.5 * ss, 0.3 * ss, 0.45 * ss, -Math.atan2(-L[0], -L[2]), 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  // the stampede
  if (!R.enemyDraw.bison || !e.ai.herd) return;
  const c = D.bison.clips.run;
  for (const b of e.ai.herd) {
    if (b.along < -2 || !onScreen(b.x, b.z, 3)) continue;
    pushEnemy('bison', false, b.x, 0, b.z, b.lane.dir > 0 ? 0 : Math.PI, c.row + Math.floor((b.ph % 1) * c.frames), 2.1, 1, 0, 0, 0, 0.37, 0.24, 0.15);
    pushDecal(b.x - L[0] * 0.8, b.z - L[2] * 0.8, 0.7, 1.1, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  }
};
// enemy shots: a bright tracer, and a tumbling bundle of dynamite with a spitting fuse
SHOT_DRAW.bullet = s => {
  const sp = Math.hypot(s.vx, s.vz) || 1, ux = s.vx / sp, uz = s.vz / sp;
  R.ribStrip([s.x - ux * 0.9, s.y, s.z - uz * 0.9, s.x, s.y, s.z], 2, 0.09, [1, 0.88, 0.5, 1], 0);
  FX.glow(s.x, s.y, s.z, 0.32, [1, 0.8, 0.4], 0.05, 0.9);
  pushDecal(s.x + 0.1, s.z + 0.08, 0.35, 0.12, -Math.atan2(ux, uz), 1, 0, 0, 0.01, 0.02, 0.05, 0.25);
};
SHOT_DRAW.dynamite = s => {
  const sc = 1.6;
  if (R.enemyDraw.dynamite) pushEnemy('dynamite', false, s.x, s.y - 0.3 * sc, s.z, s.spin * 1.5, MODELS.defs.dynamite.clips.still.row, sc, 1, 0, 0, 0, 1, 1, 1);
  const fy = s.y + 0.22 * sc, fx = s.x + Math.cos(s.spin * 1.5) * 0.1, fz = s.z - Math.sin(s.spin * 1.5) * 0.1;
  FX.glow(fx, fy, fz, 0.45 + Math.random() * 0.25, [1, 0.8, 0.35], 0.05, 1);
  if (Math.random() < 0.7) FX.part(fx, fy, fz, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.05, 0.01, 0.3, [1, 0.85, 0.4], 1, 1, 6);
  const g = clamp(s.t / s.dur, 0, 1);
  pushDecal(s.x, s.z, 0.3 + g * 0.4, 0.3 + g * 0.4, 0, 1, 0, 0, 0.02, 0.03, 0.06, 0.25 + g * 0.3);
};
