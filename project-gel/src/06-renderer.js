// ============================================================
// Renderer: passes, instance streams, camera, post-processing
// ============================================================
const R = {
  canvas: null, w: 1, h: 1, cssW: 1, cssH: 1, pixelRatio: 1,
  progs: {}, vaos: {}, streams: {}, enemyDraw: {}, targets: null,
  cam: { pos: [0, 10, 10], target: [0, 0, 0], fovY: 0.55, view: M4.create(), proj: M4.create(), viewProj: M4.create(), invViewProj: M4.create(), right: [1, 0, 0], up: [0, 1, 0], pixAng: 0.001 },
  frame: {
    time: 0, lightDir: [-0.45, 0.82, 0.36], lightCol: [1, 0.97, 0.92], skyCol: [0.46, 0.62, 0.8], groundCol: [0.1, 0.16, 0.24], fogCol: [0.04, 0.11, 0.19],
    spot: [0, 0, 0, 13], fogRange: [10, 26], spotMin: 0.42, arena: 0, poolCol: [0.1, 0.4, 0.5], poolGlow: 0, rockCol: [0.5, 0.5, 0.55],
    stoneA: [0.17, 0.3, 0.41], stoneB: [0.25, 0.4, 0.53], grout: [0.05, 0.11, 0.17], accent: [0.3, 1, 0.5], shadowTint: [0.05, 0.12, 0.25],
    bloom: 0.48, hurt: 0, lowHp: 0, flashW: 0,
  },
  goo: { base: hexToRgb('#18d2ff'), accent: hexToRgb('#7b55f5'), pink: hexToRgb('#ff5fb8'), rim: hexToRgb('#8ef3ff') },
  settings: { msaa: true, bloom: true, scale: 1 },
};

R.init = function (canvas) {
  R.canvas = canvas;
  if (!GLX.init(canvas)) return false;
  const P = (vs, fs, name, attribs) => (R.progs[name] = GLX.program(vs, fs, name, attribs));
  P(VS_FLOOR, FS_FLOOR, 'floor', ['aPos']);
  P(VS_HERO, FS_HERO, 'hero', ['aCorner']);
  P(VS_IMP, FS_IMP, 'imp', ['aCorner', 'iPosS', 'iAxis', 'iP0', 'iP1']);
  P(VS_ENEMY, FS_ENEMY, 'enemy', ['aPos', 'aNrm', 'aBones', 'aW0', 'aAO', 'aCol', 'iPosYaw', 'iAnim', 'iFx', 'iTint']);
  P(VS_DECAL, FS_DECAL, 'decal', ['aCorner', 'iA', 'iB', 'iC']);
  P(VS_PART, FS_PART, 'part', ['aCorner', 'iPos', 'iCol', 'iVel']);
  P(VS_RIB, FS_RIB, 'rib', ['aPos', 'aUV', 'aCol']);
  P(VS_QUADW, FS_AURA, 'aura', ['aCorner']);
  P(VS_QUADW, FS_BUBBLE, 'bubble', ['aCorner']);
  P(VS_QUADW, FS_POOL, 'pool', ['aCorner']);
  P(VS_FULL, FS_DOWN, 'down', ['aPos']);
  P(VS_FULL, FS_UP, 'up', ['aPos']);
  P(VS_FULL, FS_COMPOSITE, 'composite', ['aPos']);

  // static geometry
  const quad = GLX.buffer(new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]));
  const tri = GLX.buffer(new Float32Array([-1, -1, 3, -1, -1, 3]));
  const mkVao = (setup) => { const v = gl.createVertexArray(); gl.bindVertexArray(v); setup(); gl.bindVertexArray(null); return v; };
  const quadAttr = () => { gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); };
  R.vaos.quad = mkVao(quadAttr);
  R.vaos.tri = mkVao(() => { gl.bindBuffer(gl.ARRAY_BUFFER, tri); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); });

  const S = R.streams;
  S.imp = new InstanceStream(16, 3000);
  S.decalA = new InstanceStream(12, 2600);
  S.decalAdd = new InstanceStream(12, 400);
  S.partAdd = new InstanceStream(12, 5000);
  S.partAlpha = new InstanceStream(12, 1200);
  R.vaos.imp = mkVao(() => { quadAttr(); S.imp.bindAttribs([[1, 4], [2, 4], [3, 4], [4, 4]]); });
  R.vaos.decalA = mkVao(() => { quadAttr(); S.decalA.bindAttribs([[1, 4], [2, 4], [3, 4]]); });
  R.vaos.decalAdd = mkVao(() => { quadAttr(); S.decalAdd.bindAttribs([[1, 4], [2, 4], [3, 4]]); });
  R.vaos.partAdd = mkVao(() => { quadAttr(); S.partAdd.bindAttribs([[1, 4], [2, 4], [3, 4]]); });
  R.vaos.partAlpha = mkVao(() => { quadAttr(); S.partAlpha.bindAttribs([[1, 4], [2, 4], [3, 4]]); });

  // ribbons: dynamic vertices (pos3, uv3, col4) and indices
  R.rib = { maxV: 16000, verts: new Float32Array(16000 * 10), idx: new Uint16Array(48000), nv: 0, ni: 0, tubeStart: 0 };
  R.rib.vbuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, R.rib.vbuf); gl.bufferData(gl.ARRAY_BUFFER, R.rib.verts.byteLength, gl.DYNAMIC_DRAW);
  R.rib.ibuf = gl.createBuffer();
  R.vaos.rib = mkVao(() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, R.rib.vbuf);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 40, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 40, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, R.rib.ibuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, R.rib.idx.byteLength, gl.DYNAMIC_DRAW);
  });
  return true;
};

// Upload an enemy mesh as it arrives; creates normal + elite instance streams. Crowns attach to their base model.
R.crowns = {};
const ENEMY_CAPS = { rock0: 160, rock1: 160, rock2: 160, helmet: 220, spear: 220, axe: 180, javelin: 140, bomber: 140, knight: 120, stickman: 700, sprinter: 300, brute: 160, archer: 160, splitter: 160, shield: 160, stomper: 4, hurler: 4, charger: 4, twin: 4, conductor: 4 };
R._meshVao = function (vbuf, ibuf, stream) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  const st = 56;
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, st, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, st, 12);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, st, 24);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, st, 32);
  gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.FLOAT, false, st, 36);
  gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5, 4, gl.FLOAT, false, st, 40);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  stream.bindAttribs([[6, 4], [7, 4], [8, 4], [9, 4]]);
  gl.bindVertexArray(null);
  return vao;
};
R._upload = function (mesh) {
  const vbuf = GLX.buffer(mesh.verts);
  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  return { vbuf, ibuf, ni: mesh.ni, itype: mesh.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
};
R.addEnemyMesh = function (name, mesh) {
  if (name.endsWith('_crown')) {
    const base = name.slice(0, -6);
    R.crowns[base] = R._upload(mesh);
    R._attachCrown(base);
    return;
  }
  const up = R._upload(mesh);
  const mk = (cap) => { const stream = new InstanceStream(16, cap); return { stream, vao: R._meshVao(up.vbuf, up.ibuf, stream), ni: up.ni, itype: up.itype }; };
  R.enemyDraw[name] = { normal: mk(ENEMY_CAPS[name] || 64), elite: mk(40), crown: null };
  R._attachCrown(name);
};
R._attachCrown = function (base) {
  const e = R.enemyDraw[base], c = R.crowns[base];
  if (!e || !c || e.crown) return;
  e.crown = { vao: R._meshVao(c.vbuf, c.ibuf, e.elite.stream), ni: c.ni, itype: c.itype };
};
R.initEnemies = function (models) { for (const name in models.meshes) R.addEnemyMesh(name, models.meshes[name]); };

R.resize = function (cssW, cssH, pixelRatio) {
  const w = Math.max(1, Math.round(cssW * pixelRatio)), h = Math.max(1, Math.round(cssH * pixelRatio));
  R.cssW = cssW; R.cssH = cssH; R.pixelRatio = pixelRatio;
  R.canvas.width = w; R.canvas.height = h;
  if (R.w === w && R.h === h && R.targets && R.targets.msaaWanted === R.settings.msaa) return;
  R.w = w; R.h = h;
  const T = R.targets;
  if (T) { GLX.destroyTarget(T.msaa); GLX.destroyTarget(T.scene); T.bloom.forEach(GLX.destroyTarget); }
  const hdr = GLCAPS.hdr;
  const samples = R.settings.msaa ? GLCAPS.samples : 0;
  const msaa = samples > 0 ? GLX.msaaTarget(w, h, samples, hdr) : null;
  const scene = GLX.target(w, h, { hdr, depth: !msaa });
  const bloom = [];
  let bw = Math.max(1, w >> 1), bh = Math.max(1, h >> 1);
  for (let i = 0; i < 5; i++) { bloom.push(GLX.target(bw, bh, { hdr })); bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1); }
  R.targets = { msaa, scene, bloom, msaaWanted: R.settings.msaa };
};

// Camera: perspective looking from eye to target
R.setCamera = function (eye, target, fovY) {
  const c = R.cam;
  V3.copy(c.pos, eye); V3.copy(c.target, target); c.fovY = fovY;
  M4.perspective(c.proj, fovY, R.w / R.h, 0.3, 220);
  M4.lookAt(c.view, eye, target, [0, 1, 0]);
  M4.mul(c.viewProj, c.proj, c.view);
  M4.invert(c.invViewProj, c.viewProj);
  c.right[0] = c.view[0]; c.right[1] = c.view[4]; c.right[2] = c.view[8];
  c.up[0] = c.view[1]; c.up[1] = c.view[5]; c.up[2] = c.view[9];
  c.pixAng = 2 * Math.tan(fovY / 2) / R.h;
};

// World point -> CSS pixel coordinates (returns null when behind the camera)
const _tp = [0, 0, 0];
R.project = function (x, y, z, out) {
  const m = R.cam.viewProj;
  const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  if (w <= 0.01) return null;
  const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
  out[0] = (cx * 0.5 + 0.5) * R.cssW; out[1] = (1 - (cy * 0.5 + 0.5)) * R.cssH;
  return out;
};
// Screen (CSS px) -> ground plane point
R.unprojectGround = function (sx, sy, out) {
  const nx = (sx / R.cssW) * 2 - 1, ny = 1 - (sy / R.cssH) * 2;
  const a = M4.transformPoint([0, 0, 0], R.cam.invViewProj, nx, ny, -1);
  const b = M4.transformPoint([0, 0, 0], R.cam.invViewProj, nx, ny, 1);
  const dy = b[1] - a[1];
  if (Math.abs(dy) < 1e-6) return null;
  const t = -a[1] / dy;
  out[0] = a[0] + (b[0] - a[0]) * t; out[1] = 0; out[2] = a[2] + (b[2] - a[2]) * t;
  return out;
};

R.setFrame = function (prog) {
  const u = prog.u, c = R.cam, f = R.frame;
  if (u.uViewProj) gl.uniformMatrix4fv(u.uViewProj, false, c.viewProj);
  if (u.uCamPos) gl.uniform3fv(u.uCamPos, c.pos);
  if (u.uCamRight) gl.uniform3fv(u.uCamRight, c.right);
  if (u.uCamUp) gl.uniform3fv(u.uCamUp, c.up);
  if (u.uTime) gl.uniform1f(u.uTime, f.time);
  if (u.uLightDir) gl.uniform3fv(u.uLightDir, f.lightDir);
  if (u.uLightCol) gl.uniform3fv(u.uLightCol, f.lightCol);
  if (u.uSkyCol) gl.uniform3fv(u.uSkyCol, f.skyCol);
  if (u.uGroundCol) gl.uniform3fv(u.uGroundCol, f.groundCol);
  if (u.uFogCol) gl.uniform3fv(u.uFogCol, f.fogCol);
  if (u.uSpot) gl.uniform4fv(u.uSpot, f.spot);
  if (u.uFogRange) gl.uniform2fv(u.uFogRange, f.fogRange);
  if (u.uSpotMin !== undefined && u.uSpotMin) gl.uniform1f(u.uSpotMin, f.spotMin);
  if (u.uPixAng) gl.uniform1f(u.uPixAng, c.pixAng);
  if (u.uNoise) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, TEX.noise); gl.uniform1i(u.uNoise, 0); }
  if (u.uGooBase) {
    gl.uniform3fv(u.uGooBase, R.goo.base); gl.uniform3fv(u.uGooAccent, R.goo.accent);
    gl.uniform3fv(u.uGooPink, R.goo.pink); gl.uniform3fv(u.uGooRim, R.goo.rim);
  }
};

// ------------------------------------------------------------
// Scene description filled every frame by the game
// ------------------------------------------------------------
const SCENE = {
  floor: true,
  hero: null,          // HeroRender object or null
  heroShadow: null,    // { data: Float32Array(56), count }
  aura: null,          // { x, z, r, level }
  bubble: null,        // { x, y, z, r, hit: [x,y,z,t], fade }
  arenaBox: null,      // [half width, half depth, corner radius] or null for no walls
  pools: [],           // [{ x, z, r, ph }]
};

R.drawScene = function () {
  const T = R.targets, f = R.frame;
  const drawFb = T.msaa ? T.msaa.fb : T.scene.fb;
  gl.bindFramebuffer(gl.FRAMEBUFFER, drawFb);
  gl.viewport(0, 0, R.w, R.h);
  gl.clearColor(f.fogCol[0], f.fogCol[1], f.fogCol[2], 1);
  gl.clearDepth(1);
  gl.depthMask(true);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.BLEND);
  gl.disable(gl.CULL_FACE);

  // floor
  if (SCENE.floor) {
    const p = R.progs.floor, u = p.u;
    gl.useProgram(p.p); R.setFrame(p);
    const t = R.cam.target;
    gl.uniform2f(u.uCenter, Math.round(t[0] / 4) * 4, Math.round(t[2] / 4) * 4);
    gl.uniform1f(u.uHalf, 80);
    gl.uniform3fv(u.uStoneA, f.stoneA); gl.uniform3fv(u.uStoneB, f.stoneB); gl.uniform3fv(u.uGrout, f.grout);
    gl.uniform3fv(u.uArenaBox, SCENE.arenaBox || [0, 0, 0]);
    const hs = SCENE.heroShadow;
    gl.uniform1i(u.uShCount, hs ? hs.count : 0);
    if (hs && hs.count) { gl.uniform4fv(u.uShSph, hs.data); gl.uniform3fv(u.uHeroPos, hs.pos); }
    gl.bindVertexArray(R.vaos.quad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // pools, then decals
  gl.depthMask(false);
  gl.enable(gl.BLEND);
  if (SCENE.pools.length) {
    const p = R.progs.pool;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(p.p); R.setFrame(p);
    gl.uniform3fv(p.u.uPoolCol, f.poolCol); gl.uniform1f(p.u.uPoolGlow, f.poolGlow); gl.uniform1i(p.u.uBillboard, 0);
    gl.bindVertexArray(R.vaos.quad);
    for (const o of SCENE.pools) {
      gl.uniform3f(p.u.uC, o.x, 0, o.z); gl.uniform1f(p.u.uR, o.r * 1.18); gl.uniform1f(p.u.uSeed, o.ph);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
  const S = R.streams;
  const drawInst = (prog, vao, stream, verts) => {
    if (!stream.count) return;
    stream.upload();
    gl.useProgram(prog.p); R.setFrame(prog);
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, verts, stream.count);
  };
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawInst(R.progs.decal, R.vaos.decalA, S.decalA, 6);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  drawInst(R.progs.decal, R.vaos.decalAdd, S.decalAdd, 6);

  // aura puddle
  if (SCENE.aura) {
    const a = SCENE.aura, p = R.progs.aura;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(p.p); R.setFrame(p);
    gl.uniform3f(p.u.uC, a.x, 0, a.z); gl.uniform1f(p.u.uR, a.r); gl.uniform1i(p.u.uBillboard, 0); gl.uniform1f(p.u.uLevel, a.level);
    gl.bindVertexArray(R.vaos.quad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // enemies
  gl.disable(gl.BLEND);
  gl.depthMask(true);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);
  const ep = R.progs.enemy;
  gl.useProgram(ep.p); R.setFrame(ep);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, MODELS.boneTex); gl.uniform1i(ep.u.uBones, 1);
  gl.uniform1f(ep.u.uOutline, 0);
  const outlines = [];
  for (const name in R.enemyDraw) {
    const e = R.enemyDraw[name];
    for (const kind of ['normal', 'elite']) {
      const d = e[kind];
      if (!d.stream.count) continue;
      d.stream.upload();
      gl.bindVertexArray(d.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, d.ni, d.itype, 0, d.stream.count);
      if (kind === 'elite') outlines.push(e);
    }
  }
  for (const e of outlines) {
    if (e.crown) { gl.bindVertexArray(e.crown.vao); gl.drawElementsInstanced(gl.TRIANGLES, e.crown.ni, e.crown.itype, 0, e.elite.stream.count); }
  }
  if (outlines.length) {
    gl.cullFace(gl.FRONT);
    gl.uniform1f(ep.u.uOutline, 0.03);
    gl.uniform3f(ep.u.uOutlineCol, 1.15, 0.85, 0.25);
    for (const e of outlines) { gl.bindVertexArray(e.elite.vao); gl.drawElementsInstanced(gl.TRIANGLES, e.elite.ni, e.elite.itype, 0, e.elite.stream.count); }
    gl.uniform1f(ep.u.uOutline, 0);
    gl.cullFace(gl.BACK);
  }
  gl.disable(gl.CULL_FACE);

  // goo objects and pickups
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawInst(R.progs.imp, R.vaos.imp, S.imp, 6);

  // hero
  if (SCENE.hero) R.drawHero(SCENE.hero);

  // goo jets and ropes (tube ribbons), then smoke
  gl.depthMask(false);
  R.uploadRibbons();
  if (R.rib.ni > R.rib.tubeStart) {
    const p = R.progs.rib;
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(p.p); R.setFrame(p); gl.uniform1i(p.u.uMode, 1);
    gl.bindVertexArray(R.vaos.rib);
    gl.drawElements(gl.TRIANGLES, R.rib.ni - R.rib.tubeStart, gl.UNSIGNED_SHORT, R.rib.tubeStart * 2);
  }
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  drawInst(R.progs.part, R.vaos.partAlpha, S.partAlpha, 6);

  // bubble shield
  if (SCENE.bubble) {
    const b = SCENE.bubble, p = R.progs.bubble;
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(p.p); R.setFrame(p);
    gl.uniform3f(p.u.uC, b.x, b.y, b.z); gl.uniform1f(p.u.uR, b.r); gl.uniform1i(p.u.uBillboard, 1);
    gl.uniform4fv(p.u.uHit, b.hit); gl.uniform1f(p.u.uFade, b.fade);
    gl.bindVertexArray(R.vaos.quad);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  // additive: swooshes, trails, lightning, glows, sparks
  gl.blendFunc(gl.ONE, gl.ONE);
  if (R.rib.tubeStart > 0) {
    const p = R.progs.rib;
    gl.useProgram(p.p); R.setFrame(p); gl.uniform1i(p.u.uMode, 0);
    gl.bindVertexArray(R.vaos.rib);
    gl.drawElements(gl.TRIANGLES, R.rib.tubeStart, gl.UNSIGNED_SHORT, 0);
  }
  drawInst(R.progs.part, R.vaos.partAdd, S.partAdd, 6);

  gl.depthMask(true);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(null);
};

R.drawHero = function (h) {
  const p = R.progs.hero, u = p.u;
  gl.useProgram(p.p); R.setFrame(p);
  gl.uniform4fv(u.uPA, h.pa); gl.uniform4fv(u.uPB, h.pb); gl.uniform4fv(u.uPC, h.pc);
  gl.uniform1i(u.uPCount, h.count);
  gl.uniformMatrix3fv(u.uRotInv, false, h.rotInv);
  gl.uniform3fv(u.uBoundC, h.boundC); gl.uniform1f(u.uBoundR, h.boundR);
  gl.uniform1f(u.uFlash, h.flash); gl.uniform1f(u.uGlow, h.glow); gl.uniform1f(u.uWobble, h.wobble);
  gl.uniform1f(u.uBubbles, h.bubbles); gl.uniform1f(u.uSpark, h.spark); gl.uniform1f(u.uGloss, h.gloss);
  gl.uniform4fv(u.uChest, h.chest);
  gl.uniform3fv(u.uPal, h.pal); gl.uniform4fv(u.uGrad, h.grad); gl.uniform1f(u.uGroundY, h.groundY);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.bindVertexArray(R.vaos.quad);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

// Ribbon builder: additive strips first, tubes appended after (tubeStart marks the split)
R.ribBegin = function () { R.rib.nv = 0; R.rib.ni = 0; R.rib.tubeStart = 0; R.rib._tubes = []; };
// points: flat array [x,y,z,...]; widths and colors per point (arrays) ; mode 0 additive, 1 tube
R.ribStrip = function (pts, n, width, col, mode, uOff = 0, uLen = 1, widthFn) {
  if (n < 2) return;
  if (mode === 1) { R.rib._tubes.push([pts.slice(0, n * 3), n, width, col, uOff, uLen, widthFn]); return; }
  R._emitStrip(pts, n, width, col, uOff, uLen, widthFn);
};
R._emitStrip = function (pts, n, width, col, uOff, uLen, widthFn) {
  const rb = R.rib;
  if (rb.nv + n * 2 >= rb.maxV || rb.ni + (n - 1) * 6 >= rb.idx.length) return;
  const cam = R.cam.pos, V = rb.verts;
  const base = rb.nv;
  for (let i = 0; i < n; i++) {
    const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
    const j0 = Math.max(0, i - 1), j1 = Math.min(n - 1, i + 1);
    let tx = pts[j1 * 3] - pts[j0 * 3], ty = pts[j1 * 3 + 1] - pts[j0 * 3 + 1], tz = pts[j1 * 3 + 2] - pts[j0 * 3 + 2];
    const vx = cam[0] - x, vy = cam[1] - y, vz = cam[2] - z;
    let sx = ty * vz - tz * vy, sy = tz * vx - tx * vz, sz = tx * vy - ty * vx;
    const sl = Math.hypot(sx, sy, sz) || 1;
    const u = i / (n - 1);
    const w = (widthFn ? widthFn(u) : 1) * width;
    sx = sx / sl * w; sy = sy / sl * w; sz = sz / sl * w;
    const a = typeof col[3] === 'function' ? col[3](u) : col[3];
    for (let s = 0; s < 2; s++) {
      const o = (rb.nv++) * 10, sg = s === 0 ? -1 : 1;
      V[o] = x + sx * sg; V[o + 1] = y + sy * sg; V[o + 2] = z + sz * sg;
      V[o + 3] = uOff + u * uLen; V[o + 4] = sg; V[o + 5] = 0;
      V[o + 6] = col[0]; V[o + 7] = col[1]; V[o + 8] = col[2]; V[o + 9] = a;
    }
  }
  for (let i = 0; i < n - 1; i++) {
    const a = base + i * 2;
    rb.idx[rb.ni++] = a; rb.idx[rb.ni++] = a + 1; rb.idx[rb.ni++] = a + 2;
    rb.idx[rb.ni++] = a + 1; rb.idx[rb.ni++] = a + 3; rb.idx[rb.ni++] = a + 2;
  }
};
R.uploadRibbons = function () {
  const rb = R.rib;
  rb.tubeStart = rb.ni;
  for (const t of rb._tubes) R._emitStrip(...t);
  if (!rb.nv) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, rb.vbuf);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, rb.verts, 0, rb.nv * 10);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rb.ibuf);
  gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, rb.idx, 0, rb.ni);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
};

R.post = function (targetFb = null, vw = R.w, vh = R.h) {
  const T = R.targets, f = R.frame;
  if (T.msaa) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, T.msaa.fb);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, T.scene.fb);
    gl.blitFramebuffer(0, 0, R.w, R.h, 0, 0, R.w, R.h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.bindVertexArray(R.vaos.tri);
  const useBloom = R.settings.bloom && f.bloom > 0;
  if (useBloom) {
    const down = R.progs.down, up = R.progs.up;
    gl.useProgram(down.p);
    gl.uniform1i(down.u.uSrc, 0);
    gl.activeTexture(gl.TEXTURE0);
    let src = T.scene;
    for (let i = 0; i < T.bloom.length; i++) {
      const dst = T.bloom[i];
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
      gl.viewport(0, 0, dst.w, dst.h);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform2f(down.u.uTexel, 1 / src.w, 1 / src.h);
      gl.uniform1i(down.u.uPrefilter, i === 0 ? 1 : 0);
      gl.uniform1f(down.u.uThreshold, GLCAPS.hdr ? 1.0 : 0.82);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      src = dst;
    }
    gl.useProgram(up.p);
    gl.uniform1i(up.u.uSrc, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = T.bloom.length - 1; i > 0; i--) {
      const s = T.bloom[i], d = T.bloom[i - 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, d.fb);
      gl.viewport(0, 0, d.w, d.h);
      gl.bindTexture(gl.TEXTURE_2D, s.tex);
      gl.uniform2f(up.u.uTexel, 1 / s.w, 1 / s.h);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.disable(gl.BLEND);
  }
  const c = R.progs.composite;
  gl.bindFramebuffer(gl.FRAMEBUFFER, targetFb);
  gl.viewport(0, 0, vw, vh);
  gl.useProgram(c.p);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.scene.tex); gl.uniform1i(c.u.uScene, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, T.bloom[0].tex); gl.uniform1i(c.u.uBloom, 1);
  gl.uniform1f(c.u.uBloomStr, useBloom ? f.bloom : 0);
  gl.uniform1f(c.u.uHurt, f.hurt); gl.uniform1f(c.u.uLowHp, f.lowHp);
  gl.uniform1f(c.u.uAspect, R.w / R.h); gl.uniform1f(c.u.uTimeC, f.time); gl.uniform1f(c.u.uFlashW, f.flashW);
  gl.uniform3fv(c.u.uShadowTint, f.shadowTint);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.enable(gl.DEPTH_TEST);
  gl.bindVertexArray(null);
};

R.resetStreams = function () {
  for (const k in R.streams) R.streams[k].reset();
  for (const name in R.enemyDraw) { const e = R.enemyDraw[name]; e.normal.stream.reset(); e.elite.stream.reset(); }
  R.ribBegin();
};

// ------------------------------------------------------------
// Stream writers
// ------------------------------------------------------------
// Goo object / pickup impostor
function pushImp(x, y, z, scale, ax, ay, az, stretch, type, colw, emissive, phase, p0 = 0, p1 = 0, p2 = 0, alpha = 1) {
  const s = R.streams.imp, o = s.push();
  if (o < 0) return;
  const d = s.data;
  d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = scale;
  d[o + 4] = ax; d[o + 5] = ay; d[o + 6] = az; d[o + 7] = stretch;
  d[o + 8] = type; d[o + 9] = colw; d[o + 10] = emissive; d[o + 11] = phase;
  d[o + 12] = p0; d[o + 13] = p1; d[o + 14] = p2; d[o + 15] = alpha;
}
// Decal on the floor. type: 0 splat, 1 shadow, 2 scorch, 3 ring, 4 tele circle, 5 tele lane, 6 magnet ring, 7 bulge, 8 crack, 9 aim line
function pushDecal(x, z, sx, sz, rot, type, seed, t, r, g, b, a, additive = false) {
  const s = additive ? R.streams.decalAdd : R.streams.decalA, o = s.push();
  if (o < 0) return;
  const d = s.data;
  d[o] = x; d[o + 1] = z; d[o + 2] = sx; d[o + 3] = sz;
  d[o + 4] = rot; d[o + 5] = type; d[o + 6] = seed; d[o + 7] = t;
  d[o + 8] = r; d[o + 9] = g; d[o + 10] = b; d[o + 11] = a;
}
// Particle billboard. type: 0 glow, 1 spark, 2 smoke, 3 star, 4 ring
function pushPart(x, y, z, size, r, g, b, a, vx, vy, vz, type) {
  const s = type === 2 ? R.streams.partAlpha : R.streams.partAdd, o = s.push();
  if (o < 0) return;
  const d = s.data;
  d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = size;
  d[o + 4] = r; d[o + 5] = g; d[o + 6] = b; d[o + 7] = a;
  d[o + 8] = vx; d[o + 9] = vy; d[o + 10] = vz; d[o + 11] = type;
}
// Enemy instance: model name, elite flag, position, yaw, anim row, scale, squash, dead, flash, aura tint, tint rgb
function pushEnemy(model, elite, x, y, z, yaw, row, scale, squash, dead, flash, aura, tr, tg, tb) {
  const e = R.enemyDraw[model];
  if (!e) return;
  const s = elite ? e.elite.stream : e.normal.stream, o = s.push();
  if (o < 0) return;
  const d = s.data;
  d[o] = x; d[o + 1] = y; d[o + 2] = z; d[o + 3] = yaw;
  d[o + 4] = row; d[o + 5] = scale; d[o + 6] = squash; d[o + 7] = dead;
  d[o + 8] = flash; d[o + 9] = 0; d[o + 10] = elite ? 1 : 0; d[o + 11] = aura;
  d[o + 12] = tr; d[o + 13] = tg; d[o + 14] = tb; d[o + 15] = 1;
}
