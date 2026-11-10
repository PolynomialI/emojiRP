// ============================================================
// Chapters 11-15: set pieces and moving parts (layouts and features for 11a-arena.js)
// ============================================================

// ---------- Haunted Graveyard: will-o'-wisps drifting between the graves, and the jack-o'-lanterns flickering ----------
ARENA_FEATURES.graveyard = {
  init(st) { st.lanterns = ARENA.props.filter(o => o.kind === 'pumpkin'); st.acc = 0; },
  update(st, dt) {
    const h = G.hero.pos;
    st.acc += dt * (FX.reduced ? 1.5 : 4);
    for (; st.acc >= 1; st.acc--) FX.part(h[0] + rand(-14, 14), rand(0.3, 1.6), h[2] + rand(-11, 8), rand(-0.4, 0.4), rand(0.05, 0.3), rand(-0.4, 0.4), rand(0.1, 0.16), 0.03, rand(2, 3.5), [0.72, 0.58, 1], 1, 0, 0, 0.2);
  },
  emit(st) {
    const t = G.run ? G.run.t : 0;
    for (const o of st.lanterns) {
      if (!onScreen(o.x, o.z, 2)) continue;
      const sc = o.r / PROP_KINDS.pumpkin.unit, fl = 0.75 + 0.25 * Math.sin(t * 9 + o.ph * 5) * Math.sin(t * 5.3 + o.ph);
      FX.glow(o.x, 0.35 * sc, o.z, 1.1 * sc, [1, 0.6, 0.2], 0.05, 0.55 * fl);
    }
  },
};

// ---------- Crystal Caverns: the crystals glow, and sparkles drift up through the dark ----------
ARENA_FEATURES.caverns = {
  init(st) { st.crystals = ARENA.props.filter(o => o.kind === 'crystal'); st.acc = 0; },
  update(st, dt) {
    const h = G.hero.pos;
    st.acc += dt * (FX.reduced ? 2 : 6);
    for (; st.acc >= 1; st.acc--) FX.part(h[0] + rand(-14, 14), rand(0.1, 1.2), h[2] + rand(-11, 8), rand(-0.2, 0.2), rand(0.2, 0.5), rand(-0.2, 0.2), rand(0.06, 0.1), 0.02, rand(1.5, 3), Math.random() < 0.5 ? [0.5, 0.95, 1] : [1, 0.55, 0.95], 1, 3, 0, 0.2);
  },
  emit(st) {
    const t = G.run ? G.run.t : 0;
    for (const o of st.crystals) {
      if (!onScreen(o.x, o.z, 2)) continue;
      const sc = o.r / PROP_KINDS.crystal.unit;
      FX.glow(o.x, 0.6 * sc, o.z, 1.3 * sc, o.tint || [0.5, 0.9, 1], 0.05, 0.3 + 0.12 * Math.sin(t * 2 + o.ph));
    }
  },
};
