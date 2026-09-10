/* Original retro-synth animal voices. No soundfont, recordings or downloads. */
(function(root){
  'use strict';
  const ANIMALS=['sheep','pig','hen','cow'];
  const VOICES={
    sheep:{pitch:180,end:151,length:.58,vibrato:6.5,wobble:.055,rough:.002,formants:[570,1100]},
    hen:{pitch:575,end:360,length:.34,vibrato:12,wobble:.025,rough:.009,formants:[950,1700]},
    cow:{pitch:132,end:99,length:.78,vibrato:4,wobble:.025,rough:0,formants:[325,715]},
    bark:{pitch:190,end:118,length:.4,vibrato:18,wobble:.045,rough:.035,formants:[470,1050]},
    snarl:{pitch:116,end:90,length:.42,vibrato:20,wobble:.06,rough:.035,formants:[300,740]},
    whimper:{pitch:450,end:590,length:.4,vibrato:5,wobble:.025,rough:0,formants:[740,1400]}
  };
  // A shared finish makes repeated taps quieter and keeps overlapping calls gentle.
  // Filter before the edge fades so vowel changes and natural tails stay smooth.
  function finish(samples,kind,short,sampleRate){
    const cutoff=kind==='whoosh'?1700:2800,alpha=1-Math.exp(-2*Math.PI*cutoff/sampleRate);
    const dcAlpha=1-Math.exp(-2*Math.PI*25/sampleRate);
    let low=0,smooth=0,dc=0,energy=0,peak=0;
    const fade=Math.max(1,Math.floor(sampleRate*.018));
    for(let i=0;i<samples.length;i++){
      low+=alpha*(samples[i]-low);smooth+=alpha*(low-smooth);dc+=dcAlpha*(smooth-dc);
      const edge=Math.min(1,i/fade,(samples.length-1-i)/fade);
      const value=(smooth-dc)*edge;samples[i]=value;energy+=value*value;peak=Math.max(peak,Math.abs(value));
    }
    const rms=Math.sqrt(energy/samples.length),target=(kind==='whoosh'?.055:kind.startsWith('howl-')?.075:.085)*(short?.68:1);
    const limit=short?.18:kind==='whoosh'?.22:.28;
    const gain=Math.min(target/Math.max(rms,.000001),limit/Math.max(peak,.000001));
    for(let i=0;i<samples.length;i++)samples[i]*=gain;
    return samples;
  }
  function synthesize(kind,short=false,sampleRate=22050){
    if(kind==='howl-plaintive'||kind==='howl-deep'){
      const sad=kind==='howl-plaintive',duration=short?.85:(sad?1.82:1.92);
      const samples=new Float32Array(Math.ceil(sampleRate*duration));let phase=0;
      for(let i=0;i<samples.length;i++){
        const t=i/sampleRate,u=t/duration;
        // An open "aw" rises into a rounded "oo", then trails away.
        const rise=Math.sin(Math.min(1,u/.22)*Math.PI/2);
        const fall=Math.max(0,(u-.32)/.68);
        const pitch=(sad?220+110*rise-165*fall:98+49*rise-37*fall)*(1+(sad?.01:.007)*Math.min(1,u/.3)*Math.sin(2*Math.PI*4.5*t));
        phase+=2*Math.PI*pitch/sampleRate;
        const vowel=1-Math.min(1,u/.4),f1=300+300*vowel,f2=750+400*vowel;
        let voice=0;
        for(let h=1;h<=10&&h*pitch<sampleRate*.45;h++){
          const f=h*pitch,shape=.8*Math.exp(-(((f-f1)/180)**2))+.5*Math.exp(-(((f-f2)/260)**2));
          voice+=Math.sin(h*phase)*(.24+shape)/(h**1.3);
        }
        const envelope=Math.sin(Math.PI*u)**(sad?1.15:.75)*Math.min(1,t/.14);
        samples[i]=Math.tanh(voice*.5)*envelope;
      }
      return finish(samples,kind,short,sampleRate);
    }
    if(kind==='whoosh'){
      const duration=short?.3:2.4,samples=new Float32Array(Math.ceil(sampleRate*duration));
      let seed=319,low=0,smooth=0,rumble=0,phase=0;
      for(let i=0;i<samples.length;i++){
        const u=i/(samples.length-1),swell=Math.sin(Math.PI*u),gust=Math.sin(Math.PI*u*(short?1:3))**2;
        seed=(seed*1664525+1013904223)>>>0;
        // Two moving low-pass stages remove the crackle; a slow high-pass removes DC.
        const alpha=1-Math.exp(-2*Math.PI*(110+340*gust)/sampleRate);
        low+=alpha*(seed/4294967296*2-1-low);smooth+=alpha*(low-smooth);
        rumble+=(1-Math.exp(-2*Math.PI*35/sampleRate))*(smooth-rumble);
        // A very quiet pitched breath follows the three gusts, like an old synth wind patch.
        phase+=2*Math.PI*(170+220*gust)/sampleRate;
        const breath=Math.tanh((smooth-rumble)*1.5)+.025*Math.sin(phase+.12*Math.sin(phase*2));
        samples[i]=breath*swell**1.6*(.4+.6*gust);
      }
      return finish(samples,kind,short,sampleRate);
    }
    if(kind==='pig'){
      // A round "oh" opens into a nasal "ink": two pitched oinks, with very little noise.
      const duration=short?.24:.59,samples=new Float32Array(Math.ceil(sampleRate*duration));
      let phase=0,seed=712,noise=0;
      for(let i=0;i<samples.length;i++){
        const t=i/sampleRate,second=!short&&t>=.3,local=t-(second?.3:0),length=short?.22:.25;
        if(local>=length)continue;
        const u=local/length,glide=Math.min(1,Math.max(0,(u-.16)/.65));
        const pitch=(second?139:155)+12*Math.sin(Math.PI*u)-30*u;
        phase+=2*Math.PI*pitch/sampleRate;
        const f1=370+160*Math.sin(Math.PI*u),f2=770+650*glide;let value=0;
        for(let h=1;h<=12&&h*pitch<sampleRate*.45;h++){
          const f=h*pitch;
          const vowel=1.2*Math.exp(-(((f-f1)/180)**2))+.85*Math.exp(-(((f-f2)/260)**2));
          value+=Math.sin(phase*h)*(.18+vowel)/(h**1.15);
        }
        seed=(seed*1664525+1013904223)>>>0;noise=.65*noise+.35*(seed/4294967296*2-1);
        const envelope=Math.sin(Math.PI*u)**.75*(1-.25*u);
        const throat=.92+.08*Math.sin(2*Math.PI*25*t);
        samples[i]=Math.tanh(value*.65*throat+noise*.035*glide**4)*envelope;
      }
      return finish(samples,kind,short,sampleRate);
    }
    const v=VOICES[kind];if(!v)throw new Error('Unknown animal voice');
    const duration=v.length*(short?.55:1),samples=new Float32Array(Math.ceil(sampleRate*duration));
    let phase=0,seed=712,noise=0;
    for(let i=0;i<samples.length;i++){
      const t=i/sampleRate,u=t/duration;
      const base=v.pitch+(v.end-v.pitch)*u;
      const pitch=base*(1+v.wobble*Math.sin(2*Math.PI*v.vibrato*t));
      phase+=2*Math.PI*pitch/sampleRate;
      // Harmonics shaped into a small vocal tract rather than musical sine notes.
      let value=0;
      for(let h=1;h<=10&&h*pitch<sampleRate*.45;h++){
        const frequency=h*pitch;
        const vowel=v.formants.reduce((sum,f)=>sum+Math.exp(-(((frequency-f)/(f*.36))**2)),0);
        value+=Math.sin(phase*h)*(.24+vowel)/(h**1.15);
      }
      seed=(seed*1664525+1013904223)>>>0;
      noise=.6*noise+.4*(seed/4294967296*2-1);
      let envelope=Math.min(1,t/.022)*Math.min(1,(duration-t)/.07);
      if(kind==='hen'||kind==='bark'){
        const pulse=(u*(short?1:2))%1;
        envelope*=Math.sin(Math.PI*pulse)**.65*Math.exp(-pulse*(kind==='hen'?4.5:2.8));
      }else envelope*=Math.sin(Math.PI*u)**.6;
      if(kind==='sheep')envelope*=.78+.22*Math.sin(2*Math.PI*6.5*t);
      samples[i]=Math.tanh(value*.5+noise*v.rough)*envelope;
    }
    return finish(samples,kind,short,sampleRate);
  }
  const api={ANIMALS,synthesize};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RescueVoices=api;
})(typeof window!=='undefined'?window:globalThis);
