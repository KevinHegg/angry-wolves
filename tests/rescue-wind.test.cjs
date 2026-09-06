const test=require('node:test'),assert=require('node:assert/strict'),R=require('../rescue-engine');
const seeded=n=>()=>((n=(n*1664525+1013904223)>>>0)/4294967296);
test('clockwise rotation preserves animals at interior, edges and corners',()=>{
 for(let i=0;i<36;i++){
  const board=Array.from({length:36},(_,n)=>n%4);board[i]=R.DUST;const before=board.slice(),ring=R.windRing(board,i);
  assert.ok(ring.length>=2&&ring.length<=4);R.rotateWind(board,i);
  ring.forEach((n,j)=>assert.equal(board[ring[(j+1)%ring.length]],before[n]));
  for(let n=0;n<36;n++)if(!ring.includes(n))assert.equal(board[n],before[n]);
 }
 assert.deepEqual(R.windRing(Array(36).fill(0),2),[3,8,1]);
 assert.deepEqual(R.windRing(Array(36).fill(0),14),[8,15,20,13]);
});
test('three successful rescues rotate an existing gust, then replace only its tile without scoring',()=>{
 const s=R.create(2,seeded(12));s.board[0]=R.DUST;s.cats={0:3};s.catSettings={...R.WIND_SETTINGS,enabled:false};s.distance=10;
 for(let turn=1;turn<=3;turn++){
  const before=s.score,g=R.groups(s.board).sort((a,b)=>b.length-a.length)[0],r=R.rescue(s,g[0],()=>.6);
  assert.equal(r.rotations.length,1);assert.equal(r.rotations[0].completed,turn);assert.equal(s.score-before,R.herdPoints(g.length));
  assert.equal(r.burstCats.length,0);assert.equal(r.gifts.length,turn===3?1:0);
  if(turn===3){assert.deepEqual(s.cats,{});assert.ok(!s.board.includes(R.DUST));assert.equal(r.gifts[0].cells.length,1);}
  else assert.deepEqual(Object.values(s.cats),[3-turn]);
 }
});
test('replacement selects largest connected herd and randomly breaks equal-size ties',()=>{
 const s=R.create(2,()=>.2);s.board=Array(36).fill(0);s.board[14]=R.DUST;
 assert.equal(R.windGift(s,14,()=>.9).type,0);assert.equal(R.windGift(s,14).size,36);
 // Opposite neighbors give sheep and pigs equal connected herd sizes.
 s.board=Array(36).fill(R.DUST);s.board[8]=0;s.board[20]=1;
 assert.equal(R.windGift(s,14,()=>0).type,0);assert.equal(R.windGift(s,14,()=>.999).type,1);
});
test('gusts carry progress, ignore selections, and Pip clears them without rotation',()=>{
 const s=R.create(1,seeded(2));s.board[7]=R.DUST;s.cats={7:2};
 assert.deepEqual(R.group(s.board,7),[]);const before=structuredClone(s);assert.equal(R.rescue(s,7).ok,false);assert.deepEqual(s,before);
 const next=R.create(2,seeded(3),s.board,s.cats);assert.deepEqual(next.cats,{7:2});R.bark(next);assert.deepEqual(next.cats,{});assert.equal(next.moves,0);assert.equal(next.score,0);
});
test('new gusts start empty, never rotate on arrival, and replace cat visits',()=>{
 let seen=0;
 for(let seed=1;seed<=100;seed++){
 const rng=seeded(seed),s=R.create(1,rng);
 while(s.status==='playing'){
 const r=R.rescue(s,R.groups(s.board)[0][0],rng);assert.ok(!s.board.some(R.isCat));assert.ok(Object.keys(s.cats).length<=1);
 if(r.catAppeared>=0){seen++;assert.equal(s.board[r.catAppeared],R.DUST);assert.equal(s.cats[r.catAppeared],3);assert.equal(r.rotations.length,0);}
 }
 }assert.ok(seen>20);
});
