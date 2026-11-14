// How long models take to mesh, with no browser: `node test/meshtime.mjs [model ...]` (default: a few of each kind).
// Prints build time, triangles, part count and bounds per model. Use it before and after changing a model, the SDF
// mesher (src/03-sdfmesh.js) or a THEME_CELLS size: every model is built in the background workers at start-up, and a
// chapter waits for its own models before it begins, so build time is a real cost. HASH=1 also prints a hash of
// each mesh's vertices, to show a mesher change leaves the meshes the same.
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import crypto from 'node:crypto';
const src = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
const files = fs.readFileSync(path.join(src, '..', 'build.mjs'), 'utf8').match(/const worker = \[([^\]]+)\]/)[1].match(/'[^']+'/g).map(s => s.slice(1, -1));
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['stickman', 'brute', 'raft', 'sloop', 'icoral', 'bruin3', 'kraken', 'pcapt'];
const code = files.map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n') + `
;globalThis.__run = names => { const defs = prepareModelDefs(); return names.map(n => { if (!defs[n] && !n.endsWith('_crown')) return [n, 'no such model']; const t = performance.now(), m = buildMeshByName(defs, n), d = defs[n] || {}; return [n, Math.round(performance.now() - t), m.ni / 3, (d.parts || []).length, m.verts]; }); };`;
const ctx = { console, performance, Math, Float32Array, Uint32Array, Int32Array, Uint16Array, Uint8Array, Array, Object, Map, Set };
vm.createContext(ctx); vm.runInContext(code, ctx);
let total = 0;
for (const [n, ms, tris, parts, verts] of ctx.__run(names)) {
  if (typeof ms !== 'number') { console.log(n, ms); continue; }
  total += ms;
  console.log(`${n.padEnd(14)} ${String(ms).padStart(6)} ms  ${String(tris).padStart(7)} tris  ${String(parts).padStart(4)} parts${process.env.HASH ? '  ' + crypto.createHash('md5').update(Buffer.from(verts.buffer)).digest('hex').slice(0, 10) : ''}`);
}
console.log('total', total, 'ms');
