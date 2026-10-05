// ============================================================
// 3D icons: render goo objects and boss portraits into images once
// ============================================================
const ICONS = {
  map: {}, target: null, size: 192,
  get(key) { return this.map[key] || this.map._blank || ''; },
};

function iconBegin() {
  if (!ICONS.target) ICONS.target = GLX.target(ICONS.size, ICONS.size, { hdr: false, depth: true });
  const f = R.frame;
  ICONS.saved = { spot: f.spot.slice(), fogRange: f.fogRange.slice(), spotMin: f.spotMin, time: f.time };
  f.spot = [0, 0, 0, 1000]; f.fogRange = [500, 1000]; f.spotMin = 1;
}
function iconEnd() {
  const f = R.frame, s = ICONS.saved;
  f.spot = s.spot; f.fogRange = s.fogRange; f.spotMin = s.spotMin; f.time = s.time;
}
// Draw the current impostor and enemy streams (and optionally a hero) into the icon target; returns a PNG data URL
function iconCapture(eye, target, fov, heroOut) {
  const S = ICONS.size, T = ICONS.target;
  const keepW = R.w, keepH = R.h;
  R.w = S; R.h = S;
  R.setCamera(eye, target, fov);
  R.w = keepW; R.h = keepH;
  gl.bindFramebuffer(gl.FRAMEBUFFER, T.fb);
  gl.viewport(0, 0, S, S);
  gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  // enemies
  const ep = R.progs.enemy;
  let anyEnemy = false;
  for (const name in R.enemyDraw) if (R.enemyDraw[name].normal.stream.count) anyEnemy = true;
  if (anyEnemy) {
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.useProgram(ep.p); R.setFrame(ep);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, MODELS.boneTex); gl.uniform1i(ep.u.uBones, 1);
    gl.uniform1f(ep.u.uOutline, 0);
    for (const name in R.enemyDraw) {
      const d = R.enemyDraw[name].normal;
      if (!d.stream.count) continue;
      d.stream.upload();
      gl.bindVertexArray(d.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, d.ni, d.itype, 0, d.stream.count);
    }
    gl.disable(gl.CULL_FACE);
  }
  const s = R.streams.imp;
  if (s.count) {
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    s.upload();
    const p = R.progs.imp;
    gl.useProgram(p.p); R.setFrame(p);
    gl.bindVertexArray(R.vaos.imp);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, s.count);
    gl.disable(gl.BLEND);
  }
  if (heroOut) {
    gl.enable(gl.BLEND);
    R.drawHero(heroOut);
    gl.disable(gl.BLEND);
  }
  gl.bindVertexArray(null);
  const px = new Uint8Array(S * S * 4);
  gl.readPixels(0, 0, S, S, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const cv = document.createElement('canvas');
  cv.width = S; cv.height = S;
  const c2 = cv.getContext('2d'), img = c2.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const si = ((S - 1 - y) * S + x) * 4, di = (y * S + x) * 4, a = px[si + 3];
      const k = a > 0 ? 255 / a : 0;
      img.data[di] = Math.min(255, px[si] * k); img.data[di + 1] = Math.min(255, px[si + 1] * k); img.data[di + 2] = Math.min(255, px[si + 2] * k); img.data[di + 3] = a;
    }
  }
  c2.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}

function renderIcon(key, type, colw, opts = {}) {
  R.resetStreams();
  const ph = opts.phase ?? 0.6;
  pushImp(0, opts.y ?? 0, 0, opts.scale ?? 0.62, opts.ax ?? 0, opts.ay ?? 0, opts.az ?? 1, opts.stretch ?? 1, type, colw, opts.emissive ?? 0.12, ph, opts.p0 ?? 0, opts.p1 ?? 0, 0, 1);
  ICONS.map[key] = iconCapture(opts.eye || [0.0, 0.7, 2.45], [0, 0.02, 0], 0.55);
}

function renderAllIcons() {
  iconBegin();
  const special = {
    ball: { emissive: 0.2, scale: 0.55 },
    fists: { scale: 0.62 },
    grenade: { scale: 0.58 },
    missile: { ax: 0.55, ay: 0.55, az: 0.6, stretch: 1.15, scale: 0.6 },
    mine: { scale: 0.7, y: -0.18, emissive: 0.35 },
    blade: { scale: 0.7, eye: [0, 1.6, 1.8], emissive: 0.15 },
    lightning: { emissive: 0.7, scale: 0.62 },
    aura: { scale: 0.75, eye: [0, 1.5, 1.9] },
    worms: { scale: 0.62, y: -0.25, p0: 1, ax: 0.8, az: 0.6 },
    buddies: { scale: 0.62, p0: 1 },
    axe: { scale: 0.7, phase: 0.8, eye: [0, 1.4, 1.9] },
    laser: { scale: 0.62, emissive: 0.3 },
    shield: { scale: 0.62, emissive: 0.15 },
  };
  for (const id in SKILLS) { const ic = SKILLS[id].icon; renderIcon('skill-' + id, ic.type, ic.colw, special[id] || {}); }
  const pspecial = {
    thick: { scale: 0.62 }, regen: { scale: 0.6, emissive: 0.15 }, speed: { ax: 1, ay: 0.1, az: 0.15, stretch: 1.25, scale: 0.6 }, magnet: { scale: 0.62 },
    power: { scale: 0.62, emissive: 0.2 }, armor: { scale: 0.62 }, haste: { scale: 0.6 }, reach: { scale: 0.68, eye: [0, 1.6, 1.8] }, multishot: { scale: 0.62 }, growth: { scale: 0.55, p1: 0, emissive: 0.3 },
  };
  for (const id in PASSIVES) { const ic = PASSIVES[id].icon; renderIcon('passive-' + id, ic.type, ic.colw, pspecial[id] || {}); }
  const mspecial = { damage: { scale: 0.62 }, health: { scale: 0.6, emissive: 0.15 }, offline: { scale: 0.62 }, speed: { ax: 1, ay: 0.1, az: 0.15, stretch: 1.25, scale: 0.6 }, magnet: { scale: 0.62 } };
  for (const id in META_UPGRADES) { const ic = META_UPGRADES[id].icon; renderIcon('meta-' + id, ic.type, ic.colw, mspecial[id] || {}); }
  renderIcon('chapters', 20, 0, { scale: 0.62, emissive: 0.1 });
  renderHeroIcons();
  iconEnd();
  R.resetStreams();
}

// The real jelly hero, posed at the origin: one icon per body color and per costume
function renderHeroIcons() {
  const keep = { base: R.goo.base, accent: R.goo.accent, rim: R.goo.rim };
  const h = new Hero();
  h.reset(0, 0); h.setArmCount(2); h.yaw = 0.35;
  for (let i = 0; i < 45; i++) h.update(1 / 60, [0, 0, 0], true);
  const shot = key => { h.buildPrims(); R.resetStreams(); ICONS.map[key] = iconCapture([0, 1.6, 3.5], [0, 1.18, 0], 0.55, h.out); };
  const paint = s => {
    R.goo.base = hexToRgb(s.base); R.goo.accent = hexToRgb(s.accent); R.goo.rim = hexToRgb(s.rim);
    const g = h.out.grad; if (s.top) { g.set(hexToRgb(s.top)); g[3] = 1; } else g[3] = 0;
  };
  h.setCostume('none');
  for (const s of SKINS) { paint(s); shot('skin-' + s.id); }
  paint(SKINS[0]);
  for (const c of COSTUMES) { h.setCostume(c.id); shot('costume-' + c.id); }
  h.setCostume('none'); shot('hero');
  R.goo.base = keep.base; R.goo.accent = keep.accent; R.goo.rim = keep.rim;
}

const BOSS_OF_MODEL = { stomper: 'stomper', hurler: 'hurler', charger: 'charger', twin: 'twins', conductor: 'conductor' };
function renderBossPortrait(model) {
  const id = BOSS_OF_MODEL[model];
  if (!id || !R.enemyDraw[model]) return;
  iconBegin();
  R.resetStreams();
  const m = MODELS.defs[model], clip = m.clips.idle || m.clips.run, B = BOSS_TYPES[id], t = hexToRgb(B.tint);
  pushEnemy(model, false, 0, 0, 0, 0.45, clip.row + 2, 1, 1, 0, 0, 0, t[0], t[1], t[2]);
  const top = m.top || 1.1;
  ICONS.map['boss-' + id] = iconCapture([0.55, top * 0.95, top * 1.45], [0, top * 0.72, 0], 0.62);
  iconEnd();
  R.resetStreams();
}
