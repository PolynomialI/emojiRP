// ============================================================
// Chapter 10, the Wild West town: false-front buildings, the town square, ranch props, the town's creatures
// (bison, mule, horse, rattlesnake, gunslinger) and The Outlaw. Built with prop() like 04a-04c.
// Buildings are one unit wide with their front at +z: the camera sees +z faces, so every front faces it.
// Four-legged creatures and the snake get their own bone pivots (rig) and poses (quadRun, snakeRun... below).
// ============================================================
Object.assign(THEME_CLIPS, { bison: ['run', 'slam'], mule: ['run', 'slam'], horse: ['run'], snake: ['run', 'throw'], gunslinger: ['run', 'aim'], outlaw: ['run', 'aim', 'throw', 'idle'] });
Object.assign(THEME_CELLS, { saloon: 0.02, bank: 0.017, sheriff: 0.02, store: 0.02, hotel: 0.02, barn: 0.02, church: 0.018,
  watertower: 0.02, gazebo: 0.02, well: 0.02, oillamp: 0.016, haybale: 0.025, wagon: 0.02, trough: 0.022, railfence: 0.022, dynamite: 0.012,
  bison: 0.017, mule: 0.016, horse: 0.016, snake: 0.014, gunslinger: 0.015, outlaw: 0.015 });
MESH_ORDER.push('saloon', 'bank', 'sheriff', 'store', 'hotel', 'barn', 'church', 'watertower', 'gazebo', 'well', 'oillamp',
  'haybale', 'wagon', 'trough', 'railfence', 'dynamite', 'snake', 'horse', 'gunslinger', 'mule', 'bison', 'outlaw');

// move a prop model's bone pivots (bone index -> [x, y, z]) so its parts can swing like legs
function rig(m, piv) { for (const b in piv) m.bones[b].p = piv[b]; return m; }

// ---------- poses for the rigged creatures (called from CLIPS in 04-models.js) ----------
// four legs: 3/4 front left, 5/6 front right, 7/8 back left, 9/10 back right; diagonal pairs swing together
function quadRun(t, m) {
  const ph = t * TAU, s = Math.sin(ph), c = Math.cos(ph), A = m.runAmp || 1;
  return { root: [0, 0.025 * Math.abs(Math.sin(ph)) * A, 0], rot: [
    [0.04 * Math.sin(2 * ph) * A, 0, 0], [0, 0, 0], [-0.1 * Math.sin(2 * ph + 0.6) * A, 0.05 * s, 0],
    [0.55 * s * A, 0, 0], [0.8 * Math.max(0, -c) * A, 0, 0], [-0.55 * s * A, 0, 0], [0.8 * Math.max(0, c) * A, 0, 0],
    [-0.55 * s * A, 0, 0], [0.6 * Math.max(0, c) * A, 0, 0], [0.55 * s * A, 0, 0], [0.6 * Math.max(0, -c) * A, 0, 0],
  ] };
}
// rears up on its back legs, front hooves pawing, then stamps down (the body pivots on its hips)
function quadBuck(t) {
  const up = smoothstep(0, 0.55, t), down = smoothstep(0.55, 0.68, t), rec = 1 - smoothstep(0.8, 1, t);
  const pitch = (-0.55 * up + 0.6 * down) * rec, paw = (1.1 * up - 1.2 * down) * rec, fold = 1.0 * up * (1 - down) * rec;
  return { root: [0, 0, 0], rot: [[pitch, 0, 0], [0, 0, 0], [-pitch * 0.6, 0, 0],
    [-paw + Math.sin(t * TAU * 3) * 0.3 * up * (1 - down), 0, 0], [fold, 0, 0], [-paw * 0.85, 0, 0], [fold, 0, 0],
    [-pitch, 0, 0], [0, 0, 0], [-pitch, 0, 0], [0, 0, 0]] };
}
// a snake is a chain: tail tip 8 <- 7 <- 0 (middle) -> 1 (neck) -> 2 (head); each link swings side to side a little later
function snakeRun(t) {
  const ph = t * TAU, a0 = 0.22 * Math.sin(ph), a1 = 0.32 * Math.sin(ph + 1.2), a2 = 0.12 * Math.sin(ph + 2.4);
  const a7 = 0.36 * Math.sin(ph - 1.2), a8 = 0.5 * Math.sin(ph - 2.4);
  const r = Array.from({ length: NBONES }, () => [0, 0, 0]);
  r[0] = [0, a0, 0]; r[1] = [0, a1 - a0, 0]; r[2] = [0, a2 - a1, 0]; r[7] = [0, a7 - a0, 0]; r[8] = [0.12 * Math.sin(ph * 6), a8 - a7, 0];
  return { root: [0, 0, 0], rot: r };
}
// coils back with the rattle going, then strikes
function snakeStrike(t) {
  const back = smoothstep(0, 0.55, t), fwd = smoothstep(0.55, 0.7, t), k = 1 - smoothstep(0.75, 1, t);
  const r = Array.from({ length: NBONES }, () => [0, 0, 0]);
  r[1] = [(-0.55 * back + 0.75 * fwd) * k, 0, 0]; r[2] = [(0.35 * back - 0.45 * fwd) * k, 0, 0];
  r[7] = [0, 0.35 * Math.sin(t * TAU * 3) * back * k, 0]; r[8] = [0.25 * Math.sin(t * TAU * 12) * k, 0.3 * Math.sin(t * TAU * 6) * k, 0];
  return { root: [0, 0, (-0.06 * back + 0.12 * fwd) * k], rot: r };
}
// gun hands: the right arm comes up level and kicks with the shot (m.gun 2: both arms, a revolver in each)
function gunAim(t, m) {
  const up = smoothstep(0, 0.35, t), kick = Math.sin(clamp((t - 0.78) / 0.22, 0, 1) * Math.PI) * 0.35, two = m.gun === 2;
  return { root: [0, -0.015 * up, 0], rot: [[0, -0.12 * up, 0], [0.05, -0.08 * up, 0], [-0.06, 0.1 * up, 0],
    two ? [-1.5 * up - kick, 0, 0.16] : [-0.3 * up, 0, 0.2], [two ? -0.06 : -1.0 * up, 0, 0],
    [-1.52 * up - kick, 0.08, -0.12], [-0.06, 0, 0],
    [-0.12, 0, 0.06], [0.16, 0, 0], [0.1, 0, -0.06], [0.1, 0, 0]] };
}

function westModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const wood = C('#a8703e'), woodD = C('#6e4626'), woodL = C('#d4a066'), plank = C('#8a6040'), roof = C('#5a3c2c'), trim = C('#f4ead6');
  const glass = C('#2c3a52'), lit = C('#ffd27a'), dark = C('#1c140e'), gold = C('#ffc93a'), brick = C('#a4523a'), stoneD = C('#b8a888');
  const green = C('#3f6e4c'), red = C('#b33a2e'), tin = C('#9aa0a8'), white = C('#f6f1e6'), hay = C('#e8c35a'), hayD = C('#b8902e');
  const canvas = C('#efe4cc'), iron = C('#3a3a42'), cream = C('#fff0cc'), signRed = C('#7a2a20'), water = C('#3a6a8a');
  const box = (c, hs, col, rd = 0.006, k = 0) => ({ s: 'box', c, hs, rd, col, k });
  // corrugated tin: light ribs running front to back over a roof plate at height y
  const tinRoof = (y, z, hd, hw = 0.47, col = C('#b8bcc0')) => Array.from({ length: 9 }, (_, i) => box([-hw + 0.04 + i * (hw * 2 - 0.08) / 8, y + 0.012, z], [0.014, 0.006, hd], col, 0.003));
  // a framed window (lit: warm light inside); z is the wall face
  const win = (x, y, z, w, h, o = {}) => {
    const out = [box([x, y, z], [w + 0.014, h + 0.014, 0.01], o.frame || trim, 0.004), box([x, y, z + 0.008], [w, h, 0.008], o.lit ? lit : glass, 0.003)];
    if (o.shut) for (const sx of [1, -1]) out.push(box([x + sx * (w + 0.034), y, z + 0.004], [0.02, h + 0.008, 0.008], o.shut, 0.003));
    return out;
  };
  // signboard "lettering": a row of little blocks
  const letters = (x0, x1, y, z, n, col, hh = 0.02) => Array.from({ length: n }, (_, i) => box([lerp(x0, x1, n > 1 ? i / (n - 1) : 0.5), y, z], [(x1 - x0) / n * 0.32, hh, 0.006], col, 0.003));
  // boardwalk across the front with posts holding a porch roof or balcony
  const porch = (z0, z1, top, xs, roofCol) => {
    const out = [box([0, 0.018, (z0 + z1) / 2], [0.5, 0.018, (z1 - z0) / 2], plank, 0.004)];
    for (const x of xs) out.push({ s: 'cap', a: [x, 0.03, z1 - 0.018], b: [x, top, z1 - 0.018], r: 0.017, col: woodD, k: 0 });
    if (roofCol) out.push(box([0, top + 0.01, (z0 + z1) / 2 + 0.01], [0.505, 0.012, (z1 - z0) / 2 + 0.012], roofCol, 0.004));
    return out;
  };

  // ---------- the saloon: two floors, a balcony, batwing doors and a big red sign up on the false front ----------
  P('saloon', [
    box([0, 0.27, -0.08], [0.48, 0.27, 0.28], null, 0.008, 0.01),
    box([0, 0.37, 0.215], [0.5, 0.37, 0.016], null, 0.006),
    box([0, 0.745, 0.215], [0.51, 0.014, 0.03], trim),
    box([0, 0.79, 0.215], [0.22, 0.04, 0.016], null),
    { s: 'gable', c: [0, 0.83, 0.215], w: 0.14, h: 0.07, hh: 0.016, ax: 'z', col: trim, k: 0 },
    box([0, 0.64, 0.232], [0.39, 0.07, 0.006], gold), box([0, 0.64, 0.24], [0.37, 0.055, 0.006], signRed),
    ...letters(-0.26, 0.26, 0.64, 0.248, 6, cream, 0.028),
    box([0, 0.56, -0.08], [0.47, 0.012, 0.27], C('#8a8f96')), ...tinRoof(0.56, -0.08, 0.26),
    box([0.3, 0.62, -0.22], [0.04, 0.06, 0.04], brick), { s: 'cyl', ax: 'y', c: [-0.05, 0.62, -0.28], r: 0.05, hh: 0.05, rd: 0.015, col: wood, k: 0 }, { s: 'cyl', ax: 'y', c: [-0.25, 0.63, -0.25], r: 0.022, hh: 0.07, rd: 0.005, col: iron, k: 0 },
    // corner boards
    ...[1, -1].map(sx => box([sx * 0.49, 0.37, 0.215], [0.014, 0.37, 0.02], trim)),
    // ground floor: batwing doors in a dark doorway, lit windows, lanterns
    box([0, 0.11, 0.232], [0.085, 0.11, 0.006], dark), ...[1, -1].map(sx => box([sx * 0.043, 0.1, 0.24], [0.038, 0.05, 0.006], woodL)),
    ...win(0.29, 0.13, 0.232, 0.1, 0.07, { lit: true }), ...win(-0.29, 0.13, 0.232, 0.1, 0.07, { lit: true }),
    ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.15, 0.2, 0.25], r: 0.02, col: lit, k: 0 })),
    // upper floor behind the balcony
    ...[-0.3, 0, 0.3].flatMap(x => win(x, 0.44, 0.232, 0.055, 0.065, { shut: green, lit: x === 0 })),
    // balcony over the boardwalk
    ...porch(0.23, 0.36, 0.3, [-0.47, -0.16, 0.16, 0.47]),
    box([0, 0.31, 0.3], [0.5, 0.013, 0.075], wood), box([0, 0.36, 0.36], [0.5, 0.04, 0.012], woodD, 0.005),
    box([0, 0.405, 0.36], [0.505, 0.008, 0.016], woodL),
    // a hitching rail out front
    { s: 'cap', a: [-0.4, 0.09, 0.42], b: [-0.18, 0.09, 0.42], r: 0.012, col: woodD, k: 0 },
    ...[-0.4, -0.18].map(x => ({ s: 'cap', a: [x, 0, 0.42], b: [x, 0.1, 0.42], r: 0.014, col: woodD, k: 0 })),
  ], { ao: 3 });

  // ---------- the bank: a sandstone hall with a white column portico, a clock in the pediment and a gold $ on the roof ----------
  {
    const parts = [
      box([0, 0.3, -0.06], [0.47, 0.3, 0.28], null, 0.01, 0.01),
      box([0, 0.025, 0.02], [0.49, 0.025, 0.34], stoneD, 0.006),
      box([0, 0.012, 0.335], [0.22, 0.012, 0.035], stoneD), box([0, 0.036, 0.315], [0.2, 0.012, 0.03], stoneD),
      // portico: four columns, entablature with gilt lettering, a pediment with a clock
      ...[-0.27, -0.09, 0.09, 0.27].flatMap(x => [
        { s: 'cyl', ax: 'y', c: [x, 0.3, 0.29], r: 0.032, hh: 0.25, rd: 0.01, col: white, k: 0 },
        box([x, 0.555, 0.29], [0.046, 0.014, 0.046], white, 0.004), box([x, 0.062, 0.29], [0.044, 0.012, 0.044], white, 0.004),
      ]),
      box([0, 0.59, 0.275], [0.37, 0.026, 0.065], white, 0.006),
      ...letters(-0.2, 0.2, 0.59, 0.342, 4, gold, 0.013),
      { s: 'gable', c: [0, 0.615, 0.275], w: 0.39, h: 0.13, hh: 0.06, ax: 'z', col: white, k: 0 },
      { s: 'cyl', ax: 'z', c: [0, 0.665, 0.337], r: 0.045, hh: 0.008, rd: 0.004, col: cream, k: 0 },
      { s: 'tor', ax: 'z', c: [0, 0.665, 0.345], R: 0.046, r: 0.008, a0: -Math.PI, a1: Math.PI, col: gold, k: 0 },
      box([0, 0.678, 0.347], [0.004, 0.022, 0.004], dark, 0.002), box([0.012, 0.665, 0.347], [0.016, 0.004, 0.004], dark, 0.002),
      // the facade: heavy doors, barred windows, a flat roof with a parapet
      box([0, 0.17, 0.225], [0.07, 0.12, 0.008], woodD), box([0, 0.3, 0.225], [0.075, 0.012, 0.01], gold),
      { s: 'sph', c: [0.03, 0.16, 0.236], r: 0.008, col: gold, k: 0 }, { s: 'sph', c: [-0.03, 0.16, 0.236], r: 0.008, col: gold, k: 0 },
      ...[-0.39, 0.39].flatMap(x => [...win(x, 0.2, 0.222, 0.045, 0.075, { frame: stoneD }), ...win(x, 0.45, 0.222, 0.045, 0.06, { frame: stoneD })]),
      ...[-0.39, 0.39].flatMap(x => [-0.025, 0, 0.025].map(dx => box([x + dx, 0.2, 0.236], [0.005, 0.075, 0.004], iron, 0.002))),
      box([0, 0.615, -0.06], [0.48, 0.016, 0.29], C('#8a7a66')), box([-0.2, 0.63, -0.15], [0.1, 0.012, 0.08], C('#9ac8e8'), 0.006), box([-0.2, 0.632, -0.15], [0.105, 0.008, 0.012], iron, 0.002),
      box([0, 0.64, -0.06], [0.48, 0.02, 0.29], null, 0.004), box([0, 0.66, -0.06], [0.45, 0.02, 0.26], C('#7a6a58'), 0.004),
      // gas lamps by the steps
      ...[1, -1].flatMap(sx => [{ s: 'cap', a: [sx * 0.24, 0.04, 0.4], b: [sx * 0.24, 0.26, 0.4], r: 0.01, col: iron, k: 0 }, { s: 'sph', c: [sx * 0.24, 0.28, 0.4], r: 0.022, col: lit, k: 0 }]),
    ];
    // the gold $: two arcs of an S and a bar through it, standing on the roof
    const yc = 0.84, zc = 0.1, R = 0.055, rr = 0.019;
    parts.push({ s: 'tor', ax: 'z', c: [0, yc + R, zc], R, r: rr, a0: 0.15 * Math.PI, a1: Math.PI, col: gold, k: 0 });
    parts.push({ s: 'tor', ax: 'z', c: [0, yc + R, zc], R, r: rr, a0: -Math.PI, a1: -0.5 * Math.PI, col: gold, k: 0 });
    parts.push({ s: 'tor', ax: 'z', c: [0, yc - R, zc], R, r: rr, a0: -0.85 * Math.PI, a1: 0.5 * Math.PI, col: gold, k: 0 });
    parts.push({ s: 'cap', a: [0, yc - 0.15, zc], b: [0, yc + 0.15, zc], r: 0.014, col: gold, k: 0 });
    parts.push(box([0, 0.69, zc], [0.03, 0.02, 0.03], iron));
    P('bank', parts, { ao: 3 });
  }

  // ---------- the sheriff's office: one floor, a tin porch roof, a barred window and a big gold star ----------
  {
    const star = [];
    for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * TAU / 5; star.push({ s: 'cap', a: [0, 0.4, 0.29], b: [Math.cos(a) * 0.085, 0.4 + Math.sin(a) * 0.085, 0.29], r: 0.026, r2: 0.007, col: gold, k: 0.01 }); }
    P('sheriff', [
      box([0, 0.23, -0.08], [0.48, 0.23, 0.32], null, 0.008, 0.01),
      box([0, 0.3, 0.255], [0.5, 0.3, 0.016], null),
      box([0, 0.62, 0.255], [0.32, 0.03, 0.016], null), box([0, 0.605, 0.255], [0.51, 0.012, 0.028], trim), box([0, 0.655, 0.255], [0.33, 0.01, 0.028], trim),
      box([0, 0.52, 0.275], [0.38, 0.055, 0.006], woodD), ...letters(-0.27, 0.27, 0.52, 0.283, 7, cream, 0.026),
      ...star, { s: 'sph', c: [0, 0.4, 0.29], r: 0.036, col: gold, k: 0.01 },
      box([-0.2, 0.13, 0.272], [0.07, 0.13, 0.006], woodD), { s: 'sph', c: [-0.15, 0.13, 0.282], r: 0.008, col: gold, k: 0 },
      ...win(0.22, 0.17, 0.272, 0.11, 0.075, { frame: woodD }),
      ...[-0.06, -0.02, 0.02, 0.06].map(dx => box([0.22 + dx, 0.17, 0.288], [0.006, 0.075, 0.004], iron, 0.002)),
      box([-0.37, 0.19, 0.274], [0.04, 0.05, 0.004], C('#f0e0b8'), 0.002), box([-0.37, 0.19, 0.279], [0.022, 0.02, 0.003], C('#7a5a3a'), 0.002),
      ...porch(0.27, 0.42, 0.29, [-0.47, -0.05, 0.47], tin),
      box([0, 0.47, -0.08], [0.47, 0.012, 0.31], C('#7a7f86')), ...tinRoof(0.47, -0.08, 0.3, 0.47, C('#a8b0b4')),
      { s: 'cyl', ax: 'y', c: [0.3, 0.53, -0.25], r: 0.022, hh: 0.06, rd: 0.005, col: iron, k: 0 },
      ...[1, -1].map(sx => box([sx * 0.49, 0.3, 0.255], [0.014, 0.3, 0.02], trim)),
    ], { ao: 3 });
  }

  // ---------- the general store: a gable roof behind the false front, a striped awning and goods on the porch ----------
  {
    const parts = [
      box([0, 0.23, -0.08], [0.48, 0.23, 0.3], null, 0.008, 0.01),
      { s: 'gable', c: [0, 0.46, -0.08], w: 0.5, h: 0.17, hh: 0.31, ax: 'z', col: C('#4f8a6a'), k: 0 },
      { s: 'cap', a: [0, 0.632, -0.39], b: [0, 0.632, 0.22], r: 0.016, col: C('#d8d8c8'), k: 0 },
      box([0.22, 0.62, -0.25], [0.035, 0.08, 0.035], brick),
      box([0, 0.33, 0.235], [0.5, 0.33, 0.016], null),
      box([0, 0.665, 0.235], [0.51, 0.012, 0.028], trim), ...[1, -1].map(sx => box([sx * 0.49, 0.33, 0.235], [0.014, 0.33, 0.02], trim)),
      box([0, 0.55, 0.255], [0.41, 0.065, 0.006], cream), box([0, 0.55, 0.25], [0.425, 0.08, 0.006], woodD), ...letters(-0.3, 0.3, 0.55, 0.263, 8, C('#3a2a1e'), 0.03),
      ...win(0.27, 0.15, 0.252, 0.14, 0.1, { lit: true }), ...win(-0.27, 0.15, 0.252, 0.14, 0.1, { lit: true }),
      box([0, 0.14, 0.252], [0.06, 0.14, 0.006], woodD), box([0, 0.17, 0.26], [0.04, 0.07, 0.004], glass),
      ...porch(0.25, 0.4, 0.3, [-0.47, 0.47]),
    ];
    // the awning: red and cream stripes with a scalloped edge
    for (let i = 0; i < 8; i++) {
      const x = -0.4375 + i * 0.125, col = i % 2 ? cream : red;
      parts.push(box([x, 0.31, 0.33], [0.0625, 0.012, 0.085], col, 0.003));
      parts.push({ s: 'ell', c: [x, 0.295, 0.415], rr: [0.06, 0.025, 0.012], col, k: 0 });
    }
    // barrels, crates and a sack on the boardwalk
    parts.push({ s: 'cyl', ax: 'y', c: [-0.42, 0.09, 0.34], r: 0.045, hh: 0.055, rd: 0.012, col: wood, k: 0 }, { s: 'tor', ax: 'y', c: [-0.42, 0.11, 0.34], R: 0.046, r: 0.006, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 });
    parts.push({ s: 'cyl', ax: 'y', c: [-0.32, 0.09, 0.36], r: 0.042, hh: 0.055, rd: 0.012, col: woodD, k: 0 });
    parts.push(box([0.38, 0.08, 0.34], [0.045, 0.045, 0.045], woodL, 0.006), box([0.42, 0.16, 0.35], [0.035, 0.035, 0.035], wood, 0.006));
    parts.push({ s: 'ell', c: [0.28, 0.08, 0.36], rr: [0.05, 0.06, 0.04], col: C('#c8a878'), k: 0.01 });
    P('store', parts, { ao: 3 });
  }

  // ---------- the hotel: three floors of shuttered windows, a balcony, a cornice and a tall corner sign ----------
  {
    const parts = [
      box([0, 0.43, -0.08], [0.48, 0.43, 0.29], null, 0.008, 0.01),
      box([0, 0.87, 0.215], [0.505, 0.022, 0.03], trim, 0.005), box([0, 0.905, 0.2], [0.5, 0.025, 0.014], null),
      ...[1, -1].map(sx => box([sx * 0.48, 0.875, -0.08], [0.02, 0.02, 0.3], null, 0.004)), box([0, 0.875, -0.37], [0.48, 0.02, 0.02], null, 0.004),
      box([0, 0.86, -0.08], [0.47, 0.01, 0.28], C('#6a5a4e')),
      { s: 'cyl', ax: 'y', c: [-0.24, 0.95, -0.18], r: 0.11, hh: 0.08, rd: 0.02, col: wood, k: 0 }, { s: 'tor', ax: 'y', c: [-0.24, 0.95, -0.18], R: 0.112, r: 0.008, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 },
      ...[-0.31, -0.17].map(x => ({ s: 'cap', a: [x, 0.86, -0.25], b: [x, 0.87, -0.11], r: 0.012, col: woodD, k: 0 })),
      box([0.25, 0.92, -0.25], [0.04, 0.06, 0.035], brick), box([0.1, 0.92, -0.3], [0.04, 0.06, 0.035], brick),
      ...[0.3, 0.59].map(y => box([0, y, 0.212], [0.49, 0.008, 0.006], trim, 0.002)),
      box([0, 0.13, 0.212], [0.07, 0.13, 0.006], dark), box([0, 0.27, 0.215], [0.08, 0.012, 0.008], trim),
      ...win(0.3, 0.14, 0.212, 0.08, 0.07, { lit: true }), ...win(-0.3, 0.14, 0.212, 0.08, 0.07, { lit: true }),
      ...porch(0.21, 0.35, 0.29, [-0.47, -0.16, 0.16, 0.47]),
      box([0, 0.3, 0.285], [0.5, 0.012, 0.07], wood), box([0, 0.35, 0.345], [0.5, 0.04, 0.012], woodD, 0.005), box([0, 0.395, 0.345], [0.505, 0.008, 0.016], woodL),
      // the corner sign, letters stacked down it
      box([0.43, 0.62, 0.27], [0.014, 0.2, 0.05], signRed, 0.004), box([0.43, 0.62, 0.27], [0.01, 0.21, 0.056], gold, 0.004),
      ...[0, 1, 2, 3, 4].map(i => box([0.444, 0.76 - i * 0.07, 0.27], [0.004, 0.022, 0.026], cream, 0.002)),
      box([0.43, 0.6, 0.2], [0.01, 0.01, 0.04], iron),
    ];
    for (const [y, row] of [[0.45, 0], [0.73, 1]]) for (const x of [-0.33, -0.11, 0.11, 0.33]) {
      if (row === 1 && x > 0.3) continue;
      parts.push(...win(x, y, 0.212, 0.048, 0.07, { shut: row ? C('#3a5a8a') : green, lit: (x * 7 + row * 3) % 2 > 0.6 }));
    }
    P('hotel', parts, { ao: 3 });
  }

  // ---------- the livery stable: a red barn, white-trimmed X doors, a hayloft with a pulley ----------
  P('barn', [
    box([0, 0.21, -0.06], [0.47, 0.21, 0.36], null, 0.008, 0.01),
    { s: 'gable', c: [0, 0.41, -0.06], w: 0.53, h: 0.33, hh: 0.39, ax: 'z', col: C('#4a3a36'), k: 0 },
    { s: 'gable', c: [0, 0.42, 0.33], w: 0.46, h: 0.28, hh: 0.012, ax: 'z', col: null, k: 0 },
    ...[1, -1].map(sx => box([sx * 0.465, 0.21, 0.3], [0.016, 0.21, 0.016], white)),
    box([0, 0.415, 0.32], [0.47, 0.012, 0.014], white),
    // the big doors
    box([0, 0.15, 0.31], [0.19, 0.155, 0.006], white), box([0, 0.145, 0.318], [0.175, 0.14, 0.006], C('#8a2a22')),
    box([0, 0.145, 0.326], [0.006, 0.14, 0.004], white, 0.002),
    ...[1, -1].flatMap(sx => [{ s: 'cap', a: [sx * 0.165, 0.015, 0.326], b: [sx * 0.012, 0.275, 0.326], r: 0.011, col: white, k: 0 }, { s: 'cap', a: [sx * 0.012, 0.015, 0.326], b: [sx * 0.165, 0.275, 0.326], r: 0.011, col: white, k: 0 }]),
    // hayloft door with straw spilling out, a pulley beam and a dangling rope
    box([0, 0.5, 0.336], [0.085, 0.07, 0.006], white), box([0, 0.5, 0.342], [0.07, 0.058, 0.006], dark),
    { s: 'ell', c: [0, 0.455, 0.35], rr: [0.065, 0.02, 0.025], col: hay, k: 0.01 }, { s: 'ell', c: [0.03, 0.47, 0.345], rr: [0.03, 0.025, 0.02], col: hayD, k: 0.01 },
    box([0, 0.66, 0.37], [0.014, 0.014, 0.07], woodD, 0.004), { s: 'cap', a: [0, 0.65, 0.43], b: [0, 0.5, 0.43], r: 0.006, col: C('#c8b088'), k: 0 },
    // a horseshoe over the door and a weathervane
    { s: 'tor', ax: 'z', c: [0, 0.34, 0.33], R: 0.025, r: 0.008, a0: -Math.PI, a1: 0, col: iron, k: 0 },
    // a cupola on the ridge with a little roof and a weathervane
    box([0, 0.76, -0.06], [0.07, 0.06, 0.07], null, 0.006), box([0, 0.76, -0.06], [0.072, 0.03, 0.072], white, 0.004),
    { s: 'gable', c: [0, 0.82, -0.06], w: 0.1, h: 0.06, hh: 0.09, ax: 'z', col: C('#4a3a36'), k: 0 },
    { s: 'cap', a: [0, 0.87, -0.06], b: [0, 0.96, -0.06], r: 0.008, col: iron, k: 0 }, { s: 'ell', c: [0.02, 0.95, -0.06], rr: [0.05, 0.016, 0.008], col: iron, k: 0 },
  ], { ao: 3 });

  // ---------- the chapel: a white nave, a bell tower over the door with a round window, a spire and a gold cross ----------
  P('church', [
    box([0, 0.25, -0.14], [0.4, 0.25, 0.48], null, 0.008, 0.01),
    { s: 'gable', c: [0, 0.48, -0.14], w: 0.46, h: 0.3, hh: 0.51, ax: 'z', col: C('#4a3a40'), k: 0 },
    { s: 'gable', c: [0, 0.49, 0.36], w: 0.41, h: 0.26, hh: 0.012, ax: 'z', col: null, k: 0 },
    ...[1, -1].flatMap(sx => [-0.42, -0.14, 0.14].map(z => box([sx * 0.402, 0.28, z], [0.006, 0.09, 0.038], C('#6a8ad8'), 0.004))),
    // the tower
    box([0, 0.5, 0.44], [0.13, 0.5, 0.11], null, 0.006),
    box([0, 0.99, 0.44], [0.145, 0.1, 0.125], null, 0.008), box([0, 1.09, 0.44], [0.155, 0.012, 0.135], trim),
    box([0, 0.99, 0.565], [0.07, 0.07, 0.006], dark), box([0, 0.99, 0.315], [0.07, 0.07, 0.006], dark),
    { s: 'ell', c: [0, 0.97, 0.5], rr: [0.05, 0.055, 0.05], col: C('#d8a040'), k: 0 },
    { s: 'cap', a: [0, 1.1, 0.44], b: [0, 1.55, 0.44], r: 0.125, r2: 0.006, col: C('#4a3a40'), k: 0 },
    { s: 'cap', a: [0, 1.54, 0.44], b: [0, 1.7, 0.44], r: 0.016, col: gold, k: 0 }, { s: 'cap', a: [-0.045, 1.645, 0.44], b: [0.045, 1.645, 0.44], r: 0.016, col: gold, k: 0 },
    { s: 'cyl', ax: 'z', c: [0, 0.58, 0.552], r: 0.055, hh: 0.006, rd: 0.003, col: C('#5a8adf'), k: 0 },
    { s: 'tor', ax: 'z', c: [0, 0.58, 0.556], R: 0.057, r: 0.01, a0: -Math.PI, a1: Math.PI, col: trim, k: 0 },
    { s: 'cap', a: [-0.05, 0.58, 0.56], b: [0.05, 0.58, 0.56], r: 0.006, col: gold, k: 0 }, { s: 'cap', a: [0, 0.53, 0.56], b: [0, 0.63, 0.56], r: 0.006, col: gold, k: 0 },
    // arched door and steps
    box([0, 0.12, 0.552], [0.065, 0.12, 0.006], woodD), { s: 'cyl', ax: 'z', c: [0, 0.24, 0.552], r: 0.065, hh: 0.006, rd: 0.002, col: woodD, k: 0 },
    box([0, 0.015, 0.6], [0.11, 0.015, 0.05], stoneD),
  ], { ao: 3 });

  // ---------- the town square's pieces: water tower, bandstand, well, lamp posts ----------
  {
    const parts = [];
    const legs = [[0.3, 0.3], [-0.3, 0.3], [-0.3, -0.3], [0.3, -0.3]];
    for (const [x, z] of legs) parts.push({ s: 'cap', a: [x, 0, z], b: [x * 0.8, 1.04, z * 0.8], r: 0.032, col: woodD, k: 0 });
    for (let i = 0; i < 4; i++) {
      const [x0, z0] = legs[i], [x1, z1] = legs[(i + 1) % 4];
      parts.push({ s: 'cap', a: [x0 * 0.95, 0.15, z0 * 0.95], b: [x1 * 0.88, 0.6, z1 * 0.88], r: 0.014, col: woodD, k: 0 });
      parts.push({ s: 'cap', a: [x1 * 0.95, 0.15, z1 * 0.95], b: [x0 * 0.88, 0.6, z0 * 0.88], r: 0.014, col: woodD, k: 0 });
    }
    parts.push({ s: 'cyl', ax: 'y', c: [0, 1.06, 0], r: 0.3, hh: 0.02, rd: 0.006, col: woodD, k: 0 });
    parts.push({ s: 'cyl', ax: 'y', c: [0, 1.36, 0], r: 0.42, hh: 0.3, rd: 0.03, col: C('#9a6a3e'), k: 0 });
    for (const y of [1.14, 1.36, 1.58]) parts.push({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.425, r: 0.014, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 });
    parts.push({ s: 'cyl', ax: 'y', c: [0, 1.67, 0], r: 0.46, hh: 0.015, rd: 0.006, col: roof, k: 0 });
    parts.push({ s: 'cap', a: [0, 1.68, 0], b: [0, 1.95, 0], r: 0.38, r2: 0.02, col: roof, k: 0 });
    parts.push({ s: 'sph', c: [0, 1.97, 0], r: 0.03, col: iron, k: 0 });
    parts.push({ s: 'cap', a: [0.1, 1.2, 0.4], b: [0.1, 0.3, 0.27], r: 0.012, col: iron, k: 0 }, { s: 'cap', a: [-0.1, 1.2, 0.4], b: [-0.1, 0.3, 0.27], r: 0.012, col: iron, k: 0 });
    P('watertower', parts, { ao: 2 });
  }
  {
    const parts = [
      { s: 'cyl', ax: 'y', c: [0, 0.06, 0], r: 0.5, hh: 0.06, rd: 0.02, col: white, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 0.035, 0], r: 0.52, hh: 0.035, rd: 0.01, col: C('#c8bca8'), k: 0 },
      box([0, 0.03, 0.53], [0.1, 0.03, 0.05], white),
      { s: 'ell', c: [0, 0.68, 0], rr: [0.57, 0.2, 0.57], col: C('#c0463a'), k: 0 },
      { s: 'tor', ax: 'y', c: [0, 0.64, 0], R: 0.55, r: 0.026, a0: -Math.PI, a1: Math.PI, col: white, k: 0 },
      { s: 'cap', a: [0, 0.85, 0], b: [0, 0.98, 0], r: 0.02, r2: 0.005, col: gold, k: 0 }, { s: 'sph', c: [0, 0.88, 0], r: 0.035, col: gold, k: 0 },
      { s: 'tor', ax: 'y', c: [0, 0.27, 0], R: 0.44, r: 0.014, a0: -Math.PI, a1: 0.3 * Math.PI, col: white, k: 0 },
      { s: 'tor', ax: 'y', c: [0, 0.27, 0], R: 0.44, r: 0.014, a0: 0.7 * Math.PI, a1: Math.PI, col: white, k: 0 },
    ];
    for (let i = 0; i < 8; i++) {
      const a = (i + 0.5) * TAU / 8;
      parts.push({ s: 'cap', a: [Math.cos(a) * 0.44, 0.12, Math.sin(a) * 0.44], b: [Math.cos(a) * 0.44, 0.62, Math.sin(a) * 0.44], r: 0.022, col: white, k: 0 });
      // bunting between the posts
      const b = (i + 1) * TAU / 8;
      parts.push({ s: 'sph', c: [Math.cos(b) * 0.5, 0.58, Math.sin(b) * 0.5], r: 0.032, col: [red, white, C('#3a5ab8')][i % 3], k: 0 });
    }
    // a brass tuba resting on a chair: the band is on break
    parts.push({ s: 'tor', ax: 'z', c: [0.12, 0.22, -0.1], R: 0.07, r: 0.026, a0: -Math.PI, a1: Math.PI, col: C('#e0b040'), k: 0 });
    parts.push({ s: 'cap', a: [0.18, 0.24, -0.1], b: [0.24, 0.36, -0.1], r: 0.02, r2: 0.06, col: C('#e0b040'), k: 0 });
    P('gazebo', parts, { ao: 1.5 });
  }
  P('well', [
    { s: 'cyl', ax: 'y', c: [0, 0.13, 0], r: 0.3, hh: 0.13, rd: 0.03, col: C('#a89a88'), k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 0.25, 0], r: 0.22, hh: 0.08, rd: 0.01, sub: true, k: 0.01 },
    { s: 'cyl', ax: 'y', c: [0, 0.17, 0], r: 0.23, hh: 0.01, rd: 0.0, col: water, k: 0 },
    ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.28, 0.2, 0], b: [sx * 0.28, 0.64, 0], r: 0.026, col: wood, k: 0 })),
    { s: 'gable', c: [0, 0.6, 0], w: 0.22, h: 0.14, hh: 0.36, ax: 'x', col: roof, k: 0 },
    { s: 'cap', a: [-0.3, 0.48, 0], b: [0.3, 0.48, 0], r: 0.02, col: woodD, k: 0 }, { s: 'cap', a: [0.32, 0.48, 0], b: [0.36, 0.4, 0.04], r: 0.012, col: iron, k: 0 },
    { s: 'cap', a: [0, 0.47, 0], b: [0, 0.32, 0], r: 0.007, col: C('#c8b088'), k: 0 },
    { s: 'cyl', ax: 'y', c: [0.2, 0.31, 0.16], r: 0.05, hh: 0.05, rd: 0.01, col: wood, k: 0 },
  ], { ao: 0.8 });
  P('oillamp', [
    { s: 'cyl', ax: 'y', c: [0, 0.04, 0], r: 0.07, hh: 0.04, rd: 0.015, col: iron, k: 0 },
    { s: 'cap', a: [0, 0.05, 0], b: [0, 1.24, 0], r: 0.03, col: iron, k: 0 },
    box([0, 1.33, 0], [0.065, 0.085, 0.065], lit, 0.012),
    ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([x, z]) => ({ s: 'cap', a: [x * 0.068, 1.25, z * 0.068], b: [x * 0.068, 1.41, z * 0.068], r: 0.011, col: iron, k: 0 })),
    { s: 'cap', a: [0, 1.41, 0], b: [0, 1.52, 0], r: 0.08, r2: 0.012, col: iron, k: 0 },
  ], { ao: 0.5 });

  // ---------- ranch props: hay bales, a covered wagon, a water trough with a pump and a split-rail fence ----------
  P('haybale', [
    box([-0.16, 0.13, 0], [0.15, 0.13, 0.3], hay, 0.035, 0.005), box([0.16, 0.13, 0.03], [0.15, 0.13, 0.3], C('#dcb650'), 0.035, 0.005),
    box([0.01, 0.39, 0.01], [0.3, 0.13, 0.15], C('#f0cc66'), 0.035, 0.005),
    ...[-0.16, 0.16].flatMap(x => [-0.12, 0.12].map(z => box([x, 0.13, z + (x > 0 ? 0.03 : 0)], [0.153, 0.133, 0.012], hayD, 0.01))),
    ...[-0.12, 0.12].map(x => box([x + 0.01, 0.39, 0.01], [0.012, 0.133, 0.153], hayD, 0.01)),
    { s: 'ell', c: [0.2, 0.52, 0.05], rr: [0.06, 0.02, 0.03], col: hay, k: 0.01 }, { s: 'ell', c: [-0.28, 0.02, 0.3], rr: [0.07, 0.015, 0.05], col: hay, k: 0.01 },
  ], { ao: 0.6 });
  {
    const parts = [
      box([0, 0.3, 0], [0.24, 0.06, 0.46], wood, 0.01), box([0, 0.36, 0], [0.25, 0.012, 0.47], woodD, 0.004),
      { s: 'ell', c: [0, 0.4, -0.04], rr: [0.27, 0.3, 0.42], col: canvas, k: 0.01 },
      ...[-0.36, -0.12, 0.12, 0.36].map(z => ({ s: 'tor', ax: 'z', c: [0, 0.4, z - 0.04], R: 0.272, r: 0.012, a0: 0.05, a1: Math.PI - 0.05, col: C('#cfc2a6'), k: 0 })),
      { s: 'ell', c: [0, 0.48, 0.38], rr: [0.18, 0.16, 0.03], col: dark, k: 0 },
      { s: 'cap', a: [0, 0.24, 0.46], b: [0, 0.16, 0.78], r: 0.022, col: woodD, k: 0 }, { s: 'cap', a: [-0.12, 0.16, 0.78], b: [0.12, 0.16, 0.78], r: 0.016, col: woodD, k: 0 },
      box([0.2, 0.42, -0.3], [0.05, 0.05, 0.05], woodL, 0.01),
    ];
    for (const [z, R] of [[0.3, 0.15], [-0.32, 0.19]]) for (const sx of [1, -1]) {
      parts.push({ s: 'tor', ax: 'x', c: [sx * 0.27, R, z], R, r: 0.022, a0: -Math.PI, a1: Math.PI, col: woodD, k: 0 });
      parts.push({ s: 'cyl', ax: 'x', c: [sx * 0.27, R, z], r: 0.035, hh: 0.03, rd: 0.01, col: iron, k: 0 });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; parts.push({ s: 'cap', a: [sx * 0.27, R + Math.cos(a) * R, z + Math.sin(a) * R], b: [sx * 0.27, R - Math.cos(a) * R, z - Math.sin(a) * R], r: 0.009, col: wood, k: 0 }); }
    }
    P('wagon', parts, { ao: 0.8 });
  }
  P('trough', [
    box([0, 0.17, 0], [0.42, 0.09, 0.14], wood, 0.012), box([0, 0.245, 0], [0.38, 0.02, 0.1], water, 0.004),
    ...[-0.36, 0.36].flatMap(x => [-0.1, 0.1].map(z => ({ s: 'cap', a: [x, 0, z], b: [x, 0.1, z], r: 0.025, col: woodD, k: 0 }))),
    { s: 'cyl', ax: 'y', c: [0.46, 0.25, 0], r: 0.04, hh: 0.25, rd: 0.01, col: C('#4a6a5a'), k: 0 },
    { s: 'cap', a: [0.46, 0.44, 0], b: [0.36, 0.4, 0], r: 0.016, r2: 0.01, col: C('#4a6a5a'), k: 0 },
    { s: 'cap', a: [0.48, 0.5, 0], b: [0.58, 0.62, 0], r: 0.012, col: iron, k: 0 },
  ], { ao: 0.6 });
  P('railfence', [
    ...[-0.45, 0.45].map(x => ({ s: 'cap', a: [x, -0.02, 0], b: [x + 0.01, 0.72, 0], r: 0.04, r2: 0.034, col: woodD, k: 0 })),
    ...[[0.2, 0.01], [0.43, -0.012], [0.63, 0.008]].map(([y, dz]) => ({ s: 'cap', a: [-0.52, y, dz], b: [0.52, y + 0.02, -dz], r: 0.026, col: C('#9a7048'), k: 0 })),
  ], { ao: 0.6 });

  // a bundle of three dynamite sticks with a lit fuse (thrown by The Outlaw)
  P('dynamite', [
    ...[[0, 0], [0.11, 0.02], [0.05, -0.09]].map(([x, z]) => ({ s: 'cyl', ax: 'y', c: [x - 0.05, 0.2, z + 0.02], r: 0.06, hh: 0.19, rd: 0.02, col: C('#d8302a'), k: 0 })),
    { s: 'tor', ax: 'y', c: [0, 0.2, 0], R: 0.13, r: 0.022, a0: -Math.PI, a1: Math.PI, col: C('#e8d8b0'), k: 0 },
    { s: 'cap', a: [0, 0.38, 0], b: [0.06, 0.5, 0.02], r: 0.014, col: C('#3a2a1e'), k: 0 },
    { s: 'sph', c: [0.07, 0.52, 0.02], r: 0.035, col: C('#fff2a0'), k: 0 },
  ], { ao: 0.3 });

  // ---------- creatures. Parts without col take the tint (coat or body) ----------
  // bison: a huge shaggy front with a hump, curved horns and a beard, a small hind end, a tufted tail
  {
    const shag = C('#7a5232'), shagD = C('#4a301e'), hoof = C('#221812'), horn = C('#efe2c4'), eye = C('#120c0a');
    const m = P('bison', [
      { s: 'ell', c: [0, 0.44, -0.2], rr: [0.18, 0.18, 0.24], k: 0.06 },
      { s: 'ell', c: [0, 0.54, 0.12], rr: [0.25, 0.3, 0.28], col: shag, k: 0.08 },
      { s: 'ell', c: [0, 0.7, 0.04], rr: [0.18, 0.16, 0.2], col: shag, k: 0.06 },
      { s: 'ell', c: [0, 0.42, 0.44], rr: [0.15, 0.16, 0.13], col: shagD, k: 0.04, bone: 2 },
      { s: 'ell', c: [0, 0.33, 0.53], rr: [0.11, 0.09, 0.08], col: C('#2e2016'), k: 0.03, bone: 2 },
      { s: 'sph', c: [0.04, 0.35, 0.6], r: 0.02, col: hoof, k: 0, bone: 2 }, { s: 'sph', c: [-0.04, 0.35, 0.6], r: 0.02, col: hoof, k: 0, bone: 2 },
      { s: 'ell', c: [0, 0.22, 0.45], rr: [0.08, 0.11, 0.06], col: shagD, k: 0.03, bone: 2 },
      ...[1, -1].flatMap(sx => [
        { s: 'cap', a: [sx * 0.12, 0.5, 0.45], b: [sx * 0.24, 0.53, 0.46], r: 0.035, r2: 0.025, col: horn, k: 0.01, bone: 2 },
        { s: 'cap', a: [sx * 0.24, 0.53, 0.46], b: [sx * 0.25, 0.64, 0.5], r: 0.025, r2: 0.006, col: horn, k: 0.01, bone: 2 },
        { s: 'sph', c: [sx * 0.11, 0.45, 0.53], r: 0.026, col: eye, k: 0, bone: 2 }, { s: 'sph', c: [sx * 0.105, 0.46, 0.555], r: 0.008, col: C('#ffffff'), k: 0, bone: 2 },
        { s: 'cap', a: [sx * 0.13, 0.44, 0.22], b: [sx * 0.13, 0.22, 0.24], r: 0.075, r2: 0.06, col: shag, k: 0.03, bone: sx > 0 ? 3 : 5 },
        { s: 'cap', a: [sx * 0.13, 0.22, 0.24], b: [sx * 0.13, 0.05, 0.24], r: 0.05, r2: 0.045, k: 0.02, bone: sx > 0 ? 4 : 6 },
        { s: 'cyl', ax: 'y', c: [sx * 0.13, 0.03, 0.25], r: 0.05, hh: 0.03, rd: 0.012, col: hoof, k: 0.01, bone: sx > 0 ? 4 : 6 },
        { s: 'cap', a: [sx * 0.11, 0.42, -0.28], b: [sx * 0.11, 0.22, -0.3], r: 0.065, r2: 0.05, k: 0.03, bone: sx > 0 ? 7 : 9 },
        { s: 'cap', a: [sx * 0.11, 0.22, -0.3], b: [sx * 0.11, 0.05, -0.28], r: 0.045, r2: 0.04, k: 0.02, bone: sx > 0 ? 8 : 10 },
        { s: 'cyl', ax: 'y', c: [sx * 0.11, 0.03, -0.27], r: 0.045, hh: 0.03, rd: 0.012, col: hoof, k: 0.01, bone: sx > 0 ? 8 : 10 },
      ]),
      { s: 'cap', a: [0, 0.5, -0.42], b: [0, 0.3, -0.46], r: 0.022, k: 0.02 }, { s: 'ell', c: [0, 0.27, -0.46], rr: [0.035, 0.06, 0.035], col: shagD, k: 0.01 },
    ], { ao: 0.8 });
    rig(m, { 0: [0, 0.42, -0.28], 1: [0, 0.5, 0.2], 2: [0, 0.5, 0.34], 3: [0.13, 0.44, 0.22], 4: [0.13, 0.22, 0.24], 5: [-0.13, 0.44, 0.22], 6: [-0.13, 0.22, 0.24],
      7: [0.11, 0.42, -0.28], 8: [0.11, 0.22, -0.3], 9: [-0.11, 0.42, -0.28], 10: [-0.11, 0.22, -0.3] });
    m.quad = true; m.runAmp = 0.8; m.J.head = [0, 0.42, 0.44];
  }
  // mule and horse share a body plan: long legs, long head on a neck; the mule has big ears and a pack, the horse a mane and a saddle
  const equine = (name, o) => {
    const pale = C(o.pale), mane = C(o.mane), hoof = C('#2a2018'), eye = C('#120c0a');
    const L = o.leg, hipY = L + 0.02, kn = L * 0.5;
    const parts = [
      { s: 'ell', c: [0, hipY + 0.07, -0.02], rr: [0.15, 0.15, 0.32], k: 0.06 },
      { s: 'ell', c: [0, hipY + 0.02, 0.0], rr: [0.12, 0.1, 0.25], col: o.belly ? pale : null, k: 0.05 },
      { s: 'cap', a: [0, hipY + 0.12, 0.22], b: [0, hipY + 0.32, 0.36], r: 0.085, r2: 0.07, k: 0.05, bone: 2 },
      { s: 'ell', c: [0, hipY + 0.34, 0.48], rr: [0.075, 0.08, 0.15], k: 0.04, bone: 2 },
      { s: 'ell', c: [0, hipY + 0.3, 0.6], rr: [0.068, 0.065, 0.06], col: pale, k: 0.03, bone: 2 },
      { s: 'sph', c: [0.03, hipY + 0.31, 0.655], r: 0.014, col: hoof, k: 0, bone: 2 }, { s: 'sph', c: [-0.03, hipY + 0.31, 0.655], r: 0.014, col: hoof, k: 0, bone: 2 },
      ...[1, -1].flatMap(sx => [
        { s: 'sph', c: [sx * 0.07, hipY + 0.39, 0.5], r: 0.02, col: eye, k: 0, bone: 2 }, { s: 'sph', c: [sx * 0.072, hipY + 0.4, 0.515], r: 0.007, col: C('#ffffff'), k: 0, bone: 2 },
        { s: 'ell', c: [sx * 0.05, hipY + 0.42 + o.ear * 0.5, 0.4], rr: [0.025, o.ear * 0.55, 0.035], k: 0.01, bone: 2 },
        { s: 'ell', c: [sx * 0.05, hipY + 0.42 + o.ear * 0.5, 0.415], rr: [0.014, o.ear * 0.4, 0.015], col: o.earIn ? C(o.earIn) : pale, k: 0, bone: 2 },
        { s: 'cap', a: [sx * 0.1, hipY, 0.2], b: [sx * 0.1, kn, 0.21], r: 0.05, r2: 0.04, k: 0.03, bone: sx > 0 ? 3 : 5 },
        { s: 'cap', a: [sx * 0.1, kn, 0.21], b: [sx * 0.1, 0.05, 0.21], r: 0.036, r2: 0.032, col: o.sock ? mane : null, k: 0.02, bone: sx > 0 ? 4 : 6 },
        { s: 'cyl', ax: 'y', c: [sx * 0.1, 0.03, 0.22], r: 0.04, hh: 0.03, rd: 0.01, col: hoof, k: 0.01, bone: sx > 0 ? 4 : 6 },
        { s: 'cap', a: [sx * 0.1, hipY + 0.02, -0.24], b: [sx * 0.1, kn, -0.27], r: 0.058, r2: 0.042, k: 0.03, bone: sx > 0 ? 7 : 9 },
        { s: 'cap', a: [sx * 0.1, kn, -0.27], b: [sx * 0.1, 0.05, -0.25], r: 0.036, r2: 0.032, col: o.sock ? mane : null, k: 0.02, bone: sx > 0 ? 8 : 10 },
        { s: 'cyl', ax: 'y', c: [sx * 0.1, 0.03, -0.24], r: 0.04, hh: 0.03, rd: 0.01, col: hoof, k: 0.01, bone: sx > 0 ? 8 : 10 },
      ]),
      // mane along the neck, and a tail
      ...[0, 1, 2, 3].map(i => ({ s: 'ell', c: [0, hipY + 0.2 + i * 0.065, 0.2 + i * 0.05], rr: [0.03, 0.05 * o.maneK, 0.05], col: mane, k: 0.02, bone: 2 })),
      { s: 'cap', a: [0, hipY + 0.1, -0.33], b: [0, hipY - 0.12 * o.tail, -0.42], r: 0.03 * o.tail, r2: 0.045 * o.tail, col: mane, k: 0.02 },
    ];
    if (o.blaze) parts.push({ s: 'ell', c: [0, hipY + 0.36, 0.6], rr: [0.022, 0.03, 0.04], col: C('#f8f4ec'), k: 0, bone: 2 }, { s: 'ell', c: [0, hipY + 0.38, 0.54], rr: [0.02, 0.025, 0.05], col: C('#f8f4ec'), k: 0, bone: 2 });
    parts.push(...o.extra(hipY));
    const m = P(name, parts, { ao: 0.7 });
    rig(m, { 0: [0, hipY, -0.24], 1: [0, hipY, 0.2], 2: [0, hipY + 0.14, 0.24], 3: [0.1, hipY, 0.2], 4: [0.1, kn, 0.21], 5: [-0.1, hipY, 0.2], 6: [-0.1, kn, 0.21],
      7: [0.1, hipY, -0.24], 8: [0.1, kn, -0.27], 9: [-0.1, hipY, -0.24], 10: [-0.1, kn, -0.27] });
    m.quad = true; m.runAmp = o.amp; m.J.head = [0, hipY + 0.36, 0.46];
    return m;
  };
  // the mule: grey-brown with a pale nose and belly, huge ears, a striped blanket, saddlebags and a bedroll
  equine('mule', { leg: 0.36, pale: '#e8dcc8', mane: '#3a2a1e', ear: 0.15, earIn: '#d8a8a0', maneK: 0.6, tail: 0.6, belly: true, amp: 0.85, extra: y => [
    box([0, y + 0.19, -0.04], [0.165, 0.035, 0.13], red, 0.02), box([0, y + 0.2, -0.04], [0.168, 0.012, 0.132], cream, 0.006),
    ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.17, y + 0.08, -0.04], rr: [0.05, 0.08, 0.09], col: C('#7a4a24'), k: 0.01 })),
    { s: 'cyl', ax: 'x', c: [0, y + 0.26, -0.14], r: 0.045, hh: 0.13, rd: 0.02, col: C('#d8c8a0'), k: 0 },
    { s: 'tor', ax: 'x', c: [0.08, y + 0.26, -0.14], R: 0.045, r: 0.008, a0: -Math.PI, a1: Math.PI, col: C('#7a4a24'), k: 0 },
  ] });
  // the horse: a bay mustang with black stockings, a flowing mane and a white blaze, under an empty saddle
  equine('horse', { leg: 0.44, pale: '#5a3a26', mane: '#1e1612', ear: 0.08, maneK: 1.3, tail: 1.2, sock: true, blaze: true, amp: 1.15, extra: y => [
    { s: 'ell', c: [0, y + 0.17, -0.02], rr: [0.16, 0.05, 0.12], col: C('#6a3a1e'), k: 0.02 },
    { s: 'cap', a: [0, y + 0.2, 0.08], b: [0, y + 0.27, 0.1], r: 0.02, r2: 0.026, col: C('#6a3a1e'), k: 0.01 },
    { s: 'ell', c: [0, y + 0.13, -0.02], rr: [0.165, 0.03, 0.1], col: C('#3a6ab8'), k: 0.01 },
    ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.16, y + 0.12, -0.02], b: [sx * 0.17, y - 0.08, -0.02], r: 0.008, col: C('#2a1a12'), k: 0 })),
    ...[1, -1].map(sx => ({ s: 'tor', ax: 'x', c: [sx * 0.17, y - 0.1, -0.02], R: 0.02, r: 0.007, a0: -Math.PI, a1: Math.PI, col: C('#c8c8d0'), k: 0 })),
  ] });
  // rattlesnake: a sandy chain of segments with dark diamonds on the back, a wide head with yellow eyes, a forked tongue and a rattle
  {
    const dia = C('#5a3e24'), belly = C('#f0e0b8'), rattle = C('#e8d4a8'), eyeY = C('#ffd23a'), tongue = C('#e8283c'), pupil = C('#120c0a');
    const segs = [[8, -0.62, -0.42, 0.04, 0.06, 0.075], [7, -0.42, -0.14, 0.06, 0.075, 0.085], [0, -0.14, 0.1, 0.075, 0.08, 0.09], [1, 0.1, 0.3, 0.08, 0.065, 0.1]];
    const parts = [];
    for (const [b, z0, z1, r0, r1, y0] of segs) {
      const y1 = b === 1 ? 0.24 : y0 + 0.005;
      parts.push({ s: 'cap', a: [0, y0, z0], b: [0, y1, z1], r: r0, r2: r1, k: 0.03, bone: b });
      parts.push({ s: 'ell', c: [0, (y0 + y1) / 2 - r0 * 0.45, (z0 + z1) / 2], rr: [r0 * 0.8, r0 * 0.5, (z1 - z0) * 0.5], col: belly, k: 0.01, bone: b });
      for (let i = 0; i < 2; i++) { const u = (i + 0.5) / 2; parts.push({ s: 'ell', c: [0, lerp(y0, y1, u) + lerp(r0, r1, u) * 0.75, lerp(z0, z1, u)], rr: [lerp(r0, r1, u) * 0.55, 0.022, 0.045], col: dia, k: 0.01, bone: b }); }
    }
    for (const z of [-0.66, -0.7, -0.74]) parts.push({ s: 'ell', c: [0, 0.075, z], rr: [0.035, 0.03, 0.026], col: rattle, k: 0.01, bone: 8 });
    parts.push({ s: 'ell', c: [0, 0.27, 0.4], rr: [0.1, 0.06, 0.11], k: 0.04, bone: 2 });
    parts.push({ s: 'ell', c: [0, 0.25, 0.44], rr: [0.075, 0.035, 0.08], col: belly, k: 0.02, bone: 2 });
    for (const sx of [1, -1]) {
      parts.push({ s: 'sph', c: [sx * 0.062, 0.31, 0.45], r: 0.024, col: eyeY, k: 0, bone: 2 });
      parts.push({ s: 'ell', c: [sx * 0.07, 0.315, 0.465], rr: [0.005, 0.016, 0.006], col: pupil, k: 0, bone: 2 });
      parts.push({ s: 'cap', a: [0, 0.25, 0.555], b: [sx * 0.018, 0.25, 0.6], r: 0.006, col: tongue, k: 0, bone: 2 });
    }
    parts.push({ s: 'cap', a: [0, 0.25, 0.49], b: [0, 0.25, 0.56], r: 0.008, col: tongue, k: 0, bone: 2 });
    const m = P('snake', parts, { ao: 0.4 });
    rig(m, { 0: [0, 0.09, -0.02], 1: [0, 0.1, 0.1], 2: [0, 0.24, 0.3], 7: [0, 0.09, -0.14], 8: [0, 0.08, -0.42] });
    m.snake = true; m.J.head = [0, 0.27, 0.4];
  }

  // ---------- people: a revolver-toting gunslinger, and The Outlaw ----------
  const hatOn = (m, hr, col, band) => {
    const hd = m.J.head, y = hd[1] + hr * 0.45;
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], y, hd[2]], r: hr * 1.65, hh: hr * 0.1, rd: hr * 0.08, col, bone: 2, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], y + hr * 0.07, hd[2]], R: hr * 1.6, r: hr * 0.12, a0: -Math.PI, a1: Math.PI, col, bone: 2, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], y + hr * 0.55, hd[2] - hr * 0.04], r: hr * 0.85, hh: hr * 0.5, rd: hr * 0.35, col, bone: 2, k: 0 });
    m.parts.push({ s: 'ell', c: [hd[0], y + hr * 1.08, hd[2] - hr * 0.04], rr: [hr * 0.18, hr * 0.22, hr * 0.6], sub: true, bone: 2, k: hr * 0.08 });
    m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], y + hr * 0.2, hd[2] - hr * 0.04], R: hr * 0.86, r: hr * 0.1, a0: -Math.PI, a1: Math.PI, col: band, bone: 2, k: 0 });
  };
  // a revolver in a hand: the barrel runs down the hanging arm, so it points ahead once the arm comes up
  const revolver = (m, side, s, metal) => {
    const h = m.J['ha' + side], b = side === 'R' ? 6 : 4, x = h[0];
    m.parts.push({ s: 'cap', a: [x, h[1] - 0.02 * s, h[2] + 0.005 * s], b: [x, h[1] - 0.2 * s, h[2] + 0.005 * s], r: 0.016 * s, col: metal, bone: b, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [x, h[1] - 0.06 * s, h[2] + 0.005 * s], r: 0.03 * s, hh: 0.028 * s, rd: 0.01 * s, col: metal, bone: b, k: 0 });
    m.parts.push({ s: 'cap', a: [x, h[1] + 0.01 * s, h[2] - 0.005 * s], b: [x, h[1] + 0.035 * s, h[2] - 0.07 * s], r: 0.02 * s, col: C('#5a3418'), bone: b, k: 0 });
  };
  {
    const m = makeHumanoid(STICK), hd = m.J.head;
    hatOn(m, 0.155, C('#6a4424'), C('#2a1a12'));
    m.parts.push({ s: 'tor', ax: 'y', c: [0, STICK.shY + 0.03, 0.005], R: 0.07, r: 0.03, a0: -Math.PI, a1: Math.PI, col: red, bone: 1, k: 0 });
    m.parts.push({ s: 'ell', c: [0, STICK.shY - 0.01, 0.08], rr: [0.055, 0.05, 0.025], col: red, bone: 1, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [0, STICK.hipY + 0.02, 0], R: 0.095, r: 0.022, a0: -Math.PI, a1: Math.PI, col: C('#4a2e1a'), bone: 0, k: 0 });
    m.parts.push({ s: 'ell', c: [0.11, STICK.hipY - 0.05, 0.0], rr: [0.03, 0.07, 0.045], col: C('#6a4024'), bone: 0, k: 0 });
    m.parts.push({ s: 'ell', c: [hd[0] + 0.06, hd[1] + 0.02, hd[2] + 0.13], rr: [0.03, 0.02, 0.02], col: C('#1a1214'), bone: 2, k: 0 });
    m.parts.push({ s: 'ell', c: [hd[0] - 0.06, hd[1] + 0.02, hd[2] + 0.13], rr: [0.03, 0.02, 0.02], col: C('#1a1214'), bone: 2, k: 0 });
    revolver(m, 'R', 1, C('#9aa0aa'));
    m.name = 'gunslinger'; m.gun = 1; m.crownLift = 0.2;
    defs.gunslinger = m;
  }
  // The Outlaw: a lanky goo bandit in a wide black hat and a long duster, a polka-dot bandana over his face, a bandolier,
  // a silver-buckled gun belt, tall boots with spurs, and a silver six-shooter in each hand
  {
    const o = { ...STICK, hipY: 0.46, shY: 0.83, headY: 1.06, headR: 0.22, headZ: 0.03, shW: 0.2, hipW: 0.1, elOut: 0.06, upperLen: 0.17, foreLen: 0.16,
      pelvisR: 0.15, torso: 'ell', torsoRR: [0.2, 0.26, 0.17], neckR: 0.11, armR: 0.075, handR: 0.09, legR: 0.085, k: 0.06 };
    const m = makeHumanoid(o), J = m.J, hd = J.head, hr = o.headR;
    const coat = C('#5e3a22'), coatD = C('#3e2616'), hatC = C('#1e1a20'), silver = C('#dcdce6'), brass = C('#e0b040'), boot = C('#2e1e14'), bandana = C('#c8302a');
    face(m, { eyeCol: COL.eyeY, mouth: 'none', eyeY: 0.3 });
    hatOn(m, hr * 1.05, hatC, silver);
    for (let i = 0; i < 6; i++) { const a = -0.5 + i * 0.2; m.parts.push({ s: 'sph', c: [hd[0] + Math.sin(a) * hr * 0.92, hd[1] + hr * 0.7, hd[2] + Math.cos(a) * hr * 0.9], r: 0.022, col: silver, bone: 2, k: 0 }); }
    // the bandana mask over nose and mouth, with white dots, knotted behind
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] - hr * 0.42, hd[2] + hr * 0.38], rr: [hr * 0.92, hr * 0.5, hr * 0.7], col: bandana, bone: 2, k: 0.01 });
    m.parts.push({ s: 'cap', a: [hd[0], hd[1] - hr * 0.55, hd[2] + hr * 0.9], b: [hd[0], hd[1] - hr * 1.0, hd[2] + hr * 0.75], r: hr * 0.3, r2: 0.01, col: bandana, bone: 2, k: 0.01 });
    for (const [x, y] of [[-0.45, -0.3], [0.4, -0.35], [0, -0.55], [-0.2, -0.75], [0.25, -0.7], [0.55, -0.55], [-0.6, -0.55]]) m.parts.push({ s: 'sph', c: [hd[0] + x * hr, hd[1] + y * hr, hd[2] + hr * (0.98 - Math.abs(x) * 0.35)], r: 0.016, col: white, bone: 2, k: 0 });
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] - hr * 0.2, hd[2] - hr * 0.95], rr: [0.05, 0.04, 0.035], col: bandana, bone: 2, k: 0 });
    // the duster: over the chest and shoulders, open down the front, its tails flaring off the hips
    m.parts.push({ s: 'ell', c: [0, 0.66, -0.06], rr: [0.235, 0.27, 0.16], col: coat, bone: 1, k: 0.02 });
    for (const sx of [1, -1]) {
      m.parts.push({ s: 'ell', c: [sx * 0.2, 0.8, -0.01], rr: [0.11, 0.07, 0.12], col: coat, bone: 1, k: 0.02 });
      m.parts.push({ s: 'cap', a: [sx * 0.09, 0.84, 0.12], b: [sx * 0.07, 0.56, 0.15], r: 0.025, col: coatD, bone: 1, k: 0.01 });
      m.parts.push({ s: 'cap', a: J['sh' + (sx > 0 ? 'L' : 'R')], b: J['el' + (sx > 0 ? 'L' : 'R')], r: o.armR * 1.15, col: coat, bone: sx > 0 ? 3 : 5, k: 0.02 });
      m.parts.push({ s: 'cap', a: J['el' + (sx > 0 ? 'L' : 'R')], b: [J['ha' + (sx > 0 ? 'L' : 'R')][0], J['ha' + (sx > 0 ? 'L' : 'R')][1] + 0.05, 0.02], r: o.armR * 1.1, r2: o.armR * 1.25, col: coat, bone: sx > 0 ? 4 : 6, k: 0.02 });
    }
    m.parts.push({ s: 'ell', c: [0, 0.33, -0.07], rr: [0.245, 0.22, 0.15], col: coat, bone: 0, k: 0.02 });
    // bandolier, belt and buckle, holsters
    m.parts.push({ s: 'cap', a: [0.17, 0.84, 0.13], b: [-0.15, 0.5, 0.15], r: 0.03, col: C('#4a2e1a'), bone: 1, k: 0 });
    for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6; m.parts.push({ s: 'cap', a: [lerp(0.17, -0.15, u), lerp(0.84, 0.5, u), 0.165], b: [lerp(0.17, -0.15, u), lerp(0.84, 0.5, u) + 0.04, 0.17], r: 0.012, col: brass, bone: 1, k: 0 }); }
    m.parts.push({ s: 'tor', ax: 'y', c: [0, o.hipY + 0.03, 0], R: 0.155, r: 0.03, a0: -Math.PI, a1: Math.PI, col: C('#2a1a12'), bone: 0, k: 0 });
    m.parts.push(box([0, o.hipY + 0.03, 0.18], [0.05, 0.035, 0.012], silver, 0.01));
    m.parts[m.parts.length - 1].bone = 0;
    for (const sx of [1, -1]) m.parts.push({ s: 'ell', c: [sx * 0.16, o.hipY - 0.06, 0.02], rr: [0.04, 0.09, 0.055], col: C('#6a4024'), bone: 0, k: 0 });
    // boots with spurs
    for (const sd of ['L', 'R']) {
      const an = J['an' + sd], kn = J['kn' + sd], b = sd === 'L' ? 8 : 10;
      m.parts.push({ s: 'cap', a: [an[0], an[1] + 0.02, an[2]], b: [kn[0], kn[1] - 0.02, kn[2]], r: o.legR * 1.2, r2: o.legR * 1.3, col: boot, bone: b, k: 0.01 });
      m.parts.push({ s: 'ell', c: [an[0], an[1] - 0.02, an[2] + 0.05], rr: [o.legR * 1.05, o.legR * 0.65, o.legR * 1.7], col: boot, bone: b, k: 0.01 });
      m.parts.push({ s: 'tor', ax: 'x', c: [an[0], an[1] + 0.01, an[2] - 0.11], R: 0.03, r: 0.009, a0: -Math.PI, a1: Math.PI, col: silver, bone: b, k: 0 });
    }
    revolver(m, 'R', 1.5, silver); revolver(m, 'L', 1.5, silver);
    m.top = hd[1] + hr * 2.0; m.bmin = [-0.6, -0.03, -0.5]; m.bmax = [0.6, m.top + 0.05, 0.55];
    m.name = 'outlaw'; m.gun = 2; m.runAmp = 0.9; m.lean = 0.1;
    defs.outlaw = m;
  }
}
