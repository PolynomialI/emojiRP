// ============================================================
// Saving progress in localStorage
// ============================================================
const SAVE_KEY = 'projectGel.save.v1';
function defaultSave() {
  return {
    v: 1, coins: 0, chapter: 1, selected: 1, cleared: {}, best: {},
    upgrades: { damage: 0, health: 0, offline: 0, speed: 0, magnet: 0 },
    skin: 'classic', skins: ['classic'], costume: 'none', hat: 'none', costumes: ['none'],
    scrolls: 0, gear: { items: {}, eq: { weapon: null, armor: null, ring: null, necklace: null } }, devUnlocked: false,
    settings: { sound: true, numbers: true, shake: true, haptics: true, quality: 'auto' },
    lastSeen: Date.now(), stats: { runs: 0, kills: 0, bosses: 0, elites: 0, gooblins: 0, evos: 0, maxLevel: 0, fuses: 0, coinsEarned: 0 },
    goals: { seen: {}, claimed: {} }, tutorial: true,
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
        goals: { seen: { ...((s.goals && s.goals.seen) || {}) }, claimed: { ...((s.goals && s.goals.claimed) || {}) } },
        gear: { items: { ...((s.gear && s.gear.items) || {}) }, eq: { ...d.gear.eq, ...((s.gear && s.gear.eq) || {}) } },
      };
      // saves from before goals counted bosses: every cleared chapter took at least one
      if (!s.stats || s.stats.bosses == null) out.stats.bosses = Object.keys(out.cleared).length;
      // saves from before hats had their own slot: a hat worn as the costume moves over
      if (HAT_IDS.includes(out.costume)) { out.hat = out.costume; out.costume = 'none'; }
      return out;
    }
  } catch (_) { /* storage unavailable: play without saving */ }
  return d;
}
function saveGame() {
  try { G.save.lastSeen = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(G.save)); } catch (_) { /* ignore */ }
}
function offlineEarnings() {
  const sv = G.save, lvl = sv.upgrades.offline || 0;
  if (!lvl || !sv.lastSeen) return null;
  const hours = Math.min(8, Math.max(0, (Date.now() - sv.lastSeen) / 3.6e6));
  const coins = Math.floor(META_UPGRADES.offline.per * lvl * hours);
  return coins >= 1 ? { coins, hours } : null;
}
