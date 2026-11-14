// a tap on a gear item equips it (or swaps it for what was in its slot); a tap on a worn one opens its card
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const ok = (c, m) => console.log((c ? 'ok   ' : 'FAIL ') + m);
// two weapons of different rarity
await page.evaluate(() => { const ids = Object.keys(ARTIFACTS).filter(id => ARTIFACTS[id].slot === 'weapon'); addArtifact(artKey(ids[0], 1)); addArtifact(artKey(ids[0], 3)); G.save.gear.eq.weapon = null; UI.openTab('gear'); });
await page.waitForTimeout(800);
const keys = await page.evaluate(() => [...document.querySelectorAll('#gearGrid .art')].map(b => b.dataset.art));
const tap = async k => { await page.click(`#gearGrid .art[data-art="${k}"]`, { force: true }); await page.waitForTimeout(300); };
await tap(keys[0]);
let st = await page.evaluate(() => ({ eq: G.save.gear.eq, info: !$('artInfo').hidden }));
const slot0 = await page.evaluate(k => artParse(k).def.slot, keys[0]);
ok(st.eq[slot0] === keys[0] && !st.info, `a tap equips ${keys[0]} (no card opened)`);
const other = await page.evaluate(k => { const s = artParse(k).def.slot; return [...document.querySelectorAll('#gearGrid .art')].map(b => b.dataset.art).find(x => x !== k && artParse(x).def.slot === s); }, keys[0]);
if (other) { await tap(other); st = await page.evaluate(() => G.save.gear.eq); ok(st[slot0] === other, `a tap on another ${slot0} swaps it in: ${other}`); }
await tap(other || keys[0]);
ok(await page.evaluate(() => $('artInfo').hidden), 'a left click on the worn item opens nothing');
await page.click(`#gearGrid .art[data-art="${keys[0]}"]`, { button: 'right', force: true }); await page.waitForTimeout(300);
st = await page.evaluate(() => ({ info: !$('artInfo').hidden, eq: G.save.gear.eq, name: $('artName').textContent }));
ok(st.info && st.eq[slot0] === (other || keys[0]), 'a right click opens the card without equipping: ' + st.name);
ok(await page.evaluate(() => { const r = localStorage.getItem(Object.keys(localStorage).find(k => /gel/i.test(k)) || ''); return !!r; }), 'saved');
console.log(errs.length ? errs : 'no page errors');
await browser.close();
