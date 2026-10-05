// Injected before the game loads: manual frame control and a bot player.
(() => {
  const realRAF = window.requestAnimationFrame.bind(window);
  window.__auto = true;
  window.__rafQ = [];
  window.__now = 0;
  window.requestAnimationFrame = cb => {
    if (window.__auto) return realRAF(cb);
    window.__rafQ.push(cb);
    return 1;
  };
  window.__manual = () => { window.__auto = false; window.__now = performance.now(); };
  // run n frames of the real game loop with a fixed dt; render only when asked
  window.__frames = (n, dt = 1 / 60, render = false) => {
    const keep = window.renderFrame;
    if (!render) window.renderFrame = () => {};
    try {
      for (let i = 0; i < n; i++) {
        const q = window.__rafQ; window.__rafQ = [];
        window.__now += dt * 1000;
        for (const cb of q) cb(window.__now);
      }
    } finally { window.renderFrame = keep; }
  };
  window.__bot = { on: false, log: [], picks: [], minHp: 1, prefer: null };
  // potential-field kiting bot
  window.__botInput = () => {
    const run = G.run;
    if (!run || !__bot.on) { G.input.x = 0; G.input.z = 0; return; }
    const h = G.hero.pos;
    let fx = 0, fz = 0;
    for (const e of run.enemies) {
      if (e.dying) continue;
      const dx = h[0] - e.x, dz = h[2] - e.z, d = Math.hypot(dx, dz) || 0.01;
      const r = e.boss ? 3.2 + e.radius : 2.6 + e.radius;
      if (d < r) { const w = (r - d) / r; const k = (e.boss ? 4 : 1) * w * w / d; fx += dx * k; fz += dz * k; }
      // stay within skill range of a boss, the way a player would
      if (e.boss && d > 6.5) { fx -= dx / d * 0.6; fz -= dz / d * 0.6; }
    }
    for (const s of run.eShots) {
      if (s.kind === 'boulder') {
        const dx = h[0] - s.tx, dz = h[2] - s.tz, d = Math.hypot(dx, dz) || 0.01, r = s.radius + 1.2;
        if (d < r) { fx += dx / d * 6; fz += dz / d * 6; }
      } else {
        const dx = h[0] - s.x, dz = h[2] - s.z, d = Math.hypot(dx, dz) || 0.01;
        if (d < 2.5) { const sp = Math.hypot(s.vx, s.vz) || 1; const px = -s.vz / sp, pz = s.vx / sp; const side = Math.sign(dx * px + dz * pz) || 1; fx += px * side * 3; fz += pz * side * 3; }
      }
    }
    if (run.tele) for (const t of run.tele) {
      if (t.kind === 'circle') {
        const dx = h[0] - t.x, dz = h[2] - t.z, d = Math.hypot(dx, dz) || 0.01;
        if (d < t.r + 1) { fx += dx / d * 8; fz += dz / d * 8; }
      } else {
        const ax = Math.sin(t.rot), az = Math.cos(t.rot), dx = h[0] - t.x, dz = h[2] - t.z;
        const along = dx * ax + dz * az, perp = dx * az - dz * ax;
        if (along > -1 && along < t.len + 1 && Math.abs(perp) < t.r + 1.4) { const s = Math.sign(perp) || 1; fx += az * s * 8; fz += -ax * s * 8; }
      }
    }
    // twins' rope
    for (const b of run.bosses) {
      if (b.type !== 'twins' || b.dying || !b.ai.partner || b.ai.partner.dying) continue;
      const p = b.ai.partner, ex = p.x - b.x, ez = p.z - b.z, l2 = ex * ex + ez * ez || 1;
      const tt = clamp(((h[0] - b.x) * ex + (h[2] - b.z) * ez) / l2, 0, 1), cx = b.x + ex * tt, cz = b.z + ez * tt;
      const dx = h[0] - cx, dz = h[2] - cz, d = Math.hypot(dx, dz) || 0.01;
      if (d < 2) { fx += dx / d * 5; fz += dz / d * 5; }
    }
    // stay off walls, boulders and pools, as a player would
    for (const ob of ARENA.obstacles) {
      const dx = h[0] - ob.x, dz = h[2] - ob.z, d = Math.hypot(dx, dz) || 0.01, r = ob.r + 1.6;
      if (d < r) { const w = (r - d) / 1.6; fx += dx / d * w * 1.5; fz += dz / d * w * 1.5; }
    }
    const sd = arenaSd(h[0], h[2]);
    if (sd > -4) { const n = arenaNormal(h[0], h[2], [0, 0]), w = (sd + 4) / 4; fx -= n[0] * w * 2.5; fz -= n[1] * w * 2.5; }
    // gems and pickups when it is calm
    const danger = Math.hypot(fx, fz);
    let best = null, bd = 1e9;
    for (const g of run.gems) { const d = Math.hypot(g.x - h[0], g.z - h[2]); if (d < bd) { bd = d; best = g; } }
    for (const p of run.pickups) { const d = Math.hypot(p.x - h[0], p.z - h[2]) * (p.kind === 'chest' || p.kind === 'heart' ? 0.4 : 0.8); if (d < bd) { bd = d; best = p; } }
    if (best && bd < 12) { const dx = best.x - h[0], dz = best.z - h[2], d = Math.hypot(dx, dz) || 1; const k = danger < 0.5 ? 1 : 0.35; fx += dx / d * k; fz += dz / d * k; }
    else { fx += -h[0] * 0.01; fz += -h[2] * 0.01; }
    // circle around a crowd instead of stopping
    if (danger > 0.4) { fx += -fz * 0.5; fz += fx * 0.5; }
    const m = Math.hypot(fx, fz);
    if (m > 0.05) { G.input.x = fx / m; G.input.z = fz / m; INPUT.moved = true; } else { G.input.x = 0; G.input.z = 0; }
  };
  // weighted level-up choice: favor owned skills, then new skills, then useful passives
  window.__botPick = () => {
    const run = G.run, ch = run.choices;
    const w = ch.map(c => {
      if (__bot.prefer && __bot.prefer.includes(c.id)) return 50;
      if (SKILLS[c.id]) { const lv = lvlOf(c.id); const nSk = run.slots.filter(s => s.kind === 'skill').length; return lv ? 3 : nSk < 5 ? 2.2 : 0.6; }
      if (PASSIVES[c.id]) return ['power', 'thick', 'armor', 'haste', 'regen'].includes(c.id) ? 1.4 : 0.9;
      return 0.5;
    });
    let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
    while ((r -= w[i]) > 0 && i < w.length - 1) i++;
    __bot.picks.push(ch[i].id + '@' + Math.round(run.t));
    UI.choiceLock = 0;
    UI.pick(i);
  };
})();
// Scan everything sent to the GPU for NaN/Infinity (reports the first bad float per source)
window.__nan = [];
window.__installNanCheck = () => {
  const seen = new Set();
  const report = (src, i, per) => { const key = src + ':' + (i % per); if (!seen.has(key)) { seen.add(key); __nan.push({ src, field: i % per, inst: Math.floor(i / per), t: G.run ? +G.run.t.toFixed(2) : 0 }); } };
  const up = InstanceStream.prototype.upload;
  InstanceStream.prototype.upload = function () {
    const n = this.count * this.floatsPer, d = this.data;
    for (let i = 0; i < n; i++) if (!Number.isFinite(d[i])) { report('stream' + this.floatsPer, i, this.floatsPer); break; }
    return up.call(this);
  };
  const ur = R.uploadRibbons;
  R.uploadRibbons = function () {
    const n = R.rib.nv * 10, d = R.rib.verts;
    for (let i = 0; i < n; i++) if (!Number.isFinite(d[i])) { report('ribbon', i, 10); break; }
    return ur.call(this);
  };
  const dh = R.drawHero;
  R.drawHero = function (...a) {
    const o = G.hero.out;
    for (const k in o) { const v = o[k]; if (v && v.length !== undefined && typeof v !== 'string') { for (let i = 0; i < v.length; i++) if (!Number.isFinite(v[i])) { report('hero.' + k, i, 1); break; } } else if (typeof v === 'number' && !Number.isFinite(v)) report('hero.' + k, 0, 1); }
    return dh.apply(this, a);
  };
};
// Attribute hero damage to its source
window.__dmg = {};
window.__installDmgLog = () => {
  const orig = window.hurtHero;
  window.hurtHero = function (dmg, fx, fz) {
    const run = G.run, before = run.hp;
    orig(dmg, fx, fz);
    const lost = before - run.hp;
    if (lost <= 0) return;
    let src = 'other';
    for (const e of run.enemies) if (e.x === fx && e.z === fz) { src = (e.elite ? 'elite-' : '') + e.type; break; }
    if (src === 'other') for (const s of run.eShots) if (s.x === fx && s.z === fz || s.tx === fx && s.tz === fz) { src = 'shot-' + s.kind; break; }
    const k = Math.floor(run.t / 30) * 30 + 's ' + src;
    __dmg[k] = Math.round((__dmg[k] || 0) + lost);
  };
};
