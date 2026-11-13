// ============================================================
// Chapter 20, inside the cave: a cover shooter on rails. None of the arena's rules apply in here.
// The cave is a chain of pieces (tunnels, rooms, bends, the fork, the Bagger's hall) laid end to end in the
// world, far north of the crater; each piece has its own frame (an origin and a heading, with -z its forward)
// and everything in a room lives in that room's local coordinates (x across, z along; the hero's rail at z -5).
// The hero walks the rails between stops. In a room: A/D (or the arrows) slide along the rail behind low
// rock walls, the blob ducks down behind them on its own and pops up whenever you click to shoot (one goo shot
// per click, a short cooldown, aimed with the mouse crosshair). Crossbowmen pop up from behind their own rocks
// to shoot (their aim lines show), armored spearmen work forward rock by rock throwing spears that arc down
// on marked circles, then come in to stab; shieldmen walk in behind tower shields to bash; mole miners burst
// out of the walls and rush you. Rocks crack and crumble as they take hits. After the first room comes the
// fork, seen in first person: the left way is four more (harder) rooms and a bigger reward, the right way two.
// Both end in the Bagger's hall (13j-bagger.js). Dying starts the cave over from its mouth.
// ============================================================
let CV = null;
const CAVE = {
  rail: -5, coverZ: -6.6, meleeZ: -7.7, slide: 7.2, back: 5.0, up: 2.65, fov: 0.8,
  shotV: 46, shotCd: 0.26, shotDmg: 10, upHold: 0.55,
  standTop: 1.85, crouchTop: 1.12, heroR: 0.44,
  coverHp: 140, foeCoverHp: 260, coverScale: 2.25,
  boltV: 25, boltDmg: 16.8, spearDmg: 23.8, stabDmg: 25.2, bashDmg: 30.8, clawDmg: 15.4,
  walk: 13.8, wallS: 3, ceil: 8.3,
  // the deep mine's crowd
  biteDmg: 14, batDmg: 10, dynDmg: 24, dynR: 1.7, boulderDmg: 28, boulderR: 1.9, smashDmg: 36, shardDmg: 16, golemDmg: 30,
};
const CAVE_FOES = {
  xbow: { model: 'xbowman', hp: 30, scale: 1.55, tint: '#e8843a' },
  spear: { model: 'spearman', hp: 70, scale: 1.6, tint: '#e86a3a', armor: 0.5 },
  shield: { model: 'shieldman', hp: 95, scale: 1.65, tint: '#c8622a', armor: 0.7 },
  mole: { model: 'mole', hp: 24, scale: 1.45, tint: '#7a6458' },
  // spiders drop from the ceiling on a thread and skitter in to bite; bats swoop at your head; goblin sappers throw
  // dynamite from behind rocks (it blasts rocks too); ogres hurl boulders, then come in swinging; crystal golems
  // march in and fire fans of crystal shards (only the glowing core in their chest really hurts them)
  spider: { model: 'cspider', hp: 22, scale: 1.5, tint: '#3a2a3a', head: 0.33, headR: 0.13, body: [0.08, 0.45, 0.34], clips: { run: 'skitter', idle: 'skitter', slam: 'bite' } },
  bat: { model: 'cbat', hp: 10, scale: 1.5, tint: '#4a3a40', fly: true, clips: { run: 'batflap', idle: 'batflap', slam: 'batflap' } },
  goblin: { model: 'goblin', hp: 28, scale: 1.3, tint: '#6aa84a' },
  ogre: { model: 'ogre', hp: 300, scale: 2.2, tint: '#8aa070', armor: 0.8, head: 0.98, headR: 0.15 },
  golem: { model: 'cgolem', hp: 200, scale: 2.0, tint: '#8a8078', armor: 0.25, head: 0.66, headR: 0.12 },
};
// rooms: half width, length, the look, hero cover xs, mid-room and far cover spots, and the waves
const CAVE_ROOMS = {
  A: { hw: 8.5, len: 24, look: 'stone', hero: [-5.2, 0, 5.2], mid: [], foe: [[-5, -17], [0.5, -19.5], [5.5, -16.5]],
    waves: [['xbow', 'goblin'], ['xbow', 'xbow', 'spider', 'spider']] },
  L1: { hw: 9, len: 26, look: 'mine', hero: [-6, -2, 2, 6], mid: [[-3.6, -12.6], [3.8, -13]], foe: [[-6, -19], [0, -21], [6, -19.5]],
    waves: [['goblin', 'xbow', 'spider', 'spider'], ['spear', 'goblin', 'bat', 'bat', 'bat'], ['ogre', 'xbow', 'goblin']] },
  L2: { hw: 9.5, len: 27, look: 'stone', hero: [-6.5, -2.2, 2.2, 6.5], mid: [[-5, -13], [0.5, -12.4], [5.5, -13.5]], foe: [[-6.5, -20], [-1.5, -21.5], [3.5, -20.5], [7.5, -19]],
    waves: [['spear', 'spear', 'goblin'], ['golem', 'xbow', 'bat', 'bat'], ['mole', 'mole', 'spider', 'spider', 'spider', 'goblin']] },
  L3: { hw: 9, len: 26, look: 'braziers', hero: [-6, -2, 2, 6], mid: [[-3, -12.5], [4, -12.8]], foe: [[-6.5, -19], [-0.5, -21], [5, -19.5], [7.6, -15.5]],
    waves: [['xbow', 'goblin', 'goblin', 'spear'], ['ogre', 'bat', 'bat', 'bat', 'bat'], ['shield', 'golem', 'xbow', 'spider', 'spider']] },
  L4: { hw: 10, len: 28, look: 'ruins', hero: [-7, -2.4, 2.4, 7], mid: [[-5, -13.5], [0, -14.5], [5, -13.5]], foe: [[-7.5, -21], [-2.5, -22], [2.5, -21.5], [7.5, -20.5]],
    waves: [['shield', 'goblin', 'xbow', 'bat', 'bat'], ['ogre', 'spear', 'spider', 'spider', 'spider'], ['golem', 'ogre', 'goblin', 'goblin', 'bat', 'bat']] },
  R1: { hw: 9.5, len: 27, look: 'crystal', hero: [-6.4, -2.1, 2.1, 6.4], mid: [[-4, -13], [4.2, -12.6]], foe: [[-6, -20], [0.2, -21.5], [6.3, -19.8]],
    waves: [['goblin', 'spear', 'xbow', 'spider'], ['shield', 'bat', 'bat', 'bat', 'mole'], ['ogre', 'goblin', 'xbow']] },
  R2: { hw: 10, len: 28, look: 'flooded', hero: [-7, -2.4, 2.4, 7], mid: [[-5.5, -13], [0, -13.8], [5.5, -12.8]], foe: [[-7, -20.5], [-2, -22], [3, -21.2], [7.6, -19.6]],
    waves: [['golem', 'xbow', 'goblin', 'spider', 'spider'], ['mole', 'mole', 'bat', 'bat', 'bat', 'spear'], ['ogre', 'shield', 'goblin', 'xbow']] },
};
// what each branch is, after the shared start (mouth tunnel, room A, tunnel, the fork)
const CAVE_BRANCH = {
  L: [['tunnel', 7], ['room', 'L1'], ['bend', 1], ['tunnel', 4], ['room', 'L2'], ['tunnel', 6], ['room', 'L3'], ['bend', -1], ['tunnel', 4], ['room', 'L4'], ['tunnel', 8], ['boss']],
  R: [['tunnel', 7], ['room', 'R1'], ['bend', -1], ['tunnel', 5], ['room', 'R2'], ['tunnel', 8], ['boss']],
};

// ---------- frames: local (x across, z along, forward -z) <-> world ----------
function cvFrame(ox, oz, yaw) { return { ox, oz, yaw, c: Math.cos(yaw), s: Math.sin(yaw) }; }
function cvW(F, lx, lz, out = [0, 0]) { out[0] = F.ox + F.c * lx + F.s * lz; out[1] = F.oz - F.s * lx + F.c * lz; return out; }
function cvL(F, wx, wz, out = [0, 0]) { const dx = wx - F.ox, dz = wz - F.oz; out[0] = F.c * dx - F.s * dz; out[1] = F.s * dx + F.c * dz; return out; }
function cvW3(F, x, y, z, out = [0, 0, 0]) { out[0] = F.ox + F.c * x + F.s * z; out[1] = y; out[2] = F.oz - F.s * x + F.c * z; return out; }
const _cw = [0, 0], _cw3 = [0, 0, 0];

// ---------- building the pieces ----------
function cvPiece(spec, F, rnd) {
  const [kind, arg] = spec, P = { kind, F, inst: [], torches: [], glows: [], pools: [], path: [] };
  const put = (m, lx, lz, y, yawL, s, sh) => { const w = cvW(F, lx, lz); P.inst.push({ m, x: w[0], y, z: w[1], yaw: yawL + F.yaw, s, sh: sh ?? (0.8 + rnd() * 0.32) }); };
  // a run of rock wall segments along a line, their faces toward faceYaw (local)
  const wall = (x0, z0, x1, z1, faceYaw, sc = CAVE.wallS) => {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / (1.6 * sc))), nx = Math.sin(faceYaw), nz = Math.cos(faceYaw);
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, s = sc * (0.92 + rnd() * 0.2);
      put('cwall' + Math.floor(rnd() * 3), lerp(x0, x1, u) - nx * 0.36 * s, lerp(z0, z1, u) - nz * 0.36 * s, -rnd() * 0.5, faceYaw + (rnd() - 0.5) * 0.16, s);
      // an overhang of rock along the top, leaning in
      if (rnd() < 0.7) put('boulder' + Math.floor(rnd() * 3), lerp(x0, x1, u) + nx * 0.6, lerp(z0, z1, u) + nz * 0.6, CAVE.ceil - 1.2 + rnd() * 0.8, rnd() * TAU, 3.2 + rnd() * 1.6);
    }
  };
  const torch = (lx, lz, faceYaw, every) => {
    const nx = Math.sin(faceYaw), nz = Math.cos(faceYaw);
    put('torch', lx + nx * 0.35, lz + nz * 0.35, 2.3, faceYaw, 2.4, 1);
    const w = cvW(F, lx + nx * 0.97, lz + nz * 0.97);
    P.torches.push({ x: w[0], y: 3.75, z: w[1], r: 6.2, ph: rnd() * 10 });
  };
  const ceiling = (x0, x1, z0, z1, n) => {
    for (let i = 0; i < n; i++) { const s = 1.6 + rnd() * 1.6; put('stalac', lerp(x0, x1, rnd()), lerp(z0, z1, rnd()), CAVE.ceil + 0.6 - 1.15 * s, rnd() * TAU, s); }
  };
  const floorBits = (x0, x1, z0, z1, n, keep) => {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, rnd()), z = lerp(z0, z1, rnd());
      if (keep && keep(x, z)) continue;
      if (rnd() < 0.55) put('stalag', x, z, 0, rnd() * TAU, 1.0 + rnd() * 1.2); else put('rubble', x, z, 0, rnd() * TAU, 1.6 + rnd());
    }
  };
  if (kind === 'tunnel') {
    const L = arg, hw = 3.6;
    P.len = L; P.hw = hw;
    wall(-hw, 0, -hw, -L, Math.PI / 2); wall(hw, 0, hw, -L, -Math.PI / 2);
    for (let z = -2.5; z > -L + 0.5; z -= 6) put('mbeam', 0, z, 0, 0, 3.05, 0.9 + rnd() * 0.2);
    for (let z = -4, i = 0; z > -L; z -= 7, i++) torch(i % 2 ? hw : -hw, z, i % 2 ? -Math.PI / 2 : Math.PI / 2);
    ceiling(-hw, hw, 0, -L, Math.ceil(L / 3));
    floorBits(-hw + 0.4, -hw + 1.2, 0, -L, Math.ceil(L / 5)); floorBits(hw - 1.2, hw - 0.4, 0, -L, Math.ceil(L / 5));
    P.path = [[0, 0], [0, -L]];
    P.exitF = cvFrame(...cvW(F, 0, -L), F.yaw);
  } else if (kind === 'bend') {
    // a quarter turn: arg +1 turns left, -1 right. The square chamber is open on the way in and the way out
    const t = arg, hw = 3.6;
    P.len = hw * 2; P.hw = hw;
    wall(t * hw, 0, t * hw, -hw * 2, t > 0 ? -Math.PI / 2 : Math.PI / 2);
    wall(-hw, -hw * 2, hw, -hw * 2, 0);
    torch(0, -hw * 2, 0); ceiling(-hw, hw, 0, -hw * 2, 4);
    put('stalag', t * (hw - 0.8), -hw * 2 + 0.8, 0, rnd() * TAU, 1.8);
    for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI / 2; P.path.push([-t * hw + t * Math.cos(a) * hw, -Math.sin(a) * hw]); }
    P.exitF = cvFrame(...cvW(F, -t * hw, -hw), F.yaw + t * Math.PI / 2);
  } else if (kind === 'fork') {
    const hw = 6.5, L = 9.5;
    P.len = L; P.hw = hw;
    wall(-hw, 0, -3.6, 0, Math.PI); wall(3.6, 0, hw, 0, Math.PI);
    wall(-hw, -L, hw, -L, 0);
    wall(-hw, 0, -hw, -1.9, Math.PI / 2); wall(hw, 0, hw, -1.9, -Math.PI / 2);
    // the rock face dead ahead, lit by a brazier and two torches
    put('brazier', 0, -L + 1.0, 0, 0, 2.2, 1);
    P.torches.push({ ...(() => { const w = cvW(F, 0, -L + 1.0); return { x: w[0], z: w[1] }; })(), y: 1.7, r: 6, ph: 0 });
    P.glows.push({ lx: 0, y: 1.35, lz: -L + 1.0, r: 1.3, col: [1, 0.6, 0.25] });
    torch(-hw + 0.2, -1.2, Math.PI / 2); torch(hw - 0.2, -1.2, -Math.PI / 2);
    put('stalag', -2.5, -L + 0.9, 0, 1, 2.1); put('stalag', 2.8, -L + 1.0, 0, 2, 1.7);
    ceiling(-hw, hw, 0, -L, 7);
    P.path = [[0, 0], [0, -5.6]];
    P.exits = { L: cvFrame(...cvW(F, -hw, -5.6), F.yaw + Math.PI / 2), R: cvFrame(...cvW(F, hw, -5.6), F.yaw - Math.PI / 2) };
    P.lookL = [-hw - 5, -5.6]; P.lookR = [hw + 5, -5.6];
  } else if (kind === 'room' || kind === 'boss') {
    const D = kind === 'boss' ? BAG_ROOM : CAVE_ROOMS[arg], hw = D.hw, L = D.len, sc = kind === 'boss' ? 4 : CAVE.wallS;
    P.def = D; P.id = kind === 'boss' ? 'boss' : arg; P.len = L; P.hw = hw;
    // (no wall along the near end: the camera stands on that line, and it is always behind the view)
    if (kind === 'boss') { wall(-hw, -L, hw, -L, 0, sc); }
    else { wall(-hw, -L, -3.6, -L, 0, sc); wall(3.6, -L, hw, -L, 0, sc); }
    // side walls; the boss hall has a dark alcove in each side for its minions
    if (kind === 'boss') for (const sx of [-1, 1]) { wall(sx * hw, 0, sx * hw, -15.5, -sx * Math.PI / 2, sc); wall(sx * hw, -20.5, sx * hw, -L, -sx * Math.PI / 2, sc); wall(sx * (hw + 5), -15, sx * (hw + 5), -21, -sx * Math.PI / 2, sc); }
    else for (const sx of [-1, 1]) wall(sx * hw, 0, sx * hw, -L, -sx * Math.PI / 2, sc);
    for (let z = -4, i = 0; z > -L + 1; z -= 6.5, i++) for (const sx of [-1, 1]) if (kind !== 'boss' || z > -14 || z < -22) torch(sx * hw, z - (sx > 0 ? 3 : 0), -sx * Math.PI / 2);
    ceiling(-hw, hw, 0, -L, Math.min(44, Math.ceil(L * hw / 18)));
    // a ring of bits along the walls, clear of the covers
    const near = (x, z) => [...D.hero.map(x0 => [x0, CAVE.coverZ]), ...D.mid, ...D.foe].some(([cx, cz]) => Math.hypot(cx - x, cz - z) < 2.6) || Math.abs(x) < 3 && (z > -3 || z < -L + 3);
    floorBits(-hw + 0.3, -hw + 1.8, -1, -L + 1, Math.ceil(L / 4), near); floorBits(hw - 1.8, hw - 0.3, -1, -L + 1, Math.ceil(L / 4), near);
    cvDecorate(P, D.look, put, rnd);
    P.path = [[0, 0], [0, CAVE.rail]];
    P.exitF = cvFrame(...cvW(F, 0, -L), F.yaw);
  }
  return P;
}
// each room's own look
function cvDecorate(P, look, put, rnd) {
  const hw = P.hw, L = P.len, F = P.F;
  const light = (lx, lz, y, r) => { const w = cvW(F, lx, lz); P.torches.push({ x: w[0], y, z: w[1], r, ph: rnd() * 10 }); };
  if (look === 'boss') { bagDecorate(P, put, rnd, light); return; }
  if (look === 'mine') {
    for (let z = -3; z > -L + 2; z -= 6) for (const sx of [-1, 1]) put('mbeam', sx * (hw - 0.5), z, 0, sx * Math.PI / 2, 2.6, 0.95);
    put('minecart', -hw + 1.6, -L + 4, 0, 0.2, 2.2); put('minecart', hw - 1.7, -9, 0, -0.3, 2.2);
    for (const [x, z] of [[-hw + 0.9, -11], [hw - 0.9, -16]]) { put('lanternpost', x, z, 0, x < 0 ? Math.PI / 2 : -Math.PI / 2, 3.2, 1); light(x + (x < 0 ? 0.8 : -0.8), z, 2.7, 4.5); }
  } else if (look === 'braziers') {
    for (const [x, z] of [[-hw + 1.5, -10], [hw - 1.5, -10], [-hw + 1.5, -L + 3], [hw - 1.5, -L + 3]]) { put('brazier', x, z, 0, rnd() * TAU, 2.4, 1); light(x, z, 1.8, 6); P.glows.push({ lx: x, y: 1.4, lz: z, r: 1.4, col: [1, 0.6, 0.25] }); }
  } else if (look === 'ruins') {
    for (let z = -8; z > -L + 3; z -= 7) for (const sx of [-1, 1]) put('cpillar', sx * (hw - 1.4), z, 0, rnd() * TAU, 2.9);
    for (const [x, z] of [[-3.5, -L + 2.5], [3.5, -L + 2.5]]) { put('brazier', x, z, 0, 0, 2.4, 1); light(x, z, 1.8, 6); P.glows.push({ lx: x, y: 1.4, lz: z, r: 1.4, col: [1, 0.6, 0.25] }); }
  } else if (look === 'crystal') {
    for (let i = 0; i < 9; i++) {
      const sx = i % 2 ? 1 : -1, x = sx * (hw - 0.9 - rnd() * 0.8), z = -3 - rnd() * (L - 6);
      put('ore', x, z, 0, rnd() * TAU, 2.2 + rnd() * 1.4);
      P.glows.push({ lx: x, y: 1.5, lz: z, r: 1.6, col: [0.4, 0.9, 1] });
    }
  } else if (look === 'flooded') {
    for (let i = 0; i < 6; i++) { const w = cvW(F, (rnd() - 0.5) * hw * 1.6, -9 - rnd() * (L - 12)); P.pools.push({ kind: 'cavewater', x: w[0], z: w[1], r: 1.6 + rnd() * 1.6, ph: rnd() * 10 }); }
    put('minecart', -hw + 1.6, -12, 0, 1.4, 2.2);
  }
}
// the whole course from the mouth to the fork; the chosen branch is added on when the hero picks it
function cvBuildStart() {
  const rnd = mulberry32(2024 + CV.attempt * 7);
  CV.pieces = [];
  let F = cvFrame(0, -400, 0);
  for (const spec of [['tunnel', 16], ['room', 'A'], ['tunnel', 8], ['fork']]) {
    const P = cvPiece(spec, F, rnd);
    CV.pieces.push(P);
    F = P.exitF;
  }
  CV.forkI = CV.pieces.length - 1;
  // a look down both ways from the fork
  const fk = CV.pieces[CV.forkI];
  CV.peek = { L: cvPiece(['tunnel', 7], fk.exits.L, rnd), R: cvPiece(['tunnel', 7], fk.exits.R, rnd) };
}
function cvBuildBranch(side) {
  const rnd = mulberry32(99 + CV.attempt * 13 + (side === 'L' ? 1 : 2));
  let F = CV.pieces[CV.forkI].exits[side];
  for (const spec of CAVE_BRANCH[side]) {
    const P = cvPiece(spec, F, rnd);
    CV.pieces.push(P);
    F = P.exitF;
  }
  // after the fork the hero walks straight off down the chosen way
  CV.pieces[CV.forkI].path = [[0, -5.6], [side === 'L' ? -6.5 : 6.5, -5.6]];
  CV.peek = null;
}

// ---------- entering, restarting, leaving ----------
function caveEnter() {
  const run = G.run;
  run.pending = 0; run.chestQueued = 0;
  // whatever was lying about is picked up on the way in
  for (const p of run.pickups) { if (p.kind === 'coin') run.coins += p.value || 1; else if (p.kind === 'scroll') run.scrolls = (run.scrolls || 0) + 1; }
  run.pickups.length = 0; run.gems.length = 0; run.eShots.length = 0; run.proj.length = 0; run.tele = [];
  for (const e of run.enemies) if (!e.dying) e.dying = 0.0001;
  CV = run.cave = { phase: 'enter', t: 0, attempt: 0, branch: null, fade: 0, vig: 0, cam: null, dmgMul: 1, roomsDone: 0, kills: 0,
    startEye: R.cam.pos.slice(), startTgt: R.cam.target.slice(), from: G.hero.pos.slice() };
  UI.banner('THE CAVE', true);
  AUDIO.play('rumble'); AUDIO.play('roar', 0.5);
  G.cam.shake = Math.max(G.cam.shake, 0.2);
  $('hud').classList.add('cave');
}
// put the hero at the cave mouth (the start of the first tunnel) with full health
function caveStart() {
  const run = G.run;
  CV.branch = null; CV.room = null; CV.boss = null; CV.dmgMul = 1; CV.roomsDone = 0;
  cvBuildStart();
  cvApplyLook();
  CV.pi = 0; CV.seg = 0; CV.segU = 0; CV.phase = 'walk'; CV.t = 0;
  const P = CV.pieces[0], w = cvW(P.F, 0, 1.5);
  V3.set(G.hero.pos, w[0], 0, w[1]);
  G.hero.meltTarget = 0; G.hero.melt = 0; G.hero.crouch = 0;
  G.hero.faceYaw = P.F.yaw + Math.PI; G.hero.yaw = G.hero.faceYaw;
  run.hp = run.maxHp; run.invuln = 1; run.hurtFlash = 0;
  CV.shots = []; CV.bolts = []; CV.spears = []; CV.rocks = []; run.tele = [];
  CV.cam = null; CV.fade = 1; CV.fadeTo = 0;
  CV.walkYaw = P.F.yaw;
}
function cvApplyLook() {
  const f = R.frame, C = hexToRgb;
  f.floorStyle = 20; f.stoneA = C('#4e463f'); f.stoneB = C('#35302b'); f.grout = C('#141110'); f.accent = C('#ffcf80');
  f.fogCol = C('#060404'); f.skyCol = C('#2e241c'); f.groundCol = C('#141010'); f.lightCol = C('#8a6a50');
  f.spotMin = 0.2; f.shadowTint = C('#1a0e08'); f.rockCol = C('#5a4d43'); f.poolGlow = 0;
  f.torchCol = [1.35, 0.74, 0.34];
}
function caveLeave() {
  if (G.run) G.run.cave = null;
  CV = null;
  G.hero.faceYaw = null; G.hero.crouch = 0;
  $('hud').classList.remove('cave');
  $('gl').style.cursor = '';
}

// ---------- the main update (called from updateRun) ----------
function updateCave(dt) {
  const run = G.run;
  CV.t += dt;
  run.invuln = Math.max(0, run.invuln - dt);
  run.hurtFlash = Math.max(0, run.hurtFlash - dt * 1.8);
  CV.vig = Math.max(0, CV.vig - dt * 0.6);
  CV.fade += ((CV.fadeTo ?? 0) - CV.fade) * Math.min(1, dt * 3.2);
  CV.hitMark = Math.max(0, (CV.hitMark || 0) - dt * 4);
  CV.shotCd = Math.max(0, (CV.shotCd || 0) - dt);
  if (CV.phase === 'enter') { cvEnterUpdate(dt); return; }
  const fighting = CV.phase === 'fight' || CV.phase === 'boss';
  $('gl').style.cursor = fighting || CV.phase === 'bossintro' ? 'none' : '';
  if (CV.phase === 'walk') cvWalk(dt);
  else if (CV.phase === 'fight') cvFight(dt);
  else if (CV.phase === 'clear') { cvHeroIdle(dt); if (CV.t > 1.7) cvNext(); }
  else if (CV.phase === 'fork') cvFork(dt);
  else if (CV.phase === 'bossintro' || CV.phase === 'boss' || CV.phase === 'won') bagUpdate(dt);
  else if (CV.phase === 'dead') cvDead(dt);
  cvShots(dt); cvBolts(dt); cvSpears(dt);
  cvSeeThrough(dt);
  updateTempZones(dt);
  R.frame.lowHp = run.hp / run.maxHp < 0.25 && CV.phase !== 'dead' ? 0.35 : 0;
}
// see-through rock: a wall slab, overhang boulder, pillar or brazier that stands between the camera and the blob
// (or between the camera and what it looks at) fades out, as the city's buildings do
function cvSeeThrough(dt) {
  if (!CV.pieces) return;
  const c = R.cam.pos, targets = [G.hero.pos, R.cam.target], hy = 1.0;
  for (let i = Math.max(0, CV.pi - 1); i <= Math.min(CV.pieces.length - 1, CV.pi + 1); i++) {
    for (const o of CV.pieces[i].inst) {
      const B = MESHB[o.m], r = B ? Math.max(B.hi[0] - B.lo[0], B.hi[2] - B.lo[2]) * 0.5 * o.s : o.s * 0.6, my = B ? o.y + (B.lo[1] + B.hi[1]) * 0.5 * o.s : o.y + o.s * 0.5;
      let behind = false;
      for (const t of targets) {
        const ty = t === G.hero.pos ? t[1] + hy : t[1], dx = t[0] - c[0], dy = ty - c[1], dz = t[2] - c[2], L2 = dx * dx + dy * dy + dz * dz;
        const u = ((o.x - c[0]) * dx + (my - c[1]) * dy + (o.z - c[2]) * dz) / (L2 || 1);
        if (u < 0.02 || u > 0.92) continue;
        const px = c[0] + dx * u - o.x, py = c[1] + dy * u - my, pz = c[2] + dz * u - o.z;
        if (px * px + py * py * 0.5 + pz * pz < (r * 0.8 + 0.5) ** 2) { behind = true; break; }
      }
      if (behind || o.fade) o.fade = clamp((o.fade || 0) + (behind ? 3 : -3) * dt, 0, 0.72);
    }
  }
}
// the crater gives way to the cave: the hero walks into the mouth as the camera swings down behind it
function cvEnterUpdate(dt) {
  const run = G.run, h = G.hero.pos, hd = ARENA.hd;
  updateEnemies(dt);
  const tx = 0, tz = -hd - 4, dx = tx - h[0], dz = tz - h[2], d = Math.hypot(dx, dz) || 1, sp = Math.min(3.4, d / Math.max(dt, 1e-3));
  const vel = [dx / d * sp, 0, dz / d * sp];
  h[0] += vel[0] * dt; h[2] += vel[2] * dt;
  G.hero.update(dt, vel, true);
  CV.vig = 0.55 + 0.45 * Math.sin(CV.t * 7);
  if (CV.t > 1.9) CV.fadeTo = 1;
  if (CV.t > 2.6) { caveStart(); UI.toast('A / D to move · click to shoot', 3.2); }
}
// walking the rails from stop to stop
function cvWalk(dt) {
  const P = CV.pieces[CV.pi], path = P.path, h = G.hero.pos;
  let step = CAVE.walk * dt;
  while (step > 0) {
    if (CV.seg >= path.length - 1) { cvArrive(); return; }
    const a = path[CV.seg], b = path[CV.seg + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6;
    const left = (1 - CV.segU) * L;
    if (step < left) { CV.segU += step / L; step = 0; } else { step -= left; CV.seg++; CV.segU = 0; }
  }
  const a = path[CV.seg], b = path[Math.min(CV.seg + 1, path.length - 1)];
  const lx = lerp(a[0], b[0], CV.segU), lz = lerp(a[1], b[1], CV.segU);
  const w = cvW(P.F, lx, lz), vx = (w[0] - h[0]) / Math.max(dt, 1e-3), vz = (w[1] - h[2]) / Math.max(dt, 1e-3);
  h[0] = w[0]; h[2] = w[1];
  const dw = cvDirW(P.F, b[0] - a[0], b[1] - a[1]);
  if (Math.hypot(dw[0], dw[1]) > 1e-4) { CV.walkYaw = angleLerp(CV.walkYaw, Math.atan2(-dw[0], -dw[1]), Math.min(1, dt * 4)); G.hero.faceYaw = Math.atan2(dw[0], dw[1]); }
  G.hero.crouch = Math.max(0, (G.hero.crouch || 0) - dt * 3);
  G.hero.update(dt, [vx, 0, vz], true);
}
function cvDirW(F, lx, lz) { return [F.c * lx + F.s * lz, -F.s * lx + F.c * lz]; }
function cvHeroIdle(dt) { G.hero.update(dt, [0, 0, 0], true); }
// reaching the end of a piece's path: on to the next piece, or stop for a room, the fork or the boss
function cvArrive() {
  const P = CV.pieces[CV.pi];
  if (P.kind === 'room' && !P.done) { cvRoomStart(P); return; }
  if (P.kind === 'fork' && !CV.branch) { CV.phase = 'fork'; CV.t = 0; CV.forkLook = 0; return; }
  if (P.kind === 'boss' && !P.done) { bagStart(P); return; }
  if (CV.pi + 1 >= CV.pieces.length) return;
  CV.pi++; CV.seg = 0; CV.segU = 0;
}
// after a room is cleared: walk out through a gap in the covers to the room's far door, then on
function cvNext() {
  const P = CV.pieces[CV.pi], D = P.def;
  P.done = true;
  const gap = (xs, x) => { let best = 0, bd = 1e9; const cand = [0, -D.hw + 1.2, D.hw - 1.2]; xs.sort((a, b) => a - b); for (let i = 0; i < xs.length - 1; i++) cand.push((xs[i] + xs[i + 1]) / 2); for (const g of cand) { if (xs.some(c => Math.abs(c - g) < 1.9)) continue; const d = Math.abs(g - x); if (d < bd) { bd = d; best = g; } } return best; };
  const hx = CV.room.hx, g1 = gap(D.hero.slice(), hx), g2 = gap([...D.foe, ...D.mid].map(c => c[0]), g1);
  P.path = [[hx, CAVE.rail], [g1, CAVE.coverZ - 1.6], [g2, -D.len * 0.5], [g2 * 0.4, -D.len + 2.5], [0, -D.len]];
  CV.room = null;
  CV.phase = 'walk'; CV.seg = 0; CV.segU = 0; CV.t = 0;
}

// ---------- rooms ----------
function cvCover(P, lx, lz, hp, foe) {
  return { lx, lz, hw: 1.38, hd: 0.58, h: 1.4, hp, maxHp: hp, foe, model: 'cover' + Math.floor(Math.random() * 3), yaw: (Math.random() - 0.5) * 0.25, shake: 0, broken: false, flash: 0, drop: 1 };
}
// the rocks of a new room crash down from the ceiling one after another (near ones first), bounce and settle in
// a cloud of dust; `delay` holds them all back a moment
function cvDropCovers(Rm, delay = 0) {
  const list = Rm.covers.filter(c => !c.pillar).sort((a, b) => b.lz - a.lz || a.lx - b.lx);
  list.forEach((c, i) => { c.drop = 0; c.dropT = -(delay + i * 0.12); c.landed = false; });
}
function cvCoverDrops(dt, Rm) {
  for (const c of Rm.covers) {
    if (c.drop >= 1 || c.dropT === undefined) continue;
    c.dropT += dt;
    c.drop = clamp(c.dropT / 0.75, 0, 1);
    if (!c.landed && c.dropT >= 0.42) {
      c.landed = true; c.shake = 1;
      const w = cvW(Rm.F, c.lx, c.lz);
      FX.burst(w[0], 0.3, w[1], 12, [0.55, 0.48, 0.42], 5, 0.13, 0.6, 1, 2);
      for (let i = 0; i < 3; i++) FX.smoke(w[0] + rand(-1.2, 1.2), rand(0.2, 0.7), w[1] + rand(-0.6, 0.6), 0.9, [0.55, 0.5, 0.44], 1.3, 0.5);
      FX.crack(w[0], w[1], 1.5, 2);
      G.cam.shake = Math.max(G.cam.shake, 0.12); AUDIO.play('crumble', 0.6);
    }
    // dust trickling from the ceiling where it falls from
    if (c.dropT < 0.42 && c.dropT > -0.3 && Math.random() < dt * 25) { const w = cvW(Rm.F, c.lx + rand(-1, 1), c.lz + rand(-0.4, 0.4)); FX.part(w[0], CAVE.ceil, w[1], 0, -2, 0, 0.12, 0.08, 1, [0.5, 0.45, 0.4], 0.8, 2, -9, 0); }
  }
}
// how high a dropping rock still is: a fall from the ceiling with one bounce
function cvDropY(c) {
  if (c.drop >= 1 || c.dropT === undefined) return 0;
  const t = c.dropT;
  if (t < 0) return 99;
  if (t < 0.42) { const u = t / 0.42; return CAVE.ceil * (1 - u * u); }
  const b = (t - 0.42) / 0.33; return Math.sin(clamp(b, 0, 1) * Math.PI) * 0.45;
}
function cvRoomStart(P) {
  const D = P.def;
  CV.room = { P, D, F: P.F, hx: 0, hvx: 0, stand: 0, upT: 0, covers: [], foes: [], waves: D.waves.map(w => w.slice()), waveT: 1.4, waveN: 0, spawnI: 0, clearT: -1 };
  for (const x of D.hero) CV.room.covers.push(cvCover(P, x, CAVE.coverZ, CAVE.coverHp, false));
  for (const [x, z] of D.mid) CV.room.covers.push(cvCover(P, x, z, CAVE.foeCoverHp, true));
  for (const [x, z] of D.foe) CV.room.covers.push(cvCover(P, x, z, CAVE.foeCoverHp, true));
  CV.phase = 'fight'; CV.t = 0;
  cvDropCovers(CV.room);
  // the first wave is already in place, crouched behind its rocks (and waits until the rocks are down)
  cvWave(true);
  for (const f of CV.room.foes) f.t -= 1.3;
}
// send in the next wave: crossbowmen and spearmen take a rock each; shieldmen march in from the far door;
// moles burst out of the side walls
function cvWave(first) {
  const Rm = CV.room, list = Rm.waves.shift();
  if (!list) return;
  Rm.waveN++;
  const far = Rm.covers.filter(c => c.foe && !c.broken && c.lz < -15), all = Rm.covers.filter(c => c.foe && !c.broken);
  for (const type of list) {
    const T = CAVE_FOES[type], f = { type, T, hp: T.hp, maxHp: T.hp, lx: 0, lz: -Rm.D.len + 1.5, y: 0, sink: 0, state: 'enter', t: 0, yaw: 0, flash: 0, ph: Math.random(), clip: 'run', u: 0, cover: null, throws: 0, tint: hexToRgb(T.tint), dying: 0, peekX: 0 };
    if (type === 'xbow' || type === 'spear') {
      const free = (type === 'xbow' ? far : all).filter(c => !Rm.foes.some(o => o.cover === c && !o.dying)), c = free.length ? pick(free) : pick(all.length ? all : Rm.covers);
      f.cover = c;
      f.tx = c.lx + rand(-0.5, 0.5); f.tz = c.lz - 1.15;
      if (first) { f.lx = f.tx; f.lz = f.tz; f.state = 'hide'; f.t = rand(0.6, 2.0) + Rm.foes.length * 0.5; f.sink = 1; }
      else { f.lx = rand(-2.5, 2.5); f.lz = -Rm.D.len + 1; }
    } else if (type === 'goblin') {
      const free = all.filter(c => !Rm.foes.some(o => o.cover === c && !o.dying)), c = free.length ? pick(free) : pick(all.length ? all : Rm.covers);
      f.cover = c; f.tx = c.lx + rand(-0.4, 0.4); f.tz = c.lz - 1.1;
      if (first) { f.lx = f.tx; f.lz = f.tz; f.state = 'hide'; f.t = rand(0.8, 2.2) + Rm.foes.length * 0.4; f.sink = 1; } else { f.lx = rand(-2.5, 2.5); f.lz = -Rm.D.len + 1; }
    } else if (type === 'spider') {
      f.lx = rand(-Rm.D.hw + 1.5, Rm.D.hw - 1.5); f.lz = rand(-10.5, -16); f.y = CAVE.ceil; f.state = 'drop'; f.t = -Rm.foes.filter(o => o.type === 'spider').length * 0.4 - (first ? 1.2 : 0);
    } else if (type === 'bat') {
      const n = Rm.foes.filter(o => o.type === 'bat').length;
      f.lx = rand(-3, 3) + (n % 2 ? 2 : -2); f.lz = -Rm.D.len + 1 - n * 1.2; f.y = rand(3, 4.2); f.state = 'fly'; f.t = 0;
    } else if (type === 'ogre' || type === 'golem') { f.lx = rand(-3, 3); f.lz = -Rm.D.len + 1; f.state = 'march'; f.throws = 0; }
    else if (type === 'shield') { f.lx = rand(-3, 3); f.lz = -Rm.D.len + 1; f.state = 'march'; }
    else if (type === 'mole') {
      const sx = Math.random() < 0.5 ? -1 : 1;
      f.lx = sx * (Rm.D.hw - 0.4); f.lz = rand(-11, -18); f.state = 'burst'; f.t = -Rm.foes.filter(o => o.type === 'mole').length * 0.45;
    }
    Rm.foes.push(f);
  }
  if (!first) AUDIO.play('horn', 0.5);
}
// the hero in a fight: slide along the rail, duck behind the rocks, pop up to shoot
function cvHeroRail(dt, Rm) {
  const hero = G.hero, F = Rm.F;
  Rm.hvx += (G.input.x * CAVE.slide - Rm.hvx) * (1 - Math.exp(-dt * 11));
  const lim = Rm.D.hw - 1.0;
  Rm.hx = clamp(Rm.hx + Rm.hvx * dt, -lim, lim);
  if (Math.abs(Rm.hx) >= lim) Rm.hvx = 0;
  Rm.upT -= dt;
  const want = Rm.upT > 0 ? 1 : 0;
  Rm.stand += (want - Rm.stand) * (1 - Math.exp(-dt * (want ? 24 : 8)));
  hero.crouch = 1 - Rm.stand;
  const w = cvW(F, Rm.hx, CAVE.rail);
  V3.set(hero.pos, w[0], 0, w[1]);
  hero.faceYaw = F.yaw + Math.PI;
  const v = cvDirW(F, Rm.hvx, 0);
  hero.update(dt, [v[0], 0, v[1]], true);
}
const cvHeroTop = Rm => lerp(CAVE.crouchTop, CAVE.standTop, Rm.stand);
function cvFight(dt) {
  const Rm = CV.room;
  cvCoverDrops(dt, Rm);
  cvHeroRail(dt, Rm);
  cvAimAndShoot(Rm);
  for (const c of Rm.covers) { c.shake = Math.max(0, c.shake - dt * 3); c.flash = Math.max(0, c.flash - dt * 3); }
  for (const f of Rm.foes) cvFoe(f, dt, Rm);
  Rm.foes = Rm.foes.filter(f => !(f.dying >= 1));
  const alive = Rm.foes.filter(f => !f.dying).length;
  // the next wave comes in once this one is nearly done
  if (Rm.waves.length && alive <= 1) { Rm.waveT -= dt; if (Rm.waveT <= 0) { cvWave(false); Rm.waveT = 1.6; } }
  if (!Rm.waves.length && !alive && CV.phase === 'fight') cvRoomClear();
}
function cvRoomClear() {
  const run = G.run, Rm = CV.room, left = CV.branch === 'L';
  CV.roomsDone++;
  CV.phase = 'clear'; CV.t = 0;
  run.hp = Math.min(run.maxHp, run.hp + run.maxHp * 0.2);
  const coins = Math.round(25 * (1 + 0.15 * CV.roomsDone));
  run.coins += coins;
  addNumberAt(G.hero.pos[0], 2.6, G.hero.pos[2], coins, [1, 0.85, 0.3]);
  // the long way in makes you stronger for the Bagger
  if (left && Rm.P.id !== 'A') { CV.dmgMul += 0.12; UI.toast('+12% shot damage', 1.8); }
  UI.banner('ROOM CLEAR');
  AUDIO.play('levelup');
  Rm.upT = 0;
}

// ---------- aiming and the hero's shots ----------
// the mouse crosshair is a ray from the camera; the shot flies from the blob toward whatever that ray hits first
function cvAimRay() {
  const nx = ((INPUT.mx ?? R.cssW / 2) / R.cssW) * 2 - 1, ny = 1 - ((INPUT.my ?? R.cssH / 2) / R.cssH) * 2;
  const a = M4.transformPoint([0, 0, 0], R.cam.invViewProj, nx, ny, -1), b = M4.transformPoint([0, 0, 0], R.cam.invViewProj, nx, ny, 1);
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(...d);
  return { o: R.cam.pos.slice(), d: [d[0] / l, d[1] / l, d[2] / l] };
}
// march along a world ray and return the first thing it touches: { t, p, kind, foe }
function cvRayHit(o, d, maxT = 90) {
  for (let t = 0.5; t < maxT; t += 0.18) {
    const x = o[0] + d[0] * t, y = o[1] + d[1] * t, z = o[2] + d[2] * t;
    if (y <= 0) return { t, p: [x, 0, z], kind: 'floor' };
    const hit = cvHitAt(x, y, z, true);
    if (hit) return { t, p: [x, y, z], ...hit };
  }
  return { t: maxT, p: [o[0] + d[0] * maxT, o[1] + d[1] * maxT, o[2] + d[2] * maxT], kind: 'none' };
}
// what a point in the world is inside of (enemy head/body/shield, a rock, the boss, the walls)
function cvHitAt(x, y, z, forAim) {
  const Rm = CV.room;
  if (!Rm) return null;
  const l = cvL(Rm.F, x, z, _cw), lx = l[0], lz = l[1];
  if (CV.boss) { const b = bagHitAt(lx, y, lz); if (b) return b; }
  for (const f of Rm.foes) {
    if (f.dying) continue;
    const s = f.T.scale, fy = f.y - f.sink * 0.95 * s, dx = lx - f.lx, dz = lz - f.lz;
    if (Math.abs(dx) > 1.2 * s || Math.abs(dz) > 1.2 * s) continue;
    // a bat is all body, up in the air
    if (f.T.fly) { if (Math.hypot(dx, y - fy, dz) < 0.32 * s + 0.08) return { kind: 'body', foe: f }; continue; }
    const head = f.T.head ? [f.T.head, f.T.headR] : f.type === 'mole' ? [0.85, 0.2] : [0.975, 0.17];
    if (Math.hypot(dx, y - (fy + head[0] * s), dz) < head[1] * s + 0.06) return { kind: 'head', foe: f };
    if (f.T.body) { const B = f.T.body, by2 = clamp(y, fy + B[0] * s, fy + B[1] * s); if (y > fy && Math.hypot(dx, y - by2, dz) < B[2] * s) return { kind: 'body', foe: f }; continue; }
    if (f.type === 'shield' && cvShieldUp(f)) {
      const fwd = cvToHero(f), sx = f.lx + fwd[0] * 0.38 * s, sz = f.lz + fwd[1] * 0.38 * s;
      if (Math.hypot(lx - sx, lz - sz) < 0.36 * s && y > fy + 0.1 * s && y < fy + 0.92 * s) return { kind: 'shield', foe: f };
    }
    const by = clamp(y, fy + 0.15 * s, fy + 0.85 * s);
    if (y > fy && Math.hypot(dx, y - by, dz) < 0.21 * s + 0.08) return { kind: 'body', foe: f };
  }
  for (const c of Rm.covers) {
    if (Math.abs(lx - c.lx) < c.hw && Math.abs(lz - c.lz) < c.hd && y < (c.broken ? 0.35 : c.h)) return { kind: 'cover', cover: c };
  }
  if (Math.abs(lx) > (Rm.D.wallHw ?? Rm.D.hw) + 0.3 || lz < -Rm.D.len - 0.3 || y > CAVE.ceil) return { kind: 'wall' };
  return null;
}
const cvShieldUp = f => !(f.state === 'bash' && f.t > 0.45) && f.state !== 'recover';
function cvToHero(f) { const dx = CV.room.hx - f.lx, dz = CAVE.rail - f.lz, d = Math.hypot(dx, dz) || 1; return [dx / d, dz / d]; }
function caveClick() { if (CV && (CV.phase === 'fight' || CV.phase === 'boss')) CV.clickT = 0.14; else if (CV && CV.phase === 'fork') CV.forkClick = true; }
function cvAimAndShoot(Rm) {
  const ray = cvAimRay(), hit = cvRayHit(ray.o, ray.d);
  CV.aim = hit;
  CV.clickT = (CV.clickT || 0) - 1 / 60;
  if (CV.clickT > 0 && CV.shotCd <= 0) {
    CV.clickT = 0; CV.shotCd = CAVE.shotCd;
    Rm.upT = CAVE.upHold;
    // fire from the top of the blob (it pops up as it shoots)
    Rm.stand = Math.max(Rm.stand, 0.85);
    const hero = G.hero, top = cvHeroTop(Rm), fw = cvDirW(Rm.F, 0, -1);
    const o = [hero.pos[0] + fw[0] * 0.45, top - 0.32, hero.pos[2] + fw[1] * 0.45];
    const tx = hit.p[0] - o[0], ty = hit.p[1] - o[1], tz = hit.p[2] - o[2], tl = Math.hypot(tx, ty, tz) || 1;
    CV.shots.push({ x: o[0], y: o[1], z: o[2], vx: tx / tl * CAVE.shotV, vy: ty / tl * CAVE.shotV, vz: tz / tl * CAVE.shotV, t: 0, ph: Math.random() * 10 });
    const arm = hero.freeArm(hit.p) >= 0 ? hero.freeArm(hit.p) : 0;
    hero.punch(arm, [o[0] + tx / tl * 2, o[1] + ty / tl * 2, o[2] + tz / tl * 2], 0.8, null);
    hero.impulse(0.6);
    AUDIO.play('gooshot', rand(0.9, 1.1));
  }
}
function cvShots(dt) {
  for (const s of CV.shots) {
    s.t += dt;
    const n = Math.ceil(Math.hypot(s.vx, s.vy, s.vz) * dt / 0.25);
    for (let i = 0; i < n && !s.done; i++) {
      s.x += s.vx * dt / n; s.y += s.vy * dt / n; s.z += s.vz * dt / n;
      if (s.y <= 0.02) { s.done = true; FX.splat(s.x, s.z, 0.35, R.goo.base, 1.5); break; }
      const hit = cvHitAt(s.x, s.y, s.z);
      if (hit) { s.done = true; cvShotHit(s, hit); }
    }
    if (s.t > 2.5) s.done = true;
  }
  CV.shots = CV.shots.filter(s => !s.done);
}
function cvShotHit(s, hit) {
  const dmg = CAVE.shotDmg * CV.dmgMul * (G.run.stats ? G.run.stats.dmgMul : 1);
  FX.droplets(s.x, s.y, s.z, 6, 0, 3, 0.05, null);
  if (hit.kind === 'head' || hit.kind === 'body') {
    const f = hit.foe, armor = hit.kind === 'body' && f.T.armor ? f.T.armor : 1, d = dmg * (hit.kind === 'head' ? 2 : armor);
    cvHurtFoe(f, d, hit.kind === 'head');
    CV.hitMark = 1; CV.hitHead = hit.kind === 'head';
    if (armor < 1) AUDIO.play('clang'); else AUDIO.play('hit');
  } else if (hit.kind === 'shield') {
    FX.burst(s.x, s.y, s.z, 6, [1, 0.85, 0.4], 3, 0.05, 0.25, 1); AUDIO.play('clang'); hit.foe.flash = 0.1;
  } else if (hit.kind === 'cover') cvHurtCover(hit.cover, dmg * 0.6, s);
  else if (hit.kind && hit.kind.startsWith('bag')) bagShotHit(hit, dmg, s);
  else FX.burst(s.x, s.y, s.z, 4, [0.5, 0.45, 0.4], 2, 0.05, 0.3, 1);
}
function cvHurtFoe(f, d, head) {
  f.hp -= d; f.flash = 0.12;
  const w = cvW3(CV.room.F, f.lx, f.y + f.T.scale * 1.3, f.lz);
  addNumberAt(w[0], w[1] + 0.2, w[2], d, head ? [1, 0.85, 0.25] : null);
  if (f.hp <= 0 && !f.dying) {
    f.dying = 0.001; CV.kills++; G.run.kills++;
    FX.droplets(w[0], f.T.scale * 0.8, w[2], 14, 4, 4, 0.08, ORANGE);
    G.run.coins += 2;
    AUDIO.play('squish');
  }
}
function cvHurtCover(c, d, at) {
  if (c.broken) return;
  c.hp -= d; c.shake = 1; c.flash = 1;
  const w = cvW(CV.room.F, c.lx, c.lz);
  FX.burst(at ? at.x : w[0], at ? at.y : c.h, at ? at.z : w[1], 4, [0.55, 0.48, 0.42], 3, 0.07, 0.4, 1, 2);
  if (c.hp <= 0) {
    c.broken = true;
    for (let i = 0; i < 4; i++) FX.smoke(w[0] + rand(-1, 1), rand(0.3, 1.2), w[1] + rand(-0.5, 0.5), 0.7, [0.5, 0.45, 0.4], 1.4, 0.5);
    FX.burst(w[0], 0.8, w[1], 18, [0.55, 0.48, 0.42], 6, 0.16, 0.8, 1, 3);
    AUDIO.play('crumble');
    G.cam.shake = Math.max(G.cam.shake, 0.1);
  }
}

// ---------- the enemies ----------
function cvFoe(f, dt, Rm) {
  const T = f.T, s = T.scale;
  f.flash = Math.max(0, f.flash - dt);
  if (f.dying) { f.dying += dt / 0.35; return; }
  f.t += dt;
  const toH = cvToHero(f);
  f.yaw = angleLerp(f.yaw, Math.atan2(toH[0], toH[1]), Math.min(1, dt * 8));
  const moveTo = (tx, tz, sp) => {
    const dx = tx - f.lx, dz = tz - f.lz, d = Math.hypot(dx, dz);
    if (d < 0.08) return true;
    const k = Math.min(1, sp * dt / d);
    f.lx += dx * k; f.lz += dz * k; f.ph += sp * dt / (0.85 * s);
    f.clip = 'run';
    f.yaw = angleLerp(f.yaw, Math.atan2(dx, dz), Math.min(1, dt * 10));
    return false;
  };
  // in close, each one picks its own spot a little to one side of the hero
  f.mx = f.mx ?? rand(-0.7, 0.7);
  const meleeX = clamp(Rm.hx + f.mx, -Rm.D.hw + 1, Rm.D.hw - 1);
  if (f.cover && f.cover.broken && (f.state === 'hide')) f.t = Math.max(f.t, 99);
  if (f.T.fly || ['spider', 'goblin', 'ogre', 'golem'].includes(f.type)) { cvFoeDeep(f, dt, Rm, moveTo, meleeX); return; }
  switch (f.type) {
    case 'xbow': {
      if (f.state === 'enter') { f.sink = 0; if (moveTo(f.tx, f.tz, 3.6)) { f.state = 'hide'; f.t = rand(0.4, 1.2); } break; }
      if (f.state === 'hide') {
        f.sink = Math.min(1, f.sink + dt * 4); f.clip = 'idle';
        if (f.t > (f.cover && f.cover.broken ? 0.4 : rand(1.6, 2.8)) || f.t > 3) { f.state = 'rise'; f.t = 0; f.peekX = !f.cover.broken && Math.random() < 0.35 ? (Math.random() < 0.5 ? -1 : 1) * (f.cover.hw + 0.55) : 0; }
        break;
      }
      if (f.state === 'rise') {
        f.sink = Math.max(0, f.sink - dt * (f.peekX ? 2 : 4)); f.clip = 'aim'; f.u = 0;
        if (f.peekX) moveTo(f.cover.lx + f.peekX, f.tz + 0.5, 4.5);
        if (f.t > 0.28) { f.state = 'aim'; f.t = 0; f.aimX = Rm.hx; AUDIO.play('twang', 0.6); }
        break;
      }
      if (f.state === 'aim') {
        f.sink = 0; f.clip = 'aim'; f.u = clamp(f.t / 0.85, 0, 0.7);
        // the aim follows the hero, then locks for the last moment before the shot
        if (f.t < 0.6) f.aimX = lerp(f.aimX, Rm.hx, Math.min(1, dt * 3));
        if (f.t > 0.85) { cvFireBolt(f, Rm); f.state = 'lower'; f.t = 0; }
        break;
      }
      if (f.state === 'lower') {
        f.clip = 'aim'; f.u = 0.85;
        if (f.t > 0.22) { f.sink = Math.min(1, f.sink + dt * 4); if (f.peekX) moveTo(f.tx, f.tz, 4.5); }
        if (f.t > 0.5) { f.state = 'hide'; f.t = 0; }
      }
      break;
    }
    case 'spear': {
      if (f.state === 'enter') { f.sink = 0; if (moveTo(f.tx, f.tz, 3.4)) { f.state = 'hide'; f.t = rand(0.3, 1); } break; }
      if (f.state === 'hide') {
        f.sink = Math.min(1, f.sink + dt * 4); f.clip = 'idle';
        if (f.t > rand(1.1, 1.8)) { f.state = f.throws >= 2 ? 'advance' : 'throw'; f.t = 0; }
        break;
      }
      if (f.state === 'throw') {
        f.sink = Math.max(0, f.sink - dt * 5); f.clip = 'throw'; f.u = clamp(f.t / 0.9, 0, 0.99);
        if (f.t > 0.5 && !f.thrown) { f.thrown = true; cvThrowSpear(f, Rm); }
        if (f.t > 0.9) { f.thrown = false; f.throws++; f.state = 'hide'; f.t = 0; }
        break;
      }
      if (f.state === 'advance') {
        f.sink = 0;
        // to a rock nearer the hero if there is a free one, otherwise all the way in
        if (!f.next) {
          const cand = Rm.covers.filter(c => c.foe && !c.broken && c.lz > f.lz + 3 && !Rm.foes.some(o => o !== f && o.cover === c && !o.dying));
          f.next = cand.length ? cand.sort((a, b) => Math.abs(a.lx - f.lx) - Math.abs(b.lx - f.lx))[0] : 'melee';
        }
        if (f.next === 'melee') { f.state = 'close'; f.t = 0; f.next = null; break; }
        if (moveTo(f.next.lx, f.next.lz - 1.15, 3.6)) { f.cover = f.next; f.next = null; f.throws = 1; f.state = 'hide'; f.t = 0; }
        break;
      }
      if (f.state === 'close') { f.sink = 0; if (moveTo(meleeX, CAVE.meleeZ, 3.4)) { f.state = 'stab'; f.t = 0; } break; }
      if (f.state === 'stab') {
        f.clip = 'slam'; f.u = clamp(f.t / 1.0, 0, 0.99);
        if (f.t < 0.5) moveTo(meleeX, CAVE.meleeZ, 1.2);
        if (f.t > 0.62 && !f.hit) { f.hit = true; if (Math.abs(Rm.hx - f.lx) < 1.5) cvHurtHero(CAVE.stabDmg, f); FX.burst(...cvW3(Rm.F, f.lx, 1.2, f.lz + 1.2), 5, [0.9, 0.9, 1], 3, 0.05, 0.2, 1); }
        if (f.t > 1.15) { f.hit = false; f.t = 0; }
      }
      break;
    }
    case 'shield': {
      if (f.state === 'march') { f.clip = 'run'; if (moveTo(meleeX, CAVE.meleeZ, 1.75)) { f.state = 'bash'; f.t = 0; } break; }
      if (f.state === 'bash') {
        f.clip = 'slam'; f.u = clamp(f.t / 1.1, 0, 0.99);
        if (f.t < 0.4) moveTo(meleeX, CAVE.meleeZ, 1.4);
        if (f.t > 0.7 && !f.hit) { f.hit = true; if (Math.abs(Rm.hx - f.lx) < 1.7) cvHurtHero(CAVE.bashDmg, f); G.cam.shake = Math.max(G.cam.shake, 0.08); AUDIO.play('punch'); }
        if (f.t > 1.1) { f.hit = false; f.state = 'recover'; f.t = 0; }
        break;
      }
      if (f.state === 'recover') { f.clip = 'idle'; if (f.t > 0.75) { f.state = 'march'; f.t = 0; } }
      break;
    }
    case 'mole': {
      if (f.state === 'burst') {
        f.sink = 1;
        if (f.t > 0) {
          f.state = 'dash'; f.t = 0; f.sink = 0;
          const w = cvW(Rm.F, f.lx, f.lz);
          FX.burst(w[0], 1.2, w[1], 16, [0.42, 0.34, 0.26], 5, 0.14, 0.7, 1, 3);
          AUDIO.play('crumble', 0.8);
        }
        break;
      }
      if (f.state === 'dash') {
        // zigzag in toward the hero
        const zx = Math.sin(f.t * 5 + f.ph * 6) * 2.2;
        if (moveTo(meleeX + (f.lz < CAVE.meleeZ - 3 ? zx : 0), CAVE.meleeZ, 5.6)) { f.state = 'claw'; f.t = 0; }
        break;
      }
      if (f.state === 'claw') {
        f.clip = 'slam'; f.u = clamp(f.t / 0.75, 0, 0.99);
        if (f.t < 0.25) moveTo(meleeX, CAVE.meleeZ, 2.5);
        if (f.t > 0.38 && !f.hit) { f.hit = true; if (Math.abs(Rm.hx - f.lx) < 1.3) cvHurtHero(CAVE.clawDmg, f); }
        if (f.t > 0.75) { f.hit = false; f.t = 0; f.state = Math.abs(Rm.hx - f.lx) > 1.3 ? 'dash' : 'claw'; }
      }
      break;
    }
  }
}
// the deep mine's crowd
function cvFoeDeep(f, dt, Rm, moveTo, meleeX) {
  const s = f.T.scale;
  switch (f.type) {
    case 'spider': {
      if (f.state === 'drop') {
        // down from the ceiling on a silk thread, then a skittering dash in
        if (f.t < 0) { f.y = CAVE.ceil + 1; break; }
        f.y = Math.max(0, CAVE.ceil * (1 - (f.t / 0.7) ** 2));
        f.clip = 'run'; f.ph += dt * 2;
        if (f.y <= 0) { f.y = 0; f.state = 'dash'; f.t = 0; const w = cvW(Rm.F, f.lx, f.lz); FX.burst(w[0], 0.2, w[1], 8, [0.5, 0.45, 0.4], 3, 0.08, 0.4, 1, 2); AUDIO.play('thud', 0.5); }
        break;
      }
      // (a spider is lower than the hero's rocks: where one stands in its way it climbs up on top of it and bites down
      // from there, in plain sight)
      const rock = Rm.covers.find(c => !c.foe && !c.pillar && !c.broken && Math.abs(c.lx - f.lx) < c.hw + 0.25 && f.lz > c.lz - 2.2);
      const meleeZ = rock ? rock.lz : CAVE.meleeZ;
      f.y += ((rock && f.state !== 'drop' ? rock.h * 0.92 : 0) - f.y) * Math.min(1, dt * 9);
      if (f.state === 'dash') {
        const zx = Math.sin(f.t * 7 + f.ph * 6) * 1.6;
        if (moveTo(meleeX + (f.lz < meleeZ - 2.5 ? zx : 0), meleeZ, 6.8)) { f.state = 'claw'; f.t = 0; }
        f.ph += dt * 3;
        break;
      }
      if (f.state === 'claw') {
        f.clip = 'slam'; f.u = clamp(f.t / 0.6, 0, 0.99);
        if (f.t < 0.2) moveTo(meleeX, meleeZ, 2.5);
        if (f.t > 0.42 && !f.hit) { f.hit = true; if (Math.abs(Rm.hx - f.lx) < 1.3) cvHurtHero(CAVE.biteDmg, f); AUDIO.play('squish', 0.6); }
        if (f.t > 0.6) { f.hit = false; f.t = 0; f.state = Math.abs(Rm.hx - f.lx) > 1.3 ? 'dash' : 'claw'; }
      }
      break;
    }
    case 'bat': {
      // weave in high up, then swoop at the hero's head, then climb away and come round again
      f.clip = 'run'; f.ph += dt * 3.2;
      if (f.state === 'fly') {
        const tz = -11.5 + Math.sin(f.ph * 0.4) * 1.5;
        f.y += (3.4 + Math.sin(f.t * 3 + f.ph) * 0.5 - f.y) * Math.min(1, dt * 2);
        moveTo(clamp(Rm.hx + Math.sin(f.t * 1.7 + f.ph) * 4, -Rm.D.hw + 1, Rm.D.hw - 1), tz, 5.5);
        f.clip = 'run';
        if (f.t > 1.6 + (f.ph % 1)) { f.state = 'dive'; f.t = 0; f.dx = Rm.hx; AUDIO.play('whistle', 0.4); }
        break;
      }
      if (f.state === 'dive') {
        const ty = cvHeroTop(Rm) - 0.15, dx = f.dx - f.lx, dz = CAVE.rail - 0.3 - f.lz, dy = ty - f.y, d = Math.hypot(dx, dy, dz);
        f.dx = lerp(f.dx, Rm.hx, Math.min(1, dt * 2));
        const sp = 9.5 * dt / Math.max(d, 1e-3);
        f.lx += dx * Math.min(1, sp); f.lz += dz * Math.min(1, sp); f.y += dy * Math.min(1, sp);
        f.yaw = Math.atan2(dx, dz);
        if (d < 0.75) { if (Math.abs(Rm.hx - f.lx) < 0.9) cvHurtHero(CAVE.batDmg, f); f.state = 'climb'; f.t = 0; }
        if (f.t > 2.2) { f.state = 'climb'; f.t = 0; }
        break;
      }
      if (f.state === 'climb') {
        f.y += (4 - f.y) * Math.min(1, dt * 2.5);
        moveTo(f.lx + rand(-0.5, 0.5), -12.5, 6);
        if (f.t > 1.1) { f.state = 'fly'; f.t = 0; }
      }
      break;
    }
    case 'goblin': {
      if (f.state === 'enter') { f.sink = 0; if (moveTo(f.tx, f.tz, 4.2)) { f.state = 'hide'; f.t = rand(0.4, 1.2); } break; }
      if (f.state === 'hide') {
        f.sink = Math.min(1, f.sink + dt * 4); f.clip = 'idle';
        if (f.t > (f.cover && f.cover.broken ? 0.4 : rand(1.4, 2.4)) || f.t > 3) { f.state = 'throw'; f.t = 0; }
        break;
      }
      if (f.state === 'throw') {
        // (a goblin is shorter than its rock: it hops up on top of it to throw, and that is when to hit it)
        f.sink = Math.max(0, f.sink - dt * 5); f.clip = 'throw'; f.u = clamp(f.t / 0.9, 0, 0.99);
        f.y = 0.8 * Math.sin(clamp(f.t / 0.9, 0, 1) * Math.PI);
        if (f.t > 0.5 && !f.thrown) { f.thrown = true; cvLob(f, Rm, 'dyn'); }
        if (f.t > 0.9) { f.thrown = false; f.y = 0; f.state = 'hide'; f.t = 0; }
      }
      break;
    }
    case 'ogre': {
      // lumber in to the middle of the room, hurl two boulders, then come all the way in and smash
      if (f.state === 'march') { f.clip = 'run'; if (moveTo(clamp(Rm.hx * 0.5, -4, 4), -12.5, 1.5)) { f.state = f.throws >= 2 ? 'close' : 'heave'; f.t = 0; } break; }
      if (f.state === 'heave') {
        f.clip = 'throw'; f.u = clamp(f.t / 1.2, 0, 0.99);
        if (f.t > 0.7 && !f.thrown) { f.thrown = true; cvLob(f, Rm, 'boulder'); G.cam.shake = Math.max(G.cam.shake, 0.06); }
        if (f.t > 1.4) { f.thrown = false; f.throws++; f.state = f.throws >= 2 ? 'close' : 'wait'; f.t = 0; }
        break;
      }
      if (f.state === 'wait') { f.clip = 'idle'; if (f.t > 1.0) { f.state = 'heave'; f.t = 0; } break; }
      if (f.state === 'close') { if (moveTo(meleeX, CAVE.meleeZ - 0.4, 1.9)) { f.state = 'smash'; f.t = 0; } break; }
      if (f.state === 'smash') {
        f.clip = 'slam'; f.u = clamp(f.t / 1.4, 0, 0.99);
        if (f.t > 0.9 && !f.hit) {
          f.hit = true; G.cam.shake = Math.max(G.cam.shake, 0.25); AUDIO.play('boom', 0.7);
          const w = cvW(Rm.F, f.lx, f.lz + 1.4); FX.burst(w[0], 0.3, w[1], 16, [0.55, 0.48, 0.42], 6, 0.14, 0.6, 1, 3); FX.crack(w[0], w[1], 1.8, 2.5);
          if (Math.abs(Rm.hx - f.lx) < 2.0) cvHurtHero(CAVE.smashDmg, f);
          for (const c of Rm.covers) if (!c.foe && !c.pillar && Math.abs(c.lx - f.lx) < 2) cvHurtCover(c, 70, null);
        }
        if (f.t > 1.8) { f.hit = false; f.t = 0; }
      }
      break;
    }
    case 'golem': {
      // march in, then plant its feet: the core blazes and it fires a fan of three crystal shards; hurt enough, it
      // comes in close to pound
      const glow = f.state === 'charge' ? clamp(f.t / 0.9, 0, 1) : 0;
      f.glow = glow;
      if (f.state === 'march') { f.clip = 'run'; if (moveTo(clamp(Rm.hx * 0.4, -4, 4), f.hp < f.maxHp * 0.5 ? CAVE.meleeZ - 0.3 : -13, 1.3)) { f.state = f.hp < f.maxHp * 0.5 ? 'slam' : 'charge'; f.t = 0; } break; }
      if (f.state === 'charge') {
        f.clip = 'aim'; f.u = clamp(f.t / 0.9, 0, 0.7);
        if (f.t < dt * 1.5) AUDIO.play('laser', 0.5);
        if (f.t > 0.9) { cvShards(f, Rm); f.state = 'cool'; f.t = 0; }
        break;
      }
      if (f.state === 'cool') { f.clip = 'idle'; if (f.t > 1.3) { f.state = f.hp < f.maxHp * 0.5 ? 'march' : 'charge'; f.t = 0; } break; }
      if (f.state === 'slam') {
        f.clip = 'slam'; f.u = clamp(f.t / 1.2, 0, 0.99);
        if (f.t > 0.75 && !f.hit) { f.hit = true; G.cam.shake = Math.max(G.cam.shake, 0.18); AUDIO.play('boom', 0.6); if (Math.abs(Rm.hx - f.lx) < 1.8) cvHurtHero(CAVE.golemDmg, f); }
        if (f.t > 1.5) { f.hit = false; f.t = 0; }
      }
      break;
    }
  }
}
// something lobbed onto a marked circle where the hero is: a goblin's dynamite (it lands, its fuse burns down and
// it blows, hurting the hero and the rocks nearby) or an ogre's boulder (it crashes down)
function cvLob(f, Rm, kind) {
  const s = f.T.scale, F = Rm.F, tx = clamp(Rm.hx + rand(-0.7, 0.7), -Rm.D.hw + 1, Rm.D.hw - 1), tz = CAVE.rail + rand(-0.4, 0.2);
  const o = cvW3(F, f.lx, 1.5 * s, f.lz), t = cvW3(F, tx, 0, tz), dur = kind === 'boulder' ? 1.25 : 0.95, r = kind === 'boulder' ? CAVE.boulderR : CAVE.dynR;
  CV.spears.push({ sx: o[0], sy: o[1], sz: o[2], tx: t[0], tz: t[2], lx: tx, lz: tz, t: 0, dur, x: o[0], y: o[1], z: o[2], kind, r, dmg: kind === 'boulder' ? CAVE.boulderDmg : CAVE.dynDmg, peak: kind === 'boulder' ? 3.2 : 3.8, spin: rand(0, TAU) });
  addTele({ kind: 'circle', x: t[0], z: t[2], r, dur: dur + (kind === 'dyn' ? 0.55 : 0) });
  AUDIO.play('throw');
}
// three crystal shards in a fan toward the hero's head
function cvShards(f, Rm) {
  const s = f.T.scale, F = Rm.F;
  for (const off of [-1.6, 0, 1.6]) {
    const o = [f.lx, 0.66 * s, f.lz + 0.3 * s], ty = cvHeroTop(Rm) - 0.3, tx = Rm.hx + off, tz = CAVE.rail;
    const dx = tx - o[0], dy = ty - o[1], dz = tz - o[2], d = Math.hypot(dx, dy, dz) || 1, w = cvW3(F, o[0], o[1], o[2]), v = cvDirW(F, dx / d, dz / d), sp = 21;
    CV.bolts.push({ x: w[0], y: w[1], z: w[2], vx: v[0] * sp, vy: dy / d * sp, vz: v[1] * sp, t: 0, dmg: CAVE.shardDmg, crys: true });
  }
  const w = cvW3(F, f.lx, 0.66 * s, f.lz); FX.burst(w[0], w[1], w[2], 12, [0.5, 0.95, 1], 5, 0.08, 0.4, 1);
  AUDIO.play('shoot', 0.7);
}
// a crossbow bolt, aimed where the hero's head is (or where the blob is crouched behind its rock)
function cvFireBolt(f, Rm) {
  const s = f.T.scale, F = Rm.F;
  const o = [f.lx + Math.sin(f.yaw) * 0.45 * s, 0.82 * s, f.lz + Math.cos(f.yaw) * 0.45 * s];
  const ty = cvHeroTop(Rm) - 0.32, tx = f.aimX + rand(-0.15, 0.15), tz = CAVE.rail;
  const dx = tx - o[0], dy = ty - o[1], dz = tz - o[2], d = Math.hypot(dx, dy, dz) || 1;
  const w = cvW3(F, o[0], o[1], o[2]), v = cvDirW(F, dx / d, dz / d);
  // (it shoots over its own rock)
  CV.bolts.push({ x: w[0], y: w[1], z: w[2], vx: v[0] * CAVE.boltV, vy: dy / d * CAVE.boltV, vz: v[1] * CAVE.boltV, t: 0, dmg: CAVE.boltDmg, own: f.cover });
  AUDIO.play('twang');
}
function cvBolts(dt) {
  const Rm = CV.room;
  for (const b of CV.bolts) {
    b.t += dt;
    const n = Math.ceil(Math.hypot(b.vx, b.vy, b.vz) * dt / 0.25);
    for (let i = 0; i < n && !b.done; i++) {
      b.x += b.vx * dt / n; b.y += b.vy * dt / n; b.z += b.vz * dt / n;
      if (!Rm || b.y <= 0) { b.done = true; break; }
      const l = cvL(Rm.F, b.x, b.z, _cw);
      // a rock in the way takes it
      for (const c of Rm.covers) if (c !== b.own && Math.abs(l[0] - c.lx) < c.hw && Math.abs(l[1] - c.lz) < c.hd && b.y < (c.broken ? 0.35 : c.h)) { b.done = true; cvHurtCover(c, b.dmg, b); AUDIO.play('hit', 0.5); break; }
      if (b.done) break;
      if (CV.boss && !b.goo && bagBlocks(l[0], b.y, l[1])) { b.done = true; break; }
      // the hero: a capsule from the floor to the top of the blob
      if (Math.abs(l[1] - CAVE.rail) < CAVE.heroR && Math.abs(l[0] - Rm.hx) < CAVE.heroR + 0.1 && b.y < cvHeroTop(Rm) && b.y > 0.1) { b.done = true; cvHurtHero(b.dmg, null, b); }
      if (l[1] > 2 || Math.abs(l[0]) > (Rm.D.wallHw ?? Rm.D.hw) + 1) b.done = true;
    }
    if (b.t > 3) b.done = true;
  }
  CV.bolts = CV.bolts.filter(b => !b.done);
}
// a spear lobbed in a high arc onto where the hero stands (the landing spot is marked)
function cvThrowSpear(f, Rm) {
  const s = f.T.scale, F = Rm.F, tx = clamp(Rm.hx + rand(-0.6, 0.6), -Rm.D.hw + 1, Rm.D.hw - 1), tz = CAVE.rail + rand(-0.3, 0.3);
  const o = cvW3(F, f.lx, 1.6 * s, f.lz), t = cvW3(F, tx, 0, tz), dur = 1.0;
  CV.spears.push({ sx: o[0], sy: o[1], sz: o[2], tx: t[0], tz: t[2], t: 0, dur, x: o[0], y: o[1], z: o[2], dmg: CAVE.spearDmg });
  addTele({ kind: 'circle', x: t[0], z: t[2], r: 1.05, dur });
  AUDIO.play('throw');
}
function cvSpears(dt) {
  for (const p of CV.spears) {
    p.t += dt; p.spin = (p.spin || 0) + dt * 7;
    if (p.fuse !== undefined) {
      // dynamite on the ground: the fuse sparks, then it blows
      p.fuse -= dt;
      if (Math.random() < 0.8) FX.part(p.x, 0.25, p.z, rand(-1, 1), rand(1, 2.5), rand(-1, 1), 0.06, 0.02, 0.3, [1, 0.75, 0.3], 1, 0, -6);
      if (p.fuse <= 0) {
        p.done = true;
        FX.burst(p.tx, 0.6, p.tz, 26, [1, 0.6, 0.2], 8, 0.18, 0.7, 1, 3); FX.scorch(p.tx, p.tz, p.r, 4);
        for (let i = 0; i < 4; i++) FX.smoke(p.tx + rand(-1, 1), rand(0.3, 1.2), p.tz + rand(-1, 1), 1, [0.3, 0.28, 0.26], 1.6, 0.8);
        FX.glow(p.tx, 0.8, p.tz, 3, [1, 0.6, 0.2], 0.25, 1);
        AUDIO.play('boom'); G.cam.shake = Math.max(G.cam.shake, 0.22);
        const h = G.hero.pos;
        if (Math.hypot(h[0] - p.tx, h[2] - p.tz) < p.r + 0.3) cvHurtHero(p.dmg, null, p);
        if (CV.room) for (const c of CV.room.covers) if (!c.pillar && !c.foe && Math.abs(c.lx - p.lx) < p.r + c.hw * 0.5 && Math.abs(c.lz - p.lz) < p.r + 0.3) cvHurtCover(c, 60, null);
      }
      continue;
    }
    const u = clamp(p.t / p.dur, 0, 1);
    p.x = lerp(p.sx, p.tx, u); p.z = lerp(p.sz, p.tz, u); p.y = lerp(p.sy, 0, u) + Math.sin(u * Math.PI) * (p.peak ?? 4.2);
    if (u >= 1 && p.kind === 'dyn') { p.fuse = 0.55; p.x = p.tx; p.z = p.tz; p.y = 0.1; AUDIO.play('hit', 0.4); continue; }
    if (u >= 1 && p.kind === 'boulder') {
      p.done = true;
      FX.burst(p.tx, 0.4, p.tz, 22, [0.55, 0.48, 0.42], 7, 0.18, 0.8, 1, 3); FX.crack(p.tx, p.tz, p.r * 1.1, 2.5);
      for (let i = 0; i < 3; i++) FX.smoke(p.tx + rand(-1, 1), rand(0.3, 1), p.tz + rand(-1, 1), 1, [0.5, 0.45, 0.4], 1.4, 0.6);
      AUDIO.play('crumble'); G.cam.shake = Math.max(G.cam.shake, 0.2);
      const h = G.hero.pos;
      if (Math.hypot(h[0] - p.tx, h[2] - p.tz) < p.r + 0.3) cvHurtHero(p.dmg, null, p);
      if (CV.room) for (const c of CV.room.covers) if (!c.pillar && !c.foe && Math.abs(c.lx - p.lx) < p.r + c.hw * 0.5 && Math.abs(c.lz - p.lz) < p.r + 0.3) cvHurtCover(c, 80, null);
      continue;
    }
    if (u >= 1) {
      p.done = true;
      FX.burst(p.tx, 0.2, p.tz, 8, [0.6, 0.55, 0.5], 3, 0.08, 0.4, 1, 2); FX.crack(p.tx, p.tz, 0.9);
      const h = G.hero.pos;
      if (Math.hypot(h[0] - p.tx, h[2] - p.tz) < 1.05 + 0.3) cvHurtHero(p.dmg, null, p);
      AUDIO.play('hit');
    }
  }
  CV.spears = CV.spears.filter(p => !p.done);
}
// the hero taking a hit in the cave
function cvHurtHero(dmg, f, at) {
  const run = G.run;
  if (run.invuln > 0 || CV.phase === 'dead' || CV.phase === 'won' || DEV.god) return;
  dmg *= run.stats.armorMul;
  run.hp -= dmg; run.invuln = 0.35; run.hurtFlash = 0.6;
  const h = G.hero.pos;
  G.hero.hit(at ? [at.x, 0.8, at.z] : [h[0], 0.8, h[2] - 1]);
  G.cam.shake = Math.max(G.cam.shake, 0.1);
  addNumberAt(h[0], 2.2, h[2], dmg, [1, 0.35, 0.35]);
  AUDIO.play('hurt');
  if (run.hp <= 0) cvDie();
}
function cvDie() {
  const run = G.run;
  run.hp = 0;
  CV.phase = 'dead'; CV.t = 0;
  G.hero.meltTarget = 1;
  FX.droplets(G.hero.pos[0], 0.8, G.hero.pos[2], 16, 0, 4, 0.08, R.goo.base);
  AUDIO.play('lose');
}
function cvDead(dt) {
  cvHeroIdle(dt);
  if (CV.room) for (const f of CV.room.foes) if (!f.dying) { f.clip = 'idle'; }
  if (CV.t > 1.5) CV.fadeTo = 1;
  if (CV.t > 2.3) { CV.attempt++; caveStart(); UI.banner('TRY AGAIN'); }
}

// ---------- the fork, in first person ----------
function cvFork(dt) {
  const P = CV.pieces[CV.forkI], h = G.hero.pos;
  G.hero.crouch = 0;
  cvHeroIdle(dt);
  // the look swings left, then right, then settles; the floor arrows glow down each way
  const pan = CV.t < 1.1 ? -smoothstep(0, 1.1, CV.t) : CV.t < 3.0 ? -1 + 2 * smoothstep(1.1, 3.0, CV.t) : 1 - smoothstep(3.0, 3.9, CV.t);
  CV.forkLook = pan;
  let pickSide = null;
  if (CV.t > 0.6) {
    if (G.input.x < -0.5) pickSide = 'L';
    else if (G.input.x > 0.5) pickSide = 'R';
    else if (CV.forkClick) pickSide = (INPUT.mx ?? R.cssW / 2) < R.cssW / 2 ? 'L' : 'R';
  }
  // the side the mouse is over (or the key held) glows brighter
  CV.forkHot = G.input.x < -0.5 ? 'L' : G.input.x > 0.5 ? 'R' : INPUT.mx == null ? null : INPUT.mx < R.cssW / 2 ? 'L' : 'R';
  CV.forkClick = false;
  if (pickSide) {
    CV.branch = pickSide;
    cvBuildBranch(pickSide);
    CV.phase = 'walk'; CV.seg = 0; CV.segU = 0; CV.t = 0;
    AUDIO.play('click');
  }
}

// ---------- camera ----------
function caveCamera(dt) {
  const h = G.hero.pos;
  let eye, tgt, fov = CAVE.fov;
  const P = CV.pieces && CV.pieces[CV.pi];
  if (CV.phase === 'enter') {
    // from the crater's top-down view down to behind the hero as it walks in
    const u = smoothstep(0.1, 1.9, CV.t);
    const be = [h[0], 2.7, h[2] + 5.4], bt = [h[0], 1.3, h[2] - 9];
    eye = V3.lerp([0, 0, 0], CV.startEye, be, u); tgt = V3.lerp([0, 0, 0], CV.startTgt, bt, u);
    fov = lerp(0.55, CAVE.fov, u);
    cvSetCam(eye, tgt, fov, 1);
    return;
  }
  if (CV.phase === 'fork') {
    // first person from the blob's eyes
    const F = CV.pieces[CV.forkI].F, look = CV.forkLook, a = look * 1.45;
    const e3 = [h[0], 1.5, h[2]], fw = cvDirW(F, Math.sin(-a) * -1, -Math.cos(a));
    eye = e3; tgt = [h[0] + fw[0] * 10, 1.0, h[2] + fw[1] * 10];
    cvSetCam(eye, tgt, 1.05, dt);
    return;
  }
  if (CV.phase === 'fight' || CV.phase === 'clear' || (CV.phase === 'dead' && CV.room && !CV.boss)) {
    const Rm = CV.room || { F: P.F, hx: 0 }, F = Rm.F;
    const e = cvW3(F, Rm.hx * 0.92, CAVE.up, CAVE.rail + CAVE.back), t = cvW3(F, Rm.hx * 0.72, 0.9, CAVE.rail - 15);
    if (CV.phase === 'dead') { e[1] += CV.t * 0.6; }
    cvSetCam(e, t, CAVE.fov, dt);
    return;
  }
  if (CV.boss) { bagCamera(dt); return; }
  // walking: behind the hero along its heading
  const yaw = CV.walkYaw, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  eye = [h[0] - fx * CAVE.back, CAVE.up + 0.15, h[2] - fz * CAVE.back];
  tgt = [h[0] + fx * 12, 1.0, h[2] + fz * 12];
  cvSetCam(eye, tgt, CAVE.fov, dt);
}
// ease the camera toward where it should be (snap on the first frame)
function cvSetCam(eye, tgt, fov, dt) {
  const c = CV.cam;
  if (!c || dt >= 1) CV.cam = { eye: eye.slice(), tgt: tgt.slice(), fov };
  else {
    const k = 1 - Math.exp(-dt * 6.5);
    for (let i = 0; i < 3; i++) { c.eye[i] += (eye[i] - c.eye[i]) * k; c.tgt[i] += (tgt[i] - c.tgt[i]) * k; }
    c.fov += (fov - c.fov) * k;
  }
  const C = CV.cam, sh = G.save && G.save.settings.shake ? G.cam.shake : 0;
  G.cam.shake = Math.max(0, G.cam.shake - dt * 0.6);
  const j = [(Math.random() * 2 - 1) * sh * 0.6, (Math.random() * 2 - 1) * sh * 0.6, 0];
  R.setCamera([C.eye[0] + j[0], C.eye[1] + j[1], C.eye[2]], [C.tgt[0] + j[0], C.tgt[1] + j[1], C.tgt[2]], C.fov);
}

// ---------- drawing ----------
function emitCave() {
  const f = R.frame, h = G.hero.pos;
  if (CV.phase === 'enter') {
    // still the crater outside, going dark
    f.spot = [h[0], 0, h[2], 13]; f.fogRange = [10, 26];
    emitRunScene();
    return;
  }
  const fw = [R.cam.target[0] - R.cam.pos[0], R.cam.target[2] - R.cam.pos[2]], fl = Math.hypot(fw[0], fw[1]) || 1;
  f.spot = [h[0] + fw[0] / fl * 3, 0, h[2] + fw[1] / fl * 3, 8];
  f.fogRange = CV.boss ? [26, 62] : [18, 44];
  SCENE.arenaBox = null;
  // the pieces near the hero (and the peek down both ways at the fork)
  const list = [];
  for (let i = Math.max(0, CV.pi - 1); i <= Math.min(CV.pieces.length - 1, CV.pi + 2); i++) list.push(CV.pieces[i]);
  if (CV.peek) list.push(CV.peek.L, CV.peek.R);
  const rc = f.rockCol, torches = [];
  SCENE.pools = [];
  for (const P of list) {
    for (const o of P.inst) {
      if (!R.enemyDraw[o.m]) continue;
      const M = MODELS.defs[o.m], tint = o.sh === 1 ? PROP_WHITE : rc;
      const k = o.sh === 1 ? 1 : o.sh;
      pushEnemy(o.m, false, o.x, o.y, o.z, o.yaw, M.clips.still.row, o.s, 1, 0, 0, 0, tint[0] * k, tint[1] * k, tint[2] * k, o.fade || 0);
    }
    for (const t of P.torches) torches.push(t);
    for (const g of P.glows) { const w = cvW(P.F, g.lx, g.lz); FX.glow(w[0], g.y, w[1], g.r * (0.9 + 0.1 * Math.sin(R.frame.time * 9 + g.lx)), g.col, 0.05, 0.6); }
    for (const p of P.pools) SCENE.pools.push(p);
  }
  // the eight torches nearest the view light the scene; each flame flickers
  const cx = R.cam.target[0], cz = R.cam.target[2], T = f.torches, tm = f.time;
  torches.sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz));
  if (CV.boss) torches.unshift(...bagLights());
  T.fill(0);
  for (let i = 0; i < Math.min(8, torches.length); i++) {
    const t = torches[i], fl2 = 0.9 + 0.07 * Math.sin(tm * 13 + t.ph) + 0.05 * Math.sin(tm * 7.3 + t.ph * 2);
    T[i * 4] = t.x; T[i * 4 + 1] = t.y; T[i * 4 + 2] = t.z; T[i * 4 + 3] = t.r * fl2;
  }
  for (const t of torches.slice(0, 14)) {
    FX.glow(t.x, t.y, t.z, 0.55, [1, 0.62, 0.22], 0.05, 0.9);
    if (Math.random() < 0.5) FX.part(t.x + rand(-0.06, 0.06), t.y - 0.05, t.z + rand(-0.06, 0.06), rand(-0.1, 0.1), rand(0.9, 1.5), rand(-0.1, 0.1), 0.13, 0.02, 0.35, [1, 0.55, 0.15], 0.9, 0, -0.5);
  }
  // the fork's floor arrows
  if (CV.phase === 'fork' || (CV.peek && CV.phase === 'walk')) {
    const P = CV.pieces[CV.forkI];
    for (const side of ['L', 'R']) {
      const E = P.exits[side];
      const hot = CV.phase === 'fork' && CV.forkHot === side ? 1 : 0.55;
      // a big arrow at the mouth of each way, and smaller ones leading on down it
      for (let i = 0; i < 4; i++) { const sz = i ? 1.3 : 2.1, w = cvW(E, 0, i ? 0.6 - i * 2.4 : 2.2); pushDecal(w[0], w[1], sz, sz, -E.yaw + Math.PI, 11, 0, 0, 1 * hot, 0.72 * hot, 0.3 * hot, 0.95, true); }
    }
  }
  if (CV.room) cvEmitRoom(CV.room);
  if (CV.boss) bagEmit();
  // telegraphs (spear landings, boss attacks)
  const run = G.run;
  if (run.tele) for (const t of run.tele) {
    const p = t.hold ? 1 : clamp(t.t / t.dur, 0, 1);
    if (t.kind === 'circle') pushDecal(t.x, t.z, t.r, t.r, 0, 4, 0, p, 1, 0.22, 0.18, 0.9);
    else if (t.kind === 'lane') { const cx2 = t.x + Math.sin(t.rot) * t.len / 2, cz2 = t.z + Math.cos(t.rot) * t.len / 2; pushDecal(cx2, cz2, t.r, t.len / 2, -t.rot, 5, 0, p, 1, 0.22, 0.18, 0.85); }
  }
  // the hero's goo shots, bolts and spears
  for (const s of CV.shots) { pushImp(s.x, s.y, s.z, 0.17, s.vx, s.vy, s.vz, 1.45, 0, 0, 0.3, s.ph + s.t, 0, 0, 0, 1); }
  for (const b of CV.bolts) { const sp = Math.hypot(b.vx, b.vy, b.vz) || 1; pushImp(b.x, b.y, b.z, b.crys ? 0.42 : 0.34, b.vx / sp, b.vy / sp, b.vz / sp, 1, 14, 0, 0, 0, 0, 0, 0, 1); FX.glow(b.x, b.y, b.z, b.crys ? 0.7 : 0.3, b.crys ? [0.5, 0.95, 1] : [1, 0.5, 0.3], 0.04, b.crys ? 0.8 : 0.4); }
  for (const p of CV.spears) {
    if (p.kind === 'dyn') { if (R.enemyDraw.dynamite) pushEnemy('dynamite', false, p.x, p.y - 0.3, p.z, p.spin, MODELS.defs.dynamite.clips.still.row, 1.4, 1, 0, p.fuse !== undefined && Math.sin(R.frame.time * 30) > 0 ? 0.6 : 0, 0, 1, 1, 1); FX.glow(p.x, p.y + 0.2, p.z, 0.45, [1, 0.7, 0.3], 0.04, 0.8); continue; }
    if (p.kind === 'boulder') { if (R.enemyDraw.boulder1) pushEnemy('boulder1', false, p.x, p.y - 0.4, p.z, p.spin, MODELS.defs.boulder1.clips.still.row, 1.5, 1, 0, 0, 0, f.rockCol[0], f.rockCol[1], f.rockCol[2]); continue; }
    const u = clamp(p.t / p.dur, 0, 1), vy = -p.sy + Math.cos(u * Math.PI) * Math.PI * 4.2, vx = p.tx - p.sx, vz = p.tz - p.sz, l = Math.hypot(vx, vy, vz) || 1;
    pushImp(p.x, p.y, p.z, 0.62, vx / l, vy / l, vz / l, 1, 14, 0, 0, 0, 0, 0, 0, 1);
  }
}
function cvEmitRoom(Rm) {
  const F = Rm.F, rc = R.frame.rockCol;
  for (const c of Rm.covers) {
    const w = cvW(F, c.lx + (c.shake > 0 ? Math.sin(R.frame.time * 60) * 0.05 * c.shake : 0), c.lz);
    const dmg = c.pillar ? 0 : 1 - c.hp / c.maxHp, k = (0.95 - dmg * 0.3) * (1 + c.flash * 0.25);
    const m = c.broken ? 'rubble' : c.model, sc = c.pillar ? 2.35 : c.broken ? 2.6 : CAVE.coverScale;
    const dy = cvDropY(c);
    if (dy > 50) continue;
    // (while it falls: no damage tint, and a shadow on the floor that grows as it comes down)
    if (dy > 0.05) pushDecal(w[0], w[1], 1.6, 1.0, -F.yaw, 1, 0, 0, 0.02, 0.02, 0.02, 0.7 * (1 - dy / CAVE.ceil));
    if (R.enemyDraw[m]) pushEnemy(m, false, w[0], dy, w[1], F.yaw + c.yaw, MODELS.defs[m].clips.still.row, sc, c.broken || c.pillar ? 1 : 1 - dmg * 0.12, 0, 0, 0, rc[0] * k, rc[1] * k, rc[2] * k, c.fade || 0);
    if (!c.broken && dmg > 0.35) pushDecal(w[0], w[1], 1.6, 0.9, -F.yaw, 8, c.lx, 0.3, 0.03, 0.03, 0.05, 0.6);
  }
  for (const f of Rm.foes) {
    const T = f.T, s = T.scale, M = MODELS.defs[T.model];
    if (!M || !R.enemyDraw[T.model]) continue;
    const w = cvW(F, f.lx, f.lz), y = f.y - f.sink * 0.95 * s;
    const cn = (T.clips && T.clips[f.clip]) || f.clip, c = M.clips[cn] || M.clips.run || M.clips[Object.keys(M.clips)[0]];
    const loop = f.clip === 'run' || f.clip === 'idle';
    const row = c.row + Math.floor((loop ? f.ph - Math.floor(f.ph) : clamp(f.u, 0, 0.999)) * c.frames);
    if (f.state === 'burst') continue;
    if (f.type === 'spider' && f.state === 'drop' && f.y > CAVE.ceil) continue;
    pushEnemy(T.model, false, w[0], y, w[1], f.yaw + F.yaw, row, s, 1, f.dying ? clamp(f.dying, 0, 1) : 0, f.flash > 0 ? 0.85 : 0, 0, f.tint[0], f.tint[1], f.tint[2]);
    pushDecal(w[0] + 0.15, w[1] + 0.1, (f.type === 'spider' ? 0.6 : 0.32) * s, (f.type === 'spider' ? 0.6 : 0.4) * s, 0, 1, 0, 0, 0.01, 0.01, 0.02, (T.fly ? 0.25 : 0.55) * (1 - f.sink * 0.6));
    // a dropping spider hangs on its silk; a golem's core and eyes glow, blazing as it charges; a goblin's fuse sparks
    if (f.type === 'spider' && f.state === 'drop') R.ribStrip([w[0], CAVE.ceil, w[1], w[0], y + 0.55 * s, w[1]], 2, 0.025, [0.92, 0.92, 0.95, 0.7], 0, 0, 1);
    if (f.type === 'golem' && !f.dying) { const cw = cvW3(F, f.lx + Math.sin(f.yaw) * 0.16 * s, y + 0.66 * s, f.lz + Math.cos(f.yaw) * 0.16 * s); FX.glow(cw[0], cw[1], cw[2], 0.55 + (f.glow || 0) * 1.1, [0.45, 0.95, 1], 0.05, 0.4 + (f.glow || 0) * 0.3); }
    if (f.type === 'goblin' && !f.dying && Math.random() < 0.3) { const cw = cvW3(F, f.lx, y + 1.05 * s, f.lz); FX.part(cw[0], cw[1], cw[2], rand(-0.5, 0.5), rand(0.5, 1.2), rand(-0.5, 0.5), 0.05, 0.02, 0.25, [1, 0.75, 0.3], 1, 0, -4); }
    // a crossbowman's aim: a red line from the bow to where it will shoot, blinking once it locks
    if (f.type === 'xbow' && f.state === 'aim') {
      const o = cvW3(F, f.lx + Math.sin(f.yaw) * 0.45 * s, 0.82 * s, f.lz + Math.cos(f.yaw) * 0.45 * s), t = cvW3(F, f.aimX, cvHeroTop(Rm) - 0.32, CAVE.rail);
      const lock = f.t > 0.6, a = lock ? (Math.sin(f.t * 60) > 0 ? 0.95 : 0.35) : 0.35 + f.t * 0.5;
      R.ribStrip([o[0], o[1], o[2], t[0], t[1], t[2]], 2, lock ? 0.05 : 0.03, [1, 0.12, 0.08, a], 0, 0, 1);
    }
  }
}

// ---------- HUD (2D overlay) ----------
function caveOverlay(ctx, w, h, dt) {
  const run = G.run;
  // fade to black between places
  if (CV.fade > 0.003) { ctx.fillStyle = `rgba(0,0,0,${clamp(CV.fade, 0, 1)})`; ctx.fillRect(0, 0, w, h); }
  if (CV.phase === 'enter') return;
  // the hero's health, big along the bottom
  // (in the corner, clear of the blob at the bottom of the view)
  const bw = Math.min(320, w * 0.32), bh = 16, x = 24, y = h - 40, f = clamp(run.hp / run.maxHp, 0, 1);
  ctx.fillStyle = 'rgba(5,10,15,0.75)'; roundRect(ctx, x - 3, y - 3, bw + 6, bh + 6, 10); ctx.fill();
  ctx.fillStyle = f > 0.5 ? '#5cf2ae' : f > 0.25 ? '#ffc63a' : '#ff4d3d'; roundRect(ctx, x, y, Math.max(6, bw * f), bh, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(ctx, x + 3, y + 2, Math.max(0, bw * f - 6), 4, 2); ctx.fill();
  // the rocks you hide behind: a small bar over each one that has taken hits
  const Rm = CV.room, p = [0, 0];
  if (Rm) for (const c of Rm.covers) {
    if (c.foe || c.broken || c.hp >= c.maxHp) continue;
    const wc = cvW3(Rm.F, c.lx, c.h + 0.35, c.lz);
    if (!R.project(wc[0], wc[1], wc[2], p)) continue;
    const cw = 56, cf = clamp(c.hp / c.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(5,10,15,0.6)'; roundRect(ctx, p[0] - cw / 2 - 2, p[1] - 2, cw + 4, 8, 4); ctx.fill();
    ctx.fillStyle = cf > 0.4 ? '#d8c8b0' : '#ff8a5a'; roundRect(ctx, p[0] - cw / 2, p[1], cw * cf, 4, 2); ctx.fill();
  }
  if (CV.boss) bagOverlay(ctx, w, h, dt);
  // the crosshair: red over an enemy, a ring that fills back in as the shot recharges, a mark when a shot lands
  if (CV.phase === 'fight' || CV.phase === 'boss' || CV.phase === 'bossintro') {
    const mx = INPUT.mx ?? w / 2, my = INPUT.my ?? h / 2, aim = CV.aim, on = aim && (aim.kind === 'head' || aim.kind === 'body' || (aim.kind && aim.kind.startsWith('bag')));
    const col = on ? (aim.kind === 'head' || aim.kind === 'bagheart' ? '#ffd23a' : '#ff5a4a') : '#ffffff';
    ctx.save(); ctx.translate(mx, my);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 5;
    const arm = (a) => { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); ctx.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); ctx.stroke(); };
    for (let i = 0; i < 4; i++) arm(i * Math.PI / 2);
    ctx.strokeStyle = col; ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i++) arm(i * Math.PI / 2);
    const cd = 1 - clamp(CV.shotCd / CAVE.shotCd, 0, 1);
    ctx.beginPath(); ctx.arc(0, 0, 23, -Math.PI / 2, -Math.PI / 2 + cd * TAU); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, TAU); ctx.fill();
    if (CV.hitMark > 0) {
      ctx.globalAlpha = CV.hitMark; ctx.strokeStyle = CV.hitHead ? '#ffd23a' : '#ffffff'; ctx.lineWidth = 3;
      for (const a of [0.785, 2.356, 3.927, 5.498]) { ctx.beginPath(); ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
