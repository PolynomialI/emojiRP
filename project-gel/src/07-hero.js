// ============================================================
// Hero rig: spring-driven blended shapes with procedural animation
// ============================================================
// Local frame: x = side, y = up, z = forward. World = pos + rotY(yaw) * (local * scale)
// Long legs: the body rides high on thigh and shin segments of LEG_SEG each, and one full
// gait cycle (two steps) covers STRIDE world units, so the hero takes long strides.
const PELVIS_Y = 0.88, HIP_Y = 0.78, LEG_SEG = 0.36, STRIDE = 1.8;
// the robe's swing at rest (Hero Cloak; see updateRobe and buildPrims)
const ROBE0 = { x: 0, z: 0, tw: 0, sp: 0 };
const NECK0 = { x: 0, z: 0, b: 0 };
// where each gear slot's colors start in the hero's palette (color weight = 10 + entry): weapon 4, armor 3,
// ring 2 (band, gem), necklace 3 (chain, pendant, detail)
const GEAR_PAL = { weapon: 8, armor: 12, ring: 15, necklace: 17 };
const HERO_JOINTS = {
  pelvis: { rest: [0, PELVIS_Y, 0], k: 420, z: 0.62, inertia: 0.15 },
  chest: { rest: [0, 1.21, 0], k: 260, z: 0.42, inertia: 0.42 },
  head: { rest: [0, 1.58, 0.03], k: 170, z: 0.34, inertia: 0.7 },
  hipA: { rest: [0.13, HIP_Y, 0], k: 520, z: 0.7, inertia: 0.08 },
  hipB: { rest: [-0.13, HIP_Y, 0], k: 520, z: 0.7, inertia: 0.08 },
  kneeA: { rest: [0.15, 0.43, 0.08], k: 460, z: 0.62, inertia: 0.12 },
  kneeB: { rest: [-0.15, 0.43, 0.08], k: 460, z: 0.62, inertia: 0.12 },
  footA: { rest: [0.17, 0.075, 0.06], k: 950, z: 0.85, inertia: 0 },
  footB: { rest: [-0.17, 0.075, 0.06], k: 950, z: 0.85, inertia: 0 },
};
const ARM_SLOTS = [
  { side: 1, sh: [0.29, 1.34, 0], el: [0.42, 1.14, 0.05], fi: [0.5, 0.98, 0.15] },
  { side: -1, sh: [-0.29, 1.34, 0], el: [-0.42, 1.14, 0.05], fi: [-0.5, 0.98, 0.15] },
  { side: 1, sh: [0.22, 1.41, -0.15], el: [0.42, 1.4, -0.28], fi: [0.56, 1.28, -0.12] },
  { side: -1, sh: [-0.22, 1.41, -0.15], el: [-0.42, 1.4, -0.28], fi: [-0.56, 1.28, -0.12] },
];

// Lounge (the ocean): the blob lies back on deck, one leg out and one knee up, a hand behind its head and the
// other (the weapon hand) resting at its side. The pose is written as it looks lying down (deck at y = 0, the
// body facing +z, head toward -z), then turned back into the upright frame, since the whole rig is pitched
// back by LOUNGE_TILT about the pelvis when drawn: costume, hat and gear shapes ride along with it.
const LOUNGE_TILT = 1.2, LOUNGE_PIV = 0.3;
const LOUNGE = (() => {
  const c = Math.cos(LOUNGE_TILT), s = Math.sin(LOUNGE_TILT);
  const up = (x, y, z) => { const yy = y - LOUNGE_PIV; return [x, c * yy - s * z + PELVIS_Y, s * yy + c * z]; };
  return {
    hipA: up(0.13, 0.27, 0.09), kneeA: up(0.16, 0.17, 0.44), footA: up(0.18, 0.09, 0.8),
    hipB: up(-0.13, 0.27, 0.09), kneeB: up(-0.16, 0.48, 0.36), footB: up(-0.18, 0.09, 0.52),
    // arm 0 rests at the side, arm 1 is folded behind the head
    arm: [{ el: up(0.42, 0.3, -0.2), fi: up(0.44, 0.15, 0.1) }, { el: up(-0.43, 0.64, -0.6), fi: up(-0.1, 0.38, -0.8) }],
  };
})();

class Spring3 {
  constructor(rest, k, z, inertia) {
    this.p = rest.slice(); this.v = [0, 0, 0]; this.t = rest.slice();
    this.k = k; this.k0 = k; this.c = 2 * z * Math.sqrt(k); this.z = z; this.inertia = inertia;
  }
  setK(k) { this.k = k; this.c = 2 * this.z * Math.sqrt(k); }
  step(dt, ax, ay, az) {
    for (let i = 0; i < 3; i++) {
      const a = this.k * (this.t[i] - this.p[i]) - this.c * this.v[i] - (i === 0 ? ax : i === 1 ? ay : az) * this.inertia;
      this.v[i] += a * dt;
      this.p[i] += this.v[i] * dt;
    }
  }
}

class Hero {
  constructor() {
    this.pos = [0, 0, 0];
    this.vel = [0, 0, 0];
    this.prevVel = [0, 0, 0];
    this.yaw = 0;
    this.yawVel = 0;
    this.phase = 0;
    this.time = 0;
    this.topSpeed = 4.5;
    this.scale = 1;
    this.sq = 1; this.sqV = 0;
    this.melt = 0; this.meltTarget = 0;
    this.flash = 0;
    this.spark = 0;
    this.chestGlow = 0;
    this.glow = 0; this.bubbles = 0; this.gloss = 1; this.wobbleMul = 1; this.stretchMul = 1;
    this.auraLevel = 0; this.aura = 0;
    this.joints = {};
    for (const n in HERO_JOINTS) { const j = HERO_JOINTS[n]; this.joints[n] = new Spring3(j.rest, j.k, j.z, j.inertia); }
    this.arms = ARM_SLOTS.map((s, i) => ({
      i, side: s.side, slot: s,
      sh: new Spring3(s.sh, 300, 0.5, 0.42), el: new Spring3(s.el, 220, 0.45, 0.55), fi: new Spring3(s.fi, 180, 0.38, 0.75),
      grow: i < 2 ? 1 : 0, growTarget: i < 2 ? 1 : 0, action: null, swell: 0, rArm: 0.105,
    }));
    this.buds = [];
    this.ghosts = [];
    this.out = {
      pa: new Float32Array(HERO_MAXP * 4), pb: new Float32Array(HERO_MAXP * 4), pc: new Float32Array(HERO_MAXP * 4), count: 0,
      rotInv: new Float32Array(9), gearMat: new Float32Array(12), boundC: [0, 0, 0], boundR: 1, boxLo: new Float32Array(3), boxHi: new Float32Array(3), aoY: 0, flash: 0, glow: 0, wobble: 0.008, bubbles: 0, spark: 0, gloss: 1,
      chest: new Float32Array(4), pal: new Float32Array(60), grad: new Float32Array(4), groundY: 0,
    };
    this.costume = null; this.hat = null; this.hatLift = 0; this.gear = null;
    this.lounge = 0; this.lng = 0; // lounge target and its eased blend (0 stands, 1 lies back on deck)
    this.shadow = { data: new Float32Array(14 * 4), count: 0, pos: [0, 0, 0] };
    this._w = [0, 0, 0];
  }

  reset(x, z) {
    V3.set(this.pos, x, 0, z); V3.set(this.vel, 0, 0, 0); V3.set(this.prevVel, 0, 0, 0);
    this.yaw = 0; this.sq = 1; this.sqV = 0; this.melt = 0; this.meltTarget = 0; this.flash = 0;
    this.buds.length = 0; this.ghosts.length = 0;
    for (const n in this.joints) { const j = this.joints[n]; V3.copy(j.p, HERO_JOINTS[n].rest); V3.set(j.v, 0, 0, 0); }
    this.arms.forEach((a, i) => {
      V3.copy(a.sh.p, a.slot.sh); V3.copy(a.el.p, a.slot.el); V3.copy(a.fi.p, a.slot.fi);
      a.sh.v.fill(0); a.el.v.fill(0); a.fi.v.fill(0);
      a.action = null; a.swell = 0; a.grow = a.growTarget = i < 2 ? 1 : 0;
    });
  }

  setArmCount(n) { this.arms.forEach((a, i) => { a.growTarget = i < n ? 1 : 0; }); }

  // world <-> local
  // lounging pitches the rig back about the pelvis and lowers it onto the deck
  toWorld(l, out) {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), sc = this.scale;
    let ly = l[1], lz = l[2];
    if (this.lng > 0) {
      const a = this.lng * LOUNGE_TILT, cp = Math.cos(a), sp = Math.sin(a), yy = ly - PELVIS_Y;
      ly = cp * yy + sp * lz + PELVIS_Y - this.lng * (PELVIS_Y - LOUNGE_PIV); lz = -sp * yy + cp * lz;
    }
    out[0] = this.pos[0] + (c * l[0] + s * lz) * sc;
    out[1] = this.pos[1] + ly * sc;
    out[2] = this.pos[2] + (-s * l[0] + c * lz) * sc;
    return out;
  }
  toLocal(w, out) {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), sc = this.scale;
    const dx = (w[0] - this.pos[0]) / sc, dy = (w[1] - this.pos[1]) / sc, dz = (w[2] - this.pos[2]) / sc;
    out[0] = c * dx - s * dz; out[1] = dy; out[2] = s * dx + c * dz;
    if (this.lng > 0) {
      const a = this.lng * LOUNGE_TILT, cp = Math.cos(a), sp = Math.sin(a), yy = out[1] - PELVIS_Y + this.lng * (PELVIS_Y - LOUNGE_PIV), zz = out[2];
      out[1] = cp * yy - sp * zz + PELVIS_Y; out[2] = sp * yy + cp * zz;
    }
    return out;
  }
  forward() { return [Math.sin(this.yaw), 0, Math.cos(this.yaw)]; }

  impulse(sq) { this.sqV += sq; }
  hit(fromWorld) {
    this.flash = 1;
    this.sqV -= 2.2;
    const l = this.toLocal(fromWorld, [0, 0, 0]);
    const d = Math.hypot(l[0], l[2]) || 1;
    const kx = -l[0] / d * 2.4, kz = -l[2] / d * 2.4;
    for (const n of ['chest', 'head']) { this.joints[n].v[0] += kx * 1.4; this.joints[n].v[2] += kz * 1.4; }
    for (const a of this.arms) { a.fi.v[0] += kx; a.fi.v[2] += kz; }
  }

  // Pick a free arm, preferring the side the target is on
  freeArm(targetW, needGrown = true) {
    const l = this.toLocal(targetW, [0, 0, 0]);
    let best = -1, bestScore = -1e9;
    for (const a of this.arms) {
      if (a.action || (needGrown && a.grow < 0.9)) continue;
      const score = Math.sign(l[0] || 1) === a.side ? 2 : 0;
      const sc = score - a.i * 0.1;
      if (sc > bestScore) { bestScore = sc; best = a.i; }
    }
    return best;
  }

  // Stretching hook punch toward a world target. onImpact(worldPos) fires at full extension.
  punch(armIdx, targetW, reach, onImpact) {
    const a = this.arms[armIdx];
    a.action = { type: 'punch', t: 0, out: 0.13, hold: 0.06, back: 0.24, target: targetW.slice(), reach, onImpact, fired: false, from: null, ctrl: null };
    a.fi.setK(2600); a.el.setK(900);
  }
  // Short palm thrust that grows a bud and releases it
  thrust(armIdx, targetW, budR, colw, onRelease) {
    const a = this.arms[armIdx];
    a.action = { type: 'thrust', t: 0, out: 0.1, hold: 0.04, back: 0.18, target: targetW.slice(), reach: 0.75, onImpact: null, fired: false, from: null, ctrl: null };
    a.fi.setK(1800);
    this.addBud({ arm: armIdx, off: [0, 0.02, 0.12], r: budR, grow: 0.09, colw, glow: 0.25, onRelease });
  }
  // Overhead throw: windup behind, release forward
  throwAt(armIdx, targetW, budR, colw, onRelease) {
    const a = this.arms[armIdx];
    a.action = { type: 'throw', t: 0, dur: 0.34, target: targetW.slice(), onRelease, budR, colw, released: false };
    a.fi.setK(1400); a.el.setK(700);
    this.addBud({ arm: armIdx, off: [0, 0.05, 0.05], r: budR, grow: 0.2, colw, glow: 0.2, onRelease: null, holdUntilRelease: true });
  }

  // Bud: a sphere that grows out of the surface and pinches off.
  // opts: { arm | joint, off: local offset, r, grow, colw, glow, onRelease(worldPos, r), holdUntilRelease }
  addBud(opts) {
    const b = { ...opts, t: 0, cur: 0, done: false };
    this.buds.push(b);
    return b;
  }
  budAnchor(b, out) {
    let base;
    if (b.arm !== undefined) base = this.arms[b.arm].fi.p;
    else base = this.joints[b.joint].p;
    out[0] = base[0] + b.off[0]; out[1] = base[1] + b.off[1]; out[2] = base[2] + b.off[2];
    return out;
  }
  releaseBud(b) {
    if (b.done) return;
    b.done = true;
    const lp = this.budAnchor(b, [0, 0, 0]);
    const w = this.toWorld(lp, [0, 0, 0]);
    this.ghosts.push({ lp, r: b.cur, t: 0, colw: b.colw });
    if (b.onRelease) b.onRelease(w, b.cur * this.scale);
  }

  update(dt, moveVel, alive) {
    if (this.gear && this.gear.myth) this.rainbowGear();
    this.time += dt;
    // movement and facing
    V3.copy(this.prevVel, this.vel);
    V3.copy(this.vel, moveVel);
    const speed = Math.hypot(this.vel[0], this.vel[2]);
    const prevSpeed = Math.hypot(this.prevVel[0], this.prevVel[2]);
    const yaw0 = this.yaw;
    // the cave holds the hero facing one way (faceYaw) while it slides from side to side
    if (this.faceYaw != null) { const d = angleDiff(this.yaw, this.faceYaw); this.yaw += clamp(d, -9 * dt, 9 * dt); }
    else if (speed > 0.2) {
      const want = Math.atan2(this.vel[0], this.vel[2]);
      const d = angleDiff(this.yaw, want);
      const maxTurn = 15.7 * dt;
      this.yaw += clamp(d, -maxTurn, maxTurn);
    }
    const dyaw = angleDiff(yaw0, this.yaw);
    // squash impulses on starting and stopping
    if (prevSpeed > 2.5 && speed < 0.5) this.sqV -= 1.3;
    if (prevSpeed < 0.5 && speed > 2.5) this.sqV += 0.9;

    // world acceleration -> local
    const ax = (this.vel[0] - this.prevVel[0]) / Math.max(dt, 1e-3), az = (this.vel[2] - this.prevVel[2]) / Math.max(dt, 1e-3);
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    const lax = clamp(c * ax - s * az, -60, 60), laz = clamp(s * ax + c * az, -60, 60);

    // targets
    this.lng += (this.lounge - this.lng) * Math.min(1, dt * 4);
    if (Math.abs(this.lounge - this.lng) < 1e-3) this.lng = this.lounge;
    const lg = this.lng;
    // a lounging blob rides along: no gait
    const sN = clamp(speed / this.topSpeed, 0, 1) * (1 - lg);
    this.phase += dt * (speed / (STRIDE * this.scale)) * TAU;
    const ph = this.phase, t = this.time;
    // the body rises as a leg passes under it and dips when the legs are spread
    // crouch (0..1) sinks the whole body behind cover; the legs fold to suit
    const bob = sN * (0.05 * Math.cos(2 * ph) - 0.03) + (1 - sN) * 0.008 * Math.sin(t * 1.8) - (this.crouch || 0) * 0.4;
    const lean = sN * 0.17 * this.stretchMul;
    const breathe = Math.sin(t * TAU / 3.4);
    const J = this.joints;
    const leanPt = (out, base, h) => { out[0] = base[0]; out[1] = base[1] - (base[1] - PELVIS_Y) * (1 - Math.cos(lean)); out[2] = base[2] + (base[1] - PELVIS_Y) * Math.sin(lean); return out; };
    V3.set(J.pelvis.t, 0.008 * Math.sin(t * 1.3) * (1 - sN), PELVIS_Y + bob, 0);
    leanPt(J.chest.t, [0, 1.21 + bob * 1.1 + 0.006 * breathe, 0.0], 0);
    leanPt(J.head.t, [0.012 * Math.sin(t * 0.9) * (1 - sN), 1.58 + bob * 1.25, 0.03], 0);
    for (let i = 0; i < 2; i++) {
      const sg = i === 0 ? 1 : -1, phi = ph + i * Math.PI;
      const hip = i === 0 ? J.hipA : J.hipB, knee = i === 0 ? J.kneeA : J.kneeB, foot = i === 0 ? J.footA : J.footB;
      // the hips swing a little with the stride; the foot sweeps back on the ground and lifts high on the way forward
      V3.set(hip.t, sg * 0.13, HIP_Y + bob, sN * 0.05 * Math.sin(phi));
      const lift = Math.max(0, Math.cos(phi));
      const fz = 0.06 + sN * STRIDE * 0.25 * Math.sin(phi), fy = 0.075 + sN * 0.26 * lift * lift;
      V3.set(foot.t, sg * 0.17, fy, fz);
      // two-segment leg: the knee bends forward where thigh and shin meet
      const dz = fz - hip.t[2], dy = fy - hip.t[1], d = Math.hypot(dz, dy) || 1e-3;
      const kb = Math.sqrt(Math.max(0, LEG_SEG * LEG_SEG - d * d / 4));
      V3.set(knee.t, sg * 0.15, hip.t[1] + dy * 0.5 + dz / d * kb, hip.t[2] + dz * 0.5 - dy / d * kb);
      if (lg > 0) { const k = i ? 'B' : 'A'; V3.lerp(hip.t, hip.t, LOUNGE['hip' + k], lg); V3.lerp(knee.t, knee.t, LOUNGE['knee' + k], lg); V3.lerp(foot.t, foot.t, LOUNGE['foot' + k], lg); }
    }
    if (this.gear && this.gear.armor === 'cloak') this.updateRobe(dt, c, s, lax, laz, sN);
    if (this.gear && this.gear.necklace) this.updateNeck(dt, c, s, lax, laz, sN);
    // arms
    for (const a of this.arms) {
      a.grow += (a.growTarget - a.grow) * Math.min(1, dt * 5);
      const slot = a.slot, sg = a.side;
      const phi = ph + (sg > 0 ? 0 : Math.PI);
      leanPt(a.sh.t, [slot.sh[0], slot.sh[1] + bob * 1.1, slot.sh[2]], 0);
      if (!a.action) {
        const swing = a.i < 2 ? sN * 0.32 * Math.sin(phi) : 0.05 * Math.sin(t * 2.2 + a.i);
        V3.set(a.fi.t, slot.fi[0] + 0.015 * Math.sin(t * 1.7 + a.i), slot.fi[1] + 0.02 * Math.sin(t * 2.1 + a.i) + bob, slot.fi[2] - swing);
        V3.set(a.el.t, (a.sh.t[0] + a.fi.t[0]) * 0.5 + sg * 0.06, (a.sh.t[1] + a.fi.t[1]) * 0.5 - 0.05, (a.sh.t[2] + a.fi.t[2]) * 0.5 - 0.02);
        if (lg > 0 && a.i < 2) { const P = LOUNGE.arm[a.i]; V3.lerp(a.el.t, a.el.t, P.el, lg); V3.lerp(a.fi.t, a.fi.t, P.fi, lg); }
        a.fi.setK(a.fi.k0 + (a.fi.k - a.fi.k0) * Math.max(0, 1 - dt * 6)); a.el.setK(a.el.k0);
      } else this.runArmAction(a, dt);
      a.swell = Math.max(0, a.swell - dt * 3.5);
    }
    // melt (death puddle)
    this.melt += (this.meltTarget - this.melt) * Math.min(1, dt * (this.meltTarget > this.melt ? 3 : 7));

    // integrate springs with substeps
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    const rot = -dyaw;
    const spr = (sp) => {
      if (Math.abs(rot) > 1e-5 && sp.inertia > 0) {
        const a2 = rot * sp.inertia * 0.6, cc = Math.cos(a2), ss = Math.sin(a2);
        const x = sp.p[0], z = sp.p[2];
        sp.p[0] = cc * x + ss * z; sp.p[2] = -ss * x + cc * z;
      }
      for (let k = 0; k < steps; k++) sp.step(h, lax * 0.35, 0, laz * 0.35);
    };
    for (const n in J) spr(J[n]);
    for (const a of this.arms) { spr(a.sh); spr(a.el); spr(a.fi); }
    // global squash spring
    const sk = 170, sc2 = 2 * 0.32 * Math.sqrt(sk);
    for (let k = 0; k < steps; k++) { this.sqV += (sk * (1 - this.sq) - sc2 * this.sqV) * h; this.sq += this.sqV * h; }
    this.sq = clamp(this.sq, 0.55, 1.45);

    // buds
    for (const b of this.buds) {
      b.t += dt;
      const g = clamp(b.t / b.grow, 0, 1);
      b.cur = b.r * (g < 1 ? easeOutBack(g) : 1);
      if (!b.holdUntilRelease && g >= 1 && !b.done) this.releaseBud(b);
    }
    this.buds = this.buds.filter(b => !b.done);
    for (const gh of this.ghosts) gh.t += dt;
    this.ghosts = this.ghosts.filter(g => g.t < 0.09);

    this.flash = Math.max(0, this.flash - dt * 4);
    this.spark = Math.max(0, this.spark - dt * 5);
    this.chestGlow = Math.max(0, this.chestGlow - dt * 1.5);
    this.aura += ((this.auraLevel > 0 ? 1 : 0) - this.aura) * Math.min(1, dt * 4);
    this.buildPrims();
  }

  runArmAction(a, dt) {
    const act = a.action;
    act.t += dt;
    const sg = a.side;
    if (act.type === 'punch' || act.type === 'thrust') {
      if (!act.from) {
        act.from = a.fi.p.slice();
      }
      const tl = this.toLocal(act.target, [0, 0, 0]);
      // clamp reach from the shoulder
      const sh = a.sh.t;
      let dx = tl[0] - sh[0], dy = tl[1] - sh[1], dz = tl[2] - sh[2];
      const dist = Math.hypot(dx, dy, dz) || 1;
      const maxR = act.reach / this.scale;
      if (dist > maxR) { dx *= maxR / dist; dy *= maxR / dist; dz *= maxR / dist; }
      const imp = [sh[0] + dx, Math.max(0.25, sh[1] + dy), sh[2] + dz];
      const G = act.from;
      const mid = [(G[0] + imp[0]) / 2, (G[1] + imp[1]) / 2, (G[2] + imp[2]) / 2];
      const len = Math.hypot(imp[0] - G[0], imp[2] - G[2]);
      const ctrl = [mid[0] + sg * 0.32 * len * (act.type === 'punch' ? 1 : 0.2), mid[1] + 0.15 * len, mid[2] - 0.1 * len];
      let p;
      if (act.t < act.out) {
        const u = easeOutCubic(act.t / act.out);
        p = bez(G, ctrl, imp, u);
      } else if (act.t < act.out + act.hold) {
        p = imp;
        if (!act.fired) {
          act.fired = true;
          a.swell = 1;
          if (act.onImpact) act.onImpact(this.toWorld(imp, [0, 0, 0]));
          if (act.type === 'thrust') for (const b of this.buds) if (b.arm === a.i && !b.done) this.releaseBud(b);
        }
      } else if (act.t < act.out + act.hold + act.back) {
        const u = easeInOutQuad((act.t - act.out - act.hold) / act.back);
        const rest = a.slot.fi;
        const ctrl2 = [mid[0] + sg * 0.15 * len, mid[1] - 0.05 * len, mid[2]];
        p = bez(imp, ctrl2, rest, u);
      } else {
        a.action = null;
        return;
      }
      V3.copy(a.fi.t, p);
      const ext = clamp(Math.hypot(p[0] - sh[0], p[1] - sh[1], p[2] - sh[2]) / 0.5, 1, 6);
      V3.set(a.el.t, (sh[0] + p[0]) * 0.5 + sg * 0.05 / ext, (sh[1] + p[1]) * 0.5 - 0.12 / ext, (sh[2] + p[2]) * 0.5);
    } else if (act.type === 'throw') {
      const u = act.t / act.dur;
      const sh = a.sh.t;
      const back = [sh[0] + sg * 0.05, sh[1] + 0.45, sh[2] - 0.35];
      const fwd = [sh[0] - sg * 0.05, sh[1] + 0.25, sh[2] + 0.55];
      let p;
      if (u < 0.55) p = V3.lerp([0, 0, 0], a.slot.fi, back, easeOutCubic(u / 0.55));
      else if (u < 0.75) p = V3.lerp([0, 0, 0], back, fwd, easeOutCubic((u - 0.55) / 0.2));
      else p = V3.lerp([0, 0, 0], fwd, a.slot.fi, easeInOutQuad((u - 0.75) / 0.25));
      if (u >= 0.7 && !act.released) {
        act.released = true;
        for (const b of this.buds) if (b.arm === a.i && !b.done) { b.onRelease = act.onRelease; this.releaseBud(b); }
      }
      if (u >= 1) { a.action = null; return; }
      V3.copy(a.fi.t, p);
      V3.set(a.el.t, (sh[0] + p[0]) * 0.5 + sg * 0.1, (sh[1] + p[1]) * 0.5 - 0.05, (sh[2] + p[2]) * 0.5 - 0.05);
    }
  }

  // The robe's hem hangs on damped springs (in the blob's own frame): it trails behind as you run, kicks forward
  // when you stop and sways back and forth to rest, twists behind you when you turn (or are spun in the menu)
  // a necklace's pendant hangs on a spring: it lags behind as the blob sets off, swings on as it stops or turns,
  // and bounces a little with each step
  updateNeck(dt, c, s, lax, laz, sN) {
    if (!(dt > 0)) return;
    const nk = this.neck || (this.neck = { x: 0, z: 0, vx: 0, vz: 0, b: 0, yaw: this.yaw });
    const lvx = c * this.vel[0] - s * this.vel[2], lvz = s * this.vel[0] + c * this.vel[2];
    const turn = angleDiff(nk.yaw, this.yaw) / dt; nk.yaw = this.yaw;
    const tx = clamp(-lvx * 0.012 - lax * 0.0035 + turn * 0.012, -0.12, 0.12), tz = clamp(-lvz * 0.012 - laz * 0.0035, -0.1, 0.12);
    nk.vx += ((tx - nk.x) * 55 - nk.vx * 3.2) * dt; nk.vz += ((tz - nk.z) * 55 - nk.vz * 3.2) * dt;
    nk.x = clamp(nk.x + nk.vx * dt, -0.14, 0.14); nk.z = clamp(nk.z + nk.vz * dt, -0.12, 0.14);
    nk.b = Math.abs(Math.sin(this.time * 9)) * 0.012 * sN;
  }
  updateRobe(dt, c, s, lax, laz, sN) {
    if (!(dt > 0)) return;
    const rb = this.robe || (this.robe = { x: 0, z: 0, vx: 0, vz: 0, tw: 0, vtw: 0, sp: 0, yaw: this.yaw });
    const lvx = c * this.vel[0] - s * this.vel[2], lvz = s * this.vel[0] + c * this.vel[2];
    const tx = clamp(-lvx * 0.03 - lax * 0.002, -0.22, 0.22), tz = clamp(-lvz * 0.03 - laz * 0.002, -0.26, 0.26);
    const turn = angleDiff(rb.yaw, this.yaw) / dt; rb.yaw = this.yaw;
    const ttw = clamp(-turn * 0.05, -0.6, 0.6);
    rb.vx += ((tx - rb.x) * 70 - rb.vx * 5.5) * dt; rb.vz += ((tz - rb.z) * 70 - rb.vz * 5.5) * dt; rb.vtw += ((ttw - rb.tw) * 55 - rb.vtw * 5) * dt;
    rb.x = clamp(rb.x + rb.vx * dt, -0.3, 0.3); rb.z = clamp(rb.z + rb.vz * dt, -0.32, 0.32); rb.tw = clamp(rb.tw + rb.vtw * dt, -0.8, 0.8);
    rb.sp = sN;
  }

  // Export blended primitives in world space for the hero shader
  buildPrims() {
    const o = this.out, pa = o.pa, pb = o.pb, pc = o.pc;
    let n = 0;
    const sq = this.sq * (1 - 0.8 * this.melt), isq = 1 / Math.sqrt(Math.max(sq, 0.2)), sc = this.scale;
    const melt = this.melt;
    const w = this._w;
    const L = [0, 0, 0];
    const tw = (lp) => {
      // apply squash around the ground and spread when melting
      L[0] = lp[0] * isq * (1 + melt * 0.6); L[1] = lp[1] * sq; L[2] = lp[2] * isq * (1 + melt * 0.6);
      return this.toWorld(L, w);
    };
    const sph = (lp, r, k, colw, glow) => {
      if (n >= HERO_MAXP) return;
      tw(lp);
      const i = n * 4;
      pa[i] = w[0]; pa[i + 1] = w[1]; pa[i + 2] = w[2]; pa[i + 3] = r * sc;
      pb[i] = 0; pb[i + 1] = 0; pb[i + 2] = 0; pb[i + 3] = k * sc;
      pc[i] = 0; pc[i + 1] = colw; pc[i + 2] = 0; pc[i + 3] = glow;
      n++;
    };
    const cap = (la, lb, r1, r2, k, colw, glow) => {
      if (n >= HERO_MAXP) return;
      const i = n * 4;
      tw(la); pa[i] = w[0]; pa[i + 1] = w[1]; pa[i + 2] = w[2]; pa[i + 3] = r1 * sc;
      tw(lb); pb[i] = w[0]; pb[i + 1] = w[1]; pb[i + 2] = w[2]; pb[i + 3] = k * sc;
      pc[i] = 1; pc[i + 1] = colw; pc[i + 2] = r2 * sc; pc[i + 3] = glow;
      n++;
    };
    const ell = (lp, rx, ry, rz, k, colw, glow) => {
      if (n >= HERO_MAXP) return;
      tw(lp);
      const i = n * 4;
      pa[i] = w[0]; pa[i + 1] = w[1]; pa[i + 2] = w[2]; pa[i + 3] = 0;
      pb[i] = rx * isq * sc; pb[i + 1] = ry * sq * sc; pb[i + 2] = rz * isq * sc; pb[i + 3] = k * sc;
      pc[i] = 2; pc[i + 1] = colw; pc[i + 2] = 0; pc[i + 3] = glow;
      n++;
    };
    const J = this.joints;
    const br = 1 + 0.03 * Math.sin(this.time * TAU / 3.4);
    sph(J.pelvis.p, 0.27, 0, 0, 0);
    ell(J.chest.p, 0.33, 0.29 * br, 0.26, 0.18, 0, 0);
    sph(J.head.p, 0.225, 0.17, 0, 0);
    // the costume, then the hat on top of it; the hat's colors are palette entries 4-7
    for (const wear of [this.costume, this.hat]) {
      if (!wear) continue;
      const hv = J.head.v, t = this.time, cp = [0, 0, 0], cq = [0, 0, 0], palOff = wear === this.hat ? 4 : 0;
      const lift = wear === this.hat ? this.hatLift : 0;
      // something worn on the back (a shark fin) moves round to the front while the blob lies on its back,
      // so it sticks up out of the deck rather than into it
      const flip = wear.back && this.lng > 0.5;
      const at = (anchor, off, out) => { const a = J[anchor].p; out[0] = a[0] + off[0]; out[1] = a[1] + off[1] + (anchor === 'head' ? lift : 0); out[2] = a[2] + (flip && anchor === 'chest' ? -off[2] : off[2]); return out; };
      for (const P of wear.parts) {
        const col = P[P[0] === 'cap' ? 7 : 5], cw = col === 'b' ? 0 : 10 + palOff + col;
        if (P[0] === 'sph') {
          at(P[1], P[2], cp);
          if (P[6]) { cp[0] += Math.sin(t * 2.4) * P[6] - hv[0] * 0.02; cp[2] -= hv[2] * 0.02; }
          sph(cp, P[3], P[4], cw, 0);
        } else if (P[0] === 'cap') {
          at(P[1], P[2], cp); at(P[1], P[3], cq);
          // tips lag behind the head and bob a little
          if (P[8]) { cq[0] += Math.sin(t * 2.6 + P[3][0] * 9) * P[8] - hv[0] * 0.03; cq[1] -= Math.abs(hv[1]) * 0.01; cq[2] += Math.cos(t * 2.1) * P[8] * 0.5 - hv[2] * 0.03; }
          cap(cp, cq, P[4], P[5], P[6], cw, 0);
        } else ell(at(P[1], P[2], cp), P[3][0], P[3][1], P[3][2], P[4], cw, 0);
      }
    }
    const legs = this.costume && this.costume.legs, lc = 10 + ((this.costume && this.costume.legsCol) || 0);
    if (legs === 'tail') {
      // a mermaid's tail: both legs as one, ending in a two-lobed fin
      const kA = J.kneeA.p, kB = J.kneeB.p, fA = J.footA.p, fB = J.footB.p, P = J.pelvis.p;
      const km = [(kA[0] + kB[0]) / 2, (kA[1] + kB[1]) / 2, (kA[2] + kB[2]) / 2], fm = [(fA[0] + fB[0]) / 2, (fA[1] + fB[1]) / 2 + 0.04, (fA[2] + fB[2]) / 2];
      cap([P[0], P[1] - 0.1, P[2]], km, 0.24, 0.17, 0.1, lc, 0);
      cap(km, fm, 0.17, 0.08, 0.06, lc, 0);
      const sw = Math.sin(this.time * 3.2) * 0.04;
      ell([fm[0] + 0.12, fm[1] - 0.02, fm[2] + 0.05 + sw], 0.15, 0.04, 0.1, 0.04, lc + 1, 0);
      ell([fm[0] - 0.12, fm[1] - 0.02, fm[2] + 0.05 - sw], 0.15, 0.04, 0.1, 0.04, lc + 1, 0);
    } else if (legs === 'tentacles') {
      // a squid's tentacles: six long, limp arms that droop from under the body to the floor and lie spread out
      // on it, thick at the root and thin at the tip, rippling sideways and flicking their tips up; they drag
      // behind as the blob moves (three pieces each: down to the floor, along it, the curling tip)
      const t = this.time, P = J.pelvis.p, v = J.pelvis.v;
      for (let i = 0; i < 6; i++) {
        const a = (i + 0.5) / 6 * TAU + 0.12 * Math.sin(t * 0.7 + i * 2.1), ca = Math.sin(a), sa = Math.cos(a), ph = t * 2.3 + i * 1.7;
        // (sideways to the arm, for its ripple)
        const nx = sa, nz = -ca, drag = k => [-v[0] * k, -v[2] * k];
        const root = [P[0] + ca * 0.13, P[1] - 0.14, P[2] + sa * 0.13];
        const d1 = drag(0.03), knee = [P[0] + ca * 0.38 + d1[0], 0.075, P[2] + sa * 0.38 + d1[1]];
        const w1 = Math.sin(ph) * 0.11, d2 = drag(0.06), mid = [knee[0] + ca * 0.32 + nx * w1 + d2[0], 0.066, knee[2] + sa * 0.32 + nz * w1 + d2[1]];
        // (the tip swings the other way from the middle, so the arm lies in an S, and now and then flicks up)
        const w2 = -Math.sin(ph + 0.9) * 0.2, d3 = drag(0.09), lift = Math.max(0, Math.sin(ph * 0.9 + 2)) * 0.18;
        const tip = [mid[0] + ca * 0.26 + nx * w2 + d3[0], 0.045 + lift, mid[2] + sa * 0.26 + nz * w2 + d3[1]];
        cap(root, knee, 0.1, 0.085, 0.08, lc, 0);
        cap(knee, mid, 0.085, 0.068, 0.05, lc, 0);
        cap(mid, tip, 0.068, 0.045, 0.04, lc, 0);
      }
    } else {
      // under a robe only the shins and feet show, so the thighs are left out (and never poke through it)
      const robed = this.gear && this.gear.armor === 'cloak';
      for (let i = 0; i < 2; i++) {
        const hip = i ? J.hipB : J.hipA, knee = i ? J.kneeB : J.kneeA, foot = i ? J.footB : J.footA;
        if (!robed) cap(hip.p, knee.p, 0.13, 0.12, 0.1, 0, 0);
        cap(knee.p, foot.p, 0.12, 0.11, 0.06, 0.05, 0);
        ell(foot.p, 0.12, 0.075, 0.16, 0.07, 0.12, 0);
      }
    }
    for (const a of this.arms) {
      if (a.grow < 0.02) continue;
      const g = a.grow;
      const sh = a.sh.p, fi = a.fi.p;
      const len = Math.hypot(fi[0] - sh[0], fi[1] - sh[1], fi[2] - sh[2]);
      const thin = clamp(Math.sqrt(0.5 / Math.max(len, 0.3)), 0.62, 1);
      const r = 0.105 * thin * g;
      cap(sh, a.el.p, r, r * 0.95, 0.12 * g, 0, 0);
      cap(a.el.p, fi, r * 0.95, r * 0.9, 0.06 * g, 0.18, 0);
      sph(fi, (0.155 + a.swell * 0.06) * g, 0.09 * g, 1.0, 0.06 + a.swell * 0.3);
    }
    if (this.aura > 0.02 || melt > 0.02) {
      const pr = Math.max(this.aura * (0.55 + 0.04 * this.auraLevel), melt * 0.75);
      ell([0, 0.02, 0.0], pr, 0.06, pr, 0.2, 0, 0.05);
    }
    const tmp = [0, 0, 0];
    for (const b of this.buds) { if (b.cur > 0.005) sph(this.budAnchor(b, tmp), b.cur, 0.09, b.colw, b.glow || 0); }
    for (const gh of this.ghosts) { const r = gh.r * (1 - gh.t / 0.09); if (r > 0.005) sph(gh.lp, r, 0.06, gh.colw, 0.1); }
    // equipped gear, drawn last so it is the first thing dropped if the shape budget ever runs out:
    // a weapon in the first hand, armor on the chest, a ring gem on the other fist and a pendant
    const gear = this.gear;
    if (gear) {
      const ch = J.chest.p, gp = [0, 0, 0], gq = [0, 0, 0];
      const off = (p, x, y, z, out) => { out[0] = p[0] + x; out[1] = p[1] + y; out[2] = p[2] + z; return out; };
      // the Hero Cloak is a full robe: a mantle on the shoulders, a wrapped body and waist, and a skirt of eight
      // overlapping panels down to the ankles. Their hems swing on the robe's springs (updateRobe), flutter
      // when you run, and the front ones are pushed out by the striding feet
      const WP = 10 + GEAR_PAL.weapon, AR = 10 + GEAR_PAL.armor, RG = 10 + GEAR_PAL.ring, NK = 10 + GEAR_PAL.necklace;
      const P = J.pelvis.p;
      if (gear.armor === 'cloak') {
        const rb = this.robe || ROBE0, t = this.time, push = Math.max(0, J.footA.p[2], J.footB.p[2]) * 0.7;
        const lift = Math.hypot(rb.x, rb.z) * 0.45;
        // (a small blend keeps the cloth's color crisp where it lies close over the goo)
        ell(off(ch, 0, 0.12, -0.01, gp), 0.43, 0.13, 0.33, 0.012, AR, 0);
        ell(off(ch, 0, -0.05, 0, gp), 0.385, 0.345, 0.315, 0.012, AR, 0);
        ell(off(P, 0, 0.02, 0, gp), 0.335, 0.24, 0.315, 0.02, AR, 0);
        // the hood lying down the back, a gold clasp at the collar, gold trim down the front, a gold sash and buckle
        ell(off(ch, 0, 0.17, -0.25, gp), 0.25, 0.15, 0.12, 0.02, AR + 2, 0);
        cap(off(ch, 0, 0.16, 0.29, gp), off(P, 0, -0.04, 0.33, gq), 0.02, 0.02, 0.006, AR + 1, 0);
        sph(off(ch, 0, 0.2, 0.27, gp), 0.048, 0.008, AR + 1, gear.glow.armor);
        ell(off(P, 0, 0.13, 0, gp), 0.35, 0.05, 0.33, 0.008, AR + 1, 0);
        sph(off(P, 0, 0.13, 0.33, gp), 0.04, 0.006, AR + 2, 0);
        // sleeves over the upper arms of the first two arms, so they move with them
        for (let i = 0; i < 2; i++) {
          const a = this.arms[i];
          if (a.grow < 0.5) continue;
          const sh = a.sh.p, el = a.el.p;
          cap(sh, [lerp(sh[0], el[0], 0.9), lerp(sh[1], el[1], 0.9), lerp(sh[2], el[2], 0.9)], 0.14, 0.15, 0.012, AR, 0);
        }
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU, ca = Math.cos(a + rb.tw), sa = Math.sin(a + rb.tw);
          const fl = Math.sin(t * 9 + i * 1.9) * 0.03 * rb.sp + Math.sin(t * 1.6 + i) * 0.006;
          gq[0] = P[0] + sa * (0.36 + fl) + rb.x;
          gq[1] = 0.2 + lift + Math.abs(fl) * 0.6;
          gq[2] = P[2] + ca * (0.33 + fl) + rb.z + Math.max(0, Math.cos(a)) * push;
          cap(off(P, Math.sin(a) * 0.2, -0.05, Math.cos(a) * 0.19, gp), gq, 0.1, 0.14, 0.035, AR, 0);
        }
      } else if (gear.armor === 'plate') {
        // steel plate: a breastplate with a gold gorget and lower rim and two gold rivets, domed pauldrons on the
        // shoulders, a leather belt with a gold buckle and two steel tassets over the hips
        ell(off(ch, 0, -0.01, 0.02, gp), 0.355, 0.27, 0.295, 0.012, AR, gear.glow.armor * 0.3);
        ell(off(ch, 0, 0.21, 0, gp), 0.23, 0.045, 0.21, 0.008, AR + 2, 0);
        ell(off(ch, 0, -0.21, 0.02, gp), 0.335, 0.035, 0.28, 0.008, AR + 2, 0);
        for (const sx of [1, -1]) sph(off(ch, sx * 0.17, 0.07, 0.27, gp), 0.022, 0.004, AR + 2, 0);
        for (let i = 0; i < 2; i++) { const sh = this.arms[i].sh.p, sx = this.arms[i].side; ell(off(sh, sx * 0.03, 0.06, 0, gp), 0.16, 0.1, 0.16, 0.01, AR, 0); }
        ell(off(P, 0, 0.11, 0, gp), 0.3, 0.05, 0.29, 0.008, AR + 1, 0);
        sph(off(P, 0, 0.11, 0.29, gp), 0.045, 0.006, AR + 2, 0);
        for (const sx of [1, -1]) ell(off(P, sx * 0.15, -0.03, 0.18, gp), 0.12, 0.1, 0.07, 0.01, AR, 0);
      } else if (gear.armor === 'vest') {
        // leather vest: a jerkin over the chest and belly, a dark leather collar and shoulder pads, crossed laces
        // down the front with brass studs, and a belt with a brass buckle
        const vz = (x, y) => 0.01 + 0.3 * Math.sqrt(Math.max(0, 1 - (x / 0.36) ** 2 - ((y + 0.01) / 0.3) ** 2));
        ell(off(ch, 0, -0.01, 0.01, gp), 0.36, 0.3, 0.3, 0.012, AR, gear.glow.armor * 0.3);
        ell(off(P, 0, 0.17, 0, gp), 0.33, 0.13, 0.3, 0.012, AR, 0);
        ell(off(ch, 0, 0.21, 0, gp), 0.235, 0.05, 0.215, 0.008, AR + 1, 0);
        for (let i = 0; i < 2; i++) { const sh = this.arms[i].sh.p, sx = this.arms[i].side; ell(off(sh, sx * 0.02, 0.05, 0, gp), 0.13, 0.075, 0.13, 0.01, AR + 1, 0); }
        for (const sx of [1, -1]) {
          cap(off(ch, sx * -0.055, 0.12, vz(0.055, 0.12) + 0.006, gp), off(ch, sx * 0.055, -0.13, vz(0.055, -0.13) + 0.006, gq), 0.014, 0.014, 0.003, AR + 1, 0);
          sph(off(ch, sx * 0.06, 0.13, vz(0.06, 0.13) + 0.004, gp), 0.02, 0.003, AR + 2, 0);
        }
        ell(off(P, 0, 0.1, 0, gp), 0.31, 0.05, 0.3, 0.008, AR + 1, 0);
        sph(off(P, 0, 0.1, 0.3, gp), 0.042, 0.006, AR + 2, 0);
      }
      // a necklace: a chain round the neck, hanging to a pendant that swings on its own spring
      if (gear.necklace) {
        // (worn over armor, it sits that much further out)
        const nk = this.neck || NECK0, gl = gear.glow.necklace, kind = gear.necklace, dz = gear.armor ? 0.045 : 0;
        const b = off(ch, nk.x, -0.02 - nk.b, 0.29 + dz + Math.max(0, nk.z), [0, 0, 0]);
        const pc = off(b, nk.x * 0.6, -0.065, Math.max(0, nk.z) * 0.6 + 0.005, [0, 0, 0]);
        for (const sx of [1, -1]) {
          const top = off(ch, sx * 0.19, 0.17, 0.168 + dz, gp), mid = off(ch, sx * 0.105 + nk.x * 0.4, 0.075, 0.262 + dz + Math.max(0, nk.z) * 0.4, gq);
          cap(top, mid, 0.013, 0.013, 0.004, NK, 0); cap(mid, b, 0.013, 0.013, 0.004, NK, 0);
        }
        if (kind === 'skull') {
          sph(pc, 0.06, 0.006, NK + 1, gl);
          ell(off(pc, 0, -0.05, 0.008, gp), 0.042, 0.026, 0.038, 0.012, NK + 1, gl);
          for (const sx of [1, -1]) sph(off(pc, sx * 0.023, 0.006, 0.05, gp), 0.017, 0.003, NK + 2, 0);
        } else if (kind === 'moon') {
          // a crescent: four caps along an arc, thick in the middle, thin at the horns, and a blue gem bead above it
          const R0 = 0.055, ang = [1.2, 2.1, 3.14, 4.18, 5.08], rr = [0.01, 0.024, 0.03, 0.024, 0.01];
          for (let i = 0; i < 4; i++) cap(off(pc, 0.015 + Math.cos(ang[i]) * R0, Math.sin(ang[i]) * R0, 0, gp), off(pc, 0.015 + Math.cos(ang[i + 1]) * R0, Math.sin(ang[i + 1]) * R0, 0, gq), rr[i], rr[i + 1], 0.004, NK + 1, 0.15 + gl);
          sph(off(b, 0, -0.005, 0.005, gp), 0.022, 0.004, NK + 2, 0.2 + gl);
        } else {
          // a four-leaf clover with a little stem, on a gold bead
          for (const [x, y] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) sph(off(pc, x * 0.03, y * 0.03 - 0.005, 0, gp), 0.033, 0.012, NK + 1, gl);
          cap(off(pc, 0, -0.03, 0.01, gp), off(pc, 0.03, -0.095, 0.02, gq), 0.01, 0.007, 0.004, NK + 2, 0);
          sph(off(b, 0, 0, 0.005, gp), 0.02, 0.004, NK, 0);
        }
      }
      const wa = this.arms[0], ra = this.arms[1];
      if (gear.weapon && wa.grow > 0.5) {
        const f = wa.fi.p, sx = wa.side, gw = gear.glow.weapon;
        if (gear.weapon === 'bow') {
          // a recurve bow: curved limbs that bend back and flick out at the tips, a leather grip and a taut string
          const G = off(f, sx * 0.06, 0, 0.03, [0, 0, 0]);
          for (const sy of [1, -1]) {
            const u1 = off(f, sx * 0.02, sy * 0.24, 0.025, gp), u2 = off(f, sx * -0.09, sy * 0.43, 0.01, gq), tip = off(f, sx * -0.07, sy * 0.51, 0.01, [0, 0, 0]);
            cap(G, u1, 0.034, 0.027, 0.01, WP, gw * 0.4); cap(u1, u2, 0.027, 0.016, 0.006, WP, gw * 0.4); cap(u2, tip, 0.016, 0.012, 0.004, WP + 3, 0);
          }
          cap(off(f, sx * 0.065, -0.08, 0.03, gp), off(f, sx * 0.065, 0.08, 0.03, gq), 0.04, 0.04, 0.008, WP + 2, 0);
          cap(off(f, sx * -0.075, 0.5, 0.01, gp), off(f, sx * -0.075, -0.5, 0.01, gq), 0.008, 0.008, 0.002, WP + 1, 0);
        } else if (gear.weapon === 'sword') {
          // a broad blade, a gold crossguard with round ends and a gem in its middle, and a gold pommel under the fist
          cap(off(f, 0, 0.2, 0.1, gp), off(f, 0, 0.78, 0.33, gq), 0.05, 0.01, 0.008, WP, gw * 0.5);
          cap(off(f, -0.13, 0.17, 0.1, gp), off(f, 0.13, 0.17, 0.1, gq), 0.03, 0.03, 0.008, WP + 1, 0);
          for (const x of [-0.15, 0.15]) sph(off(f, x, 0.18, 0.1, gp), 0.038, 0.006, WP + 1, 0);
          sph(off(f, 0, 0.17, 0.135, gp), 0.03, 0.004, WP + 3, 0.25 + gw);
          sph(off(f, 0, -0.15, -0.05, gp), 0.045, 0.006, WP + 1, 0);
        } else {
          // the star wand: a gold pommel, a purple-wrapped grip, a carved wooden shaft with a purple band and a gold
          // collar, and a five-pointed star on top
          sph(off(f, 0, -0.12, -0.03, gp), 0.036, 0.006, WP + 3, 0);
          cap(off(f, 0, -0.08, -0.01, gp), off(f, 0, 0.17, 0.08, gq), 0.032, 0.03, 0.006, WP + 2, 0);
          cap(off(f, 0, 0.14, 0.07, gp), off(f, 0, 0.53, 0.215, gq), 0.026, 0.019, 0.006, WP, 0);
          ell(off(f, 0, 0.34, 0.145, gp), 0.032, 0.013, 0.032, 0.004, WP + 2, 0);
          sph(off(f, 0, 0.53, 0.215, gp), 0.031, 0.006, WP + 3, 0);
          const S = off(f, 0, 0.64, 0.255, [0, 0, 0]);
          for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + i * TAU / 5; cap(S, off(S, Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0, gq), 0.042, 0.01, 0.012, WP + 1, 0.35 + gw); }
        }
      }
      // a ring: a band round the second fist (square to its forearm) with a gem set on top
      if (gear.ring && ra.grow > 0.5) {
        const fi = ra.fi.p, el = ra.el.p, d = [fi[0] - el[0], fi[1] - el[1], fi[2] - el[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1;
        d[0] /= dl; d[1] /= dl; d[2] /= dl;
        let u = [d[2], 0, -d[0]], ul = Math.hypot(u[0], u[2]);
        if (ul < 0.2) { u = [1, 0, 0]; ul = 1; }
        u[0] /= ul; u[2] /= ul;
        const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
        if (v[1] < 0) { v[0] = -v[0]; v[1] = -v[1]; v[2] = -v[2]; }
        const fr = (0.155 + ra.swell * 0.06) * ra.grow, along = fr * 0.42, Rb = Math.sqrt(fr * fr - along * along) + 0.012;
        const C0 = [fi[0] + d[0] * along, fi[1] + d[1] * along, fi[2] + d[2] * along], pt = (a, R, out) => { const ca = Math.cos(a) * R, sa = Math.sin(a) * R; out[0] = C0[0] + u[0] * ca + v[0] * sa; out[1] = C0[1] + u[1] * ca + v[1] * sa; out[2] = C0[2] + u[2] * ca + v[2] * sa; return out; };
        for (let i = 0; i < 5; i++) cap(pt(Math.PI / 2 + i * TAU / 5, Rb, gp), pt(Math.PI / 2 + (i + 1) * TAU / 5, Rb, gq), 0.02, 0.02, 0.004, RG, 0);
        sph(pt(Math.PI / 2, Rb + 0.012, gp), 0.03, 0.006, RG, 0);
        sph(pt(Math.PI / 2, Rb + 0.04, gp), 0.04, 0.004, RG + 1, 0.25 + gear.glow.ring);
      }
    }
    o.count = n;

    // rotation for ellipsoids: world -> local (rotate by -yaw)
    // column-major mat3 of R_x(-pitch) * R_y(-yaw): the lounge pitch first undone after the yaw
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), pa2 = this.lng * LOUNGE_TILT, cp = Math.cos(pa2), sp = Math.sin(pa2);
    const m = o.rotInv;
    m[0] = c; m[1] = -sp * s; m[2] = cp * s; m[3] = 0; m[4] = cp; m[5] = sp; m[6] = -s; m[7] = -sp * c; m[8] = cp * c;

    // bounds: a sphere around the middle of all the shapes, so a hat or a raised weapon grows it only as
    // much as it must (every pixel inside it is ray-marched, so its size is most of the blob's GPU cost)
    const by = this.pos[1] + (0.85 * sq * (1 - this.lng) + 0.4 * this.lng) * sc;
    const lo = [this.pos[0] - 0.6 * sc, by - 0.6 * sc, this.pos[2] - 0.6 * sc], hi = [this.pos[0] + 0.6 * sc, by + 0.6 * sc, this.pos[2] + 0.6 * sc];
    const grow = (x, y, z, r) => {
      if (x - r < lo[0]) lo[0] = x - r; if (y - r < lo[1]) lo[1] = y - r; if (z - r < lo[2]) lo[2] = z - r;
      if (x + r > hi[0]) hi[0] = x + r; if (y + r > hi[1]) hi[1] = y + r; if (z + r > hi[2]) hi[2] = z + r;
    };
    for (let i = 0; i < n; i++) {
      const k = i * 4;
      if (pc[k] < 0.5) grow(pa[k], pa[k + 1], pa[k + 2], pa[k + 3]);
      else if (pc[k] < 1.5) { const r = Math.max(pa[k + 3], pc[k + 2]); grow(pa[k], pa[k + 1], pa[k + 2], r); grow(pb[k], pb[k + 1], pb[k + 2], r); }
      else grow(pa[k], pa[k + 1], pa[k + 2], Math.max(pb[k], pb[k + 1], pb[k + 2]));
    }
    const cx = (lo[0] + hi[0]) / 2, cy = (lo[1] + hi[1]) / 2, cz = (lo[2] + hi[2]) / 2;
    let R2 = 0;
    for (let i = 0; i < n; i++) {
      const k = i * 4;
      let ext;
      if (pc[k] < 0.5) ext = Math.hypot(pa[k] - cx, pa[k + 1] - cy, pa[k + 2] - cz) + pa[k + 3];
      else if (pc[k] < 1.5) ext = Math.max(Math.hypot(pa[k] - cx, pa[k + 1] - cy, pa[k + 2] - cz), Math.hypot(pb[k] - cx, pb[k + 1] - cy, pb[k + 2] - cz)) + Math.max(pa[k + 3], pc[k + 2]);
      else ext = Math.hypot(pa[k] - cx, pa[k + 1] - cy, pa[k + 2] - cz) + Math.max(pb[k], pb[k + 1], pb[k + 2]);
      if (ext > R2) R2 = ext;
    }
    o.boundC[0] = cx; o.boundC[1] = cy; o.boundC[2] = cz; o.boundR = Math.max(R2, 0.6 * sc) + 0.06;
    // the same shapes' box: rays that miss it are dropped at once. Padded for the edge fade and for blends,
    // which can bulge out by up to a quarter of their radius
    let kMax = 0;
    for (let i = 0; i < n; i++) if (pb[i * 4 + 3] > kMax) kMax = pb[i * 4 + 3];
    const pad = 0.06 + kMax * 0.25;
    for (let j = 0; j < 3; j++) { o.boxLo[j] = lo[j] - pad; o.boxHi[j] = hi[j] + pad; }
    o.aoY = by - 0.9 + this.lng * 0.4 * sc; // where the shading darkens toward the ground: from the body, whatever the bounds
    o.groundY = this.pos[1];
    o.flash = this.flash; o.glow = this.glow; o.wobble = 0.007 * this.wobbleMul; o.bubbles = this.bubbles; o.spark = this.spark; o.gloss = this.gloss;
    const ch = this.toWorld(J.chest.p, tmp);
    o.chest[0] = ch[0]; o.chest[1] = ch[1]; o.chest[2] = ch[2] + 0; o.chest[3] = this.chestGlow;

    // soft shadow spheres for the floor
    const sd = this.shadow.data;
    let ns = 0;
    const addS = (lp, r) => { if (ns >= 14) return; tw(lp); sd[ns * 4] = w[0]; sd[ns * 4 + 1] = w[1]; sd[ns * 4 + 2] = w[2]; sd[ns * 4 + 3] = r * sc; ns++; };
    addS(J.pelvis.p, 0.27); addS(J.chest.p, 0.3); addS(J.head.p, 0.22);
    addS(J.kneeA.p, 0.12); addS(J.kneeB.p, 0.12); addS(J.footA.p, 0.11); addS(J.footB.p, 0.11);
    for (const a of this.arms) {
      if (a.grow < 0.3) continue;
      addS(a.fi.p, 0.15 * a.grow);
      const mx = [(a.sh.p[0] + a.fi.p[0]) / 2, (a.sh.p[1] + a.fi.p[1]) / 2, (a.sh.p[2] + a.fi.p[2]) / 2];
      addS(mx, 0.1 * a.grow);
    }
    this.shadow.count = ns;
    V3.copy(this.shadow.pos, this.pos);
  }

  // a costume and a hat can be worn together; either id may be 'none'. A hat id passed as the costume lands in the hat slot.
  setCostume(id, hatId = 'none') {
    let c = COSTUMES.find(k => k.id === id), hat = COSTUMES.find(k => k.id === hatId);
    if (c && c.slot === 'hat') { hat = c; c = null; }
    this.costume = c && c.parts.length ? c : null;
    this.hat = hat && hat.slot === 'hat' ? hat : null;
    // hats are made for the bare head (top at 0.225): over a bulky hood (a helmet, a mane) they sit higher,
    // by as much as its round parts rise above a snug hood (thin ears and horns may poke through instead)
    const top = this.costume ? Math.max(0, ...this.costume.parts.filter(p => p[1] === 'head' && p[0] !== 'cap').map(p => p[2][1] + (p[0] === 'sph' ? p[3] : p[3][1]))) : 0;
    this.hatLift = Math.max(0, top - 0.25) * 0.6; // a brim sits on the dome's shoulder, below its top
    if (this.costume) this.costume.pal.forEach((hex, i) => { this.out.pal.set(hexToRgb(hex), i * 3); });
    if (this.hat) this.hat.pal.forEach((hex, i) => { this.out.pal.set(hexToRgb(hex), (4 + i) * 3); });
  }

  // show the equipped artifacts (the save's gear: { items, eq }); better rarities glow a little
  setGear(g) {
    const eq = (g && g.eq) || {}, hid = (g && g.hidden) || {}, slots = GEAR_PAL;
    const out = { glow: {}, myth: null };
    let any = false;
    for (const slot in slots) {
      const key = eq[slot];
      // a hidden slot keeps its stats but is not drawn
      if (!key || !(g.items[key] > 0) || hid[slot]) continue;
      const { id, r } = artParse(key), look = gearLook(id, g);
      if (!look) continue;
      out[slot] = id; out.glow[slot] = r >= MYTHIC ? 0.5 : r * 0.1; any = true;
      look.forEach((hex, i) => { this.out.pal.set(hexToRgb(hex), (slots[slot] + i) * 3); this.out.gearMat[slots[slot] - 8 + i] = (GEAR_MAT[id] || [])[i] ?? 0.5; });
      // mythic: its colors cycle through the rainbow (rainbowGear, every frame)
      if (r >= MYTHIC) (out.myth = out.myth || []).push([slots[slot], look.length]);
    }
    this.gear = any ? out : null;
  }
  // mythic gear shimmers through the rainbow
  rainbowGear() {
    const t = this.time, pal = this.out.pal;
    const f = (h, n) => { const k = (n + h * 6) % 6; return 1 - 0.75 * Math.max(0, Math.min(k, 4 - k, 1)); };
    for (const [at, n] of this.gear.myth) for (let i = 0; i < n; i++) {
      const h = (t * 0.35 + i * 0.18 + at * 0.07) % 1, o = (at + i) * 3;
      pal[o] = f(h, 5); pal[o + 1] = f(h, 3); pal[o + 2] = f(h, 1);
    }
  }



  // world position of a joint or an arm's fist
  jointWorld(name, out = [0, 0, 0]) { return this.toWorld(this.joints[name].p, out); }
  fistWorld(i, out = [0, 0, 0]) { return this.toWorld(this.arms[i].fi.p, out); }
}

function bez(a, b, c, t) {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], u * u * a[2] + 2 * u * t * b[2] + t * t * c[2]];
}
