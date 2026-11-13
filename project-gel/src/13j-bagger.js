// ============================================================
// The Bagger's hall, at the end of both ways through the cave. The Bagger (models in 04j) sits at the far end
// on its crawlers, its superstructure slewing to face the hero, its bucket wheel always turning. The hero has
// low rocks along the rail and two stone pillars just ahead. Its attacks:
//   goo      spits a few goo blobs at the hero's head (duck)
//   barrage  digs in with the wheel, then flings a shower of rocks onto marked circles along the rail (move)
//   beam     its goo heart charges, then a beam sweeps the length of the rail at knee height (get behind a rock)
//   smash    marks the rock you hide behind, then fires a spinning drill-rock that shatters it (leave it)
//   minions  sounds its horn: crossbowmen, spearmen and moles come out of the side alcoves
// Rocks it smashes are rebuilt by rockfalls from the ceiling. Half health: stage 2, red-hot and faster.
// Its goo heart (the porthole above its eyes) takes the most damage; the steel takes little.
// ============================================================
// the hall is wide and deep, so the fight can be seen from four sides
const BAG_ROOM = { hw: 21, len: 58, look: 'boss', hero: [-9, -3, 3, 9], mid: [], foe: [[-11.5, -17], [-8, -20.5], [8, -20.5], [11.5, -17]], pillars: [[-6, -9.8], [6, -9.8]] };
const BAG = { S: 4, z: -29, hp: 5100, heart: [0, 1.62, 0.42], heartR: 0.55, gooDmg: 14, rockDmg: 18, beamDmg: 15, smashDmg: 24, beamY: 0.85, quakeDmg: 22, rainDmg: 16 };
// Four stages, each fought from another side of the machine (ang: about the Bagger, from the hall's entrance; d: how
// far the hero's rail is from it; hw: the rail's half length; covers: the rocks along it, in the rail's own frame).
// Each stage has its own moves; the last, from behind it, uses all of them, red-hot and faster.
const BAG_STAGES = [
  { ang: 0, d: 24, hw: 12, covers: [-9, -3, 3, 9], pillars: [[-6, -9.8], [6, -9.8]], foe: [[-11.5, -17], [-8, -20.5], [8, -20.5], [11.5, -17]],
    plan: ['goo', 'barrage', 'goo', 'minions', 'barrage'] },
  { ang: 0.8, d: 17, hw: 7.5, covers: [-5, 0, 5], plan: ['beam', 'quake', 'smash', 'quake', 'beam'], name: 'THE BAGGER TURNS' },
  { ang: -0.8, d: 17, hw: 7.5, covers: [-5, 0, 5], plan: ['rain', 'spin', 'volley', 'rain', 'spin'], name: 'IT DIGS IN' },
  { ang: Math.PI, d: 16, hw: 9, covers: [-6, -2, 2, 6], foe: [[-7, -15], [7, -15]],
    plan: ['barrage', 'quake', 'goo', 'rain', 'beam', 'minions', 'spin', 'smash', 'volley', 'goo'], name: 'THE BAGGER IS ENRAGED' },
];
const bagPlan = B => BAG_STAGES[(B.stage || 1) - 1].plan;

// the hall's own look: braziers down both sides, a heap of spoil behind the machine, pillars at the back
function bagDecorate(P, put, rnd, light) {
  const hw = P.hw, L = P.len;
  for (const z of [-10, -24, -38, -50]) for (const sx of [-1, 1]) { put('brazier', sx * (hw - 2), z, 0, rnd() * TAU, 3, 1); light(sx * (hw - 2), z, 2.3, 8); P.glows.push({ lx: sx * (hw - 2), y: 1.9, lz: z, r: 1.8, col: [1, 0.6, 0.25] }); }
  // heaps of spoil in the back corners (the middle stays clear for the last stage's view)
  for (let i = 0; i < 10; i++) { const sx = i % 2 ? 1 : -1; put('boulder' + (i % 3), sx * (hw - 2 - rnd() * 5), -L + 2 + rnd() * 5, -0.5, rnd() * TAU, 4 + rnd() * 3); }
  for (const x of [-hw + 2.5, hw - 2.5]) put('cpillar', x, -L + 9, 0, rnd() * TAU, 3.2);
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) put('boulder' + i, sx * (hw + 2.5), -15 - i * 2.5, CAVE.ceil - 0.5, rnd() * TAU, 3);
}

function bagStart(P) {
  CV.room = { P, D: BAG_ROOM, F: P.F, hx: 0, hvx: 0, stand: 0, upT: 0, covers: [], foes: [], waves: [], waveT: 0, waveN: 0 };
  CV.boss = { x: 0, z: BAG.z, slew: 0, pitch: -0.1, wheel: 0, wheelV: 0.6, hp: BAG.hp, maxHp: BAG.hp, stage2: false, stage: 1, state: 'idle', t: 0, cd: 2.2, plan: 0,
    glow: 0, flash: 0, beam: null, rocks: [], drills: [], regrow: [], spikes: [], quakes: [], dying: 0, eyes: 0, tint: hexToRgb('#ff8a2a'), side: 1 };
  bagStageSetup(CV.boss, 1, 0.3);
  CV.boss.slew = Math.atan2(-CV.boss.x, CAVE.rail - CV.boss.z) + 0.62;
  $('banner').classList.remove('show');
  CV.phase = 'bossintro'; CV.t = 0;
  if (!ICONS.map['boss-bagger']) renderBossPortraitOf('bagger');
  UI.bossIntro(['bagger']);
  AUDIO.play('horn'); AUDIO.play('boss');
  G.cam.shake = Math.max(G.cam.shake, 0.25);
}
// put the hero on the rail of stage n: a frame turned about the Bagger (where it stands in the hall now), the
// rocks of that rail dropped in fresh, the Bagger's own spot carried over into the new frame
function bagStageSetup(B, n, delay = 0) {
  const Rm = CV.room, P = Rm.P, S = BAG_STAGES[n - 1], F0 = P.F;
  const wb = Rm.F ? cvW(Rm.F, B.x, B.z) : cvW(F0, 0, BAG.z);
  const yaw = F0.yaw + S.ang, c = Math.cos(yaw), s = Math.sin(yaw), bz = CAVE.rail - S.d;
  Rm.F = cvFrame(wb[0] - s * bz, wb[1] - c * bz, yaw);
  Rm.D = { ...BAG_ROOM, hw: S.hw, wallHw: 40, len: 99 };
  B.x = 0; B.z = bz; B.slew = 0.62 * B.side;
  Rm.hx = 0; Rm.hvx = 0;
  Rm.covers = [];
  for (const x of S.covers) Rm.covers.push(cvCover(P, x, CAVE.coverZ, CAVE.coverHp, false));
  for (const [x, z] of S.pillars || []) Rm.covers.push({ ...cvCover(P, x, z, Infinity, false), pillar: true, hw: 1.0, hd: 1.0, h: 99, model: 'cpillar' });
  for (const [x, z] of S.foe || []) Rm.covers.push(cvCover(P, x, z, CAVE.foeCoverHp, true));
  cvDropCovers(Rm, delay);
  B.regrow = [];
  CV.camSnap = true;
}
// on to the next stage: a roar, the view goes dark, and the hero comes back on another side of the machine
function bagShift(B, n) {
  B.state = 'shift'; B.t = 0; B.next = n; B.moving = true; B.beam = null; B.glow = 0; B.rocks = []; B.quakes = []; B.target = null; B.fired = B.flung = B.called = false;
  for (const f of CV.room.foes) if (!f.dying) f.dying = 0.001;
  CV.bolts.length = 0; CV.spears.length = 0; G.run.tele = [];
  AUDIO.play('roar'); AUDIO.play('horn');
  G.cam.shake = Math.max(G.cam.shake, 0.4);
  const Rm = CV.room;
  for (const sx of [-1, 1]) { const p = bagLocal(B, sx * 0.24, 2.0, -0.52), w = cvW3(Rm.F, ...p); for (let i = 0; i < 8; i++) FX.smoke(w[0], w[1] + i * 0.3, w[2], 1.2, [0.85, 0.85, 0.9], 1.6, 3); }
}
function bagShiftUpdate(B, dt) {
  B.wheelV = 3.2;
  if (B.t > 0.45 && !B.shifted) CV.fadeTo = 1;
  if (B.t > 1.0 && !B.shifted) {
    B.shifted = true; B.stage = B.next;
    bagStageSetup(B, B.stage, 0.6);
    if (B.stage >= 3) B.stage2 = true;
    if (B.stage === 4) B.tint = hexToRgb('#ff3a1a');
    UI.banner(BAG_STAGES[B.stage - 1].name || 'STAGE ' + B.stage, true);
    CV.fadeTo = 0;
  }
  if (B.t > 2.6) { B.shifted = false; B.moving = false; B.state = 'idle'; B.cd = 1.2; B.plan = 0; }
}
// body-local (model units) -> room-local, through the slew
function bagLocal(B, mx, my, mz) {
  const S = BAG.S, c = Math.cos(B.slew), s = Math.sin(B.slew);
  return [B.x + (c * mx + s * mz) * S, my * S, B.z + (-s * mx + c * mz) * S];
}
// where the wheel's hub is, in room-local coordinates
function bagTip(B) {
  const h = BAG_HINGE, L = BAG_BOOM_LEN, p = B.pitch;
  return bagLocal(B, h[0], h[1] - L * Math.sin(p), h[2] + L * Math.cos(p));
}
const bagHeart = B => bagLocal(B, ...BAG.heart);

function bagUpdate(dt) {
  const B = CV.boss, Rm = CV.room, run = G.run;
  B.flash = Math.max(0, B.flash - dt * 4);
  B.t += dt;
  B.wheel += dt * B.wheelV * (B.stage2 ? 1.5 : 1);
  cvCoverDrops(dt, Rm);
  if (CV.phase === 'bossintro') {
    cvHeroRail(dt, Rm);
    cvAimAndShoot(Rm);
    B.eyes = Math.min(1, B.eyes + dt);
    if (CV.t > 2.2) { CV.phase = 'boss'; CV.t = 0; }
    bagMove(B, dt, 0);
    return;
  }
  if (CV.phase === 'won') { bagDying(B, dt); cvHeroIdle(dt); return; }
  cvHeroRail(dt, Rm);
  cvAimAndShoot(Rm);
  for (const c of Rm.covers) { c.shake = Math.max(0, c.shake - dt * 3); c.flash = Math.max(0, c.flash - dt * 3); }
  for (const f of Rm.foes) cvFoe(f, dt, Rm);
  Rm.foes = Rm.foes.filter(f => !(f.dying >= 1));
  // the pillars turn see-through when the hero is behind one
  for (const c of Rm.covers) if (c.pillar) c.fade = clamp((c.fade || 0) + (Math.abs(Rm.hx - c.lx) < 2.2 ? 3 : -3) * dt, 0, 0.6);
  bagRegrow(B, dt, Rm);
  bagRocks(B, dt, Rm);
  bagSpikes(B, dt, Rm);
  // the next stage at 75%, 50% and 25% health
  if (!B.moving && B.stage < 4 && B.hp < B.maxHp * (1 - B.stage * 0.25)) bagShift(B, B.stage + 1);
  if (B.moving) { bagShiftUpdate(B, dt); bagMove(B, dt, 0); B.pitch += (-0.3 - B.pitch) * Math.min(1, dt * 2); return; }
  // it stands three-quarters on, its wheel off to one side (so its face and heart look past it), now and then
  // swinging the wheel across to the other side
  const off = B.side * 0.62;
  let wantX = clamp(Rm.hx * 0.45, -5, 5), wantSlew = Math.atan2(Rm.hx - B.x, CAVE.rail - B.z) + off, wantPitch = -0.08;
  switch (B.state) {
    case 'idle': {
      B.wheelV = 0.6;
      B.cd -= dt;
      if (B.cd <= 0) {
        const plan = bagPlan(B);
        let next = plan[B.plan++ % plan.length];
        if (next === 'minions' && Rm.foes.filter(f => !f.dying).length >= 3) next = 'goo';
        B.state = next; B.t = 0; B.n = 0;
      }
      break;
    }
    case 'roar': {
      wantPitch = -0.3; B.wheelV = 3;
      if (B.t > 1.5) { B.state = 'idle'; B.cd = 0.6; }
      break;
    }
    case 'goo': {
      // the mouth spits blobs at head height, one after another
      const n = B.stage2 ? 5 : 3;
      if (B.t > 0.45 + B.n * 0.32 && B.n < n) { B.n++; bagSpit(B, Rm); }
      if (B.t > 0.6 + n * 0.32) { B.state = 'idle'; B.cd = B.stage2 ? 0.8 : 1.4; }
      break;
    }
    case 'barrage': {
      // dig in, lift, fling
      if (B.t < 1.1) { wantPitch = 0.28; B.wheelV = 3.2; if (Math.random() < dt * 30) { const tp = bagTip(B), w = cvW3(Rm.F, tp[0], 0.3, tp[2] + rand(-1, 1) * 2); FX.burst(w[0], 0.3, w[2], 3, [0.5, 0.44, 0.38], 5, 0.12, 0.6, 1, 4); } if (B.t < dt * 1.5) { AUDIO.play('rumble'); G.cam.shake = Math.max(G.cam.shake, 0.12); } }
      else if (B.t < 1.7) { wantPitch = -0.34; B.wheelV = 2.2; }
      else if (!B.flung) { B.flung = true; bagBarrage(B, Rm); }
      if (B.t > 2.4) { B.flung = false; B.state = 'idle'; B.cd = B.stage2 ? 1.0 : 1.7; if (Math.random() < 0.6) B.side = -B.side; }
      break;
    }
    case 'beam': {
      // charge (the heart blazes), then sweep the rail from one side to the other (and back, in stage 2)
      const charge = 1.25, sweep = 2.5, back = B.stage2;
      if (B.t < dt * 1.5) { B.dir = Rm.hx > 0 ? -1 : 1; AUDIO.play('laser'); addTele({ kind: 'lane', ...bagLaneTele(Rm), dur: charge }); }
      B.glow = Math.min(1, B.t / charge);
      wantPitch = -0.2;
      if (B.t < charge) { const hp = cvW3(Rm.F, ...bagHeart(B)); if (Math.random() < dt * 40) { const a = rand(0, TAU), r = rand(1.5, 2.5); FX.part(hp[0] + Math.cos(a) * r, hp[1] + Math.sin(a) * r, hp[2] + rand(-0.5, 0.5), -Math.cos(a) * r * 2.2, -Math.sin(a) * r * 2.2, 0, 0.12, 0.02, 0.45, [1, 0.6, 0.2], 1, 0, 0); } }
      else {
        const u = (B.t - charge) / sweep, total = back ? 2 : 1;
        if (u >= total) { B.beam = null; B.glow = 0; B.state = 'idle'; B.cd = B.stage2 ? 1.0 : 1.6; break; }
        const v = u <= 1 ? u : 2 - u, x = B.dir * lerp(-Rm.D.hw + 0.5, Rm.D.hw - 0.5, smoothstep(0, 1, v));
        B.beam = bagBeam(B, Rm, x, dt);
        wantSlew = Math.atan2(x - B.x, CAVE.rail - B.z) + off * 0.8;
      }
      break;
    }
    case 'smash': {
      // mark the rock the hero hides behind (or the hero), then shatter it with a spinning drill-rock
      if (!B.target) {
        const c = Rm.covers.filter(c => !c.foe && !c.pillar && !c.broken).sort((a, b) => Math.abs(a.lx - Rm.hx) - Math.abs(b.lx - Rm.hx))[0];
        B.target = c && Math.abs(c.lx - Rm.hx) < c.hw + 0.6 ? c : { lx: Rm.hx, lz: CAVE.rail, spot: true };
        const w = cvW(Rm.F, B.target.lx, B.target.lz);
        B.tele = addTele({ kind: 'circle', x: w[0], z: w[1], r: 2.3, dur: 1.4 });
        AUDIO.play('whistle');
      }
      if (!B.target.spot) { B.target.shake = 1; B.target.flash = 0.6 + 0.4 * Math.sin(B.t * 30); }
      wantSlew = Math.atan2(B.target.lx - B.x, B.target.lz - B.z) + off; wantPitch = 0.05; B.wheelV = 2.5;
      if (B.t > 0.85 && !B.fired) { B.fired = true; bagDrill(B, Rm, B.target); }
      if (B.t > 2.0) { B.fired = false; B.target = null; B.state = 'idle'; B.cd = B.stage2 ? 0.9 : 1.5; }
      break;
    }
    case 'quake': {
      // it raises the boom and slams the wheel down: lanes of rock spikes run out across the floor to the rail, one
      // under the hero, erupting along their length
      wantPitch = B.t < 0.8 ? -0.42 : 0.34; B.wheelV = 2.6;
      if (B.t < dt * 1.5) AUDIO.play('rumble');
      if (B.t > 0.8 && !B.flung) {
        B.flung = true; G.cam.shake = Math.max(G.cam.shake, 0.3); AUDIO.play('boom');
        const lim = Rm.D.hw - 1, xs = [clamp(Rm.hx, -lim, lim), clamp(Rm.hx + (Math.random() < 0.5 ? -1 : 1) * rand(3.2, 4.5), -lim, lim)];
        if (B.stage2) xs.push(clamp(-Rm.hx * 0.8 + rand(-1, 1), -lim, lim));
        for (const x of xs) bagQuakeLane(B, Rm, x);
      }
      if (B.t > 2.9) { B.flung = false; B.state = 'idle'; B.cd = B.stage2 ? 0.9 : 1.5; }
      break;
    }
    case 'rain': {
      // the boom tips up and the wheel flings goo high into the air: it rains down on marked circles that sweep along
      // the rail from one end to the other, every fourth one on the hero
      wantPitch = -0.45; B.wheelV = 3.4;
      if (B.t < dt * 1.5) { B.dir = Rm.hx > 0 ? -1 : 1; AUDIO.play('splash'); }
      const n = B.stage2 ? 12 : 9, every = 0.2;
      if (B.t > 0.5 + B.n * every && B.n < n) {
        const u = B.n / (n - 1), x = B.dir * lerp(-Rm.D.hw + 0.8, Rm.D.hw - 0.8, u);
        bagLobGoo(B, Rm, B.n % 4 === 3 ? Rm.hx : x);
        B.n++;
      }
      if (B.t > 0.5 + n * every + 1.4) { B.state = 'idle'; B.cd = B.stage2 ? 0.9 : 1.5; }
      break;
    }
    case 'spin': {
      // it spins its whole upper works round once, the wheel at full tilt, spraying rocks across the rail as the
      // wheel sweeps past the hero's side
      B.wheelV = 4; wantPitch = 0.05;
      const dur = B.stage2 ? 2.4 : 3.0, u = clamp(B.t / dur, 0, 1);
      if (B.t < dt * 1.5) { B.spin0 = B.slew; B.spinDir = Math.random() < 0.5 ? -1 : 1; AUDIO.play('rumble'); B.lastSpray = 0; }
      B.slew = B.spin0 + smoothstep(0, 1, u) * TAU * B.spinDir;
      if (B.t - B.lastSpray > 0.1 && u < 1) {
        B.lastSpray = B.t;
        const dx = Math.sin(B.slew), dz = Math.cos(B.slew);
        if (dz > 0.25) { const x = B.x + dx * (CAVE.rail - B.z) / dz; if (Math.abs(x) < Rm.D.hw + 2) bagFling(B, Rm, clamp(x, -Rm.D.hw + 0.6, Rm.D.hw - 0.6)); }
      }
      if (B.t > dur + 0.7) { B.state = 'idle'; B.cd = 1.4; }
      break;
    }
    case 'volley': {
      // a drill-rock at every rock on the rail at once (or at the hero, where none are left): stand in the open
      if (!B.targets) {
        B.targets = Rm.covers.filter(c => !c.foe && !c.pillar && !c.broken);
        if (!B.targets.length) B.targets = [{ lx: Rm.hx, lz: CAVE.rail, spot: true }];
        for (const c of B.targets) { const w = cvW(Rm.F, c.lx, c.lz); addTele({ kind: 'circle', x: w[0], z: w[1], r: 2.3, dur: 1.2 + B.targets.indexOf(c) * 0.18 }); }
        AUDIO.play('whistle');
      }
      for (const c of B.targets) if (!c.spot) { c.shake = 1; c.flash = 0.6 + 0.4 * Math.sin(B.t * 30); }
      wantPitch = 0.05; B.wheelV = 3;
      if (B.t > 0.85 + B.n * 0.18 && B.n < B.targets.length) { bagDrill(B, Rm, B.targets[B.n]); B.n++; }
      if (B.t > 2.4) { B.targets = null; B.state = 'idle'; B.cd = 1.6; }
      break;
    }
    case 'minions': {
      if (B.t < dt * 1.5) { AUDIO.play('horn'); for (const sx of [-1, 1]) { const p = bagLocal(B, sx * 0.24, 2.0, -0.52), w = cvW3(Rm.F, ...p); for (let i = 0; i < 6; i++) FX.smoke(w[0], w[1] + i * 0.25, w[2], 1, [0.85, 0.85, 0.9], 1.4, 2.5); } }
      if (B.t > 0.6 && !B.called) { B.called = true; bagMinions(B, Rm); }
      if (B.t > 1.6) { B.called = false; B.state = 'idle'; B.cd = 1.2; }
      break;
    }
  }
  B.pitch += (wantPitch - B.pitch) * Math.min(1, dt * 2.2);
  if (B.state !== 'spin') B.slew = angleLerp(B.slew, wantSlew, Math.min(1, dt * (B.state === 'beam' ? 10 : 1.4)));
  bagMove(B, dt, wantX);
  if (B.hp <= 0 && CV.phase === 'boss') bagDefeated(B);
}
function bagMove(B, dt, wantX) {
  const dx = wantX - B.x, sp = Math.sign(dx) * Math.min(Math.abs(dx), 0.9 * dt);
  B.x += sp;
  if (Math.abs(sp) > 0.001 && Math.random() < dt * 20) { const w = cvW3(CV.room.F, B.x + rand(-1, 1) * 3, 0.2, B.z + rand(-1, 1) * 3.5); FX.smoke(w[0], 0.3, w[2], 0.7, [0.45, 0.4, 0.35], 1, 0.3); }
}
// a lane of rock spikes from in front of the machine out past the rail, marked first; the eruption runs along it
function bagQuakeLane(B, Rm, x) {
  const z0 = B.z + 3.2, z1 = CAVE.rail + 1.6, a = cvW(Rm.F, x, z0);
  addTele({ kind: 'lane', x: a[0], z: a[1], r: 1.1, len: z1 - z0, rot: Rm.F.yaw, dur: 1.0 });
  B.quakes.push({ x, z0, z1, t: -1.0, last: z0, hit: false, hitC: new Set() });
}
function bagSpikes(B, dt, Rm) {
  for (const q of B.quakes) {
    q.t += dt;
    if (q.t < 0) continue;
    const front = q.z0 + q.t * 15;
    while (q.last < Math.min(front, q.z1)) {
      q.last += 1.1;
      B.spikes.push({ lx: q.x + rand(-0.45, 0.45), lz: q.last, t: 0, s: rand(1.3, 1.9), yaw: rand(0, TAU) });
      const w = cvW(Rm.F, q.x, q.last); FX.burst(w[0], 0.3, w[1], 6, [0.55, 0.48, 0.42], 5, 0.12, 0.5, 1, 2);
    }
    if (!q.hit && front >= CAVE.rail - 0.4) { q.hit = true; if (Math.abs(Rm.hx - q.x) < 1.2) cvHurtHero(BAG.quakeDmg, null, { x: cvW(Rm.F, q.x, CAVE.rail)[0], z: cvW(Rm.F, q.x, CAVE.rail)[1] }); AUDIO.play('crumble', 0.7); }
    for (const c of Rm.covers) if (!c.pillar && !c.broken && !q.hitC.has(c) && Math.abs(c.lx - q.x) < c.hw + 0.7 && front >= c.lz) { q.hitC.add(c); cvHurtCover(c, 50, null); if (c.broken && !c.foe) B.regrow.push({ c, t: 7 }); }
    if (front > q.z1 + 1) q.done = true;
  }
  B.quakes = B.quakes.filter(q => !q.done);
  for (const k of B.spikes) k.t += dt;
  B.spikes = B.spikes.filter(k => k.t < 1.6);
}
// a gob of goo lobbed high off the wheel onto a marked circle
function bagLobGoo(B, Rm, x) {
  const F = Rm.F, tip = bagTip(B), o = cvW3(F, tip[0], tip[1] + BAG_WHEEL_R * BAG.S, tip[2]), tz = CAVE.rail + rand(-0.6, 0.6), t = cvW(F, x, tz), dur = 1.15;
  B.rocks.push({ sx: o[0], sy: o[1], sz: o[2], tx: t[0], tz: t[1], lx: x, lz: tz, t: 0, dur, spin: 0, goo: true, s: 1, r: 1.15, peak: 9 });
  addTele({ kind: 'circle', x: t[0], z: t[1], r: 1.15, dur });
  AUDIO.play('gooshot', 0.4);
}
// a rock flung flat off the spinning wheel at a spot on the rail
function bagFling(B, Rm, x) {
  const F = Rm.F, tip = bagTip(B), o = cvW3(F, tip[0], tip[1], tip[2]), tz = CAVE.rail + rand(-0.5, 0.5), t = cvW(F, x, tz), dur = 0.8;
  B.rocks.push({ sx: o[0], sy: o[1], sz: o[2], tx: t[0], tz: t[1], lx: x, lz: tz, t: 0, dur, spin: rand(0, TAU), m: 'boulder' + Math.floor(rand(0, 3)), s: rand(0.55, 0.75), r: 1.0, peak: 2.5 });
  addTele({ kind: 'circle', x: t[0], z: t[1], r: 1.0, dur });
}
function bagLaneTele(Rm) { const a = cvW(Rm.F, -Rm.D.hw, CAVE.rail); return { x: a[0], z: a[1], r: 0.9, len: Rm.D.hw * 2, rot: Rm.F.yaw + Math.PI / 2 }; }
// the beam from the heart toward a point on the rail at knee height, stopped by the first rock in its way;
// it carries on past the rail down to the floor behind
function bagBeam(B, Rm, x, dt) {
  const o = bagHeart(B), t = [x, BAG.beamY, CAVE.rail], d = [t[0] - o[0], t[1] - o[1], t[2] - o[2]];
  const len = o[1] / -d[1];
  let end = [o[0] + d[0] * len, 0, o[2] + d[2] * len], hitCover = null;
  for (let u = 0.3; u < len; u += 0.03) {
    const p = [o[0] + d[0] * u, o[1] + d[1] * u, o[2] + d[2] * u];
    const c = Rm.covers.find(c => Math.abs(p[0] - c.lx) < c.hw && Math.abs(p[2] - c.lz) < c.hd && p[1] < (c.broken ? 0.35 : c.h));
    if (c) { end = p; hitCover = c; break; }
    // the hero, if it reaches the rail
    if (Math.abs(p[2] - CAVE.rail) < 0.35 && Math.abs(p[0] - Rm.hx) < CAVE.heroR && p[1] < cvHeroTop(Rm)) { cvHurtHero(BAG.beamDmg, null, { x: cvW3(Rm.F, ...p)[0], z: cvW3(Rm.F, ...p)[2] }); }
  }
  if (hitCover) cvHurtCover(hitCover, 55 * dt, null);
  const we = cvW3(Rm.F, ...end);
  if (Math.random() < 0.7) FX.burst(we[0], we[1] + 0.05, we[2], 2, [1, 0.7, 0.3], 4, 0.06, 0.3, 1, 2);
  if (!hitCover && Math.random() < dt * 30) FX.scorch(we[0], we[2], 0.7, 2.5);
  return { o, end };
}
function bagSpit(B, Rm) {
  const F = Rm.F, m = bagLocal(B, 0, 0.99, 0.66), ty = cvHeroTop(Rm) - 0.3, tx = Rm.hx + rand(-0.3, 0.3);
  const dx = tx - m[0], dy = ty - m[1], dz = CAVE.rail - m[2], d = Math.hypot(dx, dy, dz), v = cvDirW(F, dx / d, dz / d), w = cvW3(F, ...m), sp = 21;
  CV.bolts.push({ x: w[0], y: w[1], z: w[2], vx: v[0] * sp, vy: dy / d * sp, vz: v[1] * sp, t: 0, dmg: BAG.gooDmg, goo: true, r: 0.32 });
  FX.droplets(w[0], w[1], w[2], 5, 4, 3, 0.07, null);
  AUDIO.play('gooshot', 0.6);
}
// a shower of rocks lobbed onto marked circles along the rail, two of them close to the hero
function bagBarrage(B, Rm) {
  const n = B.stage2 ? 11 : 7, F = Rm.F, tip = bagTip(B), o = cvW3(F, tip[0], tip[1] + BAG_WHEEL_R * BAG.S * 0.8, tip[2]);
  for (let i = 0; i < n; i++) {
    const tx = clamp(i < 2 ? Rm.hx + rand(-1.2, 1.2) : rand(-Rm.D.hw + 1, Rm.D.hw - 1), -Rm.D.hw + 1, Rm.D.hw - 1), tz = CAVE.rail + rand(-0.9, 0.9), t = cvW(F, tx, tz);
    const dur = 1.0 + i * (0.7 / n) + rand(0, 0.15);
    B.rocks.push({ sx: o[0] + rand(-1, 1), sy: o[1], sz: o[2], tx: t[0], tz: t[1], lx: tx, lz: tz, t: 0, dur, spin: rand(0, TAU), m: 'boulder' + (i % 3), s: rand(0.7, 1.0), r: 1.25 });
    addTele({ kind: 'circle', x: t[0], z: t[1], r: 1.25, dur });
  }
  AUDIO.play('throw'); G.cam.shake = Math.max(G.cam.shake, 0.15);
}
// the cover-smasher: a big spinning rock fired flat and fast at the marked spot
function bagDrill(B, Rm, target) {
  const F = Rm.F, tip = bagTip(B), o = cvW3(F, tip[0], tip[1] + 1, tip[2] + BAG_WHEEL_R * BAG.S * 0.6), t = cvW(F, target.lx, target.lz);
  B.rocks.push({ sx: o[0], sy: o[1], sz: o[2], tx: t[0], tz: t[1], lx: target.lx, lz: target.lz, t: 0, dur: 0.55, spin: 0, m: 'boulder1', s: 1.7, r: 2.3, drill: true, target, peak: 1.2 });
  AUDIO.play('throw', 0.6);
}
function bagRocks(B, dt, Rm) {
  for (const k of B.rocks) {
    k.t += dt; k.spin += dt * (k.drill ? 18 : 6);
    const u = clamp(k.t / k.dur, 0, 1);
    k.x = lerp(k.sx, k.tx, u); k.z = lerp(k.sz, k.tz, u); k.y = lerp(k.sy, 0.6 * k.s, u) + Math.sin(u * Math.PI) * (k.peak ?? 6);
    if (k.drill && Math.random() < 0.8) FX.part(k.x, k.y, k.z, rand(-1, 1), rand(-1, 1), rand(-1, 1), 0.12, 0.3, 0.5, [0.5, 0.45, 0.4], 0.6, 2, 0, 1);
    if (u >= 1 && k.goo) {
      k.done = true;
      FX.droplets(k.tx, 0.4, k.tz, 16, 4, 4, 0.09, ORANGE); FX.burst(k.tx, 0.3, k.tz, 10, [1, 0.6, 0.2], 4, 0.1, 0.5, 1, 2); FX.scorch(k.tx, k.tz, 1.1, 3);
      AUDIO.play('splash', 0.7);
      const h = G.hero.pos;
      if (Math.hypot(h[0] - k.tx, h[2] - k.tz) < k.r + 0.25) cvHurtHero(BAG.rainDmg, null, { x: k.tx, z: k.tz });
      for (const c of Rm.covers) if (!c.pillar && !c.broken && Math.abs(k.lx - c.lx) < c.hw + 0.4 && Math.abs(k.lz - c.lz) < c.hd + 0.6) cvHurtCover(c, 18, null);
      continue;
    }
    if (u >= 1) {
      k.done = true;
      FX.burst(k.tx, 0.4, k.tz, k.drill ? 30 : 12, [0.55, 0.48, 0.42], k.drill ? 8 : 5, k.drill ? 0.2 : 0.12, 0.8, 1, 3);
      FX.crack(k.tx, k.tz, k.r * 1.1, 2.5);
      for (let i = 0; i < (k.drill ? 5 : 2); i++) FX.smoke(k.tx + rand(-1, 1), rand(0.3, 1), k.tz + rand(-1, 1), k.drill ? 1.2 : 0.7, [0.5, 0.45, 0.4], 1.4, 0.6);
      AUDIO.play(k.drill ? 'crumble' : 'boom', 0.8);
      G.cam.shake = Math.max(G.cam.shake, k.drill ? 0.3 : 0.1);
      const h = G.hero.pos;
      if (!k.debris && Math.hypot(h[0] - k.tx, h[2] - k.tz) < k.r + 0.25) cvHurtHero(k.drill ? BAG.smashDmg : BAG.rockDmg, null, { x: k.tx, z: k.tz });
      // rocks landing on cover chip it; the drill-rock shatters it
      for (const c of Rm.covers) if (!c.pillar && !c.broken && Math.abs(k.lx - c.lx) < c.hw + 0.4 && Math.abs(k.lz - c.lz) < c.hd + 0.6) { cvHurtCover(c, k.drill ? 9999 : 35, null); if (c.broken && !c.foe) B.regrow.push({ c, t: k.drill ? 6.5 : 8 }); }
    }
  }
  B.rocks = B.rocks.filter(k => !k.done);
}
// smashed rocks come back: a rockfall from the ceiling onto the same spot
function bagRegrow(B, dt, Rm) {
  for (const g of B.regrow) {
    g.t -= dt;
    if (g.t < 1.2 && !g.warned) { g.warned = true; const w = cvW(Rm.F, g.c.lx, g.c.lz); addTele({ kind: 'circle', x: w[0], z: w[1], r: 1.6, dur: 1.2 }); AUDIO.play('rumble'); }
    if (g.t < 1.2 && Math.random() < dt * 20) { const w = cvW(Rm.F, g.c.lx + rand(-1, 1), g.c.lz + rand(-0.5, 0.5)); FX.part(w[0], CAVE.ceil, w[1], 0, -2, 0, 0.12, 0.08, 1.2, [0.5, 0.45, 0.4], 0.8, 2, -9, 0); }
    if (g.t <= 0) {
      Object.assign(g.c, { broken: false, hp: g.c.maxHp, model: 'cover' + Math.floor(Math.random() * 3), shake: 1 });
      const w = cvW(Rm.F, g.c.lx, g.c.lz);
      FX.burst(w[0], 1, w[1], 18, [0.55, 0.48, 0.42], 5, 0.16, 0.7, 1, 2);
      for (let i = 0; i < 4; i++) FX.smoke(w[0] + rand(-1, 1), rand(0.3, 1.2), w[1] + rand(-0.5, 0.5), 0.9, [0.5, 0.45, 0.4], 1.5, 0.4);
      AUDIO.play('crumble'); G.cam.shake = Math.max(G.cam.shake, 0.15);
      g.done = true;
    }
  }
  B.regrow = B.regrow.filter(g => !g.done);
}
// its minions come out of the side alcoves and take the rocks near the walls
function bagMinions(B, Rm) {
  const n = B.stage2 ? 3 : 2, types = B.stage2 ? ['xbow', 'spear', 'mole', 'goblin', 'spider', 'bat'] : ['xbow', 'goblin', 'mole', 'spider'];
  for (let i = 0; i < n; i++) {
    const type = pick(types), T = CAVE_FOES[type], sx = i % 2 ? 1 : -1;
    const al = cvL(Rm.F, ...cvW(Rm.P.F, sx * (BAG_ROOM.hw + 3), -18 + rand(-1.5, 1.5)));
    const f = { type, T, hp: T.hp, maxHp: T.hp, lx: al[0], lz: al[1], y: 0, sink: 0, state: 'enter', t: 0, yaw: 0, flash: 0, ph: Math.random(), clip: 'run', u: 0, cover: null, throws: 0, tint: hexToRgb(T.tint), dying: 0, peekX: 0 };
    if (type === 'mole') { f.lx = sx * (Rm.D.hw - 0.4); f.lz = rand(-11, -15); f.state = 'burst'; f.t = -i * 0.4; }
    else if (type === 'spider') { f.lx = rand(-6, 6); f.lz = rand(-11, -15); f.y = CAVE.ceil; f.state = 'drop'; f.t = -i * 0.4; }
    else if (type === 'bat') { f.lx = sx * (Rm.D.hw - 1); f.lz = -18; f.y = 3.6; f.state = 'fly'; f.t = 0; }
    else {
      const free = Rm.covers.filter(c => c.foe && !c.broken && !Rm.foes.some(o => o.cover === c && !o.dying) && Math.sign(c.lx) === sx);
      const c = free[0] || Rm.covers.find(c => c.foe && Math.sign(c.lx) === sx);
      f.cover = c; f.tx = c.lx + rand(-0.4, 0.4); f.tz = c.lz - 1.15;
    }
    Rm.foes.push(f);
  }
}
// the Bagger lights itself: its glowing heart, a floodlight over the machine-house, and the wheel's glow
function bagLights() {
  const B = CV.boss, F = CV.room.F, tm = R.frame.time, out = [];
  if (B.dying > 4.2) return out;
  const hp = cvW3(F, ...bagHeart(B)), top = cvW3(F, ...bagLocal(B, 0, 2.6, 0.6)), tip = cvW3(F, ...bagTip(B));
  out.push({ x: hp[0], y: hp[1], z: hp[2] + 0.5, r: 5 + B.glow * 6 + Math.sin(tm * 5) * 0.4 });
  out.push({ x: top[0], y: top[1], z: top[2], r: 9 });
  out.push({ x: tip[0], y: tip[1] + 2, z: tip[2], r: 7 });
  return out;
}
// ---------- getting hit ----------
function bagHitAt(lx, y, lz) {
  const B = CV.boss;
  if (!B || B.dying > 3) return null;
  const S = BAG.S, hp = bagHeart(B);
  if (Math.hypot(lx - hp[0], y - hp[1], lz - hp[2]) < BAG.heartR * S * 0.55) return { kind: 'bagheart' };
  // the wheel: a disc as thick as the buckets, in the plane of the boom
  const tip = bagTip(B), ax = Math.cos(B.slew), az = -Math.sin(B.slew), dx = lx - tip[0], dy = y - tip[1], dz = lz - tip[2];
  const across = dx * ax + dz * az;
  if (Math.abs(across) < 0.3 * S && Math.hypot(dx - ax * across, dy, dz - az * across) < BAG_WHEEL_R * S * 1.08) return { kind: 'bagwheel' };
  const body = bagLocal(B, 0, 1.2, -0.05);
  if (Math.hypot((lx - body[0]) / 0.66, (y - body[1]) / 0.55, (lz - body[2]) / 0.7) < S) return { kind: 'bagbody' };
  if (Math.abs(lx - B.x) < 0.85 * S && Math.abs(lz - B.z) < 1.0 * S && y < 0.6 * S) return { kind: 'bagbase' };
  // the boom: a fat line from the hinge to the wheel
  const hg = bagLocal(B, ...BAG_HINGE), bx = tip[0] - hg[0], by = tip[1] - hg[1], bz = tip[2] - hg[2], L2 = bx * bx + by * by + bz * bz;
  const u = clamp(((lx - hg[0]) * bx + (y - hg[1]) * by + (lz - hg[2]) * bz) / L2, 0, 1);
  if (Math.hypot(lx - hg[0] - bx * u, y - hg[1] - by * u, lz - hg[2] - bz * u) < 0.25 * S) return { kind: 'bagboom' };
  return null;
}
const bagBlocks = (lx, y, lz) => !!bagHitAt(lx, y, lz);
function bagShotHit(hit, dmg, s) {
  const B = CV.boss;
  if (CV.phase !== 'boss' || B.moving) { FX.burst(s.x, s.y, s.z, 4, [0.8, 0.8, 0.85], 3, 0.05, 0.25, 1); return; }
  const mul = { bagheart: 2.5, bagbody: 1, bagwheel: 0.4, bagboom: 0.3, bagbase: 0.3 }[hit.kind];
  const d = dmg * mul;
  B.hp -= d; B.flash = 0.12;
  addNumberAt(s.x, s.y + 0.5, s.z, d, hit.kind === 'bagheart' ? [1, 0.85, 0.25] : mul < 1 ? [0.75, 0.8, 0.9] : null);
  CV.hitMark = 1; CV.hitHead = hit.kind === 'bagheart';
  if (hit.kind === 'bagheart') { FX.burst(s.x, s.y, s.z, 12, [1, 0.6, 0.2], 5, 0.1, 0.5, 1); AUDIO.play('splash', 0.8); }
  else if (mul < 1) { FX.burst(s.x, s.y, s.z, 6, [1, 0.85, 0.5], 4, 0.05, 0.25, 1); AUDIO.play('clang', 0.7); }
  else { FX.droplets(s.x, s.y, s.z, 8, 4, 3, 0.07, null); AUDIO.play('squish'); }
}
function bagDefeated(B) {
  CV.phase = 'won'; CV.t = 0; B.state = 'dead'; B.dying = 0; B.beam = null; B.rocks = []; B.glow = 0; B.quakes = []; B.moving = false; B.mastSink = 0;
  for (const f of CV.room.foes) if (!f.dying) f.dying = 0.001;
  CV.bolts.length = 0; CV.spears.length = 0; G.run.tele = [];
  UI.banner('THE BAGGER FALLS', true);
  AUDIO.play('roar'); AUDIO.play('horn');
}
// the end, in four beats, the camera circling it: its heart cracks (a moment of slow motion), the bucket wheel snaps
// off its boom and rolls away, explosions run all over it as the boom droops and the masts sink, and then the heart
// bursts in a blast of goo and the machine slumps into the floor while rock rains from the ceiling
function bagDying(B, dt) {
  const Rm = CV.room, F = Rm.F, S = BAG.S;
  const slow = B.dying > 0.8 && B.dying < 1.5 ? 0.3 : 1;
  B.dying += dt * slow;
  const t = B.dying;
  B.wheelV = Math.max(0, 3 - t * 1.4);
  if (t < 1.6) {
    B.flash = Math.sin(t * 40) > 0 ? 0.5 : 0;
    if (Math.random() < dt * 30) { const hp = cvW3(F, ...bagHeart(B)); FX.part(hp[0], hp[1], hp[2], rand(-4, 4), rand(-1, 4), rand(-4, 4), 0.1, 0.02, 0.5, [1, 0.8, 0.3], 1, 0, -9); }
    if (t > 0.8 && !B.cracked) { B.cracked = true; R.frame.flashW = 0.5; AUDIO.play('crumble'); AUDIO.play('thunder', 0.5); G.cam.shake = Math.max(G.cam.shake, 0.35); }
  }
  if (t > 1.6 && !B.wheelOff) {
    const tip = cvW3(F, ...bagTip(B)), fw = cvDirW(F, Math.sin(B.slew), Math.cos(B.slew));
    B.wheelOff = { x: tip[0], y: tip[1], z: tip[2], vx: fw[0] * 6, vy: 3, vz: fw[1] * 6, yaw: F.yaw + B.slew, spin: B.wheel, sink: 0 };
    FX.burst(tip[0], tip[1], tip[2], 34, [1, 0.7, 0.3], 9, 0.16, 0.7, 1, 3); FX.droplets(tip[0], tip[1], tip[2], 12, 5, 5, 0.09, ORANGE);
    AUDIO.play('clang'); AUDIO.play('boom'); G.cam.shake = Math.max(G.cam.shake, 0.4);
  }
  const W = B.wheelOff;
  if (W) {
    const rad = BAG_WHEEL_R * S;
    W.vy -= 20 * dt; W.x += W.vx * dt; W.y += W.vy * dt; W.z += W.vz * dt;
    if (W.y < rad && W.vy < 0) {
      W.y = rad;
      if (W.vy < -3) { FX.burst(W.x, 0.3, W.z, 26, [0.55, 0.48, 0.42], 7, 0.18, 0.8, 1, 3); for (let i = 0; i < 4; i++) FX.smoke(W.x + rand(-2, 2), 0.6, W.z + rand(-2, 2), 1.6, [0.5, 0.45, 0.4], 1.8, 1); AUDIO.play('boom'); G.cam.shake = Math.max(G.cam.shake, 0.35); }
      W.vy = -W.vy * 0.3; W.vx *= 0.82; W.vz *= 0.82;
    }
    const sp = Math.hypot(W.vx, W.vz);
    W.spin += sp * dt / (TAU * rad); W.yaw += Math.sin(t * 3) * dt * 0.3;
    if (W.y <= rad + 0.01) { W.vx *= Math.exp(-dt * 0.9); W.vz *= Math.exp(-dt * 0.9); if (Math.random() < dt * 12 * Math.min(1, sp)) FX.smoke(W.x, 0.3, W.z, 0.9, [0.5, 0.45, 0.4], 1.2, 0.4); }
    if (t > 5.4) W.sink = Math.min(1, W.sink + dt * 0.5);
  }
  B.pitch = Math.min(0.45, B.pitch + dt * 0.3);
  if (t > 1.6 && t < 4.2 && Math.random() < dt * 11) {
    const p = bagLocal(B, rand(-0.6, 0.6), rand(0.6, 2.2), rand(-1.5, 0.6)), w = cvW3(F, ...p);
    FX.burst(w[0], w[1], w[2], 14, [1, 0.6, 0.2], 7, 0.16, 0.6, 1, 2);
    for (let i = 0; i < 2; i++) FX.smoke(w[0], w[1], w[2], 1.2, [0.3, 0.28, 0.26], 1.8, 1);
    FX.droplets(w[0], w[1], w[2], 8, 4, 5, 0.09, ORANGE);
    AUDIO.play('boom'); G.cam.shake = Math.max(G.cam.shake, 0.18);
  }
  B.mastSink = clamp((t - 2.6) / 1.6, 0, 1);
  if (t > 4.2 && !B.blown) {
    B.blown = true;
    const w = cvW3(F, ...bagHeart(B)), g = R.goo.base;
    FX.burst(w[0], w[1], w[2], 80, [1, 0.6, 0.2], 16, 0.32, 1.3, 1, 4);
    FX.droplets(w[0], w[1], w[2], 40, 8, 8, 0.12, ORANGE); FX.droplets(w[0], w[1], w[2], 24, 7, 7, 0.1, [g[0], g[1], g[2]]);
    for (let i = 0; i < 14; i++) FX.smoke(w[0] + rand(-5, 5), w[1] + rand(-2, 3), w[2] + rand(-5, 5), 2.6, [0.3, 0.28, 0.26], 2.6, 1.6);
    FX.glow(w[0], w[1], w[2], 9, [1, 0.6, 0.2], 0.6, 1);
    R.frame.flashW = 0.9; AUDIO.play('boom'); AUDIO.play('thunder'); AUDIO.play('splash');
    G.cam.shake = Math.max(G.cam.shake, 0.7);
  }
  // rock shaken loose from the ceiling
  if (t > 4.2 && t < 6.8 && Math.random() < dt * 9) {
    const x = B.x + rand(-9, 9), z = B.z + rand(-6, 9), w = cvW(F, x, z);
    B.rocks.push({ sx: w[0], sy: CAVE.ceil, sz: w[1], tx: w[0], tz: w[1], lx: x, lz: z, t: 0, dur: rand(0.6, 0.9), spin: rand(0, TAU), m: 'boulder' + Math.floor(rand(0, 3)), s: rand(0.6, 1.1), r: 1.2, peak: 0, debris: true });
  }
  bagRocks(B, dt, Rm);
  R.frame.flashW = Math.max(0, R.frame.flashW - dt * 1.5);
  if (t > 7.6) caveVictory();
}
function caveVictory() {
  const run = G.run;
  if (run.over) return;
  run.bossKills = (run.bossKills || 0) + 1;
  // the long way pays: a big purse and a scroll for sure
  if (CV.branch === 'L') { run.coins += Math.round(run.info.reward * 0.6); run.scrolls = (run.scrolls || 0) + 1; }
  $('gl').style.cursor = '';
  finishRun(true);
}

// ---------- camera and drawing ----------
function bagCamera(dt) {
  const B = CV.boss, Rm = CV.room, F = Rm.F;
  let e, t;
  if (CV.phase === 'bossintro') {
    // a look up at the machine first, settling down behind the hero
    const u = smoothstep(0.3, 2.2, CV.t);
    e = cvW3(F, Rm.hx * u, lerp(1.6, 3.4, u), CAVE.rail + lerp(1.5, 6.4, u));
    t = cvW3(F, B.x * (1 - u * 0.5), lerp(7.5, 3.3, u), B.z + lerp(4, 7, u));
  } else if (CV.phase === 'won') {
    const a = B.dying * 0.2, r = 18 - Math.min(B.dying, 4) * 0.5;
    e = cvW3(F, B.x + Math.sin(a) * r, 5.5 + B.dying * 0.25, B.z + Math.cos(a) * r); t = cvW3(F, B.x, 3.2 - Math.min(B.dying, 6) * 0.2, B.z);
  } else {
    e = cvW3(F, Rm.hx * 0.9, 4.0, CAVE.rail + 7.3);
    t = cvW3(F, lerp(Rm.hx, B.x, 0.5) * 0.7, 2.9, B.z + 9);
  }
  cvSetCam(e, t, 0.88, (CV.phase === 'bossintro' && CV.t < 0.05) || CV.camSnap ? 1 : dt);
  CV.camSnap = false;
}
function bagEmit() {
  const B = CV.boss, Rm = CV.room, F = Rm.F, S = BAG.S, f = R.frame, tm = f.time;
  // (its crawlers stay square to the hall, so each stage shows it from another side; only its upper works turn)
  const base = cvW3(F, B.x, 0, B.z), yawB = Rm.P.F.yaw, yawT = F.yaw + B.slew;
  const melt = B.dying > 4.2 ? clamp((B.dying - 4.2) / 1.8, 0, 1) : 0, sinkM = (B.mastSink || 0) * 2.6;
  const k = 1 + B.flash * 1.4, tint = B.tint, gT = [tint[0] * k, tint[1] * k, tint[2] * k];
  const draw = (m, x, y, z, yaw, row, sq = 1) => { if (R.enemyDraw[m]) pushEnemy(m, false, x, y, z, yaw, row, S, sq, melt * 0.6, B.flash > 0 ? 0.25 : 0, 0, gT[0], gT[1], gT[2]); };
  const still = m => MODELS.defs[m].clips.still.row;
  draw('bg_base', base[0], 0, base[2], yawB, still('bg_base'));
  draw('bg_body', base[0], 0, base[2], yawT, still('bg_body'), 1 - melt * 0.3);
  for (const sx of [-1, 1]) { const p = cvW3(F, ...bagLocal(B, sx * 0.45, 0, 0)); draw('bg_mast', p[0], -sinkM, p[2], yawT, still('bg_mast')); }
  draw('bg_cwt', base[0], 0, base[2], yawT, still('bg_cwt'));
  const bp = MODELS.defs.bg_boom.clips.bpitch, pf = Math.round(clamp((B.pitch - BAG_PITCH[0]) / (BAG_PITCH[1] - BAG_PITCH[0]), 0, 1) * (BAG_PITCH_FRAMES - 1));
  draw('bg_boom', base[0], 0, base[2], yawT, bp.row + pf);
  const tip = cvW3(F, ...bagTip(B)), ws = MODELS.defs.bg_wheel.clips.wspin, W = B.wheelOff;
  if (W) { if (R.enemyDraw.bg_wheel) pushEnemy('bg_wheel', false, W.x, W.y - BAG_WHEEL_Y * S - W.sink * 6, W.z, W.yaw, ws.row + Math.floor((W.spin % 1 + 1) % 1 * ws.frames), S, 1, 0, 0, 0, gT[0], gT[1], gT[2]); pushDecal(W.x, W.z, 3.2, 3.2, 0, 1, 0, 0, 0.01, 0.01, 0.01, 0.5 * (1 - W.sink)); }
  else draw('bg_wheel', tip[0], tip[1] - BAG_WHEEL_Y * S, tip[2], yawT, ws.row + Math.floor((B.wheel % 1 + 1) % 1 * ws.frames));
  // the shadow it casts in the torchlight
  pushDecal(base[0], base[2] + 1, 4.2, 5.5, -yawB, 1, 0, 0, 0.01, 0.01, 0.01, 0.75);
  // cables from the mast tops to the boom tip and the counterweight, and the boom's hydraulic rams
  const tube = (a, b, w, col, sag = 0) => { const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * sag, lerp(a[2], b[2], u)); } R.ribStrip(pts, 9, w, col, 1, 0, 1); };
  const tipL = bagTip(B);
  for (const sx of [-1, 1]) {
    const top = cvW3(F, ...bagLocal(B, sx * 0.45, 3.35, -0.05));
    tube(top, cvW3(F, tipL[0] + sx * 0.6, tipL[1] + 1.2, tipL[2]), 0.07, [0.16, 0.17, 0.2, 1], 0.4);
    tube(top, cvW3(F, ...bagLocal(B, sx * 0.25, 1.65, -2.3)), 0.07, [0.16, 0.17, 0.2, 1], 0.5);
    const hg = BAG_HINGE, p = B.pitch, along = 0.8;
    const ram = cvW3(F, ...bagLocal(B, sx * 0.17, hg[1] - 0.14 - along * Math.sin(p), hg[2] + along * Math.cos(p)));
    tube(cvW3(F, ...bagLocal(B, sx * 0.5, 0.66, 0.35)), ram, 0.13, [0.55, 0.58, 0.62, 1]);
    // red beacons blinking on the mast tops
    if (Math.sin(tm * 5 + sx) > 0.2 && !melt) FX.glow(top[0], top[1] + 0.75, top[2], 0.9, [1, 0.15, 0.1], 0.05, 0.9);
  }
  // rock spikes bursting up along a quake lane
  for (const k of B.spikes) {
    const up = k.t < 0.12 ? k.t / 0.12 : k.t > 1.0 ? Math.max(0, 1 - (k.t - 1.0) / 0.6) : 1, w = cvW(F, k.lx, k.lz);
    if (R.enemyDraw.stalag) pushEnemy('stalag', false, w[0], -(1 - up) * 2.2 * k.s, w[1], k.yaw, MODELS.defs.stalag.clips.still.row, k.s, 1, 0, 0, 0, f.rockCol[0], f.rockCol[1], f.rockCol[2]);
  }
  // the goo heart in its porthole, throbbing (blazing while the beam charges)
  if (B.dying < 4.2) {
    const hp = cvW3(F, ...bagHeart(B)), pulse = 0.5 + 0.5 * Math.sin(tm * (B.stage2 ? 9 : 5));
    pushImp(hp[0], hp[1], hp[2], 0.42 + B.glow * 0.12, 0, 0, 1, 1, 0, 4, 0.5 + pulse * 0.4 + B.glow * 1.5, tm * 2, 0, 0, 0, 1);
    FX.glow(hp[0], hp[1], hp[2], 1.2 + B.glow * 2.5 + pulse * 0.3, B.stage2 ? [1, 0.25, 0.1] : [1, 0.55, 0.15], 0.05, 0.7);
    // the eyes glow
    for (const sx of [-1, 1]) { const e = cvW3(F, ...bagLocal(B, sx * 0.19, 1.27, 0.62)); FX.glow(e[0], e[1], e[2], 0.7 * B.eyes, [1, 0.85, 0.3], 0.05, 0.5); }
  }
  // exhaust smoke and dripping goo
  if (Math.random() < 0.25) for (const sx of [-1, 1]) { const p = cvW3(F, ...bagLocal(B, sx * 0.24, 2.0, -0.52)); FX.smoke(p[0], p[1], p[2], 0.6, B.stage2 ? [0.25, 0.22, 0.2] : [0.45, 0.43, 0.42], 1.6, 1.4); }
  if (Math.random() < 0.3) { const p = cvW3(F, ...bagLocal(B, rand(-0.5, 0.5), 0.9, rand(-0.4, 0.5))); FX.part(p[0], p[1], p[2], 0, -0.5, 0, 0.14, 0.08, 0.8, B.stage2 ? [1, 0.3, 0.1] : [1, 0.55, 0.15], 1, 0, -9, 0); }
  // stuff falling off the wheel as it turns
  if (Math.random() < 0.3 + B.wheelV * 0.1) { const a = rand(-0.5, 1.2), w = cvW3(F, ...bagLocal(B, rand(-0.12, 0.12), 0, 0)); FX.part(tip[0] + (w[0] - base[0]) * 0, tip[1] + Math.sin(a) * BAG_WHEEL_R * S, tip[2], rand(-0.5, 0.5), -1, rand(-0.5, 0.5), 0.12, 0.1, 1, [0.5, 0.44, 0.38], 0.9, 2, -9, 0); }
  // the beam: a white-hot core in an orange sheath, sparks where it lands
  if (B.beam) {
    const o = cvW3(F, ...B.beam.o), e = cvW3(F, ...B.beam.end), flick = 0.85 + 0.15 * Math.sin(tm * 70);
    const pts = [o[0], o[1], o[2], e[0], e[1], e[2]];
    R.ribStrip(pts, 2, 0.75 * flick, [1, 0.35, 0.08, 0.55], 0, 0, 1);
    R.ribStrip(pts, 2, 0.32 * flick, [1, 0.8, 0.4, 0.9], 0, 0, 1);
    R.ribStrip(pts, 2, 0.12, [1, 1, 0.9, 1], 0, 0, 1);
    FX.glow(e[0], e[1], e[2], 1.6, [1, 0.5, 0.15], 0.05, 0.9);
  }
  // flying rocks
  for (const k2 of B.rocks) {
    if (k2.goo) { pushImp(k2.x, k2.y, k2.z, 0.45, 0, 0, 1, 1, 0, 4, 0.8, tm * 3 + k2.lx, 0, 0, 0, 1); FX.glow(k2.x, k2.y, k2.z, 0.8, [1, 0.55, 0.15], 0.04, 0.5); continue; }
    if (R.enemyDraw[k2.m]) pushEnemy(k2.m, false, k2.x, k2.y - 0.5 * k2.s, k2.z, k2.spin, MODELS.defs[k2.m].clips.still.row, k2.s * 1.6, 1, 0, 0, 0, f.rockCol[0], f.rockCol[1], f.rockCol[2]);
  }
}
function bagOverlay(ctx, w, h) {
  // entering: the four arrow keys for a moment and a half, left and right lit up
  if (CV.phase === 'bossintro' && CV.t > 0.2 && CV.t < 1.7) {
    const a = Math.min(1, (CV.t - 0.2) / 0.15, (1.7 - CV.t) / 0.2), cx = w / 2, cy = h * 0.66, k = 62, g = 8, lit = Math.sin(performance.now() / 120) > 0;
    ctx.save(); ctx.globalAlpha = a;
    const key = (x, y, dir, on) => {
      ctx.fillStyle = on ? (lit ? '#ffd23a' : '#ffb020') : 'rgba(255,255,255,0.18)';
      roundRect(ctx, x - k / 2, y - k / 2, k, k, 12); ctx.fill();
      ctx.strokeStyle = on ? '#ffffff' : 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; roundRect(ctx, x - k / 2, y - k / 2, k, k, 12); ctx.stroke();
      ctx.save(); ctx.translate(x, y); ctx.rotate(dir); ctx.fillStyle = on ? '#3a2408' : 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(8, -14); ctx.lineTo(8, 14); ctx.closePath(); ctx.fill(); ctx.restore();
    };
    key(cx, cy - k - g, Math.PI / 2, false); key(cx - k - g, cy, 0, true); key(cx, cy, -Math.PI / 2, false); key(cx + k + g, cy, Math.PI, true);
    ctx.restore();
  }
}

// the Bagger's portrait (boss card and menus): the machine at the origin, a little turned, boom slightly raised
BOSS_DRAW.bagger = function (e) {
  if (!e.portrait) return;
  const s = 1.45, t = e.tint, c = Math.cos(e.yaw), sn = Math.sin(e.yaw);
  const at = (mx, my, mz) => [(c * mx + sn * mz) * s, my * s, (-sn * mx + c * mz) * s];
  const put = (m, p, row) => { if (R.enemyDraw[m]) pushEnemy(m, false, p[0], p[1], p[2], e.yaw, row, s, 1, 0, 0, 0, t[0], t[1], t[2]); };
  const still = m => MODELS.defs[m].clips.still.row, o = [0, 0, 0];
  put('bg_base', o, still('bg_base')); put('bg_body', o, still('bg_body')); put('bg_cwt', o, still('bg_cwt'));
  for (const sx of [-1, 1]) put('bg_mast', at(sx * 0.45, 0, 0), still('bg_mast'));
  const p = -0.15, pf = Math.round((p - BAG_PITCH[0]) / (BAG_PITCH[1] - BAG_PITCH[0]) * (BAG_PITCH_FRAMES - 1));
  put('bg_boom', o, MODELS.defs.bg_boom.clips.bpitch.row + pf);
  const h = BAG_HINGE, tip = at(h[0], h[1] - BAG_BOOM_LEN * Math.sin(p), h[2] + BAG_BOOM_LEN * Math.cos(p));
  put('bg_wheel', [tip[0], tip[1] - BAG_WHEEL_Y * s, tip[2]], MODELS.defs.bg_wheel.clips.wspin.row + 3);
  const hp = at(...BAG.heart);
  pushImp(hp[0], hp[1], hp[2], 0.32, 0, 0, 1, 1, 0, 4, 1.0, 0, 0, 0, 0, 1);
};
