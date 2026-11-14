// the upgrade cap: an old save with levels past 20 is set back to 20 and refunded
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext()).newPage();
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.addInitScript(() => { localStorage.setItem('projectGel.save.v1', JSON.stringify({ v: 1, content: 2, coins: 100, chapter: 5, selected: 1, cleared: {}, best: {}, upgrades: { damage: 45, health: 22, offline: 3, speed: 20, magnet: 10 } })); });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const r = await page.evaluate(() => { let want = 100; for (let l = 20; l < 45; l++) want += upgradeCost('damage', l); for (let l = 20; l < 22; l++) want += upgradeCost('health', l); return { up: G.save.upgrades, coins: G.save.coins, want, content: G.save.content, max: Object.values(META_UPGRADES).map(u => u.max) }; });
console.log(JSON.stringify(r), r.coins === r.want && r.up.damage === 20 && r.up.health === 20 && r.up.speed === 20 && r.up.offline === 3 ? 'PASS' : 'FAIL');
await browser.close();
