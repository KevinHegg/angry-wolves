const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../rescue-engine.js');
function random(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
function striped() { return Array.from({length:36}, (_,i) => (i % 6 + Math.floor(i / 6)) % 3); }
function setup(size, distance=5) { const s = R.create(2); s.board = Array.from({length:36}, (_,i)=>(i%6+Math.floor(i/6))%2); for(let i=0;i<size;i++) s.board[i]=2; s.distance=distance; return s; }
test('groups connect along edges, never diagonally or across row boundaries', () => {
  const b = striped(); assert.equal(R.group(b, 0).length,1);
  b[5]=b[6]=2; assert.ok(!R.group(b,5).includes(6));
  b[0]=b[1]=b[7]=1; assert.ok(R.group(b,0).includes(7));
});
test('invalid and short groups are free and leave state unchanged', () => {
  const s=R.create(); s.board=striped(); const before=structuredClone(s);
  assert.equal(R.rescue(s,0).ok,false); assert.equal(R.rescue(s,-1).ok,false); assert.deepEqual(s,before);
});
test('herd sizes apply exactly the displayed wolf movement', () => {
  for (const size of [3,4,5,6,7,8]) {
    const s=setup(size); const group=R.group(s.board,0).length;
    const result=R.rescue(s,0,random(12));
    assert.equal(result.count,size);
    assert.equal(result.count,group);
    assert.equal(s.distance,5+(group<=4?-1:group<7?0:1));
    assert.equal(s.saved[2],group);
  }
});
test('gravity preserves remaining column order and fills only cleared slots', () => {
  const s=R.create(2); s.board=striped(); s.board[30]=s.board[31]=s.board[32]=2;
  const old=[...s.board], cleared=new Set(R.group(old,30));
  R.rescue(s,30,random(4));
  for(let col=0;col<6;col++){
    const remaining=Array.from({length:6},(_,r)=>r*6+col).filter(i=>!cleared.has(i)).map(i=>old[i]);
    const now=Array.from({length:remaining.length},(_,r)=>s.board[(6-remaining.length+r)*6+col]);
    assert.deepEqual(now,remaining);
  }
});
test('bark is free, limited to three per game, and capped at ten steps', () => {
  const s=R.create(2); const before=[...s.board].sort();
  assert.equal(R.bark(s,random(1)),true); assert.equal(s.distance,R.CHAPTERS[2].distance+3); assert.equal(s.moves,0);
  assert.deepEqual([...s.board].sort(),before);assert.equal(s.bark,2);
  assert.equal(R.bark(s),true);assert.equal(R.bark(s),true);assert.equal(s.bark,0);assert.equal(R.bark(s),false);
  const s2=R.create(); s2.distance=9; R.bark(s2); assert.equal(s2.distance,10);
});
test('last-step objective completion wins before wolf arrival', () => {
  const s=setup(3,1); s.saved=R.CHAPTERS[2].goal.slice(); s.saved[2]-=3; R.rescue(s,0,random(8)); assert.equal(s.status,'won');
});
test('wolf arrival loses, and finished fields reject further actions', () => {
  const s=setup(3,1); R.rescue(s,0,random(8)); assert.equal(s.status,'lost');
  const before=structuredClone(s); assert.equal(R.rescue(s,3).ok,false); assert.equal(R.bark(s),false); assert.deepEqual(s,before);
});
test('thousands of turns stay valid and always offer a legal herd', () => {
  for(let seed=0;seed<100;seed++)for(let chapter=0;chapter<3;chapter++){
    const rng=random(seed+1),s=R.create(chapter,rng);
    for(let turn=0;turn<80 && s.status==='playing';turn++){
      const gs=R.groups(s.board); assert.ok(gs.length);
      if(s.distance<=2 && s.bark) R.bark(s,rng);
      const legal=R.groups(s.board); R.rescue(s,legal[Math.floor(rng()*legal.length)][0],rng);
      assert.equal(s.board.length,36); assert.ok(s.board.every(t=>R.isSpecial(t) || (t>=0 && t<R.CHAPTERS[chapter].types)));
      assert.ok(s.distance>=0 && s.distance<=10); assert.ok(Number.isFinite(s.score));
    }
  }
});

test('Pip rest bonuses match the four promised tiers', () => {
  assert.deepEqual([0,1,2,3].map(R.restBonus),[0,100,250,500]);
});
test('biggest herd keeps its animal and survives smaller later rescues', () => {
  const s=setup(8); R.rescue(s,0,random(2));
  assert.deepEqual(s.biggest,{count:8,type:2});
  s.board=Array.from({length:36},(_,i)=>(i%6+Math.floor(i/6))%2);s.board[0]=s.board[1]=s.board[2]=3;
  R.rescue(s,0,random(3));assert.deepEqual(s.biggest,{count:8,type:2});
});

test('field transitions preserve every tile without aliasing the previous board',()=>{
 const before=R.create(0,()=>.2);before.board[12]=2;
 const next=R.create(1,()=>{throw Error('must not generate a new board')},before.board,before.cats,undefined,before.windWait);
 assert.deepEqual(next.board,before.board);assert.notEqual(next.board,before.board);
 assert.equal(next.chapter,1);assert.deepEqual(next.saved,[0,0,0,0]);assert.equal(next.moves,0);assert.equal(next.bark,3);
});
test('herd point previews equal the awarded score',()=>{
 const state=R.create(0,()=>.5);const herd=R.groups(state.board)[0];const expected=R.herdPoints(herd.length);
 const result=R.rescue(state,herd[0],()=>.5);assert.equal(result.ok,true);assert.equal(state.score,expected);
});
test('even endless large non-goal herds cannot farm a field indefinitely',()=>{
 const state=R.create(0,()=>.5);
 while(state.status==='playing'&&state.moves<50){state.board.fill(1);if(state.distance<=2&&state.bark)R.bark(state,()=>.5);R.rescue(state,0,()=>.5);}
 assert.equal(state.status,'lost');assert.ok(state.moves<=44); // Three barks add at most nine extra moves under full pressure.
 assert.equal(R.pressure(17),0);assert.equal(R.pressure(18),1);assert.equal(R.pressure(26),2);
});

test('opening boards balance the three pasture animals without favoring sheep and always offer a herd',()=>{
 const totals=[0,0,0],mixes=new Set();
 for(let seed=1;seed<=1000;seed++){
  const s=R.create(0,random((seed*2654435761)>>>0)),counts=[0,0,0];assert.ok(s.board.every(t=>t<3));s.board.forEach(t=>counts[t]++);
  assert.equal(s.board.length,36);assert.ok(counts.every(n=>n>=11&&n<=13));
  assert.ok(!counts.every(n=>n===12));assert.ok(R.groups(s.board).length);
  counts.forEach((n,t)=>totals[t]+=n);mixes.add(counts.join(','));
 }
 assert.equal(mixes.size,6);assert.ok(Math.max(...totals)-Math.min(...totals)<500);
 for(const rng of [()=>0,()=>.5,()=>.999])assert.ok(R.groups(R.create(0,rng).board).length);
});

test('pasture refills have three species and cows join from the orchard',()=>{
 for(let chapter=0;chapter<3;chapter++){
  const types=chapter===0?3:4;assert.equal(R.CHAPTERS[chapter].types,types);
  for(let type=0;type<types;type++){
   const state=R.create(chapter,random(10));state.board=striped();
   state.board[30]=state.board[31]=state.board[32]=0;
   state.catSettings={...R.WIND_SETTINGS,enabled:false};
   R.rescue(state,30,()=>(type+.5)/types);
   assert.equal(state.board[0],type);assert.equal(state.board[1],type);assert.equal(state.board[2],type);
  }
 }
});

test('late-field pressure still adds to the revised wolf movement',()=>{
 for(const moves of [17,25])for(const size of [3,4,6,7]){
  const s=setup(size);s.moves=moves;R.rescue(s,0,random(12));
  assert.equal(s.distance,5+(size<=4?-1:size<7?0:1)-(moves===17?1:2));
 }
});
