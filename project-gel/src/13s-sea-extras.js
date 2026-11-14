// ============================================================
// The sea's weather fronts, treasure maps, the whale, and the drowned city's streets (ocean 20)
// ============================================================

// ---------- weather fronts ----------
// Each ocean has its own mix (SEA_WEATHER: the chance a stretch of sea, 70 across, holds each kind):
//   fog bank  a patch of mist (r 13-20): inside it the fog closes right in, so foes loom out of it close by
//   tailwind  a lane of white arrows on the water (40-55 long): sailing along it is 40% faster, against it 15% slower
//   squall    a drifting storm cell (r 9-12): rain, darker light, lightning where the ocean has it, and gusts that
//             shove the ship sideways (the spray shows which way, a moment before)
// Laid out by area as the ship explores, like the islands, and dropped again far behind.
const SEA_WEATHER = {
  1: { wind: 0.5 }, 2: { wind: 0.45, fog: 0.15 }, 3: { fog: 0.35, wind: 0.3 }, 4: { fog: 0.3, wind: 0.4 }, 5: { fog: 0.35, squall: 0.2 },
  6: { squall: 0.3, wind: 0.3 }, 7: { fog: 0.6 }, 8: { squall: 0.45, wind: 0.3 }, 9: { fog: 0.35, squall: 0.3 }, 10: { wind: 0.4, squall: 0.3 },
  11: { fog: 0.5 }, 12: { fog: 0.4, wind: 0.3 }, 13: { wind: 0.5, squall: 0.3 }, 14: { fog: 0.3, wind: 0.3 }, 15: { wind: 0.45 },
  16: { fog: 0.4, squall: 0.3 }, 17: { wind: 0.6 }, 18: { squall: 0.4, fog: 0.3 }, 19: { fog: 0.6 }, 20: { fog: 0.35, squall: 0.3 },
};
const FRONT_CHUNK = 70;
function seaFronts() {
  const S = OC.ship, W = SEA_WEATHER[G.run.chapter] || {}, cx = Math.floor(S.x / FRONT_CHUNK), cz = Math.floor(S.z / FRONT_CHUNK);
  OC.fchunks = OC.fchunks || new Map(); OC.fronts = OC.fronts || [];
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
    const key = (cx + i) + ',' + (cz + j);
    if (OC.fchunks.has(key)) continue;
    OC.fchunks.set(key, true);
    const rnd = mulberry((cx + i) * 4241 + (cz + j) * 91541 + G.run.chapter * 7);
    const at = () => [(cx + i + 0.15 + rnd() * 0.7) * FRONT_CHUNK, (cz + j + 0.15 + rnd() * 0.7) * FRONT_CHUNK];
    // (never right on top of the start)
    const ok = (x, z, r) => Math.hypot(x, z) > r + 14;
    if (rnd() < (W.fog || 0)) { const [x, z] = at(), r = 13 + rnd() * 7; if (ok(x, z, r)) OC.fronts.push({ k: 'fog', key, x, z, r, seed: rnd() * 9 }); }
    if (rnd() < (W.wind || 0)) { const [x, z] = at(), len = 40 + rnd() * 15; if (ok(x, z, 4)) OC.fronts.push({ k: 'wind', key, x, z, len, w: 4, rot: rnd() * TAU }); }
    if (rnd() < (W.squall || 0)) { const [x, z] = at(), r = 9 + rnd() * 3, a = rnd() * TAU; if (ok(x, z, r)) OC.fronts.push({ k: 'squall', key, x, z, r, vx: Math.sin(a) * 1.2, vz: Math.cos(a) * 1.2 }); }
  }
  OC.fronts = OC.fronts.filter(F => Math.hypot(F.x - S.x, F.z - S.z) < FRONT_CHUNK * 2.6 || !OC.fchunks.delete(F.key));
}
// where the ship is: in fog, in a squall, riding a tailwind
function seaFrontsTick(dt) {
  const S = OC.ship, run = G.run;
  if (!OC.fronts) return;
  let fogIn = 0, sq = 0, wind = 1;
  const sp = Math.hypot(S.vx, S.vz) || 1;
  for (const F of OC.fronts) {
    if (F.k === 'squall') { F.x += F.vx * dt; F.z += F.vz * dt; }
    const dx = S.x - F.x, dz = S.z - F.z, d = Math.hypot(dx, dz);
    if (F.k === 'fog') {
      fogIn = Math.max(fogIn, smoothstep(F.r, F.r * 0.55, d));
      if (onScreen(F.x, F.z, F.r) && Math.random() < dt * 5) { const a = rand(0, TAU), q = Math.sqrt(Math.random()) * F.r * 0.85; FX.smoke(F.x + Math.cos(a) * q, rand(0.4, 1.4), F.z + Math.sin(a) * q, rand(2.2, 3.4), [0.9, 0.93, 0.98], 3.2, 0.05); }
    } else if (F.k === 'squall') {
      sq = Math.max(sq, smoothstep(F.r, F.r * 0.65, d));
      if (onScreen(F.x, F.z, F.r)) for (let i = 0; i < 3; i++) { const a = rand(0, TAU), q = Math.sqrt(Math.random()) * F.r; FX.part(F.x + Math.cos(a) * q, rand(4, 6), F.z + Math.sin(a) * q, -1.2, -15, 0.8, 0.035, 0.02, 0.35, [0.78, 0.86, 1], 0.5, 1, 0, 0); }
    } else {
      const ux = Math.sin(F.rot), uz = Math.cos(F.rot), al = dx * ux + dz * uz, side = dx * uz - dz * ux;
      if (Math.abs(al) < F.len / 2 && Math.abs(side) < F.w / 2) { const dot = (S.vx * ux + S.vz * uz) / sp; wind = Math.max(wind, 1 + 0.4 * Math.max(0, dot)) * (dot < -0.3 ? 0.85 : 1); }
    }
  }
  const k1 = 1 - Math.exp(-dt * 1.4);
  OC.fogIn = (OC.fogIn || 0) + (fogIn - (OC.fogIn || 0)) * k1;
  OC.squallIn = (OC.squallIn || 0) + (sq - (OC.squallIn || 0)) * k1;
  OC.windMul = (OC.windMul || 1) + (wind - (OC.windMul || 1)) * (1 - Math.exp(-dt * 3));
  // riding a tailwind: spray flies off the bow
  if (OC.windMul > 1.08 && Math.random() < dt * 14) { const p = shipW(rand(-0.4, 0.4), shipDef().len * 0.5); FX.part(p[0] + rand(-0.3, 0.3), 0.35, p[1] + rand(-0.3, 0.3), S.vx * 0.25 + rand(-1, 1), rand(0.8, 1.6), S.vz * 0.25 + rand(-1, 1), 0.09, 0.03, 0.45, [0.85, 0.95, 1], 0.75, 0, 4, 1); }
  // the fog closes in: the light goes milky
  const f = R.frame;
  if (OC.fogIn > 0.01) for (let i = 0; i < 3; i++) f.fogCol[i] = lerp(f.fogCol[i], [0.84, 0.87, 0.91][i], OC.fogIn * 0.75);
  // gusts in a squall: spray streaks show the way for 0.4 s, then the wind shoves the ship for most of a second
  if (OC.squallIn > 0.5 && !OC.sink && G.state === 'run') {
    OC.gustT = (OC.gustT ?? 2) - dt;
    if (OC.gustT <= 0 && !OC.gust) { const a = rand(0, TAU); OC.gust = { dx: Math.sin(a), dz: Math.cos(a), warn: 0.4, t: 0.9 }; OC.gustT = rand(2.6, 4.2); }
  }
  const g = OC.gust;
  if (g) {
    for (let i = 0; i < 2; i++) FX.part(S.x - g.dx * 5 + rand(-3, 3), rand(0.3, 1.2), S.z - g.dz * 5 + rand(-3, 3), g.dx * 14, 0, g.dz * 14, 0.05, 0.02, 0.5, [0.92, 0.96, 1], 0.7, 1, 0, 0);
    if (g.warn > 0) { g.warn -= dt; if (g.warn <= 0) AUDIO.play('wind', 0.8); }
    else { g.t -= dt; S.x += g.dx * 3.4 * dt; S.z += g.dz * 3.4 * dt; if (g.t <= 0) OC.gust = null; }
  }
}
// drawn with the sea: the mist patches, the squalls' shadow, the tailwinds' arrows
function emitSeaFronts() {
  if (!OC.fronts) return;
  const t = OC.t;
  for (const F of OC.fronts) {
    if (F.k === 'fog') { if (onScreen(F.x, F.z, F.r)) pushDecal(F.x, F.z, F.r * 1.15, F.r * 1.15, 0, 1, 0, 0, 0.92, 0.95, 1, 0.3); }
    else if (F.k === 'squall') { if (onScreen(F.x, F.z, F.r)) seaShadow(F.x, F.z, F.r * 1.3, F.r * 1.3, 0, 0.6, 0); }
    else if (onScreen(F.x, F.z, F.len / 2)) {
      const ux = Math.sin(F.rot), uz = Math.cos(F.rot), n = Math.floor(F.len / 5);
      pushDecal(F.x, F.z, F.w * 0.6, F.len * 0.55, F.rot, 1, 0, 0, 0.85, 0.95, 1, 0.12, true);
      for (let k = 0; k < n; k++) {
        const s = ((k * 5 + t * 4) % F.len) - F.len / 2, fade = 1 - Math.pow(Math.abs(s) / (F.len / 2), 3);
        pushDecal(F.x + ux * s, F.z + uz * s, 0.9, 0.9, F.rot, 11, 0, 0, 1, 1, 1, 0.55 * fade, true);
      }
    }
  }
}

// ---------- treasure maps ----------
// Now and then an island has a bottle bobbing at its shore with a piece of map in it: sail into it to take it. Three
// pieces mark an X on the shore of another island at least 35 away (a gold arrow by the ship points the way). Stop
// beside the X for 3 s and the crew digs up the treasure: coins (more in later oceans), a chest of powers and a
// scroll. Then the hunt can start again. OC.extra is kept with a resumed run.
const TREASURE = { chance: 0.3, reach: 2.6, far: 35, dig: 3 };
function seaTreasureIsle(I, rnd) {
  const X = OC.extra;
  if (!X || X.x || X.pieces >= 3 || I.floe !== undefined || OC.isles.some(J => J.piece)) {
    // the X waits for the next island far enough away
    if (X && X.wantX && I.floe === undefined && Math.hypot(I.x - OC.ship.x, I.z - OC.ship.z) > TREASURE.far) seaPlantX(I);
    return;
  }
  if (rnd() > TREASURE.chance) return;
  const L = isleLobes(I)[isleLobes(I).length - 1], ax = L.x - I.x, az = L.z - I.z, al = Math.hypot(ax, az) || 1, a = al > 0.1 ? Math.atan2(az, ax) : rnd() * TAU;
  I.piece = { x: L.x + Math.cos(a) * (L.r + 0.9), z: L.z + Math.sin(a) * (L.r + 0.9), ph: rnd() * TAU };
}
function seaPlantX(I) {
  const X = OC.extra, L = isleLobes(I)[0], a = Math.atan2(OC.ship.z - I.z, OC.ship.x - I.x);
  X.x = { x: L.x + Math.cos(a) * L.r * 0.88, z: L.z + Math.sin(a) * L.r * 0.88 }; X.wantX = false; X.dig = 0;
}
function seaTreasureTick(dt) {
  const X = OC.extra, S = OC.ship, run = G.run;
  if (!X || OC.sink) return;
  for (const I of OC.isles) {
    const p = I.piece;
    if (!p || Math.hypot(S.x - p.x, S.z - p.z) > TREASURE.reach + shipDef().wid * 0.4) continue;
    I.piece = null; X.pieces++;
    FX.burst(p.x, 0.6, p.z, 16, [1, 0.88, 0.5], 4, 0.1, 0.6, 3); AUDIO.play('chest');
    if (X.pieces < 3) UI.toast(`🗺 Map piece ${X.pieces} of 3!`, 2.4);
    else {
      // the X goes on the nearest island far enough away, or the next one found
      const far = OC.isles.filter(J => J !== I && J.floe === undefined && Math.hypot(J.x - S.x, J.z - S.z) > TREASURE.far).sort((a, b) => Math.hypot(a.x - S.x, a.z - S.z) - Math.hypot(b.x - S.x, b.z - S.z));
      if (far.length) seaPlantX(far[0]); else X.wantX = true;
      UI.banner('X MARKS THE SPOT!'); UI.toast('The map is whole! Follow the gold arrow to the treasure.', 3.5);
    }
  }
  const T = X.x;
  if (!T) return;
  const d = Math.hypot(S.x - T.x, S.z - T.z), still = Math.hypot(S.vx, S.vz) < 1.2;
  if (d < 4.6 && still && G.state === 'run') {
    X.dig += dt;
    if (Math.random() < dt * 10) FX.part(T.x + rand(-0.4, 0.4), 0.5, T.z + rand(-0.4, 0.4), rand(-1, 1), rand(2, 3.5), rand(-1, 1), 0.08, 0.04, 0.6, [0.85, 0.75, 0.5], 1, 1, 8);
    if (X.dig >= TREASURE.dig) {
      const coins = 40 + 8 * run.chapter;
      run.coins += coins; run.chestQueued = (run.chestQueued || 0) + 1; run.scrolls = (run.scrolls || 0) + 1;
      X.found = (X.found || 0) + 1; X.pieces = 0; X.x = null; X.dig = 0;
      FX.ring(T.x, T.z, 4, [1, 0.85, 0.3], 0.7, 1);
      for (let i = 0; i < 30; i++) FX.part(T.x, 0.8, T.z, rand(-3, 3), rand(4, 8), rand(-3, 3), 0.12, 0.06, 1.2, [1, 0.85, 0.3], 1, 3, 9);
      AUDIO.play('chest'); AUDIO.play('coin'); G.hero.emote('happy', 2.5);
      UI.banner('TREASURE!', true); UI.toast(`+${coins} coins, a chest and a scroll!`, 3);
    }
  } else X.dig = Math.max(0, X.dig - dt * 0.6);
}
function emitSeaTreasure() {
  const X = OC.extra, S = OC.ship, t = OC.t;
  if (!X) return;
  for (const I of OC.isles) {
    const p = I.piece;
    if (!p || !onScreen(p.x, p.z, 2)) continue;
    // a bottle with a map in it, bobbing, glinting
    pushImp(p.x, 0.2 + Math.sin(t * 2 + p.ph) * 0.08, p.z, 0.42, 0, 0, 1, 1, 30, 0, 0.18, t * 0.6 + p.ph, 0, 0, 0, 1);
    FX.glow(p.x, 0.6, p.z, 1.1, [1, 0.88, 0.5], 0.05, 0.35 + 0.15 * Math.sin(t * 5));
    const br = 0.8 + 0.1 * Math.sin(t * 3 + p.ph);
    pushDecal(p.x, p.z, br, br, 0, 3, 0, 0.5, 1, 1, 1, 0.5, true);
  }
  const T = X.x;
  if (!T) return;
  if (onScreen(T.x, T.z, 3)) {
    // a red X on the sand and a column of light, a ring that fills while the crew digs
    for (const r of [Math.PI / 4, -Math.PI / 4]) pushDecal(T.x, T.z, 0.35, 1.5, r, 1, 0, 0, 0.95, 0.12, 0.1, 0.95);
    FX.glow(T.x, rand(0.5, 3), T.z, 0.9, [1, 0.85, 0.35], 0.06, 0.4);
    if (X.dig > 0) pushDecal(T.x, T.z, 2.2, 2.2, 0, 4, 0, clamp(X.dig / TREASURE.dig, 0, 1), 1, 0.82, 0.3, 0.9);
  }
  const d = Math.hypot(T.x - S.x, T.z - S.z);
  if (d > 7) {
    // the gold arrow by the ship
    const ux = (T.x - S.x) / d, uz = (T.z - S.z) / d, k = shipDef().len * 0.5 + 2.6;
    pushDecal(S.x + ux * k, S.z + uz * k, 1.3, 1.3, Math.atan2(ux, uz), 11, 0, 0, 1, 0.82, 0.25, 0.75 + 0.25 * Math.sin(t * 6), true);
  }
}

// ---------- the whale ----------
// Every minute and a half or two, unless a boss is up, a great whale surfaces near the ship (bubbles first),
// swims along slowly for 16 s and blows a spout every 3.6 s. Sailing through the spout patches 12% of the hull,
// once a spout. Then it dives. It does no harm and takes none.
const WHALE = { every: [80, 140], stay: 16, spout: 3.6, heal: 0.12 };
function seaWhaleTick(dt) {
  const run = G.run, S = OC.ship;
  if (OC.sink) return;
  let W = OC.whale;
  if (!W) {
    if (run.bossStarted || !R.enemyDraw.whale) return;
    OC.whaleT = (OC.whaleT ?? rand(40, 80)) - dt;
    if (OC.whaleT > 0) return;
    OC.whaleT = rand(...WHALE.every);
    const head = Math.hypot(S.vx, S.vz) > 1 ? Math.atan2(S.vx, S.vz) : S.yaw, side = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < 6; i++) {
      const a = head + side * rand(0.5, 1.2), x = S.x + Math.sin(a) * 12, z = S.z + Math.cos(a) * 12;
      if (inIsle(x, z, 7)) continue;
      W = OC.whale = { x, z, yaw: head + rand(-0.4, 0.4), t: 0, rise: 0, spoutT: 2.6, spout: 0, healed: false };
      UI.toast('🐋 A whale! Sail through its spout to patch the hull.', 3.2);
      break;
    }
    if (!W) return;
  }
  W.t += dt;
  if (W.t < 1.5) { if (Math.random() < dt * 30) FX.part(W.x + rand(-2, 2), 0.1, W.z + rand(-2, 2), 0, rand(0.6, 1.2), 0, 0.08, 0.14, 0.6, [0.85, 0.97, 1], 0.8, 4, 0, 0.5); return; }
  const leaving = W.t > WHALE.stay;
  W.rise = clamp(W.rise + (leaving ? -dt * 0.6 : dt), 0, 1);
  if (leaving && W.rise <= 0) { OC.whale = null; return; }
  // swims slowly on, turning away from islands
  const ux = Math.sin(W.yaw), uz = Math.cos(W.yaw);
  if (inIsle(W.x + ux * 7, W.z + uz * 7, 2)) W.yaw += dt * 0.8;
  W.x += ux * 1.2 * dt; W.z += uz * 1.2 * dt;
  W.spoutT -= dt;
  if (W.spoutT <= 0 && !leaving) { W.spoutT = WHALE.spout; W.spout = 1.6; W.healed = false; AUDIO.play('splash', 0.7); }
  if (W.spout > 0) {
    W.spout -= dt;
    const bx = W.x + ux * 2.0, bz = W.z + uz * 2.0;
    for (let i = 0; i < 3; i++) FX.part(bx + rand(-0.2, 0.2), 0.6, bz + rand(-0.2, 0.2), rand(-0.6, 0.6), rand(6, 8.5), rand(-0.6, 0.6), 0.14, 0.32, 0.9, [0.88, 0.96, 1], 0.8, 1, 9, 0.5);
    if (!W.healed && Math.hypot(S.x - bx, S.z - bz) < 2.2 + shipDef().wid * 0.4) {
      W.healed = true;
      const before = run.hp;
      run.hp = Math.min(run.maxHp, run.hp + run.maxHp * WHALE.heal);
      FX.ring(S.x, S.z, shipDef().len * 0.7, [0.6, 1, 0.8], 0.6, 1); AUDIO.play('shield'); G.hero.emote('happy', 1.6);
      addNumberAt(S.x, 2.4, S.z, '+' + Math.round(run.hp - before), [0.5, 1, 0.65]);
    }
  }
}
function emitSeaWhale() {
  const W = OC.whale;
  if (!W || W.t < 1.5 || !R.enemyDraw.whale || !onScreen(W.x, W.z, 6)) return;
  const e = easeOutBack(clamp(W.rise, 0, 1)), y = -1.9 + 1.25 * e + Math.sin(OC.t * 0.9) * 0.06, M = MODELS.defs.whale;
  seaShadow(W.x, W.z, 1.8, 4.6, -W.yaw, 0.7 * W.rise);
  pushEnemy('whale', false, W.x, y, W.z, W.yaw, M.clips.still.row, 1, 1, 0, 0, 0, 1, 1, 1);
  const br = 1 + 0.05 * Math.sin(OC.t * 2);
  pushDecal(W.x, W.z, 1.9 * br, 4.4 * br, -W.yaw, 3, 0, 0.5, 1, 1, 1, 0.45 * W.rise, true);
}

// ---------- the drowned city (ocean 20) ----------
// The towers stand in city blocks along streets: each 46-wide area is a block with a pair of towers along one of
// its axes (now and then an empty square of water), so canals about 15 wide run between them on the grid lines,
// and the ship starts at a crossroads. A third of the foes come round the far side of a tower near the ship.
const seaCity = () => G.run && G.run.sea && SEA_CHAPTERS[G.run.chapter - 1].mech === 'edge';
function seaCityBlock(cx, cz, rnd) {
  if (rnd() > 0.88) return;
  const mx = (cx + 0.5) * ISLE_CHUNK, mz = (cz + 0.5) * ISLE_CHUNK, along = rnd() < 0.5;
  for (const s of [-1, 1]) {
    const x = mx + (along ? s * 9.5 : 0) + (rnd() * 2 - 1) * 1.2, z = mz + (along ? 0 : s * 9.5) + (rnd() * 2 - 1) * 1.2;
    if (Math.hypot(x, z) < 20) continue;
    seaMakeIsle(x, z, rnd, { city: true });
  }
}
function seaAmbushPoint() {
  const S = OC.ship;
  const near = OC.isles.filter(I => I.floe === undefined && Math.hypot(I.x - S.x, I.z - S.z) < 28).sort(() => Math.random() - 0.5);
  for (const I of near) {
    const dx = I.x - S.x, dz = I.z - S.z, d = Math.hypot(dx, dz) || 1, k = isleReach(I) + 1.6;
    const x = I.x + dx / d * k + rand(-1.5, 1.5), z = I.z + dz / d * k + rand(-1.5, 1.5);
    if (!inIsle(x, z, 0.8) && Math.hypot(x - S.x, z - S.z) > 9) return [x, z];
  }
  return null;
}
