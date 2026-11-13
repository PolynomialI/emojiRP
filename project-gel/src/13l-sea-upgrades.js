// ============================================================
// The sea's enemies and upgrades. Every upgrade is mounted on the ship: each ship lists where its mounts
// go (SHIP_MOUNTS), so a new ship takes all of them along, each in its own place.
// ============================================================
Object.assign(ENEMY_TYPES, {
  // goo pirates treading water; floats (arm bands, an inner tube) soak up damage until they pop
  pswim: { model: 'pswim', hp: 11, speed: 2.0, dmg: 4, xp: 1, radius: 0.42, scale: 1.25, tint: '#e8414a', mass: 1, sea: true },
  pfloat: { model: 'pfloat', hp: 12, shell: 14, speed: 1.85, dmg: 5, xp: 2, radius: 0.46, scale: 1.25, tint: '#8a5ad8', mass: 1.3, sea: true },
  ptube: { model: 'ptube', hp: 14, shell: 30, speed: 1.6, dmg: 6, xp: 3, radius: 0.58, scale: 1.3, tint: '#2fae6a', mass: 2, sea: true },
});

// Where things go on each ship: [x across (+ is port), z along the keel (+ is the bow), y above the waterline].
// guns fill in order; bow: harpoon gun; fig: figurehead; turret, pile (musket balls), hose (water cannon), lamp,
// net, mast (gust sail), stern (propeller), anchor (where the chain leaves), crew: the deck walk; rim: how high
// the hull plating sits; ms: how big mounted things are drawn
const SHIP_MOUNTS = {
  raft: { ms: 0.78, rim: 0.1, guns: [[0.55, 0.8, 0.17], [-0.55, 0.8, 0.17], [0.55, -0.7, 0.17], [-0.55, -0.7, 0.17]],
    bow: [0, 1.0, 0.17], fig: [0, 1.22, 0.04], turret: [0.62, 0.12, 0.17], pile: [-0.62, 0.12, 0.17], hose: [0.66, -0.3, 0.17], lamp: [-0.66, -0.95, 0.17],
    net: [-0.66, -0.3, 0.17], mast: [0, 0.62, 0.17], stern: [0, -1.22, 0.0], anchor: [0.5, 1.05, 0.2], crew: [[0.62, 0.55], [0.62, -0.55], [-0.62, -0.55], [-0.62, 0.55]] },
  canoe: { ms: 0.8, rim: 0.3, guns: [[0, 1.15, 0.12], [0, -1.35, 0.12], [1.32, 0.5, 0.24], [1.32, -0.5, 0.24]],
    bow: [0, 1.5, 0.15], fig: [0, 2.06, 0.5], turret: [0, 0.78, 0.12], pile: [1.32, 0.0, 0.24], hose: [0, -1.6, 0.16], lamp: [1.32, -1.0, 0.24],
    net: [1.32, 1.0, 0.24], mast: [0, 0.9, 0.12], stern: [0, -2.05, 0.05], anchor: [0, 1.75, 0.4], crew: [[0, 0.75], [0, 1.2], [1.32, 0.4], [1.32, -0.4], [0, -1.25]] },
  sloop: { ms: 1.0, rim: 0.48, guns: [[0.72, 2.0, 0.655], [-0.72, 2.0, 0.655], [0.75, -1.3, 0.655], [-0.75, -1.3, 0.655]],
    bow: [0, 2.45, 0.655], fig: [0, 3.0, 0.55], turret: [0, 1.75, 0.655], pile: [-0.62, 0.15, 0.655], hose: [0.65, 0.2, 0.655], lamp: [0.55, -2.15, 1.4],
    net: [-0.65, -0.95, 0.655], mast: [-0.4, -2.2, 1.4], stern: [0, -2.85, 0.25], anchor: [0.7, 2.3, 0.8], crew: [[0.6, 0.9], [0.6, -1.0], [-0.6, -1.0], [-0.6, 0.9]] },
  galleon: { ms: 1.12, rim: 0.66, guns: [[0.9, 2.6, 0.885], [-0.9, 2.6, 0.885], [0.95, -1.6, 0.885], [-0.95, -1.6, 0.885]],
    bow: [0.5, 3.0, 0.885], fig: [0, 4.0, 0.75], turret: [0, 2.55, 0.885], pile: [-0.8, 0.6, 0.885], hose: [0.8, 0.6, 0.885], lamp: [0.6, -2.95, 1.89],
    net: [-0.85, -1.0, 0.885], mast: [-0.6, -2.95, 1.89], stern: [0, -3.9, 0.35], anchor: [0.8, 3.0, 1.0], crew: [[0.8, 1.2], [0.8, -1.4], [-0.8, -1.4], [-0.8, 1.2]] },
  yacht: { ms: 1.2, rim: 0.8, guns: [[0.95, 3.6, 1.035], [-0.95, 3.6, 1.035], [0.9, -3.65, 1.035], [-0.9, -3.65, 1.035]],
    bow: [0, 4.0, 1.035], fig: [0, 4.75, 0.95], turret: [0, 0.2, 1.9], pile: [-0.95, 1.3, 1.035], hose: [0.95, 1.3, 1.035], lamp: [0.55, -1.6, 2.21],
    net: [-0.55, -1.6, 2.21], mast: [0, -2.4, 2.21], stern: [0, -4.8, 0.35], anchor: [0.8, 4.1, 1.1], crew: [[0.95, 0.9], [0.95, -3.8], [-0.95, -3.8], [-0.95, 0.9]] },
  cruise: { ms: 1.35, rim: 1.1, guns: [[0.95, 3.9, 1.335], [-0.95, 3.9, 1.335], [1.0, -2.2, 2.76], [-1.0, -2.2, 2.76]],
    bow: [0, 5.2, 1.335], fig: [0, 6.2, 1.1], turret: [0, 4.4, 1.335], pile: [-0.9, -1.6, 2.76], hose: [0.9, -1.6, 2.76], lamp: [0.9, 2.55, 2.77],
    net: [-0.9, 2.55, 2.77], mast: [0, -4.35, 2.76], stern: [0, -6.15, 0.45], anchor: [1.0, 5.0, 1.4], crew: [[1.0, 1.8], [1.0, -3.0], [-1.0, -3.0], [-1.0, 1.8]] },
  cargo: { ms: 1.5, rim: 1.2, guns: [[1.1, 1.9, 3.19], [-1.1, 1.9, 3.19], [1.1, -3.1, 3.19], [-1.1, -3.1, 3.19]],
    bow: [0.9, 6.0, 1.435], fig: [0, 7.45, 1.25], turret: [0, -0.6, 3.19], pile: [0, 1.9, 3.19], hose: [-0.9, 6.0, 1.435], lamp: [1.2, -5.6, 4.11],
    net: [-1.2, -5.6, 4.11], mast: [0, -5.25, 4.11], stern: [0, -7.35, 0.6], anchor: [1.2, 6.4, 1.6], crew: [[1.1, -3.1], [1.1, 1.9], [-1.1, 1.9], [-1.1, -3.1]].map(p => p) },
  battleship: { ms: 1.6, rim: 1.3, guns: [[1.3, 2.6, 1.535], [-1.3, 2.6, 1.535], [1.25, -3.4, 1.535], [-1.25, -3.4, 1.535]],
    bow: [1.0, 7.4, 1.535], fig: [0, 8.45, 1.3], turret: [0, -3.0, 1.535], pile: [-1.35, -0.9, 1.535], hose: [1.35, -0.9, 1.535], lamp: [0.8, 0.7, 3.99],
    net: [-0.8, 0.7, 3.99], mast: [0, -1.0, 3.99], stern: [0, -8.4, 0.6], anchor: [1.2, 7.2, 1.7], crew: [[1.35, 1.6], [1.35, -3.8], [-1.35, -3.8], [-1.35, 1.6]] },
  carrier: { ms: 1.75, rim: 1.9, guns: [[2.6, 7.4, 2.88], [-1.9, 7.4, 2.88], [2.6, -8.2, 2.88], [-1.9, -8.2, 2.88]],
    bow: [-1.2, 9.4, 2.88], fig: [0, 9.95, 2.0], turret: [-0.6, 6.0, 2.88], pile: [-1.2, 1.0, 2.88], hose: [2.6, -2.0, 2.88], lamp: [-2.35, -0.5, 5.65],
    net: [-2.35, -3.0, 5.65], mast: [-2.35, -2.4, 5.65], stern: [0, -9.6, 0.7], anchor: [2.2, 9.0, 2.4], crew: [[2.4, 3.0], [2.4, -5.0], [-1.4, -5.0], [-1.4, 3.0]] },
  ark: { ms: 1.9, rim: 1.7, guns: [[2.1, 6.0, 2.035], [-2.1, 6.0, 2.035], [2.2, -2.6, 2.035], [-2.2, -2.6, 2.035]],
    bow: [0.9, 8.6, 2.035], fig: [0, 11.5, 2.2], turret: [0, 6.6, 2.035], pile: [-1.6, 1.4, 2.035], hose: [1.6, 1.4, 2.035], lamp: [1.3, -5.6, 4.43],
    net: [-1.3, -5.6, 4.43], mast: [0, -4.4, 4.43], stern: [0, -10.4, 0.6], anchor: [1.9, 9.0, 2.3], crew: [[2.0, 4.2], [2.0, -1.6], [-2.0, -1.6], [-2.0, 4.2]] },
};
const mountsOf = D => SHIP_MOUNTS[D.id] || SHIP_MOUNTS.raft;
// a mount spot in the world: [x, y, z] (riding the swell with the ship)
function mountW(spot, out = [0, 0, 0]) { const p = shipW(spot[0], spot[1]); out[0] = p[0]; out[1] = OC.ship.y + spot[2]; out[2] = p[1]; return out; }
// the deck height under the crew's walk (the cargo ship's crew walks the container tops)
const crewY = (M, D) => (D.id === 'cargo' ? 3.19 : D.id === 'cruise' ? 2.76 : M.guns[0][2]);  // (the others walk their main deck)

// ---------- the upgrades ----------
const SEA_POWER = 1;
Object.assign(SKILLS, {
  // the ship itself: always in the first slot; every level is a bigger, tougher ship that rams harder
  ship: {
    sea: true, max: SHIPS.length, name: 'Ship', intro: 'Your ship. Each level builds a bigger, tougher one that rams harder; everything mounted on it comes along.', icon: { type: 13, colw: 0 },
    fields: [['name', 'Ship'], ['hull', 'Hull', '%'], ['ram', 'Ram']],
    levels: SHIPS.map(D => ({ name: D.name, hull: Math.round(100 * (1 + D.hull)), ram: D.ram })),
  },
  cannon: {
    sea: true, name: 'Homing Cannon', intro: 'Deck cannons that turn to fire cannonballs which curve onto their target.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['count', 'Cannons'], ['splash', 'Splash', 'm']],
    levels: L10({ dmg: [6, 7, 7, 8, 9, 10, 11, 12, 13, 15], cd: [1.4, 1.35, 1.3, 1.25, 1.2, 1.15, 1.1, 1.05, 1.0, 0.95], count: [1, 1, 2, 2, 2, 3, 3, 3, 4, 4], splash: [0, 0, 0, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2, 1.4] }),
  },
  musket: {
    sea: true, name: 'Musket Ball Pile', intro: 'A heap of musket balls that goes off in a ring of shot all around the ship.', icon: { type: 13, colw: 0 },
    fields: [['count', 'Balls'], ['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['pierce', 'Pierce']],
    levels: L10({ dmg: [5, 5, 6, 6, 7, 7, 8, 9, 10, 11], cd: [1.8, 1.75, 1.7, 1.6, 1.5, 1.45, 1.4, 1.3, 1.2, 1.1], count: [8, 9, 10, 11, 12, 13, 14, 16, 18, 20], pierce: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2] }),
  },
  harpoon: {
    sea: true, name: 'Harpoon Gun', intro: 'Fires a barbed harpoon through a line of swimmers and reels the last one in for a ramming.', icon: { type: 14, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Cooldown', 's'], ['pierce', 'Pierce'], ['count', 'Harpoons']],
    levels: L10({ dmg: [16, 18, 20, 22, 25, 28, 31, 34, 38, 42], cd: [2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.6], pierce: [1, 1, 2, 2, 2, 3, 3, 4, 4, 5], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3] }),
  },
  gunner: {
    sea: true, rare: true, name: 'Battleship Gunner', intro: 'Rare. A battleship turret that lobs heavy shells into the thickest crowd.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Damage'], ['radius', 'Blast', 'm'], ['shells', 'Shells'], ['cd', 'Cooldown', 's']],
    levels: L10({ dmg: [16, 18, 20, 22, 25, 28, 31, 34, 38, 44], cd: [5.2, 5.1, 5.0, 4.8, 4.6, 4.4, 4.2, 4.0, 3.8, 3.5], shells: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], radius: [2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.0] }),
  },
  anchor: {
    sea: true, name: 'Anchor Flail', intro: 'The anchor swings round the ship on its chain, battering everything it sweeps through.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Damage'], ['reach', 'Chain', 'm'], ['count', 'Anchors'], ['spin', 'Speed', '°/s']],
    levels: L10({ dmg: [10, 11, 12, 14, 15, 17, 19, 21, 23, 26], reach: [2.4, 2.5, 2.6, 2.7, 2.8, 3.0, 3.1, 3.2, 3.4, 3.6], count: [1, 1, 1, 1, 2, 2, 2, 2, 3, 3], spin: [126, 132, 138, 144, 150, 158, 166, 174, 184, 196] }),
  },
  barrels: {
    sea: true, name: 'Barrel Mines', intro: 'Powder barrels roll off the stern and float in your wake until a swimmer comes close.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Damage'], ['cd', 'Drop every', 's'], ['max', 'Barrels'], ['radius', 'Blast', 'm']],
    levels: L10({ dmg: [20, 22, 24, 27, 30, 33, 36, 40, 44, 50], cd: [2.8, 2.7, 2.6, 2.5, 2.4, 2.3, 2.2, 2.1, 2.0, 1.8], max: [3, 3, 4, 4, 5, 5, 6, 6, 7, 8], radius: [1.8, 1.85, 1.9, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.7] }),
  },
  lamp: {
    sea: true, name: 'Lighthouse Lamp', intro: 'A lamp tower whose sweeping beam scalds and slows whatever it lights.', icon: { type: 13, colw: 0 },
    fields: [['dps', 'Damage/s'], ['len', 'Beam', 'm'], ['width', 'Width', '°'], ['beams', 'Beams']],
    levels: L10({ dps: [8, 9, 10, 11, 12, 14, 15, 17, 19, 22], len: [5, 5.2, 5.4, 5.7, 6, 6.3, 6.6, 7, 7.4, 8], width: [12, 13, 14, 15, 16, 17, 18, 20, 22, 24], beams: [1, 1, 1, 1, 1, 2, 2, 2, 2, 2] }),
  },
  net: {
    sea: true, name: 'Fishing Net', intro: 'Casts a net over a crowd: everything under it is stuck, and takes more from a ramming.', icon: { type: 13, colw: 0 },
    fields: [['radius', 'Net', 'm'], ['hold', 'Hold', 's'], ['dmg', 'Damage'], ['cd', 'Cooldown', 's']],
    levels: L10({ dmg: [8, 9, 10, 11, 12, 13, 15, 16, 18, 20], cd: [4.5, 4.4, 4.2, 4.0, 3.8, 3.6, 3.4, 3.2, 3.0, 2.8], radius: [1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.2, 2.4, 2.6, 2.8], hold: [2.0, 2.2, 2.4, 2.6, 2.8, 3.0, 3.2, 3.4, 3.6, 4.0] }),
  },
  gulls: {
    sea: true, name: 'Seagull Squadron', intro: 'Seagulls circle overhead and dive at swimmers to peck them.', icon: { type: 13, colw: 0 },
    fields: [['count', 'Gulls'], ['dmg', 'Damage'], ['cd', 'Dive every', 's']],
    levels: L10({ dmg: [7, 8, 9, 10, 11, 12, 13, 15, 17, 19], count: [1, 1, 2, 2, 3, 3, 4, 4, 5, 6], cd: [2.4, 2.3, 2.2, 2.1, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5] }),
  },
  shark: {
    sea: true, name: 'Shark Escort', intro: 'Friendly sharks swim alongside and dart out to bite swimmers.', icon: { type: 13, colw: 0 },
    fields: [['count', 'Sharks'], ['dmg', 'Bite'], ['cd', 'Bite every', 's'], ['range', 'Range', 'm']],
    levels: L10({ dmg: [12, 13, 15, 16, 18, 20, 22, 25, 28, 32], count: [1, 1, 1, 2, 2, 2, 2, 3, 3, 3], cd: [1.8, 1.7, 1.6, 1.55, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0], range: [5, 5, 5.5, 5.5, 6, 6, 6.5, 6.5, 7, 7.5] }),
  },
  hose: {
    sea: true, name: 'Water Cannon', intro: 'A high-pressure jet that blasts swimmers away and washes boarders off the hull.', icon: { type: 13, colw: 0 },
    fields: [['dmg', 'Damage/hit'], ['range', 'Range', 'm'], ['knock', 'Push'], ['jets', 'Jets']],
    levels: L10({ dmg: [2, 2, 2.5, 2.5, 3, 3, 3.5, 4, 4.5, 5], range: [5, 5.2, 5.4, 5.6, 5.8, 6, 6.3, 6.6, 7, 7.5], knock: [3, 3, 3.5, 3.5, 4, 4, 4.5, 5, 5.5, 6], jets: [1, 1, 1, 1, 1, 2, 2, 2, 2, 2] }),
  },
  figure: {
    sea: true, name: 'Goo Figurehead', intro: 'A goo figure on the bow: rams hit harder and send out a splash that hits everything near.', icon: { type: 13, colw: 0 },
    fields: [['ram', 'Ram', '%'], ['shock', 'Splash damage'], ['radius', 'Splash', 'm']],
    levels: L10({ ram: [15, 20, 25, 32, 40, 48, 56, 66, 80, 100], shock: [6, 7, 8, 9, 10, 12, 14, 16, 18, 21], radius: [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.2] }),
  },
});
Object.assign(PASSIVES, {
  fort: { sea: true, name: 'Fortifications', short: '-5% hull damage', desc: 'Iron plating with spikes: the hull takes 5% less damage, rams 12% harder, and the spikes hurt boarders.', max: 10, icon: { type: 21, colw: 0 } },
  propeller: { sea: true, name: 'Propellers', short: '+7% speed', desc: 'An outboard motor on the stern: +7% speed and quicker to get going.', max: 10, icon: { type: 1, colw: 0 } },
  crew: { sea: true, name: 'Repair Crew', short: '+0.3% hull/s', desc: 'Little goo sailors patch the hull (0.3% a second) and bonk boarders.', max: 10, icon: { type: 10, colw: 4 } },
  sails: { sea: true, name: 'Gust Sails', short: '+4% cooldown speed', desc: 'A sail that catches a magic wind: weapons recharge 4% faster and the ship turns 5% sharper.', max: 10, icon: { type: 22, colw: 0 } },
});
for (const id of ['fort', 'propeller', 'crew', 'sails']) SKILL_HOOKS[id] = SKILL_HOOKS[id] || {};
// the sea's evolutions: a weapon at max level with its partner passive, through a golden chest
Object.assign(EVOLUTIONS, {
  cannon: { with: 'sails', name: 'Broadside Battery', desc: 'One more cannon, firing a little faster.', boost: L => ({ count: L.count + 1, cd: +(L.cd * 0.85).toFixed(2) }) },
  musket: { with: 'fort', name: 'Grapeshot Storm', desc: 'Eight more balls in every ring, each a little harder.', boost: L => ({ count: L.count + 8, dmg: Math.round(L.dmg * 1.15) }) },
  harpoon: { with: 'propeller', name: 'Whaler', desc: 'One more harpoon, punching through four more swimmers.', boost: L => ({ count: L.count + 1, pierce: L.pierce + 4 }) },
  gunner: { with: 'fort', name: 'Dreadnought', desc: 'Bigger, heavier shells.', boost: L => ({ radius: +(L.radius * 1.3).toFixed(1), dmg: Math.round(L.dmg * 1.25) }) },
  anchor: { with: 'propeller', name: 'Kraken Chain', desc: 'One more anchor on a longer chain.', boost: L => ({ count: L.count + 1, reach: +(L.reach * 1.15).toFixed(1) }) },
  barrels: { with: 'crew', name: 'Powder Keg', desc: 'Three more barrels with bigger blasts.', boost: L => ({ max: L.max + 3, radius: +(L.radius * 1.2).toFixed(1) }) },
  lamp: { with: 'sails', name: 'Beacon of Doom', desc: 'Wider, hotter beams.', boost: L => ({ width: Math.round(L.width * 1.4), dps: Math.round(L.dps * 1.3) }) },
  net: { with: 'crew', name: 'Trawler', desc: 'A wider net that holds a second longer.', boost: L => ({ radius: +(L.radius * 1.3).toFixed(1), hold: L.hold + 1 }) },
  gulls: { with: 'sails', name: 'Albatross Armada', desc: 'Three more birds.', boost: L => ({ count: L.count + 3 }) },
  shark: { with: 'propeller', name: 'Megalodon', desc: 'One more shark, and every bite is much harder.', boost: L => ({ count: L.count + 1, dmg: Math.round(L.dmg * 1.4) }) },
  hose: { with: 'crew', name: 'Fire Brigade', desc: 'One more jet, pushing harder.', boost: L => ({ jets: L.jets + 1, knock: +(L.knock * 1.3).toFixed(1) }) },
  figure: { with: 'fort', name: 'Goo Leviathan', desc: 'Rams hit even harder and splash much wider.', boost: L => ({ ram: L.ram + 40, radius: +(L.radius * 1.4).toFixed(1) }) },
});

SKILL_HOOKS.ship = {
  update() {},
  // a new ship: the old one bursts apart in a splash and the new one rises out of it
  onLevel(s) {
    const run = G.run;
    if (!run || !run.sea || s.lvl < 2) return;
    // (its meshes are built off the main thread: if they are not ready yet, the new ship arrives the moment they are)
    const want = Math.max(0, s.lvl - 1), D = SHIPS[Math.min(want, SHIPS.length - 1)];
    prioritizeMeshes([D.model, D.model + '_rig', ...(SHIPS[want + 1] ? [SHIPS[want + 1].model, SHIPS[want + 1].model + '_rig'] : [])]);
    if (seaShipReady(Math.min(want, SHIPS.length - 1))) seaShipArrives();
    else { OC.wantStage = want; UI.toast(`The ${D.name} is on its way…`, 2); }
  },
};
// the new ship takes to the water: the old one bursts apart in a splash and the new one rises out of it
function seaShipArrives() {
  const run = G.run, S = OC.ship;
  const before = run.maxHp;
  recomputeStats();
  run.hp = Math.min(run.maxHp, run.hp + Math.max(0, run.maxHp - before) + run.maxHp * 0.25);
  const D = shipDef();
  {
    FX.ring(S.x, S.z, D.len * 0.9, [0.85, 0.97, 1], 0.7, 1);
    FX.burst(S.x, 0.4, S.z, 40, [0.85, 0.95, 1], 7, 0.14, 0.7, 2, 3);
    FX.burst(S.x, D.deck + 0.3, S.z, 26, [1, 0.85, 0.4], 5, 0.1, 0.6, 3, 2);
    for (const e of run.enemies) if (e.grab) seaUnboard(e, 6);
    G.cam.shake = Math.max(G.cam.shake, 0.2);
    AUDIO.play('splash'); AUDIO.play('levelup', 0.8);
    UI.banner(D.name.toUpperCase() + '!');
  }
}

// ---------- Homing Cannon: each cannon turns toward its own target and fires a ball that arcs onto it ----------
SKILL_HOOKS.cannon = {
  update(s, L, dt) {
    const D = shipDef(), M = mountsOf(D), S = OC.ship;
    s.st.cd = (s.st.cd ?? 0.5) - dt;
    s.st.aim = s.st.aim || []; s.st.kick = s.st.kick || [];
    const n = Math.min(L.count, M.guns.length), reach = 15 + D.len * 0.3;
    for (let i = 0; i < n; i++) {
      const g = M.guns[i], w = shipW(g[0], g[1]);
      const tgt = nearestEnemy(w[0], w[1], reach);
      const want = tgt ? Math.atan2(tgt.x - w[0], tgt.z - w[1]) - S.yaw : (g[1] < 0 ? Math.PI : 0);
      s.st.aim[i] = angleLerp(s.st.aim[i] ?? want, want, Math.min(1, dt * 8));
      s.st.kick[i] = Math.max(0, (s.st.kick[i] || 0) - dt * 5);
    }
    if (s.st.cd > 0 || OC.sink) return;
    const taken = new Set();
    // every other cannon locks onto a boss or miniboss in range; the rest take the nearest swimmers
    const big = G.run.enemies.find(e => (e.boss || e.mini) && !e.dying && !e.hidden && Math.hypot(e.x - S.x, e.z - S.z) < reach + 2);
    let fired = false;
    for (let i = 0; i < n; i++) {
      const g = M.guns[i], w = shipW(g[0], g[1]);
      const tgt = (big && i % 2 === 1 ? big : null) || (big && n === 1 && Math.random() < 0.5 ? big : null) || nearestEnemy(w[0], w[1], reach, taken) || nearestEnemy(w[0], w[1], reach);
      if (!tgt) continue;
      taken.add(tgt);
      const a = S.yaw + s.st.aim[i], ms = M.ms;
      const mx = w[0] + Math.sin(a) * 0.45 * ms, mz = w[1] + Math.cos(a) * 0.45 * ms, my = g[2] + 0.32 * ms + S.y;
      OC.balls.push({ x: mx, y: my, z: mz, vx: Math.sin(a) * 11, vy: 3.2, vz: Math.cos(a) * 11, tgt, t: 0, dmg: L.dmg, splash: L.splash, spin: rand(0, TAU), gold: !!s.evo });
      FX.smoke(mx, my, mz, 0.3, [0.9, 0.9, 0.92], 0.6, 0.8);
      FX.glow(mx, my, mz, 0.5, [1, 0.75, 0.35], 0.08);
      s.st.kick[i] = 1;
      fired = true;
    }
    if (fired) { AUDIO.play('cannon'); s.st.cd = L.cd * cdMul(); } else s.st.cd = 0.15;
  },
};
// cannonballs: homing, with a little arc; they splash into the sea if they lose their target
function updateSeaBalls(dt) {
  for (const b of OC.balls) {
    b.t += dt;
    const T = b.tgt && !b.tgt.dying ? b.tgt : null;
    if (T) {
      const dx = T.x - b.x, dz = T.z - b.z, d = Math.hypot(dx, dz) || 1, sp = Math.max(11, Math.hypot(b.vx, b.vz) + dt * 10);
      const turn = Math.min(1, dt * (4 + b.t * 10));
      b.vx += (dx / d * sp - b.vx) * turn; b.vz += (dz / d * sp - b.vz) * turn;
      const want = (0.45 - b.y) * sp / Math.max(d, 0.5);
      b.vy += (want - b.vy) * Math.min(1, dt * 6);
    } else b.vy -= 14 * dt;
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (Math.random() < 0.5) FX.part(b.x, b.y, b.z, 0, 0.3, 0, 0.12, 0.3, 0.4, [0.85, 0.85, 0.9], 0.35, 2, 0, 1);
    let hit = null;
    if (T && Math.hypot(T.x - b.x, T.z - b.z) < T.radius + 0.25 && b.y < 1.4 * T.scale) hit = T;
    if (!hit) enemiesInRadius(b.x, b.z, 0.5, e => { if (!hit && b.y < 1.2) hit = e; });
    if (hit) {
      b.dead = true;
      const d = Math.hypot(b.vx, b.vz) || 1;
      hurtEnemy(hit, b.dmg, b.vx / d * 3, b.vz / d * 3);
      if (b.splash > 0) enemiesInRadius(b.x, b.z, b.splash * areaMul(), e => { if (e !== hit) hurtEnemy(e, b.dmg * 0.5, 0, 0, { sound: false }); });
      FX.burst(b.x, 0.4, b.z, 10, [1, 0.7, 0.3], 4, 0.1, 0.35, 1, 1.5);
      FX.burst(b.x, 0.2, b.z, 8, [0.85, 0.95, 1], 4, 0.1, 0.45, 2, 2.5);
      if (b.splash > 0) FX.ring(b.x, b.z, b.splash * areaMul() * 1.2, [1, 0.8, 0.5], 0.3, 0.7);
    } else if (b.y < 0 || b.t > 2.2) {
      b.dead = true; seaSplash(b.x, b.z, 0.9);
      if (Math.random() < 0.5) AUDIO.play('splash', 0.6);
    }
  }
  OC.balls = OC.balls.filter(b => !b.dead);
}
function seaSplash(x, z, s) {
  FX.burst(x, 0.1, z, Math.round(8 * s + 2), [0.85, 0.95, 1], 3.5 * s, 0.1, 0.5, 2, 3);
  FX.ring(x, z, s, [0.85, 0.97, 1], 0.4, 0.6);
}

// ---------- Musket Ball Pile: a ring of shot from the pile ----------
SKILL_HOOKS.musket = {
  update(s, L, dt) {
    s.st.cd = (s.st.cd ?? 1) - dt;
    if (s.st.cd > 0 || OC.sink) return;
    if (!nearestEnemy(OC.ship.x, OC.ship.z, 9)) { s.st.cd = 0.2; return; }
    s.st.cd = L.cd * cdMul();
    const M = mountsOf(shipDef()), p = mountW(M.pile), off = rand(0, TAU);
    for (let i = 0; i < L.count; i++) {
      const a = off + (i / L.count) * TAU + rand(-0.06, 0.06), sp = rand(12, 14);
      OC.shot.push({ k: 'musket', x: p[0], y: p[1] + 0.3, z: p[2], vx: Math.sin(a) * sp, vz: Math.cos(a) * sp, life: 0.55 * Math.sqrt(areaMul()), dmg: L.dmg, pierce: L.pierce, hit: new Set(), gold: !!s.evo });
    }
    FX.smoke(p[0], p[1] + 0.4, p[2], 0.5, [0.92, 0.92, 0.95], 0.7, 1);
    FX.burst(p[0], p[1] + 0.35, p[2], 10, [1, 0.8, 0.4], 4, 0.08, 0.25, 1, 1);
    AUDIO.play('bang'); s.st.pop = 1;
  },
};
// ---------- Harpoon Gun: a barbed harpoon through a line of swimmers; the last one is reeled in ----------
SKILL_HOOKS.harpoon = {
  update(s, L, dt) {
    const S = OC.ship, M = mountsOf(shipDef()), p = mountW(M.bow);
    s.st.cd = (s.st.cd ?? 1) - dt;
    // aim at the toughest swimmer in reach
    let best = null, bh = 0;
    gridQuery(p[0], p[2], 13, e => { const d = Math.hypot(e.x - p[0], e.z - p[2]); if (d < 13 && !e.grab && e.hp + (e.shell || 0) > bh) { bh = e.hp + (e.shell || 0); best = e; } });
    const want = best ? Math.atan2(best.x - p[0], best.z - p[2]) - S.yaw : 0;
    s.st.aim = angleLerp(s.st.aim ?? 0, want, Math.min(1, dt * 6));
    if (s.st.cd > 0 || !best || OC.sink) return;
    s.st.cd = L.cd * cdMul();
    for (let i = 0; i < L.count; i++) {
      const a = S.yaw + s.st.aim + (i - (L.count - 1) / 2) * 0.22;
      OC.shot.push({ k: 'harpoon', x: p[0], y: p[1] + 0.38 * M.ms, z: p[2], vx: Math.sin(a) * 22, vz: Math.cos(a) * 22, life: 0.7, dmg: L.dmg, pierce: L.pierce, hit: new Set(), from: s, ox: p[0], oz: p[2], gold: !!s.evo });
    }
    AUDIO.play('twang'); s.st.kick = 1;
  },
};
// ---------- Battleship Gunner: heavy shells lobbed into the thickest crowd ----------
SKILL_HOOKS.gunner = {
  update(s, L, dt) {
    const S = OC.ship, M = mountsOf(shipDef()), p = mountW(M.turret);
    s.st.cd = (s.st.cd ?? 1.5) - dt;
    s.st.kick = Math.max(0, (s.st.kick || 0) - dt * 3);
    const tgt = clusterTarget(p[0], p[2], 16);
    if (tgt) s.st.aim = angleLerp(s.st.aim ?? 0, Math.atan2(tgt[0] - p[0], tgt[1] - p[2]) - S.yaw, Math.min(1, dt * 3));
    if (s.st.queue > 0) {
      s.st.qt -= dt;
      if (s.st.qt <= 0 && tgt) {
        s.st.queue--; s.st.qt = 0.28;
        const a = S.yaw + (s.st.aim || 0), mx = p[0] + Math.sin(a) * 0.95 * M.ms, mz = p[2] + Math.cos(a) * 0.95 * M.ms;
        const tx = tgt[0] + rand(-1, 1), tz = tgt[1] + rand(-1, 1);
        OC.shot.push({ k: 'shell', sx: mx, sy: p[1] + 0.3, sz: mz, tx, tz, t: 0, dur: 0.95, x: mx, y: p[1], z: mz, dmg: L.dmg, radius: L.radius * areaMul(), gold: !!s.evo });
        FX.smoke(mx, p[1] + 0.3, mz, 0.6, [0.85, 0.85, 0.9], 0.9, 1);
        FX.glow(mx, p[1] + 0.3, mz, 0.9, [1, 0.7, 0.3], 0.1);
        G.cam.shake = Math.max(G.cam.shake, 0.06); AUDIO.play('cannon', 0.7); s.st.kick = 1;
      }
    }
    if (s.st.cd > 0 || !tgt || OC.sink) return;
    s.st.cd = L.cd * cdMul(); s.st.queue = L.shells; s.st.qt = 0;
  },
};
// ---------- Anchor Flail: anchors on chains swinging round the ship ----------
SKILL_HOOKS.anchor = {
  update(s, L, dt) {
    const S = OC.ship, D = shipDef();
    s.st.a = (s.st.a || 0) + L.spin * Math.PI / 180 * dt;
    s.st.hit = s.st.hit || new Map();
    s.st.pos = [];
    const R = D.len * 0.5 + L.reach * areaMul();
    for (let i = 0; i < L.count; i++) {
      const a = s.st.a + (i / L.count) * TAU, x = S.x + Math.sin(a) * R * 0.9, z = S.z + Math.cos(a) * R * (0.9 + 0.1 * Math.cos(a * 2));
      s.st.pos.push([x, z, a]);
      if (OC.sink) continue;
      enemiesInRadius(x, z, 0.55 * mountsOf(D).ms, e => {
        const k = e.id * 4 + i, t = s.st.hit.get(k) || 0;
        if (OC.t < t) return;
        s.st.hit.set(k, OC.t + 0.5);
        const ox = e.x - S.x, oz = e.z - S.z, od = Math.hypot(ox, oz) || 1;
        hurtEnemy(e, L.dmg, ox / od * 6, oz / od * 6);
        if (e.grab) seaUnboard(e, 6);
        seaSplash(e.x, e.z, 0.6); AUDIO.play('clang');
      });
      if (Math.random() < dt * 6) FX.part(x, 0.05, z, 0, rand(0.5, 1), 0, 0.08, 0.03, 0.4, [0.85, 0.95, 1], 0.8, 0, -1);
    }
    if (s.st.hit.size > 400) s.st.hit.clear();
  },
};
// ---------- Barrel Mines: powder barrels off the stern ----------
SKILL_HOOKS.barrels = {
  update(s, L, dt) {
    const S = OC.ship, M = mountsOf(shipDef());
    s.st.cd = (s.st.cd ?? 1) - dt;
    const mine = OC.mines.filter(b => b.from === s);
    if (s.st.cd <= 0 && mine.length < L.max && !OC.sink) {
      s.st.cd = L.cd * cdMul();
      const p = mountW(M.stern), back = [-Math.sin(S.yaw), -Math.cos(S.yaw)];
      OC.mines.push({ from: s, x: p[0] + back[0] * 0.3, z: p[2] + back[1] * 0.3, vx: back[0] * 2.5 + rand(-0.8, 0.8), vz: back[1] * 2.5 + rand(-0.8, 0.8), t: 0, ph: rand(0, TAU), yaw: rand(0, TAU), dmg: L.dmg, radius: L.radius * areaMul(), gold: !!s.evo });
      AUDIO.play('splash', 0.5);
    }
  },
};
// ---------- Lighthouse Lamp: a sweeping beam that scalds and slows ----------
SKILL_HOOKS.lamp = {
  update(s, L, dt) {
    const S = OC.ship, M = mountsOf(shipDef()), p = mountW(M.lamp);
    s.st.a = (s.st.a || 0) + 1.5 * dt;
    s.st.tick = (s.st.tick || 0) - dt;
    if (s.st.tick > 0 || OC.sink) return;
    s.st.tick = 0.2;
    const half = L.width * Math.PI / 180, len = L.len * areaMul();
    for (let b = 0; b < L.beams; b++) {
      const a = s.st.a + b * Math.PI;
      gridQuery(p[0], p[2], len + 1, e => {
        const dx = e.x - p[0], dz = e.z - p[2], d = Math.hypot(dx, dz);
        if (d > len + e.radius || Math.abs(angleDiff(a, Math.atan2(dx, dz))) > half + e.radius / Math.max(d, 0.5)) return;
        hurtEnemy(e, L.dps * 0.2, 0, 0, { sound: false, color: [1, 0.92, 0.5] });
        e.slowMul = Math.min(e.slowMul, 0.5); e.slowT = 0.3; e.auraTint = 0.6;
      });
    }
  },
};
// ---------- Fishing Net: cast onto a crowd, holding everything under it ----------
SKILL_HOOKS.net = {
  update(s, L, dt) {
    const M = mountsOf(shipDef()), p = mountW(M.net);
    s.st.cd = (s.st.cd ?? 2) - dt;
    if (s.st.cd > 0 || OC.sink) return;
    const tgt = clusterTarget(p[0], p[2], 11);
    if (!tgt) { s.st.cd = 0.3; return; }
    s.st.cd = L.cd * cdMul();
    OC.nets.push({ sx: p[0], sz: p[2], sy: p[1] + 0.5, x: p[0], z: p[2], y: p[1], tx: tgt[0], tz: tgt[1], t: 0, fly: 0.7, hold: L.hold, r: L.radius * areaMul(), dmg: L.dmg, spin: rand(0, TAU), gold: !!s.evo, caught: [] });
    AUDIO.play('throw');
  },
};
// ---------- Seagull Squadron: gulls circle above and dive at swimmers ----------
SKILL_HOOKS.gulls = {
  update(s, L, dt) {
    const S = OC.ship, D = shipDef();
    const B = s.st.birds = s.st.birds || [];
    while (B.length < L.count) B.push({ a: rand(0, TAU), x: S.x, y: 3, z: S.z, cd: rand(0.5, 1.5), dive: null, ph: rand(0, 1), yaw: 0 });
    const R = D.len * 0.45 + 1.6;
    B.forEach((b, i) => {
      b.a += dt * 1.1; b.ph += dt * 2.2;
      if (b.dive) {
        const T = b.dive, e = T.e, u = (T.t += dt) / 0.55;
        if (u < 1 && e && !e.dying) {
          const tx = lerp(T.x0, e.x, u), tz = lerp(T.z0, e.z, u), ty = lerp(T.y0, 0.5, Math.sin(u * Math.PI / 2));
          b.yaw = Math.atan2(tx - b.x, tz - b.z); b.x = tx; b.y = ty; b.z = tz;
        } else {
          if (e && !e.dying) { hurtEnemy(e, L.dmg, (e.x - S.x) * 0.5, (e.z - S.z) * 0.5); if (e.grab && Math.random() < 0.5) seaUnboard(e, 4); FX.burst(e.x, 0.7, e.z, 6, [1, 1, 1], 3, 0.06, 0.3, 1, 1); AUDIO.play('pop', 1.3); }
          b.dive = null; b.cd = L.cd * cdMul() * rand(0.85, 1.15);
        }
        return;
      }
      const a = b.a + (i / Math.max(1, B.length)) * TAU, tx = S.x + Math.sin(a) * R, tz = S.z + Math.cos(a) * R, ty = 2.8 + D.deck * 0.6 + Math.sin(b.ph) * 0.2;
      const k = Math.min(1, dt * 3);
      b.yaw = Math.atan2(tx - b.x, tz - b.z) || b.yaw; b.x += (tx - b.x) * k; b.y += (ty - b.y) * k; b.z += (tz - b.z) * k;
      b.cd -= dt;
      if (b.cd <= 0 && !OC.sink) {
        const e = nearestEnemy(b.x, b.z, 10);
        if (e) { b.dive = { e, t: 0, x0: b.x, y0: b.y, z0: b.z }; if (Math.random() < 0.3) AUDIO.play('whistle', 0.6); } else b.cd = 0.4;
      }
    });
    B.length = L.count;
  },
};
// ---------- Shark Escort: sharks swim alongside and dart out to bite ----------
SKILL_HOOKS.shark = {
  update(s, L, dt) {
    const S = OC.ship, D = shipDef();
    const F = s.st.fins = s.st.fins || [];
    while (F.length < L.count) F.push({ side: F.length % 2 ? -1 : 1, k: F.length, x: S.x, z: S.z, yaw: S.yaw, cd: rand(0.5, 1.5), bite: null, ph: rand(0, 1) });
    const hw = D.wid / 2 + 1.0;
    F.forEach(f => {
      f.ph += dt * 1.4;
      if (f.bite) {
        const e = f.bite.e, T = f.bite;
        T.t += dt;
        if (e && !e.dying && T.t < 0.9) {
          const dx = e.x - f.x, dz = e.z - f.z, d = Math.hypot(dx, dz) || 1, sp = 11 * dt;
          f.yaw = Math.atan2(dx, dz);
          if (d < e.radius + 0.4) {
            hurtEnemy(e, L.dmg, dx / d * 5, dz / d * 5); if (e.grab) seaUnboard(e, 5);
            seaSplash(e.x, e.z, 0.8); AUDIO.play('chop', 0.8); f.bite = null; f.cd = L.cd * cdMul();
          } else { f.x += dx / d * Math.min(sp, d); f.z += dz / d * Math.min(sp, d); }
        } else { f.bite = null; f.cd = 0.3; }
        return;
      }
      // keep station off the side, a little behind the middle
      const row = Math.floor(f.k / 2), lz = -D.len * 0.15 - row * 1.4, w = shipW(f.side * hw, lz + Math.sin(f.ph) * 0.4);
      const dx = w[0] - f.x, dz = w[1] - f.z, d = Math.hypot(dx, dz);
      const sp = Math.max(Math.hypot(S.vx, S.vz) * 1.1, 2) + d * 2;
      if (d > 0.05) { f.x += dx / d * Math.min(d, sp * dt); f.z += dz / d * Math.min(d, sp * dt); }
      f.yaw = angleLerp(f.yaw, d > 0.3 ? Math.atan2(dx, dz) : S.yaw, Math.min(1, dt * 4));
      f.cd -= dt;
      if (f.cd <= 0 && !OC.sink) {
        const e = nearestEnemy(f.x, f.z, L.range * areaMul());
        if (e) f.bite = { e, t: 0 }; else f.cd = 0.3;
      }
    });
    F.length = L.count;
  },
};
// ---------- Water Cannon: a jet that blasts swimmers back and washes boarders off ----------
SKILL_HOOKS.hose = {
  update(s, L, dt) {
    const S = OC.ship, M = mountsOf(shipDef()), p = mountW(M.hose);
    s.st.tick = (s.st.tick || 0) - dt;
    s.st.jets = s.st.jets || [];
    const range = L.range * areaMul();
    // boarders first, then the nearest swimmers
    const taken = new Set(), aims = [];
    for (let j = 0; j < L.jets; j++) {
      let e = null, bd = 1e9;
      for (const o of G.run.enemies) if (o.grab && !o.dying && !taken.has(o)) { const d = Math.hypot(o.x - p[0], o.z - p[2]); if (d < bd) { bd = d; e = o; } }
      if (!e) e = nearestEnemy(p[0], p[2], range, taken);
      if (e) { taken.add(e); aims.push(e); }
    }
    s.st.jets = aims.map((e, j) => { const a = Math.atan2(e.x - p[0], e.z - p[2]); const old = s.st.jets[j]; return { a: old ? angleLerp(old.a, a, Math.min(1, dt * 10)) : a, e }; });
    if (s.st.jets.length) s.st.aim = s.st.jets[0].a - S.yaw;
    if (s.st.tick > 0 || OC.sink) return;
    s.st.tick = 0.15;
    for (const J of s.st.jets) {
      const dx = Math.sin(J.a), dz = Math.cos(J.a);
      J.len = range;
      gridQuery(p[0] + dx * range / 2, p[2] + dz * range / 2, range / 2 + 1, e => {
        const ox = e.x - p[0], oz = e.z - p[2], t = ox * dx + oz * dz;
        if (t < 0 || t > range || Math.abs(ox * dz - oz * dx) > 0.45 + e.radius) return;
        hurtEnemy(e, L.dmg, dx * L.knock * 1.6, dz * L.knock * 1.6, { sound: false, color: [0.6, 0.9, 1] });
        if (e.grab) seaUnboard(e, L.knock * 2);
      });
    }
    if (s.st.jets.length && Math.random() < 0.3) AUDIO.play('wind', 0.4);
  },
};
// ---------- Goo Figurehead: rams hit harder and splash ----------
SKILL_HOOKS.figure = { update() {} };
// called by seaRam: the figurehead's splash around a rammed swimmer
function figureSplash(e) {
  const s = slotOf('figure');
  if (!s) return;
  const L = skillL(s), r = L.radius * areaMul();
  enemiesInRadius(e.x, e.z, r, o => { if (o !== e) hurtEnemy(o, L.shock, (o.x - e.x) * 2, (o.z - e.z) * 2, { sound: false }); });
  FX.ring(e.x, e.z, r * 1.2, [R.goo.base[0], R.goo.base[1], R.goo.base[2]], 0.35, 0.8);
  FX.droplets(e.x, 0.5, e.z, 6, 0, 4, 0.06, R.goo.base);
}

// ---------- the passives at work: spikes, repairs and the crew ----------
function seaPassives(dt) {
  const run = G.run, S = OC.ship;
  const fl = lvlOf('fort');
  if (fl) {
    OC.spikeT = (OC.spikeT || 0) - dt;
    if (OC.spikeT <= 0) {
      OC.spikeT = 1.5;
      for (const e of run.enemies) if (e.grab && !e.dying) { hurtEnemy(e, 3 + 2 * fl, 0, 0, { sound: false, color: [0.8, 0.85, 0.95] }); FX.burst(e.x, 0.4, e.z, 4, [0.8, 0.85, 0.95], 2, 0.05, 0.2, 1, 1); }
    }
  }
  const cl = lvlOf('crew');
  const C = OC.crew;
  const want = cl ? Math.min(3, 1 + Math.floor(cl / 4)) : 0;
  while (C.length < want) C.push({ u: Math.random(), sp: rand(0.12, 0.18), work: 0, ph: 0, bonk: rand(1, 3), yaw: 0 });
  C.length = want;
  for (const c of C) {
    c.bonk -= dt;
    if (c.work > 0) { c.work -= dt; c.ph += dt * 1.6; }
    else { c.u = (c.u + c.sp * dt) % 1; c.ph += dt * 2.2; if (Math.random() < dt * 0.25 && run.hp < run.maxHp) { c.work = 1.5; c.ph = 0; } }
    if (c.work > 0 && Math.random() < dt * 3) { const p = crewW(c); FX.star(p[0], p[1] + 0.3, p[2], 0.15, [1, 0.9, 0.4], 0.3); }
    if (c.bonk <= 0 && !OC.sink) {
      c.bonk = 3;
      const b = run.enemies.find(e => e.grab && !e.dying);
      if (b) { hurtEnemy(b, 6 + 1.5 * cl, 0, 0); if (Math.random() < 0.4) seaUnboard(b, 4); c.work = 0.6; c.ph = 0; AUDIO.play('clang', 1.2); }
    }
  }
}
// where a crew member is on its deck walk, and which way it faces
function crewW(c, out = [0, 0, 0]) {
  const D = shipDef(), M = mountsOf(D), P = M.crew, n = P.length, f = c.u * n, i = Math.floor(f) % n, u = f - Math.floor(f);
  const a = P[i], b = P[(i + 1) % n], lx = lerp(a[0], b[0], u), lz = lerp(a[1], b[1], u);
  const w = shipW(lx, lz);
  c.yaw = OC.ship.yaw + Math.atan2(b[0] - a[0], b[1] - a[1]);
  out[0] = w[0]; out[1] = OC.ship.y + crewY(M, D); out[2] = w[1];
  return out;
}

// ---------- the sea's shots: musket balls, harpoons, shells; barrels; nets ----------
function updateSeaShots(dt) {
  const run = G.run, S = OC.ship;
  for (const p of OC.shot) {
    if (p.k === 'shell') {
      p.t += dt;
      const u = clamp(p.t / p.dur, 0, 1);
      p.x = lerp(p.sx, p.tx, u); p.z = lerp(p.sz, p.tz, u); p.y = lerp(p.sy, 0, u) + Math.sin(u * Math.PI) * 4.5;
      if (u >= 1) {
        p.dead = true;
        enemiesInRadius(p.tx, p.tz, p.radius, e => { const dx = e.x - p.tx, dz = e.z - p.tz, d = Math.hypot(dx, dz) || 1; hurtEnemy(e, p.dmg, dx / d * 8, dz / d * 8, { sound: false }); if (e.grab) seaUnboard(e, 5); });
        FX.ring(p.tx, p.tz, p.radius * 1.3, p.gold ? [1, 0.85, 0.3] : [1, 0.6, 0.3], 0.5, 1);
        FX.burst(p.tx, 0.4, p.tz, 26, [1, 0.6, 0.25], 7, 0.16, 0.5, 1, 2);
        FX.burst(p.tx, 0.2, p.tz, 22, [0.85, 0.95, 1], 6, 0.14, 0.7, 2, 4);
        FX.smoke(p.tx, 0.6, p.tz, 1.2, [0.6, 0.6, 0.65], 1.2, 1);
        G.cam.shake = Math.max(G.cam.shake, 0.12); AUDIO.play('boom');
      }
      continue;
    }
    p.life -= dt;
    p.x += p.vx * dt; p.z += p.vz * dt;
    enemiesInRadius(p.x, p.z, p.k === 'harpoon' ? 0.3 : 0.2, e => {
      if (p.dead || p.hit.has(e)) return;
      p.hit.add(e);
      const sp = Math.hypot(p.vx, p.vz) || 1;
      hurtEnemy(e, p.dmg, p.vx / sp * (p.k === 'harpoon' ? 1 : 2), p.vz / sp * (p.k === 'harpoon' ? 1 : 2), { sound: p.k === 'harpoon' });
      if (p.k === 'harpoon') { p.last = e; FX.burst(e.x, 0.6, e.z, 6, [0.9, 0.95, 1], 3, 0.06, 0.25, 1, 1); }
      if (p.pierce-- <= 0) p.dead = true;
    });
    if (p.life <= 0) { p.dead = true; if (p.k === 'harpoon') seaSplash(p.x, p.z, 0.6); }
    // the harpoon's catch is reeled in toward the hull
    if (p.dead && p.k === 'harpoon' && p.last && !p.last.dying && !p.last.boss) { p.last.reel = 0.7; p.last.stun = 0.8; }
  }
  OC.shot = OC.shot.filter(p => !p.dead);
  // reeled-in swimmers
  for (const e of run.enemies) if (e.reel > 0 && !e.dying) {
    e.reel -= dt;
    const dx = S.x - e.x, dz = S.z - e.z, d = Math.hypot(dx, dz) || 1;
    e.kx = dx / d * 9 / Math.sqrt(e.mass); e.kz = dz / d * 9 / Math.sqrt(e.mass);
  }
  // barrels
  for (const b of OC.mines) {
    b.t += dt; b.ph += dt * 2;
    const k = Math.exp(-dt * 1.6); b.vx *= k; b.vz *= k; b.x += b.vx * dt; b.z += b.vz * dt;
    let boom = b.t > 18;
    if (b.t > 0.6 && !boom) enemiesInRadius(b.x, b.z, 1.0, () => { boom = true; });
    if (boom) {
      b.dead = true;
      enemiesInRadius(b.x, b.z, b.radius, e => { const dx = e.x - b.x, dz = e.z - b.z, d = Math.hypot(dx, dz) || 1; hurtEnemy(e, b.dmg, dx / d * 7, dz / d * 7, { sound: false }); });
      FX.ring(b.x, b.z, b.radius * 1.2, [1, 0.6, 0.25], 0.45, 1);
      FX.burst(b.x, 0.4, b.z, 22, [1, 0.55, 0.2], 6, 0.14, 0.5, 1, 2);
      FX.burst(b.x, 0.3, b.z, 14, [0.55, 0.35, 0.2], 5, 0.1, 0.6, 2, 2);
      seaSplash(b.x, b.z, 1.2); AUDIO.play('boom');
    }
  }
  OC.mines = OC.mines.filter(b => !b.dead);
  // nets: fly, land, hold what is under them, then sink
  for (const n of OC.nets) {
    n.t += dt;
    if (n.t < n.fly) {
      const u = n.t / n.fly;
      n.x = lerp(n.sx, n.tx, u); n.z = lerp(n.sz, n.tz, u); n.y = lerp(n.sy, 0, u) + Math.sin(u * Math.PI) * 2.5;
      continue;
    }
    if (!n.landed) {
      n.landed = true; n.x = n.tx; n.z = n.tz; n.y = 0;
      enemiesInRadius(n.x, n.z, n.r, e => { if (e.boss) return; n.caught.push(e); hurtEnemy(e, n.dmg, 0, 0, { sound: false }); e.netT = n.hold; });
      seaSplash(n.x, n.z, n.r * 0.7); AUDIO.play('splash', 0.8);
    }
    if (n.t > n.fly + n.hold) n.dead = true;
  }
  OC.nets = OC.nets.filter(n => !n.dead);
}

// ---------- drawing everything mounted on the ship ----------
function seaDrawMounts(x, y, z, yaw, D) {
  const M = mountsOf(D), c = Math.cos(yaw), s = Math.sin(yaw), ms = M.ms, run = G.run;
  const at = (sp, out = [0, 0, 0]) => { out[0] = x + c * sp[0] + s * sp[1]; out[1] = y + sp[2]; out[2] = z - s * sp[0] + c * sp[1]; return out; };
  const still = m => MODELS.defs[m].clips.still.row;
  const draw = (m, p, a, sc = ms, row, tint) => { if (R.enemyDraw[m]) pushEnemy(m, false, p[0], p[1], p[2], a, row ?? still(m), sc, 1, 0, 0, 0, tint ? tint[0] : 1, tint ? tint[1] : 1, tint ? tint[2] : 1); };
  const evoGlow = (sl, p) => { if (sl.evo && Math.random() < 0.08) FX.star(p[0] + rand(-0.3, 0.3), p[1] + rand(0.2, 0.8), p[2] + rand(-0.3, 0.3), 0.18, [1, 0.85, 0.35], 0.4); };
  const p = [0, 0, 0];
  let sl;
  if ((sl = slotOf('cannon'))) {
    const L = skillL(sl), n = Math.min(L.count, M.guns.length);
    for (let i = 0; i < n; i++) {
      const g = M.guns[i], a = yaw + ((sl.st.aim && sl.st.aim[i]) ?? (g[1] < 0 ? Math.PI : 0)), k = (sl.st.kick && sl.st.kick[i]) || 0;
      at(g, p); p[0] -= Math.sin(a) * k * 0.08; p[2] -= Math.cos(a) * k * 0.08;
      draw('scannon', p, a, ms * (1 + k * 0.06)); evoGlow(sl, p);
    }
  }
  if ((sl = slotOf('musket'))) { at(M.pile, p); draw('smusket', p, yaw + 0.4); evoGlow(sl, p); }
  if ((sl = slotOf('harpoon'))) { at(M.bow, p); draw('sharpoon', p, yaw + (sl.st.aim || 0)); evoGlow(sl, p); }
  if ((sl = slotOf('gunner'))) { at(M.turret, p); const k = sl.st.kick || 0, a = yaw + (sl.st.aim || 0); p[0] -= Math.sin(a) * k * 0.1; p[2] -= Math.cos(a) * k * 0.1; draw('sgunner', p, a, ms * 1.1); evoGlow(sl, p); }
  if ((sl = slotOf('lamp'))) { at(M.lamp, p); draw('slamp', p, yaw); evoGlow(sl, p); }
  if ((sl = slotOf('net'))) { at(M.net, p); draw('snetrack', p, yaw + Math.PI / 2); }
  if ((sl = slotOf('hose'))) { at(M.hose, p); draw('shose', p, yaw + (sl.st.aim || 0)); evoGlow(sl, p); }
  if ((sl = slotOf('figure'))) { at(M.fig, p); const g = R.goo.base; draw('sfigure', p, yaw, ms * 1.2, null, [g[0] * 1.1, g[1] * 1.1, g[2] * 1.1]); evoGlow(sl, p); }
  if ((sl = slotOf('anchor')) && sl.st.pos) {
    // the chain: a sagging tube from where it leaves the bow out to each anchor
    at(M.anchor, p);
    for (const [ax, az, a] of sl.st.pos) {
      const n = 10, pts = [];
      for (let i = 0; i < n; i++) { const u = i / (n - 1); pts.push(lerp(p[0], ax, u), lerp(p[1], 0.35, u) - Math.sin(u * Math.PI) * 0.25, lerp(p[2], az, u)); }
      R.ribStrip(pts, n, 0.06 * ms, [0.32, 0.34, 0.4, 1], 1, 0, 1);
      if (R.enemyDraw.sanchor) pushEnemy('sanchor', false, ax, -0.05, az, a + Math.PI / 2, still('sanchor'), ms * 1.2, 1, 0, 0, 0, 1, 1, 1);
      pushDecal(ax, az, 0.6 * ms, 0.6 * ms, 0, 3, 0, 0.5, 1, 1, 1, 0.4, true);
    }
  }
  // the passives
  const fl = lvlOf('fort');
  if (fl) {
    const [hl, hr] = hullSeg(D), per = Math.PI * hr + 2 * hl * 2, n = Math.max(8, Math.round(per / (0.62 * ms)));
    for (let i = 0; i < n; i++) {
      const u = (i / n) * (2 * hl * 2 + 2 * Math.PI * hr), q = hullPoint(u, hl, hr);
      const lx = q[0] * 1.0, lz = q[1], wx = x + c * lx + s * lz, wz = z - s * lx + c * lz, nx = c * q[2] + s * q[3], nz = -s * q[2] + c * q[3];
      if (R.enemyDraw.sfort) pushEnemy('sfort', false, wx, y + M.rim, wz, Math.atan2(-nz, nx), still('sfort'), ms * (0.9 + 0.03 * fl), 1, 0, 0, 0, 1, 1, 1);
    }
  }
  if (lvlOf('propeller')) {
    const n = lvlOf('propeller') >= 6 ? 2 : 1, row = MODELS.defs.sprop && MODELS.defs.sprop.clips.pspin;
    for (let i = 0; i < n; i++) {
      const sp = [M.stern[0] + (n > 1 ? (i ? -0.35 : 0.35) * ms : 0), M.stern[1], M.stern[2]];
      at(sp, p);
      if (row) draw('sprop', p, yaw, ms, row.row + Math.floor(((OC.t * 6) % 1) * row.frames));
      if (Math.hypot(OC.ship.vx, OC.ship.vz) > 0.5 && Math.random() < 0.5) FX.part(p[0] + rand(-0.15, 0.15), 0.05, p[2] + rand(-0.15, 0.15), -Math.sin(yaw) * 1.5, rand(0.4, 1), -Math.cos(yaw) * 1.5, 0.09, 0.04, 0.45, [0.9, 0.97, 1], 0.8, 0, -1);
    }
  }
  if (lvlOf('sails') && R.enemyDraw.ssail) {
    at(M.mast, p);
    const m = MODELS.defs.ssail, r = m.clips.rock;
    pushEnemy('ssail', false, p[0], p[1], p[2], yaw, r.row + Math.floor(((OC.t * 0.25) % 1) * r.frames), ms * (0.9 + 0.025 * lvlOf('sails')), 1, 0, 0, 0, 1, 1, 1);
  }
  if (lvlOf('crew') && R.enemyDraw.screw) {
    const m = MODELS.defs.screw, g = R.goo.base;
    for (const cr of OC.crew) {
      crewW(cr, p);
      const clip = cr.work > 0 ? m.clips.slam : m.clips.run, row = clip.row + Math.floor((cr.ph % 1) * clip.frames);
      pushEnemy('screw', false, p[0], p[1], p[2], cr.yaw, row, ms * 0.9, 1, 0, 0, 0, g[0], g[1], g[2]);
    }
  }
}
// a point round the hull's capsule outline at distance u along it: [x, z, nx, nz] (local)
function hullPoint(u, hl, hr) {
  const side = 2 * hl, arc = Math.PI * hr;
  if (u < side) return [hr, -hl + u, 1, 0];
  u -= side;
  if (u < arc) { const a = u / hr; return [Math.cos(a) * hr, hl + Math.sin(a) * hr, Math.cos(a), Math.sin(a)]; }
  u -= arc;
  if (u < side) return [-hr, hl - u, -1, 0];
  u -= side;
  const a = Math.PI + Math.min(u, arc) / hr;
  return [Math.cos(a) * hr, -hl + Math.sin(a) * hr, Math.cos(a), Math.sin(a)];
}
// everything that flies, swims or floats out from the ship
function emitSeaShots() {
  const S = OC.ship, D = shipDef(), ms = mountsOf(D).ms;
  emitSeaMore();
  for (const b of OC.balls) {
    pushImp(b.x, b.y, b.z, 0.26, Math.sin(b.spin + b.t * 6), Math.cos(b.spin + b.t * 6), 0.3, 1, 13, 0, b.gold ? 0.5 : 0, 0, 0, 0, 0, 1);
    pushDecal(b.x + 0.1, b.z + 0.08, 0.22, 0.2, 0, 1, 0, 0, 0.02, 0.06, 0.12, 0.3);
  }
  for (const p of OC.shot) {
    if (p.k === 'musket') pushImp(p.x, p.y, p.z, 0.11, 0, 1, 0, 1, 13, 0, p.gold ? 0.6 : 0.1, 0, 0, 0, 0, 1);
    else if (p.k === 'harpoon') {
      const sp = Math.hypot(p.vx, p.vz) || 1;
      pushImp(p.x, p.y, p.z, 0.55, p.vx / sp, 0, p.vz / sp, 1, 14, 0, p.gold ? 0.5 : 0, 0, 0, 0, 0, 1);
      R.ribStrip([p.ox, p.y, p.oz, (p.ox + p.x) / 2, p.y - 0.2, (p.oz + p.z) / 2, p.x, p.y, p.z], 3, 0.04, [0.95, 0.88, 0.65, 1], 1, 0, 1);
    } else if (p.k === 'shell') {
      pushImp(p.x, p.y, p.z, 0.36, 0, 1, 0, 1.2, 13, 0, p.gold ? 0.6 : 0.2, 0, 0, 0, 0, 1);
      const u = clamp(p.t / p.dur, 0, 1);
      pushDecal(p.tx, p.tz, p.radius * (0.4 + 0.6 * u), p.radius * (0.4 + 0.6 * u), 0, 4, 0, u, 1, 0.55, 0.25, 0.7);
      FX.part(p.x, p.y, p.z, 0, 0, 0, 0.18, 0.4, 0.4, [0.75, 0.75, 0.8], 0.35, 2, 0, 1);
    }
  }
  for (const b of OC.mines) {
    const by = Math.sin(b.ph) * 0.05 - 0.18;
    if (R.enemyDraw.sbarrel) pushEnemy('sbarrel', false, b.x, by, b.z, b.yaw, MODELS.defs.sbarrel.clips.still.row, ms * 0.95, 1, 0, b.t > 17 ? 0.5 * (Math.sin(b.t * 30) > 0) : 0, 0, 1, 1, 1);
    seaShadow(b.x, b.z, 0.38 * ms, 0.38 * ms, b.yaw, 0.45);
    pushDecal(b.x, b.z, 0.32 * ms, 0.32 * ms, 0, 3, 0, 0.5, 1, 1, 1, 0.35, true);
    if (Math.random() < 0.3) FX.part(b.x, 0.45 * ms, b.z, 0, 0.6, 0, 0.06, 0.02, 0.25, [1, 0.8, 0.3], 1, 1);
  }
  for (const n of OC.nets) {
    if (!R.enemyDraw.snet) continue;
    const sink = n.landed ? clamp((n.t - n.fly - n.hold + 0.5) / 0.5, 0, 1) : 0;
    pushEnemy('snet', false, n.x, n.landed ? -0.15 - sink * 0.6 : n.y, n.z, n.spin, MODELS.defs.snet.clips.still.row, n.r * (n.landed ? 1 : 0.4 + 0.6 * clamp(n.t / n.fly, 0, 1)), 1, 0, 0, 0, 1, 1, 1);
  }
  // the lamp's beams and the water cannon's jets
  const ls = slotOf('lamp');
  if (ls && !OC.sink) {
    const L = skillL(ls), p = mountW(mountsOf(D).lamp), half = L.width * Math.PI / 180, len = L.len * areaMul();
    for (let b = 0; b < L.beams; b++) {
      const a = (ls.st.a || 0) + b * Math.PI;
      pushDecal(p[0], p[2], len, len, -a, 10, half, 1, 1, 0.78, 0.3, ls.evo ? 0.45 : 0.34, true);
      FX.glow(p[0], p[1] + 0.9 * mountsOf(D).ms, p[2], 0.6, [1, 0.95, 0.6], 0.05, 0.8);
    }
  }
  const hs = slotOf('hose');
  if (hs && hs.st.jets && !OC.sink) {
    const p = mountW(mountsOf(D).hose), y0 = p[1] + 0.34 * mountsOf(D).ms;
    for (const J of hs.st.jets) {
      const len = (J.len || 5) * clamp(Math.hypot(J.e.x - p[0], J.e.z - p[2]) / (J.len || 5), 0.3, 1), dx = Math.sin(J.a), dz = Math.cos(J.a), n = 8, pts = [];
      for (let i = 0; i < n; i++) { const u = i / (n - 1); pts.push(p[0] + dx * len * u, y0 * (1 - u * u) + 0.2 * u, p[2] + dz * len * u); }
      R.ribStrip(pts, n, 0.22, [0.6, 0.88, 1, 0.75], 0, OC.t * 6, 1);
      if (Math.random() < 0.7) FX.part(p[0] + dx * len, 0.25, p[2] + dz * len, rand(-1, 1), rand(1, 2.4), rand(-1, 1), 0.1, 0.03, 0.4, [0.85, 0.95, 1], 0.9, 0, -6);
    }
  }
  // gulls overhead (and their shadows on the water)
  const gs = slotOf('gulls');
  if (gs && gs.st.birds && R.enemyDraw.sgull) {
    const m = MODELS.defs.sgull, c = m.clips.flap;
    for (const b of gs.st.birds) {
      pushEnemy('sgull', false, b.x, b.y - 0.5, b.z, b.yaw, c.row + Math.floor((b.ph % 1) * c.frames), 1.6, 1, 0, 0, 0, 1, 1, gs.evo ? 0.75 : 1);
      pushDecal(b.x + 0.3, b.z + 0.2, 0.35, 0.25, -b.yaw, 1, 0, 0, 0.02, 0.06, 0.12, 0.25);
    }
  }
  // sharks: a fin and a back above the water, a foam line behind
  const ss = slotOf('shark');
  if (ss && ss.st.fins && R.enemyDraw.sshark) {
    const m = MODELS.defs.sshark, c = m.clips.swim;
    for (const f of ss.st.fins) {
      const sc = ss.evo ? 1.7 : 1.15;
      pushEnemy('sshark', false, f.x, -0.12 * sc, f.z, f.yaw, c.row + Math.floor((f.ph % 1) * c.frames), sc, 1, 0, 0, 0, 1, 1, 1);
      seaShadow(f.x, f.z, 0.4 * sc, 1.25 * sc, -f.yaw, 0.6);
      pushDecal(f.x, f.z, 0.5 * sc, 0.9 * sc, -f.yaw, 3, 0, 0.5, 1, 1, 1, 0.35, true);
    }
  }
}

// icons for the sea's upgrades, drawn from their own models: [icon key, model, framing]
const SEA_ICON_SHOTS = [
  ['skill-ship', 'raft', { yaw: 0.6, s: 1, d: 3.2, mid: 0.1 }],
  ['skill-cannon', 'scannon', { yaw: 0.9, s: 1.6, d: 1.9, mid: 0.35 }],
  ['skill-musket', 'smusket', { yaw: 0.6, s: 1.7, d: 1.7, mid: 0.3 }],
  ['skill-harpoon', 'sharpoon', { yaw: 1.2, s: 1.4, d: 2.0, mid: 0.5 }],
  ['skill-gunner', 'sgunner', { yaw: 0.8, s: 1.2, d: 2.2, mid: 0.3 }],
  ['skill-anchor', 'sanchor', { yaw: 0.3, s: 1.6, d: 2.0, mid: 0.55 }],
  ['skill-barrels', 'sbarrel', { yaw: 0.2, s: 1.9, d: 1.9, mid: 0.5 }],
  ['skill-lamp', 'slamp', { yaw: 0.3, s: 1.2, d: 2.2, mid: 0.65 }],
  ['skill-net', 'snet', { yaw: 0.3, s: 0.8, d: 2.0, mid: 0.2 }],
  ['skill-gulls', 'sgull', { yaw: 0.5, s: 2.6, d: 2.1, mid: 1.35, pitch: 1.05 }],
  ['skill-shark', 'sshark', { yaw: 0.9, s: 1.2, d: 2.4, mid: 0.2 }],
  ['skill-hose', 'shose', { yaw: 1.0, s: 1.6, d: 1.9, mid: 0.4 }],
  ['skill-figure', 'sfigure', { yaw: 0.6, s: 1.7, d: 1.9, mid: 0.55, goo: true }],
  ['passive-fort', 'sfort', { yaw: -0.9, s: 2.2, d: 1.6, mid: 0.0 }],
  ['passive-propeller', 'sprop', { yaw: 1.95, s: 1.8, d: 1.9, mid: 0.4, pitch: 0.3 }],
  ['passive-crew', 'screw', { yaw: 0.4, s: 1.6, d: 2.0, mid: 0.65, goo: true }],
  ['passive-sails', 'ssail', { yaw: 0.75, s: 1.0, d: 2.6, mid: 1.0, pitch: 0.3 }],
];
