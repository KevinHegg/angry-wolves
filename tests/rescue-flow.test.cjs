const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const R=require('../rescue-engine');
const S=require('../rescue-services');
const D=require('../rescue-daily');
function memoryStorage(){const values=new Map();return{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};}
function harness(reducedMotion=true,storage=memoryStorage(),timers=null,services={},initialLandscape=false,trailGeometry=false,gameDate=Date){
 const nodes=new Map(),animations=[],sounds=[],windowEvents={},documentEvents={},intervals=new Map();let intervalId=0;
 const clock={now:1000},orientation={matches:initialLandscape,addEventListener(name,fn){this.changed=fn;}};
 class Element {
  constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};const classes=new Set();this.classList={toggle(name,force){if(force===undefined?!classes.has(name):force)classes.add(name);else classes.delete(name);return classes.has(name);},add(...names){names.forEach(name=>classes.add(name));},remove(...names){names.forEach(name=>classes.delete(name));},contains(name){return classes.has(name);}};this.events={};this.isConnected=true;}
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
 const document={getElementById:get,querySelector:s=>s.includes('shepherd-badge')?badgeInput:get(s),querySelectorAll:()=>[],body:new Element(),documentElement:new Element(),addEventListener(name,fn){documentEvents[name]=fn;},createElement:()=>new Element()};
 let entries=[],posted=[];
 const window={RescueDaily:D,RescueRules:R,RescueServices:{...S,consolidatedBoard:async(view,date,player,scope)=>D.summary(entries,view,date,{player,scope,serverTime:Date.now()}),board:async(view,date)=>({entries,yesterday:null,today:D.dayKey(),date:date||D.dayKey()}),leaderboard:async()=>entries,submit:async(r,name,badge)=>{posted.push(S.payload(r,name,badge));entries=[{...S.payload(r,name,badge)}];return{status:'public',message:'Saved'};},...services},RescueAudio:{setEnabled(){},play(kind){sounds.push(kind);}},RescueShare:{makeCard:async()=>({url:'blob:test'}),share:async()=> 'shared'},matchMedia:query=>query.includes('orientation:')?orientation:{matches:query.includes('prefers-reduced-motion')?reducedMotion:false},addEventListener(name,fn){windowEvents[name]=fn;},scrollTo(){},crypto:{randomUUID:()=>String(Math.random())}};
 const source=fs.readFileSync(require.resolve('../rescue.js'),'utf8').replace('  fieldEntryBoard=state.board.slice();soundLabel();render();intro();',`  window.test={get state(){return state},get result(){return finalResult},get submission(){return submission},start:()=>{ready=true;closeDialog();},commit,select,action:()=>dialogAction(),secondary:()=>dialogSecondary(),finishField,freshAdventure,showLeaderboard,showResults,postScore,beginDaily,beginFree,resumeDaily,saveDaily,intro,chooseGame,showHelp,get view(){return dialogView},get ready(){return ready},back:()=>dialogBack?.run(),get challengeDate(){return challengeDate},get randoms(){return randoms},setBoard:(view,date='',scope='standings')=>{boardView=view;boardDate=date;boardScope=scope;return loadLeaderboard()},refresh:loadLeaderboard}; soundLabel();render();intro();`);
 vm.runInNewContext(source,{window,document,localStorage:storage,ResizeObserver:class{observe(){}},requestAnimationFrame:()=>1,setInterval:fn=>{intervals.set(++intervalId,fn);return intervalId;},clearInterval:id=>intervals.delete(id),setTimeout:(fn,delay)=>{if(!timers)return fn();const timer={fn,delay};timers.push(timer);return timer;},clearTimeout:timer=>{if(timer)timer.cancelled=true;},URL:{revokeObjectURL(){}},performance:{now:()=>clock.now},Math,Date:gameDate});
 return{...window.test,api:window.test,nodes,get,posted,animations,sounds,badgeInput,clock,document,windowEvents,documentEvents,intervals,rotate:landscape=>{orientation.matches=landscape;orientation.changed();}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('visible standings refresh on return and polling, preserve stale data, and keep an outside rank visible',async()=>{
 const storage=memoryStorage();S.saveProfile({initials:'YOU',badge:0},storage);
 let calls=0,offline=false,now=Date.parse('2026-09-15T03:59:00Z');
 const day='2026-09-14',rows=Array.from({length:25},(_,i)=>({playerName:'AA'+String.fromCharCode(65+i)+'0',score:5000-i,gameMode:D.MODE,missionTitle:`Daily ${day} ·`,approvedAt:day+'T18:00:00Z'}));
 rows.push({playerName:'YOU0',score:1000,gameMode:D.MODE,missionTitle:`Daily ${day} ·`,approvedAt:day+'T18:01:00Z'});
 const h=harness(true,storage,null,{consolidatedBoard:async(view,date,player,scope)=>{calls++;if(offline)throw Error('Offline');return D.summary(rows,view,date,{player,scope,serverTime:now});}}),a=h.api;
 a.start();a.showLeaderboard();await settle();assert.equal(h.intervals.size,1);
 assert.match(h.get('your-rank').textContent,/#26 of 26 players/);assert.equal(h.get('your-standing').hidden,false);
 assert.match(h.get('your-standing').children[1].children[1].textContent,/YOU 🐕 · You/);
 const baseline=calls;h.document.hidden=true;[...h.intervals.values()][0]();await settle();assert.equal(calls,baseline);
 h.document.hidden=false;h.documentEvents.visibilitychange();await settle();assert.equal(calls,baseline+1);
 h.windowEvents.focus();await settle();assert.equal(calls,baseline+2);
 const rendered=h.get('leaderboard-list').children;offline=true;[...h.intervals.values()][0]();await settle();
 assert.equal(h.get('leaderboard-list').children,rendered);assert.match(h.get('board-updated').textContent,/Out of date · last updated/);assert.match(h.get('your-rank').textContent,/#26 of 26/);
 offline=false;rows.push({playerName:'NEW0',score:6000,gameMode:D.MODE,missionTitle:`Daily ${day} ·`,approvedAt:day+'T19:00:00Z'});
 [...h.intervals.values()][0]();await settle();assert.match(h.get('your-rank').textContent,/#27 of 27/);assert.doesNotMatch(h.get('board-updated').textContent,/Out of date/);
 now=Date.parse('2026-09-15T04:00:00Z');h.windowEvents.pageshow({persisted:true});await settle();assert.match(h.get('your-rank').textContent,/not ranked/);assert.equal(h.get('your-standing').hidden,true);assert.match(h.get('board-date-label').textContent,/Sep 15/);
 a.action();assert.equal(h.intervals.size,0);
});
test('daily date controls navigate available challenges and show all available top rows without scrolling',async()=>{
 const today=D.dayKey(),yesterday=D.shiftDay(today,-1);
 const rows=[today,yesterday].flatMap((day,index)=>Array.from({length:index?2:4},(_,i)=>({playerName:`AA${String.fromCharCode(65+i)}0`,score:4000-i,gameMode:D.MODE,missionTitle:`Daily ${day} ·`,approvedAt:day+'T18:00:00Z'})));
 const h=harness(true,undefined,null,{consolidatedBoard:async(view,date,player,scope)=>D.summary(rows,view,date,{player,scope,serverTime:Date.now()})}),a=h.api;
 a.start();a.showLeaderboard();await settle();
 assert.equal(h.get('leaderboard-list').children.length,4);assert.equal(h.get('leaderboard-list').classList.contains('short-list'),true);
 assert.match(h.get('board-date-label').textContent,/Today/);assert.equal(h.get('board-date-next').disabled,true);
 h.get('board-date-prev').events.click();await settle();
 assert.match(h.get('board-date-label').textContent,new RegExp(D.label(yesterday,true)));assert.equal(h.get('leaderboard-list').children.length,2);
 h.get('board-date-toggle').events.click();assert.equal(h.get('board-date-menu').hidden,false);
 const records=h.get('board-date-menu').children.find(button=>button.dataset.dateChoice==='records');
 h.get('board-date-menu').events.click({target:{closest:()=>records}});await settle();
 assert.equal(h.get('board-date-menu').hidden,true);assert.match(h.get('board-date-label').textContent,/Daily records/);
});
test('three consecutive free-play restarts quietly disable restart until field two',()=>{
 const h=harness(),a=h.api;a.start();
 for(let i=0;i<3;i++){h.get('retry').events.click();assert.equal(a.state.moves,0);}
 assert.equal(h.get('retry').disabled,true);assert.equal(h.get('retry').textContent,'Restart game');assert.equal(h.get('retry').title,'');
 const board=a.state.board;
 h.get('retry').events.click();assert.equal(a.state.board,board,'a fourth click cannot reroll the board');
 a.state.board[30]=a.state.board[31]=a.state.board[32]=0;a.select(30);a.commit();
 assert.equal(a.state.moves,1);assert.equal(h.get('retry').disabled,true,'a herd in the first field does not unlock restart');
 a.state.status='won';a.finishField();a.action();
 assert.equal(a.state.chapter,1);assert.equal(h.get('retry').disabled,false);
 h.get('retry').events.click();assert.equal(a.state.chapter,0);assert.equal(a.state.moves,0);
});
test('a successful daily submission forces a fresh standings read even when an older one is pending',async()=>{
 const pending=[];let posted=false;
 const h=harness(true,undefined,null,{consolidatedBoard:(view,date,player,scope)=>scope===undefined?Promise.resolve(D.summary([],view,date)):new Promise(resolve=>pending.push(resolve)),submit:async()=>{posted=true;return{status:'received',message:'Score received'};}}),a=h.api;
 a.beginDaily();a.state.chapter=2;a.state.status='won';a.finishField();a.showLeaderboard();assert.equal(pending.length,1);
 h.get('score-initials').value='YOU';await a.postScore({preventDefault(){}});assert.equal(posted,true);assert.equal(pending.length,2);
 const result=a.result,entry={...S.payload(result,'YOU',0),approvedAt:a.challengeDate+'T18:00:00Z'};
 pending[1](D.summary([entry],'daily',a.challengeDate,{player:'YOU0',serverTime:Date.now()}));await settle();assert.match(h.get('your-rank').textContent,/#1 of 1 player/);
 pending[0](D.summary([],'daily',a.challengeDate,{serverTime:Date.now()}));await settle();assert.match(h.get('your-rank').textContent,/#1 of 1 player/);
});
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
 h.rotate(false);assert.equal(h.get('story-dialog').open,true);assert.match(h.get('dialog-title').textContent,/Choose your game/);
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
 assert.equal(h.get('story-dialog').open,true);assert.equal(h.get('dialog-title').textContent,'Choose your game.');
 a.action();assert.equal(a.challengeDate,'');assert.equal(h.get('retry').textContent,'Restart game');
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
 a.state.status='won';a.finishField();assert.equal(a.result.rested,0);assert.equal(a.result.bonus,0);
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
 assert.equal(h.get('toggle-player-lock').hidden,true);assert.match(h.get('player-summary').textContent,/ZBB.*Change player/);
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
test('overlapping refreshes coalesce and reopening ignores an old response',async()=>{
 const reads=[];const h=harness(true,undefined,null,{consolidatedBoard:(view,date,player,scope)=>scope===undefined?Promise.resolve(D.summary([],view,date)):new Promise(resolve=>reads.push(resolve))}),a=h.api;
 a.start();a.showLeaderboard();h.get('refresh-scores').events.click();assert.equal(reads.length,1);
 a.showLeaderboard();assert.equal(reads.length,2);
 reads[1](D.summary([{gameMode:S.MODE,playerName:'NEW0',score:5000}],'alltime',''));await settle();
 reads[0](D.summary([{gameMode:S.MODE,playerName:'OLD0',score:1000}],'alltime',''));await settle();
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

test('two unused Pip barks earn 350; all three earn 1000 only at victory',()=>{
 for(const barks of [0,1,2,3]){
  const h=harness(),a=h.api;a.start();
  for(let i=0;i<barks;i++)h.get('bark').events.click();
  assert.equal(h.get('pip-rest-hint').textContent,barks===0?'No-Pip bonus: +1,000':barks===1?'Pip bonus: +350':'Pip bonus: 0');
  for(let chapter=0;chapter<2;chapter++){
   a.state.status='won';a.finishField();assert.equal(a.result,null);a.action();
   assert.equal(a.state.bark,3-barks);
  }
  a.state.score=500;a.state.status='won';a.finishField();
  assert.equal(a.result.rested,3-barks);assert.equal(a.result.bonus,R.restBonus(3-barks));assert.equal(a.result.score,500+R.restBonus(3-barks));
  assert.match(h.get('dialog-details').innerHTML,/Pip bonus/);
  a.freshAdventure();assert.equal(h.get('pip-rest-hint').textContent,'No-Pip bonus: +1,000');
  a.state.status='lost';a.finishField();assert.equal(a.result,null);
 }
});
test('a losing two-step move passes the one-away mark before the howl and result pause',()=>{
 for(const restart of [false,true]){
  const timers=[],h=harness(false,undefined,timers,{},false,true),a=h.api;a.start();
  a.state.chapter=2;a.state.distance=2;a.state.moves=14;
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
test('winning with the wolf one step away keeps it outside the pen through the ending',()=>{
 const timers=[],h=harness(false,undefined,timers,{},false,true),a=h.api;a.start();
 a.state.chapter=2;a.state.distance=1;a.state.moves=13;a.state.saved=R.CHAPTERS[2].goal.slice();a.state.saved[2]=13;
 a.state.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%4);
 for(const i of [30,31,32,33])a.state.board[i]=2;
 a.state.board[26]=0;
 assert.equal(R.group(a.state.board,30).length,4);
 a.select(30);assert.match(h.get('feedback').textContent,/last gate closes before the wolf can move/);
 a.commit();timers.find(t=>t.delay===230).fn();
 assert.equal(a.state.status,'won');assert.equal(a.state.distance,1);
 assert.equal(h.animations.some(animation=>animation.cell.dataset.trail===0),false);
 assert.equal(h.get('story-dialog').open,false);
 timers.find(t=>t.delay===0).fn();assert.equal(h.sounds.includes('howl-plaintive'),true);
 assert.equal(h.animations.some(animation=>animation.cell.dataset.trail===1),true);
 timers.find(t=>t.delay===2000).fn();assert.equal(h.get('dialog-title').textContent,'Everyone is home.');
});

test('starting twice resumes the same daily attempt instead of resetting it',()=>{
 const h=harness(),a=h.api;a.beginDaily();assert.equal(h.get('whistle').disabled,true);
 a.select(R.groups(a.state.board)[0][0]);a.commit();const progressed=JSON.stringify(a.state);
 a.beginDaily();assert.equal(JSON.stringify(a.state),progressed);a.freshAdventure();assert.equal(JSON.stringify(a.state),progressed);
 assert.equal(h.get('whistle').disabled,true);assert.equal(h.get('game-mode').textContent,'DAILY CHALLENGE');assert.match(h.document.body.className,/daily-mode/);
 a.beginFree();assert.equal(a.challengeDate,'');assert.equal(a.state.chapter,0);assert.equal(h.get('game-mode').textContent,'BRING THEM HOME');assert.doesNotMatch(h.document.body.className,/daily-mode/);
});
test('daily save restores board, wolf, Pip and exact future draws through a reload',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const h=harness(true,storage),a=h.api;a.beginDaily();a.select(R.groups(a.state.board)[0][0]);a.commit();h.get('bark').events.click();
 const expected=JSON.stringify(a.state),streamState=a.randoms.snapshot();
 const next=harness(true,storage).api;next.resumeDaily();assert.equal(JSON.stringify(next.state),expected);assert.deepEqual(next.randoms.snapshot(),streamState);
 const g=R.groups(next.state.board)[0][0];next.select(g);next.commit();assert.equal(next.state.moves,2);
 a.select(g);a.commit();assert.equal(a.challengeDate,'','a stale tab cannot overwrite the resumed run');
 assert.equal(JSON.stringify(JSON.parse(storage.getItem('hw-daily-adventure')).state),JSON.stringify(next.state));
});
test('an adventure keeps its day across midnight and a new adventure uses the new day',()=>{
 let time=Date.parse('2026-09-15T03:59:00Z');class Clock extends Date{static now(){return time;}}
 const h=harness(true,undefined,null,{},false,false,Clock),a=h.api;a.beginDaily();assert.equal(a.challengeDate,'2026-09-14');
 const carried=a.state.board.slice();time=Date.parse('2026-09-15T04:01:00Z');a.state.status='won';a.finishField();a.action();
 assert.equal(a.challengeDate,'2026-09-14');assert.deepEqual(a.state.board,carried);assert.equal(a.state.chapter,1);
 a.freshAdventure();assert.equal(a.challengeDate,'2026-09-15');assert.equal(a.state.chapter,0);
});
test('daily scores below the displayed leaders remain eligible for a full player ranking',async()=>{
 const h=harness(true,undefined,null,{board:async()=>({entries:Array.from({length:20},()=>({score:9000,playerName:'AAA0',gameMode:D.MODE}))})}),a=h.api;
 a.beginDaily();a.state.chapter=2;a.state.score=10;a.state.status='won';a.finishField();a.showLeaderboard('daily');await settle();
 assert.equal(h.get('submit-score').disabled,false);h.get('score-initials').value='NEW';await a.postScore({preventDefault(){}});assert.equal(h.posted.length,1);assert.equal(h.posted[0].gameMode,D.MODE);assert.equal(h.posted[0].challengeDate,a.challengeDate);
});
test('changing leaderboard views cannot let a slow previous response overwrite the new view',async()=>{
 let resolveDaily;const h=harness(true,undefined,null,{consolidatedBoard:(view)=>view==='daily'?new Promise(r=>resolveDaily=r):Promise.resolve(D.summary([{playerName:'WIN0',score:8000,gameMode:S.MODE}],'alltime',''))}),a=h.api;
 a.start();a.showLeaderboard('daily');await settle();await a.setBoard('alltime');assert.equal(h.get('leaderboard-list').children[0].children[1].textContent,'WIN 🐕');
 resolveDaily(D.summary([{playerName:'OLD0',score:1000,gameMode:S.MODE}],'alltime',''));await settle();assert.equal(h.get('leaderboard-list').children[0].children[1].textContent,'WIN 🐕');
});

test('a new day offers today’s puzzle while retaining access to yesterday’s saved adventure',()=>{
 let time=Date.parse('2026-09-15T03:59:00Z');class Clock extends Date{static now(){return time;}}
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)},h=harness(true,storage,null,{},false,false,Clock),a=h.api;
 a.beginDaily();time=Date.parse('2026-09-15T04:01:00Z');a.intro();assert.equal(h.get('dialog-action').textContent,'Start daily challenge');assert.match(h.get('dialog-details').innerHTML,/Continue unfinished daily · Sep 14/);
 a.action();assert.equal(a.challengeDate,'2026-09-15');
});
test('corrupt daily saves do not prevent starting a new game',()=>{
 const h=harness(true,{getItem:k=>k==='hw-daily-adventure'?'{"ruleset":"daily-1","challengeDate":"2026-09-14","state":{}}':null,setItem(){}}),a=h.api;
 assert.equal(h.get('dialog-action').textContent,'Start daily challenge');assert.doesNotThrow(()=>a.beginDaily());
});

test('a daily win starts free play next and keeps its result and completion through reloads',async()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const h=harness(true,storage),a=h.api;a.beginDaily();a.state.chapter=2;a.state.status='won';a.state.score=2500;
 a.state.board[8]=R.DUST;a.state.cats={8:2};a.finishField();const nonce=a.result.nonce;
 assert.match(h.get('dialog-action').textContent,/Play free/);a.action();
 assert.equal(a.challengeDate,'');assert.equal(h.get('retry').textContent,'Restart game');assert.equal(a.state.chapter,0);
 const next=harness(true,storage),b=next.api;
 assert.match(next.get('dialog-details').innerHTML,/Completed today · 3,500 points/);
 assert.equal(next.get('dialog-action').textContent,'Start free play');assert.match(next.get('dialog-secondary').textContent,/View daily score/);
 b.secondary();assert.equal(b.result.nonce,nonce);assert.equal(b.state.board[8],R.DUST);assert.equal(b.submission.done,false);
 b.showLeaderboard('daily');await settle();next.get('score-initials').value='NEW';await b.postScore({preventDefault(){}});
 const posted=harness(true,storage);assert.equal(posted.get('dialog-secondary').hidden,true);posted.api.resumeDaily();assert.equal(posted.api.submission.done,true);assert.equal(posted.api.result.nonce,nonce);
});
test('completed v2.40 daily saves migrate with or without a finished result panel',()=>{
 for(const endingPending of [false,true]){
  const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const a=harness(true,storage).api;a.beginDaily();a.state.chapter=2;a.state.status='won';a.state.score=2200;
  if(endingPending)a.saveDaily();else a.finishField();values.delete('hw-daily-completed');values.delete(`hw-daily-attempt:${D.dayKey()}`);
  const legacy=JSON.parse(values.get('hw-daily-adventure'));delete legacy.dailyRevision;values.set('hw-daily-adventure',JSON.stringify(legacy));
  const next=harness(true,storage);
  assert.match(next.get('dialog-details').innerHTML,/Completed today · 3,200 points/);
  assert.match(next.get('dialog-action').textContent,/[Ff]ree play/);next.api.secondary();assert.equal(next.api.result.score,3200);
 }
});
test('a completed daily can be viewed but never replayed, even after free play or rename',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const h=harness(true,storage),a=h.api;a.beginDaily();
 a.state.chapter=2;a.state.status='won';a.state.score=1800;a.finishField();const nonce=a.result.nonce;
 a.secondary();assert.doesNotMatch(h.get('dialog-details').innerHTML,/Replay|Restart today/);
 a.beginDaily();assert.equal(a.result.nonce,nonce);assert.equal(a.result.score,2800);
 a.beginFree();S.saveProfile({initials:'NEW',badge:7},storage);a.beginDaily();assert.equal(a.result.nonce,nonce);
 h.get('retry').events.click();const next=harness(true,storage);
 assert.match(next.get('dialog-details').innerHTML,/Completed today · 2,800 points/);assert.match(next.get('dialog-action').textContent,/[Ff]ree play/);
});
for(const outcome of ['lost','gave-up'])test(`daily ${outcome} consumes the attempt across reload and free play`,()=>{
 const storage=memoryStorage(),h=harness(true,storage),a=h.api;a.beginDaily();
 if(outcome==='lost'){a.state.status='lost';a.finishField();assert.match(h.get('dialog-action').textContent,/Play free/);}else h.get('retry').events.click();
 const marker=JSON.parse(storage.getItem(`hw-daily-attempt:${D.dayKey()}`));assert.equal(marker.status,outcome);
 const next=harness(true,storage);assert.match(next.get('dialog-action').textContent,/[Ff]ree play/);assert.doesNotMatch(next.get('dialog-details').innerHTML,/Restart today|Replay/);
 next.api.beginDaily();assert.ok(next.api.challengeDate!==D.dayKey()||next.api.state.status!=='playing');
 next.api.beginFree();next.api.intro();assert.match(next.get('dialog-action').textContent,/[Ff]ree play/);
 assert.equal(JSON.parse(storage.getItem(`hw-daily-attempt:${D.dayKey()}`)).nonce,marker.nonce);
});
test('daily completion applies only to its Eastern date',()=>{
 let time=Date.parse('2026-09-15T03:59:00Z');class Clock extends Date{static now(){return time;}}
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const h=harness(true,storage,null,{},false,false,Clock),a=h.api;
 a.beginDaily();a.state.chapter=2;a.state.status='won';a.state.score=3000;a.finishField();
 a.intro();assert.match(h.get('dialog-details').innerHTML,/4,000 points/);
 time=Date.parse('2026-09-15T04:01:00Z');a.intro();assert.doesNotMatch(h.get('dialog-details').innerHTML,/Completed today/);
 assert.equal(h.get('dialog-action').textContent,'Start daily challenge');assert.match(h.get('dialog-details').innerHTML,/View unposted score · Sep 14/);
 a.action();assert.equal(a.challengeDate,'2026-09-15');assert.equal(a.state.chapter,0);
});
test('blocked browser storage offers free play without starting an untrackable daily',()=>{
 const h=harness(true,{getItem(){throw Error('Storage blocked');},setItem(){throw Error('Storage blocked');}}),a=h.api;
 a.beginDaily();assert.equal(a.challengeDate,'');assert.match(h.get('dialog-title').textContent,/Allow this game to save/);
 a.action();assert.equal(a.challengeDate,'');assert.equal(h.get('story-dialog').open,false);
});
test('missing or corrupt progress cannot reopen a consumed daily attempt',()=>{
 const storage=memoryStorage(),h=harness(true,storage);h.api.beginDaily();storage.setItem('hw-daily-adventure','broken');
 const next=harness(true,storage);assert.match(next.get('dialog-action').textContent,/[Ff]ree play/);next.api.beginDaily();assert.equal(next.api.challengeDate,'');
});
test('a second tab taking over daily play cancels stale work and preserves the same nonce',()=>{
 const storage=memoryStorage(),timers=[],h=harness(false,storage,timers),a=h.api;a.beginDaily();
 a.select(R.groups(a.state.board)[0][0]);a.commit();const pending=timers.find(t=>t.delay===230);
 const next=harness(true,storage);next.api.beginDaily();const before=storage.getItem('hw-daily-adventure');
 h.windowEvents.storage({key:`hw-daily-attempt:${D.dayKey()}`});pending.fn();
 assert.equal(storage.getItem('hw-daily-adventure'),before);assert.equal(a.challengeDate,'');assert.match(h.get('dialog-action').textContent,/Continue daily/);
});
test('daily scores still submit when the public CSV is temporarily unavailable',async()=>{
 const h=harness(true,undefined,null,{board:async()=>{throw Error('CSV unavailable');}}),a=h.api;
 a.beginDaily();a.state.chapter=2;a.state.status='won';a.state.score=3000;a.finishField();a.showLeaderboard('daily');await settle();
 h.get('score-initials').value='NEW';await a.postScore({preventDefault(){}});assert.equal(h.posted.length,1);assert.equal(a.submission.done,true);
});
test('whistle 15 and 30 warnings arrive before the move and preview the correct movement',()=>{
 for(const next of [14,15,29,30]){
  const h=harness(),a=h.api;a.start();a.state.chapter=2;a.state.moves=next-2;a.state.distance=10;a.state.windWait=99;
  const resetHerd=()=>{a.state.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%4);a.state.board[30]=a.state.board[31]=a.state.board[32]=0;a.state.board[24]=a.state.board[33]=1;};
  resetHerd();a.select(30);a.commit();
  assert.equal(a.state.moves,next-1);
  assert.equal(h.get('wolf-effect').textContent,`Next whistle ${next} · 3–4: ${1+R.pressure(next)} closer`);
  assert.equal(h.get('.wolf-trail').classList.contains('pressure-one'),R.pressure(next)===1);
  assert.equal(h.get('.wolf-trail').classList.contains('pressure-two'),R.pressure(next)===2);
  if(next===15)assert.match(h.get('feedback').textContent,/From whistle 15: 3–4 animals move the wolf 2 steps closer; 5–6, 1 closer; 7\+, stay put/);
  if(next===30)assert.match(h.get('feedback').textContent,/From whistle 30: 3–4 animals move the wolf 3 steps closer; 5–6, 2 closer; 7\+, 1 closer/);
  resetHerd();a.select(30);assert.match(h.get('feedback').textContent,new RegExp(`Whistle ${next}:.*The wolf moves ${1+R.pressure(next)} steps? closer`));
  const before=a.state.distance;a.commit();assert.equal(before-a.state.distance,1+R.pressure(next));
  assert.equal(h.get('.wolf-trail').classList.contains('pressure-one'),R.pressure(next+1)===1);
  assert.equal(h.get('.wolf-trail').classList.contains('pressure-two'),R.pressure(next+1)===2);
  assert.match(h.get('trail-steps').innerHTML,/wolf-eye-small.*wolf-eye-large/);
 }
});
test('medium and large herds preview their distinct whistle-15 effects and a new field resets pressure',()=>{
 for(const count of [4,5,6,7]){
  const h=harness(),a=h.api;a.start();a.state.chapter=1;a.state.moves=14;a.state.distance=7;
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
 assert.match(waiting.get('dialog-action').textContent,/[Ff]ree play/);waiting.api.action();
 const board=JSON.stringify(waiting.api.state);waiting.windowEvents.pageshow({persisted:true});
 assert.equal(JSON.stringify(waiting.api.state),board);assert.equal(waiting.get('story-dialog').open,false);
});

test('daily record history lives in the date selector within the two-tab panel',async()=>{
 const day=D.shiftDay(D.dayKey(),-10),requested=[];
 const h=harness(true,undefined,null,{consolidatedBoard:async(view,date,player,scope)=>{requested.push([view,scope]);return D.summary([{gameMode:D.MODE,missionTitle:`Daily ${day} ·`,approvedAt:day+'T18:00:00Z',playerName:'ABC0',score:4500,biggestHerdCount:18,biggestHerdAnimal:'🐷'}],view,date,{scope});}}),a=h.api;
 a.start();a.showLeaderboard();await settle();await a.setBoard('daily','','records');
 assert.match(h.get('dialog-details').innerHTML,/data-board="daily" aria-selected="true"/);
 assert.equal((h.get('dialog-details').innerHTML.match(/role="tab"/g)||[]).length,2);
 assert.deepEqual(requested.at(-1),['daily','records']);assert.match(h.get('board-description').textContent,/Best daily score per player per date/);
 const row=h.get('leaderboard-list').children[0];assert.equal(row.children[1].textContent,'ABC 🐕');assert.equal(row.children[2].textContent,'4,500');
 assert.equal(row.children[3].textContent,`${D.label(day,true)} · Biggest herd 18 🐷`);
 a.action();assert.equal(h.get('story-dialog').open,false);
});

test('results menu is a compact chooser and Back restores the same unposted score',()=>{
 const h=harness(),a=h.api;a.start();a.state.chapter=2;a.state.status='won';a.state.score=2848;a.finishField();
 const result=a.result;a.secondary();
 assert.equal(a.view,'chooser');assert.equal(h.get('dialog-title').textContent,'Choose your game.');
 assert.doesNotMatch(h.get('dialog-details').innerHTML,/instruction|Select 3\+|Pip has/);
 assert.equal(h.get('load-version').hidden,true);assert.equal(h.get('dialog-back').textContent,'Back to my score');
 a.back();assert.equal(a.view,'results');assert.equal(a.result,result);assert.equal(h.get('result-actions').hidden,false);
});
test('Help to menu to Back preserves active free play, its selection and readiness',()=>{
 const h=harness(),a=h.api;a.beginFree();a.select(R.groups(a.state.board)[0][0]);
 const state=JSON.stringify(a.state),whistle=h.get('whistle-label').textContent;
 a.showHelp();assert.equal(h.get('dialog-action').textContent,'Back to my game');a.secondary();assert.equal(a.view,'chooser');
 assert.equal(h.get('dialog-back').textContent,'Back to my game');h.get('story-dialog').events.cancel({preventDefault(){}});
 assert.equal(h.get('story-dialog').open,false);assert.equal(a.ready,true);assert.equal(JSON.stringify(a.state),state);assert.equal(h.get('whistle-label').textContent,whistle);
 a.commit();assert.equal(a.state.moves,1);
});
test('leaderboard and Help return to the menu that opened them, then to the score',()=>{
 const h=harness(),a=h.api;a.start();a.state.chapter=2;a.state.status='won';a.finishField();a.secondary();
 a.showLeaderboard();assert.equal(h.get('dialog-action').textContent,'Back to game menu');a.action();assert.equal(a.view,'chooser');
 a.showHelp();assert.equal(h.get('dialog-action').textContent,'Back to game menu');assert.equal(h.get('dialog-secondary').hidden,true);h.get('story-dialog').events.cancel({preventDefault(){}});assert.equal(a.view,'chooser');
 a.back();assert.equal(a.view,'results');
});
test('a first-load Help or leaderboard cannot expose an unstarted board',()=>{
 for(const visit of ['showHelp','showLeaderboard']){
  const h=harness(),a=h.api;a[visit]();a.action();assert.equal(a.view,'intro');assert.equal(h.get('story-dialog').open,true);assert.equal(a.ready,false);
 }
});
for(const outcome of ['gave-up','lost','won-posted','won-unposted'])test(`${outcome} daily only offers Free play as a start action`,async()=>{
 const storage=memoryStorage(),h=harness(true,storage),a=h.api;a.beginDaily();
 if(outcome==='gave-up')h.get('retry').events.click();
 else if(outcome==='lost'){a.state.status='lost';a.finishField();}
 else{a.state.chapter=2;a.state.status='won';a.finishField();if(outcome==='won-posted'){a.showLeaderboard('daily');await settle();h.get('score-initials').value='FAM';await a.postScore({preventDefault(){}});}}
 const next=harness(true,storage),b=next.api;
 assert.equal(next.get('dialog-action').textContent,'Start free play');
 assert.equal(next.get('dialog-secondary').hidden,outcome!=='won-unposted');
 if(outcome==='won-unposted'){assert.equal(next.get('dialog-secondary').textContent,'View daily score');b.secondary();assert.equal(b.state.status,'won');assert.equal(b.view,'results');b.secondary();}
 assert.doesNotMatch(next.get('dialog-details').innerHTML,/Restart|Replay|Continue daily|Start daily/);
 b.action();assert.equal(b.challengeDate,'');assert.equal(b.state.chapter,0);
});
test('daily menu opens Continue and returning to a paused daily never consumes another attempt',()=>{
 const storage=memoryStorage(),h=harness(true,storage),a=h.api;a.beginDaily();a.select(R.groups(a.state.board)[0][0]);a.commit();
 const before=JSON.stringify(a.state),nonce=JSON.parse(storage.getItem('hw-daily-adventure')).runNonce;
 a.showHelp();a.secondary();assert.match(h.get('dialog-action').textContent,/Continue daily/);a.action();
 assert.equal(JSON.stringify(a.state),before);assert.equal(JSON.parse(storage.getItem('hw-daily-adventure')).runNonce,nonce);
});
for(const finished of [false,true])test(`viewing an unposted daily score preserves the previous ${finished?'free-play score':'free game'}`,()=>{
 const h=harness(),a=h.api;a.beginDaily();a.state.chapter=2;a.state.status='won';a.state.score=1800;a.finishField();a.beginFree();
 if(finished){a.state.chapter=2;a.state.status='won';a.state.score=3400;a.finishField();}else a.select(R.groups(a.state.board)[0][0]);
 const before=JSON.stringify(a.state),result=a.result,whistle=h.get('whistle-label').textContent;
 a.chooseGame();assert.equal(h.get('dialog-secondary').textContent,'View daily score');a.secondary();assert.equal(a.result.score,2800);
 assert.equal(h.get('dialog-back').textContent,finished?'Back to previous score':'Back to my game');a.back();
 assert.equal(JSON.stringify(a.state),before);assert.equal(a.result,result);
 if(finished)assert.equal(a.view,'results');else{assert.equal(h.get('story-dialog').open,false);assert.equal(h.get('whistle-label').textContent,whistle);a.commit();assert.equal(a.state.moves,1);}
});
