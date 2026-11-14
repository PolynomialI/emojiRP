// every island model in a grid, seen from the game's camera (KINDS=..., TAG=...)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const TAG = process.env.TAG || 'a';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 760 } })).newPage();
page.setDefaultTimeout(2400000);
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const kinds = await page.evaluate(k => k ? k.split(',') : ['isle0', 'isle1', ...SEA_ISLES], process.env.KINDS || '');
const CH = +(process.env.CH || 1);
await page.evaluate(([kinds, ch]) => { G.save.sea.chapter = SEA_COUNT; G.save.sea.selected = ch; UI.homePage = 'sea'; UI.refreshHome(); prioritizeMeshes(['palm', 'rock0', 'rock1', 'rock2', ...kinds]); beginSeaChapter(ch); }, [kinds, CH]);
await page.waitForFunction(k => G.state === 'run' && k.every(m => R.enemyDraw[m]) && ['palm', 'rock0'].every(m => R.enemyDraw[m]), kinds, { timeout: 2400000, polling: 1000 });
await page.evaluate(() => __manual()); await page.waitForTimeout(200);
await page.evaluate(kinds => {
  if (!__rafQ.length) requestAnimationFrame(loop);
  const run = G.run; run.events = []; run.invuln = 1e9; run.spawnAcc = -1e9;
  const S = OC.ship; S.x = 0; S.z = 60; S.vx = S.vz = S.speed = 0;
  for (const e of run.enemies) { e.hp = 0; killEnemy(e); }
  OC.isles = []; OC.chunks = new Map(); for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) OC.chunks.set(i + ',' + j, true);
  const cols = Math.ceil(Math.sqrt(kinds.length * 1.6)), rnd = mulberry(7);
  kinds.forEach((k, i) => { const x = (i % cols - (cols - 1) / 2) * 15, z = 50 + Math.floor(i / cols) * 15; G.run.chapter = G.run.chapter; const saved = SEA_CHAPTERS[run.chapter - 1].isles; SEA_CHAPTERS[run.chapter - 1].isles = [k]; seaMakeIsle(x, z, () => 0.6); SEA_CHAPTERS[run.chapter - 1].isles = saved; });
  ARENA.obstacles = OC.isles.map(I => I.ob);
  S.x = 0; S.z = 50 + Math.floor((kinds.length - 1) / cols) * 7.5 + 3;
  SHIPS[0].zoom = 3.4;
  __frames(240);
}, kinds);
await page.evaluate(() => { __frames(1, 1 / 60, true); });
await page.screenshot({ path: path.join(dir, 'shots', `isles-${TAG}.png`) });
console.log(kinds.join(','), errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
