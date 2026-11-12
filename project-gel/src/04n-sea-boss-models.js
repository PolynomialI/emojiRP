// ============================================================
// The ten sea bosses' vehicles (13n-sea-bosses.js). World scale, +z the bow, y = 0 the waterline. Each boss rides
// on top in a captain's coat (the pcapt model, tinted), except where the vehicle is the creature itself.
// ============================================================
const SEA_BOSS_MESHES = ['bflamingo', 'bclam', 'browboat', 'bspeed', 'bice', 'blava', 'bghost', 'bghost_rig', 'biron', 'bkraken', 'bflag', 'bflag_rig'];
for (const id of SEA_BOSS_MESHES) { THEME_CLIPS[id] = ['rock']; THEME_CELLS[id] = 0.045; }
Object.assign(THEME_CELLS, { bflamingo: 0.045, bclam: 0.04, browboat: 0.035, bspeed: 0.04, bkraken: 0.045 });
THEME_CLIPS.bkraken = ['wave'];
MESH_ORDER.push(...SEA_BOSS_MESHES);
// the kraken's tentacles curl and uncurl (bones 3-10, one per tentacle)
CLIPS.wave = { frames: 32, fn(t) {
  return { root: [0, 0.04 * Math.sin(t * TAU), 0], rot: Array.from({ length: NBONES }, (_, b) => (b >= 3 ? [0.35 * Math.sin(t * TAU + b * 0.9), 0, 0.2 * Math.cos(t * TAU + b * 1.3)] : [0, 0, 0])) };
} };

function seaBossModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => { const m = prop(defs, name, parts, o || { ao: 0.5 }); rig(m, { 0: [0, 0.3, 0] }); m.rockAmp = 0.012; return m; };
  const white = C('#fbf8f2'), dark = C('#1e2230'), gold = C('#e8b84a');
  // recolor a built ship's parts (the ghost ship and the flagship are the galleon, repainted)
  const repaint = (src, fn) => src.parts.map(p => ({ ...p, col: p.col ? fn(p.col) : p.col }));
  const lum = c => c[0] * 0.3 + c[1] * 0.55 + c[2] * 0.15;

  // 1. Captain Flamingo's giant inflatable flamingo: a fat pink ring, a long curved neck, a sunny beak
  {
    const pink = C('#ff7eb8'), pinkD = C('#e85a9a'), beak = C('#ffb02a');
    P('bflamingo', [
      { s: 'tor', ax: 'y', c: [0, 0.25, 0], R: 1.6, r: 0.62, a0: -Math.PI, a1: Math.PI, col: pink, k: 0 },
      { s: 'ell', c: [0, 0.15, -0.2], rr: [1.2, 0.3, 1.2], col: C('#ffe0ee'), k: 0.2 },
      { s: 'cap', a: [0, 0.6, 1.6], b: [0, 2.2, 2.0], r: 0.38, r2: 0.3, col: pink, k: 0.2 },
      { s: 'cap', a: [0, 2.2, 2.0], b: [0, 2.9, 1.6], r: 0.3, r2: 0.36, col: pink, k: 0.15 },
      { s: 'sph', c: [0, 3.0, 1.75], r: 0.48, col: pink, k: 0.1 },
      { s: 'cap', a: [0, 2.95, 2.1], b: [0, 2.55, 2.75], r: 0.18, r2: 0.08, col: beak, k: 0.05 },
      { s: 'cap', a: [0, 2.6, 2.6], b: [0, 2.45, 2.8], r: 0.09, r2: 0.04, col: dark, k: 0.03 },
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.3, 3.15, 1.98], r: 0.11, col: white, k: 0 })),
      ...[1, -1].map(sx => ({ s: 'sph', c: [sx * 0.33, 3.15, 2.06], r: 0.055, col: dark, k: 0 })),
      // tail feathers and two little wings
      { s: 'ell', c: [0, 0.8, -1.9], rr: [0.6, 0.35, 0.5], col: pinkD, k: 0.2 },
      ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 1.7, 0.7, -0.3], rr: [0.25, 0.4, 0.8], col: pinkD, k: 0.2 })),
      // a squirt cannon and a cooler on the seat
      { s: 'cap', a: [0.9, 0.85, 0.6], b: [0.9, 1.0, 1.5], r: 0.13, col: C('#35c4e8'), k: 0 },
      { s: 'box', c: [-0.8, 0.75, 0.4], hs: [0.3, 0.25, 0.25], rd: 0.06, col: C('#2fa8e0'), k: 0 },
    ]);
  }
  // 2. the Coral Queen's clam-shell boat: a ribbed pink shell, open, with a giant pearl
  {
    const shell = C('#ff9aa8'), shellD = C('#e86a80');
    const ribs = Array.from({ length: 9 }, (_, i) => { const a = -1.2 + i * 0.3; return { s: 'cap', a: [0, 0.2, -1.2], b: [Math.sin(a) * 2.0, 0.5, -1.2 + Math.cos(a) * 2.2], r: 0.16, col: shellD, k: 0.08 }; });
    P('bclam', [
      { s: 'ell', c: [0, 0.2, 0], rr: [2.1, 0.7, 2.2], col: shell, k: 0 }, { s: 'box', c: [0, 2.6, 0], hs: [3, 2.2, 3], sub: true, k: 0 },
      { s: 'ell', c: [0, 0.45, 0.1], rr: [1.85, 0.55, 1.95], sub: true, k: 0 },
      ...ribs,
      // the upper shell, tipped open behind
      { s: 'ell', c: [0, 1.3, -1.6], rr: [2.0, 1.6, 0.45], col: shell, k: 0 },
      ...Array.from({ length: 7 }, (_, i) => { const a = -1.0 + i * 0.33; return { s: 'cap', a: [0, 0.3, -1.65], b: [Math.sin(a) * 1.85, 0.3 + Math.cos(a) * 1.9, -1.75], r: 0.13, col: shellD, k: 0.06 }; }),
      { s: 'sph', c: [0.9, 0.6, 0.7], r: 0.48, col: C('#fff4f8'), k: 0 },
      ...[[-1.2, 0.8], [1.4, -0.4], [-0.6, 1.4]].map(([x, z]) => ({ s: 'cap', a: [x, 0.3, z], b: [x * 1.05, 1.0, z * 1.05], r: 0.12, r2: 0.06, col: C('#ff7a3a'), k: 0.05 })),
    ]);
  }
  // 3. Kelpbeard's rowboat: an old green-stained boat draped in kelp, two big oars
  {
    const hull = C('#5a7a4a'), kelp = C('#4a8a3a');
    P('browboat', [
      { s: 'ell', c: [0, 0.55, 0], rr: [1.2, 0.85, 2.8], col: hull, k: 0 }, { s: 'box', c: [0, 3.0, 0], hs: [3, 2.4, 4], sub: true, k: 0 },
      { s: 'ell', c: [0, 0.62, 0], rr: [1.05, 0.55, 2.62], sub: true, k: 0 },
      { s: 'box', c: [0, 0.2, 0], hs: [0.9, 0.04, 2.0], rd: 0.03, col: C('#7a5a3a'), k: 0 },
      ...[-1.0, 0.0, 1.0].map(z => ({ s: 'box', c: [0, 0.45, z], hs: [1.0, 0.05, 0.16], rd: 0.03, col: C('#8a6a44'), k: 0 })),
      ...[1, -1].flatMap(sx => [{ s: 'cap', a: [sx * 0.9, 0.62, 0.3], b: [sx * 2.6, 0.0, 0.0], r: 0.07, col: C('#8a6a44'), k: 0 }, { s: 'ell', c: [sx * 2.75, 0.0, -0.05], rr: [0.35, 0.05, 0.18], col: C('#8a6a44'), k: 0.05 }]),
      ...[[1.1, 1.2], [-1.15, -0.6], [1.0, -1.8], [-1.1, 1.6]].map(([x, z]) => ({ s: 'cap', a: [x, 0.62, z], b: [x * 1.15, -0.1, z + 0.2], r: 0.12, r2: 0.06, col: kelp, k: 0.06 })),
      { s: 'cap', a: [0, 0.5, 2.6], b: [0, 1.05, 3.0], r: 0.12, col: hull, k: 0.05 },
    ]);
  }
  // 4. the Smuggler King's speedboat: a sleek red hull with a white flash, a windshield and twin motors
  {
    const red = C('#d8323c');
    P('bspeed', [
      { s: 'ell', c: [0, 0.6, -0.3], rr: [1.1, 0.75, 2.8], col: red, k: 0 }, { s: 'ell', c: [0, 0.6, 1.2], rr: [0.7, 0.72, 2.1], col: red, k: 0.4 },
      { s: 'box', c: [0, 3.0, 0], hs: [3, 2.4, 4], sub: true, k: 0 },
      { s: 'ell', c: [0, 0.6, -0.3], rr: [0.98, 0.04, 2.65], col: C('#f4ecdc'), k: 0 },
      { s: 'ell', c: [0, 0.4, -0.3], rr: [1.105, 0.08, 2.81], col: white, k: 0 },
      { s: 'box', c: [0, 0.9, 0.9], hs: [0.85, 0.3, 0.06], rd: 0.05, col: C('#9fe6ff'), k: 0 },
      ...[0.4, -0.4].flatMap(x => [{ s: 'box', c: [x, 0.75, -3.1], hs: [0.2, 0.3, 0.22], rd: 0.08, col: dark, k: 0 }]),
      ...[[0.4, -1.4], [-0.45, -0.8], [0.3, -0.2]].map(([x, z]) => ({ s: 'box', c: [x, 0.85, z], hs: [0.28, 0.24, 0.28], rd: 0.04, col: C('#b07a45'), k: 0 })),
    ]);
  }
  // 5. Admiral Frost's icebreaker: a navy hull with an ice-blue ram bow, a white bridge and a red funnel
  {
    P('bice', [
      { s: 'ell', c: [0, 1.0, -0.4], rr: [1.6, 1.2, 3.8], col: C('#1d3a6e'), k: 0 }, { s: 'ell', c: [0, 1.0, 1.4], rr: [1.15, 1.15, 2.9], col: C('#1d3a6e'), k: 0.5 },
      { s: 'box', c: [0, 3.5, 0], hs: [3, 2.5, 5], sub: true, k: 0 },
      { s: 'ell', c: [0, 1.0, -0.4], rr: [1.52, 0.04, 3.7], col: C('#d8e0e8'), k: 0 },
      { s: 'cap', a: [0, 0.3, 3.4], b: [0, 1.0, 4.3], r: 0.5, r2: 0.2, col: C('#9fe6ff'), k: 0.2 },
      { s: 'box', c: [0, 1.65, -1.2], hs: [1.1, 0.6, 1.2], rd: 0.12, col: white, k: 0 },
      { s: 'box', c: [0, 1.95, -0.1], hs: [1.12, 0.15, 0.05], rd: 0.03, col: dark, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 2.7, -2.0], r: 0.4, hh: 0.5, rd: 0.1, col: C('#d8323c'), k: 0 },
      ...[[1.1, 2.3], [-1.0, 3.0], [0.4, -3.3]].map(([x, z]) => ({ s: 'crag', c: [x * 1.25, 0.2, z], r: 0.5, seed: 31 + x * 7, n: 8, col: C('#d8f2ff'), k: 0.05 })),
    ]);
  }
  // 6. the Magma Mariner's lava-rock galleon: black stone with glowing orange cracks and a smoking stack
  {
    const rock = C('#2e282c'), lava = C('#ff6a1a');
    P('blava', [
      { s: 'ell', c: [0, 0.9, -0.3], rr: [1.4, 1.1, 3.4], col: rock, k: 0 }, { s: 'ell', c: [0, 0.9, 1.3], rr: [1.0, 1.05, 2.5], col: rock, k: 0.4 },
      { s: 'box', c: [0, 3.4, 0], hs: [3, 2.5, 5], sub: true, k: 0 },
      ...[0.5, 0.3].map(y => ({ s: 'ell', c: [0, y, -0.3], rr: [1.4 * Math.sqrt(1 - ((y - 0.9) / 1.1) ** 2) + 0.02, 0.05, 3.4 * Math.sqrt(1 - ((y - 0.9) / 1.1) ** 2) + 0.02], col: lava, k: 0 })),
      { s: 'ell', c: [0, 0.9, -0.3], rr: [1.3, 0.05, 3.25], col: C('#4a3a3a'), k: 0 },
      { s: 'crag', c: [0, 1.4, -2.2], r: 0.9, seed: 41, n: 9, col: rock, sc: [1.2, 0.8, 1], k: 0.1 },
      { s: 'cap', a: [0, 0.9, 0.3], b: [0, 3.0, 0.3], r: 0.35, r2: 0.25, col: rock, k: 0.1 },
      { s: 'cyl', ax: 'y', c: [0, 3.0, 0.3], r: 0.22, hh: 0.1, rd: 0.03, col: lava, k: 0 },
      ...[[0.7, 1.6], [-0.7, 0.9], [0.6, -1.0]].map(([x, z]) => ({ s: 'sph', c: [x, 1.0, z], r: 0.18, col: lava, k: 0 })),
    ]);
  }
  // 7. the Phantom Captain's ghost ship and 10. the Pirate King's flagship: the galleon, repainted
  const G0 = defs.galleon, G1 = defs.galleon_rig;
  const ghost = c => { const l = lum(c); return [0.45 + 0.4 * l, 0.75 + 0.25 * l, 0.8 + 0.2 * l]; };
  const royal = c => { const l = lum(c); return l < 0.2 ? [0.42, 0.06, 0.1] : l < 0.45 ? [0.7, 0.12, 0.16] : [1.0, 0.8, 0.32]; };
  for (const [name, fn] of [['bghost', ghost], ['bflag', royal]]) {
    const a = P(name, repaint(G0, fn).map(p => ({ ...p })), { ao: 0.5 }), b = P(name + '_rig', repaint(G1, name === 'bflag' ? c => (lum(c) < 0.3 ? [0.75, 0.1, 0.14] : royal(c)) : ghost).map(p => ({ ...p })), { ao: 0.4 });
    a.bones = G0.bones.map(x => ({ ...x })); b.bones = G1.bones.map(x => ({ ...x }));
  }
  // 8. the Thunder Admiral's ironclad: grey armor plates, a big turret, a tall stack with a lightning rod
  {
    const iron = C('#6a7484'), ironD = C('#4a5262');
    P('biron', [
      { s: 'ell', c: [0, 0.8, -0.2], rr: [1.7, 1.0, 3.9], col: ironD, k: 0 }, { s: 'ell', c: [0, 0.8, 1.6], rr: [1.2, 0.95, 2.8], col: ironD, k: 0.5 },
      { s: 'box', c: [0, 3.3, 0], hs: [3, 2.5, 5], sub: true, k: 0 },
      { s: 'ell', c: [0, 0.8, -0.2], rr: [1.6, 0.04, 3.8], col: iron, k: 0 },
      { s: 'box', c: [0, 1.25, -0.8], hs: [1.2, 0.45, 1.6], rd: 0.2, col: iron, k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 1.35, 1.6], r: 0.75, hh: 0.3, rd: 0.12, col: iron, k: 0 },
      ...[0.25, -0.25].map(x => ({ s: 'cap', a: [x, 1.4, 1.9], b: [x, 1.45, 3.2], r: 0.13, col: dark, k: 0 })),
      { s: 'cyl', ax: 'y', c: [0, 2.4, -1.2], r: 0.38, hh: 0.8, rd: 0.08, col: dark, k: 0 },
      { s: 'cap', a: [0, 3.2, -1.2], b: [0, 4.2, -1.2], r: 0.05, col: C('#c8d0da'), k: 0 }, { s: 'sph', c: [0, 4.3, -1.2], r: 0.14, col: C('#ffe86a'), k: 0 },
      ...[-1, 1].flatMap(sx => [-2.2, -1.0, 0.2, 1.4].map(z => ({ s: 'sph', c: [sx * 1.62 * Math.sqrt(Math.max(0, 1 - ((z + 0.2) / 3.9) ** 2)), 0.75, z], r: 0.07, col: C('#c8d0da'), k: 0 }))),
    ]);
  }
  // 9. the Kraken: a great purple head with big eyes and eight tentacles (bones 3-10), the rider on top
  {
    const pur = C('#8a4ab8'), purL = C('#c890f0'), suck = C('#f0c8ff');
    const parts = [
      { s: 'ell', c: [0, 0.4, 0], rr: [2.0, 1.4, 1.9], col: pur, k: 0 },
      { s: 'ell', c: [0, 1.5, -0.4], rr: [1.4, 1.2, 1.3], col: pur, k: 0.5 },
      ...[1, -1].flatMap(sx => [{ s: 'sph', c: [sx * 0.85, 1.0, 1.55], r: 0.42, col: white, k: 0 }, { s: 'sph', c: [sx * 0.85, 1.0, 1.9], r: 0.2, col: dark, k: 0 }]),
      { s: 'ell', c: [0, 0.35, 1.75], rr: [0.6, 0.12, 0.18], col: C('#5a1a40'), k: 0.03 },
      ...Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return { s: 'sph', c: [Math.cos(a) * 1.2, 1.6 + Math.sin(a) * 0.3, -0.4 + Math.sin(a) * 1.0], r: 0.14, col: purL, k: 0 }; }),
    ];
    const piv = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + 0.2, bx = Math.cos(a) * 1.7, bz = Math.sin(a) * 1.6, b = 3 + i, ex = Math.cos(a) * 4.0, ez = Math.sin(a) * 3.8;
      piv.push([b, [bx, 0.1, bz]]);
      parts.push({ s: 'cap', a: [bx, 0.1, bz], b: [(bx + ex) / 2, 0.6, (bz + ez) / 2], r: 0.42, r2: 0.3, col: pur, bone: b, k: 0.15 });
      parts.push({ s: 'cap', a: [(bx + ex) / 2, 0.6, (bz + ez) / 2], b: [ex, 1.4, ez], r: 0.3, r2: 0.1, col: pur, bone: b, k: 0.1 });
      parts.push({ s: 'sph', c: [(bx + ex) / 2, 0.42, (bz + ez) / 2], r: 0.12, col: suck, bone: b, k: 0 });
    }
    const m = P('bkraken', parts);
    for (const [b, p] of piv) m.bones[b].p = p;
  }
}
