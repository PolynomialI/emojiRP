// does anything offer a power that is already at its max level? level-up cards (land, sea, Endless, Boss Rush)
// and the chest's spinning strip, with every owned slot maxed
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
const probe = () => page.evaluate(() => {
  const run = G.run, seen = {};
  for (let i = 0; i < 3000; i++) for (const c of rollChoices()) seen[c.id] = (seen[c.id] || 0) + 1;
  const maxed = run.slots.filter(s => s.lvl >= maxLevel(s.id)).map(s => s.id);
  return { slots: run.slots.map(s => `${s.id}${s.lvl}/${maxLevel(s.id)}`).join(' '), offeredMaxed: Object.keys(seen).filter(id => maxed.includes(id)), offered: Object.keys(seen).join(' ') };
});
for (const mode of ['land', 'sea']) {
  await page.evaluate(m => { G.save.cleared[CHAPTER_COUNT] = true; if (m === 'sea') beginSeaChapter(1); else beginChapter(1); }, mode);
  await page.waitForFunction(m => G.state === 'run' && G.run && !!G.run.sea === (m === 'sea'), mode, { timeout: 600000, polling: 300 });
  await page.evaluate(() => { __manual(); DEV.god = true; G.run.powerCap = 99; });
  // every slot kind full, half of them maxed
  await page.evaluate(() => {
    const run = G.run, open = def => !def.sea === !run.sea;
    const sk = Object.keys(SKILLS).filter(id => open(SKILLS[id]) && !slotOf(id)), ps = Object.keys(PASSIVES).filter(id => open(PASSIVES[id]) && !slotOf(id));
    while (run.slots.filter(s => s.kind === 'skill').length < slotLimit('skill') && sk.length) addOrLevel(sk.shift());
    while (run.slots.filter(s => s.kind === 'passive').length < slotLimit('passive') && ps.length) addOrLevel(ps.shift());
    run.slots.forEach((s, i) => { if (i % 2 === 0) s.lvl = maxLevel(s.id); });
  });
  console.log(mode, 'half maxed:', JSON.stringify(await probe()));
  await page.evaluate(() => { G.run.slots.forEach(s => { s.lvl = maxLevel(s.id); }); });
  console.log(mode, 'all maxed:', JSON.stringify(await probe()));
  // the chest strip with one slot left to level
  const strip = await page.evaluate(() => { const run = G.run; run.slots[0].lvl = maxLevel(run.slots[0].id) - 1; run.chestQueued = 1; UI.openChest(); const keys = [...document.querySelectorAll('#chStrip img')].map(im => Object.keys(ICONS.map).find(k => ICONS.map[k] === im.src)); const maxed = run.slots.filter(s => s.lvl >= maxLevel(s.id)).map(s => s.id); return { results: UI.chestResults, stripMaxed: [...new Set(keys.filter(k => k && maxed.includes(k.replace(/^(skill|passive)-/, ''))))] }; });
  console.log(mode, 'chest:', JSON.stringify(strip));
  await page.evaluate(() => { setState('run'); G.run.hp = -1; finishRun(false); });
  await page.waitForFunction(() => G.state === 'home' || G.state === 'results', null, { timeout: 60000 });
  await page.evaluate(() => { if (G.state === 'results') UI.openTab ? (G.state = 'home') : 0; });
}
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
