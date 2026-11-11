// run: node test/check-parallel.mjs
// The game compiles its shaders in the background when the browser offers KHR_parallel_shader_compile
// (Chrome on Windows does; this test browser does not). This fakes the extension: programs report
// "still compiling" for a while, and any status query before that would have blocked on a real browser.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext({ viewport: { width: 640, height: 360 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.addInitScript(() => {
  const P = WebGL2RenderingContext.prototype, COMPLETION = 0x91B1;
  const ge = P.getExtension, gpp = P.getProgramParameter, gsp = P.getShaderParameter;
  const polls = new Map();
  window.__par = { early: [], polls: 0, done: 0 };
  P.getExtension = function (name) { return name === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR: COMPLETION, MAX_SHADER_COMPILER_THREADS_KHR: 0x91B0, maxShaderCompilerThreadsKHR() {} } : ge.call(this, name); };
  const ready = p => (polls.get(p) || 0) >= 5;
  P.getProgramParameter = function (p, pname) {
    if (pname === COMPLETION) { __par.polls++; const n = (polls.get(p) || 0) + 1; polls.set(p, n); if (n === 5) __par.done++; return ready(p); }
    if (!ready(p)) __par.early.push('program ' + pname);
    return gpp.call(this, p, pname);
  };
  P.getShaderParameter = function (s, pname) { __par.early.push('shader ' + pname); return gsp.call(this, s, pname); };
});
await page.goto('file://' + path.join(dir, '..', process.env.HTML || 'dist/project-gel.html'));
await page.waitForFunction(() => G.state === 'home', null, { timeout: 120000 });
const r = await page.evaluate(() => ({ ...__par, progs: Object.keys(R.progs).length, pending: Object.values(R.progs).filter(p => p.pending).length }));
const ok = r.done === r.progs && r.early.length === 0 && r.pending === 0 && !errs.length;
console.log(ok ? 'OK' : 'FAIL', JSON.stringify(r), errs.slice(0, 3));
await browser.close();
process.exit(ok ? 0 : 1);
