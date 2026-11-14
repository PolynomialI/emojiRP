// the new looks are in the Blobs screen: body costumes under Costumes, hats under Hats, each buyable and worn
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1100, height: 700 } })).newPage();
page.setDefaultTimeout(1800000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
let r = await page.evaluate(() => {
  G.save.coins = 1e6; UI.setHomePage('land'); UI.openTab('skins');
  UI.blobTab = 'costumes'; UI.renderSkins(); const cos = [...document.querySelectorAll('#skinGrid .skin span')].map(e => e.textContent);
  UI.blobTab = 'hats'; UI.renderSkins(); const hats = [...document.querySelectorAll('#skinGrid .skin span')].map(e => e.textContent);
  const body = MORE_COSTUMES.filter(c => c.slot === 'hood').map(c => c.name), hat = MORE_COSTUMES.filter(c => c.slot === 'hat').map(c => c.name);
  return { body: body.length, hat: hat.length, missingBody: body.filter(n => !cos.includes(n)), missingHat: hat.filter(n => !hats.includes(n)), totalCostumes: cos.length, totalHats: hats.length };
});
ok(r.body === 16 && r.hat === 12 && !r.missingBody.length && !r.missingHat.length, 'every new look is listed in its tab ' + JSON.stringify(r));
r = await page.evaluate(() => {
  UI.blobTab = 'costumes'; UI.renderSkins();
  const card = [...document.querySelectorAll('#skinGrid .skin')].find(b => b.querySelector('span').textContent === 'Jetpack'); card.click(); UI.skinAction();
  UI.blobTab = 'hats'; UI.renderSkins();
  const hc = [...document.querySelectorAll('#skinGrid .skin')].find(b => b.querySelector('span').textContent === 'Traffic Cone'); hc.click(); UI.skinAction();
  return { costume: G.save.costume, hat: G.save.hat, owned: ['jetpack', 'cone'].every(id => G.save.costumes.includes(id)), shapes: G.hero.out.count };
});
ok(r.costume === 'jetpack' && r.hat === 'cone' && r.owned, 'buy and wear a jetpack and a traffic cone ' + JSON.stringify(r));
await page.waitForTimeout(800); await page.screenshot({ path: path.join(dir, 'shots', 'M3-worn.png') });
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
