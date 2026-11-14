// off-screen culling: how many mesh instances a frame skips (chapter 3's city, an ocean, the menus), and that the
// picture is the same with culling on and off; and chapter 3's see-through buildings from each corner of the
// arena (screenshots test/shots/cull-corner-*-TAG.png). HTML=another build, TAG=its name.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), TAG = process.env.TAG || 'new';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + (process.env.HTML || path.join(dir, '..', 'dist', 'project-gel.html')));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 900000, polling: 1000 });
const hasCull = await page.evaluate(() => typeof R.cullBegin === 'function');
const stats = async label => page.evaluate(([label, hasCull]) => {
  if (!hasCull) return label + ': (no culling in this build)';
  __frames(1, 1 / 60, true);
  const q = R.queued, c = R.culled;
  // the same frame with culling off: the picture must match
  const grab = () => { const px = new Uint8Array(4 * 64 * 64); gl.readPixels(Math.floor(R.w / 2) - 32, Math.floor(R.h / 2) - 32, 64, 64, gl.RGBA, gl.UNSIGNED_BYTE, px); return px; };
  const keepT = R.frame.time;
  R.frame.time = keepT; renderFrame(); const a = grab();
  const cb = R.cullBegin; R.cullBegin = function () { cb.call(R); R.cull = false; };
  R.frame.time = keepT; renderFrame(); const b = grab(); R.cullBegin = cb;
  let diff = 0; for (let i = 0; i < a.length; i++) diff = Math.max(diff, Math.abs(a[i] - b[i]));
  return `${label}: ${q} mesh instances queued, ${c} off screen skipped (${Math.round(c / Math.max(1, q) * 100)}%); centre of the picture culled vs not: max diff ${diff}`;
}, [label, hasCull]);
await page.evaluate(() => { __manual(); __frames(5, 1 / 60, true); });
console.log(await stats('home'));
await page.evaluate(() => { G.save.chapter = 20; beginChapter(3); });
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 300 });
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9; G.run.events = []; for (let i = 0; i < 120; i++) { if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } __frames(1); } });
console.log(await stats('city'));
// each corner: the blob backed into it, the camera settled
for (const [n, sx, sz] of [['ne', 1, -1], ['nw', -1, -1], ['se', 1, 1], ['sw', -1, 1]]) {
  const r = await page.evaluate(([sx, sz]) => {
    G.run.enemies.length = 0;
    const h = G.hero.pos; h[0] = sx * (ARENA.hw - 1.2); h[2] = sz * (ARENA.hd - 1.2);
    for (let i = 0; i < 90; i++) { G.hero.pos[0] = sx * (ARENA.hw - 1.2); G.hero.pos[2] = sz * (ARENA.hd - 1.2); G.run.enemies.length = 0; if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } __frames(1); }
    __frames(1, 1 / 60, true);
    const tall = ARENA.props.filter(o => o.height), faded = tall.filter(o => o.fade > 0.3).map(o => o.model + '@' + Math.round(o.x) + ',' + Math.round(o.z));
    return faded.join(' ') || 'none faded';
  }, [sx, sz]);
  await page.screenshot({ path: path.join(dir, 'shots', `cull-corner-${n}-${TAG}.png`) });
  console.log(`corner ${n}: ${r}`);
}
await page.evaluate(() => { G.run.events = []; setState('home'); G.run = null; UI.setHomePage('land'); });
await page.evaluate(() => { G.save.cleared[CHAPTER_COUNT] = true; beginSeaChapter(1); });
await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 600000, polling: 300 });
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9; for (let i = 0; i < 600; i++) { if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } __frames(1); } });
console.log(await stats('ocean'));
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
