// Open the game, go somewhere, optionally do something, step some frames and take a screenshot: the quickest way to
// look at anything. Prints a summary of the game state and any page errors.
//
//   node test/shoot.mjs [where] [options]
//   where:   --home (default) | --tab skins|gear|chapters|goals|settings | --land N | --sea N | --rush | --endless
//   options: --frames 120      game frames to step after arriving (1/60 s each; default 90)
//            --eval "js"       run in the page after arriving, before the frames (G, OC, R, UI... are in scope)
//            --after "js"      run after the frames, just before the screenshot
//            --god             the blob takes no damage (DEV.god)
//            --size 1100x700   window size (default 1100x700)
//            --clip x,y,w,h    screenshot only that part
//            --out name        file name in test/shots (default shoot.png)
//            --save "js"       edit G.save before going anywhere (e.g. "G.save.coins = 1e5")
//            --all-open        every chapter and ocean open (default on)
// Examples:
//   node test/shoot.mjs --sea 20 --god --frames 300 --out city.png
//   node test/shoot.mjs --land 7 --eval "for (let i = 0; i < 80; i++) spawnEnemy('brute', rand(-9, 9), rand(-9, 9))" --frames 60
//   node test/shoot.mjs --tab skins --eval "UI.blobTab = 'trails'; UI.renderSkins()" --out trails.png
// (Software graphics: models take minutes to build on first use; the script waits for what it needs.)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[i + 1]; };
const [W, H] = String(opt('size', '1100x700')).split('x').map(Number);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 180000 });
await page.evaluate(([open, save]) => {
  if (open) { G.save.cleared[CHAPTER_COUNT] = true; G.save.chapter = CHAPTER_COUNT; G.save.sea.chapter = SEA_COUNT; }
  if (save) (0, eval)(save);
}, [opt('all-open', true) !== 'false', opt('save', '')]);
const land = opt('land'), sea = opt('sea'), tab = opt('tab');
if (land || sea || opt('rush') || opt('endless')) {
  await page.evaluate(([l, s, r, e]) => { if (s) beginSeaChapter(+s); else if (r) beginBossRush(); else if (e) beginEndless(); else beginChapter(+l); }, [land, sea, opt('rush'), opt('endless')]);
  await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 1800000, polling: 500 });
} else if (tab === 'settings') await page.evaluate(() => UI.openSettings());
else if (tab) await page.evaluate(t => UI.openTab(t), tab);
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); });
if (opt('god')) await page.evaluate(() => { DEV.god = true; });
const ev = opt('eval'); if (ev) await page.evaluate(code => (0, eval)(code), ev);
await page.evaluate(n => { if (!__rafQ.length) requestAnimationFrame(loop); __frames(n, 1 / 60, false); __frames(1, 1 / 60, true); }, +opt('frames', 90));
const af = opt('after'); if (af) await page.evaluate(code => { (0, eval)(code); __frames(1, 1 / 60, true); }, af);
await page.waitForTimeout(300);
const clip = opt('clip') ? (([x, y, w, h]) => ({ x, y, width: w, height: h }))(String(opt('clip')).split(',').map(Number)) : undefined;
const out = path.join(dir, 'shots', String(opt('out', 'shoot.png')));
await page.screenshot({ path: out, ...(clip ? { clip } : {}) });
console.log(JSON.stringify(await page.evaluate(() => {
  const r = G.run;
  return { state: G.state, mode: r ? (r.sea ? 'sea' : r.rush ? 'rush' : r.endless ? 'endless' : 'land') : 'home', chapter: r && r.chapter, t: r && +r.t.toFixed(1), level: r && r.level,
    hp: r && Math.round(r.hp) + '/' + Math.round(r.maxHp), enemies: r && r.enemies.length, bosses: r && r.bosses.length, slots: r && r.slots.map(s => s.id + s.lvl).join(' '),
    meshes: MESHJOB.done.size + '/' + MESH_ORDER.length };
})));
console.log('screenshot:', out);
console.log(errs.length ? 'ERRORS:\n' + errs.slice(0, 10).join('\n') : 'no errors');
await browser.close();
