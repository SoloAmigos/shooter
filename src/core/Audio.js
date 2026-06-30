// Tiny WebAudio SFX engine — all sounds are synthesized, no asset files.
// Stays silent until the first user gesture resumes the context.

export class Audio {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.master = null;
    this._lastShot = 0;
  }

  _ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) {
      this.enabled = false;
      return;
    }
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  }

  resume() {
    this._ensure();
    this.ctx?.resume?.();
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.value = on ? 0.35 : 0;
  }

  _blip(freq, dur, type = 'square', gain = 0.3, slide = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  shoot() {
    // throttle so high fire-rates don't spam the mixer
    const now = performance.now();
    if (now - this._lastShot < 45) return;
    this._lastShot = now;
    this._blip(220 + Math.random() * 60, 0.06, 'square', 0.12, -120);
  }

  hit() {
    this._blip(140, 0.05, 'sawtooth', 0.1, -40);
  }

  coin() {
    this._blip(880, 0.07, 'triangle', 0.18, 220);
  }

  gate() {
    this._blip(440, 0.12, 'sine', 0.25, 220);
  }

  explosion() {
    this._blip(90, 0.3, 'sawtooth', 0.3, -50);
  }

  lose() {
    this._blip(300, 0.5, 'sawtooth', 0.3, -220);
  }

  win() {
    this._blip(523, 0.12, 'triangle', 0.3, 140);
    setTimeout(() => this._blip(784, 0.18, 'triangle', 0.3, 140), 110);
  }
}
