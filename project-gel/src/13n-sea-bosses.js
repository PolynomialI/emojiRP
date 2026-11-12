// ============================================================
// The ten sea bosses, each on a vehicle of its own (04n-sea-boss-models.js). One shared brain: the boss sails in,
// circles the ship and works through its attacks (a ram down a marked lane, broadsides of lobbed balls onto
// marked circles, musket volleys, floating mines, calling up swimmers) plus a signature move of its own. At half
// health it is enraged and its pauses get shorter. It can be rammed like anything else, though it barely budges.
// ============================================================
const SEA_BOSS_IDS = ['sflamingo', 'sclam', 'skelp', 'ssmuggler', 'sfrost', 'smagma', 'sphantom', 'sthunder', 'skraken', 'sking'];
// the later bosses' attacks by name (13p-sea-deep-bosses.js fills it): fn(e, dt, ai, ctx)
const SEA_BOSS_ATK = {};
// ride: the vehicle; rig: its masts; len: its length; deck: where the captain stands; rs: the captain's size;
// tint: the captain's coat; atk: the attack cycle (the signature move is its own name); pk: portrait size
Object.assign(BOSS_TYPES, {
  sflamingo: { name: 'Captain Flamingo', ride: 'bflamingo', len: 4.5, deck: 0.55, rs: 1.9, tint: '#ff5a9a', hp: 2200, speed: 3.4, dmg: 8, atk: ['squirt', 'broadside', 'ram', 'summon'] },
  sclam: { name: 'The Coral Queen', ride: 'bclam', len: 4.4, deck: 0.35, rs: 1.9, tint: '#ff8a6a', hp: 2400, speed: 3.0, dmg: 8, atk: ['pearls', 'volley', 'summon', 'broadside'] },
  skelp: { name: 'Kelpbeard', ride: 'browboat', len: 5.6, deck: 0.25, rs: 2.0, tint: '#4a8a3a', hp: 2600, speed: 3.2, dmg: 9, atk: ['snare', 'ram', 'broadside', 'summon'] },
  ssmuggler: { name: 'The Smuggler King', ride: 'bspeed', len: 5.8, deck: 0.62, rs: 1.9, tint: '#2a2a3a', hp: 2700, speed: 5.0, dmg: 9, atk: ['kegs', 'ram', 'volley', 'kegs', 'ram'] },
  sfrost: { name: 'Admiral Frost', ride: 'bice', len: 8.6, deck: 1.04, rs: 2.2, tint: '#3a8ad8', hp: 3000, speed: 2.8, dmg: 10, atk: ['floes', 'broadside', 'ram', 'snare'] },
  smagma: { name: 'The Magma Mariner', ride: 'blava', len: 7.4, deck: 0.94, rs: 2.2, tint: '#ff6a1a', hp: 3200, speed: 2.9, dmg: 10, atk: ['lava', 'broadside', 'mines', 'ram'] },
  sphantom: { name: 'The Phantom Captain', ride: 'bghost', rig: 'bghost_rig', len: 7.6, deck: 0.885, rs: 2.2, tint: '#a8fff0', ghost: true, hp: 3300, speed: 3.4, dmg: 11, atk: ['vanish', 'summon', 'volley', 'broadside'] },
  sthunder: { name: 'The Thunder Admiral', ride: 'biron', len: 9.4, deck: 0.84, rs: 2.3, tint: '#5a6a8a', hp: 3600, speed: 3.0, dmg: 11, atk: ['storm', 'broadside', 'ram', 'mines'] },
  skraken: { name: 'The Kraken', ride: 'bkraken', len: 6, deck: 2.7, rs: 2.0, tint: '#2a4a6a', hp: 4000, speed: 2.6, dmg: 12, atk: ['tentacles', 'summon', 'ink', 'tentacles', 'ram'] },
  sking: { name: 'The Pirate King', ride: 'bflag', rig: 'bflag_rig', len: 7.6, deck: 0.885, rs: 2.6, tint: '#8a1424', hp: 4400, speed: 3.2, dmg: 12, atk: ['barrage', 'ram', 'summon', 'volley', 'mines'] },
});
for (const id of SEA_BOSS_IDS) {
  const B = BOSS_TYPES[id];
  Object.assign(B, { sea: true, noDrop: true, model: B.ride, meshes: [B.ride, ...(B.rig ? [B.rig] : []), 'pcapt'], radius: Math.max(1.4, B.len * 0.32), scale: 1, mass: 30, portraitTop: 1.6, pk: 2.6 / B.len });
  BOSS_DRAW[id] = seaBossDraw;
  SEA_DRAW[id] = e => { seaBossDraw(e); return true; };
  SEA_AI[id] = seaBossAI;
}
SEA_CHAPTERS.forEach((C, i) => { C.boss = SEA_BOSS_IDS[i]; });
Object.assign(BOSS_HINTS, {
  sflamingo: 'Dodge the water jet and the shells; ram it while it circles.',
  sclam: 'Pearls fly out in rings: weave between them.',
  skelp: 'Kelp patches tangle your ship: sail around them.',
  ssmuggler: 'Fast passes and floating kegs: keep moving and shoot the kegs.',
  sfrost: 'Ice floes block your way and frost slows you.',
  smagma: 'Lava rains down: watch the circles.',
  sphantom: 'It vanishes and comes back right beside you.',
  sthunder: 'Lightning strikes marked circles round your ship.',
  skraken: 'Tentacles burst up under marked circles.',
  sking: 'Everything at once. Good luck, captain.',
});

function seaBossStart() {
  const run = G.run, id = seaTheme().boss, B = BOSS_TYPES[id], S = OC.ship;
  for (const m of bossMeshes(id)) ensureMeshNow(m);
  if (!ICONS.map['boss-' + id]) renderBossPortraitOf(id);
  run.bossStarted = true;
  // it sails in from ahead of the ship, just off the screen
  const a = Math.atan2(S.vx, S.vz) + rand(-0.6, 0.6) || rand(0, TAU), r = VIEW.radius + B.len;
  const x = S.x + Math.sin(a) * r, z = S.z + Math.cos(a) * r;
  // (half the table: a sea boss fight should not drag)
  const hp = B.hp * 0.5 * run.info.bossHpMul;
  const e = {
    id: run.nextId++, type: id, def: B, model: B.ride, boss: true, elite: false,
    x, z, y: 0, vx: 0, vz: 0, kx: 0, kz: 0, yaw: Math.atan2(S.x - x, S.z - z), hp, maxHp: hp, speed: B.speed, dmg: B.dmg * run.info.dmgMul * BOSS_DMG,
    radius: B.radius, scale: 1, mass: B.mass, xp: 0, phase: 0, flash: 0, squash: 1, squashV: 0, dying: 0, contactCd: 0,
    slowT: 0, slowMul: 1, auraTint: 0, tint: hexToRgb(B.tint), spawnT: 0, ramCd: 0, clip: 'idle', clipU: 0,
    ai: { state: 'enter', t: 2.2, ang: Math.atan2(x - S.x, z - S.z), n: 0, tempo: 1 },
  };
  run.enemies.push(e); run.bosses.push(e); run.bossTotalHp = hp;
  UI.bossIntro([id]); AUDIO.play('boss'); AUDIO.play('horn');
  G.cam.shake = 0.15;
}

// the shared brain
function seaBossAI(e, dt) {
  const run = G.run, S = OC.ship, ai = e.ai, B = e.def, D = shipDef();
  if (!ai.stage2 && ai.state !== 'enter' && e.hp < e.maxHp * 0.5) {
    ai.stage2 = true; ai.tempo = 1.6; e.speed *= 1.2;
    UI.banner('ENRAGED!', true); AUDIO.play('roar'); G.cam.shake = Math.max(G.cam.shake, 0.4);
    FX.ring(e.x, e.z, B.len, [1, 0.35, 0.25], 0.7, 1);
  }
  ai.t -= dt * (ai.state === 'circle' ? ai.tempo : 1);
  e.phase += dt;
  const dx = S.x - e.x, dz = S.z - e.z, d = Math.hypot(dx, dz) || 1;
  const steer = (tx, tz, sp, k = 1.5) => {
    const ox = tx - e.x, oz = tz - e.z, l = Math.hypot(ox, oz) || 1, s2 = Math.min(sp, l * 2);
    e.vx += (ox / l * s2 - e.vx) * Math.min(1, dt * k); e.vz += (oz / l * s2 - e.vz) * Math.min(1, dt * k);
  };
  // (close enough for the deck guns, whatever the ship)
  const ring = D.len * 0.4 + B.len * 0.5 + 3.5;
  const hz = o => OC.hz.push(o);
  const lob = (tx, tz, delay, r = 1.5, col = [1, 0.55, 0.2], extra = {}) => hz({ k: 'lob', sx: e.x, sy: B.deck + 1.5, sz: e.z, tx, tz, x: e.x, y: B.deck + 1.5, z: e.z, t: -delay, dur: 1.2, r, dmg: e.dmg * 0.6, col, ...extra });
  const lead = k => [S.x + S.vx * k, S.z + S.vz * k];
  e.clip = 'idle';
  switch (ai.state) {
    case 'enter': {
      steer(S.x, S.z, e.speed * 1.4);
      if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2; }
      break;
    }
    case 'circle': {
      ai.ang += dt * 0.3 * (e.speed / 3);
      steer(S.x + Math.sin(ai.ang) * ring, S.z + Math.cos(ai.ang) * ring, e.speed);
      if (ai.t <= 0) {
        const a = B.atk[ai.n++ % B.atk.length];
        ai.state = a; ai.t = 0; ai.k = 0; ai.done = false;
        if (a === 'ram') { ai.t = 1.2; ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: e.radius, len: d + 5, rot: Math.atan2(dx, dz), dur: 1.2 }); }
        else if (a === 'vanish') ai.t = 0.8;
        else ai.t = 0.6;
      }
      break;
    }
    case 'ram': {
      e.vx *= 0.92; e.vz *= 0.92;
      if (ai.tele) { ai.tele.x = e.x; ai.tele.z = e.z; ai.tele.rot = Math.atan2(dx, dz); ai.tele.len = d + 5; }
      if (ai.t <= 0) { ai.state = 'charge'; ai.t = 1.5; ai.dir = [dx / d, dz / d]; AUDIO.play('horn', 1.2); }
      break;
    }
    case 'charge': {
      e.vx = ai.dir[0] * (e.speed * 3.2); e.vz = ai.dir[1] * (e.speed * 3.2);
      if (Math.random() < 0.7) seaSplash(e.x + rand(-1, 1), e.z + rand(-1, 1), 0.7);
      const n = [0, 0];
      if (hullDist(e.x, e.z, n) < e.radius * 0.9) {
        hurtHero(e.dmg * 1.4, e.x, e.z);
        S.vx -= n[0] * 8; S.vz -= n[1] * 8; S.speed *= 0.4;
        e.vx = n[0] * 4; e.vz = n[1] * 4;
        G.cam.shake = Math.max(G.cam.shake, 0.35); AUDIO.play('thud'); AUDIO.play('crumble');
        ai.state = 'circle'; ai.t = 2.4;
      } else if (ai.t <= 0) { ai.state = 'circle'; ai.t = 1.8; }
      break;
    }
    case 'broadside': {
      // a row of shells across the ship's path, one after another
      e.vx *= 0.95; e.vz *= 0.95;
      if (!ai.done) {
        ai.done = true;
        const [lx, lz] = lead(1.0), px = -dz / d, pz = dx / d;
        for (let i = -3; i <= 3; i++) lob(lx + px * i * 2.2, lz + pz * i * 2.2, (i + 3) * 0.1);
        AUDIO.play('cannon'); FX.smoke(e.x, B.deck + 1, e.z, 1.2, [0.85, 0.85, 0.9], 1, 1);
      }
      if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2.4; }
      break;
    }
    case 'barrage': {
      // the Pirate King: a ring of shells round the ship, then one big one where it is heading
      e.vx *= 0.95; e.vz *= 0.95;
      if (!ai.done) {
        ai.done = true;
        for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; lob(S.x + Math.sin(a) * 4, S.z + Math.cos(a) * 4, i * 0.06, 1.6); }
        const [lx, lz] = lead(1.4);
        lob(lx, lz, 0.7, 2.0);
        AUDIO.play('cannon'); AUDIO.play('boom', 0.7);
      }
      if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2.6; }
      break;
    }
    case 'volley': {
      e.vx *= 0.92; e.vz *= 0.92;
      if (ai.t <= 0 && ai.k < 3) {
        ai.k++; ai.t = 0.35;
        const a0 = Math.atan2(dx, dz);
        for (let k = -3; k <= 3; k++) { const a = a0 + k * 0.12 + (ai.k - 2) * 0.05; hz({ k: 'ball', x: e.x, y: B.deck + 1.2, z: e.z, vx: Math.sin(a) * 13, vz: Math.cos(a) * 13, life: 2.4, dmg: e.dmg * 0.35 }); }
        AUDIO.play('bang');
      }
      if (ai.k >= 3 && ai.t <= 0) { ai.state = 'circle'; ai.t = 2.2; }
      break;
    }
    case 'summon': {
      e.vx *= 0.9; e.vz *= 0.9;
      if (!ai.done) {
        ai.done = true;
        const mix = seaTheme().mix.filter(m => m[0] !== 'pdiver');
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, o = seaFoe(pick(mix)[0], e.x + Math.sin(a) * (B.len * 0.4 + 1), e.z + Math.cos(a) * (B.len * 0.4 + 1)); o.spawnT = 0.3; seaSplash(o.x, o.z, 0.6); }
        AUDIO.play('horn', 0.8);
      }
      if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2.6; }
      break;
    }
    case 'mines':
    case 'kegs': {
      // floating mines (or the smuggler's kegs) dropped in its wake as it sweeps past
      if (ai.state === 'kegs') steer(S.x + dz / d * 5, S.z - dx / d * 5, e.speed * 1.5, 3);
      else { e.vx *= 0.96; e.vz *= 0.96; }
      if (ai.t <= 0 && ai.k < 5) { ai.k++; ai.t = 0.4; hz({ k: 'mine', x: e.x - e.vx * 0.2, z: e.z - e.vz * 0.2, t: 0, life: 14, r: 1.8, dmg: e.dmg * 0.7, keg: ai.state === 'kegs' }); AUDIO.play('splash', 0.5); }
      if (ai.k >= 5 && ai.t <= 0) { ai.state = 'circle'; ai.t = 2.2; }
      break;
    }
    case 'squirt': {
      // the flamingo's water jet: aimed down a lane, then a blast that hurts and shoves the ship away
      e.vx *= 0.9; e.vz *= 0.9;
      if (!ai.done) { ai.done = true; ai.t = 1.0; ai.rot = Math.atan2(dx, dz); ai.tele = addTele({ kind: 'lane', x: e.x, z: e.z, r: 1.2, len: 12, rot: ai.rot, dur: 1.0 }); }
      if (ai.t <= 0 && !ai.fired) {
        ai.fired = true;
        const fx = Math.sin(ai.rot), fz = Math.cos(ai.rot), ox = S.x - e.x, oz = S.z - e.z, along = ox * fx + oz * fz;
        if (along > 0 && along < 12 + D.len / 2 && Math.abs(ox * fz - oz * fx) < 1.2 + D.wid / 2) { hurtHero(e.dmg * 0.8, e.x, e.z); S.vx += fx * 9; S.vz += fz * 9; }
        for (let i = 0; i < 30; i++) { const u = Math.random() * 12; FX.part(e.x + fx * u, 0.6, e.z + fz * u, fx * 6 + rand(-1, 1), rand(1, 3), fz * 6 + rand(-1, 1), 0.14, 0.05, 0.5, [0.8, 0.94, 1], 0.9, 0, -6); }
        AUDIO.play('wind'); AUDIO.play('splash');
      }
      if (ai.fired && ai.t < -0.6) { ai.fired = false; ai.state = 'circle'; ai.t = 2.2; }
      break;
    }
    case 'pearls': {
      // rings of pearls rolling out across the water
      e.vx *= 0.9; e.vz *= 0.9;
      if (ai.t <= 0 && ai.k < 3) {
        ai.k++; ai.t = 0.6;
        const n = 14, off = ai.k * 0.22;
        for (let i = 0; i < n; i++) { const a = off + i / n * TAU; hz({ k: 'ball', pearl: true, x: e.x, y: 0.5, z: e.z, vx: Math.sin(a) * 7, vz: Math.cos(a) * 7, life: 3, dmg: e.dmg * 0.4 }); }
        AUDIO.play('crystal');
      }
      if (ai.k >= 3 && ai.t <= 0) { ai.state = 'circle'; ai.t = 2.2; }
      break;
    }
    case 'snare':
    case 'floes': {
      // kelp patches (or frost) that grip the ship; the admiral also drops ice floes in its way
      e.vx *= 0.9; e.vz *= 0.9;
      if (!ai.done) {
        ai.done = true;
        const [lx, lz] = lead(1.5);
        for (let i = 0; i < 4; i++) hz({ k: 'snare', x: lx + rand(-5, 5), z: lz + rand(-5, 5), t: 0, life: 7, r: 2.2, frost: B.ride === 'bice' });
        if (ai.state === 'floes') for (let i = 0; i < 3; i++) seaFloe(lx + rand(-6, 6), lz + rand(-6, 6));
        AUDIO.play(B.ride === 'bice' ? 'crystal' : 'splash');
      }
      if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2.4; }
      break;
    }
    case 'lava': {
      e.vx *= 0.95; e.vz *= 0.95;
      if (!ai.done) { ai.done = true; for (let i = 0; i < 8; i++) { const [lx, lz] = lead(1.2); lob(lx + rand(-5, 5), lz + rand(-5, 5), i * 0.12, 1.5, [1, 0.45, 0.1], { lava: true }); } AUDIO.play('rumble'); }
      if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2.4; }
      break;
    }
    case 'storm': {
      e.vx *= 0.95; e.vz *= 0.95;
      if (ai.t <= 0 && ai.k < 5) { ai.k++; ai.t = 0.3; const [lx, lz] = lead(0.8); hz({ k: 'zap', x: lx + rand(-3, 3), z: lz + rand(-3, 3), t: 0, dur: 1.0, r: 1.8, dmg: e.dmg * 0.6 }); }
      if (ai.k >= 5 && ai.t <= 0) { ai.state = 'circle'; ai.t = 2.4; }
      break;
    }
    case 'vanish': {
      // the ghost ship fades out and comes back right beside you
      if (ai.t < 0.4) e.hidden = true;
      e.fade = clamp(1 - ai.t / 0.8, 0, 1);
      if (ai.t <= 0 && !ai.done) {
        ai.done = true;
        const a = rand(0, TAU), r = D.len * 0.5 + B.len * 0.5 + 3;
        e.x = S.x + Math.sin(a) * r; e.z = S.z + Math.cos(a) * r; e.vx = e.vz = 0;
        e.hidden = false; e.fade = 0; ai.t = 0.5;
        FX.ring(e.x, e.z, B.len * 0.6, [0.7, 1, 0.95], 0.6, 1); AUDIO.play('ghost');
        for (let k = 0; k < 4; k++) { const b = k / 4 * TAU, o = seaFoe('pghost', e.x + Math.sin(b) * 2.5, e.z + Math.cos(b) * 2.5); o.spawnT = 0.3; }
      }
      if (ai.done && ai.t <= 0) { ai.state = 'circle'; ai.t = 2.4; }
      break;
    }
    case 'tentacles': {
      // tentacles burst up under marked circles round the ship
      e.vx *= 0.9; e.vz *= 0.9;
      if (ai.t <= 0 && ai.k < 4) { ai.k++; ai.t = 0.45; const [lx, lz] = lead(0.9); hz({ k: 'tent', x: lx + rand(-2.5, 2.5), z: lz + rand(-2.5, 2.5), t: 0, dur: 1.1, r: 1.6, dmg: e.dmg * 0.7 }); }
      if (ai.k >= 4 && ai.t <= 0) { ai.state = 'circle'; ai.t = 2.2; }
      break;
    }
    case 'ink': {
      // a cloud of ink spreads round the ship, and divers come out of it
      e.vx *= 0.9; e.vz *= 0.9;
      if (!ai.done) { ai.done = true; hz({ k: 'ink', x: S.x, z: S.z, t: 0, life: 6, r: 6 }); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU, o = seaFoe('pdiver', S.x + Math.sin(a) * 7, S.z + Math.cos(a) * 7); o.spawnT = 0.2; } AUDIO.play('splash'); }
      if (ai.t <= 0) { ai.state = 'circle'; ai.t = 2.4; }
      break;
    }
    default: {
      // the later bosses' own moves (13p-sea-deep-bosses.js)
      const f = SEA_BOSS_ATK[ai.state];
      if (f) f(e, dt, ai, { S, D, B, dx, dz, d, lead, lob, hz, steer });
      else { ai.state = 'circle'; ai.t = 2; }
    }
  }
  if (ai.state !== 'charge') { const sp = Math.hypot(e.vx, e.vz); if (sp > 0.5) e.yaw = angleLerp(e.yaw, Math.atan2(e.vx, e.vz), Math.min(1, dt * 1.5)); }
  else e.yaw = angleLerp(e.yaw, Math.atan2(e.vx, e.vz), Math.min(1, dt * 5));
  e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt;
  const kd = Math.exp(-3 * dt); e.kx *= kd; e.kz *= kd;
  if (ai.state !== 'charge' && !e.hidden) seaVehicleContact(e);
  for (const I of OC.isles) { const ix = e.x - I.x, iz = e.z - I.z, id = Math.hypot(ix, iz) || 1, ov = I.ob.r + e.radius - id; if (ov > 0) { e.x += ix / id * ov; e.z += iz / id * ov; } }
  if (Math.hypot(e.vx, e.vz) > 1 && Math.random() < 0.5) OC.wake.push({ x: e.x - Math.sin(e.yaw) * B.len * 0.45, z: e.z - Math.cos(e.yaw) * B.len * 0.45, yaw: e.yaw, t: 0.3, w: B.len * 0.18, k: 0.8, seed: Math.random() * 10 });
  return true;
}
// an ice floe: a small temporary island that blocks the ship for a while
function seaFloe(x, z) {
  if (inIsle(x, z, 2) || hullDist(x, z) < 3) return;
  const r = rand(1.6, 2.4), I = { x, z, r, kind: 'iice', yaw: rand(0, TAU), key: 'floe' + Math.random(), deco: [], floe: 12, ob: { x, z, r: r * 0.9, shape: 'circle', shots: false, isle: true } };
  OC.isles.push(I); ARENA.obstacles = OC.isles.map(J => J.ob);
  seaSplash(x, z, r);
}
// the boss hazards that live in the water: snares, mines, tentacles, ink (the rest are in updateSeaHazards)
function seaBossHazards(dt) {
  const S = OC.ship;
  OC.snared = 0;
  for (const h of OC.hz) {
    if (h.k === 'snare') {
      h.t += dt; if (h.t > h.life) h.dead = true;
      if (hullDist(h.x, h.z) < h.r) OC.snared = h.frost ? 0.45 : 0.55;
    } else if (h.k === 'mine') {
      h.t += dt;
      const boom = h.t > h.life || (h.t > 0.6 && hullDist(h.x, h.z) < 0.7);
      if (boom) {
        h.dead = true;
        if (hullDist(h.x, h.z) < h.r) hurtHero(h.dmg, h.x, h.z);
        FX.ring(h.x, h.z, h.r * 1.2, [1, 0.6, 0.25], 0.45, 1); FX.burst(h.x, 0.4, h.z, 18, [1, 0.55, 0.2], 5, 0.12, 0.5, 1, 2);
        seaSplash(h.x, h.z, 1.1); AUDIO.play('boom');
      }
    } else if (h.k === 'tent') {
      h.t += dt;
      if (!h.hit && h.t >= h.dur) {
        h.hit = true;
        if (hullDist(h.x, h.z) < h.r) { hurtHero(h.dmg, h.x, h.z); S.speed *= 0.6; }
        seaSplash(h.x, h.z, 1.4); AUDIO.play('thud'); G.cam.shake = Math.max(G.cam.shake, 0.15);
      }
      if (h.t > h.dur + 1.0) h.dead = true;
    } else if (h.k === 'ink') { h.t += dt; if (h.t > h.life) h.dead = true; }
  }
  // floes melt away after a while
  for (const I of OC.isles) if (I.floe !== undefined && (I.floe -= dt) <= 0) I.gone = true;
  if (OC.isles.some(I => I.gone)) { OC.isles = OC.isles.filter(I => !I.gone); ARENA.obstacles = OC.isles.map(J => J.ob); }
}
function emitSeaBossHazards() {
  const t = OC.t;
  for (const h of OC.hz) {
    if (h.k === 'snare') { const a = clamp(Math.min(h.t * 2, (h.life - h.t) * 1.5), 0, 1); pushDecal(h.x, h.z, h.r, h.r, h.t * 0.3, 0, h.x * 7, 0, h.frost ? 0.85 : 0.25, h.frost ? 0.95 : 0.55, h.frost ? 1 : 0.2, 0.55 * a); }
    else if (h.k === 'mine') {
      const by = Math.sin(t * 2 + h.x) * 0.05 - 0.15;
      if (h.keg && R.enemyDraw.sbarrel) pushEnemy('sbarrel', false, h.x, by, h.z, h.x, MODELS.defs.sbarrel.clips.still.row, 1.1, 1, 0, 0, 0, 1, 1, 1);
      else pushImp(h.x, 0.25, h.z, 0.45, 0, 1, 0, 1, 31, 1.6, 0.4 + 0.3 * Math.sin(t * 8), t, 0, 0, 0, 1);
      seaShadow(h.x, h.z, 0.6, 0.6, h.x, 0.5);
      pushDecal(h.x, h.z, 0.7, 0.7, 0, 3, 0, 0.5, 1, 0.5, 0.4, 0.4, true);
    } else if (h.k === 'tent') {
      const u = clamp(h.t / h.dur, 0, 1);
      pushDecal(h.x, h.z, h.r, h.r, 0, 4, 0, u, 1, 0.22, 0.18, 0.9);
      // the tentacle's dark bulk rising under the circle
      seaShadow(h.x, h.z, h.r * 0.8, h.r * 0.8, h.x, 0.55 * u);
      if (h.hit) {
        // a tentacle tip rearing out of the water
        const up = clamp((h.t - h.dur) * 4, 0, 1) * clamp((h.dur + 1 - h.t) * 3, 0, 1);
        const n = 6, pts = [];
        for (let i = 0; i < n; i++) { const v = i / (n - 1); pts.push(h.x + Math.sin(v * 2 + h.x) * 0.4 * v, -0.4 + v * 3.2 * up, h.z + Math.cos(v * 2) * 0.3 * v); }
        R.ribStrip(pts, n, h.w || 0.5, h.col || [0.55, 0.3, 0.75, 1], 1, 0, 1, u2 => 1 - u2 * 0.75);
      }
    } else if (h.k === 'ink') { const a = clamp(Math.min(h.t * 2, (h.life - h.t)), 0, 1); pushDecal(h.x, h.z, h.r, h.r, h.t * 0.1, 1, 0, 0, 0.04, 0.02, 0.08, 0.75 * a); }
  }
}
// a sea boss: its vehicle (masts too), the captain on deck, a foam ring; small and at the origin for a portrait
function seaBossDraw(e) {
  const B = e.def, t = OC.t, dead = e.dying ? clamp(e.dying, 0, 1) : 0, k = e.portrait ? B.pk : 1;
  const bob = e.portrait ? 0 : Math.sin(t * 1.3 + e.id) * 0.06 - dead * 1.5;
  const fade = clamp((e.fade || 0) + (B.ghost ? 0.3 : 0), 0, 0.95), flash = e.flash > 0 ? 0.5 : 0;
  const V = MODELS.defs[B.ride];
  if (V && R.enemyDraw[B.ride]) { const c = V.clips[V.clipNames[0]]; pushEnemy(B.ride, false, e.x, bob, e.z, e.yaw, c.row + Math.floor(((t * 0.2) % 1) * c.frames), k, 1, dead, flash, 0, 1, 1, 1, fade); }
  if (B.rig && R.enemyDraw[B.rig]) { const c = MODELS.defs[B.rig].clips.rock; pushEnemy(B.rig, false, e.x, bob, e.z, e.yaw, c.row + Math.floor(((t * 0.2) % 1) * c.frames), k, 1, dead, flash, 0, 1, 1, 1, Math.max(fade, e.portrait ? 0 : 0.25)); }
  if (R.enemyDraw.pcapt && !B.noRider) {
    const M = MODELS.defs.pcapt, S = OC.ship, face = e.portrait || !S ? e.yaw + 0.3 : Math.atan2(S.x - e.x, S.z - e.z);
    const busy = ['broadside', 'barrage', 'lava', 'storm', 'summon', 'squirt', 'pearls', 'tentacles'].includes(e.ai.state);
    const clip = busy ? M.clips.throw : M.clips.idle, u = busy ? clamp(1 - (e.ai.t || 0) / 0.6, 0, 0.999) : (e.phase || 0) % 1;
    pushEnemy('pcapt', false, e.x, bob + B.deck * k, e.z, face, clip.row + Math.floor(u * clip.frames), B.rs * k, 1, dead, e.flash > 0 ? 0.85 : 0, 0, e.tint[0], e.tint[1], e.tint[2], fade);
  }
  if (!e.portrait) {
    seaShadow(e.x, e.z, (B.wid || B.len * 0.42) * 1.6, B.len * 0.8, -e.yaw, 0.45 * (1 - fade) * (1 - dead), 0.2);
    seaShadow(e.x, e.z, (B.wid || B.len * 0.42) * 1.15, B.len * 0.64, -e.yaw, 0.85 * (1 - fade) * (1 - dead));
    pushDecal(e.x, e.z, B.len * 0.55, B.len * 0.55, 0, 3, 0, 0.5, 1, 1, 1, 0.35 * (1 - fade), true);
    if (B.ride === 'blava' && Math.random() < 0.3) FX.smoke(e.x, 3.2, e.z, 0.7, [0.35, 0.33, 0.35], 1.4, 1.2);
    if (B.ghost && Math.random() < 0.2) FX.part(e.x + rand(-2, 2), rand(0.5, 2), e.z + rand(-2, 2), 0, 0.4, 0, 0.3, 0.6, 1.2, [0.6, 1, 0.9], 0.3, 2, 0, 0.5);
  }
}
