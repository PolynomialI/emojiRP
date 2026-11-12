// ============================================================
// Everything the sea's upgrades mount on a ship (drawn at each ship's mount scale), and the creatures they send
// out: seagulls, sharks, the crew. Facing +z; y = 0 is where it stands on deck (or the waterline).
// ============================================================
const MOUNT_MESHES = ['smusket', 'sharpoon', 'sgunner', 'sanchor', 'sbarrel', 'slamp', 'snetrack', 'snet', 'sgull', 'sshark', 'shose', 'sfigure', 'sfort', 'sprop', 'screw', 'ssail'];
MESH_ORDER.push(...MOUNT_MESHES, ...SHIP_PIECES);
Object.assign(THEME_CLIPS, { sgull: ['flap'], sshark: ['swim'], sprop: ['pspin'], screw: ['run', 'slam', 'idle'], ssail: ['rock'] });
Object.assign(THEME_CELLS, { smusket: 0.016, sharpoon: 0.014, sgunner: 0.018, sanchor: 0.016, sbarrel: 0.016, slamp: 0.016, snetrack: 0.016, snet: 0.03, sgull: 0.015, sshark: 0.02, shose: 0.015, sfigure: 0.018, sfort: 0.016, sprop: 0.015, screw: 0.013, ssail: 0.022 });
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
  const wood = C('#a8693a'), woodD = C('#6e4426'), iron = C('#3a3f4a'), ironL = C('#5a6270'), steel = C('#a8b4c2'), brass = C('#e0b048');
  const white = C('#fbf8f2'), red = C('#e0283a'), dark = C('#16101a'), rope = C('#e2c98f'), yel = C('#ffd34a');

  // ---------- Musket Ball Pile: a wooden tray heaped with iron balls, a powder keg beside it ----------
  {
    const balls = [];
    for (let l = 0; l < 3; l++) { const n = 3 - l; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) balls.push({ s: 'sph', c: [(i - (n - 1) / 2) * 0.13, 0.15 + l * 0.105, (j - (n - 1) / 2) * 0.13], r: 0.068, col: l === 2 ? ironL : iron, k: 0 }); }
    P('smusket', [
      { s: 'box', c: [0, 0.05, 0], hs: [0.24, 0.05, 0.24], rd: 0.02, col: wood, k: 0 },
      { s: 'box', c: [0, 0.09, 0], hs: [0.21, 0.04, 0.21], rd: 0.01, sub: true, k: 0 },
      ...balls,
      { s: 'cyl', ax: 'y', c: [0.33, 0.13, -0.12], r: 0.1, hh: 0.13, rd: 0.03, col: C('#9a6a3a'), k: 0 },
      { s: 'tor', ax: 'y', c: [0.33, 0.19, -0.12], R: 0.1, r: 0.012, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 },
      { s: 'box', c: [0.33, 0.14, -0.02], hs: [0.04, 0.04, 0.005], rd: 0.005, col: dark, k: 0 },
    ], { ao: 0.6 });
  }
  // ---------- Harpoon Gun: a swivel post with a long barrel, a barbed harpoon and a drum of line ----------
  P('sharpoon', [
    { s: 'cyl', ax: 'y', c: [0, 0.08, 0], r: 0.16, hh: 0.08, rd: 0.03, col: iron, k: 0 },
    { s: 'cap', a: [0, 0.12, 0], b: [0, 0.32, 0], r: 0.06, col: ironL, k: 0 },
    { s: 'cap', a: [0, 0.36, -0.3], b: [0, 0.38, 0.38], r: 0.06, r2: 0.05, col: C('#4a6a5a'), k: 0 },
    { s: 'cap', a: [0, 0.38, 0.36], b: [0, 0.39, 0.7], r: 0.018, col: steel, k: 0 },
    { s: 'cap', a: [0, 0.39, 0.68], b: [0, 0.39, 0.84], r: 0.045, r2: 0.003, col: steel, k: 0 },
    ...[1, -1].map(sx => ({ s: 'cap', a: [0, 0.39, 0.74], b: [sx * 0.07, 0.39, 0.66], r: 0.012, r2: 0.003, col: steel, k: 0 })),
    { s: 'cap', a: [0.06, 0.34, -0.32], b: [0.18, 0.28, -0.42], r: 0.025, col: woodD, k: 0 },
    { s: 'cap', a: [-0.06, 0.34, -0.32], b: [-0.18, 0.28, -0.42], r: 0.025, col: woodD, k: 0 },
    { s: 'cyl', ax: 'x', c: [0.16, 0.3, -0.05], r: 0.08, hh: 0.05, rd: 0.02, col: rope, k: 0 },
    { s: 'cyl', ax: 'x', c: [0.16, 0.3, -0.05], r: 0.04, hh: 0.065, rd: 0.01, col: woodD, k: 0 },
  ], { ao: 0.6 });
  // ---------- Battleship Gunner: a grey turret with twin long barrels and a red band ----------
  P('sgunner', [
    { s: 'cyl', ax: 'y', c: [0, 0.07, 0], r: 0.36, hh: 0.07, rd: 0.03, col: C('#6a7484'), k: 0 },
    { s: 'ell', c: [0, 0.16, -0.04], rr: [0.32, 0.2, 0.38], col: C('#8a94a4'), k: 0.02 },
    { s: 'box', c: [0, 0.22, 0.16], hs: [0.24, 0.1, 0.12], rd: 0.05, col: C('#8a94a4'), k: 0.03 },
    ...[1, -1].flatMap(sx => [
      { s: 'cap', a: [sx * 0.09, 0.24, 0.2], b: [sx * 0.09, 0.27, 0.95], r: 0.052, r2: 0.04, col: C('#5a6272'), k: 0 },
      { s: 'tor', ax: 'z', c: [sx * 0.09, 0.27, 0.93], R: 0.045, r: 0.016, a0: -Math.PI, a1: Math.PI, col: C('#3a3f4a'), k: 0 }]),
    { s: 'tor', ax: 'y', c: [0, 0.16, -0.04], R: 0.3, r: 0.025, a0: -Math.PI, a1: Math.PI, col: red, k: 0 },
    { s: 'cap', a: [0.15, 0.35, -0.25], b: [0.15, 0.5, -0.25], r: 0.02, col: C('#3a3f4a'), k: 0 },
  ], { ao: 0.6 });
  // ---------- Anchor Flail: an iron anchor with a ring, stock and flukes ----------
  P('sanchor', [
    { s: 'cap', a: [0, 0.08, 0], b: [0, 0.62, 0], r: 0.05, col: iron, k: 0 },
    { s: 'tor', ax: 'z', c: [0, 0.7, 0], R: 0.07, r: 0.022, a0: -Math.PI, a1: Math.PI, col: ironL, k: 0 },
    { s: 'cap', a: [-0.18, 0.52, 0], b: [0.18, 0.52, 0], r: 0.035, col: woodD, k: 0 },
    { s: 'tor', ax: 'z', c: [0, 0.3, 0], R: 0.26, r: 0.045, a0: -Math.PI + 0.25, a1: -0.25, col: iron, k: 0 },
    ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.27, 0.18, 0], rr: [0.06, 0.1, 0.035], col: iron, k: 0.02 })),
    { s: 'sph', c: [0, 0.05, 0], r: 0.065, col: iron, k: 0.02 },
  ], { ao: 0.5 });
  // ---------- Barrel Mines: a red powder barrel with iron hoops, a white cross and a lit fuse ----------
  P('sbarrel', [
    { s: 'cyl', ax: 'y', c: [0, 0.22, 0], r: 0.2, hh: 0.22, rd: 0.07, col: C('#d0382c'), k: 0 },
    { s: 'ell', c: [0, 0.22, 0], rr: [0.215, 0.14, 0.215], col: C('#d0382c'), k: 0.05 },
    ...[0.07, 0.37].map(y => ({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.2, r: 0.018, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 })),
    { s: 'box', c: [0, 0.22, 0.21], hs: [0.1, 0.022, 0.012], rd: 0.008, col: white, k: 0 },
    { s: 'box', c: [0, 0.22, 0.21], hs: [0.022, 0.1, 0.012], rd: 0.008, col: white, k: 0 },
    { s: 'cap', a: [0, 0.44, 0], b: [0.04, 0.56, 0.02], r: 0.014, col: C('#3a2a1a'), k: 0 },
    { s: 'sph', c: [0.045, 0.58, 0.02], r: 0.03, col: yel, k: 0 },
  ], { ao: 0.5 });
  // ---------- Lighthouse Lamp: a little striped tower with a gallery and a glowing lamp under a red cap ----------
  P('slamp', [
    { s: 'cyl', ax: 'y', c: [0, 0.06, 0], r: 0.2, hh: 0.06, rd: 0.02, col: C('#8a94a4'), k: 0 },
    { s: 'cap', a: [0, 0.1, 0], b: [0, 0.75, 0], r: 0.15, r2: 0.11, col: white, k: 0 },
    ...[0.22, 0.48].map(y => ({ s: 'cyl', ax: 'y', c: [0, y, 0], r: 0.142 - y * 0.05, hh: 0.065, rd: 0.01, col: red, k: 0 })),
    { s: 'cyl', ax: 'y', c: [0, 0.78, 0], r: 0.17, hh: 0.025, rd: 0.01, col: C('#3a3f4a'), k: 0 },
    { s: 'tor', ax: 'y', c: [0, 0.86, 0], R: 0.16, r: 0.012, a0: -Math.PI, a1: Math.PI, col: C('#3a3f4a'), k: 0 },
    { s: 'sph', c: [0, 0.9, 0], r: 0.1, col: C('#fff2a0'), k: 0 },
    { s: 'ell', c: [0, 1.02, 0], rr: [0.13, 0.08, 0.13], col: red, k: 0 },
    { s: 'sph', c: [0, 1.11, 0], r: 0.025, col: C('#3a3f4a'), k: 0 },
  ], { ao: 0.6 });
  // ---------- Fishing Net: a rack post with the folded net and floats; the thrown net is a dome of mesh ----------
  P('snetrack', [
    { s: 'cap', a: [0, 0, 0], b: [0, 0.55, 0], r: 0.04, col: woodD, k: 0 },
    { s: 'cap', a: [-0.2, 0.5, 0], b: [0.2, 0.5, 0], r: 0.03, col: woodD, k: 0 },
    { s: 'ell', c: [0, 0.34, 0.02], rr: [0.24, 0.18, 0.07], col: C('#c8b890'), k: 0.03 },
    ...[-0.16, 0, 0.16].map(x => ({ s: 'sph', c: [x, 0.2, 0.08], r: 0.04, col: C('#ff8a2a'), k: 0 })),
  ], { ao: 0.6 });
  {
    const cord = C('#e8dcb8'), p = [];
    p.push({ s: 'tor', ax: 'y', c: [0, 0, 0], R: 1, r: 0.03, a0: -Math.PI, a1: Math.PI, col: cord, k: 0 });
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; p.push({ s: 'cap', a: [Math.cos(a), 0, Math.sin(a)], b: [Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5], r: 0.025, col: cord, k: 0 }, { s: 'cap', a: [Math.cos(a) * 0.5, 0.45, Math.sin(a) * 0.5], b: [0, 0.55, 0], r: 0.025, col: cord, k: 0 }); }
    p.push({ s: 'tor', ax: 'y', c: [0, 0.28, 0], R: 0.78, r: 0.022, a0: -Math.PI, a1: Math.PI, col: cord, k: 0 }, { s: 'tor', ax: 'y', c: [0, 0.47, 0], R: 0.42, r: 0.022, a0: -Math.PI, a1: Math.PI, col: cord, k: 0 });
    for (let i = 0; i < 8; i++) { const a = (i / 8 + 1 / 16) * TAU; p.push({ s: 'sph', c: [Math.cos(a), 0, Math.sin(a)], r: 0.07, col: C('#ff8a2a'), k: 0 }); }
    P('snet', p, { ao: 0.3 });
  }
  // ---------- Seagull Squadron: a round white gull with grey wings, black tips and a yellow beak ----------
  {
    const m = P('sgull', [
      { s: 'ell', c: [0, 0.5, 0], rr: [0.11, 0.1, 0.2], col: white, k: 0.03 },
      { s: 'sph', c: [0, 0.58, 0.18], r: 0.085, col: white, k: 0.04 },
      { s: 'cap', a: [0, 0.57, 0.25], b: [0, 0.55, 0.36], r: 0.03, r2: 0.012, col: yel, k: 0 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.045, 0.61, 0.24], r: 0.017, col: dark, k: 0 })),
      { s: 'ell', c: [0, 0.5, -0.22], rr: [0.08, 0.025, 0.08], col: C('#c8ced6'), k: 0.02 },
      ...[[1, 3], [-1, 5]].flatMap(([sx, b]) => [
        { s: 'ell', c: [sx * 0.24, 0.53, -0.01], rr: [0.18, 0.025, 0.09], col: C('#c8ced6'), bone: b, k: 0.02 },
        { s: 'ell', c: [sx * 0.42, 0.535, -0.04], rr: [0.08, 0.02, 0.06], col: C('#2a2e38'), bone: b, k: 0.02 }]),
    ], { ao: 0.3 });
    rig(m, { 3: [0.08, 0.53, 0], 5: [-0.08, 0.53, 0] });
  }
  // ---------- Shark Escort: a friendly blue-grey shark with a white belly, a big fin and a toothy grin ----------
  {
    const sk = C('#5a84a8'), belly = C('#eef4f8');
    const m = P('sshark', [
      { s: 'ell', c: [0, 0.0, 0.05], rr: [0.26, 0.24, 0.7], col: sk, k: 0 },
      { s: 'ell', c: [0, -0.07, 0.1], rr: [0.22, 0.17, 0.6], col: belly, k: 0.05 },
      { s: 'cap', a: [0, 0.18, -0.05], b: [0, 0.6, -0.28], r: 0.1, r2: 0.02, col: sk, k: 0.05 },
      ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.3, -0.08, 0.15], rr: [0.18, 0.03, 0.1], col: sk, k: 0.03 })),
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.15, 0.08, 0.55], r: 0.04, col: dark, k: 0 })),
      { s: 'ell', c: [0, -0.06, 0.66], rr: [0.13, 0.03, 0.05], col: C('#7a1a24'), k: 0 },
      ...[-0.08, -0.03, 0.03, 0.08].map(x => ({ s: 'cap', a: [x, -0.04, 0.69], b: [x, -0.08, 0.7], r: 0.012, r2: 0.003, col: white, k: 0 })),
      // the tail on its own bone
      { s: 'cap', a: [0, 0.0, -0.55], b: [0, 0.02, -0.85], r: 0.11, r2: 0.05, col: sk, bone: 7, k: 0.04 },
      { s: 'cap', a: [0, 0.02, -0.82], b: [0, 0.3, -1.0], r: 0.05, r2: 0.015, col: sk, bone: 7, k: 0.03 },
      { s: 'cap', a: [0, 0.0, -0.82], b: [0, -0.2, -0.95], r: 0.045, r2: 0.015, col: sk, bone: 7, k: 0.03 },
    ], { ao: 0.4 });
    rig(m, { 0: [0, 0, 0], 7: [0, 0, -0.55] });
  }
  // ---------- Water Cannon: a red pressure tank on a swivel with a long brass nozzle ----------
  P('shose', [
    { s: 'cyl', ax: 'y', c: [0, 0.07, 0], r: 0.15, hh: 0.07, rd: 0.03, col: C('#3a3f4a'), k: 0 },
    { s: 'cap', a: [0, 0.28, -0.22], b: [0, 0.28, 0.12], r: 0.13, col: red, k: 0 },
    { s: 'cap', a: [0, 0.3, 0.12], b: [0, 0.34, 0.6], r: 0.05, r2: 0.035, col: brass, k: 0.02 },
    { s: 'tor', ax: 'z', c: [0, 0.34, 0.6], R: 0.04, r: 0.015, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 },
    { s: 'cyl', ax: 'z', c: [0, 0.28, -0.05], r: 0.135, hh: 0.02, rd: 0.005, col: white, k: 0 },
    { s: 'cyl', ax: 'y', c: [0.1, 0.43, -0.1], r: 0.05, hh: 0.015, rd: 0.005, col: C('#f4f4f4'), k: 0 },
  ], { ao: 0.6 });
  // ---------- Goo Figurehead: a gold-framed blob leaning out over the waves, arms swept back (takes the blob's color) ----------
  P('sfigure', [
    { s: 'ell', c: [0, 0.0, -0.05], rr: [0.18, 0.12, 0.22], col: brass, k: 0 },
    { s: 'ell', c: [0, 0.22, 0.12], rr: [0.2, 0.26, 0.18], k: 0.08 },
    { s: 'sph', c: [0, 0.5, 0.3], r: 0.17, k: 0.08 },
    ...[1, -1].flatMap(sx => [
      { s: 'cap', a: [sx * 0.15, 0.36, 0.12], b: [sx * 0.32, 0.38, -0.12], r: 0.06, r2: 0.05, k: 0.05 },
      { s: 'sph', c: [sx * 0.34, 0.38, -0.16], r: 0.07, k: 0.03 }]),
    ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.06, 0.55, 0.44], r: 0.03, col: dark, k: 0 })),
    { s: 'tor', ax: 'y', c: [0, 0.65, 0.3], R: 0.12, r: 0.025, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 },
  ], { ao: 0.4 });
  // ---------- Fortifications: a riveted iron plate with a big spike pointing out (+x) ----------
  P('sfort', [
    { s: 'box', c: [0, 0, 0], hs: [0.03, 0.17, 0.26], rd: 0.02, col: C('#6a7484'), k: 0 },
    ...[[-0.11, -0.18], [-0.11, 0.18], [0.11, -0.18], [0.11, 0.18]].map(([y, z]) => ({ s: 'sph', c: [0.03, y, z], r: 0.022, col: steel, k: 0 })),
    { s: 'cap', a: [0.03, 0, 0], b: [0.32, 0.02, 0], r: 0.07, r2: 0.005, col: C('#c8d0da'), k: 0 },
  ], { ao: 0.5 });
  // ---------- Propellers: an outboard motor on the stern, its propeller turning (bone 1) ----------
  {
    const m = P('sprop', [
      { s: 'box', c: [0, 0.35, -0.08], hs: [0.15, 0.2, 0.17], rd: 0.08, col: red, k: 0 },
      { s: 'box', c: [0, 0.52, -0.08], hs: [0.152, 0.035, 0.172], rd: 0.03, col: C('#2a2e38'), k: 0 },
      { s: 'cap', a: [0, 0.18, -0.1], b: [0, -0.15, -0.1], r: 0.05, col: C('#3a3f4a'), k: 0 },
      { s: 'cap', a: [0, 0.4, 0.05], b: [0, 0.38, 0.4], r: 0.02, col: C('#3a3f4a'), k: 0 },
      { s: 'sph', c: [0, -0.12, -0.2], r: 0.05, col: brass, bone: 1, k: 0 },
      ...[0, 1, 2].map(i => { const a = i / 3 * TAU; return { s: 'cap', a: [0, -0.12, -0.21], b: [Math.cos(a) * 0.17, -0.12 + Math.sin(a) * 0.17, -0.21], r: 0.045, r2: 0.025, col: brass, bone: 1, k: 0.02 }; }),
    ], { ao: 0.6 });
    rig(m, { 1: [0, -0.12, -0.2] });
  }
  // ---------- Repair Crew: a little goo sailor in a white cap with a hammer (body takes the blob's color) ----------
  {
    const o = { ...STICK, hipY: 0.3, shY: 0.5, headY: 0.68, headR: 0.15, shW: 0.1, hipW: 0.06, upperLen: 0.1, foreLen: 0.1, pelvisR: 0.13, torso: 'ell', torsoRR: [0.15, 0.16, 0.13], neckR: 0.09, armR: 0.045, handR: 0.05, legR: 0.05, k: 0.06 };
    const m = makeHumanoid(o), hd = m.J.head;
    for (const p of m.parts) delete p.col;
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.12, hd[2]], r: 0.12, hh: 0.035, rd: 0.02, col: white, bone: 2, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.08, hd[2]], r: 0.135, hh: 0.02, rd: 0.01, col: C('#2f5fb8'), bone: 2, k: 0 });
    for (const sx of [1, -1]) m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.05, hd[1] + 0.01, hd[2] + 0.13], r: 0.025, col: dark, bone: 2, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [0, 0.45, 0], R: 0.13, r: 0.02, a0: -Math.PI, a1: Math.PI, col: C('#2f5fb8'), bone: 1, k: 0 });
    const h = m.J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1], h[2] - 0.04], b: [h[0], h[1], h[2] + 0.18], r: 0.018, col: woodD, bone: 6, k: 0 });
    m.parts.push({ s: 'box', c: [h[0], h[1], h[2] + 0.2], hs: [0.03, 0.08, 0.035], rd: 0.01, col: C('#5a6270'), bone: 6, k: 0 });
    m.name = 'screw'; m.runAmp = 1.2;
    defs.screw = m;
  }
  // ---------- Gust Sails: a mast with a billowing sail painted with a wind swirl, and a pennant ----------
  P('ssail', [
    { s: 'cap', a: [0, 0, 0], b: [0, 1.75, 0], r: 0.05, r2: 0.035, col: woodD, k: 0 },
    { s: 'cap', a: [-0.5, 1.5, 0.02], b: [0.5, 1.5, 0.02], r: 0.03, col: woodD, k: 0 },
    { s: 'cap', a: [-0.45, 0.55, 0.02], b: [0.45, 0.55, 0.02], r: 0.03, col: woodD, k: 0 },
    { s: 'ell', c: [0, 1.02, 0.05], rr: [0.5, 0.46, 0.2], col: C('#f6fbff'), k: 0 },
    { s: 'ell', c: [0, 1.02, 0.0], rr: [0.5, 0.46, 0.17], sub: true, k: 0 },
    { s: 'box', c: [0, 1.02, -0.17], hs: [1, 1, 0.17], sub: true, k: 0 },
    { s: 'tor', ax: 'z', c: [0, 1.04, 0.19], R: 0.16, r: 0.025, a0: -0.4, a1: 3.6, col: C('#35b8e8'), k: 0 },
    { s: 'tor', ax: 'z', c: [0.05, 1.0, 0.2], R: 0.07, r: 0.022, a0: 0.5, a1: 4.4, col: C('#35b8e8'), k: 0 },
    { s: 'box', c: [0, 1.82, -0.15], hs: [0.012, 0.06, 0.16], rd: 0.008, col: C('#35b8e8'), k: 0 },
  ], { ao: 0.4 });
}
