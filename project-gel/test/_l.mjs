// this round's ground-game balance: boss and miniboss health and damage (the Hurler spared), fewer spawns, more XP,
// scroll odds, gems from big enemies (green and blue), the powers' numbers. HTML=old build prints the old numbers.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 900, height: 600 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + (process.env.HTML || path.join(dir, '..', 'dist', 'project-gel.html')));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const run = async ch => { await page.evaluate(c => { G.save.chapter = 20; beginChapter(c); }, ch); await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 300 }); await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9; }); };
const end = () => page.evaluate(() => { G.run.events = []; setState('home'); G.run = null; });
const out = {};
await run(6);
out.ch6 = await page.evaluate(() => {
  const run = G.run, r = {};
  // bosses: health against the plain formula
  run.enemies.length = 0; const b = spawnBoss('stomper', 0, -6, {}); r.bossHp = +(b.maxHp / (BOSS_TYPES.stomper.hp * run.info.bossHpMul)).toFixed(3);
  const hb = spawnBoss('hurler', 4, -6, {}); r.hurlerBossHp = +(hb.maxHp / (BOSS_TYPES.hurler.hp * run.info.bossHpMul)).toFixed(3);
  // a creature miniboss (chapter 6): health and damage against the plain formula
  run.enemies.length = 0; spawnMiniboss(0); const m = run.enemies.find(e => e.mini), M = MINIBOSSES[6];
  r.miniHp = +(m.maxHp / (M.hp * run.info.hpMul)).toFixed(3); r.miniDmg = +(m.dmg / (ENEMY_TYPES[M.type].dmg * run.info.dmgMul * 1.6)).toFixed(3);
  // XP: 10 gem points
  run.xp = 0; run.stats.xpMul = 1; const x0 = run.xp; gainXp(10); r.xpFor10 = +(run.xp - x0).toFixed(3);
  r.scrollOdds = +scrollOdds().toFixed(3);
  // gems from a brute (tier 5), an axeman (tier 3), a stickman (tier 1), an elite
  const drops = type => { run.gems.length = 0; const e = spawnEnemy(type, 0, 4, type === 'elite' ? { elite: true } : {}); killEnemy(e); return run.gems.map(g => (g.tier ? 'G' : 'b') + g.value).join(' '); };
  r.gemsBrute = drops('brute'); r.gemsAxe = drops('axe'); r.gemsStick = drops('stickman');
  run.gems.length = 0; { const e = spawnEnemy('brute', 0, 4, { elite: true }); killEnemy(e); r.gemsElite = run.gems.map(g => (g.tier ? 'G' : 'b') + g.value).join(' '); }
  r.regenL1 = (() => { addOrLevel('regen'); return +run.stats.regen.toFixed(4); })();
  r.leechL1 = (() => { addOrLevel('leech'); return +run.stats.leech.toFixed(4); })();
  r.bagHp = BAG.hp;
  return r;
});
await end();
// the chapter-2 Hurler miniboss is spared; the chapter-3 Charger miniboss is cut, its charge too
await run(2);
out.ch2 = await page.evaluate(() => { const run = G.run; run.enemies.length = 0; spawnMiniboss(0); const m = run.enemies.find(e => e.mini); return { hurlerMiniHp: +(m.maxHp / (BOSS_TYPES.hurler.hp * 0.32 * run.info.hpMul)).toFixed(3), hurlerMiniDmg: +(m.dmg / (BOSS_TYPES.hurler.dmg * run.info.dmgMul)).toFixed(3) }; });
await end();
await run(3);
out.ch3 = await page.evaluate(() => {
  const run = G.run; run.enemies.length = 0; run.events = []; spawnMiniboss(0); const m = run.enemies.find(e => e.mini);
  const r = { chargerMiniHp: +(m.maxHp / (BOSS_TYPES.charger.hp * 0.32 * run.info.hpMul)).toFixed(3) };
  // let it charge: its charge contact damage, against the full charge damage (30 x dmgMul)
  let maxC = 0; for (let f = 0; f < 60 * 25; f++) { G.hero.pos[0] = m.x + 6; G.hero.pos[2] = m.z; __frames(1); if (m.ai.state === 'charge') maxC = Math.max(maxC, m.contactDmg); }
  r.chargeDmg = +(maxC / (30 * run.info.dmgMul)).toFixed(3);
  return r;
});
await end();
// spawns: steady spawning over the first 90 s of chapter 1, no events
await run(1);
out.spawnsPerMin = await page.evaluate(() => { const run = G.run; run.events = []; let n = 0; const sm = window.spawnFromMix; window.spawnFromMix = function (...a) { n++; return sm.apply(this, a); }; const t0 = run.t; for (let f = 0; f < 60 * 120; f++) { run.enemies.length = Math.min(run.enemies.length, 5); if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } __frames(1); } window.spawnFromMix = sm; return +(n / (run.t - t0) * 60).toFixed(1); });
console.log(JSON.stringify(out, null, 1));
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
