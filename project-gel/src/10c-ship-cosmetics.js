// ============================================================
// Ship looks (the Ships tab on the Blobs screen): hull paints, sail colors, flags and wake trails. They apply to
// whichever ship you sail. Paints and sails recolor the parts marked `paint` in the ship models (04k, 04l):
// those keep their own shading and are multiplied by a tint, paint color / the ship's own color
// (SHIP_BASE_COL), so 'Classic' is a tint of 1. Flags are small meshes on a pole (FLAG_SPOT).
// ============================================================
const SHIP_PAINTS = [
  { id: 'classic', name: 'Classic', cost: 0, col: null },
  { id: 'royal', name: 'Royal Blue', cost: 900, col: '#2a5ad8' },
  { id: 'crimson', name: 'Crimson', cost: 900, col: '#c8283a' },
  { id: 'emerald', name: 'Emerald', cost: 1200, col: '#1f9a5a' },
  { id: 'midnight', name: 'Midnight', cost: 1200, col: '#1c2236' },
  { id: 'bubblegum', name: 'Bubblegum', cost: 1500, col: '#ff7ab8' },
  { id: 'sunshine', name: 'Sunshine', cost: 1500, col: '#ffc21f' },
  { id: 'arctic', name: 'Arctic', cost: 1800, col: '#e8f4ff' },
  { id: 'goldleaf', name: 'Gold Leaf', cost: 3000, col: '#e8b84a' },
];
const SHIP_SAILS = [
  { id: 'classic', name: 'Classic Sails', cost: 0, col: null },
  { id: 'crimson', name: 'Crimson Sails', cost: 700, col: '#d8323c' },
  { id: 'sky', name: 'Sky Sails', cost: 700, col: '#7ac8ff' },
  { id: 'mint', name: 'Mint Sails', cost: 900, col: '#7af0c8' },
  { id: 'lavender', name: 'Lavender Sails', cost: 900, col: '#b48aff' },
  { id: 'jet', name: 'Jet Black Sails', cost: 1200, col: '#1c1820' },
  { id: 'gold', name: 'Golden Sails', cost: 2200, col: '#f2c440' },
];
// flags: the cloth's color and its emblem (drawn as flag_<id>, built in 04l-ship-models.js)
const SHIP_FLAGS = [
  { id: 'none', name: 'No Flag', cost: 0 },
  { id: 'roger', name: 'Jolly Roger', cost: 800 }, { id: 'goo', name: 'Goo Flag', cost: 800 }, { id: 'heart', name: 'Sweetheart', cost: 1000 },
  { id: 'checker', name: 'Racing Flag', cost: 1000 }, { id: 'swords', name: 'Crossed Swords', cost: 1300 }, { id: 'rainbow', name: 'Rainbow Flag', cost: 1600 },
].map(F => ({ ...F, ...(FLAG_LOOKS[F.id] || {}) }));
// wake trails: the wake's foam color, and what rises out of it
const WAKE_TRAILS = [
  { id: 'foam', name: 'Sea Foam', cost: 0, col: [0.95, 0.99, 1] },
  { id: 'bubbles', name: 'Bubbles', cost: 700, col: [0.8, 0.95, 1], part: 'bubble' },
  { id: 'glow', name: 'Glowing Wake', cost: 1000, col: [0.4, 1, 0.85], add: true },
  { id: 'sparkle', name: 'Gold Sparkles', cost: 1300, col: [1, 0.92, 0.6], part: 'sparkle' },
  { id: 'hearts', name: 'Lovestruck', cost: 1300, col: [1, 0.75, 0.85], part: 'heart' },
  { id: 'flame', name: 'Flame Wake', cost: 1800, col: [1, 0.62, 0.3], part: 'flame', add: true },
  { id: 'rainbow', name: 'Rainbow Wake', cost: 2500, col: null, part: 'rainbow' },
];
// each ship's own colors under the paint and the sails, and where its flag flies [x, z, y of the pole's foot, height]
const SHIP_BASE_COL = {
  raft: { hull: '#b07a45' }, canoe: { hull: '#c0582e' }, sloop: { hull: '#8a5530', sail: '#f4e8cc' }, galleon: { hull: '#3e2a22', sail: '#2c2832' },
  yacht: { hull: '#fbf8f2' }, cruise: { hull: '#fbf8f2' }, cargo: { hull: '#244a7a' }, battleship: { hull: '#7a8494' }, carrier: { hull: '#6a7280' }, ark: { hull: '#f4ecd6', sail: '#fffaf0' },
};
const FLAG_SPOT = {
  raft: [0.55, -1.0, 0.17, 1.6], canoe: [0, -1.85, 0.2, 1.6], sloop: [0, -2.45, 1.4, 1.5], galleon: [0, -3.4, 2.1, 1.8], yacht: [0, -2.45, 3.0, 1.4], cruise: [0, -4.6, 2.76, 2.0],
  cargo: [0, -6.4, 5.2, 2.0], battleship: [0, -7.6, 1.6, 2.4], carrier: [-2.35, -1.6, 7.3, 1.8], ark: [0, -8.6, 3.0, 2.4],
};
const SHIP_LOOK_KINDS = [
  { key: 'paint', title: 'Hull Paint', list: SHIP_PAINTS },
  { key: 'sail', title: 'Sails', list: SHIP_SAILS },
  { key: 'flag', title: 'Flags', list: SHIP_FLAGS },
  { key: 'trail', title: 'Wake Trails', list: WAKE_TRAILS },
];
// the looks in use: what is being tried on in the Ships tab, or else what is equipped
function shipLook() {
  const sv = G.save && G.save.sea, pv = typeof UI !== 'undefined' && UI.menuTab === 'skins' && UI.blobTab === 'ships' && UI.shipPreview;
  const get = key => (pv && pv[key]) || (sv && sv[key]);
  return { paint: SHIP_PAINTS.find(p => p.id === get('paint')) || SHIP_PAINTS[0], sail: SHIP_SAILS.find(p => p.id === get('sail')) || SHIP_SAILS[0], flag: SHIP_FLAGS.find(p => p.id === get('flag')) || SHIP_FLAGS[0], trail: WAKE_TRAILS.find(p => p.id === get('trail')) || WAKE_TRAILS[0] };
}
const SHIP_ONE = [1, 1, 1];
// the tint that turns a ship's own color into the paint: per channel, paint / own
function shipTint(id, part, look) {
  const L = look || shipLook(), item = part === 'sail' ? L.sail : L.paint, base = SHIP_BASE_COL[id] && SHIP_BASE_COL[id][part === 'sail' ? 'sail' : 'hull'];
  if (!item || !item.col || !base) return SHIP_ONE;
  const c = hexToRgb(item.col), b = hexToRgb(base);
  return [c[0] / Math.max(0.04, b[0]), c[1] / Math.max(0.04, b[1]), c[2] / Math.max(0.04, b[2])];
}
// little pictures for the Ships tab
function shipLookIcon(key, item) {
  const ol = 'stroke="#23305a" stroke-width="3" stroke-linejoin="round"';
  let inner;
  if (key === 'paint') { const c = item.col || '#8a5530'; inner = `<path d="M6 34 H58 L50 52 Q32 56 14 52 Z" fill="${c}" ${ol}/><path d="M10 38 H54" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"/><rect x="24" y="22" width="16" height="12" rx="2" fill="#f4ecdc" ${ol}/><path d="M32 22 V8" stroke="#23305a" stroke-width="3"/>`; }
  else if (key === 'sail') { const c = item.col || '#f4e8cc'; inner = `<path d="M30 6 V54" stroke="#6e4426" stroke-width="4" stroke-linecap="round"/><path d="M14 12 Q34 20 14 44 Z M34 10 Q58 22 34 48 Z" fill="${c}" ${ol}/><path d="M8 54 H56" stroke="#23305a" stroke-width="4" stroke-linecap="round"/>`; }
  else if (key === 'flag') {
    if (item.id === 'none') inner = `<path d="M18 8 V58" stroke="#6e4426" stroke-width="4" stroke-linecap="round"/><path d="M14 20 L50 44 M50 20 L14 44" stroke="#c8d0da" stroke-width="5" stroke-linecap="round"/>`;
    else { const e = item.emblem, m = item.mark;
      const em = e === 'skull' ? `<circle cx="36" cy="22" r="7" fill="${m}"/><rect x="31" y="27" width="10" height="5" fill="${m}"/>` : e === 'blob' ? `<path d="M28 30 Q28 14 36 14 Q44 14 44 30 Z" fill="${m}"/><circle cx="33" cy="23" r="2" fill="#23305a"/><circle cx="39" cy="23" r="2" fill="#23305a"/>`
        : e === 'heart' ? `<path d="M36 33 C26 26 28 16 36 21 C44 16 46 26 36 33 Z" fill="${m}"/>` : e === 'checker' ? Array.from({ length: 8 }, (_, i) => { const cx = i % 4, cy = Math.floor(i / 4); return (cx + cy) % 2 ? '' : `<rect x="${20 + cx * 8}" y="${10 + cy * 13}" width="8" height="13" fill="${m}"/>`; }).join('')
        : e === 'swords' ? `<path d="M24 12 L48 34 M48 12 L24 34" stroke="${m}" stroke-width="4" stroke-linecap="round"/>` : `<path d="M20 12 H52 V16 H20 Z" fill="#ff5a5a"/><path d="M20 16 H52 V20 H20 Z" fill="#ffa83a"/><path d="M20 20 H52 V24 H20 Z" fill="#ffe84a"/><path d="M20 24 H52 V28 H20 Z" fill="#5ad86a"/><path d="M20 28 H52 V32 H20 Z" fill="#4aa8ff"/><path d="M20 32 H52 V36 H20 Z" fill="#a86aff"/>`;
      inner = `<path d="M18 8 V58" stroke="#6e4426" stroke-width="4" stroke-linecap="round"/><path d="M20 10 H52 V36 H20 Z" fill="${e === 'rainbow' ? '#fff' : item.cloth}" ${ol}/>${em}<path d="M20 10 H52 V36 H20 Z" fill="none" ${ol}/>`; }
  } else {
    const col = item.col ? '#' + item.col.map(v => Math.round(Math.min(1, v) * 255).toString(16).padStart(2, '0')).join('') : null;
    const dots = [[12, 46, 6], [24, 38, 5], [36, 30, 4.5], [47, 22, 4], [56, 15, 3]];
    inner = `<path d="M6 54 Q30 50 58 10" stroke="#9fd0ff" stroke-width="10" stroke-linecap="round" fill="none" opacity=".5"/>` + dots.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${col || ['#ff5a5a', '#ffa83a', '#ffe84a', '#5ad86a', '#4aa8ff'][i]}" ${ol.replace('3"', '2"')}/>`).join('');
  }
  return svgUrl(svgDoc(inner));
}
// hue, saturation, lightness (0-1) to [r, g, b] (the rainbow wake)
function hslRgb(h, s, l) {
  const k = n => (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}
