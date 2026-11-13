// ============================================================
// Chapter 20, the Crater and the Cave. Outside: ground-colored boulders, cliffs round the rim, ore rocks,
// mine carts, lantern posts and the huge cave mouth at the top of the map. Inside: rough rock wall segments,
// stalactites and stalagmites, low wall-like boulders for cover (and the rubble they break into), tall stone
// pillars, wall torches, braziers and mine timbers. The cave's people: crossbowmen, armored spearmen and
// shieldmen, and the hard-hatted mole miner (also the crater's own creature). The Bagger is in 04j.
// Rocks are 'crag' parts (faceted chunks, 03-sdfmesh.js); parts without col take the instance tint.
// ============================================================
Object.assign(THEME_CLIPS, { mole: ['run', 'slam', 'idle'], xbowman: ['run', 'aim', 'idle'], spearman: ['run', 'throw', 'slam', 'idle'], shieldman: ['run', 'slam', 'idle'],
  cspider: ['skitter', 'bite'], cbat: ['batflap'], goblin: ['run', 'throw', 'idle'], ogre: ['run', 'throw', 'slam', 'idle'], golem: ['run', 'aim', 'slam', 'idle'] });
// a cave spider's legs move in two alternating sets (bones 1 and 2), the front pair (bone 4) feels the air and the
// abdomen (bone 3) bobs; biting, the front legs rear up and it lunges
CLIPS.skitter = { frames: 12, fn(t) {
  const a = t * TAU, s = Math.sin(a);
  return { root: [0, 0.02 * Math.abs(Math.sin(a * 2)), 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 1 ? [0, 0.32 * s, 0.12 * Math.max(0, s)] : b === 2 ? [0, -0.32 * s, 0.12 * Math.max(0, -s)] : b === 4 ? [0.25 * Math.sin(a * 2), 0, 0] : b === 3 ? [0.08 * Math.sin(a * 2), 0, 0] : [0, 0, 0])) };
} };
CLIPS.bite = { frames: 12, fn(t) {
  const up = Math.sin(Math.min(1, t / 0.6) * Math.PI * 0.5), hit = t > 0.6 ? Math.sin((t - 0.6) / 0.4 * Math.PI) : 0;
  return { root: [0, 0.05 * up, 0.18 * hit], rot: Array.from({ length: NBONES }, (_, b) => (b === 4 ? [-0.9 * up + 1.3 * hit, 0, 0] : b === 0 ? [-0.18 * up + 0.2 * hit, 0, 0] : [0, 0, 0])) };
} };
// a bat's wings beat (bones 1 and 2 about the body's length)
CLIPS.batflap = { frames: 10, fn(t) {
  const a = Math.sin(t * TAU) * 0.95;
  return { root: [0, 0.04 * Math.cos(t * TAU), 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 1 ? [0, 0, a] : b === 2 ? [0, 0, -a] : [0, 0, 0])) };
} };
Object.assign(THEME_CELLS, { boulder0: 0.025, boulder1: 0.025, boulder2: 0.025, cliff0: 0.03, cliff1: 0.03, cavemouth: 0.026, minecart: 0.014, lanternpost: 0.014, ore: 0.022,
  cwall0: 0.03, cwall1: 0.03, cwall2: 0.03, stalac: 0.02, stalag: 0.02, cover0: 0.022, cover1: 0.022, cover2: 0.022, rubble: 0.02, cpillar: 0.026, torch: 0.008, brazier: 0.012, mbeam: 0.02,
  mole: 0.014, xbowman: 0.013, spearman: 0.013, shieldman: 0.013, cspider: 0.012, cbat: 0.01, goblin: 0.012, ogre: 0.013, golem: 0.014, dynamite: 0.008 });
MESH_ORDER.push('boulder0', 'boulder1', 'boulder2', 'cliff0', 'cliff1', 'cavemouth', 'minecart', 'lanternpost', 'ore', 'stalag', 'mole',
  'cwall0', 'cwall1', 'cwall2', 'stalac', 'cover0', 'cover1', 'cover2', 'rubble', 'cpillar', 'torch', 'brazier', 'mbeam', 'xbowman', 'spearman', 'shieldman',
  'cspider', 'cbat', 'goblin', 'ogre', 'golem', 'dynamite');

function caveModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  // a faceted rock chunk (no col: takes the instance tint)
  const crag = (c, r, seed, sc, k = 0.035, col) => ({ s: 'crag', c, r, seed, n: 10, sc, k, col });
  const wood = C('#6e4a2c'), woodD = C('#4a301c'), woodL = C('#8e643e'), iron = C('#4a4e58'), ironD = C('#2c2e36'), steel = C('#9aa6b4'), steelD = C('#5e6a78');
  const gold = C('#ffc93a'), crystal = C('#7ae8ff'), lampY = C('#fff2b0'), black = C('#060405'), dirt = C('#2a2018'), rope = C('#c8a870');

  // ---------- outside: boulders the color of the ground, cliffs, ore, carts, lanterns ----------
  P('boulder0', [crag([0, 0.3, 0], 0.42, 11, [1.15, 0.8, 1]), crag([0.36, 0.16, 0.12], 0.22, 12), crag([-0.3, 0.1, -0.2], 0.16, 13)], { ao: 1.2 });
  P('boulder1', [crag([0, 0.38, 0], 0.36, 21, [0.9, 1.15, 0.85]), crag([0.22, 0.12, 0.22], 0.2, 22), crag([-0.25, 0.12, 0.1], 0.18, 23), crag([0.05, 0.62, -0.05], 0.16, 24)], { ao: 1.2 });
  P('boulder2', [crag([0, 0.2, 0], 0.45, 31, [1.3, 0.5, 1]), crag([0.15, 0.42, -0.1], 0.25, 32), crag([-0.35, 0.15, 0.25], 0.18, 33)], { ao: 1.2 });
  P('cliff0', [crag([0, 0.35, 0], 0.5, 41, [1, 0.9, 0.9]), crag([0.1, 0.85, -0.05], 0.38, 42, [1, 1.2, 0.9]), crag([-0.05, 1.25, 0.05], 0.26, 43), crag([0.35, 0.2, 0.2], 0.25, 44), crag([-0.38, 0.5, -0.1], 0.28, 45)], { ao: 1.4 });
  P('cliff1', [crag([0, 0.4, 0], 0.48, 51, [1.1, 1, 0.9]), crag([-0.12, 0.95, 0.02], 0.34, 52, [1, 1.1, 1]), crag([0.25, 1.15, -0.1], 0.24, 53), crag([-0.3, 0.18, 0.22], 0.22, 54), crag([0.4, 0.6, 0.05], 0.22, 55)], { ao: 1.4 });
  // ore: a rock shot through with gold nuggets and blue crystals
  {
    const parts = [crag([0, 0.3, 0], 0.4, 61, [1.1, 0.85, 1])];
    for (const [x, y, z, r, c] of [[0.2, 0.5, 0.2, 0.08, gold], [-0.25, 0.4, 0.22, 0.07, gold], [0.05, 0.6, -0.1, 0.06, gold], [0.32, 0.25, -0.15, 0.07, gold]]) parts.push(crag([x, y, z], r, 62 + x * 10, null, 0.01, c));
    for (const [x, z, a] of [[-0.2, -0.15, 0.3], [0.1, 0.15, -0.2], [-0.05, 0.05, 0.1]]) parts.push({ s: 'cap', a: [x, 0.35, z], b: [x + a * 0.6, 0.85, z + a * 0.3], r: 0.06, r2: 0.012, col: crystal, k: 0.01 });
    P('ore', parts, { ao: 1 });
  }
  // a mine cart full of ore on a bit of track
  {
    const parts = [];
    for (const sx of [1, -1]) parts.push({ s: 'box', c: [sx * 0.22, 0.03, 0], hs: [0.02, 0.025, 0.55], rd: 0.008, col: steelD, k: 0 });
    for (let z = -0.45; z <= 0.46; z += 0.18) parts.push({ s: 'box', c: [0, 0.008, z], hs: [0.3, 0.012, 0.04], rd: 0.008, col: woodD, k: 0 });
    parts.push({ s: 'box', c: [0, 0.3, 0], hs: [0.24, 0.15, 0.3], rd: 0.03, col: C('#7a5a3a'), k: 0.01 });
    parts.push({ s: 'box', c: [0, 0.36, 0], hs: [0.2, 0.12, 0.26], rd: 0.02, sub: true, k: 0.005 });
    for (const z of [-0.29, 0.29]) parts.push({ s: 'box', c: [0, 0.3, z], hs: [0.25, 0.16, 0.015], rd: 0.008, col: iron, k: 0 });
    parts.push({ s: 'box', c: [0, 0.44, 0], hs: [0.25, 0.015, 0.31], rd: 0.008, col: iron, k: 0 });
    parts.push({ s: 'box', c: [0, 0.38, 0], hs: [0.205, 0.015, 0.265], rd: 0.008, sub: true, k: 0 });
    for (const sx of [1, -1]) for (const z of [-0.2, 0.2]) {
      parts.push({ s: 'cyl', ax: 'x', c: [sx * 0.22, 0.1, z], r: 0.08, hh: 0.02, rd: 0.01, col: ironD, k: 0 });
      parts.push({ s: 'cyl', ax: 'x', c: [sx * 0.245, 0.1, z], r: 0.025, hh: 0.01, rd: 0.005, col: steel, k: 0 });
    }
    for (const [x, z, r, c] of [[0.05, 0.05, 0.13, null], [-0.1, -0.12, 0.11, null], [0.1, -0.15, 0.09, gold], [-0.08, 0.14, 0.1, null], [0.12, 0.16, 0.07, gold]]) parts.push(crag([x, 0.42, z], r, 70 + x * 31 + z * 7, null, 0.01, c || C('#8a8278')));
    P('minecart', parts, { ao: 0.8 });
  }
  // a wooden post with a hanging lantern
  {
    const parts = [{ s: 'box', c: [0, 0.55, 0], hs: [0.04, 0.55, 0.04], rd: 0.01, col: wood, k: 0 },
      { s: 'box', c: [0, 1.06, 0.12], hs: [0.03, 0.03, 0.16], rd: 0.008, col: wood, k: 0 },
      { s: 'cap', a: [0, 0.8, 0.02], b: [0, 1.04, 0.22], r: 0.018, col: woodD, k: 0 },
      { s: 'cap', a: [0, 1.03, 0.25], b: [0, 0.95, 0.25], r: 0.006, col: iron, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 0.86, 0.25], r: 0.06, hh: 0.08, rd: 0.02, col: lampY, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 0.95, 0.25], r: 0.07, hh: 0.015, rd: 0.01, col: ironD, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 0.77, 0.25], r: 0.065, hh: 0.012, rd: 0.01, col: ironD, k: 0 },
      crag([0, 0.04, 0], 0.12, 81, [1, 0.5, 1], 0.02, C('#7c6c5a'))];
    P('lanternpost', parts, { ao: 0.6 });
  }
  // the cave mouth: a mountainside of crags with a timber-framed tunnel into the dark
  {
    const parts = [
      crag([-0.85, 0.55, -0.1], 0.75, 91, [1, 1.1, 0.8]), crag([0.85, 0.5, -0.1], 0.75, 92, [1, 1.05, 0.8]), crag([0, 1.2, -0.2], 0.7, 93, [1.4, 0.8, 0.8]),
      crag([-1.55, 0.3, 0], 0.45, 94), crag([1.55, 0.35, 0], 0.45, 95), crag([-0.45, 1.55, -0.25], 0.42, 96), crag([0.55, 1.5, -0.3], 0.45, 97),
      crag([-1.15, 1.1, -0.3], 0.45, 98), crag([1.2, 1.05, -0.3], 0.45, 99), crag([-1.9, 0.15, -0.2], 0.32, 100), crag([1.9, 0.2, -0.2], 0.32, 101),
      // the tunnel: a square lower part and a round top
      { s: 'box', c: [0, 0.25, 0.2], hs: [0.42, 0.32, 1.3], sub: true, k: 0.06 },
      { s: 'cyl', ax: 'z', c: [0, 0.55, 0.2], r: 0.42, hh: 1.3, rd: 0, sub: true, k: 0.06 },
      // the dark beyond, and the tunnel floor
      { s: 'box', c: [0, 0.5, -0.85], hs: [0.6, 0.62, 0.08], col: black, k: 0 },
      { s: 'box', c: [0, -0.02, -0.25], hs: [0.46, 0.03, 0.65], col: dirt, k: 0 },
    ];
    // a timber frame at the mouth, braced, with a lantern and a few rocks at its feet
    for (const sx of [1, -1]) {
      parts.push({ s: 'box', c: [sx * 0.4, 0.4, 0.42], hs: [0.05, 0.42, 0.05], rd: 0.012, col: wood, k: 0 });
      parts.push({ s: 'cap', a: [sx * 0.4, 0.62, 0.42], b: [sx * 0.24, 0.8, 0.42], r: 0.025, col: woodD, k: 0 });
      parts.push({ s: 'cap', a: [sx * 0.4, 0.4, 0.37], b: [sx * 0.4, 0.4, 0.15], r: 0.03, col: woodD, k: 0 });
      parts.push(crag([sx * 0.55, 0.06, 0.5], 0.12, 110 + sx, null, 0.02));
    }
    parts.push({ s: 'box', c: [0, 0.86, 0.42], hs: [0.52, 0.055, 0.065], rd: 0.012, col: wood, k: 0 });
    for (const sx of [1, -1]) parts.push({ s: 'cyl', ax: 'z', c: [sx * 0.46, 0.86, 0.49], r: 0.018, hh: 0.01, rd: 0, col: ironD, k: 0 });
    parts.push({ s: 'cap', a: [0.22, 0.8, 0.46], b: [0.22, 0.72, 0.46], r: 0.006, col: iron, k: 0 });
    parts.push({ s: 'cyl', ax: 'y', c: [0.22, 0.67, 0.46], r: 0.035, hh: 0.045, rd: 0.012, col: lampY, k: 0 });
    // a warning sign on the right post: a plank with a red skull-ish blot
    parts.push({ s: 'box', c: [-0.4, 0.5, 0.48], hs: [0.12, 0.07, 0.012], rd: 0.008, col: woodL, k: 0 });
    parts.push({ s: 'sph', c: [-0.4, 0.5, 0.49], r: 0.035, col: C('#c8302a'), k: 0 });
    P('cavemouth', parts, { ao: 2.5 });
  }

  // ---------- inside: walls, stalactites, stalagmites, cover, pillars, torches, timbers ----------
  // a wall segment, two units long, a little over two tall, its face toward +z
  const wallSeg = (name, seed) => {
    const parts = [], r = mulberry32(seed);
    for (const [y, n, rr] of [[0.35, 3, 0.46], [1.05, 3, 0.42], [1.75, 3, 0.4], [2.25, 2, 0.32]]) {
      for (let i = 0; i < n; i++) {
        const x = -0.95 + (i + 0.5) * 1.9 / n + (r() - 0.5) * 0.25;
        parts.push(crag([x, y + (r() - 0.5) * 0.15, (r() - 0.5) * 0.12], rr * (0.85 + r() * 0.3), seed * 10 + parts.length, [1.1, 0.95, 0.75 + r() * 0.2], 0.05));
      }
    }
    for (let i = 0; i < 3; i++) parts.push(crag([(r() - 0.5) * 1.6, 0.3 + r() * 1.6, 0.28], 0.15 + r() * 0.1, seed * 10 + 50 + i, null, 0.04));
    P(name, parts, { ao: 2 });
  };
  wallSeg('cwall0', 7); wallSeg('cwall1', 13); wallSeg('cwall2', 29);
  // stalactites hang tip-down from their base at the top (y 1.15); stalagmites rise tip-up
  {
    const parts = [crag([0, 1.12, 0], 0.22, 131, [1.2, 0.5, 1.2], 0.04)];
    for (const [x, z, len, r] of [[0, 0, 0.95, 0.14], [0.16, 0.08, 0.6, 0.09], [-0.13, -0.06, 0.5, 0.08], [0.05, -0.15, 0.38, 0.06]]) parts.push({ s: 'cap', a: [x, 1.1, z], b: [x * 1.1, 1.1 - len, z * 1.1], r, r2: 0.008, k: 0.04 });
    P('stalac', parts, { ao: 1 });
  }
  {
    const parts = [crag([0, 0.04, 0], 0.22, 141, [1.2, 0.4, 1.2], 0.04)];
    for (const [x, z, len, r] of [[0, 0, 0.9, 0.15], [0.17, 0.07, 0.5, 0.09], [-0.14, -0.05, 0.42, 0.08], [0.02, -0.17, 0.32, 0.06]]) parts.push({ s: 'cap', a: [x, 0.02, z], b: [x * 1.1, len, z * 1.1], r, r2: 0.01, k: 0.04 });
    P('stalag', parts, { ao: 1 });
  }
  // cover: a low wall-like boulder 1.3 wide and about 0.62 tall (drawn at scale 2)
  const coverRock = (name, seed) => {
    const r = mulberry32(seed), parts = [];
    parts.push(crag([-0.34, 0.28, 0], 0.32, seed, [1, 0.95, 0.8]));
    parts.push(crag([0.3, 0.29, 0.02], 0.33, seed + 1, [1, 0.92, 0.8]));
    parts.push(crag([0.02, 0.42, -0.03], 0.26, seed + 2, [1.35, 0.72, 0.9]));
    parts.push(crag([0.5 * (r() > 0.5 ? 1 : -1), 0.14, 0.1], 0.16, seed + 3));
    parts.push(crag([(r() - 0.5) * 0.6, 0.1, 0.2], 0.12, seed + 4));
    P(name, parts, { ao: 1.4 });
  };
  coverRock('cover0', 201); coverRock('cover1', 211); coverRock('cover2', 221);
  P('rubble', [crag([-0.3, 0.08, 0], 0.16, 231), crag([0.25, 0.07, 0.05], 0.15, 232), crag([0, 0.12, -0.08], 0.18, 233, [1.2, 0.6, 1]), crag([0.5, 0.05, -0.1], 0.1, 234), crag([-0.55, 0.05, 0.12], 0.09, 235)], { ao: 1 });
  // a pillar: a column of stone, narrow in the middle, flaring into floor and ceiling
  {
    const parts = [];
    for (const [y, r, s] of [[0.15, 0.46, 241], [0.6, 0.36, 242], [1.05, 0.31, 243], [1.5, 0.3, 244], [1.95, 0.32, 245], [2.4, 0.4, 246], [2.75, 0.5, 247]]) parts.push(crag([0, y, 0], r, s, [1, 0.9, 1], 0.08));
    parts.push(crag([0.3, 0.1, 0.18], 0.18, 248)); parts.push(crag([-0.28, 0.08, -0.15], 0.15, 249));
    P('cpillar', parts, { ao: 2 });
  }
  // a wall torch: an iron bracket, the handle leaning out from the wall, a pitch-soaked wrap (the flame is drawn live)
  P('torch', [
    { s: 'box', c: [0, 0.32, 0.015], hs: [0.06, 0.1, 0.015], rd: 0.008, col: ironD, k: 0 },
    { s: 'cap', a: [0, 0.3, 0.02], b: [0, 0.42, 0.13], r: 0.014, col: iron, k: 0 },
    { s: 'tor', ax: 'y', c: [0, 0.42, 0.13], R: 0.035, r: 0.01, a0: -Math.PI, a1: Math.PI, col: iron, k: 0 },
    { s: 'cap', a: [0, 0.2, 0.08], b: [0, 0.58, 0.19], r: 0.022, r2: 0.028, col: wood, k: 0 },
    { s: 'cap', a: [0, 0.52, 0.17], b: [0, 0.6, 0.2], r: 0.04, r2: 0.035, col: C('#2a1c14'), k: 0.01 },
  ], { ao: 0.3 });
  // a standing brazier full of coals
  {
    const parts = [];
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; parts.push({ s: 'cap', a: [Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2], b: [Math.cos(a) * 0.08, 0.42, Math.sin(a) * 0.08], r: 0.018, col: ironD, k: 0 }); }
    parts.push({ s: 'cyl', ax: 'y', c: [0, 0.5, 0], r: 0.2, hh: 0.08, rd: 0.03, col: iron, k: 0.01 });
    parts.push({ s: 'cyl', ax: 'y', c: [0, 0.56, 0], r: 0.17, hh: 0.06, rd: 0.02, sub: true, k: 0 });
    parts.push({ s: 'tor', ax: 'y', c: [0, 0.58, 0], R: 0.2, r: 0.02, a0: -Math.PI, a1: Math.PI, col: ironD, k: 0 });
    for (const [x, z, r, c] of [[0, 0, 0.07, '#ff8a2a'], [0.09, 0.04, 0.05, '#ffd05a'], [-0.08, 0.05, 0.055, '#ff6a1a'], [0.02, -0.09, 0.05, '#ffb03a'], [-0.06, -0.06, 0.045, '#3a1a10']]) parts.push({ s: 'sph', c: [x, 0.56, z], r, col: C(c), k: 0.01 });
    P('brazier', parts, { ao: 0.5 });
  }
  // a mine timber frame across a tunnel: two posts, a lintel, braces and a hanging rope
  {
    const parts = [];
    for (const sx of [1, -1]) {
      parts.push({ s: 'box', c: [sx * 1.0, 0.82, 0], hs: [0.07, 0.82, 0.07], rd: 0.015, col: wood, k: 0 });
      parts.push({ s: 'cap', a: [sx * 1.0, 1.25, 0], b: [sx * 0.7, 1.62, 0], r: 0.04, col: woodD, k: 0 });
      parts.push({ s: 'box', c: [sx * 1.0, 0.05, 0], hs: [0.11, 0.05, 0.11], rd: 0.02, col: woodD, k: 0 });
    }
    parts.push({ s: 'box', c: [0, 1.7, 0], hs: [1.18, 0.08, 0.09], rd: 0.015, col: wood, k: 0 });
    for (const x of [-0.6, 0, 0.6]) parts.push({ s: 'box', c: [x, 1.8, 0], hs: [0.25, 0.02, 0.12], rd: 0.008, col: woodL, k: 0 });
    parts.push({ s: 'cap', a: [0.35, 1.62, 0], b: [0.35, 1.25, 0.02], r: 0.012, col: rope, k: 0 });
    P('mbeam', parts, { ao: 0.6 });
  }

  // ---------- the cave's people ----------
  const eyes = (m, col, y = 0.02, z = 0.135, spread = 0.055) => {
    const hd = m.J.head;
    for (const sx of [1, -1]) m.parts.push({ s: 'ell', c: [hd[0] + sx * spread, hd[1] + y, hd[2] + z], rr: [0.026, 0.03, 0.016], col, bone: 2, k: 0 });
  };
  // the mole miner: round and furry, a big pink nose, digging claws, a hard hat with a lamp, a pickaxe
  {
    const o = { ...STICK, hipY: 0.38, shY: 0.66, headY: 0.85, headR: 0.19, headZ: 0.04, shW: 0.14, hipW: 0.09, upperLen: 0.13, foreLen: 0.12,
      pelvisR: 0.17, torso: 'ell', torsoRR: [0.2, 0.24, 0.18], neckR: 0.12, armR: 0.055, handR: 0.07, legR: 0.07, k: 0.06 };
    const m = makeHumanoid(o), J = m.J, hd = J.head;
    m.parts.push({ s: 'ell', c: [0, 0.5, 0.1], rr: [0.15, 0.18, 0.1], col: C('#c8a898'), bone: 1, k: 0.03 });
    m.parts.push({ s: 'cap', a: [hd[0], hd[1] - 0.04, hd[2] + 0.1], b: [hd[0], hd[1] - 0.07, hd[2] + 0.26], r: 0.07, r2: 0.045, bone: 2, k: 0.04 });
    m.parts.push({ s: 'sph', c: [hd[0], hd[1] - 0.06, hd[2] + 0.29], r: 0.05, col: C('#ff8aa8'), bone: 2, k: 0.01 });
    for (const sx of [1, -1]) m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.075, hd[1] + 0.03, hd[2] + 0.15], r: 0.018, col: C('#16101a'), bone: 2, k: 0 });
    // the hard hat and its lamp
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.08, hd[2] - 0.01], rr: [0.19, 0.13, 0.2], col: C('#ffc21a'), bone: 2, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] + 0.02, hd[2] + 0.01], R: 0.2, r: 0.025, a0: -Math.PI, a1: Math.PI, col: C('#e8a812'), bone: 2, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'z', c: [hd[0], hd[1] + 0.12, hd[2] + 0.18], r: 0.045, hh: 0.025, rd: 0.01, col: iron, bone: 2, k: 0 });
    m.parts.push({ s: 'sph', c: [hd[0], hd[1] + 0.12, hd[2] + 0.205], r: 0.035, col: lampY, bone: 2, k: 0 });
    // claws
    for (const s of ['L', 'R']) {
      const h = J['ha' + s], b = s === 'L' ? 4 : 6;
      for (const dx of [-0.035, 0, 0.035]) m.parts.push({ s: 'cap', a: [h[0] + dx, h[1] - 0.03, h[2] + 0.02], b: [h[0] + dx * 1.3, h[1] - 0.11, h[2] + 0.06], r: 0.016, r2: 0.005, col: C('#f4e8d8'), bone: b, k: 0 });
    }
    // the pickaxe: a handle down the right arm and a curved iron head at its end
    const h = J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.02, h[2] - 0.08], b: [h[0], h[1] + 0.02, h[2] + 0.44], r: 0.02, col: wood, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] + 0.16, h[2] + 0.4], b: [h[0], h[1] - 0.12, h[2] + 0.44], r: 0.03, r2: 0.008, col: steel, bone: 6, k: 0.01 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] + 0.16, h[2] + 0.4], b: [h[0], h[1] + 0.22, h[2] + 0.34], r: 0.025, r2: 0.006, col: steel, bone: 6, k: 0.01 });
    m.name = 'mole'; m.crownLift = 0.12; m.runAmp = 1.1; m.lean = 0.22;
    defs.mole = m;
  }
  // the crossbowman: a hooded goo bandit with a leather vest, a quiver of bolts, and a crossbow held in both hands
  {
    const m = makeHumanoid({ ...STICK, torsoR: 0.1, torsoR2: 0.108 }), J = m.J, hd = J.head;
    const hood = C('#3e4a2c'), hoodD = C('#2a3220'), leather = C('#6a4a2a');
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.03, hd[2] - 0.03], rr: [0.19, 0.2, 0.19], col: hood, bone: 2, k: 0.01 });
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] - 0.02, hd[2] + 0.13], rr: [0.13, 0.13, 0.1], sub: true, bone: 2, k: 0.02 });
    m.parts.push({ s: 'sph', c: [hd[0], hd[1] - 0.01, hd[2] + 0.0], r: 0.15, bone: 2, k: 0.01 });
    m.parts.push({ s: 'cap', a: [hd[0], hd[1] + 0.18, hd[2] - 0.12], b: [hd[0], hd[1] + 0.05, hd[2] - 0.3], r: 0.06, r2: 0.01, col: hood, bone: 2, k: 0.02 });
    eyes(m, C('#ffd84a'), 0.0, 0.13);
    m.parts.push({ s: 'ell', c: [0, STICK.shY - 0.02, -0.02], rr: [0.2, 0.08, 0.16], col: hoodD, bone: 1, k: 0.02 });
    m.parts.push({ s: 'ell', c: [0, 0.62, 0.0], rr: [0.125, 0.15, 0.115], col: leather, bone: 1, k: 0.01 });
    m.parts.push({ s: 'tor', ax: 'y', c: [0, STICK.hipY + 0.03, 0], R: 0.1, r: 0.022, a0: -Math.PI, a1: Math.PI, col: C('#3a2614'), bone: 0, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [-0.06, 0.72, -0.13], r: 0.045, hh: 0.12, rd: 0.015, col: leather, bone: 1, k: 0 });
    for (const dx of [-0.02, 0.02]) m.parts.push({ s: 'cap', a: [-0.06 + dx, 0.82, -0.13], b: [-0.06 + dx, 0.9, -0.14], r: 0.008, col: C('#e8dcc0'), bone: 1, k: 0 });
    // the crossbow: a stock down the right forearm (pointing ahead when aimed), a steel bow across its end, the string and a bolt
    const h = J.haR;
    m.parts.push({ s: 'box', c: [h[0], h[1] - 0.12, h[2] + 0.01], hs: [0.025, 0.15, 0.03], rd: 0.01, col: wood, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.25, h[2] + 0.02], b: [h[0] + 0.17, h[1] - 0.2, h[2] - 0.0], r: 0.016, r2: 0.01, col: steelD, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.25, h[2] + 0.02], b: [h[0] - 0.17, h[1] - 0.2, h[2] - 0.0], r: 0.016, r2: 0.01, col: steelD, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0] + 0.17, h[1] - 0.2, h[2]], b: [h[0], h[1] - 0.06, h[2] + 0.02], r: 0.005, col: C('#efe3c4'), bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0] - 0.17, h[1] - 0.2, h[2]], b: [h[0], h[1] - 0.06, h[2] + 0.02], r: 0.005, col: C('#efe3c4'), bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.06, h[2] + 0.045], b: [h[0], h[1] - 0.3, h[2] + 0.045], r: 0.009, col: C('#e8dcc0'), bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.3, h[2] + 0.045], b: [h[0], h[1] - 0.36, h[2] + 0.045], r: 0.02, r2: 0.003, col: steel, bone: 6, k: 0 });
    m.name = 'xbowman'; m.gun = 2; m.crownLift = 0.06;
    defs.xbowman = m;
  }
  // the spearman: plumed steel helmet with a nose guard, breastplate, pauldrons and greaves, and a long spear
  {
    const m = makeHumanoid({ ...STICK, torsoR: 0.105, torsoR2: 0.115, pelvisR: 0.1, armR: 0.064, handR: 0.064, legR: 0.074 }), J = m.J, hd = J.head;
    const plume = C('#c8302a');
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.065, hd[2] - 0.005], rr: [0.175, 0.13, 0.18], col: steel, bone: 2, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] + 0.0, hd[2]], R: 0.17, r: 0.022, a0: -Math.PI, a1: Math.PI, col: steelD, bone: 2, k: 0 });
    m.parts.push({ s: 'box', c: [hd[0], hd[1] - 0.035, hd[2] + 0.16], hs: [0.014, 0.055, 0.014], rd: 0.006, col: steel, bone: 2, k: 0 });
    for (const sx of [1, -1]) m.parts.push({ s: 'ell', c: [hd[0] + sx * 0.13, hd[1] - 0.06, hd[2] + 0.04], rr: [0.03, 0.08, 0.07], col: steel, bone: 2, k: 0 });
    for (let i = 0; i < 6; i++) { const u = i / 5; m.parts.push({ s: 'sph', c: [hd[0], hd[1] + 0.2 + Math.sin(u * Math.PI) * 0.05, hd[2] + 0.1 - u * 0.3], r: 0.045 - u * 0.015, col: plume, bone: 2, k: 0.03 }); }
    eyes(m, C('#ffd84a'), -0.04, 0.13);
    m.parts.push({ s: 'ell', c: [0, 0.66, 0.02], rr: [0.15, 0.16, 0.125], col: steel, bone: 1, k: 0.01 });
    m.parts.push({ s: 'ell', c: [0, 0.68, 0.1], rr: [0.08, 0.1, 0.04], col: C('#c8d2dc'), bone: 1, k: 0.01 });
    m.parts.push({ s: 'ell', c: [0, 0.5, 0.0], rr: [0.13, 0.08, 0.115], col: steelD, bone: 0, k: 0.01 });
    for (const [s, b] of [['L', 3], ['R', 5]]) { const p = J['sh' + s]; m.parts.push({ s: 'ell', c: [p[0] * 1.18, p[1] + 0.02, p[2]], rr: [0.085, 0.06, 0.08], col: steel, bone: b, k: 0 }); }
    for (const [s, b] of [['L', 8], ['R', 10]]) { const k = J['kn' + s], a = J['an' + s]; m.parts.push({ s: 'cap', a: [k[0], k[1] - 0.02, k[2] + 0.02], b: [a[0], a[1] + 0.06, a[2] + 0.02], r: 0.06, r2: 0.055, col: steelD, bone: b, k: 0 }); }
    const h = J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.02, h[2] - 0.4], b: [h[0], h[1] + 0.02, h[2] + 0.75], r: 0.02, col: wood, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] + 0.02, h[2] + 0.72], b: [h[0], h[1] + 0.03, h[2] + 0.98], r: 0.05, r2: 0.004, col: C('#dfe7ef'), bone: 6, k: 0 });
    m.parts.push({ s: 'tor', ax: 'z', c: [h[0], h[1] + 0.02, h[2] + 0.72], R: 0.03, r: 0.01, a0: -Math.PI, a1: Math.PI, col: plume, bone: 6, k: 0 });
    m.name = 'spearman'; m.crownLift = 0.12; m.runAmp = 0.9;
    defs.spearman = m;
  }
  // the shieldman: a broad brute in a great helm with a glowing visor slit, a tall iron-bound tower shield and a spiked mace
  {
    const o = { ...STICK, torsoR: 0.13, torsoR2: 0.14, pelvisR: 0.12, shW: 0.14, armR: 0.075, handR: 0.075, legR: 0.085, headR: 0.16 };
    const m = makeHumanoid(o), J = m.J, hd = J.head;
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.02, hd[2]], r: 0.175, hh: 0.17, rd: 0.06, col: steelD, bone: 2, k: 0 });
    m.parts.push({ s: 'box', c: [hd[0], hd[1] + 0.02, hd[2] + 0.17], hs: [0.12, 0.022, 0.02], rd: 0.008, col: C('#16101a'), bone: 2, k: 0 });
    for (const sx of [1, -1]) m.parts.push({ s: 'ell', c: [hd[0] + sx * 0.055, hd[1] + 0.02, hd[2] + 0.175], rr: [0.03, 0.012, 0.01], col: C('#ffb83a'), bone: 2, k: 0 });
    m.parts.push({ s: 'box', c: [hd[0], hd[1] + 0.12, hd[2] + 0.02], hs: [0.012, 0.06, 0.17], rd: 0.008, col: steel, bone: 2, k: 0 });
    m.parts.push({ s: 'ell', c: [0, 0.66, 0.02], rr: [0.18, 0.17, 0.145], col: steelD, bone: 1, k: 0.01 });
    for (let i = 0; i < 3; i++) m.parts.push({ s: 'tor', ax: 'y', c: [0, 0.56 + i * 0.08, 0.02], R: 0.17 - Math.abs(i - 1) * 0.01, r: 0.012, a0: -Math.PI, a1: Math.PI, col: steel, bone: 1, k: 0 });
    for (const [s, b] of [['L', 3], ['R', 5]]) { const p = J['sh' + s]; m.parts.push({ s: 'ell', c: [p[0] * 1.15, p[1] + 0.03, p[2]], rr: [0.1, 0.07, 0.095], col: steel, bone: b, k: 0 }); }
    // the tower shield on the left forearm, facing ahead
    const hl = J.haL, sc = [hl[0] - 0.02, hl[1] + 0.1, hl[2] + 0.16];
    m.parts.push({ s: 'box', c: sc, hs: [0.2, 0.34, 0.03], rd: 0.04, col: C('#7a4a26'), bone: 4, k: 0 });
    for (const dy of [-0.22, 0, 0.22]) m.parts.push({ s: 'box', c: [sc[0], sc[1] + dy, sc[2] + 0.03], hs: [0.205, 0.02, 0.01], rd: 0.006, col: iron, bone: 4, k: 0 });
    m.parts.push({ s: 'box', c: [sc[0], sc[1], sc[2] + 0.01], hs: [0.215, 0.355, 0.022], rd: 0.045, col: ironD, bone: 4, k: 0 });
    m.parts.push({ s: 'box', c: [sc[0], sc[1], sc[2] + 0.015], hs: [0.19, 0.33, 0.03], rd: 0.035, col: C('#7a4a26'), bone: 4, k: 0 });
    m.parts.push({ s: 'sph', c: [sc[0], sc[1] + 0.02, sc[2] + 0.05], r: 0.06, col: steel, bone: 4, k: 0 });
    // the mace
    const h = J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.02, h[2] - 0.06], b: [h[0], h[1] + 0.02, h[2] + 0.38], r: 0.022, col: woodD, bone: 6, k: 0 });
    m.parts.push({ s: 'sph', c: [h[0], h[1] + 0.03, h[2] + 0.44], r: 0.08, col: iron, bone: 6, k: 0 });
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0.6, 0.6, 0.4], [-0.6, -0.6, 0.4]]) m.parts.push({ s: 'cap', a: [h[0] + dx * 0.06, h[1] + 0.03 + dy * 0.06, h[2] + 0.44 + dz * 0.06], b: [h[0] + dx * 0.12, h[1] + 0.03 + dy * 0.12, h[2] + 0.44 + dz * 0.12], r: 0.022, r2: 0.003, col: steel, bone: 6, k: 0 });
    m.name = 'shieldman'; m.shieldArm = true; m.runAmp = 0.8; m.crownLift = 0.12;
    defs.shieldman = m;
  }

  // ---------- the deep mine's crowd ----------
  // the cave spider: a dark hairy body with an orange hourglass on its abdomen, six red eyes, cream fangs and eight
  // jointed legs (two alternating sets on bones 1 and 2, the front pair on bone 4, the abdomen on bone 3)
  {
    const body = C('#2a2232'), bodyL = C('#43384e'), mark = C('#ff7a2a'), eye = C('#ff3a3a'), fang = C('#f4e8d8');
    const parts = [
      { s: 'ell', c: [0, 0.32, 0.1], rr: [0.17, 0.12, 0.17], col: body, k: 0.03 },
      { s: 'sph', c: [0, 0.33, 0.29], r: 0.11, col: bodyL, k: 0.04 },
      { s: 'ell', c: [0, 0.38, -0.24], rr: [0.24, 0.2, 0.28], col: body, bone: 3, k: 0.04 },
      { s: 'ell', c: [0, 0.55, -0.2], rr: [0.06, 0.035, 0.07], col: mark, bone: 3, k: 0.01 }, { s: 'ell', c: [0, 0.53, -0.31], rr: [0.05, 0.035, 0.06], col: mark, bone: 3, k: 0.01 },
      ...[[0.04, 0.38, 0.38, 0.026], [-0.04, 0.38, 0.38, 0.026], [0.075, 0.36, 0.35, 0.02], [-0.075, 0.36, 0.35, 0.02], [0.025, 0.41, 0.36, 0.016], [-0.025, 0.41, 0.36, 0.016]].map(([x, y, z, r]) => ({ s: 'sph', c: [x, y, z], r, col: eye, k: 0 })),
      ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.035, 0.27, 0.36], b: [sx * 0.02, 0.17, 0.42], r: 0.022, r2: 0.006, col: fang, k: 0 })),
    ];
    for (let i = 0; i < 4; i++) for (const sx of [1, -1]) {
      const z0 = 0.2 - i * 0.1, spread = 0.35 - i * 0.25, bone = i === 0 ? 4 : ((i + (sx > 0 ? 1 : 0)) % 2 ? 1 : 2);
      const hip = [sx * 0.13, 0.33, z0], knee = [sx * 0.42, 0.56, z0 + spread * 0.5], foot = [sx * 0.66, 0.0, z0 + spread];
      parts.push({ s: 'cap', a: hip, b: knee, r: 0.035, r2: 0.028, col: bodyL, bone, k: 0.01 }, { s: 'cap', a: knee, b: foot, r: 0.028, r2: 0.012, col: body, bone, k: 0.01 });
      parts.push({ s: 'sph', c: knee, r: 0.034, col: body, bone, k: 0.01 });
    }
    rig(P('cspider', parts, { ao: 0.6 }), { 1: [0, 0.33, 0.05], 2: [0, 0.33, 0.05], 3: [0, 0.36, -0.05], 4: [0, 0.33, 0.2] });
  }
  // the cave bat: a furry body with big ears, red eyes and a pug snout, on leathery wings with finger bones (bones 1, 2)
  {
    const fur = C('#4a3a40'), wing = C('#6a4a52'), bone = C('#3a2a30'), eye = C('#ff4a3a');
    const parts = [
      { s: 'ell', c: [0, 0, 0], rr: [0.08, 0.09, 0.12], col: fur, k: 0.03 },
      { s: 'sph', c: [0, 0.05, 0.13], r: 0.075, col: fur, k: 0.03 },
      { s: 'ell', c: [0, 0.03, 0.2], rr: [0.035, 0.025, 0.02], col: C('#c87a8a'), k: 0.01 },
      ...[1, -1].flatMap(sx => [
        { s: 'cap', a: [sx * 0.04, 0.1, 0.12], b: [sx * 0.08, 0.22, 0.08], r: 0.035, r2: 0.008, col: fur, k: 0.02 },
        { s: 'sph', c: [sx * 0.03, 0.07, 0.19], r: 0.016, col: eye, k: 0 },
        { s: 'cap', a: [sx * 0.012, -0.0, 0.2], b: [sx * 0.014, -0.035, 0.205], r: 0.008, r2: 0.002, col: C('#f4e8d8'), k: 0 },
      ]),
    ];
    for (const [sx, b] of [[1, 1], [-1, 2]]) {
      parts.push({ s: 'ell', c: [sx * 0.3, 0.0, -0.02], rr: [0.26, 0.012, 0.14], col: wing, bone: b, k: 0 });
      for (const [x, z] of [[0.52, 0.08], [0.46, -0.1], [0.32, -0.15]]) parts.push({ s: 'cap', a: [sx * 0.07, 0.01, 0.02], b: [sx * x, 0.01, z], r: 0.012, r2: 0.006, col: bone, bone: b, k: 0 });
    }
    rig(P('cbat', parts, { ao: 0.5 }), { 1: [0.06, 0.01, 0], 2: [-0.06, 0.01, 0] });
  }
  // a stick of dynamite with its fuse (thrown by goblins)
  P('dynamite', [
    { s: 'cap', a: [0, 0, -0.12], b: [0, 0, 0.12], r: 0.05, col: C('#d8282a'), k: 0 },
    { s: 'tor', ax: 'z', c: [0, 0, 0.0], R: 0.052, r: 0.008, a0: -Math.PI, a1: Math.PI, col: C('#2a2018'), k: 0 },
    { s: 'cap', a: [0, 0, 0.14], b: [0.02, 0.05, 0.2], r: 0.008, col: C('#e8dcc0'), k: 0 },
  ], { ao: 0.4 });
  // the goblin sapper: a small green goblin with long ears, a battered tin helmet with a candle on it, goggles, a
  // satchel of dynamite on its back and a lit stick in its hand
  {
    const m = makeHumanoid({ ...STICK, headR: 0.15, torsoR: 0.09, torsoR2: 0.1 }), J = m.J, hd = J.head;
    const tin = C('#8a8e96'), strap = C('#5a3a20'), red = C('#d8282a');
    for (const sx of [1, -1]) m.parts.push({ s: 'cap', a: [hd[0] + sx * 0.12, hd[1] + 0.0, hd[2] - 0.02], b: [hd[0] + sx * 0.32, hd[1] + 0.08, hd[2] - 0.08], r: 0.05, r2: 0.012, bone: 2, k: 0.03 });
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.09, hd[2] - 0.01], rr: [0.165, 0.1, 0.17], col: tin, bone: 2, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.21, hd[2] + 0.02], r: 0.025, hh: 0.04, rd: 0.01, col: C('#f4ecd8'), bone: 2, k: 0 });
    m.parts.push({ s: 'sph', c: [hd[0], hd[1] + 0.27, hd[2] + 0.02], r: 0.02, col: C('#ffd23a'), bone: 2, k: 0 });
    for (const sx of [1, -1]) { m.parts.push({ s: 'cyl', ax: 'z', c: [hd[0] + sx * 0.055, hd[1] + 0.02, hd[2] + 0.135], r: 0.04, hh: 0.02, rd: 0.01, col: C('#3a3a40'), bone: 2, k: 0 }); m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.055, hd[1] + 0.02, hd[2] + 0.15], r: 0.028, col: C('#ffe08a'), bone: 2, k: 0 }); }
    m.parts.push({ s: 'cap', a: [hd[0], hd[1] - 0.03, hd[2] + 0.13], b: [hd[0], hd[1] - 0.06, hd[2] + 0.2], r: 0.035, r2: 0.02, bone: 2, k: 0.03 });
    m.parts.push({ s: 'box', c: [0, 0.66, -0.13], hs: [0.1, 0.1, 0.05], rd: 0.03, col: strap, bone: 1, k: 0 });
    for (const x of [-0.06, 0, 0.06]) m.parts.push({ s: 'cap', a: [x, 0.7, -0.15], b: [x, 0.84, -0.15], r: 0.022, col: red, bone: 1, k: 0 });
    m.parts.push({ s: 'cap', a: [0.1, 0.78, 0.06], b: [-0.12, 0.56, -0.08], r: 0.015, col: strap, bone: 1, k: 0 });
    const h = J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.05, h[2] + 0.02], b: [h[0], h[1] + 0.13, h[2] + 0.06], r: 0.035, col: red, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] + 0.13, h[2] + 0.06], b: [h[0] + 0.03, h[1] + 0.2, h[2] + 0.08], r: 0.008, col: C('#e8dcc0'), bone: 6, k: 0 });
    m.parts.push({ s: 'sph', c: [h[0] + 0.03, h[1] + 0.21, h[2] + 0.085], r: 0.025, col: C('#ffb02a'), bone: 6, k: 0 });
    m.name = 'goblin'; m.crownLift = 0.14; m.runAmp = 1.2; m.lean = 0.12;
    defs.goblin = m;
  }
  // the ogre: a hulking brute with a pot belly, small eyes under a heavy brow, tusks, a loincloth, a tooth necklace,
  // iron bracers and a great spiked club
  {
    const o = { ...STICK, torsoR: 0.17, torsoR2: 0.2, pelvisR: 0.15, shW: 0.17, armR: 0.095, handR: 0.11, legR: 0.1, headR: 0.15 };
    const m = makeHumanoid(o), J = m.J, hd = J.head;
    const hide = C('#7a5a3a'), tusk = C('#f4ecd8'), iron2 = C('#5a5e66');
    m.parts.push({ s: 'ell', c: [0, 0.55, 0.08], rr: [0.2, 0.18, 0.17], bone: 1, k: 0.06 });
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.06, hd[2] + 0.1], rr: [0.15, 0.04, 0.06], bone: 2, k: 0.04 });
    for (const sx of [1, -1]) {
      m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.06, hd[1] + 0.02, hd[2] + 0.14], r: 0.022, col: C('#ffd23a'), bone: 2, k: 0 });
      m.parts.push({ s: 'cap', a: [hd[0] + sx * 0.06, hd[1] - 0.08, hd[2] + 0.13], b: [hd[0] + sx * 0.08, hd[1] + 0.0, hd[2] + 0.18], r: 0.022, r2: 0.008, col: tusk, bone: 2, k: 0 });
    }
    m.parts.push({ s: 'ell', c: [0, STICK.hipY - 0.06, 0.03], rr: [0.18, 0.12, 0.15], col: hide, bone: 0, k: 0.02 });
    m.parts.push({ s: 'tor', ax: 'y', c: [0, 0.78, 0.0], R: 0.15, r: 0.012, a0: 0.3, a1: Math.PI - 0.3, col: C('#c8a870'), bone: 1, k: 0 });
    for (const x of [-0.08, 0, 0.08]) m.parts.push({ s: 'cap', a: [x, 0.74, 0.15], b: [x, 0.68, 0.16], r: 0.014, r2: 0.005, col: tusk, bone: 1, k: 0 });
    for (const [s, b] of [['L', 4], ['R', 6]]) { const hh = J['ha' + s]; m.parts.push({ s: 'cyl', ax: 'y', c: [hh[0], hh[1] + 0.1, hh[2]], r: 0.1, hh: 0.05, rd: 0.02, col: iron2, bone: b, k: 0 }); }
    const h = J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.02, h[2] - 0.05], b: [h[0], h[1] + 0.05, h[2] + 0.55], r: 0.04, r2: 0.09, col: C('#6e4a2c'), bone: 6, k: 0.02 });
    for (const [dx, dy, dz] of [[1, 0, 0.42], [-1, 0, 0.36], [0, 1, 0.48], [0.7, -0.7, 0.3], [-0.7, 0.7, 0.52]]) m.parts.push({ s: 'cap', a: [h[0] + dx * 0.06, h[1] + 0.04 + dy * 0.06, h[2] + dz], b: [h[0] + dx * 0.13, h[1] + 0.04 + dy * 0.13, h[2] + dz], r: 0.02, r2: 0.003, col: C('#c8ccd4'), bone: 6, k: 0 });
    m.name = 'ogre'; m.crownLift = 0.1; m.runAmp = 0.7;
    defs.ogre = m;
  }
  // the crystal golem: a body of rough rock chunks with cyan crystals growing out of its back and shoulders, glowing
  // eyes and a glowing crystal core in its chest (its weak spot)
  {
    const o = { ...STICK, torsoR: 0.15, torsoR2: 0.17, pelvisR: 0.13, shW: 0.16, armR: 0.09, handR: 0.11, legR: 0.1, headR: 0.13 };
    const m = makeHumanoid(o), J = m.J, hd = J.head;
    const rock = C('#7a7068'), rockD = C('#5a524c'), cr = C('#6ae8ff'), crB = C('#bff6ff');
    m.parts.push({ ...crag([0, 0.66, 0.0], 0.2, 301, [1, 0.9, 0.85], 0.04, rock), bone: 1 });
    m.parts.push(crag([0, 0.48, 0.0], 0.16, 302, [1.1, 0.7, 0.9], 0.04, rockD));
    for (const [s, b] of [['L', 3], ['R', 5]]) { const p = J['sh' + s]; m.parts.push({ ...crag([p[0] * 1.2, p[1] + 0.04, p[2]], 0.11, 310 + b, null, 0.03, rock), bone: b }); }
    for (const [s, b] of [['L', 4], ['R', 6]]) { const hh = J['ha' + s]; m.parts.push({ ...crag([hh[0], hh[1], hh[2]], 0.12, 320 + b, null, 0.03, rockD), bone: b }); }
    m.parts.push({ ...crag([hd[0], hd[1] + 0.02, hd[2]], 0.14, 330, [1, 0.9, 1], 0.03, rock), bone: 2 });
    for (const sx of [1, -1]) m.parts.push({ s: 'sph', c: [hd[0] + sx * 0.05, hd[1] + 0.02, hd[2] + 0.12], r: 0.022, col: crB, bone: 2, k: 0 });
    m.parts.push({ s: 'sph', c: [0, 0.66, 0.16], r: 0.075, col: crB, bone: 1, k: 0.01 });
    for (const [x, y, z, dx, dy, dz, r] of [[0.08, 0.72, -0.12, 0.1, 0.22, -0.12, 0.045], [-0.1, 0.68, -0.13, -0.08, 0.18, -0.16, 0.04], [0, 0.6, -0.14, 0.02, 0.14, -0.2, 0.035], [0.18, 0.86, -0.02, 0.12, 0.16, -0.05, 0.035], [-0.18, 0.86, -0.02, -0.12, 0.16, -0.05, 0.035]])
      m.parts.push({ s: 'cap', a: [x, y, z], b: [x + dx, y + dy, z + dz], r, r2: 0.006, col: cr, bone: 1, k: 0.01 });
    m.name = 'golem'; m.crownLift = 0.08; m.runAmp = 0.6;
    defs.golem = m;
  }
}
