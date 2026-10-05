// ============================================================
// UI: screens, HUD, level-up cards, chest roulette, overlay drawing
// ============================================================
const $ = id => document.getElementById(id);
const UI = {
  menuTab: 'home', settingsFrom: null, lastHud: {}, slotSig: '', choiceLock: 0, reviveT: 0, skinPreview: null,
  overlay: null, octx: null, toastT: 0,

  init() {
    this.overlay = $('overlay');
    this.octx = this.overlay.getContext('2d');
    $('btnPlay').addEventListener('click', () => { AUDIO.unlock(); AUDIO.play('click'); beginChapter(G.save.selected); });
    $('chPrev').addEventListener('click', () => { G.save.selected = Math.max(1, G.save.selected - 1); AUDIO.play('click'); this.refreshHome(); saveGame(); });
    $('chNext').addEventListener('click', () => { G.save.selected = Math.min(G.save.chapter, G.save.selected + 1); AUDIO.play('click'); this.refreshHome(); saveGame(); });
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { AUDIO.unlock(); AUDIO.play('click'); this.openTab(b.dataset.tab); }));
    document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => { AUDIO.play('click'); this.openTab('home'); }));
    $('btnSettings').addEventListener('click', () => { AUDIO.unlock(); AUDIO.play('click'); this.openSettings(); });
    $('btnPause').addEventListener('click', () => pauseGame());
    $('btnResume').addEventListener('click', () => resumeGame());
    $('btnPauseSettings').addEventListener('click', () => this.openSettings());
    $('btnQuit').addEventListener('click', () => { $('quitConfirm').hidden = false; $('pauseActions').hidden = true; });
    $('btnQuitNo').addEventListener('click', () => { $('quitConfirm').hidden = true; $('pauseActions').hidden = false; });
    $('btnQuitYes').addEventListener('click', () => { $('quitConfirm').hidden = true; $('pauseActions').hidden = false; finishRun(false); });
    $('btnReroll').addEventListener('click', () => this.reroll());
    $('btnChest').addEventListener('click', () => this.closeChest());
    $('btnRevive').addEventListener('click', () => { if (G.state === 'revive') reviveHero(); });
    $('btnGiveUp').addEventListener('click', () => { if (G.state === 'revive') finishRun(false); });
    $('btnContinue').addEventListener('click', () => { AUDIO.play('click'); goHome(); });
    $('btnSettingsDone').addEventListener('click', () => this.closeSettings());
    $('btnCollect').addEventListener('click', () => this.collectOffline());
    $('btnReset').addEventListener('click', () => { $('resetConfirm').hidden = false; });
    $('btnResetNo').addEventListener('click', () => { $('resetConfirm').hidden = true; });
    $('btnResetYes').addEventListener('click', () => { G.save = defaultSave(); saveGame(); $('resetConfirm').hidden = true; applySkin(G.save.skin); this.syncSettings(); this.refreshHome(); this.toast('Progress erased'); });
    document.querySelectorAll('.switch').forEach(sw => sw.addEventListener('click', () => {
      const k = sw.dataset.set; G.save.settings[k] = !G.save.settings[k]; this.syncSettings(); applySettings(); saveGame(); AUDIO.play('click');
    }));
    document.querySelectorAll('#qualitySeg button').forEach(b => b.addEventListener('click', () => { G.save.settings.quality = b.dataset.q; this.syncSettings(); applySettings(); saveGame(); AUDIO.play('click'); }));
    $('heroTap').addEventListener('pointerdown', () => { AUDIO.unlock(); pokeHero(); });
    $('skinAction').addEventListener('click', () => this.skinAction());
    document.querySelectorAll('#blobTabs button').forEach(b => b.addEventListener('click', () => { this.blobTab = b.dataset.bt; AUDIO.play('click'); this.renderSkins(); }));
  },

  show(id, on) { const e = $(id); if (e) e.hidden = !on; },

  onState(s) {
    const menu = s === 'home';
    this.show('loading', s === 'loading');
    this.show('home', menu && this.menuTab === 'home');
    this.show('upgrades', menu && this.menuTab === 'upgrades');
    this.show('skins', menu && this.menuTab === 'skins');
    this.show('chapters', menu && this.menuTab === 'chapters');
    const inRun = ['run', 'levelup', 'chest', 'pause', 'dying', 'revive', 'victory'].includes(s);
    this.show('hud', inRun);
    this.show('levelup', s === 'levelup');
    this.show('chest', s === 'chest');
    this.show('pause', s === 'pause');
    this.show('revive', s === 'revive');
    this.show('results', s === 'results');
    if (s === 'home') this.refreshHome();
    // a banner that is still animating would sit on top of a modal's title
    if (['levelup', 'chest', 'pause', 'revive', 'results'].includes(s)) $('banner').classList.remove('show');
    if (s === 'revive') this.reviveT = 5;
    if (s === 'results') this.fillResults();
    if (s === 'run') { this.slotSig = ''; }
  },

  openTab(tab) {
    if (this.menuTab === 'skins' && tab !== 'skins') { applySkin(G.save.skin); this.skinPreview = null; this.costumePreview = null; }
    this.menuTab = tab;
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'upgrades') this.renderUpgrades();
    if (tab === 'skins') this.renderSkins();
    if (tab === 'chapters') this.renderChapters();
    this.onState(G.state);
  },

  refreshHome() {
    const sv = G.save;
    sv.selected = clamp(sv.selected || 1, 1, sv.chapter);
    document.querySelectorAll('#homeCoins, .coinsVal').forEach(e => { e.textContent = fmtNum(sv.coins); });
    const info = chapterInfo(sv.selected);
    $('chLabel').textContent = `Chapter ${sv.selected}${sv.cleared[sv.selected] ? ' · cleared' : ''}`;
    $('chName').textContent = info.arenaName;
    const bossNames = [...new Set(info.bosses)].map(b => BOSS_TYPES[b].name).join(' + ');
    const best = sv.best[sv.selected];
    $('chInfo').textContent = (best ? `Best ${fmtTime(best)} · ` : '') + `Boss: ${bossNames}`;
    $('chPrev').disabled = sv.selected <= 1;
    $('chNext').disabled = sv.selected >= sv.chapter;
    applyArena(info.arena);
  },

  // ---------- upgrades ----------
  renderUpgrades() {
    const sv = G.save, list = $('upList');
    document.querySelectorAll('.coinsVal').forEach(e => { e.textContent = fmtNum(sv.coins); });
    list.replaceChildren(...Object.keys(META_UPGRADES).map(id => {
      const u = META_UPGRADES[id], lvl = sv.upgrades[id] || 0, cost = upgradeCost(id, lvl), maxed = lvl >= u.max;
      const row = document.createElement('div');
      row.className = 'panel uprow';
      row.innerHTML = `<span class="tile"><img alt=""></span><span><span class="nm"></span><span class="ds"></span></span><button class="jelly gold"></button>`;
      row.querySelector('img').src = ICONS.get('meta-' + id);
      row.querySelector('.nm').textContent = `${u.name} · Lv ${lvl}`;
      row.querySelector('.ds').textContent = lvl ? `+${fmtNum(u.per * lvl)}${u.unit}` : `+${u.per}${u.unit} per level`;
      const b = row.querySelector('button');
      if (maxed) { b.textContent = 'MAX'; b.disabled = true; }
      else {
        b.innerHTML = `<i class="coin"></i><span></span>`;
        b.querySelector('span').textContent = fmtNum(cost);
        b.disabled = sv.coins < cost;
        b.addEventListener('click', () => {
          if (sv.coins < cost) return;
          sv.coins -= cost; sv.upgrades[id] = lvl + 1; saveGame();
          AUDIO.play('coin'); this.toast(`${u.name} upgraded`);
          this.renderUpgrades(); this.refreshHome();
          G.hero.impulse(1.2);
        });
      }
      return row;
    }));
  },

  // ---------- skins ----------
  renderSkins() {
    const sv = G.save, grid = $('skinGrid'), colors = this.blobTab !== 'costumes';
    if (!this.skinPreview) this.skinPreview = sv.skin;
    if (!this.costumePreview) this.costumePreview = sv.costume;
    document.querySelectorAll('.coinsVal').forEach(e => { e.textContent = fmtNum(sv.coins); });
    document.querySelectorAll('#blobTabs button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.bt === 'colors') === colors)));
    const list = colors ? SKINS : COSTUMES, owned = colors ? sv.skins : sv.costumes, worn = colors ? sv.skin : sv.costume;
    const sel = colors ? this.skinPreview : this.costumePreview;
    grid.replaceChildren(...list.map(s => {
      const b = document.createElement('button');
      b.className = 'skin' + (s.id === sel ? ' sel' : '');
      b.innerHTML = `<img alt=""><span></span><small></small>`;
      b.querySelector('img').src = ICONS.get((colors ? 'skin-' : 'costume-') + s.id);
      b.querySelector('span').textContent = s.name;
      const sm = b.querySelector('small');
      if (worn === s.id) sm.textContent = 'Equipped';
      else if (owned.includes(s.id)) sm.textContent = 'Owned';
      else { sm.innerHTML = '<i class="coin"></i><span></span>'; sm.querySelector('span').textContent = fmtNum(s.cost); }
      b.addEventListener('click', () => {
        if (colors) this.skinPreview = s.id; else this.costumePreview = s.id;
        applySkin(this.skinPreview, this.costumePreview); G.hero.impulse(1.4); AUDIO.play('click'); this.renderSkins();
      });
      return b;
    }));
    const s = list.find(k => k.id === sel) || list[0], act = $('skinAction');
    if (worn === s.id) { act.textContent = 'Equipped'; act.disabled = true; act.className = 'jelly'; }
    else if (owned.includes(s.id)) { act.textContent = 'Equip'; act.disabled = false; act.className = 'jelly'; }
    else { act.innerHTML = `Buy · <i class="coin"></i><span></span>`; act.querySelector('span').textContent = fmtNum(s.cost); act.disabled = sv.coins < s.cost; act.className = 'jelly gold'; }
  },
  skinAction() {
    const sv = G.save, colors = this.blobTab !== 'costumes';
    const s = colors ? SKINS.find(k => k.id === this.skinPreview) : COSTUMES.find(k => k.id === this.costumePreview);
    if (!s) return;
    const owned = colors ? sv.skins : sv.costumes;
    if (!owned.includes(s.id)) {
      if (sv.coins < s.cost) return;
      sv.coins -= s.cost; owned.push(s.id); AUDIO.play('coin'); this.toast(`${s.name} unlocked`);
    }
    if (colors) sv.skin = s.id; else sv.costume = s.id;
    saveGame(); AUDIO.play('levelup'); G.hero.impulse(2);
    this.renderSkins(); this.refreshHome();
  },

  // ---------- chapter map ----------
  renderChapters() {
    const sv = G.save, map = $('chMap');
    // boss portraits need a GPU readback, so they are drawn here, only when the map is opened
    for (const m in BOSS_OF_MODEL) if (R.enemyDraw[m] && !ICONS.map['boss-' + BOSS_OF_MODEL[m]]) renderBossPortrait(m);
    const top = Math.min(sv.chapter + 4, 300);
    const nodes = [];
    for (let n = top; n >= 1; n--) {
      const info = chapterInfo(n), b = document.createElement('button');
      const locked = n > sv.chapter, cleared = !!sv.cleared[n];
      b.className = 'node' + (locked ? ' locked' : '') + (cleared ? ' cleared' : '') + (n === sv.selected ? ' current' : '') + (n % 5 === 0 ? ' big' : '');
      b.innerHTML = `<span class="num"></span><span><span class="nm"></span><span class="ds"></span></span>`;
      const boss = info.bosses[0], icon = ICONS.get('boss-' + boss);
      if (icon && !locked) { const im = document.createElement('img'); im.alt = ''; im.src = icon; b.querySelector('.num').append(im); }
      else if (locked) b.querySelector('.num').innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><rect x="4.5" y="10" width="15" height="11" rx="3" fill="currentColor"/></svg>';
      else b.querySelector('.num').textContent = n;
      b.querySelector('.nm').textContent = `Chapter ${n}${n % 5 === 0 ? ' · double boss' : ''}`;
      const names = [...new Set(info.bosses)].map(x => BOSS_TYPES[x].name).join(' + ');
      b.querySelector('.ds').textContent = locked ? `Clear chapter ${n - 1} to unlock` : `${info.arenaName} · ${names}${sv.best[n] ? ' · best ' + fmtTime(sv.best[n]) : ''}`;
      b.disabled = locked;
      b.addEventListener('click', () => { sv.selected = n; saveGame(); AUDIO.play('click'); this.openTab('home'); });
      nodes.push(b);
    }
    map.replaceChildren(...nodes);
    requestAnimationFrame(() => { const cur = map.querySelector('.current'); if (cur) cur.scrollIntoView({ block: 'center' }); });
  },

  // ---------- settings ----------
  openSettings() { this.syncSettings(); this.show('settings', true); $('resetConfirm').hidden = true; $('btnReset').closest('.setting').hidden = G.state !== 'home'; },
  closeSettings() { this.show('settings', false); AUDIO.play('click'); },
  syncSettings() {
    const st = G.save.settings;
    document.querySelectorAll('.switch').forEach(sw => sw.setAttribute('aria-checked', String(!!st[sw.dataset.set])));
    document.querySelectorAll('#qualitySeg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.q === st.quality)));
  },

  // ---------- offline earnings ----------
  showOffline(coins, hours) {
    this.offlineCoins = coins;
    $('offCoins').textContent = '+' + fmtNum(coins);
    $('offText').textContent = `You were away for ${hours >= 1 ? hours.toFixed(1) + ' hours' : Math.max(1, Math.round(hours * 60)) + ' minutes'}. Your goo kept working.`;
    this.show('offline', true);
  },
  collectOffline() { G.save.coins += this.offlineCoins || 0; saveGame(); this.show('offline', false); AUDIO.unlock(); AUDIO.play('coin'); this.refreshHome(); },

  // ---------- HUD ----------
  setText(key, el, v) { if (this.lastHud[key] !== v) { this.lastHud[key] = v; el.textContent = v; } },
  updateHud() {
    const run = G.run;
    if (!run) return;
    const L = this.lastHud;
    const xpPct = (clamp(run.xp / run.xpNext, 0, 1) * 100).toFixed(1) + '%';
    if (L.xp !== xpPct) { L.xp = xpPct; $('xpFill').style.width = `calc(${xpPct} - 4px)`; }
    this.setText('lv', $('xpText'), 'LV ' + run.level);
    this.setText('kills', $('hudKills'), fmtNum(run.kills));
    this.setText('timer', $('hudTimer'), fmtTime(run.t));
    this.setText('coins', $('hudCoinsVal'), fmtNum(run.coins));
    const sig = run.slots.map(s => s.id + s.lvl).join(',');
    if (sig !== this.slotSig) {
      this.slotSig = sig;
      const cells = [];
      for (let i = 0; i < 8; i++) {
        const s = run.slots[i], d = document.createElement('div');
        if (s) {
          d.className = 'slot ' + s.kind;
          const max = maxLevel(s.id);
          d.innerHTML = `<img alt=""><u><i style="width:${(s.lvl / max) * 100}%"></i></u>`;
          d.querySelector('img').src = ICONS.get((s.kind === 'skill' ? 'skill-' : 'passive-') + s.id);
        } else d.className = 'slot';
        cells.push(d);
      }
      $('slots').replaceChildren(...cells);
    }
    const bossOn = run.bossStarted && run.bosses.some(b => !b.dying);
    if (L.boss !== bossOn) { L.boss = bossOn; $('bossbar').hidden = !bossOn; }
    if (bossOn) {
      const hp = run.bosses.reduce((s, b) => s + Math.max(0, b.dying ? 0 : b.hp), 0);
      const pct = (clamp(hp / run.bossTotalHp, 0, 1) * 100).toFixed(1) + '%';
      if (L.bossPct !== pct) { L.bossPct = pct; $('bossFill').style.width = pct; }
      this.setText('bossName', $('bossName'), [...new Set(run.bosses.map(b => b.def.name))].join(' + '));
    }
  },
  banner(text, boss = false) {
    const b = $('banner');
    b.className = boss ? 'boss' : '';
    if (boss) { b.innerHTML = '<span class="warn">WARNING</span>'; b.append(document.createTextNode(text)); }
    else b.textContent = text;
    void b.offsetWidth;
    b.classList.add('show');
  },
  bossIntro(name) { this.banner(name, true); },
  toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); this.toastT = 1.6; },

  // ---------- level up ----------
  openLevelUp() {
    const run = G.run;
    run.choices = rollChoices();
    this.renderChoices();
    $('luSub').textContent = `Level ${run.level - run.pending + 1} · pick one`;
    this.choiceLock = performance.now() + 350;
    AUDIO.play('levelup');
    setState('levelup');
  },
  renderChoices() {
    const run = G.run;
    $('luCards').replaceChildren(...run.choices.map((c, i) => {
      const d = describeChoice(c), b = document.createElement('button');
      b.className = 'card';
      b.innerHTML = `<span class="tile ${d.kind}"><img alt=""></span><span><small class="${d.isNew ? '' : 'up'}"></small><span class="nm"></span><span class="ds"></span></span>`;
      b.querySelector('img').src = ICONS.get(d.icon);
      b.querySelector('small').textContent = d.tag;
      b.querySelector('.nm').textContent = d.name;
      b.querySelector('.ds').innerHTML = d.desc;
      b.addEventListener('click', () => this.pick(i));
      return b;
    }));
    const rr = $('btnReroll');
    rr.textContent = `Reroll (${run.rerolls})`;
    rr.disabled = run.rerolls <= 0;
  },
  reroll() {
    const run = G.run;
    if (run.rerolls <= 0 || G.state !== 'levelup') return;
    run.rerolls--; run.choices = rollChoices(); this.renderChoices(); AUDIO.play('click');
  },
  pick(i) {
    if (G.state !== 'levelup' || performance.now() < this.choiceLock) return;
    const run = G.run, c = run.choices[i];
    if (!c) return;
    applyChoice(c);
    run.pending--;
    AUDIO.play('pop');
    if (run.pending > 0) { this.openLevelUp(); return; }
    G.hero.impulse(2.2);
    run.invuln = Math.max(run.invuln, 0.4);
    setState('run');
  },

  // ---------- chest ----------
  openChest() {
    const run = G.run;
    run.chestQueued--;
    const r = Math.random(), n = r < 0.7 ? 1 : r < 0.95 ? 3 : 5;
    const results = [];
    for (let k = 0; k < n; k++) {
      const up = run.slots.filter(s => s.lvl < maxLevel(s.id) - results.filter(x => x === s.id).length);
      if (!up.length) break;
      const skills = up.filter(s => s.kind === 'skill');
      results.push(pick(skills.length && Math.random() < 0.75 ? skills : up).id);
    }
    this.chestResults = results;
    this.chestCoins = results.length ? 0 : 40;
    const pool = run.slots.map(s => (s.kind === 'skill' ? 'skill-' : 'passive-') + s.id);
    const strip = $('chStrip'), tiles = [];
    const total = 34, land = 28;
    const landKey = results.length ? (SKILLS[results[0]] ? 'skill-' : 'passive-') + results[0] : 'meta-offline';
    for (let i = 0; i < total; i++) {
      const key = i === land ? landKey : pick(pool);
      const t = document.createElement('span'); t.className = 'tile'; const im = document.createElement('img'); im.alt = ''; im.src = ICONS.get(key); t.append(im); tiles.push(t);
    }
    strip.replaceChildren(...tiles);
    strip.style.transition = 'none';
    strip.style.transform = 'translateX(0px)';
    $('chRes').replaceChildren();
    $('btnChest').disabled = true;
    setState('chest');
    // layout sizes, not getBoundingClientRect: the modal is mid scale-in animation at this point
    const lt = tiles[land], boxW = strip.parentElement.clientWidth;
    const target = -(lt.offsetLeft + lt.offsetWidth / 2 - boxW / 2) + rand(-0.3, 0.3) * lt.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      strip.style.transition = 'transform 1.9s cubic-bezier(.12,.8,.2,1)';
      strip.style.transform = `translateX(${target}px)`;
    }));
    let ticks = 0;
    const tick = setInterval(() => { if (++ticks > 14) clearInterval(tick); AUDIO.play('click'); }, 110);
    setTimeout(() => this.revealChest(), 2000);
  },
  revealChest() {
    const res = $('chRes'), rows = [];
    if (this.chestResults.length) {
      for (const id of this.chestResults) {
        const before = lvlOf(id);
        addOrLevel(id);
        const d = document.createElement('div');
        const name = (SKILLS[id] || PASSIVES[id]).name;
        d.innerHTML = `<span class="tile"><img alt=""></span><span></span>`;
        d.querySelector('img').src = ICONS.get((SKILLS[id] ? 'skill-' : 'passive-') + id);
        d.querySelector('span:last-child').textContent = `${name}  Lv ${before} → ${before + 1}`;
        rows.push(d);
      }
    } else {
      G.run.coins += this.chestCoins;
      const d = document.createElement('div'); d.innerHTML = `<span class="tile"><img alt=""></span><span></span>`;
      d.querySelector('img').src = ICONS.get('meta-offline'); d.querySelector('span:last-child').textContent = `+${this.chestCoins} coins (everything is maxed)`;
      rows.push(d);
    }
    res.replaceChildren(...rows);
    AUDIO.play('chest');
    $('btnChest').disabled = false;
  },
  closeChest() {
    if (G.state !== 'chest') return;
    AUDIO.play('click');
    G.hero.impulse(2);
    setState('run');
  },

  // ---------- pause / revive / results ----------
  openPause() {
    const run = G.run;
    $('pauseSub').textContent = `Chapter ${run.chapter} · ${fmtTime(run.t)} · Level ${run.level}`;
    $('pauseList').replaceChildren(...run.slots.map(s => {
      const d = document.createElement('div'), max = maxLevel(s.id);
      d.innerHTML = `<span class="tile ${s.kind}"><img alt=""></span><span></span><span class="dots"></span>`;
      d.querySelector('img').src = ICONS.get((s.kind === 'skill' ? 'skill-' : 'passive-') + s.id);
      d.querySelector('span:nth-child(2)').textContent = (SKILLS[s.id] || PASSIVES[s.id]).name;
      d.querySelector('.dots').innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < s.lvl ? 'on' : ''}"></i>`).join('');
      return d;
    }));
    $('quitConfirm').hidden = true; $('pauseActions').hidden = false;
  },
  fillResults() {
    const run = G.run;
    if (!run) return;
    $('resEyebrow').textContent = `Chapter ${run.chapter} · ${run.info.arenaName}`;
    const t = $('resTitle');
    t.textContent = run.won ? 'CLEARED!' : 'YOU MELTED';
    t.style.color = run.won ? 'var(--mint)' : 'var(--pink)';
    $('resTime').textContent = fmtTime(run.t);
    $('resKills').textContent = fmtNum(run.kills);
    $('resLevel').textContent = run.level;
    $('resCoins').textContent = '+' + fmtNum(run.earned || 0);
    $('resBreak').textContent = run.won ? `${fmtNum(run.coins)} picked up + ${fmtNum(run.reward)} for clearing the chapter` : `${fmtNum(run.coins)} picked up. Clear the boss for a bigger reward.`;
  },

  update(dt) {
    if (this.toastT > 0) { this.toastT -= dt; if (this.toastT <= 0) $('toast').classList.remove('show'); }
    if (G.state === 'revive') {
      this.reviveT -= dt;
      $('reviveNum').textContent = Math.max(0, Math.ceil(this.reviveT));
      $('reviveArc').setAttribute('stroke-dashoffset', String(276.5 * (1 - clamp(this.reviveT / 5, 0, 1))));
      if (this.reviveT <= 0) finishRun(false);
    }
    if (G.run && ['run', 'levelup', 'chest', 'pause', 'dying', 'revive', 'victory'].includes(G.state)) this.updateHud();
  },

  // ---------- 2D overlay: numbers, health bar, joystick, boss arrows ----------
  drawOverlay(dt) {
    const c = this.overlay, ctx = this.octx, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = R.cssW, h = R.cssH;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const run = G.run;
    const inRun = run && ['run', 'dying', 'victory', 'levelup', 'chest', 'pause', 'revive'].includes(G.state);
    if (!inRun) return;
    const p = [0, 0];
    // damage numbers
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const n of G.numbers) {
      if (G.state === 'run' || G.state === 'victory' || G.state === 'dying') n.t += dt;
      const life = 0.75, u = n.t / life;
      if (u >= 1) continue;
      if (!R.project(n.x, n.y + u * 0.9, n.z, p)) continue;
      const v = Math.round(n.v);
      const size = clamp(15 + Math.log10(Math.max(1, v)) * 7, 15, 34);
      const pop = n.t < 0.12 ? 1 + (1 - n.t / 0.12) * 0.5 : 1;
      ctx.globalAlpha = u > 0.65 ? 1 - (u - 0.65) / 0.35 : 1;
      ctx.font = `700 ${Math.round(size * pop)}px Fredoka, ui-rounded, system-ui, sans-serif`;
      ctx.lineWidth = 4; ctx.strokeStyle = '#0a1f33';
      ctx.strokeText(v, p[0], p[1]);
      ctx.fillStyle = n.color ? `rgb(${n.color.map(x => Math.round(x * 255)).join(',')})` : '#ffffff';
      ctx.fillText(v, p[0], p[1]);
    }
    G.numbers = G.numbers.filter(n => n.t < 0.75);
    ctx.globalAlpha = 1;
    // hero health bar
    const hp = G.hero.pos;
    if (G.state !== 'dying' && R.project(hp[0], -0.15, hp[2], p)) {
      const bw = 58, bh = 9, x = p[0] - bw / 2, y = p[1] + 10, f = clamp(run.hp / run.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(5,15,25,0.8)'; roundRect(ctx, x - 2, y - 2, bw + 4, bh + 4, 6); ctx.fill();
      const col = f > 0.5 ? '#5cf2ae' : f > 0.25 ? '#ffc63a' : '#ff4d3d';
      ctx.fillStyle = col; roundRect(ctx, x, y, Math.max(4, bw * f), bh, 4.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(ctx, x + 2, y + 1, Math.max(0, bw * f - 4), 3, 2); ctx.fill();
    }
    // arrows toward off-screen bosses
    for (const b of run.bosses) {
      if (b.dying || onScreen(b.x, b.z, -0.5)) continue;
      if (!R.project(b.x, 1, b.z, p)) continue;
      const cx = w / 2, cy = h / 2, dx = p[0] - cx, dy = p[1] - cy;
      const k = Math.min((w / 2 - 34) / Math.abs(dx || 1e-3), (h / 2 - 34) / Math.abs(dy || 1e-3));
      const ax = cx + dx * k, ay = cy + dy * k, ang = Math.atan2(dy, dx);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
      ctx.fillStyle = '#ff6a3a'; ctx.strokeStyle = '#0a1f33'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-10, -13); ctx.lineTo(-4, 0); ctx.lineTo(-10, 13); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.restore();
    }
    // joystick
    const J = INPUT.stick;
    if (J.active && G.state === 'run') {
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(J.ox, J.oy, 58, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
      const dx = J.x - J.ox, dy = J.y - J.oy, m = Math.hypot(dx, dy), kk = m > 58 ? 58 / m : 1;
      ctx.globalAlpha = 0.55; ctx.fillStyle = '#8ef3ff';
      ctx.beginPath(); ctx.arc(J.ox + dx * kk, J.oy + dy * kk, 24, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
  },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- level-up choices ----------
function rollChoices() {
  const run = G.run, owned = run.slots, many = owned.length >= 4, full = owned.length >= 8;
  const pool = [];
  for (const s of owned) {
    const max = maxLevel(s.id);
    if (s.lvl < max) pool.push({ id: s.id, w: many ? 1.6 : 1.1 });
  }
  if (!full) {
    for (const id in SKILLS) if (!slotOf(id)) pool.push({ id, w: many ? 0.55 : 1 });
    for (const id in PASSIVES) if (!slotOf(id)) pool.push({ id, w: many ? 0.45 : 0.7 });
  }
  const out = [];
  while (out.length < 3 && pool.length) {
    let r = Math.random() * pool.reduce((a, c) => a + c.w, 0), i = 0;
    while ((r -= pool[i].w) > 0 && i < pool.length - 1) i++;
    out.push({ id: pool[i].id });
    pool.splice(i, 1);
  }
  if (!out.length) out.push({ id: 'snack' });
  return out;
}
function fmtStat(v, unit) {
  if (v === 0) return '—';
  if (unit === 's') return v + 's';
  if (unit === 'm') return v + ' m';
  if (unit === '%') return v + '%';
  if (unit === '°/s') return v + '°/s';
  return String(v);
}
function describeChoice(c) {
  if (c.id === 'snack') return { tag: 'HEAL', name: 'Goo Snack', desc: 'Recover 30% of your health.', icon: 'passive-regen', kind: 'passive', isNew: true };
  const sk = SKILLS[c.id], ps = PASSIVES[c.id], lvl = lvlOf(c.id);
  if (sk) {
    if (!lvl) {
      const f = sk.fields.slice(0, 2).map(([k, label, unit]) => `${label} <em>${fmtStat(sk.levels[0][k], unit)}</em>`).join(' · ');
      return { tag: 'NEW SKILL', name: sk.name, desc: `${sk.intro}<br>${f}`, icon: 'skill-' + c.id, kind: 'skill', isNew: true };
    }
    const parts = [];
    for (const [k, label, unit] of sk.fields) {
      const a = sk.levels[lvl - 1][k], b = sk.levels[lvl][k];
      if (a !== b) parts.push(`${label} <em>${fmtStat(a, unit)} → ${fmtStat(b, unit)}</em>`);
    }
    return { tag: `LV ${lvl} → ${lvl + 1}`, name: sk.name, desc: parts.join(' · '), icon: 'skill-' + c.id, kind: 'skill', isNew: false };
  }
  return { tag: lvl ? `LV ${lvl} → ${lvl + 1}` : 'NEW PASSIVE', name: ps.name, desc: ps.desc, icon: 'passive-' + c.id, kind: 'passive', isNew: !lvl };
}
function applyChoice(c) {
  const run = G.run;
  if (c.id === 'snack') { run.hp = Math.min(run.maxHp, run.hp + run.maxHp * 0.3); return; }
  addOrLevel(c.id);
}
