// ============================================================
// The bosses of oceans 11-20, on the shared sea-boss brain (13n-sea-bosses.js): it circles the ship and works
// through its attack cycle; the moves below are the new ones (SEA_BOSS_ATK), mixed with the old (summon, ram,
// volley, broadside, barrage, storm, pearls, vanish). Creatures carry no captain (noRider).
// glow: a light on the model (local x, y, z; color; size), drawn every frame.
// ============================================================
const SEA_DEEP_BOSS_IDS = ['sangler', 'switch', 'swyrm', 'stitan', 'ssugar', 'ssaucer', 'swhale', 'slevi', 'sjones', 'sneptune'];
Object.assign(BOSS_TYPES, {
  sangler: { name: 'The Lantern Angler', ride: 'bangler', len: 6.4, wid: 4.0, deck: 0, rs: 1, tint: '#1e2a44', noRider: true, hp: 4300, speed: 3.2, dmg: 13, atk: ['lure', 'pearls', 'summon', 'ram', 'lure'], glow: [0, 3.2, 3.35, [0.9, 1, 0.5], 1.6] },
  switch: { name: 'The Weed Witch', ride: 'bbarge', len: 6.4, wid: 4.0, deck: 0.55, rs: 2.1, tint: '#2e5a26', hp: 4000, speed: 2.8, dmg: 13, atk: ['hex', 'snareb', 'summon', 'volley', 'hex'], glow: [0, 1.7, 1.4, [0.5, 1, 0.3], 1.2] },
  swyrm: { name: 'The Whirl Wyrm', ride: 'bwyrm', len: 9, wid: 2.4, deck: 0, rs: 1, tint: '#2a8a7a', noRider: true, hp: 3800, speed: 3.6, dmg: 14, atk: ['whirlb', 'coil', 'ram', 'summon', 'coil'] },
  stitan: { name: 'The Trident Titan', ride: 'btitan', len: 5.5, wid: 4.0, deck: 0, rs: 1, tint: '#5ab8a0', noRider: true, hp: 3600, speed: 2.4, dmg: 14, atk: ['trident', 'pillars', 'tidal', 'summon'], glow: [-2.35, 8.4, 0.45, [1, 0.85, 0.4], 1.3] },
  ssugar: { name: 'Captain Sugarbeard', ride: 'bcake', len: 6.4, wid: 4.6, deck: 2.53, rs: 2.1, tint: '#ff5aa8', hp: 3400, speed: 3.0, dmg: 14, atk: ['sprinkles', 'cherry', 'fizzb', 'summon', 'ram'] },
  ssaucer: { name: 'The Triangle Saucer', ride: 'bufo', len: 6, wid: 6, deck: 0, rs: 1, tint: '#8ae8ff', noRider: true, hp: 3200, speed: 3.8, dmg: 15, atk: ['beam', 'zaplines', 'blink', 'riftsb', 'beam'], glow: [0, 1.6, 0, [0.6, 1, 0.85], 2.2] },
  swhale: { name: 'The Cloud Whale', ride: 'bwhale', len: 11, wid: 4.4, deck: 0, rs: 1, tint: '#7aa8e8', noRider: true, hp: 3000, speed: 3.0, dmg: 15, atk: ['gustb', 'spout', 'dive', 'summon', 'ram'] },
  slevi: { name: 'The Leviathan', ride: 'blevi', len: 12, wid: 3.4, deck: 0, rs: 1, tint: '#1e3a4a', noRider: true, hp: 2900, speed: 2.8, dmg: 16, atk: ['breachb', 'maw', 'tail', 'summon', 'breachb'], glow: [0, 3.95, 3.6, [1, 0.55, 0.15], 1.4] },
  sjones: { name: 'Davy Jones', ride: 'bjones', rig: 'bjones_rig', len: 7.6, wid: 2.7, deck: 0.885, rs: 2.4, tint: '#2a6a5a', hp: 2750, speed: 3.4, dmg: 16, atk: ['organ', 'fireb', 'summon', 'broadside', 'vanish'] },
  sneptune: { name: 'Neptune', ride: 'bneptune', len: 8, wid: 4.4, deck: 0, rs: 1, tint: '#6ac8b8', noRider: true, hp: 2700, speed: 3.2, dmg: 17, atk: ['trident', 'whirlb', 'storm', 'tidal', 'barrage', 'summon', 'pillars'], glow: [-1.55, 7.2, 0.05, [1, 0.9, 0.5], 1.5] },
});
for (const id of SEA_DEEP_BOSS_IDS) {
  const B = BOSS_TYPES[id];
  Object.assign(B, { sea: true, noDrop: true, model: B.ride, meshes: [B.ride, ...(B.rig ? [B.rig] : []), ...(B.noRider ? [] : ['pcapt'])], radius: Math.max(1.4, B.len * 0.32), scale: 1, mass: 30, portraitTop: 1.6, pk: 2.6 / B.len });
  BOSS_DRAW[id] = seaBossDraw;
  SEA_DRAW[id] = e => { seaBossDraw(e); seaDeepBossFx(e); return true; };
  SEA_AI[id] = seaBossAI;
}
SEA_DEEP_BOSS_IDS.forEach((id, i) => { SEA_CHAPTERS[10 + i].boss = id; });
Object.assign(BOSS_HINTS, {
  sangler: 'Its lure drags you in: sail hard away, then dodge the lunge.',
  switch: 'Her potions leave poison on the water, and weed grips the hull.',
  swyrm: 'Whirlpools pull you in, and its coils burst up all around you.',
  stitan: 'Stay out of the three trident lanes, and out of the tidal wave.',
  ssugar: 'Sprinkles rain in a ring; the cherry bombs hit hard.',
  ssaucer: 'Its beam pulls you in. Mind the rifts it leaves behind.',
  swhale: 'Wind lanes shove you about; when it dives, a circle marks where it comes up.',
  slevi: 'It breaches under marked circles, then sucks you toward its jaws.',
  sjones: 'Cursed pearls and ghost fire: keep moving.',
  sneptune: 'The god of the sea himself. Everything at once. Good luck, captain.',
});

// ---------- the new moves ----------
const toCircle = (ai, t = 2.4) => { ai.state = 'circle'; ai.t = t; };
const startRam = (e, ai, c) => { ai.state = 'ram'; ai.t = 1.0; ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: e.radius, len: c.d + 5, rot: Math.atan2(c.dx, c.dz), dur: 1.0 }); };
const around = (S, r0, r1) => { const a = rand(0, TAU), r = rand(r0, r1); return [S.x + Math.sin(a) * r, S.z + Math.cos(a) * r]; };
// a lane from the boss: is the ship in it? (half width w, length len, angle rot)
const inLane = (e, S, D, rot, w, len) => { const fx = Math.sin(rot), fz = Math.cos(rot), ox = S.x - e.x, oz = S.z - e.z, al = ox * fx + oz * fz; return al > 0 && al < len + D.len / 2 && Math.abs(ox * fz - oz * fx) < w + D.wid / 2; };
Object.assign(SEA_BOSS_ATK, {
  // the angler's lure (and the leviathan's maw): the ship is dragged toward its jaws, then it lunges
  lure(e, dt, ai, c) {
    e.vx *= 0.9; e.vz *= 0.9;
    if (!ai.done) { ai.done = true; ai.t = 2.2; AUDIO.play('wind', 0.7); }
    const S = c.S; S.vx -= c.dx / c.d * 7 * dt; S.vz -= c.dz / c.d * 7 * dt;
    if (Math.random() < 0.7) FX.part(S.x + rand(-1, 1), 0.6, S.z + rand(-1, 1), -c.dx / c.d * 8, 0.3, -c.dz / c.d * 8, 0.1, 0.04, 0.6, B_GLOW(e), 1, 1);
    if (ai.t <= 0) startRam(e, ai, c);
  },
  // the witch's potions: green flasks that leave poison burning on the water
  hex(e, dt, ai, c) {
    e.vx *= 0.92; e.vz *= 0.92;
    if (!ai.done) {
      ai.done = true;
      for (let i = 0; i < 5; i++) { const [lx, lz] = c.lead(1.1); c.lob(lx + rand(-4, 4), lz + rand(-4, 4), i * 0.15, 1.4, [0.5, 1, 0.3], { onLand: h => OC.hz.push({ k: 'gfire', x: h.tx, z: h.tz, t: 0, life: 6, r: 1.8, tick: 0 }) }); }
      AUDIO.play('cackle');
    }
    if (ai.t <= 0) toCircle(ai);
  },
  snareb(e, dt, ai, c) {
    e.vx *= 0.92; e.vz *= 0.92;
    if (!ai.done) {
      ai.done = true;
      for (let i = 0; i < 4; i++) { const [lx, lz] = c.lead(1.4); c.hz({ k: 'snare', weed: true, x: lx + rand(-5, 5), z: lz + rand(-5, 5), t: 0, life: 9, r: 2.4 }); }
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU, o = seaFoe('pweed', e.x + Math.sin(a) * 3, e.z + Math.cos(a) * 3); o.spawnT = 0.3; }
      AUDIO.play('splash');
    }
    if (ai.t <= 0) toCircle(ai);
  },
  // the wyrm: whirlpools in your path, and its coils bursting up in a ring round the ship
  whirlb(e, dt, ai, c) {
    e.vx *= 0.92; e.vz *= 0.92;
    if (!ai.done) {
      ai.done = true;
      const [lx, lz] = c.lead(1.2);
      c.hz({ k: 'whirl', x: lx, z: lz, t: 0, life: 9, r: 4.4, tick: 0 });
      for (let i = 0; i < 2; i++) { const a = rand(0, TAU); c.hz({ k: 'whirl', x: lx + Math.sin(a) * 10, z: lz + Math.cos(a) * 10, t: 0, life: 8, r: 3.4, tick: 0 }); }
      AUDIO.play('wind');
    }
    if (ai.t <= 0) toCircle(ai);
  },
  coil(e, dt, ai, c) {
    e.vx *= 0.9; e.vz *= 0.9;
    if (ai.k === 0 && !ai.done) { ai.done = true; ai.a0 = rand(0, TAU); }
    if (ai.t <= 0 && ai.k < 8) { const a = ai.a0 + ai.k / 8 * TAU; ai.k++; ai.t = 0.12; c.hz({ k: 'tent', x: c.S.x + Math.sin(a) * 4.2, z: c.S.z + Math.cos(a) * 4.2, t: 0, dur: 1.1, r: 1.7, dmg: e.dmg * 0.7, col: [0.16, 0.54, 0.48, 1], w: 0.7 }); }
    if (ai.k >= 8 && ai.t <= 0) toCircle(ai, 2.2);
  },
  // the titan's trident: three lanes, then lightning down all three
  trident(e, dt, ai, c) {
    e.vx *= 0.9; e.vz *= 0.9;
    if (!ai.done) { ai.done = true; ai.fired = false; ai.t = 1.1; ai.rot = Math.atan2(c.dx, c.dz); for (const o of [-0.22, 0, 0.22]) addTele({ kind: 'lane', x: e.x, z: e.z, r: 1.0, len: 24, rot: ai.rot + o, dur: 1.1 }); AUDIO.play('horn', 1.3); }
    if (ai.t <= 0 && !ai.fired) {
      ai.fired = true;
      let hit = false;
      for (const o of [-0.22, 0, 0.22]) { const r = ai.rot + o; addBolt(e.x, 2, e.z, e.x + Math.sin(r) * 24, 0.4, e.z + Math.cos(r) * 24, 0.25, [1, 0.9, 0.4]); if (!hit && inLane(e, c.S, c.D, r, 1.0, 24)) hit = true; }
      if (hit && !OC.sink) hurtHero(e.dmg * 0.9, e.x, e.z);
      R.frame.flashW = Math.max(R.frame.flashW, 0.35); AUDIO.play('thunder', 0.8); G.cam.shake = Math.max(G.cam.shake, 0.25);
    }
    if (ai.fired && ai.t < -0.5) toCircle(ai);
  },
  pillars(e, dt, ai, c) {
    e.vx *= 0.92; e.vz *= 0.92;
    if (!ai.done) { ai.done = true; const a0 = rand(0, TAU); for (let i = 0; i < 6; i++) { const a = a0 + i / 6 * TAU; c.hz({ k: 'pillar', x: c.S.x + Math.sin(a) * 4.6, z: c.S.z + Math.cos(a) * 4.6, t: -i * 0.08, dur: 1.5, r: 1.6 }); } const [lx, lz] = c.lead(1.3); c.hz({ k: 'pillar', x: lx, z: lz, t: 0, dur: 1.5, r: 1.8 }); AUDIO.play('rumble'); }
    if (ai.t <= 0) toCircle(ai);
  },
  // a tidal wave down a wide lane through the ship
  tidal(e, dt, ai, c) {
    e.vx *= 0.9; e.vz *= 0.9;
    if (!ai.done) { ai.done = true; ai.fired = false; ai.t = 1.4; ai.rot = Math.atan2(c.dx, c.dz); addTele({ kind: 'lane', x: e.x, z: e.z, r: 3.2, len: 30, rot: ai.rot, dur: 1.4 }); AUDIO.play('rumble'); }
    if (ai.t <= 0 && !ai.fired) {
      ai.fired = true;
      const S = c.S, fx = Math.sin(ai.rot), fz = Math.cos(ai.rot);
      if (inLane(e, S, c.D, ai.rot, 3.2, 30) && !OC.sink) { hurtHero(e.dmg * 1.1, e.x, e.z); S.vx += fx * 10; S.vz += fz * 10; }
      for (let i = 0; i < 40; i++) { const u = Math.random() * 30, v = rand(-3, 3); FX.part(e.x + fx * u + fz * v, 0.4, e.z + fz * u - fx * v, fx * 7, rand(2, 5), fz * 7, 0.2, 0.06, 0.7, [0.8, 0.95, 1], 0.9, 2, -6); }
      AUDIO.play('splash'); AUDIO.play('wind');
    }
    if (ai.fired && ai.t < -0.6) toCircle(ai);
  },
  // Sugarbeard: a ring of sprinkles, cherry bombs, fizz
  sprinkles(e, dt, ai, c) {
    e.vx *= 0.95; e.vz *= 0.95;
    if (!ai.done) { ai.done = true; const cols = [[1, 0.3, 0.4], [1, 0.85, 0.2], [0.3, 0.8, 1], [0.6, 0.4, 1], [0.4, 1, 0.5]]; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = rand(2.5, 6); c.lob(c.S.x + Math.sin(a) * r, c.S.z + Math.cos(a) * r, i * 0.05, 1.2, cols[i % 5]); } AUDIO.play('pop'); }
    if (ai.t <= 0) toCircle(ai, 2.6);
  },
  cherry(e, dt, ai, c) {
    e.vx *= 0.95; e.vz *= 0.95;
    if (!ai.done) { ai.done = true; for (let i = 0; i < 3; i++) { const [lx, lz] = c.lead(1.0 + i * 0.4); c.lob(lx + rand(-2, 2), lz + rand(-2, 2), i * 0.3, 2.4, [0.9, 0.12, 0.2], { onLand: h => FX.burst(h.tx, 0.6, h.tz, 18, [1, 0.95, 0.95], 5, 0.1, 0.5, 1, 2) }); } AUDIO.play('cannon'); }
    if (ai.t <= 0) toCircle(ai, 2.6);
  },
  fizzb(e, dt, ai, c) {
    e.vx *= 0.95; e.vz *= 0.95;
    if (!ai.done) { ai.done = true; for (let i = 0; i < 5; i++) { const [x, z] = around(c.S, 1, 5); c.hz({ k: 'geyser', x, z, t: -i * 0.25, dur: 1.3, r: 1.9 }); } AUDIO.play('pop', 0.7); }
    if (ai.t <= 0) toCircle(ai, 2.6);
  },
  // the saucer: a tractor beam that pulls you under it and burns, lines of lightning, blinking about, rifts
  beam(e, dt, ai, c) {
    e.vx *= 0.9; e.vz *= 0.9;
    if (!ai.done) { ai.done = true; ai.t = 2.4; ai.tick = 0; AUDIO.play('laser'); }
    const S = c.S; S.vx -= c.dx / c.d * 6 * dt; S.vz -= c.dz / c.d * 6 * dt;
    if ((ai.tick -= dt) <= 0) { ai.tick = 0.5; if (c.d < 9 && !OC.sink) hurtHero(e.dmg * 0.3, e.x, e.z); }
    if (ai.t <= 0) toCircle(ai);
  },
  zaplines(e, dt, ai, c) {
    e.vx *= 0.95; e.vz *= 0.95;
    if (ai.t <= 0 && ai.k < 3) { ai.k++; ai.t = 0.7; const a = rand(0, TAU), S = c.S; for (let j = -2; j <= 2; j++) c.hz({ k: 'zap', x: S.x + Math.sin(a) * j * 2.3, z: S.z + Math.cos(a) * j * 2.3, t: -(j + 2) * 0.08, dur: 1.0, r: 1.4, dmg: e.dmg * 0.5 }); }
    if (ai.k >= 3 && ai.t <= 0) toCircle(ai);
  },
  blink(e, dt, ai, c) {
    if (!ai.done) { ai.done = true; ai.t = 0.6; ai.phase2 = false; AUDIO.play('zap', 0.6); }
    if (!ai.phase2) {
      e.fade = clamp(1 - ai.t / 0.6, 0, 1); if (ai.t < 0.2) e.hidden = true;
      if (ai.t <= 0) { ai.phase2 = true; ai.t = 0.5; const a = rand(0, TAU), r = c.D.len * 0.5 + c.B.len * 0.5 + 4; e.x = c.S.x + Math.sin(a) * r; e.z = c.S.z + Math.cos(a) * r; e.vx = e.vz = 0; e.hidden = false; e.fade = 0; FX.ring(e.x, e.z, c.B.len * 0.6, [0.5, 1, 0.8], 0.6, 1); AUDIO.play('ghost'); }
    } else if (ai.t <= 0) toCircle(ai, 2.0);
  },
  riftsb(e, dt, ai, c) {
    if (!ai.done) { ai.done = true; for (let i = 0; i < 3; i++) { const [x, z] = around(c.S, 5, 8); if (!inIsle(x, z, 3)) c.hz({ k: 'rift', x, z, t: 0, life: 10, r: 1.7, seed: rand(0, 6) }); } AUDIO.play('ghost', 0.8); }
    if (ai.t <= 0) toCircle(ai);
  },
  // the whale: gusts, a rain of spray from its blowhole, a dive and a breach under you
  gustb(e, dt, ai, c) {
    e.vx *= 0.95; e.vz *= 0.95;
    if (!ai.done) { ai.done = true; const S = c.S, a0 = Math.atan2(c.dx, c.dz); for (let i = 0; i < 3; i++) { const a = a0 + (i - 1) * 0.9; c.hz({ k: 'gust', x: S.x - Math.sin(a) * 2, z: S.z - Math.cos(a) * 2, rot: a, len: 18, w: 4.5, t: -i * 0.5, tele: 1.0, dur: 2.5 }); } AUDIO.play('wind'); }
    if (ai.t <= 0) toCircle(ai);
  },
  spout(e, dt, ai, c) {
    e.vx *= 0.95; e.vz *= 0.95;
    if (!ai.done) { ai.done = true; for (let i = 0; i < 10; i++) { const [x, z] = around(c.S, 0, 6); c.lob(x, z, i * 0.1, 1.4, [0.75, 0.9, 1]); } FX.burst(e.x, 3, e.z, 30, [0.85, 0.95, 1], 7, 0.15, 0.8, 2, 3); AUDIO.play('splash'); }
    if (ai.t <= 0) toCircle(ai);
  },
  dive(e, dt, ai, c) {
    if (!ai.done) { ai.done = true; ai.t = 1.2; ai.phase2 = false; seaSplash(e.x, e.z, 2); AUDIO.play('splash'); }
    if (!ai.phase2) {
      e.fade = clamp(1 - ai.t / 1.2, 0, 1); if (ai.t < 0.5) e.hidden = true;
      if (ai.t <= 0) { ai.phase2 = true; ai.t = 2.2; const [lx, lz] = c.lead(0.8); ai.bx = lx; ai.bz = lz; c.hz({ k: 'breach', x: lx, z: lz, t: 0, dur: 1.3, r: 3.4 }); }
    } else if (ai.t <= 0.9 && e.hidden) { e.hidden = false; e.fade = 0; const a = rand(0, TAU); e.x = ai.bx + Math.sin(a) * (c.B.len * 0.5 + c.D.len * 0.5 + 2); e.z = ai.bz + Math.cos(a) * (c.B.len * 0.5 + c.D.len * 0.5 + 2); seaSplash(e.x, e.z, 2.5); }
    else if (ai.t <= 0) toCircle(ai);
  },
  // the leviathan: breaches along your path, its maw (the lure, as suction), tail slams
  breachb(e, dt, ai, c) {
    e.vx *= 0.95; e.vz *= 0.95;
    if (!ai.done) { ai.done = true; for (let i = 0; i < 3; i++) { const [lx, lz] = c.lead(0.7 + i * 0.6); c.hz({ k: 'breach', x: lx + rand(-1.5, 1.5), z: lz + rand(-1.5, 1.5), t: -i * 0.5, dur: 1.3, r: 3.0 }); } AUDIO.play('rumble'); }
    if (ai.t <= 0) toCircle(ai, 2.6);
  },
  tail(e, dt, ai, c) {
    e.vx *= 0.92; e.vz *= 0.92;
    if (ai.t <= 0 && ai.k < 4) { ai.k++; ai.t = 0.4; const [x, z] = around(c.S, 0, 4); c.hz({ k: 'tent', x, z, t: 0, dur: 1.1, r: 2.2, dmg: e.dmg * 0.8, col: [0.12, 0.24, 0.3, 1], w: 1.0 }); }
    if (ai.k >= 4 && ai.t <= 0) toCircle(ai, 2.2);
  },
  // Davy Jones: rings of cursed pearls from the organ, ghost fire round the ship
  organ(e, dt, ai, c) {
    e.vx *= 0.9; e.vz *= 0.9;
    if (ai.t <= 0 && ai.k < 3) { ai.k++; ai.t = 0.6; const n = 18, off = ai.k * 0.17; for (let i = 0; i < n; i++) { const a = off + i / n * TAU; c.hz({ k: 'ball', pearl: true, x: e.x, y: 0.5, z: e.z, vx: Math.sin(a) * 7.5, vz: Math.cos(a) * 7.5, life: 3, dmg: e.dmg * 0.4 }); } AUDIO.play('ghost', 0.7); }
    if (ai.k >= 3 && ai.t <= 0) toCircle(ai, 2.2);
  },
  fireb(e, dt, ai, c) {
    e.vx *= 0.92; e.vz *= 0.92;
    if (!ai.done) { ai.done = true; for (let i = 0; i < 6; i++) { const [x, z] = around(c.S, 2.5, 6.5); c.hz({ k: 'gfire', x, z, t: 0, life: 7, r: 2.0, tick: 0 }); } AUDIO.play('ghost'); }
    if (ai.t <= 0) toCircle(ai);
  },
});
SEA_BOSS_ATK.maw = SEA_BOSS_ATK.lure;
const B_GLOW = e => (e.def.glow ? e.def.glow[3] : [0.8, 0.95, 1]);
// a boss's own lights, and its tractor beam
function seaDeepBossFx(e) {
  const B = e.def;
  if (e.hidden || e.dying || e.portrait) return;
  if (B.glow) {
    const [lx, ly, lz, col, size] = B.glow, c = Math.cos(e.yaw), s = Math.sin(e.yaw);
    const x = e.x + c * lx + s * lz, z = e.z - s * lx + c * lz;
    FX.glow(x, ly, z, size * (0.85 + 0.15 * Math.sin(OC.t * 3)), col, 0.04, 0.7);
    pushDecal(x, z, size * 1.4, size * 1.4, 0, 1, 0, 0, col[0], col[1], col[2], 0.3, true);
  }
  if (e.ai.state === 'beam') {
    const S = OC.ship, w = 1.2 + 0.2 * Math.sin(OC.t * 20);
    R.ribStrip([e.x, 1.8, e.z, S.x, 0.6, S.z], 2, w, [0.5, 1, 0.8, 0.6], 0, 0, 1);
    pushDecal(S.x, S.z, 2.2, 2.2, 0, 3, 0, (OC.t * 2) % 1, 0.5, 1, 0.8, 0.6, true);
    if (Math.random() < 0.6) FX.part(S.x + rand(-1, 1), 0.5, S.z + rand(-1, 1), (e.x - S.x) * 0.4, 1.5, (e.z - S.z) * 0.4, 0.1, 0.04, 0.6, [0.5, 1, 0.8], 1, 3);
  }
}
