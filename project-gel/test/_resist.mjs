import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import path from 'node:path';
const dir = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await browser.newContext()).newPage();
await page.addInitScript({ path: path.join(dir, 'harness.js') });
await page.goto('file://' + path.join(dir, '..', 'dist', 'project-gel.html'));
await page.waitForFunction(() => typeof BOSS_RESIST !== 'undefined', null, { timeout: 120000 });
console.log(await page.evaluate(() => {
  const out = [], bad = [];
  for (const [k, v] of Object.entries(BOSS_RESIST)) {
    const B = BOSS_TYPES[k]; if (!B) { bad.push('missing boss ' + k); continue; }
    if (B.immune !== v.immune || B.weak !== v.weak) bad.push('not merged ' + k);
    if ((v.immune || []).length && !(v.weak || []).length) bad.push(k + ' immune but no weakness');
    for (const id of [...(v.immune || []), ...(v.weak || [])]) if (!SKILLS[id]) bad.push(k + ' unknown skill ' + id);
    out.push(k + ': immune ' + (v.immune || []).join('/') + ' | weak ' + (v.weak || []).join('/'));
  }
  return out.join('\n') + '\n' + (bad.length ? 'PROBLEMS ' + bad.join(', ') : 'table ok');
}));
await browser.close();
