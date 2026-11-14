// screenshots of the menus, for checking text sizes (scale 1, for me)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const tag = process.argv[2] || 'before';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForTimeout(1500);
await page.evaluate(() => { G.save.coins = 5000; G.save.chapter = 4; UI.refreshHome && UI.refreshHome(); });
for (const tab of ['home', 'gear', 'skins', 'chapters', 'goals']) {
  await page.evaluate(t => { const b = document.querySelector(`.tab[data-tab="${t}"]`); if (b) b.click(); else UI.showTab && UI.showTab(t); }, tab);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(dir, `_shot-${tag}-${tab}.png`) });
}
await page.evaluate(() => document.querySelector('.tab[data-tab="gear"]').click()); await page.waitForTimeout(300);
await page.evaluate(() => $('gUpgrade').click()); await page.waitForTimeout(500);
await page.screenshot({ path: path.join(dir, `_shot-${tag}-blobup.png`) });
console.log(errs.length ? errs : 'no errors');
await browser.close();
