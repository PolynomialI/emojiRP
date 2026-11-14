import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => __manual()); await page.waitForTimeout(200);
await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); });
console.log(await page.evaluate(() => {
  const g = G.save.gear; g.items['cloak:3'] = 1; g.eq.armor = 'cloak:3'; document.querySelector('.tab[data-tab="gear"]').click(); __frames(5);
  const h = G.hero; h.buildPrims();
  const pr = []; for (let i = 0; i < h.out.count; i++) pr.push([h.out.pc[i*4], h.out.pc[i*4+1], +h.out.pa[i*4].toFixed(2), +h.out.pa[i*4+1].toFixed(2), +h.out.pa[i*4+2].toFixed(2), +h.out.pa[i*4+3].toFixed(2)].join(' '));
  return { pos: h.pos.map(v => +v.toFixed(2)), scale: h.scale, prims: pr.slice(10, 16), gear: JSON.stringify(h.gear), count: h.out.count, max: HERO_MAXP, robe: !!h.robe, arms: h.arms.length, costume: !!h.costume, hat: !!h.hat };
}));
await page.evaluate(() => __frames(3));
await page.screenshot({ path: path.join(dir, '_robedbg.png') });
await browser.close();
