const frequency = { sheep: 525, chicken: 702, pig: 260, goat: 420 };

export class BarnAudio {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.context = null;
  }

  setEnabled(enabled) { this.enabled = Boolean(enabled); }
  wake() {
    if (!this.enabled) return;
    try {
      this.context ||= new AudioContext();
      if (this.context.state === "suspended") this.context.resume();
    } catch {}
  }

  tone(kind, animal = "sheep") {
    if (!this.enabled) return;
    this.wake();
    const context = this.context;
    if (!context || context.state !== "running") return;
    const patterns = {
      move: ["triangle", 360, 0.035, .025],
      rotate: ["sine", 610, 0.06, .035],
      lock: ["triangle", 175, 0.07, .055],
      rescue: ["sine", frequency[animal] || 460, 0.23, .07],
      warning: ["sawtooth", 125, 0.21, .055],
      attack: ["sawtooth", 85, 0.28, .09],
      tool: ["triangle", 780, 0.16, .055],
      dawn: ["sine", 523, 0.48, .07]
    };
    const [wave, base, duration, gain] = patterns[kind] || patterns.move;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const volume = context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(base, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, base * (kind === "attack" ? .45 : 1.24)), now + duration);
    volume.gain.setValueAtTime(.0001, now);
    volume.gain.exponentialRampToValueAtTime(gain, now + .012);
    volume.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(volume).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + .02);
  }
}
