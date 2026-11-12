// ============================================================
// The Ocean Update: ships, sea folk and their clips (see 13k-ocean.js). Built with prop() / makeHumanoid().
// Ships are drawn at scale 1: model units are world units, +z is the bow, y = 0 the waterline.
// ============================================================
Object.assign(THEME_CLIPS, {
  raft: ['rock'], raft_p0: ['tilt'], raft_p1: ['tilt'], raft_p2: ['tilt'], scannon: ['still'], isle0: ['still'], isle1: ['still'],
  pswim: ['paddle', 'hack'], pfloat: ['paddle', 'hack'], ptube: ['paddle', 'hack'],
});
Object.assign(THEME_CELLS, { scannon: 0.012, isle0: 0.05, isle1: 0.05, raft: 0.016, raft_p0: 0.022, raft_p1: 0.022, raft_p2: 0.022, pswim: 0.013, pfloat: 0.013, ptube: 0.013 });
const SEA_MESHES = ['raft', 'pswim', 'scannon', 'isle0', 'isle1', 'pfloat', 'ptube', 'raft_p0', 'raft_p1', 'raft_p2'];
MESH_ORDER.push(...SEA_MESHES);

// a ship rocks gently on the swell (bone 0 about the deck's middle): one loop of a slow roll and pitch
CLIPS.rock = { frames: 32, fn(t) {
  const a = t * TAU;
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 0 ? [0.025 * Math.sin(a + 1.3), 0, 0.04 * Math.sin(a)] : [0, 0, 0])) };
} };
// a broken piece of hull keels over as it sinks (frame = how far over)
CLIPS.tilt = { frames: 16, fn(t) {
  const u = t * 16 / 15;
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 0 ? [-0.95 * u, 0, 0.4 * u] : [0, 0, 0])) };
} };
// treading water: a doggy paddle out in front, the hook arm a little higher, legs kicking under the surface
CLIPS.paddle = { frames: 32, fn(t) {
  const a = t * TAU, s = Math.sin(a), c = Math.cos(a);
  return { root: [0, 0.03 * Math.sin(2 * a), 0], rot: [
    [0.22, 0.06 * s, 0], [0.12, -0.1 * s, 0], [-0.32, 0.12 * s, 0],
    [-1.15 + 0.35 * s, 0, 0.25], [-0.55 + 0.35 * c, 0, 0],
    [-1.35 - 0.35 * s, 0, -0.25], [-0.5 - 0.35 * c, 0, 0],
    [0.45 * s, 0, 0.05], [0.45 + 0.3 * c, 0, 0], [-0.45 * s, 0, -0.05], [0.45 - 0.3 * c, 0, 0],
  ] };
} };
// clinging to a hull and hacking at it with the hook: the left hand holds on, the hook comes down hard
CLIPS.hack = { frames: 16, fn(t) {
  const up = smoothstep(0, 0.6, t), down = smoothstep(0.6, 0.78, t), rec = smoothstep(0.85, 1, t);
  const arm = (-2.7 * up + 2.2 * down) * (1 - rec) - 0.5 * rec;
  return { root: [0, -0.02 * down * (1 - rec), 0], rot: [
    [0.35, 0, 0], [0.15 + 0.25 * down * (1 - rec), 0.15 * up * (1 - rec), 0], [-0.35, 0, 0],
    [-1.55, 0, 0.1], [-0.4, 0, 0], [arm, 0, -0.15], [-0.3 * (1 - down), 0, 0],
    [0.3, 0, 0.05], [0.5, 0, 0], [-0.2, 0, -0.05], [0.4, 0, 0],
  ] };
} };

function seaModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const wood = C('#b07a45'), woodL = C('#c99358'), woodD = C('#7a4f2a'), bark = C('#8a5a30'), rope = C('#e2c98f'), ropeD = C('#b89a5e');
  const white = C('#fbf6ee'), red = C('#e8414a'), pupil = C('#16101a');

  // ---------- the raft: six lashed logs, two crossbeams, rope wraps, a life-ring pillow and a paddle ----------
  const LOGX = [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75];
  const log = (x, i) => {
    const len = 1.12 + ((i * 37) % 5) * 0.03, z0 = ((i * 53) % 7 - 3) * 0.015;
    return [
      { s: 'cyl', ax: 'z', c: [x, 0.02, z0], r: 0.15, hh: len, rd: 0.06, col: i % 2 ? wood : woodL, k: 0 },
      // cut ends: lighter rings with a darker heart
      { s: 'cyl', ax: 'z', c: [x, 0.02, z0 + len - 0.005], r: 0.118, hh: 0.012, rd: 0.004, col: C('#e8c690'), k: 0 },
      { s: 'cyl', ax: 'z', c: [x, 0.02, z0 - len + 0.005], r: 0.118, hh: 0.012, rd: 0.004, col: C('#e8c690'), k: 0 },
      { s: 'sph', c: [x, 0.02, z0 + len + 0.004], r: 0.03, col: woodD, k: 0 }, { s: 'sph', c: [x, 0.02, z0 - len - 0.004], r: 0.03, col: woodD, k: 0 },
      // a knot or two on top
      { s: 'ell', c: [x + 0.04, 0.165, z0 + 0.3 - (i % 3) * 0.35], rr: [0.035, 0.012, 0.045], col: bark, k: 0.01 },
    ];
  };
  const beams = zz => zz.flatMap(z => [
    { s: 'cyl', ax: 'x', c: [0, 0.2, z], r: 0.065, hh: 0.92, rd: 0.03, col: woodD, k: 0 },
    // rope wraps where the beam crosses every log
    ...LOGX.map(x => ({ s: 'tor', ax: 'x', c: [x + 0.11, 0.13, z], R: 0.105, r: 0.022, a0: -Math.PI, a1: Math.PI, col: rope, k: 0 })),
    ...LOGX.map(x => ({ s: 'tor', ax: 'z', c: [x + 0.11, 0.13, z], R: 0.09, r: 0.018, a0: 0, a1: Math.PI, col: ropeD, k: 0 })),
  ]);
  const ring = (c, R0, r0) => Array.from({ length: 8 }, (_, i) => ({ s: 'tor', ax: 'y', c, R: R0, r: r0, a0: (i / 8) * TAU - Math.PI, a1: ((i + 1) / 8) * TAU - Math.PI + 0.02, col: i % 2 ? white : red, k: 0 }));
  const lifeRing = [...ring([0, 0.25, -0.86], 0.24, 0.085), { s: 'tor', ax: 'y', c: [0, 0.25, -0.86], R: 0.24, r: 0.03, a0: -Math.PI, a1: Math.PI, col: C('#f4e4c4'), k: 0 }];
  const paddle = [
    { s: 'cap', a: [0.84, 0.24, -0.6], b: [0.84, 0.24, 0.5], r: 0.03, col: woodD, k: 0 },
    { s: 'ell', c: [0.84, 0.23, 0.68], rr: [0.11, 0.025, 0.2], col: woodL, k: 0.02 },
  ];
  const bottle = [
    { s: 'cap', a: [-0.84, 0.24, 0.62], b: [-0.84, 0.24, 0.88], r: 0.055, col: C('#7ad1b8'), k: 0.02 },
    { s: 'cap', a: [-0.84, 0.24, 0.88], b: [-0.84, 0.24, 0.98], r: 0.02, col: C('#7ad1b8'), k: 0.01 },
    { s: 'sph', c: [-0.84, 0.24, 0.99], r: 0.024, col: C('#a8763c'), k: 0 },
  ];
  const all = [...LOGX.flatMap(log), ...beams([-0.62, 0.62]), ...lifeRing, ...paddle, ...bottle];
  rig(P('raft', all, { ao: 0.7 }), { 0: [0, 0.05, 0] });
  // the pieces it breaks into: two logs each, with what was lashed to them
  const piece = (xs, extra) => [...LOGX.map((x, i) => [x, i]).filter(([x]) => xs.includes(x)).flatMap(([x, i]) => log(x, i)),
    ...[-0.62, 0.62].map(z => ({ s: 'cyl', ax: 'x', c: [(xs[0] + xs[1]) / 2, 0.2, z], r: 0.065, hh: 0.34, rd: 0.03, col: woodD, k: 0 })), ...extra];
  rig(P('raft_p0', piece([-0.75, -0.45], bottle), { ao: 0.7 }), { 0: [-0.6, 0.05, 0] });
  rig(P('raft_p1', piece([-0.15, 0.15], lifeRing), { ao: 0.7 }), { 0: [0, 0.05, 0] });
  rig(P('raft_p2', piece([0.45, 0.75], paddle), { ao: 0.7 }), { 0: [0.6, 0.05, 0] });

  // ---------- pirate swimmers: goo pirates treading water, a bandana (it takes the tint), an eye patch,
  // a striped shirt and a hook for a right hand ----------
  const skin = C('#f2a65a'), stripe = C('#2f5fb8'), shirt = C('#f6f1e6'), steel = C('#c8d4e0'), patch = C('#1c1820');
  const pirate = (o = {}) => {
    const m = makeHumanoid({ ...STICK, torsoR: 0.1, torsoR2: 0.11, headR: 0.165 }), J = m.J, hd = J.head;
    for (const p of m.parts) p.col = skin;
    // the shirt: white with blue rings, sleeves to the elbow
    m.parts.push({ s: 'cap', a: [0, STICK.hipY + 0.04, 0], b: [0, STICK.shY - 0.01, 0], r: 0.108, r2: 0.116, col: shirt, bone: 1, k: 0.02 });
    for (let i = 0; i < 4; i++) m.parts.push({ s: 'tor', ax: 'y', c: [0, STICK.hipY + 0.08 + i * 0.06, 0], R: 0.11 + i * 0.002, r: 0.014, a0: -Math.PI, a1: Math.PI, col: stripe, bone: 1, k: 0 });
    for (const [s, b] of [['L', 3], ['R', 5]]) m.parts.push({ s: 'cap', a: J['sh' + s], b: J['el' + s], r: 0.068, r2: 0.064, col: shirt, bone: b, k: 0.01 });
    // the bandana: a snug cap over the top of the head with a knot and two tails at the back (instance tint)
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.055, hd[2] - 0.01], rr: [0.172, 0.12, 0.178], bone: 2, k: 0.01 });
    m.parts.push({ s: 'sph', c: [hd[0], hd[1] + 0.03, hd[2] - 0.17], r: 0.04, bone: 2, k: 0.01 });
    for (const sx of [1, -1]) m.parts.push({ s: 'cap', a: [hd[0], hd[1] + 0.03, hd[2] - 0.18], b: [hd[0] + sx * 0.06, hd[1] - 0.09, hd[2] - 0.24], r: 0.028, r2: 0.012, bone: 2, k: 0.01 });
    // big friendly eyes, one under a patch
    m.parts.push({ s: 'ell', c: [hd[0] + 0.062, hd[1] + 0.01, hd[2] + 0.14], rr: [0.042, 0.05, 0.022], col: white, bone: 2, k: 0 });
    m.parts.push({ s: 'sph', c: [hd[0] + 0.064, hd[1] + 0.005, hd[2] + 0.158], r: 0.022, col: pupil, bone: 2, k: 0 });
    m.parts.push({ s: 'ell', c: [hd[0] - 0.062, hd[1] + 0.01, hd[2] + 0.145], rr: [0.05, 0.05, 0.022], col: patch, bone: 2, k: 0 });
    m.parts.push({ s: 'tor', ax: 'z', c: [hd[0], hd[1] + 0.005, hd[2] + 0.0], R: 0.168, r: 0.009, a0: 0.15, a1: 1.3, col: patch, bone: 2, k: 0 });
    // a grin and a stubby nose
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] - 0.075, hd[2] + 0.138], rr: [0.055, 0.016, 0.02], col: C('#5a1a10'), bone: 2, k: 0 });
    m.parts.push({ s: 'sph', c: [hd[0], hd[1] - 0.025, hd[2] + 0.17], r: 0.03, col: C('#ee9450'), bone: 2, k: 0.01 });
    // the hook: a steel cuff on the right wrist and a curved hook out in front
    const h = J.haR;
    m.parts = m.parts.filter(p => !(p.s === 'sph' && p.c === h));
    m.parts.push({ s: 'cyl', ax: 'y', c: [h[0], h[1] + 0.02, h[2]], r: 0.05, hh: 0.035, rd: 0.012, col: C('#6a4a2a'), bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.01, h[2]], b: [h[0], h[1] - 0.09, h[2] + 0.01], r: 0.016, col: steel, bone: 6, k: 0 });
    m.parts.push({ s: 'tor', ax: 'x', c: [h[0], h[1] - 0.14, h[2] + 0.055], R: 0.055, r: 0.015, a0: -0.4, a1: 2.6, col: steel, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.2, h[2] + 0.08], b: [h[0], h[1] - 0.17, h[2] + 0.12], r: 0.013, r2: 0.003, col: steel, bone: 6, k: 0 });
    m.crownLift = 0.08;
    if (o.floats) {
      // inflatable arm bands (armed floats): orange with a white band, on both upper arms
      for (const [s, b] of [['L', 3], ['R', 5]]) {
        const a = J['sh' + s], e = J['el' + s], c = [(a[0] + e[0]) / 2, (a[1] + e[1]) / 2, (a[2] + e[2]) / 2];
        m.parts.push({ s: 'tor', ax: 'y', c, R: 0.085, r: 0.05, a0: -Math.PI, a1: Math.PI, col: C('#ff9a2e'), bone: b, k: 0.02 });
        m.parts.push({ s: 'tor', ax: 'y', c: [c[0], c[1] + 0.005, c[2]], R: 0.088, r: 0.022, a0: -Math.PI, a1: Math.PI, col: white, bone: b, k: 0 });
      }
    }
    if (o.tube) {
      // a big inner tube round the middle (full-body float) and swim goggles pushed up on the bandana
      const y = STICK.hipY + 0.17;
      for (let i = 0; i < 6; i++) m.parts.push({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.25, r: 0.11, a0: (i / 6) * TAU - Math.PI, a1: ((i + 1) / 6) * TAU - Math.PI + 0.02, col: i % 2 ? C('#ff7eb8') : white, bone: 0, k: 0 });
      for (const sx of [1, -1]) m.parts.push({ s: 'tor', ax: 'z', c: [hd[0] + sx * 0.065, hd[1] + 0.12, hd[2] + 0.12], R: 0.04, r: 0.014, a0: -Math.PI, a1: Math.PI, col: C('#35c4e8'), bone: 2, k: 0 });
      m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] + 0.1, hd[2]], R: 0.17, r: 0.01, a0: -Math.PI, a1: Math.PI, col: C('#35c4e8'), bone: 2, k: 0 });
    }
    return m;
  };
  for (const [name, o] of [['pswim', {}], ['pfloat', { floats: true }], ['ptube', { tube: true }]]) { const m = pirate(o); m.name = name; defs[name] = m; }

  // ---------- the Homing Cannon: an iron barrel with brass bands on a little wheeled carriage, facing +z ----------
  {
    const iron = C('#3a3f4a'), ironL = C('#5a6270'), brass = C('#e0b048');
    P('scannon', [
      { s: 'box', c: [0, 0.1, -0.02], hs: [0.15, 0.07, 0.24], rd: 0.03, col: wood, k: 0 },
      { s: 'box', c: [0, 0.17, -0.1], hs: [0.12, 0.04, 0.12], rd: 0.02, col: woodD, k: 0 },
      ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].flatMap(([sx, sz]) => [
        { s: 'cyl', ax: 'x', c: [sx * 0.17, 0.075, sz * 0.15], r: 0.075, hh: 0.03, rd: 0.012, col: woodD, k: 0 },
        { s: 'cyl', ax: 'x', c: [sx * 0.195, 0.075, sz * 0.15], r: 0.025, hh: 0.012, rd: 0.005, col: iron, k: 0 }]),
      { s: 'cap', a: [0, 0.25, -0.22], b: [0, 0.28, 0.42], r: 0.1, r2: 0.072, col: iron, k: 0.02 },
      { s: 'sph', c: [0, 0.245, -0.27], r: 0.055, col: ironL, k: 0.02 },
      { s: 'tor', ax: 'z', c: [0, 0.28, 0.42], R: 0.072, r: 0.026, a0: -Math.PI, a1: Math.PI, col: ironL, k: 0 },
      { s: 'cyl', ax: 'z', c: [0, 0.28, 0.44], r: 0.05, hh: 0.03, rd: 0.005, col: C('#14161c'), sub: true, k: 0 },
      { s: 'tor', ax: 'z', c: [0, 0.255, -0.05], R: 0.097, r: 0.016, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 },
      { s: 'tor', ax: 'z', c: [0, 0.265, 0.2], R: 0.087, r: 0.014, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 },
      ...[1, -1].map(sx => ({ s: 'cyl', ax: 'x', c: [sx * 0.105, 0.25, -0.05], r: 0.03, hh: 0.02, rd: 0.005, col: iron, k: 0 })),
    ], { ao: 0.6 });
  }

  // ---------- islands (radius 4; drawn at radius / 4): a sandy mound under a grassy top with a few flowers ----------
  {
    const sand = C('#f2dc9a'), sandD = C('#e2c47a'), grass = C('#6cc34a'), grassD = C('#4fa63a');
    const flowers = (n, rr, seed) => Array.from({ length: n }, (_, i) => { const a = i * 2.4 + seed, d = rr * (0.3 + ((i * 37) % 10) / 14); return { s: 'sph', c: [Math.cos(a) * d, 0.62, Math.sin(a) * d], r: 0.09, col: [C('#ff6fa8'), C('#ffd34a'), C('#fff6e6')][i % 3], k: 0.02 }; });
    P('isle0', [
      { s: 'ell', c: [0, -0.25, 0], rr: [4.0, 0.8, 4.0], col: sand, k: 0.3 },
      { s: 'ell', c: [0.6, -0.1, -0.4], rr: [2.6, 0.62, 2.4], col: sandD, k: 0.6 },
      { s: 'ell', c: [0, 0.2, 0], rr: [2.9, 0.42, 2.8], col: grass, k: 0.4 },
      { s: 'ell', c: [-0.8, 0.35, 0.5], rr: [1.4, 0.35, 1.2], col: grassD, k: 0.5 },
      ...flowers(9, 2.2, 0.3),
    ], { ao: 0.4 });
    P('isle1', [
      { s: 'ell', c: [0, -0.25, 0], rr: [4.0, 0.8, 3.0], col: sand, k: 0.3 },
      { s: 'ell', c: [-1.6, -0.15, 0.6], rr: [2.2, 0.62, 2.0], col: sand, k: 0.5 },
      { s: 'ell', c: [1.0, 0.2, -0.2], rr: [2.3, 0.45, 1.9], col: grass, k: 0.4 },
      { s: 'ell', c: [-1.6, 0.22, 0.6], rr: [1.4, 0.38, 1.3], col: grassD, k: 0.4 },
      ...flowers(7, 1.6, 1.1),
    ], { ao: 0.4 });
  }
}
