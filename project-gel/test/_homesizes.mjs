// the home screen (land and ocean) at a few window sizes, for checking it fills the window (TAG=before|after)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), TAG = process.env.TAG || 'after';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const errs = [];
for (const [w, h] of [[1903, 931], [1100, 720], [1366, 768], [430, 900]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript({ path: path.join(dir, 'harness.js') });
  await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
  await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => { const b = $('home').getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
  const tab = await page.evaluate(() => { const b = $('pageTab').getBoundingClientRect(), t = document.querySelector('.title-wrap').getBoundingClientRect(); return [Math.round(b.left), Math.round(b.right), Math.round(t.right), innerWidth, $('pageTab').hidden]; });
  console.log(w + 'x' + h, 'home box', r.join('x'), 'tab', JSON.stringify(tab));
  await page.screenshot({ path: path.join(dir, 'shots', `home-${TAG}-${w}x${h}.png`) });
  await page.click('#pageTab', { force: true });
  await page.waitForFunction(() => UI.homePage === 'sea' && ['pswim', 'pfloat', 'ptube'].every(m => R.enemyDraw[m]), null, { timeout: 300000, polling: 500 });
  await page.waitForTimeout(5000);
  const st = await page.evaluate(() => { const n0 = HOME.seaFoes.length, shot = homeShoot(); return { foes: n0, shot, shots: HOME.shots.length, near: HOME.seaFoes.filter(f => !f.moving).length }; });
  await page.waitForTimeout(4000);
  const st2 = await page.evaluate(() => HOME.seaFoes.filter(f => f.dying).length);
  console.log('  sea foes', JSON.stringify(st), 'dying after a tap:', st2);
  await page.screenshot({ path: path.join(dir, 'shots', `home-${TAG}-sea-${w}x${h}.png`) });
  await page.close();
}
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
