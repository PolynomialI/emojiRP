// every menu at a desktop window (1100x720, scale 1) for checking how well the text fills its boxes (TAG=before|after)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const TAG = process.env.TAG || 'before', W = +(process.env.W || 1100), H = +(process.env.H || 720);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
page.setDefaultTimeout(600000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { for (const id in ARTIFACTS) addArtifact(artKey(id, MYTHIC)); });
await page.waitForTimeout(1500);
const shot = async name => { await page.waitForTimeout(700); await page.screenshot({ path: path.join(dir, 'shots', `menus-${TAG}-${name}.png`) }); };
const ev = (f, a) => page.evaluate(f, a);
await ev(() => { G.save.coins = 12345; UI.refreshHome(); });
for (const tab of ['home', 'gear', 'skins', 'chapters', 'goals']) { await ev(t => UI.openTab(t), tab); await shot(tab); }
await ev(() => { UI.openTab('gear'); UI.openBlobUp(); }); await shot('blobup');
await ev(() => { UI.show('blobUp', false); const k = Object.keys(G.save.gear.items)[0]; if (k) UI.openArtifact(k); }); await shot('artinfo');
await ev(() => { UI.show('artInfo', false); UI.openTab('home'); UI.openSettings(); }); await shot('settings');
await ev(() => { UI.closeSettings(); const sv = G.save; sv.chapter = CHAPTER_COUNT; sv.cleared[CHAPTER_COUNT] = true; sv.sea.chapter = SEA_COUNT; sv.sea.looks = SHIP_LOOK_KINDS.flatMap(K => K.list.map(it => K.key + ':' + it.id)); UI.setHomePage('sea'); }); await shot('home-sea');
await ev(() => { UI.openTab('skins'); const b = [...document.querySelectorAll('#skins button')].find(x => /ship/i.test(x.textContent)); if (b) b.click(); }); await shot('ships');
// a land run: level-up, pause, results
await ev(() => { UI.openTab('home'); UI.setHomePage('land'); beginChapter(1); });
await page.waitForFunction(() => G.state === 'run', null, { timeout: 600000, polling: 500 });
await ev(() => { __manual(); });
await page.waitForTimeout(200);
await ev(() => {
  if (!__rafQ.length) requestAnimationFrame(loop);
  const run = G.run; run.events = []; run.invuln = 1e9;
  for (const id of ['ball', 'fists', 'grenade', 'missile', 'mine']) try { addOrLevel(id); } catch (e) {}
  __frames(5, 1 / 60, true);
  run.choices = rollChoices(); UI.renderChoices(); setState('levelup');
  __frames(30, 1 / 60, true);
});
await shot('levelup');
await ev(() => { setState('run'); pauseGame(); __frames(2, 1 / 60, true); }); await shot('pause');
await ev(() => { UI.openSettings(); }); await shot('settings-run');
await ev(() => { UI.closeSettings(); setState('run'); finishRun(true); __frames(60, 1 / 60, true); }); await shot('results');
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
