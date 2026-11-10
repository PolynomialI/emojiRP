// ============================================================
// Chapters 11-15: scenery and boss bodies, built with prop() like 04a-theme-models.js.
// Model units: 1 is about one hero leg. Parts without col take the instance tint.
// ============================================================
Object.assign(THEME_CLIPS, { pumpking: ['run', 'slam', 'idle', 'throw'], geode: ['run', 'slam', 'idle', 'throw'] });
Object.assign(THEME_CELLS, { tombstone0: 0.025, tombstone1: 0.022, pumpkin: 0.018, fence: 0.016, gravetree: 0.016, pumpking: 0.014,
  crystal: 0.02, stalagmite: 0.025, geode: 0.016,
  cloudpuff: 0.045, pillar: 0.022, rainbow: 0.022, stormcloud: 0.03 });
MESH_ORDER.push('tombstone0', 'tombstone1', 'pumpkin', 'fence', 'gravetree', 'pumpking',
  'crystal', 'stalagmite', 'geode',
  'cloudpuff', 'pillar', 'rainbow', 'stormcloud');

function themeModels2(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  // ---------- Haunted Graveyard (chapter 11) ----------
  {
    const moss = C('#4f6a3a'), iron = C('#24222c'), ironHi = C('#4a4658'), stone = C('#6c6a74'), orange = C('#ff8a1f'), stem = C('#4f6a2a'), lit = C('#ffd34a'), bark = C('#2c2632');
    // a rounded headstone with a carved cross and a little moss; the stone takes the tint
    P('tombstone0', [
      { s: 'box', c: [0, 0.42, 0], hs: [0.3, 0.42, 0.08], rd: 0.05, k: 0.02 },
      { s: 'cyl', ax: 'z', c: [0, 0.84, 0], r: 0.3, hh: 0.08, rd: 0.05, k: 0.03 },
      { s: 'box', c: [0, 0.05, 0.02], hs: [0.38, 0.05, 0.16], rd: 0.03, k: 0.02 },
      { s: 'box', c: [0, 0.62, 0.085], hs: [0.03, 0.15, 0.03], rd: 0.01, sub: true, k: 0.01 },
      { s: 'box', c: [0, 0.68, 0.085], hs: [0.1, 0.03, 0.03], rd: 0.01, sub: true, k: 0.01 },
      { s: 'sph', c: [0.2, 0.98, 0.02], r: 0.09, col: moss, k: 0.04 },
      { s: 'sph', c: [-0.26, 0.12, 0.1], r: 0.08, col: moss, k: 0.04 },
    ], { ao: 0.8 });
    // a stone cross on a plinth
    P('tombstone1', [
      { s: 'box', c: [0, 0.6, 0], hs: [0.08, 0.5, 0.08], rd: 0.025, k: 0.01 },
      { s: 'box', c: [0, 0.8, 0], hs: [0.3, 0.075, 0.08], rd: 0.025, k: 0.01 },
      { s: 'box', c: [0, 0.08, 0], hs: [0.24, 0.08, 0.2], rd: 0.03, k: 0.02 },
      { s: 'sph', c: [0.08, 0.88, 0.06], r: 0.06, col: moss, k: 0.03 },
    ], { ao: 0.8 });
    // a jack-o'-lantern: ribbed and lit from inside
    P('pumpkin', [
      ...Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return { s: 'ell', c: [Math.cos(a) * 0.12, 0.3, Math.sin(a) * 0.12], rr: [0.24, 0.28, 0.24], col: orange, k: 0.03 }; }),
      { s: 'cap', a: [0, 0.52, 0], b: [0.05, 0.7, 0.02], r: 0.05, r2: 0.035, col: stem, k: 0.02 },
      { s: 'ell', c: [0.11, 0.38, 0.33], rr: [0.06, 0.065, 0.03], col: lit, k: 0 },
      { s: 'ell', c: [-0.11, 0.38, 0.33], rr: [0.06, 0.065, 0.03], col: lit, k: 0 },
      { s: 'ell', c: [0, 0.2, 0.33], rr: [0.15, 0.045, 0.03], col: lit, k: 0 },
    ]);
    // a wrought-iron fence panel between stone posts (wall ring)
    P('fence', [
      ...[-0.36, -0.12, 0.12, 0.36].map(x => ({ s: 'cap', a: [x, 0, 0], b: [x, 0.95, 0], r: 0.025, col: iron, k: 0 })),
      ...[-0.36, -0.12, 0.12, 0.36].map(x => ({ s: 'cap', a: [x, 0.95, 0], b: [x, 1.1, 0], r: 0.045, r2: 0.006, col: ironHi, k: 0.01 })),
      { s: 'box', c: [0, 0.3, 0], hs: [0.48, 0.022, 0.02], rd: 0.01, col: iron, k: 0 },
      { s: 'box', c: [0, 0.8, 0], hs: [0.48, 0.022, 0.02], rd: 0.01, col: iron, k: 0 },
      { s: 'box', c: [0.52, 0.55, 0], hs: [0.09, 0.55, 0.09], rd: 0.02, col: stone, k: 0.01 },
      { s: 'sph', c: [0.52, 1.15, 0], r: 0.09, col: stone, k: 0.02 },
    ], { ao: 0.7 });
    // a twisted, leafless tree
    P('gravetree', [
      { s: 'cap', a: [0, 0, 0], b: [0.08, 1.3, 0], r: 0.11, r2: 0.05, col: bark, k: 0.03 },
      { s: 'cap', a: [0.06, 0.85, 0], b: [0.46, 1.2, 0.08], r: 0.05, r2: 0.018, col: bark, k: 0.02 },
      { s: 'cap', a: [0.46, 1.2, 0.08], b: [0.6, 1.12, 0.1], r: 0.018, r2: 0.01, col: bark, k: 0.01 },
      { s: 'cap', a: [0.05, 0.65, 0], b: [-0.38, 1.0, -0.08], r: 0.05, r2: 0.018, col: bark, k: 0.02 },
      { s: 'cap', a: [-0.38, 1.0, -0.08], b: [-0.5, 1.22, -0.02], r: 0.018, r2: 0.01, col: bark, k: 0.01 },
      { s: 'cap', a: [0.08, 1.2, 0], b: [-0.1, 1.6, 0.12], r: 0.04, r2: 0.012, col: bark, k: 0.02 },
      ...[[0.16, 0.08, 0.04], [-0.12, 0.06, 0.14], [0.02, 0.05, -0.18]].map(([x, y, z]) => ({ s: 'cap', a: [0, 0.12, 0], b: [x * 2, y, z * 2], r: 0.06, r2: 0.025, col: bark, k: 0.04 })),
    ]);
  }
  // ---------- Pumpkin King (chapter 11 boss): a tall robed figure with a jack-o'-lantern head, a crown and a lantern ----------
  {
    const m = makeHumanoid({ ...STICK, hipY: 0.46, shY: 0.84, headY: 1.04, headR: 0.15, headZ: 0.03, shW: 0.2, hipW: 0.09, elOut: 0.08, upperLen: 0.21, foreLen: 0.21,
      pelvisR: 0.14, torso: 'ell', torsoRR: [0.21, 0.26, 0.17], neckR: 0.06, armR: 0.06, handR: 0.07, legR: 0.07, k: 0.05 });
    const J = m.J, hd = J.head, orange = C('#ff8a1f'), lit = C('#ffd34a'), stem = C('#4f6a2a'), gold = C('#ffc93a'), claw = C('#1a1420'), glass = C('#ffe9a0');
    // the robe flares out over the legs, and a high cape collar rises behind the head
    m.parts.push({ s: 'cap', a: [0, 0.55, 0], b: [0, 0.1, 0], r: 0.17, r2: 0.3, bone: 0, k: 0.05 });
    m.parts.push({ s: 'ell', c: [0, 0.62, -0.17], rr: [0.27, 0.36, 0.05], bone: 1, k: 0.04 });
    for (const sx of [1, -1]) m.parts.push({ s: 'cap', a: [sx * 0.14, 0.86, -0.1], b: [sx * 0.24, 1.12, -0.14], r: 0.06, r2: 0.012, bone: 1, k: 0.03 });
    // the pumpkin head: six ribs around the head, a stem, and a lit face
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      m.parts.push({ s: 'ell', c: [hd[0] + Math.cos(a) * 0.075, hd[1], hd[2] + Math.sin(a) * 0.075], rr: [0.15, 0.17, 0.15], col: orange, bone: 2, k: 0.03 });
    }
    m.parts.push({ s: 'cap', a: [hd[0], hd[1] + 0.15, hd[2]], b: [hd[0] + 0.04, hd[1] + 0.26, hd[2]], r: 0.035, r2: 0.025, col: stem, bone: 2, k: 0.02 });
    for (const sx of [1, -1]) m.parts.push({ s: 'ell', c: [hd[0] + sx * 0.08, hd[1] + 0.05, hd[2] + 0.2], rr: [0.05, 0.055, 0.025], col: lit, bone: 2, k: 0 });
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] - 0.07, hd[2] + 0.2], rr: [0.12, 0.035, 0.025], col: lit, bone: 2, k: 0 });
    // a spiky gold crown
    m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] + 0.13, hd[2]], R: 0.12, r: 0.025, a0: -Math.PI, a1: Math.PI, col: gold, bone: 2, k: 0 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + 0.3;
      m.parts.push({ s: 'cap', a: [hd[0] + Math.cos(a) * 0.12, hd[1] + 0.13, hd[2] + Math.sin(a) * 0.12], b: [hd[0] + Math.cos(a) * 0.13, hd[1] + 0.24, hd[2] + Math.sin(a) * 0.13], r: 0.025, r2: 0.008, col: gold, bone: 2, k: 0.01 });
    }
    // bony claws, and a glowing lantern swinging from the left hand
    for (const sd of ['L', 'R']) {
      const ha = J['ha' + sd], b = sd === 'L' ? 4 : 6;
      for (const dx of [-0.04, 0, 0.04]) m.parts.push({ s: 'cap', a: [ha[0] + dx, ha[1] - 0.04, ha[2] + 0.03], b: [ha[0] + dx * 1.4, ha[1] - 0.15, ha[2] + 0.08], r: 0.018, r2: 0.006, col: claw, bone: b, k: 0 });
    }
    const hl = J.haL;
    m.parts.push({ s: 'cap', a: [hl[0], hl[1] - 0.05, hl[2]], b: [hl[0], hl[1] - 0.16, hl[2]], r: 0.012, col: claw, bone: 4, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hl[0], hl[1] - 0.24, hl[2]], r: 0.065, hh: 0.08, rd: 0.02, col: glass, bone: 4, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hl[0], hl[1] - 0.15, hl[2]], r: 0.075, hh: 0.015, rd: 0.01, col: claw, bone: 4, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hl[0], hl[1] - 0.33, hl[2]], r: 0.075, hh: 0.015, rd: 0.01, col: claw, bone: 4, k: 0 });
    m.top = hd[1] + 0.3; m.bmin = [-0.6, -0.03, -0.55]; m.bmax = [0.6, m.top + 0.05, 0.55]; m.name = 'pumpking'; m.runAmp = 0.6;
    defs.pumpking = m;
  }
  // ---------- Crystal Caverns (chapter 12) ----------
  {
    const rockD = C('#2a2438');
    // a cluster of crystal shafts on a dark rock base; the crystals take the tint
    P('crystal', [
      { s: 'ell', c: [0, 0.05, 0], rr: [0.42, 0.1, 0.36], col: rockD, k: 0.04 },
      { s: 'cap', a: [0, 0, 0], b: [0.05, 1.3, 0.02], r: 0.17, r2: 0.02, k: 0.01 },
      { s: 'cap', a: [0.1, 0, 0.05], b: [0.45, 0.85, 0.12], r: 0.12, r2: 0.015, k: 0.01 },
      { s: 'cap', a: [-0.08, 0, -0.04], b: [-0.4, 0.95, -0.1], r: 0.13, r2: 0.015, k: 0.01 },
      { s: 'cap', a: [0.02, 0, -0.08], b: [0.1, 0.7, -0.42], r: 0.1, r2: 0.012, k: 0.01 },
      { s: 'cap', a: [-0.04, 0, 0.1], b: [-0.18, 0.55, 0.4], r: 0.09, r2: 0.012, k: 0.01 },
    ], { ao: 0.6 });
    // a rocky spire; takes the arena's rock color
    P('stalagmite', [
      { s: 'rock', c: [0, 0.2, 0], r: 0.35, bump: 0.15, k: 0.05 },
      { s: 'cap', a: [0, 0.2, 0], b: [0.05, 1.5, 0.03], r: 0.26, r2: 0.03, k: 0.06 },
      { s: 'cap', a: [0.2, 0.1, 0.1], b: [0.32, 0.7, 0.15], r: 0.13, r2: 0.02, k: 0.04 },
    ], { ao: 0.8 });
  }
  // ---------- Geode Titan (chapter 12 boss): a rock giant split open by crystals, with a glowing heart-stone ----------
  {
    const m = makeHumanoid({ ...STICK, hipY: 0.42, shY: 0.8, headY: 0.98, headR: 0.15, headZ: 0.1, shW: 0.3, hipW: 0.13, elOut: 0.1, upperLen: 0.2, foreLen: 0.2,
      pelvisR: 0.2, torso: 'ell', torsoRR: [0.32, 0.28, 0.24], neckR: 0.12, armR: 0.11, handR: 0.16, legR: 0.13, k: 0.06 });
    const J = m.J, hd = J.head, cyan = C('#7af0ff'), pink = C('#ff7ae0'), heart = C('#c8fbff'), eye = C('#ff9af0');
    m.parts.push({ s: 'rock', c: [0, 0.66, -0.02], r: 0.29, bump: 0.12, bone: 1, k: 0.04 });
    m.parts.push({ s: 'rock', c: [hd[0], hd[1] + 0.02, hd[2]], r: 0.17, bump: 0.12, bone: 2, k: 0.03 });
    // the heart-stone in the chest, and crystals bursting out of the back and shoulders
    m.parts.push({ s: 'sph', c: [0, 0.66, 0.24], r: 0.1, col: heart, bone: 1, k: 0.02 });
    for (const [x, y, dx, dy, dz, r, col] of [[0, 0.78, 0.0, 0.32, -0.3, 0.1, cyan], [0.15, 0.7, 0.15, 0.24, -0.26, 0.08, pink], [-0.16, 0.68, -0.16, 0.26, -0.24, 0.085, cyan], [0.05, 0.55, 0.05, 0.16, -0.3, 0.07, pink]])
      m.parts.push({ s: 'cap', a: [x, y, -0.18], b: [x + dx, y + dy, -0.18 + dz], r, r2: 0.012, col, bone: 1, k: 0.01 });
    for (const sx of [1, -1]) {
      m.parts.push({ s: 'cap', a: [sx * 0.32, 0.86, 0], b: [sx * 0.46, 1.12, -0.02], r: 0.08, r2: 0.012, col: sx > 0 ? pink : cyan, bone: 1, k: 0.01 });
      m.parts.push({ s: 'cap', a: [sx * 0.28, 0.88, -0.06], b: [sx * 0.34, 1.06, -0.18], r: 0.06, r2: 0.01, col: sx > 0 ? cyan : pink, bone: 1, k: 0.01 });
      m.parts.push({ s: 'ell', c: [hd[0] + sx * 0.07, hd[1] + 0.03, hd[2] + 0.15], rr: [0.05, 0.035, 0.03], col: eye, bone: 2, k: 0 });
    }
    m.parts.push({ s: 'box', c: [hd[0], hd[1] + 0.07, hd[2] + 0.12], hs: [0.13, 0.03, 0.05], rd: 0.02, bone: 2, k: 0.03 });
    // boulder fists studded with crystal knuckles
    for (const sd of ['L', 'R']) {
      const sx = sd === 'L' ? 1 : -1, b = sd === 'L' ? 4 : 6, ha = J['ha' + sd];
      m.parts.push({ s: 'rock', c: [sx * 0.33, 0.86, -0.02], r: 0.16, bump: 0.16, bone: 1, k: 0.04 });
      m.parts.push({ s: 'rock', c: [ha[0], ha[1] - 0.03, ha[2] + 0.02], r: 0.19, bump: 0.16, bone: b, k: 0.04 });
      for (const dx of [-0.07, 0.07]) m.parts.push({ s: 'cap', a: [ha[0] + dx, ha[1] - 0.06, ha[2] + 0.14], b: [ha[0] + dx * 1.3, ha[1] - 0.1, ha[2] + 0.26], r: 0.045, r2: 0.01, col: cyan, bone: b, k: 0.01 });
    }
    m.top = hd[1] + 0.2; m.bmin = [-0.72, -0.03, -0.62]; m.bmax = [0.72, m.top + 0.2, 0.6]; m.name = 'geode'; m.runAmp = 0.65;
    defs.geode = m;
  }
  // ---------- Sky Islands (chapter 13) ----------
  {
    const marble = C('#f2eee6'), marbleD = C('#d8d2c6'), gold = C('#ffcf4a');
    // a soft heap of cloud; takes the tint
    P('cloudpuff', [
      { s: 'sph', c: [0, 0.42, 0], r: 0.46, k: 0.14 },
      { s: 'sph', c: [0.42, 0.3, 0.08], r: 0.34, k: 0.14 },
      { s: 'sph', c: [-0.4, 0.32, -0.06], r: 0.36, k: 0.14 },
      { s: 'sph', c: [0.1, 0.32, 0.4], r: 0.3, k: 0.14 },
      { s: 'sph', c: [-0.12, 0.3, -0.4], r: 0.3, k: 0.14 },
      { s: 'sph', c: [0.18, 0.7, -0.08], r: 0.28, k: 0.14 },
    ], { ao: 0.4 });
    // a marble column with a gold band
    P('pillar', [
      { s: 'box', c: [0, 0.07, 0], hs: [0.3, 0.07, 0.3], rd: 0.02, col: marbleD, k: 0.01 },
      { s: 'cyl', ax: 'y', c: [0, 0.85, 0], r: 0.2, hh: 0.72, rd: 0.02, col: marble, k: 0.02 },
      ...Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * TAU; return { s: 'cyl', ax: 'y', c: [Math.cos(a) * 0.2, 0.85, Math.sin(a) * 0.2], r: 0.035, hh: 0.66, rd: 0.03, sub: true, k: 0.01 }; }),
      { s: 'box', c: [0, 1.62, 0], hs: [0.28, 0.06, 0.28], rd: 0.02, col: marbleD, k: 0.01 },
      { s: 'tor', ax: 'y', c: [0, 1.5, 0], R: 0.2, r: 0.03, a0: -Math.PI, a1: Math.PI, col: gold, k: 0 },
    ], { ao: 0.8 });
    // a rainbow arch you can walk under
    const bands = ['#ff4d5a', '#ff9a2e', '#ffe14a', '#5fe08a', '#4fb4ff', '#9a6bff'].map(C);
    P('rainbow', [
      ...bands.map((col, i) => ({ s: 'tor', ax: 'z', c: [0, 0, 0], R: 1.2 - i * 0.075, r: 0.04, a0: 0, a1: Math.PI, col, k: 0.005 })),
      { s: 'sph', c: [1.0, 0.05, 0], r: 0.26, col: C('#ffffff'), k: 0.08 }, { s: 'sph', c: [-1.0, 0.05, 0], r: 0.26, col: C('#ffffff'), k: 0.08 },
      { s: 'sph', c: [1.2, 0.12, 0.1], r: 0.2, col: C('#ffffff'), k: 0.08 }, { s: 'sph', c: [-1.18, 0.1, -0.1], r: 0.2, col: C('#ffffff'), k: 0.08 },
    ], { ao: 0.3 });
  }
  // ---------- Storm King (chapter 13 boss): a scowling thundercloud; the cloud takes the tint ----------
  {
    const white = C('#ffffff'), dark = C('#1c1c28'), bolt = C('#ffe14a');
    P('stormcloud', [
      { s: 'sph', c: [0, 0.55, 0], r: 0.5, k: 0.12 },
      { s: 'sph', c: [0.45, 0.45, 0.05], r: 0.38, k: 0.12 },
      { s: 'sph', c: [-0.45, 0.45, 0.0], r: 0.4, k: 0.12 },
      { s: 'sph', c: [0.2, 0.78, -0.15], r: 0.36, k: 0.12 },
      { s: 'sph', c: [-0.22, 0.8, -0.1], r: 0.34, k: 0.12 },
      { s: 'sph', c: [0.0, 0.42, -0.32], r: 0.36, k: 0.12 },
      { s: 'ell', c: [0, 0.3, 0], rr: [0.75, 0.16, 0.5], k: 0.1 },
      { s: 'ell', c: [0.2, 0.72, 0.38], rr: [0.15, 0.12, 0.08], col: white, k: 0 }, { s: 'ell', c: [-0.2, 0.72, 0.38], rr: [0.15, 0.12, 0.08], col: white, k: 0 },
      { s: 'sph', c: [0.17, 0.71, 0.45], r: 0.065, col: dark, k: 0 }, { s: 'sph', c: [-0.17, 0.71, 0.45], r: 0.065, col: dark, k: 0 },
      { s: 'cap', a: [0.38, 0.92, 0.33], b: [0.08, 0.8, 0.43], r: 0.05, col: dark, k: 0 }, { s: 'cap', a: [-0.38, 0.92, 0.33], b: [-0.08, 0.8, 0.43], r: 0.05, col: dark, k: 0 },
      { s: 'ell', c: [0, 0.47, 0.44], rr: [0.2, 0.07, 0.06], col: dark, k: 0 },
      { s: 'ell', c: [0, 0.5, 0.47], rr: [0.15, 0.025, 0.04], col: white, k: 0 },
      { s: 'cap', a: [0.5, 0.95, 0.1], b: [0.62, 0.78, 0.15], r: 0.035, col: bolt, k: 0 }, { s: 'cap', a: [0.62, 0.78, 0.15], b: [0.56, 0.8, 0.16], r: 0.03, col: bolt, k: 0 },
      { s: 'cap', a: [0.56, 0.8, 0.16], b: [0.7, 0.6, 0.2], r: 0.03, r2: 0.01, col: bolt, k: 0 },
    ], { ao: 0.5 });
  }
}
