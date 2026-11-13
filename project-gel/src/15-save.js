// ============================================================
// Saving progress in localStorage
// ============================================================
const SAVE_KEY = 'projectGel.save.v1';
function defaultSave() {
  return {
    v: 1, content: 4, coins: 0, blobUp: {}, blobLv: {}, chapter: 1, selected: 1, cleared: {}, best: {},
    upgrades: { damage: 0, health: 0, offline: 0, speed: 0, magnet: 0 },
    skin: 'classic', skins: ['classic'], costume: 'none', hat: 'none', costumes: ['none'],
    scrolls: 0, gear: { items: {}, eq: { weapon: null, armor: null, ring: null, necklace: null }, hidden: {}, colors: {} }, devUnlocked: false,
    settings: { sound: true, numbers: true, shake: true, haptics: true, quality: 'auto' },
    lastSeen: Date.now(), stats: { runs: 0, kills: 0, bosses: 0, elites: 0, gooblins: 0, evos: 0, maxLevel: 0, fuses: 0, coinsEarned: 0 },
    goals: { seen: {}, claimed: {} }, tutorial: true,
    // the Ocean Update's own chapters; ship: the biggest ship ever sailed (shown on the ocean page)
    // paint, sail, flag, trail: the ship's looks (10c-ship-cosmetics.js); looks: the ones owned, as 'kind:id'
    sea: { chapter: 1, selected: 1, cleared: {}, best: {}, ship: 0, paint: 'classic', sail: 'classic', flag: 'none', trail: 'foam', looks: ['paint:classic', 'sail:classic', 'flag:none', 'trail:foam'] },
  };
}
function loadGame() {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      const out = {
        ...d, ...s,
        upgrades: { ...d.upgrades, ...(s.upgrades || {}) },
        settings: { ...d.settings, ...(s.settings || {}) },
        stats: { ...d.stats, ...(s.stats || {}) },
        skins: Array.isArray(s.skins) && s.skins.length ? s.skins : d.skins,
        costumes: Array.isArray(s.costumes) && s.costumes.length ? s.costumes : d.costumes,
        cleared: s.cleared || {}, best: s.best || {},
        sea: { ...d.sea, ...(s.sea || {}), cleared: { ...((s.sea && s.sea.cleared) || {}) }, best: { ...((s.sea && s.sea.best) || {}) } },
        goals: { seen: { ...((s.goals && s.goals.seen) || {}) }, claimed: { ...((s.goals && s.goals.claimed) || {}) } },
        gear: { items: { ...((s.gear && s.gear.items) || {}) }, eq: { ...d.gear.eq, ...((s.gear && s.gear.eq) || {}) }, hidden: { ...((s.gear && s.gear.hidden) || {}) }, colors: { ...((s.gear && s.gear.colors) || {}) } },
      };
      // saves from before the blob upgrades replaced the Upgrades tab (content 4): everyone starts over,
      // keeping only their settings
      if (!(s.content >= 4)) { const fresh = defaultSave(); fresh.settings = out.settings; return fresh; }
      out.blobUp = { ...(s.blobUp || {}) };
      // one level per color now: a color upgraded stat by stat before starts at the average of its three levels
      out.blobLv = { ...(s.blobLv || {}) };
      for (const id in out.blobUp) if (out.blobLv[id] === undefined) { const v = Object.values(out.blobUp[id] || {}); if (v.length) out.blobLv[id] = Math.min(BLOB_UP_MAX, Math.round(v.reduce((a, b) => a + b, 0) / 3)); }
      return out;
    }
  } catch (_) { /* storage unavailable: play without saving */ }
  return d;
}
function saveGame() {
  try { G.save.lastSeen = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (_) { /* ignore */ }
}
// (offline earnings came from an upgrade that no longer exists)
function offlineEarnings() {
  const sv = G.save, lvl = 0;
  if (!lvl || !sv.lastSeen) return null;
  const hours = Math.min(8, Math.max(0, (Date.now() - sv.lastSeen) / 3.6e6));
  const coins = Math.floor(META_UPGRADES.offline.per * lvl * hours);
  return coins >= 1 ? { coins, hours } : null;
}
