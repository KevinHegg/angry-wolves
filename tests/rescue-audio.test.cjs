const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function harness(){
 const events={},instances=[];
 class Context{
   constructor(){this.state='suspended';this.sampleRate=44100;this.currentTime=7;this.destination={};this.notes=[];instances.push(this);}
   createBuffer(){return {};}
   createBufferSource(){return {connect(){},start(){}};}
   resume(){return new Promise(resolve=>{this.ready=()=>{this.state='running';resolve();};});}
   close(){this.state='closed';return Promise.resolve();}
   createOscillator(){const self=this;return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(at){self.notes.push(at);},stop(){}};}
   createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
 }
 const window={AudioContext:Context,addEventListener:(name,fn)=>{events[name]=fn;}};
 const document={hidden:false,addEventListener:(name,fn)=>{events[name]=fn;}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../rescue-audio.js'),'utf8'),{window,document,performance:{now:()=>0}});
 return {audio:window.RescueAudio,instances,events,document};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('sound waits for Safari resume and uses its running clock',async()=>{
 const h=harness();h.audio.play('gate');assert.equal(h.instances[0].notes.length,0);
 h.instances[0].currentTime=11;h.instances[0].ready();await flush();
 assert.equal(h.instances[0].notes.length,2);assert.ok(h.instances[0].notes[0]>11);
});
test('backgrounding and interrupted output are replaced on a new gesture',async()=>{
 const h=harness();h.audio.play();h.instances[0].ready();await flush();
 h.document.hidden=true;h.events.visibilitychange();assert.equal(h.instances[0].state,'closed');
 h.audio.play();assert.equal(h.instances.length,2);h.instances[1].ready();await flush();
 h.instances[1].state='interrupted';h.audio.play();assert.equal(h.instances.length,3);
});
test('mute prevents output initialization and scheduled notes',async()=>{
 const h=harness();h.audio.setEnabled(false);h.audio.play();assert.equal(h.instances.length,0);
 h.audio.setEnabled(true);h.audio.play();h.audio.setEnabled(false);h.instances[0].ready();await flush();
 assert.equal(h.instances[0].notes.length,0);
});
