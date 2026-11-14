// a simple autopilot plays whole ocean chapters (CHS=1,5): it sails in wide circles ramming what it meets,
// swerves hard to shake off boarders, steers clear of marked impact circles and takes the first card each
// level-up. Logs the run every 30 s and how it ended. NOREVIVE=1 skips the revive.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const CHS = (process.env.CHS || '1').split(',').map(Number);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
page.setDefaultTimeout(3600000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
for (const ch of CHS) {
  await page.evaluate(ch => { __auto = true; G.save.sea.chapter = 10; UI.homePage = 'sea'; UI.refreshHome(); beginSeaChapter(ch); }, ch);
  await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 3600000, polling: 500 });
  await page.waitForFunction(ch => [...MOUNT_MESHES, ...SHIP_MESHES, 'pcapt', ...bossMeshes(SEA_CHAPTERS[ch - 1].boss)].every(m => R.enemyDraw[m]), ch, { timeout: 3600000, polling: 1000 });
  await page.evaluate(() => { __manual(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); });
  const res = await page.evaluate(([noRevive, cap]) => {
    const run = G.run, S = INPUT.stick, log = [];
    let lastLog = 0, minHp = 1;
    const steer = () => {
      const sh = OC.ship, boarders = run.enemies.filter(e => e.grab && !e.dying).length;
      let want = sh.yaw + (boarders >= 2 ? 1.7 : 0.45);
      let fx = 0, fz = 0;
      for (const h of OC.hz) { if (h.k === 'ball' || h.k === 'ink') continue; const tx = h.tx ?? h.x, tz = h.tz ?? h.z, r = (h.r || 1.5) + 2.5, dx = sh.x - tx, dz = sh.z - tz, d = Math.hypot(dx, dz) || 0.01; if (d < r) { fx += dx / d * (r - d); fz += dz / d * (r - d); } }
      if (run.tele) for (const t of run.tele) { const dx = sh.x - t.x, dz = sh.z - t.z, d = Math.hypot(dx, dz) || 0.01; if (d < 6) { fx += -Math.cos(t.rot) * 2; fz += Math.sin(t.rot) * 2; } }
      if (fx || fz) want = Math.atan2(fx, fz);
      S.active = true; S.ox = 0; S.oy = 0; S.x = Math.sin(want) * 60; S.y = Math.cos(want) * 60;
    };
    for (let f = 0; f < 60 * cap && G.state !== 'results'; f++) {
      if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); }
      else if (G.state === 'chest') { UI.closeChest(); }
      else if (G.state === 'revive') { if (noRevive) finishRun(false); else reviveHero(); }
      if (G.state === 'run') steer();
      __frames(1);
      minHp = Math.min(minHp, run.hp / run.maxHp);
      if (run.t - lastLog >= 30) { lastLog = run.t; log.push(`t${Math.round(run.t)} hp${Math.round(run.hp / run.maxHp * 100)}% lv${run.level} ship:${shipDef().name} foes:${run.enemies.length} kills:${run.kills}${run.bosses.length ? ' boss:' + Math.round(run.bosses.reduce((a, b) => a + Math.max(0, b.hp), 0) / run.bossTotalHp * 100) + '%' : ''} slots:${run.slots.map(s => s.id + s.lvl).join(' ')}`); }
    }
    S.active = false;
    return { log, end: G.state, won: run.won, t: Math.round(run.t), revived: run.revived, minHp: +minHp.toFixed(2), level: run.level, kills: run.kills };
  }, [!!process.env.NOREVIVE, +(process.env.CAP || 400)]);
  console.log(`--- ocean ${ch}`); for (const l of res.log) console.log(l); delete res.log; console.log(JSON.stringify(res));
  await page.evaluate(() => { if (G.state !== 'results') finishRun(false); goHome(); __auto = true; requestAnimationFrame(loop); });
}
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
