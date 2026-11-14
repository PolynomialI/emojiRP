// Stage C: abilities from maxed skills, with HUD buttons and keys 1-5
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
await page.evaluate(() => beginChapter(1));
await page.waitForFunction(() => G.state === 'run', null, { timeout: 300000, polling: 200 });
await page.evaluate(() => __manual()); await page.waitForTimeout(200);
await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
// four maxed ability skills; the card for the level that maxes one names its ability
let r = await page.evaluate(() => {
  const run = G.run; run.events = []; run.invuln = 1e9; run.slots = []; run.xpNext = 1e12;
  const s9 = addOrLevel('mine'); s9.lvl = 9;
  const note = describeChoice({ id: 'mine' }).desc;
  for (const id of ['mine', 'lightning', 'meteor', 'frostnova']) { const s = addOrLevel(id); s.lvl = maxLevel(id); }
  __frames(2);
  const btns = [...document.querySelectorAll('#abilBar .abil')];
  return { note: /Mega Mine/.test(note), btns: btns.map(b => b.dataset.id + ':' + b.querySelector('kbd').textContent), toast: $('toast').textContent, ready: btns.every(b => b.classList.contains('ready')) };
});
ok(r.note && r.btns.join(',') === 'mine:1,lightning:2,meteor:3,frostnova:4' && /New ability/.test(r.toast) && r.ready, 'four ability buttons with keys 1-4 ' + JSON.stringify(r));
// with no enemies around, Storm Call is refused and keeps its charge
r = await page.evaluate(() => { G.run.enemies = []; const fired = useAbility(1); return { fired, cd: abilityCd('lightning'), toast: $('toast').textContent }; });
ok(!r.fired && r.cd === 0 && /No enemies/.test(r.toast), 'no targets: refused, still ready ' + JSON.stringify(r));
// key 1: a Mega Mine; a ring of enemies walks into it
r = await page.evaluate(() => {
  const run = G.run, h = G.hero.pos;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' })); window.dispatchEvent(new KeyboardEvent('keyup', { key: '1' }));
  const mega = run.mines.find(m => m.big), cd = abilityCd('mine');
  const again = useAbility(0);
  __frames(40);
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; spawnEnemy('slime', h[0] + Math.cos(a) * 1.2, h[2] + Math.sin(a) * 1.2); }
  const n0 = run.enemies.length; __frames(10);
  return { mega: !!mega, radius: mega && +mega.radius.toFixed(1), cd, again, gone: !run.mines.some(m => m.big), killed: n0 - run.enemies.filter(e => !e.dying).length, of: n0 };
});
ok(r.mega && r.cd === 45 && !r.again && r.gone && r.killed >= 10, 'key 1: Mega Mine, 45 s cooldown, blows up the crowd ' + JSON.stringify(r));
// keys 2-4 with enemies on screen
r = await page.evaluate(() => {
  const run = G.run, h = G.hero.pos; run.enemies = [];
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; const e = spawnEnemy('slime', h[0] + Math.cos(a) * 4, h[2] + Math.sin(a) * 3); e.hp = e.maxHp = 1e6; }
  const out = {};
  out.storm = useAbility(1); out.queue = slotOf('lightning').st.queue.length;
  out.star = useAbility(2); out.rocks = slotOf('meteor').st.rocks.length;
  out.freeze = useAbility(3); out.frozen = run.enemies.filter(e => e.frozen >= 3.9).length;
  out.cds = ['lightning', 'meteor', 'frostnova'].map(abilityCd);
  __frames(60);
  out.hurt = run.enemies.filter(e => e.hp < e.maxHp).length;
  out.left = +abilityCd('frostnova').toFixed(2); out.btnCd = document.querySelector('#abilBar .abil[data-id="frostnova"] .cdt').textContent;
  return out;
});
ok(r.storm && r.queue === 16 && r.star && r.rocks === 10 && r.freeze && r.frozen === 24 && r.cds.join() === '40,50,60' && r.hurt === 24 && r.left < 59.5 && r.left > 58 && Math.abs(+r.btnCd - r.left) <= 1, 'keys 2-4: Storm Call, Starfall, Deep Freeze ' + JSON.stringify(r));
// Bubble Fortress
r = await page.evaluate(() => {
  const run = G.run; run.pending = 0; run.xp = 0; if (G.state !== 'run') setState('run'); run.slots = run.slots.filter(s => s.id !== 'frostnova');
  const s = addOrLevel('shield'); s.lvl = maxLevel('shield'); __frames(2);
  s.st.hits = 0; run.invuln = 0;
  const st0 = G.state; const fired = useAbility(3);
  return { st0, fired, invuln: run.invuln, hits: s.st.hits, max: skillL(s).hits, btns: document.querySelectorAll('#abilBar .abil').length };
});
ok(r.fired && r.invuln === 4 && r.hits === r.max && r.btns === 4, 'Bubble Fortress: 4 s untouchable, bubble refilled ' + JSON.stringify(r));
// no abilities while paused
r = await page.evaluate(() => { G.run.abil.shield = 0; pauseGame(); const f = useAbility(3); resumeGame(); return f; });
ok(r === false, 'abilities do nothing while paused');
await page.evaluate(() => { G.run.abil = { mine: 30 }; __frames(2); });
await page.screenshot({ path: path.join(dir, '_stageC.png') });
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
