import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const url = 'file://' + path.join(dir, 'visual.html');
const shots = path.join(dir, 'shots');
import fs from 'node:fs'; fs.mkdirSync(shots, { recursive: true });
const errors = [];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
page.setDefaultTimeout(240000);
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
await page.goto(url);
await page.waitForFunction(() => window.TEST && window.TEST.ready, null, { timeout: 60000 }).catch(e => errors.push('not ready: ' + e.message));
if (errors.length) { console.log(errors.join('\n')); await browser.close(); process.exit(1); }
console.log('build ms', await page.evaluate('Math.round(TEST.buildMs)'));
console.log(JSON.stringify(await page.evaluate('TEST.meshStats')));
const args = process.argv.slice(2);
const want = args.length ? args : ['scene', 'close', 'bosses', 'items', 'arenas'];
async function shot(name, setup, frames = 20) {
  const t = Date.now();
  await page.evaluate(`(() => { ${setup}; for (let i = 0; i < ${frames}; i++) TEST.frame(1/60, i === ${frames} - 1); })()`);
  await page.screenshot({ path: path.join(shots, name + '.png') });
  console.log(name, Date.now() - t, 'ms');
}
if (want.includes('scene')) await shot('scene-run', "TEST.mode='scene'; TEST.speed=4.5; TEST.elite=true; TEST.laser=true; hero.auraLevel=2", 40);
if (want.includes('close')) { await shot('close-idle', "TEST.mode='close'; TEST.speed=0; hero.auraLevel=0", 40); await shot('close-run', "TEST.mode='close'; TEST.speed=4.5", 13); }
if (want.includes('punch')) await shot('close-punch', "TEST.mode='close'; TEST.speed=0; hero.setArmCount(4); hero.punch(0, [2.2,0.9,0.5], 2.4, ()=>{}); hero.punch(1, [-2.0,1.0,0.2], 2.4, ()=>{})", 9);
if (want.includes('bosses')) await shot('bosses', "TEST.mode='bosses'", 4);
if (want.includes('items')) await shot('items', "TEST.mode='items'", 2);
if (want.includes('arenas')) for (let i = 1; i < 6; i++) await shot('arena-' + i, `TEST.mode='scene'; applyArena(${i}); TEST.speed=0; hero.auraLevel=0; TEST.laser=false`, 3);
console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
await browser.close();
