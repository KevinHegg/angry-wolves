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
test('whoosh is finite, quiet, non-silent and fades at both ends',()=>{
 const voice=V.synthesize('whoosh');let energy=0;
 for(const x of voice){assert.ok(Number.isFinite(x)&&Math.abs(x)<.55);energy+=x*x;}
 assert.ok(energy/voice.length>.0001);assert.ok(Math.abs(voice[0])<.001&&Math.abs(voice.at(-1))<.001);
});
