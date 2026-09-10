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

test('wind has low high-frequency energy instead of static-like sharp changes',()=>{
 for(const short of [false,true]){
  const samples=V.synthesize('whoosh',short);let energy=0,changes=0;
  for(let i=1;i<samples.length;i++){energy+=samples[i]**2;changes+=(samples[i]-samples[i-1])**2;}
  assert.ok(changes/energy<.04);assert.ok(energy>0);
 }
});

test('ending howls are distinct sustained voices with smooth quiet endpoints',()=>{
 const sad=V.synthesize('howl-plaintive'),deep=V.synthesize('howl-deep');
 assert.notEqual(sad.length,deep.length);
 for(const samples of [sad,deep]){
 assert.ok(samples.length>22050*2);let energy=0;
 for(const sample of samples){assert.ok(Number.isFinite(sample)&&Math.abs(sample)<.35);energy+=sample*sample;}
 assert.ok(energy/samples.length>.0001);assert.ok(Math.abs(samples[0])<.001&&Math.abs(samples.at(-1))<.001);
 }
});
