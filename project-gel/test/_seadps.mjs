// damage a sea weapon deals in 30 s from a pirate sloop lying still among 24 tough swimmers (rings at 3-9 m), at
// level 1 and level 10; IDS=... picks them. Also draws each new one once (screenshots test/shots/seadps-*.png)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), IDS = (process.env.IDS || 'cannon,gulls,shark,net,whirl,storm,kraken,dolphin').split(',');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 600 } })).newPage();
page.setDefaultTimeout(3600000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + (process.env.HTML || path.join(dir, '..', 'dist', 'project-gel.html')));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { G.save.cleared[CHAPTER_COUNT] = true; beginSeaChapter(1); });
await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 600000, polling: 300 });
await page.waitForFunction(() => [...MOUNT_MESHES, 'sloop', 'sloop_rig'].every(m => R.enemyDraw[m]), null, { timeout: 1800000, polling: 1000 });
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; });
const out = [];
for (const id of IDS) for (const lvl of [1, 10]) {
  const r = await page.evaluate(([id, lvl]) => {
    const hurt = window.hurtEnemy; let dealt = 0;
    window.hurtEnemy = function (e, d, ...a) { dealt += d; return hurt.call(this, e, d, ...a); };
    const run = G.run;
    run.slots.length = 0; run.events = []; run.enemies.length = 0; run.invuln = 1e9; run.pending = 0; run.chestQueued = 0;
    addOrLevel('ship'); slotOf('ship').lvl = 3; addOrLevel(id); slotOf(id).lvl = lvl; recomputeStats();
    OC.ship.vx = OC.ship.vz = OC.ship.speed = 0;
    const ty = 'pswim', place = () => { run.enemies.length = 0; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = 3 + (i % 3) * 3; const e = spawnEnemy(ty, OC.ship.x + Math.cos(a) * r, OC.ship.z + Math.sin(a) * r); e.hp = e.maxHp = 1e7; e.speed = 0; } };
    place(); dealt = 0;
    for (let f = 0; f < 60 * 30; f++) { if (G.state !== 'run') setState('run'); for (const e of run.enemies) { e.speed = 0; e.grab = null; } INPUT.keys.clear(); __frames(1); }
    window.hurtEnemy = hurt;
    return Math.round(dealt / 30);
  }, [id, lvl]);
  out.push(`${id.padEnd(8)} lvl ${String(lvl).padStart(2)}: ${r} damage a second`);
  console.log(out[out.length - 1]);
  if (lvl === 10 && ['whirl', 'storm', 'kraken', 'dolphin'].includes(id)) { await page.evaluate(() => { for (let i = 0; i < 40; i++) __frames(1); __frames(1, 1 / 60, true); }); await page.screenshot({ path: path.join(dir, 'shots', `seadps-${id}.png`) }); }
}
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
