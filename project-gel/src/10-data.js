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
    levels: L10({ dmg: [8, 9, 9, 10, 10, 11, 12, 13, 14, 15], cd: [1.1, 1.1, 1.0, 1.0, 0.95, 0.95, 0.9, 0.85, 0.8, 0.75], count: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], pierce: [0, 0, 0, 0, 0, 1, 1, 1, 1, 2] }),
  },
  fists: {
    name: 'Blob Fists', intro: 'Your arms stretch out and punch nearby enemies, knocking them back.', icon: { type: 17, colw: 1 },
    fields: [['dmg', 'Damage'], ['cd', 'Punch every', 's'], ['fists', 'Fists'], ['reach', 'Reach', 'm'], ['shock', 'Shockwave', 'm']],
    levels: L10({ dmg: [10, 12, 13, 15, 16, 18, 20, 22, 24, 28], cd: [2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5], fists: [2, 2, 2, 2, 3, 3, 3, 3, 4, 4], reach: [2.4, 2.4, 2.5, 2.5, 2.6, 2.6, 2.8, 2.8, 3.0, 3.2], shock: [0, 0, 0, 0, 0, 0, 0, 0, 0.8, 1.0] }),
  },
  grenade: {
    name: 'Blob Grenade', intro: 'Drops a fused goo grenade at your feet. It bursts a moment later in a big splash.', icon: { type: 6, colw: 1 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Grenades'], ['radius', 'Blast radius', 'm']],
    levels: L10({ dmg: [14, 15, 17, 19, 21, 23, 26, 29, 32, 36], cd: [4.0, 3.9, 3.8, 3.6, 3.5, 3.4, 3.2, 3.0, 2.8, 2.6], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], radius: [1.5, 1.55, 1.6, 1.65, 1.7, 1.8, 1.9, 2.0, 2.1, 2.3], fuse: 1.2 }),
  },
  missile: {
    name: 'Blob Missile', intro: 'Homing goo missiles burst out of your back and dive at enemies.', icon: { type: 1, colw: 0.8 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Missiles'], ['splash', 'Splash', 'm']],
    levels: L10({ dmg: [8, 9, 10, 11, 12, 13, 14, 15, 16, 18], cd: [2.6, 2.6, 2.5, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9], count: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4], splash: [0, 0, 0, 0, 0.7, 0.7, 0.8, 0.8, 0.9, 1.0] }),
  },
  mine: {
    name: 'Blob Mine', intro: 'Drops little goo blobs behind you that burst when enemies step close.', icon: { type: 31, colw: 1.6 },
    fields: [['dmg', 'Damage'], ['cd', 'Drop every', 's'], ['max', 'Max mines'], ['radius', 'Blast radius', 'm']],
    levels: L10({ dmg: [18, 20, 22, 24, 27, 30, 33, 37, 41, 46], cd: [2.6, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.7], max: [3, 3, 3, 4, 4, 5, 5, 6, 6, 7], radius: [1.7, 1.75, 1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.6] }),
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
    name: 'Aura', intro: 'A sticky goo puddle around you slows everything in it to a crawl and burns it hard.', icon: { type: 19, colw: 0 },
    fields: [['dmg', 'Damage per tick'], ['radius', 'Radius', 'm'], ['slow', 'Slow', '%']],
    levels: L10({ dmg: [6, 7, 8, 10, 11, 13, 15, 17, 20, 24], radius: [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8], slow: [30, 32, 35, 38, 40, 43, 46, 50, 55, 60] }),
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
  // ---------- chapter power-ups (from: the first chapter they can be found in) ----------
  sandstorm: {
    name: 'Sandstorm', from: 2, intro: 'Whips up goo tornadoes that wander into crowds, pulling enemies in and grinding them down.', icon: { type: 32, colw: 0 },
    fields: [['dmg', 'Damage per tick'], ['count', 'Tornadoes'], ['radius', 'Radius', 'm'], ['life', 'Lasts', 's']],
    levels: L10({ dmg: [3, 3, 4, 4, 5, 5, 6, 7, 8, 9], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], radius: [1.4, 1.5, 1.6, 1.7, 1.7, 1.8, 1.9, 2.0, 2.1, 2.3], life: [3, 3.2, 3.4, 3.6, 3.8, 4, 4.3, 4.6, 5, 5.5], cd: [8, 7.8, 7.6, 7.4, 7.2, 7, 6.6, 6.3, 6, 5.5] }),
  },
  bouncy: {
    name: 'Bouncy Ball', from: 4, intro: 'Launches rubber goo balls that ricochet from enemy to enemy and off the walls.', icon: { type: 35, colw: 0 },
    fields: [['dmg', 'Damage'], ['count', 'Balls'], ['bounces', 'Bounces'], ['cd', 'Cooldown', 's']],
    levels: L10({ dmg: [10, 11, 12, 13, 14, 16, 18, 20, 22, 25], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], bounces: [3, 3, 4, 4, 5, 5, 6, 6, 7, 8], cd: [2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7], size: [0.45, 0.47, 0.5, 0.52, 0.55, 0.58, 0.62, 0.66, 0.7, 0.75] }),
  },
  drone: {
    name: 'Neon Drone', from: 3, intro: 'Little neon drones orbit you and zap the closest enemies; the zaps chain to their neighbours.', icon: { type: 34, colw: 0 },
    fields: [['dmg', 'Damage'], ['count', 'Drones'], ['chain', 'Chains'], ['cd', 'Zaps every', 's'], ['range', 'Range', 'm']],
    levels: L10({ dmg: [6, 7, 7, 8, 9, 10, 11, 12, 14, 16], count: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], chain: [0, 0, 1, 1, 1, 2, 2, 2, 3, 3], cd: [0.9, 0.85, 0.8, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5], range: [5, 5, 5.3, 5.3, 5.6, 5.6, 6, 6.3, 6.6, 7] }),
  },
  meteor: {
    name: 'Meteor', from: 7, intro: 'Calls flaming meteors down on the thickest crowds nearby; the ground keeps burning where they land.', icon: { type: 39, colw: 0 },
    fields: [['dmg', 'Damage'], ['count', 'Meteors'], ['radius', 'Radius', 'm'], ['cd', 'Cooldown', 's']],
    levels: L10({ dmg: [30, 34, 38, 42, 48, 54, 60, 68, 76, 86], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], radius: [1.8, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.9], cd: [6, 5.8, 5.6, 5.4, 5.2, 5.0, 4.8, 4.6, 4.3, 4.0] }),
  },
  wave: {
    name: 'Tidal Wave', from: 9, intro: 'Sends a wall of goo surf rolling out at the nearest crowd, sweeping enemies along and battering them.', icon: { type: 41, colw: 0 },
    fields: [['dmg', 'Damage'], ['count', 'Waves'], ['width', 'Width', 'm'], ['cd', 'Cooldown', 's']],
    levels: L10({ dmg: [16, 18, 20, 23, 26, 29, 32, 36, 40, 46], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], width: [2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.3, 4.6], cd: [5.5, 5.4, 5.2, 5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.7] }),
  },
  blackhole: {
    name: 'Black Hole', from: 10, intro: 'Opens a black hole in the thickest crowd that drags enemies in, then collapses with a crushing blast.', icon: { type: 42, colw: 0 },
    fields: [['dmg', 'Collapse damage'], ['radius', 'Pull radius', 'm'], ['life', 'Lasts', 's'], ['cd', 'Cooldown', 's']],
    levels: L10({ dmg: [40, 46, 52, 58, 66, 74, 82, 92, 104, 120], radius: [3.5, 3.7, 3.9, 4.1, 4.3, 4.5, 4.8, 5.1, 5.4, 5.8], life: [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.8, 3.0, 3.2], cd: [9, 8.7, 8.4, 8.1, 7.8, 7.5, 7.2, 6.9, 6.6, 6.2] }),
  },
  wisps: {
    name: 'Spirit Wisps', from: 11, intro: 'Friendly ghost wisps circle you, dart through the nearest enemies, then drift back to you.', icon: { type: 43, colw: 0 },
    fields: [['dmg', 'Damage'], ['count', 'Wisps'], ['cd', 'Darts every', 's'], ['pierce', 'Passes through']],
    levels: L10({ dmg: [12, 13, 15, 16, 18, 20, 22, 25, 28, 32], count: [2, 2, 2, 3, 3, 3, 4, 4, 4, 5], cd: [2.2, 2.1, 2.0, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.4], pierce: [2, 2, 3, 3, 3, 4, 4, 5, 5, 6] }),
  },
  frostnova: {
    name: 'Frost Nova', from: 6, intro: 'Every few seconds a ring of frost bursts out of you, hurting and freezing everything it touches.', icon: { type: 38, colw: 0 },
    fields: [['dmg', 'Damage'], ['radius', 'Radius', 'm'], ['freeze', 'Freeze', 's'], ['cd', 'Cooldown', 's']],
    levels: L10({ dmg: [12, 14, 16, 18, 21, 24, 27, 31, 35, 40], radius: [2.8, 2.9, 3.0, 3.2, 3.4, 3.6, 3.8, 4.0, 4.3, 4.6], freeze: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.9, 2.1, 2.4], cd: [5, 4.9, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.6, 3.3] }),
  },
  shield: {
    name: 'Bubble Shield', intro: 'A goo bubble absorbs hits, then grows back.', icon: { type: 27, colw: 0 },
    fields: [['hits', 'Hits absorbed'], ['recharge', 'Regrows in', 's'], ['pop', 'Pop damage'], ['push', 'Pop knockback', 'm']],
    levels: L10({ hits: [1, 1, 1, 1, 1, 2, 2, 2, 2, 3], recharge: [12, 11.5, 11, 10.5, 10, 9.5, 9, 8.5, 8, 7], pop: [0, 0, 0, 0, 8, 8, 12, 12, 16, 20], push: [0, 0, 0, 0, 1.5, 1.5, 2, 2, 2.5, 3] }),
  },
};

// Passives ("blob abilities"): 10 levels each (Projectile Count adds a whole projectile per level, so it stays at 2)
const PASSIVES = {
  thick: { name: 'Thick Goo', desc: '+10% max health, and heals that amount.', max: 10, icon: { type: 25, colw: 0 } },
  regen: { name: 'Regen', desc: 'Heal 0.2% of max health every second.', max: 10, icon: { type: 10, colw: 4 } },
  speed: { name: 'Speed', desc: '+4% move speed.', max: 10, icon: { type: 1, colw: 0 } },
  magnet: { name: 'Magnet', desc: '+15% gem pickup radius.', max: 10, icon: { type: 11, colw: 4 } },
  power: { name: 'Power', desc: '+5% damage.', max: 10, icon: { type: 20, colw: 0 } },
  armor: { name: 'Armor', desc: 'Take 3% less damage.', max: 10, icon: { type: 21, colw: 0 } },
  haste: { name: 'Haste', desc: 'Skills recharge 4% faster.', max: 10, icon: { type: 22, colw: 0 } },
  reach: { name: 'Reach', desc: '+5% skill area.', max: 10, icon: { type: 23, colw: 0 } },
  multishot: { name: 'Projectile Count', desc: '+1 projectile for Blob Ball, Blob Missile, Goo Axe and Bouncy Ball.', max: 2, icon: { type: 24, colw: 0.4 } },
  sugar: { name: 'Sugar Rush', from: 5, desc: 'Every 25 kills sends you on a 4 s sugar rush: +12% speed and +12% faster skills, +3% more each level.', max: 10, icon: { type: 37, colw: 0 } },
  thorns: { name: 'Thorns', from: 8, desc: 'Enemies that touch you take 10 damage and get shoved away, +5 damage each level.', max: 10, icon: { type: 40, colw: 2.5 } },
  growth: { name: 'Growth', desc: '+4% XP from gems.', max: 10, icon: { type: 8, colw: 0 } },
};
const maxLevel = id => (SKILLS[id] ? SKILL_MAX : PASSIVES[id].max);
// the power-up a chapter's theme introduces (from: the first chapter it appears in)
// Evolutions: a skill at max level plus its partner ability turns into a stronger, named form, through a chest.
// boost(L) gets the skill's level-10 stats and returns the ones the evolved form changes.
const EVOLUTIONS = {
  ball: { with: 'multishot', name: 'Goo Gatling', desc: 'A bit faster, one more ball, all molten gold.', boost: L => ({ dmg: Math.round(L.dmg * 1.1), cd: +(L.cd * 0.85).toFixed(2), count: L.count + 1 }) },
  fists: { with: 'power', name: 'Titan Fists', desc: 'Heavier, slightly longer punches with bigger shockwaves.', boost: L => ({ dmg: Math.round(L.dmg * 1.2), reach: +(L.reach * 1.1).toFixed(1), shock: 1.3 }) },
  grenade: { with: 'reach', name: 'Cluster Bomb', desc: 'One more grenade with a slightly bigger blast.', boost: L => ({ dmg: Math.round(L.dmg * 1.15), count: L.count + 1, radius: +(L.radius * 1.1).toFixed(1) }) },
  missile: { with: 'haste', name: 'Missile Swarm', desc: 'One more golden missile, a little faster, with wider splash.', boost: L => ({ count: L.count + 1, cd: +(L.cd * 0.9).toFixed(2), splash: +(L.splash * 1.2).toFixed(1) }) },
  blade: { with: 'speed', name: 'Buzzsaw Halo', desc: 'One more blade, spinning a little wider and faster.', boost: L => ({ dmg: Math.round(L.dmg * 1.15), count: L.count + 1, radius: +(L.radius * 1.1).toFixed(1), spin: Math.round(L.spin * 1.1) }) },
  lightning: { with: 'magnet', name: 'Thunder God', desc: 'One more strike that chains one step further.', boost: L => ({ dmg: Math.round(L.dmg * 1.15), strikes: L.strikes + 1, chain: L.chain + 1 }) },
  aura: { with: 'thick', name: 'Toxic Bog', desc: 'A wider, stickier puddle that burns a little harder.', boost: L => ({ dmg: Math.round(L.dmg * 1.25), radius: +(L.radius * 1.15).toFixed(1), slow: Math.min(70, L.slow + 10) }) },
  frostnova: { with: 'armor', name: 'Absolute Zero', desc: 'A wider, longer freeze; frozen enemies take 20% more damage from everything.', boost: L => ({ dmg: Math.round(L.dmg * 1.25), radius: +(L.radius * 1.15).toFixed(1), freeze: +(L.freeze * 1.2).toFixed(1) }) },
  meteor: { with: 'growth', name: 'Armageddon', desc: 'One more meteor, a little bigger and a little more often.', boost: L => ({ count: L.count + 1, radius: +(L.radius * 1.1).toFixed(1), cd: +(L.cd * 0.9).toFixed(1) }) },
  wave: { with: 'regen', name: 'Tsunami', desc: 'Wider, harder waves; each enemy they hit heals you a tiny bit.', boost: L => ({ dmg: Math.round(L.dmg * 1.2), width: +(L.width * 1.15).toFixed(1) }) },
  bouncy: { with: 'sugar', name: 'Jawbreaker', desc: 'Bigger candy-hard balls that bounce three more times.', boost: L => ({ dmg: Math.round(L.dmg * 1.15), bounces: L.bounces + 3, size: +(L.size * 1.15).toFixed(2) }) },
  axe: { with: 'thorns', name: 'Bramble Axes', desc: 'One more axe, thrown a little farther.', boost: L => ({ dmg: Math.round(L.dmg * 1.15), count: L.count + 1, range: +(L.range * 1.1).toFixed(1) }) },
};
function featuredPowerup(chapter) {
  const want = ((chapter - 1) % CHAPTER_BOSSES.length) + 1;
  if (want < 2) return null;
  for (const id in SKILLS) if (SKILLS[id].from === want) return id;
  for (const id in PASSIVES) if (PASSIVES[id].from === want) return id;
  return null;
}
// a run holds at most this many different skills and this many different passives
const SLOT_LIMIT = { skill: 4, passive: 4 };

// Enemies stand a little shorter than the hero (the hero is about 1.9 tall, a stickman model 1.13 at scale 1).
// ai: how the enemy attacks besides walking into you. lunge = spear thrust, chop = overhead swing,
// toss = arcing javelin, bomb = runs up and explodes, ranged = bow.
const ENEMY_TYPES = {
  stickman: { model: 'stickman', hp: 12, speed: 2.2, dmg: 4, xp: 1, radius: 0.4, scale: 1.35, tint: '#f5891f', mass: 1 },
  sprinter: { model: 'sprinter', hp: 8, speed: 3.5, dmg: 3, xp: 1, radius: 0.36, scale: 1.3, tint: '#ffad2e', mass: 0.8 },
  helmet: { model: 'helmet', hp: 26, speed: 1.9, dmg: 5, xp: 2, radius: 0.42, scale: 1.4, tint: '#f28a2a', mass: 1.4 },
  spear: { model: 'spear', hp: 18, speed: 2.0, dmg: 5, xp: 2, radius: 0.4, scale: 1.35, tint: '#f5931f', mass: 1.1, ai: 'lunge', hit: 10 },
  axe: { model: 'axe', hp: 32, speed: 1.8, dmg: 7, xp: 3, radius: 0.44, scale: 1.45, tint: '#ee7420', mass: 1.5, ai: 'chop', hit: 16, wind: 0.6 },
  brute: { model: 'brute', hp: 70, speed: 1.6, dmg: 10, xp: 5, radius: 0.7, scale: 2.0, tint: '#e8642a', mass: 4, ai: 'chop', hit: 15, wind: 0.85, reach: 1.5 },
  archer: { model: 'archer', hp: 16, speed: 2.0, dmg: 5, shot: 6, xp: 2, radius: 0.4, scale: 1.35, tint: '#f28a2a', mass: 1, ranged: true },
  javelin: { model: 'javelin', hp: 16, speed: 2.0, dmg: 5, xp: 2, radius: 0.4, scale: 1.35, tint: '#f69a2c', mass: 1, ai: 'toss', hit: 11 },
  splitter: { model: 'splitter', hp: 28, speed: 2.0, dmg: 6, xp: 2, radius: 0.46, scale: 1.45, tint: '#f6a03a', mass: 1.5, splits: true },
  mini: { model: 'stickman', hp: 7, speed: 2.6, dmg: 3, xp: 1, radius: 0.28, scale: 0.85, tint: '#ffb85a', mass: 0.5 },
  shield: { model: 'shield', hp: 45, speed: 1.8, dmg: 8, xp: 3, radius: 0.44, scale: 1.4, tint: '#f5891f', mass: 1.6, shield: true },
  bomber: { model: 'bomber', hp: 10, speed: 3.0, dmg: 4, xp: 2, radius: 0.4, scale: 1.35, tint: '#ffb02e', mass: 0.9, ai: 'bomb', hit: 18 },
  slime: { model: 'slime', hp: 22, speed: 2.6, dmg: 6, xp: 2, radius: 0.45, scale: 1.5, tint: '#ff6f96', mass: 0.9 },
  // the Golden Gooblin: a rare treasure runner that flees, spills coins when hit and escapes after a while
  gooblin: { model: 'gooblin', hp: 90, speed: 3.5, dmg: 0, xp: 8, radius: 0.55, scale: 1.65, tint: '#ffc93a', mass: 1.5, flee: true },
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
  stomper: { name: 'Big Stomper', model: 'stomper', hp: 2500, speed: 1.6, dmg: 14, scale: 2.8, radius: 1.15, tint: '#ff6f8f', mass: 60 },
  hurler: { name: 'Hurler', model: 'hurler', hp: 2200, speed: 2.4, dmg: 12, scale: 2.6, radius: 0.95, tint: '#9a7bff', mass: 60 },
  charger: { name: 'Charger', model: 'charger', hp: 2600, speed: 1.9, dmg: 14, scale: 2.7, radius: 1.1, tint: '#e2504f', mass: 60 },
  twins: { name: 'Twins', model: 'twin', hp: 1400, speed: 2.4, dmg: 12, scale: 2.3, radius: 0.9, tint: '#ff70b0', tint2: '#9a6bff', mass: 60 },
  conductor: { name: 'Conductor', model: 'conductor', hp: 2800, speed: 0.9, dmg: 12, scale: 2.8, radius: 1.0, tint: '#ff79aa', mass: 60 },
};
// Chapter bosses beyond the first are drawn and driven in 13a-bosses.js (noDrop: they make their own entrance)
BOSS_TYPES.pumpking = { name: 'Pumpkin King', model: 'pumpking', meshes: ['pumpking', 'pumpkin'], hp: 4300, speed: 2.3, dmg: 20, scale: 2.8, radius: 1.2, tint: '#3a2850', mass: 60, portraitTop: 1.12 };
BOSS_TYPES.ufo = { name: 'UFO Overlord', model: 'ufo', meshes: ['ufo', 'alien'], hp: 4200, speed: 2.6, dmg: 20, scale: 2.6, radius: 2.0, tint: '#9a6aff', mass: 60, portraitTop: 1.1 };
BOSS_TYPES.crab = { name: 'Captain Crab', model: 'crab', meshes: ['crab', 'crabclaw', 'crableg'], hp: 4100, speed: 3.2, dmg: 20, scale: 2.6, radius: 1.7, tint: '#ff5a3a', mass: 60, portraitTop: 0.95 };
BOSS_TYPES.hydra = { name: 'Vine Hydra', model: 'hydrabody', meshes: ['hydrabody', 'hydrahead', 'vineseg', 'roots'], hp: 4000, speed: 1.0, dmg: 20, scale: 2.6, radius: 1.6, tint: '#4fae4a', mass: 60, portraitTop: 1.0 };
BOSS_TYPES.magma = { name: 'Magma Golem', model: 'golem', meshes: ['golem'], hp: 3900, speed: 1.7, dmg: 20, scale: 3.0, radius: 1.3, tint: '#7a5a50', mass: 60, portraitTop: 1.05 };
BOSS_TYPES.yeti = { name: 'Frost Yeti', model: 'yeti', meshes: ['yeti', 'icicle', 'icespike'], hp: 3800, speed: 2.1, dmg: 18, scale: 2.8, radius: 1.2, tint: '#6fa8f2', mass: 60, portraitTop: 1.05 };
BOSS_TYPES.jellyqueen = { name: 'Jelly Queen', meshes: ['slime'], hp: 3700, speed: 1.7, dmg: 18, scale: 2.5, radius: 1.9, tint: '#ff5c78', mass: 60, portraitTop: 1.75 };
BOSS_TYPES.bigbounce = { name: 'Big Bounce', meshes: [], hp: 3600, speed: 3, dmg: 18, scale: 2.4, radius: 2.0, tint: '#ff3b4f', mass: 60, portraitTop: 2.1 };
BOSS_TYPES.wreckbot = { name: 'Wrecking Bot', model: 'wreckbot', meshes: ['wreckbot', 'wreckball'], hp: 3500, speed: 1.9, dmg: 16, scale: 2.9, radius: 1.15, tint: '#ffc21f', mass: 60, portraitTop: 1.05 };
BOSS_TYPES.sandworm = { name: 'Sand Worm', meshes: ['wormhead', 'wormseg'], hp: 3400, speed: 3.6, dmg: 18, scale: 2.4, radius: 1.05, tint: '#a856d6', mass: 60, noDrop: true, portraitTop: 1.25 };
const BOSS_ORDER = ['stomper', 'hurler', 'charger', 'twins', 'conductor'];
// meshes a boss needs (custom-drawn bosses list theirs in meshes; the rest use model)
const bossMeshes = id => BOSS_TYPES[id].meshes || [BOSS_TYPES[id].model];

// Arenas: one theme per chapter; chapters 11+ repeat them. floor: floor shader style.
// props / zones: [kind, count per 40x40 of floor, min radius, max radius]; wall: the prop kind ringing the edge.
const ARENAS = [
  { id: 'plaza', name: 'Stone Plaza', floor: 0, stoneA: '#34536e', stoneB: '#3c5e7b', grout: '#08121c', accent: '#4dffa0', fog: '#0a1f33', sky: '#7aa3c8', ground: '#16304a', light: '#fff6ea', spotMin: 0.5, shadowTint: '#0a1f3a', rock: '#8592a0', pool: '#1f7a9c', poolGlow: 0.05,
    props: [['rock', 11, 0.8, 1.4]], zones: [['pool', 4, 1.7, 2.6]], wall: 'rock' },
  { id: 'desert', name: 'Desert Dunes', floor: 1, stoneA: '#e8c08a', stoneB: '#d29f66', grout: '#5e3b22', accent: '#ffcf70', fog: '#4b2d18', sky: '#f6dcb0', ground: '#a87a48', light: '#fff2d8', spotMin: 0.6, shadowTint: '#5c2f10', rock: '#c4875a', pool: '#a8793f', poolGlow: 0,
    props: [['cactus', 12, 0.4, 0.62], ['rock', 6, 0.9, 1.5], ['skull', 4, 0.45, 0.55]], zones: [['quicksand', 5, 2.0, 3.2]], wall: 'rock', kinds: ['tumbleweed'] },
  { id: 'city', name: 'Neon City', floor: 2, stoneA: '#5a6172', stoneB: '#8d95a6', grout: '#262a35', accent: '#ff4fd8', fog: '#0c0e1d', sky: '#6070b0', ground: '#1a2036', light: '#e8ecff', spotMin: 0.52, shadowTint: '#0a0e2c', rock: '#7c8292', pool: '#2f5f8f', poolGlow: 0.1,
    props: [['hydrant', 3, 0.22, 0.26], ['bin', 3, 0.28, 0.32]], zones: [], wall: 'barrier', kinds: ['building', 'tower', 'car', 'streetlamp', 'tree'] },
  { id: 'bounce', name: 'Bounce House', floor: 3, stoneA: '#f27a9c', stoneB: '#62aef0', grout: '#4b2f73', accent: '#6fd49a', fog: '#2a2458', sky: '#cfe8ff', ground: '#e88aa8', light: '#ffffff', spotMin: 0.7, shadowTint: '#3a1f66', rock: '#ff9f40', pool: '#5a4a9a', poolGlow: 0,
    props: [['bumper', 6, 0.8, 1.1]], zones: [['pit', 1.6, 3.0, 4.2]], wall: 'tubewall', kinds: ['pitball'] },
  { id: 'candy', name: 'Candy Land', floor: 4, stoneA: '#ffb6d2', stoneB: '#fff0dc', grout: '#6a3048', accent: '#ff4f9a', fog: '#4a2242', sky: '#ffe4f2', ground: '#e8a2c2', light: '#fff8fb', spotMin: 0.7, shadowTint: '#6a2a52', rock: '#ff7fb0', pool: '#5a2e1a', poolGlow: 0,
    props: [['lollipop', 5, 0.32, 0.4], ['candycane', 5, 0.3, 0.36], ['gumdrop', 7, 0.8, 1.3], ['cupcake', 3, 0.7, 0.9]], zones: [['chocolate', 4, 2.0, 3.0]], wall: 'gumdrop' },
  { id: 'tundra', name: 'Frozen Tundra', floor: 5, stoneA: '#eef5fc', stoneB: '#c2d6ec', grout: '#7a93b0', accent: '#7fd8ff', fog: '#1a2a46', sky: '#e2f1ff', ground: '#b4c8de', light: '#e6eff9', spotMin: 0.62, shadowTint: '#28487a', rock: '#a9bccf', pool: '#bfe6ff', poolGlow: 0.04,
    props: [['pine', 8, 0.42, 0.6], ['icecrystal', 4, 0.6, 0.9], ['snowman', 2, 0.5, 0.6], ['rock', 3, 0.8, 1.2]], zones: [['ice', 3, 3.0, 4.6]], wall: 'iceblock' },
  { id: 'volcano', name: 'Volcano', floor: 6, stoneA: '#3d3230', stoneB: '#2b2321', grout: '#140c0a', accent: '#ff6a1a', fog: '#1c0b06', sky: '#ffa060', ground: '#2c1c16', light: '#ffe2c8', spotMin: 0.55, shadowTint: '#1c0804', rock: '#54443f', pool: '#f04a0c', poolGlow: 0.3,
    props: [['obsidian', 4, 0.6, 0.9], ['vent', 2.2, 0.55, 0.65], ['deadtree', 3, 0.4, 0.55], ['rock', 5, 0.8, 1.3]], zones: [['lava', 2.4, 2.4, 3.6]], wall: 'basalt' },
  { id: 'jungle', name: 'Jungle Swamp', floor: 7, stoneA: '#5a9a40', stoneB: '#3f7a2e', grout: '#6e5034', accent: '#c8ff5a', fog: '#0c2212', sky: '#b0e8a0', ground: '#2c4c22', light: '#fff2d6', spotMin: 0.52, shadowTint: '#0a2a10', rock: '#7a866a', pool: '#4a5e2a', poolGlow: 0.04,
    props: [['jtree', 6, 0.45, 0.6], ['mushroom', 4, 0.5, 0.75], ['fern', 6, 0.6, 0.9], ['rock', 3, 0.8, 1.2]], zones: [['swamp', 3, 2.8, 4.2]], wall: 'bamboo' },
  { id: 'beach', name: 'Pirate Beach', floor: 8, stoneA: '#f2dcae', stoneB: '#d6b480', grout: '#8a6a44', accent: '#4fd8ff', fog: '#123a4a', sky: '#bfe8ff', ground: '#c8a878', light: '#fff6e4', spotMin: 0.62, shadowTint: '#3a4a6a', rock: '#9a8a7a', pool: '#2fb0d8', poolGlow: 0.1,
    props: [['palm', 6, 0.42, 0.55], ['barrel', 3, 0.3, 0.36], ['crate', 3, 0.34, 0.4], ['rock', 3, 0.8, 1.2], ['starfish', 4, 0.3, 0.4]], zones: [['tidepool', 3, 2.0, 3.0]], wall: 'post' },
  { id: 'moon', name: 'Moon Base', floor: 9, stoneA: '#b8bcc8', stoneB: '#979dab', grout: '#3a3e4a', accent: '#7af0ff', fog: '#05060f', sky: '#3a4070', ground: '#2a2e40', light: '#eef2ff', spotMin: 0.5, shadowTint: '#0a0c20', rock: '#7c808c', pool: '#3ad8ff', poolGlow: 0.5,
    props: [['dish', 2.5, 0.55, 0.7], ['lander', 2, 0.42, 0.5], ['habdome', 2, 0.9, 1.2], ['rock', 5, 0.8, 1.3]], zones: [['boost', 2.4, 2.0, 2.8]], wall: 'moonwall' },
  { id: 'graveyard', name: 'Haunted Graveyard', floor: 10, stoneA: '#4a5a3a', stoneB: '#33402c', grout: '#221a14', accent: '#b06aff', fog: '#120c1e', sky: '#6a5a8a', ground: '#1e2420', light: '#e6deff', spotMin: 0.46, shadowTint: '#100a1e', rock: '#6a6a72', pool: '#3a2a5a', poolGlow: 0.1,
    props: [['tombstone', 10, 0.52, 0.64], ['pumpkin', 5, 0.38, 0.48], ['gravetree', 4, 0.42, 0.58], ['rock', 2, 0.8, 1.1]], zones: [['mist', 3, 2.2, 3.4]], wall: 'fence' },
];
// Static scenery. models: mesh names (one picked at random); unit: footprint radius at scale 1;
// tint: hex, or 'rock' for the arena's rock color; block: stops movement; shots: also stops enemy shots
const PROP_KINDS = {
  rock: { models: ['rock0', 'rock1', 'rock2'], unit: 0.45, tint: 'rock', block: true, shots: true },
  cactus: { models: ['cactus0', 'cactus0', 'cactus1'], unit: 0.3, block: true, shots: true, tall: 1.6 },
  skull: { models: ['skull'], unit: 0.35, block: false },
  tumbleweed: { models: ['tumbleweed'], unit: 0.45, block: false },
  building: { models: ['building0', 'building1', 'building2'], unit: 0.5, block: true, shots: true, shadow: false, tall: 14 },
  tower: { models: ['tower'], unit: 0.5, block: true, shots: true, shadow: false, tall: 30 },
  car: { models: ['car'], unit: 0.5, block: true, shots: true, shadow: false },
  streetlamp: { models: ['streetlamp'], unit: 0.12, block: true, tall: 8 },
  hydrant: { models: ['hydrant'], unit: 0.12, block: true },
  bin: { models: ['bin'], unit: 0.15, block: true },
  barrier: { models: ['barrier'], unit: 0.5, block: true, shots: true, wallStep: 1.7, wallR: [0.9, 0.9], faceIn: true },
  tree: { models: ['tree'], unit: 0.18, block: true, tall: 3 },
  bumper: { models: ['bumper'], unit: 0.45, block: true, shots: false, tint: '#ff4f9a', tall: 2 },
  tubewall: { models: ['tubewall'], unit: 0.5, block: true, shots: true, tint: '#ffd23a', wallStep: 1.7, wallR: [0.95, 1.05] },
  pitball: { models: ['pitball'], unit: 0.5, block: false },
  lollipop: { models: ['lollipop'], unit: 0.12, block: true, tall: 4 },
  candycane: { models: ['candycane'], unit: 0.11, block: true, tall: 4 },
  gumdrop: { models: ['gumdrop'], unit: 0.42, block: true, shots: true, tints: ['#ff4f6a', '#ffd23a', '#4fc8ff', '#5fe08a', '#b56bff', '#ff8a3a'], wallR: [1.0, 1.4] },
  cupcake: { models: ['cupcake'], unit: 0.32, block: true, shots: true },
  pine: { models: ['pine'], unit: 0.3, block: true, shots: true, tall: 2.4 },
  snowman: { models: ['snowman'], unit: 0.3, block: true, shots: true, tall: 2 },
  icecrystal: { models: ['icecrystal'], unit: 0.35, block: true, shots: true, tints: ['#9fdcff', '#bfe8ff', '#8fc8ff'], tall: 2 },
  iceblock: { models: ['iceblock'], unit: 0.45, block: true, shots: true, tints: ['#a8dcff', '#c6eaff', '#92ceff'], wallR: [1.0, 1.15] },
  icespike: { models: ['icespike'], unit: 0.3, block: true, shots: false, tint: '#86c8ff', shadow: false },
  obsidian: { models: ['obsidian'], unit: 0.35, block: true, shots: true, tall: 2 },
  vent: { models: ['vent'], unit: 0.5, block: true, shots: false },
  deadtree: { models: ['deadtree'], unit: 0.15, block: true, tall: 2.5 },
  jtree: { models: ['jtree'], unit: 0.18, block: true, shots: true, tall: 2.6 },
  mushroom: { models: ['mushroom'], unit: 0.3, block: true, shots: true, tints: ['#ff4a4a', '#ff8a2a', '#c45aff'], tall: 1.6 },
  fern: { models: ['fern'], unit: 0.5, block: false },
  bamboo: { models: ['bamboo'], unit: 0.4, block: true, shots: true, tints: ['#7ab84a', '#5e9a3a', '#8cc858'], wallR: [1.0, 1.2] },
  roots: { models: ['roots'], unit: 0.4, block: false, tint: '#7a5a34', shadow: false },
  palm: { models: ['palm'], unit: 0.15, block: true, shots: true, tall: 3 },
  barrel: { models: ['barrel'], unit: 0.3, block: true, shots: true },
  crate: { models: ['crate'], unit: 0.35, block: true, shots: true },
  starfish: { models: ['starfish'], unit: 0.35, block: false, tints: ['#ff7a5a', '#ffb03a', '#c860ff', '#ff5a8a'], shadow: false },
  post: { models: ['post'], unit: 0.4, block: true, shots: true, wallR: [0.9, 1.05] },
  wreck: { models: ['wreck'], unit: 0.5, block: true, shots: true, shadow: false, tall: 3 },
  dish: { models: ['dish'], unit: 0.4, block: true, shots: true, tall: 2 },
  lander: { models: ['lander'], unit: 0.3, block: true, shots: true, tall: 3 },
  habdome: { models: ['habdome'], unit: 0.6, block: true, shots: true },
  moonwall: { models: ['moonwall'], unit: 0.5, block: true, shots: true, wallStep: 1.7, wallR: [0.9, 0.9], faceIn: true },
  basalt: { models: ['basalt'], unit: 0.45, block: true, shots: true, tints: ['#3a302e', '#2e2624', '#463a36'], wallR: [1.0, 1.2] },
  tombstone: { models: ['tombstone0', 'tombstone0', 'tombstone1'], unit: 0.4, block: true, shots: true, tints: ['#8a8c96', '#777a84', '#9a98a4'], tall: 1.6 },
  pumpkin: { models: ['pumpkin'], unit: 0.36, block: true, shots: true },
  gravetree: { models: ['gravetree'], unit: 0.16, block: true, tall: 2.6 },
  fence: { models: ['fence'], unit: 0.5, block: true, shots: true, wallStep: 1.7, wallR: [0.9, 0.9], faceIn: true },
};
// Ground patches. block: impassable like a pool; slow: speed factor; slide: icy steering; burn: damage per second
const ZONE_KINDS = {
  pool: { block: true },
  quicksand: { slow: 0.5, col: '#a8793f', glow: 0, style: 2 },
  fountain: { block: true, col: '#3fa8e8', glow: 0.15 },
  pit: { slow: 0.82, col: '#3b2d6e', glow: 0, style: 2 },
  chocolate: { slow: 0.55, col: '#5e3018', glow: 0.02 },
  jelly: { slow: 0.45, col: '#ff5f8a', glow: 0.12 },
  ice: { slide: true, col: '#7cc4f0', glow: 0.04, style: 1 },
  lava: { burn: 16, slow: 0.85, col: '#f04a0c', glow: 0.3 },
  swamp: { slow: 0.6, col: '#56702c', glow: 0.03 },
  tidepool: { block: true, col: '#2fb8e0', glow: 0.12 },
  boost: { slow: 1.35, col: '#3ad8ff', glow: 0.55 },
  mist: { slow: 0.7, col: '#7a5aa8', glow: 0.14 },
};

// Each chapter of the cycle (one per entry in CHAPTER_BOSSES) has its own boss; every 5th chapter adds one of the original guests
const CHAPTER_BOSSES = ['stomper', 'sandworm', 'wreckbot', 'bigbounce', 'jellyqueen', 'yeti', 'magma', 'hydra', 'crab', 'ufo', 'pumpking'];
const GUEST_BOSSES = ['hurler', 'charger', 'twins', 'conductor'];
function chapterInfo(n) {
  const i = (n - 1) % CHAPTER_BOSSES.length, arena = i % ARENAS.length;
  const k = n - 1;
  // bosses still being built fall back to the original roster
  const main = BOSS_TYPES[CHAPTER_BOSSES[i]] ? CHAPTER_BOSSES[i] : BOSS_ORDER[i % BOSS_ORDER.length];
  const bosses = n % 5 === 0 ? [main, GUEST_BOSSES[(n / 5 - 1) % GUEST_BOSSES.length]] : [main];
  return {
    n, arena, arenaName: ARENAS[arena].name, bosses,
    hpMul: 1 + 0.09 * k + 0.004 * k * k,
    dmgMul: 1 + 0.06 * k,
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

// Body colors. "top" makes a two-tone gradient from the feet up. "boost" is a small stat bonus (see STAT_INFO).
const SKINS = [
  { id: 'classic', name: 'Classic', cost: 0, base: '#18d2ff', accent: '#7b55f5', rim: '#8ef3ff' },
  { id: 'lime', name: 'Lime', cost: 200, base: '#7be04a', accent: '#1f9e7a', rim: '#d8ffb0', boost: { speed: 3 } },
  { id: 'bubblegum', name: 'Bubblegum', cost: 300, base: '#ff7ac8', accent: '#9a4dff', rim: '#ffd3f0', boost: { hp: 5 } },
  { id: 'sunny', name: 'Sunny', cost: 400, base: '#ffd23a', accent: '#ff8a1f', rim: '#fff3b0', boost: { xp: 5 } },
  { id: 'cherry', name: 'Cherry', cost: 550, base: '#ff4d6d', accent: '#9a2bd6', rim: '#ffc2cc', boost: { dmg: 4 } },
  { id: 'grape', name: 'Grape', cost: 700, base: '#9c6bff', accent: '#ff5fb8', rim: '#e0ccff', boost: { cd: 4 } },
  { id: 'mint', name: 'Mint', cost: 900, base: '#3ef0b8', accent: '#1a8cff', rim: '#c8fff0', boost: { regen: 0.1 } },
  { id: 'snow', name: 'Snow', cost: 1100, base: '#eaf4ff', accent: '#7fb8ff', rim: '#ffffff', boost: { armor: 5 } },
  { id: 'night', name: 'Night', cost: 1300, base: '#34343f', accent: '#ff5fb8', rim: '#a0a0b8', boost: { dmg: 5 } },
  { id: 'galaxy', name: 'Galaxy', cost: 1800, base: '#3f7bff', top: '#b45cff', accent: '#ff5fb8', rim: '#d6c8ff', boost: { area: 6 } },
  { id: 'sunset', name: 'Sunset', cost: 2100, base: '#ff6f91', top: '#ffd23a', accent: '#ff8a1f', rim: '#ffe0c0', boost: { gold: 10 } },
  { id: 'ocean', name: 'Ocean', cost: 2400, base: '#1a8cff', top: '#3ef0b8', accent: '#7b55f5', rim: '#c8fff8', boost: { magnet: 25 } },
  { id: 'peach', name: 'Peach', cost: 250, base: '#ffb38a', accent: '#ff6f91', rim: '#ffe6d6', boost: { hp: 4 } },
  { id: 'sky', name: 'Sky', cost: 250, base: '#7fd4ff', accent: '#3a7bff', rim: '#e0f6ff', boost: { speed: 3 } },
  { id: 'lavender', name: 'Lavender', cost: 300, base: '#c6a8ff', accent: '#7b55f5', rim: '#f0e6ff', boost: { xp: 4 } },
  { id: 'coral', name: 'Coral', cost: 350, base: '#ff7f6b', accent: '#d6345a', rim: '#ffd6cc', boost: { dmg: 3 } },
  { id: 'toxic', name: 'Toxic', cost: 450, base: '#a4ff2e', accent: '#7b2bd6', rim: '#eaffb0', boost: { area: 4 } },
  { id: 'ruby', name: 'Ruby', cost: 600, base: '#d6123c', accent: '#ff8ab0', rim: '#ff9db0', boost: { dmg: 4 } },
  { id: 'emerald', name: 'Emerald', cost: 650, base: '#14c46e', accent: '#ffd23a', rim: '#a8ffd0', boost: { regen: 0.1 } },
  { id: 'sapphire', name: 'Sapphire', cost: 700, base: '#2456ff', accent: '#7fe3ff', rim: '#b8c8ff', boost: { armor: 4 } },
  { id: 'chrome', name: 'Chrome', cost: 1000, base: '#9fadbf', accent: '#4f5d73', rim: '#ffffff', boost: { armor: 5 } },
  { id: 'bumblebee', name: 'Bumblebee', cost: 1200, base: '#2a2a30', top: '#ffd23a', accent: '#ffd23a', rim: '#fff3b0', boost: { speed: 4 } },
  { id: 'watermelon', name: 'Watermelon', cost: 1300, base: '#4cd964', top: '#ff4d6d', accent: '#1f7a3a', rim: '#e0ffd8', boost: { regen: 0.12 } },
  { id: 'cottoncandy', name: 'Cotton Candy', cost: 1400, base: '#8fd8ff', top: '#ffb3e6', accent: '#ff7ac8', rim: '#ffffff', boost: { hp: 6 } },
  { id: 'golden', name: 'Golden', cost: 1500, base: '#f2a900', accent: '#c45f00', rim: '#ffe9a0', boost: { gold: 10 } },
  { id: 'lava', name: 'Lava', cost: 1600, base: '#ff4a1f', top: '#ffd23a', accent: '#b0102a', rim: '#ffd0a0', boost: { dmg: 5 } },
  { id: 'aurora', name: 'Aurora', cost: 1700, base: '#3ef0b8', top: '#9c6bff', accent: '#1a8cff', rim: '#d8fff4', boost: { cd: 5 } },
  { id: 'shadow', name: 'Shadow', cost: 2600, base: '#141420', top: '#5a2bd6', accent: '#ff3b6b', rim: '#9a8cff', boost: { dmg: 6 } },
  { id: 'fire', name: 'Fire', cost: 2800, base: '#ff3b1f', top: '#ffe14a', accent: '#ff8a1f', rim: '#ffe0a0', boost: { area: 6 } },
  { id: 'prism', name: 'Prism', cost: 3000, base: '#ff5fb8', top: '#4ad8ff', accent: '#ffd23a', rim: '#ffffff', boost: { xp: 8 } },
];
SKINS.sort((a, b) => a.cost - b.cost);
// Costumes are extra goo shapes on the hero, offsets in hero units from the head (or pelvis).
// Parts: ['sph', anchor, pos, r, k, col] | ['cap', anchor, a, b, r1, r2, k, col, sway] | ['ell', anchor, pos, radii, k, col]
// col: 'b' = body color, 0-3 = this costume's palette. sway lets a tip lag and bob with the head.
const COSTUMES = [
  { id: 'none', name: 'No costume', cost: 0, pal: [], parts: [] },
  { id: 'bunny', name: 'Bunny', cost: 250, boost: { speed: 4 }, pal: ['#ffffff'], parts: [
    ['cap', 'head', [0.09, 0.15, -0.02], [0.15, 0.56, -0.07], 0.078, 0.062, 0.05, 'b', 0.05],
    ['cap', 'head', [-0.09, 0.15, -0.02], [-0.15, 0.56, -0.07], 0.078, 0.062, 0.05, 'b', 0.05],
  ] },
  { id: 'cat', name: 'Cat', cost: 350, boost: { xp: 6 }, pal: ['#1c1a22', '#ff9ac8'], parts: [
    ['cap', 'head', [0.11, 0.14, 0.0], [0.17, 0.34, 0.02], 0.09, 0.018, 0.04, 'b'],
    ['cap', 'head', [-0.11, 0.14, 0.0], [-0.17, 0.34, 0.02], 0.09, 0.018, 0.04, 'b'],
    ['sph', 'head', [0, -0.02, 0.225], 0.03, 0.015, 1],
  ] },
  { id: 'bear', name: 'Bear', cost: 500, boost: { hp: 6 }, pal: ['#1c1a22', '#ffe2b8'], parts: [
    ['sph', 'head', [0.17, 0.16, -0.02], 0.085, 0.04, 'b'],
    ['sph', 'head', [-0.17, 0.16, -0.02], 0.085, 0.04, 'b'],
    ['ell', 'head', [0, -0.05, 0.19], [0.1, 0.07, 0.07], 0.03, 1],
    ['sph', 'head', [0, -0.01, 0.255], 0.035, 0.012, 0],
  ] },
  { id: 'chick', name: 'Chick', cost: 600, boost: { magnet: 25 }, pal: ['#16141c', '#ffb020'], parts: [
    ['cap', 'head', [0, -0.02, 0.19], [0, -0.04, 0.34], 0.065, 0.012, 0.025, 1],
    ['sph', 'head', [0.085, 0.07, 0.195], 0.042, 0.012, 0],
    ['sph', 'head', [-0.085, 0.07, 0.195], 0.042, 0.012, 0],
    ['cap', 'head', [0, 0.19, 0.0], [0.05, 0.33, 0.04], 0.03, 0.01, 0.03, 'b', 0.03],
    ['cap', 'head', [0, 0.19, 0.0], [-0.04, 0.31, 0.06], 0.03, 0.01, 0.03, 'b', 0.03],
  ] },
  { id: 'frog', name: 'Frog', cost: 700, boost: { area: 5 }, pal: ['#16141c', '#ffffff'], parts: [
    ['sph', 'head', [0.1, 0.17, 0.07], 0.08, 0.05, 'b'],
    ['sph', 'head', [-0.1, 0.17, 0.07], 0.08, 0.05, 'b'],
    ['sph', 'head', [0.1, 0.19, 0.12], 0.055, 0.012, 1],
    ['sph', 'head', [-0.1, 0.19, 0.12], 0.055, 0.012, 1],
    ['sph', 'head', [0.1, 0.2, 0.172], 0.03, 0.008, 0],
    ['sph', 'head', [-0.1, 0.2, 0.172], 0.03, 0.008, 0],
  ] },
  { id: 'panda', name: 'Panda', cost: 900, boost: { armor: 5 }, pal: ['#16141c', '#f6f6f2'], parts: [
    ['sph', 'head', [0, 0.005, 0.0], 0.238, 0.02, 1],
    ['sph', 'head', [0.165, 0.165, -0.02], 0.072, 0.025, 0],
    ['sph', 'head', [-0.165, 0.165, -0.02], 0.072, 0.025, 0],
    ['ell', 'head', [0.08, 0.035, 0.19], [0.06, 0.075, 0.05], 0.012, 0],
    ['ell', 'head', [-0.08, 0.035, 0.19], [0.06, 0.075, 0.05], 0.012, 0],
    ['sph', 'head', [0, -0.045, 0.235], 0.03, 0.01, 0],
  ] },
  { id: 'devil', name: 'Devil', cost: 1200, boost: { dmg: 5 }, pal: ['#e8283c'], parts: [
    ['cap', 'head', [0.1, 0.15, 0.03], [0.16, 0.31, 0.0], 0.05, 0.01, 0.03, 0],
    ['cap', 'head', [-0.1, 0.15, 0.03], [-0.16, 0.31, 0.0], 0.05, 0.01, 0.03, 0],
    ['cap', 'pelvis', [0, -0.05, -0.22], [0, -0.2, -0.44], 0.04, 0.03, 0.04, 0, 0.06],
    ['ell', 'pelvis', [0, -0.12, -0.56], [0.07, 0.07, 0.04], 0.03, 0],
  ] },
  { id: 'unicorn', name: 'Unicorn', cost: 1500, boost: { cd: 5 }, pal: ['#ffd040', '#ffffff'], parts: [
    ['cap', 'head', [0, 0.16, 0.09], [0, 0.44, 0.16], 0.05, 0.008, 0.03, 0],
    ['cap', 'head', [0.12, 0.14, -0.02], [0.16, 0.27, -0.04], 0.06, 0.02, 0.03, 'b'],
    ['cap', 'head', [-0.12, 0.14, -0.02], [-0.16, 0.27, -0.04], 0.06, 0.02, 0.03, 'b'],
  ] },
  { id: 'party', name: 'Party Hat', cost: 1800, boost: { gold: 12 }, pal: ['#ff4fa8', '#ffd040'], parts: [
    ['cap', 'head', [0.02, 0.17, 0.0], [0.06, 0.5, -0.03], 0.13, 0.012, 0.02, 0],
    ['sph', 'head', [0.065, 0.53, -0.035], 0.045, 0.015, 1, 0.03],
  ] },
  // animal hoods, panda style: a head cover in the animal's color plus ears, muzzle and nose
  { id: 'fox', name: 'Fox', cost: 400, boost: { xp: 5 }, pal: ['#ff8a2a', '#fff8ee', '#16141c'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['cap', 'head', [0.12, 0.15, 0], [0.19, 0.36, -0.01], 0.085, 0.012, 0.03, 0],
    ['cap', 'head', [-0.12, 0.15, 0], [-0.19, 0.36, -0.01], 0.085, 0.012, 0.03, 0],
    ['ell', 'head', [0, -0.07, 0.17], [0.13, 0.08, 0.09], 0.03, 1],
    ['sph', 'head', [0, -0.04, 0.25], 0.032, 0.01, 2],
    ['cap', 'pelvis', [0, -0.02, -0.22], [0, -0.1, -0.5], 0.09, 0.13, 0.06, 0],
    ['sph', 'pelvis', [0, -0.12, -0.6], 0.1, 0.06, 1],
  ] },
  { id: 'penguin', name: 'Penguin', cost: 450, boost: { armor: 4 }, pal: ['#1c1d26', '#ffffff', '#ffa020'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['ell', 'head', [0, -0.02, 0.12], [0.16, 0.15, 0.13], 0.02, 1],
    ['cap', 'head', [0, -0.03, 0.22], [0, -0.05, 0.33], 0.05, 0.012, 0.02, 2],
    ['sph', 'head', [0.065, 0.045, 0.232], 0.026, 0.008, 0],
    ['sph', 'head', [-0.065, 0.045, 0.232], 0.026, 0.008, 0],
    ['ell', 'chest', [0, -0.05, 0.12], [0.24, 0.26, 0.18], 0.03, 1],
  ] },
  { id: 'mouse', name: 'Mouse', cost: 300, boost: { speed: 4 }, pal: ['#b8bcc8', '#ff9ac8'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['ell', 'head', [0.19, 0.17, -0.02], [0.12, 0.12, 0.035], 0.03, 0],
    ['ell', 'head', [-0.19, 0.17, -0.02], [0.12, 0.12, 0.035], 0.03, 0],
    ['ell', 'head', [0.19, 0.17, 0.008], [0.08, 0.08, 0.02], 0.01, 1],
    ['ell', 'head', [-0.19, 0.17, 0.008], [0.08, 0.08, 0.02], 0.01, 1],
    ['sph', 'head', [0, -0.03, 0.235], 0.035, 0.012, 1],
  ] },
  { id: 'koala', name: 'Koala', cost: 550, boost: { regen: 0.1 }, pal: ['#9aa3b0', '#f2f2f2', '#2a2630'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['sph', 'head', [0.2, 0.12, -0.01], 0.105, 0.04, 0],
    ['sph', 'head', [-0.2, 0.12, -0.01], 0.105, 0.04, 0],
    ['ell', 'head', [0.215, 0.12, 0.045], [0.06, 0.07, 0.04], 0.015, 1],
    ['ell', 'head', [-0.215, 0.12, 0.045], [0.06, 0.07, 0.04], 0.015, 1],
    ['ell', 'head', [0, -0.03, 0.22], [0.05, 0.07, 0.04], 0.012, 2],
  ] },
  { id: 'pig', name: 'Pig', cost: 350, boost: { gold: 8 }, pal: ['#ffb0c8', '#d9587f'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['cap', 'head', [0, -0.04, 0.19], [0, -0.04, 0.27], 0.075, 0.075, 0.02, 0],
    ['sph', 'head', [0.027, -0.04, 0.338], 0.017, 0.005, 1],
    ['sph', 'head', [-0.027, -0.04, 0.338], 0.017, 0.005, 1],
    ['cap', 'head', [0.13, 0.15, 0], [0.2, 0.26, 0.06], 0.06, 0.015, 0.02, 0, 0.02],
    ['cap', 'head', [-0.13, 0.15, 0], [-0.2, 0.26, 0.06], 0.06, 0.015, 0.02, 0, 0.02],
  ] },
  { id: 'tiger', name: 'Tiger', cost: 900, boost: { dmg: 5 }, pal: ['#ff9a1f', '#ffffff', '#1c1a22'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['sph', 'head', [0.16, 0.16, -0.01], 0.07, 0.03, 0],
    ['sph', 'head', [-0.16, 0.16, -0.01], 0.07, 0.03, 0],
    ['ell', 'head', [0, -0.07, 0.17], [0.12, 0.075, 0.09], 0.03, 1],
    ['sph', 'head', [0, -0.035, 0.245], 0.03, 0.01, 2],
    ['ell', 'head', [0, 0.17, 0.155], [0.016, 0.085, 0.04], 0.006, 2],
    ['ell', 'head', [0.21, 0.0, 0.08], [0.03, 0.016, 0.07], 0.006, 2],
    ['ell', 'head', [-0.21, 0.0, 0.08], [0.03, 0.016, 0.07], 0.006, 2],
  ] },
  { id: 'dog', name: 'Puppy', cost: 400, boost: { magnet: 20 }, pal: ['#8a5a33', '#16141c', '#ff6f91'], parts: [
    ['ell', 'head', [0.215, 0.0, -0.01], [0.045, 0.15, 0.1], 0.03, 0],
    ['ell', 'head', [-0.215, 0.0, -0.01], [0.045, 0.15, 0.1], 0.03, 0],
    ['ell', 'head', [0, -0.06, 0.18], [0.1, 0.07, 0.08], 0.03, 'b'],
    ['sph', 'head', [0, -0.03, 0.255], 0.035, 0.01, 1],
    ['ell', 'head', [0.02, -0.14, 0.21], [0.035, 0.05, 0.02], 0.01, 2],
  ] },
  { id: 'elephant', name: 'Elephant', cost: 800, boost: { hp: 6 }, pal: ['#a8b4c4', '#ffd6e0'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['ell', 'head', [0.24, 0.02, -0.02], [0.05, 0.17, 0.15], 0.03, 0],
    ['ell', 'head', [-0.24, 0.02, -0.02], [0.05, 0.17, 0.15], 0.03, 0],
    ['cap', 'head', [0, -0.02, 0.2], [0, -0.2, 0.3], 0.07, 0.045, 0.03, 0, 0.03],
  ] },
  { id: 'owl', name: 'Owl', cost: 750, boost: { xp: 7 }, pal: ['#8a5a33', '#ffffff', '#16141c', '#ffb020'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['ell', 'head', [0.085, 0.03, 0.2], [0.075, 0.075, 0.04], 0.012, 1],
    ['ell', 'head', [-0.085, 0.03, 0.2], [0.075, 0.075, 0.04], 0.012, 1],
    ['sph', 'head', [0.085, 0.03, 0.24], 0.035, 0.008, 2],
    ['sph', 'head', [-0.085, 0.03, 0.24], 0.035, 0.008, 2],
    ['cap', 'head', [0, -0.02, 0.22], [0, -0.08, 0.26], 0.03, 0.008, 0.01, 3],
    ['cap', 'head', [0.13, 0.17, 0], [0.2, 0.3, -0.02], 0.05, 0.01, 0.02, 0],
    ['cap', 'head', [-0.13, 0.17, 0], [-0.2, 0.3, -0.02], 0.05, 0.01, 0.02, 0],
  ] },
  { id: 'shark', name: 'Shark', cost: 1000, boost: { dmg: 5 }, pal: ['#7f95ad', '#ffffff', '#3a1a24'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['ell', 'head', [0, 0.28, -0.06], [0.03, 0.12, 0.09], 0.04, 0],
    ['ell', 'head', [0, -0.06, 0.15], [0.17, 0.1, 0.12], 0.02, 1],
    ['ell', 'head', [0, -0.09, 0.225], [0.1, 0.012, 0.03], 0.006, 2],
  ] },
  { id: 'lion', name: 'Lion', cost: 1600, boost: { dmg: 6 }, pal: ['#e8902a', '#3a2418', '#fff0d0'], parts: [
    ['sph', 'head', [0, 0.01, -0.12], 0.31, 0.03, 0],
    ['sph', 'head', [0.25, 0.12, -0.05], 0.11, 0.05, 0],
    ['sph', 'head', [-0.25, 0.12, -0.05], 0.11, 0.05, 0],
    ['sph', 'head', [0.23, -0.13, -0.05], 0.11, 0.05, 0],
    ['sph', 'head', [-0.23, -0.13, -0.05], 0.11, 0.05, 0],
    ['ell', 'head', [0, -0.07, 0.17], [0.11, 0.07, 0.08], 0.03, 2],
    ['sph', 'head', [0, -0.035, 0.245], 0.03, 0.01, 1],
  ] },
  { id: 'dino', name: 'Dino', cost: 1100, boost: { hp: 7 }, pal: ['#ffb020'], parts: [
    ['cap', 'head', [0, 0.2, -0.06], [0, 0.33, -0.1], 0.05, 0.01, 0.02, 0],
    ['cap', 'head', [0, 0.1, -0.19], [0, 0.18, -0.32], 0.055, 0.01, 0.02, 0],
    ['cap', 'chest', [0, 0.12, -0.22], [0, 0.18, -0.38], 0.06, 0.012, 0.02, 0],
    ['cap', 'chest', [0, -0.08, -0.24], [0, -0.06, -0.4], 0.06, 0.012, 0.02, 0],
    ['cap', 'pelvis', [0, -0.02, -0.22], [0, -0.15, -0.55], 0.12, 0.03, 0.06, 'b', 0.05],
  ] },
  { id: 'bee', name: 'Bee', cost: 650, boost: { cd: 4 }, pal: ['#16141c', '#ffffff'], parts: [
    ['cap', 'head', [0.07, 0.2, 0.05], [0.13, 0.42, 0.1], 0.015, 0.04, 0.01, 0, 0.03],
    ['cap', 'head', [-0.07, 0.2, 0.05], [-0.13, 0.42, 0.1], 0.015, 0.04, 0.01, 0, 0.03],
    ['ell', 'chest', [0.18, 0.12, -0.3], [0.17, 0.1, 0.02], 0.02, 1],
    ['ell', 'chest', [-0.18, 0.12, -0.3], [0.17, 0.1, 0.02], 0.02, 1],
    ['ell', 'chest', [0, -0.08, 0], [0.345, 0.06, 0.275], 0.01, 0],
    ['ell', 'pelvis', [0, 0.1, 0], [0.285, 0.05, 0.285], 0.01, 0],
  ] },
  // hats and headwear
  { id: 'sprout', name: 'Sprout', cost: 200, boost: { regen: 0.06 }, pal: ['#4cd964'], parts: [
    ['cap', 'head', [0, 0.2, 0], [0, 0.37, 0], 0.022, 0.018, 0.02, 0],
    ['ell', 'head', [0.08, 0.39, 0], [0.085, 0.03, 0.055], 0.015, 0],
    ['ell', 'head', [-0.08, 0.39, 0], [0.085, 0.03, 0.055], 0.015, 0],
  ] },
  { id: 'flowers', name: 'Flower Crown', cost: 300, boost: { xp: 4 }, pal: ['#ff7ac8', '#ffd23a', '#7fd4ff'], parts: [
    ['sph', 'head', [0, 0.16, 0.19], 0.06, 0.02, 0],
    ['sph', 'head', [0.165, 0.16, 0.095], 0.06, 0.02, 1],
    ['sph', 'head', [0.165, 0.16, -0.095], 0.06, 0.02, 2],
    ['sph', 'head', [0, 0.16, -0.19], 0.06, 0.02, 0],
    ['sph', 'head', [-0.165, 0.16, -0.095], 0.06, 0.02, 1],
    ['sph', 'head', [-0.165, 0.16, 0.095], 0.06, 0.02, 2],
  ] },
  { id: 'mushroom', name: 'Mushroom', cost: 500, boost: { area: 4 }, pal: ['#e8283c', '#ffffff'], parts: [
    ['ell', 'head', [0, 0.17, 0], [0.33, 0.2, 0.33], 0.02, 0],
    ['sph', 'head', [0.15, 0.333, 0.12], 0.05, 0.01, 1],
    ['sph', 'head', [-0.2, 0.329, 0], 0.05, 0.01, 1],
    ['sph', 'head', [0, 0.338, -0.18], 0.05, 0.01, 1],
    ['sph', 'head', [0.05, 0.297, 0.25], 0.045, 0.01, 1],
    ['sph', 'head', [-0.02, 0.37, 0.02], 0.045, 0.01, 1],
  ] },
  { id: 'chef', name: 'Chef', cost: 600, boost: { regen: 0.1 }, pal: ['#ffffff'], parts: [
    ['cap', 'head', [0, 0.17, 0], [0, 0.26, 0], 0.16, 0.16, 0.02, 0],
    ['sph', 'head', [0, 0.38, 0], 0.17, 0.06, 0],
    ['sph', 'head', [0.1, 0.34, 0], 0.12, 0.06, 0],
    ['sph', 'head', [-0.1, 0.34, 0], 0.12, 0.06, 0],
  ] },
  { id: 'headphones', name: 'Headphones', cost: 700, boost: { cd: 4 }, pal: ['#2a2a36', '#ff4fa8'], parts: [
    ['cap', 'head', [-0.245, 0.1, 0], [0, 0.3, 0], 0.03, 0.03, 0.02, 0],
    ['cap', 'head', [0, 0.3, 0], [0.245, 0.1, 0], 0.03, 0.03, 0.02, 0],
    ['ell', 'head', [0.24, 0, 0], [0.06, 0.11, 0.1], 0.02, 1],
    ['ell', 'head', [-0.24, 0, 0], [0.06, 0.11, 0.1], 0.02, 1],
  ] },
  { id: 'cowboy', name: 'Cowboy', cost: 900, boost: { speed: 4 }, pal: ['#a8692e', '#5a3418'], parts: [
    ['ell', 'head', [0, 0.13, 0], [0.38, 0.028, 0.32], 0.01, 0],
    ['ell', 'head', [0, 0.23, 0], [0.2, 0.15, 0.18], 0.02, 0],
    ['ell', 'head', [0, 0.17, 0], [0.205, 0.035, 0.185], 0.01, 1],
    ['sph', 'head', [0.35, 0.17, 0], 0.045, 0.03, 0],
    ['sph', 'head', [-0.35, 0.17, 0], 0.045, 0.03, 0],
  ] },
  { id: 'tophat', name: 'Top Hat', cost: 1000, boost: { gold: 10 }, pal: ['#1c1a22', '#e8283c'], parts: [
    ['ell', 'head', [0.02, 0.14, 0], [0.26, 0.024, 0.26], 0.01, 0],
    ['cap', 'head', [0.02, 0.16, 0], [0.02, 0.38, 0], 0.16, 0.16, 0.01, 0],
    ['ell', 'head', [0.02, 0.19, 0], [0.165, 0.032, 0.165], 0.005, 1],
  ] },
  { id: 'reindeer', name: 'Reindeer', cost: 1000, boost: { magnet: 25 }, pal: ['#8a5a33', '#e8283c'], parts: [
    ['cap', 'head', [0.1, 0.18, -0.02], [0.2, 0.4, -0.06], 0.03, 0.018, 0.02, 0],
    ['cap', 'head', [-0.1, 0.18, -0.02], [-0.2, 0.4, -0.06], 0.03, 0.018, 0.02, 0],
    ['cap', 'head', [0.15, 0.29, -0.04], [0.26, 0.34, 0.04], 0.022, 0.012, 0.015, 0],
    ['cap', 'head', [-0.15, 0.29, -0.04], [-0.26, 0.34, 0.04], 0.022, 0.012, 0.015, 0],
    ['sph', 'head', [0, -0.03, 0.24], 0.045, 0.012, 1],
  ] },
  { id: 'witch', name: 'Witch Hat', cost: 1300, boost: { cd: 5 }, pal: ['#1c1a26', '#7b2bd6'], parts: [
    ['ell', 'head', [0, 0.12, 0], [0.35, 0.026, 0.35], 0.01, 0],
    ['cap', 'head', [0, 0.13, 0], [0.06, 0.55, -0.12], 0.19, 0.012, 0.02, 0],
    ['ell', 'head', [0, 0.165, 0], [0.19, 0.036, 0.19], 0.008, 1],
  ] },
  { id: 'viking', name: 'Viking', cost: 1400, boost: { armor: 6 }, pal: ['#9aa7b8', '#fff2d6'], parts: [
    ['ell', 'head', [0, 0.06, 0], [0.245, 0.2, 0.245], 0.015, 0],
    ['cap', 'head', [0.2, 0.1, 0], [0.32, 0.28, 0.02], 0.05, 0.015, 0.02, 1],
    ['cap', 'head', [-0.2, 0.1, 0], [-0.32, 0.28, 0.02], 0.05, 0.015, 0.02, 1],
  ] },
  { id: 'wizard', name: 'Wizard', cost: 1700, boost: { area: 6 }, pal: ['#5a3bd6', '#ffd23a', '#ffffff'], parts: [
    ['ell', 'head', [0, 0.13, 0], [0.31, 0.03, 0.31], 0.01, 0],
    ['cap', 'head', [0, 0.14, 0], [-0.04, 0.57, -0.08], 0.2, 0.015, 0.02, 0],
    ['sph', 'head', [-0.04, 0.59, -0.08], 0.045, 0.01, 1],
    ['ell', 'head', [0, -0.15, 0.18], [0.14, 0.16, 0.1], 0.04, 2],
  ] },
  { id: 'ninja', name: 'Ninja', cost: 1900, boost: { speed: 6 }, pal: ['#1c1a26', '#e8283c', '#ffe2c4'], parts: [
    ['sph', 'head', [0, 0.005, 0], 0.238, 0.02, 0],
    ['ell', 'head', [0, 0.03, 0.17], [0.15, 0.045, 0.09], 0.01, 2],
    ['sph', 'head', [0.055, 0.035, 0.25], 0.022, 0.005, 0],
    ['sph', 'head', [-0.055, 0.035, 0.25], 0.022, 0.005, 0],
    ['ell', 'head', [0, 0.12, 0], [0.245, 0.035, 0.245], 0.008, 1],
    ['cap', 'head', [0, 0.12, -0.22], [0.08, 0.02, -0.42], 0.03, 0.02, 0.02, 1, 0.05],
    ['cap', 'head', [0, 0.12, -0.22], [-0.06, -0.04, -0.4], 0.03, 0.02, 0.02, 1, 0.05],
  ] },
  { id: 'astronaut', name: 'Astronaut', cost: 2200, boost: { magnet: 30 }, pal: ['#f4f6fa', '#2a3a5a', '#ff8a1f'], parts: [
    ['sph', 'head', [0, 0.01, 0], 0.27, 0.02, 0],
    ['ell', 'head', [0, 0.02, 0.17], [0.18, 0.13, 0.12], 0.01, 1],
    ['cap', 'head', [0.14, 0.2, 0], [0.18, 0.38, -0.02], 0.015, 0.012, 0.01, 0],
    ['sph', 'head', [0.18, 0.4, -0.02], 0.03, 0.01, 2],
    ['ell', 'chest', [0, 0, -0.3], [0.2, 0.22, 0.08], 0.02, 0],
  ] },
  { id: 'angel', name: 'Angel', cost: 2400, boost: { regen: 0.15 }, pal: ['#ffe14a', '#ffffff'], parts: [
    ['cap', 'head', [0.14, 0.36, 0], [0.07, 0.36, 0.121], 0.022, 0.022, 0.02, 0],
    ['cap', 'head', [0.07, 0.36, 0.121], [-0.07, 0.36, 0.121], 0.022, 0.022, 0.02, 0],
    ['cap', 'head', [-0.07, 0.36, 0.121], [-0.14, 0.36, 0], 0.022, 0.022, 0.02, 0],
    ['cap', 'head', [-0.14, 0.36, 0], [-0.07, 0.36, -0.121], 0.022, 0.022, 0.02, 0],
    ['cap', 'head', [-0.07, 0.36, -0.121], [0.07, 0.36, -0.121], 0.022, 0.022, 0.02, 0],
    ['cap', 'head', [0.07, 0.36, -0.121], [0.14, 0.36, 0], 0.022, 0.022, 0.02, 0],
    ['ell', 'chest', [0.2, 0.1, -0.28], [0.2, 0.13, 0.03], 0.03, 1],
    ['ell', 'chest', [-0.2, 0.1, -0.28], [0.2, 0.13, 0.03], 0.03, 1],
  ] },
  { id: 'crown', name: 'Crown', cost: 2500, boost: { gold: 15 }, pal: ['#ffc21f', '#ff3b6b'], parts: [
    ['ell', 'head', [0, 0.17, 0], [0.17, 0.05, 0.17], 0.01, 0],
    ['cap', 'head', [0, 0.2, 0.14], [0, 0.3, 0.14], 0.035, 0.012, 0.01, 0],
    ['cap', 'head', [0.14, 0.2, 0], [0.14, 0.3, 0], 0.035, 0.012, 0.01, 0],
    ['cap', 'head', [0, 0.2, -0.14], [0, 0.3, -0.14], 0.035, 0.012, 0.01, 0],
    ['cap', 'head', [-0.14, 0.2, 0], [-0.14, 0.3, 0], 0.035, 0.012, 0.01, 0],
    ['sph', 'head', [0, 0.18, 0.17], 0.03, 0.005, 1],
  ] },
];
COSTUMES.sort((a, b) => a.cost - b.cost);

// ---------- stat bonuses: skins, costumes and artifacts ----------
// Percent bonuses, except regen (percent of max health per second)
const STAT_INFO = {
  dmg: { name: 'damage', short: 'DMG' },
  hp: { name: 'max health', short: 'HP' },
  armor: { name: 'less damage taken', short: 'ARMOR' },
  speed: { name: 'move speed', short: 'SPEED' },
  cd: { name: 'faster skills', short: 'HASTE' },
  area: { name: 'skill area', short: 'AREA' },
  xp: { name: 'XP', short: 'XP' },
  regen: { name: 'health regen per second', short: 'REGEN' },
  magnet: { name: 'pickup radius', short: 'MAGNET' },
  gold: { name: 'coins', short: 'COINS' },
};
const fmtBonus = (k, v) => `+${+v.toFixed(2)}% ${STAT_INFO[k].name}`;

// Artifacts: found in scroll chests, fused two-into-one up the rarity ladder, one equipped per slot
const RARITIES = [
  { id: 'common', name: 'Common', mul: 1, odds: 0.62 },
  { id: 'uncommon', name: 'Uncommon', mul: 1.5, odds: 0.25 },
  { id: 'rare', name: 'Rare', mul: 2.1, odds: 0.095 },
  { id: 'epic', name: 'Epic', mul: 2.8, odds: 0.03 },
  { id: 'legendary', name: 'Legendary', mul: 3.6, odds: 0.005 },
];
const GEAR_SLOTS = [
  { id: 'weapon', name: 'Weapon' }, { id: 'armor', name: 'Armor' },
  { id: 'ring', name: 'Ring' }, { id: 'necklace', name: 'Necklace' },
];
// stats are the common values; higher rarities multiply them by RARITIES[r].mul
const ARTIFACTS = {
  sword: { name: 'Goo Sword', slot: 'weapon', stats: { dmg: 4, hp: 4 } },
  wand: { name: 'Star Wand', slot: 'weapon', stats: { dmg: 6 } },
  bow: { name: 'Twig Bow', slot: 'weapon', stats: { dmg: 3, cd: 3 } },
  cloak: { name: 'Hero Cloak', slot: 'armor', stats: { hp: 8 } },
  plate: { name: 'Steel Plate', slot: 'armor', stats: { armor: 4 } },
  vest: { name: 'Leather Vest', slot: 'armor', stats: { hp: 4, speed: 3 } },
  goldRing: { name: 'Gold Ring', slot: 'ring', stats: { hp: 3, dmg: 2 } },
  silverRing: { name: 'Silver Ring', slot: 'ring', stats: { xp: 6 } },
  rubyRing: { name: 'Ruby Ring', slot: 'ring', stats: { regen: 0.06 } },
  skull: { name: 'Skull Necklace', slot: 'necklace', stats: { dmg: 5 } },
  moon: { name: 'Moon Pendant', slot: 'necklace', stats: { cd: 4 } },
  clover: { name: 'Clover Charm', slot: 'necklace', stats: { gold: 8, magnet: 10 } },
};
const artKey = (id, r) => id + ':' + r;
const artParse = key => { const [id, r] = key.split(':'); return { id, r: Number(r), def: ARTIFACTS[id] }; };
function artStats(key) {
  const { r, def } = artParse(key), out = {};
  for (const k in def.stats) out[k] = def.stats[k] * RARITIES[r].mul;
  return out;
}
