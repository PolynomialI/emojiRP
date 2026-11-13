// ============================================================
// More sea upgrades: four weapons that fight from the water and the sky rather than the deck (Whirlpool, Storm
// Cloud, Kraken Arms, Dolphin Pod), and three passives (Hull Plating, Gunpowder, Treasure Hunter). Their numbers
// sit beside the first sea weapons' (test/_seadps.mjs measures them all the same way).
// ============================================================
Object.assign(SKILLS, {
  whirl: {
    sea: true, name: 'Whirlpool', intro: 'Whips up whirlpools under the thickest crowds: swimmers are dragged into the eye and ground down.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Damage/tick'], ['count', 'Whirlpools'], ['radius', 'Radius', 'm'], ['life', 'Lasts', 's']],
    levels: L10({ dmg: [2.5, 2.5, 3, 3, 3.5, 3.5, 4, 4.5, 5, 5.5], count: [1, 1, 1, 1, 1, 2, 2, 2, 2, 2], radius: [1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.9, 2.0, 2.2], life: [3, 3.2, 3.4, 3.6, 3.8, 4, 4.2, 4.4, 4.7, 5], cd: [7.5, 7.3, 7.1, 6.9, 6.7, 6.5, 6.2, 5.9, 5.6, 5.2] }),
  },
  storm: {
    sea: true, name: 'Storm Cloud', intro: 'A thundercloud follows the ship and strikes swimmers with lightning that leaps from one to the next.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Strikes every', 's'], ['chain', 'Leaps'], ['range', 'Range', 'm']],
    levels: L10({ dmg: [9, 10, 12, 14, 16, 18, 20, 22, 25, 29], cd: [2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.4], chain: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4], range: [7, 7, 7.5, 7.5, 8, 8, 8.5, 8.5, 9, 9.5] }),
  },
  kraken: {
    sea: true, name: 'Kraken Arms', intro: 'Great tentacles burst out of the sea under swimmers and slam down on them.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Slam'], ['count', 'Arms'], ['radius', 'Slam', 'm'], ['cd', 'Cooldown', 's']],
    levels: L10({ dmg: [18, 20, 22, 25, 28, 31, 35, 39, 44, 50], count: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], radius: [1.3, 1.35, 1.4, 1.45, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1], cd: [4.2, 4.1, 3.9, 3.8, 3.6, 3.4, 3.2, 3.0, 2.8, 2.5] }),
  },
  dolphin: {
    sea: true, name: 'Dolphin Pod', intro: 'Dolphins race alongside, leap high over swimmers and crash down on them in a splash.', icon: { type: 13, colw: 0 },
    fields: [['count', 'Dolphins'], ['dmg', 'Splash'], ['radius', 'Splash', 'm'], ['cd', 'Leaps every', 's']],
    levels: L10({ dmg: [11, 12, 13, 15, 17, 19, 21, 24, 27, 31], count: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4], radius: [1.0, 1.05, 1.1, 1.15, 1.2, 1.3, 1.35, 1.4, 1.5, 1.6], cd: [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.8] }),
  },
});
Object.assign(PASSIVES, {
  plating: { sea: true, name: 'Hull Plating', short: '+7% hull', desc: 'Steel plates bolted over the hull: +7% max hull.', max: 10, icon: { type: 21, colw: 0 } },
  powder: { sea: true, name: 'Gunpowder', short: '+5% damage', desc: 'Better powder for everything aboard: +5% damage.', max: 10, icon: { type: 20, colw: 0 } },
  treasure: { sea: true, name: 'Treasure Hunter', short: '+8% coins', desc: 'A nose for loot: +8% coins and +10% pickup reach at sea.', max: 10, icon: { type: 11, colw: 4 } },
});
Object.assign(EVOLUTIONS, {
  whirl: { with: 'sails', name: 'Maelstrom', desc: 'Wider whirlpools that bite a quarter harder.', boost: L => ({ radius: +(L.radius * 1.3).toFixed(1), dmg: Math.round(L.dmg * 1.25) }) },
  storm: { with: 'powder', name: 'Thunderhead', desc: 'Lightning leaps two more times, a little harder.', boost: L => ({ chain: L.chain + 2, dmg: Math.round(L.dmg * 1.2) }) },
  kraken: { with: 'fort', name: 'Leviathan', desc: 'One more arm, and every slam is much harder.', boost: L => ({ count: L.count + 1, dmg: Math.round(L.dmg * 1.35) }) },
  dolphin: { with: 'propeller', name: 'Orca Pod', desc: 'One more, bigger and heavier.', boost: L => ({ count: L.count + 1, dmg: Math.round(L.dmg * 1.3), radius: +(L.radius * 1.15).toFixed(1) }) },
});
SEA_ICON_SHOTS.push(
  ['skill-whirl', 'swhirl', { yaw: 0.4, s: 1.6, pitch: 0.9 }],
  ['skill-storm', 'scloud', { yaw: 0.3, s: 1.4, pitch: 0.25 }],
  ['skill-kraken', 'stent', { yaw: 1.4, s: 1.0, pitch: 0.3 }],
  ['skill-dolphin', 'sdolph', { yaw: 1.1, s: 1.4, pitch: 0.45 }],
  ['passive-plating', 'splate', { yaw: -0.5, s: 2.0, pitch: 0.3 }],
  ['passive-powder', 'spowder', { yaw: 0.4, s: 2.0, pitch: 0.4 }],
  ['passive-treasure', 'schest', { yaw: 0.5, s: 2.0, pitch: 0.55 }],
);

// ---------- Whirlpool: spinning pools that pull swimmers in and grind them ----------
SKILL_HOOKS.whirl = {
  update(s, L, dt) {
    const st = s.st, S = OC.ship;
    st.pools = st.pools || [];
    st.t = (st.t ?? 1.5) - dt;
    if (st.t <= 0 && !OC.sink) {
      const e = nearestEnemy(S.x, S.z, 11);
      if (e) {
        st.t = L.cd * cdMul();
        for (let i = 0; i < L.count; i++) {
          // the first under the nearest crowd, the others under other swimmers close by
          const t = i ? nearestEnemy(e.x + rand(-5, 5), e.z + rand(-5, 5), 6) || e : e;
          st.pools.push({ x: t.x + rand(-0.5, 0.5), z: t.z + rand(-0.5, 0.5), t: 0, life: L.life, r: L.radius * areaMul(), dmg: L.dmg, tick: 0.2, ph: rand(0, TAU) });
        }
        AUDIO.play('splash', 0.7);
      } else st.t = 0.4;
    }
    for (const w of st.pools) {
      w.t += dt;
      enemiesInRadius(w.x, w.z, w.r * 1.3, e => {
        if (e.boss) return;
        const ex = w.x - e.x, ez = w.z - e.z, ed = Math.hypot(ex, ez) || 1;
        e.kx += (ex / ed * 8 - ez / ed * 6) * dt / (e.mass || 1); e.kz += (ez / ed * 8 + ex / ed * 6) * dt / (e.mass || 1);
      });
      w.tick -= dt;
      if (w.tick <= 0) { w.tick = 0.4; enemiesInRadius(w.x, w.z, w.r, e => { hurtEnemy(e, w.dmg, 0, 0, { sound: false, color: [0.6, 0.9, 1] }); if (e.grab) seaUnboard(e, 2); }); }
    }
    st.pools = st.pools.filter(w => w.t < w.life);
  },
};
// ---------- Storm Cloud: a cloud over the ship that strikes with chained lightning ----------
SKILL_HOOKS.storm = {
  update(s, L, dt) {
    const st = s.st, S = OC.ship, D = shipDef();
    // the cloud trails a little behind and above the ship, drifting
    st.ph = (st.ph || 0) + dt;
    const back = D.len * 0.2, tx = S.x - Math.sin(S.yaw) * back + Math.sin(st.ph * 0.7) * 0.8, tz = S.z - Math.cos(S.yaw) * back + Math.cos(st.ph * 0.5) * 0.8;
    if (st.x === undefined) { st.x = tx; st.z = tz; }
    const k = Math.min(1, dt * 2.5); st.x += (tx - st.x) * k; st.z += (tz - st.z) * k;
    st.y = 3.2 + D.deck * 0.8 + Math.sin(st.ph * 1.3) * 0.15;
    st.bolts = (st.bolts || []).filter(b => (b.life -= dt) > 0);
    st.t = (st.t ?? 1) - dt;
    if (st.t > 0 || OC.sink) return;
    const first = nearestEnemy(st.x, st.z, L.range * areaMul());
    if (!first) { st.t = 0.3; return; }
    st.t = L.cd * cdMul();
    let from = [st.x, st.y - 0.5, st.z], e = first, dmg = L.dmg;
    const hit = new Set();
    for (let j = 0; j <= L.chain && e; j++) {
      hit.add(e);
      const to = [e.x, 0.5 * (e.scale || 1), e.z];
      st.bolts.push({ a: from, b: to, life: 0.22, seed: rand(0, 100) });
      hurtEnemy(e, dmg, 0, 0, { color: [1, 0.95, 0.5] }); if (e.grab) seaUnboard(e, 3);
      FX.glow(to[0], to[1], to[2], 0.9, [1, 0.95, 0.6], 0.15); FX.burst(to[0], to[1], to[2], 6, [1, 0.95, 0.6], 4, 0.06, 0.25, 1);
      from = to; dmg *= 0.8;
      let best = null, bd = 4.5;
      enemiesInRadius(e.x, e.z, 4.5, o => { if (hit.has(o) || o.dying) return; const d = Math.hypot(o.x - e.x, o.z - e.z); if (d < bd) { bd = d; best = o; } });
      e = best;
    }
    G.cam.shake = Math.max(G.cam.shake, 0.05); AUDIO.play('zap', 0.9);
  },
};
// ---------- Kraken Arms: a tentacle rises under a swimmer, then slams down ----------
const KARM = { rise: 0.55, slam: 0.35, sink: 0.6 };
SKILL_HOOKS.kraken = {
  update(s, L, dt) {
    const st = s.st, S = OC.ship;
    st.arms = st.arms || [];
    st.t = (st.t ?? 2) - dt;
    if (st.t <= 0 && !OC.sink) {
      const e = nearestEnemy(S.x, S.z, 10);
      if (e) {
        st.t = L.cd * cdMul();
        const used = new Set();
        for (let i = 0; i < L.count; i++) {
          let t = e;
          if (i) { let best = null, bd = 1e9; enemiesInRadius(S.x, S.z, 10, o => { if (used.has(o) || o.dying) return; const d = Math.hypot(o.x - S.x, o.z - S.z) + rand(0, 3); if (d < bd) { bd = d; best = o; } }); t = best || e; }
          used.add(t);
          // it comes up beside the swimmer and falls across it
          const a = rand(0, TAU), off = L.radius * 0.6;
          st.arms.push({ x: t.x + Math.cos(a) * off, z: t.z + Math.sin(a) * off, yaw: Math.atan2(t.x - (t.x + Math.cos(a) * off), t.z - (t.z + Math.sin(a) * off)), tx: t.x, tz: t.z, t: -i * 0.15, slammed: false, r: L.radius * areaMul(), dmg: L.dmg });
        }
      } else st.t = 0.4;
    }
    for (const A of st.arms) {
      A.t += dt;
      if (!A.slammed && A.t >= KARM.rise + KARM.slam) {
        A.slammed = true;
        enemiesInRadius(A.tx, A.tz, A.r, e => { hurtEnemy(e, A.dmg, (e.x - A.x) * 2, (e.z - A.z) * 2); e.slowMul = Math.min(e.slowMul || 1, 0.4); e.slowT = 1.2; if (e.grab) seaUnboard(e, 6); });
        seaSplash(A.tx, A.tz, 1.6); FX.ring(A.tx, A.tz, A.r * 1.3, [0.8, 0.6, 1], 0.4);
        G.cam.shake = Math.max(G.cam.shake, 0.1); AUDIO.play('thud', 0.8);
      }
    }
    st.arms = st.arms.filter(A => A.t < KARM.rise + KARM.slam + KARM.sink);
  },
};
// ---------- Dolphin Pod: dolphins swim alongside and leap onto swimmers ----------
SKILL_HOOKS.dolphin = {
  update(s, L, dt) {
    const st = s.st, S = OC.ship, D = shipDef();
    const P = st.pod = st.pod || [];
    while (P.length < L.count) P.push({ k: P.length, x: S.x, z: S.z, yaw: S.yaw, y: -0.1, cd: rand(0.6, 1.6), leap: null, ph: rand(0, 1) });
    const R = D.wid / 2 + 1.6;
    P.forEach(d => {
      d.ph += dt * 1.6;
      if (d.leap) {
        const J = d.leap, u = (J.t += dt) / J.dur;
        if (u < 1) {
          d.x = lerp(J.x0, J.x1, u); d.z = lerp(J.z0, J.z1, u); d.y = Math.sin(u * Math.PI) * J.h - 0.1; d.yaw = J.yaw;
          if (Math.random() < 0.4) FX.part(d.x, d.y, d.z, 0, -1, 0, 0.08, 0.02, 0.4, [0.85, 0.95, 1], 0.8, 0, -6);
        } else {
          d.leap = null; d.y = -0.1; d.cd = L.cd * cdMul() * rand(0.85, 1.15);
          enemiesInRadius(J.x1, J.z1, L.radius * areaMul() * (s.evo ? 1.15 : 1), e => { hurtEnemy(e, L.dmg, (e.x - J.x1) * 3, (e.z - J.z1) * 3); if (e.grab) seaUnboard(e, 4); });
          seaSplash(J.x1, J.z1, 1.3); AUDIO.play('splash', 1.1);
        }
        return;
      }
      // keep pace with the ship in a loose ring, porpoising
      const a = S.yaw + Math.PI / 2 + (d.k / Math.max(1, P.length)) * TAU + Math.sin(d.ph * 0.5) * 0.3, w = [S.x + Math.sin(a) * R, S.z + Math.cos(a) * R];
      const dx = w[0] - d.x, dz = w[1] - d.z, dd = Math.hypot(dx, dz);
      const sp = Math.max(Math.hypot(S.vx, S.vz) * 1.15, 2.5) + dd * 2;
      if (dd > 0.05) { d.x += dx / dd * Math.min(dd, sp * dt); d.z += dz / dd * Math.min(dd, sp * dt); }
      d.yaw = angleLerp(d.yaw, dd > 0.3 ? Math.atan2(dx, dz) : S.yaw, Math.min(1, dt * 4));
      d.y = -0.1 + Math.max(0, Math.sin(d.ph * 2.2)) * 0.12;
      d.cd -= dt;
      if (d.cd <= 0 && !OC.sink) {
        const e = nearestEnemy(d.x, d.z, 8);
        if (e) { const yaw = Math.atan2(e.x - d.x, e.z - d.z), dist = Math.hypot(e.x - d.x, e.z - d.z); d.leap = { t: 0, dur: 0.55 + dist * 0.05, x0: d.x, z0: d.z, x1: e.x, z1: e.z, h: 1.4 + dist * 0.12, yaw }; seaSplash(d.x, d.z, 0.7); }
        else d.cd = 0.4;
      }
    });
    P.length = L.count;
  },
};

// drawn with the sea's other shots (13l emitSeaShots)
function emitSeaMore() {
  const t = OC.t;
  const wl = slotOf('whirl');
  if (wl && wl.st.pools) for (const w of wl.st.pools) {
    const grow = Math.min(1, w.t / 0.4) * Math.min(1, (w.life - w.t) / 0.5), r = w.r * grow;
    if (r < 0.05) continue;
    // a dark eye, rings of foam turning and foam flecks spiralling in
    pushDecal(w.x, w.z, r * 0.55, r * 0.55, 0, 1, 0, 0, 0.0, 0.08, 0.22, 0.55);
    for (let i = 0; i < 3; i++) pushDecal(w.x, w.z, r * (0.45 + i * 0.28), r * (0.45 + i * 0.28), -(t * (2.6 - i * 0.6) + w.ph + i), 3, 0, 0.5, 0.85, 0.97, 1, (wl.evo ? 0.6 : 0.45) - i * 0.1, true);
    if (Math.random() < 0.6) { const a = t * 3 + w.ph + rand(0, TAU), rr = r * rand(0.4, 1); FX.part(w.x + Math.cos(a) * rr, 0.08, w.z + Math.sin(a) * rr, -Math.sin(a) * 2.2 - Math.cos(a) * 1.2, 0.1, Math.cos(a) * 2.2 - Math.sin(a) * 1.2, 0.09, 0.02, 0.5, [0.9, 0.98, 1], 0.9, 0, 0, 0); }
  }
  const sl = slotOf('storm');
  if (sl && sl.st.x !== undefined && R.enemyDraw.scloud) {
    const st = sl.st;
    pushEnemy('scloud', false, st.x, st.y, st.z, OC.ship.yaw + Math.sin(st.ph * 0.3) * 0.3, MODELS.defs.scloud.clips.still.row, sl.evo ? 2.4 : 2.0, 1, 0, st.bolts.length ? 0.4 : 0, 0, 1, 1, 1);
    seaShadow(st.x, st.z, 1.4, 1.0, 0, 0.35);
    // lightning: a jagged line, a wide glow and a thin white core
    for (const b of st.bolts) {
      const n = 7, pts = [], k = b.life / 0.22, rnd = mulberry32(Math.floor(b.seed + t * 20));
      for (let i = 0; i < n; i++) { const u = i / (n - 1), j = i && i < n - 1 ? 0.35 : 0; pts.push(lerp(b.a[0], b.b[0], u) + (rnd() - 0.5) * j, lerp(b.a[1], b.b[1], u), lerp(b.a[2], b.b[2], u) + (rnd() - 0.5) * j); }
      R.ribStrip(pts, n, 0.3 * k, [1, 0.9, 0.45, 0.35], 0, 0, 1);
      R.ribStrip(pts, n, 0.09 * k, [1, 1, 0.9, 1], 0, 0, 1);
    }
  }
  const kl = slotOf('kraken');
  if (kl && kl.st.arms && R.enemyDraw.stent) {
    const M = MODELS.defs.stent, c = M.clips.tcurl;
    for (const A of kl.st.arms) {
      if (A.t < 0) continue;
      // rising out of the water, curling over onto its target, then sinking back
      const rise = clamp(A.t / KARM.rise, 0, 1), curl = clamp((A.t - KARM.rise) / KARM.slam, 0, 1), sink = clamp((A.t - KARM.rise - KARM.slam) / KARM.sink, 0, 1);
      const y = -1.9 * (1 - rise) - 1.9 * sink, sc = (kl.evo ? 1.5 : 1.2) * (A.r / 1.4);
      pushEnemy('stent', false, A.x, y * sc, A.z, A.yaw, c.row + Math.floor(Math.min(0.999, curl * curl) * c.frames), sc, 1, 0, 0, 0, 1, 1, 1);
      if (!A.slammed) pushDecal(A.tx, A.tz, A.r, A.r, 0, 4, 0, clamp(A.t / (KARM.rise + KARM.slam), 0, 1), 0.8, 0.5, 1, 0.7);
      pushDecal(A.x, A.z, 0.6 * sc, 0.6 * sc, 0, 3, 0, 0.5, 1, 1, 1, 0.45 * (1 - sink), true);
    }
  }
  const dl = slotOf('dolphin');
  if (dl && dl.st.pod && R.enemyDraw.sdolph) {
    const M = MODELS.defs.sdolph, sw = M.clips.swim, lp = M.clips.dleap, sc = dl.evo ? 1.7 : 1.2;
    for (const d of dl.st.pod) {
      const row = d.leap ? lp.row + Math.floor(Math.min(0.999, d.leap.t / d.leap.dur) * lp.frames) : sw.row + Math.floor((d.ph % 1) * sw.frames);
      pushEnemy('sdolph', false, d.x, d.y, d.z, d.yaw, row, sc, 1, 0, 0, 0, 1, 1, 1);
      seaShadow(d.x, d.z, 0.35 * sc, 0.9 * sc, -d.yaw, d.leap ? 0.3 : 0.55);
      if (!d.leap) pushDecal(d.x, d.z, 0.4 * sc, 0.8 * sc, -d.yaw, 3, 0, 0.5, 1, 1, 1, 0.3, true);
    }
  }
}
