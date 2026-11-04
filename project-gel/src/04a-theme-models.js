// ============================================================
// Theme scenery and new boss bodies, built with prop() (see 04-models.js).
// Model units: 1 is about one hero leg. Colors are baked in; parts without col take the instance tint.
// ============================================================
const THEME_CLIPS = { tumbleweed: ['roll'] };
const THEME_CELLS = { wormhead: 0.022, wormseg: 0.03 };
// built after everything chapter 1 needs
MESH_ORDER.push('cactus0', 'cactus1', 'skull', 'tumbleweed', 'wormhead', 'wormseg');
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
}
