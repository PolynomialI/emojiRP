// ============================================================
// Effects: particles, decals, goo droplets, rings
// ============================================================
const COLORS = {
  cyan: hexToRgb('#18d2ff'), cyanHi: hexToRgb('#8ef3ff'), violet: hexToRgb('#7b55f5'), violetHi: hexToRgb('#b49bff'), pink: hexToRgb('#ff5fb8'),
  orange: hexToRgb('#f5891f'), orangeDark: hexToRgb('#b9580f'), mint: hexToRgb('#5cf2ae'), gold: hexToRgb('#ffc63a'), red: hexToRgb('#ff4d3d'),
  white: [1, 1, 1], worm: hexToRgb('#38eab6'), spark: hexToRgb('#d8f6ff'), lava: hexToRgb('#ff7a1a'),
};

const FX = {
  parts: [], decals: [], drops: [],
  maxParts: 3200, maxDecals: 700, maxDrops: 420,
  reduced: false,

  clear() { this.parts.length = 0; this.decals.length = 0; this.drops.length = 0; },

  part(x, y, z, vx, vy, vz, size, size1, life, col, a, type, grav = 0, drag = 2) {
    if (this.parts.length >= this.maxParts) return;
    this.parts.push({ x, y, z, vx, vy, vz, size, size1, life, max: life, r: col[0], g: col[1], b: col[2], a, type, grav, drag });
  },

  burst(x, y, z, n, col, speed = 4, size = 0.12, life = 0.45, type = 1, up = 1.5) {
    if (this.reduced) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), el = rand(-0.2, 1), s = speed * rand(0.35, 1);
      this.part(x, y, z, Math.cos(a) * s * Math.cos(el), Math.sin(el) * s * 0.6 + up, Math.sin(a) * s * Math.cos(el), size * rand(0.6, 1.2), 0, life * rand(0.6, 1.1), col, 1, type, -6, 2.5);
    }
  },

  glow(x, y, z, size, col, life = 0.25, a = 1) { this.part(x, y, z, 0, 0, 0, size, size * 1.6, life, col, a, 0, 0, 0); },
  star(x, y, z, size, col, life = 0.4) { this.part(x, y, z, 0, 0.6, 0, size, size * 0.2, life, col, 1, 3, 0, 0); },
  smoke(x, y, z, size, col, life = 0.8, vy = 0.6) { this.part(x, y, z, rand(-0.3, 0.3), vy, rand(-0.3, 0.3), size, size * 2.2, life, col, 0.55, 2, 0, 1.5); },

  decal(x, z, size, type, col, life, opts = {}) {
    if (this.decals.length >= this.maxDecals) this.decals.shift();
    this.decals.push({ x, z, sx: size, sz: opts.sz || size, rot: opts.rot ?? rand(0, TAU), type, seed: opts.seed ?? rand(0, 50), life, max: life, r: col[0], g: col[1], b: col[2], a: opts.a ?? 1, add: !!opts.add, grow: opts.grow || 0, fixedT: opts.fixedT });
  },
  splat(x, z, size, col, life = 2) { this.decal(x, z, size, 0, col, life, { a: 0.92 }); },
  ring(x, z, size, col, life = 0.45, a = 0.9) { this.decal(x, z, size, 3, col, life, { add: true, a, rot: 0 }); },
  scorch(x, z, size, life = 2.2) { this.decal(x, z, size, 2, [0.05, 0.05, 0.08], life, { a: 0.75 }); },
  crack(x, z, size, life = 1.6) { this.decal(x, z, size, 8, [0.03, 0.03, 0.05], life, { a: 0.85 }); },

  // 3D goo droplets that arc, bounce and leave tiny splats
  droplets(x, y, z, n, colw, speed = 4, size = 0.06, splatCol = null) {
    if (this.reduced) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      if (this.drops.length >= this.maxDrops) this.drops.shift();
      const a = rand(0, TAU), s = speed * rand(0.4, 1.0);
      this.drops.push({ x, y, z, vx: Math.cos(a) * s, vy: rand(1.5, 4.5), vz: Math.sin(a) * s, r: size * rand(0.6, 1.3), life: rand(0.5, 0.9), colw, splat: splatCol, landed: false, ph: rand(0, 10) });
    }
  },

  update(dt) {
    for (const p of this.parts) {
      p.life -= dt;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vz *= d; p.vy = p.vy * d + p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y < 0.02 && p.type !== 2) { p.y = 0.02; p.vy *= -0.3; }
    }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const d of this.decals) d.life -= dt;
    this.decals = this.decals.filter(d => d.life > 0);
    for (const d of this.drops) {
      d.life -= dt;
      d.vy -= 16 * dt;
      d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
      if (d.y < d.r) {
        d.y = d.r;
        if (!d.landed && d.splat) this.decal(d.x, d.z, d.r * 3.2, 0, d.splat, 1.1, { a: 0.85 });
        d.landed = true;
        d.vy *= -0.32; d.vx *= 0.55; d.vz *= 0.55;
      }
    }
    this.drops = this.drops.filter(d => d.life > 0);
  },

  emit() {
    for (const p of this.parts) {
      const t = 1 - p.life / p.max;
      const size = p.size + (p.size1 - p.size) * t;
      const a = p.a * (p.type === 2 ? Math.sin(Math.min(1, t * 1.6) * Math.PI) : (1 - t * t));
      pushPart(p.x, p.y, p.z, size, p.r, p.g, p.b, a, p.vx, p.vy, p.vz, p.type);
    }
    for (const d of this.decals) {
      const t = d.fixedT !== undefined ? d.fixedT : 1 - d.life / d.max;
      const s = d.grow ? d.sx * (0.4 + 0.6 * Math.min(1, t * 4)) : d.sx;
      pushDecal(d.x, d.z, s, d.grow ? d.sz * (0.4 + 0.6 * Math.min(1, t * 4)) : d.sz, d.rot, d.type, d.seed, t, d.r, d.g, d.b, d.a, d.add);
    }
    for (const d of this.drops) {
      const sp = Math.hypot(d.vx, d.vy, d.vz);
      const st = clamp(1 + sp * 0.05, 1, 1.6);
      const k = Math.min(1, d.life / 0.2);
      pushImp(d.x, d.y, d.z, d.r * k, d.vx, d.vy, d.vz, st, 0, d.colw, 0.15, d.ph, 0, 0, 0, 1);
    }
  },
};
