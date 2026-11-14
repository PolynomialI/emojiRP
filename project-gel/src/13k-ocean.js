// ============================================================
// The Ocean Update: a sea of its own, sailed from the home screen's second page (swipe right).
// The blob lounges on deck while you steer the ship: it rams swimmers, shakes off the ones that climb on to hack
// at the hull, and grows from a raft into ever bigger ships (the Ship upgrade, always in the first slot). Every
// other upgrade is mounted on the ship and moves to the next one. The hull's health is the run's health: when
// it is gone the ship breaks up and the blob goes under.
// Runs reuse the land game's run object, gems, level-up cards, chests and results; G.run.sea marks one.
// ============================================================

// The seven ships. len/wid: the hull's footprint (a capsule along the keel); deck: deck height; spot: where the
// blob lies (local x, z; it faces the bow); heroS: the blob's size aboard; speed/accel/turn: handling;
// hull: extra hull health; ram: ram damage at full speed; grip: how many boarders fit on; zoom: camera
// distance; wake: wake width; bob: how much it rides the swell
const SHIPS = [
  { id: 'raft', name: 'Raft', model: 'raft', len: 2.5, wid: 1.9, deck: 0.17, spot: [0, -0.2], heroS: 0.8, speed: 4.6, accel: 5.5, turn: 3.0, hull: 0, ram: 16, grip: 4, zoom: 0.88, wake: 0.8, bob: 0.05 },
  { id: 'canoe', name: 'Canoe', model: 'canoe', len: 3.8, wid: 1.05, deck: 0.125, spot: [0, -0.35], heroS: 0.82, speed: 5.4, accel: 6.5, turn: 2.7, hull: 0.15, ram: 24, grip: 5, zoom: 1.08, wake: 0.9, bob: 0.045 },
  { id: 'sloop', name: 'Pirate Sloop', model: 'sloop', len: 5.6, wid: 2.1, deck: 0.655, spot: [0, -0.55], heroS: 0.9, speed: 5.6, accel: 5, turn: 2.2, hull: 0.35, ram: 36, grip: 7, zoom: 1.22, wake: 1.25, bob: 0.04 },
  { id: 'galleon', name: 'Black Galleon', model: 'galleon', len: 7.6, wid: 2.7, deck: 0.885, spot: [0, 0.4], heroS: 1.0, speed: 5.8, accel: 4.2, turn: 1.8, hull: 0.6, ram: 50, grip: 9, zoom: 1.4, wake: 1.6, bob: 0.035 },
  { id: 'yacht', name: 'Yacht', model: 'yacht', len: 9.4, wid: 3.0, deck: 1.19, spot: [0, 2.2], heroS: 1.1, speed: 6.8, accel: 5, turn: 1.7, hull: 0.85, ram: 64, grip: 10, zoom: 1.58, wake: 1.9, bob: 0.03 },
  { id: 'cruise', name: 'Cruise Ship', model: 'cruise', len: 12, wid: 3.6, deck: 2.76, spot: [0, -1.0], heroS: 1.25, speed: 6.4, accel: 3.2, turn: 1.3, hull: 1.2, ram: 84, grip: 12, zoom: 1.8, wake: 2.3, bob: 0.02 },
  { id: 'cargo', name: 'Cargo Ship', model: 'cargo', len: 14.5, wid: 3.9, deck: 3.19, spot: [0, 4.4], heroS: 1.4, speed: 6.2, accel: 2.6, turn: 1.05, hull: 1.6, ram: 110, grip: 14, zoom: 2.0, wake: 2.6, bob: 0.015 },
  { id: 'battleship', name: 'Battleship', model: 'battleship', len: 16.5, wid: 3.7, deck: 2.87, spot: [0, 4.05], heroS: 1.5, speed: 6.5, accel: 2.8, turn: 1.0, hull: 2.1, ram: 140, grip: 16, zoom: 2.2, wake: 2.9, bob: 0.012 },
  { id: 'carrier', name: 'Aircraft Carrier', model: 'carrier', len: 19, wid: 4.6, deck: 2.88, spot: [0.6, 4.2], heroS: 1.65, speed: 6.3, accel: 2.4, turn: 0.92, hull: 2.7, ram: 175, grip: 18, zoom: 2.45, wake: 3.2, bob: 0.01 },
  { id: 'ark', name: 'Golden Ark', model: 'ark', len: 21, wid: 5.6, deck: 2.035, spot: [0, 3.2], heroS: 1.8, speed: 6.8, accel: 2.7, turn: 0.95, hull: 3.4, ram: 220, grip: 20, zoom: 2.65, wake: 3.5, bob: 0.01 },
];
// The ten sea chapters. rough: swell (0 calm .. 1 rough); storm: a storm blows from the start (1), or comes in with
// the boss (0.5); deep/shallow/lines: the water's colors; isle: the islands' look; mix: [enemy, from second, weight]
const SEA_CHAPTERS = [
  { name: 'Sunny Shallows', rough: 0.0, storm: 0, deep: '#1567c4', shallow: '#2b9be0', lines: '#bfeaff', fog: '#9fdcfa', isle: 'palm',
    mix: [['pswim', 0, 1], ['pfloat', 50, 0.35], ['ptube', 140, 0.22]], boss: 'tuber' },
  { name: 'Coral Cove', rough: 0.1, storm: 0, deep: '#1466b8', shallow: '#2a9ad0', lines: '#c8f4ff', fog: '#8ad0ee', isle: 'palm', mix: null },
  { name: 'Kelp Narrows', rough: 0.2, storm: 0, deep: '#135a80', shallow: '#2a8a8a', lines: '#c0ecd8', fog: '#7ab8c0', isle: 'palm', mix: null },
  { name: "Smugglers' Strait", rough: 0.3, storm: 0, deep: '#16548e', shallow: '#2a7cb8', lines: '#c0e2ff', fog: '#7aaed8', isle: 'palm', mix: null },
  { name: 'Glacier Bay', rough: 0.35, storm: 0, deep: '#1f5c9a', shallow: '#4a96cc', lines: '#eef9ff', fog: '#b0d8f0', isle: 'palm', mix: null },
  { name: 'Volcano Atoll', rough: 0.45, storm: 0.5, deep: '#18466e', shallow: '#2a6e8e', lines: '#ffd0b0', fog: '#8a98a8', isle: 'palm', mix: null },
  { name: 'Ghost Fog', rough: 0.5, storm: 0.5, deep: '#1e3a52', shallow: '#356078', lines: '#d0ecf8', fog: '#8aa2b0', isle: 'palm', mix: null },
  { name: 'Thunder Sea', rough: 0.65, storm: 1, deep: '#163650', shallow: '#2a5a7a', lines: '#c8e0f0', fog: '#6a8494', isle: 'palm', mix: null },
  { name: 'Kraken Deep', rough: 0.75, storm: 0.5, deep: '#102a48', shallow: '#22506e', lines: '#b8daf0', fog: '#5a7890', isle: 'palm', mix: null },
  { name: 'Pirate Fortress', rough: 0.85, storm: 1, deep: '#14304a', shallow: '#285670', lines: '#c8dcea', fog: '#62788a', isle: 'palm', mix: null },
  // the ten after the Pirate King (13o-sea-deep.js gives each its crowd, islands, mechanic, miniboss and boss).
  // vt: the water's variant (05-glsl.js); light/sky: the light's color and the sky's (night, underworld, sunset)
  { name: 'Glowtide Lagoon', rough: 0.3, storm: 0, deep: '#03101c', shallow: '#082a3a', lines: '#5affd8', fog: '#071826', vt: 1, light: [0.42, 0.52, 0.78], sky: [0.12, 0.2, 0.36], mix: null },
  { name: 'Sargasso Snarl', rough: 0.25, storm: 0, deep: '#13301e', shallow: '#2e5030', lines: '#cfe8a0', fog: '#6a8a62', light: [0.95, 0.95, 0.82], mix: null },
  { name: 'Maelstrom Reach', rough: 0.8, storm: 0.5, deep: '#12303a', shallow: '#2a5a62', lines: '#d0f0f0', fog: '#5a7a80', mix: null },
  { name: 'Sunken Atlantis', rough: 0.2, storm: 0, deep: '#06607e', shallow: '#18b4cc', lines: '#e8fff8', fog: '#8adcea', light: [1.02, 1.0, 0.94], mix: null },
  { name: 'Soda Sea', rough: 0.3, storm: 0, deep: '#a8306a', shallow: '#ec72ae', lines: '#ffe8f4', fog: '#f2a8cc', vt: 2, light: [1.05, 0.93, 0.98], sky: [1.0, 0.85, 0.95], mix: null },
  { name: 'Bermuda Triangle', rough: 0.5, storm: 0.5, deep: '#0c3634', shallow: '#1c6656', lines: '#a8ffd8', fog: '#46766a', light: [0.8, 0.95, 0.88], mix: null },
  { name: 'Sky Sea', rough: 0, storm: 0, deep: '#b8cce8', shallow: '#f6f8ff', lines: '#ffe8f4', fog: '#d8e8ff', vt: 3, light: [1.08, 1.05, 1.0], sky: [0.92, 0.96, 1.0], mix: null },
  { name: 'Leviathan Trench', rough: 0.7, storm: 0.5, deep: '#040c1a', shallow: '#0c263c', lines: '#7ab8e0', fog: '#0c1a2c', light: [0.55, 0.65, 0.82], sky: [0.2, 0.28, 0.42], mix: null },
  { name: "Davy Jones' Locker", rough: 0.55, storm: 0, deep: '#08180f', shallow: '#183626', lines: '#6affa8', fog: '#14281e', vt: 4, light: [0.5, 0.78, 0.6], sky: [0.16, 0.3, 0.22], mix: null },
  { name: "World's Edge", rough: 0.6, storm: 0, deep: '#1a3a6a', shallow: '#3a7ab8', lines: '#ffe8a8', fog: '#f0c890', vt: 5, light: [1.18, 0.92, 0.66], sky: [1.0, 0.78, 0.55], mix: null },
];
const SEA_COUNT = SEA_CHAPTERS.length;
const SEA = {
  sink: 0.52,       // how far a swimmer sits in the water (of its height): the water hides the rest
  ramMin: 1.1,      // closing speed that counts as a ram
  hackCd: 1.45,     // seconds between a boarder's hook blows
  shake: 0.38,      // boarders are flung off when the ship turns faster than this share of its best turn rate
  view: 1,          // (set from the ship) camera zoom
};
// the live sea state of a run (G.run.sea === OC while sailing)
const OC = { ship: null, wake: [], isles: [], chunks: new Map(), balls: [], shot: [], mines: [], nets: [], crew: [], hz: [], look: null, sink: null, stage: 0, t: 0, wakeT: 0, storm: 0 };

function seaInfo(n) {
  const k = clamp(n, 1, SEA_COUNT) - 1, C = SEA_CHAPTERS[k];
  // (oceans 11-20, for those who beat the Pirate King, build on ocean 10's numbers a step at a time: every run
  // still starts on a raft, and their crowds, hazards and bosses are the harder part)
  const deep = Math.max(0, k - 9), kk = Math.min(k, 9);
  return {
    n, sea: true, arenaName: C.name, bosses: [C.boss],
    // every run starts on a raft, so the chapters climb gently (their crowds, islands and bosses do the rest)
    hpMul: (1 + 0.08 * kk + 0.006 * kk * kk) * (1 + 0.04 * deep + 0.002 * deep * deep), dmgMul: (1 + 0.045 * kk) * (1 + 0.025 * deep + 0.0015 * deep * deep), deep, rateMul: 0.7 + 0.05 * kk + 0.02 * deep, speedMul: 1 + 0.01 * kk + 0.005 * deep,
    bossHpMul: Math.pow(1.12, kk) * (1 + 0.05 * deep), grand: 1 + 0.03 * k, reward: Math.round(220 * Math.pow(1.1, k)), has: {},
  };
}
const shipDef = () => SHIPS[clamp(OC.stage, 0, SHIPS.length - 1)];
const seaShipReady = i => { const m = SHIPS[i].model; return !!R.enemyDraw[m] && (!MODELS.defs[m + '_rig'] || !!R.enemyDraw[m + '_rig']); };
// how hard everything at sea hits: a little harder on the raft, climbing with the ship (the Golden Ark takes twice
// the base damage), so a big ship is sturdier but never safe
const seaThreat = () => 1.1 + 0.1 * clamp(OC.stage, 0, SHIPS.length - 1);
const seaUnlocked = () => !!(G.save && G.save.cleared[CHAPTER_COUNT]);

// ---------- the look of the water ----------
function seaLook(n) {
  const C = SEA_CHAPTERS[clamp(n, 1, SEA_COUNT) - 1], f = R.frame;
  f.floorStyle = 21; f.stoneA = hexToRgb(C.deep); f.stoneB = hexToRgb(C.shallow); f.grout = hexToRgb(C.lines); f.accent = [1, 1, 1];
  f.fogCol = hexToRgb(C.fog); f.skyCol = C.sky ? C.sky.slice() : [0.8, 0.93, 1.0]; f.groundCol = hexToRgb(C.deep).map(v => v * 0.8); f.lightCol = C.light ? C.light.slice() : [1.0, 0.97, 0.9];
  f.spotMin = 1; f.shadowTint = [0.2, 0.35, 0.55];
  f.sea[0] = C.rough; f.sea[1] = C.storm >= 1 ? 1 : 0; f.sea[2] = C.vt || 0;
  const dp = hexToRgb(C.deep); for (let i = 0; i < 3; i++) SEA_SH[i] = dp[i] * 0.1;
}

// ---------- starting and leaving ----------
function beginSea(n) {
  // the first ships and every mount next (the first level-up offers them), the big ships after
  const C = SEA_CHAPTERS[n - 1];
  prioritizeMeshes([...SEA_MESHES, ...C.isles, ...C.mix.map(x => ENEMY_TYPES[x[0]].model), 'canoe', ...MOUNT_MESHES, 'pcapt', ...bossMeshes(C.boss), 'sloop', 'sloop_rig', 'pmusket',
    ...SHIPS.slice(3).flatMap(D => [D.model, ...(MODELS.defs[D.model + '_rig'] ? [D.model + '_rig'] : [])])]);
  for (const m of ['raft', 'pswim']) ensureMeshNow(m);
  startSea(n);
}
function startSea(chapter) {
  const info = seaInfo(chapter);
  OC.ship = { x: 0, z: 0, yaw: 0, yawV: 0, speed: 0, vx: 0, vz: 0, y: 0 };
  OC.wake.length = 0; OC.isles.length = 0; OC.chunks.clear(); OC.balls.length = 0; OC.shot.length = 0; OC.mines.length = 0; OC.nets.length = 0; OC.crew.length = 0; OC.hz.length = 0; OC.look = null; OC.boltT = 5; OC.sink = null; OC.stage = 0; OC.wantStage = 0; OC.t = 0; OC.wakeT = 0; OC.storm = 0;
  const run = G.run = {
    chapter, info, t: 0, kills: 0, bossKills: 0, eliteKills: 0, gooblins: 0, evos: 0, coins: 0, level: 1, xp: 0, xpNext: xpForSea(1), pending: 0, rerolls: 2,
    hp: 100, maxHp: 100, invuln: 1.2, revived: false, over: false, won: false, endT: 0,
    slots: [], stats: null,
    enemies: [], proj: [], eShots: [], gems: [], pickups: [], mines: [], bombs: [], worms: [], buddies: [], axes: [], beams: [],
    nextId: 1, spawnAcc: 0, events: seaEvents(chapter), bosses: [], bossStarted: false, bossTotalHp: 0,
    endless: false, rush: false, rushK: 0, powerCap: 99, tier: 0, sea: OC,
    vel: [0, 0, 0], contactSlow: 0, gemCombo: 0, gemComboT: 0, hurtFlash: 0, bladeAngle: 0, shield: null, regenAcc: 0,
  };
  run.gear = gearStats();
  seaLook(chapter);
  // the open sea: no walls, no scenery but the islands (added as the ship explores)
  ARENA.boxes = null; ARENA.hw = ARENA.hd = 1e5; ARENA.cr = 8; ARENA.theme = null; ARENA.props = []; ARENA.zones = []; ARENA.wall = []; ARENA.obstacles = []; ARENA.grid = null; ARENA.fx = null;
  const hero = G.hero;
  hero.reset(0, 0); hero.lounge = hero.lng = 1; hero.setArmCount(2);
  FX.clear(); G.numbers.length = 0; G.bolts.length = 0;
  addOrLevel('ship');
  addOrLevel('cannon');
  run.hp = run.maxHp;
  seaPlaceHero(0);
  G.cam.x = 0; G.cam.z = 0; G.cam.vx = 0; G.cam.vz = 0;
  seaIslands(true);
  seaIcons();
  G.timeScale = 1;
  setState('run');
}
// back to the home screen: the blob stands up again
function seaLeave() { const h = G.hero; if (h) { h.lounge = h.lng = 0; h.faceYaw = null; h.pos[1] = 0; h.scale = 1; } }

// ---------- stats ----------
// the sea's own upgrades in place of the land's passives (called by recomputeStats)
function seaStats(run) {
  const lv = lvlOf, gb = run.gear || {}, g = k => (gb[k] || 0) / 100;
  // the ship earned by the Ship level takes to the water once its meshes are built (by the mesh workers, never on
  // the spot: a big hull takes seconds to build); until then the last one sails on (seaShipArrives)
  OC.wantStage = Math.max(0, lv('ship') - 1);
  if (OC.wantStage <= OC.stage || seaShipReady(OC.wantStage)) OC.stage = OC.wantStage;
  const D = shipDef();
  run.stats = {
    dmgMul: (1 + g('dmg')) * (1 + 0.05 * lv('powder')),
    speedMul: (1 + 0.07 * lv('propeller')) * (1 + g('speed')),
    magnet: (1.6 + D.len * 0.2) * (1 + g('magnet')) * (1 + 0.1 * lv('treasure')),
    armorMul: Math.pow(0.95, lv('fort')) * (1 - Math.min(0.6, g('armor'))),
    cdMul: Math.pow(0.96, lv('sails')) * (1 - Math.min(0.5, g('cd'))),
    areaMul: 1 + g('area'), extra: 0, xpMul: 1 + g('xp'),
    regen: 0.003 * lv('crew') + g('regen'),
    ramMul: 1 + 0.12 * lv('fort'),
  };
  run.maxHp = 160 * (1 + D.hull * 0.7) * (1 + g('hp')) * (1 + 0.07 * lv('plating'));
  if (run.hp > run.maxHp) run.hp = run.maxHp;
  const h = G.hero;
  h.scale = D.heroS; h.bubbles = 0; h.stretchMul = 1; h.glow = 0; h.gloss = 1; h.wobbleMul = 1; h.topSpeed = 4.5;
}

// ---------- ship geometry ----------
// local (x across, z along the keel) to world; local +x is the port (left) side
function shipW(lx, lz, out = [0, 0]) {
  const S = OC.ship, c = Math.cos(S.yaw), s = Math.sin(S.yaw);
  out[0] = S.x + c * lx + s * lz; out[1] = S.z - s * lx + c * lz;
  return out;
}
function shipL(x, z, out = [0, 0]) {
  const S = OC.ship, c = Math.cos(S.yaw), s = Math.sin(S.yaw), dx = x - S.x, dz = z - S.z;
  out[0] = c * dx - s * dz; out[1] = s * dx + c * dz;
  return out;
}
// the hull as a capsule: half the straight part's length and the radius
const hullSeg = D => [Math.max(0, D.len / 2 - D.wid / 2), D.wid / 2];
// distance from (x, z) to the hull's edge (negative inside) and the outward normal (world) in out
const _hl = [0, 0];
function hullDist(x, z, out) {
  const D = shipDef(), [hl, hr] = hullSeg(D), L = shipL(x, z, _hl);
  const cz = clamp(L[1], -hl, hl), dx = L[0], dz = L[1] - cz, d = Math.hypot(dx, dz) || 1e-4;
  if (out) {
    const S = OC.ship, c = Math.cos(S.yaw), s = Math.sin(S.yaw), nx = dx / d, nz = dz / d;
    out[0] = c * nx + s * nz; out[1] = -s * nx + c * nz;
  }
  return d - hr;
}

// ---------- the run ----------
function updateOcean(dt) {
  const run = G.run, S = OC.ship, hero = G.hero;
  const live = G.state === 'run';
  run.invuln = Math.max(0, run.invuln - dt);
  run.hurtFlash = Math.max(0, run.hurtFlash - dt * 1.8);
  OC.t += dt;
  // an upgrade whose model was still being built when the run began gets its picture once the model is in
  if ((OC.iconT = (OC.iconT ?? 2) - dt) <= 0) { OC.iconT = 2; if (SEA_ICON_SHOTS.some(([k, m]) => !ICONS.map[k + '!'] && R.enemyDraw[m])) { seaIcons(); UI.slotSig = ''; } }
  if (live) {
    run.t += dt;
    while (run.events.length && run.t >= run.events[0].t) seaEvent(run.events.shift());
    // (fewer while the boss is out, so the fight is about the boss)
    const rate = (run.bossStarted ? 1.0 : spawnRate(run.t * 300 / SEA_BOSS_T)) * run.info.rateMul * 0.85 * 1.5;
    run.spawnAcc += rate * dt;
    while (run.spawnAcc >= 1) { run.spawnAcc -= 1; if (run.enemies.length < MAX_ALIVE) seaSpawn(); }
  }
  seaSteer(dt);
  seaPlaceHero(dt);
  run.vel[0] = S.vx; run.vel[2] = S.vz;
  seaIslands(false);
  seaWake(dt);
  gridBuild(run.enemies);
  seaFoes(dt);
  updateSkills(dt);
  updateSeaBalls(dt);
  updateSeaShots(dt);
  seaPassives(dt);
  seaIsleTick(dt);
  updateSeaHazards(dt);
  seaBossHazards(dt);
  seaWeather(dt);
  seaDeepTick(dt);
  updateProjectiles(dt);
  updateEnemyShots(dt);
  updatePickups(dt);
  if (run.stats.regen > 0 && run.hp > 0) run.hp = Math.min(run.maxHp, run.hp + run.maxHp * run.stats.regen * dt);
  secondWind(run);
  R.frame.lowHp = run.hp / run.maxHp < 0.25 ? 0.35 : 0;
  // a storm rolls in with the boss in some chapters
  const C = SEA_CHAPTERS[run.chapter - 1], want = C.storm >= 1 || (C.storm > 0 && run.bossStarted) ? 1 : 0;
  OC.storm += (want - OC.storm) * Math.min(1, dt * 0.25);
  R.frame.sea[1] = OC.storm;
  const bossesDown = live && run.bossStarted && run.bosses.length && run.bosses.every(b => b.dying);
  if (bossesDown) {
    run.won = true; run.endT = 0;
    for (const e of run.enemies) if (!e.dying && !e.boss) e.dying = 0.0001;
    for (const g of run.gems) g.pull = true;
    for (const p of run.pickups) if (p.kind === 'coin' || p.kind === 'scroll') p.pull = true;
    setState('victory');
  }
}

// Boat handling. On the keyboard the ship drives like a boat: W (or up) is full ahead along its heading, S (or down)
// backs it off, A and D (or left and right) turn it to port and starboard. With the touch stick or a gamepad the stick
// points where you want to go: the ship turns toward it (better when under way) and eases off the throttle while
// turning hard. Either way it slides only a little sideways.
function seaSteer(dt) {
  if (OC.wantStage > OC.stage && seaShipReady(OC.wantStage)) seaShipArrives();
  const S = OC.ship, D = shipDef(), run = G.run;
  const ix = G.input.x, iz = G.input.z, m = Math.min(1, Math.hypot(ix, iz));
  // (kelp and frost patches grip the hull)
  const top = D.speed * run.stats.speedMul * (1 - (OC.snared || 0));
  let steer = 0, thr = 0;
  const KY = INPUT.keys, ahead = (KY.has('w') || KY.has('arrowup') ? 1 : 0) - (KY.has('s') || KY.has('arrowdown') ? 1 : 0);
  const turnK = (KY.has('a') || KY.has('arrowleft') ? 1 : 0) - (KY.has('d') || KY.has('arrowright') ? 1 : 0);
  if ((ahead || turnK) && G.state === 'run') { steer = turnK; thr = ahead > 0 ? 1 : ahead < 0 ? -0.4 : 0; }
  else if (m > 0.12 && G.state === 'run') {
    const diff = angleDiff(S.yaw, Math.atan2(ix, iz));
    steer = clamp(diff * 2.4, -1, 1);
    thr = m * clamp(Math.cos(diff) * 0.75 + 0.45, 0.2, 1);
  }
  const want = thr * top;
  const acc = D.accel * (1 + 0.06 * lvlOf('propeller')), turn = D.turn * (1 + 0.05 * lvlOf('sails'));
  S.speed += (want - S.speed) * (1 - Math.exp(-dt * (Math.abs(want) > Math.abs(S.speed) ? acc / top : 0.8)));
  const tr = turn * (0.4 + 0.6 * clamp(Math.abs(S.speed) / top, 0, 1));
  S.yawV += (steer * tr - S.yawV) * (1 - Math.exp(-dt * 5));
  S.yaw += S.yawV * dt;
  const k = 1 - Math.exp(-dt * 4);
  S.vx += (Math.sin(S.yaw) * S.speed - S.vx) * k; S.vz += (Math.cos(S.yaw) * S.speed - S.vz) * k;
  S.x += S.vx * dt; S.z += S.vz * dt;
  // islands stop the ship (three circles along the keel)
  const [hl, hr] = hullSeg(D), p = [0, 0];
  for (const I of OC.isles) for (const L of isleLobes(I)) {
    for (const u of [-1, 0, 1]) {
      shipW(0, u * hl, p);
      const dx = p[0] - L.x, dz = p[1] - L.z, d = Math.hypot(dx, dz) || 1e-4, ov = L.r + hr - d;
      if (ov <= 0) continue;
      S.x += dx / d * ov; S.z += dz / d * ov;
      const vn = (S.vx * dx + S.vz * dz) / d;
      if (vn < 0) { S.vx -= dx / d * vn; S.vz -= dz / d * vn; if (vn < -2) { S.speed *= 0.5; G.cam.shake = Math.max(G.cam.shake, 0.12); AUDIO.play('thud'); } }
    }
  }
  S.y = Math.sin(OC.t * 1.6) * D.bob + Math.sin(OC.t * 2.7 + 1) * D.bob * 0.4;
}
// the blob lies on deck where the ship keeps it
function seaPlaceHero(dt) {
  const S = OC.ship, D = shipDef(), hero = G.hero, w = shipW(D.spot[0], D.spot[1]);
  hero.pos[0] = w[0]; hero.pos[2] = w[1]; hero.pos[1] = D.deck + S.y;
  hero.faceYaw = S.yaw; hero.lounge = 1;
  if (dt > 0) hero.update(dt, [S.vx, 0, S.vz], true);
  else { hero.yaw = S.yaw; hero.buildPrims(); }
  HERO_PT.x = S.x; HERO_PT.z = S.z;
}

// ---------- islands: a few, scattered by area as the ship explores ----------
const ISLE_CHUNK = 46;
function seaIslands(first) {
  const S = OC.ship, cx = Math.floor(S.x / ISLE_CHUNK), cz = Math.floor(S.z / ISLE_CHUNK);
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
    const key = (cx + i) + ',' + (cz + j);
    if (OC.chunks.has(key)) continue;
    OC.chunks.set(key, true);
    const rnd = mulberry((cx + i) * 7919 + (cz + j) * 104729 + G.run.chapter * 31);
    // islands aren't common: about one chunk in three has one, never right where the ship starts
    if (rnd() > 0.36) continue;
    const x = (cx + i + 0.2 + rnd() * 0.6) * ISLE_CHUNK, z = (cz + j + 0.2 + rnd() * 0.6) * ISLE_CHUNK;
    if (Math.hypot(x, z) < 22) continue;
    seaMakeIsle(x, z, rnd);
  }
  if (!first) OC.isles = OC.isles.filter(I => Math.hypot(I.x - S.x, I.z - S.z) < ISLE_CHUNK * 3.5 || !OC.chunks.delete(I.key));
  ARENA.obstacles = isleObs();
}
// an island is its main mound plus the lobes of land round it (ISLE_LOBES, in model units at radius 4), as world
// circles; the ship, swimmers and shots meet every one of them. Floes and the Atlantis column are one circle.
const isleLobes = I => I.lobes || (I.lobes = [{ x: I.x, z: I.z, r: I.r }]);
const isleObs = () => OC.isles.flatMap(I => I.obs || [I.ob]);
// how far an island's land reaches from its middle
const isleReach = I => I.reach || I.r;
// push a circle (x, z, rad) clear of an island's land: the offset to add, or null when it's already clear
const _io = [0, 0];
function isleOut(I, x, z, rad, k = 0.92) {
  let hit = false; _io[0] = _io[1] = 0;
  for (const L of isleLobes(I)) {
    const ix = x + _io[0] - L.x, iz = z + _io[1] - L.z, id = Math.hypot(ix, iz) || 1e-4, ov = L.r * k + rad - id;
    if (ov > 0) { _io[0] += ix / id * ov; _io[1] += iz / id * ov; hit = true; }
  }
  return hit ? _io : null;
}
function seaMakeIsle(x, z, rnd) {
  const kinds = SEA_CHAPTERS[G.run.chapter - 1].isles || ['isle0', 'isle1'];
  const r = 2.9 + rnd() * 2.7, kind = kinds[Math.floor(rnd() * kinds.length)], yaw = rnd() * TAU;
  const I = { x, z, r, kind, yaw, key: Math.floor(x / ISLE_CHUNK) + ',' + Math.floor(z / ISLE_CHUNK), deco: [], ob: { x, z, r: r * 0.92, shape: 'circle', shots: false, isle: true } };
  const c = Math.cos(yaw), s = Math.sin(yaw), sc = r / 4;
  I.lobes = [{ x, z, r }, ...(ISLE_LOBES[kind] || []).map(([lx, lz, lr]) => ({ x: x + (c * lx + s * lz) * sc, z: z + (-s * lx + c * lz) * sc, r: lr * sc * 0.95 }))];
  I.obs = I.lobes.map((L, i) => i ? { x: L.x, z: L.z, r: L.r * 0.92, shape: 'circle', shots: false, isle: true } : I.ob);
  I.reach = Math.max(...I.lobes.map(L => Math.hypot(L.x - x, L.z - z) + L.r));
  // (neighbours' land never runs together into one long wall)
  if (OC.isles.some(J => Math.hypot(J.x - x, J.z - z) < I.reach + isleReach(J) + 6)) return;
  // palms and rocks on top (in the island's own frame, as a share of its radius)
  // palms and rocks dress the plain sandy islands; the themed ones bring their own
  const n = kind === 'isle0' || kind === 'isle1' ? 1 + Math.floor(rnd() * 3) : kind === 'ihut' ? 1 : 0;
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, d = rnd() * 0.45; I.deco.push({ m: 'palm', x: x + Math.cos(a) * d * r, z: z + Math.sin(a) * d * r, s: 1.3 + rnd() * 0.5, yaw: rnd() * TAU }); }
  for (let i = 0; i < (n ? 2 : 0); i++) { const a = rnd() * TAU, d = 0.55 + rnd() * 0.25; I.deco.push({ m: 'rock' + Math.floor(rnd() * 3), x: x + Math.cos(a) * d * r, z: z + Math.sin(a) * d * r, s: 0.9 + rnd() * 0.6, yaw: rnd() * TAU, y: 0.15 }); }
  OC.isles.push(I);
}
function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const inIsle = (x, z, pad = 0) => OC.isles.some(I => Math.hypot(x - I.x, z - I.z) < isleReach(I) + pad && isleLobes(I).some(L => Math.hypot(x - L.x, z - L.z) < L.r + pad));

// ---------- the wake: foam dropped at the stern, spreading in a V ----------
function seaWake(dt) {
  const S = OC.ship, D = shipDef();
  for (const w of OC.wake) w.t += dt;
  while (OC.wake.length && OC.wake[0].t > 1.7) OC.wake.shift();
  OC.wakeT -= dt;
  const sp = Math.hypot(S.vx, S.vz);
  if (OC.wakeT <= 0 && sp > 0.5 && !OC.sink) {
    OC.wakeT = 0.07;
    const p = shipW(0, -D.len / 2 + 0.1);
    OC.wake.push({ x: p[0], z: p[1], yaw: S.yaw, t: 0, w: D.wake, k: clamp(sp / 4, 0.3, 1.2), seed: Math.random() * 10, born: OC.t });
    seaTrailFx(p[0], p[1], D);
  }
}
// what rises out of the wake: bubbles, sparkles, hearts, flames (wake trails, 10c-ship-cosmetics.js)
function seaTrailFx(x, z, D) {
  const P = shipLook().trail.part, w = D.wake * 0.6;
  if (!P) return;
  const rx = () => x + rand(-w, w), rz = () => z + rand(-w, w);
  if (P === 'bubble') FX.part(rx(), 0.1, rz(), 0, rand(0.5, 1.1), 0, rand(0.06, 0.12), 0.03, 0.9, [0.85, 0.97, 1], 0.9, 4, -0.4);
  else if (P === 'sparkle') FX.part(rx(), rand(0.2, 0.6), rz(), 0, rand(0.6, 1.4), 0, rand(0.1, 0.18), 0.03, 0.8, [1, 0.88, 0.45], 1, 3);
  else if (P === 'heart') FX.part(rx(), 0.3, rz(), 0, rand(0.8, 1.4), 0, rand(0.12, 0.2), 0.04, 0.9, [1, 0.45, 0.65], 1, 3);
  else if (P === 'flame') { FX.part(rx(), 0.2, rz(), 0, rand(1.2, 2.2), 0, rand(0.18, 0.3), 0.05, 0.5, [1, rand(0.4, 0.7), 0.15], 1, 0); if (Math.random() < 0.3) FX.smoke(x, 0.6, z, 0.4, [0.35, 0.3, 0.3], 0.8, 0.5); }
  else if (P === 'rainbow') FX.part(rx(), 0.2, rz(), 0, rand(0.6, 1.2), 0, rand(0.1, 0.16), 0.03, 0.7, hslRgb(Math.random(), 0.9, 0.65), 1, 3);
}

// ---------- spawning ----------
function seaSpawnPoint() {
  const S = OC.ship, r = VIEW.radius + 2.5;
  const sp = Math.hypot(S.vx, S.vz), head = Math.atan2(S.vx, S.vz);
  for (let i = 0; i < 8; i++) {
    // most come from ahead when sailing, from anywhere when still
    const a = sp > 1 && Math.random() < 0.6 ? head + rand(-1.2, 1.2) : rand(0, TAU);
    const x = G.cam.x + Math.sin(a) * r, z = G.cam.z + Math.cos(a) * r;
    if (!inIsle(x, z, 1)) return [x, z];
  }
  return [G.cam.x + r, G.cam.z];
}
function seaSpawn() {
  const run = G.run, t = run.t, C = SEA_CHAPTERS[run.chapter - 1], mix = C.mix;
  let total = 0;
  const w = mix.filter(m => t >= m[1]);
  for (const m of w) total += m[2];
  let r = Math.random() * total, type = w[0][0];
  for (const m of w) { r -= m[2]; if (r <= 0) { type = m[0]; break; } }
  const [x, z] = seaSpawnPoint();
  // swimmers come in little groups
  const n = type === mix[0][0] ? (t < 60 ? randInt(1, 2) : randInt(2, 4)) : type === 'pdiver' ? randInt(1, 2) : 1;
  for (let i = 0; i < n; i++) seaFoe(type, x + rand(-1, 1), z + rand(-1, 1));
}
function seaFoe(type, x, z, opts) {
  const e = spawnEnemy(type, x, z, opts);
  const D = e.def, info = G.run.info;
  // (in the later oceans their bite eases in over the first three minutes, while the ship is still small: from
  // 96% in ocean 11 to 60% in ocean 20)
  if (info.deep) { const s0 = 1 - 0.04 * info.deep; e.dmg *= clamp(s0 + (1 - s0) * G.run.t / 180, s0, 1); }
  if (D.shell) e.shell = e.shellMax = D.shell * (e.maxHp / D.hp);
  e.bobPh = rand(0, TAU);
  if (type === 'pdiver') e.hidden = true;
  return e;
}
// a chapter at sea runs SEA_BOSS_T seconds to its boss (half again a land chapter), with half again as many
// swimmers on the way
const SEA_BOSS_T = 450;
function seaEvents(chapter) {
  const ev = [{ t: 90, kind: 'swarm', n: 24 }, { t: 180, kind: 'elite' }, { t: 225, kind: 'swarm', n: 39 }, { t: 280, kind: 'elite' }, { t: 315, kind: 'swarm', n: 54 },
    { t: 382, kind: 'surge', n: 45 }, { t: 420, kind: 'swarm', n: 66 }, { t: SEA_BOSS_T, kind: 'boss' }];
  MINI_VISITS.forEach(([f], k) => ev.push({ t: SEA_BOSS_T * f, kind: 'mini', k }));
  return ev.sort((a, b) => a.t - b.t);
}
function seaEvent(ev) {
  const run = G.run, S = OC.ship;
  if (ev.kind === 'swarm') {
    // a ring of swimmers closing in, with a gap to sail out through
    const r = VIEW.radius + 2, off = rand(0, TAU), n = Math.round(ev.n * run.info.rateMul);
    const type = seaTheme().mix[0][0];
    for (let i = 0; i < n; i++) { const a = off + (i / n) * TAU * 0.75, x = S.x + Math.cos(a) * r, z = S.z + Math.sin(a) * r; if (!inIsle(x, z, 0.5)) seaFoe(type, x, z); }
  } else if (ev.kind === 'elite') {
    const [x, z] = seaSpawnPoint();
    seaFoe(pick(seaTheme().mix.filter(m => m[0] !== 'pdiver')).at(0), x, z, { elite: true });
  } else if (ev.kind === 'surge') {
    for (let i = 0; i < Math.round(ev.n * run.info.rateMul); i++) seaSpawn();
  } else if (ev.kind === 'mini') seaMini(ev.k);
  else if (ev.kind === 'boss') seaBossStart();
}
// ---------- swimmers: paddle in, get rammed, or climb on and hack at the hull ----------
function seaFoes(dt) {
  const run = G.run, S = OC.ship, D = shipDef(), n = [0, 0];
  const top = D.speed * run.stats.speedMul, frozen = !!OC.sink;
  // turning hard flings boarders off
  const fling = Math.abs(S.yawV) - SEA.shake * D.turn;
  let boarders = 0;
  for (const e of run.enemies) if (e.grab && !e.dying) boarders++;
  for (const e of run.enemies) {
    if (e.dying) { e.dying += dt / (e.boss ? 0.6 : 0.2); continue; }
    e.flash = Math.max(0, e.flash - dt); e.flashCd = (e.flashCd || 0) - dt;
    e.spawnT = Math.max(0, e.spawnT - dt); e.ramCd = (e.ramCd || 0) - dt; e.stun = Math.max(0, (e.stun || 0) - dt);
    e.squashV += (300 * (1 - e.squash) - 14 * e.squashV) * dt;
    e.squash = clamp(e.squash + e.squashV * dt, 0.6, 1.3);
    e.slowT -= dt; if (e.slowT <= 0) e.slowMul = 1;
    e.auraTint = Math.max(0, (e.auraTint || 0) - dt * 2);
    if (frozen) { e.phase += dt * 0.4; continue; }
    if (e.frozen > 0) { e.frozen -= dt; continue; }
    // the sea's own creatures (island musketeers, divers, minibosses, bosses: 13m-sea-folk.js)
    if (SEA_AI[e.type] && SEA_AI[e.type](e, dt, D)) continue;
    if (e.grab) {
      // aboard: ride along, hacking at the hull every so often
      const w = shipW(e.grab.lx, e.grab.lz);
      e.x = w[0]; e.z = w[1]; e.yaw = S.yaw + e.grab.yaw;
      e.grab.t -= dt;
      e.act = { clip: 'hack', u: clamp(1 - e.grab.t / SEA.hackCd, 0, 0.999) };
      if (e.grab.t <= 0) {
        e.grab.t = SEA.hackCd * rand(0.9, 1.1);
        if (G.state === 'run') { hurtHero(e.dmg * 0.7, e.x, e.z); FX.burst(e.x, D.deck * 0.6 + 0.3, e.z, 5, [0.75, 0.55, 0.35], 2.5, 0.06, 0.35, 2); AUDIO.play('chop'); }
      }
      if (fling > 0 && Math.random() < fling * 1.4 * dt) seaUnboard(e, 7 + Math.abs(S.yawV) * 2);
      continue;
    }
    e.act = null;
    // caught in a net: held where it is
    if (e.netT > 0) { e.netT -= dt; e.vx = e.vz = 0; e.x += e.kx * dt; e.z += e.kz * dt; e.kx *= 0.9; e.kz *= 0.9; e.phase += dt * 2.5; }
    // swim for the nearest point of the hull
    const hd = hullDist(e.x, e.z, n);
    let dx = -n[0], dz = -n[1];
    if (e.stun > 0 || e.netT > 0) { dx = 0; dz = 0; }
    const sp = e.speed * e.slowMul;
    const k = 1 - Math.exp(-3 * dt);
    e.vx += (dx * sp - e.vx) * k; e.vz += (dz * sp - e.vz) * k;
    e.x += (e.vx + e.kx) * dt; e.z += (e.vz + e.kz) * dt;
    const kd = Math.exp(-3.5 * dt); e.kx *= kd; e.kz *= kd;
    e.phase += dt * 0.9;
    if (Math.hypot(e.vx, e.vz) > 0.2) e.yaw = angleLerp(e.yaw, Math.atan2(e.vx, e.vz), Math.min(1, dt * 6));
    // against the hull: rammed, or aboard
    const d2 = hullDist(e.x, e.z, n), touch = d2 < e.radius * 0.6;
    if (touch && e.def.keg) { seaKegBoom(e, true); continue; }
    if (touch) {
      const vn = -(S.vx * n[0] + S.vz * n[1]);   // how fast the hull closes on it
      if (vn > SEA.ramMin && e.ramCd <= 0) seaRam(e, n, vn, top);
      else if (e.def.onTouch) { e.def.onTouch(e); continue; }
      // (a ship under full sail can't be climbed: they bounce off it)
      else if (!e.boss && e.stun <= 0 && !(e.netT > 0) && boarders < D.grip && e.spawnT <= 0 && S.speed < top * 0.6) { seaBoard(e); boarders++; }
      else { e.x += n[0] * (e.radius * 0.6 - d2); e.z += n[1] * (e.radius * 0.6 - d2); }
    }
    // around the islands
    for (const I of OC.isles) { const o = isleOut(I, e.x, e.z, e.radius); if (o) { e.x += o[0]; e.z += o[1]; } }
  }
  // keep a little room between swimmers
  const cell = GRID.cell, map = GRID.map;
  for (const e of run.enemies) {
    if (e.dying || e.grab || e.y) continue;
    const x0 = Math.floor((e.x - 1) / cell), x1 = Math.floor((e.x + 1) / cell), z0 = Math.floor((e.z - 1) / cell), z1 = Math.floor((e.z + 1) / cell);
    let looks = 14;
    for (let cx = x0; cx <= x1 && looks > 0; cx++) for (let cz = z0; cz <= z1 && looks > 0; cz++) {
      const a = map.get(gkey(cx, cz));
      if (!a) continue;
      for (let i = 0; i < a.length && looks > 0; i++) {
        const o = a[i]; looks--;
        if (o === e || o.dying || o.grab || o.y || o.id < e.id) continue;
        const dx = o.x - e.x, dz = o.z - e.z, rr = e.radius + o.radius, d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr || d2 < 1e-8) continue;
        const d = Math.sqrt(d2), ov = (rr - d) * 0.5, tot = e.mass + o.mass;
        e.x -= dx / d * ov * (o.mass / tot) * 2; e.z -= dz / d * ov * (o.mass / tot) * 2;
        o.x += dx / d * ov * (e.mass / tot) * 2; o.z += dz / d * ov * (e.mass / tot) * 2;
      }
    }
  }
  run.enemies = run.enemies.filter(e => !(e.dying >= 1));
}
// rammed: hit as hard as the ship was going, and thrown clear with a splash
function seaRam(e, n, vn, top) {
  const run = G.run, S = OC.ship, D = shipDef();
  const fig = slotOf('figure'), figMul = fig ? 1 + skillL(fig).ram / 100 : 1;
  const dmg = D.ram * run.stats.ramMul * figMul * (e.netT > 0 ? 1.5 : 1) * clamp(0.35 + 0.65 * vn / top, 0.35, 1.2) / run.stats.dmgMul;
  e.ramCd = 0.45; e.stun = 0.5;
  const push = (4 + vn * 1.6) / Math.sqrt(e.mass);
  hurtEnemy(e, dmg, n[0] * push * e.mass, n[1] * push * e.mass, { color: [1, 0.85, 0.4] });
  if (e.boss) { e.kx += n[0] * push * 0.3; e.kz += n[1] * push * 0.3; }
  FX.burst(e.x, 0.3, e.z, 8, [0.85, 0.95, 1], 4, 0.1, 0.45, 2, 2);
  FX.ring(e.x, e.z, 1.2, [0.85, 0.97, 1], 0.35, 0.6);
  if (fig) figureSplash(e);
  // a heavy ship barely slows down; the raft feels every bump
  S.speed *= 1 - clamp(0.12 * e.mass / (1 + OC.stage * 1.5), 0, 0.3);
  G.cam.shake = Math.max(G.cam.shake, e.boss ? 0.2 : 0.05);
  AUDIO.play('thud');
}
function seaBoard(e) {
  const S = OC.ship, D = shipDef(), L = shipL(e.x, e.z), [hl, hr] = hullSeg(D);
  // clamp onto the hull's edge where it touched, facing in
  const cz = clamp(L[1], -hl, hl), dx = L[0], dz = L[1] - cz, d = Math.hypot(dx, dz) || 1;
  const lx = dx / d * (hr + 0.12), lz = cz + dz / d * (hr + 0.12);
  e.grab = { lx, lz, yaw: Math.atan2(-dx, -dz), t: SEA.hackCd * rand(0.5, 1) };
  e.vx = e.vz = e.kx = e.kz = 0;
  AUDIO.play('pop', 0.6);
}
function seaUnboard(e, speed) {
  const n = [0, 0];
  hullDist(e.x, e.z, n);
  e.grab = null; e.act = null; e.stun = 1.0;
  e.kx = n[0] * speed; e.kz = n[1] * speed;
  FX.burst(e.x, 0.5, e.z, 6, [0.85, 0.95, 1], 3, 0.08, 0.4, 2, 2);
}
// floats (arm bands, inner tubes) soak up damage first and pop when used up: the pirate swims on without them
function seaPop(e) {
  e.shell = 0;
  FX.burst(e.x, 0.6 * e.scale, e.z, 14, e.model === 'ptube' ? [1, 0.5, 0.75] : [1, 0.62, 0.2], 5, 0.1, 0.5, 1, 2);
  FX.ring(e.x, e.z, 1.4 * e.scale, [1, 1, 1], 0.3, 0.7);
  AUDIO.play('pop');
  if (R.enemyDraw.pswim) e.model = 'pswim';
}

// ---------- sinking ----------
// the hull is gone: the ship breaks into pieces that drift apart and keel over, and the blob, dumped in the
// water, flails its arms and goes under
function seaSinkStart() {
  const run = G.run, S = OC.ship, D = shipDef(), hero = G.hero;
  run.hp = 0;
  const parts = D.model === 'raft' || !R.enemyDraw[D.model + '_p0'] ? 'raft' : D.model;
  OC.sink = { t: 0, pieces: [0, 1, 2].map(i => ({ m: parts + '_p' + i, x: S.x, z: S.z, yaw: S.yaw, vx: 0, vz: 0, y: S.y, tilt: 0, spin: rand(-0.5, 0.5), dir: i - 1, delay: 0.25 + i * 0.12 })), flail: 0, ph: 0 };
  for (const e of run.enemies) if (e.grab) seaUnboard(e, 3);
  S.vx = S.vz = S.speed = S.yawV = 0;
  G.cam.shake = 0.35;
  FX.burst(S.x, D.deck, S.z, 30, [0.75, 0.55, 0.35], 6, 0.12, 0.7, 2, 2);
  FX.burst(S.x, 0.3, S.z, 24, [0.85, 0.95, 1], 6, 0.12, 0.6, 2, 3);
  AUDIO.play('crumble'); AUDIO.play('lose');
  setState('dying');
}
const SINK_T = 4.2;
function updateSeaDying(dt) {
  const K = OC.sink, S = OC.ship, D = shipDef(), hero = G.hero;
  if (!K) return;
  K.t += dt; OC.t += dt;
  const fw = [Math.sin(S.yaw), Math.cos(S.yaw)], side = [Math.cos(S.yaw), -Math.sin(S.yaw)];
  for (const P of K.pieces) {
    const u = K.t - P.delay;
    if (u <= 0) continue;
    // apart, then over and down
    const go = Math.min(u, 2.2) * 0.3 * D.wid;
    P.x = S.x + side[0] * P.dir * go + fw[0] * (P.dir === 0 ? -0.25 * go : 0);
    P.z = S.z + side[1] * P.dir * go + fw[1] * (P.dir === 0 ? -0.25 * go : 0);
    P.yaw = S.yaw + P.spin * u * 0.4;
    P.tilt = clamp(u / 1.6, 0, 1);
    P.y = S.y - Math.max(0, u - 0.8) * 0.55 * (1 + D.deck);
    if (Math.random() < 0.3 && u < 2.6) FX.part(P.x + rand(-0.5, 0.5), 0.05, P.z + rand(-0.5, 0.5), 0, rand(0.6, 1.2), 0, 0.09, 0.03, 0.6, [0.85, 0.95, 1], 0.8, 0, -1);
  }
  // the blob: tipped into the water, flailing, then gone
  hero.lounge = 0; hero.faceYaw = null;
  const t = K.t;
  const drop = t < 0.5 ? easeInOutQuad(t / 0.5) : 1;
  const under = t > 2.6 ? easeInOutQuad(clamp((t - 2.6) / 1.2, 0, 1)) : 0;
  hero.pos[1] = lerp(D.deck + S.y, -0.75 * hero.scale, drop) - under * 2.4 * hero.scale;
  if (t > 0.5 && t < 2.9) {
    K.flail -= dt;
    if (K.flail <= 0) {
      K.flail = 0.2; K.ph ^= 1;
      const a = hero.arms[K.ph];
      if (!a.action) hero.punch(K.ph, hero.toWorld([a.side * rand(0.45, 0.7), 2.1, rand(-0.1, 0.3)], [0, 0, 0]), 0.75, null);
      FX.burst(hero.pos[0] + rand(-0.4, 0.4), 0.05, hero.pos[2] + rand(-0.4, 0.4), 4, [0.85, 0.95, 1], 3, 0.08, 0.4, 2, 2.5);
      if (Math.random() < 0.4) AUDIO.play('pop', 0.5);
    }
    if (Math.random() < 0.3) hero.impulse(rand(-1, 1));
  }
  if (t > 2.6 && Math.random() < 0.6) FX.part(hero.pos[0] + rand(-0.3, 0.3), 0.02, hero.pos[2] + rand(-0.3, 0.3), 0, rand(0.4, 0.9), 0, rand(0.05, 0.1), 0.02, 0.5, [0.9, 0.97, 1], 0.9, 4, -0.5);
  hero.update(dt, [0, 0, 0], true);
  seaFoes(dt);
  for (const w of OC.wake) w.t += dt;
}
// back up with a fresh hull: the ship pops back together, everything near is shoved off
function seaRevive() {
  const run = G.run, S = OC.ship, hero = G.hero;
  OC.sink = null;
  hero.lounge = 1; hero.lng = 1;
  seaPlaceHero(0);
  for (const e of run.enemies) {
    const dx = e.x - S.x, dz = e.z - S.z, d = Math.hypot(dx, dz) || 1;
    if (d < 7 && !e.boss) { e.kx += dx / d * 12; e.kz += dz / d * 12; e.stun = 1; }
  }
  FX.ring(S.x, S.z, 6, [0.85, 0.97, 1], 0.6, 1);
  FX.burst(S.x, 0.4, S.z, 30, [0.85, 0.95, 1], 6, 0.12, 0.6, 2, 3);
}

// ---------- camera ----------
function seaCamera(dt, snap) {
  const c = G.cam, S = OC.ship, D = shipDef(), K = OC.sink, h = G.hero.pos;
  const tx = K ? h[0] : S.x + clamp(S.vx * 0.3, -2.5, 2.5), tz = K ? h[2] : S.z + clamp(S.vz * 0.3, -2.5, 2.5);
  if (snap) { c.x = tx; c.z = tz; c.vx = c.vz = 0; }
  const w = 2 / 0.25;
  c.vx += (w * w * (tx - c.x) - 2 * w * c.vx) * dt; c.vz += (w * w * (tz - c.z) - 2 * w * c.vz) * dt;
  c.x += c.vx * dt; c.z += c.vz * dt;
  c.shake = Math.max(0, c.shake - dt * 0.6);
  const sh = G.save && G.save.settings.shake ? c.shake : 0;
  const sx = (Math.random() * 2 - 1) * sh, sz = (Math.random() * 2 - 1) * sh;
  const aspect = R.w / R.h, fov = 0.55, pitch = 54 * Math.PI / 180, half = Math.tan(fov / 2);
  // the camera pulls back as the ship grows; in close for the sinking
  const want = K ? 0.62 : D.zoom;
  SEA.view = snap ? want : SEA.view + (want - SEA.view) * Math.min(1, dt * (K ? 1.5 : 0.8));
  const dist = (aspect < 1 ? 11 / (2 * half * aspect) : 12.5 / (2 * half)) * SEA.view;
  c.dist = dist;
  c.target = [c.x + sx, 0.3, c.z + sz];
  c.eye = [c.target[0], c.target[1] + Math.sin(pitch) * dist, c.target[2] + Math.cos(pitch) * dist];
  R.setCamera(c.eye, c.target, fov);
}

// ---------- drawing ----------
const SEA_WHITE = [1, 1, 1];
// the dark mass under the surface of anything in the water: a soft shape (sx across, sz along rot, the decal's
// rotation) a little down-light of it, in the chapter's deep water darkened, so it reads as solid and heavy
const SEA_SH = [0.02, 0.05, 0.1];
function seaShadow(x, z, sx, sz, rot, a, off = 0.12) {
  const k = Math.max(sx, sz) * off;
  pushDecal(x + 0.55 * k, z - 0.45 * k, sx, sz, rot, 12, (x * 0.37 + z * 0.11) % 7, 0, SEA_SH[0], SEA_SH[1], SEA_SH[2], a);
}
// an island's life: a gull or two wheeling over it, and its own air (volcano smoke and embers, ghost wisps,
// glowing spores, snow, sparkles, drifting leaves, dust off the ruins)
const ISLE_AIR = {
  ivolc: [0.35, [0.45, 0.42, 0.45], 'smoke'], ighost: [0.25, [0.7, 1, 0.85], 'wisp'], iglow: [0.3, [0.4, 0.9, 1], 'spore'],
  iice: [0.3, [1, 1, 1], 'snow'], icandy: [0.25, [1, 0.6, 0.85], 'spark'], isky: [0.2, [1, 1, 1], 'spark'],
  icoral: [0.15, [1, 0.7, 0.8], 'bubble'], ilocker: [0.2, [0.4, 1, 0.7], 'wisp'], ibones: [0.15, [0.7, 0.7, 0.8], 'wisp'],
  iweed: [0.2, [0.6, 0.8, 0.3], 'leaf'], ikelp: [0.15, [0.5, 0.8, 0.4], 'leaf'], isle0: [0.12, [0.5, 0.85, 0.35], 'leaf'], isle1: [0.12, [0.5, 0.85, 0.35], 'leaf'],
  iruin: [0.15, [0.9, 0.88, 0.8], 'dust'], bruin1: [0.3, [0.75, 0.74, 0.7], 'dust'], bruin2: [0.3, [0.75, 0.74, 0.7], 'dust'], bruin3: [0.3, [0.75, 0.74, 0.7], 'dust'],
};
const NO_GULLS = new Set(['ivolc', 'ighost', 'ibones', 'ilocker', 'iglow', 'icol', 'iice']);
function isleLife(I, t) {
  if (I.floe !== undefined) return;
  const sc = I.r / 4, h = (I.x * 0.61 + I.z * 0.37) % 1, nG = NO_GULLS.has(I.kind) ? 0 : 1 + (h > 0.5 ? 1 : 0);
  if (R.enemyDraw.sgull) {
    const M = MODELS.defs.sgull, c = M.clips.flap;
    for (let g = 0; g < nG; g++) {
      const w = 0.28 + g * 0.09, a = t * w * (g ? -1 : 1) + h * TAU + g * 2.1, rad = isleReach(I) * (0.55 + g * 0.2);
      const x = I.x + Math.cos(a) * rad, z = I.z + Math.sin(a) * rad, y = 3.4 + g * 0.8 + Math.sin(t * 0.7 + g) * 0.4;
      const dir = g ? -1 : 1;
      pushEnemy('sgull', false, x, y, z, Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir), c.row + Math.floor(((t * 1.6 + g * 0.37) % 1) * c.frames), 1.3, 1, 0, 0, 0, 1, 1, 1);
    }
  }
  const air = ISLE_AIR[I.kind];
  if (!air || Math.random() > air[0]) return;
  const L = pick(isleLobes(I)), a = rand(0, TAU), d = Math.sqrt(Math.random()) * L.r * 0.8, x = L.x + Math.cos(a) * d, z = L.z + Math.sin(a) * d, col = air[1];
  switch (air[2]) {
    case 'smoke': FX.smoke(I.x + rand(-0.4, 0.4) * sc, 4.6 * sc, I.z + rand(-0.4, 0.4) * sc, 0.7 * sc, col, 1.6, 1); if (Math.random() < 0.3) FX.part(I.x, 4.4 * sc, I.z, rand(-1, 1), rand(2, 4), rand(-1, 1), 0.07, 0.03, 1.1, [1, 0.5, 0.15], 1, 5); break;
    case 'wisp': FX.part(x, rand(0.4, 1.4), z, rand(-0.2, 0.2), rand(0.3, 0.6), rand(-0.2, 0.2), 0.12, 0.05, 2.2, col, 1, 0); break;
    case 'spore': FX.part(x, rand(0.5, 1.5), z, rand(-0.2, 0.2), rand(0.2, 0.5), rand(-0.2, 0.2), 0.08, 0.03, 2.5, col, 1, 0); break;
    case 'snow': FX.part(x, rand(3, 5), z, rand(-0.3, 0.3), -rand(0.6, 1.0), rand(-0.3, 0.3), 0.07, 0.04, 3, col, 1, 0); break;
    case 'spark': FX.part(x, rand(0.5, 2.5), z, 0, rand(0.2, 0.5), 0, 0.07, 0.03, 0.9, col, 1, 3); break;
    case 'bubble': FX.part(x, 0.2, z, 0, rand(0.4, 0.8), 0, 0.07, 0.04, 0.8, col, 1, 0); break;
    case 'leaf': FX.part(x, rand(1.5, 3), z, rand(-0.8, 0.8), -rand(0.3, 0.5), rand(-0.8, 0.8), 0.07, 0.05, 3, col, 1, 1, 0, 0.5); break;
    case 'dust': FX.part(x, rand(0.5, 3) * sc * 2, z, rand(-0.3, 0.3), -rand(0.2, 0.6), rand(-0.3, 0.3), 0.2, 0.5, 1.8, col, 0.4, 2, 0, 1.5); break;
  }
}
function emitSea() {
  const run = G.run, S = OC.ship, D = shipDef(), f = R.frame, t = OC.t;
  const fog = SEA_CHAPTERS[run.chapter - 1].fogK || 1;
  f.spot = [S.x, 0, S.z, 1e4]; f.fogRange = [60 * SEA.view * fog * fog, 140 * SEA.view * fog];
  SCENE.arenaBox = null; SCENE.pools = [];
  // (warnings used to be drawn only on land: the pirate captain's ram lane, the musket pirates' aim)
  emitTelegraphs(run);
  // the ship (or its pieces)
  if (OC.sink) {
    for (const P of OC.sink.pieces) {
      const m = MODELS.defs[P.m], Dk = shipDef();
      seaShadow(P.x, P.z, Dk.wid * 0.5, Dk.len * 0.24, -P.yaw, 0.5 * clamp(1 + P.y * 0.6, 0.3, 1));
      const pt = shipTint(Dk.id, 'hull');
      if (m && R.enemyDraw[P.m]) pushEnemy(P.m, false, P.x, P.y, P.z, P.yaw, m.clips.tilt.row + Math.min(15, Math.floor(P.tilt * 15.99)), 1, 1, 0, 0, 0, pt[0], pt[1], pt[2]);
    }
    const rg = shipDef().model + '_rig', mid = OC.sink.pieces[1], rt = shipTint(shipDef().id, 'sail');
    if (R.enemyDraw[rg]) pushEnemy(rg, false, mid.x, mid.y, mid.z, mid.yaw, MODELS.defs[rg].clips.tilt.row + Math.min(15, Math.floor(mid.tilt * 15.99)), 1, 1, 0, 0, 0, rt[0], rt[1], rt[2]);
  } else seaDrawShip(S.x, S.y, S.z, S.yaw, OC.stage, t, run.hurtFlash > 0.4 ? 0.5 : 0);
  // the wake (its color from the wake trail, 10c-ship-cosmetics.js)
  const TR = shipLook().trail;
  for (const w of OC.wake) {
    const u = w.t / 1.7, a = (1 - u) * 0.55 * w.k, sp = w.w * (0.45 + u * 1.6), c = Math.cos(w.yaw), s = Math.sin(w.yaw);
    const wc = TR.col || hslRgb((w.born * 0.6) % 1, 0.85, 0.65);
    for (const sd of [-1, 1]) {
      const x = w.x + c * sd * sp - Math.sin(w.yaw) * u * 0.6, z = w.z - s * sd * sp - Math.cos(w.yaw) * u * 0.6, r = (0.28 + u * 0.5) * w.w;
      pushDecal(x, z, r, r * 0.8, w.yaw + w.seed, 0, w.seed + sd, 0, wc[0], wc[1], wc[2], a, !!TR.add);
    }
    const r = (0.45 + u * 0.4) * w.w;
    pushDecal(w.x, w.z, r, r, w.seed, 0, w.seed * 3, 0, wc[0] * 0.95, wc[1] * 0.98, wc[2], a * 0.7, !!TR.add);
  }
  // the bow wave
  if (!OC.sink) {
    const sp = Math.hypot(S.vx, S.vz);
    if (sp > 1) { const p = shipW(0, D.len / 2 + 0.1); pushDecal(p[0], p[1], D.wid * 0.6, 0.4, -S.yaw, 0, t * 3 % 10, 0, 0.95, 0.99, 1, clamp(sp / 6, 0, 0.5)); }
  }
  // islands
  for (const I of OC.isles) {
    if (!onScreen(I.x, I.z, isleReach(I) + 4)) continue;
    // the rock going down into deep water, shallow light water over it, and a foam ring that breathes, round
    // every lobe of land, so the shore follows the island's own outline
    isleLobes(I).forEach((L, i) => {
      seaShadow(L.x, L.z, L.r * 3.0, L.r * 3.0, I.yaw, i ? 0.45 : 0.75, 0.05);
      pushDecal(L.x, L.z, L.r * 1.7, L.r * 1.7, 0, 1, 0, 0, 0.45, 0.95, 0.9, i ? 0.3 : 0.38, true);
      const br = 1.06 + 0.04 * Math.sin(t * 1.4 + L.x + i * 1.7);
      pushDecal(L.x, L.z, L.r * br, L.r * br, 0, 3, 0, 0.5, 1, 1, 1, 0.5, true);
    });
    isleLife(I, t);
    if (R.enemyDraw[I.kind]) pushEnemy(I.kind, false, I.x, I.rise !== undefined ? -2.6 * I.r / 4 * (1 - easeOutBack(clamp(I.rise, 0, 1))) : 0, I.z, I.yaw, MODELS.defs[I.kind].clips.still.row, I.r / 4, 1, 0, 0, 0, 1, 1, 1, I.fade || 0);
    for (const o of I.deco) if (R.enemyDraw[o.m]) pushEnemy(o.m, false, o.x, (o.y || 0) + I.r * 0.145, o.z, o.yaw, MODELS.defs[o.m].clips.still.row, o.s, 1, 0, 0, 0, PROP_WHITE[0], PROP_WHITE[1], PROP_WHITE[2]);
  }
  // swimmers: only head and shoulders above the water, with a little foam ring
  for (const e of run.enemies) {
    if (!onScreen(e.x, e.z, 2.5 * Math.max(1, e.scale) + (e.mini || e.boss ? 4 : 0)) && !e.boss) continue;
    if (SEA_DRAW[e.type] && SEA_DRAW[e.type](e)) continue;
    if (!R.enemyDraw[e.model]) continue;
    const dead = e.dying ? clamp(e.dying, 0, 1) : 0, appear = e.spawnT > 0 ? 1 - e.spawnT / 0.5 : 1;
    const bob = Math.sin(t * 2.4 + e.bobPh) * 0.04 * e.scale, M = MODELS.defs[e.model];
    const y = (e.grab ? -0.32 : -SEA.sink) * e.scale * (M.top || 1) * 0.9 + bob - dead * 0.6 * e.scale;
    const row = e.act && M.clips[e.act.clip] ? M.clips[e.act.clip].row + Math.floor(clamp(e.act.u, 0, 0.999) * M.clips[e.act.clip].frames) : M.clips.paddle.row + Math.floor((e.phase - Math.floor(e.phase)) * M.clips.paddle.frames);
    const tn = e.tint;
    seaShadow(e.x, e.z, e.radius * 1.5, e.radius * 2.0, -e.yaw, (e.def.ghost ? 0.35 : 0.75) * (1 - dead) * clamp(appear, 0, 1));
    pushEnemy(e.model, e.elite, e.x, y, e.z, e.yaw, row, e.scale * clamp(appear, 0.2, 1), e.squash, dead, e.flash > 0 ? 0.85 : 0, e.auraTint || 0, tn[0], tn[1], tn[2], e.def.ghost ? 0.35 : 0);
    const rr = e.radius * 1.15 * (1 + 0.05 * Math.sin(t * 3 + e.bobPh));
    pushDecal(e.x, e.z, rr, rr, 0, 3, 0, 0.5, 1, 1, 1, 0.42 * (1 - dead), true);
    if (e.reel > 0) { const p = mountW(mountsOf(D).bow); R.ribStrip([p[0], p[1] + 0.3, p[2], e.x, 0.5, e.z], 2, 0.04, [0.95, 0.88, 0.65, 1], 1, 0, 1); }
  }
  // cannonballs and the rest of the sea's shots, and the hazards
  emitSeaShots();
  emitSeaHazards();
  emitSeaBossHazards();
  emitSeaDeep();
}
// a ship and everything mounted on it
function seaDrawShip(x, y, z, yaw, stage, t, flash) {
  let D = SHIPS[stage];
  while (!R.enemyDraw[D.model] && D !== SHIPS[0]) D = SHIPS[SHIPS.indexOf(D) - 1];
  const model = D.model, M = MODELS.defs[model];
  if (!M || !R.enemyDraw[model]) return;
  const c = M.clips.rock, row = c.row + Math.floor(((t * 0.18) % 1) * c.frames);
  seaShadow(x, z, D.wid * 1.35, D.len * 0.8, -yaw, 0.45, 0.2);
  seaShadow(x, z, D.wid * 0.92, D.len * 0.64, -yaw, 0.85);
  // its paint and sails (the Ships tab, 10c-ship-cosmetics.js)
  const look = shipLook(), ht = shipTint(D.id, 'hull', look), st = shipTint(D.id, 'sail', look);
  pushEnemy(model, false, x, y, z, yaw, row, 1, 1, 0, flash, 0, ht[0], ht[1], ht[2]);
  // its flag, streaming back from a pole
  const FS = FLAG_SPOT[D.id], fm = 'flag_' + look.flag.id;
  if (FS && look.flag.id !== 'none') {
    if (R.enemyDraw[fm]) { const c = Math.cos(yaw), s = Math.sin(yaw), FM = MODELS.defs[fm], fc = FM.clips.flutter; pushEnemy(fm, false, x + c * FS[0] + s * FS[1], y + FS[2], z - s * FS[0] + c * FS[1], yaw + Math.PI, fc.row + Math.floor((t * 1.6 % 1) * fc.frames), FS[3], 1, 0, flash, 0, 1, 1, 1); }
    else prioritizeMeshes([fm]);
  }
  const rg = model + '_rig';
  if (R.enemyDraw[rg]) {
    // masts and sails fade while they stand between the camera (to the south) and the blob
    const h = G.hero.pos, Rm = MODELS.defs[rg], mx = x + Math.sin(yaw) * 0.6, mz = z + Math.cos(yaw) * 0.6;
    // (only while sailing: in the menus the sails stay solid)
    const front = G.state !== 'home' && (mz - h[2]) > -0.5 && Math.abs(mx - h[0]) < 1.8 + Math.abs(Math.cos(yaw)) * 0.4;
    OC.rigFade = clamp((OC.rigFade || 0) + (front ? 0.08 : -0.08), 0, 0.62);
    const rc = Rm.clips.rock;
    pushEnemy(rg, false, x, y, z, yaw, rc.row + Math.floor(((t * 0.18) % 1) * rc.frames), 1, 1, 0, flash, 0, st[0], st[1], st[2], OC.rigFade);
  }
  if (G.run && G.run.sea && D === SHIPS[stage]) seaDrawMounts(x, y, z, yaw, D);
}

// ---------- the home screen's ocean page: the blob lounging on its best ship on a calm sea ----------
const SEA_HOME = { t: 0 };
// (each chapter's boss vehicle comes later; until then the Big Tuber)
const seaBossName = n => BOSS_TYPES[SEA_CHAPTERS[n - 1].boss].name;
function seaHomeStage() { return clamp((G.save.sea && G.save.sea.ship) || 0, 0, SHIPS.length - 1); }

// a camera that fits a model (its real mesh bounds, turned by yaw and scaled) snugly in an icon, looking down at
// pitch: [eye, target, fov]
function iconFrame(m, yaw, s, pitch, fov) {
  const B = MESHB[m], M = MODELS.defs[m];
  const lo = B ? B.lo : M.bmin, hi = B ? B.hi : M.bmax;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), ex = [0, Math.sin(pitch), Math.cos(pitch)], up = [0, Math.cos(pitch), -Math.sin(pitch)];
  const pts = [];
  for (const x of [lo[0], hi[0]]) for (const y of [lo[1], hi[1]]) for (const z of [lo[2], hi[2]]) pts.push([(x * cy + z * sy) * s, y * s, (-x * sy + z * cy) * s]);
  const c = [0, 1, 2].map(a => (Math.min(...pts.map(p => p[a])) + Math.max(...pts.map(p => p[a]))) / 2);
  let W = 0, H = 0, Z = 0;
  for (const p of pts) { const d = [p[0] - c[0], p[1] - c[1], p[2] - c[2]]; W = Math.max(W, Math.abs(d[0])); H = Math.max(H, Math.abs(d[1] * up[1] + d[2] * up[2])); Z = Math.max(Z, d[1] * ex[1] + d[2] * ex[2]); }
  const D = Math.max(W, H) * 1.14 / Math.tan(fov / 2) + Z;
  return [[c[0], c[1] + ex[1] * D, c[2] + ex[2] * D], c, fov];
}
// the box framing is loose (a turned box's corners stick out past the model), so draw it once, see where it
// landed, and aim again: centred on what was drawn, and zoomed so it fills 80% of the square
function iconFit([eye, tgt, fov], pitch) {
  const b = iconCapture(eye, tgt, fov, null, 'measure');
  if (!b) return [eye, tgt, fov];
  const S = ICONS.size, t = Math.tan(fov / 2), dist = Math.hypot(eye[0] - tgt[0], eye[1] - tgt[1], eye[2] - tgt[2]);
  const cx = (b.x0 + b.x1) / S - 1, cy = 1 - (b.y0 + b.y1) / S, half = Math.max(b.x1 - b.x0, b.y1 - b.y0) / S;
  const fov2 = 2 * Math.atan(t * Math.min(1, half / 0.8));
  const sh = [cx * t * dist, cy * t * dist * Math.cos(pitch), -cy * t * dist * Math.sin(pitch)];
  return [eye.map((v, i) => v + sh[i]), tgt.map((v, i) => v + sh[i]), fov2];
}
// sea upgrade icons are drawn from their own models once those are built
function seaIcons() {
  const todo = SEA_ICON_SHOTS.filter(([k, m]) => !ICONS.map[k + '!'] && R.enemyDraw[m]);
  if (!todo.length) return;
  iconBegin();
  for (const [key, m, opts] of todo) {
    R.resetStreams();
    const M = MODELS.defs[m], c = M.clips.still || M.clips.rock || Object.values(M.clips)[0];
    const g = opts.goo ? R.goo.base : [1, 1, 1], yaw = opts.yaw ?? 0.7, s = opts.s ?? 1;
    pushEnemy(m, false, 0, 0, 0, yaw, c.row, s, 1, 0, 0, 0, g[0], g[1], g[2]);
    ICONS.map[key] = ICONS.map[key + '!'] = iconCapture(...iconFit(iconFrame(m, yaw, s, opts.pitch ?? 0.5, 0.5), opts.pitch ?? 0.5), null, true);
  }
  iconEnd();
  R.resetStreams();
}

// the Ships tab's pictures, drawn from the models once built: paints on the pirate sloop (classic sails), sails on it
// (classic paint), each flag on its pole. 'No flag' and the wake trails keep their drawings (10c-ship-cosmetics.js)
function shipLookIcons() {
  const jobs = [];
  for (const K of SHIP_LOOK_KINDS) for (const it of K.list) {
    const key = 'look-' + K.key + '-' + it.id;
    if (ICONS.map[key] || K.key === 'trail' || (K.key === 'flag' && it.id === 'none')) continue;
    const ms = K.key === 'flag' ? ['flag_' + it.id] : ['sloop', 'sloop_rig'];
    if (ms.every(m => R.enemyDraw[m])) jobs.push([key, K.key, it, ms]); else prioritizeMeshes(ms);
  }
  if (!jobs.length) return;
  iconBegin();
  for (const [key, kind, it, ms] of jobs) {
    R.resetStreams();
    const yaw = kind === 'flag' ? 2.0 : 2.35, pitch = kind === 'flag' ? 0.2 : 0.42;
    if (kind === 'flag') { const FM = MODELS.defs[ms[0]], fc = FM.clips.flutter; pushEnemy(ms[0], false, 0, 0, 0, yaw, fc.row + 3, 1, 1, 0, 0, 0, 1, 1, 1); }
    else {
      const look = { paint: kind === 'paint' ? it : SHIP_PAINTS[0], sail: kind === 'sail' ? it : SHIP_SAILS[0] }, ht = shipTint('sloop', 'hull', look), st = shipTint('sloop', 'sail', look);
      pushEnemy('sloop', false, 0, 0, 0, yaw, MODELS.defs.sloop.clips.rock.row, 1, 1, 0, 0, 0, ht[0], ht[1], ht[2]);
      pushEnemy('sloop_rig', false, 0, 0, 0, yaw, MODELS.defs.sloop_rig.clips.rock.row, 1, 1, 0, 0, 0, st[0], st[1], st[2]);
    }
    ICONS.map[key] = iconCapture(...iconFit(iconFrame(ms[ms.length - 1], yaw, 1, pitch, 0.5), pitch), null, true);
  }
  iconEnd();
  R.resetStreams();
}
// the run is over: the sea keeps its own chapter progress (coins, cosmetics and gear are shared with the land)
function seaFinish(run, won) {
  const S = G.save.sea, n = run.chapter;
  S.ship = Math.max(S.ship || 0, OC.stage, OC.wantStage || 0);
  if (won) { S.cleared[n] = true; S.chapter = Math.min(SEA_COUNT, Math.max(S.chapter, n + 1)); }
  if (run.t > (S.best[n] || 0)) S.best[n] = Math.round(run.t);
  G.save.stats.runs++; G.save.stats.kills += run.kills;
}
