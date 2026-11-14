// the deep mine's crowd up close: every cave enemy in one room, posed in a row, from the hero's spot; then a few
// seconds of each one acting (a spider dropping, a bat diving, a goblin throwing, an ogre heaving, a golem charging)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
page.setDefaultTimeout(3600000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { G.save.chapter = CHAPTER_COUNT; G.save.selected = 20; beginChapter(20); });
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 500 });
await page.waitForFunction(() => ['cspider', 'cbat', 'goblin', 'ogre', 'cgolem', 'dynamite', 'xbowman', 'cover0'].every(m => R.enemyDraw[m]), null, { timeout: 900000, polling: 1000 });
await page.evaluate(() => { __manual(); });
await page.waitForTimeout(200);
const shot = async n => { await page.evaluate(() => __frames(1, 1 / 60, true)); await page.screenshot({ path: path.join(dir, 'shots', 'cavefoes-' + n + '.png') }); };
await page.evaluate(() => {
  if (!__rafQ.length) requestAnimationFrame(loop);
  DEV.god = true; caveEnter();
  for (let i = 0; i < 60 * 30 && !(CV.phase === 'fight'); i++) __frames(1);
  const Rm = CV.room; Rm.waves = []; Rm.foes.length = 0;
  for (const c of Rm.covers) { c.drop = 1; c.dropT = undefined; }
  const row = ['spider', 'bat', 'goblin', 'ogre', 'golem'];
  row.forEach((type, i) => { const T = CAVE_FOES[type]; Rm.foes.push({ type, T, hp: T.hp, maxHp: T.hp, lx: -5 + i * 2.5, lz: -10.5, y: type === 'bat' ? 2.2 : 0, sink: 0, state: 'pose', t: 0, yaw: 0, flash: 0, ph: 0.2, clip: 'idle', u: 0, cover: null, throws: 0, tint: hexToRgb(T.tint), dying: 0, peekX: 0 }); });
  __frames(5, 1 / 60, true);
});
await shot('row');
// now let them act
await page.evaluate(() => { for (const f of CV.room.foes) { f.state = { spider: 'dash', bat: 'fly', goblin: 'throw', ogre: 'heave', golem: 'charge' }[f.type]; f.t = 0; } __frames(36, 1 / 60, true); });
await shot('act1');
await page.evaluate(() => { __frames(30, 1 / 60, true); });
await shot('act2');
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
