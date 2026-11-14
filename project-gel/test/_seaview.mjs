// a quick look at an ocean chapter: the ship (STAGE) beside an island with swimmers round it, and its boss.
// CHS=1,6 STAGE=2 TAG=x node test/_seaview.mjs  ->  test/shots/view-<tag>-<ch>.png (and -boss)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const CHS = (process.env.CHS || '1').split(',').map(Number), STAGE = +(process.env.STAGE || 0), TAG = process.env.TAG || 'v', BOSS = process.env.BOSS !== '0';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
page.setDefaultTimeout(2400000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const shot = async name => { await page.evaluate(() => __frames(1, 1 / 60, true)); await page.screenshot({ path: path.join(dir, 'shots', `view-${TAG}-${name}.png`) }); };
for (const ch of CHS) {
  await page.evaluate(([ch, st]) => { __auto = true; G.save.sea.chapter = SEA_COUNT; G.save.sea.selected = ch; UI.homePage = 'sea'; UI.refreshHome(); prioritizeMeshes([SHIPS[st].model, ...bossMeshes(SEA_CHAPTERS[ch - 1].boss)]); beginSeaChapter(ch); }, [ch, STAGE]);
  await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 2400000, polling: 500 });
  await page.waitForFunction(([ch, st, boss]) => { const C = SEA_CHAPTERS[ch - 1]; return [SHIPS[st].model, ...C.isles, ...C.mix.map(m => ENEMY_TYPES[m[0]].model), ...(boss ? bossMeshes(C.boss) : [])].every(m => R.enemyDraw[m]); }, [ch, STAGE, BOSS], { timeout: 2400000, polling: 1000 });
  await page.evaluate(() => __manual()); await page.waitForTimeout(200);
  const info = await page.evaluate(([st]) => {
    if (!__rafQ.length) requestAnimationFrame(loop);
    const run = G.run; run.events = []; run.invuln = 1e9; OC.stage = st;
    __frames(5);
    const S = OC.ship, I = OC.isles.slice().sort((a, b) => Math.hypot(a.x - S.x, a.z - S.z) - Math.hypot(b.x - S.x, b.z - S.z))[0];
    if (I) { S.x = I.x + I.r + 3 + shipDef().len * 0.3; S.z = I.z + 2; }
    S.vx = S.vz = S.speed = 0;
    for (const e of run.enemies) { e.hp = 0; killEnemy(e); }
    __frames(60);
    const mix = SEA_CHAPTERS[run.chapter - 1].mix;
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r = shipDef().len * 0.5 + 2.5 + (i % 3); const e = seaFoe(mix[i % mix.length][0], S.x + Math.sin(a) * r, S.z + Math.cos(a) * r); e.speed = 0.01; }
    __frames(40);
    return { isle: I && I.kind, n: run.enemies.length };
  }, [STAGE]);
  console.log(ch, JSON.stringify(info));
  await shot(`${ch}`);
  if (BOSS) {
    const b = await page.evaluate(() => { for (const e of G.run.enemies) { e.hp = 0; killEnemy(e); } __frames(30); seaBossStart(); const B = G.run.bosses[0]; for (let i = 0; i < 200; i++) { G.run.invuln = 1e9; __frames(1); } const S = OC.ship; B.x = S.x + 7; B.z = S.z - 3; B.ai.state = 'circle'; B.ai.t = 99; __frames(20); return B.def.name; });
    console.log(ch, 'boss', b);
    await shot(`${ch}-boss`);
  }
  await page.evaluate(() => { goHome(); __auto = true; requestAnimationFrame(loop); });
}
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
