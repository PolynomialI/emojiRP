// the Hero Cloak robe: full body, hem on springs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => __manual()); await page.waitForTimeout(200);
await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); });
await page.evaluate(() => { const g = G.save.gear; g.items['cloak:3'] = 1; g.eq.armor = 'cloak:3'; document.querySelector('.tab[data-tab="gear"]').click(); __frames(60); __frames(1, 1 / 60, true); });
await page.screenshot({ path: path.join(dir, '_robe-gear.png'), clip: { x: 150, y: 90, width: 420, height: 560 } });
// a quick spin in the menu twists the robe
let r = await page.evaluate(() => { const out = []; for (let i = 0; i < 12; i++) { HOME.yaw += 0.25; G.hero.yaw = HOME.yaw; __frames(1); out.push(+G.hero.robe.tw.toFixed(2)); } __frames(1, 1 / 60, true); return out; });
await page.screenshot({ path: path.join(dir, '_robe-spin.png'), clip: { x: 150, y: 90, width: 420, height: 560 } });
console.log('twist while spun', r.join(' '));
// in a run: run forward, then stop
await page.evaluate(() => { document.querySelector('#gear .back, #gearBack, [data-back]')?.click(); beginChapter(1); });
await page.waitForFunction(() => G.state === 'run', null, { timeout: 300000, polling: 200 });
r = await page.evaluate(() => {
  const run = G.run; run.events = []; run.invuln = 1e9; run.enemies = [];
  const z = [];
  INPUT.keys.add('d'); for (let i = 0; i < 50; i++) { __frames(1); if (i % 10 === 9) z.push('run ' + G.hero.robe.z.toFixed(2)); }
  INPUT.keys.delete('d'); for (let i = 0; i < 60; i++) { __frames(1); if (i % 6 === 5) z.push(G.hero.robe.z.toFixed(2)); }
  return z;
});
console.log('hem fore/aft (negative = trailing):', r.join(' '));
await page.evaluate(() => { INPUT.keys.add('d'); __frames(40); __frames(1, 1 / 60, true); });
const p = await page.evaluate(() => { const o = [0, 0]; R.project(G.hero.pos[0], 0.8, G.hero.pos[2], o); return o; });
await page.screenshot({ path: path.join(dir, '_robe-run.png'), clip: { x: Math.max(0, p[0] - 160), y: Math.max(0, p[1] - 170), width: 320, height: 300 } });
console.log(errs.length ? errs : 'no errors');
await browser.close();
