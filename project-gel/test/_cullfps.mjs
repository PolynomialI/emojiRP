// does culling make frames faster? A chapter with a big crowd (most of it walking in from off screen, as in play),
// and an ocean mid-run: frames timed with culling on and off, alternating in blocks (readPixels-synced, so the
// GPU's work counts). SwiftShader draws on the CPU: compare the two, not the totals.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
page.setDefaultTimeout(3600000);
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 900000, polling: 1000 });
await page.evaluate(() => {
  window.__time = (label, frames = 6, blocks = 4) => {
    const cb = R.cullBegin, off = function () { cb.call(R); R.cull = false; };
    const sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    let on = 0, offT = 0, q = 0, c = 0, triOn = 0, triOff = 0;
    const tris = () => { let t = 0; for (const n in R.enemyDraw) for (const k of ['normal', 'elite']) { const d = R.enemyDraw[n][k]; t += d.ni / 3 * d.stream.count; } return t; };
    renderFrame(); sync();
    for (let b = 0; b < blocks; b++) {
      for (const cull of [true, false]) {
        R.cullBegin = cull ? cb : off;
        const t0 = performance.now();
        for (let i = 0; i < frames; i++) { renderFrame(); sync(); }
        const dt = (performance.now() - t0) / frames;
        if (cull) { on += dt; q = R.queued; c = R.culled; triOn = tris(); } else { offT += dt; triOff = tris(); }
      }
    }
    R.cullBegin = cb;
    return `${label}: ${q} models queued, ${c} skipped; ${Math.round(triOff / 1000)}k -> ${Math.round(triOn / 1000)}k triangles; frame ${(offT / blocks).toFixed(0)} ms without culling, ${(on / blocks).toFixed(0)} ms with (${Math.round((1 - on / offT) * 100)}% faster)`;
  };
});
// a ground chapter, 3 minutes in, with a crowd spread around the view and beyond it
await page.evaluate(() => { G.save.chapter = 20; beginChapter(7); });
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 300 });
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9; G.run.events = [];
  const h = G.hero.pos, types = Object.keys(G.run.info.has || {}).filter(k => ENEMY_TYPES[k]); const pool = types.length ? types : ['stickman'];
  for (let i = 0; i < 260; i++) { const a = Math.random() * TAU, r = 3 + Math.random() * 30; const e = spawnEnemy(pool[i % pool.length], h[0] + Math.cos(a) * r, h[2] + Math.sin(a) * r); if (e) resolveCircle(e, e.radius); }
  for (let i = 0; i < 20; i++) { if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } __frames(1); } });
console.log(await page.evaluate(() => __time('chapter 7, 260 foes')));
await page.evaluate(() => { G.run.events = []; setState('home'); G.run = null; });
await page.evaluate(() => { G.save.cleared[CHAPTER_COUNT] = true; beginSeaChapter(5); });
await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 600000, polling: 300 });
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9; G.run.t = 200;
  for (let i = 0; i < 60 * 25; i++) { if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } __frames(1); } });
console.log(await page.evaluate(() => __time('ocean 5 at 3:45, ' + G.run.enemies.length + ' foes')));
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
