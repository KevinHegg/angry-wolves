const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const R=require('../rescue-engine');
const S=require('../rescue-services');
function harness(){
 const nodes=new Map();
 class Element {
  constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};this.classList={toggle(){},add(){}};this.events={};this.isConnected=true;}
  set innerHTML(html){this.html=html;for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],new Element());this.children=[...html.matchAll(/data-cell="(\d+)" data-type="(\d+)"/g)].map(m=>{const e=new Element();e.dataset={cell:m[1],type:m[2]};return e;});}
  get innerHTML(){return this.html;}
  setAttribute(){} removeAttribute(){} addEventListener(k,fn){this.events[k]=fn;} focus(){document.activeElement=this;} showModal(){this.open=true;} close(){this.open=false;} replaceChildren(){this.children=[];} append(...els){this.children.push(...els);} remove(){for(const[k,v]of nodes)if(v===this)nodes.delete(k);}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 const document={getElementById:get,querySelector:s=>s.includes('shepherd-badge')?{value:'0'}:get(s),querySelectorAll:()=>[],body:new Element(),documentElement:new Element(),addEventListener(){},createElement:()=>new Element()};
 let entries=[],posted=[];
 const window={RescueRules:R,RescueServices:{...S,leaderboard:async()=>entries,submit:async(r,name,badge)=>{posted.push(r);entries=[{...S.payload(r,name,badge)}];return{status:'public',message:'Saved'};}},RescueAudio:{setEnabled(){},play(){}},RescueShare:{makeCard:async()=>({url:'blob:test'}),share:async()=> 'shared'},matchMedia:()=>({matches:true}),addEventListener(){},scrollTo(){},crypto:{randomUUID:()=>String(Math.random())}};
 const source=fs.readFileSync(require.resolve('../rescue.js'),'utf8').replace('  fieldEntryBoard=state.board.slice();soundLabel();render();intro();',`  window.test={get state(){return state},get result(){return finalResult},get submission(){return submission},start:()=>{ready=true;closeDialog();},commit,select,action:()=>dialogAction(),secondary:()=>dialogSecondary(),finishField,freshAdventure,showLeaderboard,showResults,postScore}; soundLabel();render();intro();`);
 vm.runInNewContext(source,{window,document,localStorage:{getItem(){return null},setItem(){}},ResizeObserver:class{observe(){}},requestAnimationFrame:()=>1,setTimeout:fn=>fn(),URL:{revokeObjectURL(){}},performance:{now:()=>1000},Math,Date});
 return{...window.test,api:window.test,nodes,get,posted};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('two complete adventures each offer score entry and replay resets all fields and submission state',async(t)=>{
 const originalRandom=Math.random;let seed=712;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);t.after(()=>{Math.random=originalRandom;});
 const h=harness(),a=h.api;a.start();let priorNonce;
 for(let run=0;run<2;run++){
  assert.equal(a.state.chapter,0);assert.equal(a.state.score,0);assert.equal(a.result,null);assert.equal(a.submission.done,false);
  for(let moves=0;!a.result&&moves<1000;moves++){
   if(h.get('story-dialog').open){const previous=a.state.board.slice(),won=a.state.status==='won';a.action();if(won)assert.deepEqual(a.state.board,previous);continue;}
   const state=a.state,goal=R.CHAPTERS[state.chapter].goal;
   const groups=R.groups(state.board).sort((x,y)=>{
    const value=g=>g.length+2*Math.min(g.length,Math.max(0,goal[state.board[g[0]]]-state.saved[state.board[g[0]]]));return value(y)-value(x);
   });
   a.select(groups[0][0]);a.commit();
  }
  assert.ok(a.result,'adventure completed');await settle();
  assert.ok(h.nodes.has('post-score'));assert.ok(h.nodes.has('leaderboard'));assert.equal(h.get('story-dialog').scrollTop,0);
  assert.notEqual(a.result.nonce,priorNonce);priorNonce=a.result.nonce;
  a.showLeaderboard();await settle();assert.ok(h.nodes.has('score-form'));h.get('score-initials').value='ABC';
  await a.postScore({preventDefault(){}});await settle();assert.equal(a.submission.done,true);assert.equal(a.result.rank,1);
  a.showResults();assert.match(h.get('result-status').textContent,/#1/);a.action();
 }
 assert.equal(h.posted.length,2);assert.equal(a.state.chapter,0);assert.equal(a.result,null);
});

test('losing offers restart or rest; rest leaves the board inert and restart begins field one',()=>{
 const h=harness(),a=h.api;a.start();a.state.chapter=2;a.state.status='lost';a.state.distance=0;
 const board=a.state.board.slice();a.finishField();
 assert.match(h.get('dialog-action').textContent,/field 1/);assert.equal(h.get('dialog-secondary').textContent,'Not now');
 a.secondary();assert.equal(h.get('story-dialog').open,false);assert.equal(a.state.status,'lost');
 a.select(30);a.commit();assert.deepEqual(a.state.board,board);assert.match(h.get('feedback').textContent,/Adventure over/);
 h.get('retry').events.click();assert.equal(a.state.chapter,0);assert.equal(a.state.status,'playing');assert.equal(a.state.score,0);
 a.state.status='lost';a.finishField();a.action();assert.equal(a.state.chapter,0);assert.equal(a.state.status,'playing');
});
