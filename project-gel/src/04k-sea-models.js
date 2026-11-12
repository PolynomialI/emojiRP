// ============================================================
// The Ocean Update: ships, sea folk and their clips (see 13k-ocean.js). Built with prop() / makeHumanoid().
// Ships are drawn at scale 1: model units are world units, +z is the bow, y = 0 the waterline.
// ============================================================
Object.assign(THEME_CLIPS, {
  raft: ['rock'], raft_p0: ['tilt'], raft_p1: ['tilt'], raft_p2: ['tilt'], scannon: ['still'], isle0: ['still'], isle1: ['still'],
  pswim: ['paddle', 'hack'], pfloat: ['paddle', 'hack'], ptube: ['paddle', 'hack'], phat: ['paddle', 'hack'], pdiver: ['paddle', 'hack'], pbomb: ['paddle'], pparka: ['paddle', 'hack'],
  pmusket: ['idle', 'aim'], pcapt: ['idle', 'throw', 'slam', 'run'],
});
const SEA_ISLES = ['icoral', 'ikelp', 'ihut', 'iice', 'ivolc', 'ighost', 'ispire', 'iwreck', 'ifort'];
for (const id of SEA_ISLES) { THEME_CLIPS[id] = ['still']; THEME_CELLS[id] = 0.1; }
Object.assign(THEME_CELLS, { scannon: 0.016, isle0: 0.1, isle1: 0.1, raft: 0.024, raft_p0: 0.032, raft_p1: 0.032, raft_p2: 0.032, pswim: 0.017, pfloat: 0.017, ptube: 0.018, phat: 0.017, pdiver: 0.017, pbomb: 0.017, pparka: 0.017, pmusket: 0.016, pcapt: 0.015 });
const SEA_MESHES = ['raft', 'pswim', 'scannon', 'isle0', 'isle1', 'pfloat', 'ptube', 'raft_p0', 'raft_p1', 'raft_p2'];
// the rest of the sea's folk (needed from chapter 2 on, or for minibosses)
const SEA_FOLK = ['phat', 'pdiver', 'pbomb', 'pparka', 'pmusket', 'pcapt'];
MESH_ORDER.push(...SEA_MESHES, ...SEA_FOLK, ...SEA_ISLES);

// a ship rocks gently on the swell (bone 0 about the deck's middle): one loop of a slow roll and pitch
// (the bigger the ship, the less: m.rockAmp)
CLIPS.rock = { frames: 32, fn(t, m) {
  const a = t * TAU, k = m.rockAmp || 0.04;
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 0 ? [0.6 * k * Math.sin(a + 1.3), 0, k * Math.sin(a)] : [0, 0, 0])) };
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
      { s: 'cyl', ax: 'z', c: [x, 0.02, z0], r: 0.15, hh: len, rd: 0.06, col: i % 2 ? wood : woodL, paint: true, k: 0 },
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
    ...LOGX.filter((_, i) => i % 2 === 0).map(x => ({ s: 'tor', ax: 'x', c: [x + 0.15, 0.13, z], R: 0.1, r: 0.03, a0: -Math.PI, a1: Math.PI, col: rope, k: 0 })),
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
    // (a swimmer's shins and feet are always under water)
    if (!o.full) m.parts = m.parts.filter(p => !(p.bone === 8 || p.bone === 10));
    // another hat instead of the bandana: drop the bandana's three parts (a cap, a knot, two tails)
    const bandana = m.parts.filter(p => p.bone === 2 && !p.col);
    if (o.hat) m.parts = m.parts.filter(p => !bandana.includes(p));
    if (o.hat === 'tricorn') {
      // a black tricorn with gold trim, three corners turned up
      const y = hd[1] + 0.1, sc = o.big ? 1.25 : 0.82;
      m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.06, hd[2]], rr: [0.172, 0.12, 0.178], col: C('#1e1a24'), bone: 2, k: 0.01 });
      m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], y + 0.04, hd[2]], r: 0.13 * sc, hh: 0.07 * sc, rd: 0.05, col: C('#1e1a24'), bone: 2, k: 0.02 });
      for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + (i / 3) * TAU, a2 = a + TAU / 3; m.parts.push({ s: 'cap', a: [hd[0] + Math.cos(a) * 0.26 * sc, y + 0.05, hd[2] + Math.sin(a) * 0.26 * sc], b: [hd[0] + Math.cos(a2) * 0.26 * sc, y + 0.05, hd[2] + Math.sin(a2) * 0.26 * sc], r: 0.04 * sc, col: C('#1e1a24'), bone: 2, k: 0.03 }); }
      for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + (i / 3) * TAU; m.parts.push({ s: 'sph', c: [hd[0] + Math.cos(a) * 0.27 * sc, y + 0.08, hd[2] + Math.sin(a) * 0.27 * sc], r: 0.03 * sc, col: C('#e8b84a'), bone: 2, k: 0 }); }
      if (o.big) for (let i = 0; i < 5; i++) { const u = i / 4; m.parts.push({ s: 'sph', c: [hd[0] - 0.12 + u * 0.05, y + 0.12 + Math.sin(u * 2.4) * 0.1, hd[2] - 0.05 - u * 0.25], r: 0.05 - u * 0.02, col: C('#ff5a6a'), bone: 2, k: 0.03 }); }
    } else if (o.hat === 'parka') {
      // a fur-lined parka hood (the hood takes the tint) and a knitted scarf
      m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.03, hd[2] - 0.03], rr: [0.21, 0.21, 0.2], bone: 2, k: 0.02 });
      m.parts.push({ s: 'ell', c: [hd[0], hd[1] - 0.01, hd[2] + 0.12], rr: [0.15, 0.15, 0.1], sub: true, bone: 2, k: 0.02 });
      m.parts.push({ s: 'tor', ax: 'z', c: [hd[0], hd[1] - 0.01, hd[2] + 0.13], R: 0.15, r: 0.045, a0: -Math.PI, a1: Math.PI, col: C('#f4ecdc'), bone: 2, k: 0.02 });
      m.parts.push({ s: 'tor', ax: 'y', c: [0, STICK.shY + 0.02, 0.01], R: 0.1, r: 0.045, a0: -Math.PI, a1: Math.PI, col: C('#e8414a'), bone: 1, k: 0.02 });
    } else if (o.hat === 'cap') {
      // a swim cap (tint) with a diving mask and a yellow snorkel
      m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.04, hd[2] - 0.01], rr: [0.175, 0.14, 0.18], bone: 2, k: 0.01 });
      m.parts.push({ s: 'box', c: [hd[0], hd[1] + 0.01, hd[2] + 0.15], hs: [0.12, 0.06, 0.03], rd: 0.03, col: C('#9fe6ff'), bone: 2, k: 0 });
      m.parts.push({ s: 'tor', ax: 'z', c: [hd[0], hd[1] + 0.01, hd[2] + 0.02], R: 0.17, r: 0.014, a0: -Math.PI, a1: Math.PI, col: C('#2a2e38'), bone: 2, k: 0 });
      m.parts.push({ s: 'cap', a: [hd[0] + 0.15, hd[1] - 0.06, hd[2] + 0.1], b: [hd[0] + 0.17, hd[1] + 0.3, hd[2] + 0.05], r: 0.022, col: C('#ffd34a'), bone: 2, k: 0 });
      m.parts.push({ s: 'cap', a: [hd[0] + 0.15, hd[1] - 0.06, hd[2] + 0.1], b: [hd[0] + 0.03, hd[1] - 0.08, hd[2] + 0.17], r: 0.02, col: C('#ffd34a'), bone: 2, k: 0 });
    }
    if (o.coat) {
      // a long coat over the shirt (it takes the tint), gold buttons, cuffs
      m.parts = m.parts.filter(p => !(p.bone === 1 && p.col === stripe));
      m.parts.push({ s: 'cap', a: [0, STICK.hipY - 0.05, 0], b: [0, STICK.shY - 0.01, 0], r: 0.12, r2: 0.124, bone: 1, k: 0.02 });
      for (const [s, b] of [['L', 3], ['R', 5]]) m.parts.push({ s: 'cap', a: J['sh' + s], b: J['el' + s], r: 0.072, r2: 0.068, bone: b, k: 0.01 });
      for (let i = 0; i < 3; i++) m.parts.push({ s: 'sph', c: [0, STICK.hipY + 0.06 + i * 0.07, 0.122], r: 0.018, col: C('#e8b84a'), bone: 1, k: 0 });
      if (o.full) m.parts.push({ s: 'cap', a: [0, STICK.hipY - 0.02, -0.02], b: [0, STICK.hipY - 0.26, -0.06], r: 0.13, r2: 0.15, bone: 0, k: 0.03 });
    }
    if (o.cutlass) {
      const hl = J.haL;
      m.parts.push({ s: 'cap', a: [hl[0], hl[1] - 0.02, hl[2] - 0.02], b: [hl[0], hl[1] - 0.02, hl[2] + 0.06], r: 0.03, col: C('#e8b84a'), bone: 4, k: 0 });
      m.parts.push({ s: 'cap', a: [hl[0], hl[1] - 0.02, hl[2] + 0.06], b: [hl[0], hl[1] + 0.06, hl[2] + 0.42], r: 0.03, r2: 0.012, col: steel, bone: 4, k: 0 });
    }
    if (o.keg) {
      // a floating powder keg pushed along in front, its fuse fizzing
      m.parts.push({ s: 'cyl', ax: 'x', c: [0, STICK.hipY + 0.13, 0.38], r: 0.15, hh: 0.17, rd: 0.05, col: C('#c0382c'), bone: 0, k: 0 });
      for (const x of [-0.11, 0.11]) m.parts.push({ s: 'tor', ax: 'x', c: [x, STICK.hipY + 0.13, 0.38], R: 0.15, r: 0.014, a0: -Math.PI, a1: Math.PI, col: C('#3a3f4a'), bone: 0, k: 0 });
      m.parts.push({ s: 'cap', a: [0, STICK.hipY + 0.27, 0.38], b: [0.03, STICK.hipY + 0.37, 0.4], r: 0.012, col: C('#3a2a1a'), bone: 0, k: 0 });
      m.parts.push({ s: 'sph', c: [0.035, STICK.hipY + 0.39, 0.4], r: 0.026, col: C('#ffd34a'), bone: 0, k: 0 });
    }
    if (o.musket) {
      // a long musket along the right forearm (pointing ahead when aimed)
      const hr = J.haR;
      m.parts = m.parts.filter(p => !(p.bone === 6 && p.col === steel) && !(p.s === 'cyl' && p.bone === 6));
      m.parts.push({ s: 'sph', c: hr, r: STICK.handR, col: skin, bone: 6, k: 0.03 });
      m.parts.push({ s: 'box', c: [hr[0], hr[1] - 0.05, hr[2] - 0.02], hs: [0.025, 0.09, 0.04], rd: 0.012, col: C('#7a4a26'), bone: 6, k: 0 });
      m.parts.push({ s: 'cap', a: [hr[0], hr[1] - 0.12, hr[2]], b: [hr[0], hr[1] - 0.52, hr[2] + 0.02], r: 0.018, col: C('#3a3f4a'), bone: 6, k: 0 });
      m.gun = 2;
    }
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
      for (let i = 0; i < 4; i++) m.parts.push({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.25, r: 0.11, a0: (i / 4) * TAU - Math.PI, a1: ((i + 1) / 4) * TAU - Math.PI + 0.02, col: i % 2 ? C('#ff7eb8') : white, bone: 0, k: 0 });
      for (const sx of [1, -1]) m.parts.push({ s: 'tor', ax: 'z', c: [hd[0] + sx * 0.065, hd[1] + 0.12, hd[2] + 0.12], R: 0.04, r: 0.014, a0: -Math.PI, a1: Math.PI, col: C('#35c4e8'), bone: 2, k: 0 });
      m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] + 0.1, hd[2]], R: 0.17, r: 0.01, a0: -Math.PI, a1: Math.PI, col: C('#35c4e8'), bone: 2, k: 0 });
    }
    if (o.weed) {
      // a weed-tangled swimmer: kelp hanging off the shoulders and round the head (not over the face), barnacles
      for (const [s2, b] of [['L', 3], ['R', 5]]) { const a = J['sh' + s2]; m.parts.push({ s: 'cap', a: [a[0], a[1] + 0.03, a[2]], b: [a[0] * 1.35, a[1] - 0.24, a[2] - 0.05], r: 0.045, r2: 0.018, col: C('#3a7a2a'), bone: 1, k: 0.02 }); }
      [0.9, 1.2, 1.5, 1.8, 2.1].forEach((u, i) => { const a = u * Math.PI; m.parts.push({ s: 'cap', a: [hd[0] + Math.cos(a) * 0.12, hd[1] + 0.12, hd[2] + Math.sin(a) * 0.12], b: [hd[0] + Math.cos(a) * 0.21, hd[1] - 0.12 - (i % 2) * 0.07, hd[2] + Math.sin(a) * 0.21], r: 0.035, r2: 0.014, col: i % 2 ? C('#4a8a3a') : C('#2e6a2a'), bone: 2, k: 0.02 }); });
      for (const [x, y, z] of [[0.06, 0.62, 0.1], [-0.08, 0.7, 0.09], [0.02, 0.56, -0.1]]) m.parts.push({ s: 'sph', c: [x, y, z], r: 0.024, col: C('#d8d0c0'), bone: 1, k: 0 });
    }
    if (o.mer) {
      // a merfolk soldier: a teal scale tunic, fin ears, a spiked golden crown, a trident in the left hand
      const teal = C('#2ab8a8'), tealD = C('#178a80'), goldC = C('#e8b84a');
      m.parts = m.parts.filter(p => !(p.bone === 1 && p.col === stripe) && p.col !== shirt);
      m.parts.push({ s: 'cap', a: [0, STICK.hipY + 0.04, 0], b: [0, STICK.shY - 0.01, 0], r: 0.11, r2: 0.118, col: teal, bone: 1, k: 0.02 });
      for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) { const a = j * 1.26 + i * 0.63; m.parts.push({ s: 'sph', c: [Math.sin(a) * 0.112, STICK.hipY + 0.1 + i * 0.07, Math.cos(a) * 0.112], r: 0.024, col: tealD, bone: 1, k: 0.01 }); }
      for (const sx of [1, -1]) m.parts.push({ s: 'ell', c: [hd[0] + sx * 0.17, hd[1], hd[2] - 0.02], rr: [0.02, 0.09, 0.07], col: teal, bone: 2, k: 0.02 });
      m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] + 0.12, hd[2]], R: 0.14, r: 0.025, a0: -Math.PI, a1: Math.PI, col: goldC, bone: 2, k: 0 });
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; m.parts.push({ s: 'cap', a: [hd[0] + Math.cos(a) * 0.14, hd[1] + 0.12, hd[2] + Math.sin(a) * 0.14], b: [hd[0] + Math.cos(a) * 0.15, hd[1] + 0.23, hd[2] + Math.sin(a) * 0.15], r: 0.022, r2: 0.005, col: goldC, bone: 2, k: 0 }); }
      const hl = J.haL;
      m.parts.push({ s: 'cap', a: [hl[0], hl[1] - 0.25, hl[2] - 0.05], b: [hl[0], hl[1] + 0.5, hl[2] + 0.1], r: 0.017, col: goldC, bone: 4, k: 0 });
      m.parts.push({ s: 'cap', a: [hl[0] - 0.07, hl[1] + 0.48, hl[2] + 0.1], b: [hl[0] + 0.07, hl[1] + 0.48, hl[2] + 0.1], r: 0.013, col: goldC, bone: 4, k: 0 });
      for (const dx of [-0.07, 0, 0.07]) m.parts.push({ s: 'cap', a: [hl[0] + dx, hl[1] + 0.48, hl[2] + 0.1], b: [hl[0] + dx * 1.15, hl[1] + 0.68, hl[2] + 0.13], r: 0.013, r2: 0.003, col: C('#ffd34a'), bone: 4, k: 0 });
    }
    if (o.hat === 'pilot') {
      // a lost pilot: an old leather flying cap (tint) with ear flaps, goggles up on the brow, a long white scarf
      m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.045, hd[2] - 0.01], rr: [0.178, 0.135, 0.18], bone: 2, k: 0.01 });
      for (const sx of [1, -1]) m.parts.push({ s: 'ell', c: [hd[0] + sx * 0.16, hd[1] - 0.06, hd[2] - 0.01], rr: [0.04, 0.09, 0.07], bone: 2, k: 0.01 });
      for (const sx of [1, -1]) { m.parts.push({ s: 'tor', ax: 'z', c: [hd[0] + sx * 0.07, hd[1] + 0.1, hd[2] + 0.13], R: 0.045, r: 0.016, a0: -Math.PI, a1: Math.PI, col: C('#c8a050'), bone: 2, k: 0 }); m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.07, hd[1] + 0.1, hd[2] + 0.13], r: 0.035, col: C('#9fe6ff'), bone: 2, k: 0 }); }
      m.parts.push({ s: 'tor', ax: 'y', c: [0, STICK.shY + 0.02, 0.01], R: 0.1, r: 0.04, a0: -Math.PI, a1: Math.PI, col: C('#f8f4ec'), bone: 1, k: 0.02 });
      m.parts.push({ s: 'cap', a: [0.05, STICK.shY + 0.01, -0.08], b: [0.15, STICK.shY - 0.25, -0.24], r: 0.04, r2: 0.03, col: C('#f8f4ec'), bone: 1, k: 0.02 });
    }
    if (o.skel) {
      // a skeleton pirate: bone white, dark eye sockets with a green glint, a toothy jaw, ribs through a torn shirt
      const boneC = C('#efe8d4'), hole = C('#14101a');
      for (const p of m.parts) if (p.col === skin) p.col = boneC;
      m.parts = m.parts.filter(p => !(p.bone === 2 && p.c && p.c[2] > hd[2] + 0.12) && !(p.s === 'tor' && p.ax === 'z' && p.col === patch) && !(p.bone === 1 && p.col === stripe));
      for (const sx of [1, -1]) { m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.062, hd[1] + 0.01, hd[2] + 0.12], r: 0.05, col: hole, bone: 2, k: 0.01 }); m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.062, hd[1] + 0.01, hd[2] + 0.155], r: 0.018, col: C('#7affa8'), bone: 2, k: 0 }); }
      m.parts.push({ s: 'sph', c: [hd[0], hd[1] - 0.045, hd[2] + 0.15], r: 0.022, col: hole, bone: 2, k: 0 });
      m.parts.push({ s: 'box', c: [hd[0], hd[1] - 0.1, hd[2] + 0.13], hs: [0.07, 0.025, 0.02], rd: 0.01, col: hole, bone: 2, k: 0 });
      for (let i = 0; i < 4; i++) m.parts.push({ s: 'box', c: [hd[0] - 0.045 + i * 0.03, hd[1] - 0.1, hd[2] + 0.148], hs: [0.011, 0.018, 0.006], rd: 0.003, col: boneC, bone: 2, k: 0 });
      for (const p of m.parts) if (p.bone === 1 && p.col === shirt) p.col = C('#3a3438');
      for (let i = 0; i < 3; i++) m.parts.push({ s: 'tor', ax: 'y', c: [0, STICK.hipY + 0.12 + i * 0.065, 0], R: 0.112, r: 0.012, a0: -0.4, a1: Math.PI + 0.4, col: boneC, bone: 1, k: 0 });
    }
    if (o.balloon) {
      // a sky pirate hanging under a big balloon (it takes the tint) by two ropes, arms up holding on
      const top = STICK.headY + 1.15;
      m.parts.push({ s: 'sph', c: [0, top + 0.35, 0], r: 0.5, bone: 0, k: 0 });
      m.parts.push({ s: 'ell', c: [-0.17, top + 0.55, 0.32], rr: [0.11, 0.15, 0.05], col: C('#ffffff'), bone: 0, k: 0.04 });
      m.parts.push({ s: 'cap', a: [0, top - 0.12, 0], b: [0, top - 0.21, 0], r: 0.06, r2: 0.03, bone: 0, k: 0.02 });
      for (const sx of [1, -1]) m.parts.push({ s: 'cap', a: [sx * 0.14, STICK.headY + 0.42, 0.02], b: [0, top - 0.19, 0], r: 0.008, col: C('#f4ecdc'), bone: 0, k: 0 });
    }
    if (o.skin) for (const p of m.parts) if (p.col === skin) p.col = o.skin;
    return m;
  };
  for (const [name, o] of [['pweed', { weed: true }], ['pmer', { mer: true, hat: 'crown', skin: C('#8ad8d0') }], ['pblink', { hat: 'pilot' }], ['pskel', { skel: true }], ['pballoon', { balloon: true, full: true }], ['pswim', {}], ['pfloat', { floats: true }], ['ptube', { tube: true }], ['phat', { hat: 'tricorn', coat: true, cutlass: true }], ['pdiver', { hat: 'cap' }],
    ['pbomb', { keg: true }], ['pparka', { hat: 'parka' }], ['pmusket', { hat: 'tricorn', musket: true, full: true }], ['pcapt', { hat: 'tricorn', big: true, coat: true, cutlass: true, full: true }]]) { const m = pirate(o); m.name = name; defs[name] = m; }

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
    const flowers = (n, rr, seed) => Array.from({ length: n }, (_, i) => { const a = i * 2.4 + seed, d = rr * (0.3 + ((i * 37) % 10) / 14); return { s: 'sph', c: [Math.cos(a) * d, 0.62, Math.sin(a) * d], r: 0.16, col: [C('#ff6fa8'), C('#ffd34a'), C('#fff6e6')][i % 3], k: 0.02 }; });
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

  // ---------- themed islands for the later chapters (radius 4 at scale 1, drawn at radius / 4) ----------
  {
    const sand = C('#f2dc9a'), sandD = C('#e2c47a'), rockG = C('#7a7a72'), rockD = C('#4a4a50');
    const mound = (col, h = 0.8) => ({ s: 'ell', c: [0, -0.25, 0], rr: [4.0, h, 4.0], col, k: 0.3 });
    const crag = (c, r, seed, col, sc) => ({ s: 'crag', c, r, seed, n: 10, col, sc, k: 0.15 });
    // a natural rocky mass: a big lumpy dome ringed by smaller lumpy boulders, all blended (H: how high its top
    // stands; two rock colors so the boulders read apart), and pebbles: little faceted rocks round the shore
    const rockMass = (seed, R, H, col, col2, bump = 0.05) => {
      const out = [{ s: 'rock', c: [0, H - R * 1.05, 0], r: R * 1.05, bump, col, k: 0.6 }];
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + seed, d = R * (0.95 + 0.25 * ((i * 7 + seed) % 3) / 2), r = R * (0.5 + 0.15 * ((i * 5 + seed) % 4) / 3);
        out.push({ s: 'rock', c: [Math.cos(a) * d, H * 0.55 - r * 0.9, Math.sin(a) * d], r, bump: bump * 1.2, col: i % 2 ? col2 : col, k: 0.55 });
      }
      return out;
    };
    const pebbles = (n, R, col, seed) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU + seed * 0.7, d = R * (0.85 + 0.15 * (i % 2)); return { s: 'crag', c: [Math.cos(a) * d, 0.05, Math.sin(a) * d], r: 0.32 + 0.12 * ((i + seed) % 3), seed: seed * 10 + i, n: 8, col, k: 0.08 }; });
    // coral cove: a sand bar studded with pink and orange coral and a big shell
    const coralB = (x, z, col, h) => [0, 1, 2, 3].map(i => { const a = i * 1.7 + x; return { s: 'cap', a: [x, 0.3, z], b: [x + Math.cos(a) * 0.5, 0.3 + h * (0.6 + 0.15 * i), z + Math.sin(a) * 0.5], r: 0.2, r2: 0.12, col, k: 0.15 }; });
    P('icoral', [mound(sand, 0.7), { s: 'ell', c: [0.8, 0.05, 0.5], rr: [2.4, 0.4, 2.2], col: sandD, k: 0.5 },
      ...coralB(-1.2, 0.6, C('#ff7aa8'), 1.2), ...coralB(1.0, -1.0, C('#ff9a4a'), 1.0), ...coralB(0.4, 1.4, C('#c86aff'), 0.9),
      { s: 'ell', c: [-0.5, 0.45, -1.4], rr: [0.6, 0.35, 0.5], col: C('#fff0e0'), k: 0.1 }], { ao: 0.4 });
    // kelp narrows: a mossy rock with tall kelp swaying round it
    const kelp = (x, z, h) => [{ s: 'cap', a: [x, 0, z], b: [x + 0.2, h, z - 0.1], r: 0.16, r2: 0.1, col: C('#4a8a3a'), k: 0.05 },
      ...[0.35, 0.6, 0.85].map(u => ({ s: 'ell', c: [x + 0.2 * u + 0.25, h * u, z - 0.1 * u], rr: [0.35, 0.1, 0.18], col: C('#6aa84a'), k: 0.05 }))];
    P('ikelp', [mound(C('#c8b47a'), 0.6), ...rockMass(3, 2.0, 1.1, rockG, C('#686a62')), { s: 'ell', c: [0, 1.15, 0], rr: [1.7, 0.45, 1.5], col: C('#5a8a4a'), k: 0.5 },
      ...pebbles(5, 3.0, rockG, 3), ...kelp(2.4, 1.2, 2.6), ...kelp(-2.6, 0.4, 3.0), ...kelp(1.0, -2.6, 2.2), ...kelp(-1.4, 2.4, 2.4)], { ao: 0.45 });
    // smugglers' strait: a sandy island with a stilt hut, crates and a pirate flag (musket pirates come out of it)
    P('ihut', [mound(sand), { s: 'ell', c: [0, 0.2, 0], rr: [2.9, 0.42, 2.8], col: C('#6cc34a'), k: 0.4 },
      ...[[-0.9, -0.7], [0.9, -0.7], [-0.9, 0.7], [0.9, 0.7]].map(([x, z]) => ({ s: 'cap', a: [x, 0.3, z], b: [x, 1.3, z], r: 0.12, col: C('#7a4f2a'), k: 0 })),
      { s: 'box', c: [0, 1.75, 0], hs: [1.15, 0.5, 0.95], rd: 0.06, col: C('#a8693a'), k: 0 },
      { s: 'gable', c: [0, 2.2, 0], w: 1.45, h: 0.9, hh: 1.2, ax: 'z', col: C('#c8a050'), k: 0 },
      { s: 'box', c: [0, 1.6, 0.97], hs: [0.32, 0.4, 0.04], rd: 0.03, col: C('#2a1c16'), k: 0 },
      { s: 'cap', a: [1.0, 2.6, -0.8], b: [1.0, 3.9, -0.8], r: 0.07, col: C('#5e3a20'), k: 0 },
      { s: 'box', c: [1.0, 3.65, -1.25], hs: [0.04, 0.25, 0.42], rd: 0.02, col: C('#1e2230'), k: 0 },
      { s: 'sph', c: [1.05, 3.68, -1.25], r: 0.14, col: C('#f4ecdc'), k: 0 },
      ...[[1.6, 1.2], [1.95, 0.75], [-1.7, 1.0]].map(([x, z]) => ({ s: 'box', c: [x, 0.62, z], hs: [0.3, 0.3, 0.3], rd: 0.04, col: C('#b07a45'), k: 0 }))], { ao: 0.5 });
    // glacier bay: an iceberg: stacked rounded blocks of blue-white ice, sharp shards standing up, snowdrifts on top
    // and a darker blue band where the water laps at it
    const iceA = C('#bfe6f6'), iceB = C('#a8d8f0'), iceD = C('#7ab8dc');
    P('iice', [{ s: 'ell', c: [0, -0.15, 0], rr: [3.9, 0.45, 3.7], col: iceD, k: 0.3 }, ...rockMass(7, 2.2, 1.8, iceA, iceB, 0.015),
      { s: 'rock', c: [1.1, 1.6, -0.7], r: 1.0, bump: 0.02, col: iceA, k: 0.45 },
      ...[[2.2, 0.6, 0.4, 1.0], [-2.0, 0.5, -1.2, 0.8], [0.2, 0.6, 2.4, 0.9]].map(([x, y, z, h], i) => ({ s: 'crag', c: [x, y, z], r: 0.7, seed: 60 + i, n: 9, sc: [1, h, 1], col: i % 2 ? iceA : C('#d8f2ff'), k: 0.15 })),
      ...[[0.9, 2.3, -0.6, 1.5], [-1.2, 1.4, 0.9, 1.1], [1.9, 0.9, 1.2, 0.9], [-0.4, 2.0, -1.4, 1.2]].map(([x, y, z, h], i) => ({ s: 'crag', c: [x, y, z], r: 0.55, seed: 40 + i, n: 7, sc: [0.6, h * 1.4, 0.6], col: i % 2 ? C('#e6f6ff') : iceB, k: 0.1 })),
      { s: 'ell', c: [0.3, 1.85, 0.2], rr: [1.7, 0.32, 1.5], col: C('#ffffff'), k: 0.4 }, { s: 'ell', c: [-1.5, 1.05, 1.0], rr: [1.0, 0.25, 0.9], col: C('#ffffff'), k: 0.35 },
      { s: 'ell', c: [1.9, 0.75, -1.4], rr: [0.9, 0.22, 0.8], col: C('#ffffff'), k: 0.35 },
      ...pebbles(6, 3.3, iceB, 7)], { ao: 0.3 });
    // volcano atoll: black lumpy rock rising to a cone with a glowing crater, lava rivers down two sides, ash on the
    // shoulders and glowing cracks round the shore
    const basalt = C('#3a3438'), basalt2 = C('#2a2428'), lava = C('#ff6a1a'), lavaL = C('#ffb02a');
    P('ivolc', [{ s: 'ell', c: [0, -0.2, 0], rr: [3.9, 0.5, 3.9], col: basalt2, k: 0.3 }, ...rockMass(5, 2.0, 1.2, basalt, basalt2, 0.06),
      { s: 'cap', a: [0, 0.6, 0], b: [0, 3.0, 0], r: 2.1, r2: 0.95, col: C('#2e282c'), k: 0.7 },
      { s: 'cyl', ax: 'y', c: [0, 3.2, 0], r: 0.75, hh: 0.35, rd: 0.15, sub: true, k: 0.15 },
      { s: 'cyl', ax: 'y', c: [0, 2.78, 0], r: 0.8, hh: 0.1, rd: 0.06, col: lava, k: 0 }, { s: 'sph', c: [0.1, 2.86, -0.1], r: 0.3, col: lavaL, k: 0.1 },
      ...[[0.5, 0.4, 2.0, 1.7], [-0.6, -0.3, -1.9, -1.4]].flatMap(([x0, z0, x1, z1]) => [
        { s: 'cap', a: [x0, 2.7, z0], b: [(x0 + x1) * 0.6, 1.6, (z0 + z1) * 0.6], r: 0.2, col: lava, k: 0.08 },
        { s: 'cap', a: [(x0 + x1) * 0.6, 1.6, (z0 + z1) * 0.6], b: [x1, 0.35, z1], r: 0.22, r2: 0.3, col: lavaL, k: 0.08 }]),
      ...pebbles(7, 3.2, basalt, 5), ...[0.7, 2.5, 4.4].map((a, i) => ({ s: 'cap', a: [Math.cos(a) * 3.0, 0.15, Math.sin(a) * 3.0], b: [Math.cos(a + 0.25) * 3.4, 0.1, Math.sin(a + 0.25) * 3.4], r: 0.08, col: lava, k: 0.04 }))], { ao: 0.45 });
    // ghost fog: a dark mossy rock, a twisted dead tree, leaning tombstones, an iron fence and a lantern
    const slate = C('#4a4650'), slate2 = C('#3a3840'), moss = C('#5a6a5a'), deadW = C('#3a3030');
    P('ighost', [{ s: 'ell', c: [0, -0.2, 0], rr: [3.8, 0.5, 3.8], col: slate2, k: 0.3 }, ...rockMass(9, 2.0, 1.0, slate, slate2),
      { s: 'ell', c: [0, 0.95, 0], rr: [2.2, 0.32, 2.0], col: moss, k: 0.5 }, { s: 'ell', c: [-1.6, 0.55, 1.2], rr: [1.0, 0.25, 0.9], col: C('#4a5a4a'), k: 0.4 },
      { s: 'cap', a: [-0.6, 1.0, -0.4], b: [-0.4, 3.2, -0.2], r: 0.24, r2: 0.12, col: deadW, k: 0.06 },
      { s: 'cap', a: [-0.45, 2.4, -0.25], b: [0.7, 3.3, 0.1], r: 0.11, r2: 0.05, col: deadW, k: 0.05 },
      { s: 'cap', a: [0.7, 3.3, 0.1], b: [1.1, 3.1, 0.5], r: 0.05, r2: 0.03, col: deadW, k: 0.03 },
      { s: 'cap', a: [-0.45, 2.7, -0.25], b: [-1.4, 3.5, -0.6], r: 0.1, r2: 0.04, col: deadW, k: 0.05 },
      { s: 'cap', a: [-1.4, 3.5, -0.6], b: [-1.7, 3.3, -1.0], r: 0.04, r2: 0.02, col: deadW, k: 0.03 },
      ...[[1.2, 0.6, 0.15], [0.6, 1.5, -0.2], [1.8, -0.4, 0.3], [-1.3, -1.2, -0.25]].flatMap(([x, z, t]) => [
        { s: 'box', c: [x, 1.25, z], hs: [0.3, 0.42, 0.09], rd: 0.12, col: C('#9a9aa4'), k: 0 },
        { s: 'box', c: [x, 1.35, z + 0.095], hs: [0.12, 0.03, 0.01], rd: 0.01, col: C('#6a6a74'), k: 0 }]),
      ...Array.from({ length: 7 }, (_, i) => ({ s: 'cap', a: [-2.2 + i * 0.35, 0.9, 1.9 - i * 0.1], b: [-2.2 + i * 0.35, 1.5, 1.9 - i * 0.1], r: 0.035, col: C('#2a2830'), k: 0 })),
      { s: 'cap', a: [-2.2, 1.4, 1.9], b: [-0.1, 1.4, 1.3], r: 0.03, col: C('#2a2830'), k: 0 },
      { s: 'cap', a: [0.3, 1.0, -1.6], b: [0.3, 2.0, -1.6], r: 0.05, col: C('#2a2830'), k: 0 }, { s: 'sph', c: [0.3, 2.1, -1.6], r: 0.16, col: C('#a8fff0'), k: 0 },
      ...pebbles(6, 3.2, slate, 9)], { ao: 0.45 });
    // thunder sea: a tall spire of stacked rock rising from a dark reef, a lightning rod with a glowing tip
    const storm = C('#5a5a64'), storm2 = C('#46464e');
    P('ispire', [{ s: 'ell', c: [0, -0.2, 0], rr: [3.7, 0.5, 3.7], col: rockD, k: 0.3 }, ...rockMass(13, 1.9, 0.9, rockD, storm2),
      ...[[0, 1.6, 0, 1.25], [0.15, 2.9, -0.1, 0.95], [-0.05, 4.0, 0.05, 0.7], [0.08, 4.85, 0, 0.45]].map(([x, y, z, r], i) => ({ s: 'rock', c: [x, y, z], r, bump: 0.05, col: i % 2 ? storm : storm2, k: 0.45 })),
      { s: 'cap', a: [0, 5.1, 0], b: [0, 6.4, 0], r: 0.08, col: C('#c8d0da'), k: 0 }, { s: 'sph', c: [0, 6.5, 0], r: 0.2, col: C('#ffe86a'), k: 0 },
      ...[1.2, 3.4, 5.3].map(a => ({ s: 'tor', ax: 'y', c: [0, 5.4 + a * 0.05, 0], R: 0.16, r: 0.025, a0: -Math.PI, a1: Math.PI, col: C('#a8b0ba'), k: 0 })),
      ...pebbles(6, 3.1, storm, 13)], { ao: 0.45 });
    // kraken deep: dark rocks with a broken shipwreck lying across them, its mast snapped, ribs showing, bones
    P('iwreck', [{ s: 'ell', c: [0, -0.2, 0], rr: [3.7, 0.45, 3.7], col: rockD, k: 0.3 }, ...rockMass(19, 1.8, 0.7, rockD, C('#3c3c44')),
      { s: 'ell', c: [0.4, 0.8, 0.2], rr: [1.1, 0.9, 2.6], col: C('#5a3a24'), k: 0 }, { s: 'box', c: [0.4, 1.8, 0.2], hs: [2, 1, 3], sub: true, k: 0 },
      { s: 'ell', c: [0.4, 1.2, 0.2], rr: [0.85, 0.6, 2.3], sub: true, k: 0 },
      ...[-1.6, -0.8, 0, 0.8, 1.6].map(z => ({ s: 'tor', ax: 'z', c: [0.4, 0.8, 0.2 + z], R: 1.0, r: 0.07, a0: 0.2, a1: Math.PI - 0.2, col: C('#6a4a30'), k: 0 })),
      { s: 'cap', a: [0.5, 0.8, 0.4], b: [1.6, 3.0, -0.6], r: 0.13, col: C('#4a3020'), k: 0 },
      { s: 'box', c: [1.4, 2.5, -0.4], hs: [0.04, 0.5, 0.5], rd: 0.03, col: C('#d8ccb0'), k: 0 },
      { s: 'box', c: [-1.6, 0.9, -1.0], hs: [0.35, 0.3, 0.35], rd: 0.05, col: C('#8a5a30'), k: 0 },
      ...[[-1.6, 1.4], [2.0, -1.6]].map(([x, z]) => ({ s: 'cap', a: [x, 0.5, z], b: [x * 1.05, 1.4, z * 1.05], r: 0.15, r2: 0.05, col: C('#f4ecdc'), k: 0.05 })),
      ...pebbles(5, 3.2, C('#3c3c44'), 19)], { ao: 0.45 });
    // pirate fortress: a rocky island under a stone fort: a curtain wall, a round cannon tower with battlements,
    // corner turrets, steps down to a jetty and the black flag
    const bat = (r, y) => Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU; return { s: 'box', c: [Math.cos(a) * r, y, Math.sin(a) * r], hs: [0.22, 0.2, 0.22], rd: 0.04, col: C('#a8a49a'), k: 0 }; });
    P('ifort', [{ s: 'ell', c: [0, -0.2, 0], rr: [3.9, 0.5, 3.9], col: C('#6a6a62'), k: 0.3 }, ...rockMass(23, 2.0, 0.6, rockG, C('#686a62'), 0.04),
      { s: 'box', c: [0, 0.95, 0], hs: [2.4, 0.6, 2.0], rd: 0.12, col: C('#b8b4aa'), k: 0 },
      ...[-1.8, -0.9, 0, 0.9, 1.8].map(x => ({ s: 'box', c: [x, 1.62, 2.0], hs: [0.22, 0.12, 0.08], rd: 0.03, col: C('#a8a49a'), k: 0 })),
      ...[0.55, 0.85, 1.15].map((y, i) => ({ s: 'box', c: [0, y, -2.2 - i * 0.3], hs: [0.6, 0.06, 0.18], rd: 0.02, col: C('#a8a49a'), k: 0 })),
      { s: 'box', c: [0, 0.2, -3.4], hs: [0.5, 0.08, 0.7], rd: 0.02, col: C('#8a5a30'), k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 2.0, 0], r: 1.2, hh: 0.9, rd: 0.08, col: C('#c8c4ba'), k: 0 },
      ...[0.4, 1.3].map(y => ({ s: 'tor', ax: 'y', c: [0, 1.3 + y, 0], R: 1.2, r: 0.03, a0: -Math.PI, a1: Math.PI, col: C('#a8a49a'), k: 0 })),
      ...bat(1.05, 3.05), { s: 'cyl', ax: 'y', c: [0, 3.0, 0], r: 0.85, hh: 0.2, rd: 0.05, col: C('#8a867c'), k: 0 },
      { s: 'cap', a: [0, 3.1, 0], b: [0, 4.4, 0], r: 0.06, col: C('#5e3a20'), k: 0 }, { s: 'box', c: [0, 4.15, -0.42], hs: [0.03, 0.22, 0.38], rd: 0.02, col: C('#1e2230'), k: 0 },
      { s: 'sph', c: [0.04, 4.18, -0.42], r: 0.1, col: C('#f4ecdc'), k: 0 },
      ...[[1, 1], [-1, 1], [1, -1], [-1, -1]].flatMap(([sx, sz]) => [{ s: 'cyl', ax: 'y', c: [sx * 2.2, 1.7, sz * 1.8], r: 0.45, hh: 0.3, rd: 0.05, col: C('#a8a49a'), k: 0 },
        { s: 'cap', a: [sx * 2.2, 2.1, sz * 1.8], b: [sx * 2.2, 2.75, sz * 1.8], r: 0.55, r2: 0.04, col: C('#8a2a2a'), k: 0 }]),
      ...pebbles(6, 3.4, rockG, 23)], { ao: 0.45 });
  }
}
