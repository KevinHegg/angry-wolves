/* Original, lightweight cartoon animal voices. No downloads or recorded samples. */
(function(root){
  'use strict';
  const ANIMALS=['sheep','pig','hen','cow'];
  const VOICES={
    sheep:{pitch:190,end:155,length:.66,vibrato:7,wobble:.12,rough:.025,formants:[650,1250]},
    pig:{pitch:115,end:82,length:.46,vibrato:24,wobble:.1,rough:.2,formants:[450,1050]},
    hen:{pitch:620,end:290,length:.38,vibrato:16,wobble:.035,rough:.045,formants:[1200,2200]},
    cow:{pitch:105,end:78,length:.85,vibrato:4,wobble:.035,rough:.012,formants:[280,650]},
    bark:{pitch:165,end:92,length:.47,vibrato:28,wobble:.12,rough:.32,formants:[600,1400]},
    snarl:{pitch:78,end:65,length:.48,vibrato:31,wobble:.17,rough:.25,formants:[380,950]},
    whimper:{pitch:560,end:820,length:.44,vibrato:8,wobble:.06,rough:.006,formants:[900,1600]}
  };
  function synthesize(kind,short=false,sampleRate=22050){
    if(kind==='whoosh'){
      const duration=short?.25:.5,samples=new Float32Array(Math.ceil(sampleRate*duration));let seed=319,noise=0;
      for(let i=0;i<samples.length;i++){const u=i/(samples.length-1);seed=(seed*1664525+1013904223)>>>0;noise=.82*noise+.18*(seed/4294967296*2-1);samples[i]=noise*Math.sin(Math.PI*u)**1.3*.55;}
      return samples;
    }
    const v=VOICES[kind];if(!v)throw new Error('Unknown animal voice');
    const duration=v.length*(short?.55:1),samples=new Float32Array(Math.ceil(sampleRate*duration));
    let phase=0,seed=712,noise=0;
    for(let i=0;i<samples.length;i++){
      const t=i/sampleRate,u=t/duration;
      const pitch=(v.pitch+(v.end-v.pitch)*u)*(1+v.wobble*Math.sin(2*Math.PI*v.vibrato*t));
      phase+=2*Math.PI*pitch/sampleRate;
      // Harmonics shaped into a small vocal tract rather than musical sine notes.
      let value=0;
      for(let h=1;h<=12;h++){
        const frequency=h*pitch;
        const vowel=v.formants.reduce((sum,f)=>sum+Math.exp(-(((frequency-f)/(f*.36))**2)),0);
        value+=Math.sin(phase*h)*(.18+vowel)/(h**.85);
      }
      seed=(seed*1664525+1013904223)>>>0;
      noise=.6*noise+.4*(seed/4294967296*2-1);
      let envelope=Math.min(1,t/.022)*Math.min(1,(duration-t)/.07);
      if(kind==='hen'||kind==='bark'||kind==='pig'){
        const pulse=(u*(short?1:2))%1;
        envelope*=Math.min(1,pulse/.07)*Math.exp(-pulse*(kind==='hen'?6:3.8));
      }else envelope*=Math.sin(Math.PI*u)**.45;
      if(kind==='sheep')envelope*=.72+.28*Math.sin(2*Math.PI*9*t);
      samples[i]=Math.tanh((value*.42+noise*v.rough*3)*1.2)*envelope*(short?.24:.34);
    }
    return samples;
  }
  const api={ANIMALS,synthesize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RescueVoices=api;
})(typeof window!=='undefined'?window:globalThis);
