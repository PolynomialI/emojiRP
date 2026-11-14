// damage a single power deals in 30 s against a standing crowd of tough dummies, at level 1 and level 10
// (HTML=... to measure another build)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname), IDS = (process.env.IDS || 'buddies,sandstorm,blade,aura').split(',');
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 600 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + (process.env.HTML || path.join(dir, '..', 'dist', 'project-gel.html')));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => beginChapter(2));
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 300 });
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; });
const out = await page.evaluate(ids => {
  const res = [];
  const hurt = window.hurtEnemy; let dealt = 0;
  window.hurtEnemy = function (e, d, ...a) { dealt += d; return hurt.call(this, e, d, ...a); };
  for (const id of ids) for (const lvl of [1, 10]) {
    const run = G.run;
    run.slots.length = 0; run.events = []; run.enemies.length = 0; run.buddies = []; run.storms = []; run.invuln = 1e9; run.pending = 0; run.chestQueued = 0;
    addOrLevel(id); slotOf(id).lvl = lvl; recomputeStats();
    G.hero.pos[0] = 0; G.hero.pos[2] = 0;
    const ty = Object.keys(ENEMY_TYPES)[0];
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, r = 2 + (i % 3) * 1.6; const e = spawnEnemy(ty, Math.cos(a) * r, Math.sin(a) * r); e.hp = e.maxHp = 1e7; e.speed = 0; }
    dealt = 0;
    for (let f = 0; f < 60 * 30; f++) { G.hero.pos[0] = 0; G.hero.pos[2] = 0; for (const e of run.enemies) { e.speed = 0; } if (G.state !== 'run') setState('run'); __frames(1); }
    res.push(`${id.padEnd(9)} lvl ${String(lvl).padStart(2)}: ${Math.round(dealt / 30)} damage a second`);
  }
  return res;
}, IDS);
console.log(out.join('\n'));
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
