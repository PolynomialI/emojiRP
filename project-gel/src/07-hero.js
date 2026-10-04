// ============================================================
// Hero rig: spring-driven blended shapes with procedural animation
// ============================================================
// Local frame: x = side, y = up, z = forward. World = pos + rotY(yaw) * (local * scale)
const HERO_JOINTS = {
  pelvis: { rest: [0, 0.6, 0], k: 420, z: 0.62, inertia: 0.15 },
  chest: { rest: [0, 0.93, 0], k: 260, z: 0.42, inertia: 0.42 },
  head: { rest: [0, 1.3, 0.03], k: 170, z: 0.34, inertia: 0.7 },
  hipA: { rest: [0.13, 0.5, 0], k: 520, z: 0.7, inertia: 0.08 },
  hipB: { rest: [-0.13, 0.5, 0], k: 520, z: 0.7, inertia: 0.08 },
  kneeA: { rest: [0.16, 0.29, 0.05], k: 460, z: 0.62, inertia: 0.12 },
  kneeB: { rest: [-0.16, 0.29, 0.05], k: 460, z: 0.62, inertia: 0.12 },
  footA: { rest: [0.18, 0.075, 0.06], k: 950, z: 0.85, inertia: 0 },
  footB: { rest: [-0.18, 0.075, 0.06], k: 950, z: 0.85, inertia: 0 },
};
const ARM_SLOTS = [
  { side: 1, sh: [0.29, 1.06, 0], el: [0.42, 0.86, 0.05], fi: [0.5, 0.7, 0.15] },
  { side: -1, sh: [-0.29, 1.06, 0], el: [-0.42, 0.86, 0.05], fi: [-0.5, 0.7, 0.15] },
  { side: 1, sh: [0.22, 1.13, -0.15], el: [0.42, 1.12, -0.28], fi: [0.56, 1.0, -0.12] },
  { side: -1, sh: [-0.22, 1.13, -0.15], el: [-0.42, 1.12, -0.28], fi: [-0.56, 1.0, -0.12] },
];

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
      rotInv: new Float32Array(9), boundC: [0, 0, 0], boundR: 1, flash: 0, glow: 0, wobble: 0.008, bubbles: 0, spark: 0, gloss: 1,
      chest: new Float32Array(4),
    };
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
  toWorld(l, out) {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), sc = this.scale;
    out[0] = this.pos[0] + (c * l[0] + s * l[2]) * sc;
    out[1] = this.pos[1] + l[1] * sc;
    out[2] = this.pos[2] + (-s * l[0] + c * l[2]) * sc;
    return out;
  }
  toLocal(w, out) {
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw), sc = this.scale;
    const dx = (w[0] - this.pos[0]) / sc, dy = (w[1] - this.pos[1]) / sc, dz = (w[2] - this.pos[2]) / sc;
    out[0] = c * dx - s * dz; out[1] = dy; out[2] = s * dx + c * dz;
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
    this.time += dt;
    // movement and facing
    V3.copy(this.prevVel, this.vel);
    V3.copy(this.vel, moveVel);
    const speed = Math.hypot(this.vel[0], this.vel[2]);
    const prevSpeed = Math.hypot(this.prevVel[0], this.prevVel[2]);
    const yaw0 = this.yaw;
    if (speed > 0.2) {
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
    const sN = clamp(speed / this.topSpeed, 0, 1);
    this.phase += dt * (speed / 1.15) * TAU;
    const ph = this.phase, t = this.time;
    const bob = sN * (0.035 * Math.cos(2 * ph) - 0.012) + (1 - sN) * 0.008 * Math.sin(t * 1.8);
    const lean = sN * 0.17 * this.stretchMul;
    const breathe = Math.sin(t * TAU / 3.4);
    const J = this.joints;
    const leanPt = (out, base, h) => { out[0] = base[0]; out[1] = base[1] - (base[1] - 0.6) * (1 - Math.cos(lean)); out[2] = base[2] + (base[1] - 0.6) * Math.sin(lean); return out; };
    V3.set(J.pelvis.t, 0.008 * Math.sin(t * 1.3) * (1 - sN), 0.6 + bob, 0);
    leanPt(J.chest.t, [0, 0.93 + bob * 1.1 + 0.006 * breathe, 0.0], 0);
    leanPt(J.head.t, [0.012 * Math.sin(t * 0.9) * (1 - sN), 1.3 + bob * 1.25, 0.03], 0);
    for (let i = 0; i < 2; i++) {
      const sg = i === 0 ? 1 : -1, phi = ph + i * Math.PI;
      const hip = i === 0 ? J.hipA : J.hipB, knee = i === 0 ? J.kneeA : J.kneeB, foot = i === 0 ? J.footA : J.footB;
      V3.set(hip.t, sg * 0.13, 0.5 + bob, 0);
      const fz = 0.06 + sN * 0.25 * Math.sin(phi), fy = 0.075 + sN * 0.15 * Math.max(0, Math.cos(phi));
      V3.set(foot.t, sg * 0.18, fy, fz);
      V3.set(knee.t, sg * 0.165, (hip.t[1] + fy) * 0.5 + 0.02, (fz) * 0.5 + 0.05 + 0.08 * sN * Math.max(0, Math.cos(phi)));
    }
    // arms
    for (const a of this.arms) {
      a.grow += (a.growTarget - a.grow) * Math.min(1, dt * 5);
      const slot = a.slot, sg = a.side;
      const phi = ph + (sg > 0 ? 0 : Math.PI);
      leanPt(a.sh.t, [slot.sh[0], slot.sh[1] + bob * 1.1, slot.sh[2]], 0);
      if (!a.action) {
        const swing = a.i < 2 ? sN * 0.22 * Math.sin(phi) : 0.05 * Math.sin(t * 2.2 + a.i);
        V3.set(a.fi.t, slot.fi[0] + 0.015 * Math.sin(t * 1.7 + a.i), slot.fi[1] + 0.02 * Math.sin(t * 2.1 + a.i) + bob, slot.fi[2] - swing);
        V3.set(a.el.t, (a.sh.t[0] + a.fi.t[0]) * 0.5 + sg * 0.06, (a.sh.t[1] + a.fi.t[1]) * 0.5 - 0.05, (a.sh.t[2] + a.fi.t[2]) * 0.5 - 0.02);
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
    for (let i = 0; i < 2; i++) {
      const hip = i ? J.hipB : J.hipA, knee = i ? J.kneeB : J.kneeA, foot = i ? J.footB : J.footA;
      cap(hip.p, knee.p, 0.13, 0.12, 0.1, 0, 0);
      cap(knee.p, foot.p, 0.12, 0.11, 0.06, 0.05, 0);
      ell(foot.p, 0.12, 0.075, 0.16, 0.07, 0.12, 0);
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
    o.count = n;

    // rotation for ellipsoids: world -> local (rotate by -yaw)
    const c = Math.cos(this.yaw), s = Math.sin(this.yaw);
    const m = o.rotInv; // column-major mat3 of R_y(-yaw)
    m[0] = c; m[1] = 0; m[2] = s; m[3] = 0; m[4] = 1; m[5] = 0; m[6] = -s; m[7] = 0; m[8] = c;

    // bounds
    const cx = this.pos[0], cy = this.pos[1] + 0.85 * sc * sq, cz = this.pos[2];
    let R2 = 0.6 * sc;
    for (let i = 0; i < n; i++) {
      const k = i * 4;
      let ext;
      if (pc[k] < 0.5) ext = Math.hypot(pa[k] - cx, pa[k + 1] - cy, pa[k + 2] - cz) + pa[k + 3];
      else if (pc[k] < 1.5) ext = Math.max(Math.hypot(pa[k] - cx, pa[k + 1] - cy, pa[k + 2] - cz), Math.hypot(pb[k] - cx, pb[k + 1] - cy, pb[k + 2] - cz)) + Math.max(pa[k + 3], pc[k + 2]);
      else ext = Math.hypot(pa[k] - cx, pa[k + 1] - cy, pa[k + 2] - cz) + Math.max(pb[k], pb[k + 1], pb[k + 2]);
      if (ext > R2) R2 = ext;
    }
    o.boundC[0] = cx; o.boundC[1] = cy; o.boundC[2] = cz; o.boundR = R2 + 0.06;
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

  // world position of a joint or an arm's fist
  jointWorld(name, out = [0, 0, 0]) { return this.toWorld(this.joints[name].p, out); }
  fistWorld(i, out = [0, 0, 0]) { return this.toWorld(this.arms[i].fi.p, out); }
}

function bez(a, b, c, t) {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], u * u * a[2] + 2 * u * t * b[2] + t * t * c[2]];
}
