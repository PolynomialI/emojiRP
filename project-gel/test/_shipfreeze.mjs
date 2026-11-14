// picking the Ship upgrade must never stall the game: level the ship before its meshes exist and time the call,
// then wait for the new ship to take to the water on its own
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { G.save.cleared[CHAPTER_COUNT] = true; beginSeaChapter(1); });
await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 600000, polling: 500 });
const r = await page.evaluate(() => {
  const out = [];
  for (let i = 0; i < 8; i++) {
    const want = Math.min(SHIPS.length - 1, lvlOf('ship'));
    const ready = seaShipReady(want), t0 = performance.now();
    addOrLevel('ship');
    out.push(`level ${lvlOf('ship')} (${SHIPS[want].name}, built: ${ready}): ${Math.round(performance.now() - t0)} ms, sailing ${shipDef().name}`);
  }
  return out;
});
console.log(r.join('\n'));
const t0 = Date.now();
await page.waitForFunction(() => OC.stage === OC.wantStage, null, { timeout: 1800000, polling: 1000 });
console.log('the', await page.evaluate(() => shipDef().name), 'took to the water', Math.round((Date.now() - t0) / 1000), 's later; hull', await page.evaluate(() => Math.round(G.run.maxHp)));
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
