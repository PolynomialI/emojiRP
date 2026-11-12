// ============================================================
// Chapter 17, the Mushroom Forest: giant spotted toadstools, mushroom clusters, stumps with shelf fungi,
// mossy logs and a ring of tall stalk mushrooms; the walking sporeling, the moth-like mothling, and the
// Mycelium Monarch. Built with prop() like 04a-04e. Parts without col take the instance tint.
// ============================================================
Object.assign(THEME_CLIPS, { sporeling: ['run', 'idle'], mothling: ['run'], monarch: ['run', 'slam', 'idle', 'throw'] });
Object.assign(THEME_CELLS, { toadstool: 0.022, shroomcluster: 0.016, stump: 0.02, log: 0.022, bigshroom: 0.022, sporeling: 0.015, mothling: 0.014, monarch: 0.015 });
MESH_ORDER.push('toadstool', 'shroomcluster', 'stump', 'log', 'bigshroom', 'sporeling', 'mothling', 'monarch');

function shroomModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const stemC = C('#f2ead8'), gill = C('#e2ceb4'), spot = C('#fff6e6'), bark = C('#5e4230'), barkD = C('#3e2a1e'), wood = C('#c89a68');
  const moss = C('#5a9a4a'), mossD = C('#3e7a36'), shelf = C('#f0b45a'), dark = C('#16101a'), white = C('#ffffff'), glowC = C('#7ff0ff');
  // spots scattered over a cap (an ellipsoid at c with radii rr): [elevation, azimuth, size]
  const spots = (c, rr, list, col = spot, bone) => list.map(([el, az, r]) => {
    const ce = Math.cos(el), p = { s: 'sph', c: [c[0] + rr[0] * ce * Math.cos(az), c[1] + rr[1] * Math.sin(el), c[2] + rr[2] * ce * Math.sin(az)], r, col, k: 0 };
    if (bone !== undefined) p.bone = bone;
    return p;
  });
  const SP = [[1.2, 0, 0.08], [0.75, 0.6, 0.07], [0.7, 2.2, 0.08], [0.5, 3.5, 0.06], [0.55, 4.6, 0.07], [0.35, 1.4, 0.06], [0.3, 5.5, 0.05], [0.9, 3.0, 0.06], [0.4, 0.2, 0.05]];
  // a little mushroom (stem from the ground at x, z): for clusters and for growing on things
  const shroom = (x, y, z, h, rc, col) => [
    { s: 'cap', a: [x, y, z], b: [x, y + h, z], r: rc * 0.32, r2: rc * 0.26, col: stemC, k: 0.01 },
    { s: 'ell', c: [x, y + h + rc * 0.15, z], rr: [rc, rc * 0.55, rc], col, k: 0.01 },
    { s: 'ell', c: [x, y + h + rc * 0.05, z], rr: [rc * 0.92, rc * 0.12, rc * 0.92], col: gill, k: 0 },
  ];

  // ---------- scenery ----------
  // a giant toadstool: a pale stem with a skirt, cream gills and a big domed cap (the tint) with spots
  P('toadstool', [
    { s: 'ell', c: [0, 1.16, 0], rr: [0.56, 0.32, 0.56], k: 0.02 },
    { s: 'ell', c: [0, 0.92, 0], rr: [0.62, 0.2, 0.62], sub: true, k: 0.03 },
    { s: 'cap', a: [0, 0, 0], b: [0, 1.0, 0], r: 0.17, r2: 0.12, col: stemC, k: 0.03 },
    { s: 'ell', c: [0, 0.06, 0], rr: [0.24, 0.08, 0.24], col: stemC, k: 0.05 },
    { s: 'tor', ax: 'y', c: [0, 0.74, 0], R: 0.15, r: 0.035, a0: -Math.PI, a1: Math.PI, col: stemC, k: 0.01 },
    { s: 'ell', c: [0, 1.0, 0], rr: [0.52, 0.04, 0.52], col: gill, k: 0 },
    ...spots([0, 1.16, 0], [0.56, 0.32, 0.56], SP),
  ], { ao: 1 });
  // a mossy mound sprouting five small mushrooms of different colors
  P('shroomcluster', [
    { s: 'ell', c: [0, 0.02, 0], rr: [0.5, 0.12, 0.45], col: moss, k: 0.04 },
    ...shroom(-0.2, 0.05, 0.05, 0.35, 0.18, C('#e83a4a')), ...shroom(0.15, 0.05, -0.12, 0.5, 0.22, C('#b05ae8')),
    ...shroom(0.25, 0.05, 0.2, 0.22, 0.13, C('#ff8a2a')), ...shroom(-0.05, 0.05, -0.28, 0.25, 0.12, C('#3a8ae8')), ...shroom(-0.32, 0.05, -0.15, 0.15, 0.09, C('#ffd23a')),
  ], { ao: 0.6 });
  // a cut stump with growth rings, roots, moss on top and orange shelf fungi up one side
  P('stump', [
    { s: 'cyl', ax: 'y', c: [0, 0.3, 0], r: 0.4, hh: 0.3, rd: 0.04, col: bark, k: 0.02 },
    { s: 'cyl', ax: 'y', c: [0, 0.6, 0], r: 0.37, hh: 0.015, rd: 0.005, col: wood, k: 0 },
    ...[0.12, 0.22, 0.3].map(R => ({ s: 'tor', ax: 'y', c: [0, 0.617, 0], R, r: 0.006, a0: -Math.PI, a1: Math.PI, col: C('#a87a4a'), k: 0 })),
    ...[0.3, 1.9, 3.3, 4.6].map(a => ({ s: 'cap', a: [Math.cos(a) * 0.3, 0.12, Math.sin(a) * 0.3], b: [Math.cos(a) * 0.6, 0.0, Math.sin(a) * 0.6], r: 0.09, r2: 0.04, col: barkD, k: 0.03 })),
    { s: 'ell', c: [-0.15, 0.62, 0.1], rr: [0.2, 0.04, 0.16], col: moss, k: 0.01 },
    ...[[0.4, 0.42, 0.13], [0.39, 0.25, 0.1], [0.35, 0.5, 0.08]].map(([x, y, r]) => ({ s: 'ell', c: [x * Math.cos(0.5), y, x * Math.sin(0.5)], rr: [r, r * 0.25, r], col: shelf, k: 0.005 })),
    ...shroom(0.1, 0.6, -0.12, 0.12, 0.08, C('#e83a4a')),
  ], { ao: 0.8 });
  // a fallen hollow log, mossy on top, with mushrooms growing out of it
  P('log', [
    { s: 'cyl', ax: 'x', c: [0, 0.3, 0], r: 0.3, hh: 0.72, rd: 0.06, col: bark, k: 0 },
    { s: 'cyl', ax: 'x', c: [0.62, 0.3, 0], r: 0.21, hh: 0.2, rd: 0.02, sub: true, k: 0.01 },
    { s: 'cyl', ax: 'x', c: [0.71, 0.3, 0], r: 0.27, hh: 0.012, rd: 0.004, col: wood, k: 0 },
    { s: 'ell', c: [-0.1, 0.55, 0], rr: [0.55, 0.08, 0.22], col: moss, k: 0.02 }, { s: 'ell', c: [0.3, 0.52, 0.06], rr: [0.25, 0.06, 0.16], col: mossD, k: 0.02 },
    ...shroom(-0.3, 0.55, 0.05, 0.18, 0.13, C('#b05ae8')), ...shroom(-0.12, 0.56, -0.08, 0.12, 0.09, C('#b05ae8')),
    ...[[-0.45, 0.32, 0.3], [-0.25, 0.22, 0.31]].map(([x, y, z]) => ({ s: 'ell', c: [x, y, z], rr: [0.1, 0.025, 0.1], col: shelf, k: 0 })),
    ...[0.05, 0.5].map(x => ({ s: 'tor', ax: 'x', c: [x, 0.3, 0], R: 0.3, r: 0.012, a0: -Math.PI, a1: Math.PI, col: barkD, k: 0 })),
  ], { ao: 0.8 });
  // the wall: tall thin-stalked mushrooms with wide caps (the tint) and glowing spots
  P('bigshroom', [
    { s: 'ell', c: [0.02, 1.74, 0.02], rr: [0.5, 0.2, 0.5], k: 0.02 },
    { s: 'ell', c: [0.02, 1.56, 0.02], rr: [0.55, 0.12, 0.55], sub: true, k: 0.02 },
    { s: 'cap', a: [0, 0, 0], b: [0.06, 1.0, 0], r: 0.12, r2: 0.09, col: stemC, k: 0.02 },
    { s: 'cap', a: [0.06, 1.0, 0], b: [0.02, 1.62, 0.02], r: 0.09, r2: 0.08, col: stemC, k: 0.02 },
    { s: 'ell', c: [0.02, 1.64, 0.02], rr: [0.46, 0.03, 0.46], col: gill, k: 0 },
    ...spots([0.02, 1.74, 0.02], [0.5, 0.2, 0.5], SP.slice(0, 7), glowC),
    ...shroom(0.2, 0, 0.15, 0.2, 0.12, C('#ff8a2a')),
  ], { ao: 1 });

  // ---------- creatures ----------
  // sporeling: a stubby walking mushroom with a face on its stem, little arms, and a spotted cap (the tint)
  P('sporeling', [
    { s: 'ell', c: [0, 0.66, 0], rr: [0.36, 0.22, 0.36], k: 0.02 },
    { s: 'ell', c: [0, 0.5, 0], rr: [0.4, 0.13, 0.4], sub: true, k: 0.02 },
    { s: 'ell', c: [0, 0.32, 0], rr: [0.2, 0.26, 0.19], col: stemC, k: 0.05 },
    { s: 'ell', c: [0, 0.56, 0], rr: [0.32, 0.03, 0.32], col: gill, k: 0 },
    ...spots([0, 0.66, 0], [0.36, 0.22, 0.36], [[1.2, 0, 0.06], [0.6, 0.8, 0.05], [0.55, 2.4, 0.055], [0.5, 4.0, 0.05], [0.45, 5.3, 0.045]]),
    ...[1, -1].flatMap(sx => [
      { s: 'sph', c: [sx * 0.07, 0.38, 0.17], r: 0.035, col: dark, k: 0 }, { s: 'sph', c: [sx * 0.065, 0.39, 0.195], r: 0.012, col: white, k: 0 },
      { s: 'cap', a: [sx * 0.17, 0.32, 0], b: [sx * 0.27, 0.22, 0.08], r: 0.045, col: stemC, k: 0.03 },
      { s: 'ell', c: [sx * 0.09, 0.04, 0.03], rr: [0.08, 0.05, 0.1], col: stemC, k: 0.03 },
    ]),
    { s: 'ell', c: [0, 0.3, 0.18], rr: [0.05, 0.025, 0.02], col: C('#8a2a3a'), k: 0 },
  ], { ao: 0.5 });
  // mothling: a fuzzy moth (the tint) with big patterned wings, feathery antennae and black eyes
  P('mothling', [
    { s: 'ell', c: [0, 0.5, -0.05], rr: [0.11, 0.11, 0.24], k: 0.05 },
    { s: 'sph', c: [0, 0.54, 0.18], r: 0.1, k: 0.05 },
    { s: 'ell', c: [0, 0.5, 0.06], rr: [0.13, 0.12, 0.08], col: white, k: 0.04 },
    ...[1, -1].flatMap(sx => [
      { s: 'ell', c: [sx * 0.33, 0.56, 0.04], rr: [0.26, 0.03, 0.2], col: C('#c8a0e8'), k: 0.02 },
      { s: 'ell', c: [sx * 0.28, 0.52, -0.2], rr: [0.18, 0.025, 0.14], col: C('#a880d0'), k: 0.02 },
      { s: 'ell', c: [sx * 0.38, 0.59, 0.05], rr: [0.08, 0.012, 0.07], col: C('#ffd23a'), k: 0 },
      { s: 'sph', c: [sx * 0.38, 0.6, 0.05], r: 0.035, col: dark, k: 0 },
      { s: 'sph', c: [sx * 0.06, 0.57, 0.26], r: 0.035, col: dark, k: 0 },
      { s: 'cap', a: [sx * 0.04, 0.62, 0.24], b: [sx * 0.14, 0.78, 0.36], r: 0.012, col: C('#7a5a3a'), k: 0 },
      { s: 'ell', c: [sx * 0.15, 0.79, 0.37], rr: [0.05, 0.02, 0.035], col: C('#7a5a3a'), k: 0 },
    ]),
  ], { ao: 0.4 });

  // ---------- the Mycelium Monarch (chapter 17 boss): a stout mushroom king with a face on its stem (the tint),
  // a huge violet cap with glowing spots, a crown of golden mushrooms, a mossy mantle, gnarled root arms
  // with fungal claws, and a frilly skirt hiding its legs ----------
  {
    const o = { ...STICK, hipY: 0.36, shY: 0.72, headY: 0.96, headR: 0.22, headZ: 0.04, shW: 0.23, hipW: 0.12, elOut: 0.07, upperLen: 0.17, foreLen: 0.16,
      pelvisR: 0.2, torso: 'ell', torsoRR: [0.27, 0.28, 0.22], neckR: 0.15, armR: 0.07, handR: 0.08, legR: 0.1, k: 0.08 };
    const m = makeHumanoid(o), J = m.J, hd = J.head, cap = C('#7a3ac8'), root = C('#5a3e2a'), gold = C('#ffc93a');
    const add = (b, ...parts) => { for (const p of parts) m.parts.push({ k: 0, ...p, bone: b }); };
    face(m, { eyeCol: COL.eyeY, mouth: 'grin', eyeY: 0.05, brows: true });
    const cc = [hd[0], hd[1] + 0.34, hd[2] - 0.02], crr = [0.66, 0.3, 0.66];
    add(2, { s: 'ell', c: cc, rr: crr, col: cap, k: 0.02 },
      { s: 'ell', c: [hd[0], hd[1] + 0.17, hd[2] - 0.02], rr: [0.6, 0.045, 0.6], col: gill },
      ...spots(cc, crr, [[1.25, 0, 0.09], [0.8, 0.5, 0.08], [0.7, 1.7, 0.09], [0.65, 2.9, 0.08], [0.6, 4.1, 0.09], [0.6, 5.3, 0.08], [0.3, 0.9, 0.07], [0.28, 2.3, 0.06], [0.3, 3.6, 0.07], [0.25, 4.8, 0.06]], C('#c8ff6a'), 2),
      ...[0, 1, 2, 3, 4].flatMap(i => { const a = i / 5 * TAU + 0.3, x = hd[0] + Math.cos(a) * 0.2, z = hd[2] - 0.02 + Math.sin(a) * 0.2; return shroom(x, cc[1] + 0.26, z, 0.08, 0.06, gold); }));
    add(1, { s: 'ell', c: [0, 0.74, -0.03], rr: [0.33, 0.12, 0.26], col: moss, k: 0.03 },
      ...[[0.22, 0.85, 0.05, 0.07], [-0.24, 0.84, -0.02, 0.06], [0.12, 0.86, -0.15, 0.05]].flatMap(([x, y, z, r]) => shroom(x, y, z, r * 0.9, r, glowC)));
    for (const sd of ['L', 'R']) {
      const b = sd === 'L' ? 3 : 5, sx = sd === 'L' ? 1 : -1, h = J['ha' + sd];
      add(b, { s: 'cap', a: J['sh' + sd], b: J['el' + sd], r: 0.075, r2: 0.065, col: root });
      add(b + 1, { s: 'cap', a: J['el' + sd], b: h, r: 0.065, r2: 0.055, col: root },
        ...[-1, 0, 1].map(i => ({ s: 'cap', a: [h[0], h[1], h[2]], b: [h[0] + sx * 0.03 + i * 0.05, h[1] - 0.14, h[2] + 0.06], r: 0.03, r2: 0.01, col: root })),
        { s: 'ell', c: [J['el' + sd][0] + sx * 0.06, J['el' + sd][1] - 0.04, J['el' + sd][2]], rr: [0.07, 0.02, 0.07], col: shelf });
    }
    add(0, { s: 'ell', c: [0, 0.3, 0], rr: [0.34, 0.24, 0.3], col: gill, k: 0.03 },
      ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU; return { s: 'cap', a: [Math.cos(a) * 0.2, 0.42, Math.sin(a) * 0.18], b: [Math.cos(a) * 0.36, 0.1, Math.sin(a) * 0.32], r: 0.05, r2: 0.03, col: C('#d0b898') }; }));
    m.top = cc[1] + 0.42; m.bmin = [-0.75, -0.03, -0.75]; m.bmax = [0.75, m.top + 0.05, 0.75]; m.name = 'monarch'; m.runAmp = 0.6; m.lean = 0.06;
    defs.monarch = m;
  }
}
