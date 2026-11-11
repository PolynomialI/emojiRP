// ============================================================
// Chapter 10, the Wild West town. Three rows of false-front buildings, every one facing +z (toward the camera):
// Church Street runs between the top two rows and Main Street between the lower two. You start in the town
// square in the middle of Main Street, between the bank's steps and the bandstand. South of town is ranch land: a corral,
// the water tower and an oil field. Oil lamps glow along the streets at sundown.
// ============================================================
// each building model: how far it reaches in z (model units, front at +z), its half width, and its height
const WEST_FOOT = { saloon: [-0.36, 0.43, 0.5, 0.9], bank: [-0.36, 0.42, 0.5, 1.0], sheriff: [-0.4, 0.43, 0.5, 0.67], store: [-0.39, 0.43, 0.5, 0.68],
  hotel: [-0.39, 0.36, 0.5, 1.03], barn: [-0.45, 0.44, 0.5, 0.96], church: [-0.65, 0.65, 0.46, 1.72] };
// [model, x, front edge z, width, wall paint]
const WEST_TOWN = [
  // north row, facing Church Street
  ['barn', -41, -18, 6.5, '#b0402e'], ['store', -29, -18, 5.5, '#c8a878'], ['hotel', -17, -18, 6, '#7a9ab0'], ['church', 0, -18, 5.5, '#f4efe4'],
  ['saloon', 15, -18, 6, '#c07848'], ['sheriff', 27, -18, 5, '#b8704a'], ['store', 39, -18, 5.5, '#9ab07a'],
  // Main Street's north side: you start at the steps of the First Gold Bank
  ['hotel', -40, -3, 6, '#d8b070'], ['store', -29, -3, 5.5, '#8aa070'], ['saloon', -17, -3, 6.5, '#c0603a'], ['bank', 0, -2.5, 7.5, '#e2cfa4'],
  ['sheriff', 13, -3, 5, '#a8603e'], ['hotel', 24, -3, 6, '#9a7ab0'], ['barn', 36, -3, 6.5, '#a8402e'],
  // the south row, its fronts toward the ranch land; the gap in the middle opens onto the square
  ['barn', -37, 12, 6.5, '#9a3a2a'], ['bank', -25, 12, 6.5, '#b45a42'], ['store', -13, 12, 5.5, '#d8b878'], ['saloon', 13, 12, 6, '#6a8ac0'],
  ['hotel', 24, 12, 6, '#c88a5a'], ['sheriff', 36, 12, 5, '#8a9a6a'],
];
ARENA_LAYOUTS.west = (A) => {
  const rnd = A.rnd, C = hexToRgb;
  for (const [model, x, front, w, paint] of WEST_TOWN) {
    const [z0, z1, hx, top] = WEST_FOOT[model], oz = front - z1 * w;
    A.prop(model, x, oz + (z0 + z1) / 2 * w, 0, { shape: 'box', hw: hx * w, hd: (z1 - z0) / 2 * w, scale: w, yaw: 0, model, tint: C(paint), height: top * w, ox: x, oz });
  }
  // the bandstand square, ringed by lamps
  // the town square opens out of Main Street right where you start, between the bank and the bandstand
  A.prop('gazebo', 0, 5.6, 2.0, { yaw: 0 });
  for (const [x, z] of [[6.6, 5.2], [-6.6, 5.2], [4.4, 9.8], [-4.4, 9.8]]) A.prop('oillamp', x, z, 0.25, { scale: 1.8, yaw: 0 });
  A.prop('well', 16.5, 17.5, 1.0, { yaw: 0.3 });
  // lamps along Main Street (two flanking the bank's steps) and Church Street
  for (const [x, z] of [[-4.8, -2.2], [4.8, -2.2], [-23.5, -2.4], [-34.5, -2.4], [18.5, -2.4], [30, -2.4], [-31, 5.6], [30.5, 6.4],
    [-4, -17], [4, -17], [-23, -17.2], [21, -17.2]]) A.prop('oillamp', x, z, 0.25, { scale: 1.8, yaw: 0 });
  // wagons parked on Main Street, troughs by the saloons
  A.prop('wagon', -31, 2, 1.4, { yaw: Math.PI / 2 }); A.prop('wagon', 31, 1.5, 1.4, { yaw: -Math.PI / 2 + 0.2 });
  A.prop('trough', -17, -1.6, 0.6, { yaw: 0 }); A.prop('trough', 13, 14.3, 0.6, { yaw: Math.PI });
  // the water tower at the edge of town
  A.prop('watertower', -42, 26, 2.0, { yaw: 0.4 });
  // a corral of split rails with an open gate, hay and a trough inside
  const cx = -24, cz = 34, hw = 6.3, hd = 5.4;
  for (let x = -hw + 0.9; x <= hw - 0.8; x += 1.8) {
    if (Math.abs(x) > 1.5) A.prop('railfence', cx + x, cz - hd, 0.9, { yaw: 0 });
    A.prop('railfence', cx + x, cz + hd, 0.9, { yaw: Math.PI });
  }
  for (let z = -hd + 0.9; z <= hd - 0.8; z += 1.8) { A.prop('railfence', cx - hw, cz + z, 0.9, { yaw: Math.PI / 2 }); A.prop('railfence', cx + hw, cz + z, 0.9, { yaw: -Math.PI / 2 }); }
  A.prop('haybale', cx - 2.5, cz + 1.5, 0.8); A.prop('haybale', cx + 2.8, cz + 2.2, 0.75); A.prop('trough', cx + 1, cz - 2, 0.6, { yaw: 0.1 });
  // the oil field: derricks over black pools
  for (const [x, z] of [[30, 30], [42, 37], [27, 44]]) { A.prop('derrick', x, z, 1.1, { yaw: rnd() * TAU }); A.zone('oil', x + 2.6, z + 1.2, 2.2 + rnd() * 0.5); }
};
ARENA_FEATURES.west = {
  init(st) { st.tall = ARENA.props.filter(o => o.height); st.lamps = ARENA.props.filter(o => o.kind === 'oillamp'); st.acc = 0; },
  update(st, dt) {
    // buildings between the camera and the hero turn see-through, as in the city
    ARENA_FEATURES.city.update(st, dt);
    // warm dust motes drifting on the evening wind
    const h = G.hero.pos;
    st.acc += dt * (FX.reduced ? 2 : 6);
    for (; st.acc >= 1; st.acc--) FX.part(h[0] + rand(-14, 14), rand(0.1, 0.9), h[2] + rand(-11, 8), rand(0.8, 1.6), rand(0.05, 0.25), rand(-0.2, 0.2), rand(0.05, 0.09), 0.1, rand(2, 3.5), [1, 0.82, 0.55], 0.45, 2, 0, 0.1);
  },
  emit(st) {
    const t = G.run ? G.run.t : 0;
    for (const o of st.lamps) {
      if (!onScreen(o.x, o.z, 3)) continue;
      const fl = 0.9 + 0.1 * Math.sin(t * 9 + o.ph * 5);
      pushDecal(o.x, o.z, 2.4, 2.4, 0, 1, 0, 0, 0.85 * fl, 0.58, 0.28, 0.24, true);
      FX.glow(o.x, 1.33 * (o.scale || 1.8), o.z, 0.75 * fl, [1, 0.75, 0.4], 0.05, 0.8);
    }
  },
};
