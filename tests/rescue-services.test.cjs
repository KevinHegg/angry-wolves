const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../rescue-services.js');
const result={score:1750,rested:2,bonus:250,biggest:{count:14,type:1},saved:91,moves:17,durationMs:180000,nonce:'stable-nonce'};
test('all ten badges round-trip through the existing alphanumeric name column',()=>{
  for(let i=0;i<10;i++){assert.equal(S.encodeName('abc',i),'ABC'+i);assert.equal(S.decodeName('ABC'+i),'ABC '+S.BADGES[i]);}
  for(const name of ['AB','ABCD','A1C','<b>'])assert.throws(()=>S.encodeName(name,0));
  assert.throws(()=>S.encodeName('ABC',20));assert.throws(()=>S.encodeName('ABC',-1));
});
test('score payload uses the new category and the actual completed-run metrics',()=>{
  const p=S.payload(result,'ABC',3);assert.equal(p.gameMode,'rescue-v2');assert.equal(p.score,1750);
  assert.equal(p.durationMs,180000);assert.equal(p.nonce,'stable-nonce');assert.equal(p.biggestHerdAnimal,'🐷');
  assert.equal(p.biggestHerdCount,14);assert.match(p.missionTitle,/rested 2\/3/);
});
test('share caption includes the score, herd animal, bonus and public link',()=>{
  const text=S.caption(result);for(const expected of ['1,750','14 🐷','+250',S.GAME_URL])assert.ok(text.includes(expected));
});
test('leaderboard filters other game modes and malformed identities',async()=>{
  const old=global.fetch;
  global.fetch=async()=>({ok:true,json:async()=>({ok:true,entries:[{gameMode:S.MODE,playerName:'ABC1',score:120},{gameMode:'standard',playerName:'ZZZ1',score:900},{gameMode:S.MODE,playerName:'<script>',score:800}]})});
  try{assert.equal((await S.leaderboard()).length,1);}finally{global.fetch=old;}
});
test('pending moderation and duplicate submissions never claim a public ranking',async()=>{
  const old=global.fetch;
  try{
    global.fetch=async()=>({ok:true,json:async()=>({ok:true,status:'suspect',promoted:false})});
    assert.equal((await S.submit(result,'ABC',0)).status,'review');
    global.fetch=async()=>({ok:true,json:async()=>({ok:false,reasons:['replay_nonce']})});
    assert.equal((await S.submit(result,'ABC',0)).status,'received');
  }finally{global.fetch=old;}
});
test('top 20 displaces the lowest score and preserves earlier ties',async()=>{
 const entries=Array.from({length:20},(_,i)=>({score:2000-i*10,gameMode:S.MODE,playerName:'ABC0'}));
 assert.equal(S.qualifies(entries,1810),false);assert.equal(S.qualifies(entries,1811),true);assert.equal(S.qualifies(entries.slice(0,19),1),true);
 const old=global.fetch;global.fetch=async()=>({ok:true,json:async()=>({ok:true,entries:[...entries,{score:3000,gameMode:S.MODE,playerName:'NEW1'}]})});
 try{const board=await S.leaderboard();assert.equal(board.length,20);assert.equal(board[0].score,3000);assert.equal(board[19].score,1820);}finally{global.fetch=old;}
});
test('rank requires an unambiguous matching public entry',()=>{
 const row=S.payload(result,'ABC',0);
 assert.equal(S.verifiedRank([row],result,'ABC0'),1);
 assert.equal(S.verifiedRank([{...row,durationMs:100}],result,'ABC0'),null);
 assert.equal(S.verifiedRank([row,row],result,'ABC0'),null);
 assert.match(S.caption({...result,rank:3,playerLabel:'ABC 🐕'}),/Top 20 high score · #3/);
 assert.match(S.caption({...result,personalBest:true}),/New personal best/);
 assert.doesNotMatch(S.caption(result),/high score|personal best/);
});

test('whimsical badges use stable alphanumeric IDs and keep legacy badges intact',()=>{
 assert.equal(S.PICKER_BADGES.length,10);
 for(let i=0;i<S.BADGES.length;i++)assert.equal(S.decodeName(S.encodeName('ABC',i)),`ABC ${S.BADGES[i]}`);
 assert.equal(S.encodeName('ABC',10),'ABCA');assert.equal(S.decodeName('ABC5'),'ABC 🥾');
 assert.ok(S.PICKER_BADGES.map(i=>S.BADGES[i]).includes('🐺'));
});
test('profile drafts survive reopening and reloads without score submission',()=>{
 const values=new Map();const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 S.saveProfile({initials:'KEV',badge:10},storage);assert.deepEqual(S.readProfile(storage),{initials:'KEV',badge:10});
 S.saveProfile({initials:'KE',badge:19},storage);assert.deepEqual(S.readProfile(storage),{initials:'KE',badge:19});
 values.set('aw-rescue-badge','999');assert.equal(S.readProfile(storage).badge,0);
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 assert.deepEqual(S.readProfile(blocked),{initials:'',badge:0});assert.doesNotThrow(()=>S.saveProfile({initials:'ABC',badge:1},blocked));
});
