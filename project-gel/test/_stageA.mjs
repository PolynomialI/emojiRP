// Stage A: an old save starts over; the Upgrades tab is gone; Gear > Upgrade buys this color's stats; selling;
// restart; specimen. Screenshots to test/shots/A-*.png
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('projectGel.save.v1', JSON.stringify({ v: 1, content: 3, coins: 99999, chapter: 12, selected: 3, cleared: { 1: true }, best: {}, upgrades: { damage: 20, health: 20 }, skins: ['classic', 'lime'], settings: { sound: false, numbers: true, shake: true, haptics: true, quality: 'low' } })); } });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const log = (...a) => console.log(...a);
const ok = (c, m) => log((c ? 'ok   ' : 'FAIL ') + m);
let r = await page.evaluate(() => ({ coins: G.save.coins, ch: G.save.chapter, content: G.save.content, quality: G.save.settings.quality, upTab: !!document.querySelector('[data-tab="upgrades"]') }));
ok(r.coins === 0 && r.ch === 1 && r.content === 4 && r.quality === 'low' && !r.upTab, 'old save starts over (settings kept), no Upgrades tab ' + JSON.stringify(r));
// blob upgrades
await page.evaluate(() => { G.save.coins = 5000; UI.openTab('gear'); });
await page.waitForTimeout(600);
await page.click('#gUpgrade'); await page.waitForTimeout(400);
await page.screenshot({ path: path.join(dir, 'shots', 'A-upgrade.png') });
r = await page.evaluate(() => { const atk0 = gearTotals().atk; document.querySelector('#buList .bu-row button').click(); document.querySelector('#buList .bu-row button').click(); return { atk0, atk1: gearTotals().atk, lvl: G.save.blobUp.classic.dmg, coins: G.save.coins, rows: document.querySelectorAll('#buList .bu-row').length, names: [...document.querySelectorAll('#buList .nm')].map(e => e.textContent) }; });
ok(r.lvl === 2 && r.atk1 > r.atk0 && r.rows === 3, 'classic upgrades: ' + JSON.stringify(r));
r = await page.evaluate(() => { G.save.skins.push('lime'); G.save.skin = 'lime'; UI.renderBlobUp(); return [...document.querySelectorAll('#buList .nm')].map(e => e.textContent); });
ok(r[0] === 'Move speed', 'a speed color upgrades speed first: ' + r.join(', '));
await page.screenshot({ path: path.join(dir, 'shots', 'A-upgrade-lime.png') });
await page.evaluate(() => { G.save.skin = 'classic'; UI.show('blobUp', false); });
// sell
r = await page.evaluate(() => { addArtifact(artKey('sword', 2), 2); UI.renderGear(); const c0 = G.save.coins; $('gSell').click(); document.querySelector('#gearGrid .art').click(); return { gain: G.save.coins - c0, left: G.save.gear.items[artKey('sword', 2)], price: !!document.querySelector('#gearGrid .price') }; });
ok(r.gain === 30 && r.left === 1 && r.price, 'sell a rare sword for 30: ' + JSON.stringify(r));
await page.screenshot({ path: path.join(dir, 'shots', 'A-sell.png') });
await page.evaluate(() => { $('gSell').click(); UI.openTab('home'); });
// restart a run
await page.evaluate(() => { beginChapter(1); });
await page.waitForFunction(() => G.state === 'run', null, { timeout: 120000, polling: 200 });
await page.waitForTimeout(1500);
r = await page.evaluate(() => { const t0 = G.run.t; const old = G.run; pauseGame(); $('btnRestart').click(); $('btnRestartYes').click(); return { t0: +t0.toFixed(1), fresh: G.run !== old }; });
await page.waitForFunction(() => G.state === 'run' && G.run.t < 1, null, { timeout: 120000, polling: 200 });
ok(r.fresh, 'restart starts a new run ' + JSON.stringify(r));
await page.evaluate(() => goHome());
// specimen
await page.keyboard.type('specimen');
await page.waitForTimeout(300);
r = await page.evaluate(() => ({ ch: G.save.chapter, sea: G.save.sea.chapter, skins: G.save.skins.length === SKINS.length, items: Object.keys(G.save.gear.items).filter(k => artParse(k).r === MYTHIC).length, dev: DEV.open }));
ok(r.sea === 10 && r.skins && r.items === 12 && r.dev, 'specimen unlocks everything ' + JSON.stringify(r));
console.log(errs.length ? errs : 'no errors');
await browser.close();
