// ============================================================
// Bosses: weak points, and Boss Rush medals
// ============================================================

// ---------- weak points ----------
// After one of its big attacks lands (a warning of the boss's own at least this big: a circle, a long lane or a
// wide cone), a boss is left open for a moment: a glowing weak spot shows on it for 2 s, and every hit then does
// double. At most once every 7 s, so it rewards staying close rather than becoming a pattern. Land and sea bosses
// (not minibosses). TELE_OWNER is the boss whose turn it is while its AI runs (addTele marks its warnings).
const WEAK = { dur: 2, cd: 7, mul: 2, delay: 0.25 };
let TELE_OWNER = null;
const bigTele = t => (t.kind === 'circle' && t.r >= 2.6) || (t.kind === 'lane' && (t.len || 0) >= 7 && (t.r || 0) >= 0.7) || (t.kind === 'cone' && t.r >= 4);
// a boss's warning ran out: its attack has landed
function teleLanded(t) {
  const e = t.owner;
  if (!e || e.dying || e.mini || !bigTele(t) || e.weakCd > 0 || e.weakT > 0 || e.weakQ > 0) return;
  e.weakQ = WEAK.delay;
}
function weakTick(e, dt) {
  if (e.weakCd > 0) e.weakCd -= dt;
  if (e.weakQ > 0 && (e.weakQ -= dt) <= 0) {
    e.weakQ = 0; e.weakT = WEAK.dur; e.weakCd = WEAK.cd;
    addNumberAt(e.x, e.scale * 1.15 + 1.1, e.z, 'WEAK POINT!', [1, 0.78, 0.2]);
    AUDIO.play('crystal', 0.8);
  }
  if (e.weakT > 0) {
    e.weakT -= dt;
    // a pulsing glow on the side facing the camera, and sparks
    const p = weakSpot(e), pulse = 0.75 + 0.25 * Math.sin(G.run.t * 14);
    FX.glow(p[0], p[1], p[2], 0.55 * pulse * Math.max(1, e.scale * 0.35), [1, 0.72, 0.18], 0.06, 1);
    if (Math.random() < 0.35) FX.star(p[0] + rand(-0.3, 0.3), p[1] + rand(-0.3, 0.3), p[2] + rand(-0.2, 0.2), 0.18, [1, 0.9, 0.5], 0.35);
  }
}
const _ws = [0, 0, 0];
function weakSpot(e) { _ws[0] = e.x; _ws[1] = (e.y || 0) + e.scale * 0.75; _ws[2] = e.z + e.radius * 0.95; return _ws; }
// the ring on the ground while a boss is open (drawn with the warnings, on land and at sea)
function emitWeakRings(run) {
  for (const e of run.bosses) if (e.weakT > 0 && !e.dying) {
    const k = clamp(e.weakT / WEAK.dur, 0, 1), r = e.radius * 1.6;
    pushDecal(e.x, e.z, r, r, 0, 3, 0, 1 - k, 1, 0.8, 0.25, 0.55 * Math.min(1, k * 4), true);
  }
}

// ---------- Boss Rush medals ----------
// Each boss's kill time (from landing to falling) earns gold, silver or bronze against targets worked out from its
// Boss Rush health at its place in the line-up and the damage a build has by then. Best times and medals are kept
// per boss (sv.rushMedals), shown in the Codex and at the end of the run; gold on every boss earns the Rush Crown.
const RUSH_SLOW = { sandworm: 1.4, twins: 1.2, storm: 1.2, pumpking: 1.2, kraken: 1.25, hydra: 1.2, bigbounce: 1.15, jack: 1.1 };
function rushMedalTimes(id) {
  const k = Math.max(0, RUSH_BOSSES.indexOf(id)), B = BOSS_TYPES[id];
  const hp = B.hp * (0.5 + 0.13 * k) * (spareHurler(id) ? 1 : LAND_BOSS_HP), dps = (55 + 22 * k) / (RUSH_SLOW[id] || 1);
  const r5 = s => Math.max(5, Math.round(s / 5) * 5);
  return [r5(hp / (dps * 1.5)), r5(hp / dps), r5(hp / (dps * 0.55))];
}
const MEDAL_NAMES = ['', 'Bronze', 'Silver', 'Gold'], MEDAL_ICONS = ['', '🥉', '🥈', '🥇'];
function rushMedalFor(id, secs) { const [g, s, b] = rushMedalTimes(id); return secs <= g ? 3 : secs <= s ? 2 : secs <= b ? 1 : 0; }
// the boss is up: start its clock
function rushClockStart(run) { if (run.rush) run.rushT0 = run.t; }
// the boss is down: its medal, kept if it beats the best
function rushClockStop(run, id) {
  if (!run.rush || run.rushT0 === undefined) return;
  const secs = Math.round((run.t - run.rushT0) * 10) / 10, m = rushMedalFor(id, secs);
  run.medals = run.medals || [];
  run.medals.push({ id, t: secs, m });
  const sv = G.save, M = sv.rushMedals = sv.rushMedals || {}, old = M[id] || { t: 0, m: 0 };
  if (!old.t || secs < old.t) M[id] = { t: secs, m: Math.max(old.m || 0, m) };
  else if (m > old.m) M[id] = { t: old.t, m };
  run.rushT0 = undefined;
  const name = BOSS_TYPES[id].name;
  if (m) UI.banner(`${MEDAL_ICONS[m]} ${MEDAL_NAMES[m].toUpperCase()}!`, m === 3);
  UI.toast(m ? `${name}: ${secs}s, ${MEDAL_NAMES[m]}` : `${name}: ${secs}s (bronze at ${rushMedalTimes(id)[2]}s)`, 2.4);
  // gold on every boss: the Rush Crown (claimed on the Achievements screen)
  saveGame();
}
const rushGolds = sv => RUSH_BOSSES.filter(id => sv.rushMedals && sv.rushMedals[id] && sv.rushMedals[id].m >= 3).length;
const rushMedalsAny = sv => RUSH_BOSSES.filter(id => sv.rushMedals && sv.rushMedals[id] && sv.rushMedals[id].m >= 1).length;
