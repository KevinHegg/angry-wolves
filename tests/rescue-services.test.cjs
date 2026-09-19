const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../rescue-services.js');
const D = require('../rescue-daily.js');
const result={score:1850,rested:2,bonus:350,biggest:{count:14,type:1},saved:91,moves:17,durationMs:180000,nonce:'stable-nonce'};
const HEADERS=['approved_at','player_name','score','game_mode','mission_title','best_chain','biggest_herd_count','biggest_herd_animal','herds_cleared','pace','duration_ms','version','source_nonce'];
const value=(row,key)=>({approved_at:row.approvedAt,player_name:row.playerName,game_mode:row.gameMode,mission_title:row.missionTitle,best_chain:row.bestChain,biggest_herd_count:row.biggestHerdCount,biggest_herd_animal:row.biggestHerdAnimal,herds_cleared:row.herdsCleared,duration_ms:row.durationMs,source_nonce:row.nonce}[key]??row[key]??'');
const quote=input=>/[",\n]/.test(String(input))?'"'+String(input).replaceAll('"','""')+'"':String(input);
const csv=rows=>[HEADERS.join(','),...rows.map(row=>HEADERS.map(key=>quote(value(row,key))).join(','))].join('\n');
const publicRow=(extra={})=>({approvedAt:'2026-09-13T12:00:00.000Z',playerName:'ABC0',score:1750,gameMode:S.MODE,missionTitle:'Home safe · Pip rested 2/3 · bonus 250',bestChain:0,biggestHerdCount:14,biggestHerdAnimal:'🐷',herdsCleared:17,pace:3,durationMs:180000,version:S.VERSION,nonce:'n',...extra});

test('all badges round-trip through the existing alphanumeric name column',()=>{
  for(let i=0;i<S.BADGES.length;i++)assert.equal(S.decodeName(S.encodeName('abc',i)),'ABC '+S.BADGES[i]);
  for(const name of ['AB','ABCD','A1C','<b>'])assert.throws(()=>S.encodeName(name,0));
  assert.throws(()=>S.encodeName('ABC',20));assert.throws(()=>S.encodeName('ABC',-1));
});
test('score payload uses the current category and actual completed-run metrics',()=>{
  const p=S.payload(result,'ABC',3);assert.equal(p.gameMode,'rescue-v2');assert.equal(p.score,1850);
  assert.equal(p.durationMs,180000);assert.equal(p.nonce,'stable-nonce');assert.equal(p.biggestHerdAnimal,'🐷');
  assert.equal(p.biggestHerdCount,14);assert.match(p.missionTitle,/barks saved 2\/3 · bonus 350/);
});
test('share caption includes the score, herd animal, bonus and root game link',()=>{
  const text=S.caption(result);for(const expected of ['1,850','14 🐷','+350',S.GAME_URL])assert.ok(text.includes(expected));
  const bare=S.caption(result,false);assert.ok(!bare.includes(S.GAME_URL));assert.ok(bare.includes('1,850'));assert.ok(bare.endsWith('Can you beat my herd?'));
});
test('published CSV preserves quotes and normalizes score rows',()=>{
  const rows=S.csvEntries(csv([publicRow({missionTitle:'Home safe, "well played"'})]));
  assert.equal(rows[0].missionTitle,'Home safe, "well played"');assert.equal(rows[0].score,1750);assert.equal(rows[0].approvedAt,'2026-09-13T12:00:00.000Z');
});
test('HTML and malformed CSV are refresh failures rather than an empty leaderboard',()=>{
 assert.throws(()=>S.csvEntries('<html>Temporarily unavailable</html>'),/feed is unavailable/);
 assert.throws(()=>S.csvEntries('score,name\n4000,ABC'),/feed is unavailable/);
 assert.deepEqual(S.csvEntries(csv([])),[]);
});
test('consolidated CSV fallback reports full ranks without claiming an official winner',async()=>{
 const today=D.dayKey(),rows=Array.from({length:26},(_,i)=>publicRow({playerName:'AA'+String.fromCharCode(65+i)+'0',score:5000-i,gameMode:D.MODE,missionTitle:`Daily ${today} ·`,approvedAt:today+'T18:00:00Z'})),old=global.fetch;
 global.fetch=async()=>({ok:true,text:async()=>csv(rows)});
 try{const data=await S.consolidatedBoard('daily','','AAZ0');assert.equal(data.entries.length,20);assert.equal(data.yourStanding.rank,26);assert.equal(data.participantCount,26);assert.equal(data.authoritative,false);assert.equal(data.winner,null);assert.equal(data.entries[0].dailyWins,0);}finally{global.fetch=old;}
});
test('official standings use the configured endpoint and reject errors or incompatible responses',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');let response,calls=[];
 const window={RescueDaily:D},source=fs.readFileSync(require.resolve('../rescue-services'),'utf8').replace("const LEADERBOARD_API_URL = '';","const LEADERBOARD_API_URL = 'https://example.invalid/exec';");
 vm.runInNewContext(source,{window,URLSearchParams,AbortController,setTimeout,clearTimeout,fetch:async(url,options)=>{calls.push([url,options]);return{ok:true,text:async()=>JSON.stringify(response)};}});
 const official=window.RescueServices;response=D.summary([],'daily','',{serverTime:Date.now()});
 assert.equal((await official.consolidatedBoard('daily','','ABC0')).authoritative,true);assert.match(calls[0][0],/api=leaderboards-2/);assert.match(calls[0][0],/player=ABC0/);assert.equal(calls[0][1].cache,'no-store');
 response={ok:false,error:'Service unavailable'};await assert.rejects(official.consolidatedBoard(),/Service unavailable/);
 response={ok:true,api:'daily-1'};await assert.rejects(official.consolidatedBoard(),/needs an update/);
 assert.equal(calls.length,3,'an official refresh failure must not silently switch to unofficial rankings');
});
test('leaderboard filters other game modes and malformed identities',async()=>{
  const old=global.fetch;global.fetch=async()=>({ok:true,text:async()=>csv([publicRow({score:120}),publicRow({gameMode:'standard',playerName:'ZZZ1',score:900}),publicRow({playerName:'<script>',score:800})])});
  try{assert.equal((await S.leaderboard()).length,1);}finally{global.fetch=old;}
});
test('form submission maps every public metric and treats an opaque response as received',async()=>{
  const old=global.fetch;let call;global.fetch=async(url,options)=>(call={url,options},{type:'opaque',ok:false,status:0});
  try{
    const saved=await S.submit(result,'ABC',10);assert.equal(saved.status,'received');assert.equal(call.url,S.FORM_RESPONSE_URL);
    assert.equal(call.options.method,'POST');assert.equal(call.options.mode,'no-cors');assert.equal(call.options.body.get(S.FORM_FIELDS.playerName),'ABCA');
    assert.equal(call.options.body.get(S.FORM_FIELDS.biggestHerdCount),'14');assert.equal(call.options.body.get(S.FORM_FIELDS.nonce),'stable-nonce');
  }finally{global.fetch=old;}
});
test('top 20 displaces the lowest score and preserves earlier ties',async()=>{
 const entries=Array.from({length:20},(_,i)=>publicRow({approvedAt:`2026-09-13T12:00:${String(i).padStart(2,'0')}.000Z`,score:2000-i*10,playerName:'ABC0'}));
 assert.equal(S.qualifies(entries,1810),false);assert.equal(S.qualifies(entries,1811),true);assert.equal(S.qualifies(entries.slice(0,19),1),true);
 const old=global.fetch;global.fetch=async()=>({ok:true,text:async()=>csv([...entries,publicRow({approvedAt:'2026-09-13T12:01:00.000Z',score:3000,playerName:'NEW1'})])});
 try{const board=await S.leaderboard();assert.equal(board.length,20);assert.equal(board[0].score,3000);assert.equal(board[19].score,1820);}finally{global.fetch=old;}
});
test('rank requires an unambiguous matching public entry',()=>{
 const row=S.payload(result,'ABC',0);assert.equal(S.verifiedRank([row],result,'ABC0'),1);
 assert.equal(S.verifiedRank([{...row,durationMs:100}],result,'ABC0'),null);assert.equal(S.verifiedRank([row,row],result,'ABC0'),null);
 assert.match(S.caption({...result,rank:3,playerLabel:'ABC 🐕'}),/Top 20 high score · #3/);assert.match(S.caption({...result,personalBest:true}),/New personal best/);assert.doesNotMatch(S.caption(result),/high score|personal best/);
});
test('whimsical picker keeps stable badge IDs',()=>{
 assert.equal(S.PICKER_BADGES.length,10);assert.equal(S.encodeName('ABC',10),'ABCA');assert.equal(S.decodeName('ABC5'),'ABC 🥾');assert.ok(S.PICKER_BADGES.map(i=>S.BADGES[i]).includes('🐺'));
});
test('profile drafts survive reopening and reloads without score submission',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 S.saveProfile({initials:'KEV',badge:10},storage);assert.deepEqual(S.readProfile(storage),{initials:'KEV',badge:10});S.saveProfile({initials:'KE',badge:19},storage);assert.deepEqual(S.readProfile(storage),{initials:'KE',badge:19});
 values.set('aw-rescue-badge','999');assert.equal(S.readProfile(storage).badge,0);const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};assert.deepEqual(S.readProfile(blocked),{initials:'',badge:0});assert.doesNotThrow(()=>S.saveProfile({initials:'ABC',badge:1},blocked));
});
test('leaderboard retries a transient failure without writing a score',async()=>{
 const old=global.fetch;let calls=0;const urls=[];global.fetch=async(url,options)=>{calls++;urls.push(url);assert.notEqual(options.method,'POST');if(calls===1)throw new TypeError('Failed to fetch');return{ok:true,text:async()=>csv([])};};
 try{assert.deepEqual(await S.leaderboard(),[]);assert.equal(calls,2);assert.notEqual(urls[0],urls[1]);}finally{global.fetch=old;}
});
test('leaderboard stops after two failed reads and reports a refresh error',async()=>{
 const old=global.fetch;let calls=0;global.fetch=async()=>{calls++;return{ok:false,text:async()=>''};};try{await assert.rejects(S.leaderboard(),/Could not refresh/);assert.equal(calls,2);}finally{global.fetch=old;}
});
test('old-house-rule scores and bonuses remain unchanged when the leaderboard is read',async()=>{
 const entries=[publicRow({playerName:'WJMB',score:5062,missionTitle:'Home safe · Pip rested 2/3 · bonus 250',version:'rescue-2.26'}),publicRow({playerName:'LKYC',score:4430,missionTitle:'Home safe · Pip rested 3/3 · bonus 650',version:'rescue-2.38'})],old=global.fetch;
 global.fetch=async()=>({ok:true,text:async()=>csv(entries)});try{const board=await S.leaderboard();assert.deepEqual(board.map(e=>[e.score,e.missionTitle]),entries.map(e=>[e.score,e.missionTitle]));}finally{global.fetch=old;}
});
test('daily payload identifies its seed day and never reuses the free-play category',()=>{
  const p=S.payload({...result,challengeDate:'2026-09-14',dailyStartedAt:Date.parse('2026-09-14T18:00:00Z')},'ABC',0);assert.equal(p.gameMode,D.MODE);assert.equal(p.dailyRuleset,D.RULESET);assert.match(p.missionTitle,/^Daily 2026-09-14 · Pip barks saved/);assert.equal(S.payload(result,'ABC',0).gameMode,S.MODE);
});
test('daily, weekly and yesterday views are calculated from the approved public feed',async()=>{
 const today=D.dayKey(),yesterday=D.shiftDay(today,-1),entries=[publicRow({approvedAt:today+'T18:00:00Z',playerName:'ABC0',score:5000,gameMode:D.MODE,missionTitle:`Daily ${today} · Pip rested 3/3 · bonus 1000`}),publicRow({approvedAt:today+'T19:00:00Z',playerName:'ABC0',score:4500,gameMode:D.MODE,missionTitle:`Daily ${today} · Pip rested 2/3 · bonus 0`}),publicRow({approvedAt:yesterday+'T18:00:00Z',playerName:'WIN0',score:4000,gameMode:D.MODE,missionTitle:`Daily ${yesterday} · Pip rested 3/3 · bonus 1000`})],old=global.fetch;
 global.fetch=async()=>({ok:true,text:async()=>csv(entries)});try{const daily=await S.board('daily',today),weekly=await S.board('weekly',today);assert.deepEqual(daily.entries.map(e=>e.score),[5000]);assert.equal(weekly.entries[0].score,5000);assert.equal(daily.yesterday.playerName,'WIN0');assert.equal(daily.api,'daily-1');}finally{global.fetch=old;}
});

test('all-time daily records read existing sheet history without submitting or changing records',async()=>{
 const today=D.dayKey(),past=D.shiftDay(today,-14),entries=[publicRow({approvedAt:past+'T18:00:00Z',playerName:'ABC0',score:5000,gameMode:D.MODE,missionTitle:`Daily ${past} · Pip rested 3/3 · bonus 1000`}),publicRow({approvedAt:today+'T18:00:00Z',playerName:'ABC0',score:4800,gameMode:D.MODE,missionTitle:`Daily ${today} · Pip rested 3/3 · bonus 1000`}),publicRow({playerName:'OLD0',score:8000})],original=JSON.stringify(entries),old=global.fetch;
 global.fetch=async(url,options)=>{assert.notEqual(options.method,'POST');return{ok:true,text:async()=>csv(entries)};};
 try{const board=await S.board('daily-alltime');assert.deepEqual(board.entries.map(e=>[e.score,e.challengeDate]),[[5000,past],[4800,today]]);assert.equal(JSON.stringify(entries),original);}finally{global.fetch=old;}
});
