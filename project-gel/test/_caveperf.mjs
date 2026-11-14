// where a cave frame's time goes: the game update, building the scene, submitting it and the GPU (gl.finish),
// with how many mesh instances, triangles and draw calls it holds; the same for a normal chapter-20 arena
// frame. SwiftShader is slow at everything, so compare the parts and the scenes, not the totals.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), N = +(process.env.N || 20);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
page.setDefaultTimeout(3600000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + (process.env.HTML || path.join(dir, '..', 'dist', 'project-gel.html')));
const TAG = process.env.TAG || 'new', snap = async n => { await page.evaluate(() => __frames(1, 1 / 60, true)); await page.screenshot({ path: path.join(dir, 'shots', `perf-${n}-${TAG}.png`) }); };
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { G.save.settings.quality = 'low'; applySettings(); G.save.chapter = CHAPTER_COUNT; G.save.selected = 20; beginChapter(20); });
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 500 });
await page.evaluate(() => { DEV.god = true; G.run.invuln = 1e9; G.run.events = []; });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 900000, polling: 1000 });
await page.evaluate(() => {
  __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9;
  const T = window.__T = { upd: 0, emit: 0, draw: 0, gpu: 0, post: 0, n: 0, inst: 0, tri: 0, calls: 0 };
  const wrap = (obj, k, slot, after) => { const f = obj[k]; obj[k] = function (...a) { const t0 = performance.now(); const r = f.apply(this, a); if (after) after(); T[slot] += performance.now() - t0; return r; }; };
  wrap(window, 'updateRun', 'upd'); wrap(R, 'post', 'post', () => gl.finish());
  const draw = R.drawScene; R.drawScene = function () {
    let inst = 0, tri = 0, calls = 0;
    for (const n in R.enemyDraw) for (const k of ['normal', 'elite']) { const d = R.enemyDraw[n][k]; if (d.stream.count) { inst += d.stream.count; tri += d.ni / 3 * d.stream.count; calls++; } }
    T.inst += inst; T.tri += tri; T.calls += calls;
    const per = []; for (const n in R.enemyDraw) { const d = R.enemyDraw[n].normal; if (d.stream.count) per.push([n, Math.round(d.ni / 3), d.stream.count, Math.round(d.ni / 3 * d.stream.count / 1000)]); }
    window.__per = per.sort((a, b) => b[3] - a[3]).slice(0, 12).map(x => `${x[0]}:${x[1]}x${x[2]}=${x[3]}k`).join(' ');
    const SK = window.__skip || {};
    if (SK.walls) for (const n of ['cwall0', 'cwall1', 'cwall2']) if (R.enemyDraw[n]) R.enemyDraw[n].normal.stream.count = 0;
    if (SK.props) for (const n in R.enemyDraw) if (!/man$|mole|spider|bat|goblin|ogre|golem/.test(n)) R.enemyDraw[n].normal.stream.count = 0;
    if (SK.torch) R.frame.torches.fill(0);
    const hk = SCENE.hero; if (SK.hero) SCENE.hero = null;
    const t0 = performance.now(); draw.call(R); SCENE.hero = hk; const t1 = performance.now(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); T.draw += t1 - t0; T.gpu += performance.now() - t1; T.n++;
  };
  const rf = window.renderFrame; window.renderFrame = function () { const t0 = performance.now(); const e = R.drawScene; let tEmit; R.drawScene = function () { tEmit = performance.now() - t0; return e.call(R); }; try { rf(); } finally { R.drawScene = e; } T.emit += tEmit; };
  window.__measureAll = (n, label) => [null].map(k => { window.__skip = k ? { [k]: true } : {}; return __measure(n, label + (k ? ' -' + k : '')); }).join('\n');
  window.__measure = (n, label) => {
    for (const k in T) T[k] = 0;
    const t0 = performance.now();
    __frames(n, 1 / 60, true);
    const tot = (performance.now() - t0) / n, r = x => +(x / T.n).toFixed(1);
    const h = G.hero.out, c = R.cam.pos, dist = h ? Math.hypot(h.boundC[0] - c[0], h.boundC[1] - c[1], h.boundC[2] - c[2]) : 1;
    const rp = h ? h.boundR / (dist * Math.tan(R.cam.fovY / 2)) * (R.cssH / 2) : 0, cover = Math.PI * rp * rp / (R.cssW * R.cssH);
    return `${label.padEnd(12)} hero ${(cover * 100).toFixed(1)}% of screen (r ${rp.toFixed(0)}px, ${h ? h.count : 0} shapes) [${G.state} ${G.run && G.run.cave ? CV.phase : ''}] frame ${tot.toFixed(1)} ms | update ${r(T.upd)} build ${r(T.emit)} submit ${r(T.draw)} gpu ${r(T.gpu)} post ${r(T.post)} | ${r(T.inst)} meshes, ${(T.tri / T.n / 1000).toFixed(0)}k tris, ${r(T.calls)} draw calls | ${R.w}x${R.h}\n    ${window.__per}`;
  };
});
const out = []; const _push = out.push.bind(out); out.push = l => { console.log(l); return _push(l); };
// a normal arena frame (chapter 20, a crowd about)
out.push(await page.evaluate(n => { const run = G.run; run.events = []; const ty = Object.keys(ENEMY_TYPES)[0]; for (let i = 0; i < 40; i++) spawnEnemy(ty, rand(-12, 12), rand(-12, 12)); __frames(60); return __measureAll(n, 'arena'); }, N).catch(e => 'arena: ' + e.message));
// the cave: walk to the first fight, then measure
await page.evaluate(() => {
  window.__cvRun = (maxF, cond) => { for (let f = 0; f < maxF; f++) { if (CV.phase === 'fork') { INPUT.mx = R.cssW - 80; INPUT.my = R.cssH / 2; CV.forkClick = true; } __frames(1); if (cond()) return true; } return false; };
  caveEnter();
});
await page.evaluate(() => __cvRun(60 * 120, () => CV.phase === 'fight' && CV.room && CV.room.foes && CV.room.covers.every(c => cvDropY(c) < 0.05) && CV.room.foes.length > 2));
out.push(await page.evaluate(n => __measureAll(n, 'cave room'), N)); await snap('room');
out.push(await page.evaluate(() => { INPUT.mx = R.cssW / 2; INPUT.my = R.cssH / 2; CV.clickT = 1; return __measure(10, 'room+shoot'); }));
// the walk between rooms
await page.evaluate(() => { for (let i = 0; i < 600 && CV.phase !== 'walk'; i++) { for (const f of (CV.room ? CV.room.foes : [])) { if (!f.dying) cvHurtFoe(f, 1e5, false); } __frames(1); } });
out.push(await page.evaluate(n => __measureAll(n, 'cave walk'), N)); await snap('walk');
// the Bagger
await page.evaluate(() => { const P = CV.pieces; let g = 0; while (CV.phase !== 'bossintro' && CV.phase !== 'boss' && g++ < 60 * 900) { if (CV.room && CV.room.foes) for (const f of CV.room.foes) if (!f.dying) cvHurtFoe(f, 1e5, false); if (CV.phase === 'fork') { INPUT.mx = R.cssW - 80; CV.forkClick = true; } __frames(1); } __frames(60 * 6); });
out.push(await page.evaluate(n => __measureAll(n, 'bagger'), N)); await snap('bagger');

console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
