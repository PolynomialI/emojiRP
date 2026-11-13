// ============================================================
// Boot, background mesh building, input, home scene, main loop
// ============================================================
const INPUT = { keys: new Set(), stick: { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 }, moved: false };
const PERF = { acc: 0, frames: 0, ratio: 1, min: 0.6, max: 2, fps: 60, cap: 60, software: false };
// home scene: camera framing, the blob's spin (drag) and aim, and the faded foes it shoots in the background
// the home stage shows the ship on open water: on the ocean page, and in the Blobs screen's Ships tab
const seaStageOn = () => G.state === 'home' && ((UI.homePage === 'sea' && UI.menuTab === 'home') || (UI.menuTab === 'skins' && UI.blobTab === 'ships'));
const HOME = { view: () => (seaStageOn() ? Math.max(1, shipDef().len / 3) : 1), t: 0, actT: 2.5, frac: 0, lift: 0, side: 0, yaw: 0, spinV: 0, drag: null, idle: 9, aim: null, shootT: 1.5, foes: [], seaFoes: [], shots: [], portT: 0 };
const HOME_LIGHT = { skyCol: [0.78, 0.92, 1.0], groundCol: [0.3, 0.55, 0.92], lightCol: [1.0, 0.98, 0.95], fogCol: [0.1, 0.45, 0.95], spotMin: 1 };
const MESHJOB = { pending: [], done: new Set(), workers: [], fallback: false };
const nextFrame = () => new Promise(r => requestAnimationFrame(() => r()));

const WORKER_MAIN = `
let DEFS = null;
onmessage = (ev) => {
  const name = ev.data.name;
  if (!DEFS) DEFS = modelDefs();
  const t0 = performance.now();
  const m = buildMeshByName(DEFS, name);
  postMessage({ name, verts: m.verts, idx: m.idx, nv: m.nv, ni: m.ni, ms: performance.now() - t0 }, [m.verts.buffer, m.idx.buffer]);
};`;

// ---------- background mesh building ----------
function startMeshBuild() {
  MESHJOB.pending = MESH_ORDER.slice();
  const el = document.getElementById('workerSrc');
  const src = el ? el.textContent : '';
  try {
    if (!src || typeof Worker === 'undefined') throw new Error('no workers');
    const url = URL.createObjectURL(new Blob([src, '\n', WORKER_MAIN], { type: 'text/javascript' }));
    const n = clamp((navigator.hardwareConcurrency || 4) - 1, 1, 3);
    for (let i = 0; i < n; i++) {
      const w = new Worker(url);
      w.onmessage = ev => { w.job = null; onMeshBuilt(ev.data.name, ev.data); feedWorker(w); };
      w.onerror = () => meshFallback();
      MESHJOB.workers.push(w);
      feedWorker(w);
    }
  } catch (_) { meshFallback(); }
}
function feedWorker(w) {
  if (MESHJOB.fallback) return;
  const name = MESHJOB.pending.shift();
  if (!name) return;
  w.job = name;
  w.postMessage({ name });
}
// each built mesh's real bounds (rest pose), for framing icons
const MESHB = {};
function onMeshBuilt(name, mesh) {
  if (MESHJOB.done.has(name)) return;
  MESHJOB.done.add(name);
  const V = mesh.verts, lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < mesh.nv; i++) for (let a = 0; a < 3; a++) { const v = V[i * 14 + a]; if (v < lo[a]) lo[a] = v; if (v > hi[a]) hi[a] = v; }
  MESHB[name] = { lo, hi };
  R.addEnemyMesh(name, mesh);
}
function meshFallback() {
  if (MESHJOB.fallback) return;
  MESHJOB.fallback = true;
  for (const w of MESHJOB.workers) { if (w.job) MESHJOB.pending.unshift(w.job); w.terminate(); }
  MESHJOB.workers.length = 0;
  const defs = prepareModelDefs();
  const step = () => {
    const name = MESHJOB.pending.shift();
    if (!name) return;
    if (!MESHJOB.done.has(name)) onMeshBuilt(name, buildMeshByName(defs, name));
    setTimeout(step, 0);
  };
  setTimeout(step, 0);
}
function prioritizeMeshes(names) {
  for (const n of names.slice().reverse()) {
    const i = MESHJOB.pending.indexOf(n);
    if (i > 0) { MESHJOB.pending.splice(i, 1); MESHJOB.pending.unshift(n); }
  }
}
function ensureMeshNow(name) {
  if (R.enemyDraw[name]) return;
  const i = MESHJOB.pending.indexOf(name);
  if (i >= 0) MESHJOB.pending.splice(i, 1);
  onMeshBuilt(name, buildMeshByName(MODELS.defs || prepareModelDefs(), name));
}

// ---------- input ----------
// a little goo splash where a button is tapped (menus)
function tapSplash(e) {
  const b = e.target.closest && e.target.closest('button');
  if (!b || b.disabled || G.state !== 'home' && !['levelup', 'pause', 'results', 'chest'].includes(G.state)) return;
  const s = document.createElement('i'); s.className = 'tapfx'; s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
  document.body.append(s); setTimeout(() => s.remove(), 500);
}
function initInput(canvas) {
  document.addEventListener('pointerdown', tapSplash, true);
  window.addEventListener('keydown', e => {
    if (DEV.onKey(e)) return;
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    INPUT.keys.add(k);
    AUDIO.unlock();
    if ((k === 'escape' || k === 'p') && !e.repeat) { if (G.state === 'run') pauseGame(); else if (G.state === 'pause') resumeGame(); }
    if (G.state === 'levelup' && (k === '1' || k === '2' || k === '3')) UI.pick(Number(k) - 1);
    else if (G.state === 'levelup' && k === 'r' && !e.repeat) UI.reroll();
    else if (G.state === 'home' && k === 'escape' && !e.repeat) UI.back();
    else if (G.state === 'run' && /^[1-5]$/.test(k) && !e.repeat) useAbility(Number(k) - 1);
  });
  window.addEventListener('keyup', e => INPUT.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { INPUT.keys.clear(); INPUT.stick.active = false; if (G.state === 'run') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.state === 'run') pauseGame(); saveGame(); } });
  // the mouse position, always (the cave's crosshair follows it)
  window.addEventListener('pointermove', e => { INPUT.mx = e.clientX; INPUT.my = e.clientY; });
  canvas.addEventListener('pointerdown', e => {
    AUDIO.unlock();
    if (G.state === 'home') { pokeHero(e.clientX, e.clientY); return; }
    if (G.state === 'run' && G.run && G.run.cave) { INPUT.mx = e.clientX; INPUT.my = e.clientY; if (e.button === 0) caveClick(); return; }
    if (G.state !== 'run' || INPUT.stick.active) return;
    Object.assign(INPUT.stick, { active: true, id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  });
  canvas.addEventListener('pointermove', e => { if (INPUT.stick.active && e.pointerId === INPUT.stick.id) { INPUT.stick.x = e.clientX; INPUT.stick.y = e.clientY; } });
  const end = e => { if (e.pointerId === INPUT.stick.id) INPUT.stick.active = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
}
function readInput() {
  let x = 0, z = 0;
  const K = INPUT.keys, S = INPUT.stick;
  if (K.has('a') || K.has('arrowleft')) x -= 1;
  if (K.has('d') || K.has('arrowright')) x += 1;
  if (K.has('w') || K.has('arrowup')) z -= 1;
  if (K.has('s') || K.has('arrowdown')) z += 1;
  if (x || z) { const m = Math.hypot(x, z); x /= m; z /= m; }
  else if (S.active) {
    const dx = S.x - S.ox, dy = S.y - S.oy, m = Math.hypot(dx, dy);
    if (m > 8) { const s = clamp((m - 8) / 40, 0, 1); x = dx / m * s; z = dy / m * s; }
    if (m > 64) { S.ox = S.x - dx / m * 64; S.oy = S.y - dy / m * 64; }
  } else if (navigator.getGamepads) {
    for (const p of navigator.getGamepads()) {
      if (!p) continue;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0, m = Math.hypot(ax, ay);
      if (m > 0.15) { const s = Math.min(1, (m - 0.15) / 0.85); x = ax / m * s; z = ay / m * s; }
      break;
    }
  }
  G.input.x = x; G.input.z = z;
}

// ---------- settings and quality ----------
function applySettings() {
  const st = G.save.settings, dpr = window.devicePixelRatio || 1;
  AUDIO.enabled = st.sound;
  FX.reduced = st.quality === 'low' || st.quality === 'ultra';
  // Ultra low: a third of the pixels of Low, no MSAA or bloom, and 30 frames a second
  PERF.cap = st.quality === 'ultra' ? 30 : 60;
  if (st.quality === 'ultra') { R.settings.msaa = false; R.settings.bloom = false; PERF.ratio = PERF.max = PERF.min = 0.4; }
  // High keeps MSAA and bloom on, but at most 1.5x resolution, lowered toward 1x if frames run slow:
  // 2x with MSAA was too much for laptop and Chromebook GPUs and made the game stutter
  else if (st.quality === 'high') { R.settings.msaa = true; R.settings.bloom = true; PERF.ratio = PERF.max = Math.min(dpr, 1.5); PERF.min = Math.min(1, PERF.max); }
  else if (st.quality === 'low') { R.settings.msaa = false; R.settings.bloom = false; PERF.ratio = PERF.max = PERF.min = Math.max(0.5, Math.min(dpr, 1) * 0.75); }
  else if (PERF.software) { R.settings.msaa = false; R.settings.bloom = false; PERF.ratio = PERF.max = 0.6; PERF.min = 0.5; }
  else { R.settings.msaa = true; R.settings.bloom = true; PERF.ratio = PERF.max = Math.min(dpr, 1.5); PERF.min = 0.6; }
  resize();
}
function resize() { R.resize(window.innerWidth, window.innerHeight, PERF.ratio); }
function gpuName() { const d = gl.getExtension('WEBGL_debug_renderer_info'); return (d && gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || ''; }
function adaptQuality(dt) {
  const q = G.save.settings.quality;
  if ((q !== 'auto' && q !== 'high') || (G.state !== 'run' && G.state !== 'home')) { PERF.acc = PERF.frames = 0; return; }
  PERF.acc += dt; PERF.frames++;
  if (PERF.acc < 2) return;
  const avg = PERF.acc / PERF.frames;
  PERF.acc = 0; PERF.frames = 0;
  // too slow: lower the resolution first, then drop MSAA, then bloom (both stay off until the settings change).
  // The resize waits for the start of the next frame: resizing clears the canvas, and doing it after this
  // frame was drawn would show one blank frame.
  if (avg > 1 / 42) {
    if (PERF.ratio > PERF.min) { PERF.ratio = Math.max(PERF.min, PERF.ratio * 0.85); PERF.resizeDue = true; }
    // High never gives up MSAA or bloom; Auto does, after the resolution
    else if (q === 'auto' && R.settings.msaa) { R.settings.msaa = false; PERF.resizeDue = true; }
    else if (q === 'auto') R.settings.bloom = false;
  } else if (avg < 1 / 58 && PERF.ratio < PERF.max) { PERF.ratio = Math.min(PERF.max, PERF.ratio * 1.08); PERF.resizeDue = true; }
}

// ---------- game flow ----------
function requiredMeshes(n) {
  const info = chapterInfo(n), has = info.has, T = ARENAS[info.arena], req = ['stickman', 'sprinter', 'gooblin'];
  // the theme's scenery: scattered props, the wall ring, and whatever its layout and features place
  for (const kind of [...(T.props || []).map(p => p[0]), T.wall || 'rock', ...(T.kinds || [])]) for (const m of PROP_KINDS[kind].models) if (!req.includes(m)) req.push(m);
  for (const k in has) if (has[k] && !req.includes(ENEMY_TYPES[k].model)) req.push(ENEMY_TYPES[k].model);
  // the chapter's miniboss
  const M = MINIBOSSES[n];
  if (M) for (const m of M.boss ? bossMeshes(M.boss) : [ENEMY_TYPES[M.type].model, ENEMY_TYPES[M.summon || M.type].model]) if (!req.includes(m)) req.push(m);
  return req;
}
function beginChapter(n, opts) {
  if (G.state !== 'home') return;
  const info = chapterInfo(n), req = requiredMeshes(n);
  prioritizeMeshes(req.concat(...info.bosses.map(bossMeshes)));
  const go = () => {
    startRun(n, opts);
    updateCamera(0, true); updateView();
  };
  if (req.every(m => R.enemyDraw[m])) { go(); return; }
  $('prep').hidden = false;
  const wait = () => {
    const done = req.filter(m => R.enemyDraw[m]).length;
    $('prepFill').style.width = (done / req.length * 100) + '%';
    if (done === req.length) { $('prep').hidden = true; go(); }
    else setTimeout(wait, 100);
  };
  wait();
}
// set sail: the sea's meshes first (a progress bar while any are still building)
function beginSeaChapter(n) {
  if (G.state !== 'home') return;
  // (the chapter's islands and swimmers too)
  const C = SEA_CHAPTERS[n - 1];
  const req = [...new Set(SEA_MESHES.concat(['palm', 'rock0', 'rock1', 'rock2'], C.isles, C.mix.map(x => ENEMY_TYPES[x[0]].model)))];
  prioritizeMeshes(req);
  const go = () => { beginSea(n); updateCamera(0, true); updateView(); };
  if (req.every(m => R.enemyDraw[m])) { go(); return; }
  $('prep').hidden = false;
  const wait = () => {
    const done = req.filter(m => R.enemyDraw[m]).length;
    $('prepFill').style.width = (done / req.length * 100) + '%';
    if (done === req.length) { $('prep').hidden = true; go(); }
    else setTimeout(wait, 100);
  };
  wait();
}
// start the same run over (the same chapter, or the same mode): nothing from the abandoned run is kept
function restartRun() {
  const run = G.run;
  if (!run) return;
  const sea = !!run.sea, n = run.chapter, opts = run.endless ? 'endless' : run.rush ? 'rush' : null;
  run.over = true;
  goHome();
  if (sea) beginSeaChapter(n);
  else if (opts === 'endless') beginEndless();
  else if (opts === 'rush') beginBossRush();
  else beginChapter(n);
}
function pauseGame() { if (G.state !== 'run') return; UI.openPause(); setState('pause'); AUDIO.play('click'); }
function resumeGame() { if (G.state !== 'pause') return; setState('run'); AUDIO.play('click'); }
function resetHeroForHome() {
  const h = G.hero;
  h.reset(0, 0); h.pos[1] = 0; h.scale = 1; h.setArmCount(2); h.auraLevel = 0;
  h.bubbles = 0; h.glow = 0; h.gloss = 1; h.wobbleMul = 1; h.stretchMul = 1; h.topSpeed = 4.5;
  h.arms.forEach((a, i) => { a.grow = a.growTarget = i < 2 ? 1 : 0; });
  // on the ocean page the blob lounges on its ship
  h.lounge = h.lng = UI.homePage === 'sea' ? 1 : 0; h.faceYaw = null;
}
function homePageChanged() {
  resetHeroForHome();
  HOME.yaw = UI.homePage === 'sea' ? 1.9 : 0; HOME.spinV = 0; HOME.aim = null; HOME.shots.length = 0; HOME.frac = 0;
  if (UI.homePage === 'sea') { prioritizeMeshes(SEA_MESHES); OC.stage = seaHomeStage(); HOME.seaFoes.length = 0; }
}
function goHome() {
  if (G.run && G.run.cave) caveLeave();
  if (G.run && G.run.sea) seaLeave();
  G.run = null; G.numbers.length = 0; G.bolts.length = 0; FX.clear();
  HOME.yaw = HOME.spinV = 0; HOME.aim = null; HOME.shots.length = 0;
  R.frame.hurt = 0; R.frame.lowHp = 0;
  resetHeroForHome();
  applySkin(G.save.skin);
  UI.menuTab = 'home';
  setState('home');
  UI.openTab('home');
}

// ---------- home scene ----------
function updateHome(dt) {
  HOME.t += dt; HOME.idle += dt;
  const hero = G.hero, onHome = UI.menuTab === 'home';
  if (seaStageOn()) { updateSeaHome(dt); return; }
  if (hero.lounge) { hero.lounge = hero.lng = 0; hero.faceYaw = null; hero.scale = 1; }
  hero.pos[0] = 0; hero.pos[1] = 0; hero.pos[2] = 0;
  if (!HOME.drag) { HOME.yaw += HOME.spinV * dt; HOME.spinV *= Math.exp(-dt * 2.5); }
  if (!onHome) HOME.aim = null;
  // facing: where the player spun it (with a gentle sway once left alone), or toward the foe it is shooting
  const sway = Math.sin(HOME.t * 0.4) * 0.3 * clamp(HOME.idle - 1, 0, 1);
  if (HOME.drag) hero.yaw = HOME.yaw;
  else hero.yaw = angleLerp(hero.yaw, HOME.aim ? HOME.aim.yaw : HOME.yaw + sway, Math.min(1, dt * (HOME.aim ? 9 : 3)));
  HOME.actT -= dt;
  if (onHome) homeFoes(dt);
  else if (HOME.actT <= 0) { HOME.actT = rand(3.5, 6.5); homeAction(false); }
  // the chapter picker's boss portrait appears once the boss meshes have loaded
  if (onHome && $('chBoss').hidden && (HOME.portT -= dt) <= 0) { HOME.portT = 1; UI.homePortrait(); }
  hero.update(dt, [0, 0, 0], true);
  FX.update(dt);
}
// the ocean page: the blob lounges on its best ship, rocking on a calm sea; drag to turn the ship
function updateSeaHome(dt) {
  const hero = G.hero;
  if (!HOME.drag) { HOME.yaw += HOME.spinV * dt; HOME.spinV *= Math.exp(-dt * 2.5); }

  OC.stage = UI.menuTab === 'skins' ? UI.shipStage() : seaHomeStage(); OC.t += dt;
  const D = shipDef();
  OC.ship = OC.ship || { x: 0, z: 0, yaw: 0, yawV: 0, speed: 0, vx: 0, vz: 0, y: 0 };
  const S = OC.ship;
  // side on to the camera, swaying a little on the swell
  S.x = 0; S.z = 0; S.vx = S.vz = S.speed = 0; S.yaw = HOME.yaw + Math.sin(OC.t * 0.35) * 0.18;
  S.y = Math.sin(OC.t * 1.6) * D.bob * 1.4 + Math.sin(OC.t * 2.7 + 1) * D.bob * 0.5;
  hero.scale = D.heroS;
  seaPlaceHero(dt);
  if ((HOME.actT -= dt) <= 0) { HOME.actT = rand(3, 6); hero.impulse(rand(-1.5, 2)); seaIcons(); }
  if (UI.menuTab === 'home' && G.state === 'home') seaHomeFoes(dt);
  // the picker's boss portrait appears once its meshes are built
  if (UI.menuTab === 'home' && $('chBoss').hidden && (HOME.portT -= dt) <= 0) { HOME.portT = 1.5; UI.refreshSeaHome(); }
  FX.update(dt);
}
// Background foes: faded orange and purple grunts walk in from behind and come at the blob; tap or click the stage
// to shoot goo at the one nearest your tap (the blob also shoots now and then by itself, slowly)
const HOME_FOE_MODELS = ['stickman', 'sprinter', 'helmet', 'spear'];
const HOME_FOE_COLS = [[1, 0.55, 0.16], [0.68, 0.42, 1]];
function spawnHomeFoe(f, first) {
  // behind the blob as the camera sees it (the camera sits off to one side on wide screens), spread to fit the view
  const c = R.cam.pos, w = clamp(0.3 * R.w / R.h, 0.15, 0.45);
  const a = Math.atan2(-c[0], -c[2]) + rand(-w, w), r = first ? rand(10, 14) : rand(14.5, 16.5);
  return Object.assign(f, { x: Math.sin(a) * r, z: Math.cos(a) * r, model: pick(HOME_FOE_MODELS), col: pick(HOME_FOE_COLS), phase: Math.random(),
    speed: rand(0.7, 1.1), stop: rand(2.8, 3.4), yaw: 0, moving: true, appear: first ? 1 : 0, flash: 0, dying: 0, bumpT: rand(0.3, 1) });
}
function homeFoes(dt) {
  const F = HOME.foes, hero = G.hero;
  if (!HOME.frac) return; // wait until the camera has framed the stage: foes spawn behind the blob as it sees it
  while (F.length < 5) F.push(spawnHomeFoe({}, true));
  for (const f of F) {
    f.appear = Math.min(1, f.appear + dt * 1.2); f.flash = Math.max(0, f.flash - dt * 3);
    // a popped foe lies flat for a moment, then a new one walks in from the back
    if (f.dying) { f.dying += dt * 1.6; if (f.dying >= 1.8) spawnHomeFoe(f, false); continue; }
    const d = Math.hypot(f.x, f.z) || 1;
    f.yaw = Math.atan2(-f.x, -f.z);
    f.moving = d > f.stop;
    if (f.moving) { f.x -= f.x / d * f.speed * dt; f.z -= f.z / d * f.speed * dt; f.phase += dt * f.speed * 1.5; }
    else {
      // one that reaches the blob shoves it now and then until it is shot
      f.phase += dt * 0.7;
      if ((f.bumpT -= dt) <= 0) { f.bumpT = rand(1.2, 1.8); hero.impulse(rand(-1.4, -0.8)); FX.burst(f.x * 0.45, 0.9, f.z * 0.45, 6, f.col, 3, 0.06, 0.25, 1, 0.3); if (G.state === 'home') AUDIO.play('boing', 0.8); }
    }
  }
  homeShots(dt);
  // aim at the nearest walker now and then (never while the player is spinning the blob)
  const a = HOME.aim;
  if (a) {
    a.t += dt; a.yaw = Math.atan2(a.foe.x, a.foe.z);
    const facing = Math.abs(angleLerp(hero.yaw, a.yaw, 1) - hero.yaw) < 0.3;
    if (!a.fired && (facing || a.t > 0.7)) { a.fired = a.t; homeFire(a.foe); }
    if (a.fired && a.t > a.fired + 0.55) HOME.aim = null;
  } else if ((HOME.shootT -= dt) <= 0 && !HOME.drag && HOME.idle > 1.5) {
    let best = null, bd = 1e9;
    for (const f of F) {
      const d = Math.hypot(f.x, f.z);
      if (!f.dying && !homeTargeted(f) && f.appear >= 1 && d < 13 && d < bd) { bd = d; best = f; }
    }
    HOME.shootT = rand(2.6, 4.2);
    if (best) HOME.aim = { foe: best, t: 0, yaw: Math.atan2(best.x, best.z), fired: 0 };
  }
}
// goo shots home in on their foe (a swimmer is hit low, at the water)
function homeShots(dt) {
  for (const s of HOME.shots) {
    const f = s.foe, hy = f.hy ?? 0.75, dx = f.x - s.x, dy = hy - s.y, dz = f.z - s.z, l = Math.hypot(dx, dy, dz) || 1;
    s.t += dt;
    if (l < 0.5 * (f.sc || 1) || s.t > 2.4 || f.dying) {
      s.dead = true;
      if (!f.dying) {
        f.dying = 0.001; f.flash = 1;
        AUDIO.play('squish');
        FX.burst(f.x, hy + 0.05, f.z, 12, f.col, 4, 0.07, 0.35, 1, 0.4);
        FX.glow(f.x, hy + 0.05, f.z, 1.1, f.col, 0.2);
        FX.burst(s.x, s.y, s.z, 6, [R.goo.rim[0], R.goo.rim[1], R.goo.rim[2]], 3, 0.05, 0.25, 1, 0.3);
        if (f.hy != null) { FX.burst(f.x, 0.1, f.z, 14, [0.85, 0.95, 1], 4, 0.08, 0.5, 2, 3); AUDIO.play('splash', 0.6); }
      }
      continue;
    }
    const sp = 14 * (f.sc || 1);
    s.vx = dx / l * sp; s.vy = dy / l * sp; s.vz = dz / l * sp;
    s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
    s.trail.unshift([s.x, s.y, s.z]); if (s.trail.length > 7) s.trail.pop();
  }
  HOME.shots = HOME.shots.filter(s => !s.dead);
}
// ---------- the ocean page's foes ----------
// pirates swim in from behind the ship (as the camera sees it) and hack at its side, rocking the blob, until shot;
// tap the water to lob goo at the one nearest the tap (the blob lobs one now and then by itself)
const SEA_HOME_FOE_MODELS = ['pswim', 'pfloat', 'ptube'];
function spawnSeaHomeFoe(f, first) {
  // the camera frames the ship closely, so they start just round it (behind it and off to its sides), in view
  const c = R.cam.pos, D = shipDef(), u = Math.max(1.9, D.len * 0.62) / 1.9;
  const a = Math.atan2(-c[0], -c[2]) + rand(-1.5, 1.5), r = D.len * 0.5 + (0.6 + (first ? rand(0.4, 1.6) : rand(1.8, 2.4))) * u;
  // as in a run: their own size and tint, head and shoulders out of the water
  const model = pick(SEA_HOME_FOE_MODELS), T = ENEMY_TYPES[model];
  return Object.assign(f, { x: Math.sin(a) * r, z: Math.cos(a) * r, model, phase: Math.random(), speed: rand(0.45, 0.7) * u,
    sc: T.scale, tint: hexToRgb(T.tint), hy: 0.25 * T.scale, col: [1, 0.55, 0.3], yaw: 0, moving: true, appear: first ? 1 : 0, flash: 0, dying: 0, bumpT: rand(0.5, 1.2) });
}
// within the hull's outline, padded (in the ship's own frame)
function nearHull(x, z, pad) {
  const S = OC.ship, D = shipDef(), c = Math.cos(S.yaw), s = Math.sin(S.yaw), lx = c * x - s * z, lz = s * x + c * z;
  return (lx / (D.wid / 2 + pad)) ** 2 + (lz / (D.len / 2 + pad)) ** 2 < 1;
}
function seaHomeFoes(dt) {
  const F = HOME.seaFoes, hero = G.hero;
  if (!HOME.frac || !OC.ship) return;
  while (F.length < 5) F.push(spawnSeaHomeFoe({}, true));
  for (const f of F) {
    f.appear = Math.min(1, f.appear + dt * 1.2); f.flash = Math.max(0, f.flash - dt * 3);
    if (f.dying) { f.dying += dt * 1.6; if (f.dying >= 1.8) spawnSeaHomeFoe(f, false); continue; }
    const d = Math.hypot(f.x, f.z) || 1;
    f.yaw = Math.atan2(-f.x, -f.z);
    f.moving = !nearHull(f.x, f.z, 0.55 * f.sc);
    if (f.moving) { f.x -= f.x / d * f.speed * dt; f.z -= f.z / d * f.speed * dt; f.phase += dt * 0.9; }
    else {
      f.phase += dt * 0.8;
      if ((f.bumpT -= dt) <= 0) {
        f.bumpT = rand(1.4, 2.2); hero.impulse(rand(-1.4, -0.8));
        FX.burst(f.x, 0.3, f.z, 8, [0.85, 0.95, 1], 3, 0.06, 0.3, 1.5, 0.4);
        if (G.state === 'home') AUDIO.play('boing', 0.6);
      }
    }
  }
  homeShots(dt);
  if ((HOME.shootT -= dt) <= 0 && !HOME.drag && HOME.idle > 1.5) {
    HOME.shootT = rand(2.6, 4.2);
    let best = null, bd = 1e9;
    for (const f of F) { const d = Math.hypot(f.x, f.z); if (!f.dying && !homeTargeted(f) && f.appear >= 1 && d < bd) { bd = d; best = f; } }
    if (best) homeFire(best);
  }
}
function emitSeaHomeFoes() {
  for (const f of HOME.seaFoes) {
    const m = MODELS.defs && MODELS.defs[f.model];
    if (!m || !R.enemyDraw[f.model]) continue;
    const c = f.moving || f.dying ? m.clips.paddle : (m.clips.hack || m.clips.paddle);
    const row = c.row + Math.floor((f.phase - Math.floor(f.phase)) * c.frames);
    const sc = f.sc * (0.25 + 0.75 * f.appear), dead = clamp(f.dying, 0, 1);
    const y = -SEA.sink * f.sc * (m.top || 1) * 0.9 + Math.sin(OC.t * 2.2 + f.phase * 6) * 0.04 * f.sc - dead * 0.6 * f.sc;
    pushEnemy(f.model, false, f.x, y, f.z, f.yaw, row, sc, 1, dead, f.flash * 0.85, 0, f.tint[0], f.tint[1], f.tint[2], 0);
    seaShadow(f.x, f.z, 0.55 * sc, 0.7 * sc, f.yaw, 0.55 * (1 - clamp(f.dying - 0.9, 0, 1)));
  }
  emitHomeShots();
}
function emitHomeShots() {
  for (const s of HOME.shots) {
    pushImp(s.x, s.y, s.z, 0.17 * (s.foe.sc || 1), s.vx, s.vy, s.vz, 1.35, 0, 0, 0.25, s.ph + s.t, 0, 0, 0, 1);
    trailRibbon(s.trail, 0.13 * (s.foe.sc || 1), [R.goo.rim[0], R.goo.rim[1], R.goo.rim[2]], 0.6);
  }
}
// a foe already has goo on its way (or the blob is turning to shoot it)
const homeTargeted = f => HOME.shots.some(s => s.foe === f) || (HOME.aim && HOME.aim.foe === f && !HOME.aim.fired);
// the blob flicks a goo shot at a foe from a free arm (or its chest when both are busy)
function homeFire(f) {
  const hero = G.hero, tw = [f.x, f.hy ?? 0.75, f.z];
  const go = from => HOME.shots.push({ x: from[0], y: from[1], z: from[2], vx: 0, vy: 0, vz: 0, t: 0, trail: [], foe: f, ph: Math.random() * 10 });
  const arm = hero.lounge ? -1 : hero.freeArm(tw);
  if (arm >= 0) hero.thrust(arm, tw, 0.17, 0, wp => go(wp)); else go(hero.jointWorld('chest'));
  if (G.state === 'home') AUDIO.play('gooshot', 0.8);
}
// a tap on the home stage: shoot the foe nearest the tap on screen (ones already being shot count as farther),
// or the nearest one to the blob when there was no tap point; false when there is nothing to shoot
function homeShoot(sx, sy) {
  if (G.state !== 'home' || UI.menuTab !== 'home') return false;
  const sea = UI.homePage === 'sea';
  let best = null, bd = 1e9;
  const p = [0, 0];
  for (const f of sea ? HOME.seaFoes : HOME.foes) {
    if (f.dying || f.appear < 0.3) continue;
    const busy = homeTargeted(f);
    const d = sx != null && R.project(f.x, f.hy ?? 0.8, f.z, p) ? Math.hypot(p[0] - sx, p[1] - sy) + (busy ? 300 : 0) : Math.hypot(f.x, f.z) + (busy ? 30 : 0);
    if (d < bd) { bd = d; best = f; }
  }
  if (!best) return false;
  if (!sea) HOME.aim = { foe: best, t: 0, yaw: Math.atan2(best.x, best.z), fired: 0.001 };
  homeFire(best);
  return true;
}
function emitHomeFoes() {
  for (const f of HOME.foes) {
    const m = MODELS.defs && MODELS.defs[f.model];
    if (!m || !R.enemyDraw[f.model]) continue;
    const c = f.moving || f.dying ? m.clips.run : (m.clips.idle || m.clips.run);
    const row = c.row + Math.floor((f.phase - Math.floor(f.phase)) * c.frames);
    const sc = 1.3 * (0.25 + 0.75 * f.appear), dead = clamp(f.dying, 0, 1);
    // washed toward cream so they read as background, flashing white when hit, dissolving once flattened
    pushEnemy(f.model, false, f.x, 0, f.z, f.yaw, row, sc, 1, dead, Math.max(0.32, f.flash * 0.9), 0, f.col[0], f.col[1], f.col[2], clamp((f.dying - 0.9) * 1.2, 0, 1));
    pushDecal(f.x + 0.05, f.z + 0.04, 0.34 * sc, 0.46 * sc, 0, 1, 0, 0, 0.05, 0.2, 0.5, 0.22 * (1 - clamp(f.dying - 0.9, 0, 1)));
  }
  emitHomeShots();
}
function homeAction(loud) {
  const hero = G.hero, r = Math.random();
  if (r < 0.45) {
    const arm = Math.random() < 0.5 ? 0 : 1, side = hero.arms[arm].side;
    if (hero.arms[arm].action) { hero.impulse(1.5); return; }
    const t = hero.toWorld([side * 1.25, 1.38, 0.55], [0, 0, 0]);
    hero.punch(arm, t, 1.3, imp => {
      FX.glow(imp[0], imp[1], imp[2], 0.5, COLORS.violetHi, 0.12);
      FX.burst(imp[0], imp[1], imp[2], 5, [1, 1, 1], 3, 0.05, 0.2, 1, 0.3);
      if (loud) AUDIO.play('punch');
    });
  } else {
    hero.impulse(r < 0.75 ? 2.4 : -1.6);
    if (loud) AUDIO.play('pop', 0.7);
  }
}
function pokeHero(sx, sy) {
  if (G.state !== 'home') return;
  if (UI.homePage === 'sea' && UI.menuTab === 'home') {
    if (homeShoot(sx, sy)) return;
    const h = G.hero.pos; G.hero.impulse(2.6); AUDIO.play('splash', 0.8);
    FX.burst(h[0], 0.2, h[2], 14, [0.85, 0.95, 1], 4, 0.08, 0.5, 2, 3); FX.droplets(h[0], h[1] + 0.5, h[2], 3, 0, 1.5, 0.04, null);
    return;
  }
  if (homeShoot(sx, sy)) return;
  homeAction(true); FX.droplets(0, 1.0, 0, 3, 0, 1.5, 0.04, null);
}
function homeCamera(dt) {
  const aspect = R.w / R.h, portrait = aspect < 0.9;
  const fov = 0.5, half = Math.tan(fov / 2);
  // on the skins screen the hero sits smaller and higher, above the skin grid
  // portrait: smaller and higher above the picker; landscape: on the left of the picker panel
  const skins = UI.menuTab === 'skins', wide = aspect >= 1.1;
  let wantFrac = skins ? (portrait ? 0.2 : wide ? 0.42 : 0.3) : (portrait ? 0.27 : 0.4);
  let wantLift = skins ? (portrait ? 0.22 : wide ? 0.02 : 0.16) : 0;
  let wantSide = skins && wide ? 0.21 : 0;
  // on the gear screen the hero stands in the middle of the equip-slot stage
  // on home the hero stands in the middle of its stage (above the chapter picker)
  const stEl = UI.menuTab === 'gear' ? $('gearStage') : UI.menuTab === 'home' && G.state === 'home' ? $('heroTap') : null;
  const st = stEl && stEl.getBoundingClientRect();
  if (st && st.height > 0 && R.cssH > 0) {
    wantFrac = clamp(st.height * (UI.menuTab === 'home' ? 0.78 : 0.92) / R.cssH, 0.12, 0.6);
    wantLift = (R.cssH / 2 - (st.top + st.height * 0.5)) / R.cssH;
    wantSide = (R.cssW / 2 - (st.left + st.width * 0.5)) / R.cssW;
  }
  const k = HOME.frac ? 1 - Math.exp(-dt * 6) : 1;
  HOME.frac += (wantFrac - HOME.frac) * k; HOME.lift += (wantLift - HOME.lift) * k; HOME.side += (wantSide - HOME.side) * k;
  // the ocean page frames the whole ship from a little higher up
  const sea = seaStageOn(), D = sea ? shipDef() : null;
  // (long ships are framed a little tighter: seen from the corner, their length is foreshortened)
  const viewH = (sea ? Math.max(1.9, D.len * lerp(0.62, 0.46, clamp((D.len - 6) / 12, 0, 1)) + D.deck * 0.5) : 2.2) / HOME.frac, d = viewH / (2 * half);
  const tgt = [HOME.side * viewH * aspect, (sea ? D.deck * 0.6 + 0.25 : portrait ? 1.15 : 1.1) - HOME.lift * viewH, 0];
  const pitch = sea ? 0.6 : 0.2, yaw = Math.sin(HOME.t * 0.15) * 0.12;
  R.setCamera([tgt[0] + Math.sin(yaw) * Math.cos(pitch) * d, tgt[1] + Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d], tgt, fov);
}

// ---------- rendering ----------
function renderFrame() {
  const f = R.frame, hero = G.hero, h = hero.pos;
  R.resetStreams();
  SCENE.floor = true; SCENE.backdrop = null; SCENE.aura = null; SCENE.bubble = null; SCENE.pools = [];
  SCENE.arenaBox = G.run && G.state !== 'home' && !ARENA.boxes ? [ARENA.hw, ARENA.hd, ARENA.cr] : null;
  SCENE.hero = hero.out; SCENE.heroShadow = hero.shadow;
  f.torches[3] = 0;
  if (G.run && G.state !== 'home' && G.run.cave) {
    // the cave: its own scene, the hero hidden while it looks out of its own eyes at the fork
    emitCave();
    if (CV.phase === 'fork') { SCENE.hero = null; SCENE.heroShadow = null; }
    f.hurt = Math.max(G.run.hurtFlash, CV.vig * 0.6);
  } else if (G.run && G.state !== 'home' && G.run.sea) {
    emitSea();
    f.hurt = G.run.hurtFlash;
  } else if (G.run && G.state !== 'home') {
    f.spot = [h[0], 0, h[2], 13]; f.fogRange = [10, 26];
    emitRunScene();
    f.hurt = G.run.hurtFlash;
  } else if (seaStageOn()) {
    // the ocean page: the ship at anchor on open water that fades into the sky
    SCENE.arenaBox = null;
    f.spot = [0, 0, 0, 1e4]; f.fogRange = [22 * HOME.view(), 60 * HOME.view()]; f.hurt = 0; f.lowHp = 0;
    const S = OC.ship;
    if (S) seaDrawShip(0, S.y, 0, S.yaw, OC.stage, OC.t, 0);
    if (S && UI.menuTab === 'home' && G.state === 'home') emitSeaHomeFoes();
  } else {
    // menus: the hero stands on a bright sky backdrop with a soft shadow
    SCENE.floor = false;
    const q = [0, 0];
    SCENE.backdrop = R.project(h[0], 1.15, h[2], q) ? [q[0] / R.cssW, 1 - q[1] / R.cssH] : [0.5, 0.55];
    Object.assign(f, HOME_LIGHT);
    f.spot = [0, 0, 0, 50]; f.fogRange = [200, 400]; f.hurt = 0; f.lowHp = 0;
    pushDecal(h[0] + 0.08, h[2] + 0.04, 0.95, 0.6, 0, 1, 0, 0, 0.02, 0.2, 0.55, 0.42);
    if (UI.menuTab === 'home' && G.state === 'home') emitHomeFoes();
  }
  FX.emit();
  R.drawScene();
  R.post();
}

// ---------- main loop ----------
let lastT = 0, rafT = 0, frameAcc = 0;
function loop(now) {
  // pace to about 60 frames a second whatever the screen's refresh rate: 120-240 Hz screens would
  // otherwise multiply the GPU work. Time from skipped refreshes carries over to the next frame.
  frameAcc += rafT ? Math.max(0, now - rafT) : 0;
  rafT = now;
  const frameMs = 1000 / PERF.cap;
  if (lastT && frameAcc < frameMs - 2) { requestAnimationFrame(loop); return; }
  frameAcc = clamp(frameAcc - frameMs, 0, frameMs);
  const raw = lastT ? (now - lastT) / 1000 : 1 / 60;
  const dt = clamp(raw, 0, 0.05);
  lastT = now;
  PERF.fps += (1 / Math.max(raw, 1e-3) - PERF.fps) * 0.05;
  R.frame.time += dt;
  if (PERF.resizeDue) { PERF.resizeDue = false; resize(); }
  readInput();
  const s = G.state;
  if ((s === 'run' || s === 'victory') && DEV.open) updateCamera(0, false, true);
  else if (s === 'run' || s === 'victory') {
    const sdt = dt * G.timeScale * DEV.speed;
    const steps = Math.min(4, Math.max(1, Math.ceil(sdt / (1 / 60))));
    updateView();
    for (let i = 0; i < steps && (G.state === 'run' || G.state === 'victory'); i++) { updateRun(sdt / steps); updateTelegraphs(sdt / steps); }
    FX.update(sdt);
    updateCamera(dt);
    if (G.state === 'run' && G.run.pending > 0) UI.openLevelUp();
    else if (G.state === 'run' && G.run.chestQueued > 0) UI.openChest();
    if (s === 'victory') { G.stateT += dt; if (G.stateT > 2.6) finishRun(true); }
  } else if (s === 'dying' && G.run && G.run.sea) {
    // the ship breaks up and the blob goes under (13k-ocean.js)
    G.stateT += dt;
    updateSeaDying(dt);
    FX.update(dt);
    updateCamera(dt);
    if (G.stateT > SINK_T) { if (!G.run.revived) setState('revive'); else finishRun(false); }
  } else if (s === 'dying') {
    G.stateT += dt;
    G.hero.update(dt, [0, 0, 0], false);
    FX.update(dt);
    updateCamera(dt);
    if (G.stateT > 1.3) { if (!G.run.revived) setState('revive'); else finishRun(false); }
  } else if (s === 'home') {
    updateHome(dt);
    pumpHeroIcons();
    homeCamera(dt);
    // a few seconds of the home screen drawn: this start worked
    if (BOOT_GUARD.set && R.frame.time > 3) bootGuardClear();
  } else if (G.run) updateCamera(0, false, true);
  if (s !== 'loading') renderFrame();
  UI.update(dt);
  UI.drawOverlay(dt);
  adaptQuality(dt);
  requestAnimationFrame(loop);
}

// ---------- boot ----------
function setProgress(f, tip) { $('loadFill').style.width = Math.round(f * 100) + '%'; if (tip) $('loadTip').textContent = tip; }
function showLoadError(msg) {
  $('loadTip').hidden = true;
  const e = $('loadError'); e.hidden = false;
  e.textContent = typeof msg === 'string' ? msg : 'The game could not start on this device. ' + (msg && msg.message ? msg.message.split('\n')[0] : '');
  if (msg && msg.message) console.error(msg);
}
// A start that never got the home screen drawing (the browser froze, or was killed, while loading)
// leaves this mark behind; the next start then uses Ultra low graphics, and says why.
const BOOT_GUARD = { key: 'projectGel.booting', set: false, tripped: false };
function bootGuardStart() {
  if (window.__noBootGuard) return;
  try {
    BOOT_GUARD.tripped = localStorage.getItem(BOOT_GUARD.key) === '1';
    localStorage.setItem(BOOT_GUARD.key, '1');
    BOOT_GUARD.set = true;
  } catch (_) { /* no storage: no guard */ }
  // closing the tab while it loads is not a crash
  window.addEventListener('pagehide', bootGuardClear);
  if (BOOT_GUARD.tripped && G.save.settings.quality !== 'ultra') G.save.settings.quality = 'ultra';
  else BOOT_GUARD.tripped = false;
}
function bootGuardClear() {
  if (!BOOT_GUARD.set) return;
  BOOT_GUARD.set = false;
  try { localStorage.removeItem(BOOT_GUARD.key); } catch (_) { /* ignore */ }
}

async function boot() {
  UI.init();
  G.save = loadGame();
  bootGuardStart();
  setProgress(0.06, 'Warming up the goo…');
  await nextFrame();
  const canvas = $('gl');
  let ok = false;
  try { ok = R.init(canvas); } catch (err) { showLoadError(err); return; }
  if (!ok) { showLoadError('This browser does not support WebGL2, which the game needs. Try a recent Chrome, Edge, Firefox or Safari.'); return; }
  // WebGL drawn by the CPU (no hardware acceleration) is far too slow for this game: use the lightest settings
  PERF.software = !window.__allowSoftwareGL && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(gpuName());
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); setState('loading'); showLoadError('The graphics driver stopped the game. Reload the page to keep playing.'); });
  { const L = R.frame.lightDir, l = Math.hypot(...L); R.frame.lightDir = L.map(v => v / l); }
  applySettings();
  buildTextures();
  setProgress(0.3, 'Shaping the stickmen…');
  await nextFrame();
  prepareAnimations();
  startMeshBuild();
  G.hero = new Hero();
  resetHeroForHome();
  applySkin(G.save.skin);
  setProgress(0.5, 'Polishing the goo…');
  await nextFrame();
  // the shaders have been compiling in the background since R.init; wait for them without blocking the page
  while (!R.programsReady()) await nextFrame();
  try { R.finishPrograms(); } catch (err) { showLoadError(err); return; }
  renderAllIcons();
  document.querySelectorAll('img[data-icon]').forEach(img => { img.src = ICONS.get(img.dataset.icon); });
  setProgress(1, 'Ready');
  initInput(canvas);
  window.addEventListener('resize', resize);
  UI.menuTab = 'home';
  setState('home');
  UI.openTab('home');
  // the setting can be on while the browser still falls back to software (blocked driver, or after graphics crashes)
  if (PERF.software) UI.toast(`Your browser is drawing the game without the graphics card (it reports "${gpuName()}"), so it will be slow. Restarting the browser often fixes this; try Graphics: Ultra low too.`, 10);
  else if (BOOT_GUARD.tripped) UI.toast('The game did not finish starting last time, so Graphics is now Ultra low. You can raise it again in Settings.', 10);
  const off = offlineEarnings();
  if (off) UI.showOffline(off.coins, off.hours);
  saveGame();
  setInterval(() => { if (G.state === 'home' || G.state === 'run') saveGame(); }, 30000);
  requestAnimationFrame(loop);
}
window.addEventListener('DOMContentLoaded', boot);
