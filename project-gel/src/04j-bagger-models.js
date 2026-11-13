// ============================================================
// The Bagger: a giant goo-and-steel bucket-wheel excavator. It is drawn from six meshes that move
// separately (13j-bagger.js puts them together):
//   bg_base   four ridged crawler tracks under a hazard-striped turntable (still)
//   bg_body   the deck with its railings, the goo machine-house strapped in steel bands, angry eyes, a grilled
//             mouth, a porthole for the glowing goo heart (drawn live), exhaust stacks, a ladder and a little cab
//   bg_mast   one lattice A-frame pylon (drawn twice) with pulleys and beacon housings
//   bg_cwt    the counterweight boom: a lattice truss and the striped counterweight, goo oozing off it
//   bg_boom   the bucket-wheel boom: a lattice truss with a conveyor on top; pivots at its hinge (bpitch clip)
//   bg_wheel  the wheel: twin rims, spokes, a hub, and twelve toothed buckets full of goo; spins (wspin clip)
// Model units are a quarter of the world size the boss is drawn at (scale 4). Goo parts have no col, so the
// instance tint colors them (orange, then red-hot in stage 2); everything else has its own color.
// ============================================================
Object.assign(THEME_CLIPS, { bg_boom: ['bpitch'], bg_wheel: ['wspin'] });
Object.assign(THEME_CELLS, { bg_base: 0.016, bg_body: 0.015, bg_mast: 0.012, bg_cwt: 0.014, bg_boom: 0.011, bg_wheel: 0.0125 });
MESH_ORDER.push('bg_base', 'bg_body', 'bg_mast', 'bg_cwt', 'bg_boom', 'bg_wheel');
// the boom's pitch, from raised (-0.35) to lowered (+0.3), one frame per step; the wheel turns one bucket (30 deg) per loop
const BAG_PITCH = [-0.35, 0.3], BAG_PITCH_FRAMES = 17;
CLIPS.bpitch = { frames: BAG_PITCH_FRAMES, fn(t) {
  const p = lerp(BAG_PITCH[0], BAG_PITCH[1], t * BAG_PITCH_FRAMES / (BAG_PITCH_FRAMES - 1));
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 0 ? [p, 0, 0] : [0, 0, 0])) };
} };
CLIPS.wspin = { frames: 24, fn(t) {
  return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 0 ? [-t * TAU / 12, 0, 0] : [0, 0, 0])) };
} };
// where the boom hinges on the body, how long it is, and where the wheel's hub sits in its own model
const BAG_HINGE = [0, 0.95, 0.66], BAG_BOOM_LEN = 2.2, BAG_WHEEL_Y = 1.05, BAG_WHEEL_R = 1.0;

function baggerModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const steel = C('#8e9aa8'), steelL = C('#b8c2cc'), steelD = C('#56606e'), dark = C('#2c3038'), tread = C('#202228'), hazY = C('#ffc21a'), hazK = C('#1a1a1e');
  const white = C('#f4f6f8'), black = C('#120c10'), mouth = C('#3d0d1c'), tooth = C('#e8eef4'), eyeY = C('#ffd84a'), glass = C('#2c3a52'), lit = C('#ffe08a'), red = C('#ff3a2a');
  const cap = (a, b, r, col, k = 0, r2) => ({ s: 'cap', a, b, r, r2, col, k });
  // a lattice truss between two points: four chords (half-size w, h around the line) braced in a zigzag on every face
  const truss = (parts, a, b, w, h, r, col, n) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
    const L = Math.hypot(dx, dy, dz), f = [dx / L, dy / L, dz / L];
    // side axis (horizontal, across the truss) and up axis
    let sx = f[2], sz = -f[0]; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const s = [sx, 0, sz], u = [f[1] * s[2] - f[2] * s[1], f[2] * s[0] - f[0] * s[2], f[0] * s[1] - f[1] * s[0]];
    const pt = (t, i, j) => [a[0] + dx * t + s[0] * w * i + u[0] * h * j, a[1] + dy * t + s[1] * w * i + u[1] * h * j, a[2] + dz * t + s[2] * w * i + u[2] * h * j];
    for (const [i, j] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) parts.push(cap(pt(0, i, j), pt(1, i, j), r, col));
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, z = k % 2;
      for (const i of [1, -1]) parts.push(cap(pt(z ? t0 : t1, i, 1), pt(z ? t1 : t0, i, -1), r * 0.7, col));
      for (const j of [1, -1]) parts.push(cap(pt(z ? t0 : t1, 1, j), pt(z ? t1 : t0, -1, j), r * 0.6, col));
      parts.push(cap(pt(t1, 1, 1), pt(t1, 1, -1), r * 0.6, col)); parts.push(cap(pt(t1, -1, 1), pt(t1, -1, -1), r * 0.6, col));
    }
  };

  // ---------- the crawlers and turntable ----------
  {
    const parts = [];
    for (const sx of [1, -1]) for (const sz of [1, -1]) {
      const cx = sx * 0.62, cz = sz * 0.58;
      parts.push({ s: 'box', c: [cx, 0.21, cz], hs: [0.2, 0.19, 0.4], rd: 0.12, col: dark, k: 0 });
      // the treads: thin slabs a touch bigger than the track, every 0.07
      for (let z = -0.36; z <= 0.37; z += 0.072) parts.push({ s: 'box', c: [cx, 0.21, cz + z], hs: [0.212, 0.205, 0.016], rd: 0.1, col: tread, k: 0 });
      for (const z of [-0.27, -0.09, 0.09, 0.27]) {
        parts.push({ s: 'cyl', ax: 'x', c: [cx + sx * 0.2, 0.17, cz + z], r: 0.085, hh: 0.025, rd: 0.012, col: steelD, k: 0 });
        parts.push({ s: 'cyl', ax: 'x', c: [cx + sx * 0.225, 0.17, cz + z], r: 0.035, hh: 0.012, rd: 0.006, col: hazY, k: 0 });
      }
      for (const z of [-0.36, 0.36]) parts.push({ s: 'cyl', ax: 'x', c: [cx + sx * 0.2, 0.24, cz + z], r: 0.11, hh: 0.03, rd: 0.015, col: steel, k: 0 });
      // a beam from each track in to the middle
      parts.push({ s: 'box', c: [sx * 0.3, 0.33, cz * 0.75], hs: [0.24, 0.07, 0.09], rd: 0.025, col: steelD, k: 0 });
    }
    parts.push({ s: 'box', c: [0, 0.32, 0], hs: [0.42, 0.09, 0.62], rd: 0.05, col: steelD, k: 0 });
    parts.push({ s: 'cyl', ax: 'y', c: [0, 0.45, 0], r: 0.68, hh: 0.07, rd: 0.03, col: steel, k: 0 });
    // a hazard-striped ring round the turntable
    for (let i = 0; i < 32; i++) {
      const a = (i + 0.5) / 32 * TAU;
      parts.push({ s: 'box', c: [Math.cos(a) * 0.69, 0.45, Math.sin(a) * 0.69], hs: [0.055, 0.045, 0.055], rd: 0.012, col: i % 2 ? hazK : hazY, k: 0 });
    }
    parts.push({ s: 'cyl', ax: 'y', c: [0, 0.53, 0], r: 0.6, hh: 0.025, rd: 0.012, col: steelD, k: 0 });
    P('bg_base', parts, { ao: 2.5 });
  }

  // ---------- the body: deck, goo house, face, porthole, stacks, ladder, cab ----------
  {
    const parts = [];
    // the goo machine-house: one big blob with bulges, and drips down its sides
    parts.push({ s: 'ell', c: [0, 1.12, -0.05], rr: [0.6, 0.5, 0.64], k: 0 });
    for (const [x, y, z, r] of [[0.32, 1.42, 0.12, 0.3], [-0.3, 1.4, -0.22], [0, 1.58, -0.08, 0.34], [0.36, 1.1, -0.4, 0.28], [-0.4, 1.05, 0.25, 0.25]]) parts.push({ s: 'sph', c: [x, y, z], r: r || 0.3, k: 0.14 });
    for (const [x, z, len] of [[0.5, 0.25, 0.22], [-0.45, 0.4, 0.3], [0.2, 0.58, 0.18], [-0.15, 0.6, 0.26], [0.52, -0.35, 0.25], [-0.55, -0.2, 0.2]]) parts.push({ s: 'cap', a: [x, 0.95, z], b: [x * 1.02, 0.95 - len, z * 1.02], r: 0.06, r2: 0.03, k: 0.06 });
    // the deck, its railing, and the frame the house sits in
    parts.push({ s: 'box', c: [0, 0.62, -0.08], hs: [0.76, 0.055, 0.92], rd: 0.03, col: steel, k: 0 });
    parts.push({ s: 'box', c: [0, 0.57, -0.08], hs: [0.78, 0.02, 0.94], rd: 0.01, col: hazY, k: 0 });
    for (const sx of [1, -1]) {
      for (let z = -0.9; z <= 0.75; z += 0.275) parts.push(cap([sx * 0.72, 0.67, z], [sx * 0.72, 0.85, z], 0.012, steelL));
      parts.push(cap([sx * 0.72, 0.85, -0.9], [sx * 0.72, 0.85, 0.75], 0.014, hazY));
      parts.push(cap([sx * 0.72, 0.76, -0.9], [sx * 0.72, 0.76, 0.75], 0.01, steelL));
    }
    // steel bands round the goo, with rivets, and straps over the top
    for (const [y, R] of [[0.86, 0.6], [1.22, 0.62], [1.55, 0.46]]) {
      parts.push({ s: 'tor', ax: 'y', c: [0, y, -0.05], R, r: 0.032, a0: -Math.PI, a1: Math.PI, col: steel, k: 0 });
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; parts.push({ s: 'sph', c: [Math.cos(a) * (R + 0.025), y, -0.05 + Math.sin(a) * (R + 0.025)], r: 0.016, col: steelL, k: 0 }); }
    }
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      parts.push(cap([sx * 0.46, 0.7, -0.05 + sz * 0.47], [sx * 0.43, 1.25, -0.05 + sz * 0.45], 0.03, steelD));
      parts.push(cap([sx * 0.43, 1.25, -0.05 + sz * 0.45], [sx * 0.2, 1.68, -0.05 + sz * 0.22], 0.03, steelD));
    }
    parts.push({ s: 'sph', c: [0, 1.72, -0.05], r: 0.07, col: steelD, k: 0 });
    // the face on the front: yellow eyes with black pupils under heavy steel brows, a grilled mouth
    for (const sx of [1, -1]) {
      parts.push({ s: 'ell', c: [sx * 0.2, 1.28, 0.55], rr: [0.14, 0.16, 0.08], col: white, k: 0 });
      parts.push({ s: 'sph', c: [sx * 0.19, 1.26, 0.6], r: 0.085, col: eyeY, k: 0 });
      parts.push({ s: 'sph', c: [sx * 0.18, 1.25, 0.66], r: 0.042, col: black, k: 0 });
      parts.push({ s: 'sph', c: [sx * 0.15, 1.3, 0.685], r: 0.014, col: white, k: 0 });
      parts.push(cap([sx * 0.38, 1.5, 0.52], [sx * 0.06, 1.41, 0.62], 0.05, steelD));
      parts.push(cap([sx * 0.38, 1.5, 0.52], [sx * 0.06, 1.41, 0.62], 0.035, steel, 0, 0.03));
    }
    parts.push({ s: 'ell', c: [0, 0.99, 0.58], rr: [0.28, 0.085, 0.07], col: mouth, k: 0 });
    parts.push(cap([-0.28, 1.06, 0.6], [0.28, 1.06, 0.6], 0.025, steel));
    parts.push(cap([-0.27, 0.92, 0.6], [0.27, 0.92, 0.6], 0.025, steel));
    for (let i = 0; i < 7; i++) { const x = -0.21 + i * 0.07; parts.push(cap([x, 1.06, 0.62], [x, 0.94, 0.63], 0.012, tooth)); }
    // the porthole on the brow where the goo heart shows (the heart itself glows, drawn live)
    parts.push({ s: 'tor', ax: 'z', c: [0, 1.62, 0.4], R: 0.13, r: 0.035, a0: -Math.PI, a1: Math.PI, col: steelD, k: 0 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; parts.push({ s: 'sph', c: [Math.cos(a) * 0.13, 1.62 + Math.sin(a) * 0.13, 0.43], r: 0.014, col: steelL, k: 0 }); }
    parts.push({ s: 'cyl', ax: 'z', c: [0, 1.62, 0.33], r: 0.11, hh: 0.05, rd: 0, sub: true, k: 0.01 });
    // exhaust stacks at the back
    for (const sx of [1, -1]) {
      parts.push({ s: 'cyl', ax: 'y', c: [sx * 0.24, 1.75, -0.52], r: 0.06, hh: 0.22, rd: 0.015, col: dark, k: 0 });
      parts.push({ s: 'tor', ax: 'y', c: [sx * 0.24, 1.96, -0.52], R: 0.06, r: 0.018, a0: -Math.PI, a1: Math.PI, col: steelD, k: 0 });
      parts.push({ s: 'cyl', ax: 'y', c: [sx * 0.24, 1.93, -0.52], r: 0.045, hh: 0.06, rd: 0, sub: true, k: 0 });
    }
    // a ladder up the right side
    for (const dz of [-0.07, 0.07]) parts.push(cap([-0.66, 0.68, 0.0 + dz], [-0.5, 1.5, 0.0 + dz], 0.012, steelL));
    for (let i = 1; i < 9; i++) { const u = i / 9; parts.push(cap([lerp(-0.66, -0.5, u), lerp(0.68, 1.5, u), -0.07], [lerp(-0.66, -0.5, u), lerp(0.68, 1.5, u), 0.07], 0.008, steelL)); }
    // the little operator's cab out front on the left, its windows lit
    parts.push({ s: 'box', c: [0.56, 0.84, 0.6], hs: [0.13, 0.15, 0.12], rd: 0.025, col: C('#e8e0d0'), k: 0 });
    parts.push({ s: 'box', c: [0.56, 0.88, 0.72], hs: [0.1, 0.07, 0.01], rd: 0.01, col: lit, k: 0 });
    parts.push({ s: 'box', c: [0.69, 0.88, 0.6], hs: [0.01, 0.07, 0.08], rd: 0.01, col: glass, k: 0 });
    parts.push({ s: 'box', c: [0.56, 1.0, 0.6], hs: [0.15, 0.02, 0.14], rd: 0.01, col: hazY, k: 0 });
    // a hazard plate on the front of the deck
    for (let i = 0; i < 10; i++) parts.push({ s: 'box', c: [-0.45 + i * 0.1, 0.62, 0.84], hs: [0.05, 0.05, 0.012], rd: 0.008, col: i % 2 ? hazK : hazY, k: 0 });
    P('bg_body', parts, { ao: 2.5 });
  }

  // ---------- one A-frame pylon (drawn at both sides of the body) ----------
  {
    const parts = [], top = [0, 3.35, -0.05];
    const legs = [[0.08, 0.66, 0.36], [0.08, 0.66, -0.46]];
    for (const l of legs) parts.push(cap(l, top, 0.04, steel));
    // lattice between the two legs: rungs and diagonals
    for (let i = 1; i < 9; i++) {
      const u = i / 9, u2 = (i + 1) / 9, at = (L, v) => [lerp(L[0], top[0], v), lerp(L[1], top[1], v), lerp(L[2], top[2], v)];
      parts.push(cap(at(legs[0], u), at(legs[1], u), 0.018, steelD));
      if (i < 8) parts.push(cap(at(legs[i % 2], u), at(legs[1 - i % 2], u2), 0.014, steelD));
    }
    parts.push({ s: 'box', c: [0, 3.35, -0.05], hs: [0.07, 0.07, 0.09], rd: 0.02, col: hazY, k: 0 });
    parts.push({ s: 'cyl', ax: 'x', c: [0, 3.35, 0.06], r: 0.08, hh: 0.03, rd: 0.01, col: steelD, k: 0 });
    parts.push({ s: 'cyl', ax: 'x', c: [0, 3.35, -0.17], r: 0.07, hh: 0.03, rd: 0.01, col: steelD, k: 0 });
    parts.push({ s: 'cyl', ax: 'y', c: [0, 3.46, -0.05], r: 0.04, hh: 0.035, rd: 0.01, col: dark, k: 0 });
    parts.push({ s: 'sph', c: [0, 3.52, -0.05], r: 0.04, col: red, k: 0 });
    P('bg_mast', parts, { ao: 1 });
  }

  // ---------- the counterweight boom ----------
  {
    const parts = [];
    truss(parts, [0, 1.25, -0.62], [0, 1.52, -2.15], 0.14, 0.12, 0.028, steel, 7);
    parts.push({ s: 'box', c: [0, 1.36, -2.32], hs: [0.32, 0.3, 0.27], rd: 0.05, col: C('#4a4e58'), k: 0 });
    for (let i = 0; i < 7; i++) parts.push({ s: 'box', c: [-0.27 + i * 0.09, 1.36, -2.6], hs: [0.045, 0.25, 0.012], rd: 0.008, col: i % 2 ? hazK : hazY, k: 0 });
    for (const sx of [1, -1]) parts.push({ s: 'box', c: [sx * 0.33, 1.36, -2.32], hs: [0.012, 0.22, 0.2], rd: 0.008, col: steelD, k: 0 });
    // goo oozing off the weight
    parts.push({ s: 'ell', c: [0.05, 1.68, -2.3], rr: [0.24, 0.1, 0.2], k: 0.05 });
    for (const [x, z, len] of [[0.25, -2.12, 0.42], [-0.2, -2.55, 0.3], [0.12, -2.6, 0.5]]) parts.push({ s: 'cap', a: [x, 1.6, z], b: [x, 1.6 - len, z], r: 0.05, r2: 0.025, k: 0.05 });
    P('bg_cwt', parts, { ao: 1.5 });
  }

  // ---------- the bucket-wheel boom: a truss with a conveyor, hinged at BAG_HINGE ----------
  {
    const parts = [], h = BAG_HINGE, L = BAG_BOOM_LEN;
    truss(parts, [h[0], h[1], h[2] + 0.05], [h[0], h[1], h[2] + L - 0.12], 0.17, 0.14, 0.032, steel, 9);
    parts.push({ s: 'cyl', ax: 'x', c: h, r: 0.12, hh: 0.22, rd: 0.03, col: steelD, k: 0 });
    parts.push({ s: 'cyl', ax: 'x', c: h, r: 0.06, hh: 0.25, rd: 0.01, col: hazY, k: 0 });
    // the conveyor belt along the top, dark rubber with ribs
    parts.push({ s: 'box', c: [0, h[1] + 0.165, h[2] + L / 2], hs: [0.13, 0.018, L / 2 - 0.1], rd: 0.012, col: tread, k: 0 });
    for (let z = 0.12; z < L - 0.1; z += 0.11) parts.push({ s: 'box', c: [0, h[1] + 0.185, h[2] + z], hs: [0.12, 0.008, 0.012], rd: 0.004, col: dark, k: 0 });
    // a walkway rail down one side
    for (let z = 0.15; z < L - 0.1; z += 0.3) parts.push(cap([0.2, h[1] + 0.14, h[2] + z], [0.2, h[1] + 0.28, h[2] + z], 0.008, steelL));
    parts.push(cap([0.2, h[1] + 0.28, h[2] + 0.15], [0.2, h[1] + 0.28, h[2] + L - 0.2], 0.01, hazY));
    // the axle housing at the tip
    const tip = [0, h[1], h[2] + L];
    for (const sx of [1, -1]) parts.push({ s: 'box', c: [sx * 0.2, tip[1], tip[2] - 0.05], hs: [0.035, 0.12, 0.14], rd: 0.02, col: steelD, k: 0 });
    parts.push({ s: 'cyl', ax: 'x', c: tip, r: 0.07, hh: 0.24, rd: 0.01, col: dark, k: 0 });
    // a chute where the buckets tip their load onto the belt
    parts.push({ s: 'box', c: [0, tip[1] + 0.28, tip[2] - 0.3], hs: [0.15, 0.06, 0.12], rd: 0.03, col: steelD, k: 0 });
    rig(P('bg_boom', parts, { ao: 1.2 }), { 0: h.slice() });
  }

  // ---------- the bucket wheel: twelve toothed buckets of goo on twin rims ----------
  {
    const parts = [], cy = BAG_WHEEL_Y, R = BAG_WHEEL_R * 0.92;
    // buckets first, each with its scoop carved toward the way the wheel turns (up the front)
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, ca = Math.cos(a), sa = Math.sin(a), rad = [0, sa, ca], tan = [0, ca, -sa];
      const at = (rr, t, x = 0) => [x, cy + rad[1] * rr + tan[1] * t, rad[2] * rr + tan[2] * t];
      parts.push(cap(at(R - 0.02, -0.04), at(R + 0.17, 0.02), 0.13, steelD, 0.02, 0.15));
      parts.push({ s: 'sph', c: at(R + 0.1, 0.13), r: 0.115, sub: true, k: 0.02 });
    }
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * TAU, ca = Math.cos(a), sa = Math.sin(a), rad = [0, sa, ca], tan = [0, ca, -sa];
      const at = (rr, t, x = 0) => [x, cy + rad[1] * rr + tan[1] * t, rad[2] * rr + tan[2] * t];
      // teeth on the lip, and goo slopping in every other bucket
      for (const x of [-0.09, 0, 0.09]) parts.push(cap(at(R + 0.25, 0.05, x), at(R + 0.31, 0.12, x * 1.1), 0.026, tooth, 0, 0.005));
      if (i % 2 === 0) parts.push({ s: 'sph', c: at(R + 0.09, 0.03), r: 0.085, k: 0.03 });
      // the bucket's back plate against the rim
      parts.push(cap(at(R - 0.04, -0.14, -0.13), at(R - 0.04, -0.14, 0.13), 0.03, steel));
    }
    // twin rims, an inner ring, spokes and the hub
    for (const sx of [1, -1]) {
      parts.push({ s: 'tor', ax: 'x', c: [sx * 0.14, cy, 0], R: R - 0.02, r: 0.04, a0: -Math.PI, a1: Math.PI, col: steel, k: 0 });
      parts.push({ s: 'tor', ax: 'x', c: [sx * 0.12, cy, 0], R: 0.5, r: 0.022, a0: -Math.PI, a1: Math.PI, col: steelD, k: 0 });
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; parts.push(cap([sx * 0.1, cy + Math.sin(a) * 0.12, Math.cos(a) * 0.12], [sx * 0.14, cy + Math.sin(a) * (R - 0.05), Math.cos(a) * (R - 0.05)], 0.026, steelD)); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; parts.push({ s: 'sph', c: [sx * 0.17, cy + Math.sin(a) * 0.09, Math.cos(a) * 0.09], r: 0.018, col: steelL, k: 0 }); }
    }
    parts.push({ s: 'cyl', ax: 'x', c: [0, cy, 0], r: 0.15, hh: 0.17, rd: 0.03, col: steelD, k: 0 });
    for (const sx of [1, -1]) parts.push({ s: 'cyl', ax: 'x', c: [sx * 0.18, cy, 0], r: 0.09, hh: 0.015, rd: 0.01, col: hazY, k: 0 });
    // goo stuck between the spokes at the rim
    for (const a of [0.7, 2.6, 4.4]) parts.push({ s: 'sph', c: [0, cy + Math.sin(a) * (R - 0.08), Math.cos(a) * (R - 0.08)], r: 0.07, k: 0.04 });
    rig(P('bg_wheel', parts, { ao: 1.2 }), { 0: [0, cy, 0] });
  }
}
