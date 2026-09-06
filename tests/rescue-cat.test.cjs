const test=require('node:test'),assert=require('node:assert/strict'),R=require('../rescue-engine');
const seeded=n=>()=>((n=(n*1664525+1013904223)>>>0)/4294967296);
function fixture(turns=3){const s=R.create(1,()=>.4);s.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%3);s.board[12]=R.CAT;s.catTurns=turns;s.board[33]=s.board[34]=s.board[35]=0;s.distance=10;return s;}
test('the cat cannot be selected as a herd and invalid moves do not age it',()=>{
 const s=fixture(),before=structuredClone(s);assert.deepEqual(R.group(s.board,12),[]);assert.equal(R.rescue(s,12).ok,false);assert.deepEqual(s,before);
});
test('cat counts successful rescues and expiration collapses its column with no cat score',()=>{
 const s=fixture(1),before=s.board.slice(),count=R.group(s.board,33).length;
 const result=R.rescue(s,33,()=>.7);assert.equal(result.catRemoved,12);assert.equal(s.catTurns,0);assert.ok(!s.board.includes(R.CAT));
 assert.equal(s.board[12],before[6]);assert.equal(s.board[6],before[0]);assert.equal(s.board[18],before[18]);
 assert.equal(s.score,R.herdPoints(count));assert.equal(s.saved.reduce((a,b)=>a+b),count);
});
test('Pip removes the cat through gravity without shuffling other columns or adding points',()=>{
 const s=fixture(),before=s.board.slice();assert.equal(R.bark(s,()=>.7),true);
 assert.equal(s.catTurns,0);assert.equal(s.bark,0);assert.equal(s.moves,0);assert.equal(s.score,0);
 for(let i=0;i<36;i++)if(i%6!==0)assert.equal(s.board[i],before[i]);
 assert.equal(s.board[12],before[6]);assert.equal(s.board[6],before[0]);assert.equal(R.bark(s),false);
});
test('a carried cat retains its remaining lifetime and the entry board is independent',()=>{
 const s=fixture(2),next=R.create(2,()=>.7,s.board,s.catTurns);assert.equal(next.catTurns,2);assert.deepEqual(next.board,s.board);assert.notEqual(next.board,s.board);
 R.rescue(next,33,()=>.7);assert.equal(next.catTurns,1);assert.equal(s.catTurns,2);
});
test('no-move rescue preserves the cat when gathering a legal herd',()=>{
 const s=fixture();s.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%3);s.board[31]=R.CAT;
 // Force a small distant group, with a refill that can require ensureMove.
 s.board[0]=s.board[1]=s.board[2]=1;R.rescue(s,0,()=>.7);
 assert.equal(s.board.filter(t=>t===R.CAT).length,1);assert.equal(s.catTurns,2);assert.ok(R.groups(s.board).length);
});
test('random arrivals stay limited to one cat, with 2–4 rescues, and never visit field one',()=>{
 let appeared=0;
 for(let seed=1;seed<=100;seed++)for(let chapter=0;chapter<3;chapter++){
  const rng=seeded(seed),s=R.create(chapter,rng);
  while(s.status==='playing'&&s.moves<40){
   const groups=R.groups(s.board);const r=R.rescue(s,groups[0][0],rng);
   assert.ok(s.board.filter(t=>t===R.CAT).length<=1);
   if(chapter===0)assert.ok(!s.board.includes(R.CAT));
   if(r.catAppeared>=0){appeared++;assert.ok(s.catTurns>=2&&s.catTurns<=4);assert.equal(s.board[r.catAppeared],R.CAT);}
  }
 }
 assert.ok(appeared>50);
});
