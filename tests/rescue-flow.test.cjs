const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const R=require('../rescue-engine');
const S=require('../rescue-services');
const D=require('../rescue-daily');
function harness(reducedMotion=true,storage={getItem(){return null},setItem(){}},timers=null,services={},initialLandscape=false,trailGeometry=false,gameDate=Date){
 const nodes=new Map(),animations=[],sounds=[],windowEvents={};
 const clock={now:1000},orientation={matches:initialLandscape,addEventListener(name,fn){this.changed=fn;}};
 class Element {
  constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};this.classList={toggle(){},add(){}};this.events={};this.isConnected=true;}
  set innerHTML(html){this.html=html;for(const m of html.matchAll(/id="([^"]+)"/g))nodes.set(m[1],new Element());this.children=[...html.matchAll(/data-cell="(\d+)" data-type="(\d+)"/g)].map(m=>{const e=new Element();e.dataset={cell:m[1],type:m[2]};return e;});
   if(trailGeometry&&html.includes('class="trail-step '))this.children=[...html.matchAll(/<span class="trail-step ([^"]*)">/g)].map((m,i)=>{
    const e=new Element();e.dataset.trail=i;if(m[1].includes('active')){e.wolf=new Element();e.wolf.dataset.trail=i;}return e;
   });
  }
  get innerHTML(){return this.html;}
  querySelector(selector){return selector==='svg'?this.wolf:null;}
  querySelectorAll(){return [];}
  getBoundingClientRect(){if(this.dataset.trail!==undefined)return{left:this.dataset.trail*30,top:0};const i=Number(this.dataset.cell)||0;return{left:(i%6)*50,top:Math.floor(i/6)*50};}
  animate(frames,options){animations.push({cell:this,frames,options});}
  setAttribute(){} removeAttribute(){} addEventListener(k,fn){this.events[k]=fn;} focus(){document.activeElement=this;} showModal(){this.open=true;} close(){this.open=false;} replaceChildren(){this.children=[];} append(...els){this.children.push(...els);} remove(){for(const[k,v]of nodes)if(v===this)nodes.delete(k);}
 }
 const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
 const badgeInput={value:'0'};
 const document={getElementById:get,querySelector:s=>s.includes('shepherd-badge')?badgeInput:get(s),querySelectorAll:()=>[],body:new Element(),documentElement:new Element(),addEventListener(){},createElement:()=>new Element()};
 let entries=[],posted=[];
 const window={RescueDaily:D,RescueRules:R,RescueServices:{...S,board:async(view,date)=>({entries,yesterday:null,today:D.dayKey(),date:date||D.dayKey()}),leaderboard:async()=>entries,submit:async(r,name,badge)=>{posted.push(S.payload(r,name,badge));entries=[{...S.payload(r,name,badge)}];return{status:'public',message:'Saved'};},...services},RescueAudio:{setEnabled(){},play(kind){sounds.push(kind);}},RescueShare:{makeCard:async()=>({url:'blob:test'}),share:async()=> 'shared'},matchMedia:query=>query.includes('orientation:')?orientation:{matches:query.includes('prefers-reduced-motion')?reducedMotion:false},addEventListener(name,fn){windowEvents[name]=fn;},scrollTo(){},crypto:{randomUUID:()=>String(Math.random())}};
 const source=fs.readFileSync(require.resolve('../rescue.js'),'utf8').replace('  fieldEntryBoard=state.board.slice();soundLabel();render();intro();',`  window.test={get state(){return state},get result(){return finalResult},get submission(){return submission},start:()=>{ready=true;closeDialog();},commit,select,action:()=>dialogAction(),secondary:()=>dialogSecondary(),finishField,freshAdventure,showLeaderboard,showResults,postScore,beginDaily,beginFree,resumeDaily,saveDaily,intro,get challengeDate(){return challengeDate},get randoms(){return randoms},setBoard:view=>{boardView=view;return loadLeaderboard()}}; soundLabel();render();intro();`);
 vm.runInNewContext(source,{window,document,localStorage:storage,ResizeObserver:class{observe(){}},requestAnimationFrame:()=>1,setTimeout:(fn,delay)=>{if(!timers)return fn();const timer={fn,delay};timers.push(timer);return timer;},clearTimeout:timer=>{if(timer)timer.cancelled=true;},URL:{revokeObjectURL(){}},performance:{now:()=>clock.now},Math,Date:gameDate});
 return{...window.test,api:window.test,nodes,get,posted,animations,sounds,badgeInput,clock,document,windowEvents,rotate:landscape=>{orientation.matches=landscape;orientation.changed();}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('phone rotation preserves a selected herd, animal tiles, wolf, Pip and wind state',()=>{
 const h=harness(),a=h.api;a.start();
 a.state.board[30]=a.state.board[31]=a.state.board[32]=0;
 a.state.board[8]=R.DUST;a.state.cats={8:2};a.state.windWait=3;a.state.bark=2;a.state.distance=7;
 a.select(30);
 const before=JSON.stringify(a.state),label=h.get('whistle-label').textContent,feedback=h.get('feedback').textContent;
 h.rotate(true);
 assert.equal(h.get('landscape-info').hidden,false);assert.equal(h.get('.rescue-app').inert,true);
 a.select(8);a.commit();h.get('bark').events.click();h.get('retry').events.click();
 assert.equal(JSON.stringify(a.state),before);
 h.rotate(false);
 assert.equal(h.get('landscape-info').hidden,true);assert.equal(h.get('.rescue-app').inert,false);
 assert.equal(JSON.stringify(a.state),before);assert.equal(h.get('whistle-label').textContent,label);assert.equal(h.get('feedback').textContent,feedback);
 assert.equal(h.get('whistle').disabled,false);
 a.commit();assert.equal(a.state.moves,1,'the same selected herd can still be whistled');
});
test('a field popup is hidden during rotation and restored without rerendering or losing its action',()=>{
 const h=harness(),a=h.api;a.start();a.state.status='won';a.finishField();
 const dialog=h.get('story-dialog'),details=h.get('dialog-details'),action=h.get('dialog-action'),html=details.innerHTML;
 dialog.querySelectorAll=()=>[details];details.scrollTop=140;details.scrollLeft=0;action.focus();
 for(let i=0;i<3;i++){
  h.rotate(true);assert.equal(dialog.open,false);assert.equal(a.state.chapter,0);
  dialog.events.cancel?.({preventDefault(){}});
  action.events.click({detail:0});assert.equal(a.state.chapter,0);
  details.scrollTop=0;h.rotate(false);
  assert.equal(dialog.open,true);assert.equal(h.get('dialog-details'),details);assert.equal(details.innerHTML,html);
  assert.equal(details.scrollTop,140);assert.equal(h.document.activeElement,action);
 }
 action.events.click({detail:0});assert.equal(a.state.chapter,1);
});
test('loading or opening a popup in landscape waits for portrait',()=>{
 const h=harness(true,undefined,null,{},true),a=h.api;
 assert.equal(h.get('landscape-info').hidden,false);assert.ok(!h.get('story-dialog').open);
 assert.equal(h.document.activeElement,h.get('landscape-info'));
 h.rotate(false);assert.equal(h.get('story-dialog').open,true);assert.match(h.get('dialog-title').textContent,/gate was left open/);
 a.action();h.rotate(true);a.state.status='lost';a.finishField();
 assert.equal(h.get('story-dialog').open,false);assert.equal(h.document.activeElement,h.get('landscape-info'));
 h.rotate(false);assert.equal(h.get('story-dialog').open,true);assert.match(h.get('dialog-title').textContent,/wolf caught up/);
});
test('rotation pauses a pending rescue and resumes its remaining delay once',()=>{
 const timers=[],h=harness(false,undefined,timers),a=h.api;a.start();
 a.state.board[30]=a.state.board[31]=a.state.board[32]=0;a.select(30);a.commit();
 const before=JSON.stringify(a.state),rescue=timers.find(t=>t.delay===230);
 h.clock.now+=80;h.rotate(true);assert.equal(rescue.cancelled,true);assert.equal(JSON.stringify(a.state),before);
 h.clock.now+=10000;h.rotate(false);
 const resumed=timers.at(-1);assert.equal(resumed.delay,150);h.clock.now+=50;h.rotate(true);assert.equal(resumed.cancelled,true);
 h.clock.now+=10000;h.rotate(false);assert.equal(timers.at(-1).delay,100);
 timers.at(-1).fn();assert.equal(a.state.moves,1);
});
test('ending animation and result delay wait together through landscape',()=>{
 const timers=[],h=harness(false,undefined,timers),a=h.api;a.start();
 a.state.chapter=2;a.state.distance=1;a.state.moves=26;
 a.state.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%4);a.state.board[30]=a.state.board[31]=a.state.board[32]=0;
 a.select(30);a.commit();timers.find(t=>t.delay===230).fn();timers.find(t=>t.delay===0).fn();
 const ending=timers.find(t=>t.delay===2000),animation={playState:'running',pause(){this.playState='paused';},play(){this.playState='running';}};
 h.document.getAnimations=()=>[animation];h.clock.now+=600;h.rotate(true);
 assert.equal(animation.playState,'paused');assert.equal(ending.cancelled,true);assert.equal(h.get('story-dialog').open,false);
 h.clock.now+=10000;h.rotate(false);
 assert.equal(animation.playState,'running');assert.equal(timers.at(-1).delay,1400);assert.equal(h.get('story-dialog').open,false);
 timers.at(-1).fn();assert.equal(h.get('story-dialog').open,true);assert.equal(h.sounds.filter(s=>s==='howl-deep').length,1);
});
test('the leaderboard player draft survives a phone rotation',async()=>{
 const h=harness(),a=h.api;a.start();a.state.chapter=2;a.state.status='won';a.state.score=5000;a.finishField();a.showLeaderboard();await settle();
 const initials=h.get('score-initials'),fields=h.get('player-fields');initials.value='FAM';h.badgeInput.value='4';
 const before=JSON.stringify(a.result);h.rotate(true);h.rotate(false);
 assert.equal(h.get('score-initials'),initials);assert.equal(initials.value,'FAM');assert.equal(h.badgeInput.value,'4');
 assert.equal(h.get('player-fields'),fields);assert.equal(JSON.stringify(a.result),before);assert.equal(h.get('story-dialog').open,true);
});
test('two complete adventures each offer score entry and replay resets all fields and submission state',async(t)=>{
 const originalRandom=Math.random;let seed=712;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);t.after(()=>{Math.random=originalRandom;});
 const h=harness(),a=h.api;a.start();let priorNonce;
 for(let run=0;run<2;run++){
  assert.equal(a.state.chapter,0);assert.equal(a.state.score,0);assert.equal(a.result,null);assert.equal(a.submission.done,false);
  for(let moves=0;!a.result&&moves<1000;moves++){
   if(h.get('story-dialog').open){const previous=a.state.board.slice(),won=a.state.status==='won';a.action();if(won)assert.deepEqual(a.state.board,previous);continue;}
   const state=a.state,goal=R.CHAPTERS[state.chapter].goal;
   // Controlled legal herds keep this a flow test, independent of survival difficulty.
   const needed=goal.findIndex((n,type)=>state.saved[type]<n);
   state.board.fill(needed);state.cats={};
   const groups=R.groups(state.board).sort((x,y)=>{
    const value=g=>g.length+2*Math.min(g.length,Math.max(0,goal[state.board[g[0]]]-state.saved[state.board[g[0]]]));return value(y)-value(x);
   });
   a.select(groups[0][0]);a.commit();
  }
  assert.ok(a.result,'adventure completed');await settle();
  assert.ok(h.nodes.has('post-score'));assert.ok(h.nodes.has('leaderboard'));assert.equal(h.get('story-dialog').scrollTop,0);
  assert.notEqual(a.result.nonce,priorNonce);priorNonce=a.result.nonce;
  a.showLeaderboard();await settle();assert.ok(h.nodes.has('score-form'));assert.equal(h.get('submit-score').hidden,false);h.get('score-initials').value='ABC';
  await a.postScore({preventDefault(){}});await settle();assert.equal(a.submission.done,true);assert.equal(h.get('submit-score').hidden,true);assert.equal(a.result.rank,1);
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

test('field transitions preserve the final wolf distance and fresh games reset it',()=>{
 for(const distance of [0,1,4,8,10]){
  const h=harness(),a=h.api;a.start();a.state.distance=distance;a.state.status='won';a.finishField();a.action();
  assert.equal(a.state.chapter,1);assert.equal(a.state.distance,distance);
  a.state.status='won';a.finishField();a.action();assert.equal(a.state.chapter,2);assert.equal(a.state.distance,distance);
  a.freshAdventure();assert.equal(a.state.distance,R.CHAPTERS[0].distance);
 }
});
test('wind visit wait survives field transition',()=>{
 const h=harness(),a=h.api;a.start();a.state.windWait=1;a.state.status='won';a.finishField();a.action();assert.equal(a.state.windWait,1);
});

test('scatter animates whole animal tiles and returns them to their grid positions',()=>{
 const h=harness(false),a=h.api;a.start();
 a.state.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%3);
 a.state.board[14]=R.DUST;a.state.cats={14:1};a.state.distance=10;
 a.state.board[30]=a.state.board[31]=a.state.board[32]=0;
 a.select(30);a.commit();
 assert.equal(h.animations.length,8);
 for(const animation of h.animations){
  assert.ok(animation.cell.dataset.cell!==undefined,'animate tile button, not its SVG');
  assert.equal(animation.frames.at(-1).transform,'translate(0px,0px)');
  assert.ok(animation.frames.some(f=>f.transform!=='translate(0px,0px)'));
 }
});

test('Pip indicator starts open, fills when spent and resets for a new adventure',()=>{
 const h=harness(),a=h.api;a.start();
 assert.doesNotMatch(h.get('bark').innerHTML,/class="filled"/);
 h.get('bark').events.click();
 assert.equal(a.state.bark,2);assert.match(h.get('bark').innerHTML,/class="filled"/);
 a.freshAdventure();assert.equal(a.state.bark,3);
 assert.doesNotMatch(h.get('bark').innerHTML,/class="filled"/);
});

test('Restart game immediately abandons an unfinished field and resets the adventure',()=>{
 const h=harness(),a=h.api;a.start();a.state.status='won';a.finishField();a.action();
 a.state.score=500;a.state.saved=[2,4,5,6];a.state.distance=1;a.state.moves=9;a.state.bark=0;
 a.state.board[3]=R.DUST;a.state.cats={3:1};
 h.get('retry').events.click();
 assert.equal(a.state.chapter,0);assert.equal(a.state.status,'playing');assert.equal(a.state.score,0);
 assert.equal(a.state.distance,5);assert.equal(a.state.moves,0);assert.equal(a.state.bark,3);
 assert.deepEqual(a.state.saved,[0,0,0,0]);assert.deepEqual(a.state.cats,{});
 assert.equal(a.result,null);assert.equal(h.get('story-dialog').open,false);
 assert.equal(h.get('retry').textContent,'Restart game');
});
test('daily play labels restart as Give up and returns to the game chooser without restarting',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const h=harness(true,storage),a=h.api;a.beginDaily();
 const board=a.state.board.slice();a.saveDaily();
 assert.equal(h.get('retry').textContent,'Give up');assert.equal(values.has('hw-daily-adventure'),true);
 h.get('retry').events.click();
 assert.deepEqual(a.state.board,board);assert.equal(a.challengeDate,'');assert.equal(values.has('hw-daily-adventure'),false);
 assert.equal(h.get('story-dialog').open,true);assert.equal(h.get('dialog-title').textContent,'The gate was left open.');
 a.secondary();assert.equal(a.challengeDate,'');assert.equal(h.get('retry').textContent,'Restart game');
});
test('version label belongs only to the opening dialog',()=>{
 const h=harness(),a=h.api;assert.equal(h.get('load-version').hidden,false);
 a.start();a.state.status='won';a.finishField();assert.equal(h.get('load-version').hidden,true);
 a.showLeaderboard();assert.equal(h.get('load-version').hidden,true);
});

test('three Pip charges can be spent in one field and never refill at field boundaries',()=>{
 const h=harness(),a=h.api;a.start();
 assert.equal((h.get('bark').innerHTML.match(/<i class=/g)||[]).length,3);
 h.get('bark').events.click();h.get('bark').events.click();assert.equal(a.state.bark,1);
 a.state.status='won';a.finishField();a.action();assert.equal(a.state.bark,1);
 h.get('bark').events.click();assert.equal(a.state.bark,0);assert.equal(h.get('bark').disabled,true);
 assert.equal((h.get('bark').innerHTML.match(/class="filled"/g)||[]).length,3);
 const before=structuredClone(a.state);h.get('bark').events.click();assert.deepEqual(a.state,before);
 a.state.status='won';a.finishField();a.action();assert.equal(a.state.bark,0);
 a.state.status='won';a.finishField();assert.equal(a.result.rested,1);assert.equal(a.result.bonus,0);
 a.freshAdventure();assert.equal(a.state.bark,3);
});

test('changed initials and badge post correctly, persist across reload, and post again',async()=>{
 const values=new Map([['aw-rescue-initials','OLD'],['aw-rescue-badge','0']]);
 const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 for(let run=0;run<2;run++){
  const h=harness(true,storage),a=h.api;a.start();a.state.chapter=2;a.state.status='won';a.state.score=5000;a.finishField();
  a.showLeaderboard();await settle();h.get('player-fields').disabled=true;
  if(run===0){
   h.get('toggle-player-lock').onclick();assert.equal(h.get('player-fields').disabled,false);
   const input=h.get('score-initials');input.value='new';input.events.input({target:input});
   h.badgeInput.value='14';h.get('score-form').events.change({target:{name:'shepherd-badge',value:'14'}});
   h.get('toggle-player-lock').onclick();assert.equal(h.get('player-fields').disabled,true);
  }else{assert.equal(h.get('score-initials').value,'NEW');assert.equal(S.readProfile(storage).badge,14);h.badgeInput.value='14';}
  await a.postScore({preventDefault(){}});await settle();assert.equal(h.posted[0].playerName,S.encodeName('NEW',14));
  assert.equal(a.submission.done,true);assert.equal(a.result.playerLabel,'NEW 🐮');
 }
});

 test('letter selectors wrap without a keyboard and save the chosen player',async()=>{
 const values=new Map(),h=harness(true,{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),a=h.api;
 a.start();a.state.chapter=2;a.state.status='won';a.finishField();a.showLeaderboard();await settle();
 assert.equal(h.get('toggle-player-lock').textContent,'Save player');
 const turn=(index,step)=>h.get('score-form').events.click({target:{closest:()=>({dataset:{letter:String(index),step:String(step)}})}});
 turn(0,-1);turn(1,1);turn(2,1);assert.equal(h.get('score-initials').value,'ZBB');
 h.badgeInput.value='14';h.get('toggle-player-lock').onclick();
 assert.equal(values.get('aw-rescue-initials'),'ZBB');assert.equal(values.get('aw-rescue-badge'),'14');
 assert.equal(h.get('player-fields').disabled,true);assert.match(h.get('submit-status').textContent,/Player saved/);
 });
 test('ending on a wind trigger skips scatter and plays the appropriate howl',()=>{
 for(const won of [false,true]){
 const h=harness(false),a=h.api;a.start();a.state.chapter=2;
 a.state.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%4);
 a.state.board[14]=R.DUST;a.state.cats={14:1};a.state.distance=won?5:1;if(!won)a.state.moves=26;
 a.state.board[30]=a.state.board[31]=a.state.board[32]=0;
 if(won)a.state.saved=[13,14,14,14];
 a.select(30);a.commit();assert.equal(a.state.status,won?'won':'lost');
 assert.equal(h.animations.length,0);assert.ok(!h.sounds.includes('whoosh'));
 assert.ok(h.sounds.includes(won?'howl-plaintive':'howl-deep'));
 }
 });
 test('field summary shows shared Pip usage and no barks left',()=>{
 for(const left of [0,1,2,3]){const h=harness(),a=h.api;a.start();a.state.bark=left;a.state.status='won';a.finishField();
 assert.ok(h.get('dialog-details').innerHTML.includes(`${3-left} of 3`));
 assert.doesNotMatch(h.get('dialog-details').innerHTML,/fields Pip rested/);
 if(!left)assert.match(h.get('dialog-details').innerHTML,/no barks left/);
 }
 });

test('ending pauses, calls once before the dialog, and restart cancels the pending ending',()=>{
 for(const restart of [false,true]){
 const timers=[],h=harness(false,undefined,timers),a=h.api;a.start();a.state.chapter=2;a.state.distance=1;a.state.moves=26;
 a.state.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%4);a.state.board[30]=a.state.board[31]=a.state.board[32]=0;
 a.select(30);a.commit();timers.find(t=>t.delay===230).fn();
 assert.equal(a.state.status,'lost');assert.equal(h.get('story-dialog').open,false);
 assert.equal(timers.some(t=>t.delay===2000),false,'panel timer starts only with the ending animation');
 if(restart)a.freshAdventure();
 timers.find(t=>t.delay===0).fn();
 assert.equal(h.get('story-dialog').open,false);
 assert.equal(h.sounds.filter(s=>s==='howl-deep').length,restart?0:1);
 timers.find(t=>t.delay===2000)?.fn();
 assert.equal(h.get('story-dialog').open,!restart);
 assert.equal(h.sounds.filter(s=>s==='howl-deep').length,restart?0:1);
 }
});

test('opening action and restart leave no herd selected',()=>{
 const h=harness(),a=h.api;a.state.board.fill(0);a.action();
 assert.equal(h.get('whistle').disabled,true);
 assert.ok(!h.sounds.includes('select'));
 const before=a.state.score;a.commit();assert.equal(a.state.score,before);
 a.select(R.groups(a.state.board)[0][0]);assert.equal(h.get('whistle').disabled,false);
 h.get('retry').events.click();assert.equal(h.get('whistle').disabled,true);
});

test('legacy partial player names remain editable with three letter selectors',async()=>{
 const values=new Map([['aw-rescue-initials','AB']]);const h=harness(true,{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}),a=h.api;
 a.start();a.state.chapter=2;a.state.status='won';a.finishField();a.showLeaderboard();await settle();
 assert.equal(h.get('score-initials').value,'ABA');assert.equal(h.get('player-fields').disabled,false);
 h.get('score-form').events.click({target:{closest:()=>({dataset:{letter:'2',step:'1'}})}});
 assert.equal(h.get('score-initials').value,'ABB');h.get('toggle-player-lock').onclick();assert.equal(values.get('aw-rescue-initials'),'ABB');
});
test('posting locks identity and displays a late error on the results screen',async()=>{
 let rejectPost;const h=harness(true,undefined,null,{submit:()=>new Promise((_,reject)=>{rejectPost=reject})}),a=h.api;
 a.start();a.state.chapter=2;a.state.status='won';a.state.score=5000;a.finishField();a.showLeaderboard();await settle();
 const pending=a.postScore({preventDefault(){}});await settle();
 assert.equal(h.get('player-fields').disabled,true);assert.equal(h.get('toggle-player-lock').disabled,true);
 a.showResults();rejectPost(Error('Connection lost. Try again.'));await pending;
 assert.match(h.get('result-status').textContent,/Connection lost/);assert.equal(a.submission.pending,false);
 a.showLeaderboard();await settle();assert.equal(h.get('toggle-player-lock').disabled,false);
});
test('an older leaderboard response cannot overwrite a newer refresh',async()=>{
 const reads=[];const h=harness(true,undefined,null,{leaderboard:()=>new Promise(resolve=>reads.push(resolve))}),a=h.api;
 a.start();a.showLeaderboard();h.get('refresh-scores').events.click();
 reads[1]([{gameMode:S.MODE,playerName:'NEW0',score:5000}]);await settle();
 reads[0]([{gameMode:S.MODE,playerName:'OLD0',score:1000}]);await settle();
 assert.equal(h.get('leaderboard-list').children[0].children[1].textContent,'NEW 🐕');
});
test('a failed first submission restores the editable player and a new dialog starts at the top',async()=>{
 const h=harness(true,undefined,null,{submit:async()=>{throw Error('Offline')}}),a=h.api;
 a.start();a.state.chapter=2;a.state.status='won';a.finishField();a.showLeaderboard();await settle();
 await a.postScore({preventDefault(){}});
 assert.equal(h.get('player-fields').disabled,false);assert.equal(h.get('toggle-player-lock').textContent,'Save player');
 h.get('dialog-details').scrollTop=500;a.showResults();assert.equal(h.get('dialog-details').scrollTop,0);
});
test('wolf movement previews and Pip feedback respect the track endpoints',()=>{
 const h=harness(),a=h.api;a.start();a.state.board.fill(0);a.state.distance=10;a.select(0);
 assert.match(h.get('feedback').textContent,/stays put/);
 h.get('bark').events.click();assert.match(h.get('feedback').textContent,/already at the woods/);
 a.state.distance=9;h.get('bark').events.click();assert.match(h.get('feedback').textContent,/back 1 step\./);
});
test('field-completion delay prevents opening another dialog in mid-transition',()=>{
 const timers=[],h=harness(false,undefined,timers),a=h.api;a.start();a.state.saved=[13,0,0,0];a.state.board.fill(0);
 a.select(0);a.commit();timers.find(t=>t.delay===230).fn();a.showLeaderboard();
 assert.equal(h.get('story-dialog').open,false);timers.find(t=>t.delay===900).fn();assert.equal(h.get('story-dialog').open,true);
});

test('zero barks earns 1000 only at victory; any number of barks removes the bonus',()=>{
 for(const barks of [0,1,2,3]){
  const h=harness(),a=h.api;a.start();
  for(let i=0;i<barks;i++)h.get('bark').events.click();
  assert.equal(h.get('pip-rest-hint').textContent,barks?'Pip bonus: 0':'No-Pip bonus: +1,000');
  for(let chapter=0;chapter<2;chapter++){
   a.state.status='won';a.finishField();assert.equal(a.result,null);a.action();
   assert.equal(a.state.bark,3-barks);
  }
  a.state.score=500;a.state.status='won';a.finishField();
  assert.equal(a.result.bonus,barks?0:1000);assert.equal(a.result.score,barks?500:1500);
  assert.match(h.get('dialog-details').innerHTML,barks?/Pip helped/:/1,000 no-Pip bonus/);
  a.freshAdventure();assert.equal(h.get('pip-rest-hint').textContent,'No-Pip bonus: +1,000');
  a.state.status='lost';a.finishField();assert.equal(a.result,null);
 }
});
test('a losing two-step move passes the one-away mark before the howl and result pause',()=>{
 for(const restart of [false,true]){
  const timers=[],h=harness(false,undefined,timers,{},false,true),a=h.api;a.start();
  a.state.chapter=2;a.state.distance=2;a.state.moves=17;
  a.state.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%4);
  a.state.board[30]=a.state.board[31]=a.state.board[32]=0;a.state.board[24]=a.state.board[33]=1;
  assert.equal(R.group(a.state.board,30).length,3);a.select(30);a.commit();
  timers.find(t=>t.delay===230).fn();assert.equal(a.state.distance,0);assert.equal(a.state.status,'lost');
  const movement=h.animations.find(x=>x.cell.dataset.trail===0);
  assert.deepEqual(Array.from(movement.frames,x=>x.transform),['translateX(60px)','translateX(30px)','translateX(30px)','translateX(0px)','translateX(0px)']);
  assert.equal(movement.options.duration,600);assert.equal(h.sounds.includes('howl-deep'),false);
  assert.equal(h.get('story-dialog').open,false);assert.equal(timers.some(t=>t.delay===2000),false);
  if(restart)a.freshAdventure();
  timers.find(t=>t.delay===600).fn();assert.equal(h.sounds.includes('howl-deep'),!restart);
  assert.equal(h.get('story-dialog').open,false);
  timers.find(t=>t.delay===2000)?.fn();assert.equal(h.get('story-dialog').open,!restart);
 }
});

test('daily play repeats its opening without selection and free play keeps the original mode',()=>{
 const h=harness(),a=h.api;a.beginDaily();const first=JSON.stringify(a.state);assert.equal(a.challengeDate,D.dayKey());
 a.select(R.groups(a.state.board)[0][0]);a.commit();a.freshAdventure();assert.equal(JSON.stringify(a.state),first);assert.equal(h.get('whistle').disabled,true);
 a.beginFree();assert.equal(a.challengeDate,'');assert.equal(a.state.chapter,0);
});
test('daily save restores board, wolf, Pip and exact future draws through a reload',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const h=harness(true,storage),a=h.api;a.beginDaily();a.select(R.groups(a.state.board)[0][0]);a.commit();h.get('bark').events.click();
 const expected=JSON.stringify(a.state),streamState=a.randoms.snapshot();
 const next=harness(true,storage).api;next.resumeDaily();assert.equal(JSON.stringify(next.state),expected);assert.deepEqual(next.randoms.snapshot(),streamState);
 const g=R.groups(a.state.board)[0][0];a.select(g);a.commit();next.select(g);next.commit();assert.equal(JSON.stringify(next.state),JSON.stringify(a.state));
});
test('an adventure keeps its day across midnight and a new adventure uses the new day',()=>{
 let time=Date.parse('2026-09-15T03:59:00Z');class Clock extends Date{static now(){return time;}}
 const h=harness(true,undefined,null,{},false,false,Clock),a=h.api;a.beginDaily();assert.equal(a.challengeDate,'2026-09-14');
 const carried=a.state.board.slice();time=Date.parse('2026-09-15T04:01:00Z');a.state.status='won';a.finishField();a.action();
 assert.equal(a.challengeDate,'2026-09-14');assert.deepEqual(a.state.board,carried);assert.equal(a.state.chapter,1);
 a.freshAdventure();assert.equal(a.challengeDate,'2026-09-15');assert.equal(a.state.chapter,0);
});
test('daily scores below the daily top 20 can still be posted for weekly totals',async()=>{
 const h=harness(true,undefined,null,{board:async()=>({entries:Array.from({length:20},()=>({score:9000,playerName:'AAA0',gameMode:D.MODE}))})}),a=h.api;
 a.beginDaily();a.state.chapter=2;a.state.score=10;a.state.status='won';a.finishField();a.showLeaderboard('daily');await settle();
 assert.equal(h.get('submit-score').disabled,false);h.get('score-initials').value='NEW';await a.postScore({preventDefault(){}});assert.equal(h.posted.length,1);assert.equal(h.posted[0].gameMode,D.MODE);assert.equal(h.posted[0].challengeDate,a.challengeDate);
});
test('changing leaderboard periods cannot let a slow previous response overwrite the new view',async()=>{
 let resolveDaily;const h=harness(true,undefined,null,{board:(view)=>view==='daily'?new Promise(r=>resolveDaily=r):Promise.resolve({entries:[{playerName:'WIN0',score:8000,gameMode:D.MODE,daysPlayed:3}]})}),a=h.api;
 a.start();a.showLeaderboard('daily');await settle();await a.setBoard('weekly');assert.equal(h.get('leaderboard-list').children[0].children[1].textContent,'WIN 🐕');
 resolveDaily({entries:[{playerName:'OLD0',score:1000,gameMode:D.MODE}]});await settle();assert.equal(h.get('leaderboard-list').children[0].children[1].textContent,'WIN 🐕');
});

test('a new day offers today’s puzzle while retaining access to yesterday’s saved adventure',()=>{
 let time=Date.parse('2026-09-15T03:59:00Z');class Clock extends Date{static now(){return time;}}
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},h=harness(true,storage,null,{},false,false,Clock),a=h.api;
 a.beginDaily();time=Date.parse('2026-09-15T04:01:00Z');a.intro();assert.equal(h.get('dialog-action').textContent,'Play today’s challenge');assert.match(h.get('dialog-details').innerHTML,/Continue daily adventure · Sep 14/);
 a.action();assert.equal(a.challengeDate,'2026-09-15');
});
test('corrupt daily saves do not prevent starting a new game',()=>{
 const h=harness(true,{getItem:k=>k==='hw-daily-adventure'?'{"ruleset":"daily-1","challengeDate":"2026-09-14","state":{}}':null,setItem(){}}),a=h.api;
 assert.equal(h.get('dialog-action').textContent,'Play today’s challenge');assert.doesNotThrow(()=>a.beginDaily());
});

test('a daily win starts free play next and keeps its result and completion through reloads',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const h=harness(true,storage),a=h.api;a.beginDaily();a.state.chapter=2;a.state.status='won';a.state.score=2500;
 a.state.board[8]=R.DUST;a.state.cats={8:2};a.finishField();const nonce=a.result.nonce;
 assert.match(h.get('dialog-action').textContent,/Play free/);a.action();
 assert.equal(a.challengeDate,'');assert.equal(h.get('retry').textContent,'Restart game');assert.equal(a.state.chapter,0);
 const next=harness(true,storage),b=next.api;
 assert.match(next.get('dialog-details').innerHTML,/Completed today · best 3,500 points/);
 assert.equal(next.get('dialog-action').textContent,'Free play · a fresh random board');assert.match(next.get('dialog-secondary').textContent,/View daily adventure/);
 b.secondary();assert.equal(b.result.nonce,nonce);assert.equal(b.state.board[8],R.DUST);assert.equal(b.submission.done,false);
 b.showLeaderboard('daily');await settle();next.get('score-initials').value='NEW';await b.postScore({preventDefault(){}});
 const posted=harness(true,storage);posted.api.secondary();assert.equal(posted.api.submission.done,true);assert.equal(posted.api.result.nonce,nonce);
});
test('completed v2.40 daily saves migrate with or without a finished result panel',()=>{
 for(const endingPending of [false,true]){
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const a=harness(true,storage).api;a.beginDaily();a.state.chapter=2;a.state.status='won';a.state.score=2200;
  if(endingPending)a.saveDaily();else a.finishField();values.delete('hw-daily-completed');
  const next=harness(true,storage);
  assert.match(next.get('dialog-details').innerHTML,/Completed today · best 3,200 points/);
  assert.match(next.get('dialog-action').textContent,/Free play/);next.api.secondary();assert.equal(next.api.result.score,3200);
 }
});
test('daily replay is deliberate and giving up a replay does not erase today’s win',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const h=harness(true,storage),a=h.api;a.beginDaily();const opening=JSON.stringify(a.state.board);
 a.state.chapter=2;a.state.status='won';a.state.score=1800;a.finishField();a.secondary();
 assert.match(h.get('dialog-details').innerHTML,/Replay today’s challenge/);h.get('start-daily-new').events.click();
 assert.equal(a.challengeDate,D.dayKey());assert.equal(JSON.stringify(a.state.board),opening);assert.equal(a.result,null);
 h.get('retry').events.click();assert.equal(values.has('hw-daily-adventure'),false);
 const next=harness(true,storage);assert.match(next.get('dialog-details').innerHTML,/Completed today · best 2,800 points/);
 assert.match(next.get('dialog-action').textContent,/Free play/);next.api.action();assert.equal(next.api.challengeDate,'');
});
test('daily completion applies only to its Eastern date and a lower replay cannot lower the best',()=>{
 let time=Date.parse('2026-09-15T03:59:00Z');class Clock extends Date{static now(){return time;}}
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const h=harness(true,storage,null,{},false,false,Clock),a=h.api;
 for(const score of [3000,2000]){a.beginDaily();a.state.chapter=2;a.state.status='won';a.state.score=score;a.finishField();}
 a.intro();assert.match(h.get('dialog-details').innerHTML,/best 4,000 points/);
 time=Date.parse('2026-09-15T04:01:00Z');a.intro();assert.doesNotMatch(h.get('dialog-details').innerHTML,/Completed today/);
 assert.equal(h.get('dialog-action').textContent,'Play today’s challenge');assert.match(h.get('dialog-details').innerHTML,/View daily adventure · Sep 14/);
 a.action();assert.equal(a.challengeDate,'2026-09-15');assert.equal(a.state.chapter,0);
});
test('blocked browser storage still remembers a daily win for the current session',()=>{
 const h=harness(true,{getItem(){throw Error('Storage blocked');},setItem(){throw Error('Storage blocked');}}),a=h.api;
 a.beginDaily();a.state.chapter=2;a.state.status='won';a.finishField();a.action();a.intro();
 assert.match(h.get('dialog-details').innerHTML,/Completed today/);assert.match(h.get('dialog-action').textContent,/Free play/);
});
test('whistle 18 and 26 warnings arrive before the move and preview the correct movement',()=>{
 for(const next of [17,18,25,26]){
  const h=harness(),a=h.api;a.start();a.state.chapter=2;a.state.moves=next-2;a.state.distance=10;a.state.windWait=99;
  const resetHerd=()=>{a.state.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%4);a.state.board[30]=a.state.board[31]=a.state.board[32]=0;a.state.board[24]=a.state.board[33]=1;};
  resetHerd();a.select(30);a.commit();
  assert.equal(a.state.moves,next-1);
  assert.equal(h.get('wolf-effect').textContent,`Next whistle ${next} · 3–4: ${1+R.pressure(next)} closer`);
  if(next===18)assert.match(h.get('feedback').textContent,/From whistle 18: 3–4 animals move the wolf 2 steps closer; 5–6, 1 closer; 7\+, stay put/);
  if(next===26)assert.match(h.get('feedback').textContent,/From whistle 26: 3–4 animals move the wolf 3 steps closer; 5–6, 2 closer; 7\+, 1 closer/);
  resetHerd();a.select(30);assert.match(h.get('feedback').textContent,new RegExp(`Whistle ${next}:.*The wolf moves ${1+R.pressure(next)} steps? closer`));
  const before=a.state.distance;a.commit();assert.equal(before-a.state.distance,1+R.pressure(next));
 }
});
test('medium and large herds preview their distinct whistle-18 effects and a new field resets pressure',()=>{
 for(const count of [4,5,6,7]){
  const h=harness(),a=h.api;a.start();a.state.chapter=1;a.state.moves=17;a.state.distance=7;
  a.state.board=Array(36).fill(1);for(let i=0;i<count;i++)a.state.board[i]=0;
  a.select(0);assert.match(h.get('feedback').textContent,count<=4?/moves 2 steps closer/:count<=6?/moves 1 step closer/:/stays put/);
  a.state.status='won';a.finishField();a.action();assert.equal(a.state.moves,0);
  assert.equal(h.get('wolf-effect').textContent,'Next whistle 1 · 3–4: 1 closer');
 }
});

test('Safari back-cache refreshes the chooser after another tab finishes, without resetting active games',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const waiting=harness(true,storage),playing=harness(true,storage);
 playing.api.beginDaily();playing.api.state.chapter=2;playing.api.state.status='won';playing.api.finishField();
 waiting.windowEvents.pageshow({persisted:true});assert.match(waiting.get('dialog-details').innerHTML,/Completed today/);
 assert.match(waiting.get('dialog-action').textContent,/Free play/);waiting.api.action();
 const board=JSON.stringify(waiting.api.state);waiting.windowEvents.pageshow({persisted:true});
 assert.equal(JSON.stringify(waiting.api.state),board);assert.equal(waiting.get('story-dialog').open,false);
});
