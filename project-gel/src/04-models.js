// ============================================================
// Enemy and boss models: smooth humanoids built from blended shapes,
// a shared 11-bone skeleton, and baked animation clips
// ============================================================
// Bones: 0 pelvis, 1 torso, 2 head, 3 upperArmL, 4 forearmL, 5 upperArmR, 6 forearmR, 7 thighL, 8 shinL, 9 thighR, 10 shinR
const BONE_PARENT = [-1, 0, 1, 1, 3, 1, 5, 0, 7, 0, 9];
const NBONES = 11;
const BONE_TEX_W = NBONES * 3;

function makeHumanoid(o) {
  // o: proportions. Left side is +x, the figure faces +z.
  const hipY = o.hipY, shY = o.shY, headY = o.headY;
  const sh = o.shW, hip = o.hipW;
  const J = {
    pelvis: [0, hipY, 0], neck: [0, shY + 0.03, 0.0], head: [0, headY, o.headZ || 0.01],
    shL: [sh, shY, 0], elL: [sh + o.elOut, shY - o.upperLen, -0.01], haL: [sh + o.elOut + 0.02, shY - o.upperLen - o.foreLen, 0.02],
    shR: [-sh, shY, 0], elR: [-sh - o.elOut, shY - o.upperLen, -0.01], haR: [-sh - o.elOut - 0.02, shY - o.upperLen - o.foreLen, 0.02],
    hiL: [hip, hipY, 0], knL: [hip + 0.01, hipY * 0.53, 0.012], anL: [hip + 0.015, 0.06, 0],
    hiR: [-hip, hipY, 0], knR: [-hip - 0.01, hipY * 0.53, 0.012], anR: [-hip - 0.015, 0.06, 0],
  };
  const k = o.k || 0.05;
  const parts = [];
  parts.push({ s: 'sph', c: J.pelvis, r: o.pelvisR, k });
  if (o.torso === 'ell') parts.push({ s: 'ell', c: [0, (hipY + shY) / 2 + 0.03, 0], rr: o.torsoRR, k: k * 1.4 });
  else parts.push({ s: 'cap', a: [0, hipY, 0], b: [0, shY, 0], r: o.torsoR, r2: o.torsoR2 || o.torsoR, k });
  parts.push({ s: 'cap', a: [0, shY - 0.02, 0], b: [0, headY - o.headR * 0.6, J.head[2]], r: o.neckR, k: k * 1.2 });
  parts.push({ s: 'sph', c: J.head, r: o.headR, k: k * 1.2 });
  for (const s of ['L', 'R']) {
    parts.push({ s: 'cap', a: J['sh' + s], b: J['el' + s], r: o.armR, k });
    parts.push({ s: 'cap', a: J['el' + s], b: J['ha' + s], r: o.armR * 0.92, r2: o.armR * 0.86, k: k * 0.8 });
    parts.push({ s: 'sph', c: J['ha' + s], r: o.handR, k: k * 0.8 });
    parts.push({ s: 'cap', a: J['hi' + s], b: J['kn' + s], r: o.legR, k });
    parts.push({ s: 'cap', a: J['kn' + s], b: J['an' + s], r: o.legR * 0.92, r2: o.legR * 0.86, k: k * 0.8 });
    const an = J['an' + s];
    parts.push({ s: 'ell', c: [an[0], an[1] - 0.02, an[2] + 0.035], rr: [o.legR * 0.85, o.legR * 0.55, o.legR * 1.35], k: k * 0.8 });
  }
  const bones = [
    { p: J.pelvis, e: [0, hipY + 0.06, 0], r: o.pelvisR },
    { p: [0, hipY + 0.02, 0], e: [0, shY, 0], r: o.torso === 'ell' ? Math.min(o.torsoRR[0], o.torsoRR[2]) : o.torsoR },
    { p: J.neck, e: [0, headY + o.headR * 0.5, J.head[2]], r: o.headR },
    { p: J.shL, e: J.elL, r: o.armR }, { p: J.elL, e: J.haL, r: o.armR },
    { p: J.shR, e: J.elR, r: o.armR }, { p: J.elR, e: J.haR, r: o.armR },
    { p: J.hiL, e: J.knL, r: o.legR }, { p: J.knL, e: J.anL, r: o.legR },
    { p: J.hiR, e: J.knR, r: o.legR }, { p: J.knR, e: J.anR, r: o.legR },
  ];
  const top = headY + o.headR;
  return { parts, bones, J, bmin: [-0.55, -0.03, -0.5], bmax: [0.55, top + 0.06, 0.5], top };
}

const COL = {
  bow: hexToRgb('#7a4a2a'), string: hexToRgb('#efe3c4'), shield: hexToRgb('#d06a1c'), shieldRim: hexToRgb('#ffbf63'),
  steel: hexToRgb('#7891a8'), steelDark: hexToRgb('#4f647a'), stone: hexToRgb('#8a8174'), bone: hexToRgb('#f1e7d3'),
  hat: hexToRgb('#2b2340'), hatBand: hexToRgb('#d2465f'), baton: hexToRgb('#fff6e0'), gold: hexToRgb('#ffc93a'), band: hexToRgb('#fff0b0'),
  wood: hexToRgb('#8a5a33'), woodDark: hexToRgb('#5e3a20'), tip: hexToRgb('#dfe7ef'), bomb: hexToRgb('#2a2e38'), fuse: hexToRgb('#ffb347'),
  helm: hexToRgb('#8fa3b8'), helmDark: hexToRgb('#5d7186'),
};
// Weapons and armor, attached to a humanoid's bones. Arms hang straight down in the rest pose, so a
// weapon modeled along +z from the hand tilts up and forward once the run pose bends the elbow.
const GEAR = {
  helmet(m, extra = 1) {
    const hd = m.J.head;
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.06, hd[2] - 0.005], rr: [0.172 * extra, 0.135, 0.178 * extra], col: COL.helm, bone: 2, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] - 0.005, hd[2]], R: 0.168 * extra, r: 0.02, a0: -Math.PI, a1: Math.PI, col: COL.helmDark, bone: 2, k: 0 });
    m.parts.push({ s: 'sph', c: [hd[0], hd[1] + 0.2, hd[2] - 0.01], r: 0.032, col: COL.helmDark, bone: 2, k: 0.01 });
  },
  spear(m, len = 1) {
    const h = m.J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.02, h[2] - 0.3], b: [h[0], h[1] + 0.02, h[2] + 0.62 * len], r: 0.02, col: COL.wood, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] + 0.02, h[2] + 0.6 * len], b: [h[0], h[1] + 0.03, h[2] + 0.84 * len], r: 0.055, r2: 0.005, col: COL.tip, bone: 6, k: 0 });
  },
  axe(m) {
    const h = m.J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.03, h[2] - 0.08], b: [h[0], h[1] + 0.04, h[2] + 0.44], r: 0.022, col: COL.wood, bone: 6, k: 0 });
    m.parts.push({ s: 'ell', c: [h[0], h[1] + 0.13, h[2] + 0.4], rr: [0.02, 0.13, 0.1], col: COL.tip, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1] + 0.03, h[2] + 0.4], b: [h[0], h[1] + 0.05, h[2] + 0.4], r: 0.03, col: COL.helmDark, bone: 6, k: 0 });
  },
  sword(m) {
    const h = m.J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1], h[2] - 0.06], b: [h[0], h[1], h[2] + 0.04], r: 0.02, col: COL.woodDark, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0] - 0.07, h[1], h[2] + 0.05], b: [h[0] + 0.07, h[1], h[2] + 0.05], r: 0.018, col: COL.gold, bone: 6, k: 0 });
    m.parts.push({ s: 'cap', a: [h[0], h[1], h[2] + 0.07], b: [h[0], h[1] + 0.01, h[2] + 0.52], r: 0.034, r2: 0.01, col: COL.tip, bone: 6, k: 0 });
  },
  shield(m) {
    const h = m.J.haL;
    m.parts.push({ s: 'cyl', ax: 'z', c: [h[0] + 0.03, h[1] + 0.09, h[2] + 0.1], r: 0.22, hh: 0.028, rd: 0.02, col: COL.shield, bone: 4, k: 0 });
    m.parts.push({ s: 'tor', ax: 'z', c: [h[0] + 0.03, h[1] + 0.09, h[2] + 0.13], R: 0.2, r: 0.024, a0: -Math.PI, a1: Math.PI, col: COL.shieldRim, bone: 4, k: 0 });
    m.parts.push({ s: 'sph', c: [h[0] + 0.03, h[1] + 0.09, h[2] + 0.14], r: 0.05, col: COL.shieldRim, bone: 4, k: 0 });
  },
  club(m) {
    const h = m.J.haR;
    m.parts.push({ s: 'cap', a: [h[0], h[1] - 0.02, h[2] - 0.05], b: [h[0], h[1] + 0.06, h[2] + 0.5], r: 0.035, r2: 0.085, col: COL.wood, bone: 6, k: 0.02 });
  },
};


const STICK = { hipY: 0.5, shY: 0.79, headY: 0.975, headR: 0.155, shW: 0.115, hipW: 0.07, elOut: 0.055, upperLen: 0.165, foreLen: 0.16,
  pelvisR: 0.095, torsoR: 0.092, torsoR2: 0.1, neckR: 0.062, armR: 0.058, handR: 0.06, legR: 0.068 };

function modelDefs() {
  const defs = {};
  const add = (name, opts, extra) => {
    const m = makeHumanoid(opts);
    if (extra) extra(m);
    m.name = name;
    defs[name] = m;
  };
  add('stickman', STICK);
  add('sprinter', { ...STICK, hipY: 0.54, shY: 0.82, headY: 0.995, headR: 0.14, armR: 0.048, handR: 0.05, legR: 0.056, torsoR: 0.078, torsoR2: 0.084, pelvisR: 0.08 });
  add('brute', { ...STICK, hipY: 0.46, shY: 0.82, headY: 0.99, headR: 0.14, headZ: 0.05, shW: 0.21, hipW: 0.11, elOut: 0.05, upperLen: 0.17, foreLen: 0.16,
    pelvisR: 0.16, torso: 'ell', torsoRR: [0.22, 0.25, 0.18], neckR: 0.09, armR: 0.085, handR: 0.1, legR: 0.1, k: 0.06 }, m => GEAR.club(m));
  add('archer', STICK, m => {
    const h = m.J.haL, R = 0.2;
    m.parts.push({ s: 'tor', ax: 'x', c: [h[0] + 0.01, h[1] + R, h[2]], R, r: 0.016, a0: -Math.PI / 2 - 1.0, a1: -Math.PI / 2 + 1.0, col: COL.bow, bone: 4, k: 0 });
    const tA = [h[0] + 0.01, h[1] + R - R * Math.sin(Math.PI / 2 - 1.0) * 1, h[2] + R * Math.cos(-Math.PI / 2 - 1.0)];
    const tB = [h[0] + 0.01, tA[1], h[2] - R * Math.cos(-Math.PI / 2 - 1.0)];
    m.parts.push({ s: 'cap', a: tA, b: tB, r: 0.005, col: COL.string, bone: 4, k: 0 });
  });
  add('splitter', { ...STICK, torso: 'ell', torsoRR: [0.16, 0.2, 0.14], pelvisR: 0.12, headR: 0.15, k: 0.055 }, m => {
    m.parts.push({ s: 'box', c: [0, 0.7, 0], hs: [0.007, 0.35, 0.3], rd: 0.0, sub: true, k: 0.02 });
  });
  add('shield', STICK, m => GEAR.shield(m));
  add('helmet', { ...STICK, torsoR: 0.098, torsoR2: 0.108, armR: 0.062, legR: 0.072 }, m => { GEAR.helmet(m); m.crownLift = 0.085; });
  add('spear', STICK, m => GEAR.spear(m));
  add('axe', { ...STICK, torsoR: 0.102, torsoR2: 0.112, pelvisR: 0.1, armR: 0.064, handR: 0.066 }, m => GEAR.axe(m));
  add('javelin', STICK, m => {
    GEAR.spear(m, 0.85);
    m.parts.push({ s: 'cyl', ax: 'y', c: [0.05, 0.72, -0.14], r: 0.055, hh: 0.13, rd: 0.02, col: COL.woodDark, bone: 1, k: 0 });
    for (const [dx, dz] of [[0.02, -0.02], [0.07, 0.01], [0.06, -0.04]]) {
      m.parts.push({ s: 'cap', a: [0.05 + dx - 0.04, 0.75, -0.14 + dz], b: [0.05 + dx - 0.04, 1.02, -0.16 + dz], r: 0.011, col: COL.wood, bone: 1, k: 0 });
      m.parts.push({ s: 'cap', a: [0.05 + dx - 0.04, 1.0, -0.16 + dz], b: [0.05 + dx - 0.04, 1.08, -0.165 + dz], r: 0.026, r2: 0.003, col: COL.tip, bone: 1, k: 0 });
    }
  });
  add('bomber', { ...STICK, hipY: 0.52, shY: 0.81, headY: 0.99, headR: 0.15, armR: 0.052, legR: 0.062 }, m => {
    m.parts.push({ s: 'sph', c: [0, 0.66, 0.15], r: 0.13, col: COL.bomb, bone: 1, k: 0 });
    m.parts.push({ s: 'cap', a: [0, 0.78, 0.17], b: [0.03, 0.87, 0.2], r: 0.014, col: COL.fuse, bone: 1, k: 0 });
    m.parts.push({ s: 'sph', c: [0.03, 0.885, 0.205], r: 0.03, col: COL.gold, bone: 1, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [0, m.J.head[1] + 0.03, m.J.head[2]], R: 0.152, r: 0.022, a0: -Math.PI, a1: Math.PI, col: COL.hatBand, bone: 2, k: 0 });
  });
  add('knight', { ...STICK, torsoR: 0.105, torsoR2: 0.115, pelvisR: 0.1, armR: 0.066, handR: 0.066, legR: 0.075 }, m => {
    GEAR.helmet(m, 1.03); GEAR.shield(m); GEAR.sword(m);
    for (const s of ['shL', 'shR']) { const p = m.J[s]; m.parts.push({ s: 'ell', c: [p[0] * 1.15, p[1] + 0.02, p[2]], rr: [0.08, 0.055, 0.075], col: COL.helm, bone: 1, k: 0 }); }
  });
  // Bosses
  add('stomper', { ...STICK, hipY: 0.46, shY: 0.82, headY: 1.0, headR: 0.15, headZ: 0.04, shW: 0.22, hipW: 0.12, elOut: 0.06, upperLen: 0.18, foreLen: 0.17,
    pelvisR: 0.17, torso: 'ell', torsoRR: [0.23, 0.26, 0.19], neckR: 0.095, armR: 0.09, handR: 0.11, legR: 0.105, k: 0.06 }, m => {
    const hd = m.J.head;
    m.parts.push({ s: 'ell', c: [hd[0], hd[1] + 0.045, hd[2]], rr: [0.185, 0.15, 0.19], col: COL.steel, bone: 2, k: 0 });
    m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] + 0.0, hd[2]], R: 0.175, r: 0.03, a0: -Math.PI, a1: Math.PI, col: COL.steelDark, bone: 2, k: 0 });
    m.parts.push({ s: 'cap', a: [hd[0], hd[1] + 0.2, hd[2] - 0.08], b: [hd[0], hd[1] + 0.21, hd[2] + 0.1], r: 0.03, col: COL.steelDark, bone: 2, k: 0 });
  });
  add('hurler', { ...STICK, armR: 0.068, legR: 0.075, torsoR: 0.11, torsoR2: 0.12, pelvisR: 0.11, handR: 0.075 }, m => {
    m.parts.push({ s: 'rock', c: [0, 0.74, -0.25], r: 0.25, bump: 0.12, col: COL.stone, bone: 1, k: 0 });
    m.parts.push({ s: 'cap', a: [0.09, 0.79, 0.07], b: [0.11, 0.55, 0.08], r: 0.018, col: COL.bow, bone: 1, k: 0 });
    m.parts.push({ s: 'cap', a: [-0.09, 0.79, 0.07], b: [-0.11, 0.55, 0.08], r: 0.018, col: COL.bow, bone: 1, k: 0 });
  });
  add('charger', { ...STICK, hipY: 0.47, shY: 0.8, headY: 0.96, headR: 0.15, headZ: 0.07, shW: 0.19, hipW: 0.1, pelvisR: 0.15, torso: 'ell', torsoRR: [0.2, 0.23, 0.18],
    neckR: 0.09, armR: 0.08, handR: 0.095, legR: 0.095, k: 0.06 }, m => {
    const hd = m.J.head;
    for (const sx of [1, -1]) {
      m.parts.push({ s: 'cap', a: [hd[0] + sx * 0.1, hd[1] + 0.06, hd[2]], b: [hd[0] + sx * 0.2, hd[1] + 0.16, hd[2] + 0.08], r: 0.045, r2: 0.03, col: COL.bone, bone: 2, k: 0.02 });
      m.parts.push({ s: 'cap', a: [hd[0] + sx * 0.2, hd[1] + 0.16, hd[2] + 0.08], b: [hd[0] + sx * 0.19, hd[1] + 0.2, hd[2] + 0.2], r: 0.03, r2: 0.012, col: COL.bone, bone: 2, k: 0.02 });
    }
  });
  add('twin', { ...STICK, armR: 0.072, legR: 0.08, torsoR: 0.11, torsoR2: 0.12, pelvisR: 0.11, handR: 0.08, headR: 0.16 }, m => {
    const hd = m.J.head;
    m.parts.push({ s: 'tor', ax: 'y', c: [hd[0], hd[1] + 0.04, hd[2]], R: 0.16, r: 0.026, a0: -Math.PI, a1: Math.PI, col: COL.band, bone: 2, k: 0 });
  });
  add('conductor', { ...STICK, hipY: 0.56, shY: 0.86, headY: 1.04, headR: 0.15, legR: 0.062, armR: 0.056 }, m => {
    const hd = m.J.head, ha = m.J.haR;
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.25, hd[2]], r: 0.115, hh: 0.12, rd: 0.012, col: COL.hat, bone: 2, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.135, hd[2]], r: 0.19, hh: 0.014, rd: 0.01, col: COL.hat, bone: 2, k: 0 });
    m.parts.push({ s: 'cyl', ax: 'y', c: [hd[0], hd[1] + 0.17, hd[2]], r: 0.118, hh: 0.025, rd: 0.004, col: COL.hatBand, bone: 2, k: 0 });
    m.parts.push({ s: 'cap', a: [ha[0], ha[1], ha[2]], b: [ha[0] - 0.02, ha[1] - 0.06, ha[2] + 0.34], r: 0.016, r2: 0.01, col: COL.baton, bone: 6, k: 0 });
  });
  // Boulders: lumpy rocks on one rigid bone, about 0.45 in radius, tinted per arena
  const rock = (name, parts) => {
    const m = makeHumanoid(STICK);
    m.parts = parts.map(p => ({ s: 'rock', bone: 0, k: 0.09, ...p }));
    m.bmin = [-0.8, -0.3, -0.8]; m.bmax = [0.8, 0.9, 0.8]; m.top = 0.7; m.aoScale = 2.2; m.name = name;
    defs[name] = m;
  };
  rock('rock0', [{ c: [0, 0.16, 0], r: 0.42, bump: 0.13 }, { c: [0.3, 0.06, 0.14], r: 0.22, bump: 0.16 }]);
  rock('rock1', [{ c: [-0.12, 0.12, 0], r: 0.36, bump: 0.15 }, { c: [0.2, 0.1, -0.05], r: 0.32, bump: 0.12 }, { c: [0.02, 0.36, 0.02], r: 0.2, bump: 0.18 }]);
  rock('rock2', [{ c: [0, 0.2, 0], r: 0.4, bump: 0.1 }, { c: [-0.25, 0.04, 0.2], r: 0.2, bump: 0.2 }, { c: [0.2, 0.02, -0.25], r: 0.17, bump: 0.2 }]);
  return defs;
}

// Elite crown, sized for each base type's head
function crownModel(base) {
  const hd = base.J.head, r = base.parts.find(p => p.s === 'sph' && p.c === hd)?.r || 0.15;
  const y = hd[1] + r * 0.82 + (base.crownLift || 0);
  const parts = [{ s: 'tor', ax: 'y', c: [hd[0], y, hd[2]], R: r * 0.62, r: 0.022, a0: -Math.PI, a1: Math.PI, col: COL.gold, bone: 2, k: 0 }];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    parts.push({ s: 'cap', a: [hd[0] + Math.cos(a) * r * 0.62, y, hd[2] + Math.sin(a) * r * 0.62], b: [hd[0] + Math.cos(a) * r * 0.66, y + 0.075, hd[2] + Math.sin(a) * r * 0.66], r: 0.02, r2: 0.008, col: COL.gold, bone: 2, k: 0.02 });
  }
  return { parts, bones: base.bones, J: base.J, bmin: [hd[0] - 0.2, y - 0.06, hd[2] - 0.2], bmax: [hd[0] + 0.2, y + 0.12, hd[2] + 0.2], aoScale: 0.4 };
}

// ------------------------------------------------------------
// Animation clips: return per-bone rotations [rx, ry, rz] (about each bone's rest pivot) and a root offset
// ------------------------------------------------------------
const CLIPS = {
  run: { frames: 32, fn(t, m) {
    const ph = t * TAU, s = Math.sin(ph), c = Math.cos(ph), A = m.runAmp || 1, lean = m.lean || 0.14;
    const armL = m.shieldArm ? 0.15 : 1;
    return { root: [0, 0.028 * Math.cos(2 * ph) - 0.01, 0], rot: [
      [0, 0.12 * s * A, 0], [lean, -0.16 * s * A, 0], [-lean * 0.6 + (m.headDown || 0), 0.05 * s, 0],
      [0.48 * s * A * armL - (m.shieldArm ? 0.35 : 0), 0, 0.12], [-0.7 - 0.25 * Math.max(0, -s), 0, 0],
      [-0.48 * s * A, 0, -0.12], [-0.7 - 0.25 * Math.max(0, s), 0, 0],
      [-0.6 * s * A, 0, 0], [0.12 + 0.95 * Math.max(0, c) * A, 0, 0],
      [0.6 * s * A, 0, 0], [0.12 + 0.95 * Math.max(0, -c) * A, 0, 0],
    ] };
  } },
  idle: { frames: 16, fn(t) {
    const s = Math.sin(t * TAU);
    return { root: [0, 0.006 * s, 0], rot: [[0, 0, 0], [0.04 + 0.02 * s, 0, 0], [-0.03, 0.08 * s, 0], [0.05, 0, 0.14 + 0.03 * s], [-0.35, 0, 0],
      [0.05, 0, -0.14 - 0.03 * s], [-0.35, 0, 0], [0, 0, 0.02], [0.05, 0, 0], [0, 0, -0.02], [0.05, 0, 0]] };
  } },
  aim: { frames: 16, fn(t) {
    const draw = smoothstep(0, 0.7, t) * (1 - smoothstep(0.75, 0.85, t));
    return { root: [0, -0.01, 0], rot: [[0, -0.3, 0], [0.06, -0.15, 0], [-0.08, 0.35, 0],
      [-1.4, 0, 0.1], [-0.08, 0, 0], [-1.25, 0, -0.35], [-0.2 - 1.2 * draw, 0.6 * draw, 0],
      [-0.12, 0, 0.05], [0.18, 0, 0], [0.1, 0, -0.05], [0.12, 0, 0]] };
  } },
  slam: { frames: 24, fn(t) {
    const up = smoothstep(0, 0.55, t), down = smoothstep(0.55, 0.68, t), rec = smoothstep(0.8, 1, t);
    const arm = lerp(lerp(0, -2.7, up), -0.5, down) * (1 - rec) + rec * 0;
    const lean = lerp(lerp(0, -0.25, up), 0.45, down) * (1 - rec);
    const crouch = (-0.05 * up + 0.04 * down - 0.09 * down * (1 - rec)) * (1 - rec);
    return { root: [0, crouch, 0], rot: [[0, 0, 0], [lean, 0, 0], [-lean * 0.5, 0, 0],
      [arm, 0, 0.25], [-0.3 * (1 - down), 0, 0], [arm, 0, -0.25], [-0.3 * (1 - down), 0, 0],
      [-0.3 * down * (1 - rec), 0, 0.08], [0.5 * down * (1 - rec), 0, 0], [-0.3 * down * (1 - rec), 0, -0.08], [0.5 * down * (1 - rec), 0, 0]] };
  } },
  throw: { frames: 24, fn(t) {
    const back = smoothstep(0, 0.55, t), fwd = smoothstep(0.55, 0.7, t), rec = smoothstep(0.75, 1, t);
    const k = 1 - rec;
    const armR = (lerp(0, -2.6, back) + 2.0 * fwd) * k;
    return { root: [0, -0.02 * back * k, 0], rot: [[0, (0.4 * back - 0.7 * fwd) * k, 0], [(-0.15 * back + 0.35 * fwd) * k, (0.3 * back - 0.5 * fwd) * k, 0], [0, 0, 0],
      [-0.6 * back * k, 0, 0.3 * k], [-0.4, 0, 0], [armR, 0, -0.2], [(-0.6 * back + 0.4 * fwd) * k, 0, 0],
      [-0.25 * k, 0, 0], [0.2 * k, 0, 0], [0.2 * k, 0, 0], [0.3 * k, 0, 0]] };
  } },
  dizzy: { frames: 16, fn(t) {
    const s = Math.sin(t * TAU), c = Math.cos(t * TAU);
    return { root: [0.02 * s, -0.03, 0.02 * c], rot: [[0, 0, 0.06 * s], [0.12, 0, 0.12 * s], [0.18 * c, 0.3 * s, 0.25 * c],
      [0.2, 0, 0.5 + 0.2 * c], [-0.2, 0, 0], [0.2, 0, -0.5 - 0.2 * c], [-0.2, 0, 0], [-0.1, 0, 0.1], [0.2, 0, 0], [-0.1, 0, -0.1], [0.2, 0, 0]] };
  } },
  still: { frames: 1, fn() {
    return { root: [0, 0, 0], rot: Array.from({ length: NBONES }, () => [0, 0, 0]) };
  } },
  conduct: { frames: 32, fn(t) {
    const s = Math.sin(t * TAU), c = Math.cos(t * TAU), s2 = Math.sin(2 * t * TAU);
    return { root: [0, 0.01 * s2, 0], rot: [[0, 0.1 * s, 0], [0.02, 0.15 * s, 0.04 * s2], [-0.05, 0.2 * s, 0.08 * s2],
      [-1.2 + 0.2 * c, 0, 0.5], [-0.6, 0, 0], [-1.9 + 0.5 * s, 0.3 * c, -0.4], [-0.5 + 0.4 * s2, 0, 0],
      [0, 0, 0.03], [0.05, 0, 0], [0, 0, -0.03], [0.05, 0, 0]] };
  } },
};

// Bake FK matrices for every model and clip into one RGBA32F texture
const MODELS = { defs: null, boneTex: null, rows: 0 };
function bakeAnimations(defs) {
  const jobs = [];
  for (const name in defs) {
    const m = defs[name];
    m.clips = {};
    for (const cname of m.clipNames) jobs.push([m, cname]);
  }
  const totalRows = jobs.reduce((s, [, c]) => s + CLIPS[c].frames, 0);
  const data = new Float32Array(BONE_TEX_W * 4 * totalRows);
  const L = M4.create(), G = Array.from({ length: NBONES }, () => M4.create());
  let row = 0;
  for (const [m, cname] of jobs) {
    const clip = CLIPS[cname];
    m.clips[cname] = { row, frames: clip.frames };
    for (let f = 0; f < clip.frames; f++, row++) {
      const pose = clip.fn(f / clip.frames, m);
      for (let b = 0; b < NBONES; b++) {
        const [rx, ry, rz] = pose.rot[b];
        const p = m.bones[b].p;
        M4.fromEulerPivot(L, rx, ry, rz, p[0], p[1], p[2]);
        if (b === 0) { L[12] += pose.root[0]; L[13] += pose.root[1]; L[14] += pose.root[2]; M4.copy(G[0], L); }
        else M4.mul(G[b], G[BONE_PARENT[b]], L);
        const g = G[b], o = (row * BONE_TEX_W + b * 3) * 4;
        // rows of the 3x4 matrix
        data[o] = g[0]; data[o + 1] = g[4]; data[o + 2] = g[8]; data[o + 3] = g[12];
        data[o + 4] = g[1]; data[o + 5] = g[5]; data[o + 6] = g[9]; data[o + 7] = g[13];
        data[o + 8] = g[2]; data[o + 9] = g[6]; data[o + 10] = g[10]; data[o + 11] = g[14];
      }
    }
  }
  MODELS.rows = totalRows;
  MODELS.boneTex = GLX.texture(BONE_TEX_W, totalRows, { internal: gl.RGBA32F, type: gl.FLOAT, data, filter: gl.NEAREST });
}

const MODEL_CLIPS = {
  stickman: ['run', 'idle'], sprinter: ['run'], brute: ['run', 'slam'], archer: ['run', 'aim'], splitter: ['run'], shield: ['run'],
  helmet: ['run'], spear: ['run', 'throw'], axe: ['run', 'slam'], javelin: ['run', 'throw'], bomber: ['run', 'idle'], knight: ['run', 'slam'],
  stomper: ['run', 'slam', 'idle'], hurler: ['run', 'throw', 'idle'], charger: ['run', 'dizzy', 'idle'], twin: ['run', 'idle'], conductor: ['conduct', 'run', 'idle'],
  rock0: ['still'], rock1: ['still'], rock2: ['still'],
};
const MESH_CELLS = {
  stickman: 0.032, sprinter: 0.029, brute: 0.034, archer: 0.03, splitter: 0.032, shield: 0.03,
  helmet: 0.03, spear: 0.029, axe: 0.029, javelin: 0.029, bomber: 0.03, knight: 0.029,
  stomper: 0.024, hurler: 0.023, charger: 0.024, twin: 0.024, conductor: 0.022,
  rock0: 0.045, rock1: 0.045, rock2: 0.045,
};
const CROWN_CELL = 0.02;
// Build order: what chapter 1 needs first, bosses last
const MESH_ORDER = ['stickman', 'sprinter', 'rock0', 'rock1', 'rock2', 'helmet', 'spear', 'stickman_crown', 'spear_crown', 'helmet_crown',
  'axe', 'archer', 'brute', 'axe_crown', 'archer_crown', 'brute_crown', 'shield', 'javelin', 'bomber', 'splitter', 'knight', 'shield_crown', 'javelin_crown',
  'stomper', 'hurler', 'charger', 'twin', 'conductor'];

function prepareModelDefs() {
  const defs = modelDefs();
  for (const name in defs) defs[name].clipNames = MODEL_CLIPS[name];
  defs.brute.runAmp = 0.8; defs.sprinter.lean = 0.3; defs.sprinter.runAmp = 1.15;
  defs.shield.shieldArm = true; defs.stomper.runAmp = 0.75; defs.charger.lean = 0.35; defs.charger.headDown = 0.25;
  defs.knight.shieldArm = true; defs.knight.runAmp = 0.85; defs.helmet.runAmp = 0.9; defs.bomber.lean = 0.28; defs.bomber.runAmp = 1.1;
  return defs;
}
// Skeletons and baked animation clips (fast; meshes are built separately)
function prepareAnimations() {
  const defs = prepareModelDefs();
  bakeAnimations(defs);
  MODELS.defs = defs;
  MODELS.meshes = MODELS.meshes || {};
  return MODELS;
}
// Build one mesh by name ('stickman', 'brute_crown', ...)
function buildMeshByName(defs, name) {
  if (name.endsWith('_crown')) return buildSkinnedMesh(crownModel(defs[name.slice(0, -6)]), CROWN_CELL);
  return buildSkinnedMesh(defs[name], MESH_CELLS[name]);
}
// Synchronous build of everything (used by tests and as a fallback)
function buildModels(progress) {
  prepareAnimations();
  const defs = prepareModelDefs();
  let n = 0;
  for (const name of MESH_ORDER) { MODELS.meshes[name] = buildMeshByName(defs, name); progress && progress(++n / MESH_ORDER.length); }
  return MODELS;
}
