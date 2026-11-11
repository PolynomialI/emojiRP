// ============================================================
// Chapters 1-10: each map's own enemy, and the Stone Plaza's own obstacles. Built with prop() like
// 04a/04b. Model units: 1 is about one hero leg. Parts without col take the instance tint.
// ============================================================
Object.assign(THEME_CLIPS, { pigeon: ['run'], scarab: ['run'], rat: ['run'], balloon: ['run'], gummy: ['run'], penguin: ['run'], magmite: ['run'], frog: ['run'], seagull: ['run'], martian: ['run'] });
Object.assign(THEME_CELLS, { statue: 0.022, fountain: 0.03, bench: 0.022,
  pigeon: 0.018, scarab: 0.018, rat: 0.016, balloon: 0.02, gummy: 0.02, penguin: 0.02, magmite: 0.02, frog: 0.018, seagull: 0.018, martian: 0.018 });
MESH_ORDER.push('statue', 'fountain', 'bench', 'pigeon', 'scarab', 'rat', 'balloon', 'gummy', 'penguin', 'magmite', 'frog', 'seagull', 'martian');

function themeModels3(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const dark = C('#1a1424'), white = C('#ffffff'), orange = C('#ff9a2a'), pink = C('#ff8fb0');
  // ---------- Stone Plaza obstacles: a blob hero statue on a plinth, a round fountain, a park bench ----------
  {
    const stone = C('#9aa2ae'), stoneD = C('#6e7684'), water = C('#5ad0ff'), wood = C('#a8693a'), iron = C('#2c3240');
    P('statue', [
      { s: 'box', c: [0, 0.22, 0], hs: [0.42, 0.22, 0.42], rd: 0.04, col: stoneD, k: 0.02 },
      { s: 'box', c: [0, 0.5, 0], hs: [0.34, 0.06, 0.34], rd: 0.03, col: stone, k: 0.02 },
      // the blob hero, mid-punch
      { s: 'ell', c: [0, 0.98, 0], rr: [0.22, 0.32, 0.2], k: 0.08 },
      { s: 'sph', c: [0, 1.4, 0.02], r: 0.19, k: 0.08 },
      { s: 'cap', a: [0.18, 1.08, 0], b: [0.46, 1.24, 0.18], r: 0.07, k: 0.06 }, { s: 'sph', c: [0.5, 1.26, 0.2], r: 0.12, k: 0.04 },
      { s: 'cap', a: [-0.18, 1.06, 0], b: [-0.3, 0.84, 0.1], r: 0.07, k: 0.06 }, { s: 'sph', c: [-0.32, 0.8, 0.12], r: 0.11, k: 0.04 },
      { s: 'cap', a: [0.1, 0.7, 0], b: [0.14, 0.56, 0.04], r: 0.08, k: 0.05 }, { s: 'cap', a: [-0.1, 0.7, 0], b: [-0.14, 0.56, -0.04], r: 0.08, k: 0.05 },
    ], { ao: 0.6 });
    P('fountain', [
      { s: 'cyl', ax: 'y', c: [0, 0.16, 0], r: 0.9, hh: 0.16, rd: 0.05, col: stone, k: 0.02 },
      { s: 'cyl', ax: 'y', c: [0, 0.27, 0], r: 0.78, hh: 0.06, rd: 0.02, col: water, k: 0, sub: false },
      { s: 'cyl', ax: 'y', c: [0, 0.55, 0], r: 0.12, hh: 0.3, rd: 0.04, col: stoneD, k: 0.04 },
      { s: 'cyl', ax: 'y', c: [0, 0.86, 0], r: 0.38, hh: 0.05, rd: 0.03, col: stone, k: 0.03 },
      { s: 'sph', c: [0, 1.0, 0], r: 0.1, col: stoneD, k: 0.03 },
      { s: 'ell', c: [0, 1.18, 0], rr: [0.05, 0.16, 0.05], col: water, k: 0.02 },
      ...[0, 1, 2, 3].map(i => { const a = i * Math.PI / 2 + 0.6; return { s: 'cap', a: [Math.cos(a) * 0.32, 0.9, Math.sin(a) * 0.32], b: [Math.cos(a) * 0.6, 0.4, Math.sin(a) * 0.6], r: 0.035, r2: 0.05, col: water, k: 0.02 }; }),
    ], { ao: 0.5 });
    P('bench', [
      ...[-0.18, 0, 0.18].map(z => ({ s: 'box', c: [0, 0.4, z * 0.6], hs: [0.7, 0.025, 0.05], rd: 0.015, col: wood, k: 0.005 })),
      ...[0.62, 0.78].map(y => ({ s: 'box', c: [0, y, -0.16], hs: [0.7, 0.04, 0.02], rd: 0.012, col: wood, k: 0.005 })),
      ...[1, -1].flatMap(sx => [
        { s: 'cap', a: [sx * 0.6, 0, 0.12], b: [sx * 0.6, 0.4, 0.1], r: 0.03, col: iron, k: 0.01 },
        { s: 'cap', a: [sx * 0.6, 0, -0.12], b: [sx * 0.6, 0.86, -0.18], r: 0.03, col: iron, k: 0.01 },
        { s: 'cap', a: [sx * 0.6, 0.55, 0.12], b: [sx * 0.6, 0.55, -0.15], r: 0.025, col: iron, k: 0.01 },
      ]),
    ], { ao: 0.6 });
  }
  // ---------- the chapter enemies: one-piece critters that bob along on the 'run' clip ----------
  // plaza pigeon: a plump grey bird (the tint) with an oily green-purple neck, orange feet
  P('pigeon', [
    { s: 'ell', c: [0, 0.38, 0], rr: [0.24, 0.24, 0.32], k: 0.05 },
    { s: 'sph', c: [0, 0.66, 0.2], r: 0.15, k: 0.05 },
    { s: 'ell', c: [0, 0.52, 0.14], rr: [0.17, 0.12, 0.14], col: C('#5ac08a'), k: 0.04 },
    { s: 'ell', c: [0, 0.48, 0.16], rr: [0.16, 0.06, 0.12], col: C('#9a6bd8'), k: 0.03 },
    { s: 'cap', a: [0, 0.66, 0.33], b: [0, 0.63, 0.43], r: 0.035, r2: 0.012, col: C('#3a3a44'), k: 0.01 },
    { s: 'sph', c: [0.08, 0.7, 0.3], r: 0.032, col: C('#ff7a2a'), k: 0 }, { s: 'sph', c: [-0.08, 0.7, 0.3], r: 0.032, col: C('#ff7a2a'), k: 0 },
    { s: 'sph', c: [0.09, 0.71, 0.32], r: 0.016, col: dark, k: 0 }, { s: 'sph', c: [-0.09, 0.71, 0.32], r: 0.016, col: dark, k: 0 },
    { s: 'ell', c: [0.2, 0.4, -0.04], rr: [0.06, 0.15, 0.26], col: C('#7a8498'), k: 0.03 }, { s: 'ell', c: [-0.2, 0.4, -0.04], rr: [0.06, 0.15, 0.26], col: C('#7a8498'), k: 0.03 },
    { s: 'ell', c: [0, 0.38, -0.36], rr: [0.12, 0.04, 0.16], col: C('#4a5060'), k: 0.03 },
    { s: 'cap', a: [0.08, 0.16, 0], b: [0.08, 0.02, 0.05], r: 0.025, col: orange, k: 0.01 }, { s: 'cap', a: [-0.08, 0.16, 0], b: [-0.08, 0.02, 0.05], r: 0.025, col: orange, k: 0.01 },
  ], { ao: 0.5 });
  // desert scarab: a gleaming beetle (the tint) with a gold stripe and a horn
  P('scarab', [
    { s: 'ell', c: [0, 0.26, -0.04], rr: [0.34, 0.2, 0.4], k: 0.03 },
    { s: 'box', c: [0, 0.36, -0.04], hs: [0.012, 0.12, 0.38], rd: 0.01, col: C('#ffd24a'), k: 0.01 },
    { s: 'ell', c: [0, 0.24, 0.36], rr: [0.2, 0.13, 0.12], col: C('#1e3a4a'), k: 0.03 },
    { s: 'cap', a: [0, 0.3, 0.44], b: [0, 0.5, 0.56], r: 0.04, r2: 0.012, col: C('#ffd24a'), k: 0.01 },
    { s: 'sph', c: [0.1, 0.28, 0.47], r: 0.035, col: C('#ff5a3a'), k: 0 }, { s: 'sph', c: [-0.1, 0.28, 0.47], r: 0.035, col: C('#ff5a3a'), k: 0 },
    ...[-0.22, 0, 0.22].flatMap(z => [1, -1].map(sx => ({ s: 'cap', a: [sx * 0.28, 0.18, z], b: [sx * 0.5, 0.02, z + 0.06], r: 0.03, col: dark, k: 0.01 }))),
  ], { ao: 0.6 });
  // city rat: grey (the tint), pink ears, nose and a long pink tail, beady red eyes
  P('rat', [
    { s: 'ell', c: [0, 0.22, -0.04], rr: [0.2, 0.18, 0.34], k: 0.05 },
    { s: 'cap', a: [0, 0.26, 0.22], b: [0, 0.2, 0.46], r: 0.14, r2: 0.04, k: 0.05 },
    { s: 'sph', c: [0, 0.21, 0.5], r: 0.04, col: pink, k: 0 },
    { s: 'ell', c: [0.1, 0.38, 0.24], rr: [0.08, 0.09, 0.025], col: pink, k: 0.01 }, { s: 'ell', c: [-0.1, 0.38, 0.24], rr: [0.08, 0.09, 0.025], col: pink, k: 0.01 },
    { s: 'sph', c: [0.07, 0.29, 0.38], r: 0.03, col: C('#ff3a4a'), k: 0 }, { s: 'sph', c: [-0.07, 0.29, 0.38], r: 0.03, col: C('#ff3a4a'), k: 0 },
    { s: 'cap', a: [0, 0.18, -0.36], b: [0.1, 0.12, -0.62], r: 0.025, col: pink, k: 0.01 }, { s: 'cap', a: [0.1, 0.12, -0.62], b: [-0.02, 0.18, -0.84], r: 0.02, r2: 0.01, col: pink, k: 0.01 },
    ...[-0.18, 0.14].flatMap(z => [1, -1].map(sx => ({ s: 'cap', a: [sx * 0.12, 0.1, z], b: [sx * 0.15, 0.02, z + 0.04], r: 0.03, col: pink, k: 0.01 }))),
  ], { ao: 0.5 });
  // bounce house balloon dog: sausage balloons (the tint) twisted into a dog, with a knot for a nose
  P('balloon', [
    { s: 'ell', c: [0, 0.6, 0], rr: [0.13, 0.13, 0.3], k: 0.03 },
    { s: 'ell', c: [0, 0.78, 0.36], rr: [0.12, 0.12, 0.15], k: 0.03 },
    { s: 'ell', c: [0, 0.74, 0.55], rr: [0.08, 0.08, 0.12], k: 0.02 },
    { s: 'sph', c: [0, 0.74, 0.69], r: 0.035, col: C('#d03a7a'), k: 0 },
    { s: 'ell', c: [0.1, 0.96, 0.32], rr: [0.07, 0.15, 0.07], k: 0.02 }, { s: 'ell', c: [-0.1, 0.96, 0.32], rr: [0.07, 0.15, 0.07], k: 0.02 },
    ...[[0.1, 0.3], [-0.1, 0.3], [0.1, -0.28], [-0.1, -0.28]].map(([x, z]) => ({ s: 'ell', c: [x, 0.3, z], rr: [0.07, 0.24, 0.07], k: 0.02 })),
    { s: 'ell', c: [0, 0.82, -0.36], rr: [0.06, 0.18, 0.06], k: 0.02 },
    { s: 'ell', c: [0.05, 0.66, 0.1], rr: [0.03, 0.06, 0.14], col: white, k: 0 },
  ], { ao: 0.3 });
  // candy gummy bear: a chunky little bear (the tint) with a shine
  P('gummy', [
    { s: 'ell', c: [0, 0.34, 0], rr: [0.26, 0.3, 0.22], k: 0.08 },
    { s: 'sph', c: [0, 0.74, 0.02], r: 0.22, k: 0.08 },
    { s: 'sph', c: [0.16, 0.92, 0], r: 0.08, k: 0.04 }, { s: 'sph', c: [-0.16, 0.92, 0], r: 0.08, k: 0.04 },
    { s: 'ell', c: [0, 0.68, 0.2], rr: [0.1, 0.07, 0.06], k: 0.04 },
    { s: 'sph', c: [0.08, 0.8, 0.19], r: 0.03, col: dark, k: 0 }, { s: 'sph', c: [-0.08, 0.8, 0.19], r: 0.03, col: dark, k: 0 },
    { s: 'cap', a: [0.22, 0.46, 0.04], b: [0.36, 0.32, 0.12], r: 0.09, k: 0.06 }, { s: 'cap', a: [-0.22, 0.46, 0.04], b: [-0.36, 0.32, 0.12], r: 0.09, k: 0.06 },
    { s: 'cap', a: [0.13, 0.12, 0], b: [0.15, 0.05, 0.12], r: 0.1, k: 0.06 }, { s: 'cap', a: [-0.13, 0.12, 0], b: [-0.15, 0.05, 0.12], r: 0.1, k: 0.06 },
    { s: 'ell', c: [-0.08, 0.84, 0.14], rr: [0.04, 0.05, 0.02], col: white, k: 0 },
  ], { ao: 0.4 });
  // tundra penguin: black back (the tint), white front, orange beak and feet, little flippers
  P('penguin', [
    { s: 'ell', c: [0, 0.42, 0], rr: [0.26, 0.4, 0.24], k: 0.05 },
    { s: 'ell', c: [0, 0.38, 0.1], rr: [0.2, 0.32, 0.16], col: white, k: 0.04 },
    { s: 'sph', c: [0, 0.82, 0.02], r: 0.18, k: 0.05 },
    { s: 'ell', c: [0, 0.8, 0.12], rr: [0.12, 0.1, 0.08], col: white, k: 0.03 },
    { s: 'cap', a: [0, 0.8, 0.18], b: [0, 0.77, 0.3], r: 0.045, r2: 0.012, col: orange, k: 0.01 },
    { s: 'sph', c: [0.07, 0.86, 0.17], r: 0.03, col: dark, k: 0 }, { s: 'sph', c: [-0.07, 0.86, 0.17], r: 0.03, col: dark, k: 0 },
    { s: 'ell', c: [0.26, 0.48, 0], rr: [0.04, 0.2, 0.1], k: 0.03 }, { s: 'ell', c: [-0.26, 0.48, 0], rr: [0.04, 0.2, 0.1], k: 0.03 },
    { s: 'ell', c: [0.1, 0.03, 0.08], rr: [0.08, 0.025, 0.11], col: orange, k: 0.01 }, { s: 'ell', c: [-0.1, 0.03, 0.08], rr: [0.08, 0.025, 0.11], col: orange, k: 0.01 },
  ], { ao: 0.5 });
  // volcano magma imp: a glowing core (the tint) wearing a cracked shell of dark rock, with a grin
  P('magmite', [
    { s: 'sph', c: [0, 0.42, 0], r: 0.28, k: 0.05 },
    ...[[0.18, 0.56, 0.12, 0.13], [-0.2, 0.52, 0.08, 0.14], [0.02, 0.66, -0.12, 0.15], [0.2, 0.3, -0.12, 0.13], [-0.16, 0.28, -0.14, 0.13], [0, 0.22, 0.18, 0.11]]
      .map(([x, y, z, r]) => ({ s: 'sph', c: [x, y, z], r, col: C('#2a2024'), k: 0.03 })),
    { s: 'sph', c: [0.09, 0.48, 0.25], r: 0.04, col: C('#fff2a0'), k: 0 }, { s: 'sph', c: [-0.09, 0.48, 0.25], r: 0.04, col: C('#fff2a0'), k: 0 },
    { s: 'tor', ax: 'z', c: [0, 0.38, 0.25], R: 0.08, r: 0.02, a0: -2.6, a1: -0.5, col: C('#fff2a0'), k: 0 },
    { s: 'cap', a: [0.06, 0.66, 0.08], b: [0.1, 0.84, 0.04], r: 0.04, r2: 0.01, k: 0.02 }, { s: 'cap', a: [-0.08, 0.66, 0.06], b: [-0.12, 0.8, 0.02], r: 0.035, r2: 0.01, k: 0.02 },
  ], { ao: 0.3 });
  // jungle frog: a fat green frog (the tint) with bulging eyes and a wide grin
  P('frog', [
    { s: 'ell', c: [0, 0.24, 0], rr: [0.3, 0.2, 0.32], k: 0.06 },
    { s: 'ell', c: [0, 0.18, 0.08], rr: [0.24, 0.12, 0.24], col: C('#e8f5a0'), k: 0.04 },
    ...[1, -1].flatMap(sx => [
      { s: 'sph', c: [sx * 0.15, 0.42, 0.16], r: 0.11, k: 0.05 },
      { s: 'sph', c: [sx * 0.16, 0.45, 0.22], r: 0.07, col: white, k: 0 }, { s: 'sph', c: [sx * 0.17, 0.46, 0.28], r: 0.035, col: dark, k: 0 },
      { s: 'ell', c: [sx * 0.32, 0.12, -0.12], rr: [0.1, 0.1, 0.18], k: 0.05 },
      { s: 'ell', c: [sx * 0.36, 0.02, 0.06], rr: [0.08, 0.02, 0.1], k: 0.02 },
      { s: 'cap', a: [sx * 0.2, 0.16, 0.24], b: [sx * 0.24, 0.02, 0.32], r: 0.04, k: 0.03 },
    ]),
    { s: 'tor', ax: 'z', c: [0, 0.3, 0.27], R: 0.13, r: 0.015, a0: -2.8, a1: -0.34, col: dark, k: 0 },
    { s: 'sph', c: [0.1, 0.3, -0.18], r: 0.05, col: C('#2a8a3a'), k: 0.01 }, { s: 'sph', c: [-0.12, 0.34, -0.06], r: 0.045, col: C('#2a8a3a'), k: 0.01 },
  ], { ao: 0.5 });
  // beach seagull: white body (the tint), grey wings spread, yellow beak with a red spot
  P('seagull', [
    { s: 'ell', c: [0, 0.5, 0], rr: [0.17, 0.17, 0.32], k: 0.05 },
    { s: 'sph', c: [0, 0.68, 0.24], r: 0.13, k: 0.05 },
    { s: 'cap', a: [0, 0.66, 0.34], b: [0, 0.62, 0.5], r: 0.035, r2: 0.015, col: C('#ffd23a'), k: 0.01 },
    { s: 'sph', c: [0, 0.61, 0.46], r: 0.018, col: C('#ff3a3a'), k: 0 },
    { s: 'sph', c: [0.08, 0.72, 0.31], r: 0.022, col: dark, k: 0 }, { s: 'sph', c: [-0.08, 0.72, 0.31], r: 0.022, col: dark, k: 0 },
    ...[1, -1].flatMap(sx => [
      { s: 'ell', c: [sx * 0.34, 0.6, -0.02], rr: [0.24, 0.035, 0.14], col: C('#a8b4c4'), k: 0.03 },
      { s: 'ell', c: [sx * 0.6, 0.66, -0.06], rr: [0.14, 0.03, 0.09], col: C('#3a404c'), k: 0.03 },
    ]),
    { s: 'ell', c: [0, 0.5, -0.36], rr: [0.1, 0.03, 0.12], col: C('#a8b4c4'), k: 0.03 },
    { s: 'cap', a: [0.06, 0.34, 0], b: [0.06, 0.16, 0.02], r: 0.02, col: orange, k: 0.01 }, { s: 'cap', a: [-0.06, 0.34, 0], b: [-0.06, 0.16, 0.02], r: 0.02, col: orange, k: 0.01 },
  ], { ao: 0.4 });
  // moon martian: a little green alien (the tint) with a big head, black eyes, an antenna and a ray gun
  P('martian', [
    { s: 'ell', c: [0, 0.32, 0], rr: [0.16, 0.22, 0.14], k: 0.05 },
    { s: 'ell', c: [0, 0.72, 0.02], rr: [0.26, 0.22, 0.22], k: 0.06 },
    { s: 'ell', c: [0.11, 0.72, 0.18], rr: [0.08, 0.05, 0.05], col: dark, k: 0 }, { s: 'ell', c: [-0.11, 0.72, 0.18], rr: [0.08, 0.05, 0.05], col: dark, k: 0 },
    { s: 'sph', c: [0.13, 0.74, 0.22], r: 0.015, col: white, k: 0 }, { s: 'sph', c: [-0.09, 0.74, 0.22], r: 0.015, col: white, k: 0 },
    { s: 'cap', a: [0, 0.92, 0], b: [0.06, 1.08, -0.02], r: 0.015, k: 0.01 }, { s: 'sph', c: [0.06, 1.1, -0.02], r: 0.04, col: C('#ff5fb8'), k: 0 },
    { s: 'cap', a: [0.14, 0.42, 0], b: [0.24, 0.36, 0.2], r: 0.04, k: 0.03 },
    { s: 'box', c: [0.26, 0.37, 0.28], hs: [0.04, 0.05, 0.1], rd: 0.02, col: C('#c8d0e0'), k: 0.01 },
    { s: 'sph', c: [0.26, 0.38, 0.4], r: 0.035, col: C('#5af0ff'), k: 0 },
    { s: 'cap', a: [-0.14, 0.42, 0], b: [-0.2, 0.24, 0.04], r: 0.04, k: 0.03 },
    { s: 'cap', a: [0.07, 0.14, 0], b: [0.08, 0.02, 0.06], r: 0.05, k: 0.03 }, { s: 'cap', a: [-0.07, 0.14, 0], b: [-0.08, 0.02, 0.06], r: 0.05, k: 0.03 },
  ], { ao: 0.5 });
}
