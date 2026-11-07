// ============================================================
// Run events beyond the timeline basics: the Golden Gooblin
// ============================================================

// ---------- the Golden Gooblin: a treasure runner that flees, spills coins when hit, and escapes in time ----------
const GOOBLIN = { life: 18, coinGap: 0.15 };
function spawnGooblin() {
  const run = G.run, h = G.hero.pos;
  // it pops up in sight, a fair distance away, and runs
  let x = h[0], z = h[2];
  for (let i = 0; i < 12; i++) {
    const a = rand(0, TAU), r = rand(5, 6.5);
    x = h[0] + Math.cos(a) * r; z = h[2] + Math.sin(a) * r;
    if (arenaSd(x, z) < -3 && !blockedAt(x, z, 0.8)) break;
  }
  const e = spawnEnemy('gooblin', x, z);
  e.life = GOOBLIN.life; e.spawnT = 0.3;
  FX.ring(x, z, 3, [1, 0.85, 0.3], 0.5); FX.burst(x, 0.6, z, 16, [1, 0.85, 0.3], 4, 0.12, 0.5, 3);
  UI.toast('A Golden Gooblin! Catch it before it gets away!', 2.6);
  AUDIO.play('chest');
  return e;
}
function fleeAI(e, dt) {
  const h = G.hero.pos, run = G.run;
  e.life -= dt;
  if (e.stunT > 0) { e.stunT -= dt; e.vx *= 0.85; e.vz *= 0.85; e.x += e.vx * dt; e.z += e.vz * dt; return; }
  let dx = e.x - h[0], dz = e.z - h[2];
  const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
  // away from the hero with a zigzag, sliding along the walls instead of running into them
  const zig = Math.sin(run.t * 2.3 + e.id) * 0.6;
  let fx = dx - dz * zig, fz = dz + dx * zig;
  const sd = arenaSd(e.x, e.z);
  if (sd > -7) { const n = arenaNormal(e.x, e.z, [0, 0]), w = clamp((sd + 7) / 4, 0, 1.5); fx -= n[0] * w * 1.8; fz -= n[1] * w * 1.8; }
  const l = Math.hypot(fx, fz) || 1; fx /= l; fz /= l;
  steerAround(e.x, e.z, e.radius, fx, fz, 6, STEER); fx = STEER[0]; fz = STEER[1];
  // a burst of speed when the hero gets close, a jog otherwise: catchable, but only just
  const want = e.speed * e.slowMul * (d < 5 ? 1.12 : 0.8);
  const k = 1 - Math.exp(-8 * dt);
  e.vx += (fx * want - e.vx) * k; e.vz += (fz * want - e.vz) * k;
  e.x += e.vx * dt; e.z += e.vz * dt;
  e.yaw = angleLerp(e.yaw, Math.atan2(e.vx, e.vz), Math.min(1, dt * 10));
  e.phase += dt * Math.hypot(e.vx, e.vz) / (0.85 * e.scale);
  if (Math.random() < 0.35) FX.star(e.x + rand(-0.3, 0.3), rand(0.3, 0.9), e.z + rand(-0.3, 0.3), 0.18, [1, 0.85, 0.3], 0.5);
  if (e.life <= 0) {
    // gone: a puff of gold and it's away with the loot
    e.dying = 1;
    FX.ring(e.x, e.z, 2.5, [1, 0.85, 0.3], 0.4); FX.burst(e.x, 0.6, e.z, 20, [1, 0.85, 0.3], 5, 0.12, 0.5, 3);
    UI.toast('The Gooblin got away!', 1.8);
  }
}
// every hit staggers it and knocks a coin loose
function gooblinHit(e) {
  e.stunT = 0.22;
  const run = G.run;
  if ((e.coinAt || 0) > run.t) return;
  e.coinAt = run.t + GOOBLIN.coinGap;
  spawnPickup('coin', e.x, e.z, 1);
}
// caught: the whole sack bursts
function gooblinLoot(e) {
  for (let i = 0; i < 16; i++) spawnPickup('coin', e.x + rand(-0.8, 0.8), e.z + rand(-0.8, 0.8), randInt(2, 4));
  spawnPickup('chest', e.x, e.z);
  spawnPickup('scroll', e.x + 0.6, e.z);
  FX.ring(e.x, e.z, 4, [1, 0.85, 0.3], 0.6, 1); FX.burst(e.x, 0.8, e.z, 30, [1, 0.85, 0.3], 7, 0.14, 0.7, 3);
  UI.toast('Gooblin caught! Grab the loot!', 2);
  AUDIO.play('levelup', 1.2);
}

// ---------- Endless: survive as long as you can on a random map; it keeps getting harder ----------
const ENDLESS = { unlockAfter: 3, tierEvery: 50, bossEvery: 120 };
function endlessUnlocked() { return !!G.save.cleared[ENDLESS.unlockAfter] || G.save.chapter > ENDLESS.unlockAfter; }
// the map comes from a chapter already reached; power-ups from every chapter reached are on offer
function beginEndless() {
  if (!endlessUnlocked()) return;
  const reached = Math.min(G.save.chapter, CHAPTER_BOSSES.length), ch = randInt(1, reached);
  beginChapter(ch, { endless: true, powerCap: Math.max(reached, G.save.chapter) });
}
function endlessEvents() {
  const ev = [];
  for (let k = 0; k < 40; k++) {
    const t0 = k * ENDLESS.bossEvery;
    ev.push({ t: t0 + 50, kind: 'swarm', n: 14 + k * 4 }, { t: t0 + 80, kind: 'elite' });
    if (k % 2 === 0) ev.push({ t: t0 + rand(30, 100), kind: 'gooblin' });
    // a boss every two minutes, working through all ten; every third visit brings an old friend along
    if (k > 0) {
      const main = CHAPTER_BOSSES[(k - 1) % CHAPTER_BOSSES.length];
      ev.push({ t: t0, kind: 'eboss', ids: k % 3 === 0 ? [main, GUEST_BOSSES[(k / 3 - 1) % GUEST_BOSSES.length]] : [main] });
    }
  }
  return ev.sort((a, b) => a.t - b.t);
}
// every tierEvery seconds the enemies take on the next chapter's toughness
function endlessTick(run) {
  const tier = Math.floor(run.t / ENDLESS.tierEvery);
  if (tier === run.tier) return;
  run.tier = tier;
  const T = chapterInfo(1 + tier);
  Object.assign(run.info, { hpMul: T.hpMul, dmgMul: T.dmgMul, rateMul: T.rateMul, bossHpMul: T.bossHpMul * (tier > 0 ? 0.8 : 1), has: T.has });
  if (tier > 0) UI.toast(`Endless · danger ${tier + 1}`, 1.6);
}
// a boss beaten in Endless drops its loot and the run goes on
function endlessBossDown(run) {
  for (const b of run.bosses) spawnPickup('chest', b.x, b.z);
  run.bosses = []; run.bossStarted = false; run.bossTotalHp = 0;
  UI.toast('Boss down! Keep going!', 2);
}
