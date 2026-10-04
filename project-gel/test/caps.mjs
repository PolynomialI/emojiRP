import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
await page.setContent('<canvas id=c width=64 height=64></canvas>');
console.log(await page.evaluate(() => {
  const gl = document.getElementById('c').getContext('webgl2');
  if (!gl) return 'no webgl2';
  const ext = n => !!gl.getExtension(n);
  return JSON.stringify({
    renderer: gl.getParameter(gl.RENDERER), version: gl.getParameter(gl.VERSION),
    cbf: ext('EXT_color_buffer_float'), cbhf: ext('EXT_color_buffer_half_float'), flf: ext('OES_texture_float_linear'),
    maxSamples: gl.getParameter(gl.MAX_SAMPLES), maxFragUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    maxVertUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS), maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
  });
}));
await browser.close();
