// ============================================================
// Procedural textures, generated once at load
// ============================================================
const TEX = { noise: null };

// Tileable gradient noise with a given integer period
function periodicNoise(period, seed) {
  const rng = mulberry32(seed);
  const g = new Float32Array(period * period * 2);
  for (let i = 0; i < period * period; i++) { const a = rng() * TAU; g[i * 2] = Math.cos(a); g[i * 2 + 1] = Math.sin(a); }
  const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = ((xi % period) + period) % period, y0 = ((yi % period) + period) % period;
    const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
    const d = (ix, iy, dx, dy) => { const k = (iy * period + ix) * 2; return g[k] * dx + g[k + 1] * dy; };
    const u = fade(xf), v = fade(yf);
    const a = lerp(d(x0, y0, xf, yf), d(x1, y0, xf - 1, yf), u);
    const b = lerp(d(x0, y1, xf, yf - 1), d(x1, y1, xf - 1, yf - 1), u);
    return lerp(a, b, v);
  };
}

function makeFbm(basePeriod, octaves, seed) {
  const layers = [];
  for (let o = 0; o < octaves; o++) layers.push(periodicNoise(basePeriod << o, seed + o * 101));
  return (u, v) => {
    let s = 0, amp = 0.5, norm = 0;
    for (let o = 0; o < octaves; o++) {
      const p = basePeriod << o;
      s += amp * layers[o](u * p, v * p);
      norm += amp; amp *= 0.5;
    }
    return s / norm; // roughly [-0.7, 0.7]
  };
}

// Tileable Worley noise: returns [F1, F2] distances in cell units
function makeWorley(period, seed) {
  const rng = mulberry32(seed);
  const pts = new Float32Array(period * period * 2);
  for (let i = 0; i < pts.length; i++) pts[i] = rng();
  return (u, v) => {
    const x = u * period, y = v * period, xi = Math.floor(x), yi = Math.floor(y);
    let f1 = 9, f2 = 9;
    for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
      const cx = xi + ox, cy = yi + oy;
      const wx = ((cx % period) + period) % period, wy = ((cy % period) + period) % period;
      const k = (wy * period + wx) * 2;
      const dx = cx + pts[k] - x, dy = cy + pts[k + 1] - y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d;
    }
    return [f1, f2];
  };
}

function buildTextures() {
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  const low = makeFbm(4, 5, 11), high = makeFbm(16, 3, 37), cells = makeWorley(8, 71);
  const white = mulberry32(5);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const u = x / N, v = y / N, i = (y * N + x) * 4;
    const [f1, f2] = cells(u, v);
    data[i] = clamp(Math.round((low(u, v) * 0.85 + 0.5) * 255), 0, 255);
    data[i + 1] = clamp(Math.round((high(u, v) * 0.85 + 0.5) * 255), 0, 255);
    data[i + 2] = clamp(Math.round(clamp((f2 - f1) * 1.6, 0, 1) * 255), 0, 255);
    data[i + 3] = Math.floor(white() * 256);
  }
  TEX.noise = GLX.texture(N, N, { data, wrap: gl.REPEAT, mips: true });
}
