// home stage: tapping shoots the grunt nearest the tap; grunts walk up to the blob
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const vp = process.argv[2] === 'tall' ? { width: 430, height: 860 } : { width: 1280, height: 760 };
const page = await (await browser.newContext({ viewport: vp })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home' && HOME.foes.length >= 5 && HOME.foes.every(f => R.enemyDraw[f.model]), null, { timeout: 300000, polling: 300 });
await page.evaluate(() => __manual()); await page.waitForTimeout(200);
await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); __frames(30); });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
const foes = await page.evaluate(() => HOME.foes.map((f, i) => { const p = [0, 0]; R.project(f.x, 0.8, f.z, p); const el = document.elementFromPoint(p[0], p[1]); return { i, x: Math.round(p[0]), y: Math.round(p[1]), el: el ? (el.id || el.className || el.tagName) : null, d: +Math.hypot(f.x, f.z).toFixed(1) }; }));
console.log(JSON.stringify(foes));
// click on each grunt in turn; the shot goes to the one under the pointer
let hits = 0, aimed = 0;
for (let k = 0; k < 3; k++) {
  const t = await page.evaluate(() => { HOME.shootT = 99; const f = HOME.foes.find(f => !f.dying && f.appear >= 1 && !homeTargeted(f)); const p = [0, 0]; R.project(f.x, 0.8, f.z, p); return { i: HOME.foes.indexOf(f), x: p[0], y: p[1] }; });
  await page.mouse.click(t.x, t.y);
  const aim = await page.evaluate(i => HOME.shots.some(s => s.foe === HOME.foes[i]) || (HOME.aim && HOME.aim.foe === HOME.foes[i]), t.i);
  if (aim) aimed++;
  await page.evaluate(() => __frames(80));
  if (await page.evaluate(i => HOME.foes[i].dying > 0 || HOME.foes[i].appear < 1, t.i)) hits++;
}
ok(aimed === 3 && hits === 3, `clicking a grunt shoots that grunt (aimed ${aimed}/3, popped ${hits}/3)`);
// left alone, grunts walk right up to the blob and shove it
const r = await page.evaluate(() => {
  HOME.shootT = 1e9; HOME.idle = 0;
  for (const f of HOME.foes) { const d = Math.hypot(f.x, f.z) || 1; f.x = f.x / d * 3.6; f.z = f.z / d * 3.6; f.dying = 0; f.appear = 1; }
  __frames(160);
  return { near: HOME.foes.filter(f => !f.moving && Math.hypot(f.x, f.z) < 3.5).length, shots: HOME.shots.length };
});
ok(r.near >= 4, 'grunts reach the blob ' + JSON.stringify(r));
await page.screenshot({ path: path.join(dir, `_homeshoot-${process.argv[2] || 'wide'}.png`) });
console.log(errs.length ? errs : 'no errors');
await browser.close();
