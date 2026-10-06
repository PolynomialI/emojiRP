// ============================================================
// Dev console: typing "specimen" unlocks and opens it; after that the
// backtick key opens and closes it. The run is frozen while it is open.
// ============================================================
const DEV = {
  open: false, buf: '', hist: [], hi: 0, god: false, speed: 1,

  init() {
    const inp = $('devIn');
    inp.addEventListener('keydown', e => this.inputKey(e));
    $('devClose').addEventListener('click', () => this.toggle(false));
  },

  // called first by the window keydown handler; true means the game must ignore the key
  onKey(e) {
    if (e.target === $('devIn')) return true;
    const tick = e.key === '`' || e.key === '~' || e.code === 'Backquote';
    if (tick && G.save && G.save.devUnlocked) { e.preventDefault(); this.toggle(); return true; }
    if (/^[a-z]$/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      this.buf = (this.buf + e.key.toLowerCase()).slice(-8);
      if (this.buf === 'specimen') {
        this.buf = '';
        if (!G.save.devUnlocked) { G.save.devUnlocked = true; saveGame(); this.log('Dev console unlocked. Press ` (backtick) to open or close it. Type help for commands.', 'ok'); }
        e.preventDefault();
        this.toggle(true);
        return true;
      }
    }
    return this.open;
  },

  toggle(on = !this.open) {
    this.open = on;
    UI.show('dev', on);
    INPUT.keys.clear();
    const inp = $('devIn');
    // focus right away (the opening key's default is prevented, so it is not typed into the box)
    if (on) { inp.focus(); if (!$('devLog').childElementCount) this.log('Type help for a list of commands.'); }
    else inp.blur();
  },

  inputKey(e) {
    const inp = $('devIn');
    if (e.key === 'Enter') {
      const line = inp.value.trim();
      inp.value = '';
      if (line) { this.hist.push(line); this.hi = this.hist.length; this.run(line); }
    } else if (e.key === 'Escape' || e.key === '`' || e.code === 'Backquote') {
      e.preventDefault(); this.toggle(false);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      this.hi = clamp(this.hi + (e.key === 'ArrowUp' ? -1 : 1), 0, this.hist.length);
      inp.value = this.hist[this.hi] || '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const w = inp.value.trim().toLowerCase(), m = Object.keys(DEV_CMDS).filter(c => c.startsWith(w));
      if (m.length === 1) inp.value = m[0] + ' ';
      else if (m.length) this.log(m.join('  '));
    }
    e.stopPropagation();
  },

  log(text, kind = '') {
    const box = $('devLog'), d = document.createElement('div');
    d.className = kind; d.textContent = text;
    box.append(d);
    while (box.childElementCount > 200) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  },

  run(line) {
    this.log('> ' + line, 'cmd');
    const [name, ...args] = line.split(/\s+/), c = DEV_CMDS[name.toLowerCase()];
    if (!c) { this.log(`Unknown command "${name}". Type help.`, 'err'); return; }
    try {
      const out = c.run(args);
      if (out) this.log(out, 'ok');
    } catch (err) { this.log(err.message, 'err'); }
  },
};

// ---------- commands ----------
const devNum = (v, def) => { if (v === undefined || v === '') return def; const n = Number(v); if (!Number.isFinite(n)) throw new Error(`"${v}" is not a number`); return n; };
const devRun = () => { if (!G.run || G.run.over || !['run', 'pause', 'levelup', 'chest', 'victory'].includes(G.state)) throw new Error('Start a run first.'); return G.run; };
const devRefresh = () => { saveGame(); UI.refreshHome(); if (UI.menuTab === 'gear') UI.renderGear(); if (UI.menuTab === 'skins') UI.renderSkins(); };
const devNear = (r0, r1) => { const h = G.hero.pos, a = rand(0, TAU), r = rand(r0, r1), o = { x: h[0] + Math.cos(a) * r, z: h[2] + Math.sin(a) * r }; resolveCircle(o, 0.5); return o; };
const DEV_CMDS = {
  help: { args: '', desc: 'list the commands', run: () => Object.keys(DEV_CMDS).map(k => `${k} ${DEV_CMDS[k].args}`.trim().padEnd(30) + DEV_CMDS[k].desc).join('\n') },
  coins: { args: '[n]', desc: 'add coins (default 10000)', run: a => { G.save.coins += devNum(a[0], 10000); devRefresh(); return `Coins: ${fmtNum(G.save.coins)}`; } },
  scrolls: { args: '[n]', desc: 'add scrolls (default 5)', run: a => { G.save.scrolls = (G.save.scrolls || 0) + devNum(a[0], 5); devRefresh(); return `Scrolls: ${G.save.scrolls}`; } },
  artifact: {
    args: '<id|all|random> [rarity] [n]', desc: 'add artifacts; rarity 0-4 or a name',
    run: a => {
      const ids = Object.keys(ARTIFACTS), want = (a[0] || '').toLowerCase();
      const rArg = (a[1] || '0').toLowerCase(), byName = RARITIES.findIndex(r => r.id.startsWith(rArg));
      const r = /^\d$/.test(rArg) ? clamp(Number(rArg), 0, 4) : byName;
      if (r < 0) throw new Error(`Unknown rarity "${a[1]}". Use 0-4 or ${RARITIES.map(x => x.id).join(', ')}.`);
      const n = devNum(a[2], 1);
      const list = want === 'all' ? ids : want === 'random' ? [null] : ids.filter(i => i.toLowerCase() === want);
      if (!list.length) throw new Error(`Unknown artifact. Use all, random or one of: ${ids.join(', ')}`);
      const got = [];
      for (const id of list) for (let i = 0; i < n; i++) { const k = id ? artKey(id, r) : rollArtifact(); addArtifact(k); got.push(k); }
      devRefresh();
      return `Added ${got.length}: ${[...new Set(got)].map(k => RARITIES[artParse(k).r].name + ' ' + artParse(k).def.name).join(', ')}`;
    },
  },
  chapter: { args: '<n>', desc: 'unlock chapters up to n and select it', run: a => { const n = clamp(Math.round(devNum(a[0], G.save.chapter + 1)), 1, 300); G.save.chapter = Math.max(G.save.chapter, n); for (let i = 1; i < n; i++) G.save.cleared[i] = true; G.save.selected = n; devRefresh(); return `Chapter ${n} selected`; } },
  unlock: { args: '', desc: 'own every body color and costume', run: () => { G.save.skins = SKINS.map(s => s.id); G.save.costumes = COSTUMES.map(c => c.id); devRefresh(); return 'All colors and costumes unlocked'; } },
  god: { args: '', desc: 'toggle invulnerability', run: () => { DEV.god = !DEV.god; return `God mode ${DEV.god ? 'on' : 'off'}`; } },
  heal: { args: '', desc: 'refill health', run: () => { const r = devRun(); r.hp = r.maxHp; return 'Healed'; } },
  level: { args: '[n]', desc: 'gain levels in the run (default 1)', run: a => { const r = devRun(), n = clamp(Math.round(devNum(a[0], 1)), 1, 50); for (let i = 0; i < n; i++) { r.level++; r.xpNext = xpFor(r.level); r.pending++; } r.xp = 0; return `Level ${r.level}; close the console to pick`; } },
  skill: {
    args: '<id> [levels]', desc: 'add or level a skill or passive in the run',
    run: a => {
      const r = devRun(), id = a[0] && Object.keys({ ...SKILLS, ...PASSIVES }).find(k => k.toLowerCase() === a[0].toLowerCase());
      if (!id) throw new Error(`Unknown skill. Skills: ${Object.keys(SKILLS).join(', ')}. Passives: ${Object.keys(PASSIVES).join(', ')}`);
      const n = clamp(Math.round(devNum(a[1], 1)), 1, 10);
      if (!slotOf(id) && r.slots.length >= 8) throw new Error('All 8 slots are full');
      for (let i = 0; i < n && lvlOf(id) < maxLevel(id); i++) addOrLevel(id);
      return `${(SKILLS[id] || PASSIVES[id]).name} level ${lvlOf(id)}`;
    },
  },
  spawn: {
    args: '<type> [n] [elite]', desc: 'spawn enemies around the hero',
    run: a => {
      devRun();
      const type = a[0] && Object.keys(ENEMY_TYPES).find(k => k === a[0].toLowerCase());
      if (!type) throw new Error(`Unknown enemy. Types: ${Object.keys(ENEMY_TYPES).join(', ')}`);
      const n = clamp(Math.round(devNum(a[1], 1)), 1, 200), elite = (a[2] || '').toLowerCase() === 'elite';
      for (let i = 0; i < n; i++) { const o = devNear(4, 7); spawnEnemy(type, o.x, o.z, { elite }); }
      return `Spawned ${n} ${elite ? 'elite ' : ''}${type}`;
    },
  },
  boss: { args: '', desc: 'skip to the boss fight', run: () => { const r = devRun(); if (r.bossStarted) return 'The boss is already here'; r.t = Math.max(r.t, 299); r.events = r.events.filter(e => e.kind === 'boss'); return 'Boss incoming'; } },
  kill: { args: '', desc: 'kill every enemy except bosses', run: () => { const r = devRun(); let n = 0; for (const e of r.enemies) if (!e.dying && !e.boss) { killEnemy(e); n++; } return `Killed ${n}`; } },
  time: { args: '<seconds>', desc: 'set the run clock (the boss comes at 300)', run: a => { const r = devRun(), t = clamp(devNum(a[0], r.t), 0, 299); r.t = t; r.events = r.events.filter(e => e.t > t || e.kind === 'boss'); return `Run time ${fmtTime(t)}`; } },
  speed: { args: '<x>', desc: 'game speed multiplier (default 1)', run: a => { DEV.speed = clamp(devNum(a[0], 1), 0.1, 5); return `Game speed ×${DEV.speed}`; } },
  map: {
    args: '<size>', desc: `arena width in units (now ${ARENA.hw * 2})`,
    run: a => {
      const size = clamp(Math.round(devNum(a[0], 100)), 30, 200);
      ARENA.hw = ARENA.hd = size / 2; ARENA.cr = Math.min(8, size * 0.1);
      DEV_CMDS.map.desc = `arena width in units (now ${size})`;
      if (G.run && !G.run.over) {
        buildArena(G.run.chapter);
        const h = G.hero.pos, o = { x: h[0], z: h[2] };
        resolveCircle(o, HERO_R); h[0] = o.x; h[2] = o.z;
        for (const e of G.run.enemies) resolveCircle(e, e.radius);
      }
      return `Arena is now ${size}x${size}`;
    },
  },
  drop: {
    args: '<scroll|emerald|gem|chest|heart|magnet|coin> [n]', desc: 'drop pickups next to the hero',
    run: a => {
      devRun();
      const k = (a[0] || '').toLowerCase(), n = clamp(Math.round(devNum(a[1], 1)), 1, 100);
      if (!['scroll', 'emerald', 'gem', 'chest', 'heart', 'magnet', 'coin'].includes(k)) throw new Error('Drop one of: scroll, emerald, gem, chest, heart, magnet, coin');
      for (let i = 0; i < n; i++) {
        const o = devNear(1.5, 3);
        if (k === 'gem') dropGem(o.x, o.z, 1, 0); else if (k === 'emerald') dropGem(o.x, o.z, 8, 1); else spawnPickup(k, o.x, o.z, k === 'coin' ? 5 : 1);
      }
      return `Dropped ${n} ${k}`;
    },
  },
  win: { args: '', desc: 'clear the current chapter', run: () => { devRun(); DEV.toggle(false); finishRun(true); return ''; } },
  lose: { args: '', desc: 'end the run as a loss', run: () => { devRun(); DEV.toggle(false); finishRun(false); return ''; } },
  reset: { args: 'yes', desc: 'erase all progress', run: a => { if (a[0] !== 'yes') return 'Type "reset yes" to erase everything'; G.save = defaultSave(); G.save.devUnlocked = true; applySkin(G.save.skin); devRefresh(); return 'Progress erased'; } },
  perf: {
    args: '', desc: 'frame rate, render size and graphics card',
    run: () => [
      `Graphics card: ${gpuName() || 'hidden by the browser'}${PERF.software ? ' (software, no hardware acceleration)' : ''}`,
      `Frame rate: ${PERF.fps.toFixed(0)} fps (${(1000 / PERF.fps).toFixed(1)} ms a frame)`,
      `Render size: ${gl.drawingBufferWidth}x${gl.drawingBufferHeight} (scale ${PERF.ratio.toFixed(2)}, screen ${window.devicePixelRatio || 1}x)`,
      `Quality: ${G.save.settings.quality}, MSAA ${R.settings.msaa ? 'on' : 'off'}, bloom ${R.settings.bloom ? 'on' : 'off'}`,
    ].join('\n'),
  },
  clear: { args: '', desc: 'clear this log', run: () => { $('devLog').replaceChildren(); return ''; } },
  close: { args: '', desc: 'close the console (or press `)', run: () => { DEV.toggle(false); return ''; } },
};
