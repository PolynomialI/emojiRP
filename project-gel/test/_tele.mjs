// attack telegraphs: an archer's aim lane (and its arrow flying down it), a miniboss's fan of arrows (lanes first,
// arrows half a second later), a boss volley through teleShot, a musket pirate's aim lane at sea.
// Screenshots test/shots/tele-*.png
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 900000, polling: 1000 });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
const shot = n => page.screenshot({ path: path.join(dir, 'shots', 'tele-' + n + '.png') });
await page.evaluate(() => { G.save.chapter = 20; beginChapter(6); });
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 300 });
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9; G.run.events = []; G.run.enemies.length = 0; G.run.tele = []; });
// an archer: aims, shows a lane, then shoots down it even if the blob has moved off it
let r = await page.evaluate(() => {
  const run = G.run, h = G.hero.pos, e = spawnEnemy('archer', h[0] + 5, h[2] - 1.5); e.spawnT = 0; e.reload = 0;
  let lane = null;
  for (let f = 0; f < 120 && !lane; f++) { __frames(1); lane = (run.tele || []).find(t => t.kind === 'lane' && Math.hypot(t.x - e.x, t.z - e.z) < 1); }
  if (!lane) return { lane: false };
  __frames(1, 1 / 60, true);
  // the blob steps aside; the arrow should still follow the lane
  h[2] += 2.5;
  let arrow = null;
  for (let f = 0; f < 60 && !arrow; f++) { __frames(1); arrow = run.eShots.find(s => s.kind === 'arrow'); }
  const ar = arrow && Math.atan2(arrow.vx, arrow.vz);
  return { lane: true, rot: +lane.rot.toFixed(3), arrowRot: ar === null ? null : +ar.toFixed(3) };
});
ok(r.lane && r.arrowRot !== null && Math.abs(r.rot - r.arrowRot) < 0.01, 'archer: an aim lane, and the arrow flies down it ' + JSON.stringify(r));
await page.evaluate(() => { G.run.enemies.length = 0; G.run.tele = []; G.run.eShots.length = 0; });
// the penguin miniboss's fan: lanes first, arrows after
r = await page.evaluate(() => {
  const run = G.run; spawnMiniboss(0); const m = run.enemies.find(e => e.mini); m.x = G.hero.pos[0]; m.z = G.hero.pos[2] - 5;
  m.ai.state = 'fan'; m.ai.t = 0.01; m.ai.volleys = 2;
  __frames(2);
  const lanes = (run.tele || []).filter(t => t.kind === 'lane').length, shotsNow = run.eShots.length, held = (run.heldShots || []).length;
  __frames(1, 1 / 60, true);
  return { lanes, shotsNow, held };
});
await shot('fan');
const r2 = await page.evaluate(() => { __frames(36); return { flying: G.run.eShots.length, held: (G.run.heldShots || []).length }; });
ok(r.lanes >= 7 && r.held >= 7 && r2.flying >= 7, 'miniboss fan: 7 lanes first, the arrows half a second later ' + JSON.stringify({ ...r, after: r2 }));
// a boss volley through teleShot
r = await page.evaluate(() => { const run = G.run; run.eShots.length = 0; run.tele = []; run.heldShots = []; teleShot({ kind: 'sand', x: 0, y: 1, z: 0, vx: 6.5, vy: 0, vz: 0, dmg: 10, r: 0.35, life: 2.6, ph: 0 }); const a = { lanes: run.tele.length, flying: run.eShots.length }; __frames(31); return { ...a, after: run.eShots.length }; });
ok(r.lanes === 1 && r.flying === 0 && r.after === 1, 'teleShot: the lane, then the shot ' + JSON.stringify(r));
// an archer's lane on screen
await page.evaluate(() => { const run = G.run, h = G.hero.pos; run.tele = []; run.eShots.length = 0; for (let i = 0; i < 3; i++) { const e = spawnEnemy('archer', h[0] + 4 - i * 4, h[2] - 4 + (i % 2) * 7); e.spawnT = 0; e.reload = 0; } for (let f = 0; f < 120 && !(run.tele || []).length; f++) __frames(1); __frames(12); __frames(1, 1 / 60, true); });
await shot('archers');
await page.evaluate(() => { G.run.events = []; setState('home'); G.run = null; });
// at sea: a musket pirate's aim lane
await page.evaluate(() => { G.save.cleared[CHAPTER_COUNT] = true; beginSeaChapter(1); });
await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 600000, polling: 300 });
r = await page.evaluate(() => {
  __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9; G.run.events = []; G.run.enemies.length = 0; G.run.tele = [];
  const S = OC.ship, e = seaFoe('pmusket', S.x + 7, S.z + 3); e.reload = 0;
  let lane = null;
  for (let f = 0; f < 120 && !lane; f++) { __frames(1); lane = (G.run.tele || []).find(t => t.kind === 'lane'); }
  __frames(20); __frames(1, 1 / 60, true);
  return { lane: !!lane, dur: lane && lane.dur };
});
await shot('musket');
ok(r.lane, 'musket pirate: an aim lane at sea ' + JSON.stringify(r));
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
