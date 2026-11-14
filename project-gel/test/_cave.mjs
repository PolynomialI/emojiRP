// chapter 20 end to end: the crater (its cave arrow), the rooms (rocks dropping in, the new crowd), the fork and
// the Bagger (its four stages from four sides, its fall). A bot aims at the nearest foe's head (or the Bagger's heart)
// and clicks; god mode keeps it alive. BR=L|R picks the way at the fork; SHOTS=0 skips screenshots.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), BR = process.env.BR || 'R', SHOTS = process.env.SHOTS !== '0';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
page.setDefaultTimeout(3600000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { G.save.chapter = CHAPTER_COUNT; G.save.selected = 20; beginChapter(20); });
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 500 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 900000, polling: 1000 });
await page.evaluate(() => { __manual(); });
await page.waitForTimeout(200);
const shot = async n => { if (!SHOTS) return; await page.evaluate(() => __frames(1, 1 / 60, true)); await page.screenshot({ path: path.join(dir, 'shots', 'cave-' + n + '.png') }); };
// the crater: open the cave, walk away from it so the edge arrow shows, then toward it
await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; const run = G.run; run.events = []; run.invuln = 1e9; run.enemies.length = 0; run.t = CRATER.open + 1; G.hero.pos[0] = 0; G.hero.pos[2] = ARENA.hd - 12; __frames(30, 1 / 60, true); });
await shot('crater-far');
await page.evaluate(() => { G.hero.pos[2] = -ARENA.hd + 9; G.run.enemies.length = 0; __frames(30, 1 / 60, true); });
await shot('crater-near');
// the bot, in the page: steps frames until a condition holds (or a frame limit), aiming and clicking as it goes
await page.evaluate(([BR]) => {
  window.__cv = { log: [], last: '' };
  const aimAt = w => { const p = [0, 0]; if (R.project(w[0], w[1], w[2], p)) { INPUT.mx = p[0]; INPUT.my = p[1]; return true; } return false; };
  window.__cvStep = (maxF, cond) => {
    for (let f = 0; f < maxF; f++) {
      if (!CV || G.state === 'results') return 'end';
      if (CV.phase === 'fork') { INPUT.mx = BR === 'L' ? 80 : R.cssW - 80; INPUT.my = R.cssH / 2; CV.forkClick = true; }
      if (CV.phase === 'fight' || CV.phase === 'boss') {
        const Rm = CV.room;
        let target = null;
        if (CV.phase === 'boss' && CV.boss && !CV.boss.moving) target = cvW3(Rm.F, ...bagHeart(CV.boss));
        else if (Rm && Rm.foes) {
          const foes = Rm.foes.filter(o => !o.dying && o.state !== 'burst' && (o.sink || 0) < 0.6);
          foes.sort((a, b) => b.lz - a.lz);
          if (foes[0]) { const o = foes[0], s = o.T.scale, base = (o.y || 0) - (o.sink || 0) * 0.95 * s; target = cvW3(Rm.F, o.lx, o.T.fly ? base : base + s * (o.T.head || (o.type === 'mole' ? 0.85 : 0.975)), o.lz); }
        }
        if (target && aimAt(target) && (G.frameN = (G.frameN || 0) + 1) % 4 === 0) caveClick();
      }
      __frames(1);
      const key = CV.phase + (CV.room && CV.room.P ? ':' + CV.room.P.id : '') + (CV.boss ? ':stage' + (CV.boss.stage || 1) : '');
      if (key !== __cv.last) { __cv.last = key; __cv.log.push(`${G.run.t.toFixed(1)} ${key}`); }
      if (CV.room && CV.room.foes) for (const o of CV.room.foes) { __cv.types = __cv.types || {}; __cv.types[o.type] = (__cv.types[o.type] || 0) + 1; }
      if (cond && cond()) return 'cond';
    }
    return 'limit';
  };
  caveEnter();
}, [BR]);
const step = (maxF, cond) => page.evaluate(([m, c]) => __cvStep(m, c ? new Function('return (' + c + ')') : null), [maxF, cond]);
await step(60 * 60, "CV.phase === 'fight' && CV.room.covers.some(c => c.dropT > 0.15 && c.dropT < 0.4)");
await shot('room-drop');
await step(60 * 4, null); await shot('room-fight');
await step(60 * 600, "CV.phase === 'bossintro'"); await step(60 * 4, null); await shot('boss-stage1');
for (const s of [2, 3, 4]) { await step(60 * 600, `CV.boss && CV.boss.stage === ${s} && !CV.boss.moving`); await step(60 * 3, null); await shot('boss-stage' + s); }
await step(60 * 600, "CV.phase === 'won'"); await step(60 * 1.5, null); await shot('boss-fall1');
await step(60 * 2.5, null); await shot('boss-fall2');
await step(60 * 20, "G.state === 'results'");
const res = await page.evaluate(() => ({ log: __cv.log, types: __cv.types, end: G.state, won: G.run && G.run.won, hp: G.run && Math.round(G.run.hp) }));
console.log('foe types seen:', JSON.stringify(res.types));
console.log(res.log.join('\n'));
console.log(JSON.stringify({ end: res.end, won: res.won, hp: res.hp }));
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
