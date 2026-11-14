// the ocean trophies: achievements list them, the hats tab shows them locked, claiming one unlocks it
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 760 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
let r = await page.evaluate(() => {
  document.querySelector('.tab[data-tab="goals"]').click();
  const rows = [...document.querySelectorAll('#goalList .goalrow')].map(x => x.querySelector('.nm').textContent);
  return { n: rows.length, ocean: GOALS.filter(g => g.group === 'ocean').length, has: rows.includes('Ruler of the Waves') };
});
ok(r.ocean === 10 && r.has, 'ten ocean trophy achievements listed ' + JSON.stringify(r));
r = await page.evaluate(() => {
  document.querySelector('.tab[data-tab="skins"]').click();
  UI.blobTab = 'hats'; UI.renderSkins();
  const tiles = [...document.querySelectorAll('#skinGrid .skin')];
  const t = tiles.find(x => x.querySelector('span').textContent === "Neptune's Crown");
  t.click();
  return { locked: t.querySelector('small').textContent, action: $('skinAction').textContent, colors: SKINS.filter(s => ['glowtide', 'abyssal'].includes(s.id)).length };
});
ok(r.locked === '🏆' && /Ruler of the Waves/.test(r.action) && r.colors === 2, 'trophy hat locked behind its achievement; new colors present ' + JSON.stringify(r));
r = await page.evaluate(() => { G.save.sea.cleared[20] = true; const g = GOALS.find(g => g.id === 'sea20'); UI.claimGoal(g); return { owned: G.save.costumes.includes('neptunecrown'), toast: $('toast').textContent }; });
ok(r.owned && /Neptune's Crown/.test(r.toast), 'sinking Neptune and claiming gives the crown ' + JSON.stringify(r));
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
