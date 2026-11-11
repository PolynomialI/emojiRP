// run: node test/check-goals.mjs [wide|phone]
// Goals: counters from a run, the toast and menu dot when one is reached, claiming (coins, scrolls,
// an exclusive color), the goal colors not being for sale, and screenshots of the Goals screen.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const kind = process.argv[2] || 'wide';
const ctxOpts = {
  wide: { viewport: { width: 1280, height: 720 } },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
}[kind];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext(ctxOpts)).newPage();
page.setDefaultTimeout(120000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', process.env.HTML || 'dist/project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const fails = [];
const check = (ok, what) => { console.log((ok ? 'ok   ' : 'FAIL ') + what); if (!ok) fails.push(what); };

// fresh save: nothing to claim, no dot
let s = await page.evaluate(() => ({ claim: goalsToClaim(), dot: !document.querySelector('.mbtn[data-tab="goals"] .dot').hidden, n: GOALS.length }));
check(s.claim === 0 && !s.dot, `fresh save: nothing to claim (${s.n} goals)`);

// a run: an elite and a boss killed, a gooblin caught, an evolution; the counters land in the save at the end
await page.click('#btnPlay');
await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
s = await page.evaluate(() => {
  const run = G.run;
  run.invuln = 1e9;
  const e = spawnEnemy('stickman', 3, 3); e.elite = true; killEnemy(e);
  const g = spawnEnemy('gooblin', -3, 3); killEnemy(g);
  run.bossKills++; run.evos++; run.level = 27;
  finishRun(true);
  return { st: G.save.stats, state: G.state };
});
check(s.st.elites === 1 && s.st.gooblins === 1 && s.st.bosses === 1 && s.st.evos === 1 && s.st.maxLevel === 27 && s.st.coinsEarned > 0,
  'run counters reach the save: ' + JSON.stringify(s.st));
await page.waitForTimeout(400);
const toast = await page.evaluate(() => document.querySelector('#toast')?.textContent || [...document.querySelectorAll('.toast')].map(t => t.textContent).join(' | '));
check(/🏆/.test(toast), 'results toast announces the achievements reached: ' + toast);
await page.click('#btnContinue');
await page.waitForFunction(() => G.state === 'home', null, { timeout: 60000, polling: 100 });
s = await page.evaluate(() => ({ claim: goalsToClaim(), dot: !document.querySelector('.mbtn[data-tab="goals"] .dot').hidden }));
check(s.claim >= 4 && s.dot, `home shows the dot with ${s.claim} goals to claim`);

// claim one: coins and scrolls are paid, it shows a tick, and it cannot be claimed twice
await page.click('.mbtn[data-tab="goals"]');
s = await page.evaluate(() => {
  const sv = G.save, c0 = sv.coins, g = GOALS.find(x => x.id === 'level1');
  const row = [...document.querySelectorAll('#goalList .goalrow')].find(r => r.querySelector('.nm').textContent === g.name);
  row.querySelector('button').click();
  const c1 = sv.coins;
  UI.claimGoal(g);
  return { paid: c1 - c0, again: sv.coins - c1, claimed: !!sv.goals.claimed.level1, first: document.querySelector('#goalList .goalrow').classList.contains('ready') };
});
check(s.paid === 400 && s.again === 0 && s.claimed, `claim pays once (${s.paid} coins, then ${s.again})`);
check(s.first, 'goals ready to claim are listed first');

// the exclusive color: not for sale on the Blobs screen until its goal is claimed
s = await page.evaluate(() => {
  const sv = G.save;
  sv.coins = 1e6;
  UI.openTab('skins'); UI.blobTab = 'colors'; UI.skinPreview = 'champion'; UI.renderSkins();
  const act = document.getElementById('skinAction');
  const before = { text: act.textContent, disabled: act.disabled };
  UI.skinAction();
  const bought = sv.skins.includes('champion');
  for (let i = 1; i <= 15; i++) sv.cleared[i] = true;
  UI.openTab('goals');
  UI.claimGoal(GOALS.find(x => x.id === 'ch15'));
  return { before, bought, owned: sv.skins.includes('champion'), scrolls: sv.scrolls };
});
check(s.before.disabled && /🏆/.test(s.before.text) && !s.bought, 'a goal color cannot be bought: ' + s.before.text);
check(s.owned, 'claiming Hero of Gel gives the Champion color');

// screenshots of the Goals screen and of the home menu with its six buttons
await page.evaluate(() => { __manual(); });
await page.waitForTimeout(300);
await page.evaluate(() => { __frames(2, 1 / 60, true); });
await page.screenshot({ path: path.join(dir, 'shots', `goals-${kind}.png`) });
await page.evaluate(() => { UI.openTab('home'); __frames(40, 1 / 60, false); __frames(1, 1 / 60, true); });
await page.screenshot({ path: path.join(dir, 'shots', `goals-home-${kind}.png`) });
check(!errs.length, 'no page errors ' + (errs.length ? JSON.stringify(errs.slice(0, 3)) : ''));
console.log(fails.length ? `${fails.length} FAILED` : 'all passed');
await browser.close();
process.exit(fails.length ? 1 : 0);
