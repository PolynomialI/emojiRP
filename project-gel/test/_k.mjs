// this round: the chapter-2 Hurler (no back hop, 75% health, smaller boulder circles), the aura's damage, the
// level-up card that reaches max, item paint (card swatches, the blob, the picture, kept in the save)
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
const shot = n => page.screenshot({ path: path.join(dir, 'shots', 'K-' + n + '.png') });
let r = await page.evaluate(() => ({ hp: BOSS_TYPES.hurler.hp, aura: SKILLS.aura.levels.map(l => l.dmg) }));
ok(r.hp === 1650, 'Hurler health 2200 -> ' + r.hp);
ok(r.aura.join() === '5,6,7,9,10,12,14,16,19,23', 'aura damage one less at every level: ' + r.aura.join(' '));
// paint: a robe and a sword, on the blob and in the pictures
await page.evaluate(() => { addArtifact(artKey('cloak', 2), 1); addArtifact(artKey('sword', 3), 1); G.save.gear.eq.armor = artKey('cloak', 2); G.save.gear.eq.weapon = artKey('sword', 3); UI.openTab('gear'); });
await page.waitForTimeout(700);
await page.evaluate(() => UI.openArtifact(artKey('cloak', 2))); await page.waitForTimeout(400); await shot('card-original');
r = await page.evaluate(() => {
  const icon0 = gearIcon('cloak'), pal = () => Array.from(G.hero.out.pal.slice(GEAR_PAL.armor * 3, GEAR_PAL.armor * 3 + 3)).map(v => +v.toFixed(2));
  const p0 = pal(), sw = [...document.querySelectorAll('#artPaint .swatch')];
  sw.find(b => b.title === 'Blue').click();
  return { n: sw.length, saved: G.save.gear.colors.cloak, p0, p1: pal(), iconChanged: gearIcon('cloak') !== icon0, pressed: [...document.querySelectorAll('#artPaint .swatch')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.title), cardImg: $('artBig').querySelector('img').src === gearIcon('cloak') };
});
ok(r.n === 11 && r.saved === '#2f7ff0' && r.p1[2] > r.p1[0] && r.p0[0] > r.p0[2] && r.iconChanged && r.cardImg && r.pressed.join() === 'Blue', 'painting the robe blue: blob, picture, card ' + JSON.stringify(r));
await page.evaluate(() => __frames && 0); await page.waitForTimeout(500); await shot('card-blue');
await page.evaluate(() => { UI.show('artInfo', false); UI.openArtifact(artKey('sword', 3)); [...document.querySelectorAll('#artPaint .swatch')].find(b => b.title === 'Pink').click(); UI.show('artInfo', false); });
await page.waitForTimeout(600); await shot('gear-painted');
// every item's picture changes when painted (no color list misses its picture)
r = await page.evaluate(() => Object.keys(ARTIFACTS).filter(id => { const g = G.save.gear, k = g.colors[id]; g.colors[id] = undefined; const a = gearIcon(id); g.colors[id] = '#3ccf5a'; const b = gearIcon(id); g.colors[id] = k; if (!k) delete g.colors[id]; return a === b; }));
ok(!r.length, 'every item\'s picture takes the paint' + (r.length ? ': not ' + r.join(', ') : ''));
// mythic: no swatches; reset: back to the original
r = await page.evaluate(() => { addArtifact(artKey('plate', MYTHIC), 1); UI.openArtifact(artKey('plate', MYTHIC)); const myth = $('artPaint').hidden; UI.openArtifact(artKey('cloak', 2)); document.querySelector('#artPaint .swatch.orig').click(); return { myth, cloak: G.save.gear.colors.cloak, sword: G.save.gear.colors.sword }; });
ok(r.myth && r.cloak === undefined && r.sword === '#ff5ab4', 'mythic has no paint; the reset swatch restores the robe ' + JSON.stringify(r));
// kept across a reload
await page.evaluate(() => { saveGame(); sessionStorage.setItem('k', '1'); });
await page.reload(); await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
r = await page.evaluate(() => ({ colors: G.save.gear.colors, look: gearLook('sword', G.save.gear)[0], orig: GEAR_LOOK.sword[0] }));
ok(r.colors.sword === '#ff5ab4' && r.look !== r.orig, 'paint kept in the save ' + JSON.stringify(r));
// the Hurler: walk into it again and again; it never hops, and its boulders land in 1.2 m circles
await page.evaluate(() => { G.save.chapter = 3; beginChapter(2); });
await page.waitForFunction(() => G.state === 'run' && G.run, null, { timeout: 600000, polling: 300 });
await page.waitForFunction(() => R.enemyDraw.hurler, null, { timeout: 900000, polling: 1000 });
await page.evaluate(() => { __manual(); if (!__rafQ.length) requestAnimationFrame(loop); DEV.god = true; G.run.invuln = 1e9; G.run.events = []; G.run.enemies.length = 0; spawnBoss('hurler', 0, -5, {}); });
r = await page.evaluate(() => {
  const e = G.run.enemies.find(o => o.type === 'hurler' || o.bossId === 'hurler' || o.model === 'hurler'), states = {}, radii = new Set();
  let maxY = 0, near = 0;
  for (let f = 0; f < 60 * 40; f++) {
    // stay right on top of it
    G.hero.pos[0] = e.x + 1.2; G.hero.pos[2] = e.z + 1.2;
    __frames(1);
    states[e.ai.state] = 1; if (e.ai.state !== 'enter') maxY = Math.max(maxY, e.y || 0); if (Math.hypot(G.hero.pos[0] - e.x, G.hero.pos[2] - e.z) < 3) near++;
    for (const s of G.run.eShots) if (s.kind === 'boulder') radii.add(s.radius);
    if (e.ai.state !== 'enter') for (const t of G.run.tele || []) if (t.kind === 'circle') radii.add('tele' + t.r);
  }
  return { states: Object.keys(states), maxY: +maxY.toFixed(2), radii: [...radii], hp: Math.round(e.maxHp || e.hp) };
});
ok(!r.states.includes('hop') && r.maxY < 0.1 && r.radii.includes(1.2) && r.radii.includes('tele1.2') && !r.radii.includes(1.5), 'the Hurler never hops; boulder circles 1.2 m ' + JSON.stringify(r));
// the level-up card that takes a power to max says so
r = await page.evaluate(() => { const run = G.run; addOrLevel('ball'); slotOf('ball').lvl = maxLevel('ball') - 1; addOrLevel('speed'); slotOf('speed').lvl = maxLevel('speed') - 1; return [describeChoice({ id: 'ball' }).desc, describeChoice({ id: 'speed' }).desc]; });
ok(r.every(d => /max level/i.test(d)), 'the card that reaches max says so: ' + JSON.stringify(r));
await page.evaluate(() => { G.run.choices = [{ id: 'ball' }, { id: 'speed' }]; UI.renderChoices(); setState('levelup'); __frames(30, 1 / 60, true); }); await page.waitForTimeout(400); await shot('levelup-max');
console.log(errs.length ? errs.slice(0, 6) : 'no errors');
await browser.close();
