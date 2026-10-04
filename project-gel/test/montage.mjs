// Combine several PNG screenshots into one grid image using a headless page canvas
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const [out, cols, ...files] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage();
const imgs = files.map(f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64'));
const data = await p.evaluate(async ({ imgs, cols }) => {
  const els = await Promise.all(imgs.map(src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; })));
  const w = els[0].width / 2, h = els[0].height / 2, c = document.createElement('canvas');
  const rows = Math.ceil(els.length / cols); c.width = w * cols; c.height = h * rows;
  const g = c.getContext('2d');
  els.forEach((im, i) => g.drawImage(im, (i % cols) * w, Math.floor(i / cols) * h, w, h));
  return c.toDataURL('image/png').split(',')[1];
}, { imgs, cols: Number(cols) });
fs.writeFileSync(out, Buffer.from(data, 'base64'));
await b.close();
