// ============================================================
// Chapter 10, the Wild West town. The map is the town itself: Main Street (14 wide) runs north-south between two unbroken
// rows of false-front buildings joined wall to wall, and at its north end it opens onto the town square, ringed by
// more buildings (the chapel and the First Gold Bank face you across it) with the bandstand in the middle.
// The rows stand just outside the map's edge (ARENAS west.boxes: the street and the square), so they are its walls.
// A rail fence closes the south end of the street. Oil lamps glow along the boardwalks at sundown.
// ============================================================
// each building model: how far it reaches in z (model units, front at +z), its half width, and its height
const WEST_FOOT = { saloon: [-0.36, 0.43, 0.5, 0.9], bank: [-0.36, 0.42, 0.5, 1.0], sheriff: [-0.4, 0.43, 0.5, 0.67], store: [-0.39, 0.43, 0.5, 0.68],
  hotel: [-0.39, 0.36, 0.5, 1.03], barn: [-0.45, 0.44, 0.5, 0.96], church: [-0.65, 0.65, 0.46, 1.72] };
// one building with its front on a line, facing n ('+x', '-x', '+z' or '-z'), centred at 'along' on that line
function westBuilding(A, model, along, front, w, paint, n) {
  const [z0, z1, hx, top] = WEST_FOOT[model];
  const yaw = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[n];
  const sgn = n[0] === '+' ? 1 : -1, deep = Math.max(-z0, z1) * w, origin = front - sgn * z1 * w, alongX = n[1] === 'z';
  A.prop(model, alongX ? along : origin, alongX ? origin : along, 0, { shape: 'box', hw: alongX ? hx * w : deep, hd: alongX ? deep : hx * w,
    scale: w, yaw, tint: hexToRgb(paint), height: top * w, block: false, shots: false });
}
// a row of buildings joined wall to wall: [model, width, paint] from 'start' along the line
function westRow(A, list, start, front, n) {
  let u = start;
  for (const [model, w, paint] of list) { westBuilding(A, model, u + w / 2, front, w, paint, n); u += w; }
}
ARENA_LAYOUTS.west = (A) => {
  // Main Street: the west row faces east, the east row faces west, from the square's corner buildings to past the fence
  westRow(A, [['hotel', 7, '#d8b070'], ['store', 5.5, '#8aa070'], ['saloon', 7, '#c0603a'], ['sheriff', 5, '#a8603e'], ['bank', 7.5, '#e2cfa4'],
    ['store', 5.5, '#c8a878'], ['barn', 7, '#b0402e'], ['hotel', 6.5, '#7a9ab0'], ['saloon', 6.5, '#c07848'], ['store', 5.5, '#9ab07a']], -11.5, -7, '+x');
  westRow(A, [['saloon', 7.5, '#6a8ac0'], ['hotel', 6.5, '#c88a5a'], ['sheriff', 5, '#8a9a6a'], ['store', 6, '#d8b878'], ['saloon', 6.5, '#b85a3a'],
    ['bank', 7, '#b45a42'], ['store', 5.5, '#8a9ab8'], ['hotel', 6.5, '#9a7ab0'], ['barn', 7, '#9a3a2a'], ['sheriff', 5, '#b8704a']], -11.5, 7, '-x');
  // the square: the chapel at the head, the bank beside it, all of them facing in
  westRow(A, [['barn', 6, '#a8402e'], ['sheriff', 5, '#b8704a'], ['store', 5.5, '#c8a878'], ['bank', 9, '#e2cfa4'], ['church', 7, '#f4efe4'],
    ['saloon', 8, '#c0603a'], ['hotel', 6.5, '#d8b070'], ['store', 5, '#9ab07a'], ['barn', 6, '#9a3a2a']], -29, -50, '+z');
  westRow(A, [['saloon', 7, '#b85a3a'], ['store', 6, '#d8b878'], ['hotel', 7.5, '#7a9ab0'], ['sheriff', 6, '#8a9a6a'], ['store', 7.5, '#8aa070']], -50, -22, '+x');
  westRow(A, [['hotel', 7, '#c88a5a'], ['sheriff', 5.5, '#a8603e'], ['saloon', 8, '#6a8ac0'], ['store', 6, '#c8a878'], ['bank', 7.5, '#b45a42']], -50, 22, '-x');
  westRow(A, [['hotel', 8, '#9a7ab0'], ['store', 7, '#9ab07a']], -22, -16, '-z');
  westRow(A, [['store', 7, '#d8b878'], ['saloon', 8, '#c07848']], 7, -16, '-z');
  // the square's furniture: the bandstand ringed by lamps, the well, troughs, a parked wagon and hay
  A.prop('gazebo', 0, -33, 2.4, { yaw: 0 });
  for (const [x, z] of [[6.5, -28], [-6.5, -28], [6.5, -38.5], [-6.5, -38.5]]) A.prop('oillamp', x, z, 0.25, { scale: 1.8, yaw: 0 });
  A.prop('well', -15, -42, 1.0, { yaw: 0.3 });
  A.prop('trough', 16, -44, 0.6, { yaw: Math.PI / 2 }); A.prop('trough', -18.5, -22, 0.6, { yaw: Math.PI / 2 });
  A.prop('wagon', 15, -22.5, 1.4, { yaw: 0.35 }); A.prop('haybale', -17, -47, 0.8); A.prop('haybale', 18.5, -47.5, 0.75);
  // Main Street: lamps along both boardwalks, troughs and wagons pulled up at the edges
  for (const [x, z] of [[-6.3, -6], [6.3, 2], [-6.3, 10], [6.3, 18], [-6.3, 26], [6.3, 34], [-6.3, 42], [6.3, 48]]) A.prop('oillamp', x, z, 0.25, { scale: 1.8, yaw: 0 });
  A.prop('trough', -5.8, 18, 0.6, { yaw: Math.PI / 2 }); A.prop('trough', 5.8, 27, 0.6, { yaw: Math.PI / 2 });
  A.prop('wagon', -5.2, 36, 1.4, { yaw: Math.PI - 0.06 });
  // the south end: a split-rail fence across the street, and the water tower and hay beyond it
  for (let x = -6.3; x <= 6.4; x += 1.8) A.prop('railfence', x, 50.5, 0.9, { yaw: Math.PI + (A.rnd() - 0.5) * 0.06, block: false });
  A.prop('watertower', 5, 56, 2.0, { yaw: 0.4, block: false }); A.prop('haybale', -5, 53.5, 0.8, { block: false });
};
ARENA_FEATURES.west = {
  init(st) { st.tall = ARENA.props.filter(o => o.height); st.lamps = ARENA.props.filter(o => o.kind === 'oillamp'); st.acc = 0; },
  update(st, dt) {
    // a building between the camera and the hero turns see-through (the camera looks north from straight behind
    // the hero, so only a building across the hero's own x can hide it; the rows beside the street never do)
    const h = G.hero.pos;
    for (const o of st.tall) {
      const behind = Math.abs(h[0] - o.x) < o.hw + 0.2 && h[2] < o.z + o.hd + 0.5 && h[2] > o.z - o.hd - o.height * 0.85;
      o.fade = clamp((o.fade || 0) + (behind ? 3 : -3) * dt, 0, 0.72);
    }
    // warm dust motes drifting on the evening wind
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
