// The new features, each checked and photographed: the blob's faces, Settings (graphics, music, FPS, save
// export/import), goo trails, the Codex, the goo medic, weak points, burrower warnings, Boss Rush medals, music,
// and at sea the weather fronts, a treasure hunt, the whale and the drowned city's streets.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, want = k => !ONLY || ONLY.includes(k);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 180000 });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
const shot = async (name, clip) => { await page.screenshot({ path: path.join(dir, 'shots', `feat-${name}.png`), ...(clip ? { clip } : {}) }); };
await page.evaluate(() => { G.save.coins = 99999; G.save.cleared[CHAPTER_COUNT] = true; G.save.chapter = CHAPTER_COUNT; G.save.sea.chapter = SEA_COUNT; });
const frames = (n, render) => page.evaluate(([n, r]) => { if (!__rafQ.length) requestAnimationFrame(loop); __frames(n, 1 / 60, false); if (r) __frames(1, 1 / 60, true); }, [n, render]);
await page.evaluate(() => __manual());

// ---------- faces ----------
if (want('face')) {
  const faces = [['neutral', () => {}], ['happy', () => G.hero.emote('happy', 5)], ['hurt', () => G.hero.emote('hurt', 5)], ['asleep', () => { HOME.idle = 40; }]];
  for (const [name] of faces) {
    await page.evaluate(n => { HOME.idle = 0; HOME.foes.length = 0; const f = G.hero.face; f.happyT = f.hurtT = 0; f.blinkT = 99; f.lookTo = 0; if (n === 'happy') G.hero.emote('happy', 5); if (n === 'hurt') G.hero.emote('hurt', 5); if (n === 'asleep') HOME.idle = 40; }, name);
    await frames(70, true);
    // (the blob's head, wherever the layout puts it)
    const hb = await page.evaluate(() => { const c = G.hero.out.faceC, v = R.cam.viewProj || null; const p = [c[0], c[1], c[2], 1]; const m = R.cam.viewProj; if (!m) return null; const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]; return [(x / w * 0.5 + 0.5) * innerWidth, (1 - (y / w * 0.5 + 0.5)) * innerHeight]; });
    const cx = hb ? Math.round(hb[0]) : 550, cy = hb ? Math.round(hb[1]) : 300;
    await shot('face-' + name, { x: Math.max(0, cx - 150), y: Math.max(0, cy - 130), width: 300, height: 280 });
  }
  const st = await page.evaluate(() => ({ sleep: +G.hero.face.sleep.toFixed(2), c: Array.from(G.hero.out.faceC).map(v => +v.toFixed(2)) }));
  ok(st.sleep > 0.8 && st.c[3] > 0, 'the blob has a face, and dozes when left alone ' + JSON.stringify(st));
  await page.evaluate(() => { HOME.idle = 0; });
}

// ---------- settings ----------
if (want('settings')) {
  await page.evaluate(() => { UI.openSettings(); $('importBox').hidden = false; });
  await frames(5, true);
  await shot('settings');
  const r = await page.evaluate(() => {
    const code = saveCode(), back = parseSave(code), coins = G.save.coins;
    const mod = JSON.parse(JSON.stringify(G.save)); mod.coins = 12345;
    const took = importSave(JSON.stringify(mod)), now = G.save.coins;
    importSave(code);
    const bad = importSave('hello');
    G.save.settings.quality = 'medium'; applySettings(); const medium = [FX.maxParts, R.settings.msaa, R.settings.bloom];
    G.save.settings.fps = true; applySettings(); __frames(40, 1 / 60, false);
    const fps = $('fps').textContent;
    G.save.settings.quality = 'auto'; G.save.settings.fps = false; applySettings();
    UI.closeSettings();
    return { roundTrip: !!back && back.coins === coins, took, now, restored: G.save.coins === coins, bad, medium, fps };
  });
  ok(r.roundTrip && r.took && r.now === 12345 && r.restored && !r.bad, 'save code round trip, import, and junk refused ' + JSON.stringify(r));
  ok(r.medium[0] === 2000 && r.medium[1] === false && r.medium[2] === true && /FPS/.test(r.fps), 'Medium graphics and the FPS counter ' + JSON.stringify(r));
}

// ---------- trails and the Codex ----------
if (want('menus')) {
  await page.evaluate(() => { UI.openTab('skins'); UI.blobTab = 'trails'; UI.trailPreview = 'hearts'; UI.renderSkins(); });
  await frames(90, true);
  await shot('trails');
  await page.evaluate(() => { UI.trailPreview = null; UI.openTab('home'); });
  await page.evaluate(() => { G.save.codex = { stickman: { k: 120, at: 'Chapter 1' }, 'boss:stomper': { k: 2, at: 'Chapter 1', t: 41.2 }, 'mini:c1': { k: 1, at: 'Chapter 1' }, pswim: { k: 33, at: 'Ocean 1' } }; G.save.rushMedals = { stomper: { t: 9.4, m: 3 } }; UI.openTab('goals'); UI.setGoalTab('codex'); });
  await frames(240, true);
  await shot('codex');
  const cx = await page.evaluate(() => ({ cards: document.querySelectorAll('#codexList .cx-card').length, seen: document.querySelectorAll('#codexList .cx-card:not(.unseen)').length, sum: $('goalSum').textContent }));
  ok(cx.cards > 60 && cx.seen === 4, 'the Codex lists everything, the met ones lit ' + JSON.stringify(cx));
  await page.evaluate(() => { UI.setGoalTab('goals'); UI.openTab('home'); });
}

// ---------- on land: trail, medic, weak points, burrowers, music ----------
if (want('land')) {
  await page.evaluate(() => { G.save.trail = 'flame'; beginChapter(9); });
  await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 900000, polling: 300 });
  await page.evaluate(() => { __manual(); AUDIO.unlock(); });
  const land = await page.evaluate(() => {
    if (!__rafQ.length) requestAnimationFrame(loop);
    DEV.god = true; const run = G.run, h = G.hero.pos; run.spawnAcc = -1e9; run.events = [];
    // a medic with hurt foes round it
    const m = spawnEnemy('healer', h[0] + 7, h[2]); m.spawnT = 0; m.healT = 0.1;
    const hurt = [0, 1, 2].map(i => { const e = spawnEnemy('stickman', h[0] + 7 + i * 0.6, h[2] + 1.2); e.hp = e.maxHp * 0.3; e.speed = 0; return e; });
    let healed = false; for (let i = 0; i < 240 && !healed; i++) { __frames(1); healed = hurt.some(e => e.hp > e.maxHp * 0.5); }
    // a burrower: the warning circle before it bursts up
    const mole = spawnEnemy('mole', h[0] + 2.5, h[2] - 2); mole.spawnT = 0;
    let warned = false; for (let i = 0; i < 60 && !warned; i++) { __frames(1); warned = mole.warnT > 0 && (run.tele || []).some(t => t.kind === 'circle' && Math.abs(t.x - mole.x) < 0.1); }
    // a boss's big attack lands: its weak point opens and hits do double
    for (const e of run.enemies) { e.hp = 0; killEnemy(e); } __frames(30);
    startBoss(); __frames(150);
    const b = run.bosses[0]; TELE_OWNER = b; addTele({ kind: 'circle', x: b.x, z: b.z, r: 3.5, dur: 0.1 }); TELE_OWNER = null;
    __frames(30);
    const open = b.weakT > 0, hp0 = b.hp; DMG_SRC = null; hurtEnemy(b, 100); const took = hp0 - b.hp;
    __frames(1, 1 / 60, true);
    // the music: layers come in as foes gather
    const before = MUSIC.lv.kick;
    for (let i = 0; i < 160; i++) spawnEnemy('stickman', h[0] + rand(-12, 12), h[2] + rand(-12, 12)).speed = 0;
    __frames(400);
    return { healed, warned, open, took: Math.round(took), dmgMul: run.stats.dmgMul, music: { bus: !!MUSIC.bus, state: AUDIO.ctx && AUDIO.ctx.state, kick0: +before.toFixed(2), kick: +MUSIC.lv.kick.toFixed(2), mood: MUSIC.wantMood, inten: +MUSIC.inten.toFixed(2) } };
  });
  ok(land.healed, 'the goo medic heals the hurt foes near it');
  ok(land.warned, 'a burrower shows a warning circle before it surfaces');
  ok(land.open && Math.abs(land.took - 200 * land.dmgMul) < 2, 'a boss is open after its big attack, and takes double ' + JSON.stringify(land));
  ok(land.music.bus && land.music.mood === 'boss' && land.music.kick > land.music.kick0, 'the music follows the fight ' + JSON.stringify(land.music));
  await page.evaluate(() => { const run = G.run; for (const b of run.bosses) b.weakT = 2; G.hero.pos[0] = run.bosses[0].x - 4; G.hero.pos[2] = run.bosses[0].z + 2; run.vel[0] = 4; __frames(20); __frames(1, 1 / 60, true); });
  await shot('land');
  await page.evaluate(() => { G.run.hp = -1; finishRun(false); goHome(); });
}

// ---------- Boss Rush medals ----------
if (want('rush')) {
  await page.evaluate(() => beginBossRush());
  await page.waitForFunction(() => G.state === 'run' && G.run && G.run.rush, null, { timeout: 900000, polling: 300 });
  const rush = await page.evaluate(() => {
    __manual(); if (!__rafQ.length) requestAnimationFrame(loop);
    DEV.god = true; const run = G.run; run.pending = 0; run.spawnAcc = -1e9;
    for (let i = 0; i < 400 && !run.bosses.length; i++) { __frames(1); run.pending = 0; }
    __frames(120); for (const b of run.bosses) { b.hp = 1; hurtEnemy(b, 10); } __frames(30);
    return { medals: run.medals, saved: G.save.rushMedals, times: rushMedalTimes(RUSH_BOSSES[0]) };
  });
  ok(rush.medals && rush.medals.length === 1 && rush.medals[0].m === 3, 'Boss Rush: a fast kill earns gold ' + JSON.stringify(rush));
  await page.evaluate(() => { G.run.hp = -1; finishRun(false); });
  await frames(5, true);
  await shot('rush-results');
  await page.evaluate(() => goHome());
}

// ---------- at sea ----------
if (want('sea')) {
  await page.evaluate(() => beginSeaChapter(8));
  await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 900000, polling: 300 });
  const sea = await page.evaluate(() => {
    __manual(); if (!__rafQ.length) requestAnimationFrame(loop);
    DEV.god = true; const run = G.run, S = OC.ship; run.spawnAcc = -1e9; run.events = [];
    const out = {};
    // a fog bank around the ship
    OC.fronts = [{ k: 'fog', key: 'x', x: S.x + 2, z: S.z + 2, r: 16 }]; __frames(200); out.fog = +OC.fogIn.toFixed(2);
    __frames(1, 1 / 60, true);
    return out;
  });
  await shot('sea-fog');
  const sea2 = await page.evaluate(() => {
    const S = OC.ship, out = {};
    // a tailwind lane along the ship's heading: sailing with it is faster
    OC.fronts = [{ k: 'wind', key: 'x', x: S.x, z: S.z + 10, len: 50, w: 4, rot: 0 }]; S.yaw = 0;
    INPUT.keys.add('w'); __frames(240); out.wind = +OC.windMul.toFixed(2); out.speed = +Math.hypot(S.vx, S.vz).toFixed(2); INPUT.keys.delete('w');
    __frames(1, 1 / 60, true);
    return out;
  });
  await shot('sea-wind');
  const sea3 = await page.evaluate(() => {
    const S = OC.ship, out = {};
    // a squall: storm, and a gust that shoves the ship
    OC.fronts = [{ k: 'squall', key: 'x', x: S.x, z: S.z, r: 11, vx: 0, vz: 0 }]; OC.gustT = 0.5; S.vx = S.vz = S.speed = 0;
    const x0 = S.x, z0 = S.z; __frames(260); out.squall = +OC.squallIn.toFixed(2); out.storm = +OC.storm.toFixed(2); out.pushed = +Math.hypot(S.x - x0, S.z - z0).toFixed(2);
    __frames(1, 1 / 60, true);
    return out;
  });
  await shot('sea-squall');
  const sea4 = await page.evaluate(() => {
    const S = OC.ship, run = G.run, out = {};
    OC.fronts = []; OC.fogIn = OC.squallIn = 0;
    // a treasure hunt: two pieces held, a bottle beside the ship, the X on an island, a dig
    OC.extra.pieces = 2; OC.isles.length = 0; OC.chunks.clear();
    seaMakeIsle(S.x + 40, S.z + 10, mulberry(5));
    const I = OC.isles[OC.isles.length - 1]; I.piece = { x: S.x + 1, z: S.z + 1, ph: 0 };
    __frames(5); out.pieces = OC.extra.pieces; out.x = !!OC.extra.x;
    __frames(1, 1 / 60, true);
    return out;
  });
  await shot('sea-treasure-arrow');
  const sea5 = await page.evaluate(() => {
    const S = OC.ship, run = G.run, out = {}, T = OC.extra.x;
    // (the ship beside the X, on the open-water side)
    const I = OC.isles.find(J => isleLobes(J).some(L => Math.hypot(L.x - T.x, L.z - T.z) < L.r + 0.1));
    if (T && I) { const L = isleLobes(I)[0], dx = T.x - L.x, dz = T.z - L.z, d = Math.hypot(dx, dz) || 1, k = shipDef().wid * 0.5 + 1.6; S.x = T.x + dx / d * k; S.z = T.z + dz / d * k; S.vx = S.vz = S.speed = 0; }
    out.dist0 = T ? +Math.hypot(S.x - T.x, S.z - T.z).toFixed(2) : null;
    const coins = run.coins; __frames(220); out.dist = OC.extra.x ? +Math.hypot(S.x - OC.extra.x.x, S.z - OC.extra.x.z).toFixed(2) : null; out.state = G.state; out.found = OC.extra.found; out.coins = run.coins - coins; out.chest = run.chestQueued || 0;
    run.chestQueued = 0; run.pending = 0;
    return out;
  });
  await page.evaluate(() => { if (G.state !== 'run') { setState('run'); } prioritizeMeshes(['whale']); });
  await page.waitForFunction(() => R.enemyDraw.whale, null, { timeout: 900000, polling: 500 });
  const sea6 = await page.evaluate(() => {
    const S = OC.ship, run = G.run, out = {};
    // the whale: surfaces, spouts, and its spout patches the hull
    OC.isles.length = 0; OC.chunks.clear(); OC.whale = null; OC.whaleT = 0; run.hp = run.maxHp * 0.5;
    __frames(2); const W = OC.whale; out.whale = !!W; out.dbg = { state: G.state, ready: !!R.enemyDraw.whale, boss: run.bossStarted, whaleT: OC.whaleT, sink: !!OC.sink };
    if (W) { for (let i = 0; i < 400 && !(W.spout > 0); i++) __frames(1); const ux = Math.sin(W.yaw), uz = Math.cos(W.yaw); S.x = W.x + ux * 2; S.z = W.z + uz * 2; __frames(3); out.healed = run.hp > run.maxHp * 0.55; }
    __frames(30); __frames(1, 1 / 60, true);
    return out;
  });
  await shot('sea-whale');
  ok(sea.fog > 0.8, 'inside a fog bank the fog closes in ' + JSON.stringify(sea));
  ok(sea2.wind > 1.3, 'a tailwind speeds the ship ' + JSON.stringify(sea2));
  ok(sea3.squall > 0.8 && sea3.storm > 0.3 && sea3.pushed > 1, 'a squall brings the storm and gusts shove the ship ' + JSON.stringify(sea3));
  ok(sea4.pieces === 3 && sea4.x, 'the third map piece puts an X on an island ' + JSON.stringify(sea4));
  ok(sea5.found === 1 && sea5.coins > 0 && (sea5.chest > 0 || sea5.state === 'chest'), 'digging at the X finds treasure (its chest opens) ' + JSON.stringify(sea5));
  ok(sea6.whale && sea6.healed, 'a whale surfaces and its spout patches the hull ' + JSON.stringify(sea6));
  await page.evaluate(() => { G.run.hp = -1; finishRun(false); goHome(); });
}

// ---------- the drowned city ----------
if (want('city')) {
  await page.evaluate(() => beginSeaChapter(20));
  await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 1200000, polling: 500 });
  const city = await page.evaluate(() => {
    __manual(); if (!__rafQ.length) requestAnimationFrame(loop);
    DEV.god = true; const run = G.run; run.spawnAcc = -1e9; run.events = []; SHIPS[0].zoom = 4.6;
    __frames(60);
    // the towers sit in pairs on block lines; the start is a crossroads
    const S = OC.ship, near = OC.isles.filter(I => Math.hypot(I.x - S.x, I.z - S.z) < 60);
    let amb = 0; for (let i = 0; i < 40; i++) if (seaAmbushPoint()) amb++;
    __frames(1, 1 / 60, true);
    return { towers: near.length, kinds: [...new Set(near.map(I => I.kind))], clearStart: !inIsle(0, 0, 4), amb };
  });
  ok(city.towers >= 4 && city.clearStart && city.amb > 0, 'the drowned city: towers in blocks, a clear crossroads, ambush points ' + JSON.stringify(city));
  await shot('city');
}
console.log(errs.length ? errs.slice(0, 8) : 'no errors');
await browser.close();
