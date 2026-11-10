// ============================================================
// Chapters 11-15: scenery and boss bodies, built with prop() like 04a-theme-models.js.
// Model units: 1 is about one hero leg. Parts without col take the instance tint.
// ============================================================
Object.assign(THEME_CLIPS, { pumpking: ['run', 'slam', 'idle', 'throw'] });
Object.assign(THEME_CELLS, { tombstone0: 0.025, tombstone1: 0.022, pumpkin: 0.018, fence: 0.016, gravetree: 0.016, pumpking: 0.014 });
MESH_ORDER.push('tombstone0', 'tombstone1', 'pumpkin', 'fence', 'gravetree', 'pumpking');

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
}
