// small UI fixes: settings and page icons, the Sell row, dragging the blob on Gear and Blobs, a hovered menu button
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1903, height: 931 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForTimeout(1500);
const S = n => path.join(dir, 'shots', 'fix-' + n + '.png');
console.log('coin text vs gear', await page.evaluate(() => { const t = $('homeCoins').getBoundingClientRect(), g = $('btnSettings').querySelector('svg').getBoundingClientRect(); return { coinMid: +(t.top + t.height / 2).toFixed(1), gearMid: +(g.top + g.height / 2).toFixed(1) }; }));
await page.screenshot({ path: S('top'), clip: { x: 0, y: 0, width: 1200, height: 220 } });
const gb = await page.evaluate(() => { const r = document.querySelector('.mbtn').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
await page.mouse.move(gb[0], gb[1]); await page.waitForTimeout(500);
await page.screenshot({ path: S('hover'), clip: { x: 1330, y: 160, width: 573, height: 700 } });
await page.mouse.move(10, 900);
const drag = async (sel, name) => {
  const c = await page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
  const y0 = await page.evaluate(() => G.hero.yaw);
  await page.mouse.move(c[0], c[1]); await page.mouse.down();
  for (let i = 1; i <= 10; i++) { await page.mouse.move(c[0] + i * 20, c[1]); await page.waitForTimeout(30); }
  await page.mouse.up(); await page.waitForTimeout(500);
  const y1 = await page.evaluate(() => G.hero.yaw);
  console.log(name, 'drag turned the blob by', (y1 - y0).toFixed(2));
};
await page.evaluate(() => UI.openTab('gear')); await page.waitForTimeout(900);
await drag('#gearStage', 'gear');
await page.screenshot({ path: S('gear'), clip: { x: 900, y: 0, width: 1003, height: 400 } });
await page.evaluate(() => UI.openTab('skins')); await page.waitForTimeout(900);
const sk = await page.evaluate(() => { const p = document.querySelector('#skins .blob-pick').getBoundingClientRect(); return p.left; });
await page.evaluate(() => {}); 
const c = [sk / 2, 480], y0 = await page.evaluate(() => G.hero.yaw);
await page.mouse.move(c[0], c[1]); await page.mouse.down();
for (let i = 1; i <= 10; i++) { await page.mouse.move(c[0] + i * 20, c[1]); await page.waitForTimeout(30); }
await page.mouse.up(); await page.waitForTimeout(500);
console.log('skins drag turned the blob by', (await page.evaluate(() => G.hero.yaw) - y0).toFixed(2));
await page.evaluate(() => { UI.openTab('home'); UI.setHomePage('sea'); }); await page.waitForTimeout(1500);
await page.screenshot({ path: S('sea-top'), clip: { x: 0, y: 0, width: 1200, height: 220 } });
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
