// ============================================================
// Everything the sea's upgrades mount on a ship (drawn at each ship's mount scale), and the creatures they send
// out: seagulls, sharks, the crew. Facing +z; y = 0 is where it stands on deck (or the waterline).
// ============================================================
const MOUNT_MESHES = ['smusket', 'sharpoon', 'sgunner', 'sanchor', 'sbarrel', 'slamp', 'snetrack', 'snet', 'sgull', 'sshark', 'shose', 'sfigure', 'sfort', 'sprop', 'screw', 'ssail',
  'swhirl', 'scloud', 'stent', 'sdolph', 'splate', 'spowder', 'schest'];
MESH_ORDER.push(...MOUNT_MESHES, ...SHIP_PIECES);
Object.assign(THEME_CLIPS, { sgull: ['flap'], sshark: ['swim'], sprop: ['pspin'], screw: ['run', 'slam', 'idle'], ssail: ['rock'], sdolph: ['swim', 'dleap'], stent: ['tcurl'] });
Object.assign(THEME_CELLS, { smusket: 0.013, sharpoon: 0.012, sgunner: 0.014, sanchor: 0.014, sbarrel: 0.013, slamp: 0.013, snetrack: 0.013, snet: 0.03, sgull: 0.015, sshark: 0.02, shose: 0.015, sfigure: 0.018, sfort: 0.016, sprop: 0.015, screw: 0.013, ssail: 0.022,
  swhirl: 0.016, scloud: 0.022, stent: 0.014, sdolph: 0.016, splate: 0.012, spowder: 0.012, schest: 0.012 });
// a dolphin's leap: the whole body pitching from nose-up to nose-down (bone 0 about its middle)
CLIPS.dleap = { frames: 12, fn(t) {
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 0 ? [lerp(-0.9, 0.9, t * 12 / 11), 0, 0] : b === 7 ? [0, 0.4 * Math.sin(t * TAU * 2), 0] : [0, 0, 0])) };
} };
// a kraken arm curling: its upper half (bone 1) and tip (bone 2) bend over, from upright to slammed down
CLIPS.tcurl = { frames: 12, fn(t) {
  const u = t * 12 / 11;
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 1 ? [0.2 + u * 1.1, 0, 0] : b === 2 ? [0.3 + u * 1.2, 0, 0] : b === 0 ? [u * 0.5, 0, 0] : [0, 0, 0])) };
} };
// a gull's wings beat (bones 3 and 5 about their shoulders)
CLIPS.flap = { frames: 16, fn(t) {
  const a = Math.sin(t * TAU) * 0.75;
  return { root: [0, 0.03 * Math.cos(t * TAU), 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 3 ? [0, 0, a] : b === 5 ? [0, 0, -a] : [0, 0, 0])) };
} };
// a shark's tail sweeps (bone 7 about the tail's root) and its body sways a little
CLIPS.swim = { frames: 24, fn(t) {
  const s = Math.sin(t * TAU);
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 7 ? [0, 0.55 * s, 0] : b === 0 ? [0, -0.1 * s, 0] : [0, 0, 0])) };
} };
// a propeller turning about the keel line
CLIPS.pspin = { frames: 12, fn(t) {
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 1 ? [0, 0, t * TAU / 3] : [0, 0, 0])) };
} };

function mountModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const wood = C('#a8693a'), woodD = C('#6e4426'), woodL = C('#c8915a'), iron = C('#3a3f4a'), ironL = C('#5a6270'), ironD = C('#22252c'), steel = C('#a8b4c2'), brass = C('#e8b84a');
  const white = C('#fbf8f2'), red = C('#e0283a'), redD = C('#a8182a'), dark = C('#16101a'), rope = C('#e2c98f'), yel = C('#ffd34a');
  // a ring of bolts round a circle in the y plane
  const bolts = (y, R, n, r, col, a0 = 0) => Array.from({ length: n }, (_, i) => { const a = a0 + i / n * TAU; return { s: 'sph', c: [Math.cos(a) * R, y, Math.sin(a) * R], r, col, k: 0 }; });

  // ---------- Musket Ball Pile: an iron-bound crate tray heaped with a pyramid of balls, a powder keg with a skull
  // mark, a ramrod, a powder horn and a slow match smoking in its holder ----------
  {
    const balls = [];
    for (let l = 0; l < 4; l++) { const n = 4 - l; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) balls.push({ s: 'sph', c: [(i - (n - 1) / 2) * 0.1, 0.13 + l * 0.082, (j - (n - 1) / 2) * 0.1], r: 0.052, col: l === 3 ? ironL : (i + j + l) % 3 ? iron : C('#454b56'), k: 0 }); }
    P('smusket', [
      { s: 'box', c: [0, 0.055, 0], hs: [0.25, 0.055, 0.25], rd: 0.02, col: wood, k: 0 },
      { s: 'box', c: [0, 0.095, 0], hs: [0.215, 0.04, 0.215], rd: 0.01, sub: true, k: 0 },
      ...[-0.12, 0, 0.12].map(z => ({ s: 'box', c: [0.252, 0.055, z], hs: [0.004, 0.045, 0.004], rd: 0.002, col: woodD, k: 0 })),
      ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([sx, sz]) => ({ s: 'box', c: [sx * 0.235, 0.055, sz * 0.235], hs: [0.03, 0.06, 0.03], rd: 0.008, col: iron, k: 0 })),
      ...balls,
      // the keg: staves, hoops, a skull mark, a bung
      { s: 'cyl', ax: 'y', c: [0.35, 0.14, -0.14], r: 0.11, hh: 0.14, rd: 0.04, col: C('#9a6a3a'), k: 0 },
      ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU; return { s: 'box', c: [0.35 + Math.cos(a) * 0.108, 0.14, -0.14 + Math.sin(a) * 0.108], hs: [0.004, 0.12, 0.004], rd: 0.002, col: C('#7a4e2a'), k: 0 }; }),
      ...[0.05, 0.23].map(y => ({ s: 'tor', ax: 'y', c: [0.35, y, -0.14], R: 0.112, r: 0.012, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 })),
      { s: 'sph', c: [0.35, 0.16, -0.025], r: 0.035, col: white, k: 0 }, ...[1, -1].map(sx => ({ s: 'sph', c: [0.35 + sx * 0.013, 0.165, -0.0], r: 0.009, col: dark, k: 0 })),
      { s: 'cyl', ax: 'y', c: [0.35, 0.29, -0.14], r: 0.02, hh: 0.01, rd: 0.004, col: woodD, k: 0 },
      // the ramrod leaning on the tray, the powder horn, the slow match
      { s: 'cap', a: [-0.27, 0.02, 0.2], b: [-0.2, 0.42, -0.15], r: 0.012, col: woodL, k: 0 }, { s: 'cyl', ax: 'y', c: [-0.2, 0.43, -0.15], r: 0.022, hh: 0.02, rd: 0.006, col: brass, k: 0 },
      { s: 'cap', a: [-0.3, 0.06, -0.08], b: [-0.34, 0.12, -0.26], r: 0.04, r2: 0.012, col: C('#f0e0c0'), k: 0.02 }, { s: 'tor', ax: 'z', c: [-0.31, 0.08, -0.12], R: 0.04, r: 0.008, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 },
      { s: 'cap', a: [0.3, 0.0, 0.22], b: [0.3, 0.32, 0.22], r: 0.012, col: iron, k: 0 }, { s: 'cap', a: [0.3, 0.32, 0.22], b: [0.34, 0.36, 0.22], r: 0.008, col: rope, k: 0 },
      { s: 'sph', c: [0.345, 0.365, 0.22], r: 0.016, col: C('#ff8a2a'), k: 0 },
    ], { ao: 0.6 });
  }
  // ---------- Harpoon Gun: a tripod swivel with brass fittings, a stocked gun with an iron barrel, a long barbed harpoon,
  // a drum of line with a crank, a sight post and a shoulder grip ----------
  P('sharpoon', [
    ...[0, 1, 2].map(i => { const a = i / 3 * TAU + 0.5; return { s: 'cap', a: [Math.cos(a) * 0.2, 0.0, Math.sin(a) * 0.2], b: [0, 0.2, 0], r: 0.025, col: iron, k: 0.01 }; }),
    ...[0, 1, 2].map(i => { const a = i / 3 * TAU + 0.5; return { s: 'sph', c: [Math.cos(a) * 0.2, 0.01, Math.sin(a) * 0.2], r: 0.03, col: ironD, k: 0 }; }),
    { s: 'cyl', ax: 'y', c: [0, 0.22, 0], r: 0.07, hh: 0.035, rd: 0.012, col: brass, k: 0 },
    { s: 'cap', a: [0, 0.22, 0], b: [0, 0.33, 0], r: 0.045, col: ironL, k: 0 },
    { s: 'tor', ax: 'x', c: [0, 0.36, 0], R: 0.06, r: 0.015, a0: 0, a1: Math.PI, col: brass, k: 0 },
    // the stock and barrel
    { s: 'box', c: [0, 0.37, -0.22], hs: [0.045, 0.05, 0.16], rd: 0.025, col: wood, k: 0 },
    { s: 'cap', a: [0, 0.38, -0.08], b: [0, 0.39, 0.44], r: 0.055, r2: 0.045, col: C('#4a6a5a'), k: 0.01 },
    ...[0.0, 0.18, 0.4].map(z => ({ s: 'tor', ax: 'z', c: [0, 0.385, z], R: 0.055, r: 0.011, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 })),
    { s: 'cyl', ax: 'z', c: [0, 0.39, 0.45], r: 0.06, hh: 0.02, rd: 0.008, col: ironL, k: 0 },
    // the harpoon: a shaft, a big point and three barbs, a ring for the line
    { s: 'cap', a: [0, 0.39, 0.44], b: [0, 0.4, 0.72], r: 0.016, col: steel, k: 0 },
    { s: 'cap', a: [0, 0.4, 0.7], b: [0, 0.4, 0.9], r: 0.05, r2: 0.003, col: C('#d8e0ea'), k: 0 },
    ...[0, 1, 2].map(i => { const a = i / 3 * TAU + Math.PI / 2; return { s: 'cap', a: [0, 0.4, 0.78], b: [Math.cos(a) * 0.08, 0.4 + Math.sin(a) * 0.08, 0.7], r: 0.013, r2: 0.003, col: C('#d8e0ea'), k: 0 }; }),
    { s: 'tor', ax: 'x', c: [0, 0.42, 0.5], R: 0.022, r: 0.007, a0: -Math.PI, a1: Math.PI, col: steel, k: 0 },
    // the line drum on its bracket with a crank, the sight, the grips
    { s: 'cyl', ax: 'x', c: [0.14, 0.34, -0.05], r: 0.08, hh: 0.05, rd: 0.02, col: rope, k: 0 },
    ...[-0.05, 0.05].map(dx => ({ s: 'cyl', ax: 'x', c: [0.14 + dx, 0.34, -0.05], r: 0.09, hh: 0.008, rd: 0.004, col: woodD, k: 0 })),
    { s: 'cap', a: [0.2, 0.34, -0.05], b: [0.24, 0.34, -0.05], r: 0.01, col: iron, k: 0 }, { s: 'cap', a: [0.24, 0.34, -0.05], b: [0.24, 0.26, -0.09], r: 0.012, col: iron, k: 0 }, { s: 'sph', c: [0.24, 0.25, -0.1], r: 0.02, col: woodL, k: 0 },
    { s: 'cap', a: [0.06, 0.38, 0.0], b: [0.0, 0.4, 0.44], r: 0.006, col: rope, k: 0 },
    { s: 'box', c: [0, 0.46, 0.2], hs: [0.008, 0.035, 0.008], rd: 0.004, col: brass, k: 0 }, { s: 'tor', ax: 'z', c: [0, 0.5, 0.2], R: 0.02, r: 0.006, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 },
    ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.045, 0.36, -0.34], b: [sx * 0.16, 0.3, -0.44], r: 0.022, col: woodD, k: 0 })),
  ], { ao: 0.6 });
  // ---------- Battleship Gunner: an armored turret: a bolted base ring, a sloped housing in two greys with a white
  // and red band, twin long barrels in canvas blast bags with muzzle rings, rangefinder ears, a hatch and a periscope ----------
  {
    const g1 = C('#8a94a4'), g2 = C('#6a7484'), g3 = C('#b4bcc8');
    P('sgunner', [
      { s: 'cyl', ax: 'y', c: [0, 0.06, 0], r: 0.4, hh: 0.06, rd: 0.03, col: g2, k: 0 },
      ...bolts(0.12, 0.36, 14, 0.018, g3),
      { s: 'cyl', ax: 'y', c: [0, 0.14, 0], r: 0.34, hh: 0.03, rd: 0.01, col: ironD, k: 0 },
      { s: 'box', c: [0, 0.25, -0.05], hs: [0.3, 0.12, 0.32], rd: 0.06, col: g1, k: 0 },
      { s: 'box', c: [0, 0.4, 0.2], hs: [0.6, 0.2, 0.2], sub: true, k: 0 },
      { s: 'cap', a: [-0.28, 0.33, 0.24], b: [0.28, 0.33, 0.24], r: 0.05, col: g1, k: 0.03 },
      { s: 'box', c: [0, 0.37, -0.12], hs: [0.24, 0.05, 0.2], rd: 0.04, col: g3, k: 0 },
      { s: 'box', c: [0, 0.26, 0.27], hs: [0.302, 0.02, 0.005], rd: 0.003, col: white, k: 0 }, { s: 'box', c: [0, 0.22, 0.27], hs: [0.302, 0.02, 0.005], rd: 0.003, col: red, k: 0 },
      ...[1, -1].flatMap(sx => [
        { s: 'ell', c: [sx * 0.11, 0.28, 0.29], rr: [0.07, 0.07, 0.06], col: C('#d8ccb0'), k: 0.02 },
        { s: 'cap', a: [sx * 0.11, 0.28, 0.3], b: [sx * 0.11, 0.31, 1.0], r: 0.045, r2: 0.035, col: C('#5a6272'), k: 0 },
        { s: 'tor', ax: 'z', c: [sx * 0.11, 0.31, 0.98], R: 0.042, r: 0.014, a0: -Math.PI, a1: Math.PI, col: ironD, k: 0 },
        { s: 'tor', ax: 'z', c: [sx * 0.11, 0.295, 0.62], R: 0.042, r: 0.01, a0: -Math.PI, a1: Math.PI, col: ironD, k: 0 },
        { s: 'cyl', ax: 'x', c: [sx * 0.36, 0.34, -0.05], r: 0.04, hh: 0.06, rd: 0.012, col: g2, k: 0 },
        { s: 'cyl', ax: 'x', c: [sx * 0.42, 0.34, -0.05], r: 0.028, hh: 0.008, rd: 0.004, col: C('#8ae8ff'), k: 0 }]),
      { s: 'cyl', ax: 'y', c: [0.12, 0.43, -0.2], r: 0.07, hh: 0.02, rd: 0.01, col: g2, k: 0 }, { s: 'sph', c: [0.12, 0.45, -0.2], r: 0.02, col: ironD, k: 0 },
      { s: 'cap', a: [-0.12, 0.42, -0.18], b: [-0.12, 0.56, -0.18], r: 0.018, col: ironD, k: 0 }, { s: 'box', c: [-0.12, 0.57, -0.16], hs: [0.02, 0.016, 0.03], rd: 0.006, col: ironD, k: 0 },
    ], { ao: 0.6 });
  }
  // ---------- Anchor Flail: a forged iron anchor: a ring and shackle, a wooden stock with iron caps, a banded shank,
  // a crown and two curved arms ending in spade flukes with pointed bills; a few links of chain ----------
  P('sanchor', [
    { s: 'cap', a: [0, 0.1, 0], b: [0, 0.62, 0], r: 0.048, r2: 0.04, col: iron, k: 0 },
    ...[0.24, 0.44].map(y => ({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.048, r: 0.012, a0: -Math.PI, a1: Math.PI, col: ironL, k: 0 })),
    { s: 'tor', ax: 'z', c: [0, 0.71, 0], R: 0.07, r: 0.022, a0: -Math.PI, a1: Math.PI, col: ironL, k: 0 },
    { s: 'cap', a: [-0.2, 0.55, 0], b: [0.2, 0.55, 0], r: 0.035, col: woodD, k: 0 },
    ...[1, -1].map(sx => ({ s: 'cyl', ax: 'x', c: [sx * 0.2, 0.55, 0], r: 0.04, hh: 0.02, rd: 0.008, col: iron, k: 0 })),
    { s: 'tor', ax: 'z', c: [0, 0.32, 0], R: 0.26, r: 0.045, a0: -Math.PI + 0.3, a1: -0.3, col: iron, k: 0 },
    ...[1, -1].flatMap(sx => [
      { s: 'ell', c: [sx * 0.25, 0.2, 0.0], rr: [0.075, 0.11, 0.03], col: iron, k: 0.02 },
      { s: 'cap', a: [sx * 0.26, 0.26, 0], b: [sx * 0.3, 0.4, 0], r: 0.025, r2: 0.004, col: ironL, k: 0.01 }]),
    { s: 'sph', c: [0, 0.07, 0], r: 0.07, col: iron, k: 0.03 },
    ...[0, 1, 2].map(i => ({ s: 'tor', ax: i % 2 ? 'x' : 'z', c: [0.0, 0.8 + i * 0.07, 0], R: 0.04, r: 0.013, a0: -Math.PI, a1: Math.PI, col: ironL, k: 0 })),
  ], { ao: 0.5 });
  // ---------- Barrel Mines: a powder barrel of red staves with three iron hoops, a white skull, a plank lid, a coiled
  // fuse and its spark ----------
  P('sbarrel', [
    { s: 'cyl', ax: 'y', c: [0, 0.22, 0], r: 0.2, hh: 0.22, rd: 0.07, col: C('#d0382c'), k: 0 },
    { s: 'ell', c: [0, 0.22, 0], rr: [0.215, 0.14, 0.215], col: C('#d0382c'), k: 0.05 },
    ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU; return { s: 'box', c: [Math.cos(a) * 0.212, 0.22, Math.sin(a) * 0.212], hs: [0.005, 0.17, 0.005], rd: 0.003, col: redD, k: 0 }; }),
    ...[0.06, 0.22, 0.38].map(y => ({ s: 'tor', ax: 'y', c: [0, y, 0], R: y === 0.22 ? 0.218 : 0.2, r: 0.018, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 })),
    ...bolts(0.38, 0.2, 6, 0.012, ironL, 0.3),
    { s: 'sph', c: [0, 0.25, 0.205], r: 0.06, col: white, k: 0.01 }, { s: 'box', c: [0, 0.19, 0.205], hs: [0.035, 0.02, 0.012], rd: 0.008, col: white, k: 0 },
    ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.022, 0.26, 0.255], r: 0.016, col: dark, k: 0 })),
    ...[[-1, 1], [1, -1]].map(([a, b]) => ({ s: 'cap', a: [a * 0.09, 0.1, 0.205], b: [b * 0.09, 0.16, 0.205], r: 0.012, col: white, k: 0 })),
    ...[-0.08, 0, 0.08].map(x => ({ s: 'box', c: [x, 0.445, 0], hs: [0.035, 0.008, 0.16], rd: 0.004, col: C('#9a6a3a'), k: 0 })),
    { s: 'tor', ax: 'y', c: [0.05, 0.47, 0.04], R: 0.035, r: 0.008, a0: -Math.PI, a1: Math.PI * 0.6, col: C('#3a2a1a'), k: 0 },
    { s: 'cap', a: [0.05, 0.47, 0.075], b: [0.06, 0.58, 0.03], r: 0.01, col: C('#3a2a1a'), k: 0 },
    { s: 'sph', c: [0.062, 0.6, 0.03], r: 0.032, col: yel, k: 0 }, { s: 'sph', c: [0.062, 0.6, 0.03], r: 0.018, col: C('#fff8d0'), k: 0 },
  ], { ao: 0.5 });
  // ---------- Lighthouse Lamp: a stone base with a door and a window, a tower in red and white bands, a gallery with
  // railings, a glazed lantern room with its frame, the glowing lamp, a red dome, a vent ball and a lightning rod ----------
  P('slamp', [
    { s: 'cyl', ax: 'y', c: [0, 0.07, 0], r: 0.22, hh: 0.07, rd: 0.03, col: C('#9a9488'), k: 0 },
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU + 0.2; return { s: 'box', c: [Math.cos(a) * 0.215, 0.07, Math.sin(a) * 0.215], hs: [0.006, 0.06, 0.04], rd: 0.004, col: C('#7a7468'), k: 0 }; }),
    { s: 'cap', a: [0, 0.12, 0], b: [0, 0.76, 0], r: 0.155, r2: 0.11, col: white, k: 0 },
    ...[0.22, 0.42, 0.62].map((y, i) => ({ s: 'cyl', ax: 'y', c: [0, y, 0], r: 0.152 - y * 0.065 + 0.004, hh: 0.05, rd: 0.01, col: red, k: 0 })),
    { s: 'box', c: [0, 0.2, 0.15], hs: [0.04, 0.06, 0.012], rd: 0.02, col: woodD, k: 0 },
    { s: 'box', c: [0, 0.5, 0.13], hs: [0.025, 0.03, 0.012], rd: 0.01, col: C('#ffe08a'), k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 0.79, 0], r: 0.18, hh: 0.025, rd: 0.01, col: C('#3a3f4a'), k: 0 },
    ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU; return { s: 'cap', a: [Math.cos(a) * 0.17, 0.8, Math.sin(a) * 0.17], b: [Math.cos(a) * 0.17, 0.88, Math.sin(a) * 0.17], r: 0.007, col: C('#3a3f4a'), k: 0 }; }),
    { s: 'tor', ax: 'y', c: [0, 0.88, 0], R: 0.17, r: 0.01, a0: -Math.PI, a1: Math.PI, col: C('#3a3f4a'), k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 0.93, 0], r: 0.115, hh: 0.1, rd: 0.02, col: C('#c8f0ff'), k: 0 },
    ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * TAU; return { s: 'cap', a: [Math.cos(a) * 0.117, 0.83, Math.sin(a) * 0.117], b: [Math.cos(a) * 0.117, 1.03, Math.sin(a) * 0.117], r: 0.008, col: C('#2a2e38'), k: 0 }; }),
    { s: 'sph', c: [0, 0.93, 0], r: 0.075, col: C('#fff2a0'), k: 0 },
    { s: 'ell', c: [0, 1.06, 0], rr: [0.14, 0.09, 0.14], col: red, k: 0 },
    { s: 'sph', c: [0, 1.16, 0], r: 0.028, col: C('#3a3f4a'), k: 0 },
    { s: 'cap', a: [0, 1.18, 0], b: [0, 1.32, 0], r: 0.008, col: brass, k: 0 },
  ], { ao: 0.6 });
  // ---------- Fishing Net: an A-frame rack with the net draped over its bar, cork floats, a buoy and a hooked fish; the
  // thrown net is a dome of mesh ----------
  {
    const netC = C('#c8b890'), cord = C('#a89870');
    P('snetrack', [
      ...[1, -1].flatMap(sx => [{ s: 'cap', a: [sx * 0.22, 0, 0.1], b: [sx * 0.18, 0.56, 0], r: 0.03, col: woodD, k: 0 }, { s: 'cap', a: [sx * 0.22, 0, -0.1], b: [sx * 0.18, 0.56, 0], r: 0.03, col: woodD, k: 0 }]),
      { s: 'cap', a: [-0.24, 0.55, 0], b: [0.24, 0.55, 0], r: 0.028, col: wood, k: 0 },
      { s: 'ell', c: [0, 0.42, 0.04], rr: [0.24, 0.15, 0.06], col: netC, k: 0.03 }, { s: 'ell', c: [0, 0.42, -0.04], rr: [0.24, 0.15, 0.06], col: netC, k: 0.03 },
      ...Array.from({ length: 5 }, (_, i) => ({ s: 'cap', a: [-0.2 + i * 0.1, 0.55, 0.06], b: [-0.22 + i * 0.11, 0.28, 0.1], r: 0.008, col: cord, k: 0 })),
      ...Array.from({ length: 2 }, (_, i) => ({ s: 'cap', a: [-0.24, 0.47 - i * 0.1, 0.1], b: [0.24, 0.47 - i * 0.1, 0.1], r: 0.007, col: cord, k: 0 })),
      ...[-0.18, -0.06, 0.06, 0.18].map((x, i) => ({ s: 'ell', c: [x, 0.27, 0.11], rr: [0.035, 0.025, 0.025], col: i % 2 ? C('#ff8a2a') : white, k: 0 })),
      { s: 'sph', c: [0.3, 0.12, 0.05], r: 0.09, col: red, k: 0 }, { s: 'tor', ax: 'y', c: [0.3, 0.12, 0.05], R: 0.09, r: 0.018, a0: -Math.PI, a1: Math.PI, col: white, k: 0 },
      { s: 'ell', c: [-0.05, 0.3, 0.16], rr: [0.025, 0.06, 0.1], col: C('#7ab8e0'), k: 0.02 }, { s: 'cap', a: [-0.05, 0.3, 0.06], b: [-0.05, 0.27, 0.0], r: 0.025, r2: 0.005, col: C('#7ab8e0'), k: 0.02 },
    ], { ao: 0.6 });
    const p = [];
    p.push({ s: 'tor', ax: 'y', c: [0, 0, 0], R: 1, r: 0.03, a0: -Math.PI, a1: Math.PI, col: C('#e8dcb8'), k: 0 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; p.push({ s: 'cap', a: [Math.cos(a), 0, Math.sin(a)], b: [Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5], r: 0.025, col: C('#e8dcb8'), k: 0 }, { s: 'cap', a: [Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5], b: [0, 0.55, 0], r: 0.025, col: C('#e8dcb8'), k: 0 }); }
    p.push({ s: 'tor', ax: 'y', c: [0, 0.28, 0], R: 0.78, r: 0.022, a0: -Math.PI, a1: Math.PI, col: C('#e8dcb8'), k: 0 }, { s: 'tor', ax: 'y', c: [0, 0.47, 0], R: 0.42, r: 0.022, a0: -Math.PI, a1: Math.PI, col: C('#e8dcb8'), k: 0 });
    for (let i = 0; i < 8; i++) { const a = (i / 8 + 1 / 16) * TAU; p.push({ s: 'sph', c: [Math.cos(a), 0, Math.sin(a)], r: 0.07, col: i % 2 ? white : C('#ff8a2a'), k: 0 }); }
    P('snet', p, { ao: 0.3 });
  }
  // ---------- Seagull Squadron: a round white gull with a grey back, grey wings with black tips and white spots, a
  // yellow beak with a red spot, a stern little brow, tail feathers and tucked orange feet ----------
  {
    const grey = C('#c8ced6'), greyD = C('#9aa4b0');
    const m = P('sgull', [
      { s: 'ell', c: [0, 0.5, 0], rr: [0.11, 0.1, 0.2], col: white, k: 0.03 },
      { s: 'ell', c: [0, 0.56, -0.04], rr: [0.09, 0.05, 0.15], col: grey, k: 0.04 },
      { s: 'sph', c: [0, 0.59, 0.18], r: 0.085, col: white, k: 0.04 },
      { s: 'cap', a: [0, 0.575, 0.25], b: [0, 0.55, 0.37], r: 0.03, r2: 0.012, col: yel, k: 0 }, { s: 'sph', c: [0, 0.553, 0.33], r: 0.012, col: red, k: 0 },
      ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.046, 0.615, 0.235], r: 0.018, col: dark, k: 0 }, { s: 'cap', a: [sx * 0.07, 0.645, 0.22], b: [sx * 0.025, 0.635, 0.25], r: 0.008, col: greyD, k: 0 }]),
      ...[-0.03, 0, 0.03].map(x => ({ s: 'ell', c: [x, 0.5, -0.24], rr: [0.035, 0.018, 0.07], col: x ? grey : C('#2a2e38'), k: 0.02 })),
      ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.04, 0.42, -0.02], b: [sx * 0.04, 0.42, -0.1], r: 0.018, r2: 0.012, col: C('#ff9a3a'), k: 0.01 })),
      ...[[1, 3], [-1, 5]].flatMap(([sx, b]) => [
        { s: 'ell', c: [sx * 0.24, 0.53, -0.01], rr: [0.18, 0.025, 0.09], col: grey, bone: b, k: 0.02 },
        { s: 'ell', c: [sx * 0.2, 0.545, 0.02], rr: [0.12, 0.018, 0.05], col: white, bone: b, k: 0.01 },
        { s: 'ell', c: [sx * 0.42, 0.535, -0.04], rr: [0.08, 0.02, 0.06], col: C('#2a2e38'), bone: b, k: 0.02 },
        { s: 'sph', c: [sx * 0.44, 0.55, -0.03], r: 0.014, col: white, bone: b, k: 0 }]),
    ], { ao: 0.3 });
    rig(m, { 3: [0.08, 0.53, 0], 5: [-0.08, 0.53, 0] });
  }
  // ---------- Shark Escort: a friendly shark, darker on top, with a white belly, gill slits, a tall dorsal fin and a
  // second little one, broad pectoral fins, bright eyes and a toothy grin; the tail on its own bone ----------
  {
    const sk = C('#5a84a8'), skD = C('#3e6488'), belly = C('#eef4f8');
    const m = P('sshark', [
      { s: 'ell', c: [0, 0.0, 0.05], rr: [0.26, 0.24, 0.7], col: sk, k: 0 },
      { s: 'ell', c: [0, 0.1, 0.0], rr: [0.18, 0.12, 0.6], col: skD, k: 0.08 },
      { s: 'ell', c: [0, -0.07, 0.1], rr: [0.22, 0.17, 0.6], col: belly, k: 0.05 },
      { s: 'cap', a: [0, 0.18, -0.05], b: [0, 0.62, -0.3], r: 0.1, r2: 0.02, col: skD, k: 0.05 },
      { s: 'cap', a: [0, 0.16, -0.45], b: [0, 0.3, -0.55], r: 0.04, r2: 0.012, col: skD, k: 0.03 },
      ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.32, -0.09, 0.15], rr: [0.2, 0.03, 0.11], col: sk, k: 0.03 })),
      ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.15, 0.08, 0.55], r: 0.045, col: white, k: 0 }, { s: 'sph', c: [sx * 0.165, 0.085, 0.58], r: 0.025, col: dark, k: 0 }]),
      ...[1, -1].flatMap(sx => [0.3, 0.36, 0.42].map(z => ({ s: 'cap', a: [sx * 0.235, 0.06, z], b: [sx * 0.24, -0.06, z + 0.02], r: 0.008, col: skD, k: 0 }))),
      { s: 'ell', c: [0, -0.06, 0.66], rr: [0.14, 0.035, 0.05], col: C('#7a1a24'), k: 0 },
      ...[-0.09, -0.045, 0, 0.045, 0.09].map(x => ({ s: 'cap', a: [x, -0.035, 0.69], b: [x, -0.08, 0.705], r: 0.013, r2: 0.003, col: white, k: 0 })),
      { s: 'cap', a: [0, 0.0, -0.55], b: [0, 0.02, -0.85], r: 0.11, r2: 0.05, col: sk, bone: 7, k: 0.04 },
      { s: 'cap', a: [0, 0.02, -0.82], b: [0, 0.32, -1.02], r: 0.05, r2: 0.015, col: skD, bone: 7, k: 0.03 },
      { s: 'cap', a: [0, 0.0, -0.82], b: [0, -0.2, -0.95], r: 0.045, r2: 0.015, col: skD, bone: 7, k: 0.03 },
    ], { ao: 0.4 });
    rig(m, { 0: [0, 0, 0], 7: [0, 0, -0.55] });
  }
  // ---------- Water Cannon: a fire-engine pump: a red tank with brass bands and rivets on a bolted swivel, a pressure
  // gauge, a handwheel valve, a coiled canvas hose and a long brass nozzle with a grip ----------
  P('shose', [
    { s: 'cyl', ax: 'y', c: [0, 0.06, 0], r: 0.17, hh: 0.06, rd: 0.025, col: C('#3a3f4a'), k: 0 },
    ...bolts(0.12, 0.14, 8, 0.013, steel),
    { s: 'cap', a: [0, 0.13, 0], b: [0, 0.2, 0], r: 0.05, col: ironL, k: 0 },
    { s: 'cap', a: [0, 0.29, -0.24], b: [0, 0.29, 0.12], r: 0.14, col: red, k: 0 },
    ...[-0.16, -0.02, 0.1].map(z => ({ s: 'tor', ax: 'z', c: [0, 0.29, z], R: 0.142, r: 0.014, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 })),
    ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * TAU; return { s: 'sph', c: [Math.cos(a) * 0.14, 0.29 + Math.sin(a) * 0.14, -0.09], r: 0.011, col: brass, k: 0 }; }),
    { s: 'cap', a: [0, 0.31, 0.12], b: [0, 0.35, 0.62], r: 0.05, r2: 0.034, col: brass, k: 0.02 },
    { s: 'tor', ax: 'z', c: [0, 0.343, 0.48], R: 0.04, r: 0.013, a0: -Math.PI, a1: Math.PI, col: C('#c08a2a'), k: 0 },
    { s: 'tor', ax: 'z', c: [0, 0.35, 0.62], R: 0.036, r: 0.014, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 },
    { s: 'cap', a: [0, 0.33, 0.36], b: [0, 0.22, 0.4], r: 0.022, col: woodD, k: 0 },
    // the gauge and the handwheel on top
    { s: 'cyl', ax: 'z', c: [0.09, 0.44, -0.04], r: 0.05, hh: 0.015, rd: 0.006, col: brass, k: 0 },
    { s: 'cyl', ax: 'z', c: [0.09, 0.44, -0.024], r: 0.04, hh: 0.004, rd: 0.002, col: white, k: 0 },
    { s: 'cap', a: [0.09, 0.44, -0.018], b: [0.12, 0.465, -0.018], r: 0.005, col: red, k: 0 },
    { s: 'cap', a: [0.09, 0.42, -0.04], b: [0.09, 0.36, -0.04], r: 0.012, col: brass, k: 0 },
    { s: 'tor', ax: 'y', c: [-0.08, 0.47, -0.12], R: 0.05, r: 0.01, a0: -Math.PI, a1: Math.PI, col: red, k: 0 },
    { s: 'cap', a: [-0.13, 0.47, -0.12], b: [-0.03, 0.47, -0.12], r: 0.007, col: red, k: 0 }, { s: 'cap', a: [-0.08, 0.47, -0.17], b: [-0.08, 0.47, -0.07], r: 0.007, col: red, k: 0 },
    { s: 'cap', a: [-0.08, 0.47, -0.12], b: [-0.08, 0.41, -0.12], r: 0.012, col: brass, k: 0 },
    // a coil of canvas hose at its side
    ...[0, 1].map(i => ({ s: 'tor', ax: 'y', c: [-0.2, 0.05 + i * 0.045, 0.1], R: 0.09 - i * 0.012, r: 0.022, a0: -Math.PI, a1: Math.PI, col: C('#e8dcc0'), k: 0.01 })),
  ], { ao: 0.6 });
  // ---------- Goo Figurehead: a goo hero leaning out over the waves on a gilded scroll, a star on its chest, laurels on
  // its head and a goo cape streaming back (the goo takes the blob's color) ----------
  P('sfigure', [
    { s: 'ell', c: [0, 0.0, -0.05], rr: [0.18, 0.12, 0.22], col: brass, k: 0 },
    { s: 'tor', ax: 'x', c: [0, 0.02, -0.18], R: 0.08, r: 0.03, a0: -Math.PI, a1: Math.PI * 0.7, col: C('#c8962a'), k: 0 },
    { s: 'tor', ax: 'x', c: [0, 0.02, 0.1], R: 0.06, r: 0.025, a0: -Math.PI * 0.2, a1: Math.PI * 1.4, col: C('#c8962a'), k: 0 },
    { s: 'ell', c: [0, 0.22, 0.12], rr: [0.2, 0.26, 0.18], k: 0.08 },
    { s: 'sph', c: [0, 0.5, 0.3], r: 0.17, k: 0.08 },
    { s: 'ell', c: [0, 0.3, -0.1], rr: [0.22, 0.2, 0.1], k: 0.06 },
    ...[1, -1].flatMap(sx => [
      { s: 'cap', a: [sx * 0.15, 0.36, 0.12], b: [sx * 0.3, 0.42, 0.38], r: 0.06, r2: 0.05, k: 0.05 },
      { s: 'sph', c: [sx * 0.31, 0.43, 0.42], r: 0.07, k: 0.03 }]),
    ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.06, 0.55, 0.44], r: 0.03, col: dark, k: 0 })),
    { s: 'tor', ax: 'y', c: [0, 0.64, 0.3], R: 0.13, r: 0.022, a0: -Math.PI, a1: Math.PI, col: C('#5ac85a'), k: 0 },
    ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * TAU; return { s: 'ell', c: [Math.cos(a) * 0.13, 0.66, 0.3 + Math.sin(a) * 0.13], rr: [0.035, 0.015, 0.02], col: C('#4ab84a'), k: 0 }; }),
    { s: 'sph', c: [0, 0.3, 0.29], r: 0.05, col: yel, k: 0.01 },
  ], { ao: 0.4 });
  // ---------- Fortifications: two overlapping riveted iron plates with a brass trim, three spikes pointing out (+x)
  // and a swag of chain ----------
  P('sfort', [
    { s: 'box', c: [0, 0, 0], hs: [0.03, 0.18, 0.28], rd: 0.025, col: C('#6a7484'), k: 0 },
    { s: 'box', c: [0.025, 0.02, 0.06], hs: [0.02, 0.13, 0.17], rd: 0.02, col: C('#7a8494'), k: 0 },
    { s: 'box', c: [0.0, 0.18, 0], hs: [0.035, 0.015, 0.28], rd: 0.01, col: brass, k: 0 },
    ...[[-0.13, -0.22], [-0.13, 0.22], [0.13, -0.22], [0.13, 0.22], [-0.13, 0], [0.13, 0], [0, -0.22], [0, 0.22]].map(([y, z]) => ({ s: 'sph', c: [0.034, y, z], r: 0.02, col: steel, k: 0 })),
    ...[[0.0, 0.0, 0.32], [0.08, -0.12, 0.2], [0.08, 0.12, 0.2]].map(([y, z, l]) => ({ s: 'cap', a: [0.045, y, z], b: [0.045 + l, y + 0.01, z], r: 0.055, r2: 0.004, col: C('#c8d0da'), k: 0 })),
    ...[[0.0, 0.0], [0.08, -0.12], [0.08, 0.12]].map(([y, z]) => ({ s: 'cyl', ax: 'x', c: [0.05, y, z], r: 0.06, hh: 0.012, rd: 0.005, col: ironD, k: 0 })),
    ...Array.from({ length: 5 }, (_, i) => { const u = (i + 0.5) / 5, z = -0.24 + u * 0.48; return { s: 'tor', ax: i % 2 ? 'x' : 'y', c: [0.05, -0.14 - Math.sin(u * Math.PI) * 0.05, z], R: 0.028, r: 0.009, a0: -Math.PI, a1: Math.PI, col: ironL, k: 0 }; }),
  ], { ao: 0.5 });
  // ---------- Propellers: an outboard motor on the stern: a rounded red cowling with a white stripe, a dark seam and a
  // brass badge, a tiller handle, the leg down to a torpedo gearcase with a cavitation plate and a skeg, and a
  // four-bladed brass propeller with a hub cap (turning, bone 1) ----------
  {
    const grey = C('#3a3f4a'), greyL = C('#5a6270');
    const m = P('sprop', [
      { s: 'box', c: [0, 0.34, -0.08], hs: [0.15, 0.15, 0.19], rd: 0.1, col: red, k: 0 },
      { s: 'ell', c: [0, 0.47, -0.08], rr: [0.15, 0.09, 0.19], col: red, k: 0.05 },
      { s: 'box', c: [0, 0.43, -0.08], hs: [0.153, 0.012, 0.193], rd: 0.01, col: dark, k: 0 },
      { s: 'box', c: [0, 0.32, -0.08], hs: [0.154, 0.024, 0.194], rd: 0.02, col: white, k: 0 },
      ...[1, -1].map(sx => ({ s: 'cyl', ax: 'x', c: [sx * 0.153, 0.37, -0.04], r: 0.04, hh: 0.006, rd: 0.003, col: brass, k: 0 })),
      { s: 'cap', a: [0, 0.2, -0.1], b: [0, -0.1, -0.1], r: 0.045, r2: 0.04, col: grey, k: 0.02 },
      { s: 'box', c: [0, -0.02, -0.12], hs: [0.075, 0.01, 0.1], rd: 0.01, col: greyL, k: 0 },
      { s: 'cap', a: [0, -0.13, 0.0], b: [0, -0.13, -0.17], r: 0.05, r2: 0.045, col: grey, k: 0.02 },
      { s: 'box', c: [0, -0.22, -0.06], hs: [0.012, 0.07, 0.05], rd: 0.008, col: grey, k: 0 },
      { s: 'cap', a: [0, 0.4, 0.08], b: [0, 0.38, 0.4], r: 0.02, col: grey, k: 0 }, { s: 'cap', a: [0, 0.38, 0.34], b: [0, 0.38, 0.46], r: 0.03, col: dark, k: 0 },
      { s: 'cap', a: [0.08, 0.5, -0.24], b: [0.1, 0.6, -0.26], r: 0.02, col: steel, k: 0 },
      { s: 'sph', c: [0, -0.13, -0.21], r: 0.045, col: brass, bone: 1, k: 0 },
      { s: 'cap', a: [0, -0.13, -0.23], b: [0, -0.13, -0.28], r: 0.03, r2: 0.008, col: C('#c08a2a'), bone: 1, k: 0 },
      ...[[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ s: 'ell', c: [dx * 0.1, -0.13 + dy * 0.1, -0.21], rr: dx ? [0.085, 0.042, 0.016] : [0.042, 0.085, 0.016], col: brass, bone: 1, k: 0.02 })),
    ], { ao: 0.6 });
    rig(m, { 1: [0, -0.13, -0.21] });
  }
  // ---------- Repair Crew: a little goo sailor (the body takes the blob's color) in a white cap with a blue band and
  // ribbon, a red neckerchief, a tool belt with a wrench, and a hammer ----------
  {
    const o = { ...STICK, hipY: 0.3, shY: 0.5, headY: 0.68, headR: 0.15, shW: 0.1, hipW: 0.06, upperLen: 0.1, foreLen: 0.1, pelvisR: 0.13, torso: 'ell', torsoRR: [0.15, 0.16, 0.13], neckR: 0.09, armR: 0.045, handR: 0.05, legR: 0.05, k: 0.06 };
    const m = makeHumanoid(o), hd = m.J.head;
    for (const p of m.parts) delete p.col;
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.12, hd[2]], r: 0.12, hh: 0.035, rd: 0.02, col: white, bone: 2, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.08, hd[2]], r: 0.135, hh: 0.02, rd: 0.01, col: C('#2f5fb8'), bone: 2, k: 0 });
    for (const sx of [1, -1]) m.parts.push({ s: 'cap', a: [hd[0] + sx * 0.03, hd[1] + 0.08, hd[2] - 0.13], b: [hd[0] + sx * 0.06, hd[1] - 0.02, hd[2] - 0.17], r: 0.012, col: C('#2f5fb8'), bone: 2, k: 0 });
    for (const sx of [1, -1]) m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.05, hd[1] + 0.01, hd[2] + 0.13], r: 0.025, col: dark, bone: 2, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [0, 0.55, 0], R: 0.09, r: 0.022, a0: -Math.PI, a1: Math.PI, col: red, bone: 1, k: 0 });
    m.parts.push({ s: 'cap', a: [0, 0.53, 0.09], b: [0.02, 0.46, 0.12], r: 0.02, r2: 0.012, col: red, bone: 1, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [0, 0.34, 0], R: 0.135, r: 0.02, a0: -Math.PI, a1: Math.PI, col: C('#6a4426'), bone: 1, k: 0 });
    m.parts.push({ s: 'box', c: [0.1, 0.32, 0.1], hs: [0.012, 0.05, 0.02], rd: 0.008, col: steel, bone: 1, k: 0 });
    const h = m.J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1], h[2] - 0.04], b: [h[0], h[1], h[2] + 0.18], r: 0.018, col: woodD, bone: 6, k: 0 });
    m.parts.push({ s: 'box', c: [h[0], h[1], h[2] + 0.2], hs: [0.03, 0.08, 0.035], rd: 0.01, col: C('#5a6270'), bone: 6, k: 0 });
    m.name = 'screw'; m.runAmp = 1.2;
    defs.screw = m;
  }
  // ---------- Gust Sails: a square sail bellied out by the wind (a shell cut to a rectangle, so it reads as canvas,
  // not an egg) with a blue wind swirl and a row of reef points, on a mast with a yard top and bottom, ropes from the
  // yard ends and the lower corners to the deck, a crow's-nest ring and a long pennant ----------
  P('ssail', [
    { s: 'ell', c: [0, 1.02, -0.02], rr: [0.78, 0.64, 0.24], col: C('#f6fbff'), k: 0 },
    { s: 'ell', c: [0, 1.02, -0.07], rr: [0.74, 0.6, 0.24], sub: true, k: 0 },
    { s: 'box', c: [0, 1.02, -0.6], hs: [1, 1, 0.6], sub: true, k: 0 },
    ...[1, -1].map(sx => ({ s: 'box', c: [sx * 1.02, 1.02, 0], hs: [0.5, 1, 1], sub: true, k: 0 })),
    { s: 'box', c: [0, 2.0, 0], hs: [1, 0.5, 1], sub: true, k: 0 },
    { s: 'box', c: [0, 0.06, 0], hs: [1, 0.5, 1], sub: true, k: 0 },
    { s: 'tor', ax: 'z', c: [0, 1.06, 0.2], R: 0.17, r: 0.026, a0: -0.4, a1: 3.6, col: C('#35b8e8'), k: 0 },
    { s: 'tor', ax: 'z', c: [0.05, 1.02, 0.21], R: 0.075, r: 0.023, a0: 0.5, a1: 4.4, col: C('#35b8e8'), k: 0 },
    ...[-0.36, -0.18, 0, 0.18, 0.36].map(x => ({ s: 'sph', c: [x, 1.32, 0.24 * Math.sqrt(Math.max(0, 1 - (x / 0.78) ** 2 - (0.3 / 0.64) ** 2)) - 0.01], r: 0.018, col: rope, k: 0 })),
    { s: 'cap', a: [0, 0, -0.06], b: [0, 1.85, -0.06], r: 0.05, r2: 0.035, col: woodD, k: 0 },
    { s: 'cap', a: [-0.56, 1.5, -0.04], b: [0.56, 1.5, -0.04], r: 0.03, col: woodD, k: 0 },
    { s: 'cap', a: [-0.52, 0.55, -0.04], b: [0.52, 0.55, -0.04], r: 0.03, col: woodD, k: 0 },
    ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.56, 1.5, -0.04], r: 0.035, col: brass, k: 0 })),
    { s: 'tor', ax: 'y', c: [0, 1.7, -0.06], R: 0.1, r: 0.02, a0: -Math.PI, a1: Math.PI, col: wood, k: 0 },
    ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.56, 1.5, -0.04], b: [sx * 0.3, 0.02, -0.3], r: 0.013, col: rope, k: 0 })),
    ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.5, 0.58, -0.02], b: [sx * 0.42, 0.02, 0.2], r: 0.013, col: rope, k: 0 })),
    { s: 'cap', a: [0, 1.85, -0.06], b: [0, 1.85, -0.44], r: 0.006, col: woodD, k: 0 },
    { s: 'box', c: [0, 1.82, -0.28], hs: [0.012, 0.055, 0.2], rd: 0.008, col: C('#35b8e8'), k: 0 },
  ], { ao: 0.4 });

  // ---------- Whirlpool (the upgrade's picture): a funnel of water spiralling down, foam on its rim, bits of
  // flotsam caught in it ----------
  {
    // (an open funnel: the capsules' round tops are cut away above the rim)
    const p = [{ s: 'cap', a: [0, 0.02, 0], b: [0, -0.5, 0], r: 0.62, r2: 0.12, col: C('#1f6fc8'), k: 0 }, { s: 'cap', a: [0, 0.06, 0], b: [0, -0.46, 0], r: 0.56, r2: 0.08, sub: true, k: 0 }, { s: 'box', c: [0, 0.62, 0], hs: [1, 0.6, 1], sub: true, k: 0 }];
    for (let i = 0; i < 3; i++) p.push({ s: 'tor', ax: 'y', c: [0, -0.06 - i * 0.14, 0], R: 0.5 - i * 0.14, r: 0.035 - i * 0.006, a0: i, a1: i + 4.2, col: i ? C('#8fdcff') : C('#f2fbff'), k: 0 });
    p.push({ s: 'tor', ax: 'y', c: [0, 0.02, 0], R: 0.6, r: 0.05, a0: -Math.PI, a1: Math.PI, col: C('#f2fbff'), k: 0 });
    p.push({ s: 'box', c: [0.32, -0.08, 0.18], hs: [0.08, 0.02, 0.03], rd: 0.01, col: wood, k: 0 }, { s: 'sph', c: [-0.24, -0.2, -0.12], r: 0.05, col: C('#ff8a3a'), k: 0 });
    P('swhirl', p, { ao: 0.4 });
  }
  // ---------- Storm Cloud: a dark billowing cloud with a paler top, rain streaks and a gold lightning bolt ----------
  P('scloud', [
    ...[[0, 0, 0, 0.36], [0.32, -0.04, 0.05, 0.28], [-0.32, -0.04, -0.02, 0.27], [0.12, 0.18, -0.05, 0.27], [-0.14, 0.14, 0.08, 0.24], [0.5, -0.1, -0.06, 0.18], [-0.5, -0.1, 0.06, 0.18]].map(([x, y, z, r], i) => ({ s: 'sph', c: [x, y, z], r, col: i > 2 ? C('#8a92a8') : C('#5a6278'), k: 0.08 })),
    ...[-0.3, -0.1, 0.12, 0.34].map(x => ({ s: 'cap', a: [x, -0.32, 0.05], b: [x - 0.05, -0.62, 0.05], r: 0.012, col: C('#9fd8ff'), k: 0 })),
    { s: 'cap', a: [0.02, -0.25, 0.2], b: [-0.08, -0.48, 0.22], r: 0.035, col: yel, k: 0 }, { s: 'cap', a: [-0.08, -0.48, 0.22], b: [0.06, -0.52, 0.22], r: 0.035, col: yel, k: 0 }, { s: 'cap', a: [0.06, -0.52, 0.22], b: [-0.06, -0.82, 0.22], r: 0.03, r2: 0.008, col: yel, k: 0 },
  ], { ao: 0.5 });
  // ---------- Kraken Arm: a purple tentacle rising from a ring of foam, curling over at the top (three bones: base,
  // upper half, tip), with rows of pale suckers on its inner side ----------
  {
    const pur = C('#8a3ad8'), purD = C('#5a1fa0'), suck = C('#f4c8ff');
    const segs = [[0, 0.0, 0, 0.16, 0], [0, 0.45, 0.02, 0.13, 0], [0, 0.85, 0.06, 0.1, 1], [0, 1.2, 0.12, 0.075, 1], [0, 1.5, 0.2, 0.05, 2], [0, 1.72, 0.3, 0.025, 2]];
    const p = [];
    for (let i = 0; i < segs.length - 1; i++) { const [x, y, z, r, b] = segs[i], [x2, y2, z2, r2] = segs[i + 1]; p.push({ s: 'cap', a: [x, y, z], b: [x2, y2, z2], r, r2, col: i % 2 ? pur : purD, bone: b, k: 0.05 }); }
    for (let i = 0; i < 8; i++) { const u = (i + 0.5) / 8, y = 0.1 + u * 1.5, r = 0.15 - u * 0.11; p.push({ s: 'sph', c: [0, y, 0.02 + u * 0.25 + r * 0.85], r: 0.03 - u * 0.015, col: suck, bone: y > 1.35 ? 2 : y > 0.75 ? 1 : 0, k: 0 }); }
    p.push({ s: 'tor', ax: 'y', c: [0, 0.0, 0], R: 0.24, r: 0.05, a0: -Math.PI, a1: Math.PI, col: C('#f2fbff'), k: 0 });
    const m = P('stent', p, { ao: 0.4 });
    rig(m, { 0: [0, 0, 0], 1: [0, 0.8, 0.05], 2: [0, 1.38, 0.17] });
    // (bones 1 and 2 hang off 0 and 1: the curl adds up along the arm)
  }
  // ---------- Dolphin Pod: a sleek grey-blue dolphin with a pale belly, a curved dorsal fin, flippers, a beak, a
  // smile and bright eyes; its tail flukes on their own bone ----------
  {
    const dk = C('#6a8eb8'), dkD = C('#4a6e98'), belly = C('#e8f0f8');
    const m = P('sdolph', [
      { s: 'ell', c: [0, 0.0, 0.0], rr: [0.2, 0.2, 0.62], col: dk, k: 0 },
      { s: 'ell', c: [0, 0.08, -0.02], rr: [0.14, 0.11, 0.55], col: dkD, k: 0.08 },
      { s: 'ell', c: [0, -0.07, 0.06], rr: [0.16, 0.12, 0.52], col: belly, k: 0.06 },
      { s: 'cap', a: [0, 0.0, 0.55], b: [0, -0.03, 0.82], r: 0.075, r2: 0.04, col: dk, k: 0.06 },
      { s: 'cap', a: [0, -0.04, 0.6], b: [0, -0.06, 0.8], r: 0.05, r2: 0.03, col: belly, k: 0.03 },
      { s: 'cap', a: [0, 0.15, 0.0], b: [0, 0.4, -0.2], r: 0.07, r2: 0.015, col: dkD, k: 0.04 },
      ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.15, -0.08, 0.2], b: [sx * 0.34, -0.17, 0.05], r: 0.05, r2: 0.02, col: dkD, k: 0.03 })),
      ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.12, 0.05, 0.5], r: 0.035, col: white, k: 0 }, { s: 'sph', c: [sx * 0.13, 0.055, 0.52], r: 0.02, col: dark, k: 0 }]),
      { s: 'cap', a: [0.05, -0.05, 0.76], b: [-0.05, -0.05, 0.76], r: 0.01, col: dkD, k: 0 },
      { s: 'cap', a: [0, 0.0, -0.5], b: [0, 0.02, -0.8], r: 0.1, r2: 0.045, col: dk, bone: 7, k: 0.04 },
      ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.15, 0.02, -0.86], rr: [0.17, 0.025, 0.08], col: dkD, bone: 7, k: 0.03 })),
    ], { ao: 0.4 });
    rig(m, { 0: [0, 0, 0], 7: [0, 0, -0.5] });
  }
  // ---------- Hull Plating: a riveted steel plate leaning on a crate, a hammer beside it ----------
  P('splate', [
    { s: 'box', c: [0, 0.32, 0], hs: [0.3, 0.3, 0.03], rd: 0.04, col: steel, k: 0 },
    { s: 'box', c: [0, 0.32, 0.03], hs: [0.24, 0.24, 0.01], rd: 0.03, col: C('#c4d0de'), k: 0 },
    ...[-0.23, 0.23].flatMap(x => [-0.23, 0.23].map(y => ({ s: 'sph', c: [x, 0.32 + y, 0.035], r: 0.025, col: ironL, k: 0 }))),
    ...[-0.12, 0, 0.12].map(x => ({ s: 'sph', c: [x, 0.09, 0.035], r: 0.018, col: ironL, k: 0 })),
    { s: 'cap', a: [0.38, 0.02, 0.15], b: [0.38, 0.32, 0.12], r: 0.02, col: woodD, k: 0 },
    { s: 'box', c: [0.38, 0.33, 0.12], hs: [0.08, 0.035, 0.035], rd: 0.012, col: iron, k: 0 },
  ], { ao: 0.6 });
  // ---------- Gunpowder: a squat black keg with brass hoops, a skull and crossbones, a lit fuse and spilled powder ----------
  P('spowder', [
    { s: 'cyl', ax: 'y', c: [0, 0.22, 0], r: 0.22, hh: 0.2, rd: 0.06, col: C('#2a2630'), k: 0 },
    ...[0.08, 0.36].map(y => ({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.225, r: 0.016, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 })),
    { s: 'sph', c: [0, 0.24, 0.215], r: 0.06, col: white, k: 0 }, ...[-0.022, 0.022].map(x => ({ s: 'sph', c: [x, 0.25, 0.268], r: 0.014, col: dark, k: 0 })),
    ...[[-1, 1], [1, -1]].map(([a, b]) => ({ s: 'cap', a: [a * 0.07, 0.16, 0.215], b: [b * 0.07, 0.2, 0.215], r: 0.012, col: white, k: 0 })),
    { s: 'cap', a: [0.06, 0.42, 0], b: [0.12, 0.55, 0.03], r: 0.012, col: C('#3a2a1a'), k: 0 },
    { s: 'sph', c: [0.125, 0.57, 0.03], r: 0.035, col: yel, k: 0 }, { s: 'sph', c: [0.125, 0.57, 0.03], r: 0.02, col: C('#fff8d0'), k: 0 },
    { s: 'ell', c: [-0.24, 0.0, 0.16], rr: [0.14, 0.02, 0.09], col: C('#3a3540'), k: 0 },
  ], { ao: 0.5 });
  // ---------- Treasure Hunter: an open chest of gold coins and a gem, a rolled map on top ----------
  P('schest', [
    { s: 'box', c: [0, 0.14, 0], hs: [0.28, 0.13, 0.18], rd: 0.03, col: wood, k: 0 },
    ...[-0.18, 0.18].map(x => ({ s: 'box', c: [x, 0.14, 0], hs: [0.025, 0.135, 0.185], rd: 0.01, col: brass, k: 0 })),
    { s: 'box', c: [0, 0.4, -0.16], hs: [0.28, 0.14, 0.03], rd: 0.03, col: woodD, k: 0 },
    ...Array.from({ length: 9 }, (_, i) => ({ s: 'cyl', ax: 'y', c: [-0.18 + (i % 3) * 0.18 + (i > 5 ? 0.05 : 0), 0.28 + Math.floor(i / 3) * 0.025, -0.08 + Math.floor(i / 3) * 0.08], r: 0.06, hh: 0.012, rd: 0.006, col: yel, k: 0 })),
    { s: 'sph', c: [0.08, 0.36, 0.06], r: 0.05, col: C('#3ad0ff'), k: 0 },
    { s: 'cap', a: [-0.2, 0.33, 0.1], b: [0.05, 0.36, 0.14], r: 0.04, col: C('#f0e0b8'), k: 0 }, { s: 'tor', ax: 'z', c: [-0.08, 0.345, 0.12], R: 0.042, r: 0.008, a0: -Math.PI, a1: Math.PI, col: red, k: 0 },
  ], { ao: 0.5 });
}
