// ============================================================
// Music: synthesized live with Web Audio, like the sound effects (no files). A four-bar loop per mood:
//   home  a slow, gentle C major: soft pad, a music-box arpeggio and a little tune
//   land  C major, livelier, on land runs
//   sea   D minor and a rolling shanty rhythm, at sea
//   boss  A minor, faster and darker, while a boss is up
// Layers fade in with the fight's intensity (how many foes are about, a boss): pad and tune always, then the
// bass, then hats, then kick and snare, and toms during a boss. Menus and pauses play it soft and muffled.
// Each note is one or two oscillators that stop by themselves; at most a couple of dozen sound at once.
// ============================================================
const SONGS = {
  home: { bpm: 88, chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bass: [36, 33, 41, 43], scale: [60, 62, 64, 67, 69, 72, 74, 76], swing: 0, lead: 'triangle', pad: 'sine' },
  land: { bpm: 108, chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bass: [36, 33, 41, 43], scale: [60, 62, 64, 67, 69, 72, 74, 76], swing: 0, lead: 'square', pad: 'triangle' },
  sea: { bpm: 100, chords: [[62, 65, 69], [60, 64, 67], [58, 62, 65], [57, 61, 64]], bass: [38, 36, 34, 33], scale: [62, 64, 65, 67, 69, 71, 72, 74], swing: 0.16, lead: 'triangle', pad: 'triangle' },
  boss: { bpm: 128, chords: [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]], bass: [33, 29, 38, 40], scale: [57, 59, 60, 62, 64, 65, 67, 69], swing: 0, lead: 'sawtooth', pad: 'sawtooth' },
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const MUSIC = {
  bus: null, filt: null, step: 0, bar: 0, nextT: 0, mood: 'home', song: SONGS.home, inten: 0, voices: 0, vol: 0,
  // the layers' current levels (eased toward their targets so nothing jumps in)
  lv: { pad: 0, arp: 0, mel: 0, bass: 0, hat: 0, kick: 0, tom: 0 },
  start() {
    const c = AUDIO.ctx;
    if (this.bus || !c) return;
    this.bus = c.createGain(); this.bus.gain.value = 0;
    this.filt = c.createBiquadFilter(); this.filt.type = 'lowpass'; this.filt.frequency.value = 16000; this.filt.Q.value = 0.4;
    this.bus.connect(this.filt); this.filt.connect(AUDIO.master);
    this.nextT = c.currentTime + 0.15;
  },
  // one note: an oscillator through its own envelope (and an optional low-pass), into the music bus
  note(type, f, t, dur, peak, attack = 0.01, cutoff = 0, detune = 0) {
    if (this.voices > 26 || peak < 0.002) return;
    const c = AUDIO.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (detune) o.detune.setValueAtTime(detune, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (cutoff) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cutoff; o.connect(lp); lp.connect(g); } else o.connect(g);
    g.connect(this.bus);
    o.start(t); o.stop(t + dur + 0.05);
    this.voices++; o.onended = () => { this.voices--; };
  },
  noise(t, dur, peak, type, f, q = 1) {
    if (this.voices > 26 || peak < 0.002 || !AUDIO.noiseBuf) return;
    const c = AUDIO.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = AUDIO.noiseBuf; fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(this.bus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
    this.voices++; s.onended = () => { this.voices--; };
  },
  kick(t, peak) {
    if (this.voices > 26 || peak < 0.002) return;
    const c = AUDIO.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.3);
    this.voices++; o.onended = () => { this.voices--; };
  },
  // what should be playing now, and how hard: called every frame
  tick(dt) {
    const c = AUDIO.ctx;
    if (!c || c.state !== 'running') return;
    if (!this.bus) this.start();
    const st = G.save && G.save.settings, on = st && st.music !== false && !document.hidden;
    const run = G.run, live = run && !run.over && ['run', 'pause', 'levelup', 'chest', 'victory', 'revive', 'dying'].includes(G.state);
    // intensity: the number of foes about, more at sea per foe (fewer come), a boss lifts it all the way
    let target = 0, mood = 'home';
    if (live) {
      const alive = run.enemies.length;
      mood = run.bossStarted && run.bosses.some(b => !b.dying) ? 'boss' : run.sea ? 'sea' : 'land';
      target = clamp(0.22 + alive / (run.sea ? 70 : 140), 0, 0.85) + (mood === 'boss' ? 0.4 : 0);
      if (run.hp > 0 && run.hp < run.maxHp * 0.3) target += 0.1;
      if (run.cave) target = Math.max(target, 0.55);
    }
    this.inten += (clamp(target, 0, 1) - this.inten) * (1 - Math.exp(-dt / 2.5));
    // menus, pauses and level-ups: softer and muffled
    const soft = !live || G.state !== 'run';
    const vol = on ? (live ? (soft ? 0.5 : 1) : 0.75) * 0.34 : 0;
    this.vol += (vol - this.vol) * (1 - Math.exp(-dt * 3));
    this.bus.gain.setTargetAtTime(this.vol, c.currentTime, 0.05);
    this.filt.frequency.setTargetAtTime(live && soft ? 1100 : 16000, c.currentTime, 0.25);
    this.wantMood = mood;
    const I = this.inten, home = mood === 'home', boss = mood === 'boss';
    const want = {
      pad: home ? 0.55 : 0.42, arp: home ? 0.4 : 0.18 + 0.22 * I, mel: home ? 0.32 : boss ? 0.3 : 0.24,
      bass: home ? 0 : smoothstep(0.12, 0.38, I) * 0.7, hat: home ? 0 : smoothstep(0.32, 0.55, I) * 0.6,
      kick: home ? 0 : smoothstep(0.48, 0.7, I) * 0.85, tom: boss ? 0.6 : 0,
    };
    for (const k in want) this.lv[k] += (want[k] - this.lv[k]) * (1 - Math.exp(-dt / 1.2));
    if (this.vol < 0.003 && !on) { this.nextT = c.currentTime + 0.1; return; }
    // schedule the sixteenth notes that fall in the next 0.2 s
    if (this.nextT < c.currentTime - 0.5) this.nextT = c.currentTime + 0.05;
    while (this.nextT < c.currentTime + 0.2) {
      if (this.step === 0 && this.mood !== this.wantMood) { this.mood = this.wantMood; this.song = SONGS[this.mood]; this.bar = 0; }
      this.play(this.step, this.nextT);
      const sp = 60 / this.song.bpm / 4, sw = this.song.swing;
      this.nextT += sp * (this.step % 2 === 0 ? 1 + sw : 1 - sw);
      this.step = (this.step + 1) % 16;
      if (this.step === 0) this.bar++;
    }
  },
  // one sixteenth: which layers play on it
  play(s, t) {
    const S = this.song, L = this.lv, ci = this.bar % 4, ch = S.chords[ci], beat = 60 / S.bpm, barLen = beat * 4;
    // pad: the chord, held for the bar
    if (s === 0) for (let i = 0; i < 3; i++) this.note(S.pad, mtof(ch[i]), t, barLen * 1.05, 0.05 * L.pad, barLen * 0.3, S.pad === 'sine' ? 0 : 1400, i === 1 ? 6 : -4);
    // arpeggio: chord tones an octave up, on the eighths
    if (s % 2 === 0) { const ord = [0, 1, 2, 1, 2, 0, 1, 2][s / 2], f = mtof(ch[ord] + 12); this.note('triangle', f, t, 0.24, 0.05 * L.arp, 0.005); }
    // the tune: a two-bar phrase made from the bar number (so it repeats, A A B A), on chord tones on the beat
    if (s % 2 === 0) {
      const phrase = [0, 0, 1, 0][Math.floor(this.bar / 2) % 4], seed = (phrase * 97 + (this.bar % 2) * 31 + s * 7) % 101;
      const playIt = s % 4 === 0 ? seed % 3 !== 0 : seed % 5 === 0;
      if (playIt) {
        const sc = S.scale, onBeat = s % 8 === 0;
        const m = onBeat ? ch[seed % 3] + 12 : sc[seed % sc.length] + 12;
        this.note(S.lead, mtof(m), t, onBeat ? beat * 0.9 : beat * 0.45, 0.045 * L.mel, 0.01, S.lead === 'triangle' ? 0 : 2200);
      }
    }
    // bass: the root on the one, a push before the three, the fifth on the three
    if ([0, 6, 8, 14].includes(s)) { const r = S.bass[ci] + (s === 8 ? 7 : 0); this.note('triangle', mtof(r), t, s === 0 || s === 8 ? beat * 0.9 : beat * 0.4, 0.13 * L.bass, 0.008, 900); }
    // drums
    if (s % 2 === 0 || L.hat > 0.45) this.noise(t, 0.04, 0.05 * L.hat * (s % 4 === 2 ? 1.3 : 1), 'highpass', 7000);
    if (s === 0 || s === 8 || (s === 10 && this.inten > 0.8)) this.kick(t, 0.32 * L.kick);
    if (s === 4 || s === 12) { this.noise(t, 0.16, 0.12 * L.kick, 'bandpass', 1800, 0.8); this.note('triangle', 190, t, 0.1, 0.05 * L.kick, 0.002); }
    // the boss's toms roll into the next bar
    if (L.tom > 0.05 && this.bar % 2 === 1 && s >= 12) this.note('sine', [196, 165, 147, 123][s - 12], t, 0.18, 0.12 * L.tom, 0.003);
  },
};
