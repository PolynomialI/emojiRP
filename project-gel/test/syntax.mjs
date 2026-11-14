// After `node build.mjs`: compiles the built game's script (without running it) and reports a syntax error with
// its line, so a broken bundle is caught before a slow browser test. `node test/syntax.mjs`
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
const html = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'dist', 'project-gel.html'), 'utf8');
const scripts = [...html.matchAll(/<script(?![^>]*text\/plain)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const worker = (html.match(/<script type="text\/plain" id="workerSrc">([\s\S]*?)<\/script>/) || [])[1] || '';
let bad = 0;
for (const [name, code] of [['game', scripts.sort((a, b) => b.length - a.length)[0]], ['mesh worker', worker]]) {
  try { new vm.Script(code, { filename: name }); console.log(`${name}: OK (${(code.length / 1024).toFixed(0)} KB)`); }
  catch (e) { bad++; console.log(`${name}: ${e.name}: ${e.message}\n${(e.stack || '').split('\n').slice(0, 3).join('\n')}`); }
}
process.exit(bad ? 1 : 0);
