// what a menu frame costs on the main thread (Chrome's own counters: script, style, layout, paint) over a few
// seconds of real frames, home vs gear (a full inventory: 60 items, some fusable, a few mythic), and how much of
// the GPU frame the blob takes there (SwiftShader, readPixels-synced: compare, don't read the totals)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), SECS = +(process.env.SECS || 4);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 760 } });
const page = await ctx.newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + (process.env.HTML || path.join(dir, '..', 'dist', 'project-gel.html')));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 900000, polling: 1000 });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Performance.enable');
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const measure = async label => {
  await page.waitForTimeout(800);
  const f0 = await page.evaluate(() => R.frame.time), a = await metrics();
  await page.waitForTimeout(SECS * 1000);
  const f1 = await page.evaluate(() => R.frame.time), b = await metrics();
  const d = k => (b[k] - a[k]) * 1000 / SECS;
  console.log(`${label.padEnd(10)} per second of menu: script ${d('ScriptDuration').toFixed(0)} ms, style ${d('RecalcStyleDuration').toFixed(0)} ms (${((b.RecalcStyleCount - a.RecalcStyleCount) / SECS).toFixed(0)}x), layout ${d('LayoutDuration').toFixed(0)} ms (${((b.LayoutCount - a.LayoutCount) / SECS).toFixed(0)}x), tasks ${d('TaskDuration').toFixed(0)} ms | ${((f1 - f0) / SECS * 60).toFixed(0)} game-seconds/60`);
};
await page.evaluate(() => { const g = G.save.gear; for (const id of Object.keys(ARTIFACTS)) for (let r = 0; r <= 5; r++) g.items[artKey(id, r)] = r < 3 ? 3 : 1; g.eq = { weapon: artKey('sword', 4), armor: artKey('plate', 5), ring: artKey('goldRing', 3), necklace: artKey('moon', 4) }; G.save.coins = 99999; G.save.scrolls = 5; saveGame(); });
await measure('home');
await page.evaluate(() => UI.openTab('gear'));
await measure('gear');
// the GPU side in the gear menu: the frame with and without the blob, and with the blob's gear hidden
const gpu = await page.evaluate(() => {
  const t = () => { const t0 = performance.now(); for (let i = 0; i < 6; i++) { renderFrame(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); } return (performance.now() - t0) / 6; };
  const full = t(), keep = SCENE.hero; const rf = window.renderFrame;
  const noHero = (() => { const t0 = performance.now(); for (let i = 0; i < 6; i++) { R.resetStreams(); SCENE.hero = null; SCENE.heroShadow = null; FX.emit(); R.drawScene(); R.post(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4)); } return (performance.now() - t0) / 6; })();
  const h = G.hero.out;
  return { full: +full.toFixed(1), noHero: +noHero.toFixed(1), shapes: h.count, size: `${R.w}x${R.h}`, ratio: PERF.ratio, msaa: R.settings.msaa };
});
console.log('gear GPU (SwiftShader ms a frame):', JSON.stringify(gpu));
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
