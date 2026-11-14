// the ocean page with every ocean open: the picker on a late chapter, the biggest ship with its looks
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 760 } })).newPage();
page.setDefaultTimeout(2400000);
const errs = []; page.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { const sv = G.save; sv.cleared[20] = true; sv.sea.chapter = 20; sv.sea.selected = 18; sv.sea.ship = 9; Object.assign(sv.sea, { paint: 'royal', sail: 'gold', flag: 'goo', trail: 'sparkle' }); prioritizeMeshes(['ark', 'ark_rig', 'flag_goo', ...bossMeshes('slevi')]); UI.setHomePage('sea'); UI.refreshHome(); });
await page.waitForFunction(() => ['ark', 'ark_rig', 'flag_goo', ...bossMeshes('slevi')].every(m => R.enemyDraw[m]), null, { timeout: 2400000, polling: 1000 });
await page.waitForTimeout(3000);
const r = await page.evaluate(() => ({ label: $('chLabel').textContent, name: $('chName').textContent, info: $('chInfo').textContent, play: $('btnPlay').textContent }));
console.log(JSON.stringify(r));
await page.screenshot({ path: path.join(dir, 'shots', 'seahome-20.png') });
console.log(errs.length ? errs.slice(0, 4) : 'no errors');
await browser.close();
