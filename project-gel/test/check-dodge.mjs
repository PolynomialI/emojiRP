// run: node test/check-dodge.mjs            (CH=11,12 limits chapters; SECS=45 per phase)
// Dodge audit: every chapter's boss fight against the walking test bot, with no skills, so the boss never dies.
// The bot reacts instantly and steers out of every warning, so an attack that keeps hitting it cannot be
// escaped on foot. Prints hits and damage per attack, before and during the boss's rage phase.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const chapters = (process.env.CH || '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15').split(',').map(Number);
const secs = +(process.env.SECS || 45);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 640, height: 360 } })).newPage();
page.setDefaultTimeout(300000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', (process.env.HTML || 'dist/project-gel.html')));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 300000 });
await page.evaluate(() => { __manual(); __installNanCheck(); __frames(3); });
for (const n of chapters) {
  await page.evaluate(n => { G.save.chapter = Math.max(G.save.chapter, n); G.save.selected = n; UI.refreshHome(); }, n);
  await page.click('#btnPlay');
  await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
  const res = await page.evaluate(secs => {
    window.readInput = () => __botInput(); __bot.on = true;
    const run = G.run;
    run.slots.length = 0; run.t = 299; run.events = run.events.filter(e => e.kind === 'boss'); run.enemies.length = 0; run.spawnAcc = -1e9;
    const step = () => { if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } if (G.state === 'chest') UI.closeChest(); __frames(1); };
    for (let i = 0; i < 600 && !(run.bosses.length && run.bosses.every(b => b.ai.state !== 'enter' && b.ai.state !== 'intro')); i++) { run.invuln = 1; step(); }
    // log every hit on the hero by what the bosses were doing at the time
    let log = {};
    if (!window.__origHurt) window.__origHurt = window.hurtHero;
    window.hurtHero = (dmg, fx, fz) => {
      const before = run.hp;
      __origHurt(dmg, fx, fz);
      const lost = before - run.hp;
      run.hp = run.maxHp;
      if (lost <= 0) return;
      let src = null;
      for (const s of run.eShots) if ((s.x === fx && s.z === fz) || (s.tx === fx && s.tz === fz)) { src = 'shot:' + s.kind; break; }
      if (!src) for (const e of run.enemies) if (!e.boss && e.x === fx && e.z === fz) { src = 'minion:' + e.type; break; }
      if (!src) { const b = run.bosses.find(b => b.x === fx && b.z === fz) || run.bosses.find(b => b.ai.state !== 'walk') || run.bosses[0]; src = b.type + ':' + b.ai.state; }
      const L = log[src] = log[src] || [0, 0];
      L[0]++; L[1] += lost;
    };
    const born = new WeakMap();
    const out = {};
    for (const phase of ['calm', 'rage']) {
      log = {};
      for (let f = 0; f < secs * 60 && G.state !== 'results'; f++) {
        for (const b of run.bosses) if (!b.dying) b.hp = b.maxHp * (phase === 'rage' ? 0.4 : 1);
        // minions last four seconds, as if the player's skills were clearing them
        for (const e of run.enemies) if (!e.boss) { if (!born.has(e)) born.set(e, f); }
        run.enemies = run.enemies.filter(e => e.boss || f - born.get(e) < 240 || f < born.get(e));
        step();
      }
      out[phase] = log;
    }
    window.hurtHero = __origHurt;
    return { out, state: G.state, bosses: run.bosses.map(b => b.type), dmgMul: run.info.dmgMul };
  }, secs);
  const fmt = log => { const e = Object.entries(log).sort((a, b) => b[1][1] - a[1][1]); const tot = e.reduce((s, [, v]) => s + v[1], 0); return `${String(Math.round(tot / res.dmgMul)).padStart(4)} dmg  ` + e.map(([k, v]) => `${k} ${v[0]}x`).join(', '); };
  console.log(`ch${String(n).padStart(2)} ${res.bosses.join('+').padEnd(20)} calm ${fmt(res.out.calm)}`);
  console.log(`     ${''.padEnd(20)} rage ${fmt(res.out.rage)}`);
  // back to the home screen for the next chapter
  await page.evaluate(() => { if (G.state === 'run') pauseGame(); });
  await page.click('#btnQuit'); await page.click('#btnQuitYes');
  await page.waitForFunction(() => G.state === 'results', null, { timeout: 60000, polling: 100 });
  await page.click('#btnContinue');
  await page.waitForFunction(() => G.state === 'home', null, { timeout: 60000, polling: 100 });
}
console.log('NaN', JSON.stringify(await page.evaluate(() => __nan)), errs.length ? errs.slice(0, 5) : 'no errors');
await browser.close();
