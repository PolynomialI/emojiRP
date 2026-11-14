// Picking a run back up (15a-resume.js): a land run, a boss fight in progress, a sea run, and lost graphics. Each
// time the page is reloaded mid-run and must come back paused in the same run, not on the home screen.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 180000 });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
// the run as it stands, to compare after the reload
const sig = () => page.evaluate(() => { const r = G.run; return { mode: r.sea ? 'sea' : r.rush ? 'rush' : r.endless ? 'endless' : 'land', chapter: r.chapter, t: Math.round(r.t), level: r.level, hp: Math.round(r.hp), coins: r.coins, kills: r.kills,
  slots: r.slots.map(s => s.id + s.lvl + (s.evo ? '*' : '')).join(' '), pos: r.sea ? [Math.round(OC.ship.x), Math.round(OC.ship.z)] : [Math.round(G.hero.pos[0]), Math.round(G.hero.pos[2])] }; });
const reloadAndWait = async (how = 'reload') => {
  if (how === 'reload') await page.reload();
  await page.waitForFunction(() => typeof G !== 'undefined' && G.run && (G.state === 'pause' || G.state === 'levelup'), null, { timeout: 900000, polling: 500 });
  return sig();
};
// 1. a land chapter, part way in, with some powers
await page.evaluate(() => { G.save.cleared[CHAPTER_COUNT] = true; G.save.chapter = CHAPTER_COUNT; beginChapter(4); });
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 900000, polling: 300 });
await page.evaluate(() => {
  __manual(); DEV.god = true; const run = G.run;
  for (const id of ['ball', 'ball', 'fists', 'fists', 'thick', 'regen', 'speed']) addOrLevel(id);
  run.t = 95; run.level = 9; run.coins = 37; run.kills = 210; run.hp = run.maxHp * 0.6;
  G.hero.pos[0] = 4; G.hero.pos[2] = -3;
  __frames(30);
  saveRunCheckpoint();
});
const a = await sig();
let b = await reloadAndWait();
ok(b.mode === a.mode && b.chapter === a.chapter && b.slots === a.slots && b.level === a.level && b.coins === a.coins && b.kills === a.kills && Math.abs(b.t - a.t) <= 1 && Math.abs(b.hp - a.hp) <= 2 && b.pos.join() === a.pos.join(),
  'land run comes back paused, the same: ' + JSON.stringify({ before: a, after: b }));
// 2. a boss fight in progress keeps the boss's health
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; resumeGame(); const run = G.run; run.events = run.events.filter(e => e.kind !== 'boss'); startBoss(); __frames(200); for (const x of run.bosses) x.hp = x.maxHp * 0.4; __frames(5); saveRunCheckpoint(); });
await reloadAndWait();
const boss = await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; resumeGame(); for (let i = 0; i < 400 && !G.run.bosses.length; i++) __frames(1); const b = G.run.bosses; return { n: b.length, frac: b.length ? +(b.reduce((s, x) => s + x.hp, 0) / b.reduce((s, x) => s + x.maxHp, 0)).toFixed(2) : null }; });
ok(boss.n > 0 && Math.abs(boss.frac - 0.4) < 0.05, 'a boss fight in progress drops back in with its health ' + JSON.stringify(boss));
// 3. ending the run clears the checkpoint: a reload then opens on the home screen
await page.evaluate(() => { G.run.hp = -1; finishRun(false); });
await page.reload();
await page.waitForFunction(() => typeof G !== 'undefined' && G.state === 'home', null, { timeout: 300000, polling: 500 });
ok(await page.evaluate(() => !G.run && !localStorage.getItem(RESUME_KEY)), 'a finished run is not picked back up');
// 4. at sea: the ship's place and the ship level come back
await page.evaluate(() => { G.save.sea.chapter = SEA_COUNT; beginSeaChapter(3); });
await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 900000, polling: 300 });
await page.evaluate(() => {
  __manual(); DEV.god = true; const run = G.run;
  for (const id of ['ship', 'musket', 'musket', 'harpoon', 'fort', 'crew']) if (SKILLS[id] || PASSIVES[id]) addOrLevel(id);
  OC.ship.x = 30; OC.ship.z = 52; run.t = 140; run.level = 7; run.coins = 12;
  __frames(20); saveRunCheckpoint();
});
const c = await sig();
const d = await reloadAndWait();
ok(d.mode === 'sea' && d.chapter === c.chapter && d.slots === c.slots && d.level === c.level && Math.abs(d.pos[0] - c.pos[0]) <= 1 && Math.abs(d.pos[1] - c.pos[1]) <= 1, 'sea run comes back, ship where it was: ' + JSON.stringify({ before: c, after: d }));
// 5. the graphics are lost mid-run: the page reloads itself into the run
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); resumeGame(); __frames(10); G.run.coins = 99; saveRunCheckpoint(); });
const nav = page.waitForNavigation({ timeout: 120000 });
await page.evaluate(() => { const ext = gl.getExtension('WEBGL_lose_context'); ext.loseContext(); });
await nav;
const e = await reloadAndWait('none');
ok(e.mode === 'sea' && e.coins === 99, 'lost graphics: the page reloads into the same run ' + JSON.stringify(e));
await page.screenshot({ path: path.join(dir, 'shots', 'resume.png') });
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
