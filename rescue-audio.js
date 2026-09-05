(() => {
  'use strict';
  let context = null, enabled = true, epoch = 0;
  function reset() {
    epoch++;
    const old = context; context = null;
    if (old && old.state !== 'closed') old.close().catch(() => {});
  }
  function wake() {
    if (!enabled) return Promise.resolve(null);
    try {
      if (!context || context.state === 'closed' || context.state === 'interrupted') {
        reset();
        context = new (window.AudioContext || window.webkitAudioContext)();
        // Prime the output while still inside the real touch/click gesture.
        const source = context.createBufferSource();
        source.buffer = context.createBuffer(1, 1, context.sampleRate);
        source.connect(context.destination); source.start(0);
      }
      const current = context;
      const ready = current.state === 'running' ? Promise.resolve() : current.resume();
      return ready.then(() => current === context && current.state === 'running' ? current : null).catch(() => null);
    } catch { return Promise.resolve(null); }
  }
  function play(kind = 'select') {
    if (!enabled) return;
    // Do not schedule against the old clock before Safari finishes resuming.
    const pending = wake(), ticket = epoch, started = performance.now();
    pending.then(audio => {
      if (!audio || !enabled || ticket !== epoch || performance.now() - started > 1000) return;
      const notes = kind === 'win' ? [523,659,784,1047] : kind === 'bark' ? [170,130,165] : kind === 'rescue' ? [660,880] : kind === 'gate' ? [523,784] : [480];
      notes.forEach((frequency,i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + .012 + i*.09;
        oscillator.type = kind === 'bark' ? 'triangle' : 'sine';
        oscillator.frequency.setValueAtTime(frequency,at);
        oscillator.frequency.exponentialRampToValueAtTime(frequency*(kind==='bark' ? .65 : 1.07),at+.13);
        gain.gain.setValueAtTime(0,at); gain.gain.linearRampToValueAtTime(.16,at+.015); gain.gain.exponentialRampToValueAtTime(.001,at+.2);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at+.22);
      });
    }).catch(() => {});
  }
  function setEnabled(value) { enabled = value; if (!value) reset(); }
  // Returning from a call, lock screen, or background tab gets a fresh output
  // on the next gesture instead of reusing Safari's interrupted audio graph.
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  window.addEventListener('pagehide', reset);
  document.addEventListener('pointerup', () => { wake(); }, {passive:true});
  document.addEventListener('touchend', () => { wake(); }, {passive:true});
  window.RescueAudio = {play,wake,reset,setEnabled};
})();
