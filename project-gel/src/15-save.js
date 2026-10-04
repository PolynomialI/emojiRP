// ============================================================
// Saving progress in localStorage
// ============================================================
const SAVE_KEY = 'projectGel.save.v1';
function defaultSave() {
  return {
    v: 1, coins: 0, chapter: 1, selected: 1, cleared: {}, best: {},
    upgrades: { damage: 0, health: 0, offline: 0, speed: 0, magnet: 0 },
    skin: 'classic', skins: ['classic'],
    settings: { sound: true, numbers: true, shake: true, haptics: true, quality: 'auto' },
    lastSeen: Date.now(), stats: { runs: 0, kills: 0 }, tutorial: true,
  };
}
function loadGame() {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        ...d, ...s,
        upgrades: { ...d.upgrades, ...(s.upgrades || {}) },
        settings: { ...d.settings, ...(s.settings || {}) },
        stats: { ...d.stats, ...(s.stats || {}) },
        skins: Array.isArray(s.skins) && s.skins.length ? s.skins : d.skins,
        cleared: s.cleared || {}, best: s.best || {},
      };
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
