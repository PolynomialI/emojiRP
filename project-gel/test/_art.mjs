// item icons in their tiles, and the scroll chest (closed and open), for checking the artwork
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const tag = process.argv[2] || 'before';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 760 }, deviceScaleFactor: 2 })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => {
  const g = G.save.gear; let r = 0;
  for (const id of Object.keys(ARTIFACTS)) { g.items[id + ':' + (r % 6)] = 1; r++; }
  G.save.scrolls = 3;
  document.querySelector('.tab[data-tab="gear"]').click();
});
await page.waitForTimeout(800);
const shot = async (sel, name) => { const b = await page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: Math.min(r.height, 700) }; }, sel); await page.screenshot({ path: path.join(dir, `_art-${tag}-${name}.png`), clip: b }); };
await shot('#gearGrid', 'grid');
await page.evaluate(() => UI.openScrollChest());
await page.waitForTimeout(600);
await shot('#chestStage', 'chest');
await page.evaluate(() => UI.crackChest(1));
await page.waitForTimeout(2200);
await shot('#chestStage', 'open');
console.log(errs.length ? errs : 'no errors');
await browser.close();
