// each ocean chapter (CHS=1,2,...): its swimmers, an island, the miniboss, every boss attack, the win.
// Screenshots to test/shots/seach-<n>-*.png
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const CHS = (process.env.CHS || '1,2,3,4,5,6,7,8,9,10').split(',').map(Number);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1000, height: 640 } })).newPage();
page.setDefaultTimeout(2400000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 4).join(' ')));
process.on('unhandledRejection', async e => { console.log('FAILED:', e.message.split('\n')[0]); try { console.log('step error:', await page.evaluate(() => window.__err || 'none')); } catch (x) {} console.log(errs.slice(0, 5)); process.exit(1); });
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const log = (...a) => console.log(...a);
const shot = async name => { await page.evaluate(() => __frames(1, 1 / 60, true)); await page.screenshot({ path: path.join(dir, 'shots', `seach-${name}.png`) }); };
for (const ch of CHS) {
  await page.evaluate(ch => { __auto = true; G.save.sea.chapter = 10; G.save.sea.selected = ch; UI.homePage = 'sea'; UI.refreshHome(); prioritizeMeshes(['pcapt', ...bossMeshes(SEA_CHAPTERS[ch - 1].boss)]); beginSeaChapter(ch); }, ch);
  await page.waitForFunction(() => G.state === 'run' && G.run && G.run.sea, null, { timeout: 2400000, polling: 500 });
  await page.waitForFunction(ch => ['pcapt', 'canoe', ...bossMeshes(SEA_CHAPTERS[ch - 1].boss)].every(m => R.enemyDraw[m]), ch, { timeout: 2400000, polling: 1000 });
  await page.evaluate(() => __manual()); await page.waitForTimeout(200);
  await page.evaluate(() => { if (!__rafQ.length) requestAnimationFrame(loop); });
  await page.evaluate(() => {
    const run = G.run;
    window.__step = k => { for (let i = 0; i < k; i++) { try { run.invuln = 1e9; if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } if (G.state === 'chest') UI.closeChest(); __frames(1); } catch (e) { window.__err = window.__err || (e.message + ' | ' + (e.stack || '').split('\n').slice(1, 6).join(' | ')); throw e; } } };
    run.events = [];
    for (const id of ['harpoon', 'gulls']) addOrLevel(id);
  });
  // fifteen seconds of the chapter's crowd, sailing in a slow circle
  const crowd = await page.evaluate(() => { const run = G.run; run.t = 150; const S = INPUT.stick; S.active = true; S.ox = S.oy = 0; for (let i = 0; i < 900; i++) { const a = i / 200; S.x = Math.cos(a) * 60; S.y = Math.sin(a) * 60; __step(1); } S.active = false; const types = {}; for (const e of run.enemies) types[e.type] = (types[e.type] || 0) + 1; return { kills: run.kills, types, storm: +OC.storm.toFixed(2) }; });
  log(ch, 'crowd', JSON.stringify(crowd));
  await shot(`${ch}-crowd`);
  // an island: one with guards or an eruption if there is one near
  const isle = await page.evaluate(() => { const S = OC.ship; let best = null; const rank = I => (ISLE_POSTS[I.kind] || I.kind === 'ivolc' || I.kind === 'ifort' ? 0 : 1000) + Math.hypot(I.x - S.x, I.z - S.z); for (const I of OC.isles) if (!best || rank(I) < rank(best)) best = I; if (!best) return null; S.x = best.x + best.r + 5; S.z = best.z + 3; S.vx = S.vz = S.speed = 0; for (const e of G.run.enemies) { e.hp = 0; killEnemy(e); } let hz = 0; for (let i = 0; i < 420; i++) { __step(1); hz = Math.max(hz, OC.hz.length); } return { kind: best.kind, guards: G.run.enemies.filter(e => e.type === 'pmusket').length, hz }; });
  log(ch, 'isle', JSON.stringify(isle));
  await shot(`${ch}-isle`);
  // the miniboss
  const mini = await page.evaluate(() => { const S = OC.ship; S.x += 30; for (const e of G.run.enemies) { e.hp = 0; killEnemy(e); } __step(30); seaMini(1); const seen = new Set(); for (let i = 0; i < 600; i++) { __step(1); const m = G.run.enemies.find(e => e.mini); if (m) seen.add(m.ai.state); } const m = G.run.enemies.find(e => e.mini); return { name: m && m.name, states: [...seen] }; });
  log(ch, 'mini', JSON.stringify(mini));
  await shot(`${ch}-mini`);
  // the boss, through its whole attack cycle
  const boss = await page.evaluate(() => { for (const e of G.run.enemies) { e.hp = 0; killEnemy(e); } __step(30); seaBossStart(); const seen = new Set(); for (let i = 0; i < 300; i++) { __step(1); seen.add(G.run.bosses[0].ai.state); } return { name: G.run.bosses[0].def.name, states: [...seen], portrait: !!ICONS.map['boss-' + G.run.bosses[0].type] }; });
  log(ch, 'boss', JSON.stringify(boss));
  await shot(`${ch}-boss`);
  const boss2 = await page.evaluate(() => { const seen = new Set(); for (let i = 0; i < 1500; i++) { __step(1); const b = G.run.bosses[0]; seen.add(b.ai.state); if (i === 700) b.hp = b.maxHp * 0.45; } return [...seen]; });
  log(ch, 'boss states', boss2.join(','));
  await shot(`${ch}-boss2`);
  const win = await page.evaluate(() => { const b = G.run.bosses[0]; b.hp = 1; b.hidden = false; hurtEnemy(b, 1e6); for (let i = 0; i < 400 && G.state !== 'results'; i++) __step(1); return { state: G.state, title: $('resTitle').textContent, cleared: !!G.save.sea.cleared[G.run.chapter] }; });
  log(ch, 'win', JSON.stringify(win));
  await page.evaluate(() => { goHome(); __auto = true; requestAnimationFrame(loop); });
}
console.log(errs.length ? errs.slice(0, 8) : 'no errors');
await browser.close();
