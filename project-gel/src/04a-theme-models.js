// ============================================================
// Theme scenery and new boss bodies, built with prop() (see 04-models.js).
// Model units: 1 is about one hero leg. Colors are baked in; parts without col take the instance tint.
// ============================================================
const THEME_CLIPS = { slime: ['run'], gooblin: ['run'], tumbleweed: ['roll'], wreckbot: ['run', 'slam', 'idle', 'throw'], yeti: ['run', 'slam', 'idle', 'conduct'], golem: ['run', 'slam', 'idle', 'throw'] };
// mesh cell size per model: big boxy scenery can be coarse (colors still follow the nearest part), thin parts need fine cells
const THEME_CELLS = { gooblin: 0.018, lollipop: 0.018, candycane: 0.02, gumdrop: 0.04, cupcake: 0.02, slime: 0.03, pitball: 0.05, bumper: 0.035, tubewall: 0.04, wreckbot: 0.015, wreckball: 0.02, wormhead: 0.022, wormseg: 0.03, tumbleweed: 0.02, cactus0: 0.025, building0: 0.03, building1: 0.03, building2: 0.03, tower: 0.03, car: 0.022, streetlamp: 0.016, hydrant: 0.02, bin: 0.025, barrier: 0.03, tree: 0.03,
  pine: 0.025, snowman: 0.02, icecrystal: 0.022, iceblock: 0.035, icicle: 0.018, icespike: 0.02, yeti: 0.015,
  obsidian: 0.022, vent: 0.025, deadtree: 0.016, basalt: 0.035, golem: 0.016,
  jtree: 0.025, mushroom: 0.022, fern: 0.018, bamboo: 0.02, roots: 0.02, hydrabody: 0.02, hydrahead: 0.016, vineseg: 0.03,
  palm: 0.022, barrel: 0.022, crate: 0.03, starfish: 0.02, post: 0.025, wreck: 0.035, crab: 0.016, crabclaw: 0.018, crableg: 0.02 };
// built after everything chapter 1 needs
MESH_ORDER.push('gooblin', 'cactus0', 'cactus1', 'skull', 'tumbleweed', 'wormhead', 'wormseg',
  'building0', 'building1', 'building2', 'tower', 'car', 'streetlamp', 'hydrant', 'bin', 'barrier', 'tree', 'wreckbot', 'wreckball',
  'pitball', 'bumper', 'tubewall',
  'lollipop', 'candycane', 'gumdrop', 'cupcake', 'slime',
  'pine', 'snowman', 'icecrystal', 'iceblock', 'icicle', 'icespike', 'yeti',
  'obsidian', 'vent', 'deadtree', 'basalt', 'golem',
  'jtree', 'mushroom', 'fern', 'bamboo', 'roots', 'hydrabody', 'hydrahead', 'vineseg',
  'palm', 'barrel', 'crate', 'starfish', 'post', 'wreck', 'crab', 'crabclaw', 'crableg');
function themeModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  // ---------- the Golden Gooblin: a gold blob with a loot sack, grinning; the body takes the tint ----------
  {
    const sack = C('#8a5a2a'), tie = C('#5a3a1a'), coin = C('#ffe27a'), white = C('#fff8ea'), pupil = C('#16101a'), mouth = C('#5a1a10');
    P('gooblin', [
      { s: 'ell', c: [0, 0.3, 0], rr: [0.32, 0.3, 0.3], k: 0.06 },
      { s: 'sph', c: [0, 0.52, -0.02], r: 0.16, k: 0.08 },
      { s: 'sph', c: [0, 0.42, -0.3], r: 0.22, col: sack, k: 0.04 },
      { s: 'tor', ax: 'y', c: [0, 0.6, -0.3], R: 0.07, r: 0.03, a0: -Math.PI, a1: Math.PI, col: tie, k: 0 },
      { s: 'sph', c: [0.05, 0.66, -0.3], r: 0.05, col: coin, k: 0 }, { s: 'sph', c: [-0.06, 0.64, -0.26], r: 0.045, col: coin, k: 0 },
      { s: 'sph', c: [0.12, 0.44, 0.22], r: 0.085, col: white, k: 0 }, { s: 'sph', c: [-0.12, 0.44, 0.22], r: 0.085, col: white, k: 0 },
      { s: 'sph', c: [0.13, 0.45, 0.29], r: 0.042, col: pupil, k: 0 }, { s: 'sph', c: [-0.13, 0.45, 0.29], r: 0.042, col: pupil, k: 0 },
      { s: 'ell', c: [0, 0.28, 0.27], rr: [0.13, 0.05, 0.05], col: mouth, k: 0.01 },
      { s: 'cap', a: [0.05, 0.31, 0.3], b: [0.05, 0.26, 0.31], r: 0.022, col: white, k: 0 },
      ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.22, 0.5, 0], b: [sx * 0.34, 0.68, -0.04], r: 0.05, r2: 0.015, k: 0.03 })),
    ]);
  }
  // ---------- desert ----------
  const cg = C('#56a23e'), cgd = C('#3f8030'), pink = C('#ff6fa8'), yel = C('#ffd34a'), bone = C('#f1e6cf'), dark = C('#2a1a12');
  const ribs = (cx, cz, y0, y1, r, n) => Array.from({ length: n }, (_, i) => { const a = (i / n) * TAU; return { s: 'cap', a: [cx + Math.cos(a) * r, y0, cz + Math.sin(a) * r], b: [cx + Math.cos(a) * r, y1, cz + Math.sin(a) * r], r: 0.028, col: cgd, k: 0.03 }; });
  P('cactus0', [
    { s: 'cap', a: [0, -0.05, 0], b: [0, 1.25, 0], r: 0.17, col: cg },
    ...ribs(0, 0, 0.05, 1.22, 0.15, 7),
    { s: 'cap', a: [0.08, 0.55, 0], b: [0.34, 0.6, 0], r: 0.1, col: cg }, { s: 'cap', a: [0.34, 0.6, 0], b: [0.35, 0.98, 0], r: 0.1, col: cg },
    { s: 'cap', a: [-0.08, 0.76, 0], b: [-0.3, 0.8, 0.02], r: 0.09, col: cg }, { s: 'cap', a: [-0.3, 0.8, 0.02], b: [-0.31, 1.05, 0.02], r: 0.09, col: cg },
    { s: 'sph', c: [0, 1.4, 0], r: 0.075, col: pink, k: 0.01 }, { s: 'sph', c: [0.35, 1.06, 0], r: 0.05, col: pink, k: 0.01 },
  ]);
  P('cactus1', [
    { s: 'ell', c: [0, 0.26, 0], rr: [0.33, 0.3, 0.33], col: cg },
    ...Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * TAU; return { s: 'ell', c: [Math.cos(a) * 0.27, 0.26, Math.sin(a) * 0.27], rr: [0.06, 0.27, 0.06], col: cgd, k: 0.04 }; }),
    { s: 'sph', c: [0.06, 0.56, 0.03], r: 0.07, col: yel, k: 0.01 }, { s: 'sph', c: [-0.08, 0.55, -0.04], r: 0.06, col: pink, k: 0.01 },
  ]);
  P('skull', [
    { s: 'ell', c: [0, 0.13, 0], rr: [0.2, 0.13, 0.26], col: bone, k: 0.05 },
    { s: 'ell', c: [0, 0.1, 0.24], rr: [0.11, 0.08, 0.12], col: bone, k: 0.05 },
    { s: 'sph', c: [0.09, 0.18, 0.15], r: 0.05, col: dark, k: 0.0 }, { s: 'sph', c: [-0.09, 0.18, 0.15], r: 0.05, col: dark, k: 0.0 },
    { s: 'cap', a: [0.15, 0.18, -0.08], b: [0.38, 0.27, -0.02], r: 0.045, r2: 0.012, col: bone, k: 0.02 },
    { s: 'cap', a: [-0.15, 0.18, -0.08], b: [-0.38, 0.27, -0.02], r: 0.045, r2: 0.012, col: bone, k: 0.02 },
  ]);
  // a ball of dry twigs, centred on the pivot so it can roll
  {
    const rnd = mulberry32(777), parts = [], tw = C('#b48a52'), twd = C('#8a6436');
    for (let i = 0; i < 26; i++) {
      const a1 = rnd() * TAU, b1 = Math.acos(rnd() * 2 - 1), a2 = rnd() * TAU, b2 = Math.acos(rnd() * 2 - 1), R1 = 0.3 + rnd() * 0.15, R2 = 0.3 + rnd() * 0.15;
      parts.push({ s: 'cap', a: [Math.sin(b1) * Math.cos(a1) * R1, 0.5 + Math.cos(b1) * R1, Math.sin(b1) * Math.sin(a1) * R1], b: [Math.sin(b2) * Math.cos(a2) * R2, 0.5 + Math.cos(b2) * R2, Math.sin(b2) * Math.sin(a2) * R2], r: 0.022, col: i % 3 ? tw : twd, k: 0.0 });
    }
    P('tumbleweed', parts, { ao: 0.8 });
  }
  // ---------- Sand Worm (chapter 2 boss): a goo worm; body parts without col take the boss tint ----------
  {
    const tooth = C('#fff6e2'), mouth = C('#3a0d22'), eyeW = C('#fff6e6'), pupil = C('#16101a'), spike = C('#ffe0a8'), belly = C('#f0b6e8');
    P('wormhead', [
      { s: 'ell', c: [0, 0, 0], rr: [0.46, 0.42, 0.5], k: 0.06 },
      { s: 'ell', c: [0, -0.12, 0.3], rr: [0.34, 0.2, 0.26], col: belly, k: 0.05 },
      { s: 'ell', c: [0, -0.08, 0.44], rr: [0.24, 0.12, 0.08], col: mouth, k: 0.02 },
      ...[-0.16, -0.06, 0.06, 0.16].map(x => ({ s: 'cap', a: [x, 0.03, 0.47], b: [x, -0.06, 0.5], r: 0.03, r2: 0.008, col: tooth, k: 0 })),
      ...[-0.11, 0, 0.11].map(x => ({ s: 'cap', a: [x, -0.19, 0.47], b: [x, -0.11, 0.5], r: 0.026, r2: 0.007, col: tooth, k: 0 })),
      { s: 'sph', c: [0.18, 0.22, 0.32], r: 0.11, col: eyeW, k: 0.0 }, { s: 'sph', c: [-0.18, 0.22, 0.32], r: 0.11, col: eyeW, k: 0.0 },
      { s: 'sph', c: [0.19, 0.23, 0.41], r: 0.05, col: pupil, k: 0 }, { s: 'sph', c: [-0.19, 0.23, 0.41], r: 0.05, col: pupil, k: 0 },
      { s: 'cap', a: [0.3, -0.18, 0.3], b: [0.36, -0.2, 0.62], r: 0.06, r2: 0.02, col: spike, k: 0.02 }, { s: 'cap', a: [-0.3, -0.18, 0.3], b: [-0.36, -0.2, 0.62], r: 0.06, r2: 0.02, col: spike, k: 0.02 },
      ...[0.0, -0.18, -0.34].map((z, i) => ({ s: 'cap', a: [0, 0.36 - i * 0.02, z], b: [0, 0.62 - i * 0.05, z - 0.12], r: 0.07, r2: 0.015, col: spike, k: 0.02 })),
    ]);
    P('wormseg', [
      { s: 'ell', c: [0, 0, 0], rr: [0.4, 0.38, 0.3], k: 0.06 },
      { s: 'tor', ax: 'z', c: [0, 0, 0.0], R: 0.36, r: 0.05, a0: -Math.PI, a1: Math.PI, col: belly, k: 0.03 },
      { s: 'ell', c: [0, -0.2, 0.0], rr: [0.26, 0.18, 0.26], col: belly, k: 0.05 },
      { s: 'cap', a: [0, 0.32, 0], b: [0, 0.58, -0.08], r: 0.065, r2: 0.014, col: spike, k: 0.02 },
    ]);
  }
  // ---------- Neon City ----------
  {
    const glass = C('#6fb2ff'), glassD = C('#3d6fae'), lit = C('#ffe08a'), roof = C('#3a3f4c'), neonP = C('#ff4fd8'), neonC = C('#3ff0ff'), steel = C('#8f97a6'), tire = C('#1d1f26'), lamp = C('#fff3c4'), red = C('#ff3b3b'), conc = C('#c9ccd4');
    // office blocks: a 1x1 footprint, glass bands on every floor, a parapet and roof clutter; the body takes the tint
    const building = (name, floors, o = {}) => {
      const H = floors * 0.16 + 0.1, parts = [{ s: 'box', c: [0, H / 2, 0], hs: [0.48, H / 2, 0.48], rd: 0.02, k: 0.0 }];
      for (let f = 0; f < floors; f++) {
        const y = 0.12 + f * 0.16;
        parts.push({ s: 'box', c: [0, y + 0.05, 0], hs: [0.49, 0.04, 0.49], rd: 0.005, col: (f * 7 + floors) % 5 === 2 ? lit : f % 2 ? glass : glassD, k: 0 });
      }
      parts.push({ s: 'box', c: [0, H + 0.02, 0], hs: [0.5, 0.025, 0.5], rd: 0.01, col: roof, k: 0 });
      parts.push({ s: 'box', c: [0.15, H + 0.08, -0.12], hs: [0.1, 0.05, 0.08], rd: 0.01, col: steel, k: 0 });
      if (o.sign) parts.push({ s: 'box', c: [0, H * 0.62, 0.5], hs: [0.22, 0.06, 0.012], rd: 0.008, col: o.sign, k: 0 });
      if (o.tank) { parts.push({ s: 'cyl', ax: 'y', c: [-0.2, H + 0.16, 0.15], r: 0.08, hh: 0.08, rd: 0.02, col: C('#8a5a33'), k: 0 }); }
      P(name, parts, { ao: 3 });
    };
    building('building0', 6, { sign: neonP, tank: true });
    building('building1', 9, { sign: neonC });
    building('building2', 4, { tank: true });
    // the landmark: a stepped skyscraper with a spire and a neon crown
    {
      const parts = [{ s: 'box', c: [0, 0.9, 0], hs: [0.48, 0.9, 0.48], rd: 0.02 }, { s: 'box', c: [0, 1.95, 0], hs: [0.36, 0.2, 0.36], rd: 0.02 }, { s: 'box', c: [0, 2.3, 0], hs: [0.26, 0.15, 0.26], rd: 0.02 }];
      for (let f = 0; f < 11; f++) { const y = 0.12 + f * 0.16; parts.push({ s: 'box', c: [0, y + 0.05, 0], hs: [0.49, 0.045, 0.49], rd: 0.005, col: f % 4 === 1 ? lit : f % 2 ? glass : glassD, k: 0 }); }
      for (let f = 0; f < 2; f++) parts.push({ s: 'box', c: [0, 1.85 + f * 0.13, 0], hs: [0.37, 0.04, 0.37], rd: 0.005, col: glass, k: 0 });
      parts.push({ s: 'box', c: [0, 2.46, 0], hs: [0.28, 0.03, 0.28], rd: 0.01, col: neonP, k: 0 });
      parts.push({ s: 'cap', a: [0, 2.45, 0], b: [0, 2.95, 0], r: 0.03, r2: 0.01, col: steel, k: 0 });
      parts.push({ s: 'sph', c: [0, 2.97, 0], r: 0.035, col: red, k: 0 });
      parts.push({ s: 'box', c: [0, 1.25, 0.5], hs: [0.3, 0.08, 0.012], rd: 0.01, col: neonC, k: 0 });
      P('tower', parts, { ao: 3 });
    }
    // a parked car about 1 long; the body takes the tint
    P('car', [
      { s: 'box', c: [0, 0.16, 0], hs: [0.22, 0.09, 0.5], rd: 0.06 },
      { s: 'box', c: [0, 0.3, -0.04], hs: [0.19, 0.08, 0.26], rd: 0.06 },
      { s: 'box', c: [0, 0.3, -0.04], hs: [0.2, 0.06, 0.27], rd: 0.05, col: glassD, k: 0 },
      ...[[0.2, 0.32], [-0.2, 0.32], [0.2, -0.32], [-0.2, -0.32]].map(([x, z]) => ({ s: 'cyl', ax: 'x', c: [x, 0.09, z], r: 0.09, hh: 0.04, rd: 0.02, col: tire, k: 0 })),
      { s: 'sph', c: [0.14, 0.17, 0.49], r: 0.035, col: lamp, k: 0 }, { s: 'sph', c: [-0.14, 0.17, 0.49], r: 0.035, col: lamp, k: 0 },
      { s: 'sph', c: [0.15, 0.18, -0.49], r: 0.03, col: red, k: 0 }, { s: 'sph', c: [-0.15, 0.18, -0.49], r: 0.03, col: red, k: 0 },
    ]);
    P('streetlamp', [
      { s: 'cyl', ax: 'y', c: [0, 0.06, 0], r: 0.07, hh: 0.06, rd: 0.02, col: steel, k: 0 },
      { s: 'cap', a: [0, 0.1, 0], b: [0, 1.4, 0], r: 0.03, col: steel, k: 0 },
      { s: 'cap', a: [0, 1.4, 0], b: [0, 1.46, 0.28], r: 0.025, col: steel, k: 0.02 },
      { s: 'ell', c: [0, 1.42, 0.32], rr: [0.08, 0.04, 0.1], col: steel, k: 0.01 },
      { s: 'ell', c: [0, 1.39, 0.32], rr: [0.06, 0.02, 0.08], col: lamp, k: 0 },
    ]);
    P('hydrant', [
      { s: 'cyl', ax: 'y', c: [0, 0.16, 0], r: 0.09, hh: 0.16, rd: 0.03, col: red, k: 0 },
      { s: 'sph', c: [0, 0.33, 0], r: 0.09, col: red, k: 0.02 },
      { s: 'cyl', ax: 'x', c: [0, 0.22, 0], r: 0.04, hh: 0.14, rd: 0.01, col: red, k: 0.01 },
      { s: 'cyl', ax: 'y', c: [0, 0.03, 0], r: 0.12, hh: 0.03, rd: 0.01, col: red, k: 0.01 },
    ]);
    P('bin', [
      { s: 'cyl', ax: 'y', c: [0, 0.2, 0], r: 0.14, hh: 0.2, rd: 0.03, col: C('#4f8a5c'), k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 0.42, 0], r: 0.155, hh: 0.025, rd: 0.02, col: C('#3a6a46'), k: 0 },
    ]);
    P('barrier', [
      { s: 'box', c: [0, 0.18, 0], hs: [0.5, 0.18, 0.12], rd: 0.04, col: conc, k: 0 },
      { s: 'box', c: [0, 0.05, 0], hs: [0.5, 0.05, 0.2], rd: 0.03, col: conc, k: 0.02 },
      ...[-0.3, 0, 0.3].map(x => ({ s: 'box', c: [x, 0.25, 0.121], hs: [0.06, 0.05, 0.005], rd: 0.0, col: C('#ff8a1f'), k: 0 })),
    ]);
    P('tree', [
      { s: 'cap', a: [0, 0, 0], b: [0, 0.75, 0], r: 0.07, r2: 0.05, col: C('#7a5230'), k: 0.02 },
      { s: 'sph', c: [0, 1.0, 0], r: 0.4, col: C('#3f9a4a'), k: 0.1 }, { s: 'sph', c: [0.22, 0.86, 0.1], r: 0.26, col: C('#4fb05a'), k: 0.1 },
      { s: 'sph', c: [-0.2, 0.9, -0.12], r: 0.28, col: C('#358a40'), k: 0.1 }, { s: 'sph', c: [0.05, 1.28, 0.05], r: 0.22, col: C('#5ac064'), k: 0.1 },
    ]);
  }
  // ---------- Wrecking Bot (chapter 3 boss): a boxy construction robot; plain parts take the boss tint (yellow) ----------
  {
    const m = makeHumanoid({ ...STICK, hipY: 0.44, shY: 0.8, headY: 1.04, headR: 0.2, headZ: 0.02, shW: 0.25, hipW: 0.12, elOut: 0.07, upperLen: 0.17, foreLen: 0.16, pelvisR: 0.17, torsoR: 0.2, neckR: 0.1, armR: 0.085, handR: 0.11, legR: 0.11 });
    const J = m.J, steel = C('#7c8696'), dark = C('#2b2f3a'), red = C('#ff3040'), black = C('#1c1c22'), glow = C('#7ff6ff');
    const parts = [
      { s: 'box', c: [0, J.pelvis[1], 0], hs: [0.21, 0.08, 0.15], rd: 0.04, col: steel, bone: 0, k: 0.02 },
      { s: 'box', c: [0, 0.64, 0], hs: [0.29, 0.2, 0.2], rd: 0.06, bone: 1, k: 0.03 },
      { s: 'box', c: [0, 0.55, 0.201], hs: [0.27, 0.028, 0.006], rd: 0, col: black, bone: 1, k: 0 },
      { s: 'box', c: [0, 0.48, 0.201], hs: [0.27, 0.028, 0.006], rd: 0, col: black, bone: 1, k: 0 },
      { s: 'sph', c: [0, 0.7, 0.2], r: 0.06, col: glow, bone: 1, k: 0 },
      { s: 'box', c: [0, 0.86, -0.02], hs: [0.16, 0.05, 0.12], rd: 0.03, col: steel, bone: 1, k: 0.03 },
      { s: 'box', c: [J.head[0], J.head[1], J.head[2]], hs: [0.17, 0.13, 0.15], rd: 0.05, bone: 2, k: 0.02 },
      { s: 'box', c: [J.head[0], J.head[1] + 0.02, J.head[2] + 0.145], hs: [0.135, 0.04, 0.012], rd: 0.02, col: red, bone: 2, k: 0 },
      { s: 'cap', a: [0.08, J.head[1] + 0.12, J.head[2]], b: [0.11, J.head[1] + 0.3, J.head[2] - 0.03], r: 0.018, col: steel, bone: 2, k: 0 },
      { s: 'sph', c: [0.11, J.head[1] + 0.31, J.head[2] - 0.03], r: 0.035, col: red, bone: 2, k: 0 },
    ];
    for (const sd of ['L', 'R']) {
      const sx = sd === 'L' ? 1 : -1, b = sd === 'L' ? 3 : 5;
      parts.push({ s: 'sph', c: [sx * 0.29, 0.8, 0], r: 0.13, bone: 1, k: 0.03 });
      parts.push({ s: 'cap', a: J['sh' + sd], b: J['el' + sd], r: 0.07, col: steel, bone: b, k: 0.02 });
      parts.push({ s: 'cap', a: J['el' + sd], b: J['ha' + sd], r: 0.08, r2: 0.07, col: steel, bone: b + 1, k: 0.02 });
      parts.push({ s: 'box', c: J['ha' + sd], hs: [0.08, 0.08, 0.08], rd: 0.04, col: dark, bone: b + 1, k: 0.02 });
      const lb = sd === 'L' ? 7 : 9;
      parts.push({ s: 'box', c: [(J['hi' + sd][0] + J['kn' + sd][0]) / 2, (J['hi' + sd][1] + J['kn' + sd][1]) / 2, 0], hs: [0.08, 0.12, 0.09], rd: 0.04, col: steel, bone: lb, k: 0.02 });
      parts.push({ s: 'box', c: [(J['kn' + sd][0] + J['an' + sd][0]) / 2, (J['kn' + sd][1] + J['an' + sd][1]) / 2, 0.01], hs: [0.1, 0.12, 0.1], rd: 0.04, bone: lb + 1, k: 0.02 });
      parts.push({ s: 'box', c: [J['an' + sd][0], 0.04, 0.05], hs: [0.11, 0.04, 0.15], rd: 0.03, col: dark, bone: lb + 1, k: 0.02 });
    }
    m.parts = parts; m.top = J.head[1] + 0.34; m.bmin = [-0.6, -0.03, -0.5]; m.bmax = [0.6, m.top + 0.05, 0.5]; m.name = 'wreckbot';
    defs.wreckbot = m;
    // the wrecking ball: dark iron with stubby studs
    P('wreckball', [
      { s: 'sph', c: [0, 0.5, 0], r: 0.38, col: C('#3a3f4a'), k: 0 },
      ...[[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0.7, 0.7, 0], [-0.7, 0.7, 0], [0, 0.7, 0.7], [0, 0.7, -0.7], [0.7, -0.7, 0], [-0.7, -0.7, 0]].map(([x, y, z]) => ({ s: 'cap', a: [x * 0.3, 0.5 + y * 0.3, z * 0.3], b: [x * 0.48, 0.5 + y * 0.48, z * 0.48], r: 0.06, r2: 0.02, col: C('#5a6170'), k: 0.01 })),
    ]);
  }
  // ---------- Bounce House ----------
  {
    const white = C('#fbfbff');
    // a ball-pit ball, centred on the pivot; the instance tint colors it
    P('pitball', [{ s: 'sph', c: [0, 0.5, 0], r: 0.5, k: 0 }], { ao: 0.3 });
    // an inflatable pillar with white rings; the body takes the tint
    P('bumper', [
      { s: 'cyl', ax: 'y', c: [0, 0.5, 0], r: 0.42, hh: 0.5, rd: 0.2, k: 0 },
      { s: 'sph', c: [0, 1.0, 0], r: 0.34, k: 0.12 },
      ...[0.18, 0.5, 0.82].map(y => ({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.42, r: 0.06, a0: -Math.PI, a1: Math.PI, col: white, k: 0.02 })),
    ], { ao: 1 });
    // the bouncy wall: fat inflatable posts
    P('tubewall', [
      { s: 'cyl', ax: 'y', c: [0, 0.55, 0], r: 0.48, hh: 0.55, rd: 0.25, k: 0 },
      { s: 'tor', ax: 'y', c: [0, 0.62, 0], R: 0.48, r: 0.07, a0: -Math.PI, a1: Math.PI, col: white, k: 0.03 },
      { s: 'sph', c: [0, 1.12, 0], r: 0.2, col: white, k: 0.1 },
    ], { ao: 1 });
  }
  // ---------- Candy Land ----------
  {
    const white = C('#fffaf4'), red = C('#ff3b5c'), pink = C('#ff7ab8'), mint = C('#7ff0c8'), yel = C('#ffe066'), choc = C('#6a3a22'), cream = C('#fff0f6'), cherry = C('#e8203a');
    P('lollipop', [
      { s: 'cap', a: [0, 0, 0], b: [0, 1.0, 0], r: 0.035, col: white, k: 0 },
      { s: 'cyl', ax: 'z', c: [0, 1.25, 0], r: 0.36, hh: 0.06, rd: 0.05, col: pink, k: 0 },
      ...[0.28, 0.19, 0.1].map((R, i) => ({ s: 'tor', ax: 'z', c: [0, 1.25, 0.03], R, r: 0.035, a0: -Math.PI, a1: Math.PI, col: [white, yel, white][i], k: 0 })),
      { s: 'tor', ax: 'z', c: [0, 1.25, -0.03], R: 0.22, r: 0.035, a0: -Math.PI, a1: Math.PI, col: white, k: 0 },
    ]);
    // candy cane: alternating stripes up the shaft and round the hook
    {
      const parts = [];
      for (let i = 0; i < 8; i++) parts.push({ s: 'cap', a: [0, i * 0.14, 0], b: [0, (i + 1) * 0.14, 0], r: 0.075, col: i % 2 ? white : red, k: 0.0 });
      for (let i = 0; i < 6; i++) { const a0 = Math.PI - (i / 6) * Math.PI, a1 = Math.PI - ((i + 1) / 6) * Math.PI; parts.push({ s: 'cap', a: [0.18 + Math.cos(a0) * 0.18, 1.12 + Math.sin(a0) * 0.18, 0], b: [0.18 + Math.cos(a1) * 0.18, 1.12 + Math.sin(a1) * 0.18, 0], r: 0.075, col: i % 2 ? red : white, k: 0 }); }
      P('candycane', parts);
    }
    // gumdrop: a sugared dome, colored by the instance tint
    P('gumdrop', [
      { s: 'ell', c: [0, 0.2, 0], rr: [0.42, 0.28, 0.42], k: 0.1 },
      { s: 'sph', c: [0, 0.42, 0], r: 0.24, k: 0.15 },
    ]);
    P('cupcake', [
      { s: 'cyl', ax: 'y', c: [0, 0.18, 0], r: 0.3, hh: 0.18, rd: 0.03, col: C('#8fd3ff'), k: 0 },
      ...Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * TAU; return { s: 'cap', a: [Math.cos(a) * 0.3, 0.02, Math.sin(a) * 0.3], b: [Math.cos(a) * 0.32, 0.34, Math.sin(a) * 0.32], r: 0.03, col: C('#6ab8f0'), k: 0.02 }; }),
      { s: 'tor', ax: 'y', c: [0, 0.42, 0], R: 0.24, r: 0.1, a0: -Math.PI, a1: Math.PI, col: cream, k: 0.06 },
      { s: 'tor', ax: 'y', c: [0, 0.54, 0], R: 0.15, r: 0.09, a0: -Math.PI, a1: Math.PI, col: cream, k: 0.06 },
      { s: 'sph', c: [0, 0.66, 0], r: 0.1, col: cream, k: 0.06 },
      { s: 'sph', c: [0, 0.8, 0], r: 0.075, col: cherry, k: 0.01 },
      ...[[0.15, 0.48, 0.12, pink], [-0.12, 0.5, 0.14, mint], [0.05, 0.6, -0.12, yel], [-0.16, 0.45, -0.08, choc]].map(([x, y, z, c]) => ({ s: 'sph', c: [x, y, z], r: 0.025, col: c, k: 0 })),
    ]);
    // jelly slime minion: a squishy dome with eyes; the body takes the tint
    P('slime', [
      { s: 'ell', c: [0, 0.24, 0], rr: [0.34, 0.26, 0.34], k: 0.08 },
      { s: 'sph', c: [0.1, 0.32, 0.27], r: 0.07, col: white, k: 0 }, { s: 'sph', c: [-0.1, 0.32, 0.27], r: 0.07, col: white, k: 0 },
      { s: 'sph', c: [0.1, 0.33, 0.33], r: 0.035, col: C('#16101a'), k: 0 }, { s: 'sph', c: [-0.1, 0.33, 0.33], r: 0.035, col: C('#16101a'), k: 0 },
    ]);
  }
  // ---------- Frozen Tundra ----------
  {
    const snow = C('#f8fcff'), pineG = C('#2f6e58'), pineD = C('#245846'), bark = C('#6a4a32'), coal = C('#1d1f26'), carrot = C('#ff8a2a'), scarf = C('#e8344a'), ice = C('#a8e2ff'), iceHi = C('#e4f7ff');
    // snowy pine: three tiers, each with a cap of snow
    P('pine', [
      { s: 'cap', a: [0, 0, 0], b: [0, 0.4, 0], r: 0.07, col: bark, k: 0 },
      ...[[0.3, 0.86, 0.44], [0.76, 1.28, 0.34], [1.16, 1.66, 0.24]].map(([y0, y1, r]) => ({ s: 'cap', a: [0, y0, 0], b: [0, y1, 0], r, r2: 0.03, col: pineG, k: 0.02 })),
      ...[[0.3, 0.86, 0.44], [0.76, 1.28, 0.34], [1.16, 1.66, 0.24]].map(([y0, y1, r]) => ({ s: 'cap', a: [0, y0 + 0.22, 0], b: [0, y1 + 0.05, 0], r: r * 0.62, r2: 0.03, col: snow, k: 0.04 })),
      { s: 'sph', c: [0.22, 0.42, 0.25], r: 0.08, col: pineD, k: 0.04 }, { s: 'sph', c: [-0.25, 0.86, -0.12], r: 0.06, col: pineD, k: 0.04 },
    ]);
    P('snowman', [
      { s: 'sph', c: [0, 0.3, 0], r: 0.3, col: snow, k: 0.06 },
      { s: 'sph', c: [0, 0.72, 0], r: 0.22, col: snow, k: 0.06 },
      { s: 'sph', c: [0, 1.04, 0], r: 0.16, col: snow, k: 0.05 },
      { s: 'tor', ax: 'y', c: [0, 0.9, 0], R: 0.13, r: 0.045, a0: -Math.PI, a1: Math.PI, col: scarf, k: 0.02 },
      { s: 'cap', a: [0.06, 0.88, 0.12], b: [0.1, 0.66, 0.2], r: 0.04, r2: 0.03, col: scarf, k: 0.02 },
      { s: 'cap', a: [0, 1.03, 0.14], b: [0, 1.01, 0.34], r: 0.035, r2: 0.006, col: carrot, k: 0.01 },
      { s: 'sph', c: [0.06, 1.09, 0.13], r: 0.022, col: coal, k: 0 }, { s: 'sph', c: [-0.06, 1.09, 0.13], r: 0.022, col: coal, k: 0 },
      ...[0.82, 0.7, 0.58].map(y => ({ s: 'sph', c: [0, y, 0.215], r: 0.022, col: coal, k: 0 })),
      { s: 'cap', a: [0.18, 0.76, 0], b: [0.46, 0.92, 0.04], r: 0.018, col: bark, k: 0 }, { s: 'cap', a: [0.38, 0.87, 0.03], b: [0.44, 1.0, 0.02], r: 0.014, col: bark, k: 0 },
      { s: 'cap', a: [-0.18, 0.76, 0], b: [-0.46, 0.86, 0.06], r: 0.018, col: bark, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 1.18, 0], r: 0.17, hh: 0.015, rd: 0.01, col: coal, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 1.29, 0], r: 0.11, hh: 0.11, rd: 0.02, col: coal, k: 0 },
    ]);
    // a cluster of ice shards; the shards take the instance tint, the tips are frosty white
    P('icecrystal', [
      ...[[0, 0, 1.15, 0.2], [0.24, 0.3, 0.75, 0.13], [-0.26, 0.1, 0.8, 0.14], [0.05, -0.28, 0.65, 0.12], [-0.12, 0.3, 0.55, 0.1]].map(([x, z, hgt, r]) => ({ s: 'cap', a: [x * 0.4, 0, z * 0.4], b: [x, hgt, z], r, r2: 0.02, k: 0.01 })),
      { s: 'ell', c: [0, 0.05, 0], rr: [0.4, 0.1, 0.4], col: snow, k: 0.06 },
    ], { ao: 0.6 });
    // the wall: chunky blocks of ice with a lid of snow
    P('iceblock', [
      { s: 'box', c: [0, 0.42, 0], hs: [0.44, 0.42, 0.44], rd: 0.09, k: 0 },
      { s: 'box', c: [0, 0.86, 0], hs: [0.4, 0.05, 0.4], rd: 0.05, col: snow, k: 0.04 },
      { s: 'box', c: [0.12, 0.5, 0.42], hs: [0.12, 0.2, 0.03], rd: 0.03, col: iceHi, k: 0.02 },
    ], { ao: 0.8 });
    // a falling icicle (point down) and the spike it leaves (point up)
    P('icicle', [
      { s: 'cap', a: [0, 1.5, 0], b: [0, 0.02, 0], r: 0.2, r2: 0.012, col: ice, k: 0 },
      { s: 'cap', a: [0.1, 1.45, 0.06], b: [0.12, 0.75, 0.08], r: 0.1, r2: 0.01, col: iceHi, k: 0.02 },
      { s: 'cap', a: [-0.1, 1.45, -0.04], b: [-0.12, 0.9, -0.06], r: 0.09, r2: 0.01, col: ice, k: 0.02 },
    ], { ao: 0.5 });
    P('icespike', [
      { s: 'cap', a: [0, -0.1, 0], b: [0, 1.15, 0], r: 0.22, r2: 0.014, k: 0 },
      { s: 'cap', a: [0.1, -0.1, 0.05], b: [0.3, 0.62, 0.12], r: 0.13, r2: 0.012, col: iceHi, k: 0.02 },
      { s: 'cap', a: [-0.08, -0.1, -0.06], b: [-0.28, 0.5, -0.14], r: 0.12, r2: 0.012, k: 0.02 },
    ], { ao: 0.5 });
  }
  // ---------- Frost Yeti (chapter 6 boss): a shaggy snow beast; plain fur takes the boss tint ----------
  {
    const m = makeHumanoid({ ...STICK, hipY: 0.4, shY: 0.76, headY: 0.98, headR: 0.22, headZ: 0.06, shW: 0.25, hipW: 0.12, elOut: 0.08, upperLen: 0.2, foreLen: 0.2,
      pelvisR: 0.2, torso: 'ell', torsoRR: [0.31, 0.3, 0.25], neckR: 0.14, armR: 0.1, handR: 0.14, legR: 0.12, k: 0.08 });
    const J = m.J, hd = J.head, hr = 0.22, skin = C('#e4f3ff'), skinD = C('#34557e'), hornCol = C('#f4fbff'), ice = C('#c8f4ff'), claw = C('#ffffff');
    // face patch and belly in pale blue skin
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] - 0.03, hd[2] + hr * 0.6], rr: [hr * 0.72, hr * 0.62, hr * 0.42], col: skin, bone: 2, k: 0.03 });
    m.parts.push({ s: 'ell', c: [0, 0.56, 0.17], rr: [0.2, 0.2, 0.09], col: skin, bone: 1, k: 0.05 });
    face(m, { eyeCol: C('#fff6e6'), mouth: 'fangs', eyeY: 0.18 });
    for (const sx of [1, -1]) horn(m, [hd[0] + sx * hr * 0.75, hd[1] + hr * 0.55, hd[2] - 0.02], [sx * 0.13, 0.08, -0.04], [sx * 0.02, 0.15, 0.06], 0.05, hornCol);
    // shaggy tufts on the shoulders, head and back
    for (const [x, y, z, r, b] of [[0.27, 0.86, 0, 0.12, 1], [-0.27, 0.86, 0, 0.12, 1], [0.16, 0.92, -0.12, 0.1, 1], [-0.16, 0.92, -0.12, 0.1, 1], [0, 0.94, -0.16, 0.11, 1],
      [0.2, 0.42, 0.06, 0.1, 0], [-0.2, 0.42, 0.06, 0.1, 0]]) m.parts.push({ s: 'sph', c: [x, y, z], r, bone: b, k: 0.08 });
    m.parts.push({ s: 'sph', c: [hd[0], hd[1] + hr * 0.75, hd[2] - 0.04], r: 0.12, bone: 2, k: 0.08 });
    // ice crystals growing out of its back
    for (const [x, y, l, r] of [[0, 0.78, 0.3, 0.07], [0.12, 0.66, 0.22, 0.05], [-0.13, 0.7, 0.24, 0.055], [0.05, 0.52, 0.17, 0.045]])
      m.parts.push({ s: 'cap', a: [x, y, -0.18], b: [x * 1.6, y + l * 0.55, -0.18 - l], r, r2: 0.01, col: ice, bone: 1, k: 0.01 });
    // big furry fists with icy claws, and dark soles
    for (const sd of ['L', 'R']) {
      const ha = J['ha' + sd], b = sd === 'L' ? 4 : 6;
      m.parts.push({ s: 'sph', c: [ha[0], ha[1] - 0.04, ha[2] + 0.02], r: 0.15, bone: b, k: 0.05 });
      for (const dx of [-0.06, 0, 0.06]) m.parts.push({ s: 'cap', a: [ha[0] + dx, ha[1] - 0.1, ha[2] + 0.1], b: [ha[0] + dx, ha[1] - 0.17, ha[2] + 0.16], r: 0.025, r2: 0.008, col: claw, bone: b, k: 0 });
      const an = J['an' + sd], lb = sd === 'L' ? 8 : 10;
      m.parts.push({ s: 'ell', c: [an[0], 0.03, an[2] + 0.06], rr: [0.13, 0.05, 0.18], col: skinD, bone: lb, k: 0.03 });
    }
    m.top = hd[1] + hr + 0.2; m.bmin = [-0.7, -0.03, -0.65]; m.bmax = [0.7, m.top + 0.05, 0.6]; m.name = 'yeti'; m.runAmp = 0.7;
    defs.yeti = m;
  }
  // ---------- Volcano ----------
  {
    const obs = C('#1d1622'), obsHi = C('#4a3a5c'), hot = C('#ff7a1a'), glow = C('#ffc040'), rockD = C('#3a2e2a'), char = C('#2a201c');
    P('obsidian', [
      ...[[0, 0, 1.2, 0.2, obs], [0.26, 0.24, 0.8, 0.14, obsHi], [-0.28, 0.08, 0.85, 0.15, obs], [0.04, -0.3, 0.7, 0.13, obs], [-0.14, 0.3, 0.55, 0.1, obsHi]]
        .map(([x, z, hgt, r, col]) => ({ s: 'cap', a: [x * 0.4, 0, z * 0.4], b: [x, hgt, z], r, r2: 0.02, col, k: 0.01 })),
      { s: 'ell', c: [0, 0.04, 0], rr: [0.42, 0.08, 0.42], col: hot, k: 0.05 },
    ], { ao: 0.6 });
    // a small cone with a glowing crater (the arena feature makes it erupt)
    P('vent', [
      { s: 'cap', a: [0, 0, 0], b: [0, 0.42, 0], r: 0.5, r2: 0.26, col: rockD, k: 0.02 },
      { s: 'tor', ax: 'y', c: [0, 0.6, 0], R: 0.2, r: 0.07, a0: -Math.PI, a1: Math.PI, col: hot, k: 0.03 },
      { s: 'sph', c: [0, 0.58, 0], r: 0.17, col: glow, k: 0.02 },
      ...[[0.38, 0.2, 0.1], [-0.3, 0.15, -0.25], [0.05, 0.1, 0.42]].map(([x, y, z]) => ({ s: 'sph', c: [x, y, z], r: 0.12, col: rockD, k: 0.06 })),
    ]);
    P('deadtree', [
      { s: 'cap', a: [0, 0, 0], b: [0.04, 1.2, 0], r: 0.09, r2: 0.05, col: char, k: 0.02 },
      { s: 'cap', a: [0.03, 0.8, 0], b: [0.4, 1.15, 0.06], r: 0.045, r2: 0.02, col: char, k: 0.02 },
      { s: 'cap', a: [0.03, 0.6, 0], b: [-0.34, 0.92, -0.08], r: 0.045, r2: 0.02, col: char, k: 0.02 },
      { s: 'cap', a: [0.04, 1.05, 0], b: [-0.12, 1.42, 0.1], r: 0.035, r2: 0.015, col: char, k: 0.02 },
      { s: 'sph', c: [0.4, 1.15, 0.06], r: 0.035, col: hot, k: 0 }, { s: 'sph', c: [-0.12, 1.42, 0.1], r: 0.03, col: hot, k: 0 },
      { s: 'ell', c: [0, 0.03, 0], rr: [0.18, 0.05, 0.18], col: char, k: 0.04 },
    ]);
    // basalt columns for the wall; the columns take the instance tint
    P('basalt', [
      ...[[0, 0, 0.26, 0.6], [0.3, 0.12, 0.2, 0.42], [-0.24, 0.2, 0.22, 0.5], [0.08, -0.3, 0.2, 0.34]].map(([x, z, r, hh]) => ({ s: 'cyl', ax: 'y', c: [x, hh, z], r, hh, rd: 0.03, k: 0.01 })),
      { s: 'sph', c: [0.2, 0.05, 0.36], r: 0.08, col: hot, k: 0.03 },
    ], { ao: 0.8 });
  }
  // ---------- Magma Golem (chapter 7 boss): a hulking rock man with a molten core; plain rock takes the boss tint ----------
  {
    const m = makeHumanoid({ ...STICK, hipY: 0.42, shY: 0.8, headY: 0.98, headR: 0.15, headZ: 0.1, shW: 0.3, hipW: 0.13, elOut: 0.1, upperLen: 0.2, foreLen: 0.2,
      pelvisR: 0.2, torso: 'ell', torsoRR: [0.32, 0.28, 0.24], neckR: 0.12, armR: 0.11, handR: 0.16, legR: 0.13, k: 0.06 });
    const J = m.J, hd = J.head, hot = C('#ff7a1a'), core = C('#ffd040'), eye = C('#ffe060');
    m.parts.push({ s: 'rock', c: [0, 0.66, -0.02], r: 0.29, bump: 0.14, bone: 1, k: 0.04 });
    m.parts.push({ s: 'rock', c: [hd[0], hd[1] + 0.02, hd[2]], r: 0.17, bump: 0.14, bone: 2, k: 0.03 });
    // the molten core and the cracks spreading from it
    m.parts.push({ s: 'sph', c: [0, 0.66, 0.24], r: 0.11, col: core, bone: 1, k: 0.02 });
    for (const [x, y] of [[0.16, 0.8], [-0.17, 0.78], [0.2, 0.52], [-0.15, 0.5], [0.02, 0.9]])
      m.parts.push({ s: 'cap', a: [0, 0.66, 0.24], b: [x, y, 0.2], r: 0.028, r2: 0.012, col: hot, bone: 1, k: 0.01 });
    // glowing eyes under a heavy brow
    for (const sx of [1, -1]) m.parts.push({ s: 'ell', c: [hd[0] + sx * 0.07, hd[1] + 0.03, hd[2] + 0.15], rr: [0.05, 0.035, 0.03], col: eye, bone: 2, k: 0 });
    m.parts.push({ s: 'box', c: [hd[0], hd[1] + 0.07, hd[2] + 0.12], hs: [0.13, 0.03, 0.05], rd: 0.02, bone: 2, k: 0.03 });
    // boulder shoulders and fists, with lava dripping between the knuckles
    for (const sd of ['L', 'R']) {
      const sx = sd === 'L' ? 1 : -1, b = sd === 'L' ? 4 : 6, ha = J['ha' + sd];
      m.parts.push({ s: 'rock', c: [sx * 0.33, 0.86, -0.02], r: 0.16, bump: 0.18, bone: 1, k: 0.04 });
      m.parts.push({ s: 'rock', c: [ha[0], ha[1] - 0.03, ha[2] + 0.02], r: 0.19, bump: 0.18, bone: b, k: 0.04 });
      m.parts.push({ s: 'cap', a: J['sh' + sd], b: J['el' + sd], r: 0.026, col: hot, bone: b - 1, k: 0.01 });
      m.parts.push({ s: 'sph', c: [ha[0], ha[1] - 0.12, ha[2] + 0.15], r: 0.04, col: hot, bone: b, k: 0.02 });
      const lb = sd === 'L' ? 7 : 9;
      m.parts.push({ s: 'cap', a: [(J['hi' + sd][0] + J['kn' + sd][0]) / 2, 0.32, 0.12], b: [J['kn' + sd][0], 0.22, 0.13], r: 0.02, col: hot, bone: lb, k: 0.01 });
    }
    m.top = hd[1] + 0.2; m.bmin = [-0.72, -0.03, -0.6]; m.bmax = [0.72, m.top + 0.05, 0.6]; m.name = 'golem'; m.runAmp = 0.65;
    defs.golem = m;
  }
  // ---------- Jungle Swamp ----------
  {
    const bark = C('#6a4a2e'), leaf = C('#2f7a32'), leafD = C('#24602a'), leafL = C('#4f9a3a'), vine = C('#3f8a34'), white = C('#fff8ee'), stem = C('#f0e6d0');
    P('jtree', [
      { s: 'cap', a: [0, -0.05, 0], b: [0.04, 1.35, 0], r: 0.13, r2: 0.08, col: bark, k: 0.03 },
      ...[[0.12, -0.05, 0.1], [-0.12, -0.05, 0.05], [0.02, -0.05, -0.14]].map(([x, y, z]) => ({ s: 'cap', a: [0, 0.3, 0], b: [x * 2.2, y, z * 2.2], r: 0.06, r2: 0.03, col: bark, k: 0.04 })),
      ...[[0, 1.55, 0, 0.5, leaf], [0.38, 1.4, 0.15, 0.36, leafD], [-0.36, 1.45, -0.1, 0.38, leafL], [0.08, 1.42, -0.38, 0.34, leafD], [-0.1, 1.38, 0.38, 0.32, leafL]]
        .map(([x, y, z, r, col]) => ({ s: 'sph', c: [x, y, z], r, col, k: 0.12 })),
      ...[[0.45, 0.7], [-0.4, 0.85], [0.1, 0.75]].map(([x, y], i) => ({ s: 'cap', a: [x, 1.3, i * 0.2 - 0.2], b: [x * 1.05, y, i * 0.2 - 0.2], r: 0.018, col: vine, k: 0 })),
    ]);
    // giant spotted mushroom; the cap takes the instance tint
    P('mushroom', [
      { s: 'cyl', ax: 'y', c: [0, 0.35, 0], r: 0.11, hh: 0.35, rd: 0.05, col: stem, k: 0.03 },
      { s: 'ell', c: [0, 0.78, 0], rr: [0.46, 0.24, 0.46], k: 0.05 },
      ...[[0.2, 0.92, 0.12, 0.07], [-0.18, 0.9, -0.1, 0.06], [0.04, 1.0, -0.06, 0.05], [-0.1, 0.86, 0.26, 0.05], [0.3, 0.8, -0.2, 0.05]].map(([x, y, z, r]) => ({ s: 'sph', c: [x, y, z], r, col: white, k: 0 })),
    ]);
    // a fern: broad leaves fanning out low
    P('fern', [
      ...[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, z]) => ({ s: 'ell', c: [x * 0.32, 0.12, z * 0.32], rr: [x ? 0.34 : 0.12, 0.04, z ? 0.34 : 0.12], col: leafL, k: 0.04 })),
      ...[[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].map(([x, z]) => ({ s: 'cap', a: [0, 0.18, 0], b: [x * 0.5, 0.06, z * 0.5], r: 0.07, r2: 0.03, col: leaf, k: 0.03 })),
      { s: 'sph', c: [0, 0.12, 0], r: 0.1, col: leafD, k: 0.05 },
    ], { ao: 0.6 });
    // bamboo stalks for the wall; the stalks take the instance tint
    P('bamboo', [
      ...[[0, 0, 1.5], [0.24, 0.1, 1.15], [-0.22, 0.14, 1.3], [0.06, -0.24, 1.0], [-0.1, 0.3, 0.9]].flatMap(([x, z, hgt]) => [
        { s: 'cap', a: [x, 0, z], b: [x, hgt, z], r: 0.075, k: 0 },
        ...[0.35, 0.7, 1.05].filter(y => y < hgt).map(y => ({ s: 'tor', ax: 'y', c: [x, y, z], R: 0.075, r: 0.02, a0: -Math.PI, a1: Math.PI, col: C('#4a7a2a'), k: 0 })),
      ]),
      { s: 'ell', c: [0.12, 1.2, 0.1], rr: [0.2, 0.03, 0.06], col: leaf, k: 0.02 },
    ], { ao: 0.8 });
    // roots bursting out of the ground (the hydra's snare); the roots take the instance tint
    P('roots', [
      ...[[1, 0.2], [-0.7, 0.7], [-0.3, -0.9], [0.5, -0.8]].flatMap(([x, z]) => [
        { s: 'cap', a: [x * 0.1, -0.1, z * 0.1], b: [x * 0.3, 0.55, z * 0.3], r: 0.11, r2: 0.07, k: 0.03 },
        { s: 'cap', a: [x * 0.3, 0.55, z * 0.3], b: [x * 0.12, 0.95, z * 0.12], r: 0.07, r2: 0.02, k: 0.03 },
        { s: 'sph', c: [x * 0.3, 0.6, z * 0.3], r: 0.05, col: leafL, k: 0.02 },
      ]),
    ]);
  }
  // ---------- Vine Hydra (chapter 8 boss): a bulb rooted in the mud with snapping flower heads on vine necks ----------
  {
    const leaf = C('#2f7a32'), root = C('#6a4a2e'), spot = C('#d8f070'), thorn = C('#fff0c8'), petal = C('#ff5fa8'), petalL = C('#ffa0d0'), mouth = C('#5a0c22'), eyeW = C('#fff6e6'), pupil = C('#16101a');
    P('hydrabody', [
      { s: 'ell', c: [0, 0.42, 0], rr: [0.5, 0.42, 0.5], k: 0.06 },
      { s: 'sph', c: [0, 0.78, 0], r: 0.24, k: 0.08 },
      ...[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, z]) => ({ s: 'ell', c: [x * 0.55, 0.06, z * 0.55], rr: [x ? 0.38 : 0.16, 0.05, z ? 0.38 : 0.16], col: leaf, k: 0.05 })),
      ...[0.4, 1.4, 2.6, 3.7, 5.0].map(a => ({ s: 'cap', a: [Math.cos(a) * 0.35, 0.15, Math.sin(a) * 0.35], b: [Math.cos(a) * 0.75, -0.05, Math.sin(a) * 0.75], r: 0.07, r2: 0.03, col: root, k: 0.04 })),
      ...[[0.3, 0.55, 0.3], [-0.35, 0.45, 0.25], [0.1, 0.7, -0.38], [-0.2, 0.3, -0.42], [0.44, 0.3, -0.1]].map(([x, y, z]) => ({ s: 'sph', c: [x, y, z], r: 0.06, col: spot, k: 0.02 })),
      ...[[0.42, 0.5, 0.0], [-0.42, 0.55, 0.05], [0.0, 0.55, 0.45], [0.05, 0.6, -0.44]].map(([x, y, z]) => ({ s: 'cap', a: [x * 0.9, y, z * 0.9], b: [x * 1.3, y + 0.1, z * 1.3], r: 0.04, r2: 0.008, col: thorn, k: 0 })),
    ]);
    // a flower head: green snout, a frill of petals, a toothy mouth and eyes; faces +z, centred on the pivot
    P('hydrahead', [
      { s: 'ell', c: [0, 0.5, 0.06], rr: [0.3, 0.26, 0.4], k: 0.05 },
      { s: 'tor', ax: 'z', c: [0, 0.52, -0.2], R: 0.32, r: 0.1, a0: -Math.PI, a1: Math.PI, col: petal, k: 0.03 },
      ...Array.from({ length: 7 }, (_, i) => { const a = (i / 7) * TAU; return { s: 'sph', c: [Math.cos(a) * 0.44, 0.52 + Math.sin(a) * 0.44, -0.24], r: 0.12, col: i % 2 ? petal : petalL, k: 0.04 }; }),
      { s: 'ell', c: [0, 0.42, 0.42], rr: [0.2, 0.08, 0.06], col: mouth, k: 0.01 },
      ...[-0.12, -0.04, 0.04, 0.12].map(x => ({ s: 'cap', a: [x, 0.49, 0.44], b: [x, 0.4, 0.47], r: 0.025, r2: 0.006, col: thorn, k: 0 })),
      { s: 'sph', c: [0.14, 0.68, 0.24], r: 0.085, col: eyeW, k: 0 }, { s: 'sph', c: [-0.14, 0.68, 0.24], r: 0.085, col: eyeW, k: 0 },
      { s: 'sph', c: [0.15, 0.69, 0.31], r: 0.04, col: pupil, k: 0 }, { s: 'sph', c: [-0.15, 0.69, 0.31], r: 0.04, col: pupil, k: 0 },
    ]);
    // one piece of a vine neck, centred on the pivot
    P('vineseg', [
      { s: 'sph', c: [0, 0.5, 0], r: 0.4, k: 0.05 },
      { s: 'cap', a: [0, 0.82, 0], b: [0, 1.0, -0.08], r: 0.06, r2: 0.01, col: thorn, k: 0 },
      { s: 'ell', c: [0.36, 0.5, 0], rr: [0.18, 0.04, 0.1], col: leaf, k: 0.03 },
    ], { ao: 0.6 });
  }
  // ---------- Pirate Beach ----------
  {
    const trunk = C('#a07a4a'), trunkD = C('#7a5a34'), frond = C('#3f9a3a'), frondD = C('#2f7a2e'), nut = C('#6a4a2a'), wood = C('#a06a38'), woodD = C('#6e4624'), iron = C('#4a4a52'), rope = C('#e8d8a8'), sail = C('#f4ecd8');
    // a leaning palm with a crown of fronds and coconuts
    P('palm', [
      ...[[0, 0, 0.4], [0.06, 0.4, 0.8], [0.16, 0.8, 1.2], [0.3, 1.2, 1.55]].map(([x, y0, y1], i) => ({ s: 'cap', a: [x, y0, 0], b: [x + 0.08 + i * 0.03, y1, 0], r: 0.1 - i * 0.012, r2: 0.09 - i * 0.012, col: i % 2 ? trunk : trunkD, k: 0.02 })),
      ...[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, z]) => ({ s: 'ell', c: [0.46 + x * 0.42, 1.55, z * 0.42], rr: [x ? 0.46 : 0.13, 0.04, z ? 0.46 : 0.13], col: frond, k: 0.03 })),
      ...[[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].map(([x, z]) => ({ s: 'cap', a: [0.46, 1.6, 0], b: [0.46 + x * 0.6, 1.3, z * 0.6], r: 0.07, r2: 0.025, col: frondD, k: 0.03 })),
      ...[[0.05, 0.08], [-0.07, 0.02], [0.02, -0.08]].map(([x, z]) => ({ s: 'sph', c: [0.46 + x, 1.45, z], r: 0.07, col: nut, k: 0.01 })),
    ]);
    P('barrel', [
      { s: 'cyl', ax: 'y', c: [0, 0.36, 0], r: 0.28, hh: 0.36, rd: 0.06, col: wood, k: 0 },
      { s: 'ell', c: [0, 0.36, 0], rr: [0.3, 0.26, 0.3], col: wood, k: 0.04 },
      ...[0.1, 0.36, 0.62].map(y => ({ s: 'tor', ax: 'y', c: [0, y, 0], R: y === 0.36 ? 0.3 : 0.28, r: 0.025, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 })),
    ]);
    P('crate', [
      { s: 'box', c: [0, 0.32, 0], hs: [0.32, 0.32, 0.32], rd: 0.03, col: wood, k: 0 },
      ...[[0, 0.32, 0.325, 0.3, 0.05, 0.01], [0, 0.32, -0.325, 0.3, 0.05, 0.01], [0.325, 0.32, 0, 0.01, 0.05, 0.3], [-0.325, 0.32, 0, 0.01, 0.05, 0.3]].map(([x, y, z, a, b, c]) => ({ s: 'box', c: [x, y, z], hs: [a, b, c], rd: 0.01, col: woodD, k: 0 })),
    ]);
    // a starfish lying on the sand; it takes the instance tint
    P('starfish', Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * TAU; return { s: 'cap', a: [0, 0.04, 0], b: [Math.cos(a) * 0.32, 0.03, Math.sin(a) * 0.32], r: 0.08, r2: 0.03, k: 0.04 }; }));
    // pier pilings with rope for the wall
    P('post', [
      { s: 'cyl', ax: 'y', c: [0, 0.6, 0], r: 0.17, hh: 0.6, rd: 0.05, col: wood, k: 0 },
      { s: 'cyl', ax: 'y', c: [0.3, 0.4, 0.15], r: 0.13, hh: 0.4, rd: 0.04, col: woodD, k: 0 },
      { s: 'tor', ax: 'y', c: [0, 0.82, 0], R: 0.18, r: 0.03, a0: -Math.PI, a1: Math.PI, col: rope, k: 0 },
      { s: 'cap', a: [0, 0.8, 0], b: [0.3, 0.62, 0.15], r: 0.025, col: rope, k: 0 },
    ], { ao: 0.8 });
    // a shipwreck lying across the sand: long hull along x, a broken mast and a torn sail
    P('wreck', [
      { s: 'ell', c: [0, 0.35, 0], rr: [1.0, 0.42, 0.42], col: woodD, k: 0.05 },
      { s: 'box', c: [0, 0.55, 0], hs: [0.9, 0.08, 0.36], rd: 0.04, col: wood, k: 0.03 },
      ...[-0.6, -0.2, 0.2, 0.6].map(x => ({ s: 'box', c: [x, 0.38, 0.4], hs: [0.08, 0.2, 0.02], rd: 0.01, col: wood, k: 0 })),
      { s: 'cap', a: [0.1, 0.55, 0], b: [0.35, 1.45, 0.1], r: 0.06, col: woodD, k: 0.02 },
      { s: 'box', c: [0.28, 1.15, 0.12], hs: [0.02, 0.24, 0.28], rd: 0.01, col: sail, k: 0 },
      { s: 'cyl', ax: 'x', c: [-0.95, 0.5, 0], r: 0.14, hh: 0.08, rd: 0.03, col: wood, k: 0.02 },
    ]);
  }
  // ---------- Captain Crab (chapter 9 boss): a giant crab in a tricorn hat, with an eyepatch and a cannon on its back ----------
  {
    const belly = C('#ffd0b0'), black = C('#1c1820'), gold = C('#ffc93a'), white = C('#fff6e6'), pupil = C('#16101a'), iron = C('#3a3a44'), tip = C('#fff0e0');
    P('crab', [
      { s: 'ell', c: [0, 0.45, 0], rr: [0.62, 0.3, 0.48], k: 0.06 },
      ...[[0.25, 0.7, -0.05], [-0.25, 0.7, -0.05], [0, 0.72, 0.1], [0.4, 0.6, 0.18], [-0.4, 0.6, 0.18]].map(([x, y, z]) => ({ s: 'sph', c: [x, y, z], r: 0.1, k: 0.08 })),
      { s: 'ell', c: [0, 0.3, 0.06], rr: [0.55, 0.16, 0.42], col: belly, k: 0.04 },
      { s: 'ell', c: [0, 0.4, 0.46], rr: [0.14, 0.05, 0.04], col: C('#5a0c22'), k: 0.01 },
      // eye stalks: the right eye looks, the left wears a patch
      { s: 'cap', a: [0.16, 0.62, 0.3], b: [0.2, 0.98, 0.36], r: 0.05, k: 0.02 }, { s: 'cap', a: [-0.16, 0.62, 0.3], b: [-0.2, 0.98, 0.36], r: 0.05, k: 0.02 },
      { s: 'sph', c: [0.2, 1.02, 0.37], r: 0.11, col: white, k: 0 }, { s: 'sph', c: [0.21, 1.03, 0.47], r: 0.05, col: pupil, k: 0 },
      { s: 'sph', c: [-0.2, 1.02, 0.37], r: 0.11, col: white, k: 0 }, { s: 'ell', c: [-0.2, 1.03, 0.45], rr: [0.1, 0.1, 0.04], col: black, k: 0.01 },
      { s: 'tor', ax: 'z', c: [-0.2, 1.03, 0.37], R: 0.115, r: 0.012, a0: 0.3, a1: 2.6, col: black, k: 0 },
      // tricorn hat with gold trim and a skull
      { s: 'cyl', ax: 'y', c: [0, 0.8, -0.1], r: 0.36, hh: 0.025, rd: 0.02, col: black, k: 0 },
      { s: 'ell', c: [0, 0.9, -0.1], rr: [0.24, 0.13, 0.22], col: black, k: 0.03 },
      { s: 'tor', ax: 'y', c: [0, 0.82, -0.1], R: 0.34, r: 0.02, a0: -Math.PI, a1: Math.PI, col: gold, k: 0 },
      { s: 'sph', c: [0, 0.94, 0.11], r: 0.045, col: white, k: 0 },
      // the cannon riding on its back, aimed forward over its head
      { s: 'cyl', ax: 'z', c: [0.3, 0.78, -0.3], r: 0.08, hh: 0.24, rd: 0.03, col: iron, k: 0.01 },
      { s: 'tor', ax: 'z', c: [0.3, 0.78, -0.06], R: 0.085, r: 0.025, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 },
      { s: 'sph', c: [0.3, 0.76, -0.52], r: 0.08, col: iron, k: 0.02 },
    ]);
    // a pincer pointing along +z from its pivot; it takes the instance tint
    P('crabclaw', [
      { s: 'cap', a: [0, 0.45, -0.25], b: [0, 0.45, 0.15], r: 0.09, k: 0.03 },
      { s: 'ell', c: [0, 0.48, 0.32], rr: [0.2, 0.18, 0.26], k: 0.05 },
      { s: 'cap', a: [0.04, 0.56, 0.48], b: [0.02, 0.54, 0.8], r: 0.085, r2: 0.03, k: 0.03 },
      { s: 'cap', a: [-0.04, 0.4, 0.48], b: [-0.03, 0.42, 0.74], r: 0.07, r2: 0.03, k: 0.03 },
      { s: 'sph', c: [0.02, 0.54, 0.82], r: 0.03, col: tip, k: 0.01 }, { s: 'sph', c: [-0.03, 0.42, 0.76], r: 0.028, col: tip, k: 0.01 },
    ]);
    // a jointed leg reaching out along +z from its pivot
    P('crableg', [
      { s: 'cap', a: [0, 0.4, 0], b: [0, 0.58, 0.35], r: 0.06, k: 0.02 },
      { s: 'cap', a: [0, 0.58, 0.35], b: [0, 0.02, 0.62], r: 0.05, r2: 0.02, k: 0.02 },
    ]);
  }
}
