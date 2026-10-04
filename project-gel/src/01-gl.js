// ============================================================
// WebGL2 helpers
// ============================================================
let gl = null;
const GLCAPS = { hdr: false, samples: 0 };

const GLX = {
  init(canvas) {
    gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: true, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
    if (!gl) return false;
    GLCAPS.hdr = !!gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('OES_texture_float_linear');
    GLCAPS.samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 0);
    return true;
  },

  shader(type, src, name) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s) || '';
      const m = /ERROR: \d+:(\d+)/.exec(log);
      let excerpt = '';
      if (m) {
        const lines = src.split('\n'), ln = Number(m[1]);
        excerpt = lines.slice(Math.max(0, ln - 4), ln + 2).map((l, i) => `${Math.max(1, ln - 3) + i}: ${l}`).join('\n');
      }
      throw new Error(`[${name}] ${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader: ${log}\n${excerpt}`);
    }
    return s;
  },

  program(vs, fs, name, attribs) {
    const p = gl.createProgram();
    gl.attachShader(p, GLX.shader(gl.VERTEX_SHADER, vs, name));
    gl.attachShader(p, GLX.shader(gl.FRAGMENT_SHADER, fs, name));
    if (attribs) attribs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`[${name}] link: ${gl.getProgramInfoLog(p)}`);
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const key = info.name.replace(/\[0\]$/, '');
      u[key] = gl.getUniformLocation(p, info.name);
    }
    return { p, u, name };
  },

  buffer(data, usage = gl.STATIC_DRAW, target = gl.ARRAY_BUFFER) {
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, usage);
    return b;
  },

  texture(w, h, { internal = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE, data = null, filter = gl.LINEAR, wrap = gl.CLAMP_TO_EDGE, mips = false } = {}) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
    return t;
  },

  // A render target: color texture + optional depth renderbuffer
  target(w, h, { hdr = false, depth = false } = {}) {
    const internal = hdr ? gl.RGBA16F : gl.RGBA8;
    const type = hdr ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    const tex = GLX.texture(w, h, { internal, type });
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let rb = null;
    if (depth) {
      rb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, rb, w, h };
  },

  // Multisampled color + depth for the main scene
  msaaTarget(w, h, samples, hdr) {
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const color = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, color);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, hdr ? gl.RGBA16F : gl.RGBA8, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
    const depth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return ok ? { fb, color, depth, w, h } : null;
  },

  destroyTarget(t) {
    if (!t) return;
    if (t.fb) gl.deleteFramebuffer(t.fb);
    if (t.tex) gl.deleteTexture(t.tex);
    if (t.rb) gl.deleteRenderbuffer(t.rb);
    if (t.color) gl.deleteRenderbuffer(t.color);
    if (t.depth) gl.deleteRenderbuffer(t.depth);
  },
};

// A growable Float32 instance stream bound to a VAO's per-instance attributes
class InstanceStream {
  constructor(floatsPer, capacity) {
    this.floatsPer = floatsPer;
    this.capacity = capacity;
    this.data = new Float32Array(floatsPer * capacity);
    this.count = 0;
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);
  }
  reset() { this.count = 0; }
  // returns base offset into data, or -1 if full
  push() {
    if (this.count >= this.capacity) return -1;
    return this.count++ * this.floatsPer;
  }
  upload() {
    if (!this.count) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data, 0, this.count * this.floatsPer);
  }
  // layout: array of [location, size] in float order
  bindAttribs(layout) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    let off = 0;
    for (const [loc, size] of layout) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, this.floatsPer * 4, off * 4);
      gl.vertexAttribDivisor(loc, 1);
      off += size;
    }
  }
}
