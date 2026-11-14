// ============================================================
// Picking a run up again. Closing the laptop lid can cost the page its graphics (the driver drops the WebGL
// context) or the whole tab (the browser discards it and reloads it on return); either way the run used to be
// gone and the game opened on the home screen. Now the run is kept as a checkpoint (every few seconds, and
// whenever the page is hidden) and the next start goes straight back into it, paused. If the graphics are lost
// mid-run the page reloads itself into the same run.
//
// What comes back: the mode, the chapter (or ocean, or Boss Rush and Endless map), the time, level, XP and the
// level-ups still owed, every power with its level and evolution, health, coins, scrolls, kills, rerolls, the
// revive used or not, where the blob (or the ship) was, the timeline still to come, a boss fight in progress
// (the boss drops back in with the health it had) and any miniboss alive (likewise). The swarm on screen at that
// moment does not: fresh foes stream in as usual.
// ============================================================
const RESUME_KEY = 'projectGel.run.v1';
const RESUME = { t: 0, pending: null };
function runSnapshot() {
  const run = G.run;
  if (!run || run.over || run.won || !G.hero) return null;
  if (!['run', 'pause', 'levelup', 'chest', 'revive'].includes(G.state) || run.hp <= 0) return null;
  const h = G.hero.pos, sum = (l, k) => l.reduce((s, e) => s + e[k], 0);
  const alive = run.bosses.filter(b => !b.dying);
  const boss = run.bossStarted && alive.length ? { frac: clamp(sum(alive, 'hp') / Math.max(1, sum(alive, 'maxHp')), 0.05, 1), ids: [...new Set(alive.map(b => b.type))] } : null;
  const minis = run.enemies.filter(e => e.mini && !e.dying && e.miniK !== undefined).map(e => ({ k: e.miniK, frac: clamp(e.hp / e.maxHp, 0.05, 1) }));
  const keep = ['chapter', 't', 'level', 'xp', 'xpNext', 'pending', 'rerolls', 'hp', 'kills', 'bossKills', 'eliteKills', 'gooblins', 'evos', 'coins', 'scrolls', 'revived', 'rushK', 'powerCap', 'evoSeen', 'medals'];
  const S = { v: 1, at: Date.now(), mode: run.sea ? 'sea' : run.endless ? 'endless' : run.rush ? 'rush' : 'land' };
  for (const k of keep) if (run[k] !== undefined) S[k] = run[k];
  S.slots = run.slots.map(s => ({ id: s.id, lvl: s.lvl, evo: !!s.evo }));
  S.events = run.events.map(e => ({ ...e }));
  S.boss = boss; S.minis = minis; S.pos = [h[0], h[2]];
  if (run.sea) S.ship = { x: OC.ship.x, z: OC.ship.z, yaw: OC.ship.yaw };
  if (run.sea && OC.extra) S.seaExtra = OC.extra;
  return S;
}
function saveRunCheckpoint() {
  const S = runSnapshot();
  if (!S) return false;
  try { localStorage.setItem(RESUME_KEY, JSON.stringify(S)); return true; } catch (_) { return false; }
}
function clearRunCheckpoint() { RESUME.pending = null; try { localStorage.removeItem(RESUME_KEY); } catch (_) { /* ignore */ } }
function loadRunCheckpoint() {
  try {
    const raw = localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const S = JSON.parse(raw);
    // (a checkpoint that failed to load twice is dropped rather than tried forever)
    if (!S || S.v !== 1 || !Array.isArray(S.slots) || (S.tries || 0) >= 2) { clearRunCheckpoint(); return null; }
    return S;
  } catch (_) { clearRunCheckpoint(); return null; }
}
// every few seconds of a run (cheap: a few KB of JSON)
function resumeTick(dt) {
  RESUME.t += dt;
  if (RESUME.t < 4) return;
  RESUME.t = 0;
  if (G.run && !G.run.over) saveRunCheckpoint();
}
// the start of the game: back into the interrupted run, if there is one
function resumeOnBoot() {
  const S = loadRunCheckpoint();
  if (!S) return false;
  S.tries = (S.tries || 0) + 1;
  try { localStorage.setItem(RESUME_KEY, JSON.stringify(S)); } catch (_) { /* ignore */ }
  RESUME.pending = S;
  if (S.mode === 'sea') beginSeaChapter(S.chapter);
  else beginChapter(S.chapter, S.mode === 'endless' ? { endless: true, powerCap: S.powerCap } : S.mode === 'rush' ? { rush: true, powerCap: S.powerCap } : undefined);
  return true;
}
// a skill evolved without the fanfare
function quietEvolve(id) {
  const run = G.run, s = slotOf(id), E = EVOLUTIONS[id];
  if (!s || !E || s.evo) return;
  const rows = SKILLS[id].levels, top = rows[rows.length - 1];
  s.evo = true; s.evoL = { ...top, ...E.boost(top) };
  if (id === 'frostnova') run.absZero = true;
  recomputeStats();
  if (SKILL_HOOKS[id] && SKILL_HOOKS[id].onLevel) SKILL_HOOKS[id].onLevel(s);
}
// called by startRun / startSea once the fresh run is set up: lay the saved one over it
function applyResume() {
  const S = RESUME.pending;
  RESUME.pending = null;
  if (!S || !G.run) return;
  const run = G.run, toast = UI.toast, banner = UI.banner, sound = AUDIO.enabled, state = G.state;
  // (rebuilding the powers would otherwise announce every level and every new ship)
  UI.toast = UI.banner = () => {}; AUDIO.enabled = false; G.state = 'resume';
  try {
    run.slots.length = 0;
    for (const sl of S.slots) {
      if (!SKILLS[sl.id] && !PASSIVES[sl.id]) continue;
      for (let i = 0; i < sl.lvl; i++) addOrLevel(sl.id);
      if (sl.evo) quietEvolve(sl.id);
    }
    for (const k of ['t', 'level', 'xp', 'xpNext', 'pending', 'rerolls', 'kills', 'bossKills', 'eliteKills', 'gooblins', 'evos', 'coins', 'scrolls', 'revived', 'medals']) if (S[k] !== undefined) run[k] = S[k];
    run.evoSeen = S.evoSeen || {};
    recomputeStats();
    run.hp = clamp(S.hp, 1, run.maxHp);
    run.events = (S.events || []).filter(e => e && typeof e.t === 'number');
    if (S.mode === 'rush') {
      run.rushK = S.rushK || 0;
      if (S.boss) run.events.push({ t: run.t + 2.5, kind: 'eboss', ids: S.boss.ids, hpFrac: S.boss.frac });
      else if (!run.events.some(e => e.kind === 'eboss')) rushNext(run);
    } else if (S.boss) run.events.push({ t: run.t + 2.5, kind: 'boss', hpFrac: S.boss.frac });
    for (const m of S.minis || []) run.events.push({ t: run.t + 2, kind: 'mini', k: m.k, hpFrac: m.frac });
    run.events.sort((a, b) => a.t - b.t);
    if (run.sea) {
      const sh = S.ship || { x: 0, z: 0, yaw: 0 };
      Object.assign(OC.ship, { x: sh.x, z: sh.z, yaw: sh.yaw, vx: 0, vz: 0, speed: 0, yawV: 0 });
      if (S.seaExtra) OC.extra = S.seaExtra;
      OC.isles.length = 0; OC.chunks.clear(); seaIslands(true);
      seaPlaceHero(0);
    } else if (S.pos) {
      G.hero.reset(S.pos[0], S.pos[1]);
      HERO_PT.x = S.pos[0]; HERO_PT.z = S.pos[1];
      if (resolveCircle(HERO_PT, HERO_R)) { G.hero.pos[0] = HERO_PT.x; G.hero.pos[2] = HERO_PT.z; }
    }
    run.invuln = 3;
    G.cam.x = G.hero.pos[0]; G.cam.z = G.hero.pos[2];
  } finally { UI.toast = toast; UI.banner = banner; AUDIO.enabled = sound; G.state = state; }
  FX.clear();
  run.resumed = true;
  saveRunCheckpoint();
  // waits, paused, for the player to carry on
  if (G.state === 'run') pauseGame();
  UI.toast('Welcome back! Your run picks up where you left it.', 4);
}
// a boss or miniboss dropped back in by a resumed run takes back the health it had
function resumeHp(ev, list) { if (ev && ev.hpFrac) for (const b of list) b.hp = b.maxHp * ev.hpFrac; }

// lost graphics (a laptop asleep, a driver reset): keep the run and reload into it, unless that keeps happening
function onGraphicsLost() {
  const kept = saveRunCheckpoint();
  saveGame();
  let hist = [];
  try { hist = JSON.parse(sessionStorage.getItem('projectGel.glReload') || '[]').filter(t => Date.now() - t < 120000); } catch (_) { /* ignore */ }
  if (hist.length < 3) {
    hist.push(Date.now());
    try { sessionStorage.setItem('projectGel.glReload', JSON.stringify(hist)); } catch (_) { /* ignore */ }
    setState('loading');
    $('loadTip').hidden = false; $('loadTip').textContent = kept ? 'The graphics restarted. Picking your run back up…' : 'The graphics restarted. Reloading…';
    setTimeout(() => location.reload(), 400);
    return;
  }
  setState('loading');
  showLoadError('The graphics driver keeps stopping the game. ' + (kept ? 'Your run is saved: reload the page to carry on.' : 'Reload the page to keep playing.'));
}
