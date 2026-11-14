// the Ships tab: paints, sails, flags, wake trails tried on and bought; the ship drawn in the tab
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 760 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
await page.evaluate(() => { G.save.coins = 20000; G.save.sea.ship = 3; prioritizeMeshes(['galleon', 'galleon_rig', 'flag_roger', 'sloop', 'sloop_rig']); document.querySelector('.tab[data-tab="skins"]').click(); document.querySelector('#blobTabs button[data-bt="ships"]').click(); });
await page.waitForFunction(() => ['galleon', 'galleon_rig', 'flag_roger'].every(m => R.enemyDraw[m]), null, { timeout: 1800000, polling: 1000 });
let r = await page.evaluate(() => ({ heads: [...document.querySelectorAll('#skinGrid .skin-head')].map(h => h.textContent), tiles: document.querySelectorAll('#skinGrid .skin').length, stage: OC.stage, scene: seaStageOn() }));
ok(r.heads.join() === 'Hull Paint,Sails,Flags,Wake Trails' && r.tiles === 29 && r.scene, 'Ships tab lists the four kinds and shows the ship ' + JSON.stringify(r));
// try on crimson paint, black sails, the jolly roger: buy each
r = await page.evaluate(() => {
  const click = name => [...document.querySelectorAll('#skinGrid .skin')].find(b => b.querySelector('span').textContent === name).click();
  const c0 = G.save.coins;
  click('Crimson'); const pv = UI.shipPreview.paint, tint = shipTint('galleon', 'hull'); UI.skinAction();
  click('Jet Black Sails'); UI.skinAction(); click('Jolly Roger'); UI.skinAction(); click('Flame Wake'); UI.skinAction();
  return { pv, tint: tint.map(v => +v.toFixed(2)), paint: G.save.sea.paint, sail: G.save.sea.sail, flag: G.save.sea.flag, trail: G.save.sea.trail, spent: c0 - G.save.coins, looks: G.save.sea.looks.length };
});
ok(r.paint === 'crimson' && r.sail === 'jet' && r.flag === 'roger' && r.trail === 'flame' && r.spent === 900 + 1200 + 800 + 1800 && r.tint[0] > 3, 'bought and equipped paint, sails, flag and trail ' + JSON.stringify(r));
await page.evaluate(() => { __manual(); });
await page.waitForTimeout(200);
await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); __frames(90); __frames(1, 1 / 60, true); });
await page.screenshot({ path: path.join(dir, 'shots', 'ships-tab.png') });
// a run: the wake trail and the painted ship at sea
await page.evaluate(() => { __auto = true; requestAnimationFrame(loop); goHome(); });
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
