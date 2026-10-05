// ============================================================
// Game data: skills, passives, enemies, bosses, arenas, chapters, upgrades, skins
// ============================================================
// icon: impostor type + color weight used for the 3D card icons
// Every skill has 10 levels; tables list each field per level (a single number means it never changes)
function L10(spec) {
  return Array.from({ length: 10 }, (_, i) => {
    const o = {};
    for (const k in spec) o[k] = Array.isArray(spec[k]) ? spec[k][i] : spec[k];
    return o;
  });
}
const SKILL_MAX = 10;
const SKILLS = {
  ball: {
    name: 'Blob Ball', intro: 'Fires balls of goo at the closest enemy.', icon: { type: 0, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Balls'], ['pierce', 'Pierce']],
    levels: L10({ dmg: [7, 8, 9, 9, 10, 11, 12, 13, 14, 15], cd: [1.1, 1.1, 1.0, 1.0, 0.95, 0.95, 0.9, 0.85, 0.8, 0.75], count: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], pierce: [0, 0, 0, 0, 0, 1, 1, 1, 1, 2] }),
  },
  fists: {
    name: 'Blob Fists', intro: 'Your arms stretch out and punch nearby enemies, knocking them back.', icon: { type: 17, colw: 1 },
    fields: [['dmg', 'Damage'], ['cd', 'Punch every', 's'], ['fists', 'Fists'], ['reach', 'Reach', 'm'], ['shock', 'Shockwave', 'm']],
    levels: L10({ dmg: [10, 12, 13, 15, 16, 18, 20, 22, 24, 28], cd: [2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5], fists: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4], reach: [2.4, 2.4, 2.5, 2.5, 2.6, 2.6, 2.8, 2.8, 3.0, 3.2], shock: [0, 0, 0, 0, 0, 0, 0, 0, 0.8, 1.0] }),
  },
  grenade: {
    name: 'Blob Grenade', intro: 'Drops a fused goo grenade at your feet. It bursts a moment later in a big splash.', icon: { type: 6, colw: 1 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Grenades'], ['radius', 'Blast radius', 'm']],
    levels: L10({ dmg: [14, 15, 17, 19, 21, 23, 26, 29, 32, 36], cd: [4.0, 3.9, 3.8, 3.6, 3.5, 3.4, 3.2, 3.0, 2.8, 2.6], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], radius: [1.5, 1.55, 1.6, 1.65, 1.7, 1.8, 1.9, 2.0, 2.1, 2.3], fuse: 1.4 }),
  },
  missile: {
    name: 'Blob Missile', intro: 'Homing goo missiles burst out of your back and dive at enemies.', icon: { type: 1, colw: 0.8 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Missiles'], ['splash', 'Splash', 'm']],
    levels: L10({ dmg: [8, 9, 10, 11, 12, 13, 14, 15, 16, 18], cd: [2.6, 2.6, 2.5, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9], count: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4], splash: [0, 0, 0, 0, 0.7, 0.7, 0.8, 0.8, 0.9, 1.0] }),
  },
  mine: {
    name: 'Blob Mine', intro: 'Drops sticky mines behind you that burst when enemies step close.', icon: { type: 2, colw: 1.6 },
    fields: [['dmg', 'Damage'], ['cd', 'Drop every', 's'], ['max', 'Max mines'], ['radius', 'Blast radius', 'm']],
    levels: L10({ dmg: [12, 13, 14, 16, 18, 20, 22, 24, 27, 30], cd: [3.0, 3.0, 2.9, 2.8, 2.7, 2.6, 2.5, 2.4, 2.2, 2.0], max: [2, 2, 3, 3, 3, 4, 4, 5, 5, 6], radius: [1.4, 1.45, 1.5, 1.55, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1] }),
  },
  blade: {
    name: 'Blade', intro: 'Crescent blades of hardened goo orbit you and cut what they touch.', icon: { type: 3, colw: 0.3 },
    fields: [['dmg', 'Damage'], ['count', 'Blades'], ['radius', 'Orbit', 'm'], ['spin', 'Spin', '°/s']],
    levels: L10({ dmg: [5, 6, 6, 7, 7, 8, 9, 10, 11, 12], count: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4], radius: [1.7, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0, 2.1, 2.2], spin: [150, 150, 160, 160, 170, 180, 190, 200, 210, 220] }),
  },
  lightning: {
    name: 'Lightning', intro: 'Lightning strikes random enemies on screen.', icon: { type: 18, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['strikes', 'Strikes'], ['radius', 'Impact', 'm'], ['chain', 'Jumps']],
    levels: L10({ dmg: [12, 13, 14, 15, 17, 19, 21, 23, 25, 28], cd: [3.0, 3.0, 2.9, 2.8, 2.7, 2.6, 2.5, 2.4, 2.2, 2.0], strikes: [1, 1, 1, 2, 2, 2, 3, 3, 3, 4], radius: [0.6, 0.6, 0.65, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 1.0], chain: [0, 0, 0, 0, 0, 0, 1, 1, 1, 2] }),
  },
  aura: {
    name: 'Aura', intro: 'A goo puddle around you burns everything standing in it.', icon: { type: 19, colw: 0 },
    fields: [['dmg', 'Damage per tick'], ['radius', 'Radius', 'm'], ['slow', 'Slow', '%']],
    levels: L10({ dmg: [2, 2, 3, 3, 3, 4, 4, 5, 5, 6], radius: [1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.6], slow: [0, 0, 0, 0, 10, 10, 15, 15, 20, 25] }),
  },
  worms: {
    name: 'Worms', intro: 'Goo worms tunnel under the floor and bite enemies.', icon: { type: 5, colw: 3 },
    fields: [['count', 'Worms'], ['dmg', 'Bite damage'], ['life', 'Lifetime', 's'], ['burst', 'Surfacing burst']],
    levels: L10({ count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], dmg: [6, 7, 7, 8, 9, 10, 11, 12, 13, 15], life: [5, 5, 6, 6, 6, 7, 7, 8, 8, 9], burst: [0, 0, 0, 0, 0, 0, 0, 0, 15, 25], cd: [7, 7, 7, 6.8, 6.6, 6.4, 6.2, 6, 5.8, 5.5] }),
  },
  buddies: {
    name: 'Blob Buddies', intro: 'You split off small copies of yourself that hop at enemies and headbutt them.', icon: { type: 7, colw: 0 },
    fields: [['count', 'Buddies'], ['dmg', 'Headbutt damage'], ['life', 'Lifetime', 's']],
    levels: L10({ count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], dmg: [4, 5, 5, 6, 6, 7, 8, 9, 10, 11], life: [8, 8, 9, 9, 10, 10, 11, 11, 12, 12], cd: [14, 14, 13.5, 13.5, 13, 13, 12.5, 12.5, 12, 12] }),
  },
  axe: {
    name: 'Goo Axe', intro: 'Throws spinning axes that cut through everything and fly back to you.', icon: { type: 4, colw: 0.5 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Axes'], ['range', 'Range', 'm']],
    levels: L10({ dmg: [9, 10, 11, 12, 13, 14, 16, 18, 20, 22], cd: [2.4, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], range: [4, 4, 4.2, 4.2, 4.4, 4.6, 4.8, 5, 5.3, 5.6] }),
  },
  laser: {
    name: 'Blob Laser', intro: 'A pressurized goo jet sprays from your chest and sweeps toward enemies.', icon: { type: 28, colw: 0 },
    fields: [['dmg', 'Damage per tick'], ['dur', 'Duration', 's'], ['cd', 'Cooldown', 's'], ['beams', 'Jets']],
    levels: L10({ dmg: [2, 2, 3, 3, 3, 4, 4, 5, 5, 6], dur: [1.0, 1.1, 1.2, 1.2, 1.3, 1.4, 1.5, 1.5, 1.6, 1.8], cd: [5, 5, 4.8, 4.6, 4.5, 4.4, 4.2, 4, 3.8, 3.5], beams: [1, 1, 1, 1, 1, 1, 1, 2, 2, 2] }),
  },
  shield: {
    name: 'Bubble Shield', intro: 'A goo bubble absorbs hits, then grows back.', icon: { type: 27, colw: 0 },
    fields: [['hits', 'Hits absorbed'], ['recharge', 'Regrows in', 's'], ['pop', 'Pop damage'], ['push', 'Pop knockback', 'm']],
    levels: L10({ hits: [1, 1, 1, 1, 1, 2, 2, 2, 2, 3], recharge: [12, 11.5, 11, 10.5, 10, 9.5, 9, 8.5, 8, 7], pop: [0, 0, 0, 0, 8, 8, 12, 12, 16, 20], push: [0, 0, 0, 0, 1.5, 1.5, 2, 2, 2.5, 3] }),
  },
};

// Passives: 10 levels each (Multishot adds a whole projectile per level, so it stays at 2)
const PASSIVES = {
  thick: { name: 'Thick Goo', desc: '+10% max health, and heals that amount.', max: 10, icon: { type: 25, colw: 0 } },
  regen: { name: 'Regen', desc: 'Heal 0.2% of max health every second.', max: 10, icon: { type: 10, colw: 4 } },
  speed: { name: 'Speed', desc: '+4% move speed.', max: 10, icon: { type: 1, colw: 0 } },
  magnet: { name: 'Magnet', desc: '+15% gem pickup radius.', max: 10, icon: { type: 11, colw: 4 } },
  power: { name: 'Power', desc: '+5% damage.', max: 10, icon: { type: 20, colw: 0 } },
  armor: { name: 'Armor', desc: 'Take 3% less damage.', max: 10, icon: { type: 21, colw: 0 } },
  haste: { name: 'Haste', desc: 'Skills recharge 3% faster.', max: 10, icon: { type: 22, colw: 0 } },
  reach: { name: 'Reach', desc: '+5% skill area.', max: 10, icon: { type: 23, colw: 0 } },
  multishot: { name: 'Multishot', desc: '+1 ball, grenade, missile or axe, and +1 lightning strike.', max: 2, icon: { type: 24, colw: 0.4 } },
  growth: { name: 'Growth', desc: '+4% XP from gems.', max: 10, icon: { type: 8, colw: 0 } },
};
const maxLevel = id => (SKILLS[id] ? SKILL_MAX : PASSIVES[id].max);

// Enemies stand a little shorter than the hero (the hero is about 1.9 tall, a stickman model 1.13 at scale 1).
// ai: how the enemy attacks besides walking into you. lunge = spear thrust, chop = overhead swing,
// toss = arcing javelin, bomb = runs up and explodes, ranged = bow.
const ENEMY_TYPES = {
  stickman: { model: 'stickman', hp: 12, speed: 2.2, dmg: 4, xp: 1, radius: 0.4, scale: 1.35, tint: '#f5891f', mass: 1 },
  sprinter: { model: 'sprinter', hp: 8, speed: 3.5, dmg: 3, xp: 1, radius: 0.36, scale: 1.3, tint: '#ffad2e', mass: 0.8 },
  helmet: { model: 'helmet', hp: 26, speed: 1.9, dmg: 5, xp: 2, radius: 0.42, scale: 1.4, tint: '#f28a2a', mass: 1.4 },
  spear: { model: 'spear', hp: 18, speed: 2.0, dmg: 5, xp: 2, radius: 0.4, scale: 1.35, tint: '#f5931f', mass: 1.1, ai: 'lunge', hit: 12 },
  axe: { model: 'axe', hp: 32, speed: 1.8, dmg: 7, xp: 3, radius: 0.44, scale: 1.45, tint: '#ee7420', mass: 1.5, ai: 'chop', hit: 16, wind: 0.6 },
  brute: { model: 'brute', hp: 70, speed: 1.6, dmg: 10, xp: 5, radius: 0.7, scale: 2.0, tint: '#e8642a', mass: 4, ai: 'chop', hit: 20, wind: 0.75, reach: 1.5 },
  archer: { model: 'archer', hp: 16, speed: 2.0, dmg: 5, shot: 8, xp: 2, radius: 0.4, scale: 1.35, tint: '#f28a2a', mass: 1, ranged: true },
  javelin: { model: 'javelin', hp: 16, speed: 2.0, dmg: 5, xp: 2, radius: 0.4, scale: 1.35, tint: '#f69a2c', mass: 1, ai: 'toss', hit: 11 },
  splitter: { model: 'splitter', hp: 28, speed: 2.0, dmg: 6, xp: 2, radius: 0.46, scale: 1.45, tint: '#f6a03a', mass: 1.5, splits: true },
  mini: { model: 'stickman', hp: 7, speed: 2.6, dmg: 3, xp: 1, radius: 0.28, scale: 0.85, tint: '#ffb85a', mass: 0.5 },
  shield: { model: 'shield', hp: 45, speed: 1.8, dmg: 8, xp: 3, radius: 0.44, scale: 1.4, tint: '#f5891f', mass: 1.6, shield: true },
  bomber: { model: 'bomber', hp: 10, speed: 3.0, dmg: 4, xp: 2, radius: 0.4, scale: 1.35, tint: '#ffb02e', mass: 0.9, ai: 'bomb', hit: 18 },
  knight: { model: 'knight', hp: 70, speed: 1.6, dmg: 8, xp: 5, radius: 0.5, scale: 1.55, tint: '#ec7a22', mass: 2.5, shield: true, ai: 'chop', hit: 14, wind: 0.45 },
};
// When each type starts showing up: [first chapter, seconds into the run, spawn weight]
const ENEMY_MIX = {
  sprinter: [1, 40, 0.18], helmet: [1, 60, 0.16], spear: [1, 90, 0.14], splitter: [4, 60, 0.1],
  axe: [2, 100, 0.12], archer: [2, 90, 0.1], shield: [3, 120, 0.1], brute: [3, 150, 0.07],
  javelin: [3, 120, 0.08], bomber: [4, 100, 0.08], knight: [5, 150, 0.06],
};
const ELITE_TYPES = ['stickman', 'helmet', 'spear', 'axe', 'archer', 'brute', 'shield', 'javelin'];

const BOSS_TYPES = {
  stomper: { name: 'Big Stomper', model: 'stomper', hp: 2500, speed: 1.6, dmg: 14, scale: 3.0, radius: 1.15, tint: '#f07a22', mass: 60 },
  hurler: { name: 'Hurler', model: 'hurler', hp: 2200, speed: 2.4, dmg: 12, scale: 2.6, radius: 0.9, tint: '#f5891f', mass: 60 },
  charger: { name: 'Charger', model: 'charger', hp: 2600, speed: 1.9, dmg: 14, scale: 2.8, radius: 1.1, tint: '#e8582a', mass: 60 },
  twins: { name: 'Twins', model: 'twin', hp: 1400, speed: 2.4, dmg: 12, scale: 2.4, radius: 0.85, tint: '#ff9a2e', tint2: '#f06a1e', mass: 60 },
  conductor: { name: 'Conductor', model: 'conductor', hp: 2800, speed: 0.9, dmg: 12, scale: 3.0, radius: 0.9, tint: '#f5891f', mass: 60 },
};
const BOSS_ORDER = ['stomper', 'hurler', 'charger', 'twins', 'conductor'];

const ARENAS = [
  { name: 'Stone Plaza', stoneA: '#34536e', stoneB: '#3c5e7b', grout: '#08121c', accent: '#4dffa0', fog: '#0a1f33', sky: '#7aa3c8', ground: '#16304a', light: '#fff6ea', spotMin: 0.5, shadowTint: '#0a1f3a', rock: '#8592a0', pool: '#1f7a9c', poolGlow: 0.05 },
  { name: 'Slime Sewers', stoneA: '#2f4d47', stoneB: '#365750', grout: '#061210', accent: '#62ff7a', fog: '#071a16', sky: '#7cc4b0', ground: '#12302a', light: '#f2fff4', spotMin: 0.48, shadowTint: '#06281f', rock: '#74857c', pool: '#4ccf48', poolGlow: 0.35 },
  { name: 'Toy Factory', stoneA: '#4e4772', stoneB: '#58507f', grout: '#120d22', accent: '#ff9bd1', fog: '#16122a', sky: '#c9bcf2', ground: '#2e2550', light: '#fff4ec', spotMin: 0.52, shadowTint: '#1c1238', rock: '#a297c8', pool: '#ff6fb8', poolGlow: 0.2 },
  { name: 'Night Market', stoneA: '#58432f', stoneB: '#624b36', grout: '#160c08', accent: '#ffb35c', fog: '#170e14', sky: '#c9a07a', ground: '#2d1d18', light: '#ffe7c4', spotMin: 0.46, shadowTint: '#2a1020', rock: '#8f7f6a', pool: '#4a3322', poolGlow: 0.0 },
  { name: 'Ice Lab', stoneA: '#46708f', stoneB: '#4f7a98', grout: '#0a1a28', accent: '#bff3ff', fog: '#0b1f33', sky: '#a6cce8', ground: '#22445f', light: '#e8f4ff', spotMin: 0.48, shadowTint: '#0a2440', rock: '#bcd8ea', pool: '#5fc8ff', poolGlow: 0.15 },
  { name: 'Lava Foundry', stoneA: '#3a3131', stoneB: '#433838', grout: '#0b0605', accent: '#ff6a1a', fog: '#1a0c08', sky: '#a06a50', ground: '#2a1410', light: '#ffe2c8', spotMin: 0.46, shadowTint: '#2a0a04', rock: '#6e625e', pool: '#ff6a1a', poolGlow: 0.95 },
];

function chapterInfo(n) {
  const arena = Math.floor((n - 1) / 5) % ARENAS.length;
  const k = n - 1;
  const bosses = n % 5 === 0 ? ['conductor', BOSS_ORDER[(Math.floor(n / 5) - 1) % 4]] : [BOSS_ORDER[(n - 1) % 5]];
  return {
    n, arena, arenaName: ARENAS[arena].name, bosses,
    hpMul: 1 + 0.12 * k + 0.004 * k * k,
    dmgMul: 1 + 0.08 * k,
    rateMul: Math.min(1.8, 0.85 + 0.05 * k),
    bossHpMul: Math.pow(1.17, k) * (bosses.length > 1 ? 0.75 : 1),
    reward: Math.round(150 * Math.pow(1.08, k)),
    has: Object.fromEntries(Object.entries(ENEMY_MIX).map(([k, v]) => [k, n >= v[0]])),
  };
}

// XP needed to go from level L to L+1
const xpFor = L => Math.round(4 + 1.6 * L + 0.03 * L * L);

const META_UPGRADES = {
  damage: { name: 'Damage', per: 3, unit: '% damage', base: 50, growth: 1.18, max: 100, icon: { type: 17, colw: 4 } },
  health: { name: 'Health', per: 5, unit: '% max health', base: 50, growth: 1.18, max: 100, icon: { type: 10, colw: 4 } },
  offline: { name: 'Offline earnings', per: 10, unit: ' coins per hour', base: 80, growth: 1.2, max: 50, icon: { type: 26, colw: 0 } },
  speed: { name: 'Speed', per: 1, unit: '% move speed', base: 120, growth: 1.25, max: 20, icon: { type: 1, colw: 0 } },
  magnet: { name: 'Magnet', per: 5, unit: '% pickup radius', base: 100, growth: 1.22, max: 20, icon: { type: 11, colw: 4 } },
};
const upgradeCost = (id, lvl) => Math.round(META_UPGRADES[id].base * Math.pow(META_UPGRADES[id].growth, lvl));

const SKINS = [
  { id: 'classic', name: 'Classic', cost: 0, base: '#18d2ff', accent: '#7b55f5', rim: '#8ef3ff' },
  { id: 'lime', name: 'Lime Jelly', cost: 600, base: '#7be04a', accent: '#1f9e7a', rim: '#d8ffb0' },
  { id: 'bubblegum', name: 'Bubblegum', cost: 1200, base: '#ff7ac8', accent: '#9a4dff', rim: '#ffd3f0' },
  { id: 'grape', name: 'Grape', cost: 2000, base: '#9c6bff', accent: '#ff5fb8', rim: '#e0ccff' },
  { id: 'mint', name: 'Mint', cost: 3000, base: '#3ef0b8', accent: '#1a8cff', rim: '#c8fff0' },
  { id: 'galaxy', name: 'Galaxy', cost: 6000, base: '#5b4dff', accent: '#ff5fb8', rim: '#c9c2ff' },
];
