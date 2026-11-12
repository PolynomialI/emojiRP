// ============================================================
// Chapter 16, the Clockwork Factory: spinning gear stacks, hydraulic presses, boilers, pipe runs and riveted
// bulkheads; the wind-up cogbot, the rolling gearling, and the Clockwork Colossus. Built with prop() like 04a-04d.
// ============================================================
Object.assign(THEME_CLIPS, { cogbot: ['run'], gearling: ['run'], colossus: ['run', 'slam', 'idle', 'throw'] });
Object.assign(THEME_CELLS, { gearstack: 0.02, press: 0.022, piston: 0.02, boiler: 0.022, pipes: 0.02, factwall: 0.025, cogbot: 0.016, gearling: 0.016, colossus: 0.015, sawblade: 0.014 });
MESH_ORDER.push('gearstack', 'press', 'piston', 'boiler', 'pipes', 'factwall', 'cogbot', 'gearling', 'sawblade', 'colossus');

function factoryModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const brass = C('#d8a440'), copper = C('#c8703a'), steel = C('#9aa4b2'), steelD = C('#5a6270'), iron = C('#33363e'), dark = C('#16141c');
  const hazard = C('#ffc21f'), red = C('#e83a3a'), glow = C('#7ff6ff'), cream = C('#f6eedc'), white = C('#ffffff');
  // a gear lying flat at height y: disc, hub, holes and radial teeth
  const gear = (y, R, hh, col, teeth, out) => {
    const parts = [{ s: 'cyl', ax: 'y', c: [0, y, 0], r: R, hh, rd: hh * 0.4, col, k: 0 }];
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * TAU;
      parts.push({ s: 'cap', a: [Math.cos(a) * (R - 0.02), y, Math.sin(a) * (R - 0.02)], b: [Math.cos(a) * (R + out), y, Math.sin(a) * (R + out)], r: hh * 0.95, col, k: 0 });
    }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.4; parts.push({ s: 'cyl', ax: 'y', c: [Math.cos(a) * R * 0.55, y, Math.sin(a) * R * 0.55], r: R * 0.18, hh: hh * 1.6, rd: 0, sub: true, k: 0.005 }); }
    parts.push({ s: 'cyl', ax: 'y', c: [0, y, 0], r: R * 0.22, hh: hh * 1.4, rd: hh * 0.4, col: steelD, k: 0 });
    return parts;
  };
  // a gear standing up, facing along x (a wheel), at (0, y, 0)
  const wheel = (y, R, hh, col, teeth, out) => {
    const parts = [{ s: 'cyl', ax: 'x', c: [0, y, 0], r: R, hh, rd: hh * 0.4, col, k: 0 }];
    for (let i = 0; i < teeth; i++) { const a = (i / teeth) * TAU; parts.push({ s: 'cap', a: [0, y + Math.cos(a) * (R - 0.02), Math.sin(a) * (R - 0.02)], b: [0, y + Math.cos(a) * (R + out), Math.sin(a) * (R + out)], r: hh * 0.95, col, k: 0 }); }
    return parts;
  };

  // ---------- scenery ----------
  // three gears of brass, steel and copper on one axle, turning together (the theme spins its yaw)
  P('gearstack', [
    { s: 'cyl', ax: 'y', c: [0, 0.08, 0], r: 0.3, hh: 0.08, rd: 0.03, col: iron, k: 0 },
    { s: 'cap', a: [0, 0.1, 0], b: [0, 1.0, 0], r: 0.05, col: steelD, k: 0 },
    ...gear(0.3, 0.46, 0.06, brass, 14, 0.07), ...gear(0.6, 0.32, 0.05, steel, 10, 0.06), ...gear(0.86, 0.2, 0.045, copper, 8, 0.05),
    { s: 'sph', c: [0, 1.0, 0], r: 0.07, col: brass, k: 0 },
  ], { ao: 0.8 });
  // a hydraulic press: two pillars and a beam over an anvil plate; its piston head is drawn separately ('piston')
  P('press', [
    { s: 'box', c: [0, 0.06, 0], hs: [0.48, 0.06, 0.36], rd: 0.02, col: steelD, k: 0 },
    { s: 'box', c: [0, 0.15, 0], hs: [0.3, 0.04, 0.26], rd: 0.01, col: iron, k: 0 },
    ...[0.12, -0.12].flatMap(z => [{ s: 'box', c: [0, 0.155, z], hs: [0.3, 0.012, 0.025], rd: 0, col: hazard, k: 0 }]),
    ...[1, -1].map(sx => ({ s: 'box', c: [sx * 0.42, 0.65, 0], hs: [0.06, 0.6, 0.1], rd: 0.02, col: C('#e8a43a'), k: 0 })),
    ...[1, -1].map(sx => ({ s: 'box', c: [sx * 0.42, 0.65, 0.101], hs: [0.03, 0.55, 0.004], rd: 0, col: dark, k: 0 })),
    { s: 'box', c: [0, 1.28, 0], hs: [0.5, 0.1, 0.13], rd: 0.03, col: C('#e8a43a'), k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 1.18, 0], r: 0.1, hh: 0.12, rd: 0.02, col: steel, k: 0 },
    { s: 'cyl', ax: 'z', c: [0.25, 1.28, 0.13], r: 0.06, hh: 0.015, rd: 0.005, col: cream, k: 0 },
    { s: 'cap', a: [0.25, 1.28, 0.15], b: [0.27, 1.32, 0.15], r: 0.007, col: red, k: 0 },
  ], { ao: 1.2 });
  P('piston', [
    { s: 'cap', a: [0, 0.2, 0], b: [0, 0.9, 0], r: 0.06, col: C('#d8dce4'), k: 0 },
    { s: 'box', c: [0, 0.1, 0], hs: [0.24, 0.1, 0.2], rd: 0.03, col: steelD, k: 0 },
    { s: 'box', c: [0, 0.01, 0], hs: [0.25, 0.012, 0.21], rd: 0.005, col: dark, k: 0 },
  ], { ao: 0.5 });
  // a riveted boiler tank on legs, with pressure gauges, a valve wheel and a smokestack
  P('boiler', [
    { s: 'cyl', ax: 'x', c: [0, 0.5, 0], r: 0.34, hh: 0.46, rd: 0.12, col: copper, k: 0 },
    ...[-0.3, 0, 0.3].map(x => ({ s: 'tor', ax: 'x', c: [x, 0.5, 0], R: 0.345, r: 0.018, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 })),
    ...[[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].map(([x, z]) => ({ s: 'cap', a: [x, 0, z], b: [x, 0.3, z * 0.8], r: 0.035, col: iron, k: 0 })),
    { s: 'cyl', ax: 'y', c: [0.22, 1.0, 0], r: 0.08, hh: 0.2, rd: 0.02, col: iron, k: 0 }, { s: 'cyl', ax: 'y', c: [0.22, 1.2, 0], r: 0.1, hh: 0.03, rd: 0.01, col: iron, k: 0 },
    ...[-0.15, 0.08].map(x => ({ s: 'cyl', ax: 'z', c: [x, 0.62, 0.33], r: 0.07, hh: 0.02, rd: 0.01, col: cream, k: 0 })),
    ...[-0.15, 0.08].map(x => ({ s: 'tor', ax: 'z', c: [x, 0.62, 0.35], R: 0.07, r: 0.012, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 })),
    ...[-0.15, 0.08].map((x, i) => ({ s: 'cap', a: [x, 0.62, 0.36], b: [x + (i ? 0.04 : -0.03), 0.66, 0.36], r: 0.007, col: red, k: 0 })),
    { s: 'tor', ax: 'z', c: [-0.32, 0.4, 0.3], R: 0.08, r: 0.014, a0: -Math.PI, a1: Math.PI, col: red, k: 0 },
    { s: 'cap', a: [-0.4, 0.4, 0.3], b: [-0.24, 0.4, 0.3], r: 0.01, col: red, k: 0 }, { s: 'cap', a: [-0.32, 0.32, 0.3], b: [-0.32, 0.48, 0.3], r: 0.01, col: red, k: 0 },
  ], { ao: 1 });
  // a run of three pipes on brackets, with flanges and a red valve wheel
  P('pipes', [
    ...[[0.14, 0.1, steel], [0.14, -0.12, copper], [0.36, 0, C('#5a8a6a')]].flatMap(([y, z, col]) => [
      { s: 'cyl', ax: 'x', c: [0, y, z], r: 0.09, hh: 0.5, rd: 0.03, col, k: 0 },
      ...[-0.3, 0.3].map(x => ({ s: 'cyl', ax: 'x', c: [x, y, z], r: 0.115, hh: 0.025, rd: 0.01, col: steelD, k: 0 })),
    ]),
    ...[-0.38, 0.38].map(x => ({ s: 'box', c: [x, 0.22, 0], hs: [0.03, 0.22, 0.2], rd: 0.01, col: iron, k: 0 })),
    { s: 'tor', ax: 'y', c: [0, 0.5, 0], R: 0.1, r: 0.016, a0: -Math.PI, a1: Math.PI, col: red, k: 0 },
    { s: 'cap', a: [0, 0.45, 0], b: [0, 0.5, 0], r: 0.015, col: steelD, k: 0 },
    { s: 'cap', a: [-0.1, 0.5, 0], b: [0.1, 0.5, 0], r: 0.01, col: red, k: 0 }, { s: 'cap', a: [0, 0.5, -0.1], b: [0, 0.5, 0.1], r: 0.01, col: red, k: 0 },
  ], { ao: 0.7 });
  // the bulkhead wall: riveted steel panels with a hazard band, facing in
  P('factwall', [
    { s: 'box', c: [0, 0.55, 0], hs: [0.5, 0.55, 0.12], rd: 0.02, col: C('#7a828e'), k: 0 },
    { s: 'box', c: [0, 0.18, 0.121], hs: [0.5, 0.07, 0.006], rd: 0, col: hazard, k: 0 },
    ...[-0.375, -0.125, 0.125, 0.375].map(x => ({ s: 'box', c: [x, 0.18, 0.126], hs: [0.06, 0.07, 0.004], rd: 0, col: dark, k: 0 })),
    ...[[-0.42, 0.95], [0.42, 0.95], [-0.42, 0.4], [0.42, 0.4], [0, 0.95]].map(([x, y]) => ({ s: 'sph', c: [x, y, 0.12], r: 0.025, col: steelD, k: 0 })),
    { s: 'box', c: [0, 1.11, 0], hs: [0.51, 0.025, 0.14], rd: 0.01, col: steelD, k: 0 },
  ], { ao: 0.8 });

  // ---------- creatures. Parts without col take the tint ----------
  // cogbot: a tin wind-up robot with a visor, an antenna, pincer hands, a chest gear and a key in its back
  P('cogbot', [
    { s: 'box', c: [0, 0.42, 0], hs: [0.2, 0.18, 0.16], rd: 0.06, k: 0.02 },
    { s: 'sph', c: [0, 0.72, 0.02], r: 0.16, k: 0.04 },
    { s: 'ell', c: [0, 0.73, 0.15], rr: [0.12, 0.045, 0.05], col: glow, k: 0 },
    { s: 'cap', a: [0, 0.86, 0], b: [0.03, 1.0, -0.02], r: 0.012, col: steelD, k: 0 }, { s: 'sph', c: [0.03, 1.01, -0.02], r: 0.035, col: red, k: 0 },
    { s: 'tor', ax: 'z', c: [0, 0.44, 0.165], R: 0.07, r: 0.018, a0: -Math.PI, a1: Math.PI, col: brass, k: 0 },
    { s: 'cap', a: [0, 0.5, -0.15], b: [0, 0.5, -0.3], r: 0.025, col: brass, k: 0 },
    ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.07, 0.5, -0.32], rr: [0.065, 0.05, 0.016], col: brass, k: 0.005 })),
    ...[1, -1].flatMap(sx => [
      { s: 'cap', a: [sx * 0.2, 0.5, 0], b: [sx * 0.3, 0.36, 0.1], r: 0.035, col: steel, k: 0.01 },
      { s: 'cap', a: [sx * 0.3, 0.36, 0.1], b: [sx * 0.27, 0.3, 0.2], r: 0.022, col: steelD, k: 0 }, { s: 'cap', a: [sx * 0.3, 0.36, 0.1], b: [sx * 0.34, 0.3, 0.2], r: 0.022, col: steelD, k: 0 },
      { s: 'cap', a: [sx * 0.1, 0.25, 0], b: [sx * 0.11, 0.06, 0.02], r: 0.035, col: steel, k: 0.01 },
      { s: 'box', c: [sx * 0.11, 0.035, 0.05], hs: [0.06, 0.035, 0.09], rd: 0.02, col: steelD, k: 0.01 },
    ]),
  ], { ao: 0.5 });
  // gearling: a toothed wheel with an angry face on its hub; it rolls (its run clip spins it about x)
  const gl = P('gearling', [
    ...wheel(0.42, 0.36, 0.07, null, 12, 0.07),
    { s: 'cyl', ax: 'x', c: [0, 0.42, 0], r: 0.14, hh: 0.1, rd: 0.03, col: steelD, k: 0 },
    ...[1, -1].flatMap(sx => [
      { s: 'sph', c: [sx * 0.11, 0.47, 0.05], r: 0.035, col: white, k: 0 }, { s: 'sph', c: [sx * 0.115, 0.47, 0.06], r: 0.018, col: dark, k: 0 },
      { s: 'cap', a: [sx * 0.11, 0.51, 0.0], b: [sx * 0.11, 0.53, 0.09], r: 0.01, col: dark, k: 0 },
      { s: 'ell', c: [sx * 0.11, 0.38, 0.02], rr: [0.006, 0.012, 0.05], col: dark, k: 0 },
    ]),
  ], { ao: 0.4 });
  rig(gl, { 0: [0, 0.42, 0] }); gl.roll = true;
  // a saw blade for the Colossus to throw: a thin steel disc with teeth, lying flat
  P('sawblade', [
    { s: 'cyl', ax: 'y', c: [0, 0.05, 0], r: 0.42, hh: 0.025, rd: 0.01, col: C('#c8d0da'), k: 0 },
    ...Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * TAU; return { s: 'cap', a: [Math.cos(a) * 0.4, 0.05, Math.sin(a) * 0.4], b: [Math.cos(a + 0.18) * 0.5, 0.05, Math.sin(a + 0.18) * 0.5], r: 0.022, r2: 0.004, col: C('#e8eef6'), k: 0 }; }),
    { s: 'cyl', ax: 'y', c: [0, 0.05, 0], r: 0.1, hh: 0.04, rd: 0.01, col: brass, k: 0 },
    { s: 'cyl', ax: 'y', c: [0, 0.05, 0], r: 0.33, hh: 0.03, rd: 0.0, col: C('#9aa4b2'), k: 0 },
  ], { ao: 0.2 });

  // ---------- the Clockwork Colossus (chapter 16 boss): a brass giant with a clock in its chest, gears for
  // shoulders, a chimney on its head, a buzzsaw for a right hand and a piston fist for a left. Plain parts take the tint. ----------
  {
    const o = { ...STICK, hipY: 0.42, shY: 0.86, headY: 1.08, headR: 0.16, headZ: 0.04, shW: 0.28, hipW: 0.13, elOut: 0.08, upperLen: 0.18, foreLen: 0.17,
      pelvisR: 0.17, torso: 'ell', torsoRR: [0.28, 0.28, 0.22], neckR: 0.1, armR: 0.085, handR: 0.1, legR: 0.11, k: 0.04 };
    const m = makeHumanoid(o), J = m.J, hd = J.head;
    const add = (b, ...parts) => { for (const p of parts) m.parts.push({ k: 0, ...p, bone: b }); };
    // the chest: a riveted barrel with the clock in front and a big gear behind
    add(1, { s: 'cyl', ax: 'y', c: [0, 0.66, 0], r: 0.3, hh: 0.21, rd: 0.07 },
      ...[0.5, 0.82].map(y => ({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.29, r: 0.018, a0: -Math.PI, a1: Math.PI, col: steelD })),
      { s: 'cyl', ax: 'z', c: [0, 0.67, 0.27], r: 0.19, hh: 0.025, rd: 0.01, col: cream },
      { s: 'tor', ax: 'z', c: [0, 0.67, 0.3], R: 0.19, r: 0.026, a0: -Math.PI, a1: Math.PI, col: brass },
      ...Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * TAU; return { s: 'sph', c: [Math.cos(a) * 0.15, 0.67 + Math.sin(a) * 0.15, 0.3], r: i % 3 ? 0.01 : 0.017, col: dark }; }),
      { s: 'cap', a: [0, 0.67, 0.302], b: [0, 0.79, 0.302], r: 0.012, col: dark }, { s: 'cap', a: [0, 0.67, 0.302], b: [0.08, 0.64, 0.302], r: 0.014, col: dark },
      { s: 'sph', c: [0, 0.67, 0.305], r: 0.022, col: red },
      { s: 'cyl', ax: 'z', c: [0, 0.7, -0.26], r: 0.21, hh: 0.035, rd: 0.01, col: steel },
      ...Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * TAU; return { s: 'cap', a: [Math.cos(a) * 0.2, 0.7 + Math.sin(a) * 0.2, -0.26], b: [Math.cos(a) * 0.27, 0.7 + Math.sin(a) * 0.27, -0.26], r: 0.032, col: steel }; }),
      { s: 'cyl', ax: 'z', c: [0, 0.7, -0.3], r: 0.06, hh: 0.03, rd: 0.01, col: brass },
      // copper steam pipes from the back to the shoulders
      ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.12, 0.88, -0.2], b: [sx * 0.26, 0.98, -0.08], r: 0.03, col: copper })),
      // shoulder gears lying flat
      ...[1, -1].flatMap(sx => [{ s: 'cyl', ax: 'y', c: [sx * 0.31, 0.93, 0], r: 0.15, hh: 0.045, rd: 0.015, col: steel },
        ...Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * TAU; return { s: 'cap', a: [sx * 0.31 + Math.cos(a) * 0.14, 0.93, Math.sin(a) * 0.14], b: [sx * 0.31 + Math.cos(a) * 0.2, 0.93, Math.sin(a) * 0.2], r: 0.035, col: steel }; }),
        { s: 'cyl', ax: 'y', c: [sx * 0.31, 0.95, 0], r: 0.05, hh: 0.05, rd: 0.01, col: brass }]),
    );
    // the head: a riveted dome with a glowing red visor and a chimney
    add(2, { s: 'ell', c: [hd[0], hd[1] + 0.01, hd[2] + 0.12], rr: [0.12, 0.04, 0.07], col: C('#ff5030') },
      { s: 'tor', ax: 'y', c: [hd[0], hd[1] - 0.04, hd[2]], R: 0.155, r: 0.02, a0: -Math.PI, a1: Math.PI, col: steelD },
      { s: 'cyl', ax: 'y', c: [hd[0] + 0.07, hd[1] + 0.2, hd[2] - 0.05], r: 0.04, hh: 0.09, rd: 0.01, col: iron },
      { s: 'cyl', ax: 'y', c: [hd[0] + 0.07, hd[1] + 0.29, hd[2] - 0.05], r: 0.055, hh: 0.02, rd: 0.008, col: iron });
    // the arms: steel pistons; a buzzsaw on the right hand, a piston fist on the left
    for (const sd of ['L', 'R']) {
      const b = sd === 'L' ? 3 : 5;
      add(b, { s: 'cap', a: J['sh' + sd], b: J['el' + sd], r: 0.06, col: steel });
      add(b + 1, { s: 'cap', a: J['el' + sd], b: J['ha' + sd], r: 0.075, r2: 0.065, col: steelD }, { s: 'tor', ax: 'y', c: [J['el' + sd][0], J['el' + sd][1] - 0.05, J['el' + sd][2]], R: 0.075, r: 0.014, col: brass, a0: -Math.PI, a1: Math.PI });
    }
    const hr = J.haR, hl = J.haL;
    add(6, { s: 'cyl', ax: 'x', c: [hr[0] - 0.03, hr[1] - 0.08, hr[2] + 0.03], r: 0.17, hh: 0.014, rd: 0.005, col: C('#c8d0da') },
      ...Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * TAU; return { s: 'cap', a: [hr[0] - 0.03, hr[1] - 0.08 + Math.cos(a) * 0.16, hr[2] + 0.03 + Math.sin(a) * 0.16], b: [hr[0] - 0.03, hr[1] - 0.08 + Math.cos(a + 0.2) * 0.21, hr[2] + 0.03 + Math.sin(a + 0.2) * 0.21], r: 0.016, r2: 0.004, col: C('#e8eef6') }; }),
      { s: 'cyl', ax: 'x', c: [hr[0] - 0.03, hr[1] - 0.08, hr[2] + 0.03], r: 0.045, hh: 0.03, rd: 0.01, col: brass });
    add(4, { s: 'cyl', ax: 'y', c: [hl[0], hl[1] - 0.04, hl[2]], r: 0.11, hh: 0.08, rd: 0.03, col: steelD },
      { s: 'box', c: [hl[0], hl[1] - 0.13, hl[2] + 0.02], hs: [0.11, 0.035, 0.1], rd: 0.025, col: iron });
    // gearbox hips and heavy boots
    add(0, { s: 'box', c: [0, o.hipY + 0.02, 0], hs: [0.21, 0.09, 0.16], rd: 0.04, col: steelD }, { s: 'cyl', ax: 'z', c: [0, o.hipY + 0.02, 0.16], r: 0.07, hh: 0.02, rd: 0.008, col: brass });
    for (const sd of ['L', 'R']) {
      const an = J['an' + sd], b = sd === 'L' ? 8 : 10;
      add(b, { s: 'box', c: [an[0], an[1] + 0.02, an[2] + 0.05], hs: [0.11, 0.06, 0.16], rd: 0.035, col: iron }, { s: 'cap', a: [an[0], an[1] + 0.05, an[2]], b: [J['kn' + sd][0], J['kn' + sd][1], J['kn' + sd][2]], r: 0.1, r2: 0.09, col: steelD });
    }
    m.top = hd[1] + 0.32; m.bmin = [-0.62, -0.03, -0.5]; m.bmax = [0.62, m.top + 0.05, 0.5]; m.name = 'colossus'; m.runAmp = 0.7; m.lean = 0.08;
    defs.colossus = m;
  }
}
