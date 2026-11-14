// ============================================================
// Goo trails: a cosmetic the blob leaves behind as it moves on land (the Blobs screen's Trails tab). Each is a
// few particles or a ground mark dropped every so often along the way (by distance, so standing still leaves
// nothing), short-lived and capped: a handful of dozen alive at most, half that on Low and Ultra low.
// ============================================================
const BLOB_TRAILS = [
  { id: 'none', name: 'No trail', cost: 0, bg: ['#e8f2ff', '#b9d6f6'] },
  { id: 'goo', name: 'Goo Puddles', cost: 150, bg: ['#c8f4ff', '#56c8f0'] },
  { id: 'bubbles', name: 'Bubbles', cost: 250, bg: ['#d8f6ff', '#5ab8f0'] },
  { id: 'sparkle', name: 'Sparkles', cost: 300, bg: ['#fff4c8', '#ffc23a'] },
  { id: 'petals', name: 'Petals', cost: 350, bg: ['#ffe4f0', '#ff8ac0'] },
  { id: 'hearts', name: 'Hearts', cost: 400, bg: ['#ffe0ea', '#ff5f8a'] },
  { id: 'snow', name: 'Snowflakes', cost: 450, bg: ['#eef8ff', '#8ec8f4'] },
  { id: 'flame', name: 'Flames', cost: 500, bg: ['#ffe2b0', '#ff6a1a'] },
  { id: 'stardust', name: 'Stardust', cost: 600, bg: ['#d8d0ff', '#5a4ad8'] },
  { id: 'rainbow', name: 'Rainbow', cost: 800, bg: ['#fff', '#c8e8ff'] },
];
const TRAIL = { dist: 0, t: 0, hue: 0 };
const hsv = (h, s, v) => { const f = n => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5), f(3), f(1)]; };
// one puff of the trail at (x, z)
function trailPuff(id, x, z) {
  const j = () => rand(-0.18, 0.18);
  switch (id) {
    case 'goo': FX.decal(x + j(), z + j(), rand(0.3, 0.45), 0, R.goo.base || [0.3, 0.8, 1], 2.2, { a: 0.8 }); break;
    case 'bubbles': FX.part(x + j(), 0.25, z + j(), rand(-0.1, 0.1), rand(0.5, 0.9), rand(-0.1, 0.1), 0.05, 0.14, rand(0.8, 1.2), [0.7, 0.95, 1], 0.9, 4, 0, 0.6); break;
    case 'sparkle': FX.part(x + j(), rand(0.2, 0.7), z + j(), 0, rand(0.2, 0.5), 0, rand(0.1, 0.16), 0.02, rand(0.5, 0.8), Math.random() < 0.5 ? [1, 0.85, 0.35] : [1, 1, 0.9], 1, 3); break;
    case 'petals': FX.part(x + j(), rand(0.5, 0.9), z + j(), rand(-0.4, 0.4), -0.25, rand(-0.4, 0.4), 0.07, 0.06, 1.4, Math.random() < 0.6 ? [1, 0.6, 0.78] : [1, 0.92, 0.95], 1, 1, 0, 0.8); break;
    case 'hearts': FX.part(x + j(), 0.35, z + j(), rand(-0.15, 0.15), rand(0.7, 1.0), rand(-0.15, 0.15), 0.13, 0.07, 1.0, [1, 0.32, 0.5], 1, 5, 0, 1); break;
    case 'snow': FX.part(x + j() * 2, rand(1.0, 1.4), z + j() * 2, rand(-0.15, 0.15), -rand(0.35, 0.5), rand(-0.15, 0.15), 0.11, 0.07, 1.6, [0.92, 0.97, 1], 1, 6, 0, 0.3); break;
    case 'flame':
      FX.part(x + j(), 0.12, z + j(), 0, rand(0.9, 1.4), 0, 0.17, 0.04, rand(0.4, 0.6), Math.random() < 0.5 ? [1, 0.55, 0.12] : [1, 0.82, 0.3], 0.95, 0, 0, 1);
      if (Math.random() < 0.3) FX.part(x, 0.3, z, rand(-0.3, 0.3), rand(1.5, 2.2), rand(-0.3, 0.3), 0.04, 0.01, 0.6, [1, 0.6, 0.2], 1, 0, 0, 1);
      break;
    case 'stardust': FX.part(x + j(), rand(0.2, 0.6), z + j(), 0, rand(0.15, 0.35), 0, rand(0.09, 0.14), 0.02, rand(0.9, 1.3), Math.random() < 0.5 ? [0.65, 0.55, 1] : [0.45, 0.85, 1], 1, 3); break;
    case 'rainbow': TRAIL.hue = (TRAIL.hue + 0.06) % 1; FX.decal(x, z, 0.42, 0, hsv(TRAIL.hue, 0.65, 1), 1.6, { a: 0.75 }); break;
  }
}
// every frame of a land run: puffs dropped by distance moved (and never more than about a dozen a second)
function trailTick(dt, id, x, z, speed) {
  if (!id || id === 'none') return;
  TRAIL.t = Math.max(0, TRAIL.t - dt);
  TRAIL.dist += speed * dt;
  const step = id === 'goo' || id === 'rainbow' ? 0.55 : 0.32;
  if (TRAIL.dist < step || TRAIL.t > 0) return;
  TRAIL.dist = 0; TRAIL.t = FX.reduced ? 0.16 : 0.08;
  trailPuff(id, x, z);
}
// the Blobs screen's preview: puffs on a slow circle around the blob's feet
function trailPreview(dt, id) {
  if (!id || id === 'none') return;
  TRAIL.pa = ((TRAIL.pa || 0) + dt * 1.6) % TAU;
  trailTick(dt, id, Math.cos(TRAIL.pa) * 0.7, Math.sin(TRAIL.pa) * 0.7, 2.6);
}
// card pictures, drawn once on a 2D canvas
function trailIcon(T) {
  const key = 'trail-' + T.id;
  if (ICONS.map[key]) return ICONS.map[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, T.bg[0]); g.addColorStop(1, T.bg[1]);
  c.fillStyle = g; c.beginPath(); c.roundRect(4, 4, 120, 120, 26); c.fill();
  // a little blob gliding along, the trail behind it
  const path = [[22, 96], [42, 84], [60, 82], [78, 72], [96, 60]];
  const heart = (x, y, s, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x, y + s * 0.35); c.bezierCurveTo(x - s, y - s * 0.4, x - s * 0.45, y - s * 1.05, x, y - s * 0.45); c.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s, y - s * 0.4, x, y + s * 0.35); c.fill(); };
  const star = (x, y, s, col) => { c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? s * 0.32 : s; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.fill(); };
  const flake = (x, y, s) => { c.strokeStyle = '#fff'; c.lineWidth = 2.6; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; c.beginPath(); c.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.stroke(); } };
  path.slice(0, 4).forEach(([x, y], i) => {
    const s = 6 + i * 2;
    switch (T.id) {
      case 'goo': c.fillStyle = 'rgba(40,170,230,.75)'; c.beginPath(); c.ellipse(x, y + 6, s * 1.2, s * 0.55, 0, 0, TAU); c.fill(); break;
      case 'bubbles': c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y - i * 4, s * 0.8, 0, TAU); c.stroke(); break;
      case 'sparkle': star(x, y - 6, s, i % 2 ? '#fff' : '#ffe27a'); break;
      case 'petals': c.fillStyle = i % 2 ? '#fff0f6' : '#ff7ab0'; c.beginPath(); c.ellipse(x, y - 4, s * 0.8, s * 0.45, i, 0, TAU); c.fill(); break;
      case 'hearts': heart(x, y - 4 - i * 3, s * 0.95, '#ff3a6e'); break;
      case 'snow': flake(x, y - 8 - i * 2, s * 0.9); break;
      case 'flame': c.fillStyle = i % 2 ? '#ffd23a' : '#ff6a1a'; c.beginPath(); c.moveTo(x - s * 0.7, y + 4); c.quadraticCurveTo(x - s * 0.6, y - s * 1.6, x, y - s * 2.2); c.quadraticCurveTo(x + s * 0.6, y - s * 1.6, x + s * 0.7, y + 4); c.fill(); break;
      case 'stardust': star(x, y - 6, s, i % 2 ? '#a8e8ff' : '#c8b0ff'); break;
      case 'rainbow': c.fillStyle = `hsl(${i * 70},90%,62%)`; c.beginPath(); c.ellipse(x, y + 4, s * 1.25, s * 0.6, 0, 0, TAU); c.fill(); break;
    }
  });
  if (T.id === 'none') { c.strokeStyle = 'rgba(120,150,190,.8)'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(34, 94); c.lineTo(94, 34); c.stroke(); }
  // the blob
  const [bx, by] = path[4];
  const bg2 = c.createRadialGradient(bx - 6, by - 8, 3, bx, by, 22); bg2.addColorStop(0, '#bff4ff'); bg2.addColorStop(1, '#22b4ec');
  c.fillStyle = bg2; c.beginPath(); c.ellipse(bx, by, 19, 17, 0, 0, TAU); c.fill();
  c.fillStyle = '#132'; c.beginPath(); c.arc(bx - 6, by - 3, 2.6, 0, TAU); c.arc(bx + 6, by - 3, 2.6, 0, TAU); c.fill();
  c.strokeStyle = '#132'; c.lineWidth = 2; c.beginPath(); c.arc(bx, by + 2, 5, 0.2, Math.PI - 0.2); c.stroke();
  ICONS.map[key] = cv.toDataURL();
  return ICONS.map[key];
}
