// run: node test/check-rush.mjs
// Boss Rush: open to everyone from a fresh save; starts with free picks; every chapter boss comes
// in turn (each fights for a few seconds against the walking bot, then is popped), with an intro card,
// healing and picks in between; the full clear ends in CHAMPION with a best and a time; a loss keeps
// the best count.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
page.setDefaultTimeout(300000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', process.env.HTML || 'dist/project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 300000, polling: 1000 });
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };

let s = await page.evaluate(() => ({ unlocked: rushUnlocked(), hidden: document.getElementById('btnRush').hidden }));
check(s.unlocked && !s.hidden, 'open and shown on a fresh save');

await page.click('#btnRush');
await page.waitForFunction(() => G.state === 'run' || G.state === 'levelup', null, { timeout: 60000, polling: 100 });
s = await page.evaluate(() => ({ rush: G.run.rush, level: G.run.level, pending: G.run.pending, ev: G.run.events.map(e => e.kind + ':' + e.ids) }));
check(s.rush && s.pending === 8 && s.level === 9 && s.ev[0] === 'eboss:stomper', 'starts with 8 free picks and the first boss queued: ' + JSON.stringify(s));

await page.evaluate(() => __manual());
await page.waitForTimeout(300);
// each boss: wait for it, let it fight the bot for three seconds, check the card, then pop it
const res = await page.evaluate(() => {
  window.readInput = () => __botInput(); __bot.on = true;
  const run = G.run, log = [];
  const step = n => { for (let i = 0; i < n; i++) { if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } if (G.state === 'chest') UI.closeChest(); run.invuln = 1; __frames(1); } };
  for (let k = 0; k < CHAPTER_BOSSES.length; k++) {
    // the card is shown on a real-time timer, so note it whenever it is up while the boss arrives and fights
    let f = 0, card = '';
    const cards = document.getElementById('bossCards');
    const look = () => { if (!card && cards.classList.contains('show')) card = cards.textContent.replace(/\s+/g, ' ').trim().slice(0, 40); };
    while (!(run.bosses.length && run.bosses.every(b => b.ai.state !== 'enter' && b.ai.state !== 'intro')) && f++ < 1500) { step(1); look(); }
    for (let i = 0; i < 180; i++) { step(1); look(); }
    const levelBefore = run.level;
    run.hp = run.maxHp * 0.3;
    const types = run.bosses.map(b => b.type);
    for (const b of run.bosses) if (!b.dying) { b.hp = 0; killEnemy(b); }
    step(2);
    log.push({ k: run.rushK, types, waited: f, card, healed: +(run.hp / run.maxHp).toFixed(2), picks: run.level - levelBefore, state: G.state });
    if (G.state !== 'run' && G.state !== 'levelup' && G.state !== 'chest' && G.state !== 'victory') break;
  }
  for (let i = 0; i < 400 && G.state !== 'results'; i++) step(1);
  return { log, state: G.state, best: G.save.rushBest, time: G.save.rushTime, title: document.getElementById('resTitle')?.textContent, reward: run.reward, scrolls: run.scrolls };
});
for (const l of res.log) console.log('   ', JSON.stringify(l));
const order = res.log.map(l => l.types[0]).join(',');
check(res.log.length === 15 && order === 'stomper,sandworm,wreckbot,bigbounce,jellyqueen,yeti,magma,hydra,crab,outlaw,pumpking,geode,storm,jack,kraken', 'every chapter boss in order');
check(res.log.slice(0, -1).every(l => l.picks === 3 && l.healed > 0.6), 'between bosses: 3 picks and 35% health back');
check(res.log.every(l => l.card), 'an intro card for every boss');
check(res.state === 'results' && res.best === 15 && res.time > 0 && /CHAMPION/.test(res.title || ''), `full clear: ${res.title}, best ${res.best}, time ${res.time}, reward ${res.reward}`);

// a losing rush: three bosses, then the hero melts; the best count stays at 15, the run reports 3
await page.evaluate(() => { __frames(1); });
await page.click('#btnContinue');
await page.waitForFunction(() => G.state === 'home', null, { timeout: 60000, polling: 100 });
await page.click('#btnRush');
await page.waitForFunction(() => G.state === 'run' || G.state === 'levelup', null, { timeout: 60000, polling: 100 });
const lose = await page.evaluate(() => {
  const run = G.run;
  const step = n => { for (let i = 0; i < n; i++) { if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } if (G.state === 'chest') UI.closeChest(); if (G.state === 'revive') document.getElementById('btnGiveUp')?.click(); __frames(1); } };
  for (let k = 0; k < 3; k++) {
    let f = 0;
    while (!(run.bosses.length && run.bosses.every(b => b.ai.state !== 'enter' && b.ai.state !== 'intro')) && f++ < 1500) { run.invuln = 1; step(1); }
    for (const b of run.bosses) if (!b.dying) { b.hp = 0; killEnemy(b); }
    run.invuln = 1; step(2);
  }
  step(5);
  run.invuln = 0; run.revived = true; run.hp = 1;
  const states = [G.state];
  for (let i = 0; i < 900 && G.state !== 'results'; i++) { run.invuln = 0; if (G.state === 'run' && run.hp > 0) hurtHero(1e6, G.hero.pos[0] + 1, G.hero.pos[2]); step(1); if (states[states.length - 1] !== G.state) states.push(G.state); }
  return { state: G.state, states, k: run.rushK, hp: run.hp, best: G.save.rushBest, title: document.getElementById('resTitle')?.textContent };
});
check(lose.state === 'results' && lose.k === 3 && lose.best === 15 && !/CHAMPION/.test(lose.title), `a lost rush after 3 bosses: ${lose.title}, best stays ${lose.best} ` + JSON.stringify(lose));
await page.evaluate(() => { __frames(1, 1 / 60, true); });
await page.screenshot({ path: path.join(dir, 'shots', 'rush-results.png') });
check(!errs.length, 'no page errors ' + (errs.length ? JSON.stringify(errs.slice(0, 4)) : ''));
console.log(fails.length ? `${fails.length} FAILED` : 'all passed');
await browser.close();
process.exit(fails.length ? 1 : 0);
