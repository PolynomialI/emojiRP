// the Ships tab: not on the ground game's Blobs screen, first on the ocean page's; the arrows try the looks on any
// ship; the paints, sails and flags have 3D pictures. Screenshots to test/shots/M1-*.png
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
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 900000, polling: 1000 });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
const shot = n => page.screenshot({ path: path.join(dir, 'shots', 'M1-' + n + '.png') });
let r = await page.evaluate(() => { G.save.cleared[CHAPTER_COUNT] = true; G.save.coins = 99999; UI.setHomePage('land'); UI.openTab('skins'); return { tab: UI.blobLists().tab, shipsBtn: document.querySelector('#blobTabs [data-bt="ships"]').hidden }; });
ok(r.tab === 'colors' && r.shipsBtn, 'the ground game\'s Blobs screen has no Ships tab ' + JSON.stringify(r));
r = await page.evaluate(() => { UI.blobTab = 'ships'; UI.renderSkins(); return UI.blobLists().tab; });
ok(r === 'colors', 'even asked for, the Ships tab stays away on land: ' + r);
await page.evaluate(() => { UI.openTab('home'); UI.setHomePage('sea'); });
await page.waitForTimeout(500);
r = await page.evaluate(() => { UI.openTab('skins'); return { tab: UI.blobLists().tab, shipsBtn: document.querySelector('#blobTabs [data-bt="ships"]').hidden, view: UI.shipView, name: document.querySelector('.ship-pick b').textContent }; });
ok(r.tab === 'ships' && !r.shipsBtn, 'the ocean page\'s Blobs screen opens on Ships ' + JSON.stringify(r));
await page.waitForTimeout(800); await shot('ships-tab');
r = await page.evaluate(() => { const keys = SHIP_LOOK_KINDS.flatMap(K => K.list.map(it => 'look-' + K.key + '-' + it.id)); return { drawn: keys.filter(k => ICONS.map[k]).length, of: keys.length }; });
ok(r.drawn >= 22, '3D pictures for the paints, sails and flags: ' + JSON.stringify(r));
// the arrows: every ship, painted
const seen = [];
for (let i = 0; i < 10; i++) {
  r = await page.evaluate(i => { UI.shipView = i; UI.shipSel = { key: 'paint', id: 'crimson' }; UI.shipPreview.paint = 'crimson'; UI.renderShipLooks(); return { stage: OC.stage, name: document.querySelector('.ship-pick b').textContent, tint: shipTint(shipDef().id, 'hull').map(v => +v.toFixed(2)) }; }, i);
  seen.push(r);
}
ok(seen.every((s, i) => s.stage === i && s.tint.some(v => v !== 1)), 'the arrows show each of the ten ships, painted: ' + seen.map(s => s.name).join(', '));
await page.evaluate(() => { UI.shipView = 7; UI.renderShipLooks(); }); await page.waitForTimeout(600); await shot('battleship-crimson');
r = await page.evaluate(() => { UI.shipView = 7; UI.shipSel = { key: 'sail', id: 'gold' }; UI.shipPreview.sail = 'gold'; UI.renderShipLooks(); return shipDef().name; });
ok(/Galleon|Ark|Sloop/.test(r), 'picking sails on a ship without them moves to one with sails: ' + r);
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
