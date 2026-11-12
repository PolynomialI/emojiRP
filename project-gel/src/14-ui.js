// ============================================================
// UI: screens, HUD, level-up cards, chest roulette, overlay drawing
// ============================================================
const $ = id => document.getElementById(id);
const UI = {
  menuTab: 'home', homePage: 'land', settingsFrom: null, lastHud: {}, slotSig: '', choiceLock: 0, reviveT: 0, skinPreview: null,
  overlay: null, octx: null, toastT: 0,

  init() {
    this.overlay = $('overlay');
    this.octx = this.overlay.getContext('2d');
    $('btnPlay').addEventListener('click', () => { AUDIO.unlock(); AUDIO.play('click'); if (this.homePage === 'sea') beginSeaChapter(G.save.sea.selected); else beginChapter(G.save.selected); });
    $('btnEndless').addEventListener('click', () => { AUDIO.unlock(); AUDIO.play('click'); beginEndless(); });
    $('btnRush').addEventListener('click', () => { AUDIO.unlock(); AUDIO.play('click'); beginBossRush(); });
    // the chapter arrows step through the page's own chapters (the land's, or the ocean's)
    const pickOf = () => (this.homePage === 'sea' ? G.save.sea : G.save);
    $('chPrev').addEventListener('click', () => { const P = pickOf(); P.selected = Math.max(1, P.selected - 1); AUDIO.play('click'); this.refreshHome(); saveGame(); });
    $('chNext').addEventListener('click', () => { const P = pickOf(); P.selected = Math.min(P.chapter, P.selected + 1); AUDIO.play('click'); this.refreshHome(); saveGame(); });
    document.querySelectorAll('#pageDots button').forEach(b => b.addEventListener('click', () => { AUDIO.unlock(); this.setHomePage(b.dataset.page); }));
    $('pageTab').addEventListener('click', () => { AUDIO.unlock(); this.setHomePage(this.homePage === 'sea' ? 'land' : 'sea'); });
    this.initSwipe();
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { AUDIO.unlock(); AUDIO.play('click'); this.openTab(b.dataset.tab); }));
    document.querySelectorAll('.back').forEach(b => b.addEventListener('click', () => { AUDIO.play('click'); this.openTab('home'); }));
    $('btnSettings').addEventListener('click', () => { AUDIO.unlock(); AUDIO.play('click'); this.openSettings(); });
    $('btnPause').addEventListener('click', () => pauseGame());
    $('btnResume').addEventListener('click', () => resumeGame());
    $('btnPauseSettings').addEventListener('click', () => this.openSettings());
    $('btnQuit').addEventListener('click', () => { $('quitConfirm').hidden = false; $('pauseActions').hidden = true; });
    $('btnRestart').addEventListener('click', () => { $('restartConfirm').hidden = false; $('pauseActions').hidden = true; });
    $('btnRestartNo').addEventListener('click', () => { $('restartConfirm').hidden = true; $('pauseActions').hidden = false; });
    $('btnRestartYes').addEventListener('click', () => { $('restartConfirm').hidden = true; $('pauseActions').hidden = false; restartRun(); });
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
    // the blob on home and on the Blobs screen: drag sideways to spin it all the way round (it keeps a little
    // spin when let go); a tap pokes it. On the Blobs screen only the open space around the blob counts.
    const spinOn = (el, openOnly) => {
      el.addEventListener('pointerdown', e => {
        if (openOnly && e.target !== el) return;
        AUDIO.unlock(); el.setPointerCapture(e.pointerId);
        HOME.drag = { x: e.clientX, t: performance.now(), moved: 0, x0: e.clientX, t0: performance.now(), yaw0: this.homePage === 'sea' ? HOME.yaw : G.hero.yaw }; HOME.yaw = HOME.drag.yaw0; HOME.spinV = 0; HOME.aim = null;
      });
      el.addEventListener('pointermove', e => {
        const d = HOME.drag;
        if (!d) return;
        const dx = e.clientX - d.x, now = performance.now(), dts = Math.max(0.008, (now - d.t) / 1000);
        d.x = e.clientX; d.t = now; d.moved += Math.abs(dx);
        HOME.yaw += dx * 0.012; HOME.spinV = clamp(lerp(HOME.spinV, dx * 0.012 / dts, 0.5), -12, 12);
      });
      const release = () => {
        const d = HOME.drag;
        if (!d) return;
        HOME.drag = null; HOME.idle = 0;
        // a long, quick swipe across the home stage turns the page instead of spinning the blob
        if (!openOnly && Math.abs(d.x - d.x0) > Math.min(260, window.innerWidth * 0.3) && performance.now() - d.t0 < 450) { HOME.spinV = 0; HOME.yaw = d.yaw0; this.swipePage(); return; }
        if (d.moved < 8) { HOME.spinV = 0; pokeHero(); }
        else if (performance.now() - d.t > 90) HOME.spinV = 0;
      };
      el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
    };
    spinOn($('heroTap'), false); spinOn($('skins'), true);
    $('skinAction').addEventListener('click', () => this.skinAction());
    document.querySelectorAll('#blobTabs button').forEach(b => b.addEventListener('click', () => { this.blobTab = b.dataset.bt; AUDIO.play('click'); this.renderSkins(); }));
    this.initGear();
    DEV.init();
  },

  show(id, on) { const e = $(id); if (e) e.hidden = !on; },

  onState(s) {
    const menu = s === 'home';
    this.show('loading', s === 'loading');
    this.show('home', menu && this.menuTab === 'home');
    this.show('skins', menu && this.menuTab === 'skins');
    this.show('gear', menu && this.menuTab === 'gear');
    if (!(menu && this.menuTab === 'gear')) { this.show('artInfo', false); this.show('blobUp', false); this.show('scrollChest', false); this.show('fuseBox', false); }
    this.show('chapters', menu && this.menuTab === 'chapters');
    this.show('goals', menu && this.menuTab === 'goals');
    const inRun = ['run', 'levelup', 'chest', 'pause', 'dying', 'revive', 'victory'].includes(s);
    this.show('hud', inRun);
    this.show('levelup', s === 'levelup');
    this.show('chest', s === 'chest');
    this.show('pause', s === 'pause');
    this.show('revive', s === 'revive');
    this.show('results', s === 'results');
    if (s === 'home') this.refreshHome();
    // a banner that is still animating would sit on top of a modal's title
    if (['levelup', 'chest', 'pause', 'revive', 'results'].includes(s)) { $('banner').classList.remove('show'); $('bossCards').classList.remove('show'); }
    if (s === 'revive') this.reviveT = 5;
    // a message left over from the run ("Boss 3 of 15 down!") does not belong on the results
    if (s === 'results') { $('toast').classList.remove('show'); this.toastT = 0; this.fillResults(); goalsCheck(); }
    if (s === 'run') { this.slotSig = ''; }
  },

  openTab(tab) {
    if (this.menuTab === 'skins' && tab !== 'skins') { applySkin(G.save.skin); this.skinPreview = null; this.costumePreview = null; this.hatPreview = null; }
    this.menuTab = tab;
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    if (tab === 'skins') this.renderSkins();
    if (tab === 'gear') this.renderGear();
    if (tab === 'chapters') this.renderChapters();
    if (tab === 'goals') this.renderGoals();
    this.onState(G.state);
  },

  refreshHome() {
    const sv = G.save;
    sv.selected = clamp(sv.selected || 1, 1, sv.chapter);
    document.querySelectorAll('#homeCoins, .coinsVal').forEach(e => { e.textContent = fmtNum(sv.coins); });
    this.refreshPages();
    if (this.homePage === 'sea') { this.refreshSeaHome(); return; }
    const info = chapterInfo(sv.selected);
    $('chLabel').textContent = `Chapter ${sv.selected}${sv.cleared[sv.selected] ? ' · cleared' : ''}`;
    $('chName').textContent = info.arenaName;
    const bossNames = [...new Set(info.bosses)].map(b => BOSS_TYPES[b].name).join(' + ');
    const best = sv.best[sv.selected];
    $('chInfo').textContent = (best ? `Best ${fmtTime(best)} · ` : '') + bossNames;
    const eb = $('btnEndless');
    eb.hidden = !endlessUnlocked();
    eb.innerHTML = sv.endlessBest ? `ENDLESS<small>best ${fmtTime(sv.endlessBest)}</small>` : 'ENDLESS';
    const rb = $('btnRush'), nb = RUSH_BOSSES.length;
    rb.hidden = !rushUnlocked();
    rb.innerHTML = sv.rushTime ? `BOSS RUSH<small>best ${fmtTime(sv.rushTime)}</small>` : sv.rushBest ? `BOSS RUSH<small>best ${sv.rushBest}/${nb}</small>` : 'BOSS RUSH';
    $('chPrev').disabled = sv.selected <= 1;
    $('chNext').disabled = sv.selected >= sv.chapter;
    this.homePortrait();
    this.refreshBadges();
    if (this.menuTab === 'home') goalsCheck();
    applyArena(info.arena);
  },
  // ---------- the two home pages: the land and the ocean ----------
  // The ocean page is always one swipe away; once chapter 20 is beaten it is also shown (page dots, a tab at the
  // edge, and a note the first time). Both pages share the menu buttons; Play sails, and the picker lists the
  // ocean's chapters.
  setHomePage(p) {
    if (p === this.homePage || G.state !== 'home') return;
    this.homePage = p;
    AUDIO.play(p === 'sea' ? 'splash' : 'click');
    homePageChanged();
    this.refreshHome();
  },
  refreshPages() {
    const sea = this.homePage === 'sea', open = seaUnlocked();
    $('home').classList.toggle('sea', sea);
    $('pageDots').hidden = !open; $('pageTab').hidden = !open;
    document.querySelectorAll('#pageDots button').forEach(b => b.setAttribute('aria-current', String(b.dataset.page === this.homePage)));
    $('pageTab').setAttribute('aria-label', sea ? 'Back to the land' : 'Go to the ocean');
    const pb = $('btnPlay');
    pb.textContent = sea ? 'SAIL' : 'PLAY'; pb.classList.toggle('sail', sea); pb.classList.toggle('gold', !sea);
    if (open && !G.save.sea.seen && this.menuTab === 'home') { G.save.sea.seen = true; saveGame(); this.toast('The ocean is open! Swipe right, or tap the arrow, to set sail.', 4); }
  },
  refreshSeaHome() {
    const S = G.save.sea;
    S.selected = clamp(S.selected || 1, 1, S.chapter);
    const n = S.selected, C = SEA_CHAPTERS[n - 1], best = S.best[n];
    $('chLabel').textContent = `Ocean ${n}${S.cleared[n] ? ' · cleared' : ''}`;
    $('chName').textContent = C.name;
    $('chInfo').textContent = (best ? `Best ${fmtTime(best)} · ` : '') + seaBossName(n);
    $('chPrev').disabled = n <= 1;
    $('chNext').disabled = n >= S.chapter;
    // the boss's portrait, once its meshes are built
    const boss = C.boss, img = $('chBoss');
    let icon = ICONS.map['boss-' + boss];
    if (!icon && bossMeshes(boss).every(m => R.enemyDraw[m])) { renderBossPortraitOf(boss); icon = ICONS.map['boss-' + boss]; }
    if (icon) { if (img.getAttribute('src') !== icon) img.src = icon; img.hidden = false; } else img.hidden = true;
    this.refreshBadges();
    if (this.menuTab === 'home') goalsCheck();
    seaLook(n);
  },
  // a sideways swipe across the home screen turns the page (on the blob's stage only a long, quick one:
  // a slow drag there spins the blob)
  initSwipe() {
    const home = $('home');
    let sw = null;
    home.addEventListener('pointerdown', e => {
      if (e.target.closest('button, .home-stage, .panel')) { sw = null; return; }
      sw = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    const end = e => {
      if (!sw) return;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      sw = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) this.swipePage();
    };
    home.addEventListener('pointerup', end); home.addEventListener('pointercancel', () => { sw = null; });
  },
  swipePage() { this.setHomePage(this.homePage === 'sea' ? 'land' : 'sea'); },

  // red dots on the home menu: an upgrade is affordable, a scroll or fuse is waiting, a new look is in reach
  menuAlerts() {
    const sv = G.save;
    const canBuy = list => list.some(s => s.cost > 0 && sv.coins >= s.cost);
    return {
      gear: sv.scrolls > 0 || canFuse() || canMythic() || blobUpAffordable(),
      skins: canBuy(SKINS.filter(s => !sv.skins.includes(s.id))) || canBuy(COSTUMES.filter(c => !sv.costumes.includes(c.id))),
      goals: goalsToClaim(sv) > 0,
    };
  },
  refreshBadges() {
    const al = this.menuAlerts();
    document.querySelectorAll('.mbtn[data-tab]').forEach(b => { const d = b.querySelector('.dot'); if (d) d.hidden = !al[b.dataset.tab]; });
  },
  // the selected chapter's boss portrait in the picker, once its meshes have loaded
  homePortrait() {
    const boss = chapterInfo(G.save.selected).bosses[0], img = $('chBoss');
    let icon = ICONS.map['boss-' + boss];
    if (!icon && bossMeshes(boss).every(m => R.enemyDraw[m])) { renderBossPortraitOf(boss); icon = ICONS.map['boss-' + boss]; }
    if (icon) { if (img.getAttribute('src') !== icon) img.src = icon; img.hidden = false; } else img.hidden = true;
  },

  // ---------- upgrades ----------
  // ---------- skins ----------
  skinIconsReady(keys) {
    document.querySelectorAll('#skinGrid img[data-hero-icon]').forEach(img => {
      if (keys.includes(img.dataset.heroIcon)) { img.src = ICONS.map[img.dataset.heroIcon]; img.classList.remove('pending'); }
    });
  },
  // Three tabs: body colors, costumes and hats. Tapping a card previews it on the blob; the button buys or equips it.
  blobLists() {
    const sv = G.save, tab = this.blobTab === 'costumes' || this.blobTab === 'hats' ? this.blobTab : 'colors';
    if (tab === 'colors') return { tab, list: SKINS, owned: sv.skins, worn: sv.skin, sel: this.skinPreview, key: 'skin-' };
    if (tab === 'costumes') return { tab, list: costumesOf('hood'), owned: sv.costumes, worn: sv.costume, sel: this.costumePreview, key: 'costume-' };
    return { tab, list: costumesOf('hat'), owned: sv.costumes, worn: sv.hat, sel: this.hatPreview, key: 'costume-' };
  },
  renderSkins() {
    const sv = G.save, grid = $('skinGrid');
    if (!this.skinPreview) this.skinPreview = sv.skin;
    if (!this.costumePreview) this.costumePreview = sv.costume;
    if (!this.hatPreview) this.hatPreview = sv.hat;
    const { tab, list, owned, worn, sel, key } = this.blobLists();
    document.querySelectorAll('.coinsVal').forEach(e => { e.textContent = fmtNum(sv.coins); });
    document.querySelectorAll('#blobTabs button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.bt === tab)));
    queueHeroIcons(list.map(s => key + s.id), true);
    grid.replaceChildren(...list.map(s => {
      const b = document.createElement('button');
      b.className = 'skin' + (s.id === sel ? ' sel' : '') + (worn === s.id ? ' worn' : '');
      b.innerHTML = `<img alt=""><span></span><em class="boost"></em><small></small>`;
      // icons not drawn yet fill in as pumpHeroIcons makes them
      const k = key + s.id, img = b.querySelector('img');
      img.dataset.heroIcon = k; if (ICONS.map[k]) img.src = ICONS.map[k]; else img.classList.add('pending');
      b.querySelector('span').textContent = s.id === 'none' ? (tab === 'hats' ? 'No hat' : 'No costume') : s.name;
      b.querySelector('.boost').textContent = s.boost ? fmtBoost(s.boost) : '';
      const sm = b.querySelector('small');
      if (owned.includes(s.id)) sm.textContent = '';
      else if (s.goal) sm.textContent = '🏆';
      else { sm.innerHTML = '<i class="coin"></i><span></span>'; sm.querySelector('span').textContent = fmtNum(s.cost); sm.classList.toggle('poor', sv.coins < s.cost); }
      b.addEventListener('click', () => {
        if (tab === 'colors') this.skinPreview = s.id; else if (tab === 'costumes') this.costumePreview = s.id; else this.hatPreview = s.id;
        applySkin(this.skinPreview, this.costumePreview, this.hatPreview); G.hero.impulse(1.4); AUDIO.play('click'); this.renderSkins();
      });
      return b;
    }));
    const s = list.find(k => k.id === sel) || list[0], act = $('skinAction');
    if (worn === s.id) { act.textContent = 'Equipped'; act.disabled = true; act.className = 'jelly'; }
    else if (owned.includes(s.id)) { act.textContent = 'Equip'; act.disabled = false; act.className = 'jelly'; }
    else if (s.goal) { act.textContent = `🏆 ${GOALS.find(g => g.id === s.goal).name}`; act.disabled = true; act.className = 'jelly'; }
    else { act.innerHTML = `Buy · <i class="coin"></i><span></span>`; act.querySelector('span').textContent = fmtNum(s.cost); act.disabled = sv.coins < s.cost; act.className = 'jelly gold'; }
  },
  skinAction() {
    const sv = G.save, { tab, list, owned, sel } = this.blobLists();
    const s = list.find(k => k.id === sel);
    if (!s) return;
    if (!owned.includes(s.id)) {
      if (s.goal || sv.coins < s.cost) return;
      sv.coins -= s.cost; owned.push(s.id); AUDIO.play('coin'); this.toast(`${s.name} unlocked`);
    }
    if (tab === 'colors') sv.skin = s.id; else if (tab === 'costumes') sv.costume = s.id; else sv.hat = s.id;
    saveGame(); AUDIO.play('levelup'); G.hero.impulse(2);
    this.renderSkins(); this.refreshHome();
  },

  // ---------- chapter map ----------
  renderChapters() {
    const sv = G.save, map = $('chMap');
    // boss portraits need a GPU readback, so they are drawn here, only when the map is opened
    for (const id in BOSS_TYPES) if (!ICONS.map['boss-' + id] && bossMeshes(id).every(m => R.enemyDraw[m])) renderBossPortraitOf(id);
    // every chapter at once, locked ones too
    const nodes = [];
    for (let n = CHAPTER_COUNT; n >= 1; n--) {
      const info = chapterInfo(n), b = document.createElement('button');
      const locked = n > sv.chapter, cleared = !!sv.cleared[n];
      b.className = 'node' + (locked ? ' locked' : '') + (cleared ? ' cleared' : '') + (n === sv.selected ? ' current' : '') + (n % 5 === 0 ? ' big' : '');
      b.innerHTML = `<span class="num"></span><span><span class="nm"></span><span class="ds"></span></span>`;
      const boss = info.bosses[0], icon = ICONS.get('boss-' + boss);
      if (icon && !locked) { const im = document.createElement('img'); im.alt = ''; im.src = icon; b.querySelector('.num').append(im); }
      else if (locked) b.querySelector('.num').innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><rect x="4.5" y="10" width="15" height="11" rx="3" fill="currentColor"/></svg>';
      else b.querySelector('.num').textContent = n;
      b.querySelector('.nm').textContent = `Chapter ${n}`;
      const names = [...new Set(info.bosses)].map(x => BOSS_TYPES[x].name).join(' + ');
      b.querySelector('.ds').textContent = locked ? info.arenaName : `${info.arenaName} · ${names}${sv.best[n] ? ' · ' + fmtTime(sv.best[n]) : ''}`;
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
    this.setText('lv', $('xpText'), 'LEVEL ' + run.level);
    this.setText('coins', $('hudCoinsVal'), fmtNum(run.coins));
    const sig = run.slots.map(s => s.id + s.lvl + (s.evo ? '*' : '')).join(',');
    if (sig !== this.slotSig) {
      this.slotSig = sig;
      // two groups of boxes: skills, then passives
      const cells = [];
      for (const kind of ['skill', 'passive']) {
        const list = run.slots.filter(s => s.kind === kind);
        for (let i = 0; i < SLOT_LIMIT[kind]; i++) {
          const s = list[i], d = document.createElement('div');
          if (s) {
            d.className = 'slot ' + s.kind + (s.evo ? ' evo' : '');
            d.innerHTML = `<img alt=""><u><i style="width:${(s.lvl / maxLevel(s.id)) * 100}%"></i></u>`;
            d.querySelector('img').src = ICONS.get((s.kind === 'skill' ? 'skill-' : 'passive-') + s.id);
          } else d.className = 'slot empty-' + kind;
          cells.push(d);
        }
        if (kind === 'skill') { const gap = document.createElement('span'); gap.className = 'slot-gap'; cells.push(gap); }
      }
      $('slots').replaceChildren(...cells);
    }
    this.updateAbilities(run);
    // the chapter bar fills toward the boss, then shows the boss's health (in the cave: the rooms, then the Bagger)
    const bossOn = (run.bossStarted && run.bosses.some(b => !b.dying)) || !!(run.cave && run.cave.boss);
    if (L.boss !== bossOn) { L.boss = bossOn; $('chapBar').classList.toggle('boss', bossOn); }
    let pct, label;
    if (run.cave && run.cave.boss) { pct = clamp(run.cave.boss.hp / run.cave.boss.maxHp, 0, 1); label = 'THE BAGGER'; }
    // (how many rooms each way is never shown)
    else if (run.cave) { pct = 0; label = 'THE CAVE'; }
    else if (bossOn) {
      const hp = run.bosses.reduce((s, b) => s + Math.max(0, b.dying ? 0 : b.hp), 0);
      pct = clamp(hp / run.bossTotalHp, 0, 1);
      label = [...new Set(run.bosses.map(b => b.def.name))].join(' + ').toUpperCase();
    } else {
      pct = run.rush ? run.rushK / RUSH_BOSSES.length : run.endless ? (run.t % 60) / 60 : run.bossStarted ? 0 : clamp(run.t / 300, 0, 1);
      label = run.rush ? `BOSS RUSH · ${run.rushK}/${RUSH_BOSSES.length}` : run.endless ? 'ENDLESS · ' + fmtTime(run.t) : (run.sea ? 'OCEAN ' : 'CHAPTER ') + run.chapter;
      // the crater: the bar fills to the cave (85%) and waits there
      if (craterOpenNow()) { pct = Math.min(pct, CRATER.open / 300); if (ARENA.fx && ARENA.fx.st.open) label = 'ENTER THE CAVE'; }
    }
    const pctS = (pct * 100).toFixed(1) + '%';
    if (L.chap !== pctS) { L.chap = pctS; $('chapFill').style.width = pctS; }
    this.setText('chapText', $('chapText'), label);
  },
  banner(text, boss = false) {
    const b = $('banner');
    b.className = boss ? 'boss' : '';
    if (boss) { b.innerHTML = '<span class="warn">WARNING</span>'; b.append(document.createTextNode(text)); }
    else b.textContent = text;
    void b.offsetWidth;
    b.classList.add('show');
  },
  // a card for each boss dropping in: portrait, name and what to watch for
  bossIntro(ids) {
    const wrap = $('bossCards');
    wrap.replaceChildren(...ids.map(id => {
      const c = document.createElement('div');
      c.className = 'bosscard';
      c.innerHTML = '<img alt=""><div><small>WARNING</small><b></b><span></span></div>';
      const icon = ICONS.map['boss-' + id], img = c.querySelector('img');
      if (icon) img.src = icon; else img.hidden = true;
      c.querySelector('b').textContent = BOSS_TYPES[id].name;
      const B = BOSS_TYPES[id], nm = l => l.map(k => (SKILLS[k] ? SKILLS[k].name : k)).join(', ');
      c.querySelector('span').textContent = (BOSS_HINTS[id] || '') + (B.weak ? ` Weak to ${nm(B.weak)}.` : '') + (B.immune ? ` Immune to ${nm(B.immune)}.` : '');
      return c;
    }));
    wrap.classList.remove('show'); void wrap.offsetWidth; wrap.classList.add('show');
  },
  // the ability buttons at the bottom left (12d-abilities.js): rebuilt when the set changes, cooldowns every frame
  updateAbilities(run) {
    const list = abilitySlots(), sig = list.map(s => s.id).join(',');
    if (sig !== this.abilSig || run !== this.abilRun) {
      const had = run === this.abilRun ? (this.abilSig || '').split(',') : [];
      list.forEach((s, i) => { if (run === this.abilRun && !had.includes(s.id)) this.toast(`New ability: ${ABILITIES[s.id].name}! Press ${i + 1} or tap it`, 3.2); });
      this.abilSig = sig; this.abilRun = run;
      $('abilBar').replaceChildren(...list.map((s, i) => {
        const A = ABILITIES[s.id], b = document.createElement('button');
        b.className = 'abil'; b.title = `${A.name} (${i + 1}): ${A.desc}`; b.setAttribute('aria-label', A.name);
        b.innerHTML = `<img alt=""><i class="cdm"></i><em class="cdt"></em><kbd>${i + 1}</kbd>`;
        b.querySelector('img').src = ICONS.get('skill-' + s.id);
        b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); useAbility(i); });
        b.dataset.id = s.id;
        return b;
      }));
    }
    for (const b of $('abilBar').children) {
      const cd = abilityCd(b.dataset.id), pct = Math.round(cd / ABILITIES[b.dataset.id].cd * 100), txt = cd > 0 ? String(Math.ceil(cd)) : '';
      if (b.dataset.pct !== String(pct)) { b.dataset.pct = pct; b.querySelector('.cdm').style.height = pct + '%'; b.classList.toggle('ready', pct === 0); }
      if (b.dataset.txt !== txt) { b.dataset.txt = txt; b.querySelector('.cdt').textContent = txt; }
    }
  },
  toast(msg, secs = 1.6) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); this.toastT = secs; },

  // ---------- level up ----------
  openLevelUp() {
    const run = G.run;
    run.choices = rollChoices();
    // (a level with nothing to offer passes quietly)
    if (!run.choices.length) { run.pending = Math.max(0, run.pending - 1); return; }
    this.renderChoices();
    $('luSub').textContent = `Level ${run.level - run.pending + 1}`;
    this.choiceLock = performance.now() + 350;
    AUDIO.play('levelup');
    setState('levelup');
  },
  renderChoices() {
    const run = G.run;
    $('luCards').replaceChildren(...run.choices.map((c, i) => {
      const d = describeChoice(c), b = document.createElement('button');
      b.className = 'card';
      b.innerHTML = `<span class="tile ${d.kind}"><img alt=""></span><span><span class="nm"></span><span class="pips"></span><span class="ds"></span></span>`;
      b.querySelector('img').src = ICONS.get(d.icon);
      b.querySelector('.nm').textContent = d.name + (d.evo ? ' ★' : '');
      // level dots: filled up to the level this pick reaches
      if (d.max > 1) b.querySelector('.pips').innerHTML = Array.from({ length: d.max }, (_, k) => `<i class="${k < d.lvl ? 'on' : ''}"></i>`).join('');
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
    this.chestRun = G.run;
    const run = G.run;
    run.chestQueued--;
    // a random upgrade; only now and then (1 in 8) an evolution, if one is ready. Skills at level 8 and up
    // come up half as often, so the last levels before an evolution take a while
    const evos = evolvable();
    this.chestEvo = evos.length && Math.random() < 0.125 ? pick(evos).id : null;
    const n = this.chestEvo ? 0 : 1;
    const results = [];
    for (let k = 0; k < n; k++) {
      const up = run.slots.filter(s => s.lvl < maxLevel(s.id) - results.filter(x => x === s.id).length);
      if (!up.length) break;
      const w = up.map(s => (s.kind === 'skill' ? (s.lvl >= 8 ? 0.5 : 1.5) : 1));
      let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0;
      while ((r -= w[i]) > 0 && i < up.length - 1) i++;
      results.push(up[i].id);
    }
    this.chestResults = results;
    this.chestCoins = results.length || this.chestEvo ? 0 : 40;
    const pool = run.slots.map(s => (s.kind === 'skill' ? 'skill-' : 'passive-') + s.id);
    const strip = $('chStrip'), tiles = [];
    const total = 34, land = 28;
    const landKey = this.chestEvo ? 'skill-' + this.chestEvo : results.length ? (SKILLS[results[0]] ? 'skill-' : 'passive-') + results[0] : 'meta-offline';
    for (let i = 0; i < total; i++) {
      const key = i === land ? landKey : pick(pool);
      const t = document.createElement('span'); t.className = 'tile' + (i === land && this.chestEvo ? ' evo' : ''); const im = document.createElement('img'); im.alt = ''; im.src = ICONS.get(key); t.append(im); tiles.push(t);
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
    if (!G.run || G.run !== this.chestRun) return; // the run ended while the chest was spinning
    const res = $('chRes'), rows = [];
    if (this.chestEvo) {
      const id = this.chestEvo, E = EVOLUTIONS[id];
      evolveSkill(id);
      const d = document.createElement('div');
      d.className = 'evo-row';
      d.innerHTML = `<span class="tile evo"><img alt=""></span><span><b></b><br><small></small></span>`;
      d.querySelector('img').src = ICONS.get('skill-' + id);
      d.querySelector('b').textContent = `EVOLVED! ${SKILLS[id].name} → ${E.name}`;
      d.querySelector('small').textContent = E.desc;
      rows.push(d);
      AUDIO.play('levelup', 0.75);
    } else if (this.chestResults.length) {
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
    $('pauseSub').textContent = `${run.rush ? `Boss Rush ${run.rushK}/${RUSH_BOSSES.length}` : run.endless ? 'Endless' : 'Chapter ' + run.chapter} · ${fmtTime(run.t)} · Level ${run.level}`;
    $('pauseList').replaceChildren(...run.slots.map(s => {
      const d = document.createElement('div'), max = maxLevel(s.id);
      d.innerHTML = `<span class="tile ${s.kind}"><img alt=""></span><span></span><span class="dots"></span>`;
      d.querySelector('img').src = ICONS.get((s.kind === 'skill' ? 'skill-' : 'passive-') + s.id);
      d.querySelector('span:nth-child(2)').textContent = s.evo ? '★ ' + EVOLUTIONS[s.id].name : (SKILLS[s.id] || PASSIVES[s.id]).name;
      if (s.evo) d.querySelector('.tile').classList.add('evo');
      d.querySelector('.dots').innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < s.lvl ? 'on' : ''}"></i>`).join('');
      return d;
    }));
    $('quitConfirm').hidden = true; $('restartConfirm').hidden = true; $('pauseActions').hidden = false;
  },
  fillResults() {
    const run = G.run;
    if (!run) return;
    $('resEyebrow').textContent = run.sea ? `Ocean ${run.chapter} · ${run.info.arenaName}` : run.rush ? `Boss Rush · ${run.info.arenaName}` : run.endless ? `Endless · ${run.info.arenaName}` : `Chapter ${run.chapter} · ${run.info.arenaName}`;
    const t = $('resTitle');
    const special = run.endless || run.rush;
    t.textContent = run.won ? (run.rush ? 'CHAMPION!' : 'CLEARED!') : special && run.newBest ? 'NEW BEST!' : run.sea ? 'SUNK!' : 'YOU MELTED';
    t.style.color = run.won || (special && run.newBest) ? 'var(--mint)' : 'var(--pink)';
    $('resTime').textContent = fmtTime(run.t);
    $('resKills').textContent = fmtNum(run.kills);
    $('resLevel').textContent = run.level;
    $('resCoins').textContent = '+' + fmtNum(run.earned || 0);
    $('resBreak').textContent = run.rush ? `${run.rushK} of ${RUSH_BOSSES.length} bosses beaten · ${fmtNum(run.coins)} picked up + ${fmtNum(run.reward)} for the bosses`
      : run.endless ? `${fmtNum(run.coins)} picked up + ${fmtNum(run.reward)} for surviving · best ${fmtTime(G.save.endlessBest || 0)}`
      : run.won ? `${fmtNum(run.coins)} picked up + ${fmtNum(run.reward)} for clearing the chapter` : `${fmtNum(run.coins)} picked up. Clear the boss for a bigger reward.`;
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
      const v = typeof n.v === 'string' ? n.v : Math.round(n.v);
      const size = typeof v === 'string' ? 18 : clamp(15 + Math.log10(Math.max(1, v)) * 7, 15, 34);
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
    if (run.cave) { caveOverlay(ctx, w, h, dt); return; }
    // hero health bar
    const hp = G.hero.pos;
    if (G.state !== 'dying' && R.project(hp[0], -0.15, hp[2], p)) {
      const bw = 58, bh = 9, x = p[0] - bw / 2, y = p[1] + 10, f = clamp(run.hp / run.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(5,15,25,0.8)'; roundRect(ctx, x - 2, y - 2, bw + 4, bh + 4, 6); ctx.fill();
      const col = f > 0.5 ? '#5cf2ae' : f > 0.25 ? '#ffc63a' : '#ff4d3d';
      ctx.fillStyle = col; roundRect(ctx, x, y, Math.max(4, bw * f), bh, 4.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(ctx, x + 2, y + 1, Math.max(0, bw * f - 4), 3, 2); ctx.fill();
    }
    // minibosses: a gold health bar over each one
    for (const e of run.enemies) {
      if (!e.mini || e.dying || !R.project(e.x, (e.y || 0) + e.scale * 1.15 + 0.5, e.z, p)) continue;
      const bw = 92, bh = 10, x = p[0] - bw / 2, y = p[1], f = clamp(e.hp / e.maxHp, 0, 1);
      ctx.fillStyle = 'rgba(5,15,25,0.85)'; roundRect(ctx, x - 2, y - 2, bw + 4, bh + 4, 6); ctx.fill();
      ctx.fillStyle = e.ai && e.ai.stage2 ? '#ff4d3d' : '#ffc63a'; roundRect(ctx, x, y, Math.max(4, bw * f), bh, 5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; roundRect(ctx, x + 2, y + 1, Math.max(0, bw * f - 4), 3, 2); ctx.fill();
    }
    // a pointer at the screen edge toward something off screen; returns where its badge goes
    const edgeArrow = (col) => {
      const cx = w / 2, cy = h / 2, dx = p[0] - cx, dy = p[1] - cy;
      const pad = 58, top = 150;
      const k = Math.min((w / 2 - pad) / Math.abs(dx || 1e-3), ((dy < 0 ? cy - top : h - cy - pad)) / Math.abs(dy || 1e-3));
      const ax = cx + dx * k, ay = cy + dy * k, ang = Math.atan2(dy, dx);
      const bob = Math.sin(performance.now() / 160) * 3;
      ctx.save(); ctx.translate(ax + Math.cos(ang) * bob, ay + Math.sin(ang) * bob);
      ctx.rotate(ang);
      ctx.fillStyle = col; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(26, -16); ctx.lineTo(26, 16); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.restore();
      return [ax, ay];
    };
    // a gold pointer toward a Golden Gooblin running off screen
    for (const e of run.enemies) {
      if (!e.def.flee || e.dying || onScreen(e.x, e.z, -0.5) || !R.project(e.x, 1, e.z, p)) continue;
      const [ax, ay] = edgeArrow('#ffc93a');
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ax, ay, 22, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffc93a'; ctx.beginPath(); ctx.arc(ax, ay, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8a5a00'; ctx.font = '800 22px Fredoka, ui-rounded, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', ax, ay + 1);
    }
    // arrows toward off-screen bosses: a red pointer at the screen edge with the boss's face
    for (const b of run.bosses) {
      if (b.dying || onScreen(b.x, b.z, -0.5)) continue;
      if (!R.project(b.x, 1, b.z, p)) continue;
      const [ax, ay] = edgeArrow('#ff4d5a');
      const img = this.bossImage(b.type);
      ctx.save(); ctx.translate(ax, ay);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, 27, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ff4d5a'; ctx.beginPath(); ctx.arc(0, 0, 23, 0, TAU); ctx.fill();
      if (img && img.complete && img.naturalWidth) { ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.clip(); ctx.drawImage(img, -30, -26, 60, 60); }
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

UI.bossImg = {};
UI.bossImage = function (id) {
  const src = ICONS.map['boss-' + id];
  if (!src) return null;
  let im = this.bossImg[id];
  if (!im || im.src !== src) { im = new Image(); im.src = src; this.bossImg[id] = im; }
  return im;
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// ---------- level-up choices ----------
function rollChoices() {
  // up to SLOT_LIMIT different skills and passives; once a kind is full only upgrades of it are offered
  const run = G.run, owned = run.slots, many = owned.length >= 4;
  const nSkills = owned.filter(s => s.kind === 'skill').length, nPassives = owned.length - nSkills;
  const pool = [];
  for (const s of owned) {
    const max = maxLevel(s.id);
    // (at sea the next ship comes up more often: it is the hull's main defense)
    if (s.lvl < max) pool.push({ id: s.id, w: (many ? 1.6 : 1.1) * (s.id === 'ship' ? 1.8 : 1) * (s.kind === 'skill' && s.lvl >= 8 && s.id !== 'ship' ? 0.45 : 1) });
  }
  // power-ups unlock by chapter; the one a chapter introduces is offered three times as often there
  // (the sea and the land each have their own upgrades)
  const open = def => !def.sea === !run.sea && (def.from || 1) <= run.powerCap, feat = run.endless || run.rush ? null : featuredPowerup(run.chapter);
  if (nSkills < SLOT_LIMIT.skill) for (const id in SKILLS) if (!slotOf(id) && open(SKILLS[id])) pool.push({ id, w: (many ? 0.55 : 1) * (id === feat ? 3 : 1) * (SKILLS[id].rare ? 0.3 : 1) });
  if (nPassives < SLOT_LIMIT.passive) for (const id in PASSIVES) if (!slotOf(id) && open(PASSIVES[id])) pool.push({ id, w: (many ? 0.45 : 0.7) * (id === feat ? 3 : 1) });
  const out = [];
  while (out.length < 3 && pool.length) {
    let r = Math.random() * pool.reduce((a, c) => a + c.w, 0), i = 0;
    while ((r -= pool[i].w) > 0 && i < pool.length - 1) i++;
    out.push({ id: pool[i].id });
    pool.splice(i, 1);
  }
  // everything maxed: a Goo Snack every other level, nothing on the levels between
  if (!out.length && run.level % 2 === 0) out.push({ id: 'snack' });
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
// a line under a card naming the evolution this skill or ability is part of
// a level-up card: name, level dots and one short number line (no sentences); ★ marks a skill that can
// evolve, or an ability that would evolve a skill you hold
function describeChoice(c) {
  if (c.id === 'snack') return { name: 'Goo Snack', desc: '+12% health', icon: 'passive-regen', kind: 'passive', lvl: 1, max: 1 };
  const sk = SKILLS[c.id], ps = PASSIVES[c.id], lvl = lvlOf(c.id), max = maxLevel(c.id);
  if (sk) {
    const fields = sk.fields;
    let line;
    if (!lvl) { const [k, label, unit] = fields[0]; line = `${label} <em>${fmtStat(sk.levels[0][k], unit)}</em>`; }
    else {
      const f = fields.find(([k]) => sk.levels[lvl - 1][k] !== sk.levels[lvl][k]) || fields[0], [k, label, unit] = f;
      line = `${label} <em>${fmtStat(sk.levels[lvl - 1][k], unit)} → ${fmtStat(sk.levels[lvl][k], unit)}</em>`;
    }
    if (ABILITIES[c.id] && lvl + 1 === max) line += `<br><b class="abil-note">Max level: unlocks the ${ABILITIES[c.id].name} ability</b>`;
    return { name: sk.name, desc: line, icon: 'skill-' + c.id, kind: 'skill', lvl: lvl + 1, max, evo: !!EVOLUTIONS[c.id] };
  }
  const partner = Object.keys(EVOLUTIONS).some(k => EVOLUTIONS[k].with === c.id && G.run && slotOf(k) && !slotOf(k).evo);
  return { name: ps.name, desc: `<em>${ps.short}</em>`, icon: 'passive-' + c.id, kind: 'passive', lvl: lvl + 1, max, evo: partner };
}
function applyChoice(c) {
  const run = G.run;
  if (c.id === 'snack') { run.hp = Math.min(run.maxHp, run.hp + run.maxHp * 0.12); return; }
  addOrLevel(c.id);
}
