// run: node test/check-dash.mjs
// press Space mid-run and check the dash: distance covered, invulnerability, cooldown, the button
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
await page.evaluate(() => { __manual(); __frames(3, 1 / 60, true); });
await page.click('#btnPlay');
await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
await page.evaluate(() => { G.run.events.length = 0; G.run.spawnAcc = -1e9; window.readInput = () => { G.input.x = 1; G.input.z = 0; }; for (let i = 0; i < 30; i++) __frames(1); });
const x0 = await page.evaluate(() => G.hero.pos[0]);
await page.keyboard.press('Space');
const r = await page.evaluate(x0 => { const inv = G.run.invuln, dashing = !!G.run.dash; for (let i = 0; i < 6; i++) __frames(1); __frames(1, 1 / 60, true); return { dashing, inv, moved: +(G.hero.pos[0] - x0).toFixed(2), cd: +G.run.dashCd.toFixed(2) }; }, x0);
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(dir, 'shots', 'dash.png') });
// a second press during cooldown does nothing; the button works after the cooldown
const r2 = await page.evaluate(() => { const ok = tryDash(); for (let i = 0; i < 200; i++) __frames(1); return { duringCd: ok, cdAfter: G.run.dashCd }; });
await page.click('#btnDash');
const r3 = await page.evaluate(() => !!G.run.dash);
console.log(JSON.stringify({ ...r, ...r2, buttonDash: r3 }), errs.length ? errs : 'no errors');
await browser.close();
