// the ten trophy hats and costumes on the blob, one screenshot each, tiled into a sheet by the page
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 700 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { document.querySelector('.tab[data-tab="skins"]').click(); __manual(); });
await page.waitForTimeout(200);
const ids = ['anglerhood', 'witchhat', 'wyrmhorns', 'titanhelm', 'cakehat', 'ufohat', 'cloudhat', 'levihood', 'jonesbeard', 'neptunecrown'];
for (const id of ids) {
  await page.evaluate(id => { if (!__rafQ.length) requestAnimationFrame(loop); const c = COSTUMES.find(k => k.id === id); applySkin('classic', c.slot === 'hat' ? 'none' : id, c.slot === 'hat' ? id : 'none'); HOME.yaw = 0.5; G.hero.yaw = 0.5; __frames(30); __frames(1, 1 / 60, true); }, id);
  await page.screenshot({ path: path.join(dir, 'shots', `trophy-${id}.png`), clip: { x: 60, y: 120, width: 380, height: 460 } });
}
console.log(errs.length ? errs.slice(0, 3) : 'no errors');
await browser.close();
