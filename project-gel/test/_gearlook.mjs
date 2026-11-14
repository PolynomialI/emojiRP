// every artifact on the blob, up close on the Gear screen, from the front and from a three-quarter view
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), TAG = process.env.TAG || 'after';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
console.log('shape budget', await page.evaluate(() => [HERO_MAXP, gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)]));
await page.evaluate(() => { for (const id in ARTIFACTS) addArtifact(artKey(id, 2)); UI.openTab('gear'); });
await page.waitForTimeout(800);
const sets = [['sword', 'plate', 'goldRing', 'skull'], ['wand', 'vest', 'silverRing', 'moon'], ['bow', 'cloak', 'rubyRing', 'clover']];
for (let i = 0; i < sets.length; i++) {
  await page.evaluate(ids => { const g = G.save.gear; for (const id of ids) g.eq[ARTIFACTS[id].slot] = artKey(id, 2); UI.renderGear(); applySkin(G.save.skin); }, sets[i]);
  for (const [k, yaw] of [['a', 0.35], ['b', -0.9]]) {
    await page.evaluate(yaw => { HOME.yaw = yaw; HOME.spinV = 0; G.hero.yaw = yaw; }, yaw);
    await page.waitForTimeout(1200);
    const st = await page.evaluate(() => G.hero.out.count);
    const r = await page.evaluate(() => { const b = $('gearStage').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
    await page.screenshot({ path: path.join(dir, 'shots', `gearlook-${TAG}-${i}${k}.png`), clip: { x: r[0] + r[2] * 0.15, y: r[1], width: r[2] * 0.7, height: r[3] } });
    console.log(sets[i].join(','), k, 'shapes', st);
  }
}
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
