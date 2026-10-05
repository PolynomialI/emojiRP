// ============================================================
// Boot, background mesh building, input, home scene, main loop
// ============================================================
const INPUT = { keys: new Set(), stick: { active: false, id: -1, ox: 0, oy: 0, x: 0, y: 0 }, moved: false };
const PERF = { acc: 0, frames: 0, ratio: 1, min: 0.6, max: 2 };
const HOME = { t: 0, actT: 2.5, frac: 0, lift: 0, side: 0 };
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
function onMeshBuilt(name, mesh) {
  if (MESHJOB.done.has(name)) return;
  MESHJOB.done.add(name);
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
  onMeshBuilt(name, buildMeshByName(prepareModelDefs(), name));
}

// ---------- input ----------
function initInput(canvas) {
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    INPUT.keys.add(k);
    AUDIO.unlock();
    if ((k === 'escape' || k === 'p') && !e.repeat) { if (G.state === 'run') pauseGame(); else if (G.state === 'pause') resumeGame(); }
    if (G.state === 'levelup' && (k === '1' || k === '2' || k === '3')) UI.pick(Number(k) - 1);
  });
  window.addEventListener('keyup', e => INPUT.keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur', () => { INPUT.keys.clear(); INPUT.stick.active = false; if (G.state === 'run') pauseGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.state === 'run') pauseGame(); saveGame(); } });
  canvas.addEventListener('pointerdown', e => {
    AUDIO.unlock();
    if (G.state === 'home') { pokeHero(); return; }
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
  if ((x || z) && G.state === 'run') INPUT.moved = true;
}

// ---------- settings and quality ----------
function applySettings() {
  const st = G.save.settings, dpr = window.devicePixelRatio || 1;
  AUDIO.enabled = st.sound;
  FX.reduced = st.quality === 'low';
  if (st.quality === 'high') { R.settings.msaa = true; R.settings.bloom = true; PERF.ratio = PERF.max = PERF.min = Math.min(dpr, 2); }
  else if (st.quality === 'low') { R.settings.msaa = false; R.settings.bloom = false; PERF.ratio = PERF.max = PERF.min = Math.max(0.5, Math.min(dpr, 1) * 0.75); }
  else { R.settings.msaa = true; R.settings.bloom = true; PERF.ratio = Math.min(dpr, 1.5); PERF.max = Math.min(dpr, 2); PERF.min = 0.6; }
  resize();
}
function resize() { R.resize(window.innerWidth, window.innerHeight, PERF.ratio); }
function adaptQuality(dt) {
  if (G.save.settings.quality !== 'auto' || (G.state !== 'run' && G.state !== 'home')) { PERF.acc = PERF.frames = 0; return; }
  PERF.acc += dt; PERF.frames++;
  if (PERF.acc < 2) return;
  const avg = PERF.acc / PERF.frames;
  PERF.acc = 0; PERF.frames = 0;
  if (avg > 1 / 42 && PERF.ratio > PERF.min) { PERF.ratio = Math.max(PERF.min, PERF.ratio * 0.85); resize(); }
  else if (avg < 1 / 58 && PERF.ratio < PERF.max) { PERF.ratio = Math.min(PERF.max, PERF.ratio * 1.08); resize(); }
}

// ---------- game flow ----------
function requiredMeshes(n) {
  const has = chapterInfo(n).has, req = ['stickman', 'sprinter', 'rock0', 'rock1', 'rock2'];
  for (const k in has) if (has[k] && !req.includes(ENEMY_TYPES[k].model)) req.push(ENEMY_TYPES[k].model);
  return req;
}
function beginChapter(n) {
  if (G.state !== 'home') return;
  const info = chapterInfo(n), req = requiredMeshes(n);
  prioritizeMeshes(req.concat(info.bosses.map(b => BOSS_TYPES[b].model)));
  const go = () => {
    startRun(n);
    updateCamera(0, true); updateView();
    const hint = $('hint');
    hint.textContent = matchMedia('(pointer: coarse)').matches ? 'Drag anywhere to move' : 'Move with WASD, the arrow keys, or drag';
    hint.hidden = !G.save.tutorial;
    INPUT.moved = false;
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
function pauseGame() { if (G.state !== 'run') return; UI.openPause(); setState('pause'); AUDIO.play('click'); }
function resumeGame() { if (G.state !== 'pause') return; setState('run'); AUDIO.play('click'); }
function resetHeroForHome() {
  const h = G.hero;
  h.reset(0, 0); h.pos[1] = 0.228; h.scale = 1; h.setArmCount(2); h.auraLevel = 0;
  h.bubbles = 0; h.glow = 0; h.gloss = 1; h.wobbleMul = 1; h.stretchMul = 1; h.topSpeed = 4.5;
  h.arms.forEach((a, i) => { a.grow = a.growTarget = i < 2 ? 1 : 0; });
}
function goHome() {
  G.run = null; G.numbers.length = 0; G.bolts.length = 0; FX.clear();
  R.frame.hurt = 0; R.frame.lowHp = 0;
  resetHeroForHome();
  applySkin(G.save.skin);
  UI.menuTab = 'home';
  setState('home');
  UI.openTab('home');
}

// ---------- home scene ----------
function updateHome(dt) {
  HOME.t += dt;
  const hero = G.hero;
  hero.pos[0] = 0; hero.pos[1] = 0.228; hero.pos[2] = 0;
  hero.yaw = angleLerp(hero.yaw, Math.sin(HOME.t * 0.4) * 0.3, Math.min(1, dt * 2));
  HOME.actT -= dt;
  if (HOME.actT <= 0) { HOME.actT = rand(3.5, 6.5); homeAction(false); }
  hero.update(dt, [0, 0, 0], true);
  FX.update(dt);
}
function homeAction(loud) {
  const hero = G.hero, r = Math.random();
  if (r < 0.45) {
    const arm = Math.random() < 0.5 ? 0 : 1, side = hero.arms[arm].side;
    if (hero.arms[arm].action) { hero.impulse(1.5); return; }
    const t = hero.toWorld([side * 1.25, 1.1, 0.55], [0, 0, 0]);
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
function pokeHero() { if (G.state === 'home') { homeAction(true); FX.droplets(0, 1.0, 0, 3, 0, 1.5, 0.04, null); } }
function homeCamera(dt) {
  const aspect = R.w / R.h, portrait = aspect < 0.9;
  const fov = 0.5, half = Math.tan(fov / 2);
  // on the skins screen the hero sits smaller and higher, above the skin grid
  // portrait: smaller and higher above the picker; landscape: on the left of the picker panel
  const skins = UI.menuTab === 'skins', wide = aspect >= 1.1;
  const wantFrac = skins ? (portrait ? 0.22 : wide ? 0.42 : 0.3) : (portrait ? 0.27 : 0.4);
  const wantLift = skins ? (portrait ? 0.17 : wide ? 0.02 : 0.14) : 0;
  const wantSide = skins && wide ? 0.21 : 0;
  const k = HOME.frac ? 1 - Math.exp(-dt * 6) : 1;
  HOME.frac += (wantFrac - HOME.frac) * k; HOME.lift += (wantLift - HOME.lift) * k; HOME.side += (wantSide - HOME.side) * k;
  const viewH = 1.9 / HOME.frac, d = viewH / (2 * half);
  const tgt = [HOME.side * viewH * aspect, (portrait ? 1.0 : 0.95) - HOME.lift * viewH, 0];
  const pitch = 0.2, yaw = Math.sin(HOME.t * 0.15) * 0.12;
  R.setCamera([tgt[0] + Math.sin(yaw) * Math.cos(pitch) * d, tgt[1] + Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d], tgt, fov);
}

// ---------- rendering ----------
function renderFrame() {
  const f = R.frame, hero = G.hero, h = hero.pos;
  R.resetStreams();
  SCENE.floor = true; SCENE.aura = null; SCENE.bubble = null; SCENE.pools = [];
  SCENE.arenaBox = G.run && G.state !== 'home' ? [ARENA.hw, ARENA.hd, ARENA.cr] : null;
  SCENE.hero = hero.out; SCENE.heroShadow = hero.shadow;
  if (G.run && G.state !== 'home') {
    f.spot = [h[0], 0, h[2], 13]; f.fogRange = [10, 26];
    emitRunScene();
    f.hurt = G.run.hurtFlash;
  } else {
    f.spot = [0, 0, 0, 5.5]; f.fogRange = [6, 16]; f.hurt = 0; f.lowHp = 0;
    pushImp(0, 0, 0, 0.95, 0, 0, 1, 1, 16, 0, 0, 0, 0, 0, 0, 1);
    pushDecal(0.35, -0.2, 1.05, 0.85, 0.6, 1, 0, 0, 0.01, 0.02, 0.05, 0.55);
  }
  FX.emit();
  R.drawScene();
  R.post();
}

// ---------- main loop ----------
let lastT = 0;
function loop(now) {
  const dt = lastT ? clamp((now - lastT) / 1000, 0, 0.05) : 1 / 60;
  lastT = now;
  R.frame.time += dt;
  readInput();
  const s = G.state;
  if (s === 'run' || s === 'victory') {
    const sdt = dt * G.timeScale;
    const steps = Math.min(4, Math.max(1, Math.ceil(sdt / (1 / 60))));
    updateView();
    for (let i = 0; i < steps && (G.state === 'run' || G.state === 'victory'); i++) { updateRun(sdt / steps); updateTelegraphs(sdt / steps); }
    FX.update(sdt);
    updateCamera(dt);
    if (G.state === 'run' && G.run.pending > 0) UI.openLevelUp();
    else if (G.state === 'run' && G.run.chestQueued > 0) UI.openChest();
    if (s === 'victory') { G.stateT += dt; if (G.stateT > 2.6) finishRun(true); }
    if (INPUT.moved && !$('hint').hidden) { $('hint').hidden = true; G.save.tutorial = false; saveGame(); }
  } else if (s === 'dying') {
    G.stateT += dt;
    G.hero.update(dt, [0, 0, 0], false);
    FX.update(dt);
    updateCamera(dt);
    if (G.stateT > 1.3) { if (!G.run.revived) setState('revive'); else finishRun(false); }
  } else if (s === 'home') {
    updateHome(dt);
    homeCamera(dt);
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
async function boot() {
  UI.init();
  G.save = loadGame();
  setProgress(0.06, 'Warming up the goo…');
  await nextFrame();
  const canvas = $('gl');
  let ok = false;
  try { ok = R.init(canvas); } catch (err) { showLoadError(err); return; }
  if (!ok) { showLoadError('This browser does not support WebGL2, which the game needs. Try a recent Chrome, Edge, Firefox or Safari.'); return; }
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
  renderAllIcons();
  document.querySelectorAll('img[data-icon]').forEach(img => { img.src = ICONS.get(img.dataset.icon); });
  setProgress(1, 'Ready');
  initInput(canvas);
  window.addEventListener('resize', resize);
  UI.menuTab = 'home';
  setState('home');
  UI.openTab('home');
  const off = offlineEarnings();
  if (off) UI.showOffline(off.coins, off.hours);
  saveGame();
  setInterval(() => { if (G.state === 'home' || G.state === 'run') saveGame(); }, 30000);
  requestAnimationFrame(loop);
}
window.addEventListener('DOMContentLoaded', boot);
