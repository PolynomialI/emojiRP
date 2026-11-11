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
  G.run.gooblins++;
  for (let i = 0; i < 16; i++) spawnPickup('coin', e.x + rand(-0.8, 0.8), e.z + rand(-0.8, 0.8), randInt(2, 4));
  spawnPickup('chest', e.x, e.z);
  if (Math.random() < scrollOdds()) spawnPickup('scroll', e.x + 0.6, e.z);
  FX.ring(e.x, e.z, 4, [1, 0.85, 0.3], 0.6, 1); FX.burst(e.x, 0.8, e.z, 30, [1, 0.85, 0.3], 7, 0.14, 0.7, 3);
  UI.toast('Gooblin caught! Grab the loot!', 2);
  AUDIO.play('levelup', 1.2);
}

// ---------- Endless: survive as long as you can, on a random map from any chapter. Enemies are completely
// random (any type from any chapter, now and then an elite), with no waves and no bosses, and the stream
// thickens and toughens quickly: after five minutes it is a flood. Scored by time alone. ----------
const ENDLESS = { rate0: 1.6, rateT: 22, hpT: 75, dmgT: 160, elite: 0.04 };
function endlessUnlocked() { return true; }
function beginEndless() {
  if (!endlessUnlocked()) return;
  beginChapter(randInt(1, ENDLESS_MAPS()), { endless: true, powerCap: CHAPTER_COUNT });
}
// every chapter's map can come up (chapter 20's crater field too, without its cave)
const ENDLESS_MAPS = () => CHAPTER_COUNT;
function endlessEvents() { return []; }
// spawns a second: about 15 a second after five minutes
const endlessRate = t => ENDLESS.rate0 + t / ENDLESS.rateT;
// enemies toughen by the second rather than by chapter
function endlessTick(run) {
  const t = run.t;
  run.info.hpMul = 1 + t / ENDLESS.hpT; run.info.dmgMul = 1 + t / ENDLESS.dmgT; run.info.speedMul = 1 + Math.min(0.45, t / 800);
}
// any enemy type at all (not the Gooblin)
const ENDLESS_POOL = () => Object.keys(ENEMY_TYPES).filter(k => k !== 'gooblin' && R.enemyDraw[ENEMY_TYPES[k].model]);
// a boss beaten in Endless drops its loot and the run goes on
function endlessBossDown(run) {
  for (const b of run.bosses) spawnPickup('chest', b.x, b.z);
  run.bosses = []; run.bossStarted = false; run.bossTotalHp = 0;
  UI.toast('Boss down! Keep going!', 2);
}

// ============================================================
// Boss Rush: every chapter boss, one after another, on the selected chapter's map.
// You start with a handful of free upgrades and earn more after each boss; a light trickle of
// regular enemies keeps the skills fed. Open to everyone from the start.
// ============================================================
const RUSH = { startPicks: 8, picksPerBoss: 3, breather: 5, heal: 0.35 };
function rushUnlocked() { return true; }
function beginBossRush() {
  if (!rushUnlocked()) return;
  beginChapter(G.save.selected, { rush: true, powerCap: Math.max(G.save.chapter, CHAPTER_BOSSES.length) });
}
// free level-ups: they count as levels, so the level shown always matches the number of upgrades picked
function rushPicks(run, n) { run.level += n; run.xpNext = xpFor(run.level); run.pending += n; }
// line up the next boss; each one is a little tougher than the last
function rushNext(run) {
  const k = run.rushK;
  Object.assign(run.info, { bossHpMul: 0.5 + 0.13 * k, dmgMul: 1 + 0.05 * k, hpMul: 1 + 0.12 * k, rateMul: 1 });
  run.events.push({ t: run.t + (k ? RUSH.breather : 3), kind: 'eboss', ids: [CHAPTER_BOSSES[k]] });
}
function rushStart(run) { run.rushK = 0; rushPicks(run, RUSH.startPicks); rushNext(run); }
// a boss is down: loot, a breather, some health back and free upgrades. Returns true once the last one falls.
function rushBossDown(run) {
  for (const b of run.bosses) spawnPickup('chest', b.x, b.z);
  run.bosses = []; run.bossStarted = false; run.bossTotalHp = 0;
  run.rushK++;
  if (run.rushK >= CHAPTER_BOSSES.length) return true;
  run.hp = Math.min(run.maxHp, run.hp + run.maxHp * RUSH.heal);
  rushPicks(run, RUSH.picksPerBoss);
  UI.toast(`Boss ${run.rushK} of ${CHAPTER_BOSSES.length} down!`, 2.2);
  rushNext(run);
  return false;
}
