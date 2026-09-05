const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../rescue-services.js');
const result={score:1750,rested:2,bonus:250,biggest:{count:14,type:1},saved:91,moves:17,durationMs:180000,nonce:'stable-nonce'};
test('all ten badges round-trip through the existing alphanumeric name column',()=>{
  for(let i=0;i<10;i++){assert.equal(S.encodeName('abc',i),'ABC'+i);assert.equal(S.decodeName('ABC'+i),'ABC '+S.BADGES[i]);}
  for(const name of ['AB','ABCD','A1C','<b>'])assert.throws(()=>S.encodeName(name,0));
  assert.throws(()=>S.encodeName('ABC',10));assert.throws(()=>S.encodeName('ABC',-1));
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
