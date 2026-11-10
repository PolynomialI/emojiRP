// run: node test/check-home.mjs [wide|phone|chromebook]
// the home screen: drag spins the blob, it shoots the background foes, and the layout at one screen size
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const kind = process.argv[2] || 'wide';
const ctxOpts = {
  wide: { viewport: { width: 1280, height: 720 } },
  chromebook: { viewport: { width: 1366, height: 657 } },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
}[kind];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext(ctxOpts)).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 180000 });
await page.evaluate(() => { __manual(); __frames(3, 1 / 60, true); });

// drag sideways across the stage: the blob turns with the pointer, then keeps a little spin
const box = await page.locator('#heroTap').boundingBox();
const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
const y0 = await page.evaluate(() => G.hero.yaw);
await page.mouse.move(cx, cy); await page.mouse.down();
for (let i = 1; i <= 10; i++) { await page.mouse.move(cx + i * 15, cy); await page.evaluate(() => __frames(1)); }
const during = await page.evaluate(() => ({ yaw: G.hero.yaw, dragging: !!HOME.drag }));
await page.mouse.up();
const after = await page.evaluate(() => { __frames(30); return { yaw: G.hero.yaw, spin: HOME.spinV }; });
// a plain tap still pokes the blob
await page.mouse.click(cx, cy);
const poked = await page.evaluate(() => G.hero.arms.some(a => a.action) || Math.abs(G.hero.sqV) > 0.5);

// let it play: count foes popped by goo shots, and grab a frame with a shot in the air
const play = await page.evaluate(() => {
  let pops = 0, maxShots = 0, shotFrame = -1;
  for (let i = 0; i < 900; i++) {
    __frames(1);
    for (const f of HOME.foes) { if (f.dying > 0 && !f._seen) { f._seen = true; pops++; } if (!f.dying) f._seen = false; }
    if (HOME.shots.length > maxShots) maxShots = HOME.shots.length;
    if (HOME.shots.length && shotFrame < 0 && i > 300) { shotFrame = i; break; }
  }
  __frames(1, 1 / 60, true);
  return { pops, maxShots, foes: HOME.foes.length, portrait: !document.getElementById('chBoss').hidden };
});
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(dir, 'shots', `home-${kind}.png`) });
// the next and previous chapter arrows
await page.evaluate(() => { G.save.chapter = 3; UI.refreshHome(); });
await page.click('#chNext');
const ch = await page.evaluate(() => ({ sel: G.save.selected, name: document.getElementById('chName').textContent }));
console.log(JSON.stringify({ kind, y0: +y0.toFixed(2), duringDrag: +during.yaw.toFixed(2), dragging: during.dragging, afterRelease: +after.yaw.toFixed(2), spin: +after.spin.toFixed(2), poked, ...play, next: ch }), errs.length ? errs : 'no errors');
await browser.close();
