const test=require('node:test'),assert=require('node:assert/strict'),R=require('../rescue-engine');
const seeded=n=>()=>((n=(n*1664525+1013904223)>>>0)/4294967296);
function fixture(cats={12:3}){const s=R.create(1,()=>.4);s.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%3);s.cats={...cats};for(const i of Object.keys(cats))s.board[i]=R.CAT;s.board[33]=s.board[34]=s.board[35]=0;s.distance=10;return s;}
test('cats cannot form herds and invalid moves do not age them',()=>{
 const s=fixture(),before=structuredClone(s);assert.deepEqual(R.group(s.board,12),[]);assert.equal(R.rescue(s,12).ok,false);assert.deepEqual(s,before);
});
test('a burst rescues orthogonal animals for goals but only the selected herd earns points',()=>{
 const s=fixture({12:1}),count=R.group(s.board,33).length;
 const result=R.rescue(s,33,()=>.7);assert.deepEqual(result.burstCats,[12]);assert.deepEqual(new Set(result.burstAnimals),new Set([6,13,18]));assert.deepEqual(s.cats,{});
 assert.equal(s.score,R.herdPoints(count));assert.equal(s.saved.reduce((a,b)=>a+b),count+3);assert.equal(s.distance,10+R.wolfStep(count)-1);
});
test('overlapping bursts rescue each neighbor once and each cat adds wolf pressure',()=>{
 const s=fixture({12:1,14:1}),count=R.group(s.board,33).length;
 const result=R.rescue(s,33,()=>.7);assert.equal(result.burstCats.length,2);assert.equal(result.burstAnimals.filter(i=>i===13).length,1);
 assert.equal(s.saved.reduce((a,b)=>a+b),count+result.burstAnimals.length);assert.equal(s.distance,10+R.wolfStep(count)-2);
});
test('bursts do not chain and surviving cat timers follow gravity',()=>{
 const s=fixture({12:1,13:3,1:4});const result=R.rescue(s,33,()=>.7);
 assert.deepEqual(result.burstCats,[12]);assert.equal(Object.keys(s.cats).length,2);assert.deepEqual(Object.values(s.cats).sort(),[2,3]);
 for(const i of Object.keys(s.cats))assert.equal(s.board[i],R.CAT);
});
test('animals shared by the selected herd and a burst count only once',()=>{
 const s=fixture({27:1});const g=R.group(s.board,33),result=R.rescue(s,33,()=>.7);
 assert.ok(g.includes(33));assert.ok(!result.burstAnimals.includes(33));assert.equal(s.saved.reduce((a,b)=>a+b),g.length+result.burstAnimals.length);
});
test('Pip quietly removes every cat without scoring, advancing timers, or shuffling other columns',()=>{
 const s=fixture({12:1,13:3,24:2}),before=s.board.slice();s.distance=3;assert.equal(R.bark(s,()=>.7),true);
 assert.deepEqual(s.cats,{});assert.ok(!s.board.includes(R.CAT));assert.equal(s.distance,6);assert.equal(s.bark,0);assert.equal(s.moves,0);assert.equal(s.score,0);assert.deepEqual(s.saved,[0,0,0,0]);
 for(let i=0;i<36;i++)if(i%6>1)assert.equal(s.board[i],before[i]);assert.equal(R.bark(s),false);
});
test('carried cats retain independent lifetimes and the entry board is independent',()=>{
 const s=fixture({12:2,13:4}),next=R.create(2,()=>.7,s.board,s.cats);assert.deepEqual(next.cats,s.cats);assert.deepEqual(next.board,s.board);assert.notEqual(next.board,s.board);
 R.rescue(next,33,()=>.7);assert.deepEqual(Object.values(next.cats).sort(),[1,3]);assert.deepEqual(s.cats,{12:2,13:4});
});
test('random arrivals cap at three with independent 2–4 rescue timers and never visit field one',()=>{
 let appeared=0,max=0;
 for(let seed=1;seed<=100;seed++)for(let chapter=0;chapter<3;chapter++){
  const rng=seeded(seed),s=R.create(chapter,rng);
  while(s.status==='playing'&&s.moves<40){
   const groups=R.groups(s.board),r=R.rescue(s,groups[0][0],rng),count=Object.keys(s.cats).length;max=Math.max(max,count);
   assert.ok(count<=3);assert.equal(s.board.filter(t=>t===R.CAT).length,count);assert.ok(R.groups(s.board).length);
   for(const [i,t] of Object.entries(s.cats)){assert.equal(s.board[i],R.CAT);assert.ok(t>=1&&t<=4);}
   if(chapter===0)assert.equal(count,0);
   if(r.catAppeared>=0){appeared++;assert.ok(s.cats[r.catAppeared]>=2&&s.cats[r.catAppeared]<=4);}
  }
 }
 assert.ok(appeared>50);assert.equal(max,3);
});
