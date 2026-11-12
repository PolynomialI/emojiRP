// ============================================================
// Chapter 19, the Giant Kitchen: a steaming stew pot, polka-dot teapots, honey and jam jars, stacks of sugar cubes,
// cheese wedges full of holes, and a wall of spice jars; the rolling meatball, the pepper-shaker gunner, a stack of
// pancakes (thrown), and Chef Cleaver. Built with prop() like 04a-04g. Parts without col take the instance tint.
// ============================================================
Object.assign(THEME_CLIPS, { meatball: ['run'], pepper: ['run', 'aim'], chef: ['run', 'slam', 'idle', 'throw'] });
Object.assign(THEME_CELLS, { pot: 0.02, teapot: 0.018, jar: 0.018, sugarcubes: 0.022, cheese: 0.018, spicejar: 0.02, meatball: 0.016, pepper: 0.014, pancake: 0.014, chef: 0.015 });
MESH_ORDER.push('pot', 'teapot', 'jar', 'sugarcubes', 'cheese', 'spicejar', 'meatball', 'pepper', 'pancake', 'chef');

function kitchenModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const steel = C('#c8ccd4'), steelD = C('#8a909a'), dark = C('#16101a'), white = C('#ffffff'), cream = C('#fff4dc'), red = C('#e8323a');
  const honey = C('#ffb81a'), cheeseC = C('#ffd04a'), sauce = C('#c82a1a'), basil = C('#3a9a3a'), wood = C('#a8703e');

  // ---------- scenery ----------
  // a big stew pot with its lid pushed aside, bubbling stew showing, and two loop handles
  P('pot', [
    { s: 'cyl', ax: 'y', c: [0, 0.34, 0], r: 0.46, hh: 0.34, rd: 0.06, col: steel, k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 0.6, 0], r: 0.4, hh: 0.12, rd: 0.02, sub: true, k: 0.01 },
    { s: 'cyl', ax: 'y', c: [0, 0.6, 0], r: 0.41, hh: 0.015, rd: 0.0, col: C('#e0602a'), k: 0 },
    ...[[0.1, 0.12, 0.07], [-0.15, -0.05, 0.06], [0.05, -0.2, 0.05]].map(([x, z, r]) => ({ s: 'sph', c: [x, 0.61, z], r, col: C('#ff8a3a'), k: 0.02 })),
    { s: 'tor', ax: 'y', c: [0, 0.68, 0], R: 0.45, r: 0.025, a0: -Math.PI, a1: Math.PI, col: steelD, k: 0 },
    ...[1, -1].map(sx => ({ s: 'tor', ax: 'z', c: [sx * 0.5, 0.55, 0], R: 0.08, r: 0.022, a0: -Math.PI, a1: Math.PI, col: C('#2a2a30'), k: 0 })),
    { s: 'cyl', ax: 'y', c: [0.28, 0.73, 0.18], r: 0.32, hh: 0.025, rd: 0.012, col: steel, k: 0 },
    { s: 'sph', c: [0.28, 0.8, 0.18], r: 0.05, col: C('#2a2a30'), k: 0 },
  ], { ao: 0.8 });
  // a round teapot (the tint) with white polka dots, a spout, a handle and a lid with a knob
  P('teapot', [
    { s: 'ell', c: [0, 0.38, 0], rr: [0.42, 0.36, 0.42], k: 0.02 },
    { s: 'cyl', ax: 'y', c: [0, 0.03, 0], r: 0.26, hh: 0.03, rd: 0.01, k: 0.02 },
    ...Array.from({ length: 10 }, (_, i) => { const a = i * 2.39, el = (i % 3 - 1) * 0.45; return { s: 'sph', c: [Math.cos(a) * Math.cos(el) * 0.41, 0.38 + Math.sin(el) * 0.35, Math.sin(a) * Math.cos(el) * 0.41], r: 0.05, col: white, k: 0 }; }),
    { s: 'cap', a: [0.3, 0.32, 0], b: [0.52, 0.58, 0], r: 0.09, r2: 0.04, k: 0.03 },
    { s: 'tor', ax: 'z', c: [-0.42, 0.42, 0], R: 0.14, r: 0.035, a0: -Math.PI, a1: Math.PI, k: 0.01 },
    { s: 'ell', c: [0, 0.72, 0], rr: [0.22, 0.06, 0.22], col: cream, k: 0.01 },
    { s: 'sph', c: [0, 0.8, 0], r: 0.055, col: cream, k: 0.01 },
  ], { ao: 0.6 });
  // a glass jar of honey or jam (the tint) with a gingham cloth over the lid and a label
  P('jar', [
    { s: 'cyl', ax: 'y', c: [0, 0.36, 0], r: 0.3, hh: 0.36, rd: 0.08, k: 0.0 },
    { s: 'cyl', ax: 'y', c: [0, 0.76, 0], r: 0.24, hh: 0.05, rd: 0.02, col: C('#d8d8e0'), k: 0 },
    { s: 'ell', c: [0, 0.82, 0], rr: [0.34, 0.06, 0.34], col: red, k: 0.01 },
    ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU; return { s: 'sph', c: [Math.cos(a) * 0.26, 0.84, Math.sin(a) * 0.26], r: 0.045, col: white, k: 0 }; }),
    { s: 'cyl', ax: 'z', c: [0, 0.36, 0.28], r: 0.14, hh: 0.025, rd: 0.01, col: cream, k: 0 },
    { s: 'ell', c: [0, 0.38, 0.305], rr: [0.08, 0.03, 0.006], col: C('#a83a2a'), k: 0 },
    { s: 'ell', c: [0.12, 0.55, 0.22], rr: [0.04, 0.12, 0.02], col: white, k: 0 },
  ], { ao: 0.6 });
  // a tumble of sugar cubes, the top one sparkling
  P('sugarcubes', [
    ...[[-0.22, 0.12, -0.1], [0.08, 0.12, -0.14], [0.36, 0.12, 0.08], [-0.1, 0.12, 0.2], [-0.08, 0.36, -0.04], [0.2, 0.36, 0.0], [0.05, 0.6, -0.02]].map(([x, y, z], i) =>
      ({ s: 'box', c: [x, y, z], hs: [0.12, 0.12, 0.12], rd: 0.025, col: i % 3 ? C('#fffaf2') : C('#f2ece2'), k: 0 })),
    { s: 'sph', c: [0.1, 0.74, 0.04], r: 0.03, col: C('#fff8b0'), k: 0 },
  ], { ao: 0.5 });
  // a cheese wedge full of holes
  P('cheese', [
    { s: 'gable', c: [0, 0, 0], w: 0.5, h: 0.42, hh: 0.3, ax: 'x', col: cheeseC, k: 0 },
    ...[[0.1, 0.12, 0.31, 0.08], [-0.15, 0.2, 0.3, 0.06], [0.3, 0.08, -0.31, 0.07], [-0.2, 0.08, -0.3, 0.09], [0.31, 0.15, 0.05, 0.07], [-0.32, 0.12, -0.05, 0.06], [0, 0.32, 0.1, 0.05]].map(([x, y, z, r]) => ({ s: 'sph', c: [x, y, z], r, sub: true, k: 0.01 })),
    { s: 'box', c: [0, 0.01, 0], hs: [0.32, 0.01, 0.5], rd: 0, col: C('#e8b830'), k: 0 },
  ], { ao: 0.6 });
  // the wall: tall spice jars (the spice is the tint) with silver caps
  P('spicejar', [
    { s: 'cyl', ax: 'y', c: [0, 0.5, 0], r: 0.28, hh: 0.5, rd: 0.06, col: C('#dfe8ee'), k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 0.4, 0], r: 0.25, hh: 0.38, rd: 0.05, k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 1.06, 0], r: 0.25, hh: 0.07, rd: 0.02, col: steel, k: 0 },
    { s: 'cyl', ax: 'z', c: [0, 0.55, 0.27], r: 0.13, hh: 0.02, rd: 0.01, col: cream, k: 0 },
  ], { ao: 0.6 });

  // ---------- creatures ----------
  // meatball: a lumpy meatball (the tint) under a splash of sauce and a basil leaf, with an angry face; it rolls
  const mb = P('meatball', [
    { s: 'rock', c: [0, 0.4, 0], r: 0.36, bump: 0.12, k: 0 },
    { s: 'ell', c: [0, 0.68, 0.02], rr: [0.26, 0.08, 0.24], col: sauce, k: 0.03 },
    { s: 'ell', c: [0.06, 0.76, -0.02], rr: [0.1, 0.02, 0.05], col: basil, k: 0 },
    ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.12, 0.48, 0.3], r: 0.06, col: white, k: 0 }, { s: 'sph', c: [sx * 0.125, 0.48, 0.355], r: 0.03, col: dark, k: 0 },
      { s: 'cap', a: [sx * 0.04, 0.58, 0.33], b: [sx * 0.2, 0.55, 0.3], r: 0.018, col: dark, k: 0 }]),
  ], { ao: 0.4 });
  rig(mb, { 0: [0, 0.4, 0] }); mb.roll = true;
  // pepper shaker (the tint) with a silver dome top full of holes, a face, little feet and arms
  P('pepper', [
    { s: 'cyl', ax: 'y', c: [0, 0.42, 0], r: 0.2, hh: 0.32, rd: 0.08, k: 0.02 },
    { s: 'ell', c: [0, 0.76, 0], rr: [0.2, 0.14, 0.2], col: steel, k: 0.02 },
    ...Array.from({ length: 7 }, (_, i) => { const a = i / 7 * TAU; return { s: 'sph', c: [Math.cos(a) * 0.1, 0.87, Math.sin(a) * 0.1], r: 0.02, col: dark, k: 0 }; }),
    { s: 'sph', c: [0, 0.9, 0], r: 0.02, col: dark, k: 0 },
    ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.07, 0.5, 0.19], r: 0.035, col: white, k: 0 }, { s: 'sph', c: [sx * 0.072, 0.5, 0.215], r: 0.018, col: dark, k: 0 },
      { s: 'ell', c: [sx * 0.09, 0.05, 0.04], rr: [0.06, 0.04, 0.08], col: C('#2a2a30'), k: 0.02 },
      { s: 'cap', a: [sx * 0.19, 0.45, 0], b: [sx * 0.28, 0.32, 0.08], r: 0.03, k: 0.02 }]),
    { s: 'ell', c: [0, 0.42, 0.19], rr: [0.05, 0.02, 0.01], col: red, k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 0.6, 0], r: 0.205, hh: 0.025, rd: 0.0, col: cream, k: 0 },
  ], { ao: 0.5 });
  // a stack of three pancakes with butter and a drip of syrup (Chef Cleaver flips these)
  P('pancake', [
    ...[0.05, 0.13, 0.21].map((y, i) => ({ s: 'cyl', ax: 'y', c: [i * 0.02 - 0.02, y, -i * 0.015], r: 0.42, hh: 0.04, rd: 0.03, col: C('#e8a848'), k: 0.01 })),
    { s: 'cyl', ax: 'y', c: [0, 0.27, 0], r: 0.36, hh: 0.012, rd: 0.005, col: C('#a85a1a'), k: 0 },
    { s: 'box', c: [0.02, 0.3, 0], hs: [0.08, 0.035, 0.08], rd: 0.015, col: C('#fff0a0'), k: 0 },
    { s: 'cap', a: [0.38, 0.2, 0.1], b: [0.4, 0.06, 0.12], r: 0.03, r2: 0.015, col: C('#a85a1a'), k: 0 },
  ], { ao: 0.3 });

  // ---------- Chef Cleaver (chapter 19 boss): a round goo chef (the tint) in a white double-breasted jacket and a tall
  // puffy toque, a curled mustache, a red neckerchief, a cleaver in the right hand and a frying pan in the left ----------
  {
    const o = { ...STICK, hipY: 0.42, shY: 0.8, headY: 1.02, headR: 0.2, headZ: 0.03, shW: 0.24, hipW: 0.12, elOut: 0.07, upperLen: 0.17, foreLen: 0.16,
      pelvisR: 0.2, torso: 'ell', torsoRR: [0.3, 0.3, 0.26], neckR: 0.12, armR: 0.08, handR: 0.09, legR: 0.1, k: 0.07 };
    const m = makeHumanoid(o), J = m.J, hd = J.head, hr = o.headR;
    const add = (b, ...parts) => { for (const p of parts) m.parts.push({ k: 0, ...p, bone: b }); };
    face(m, { eyeCol: COL.eyeW, mouth: 'grin', eyeY: 0.3 });
    // the toque: a band, a tall crown and a puffy top
    add(2, { s: 'cyl', ax: 'y', c: [hd[0], hd[1] + hr * 0.95, hd[2]], r: hr * 0.92, hh: hr * 0.45, rd: hr * 0.1, col: white },
      ...[[0, 0], [0.5, 0.2], [-0.5, 0.15], [0.2, -0.5], [-0.25, -0.45], [0.05, 0.55]].map(([x, z]) => ({ s: 'sph', c: [hd[0] + x * hr, hd[1] + hr * 1.75, hd[2] + z * hr], r: hr * 0.6, col: white, k: 0.05 })),
      // the mustache, curled at the ends
      ...[1, -1].flatMap(sx => [{ s: 'cap', a: [hd[0], hd[1] - hr * 0.15, hd[2] + hr * 0.95], b: [hd[0] + sx * hr * 0.55, hd[1] - hr * 0.18, hd[2] + hr * 0.82], r: hr * 0.13, r2: hr * 0.09, col: C('#3a2418') },
        { s: 'tor', ax: 'z', c: [hd[0] + sx * hr * 0.66, hd[1] - hr * 0.08, hd[2] + hr * 0.78], R: hr * 0.12, r: hr * 0.05, a0: sx > 0 ? -2.0 : 0.0, a1: sx > 0 ? 1.2 : Math.PI + 2.0, col: C('#3a2418') }]),
      { s: 'sph', c: [hd[0], hd[1] - hr * 0.02, hd[2] + hr * 1.0], r: hr * 0.2, col: C('#ff8a7a') });
    // the jacket over chest and belly, two rows of buttons, the neckerchief
    add(1, { s: 'ell', c: [0, 0.62, 0.0], rr: [0.33, 0.31, 0.28], col: white, k: 0.02 },
      ...[0.52, 0.64, 0.76].flatMap(y => [1, -1].map(sx => ({ s: 'sph', c: [sx * 0.09, y, 0.275], r: 0.03, col: C('#d8d8e0') }))),
      { s: 'tor', ax: 'y', c: [0, o.shY + 0.02, 0.01], R: 0.12, r: 0.045, a0: -Math.PI, a1: Math.PI, col: red },
      { s: 'ell', c: [0, o.shY - 0.03, 0.13], rr: [0.08, 0.07, 0.03], col: red });
    add(0, { s: 'ell', c: [0, 0.38, 0.02], rr: [0.3, 0.2, 0.26], col: white, k: 0.03 }, { s: 'box', c: [0, 0.3, 0.2], hs: [0.2, 0.18, 0.06], rd: 0.05, col: C('#f0f0f6') });
    for (const sd of ['L', 'R']) { const b = sd === 'L' ? 3 : 5; add(b, { s: 'cap', a: J['sh' + sd], b: J['el' + sd], r: o.armR * 1.25, col: white, k: 0.02 }); }
    // the cleaver in the right hand (blade down the hanging arm, so it swings out ahead), the pan in the left
    const hrp = J.haR, hl = J.haL;
    add(6, { s: 'cap', a: [hrp[0], hrp[1] + 0.02, hrp[2]], b: [hrp[0], hrp[1] - 0.12, hrp[2]], r: 0.03, col: C('#4a2a1a') },
      { s: 'box', c: [hrp[0], hrp[1] - 0.3, hrp[2] + 0.07], hs: [0.015, 0.18, 0.12], rd: 0.008, col: C('#d8dce4') },
      { s: 'box', c: [hrp[0], hrp[1] - 0.3, hrp[2] - 0.045], hs: [0.02, 0.18, 0.012], rd: 0.004, col: C('#9aa0aa') },
      { s: 'sph', c: [hrp[0], hrp[1] - 0.16, hrp[2] + 0.12], r: 0.022, sub: true });
    add(4, { s: 'cap', a: [hl[0], hl[1], hl[2]], b: [hl[0], hl[1] - 0.2, hl[2]], r: 0.025, col: C('#2a2a30') },
      { s: 'cyl', ax: 'x', c: [hl[0], hl[1] - 0.38, hl[2]], r: 0.2, hh: 0.035, rd: 0.02, col: C('#3a3a42') },
      { s: 'cyl', ax: 'x', c: [hl[0] + 0.02, hl[1] - 0.38, hl[2]], r: 0.16, hh: 0.02, rd: 0.0, col: C('#e8b84a') });
    m.top = hd[1] + hr * 2.4; m.bmin = [-0.65, -0.03, -0.55]; m.bmax = [0.65, m.top + 0.05, 0.6]; m.name = 'chef'; m.runAmp = 0.75; m.lean = 0.08;
    defs.chef = m;
  }
}
