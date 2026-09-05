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
  for (const size of [3,4,5,7,8]) {
    const s=setup(size); const group=R.group(s.board,0).length;
    const result=R.rescue(s,0,random(12));
    assert.equal(result.count,size);
    assert.equal(result.count,group);
    assert.equal(s.distance,5+(group===3?-2:group===4?-1:group<8?0:1));
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
test('bark is free, limited to one per field, and capped at ten steps', () => {
  const s=R.create(2); const before=[...s.board].sort();
  assert.equal(R.bark(s,random(1)),true); assert.equal(s.distance,9); assert.equal(s.moves,0);
  assert.deepEqual([...s.board].sort(),before); assert.equal(R.bark(s),false);
  const s2=R.create(); R.bark(s2); assert.equal(s2.distance,10);
});
test('last-step objective completion wins before wolf arrival', () => {
  const s=setup(3,1); s.saved=[10,10,9,10]; R.rescue(s,0,random(8)); assert.equal(s.status,'won');
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
      assert.equal(s.board.length,36); assert.ok(s.board.every(t=>t>=0 && t<R.CHAPTERS[chapter].types));
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
