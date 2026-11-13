// ============================================================
// Gear: artifacts from scroll chests, fusing two into one, the four
// equip slots, and the stat bonuses of body colors and costumes
// ============================================================

// ---------- artwork: chunky outlined SVGs ----------
const GEAR_OL = 'stroke="#23305a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"';
const svgDoc = (inner, vb = '0 0 64 64') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`;
const svgUrl = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
function starPts(cx, cy, R, r, n = 5) {
  const p = [];
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, d = i % 2 ? r : R; p.push((cx + Math.cos(a) * d).toFixed(1) + ',' + (cy + Math.sin(a) * d).toFixed(1)); }
  return p.join(' ');
}
// gradients: a linear gradient through the stops (top to bottom unless x2/y2 say otherwise) and a radial glow
const grad = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const glowGrad = (id, inner, outer, a = 0.9) => `<radialGradient id="${id}"><stop offset="0" stop-color="${inner}" stop-opacity="${a}"/><stop offset="1" stop-color="${outer}" stop-opacity="0"/></radialGradient>`;
const GOLD = ['#fff1a8', '#ffc83a', '#d98a0c'];
const sparkle = (x, y, s) => `<path d="M${x} ${y - s} Q${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} Q${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s} Z" fill="#fff" stroke="#23305a" stroke-width="2" stroke-linejoin="round"/>`;
// a ring: a shaded band with a faceted gem in a gold setting
const ringArt = (band, gem) => `<defs>${grad('b', band, 1, 1)}${grad('m', gem, 1, 1)}</defs>
  <circle cx="32" cy="38" r="17.5" fill="none" stroke="#23305a" stroke-width="14"/><circle cx="32" cy="38" r="17.5" fill="none" stroke="url(#b)" stroke-width="8"/>
  <circle cx="32" cy="38" r="14" fill="none" stroke="#000" stroke-opacity=".16" stroke-width="1.5"/>
  <path d="M17.5 33 A15 15 0 0 1 24 24.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>
  <path d="M41 50 A15 15 0 0 0 47.5 42" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>
  <path d="M22.5 22 L26.5 27 M41.5 22 L37.5 27" stroke="#23305a" stroke-width="5" stroke-linecap="round"/><path d="M22.5 22 L26.5 27 M41.5 22 L37.5 27" stroke="${band[1]}" stroke-width="2.4" stroke-linecap="round"/>
  <path d="M19 17 L25.5 5 L38.5 5 L45 17 L32 33 Z" fill="url(#m)" ${GEAR_OL}/>
  <path d="M19.5 17 H44.5 M25.5 5 L28.5 17 L32 32 L35.5 17 L38.5 5" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M24 13 L27 8.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`;
// a necklace chain with a bail, for the pendants
const chainArt = `<path d="M7 2 Q32 40 57 2" fill="none" stroke="#23305a" stroke-width="5" stroke-linecap="round"/><path d="M7 2 Q32 40 57 2" fill="none" stroke="#ffd23a" stroke-width="2.4" stroke-dasharray="3 2.4" stroke-linecap="round"/>`;
const bail = x => `<path d="M${x} 20 V27" stroke="#23305a" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="22" r="3.2" fill="#ffc83a" stroke="#23305a" stroke-width="2"/>`;
const GEAR_SVG = {
  sword: `<defs>${grad('b', ['#ffffff', '#dfe8f3', '#a3b6ce'], 1, 0)}${grad('g', GOLD)}${grad('h', ['#b5774a', '#6e3c1c'], 1, 0)}</defs><g transform="rotate(45 32 32)">
    <path d="M32 -7 L40 3 L40 46 L24 46 L24 3 Z" fill="url(#b)" ${GEAR_OL}/><path d="M32 0 V42" stroke="#9fb3cc" stroke-width="3" stroke-linecap="round"/>
    <path d="M27.5 5 V42" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".95"/><path d="M36.5 8 V42" stroke="#7f93ad" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>
    <rect x="27.5" y="53" width="9" height="13" rx="2.5" fill="url(#h)" ${GEAR_OL}/><path d="M27.5 57.5 L36.5 55.5 M27.5 61.5 L36.5 59.5" stroke="#4a240c" stroke-width="1.8"/>
    <rect x="13" y="45" width="38" height="9" rx="4.5" fill="url(#g)" ${GEAR_OL}/><path d="M17 47.5 H27" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
    <circle cx="32" cy="49.5" r="4" fill="#ff3d5e" stroke="#23305a" stroke-width="2"/><circle cx="30.8" cy="48.3" r="1.2" fill="#fff"/>
    <circle cx="32" cy="67" r="5" fill="url(#g)" ${GEAR_OL}/><circle cx="30.5" cy="65.5" r="1.4" fill="#fff" opacity=".9"/></g>`,
  wand: `<defs>${grad('s', ['#b58cff', '#7a4bd6', '#4a22a8'], 1, 1)}${grad('t', ['#fff8c0', '#ffd23a', '#ff9f1a'])}${glowGrad('l', '#fff6c0', '#ffd23a', 0.85)}</defs>
    <circle cx="43" cy="21" r="21" fill="url(#l)"/>
    <path d="M7 59 L35 31" stroke="#23305a" stroke-width="11" stroke-linecap="round"/><path d="M7 59 L35 31" stroke="url(#s)" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M8.5 55.5 L32 32" stroke="#e2d2ff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
    <path d="M10 51 L16 57 M27 34 L33 40" stroke="#23305a" stroke-width="6" stroke-linecap="round"/><path d="M10 51 L16 57 M27 34 L33 40" stroke="#ffc83a" stroke-width="2.6" stroke-linecap="round"/>
    <polygon points="${starPts(43, 21, 19, 8.5)}" fill="url(#t)" ${GEAR_OL}/><polygon points="${starPts(43, 21, 8.5, 3.8)}" fill="#fff8d0" opacity=".75"/>
    <path d="M36 15 L40 12.5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>${sparkle(57, 46, 5)}${sparkle(13, 14, 4.5)}${sparkle(20, 33, 2.8)}`,
  bow: `<defs>${grad('w', ['#e6a868', '#b8733e', '#8a4f24'], 1, 0)}${grad('a', ['#ffffff', '#cfd8e6', '#93a3ba'])}</defs>
    <path d="M20 3 L12 32 L20 61" fill="none" stroke="#23305a" stroke-width="1.8" stroke-linejoin="round" opacity=".85"/>
    <path d="M20 3 Q66 32 20 61" fill="none" stroke="#23305a" stroke-width="11" stroke-linecap="round"/><path d="M20 3 Q66 32 20 61" fill="none" stroke="url(#w)" stroke-width="6" stroke-linecap="round"/>
    <path d="M23 7 Q55 26 43 26" fill="none" stroke="#f5c58e" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
    <rect x="38" y="25" width="9" height="14" rx="2.5" fill="#ff5f7a" ${GEAR_OL}/><path d="M38 29.5 H47 M38 34.5 H47" stroke="#b8243c" stroke-width="1.6"/>
    <circle cx="20" cy="3.5" r="3.4" fill="#ffc83a" stroke="#23305a" stroke-width="2"/><circle cx="20" cy="60.5" r="3.4" fill="#ffc83a" stroke="#23305a" stroke-width="2"/>
    <path d="M12 32 H55" stroke="#23305a" stroke-width="6" stroke-linecap="round"/><path d="M12 32 H55" stroke="#f0dcb0" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M51 24.5 L62 32 L51 39.5 L53.5 32 Z" fill="url(#a)" ${GEAR_OL}/>
    <path d="M18 32 L10 23.5 L3 23.5 L8.5 32 L3 40.5 L10 40.5 Z" fill="#ff5f7a" stroke="#23305a" stroke-width="2" stroke-linejoin="round"/><path d="M7 26.5 L13 32 L7 37.5" fill="none" stroke="#ffb3c0" stroke-width="1.4" stroke-linecap="round"/>`,
  // the Hero Cloak: a full robe with sleeves, a gold collar and belt, and pleats
  cloak: `<defs>${grad('r', ['#ff7a8c', '#e8283c', '#9c1024'], 1, 0)}${grad('g', GOLD)}</defs>
    <path d="M21 7 Q32 12 43 7 L52 13 L60.5 31 L53 35.5 L48 27 L54 58 Q43 62.5 32 58 Q21 62.5 10 58 L16 27 L11 35.5 L3.5 31 L12 13 Z" fill="url(#r)" ${GEAR_OL}/>
    <path d="M27 34 Q25 46 23 58 M32 35 V58.5 M37 34 Q39 46 41 58" fill="none" stroke="#a01428" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
    <path d="M24.5 37 Q22.5 47 20.5 57" fill="none" stroke="#ff9aa6" stroke-width="1.4" stroke-linecap="round" opacity=".75"/><path d="M14 16 L8 29" stroke="#ff9aa6" stroke-width="2" stroke-linecap="round" opacity=".7"/>
    <path d="M10 58 Q21 62.5 32 58 Q43 62.5 54 58" fill="none" stroke="#23305a" stroke-width="5.5" stroke-linecap="round"/><path d="M10 58 Q21 62.5 32 58 Q43 62.5 54 58" fill="none" stroke="#ffc83a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M3.5 31 L11 35.5 L12.8 31.6 L6 27.4 Z M60.5 31 L53 35.5 L51.2 31.6 L58 27.4 Z" fill="url(#g)" stroke="#23305a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M16 27 Q32 33 48 27 L48.6 31.6 Q32 37.8 15.4 31.6 Z" fill="url(#g)" stroke="#23305a" stroke-width="2" stroke-linejoin="round"/><rect x="29" y="29.6" width="6" height="5.6" rx="1.2" fill="#fff1a8" stroke="#23305a" stroke-width="1.8"/>
    <path d="M13.5 12 Q32 25.5 50.5 12 L46.5 4.5 Q32 15 17.5 4.5 Z" fill="url(#g)" ${GEAR_OL}/><path d="M19 8.5 Q25 12.5 29 13.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>
    <circle cx="32" cy="15.5" r="4.2" fill="#5ad0ff" stroke="#23305a" stroke-width="2"/><circle cx="30.8" cy="14.3" r="1.3" fill="#fff"/>`,
  plate: `<defs>${grad('p', ['#f7fafd', '#c4d0de', '#7d8fa8'], 1, 0)}${grad('g', GOLD)}</defs>
    <path d="M3.5 21 Q5 8.5 18 7.5 L23.5 15 Q12 16 9 27 Z" fill="url(#p)" ${GEAR_OL}/><path d="M60.5 21 Q59 8.5 46 7.5 L40.5 15 Q52 16 55 27 Z" fill="url(#p)" ${GEAR_OL}/>
    <path d="M14 14 L24 7 Q32 13 40 7 L50 14 L49 32 L49 56 Q32 63 15 56 L15 32 Z" fill="url(#p)" ${GEAR_OL}/>
    <path d="M23.5 8 Q32 15 40.5 8" fill="none" stroke="#23305a" stroke-width="5" stroke-linecap="round"/><path d="M23.5 8 Q32 15 40.5 8" fill="none" stroke="#ffc83a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M32 15 V59" stroke="#7d8fa8" stroke-width="2.5"/><path d="M30.4 16 V58" stroke="#fff" stroke-width="1.2" opacity=".7"/>
    <path d="M16 39 Q32 45 48 39 M16 48 Q32 54 48 48" fill="none" stroke="#5f7290" stroke-width="2.2" stroke-linecap="round"/>
    <g fill="#5f7290"><circle cx="20" cy="20" r="1.9"/><circle cx="44" cy="20" r="1.9"/><circle cx="19.5" cy="52" r="1.9"/><circle cx="44.5" cy="52" r="1.9"/><circle cx="9" cy="17" r="1.6"/><circle cx="55" cy="17" r="1.6"/></g>
    <polygon points="${starPts(32, 27, 6, 2.6)}" fill="url(#g)" stroke="#23305a" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M19 18 Q17.5 28 18.5 35" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/><path d="M7 19 Q8 13 13 11" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`,
  vest: `<defs>${grad('l', ['#e09a5c', '#b8733e', '#814720'], 1, 0)}</defs>
    <path d="M13 15 Q14 6 23 6 Q27 2.5 32 6.5 Q37 2.5 41 6 Q50 6 51 15 Z" fill="#f6e7c8" ${GEAR_OL}/><path d="M18 9 Q21 7 24 8 M40 8 Q43 7 46 9" fill="none" stroke="#d9c39a" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M14 14 L25 7 L29 24 L29 59 Q20 61 11 58 L11 34 L6 31 Z" fill="url(#l)" ${GEAR_OL}/><path d="M50 14 L39 7 L35 24 L35 59 Q44 61 53 58 L53 34 L58 31 Z" fill="url(#l)" ${GEAR_OL}/>
    <path d="M16 20 V55 M48 20 V55" stroke="#f1d39a" stroke-width="1.4" stroke-dasharray="2.6 2.6" opacity=".95"/>
    <path d="M29 30 L35 34 M35 30 L29 34 M29 39 L35 43 M35 39 L29 43 M29 48 L35 52 M35 48 L29 52" stroke="#23305a" stroke-width="4" stroke-linecap="round"/><path d="M29 30 L35 34 M35 30 L29 34 M29 39 L35 43 M35 39 L29 43 M29 48 L35 52 M35 48 L29 52" stroke="#f6dfa8" stroke-width="2" stroke-linecap="round"/>
    <rect x="38" y="40" width="11" height="10" rx="2" fill="#8a4f24" stroke="#5a2f12" stroke-width="1.8"/><path d="M38 40 H49 V43.5 Q43.5 47 38 43.5 Z" fill="#a8622c" stroke="#5a2f12" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="22" cy="34" r="2.2" fill="#ffc83a" stroke="#23305a" stroke-width="1.5"/><circle cx="22" cy="45" r="2.2" fill="#ffc83a" stroke="#23305a" stroke-width="1.5"/>
    <path d="M14.5 19 L12.5 32" stroke="#f3bd88" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`,
  goldRing: ringArt(GOLD, ['#c8ecff', '#4fb6ff', '#1f63c8']),
  silverRing: ringArt(['#ffffff', '#dfe7f1', '#93a2b7'], ['#efe0ff', '#b46bff', '#6f2fcc']),
  rubyRing: ringArt(GOLD, ['#ffc6cf', '#ff3d5e', '#ad0f2b']),
  skull: `<defs>${grad('k', ['#ffffff', '#f4f1e8', '#c9c0a8'], 1, 1)}</defs>${chainArt}${bail(32)}
    <path d="M16.5 42 a15.5 15.5 0 1 1 31 0 q0 7 -5 9.5 v6.5 h-21 v-6.5 q-5 -2.5 -5 -9.5 Z" fill="url(#k)" ${GEAR_OL}/>
    <circle cx="25.5" cy="42" r="4.8" fill="#23305a"/><circle cx="38.5" cy="42" r="4.8" fill="#23305a"/><circle cx="24" cy="40.5" r="1.4" fill="#ff5f7a"/><circle cx="37" cy="40.5" r="1.4" fill="#ff5f7a"/>
    <path d="M32 47 l-2.6 3.8 h5.2 Z" fill="#23305a"/><path d="M27 58 v-4.5 M32 58 v-4.5 M37 58 v-4.5" stroke="#23305a" stroke-width="1.8"/>
    <path d="M21 35 Q24 29.5 30 28.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/>`,
  moon: `<defs>${grad('o', ['#fff6c0', '#ffe066', '#f0a818'], 1, 1)}</defs>${chainArt}${bail(39)}
    <path d="M39 25.5 A17.5 17.5 0 1 0 39 60.5 A21.5 21.5 0 0 1 39 25.5 Z" fill="url(#o)" ${GEAR_OL}/>
    <path d="M27 35 A13 13 0 0 0 28 51" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
    <circle cx="28" cy="46" r="1.8" fill="#e8b23a"/><circle cx="31" cy="39" r="1.3" fill="#e8b23a"/>
    <polygon points="${starPts(50, 44, 6.5, 2.8)}" fill="#fff6c0" stroke="#23305a" stroke-width="1.8" stroke-linejoin="round"/><polygon points="${starPts(53, 31, 4, 1.8)}" fill="#fff6c0" stroke="#23305a" stroke-width="1.5" stroke-linejoin="round"/>`,
  clover: `<defs>${grad('c', ['#8cf5a4', '#3fd06a', '#1f9a44'], 1, 1)}</defs>${chainArt}${bail(32)}
    <path d="M34 50 Q38 58 47 60" fill="none" stroke="#23305a" stroke-width="6" stroke-linecap="round"/><path d="M34 50 Q38 58 47 60" fill="none" stroke="#3fd06a" stroke-width="2.6" stroke-linecap="round"/>
    <g stroke="#23305a" stroke-width="6" fill="#3fd06a"><circle cx="25" cy="35.5" r="8"/><circle cx="39" cy="35.5" r="8"/><circle cx="25" cy="49" r="8"/><circle cx="39" cy="49" r="8"/></g>
    <g fill="url(#c)"><circle cx="25" cy="35.5" r="8"/><circle cx="39" cy="35.5" r="8"/><circle cx="25" cy="49" r="8"/><circle cx="39" cy="49" r="8"/><circle cx="32" cy="42.2" r="6"/></g>
    <path d="M32 42.2 L22.5 33 M32 42.2 L41.5 33 M32 42.2 L22.5 51.5 M32 42.2 L41.5 51.5" stroke="#1f9a44" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M20 32 Q22.5 29 26 30 M34 32 Q36.5 29 40 30" fill="none" stroke="#d6ffe0" stroke-width="1.8" stroke-linecap="round"/>`,
  scroll: `<defs>${grad('p', ['#fff8e2', '#fbe7b8', '#e6c487'])}${grad('o', ['#f8dc9e', '#e0b064', '#b9813a'], 1, 0)}</defs>
    <rect x="12" y="11" width="40" height="38" rx="3" fill="url(#p)" ${GEAR_OL}/><path d="M19 20 H45 M19 26.5 H45 M19 33 H45 M19 39.5 H37" stroke="#c9a46a" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="3" y="7" width="12.5" height="46" rx="6.25" fill="url(#o)" ${GEAR_OL}/><rect x="48.5" y="7" width="12.5" height="46" rx="6.25" fill="url(#o)" ${GEAR_OL}/>
    <path d="M6.5 12 V48 M52 12 V48" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
    <path d="M27 46 V62 L32 57.5 L37 62 V46" fill="#ff4d6d" stroke="#23305a" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="32" cy="47" r="7.2" fill="#e8283c" ${GEAR_OL}/><circle cx="32" cy="47" r="4" fill="none" stroke="#ff8a98" stroke-width="1.5"/><circle cx="30" cy="45" r="1.3" fill="#fff" opacity=".85"/>`,
  atk: `<g transform="rotate(45 32 32)"><path d="M32 3 L39 10 L39 40 L25 40 L25 10 Z" fill="#eef4fb" ${GEAR_OL}/><rect x="15" y="39" width="34" height="8" rx="4" fill="#ffc83a" ${GEAR_OL}/><rect x="28" y="47" width="8" height="12" rx="2" fill="#9a5b2c" ${GEAR_OL}/></g>`,
  heart: `<path d="M32 56 C10 42 6 30 10 21 C14 12 27 11 32 21 C37 11 50 12 54 21 C58 30 54 42 32 56 Z" fill="#ff4d6d" ${GEAR_OL}/><path d="M16 22 Q19 17 24 18" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`,
};
// slot badges: white glyphs on a dark disc
const SLOT_SVG = {
  weapon: '<g transform="rotate(45 12 12)"><path d="M12 2 L14.5 5 V15 H9.5 V5 Z M6.5 15 H17.5 V17.5 H6.5 Z M10.8 17.5 H13.2 V22 H10.8 Z" fill="#fff"/></g>',
  armor: '<path d="M4 7 L9 3.5 Q12 6 15 3.5 L20 7 L18.5 11.5 L17 11 V20.5 H7 V11 L5.5 11.5 Z" fill="#fff"/>',
  ring: '<circle cx="12" cy="14" r="6" fill="none" stroke="#fff" stroke-width="3"/><path d="M9 6 L10.5 3 H13.5 L15 6 L12 9 Z" fill="#fff"/>',
  necklace: '<path d="M4 3 Q12 15 20 3" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 10 L16 15 L12 21 L8 15 Z" fill="#fff"/>',
};
// the scroll chest: shaded wood planks with grain, gold bands and rivets, a keyhole lock and a gem on the lid. Opening
// it (CSS: .chest-stage.open) flips the lid up and lights the inside. Its ids are prefixed, as it is also inlined
const CHEST_SVG = svgDoc(`<defs>${grad('chxW', ['#d9935a', '#b8733e', '#874d22'])}${grad('chxL', ['#eaa86a', '#c98446', '#9c5c2a'])}${grad('chxG', GOLD)}${glowGrad('chxI', '#fff6c0', '#ffb52a', 1)}</defs>
  <g class="ch-base"><ellipse cx="60" cy="103" rx="52" ry="6" fill="#0b2a5c" opacity=".22"/>
  <ellipse class="ch-glow" cx="60" cy="50" rx="48" ry="16" fill="url(#chxI)"/>
  <rect x="10" y="50" width="100" height="52" rx="9" fill="url(#chxW)" stroke="#23305a" stroke-width="5" stroke-linejoin="round"/>
  <rect x="13" y="91" width="94" height="8" rx="4" fill="#000" opacity=".12"/><rect x="13" y="52.5" width="94" height="5" rx="2" fill="#5a2c10" opacity=".45"/>
  <path d="M15 67 H105 M15 84 H105" stroke="#7a4420" stroke-width="2.5" stroke-linecap="round" opacity=".7"/>
  <path d="M40 61 q7 -2.5 13 0 M66 75 q8 2.5 14 0 M42 93 q6 -2 11 0 M70 60 q5 -1.5 9 0" fill="none" stroke="#9a5a2c" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>
  <rect x="22" y="50" width="11" height="52" fill="url(#chxG)" stroke="#23305a" stroke-width="3"/><rect x="87" y="50" width="11" height="52" fill="url(#chxG)" stroke="#23305a" stroke-width="3"/>
  <path d="M25 54 V98 M90 54 V98" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
  <g fill="#b56d08" stroke="#23305a" stroke-width="1.2"><circle cx="27.5" cy="60" r="2.2"/><circle cx="27.5" cy="93" r="2.2"/><circle cx="92.5" cy="60" r="2.2"/><circle cx="92.5" cy="93" r="2.2"/></g>
  <path d="M48 54 H72 V72 Q72 80 60 84 Q48 80 48 72 Z" fill="url(#chxG)" stroke="#23305a" stroke-width="3" stroke-linejoin="round"/>
  <path d="M51.5 57.5 V71" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
  <circle cx="60" cy="64" r="3.8" fill="#23305a"/><path d="M58.3 66 H61.7 L62.8 74 H57.2 Z" fill="#23305a"/></g>
  <g class="ch-lid"><path d="M10 54 V40 Q10 12 60 12 Q110 12 110 40 V54 Z" fill="url(#chxL)" stroke="#23305a" stroke-width="5" stroke-linejoin="round"/>
  <path d="M46 54 V13.5 M74 54 V13.5" stroke="#7a4420" stroke-width="2" opacity=".55"/>
  <path d="M22 54 V20.5 Q27 17.5 33 16 V54 Z M87 54 V16 Q93 17.5 98 20.5 V54 Z" fill="url(#chxG)" stroke="#23305a" stroke-width="3" stroke-linejoin="round"/>
  <path d="M21 30 Q31 19.5 52 17.5" stroke="#f6c896" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/><path d="M58 17 H66" stroke="#f6c896" stroke-width="3" stroke-linecap="round" opacity=".7"/>
  <circle cx="60" cy="31" r="5.5" fill="#ff3d5e" stroke="#23305a" stroke-width="2.5"/><circle cx="58.3" cy="29.3" r="1.6" fill="#fff"/>
  <rect x="7" y="46" width="106" height="11" rx="4" fill="url(#chxG)" stroke="#23305a" stroke-width="3"/><path d="M12 49 H54" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
  <g fill="#b56d08"><circle cx="16" cy="51.5" r="1.8"/><circle cx="40" cy="51.5" r="1.8"/><circle cx="80" cy="51.5" r="1.8"/><circle cx="104" cy="51.5" r="1.8"/></g></g>`, '0 0 120 110');
const GEAR_URL = {};
const gearIcon = id => GEAR_URL[id] || (GEAR_URL[id] = svgUrl(svgDoc(GEAR_SVG[id])));
const slotIcon = id => GEAR_URL['slot-' + id] || (GEAR_URL['slot-' + id] = svgUrl(svgDoc(SLOT_SVG[id], '0 0 24 24')));

// ---------- inventory logic (G.save.gear = { items: { 'wand:2': count }, eq: { slot: key } }) ----------
function gearStats(sv = G.save) {
  const out = {};
  const add = st => { if (st) for (const k in st) out[k] = (out[k] || 0) + st[k]; };
  const skin = SKINS.find(s => s.id === sv.skin) || {};
  add(skin.boost);
  // this color's own level: every level adds all three of its stats
  const lv = blobLevel(sv, sv.skin);
  if (lv) for (const [k, per] of blobUps(skin)) add({ [k]: per * lv });
  add((COSTUMES.find(c => c.id === sv.costume) || {}).boost);
  add((COSTUMES.find(c => c.id === sv.hat) || {}).boost);
  const g = sv.gear;
  if (g) for (const sl in g.eq) { const k = g.eq[sl]; if (k && g.items[k] > 0 && ARTIFACTS[artParse(k).id]) add(artStats(k)); }
  return out;
}
// the attack and health numbers shown on the inventory screen
function gearTotals(sv = G.save) {
  const g = gearStats(sv);
  return { atk: Math.round(100 * (1 + (g.dmg || 0) / 100)), hp: Math.round(140 * (1 + (g.hp || 0) / 100)) };
}
function rollArtifact() {
  const ids = Object.keys(ARTIFACTS), id = ids[Math.floor(Math.random() * ids.length)];
  let r = 0, x = Math.random();
  for (; r < LEGEND; r++) { if ((x -= RARITIES[r].odds) < 0) break; }
  return artKey(id, r);
}
function addArtifact(key, n = 1) { const it = G.save.gear.items; it[key] = (it[key] || 0) + n; }
// two of one artifact and rarity become one of the next rarity, up to Legendary; four of the same
// Legendary become a Mythic. An equipped copy moves up with it.
const FUSE_N = 2, MYTHIC_N = 4;
const fuseNeed = r => (r === LEGEND ? MYTHIC_N : FUSE_N);
function fuseArtifact(key) {
  const g = G.save.gear, { id, r } = artParse(key);
  if (r >= MYTHIC || (g.items[key] || 0) < fuseNeed(r)) return null;
  g.items[key] -= fuseNeed(r);
  if (!g.items[key]) delete g.items[key];
  const next = artKey(id, r + 1);
  addArtifact(next);
  G.save.stats.fuses = (G.save.stats.fuses || 0) + 1;
  for (const sl in g.eq) if (g.eq[sl] === key && !g.items[key]) g.eq[sl] = next;
  return next;
}
const canFuse = () => Object.keys(G.save.gear.items).some(k => G.save.gear.items[k] >= FUSE_N && artParse(k).r < LEGEND);
const canMythic = () => Object.keys(G.save.gear.items).some(k => G.save.gear.items[k] >= MYTHIC_N && artParse(k).r === LEGEND);
// fuse everything that can be fused, over and over (fused results can fuse again); returns what was made
function fuseAll() {
  const made = [];
  for (let guard = 0; guard < 500; guard++) {
    const k = Object.keys(G.save.gear.items).sort((a, b) => artParse(a).r - artParse(b).r).find(k => G.save.gear.items[k] >= fuseNeed(artParse(k).r) && artParse(k).r < MYTHIC);
    if (!k) break;
    made.push(fuseArtifact(k));
  }
  // only the final results: drop ones that were fused again on the way up
  const left = {};
  for (const k of made) left[k] = Math.min((left[k] || 0) + 1, G.save.gear.items[k] || 0);
  return Object.keys(left).filter(k => left[k] > 0).flatMap(k => Array(left[k]).fill(k)).sort((a, b) => artParse(b).r - artParse(a).r);
}
// stat icons for the tooltips and stat lines: a colored glyph per stat, no words
const STAT_SVG = {
  dmg: ['#ff5f6d', '<g transform="rotate(45 12 12)"><path d="M12 1.5 L14.6 4.5 V14.5 H9.4 V4.5 Z M6 14.5 H18 V17.2 H6 Z M10.7 17.2 H13.3 V22.5 H10.7 Z"/></g>'],
  hp: ['#ff4d6d', '<path d="M12 21 C3.5 15.5 1.5 10.5 3.5 6.8 C5.4 3.3 10 3.4 12 7.2 C14 3.4 18.6 3.3 20.5 6.8 C22.5 10.5 20.5 15.5 12 21 Z"/>'],
  armor: ['#4f8fff', '<path d="M12 2 L20.5 5.2 V11.5 C20.5 16.6 16.8 20.3 12 22 C7.2 20.3 3.5 16.6 3.5 11.5 V5.2 Z"/>'],
  speed: ['#22c98a', '<path d="M3 5 H11 L16.5 12 L11 19 H3 L8.5 12 Z M10.5 5 H14.5 L20 12 L14.5 19 H10.5 L16 12 Z"/>'],
  cd: ['#9c6bff', '<path d="M6 2 H18 V4 H16.8 C16.8 8 14.3 10 13.3 12 C14.3 14 16.8 16 16.8 20 H18 V22 H6 V20 H7.2 C7.2 16 9.7 14 10.7 12 C9.7 10 7.2 8 7.2 4 H6 Z"/>'],
  area: ['#ff8a1f', '<circle cx="12" cy="12" r="3.6"/><path d="M12 3.2 A8.8 8.8 0 1 1 3.2 12 A8.8 8.8 0 0 1 12 3.2 Z M12 5.6 A6.4 6.4 0 1 0 18.4 12 A6.4 6.4 0 0 0 12 5.6 Z" fill-rule="evenodd"/>'],
  xp: ['#21b5ff', '<path d="M12 1.8 L14.9 8.3 L22 9 L16.6 13.7 L18.2 20.7 L12 17 L5.8 20.7 L7.4 13.7 L2 9 L9.1 8.3 Z"/>'],
  regen: ['#3fc85a', '<path d="M9 3 H15 V9 H21 V15 H15 V21 H9 V15 H3 V9 H9 Z"/>'],
  magnet: ['#ff3b6b', '<path d="M4 3 H9.5 V12 A2.5 2.5 0 0 0 14.5 12 V3 H20 V12 A8 8 0 0 1 4 12 Z"/><path d="M4 3 H9.5 V6.5 H4 Z M14.5 3 H20 V6.5 H14.5 Z" fill="#fff" opacity=".85"/>'],
  gold: ['#f5b400', '<circle cx="12" cy="12" r="9.5"/><path d="M12 6 V18 M9.5 8.5 H13.5 A2 2 0 0 1 13.5 12 H10.5 A2 2 0 0 0 10.5 15.5 H14.5" fill="none" stroke="#fff3c0" stroke-width="2" stroke-linecap="round"/>'],
};
const statIcon = k => `<svg class="sti" viewBox="0 0 24 24" fill="${STAT_SVG[k][0]}" aria-hidden="true">${STAT_SVG[k][1]}</svg>`;
const statChips = st => Object.keys(st).map(k => `<span class="chip">${statIcon(k)}+${+st[k].toFixed(st[k] < 1 ? 2 : 1)}%</span>`).join('');
// what an artifact sells for, by rarity (small on purpose)
const SELL_PRICE = [5, 12, 30, 60, 120, 300];
// can any of the worn color's upgrades be bought right now?
function blobUpAffordable(sv = G.save) {
  const lv = blobLevel(sv, sv.skin);
  return lv < BLOB_UP_MAX && sv.coins >= blobUpCost(lv);
}
const fmtBoost = st => Object.keys(st || {}).map(k => `+${+st[k].toFixed(2)}% ${STAT_INFO[k].short}`).join(' ');

// ---------- screens ----------
Object.assign(UI, {
  gearSort: 'rarity', artKeyOpen: null, chestBusy: false, fuseSel: [], fuseMade: null, fuseMode: 'fuse',

  initGear() {
    ICONS.map.gear = svgUrl(CHEST_SVG); ICONS.map.scroll = gearIcon('scroll'); ICONS.map['g-atk'] = gearIcon('atk'); ICONS.map['g-heart'] = gearIcon('heart');
    $('gSort').addEventListener('click', () => { this.gearSort = this.gearSort === 'rarity' ? 'slot' : 'rarity'; AUDIO.play('click'); this.renderGear(); });
    $('gChest').addEventListener('click', () => { AUDIO.play('click'); this.openScrollChest(); });
    $('gFuse').addEventListener('click', () => { AUDIO.play('click'); this.openFuse(null, 'fuse'); });
    $('gMythic').addEventListener('click', () => { AUDIO.play('click'); this.openFuse(null, 'mythic'); });
    $('gUpgrade').addEventListener('click', () => { AUDIO.play('click'); this.openBlobUp(); });
    $('buClose').addEventListener('click', () => { AUDIO.play('click'); this.show('blobUp', false); this.renderGear(); });
    $('gSell').addEventListener('click', () => { AUDIO.play('click'); this.selling = !this.selling; this.renderGear(); });
    $('fuseRow').addEventListener('click', e => {
      const b = e.target.closest('.fslot[data-i]');
      if (!b) return;
      const i = Number(b.dataset.i);
      if (i < this.fuseSel.length) { this.fuseSel.splice(i, 1); AUDIO.play('click'); this.renderFuse(); }
    });
    $('fuseGo').addEventListener('click', () => this.fuseGo());
    $('fuseAll').addEventListener('click', () => this.fuseEverything());
    $('fuseClose').addEventListener('click', () => { AUDIO.play('click'); this.show('fuseBox', false); this.renderGear(); });
    document.querySelectorAll('#gearStage .eq').forEach(b => {
      const open = e => { e.preventDefault(); const k = G.save.gear.eq[b.dataset.slot]; AUDIO.play('click'); if (k) this.openArtifact(k); };
      b.addEventListener('click', open); b.addEventListener('contextmenu', open);
    });
    // the eye under each slot hides that piece on the blob (its stats still count)
    document.querySelectorAll('#gearStage .eye').forEach(b => b.addEventListener('click', () => {
      const h = G.save.gear.hidden = G.save.gear.hidden || {}, sl = b.dataset.slot;
      h[sl] = !h[sl]; saveGame(); AUDIO.play('click'); G.hero.impulse(1.2); this.renderGear();
    }));
    $('artEquip').addEventListener('click', () => this.equipToggle());
    $('artFuse').addEventListener('click', () => { AUDIO.play('click'); this.show('artInfo', false); this.openFuse(this.artKeyOpen, artParse(this.artKeyOpen).r === LEGEND ? 'mythic' : 'fuse'); });
    $('artClose').addEventListener('click', () => { AUDIO.play('click'); this.show('artInfo', false); });
    $('scOpen').addEventListener('click', () => this.crackChest(1));
    $('scAll').addEventListener('click', () => this.crackChest(G.save.scrolls || 0));
    $('scDone').addEventListener('click', () => { AUDIO.play('click'); this.show('scrollChest', false); this.renderGear(); });
    $('chestArt').innerHTML = CHEST_SVG;
    // hovering any artifact shows a tiny tip: its stats as icons and percents, nothing else
    const tip = $('artTip');
    document.addEventListener('pointerover', e => {
      const el = e.pointerType === 'mouse' && e.target.closest && e.target.closest('[data-art]');
      if (!el) { tip.hidden = true; return; }
      tip.innerHTML = statChips(artStats(el.dataset.art)); tip.className = 'art-tip r' + artParse(el.dataset.art).r; tip.hidden = false;
    });
    document.addEventListener('pointermove', e => {
      if (tip.hidden) return;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = Math.min(innerWidth - w - 6, e.clientX + 14) + 'px';
      tip.style.top = Math.max(6, e.clientY - h - 10) + 'px';
    });
  },

  artButton(k, count, extra = '') {
    const { id, r, def } = artParse(k), b = document.createElement('button');
    b.className = `art r${r}${extra}`;
    b.dataset.art = k;
    b.innerHTML = `<i class="badge"><img alt="" src="${slotIcon(def.slot)}"></i><img alt="" src="${gearIcon(id)}">${count != null ? `<b>${count}</b>` : ''}`;
    b.setAttribute('aria-label', `${RARITIES[r].name} ${def.name}`);
    return b;
  },
  renderGear() {
    const sv = G.save, g = sv.gear, hid = g.hidden || {};
    G.hero.setGear(g);
    const tot = gearTotals();
    $('gAtk').textContent = fmtNum(tot.atk); $('gHp').textContent = fmtNum(tot.hp);
    $('gScrolls').textContent = fmtNum(sv.scrolls || 0);
    $('gChest').classList.toggle('glow', (sv.scrolls || 0) > 0);
    $('gSort').textContent = this.gearSort === 'rarity' ? 'RARITY' : 'SLOT';
    $('gFuse').classList.toggle('glow', canFuse());
    $('gMythic').classList.toggle('glow', canMythic());
    document.querySelectorAll('#gearStage .eq').forEach(b => {
      const k = g.eq[b.dataset.slot];
      b.className = 'eq' + (k ? ' art r' + artParse(k).r : '');
      if (k) b.dataset.art = k; else delete b.dataset.art;
      b.innerHTML = k ? `<img alt="" src="${gearIcon(artParse(k).id)}">` : `<img alt="" class="ghost" src="${slotIcon(b.dataset.slot)}">`;
      b.setAttribute('aria-label', k ? `${RARITIES[artParse(k).r].name} ${artParse(k).def.name}` : `Empty ${b.dataset.slot} slot`);
    });
    document.querySelectorAll('#gearStage .eye').forEach(b => {
      const off = !!hid[b.dataset.slot];
      b.classList.toggle('off', off); b.hidden = !g.eq[b.dataset.slot];
      b.innerHTML = off ? EYE_OFF : EYE_ON;
      b.setAttribute('aria-label', (off ? 'Show ' : 'Hide ') + b.dataset.slot);
    });
    $('gearGrid').replaceChildren(...this.stagger(this.sortedArtKeys().map(k => {
      const { r, def } = artParse(k), worn = g.eq[def.slot] === k;
      const b = this.artButton(k, g.items[k], `${worn ? ' worn' : ''}${g.items[k] >= fuseNeed(r) && r < MYTHIC ? ' fusable' : ''}`);
      // in sell mode a tap sells one copy (the price shows on each item)
      if (this.selling) { const p = document.createElement('span'); p.className = 'price'; p.textContent = SELL_PRICE[r]; b.append(p); }
      b.addEventListener('click', () => { if (this.selling) { AUDIO.play('click'); this.sellOne(k); } else this.equipArt(k); });
      // a right click (or a long press) opens the item's card: its stats, unequip, fuse
      b.addEventListener('contextmenu', e => { e.preventDefault(); AUDIO.play('click'); this.openArtifact(k); });
      return b;
    })));
    $('gearGrid').classList.toggle('selling', !!this.selling);
    $('gSell').textContent = this.selling ? 'DONE' : 'SELL'; $('gSellHint').hidden = !this.selling;
    $('gUpgrade').querySelector('.dot').hidden = !blobUpAffordable();
  },
  // sell one copy of an artifact (an equipped last copy comes off first)
  sellOne(k) {
    const g = G.save.gear, { r, def } = artParse(k);
    if (!(g.items[k] > 0)) return;
    g.items[k]--;
    if (g.items[k] <= 0) { delete g.items[k]; if (g.eq[def.slot] === k) g.eq[def.slot] = null; }
    G.save.coins += SELL_PRICE[r];
    saveGame(); AUDIO.play('coin');
    this.toast(`Sold ${RARITIES[r].name} ${def.name} for ${SELL_PRICE[r]} coins`);
    this.syncCoins();
    this.renderGear();
  },
  // ---------- the blob's own upgrades (Gear > Upgrade) ----------
  openBlobUp() { this.renderBlobUp(); this.show('blobUp', true); },
  // the color's one level: what each of its three stats gives now and per level, and one button to level up
  renderBlobUp() {
    const sv = G.save, skin = SKINS.find(s => s.id === sv.skin) || SKINS[0];
    sv.blobLv = sv.blobLv || {};
    const lvl = blobLevel(sv, sv.skin), cost = blobUpCost(lvl), maxed = lvl >= BLOB_UP_MAX;
    $('buTitle').textContent = skin.name.toUpperCase();
    this.syncCoins();
    const head = document.createElement('div');
    head.className = 'panel bu-level';
    head.innerHTML = `<b></b><span class="bu-pips"></span>`;
    head.querySelector('b').textContent = `Level ${lvl} / ${BLOB_UP_MAX}`;
    head.querySelector('.bu-pips').innerHTML = Array.from({ length: BLOB_UP_MAX }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
    const rows = blobUps(skin).map(([k, per]) => {
      const row = document.createElement('div');
      row.className = 'panel bu-row';
      row.innerHTML = `<span class="ic"></span><span><span class="nm"></span><span class="ds"></span></span><em></em>`;
      // the short label is sized to fill its tile without spilling out (MAGNET is twice as long as HP)
      const ic = row.querySelector('.ic'), sh = STAT_INFO[k].short;
      ic.textContent = sh; ic.style.fontSize = Math.min(17, Math.floor(54 / (sh.length * 0.75))) + 'px';
      row.querySelector('.nm').textContent = STAT_INFO[k].name.replace(/^./, c => c.toUpperCase());
      row.querySelector('.ds').textContent = `+${per}% a level`;
      row.querySelector('em').textContent = `+${+(per * lvl).toFixed(2)}%`;
      return row;
    });
    const b = document.createElement('button');
    b.className = 'jelly gold bu-go';
    if (maxed) { b.textContent = 'MAX LEVEL'; b.disabled = true; }
    else {
      b.innerHTML = `LEVEL UP · <i class="coin"></i><span></span>`; b.querySelector('span').textContent = fmtNum(cost);
      b.disabled = sv.coins < cost;
      b.addEventListener('click', () => {
        const now = blobLevel(sv, sv.skin);
        if (sv.coins < blobUpCost(now) || now >= BLOB_UP_MAX) return;
        sv.coins -= blobUpCost(now); sv.blobLv[sv.skin] = now + 1; saveGame();
        AUDIO.play('levelup'); G.hero.impulse(1.8);
        this.renderBlobUp(); this.refreshBadges && this.refreshBadges();
      });
    }
    $('buList').replaceChildren(head, ...rows, b);
  },
  sortedArtKeys() {
    const g = G.save.gear, slotOrder = GEAR_SLOTS.map(s => s.id), ids = Object.keys(ARTIFACTS);
    const keys = Object.keys(g.items).filter(k => g.items[k] > 0 && ARTIFACTS[artParse(k).id]);
    return keys.sort((a, b) => {
      const A = artParse(a), B = artParse(b);
      const bySlot = slotOrder.indexOf(A.def.slot) - slotOrder.indexOf(B.def.slot), byR = B.r - A.r;
      return (this.gearSort === 'rarity' ? byR || bySlot : bySlot || byR) || ids.indexOf(A.id) - ids.indexOf(B.id);
    });
  },

  openArtifact(key) {
    const g = G.save.gear, { id, r, def } = artParse(key), n = g.items[key] || 0;
    this.artKeyOpen = key;
    $('artBig').className = 'art-big art r' + r;
    $('artBig').innerHTML = `<img alt="" src="${gearIcon(id)}"><b>${n}</b>`;
    $('artRar').textContent = RARITIES[r].name;
    $('artRar').className = 'eyebrow rar r' + r;
    $('artName').textContent = def.name;
    $('artStat').innerHTML = statChips(artStats(key));
    const worn = g.eq[def.slot] === key;
    $('artEquip').textContent = worn ? 'Unequip' : 'Equip';
    $('artEquip').className = worn ? 'jelly ghost' : 'jelly';
    $('artFuse').hidden = r >= MYTHIC;
    $('artFuse').textContent = r === LEGEND ? 'Mythic' : 'Fuse';
    $('artFuse').className = r === LEGEND ? 'jelly mythic' : 'jelly violet';
    this.show('artInfo', true);
  },
  // a left click on an item in the grid puts it on, in place of whatever was in its slot (one already worn just
  // makes the blob hop); a right click opens its card
  equipArt(key) {
    const g = G.save.gear;
    if (!(g.items[key] > 0)) return;
    const slot = artParse(key).def.slot;
    if (g.eq[slot] === key) { AUDIO.play('click'); G.hero.impulse(1.2); return; }
    g.eq[slot] = key;
    saveGame(); AUDIO.play('levelup'); G.hero.impulse(1.6);
    this.renderGear();
  },
  equipToggle() {
    const g = G.save.gear, key = this.artKeyOpen;
    if (!key || !(g.items[key] > 0)) return;
    const slot = artParse(key).def.slot;
    g.eq[slot] = g.eq[slot] === key ? null : key;
    saveGame(); AUDIO.play(g.eq[slot] ? 'levelup' : 'click'); G.hero.impulse(1.6);
    this.renderGear(); this.openArtifact(key);
  },

  // ---------- fusing. 'fuse': two of the same artifact and rarity, up to Legendary.
  // 'mythic' (its own menu, under Fuse): four of the same Legendary make a Mythic ----------
  openFuse(prefill, mode = 'fuse') {
    this.fuseMode = mode; this.fuseSel = []; this.fuseMade = null;
    const need = mode === 'mythic' ? MYTHIC_N : FUSE_N;
    const ok = k => (mode === 'mythic' ? artParse(k).r === LEGEND : artParse(k).r < LEGEND);
    if (prefill && ok(prefill)) for (let i = 0; i < Math.min(need, G.save.gear.items[prefill] || 0); i++) this.fuseSel.push(prefill);
    const box = $('fuseBox');
    box.classList.toggle('mythic', mode === 'mythic');
    $('fuseTitle').textContent = mode === 'mythic' ? 'MYTHIC' : 'FUSE';
    $('fuseRow').innerHTML = Array.from({ length: need }, (_, i) => `<button class="fslot" data-i="${i}"></button>`).join('') + '<span class="fuse-arrow" aria-hidden="true">➜</span><div class="fslot result" id="fuseResult"></div>';
    this.show('fuseBox', true);
    this.renderFuse();
  },
  renderFuse() {
    const g = G.save.gear, sel = this.fuseSel, key = sel[0], mythic = this.fuseMode === 'mythic', need = mythic ? MYTHIC_N : FUSE_N;
    document.querySelectorAll('#fuseRow .fslot[data-i]').forEach((b, i) => {
      const k = sel[i];
      b.className = 'fslot' + (k ? ' art r' + artParse(k).r : '');
      b.innerHTML = k ? `<img alt="" src="${gearIcon(artParse(k).id)}">` : '<span>+</span>';
    });
    const res = $('fuseResult'), show = key || this.fuseMade;
    if (show) {
      const { id, r } = artParse(show), rr = key ? r + 1 : r;
      res.className = `fslot result art r${rr}${key && sel.length < need ? ' faint' : ''}${!key ? ' made' : ''}`;
      res.innerHTML = `<img alt="" src="${gearIcon(id)}">`;
      res.dataset.art = artKey(id, rr);
    } else { res.className = 'fslot result'; res.innerHTML = '<span>?</span>'; delete res.dataset.art; }
    // no words: the result's stats as chips, or the items Fuse all made
    const hint = $('fuseHint');
    if (this.fuseAllMade && this.fuseAllMade.length) hint.replaceChildren(...this.fuseAllMade.map(k => this.artButton(k, null, ' mini')));
    else if (show) { const { id, r } = artParse(show); hint.innerHTML = statChips(artStats(artKey(id, key ? r + 1 : r))); }
    else hint.innerHTML = '';
    $('fuseGrid').replaceChildren(...this.sortedArtKeys().filter(k => (mythic ? artParse(k).r === LEGEND : artParse(k).r < LEGEND)).map(k => {
      const left = g.items[k] - sel.filter(x => x === k).length;
      const b = this.artButton(k, left);
      b.disabled = left <= 0 || sel.length >= need || (key && k !== key);
      b.addEventListener('click', () => { this.fuseMade = null; this.fuseAllMade = null; this.fuseSel.push(k); AUDIO.play('pop'); this.renderFuse(); });
      return b;
    }));
    $('fuseGo').disabled = sel.length < need;
    $('fuseAll').disabled = !(canFuse() || canMythic());
  },
  fuseGo() {
    const sel = this.fuseSel, need = this.fuseMode === 'mythic' ? MYTHIC_N : FUSE_N;
    if (sel.length < need || sel.some(k => k !== sel[0])) return;
    const made = fuseArtifact(sel[0]);
    if (!made) return;
    saveGame(); AUDIO.play(artParse(made).r >= MYTHIC ? 'win' : 'chest'); G.hero.impulse(2);
    this.fuseSel = []; this.fuseMade = made; this.fuseAllMade = null;
    this.renderFuse(); this.renderGear();
  },
  fuseEverything() {
    const made = fuseAll();
    if (!made.length) return;
    saveGame(); AUDIO.play(made.some(k => artParse(k).r >= MYTHIC) ? 'win' : 'chest'); G.hero.impulse(2.4);
    this.fuseSel = []; this.fuseMade = null; this.fuseAllMade = made;
    this.renderFuse(); this.renderGear();
  },

  // ---------- scroll chest: one scroll, or every scroll at once ----------
  openScrollChest() {
    this.chestBusy = false;
    $('chestStage').className = 'chest-stage';
    $('chestReveal').hidden = true;
    this.syncChestButtons();
    this.show('scrollChest', true);
  },
  syncChestButtons() {
    const n = G.save.scrolls || 0, b = $('scOpen'), all = $('scAll');
    b.disabled = n <= 0 || this.chestBusy;
    b.innerHTML = `<img alt="" src="${gearIcon('scroll')}">1`;
    all.disabled = n <= 1 || this.chestBusy;
    all.innerHTML = `<img alt="" src="${gearIcon('scroll')}">${n > 1 ? n : 'All'}`;
  },
  crackChest(count) {
    const sv = G.save;
    count = Math.min(count, sv.scrolls || 0);
    if (this.chestBusy || count <= 0) return;
    const keys = [];
    for (let i = 0; i < count; i++) { sv.scrolls--; const k = rollArtifact(); addArtifact(k); keys.push(k); }
    keys.sort((a, b) => artParse(b).r - artParse(a).r);
    saveGame();
    this.chestBusy = true;
    const st = $('chestStage'), best = artParse(keys[0]).r;
    $('chestReveal').hidden = true;
    st.className = 'chest-stage';
    void st.offsetWidth;
    st.classList.add('shake');
    AUDIO.play('click');
    this.syncChestButtons();
    setTimeout(() => {
      st.className = 'chest-stage open r' + best + (keys.length > 1 ? ' many' : '');
      const rv = $('chestReveal');
      if (keys.length === 1) {
        const { id, r } = artParse(keys[0]);
        rv.innerHTML = `<span class="art r${r}" data-art="${keys[0]}"><img alt="" src="${gearIcon(id)}"></span><small class="rar r${r}">${RARITIES[r].name}</small><span class="chips">${statChips(artStats(keys[0]))}</span>`;
      } else {
        // many at once: a grid of what came out, best first
        const grid = document.createElement('div');
        grid.className = 'reveal-grid';
        grid.replaceChildren(...keys.map(k => this.artButton(k, null, ' mini')));
        rv.replaceChildren(grid);
      }
      rv.hidden = false;
      AUDIO.play(best >= 3 ? 'win' : 'chest');
      this.chestBusy = false;
      this.syncChestButtons();
    }, keys.length > 1 ? 1100 : 900);
  },
});
const EYE_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12 C5 6.5 8.5 4.5 12 4.5 S19 6.5 22 12 C19 17.5 15.5 19.5 12 19.5 S5 17.5 2 12 Z"/><circle cx="12" cy="12" r="3.2" fill="#fff"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12 C5 6.5 8.5 4.5 12 4.5 S19 6.5 22 12 C19 17.5 15.5 19.5 12 19.5 S5 17.5 2 12 Z" opacity=".55"/><path d="M4 20 L20 4"/></svg>';
