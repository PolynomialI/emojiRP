// ============================================================
// GLSL sources
// ============================================================
const GLSL_HEAD = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
`;

const GLSL_FRAME = `
uniform mat4 uViewProj;
uniform vec3 uCamPos;
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform float uTime;
uniform vec3 uLightDir;
uniform vec3 uLightCol;
uniform vec3 uSkyCol;
uniform vec3 uGroundCol;
uniform vec3 uFogCol;
uniform vec4 uSpot;
uniform vec2 uFogRange;
uniform float uSpotMin;
uniform sampler2D uNoise;
`;

const GLSL_COMMON = `
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
vec3 atmos(vec3 col, vec3 wp) {
  float r = length(wp.xz - uSpot.xz);
  float spot = mix(uSpotMin, 1.0, exp(-r * r / (uSpot.w * uSpot.w)));
  col *= spot;
  return mix(col, uFogCol, smoothstep(uFogRange.x, uFogRange.y, r));
}
vec3 envColor(vec3 r) {
  vec3 c = mix(uGroundCol * 0.55, uSkyCol * 1.25, smoothstep(-0.35, 0.75, r.y));
  c += uLightCol * pow(max(dot(r, uLightDir), 0.0), 20.0) * 1.2;
  c += vec3(0.6, 0.85, 1.0) * 0.16 * exp(-abs(r.y - 0.05) * 9.0);
  return c;
}
float smin(float a, float b, float k) {
  k = max(k, 1e-4);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
vec2 sminW(float a, float b, float k) {
  k = max(k, 1e-4);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return vec2(mix(b, a, h) - k * h * (1.0 - h), h);
}
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / max(k1, 1e-6);
}
vec2 sphHit(vec3 ro, vec3 rd, vec3 ce, float ra) {
  vec3 oc = ro - ce;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - ra * ra;
  float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}
`;

// Goo material shared by the hero and every goo object
const GLSL_GOO = `
uniform vec3 uGooBase;
uniform vec3 uGooAccent;
uniform vec3 uGooPink;
uniform vec3 uGooRim;
vec3 gooColor(float w) {
  if (w < 1.0) return mix(uGooBase, uGooAccent, w);
  if (w < 2.0) return mix(uGooAccent, uGooPink, w - 1.0);
  if (w < 3.5) return vec3(0.22, 0.92, 0.72);
  if (w < 4.5) return vec3(1.0, 0.36, 0.45);
  if (w < 5.5) return vec3(0.96, 0.54, 0.12);
  return vec3(1.0, 0.78, 0.22);
}
vec3 gooShade(vec3 base, vec3 p, vec3 n, vec3 v, float thin, float ao, float emissive, float gloss) {
  vec3 L = uLightDir;
  float ndl = dot(n, L);
  float wrap = clamp((ndl + 0.32) / 1.32, 0.0, 1.0);
  wrap = wrap * wrap * (3.0 - 2.0 * wrap);
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  vec3 hemi = mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5);
  vec3 shadowTint = mix(vec3(0.42, 0.5, 0.95), vec3(1.0), wrap);
  vec3 col = base * (hemi * 0.5 + uLightCol * wrap * 0.92) * shadowTint * mix(0.45, 1.0, ao);
  col += base * vec3(0.55, 0.95, 1.0) * thin * 0.34;
  col += base * uLightCol * pow(clamp(dot(v, -L), 0.0, 1.0), 3.0) * thin * 0.3;
  vec3 H = normalize(L + v);
  float nh = max(dot(n, H), 0.0);
  float spec = pow(nh, 150.0 * gloss + 10.0) * 1.7 + pow(nh, 16.0) * 0.12;
  vec3 L2 = normalize(vec3(0.75, 0.3, 0.55));
  float spec2 = pow(max(dot(n, normalize(L2 + v)), 0.0), 80.0) * 0.5;
  col += uLightCol * (spec + spec2) * mix(0.35, 1.0, ao);
  float F = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  col += envColor(reflect(-v, n)) * F * 0.6 * gloss;
  col += uGooRim * pow(1.0 - ndv, 3.0) * 0.32;
  col += base * emissive;
  return col;
}
`;

// ------------------------------------------------------------
// Floor: calm, low-contrast large bricks in each arena's colors,
// with a dark border outside the arena walls
// ------------------------------------------------------------
const VS_FLOOR = GLSL_HEAD + GLSL_FRAME + `
in vec2 aPos;
uniform vec2 uCenter;
uniform float uHalf;
out vec3 vW;
void main() {
  vec3 wp = vec3(uCenter.x + aPos.x * uHalf, 0.0, uCenter.y + aPos.y * uHalf);
  vW = wp;
  gl_Position = uViewProj * vec4(wp, 1.0);
}`;

const FS_FLOOR = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + `
in vec3 vW;
out vec4 fragColor;
uniform vec3 uStoneA;
uniform vec3 uStoneB;
uniform vec3 uGrout;
uniform vec4 uShSph[14];
uniform int uShCount;
uniform vec3 uHeroPos;
uniform vec3 uArenaBox; // half width, half depth, corner radius (0 = no walls)

float sdRoundRect(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

// Large running-bond bricks: x = distance to the brick edge (negative inside), y = brick hash
vec2 bricks(vec2 p) {
  const vec2 S = vec2(2.3, 1.15);
  float row = floor(p.y / S.y);
  float off = mod(row, 2.0) * 0.5 * S.x + hash11(row * 1.7) * 0.4;
  float col = floor((p.x + off) / S.x);
  vec2 c = vec2((col + 0.5) * S.x - off, (row + 0.5) * S.y);
  float h = hash12(vec2(col, row));
  return vec2(sdRoundRect(p - c, S * 0.5 - 0.035, 0.12), h);
}

float sphSoftShadow(vec3 ro, vec3 rd, vec4 sph, float k) {
  vec3 oc = ro - sph.xyz;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - sph.w * sph.w;
  float h = b * b - c;
  float d = sqrt(max(0.0, sph.w * sph.w - h)) - sph.w;
  float t = -b - sqrt(max(h, 0.0));
  return (t < 0.0) ? 1.0 : smoothstep(0.0, 1.0, 2.5 * k * d / t);
}
float heroShadow(vec3 wp) {
  if (uShCount == 0 || length(wp.xz - uHeroPos.xz) > 4.5) return 1.0;
  float s = 1.0;
  for (int i = 0; i < 14; i++) {
    if (i >= uShCount) break;
    s = min(s, sphSoftShadow(wp, uLightDir, uShSph[i], 2.6));
  }
  return s;
}

void main() {
  vec2 p = vW.xz;
  vec2 bk = bricks(p);
  // a very gentle bevel so bricks read without busy highlights
  const float e = 0.02;
  float hgt = smoothstep(0.0, 0.1, -bk.x);
  float hx = smoothstep(0.0, 0.1, -bricks(p + vec2(e, 0.0)).x);
  float hz = smoothstep(0.0, 0.1, -bricks(p + vec2(0.0, e)).x);
  vec3 N = normalize(vec3(-(hx - hgt) / e * 0.025, 1.0, -(hz - hgt) / e * 0.025));

  float mott = texture(uNoise, p * 0.045).r;
  float fine = texture(uNoise, p * 0.6 + bk.y * 5.0).g;
  vec3 alb = mix(uStoneA, uStoneB, bk.y * 0.7 + (mott - 0.5) * 0.5);
  alb *= 0.94 + 0.08 * mott + 0.04 * fine;
  // seams: only slightly darker than the bricks
  float seam = 1.0 - smoothstep(0.0, 0.035, -bk.x);
  alb = mix(alb, alb * 0.8, seam);
  float ao = mix(0.86, 1.0, smoothstep(0.0, 0.08, -bk.x));

  // the arena: dark outside, soft contact shading just inside the wall
  float outside = 0.0;
  if (uArenaBox.x > 0.0) {
    float sd = sdRoundRect(p, uArenaBox.xy, uArenaBox.z);
    ao *= mix(1.0, 0.62, smoothstep(-1.6, 0.0, sd));
    outside = smoothstep(-0.1, 1.2, sd);
    alb = mix(alb, uGrout * (0.8 + 0.3 * mott), outside);
  }

  vec3 V = normalize(uCamPos - vW);
  float sh = heroShadow(vW);
  float contact = mix(0.5, 1.0, smoothstep(0.15, 0.85, length(vW.xz - uHeroPos.xz)));
  if (uShCount == 0) contact = 1.0;
  float ndl = max(dot(N, uLightDir), 0.0);
  vec3 hemi = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
  vec3 col = alb * (hemi * 0.55 + uLightCol * ndl * 0.75 * sh) * ao * contact;
  vec3 H = normalize(uLightDir + V);
  col += uLightCol * pow(max(dot(N, H), 0.0), 24.0) * 0.06 * sh * ao * (1.0 - outside);
  fragColor = vec4(atmos(col, vW), 1.0);
}`;

// ------------------------------------------------------------
// Goo pools: wobbly liquid puddles that block movement
// ------------------------------------------------------------
const FS_POOL = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + `
in vec3 vW;
in vec2 vUV;
uniform vec3 uPoolCol;
uniform float uPoolGlow;
uniform float uSeed;
out vec4 fragColor;
void main() {
  float r = length(vUV);
  float ang = atan(vUV.y, vUV.x);
  float edge = 0.86 + 0.05 * sin(ang * 3.0 + uSeed) + 0.04 * sin(ang * 7.0 - uSeed * 2.0 + uTime * 0.6) + 0.03 * (texture(uNoise, vec2(ang * 0.25 + uSeed, uTime * 0.02)).r - 0.5);
  float m = 1.0 - smoothstep(edge - 0.02, edge + 0.01, r);
  float lip = smoothstep(edge - 0.1, edge - 0.01, r) * m;
  float wet = (1.0 - smoothstep(edge, edge + 0.1, r)) * (1.0 - m);
  if (m + wet < 0.003) discard;
  vec2 q = vW.xz;
  float w1 = texture(uNoise, q * 0.35 + vec2(uTime * 0.03, uSeed)).r;
  float w2 = texture(uNoise, q * 0.5 - vec2(uSeed, uTime * 0.025)).g;
  vec3 n = normalize(vec3((w1 - 0.5) * 0.5, 1.0, (w2 - 0.5) * 0.5));
  vec3 v = normalize(uCamPos - vW);
  float depth = smoothstep(edge, 0.0, r);
  vec3 col = mix(uPoolCol * 1.25, uPoolCol * 0.55, depth);
  float F = 0.03 + 0.97 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  col += envColor(reflect(-v, n)) * (0.08 + F * 0.4);
  vec3 H = normalize(uLightDir + v);
  col += uLightCol * pow(max(dot(n, H), 0.0), 90.0) * 0.9;
  float caus = smoothstep(0.8, 0.96, texture(uNoise, q * 0.28 + vec2(uTime * 0.02, -uTime * 0.03) + uSeed).b);
  col += mix(uPoolCol, vec3(1.0), 0.5) * caus * 0.12;
  col += uPoolCol * uPoolGlow * (0.8 + 0.4 * w1);
  col = mix(col, mix(uPoolCol, vec3(1.0), 0.45), lip * 0.6);
  // a darker wet stain around the pool
  vec4 outc = vec4(col, m);
  if (m < 0.5) outc = vec4(uPoolCol * 0.25, wet * 0.45);
  fragColor = vec4(atmos(outc.rgb, vW), outc.a);
}`;

// ------------------------------------------------------------
// Hero: raymarched blended shapes inside a camera-facing quad
// ------------------------------------------------------------
const HERO_MAXP = 40;
const VS_HERO = GLSL_HEAD + GLSL_FRAME + `
in vec2 aCorner;
uniform vec3 uBoundC;
uniform float uBoundR;
out vec3 vW;
void main() {
  vec3 toCam = uCamPos - uBoundC;
  float dc = length(toCam);
  toCam /= dc;
  float pull = min(uBoundR, dc - 0.3);
  vec3 c = uBoundC + toCam * pull;
  float half_ = uBoundR * 1.28;
  vec3 wp = c + (uCamRight * aCorner.x + uCamUp * aCorner.y) * half_;
  vW = wp;
  gl_Position = uViewProj * vec4(wp, 1.0);
}`;

const FS_HERO = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + GLSL_GOO + `
#define MAXP ${HERO_MAXP}
in vec3 vW;
out vec4 fragColor;
uniform vec4 uPA[MAXP];
uniform vec4 uPB[MAXP];
uniform vec4 uPC[MAXP];
uniform int uPCount;
uniform mat3 uRotInv;
uniform vec3 uBoundC;
uniform float uBoundR;
uniform float uPixAng;
uniform float uFlash;
uniform float uGlow;
uniform float uWobble;
uniform float uBubbles;
uniform float uSpark;
uniform float uGloss;
uniform vec4 uChest;
uniform vec3 uPal[4];   // costume colors, used by color weights 10..13
uniform vec4 uGrad;     // body gradient: top color, amount
uniform float uGroundY;

float prim(vec3 p, int i) {
  vec4 A = uPA[i], B = uPB[i], C = uPC[i];
  if (C.x < 0.5) return length(p - A.xyz) - A.w;
  if (C.x < 1.5) {
    vec3 pa = p - A.xyz, ba = B.xyz - A.xyz;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h) - mix(A.w, C.z, h);
  }
  return sdEllipsoid(uRotInv * (p - A.xyz), B.xyz);
}
float wob(vec3 p) {
  return uWobble * sin(p.x * 13.0 + uTime * 3.1) * sin(p.y * 11.0 - uTime * 2.3) * sin(p.z * 12.0 + uTime * 2.7);
}
float mapH(vec3 p) {
  float d = prim(p, 0);
  for (int i = 1; i < MAXP; i++) {
    if (i >= uPCount) break;
    d = smin(d, prim(p, i), uPB[i].w);
  }
  return d + wob(p);
}
// color of one shape: goo colors, costume palette, or the body (with its optional gradient)
vec3 primCol(float w, vec3 p) {
  if (w >= 9.5) return uPal[int(clamp(w - 10.0 + 0.5, 0.0, 3.0))];
  vec3 c = gooColor(w);
  if (w < 0.05) c = mix(c, uGrad.rgb, uGrad.w * smoothstep(0.5, 1.75, p.y - uGroundY));
  return c;
}
// distance, with the blended color and glow of the shapes that meet here
float mapHC(vec3 p, out vec3 col, out float g) {
  float d = prim(p, 0);
  col = primCol(uPC[0].y, p); g = uPC[0].w;
  for (int i = 1; i < MAXP; i++) {
    if (i >= uPCount) break;
    vec2 r = sminW(d, prim(p, i), uPB[i].w);
    d = r.x;
    col = mix(col, primCol(uPC[i].y, p), 1.0 - r.y);
    g = mix(g, uPC[i].w, 1.0 - r.y);
  }
  return d;
}
vec3 calcN(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.0016;
  return normalize(k.xyy * mapH(p + k.xyy * e) + k.yyx * mapH(p + k.yyx * e) + k.yxy * mapH(p + k.yxy * e) + k.xxx * mapH(p + k.xxx * e));
}

void main() {
  vec3 ro = uCamPos;
  vec3 rd = normalize(vW - uCamPos);
  vec2 bs = sphHit(ro, rd, uBoundC, uBoundR);
  if (bs.y < 0.0) discard;
  float t = max(bs.x, 0.0), tEnd = bs.y;
  float bestR = 1e9, bestT = t;
  bool hit = false;
  for (int i = 0; i < 90; i++) {
    float d = mapH(ro + rd * t);
    float r = d / (t * uPixAng);
    if (r < bestR) { bestR = r; bestT = t; }
    if (d < 0.0004 * t) { hit = true; break; }
    t += d * 0.9;
    if (t > tEnd) break;
  }
  float alpha = hit ? 1.0 : clamp(0.65 - bestR, 0.0, 1.0);
  if (alpha < 0.004) discard;
  vec3 p = ro + rd * (hit ? t : bestT);
  vec3 n = calcN(p);
  vec3 v = -rd;
  vec3 base; float glowW;
  mapHC(p, base, glowW);
  // living goo: slow swirls inside the body
  float sw = texture(uNoise, p.xz * 0.8 + vec2(p.y * 0.35, uTime * 0.025)).r + texture(uNoise, p.xy * 1.1 - vec2(uTime * 0.02, 0.0)).g;
  base *= 0.93 + 0.12 * (sw - 1.0) * 1.4;
  float thin = clamp(1.0 + mapH(p - n * 0.13) / 0.13, 0.0, 1.0);
  float occ = (0.05 - mapH(p + n * 0.05)) * 2.2 + (0.13 - mapH(p + n * 0.13)) * 1.1;
  float ao = clamp(1.0 - occ * 2.4, 0.0, 1.0) * mix(0.62, 1.0, smoothstep(0.0, 0.4, p.y - uBoundC.y + 0.9));
  float emissive = glowW + uGlow * 0.25 + uSpark * (0.6 + 0.4 * sin(uTime * 70.0));
  emissive += uChest.w * exp(-length(p - uChest.xyz) * 5.0) * 1.6;
  vec3 col = gooShade(base, p, n, v, thin, ao, emissive, uGloss * 0.8);
  // jelly: soft milky translucency, gentle shading and a bright candy rim
  float ndv0 = clamp(dot(n, v), 0.0, 1.0);
  float lum = dot(base, vec3(0.3, 0.55, 0.15));
  col = mix(col, base * (0.62 + 0.38 * ao) + col * 0.35, 0.35);
  col += mix(base, vec3(1.0), 0.5) * pow(1.0 - ndv0, 2.4) * (0.55 + 0.3 * (1.0 - lum));
  col += base * thin * 0.2;
  if (uBubbles > 0.0) {
    vec2 bq = vec2(p.x * 3.2 + p.z * 1.7, p.y * 2.4 - uTime * 0.35);
    float cell = texture(uNoise, bq * 0.25).b;
    col += vec3(0.8, 1.0, 1.0) * smoothstep(0.08, 0.02, cell) * uBubbles * 0.5 * (0.4 + thin);
  }
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  col = mix(col, vec3(1.0, 0.42, 0.38), uFlash * (0.35 + 0.65 * pow(1.0 - ndv, 2.0)));
  vec4 clip = uViewProj * vec4(p, 1.0);
  gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
  fragColor = vec4(atmos(col, p), alpha);
}`;

// ------------------------------------------------------------
// Goo objects and pickups: instanced raymarched impostors
// ------------------------------------------------------------
const VS_IMP = GLSL_HEAD + GLSL_FRAME + `
in vec2 aCorner;
in vec4 iPosS;
in vec4 iAxis;
in vec4 iP0;
in vec4 iP1;
out vec3 vW;
flat out vec4 fPosS;
flat out vec4 fAxis;
flat out vec4 fP0;
flat out vec4 fP1;
void main() {
  float st = max(iAxis.w, 0.05);
  float R = iPosS.w * max(st, inversesqrt(st)) * 1.2;
  vec3 c = iPosS.xyz;
  vec3 toCam = uCamPos - c;
  float dc = length(toCam);
  toCam /= dc;
  vec3 q = c + toCam * min(R, dc - 0.2);
  vec3 wp = q + (uCamRight * aCorner.x + uCamUp * aCorner.y) * R * 1.3;
  vW = wp;
  fPosS = iPosS; fAxis = iAxis; fP0 = iP0; fP1 = iP1;
  gl_Position = uViewProj * vec4(wp, 1.0);
}`;

const FS_IMP = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + GLSL_GOO + `
in vec3 vW;
flat in vec4 fPosS;
flat in vec4 fAxis;
flat in vec4 fP0;
flat in vec4 fP1;
out vec4 fragColor;
uniform float uPixAng;

// material codes returned by the map: 0 goo, 1 gem, 2 gold, 3 stone, 4 wood, 5 toon orange, 6 emissive orb, 7 white goo tip, 8 steel, 9 dark wood, 10 red goo, 11 parchment, 12 glossy black
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2) {
  vec3 ba = b - a; float l2 = dot(ba, ba); float rr = r1 - r2; float a2 = l2 - rr * rr; float il2 = 1.0 / l2;
  vec3 pa = p - a; float y = dot(pa, ba); float z = y - l2;
  vec3 xv = pa * l2 - ba * y; float x2 = dot(xv, xv); float y2 = y * y * l2; float z2 = z * z * l2;
  float k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1;
}
float sdRBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sdCyl(vec3 p, float r, float hh, float rd) { vec2 d = vec2(length(p.xz) - r + rd, abs(p.y) - hh + rd); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rd; }
float sdTorus(vec3 p, float R, float r) { return length(vec2(length(p.xz) - R, p.y)) - r; }
float dot2(vec2 v) { return dot(v, v); }
float sdHeart(vec2 p) {
  p.x = abs(p.x);
  if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  return sqrt(min(dot2(p - vec2(0.0, 1.0)), dot2(p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}
float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
float extrude(float d2, float z, float hz, float rd) { vec2 w = vec2(d2 + rd, abs(z) - hz + rd); return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - rd; }
mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

vec2 mapImp(vec3 p, int type, vec4 P0, vec4 P1) {
  float ph = P0.w;
  if (type == 0) {
    float w = 0.04 * sin(p.x * 9.0 + ph * 6.0) * sin(p.y * 8.0 + ph * 5.0);
    return vec2(length(p) - 0.82 + w, 0.0);
  }
  if (type == 1) {
    float d = sdRoundCone(p, vec3(0.0, 0.0, 0.32), vec3(0.0, 0.0, -0.95), 0.52, 0.07);
    d += 0.03 * sin(p.z * 8.0 + ph * 9.0);
    return vec2(d, 0.0);
  }
  if (type == 2) {
    float br = 1.0 + 0.05 * sin(ph * 6.28);
    vec3 q = p / br;
    float d = smin(sdEllipsoid(q - vec3(0.0, 0.12, 0.0), vec3(0.62, 0.5, 0.62)), sdEllipsoid(q - vec3(0.0, 0.0, 0.0), vec3(0.95, 0.09, 0.95)), 0.22) * br;
    return vec2(d, 0.0);
  }
  if (type == 3) {
    vec2 q = p.xz;
    float d2 = max(length(q) - 0.95, -(length(q - vec2(0.42, 0.0)) - 0.8));
    return vec2(extrude(d2, p.y, 0.06, 0.05), 0.0);
  }
  if (type == 4) {
    vec3 q = p;
    q.xz = rot2(ph) * q.xz;
    float handle = sdCapsule(q, vec3(0.0, 0.0, -0.85), vec3(0.0, 0.0, 0.55), 0.09);
    float head = sdEllipsoid(q - vec3(0.36, 0.0, 0.45), vec3(0.42, 0.09, 0.3));
    float edge = sdEllipsoid(q - vec3(0.62, 0.0, 0.45), vec3(0.16, 0.05, 0.4));
    float d = smin(handle, smin(head, edge, 0.08), 0.1);
    return vec2(d, 0.0);
  }
  if (type == 5) {
    float E = P1.x;
    float d = 1e9;
    for (int i = 0; i < 7; i++) {
      float fi = float(i) / 6.0;
      float th = 3.14159 * fi;
      vec3 c = vec3(0.13 * sin(ph * 6.0 + float(i)), 0.62 * sin(th) * E - 0.35 * (1.0 - E), 0.68 * cos(th));
      float r = i == 0 ? 0.31 : mix(0.27, 0.15, fi);
      d = i == 0 ? length(p - c) - r : smin(d, length(p - c) - r, 0.2);
    }
    vec3 hc = vec3(0.13 * sin(ph * 6.0), -0.35 * (1.0 - E), 0.68 + 0.0);
    float mouth = sdEllipsoid(p - hc - vec3(0.0, 0.05, 0.3), vec3(0.2, 0.05 + 0.08 * P1.y, 0.12));
    d = smax(d, -mouth, 0.04);
    return vec2(d, 0.0);
  }
  if (type == 6) {
    float d = length(p) - 0.6;
    d = smin(d, sdCapsule(p, vec3(0.0), vec3(0.0, 0.92, 0.1), 0.09), 0.12);
    d = smin(d, sdCapsule(p, vec3(0.0), vec3(0.78, -0.4, 0.3), 0.09), 0.12);
    d = smin(d, sdCapsule(p, vec3(0.0), vec3(-0.72, -0.35, 0.45), 0.09), 0.12);
    d = smin(d, length(p - vec3(0.0, 0.95, 0.1)) - 0.12, 0.08);
    d = smin(d, length(p - vec3(0.8, -0.41, 0.31)) - 0.12, 0.08);
    d = smin(d, length(p - vec3(-0.74, -0.36, 0.46)) - 0.12, 0.08);
    return vec2(d + 0.02 * sin(p.y * 10.0 + ph * 8.0), 0.0);
  }
  if (type == 7) {
    float sq = P1.x;
    vec3 q = vec3(p.x / (1.0 + (1.0 - sq) * 0.4), p.y / sq, p.z / (1.0 + (1.0 - sq) * 0.4));
    float d = sdEllipsoid(q - vec3(0.0, -0.1, 0.0), vec3(0.52, 0.45, 0.46));
    d = smin(d, length(q - vec3(0.0, 0.42, 0.04)) - 0.34, 0.24);
    d = smin(d, sdEllipsoid(q - vec3(0.24, -0.55, 0.06), vec3(0.17, 0.11, 0.22)), 0.12);
    d = smin(d, sdEllipsoid(q - vec3(-0.24, -0.55, 0.06), vec3(0.17, 0.11, 0.22)), 0.12);
    d = smin(d, length(q - vec3(0.52, -0.08, 0.08)) - 0.15, 0.13);
    d = smin(d, length(q - vec3(-0.52, -0.08, 0.08)) - 0.15, 0.13);
    return vec2(d * min(sq, 1.0), 0.0);
  }
  if (type == 8) {
    // small XP crystal: an eight-sided bipyramid, a little taller than wide
    vec3 q = p;
    q.xz = rot2(ph * 1.7) * q.xz;
    q.xy = rot2(0.18) * q.xy;
    q.y *= 0.74;
    vec3 a = abs(q);
    vec3 b = abs(vec3(rot2(0.785) * q.xz, q.y).xzy);
    float d = max(a.x + a.y + a.z, b.x + b.y + b.z) * 0.57735 - 0.37;
    return vec2(d - 0.03, 1.0);
  }
  if (type == 29) {
    // emerald: a square step cut with clipped corners, tilted and spinning
    vec3 q = p;
    q.xz = rot2(ph * 1.2) * q.xz;
    q.yz = rot2(0.95) * q.yz;
    vec3 a = abs(q);
    float m = max(a.x, a.y);
    float d = max(m - 0.62, a.z - 0.3);
    d = max(d, (a.x + a.y) * 0.7071 - 0.74);
    d = max(d, (m * 0.5 + a.z) * 0.8944 - 0.43);
    return vec2(d - 0.02, 1.0);
  }
  if (type == 30) {
    // rolled scroll: parchment tube along x with wooden knobs and a ribbon
    vec3 q = p;
    q.xz = rot2(ph * 1.2) * q.xz;
    vec3 c = q.yxz;
    float body = sdCyl(c, 0.32, 0.6, 0.05);
    float knobs = sdCyl(vec3(c.x, abs(c.y) - 0.7, c.z), 0.15, 0.1, 0.05);
    float band = sdCyl(c, 0.35, 0.08, 0.03);
    float d = min(body, min(knobs, band));
    return vec2(d, d == knobs ? 9.0 : d == band ? 10.0 : 11.0);
  }
  if (type == 9) {
    vec3 q = p;
    q.xz = rot2(ph * 3.0) * q.xz;
    vec3 c = q.xzy;
    float d = sdCyl(c, 0.78, 0.13, 0.08);
    float ring = sdTorus(vec3(c.x, abs(c.y) - 0.135, c.z), 0.55, 0.035);
    d = smax(d, -ring, 0.03);
    return vec2(d, 2.0);
  }
  if (type == 10) {
    float pulse = 1.0 + 0.08 * sin(ph * 6.28);
    vec3 q = p / pulse;
    q.xz = rot2(ph * 1.2) * q.xz;
    float d2 = sdHeart(q.xy * 1.15 + vec2(0.0, 0.62)) / 1.15;
    return vec2(extrude(d2, q.z, 0.16, 0.14) * pulse, 0.0);
  }
  if (type == 11) {
    vec3 q = p;
    q.xz = rot2(ph * 1.5) * q.xz;
    vec3 c = q - vec3(0.0, 0.15, 0.0);
    float ang = atan(c.y, c.x);
    float arc = ang > 0.0 ? length(vec2(length(c.xy) - 0.45, c.z)) - 0.2 : 1e9;
    float legL = sdCapsule(q, vec3(0.45, 0.15, 0.0), vec3(0.45, -0.55, 0.0), 0.2);
    float legR = sdCapsule(q, vec3(-0.45, 0.15, 0.0), vec3(-0.45, -0.55, 0.0), 0.2);
    float d = min(arc, min(legL, legR));
    return vec2(d, q.y < -0.25 ? 7.0 : 10.0);
  }
  if (type == 12) {
    float open = P1.x;
    float base = sdRBox(p - vec3(0.0, -0.2, 0.0), vec3(0.72, 0.38, 0.5), 0.08);
    vec3 lp = p - vec3(0.0, 0.18, -0.5);
    lp.yz = rot2(open * 1.4) * lp.yz;
    lp += vec3(0.0, 0.0, 0.5);
    float lid = max(length(lp.yz) - 0.5, -lp.y);
    lid = max(lid, abs(lp.x) - 0.72);
    lid = smin(lid, sdRBox(lp - vec3(0.0, 0.0, 0.0), vec3(0.72, 0.04, 0.5), 0.03), 0.02);
    float d = min(base, lid);
    float bands = min(abs(abs(p.x) - 0.42) - 0.07, max(abs(p.x) - 0.12, abs(p.y + 0.02) - 0.12));
    float m = (bands < 0.0 && d < 0.02) ? 2.0 : 4.0;
    return vec2(d, m);
  }
  if (type == 13) {
    float b = sin(p.x * 6.0 + 1.3) * sin(p.y * 5.0 + 0.7) * sin(p.z * 5.5 + 2.1) * 0.08 + sin(p.x * 13.0) * sin(p.y * 11.0 + 1.0) * sin(p.z * 12.0) * 0.035;
    return vec2((length(p) - 0.8) + b, 3.0);
  }
  if (type == 14) {
    float shaft = sdCapsule(p, vec3(0.0, 0.0, -0.85), vec3(0.0, 0.0, 0.55), 0.05);
    float tip = sdRoundCone(p, vec3(0.0, 0.0, 0.55), vec3(0.0, 0.0, 0.95), 0.13, 0.015);
    float fl = sdRBox(p - vec3(0.0, 0.0, -0.75), vec3(0.16, 0.012, 0.13), 0.01);
    fl = min(fl, sdRBox(p - vec3(0.0, 0.0, -0.75), vec3(0.012, 0.16, 0.13), 0.01));
    float d = min(shaft, min(tip, fl));
    return vec2(d, tip < shaft && tip < fl ? 8.0 : (fl < shaft ? 7.0 : 9.0));
  }
  if (type == 15) return vec2(length(p) - 0.78 + 0.03 * sin(p.y * 12.0 + ph * 10.0), 6.0);
  if (type == 16) {
    float d = sdCyl(p, 0.98, 0.24, 0.06);
    d = smax(d, -(length(p - vec3(0.0, 1.6, 0.0)) - 1.4), 0.04);
    float rim = sdTorus(p - vec3(0.0, 0.05, 0.0), 0.98, 0.05);
    return vec2(min(d, rim), 3.0);
  }
  if (type == 17) {
    float d = sdEllipsoid(p - vec3(0.0, -0.05, 0.0), vec3(0.62, 0.55, 0.5));
    for (int i = 0; i < 4; i++) d = smin(d, length(p - vec3(-0.38 + 0.25 * float(i), 0.32, 0.38)) - 0.19, 0.1);
    d = smin(d, sdCapsule(p, vec3(0.45, -0.1, 0.25), vec3(0.15, 0.1, 0.5), 0.15), 0.1);
    d = smin(d, sdCapsule(p, vec3(0.0, -0.4, -0.1), vec3(0.0, -0.95, -0.25), 0.3), 0.18);
    return vec2(d, 0.0);
  }
  if (type == 18) {
    vec3 q = p;
    float d = sdCapsule(q, vec3(0.25, 0.85, 0.0), vec3(-0.18, 0.08, 0.0), 0.11);
    d = smin(d, sdCapsule(q, vec3(-0.18, 0.08, 0.0), vec3(0.2, 0.0, 0.0), 0.11), 0.05);
    d = smin(d, sdCapsule(q, vec3(0.2, 0.0, 0.0), vec3(-0.2, -0.9, 0.0), 0.1), 0.05);
    return vec2(d, 0.0);
  }
  if (type == 19) {
    float d = sdEllipsoid(p - vec3(0.0, -0.45, 0.0), vec3(0.95, 0.16, 0.95));
    d = min(d, sdTorus(p - vec3(0.0, -0.42, 0.0), 0.72, 0.04));
    d = smin(d, length(p - vec3(0.0, 0.2, 0.0)) - 0.24, 0.3);
    return vec2(d, 0.0);
  }
  if (type == 20) return vec2(extrude(sdStar5(p.xy, 0.95, 0.5), p.z, 0.16, 0.14), 2.0);
  if (type == 21) {
    vec2 q = p.xy;
    float d2 = max(length(q - vec2(0.0, 0.15)) - 0.78, -q.y - 0.9 + abs(q.x) * 0.9);
    return vec2(extrude(d2, p.z, 0.15, 0.13), 8.0);
  }
  if (type == 22) {
    float top = sdRoundCone(p, vec3(0.0, 0.62, 0.0), vec3(0.0, 0.05, 0.0), 0.5, 0.08);
    float bot = sdRoundCone(p, vec3(0.0, -0.62, 0.0), vec3(0.0, -0.05, 0.0), 0.5, 0.08);
    float caps = min(sdCyl(p - vec3(0.0, 0.85, 0.0), 0.6, 0.07, 0.04), sdCyl(p - vec3(0.0, -0.85, 0.0), 0.6, 0.07, 0.04));
    float d = smin(top, bot, 0.08);
    return vec2(min(d, caps), caps < d ? 2.0 : 0.0);
  }
  if (type == 23) {
    float d = sdTorus(p - vec3(0.0, -0.2, 0.0), 0.28, 0.08);
    d = min(d, sdTorus(p - vec3(0.0, -0.2, 0.0), 0.58, 0.07));
    d = min(d, sdTorus(p - vec3(0.0, -0.2, 0.0), 0.88, 0.06));
    d = min(d, length(p - vec3(0.0, -0.05, 0.0)) - 0.15);
    return vec2(d, 0.0);
  }
  if (type == 24) {
    float d = length(p - vec3(-0.6, 0.0, 0.0)) - 0.33;
    d = min(d, length(p - vec3(0.0, 0.12, 0.0)) - 0.38);
    d = min(d, length(p - vec3(0.6, 0.0, 0.0)) - 0.33);
    return vec2(d, 0.0);
  }
  if (type == 25) {
    float d = sdEllipsoid(p - vec3(0.0, -0.1, 0.0), vec3(0.82, 0.68, 0.72));
    d = smin(d, length(p - vec3(0.0, 0.55, 0.05)) - 0.4, 0.3);
    return vec2(d + 0.025 * sin(p.x * 7.0 + ph * 4.0) * sin(p.y * 6.0), 0.0);
  }
  if (type == 26) {
    float d = 1e9;
    for (int i = 0; i < 3; i++) {
      vec3 q = p - vec3(0.06 * float(i - 1), -0.5 + float(i) * 0.3, 0.0);
      d = min(d, sdCyl(q, 0.72, 0.12, 0.06));
    }
    return vec2(d, 2.0);
  }
  if (type == 27) {
    float d = abs(length(p) - 0.82) - 0.035;
    d = min(d, length(p - vec3(-0.32, 0.36, 0.55)) - 0.1);
    return vec2(d, 0.0);
  }
  if (type == 28) {
    float d = sdCapsule(p, vec3(-0.9, 0.0, 0.0), vec3(0.8, 0.0, 0.0), 0.3 + 0.05 * sin(p.x * 12.0 - ph * 10.0));
    d = smin(d, length(p - vec3(-0.85, 0.0, 0.0)) - 0.42, 0.2);
    return vec2(d, 0.0);
  }
  if (type == 31) {
    // blob mine: a squat jelly blob with two eyes and a fuse sprout, jiggling in place
    // (modelled standing on y = 0, drawn centred 0.65 above the floor so it fits the impostor bounds)
    p.y += 0.65;
    float sq = 1.0 + 0.07 * sin(ph * 7.0);
    vec3 b = vec3(p.x * sqrt(sq), p.y / sq, p.z * sqrt(sq));
    float body = sdEllipsoid(b - vec3(0.0, 0.42, 0.0), vec3(0.8, 0.52, 0.8));
    body = smin(body, length(b - vec3(0.0, 0.82, 0.0)) - 0.24, 0.22);
    vec3 e = vec3(abs(p.x) - 0.27, p.y - 0.68 * sq, p.z - 0.6);
    float eye = length(e) - 0.2;
    float pupil = length(e - vec3(-0.02, 0.03, 0.13)) - 0.11;
    float sprout = sdCapsule(p, vec3(0.0, 0.95 * sq, 0.0), vec3(0.14, 1.22 * sq, -0.04), 0.05);
    float tip = length(p - vec3(0.15, 1.3 * sq, -0.04)) - 0.11;
    float d = smin(body, sprout, 0.08);
    float m = 0.0;
    if (eye < d) { d = eye; m = pupil < 0.0 ? 12.0 : 7.0; }
    if (tip < d) { d = tip; m = 6.0; }
    return vec2(d, m);
  }
  return vec2(length(p) - 0.8, 0.0);
}

void main() {
  int type = int(fP0.x + 0.5);
  float scale = fPosS.w;
  float st = max(fAxis.w, 0.05);
  vec3 f = length(fAxis.xyz) > 0.001 ? normalize(fAxis.xyz) : vec3(0.0, 0.0, 1.0);
  bool upright = !(type == 0 || type == 1 || type == 6 || type == 14);
  vec3 up = vec3(0.0, 1.0, 0.0);
  if (upright) { f = normalize(vec3(f.x, 0.0, f.z) + vec3(0.0, 0.0, 1e-4)); }
  vec3 guide = abs(f.y) < 0.95 ? up : vec3(1.0, 0.0, 0.0);
  vec3 r = normalize(cross(guide, f));
  vec3 u = cross(f, r);
  mat3 toWorld = mat3(r, u, f);
  mat3 toLocal = transpose(toWorld);
  vec3 sc = vec3(sqrt(st), sqrt(st), 1.0 / st) / scale;
  vec3 ro = toLocal * (uCamPos - fPosS.xyz) * sc;
  vec3 rdw = normalize(vW - uCamPos);
  vec3 rd = toLocal * rdw * sc;
  float stepScale = scale * min(1.0 / sqrt(st), st);
  vec2 bs = sphHit(uCamPos, rdw, fPosS.xyz, scale * max(st, inversesqrt(st)) * 1.15);
  if (bs.y < 0.0) discard;
  float t = max(bs.x, 0.0), tEnd = bs.y;
  float bestR = 1e9, bestT = t;
  bool hit = false;
  vec2 res = vec2(0.0);
  for (int i = 0; i < 64; i++) {
    vec3 lp = ro + rd * t;
    res = mapImp(lp, type, fP0, fP1);
    float dw = res.x * stepScale;
    float rr = dw / (t * uPixAng);
    if (rr < bestR) { bestR = rr; bestT = t; }
    if (dw < 0.0006 * t) { hit = true; break; }
    t += dw * 0.85;
    if (t > tEnd) break;
  }
  float alpha = hit ? 1.0 : clamp(0.6 - bestR, 0.0, 1.0);
  alpha *= fP1.w;
  if (alpha < 0.004) discard;
  float tt = hit ? t : bestT;
  vec3 lp = ro + rd * tt;
  res = mapImp(lp, type, fP0, fP1);
  const vec2 k = vec2(1.0, -1.0);
  const float e = 0.004;
  vec3 nl = normalize(k.xyy * mapImp(lp + k.xyy * e, type, fP0, fP1).x + k.yyx * mapImp(lp + k.yyx * e, type, fP0, fP1).x +
                      k.yxy * mapImp(lp + k.yxy * e, type, fP0, fP1).x + k.xxx * mapImp(lp + k.xxx * e, type, fP0, fP1).x);
  vec3 n = normalize(toWorld * (nl * sc));
  vec3 wp = uCamPos + rdw * tt;
  vec3 v = -rdw;
  float thin = clamp(1.0 + mapImp(lp - nl * 0.25, type, fP0, fP1).x / 0.25, 0.0, 1.0);
  float ao = clamp(1.0 - (0.12 - mapImp(lp + nl * 0.12, type, fP0, fP1).x) * 2.5, 0.0, 1.0);
  float mat = res.y;
  vec3 col;
  float emissive = fP0.z;
  if (mat > 11.5) {
    // glossy near-black (pupils)
    vec3 H = normalize(uLightDir + v);
    col = vec3(0.03, 0.03, 0.05) + uLightCol * pow(max(dot(n, H), 0.0), 60.0) * 0.9;
  } else if (mat > 10.5) {
    vec3 paper = vec3(0.98, 0.88, 0.66) * (0.9 + 0.12 * texture(uNoise, lp.xy * 1.3).g);
    float ndl = max(dot(n, uLightDir), 0.0);
    col = paper * (mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5) * 0.7 + uLightCol * ndl * 0.75) * mix(0.6, 1.0, ao) + paper * emissive;
  } else if (mat < 0.5 || mat > 9.5) {
    vec3 base = mat > 9.5 ? vec3(1.0, 0.3, 0.42) : gooColor(fP0.y);
    col = gooShade(base, wp, n, v, thin, ao, emissive, 1.0);
  } else if (mat < 1.5) {
    vec3 base = fP1.y < 0.5 ? vec3(0.12, 0.42, 1.0) : fP1.y < 1.5 ? vec3(0.06, 0.8, 0.26) : vec3(0.72, 0.45, 1.0);
    col = gooShade(base, wp, n, v, max(thin, 0.6), ao, 0.35 + emissive, 1.2);
  } else if (mat < 2.5) {
    vec3 gold = vec3(1.0, 0.76, 0.22);
    float ndl = max(dot(n, uLightDir), 0.0);
    vec3 R = reflect(-v, n);
    vec3 H = normalize(uLightDir + v);
    col = gold * (0.25 + 0.55 * ndl) * mix(0.6, 1.0, ao) + gold * envColor(R) * 0.75 + uLightCol * pow(max(dot(n, H), 0.0), 70.0) * 1.2 + gold * emissive;
  } else if (mat < 3.5) {
    vec3 stone = vec3(0.47, 0.44, 0.42) * (0.82 + 0.3 * texture(uNoise, wp.xz * 1.7 + wp.y).g);
    float ndl = max(dot(n, uLightDir), 0.0);
    col = stone * (mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5) * 0.6 + uLightCol * ndl * 0.8) * mix(0.55, 1.0, ao);
  } else if (mat < 4.5) {
    float grain = texture(uNoise, vec2(lp.x * 0.6, lp.y * 3.0)).g;
    vec3 wood = mix(vec3(0.45, 0.25, 0.13), vec3(0.62, 0.38, 0.2), grain);
    float ndl = max(dot(n, uLightDir), 0.0);
    col = wood * (mix(uGroundCol, uSkyCol, n.y * 0.5 + 0.5) * 0.6 + uLightCol * ndl * 0.8) * mix(0.55, 1.0, ao);
  } else if (mat < 5.5) {
    float ndl = dot(n, uLightDir);
    vec3 body = vec3(0.96, 0.54, 0.12);
    col = mix(body * vec3(0.75, 0.64, 0.5), body, smoothstep(0.1, 0.3, ndl));
  } else if (mat < 6.5) {
    float ndv = clamp(dot(n, v), 0.0, 1.0);
    // the blob mine's fuse tip blinks through P1.x without lighting up the rest of the mine
    col = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.9, 0.55), pow(ndv, 2.0)) * (1.2 + emissive + (type == 31 ? fP1.x * 2.5 : 0.0));
  } else if (mat < 7.5) {
    col = gooShade(vec3(0.95, 0.97, 1.0), wp, n, v, thin, ao, emissive * 0.5, 1.0);
  } else if (mat < 8.5) {
    vec3 steel = vec3(0.55, 0.62, 0.7);
    float ndl = max(dot(n, uLightDir), 0.0);
    vec3 H = normalize(uLightDir + v);
    col = steel * (0.3 + 0.6 * ndl) * mix(0.6, 1.0, ao) + envColor(reflect(-v, n)) * 0.35 + uLightCol * pow(max(dot(n, H), 0.0), 60.0) * 0.8;
  } else {
    col = vec3(0.42, 0.24, 0.12) * (0.4 + 0.6 * max(dot(n, uLightDir), 0.0));
  }
  vec4 clip = uViewProj * vec4(wp, 1.0);
  gl_FragDepth = clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
  fragColor = vec4(atmos(col, wp), alpha);
}`;

// ------------------------------------------------------------
// Enemies: GPU-skinned instanced meshes with toon shading
// ------------------------------------------------------------
const VS_ENEMY = GLSL_HEAD + GLSL_FRAME + `
in vec3 aPos;
in vec3 aNrm;
in vec2 aBones;
in float aW0;
in float aAO;
in vec4 aCol;
in vec4 iPosYaw;
in vec4 iAnim;
in vec4 iFx;
in vec4 iTint;
uniform sampler2D uBones;
uniform float uOutline;
out vec3 vN;
out vec3 vW;
out vec3 vRest;
out float vAO;
out vec4 vCol;
out vec4 vFx;
out vec3 vTint;
mat4 boneMat(int row, int b) {
  vec4 r0 = texelFetch(uBones, ivec2(b * 3, row), 0);
  vec4 r1 = texelFetch(uBones, ivec2(b * 3 + 1, row), 0);
  vec4 r2 = texelFetch(uBones, ivec2(b * 3 + 2, row), 0);
  return mat4(r0.x, r1.x, r2.x, 0.0, r0.y, r1.y, r2.y, 0.0, r0.z, r1.z, r2.z, 0.0, r0.w, r1.w, r2.w, 1.0);
}
void main() {
  int row = int(iAnim.x + 0.5);
  mat4 m0 = boneMat(row, int(aBones.x + 0.5));
  mat4 m1 = boneMat(row, int(aBones.y + 0.5));
  vec3 p = (m0 * vec4(aPos, 1.0)).xyz * aW0 + (m1 * vec4(aPos, 1.0)).xyz * (1.0 - aW0);
  vec3 n = mat3(m0) * aNrm * aW0 + mat3(m1) * aNrm * (1.0 - aW0);
  float dead = iAnim.w;
  float sy = iAnim.z * (1.0 - 0.82 * dead);
  float sxz = inversesqrt(max(sy, 0.08)) * (1.0 + 0.35 * dead);
  p.y *= sy; p.xz *= sxz;
  n.y /= sy; n.xz /= sxz;
  n = normalize(n);
  float s = iAnim.y;
  if (uOutline > 0.0) p += n * uOutline / s;
  float c = cos(iPosYaw.w), sn = sin(iPosYaw.w);
  vec3 wp = vec3(c * p.x + sn * p.z, p.y, -sn * p.x + c * p.z) * s + iPosYaw.xyz;
  vN = vec3(c * n.x + sn * n.z, n.y, -sn * n.x + c * n.z);
  vW = wp;
  vRest = aPos;
  vAO = aAO;
  vCol = aCol;
  vFx = iFx;
  vTint = iTint.rgb;
  gl_Position = uViewProj * vec4(wp, 1.0);
}`;

const FS_ENEMY = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + `
in vec3 vN;
in vec3 vW;
in vec3 vRest;
in float vAO;
in vec4 vCol;
in vec4 vFx;
in vec3 vTint;
uniform float uOutline;
uniform vec3 uOutlineCol;
out vec4 fragColor;
void main() {
  if (uOutline > 0.0) { fragColor = vec4(atmos(uOutlineCol, vW), 1.0); return; }
  vec3 n = normalize(vN);
  vec3 v = normalize(uCamPos - vW);
  vec3 body = vCol.w > 0.5 ? vTint : vCol.rgb;
  float ndl = dot(n, uLightDir);
  float lit = smoothstep(-0.05, 0.55, ndl);
  float mid = smoothstep(-0.6, -0.05, ndl);
  vec3 shade = mix(body * vec3(0.66, 0.54, 0.46), body * vec3(0.86, 0.8, 0.76), mid);
  vec3 col = mix(shade, body, lit);
  col *= mix(0.62, 1.0, vAO);
  col += uSkyCol * 0.06 * (n.y * 0.5 + 0.5);
  float rim = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
  col += vec3(1.0, 0.82, 0.62) * rim * 0.15 * smoothstep(-0.2, 0.4, ndl + 0.3);
  float tex = texture(uNoise, vRest.xy * 2.3 + vRest.z * 1.7).g;
  col *= 0.95 + 0.1 * tex;
  if (vCol.w < 0.5) {
    vec3 H = normalize(uLightDir + v);
    col += uLightCol * pow(max(dot(n, H), 0.0), 40.0) * 0.35;
  }
  // standing in the hero's aura: a cyan rim and cyan light from the goo puddle below, keeping the orange body
  float low = 1.0 - smoothstep(0.0, 0.9, vW.y);
  col += vec3(0.25, 0.85, 1.0) * vFx.w * (rim * 0.9 + low * (0.5 - 0.5 * n.y) * 0.3);
  col = mix(col, vec3(1.0, 0.97, 0.92), vFx.x);
  col += vec3(1.0, 0.75, 0.2) * vFx.z * 0.12 * rim;
  fragColor = vec4(atmos(col, vW), 1.0);
}`;

// ------------------------------------------------------------
// Floor decals: splats, shadows, scorch, rings, telegraphs
// ------------------------------------------------------------
const VS_DECAL = GLSL_HEAD + GLSL_FRAME + `
in vec2 aCorner;
in vec4 iA;
in vec4 iB;
in vec4 iC;
out vec2 vUV;
out vec3 vW;
flat out vec4 fB;
flat out vec4 fC;
flat out vec2 fSize;
void main() {
  float c = cos(iB.x), s = sin(iB.x);
  vec2 q = aCorner * iA.zw;
  vec2 r = vec2(c * q.x - s * q.y, s * q.x + c * q.y);
  vec3 wp = vec3(iA.x + r.x, 0.012 + iB.z * 0.0002, iA.y + r.y);
  vUV = aCorner;
  vW = wp;
  fB = iB; fC = iC; fSize = iA.zw;
  gl_Position = uViewProj * vec4(wp, 1.0);
}`;

const FS_DECAL = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + `
in vec2 vUV;
in vec3 vW;
flat in vec4 fB;
flat in vec4 fC;
flat in vec2 fSize;
out vec4 fragColor;
void main() {
  int type = int(fB.y + 0.5);
  float seed = fB.z, t = fB.w;
  vec2 q = vUV;
  float r = length(q);
  vec3 col = fC.rgb;
  float a = 0.0;
  if (type == 0) {
    // goo splat with a wet glossy surface
    float ang = atan(q.y, q.x);
    float n1 = texture(uNoise, vec2(ang * 0.32 + seed, seed * 1.7)).r;
    float n2 = texture(uNoise, vec2(ang * 0.9 + seed * 3.0, seed)).g;
    float edge = 0.5 + (n1 - 0.5) * 0.5 + (n2 - 0.5) * 0.18;
    float body = 1.0 - smoothstep(edge - 0.04, edge + 0.02, r);
    float drops = 0.0;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float da = hash11(seed * 13.0 + fi) * 6.2832;
      float dr = 0.62 + 0.3 * hash11(seed * 7.0 + fi * 3.1);
      float rs = 0.05 + 0.08 * hash11(seed * 3.0 + fi * 1.7);
      vec2 dc = vec2(cos(da), sin(da)) * dr;
      drops = max(drops, 1.0 - smoothstep(rs - 0.03, rs + 0.01, length(q - dc)));
    }
    float m = max(body, drops);
    float h = body * smoothstep(edge, edge * 0.2, r) + drops * 0.5;
    vec3 N = normalize(vec3(-dFdx(h) * 2.5, 1.0, -dFdy(h) * 2.5));
    vec3 V = normalize(uCamPos - vW);
    vec3 H = normalize(uLightDir + V);
    float spec = pow(max(dot(N, H), 0.0), 60.0) * 0.9;
    col = col * (0.62 + 0.38 * max(dot(N, uLightDir), 0.0)) + uLightCol * spec;
    col *= 0.85 + 0.25 * h;
    a = m * fC.a * (1.0 - smoothstep(0.6, 1.0, t));
  } else if (type == 1) {
    a = (1.0 - smoothstep(0.2, 1.0, r)) * fC.a;
  } else if (type == 2) {
    float ang = atan(q.y, q.x);
    float n = texture(uNoise, vec2(ang * 0.5 + seed, r * 0.6 + seed)).r;
    float m = 1.0 - smoothstep(0.55 + n * 0.3, 0.95, r);
    col = mix(col, col * 0.4, smoothstep(0.0, 0.6, r));
    a = m * fC.a * (1.0 - smoothstep(0.5, 1.0, t));
  } else if (type == 3) {
    float rr = mix(0.15, 1.0, easeOut(t));
    float w = mix(0.16, 0.03, t);
    float ring = 1.0 - smoothstep(0.0, w, abs(r - rr));
    a = ring * fC.a * (1.0 - t);
  } else if (type == 4) {
    float pulse = 0.5 + 0.5 * sin(uTime * 18.0);
    float outline = 1.0 - smoothstep(0.0, 0.06, abs(r - 0.95));
    float fill = (1.0 - smoothstep(t - 0.02, t + 0.02, r)) * step(r, 1.0);
    float base = step(r, 1.0) * 0.22;
    a = clamp(max(outline * (0.75 + 0.25 * pulse), max(fill * 0.45, base)), 0.0, 1.0) * fC.a;
  } else if (type == 5) {
    vec2 aq = abs(q);
    float inside = step(aq.x, 1.0) * step(aq.y, 1.0);
    float edgeX = 1.0 - smoothstep(0.0, 0.08, 1.0 - aq.x);
    float fill = step(q.y * 0.5 + 0.5, t);
    a = inside * clamp(max(edgeX * 0.8, max(fill * 0.45, 0.18)), 0.0, 1.0) * fC.a;
  } else if (type == 6) {
    float ring = 1.0 - smoothstep(0.0, 0.025, abs(r - 0.97));
    float dash = step(0.5, fract(atan(q.y, q.x) * 6.0 + uTime * 0.6));
    a = ring * dash * fC.a;
  } else if (type == 7) {
    float m = 1.0 - smoothstep(0.4, 1.0, r);
    vec3 n = normalize(vec3(q.x, 1.2, q.y));
    float light = dot(n, uLightDir);
    col = light > 0.75 ? vec3(1.0) : vec3(0.0);
    float rip = 0.5 + 0.5 * sin(r * 18.0 - uTime * 10.0);
    a = m * abs(light - 0.75) * 1.4 * fC.a + (1.0 - smoothstep(0.85, 1.0, r)) * smoothstep(0.5, 0.85, r) * rip * 0.15 * fC.a;
    col = mix(col, fC.rgb, 0.3);
  } else if (type == 8) {
    float ang = atan(q.y, q.x);
    float cr = texture(uNoise, vec2(ang * 0.6 + seed, r * 0.5)).b;
    float lines = smoothstep(0.1, 0.02, cr) * (1.0 - smoothstep(0.5, 1.0, r));
    a = lines * fC.a * (1.0 - t);
  } else if (type == 9) {
    float line = 1.0 - smoothstep(0.0, 0.5, abs(q.x));
    a = line * step(abs(q.y), 1.0) * fC.a;
  }
  if (a < 0.003) discard;
  fragColor = vec4(atmos(col, vW), a);
}`.replace('easeOut(t)', '(1.0 - (1.0 - t) * (1.0 - t))');

// ------------------------------------------------------------
// Particles: glow, sparks, smoke, sparkles
// ------------------------------------------------------------
const VS_PART = GLSL_HEAD + GLSL_FRAME + `
in vec2 aCorner;
in vec4 iPos;
in vec4 iCol;
in vec4 iVel;
out vec2 vUV;
flat out vec4 fCol;
flat out float fType;
out vec3 vW;
void main() {
  int type = int(iVel.w + 0.5);
  vec3 c = iPos.xyz;
  float size = iPos.w;
  vec3 right = uCamRight, upv = uCamUp;
  vec2 k = aCorner;
  if (type == 1) {
    vec3 viewDir = normalize(c - uCamPos);
    vec3 vel = iVel.xyz - dot(iVel.xyz, viewDir) * viewDir;
    float sp = length(vel);
    if (sp > 0.001) {
      right = vel / sp;
      upv = normalize(cross(viewDir, right));
      k.x *= 1.0 + sp * 0.06;
      k.y *= 0.35;
    }
  }
  vec3 wp = c + (right * k.x + upv * k.y) * size;
  vUV = aCorner;
  fCol = iCol;
  fType = iVel.w;
  vW = wp;
  gl_Position = uViewProj * vec4(wp, 1.0);
}`;

const FS_PART = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + `
in vec2 vUV;
flat in vec4 fCol;
flat in float fType;
in vec3 vW;
out vec4 fragColor;
void main() {
  int type = int(fType + 0.5);
  float r = length(vUV);
  float a;
  vec3 col = fCol.rgb;
  if (type == 0) a = exp(-r * r * 4.5) * (1.0 - smoothstep(0.85, 1.0, r));
  else if (type == 1) a = exp(-r * r * 3.5) * (1.0 - smoothstep(0.8, 1.0, r));
  else if (type == 2) {
    float n = texture(uNoise, vUV * 0.35 + fCol.a * 0.1 + vW.xz * 0.05).r;
    a = (1.0 - smoothstep(0.35 + n * 0.4, 1.0, r)) * 0.9;
  } else if (type == 3) {
    vec2 q = abs(vUV);
    float star = max(1.0 - smoothstep(0.0, 0.12, q.x * 3.0 + q.y * 0.35), 1.0 - smoothstep(0.0, 0.12, q.y * 3.0 + q.x * 0.35));
    a = max(star, exp(-r * r * 12.0));
  } else {
    a = 1.0 - smoothstep(0.0, 0.12, abs(r - 0.82));
  }
  a *= fCol.a;
  if (a < 0.003) discard;
  if (type == 2) fragColor = vec4(atmos(col, vW), a);
  else fragColor = vec4(col * a, a);
}`;

// ------------------------------------------------------------
// Ribbons: swooshes, trails, lightning, goo jets, rope
// ------------------------------------------------------------
const VS_RIB = GLSL_HEAD + GLSL_FRAME + `
in vec3 aPos;
in vec3 aUV;
in vec4 aCol;
out vec3 vUV;
out vec4 vCol;
out vec3 vW;
void main() {
  vUV = aUV; vCol = aCol; vW = aPos;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

const FS_RIB = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + GLSL_GOO + `
in vec3 vUV;
in vec4 vCol;
in vec3 vW;
out vec4 fragColor;
uniform int uMode;
void main() {
  float u = vUV.x, v = vUV.y;
  if (uMode == 0) {
    float across = pow(max(1.0 - v * v, 0.0), 1.5);
    float core = pow(max(1.0 - abs(v), 0.0), 6.0);
    float a = across * vCol.a;
    vec3 col = mix(vCol.rgb, vec3(1.0), core * 0.85);
    fragColor = vec4(col * a, a);
  } else {
    // tube: shade as a cylinder of goo
    float nv = clamp(v, -1.0, 1.0);
    vec3 viewDir = normalize(uCamPos - vW);
    vec3 n = normalize(viewDir * sqrt(max(1.0 - nv * nv, 0.0)) + uCamUp * nv * 0.8 + uCamRight * nv * 0.2);
    float flow = texture(uNoise, vec2(u * 0.6 - uTime * 1.6, vUV.z)).r;
    vec3 base = vCol.rgb * (0.85 + 0.35 * flow);
    vec3 col = gooShade(base, vW, n, viewDir, 0.6, 1.0, 0.25 + 0.4 * flow, 1.0);
    col += vec3(0.9, 1.0, 1.0) * pow(max(1.0 - abs(v), 0.0), 8.0) * 0.6;
    float a = smoothstep(1.0, 0.85, abs(v)) * vCol.a;
    fragColor = vec4(atmos(col, vW), a);
  }
}`;

// ------------------------------------------------------------
// Aura puddle and bubble shield
// ------------------------------------------------------------
const VS_QUADW = GLSL_HEAD + GLSL_FRAME + `
in vec2 aCorner;
uniform vec3 uC;
uniform float uR;
uniform int uBillboard;
out vec3 vW;
out vec2 vUV;
void main() {
  vec3 wp;
  if (uBillboard == 1) {
    vec3 toCam = normalize(uCamPos - uC);
    wp = uC + toCam * uR + (uCamRight * aCorner.x + uCamUp * aCorner.y) * uR * 1.3;
  } else {
    wp = vec3(uC.x + aCorner.x * uR, 0.014, uC.z + aCorner.y * uR);
  }
  vW = wp; vUV = aCorner;
  gl_Position = uViewProj * vec4(wp, 1.0);
}`;

const FS_AURA = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + GLSL_GOO + `
in vec3 vW;
in vec2 vUV;
uniform float uLevel;
out vec4 fragColor;
void main() {
  float r = length(vUV);
  float ang = atan(vUV.y, vUV.x);
  float edge = 0.9 + 0.035 * sin(ang * 5.0 + uTime * 1.7) + 0.025 * sin(ang * 9.0 - uTime * 2.3) + 0.03 * (texture(uNoise, vec2(ang * 0.3, uTime * 0.05)).r - 0.5);
  float m = 1.0 - smoothstep(edge - 0.03, edge, r);
  if (m < 0.003) discard;
  float h = sqrt(max(0.0, 1.0 - pow(r / edge, 2.0)));
  vec3 n = normalize(vec3(-dFdx(h) * 1.5, 1.0, -dFdy(h) * 1.5) + vec3((texture(uNoise, vW.xz * 0.4 + uTime * 0.04).r - 0.5) * 0.35, 0.0, (texture(uNoise, vW.xz * 0.37 - uTime * 0.035).g - 0.5) * 0.35));
  vec3 v = normalize(uCamPos - vW);
  float caus = smoothstep(0.82, 0.97, texture(uNoise, vW.xz * 0.3 + vec2(uTime * 0.03, -uTime * 0.02)).b) + smoothstep(0.85, 0.98, texture(uNoise, vW.xz * 0.22 - vec2(uTime * 0.025, uTime * 0.035)).b);
  vec3 base = uGooBase;
  vec3 col = gooShade(base, vW, n, v, 0.5, 1.0, 0.04 + 0.03 * uLevel, 0.8) * 0.75;
  col += vec3(0.75, 1.0, 1.0) * caus * 0.22;
  float rim = smoothstep(edge - 0.12, edge - 0.02, r) * (1.0 - smoothstep(edge - 0.02, edge, r));
  col += vec3(0.8, 1.0, 1.0) * rim * 0.3;
  float a = m * (0.16 + 0.14 * h + rim * 0.35 + caus * 0.12);
  fragColor = vec4(atmos(col, vW), clamp(a, 0.0, 0.7));
}`;

const FS_BUBBLE = GLSL_HEAD + GLSL_FRAME + GLSL_COMMON + `
in vec3 vW;
in vec2 vUV;
uniform vec3 uC;
uniform float uR;
uniform vec4 uHit;
uniform float uFade;
out vec4 fragColor;
void main() {
  vec3 rd = normalize(vW - uCamPos);
  vec2 h = sphHit(uCamPos, rd, uC, uR);
  if (h.y < 0.0) discard;
  vec3 p = uCamPos + rd * max(h.x, 0.0);
  vec3 n = normalize(p - uC);
  if (uHit.w > 0.0) {
    float d = length(p - uHit.xyz);
    n = normalize(n + (p - uHit.xyz) / max(d, 0.01) * sin(d * 16.0 - uHit.w * 30.0) * exp(-uHit.w * 4.0) * 0.4);
  }
  vec3 v = -rd;
  float ndv = clamp(dot(n, v), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.2);
  float film = ndv * 3.0 + texture(uNoise, n.xz * 0.5 + uTime * 0.03).r * 2.0 + uTime * 0.2;
  vec3 irid = 0.5 + 0.5 * cos(6.2832 * (film + vec3(0.0, 0.33, 0.67)));
  vec3 H = normalize(uLightDir + v);
  float spec = pow(max(dot(n, H), 0.0), 120.0) * 1.6;
  vec3 L2 = normalize(vec3(0.7, 0.3, 0.6));
  spec += pow(max(dot(n, normalize(L2 + v)), 0.0), 80.0) * 0.6;
  vec3 col = mix(vec3(0.6, 0.95, 1.0), irid, 0.65) * (0.25 + fres * 1.1) + uLightCol * spec;
  float a = clamp(0.06 + fres * 0.7 + spec * 0.5, 0.0, 1.0) * uFade;
  fragColor = vec4(col * a, a);
}`;

// ------------------------------------------------------------
// Post-processing: bloom chain and final composite
// ------------------------------------------------------------
const VS_FULL = GLSL_HEAD + `
in vec2 aPos;
out vec2 vUV;
void main() { vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

// Menu backdrop: bright sky-blue gradient with a soft glow behind the hero
const FS_BACKDROP = GLSL_HEAD + `
in vec2 vUV;
uniform float uTimeB;
uniform float uAspectB;
uniform vec2 uGlowAt;
uniform sampler2D uNoise;
out vec4 fragColor;
void main() {
  vec2 p = (vUV - uGlowAt) * vec2(uAspectB, 1.0);
  float r = length(p);
  vec3 edge = vec3(0.07, 0.42, 0.93), mid = vec3(0.26, 0.64, 1.0), glow = vec3(0.72, 0.9, 1.0);
  vec3 col = mix(mid, edge, smoothstep(0.15, 1.05, r));
  col = mix(col, glow, exp(-r * r * 7.0) * 0.6);
  vec2 q = vUV * vec2(uAspectB, 1.0);
  float sw = texture(uNoise, q * 0.35 + vec2(uTimeB * 0.008, -uTimeB * 0.005)).r + texture(uNoise, q * 0.6 - vec2(uTimeB * 0.006, 0.0)).g;
  col += (sw - 1.0) * 0.045;
  fragColor = vec4(col, 1.0);
}`;

const FS_DOWN = GLSL_HEAD + `
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uThreshold;
uniform int uPrefilter;
out vec4 fragColor;
vec3 s(vec2 o) { return texture(uSrc, vUV + uTexel * o).rgb; }
void main() {
  vec3 a = s(vec2(-2.0, 2.0)), b = s(vec2(0.0, 2.0)), c = s(vec2(2.0, 2.0));
  vec3 d = s(vec2(-2.0, 0.0)), e = s(vec2(0.0)), f = s(vec2(2.0, 0.0));
  vec3 g = s(vec2(-2.0, -2.0)), h = s(vec2(0.0, -2.0)), i = s(vec2(2.0, -2.0));
  vec3 j = s(vec2(-1.0, 1.0)), k = s(vec2(1.0, 1.0)), l = s(vec2(-1.0, -1.0)), m = s(vec2(1.0, -1.0));
  vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
  if (uPrefilter == 1) {
    // a stray NaN or Inf would spread through the whole bloom chain as big blocks
    if (any(isnan(col)) || any(isinf(col))) col = vec3(0.0);
    col = min(col, vec3(24.0));
    float br = max(col.r, max(col.g, col.b));
    float knee = 0.35;
    float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 1e-4);
    col *= max(soft, br - uThreshold) / max(br, 1e-4);
  }
  fragColor = vec4(col, 1.0);
}`;

const FS_UP = GLSL_HEAD + `
in vec2 vUV;
uniform sampler2D uSrc;
uniform vec2 uTexel;
out vec4 fragColor;
vec3 s(vec2 o) { return texture(uSrc, vUV + uTexel * o).rgb; }
void main() {
  vec3 col = s(vec2(-1.0, 1.0)) + s(vec2(0.0, 1.0)) * 2.0 + s(vec2(1.0, 1.0))
    + s(vec2(-1.0, 0.0)) * 2.0 + s(vec2(0.0)) * 4.0 + s(vec2(1.0, 0.0)) * 2.0
    + s(vec2(-1.0, -1.0)) + s(vec2(0.0, -1.0)) * 2.0 + s(vec2(1.0, -1.0));
  fragColor = vec4(col / 16.0, 1.0);
}`;

const FS_COMPOSITE = GLSL_HEAD + `
in vec2 vUV;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStr;
uniform float uHurt;
uniform float uLowHp;
uniform float uAspect;
uniform float uTimeC;
uniform float uFlashW;
uniform vec3 uShadowTint;
out vec4 fragColor;
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main() {
  vec3 col = texture(uScene, vUV).rgb;
  if (uBloomStr > 0.0) col += texture(uBloom, vUV).rgb * uBloomStr;
  vec3 t = max(col - 0.8, 0.0);
  col = min(col, vec3(0.8)) + t / (1.0 + 4.0 * t);
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, 1.08);
  col += uShadowTint * (1.0 - smoothstep(0.0, 0.3, luma)) * 0.05;
  float d = length(vUV - 0.5) * 1.414;
  col *= mix(1.0, 0.62, smoothstep(0.45, 1.05, d));
  float hurt = max(uHurt, uLowHp * (0.55 + 0.45 * sin(uTimeC * 5.0)));
  col = mix(col, vec3(0.75, 0.05, 0.08), hurt * smoothstep(0.35, 1.0, d) * 0.85);
  col = mix(col, vec3(1.0), uFlashW);
  col += (hash12(gl_FragCoord.xy + fract(uTimeC) * 61.0) - 0.5) / 255.0;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;
