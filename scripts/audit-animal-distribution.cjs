// Observe actual refill choices without changing production game state or RNG calls.
const fs=require('node:fs'),vm=require('node:vm');
const counts=Array.from({length:3},()=>[0,0,0,0]);
const source=fs.readFileSync(require.resolve('../rescue-engine.js'),'utf8');
const marker='state.board[i] = next;filled.push(i);';
if(!source.includes(marker))throw new Error('Refill audit hook needs updating');
const context={module:{exports:{}},record:(chapter,type)=>counts[chapter][type]++};
vm.runInNewContext(source.replace(marker,'record(state.chapter,next);'+marker),context);
const R=context.module.exports;let lastFields=0,entryCows=0;
for(let seed=1;seed<=2000;seed++){
 let n=seed;const rng=()=>((n=(n*1664525+1013904223)>>>0)/4294967296);let board=null,cats={},wait=null,distance=R.CHAPTERS[0].distance,barks=3;
 for(let chapter=0;chapter<3;chapter++){
  const s=R.create(chapter,rng,board,cats,undefined,wait,barks);s.distance=distance;
  if(chapter===2){lastFields++;entryCows+=s.board.filter(t=>t===3).length;}
  while(s.status==='playing'&&s.moves<100){
   if(s.distance<=2&&s.bark)R.bark(s,rng);
   const groups=R.groups(s.board),value=g=>g.length+2*Math.min(g.length,Math.max(0,R.CHAPTERS[chapter].goal[s.board[g[0]]]-s.saved[s.board[g[0]]]));
   groups.sort((a,b)=>value(b)-value(a));R.rescue(s,groups[0][0],rng);
  }
  if(s.status!=='won')break;board=s.board.slice();cats={...s.cats};wait=s.windWait;distance=s.distance;barks=s.bark;
 }
}
for(let chapter=0;chapter<3;chapter++){const total=counts[chapter].reduce((a,b)=>a+b);console.log(JSON.stringify({field:chapter+1,refills:total,counts:counts[chapter],percent:counts[chapter].map(n=>(100*n/total).toFixed(2))}));}
console.log(JSON.stringify({lastFields,averageCowsAtEntry:entryCows/lastFields}));
