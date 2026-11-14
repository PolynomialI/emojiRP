// Stage B: enemy cap, Goo Snack, boss immunity and weakness, the new passives, chests without forced evolutions
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
page.setDefaultTimeout(600000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { G.save.chapter = 20; beginChapter(3); });
await page.waitForFunction(() => G.state === 'run', null, { timeout: 300000, polling: 200 });
await page.waitForFunction(() => bossMeshes('wreckbot').every(m => R.enemyDraw[m]), null, { timeout: 600000, polling: 500 });
await page.evaluate(() => __manual()); await page.waitForTimeout(200);
await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
let r = await page.evaluate(() => {
  const run = G.run; run.events = []; run.invuln = 1e9;
  startBoss(['wreckbot']); for (let i = 0; i < 120; i++) __frames(1);
  const b = run.bosses[0]; b.hp = b.maxHp;
  let h0 = b.hp; DMG_SRC = 'laser'; hurtEnemy(b, 100); const laser = h0 - b.hp;
  h0 = b.hp; DMG_SRC = 'ball'; hurtEnemy(b, 100); const ball = h0 - b.hp;
  h0 = b.hp; DMG_SRC = 'wave'; hurtEnemy(b, 100); const wave = h0 - b.hp;
  DMG_SRC = null;
  return { laser, ball: +ball.toFixed(1), wave: +wave.toFixed(1), immuneText: G.numbers.some(n => n.v === 'IMMUNE') };
});
ok(r.laser === 0 && Math.abs(r.wave / r.ball - 1.8) < 0.05 && r.immuneText, 'Wrecking Bot: immune to Laser, weak to Goo Wave ' + JSON.stringify(r));
r = await page.evaluate(() => ({ cap: MAX_ALIVE, passives: ['crit', 'leech', 'dodge', 'second'].every(k => PASSIVES[k] && ICONS.map['passive-' + k]), power: [SKILLS.wave.levels[9].dmg, SKILLS.laser.levels[9].dmg, SKILLS.bouncy.levels[9].dmg] }));
ok(r.cap === 300 && r.passives, 'cap 300, four new passives with icons ' + JSON.stringify(r));
// everything maxed: a snack on even levels only
r = await page.evaluate(() => {
  const run = G.run; run.bosses = []; run.bossStarted = false; run.enemies = [];
  run.slots = [];
  for (const id of ['ball', 'fists', 'grenade', 'missile']) { const s = addOrLevel(id); s.lvl = maxLevel(id); }
  for (const id of ['thick', 'regen', 'speed', 'magnet']) { const s = addOrLevel(id); s.lvl = maxLevel(id); }
  const out = [];
  for (const L of [10, 11, 12, 13]) { run.level = L; out.push(rollChoices().map(c => c.id).join('') || '-'); }
  return out;
});
ok(r.join(',') === 'snack,-,snack,-', 'Goo Snack every other level when maxed: ' + r.join(','));
// a chest with an evolution ready rarely evolves it
r = await page.evaluate(() => {
  const run = G.run; let evo = 0; run.slots = run.slots.filter(s => s.id !== 'thick'); const m = addOrLevel('multishot'); m.lvl = maxLevel('multishot');
  for (let i = 0; i < 400; i++) { run.chestQueued = 1; UI.openChest(); if (UI.chestEvo) evo++; G.state = 'run'; }
  return { evo, of: 400, ready: evolvable().length };
});
ok(r.ready > 0 && r.evo > 10 && r.evo < 100, 'chests evolve only now and then (about 1 in 8) ' + JSON.stringify(r));
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
