// ============================================================
// Chapter 20, the Crater: a long bowl of rough rock (ARENAS crater, 56 x 80) pocked with craters you can't walk
// into, strewn with boulders the color of the ground, old mine carts, ore and lantern posts. At its top end a
// mountainside holds the cave mouth, choked with rubble until the chapter is 85% done; then the rubble bursts
// open, an arrow points the way, and walking into the mouth starts the cave (13i-cave.js). There is no boss on
// the crater floor: the Bagger waits inside.
// ============================================================
const CRATER = { open: 255, mouthW: 2.6, scale: 6 };
const craterOpenNow = () => G.run && !G.run.endless && !G.run.rush && ARENA.theme && ARENA.theme.id === 'crater';
ARENA_LAYOUTS.crater = (A) => {
  const hd = ARENA.hd;
  // the old mine track up to the mouth: carts left on it, lantern posts along it, ore heaps beside it
  for (const [x, z] of [[-3.5, -hd + 9], [3.6, -hd + 16], [-3.4, -hd + 24], [3.5, -hd + 32]]) A.prop('lanternpost', x, z, 0.55, { yaw: x < 0 ? Math.PI / 2 : -Math.PI / 2 });
  A.prop('minecart', 1.2, -hd + 12, 0.8, { yaw: 0.05 });
  A.prop('ore', -6.5, -hd + 6, 0.85); A.prop('ore', 7, -hd + 7.5, 0.8);
  // big boulders flanking the approach
  for (const [x, z, r] of [[-9, -hd + 4, 1.7], [10, -hd + 4.5, 1.8], [-12, -hd + 12, 1.4], [12.5, -hd + 13, 1.5]]) A.prop('boulder', x, z, r);
};
ARENA_FEATURES.crater = {
  init(st) {
    const hd = ARENA.hd;
    // the cliff ring leaves a gap for the mountainside with the mouth in it
    ARENA.wall = ARENA.wall.filter(w => !(w.z < -hd + 1 && Math.abs(w.x) < 13));
    st.mouth = { x: 0, z: -hd - 2.4 };
    st.lamps = ARENA.props.filter(o => o.kind === 'lanternpost');
    // the rubble choking the mouth until it opens
    st.rubble = [[-1.2, -hd + 0.2, 1.1, 0], [1.1, -hd + 0.1, 1.15, 1], [0, -hd - 0.4, 1.3, 2], [-0.4, -hd + 1.0, 0.8, 1], [0.8, -hd + 0.9, 0.7, 0]]
      .map(([x, z, r, m], i) => ({ x, z, r, model: 'boulder' + m, yaw: i * 1.7 }));
    st.open = false; st.t = 0; st.pulse = 0;
  },
  update(st, dt) {
    st.t += dt;
    const run = G.run, h = G.hero.pos, hd = ARENA.hd;
    for (const o of st.lamps) if (onScreen(o.x, o.z, 2) && Math.random() < dt * 2) FX.part(o.x + rand(-0.1, 0.1), 2.8, o.z + rand(-0.1, 0.1), 0, 0.3, 0, 0.05, 0.01, 0.6, [1, 0.8, 0.4], 0.8, 1, 0);
    if (!st.open && craterOpenNow() && run.t >= CRATER.open && G.state === 'run') craterOpen(st);
    if (st.open) {
      st.pulse += dt;
      // walking into the mouth starts the cave
      if (G.state === 'run' && !run.cave && Math.abs(h[0] - st.mouth.x) < CRATER.mouthW && h[2] < -hd + 1.6) caveEnter();
      if (Math.random() < dt * 6) FX.part(rand(-2, 2), 0.2, -hd + rand(-1, 0.5), rand(-0.2, 0.2), rand(0.1, 0.4), rand(-0.6, -0.2), 0.12, 0.3, 1.4, [0.25, 0.2, 0.17], 0.4, 2, 0);
    } else if (run.t > CRATER.open - 20 && Math.random() < dt * 3) {
      // the rubble starts to shift as the moment nears
      FX.smoke(rand(-2, 2), rand(0.2, 1.4), -hd + rand(-0.5, 1), 0.35, [0.5, 0.44, 0.38], 1.2, 0.4);
    }
  },
  emit(st) {
    const hd = ARENA.hd, f = R.frame, t = f.rockCol, m = st.mouth;
    if (R.enemyDraw.cavemouth) pushEnemy('cavemouth', false, m.x, 0, m.z, 0, MODELS.defs.cavemouth.clips.still.row, CRATER.scale, 1, 0, 0, 0, t[0], t[1], t[2]);
    // the dark inside the mouth spills onto the floor in front of it
    pushDecal(m.x, -hd - 0.4, 2.9, 2.2, 0, 1, 0, 0, 0.01, 0.008, 0.006, 0.95);
    pushDecal(m.x, -hd + 0.6, 3.4, 1.6, 0, 1, 0, 0, 0.02, 0.015, 0.01, 0.55);
    if (!st.open) for (const o of st.rubble) {
      if (R.enemyDraw[o.model]) pushEnemy(o.model, false, o.x, 0, o.z, o.yaw, MODELS.defs[o.model].clips.still.row, o.r / 0.5, 1, 0, 0, 0, t[0] * 0.9, t[1] * 0.9, t[2] * 0.9);
    } else {
      // glowing arrows on the floor leading in
      for (let i = 0; i < 4; i++) pushDecal(m.x, -hd + 2.2 + i * 2.6, 1.2, 1.2, Math.PI, 11, 0, 0, 1, 0.55, 0.2, 0.9, true);
    }
    for (const o of st.lamps) { if (!onScreen(o.x, o.z, 2)) continue; const sc = o.r / PROP_KINDS.lanternpost.unit, c = Math.cos(o.yaw), s = Math.sin(o.yaw); FX.glow(o.x + s * 0.25 * sc, 0.86 * sc, o.z + c * 0.25 * sc, 1.1, [1, 0.75, 0.35], 0.05, 0.55); }
  },
};
// 85%: the rubble bursts out of the mouth, the ground shakes, and the way in is marked
function craterOpen(st) {
  st.open = true;
  const hd = ARENA.hd;
  for (const o of st.rubble) {
    FX.burst(o.x, 0.8, o.z, 14, [0.55, 0.48, 0.4], 6, 0.2, 0.8, 1, 3);
    for (let i = 0; i < 5; i++) FX.smoke(o.x + rand(-1, 1), rand(0.3, 1.5), o.z + rand(-0.6, 0.6), 0.8, [0.55, 0.5, 0.44], 1.8, 0.8);
  }
  G.cam.shake = Math.max(G.cam.shake, 0.35);
  AUDIO.play('boom'); AUDIO.play('roar', 0.6);
  UI.banner('THE CAVE IS OPEN', true);
  addTele({ kind: 'circle', x: 0, z: -hd + 1, r: 2.4, dur: 1.2 });
}
