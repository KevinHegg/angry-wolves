(() => {
  'use strict';
  const voices=window.RescueVoices;
  const active=new Map();
  let buffers=new Map();
  let context = null, enabled = true, epoch = 0;
  function reset() {
    epoch++;active.clear();buffers.clear();
    const old = context; context = null;
    if (old && old.state !== 'closed') old.close().catch(() => {});
  }
  function wake() {
    if (!enabled) return Promise.resolve(null);
    try {
      // Web Audio defaults to the ringer/ambient route on iOS. Request the
      // media route on each real gesture; no microphone permission is needed.
      try { if (window.navigator?.audioSession) window.navigator.audioSession.type = 'playback'; } catch {}
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
  function play(kind = 'select', options = {}) {
    if (!enabled) return Promise.resolve(false);
    // Do not schedule against the old clock before Safari finishes resuming.
    const pending = wake(), ticket = epoch, started = performance.now();
    return pending.then(audio => {
      if (!audio || !enabled || ticket !== epoch || performance.now() - started > 1000) return false;
      const voice=(kind==='select'||kind==='rescue')?voices.ANIMALS[options.animal]:['bark','snarl','whimper','whoosh','howl-plaintive','howl-deep'].includes(kind)?kind:null;
      if(voice){
        const lane=kind==='snarl'||kind==='whimper'||kind.startsWith('howl-')?'wolf':kind==='whoosh'?'wind':'herd',short=kind==='select';
        const previous=active.get(lane);
        if(previous){try{
          // A new tap gently releases the previous voice instead of cutting
          // its waveform at an arbitrary point and making a click.
          const at=audio.currentTime;
          previous.gain.gain.cancelScheduledValues(at);
          previous.gain.gain.setValueAtTime(previous.gain.gain.value,at);
          previous.gain.gain.linearRampToValueAtTime(0,at+.018);
          previous.source.stop(at+.02);
        }catch{}}
        const key=voice+(short?'-short':'');
        if(!buffers.has(key)){
          const pcm=voices.synthesize(voice,short);
          const buffer=audio.createBuffer(1,pcm.length,22050);buffer.getChannelData(0).set(pcm);buffers.set(key,buffer);
        }
        const source=audio.createBufferSource(),gain=audio.createGain();
        source.buffer=buffers.get(key);source.connect(gain);gain.connect(audio.destination);
        source.onended=()=>{source.disconnect();gain.disconnect();if(active.get(lane)?.source===source)active.delete(lane);};
        active.set(lane,{source,gain});source.start(audio.currentTime+.012+(options.delay||0));return true;
      }
      const notes = kind === 'win' ? [523.25,659.25,783.99,1046.5] : kind === 'gate' ? [523.25,783.99] : [523.25];
      notes.forEach((frequency,i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain(), at = audio.currentTime + .012 + i*.09;
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(frequency,at);
        gain.gain.setValueAtTime(0,at); gain.gain.linearRampToValueAtTime(.09,at+.012); gain.gain.exponentialRampToValueAtTime(.001,at+.19);
        gain.gain.linearRampToValueAtTime(0,at+.22);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(at); oscillator.stop(at+.22);
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
      });
      return true;
    }).catch(() => false);
  }
  function setEnabled(value) { enabled = value; if (!value) { reset(); try { if(window.navigator?.audioSession) window.navigator.audioSession.type='auto'; } catch {} } }
  // Returning from a call, lock screen, or background tab gets a fresh output
  // on the next gesture instead of reusing Safari's interrupted audio graph.
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  window.addEventListener('pagehide', reset);
  document.addEventListener('pointerup', () => { wake(); }, {passive:true});
  document.addEventListener('click', () => { wake(); }, {passive:true});
  document.addEventListener('touchend', () => { wake(); }, {passive:true});
  window.RescueAudio = {play,wake,reset,setEnabled};
})();
