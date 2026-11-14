// Look inside a model's signed distance field with no browser (models are SDF parts meshed by src/03-sdfmesh.js).
// Handy when a part does not show up, shows up in the wrong place, or a model meshes slowly.
//
//   node test/sdf.mjs parts <model>             its parts by shape, part count, bounds, cell size and clips
//   node test/sdf.mjs at <model> x y z          the field's distance at a point, and the nearest parts there
//                                               (negative = inside; the nearest part decides a vertex's color)
//   node test/sdf.mjs slice <model> y [z]       walk across x at height y (and depth z, default 0): where the
//                                               surface is, i.e. how wide the model really is at that height
//   node test/sdf.mjs field <model>             compare the mesher's binned field with the exact one near the
//                                               surface (they should agree; ellipsoids can differ a little)
//   node test/sdf.mjs evals <model>             build the mesh counting distance evaluations per shape type:
//                                               which kind of part the build time goes to
//
// See also test/meshtime.mjs (build time and triangles, HASH=1 to compare meshes before and after a change).
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
const src = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
const files = fs.readFileSync(path.join(src, '..', 'build.mjs'), 'utf8').match(/const worker = \[([^\]]+)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
const [cmd, name, ...rest] = process.argv.slice(2);
if (!cmd || !name) { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).slice(0, 14).join('\n')); process.exit(0); }
const ctx = { console, performance, Math, Float32Array, Uint32Array, Int32Array, Uint16Array, Uint8Array, Array, Object, Map, Set };
vm.createContext(ctx);
vm.runInContext(files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n') + '\n;globalThis.__defs = prepareModelDefs();', ctx);
const run = code => vm.runInContext(code, ctx);
ctx.__name = name; ctx.__args = rest.map(Number);
if (!run('!!__defs[__name]')) { console.log(`no model "${name}". Models whose names contain it:`, run(`Object.keys(__defs).filter(k => k.includes(__name)).slice(0, 30).join(' ')`)); process.exit(1); }
run('globalThis.__m = __defs[__name]; prepParts(__m.parts); globalThis.__cell = MESH_CELLS[__name] || THEME_CELLS[__name] || 0.035;');
const fmt = v => (typeof v === 'number' ? +v.toFixed(3) : v);
if (cmd === 'parts') {
  console.log(run(`(() => {
    const m = __m, by = {}, subs = m.parts.filter(p => p.sub).length;
    for (const p of m.parts) by[p.s] = (by[p.s] || 0) + 1;
    const [lo, hi] = partsBox(m.parts, 0);
    return { model: __name, parts: m.parts.length, carved: subs, byShape: by, cell: __cell, box: { lo: lo.map(v => +v.toFixed(2)), hi: hi.map(v => +v.toFixed(2)) },
      clips: m.clipNames, thinnest: Math.min(...m.parts.filter(p => !p.sub).map(p => p.s === 'sph' ? p.r * 2 : p.s === 'cap' ? Math.min(p.r, p.r2 ?? p.r) * 2 : p.s === 'ell' ? Math.min(...p.rr) * 2 : p.s === 'box' ? Math.min(...p.hs) * 2 : p.s === 'cyl' ? Math.min(p.r, p.hh) * 2 : p.s === 'tor' ? p.r * 2 : 9)).toFixed(3) + ' (keep >= 2 cells: ' + (__cell * 2).toFixed(3) + ')' };
  })()`));
} else if (cmd === 'at') {
  const [x, y, z] = ctx.__args;
  console.log(run(`(() => {
    const [x, y, z] = __args, d = modelSdf(__m.parts, x, y, z);
    const near = __m.parts.map((p, i) => ({ i, s: p.s, sub: !!p.sub, d: partDist(p, x, y, z), col: p.col ? p.col.map(v => Math.round(v * 255)).join(',') : 'tint' }))
      .sort((a, b) => Math.abs(a.d) - Math.abs(b.d)).slice(0, 6).map(p => ({ ...p, d: +p.d.toFixed(3) }));
    return { at: [x, y, z], field: +d.toFixed(4), inside: d < 0, nearest: near };
  })()`));
} else if (cmd === 'slice') {
  const [y, z = 0] = ctx.__args;
  const out = run(`(() => {
    const [y, z] = [__args[0], __args[1] || 0], [lo, hi] = partsBox(__m.parts, 0.1), step = __cell / 2, cross = [];
    let prev = modelSdf(__m.parts, lo[0], y, z);
    for (let x = lo[0] + step; x <= hi[0]; x += step) { const d = modelSdf(__m.parts, x, y, z); if ((d < 0) !== (prev < 0)) cross.push(+(x - step * d / (d - prev)).toFixed(3)); prev = d; }
    return { y, z, surfaceAtX: cross, width: cross.length >= 2 ? +(cross[cross.length - 1] - cross[0]).toFixed(3) : 0 };
  })()`);
  console.log(out);
} else if (cmd === 'field') {
  console.log(run(`(() => {
    const m = __m, [bmin, bmax] = partsBox(m.parts, __cell * 2.5), reach = Math.max(0.12 * (m.aoScale || 1), __cell * 10) + 0.05;
    const f = m.parts.length > 24 ? binnedSdf(m.parts, bmin, bmax, reach) : (x, y, z) => modelSdf(m.parts, x, y, z);
    // what matters for the mesh: the same side of the surface, and the same distance within a couple of cells of it.
    // (Away from the surface the two can differ a lot where an ellipsoid's distance is only approximate: harmless.)
    let n = 0, raw = 0, bad = 0, worst = 0, at = null, seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, near = __cell * 2;
    for (let i = 0; i < 300000; i++) {
      const x = bmin[0] + rnd() * (bmax[0] - bmin[0]), y = bmin[1] + rnd() * (bmax[1] - bmin[1]), z = bmin[2] + rnd() * (bmax[2] - bmin[2]);
      const a = modelSdf(m.parts, x, y, z); if (Math.abs(a) > reach) continue; n++;
      const b = f(x, y, z);
      if (Math.abs(a - b) > 1e-6) raw++;
      const matters = (a < 0) !== (b < 0) || (Math.min(Math.abs(a), Math.abs(b)) < near && Math.abs(a - b) > __cell * 0.25);
      if (matters) { bad++; if (Math.abs(a - b) > worst) { worst = Math.abs(a - b); at = [x, y, z].map(v => +v.toFixed(3)); } }
    }
    return { binned: m.parts.length > 24, samplesNearSurface: n, differingAtAll: raw, differingWhereItMatters: bad, worst: +worst.toFixed(4), worstAt: at,
      verdict: bad ? 'CHECK: the binned field disagrees near the surface; the mesh may have holes or bumps there (sdf.mjs at <model> x y z)' : 'OK: the mesh is the same either way' };
  })()`));
} else if (cmd === 'evals') {
  run(`globalThis.__cnt = {}; const __pd = partDist; partDist = function (pt, x, y, z) { const k = pt.s + (pt.sub ? ' (carve)' : ''); __cnt[k] = (__cnt[k] || 0) + 1; return __pd(pt, x, y, z); };`);
  const t = Date.now();
  run('buildMeshByName(__defs, __name)');
  const c = run('__cnt'), total = Object.values(c).reduce((a, b) => a + b, 0);
  console.log(`${name}: ${Date.now() - t} ms (with counting), ${(total / 1e6).toFixed(2)}M distance evaluations`);
  for (const [k, v] of Object.entries(c).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(14)} ${(v / 1e6).toFixed(2)}M  ${(v / total * 100).toFixed(0)}%`);
} else console.log('unknown command; run with no arguments for help');
