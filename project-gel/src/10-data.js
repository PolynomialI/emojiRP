// ============================================================
// Game data: skills, passives, enemies, bosses, arenas, chapters, upgrades, skins
// ============================================================
// icon: impostor type + color weight used for the 3D card icons
const SKILLS = {
  ball: {
    name: 'Blob Ball', intro: 'Fires balls of goo at the closest enemy.', icon: { type: 0, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Balls'], ['pierce', 'Pierce']],
    levels: [{ dmg: 12, cd: 0.9, count: 1, pierce: 0 }, { dmg: 12, cd: 0.9, count: 2, pierce: 0 }, { dmg: 16, cd: 0.9, count: 2, pierce: 1 }, { dmg: 16, cd: 0.8, count: 3, pierce: 1 }, { dmg: 22, cd: 0.7, count: 3, pierce: 2 }],
  },
  fists: {
    name: 'Blob Fists', intro: 'Your arms stretch out and punch nearby enemies, knocking them back.', icon: { type: 17, colw: 1 },
    fields: [['dmg', 'Damage'], ['cd', 'Punch every', 's'], ['fists', 'Fists'], ['reach', 'Reach', 'm'], ['shock', 'Shockwave', 'm']],
    levels: [{ dmg: 20, cd: 2.0, fists: 2, reach: 2.4, shock: 0 }, { dmg: 26, cd: 1.8, fists: 2, reach: 2.4, shock: 0 }, { dmg: 26, cd: 1.6, fists: 3, reach: 2.8, shock: 0 }, { dmg: 34, cd: 1.6, fists: 3, reach: 2.8, shock: 0 }, { dmg: 44, cd: 1.2, fists: 4, reach: 3.2, shock: 1.0 }],
  },
  grenade: {
    name: 'Blob Grenade', intro: 'Lobs a heavy goo bomb onto the biggest group of enemies.', icon: { type: 6, colw: 1 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Grenades'], ['radius', 'Blast radius', 'm']],
    levels: [{ dmg: 30, cd: 3.0, count: 1, radius: 1.8 }, { dmg: 30, cd: 3.0, count: 2, radius: 1.8 }, { dmg: 42, cd: 2.6, count: 2, radius: 2.2 }, { dmg: 42, cd: 2.6, count: 3, radius: 2.2 }, { dmg: 55, cd: 2.2, count: 3, radius: 2.6 }],
  },
  missile: {
    name: 'Blob Missile', intro: 'Homing goo missiles burst out of your back and dive at enemies.', icon: { type: 1, colw: 0.8 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Missiles'], ['splash', 'Splash', 'm']],
    levels: [{ dmg: 18, cd: 2.0, count: 2, splash: 0 }, { dmg: 18, cd: 2.0, count: 3, splash: 0 }, { dmg: 24, cd: 2.0, count: 3, splash: 0 }, { dmg: 24, cd: 1.8, count: 4, splash: 0.8 }, { dmg: 30, cd: 1.6, count: 6, splash: 0.8 }],
  },
  mine: {
    name: 'Blob Mine', intro: 'Drops sticky mines behind you that burst when enemies step close.', icon: { type: 2, colw: 1.6 },
    fields: [['dmg', 'Damage'], ['cd', 'Drop every', 's'], ['max', 'Max mines'], ['radius', 'Blast radius', 'm']],
    levels: [{ dmg: 40, cd: 2.5, max: 4, radius: 2.0 }, { dmg: 40, cd: 2.5, max: 4, radius: 2.5 }, { dmg: 60, cd: 2.5, max: 6, radius: 2.5 }, { dmg: 60, cd: 2.0, max: 6, radius: 2.5 }, { dmg: 80, cd: 1.6, max: 8, radius: 3.0 }],
  },
  blade: {
    name: 'Blade', intro: 'Crescent blades of hardened goo orbit you and cut what they touch.', icon: { type: 3, colw: 0.3 },
    fields: [['dmg', 'Damage'], ['count', 'Blades'], ['radius', 'Orbit', 'm'], ['spin', 'Spin', '°/s']],
    levels: [{ dmg: 10, count: 2, radius: 1.6, spin: 180 }, { dmg: 10, count: 3, radius: 1.6, spin: 180 }, { dmg: 14, count: 3, radius: 1.9, spin: 180 }, { dmg: 14, count: 4, radius: 1.9, spin: 210 }, { dmg: 18, count: 5, radius: 2.2, spin: 240 }],
  },
  lightning: {
    name: 'Lightning', intro: 'Lightning strikes random enemies on screen.', icon: { type: 18, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['strikes', 'Strikes'], ['radius', 'Impact', 'm'], ['chain', 'Jumps']],
    levels: [{ dmg: 25, cd: 2.2, strikes: 2, radius: 0.6, chain: 0 }, { dmg: 25, cd: 2.2, strikes: 3, radius: 0.6, chain: 0 }, { dmg: 35, cd: 2.0, strikes: 3, radius: 0.9, chain: 0 }, { dmg: 35, cd: 2.0, strikes: 4, radius: 0.9, chain: 1 }, { dmg: 45, cd: 1.6, strikes: 6, radius: 1.2, chain: 2 }],
  },
  aura: {
    name: 'Aura', intro: 'A goo puddle around you burns everything standing in it.', icon: { type: 19, colw: 0 },
    fields: [['dmg', 'Damage per tick'], ['radius', 'Radius', 'm'], ['slow', 'Slow', '%']],
    levels: [{ dmg: 5, radius: 1.8, slow: 0 }, { dmg: 5, radius: 2.1, slow: 0 }, { dmg: 7, radius: 2.1, slow: 15 }, { dmg: 7, radius: 2.5, slow: 15 }, { dmg: 10, radius: 2.8, slow: 25 }],
  },
  worms: {
    name: 'Worms', intro: 'Goo worms tunnel under the floor and bite enemies.', icon: { type: 5, colw: 3 },
    fields: [['count', 'Worms'], ['dmg', 'Bite damage'], ['life', 'Lifetime', 's'], ['burst', 'Surfacing burst']],
    levels: [{ count: 1, dmg: 15, life: 6, burst: 0, cd: 6 }, { count: 2, dmg: 15, life: 6, burst: 0, cd: 6 }, { count: 2, dmg: 20, life: 8, burst: 0, cd: 6 }, { count: 3, dmg: 20, life: 8, burst: 0, cd: 6 }, { count: 3, dmg: 25, life: 10, burst: 40, cd: 6 }],
  },
  buddies: {
    name: 'Blob Buddies', intro: 'You split off small copies of yourself that hop at enemies and headbutt them.', icon: { type: 7, colw: 0 },
    fields: [['count', 'Buddies'], ['dmg', 'Headbutt damage'], ['life', 'Lifetime', 's']],
    levels: [{ count: 1, dmg: 8, life: 10, cd: 12 }, { count: 2, dmg: 8, life: 10, cd: 12 }, { count: 2, dmg: 12, life: 10, cd: 12 }, { count: 3, dmg: 12, life: 15, cd: 12 }, { count: 4, dmg: 16, life: 15, cd: 12 }],
  },
  axe: {
    name: 'Goo Axe', intro: 'Throws spinning axes that cut through everything and fly back to you.', icon: { type: 4, colw: 0.5 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Axes'], ['range', 'Range', 'm']],
    levels: [{ dmg: 22, cd: 1.8, count: 1, range: 5 }, { dmg: 22, cd: 1.8, count: 2, range: 5 }, { dmg: 30, cd: 1.6, count: 2, range: 5 }, { dmg: 30, cd: 1.6, count: 3, range: 5.5 }, { dmg: 38, cd: 1.4, count: 3, range: 6.5 }],
  },
  laser: {
    name: 'Blob Laser', intro: 'A pressurized goo jet sprays from your chest and sweeps toward enemies.', icon: { type: 28, colw: 0 },
    fields: [['dmg', 'Damage per tick'], ['dur', 'Duration', 's'], ['cd', 'Cooldown', 's'], ['beams', 'Jets']],
    levels: [{ dmg: 6, dur: 1.2, cd: 4.0, beams: 1 }, { dmg: 6, dur: 1.5, cd: 4.0, beams: 1 }, { dmg: 8, dur: 1.5, cd: 3.5, beams: 1 }, { dmg: 8, dur: 1.8, cd: 3.5, beams: 2 }, { dmg: 10, dur: 1.8, cd: 3.0, beams: 2 }],
  },
  shield: {
    name: 'Bubble Shield', intro: 'A goo bubble absorbs hits, then grows back.', icon: { type: 27, colw: 0 },
    fields: [['hits', 'Hits absorbed'], ['recharge', 'Regrows in', 's'], ['pop', 'Pop damage'], ['push', 'Pop knockback', 'm']],
    levels: [{ hits: 1, recharge: 10, pop: 0, push: 0 }, { hits: 1, recharge: 8, pop: 0, push: 0 }, { hits: 1, recharge: 8, pop: 20, push: 2 }, { hits: 2, recharge: 8, pop: 20, push: 2 }, { hits: 2, recharge: 5, pop: 40, push: 3 }],
  },
};

const PASSIVES = {
  thick: { name: 'Thick Goo', desc: '+20% max health, and heals that amount.', max: 5, icon: { type: 25, colw: 0 } },
  regen: { name: 'Regen', desc: 'Heal 0.4% of max health every second.', max: 5, icon: { type: 10, colw: 4 } },
  speed: { name: 'Speed', desc: '+8% move speed.', max: 5, icon: { type: 1, colw: 0 } },
  magnet: { name: 'Magnet', desc: '+30% gem pickup radius.', max: 5, icon: { type: 11, colw: 4 } },
  power: { name: 'Power', desc: '+10% damage.', max: 5, icon: { type: 20, colw: 0 } },
  armor: { name: 'Armor', desc: 'Take 6% less damage.', max: 5, icon: { type: 21, colw: 0 } },
  haste: { name: 'Haste', desc: 'Skills recharge 6% faster.', max: 5, icon: { type: 22, colw: 0 } },
  reach: { name: 'Reach', desc: '+10% skill area.', max: 5, icon: { type: 23, colw: 0 } },
  multishot: { name: 'Multishot', desc: '+1 ball, grenade, missile or axe, and +1 lightning strike.', max: 2, icon: { type: 24, colw: 0.4 } },
  growth: { name: 'Growth', desc: '+8% XP from gems.', max: 5, icon: { type: 8, colw: 0 } },
};

const ENEMY_TYPES = {
  stickman: { model: 'stickman', hp: 10, speed: 2.2, dmg: 5, xp: 1, radius: 0.3, scale: 1, tint: '#f5891f', mass: 1 },
  sprinter: { model: 'sprinter', hp: 6, speed: 3.6, dmg: 4, xp: 1, radius: 0.27, scale: 1, tint: '#ffad2e', mass: 0.8 },
  brute: { model: 'brute', hp: 60, speed: 1.6, dmg: 12, xp: 5, radius: 0.55, scale: 1.6, tint: '#e8642a', mass: 4 },
  archer: { model: 'archer', hp: 14, speed: 2.0, dmg: 5, shot: 8, xp: 2, radius: 0.3, scale: 1, tint: '#f28a2a', mass: 1, ranged: true },
  splitter: { model: 'splitter', hp: 24, speed: 2.0, dmg: 6, xp: 2, radius: 0.36, scale: 1.1, tint: '#f6a03a', mass: 1.5, splits: true },
  mini: { model: 'stickman', hp: 6, speed: 2.6, dmg: 3, xp: 1, radius: 0.2, scale: 0.6, tint: '#ffb85a', mass: 0.5 },
  shield: { model: 'shield', hp: 40, speed: 1.8, dmg: 8, xp: 3, radius: 0.34, scale: 1.05, tint: '#f5891f', mass: 1.6, shield: true },
};

const BOSS_TYPES = {
  stomper: { name: 'Big Stomper', model: 'stomper', hp: 2500, speed: 1.6, dmg: 14, scale: 3.0, radius: 1.15, tint: '#f07a22', mass: 60 },
  hurler: { name: 'Hurler', model: 'hurler', hp: 2200, speed: 2.4, dmg: 12, scale: 2.6, radius: 0.9, tint: '#f5891f', mass: 60 },
  charger: { name: 'Charger', model: 'charger', hp: 2600, speed: 1.9, dmg: 14, scale: 2.8, radius: 1.1, tint: '#e8582a', mass: 60 },
  twins: { name: 'Twins', model: 'twin', hp: 1400, speed: 2.4, dmg: 12, scale: 2.4, radius: 0.85, tint: '#ff9a2e', tint2: '#f06a1e', mass: 60 },
  conductor: { name: 'Conductor', model: 'conductor', hp: 2800, speed: 0.9, dmg: 12, scale: 3.0, radius: 0.9, tint: '#f5891f', mass: 60 },
};
const BOSS_ORDER = ['stomper', 'hurler', 'charger', 'twins', 'conductor'];

const ARENAS = [
  { name: 'Stone Plaza', stoneA: '#2b4c68', stoneB: '#3e6788', grout: '#0c1c2a', accent: '#4dffa0', fog: '#0a1f33', sky: '#7aa3c8', ground: '#16304a', light: '#fff6ea', spotMin: 0.42, shadowTint: '#0a1f3a' },
  { name: 'Slime Sewers', stoneA: '#35554f', stoneB: '#4a6e66', grout: '#0b1a17', accent: '#62ff7a', fog: '#071a16', sky: '#7cc4b0', ground: '#12302a', light: '#f2fff4', spotMin: 0.4, shadowTint: '#06281f' },
  { name: 'Toy Factory', stoneA: '#6f6698', stoneB: '#8a82b4', grout: '#2a2440', accent: '#ff9bd1', fog: '#16122a', sky: '#c9bcf2', ground: '#2e2550', light: '#fff4ec', spotMin: 0.46, shadowTint: '#1c1238' },
  { name: 'Night Market', stoneA: '#6b4a32', stoneB: '#8a6444', grout: '#22140c', accent: '#ffb35c', fog: '#170e14', sky: '#c9a07a', ground: '#2d1d18', light: '#ffe7c4', spotMin: 0.36, shadowTint: '#2a1020' },
  { name: 'Ice Lab', stoneA: '#7aa6c4', stoneB: '#a2c6de', grout: '#30536c', accent: '#bff3ff', fog: '#0b1f33', sky: '#cfeaff', ground: '#2c5270', light: '#eef8ff', spotMin: 0.44, shadowTint: '#0a2440' },
  { name: 'Lava Foundry', stoneA: '#2e2a2c', stoneB: '#453e3d', grout: '#120a08', accent: '#ff6a1a', fog: '#1a0c08', sky: '#a06a50', ground: '#2a1410', light: '#ffe2c8', spotMin: 0.4, shadowTint: '#2a0a04' },
];

function chapterInfo(n) {
  const arena = Math.floor((n - 1) / 5) % ARENAS.length;
  const k = n - 1;
  const bosses = n % 5 === 0 ? ['conductor', BOSS_ORDER[(Math.floor(n / 5) - 1) % 4]] : [BOSS_ORDER[(n - 1) % 5]];
  return {
    n, arena, arenaName: ARENAS[arena].name, bosses,
    hpMul: 1 + 0.16 * k + 0.004 * k * k,
    dmgMul: 1 + 0.06 * k,
    rateMul: Math.min(1.8, 1 + 0.035 * k),
    bossHpMul: Math.pow(1.17, k) * (bosses.length > 1 ? 0.75 : 1),
    reward: Math.round(150 * Math.pow(1.08, k)),
    has: { sprinter: true, brute: n >= 2, archer: n >= 4, splitter: n >= 6, shield: n >= 8 },
  };
}

// XP needed to go from level L to L+1
const xpFor = L => Math.round(6 + 5 * L + 0.3 * L * L);

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
