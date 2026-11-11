// ============================================================
// Goals: long-term targets, each with a reward to claim on the Goals screen.
// A goal reads one number from the save (a stat counted at the end of each run, or something the
// save already says) and has a target. Reaching it shows a toast once (sv.goals.seen); claiming
// pays out (sv.goals.claimed). Three goals give colors that cannot be bought (SKINS with `goal`).
// ============================================================
const GOAL_VALUE = {
  kills: sv => sv.stats.kills || 0,
  bosses: sv => sv.stats.bosses || 0,
  elites: sv => sv.stats.elites || 0,
  level: sv => sv.stats.maxLevel || 0,
  evos: sv => sv.stats.evos || 0,
  cleared: sv => Object.keys(sv.cleared).length,
  gooblins: sv => sv.stats.gooblins || 0,
  endless: sv => Math.floor((sv.endlessBest || 0) / 60),
  rush: sv => sv.rushBest || 0,
  colors: sv => sv.skins.length,
  costumes: sv => sv.costumes.filter(id => id !== 'none').length,
  upgrades: sv => Object.values(sv.upgrades).reduce((a, b) => a + b, 0),
  geared: sv => Object.values(sv.gear.eq).filter(Boolean).length,
  fuses: sv => sv.stats.fuses || 0,
  rarity: sv => Math.max(0, ...Object.keys(sv.gear.items).map(k => artParse(k).r + 1)),
  runs: sv => sv.stats.runs || 0,
  coins: sv => sv.stats.coinsEarned || 0,
};
// group: icon color and order on the screen. desc: {n} is the target.
const GOALS = [
  { id: 'kills1', group: 'fight', name: 'Goo Getter', desc: 'Defeat {n} foes', stat: 'kills', n: 500, coins: 150 },
  { id: 'kills2', group: 'fight', name: 'Goo Getter II', desc: 'Defeat {n} foes', stat: 'kills', n: 5000, coins: 500 },
  { id: 'kills3', group: 'fight', name: 'Goo Getter III', desc: 'Defeat {n} foes', stat: 'kills', n: 25000, coins: 1500, scrolls: 1 },
  { id: 'kills4', group: 'fight', name: 'Goo Legend', desc: 'Defeat {n} foes', stat: 'kills', n: 100000, coins: 4000, scrolls: 3 },
  { id: 'bosses1', group: 'fight', name: 'Boss Popper', desc: 'Defeat {n} bosses', stat: 'bosses', n: 5, coins: 300 },
  { id: 'bosses2', group: 'fight', name: 'Boss Popper II', desc: 'Defeat {n} bosses', stat: 'bosses', n: 25, coins: 1000, scrolls: 1 },
  { id: 'bosses3', group: 'fight', name: 'Boss Breaker', desc: 'Defeat {n} bosses', stat: 'bosses', n: 75, coins: 3000, scrolls: 2 },
  { id: 'elites', group: 'fight', name: 'Elite Hunter', desc: 'Defeat {n} elite foes', stat: 'elites', n: 50, coins: 800, scrolls: 1 },
  { id: 'level1', group: 'fight', name: 'Power Surge', desc: 'Reach level {n} in a run', stat: 'level', n: 25, coins: 400 },
  { id: 'level2', group: 'fight', name: 'Overcharged', desc: 'Reach level {n} in a run', stat: 'level', n: 50, coins: 1500, scrolls: 1 },
  { id: 'evo1', group: 'fight', name: 'Evolved', desc: 'Evolve a skill', stat: 'evos', n: 1, coins: 300 },
  { id: 'evo2', group: 'fight', name: 'Evolution Master', desc: 'Evolve {n} skills', stat: 'evos', n: 25, coins: 2000, scrolls: 2 },
  { id: 'ch1', group: 'chapter', name: 'First Victory', desc: 'Clear chapter 1', stat: 'cleared', n: 1, coins: 100 },
  { id: 'ch5', group: 'chapter', name: 'Explorer', desc: 'Clear {n} chapters', stat: 'cleared', n: 5, coins: 600 },
  { id: 'ch10', group: 'chapter', name: 'Adventurer', desc: 'Clear {n} chapters', stat: 'cleared', n: 10, coins: 2000, scrolls: 1 },
  { id: 'ch15', group: 'chapter', name: 'Hero of Gel', desc: 'Clear {n} chapters', stat: 'cleared', n: 15, coins: 5000, scrolls: 3, skin: 'champion' },
  { id: 'gooblin1', group: 'mode', name: 'Lucky Catch', desc: 'Catch a Golden Gooblin', stat: 'gooblins', n: 1, coins: 300 },
  { id: 'gooblin2', group: 'mode', name: 'Treasure Hunter', desc: 'Catch {n} Golden Gooblins', stat: 'gooblins', n: 10, coins: 1500, scrolls: 2 },
  { id: 'endless10', group: 'mode', name: 'Endurance', desc: 'Survive {n} minutes in Endless', stat: 'endless', n: 10, coins: 800 },
  { id: 'endless20', group: 'mode', name: 'Unstoppable', desc: 'Survive {n} minutes in Endless', stat: 'endless', n: 20, coins: 2500, scrolls: 2, skin: 'cosmic' },
  { id: 'rush5', group: 'mode', name: 'Boss Rusher', desc: 'Beat {n} bosses in one Boss Rush', stat: 'rush', n: 5, coins: 1000 },
  { id: 'rushall', group: 'mode', name: 'Rush Champion', desc: 'Beat every boss in one Boss Rush', stat: 'rush', n: CHAPTER_BOSSES.length, coins: 4000, scrolls: 3, skin: 'inferno' },
  { id: 'colors', group: 'collect', name: 'Fashionista', desc: 'Own {n} colors', stat: 'colors', n: 10, coins: 500 },
  { id: 'costumes1', group: 'collect', name: 'Wardrobe', desc: 'Own {n} costumes and hats', stat: 'costumes', n: 15, coins: 1000 },
  { id: 'costumes2', group: 'collect', name: 'Collector', desc: 'Own {n} costumes and hats', stat: 'costumes', n: 40, coins: 3000, scrolls: 2 },
  { id: 'upg1', group: 'collect', name: 'Strong Roots', desc: 'Buy {n} upgrade levels', stat: 'upgrades', n: 25, coins: 600 },
  { id: 'upg2', group: 'collect', name: 'Powered Up', desc: 'Buy {n} upgrade levels', stat: 'upgrades', n: 100, coins: 2500, scrolls: 1 },
  { id: 'geared', group: 'gear', name: 'Suited Up', desc: 'Wear gear in all four slots', stat: 'geared', n: 4, coins: 400, scrolls: 1 },
  { id: 'fuse1', group: 'gear', name: 'Fusion', desc: 'Fuse an artifact', stat: 'fuses', n: 1, coins: 300 },
  { id: 'fuse2', group: 'gear', name: 'Master Fuser', desc: 'Fuse {n} artifacts', stat: 'fuses', n: 20, coins: 2000, scrolls: 2 },
  { id: 'epic', group: 'gear', name: 'Epic Find', desc: 'Own an Epic artifact', stat: 'rarity', n: 4, coins: 1200 },
  { id: 'legend', group: 'gear', name: 'Legendary', desc: 'Own a Legendary artifact', stat: 'rarity', n: 5, coins: 2500, scrolls: 1 },
  { id: 'runs1', group: 'play', name: 'Regular', desc: 'Play {n} runs', stat: 'runs', n: 25, coins: 500 },
  { id: 'runs2', group: 'play', name: 'Veteran', desc: 'Play {n} runs', stat: 'runs', n: 150, coins: 2500, scrolls: 2 },
  { id: 'coins', group: 'play', name: 'Rich Blob', desc: 'Earn {n} coins in all', stat: 'coins', n: 50000, coins: 1500 },
];
const GOAL_GROUPS = { fight: '#ff5f8f', chapter: '#8f6bff', mode: '#ff8a1f', collect: '#33c6f2', gear: '#ffc23a', play: '#4cd964' };

const goalProgress = (g, sv = G.save) => Math.min(g.n, GOAL_VALUE[g.stat](sv));
const goalReached = (g, sv = G.save) => GOAL_VALUE[g.stat](sv) >= g.n;
const goalClaimable = (g, sv = G.save) => goalReached(g, sv) && !sv.goals.claimed[g.id];
const goalsToClaim = (sv = G.save) => GOALS.filter(g => goalClaimable(g, sv)).length;
const goalText = g => g.desc.replace('{n}', fmtNum(g.n));

// toasts for goals reached since the last look (on the home screen and the results)
function goalsCheck() {
  const sv = G.save, fresh = GOALS.filter(g => goalReached(g, sv) && !sv.goals.seen[g.id]);
  if (!fresh.length) return;
  for (const g of fresh) sv.goals.seen[g.id] = true;
  saveGame();
  UI.toast(fresh.length === 1 ? `🏆 Goal reached: ${fresh[0].name}! Claim it in Goals` : `🏆 ${fresh.length} goals reached! Claim them in Goals`, 3);
}
// end-of-run counters (finishRun); fuses count as they happen
function goalsAddRun(run) {
  const st = G.save.stats;
  st.bosses = (st.bosses || 0) + (run.bossKills || 0);
  st.elites = (st.elites || 0) + (run.eliteKills || 0);
  st.gooblins = (st.gooblins || 0) + (run.gooblins || 0);
  st.evos = (st.evos || 0) + (run.evos || 0);
  st.maxLevel = Math.max(st.maxLevel || 0, run.level);
  st.coinsEarned = (st.coinsEarned || 0) + (run.earned || 0);
}

const TROPHY_SVG = '<svg viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M7 3h10v2h3.2a.8.8 0 0 1 .8.8c0 3-1.8 5.2-4.6 5.6A5.9 5.9 0 0 1 13 14.6V17h3v3H8v-3h3v-2.4a5.9 5.9 0 0 1-3.4-3.2C4.8 11 3 8.8 3 5.8a.8.8 0 0 1 .8-.8H7zm-2.3 3.6c.2 1.6 1.1 2.7 2.5 3.1A13 13 0 0 1 7 6.6zm14.6 0h-2.3c0 1-.1 2.1-.3 3.1 1.4-.4 2.4-1.5 2.6-3.1z"/></svg>';

Object.assign(UI, {
  renderGoals() {
    const sv = G.save, list = $('goalList');
    document.querySelectorAll('.coinsVal').forEach(e => { e.textContent = fmtNum(sv.coins); });
    const done = GOALS.filter(g => sv.goals.claimed[g.id]).length;
    $('goalSum').textContent = `${done} of ${GOALS.length} claimed`;
    // ready to claim first, then the nearest to done, claimed ones last
    const order = g => sv.goals.claimed[g.id] ? 2 : goalReached(g, sv) ? 0 : 1;
    const rows = GOALS.slice().sort((a, b) => order(a) - order(b) || (order(a) === 1 ? goalProgress(b, sv) / b.n - goalProgress(a, sv) / a.n : 0));
    list.replaceChildren(...rows.map(g => {
      const claimed = !!sv.goals.claimed[g.id], ready = !claimed && goalReached(g, sv), p = goalProgress(g, sv);
      const row = document.createElement('div');
      row.className = 'panel goalrow' + (ready ? ' ready' : '') + (claimed ? ' claimed' : '');
      row.innerHTML = `<span class="gicon">${TROPHY_SVG}</span><span class="gmid"><span class="nm"></span><span class="ds"></span><span class="gbar"><i></i><b></b></span><span class="grew"></span></span><button class="jelly"></button>`;
      row.querySelector('.gicon').style.background = claimed ? '#c8d6e8' : GOAL_GROUPS[g.group];
      row.querySelector('.nm').textContent = g.name;
      row.querySelector('.ds').textContent = goalText(g);
      row.querySelector('.gbar i').style.width = (p / g.n * 100).toFixed(1) + '%';
      row.querySelector('.gbar b').textContent = `${fmtNum(p)} / ${fmtNum(g.n)}`;
      const rew = row.querySelector('.grew');
      if (g.coins) rew.insertAdjacentHTML('beforeend', `<span><i class="coin"></i>${fmtNum(g.coins)}</span>`);
      if (g.scrolls) rew.insertAdjacentHTML('beforeend', `<span><img alt="" src="${ICONS.get('scroll')}">×${g.scrolls}</span>`);
      if (g.skin) {
        const s = SKINS.find(k => k.id === g.skin);
        rew.insertAdjacentHTML('beforeend', `<span class="gskin"><i style="background:linear-gradient(180deg, ${s.top || s.base}, ${s.base})"></i>${s.name} color</span>`);
      }
      const b = row.querySelector('button');
      if (claimed) { b.textContent = '✓'; b.disabled = true; }
      else if (ready) { b.textContent = 'Claim'; b.className = 'jelly gold'; b.addEventListener('click', () => this.claimGoal(g)); }
      else { b.textContent = Math.floor(p / g.n * 100) + '%'; b.disabled = true; }
      return row;
    }));
  },
  claimGoal(g) {
    const sv = G.save;
    if (!goalClaimable(g, sv)) return;
    sv.goals.claimed[g.id] = true;
    sv.coins += g.coins || 0;
    sv.scrolls = (sv.scrolls || 0) + (g.scrolls || 0);
    if (g.skin && !sv.skins.includes(g.skin)) sv.skins.push(g.skin);
    saveGame();
    AUDIO.play('coin'); AUDIO.play('levelup');
    const parts = [g.coins && `${fmtNum(g.coins)} coins`, g.scrolls && `${g.scrolls} scroll${g.scrolls > 1 ? 's' : ''}`, g.skin && `the ${SKINS.find(k => k.id === g.skin).name} color`].filter(Boolean);
    this.toast(`${g.name}: ${parts.join(', ')}`, 2.5);
    G.hero.impulse(2);
    this.renderGoals();
  },
});
