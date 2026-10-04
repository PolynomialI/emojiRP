// Concatenate sources into a single self-contained HTML file.
// usage: node build.mjs            -> dist/project-gel.html
//        node build.mjs visual     -> test/visual.html (engine + test scene)
import fs from 'node:fs';
import path from 'node:path';
const root = path.dirname(new URL(import.meta.url).pathname);
const target = process.argv[2] || 'game';
const src = path.join(root, 'src');
const files = fs.readdirSync(src).filter(f => f.endsWith('.js')).sort();
const engine = files.filter(f => /^0\d-/.test(f));
let js;
let template;
let out;
if (target === 'visual') {
  js = engine.map(f => `// ---- ${f} ----\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n') + '\n' + fs.readFileSync(path.join(root, 'test', 'scene.js'), 'utf8');
  template = `<!doctype html><html><head><meta charset="utf-8"><title>Visual test</title><style>html,body{margin:0;height:100%;background:#000;overflow:hidden}canvas{width:100%;height:100%;display:block}</style></head><body><canvas id="c"></canvas><script>\n/*JS*/\n</script></body></html>`;
  out = path.join(root, 'test', 'visual.html');
} else {
  js = files.map(f => `// ---- ${f} ----\n` + fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
  template = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
  out = path.join(root, 'dist', 'project-gel.html');
}
let html = template.replace('/*JS*/', () => js);
if (target !== 'visual') {
  // the mesh-building worker reuses the util, SDF mesher and model files as plain text
  const worker = ['00-util.js', '03-sdfmesh.js', '04-models.js'].map(f => fs.readFileSync(path.join(src, f), 'utf8')).join('\n');
  if (/<\/script/i.test(worker) || /<\/script/i.test(js)) throw new Error('source contains a closing script tag');
  html = html.replace('/*WORKER*/', () => worker);
}
fs.writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
