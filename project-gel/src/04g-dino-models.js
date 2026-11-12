// ============================================================
// Chapter 18, Dino Valley: cycads, half-buried giant ribcages, nests of spotted eggs, chunks of amber with a bug
// inside, and a ring of tree ferns; the raptor, the baby triceratops (trike), and the Goo T-Rex. Built with prop()
// like 04a-04f. The two-legged dinosaurs use the humanoid run clip on their own bone pivots (rig), with their own
// roar and stomp poses (m.dino). Parts without col take the instance tint.
// ============================================================
Object.assign(THEME_CLIPS, { raptor: ['run', 'throw'], trike: ['run', 'slam'], trex: ['run', 'slam', 'idle', 'throw'] });
Object.assign(THEME_CELLS, { cycad: 0.02, ribcage: 0.022, dinonest: 0.016, amber: 0.02, treefern: 0.022, raptor: 0.014, trike: 0.016, trex: 0.015, dinorock: 0.03 });
MESH_ORDER.push('cycad', 'ribcage', 'dinonest', 'amber', 'treefern', 'dinorock', 'raptor', 'trike', 'trex');

// the roar: rears back with the head thrown up, then lunges the head forward (throw clip, m.dino)
function dinoRoar(t) {
  const up = smoothstep(0, 0.5, t), fwd = smoothstep(0.5, 0.65, t), k = 1 - smoothstep(0.8, 1, t);
  const r = Array.from({ length: NBONES }, () => [0, 0, 0]);
  r[0] = [(-0.12 * up + 0.12 * fwd) * k, 0, 0]; r[1] = [(-0.3 * up + 0.4 * fwd) * k, 0, 0]; r[2] = [(-0.5 * up + 0.3 * fwd) * k, 0.08 * Math.sin(t * 40) * fwd * k, 0];
  r[7] = [0.15 * up * k, 0, 0]; r[9] = [-0.1 * up * k, 0, 0];
  return { root: [0, -0.02 * up * k, 0], rot: r };
}
// the stomp: one leg lifted high, the body rocking back, then slammed down (slam clip, m.dino)
function dinoStomp(t) {
  const up = smoothstep(0, 0.55, t), down = smoothstep(0.55, 0.68, t), k = 1 - smoothstep(0.8, 1, t);
  const lift = up * (1 - down) * k;
  const r = Array.from({ length: NBONES }, () => [0, 0, 0]);
  r[0] = [(-0.12 * lift + 0.08 * down * k), 0, 0.06 * lift]; r[1] = [0.1 * down * k, 0, 0]; r[2] = [(-0.2 * lift + 0.25 * down * k), 0, 0];
  r[7] = [-0.9 * lift, 0, 0]; r[8] = [0.9 * lift, 0, 0]; r[9] = [0.1 * lift, 0, 0];
  return { root: [0, -0.03 * down * k, 0], rot: r };
}

function dinoModels(defs) {
  const C = hexToRgb, P = (name, parts, o) => prop(defs, name, parts, o);
  const frond = C('#4a8a3a'), frondL = C('#6ab04a'), trunk = C('#7a5a3a'), trunkD = C('#5a3e26'), bone = C('#efe4cc'), boneD = C('#cfc2a4');
  const twig = C('#8a6a44'), egg = C('#f4ecd8'), eggSpot = C('#6a9a5a'), amberC = C('#ffa830'), dark = C('#16101a'), white = C('#ffffff'), eyeY = C('#ffd23a');

  // ---------- scenery ----------
  // a cycad: a stubby scaly trunk with a crown of stiff, arching fronds
  {
    const parts = [{ s: 'cap', a: [0, 0, 0], b: [0, 0.55, 0], r: 0.17, r2: 0.13, col: trunk, k: 0.02 }];
    for (let y = 0.08; y < 0.55; y += 0.1) parts.push({ s: 'tor', ax: 'y', c: [0, y, 0], R: 0.16 - y * 0.05, r: 0.025, a0: -Math.PI, a1: Math.PI, col: trunkD, k: 0.01 });
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, ca = Math.cos(a), sa = Math.sin(a);
      parts.push({ s: 'cap', a: [ca * 0.05, 0.55, sa * 0.05], b: [ca * 0.45, 0.82, sa * 0.45], r: 0.05, r2: 0.03, col: i % 2 ? frond : frondL, k: 0.02 });
      parts.push({ s: 'cap', a: [ca * 0.45, 0.82, sa * 0.45], b: [ca * 0.75, 0.62, sa * 0.75], r: 0.03, r2: 0.008, col: i % 2 ? frond : frondL, k: 0.02 });
    }
    parts.push({ s: 'ell', c: [0, 0.62, 0], rr: [0.12, 0.1, 0.12], col: C('#c87a3a'), k: 0.02 });
    P('cycad', parts, { ao: 0.8 });
  }
  // half-buried ribs of a giant dinosaur, with a run of vertebrae along the top
  {
    const parts = [];
    for (let i = 0; i < 6; i++) {
      const z = -0.5 + i * 0.2, h = 0.5 + Math.sin((i + 0.5) / 6 * Math.PI) * 0.35;
      for (const sx of [1, -1]) {
        parts.push({ s: 'cap', a: [0, h, z], b: [sx * 0.32, h * 0.75, z + 0.03], r: 0.045, col: bone, k: 0.02 });
        parts.push({ s: 'cap', a: [sx * 0.32, h * 0.75, z + 0.03], b: [sx * 0.42, -0.02, z + 0.05], r: 0.04, r2: 0.025, col: bone, k: 0.02 });
      }
      parts.push({ s: 'sph', c: [0, h + 0.03, z], r: 0.065, col: boneD, k: 0.02 });
    }
    parts.push({ s: 'cap', a: [0, 0.6, -0.55], b: [0, 0.35, -0.85], r: 0.05, r2: 0.02, col: boneD, k: 0.02 });
    parts.push({ s: 'ell', c: [0, -0.02, 0], rr: [0.55, 0.06, 0.7], col: C('#8a6a48'), k: 0.03 });
    P('ribcage', parts, { ao: 1 });
  }
  // a nest of twigs holding three speckled eggs
  {
    const parts = [{ s: 'tor', ax: 'y', c: [0, 0.1, 0], R: 0.32, r: 0.1, a0: -Math.PI, a1: Math.PI, col: twig, k: 0.04 }, { s: 'ell', c: [0, 0.06, 0], rr: [0.33, 0.06, 0.33], col: C('#6a4e30'), k: 0.03 }];
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; parts.push({ s: 'cap', a: [Math.cos(a) * 0.28, 0.12, Math.sin(a) * 0.28], b: [Math.cos(a + 0.6) * 0.42, 0.16 + (i % 3) * 0.02, Math.sin(a + 0.6) * 0.42], r: 0.015, col: i % 2 ? twig : C('#a8845a'), k: 0 }); }
    for (const [x, z, r] of [[-0.1, -0.05, 0.12], [0.12, 0.02, 0.11], [0, 0.14, 0.1]]) {
      parts.push({ s: 'ell', c: [x, 0.2, z], rr: [r, r * 1.3, r], col: egg, k: 0.02 });
      for (let j = 0; j < 4; j++) { const a = j * 1.7 + x * 9; parts.push({ s: 'sph', c: [x + Math.cos(a) * r * 0.95, 0.2 + (j - 1.5) * r * 0.35, z + Math.sin(a) * r * 0.95], r: r * 0.2, col: eggSpot, k: 0 }); }
    }
    P('dinonest', parts, { ao: 0.6 });
  }
  // a chunk of glowing amber with a little bug trapped inside
  P('amber', [
    { s: 'rock', c: [0, 0.35, 0], r: 0.38, bump: 0.18, col: amberC, k: 0 },
    { s: 'ell', c: [0.02, 0.38, 0.05], rr: [0.08, 0.04, 0.12], col: C('#3a2410'), k: 0 },
    ...[1, -1].map(sx => ({ s: 'ell', c: [sx * 0.07, 0.42, 0.05], rr: [0.06, 0.012, 0.04], col: C('#5a3a1a'), k: 0 })),
    { s: 'rock', c: [0, 0.05, 0], r: 0.35, bump: 0.25, col: C('#7a6a5a'), k: 0.04 },
  ], { ao: 0.5 });
  // the wall: tall tree ferns with drooping fronds
  {
    const parts = [{ s: 'cap', a: [0, 0, 0], b: [0.05, 1.4, 0], r: 0.1, r2: 0.08, col: trunkD, k: 0.02 }];
    for (let y = 0.1; y < 1.4; y += 0.14) parts.push({ s: 'sph', c: [0.05 * y / 1.4 + 0.07, y, 0.04], r: 0.04, col: trunk, k: 0.02 });
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + 0.2, ca = Math.cos(a), sa = Math.sin(a);
      parts.push({ s: 'cap', a: [0.05, 1.42, 0], b: [0.05 + ca * 0.45, 1.6, sa * 0.45], r: 0.04, r2: 0.03, col: i % 2 ? frond : frondL, k: 0.02 });
      parts.push({ s: 'cap', a: [0.05 + ca * 0.45, 1.6, sa * 0.45], b: [0.05 + ca * 0.8, 1.2, sa * 0.8], r: 0.03, r2: 0.008, col: i % 2 ? frond : frondL, k: 0.02 });
    }
    P('treefern', parts, { ao: 1 });
  }
  // a volcanic rock for the T-Rex's falling stones
  P('dinorock', [{ s: 'rock', c: [0, 0.5, 0], r: 0.42, bump: 0.25, col: C('#5a4a42'), k: 0 }, { s: 'rock', c: [0.1, 0.62, 0.1], r: 0.18, bump: 0.3, col: C('#ff6a2a'), k: 0.05 }], { ao: 0.4 });

  // ---------- two-legged dinosaurs: the body rides the hips (bone 0), neck and head on bones 1 and 2, tiny arms on
  // 3-6, legs on 7-10, so the humanoid run clip gives them a proper stride ----------
  const biped = (name, o) => {
    const { hipY, kneeY, hipW, len, neck, head, tailLen, tailR, bodyR, armL } = o;
    const belly = C(o.belly), stripe = C(o.stripe), parts = [];
    const pv = { 0: [0, hipY, 0], 1: [0, hipY + bodyR * 0.3, len * 0.4], 2: [0, hipY + neck[1], neck[2]], 3: [hipW * 0.8, hipY + bodyR * 0.1, len * 0.55], 4: [hipW * 0.9, hipY - armL * 0.5, len * 0.6],
      5: [-hipW * 0.8, hipY + bodyR * 0.1, len * 0.55], 6: [-hipW * 0.9, hipY - armL * 0.5, len * 0.6], 7: [hipW, hipY - bodyR * 0.2, 0], 8: [hipW * 1.1, kneeY, len * 0.12], 9: [-hipW, hipY - bodyR * 0.2, 0], 10: [-hipW * 1.1, kneeY, len * 0.12] };
    // body, belly and tail on the hips
    parts.push({ s: 'ell', c: [0, hipY + bodyR * 0.1, len * 0.15], rr: [bodyR * 0.9, bodyR, len * 0.6], k: 0.06, bone: 0 });
    parts.push({ s: 'ell', c: [0, hipY - bodyR * 0.25, len * 0.2], rr: [bodyR * 0.7, bodyR * 0.7, len * 0.5], col: belly, k: 0.04, bone: 0 });
    parts.push({ s: 'cap', a: [0, hipY + bodyR * 0.15, -len * 0.3], b: [0, hipY + bodyR * 0.25, -len * 0.3 - tailLen], r: tailR, r2: tailR * 0.15, k: 0.05, bone: 0 });
    for (let i = 0; i < o.stripes; i++) { const z = len * 0.45 - i * (len + tailLen) / (o.stripes + 1); parts.push({ s: 'ell', c: [0, hipY + bodyR * (z > -len * 0.3 ? 0.95 : 0.5), z], rr: [bodyR * 0.55, bodyR * 0.12, len * 0.05], col: stripe, k: 0.01, bone: 0 }); }
    // neck and head
    parts.push({ s: 'cap', a: [0, hipY + bodyR * 0.4, len * 0.45], b: [0, hipY + neck[1], neck[2]], r: bodyR * 0.55, r2: head[0] * 0.75, k: 0.05, bone: 1 });
    const hc = [0, hipY + neck[1] + head[1] * 0.3, neck[2] + head[2] * 0.6];
    parts.push({ s: 'ell', c: hc, rr: head, k: 0.04, bone: 2 });
    parts.push({ s: 'ell', c: [0, hc[1] - head[1] * 0.45, hc[2] + head[2] * 0.15], rr: [head[0] * 0.85, head[1] * 0.4, head[2] * 0.85], col: belly, k: 0.03, bone: 2 });
    parts.push({ s: 'ell', c: [0, hc[1] - head[1] * 0.12, hc[2] + head[2] * 0.4], rr: [head[0] * 0.8, head[1] * 0.12, head[2] * 0.5], col: C('#5a1a20'), k: 0, bone: 2 });
    for (let i = 0; i < o.teeth; i++) {
      const u = (i + 0.5) / o.teeth, z = hc[2] + head[2] * (0.85 - u * 0.75);
      for (const sx of [1, -1]) parts.push({ s: 'cap', a: [sx * head[0] * (0.72 - u * 0.1), hc[1] - head[1] * 0.02, z], b: [sx * head[0] * (0.72 - u * 0.1), hc[1] - head[1] * 0.28, z], r: head[0] * 0.09, r2: head[0] * 0.02, col: white, k: 0, bone: 2 });
    }
    for (const sx of [1, -1]) {
      parts.push({ s: 'sph', c: [sx * head[0] * 0.7, hc[1] + head[1] * 0.45, hc[2] - head[2] * 0.1], r: head[0] * 0.28, col: eyeY, k: 0, bone: 2 });
      parts.push({ s: 'ell', c: [sx * head[0] * 0.86, hc[1] + head[1] * 0.45, hc[2] - head[2] * 0.08], rr: [head[0] * 0.04, head[0] * 0.22, head[0] * 0.08], col: dark, k: 0, bone: 2 });
      parts.push({ s: 'cap', a: [sx * head[0] * 0.5, hc[1] + head[1] * 0.85, hc[2] - head[2] * 0.25], b: [sx * head[0] * 0.75, hc[1] + head[1] * 0.75, hc[2] + head[2] * 0.15], r: head[0] * 0.14, col: stripe, k: 0.01, bone: 2 });
      // tiny arms with claws
      const b = sx > 0 ? 3 : 5;
      parts.push({ s: 'cap', a: pv[b], b: pv[b + 1], r: bodyR * 0.16, k: 0.02, bone: b });
      parts.push({ s: 'cap', a: pv[b + 1], b: [pv[b + 1][0], pv[b + 1][1] - armL * 0.5, pv[b + 1][2] + armL * 0.4], r: bodyR * 0.13, r2: bodyR * 0.05, k: 0.02, bone: b + 1 });
      // legs: a thick thigh, a shin, a three-toed foot
      const l = sx > 0 ? 7 : 9, hip = pv[l], kn = pv[l + 1], an = [kn[0], 0.07, kn[2] - len * 0.12];
      parts.push({ s: 'cap', a: hip, b: kn, r: bodyR * 0.45, r2: bodyR * 0.3, k: 0.05, bone: l });
      parts.push({ s: 'cap', a: kn, b: an, r: bodyR * 0.24, r2: bodyR * 0.18, k: 0.03, bone: l + 1 });
      for (const tz of [-0.5, 0, 0.5]) parts.push({ s: 'cap', a: [an[0], 0.05, an[2]], b: [an[0] + tz * bodyR * 0.4, 0.02, an[2] + bodyR * 0.75], r: bodyR * 0.1, r2: bodyR * 0.05, col: C('#2a2018'), k: 0.01, bone: l + 1 });
      if (o.sickle) parts.push({ s: 'cap', a: [an[0], 0.08, an[2] + bodyR * 0.2], b: [an[0], 0.2, an[2] + bodyR * 0.55], r: bodyR * 0.08, r2: bodyR * 0.02, col: dark, k: 0, bone: l + 1 });
    }
    if (o.crest) for (let i = 0; i < 4; i++) parts.push({ s: 'cap', a: [0, hc[1] + head[1] * 0.7, hc[2] - head[2] * (0.1 + i * 0.25)], b: [0, hc[1] + head[1] * 1.6 - i * head[1] * 0.15, hc[2] - head[2] * (0.35 + i * 0.25)], r: head[0] * 0.12, r2: head[0] * 0.03, col: C(o.crest), k: 0.01, bone: 2 });
    const m = P(name, parts, { ao: 0.6 });
    rig(m, pv); m.dino = true; m.J.head = hc; m.lean = 0.05; m.runAmp = o.amp;
    return m;
  };
  // raptor: a lean, fast hunter with a feathered crest, a sickle claw on each foot and striped back (the tint)
  biped('raptor', { hipY: 0.52, kneeY: 0.3, hipW: 0.11, len: 0.42, neck: [0, 0.26, 0.38], head: [0.09, 0.085, 0.17], tailLen: 0.55, tailR: 0.09, bodyR: 0.15, armL: 0.14,
    belly: '#e8dcc0', stripe: '#3a5a8a', stripes: 5, teeth: 5, sickle: true, crest: '#ff6a3a', amp: 1.15 });
  // trike: a baby triceratops on four stubby legs, with a big frill and three horns (uses the quadruped poses)
  {
    const frill = C('#ff8a3a'), horn = C('#f4ead0'), beak = C('#3a2a1e');
    const parts = [
      { s: 'ell', c: [0, 0.4, -0.05], rr: [0.24, 0.22, 0.36], k: 0.06 },
      { s: 'ell', c: [0, 0.32, -0.02], rr: [0.2, 0.15, 0.3], col: C('#e8d8b0'), k: 0.04 },
      { s: 'cap', a: [0, 0.42, -0.35], b: [0, 0.3, -0.62], r: 0.1, r2: 0.02, k: 0.04 },
      { s: 'ell', c: [0, 0.48, 0.38], rr: [0.15, 0.14, 0.17], k: 0.04, bone: 2 },
      { s: 'ell', c: [0, 0.62, 0.3], rr: [0.3, 0.24, 0.05], col: frill, k: 0.02, bone: 2 },
      ...Array.from({ length: 7 }, (_, i) => { const a = Math.PI * (0.1 + i * 0.8 / 6); return { s: 'sph', c: [Math.cos(a) * 0.29, 0.6 + Math.sin(a) * 0.23, 0.29], r: 0.035, col: C('#ffd23a'), k: 0, bone: 2 }; }),
      { s: 'cap', a: [0, 0.48, 0.52], b: [0, 0.42, 0.62], r: 0.06, r2: 0.025, col: beak, k: 0.01, bone: 2 },
      { s: 'cap', a: [0, 0.53, 0.5], b: [0, 0.62, 0.58], r: 0.035, r2: 0.008, col: horn, k: 0, bone: 2 },
      ...[1, -1].flatMap(sx => [
        { s: 'cap', a: [sx * 0.07, 0.6, 0.42], b: [sx * 0.12, 0.72, 0.62], r: 0.03, r2: 0.006, col: horn, k: 0, bone: 2 },
        { s: 'sph', c: [sx * 0.11, 0.53, 0.47], r: 0.03, col: dark, k: 0, bone: 2 }, { s: 'sph', c: [sx * 0.11, 0.54, 0.495], r: 0.01, col: white, k: 0, bone: 2 },
        { s: 'cap', a: [sx * 0.15, 0.36, 0.18], b: [sx * 0.15, 0.06, 0.2], r: 0.07, r2: 0.06, k: 0.03, bone: sx > 0 ? 3 : 5 },
        { s: 'ell', c: [sx * 0.15, 0.04, 0.22], rr: [0.07, 0.04, 0.08], col: C('#4a3a2a'), k: 0.02, bone: sx > 0 ? 4 : 6 },
        { s: 'cap', a: [sx * 0.15, 0.36, -0.25], b: [sx * 0.15, 0.06, -0.27], r: 0.08, r2: 0.065, k: 0.03, bone: sx > 0 ? 7 : 9 },
        { s: 'ell', c: [sx * 0.15, 0.04, -0.25], rr: [0.07, 0.04, 0.08], col: C('#4a3a2a'), k: 0.02, bone: sx > 0 ? 8 : 10 },
      ]),
    ];
    const m = P('trike', parts, { ao: 0.6 });
    rig(m, { 0: [0, 0.36, -0.25], 1: [0, 0.4, 0.2], 2: [0, 0.48, 0.28], 3: [0.15, 0.36, 0.18], 4: [0.15, 0.2, 0.2], 5: [-0.15, 0.36, 0.18], 6: [-0.15, 0.2, 0.2],
      7: [0.15, 0.36, -0.25], 8: [0.15, 0.2, -0.26], 9: [-0.15, 0.36, -0.25], 10: [-0.15, 0.2, -0.26] });
    m.quad = true; m.runAmp = 0.75; m.J.head = [0, 0.5, 0.38];
  }
  // the Goo T-Rex (chapter 18 boss): a huge head full of teeth, tiny arms, a heavy tail and a ridge of plates down its back
  {
    const m = biped('trex', { hipY: 0.62, kneeY: 0.36, hipW: 0.16, len: 0.55, neck: [0, 0.38, 0.5], head: [0.17, 0.16, 0.3], tailLen: 0.85, tailR: 0.16, bodyR: 0.26, armL: 0.12,
      belly: '#f0e2b8', stripe: '#2a6a3a', stripes: 7, teeth: 7, amp: 0.85 });
    // dorsal plates down the spine and tail
    for (let i = 0; i < 9; i++) {
      const z = 0.35 - i * 0.16, y = 0.62 + 0.26 * (z > -0.15 ? 1.0 : 0.55 - (-0.15 - z) * 0.35);
      m.parts.push({ s: 'cap', a: [0, y, z], b: [0, y + 0.1 - i * 0.006, z - 0.05], r: 0.05 - i * 0.003, r2: 0.01, col: C('#ff7a3a'), k: 0.01, bone: z > 0.3 ? 1 : 0 });
    }
    m.top = 1.25; m.bmin = [-0.6, -0.03, -1.3]; m.bmax = [0.6, 1.35, 1.1];
  }
}
