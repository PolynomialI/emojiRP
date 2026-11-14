// contact sheet of costumes (IDS=a,b) from four angles; LOUNGE=1 lies the blob down; GEAR=sword+cloak equips gear
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const out = process.argv[2] || path.join(dir, 'shots', 'cos.png');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => __manual());
const n = await page.evaluate(({ ids, lounge, gear }) => {
  const list = ids.split(','), yaws = [0, 0.8, Math.PI / 2, Math.PI];
  const h = new Hero();
  h.reset(0, 0); h.setArmCount(2);
  if (lounge) h.lounge = h.lng = 1;
  if (gear) { const items = {}, eq = {}; for (const g of gear.split('+')) { const k = artKey(g, 3); items[k] = 1; eq[ARTIFACTS[g].slot] = k; } h.setGear({ items, eq }); }
  for (let i = 0; i < 45; i++) h.update(1 / 60, [0, 0, 0], true);
  const imgs = [];
  iconBegin();
  for (const id of list) {
    h.setCostume(id);
    for (const y of yaws) { h.yaw = y; h.buildPrims(); R.resetStreams(); imgs.push([id, iconCapture(lounge ? [0, 2.6, 2.6] : [0, 1.6, 3.4], lounge ? [0, 0.3, -0.1] : [0, 0.9, 0], 0.55, h.out)]); }
  }
  iconEnd();
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:99;background:#3a8fe8;display:grid;grid-template-columns:repeat(8,1fr);gap:2px;padding:4px;align-content:start;font:600 11px sans-serif;color:#fff';
  for (const [id, src] of imgs) { const d = document.createElement('div'); d.innerHTML = `<img src="${src}" style="width:100%;display:block"><span>${id}</span>`; wrap.append(d); }
  document.body.append(wrap);
  return imgs.length;
}, { ids: process.env.IDS, lounge: !!process.env.LOUNGE, gear: process.env.GEAR });
await page.waitForTimeout(500);
await page.screenshot({ path: out });
console.log('icons', n, errs.length ? errs : 'no errors');
await browser.close();
