// ============================================================
// Abilities: five skills, once maxed, also give a power you fire yourself, with keys 1-5
// or by tapping its button at the bottom left. Cooldowns are fixed (cooldown boosts don't touch them),
// and only land runs have them (the sea has its own skills, the cave is its own game).
// ============================================================
const ABILITIES = {
  mine: { name: 'Mega Mine', cd: 45, desc: 'Drop a huge mine that flattens everything around it.' },
  lightning: { name: 'Storm Call', cd: 40, desc: 'Sixteen lightning strikes rain down across the screen.' },
  meteor: { name: 'Starfall', cd: 50, desc: 'Ten meteors fall on the enemies in sight.' },
  frostnova: { name: 'Deep Freeze', cd: 60, desc: 'Freezes every enemy in sight for 4 seconds; bosses are slowed.' },
  shield: { name: 'Bubble Fortress', cd: 55, desc: 'Refills your bubble, shoves enemies away, and nothing can hurt you for 4 seconds.' },
};
function abilitySlots() {
  const run = G.run;
  if (!run || run.sea || run.cave) return [];
  return run.slots.filter(s => s.kind === 'skill' && ABILITIES[s.id] && s.lvl >= maxLevel(s.id));
}
const abilityCd = id => (G.run.abil && G.run.abil[id]) || 0;
function tickAbilities(dt) {
  const run = G.run;
  if (run.abil) for (const id in run.abil) run.abil[id] = Math.max(0, run.abil[id] - dt);
  // Bubble Fortress: a shimmering ring pulses round you while it lasts
  if (run.fortT > 0) {
    run.fortT -= dt; run.fortPulse = (run.fortPulse || 0) - dt;
    if (run.fortPulse <= 0) { run.fortPulse = 0.3; const h = G.hero.pos; FX.ring(h[0], h[2], 1.9, COLORS.cyanHi, 0.35, 0.8); }
  }
}
// fires ability i (0-based, in skill slot order); false if there is none, it is recharging, or it has no target
function useAbility(i) {
  if (G.state !== 'run') return false;
  const s = abilitySlots()[i];
  if (!s) return false;
  const run = G.run;
  run.abil = run.abil || {};
  if (abilityCd(s.id) > 0) { AUDIO.play('boing', 0.6); return false; }
  const was = DMG_SRC;
  DMG_SRC = s.id;
  let ok;
  try { ok = ABILITY_FIRE[s.id](s, skillL(s)) !== false; } finally { DMG_SRC = was; }
  if (!ok) { UI.toast('No enemies in sight'); return false; }
  run.abil[s.id] = ABILITIES[s.id].cd;
  return true;
}
const sightedEnemies = () => G.run.enemies.filter(e => !e.dying && !e.hidden && onScreen(e.x, e.z, -0.4));
const takeRandom = list => list.splice(Math.floor(Math.random() * list.length), 1)[0];
const ABILITY_FIRE = {
  // a huge mine at your feet: it bursts when anything steps on it, or by itself after 15 seconds
  mine(s, L) {
    const h = G.hero.pos;
    G.run.mines.push({ x: h[0], z: h[2], t: 0, life: 15, dmg: L.dmg * 8, radius: L.radius * 2.6 * areaMul(), ph: rand(0, 10), big: true });
    FX.splat(h[0], h[2], 1.3, R.goo.pink, 1.6);
    FX.droplets(h[0], 0.4, h[2], 12, 1.6, 4, 0.06, R.goo.pink);
    AUDIO.play('drip', 0.6);
  },
  lightning(s, L) {
    const st = s.st, cands = sightedEnemies();
    if (!cands.length) return false;
    st.queue = st.queue || [];
    const n = Math.min(cands.length, 16);
    for (let i = 0; i < n; i++) st.queue.push({ e: takeRandom(cands), d: 0.05 + i * 0.05 });
    G.hero.spark = 1;
    G.cam.shake = Math.max(G.cam.shake, 0.1);
  },
  meteor(s, L) {
    const st = s.st, cands = sightedEnemies(), h = G.hero.pos;
    if (!cands.length) return false;
    st.rocks = st.rocks || []; st.fires = st.fires || [];
    for (let i = 0; i < 10; i++) {
      let tx, tz;
      if (cands.length) { const e = takeRandom(cands); tx = e.x; tz = e.z; }
      else { const a = rand(0, TAU), d = rand(2, 7); tx = h[0] + Math.cos(a) * d; tz = h[2] + Math.sin(a) * d; }
      st.rocks.push({ tx, tz, sx: tx + 5, sy: 15, sz: tz - 7, t: -i * 0.12, r: L.radius * 1.2 * areaMul(), ph: rand(0, 10) });
    }
  },
  frostnova(s, L) {
    const cands = sightedEnemies(), h = G.hero.pos;
    if (!cands.length) return false;
    for (const e of cands) {
      // a boss immune to the cold shrugs this off entirely
      if (hurtEnemy(e, L.dmg * 2, 0, 0, { sound: false, color: [0.6, 0.9, 1] }) === false) continue;
      if (e.boss || e.mini) { e.slowMul = Math.min(e.slowMul, 0.5); e.slowT = Math.max(e.slowT, 4); }
      else if (!e.dying) e.frozen = Math.max(e.frozen || 0, 4);
      FX.burst(e.x, 0.6, e.z, 4, [0.8, 0.95, 1], 3, 0.08, 0.4, 1);
    }
    for (const r of [3, 7, 12]) FX.ring(h[0], h[2], r, [0.62, 0.9, 1], 0.55, 1);
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, sp = rand(10, 22); FX.part(h[0], rand(0.3, 1.2), h[2], Math.cos(a) * sp, rand(0, 2), Math.sin(a) * sp, 0.14, 0.04, 0.6, [0.85, 0.96, 1], 1, 1, 0, 1.5); }
    G.cam.shake = Math.max(G.cam.shake, 0.12);
    AUDIO.play('zap', 0.6);
  },
  shield(s, L) {
    const run = G.run, h = G.hero.pos, st = s.st;
    st.hits = L.hits; st.rt = L.recharge; st.inflate = 0;
    run.invuln = Math.max(run.invuln, 4); run.fortT = 4; run.fortPulse = 0;
    enemiesInRadius(h[0], h[2], 4, e => {
      const dx = e.x - h[0], dz = e.z - h[2], d = Math.hypot(dx, dz) || 1;
      hurtEnemy(e, Math.max(10, L.pop || 0), dx / d * 14, dz / d * 14, { sound: false });
    });
    FX.ring(h[0], h[2], 4, COLORS.cyanHi, 0.45, 1);
    FX.droplets(h[0], 0.9, h[2], 20, 0, 6, 0.05, null);
    AUDIO.play('shield');
  },
};
