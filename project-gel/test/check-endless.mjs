// run: node test/check-endless.mjs
// Endless: the home button, tiers, a boss at 2:00 that doesn't end the run, then the results and best time
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 400000 });
const shot = async n => { await page.evaluate(() => __frames(2, 1 / 60, true)); await page.waitForTimeout(350); await page.screenshot({ path: path.join(dir, 'shots', n + '.png') }); };
const hidden0 = await page.evaluate(() => { __manual(); __installNanCheck(); __frames(3, 1 / 60, true); return document.getElementById('btnEndless').hidden; });
await page.evaluate(() => { G.save.chapter = 6; G.save.cleared[3] = true; G.save.selected = 5; UI.refreshHome(); });
await shot('endless-home');
await page.click('#btnEndless');
await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
const log = await page.evaluate(() => {
  window.readInput = () => __botInput(); __bot.on = true;
  for (const id of ['ball', 'blade', 'aura', 'lightning']) while (lvlOf(id) < 6) addOrLevel(id);
  const out = { endless: G.run.endless, cap: G.run.powerCap, arena: G.run.info.arenaName, tiers: [] };
  for (let i = 0; i < 125 * 60; i++) {
    G.run.invuln = 1;
    if (G.state === 'levelup') { UI.choiceLock = 0; __botPick(); } if (G.state === 'chest') UI.closeChest();
    __frames(1);
    if (out.tiers[out.tiers.length - 1] !== G.run.tier) out.tiers.push(G.run.tier);
  }
  out.boss = G.run.bosses.map(b => b.type).join('+'); out.label = document.getElementById('chapText').textContent;
  return out;
});
await shot('endless-boss');
const after = await page.evaluate(() => {
  for (const b of G.run.bosses) { b.hp = 1; hurtEnemy(b, 1e9); }
  for (let i = 0; i < 120; i++) { G.run.invuln = 1; if (G.state === 'chest') UI.closeChest(); if (G.state === 'levelup') { UI.choiceLock = 0; __botPick(); } __frames(1); }
  return { st: G.state, bossStarted: G.run.bossStarted, bosses: G.run.bosses.length, label: document.getElementById('chapText').textContent, chests: G.run.pickups.filter(p => p.kind === 'chest').length };
});
await shot('endless-after-boss');
// melt, decline the revive, read the results
await page.evaluate(() => { G.run.invuln = 0; G.run.revived = true; hurtHero(1e9, 0, 0); for (let i = 0; i < 120; i++) __frames(1); });
await page.waitForFunction(() => G.state === 'results', null, { timeout: 20000, polling: 100 });
await shot('endless-results');
const res = await page.evaluate(() => ({ title: document.getElementById('resTitle').textContent, eyebrow: document.getElementById('resEyebrow').textContent, br: document.getElementById('resBreak').textContent, best: G.save.endlessBest }));
console.log(JSON.stringify({ hiddenBeforeUnlock: hidden0, log, after, res }), 'NaN', JSON.stringify(await page.evaluate(() => __nan)), errs.length ? errs : 'no errors');
await browser.close();
