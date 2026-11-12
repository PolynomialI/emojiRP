// ============================================================
// The nine ships after the raft (see SHIPS in 13k-ocean.js), at world scale: +z the bow, y = 0 the waterline.
// Each has a hull mesh (rocking clip), three pieces it breaks into when it sinks (carved from the same parts),
// and the tall pirate ships keep their masts and sails in a separate rig mesh, so it can fade while it stands
// between the camera and the blob.
// ============================================================
const SHIP_IDS = ['canoe', 'sloop', 'galleon', 'yacht', 'cruise', 'cargo', 'battleship', 'carrier', 'ark'];
const SHIP_RIGS = ['sloop', 'galleon', 'ark'];
const SHIP_CELL = { canoe: 0.026, sloop: 0.036, galleon: 0.042, yacht: 0.05, cruise: 0.062, cargo: 0.068, battleship: 0.072, carrier: 0.08, ark: 0.078 };
for (const id of SHIP_IDS) {
  THEME_CLIPS[id] = ['rock'];
  THEME_CELLS[id] = SHIP_CELL[id];
  for (let i = 0; i < 3; i++) { THEME_CLIPS[id + '_p' + i] = ['tilt']; THEME_CELLS[id + '_p' + i] = SHIP_CELL[id] * 1.45; }
}
for (const id of SHIP_RIGS) { THEME_CLIPS[id + '_rig'] = ['rock', 'tilt']; THEME_CELLS[id + '_rig'] = SHIP_CELL[id] * 0.85; }
const SHIP_MESHES = SHIP_IDS.flatMap(id => [id, ...(SHIP_RIGS.includes(id) ? [id + '_rig'] : [])]);
const SHIP_PIECES = SHIP_IDS.flatMap(id => [0, 1, 2].map(i => id + '_p' + i));
MESH_ORDER.push(...SHIP_MESHES);

function shipModels(defs) {
  const C = hexToRgb;
  // a ship: its parts, rocked about its middle (the bigger it is, the less it rocks); and three pieces split
  // across the keel at z0 and z1, each pivoting about its own middle
  const ship = (name, parts, len, z0, z1, o = {}) => {
    const m = prop(defs, name, parts, { ao: o.ao || 0.5 });
    rig(m, { 0: [0, o.piv || 0.3, 0] }); m.rockAmp = 0.1 / len;
    const big = 50, top = 12;
    const cut = (zA, zB) => ({ s: 'box', c: [0, 0, (zA + zB) / 2], hs: [big, top, Math.abs(zB - zA) / 2], sub: true, k: 0 });
    const L = len;
    const ranges = [[-L, z0], [z0, z1], [z1, L]];
    ranges.forEach(([a, b], i) => {
      const keep = parts.concat(ranges.filter((_, j) => j !== i).map(([c, d]) => cut(c, d)));
      const p = prop(defs, name + '_p' + i, keep, { ao: o.ao || 0.5 });
      rig(p, { 0: [0, o.piv || 0.3, (a + b) / 2] });
    });
    return m;
  };
  const rigMesh = (name, parts, len) => { const m = prop(defs, name, parts, { ao: 0.4 }); rig(m, { 0: [0, 0.3, 0] }); m.rockAmp = 0.1 / len; return m; };
  // a hull: a long half egg below the rail with the bow drawn out narrower, cut flat at the rail (top), a deck
  // plate a touch above the cut, and optional bands of color along the sides
  const hull = o => {
    const W = o.wid / 2, L = o.len / 2, H = o.top - o.bot;
    const p = [
      { s: 'ell', c: [0, o.top, -L * 0.1], rr: [W, H, L * 0.9], col: o.col, k: 0 },
      { s: 'ell', c: [0, o.top, L * 0.32], rr: [W * 0.74, H * 0.96, L * 0.68], col: o.col, k: W * 0.45 },
      // (each band follows the hull's curve at its height, a hair proud of it)
      ...(o.bands || []).flatMap(([y, h, col]) => { const f = Math.sqrt(Math.max(0, 1 - ((y - o.top) / H) ** 2)), f2 = Math.sqrt(Math.max(0, 1 - ((y - o.top) / (H * 0.96)) ** 2)); return [
        { s: 'ell', c: [0, y, -L * 0.1], rr: [W * f + 0.015, h, L * 0.9 * f + 0.015], col, k: 0 },
        { s: 'ell', c: [0, y, L * 0.32], rr: [W * 0.74 * f2 + 0.015, h, L * 0.68 * f2 + 0.015], col, k: 0 }]; }),
      { s: 'box', c: [0, o.top + 3, 0], hs: [W + 2, 3, L + 2], sub: true, k: 0 },
      { s: 'ell', c: [0, o.top, -L * 0.1], rr: [W - 0.06, 0.035, L * 0.9 - 0.06], col: o.deck, k: 0 },
      // (no blend: thin flat shapes have a poor distance estimate off their plane, and a blend smears them out wide)
      { s: 'ell', c: [0, o.top, L * 0.32], rr: [W * 0.74 - 0.06, 0.035, L * 0.68 - 0.06], col: o.deck, k: 0 },
    ];
    return p;
  };
  // points round the hull's outline at the rail (for rails, ports and lights)
  const outline = (o, n) => {
    const W = o.wid / 2, L = o.len / 2, pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      // the stern egg and the narrower bow egg, whichever reaches further out along this direction
      const r1 = 1 / Math.hypot(sa / W, (ca - 0) / (L * 0.9)), z1 = -L * 0.1;
      let x = sa * r1, z = z1 + ca * r1;
      if (ca > 0) { const t = clamp((z - L * 0.2) / (L * 0.8), 0, 1); x *= 1 - 0.55 * t * t; z = Math.min(z + t * L * 0.22, L); }
      pts.push([x * 0.97, z * 0.99]);
    }
    return pts;
  };
  const rail = (o, y, h, r, col, posts = true) => {
    const pts = outline(o, 28), p = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      p.push({ s: 'cap', a: [a[0], y + h, a[1]], b: [b[0], y + h, b[1]], r, col, k: 0 });
      if (posts && i % 2 === 0) p.push({ s: 'cap', a: [a[0], y, a[1]], b: [a[0], y + h, a[1]], r: r * 0.8, col, k: 0 });
    }
    return p;
  };
  const wood = C('#a8693a'), woodD = C('#6e4426'), woodL = C('#d6a468'), rope = C('#e2c98f'), white = C('#fbf8f2'), cream = C('#f4ead2');
  const gold = C('#e8b84a'), glowY = C('#ffd36a'), dark = C('#1e2230'), red = C('#d8323c');

  // ---------- the canoe: a dugout painted rust red with cream dots, an outrigger float, a paddle and snacks ----------
  {
    const hc = C('#c0582e'), inside = C('#d89a5a');
    const p = [
      { s: 'ell', c: [0, 0.36, 0], rr: [0.52, 0.56, 1.9], col: hc, k: 0 },
      { s: 'box', c: [0, 2.38, 0], hs: [2, 2, 3], sub: true, k: 0 },
      { s: 'ell', c: [0, 0.38, 0], rr: [0.43, 0.29, 1.78], sub: true, k: 0 },
      { s: 'box', c: [0, 0.1, 0], hs: [0.36, 0.025, 1.35], rd: 0.02, col: inside, k: 0 },
      // the upturned ends
      { s: 'cap', a: [0, 0.3, 1.72], b: [0, 0.6, 2.02], r: 0.08, r2: 0.05, col: hc, k: 0.04 },
      { s: 'cap', a: [0, 0.3, -1.72], b: [0, 0.6, -2.02], r: 0.08, r2: 0.05, col: hc, k: 0.04 },
      { s: 'sph', c: [0, 0.62, 2.04], r: 0.06, col: cream, k: 0 }, { s: 'sph', c: [0, 0.62, -2.04], r: 0.06, col: cream, k: 0 },
      // cream dots along both sides
      ...[-1, 1].flatMap(sx => Array.from({ length: 7 }, (_, i) => { const z = -1.2 + i * 0.4, w = 0.52 * Math.sqrt(Math.max(0, 1 - (z / 1.9) ** 2)); return { s: 'sph', c: [sx * (w - 0.01), 0.27, z], r: 0.045, col: cream, k: 0 }; })),
      // the outrigger: two booms out to a float log, lashed
      ...[0.75, -0.75].flatMap(z => [
        { s: 'cap', a: [0.3, 0.42, z], b: [1.3, 0.3, z], r: 0.045, col: woodD, k: 0 },
        { s: 'tor', ax: 'x', c: [1.3, 0.2, z], R: 0.1, r: 0.02, a0: -Math.PI, a1: Math.PI, col: rope, k: 0 },
      ]),
      { s: 'cap', a: [1.32, 0.12, -1.15], b: [1.32, 0.12, 1.15], r: 0.11, col: wood, k: 0 },
      { s: 'cap', a: [1.32, 0.12, 1.15], b: [1.32, 0.2, 1.38], r: 0.09, r2: 0.04, col: wood, k: 0.03 },
      // a paddle across the stern, a coconut and bananas in the bow
      { s: 'cap', a: [-0.55, 0.42, -1.2], b: [0.45, 0.42, -1.05], r: 0.03, col: woodD, k: 0 },
      { s: 'ell', c: [-0.68, 0.41, -1.22], rr: [0.18, 0.025, 0.1], col: woodL, k: 0.02 },
      { s: 'sph', c: [0.12, 0.2, 1.3], r: 0.1, col: C('#7a4a26'), k: 0 },
      ...[0, 1, 2].map(i => ({ s: 'cap', a: [-0.12 + i * 0.05, 0.16, 1.15], b: [-0.2 + i * 0.07, 0.24, 1.38], r: 0.035, col: C('#ffd84a'), k: 0.02 })),
    ];
    ship('canoe', p, 2.1, -0.6, 0.6, { piv: 0.2 });
  }

  // ---------- the pirate sloop: a warm brown hull with a yellow band, gun ports, a little stern castle with lit
  // windows and a lantern, a bowsprit; one mast with a square sail and the goo flag (rig mesh) ----------
  {
    const o = { len: 5.6, wid: 2.1, top: 0.62, bot: -0.25, col: C('#8a5530'), deck: C('#d8a868'), bands: [[0.48, 0.06, C('#f0c040')], [0.22, 0.05, C('#5a3420')]] };
    const p = [
      ...hull(o),
      ...rail(o, 0.62, 0.2, 0.045, C('#5e3a20')),
      // the stern castle
      { s: 'box', c: [0, 0.98, -2.15], hs: [0.82, 0.36, 0.42], rd: 0.08, col: C('#9a6038'), k: 0 },
      { s: 'box', c: [0, 1.36, -2.15], hs: [0.86, 0.04, 0.46], rd: 0.02, col: C('#5e3a20'), k: 0 },
      ...[-0.45, 0, 0.45].map(x => ({ s: 'box', c: [x, 1.0, -2.57], hs: [0.11, 0.12, 0.02], rd: 0.02, col: glowY, k: 0 })),
      { s: 'cap', a: [0.7, 1.36, -2.45], b: [0.7, 1.7, -2.45], r: 0.03, col: dark, k: 0 },
      { s: 'sph', c: [0.7, 1.75, -2.45], r: 0.08, col: glowY, k: 0 },
      // gun ports
      ...[-1, 1].flatMap(sx => [-0.9, 0.2, 1.3].map(z => { const w = 1.05 * Math.sqrt(Math.max(0, 1 - ((z + 0.28) / 2.52) ** 2)); return { s: 'box', c: [sx * (w - 0.02), 0.4, z], hs: [0.04, 0.08, 0.1], rd: 0.02, col: dark, k: 0 }; })),
      // the bowsprit
      { s: 'cap', a: [0, 0.72, 2.5], b: [0, 1.15, 3.35], r: 0.07, r2: 0.04, col: C('#5e3a20'), k: 0 },
      // barrels and a coil of rope on deck
      ...[[0.62, 1.4], [0.62, 1.05], [-0.6, 1.25]].map(([x, z]) => ({ s: 'cyl', ax: 'y', c: [x, 0.8, z], r: 0.16, hh: 0.18, rd: 0.05, col: C('#9a6a3a'), k: 0 })),
      ...[[0.62, 1.4], [0.62, 1.05], [-0.6, 1.25]].map(([x, z]) => ({ s: 'tor', ax: 'y', c: [x, 0.84, z], R: 0.16, r: 0.018, a0: -Math.PI, a1: Math.PI, col: C('#4a3a30'), k: 0 })),
      { s: 'tor', ax: 'y', c: [-0.55, 0.66, -0.4], R: 0.16, r: 0.05, a0: -Math.PI, a1: Math.PI, col: rope, k: 0 },
    ];
    ship('sloop', p, 2.8, -0.9, 1.0, { piv: 0.4 });
    const sail = C('#f4e8cc'), sailB = C('#d8323c');
    rigMesh('sloop_rig', [
      { s: 'cap', a: [0, 0.6, 0.6], b: [0, 3.7, 0.6], r: 0.085, r2: 0.06, col: C('#6e4426'), k: 0 },
      { s: 'cap', a: [-1.15, 3.05, 0.62], b: [1.15, 3.05, 0.62], r: 0.045, col: C('#6e4426'), k: 0 },
      { s: 'cap', a: [-1.0, 1.45, 0.62], b: [1.0, 1.45, 0.62], r: 0.045, col: C('#6e4426'), k: 0 },
      // the sail: a shell bulging forward, with a red band
      { s: 'ell', c: [0, 2.25, 0.62], rr: [1.08, 0.82, 0.3], col: sail, k: 0 },
      { s: 'ell', c: [0, 2.25, 0.57], rr: [1.08, 0.82, 0.27], sub: true, k: 0 },
      { s: 'box', c: [0, 2.25, 0.4], hs: [2, 2, 0.3], sub: true, k: 0 },
      { s: 'ell', c: [0, 2.0, 0.63], rr: [1.09, 0.14, 0.31], col: sailB, k: 0 },
      { s: 'ell', c: [0, 2.0, 0.58], rr: [1.09, 0.2, 0.275], sub: true, k: 0 },
      { s: 'box', c: [0, 2.0, 0.4], hs: [2, 0.4, 0.3], sub: true, k: 0 },
      // the crow's nest and the flag: black with a goo-blob skull
      { s: 'cyl', ax: 'y', c: [0, 3.3, 0.6], r: 0.22, hh: 0.1, rd: 0.03, col: C('#8a5530'), k: 0 },
      { s: 'cyl', ax: 'y', c: [0, 3.36, 0.6], r: 0.17, hh: 0.1, rd: 0.02, sub: true, k: 0 },
      { s: 'box', c: [0, 3.95, 0.25], hs: [0.02, 0.2, 0.32], rd: 0.01, col: dark, k: 0 },
      { s: 'sph', c: [0.025, 3.98, 0.25], r: 0.09, col: C('#4ad8ff'), k: 0 },
      // stays to the bow and stern
      { s: 'cap', a: [0, 3.6, 0.6], b: [0, 1.15, 3.3], r: 0.032, col: rope, k: 0 },
      { s: 'cap', a: [0, 3.6, 0.6], b: [0, 1.36, -2.5], r: 0.032, col: rope, k: 0 },
    ], 2.8);
  }

  // ---------- the black galleon: dark timbers with red and gold trim, a two-tier stern castle glowing orange,
  // a row of cannon muzzles each side; two masts with tattered black sails and a skull (rig mesh) ----------
  {
    const o = { len: 7.6, wid: 2.7, top: 0.85, bot: -0.3, col: C('#3e2a22'), deck: C('#6e5038'), bands: [[0.68, 0.06, C('#e0b048')], [0.5, 0.07, C('#a8242c')]] };
    const p = [
      ...hull(o),
      ...rail(o, 0.85, 0.24, 0.055, C('#2a1c16')),
      { s: 'box', c: [0, 1.35, -2.95], hs: [1.1, 0.5, 0.65], rd: 0.1, col: C('#4a3228'), k: 0 },
      { s: 'box', c: [0, 1.98, -3.15], hs: [0.9, 0.18, 0.45], rd: 0.08, col: C('#4a3228'), k: 0 },
      { s: 'box', c: [0, 1.86, -2.95], hs: [1.14, 0.04, 0.68], rd: 0.02, col: gold, k: 0 },
      ...[-0.6, 0, 0.6].map(x => ({ s: 'box', c: [x, 1.35, -3.61], hs: [0.15, 0.17, 0.02], rd: 0.03, col: C('#ff9a3a'), k: 0 })),
      ...[-0.35, 0.35].map(x => ({ s: 'box', c: [x, 2.0, -3.61], hs: [0.12, 0.09, 0.02], rd: 0.02, col: C('#ff9a3a'), k: 0 })),
      ...[-0.95, 0.95].flatMap(x => [{ s: 'cap', a: [x, 1.9, -3.5], b: [x, 2.35, -3.5], r: 0.035, col: dark, k: 0 }, { s: 'sph', c: [x, 2.42, -3.5], r: 0.1, col: C('#ffb04a'), k: 0 }]),
      // cannon muzzles out of the ports
      ...[-1, 1].flatMap(sx => [-1.6, -0.6, 0.4, 1.4, 2.3].map(z => { const w = 1.35 * Math.sqrt(Math.max(0, 1 - ((z + 0.38) / 3.42) ** 2)); return [
        { s: 'box', c: [sx * (w - 0.03), 0.55, z], hs: [0.05, 0.1, 0.13], rd: 0.02, col: dark, k: 0 },
        { s: 'cap', a: [sx * (w - 0.06), 0.55, z], b: [sx * (w + 0.14), 0.55, z], r: 0.055, col: C('#22252c'), k: 0 }]; }).flat()),
      { s: 'cap', a: [0, 0.95, 3.4], b: [0, 1.45, 4.5], r: 0.09, r2: 0.05, col: C('#2a1c16'), k: 0 },
      // a big lantern at the bow
      { s: 'cap', a: [0, 0.85, 3.1], b: [0, 1.4, 3.1], r: 0.035, col: dark, k: 0 }, { s: 'sph', c: [0, 1.46, 3.1], r: 0.11, col: C('#ffb04a'), k: 0 },
    ];
    ship('galleon', p, 3.8, -1.3, 1.2, { piv: 0.5 });
    const sail = C('#2c2832'), mastC = C('#2a1c16');
    const tatter = (x, y, z) => ({ s: 'sph', c: [x, y, z], r: 0.16, sub: true, k: 0.03 });
    const sq = (z, y, w, h, flag) => [
      { s: 'cap', a: [-w - 0.1, y + h + 0.1, z], b: [w + 0.1, y + h + 0.1, z], r: 0.05, col: mastC, k: 0 },
      { s: 'ell', c: [0, y, z], rr: [w, h, 0.32], col: sail, k: 0 },
      { s: 'ell', c: [0, y, z - 0.05], rr: [w, h, 0.29], sub: true, k: 0 },
      { s: 'box', c: [0, y, z - 0.3], hs: [3, 3, 0.3], sub: true, k: 0 },
      tatter(-w * 0.5, y - h * 0.95, z + 0.2), tatter(w * 0.35, y - h * 0.97, z + 0.2), tatter(w * 0.85, y - h * 0.6, z + 0.15),
      ...(flag ? [{ s: 'sph', c: [0, y + 0.08, z + 0.3], r: 0.26, col: cream, k: 0 }, ...[-0.09, 0.09].map(x => ({ s: 'sph', c: [x, y + 0.12, z + 0.5], r: 0.065, col: dark, k: 0 })),
        { s: 'cap', a: [-0.32, y - 0.32, z + 0.3], b: [0.32, y - 0.12, z + 0.3], r: 0.05, col: cream, k: 0 }, { s: 'cap', a: [0.32, y - 0.32, z + 0.3], b: [-0.32, y - 0.12, z + 0.3], r: 0.05, col: cream, k: 0 }] : []),
    ];
    rigMesh('galleon_rig', [
      { s: 'cap', a: [0, 0.8, 1.7], b: [0, 4.2, 1.7], r: 0.1, r2: 0.07, col: mastC, k: 0 },
      { s: 'cap', a: [0, 0.8, -0.6], b: [0, 5.0, -0.6], r: 0.12, r2: 0.08, col: mastC, k: 0 },
      ...sq(1.7, 2.6, 1.15, 0.85, false),
      ...sq(-0.6, 3.1, 1.4, 1.1, true),
      { s: 'cyl', ax: 'y', c: [0, 4.45, -0.6], r: 0.26, hh: 0.1, rd: 0.03, col: C('#3e2a22'), k: 0 },
      { s: 'box', c: [0.0, 5.25, -0.95], hs: [0.02, 0.15, 0.36], rd: 0.01, col: C('#a8242c'), k: 0 },
      { s: 'cap', a: [0, 4.9, -0.6], b: [0, 1.45, 4.4], r: 0.036, col: rope, k: 0 },
      { s: 'cap', a: [0, 4.9, -0.6], b: [0, 2.15, -3.4], r: 0.036, col: rope, k: 0 },
    ], 3.8);
  }

  // ---------- the yacht: a sleek white hull with navy and gold pinstripes, a teak deck, a cabin with a wraparound
  // band of tinted glass, a flybridge under a radar arch, and a white sunbathing pad on the bow ----------
  {
    const o = { len: 9.4, wid: 3.0, top: 1.0, bot: -0.3, col: white, deck: C('#c99a62'), bands: [[0.55, 0.12, C('#1d3a6e')], [0.82, 0.025, gold]] };
    const steel = C('#d8e0e8');
    const p = [
      ...hull(o),
      ...rail(o, 1.0, 0.3, 0.055, steel, false),
      { s: 'box', c: [0, 1.45, -1.3], hs: [1.15, 0.45, 2.1], rd: 0.35, col: white, k: 0 },
      { s: 'box', c: [0, 1.55, -1.3], hs: [1.17, 0.15, 1.95], rd: 0.14, col: C('#1a2638'), k: 0 },
      { s: 'box', c: [0, 2.05, -1.8], hs: [0.9, 0.16, 1.2], rd: 0.12, col: white, k: 0 },
      { s: 'box', c: [0, 2.3, -0.8], hs: [0.75, 0.12, 0.05], rd: 0.04, col: C('#1a2638'), k: 0 },
      { s: 'tor', ax: 'z', c: [0, 2.15, -2.45], R: 0.85, r: 0.07, a0: 0.15, a1: Math.PI - 0.15, col: white, k: 0 },
      { s: 'sph', c: [0, 3.02, -2.45], r: 0.16, col: white, k: 0 },
      // the sunbathing pad with two navy pillows
      { s: 'box', c: [0, 1.1, 2.3], hs: [0.82, 0.09, 1.15], rd: 0.08, col: C('#fdfdfd'), k: 0 },
      ...[-0.4, 0.4].map(x => ({ s: 'ell', c: [x, 1.22, 1.35], rr: [0.3, 0.09, 0.16], col: C('#1d3a6e'), k: 0.02 })),
      // the swim platform and a life ring
      { s: 'box', c: [0, 0.42, -4.45], hs: [1.1, 0.06, 0.32], rd: 0.04, col: C('#c99a62'), k: 0 },
      ...Array.from({ length: 6 }, (_, i) => ({ s: 'tor', ax: 'z', c: [0, 1.45, -3.42], R: 0.24, r: 0.07, a0: (i / 6) * TAU - Math.PI, a1: ((i + 1) / 6) * TAU - Math.PI + 0.03, col: i % 2 ? white : C('#ff6a2a'), k: 0 })),
    ];
    ship('yacht', p, 4.7, -1.6, 1.6, { piv: 0.6 });
  }

  // ---------- the cruise ship: a tall white hull with a navy waterline and rows of portholes, two decks of cabins
  // with blue window bands and orange lifeboats, a sun deck with a pool and loungers, a red funnel ----------
  {
    const o = { len: 12, wid: 3.6, top: 1.3, bot: -0.3, col: white, deck: C('#e8eef4'), bands: [[0.2, 0.22, C('#1d3a6e')], [0.55, 0.035, C('#2fa8e0')]] };
    const win = C('#2a4a7a'), boat = C('#ff8a2a');
    const p = [
      ...hull(o),
      ...[-1, 1].flatMap(sx => Array.from({ length: 11 }, (_, i) => { const z = -4.8 + i * 0.95, w = 1.8 * Math.sqrt(Math.max(0, 1 - ((z + 0.6) / 5.4) ** 2)); return { s: 'sph', c: [sx * (w - 0.03), 0.95, z], r: 0.075, col: win, k: 0 }; })),
      { s: 'box', c: [0, 1.75, -0.7], hs: [1.6, 0.45, 4.3], rd: 0.3, col: white, k: 0 },
      { s: 'box', c: [0, 1.82, -0.7], hs: [1.62, 0.1, 4.1], rd: 0.06, col: win, k: 0 },
      { s: 'box', c: [0, 2.45, -1.0], hs: [1.32, 0.3, 3.5], rd: 0.25, col: white, k: 0 },
      { s: 'box', c: [0, 2.5, -1.0], hs: [1.34, 0.08, 3.3], rd: 0.05, col: win, k: 0 },
      // the sun deck: pale planking, a pool with a rim, loungers
      { s: 'box', c: [0, 2.74, -1.0], hs: [1.24, 0.02, 3.4], rd: 0.02, col: C('#f2ede2'), k: 0 },
      { s: 'box', c: [0, 2.77, 1.05], hs: [0.7, 0.04, 0.95], rd: 0.04, col: C('#d8e4ee'), k: 0 },
      { s: 'box', c: [0, 2.79, 1.05], hs: [0.58, 0.03, 0.82], rd: 0.03, col: C('#3ec8ec'), k: 0 },
      ...[-1, 1].flatMap(sx => [-0.2, 0.6, 1.4].map(z => ({ s: 'box', c: [sx * 1.0, 2.82, z], hs: [0.12, 0.05, 0.3], rd: 0.03, col: C('#ffffff'), k: 0 }))),
      // the bridge at the front of the upper deck
      { s: 'box', c: [0, 2.55, 2.55], hs: [1.5, 0.22, 0.3], rd: 0.12, col: white, k: 0 },
      { s: 'box', c: [0, 2.6, 2.86], hs: [1.3, 0.09, 0.02], rd: 0.02, col: C('#1a2638'), k: 0 },
      // lifeboats along both sides
      ...[-1, 1].flatMap(sx => [-3.4, -1.9, -0.4, 1.1].map(z => ({ s: 'cap', a: [sx * 1.7, 2.05, z - 0.45], b: [sx * 1.7, 2.05, z + 0.45], r: 0.17, col: boat, k: 0 }))),
      // the funnel
      { s: 'ell', c: [0, 3.4, -3.3], rr: [0.55, 0.7, 0.8], col: C('#e0283a'), k: 0 },
      { s: 'box', c: [0, 2.6, -3.3], hs: [0.6, 0.12, 0.85], rd: 0.1, col: C('#e0283a'), k: 0.15 },
      { s: 'ell', c: [0, 3.95, -3.35], rr: [0.48, 0.2, 0.7], col: C('#1e2230'), k: 0.05 },
    ];
    ship('cruise', p, 6, -2.0, 2.0, { piv: 1.0, ao: 0.4 });
  }

  // ---------- the cargo ship: a navy hull with a red waterline, stacks of colorful containers, yellow cranes,
  // a white bridge tower at the stern and a red funnel ----------
  {
    const o = { len: 14.5, wid: 3.9, top: 1.4, bot: -0.3, col: C('#244a7a'), deck: C('#9a4a32'), bands: [[0.12, 0.25, C('#b8382c')], [1.15, 0.05, C('#f4f4f4')]] };
    const cols = ['#d8322c', '#2f6fd8', '#2fae6a', '#ff8a2a', '#ffd34a', '#2fc4c0', '#8a5ad8'].map(C);
    const conts = [];
    const bays = [-3.1, -0.6, 1.9, 4.4];
    bays.forEach((z, bi) => [-1.1, 0, 1.1].forEach((x, xi) => [0, 1].forEach(t => {
      // a gap here and there (never under the blob's spot on the front bay)
      if (t === 1 && bi < 3 && (bi * 3 + xi) % 4 === 1) return;
      const c = cols[(bi * 5 + xi * 3 + t * 2) % cols.length];
      conts.push({ s: 'box', c: [x, 1.85 + t * 0.9, z], hs: [0.52, 0.44, 1.18], rd: 0.04, col: c, k: 0 });
      conts.push({ s: 'box', c: [x, 1.85 + t * 0.9, z], hs: [0.535, 0.36, 1.12], rd: 0.02, col: C('#f4f4f4'), k: 0 });
      conts.push({ s: 'box', c: [x, 1.85 + t * 0.9, z], hs: [0.6, 0.33, 1.1], sub: true, k: 0 });
    })));
    const p = [
      ...hull(o),
      ...rail(o, 1.4, 0.18, 0.065, C('#f4f4f4'), false),
      ...conts,
      // the bridge tower, its window band and roof, and the funnel
      { s: 'box', c: [0, 2.7, -5.6], hs: [1.75, 1.3, 0.85], rd: 0.12, col: C('#f6f8fb'), k: 0 },
      { s: 'box', c: [0, 3.55, -5.6], hs: [1.77, 0.14, 0.87], rd: 0.06, col: C('#1a2638'), k: 0 },
      { s: 'box', c: [0, 4.05, -5.6], hs: [1.9, 0.06, 0.95], rd: 0.03, col: C('#f6f8fb'), k: 0 },
      { s: 'box', c: [0, 4.6, -6.15], hs: [0.45, 0.6, 0.38], rd: 0.12, col: C('#d8322c'), k: 0 },
      { s: 'box', c: [0, 5.15, -6.15], hs: [0.47, 0.1, 0.4], rd: 0.05, col: C('#1e2230'), k: 0 },
      // yellow cranes between the bays
      ...[-1.85, 0.65, 3.15].flatMap((z, i) => { const sx = i % 2 ? 1 : -1; return [
        { s: 'cap', a: [sx * 1.6, 1.4, z], b: [sx * 1.6, 3.9, z], r: 0.11, col: C('#ffc21a'), k: 0 },
        { s: 'cap', a: [sx * 1.6, 3.8, z], b: [-sx * 0.4, 4.2, z + 0.6], r: 0.07, col: C('#ffc21a'), k: 0 },
        { s: 'cap', a: [-sx * 0.4, 4.2, z + 0.6], b: [-sx * 0.4, 3.6, z + 0.6], r: 0.05, col: dark, k: 0 }]; }),
      // the bow's mooring bitts
      ...[-0.6, 0.6].map(x => ({ s: 'cyl', ax: 'y', c: [x, 1.55, 6.2], r: 0.12, hh: 0.15, rd: 0.04, col: C('#1e2230'), k: 0 })),
    ];
    ship('cargo', p, 7.25, -2.4, 2.4, { piv: 1.0, ao: 0.4 });
  }

  // ---------- the battleship: a long grey hull with a red waterline, three twin-gun turrets (the second raised to
  // fire over the first), a stepped bridge tower with a radar mast, a funnel, and little guns along the sides ----------
  {
    const o = { len: 16.5, wid: 3.7, top: 1.5, bot: -0.3, col: C('#7a8494'), deck: C('#b0956a'), bands: [[0.1, 0.25, C('#a8282c')], [1.3, 0.05, C('#5a6270')]] };
    const grey = C('#8a94a4'), greyD = C('#5a6270'), greyL = C('#b4bcc8');
    const turret = (z, y, back) => { const d = back ? -1 : 1; return [
      { s: 'cyl', ax: 'y', c: [0, y + 0.12, z], r: 0.95, hh: 0.14, rd: 0.05, col: greyD, k: 0 },
      { s: 'box', c: [0, y + 0.5, z - d * 0.15], hs: [0.85, 0.32, 0.95], rd: 0.3, col: grey, k: 0 },
      { s: 'box', c: [0, y + 0.82, z - d * 0.15], hs: [0.7, 0.04, 0.75], rd: 0.04, col: greyL, k: 0 },
      ...[-0.32, 0.32].map(x => ({ s: 'cap', a: [x, y + 0.55, z + d * 0.7], b: [x, y + 0.62, z + d * 2.6], r: 0.11, r2: 0.09, col: greyD, k: 0 }))]; };
    const p = [
      ...hull(o),
      ...rail(o, 1.5, 0.2, 0.04, C('#d8dce2'), false),
      // teak planking lines down the deck
      ...[-1.2, -0.6, 0.6, 1.2].map(x => ({ s: 'box', c: [x, 1.53, -0.3], hs: [0.012, 0.008, 6.2], rd: 0.005, col: C('#8a7048'), k: 0 })),
      ...turret(6.0, 1.5, false), ...turret(4.3, 2.0, false), { s: 'box', c: [0, 1.75, 4.3], hs: [1.0, 0.25, 1.0], rd: 0.15, col: grey, k: 0 },
      ...turret(-5.4, 1.5, true),
      // the bridge: three stepped blocks, a window band, the radar mast and its dishes
      { s: 'box', c: [0, 2.15, 0.6], hs: [1.5, 0.65, 1.5], rd: 0.18, col: grey, k: 0 },
      { s: 'box', c: [0, 3.15, 0.4], hs: [1.15, 0.4, 1.1], rd: 0.15, col: grey, k: 0 },
      { s: 'box', c: [0, 3.75, 0.5], hs: [0.85, 0.24, 0.75], rd: 0.12, col: greyL, k: 0 },
      { s: 'box', c: [0, 3.8, 1.25], hs: [0.78, 0.08, 0.02], rd: 0.02, col: C('#1a2638'), k: 0 },
      { s: 'cap', a: [0, 4.0, 0.2], b: [0, 6.2, 0.2], r: 0.1, r2: 0.06, col: greyD, k: 0 },
      { s: 'cap', a: [-0.7, 5.4, 0.2], b: [0.7, 5.4, 0.2], r: 0.05, col: greyD, k: 0 },
      { s: 'ell', c: [0, 5.85, 0.35], rr: [0.45, 0.25, 0.08], col: greyL, k: 0 },
      { s: 'sph', c: [0, 6.3, 0.2], r: 0.12, col: C('#ff4a3a'), k: 0 },
      // the funnel
      { s: 'box', c: [0, 2.8, -1.8], hs: [0.6, 1.1, 0.75], rd: 0.3, col: grey, k: 0 },
      { s: 'box', c: [0, 3.95, -1.85], hs: [0.55, 0.12, 0.7], rd: 0.12, col: C('#2a2e38'), k: 0 },
      // small guns down each side, lifeboats, the anchor chain and a flag at the stern
      ...[-1, 1].flatMap(sx => [-3.2, -2.4, 2.4].map(z => ({ s: 'cap', a: [sx * 1.4, 1.75, z], b: [sx * 1.75, 1.9, z + 0.5], r: 0.06, col: greyD, k: 0 }))),
      ...[-1, 1].map(sx => ({ s: 'cap', a: [sx * 1.25, 2.95, -0.6], b: [sx * 1.25, 2.95, 0.8], r: 0.2, col: C('#e8ecf0'), k: 0 })),
      { s: 'cap', a: [0, 1.6, -7.6], b: [0, 2.8, -7.6], r: 0.04, col: greyD, k: 0 }, { s: 'box', c: [0, 2.6, -7.95], hs: [0.02, 0.18, 0.32], rd: 0.01, col: C('#2a5ad8'), k: 0 },
    ];
    ship('battleship', p, 8.25, -2.7, 2.7, { piv: 1.0, ao: 0.4 });
  }

  // ---------- the aircraft carrier: a wide grey flight deck with runway markings, the island tower to starboard,
  // jets parked along the edge and a helicopter on its pad ----------
  {
    const o = { len: 19, wid: 4.6, top: 2.2, bot: -0.3, col: C('#6a7280'), deck: C('#4a4e56'), bands: [[0.1, 0.3, C('#a8282c')]] };
    const deckC = C('#4a4e56'), line = C('#f4f4f0'), yel = C('#ffd34a'), grey = C('#8a94a4'), greyD = C('#5a6270');
    const jet = (x, z, yaw) => { const c = Math.cos(yaw), s2 = Math.sin(yaw), at = (u, v, h) => [x + c * u + s2 * v, 3.0 + h, z - s2 * u + c * v]; return [
      { s: 'cap', a: at(0, -0.9, 0.18), b: at(0, 0.9, 0.18), r: 0.17, r2: 0.1, col: C('#9aa6b8'), k: 0 },
      { s: 'cap', a: at(-1.0, -0.2, 0.15), b: at(1.0, -0.2, 0.15), r: 0.06, col: C('#8a96a8'), k: 0.05 },
      { s: 'cap', a: at(-0.45, -0.85, 0.2), b: at(0.45, -0.85, 0.2), r: 0.04, col: C('#8a96a8'), k: 0.03 },
      { s: 'cap', a: at(0, -0.85, 0.2), b: at(0, -0.75, 0.6), r: 0.05, r2: 0.03, col: C('#8a96a8'), k: 0.03 },
      { s: 'ell', c: at(0, 0.45, 0.3), rr: [0.1, 0.08, 0.22], col: C('#2a4a7a'), k: 0 }]; };
    const p = [
      ...hull(o),
      // the flight deck: an overhanging slab, angled at the front, edged in white, with a dashed center line
      { s: 'box', c: [0.3, 2.65, 0], hs: [2.9, 0.22, 9.4], rd: 0.15, col: deckC, k: 0 },
      { s: 'box', c: [0, 2.65, 9.4], hs: [2.0, 0.22, 0.8], rd: 0.4, col: deckC, k: 0 },
      ...[-1, 1].map(sx => ({ s: 'box', c: [0.3 + sx * 2.75, 2.88, 0], hs: [0.05, 0.01, 9.2], rd: 0.01, col: line, k: 0 })),
      ...Array.from({ length: 9 }, (_, i) => ({ s: 'box', c: [0.6, 2.88, -8 + i * 2], hs: [0.06, 0.01, 0.55], rd: 0.01, col: line, k: 0 })),
      { s: 'box', c: [0.6, 2.88, 8.6], hs: [0.9, 0.01, 0.06], rd: 0.01, col: yel, k: 0 },
      // the island tower to starboard (-x): a block, a bridge with windows, a mast with radar
      { s: 'box', c: [-2.35, 4.0, -2.0], hs: [0.6, 1.2, 1.9], rd: 0.15, col: grey, k: 0 },
      { s: 'box', c: [-2.35, 5.35, -1.8], hs: [0.55, 0.3, 1.3], rd: 0.12, col: grey, k: 0 },
      { s: 'box', c: [-1.78, 5.4, -1.8], hs: [0.02, 0.09, 1.1], rd: 0.02, col: C('#1a2638'), k: 0 },
      { s: 'cap', a: [-2.35, 5.6, -1.6], b: [-2.35, 7.3, -1.6], r: 0.09, r2: 0.05, col: greyD, k: 0 },
      { s: 'ell', c: [-2.35, 6.9, -1.5], rr: [0.5, 0.22, 0.08], col: C('#c8d0da'), k: 0 },
      { s: 'box', c: [-2.35, 4.4, -0.05], hs: [0.5, 0.06, 0.02], rd: 0.01, col: C('#ffffff'), k: 0 },
      // jets parked along the port edge and at the stern; a helicopter on a marked pad
      ...jet(2.2, 5.5, -2.3), ...jet(2.2, 2.8, -2.3), ...jet(2.2, 0.1, -2.3), ...jet(0.6, -6.8, 3.14), ...jet(-1.2, -7.4, 3.14),
      { s: 'tor', ax: 'y', c: [1.6, 2.88, -3.6], R: 0.8, r: 0.04, a0: -Math.PI, a1: Math.PI, col: yel, k: 0 },
      { s: 'ell', c: [1.6, 3.35, -3.6], rr: [0.35, 0.3, 0.55], col: C('#3a5a3a'), k: 0 },
      { s: 'cap', a: [1.6, 3.35, -4.1], b: [1.6, 3.5, -5.0], r: 0.08, r2: 0.04, col: C('#3a5a3a'), k: 0 },
      { s: 'cap', a: [0.5, 3.75, -3.6], b: [2.7, 3.75, -3.6], r: 0.03, col: C('#2a2e38'), k: 0 },
      { s: 'cap', a: [1.6, 3.75, -4.7], b: [1.6, 3.75, -2.5], r: 0.03, col: C('#2a2e38'), k: 0 },
    ];
    ship('carrier', p, 9.5, -3.1, 3.1, { piv: 1.2, ao: 0.35 });
  }

  // ---------- the Golden Ark: a great ivory-and-gold ship of legend: gilded bands, a temple cabin with columns
  // and a golden dome, gem lanterns, an angel figurehead; three masts with white and gold sails (rig mesh) ----------
  {
    const o = { len: 21, wid: 5.6, top: 2.0, bot: -0.3, col: C('#f4ecd6'), deck: C('#d8b878'), bands: [[1.75, 0.09, gold], [1.1, 0.16, C('#e0a830')], [0.3, 0.12, C('#2a8ad8')]] };
    const ivory = C('#f8f0dc'), gem = C('#3ad8f0'), gemR = C('#ff4a7a');
    const p = [
      ...hull(o),
      ...rail(o, 2.0, 0.32, 0.07, gold),
      // the temple cabin at the stern: a plinth, columns, a frieze and a golden dome with a spire
      { s: 'box', c: [0, 2.3, -5.6], hs: [2.0, 0.3, 2.4], rd: 0.12, col: ivory, k: 0 },
      ...[-1.6, -0.55, 0.55, 1.6].flatMap(x => [-7.6, -3.6].map(z => ({ s: 'cyl', ax: 'y', c: [x, 3.35, z], r: 0.2, hh: 0.8, rd: 0.05, col: ivory, k: 0 }))),
      { s: 'box', c: [0, 3.0, -5.6], hs: [1.5, 0.7, 1.7], rd: 0.1, col: C('#f0e4c4'), k: 0 },
      { s: 'box', c: [0, 4.25, -5.6], hs: [2.0, 0.18, 2.3], rd: 0.06, col: gold, k: 0 },
      { s: 'sph', c: [0, 4.6, -5.6], r: 1.35, col: C('#f2c440'), k: 0 }, { s: 'box', c: [0, 3.8, -5.6], hs: [2, 0.6, 2], sub: true, k: 0 },
      { s: 'cap', a: [0, 5.8, -5.6], b: [0, 6.8, -5.6], r: 0.08, r2: 0.03, col: gold, k: 0 }, { s: 'sph', c: [0, 6.9, -5.6], r: 0.16, col: gem, k: 0 },
      // gem lanterns down both rails, a golden prow and the angel figurehead with spread wings
      ...[-1, 1].flatMap(sx => [-2, 1.5, 5].flatMap(z => { const w = 2.75 * Math.sqrt(Math.max(0, 1 - ((z + 1.0) / 9.5) ** 2)); return [
        { s: 'cap', a: [sx * w * 0.95, 2.0, z], b: [sx * w * 0.95, 2.7, z], r: 0.05, col: gold, k: 0 }, { s: 'sph', c: [sx * w * 0.95, 2.8, z], r: 0.14, col: sx > 0 ? gem : gemR, k: 0 }]; })),
      { s: 'cap', a: [0, 1.9, 9.6], b: [0, 2.7, 11.1], r: 0.22, r2: 0.12, col: gold, k: 0 },
      { s: 'sph', c: [0, 2.95, 11.0], r: 0.24, col: C('#fff4dc'), k: 0 },
      { s: 'cap', a: [0, 2.7, 10.85], b: [0, 2.1, 10.5], r: 0.22, r2: 0.3, col: C('#fff4dc'), k: 0.1 },
      ...[-1, 1].map(sx => ({ s: 'ell', c: [sx * 0.55, 2.75, 10.4], rr: [0.6, 0.35, 0.12], col: gold, k: 0.05 })),
      { s: 'tor', ax: 'y', c: [0, 3.3, 11.0], R: 0.2, r: 0.03, a0: -Math.PI, a1: Math.PI, col: C('#ffe86a'), k: 0 },
    ];
    ship('ark', p, 10.5, -3.4, 3.4, { piv: 1.0, ao: 0.4 });
    const sailW = C('#fffaf0'), mastG = C('#c8962a');
    const sail = (z, y, w, h) => [
      { s: 'cap', a: [-w - 0.15, y + h + 0.12, z], b: [w + 0.15, y + h + 0.12, z], r: 0.07, col: mastG, k: 0 },
      { s: 'ell', c: [0, y, z], rr: [w, h, 0.4], col: sailW, k: 0 }, { s: 'ell', c: [0, y, z - 0.06], rr: [w, h, 0.36], sub: true, k: 0 },
      { s: 'box', c: [0, y, z - 0.4], hs: [4, 4, 0.4], sub: true, k: 0 },
      { s: 'ell', c: [0, y + h * 0.1, z + 0.36], rr: [w * 0.32, w * 0.32, 0.06], col: C('#f2c440'), k: 0 }];
    rigMesh('ark_rig', [
      ...[[5.2, 7.2], [0.8, 8.4], [-2.4, 6.8]].flatMap(([z, h]) => [{ s: 'cap', a: [0, 2.0, z], b: [0, h, z], r: 0.16, r2: 0.1, col: mastG, k: 0 }, { s: 'sph', c: [0, h + 0.1, z], r: 0.2, col: gold, k: 0 }]),
      ...sail(5.2, 4.6, 1.9, 1.5), ...sail(0.8, 5.4, 2.3, 1.9), ...sail(-2.4, 4.4, 1.8, 1.4),
      { s: 'box', c: [0, 8.6, 0.45], hs: [0.03, 0.3, 0.55], rd: 0.02, col: C('#2a8ad8'), k: 0 },
      { s: 'cap', a: [0, 8.3, 0.8], b: [0, 2.6, 10.6], r: 0.05, col: gold, k: 0 },
      { s: 'cap', a: [0, 8.3, 0.8], b: [0, 4.5, -7.6], r: 0.05, col: gold, k: 0 },
    ], 10.5);
  }
}
