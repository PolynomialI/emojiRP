// ============================================================
// Ocean chapters 11-20 (13o-sea-deep.js): the new swimmers that are not goo pirates (glowing jellyfish, gummy
// bears, anglerfish), and the ten new islands plus the Atlantis column that bursts up out of the sea.
// The goo-pirate variants (weed-tangled, merfolk, lost pilots, skeletons, balloon pirates) are in 04k's pirate().
// Islands are radius 4 at scale 1 and drawn at radius / 4, like the others.
// ============================================================
const SEA_DEEP_FOLK = ['pweed', 'pmer', 'pblink', 'pskel', 'pballoon', 'pjelly', 'pgummy', 'pangler'];
const SEA_DEEP_ISLES = ['iglow', 'iweed', 'istack', 'iruin', 'icandy', 'itri', 'isky', 'ibones', 'ilocker', 'iedge', 'icol'];
Object.assign(THEME_CLIPS, { pweed: ['paddle', 'hack'], pmer: ['paddle', 'hack', 'throw'], pblink: ['paddle', 'hack'], pskel: ['paddle', 'hack'], pballoon: ['hang'], pjelly: ['jpulse'], pgummy: ['gbob'], pangler: ['aswim'] });
for (const id of SEA_DEEP_FOLK) THEME_CELLS[id] = 0.017;
for (const id of SEA_DEEP_ISLES) { THEME_CLIPS[id] = ['still']; THEME_CELLS[id] = 0.1; }
MESH_ORDER.push(...SEA_DEEP_FOLK, ...SEA_DEEP_ISLES);

// hanging from a balloon: arms up on the ropes, legs dangling and swinging a little
CLIPS.hang = { frames: 32, fn(t) {
  const a = t * TAU, s = Math.sin(a), c = Math.cos(a);
  return { root: [0, 0.04 * Math.sin(2 * a), 0], rot: [
    [0.1 * s, 0, 0.06 * c], [0.05, 0, 0], [-0.15, 0, 0],
    [-2.85, 0, 0.35], [-0.2, 0, 0], [-2.85, 0, -0.35], [-0.2, 0, 0],
    [0.25 * s, 0, 0.08], [0.4 + 0.2 * c, 0, 0], [-0.25 * s, 0, -0.08], [0.4 - 0.2 * c, 0, 0],
  ] };
} };
// a jellyfish: the bell bobs while the tentacles (bones 3-8) trail and sway
CLIPS.jpulse = { frames: 32, fn(t) {
  const a = t * TAU;
  return { root: [0, 0.05 * Math.sin(a), 0], rot: Array.from({ length: NBONES }, (_, b) => (b >= 3 && b <= 8 ? [0.3 * Math.sin(a + b * 1.1), 0, 0.22 * Math.cos(a + b * 0.7)] : [0, 0, 0])) };
} };
// a gummy bear treading water: a bounce, the arms (bones 3, 5) paddling
CLIPS.gbob = { frames: 32, fn(t) {
  const a = t * TAU;
  return { root: [0, 0.04 * Math.sin(2 * a), 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 3 ? [-0.6 + 0.5 * Math.sin(a), 0, 0] : b === 5 ? [-0.6 - 0.5 * Math.sin(a), 0, 0] : b === 0 ? [0, 0, 0.08 * Math.sin(a)] : [0, 0, 0])) };
} };
// an anglerfish swimming: the tail (bone 3) sweeps, the lure (bone 4) bobs
CLIPS.aswim = { frames: 32, fn(t) {
  const a = t * TAU;
  return { root: [0, 0.03 * Math.sin(a), 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 3 ? [0, 0.55 * Math.sin(a), 0] : b === 4 ? [0.15 * Math.sin(2 * a), 0, 0.1 * Math.cos(a)] : b === 0 ? [0, 0.08 * Math.sin(a + 1), 0] : [0, 0, 0])) };
} };

function seaDeepModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const white = C('#fbf6ee'), dark = C('#16101a');

  // ---------- the glowing jellyfish: a domed bell (it takes the tint), a bright core, a frilled rim, trailing
  // tentacles (bones 3-8) and four frilly oral arms ----------
  {
    const parts = [
      { s: 'ell', c: [0, 0.42, 0], rr: [0.46, 0.34, 0.46], k: 0 }, { s: 'ell', c: [0, 0.3, 0], rr: [0.38, 0.22, 0.38], sub: true, k: 0.02 },
      { s: 'ell', c: [0, 0.5, 0], rr: [0.22, 0.17, 0.22], col: C('#f0fff8'), k: 0.08 },
      ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU; return { s: 'sph', c: [Math.cos(a) * 0.43, 0.24, Math.sin(a) * 0.43], r: 0.065, col: C('#c8fff0'), k: 0.03 }; }),
      ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * TAU + 0.3, b = 3 + i; return { s: 'cap', a: [Math.cos(a) * 0.32, 0.22, Math.sin(a) * 0.32], b: [Math.cos(a) * 0.38, -0.55, Math.sin(a) * 0.38], r: 0.025, r2: 0.01, col: C('#b8fff0'), bone: b, k: 0 }; }),
      ...Array.from({ length: 4 }, (_, i) => { const a = i / 4 * TAU; return { s: 'cap', a: [Math.cos(a) * 0.08, 0.25, Math.sin(a) * 0.08], b: [Math.cos(a) * 0.15, -0.3, Math.sin(a) * 0.15], r: 0.05, r2: 0.025, col: C('#e8fff8'), k: 0.03 }; }),
    ];
    const m = P('pjelly', parts, { ao: 0.3 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; m.bones[3 + i].p = [Math.cos(a) * 0.32, 0.22, Math.sin(a) * 0.32]; }
  }
  // ---------- the gummy bear: a chunky translucent-candy bear (it takes the tint) with round ears, a muzzle,
  // dot eyes and stubby arms (bones 3, 5) ----------
  {
    const parts = [
      { s: 'ell', c: [0, 0.45, 0], rr: [0.3, 0.36, 0.26], k: 0 },
      { s: 'ell', c: [0, 0.42, 0.18], rr: [0.18, 0.2, 0.1], k: 0.08 },
      { s: 'sph', c: [0, 0.93, 0], r: 0.25, k: 0.08 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.17, 1.13, -0.02], r: 0.09, k: 0.04 })),
      { s: 'ell', c: [0, 0.86, 0.2], rr: [0.11, 0.08, 0.08], k: 0.04 },
      { s: 'sph', c: [0, 0.89, 0.27], r: 0.035, col: dark, k: 0 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.09, 0.98, 0.21], r: 0.032, col: dark, k: 0 })),
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.08, 1.0, 0.235], r: 0.01, col: white, k: 0 })),
      { s: 'cap', a: [0.26, 0.6, 0.02], b: [0.36, 0.42, 0.18], r: 0.08, bone: 3, k: 0.04 },
      { s: 'cap', a: [-0.26, 0.6, 0.02], b: [-0.36, 0.42, 0.18], r: 0.08, bone: 5, k: 0.04 },
    ];
    const m = P('pgummy', parts, { ao: 0.25 });
    m.bones[3].p = [0.26, 0.6, 0.02]; m.bones[5].p = [-0.26, 0.6, 0.02];
  }
  // ---------- the anglerfish: a dark lumpy body (it takes the tint), a huge underbite full of needle teeth,
  // little yellow eyes, fins, a sweeping tail (bone 3) and a glowing lure on a stalk (bone 4) ----------
  {
    const teeth = C('#f4f0e0'), lure = C('#e8ff7a');
    const parts = [
      { s: 'ell', c: [0, 0.32, 0], rr: [0.42, 0.38, 0.55], k: 0 },
      { s: 'ell', c: [0, 0.3, 0.42], rr: [0.36, 0.3, 0.2], col: C('#1a1424'), sub: true, k: 0.04 },
      { s: 'ell', c: [0, 0.16, 0.44], rr: [0.38, 0.16, 0.24], k: 0.06 },
      ...Array.from({ length: 7 }, (_, i) => { const x = -0.27 + i * 0.09; return { s: 'cap', a: [x, 0.2, 0.55], b: [x * 1.05, 0.38, 0.6], r: 0.02, r2: 0.004, col: teeth, k: 0 }; }),
      ...Array.from({ length: 6 }, (_, i) => { const x = -0.22 + i * 0.09; return { s: 'cap', a: [x, 0.46, 0.5], b: [x, 0.33, 0.55], r: 0.017, r2: 0.004, col: teeth, k: 0 }; }),
      ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.2, 0.55, 0.32], r: 0.065, col: C('#ffd34a'), k: 0 }, { s: 'sph', c: [sx * 0.21, 0.56, 0.38], r: 0.03, col: dark, k: 0 }]),
      ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.42, 0.25, 0.05], rr: [0.04, 0.12, 0.18], k: 0.04 })),
      { s: 'ell', c: [0, 0.68, -0.15], rr: [0.03, 0.12, 0.22], k: 0.05 },
      { s: 'cap', a: [0, 0.3, -0.5], b: [0, 0.32, -0.78], r: 0.12, r2: 0.05, bone: 3, k: 0.06 },
      { s: 'ell', c: [0, 0.32, -0.88], rr: [0.03, 0.2, 0.12], bone: 3, k: 0.03 },
      { s: 'cap', a: [0, 0.66, 0.15], b: [0, 1.0, 0.4], r: 0.022, col: C('#3a3448'), bone: 4, k: 0.02 },
      { s: 'cap', a: [0, 1.0, 0.4], b: [0, 0.92, 0.66], r: 0.018, col: C('#3a3448'), bone: 4, k: 0.02 },
      { s: 'sph', c: [0, 0.86, 0.7], r: 0.085, col: lure, bone: 4, k: 0 },
    ];
    const m = P('pangler', parts, { ao: 0.4 });
    m.bones[3].p = [0, 0.3, -0.5]; m.bones[4].p = [0, 0.66, 0.15];
  }

  // ---------- islands ----------
  const rockMass = (seed, R, H, col, col2, bump = 0.05) => {
    const out = [{ s: 'rock', c: [0, H - R * 1.05, 0], r: R * 1.05, bump, col, k: 0.6 }];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + seed, d = R * (0.95 + 0.25 * ((i * 7 + seed) % 3) / 2), r = R * (0.5 + 0.15 * ((i * 5 + seed) % 4) / 3);
      out.push({ s: 'rock', c: [Math.cos(a) * d, H * 0.55 - r * 0.9, Math.sin(a) * d], r, bump: bump * 1.2, col: i % 2 ? col2 : col, k: 0.55 });
    }
    return out;
  };
  const shore = (col, h = 0.5) => ({ s: 'ell', c: [0, -0.2, 0], rr: [3.9, h, 3.9], col, k: 0.3 });
  const pebbles = (n, R, col, seed) => Array.from({ length: n }, (_, i) => { const a = i / n * TAU + seed * 0.7, d = R * (0.85 + 0.15 * (i % 2)); return { s: 'crag', c: [Math.cos(a) * d, 0.05, Math.sin(a) * d], r: 0.32 + 0.12 * ((i + seed) % 3), seed: seed * 10 + i, n: 8, col, k: 0.08 }; });

  // Glowtide Lagoon: a dark reef of rock under giant glowing mushrooms and coral fans, dots of light
  {
    const caps = [C('#5affe0'), C('#ff6ae0'), C('#c8ff5a'), C('#6ab8ff')];
    const shroom = (x, z, h, r, col) => [{ s: 'cap', a: [x, 0.5, z], b: [x * 1.05, h, z * 1.05], r: r * 0.28, r2: r * 0.22, col: C('#e8f4f0'), k: 0.1 },
      { s: 'ell', c: [x * 1.05, h + r * 0.15, z * 1.05], rr: [r, r * 0.45, r], col, k: 0.05 }, { s: 'ell', c: [x * 1.05, h - r * 0.05, z * 1.05], rr: [r * 0.9, r * 0.22, r * 0.9], col: C('#1a2a3a'), k: 0.02 }];
    P('iglow', [shore(C('#1e2a38')), ...rockMass(31, 2.0, 0.9, C('#26323e'), C('#1e2832')),
      ...shroom(0.3, -0.4, 3.0, 1.2, caps[0]), ...shroom(-1.6, 0.9, 2.0, 0.85, caps[1]), ...shroom(1.6, 1.2, 1.7, 0.7, caps[2]), ...shroom(-0.6, -2.0, 1.5, 0.6, caps[3]),
      ...[[2.4, -1.2, caps[1]], [-2.6, -0.6, caps[0]], [0.4, 2.6, caps[3]]].map(([x, z, col]) => ({ s: 'ell', c: [x, 0.9, z], rr: [0.6, 0.65, 0.12], col, k: 0.05 })),
      ...Array.from({ length: 14 }, (_, i) => { const a = i * 2.39, d = 1.2 + (i % 4) * 0.55; return { s: 'sph', c: [Math.cos(a) * d, 0.75 + (i % 3) * 0.12, Math.sin(a) * d], r: 0.09, col: caps[i % 4], k: 0 }; }),
      ...pebbles(5, 3.2, C('#26323e'), 31)], { ao: 0.4 });
  }
  // Sargasso Snarl: a low sandbar smothered in mats of brown and green weed, a rotting hulk half sunk in it
  {
    const weedA = C('#5a6a2a'), weedB = C('#3a5a2a'), weedC = C('#7a6a3a'), rot = C('#4a3a28');
    P('iweed', [shore(C('#6a6a4a'), 0.45),
      ...[[0, 0, 3.2, 3.0, weedA], [1.2, -0.8, 2.0, 1.8, weedB], [-1.4, 1.0, 1.9, 1.6, weedC], [0.6, 1.8, 1.4, 1.2, weedB]].map(([x, z, rx, rz, col], i) => ({ s: 'ell', c: [x, 0.18 + i * 0.05, z], rr: [rx, 0.28, rz], col, k: 0.06 })),
      ...Array.from({ length: 16 }, (_, i) => { const a = i * 2.39, d = 0.8 + (i % 5) * 0.55; return { s: 'cap', a: [Math.cos(a) * d, 0.35, Math.sin(a) * d], b: [Math.cos(a) * d + 0.3, 0.55 + (i % 3) * 0.15, Math.sin(a) * d - 0.2], r: 0.09, r2: 0.04, col: i % 2 ? weedB : weedA, k: 0.06 }; }),
      // the hulk: a tilted hull with ribs, a snapped mast trailing weed
      { s: 'ell', c: [-0.4, 0.5, -0.3], rr: [0.9, 0.7, 2.2], col: rot, k: 0 }, { s: 'box', c: [-0.4, 1.4, -0.3], hs: [2, 0.8, 3], sub: true, k: 0 },
      { s: 'ell', c: [-0.4, 0.9, -0.3], rr: [0.7, 0.55, 1.9], sub: true, k: 0 },
      ...[-1.2, -0.4, 0.4].map(z => ({ s: 'tor', ax: 'z', c: [-0.4, 0.6, -0.3 + z], R: 0.8, r: 0.06, a0: 0.25, a1: Math.PI - 0.25, col: C('#5a4630'), k: 0 })),
      { s: 'cap', a: [-0.3, 0.7, 0.4], b: [0.6, 2.3, 1.0], r: 0.1, col: rot, k: 0 }, { s: 'cap', a: [0.6, 2.3, 1.0], b: [0.75, 1.4, 1.2], r: 0.05, col: weedB, k: 0.02 }], { ao: 0.45 });
  }
  // Maelstrom Reach: three tall sea stacks of banded sandstone with grassy tops, a natural arch between two
  {
    const sA = C('#b8865a'), sB = C('#9a6a48'), sC = C('#d4a476'), grass = C('#6aa84a');
    const stack = (x, z, h, r) => [...Array.from({ length: Math.round(h / 0.8) }, (_, i) => ({ s: 'rock', c: [x + Math.sin(i * 1.7) * 0.08, 0.4 + i * 0.8, z + Math.cos(i * 1.3) * 0.08], r: r * (1 - i * 0.05), bump: 0.04, col: [sA, sB, sC][i % 3], k: 0.35 })),
      { s: 'ell', c: [x, 0.4 + h, z], rr: [r * 0.8, 0.22, r * 0.8], col: grass, k: 0.15 }];
    P('istack', [shore(C('#7a6a5a'), 0.4), ...stack(-1.3, -0.6, 4.4, 1.1), ...stack(1.4, -0.3, 3.2, 0.95), ...stack(0.1, 1.7, 2.3, 0.85),
      { s: 'tor', ax: 'z', c: [0.05, 1.2, -0.45], R: 1.35, r: 0.32, a0: 0.1, a1: Math.PI - 0.1, col: sB, k: 0.2 },
      { s: 'tor', ax: 'y', c: [-1.3, 4.75, -0.6], R: 0.2, r: 0.07, a0: -Math.PI, a1: Math.PI, col: C('#c8a060'), k: 0 },
      ...[[-1.25, 4.8, -0.55], [-1.38, 4.8, -0.62]].map(c => ({ s: 'sph', c, r: 0.07, col: C('#f4f0e4'), k: 0 })),
      ...pebbles(6, 3.2, sB, 11)], { ao: 0.45 });
  }
  // Sunken Atlantis: a marble platform half drowned: steps, standing and toppled columns, an arch, a broken gold
  // dome and a great stone head lying on its side, gilded and grown over with coral
  {
    const marble = C('#f2eee6'), marbleD = C('#d8d2c4'), gold = C('#e8b84a'), coral = C('#ff7a9a');
    const col = (x, z, h) => [{ s: 'cyl', ax: 'y', c: [x, 0.5 + h / 2, z], r: 0.32, hh: h / 2, rd: 0.05, col: marble, k: 0 }, { s: 'box', c: [x, 0.55 + h, z], hs: [0.42, 0.1, 0.42], rd: 0.03, col: gold, k: 0 }];
    P('iruin', [shore(C('#c8d8d0'), 0.45),
      { s: 'cyl', ax: 'y', c: [0, 0.25, 0], r: 3.0, hh: 0.25, rd: 0.06, col: marbleD, k: 0 }, { s: 'cyl', ax: 'y', c: [0, 0.55, 0], r: 2.4, hh: 0.12, rd: 0.04, col: marble, k: 0 },
      ...col(-1.5, -1.2, 2.6), ...col(1.5, -1.2, 1.4), ...col(-1.5, 1.2, 1.9), ...col(1.6, 1.4, 2.9),
      { s: 'box', c: [0, 3.25, -1.2], hs: [1.95, 0.18, 0.4], rd: 0.04, col: marble, k: 0 }, ...col(1.5, -1.2, 2.6).slice(0, 1),
      { s: 'cyl', ax: 'x', c: [0.2, 0.92, 0.3], r: 0.3, hh: 1.0, rd: 0.05, col: marbleD, k: 0 },
      { s: 'sph', c: [-0.2, 0.7, 1.9], r: 1.0, col: gold, k: 0 }, { s: 'box', c: [-0.2, 0.0, 1.9], hs: [1.2, 0.7, 1.2], sub: true, k: 0 },
      { s: 'sph', c: [2.3, 0.95, -0.4], r: 0.62, col: marbleD, k: 0 }, { s: 'cap', a: [2.55, 1.0, 0.05], b: [2.7, 1.05, 0.2], r: 0.13, col: marbleD, k: 0.05 },
      { s: 'box', c: [2.3, 1.55, -0.4], hs: [0.5, 0.08, 0.5], rd: 0.04, col: gold, k: 0 },
      ...[[-2.4, 0.2], [0.8, -2.5], [-0.8, 2.6]].flatMap(([x, z], i) => [0, 1, 2].map(j => { const a = j * 2.1 + i; return { s: 'cap', a: [x, 0.4, z], b: [x + Math.cos(a) * 0.35, 1.0 + j * 0.1, z + Math.sin(a) * 0.35], r: 0.1, r2: 0.05, col: coral, k: 0.06 }; }))], { ao: 0.4 });
  }
  // the Atlantis column that bursts up from the sea (drawn small, as an islet)
  {
    const marble = C('#f2eee6'), gold = C('#e8b84a');
    P('icol', [{ s: 'cyl', ax: 'y', c: [0, 2.6, 0], r: 2.6, hh: 3.2, rd: 0.3, col: marble, k: 0 },
      ...Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU; return { s: 'cyl', ax: 'y', c: [Math.cos(a) * 2.6, 2.6, Math.sin(a) * 2.6], r: 0.28, hh: 3.0, rd: 0.1, sub: true, k: 0.1 }; }),
      { s: 'box', c: [0, 6.1, 0], hs: [3.2, 0.45, 3.2], rd: 0.12, col: gold, k: 0 }, { s: 'cyl', ax: 'y', c: [0, 6.75, 0], r: 2.2, hh: 0.25, rd: 0.08, col: marble, k: 0 },
      { s: 'tor', ax: 'y', c: [0, 0.3, 0], R: 2.7, r: 0.35, a0: -Math.PI, a1: Math.PI, col: C('#5affe0'), k: 0 }], { ao: 0.35 });
  }
  // the Soda Sea: gumdrop hills sugared with sprinkles on pink frosting, candy canes, swirl lollipops, chocolate rocks
  {
    const drops = [C('#ff4a6a'), C('#4ad86a'), C('#ffd34a'), C('#a86aff'), C('#ff8a2a')];
    const cane = (x, z, h) => [...Array.from({ length: 6 }, (_, i) => ({ s: 'cap', a: [x, 0.5 + i * h / 6, z], b: [x, 0.5 + (i + 1) * h / 6, z], r: 0.15, col: i % 2 ? C('#ffffff') : C('#e8283c'), k: 0 })),
      { s: 'tor', ax: 'z', c: [x + 0.35, 0.5 + h, z], R: 0.35, r: 0.15, a0: 0, a1: Math.PI, col: C('#e8283c'), k: 0 }];
    const lolly = (x, z, h, c1) => [{ s: 'cap', a: [x, 0.5, z], b: [x, 0.5 + h, z], r: 0.06, col: C('#ffffff'), k: 0 },
      { s: 'cyl', ax: 'z', c: [x, 0.5 + h + 0.5, z], r: 0.55, hh: 0.08, rd: 0.06, col: c1, k: 0 }, { s: 'tor', ax: 'z', c: [x, 0.5 + h + 0.5, z + 0.04], R: 0.3, r: 0.07, a0: -Math.PI, a1: Math.PI * 0.6, col: C('#ffffff'), k: 0 }];
    P('icandy', [shore(C('#ffb8d8'), 0.5), { s: 'ell', c: [0, 0.15, 0], rr: [3.2, 0.4, 3.0], col: C('#ff9ac8'), k: 0.3 },
      ...[[0, 0, 1.6], [1.6, -1.2, 1.0], [-1.7, -0.6, 1.1], [-0.6, 1.8, 0.9], [1.5, 1.4, 0.8]].map(([x, z, r], i) => ({ s: 'sph', c: [x, 0.3, z], r, col: drops[i], k: 0.15 })),
      ...Array.from({ length: 22 }, (_, i) => { const a = i * 2.39, d = 0.3 + (i % 6) * 0.45; return { s: 'cap', a: [Math.cos(a) * d, 1.2 + (i % 3) * 0.2 - d * 0.3, Math.sin(a) * d], b: [Math.cos(a) * d + 0.08, 1.24 + (i % 3) * 0.2 - d * 0.3, Math.sin(a) * d + 0.05], r: 0.04, col: drops[(i + 2) % 5], k: 0 }; }),
      ...cane(2.4, 0.2, 2.2), ...cane(-2.2, 1.6, 1.8), ...lolly(-0.6, -2.3, 1.6, C('#5ac8ff')), ...lolly(2.6, -1.9, 1.2, C('#ffd34a')),
      ...[[2.8, 1.4], [-2.8, -1.2]].map(([x, z]) => ({ s: 'box', c: [x, 0.4, z], hs: [0.4, 0.3, 0.4], rd: 0.08, col: C('#6a3a1e'), k: 0 }))], { ao: 0.35 });
  }
  // the Bermuda Triangle: a sandbar with a crashed propeller plane, a broken striped lighthouse and a buoy
  {
    const sand = C('#e8d4a0'), planeC = C('#c8ccd4'), rust = C('#a85a2a');
    P('itri', [shore(sand, 0.5), { s: 'ell', c: [0.4, 0.15, 0.2], rr: [2.4, 0.35, 2.0], col: C('#d8c48a'), k: 0.4 },
      { s: 'cap', a: [-1.4, 0.55, -0.4], b: [1.2, 0.9, 0.6], r: 0.42, r2: 0.3, col: planeC, k: 0 },
      { s: 'box', c: [0.0, 0.75, 0.1], hs: [0.25, 0.06, 2.0], rd: 0.05, col: planeC, k: 0 },
      { s: 'box', c: [-1.3, 1.0, -0.35], hs: [0.15, 0.4, 0.06], rd: 0.04, col: rust, k: 0 }, { s: 'box', c: [-1.35, 0.95, -0.35], hs: [0.1, 0.04, 0.6], rd: 0.03, col: planeC, k: 0 },
      { s: 'sph', c: [1.3, 0.95, 0.65], r: 0.2, col: C('#5a5a64'), k: 0 },
      ...[0, 1, 2].map(i => { const a = i / 3 * TAU; return { s: 'cap', a: [1.42, 0.95, 0.68], b: [1.45, 0.95 + Math.cos(a) * 0.5, 0.68 + Math.sin(a) * 0.5], r: 0.05, col: C('#3a3a44'), k: 0 }; }),
      { s: 'ell', c: [0.4, 1.05, 0.3], rr: [0.18, 0.12, 0.3], col: C('#5ad0ff'), k: 0 },
      ...[0, 1, 2, 3].map(i => ({ s: 'cyl', ax: 'y', c: [-1.8, 0.7 + i * 0.5, 1.6], r: 0.55 - i * 0.04, hh: 0.25, rd: 0.04, col: i % 2 ? C('#ffffff') : C('#e8283c'), k: 0 })),
      { s: 'box', c: [-1.75, 2.75, 1.65], hs: [0.5, 0.2, 0.5], rd: 0.06, col: C('#3a3a44'), sub: false, k: 0 },
      { s: 'cap', a: [2.6, 0.2, -1.6], b: [2.6, 1.2, -1.6], r: 0.25, r2: 0.15, col: C('#ff8a2a'), k: 0 }, { s: 'sph', c: [2.6, 1.3, -1.6], r: 0.12, col: C('#7affc8'), k: 0 }], { ao: 0.4 });
  }
  // the Sky Sea: a cloud island: billowing white puffs, a little temple of white columns with a gold roof, a rainbow
  {
    const cloud = C('#ffffff'), cloudS = C('#e8eef8'), rb = ['#ff5a5a', '#ffa83a', '#ffe84a', '#5ad86a', '#4aa8ff', '#a86aff'].map(C);
    P('isky', [...Array.from({ length: 9 }, (_, i) => { const a = i / 9 * TAU, d = i % 2 ? 2.6 : 2.0; return { s: 'sph', c: [Math.cos(a) * d, 0.3 + (i % 3) * 0.15, Math.sin(a) * d], r: 1.0 + (i % 3) * 0.2, col: i % 3 ? cloud : cloudS, k: 0.5 }; }),
      { s: 'sph', c: [0, -0.2, 0], r: 2.6, col: cloud, k: 0.6 },
      ...[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].map(([x, z]) => ({ s: 'cyl', ax: 'y', c: [x, 2.45, z], r: 0.12, hh: 0.6, rd: 0.03, col: C('#f8f4ee'), k: 0 })),
      { s: 'cyl', ax: 'y', c: [0, 1.8, 0], r: 1.0, hh: 0.08, rd: 0.03, col: C('#f8f4ee'), k: 0 },
      { s: 'cap', a: [0, 3.05, 0], b: [0, 3.7, 0], r: 1.0, r2: 0.05, col: C('#f2c440'), k: 0 },
      ...rb.map((c, i) => ({ s: 'tor', ax: 'z', c: [0, 0.4, -1.6], R: 3.4 - i * 0.14, r: 0.075, a0: 0.15, a1: Math.PI - 0.15, col: c, k: 0 }))], { ao: 0.25 });
  }
  // Leviathan Trench: a dark sandbar with a giant ribcage arching out of it, its spine, and a great skull
  {
    const boneC = C('#e8e0c8'), boneD = C('#c8bea0');
    P('ibones', [shore(C('#3a3a44'), 0.45), ...rockMass(41, 1.6, 0.4, C('#3a3a44'), C('#2e2e38')),
      { s: 'cap', a: [0, 0.6, -2.6], b: [0, 0.75, 1.6], r: 0.2, col: boneD, k: 0.05 },
      ...[-2.0, -1.2, -0.4, 0.4, 1.2].map((z, i) => ({ s: 'tor', ax: 'z', c: [0, 0.4, z], R: 1.7 - i * 0.12, r: 0.13, a0: 0.05, a1: Math.PI - 0.05, col: boneC, k: 0.03 })),
      { s: 'sph', c: [0.3, 0.9, 2.45], r: 0.95, col: boneC, k: 0 }, { s: 'ell', c: [0.3, 0.55, 3.0], rr: [0.65, 0.35, 0.55], col: boneC, k: 0.2 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [0.3 + sx * 0.38, 1.05, 3.15], r: 0.26, col: C('#14101a'), k: 0.02 })),
      ...Array.from({ length: 5 }, (_, i) => ({ s: 'cap', a: [0.3 - 0.4 + i * 0.2, 0.45, 3.4], b: [0.3 - 0.4 + i * 0.2, 0.25, 3.45], r: 0.06, r2: 0.02, col: boneC, k: 0 })),
      ...pebbles(5, 3.2, C('#3a3a44'), 41)], { ao: 0.45 });
  }
  // Davy Jones' Locker: a black-green rock shaped like a huge skull with cave eyes, chests and ghost lanterns
  {
    const rockK = C('#26302a'), rockK2 = C('#1c2620'), ghostG = C('#7affa8');
    P('ilocker', [shore(C('#1c2620'), 0.45), ...rockMass(51, 1.8, 0.7, rockK, rockK2),
      { s: 'rock', c: [0, 1.6, -0.3], r: 1.6, bump: 0.05, col: C('#3a4438'), k: 0.5 }, { s: 'ell', c: [0, 0.9, 0.9], rr: [1.1, 0.7, 0.8], col: C('#3a4438'), k: 0.4 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.58, 1.75, 1.0], r: 0.42, col: C('#0a100c'), k: 0.08 })),
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.58, 1.7, 1.25], r: 0.11, col: ghostG, k: 0 })),
      { s: 'ell', c: [0, 1.15, 1.45], rr: [0.18, 0.22, 0.14], col: C('#0a100c'), k: 0.04 },
      ...[[1.9, 1.2], [-2.0, 0.6]].flatMap(([x, z]) => [{ s: 'box', c: [x, 0.62, z], hs: [0.42, 0.26, 0.3], rd: 0.04, col: C('#6a3a1e'), k: 0 }, { s: 'cyl', ax: 'x', c: [x, 0.88, z], r: 0.3, hh: 0.42, rd: 0.04, col: C('#7a4a26'), k: 0 },
        { s: 'box', c: [x, 0.8, z + 0.31], hs: [0.08, 0.1, 0.02], rd: 0.01, col: C('#e8b84a'), k: 0 }]),
      ...[[1.2, -1.8], [-1.4, -1.6], [2.3, -0.3]].flatMap(([x, z]) => [{ s: 'cap', a: [x, 0.5, z], b: [x, 1.6, z], r: 0.05, col: C('#2a2a2a'), k: 0 }, { s: 'sph', c: [x, 1.72, z], r: 0.16, col: ghostG, k: 0 }])], { ao: 0.45 });
  }
  // World's Edge: a golden-sand island with a round marble temple under a gold dome, a giant gold trident, coins
  {
    const sand = C('#f4d48a'), marble = C('#f8f4ec'), gold = C('#f2c440'), goldD = C('#c8962a');
    P('iedge', [shore(sand, 0.5), { s: 'ell', c: [0, 0.2, 0], rr: [3.0, 0.4, 2.8], col: C('#e8c070'), k: 0.4 },
      { s: 'cyl', ax: 'y', c: [0, 0.65, 0], r: 1.7, hh: 0.15, rd: 0.05, col: marble, k: 0 },
      ...Array.from({ length: 8 }, (_, i) => { const a = i / 8 * TAU; return { s: 'cyl', ax: 'y', c: [Math.cos(a) * 1.4, 1.6, Math.sin(a) * 1.4], r: 0.14, hh: 0.8, rd: 0.03, col: marble, k: 0 }; }),
      { s: 'cyl', ax: 'y', c: [0, 2.5, 0], r: 1.65, hh: 0.12, rd: 0.04, col: gold, k: 0 },
      { s: 'sph', c: [0, 2.6, 0], r: 1.3, col: gold, k: 0 }, { s: 'box', c: [0, 1.6, 0], hs: [2, 1, 2], sub: true, k: 0 }, { s: 'sph', c: [0, 4.0, 0], r: 0.2, col: C('#5ad8ff'), k: 0 },
      { s: 'cap', a: [2.3, 0.4, -1.4], b: [2.3, 4.2, -1.4], r: 0.1, col: goldD, k: 0 },
      { s: 'cap', a: [1.85, 3.8, -1.4], b: [2.75, 3.8, -1.4], r: 0.09, col: gold, k: 0 },
      ...[-0.45, 0, 0.45].map(dx => ({ s: 'cap', a: [2.3 + dx, 3.8, -1.4], b: [2.3 + dx * 1.1, 4.8, -1.4], r: 0.08, r2: 0.02, col: gold, k: 0 })),
      ...Array.from({ length: 14 }, (_, i) => { const a = i * 2.39, d = 2.0 + (i % 3) * 0.35; return { s: 'cyl', ax: 'y', c: [Math.cos(a) * d, 0.55 + (i % 2) * 0.07, Math.sin(a) * d], r: 0.14, hh: 0.03, rd: 0.01, col: gold, k: 0 }; })], { ao: 0.4 });
  }
}
