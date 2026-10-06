// Headless tests of the built game: boot, menus, a bot playthrough with screenshots.
// usage: node test/game.mjs boot|play [chapter] [--phone] [--shots] [--seed]
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
const dir = path.dirname(new URL(import.meta.url).pathname);
const url = 'file://' + path.join(dir, '..', 'dist', 'project-gel.html');
const shots = path.join(dir, 'shots');
fs.mkdirSync(shots, { recursive: true });
const args = process.argv.slice(2);
const mode = args[0] || 'boot';
const phone = args.includes('--phone');
const wantShots = args.includes('--shots');
const chapter = Number(args.find(a => /^\d+$/.test(a)) || 1);
const errors = [];
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext(phone
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true }
  : { viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();
page.setDefaultTimeout(300000);
page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); else if (process.env.LOG) console.log('console:', m.text()); });
await page.addInitScript({ path: path.join(dir, 'harness.js') });
if (process.env.SAVE) await page.addInitScript(s => { localStorage.setItem('projectGel.save.v1', s); }, process.env.SAVE);
const t0 = Date.now();
process.on('unhandledRejection', async e => { console.log('FAILED:', e.message.split('\n')[0]); console.log('ERRORS:\n' + errors.join('\n')); try { console.log('NaN:', JSON.stringify(await page.evaluate(() => __nan))); console.log('state', await page.evaluate(() => G.state)); } catch (_) {} await browser.close(); process.exit(1); });
await page.goto(url);
if (mode === 'boot') await page.screenshot({ path: path.join(shots, (phone ? 'phone-' : '') + 'loading.png') });
const shot = async name => { await page.waitForTimeout(450); await page.screenshot({ path: path.join(shots, (phone ? 'phone-' : '') + name + '.png') }); };
const render = async (n = 1) => page.evaluate(n => __frames(n, 1 / 60, true), n);
await page.waitForFunction(() => G.state === 'home' || !document.getElementById('loadError').hidden, null, { timeout: 120000 });
console.log('home after', Date.now() - t0, 'ms');
const loadErr = await page.evaluate(() => document.getElementById('loadError').hidden ? '' : document.getElementById('loadError').textContent);
if (loadErr) { console.log('LOAD ERROR:', loadErr); console.log(errors.join('\n')); await browser.close(); process.exit(1); }
await page.waitForFunction(() => MESHJOB.done.size === MESH_ORDER.length, null, { timeout: 180000 });
console.log('all meshes after', Date.now() - t0, 'ms', await page.evaluate(() => MESHJOB.fallback ? '(main-thread fallback)' : '(workers)'));
await page.evaluate(() => { __manual(); __installNanCheck(); __installDmgLog(); });
await render(3);
if (mode === 'boot') {
  await render(30); await shot('home');
  for (const tab of ['upgrades', 'gear', 'skins', 'chapters']) { await page.click(`.tab[data-tab="${tab}"]`); await render(2); await shot('menu-' + tab); await page.click(`#${tab} .back`); }
  await page.click('#btnSettings'); await render(1); await shot('menu-settings');
  await page.click('#btnSettingsDone');
}
if (mode === 'play') {
  const runs = Number((args.find(a => a.startsWith('--runs=')) || '--runs=1').split('=')[1]);
  const verbose = runs === 1;
  const summary = [];
  for (let run = 0; run < runs; run++) {
    await page.evaluate(n => { G.save.chapter = Math.max(G.save.chapter, n); G.save.selected = n; UI.refreshHome(); for (const k in __dmg) delete __dmg[k]; __bot.picks.length = 0; }, chapter);
    if (process.env.MAP) await page.evaluate(m => { ARENA.hw = ARENA.hd = Number(m) / 2; ARENA.cr = Math.min(8, Number(m) * 0.1); }, process.env.MAP);
    if (process.env.META) await page.evaluate(m => { const v = Number(m); for (const k in G.save.upgrades) if (k !== 'offline') G.save.upgrades[k] = v; }, process.env.META);
    await page.click('#btnPlay');
    await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
    await page.evaluate(() => { window.readInput = () => __botInput(); __bot.on = true; });
    if (process.env.PREFER) await page.evaluate(ids => { __bot.prefer = ids.split(','); __blasts.length = 0; if (!window.__blastHooked) { window.__blastHooked = true; __installBlastLog(__bot.prefer[0]); } }, process.env.PREFER);
    const stats = [];
    const shotAt = new Set(wantShots ? [20, 95, 200, 302, 330] : []);
    let levelShot = !wantShots, chestShot = !wantShots, deaths = [];
    const wall = Date.now();
    for (let guard = 0; guard < 4000; guard++) {
      const st = await page.evaluate(() => {
        // simulate up to 1 second of game time, stopping at any state that needs a decision
        for (let i = 0; i < 60; i++) {
          __frames(1);
          if (G.state !== 'run' && G.state !== 'victory' && G.state !== 'dying') break;
        }
        const r = G.run;
        return { state: G.state, t: r ? Math.round(r.t) : 0, hp: r ? Math.round(r.hp) : 0, max: r ? Math.round(r.maxHp) : 0, lvl: r ? r.level : 0, en: r ? r.enemies.length : 0, kills: r ? r.kills : 0, gems: r ? r.gems.length : 0, boss: r && r.bosses.length ? r.bosses.map(b => Math.round(b.hp)).join('/') : '' };
      });
      if (stats.length === 0 || st.t - stats[stats.length - 1].t >= 15 || st.state !== 'run') stats.push(st);
      if (st.t > 900) { console.log('STUCK: run passed 15 minutes', JSON.stringify(st)); await page.evaluate(() => finishRun(false)); continue; }
      for (const s of [...shotAt]) if (st.t >= s) { shotAt.delete(s); await render(2); await shot(`play-c${chapter}-t${s}`); }
      if (st.state === 'levelup') {
        if (!levelShot) { levelShot = true; await render(1); await shot('levelup'); }
        await page.evaluate(() => __botPick());
      } else if (st.state === 'chest') {
        await page.waitForFunction(() => !document.getElementById('btnChest').disabled, null, { timeout: 10000, polling: 100 });
        if (!chestShot) { chestShot = true; await render(1); await shot('chest'); }
        await page.click('#btnChest');
      } else if (st.state === 'revive') {
        deaths.push(st.t);
        if (wantShots) { await render(1); await shot('revive'); }
        await page.click(process.env.NOREVIVE ? '#btnGiveUp' : '#btnRevive');
      } else if (st.state === 'pause') {
        await page.evaluate(() => resumeGame());
      } else if (st.state === 'results') {
        await render(2); if (wantShots) await shot('results');
        break;
      } else if (!['run', 'victory', 'dying'].includes(st.state)) { console.log('unexpected state', st.state); break; }
    }
    if (verbose) for (const s of stats) console.log(JSON.stringify(s));
    const fin = await page.evaluate(() => ({ won: G.run.won, t: Math.round(G.run.t), lvl: G.run.level, kills: G.run.kills, coins: G.run.earned, slots: G.run.slots.map(s => s.id + s.lvl).join(' ') }));
    const peak = Math.max(...stats.map(s => s.en));
    const dmg = await page.evaluate(() => { const o = {}; for (const k in __dmg) { const src = k.split(' ')[1]; o[src] = (o[src] || 0) + __dmg[k]; } return o; });
    console.log(`#${run + 1} ${fin.won ? 'WON ' : 'LOST'} t=${fin.t} lvl=${fin.lvl} kills=${fin.kills} coins=${fin.coins} deaths=[${deaths}] peakEnemies=${peak} wall=${((Date.now() - wall) / 1000).toFixed(0)}s`);
    console.log('   slots:', fin.slots, ' dmg:', JSON.stringify(dmg));
    if (verbose) { console.log('   picks:', await page.evaluate(() => __bot.picks.join(' '))); console.log('   en over time:', stats.map(s => s.t + ':' + s.en).join(' ')); }
    if (process.env.PREFER) console.log('   blasts by level:', await page.evaluate(() => { const o = {}; for (const b of __blasts) { const k = 'L' + b.lvl; (o[k] = o[k] || []).push(b.kills); } return JSON.stringify(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { n: v.length, avg: +(v.reduce((a, c) => a + c, 0) / v.length).toFixed(1), max: Math.max(...v) }]))); }));
    summary.push(fin.won);
    await page.click('#btnContinue');
    await page.waitForFunction(() => G.state === 'home', null, { timeout: 10000, polling: 100 });
  }
  console.log(`WIN RATE ${summary.filter(Boolean).length}/${runs}`);
}
if (mode === 'skills') {
  // every skill at max level, in two groups, with a crowd to hit
  const groups = { a: ['ball', 'fists', 'grenade', 'missile', 'mine', 'blade', 'reach', 'power'], b: ['lightning', 'aura', 'worms', 'buddies', 'axe', 'laser', 'shield', 'thick'] };
  for (const g of (args.find(a => a.startsWith('--group=')) || '--group=a,b').split('=')[1].split(',')) {
    await page.click('#btnPlay');
    await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
    await page.evaluate(ids => {
      window.readInput = () => __botInput(); __bot.on = true;
      const run = G.run;
      run.slots.length = 0;
      for (const id of ids) { const max = maxLevel(id); for (let i = 0; i < max; i++) addOrLevel(id); }
      run.t = 150; run.events = run.events.filter(e => e.t > 150);
      const h = G.hero.pos;
      for (let i = 0; i < 50; i++) { const a = i / 50 * TAU, r = 3.5 + (i % 3) * 1.2; spawnEnemy(i % 7 ? 'stickman' : 'brute', h[0] + Math.cos(a) * r, h[2] + Math.sin(a) * r); }
    }, groups[g]);
    for (let k = 0; k < 3; k++) {
      await page.evaluate(() => { for (let i = 0; i < 50; i++) { __frames(1); if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } if (G.state === 'chest') { UI.closeChest(); } } });
      await render(2); await shot(`skills-${g}-${k}`);
    }
    await page.evaluate(() => { if (G.state === 'run') pauseGame(); });
    await render(1); await shot(`pause-${g}`);
    await page.click('#btnQuit'); await page.click('#btnQuitYes');
    await page.waitForFunction(() => G.state === 'results', null, { timeout: 10000, polling: 100 });
    await page.click('#btnContinue');
    await page.waitForFunction(() => G.state === 'home', null, { timeout: 10000, polling: 100 });
  }
}
if (mode === 'bosses') {
  // jump straight to each boss fight and photograph its signature attack
  for (const n of [1, 2, 3, 4, 5]) {
    await page.evaluate(n => { G.save.chapter = Math.max(G.save.chapter, n); G.save.selected = n; UI.refreshHome(); }, n);
    await page.click('#btnPlay');
    await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
    await page.evaluate(() => {
      window.readInput = () => __botInput(); __bot.on = true;
      for (const id of ['ball', 'missile', 'blade', 'aura']) for (let i = 0; i < 4; i++) addOrLevel(id);
      G.run.t = 299; G.run.events = G.run.events.filter(e => e.kind === 'boss');
    });
    for (let k = 0; k < 3; k++) {
      await page.evaluate(k => { for (let i = 0; i < [100, 140, 110][k]; i++) { __frames(1); if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } if (G.state === 'chest') UI.closeChest(); } }, k);
      await render(2); await shot(`boss-c${n}-${k}`);
    }
    await page.evaluate(() => { if (G.state === 'run' || G.state === 'victory') finishRun(false); });
    await page.waitForFunction(() => G.state === 'results', null, { timeout: 10000, polling: 100 });
    await page.click('#btnContinue');
    await page.waitForFunction(() => G.state === 'home', null, { timeout: 10000, polling: 100 });
  }
}
if (mode === 'flows') {
  // chest roulette, melt, revive, victory, results, offline earnings, purchases, low quality
  // advance the game, taking the first card at level-ups and skipping chests
  const step = async n => page.evaluate(n => { for (let i = 0; i < n; i++) { if (G.run) G.run.chestQueued = 0; if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } __frames(1); } }, n);
  await page.click('#btnPlay');
  await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
  await page.evaluate(() => { window.readInput = () => __botInput(); __bot.on = true; for (const id of ['ball', 'missile', 'blade']) for (let i = 0; i < 3; i++) addOrLevel(id); });
  await step(600);
  await page.evaluate(() => { G.run.pending = 0; G.run.chestQueued = 1; });
  await page.evaluate(() => __frames(2));
  await page.waitForTimeout(700); await render(1); await shot('flow-chest-spin');
  await page.waitForFunction(() => !document.getElementById('btnChest').disabled, null, { timeout: 10000, polling: 100 });
  await render(1); await shot('flow-chest-result');
  await page.click('#btnChest');
  await page.evaluate(() => { G.run.invuln = 0; hurtHero(9999, G.hero.pos[0] + 1, G.hero.pos[2]); });
  await step(25); await render(1); await shot('flow-melting');
  await step(60);
  await page.waitForFunction(() => G.state === 'revive', null, { timeout: 10000, polling: 100 });
  await page.click('#btnRevive');
  await step(20); await render(1); await shot('flow-revived');
  // jump to a boss kill
  await page.evaluate(() => { G.run.t = 299; G.run.events = G.run.events.filter(e => e.kind === 'boss'); });
  await step(160);
  await page.evaluate(() => { for (const b of G.run.bosses) { b.hp = 1; hurtEnemy(b, 10); } });
  await step(30); await render(1); await shot('flow-victory');
  await step(150);
  await page.waitForFunction(() => G.state === 'results', null, { timeout: 10000, polling: 100 });
  await render(1); await shot('flow-results-won');
  await page.click('#btnContinue');
  await page.waitForFunction(() => G.state === 'home', null, { timeout: 10000, polling: 100 });
  // purchases
  await page.evaluate(() => { G.save.coins = 5000; UI.refreshHome(); });
  await page.click('.tab[data-tab="upgrades"]');
  await page.click('#upList .uprow:nth-child(1) button'); await page.click('#upList .uprow:nth-child(1) button');
  await render(2); await shot('flow-upgrades-bought');
  await page.click('#upgrades .back');
  await page.click('.tab[data-tab="skins"]');
  await page.click('#skinGrid .skin:nth-child(3)'); await render(20); await shot('flow-skin-preview');
  await page.click('#skinAction'); await render(20); await shot('flow-skin-bought');
  await page.click('#skins .back');
  await page.click('.tab[data-tab="chapters"]'); await render(2); await shot('flow-chapters-after');
  await page.click('#chapters .back');
  // offline earnings popup on the next visit
  await page.evaluate(() => { G.save.upgrades.offline = 3; G.save.lastSeen = Date.now() - 3 * 3.6e6; const o = offlineEarnings(); UI.showOffline(o.coins, o.hours); });
  await render(2); await shot('flow-offline');
  await page.click('#btnCollect');
  // low quality preset in a run
  await page.click('#btnSettings'); await page.click('#qualitySeg button[data-q="low"]'); await page.click('#btnSettingsDone');
  await page.click('#btnPlay');
  await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
  await page.evaluate(() => { for (const id of ['ball', 'aura', 'blade']) for (let i = 0; i < 3; i++) addOrLevel(id); });
  await step(500); await render(2); await shot('flow-low-quality');
  console.log('saved:', await page.evaluate(() => localStorage.getItem('projectGel.save.v1').slice(0, 200)));
}
if (mode === 'input') {
  // real input paths: keyboard, drag joystick, Esc to pause, number keys on level-up
  await page.click('#btnPlay');
  await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
  const pos = () => page.evaluate(() => [G.hero.pos[0], G.hero.pos[2]].map(v => +v.toFixed(2)));
  const run = n => page.evaluate(n => { for (let i = 0; i < n; i++) { if (G.run) G.run.pending = 0, G.run.chestQueued = 0; __frames(1); } }, n);
  let a = await pos();
  await page.keyboard.down('d'); await run(30); await page.keyboard.up('d');
  let b = await pos(); console.log('keyboard D moved x by', (b[0] - a[0]).toFixed(2), '(want about +2)');
  await page.keyboard.down('ArrowUp'); await run(30); await page.keyboard.up('ArrowUp');
  let c = await pos(); console.log('ArrowUp moved z by', (c[1] - b[1]).toFixed(2), '(want about -2)');
  const vp = page.viewportSize();
  await page.mouse.move(vp.width / 2, vp.height / 2); await page.mouse.down();
  await page.mouse.move(vp.width / 2 - 70, vp.height / 2, { steps: 4 });
  await run(30);
  await render(1); await shot('input-joystick');
  await page.mouse.up();
  let d = await pos(); console.log('drag left moved x by', (d[0] - c[0]).toFixed(2), '(want about -2)');
  console.log('hint hidden after moving:', await page.evaluate(() => document.getElementById('hint').hidden));
  await page.keyboard.press('Escape'); await run(1);
  console.log('Esc ->', await page.evaluate(() => G.state));
  await page.keyboard.press('Escape'); await run(1);
  console.log('Esc again ->', await page.evaluate(() => G.state));
  await page.evaluate(() => { G.run.pending = 1; }); await page.evaluate(() => __frames(1));
  console.log('level-up opened ->', await page.evaluate(() => G.state));
  await page.waitForTimeout(400);
  await page.keyboard.press('2'); await run(1);
  console.log('key 2 picked ->', await page.evaluate(() => G.state + ' slots=' + G.run.slots.map(s => s.id + s.lvl).join(',')));
}
if (mode === 'arenas') {
  // the first chapter of each arena, 40 seconds into a run with a few skills
  for (const n of (process.env.ONLY || '1,6,11,16,21,26').split(',').map(Number)) {
    await page.evaluate(n => { G.save.chapter = Math.max(G.save.chapter, n); G.save.selected = n; UI.refreshHome(); }, n);
    await page.click('#btnPlay');
    await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
    await page.evaluate(() => {
      window.readInput = () => __botInput(); __bot.on = true;
      for (const id of ['ball', 'fists', 'grenade', 'aura']) for (let i = 0; i < 3; i++) addOrLevel(id);
      G.run.t = 100;
      for (let i = 0; i < 2400; i++) { G.run.invuln = 1; G.run.chestQueued = 0; if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } if (G.state === 'chest') UI.closeChest(); __frames(1); }
    });
    await render(2); await shot(`arena-run-c${n}`);
    await page.evaluate(() => finishRun(false));
    await page.waitForFunction(() => G.state === 'results', null, { timeout: 10000, polling: 100 });
    await page.click('#btnContinue');
    await page.waitForFunction(() => G.state === 'home', null, { timeout: 10000, polling: 100 });
  }
}
if (mode === 'roster') {
  // every enemy type standing in a row, then the same with elite crowns
  await page.evaluate(() => { G.save.chapter = 9; G.save.selected = 9; UI.refreshHome(); });
  await page.click('#btnPlay');
  await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
  for (const elite of [false, true]) {
    await page.evaluate(elite => {
      const run = G.run; run.events = []; run.spawnAcc = -1e9; run.enemies.length = 0; run.invuln = 1e9;
      ARENA.obstacles = []; ARENA.rocks = []; ARENA.pools = [];
      const types = Object.keys(ENEMY_TYPES).filter(k => k !== 'mini');
      types.forEach((k, i) => { const e = spawnEnemy(k, (i - (types.length - 1) / 2) * 1.35, -1.5 + (i % 2) * 1.2, { elite }); e.speed = 0; e.spawnT = 0; e.yaw = 0.35; e.phase = i * 0.13; e.def = { ...e.def, ai: null, ranged: false }; });
      G.hero.pos[0] = 0; G.hero.pos[2] = 3.2; G.run.vel = [0, 0, 0];
      window.readInput = () => { G.input.x = 0; G.input.z = 0; };
      for (let i = 0; i < 10; i++) __frames(1);
    }, elite);
    console.log(await page.evaluate(() => JSON.stringify({ st: G.state, melt: G.hero.melt, hp: G.run.hp, n: G.run.enemies.length, e0: G.run.enemies.slice(0, 3).map(e => [e.type, e.scale, e.dying, e.flash]) })));
    await render(2); await shot(elite ? 'roster-elite' : 'roster');
  }
}
if (mode === 'blob') {
  // Choose your blob: colors tab, then a gradient color with a costume previewed
  await page.evaluate(() => { G.save.coins = 9000; UI.refreshHome(); });
  await page.click('.tab[data-tab="skins"]'); await render(40); await shot('blob-colors');
  await page.click('#skinGrid .skin:nth-child(10)'); await page.click('#blobTabs button[data-bt="costumes"]'); await page.click('#skinGrid .skin:nth-child(7)');
  await render(40); await shot('blob-costumes');
  await page.click('#skinAction'); await render(2);
  console.log('costume after buying:', await page.evaluate(() => G.save.costume + ' owned=' + G.save.costumes.join(',')));
}
if (mode === 'drops') {
  // the floor drops up close: blue crystals, emeralds, a scroll, a coin, a heart and a chest
  await page.click('#btnPlay');
  await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
  await page.evaluate(() => {
    const h = G.hero.pos;
    for (let i = 0; i < 8; i++) dropGem(h[0] - 2.4 + i * 0.6, h[2] + 1.6, 1, 0);
    for (let i = 0; i < 3; i++) dropGem(h[0] - 1.2 + i * 1.2, h[2] + 2.6, 8, 1);
    for (const [k, dx] of [['scroll', -2], ['coin', -0.7], ['heart', 0.7], ['chest', 2]]) spawnPickup(k, h[0] + dx, h[2] - 1.6);
    for (const o of [...G.run.gems, ...G.run.pickups]) { o.vx = o.vz = 0; }
    G.run.stats.magnet = 0;
  });
  await page.evaluate(() => { for (let i = 0; i < 60; i++) { G.run.invuln = 1; __frames(1); } });
  await render(2); await shot('drops');
  const vp = page.viewportSize();
  await page.screenshot({ path: path.join(shots, (phone ? 'phone-' : '') + 'drops-close.png'), clip: { x: vp.width / 2 - 260, y: vp.height / 2 - 170, width: 520, height: 340 } });
}
if (mode === 'gait') {
  // the hero running in place on the home screen, seen from the side, through one stride
  await page.evaluate(() => {
    window.updateHome = dt => { const h = G.hero; h.pos[0] = h.pos[1] = h.pos[2] = 0; h.update(dt, [h.topSpeed, 0, 0], true); FX.update(dt); };
    G.hero.topSpeed = 4.5;
  });
  await page.evaluate(() => __frames(90));
  const cyc = await page.evaluate(() => STRIDE * G.hero.scale / G.hero.topSpeed);
  const vp = page.viewportSize(), names = [];
  for (let i = 0; i < 6; i++) {
    await page.evaluate(n => __frames(n, 1 / 120, true), Math.round(cyc / 6 * 120));
    const n = path.join(shots, 'gait-' + i + '.png');
    await page.screenshot({ path: n, clip: { x: vp.width / 2 - 170, y: vp.height * 0.1, width: 340, height: vp.height * 0.62 } });
    names.push(n);
  }
  const { execFileSync } = await import('node:child_process');
  execFileSync('node', [path.join(dir, 'montage.mjs'), path.join(shots, 'gait.png'), '6', ...names]);
  console.log('stride cycle (s):', cyc.toFixed(2));
}
if (mode === 'gear') {
  // inventory: fill it, open scroll chests, fuse, equip, and check the run picks up the bonuses
  await page.evaluate(() => {
    const sv = G.save; sv.scrolls = 3; sv.coins = 99999;
    for (const [k, n] of [['wand:0', 5], ['sword:1', 1], ['cloak:2', 1], ['goldRing:0', 3], ['skull:3', 1], ['moon:4', 1], ['plate:0', 2], ['bow:1', 2], ['clover:2', 1], ['vest:0', 1], ['silverRing:1', 1], ['rubyRing:0', 1]]) sv.gear.items[k] = n;
    sv.gear.eq.weapon = 'sword:1'; sv.gear.eq.necklace = 'skull:3';
  });
  await page.click('.tab[data-tab="gear"]'); await render(30); await shot('gear');
  await page.click('#gChest'); await render(2); await shot('gear-chest-closed');
  await page.click('#scOpen'); await page.waitForTimeout(1100); await render(2); await shot('gear-chest-open');
  await page.click('#scDone');
  await page.click('#gFuse'); await render(2);
  const fused = await page.evaluate(() => JSON.stringify(G.save.gear.items));
  console.log('after fuse:', fused);
  await page.click('#gearGrid .art'); await render(2); await shot('gear-item');
  await page.click('#artEquip'); await page.click('#artClose'); await render(4); await shot('gear-after');
  const totals = await page.evaluate(() => ({ eq: G.save.gear.eq, stats: gearStats(), tot: gearTotals() }));
  console.log('equipped:', JSON.stringify(totals));
  await page.click('#gear .back');
  await page.click('#btnPlay');
  await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
  console.log('run stats:', await page.evaluate(() => JSON.stringify({ gear: G.run.gear, dmg: +G.run.stats.dmgMul.toFixed(3), maxHp: Math.round(G.run.maxHp), cd: +G.run.stats.cdMul.toFixed(3) })));
}
if (mode === 'dev') {
  // the dev console: closed by default, "specimen" unlocks and opens it, backtick toggles it after that
  const isOpen = () => page.evaluate(() => DEV.open && !$('dev').hidden);
  await page.keyboard.press('Backquote');
  console.log('backtick before unlock opens it:', await isOpen());
  await page.keyboard.type('specimen');
  console.log('open after typing specimen:', await isOpen(), 'focused:', await page.evaluate(() => document.activeElement && document.activeElement.id));
  const cmd = async c => { await page.keyboard.type(c); await page.keyboard.press('Enter'); };
  for (const c of ['help', 'coins 500', 'scrolls 2', 'artifact wand epic 3', 'artifact random 0 4', 'chapter 3', 'unlock', 'bogus', 'spawn brute']) await cmd(c);
  await render(2); await shot('dev-home');
  await page.keyboard.press('Backquote');
  console.log('closed by backtick:', !(await isOpen()));
  await page.keyboard.press('Backquote');
  console.log('reopened by backtick:', await isOpen());
  await page.keyboard.press('Escape');
  const sv = await page.evaluate(() => ({ coins: G.save.coins, scrolls: G.save.scrolls, items: G.save.gear.items, chapter: G.save.chapter, skins: G.save.skins.length, dev: G.save.devUnlocked }));
  console.log('save:', JSON.stringify(sv));
  await page.click('#btnPlay');
  await page.waitForFunction(() => G.state === 'run', null, { timeout: 60000, polling: 100 });
  await page.keyboard.press('Backquote');
  const t0 = await page.evaluate(() => G.run.t);
  for (const c of ['god', 'spawn brute 4 elite', 'spawn stickman 30', 'drop scroll 2', 'drop emerald 3', 'skill laser 3', 'skill power 2', 'level 2', 'map 160', 'speed 2', 'time 200']) await cmd(c);
  await page.evaluate(() => __frames(30));
  console.log('frozen while open:', await page.evaluate(t => G.run.t === t || G.run.t === 200, t0));
  await render(2); await shot('dev-run');
  await page.keyboard.press('Backquote');
  for (let i = 0; i < 20; i++) { await page.evaluate(() => { for (let k = 0; k < 30; k++) { __frames(1); if (G.state === 'levelup') { UI.choiceLock = 0; UI.pick(0); } if (G.state === 'chest') UI.closeChest(); } }); }
  const st = await page.evaluate(() => ({ t: Math.round(G.run.t), hp: Math.round(G.run.hp), max: Math.round(G.run.maxHp), lvl: G.run.level, arena: ARENA.hw * 2, slots: G.run.slots.map(s => s.id + s.lvl).join(' '), scrolls: G.run.scrolls || 0, state: G.state }));
  console.log('run after commands:', JSON.stringify(st));
  await page.keyboard.press('Backquote');
  for (const c of ['boss', 'kill', 'win']) await cmd(c);
  await page.waitForFunction(() => G.state === 'results', null, { timeout: 10000, polling: 100 });
  console.log('results scrolls saved:', await page.evaluate(() => G.save.scrolls));
}
console.log('NaN:', JSON.stringify(await page.evaluate(() => __nan)));
console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
