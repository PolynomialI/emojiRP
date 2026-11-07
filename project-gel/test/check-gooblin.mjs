// run: node test/check-gooblin.mjs
// the Golden Gooblin: it appears and flees, shows an arrow off screen, spills loot when caught, escapes if left alone
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { __manual(); __installNanCheck(); G.save.chapter = 3; G.save.selected = 3; UI.refreshHome(); __frames(3, 1 / 60, true); });
await page.click('#btnPlay');
await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
await page.waitForFunction(() => !!R.enemyDraw.gooblin, null, { timeout: 120000, polling: 200 });
const shot = async n => { await page.evaluate(() => __frames(1, 1 / 60, true)); await page.waitForTimeout(300); await page.screenshot({ path: path.join(dir, 'shots', n + '.png') }); };
await page.evaluate(() => { const r = G.run; r.events.length = 0; r.spawnAcc = -1e9; r.enemies.length = 0; window.readInput = () => { G.input.x = 0; G.input.z = 0; }; window.__g = spawnGooblin(); for (let i = 0; i < 12; i++) { r.invuln = 1; __frames(1); } });
await shot('gooblin-run');
// walk away so it is off screen
const off = await page.evaluate(() => { const g = window.__g, h = G.hero.pos; h[0] = g.x + (g.x > 0 ? -16 : 16); h[2] = g.z; updateCamera(0, true); for (let i = 0; i < 5; i++) __frames(1); return onScreen(g.x, g.z, -0.5); });
await shot('gooblin-arrow');
// catch it
const caught = await page.evaluate(() => {
  const g = window.__g, r = G.run, c0 = r.coins;
  while (lvlOf('ball') < maxLevel('ball')) addOrLevel('ball'); for (let i = 0; i < 6; i++) addOrLevel('aura');
  let hits = 0; const keep = g.hp;
  for (let i = 0; i < 600 && !g.dying; i++) { G.hero.pos[0] = g.x - 1.5; G.hero.pos[2] = g.z; r.invuln = 1; __frames(1); }
  for (let i = 0; i < 90; i++) { r.invuln = 1; __frames(1); if (G.state === 'chest') UI.closeChest(); }
  return { dead: !!g.dying, pickups: r.pickups.map(p => p.kind).join(','), coinsPicked: r.coins - c0 };
});
await shot('gooblin-caught');
// one left alone escapes after its time is up
const esc = await page.evaluate(() => { const r = G.run, g = spawnGooblin(); G.hero.pos[0] = g.x + 30 * Math.sign(-g.x || 1); for (let i = 0; i < 20 * 60 && !g.dying; i++) { r.invuln = 1; if (G.state === 'chest') UI.closeChest(); if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } __frames(1); } return { escaped: g.dying >= 1, inList: r.enemies.includes(g), life: +g.life.toFixed(2), st: G.state }; });
console.log(JSON.stringify({ offScreen: !off, caught, esc }), 'NaN', JSON.stringify(await page.evaluate(() => __nan)), errs.length ? errs : 'no errors');
await browser.close();
