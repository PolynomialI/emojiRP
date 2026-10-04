// ============================================================
// Synthesized sound effects (Web Audio, no files)
// ============================================================
const AUDIO = {
  ctx: null, master: null, noiseBuf: null, enabled: true, last: {}, voices: 0,
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.ratio.value = 4;
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        this.master.connect(comp); comp.connect(this.ctx.destination);
        const len = this.ctx.sampleRate * 1.0;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (_) { this.ctx = null; }
  },
  _env(g, t0, a, peak, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  },
  _osc(type, f0, f1, dur, peak, t0, attack = 0.005, dest) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
    this._env(g, t0, attack, peak, dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
    this.voices++; o.onended = () => { this.voices--; };
  },
  _noise(dur, peak, t0, filterType, f0, f1, q = 1, attack = 0.003) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noiseBuf; s.playbackRate.value = rand(0.8, 1.2);
    f.type = filterType; f.frequency.setValueAtTime(f0, t0); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur); f.Q.value = q;
    this._env(g, t0, attack, peak, dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t0, rand(0, 0.5)); s.stop(t0 + dur + 0.02);
    this.voices++; s.onended = () => { this.voices--; };
  },
  play(name, p = 1) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const gap = { hit: 0.035, gem: 0.03, pop: 0.05, squish: 0.04, zap: 0.06, punch: 0.06, coin: 0.05, boom: 0.07, mine: 0.08, laser: 0.25, throw: 0.08 }[name] || 0.02;
    if (this.last[name] && now - this.last[name] < gap) return;
    if (this.voices > 28 && !['levelup', 'boss', 'win', 'lose', 'hurt', 'click'].includes(name)) return;
    this.last[name] = now;
    const t = now + 0.005;
    switch (name) {
      case 'pop': this._osc('sine', 620 * p, 220, 0.09, 0.18, t); this._noise(0.03, 0.05, t, 'highpass', 3000, 3000); break;
      case 'hit': this._noise(0.06, 0.12, t, 'bandpass', rand(700, 1100), 400, 2); break;
      case 'squish': this._osc('sine', rand(260, 340), 70, 0.13, 0.16, t); this._noise(0.1, 0.07, t, 'lowpass', 1400, 300, 1); break;
      case 'boom': this._noise(0.45, 0.32, t, 'lowpass', 900, 120, 1); this._osc('sine', 90, 38, 0.4, 0.3, t); break;
      case 'zap': this._noise(0.14, 0.14, t, 'highpass', 2200, 5000, 1); this._osc('square', 180, 90, 0.12, 0.05, t); break;
      case 'gem': this._osc('sine', 880 * p, 1320 * p, 0.06, 0.07, t); break;
      case 'coin': this._osc('sine', 1320, 1320, 0.07, 0.08, t); this._osc('sine', 1760, 1760, 0.12, 0.07, t + 0.06); break;
      case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => this._osc('triangle', f, f, 0.16, 0.13, t + i * 0.07)); break;
      case 'hurt': this._osc('sine', 170, 65, 0.22, 0.28, t); this._noise(0.12, 0.1, t, 'lowpass', 800, 200); break;
      case 'punch': this._noise(0.09, 0.2, t, 'lowpass', 900, 200, 1); this._osc('sine', 150, 55, 0.12, 0.22, t); break;
      case 'throw': this._noise(0.16, 0.08, t, 'bandpass', 600, 2400, 3, 0.04); break;
      case 'laser': this._osc('sawtooth', 220, 330, 0.35, 0.05, t, 0.03); this._noise(0.35, 0.06, t, 'bandpass', 1500, 2500, 4, 0.03); break;
      case 'shield': this._osc('sine', 600, 950, 0.25, 0.08, t, 0.03); break;
      case 'bubblepop': this._osc('sine', 950, 280, 0.1, 0.15, t); break;
      case 'mine': this._osc('sine', 420, 760, 0.07, 0.08, t); break;
      case 'boss': this._osc('sawtooth', 70, 55, 1.1, 0.16, t, 0.2); this._osc('sawtooth', 105, 82, 1.1, 0.1, t, 0.2); this._noise(1.0, 0.08, t, 'lowpass', 300, 120, 1, 0.3); break;
      case 'click': this._osc('sine', 1200, 900, 0.03, 0.06, t); break;
      case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this._osc('triangle', f, f, 0.22, 0.12, t + i * 0.09)); break;
      case 'lose': [440, 370, 311, 262].forEach((f, i) => this._osc('triangle', f, f * 0.98, 0.3, 0.12, t + i * 0.16)); break;
      case 'chest': [392, 523, 659, 784, 1047].forEach((f, i) => this._osc('sine', f, f, 0.2, 0.1, t + i * 0.05)); break;
      case 'split': this._osc('sine', 300, 600, 0.15, 0.12, t); break;
      case 'drip': this._osc('sine', 900, 500, 0.06, 0.06, t); break;
    }
  },
};
