// ============================================================
// Minibosses: every chapter has its own big foe, which turns up three times (at 30%, 55% and 80% of the
// chapter), bigger and tougher each time. Chapters 2-5 bring back the four first bosses (Hurler, Charger,
// Twins, Conductor) as theirs, driven by their own boss AI; the rest are crowned giants of the chapter's
// own creature with a pair of attacks from the set below. All of them enter stage 2 at half health.
// ============================================================
const MINIBOSSES = {
  1: { name: 'Pigeon King', type: 'pigeon', scale: 2.5, hp: 380, tint: '#6f7c98', attacks: ['swoop', 'summon'], summon: 'pigeon' },
  2: { name: 'Hurler', boss: 'hurler' },
  3: { name: 'Charger', boss: 'charger' },
  4: { name: 'Twins', boss: 'twins' },
  5: { name: 'Conductor', boss: 'conductor' },
  6: { name: 'Emperor Penguin', type: 'penguin', scale: 2.4, hp: 640, attacks: ['charge', 'fan'], shot: 'icicle' },
  7: { name: 'Magma Brute', type: 'magmite', scale: 2.5, hp: 700, attacks: ['rain', 'slam'] },
  8: { name: 'Frog King', type: 'frog', scale: 2.5, hp: 760, tint: '#3fae3a', attacks: ['leap', 'fan'], shot: 'bubble' },
  9: { name: 'Gull Captain', type: 'seagull', scale: 2.4, hp: 800, attacks: ['swoop', 'rain'] },
  10: { name: 'Thunder Bison', type: 'bison', scale: 2.6, hp: 900, tint: '#4a2e1c', attacks: ['charge', 'slam'] },
  11: { name: 'Zombie Giant', type: 'zombie', scale: 2.2, hp: 950, attacks: ['slam', 'summon'], summon: 'zombie' },
  12: { name: 'Beetle Queen', type: 'crystalbug', scale: 2.3, hp: 1000, attacks: ['charge', 'fan'], shot: 'shard' },
  13: { name: 'Thunderhead', type: 'cloudling', scale: 2.4, hp: 1050, tint: '#c8d0e8', attacks: ['rain', 'summon'], summon: 'cloudling' },
  14: { name: 'Teddy Titan', type: 'teddy', scale: 2.2, hp: 1150, attacks: ['leap', 'slam'] },
  15: { name: 'Puffer King', type: 'puffer', scale: 2.4, hp: 1200, attacks: ['fan', 'charge'], shot: 'arrow' },
  16: { name: 'Foreman Bot', type: 'cogbot', scale: 2.6, hp: 1300, tint: '#e8a43a', attacks: ['charge', 'summon'], summon: 'gearling' },
  18: { name: 'Raptor Alpha', type: 'raptor', scale: 2.6, hp: 1600, tint: '#c84a3a', attacks: ['leap', 'charge'] },
  19: { name: 'Chef Meatball', type: 'meatball', scale: 2.7, hp: 1750, tint: '#a8502a', attacks: ['charge', 'rain'] },
  20: { name: 'Mole Foreman', type: 'mole', scale: 2.7, hp: 1900, tint: '#5e4c42', attacks: ['leap', 'summon'], summon: 'mole' },
  17: { name: 'Sporeling Elder', type: 'sporeling', scale: 2.7, hp: 1450, tint: '#8a3ad8', attacks: ['leap', 'summon'], summon: 'sporeling' },
};
// the three visits: health and size
const MINI_VISITS = [[0.3, 1, 1], [0.55, 1.4, 1.08], [0.8, 1.9, 1.16]];
const miniEvents = () => MINIBOSSES[G.run ? G.run.chapter : 0] || null;

function spawnMiniboss(k) {
  const run = G.run, M = MINIBOSSES[run.chapter];
  if (!M) return;
  const [, hpK, scK] = MINI_VISITS[k], [x, z] = spawnPoint(3);
  if (M.boss) {
    // one of the first bosses, at a third of its boss health (and smaller), on its own boss AI
    const ids = M.boss === 'twins' ? ['twins', 'twins'] : [M.boss];
    const made = ids.map((id, i) => {
      const B = BOSS_TYPES[id], e = spawnEnemy('stickman', x + i * 2.4, z, {});
      const spare = spareHurler(id), mh = spare ? 1 : MINI_HP, md = spare ? 1 : MINI_DMG;
      const hp = B.hp * 0.32 * run.info.hpMul * hpK * (ids.length > 1 ? 0.6 : 1) * mh;
      Object.assign(e, { type: id, def: B, model: B.model, boss: true, mini: true, miniK: k, name: M.name, hp, maxHp: hp, speed: B.speed, dmg: B.dmg * run.info.dmgMul * md,
        radius: B.radius * 0.8 * scK, scale: B.scale * 0.8 * scK, mass: 40, xp: 30, tint: hexToRgb(i ? B.tint2 || B.tint : B.tint), y: 9, spawnT: 1.2,
        clip: 'run', clipU: 0, dizzy: 0, contactDmg: B.dmg * run.info.dmgMul * md,
        ai: { state: 'enter', t: 1.2, summonT: 8, throwT: 2.5, jumpCd: 2, attackT: 2.5, charges: 0, anchor: [x, z], orbit: rand(0, TAU), mode: 0 } });
      addTele({ kind: 'circle', x: e.x, z: e.z, r: e.radius * 2.2, dur: 1.2 });
      return e;
    });
    if (made.length === 2) { made[0].ai.partner = made[1]; made[1].ai.partner = made[0]; made[0].ai.side = 1; made[1].ai.side = -1; }
  } else {
    const e = spawnEnemy(M.type, x, z, { scale: M.scale / ENEMY_TYPES[M.type].scale * scK, tint: M.tint });
    const hp = M.hp * run.info.hpMul * hpK * MINI_HP;
    Object.assign(e, { mini: true, miniK: k, miniDef: M, name: M.name, hp, maxHp: hp, mass: 30, xp: 30, dmg: e.dmg * 1.6 * MINI_DMG, speed: e.speed * 0.9,
      ai: { state: 'walk', t: 0, cd: 1.6, next: 0 } });
    e.contactDmg = e.dmg;
  }
  for (const m of run.enemies) if (m.mini && m.miniK === k && !m.codexed) { m.codexed = true; codexSeen(m); }
  UI.banner(M.name);
  AUDIO.play('roar');
}

// a giant creature miniboss: walk after the hero, then use its attacks in turn
function updateMini(e, dt) {
  const ai = e.ai, M = e.miniDef, run = G.run, h = G.hero.pos;
  if (!ai.stage2 && e.hp < e.maxHp * STAGE2.at) bossStage2(e);
  if (ai.stage2) bossStage2Tick(e, dt);
  ai.t -= dt;
  const dx = h[0] - e.x, dz = h[2] - e.z, d = Math.hypot(dx, dz) || 1, s = e.scale;
  const face = (k = 8) => { e.yaw = angleLerp(e.yaw, Math.atan2(dx, dz), Math.min(1, dt * k)); };
  const stop = () => { e.vx *= 0.8; e.vz *= 0.8; };
  const toWalk = () => { ai.state = 'walk'; ai.cd = rand(2.2, 3); };
  e.phase += dt * 1.2;
  switch (ai.state) {
    case 'walk': {
      ai.cd -= dt;
      const sp = e.speed * (e.slowMul || 1);
      e.vx += (dx / d * sp - e.vx) * Math.min(1, dt * 5); e.vz += (dz / d * sp - e.vz) * Math.min(1, dt * 5);
      e.x += e.vx * dt; e.z += e.vz * dt; face();
      if (ai.cd <= 0) {
        const a = M.attacks[ai.next++ % M.attacks.length];
        ai.state = a; ai.tele = null;
        if (a === 'charge' || a === 'swoop') { ai.t = 0.85; ai.lock = null; }
        else if (a === 'slam') { ai.t = 0.95; ai.tele = addTele({ kind: 'circle', x: e.x, z: e.z, r: 1.3 * s, dur: 0.95 }); }
        else if (a === 'leap') { ai.t = 1.05; ai.from = [e.x, e.z]; ai.to = [h[0], h[2]]; ai.tele = addTele({ kind: 'circle', x: h[0], z: h[2], r: 2.3, dur: 1.05 }); }
        else if (a === 'fan') { ai.t = 0.5; ai.volleys = 2; }
        else if (a === 'rain') {
          ai.t = 1.15; ai.spots = [];
          for (let i = 0; i < 5; i++) { const q = rand(0, TAU), r = i ? rand(1.5, 4.5) : 0; const sx = h[0] + Math.cos(q) * r, sz = h[2] + Math.sin(q) * r; ai.spots.push([sx, sz]); addTele({ kind: 'circle', x: sx, z: sz, r: 1.4, dur: 1.15 }); }
        } else if (a === 'summon') { ai.t = 0.7; }
      }
      break;
    }
    case 'charge': case 'swoop': {
      if (!ai.lock) {
        stop(); face(12);
        if (!ai.tele) ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: 0.7 * s / 2.4 + 0.4, len: 12, rot: e.yaw, dur: 0.85 });
        ai.tele.x = e.x; ai.tele.z = e.z;
        // it stops tracking for the last moment, so a sidestep works
        if (ai.t > 0.35) ai.tele.rot = e.yaw;
        else e.yaw = ai.tele.rot;
        if (ai.t <= 0) { ai.lock = [Math.sin(e.yaw), Math.cos(e.yaw)]; ai.t = 0.8; ai.tele.done = true; AUDIO.play('throw'); }
      } else {
        e.x += ai.lock[0] * 13 * dt; e.z += ai.lock[1] * 13 * dt;
        e.contactDmg = e.dmg * 2;
        if (ai.state === 'swoop') e.y = Math.sin(clamp(1 - ai.t / 0.8, 0, 1) * Math.PI) * 0.6;
        if (Math.random() < 0.5) FX.smoke(e.x, 0.2, e.z, 0.5, [0.6, 0.55, 0.5], 0.5, 0.4);
        if (ai.t <= 0) { e.contactDmg = e.dmg; e.y = 0; toWalk(); }
      }
      break;
    }
    case 'slam': {
      stop(); face(4);
      if (ai.t <= 0) {
        const r = 1.3 * s;
        if (d < r + HERO_R * 0.5) hurtHero(e.dmg * 1.5, e.x, e.z);
        FX.ring(e.x, e.z, r, [1, 0.7, 0.4], 0.5); FX.crack(e.x, e.z, r * 0.8, 1.4); G.cam.shake = Math.max(G.cam.shake, 0.18); AUDIO.play('boom');
        e.squashV -= 6; toWalk();
      }
      break;
    }
    case 'leap': {
      const u = clamp(1 - ai.t / 1.05, 0, 1);
      e.x = lerp(ai.from[0], ai.to[0], u); e.z = lerp(ai.from[1], ai.to[1], u); e.y = Math.sin(u * Math.PI) * 3.2;
      if (ai.t <= 0) {
        e.y = 0;
        if (Math.hypot(h[0] - e.x, h[2] - e.z) < 2.3 + HERO_R * 0.5) hurtHero(e.dmg * 1.6, e.x, e.z);
        FX.ring(e.x, e.z, 2.6, [1, 0.8, 0.5], 0.5); FX.crack(e.x, e.z, 2, 1.4); G.cam.shake = Math.max(G.cam.shake, 0.22); AUDIO.play('boom');
        enemiesInRadius(e.x, e.z, 2.5, o => { if (o !== e && !o.boss && !o.mini) { const ox = o.x - e.x, oz = o.z - e.z, od = Math.hypot(ox, oz) || 1; o.kx += ox / od * 8; o.kz += oz / od * 8; } });
        e.squashV -= 7; toWalk();
      }
      break;
    }
    case 'fan': {
      stop(); face(10);
      if (ai.t <= 0) {
        const n = 7, base = Math.atan2(dx, dz), step = 1.2 / (n - 1);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * step + (ai.volleys % 2 ? step / 2 : 0), sp = 7;
          teleShot({ kind: M.shot || 'arrow', x: e.x + Math.sin(a) * 0.6 * s / 2, y: 0.9, z: e.z + Math.cos(a) * 0.6 * s / 2, vx: Math.sin(a) * sp, vy: 0, vz: Math.cos(a) * sp, dmg: e.dmg * 0.9, r: 0.3, life: 2.4, ph: rand(0, 10), spin: rand(0, TAU) });
        }
        AUDIO.play('throw');
        if (--ai.volleys > 0) ai.t = 0.45; else toWalk();
      }
      break;
    }
    case 'rain': {
      stop(); face(4);
      if (ai.t <= 0) {
        for (const [sx, sz] of ai.spots) {
          if (Math.hypot(h[0] - sx, h[2] - sz) < 1.4 + HERO_R * 0.5) hurtHero(e.dmg * 1.2, sx, sz);
          FX.ring(sx, sz, 1.5, [1, 0.6, 0.3], 0.45); FX.burst(sx, 0.3, sz, 10, [1, 0.6, 0.3], 5, 0.12, 0.5, 2);
        }
        G.cam.shake = Math.max(G.cam.shake, 0.12); AUDIO.play('boom'); toWalk();
      }
      break;
    }
    case 'summon': {
      stop(); face(4);
      if (ai.t <= 0) {
        for (let i = 0; i < 5; i++) { const q = (i / 5) * TAU, o = spawnEnemy(M.summon, e.x + Math.cos(q) * 1.8, e.z + Math.sin(q) * 1.8); resolveCircle(o, o.radius); }
        FX.ring(e.x, e.z, 2.6, [0.8, 0.6, 1], 0.5); AUDIO.play('split'); toWalk();
      }
      break;
    }
  }
}

// a giant's gold crown of light and a gold ring on the ground, so a miniboss reads at a glance
function emitMiniCrown(e) {
  if (e.dying || !e.mini) return;
  const t = G.run.t, s = e.scale, top = (e.y || 0) + s * 0.95;
  pushDecal(e.x, e.z, e.radius * 2.1, e.radius * 2.1, t * 0.8, 3, 0, 0.5, 1, 0.8, 0.3, 0.35, true);
  for (let i = 0; i < 5; i++) {
    const q = t * 1.4 + (i / 5) * TAU;
    if (Math.random() < 0.5) FX.glow(e.x + Math.cos(q) * 0.25 * s, top + 0.12, e.z + Math.sin(q) * 0.25 * s, 0.22, [1, 0.82, 0.3], 0.06, 0.9);
  }
}
// a miniboss going down: a chest, a shower of coins and gems, and maybe a scroll (no slow motion)
function onMiniKilled(e) {
  spawnPickup('chest', e.x, e.z);
  for (let i = 0; i < 8; i++) spawnPickup('coin', e.x + rand(-1.2, 1.2), e.z + rand(-1.2, 1.2), 2);
  for (let i = 0; i < 4; i++) dropGem(e.x + rand(-1, 1), e.z + rand(-1, 1), 15, 1);
  for (let i = 0; i < 4; i++) dropGem(e.x + rand(-1.2, 1.2), e.z + rand(-1.2, 1.2), 6, 0);
  if (Math.random() < 0.5 * scrollOdds()) spawnPickup('scroll', e.x + 0.6, e.z);
  FX.ring(e.x, e.z, 5, [1, 0.8, 0.4], 0.6); G.cam.shake = Math.max(G.cam.shake, 0.2);
}
