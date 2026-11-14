// ============================================================
// The bosses of oceans 11-20 (13p-sea-deep-bosses.js). World scale, +z the front, y = 0 the waterline. Some ride
// a vehicle with the captain on deck (the pcapt model); the creatures are the boss themselves (no rider).
// Creatures use the 'cswim' clip: a bob, the jaw (bone 3), the tail (bone 4) and two fins (bones 5, 6).
// ============================================================
const SEA_DEEP_BOSS_MESHES = ['bangler', 'bbarge', 'bwyrm', 'btitan', 'bcake', 'bufo', 'bwhale', 'blevi', 'bjones', 'bjones_rig', 'bneptune'];
for (const id of SEA_DEEP_BOSS_MESHES) { THEME_CLIPS[id] = ['rock']; THEME_CELLS[id] = 0.05; }
for (const id of ['bangler', 'bwyrm', 'btitan', 'bwhale', 'blevi', 'bneptune']) THEME_CLIPS[id] = ['cswim'];
Object.assign(THEME_CELLS, { bufo: 0.045, bcake: 0.045, btitan: 0.045 });
MESH_ORDER.push(...SEA_DEEP_BOSS_MESHES, 'whale');
CLIPS.cswim = { frames: 32, fn(t) {
  const a = t * TAU;
  return { root: [0, 0.08 * Math.sin(a), 0], rot: Array.from({ length: NBONES }, (_, b) => (b === 3 ? [0.16 + 0.16 * Math.sin(a * 2), 0, 0] : b === 4 ? [0, 0.32 * Math.sin(a), 0] : b === 5 ? [0, 0, 0.25 * Math.sin(a + 1)] : b === 6 ? [0, 0, -0.25 * Math.sin(a + 1)] : b === 0 ? [0.03 * Math.sin(a + 0.5), 0, 0.02 * Math.sin(a)] : [0, 0, 0])) };
} };

function seaDeepBossModels(defs) {
  const C = hexToRgb;
  const P = (name, parts, o) => { const m = prop(defs, name, parts, o || { ao: 0.5 }); rig(m, { 0: [0, 0.3, 0] }); m.rockAmp = 0.012; return m; };
  const bonesAt = (m, at) => { for (const [b, p] of Object.entries(at)) m.bones[b].p = p; };
  const white = C('#fbf8f2'), dark = C('#16101a'), gold = C('#e8b84a'), teeth = C('#f4f0e0');

  // 11. the Lantern Angler: a vast dark anglerfish, its jaw (bone 3) hung open on rows of needle teeth, little
  // yellow eyes, glowing spots down its flanks, and its lure (on the head) blazing in the dark
  {
    const body = C('#1e2a44'), belly = C('#3a4a66'), glow = C('#7affe0'), lure = C('#e8ff7a');
    const parts = [
      { s: 'ell', c: [0, 0.7, 0], rr: [2.0, 1.7, 2.7], col: body, k: 0 },
      { s: 'ell', c: [0, 0.2, 0.3], rr: [1.7, 0.9, 2.3], col: belly, k: 0.5 },
      { s: 'ell', c: [0, 1.0, 2.2], rr: [1.6, 1.0, 0.8], col: dark, sub: true, k: 0.1 },
      ...Array.from({ length: 8 }, (_, i) => { const x = -1.2 + i * 0.34; return { s: 'cap', a: [x, 1.65, 2.25], b: [x * 1.03, 1.1, 2.4], r: 0.07, r2: 0.012, col: teeth, k: 0 }; }),
      // the jaw: an underbite with its own teeth
      { s: 'ell', c: [0, 0.35, 2.3], rr: [1.7, 0.45, 0.85], col: body, bone: 3, k: 0.1 },
      ...Array.from({ length: 9 }, (_, i) => { const x = -1.3 + i * 0.33; return { s: 'cap', a: [x, 0.6, 2.75], b: [x * 1.04, 1.25, 2.85], r: 0.075, r2: 0.012, col: teeth, bone: 3, k: 0 }; }),
      ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.95, 1.95, 1.6], r: 0.26, col: C('#ffd34a'), k: 0 }, { s: 'sph', c: [sx * 1.0, 1.98, 1.82], r: 0.11, col: dark, k: 0 }]),
      ...Array.from({ length: 12 }, (_, i) => { const sx = i % 2 ? 1 : -1, z = -1.8 + Math.floor(i / 2) * 0.65; return { s: 'sph', c: [sx * 1.85 * Math.sqrt(Math.max(0.1, 1 - (z / 2.8) ** 2)), 0.9, z], r: 0.12, col: glow, k: 0 }; }),
      ...[0, 1, 2, 3].map(i => ({ s: 'cap', a: [0, 2.2, -0.4 - i * 0.55], b: [0, 2.9 - i * 0.12, -0.7 - i * 0.55], r: 0.07, r2: 0.02, col: belly, k: 0.05 })),
      { s: 'ell', c: [0, 0.6, -2.9], rr: [0.15, 0.9, 0.7], col: body, bone: 4, k: 0.1 },
      ...[1, -1].map((sx, j) => ({ s: 'ell', c: [sx * 2.1, 0.5, 0.2], rr: [0.15, 0.6, 0.9], col: belly, bone: 5 + j, k: 0.1 })),
      { s: 'cap', a: [0, 2.3, 1.0], b: [0, 3.8, 2.0], r: 0.1, r2: 0.07, col: C('#3a3448'), k: 0.05 },
      { s: 'cap', a: [0, 3.8, 2.0], b: [0, 3.4, 3.2], r: 0.07, r2: 0.05, col: C('#3a3448'), k: 0.05 },
      { s: 'sph', c: [0, 3.2, 3.35], r: 0.42, col: lure, k: 0 },
    ];
    bonesAt(P('bangler', parts), { 3: [0, 0.6, 1.6], 4: [0, 0.6, -2.4], 5: [1.9, 0.5, 0.2], 6: [-1.9, 0.5, 0.2] });
  }
  // 12. the Weed Witch's swamp barge: a mossy log barge, a crooked thatched hut, a black cauldron bubbling green,
  // skull totems and green lanterns, weed trailing off the sides
  {
    const log = C('#5a4028'), moss = C('#4a6a2a'), thatch = C('#8a7a3a'), green = C('#7aff5a');
    P('bbarge', [
      ...Array.from({ length: 6 }, (_, i) => ({ s: 'cap', a: [-1.5 + i * 0.6, 0.25, -3.1], b: [-1.5 + i * 0.6, 0.25, 3.1], r: 0.3, col: i % 2 ? log : C('#6a4a2e'), k: 0 })),
      ...[-2.4, 0, 2.4].map(z => ({ s: 'cap', a: [-1.9, 0.5, z], b: [1.9, 0.5, z], r: 0.12, col: C('#3a2a1a'), k: 0 })),
      ...[[-1.0, -1.5], [1.2, 0.8], [-0.4, 2.2], [1.4, -2.2]].map(([x, z]) => ({ s: 'ell', c: [x, 0.52, z], rr: [0.7, 0.14, 0.6], col: moss, k: 0.05 })),
      // the hut at the back: crooked walls, a thatched roof, a glowing window
      { s: 'box', c: [0, 1.25, -1.9], hs: [1.1, 0.75, 0.95], rd: 0.08, col: C('#6a5a3a'), k: 0 },
      { s: 'gable', c: [0, 2.0, -1.9], w: 1.45, h: 1.1, hh: 1.15, ax: 'x', col: thatch, k: 0 },
      { s: 'box', c: [0.6, 1.4, -0.92], hs: [0.22, 0.2, 0.03], rd: 0.03, col: green, k: 0 },
      { s: 'cap', a: [-0.6, 2.6, -2.2], b: [-0.7, 3.4, -2.3], r: 0.1, col: C('#4a4040'), k: 0 },
      // the cauldron, bubbling
      { s: 'sph', c: [0, 1.15, 1.4], r: 0.75, col: C('#2a2a30'), k: 0 }, { s: 'cyl', ax: 'y', c: [0, 1.75, 1.4], r: 0.62, hh: 0.3, rd: 0.05, sub: true, k: 0.02 },
      { s: 'tor', ax: 'y', c: [0, 1.75, 1.4], R: 0.62, r: 0.08, a0: -Math.PI, a1: Math.PI, col: C('#3a3a42'), k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 1.62, 1.4], r: 0.6, hh: 0.05, rd: 0.03, col: green, k: 0 },
      ...[[0.15, 1.3], [-0.2, 1.55], [0.25, 1.6]].map(([x, z]) => ({ s: 'sph', c: [x, 1.7, z], r: 0.12, col: C('#b8ff8a'), k: 0 })),
      // skull totems and lanterns at the corners, weed hanging off the edges
      ...[[1.7, 2.8], [-1.7, 2.8]].flatMap(([x, z]) => [{ s: 'cap', a: [x, 0.5, z], b: [x, 2.2, z], r: 0.07, col: C('#3a2a1a'), k: 0 }, { s: 'sph', c: [x, 2.3, z], r: 0.22, col: C('#efe8d4'), k: 0 },
        ...[1, -1].map(sx => ({ s: 'sph', c: [x + sx * 0.08, 2.32, z + 0.18], r: 0.06, col: dark, k: 0 }))]),
      ...[[1.7, -2.8], [-1.7, -2.8]].flatMap(([x, z]) => [{ s: 'cap', a: [x, 0.5, z], b: [x, 1.8, z], r: 0.05, col: C('#2a2a2a'), k: 0 }, { s: 'sph', c: [x, 1.9, z], r: 0.18, col: green, k: 0 }]),
      ...Array.from({ length: 8 }, (_, i) => { const sx = i % 2 ? 1 : -1, z = -2.6 + Math.floor(i / 2) * 1.6; return { s: 'cap', a: [sx * 1.8, 0.45, z], b: [sx * 2.1, -0.1, z + 0.3], r: 0.08, r2: 0.04, col: moss, k: 0.03 }; }),
    ]);
  }
  // 13. the Whirl Wyrm: a sea serpent: a horned, frilled head with fangs rearing up at the front, its body looping
  // out of the water in great coils behind, fins along its back, a tail fin at the end
  {
    const scale = C('#2a8a7a'), scaleD = C('#1a5a54'), belly = C('#bfe8a8'), frill = C('#ff7a5a');
    const parts = [
      // the neck rising to the head
      { s: 'cap', a: [0, -0.4, 1.0], b: [0, 2.2, 2.4], r: 0.75, r2: 0.62, col: scale, k: 0.15 },
      { s: 'ell', c: [0, 2.6, 2.9], rr: [0.8, 0.7, 1.1], col: scale, k: 0.3 },
      { s: 'ell', c: [0, 2.35, 3.6], rr: [0.6, 0.45, 0.65], col: scale, k: 0.25 },
      { s: 'ell', c: [0, 2.05, 3.7], rr: [0.52, 0.18, 0.55], col: C('#5a1a20'), k: 0.03 },
      ...Array.from({ length: 4 }, (_, i) => ({ s: 'cap', a: [-0.3 + i * 0.2, 2.25, 4.05], b: [-0.3 + i * 0.2, 1.95, 4.1], r: 0.05, r2: 0.01, col: teeth, k: 0 })),
      ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.5, 2.85, 3.3], r: 0.17, col: C('#ffd34a'), k: 0 }, { s: 'ell', c: [sx * 0.55, 2.86, 3.43], rr: [0.03, 0.12, 0.04], col: dark, k: 0 },
        { s: 'cap', a: [sx * 0.4, 3.1, 2.7], b: [sx * 0.8, 3.9, 2.1], r: 0.1, r2: 0.02, col: C('#e8e0c8'), k: 0.03 },
        { s: 'ell', c: [sx * 0.85, 2.6, 2.5], rr: [0.08, 0.5, 0.4], col: frill, k: 0.05 }]),
      { s: 'ell', c: [0, 1.6, 2.3], rr: [0.5, 0.6, 0.6], col: belly, k: 0.3 },
      // the coils: half rings standing up out of the water, getting smaller toward the tail
      ...[[-0.6, 1.25, 0.6], [-3.2, 1.05, 0.52], [-5.6, 0.85, 0.42]].flatMap(([z, R2, r]) => [
        { s: 'tor', ax: 'x', c: [0, 0, z], R: R2, r, a0: 0.05, a1: Math.PI - 0.05, col: scale, k: 0.1 },
        ...[0.6, 1.2, 1.8, 2.4].map(a => ({ s: 'ell', c: [0, Math.sin(a) * (R2 + r * 0.8), z + Math.cos(a) * (R2 + r * 0.8)], rr: [0.05, 0.25, 0.18], col: scaleD, k: 0.04 }))]),
      { s: 'ell', c: [0, 0.6, -7.4], rr: [0.08, 0.8, 0.6], col: frill, bone: 4, k: 0.05 },
    ];
    bonesAt(P('bwyrm', parts), { 4: [0, 0.4, -6.8] });
  }
  // 14. the Trident Titan: a bronze giant waist-deep in the sea, green with age: a crested helmet, a sea-white
  // beard, a breastplate, one hand raising a great golden trident
  {
    const bronze = C('#c08a4a'), patina = C('#5ab8a0'), beard = C('#e8f4f0'), plume = C('#d83a3a');
    P('btitan', [
      { s: 'cap', a: [0, -0.5, 0], b: [0, 3.0, 0], r: 1.35, r2: 1.55, col: patina, k: 0 },
      { s: 'ell', c: [0, 2.4, 0.5], rr: [1.4, 1.0, 0.7], col: bronze, k: 0.2 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 1.7, 3.1, 0], r: 0.75, col: bronze, k: 0.3 })),
      { s: 'cap', a: [0, 3.6, 0], b: [0, 4.3, 0.1], r: 0.55, col: patina, k: 0.2 },
      { s: 'sph', c: [0, 4.6, 0.15], r: 0.8, col: patina, k: 0.2 },
      { s: 'ell', c: [0, 4.0, 0.7], rr: [0.6, 0.7, 0.4], col: beard, k: 0.15 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.28, 4.75, 0.8], r: 0.12, col: C('#ffe86a'), k: 0 })),
      // the helmet and its crest
      { s: 'ell', c: [0, 5.0, 0.05], rr: [0.88, 0.62, 0.9], col: bronze, k: 0.05 },
      { s: 'box', c: [0, 4.75, 0.85], hs: [0.5, 0.15, 0.08], rd: 0.05, col: bronze, k: 0 },
      ...Array.from({ length: 6 }, (_, i) => { const a = 0.4 + i * 0.4; return { s: 'sph', c: [0, 5.2 + Math.sin(a) * 0.7, 0.05 - Math.cos(a) * 0.9], r: 0.22, col: plume, k: 0.15 }; }),
      // arms: the left reaching forward, the right raising the trident
      { s: 'cap', a: [1.8, 3.0, 0], b: [2.2, 1.8, 1.3], r: 0.45, r2: 0.38, col: patina, k: 0.15 }, { s: 'sph', c: [2.25, 1.65, 1.45], r: 0.42, col: bronze, k: 0.1 },
      { s: 'cap', a: [-1.8, 3.1, 0], b: [-2.3, 4.6, 0.4], r: 0.45, r2: 0.38, col: patina, k: 0.15 }, { s: 'sph', c: [-2.35, 4.8, 0.45], r: 0.42, col: bronze, k: 0.1 },
      { s: 'cap', a: [-2.35, 0.5, 0.45], b: [-2.35, 7.8, 0.45], r: 0.13, col: gold, k: 0 },
      { s: 'cap', a: [-3.0, 7.8, 0.45], b: [-1.7, 7.8, 0.45], r: 0.12, col: gold, k: 0 },
      ...[-0.65, 0, 0.65].map(dx => ({ s: 'cap', a: [-2.35 + dx, 7.8, 0.45], b: [-2.35 + dx * 1.1, 9.0, 0.45], r: 0.12, r2: 0.03, col: C('#ffd34a'), k: 0 })),
      ...[[0.8, 1.6], [-0.9, 1.2], [0.2, 0.8]].map(([x, y]) => ({ s: 'sph', c: [x, y, 1.45], r: 0.15, col: C('#ff7a9a'), k: 0.05 })),
    ]);
  }
  // 15. Captain Sugarbeard's cake ship: three tiers of sponge and frosting on a wafer hull, frosting drips,
  // candles burning on top, a giant cherry, sugar pearls round the rims
  {
    const sponge = C('#f2c890'), frost = C('#ff9ac8'), cream = C('#fff4f8'), choc = C('#6a3a1e'), cherry = C('#e8283c');
    P('bcake', [
      { s: 'ell', c: [0, 0.3, 0], rr: [2.3, 0.6, 3.2], col: C('#d8a868'), k: 0 },
      ...[[0.85, 2.1, 0.45, sponge], [1.55, 1.6, 0.35, choc], [2.15, 1.1, 0.3, sponge]].map(([y, r, h, col]) => ({ s: 'cyl', ax: 'y', c: [0, y, -0.4], r, hh: h, rd: 0.12, col, k: 0 })),
      ...[[1.3, 2.12], [1.9, 1.62], [2.45, 1.12]].map(([y, r]) => ({ s: 'cyl', ax: 'y', c: [0, y, -0.4], r, hh: 0.08, rd: 0.06, col: frost, k: 0 })),
      ...Array.from({ length: 14 }, (_, i) => { const a = i / 14 * TAU; return { s: 'cap', a: [Math.cos(a) * 2.13, 1.3, -0.4 + Math.sin(a) * 2.13], b: [Math.cos(a) * 2.13, 1.0 - (i % 3) * 0.12, -0.4 + Math.sin(a) * 2.13], r: 0.09, r2: 0.07, col: frost, k: 0.03 }; }),
      ...Array.from({ length: 16 }, (_, i) => { const a = i / 16 * TAU; return { s: 'sph', c: [Math.cos(a) * 1.62, 1.97, -0.4 + Math.sin(a) * 1.62], r: 0.08, col: cream, k: 0 }; }),
      ...Array.from({ length: 6 }, (_, i) => { const a = i / 6 * TAU + 0.3; return [{ s: 'cap', a: [Math.cos(a) * 0.8, 2.5, -0.4 + Math.sin(a) * 0.8], b: [Math.cos(a) * 0.8, 3.1, -0.4 + Math.sin(a) * 0.8], r: 0.07, col: i % 2 ? C('#5ac8ff') : C('#ffd34a'), k: 0 },
        { s: 'sph', c: [Math.cos(a) * 0.8, 3.2, -0.4 + Math.sin(a) * 0.8], r: 0.09, col: C('#ffb02a'), k: 0 }]; }).flat(),
      { s: 'sph', c: [0, 2.95, -0.4], r: 0.45, col: cherry, k: 0 }, { s: 'cap', a: [0, 3.35, -0.4], b: [0.25, 3.8, -0.6], r: 0.04, col: C('#3a6a2a'), k: 0 },
      { s: 'cap', a: [0, 0.8, 2.6], b: [0, 1.2, 3.5], r: 0.25, r2: 0.1, col: C('#d8a868'), k: 0 },
      ...[-1, 1].map(sx => ({ s: 'cap', a: [sx * 0.6, 0.85, 2.2], b: [sx * 1.2, 1.0, 2.8], r: 0.12, col: C('#ffffff'), k: 0 })),
    ]);
  }
  // 16. the Triangle Saucer: a silver flying saucer hovering over the waves: a glass dome with a little green
  // pilot, a ring of lights round the rim, a glowing beam emitter underneath
  {
    const silver = C('#c8d0dc'), silverD = C('#8a94a4'), glass = C('#8ae8ff'), lights = ['#ff4a6a', '#ffd34a', '#4aff8a', '#4ab8ff'].map(C);
    P('bufo', [
      { s: 'ell', c: [0, 2.6, 0], rr: [3.0, 0.55, 3.0], col: silver, k: 0 },
      { s: 'ell', c: [0, 2.45, 0], rr: [2.2, 0.6, 2.2], col: silverD, k: 0.2 },
      { s: 'sph', c: [0, 3.2, 0], r: 1.15, col: glass, k: 0 },
      { s: 'sph', c: [0, 3.15, 0.1], r: 0.38, col: C('#7ad86a'), k: 0 },
      ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.17, 3.2, 0.42], rr: [0.11, 0.15, 0.06], col: dark, k: 0 })),
      ...[1, -1].map(sx => ({ s: 'cap', a: [sx * 0.15, 3.45, 0.1], b: [sx * 0.3, 3.8, 0.15], r: 0.03, col: C('#7ad86a'), k: 0 })),
      ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU; return { s: 'sph', c: [Math.cos(a) * 2.75, 2.65, Math.sin(a) * 2.75], r: 0.16, col: lights[i % 4], k: 0 }; }),
      { s: 'cyl', ax: 'y', c: [0, 1.95, 0], r: 0.8, hh: 0.18, rd: 0.08, col: silverD, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 1.75, 0], r: 0.6, hh: 0.06, rd: 0.04, col: C('#aaffd8'), k: 0 },
      ...[0, 1, 2].map(i => { const a = i / 3 * TAU; return { s: 'cap', a: [Math.cos(a) * 1.6, 2.3, Math.sin(a) * 1.6], b: [Math.cos(a) * 2.1, 1.3, Math.sin(a) * 2.1], r: 0.08, col: silverD, k: 0 }; }),
    ]);
  }
  // 17. the Cloud Whale: a great sky-blue whale with a white belly, swimming through the clouds: a blowhole,
  // a smiling mouth, long pectoral fins (bones 5, 6), tail flukes (bone 4), puffs of cloud along its belly
  {
    const blue = C('#7aa8e8'), blueL = C('#a8c8ff'), belly = C('#f4f8ff');
    const parts = [
      { s: 'ell', c: [0, 1.0, 0.5], rr: [2.2, 1.8, 4.2], col: blue, k: 0 },
      { s: 'ell', c: [0, 0.4, 0.8], rr: [1.9, 1.0, 3.8], col: belly, k: 0.5 },
      ...Array.from({ length: 7 }, (_, i) => ({ s: 'cap', a: [-1.4 + i * 0.47, 0.1, 3.4], b: [-1.6 + i * 0.53, 0.3, 0.6], r: 0.06, col: C('#d8e4f4'), k: 0.03 })),
      { s: 'cap', a: [-1.6, 0.75, 4.3], b: [1.6, 0.75, 4.3], r: 0.06, col: C('#3a4a6a'), k: 0.02 },
      ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 1.75, 1.35, 2.7], r: 0.22, col: white, k: 0 }, { s: 'sph', c: [sx * 1.88, 1.37, 2.82], r: 0.11, col: dark, k: 0 }]),
      { s: 'ell', c: [0, 2.75, 1.6], rr: [0.3, 0.12, 0.2], col: C('#3a4a6a'), k: 0.05 },
      { s: 'ell', c: [0, 2.6, -1.0], rr: [0.12, 0.5, 0.7], col: blueL, k: 0.1 },
      { s: 'cap', a: [0, 1.0, -3.4], b: [0, 1.4, -5.6], r: 0.9, r2: 0.4, col: blue, k: 0.3 },
      ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 1.3, 1.5, -6.2], rr: [1.4, 0.15, 0.6], col: blueL, bone: 4, k: 0.1 })),
      ...[1, -1].map((sx, j) => ({ s: 'ell', c: [sx * 2.6, 0.5, 1.4], rr: [1.4, 0.15, 0.6], col: blueL, bone: 5 + j, k: 0.1 })),
      ...Array.from({ length: 7 }, (_, i) => { const a = i / 7 * TAU; return { s: 'sph', c: [Math.cos(a) * 2.3, 0.0, 0.4 + Math.sin(a) * 3.6], r: 0.8 + (i % 3) * 0.2, col: C('#ffffff'), k: 0.4 }; }),
    ];
    bonesAt(P('bwhale', parts), { 4: [0, 1.3, -5.4], 5: [2.0, 0.6, 1.4], 6: [-2.0, 0.6, 1.4] });
  }
  // 18. the Leviathan: a colossal head and neck rising from the deep: armored brow ridges, burning orange eyes,
  // a jaw (bone 3) full of enormous teeth, spines down its neck and humps of its body behind
  {
    const hide = C('#1e3a4a'), hideD = C('#12262f'), plate = C('#3a5a68'), eye = C('#ff8a2a');
    const parts = [
      { s: 'cap', a: [0, -1.0, -1.0], b: [0, 3.0, 1.2], r: 1.6, r2: 1.35, col: hide, k: 0.2 },
      { s: 'ell', c: [0, 3.6, 2.4], rr: [1.7, 1.3, 2.2], col: hide, k: 0.4 },
      { s: 'ell', c: [0, 3.1, 3.9], rr: [1.4, 0.75, 1.3], col: hide, k: 0.3 },
      { s: 'ell', c: [0, 2.7, 4.1], rr: [1.2, 0.25, 1.1], col: C('#4a1018'), k: 0.03 },
      ...Array.from({ length: 7 }, (_, i) => { const x = -1.0 + i * 0.33; return { s: 'cap', a: [x, 3.0, 4.9 - Math.abs(x) * 0.4], b: [x * 1.03, 2.45, 5.0 - Math.abs(x) * 0.4], r: 0.11, r2: 0.02, col: teeth, k: 0 }; }),
      { s: 'ell', c: [0, 2.2, 3.7], rr: [1.25, 0.4, 1.4], col: hideD, bone: 3, k: 0.15 },
      ...Array.from({ length: 6 }, (_, i) => { const x = -0.85 + i * 0.34; return { s: 'cap', a: [x, 2.35, 4.8 - Math.abs(x) * 0.4], b: [x * 1.03, 2.95, 4.85 - Math.abs(x) * 0.4], r: 0.1, r2: 0.02, col: teeth, bone: 3, k: 0 }; }),
      ...[1, -1].flatMap(sx => [{ s: 'cap', a: [sx * 0.5, 4.5, 2.6], b: [sx * 1.4, 4.2, 3.6], r: 0.28, col: plate, k: 0.15 }, { s: 'sph', c: [sx * 1.1, 3.95, 3.5], r: 0.3, col: eye, k: 0 },
        { s: 'ell', c: [sx * 1.18, 3.95, 3.75], rr: [0.05, 0.22, 0.06], col: dark, k: 0 },
        { s: 'cap', a: [sx * 0.9, 4.6, 1.6], b: [sx * 1.7, 5.8, 0.6], r: 0.22, r2: 0.04, col: C('#d8d0b8'), k: 0.05 }]),
      ...Array.from({ length: 6 }, (_, i) => ({ s: 'cap', a: [0, 4.7 - i * 0.7, 1.4 - i * 0.55], b: [0, 5.4 - i * 0.7, 1.0 - i * 0.55], r: 0.16, r2: 0.03, col: plate, k: 0.05 })),
      ...[[-4.2, 1.3, 0.75], [-7.0, 1.0, 0.6]].map(([z, R2, r]) => ({ s: 'tor', ax: 'x', c: [0, 0, z], R: R2, r, a0: 0.05, a1: Math.PI - 0.05, col: hide, k: 0.1 })),
      { s: 'ell', c: [0, 0.5, -9.0], rr: [0.12, 1.0, 0.8], col: plate, bone: 4, k: 0.05 },
    ];
    bonesAt(P('blevi', parts), { 3: [0, 2.6, 2.6], 4: [0, 0.4, -8.4] });
  }
  // 19. Davy Jones' ship: the galleon, rotted green and grown over with coral, barnacles and kelp; tattered
  // green sails on its rig
  {
    const G0 = defs.galleon, G1 = defs.galleon_rig, lum = c => c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15;
    const sea = c => { const l = lum(c); return l < 0.25 ? [0.12, 0.26, 0.22] : l < 0.5 ? [0.22, 0.42, 0.36] : [0.55, 0.85, 0.7]; };
    const coral = [C('#ff7a5a'), C('#ff5aa8'), C('#ffb02a'), C('#c86aff')];
    const extra = [
      ...Array.from({ length: 12 }, (_, i) => { const sx = i % 2 ? 1 : -1, z = -3 + Math.floor(i / 2) * 1.2; return { s: 'sph', c: [sx * 1.3 * Math.sqrt(Math.max(0.1, 1 - (z / 3.8) ** 2)), 0.35 + (i % 3) * 0.12, z], r: 0.16 + (i % 2) * 0.06, col: coral[i % 4], k: 0.04 }; }),
      ...Array.from({ length: 8 }, (_, i) => { const sx = i % 2 ? 1 : -1, z = -2.6 + Math.floor(i / 2) * 1.6; return { s: 'cap', a: [sx * 1.25, 0.7, z], b: [sx * 1.45, -0.2, z + 0.2], r: 0.07, r2: 0.03, col: C('#3a7a3a'), k: 0.02 }; }),
      ...[[0.6, 1.5], [-0.5, -1.2]].flatMap(([x, z], i) => [0, 1, 2].map(j => { const a = j * 2.1 + i; return { s: 'cap', a: [x, 0.9, z], b: [x + Math.cos(a) * 0.3, 1.5, z + Math.sin(a) * 0.3], r: 0.08, r2: 0.04, col: coral[(i + j) % 4], k: 0.04 }; })),
    ];
    const a = P('bjones', [...G0.parts.map(p => ({ ...p, col: p.col ? sea(p.col) : p.col, paint: false })), ...extra], { ao: 0.5 });
    const b = P('bjones_rig', G1.parts.map(p => ({ ...p, col: p.col ? sea(p.col) : p.col, paint: false })), { ao: 0.4 });
    a.bones = G0.bones.map(x => ({ ...x })); b.bones = G1.bones.map(x => ({ ...x }));
  }
  // 20. Neptune himself, standing in a great scallop-shell chariot of pearl and gold drawn by two seahorses:
  // sea-green skin, a white beard, a golden crown, his trident raised
  {
    const shell = C('#fff0e8'), shellD = C('#f4c8b8'), skin = C('#6ac8b8'), beard = C('#f4f8f8'), horse = C('#2ab8a8'), horseD = C('#178a80');
    const ribs = Array.from({ length: 9 }, (_, i) => { const a = -1.2 + i * 0.3; return { s: 'cap', a: [0, 0.4, -1.4], b: [Math.sin(a) * 2.2, 2.4, -1.4 - Math.cos(a) * 0.9], r: 0.18, col: i % 2 ? shell : shellD, k: 0.1 }; });
    const seahorse = sx => [
      { s: 'cap', a: [sx * 1.0, -0.4, 3.0], b: [sx * 1.0, 1.4, 3.3], r: 0.42, r2: 0.36, col: horse, k: 0.2 },
      { s: 'cap', a: [sx * 1.0, 1.4, 3.3], b: [sx * 1.0, 2.0, 3.0], r: 0.34, r2: 0.3, col: horse, k: 0.2 },
      { s: 'ell', c: [sx * 1.0, 2.2, 3.2], rr: [0.3, 0.32, 0.4], col: horse, k: 0.15 },
      { s: 'cap', a: [sx * 1.0, 2.15, 3.5], b: [sx * 1.0, 2.0, 4.1], r: 0.16, r2: 0.11, col: horse, k: 0.1 },
      ...Array.from({ length: 5 }, (_, i) => ({ s: 'ell', c: [sx * 1.0, 1.0 + i * 0.3, 2.85 - i * 0.05], rr: [0.05, 0.14, 0.12], col: horseD, k: 0.03 })),
      { s: 'sph', c: [sx * 1.22, 2.3, 3.35], r: 0.08, col: dark, k: 0 },
      { s: 'cap', a: [sx * 1.0, 1.6, 3.0], b: [sx * 0.2, 1.4, 1.2], r: 0.03, col: gold, k: 0 }];
    P('bneptune', [
      { s: 'ell', c: [0, 0.5, -0.4], rr: [2.2, 0.8, 2.0], col: shell, k: 0 },
      ...ribs,
      { s: 'ell', c: [0, 1.0, -0.2], rr: [1.7, 0.5, 1.5], sub: true, k: 0.05 },
      ...Array.from({ length: 12 }, (_, i) => { const a = i / 12 * TAU; return { s: 'sph', c: [Math.cos(a) * 2.0, 1.05, -0.4 + Math.sin(a) * 1.8], r: 0.13, col: gold, k: 0 }; }),
      ...seahorse(1), ...seahorse(-1),
      // Neptune: legs in the shell, a broad torso, arms, the head, the beard, the crown, the trident
      { s: 'cap', a: [0, 0.8, -0.4], b: [0, 2.9, -0.4], r: 0.7, r2: 0.85, col: skin, k: 0.1 },
      { s: 'ell', c: [0, 1.4, -0.4], rr: [0.8, 0.45, 0.7], col: C('#2a6ad8'), k: 0.1 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.95, 3.0, -0.4], r: 0.45, col: skin, k: 0.25 })),
      { s: 'sph', c: [0, 3.75, -0.35], r: 0.55, col: skin, k: 0.15 },
      { s: 'ell', c: [0, 3.25, 0.0], rr: [0.5, 0.65, 0.35], col: beard, k: 0.15 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.2, 3.9, 0.12], r: 0.09, col: dark, k: 0 })),
      { s: 'tor', ax: 'y', c: [0, 4.2, -0.35], R: 0.42, r: 0.07, a0: -Math.PI, a1: Math.PI, col: gold, k: 0 },
      ...Array.from({ length: 7 }, (_, i) => { const a = i / 7 * TAU; return { s: 'cap', a: [Math.cos(a) * 0.42, 4.2, -0.35 + Math.sin(a) * 0.42], b: [Math.cos(a) * 0.45, 4.65, -0.35 + Math.sin(a) * 0.45], r: 0.06, r2: 0.01, col: gold, k: 0 }; }),
      { s: 'cap', a: [1.0, 3.0, -0.4], b: [1.5, 2.0, 0.6], r: 0.3, r2: 0.26, col: skin, k: 0.15 },
      { s: 'cap', a: [-1.0, 3.0, -0.4], b: [-1.5, 4.2, 0.0], r: 0.3, r2: 0.26, col: skin, k: 0.15 }, { s: 'sph', c: [-1.55, 4.35, 0.05], r: 0.28, col: skin, k: 0.1 },
      { s: 'cap', a: [-1.55, 1.0, 0.05], b: [-1.55, 6.6, 0.05], r: 0.09, col: gold, k: 0 },
      { s: 'cap', a: [-2.05, 6.6, 0.05], b: [-1.05, 6.6, 0.05], r: 0.09, col: gold, k: 0 },
      ...[-0.5, 0, 0.5].map(dx => ({ s: 'cap', a: [-1.55 + dx, 6.6, 0.05], b: [-1.55 + dx * 1.1, 7.5, 0.05], r: 0.09, r2: 0.02, col: C('#ffd34a'), k: 0 })),
    ]);
  }
}
