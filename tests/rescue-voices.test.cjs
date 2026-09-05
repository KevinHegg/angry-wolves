const test=require('node:test');
const assert=require('node:assert/strict');
const V=require('../rescue-voices');
test('all seven original animal voices are finite, non-silent, bounded and smoothly ended',()=>{
 const fingerprints=new Set();
 for(const kind of [...V.ANIMALS,'bark','snarl','whimper']){
  const voice=V.synthesize(kind),short=V.synthesize(kind,true);
  assert.ok(short.length<voice.length);assert.ok(voice.length<22050);
  let energy=0;for(const sample of voice){assert.ok(Number.isFinite(sample)&&Math.abs(sample)<.35);energy+=sample*sample;}
  assert.ok(energy/voice.length>.0001,kind+' must not be silent');
  assert.ok(Math.abs(voice[0])<.001&&Math.abs(voice.at(-1))<.001);
  fingerprints.add(voice.length+':'+voice[1000]);
 }
 assert.equal(fingerprints.size,7);
});
