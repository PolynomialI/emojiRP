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
const sparkle = (x, y, s) => `<path d="M${x} ${y - s} Q${x + s * 0.2} ${y - s * 0.2} ${x + s} ${y} Q${x + s * 0.2} ${y + s * 0.2} ${x} ${y + s} Q${x - s * 0.2} ${y + s * 0.2} ${x - s} ${y} Q${x - s * 0.2} ${y - s * 0.2} ${x} ${y - s} Z" fill="#fff" stroke="#23305a" stroke-width="2" stroke-linejoin="round"/>`;
const ringArt = (band, gem) => `<circle cx="32" cy="39" r="15" fill="none" stroke="#23305a" stroke-width="12"/><circle cx="32" cy="39" r="15" fill="none" stroke="${band}" stroke-width="6"/>
  <path d="M21 33 A12 12 0 0 1 27 27" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".75"/>
  <path d="M23 18 L27.5 11 L36.5 11 L41 18 L32 29 Z" fill="${gem}" ${GEAR_OL}/>
  <path d="M23.5 18 H40.5 M27.5 11 L29.5 18 L32 28 L34.5 18 L36.5 11" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="1.5" stroke-linejoin="round"/>`;
const chainArt = `<path d="M10 5 Q32 45 54 5" fill="none" stroke="#23305a" stroke-width="5" stroke-linecap="round"/><path d="M10 5 Q32 45 54 5" fill="none" stroke="#ffd23a" stroke-width="2.4" stroke-dasharray="3 2.4" stroke-linecap="round"/>`;
const GEAR_SVG = {
  sword: `<g transform="rotate(45 32 32)"><path d="M32 2 L38 9 L38 39 L26 39 L26 9 Z" fill="#eef4fb" ${GEAR_OL}/><path d="M32 8 V36" stroke="#b9cbe0" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="17" y="38" width="30" height="7" rx="3.5" fill="#ffc83a" ${GEAR_OL}/><rect x="28.5" y="45" width="7" height="11" rx="2" fill="#9a5b2c" ${GEAR_OL}/><circle cx="32" cy="58.5" r="4" fill="#ffc83a" ${GEAR_OL}/></g>`,
  wand: `<path d="M13 53 L37 29" stroke="#23305a" stroke-width="10" stroke-linecap="round"/><path d="M13 53 L37 29" stroke="#7a4bd6" stroke-width="5" stroke-linecap="round"/><path d="M15.5 50.5 L21 45" stroke="#c9b1ff" stroke-width="2" stroke-linecap="round"/>
    <polygon points="${starPts(42, 22, 15, 7)}" fill="#ffd23a" ${GEAR_OL}/><path d="M37 19 L40 17" stroke="#fff6c0" stroke-width="2.4" stroke-linecap="round"/>${sparkle(55, 42, 5)}${sparkle(20, 13, 4)}`,
  bow: `<path d="M22 6 Q52 32 22 58" fill="none" stroke="#23305a" stroke-width="10" stroke-linecap="round"/><path d="M22 6 Q52 32 22 58" fill="none" stroke="#c07a3c" stroke-width="5" stroke-linecap="round"/><path d="M22 6 L22 58" stroke="#23305a" stroke-width="2"/>
    <path d="M8 32 H50" stroke="#23305a" stroke-width="6" stroke-linecap="round"/><path d="M8 32 H50" stroke="#f0dcb0" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M47 25 L60 32 L47 39 Z" fill="#cfd8e6" ${GEAR_OL}/><path d="M15 32 L8 24 L3 24 L9 32 L3 40 L8 40 Z" fill="#ff5f7a" stroke="#23305a" stroke-width="2" stroke-linejoin="round"/>`,
  cloak: `<path d="M20 12 Q32 18 44 12 L55 52 Q43 59 32 54 Q21 59 9 52 Z" fill="#e8445a" ${GEAR_OL}/><path d="M25 18 Q32 23 39 18 L44 50 Q38 53 32 51 Q26 53 20 50 Z" fill="#b8243c"/>
    <path d="M16 13 Q32 23 48 13 L45 7 Q32 15 19 7 Z" fill="#ffc83a" ${GEAR_OL}/><circle cx="32" cy="17" r="4.5" fill="#5ad0ff" ${GEAR_OL}/><path d="M13 49 L19 22" stroke="#ff8a98" stroke-width="2.4" stroke-linecap="round"/>`,
  plate: `<path d="M13 18 L24 10 Q32 16 40 10 L51 18 L47 31 L44 30 L44 54 Q32 59 20 54 L20 30 L17 31 Z" fill="#c4d0de" ${GEAR_OL}/><path d="M32 17 V56" stroke="#8496ad" stroke-width="2.5"/>
    <path d="M22 39 Q32 44 42 39" fill="none" stroke="#8496ad" stroke-width="2.5" stroke-linecap="round"/><circle cx="25" cy="24" r="2" fill="#6c7f98"/><circle cx="39" cy="24" r="2" fill="#6c7f98"/>
    <path d="M16 18 L24 13" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/><path d="M23 33 V50" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>`,
  vest: `<path d="M16 16 L25 9 L29 24 L29 55 Q22 57 15 54 L15 33 L11 31 Z" fill="#b8733e" ${GEAR_OL}/><path d="M48 16 L39 9 L35 24 L35 55 Q42 57 49 54 L49 33 L53 31 Z" fill="#b8733e" ${GEAR_OL}/>
    <path d="M29 30 L35 34 M35 30 L29 34 M29 40 L35 44 M35 40 L29 44" stroke="#f1d39a" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M19 21 V50 M45 21 V50" stroke="#7a4420" stroke-width="1.6" stroke-dasharray="3 3"/><rect x="38" y="40" width="8" height="7" rx="1.5" fill="#9a5c2e" stroke="#7a4420" stroke-width="1.6"/>`,
  goldRing: ringArt('#ffc83a', '#4fb6ff'),
  silverRing: ringArt('#dfe7f1', '#b46bff'),
  rubyRing: ringArt('#ffc83a', '#ff3d5e'),
  skull: `${chainArt}<path d="M32 24 V30" stroke="#23305a" stroke-width="3"/><path d="M20 40 a12 12 0 1 1 24 0 q0 6 -4 8 v5 h-16 v-5 q-4 -2 -4 -8 Z" fill="#f4f1e8" ${GEAR_OL}/>
    <circle cx="27" cy="40" r="3.6" fill="#23305a"/><circle cx="37" cy="40" r="3.6" fill="#23305a"/><path d="M32 44 l-2 3 h4 Z" fill="#23305a"/><path d="M28 53 v-4 M32 53 v-4 M36 53 v-4" stroke="#23305a" stroke-width="1.6"/>`,
  moon: `${chainArt}<path d="M38 24 V29" stroke="#23305a" stroke-width="3"/><path d="M38 28 A14 14 0 1 0 38 54 A18 18 0 0 1 38 28 Z" fill="#ffe066" ${GEAR_OL}/><path d="M25 36 A10 10 0 0 0 26 47" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
    <polygon points="${starPts(47, 45, 4.5, 2)}" fill="#fff6c0" stroke="#23305a" stroke-width="1.6" stroke-linejoin="round"/>`,
  clover: `${chainArt}<path d="M32 24 V30" stroke="#23305a" stroke-width="3"/><path d="M33 47 Q36 54 42 56" fill="none" stroke="#23305a" stroke-width="6" stroke-linecap="round"/><path d="M33 47 Q36 54 42 56" fill="none" stroke="#3fd06a" stroke-width="2.6" stroke-linecap="round"/>
    <g stroke="#23305a" stroke-width="6" fill="#3fd06a"><circle cx="26" cy="36" r="6.5"/><circle cx="38" cy="36" r="6.5"/><circle cx="26" cy="47" r="6.5"/><circle cx="38" cy="47" r="6.5"/></g>
    <g fill="#3fd06a"><circle cx="26" cy="36" r="6.5"/><circle cx="38" cy="36" r="6.5"/><circle cx="26" cy="47" r="6.5"/><circle cx="38" cy="47" r="6.5"/><circle cx="32" cy="41.5" r="5"/></g>
    <path d="M32 41.5 L24 34 M32 41.5 L40 34 M32 41.5 L24 49 M32 41.5 L40 49" stroke="#23a34a" stroke-width="1.8" stroke-linecap="round"/><path d="M23 33 Q25 31 27 32" stroke="#bff5c8" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
  scroll: `<rect x="15" y="17" width="34" height="30" rx="3" fill="#fbe7b8" ${GEAR_OL}/><path d="M22 25 H42 M22 31 H42 M22 37 H35" stroke="#c9a46a" stroke-width="2.2" stroke-linecap="round"/>
    <rect x="7" y="13" width="11" height="38" rx="5.5" fill="#f2d18e" ${GEAR_OL}/><rect x="46" y="13" width="11" height="38" rx="5.5" fill="#f2d18e" ${GEAR_OL}/>
    <path d="M28 46 V59 L32 55 L36 59 V46" fill="#ff4d6d" stroke="#23305a" stroke-width="2" stroke-linejoin="round"/><circle cx="32" cy="46" r="5.5" fill="#e8283c" ${GEAR_OL}/>`,
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
const CHEST_SVG = svgDoc(`<g class="ch-base"><rect x="10" y="50" width="100" height="52" rx="9" fill="#b8733e" ${GEAR_OL.replace('3"', '5"')}/>
  <rect x="24" y="50" width="10" height="52" fill="#ffc83a" stroke="#23305a" stroke-width="3"/><rect x="86" y="50" width="10" height="52" fill="#ffc83a" stroke="#23305a" stroke-width="3"/>
  <path d="M16 60 H104" stroke="#8f5427" stroke-width="3" stroke-linecap="round"/><path d="M16 88 H104" stroke="#8f5427" stroke-width="3" stroke-linecap="round" opacity=".6"/>
  <rect x="49" y="54" width="22" height="24" rx="5" fill="#ffc83a" ${GEAR_OL}/><path d="M60 62 v7" stroke="#23305a" stroke-width="4" stroke-linecap="round"/></g>
  <g class="ch-lid"><path d="M10 54 V40 Q10 12 60 12 Q110 12 110 40 V54 Z" fill="#c98446" ${GEAR_OL.replace('3"', '5"')}/>
  <path d="M24 54 V18 M34 54 V15 M86 54 V15 M96 54 V18" stroke="#23305a" stroke-width="3"/><path d="M24.5 54 V18.5 L33.5 15.5 V54 Z M86.5 54 V15.5 L95.5 18.5 V54 Z" fill="#ffc83a"/>
  <rect x="8" y="46" width="104" height="10" rx="4" fill="#ffc83a" ${GEAR_OL}/><path d="M22 26 Q40 17 60 17" stroke="#e7ad74" stroke-width="4" fill="none" stroke-linecap="round"/></g>`, '0 0 120 110');
const GEAR_URL = {};
const gearIcon = id => GEAR_URL[id] || (GEAR_URL[id] = svgUrl(svgDoc(GEAR_SVG[id])));
const slotIcon = id => GEAR_URL['slot-' + id] || (GEAR_URL['slot-' + id] = svgUrl(svgDoc(SLOT_SVG[id], '0 0 24 24')));

// ---------- inventory logic (G.save.gear = { items: { 'wand:2': count }, eq: { slot: key } }) ----------
function gearStats(sv = G.save) {
  const out = {};
  const add = st => { if (st) for (const k in st) out[k] = (out[k] || 0) + st[k]; };
  add((SKINS.find(s => s.id === sv.skin) || {}).boost);
  add((COSTUMES.find(c => c.id === sv.costume) || {}).boost);
  add((COSTUMES.find(c => c.id === sv.hat) || {}).boost);
  const g = sv.gear;
  if (g) for (const sl in g.eq) { const k = g.eq[sl]; if (k && g.items[k] > 0 && ARTIFACTS[artParse(k).id]) add(artStats(k)); }
  return out;
}
// the attack and health numbers shown on the inventory screen
function gearTotals(sv = G.save) {
  const g = gearStats(sv), up = sv.upgrades;
  return { atk: Math.round(100 * (1 + 0.03 * up.damage) * (1 + (g.dmg || 0) / 100)), hp: Math.round(140 * (1 + 0.05 * up.health) * (1 + (g.hp || 0) / 100)) };
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
    $('fuseRow').addEventListener('click', e => {
      const b = e.target.closest('.fslot[data-i]');
      if (!b) return;
      const i = Number(b.dataset.i);
      if (i < this.fuseSel.length) { this.fuseSel.splice(i, 1); AUDIO.play('click'); this.renderFuse(); }
    });
    $('fuseGo').addEventListener('click', () => this.fuseGo());
    $('fuseAll').addEventListener('click', () => this.fuseEverything());
    $('fuseClose').addEventListener('click', () => { AUDIO.play('click'); this.show('fuseBox', false); this.renderGear(); });
    document.querySelectorAll('#gearStage .eq').forEach(b => b.addEventListener('click', () => {
      const k = G.save.gear.eq[b.dataset.slot];
      AUDIO.play('click');
      if (k) this.openArtifact(k);
    }));
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
    $('gearGrid').replaceChildren(...this.sortedArtKeys().map(k => {
      const { r, def } = artParse(k), worn = g.eq[def.slot] === k;
      const b = this.artButton(k, g.items[k], `${worn ? ' worn' : ''}${g.items[k] >= fuseNeed(r) && r < MYTHIC ? ' fusable' : ''}`);
      b.addEventListener('click', () => { AUDIO.play('click'); this.openArtifact(k); });
      return b;
    }));
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
