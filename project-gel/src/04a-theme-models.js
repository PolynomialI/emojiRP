// ============================================================
// Theme scenery and new boss bodies, built with prop() (see 04-models.js).
// Model units: 1 is about one hero leg. Colors are baked in; parts without col take the instance tint.
// ============================================================
const THEME_CLIPS = { tumbleweed: ['roll'], wreckbot: ['run', 'slam', 'idle', 'throw'] };
// mesh cell size per model: big boxy scenery can be coarse (colors still follow the nearest part), thin parts need fine cells
const THEME_CELLS = { pitball: 0.05, bumper: 0.035, tubewall: 0.04, wreckbot: 0.015, wreckball: 0.02, wormhead: 0.022, wormseg: 0.03, tumbleweed: 0.02, cactus0: 0.025, building0: 0.03, building1: 0.03, building2: 0.03, tower: 0.03, car: 0.022, streetlamp: 0.016, hydrant: 0.02, bin: 0.025, barrier: 0.03, tree: 0.03 };
// built after everything chapter 1 needs
MESH_ORDER.push('cactus0', 'cactus1', 'skull', 'tumbleweed', 'wormhead', 'wormseg',
  'building0', 'building1', 'building2', 'tower', 'car', 'streetlamp', 'hydrant', 'bin', 'barrier', 'tree', 'wreckbot', 'wreckball',
  'pitball', 'bumper', 'tubewall');
function themeModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
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
}
