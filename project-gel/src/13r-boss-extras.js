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

// ---------- the Codex (the Achievements screen's second tab) ----------
// Every foe, miniboss and boss, land and sea: the ones met show their picture, how many fell, where they were first
// met and, for bosses, the fastest kill (chapter and ocean runs) and the Boss Rush medal. Kept in sv.codex:
// { key: { k: kills, at: 'Chapter 3', t: best seconds } }; keys are the enemy type, 'boss:<id>', 'mini:c<n>' (a
// chapter's miniboss) or 'mini:o<n>' (an ocean's).
function codexKey(e) { const run = G.run; return e.boss && !e.mini ? 'boss:' + e.type : e.mini ? 'mini:' + (run.sea ? 'o' : 'c') + run.chapter : e.type; }
function codexWhere() { const run = G.run; return run.rush ? 'Boss Rush' : run.endless ? 'Endless' : run.sea ? 'Ocean ' + run.chapter : 'Chapter ' + run.chapter; }
function codexEntry(k) { const C = G.save.codex = G.save.codex || {}; return C[k] || (C[k] = { k: 0, at: codexWhere() }); }
function codexSeen(e) {
  if (!G.run || !e || !G.save) return;
  codexEntry(codexKey(e));
  if (e.boss && !e.mini) e.bornT = G.run.t;
}
function codexKill(e) {
  if (!G.run || !G.save) return;
  const c = codexEntry(codexKey(e));
  c.k++;
  // (the fastest boss kill counts chapter and ocean runs: Boss Rush keeps its own times, with its medals)
  if (e.boss && !e.mini && e.bornT !== undefined && !G.run.rush && !G.run.endless) {
    const s = Math.round((G.run.t - e.bornT) * 10) / 10;
    if (!c.t || s < c.t) c.t = s;
  }
}
// everything the Codex lists, in sections
function codexSections() {
  const land = Object.keys(ENEMY_TYPES).filter(k => !ENEMY_TYPES[k].sea && k !== 'mini');
  const sea = Object.keys(ENEMY_TYPES).filter(k => ENEMY_TYPES[k].sea);
  const ln = n => CHAPTER_INFO_NAME(n);
  return [
    { title: 'Chapter bosses', items: CHAPTER_BOSSES.map((id, i) => ({ key: 'boss:' + id, name: BOSS_TYPES[id].name, icon: 'boss-' + id, boss: id, home: `Chapter ${i + 1}` })) },
    { title: 'Ocean bosses', items: SEA_CHAPTERS.map((C, i) => ({ key: 'boss:' + C.boss, name: BOSS_TYPES[C.boss].name, icon: 'boss-' + C.boss, boss: C.boss, home: `Ocean ${i + 1}` })) },
    { title: 'Minibosses', items: [
      ...Object.keys(MINIBOSSES).map(n => ({ key: 'mini:c' + n, name: MINIBOSSES[n].name, icon: MINIBOSSES[n].boss ? 'boss-' + MINIBOSSES[n].boss : 'mini-c' + n, mini: MINIBOSSES[n], home: `Chapter ${n}` })),
      ...SEA_CHAPTERS.map((C, i) => C.mini && ({ key: 'mini:o' + (i + 1), name: C.mini.name, icon: 'mini-o' + (i + 1), seaMini: C.mini, home: `Ocean ${i + 1}` })).filter(Boolean)] },
    { title: 'Foes', items: land.map(k => ({ key: k, name: codexName(k), icon: 'foe-' + k, foe: k })) },
    { title: 'Sea foes', items: sea.map(k => ({ key: k, name: codexName(k), icon: 'foe-' + k, foe: k })) },
  ];
}
const CHAPTER_INFO_NAME = n => (typeof chapterInfo === 'function' ? chapterInfo(n).arenaName : '');
// a readable name for an enemy type: its own name if it has one, else its id tidied up
const CODEX_NAMES = { stickman: 'Goo Grunt', sprinter: 'Sprinter', helmet: 'Helmet Grunt', spear: 'Spearman', axe: 'Axeman', brute: 'Brute', archer: 'Archer', javelin: 'Javelin Thrower', splitter: 'Splitter',
  shield: 'Shield Bearer', bomber: 'Bomber', slime: 'Slime', gooblin: 'Golden Gooblin', knight: 'Knight', zombie: 'Zombie', toysoldier: 'Toy Soldier', healer: 'Goo Medic',
  pswim: 'Goo Pirate', pfloat: 'Floatie Pirate', ptube: 'Tube Pirate', phat: 'Hatted Pirate', pdiver: 'Diver', pbomb: 'Bomb Pirate', pparka: 'Parka Pirate', pmusket: 'Musketeer', pcapt: 'Pirate Captain',
  pweed: 'Weed Pirate', pmer: 'Merfolk', pblink: 'Lost Pilot', pskel: 'Skeleton Pirate', pballoon: 'Balloon Pirate', pjelly: 'Glow Jelly', pgummy: 'Gummy Bear', pangler: 'Anglerfish' };
const codexName = k => ENEMY_TYPES[k].name || CODEX_NAMES[k] || k.replace(/^./, c => c.toUpperCase()).replace(/(\d)/, ' $1');
// a foe's picture: its model standing, in its own color (rendered once, a couple a frame while the Codex is open)
function renderFoeIcon(key, model, tint) {
  if (ICONS.map[key] || !R.enemyDraw[model]) return !!ICONS.map[key];
  const m = MODELS.defs[model], clip = m.clips.idle || m.clips.run || m.clips.paddle || Object.values(m.clips)[0], t = hexToRgb(tint || '#f5891f');
  iconBegin(); R.resetStreams();
  pushEnemy(model, false, 0, 0, 0, 0.5, clip.row + 1, 1, 1, 0, 0, 0, t[0], t[1], t[2]);
  const top = m.top || 1.1;
  ICONS.map[key] = iconCapture([0.5 * top, top * 0.85, top * 1.6], [0, top * 0.5, 0], 0.62);
  iconEnd(); R.resetStreams();
  return true;
}
const CODEX = { queue: [] };
function codexIconFor(it) {
  if (ICONS.map[it.icon]) return true;
  if (it.boss) { renderBossPortraitOf(it.boss); return !!ICONS.map[it.icon]; }
  if (it.mini) { const M = it.mini; if (M.boss) { renderBossPortraitOf(M.boss); return !!ICONS.map[it.icon]; } return renderFoeIcon(it.icon, ENEMY_TYPES[M.type].model, M.tint); }
  if (it.seaMini) return renderFoeIcon(it.icon, 'pcapt', it.seaMini.tint);
  const D = ENEMY_TYPES[it.foe];
  return renderFoeIcon(it.icon, D.model, D.tint);
}
// once a frame on the home screens while the Codex is open: draw two missing pictures and put them in place
function pumpCodexIcons() {
  if (!CODEX.queue.length) return;
  let n = 0;
  for (let i = 0; i < CODEX.queue.length && n < 2; i++) {
    const it = CODEX.queue[i];
    // (one whose model is not built yet waits at the back)
    if (codexIconFor(it)) { CODEX.queue.splice(i--, 1); n++; document.querySelectorAll(`#codexList img[data-cx="${it.icon}"]`).forEach(im => { im.src = ICONS.map[it.icon]; im.classList.remove('pending'); }); }
    else n += 0.5;
  }
}

// ---------- the goo medic (ENEMY_TYPES.healer) ----------
// It hangs back behind the pack (about 6 from the blob, backing off inside 4.5). Every 3.2 s, if a foe near it is
// hurt, it raises its staff (the orb gathers light for half a second) and heals every foe within 4.5 by 30% of
// their health, with green beams to each (bosses and minibosses are never healed). Three at most at once.
const HEAL = { every: 3.2, cast: 0.55, radius: 4.5, amount: 0.3, keep: 6 };
function healerOrb(e) { const s = e.scale, c = Math.cos(e.yaw), n = Math.sin(e.yaw); return [e.x - c * 0.17 * s + n * 0.05 * s, 1.18 * s, e.z + n * 0.17 * s + c * 0.05 * s]; }
function healerAI(e, dt, d, want) {
  e.healT = (e.healT ?? rand(1.2, 2.2)) - dt;
  if (e.castT > 0) {
    e.castT -= dt;
    const o = healerOrb(e);
    FX.glow(o[0], o[1], o[2], 0.3 + (HEAL.cast - e.castT) * 0.9, [0.4, 1, 0.6], 0.06, 1);
    if (e.castT <= 0) healPulse(e);
    return 0;
  }
  if (e.healT <= 0) {
    e.healT = 0.7;
    let hurt = false;
    enemiesInRadius(e.x, e.z, HEAL.radius, o => { if (o !== e && !o.boss && !o.mini && !o.dying && o.hp < o.maxHp * 0.95) hurt = true; });
    if (hurt && onScreen(e.x, e.z, 1)) { e.castT = HEAL.cast; e.healT = HEAL.every; AUDIO.play('shield', 0.6); }
  }
  if (d < 4.5) return -e.speed * 0.7;
  if (d < HEAL.keep) return e.speed * 0.1;
  return want;
}
function healPulse(e) {
  const o = healerOrb(e);
  let n = 0;
  FX.ring(e.x, e.z, HEAL.radius, [0.35, 1, 0.55], 0.5, 0.7);
  enemiesInRadius(e.x, e.z, HEAL.radius, a => {
    if (a.boss || a.mini || a.dying || a.hp >= a.maxHp) return;
    a.hp = Math.min(a.maxHp, a.hp + a.maxHp * HEAL.amount);
    if (n++ < 8) addBolt(o[0], o[1], o[2], a.x, 0.6 * a.scale, a.z, 0.06, [0.4, 1, 0.6], 0.25);
    FX.glow(a.x, 0.7 * a.scale, a.z, 0.5, [0.4, 1, 0.6], 0.3, 0.8);
  });
}
