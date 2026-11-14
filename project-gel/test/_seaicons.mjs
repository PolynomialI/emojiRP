// the sea's upgrade icons where players see them: a level-up, the HUD slots, the pause list (TAG=before|after)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const TAG = process.env.TAG || 'before';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 720 }, deviceScaleFactor: 1 })).newPage();
page.setDefaultTimeout(2400000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { G.save.sea.chapter = 20; UI.homePage = 'sea'; UI.refreshHome(); prioritizeMeshes([...MOUNT_MESHES, 'raft']); beginSeaChapter(1); });
await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea && SEA_ICON_SHOTS.every(([, m]) => R.enemyDraw[m]), null, { timeout: 2400000, polling: 1000 });
await page.evaluate(() => { __manual(); });
await page.waitForTimeout(200);
await page.evaluate(() => {
  if (!__rafQ.length) requestAnimationFrame(loop);
  seaIcons(); const run = G.run; run.events = []; run.invuln = 1e9;
  for (const id of ['harpoon', 'gulls', 'anchor', 'lamp', 'fort', 'propeller', 'crew']) addOrLevel(id);
  __frames(5);
  run.choices = [{ id: 'barrels' }, { id: 'hose' }, { id: 'shark' }]; UI.renderChoices(); setState('levelup');
  __frames(20, 1 / 60, false);
});
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(dir, 'shots', `seaicons-${TAG}-levelup.png`) });
await page.evaluate(() => { setState('run'); pauseGame(); });
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(dir, 'shots', `seaicons-${TAG}-pause.png`) });
// every sea icon in a row on a plain sheet
await page.evaluate(() => {
  const d = document.createElement('div'); d.id = 'iconSheet'; d.style.cssText = 'position:fixed;inset:0;z-index:99;background:#e8f2ff;display:flex;flex-wrap:wrap;gap:10px;padding:16px;align-content:flex-start';
  for (const [k] of SEA_ICON_SHOTS) { const t = document.createElement('div'); t.style.cssText = 'width:120px;height:120px;border-radius:22px;background:linear-gradient(180deg,#ffd0e6,#ff8ac0);display:grid;place-items:center'; const im = document.createElement('img'); im.src = ICONS.get(k); im.style.cssText = 'width:96%;height:96%'; t.append(im); d.append(t); }
  document.body.append(d);
});
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(dir, 'shots', `seaicons-${TAG}-sheet.png`) });
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
