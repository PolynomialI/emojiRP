// the "Evolves with" icons on level-up cards (land and sea), and the slot bar at sea (Ship + 5 weapons + 4 passives
// in one row): screenshots plus a DOM check
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
for (const mode of ['land', 'sea']) {
  await page.evaluate(m => { G.save.cleared[CHAPTER_COUNT] = true; G.save.sea.chapter = SEA_COUNT; if (m === 'sea') beginSeaChapter(12); else beginChapter(8); }, mode);
  await page.waitForFunction(m => G.state === 'run' && G.run && !!G.run.sea === (m === 'sea'), mode, { timeout: 900000, polling: 300 });
  await page.evaluate(() => { __manual(); DEV.god = true; G.run.powerCap = 99; });
  const info = await page.evaluate(() => {
    const run = G.run, open = def => !def.sea === !run.sea;
    // fill every skill slot with attacks that evolve, hold one partner passive, then offer a mix of cards
    const sk = Object.keys(EVOLUTIONS).filter(id => SKILLS[id] && open(SKILLS[id]) && !slotOf(id));
    while (run.slots.filter(s => s.kind === 'skill').length < slotLimit('skill') && sk.length) addOrLevel(sk.shift());
    const held = run.slots.filter(s => s.kind === 'skill' && EVOLUTIONS[s.id]);
    if (held[0]) addOrLevel(EVOLUTIONS[held[0].id].with);
    const partner = held[1] && EVOLUTIONS[held[1].id].with;
    run.choices = [{ id: held[0].id }, ...(partner ? [{ id: partner }] : []), { id: EVOLUTIONS[held[0].id].with }].map(c => ({ ...c, kind: SKILLS[c.id] ? 'skill' : 'passive' }));
    UI.renderChoices(); setState('levelup');
    const rows = [...document.querySelectorAll('#luCards .card')].map(b => ({ name: b.querySelector('.nm').textContent, evo: [...b.querySelectorAll('.evo-row img')].map(im => im.alt + (im.classList.contains('held') ? '*' : '')).join(', ') }));
    const boxes = [...document.querySelectorAll('#slots > *')].map(e => e.getBoundingClientRect()).filter(r => r.width > 0);
    return { skills: run.slots.filter(s => s.kind === 'skill').map(s => s.id).join(' '), limit: slotLimit('skill'), rows, slotRows: new Set(boxes.map(r => Math.round(r.top))).size };
  });
  console.log(mode, JSON.stringify(info));
  await page.evaluate(() => __frames(2, 1 / 60, true)); await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(dir, 'shots', `evo-${mode}.png`) });
  await page.evaluate(() => { setState('run'); UI.updateHud && UI.updateHud(); __frames(2, 1 / 60, true); });
  await page.screenshot({ path: path.join(dir, 'shots', `evo-${mode}-hud.png`) });
  await page.evaluate(() => { setState('run'); G.run.hp = -1; finishRun(false); });
  await page.waitForFunction(() => G.state === 'home' || G.state === 'results', null, { timeout: 60000 });
  await page.evaluate(() => { G.state = 'home'; });
}
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
