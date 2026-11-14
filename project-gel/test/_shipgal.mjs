// every ship close up in the Ships tab, from two sides (TAG=before|after), and a contact sheet of them
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const TAG = process.env.TAG || 'before', ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 720 }, deviceScaleFactor: 1 })).newPage();
page.setDefaultTimeout(2400000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { const sv = G.save; sv.chapter = CHAPTER_COUNT; sv.cleared[CHAPTER_COUNT] = true; sv.sea.chapter = SEA_COUNT; sv.sea.ship = 9; UI.setHomePage('sea'); UI.openTab('skins'); const b = [...document.querySelectorAll('#skins button')].find(x => /^ships$/i.test(x.textContent.trim())); b.click(); });
for (let i = 0; i < 10; i++) {
  if (ONLY && !ONLY.includes(i)) continue;
  await page.evaluate(i => { UI.shipStage = () => i; UI.renderShipLooks(); const D = SHIPS[i]; prioritizeMeshes([D.model, D.model + '_rig']); }, i);
  await page.waitForFunction(i => { const D = SHIPS[i]; return R.enemyDraw[D.model] && (!SHIP_RIGS.includes(D.model) || R.enemyDraw[D.model + '_rig']); }, i, { timeout: 2400000, polling: 1000 });
  for (const [k, yaw] of [['a', 1.9], ['b', -1.0]]) {
    await page.evaluate(yaw => { HOME.yaw = yaw; }, yaw);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(dir, 'shots', `shipgal-${TAG}-${i}${k}.png`), clip: { x: 0, y: 60, width: 640, height: 600 } });
  }
}
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
