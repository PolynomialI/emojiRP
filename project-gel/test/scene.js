// Visual test scene: hero, every enemy model, every impostor type, decals and effects
const ARENA_PRESETS = [
  { stoneA: '#2b4c68', stoneB: '#3e6788', grout: '#0c1c2a', accent: '#4dffa0', fog: '#0a1f33', sky: '#7aa3c8', ground: '#16304a', light: '#fff6ea', spotMin: 0.42 },
  { stoneA: '#35554f', stoneB: '#4a6e66', grout: '#0b1a17', accent: '#62ff7a', fog: '#071a16', sky: '#7cc4b0', ground: '#12302a', light: '#f2fff4', spotMin: 0.4 },
  { stoneA: '#9a8fc0', stoneB: '#b9b0dc', grout: '#3a3355', accent: '#ff9bd1', fog: '#1d1834', sky: '#d6c8ff', ground: '#3a2f5c', light: '#fff4ec', spotMin: 0.5 },
  { stoneA: '#6b4a32', stoneB: '#8a6444', grout: '#22140c', accent: '#ffb35c', fog: '#170e14', sky: '#c9a07a', ground: '#2d1d18', light: '#ffe7c4', spotMin: 0.36 },
  { stoneA: '#9ec9e6', stoneB: '#cfe7f7', grout: '#4e7894', accent: '#bff3ff', fog: '#0d2236', sky: '#cfeaff', ground: '#3d6684', light: '#f4fbff', spotMin: 0.48 },
  { stoneA: '#2e2a2c', stoneB: '#453e3d', grout: '#120a08', accent: '#ff6a1a', fog: '#1a0c08', sky: '#a06a50', ground: '#2a1410', light: '#ffe2c8', spotMin: 0.4 },
];
const TEST = { arena: 0, run: false, t: 0, speed: 0, fistsOut: false, mode: 'scene', elite: false };
window.TEST = TEST;

function applyArena(i) {
  const a = ARENA_PRESETS[i], f = R.frame;
  f.arena = i; f.stoneA = hexToRgb(a.stoneA); f.stoneB = hexToRgb(a.stoneB); f.grout = hexToRgb(a.grout); f.accent = hexToRgb(a.accent);
  f.fogCol = hexToRgb(a.fog); f.skyCol = hexToRgb(a.sky); f.groundCol = hexToRgb(a.ground); f.lightCol = hexToRgb(a.light); f.spotMin = a.spotMin;
}

const canvas = document.getElementById('c');
if (!R.init(canvas)) document.body.textContent = 'no webgl2';
buildTextures();
const t0 = performance.now();
const models = buildModels();
TEST.buildMs = performance.now() - t0;
TEST.meshStats = Object.fromEntries(Object.entries(models.meshes).map(([k, m]) => [k, { verts: m.nv, tris: m.ni / 3 }]));
R.initEnemies(models);
R.resize(innerWidth, innerHeight, 1);
const hero = new Hero();
hero.reset(0, 0);
hero.auraLevel = 0;
{ const L = R.frame.lightDir, l = Math.hypot(...L); R.frame.lightDir = L.map(v => v / l); }
applyArena(0);

const names = ['stickman', 'sprinter', 'brute', 'archer', 'splitter', 'shield'];
const bosses = ['stomper', 'hurler', 'charger', 'twin', 'conductor'];
const TINTS = { stickman: '#f5891f', sprinter: '#ffa62b', brute: '#e8642a', archer: '#f5891f', splitter: '#f39a2e', shield: '#f5891f', stomper: '#ff6f8f', hurler: '#9a7bff', charger: '#e2504f', twin: '#ff70b0', conductor: '#ff79aa' };

function step(dt) {
  TEST.t += dt;
  R.frame.time = TEST.t;
  const sp = TEST.speed;
  const vel = [Math.sin(TEST.t * 0.0) * 0, 0, sp];
  hero.update(dt, [vel[0], 0, vel[2]], true);

  hero.phase += 0;
}

function render() {
  R.resize(innerWidth, innerHeight, 1);
  R.resetStreams();
  const f = R.frame;
  if (TEST.mode === 'scene') {
    const tgt = [0, 0.4, -0.4];
    const dist = 11;
    const pitch = 0.9;
    R.setCamera([tgt[0], tgt[1] + Math.sin(pitch) * dist, tgt[2] + Math.cos(pitch) * dist], tgt, 0.55);
  } else if (TEST.mode === 'close') {
    R.setCamera([0, 1.5, 4.2], [0, 0.85, 0], 0.55);
  } else if (TEST.mode === 'bosses') {
    R.setCamera([0, 6, 12], [0, 1.4, -1], 0.6);
  } else if (TEST.mode === 'items') {
    R.setCamera([0, 3.2, 6.5], [0, 0.6, 0], 0.5);
  }
  f.spot = [0, 0, 0, 12];
  if (TEST.mode === 'scene' || TEST.mode === 'close') {
    SCENE.hero = hero.out; SCENE.heroShadow = hero.shadow;
  } else { SCENE.hero = null; SCENE.heroShadow = null; }
  SCENE.aura = hero.auraLevel > 0 && TEST.mode === 'scene' ? { x: hero.pos[0], z: hero.pos[2], r: 2.0, level: hero.auraLevel } : null;
  SCENE.bubble = TEST.bubble ? { x: hero.pos[0], y: 0.85, z: hero.pos[2], r: 1.05, hit: [0, 0, 0, 0], fade: 1 } : null;
  const t = TEST.t;
  if (TEST.mode === 'scene') {
    for (let i = 0; i < names.length; i++) {
      const name = names[i], m = models.defs[name];
      const a = (i / names.length) * TAU + 0.3;
      const x = Math.cos(a) * 3.2, z = Math.sin(a) * 2.6 - 0.5;
      const clip = m.clips.run, fr = Math.floor((t * 1.6 + i * 0.37) * clip.frames) % clip.frames;
      const tint = hexToRgb(TINTS[name]);
      const sc = name === 'brute' ? 1.6 : 1;
      pushEnemy(name, TEST.elite && i === 0, x, 0, z, Math.atan2(-x, -z), clip.row + fr, sc, 1, 0, 0, 0, tint[0], tint[1], tint[2]);
      pushDecal(x + 0.25 * sc, z + 0.15 * sc, 0.45 * sc, 0.32 * sc, 0.5, 1, 0, 0, 0.02, 0.04, 0.08, 0.55);
    }
    // a little crowd of stickmen in the back
    for (let i = 0; i < 24; i++) {
      const x = -6 + (i % 8) * 1.6 + (Math.floor(i / 8) % 2) * 0.8, z = -5 - Math.floor(i / 8) * 1.4;
      const clip = models.defs.stickman.clips.run, fr = Math.floor((t * 1.6 + i * 0.13) * clip.frames) % clip.frames;
      pushEnemy('stickman', false, x, 0, z, 0.2 * Math.sin(i), clip.row + fr, 1, 1, 0, 0, 0, 0.96, 0.54, 0.12);
      pushDecal(x + 0.25, z + 0.15, 0.45, 0.32, 0.5, 1, 0, 0, 0.02, 0.04, 0.08, 0.55);
    }
    // goo objects around the hero
    pushImp(1.4, 0.7, 0.8, 0.12, 1, 0, 0, 1.4, 0, 0, 0.2, t, 0, 0, 0, 1);
    pushImp(-1.6, 1.1, 0.6, 0.16, 0, 0.3, 1, 1, 6, 1, 0.25, t, 0, 0, 0, 1);
    pushImp(0.9, 1.6, -0.6, 0.18, 0.4, 0.8, 0.3, 1, 1, 0.8, 0.2, t, 0, 0, 0, 1);
    pushImp(-0.8, 0.0, 1.6, 0.3, 0, 0, 1, 1, 2, 1.6, 0.4, t, 0, 0, 0, 1);
    for (let i = 0; i < 3; i++) { const a = t * 3 + i * TAU / 3; pushImp(Math.cos(a) * 1.7, 0.55, Math.sin(a) * 1.7, 0.3, -Math.sin(a), 0, Math.cos(a), 1, 3, 0.4, 0.15, t, 0, 0, 0, 1); }
    for (let i = 0; i < 10; i++) pushImp(-3 + i * 0.6, 0.25, 2.4, 0.12, 0, 0, 1, 1, 8, 0, 0.3, t + i, 0, i % 3, 0, 1);
    pushImp(2.6, 0.4, 1.8, 0.28, 0, 0, 1, 1, 12, 0, 0, t, 0.5 + 0.5 * Math.sin(t * 2), 0, 0, 1);
    pushImp(3.4, 0.3, 0.6, 0.22, 0, 0, 1, 1, 9, 0, 0, t, 0, 0, 0, 1);
    pushImp(-3.4, 0.35, 1.0, 0.25, 0, 0, 1, 1, 10, 0, 0.2, t, 0, 0, 0, 1);
    pushImp(-2.6, 0.0, -1.6, 0.42, 0, 0, 1, 1, 5, 3, 0.1, t, 0.8 + 0.2 * Math.sin(t * 3), 0.5, 0, 1);
    // decals
    pushDecal(1.8, 1.4, 0.7, 0.7, 0.3, 0, 3.3, 0.2, 0.96, 0.54, 0.12, 0.92);
    pushDecal(-1.2, -1.6, 0.6, 0.6, 1.3, 0, 7.1, 0.1, 0.1, 0.8, 1.0, 0.9);
    pushDecal(2.2, -2.0, 1.3, 1.3, 0, 4, 0, (t * 0.5) % 1, 1, 0.25, 0.2, 0.9);
    pushDecal(-2.8, 2.6, 1.0, 1.0, 0, 3, 0, (t * 1.3) % 1, 0.6, 0.95, 1.0, 0.9, true);
    // ribbons: swoosh around the hero and a lightning bolt
    const pts = [];
    for (let i = 0; i < 18; i++) { const a = t * 6 - i * 0.12; pts.push(Math.cos(a) * 1.2, 0.8, Math.sin(a) * 1.2); }
    R.ribStrip(pts, 18, 0.09, [0.55, 0.95, 1.0, u => (1 - u) * 0.9], 0, 0, 1, u => 1 - u);
    const bolt = [];
    for (let i = 0; i < 8; i++) bolt.push(3.6 + (i ? rand(-0.15, 0.15) : 0), 3.2 - i * 0.43, -1.4 + (i ? rand(-0.15, 0.15) : 0));
    R.ribStrip(bolt, 8, 0.06, [0.7, 0.95, 1.0, 1], 0);
    const jet = [];
    for (let i = 0; i < 10; i++) jet.push(-0.3 - i * 0.4, 0.9, -0.2 - i * 0.25);
    if (TEST.laser) R.ribStrip(jet, 10, 0.2, [0.25, 0.85, 1.0, 1], 1, -t * 2, 4, u => 1 + 0.25 * Math.sin(u * 20 - t * 20));
    FX.emit();
  } else if (TEST.mode === 'bosses') {
    for (let i = 0; i < bosses.length; i++) {
      const name = bosses[i], m = models.defs[name];
      const clipName = TEST.bossClip && m.clips[TEST.bossClip] ? TEST.bossClip : 'run';
      const clip = m.clips[clipName], fr = Math.floor((t * 0.8) * clip.frames) % clip.frames;
      const tint = hexToRgb(TINTS[name]);
      const x = -6 + i * 3, z = -1;
      pushEnemy(name, false, x, 0, z, 0.35, clip.row + fr, 2.6, 1, 0, 0, 0, tint[0], tint[1], tint[2]);
      pushDecal(x + 0.6, z + 0.4, 1.2, 0.9, 0.5, 1, 0, 0, 0.02, 0.04, 0.08, 0.55);
    }
    const ex = ['archer', 'shield', 'splitter'];
    for (let i = 0; i < ex.length; i++) {
      const m = models.defs[ex[i]], clip = ex[i] === 'archer' ? m.clips.aim : m.clips.run;
      pushEnemy(ex[i], true, -2 + i * 2, 0, 2.6, 0.3, clip.row + (Math.floor(t * 20) % clip.frames), 1.5, 1, 0, 0, 0, 0.96, 0.54, 0.12);
    }
  } else if (TEST.mode === 'items') {
    const types = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28];
    types.forEach((ty, i) => {
      const col = i % 8, row = Math.floor(i / 8);
      const x = -3.5 + col, z = -1.5 + row * 1.1;
      pushImp(x, 0.45, z, 0.32, 0, 0, 1, 1, ty, ty === 5 ? 3 : (i % 3) * 0.5, 0.1, t, ty === 12 ? 0.6 : ty === 5 ? 1 : 1, ty === 8 ? 1 : 0, 0, 1);
    });
  }
  R.drawScene();
  R.post();
}

let last = performance.now();
TEST.frame = (dt = 1 / 60, draw = true) => { step(dt); FX.update(dt); if (draw) render(); };
TEST.loop = false;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (TEST.loop) TEST.frame(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
TEST.ready = true;
