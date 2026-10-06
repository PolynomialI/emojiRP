// ============================================================
// Bosses, telegraphs, and drawing every entity into the scene
// ============================================================
function startBoss() {
  const run = G.run, h = G.hero.pos;
  run.bossStarted = true;
  const ids = run.info.bosses;
  for (const id of ids) { ensureMeshNow(BOSS_TYPES[id].model); if (!ICONS.map['boss-' + id]) renderBossPortrait(BOSS_TYPES[id].model); }
  // bosses drop in on screen, clear of the HUD: beside the hero on wide screens, below it on tall ones
  const W = R.cssW, H = R.cssH, wide = W > H;
  const spots = wide ? [[0.76, 0.6], [0.24, 0.6]] : [[0.5, 0.76], [0.28, 0.74], [0.72, 0.74]];
  const bodies = ids.flatMap(id => (id === 'twins' ? ['twins', 'twins2'] : [id]));
  const order = bodies.length === 1 ? [spots[0]] : wide ? spots : [spots[1], spots[2]];
  const where = [];
  bodies.forEach((b, i) => {
    const sp = order[i % order.length], q = [0, 0, 0];
    if (!R.unprojectGround(sp[0] * W, sp[1] * H, q)) { q[0] = h[0] + (i ? -5 : 5); q[2] = h[2] + 1; }
    where.push([q[0] + (i >= order.length ? 2 : 0), q[2]]);
  });
  let twinA = null;
  bodies.forEach((b, i) => {
    const [x, z] = where[i];
    if (b === 'twins') twinA = spawnBoss('twins', x, z, {});
    else if (b === 'twins2') {
      const t2 = spawnBoss('twins', x, z, { tint: BOSS_TYPES.twins.tint2 });
      twinA.ai.partner = t2; t2.ai.partner = twinA; twinA.ai.side = 1; t2.ai.side = -1;
    } else spawnBoss(b, x, z, {});
  });
  run.bossTotalHp = run.bosses.reduce((s, b) => s + b.maxHp, 0);
  const names = [...new Set(ids)].map(id => BOSS_TYPES[id].name);
  UI.bossIntro(names.join(' + '));
  AUDIO.play('boss');
  G.cam.shake = 0.15;
}

function spawnBoss(id, x, z, opts) {
  const run = G.run, B = BOSS_TYPES[id], info = run.info;
  const hp = B.hp * info.bossHpMul;
  const e = {
    id: run.nextId++, type: id, def: B, model: B.model, boss: true, elite: false,
    x, z, y: 0, vx: 0, vz: 0, kx: 0, kz: 0, yaw: 0, hp, maxHp: hp, speed: B.speed, dmg: B.dmg * info.dmgMul,
    radius: B.radius, scale: B.scale, mass: B.mass, xp: 0, phase: 0, flash: 0, squash: 1, squashV: 0, dying: 0, contactCd: 0,
    slowT: 0, slowMul: 1, auraTint: 0, bladeT: 0, tint: hexToRgb(opts.tint || B.tint), spawnT: 1.2,
    clip: 'run', clipU: 0, dizzy: 0, contactDmg: 0,
    ai: { state: 'enter', t: 1.2, summonT: 8, throwT: 2.5, jumpCd: 2, attackT: 2.5, charges: 0, anchor: [x, z], orbit: rand(0, TAU), mode: 0 },
  };
  e.contactDmg = e.dmg;
  e.y = 9;
  resolveCircle(e, B.radius * 1.4);
  run.enemies.push(e); run.bosses.push(e);
  addTele({ kind: 'circle', x: e.x, z: e.z, r: B.radius * 2.2, dur: 1.2 });
  return e;
}

// Telegraphs drawn on the floor: { kind: 'circle'|'lane', x, z, r, len, rot, t, dur }
function addTele(o) { G.run.tele = G.run.tele || []; const t = { t: 0, ...o }; G.run.tele.push(t); return t; }

function bossFace(e, dt, rate = 6) { const h = G.hero.pos; e.yaw = angleLerp(e.yaw, Math.atan2(h[0] - e.x, h[2] - e.z), Math.min(1, dt * rate)); }
function bossWalk(e, dt, tx, tz, speed) {
  const dx = tx - e.x, dz = tz - e.z, d = Math.hypot(dx, dz) || 1;
  const sp = speed * e.slowMul;
  const k = 1 - Math.exp(-5 * dt);
  e.vx += (dx / d * sp - e.vx) * k; e.vz += (dz / d * sp - e.vz) * k;
  e.x += e.vx * dt; e.z += e.vz * dt;
  e.phase += dt * Math.hypot(e.vx, e.vz) / (0.85 * e.scale);
  e.clip = 'run';
}

function updateBoss(e, dt) {
  const ai = e.ai, h = G.hero.pos, run = G.run;
  ai.t -= dt;
  e.dizzy = Math.max(0, e.dizzy - dt);
  const dx = h[0] - e.x, dz = h[2] - e.z, d = Math.hypot(dx, dz) || 1;
  if (ai.state === 'enter') {
    // falls out of the sky, then lands with a shockwave that shoves everything back
    e.clip = 'idle'; e.phase += dt * 0.8; bossFace(e, dt);
    const u = clamp(ai.t / 1.2, 0, 1);
    e.y = 9 * u * u;
    if (ai.t <= 0) {
      e.y = 0; ai.state = 'walk'; ai.t = 2.5; e.squashV -= 5;
      FX.ring(e.x, e.z, 6, [1, 0.75, 0.5], 0.55); FX.crack(e.x, e.z, 3.4, 1.8);
      FX.burst(e.x, 0.2, e.z, 24, [0.6, 0.55, 0.5], 6, 0.18, 0.7, 2, 1.4);
      FX.droplets(e.x, 0.4, e.z, 12, 5, 5, 0.07, ORANGE);
      G.cam.shake = Math.max(G.cam.shake, 0.22); AUDIO.play('boom');
      enemiesInRadius(e.x, e.z, 3.5, o => { if (!o.boss) { const ox = o.x - e.x, oz = o.z - e.z, od = Math.hypot(ox, oz) || 1; o.kx += ox / od * 9 / o.mass; o.kz += oz / od * 9 / o.mass; } });
      if (d < 3.2) { run.vel[0] += dx / d * 9; run.vel[2] += dz / d * 9; }
    }
    return;
  }
  switch (e.type) {
    case 'stomper': {
      ai.summonT -= dt;
      if (ai.summonT <= 0) {
        ai.summonT = 10;
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; const m = spawnEnemy('stickman', e.x + Math.cos(a) * 2.6, e.z + Math.sin(a) * 2.6); m.spawnT = 0.5; }
        FX.ring(e.x, e.z, 6, [1, 0.6, 0.3], 0.5);
      }
      if (ai.state === 'walk') {
        bossWalk(e, dt, h[0], h[2], e.speed); bossFace(e, dt);
        if (ai.t <= 0) {
          const tp = { x: h[0], z: h[2] }; resolveCircle(tp, e.radius);
          ai.state = 'leap'; ai.t = 1.25; ai.sx = e.x; ai.sz = e.z; ai.tx = tp.x; ai.tz = tp.z;
          ai.tele = addTele({ kind: 'circle', x: ai.tx, z: ai.tz, r: 3, dur: 1.25 });
        }
      } else if (ai.state === 'leap') {
        const u = 1 - ai.t / 1.25;
        e.clip = 'slam'; e.clipU = u * 0.6;
        const m = smoothstep(0.15, 0.95, u);
        e.x = lerp(ai.sx, ai.tx, m); e.z = lerp(ai.sz, ai.tz, m); e.y = Math.sin(clamp((u - 0.12) / 0.85, 0, 1) * Math.PI) * 2.6;
        e.vx = e.vz = 0;
        if (ai.t <= 0) {
          e.y = 0; ai.state = 'recover'; ai.t = 0.6;
          if (Math.hypot(h[0] - ai.tx, h[2] - ai.tz) < 3 + HERO_R * 0.5) hurtHero(40 * run.info.dmgMul, ai.tx, ai.tz);
          FX.ring(ai.tx, ai.tz, 6.5, [1, 0.85, 0.6], 0.5); FX.crack(ai.tx, ai.tz, 4.2, 2.2);
          FX.burst(ai.tx, 0.2, ai.tz, 26, [0.6, 0.55, 0.5], 6, 0.2, 0.7, 2, 1.5);
          G.cam.shake = 0.28; AUDIO.play('boom');
          enemiesInRadius(ai.tx, ai.tz, 3, o => { if (o !== e && !o.boss) { const ox = o.x - ai.tx, oz = o.z - ai.tz, od = Math.hypot(ox, oz) || 1; o.kx += ox / od * 6; o.kz += oz / od * 6; } });
        }
      } else if (ai.state === 'recover') {
        e.clip = 'slam'; e.clipU = 0.6 + (1 - ai.t / 0.6) * 0.399;
        if (ai.t <= 0) { ai.state = 'walk'; ai.t = 4.5; }
      }
      break;
    }
    case 'hurler': {
      ai.throwT -= dt; ai.jumpCd -= dt;
      if (ai.state === 'walk') {
        const px = -dz / d, pz = dx / d;
        let tx = e.x + px * 2, tz = e.z + pz * 2;
        if (d < 6) { tx = e.x - dx / d * 3; tz = e.z - dz / d * 3; }
        else if (d > 9) { tx = h[0]; tz = h[2]; }
        bossWalk(e, dt, tx, tz, e.speed); bossFace(e, dt);
        if (d < 3 && ai.jumpCd <= 0) {
          ai.state = 'hop'; ai.t = 0.6; ai.jumpCd = 4; ai.sx = e.x; ai.sz = e.z;
          const tp = { x: e.x - dx / d * 7, z: e.z - dz / d * 7 }; resolveCircle(tp, e.radius);
          ai.tx = tp.x; ai.tz = tp.z;
        } else if (ai.throwT <= 0) { ai.state = 'throw'; ai.t = 0.7; ai.thrown = false; }
      } else if (ai.state === 'hop') {
        const u = 1 - ai.t / 0.6;
        e.x = lerp(ai.sx, ai.tx, u); e.z = lerp(ai.sz, ai.tz, u); e.y = Math.sin(u * Math.PI) * 1.6; e.clip = 'idle';
        if (ai.t <= 0) { e.y = 0; ai.state = 'walk'; FX.burst(e.x, 0.1, e.z, 10, [0.6, 0.55, 0.5], 4, 0.15, 0.5, 2); }
      } else if (ai.state === 'throw') {
        const u = 1 - ai.t / 0.7;
        e.clip = 'throw'; e.clipU = u; bossFace(e, dt, 10);
        if (u > 0.62 && !ai.thrown) {
          ai.thrown = true;
          const vel = G.run.vel, px = -dz / d, pz = dx / d;
          const lead = [h[0] + vel[0] * 0.6, h[2] + vel[2] * 0.6];
          const targets = [lead, [lead[0] + px * 1.9, lead[1] + pz * 1.9], [lead[0] - px * 1.9, lead[1] - pz * 1.9]];
          for (const [tx, tz] of targets) {
            addTele({ kind: 'circle', x: tx, z: tz, r: 1.5, dur: 1.0 });
            run.eShots.push({ kind: 'boulder', sx: e.x, sy: 2.6, sz: e.z, tx, tz, x: e.x, y: 2.6, z: e.z, t: 0, dur: 1.0, radius: 1.5, dmg: 25 * run.info.dmgMul, life: 2, spin: 0 });
          }
          AUDIO.play('throw');
        }
        if (ai.t <= 0) { ai.state = 'walk'; ai.throwT = 3.5; }
      }
      break;
    }
    case 'charger': {
      e.contactDmg = e.dmg;
      if (ai.state === 'walk') {
        bossWalk(e, dt, h[0], h[2], e.speed); bossFace(e, dt);
        if (ai.t <= 0) { ai.state = 'aim'; ai.t = 0.8; ai.charges = 3; }
      } else if (ai.state === 'aim') {
        e.clip = 'idle'; e.phase += dt; bossFace(e, dt, 12);
        e.vx *= 0.8; e.vz *= 0.8;
        if (!ai.tele || ai.tele.done) { ai.dir = [Math.sin(e.yaw), Math.cos(e.yaw)]; ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.75, len: 14, rot: e.yaw, dur: ai.t }); }
        ai.dir = [Math.sin(e.yaw), Math.cos(e.yaw)];
        ai.tele.rot = e.yaw; ai.tele.x = e.x; ai.tele.z = e.z;
        if (ai.t <= 0) { ai.state = 'charge'; ai.t = 1.0; ai.tele.done = true; AUDIO.play('throw'); }
      } else if (ai.state === 'charge') {
        e.clip = 'run'; e.phase += dt * 3;
        e.x += ai.dir[0] * 14 * dt; e.z += ai.dir[1] * 14 * dt;
        e.contactDmg = 30 * run.info.dmgMul;
        if (Math.random() < 0.6) FX.smoke(e.x, 0.2, e.z, 0.5, [0.6, 0.55, 0.5], 0.5, 0.4);
        enemiesInRadius(e.x, e.z, e.radius + 0.3, o => { if (o !== e && !o.boss) { o.kx += -ai.dir[1] * 8 * (Math.random() < 0.5 ? 1 : -1); o.kz += ai.dir[0] * 8; } });
        if (ai.t <= 0) {
          ai.charges--;
          ai.tele = null;
          if (ai.charges > 0) { ai.state = 'aim'; ai.t = 0.6; }
          else { ai.state = 'dizzy'; ai.t = 2.5; e.dizzy = 2.5; G.cam.shake = 0.12; AUDIO.play('boom'); }
        }
      } else if (ai.state === 'dizzy') {
        e.clip = 'dizzy'; e.phase += dt * 0.8;
        if (Math.random() < 0.2) FX.star(e.x + rand(-0.5, 0.5), e.scale * 1.2, e.z + rand(-0.5, 0.5), 0.3, [1, 0.9, 0.4], 0.5);
        if (ai.t <= 0) { ai.state = 'walk'; ai.t = 3.5; }
      }
      break;
    }
    case 'twins': {
      const p = ai.partner;
      const together = p && !p.dying;
      const sp = e.speed * (ai.enraged ? 1.4 : 1);
      ai.orbit += dt * 0.6;
      if (together) {
        const a = ai.orbit + (ai.side > 0 ? 0 : Math.PI);
        bossWalk(e, dt, h[0] + Math.cos(a) * 3.2, h[2] + Math.sin(a) * 3.2, sp);
      } else {
        if (!ai.enraged) { ai.enraged = true; e.tint = [1, 0.35, 0.2]; AUDIO.play('boss'); }
        bossWalk(e, dt, h[0], h[2], sp);
      }
      bossFace(e, dt);
      if (together && ai.side > 0) {
        run.ropeCd = (run.ropeCd || 0) - dt;
        const ax = e.x, az = e.z, bx = p.x, bz = p.z;
        const ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez || 1;
        const tt = clamp(((h[0] - ax) * ex + (h[2] - az) * ez) / l2, 0, 1);
        const cx = ax + ex * tt, cz = az + ez * tt;
        if (Math.hypot(h[0] - cx, h[2] - cz) < 0.45 + HERO_R * 0.5 && run.ropeCd <= 0) { run.ropeCd = 0.6; hurtHero(15 * run.info.dmgMul, cx, cz); }
      }
      break;
    }
    case 'conductor': {
      e.clip = 'conduct'; e.phase += dt * 0.7;
      // the stage follows the hero, so the Conductor can't be left behind
      const ax = h[0] - ai.anchor[0], az = h[2] - ai.anchor[1], ad = Math.hypot(ax, az);
      if (ad > 5.5) { const st = Math.min(ad - 5.5, 1.4 * dt); ai.anchor[0] += ax / ad * st; ai.anchor[1] += az / ad * st; }
      const ap = { x: ai.anchor[0], z: ai.anchor[1] }; resolveCircle(ap, e.radius + 1.5); ai.anchor[0] = ap.x; ai.anchor[1] = ap.z;
      bossWalk(e, dt, ai.anchor[0] + Math.cos(G.run.t * 0.3) * 1.5, ai.anchor[1] + Math.sin(G.run.t * 0.3) * 1.5, e.speed);
      e.clip = 'conduct';
      bossFace(e, dt, 3);
      ai.attackT -= dt;
      if (ai.attackT <= 0) {
        ai.attackT = 3;
        ai.mode = 1 - ai.mode;
        if (ai.mode === 0) {
          const off = rand(0, TAU);
          for (let i = 0; i < 10; i++) {
            const a = off + i * 0.63, r = 6 + i * 0.3;
            const m = spawnEnemy('stickman', h[0] + Math.cos(a) * r, h[2] + Math.sin(a) * r);
            m.spawnT = 0.4;
            FX.burst(m.x, 0.3, m.z, 4, ORANGE, 3, 0.1, 0.4, 0);
          }
        } else {
          const n = 18, gap = randInt(0, n - 1);
          for (let i = 0; i < n; i++) {
            if (i === gap || i === (gap + 1) % n || i === (gap + 2) % n) continue;
            const a = (i / n) * TAU;
            run.eShots.push({ kind: 'orb', x: e.x, y: 1.0, z: e.z, vx: Math.cos(a) * 3.5, vy: 0, vz: Math.sin(a) * 3.5, dmg: 12 * run.info.dmgMul, r: 0.32, life: 6, ph: rand(0, 10) });
          }
          FX.ring(e.x, e.z, 3, [1, 0.6, 0.2], 0.4);
          AUDIO.play('zap');
        }
      }
      break;
    }
  }
}

// The Charger rams a boulder or the wall: its charge ends and it is stunned
function bossBonk(e, hit) {
  const ai = e.ai;
  ai.state = 'dizzy'; ai.t = 2.5; e.dizzy = 2.5; ai.charges = 0; ai.tele = null;
  G.cam.shake = Math.max(G.cam.shake, 0.18); AUDIO.play('boom');
  FX.burst(e.x, 0.6, e.z, 14, [0.65, 0.6, 0.55], 5, 0.14, 0.6, 2);
  FX.ring(e.x, e.z, 2.5, [1, 0.85, 0.6], 0.35);
}

function onBossKilled(e) {
  const run = G.run;
  G.cam.shake = 0.3;
  FX.ring(e.x, e.z, 8, [1, 0.8, 0.5], 0.8);
  for (let i = 0; i < 12; i++) spawnPickup('coin', e.x + rand(-1.5, 1.5), e.z + rand(-1.5, 1.5), 3);
  for (let i = 0; i < 6; i++) dropGem(e.x + rand(-1, 1), e.z + rand(-1, 1), 25, 1);
  if (e.ai.partner && !e.ai.partner.dying) e.ai.partner.ai.enraged = false;
  G.timeScale = 0.35;
  setTimeout(() => { G.timeScale = 1; }, 700);
}

function updateTelegraphs(dt) {
  const run = G.run;
  if (!run.tele) return;
  for (const t of run.tele) t.t += dt;
  run.tele = run.tele.filter(t => t.t < t.dur && !t.done);
}

// ---------- scene emission ----------
function enemyRow(e) {
  const m = MODELS.defs[e.model];
  if (e.boss) {
    const c = m.clips[e.clip] || m.clips.run;
    const loop = e.clip === 'run' || e.clip === 'idle' || e.clip === 'conduct' || e.clip === 'dizzy';
    const u = loop ? e.phase - Math.floor(e.phase) : clamp(e.clipU, 0, 0.999);
    return c.row + Math.floor(u * c.frames);
  }
  if (e.act && m.clips[e.act.clip]) { const c = m.clips[e.act.clip]; return c.row + Math.floor(clamp(e.act.u, 0, 0.999) * c.frames); }
  if (e.aim > 0 && m.clips.aim) { const c = m.clips.aim; return c.row + Math.floor(clamp(e.aim / 0.45, 0, 0.999) * c.frames); }
  const c = m.clips.run;
  return c.row + Math.floor((e.phase - Math.floor(e.phase)) * c.frames);
}

function emitRunScene() {
  const run = G.run, h = G.hero.pos, L = R.frame.lightDir;
  const sdx = -L[0] * 0.5, sdz = -L[2] * 0.5;
  emitArena();
  for (const e of run.enemies) {
    if (!onScreen(e.x, e.z, 2.5 * Math.max(1, e.scale)) && !e.boss) continue;
    const dead = e.dying ? clamp(e.dying, 0, 1) : 0;
    const appear = e.spawnT > 0 && !e.boss ? 1 - e.spawnT / 0.5 : 1;
    pushEnemy(e.model, e.elite, e.x, e.y || 0, e.z, e.yaw, enemyRow(e), e.scale * clamp(appear, 0.2, 1), e.squash, dead, e.flash > 0 ? (e.boss ? 0.55 : 0.85) : 0, e.auraTint, e.tint[0], e.tint[1], e.tint[2]);
    const ss = e.scale * (1 - dead * 0.5) * (1 - clamp((e.y || 0) / 6, 0, 0.5));
    pushDecal(e.x + sdx * ss, e.z + sdz * ss, 0.3 * ss, 0.45 * ss, -Math.atan2(sdx, sdz), 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  }
  // rope between twins
  for (const b of run.bosses) {
    if (b.type !== 'twins' || b.dying || b.ai.side < 0) continue;
    const p = b.ai.partner;
    if (!p || p.dying) continue;
    const n = 14, pts = [];
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      pts.push(lerp(b.x, p.x, u), 1.25 - Math.sin(u * Math.PI) * 0.45 + Math.sin(u * 12 - run.t * 8) * 0.04, lerp(b.z, p.z, u));
    }
    R.ribStrip(pts, n, 0.08, [1, 0.55, 0.15, 1], 1, run.t, 2);
    R.ribStrip(pts, n, 0.25, [1, 0.5, 0.15, 0.35], 0, 0, 1);
  }
  // telegraphs
  if (run.tele) for (const t of run.tele) {
    const p = clamp(t.t / t.dur, 0, 1);
    if (t.kind === 'circle') pushDecal(t.x, t.z, t.r, t.r, 0, 4, 0, p, 1, 0.22, 0.18, 0.9);
    else {
      const cx = t.x + Math.sin(t.rot) * t.len / 2, cz = t.z + Math.cos(t.rot) * t.len / 2;
      pushDecal(cx, cz, t.r, t.len / 2, -t.rot, 5, 0, p, 1, 0.22, 0.18, 0.85);
    }
  }
  // enemy shots
  for (const s of run.eShots) {
    if (s.kind === 'arrow') { const sp = Math.hypot(s.vx, s.vz) || 1; pushImp(s.x, s.y, s.z, 0.32, s.vx / sp, 0, s.vz / sp, 1, 14, 0, 0, 0, 0, 0, 0, 1); }
    else if (s.kind === 'orb') { pushImp(s.x, s.y, s.z, s.r, 0, 0, 1, 1, 15, 0, 0.6, s.ph + run.t, 0, 0, 0, 1); FX.glow(s.x, s.y, s.z, 0.7, [1, 0.55, 0.15], 0.05, 0.5); }
    else if (s.kind === 'javelin') {
      const u = clamp(s.t / s.dur, 0, 1), vy = (0.3 - s.sy) + Math.cos(u * Math.PI) * Math.PI * s.peak;
      const vx = s.tx - s.sx, vz = s.tz - s.sz, l = Math.hypot(vx, vy, vz) || 1;
      pushImp(s.x, s.y, s.z, 0.55, vx / l, vy / l, vz / l, 1, 14, 0, 0, 0, 0, 0, 0, 1);
      pushDecal(s.x + 0.1, s.z + 0.08, 0.35, 0.18, -Math.atan2(vx, vz), 1, 0, 0, 0.01, 0.02, 0.05, 0.35);
    }
    else if (s.kind === 'boulder') { pushImp(s.x, s.y, s.z, 0.6, Math.sin(s.spin), Math.cos(s.spin), 0.3, 1, 13, 0, 0, 0, 0, 0, 0, 1); pushDecal(s.x + 0.2, s.z + 0.15, 0.6, 0.45, 0, 1, 0, 0, 0.01, 0.02, 0.05, 0.45); }
  }
  // archers' aim lines
  for (const e of run.enemies) {
    if (!e.def.ranged || !(e.aim > 0) || e.dying) continue;
    const dx = h[0] - e.x, dz = h[2] - e.z, d = Math.hypot(dx, dz) || 1, a = Math.atan2(dx, dz);
    pushDecal(e.x + dx / 2, e.z + dz / 2, 0.06, d / 2, -a, 9, 0, 0, 1, 0.3, 0.2, 0.55 * clamp(e.aim / 0.45, 0, 1));
  }
  // hero projectiles
  for (const p of run.proj) {
    if (p.kind === 'ball') {
      pushImp(p.x, p.y, p.z, p.r, p.vx, p.vy, p.vz, 1.35, 0, 0, 0.25, p.ph + p.t, 0, 0, 0, 1);
      trailRibbon(p.trail, 0.15, [R.goo.rim[0], R.goo.rim[1], R.goo.rim[2]], 0.6);
    } else if (p.kind === 'missile') {
      pushImp(p.x, p.y, p.z, 0.28, p.vx, p.vy, p.vz, 1.3, 1, 0.8, 0.3, p.ph + p.t, 0, 0, 0, 1);
      if (p.trail.length > 2) {
        const pts = [];
        p.trail.forEach((q, i) => { const k = 0.1 * Math.min(1, i / 3); pts.push(q[0] + Math.sin(p.t * 22 - i) * k, q[1] + Math.cos(p.t * 22 - i) * k, q[2]); });
        R.ribStrip(pts, p.trail.length, 0.14, [0.7, 0.55, 1.0, u => (1 - u) * 0.8], 0, 0, 1, u => 1 - u);
      }
    }
  }
  // fused grenades: blink faster as the fuse runs out, with a warning ring showing the blast
  for (const b of run.bombs) {
    const u = b.t / b.fuse, grow = clamp(b.t / 0.2, 0, 1);
    const blink = Math.sin(b.t * (8 + u * 30)) > 0 ? 0.8 : 0.2;
    pushImp(b.x, 0.34 * grow, b.z, 0.34 * easeOutBack(grow) * (1 + 0.12 * u * Math.sin(b.t * 40)), 0, 1, 0.15, 1, 6, 1, blink, b.ph + b.t * 2, 0, 0, 0, 1);
    pushDecal(b.x, b.z, b.radius, b.radius, 0, 4, 0, u, 0.75, 0.45, 1.0, 0.5 * grow);
  }
  for (const m of run.mines) {
    const armed = m.t > 0.5, grow = clamp(m.t / 0.2, 0, 1), blink = armed && Math.sin(m.t * 10) > 0;
    const fade = clamp(m.life / 0.4, 0, 1);
    pushImp(m.x, 0.0, m.z, 0.38 * easeOutBack(grow) * fade, 0, 0, 1, 1, 2, armed ? 1.6 + (blink ? 0.4 : 0) : 0.3, armed ? (blink ? 0.7 : 0.3) : 0.1, m.t, 0, 0, 0, 1);
  }
  for (const w of run.worms) {
    if (w.state === 'burrow' || w.E < 0.05) pushDecal(w.x, w.z, 0.85, 0.85, 0, 7, 0, 0, 0.35, 0.95, 0.75, 0.75);
    if (w.E > 0.02) pushImp(w.x, 0, w.z, 0.8, Math.sin(w.yaw), 0, Math.cos(w.yaw), 1, 5, 3, 0.12, w.ph, w.E, w.bite, 0, 1);
  }
  for (const b of run.buddies) {
    pushImp(b.x, b.y + 0.27, b.z, 0.45, Math.sin(b.yaw), 0, Math.cos(b.yaw), 1, 7, 0, 0.04, b.ph, b.sq, 0, 0, 1);
    pushDecal(b.x + 0.08, b.z + 0.07, 0.36, 0.28, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.5);
  }
  for (const a of run.axes) {
    pushImp(a.x, a.y, a.z, 0.5 * areaMul(), a.dx, 0, a.dz, 1, 4, 0.5, 0.15, a.t * 12.6, 0, 0, 0, 1);
    trailRibbon(a.trail, 0.16, [0.7, 0.85, 1.0], 0.45);
  }
  // gems and pickups
  for (const g of run.gems) {
    if (!onScreen(g.x, g.z, 1)) continue;
    if (g.tier) pushImp(g.x, g.y + 0.08 + Math.sin(run.t * 3 + g.ph) * 0.05, g.z, 0.36, 0, 0, 1, 1, 29, 0, 0.2, (run.t + g.ph) * 0.5, 0, 1, 0, 1);
    else pushImp(g.x, g.y + Math.sin(run.t * 3 + g.ph) * 0.04, g.z, 0.24, 0, 0, 1, 1, 8, 0, 0.15, run.t + g.ph, 0, 0, 0, 1);
  }
  for (const p of run.pickups) {
    const bob = Math.sin(run.t * 3 + p.ph) * 0.05;
    if (p.kind === 'coin') pushImp(p.x, p.y + 0.05 + bob, p.z, 0.2, 0, 0, 1, 1, 9, 0, 0.1, run.t + p.ph, 0, 0, 0, 1);
    else if (p.kind === 'heart') pushImp(p.x, p.y + 0.12 + bob, p.z, 0.24, 0, 0, 1, 1, 10, 4, 0.2, run.t + p.ph, 0, 0, 0, 1);
    else if (p.kind === 'magnet') pushImp(p.x, p.y + 0.12 + bob, p.z, 0.26, 0, 0, 1, 1, 11, 4, 0.1, run.t + p.ph, 0, 0, 0, 1);
    else if (p.kind === 'scroll') { pushImp(p.x, p.y + 0.15 + bob, p.z, 0.3, 0, 0, 1, 1, 30, 0, 0.12, (run.t + p.ph) * 0.6, 0, 0, 0, 1); FX.glow(p.x, 0.45, p.z, 0.8, [1, 0.85, 0.45], 0.05, 0.3); }
    else if (p.kind === 'chest') { pushImp(p.x, p.y + 0.02, p.z, 0.36, 0, 0, 1, 1, 12, 0, 0.05, run.t, 0, 0, 0, 1); FX.glow(p.x, 0.5, p.z, 0.9, [1, 0.8, 0.3], 0.05, 0.25); }
    pushDecal(p.x + 0.06, p.z + 0.05, 0.25, 0.2, 0, 1, 0, 0, 0.01, 0.03, 0.07, 0.4);
  }
  // magnet radius ring when gems are near
  if (lvlOf('magnet') > 0) {
    const r = run.stats.magnet;
    let near = false;
    for (const g of run.gems) if (Math.hypot(g.x - h[0], g.z - h[2]) < r * 1.8) { near = true; break; }
    if (near) pushDecal(h[0], h[2], r, r, 0, 6, 0, 0, 0.4, 1, 0.75, 0.35);
  }
  // lightning bolts
  for (const b of G.bolts) {
    const n = 9, pts = [];
    const seed = b.seed + (b.life < b.max * 0.5 ? 7 : 0);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), j = i === 0 || i === n - 1 ? 0 : 1;
      const r1 = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453, r2 = Math.sin(seed * 39.3468 + i * 11.135) * 24634.6345;
      pts.push(lerp(b.a[0], b.b[0], u) + (r1 - Math.floor(r1) - 0.5) * b.jag * 2 * j, lerp(b.a[1], b.b[1], u), lerp(b.a[2], b.b[2], u) + (r2 - Math.floor(r2) - 0.5) * b.jag * 2 * j);
    }
    const a = b.life / b.max;
    R.ribStrip(pts, n, b.w, [b.col[0], b.col[1], b.col[2], a], 0);
    R.ribStrip(pts, n, b.w * 3, [0.4, 0.7, 1.0, a * 0.35], 0);
  }
  emitSkills();
}

function emitArena() {
  const f = R.frame, rc = f.rockCol, L = f.lightDir;
  const sdx = -L[0] * 0.55, sdz = -L[2] * 0.55;
  SCENE.pools = ARENA.pools.filter(o => onScreen(o.x, o.z, o.r + 1.5));
  const rock = (o, size) => {
    if (!onScreen(o.x, o.z, size + 1.5)) return;
    const m = 'rock' + o.v;
    if (!R.enemyDraw[m]) return;
    const sc = size / 0.45, shade = 0.86 + 0.14 * ((o.v * 0.37 + o.yaw) % 1);
    pushEnemy(m, false, o.x, 0, o.z, o.yaw, MODELS.defs[m].clips.still.row, sc, 1, 0, 0, 0, rc[0] * shade, rc[1] * shade, rc[2] * shade);
    pushDecal(o.x + sdx * size, o.z + sdz * size, size * 1.15, size * 0.9, -Math.atan2(sdx, sdz), 1, 0, 0, 0.01, 0.02, 0.05, 0.55);
  };
  for (const o of ARENA.rocks) rock(o, o.r);
  for (const o of ARENA.wall) rock(o, o.r);
}

function trailRibbon(trail, w, col, alpha) {
  if (trail.length < 3) return;
  const pts = [];
  for (const q of trail) pts.push(q[0], q[1], q[2]);
  R.ribStrip(pts, trail.length, w, [col[0], col[1], col[2], u => (1 - u) * alpha], 0, 0, 1, u => 1 - u * 0.85);
}
