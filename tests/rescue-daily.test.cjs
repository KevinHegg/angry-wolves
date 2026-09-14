const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../rescue-daily'),R=require('../rescue-engine');
const row=(name,score,date,extra={})=>({playerName:name,score,gameMode:D.MODE,missionTitle:`Daily ${date} · Pip rested 3/3 · bonus 1000`,approvedAt:date+'T18:00:00Z',biggestHerdCount:12,biggestHerdAnimal:'🐑',...extra});
test('Eastern dates roll at midnight through both daylight-saving changes',()=>{
 for(const [time,day]of [['2026-03-08T04:59:59Z','2026-03-07'],['2026-03-08T05:00:00Z','2026-03-08'],['2026-03-09T03:59:59Z','2026-03-08'],['2026-03-09T04:00:00Z','2026-03-09'],['2026-11-01T04:00:00Z','2026-11-01'],['2026-11-02T04:59:59Z','2026-11-01'],['2026-11-02T05:00:00Z','2026-11-02']])assert.equal(D.dayKey(time),day);
 assert.equal(D.shiftDay('2026-12-31',1),'2027-01-01');assert.equal(D.weekStart('2027-01-03'),'2026-12-28');assert.equal(D.weekStart('2027-01-04'),'2027-01-04');assert.equal(D.validDay('2026-02-30'),false);
});
test('daily openings repeat, differ by date, and use only the three pasture species',()=>{
 const a=R.create(0,D.streams('2026-09-14',0)),b=R.create(0,D.streams('2026-09-14',0));assert.deepEqual(a,b);
 assert.notDeepEqual(a.board,R.create(0,D.streams('2026-09-15',0)).board);assert.ok(a.board.every(t=>t<3));assert.ok(R.groups(a.board).length);
});
test('separate fields, wind and Pip streams do not consume animal arrivals',()=>{
 const a=D.streams('2026-09-14',0),b=D.streams('2026-09-14',0);
 for(let i=0;i<100;i++){a.wind();a.regroup();}assert.equal(a.animals(),b.animals());
 for(let i=0;i<100;i++)a.animals();assert.deepEqual(R.create(1,D.streams('2026-09-14',1)),R.create(1,D.streams('2026-09-14',1)));
 const saved=a.snapshot(),restored=D.streams('2026-09-14',0,saved);for(let i=0;i<10;i++)for(const key of ['animals','wind','regroup'])assert.equal(a[key](),restored[key]());
});
test('identical moves repeat throughout a daily adventure with cow refills and wind',()=>{
 function run(){let state=R.create(0,D.streams('2026-09-14',0)),rng=D.streams('2026-09-14',0);state=R.create(0,rng);const frames=[];
  for(let step=0;step<120&&state.status==='playing';step++){
   const goal=R.CHAPTERS[state.chapter].goal,groups=R.groups(state.board).sort((a,b)=>{
    const value=g=>g.length+3*Math.min(g.length,Math.max(0,goal[state.board[g[0]]]-state.saved[state.board[g[0]]]));return value(b)-value(a);
   });if(state.distance<=2&&state.bark)R.bark(state,rng);
   const group=R.groups(state.board).find(g=>g[0]===groups[0]?.[0])||R.groups(state.board)[0];if(!group)break;
   R.rescue(state,group[0],rng);frames.push(JSON.stringify(state));
   if(state.status==='won'&&state.chapter<2){const prev=state;rng=D.streams('2026-09-14',prev.chapter+1);state=R.create(prev.chapter+1,rng,prev.board,prev.cats,undefined,prev.windWait,prev.bark);state.distance=prev.distance;assert.deepEqual(state.board,prev.board);}
  }return frames;
 }const a=run(),b=run();assert.deepEqual(a,b);assert.ok(a.length>8);
});
test('daily best, weekly totals, archive and yesterday use full history before limiting',()=>{
 const entries=[row('AAA0',5000,'2026-09-14'),row('AAA0',3000,'2026-09-14'),row('BBB1',4000,'2026-09-14'),row('BBB1',4500,'2026-09-15'),row('AAA0',2000,'2026-09-15')];
 const original=JSON.stringify(entries);assert.deepEqual(D.standings(entries,'daily','2026-09-14').map(e=>e.score),[5000,4000]);
 assert.deepEqual(D.standings(entries,'weekly','2026-09-15').map(e=>[e.playerName,e.score,e.daysPlayed]),[['BBB1',8500,2],['AAA0',7000,2]]);
 assert.deepEqual(D.standings(entries,'winners','2026-09-16').map(e=>[e.playerName,e.score,e.challengeDate]),[['AAA0',5000,'2026-09-14'],['BBB1',4500,'2026-09-15']]);
 assert.equal(D.standings(entries,'winners','2026-09-15').length,1);assert.equal(D.standings(entries,'daily','2026-09-13','2026-09-16').length,0);assert.equal(JSON.stringify(entries),original);
 const many=Array.from({length:80},(_,i)=>row('AAA0',9000-i,'2026-09-14')).concat(row('BBB1',100,'2026-09-14'));assert.equal(D.standings(many,'daily','2026-09-14').length,2);
});
test('old records are not recalculated and late approvals cannot change yesterday’s winner',()=>{
 const old={playerName:'WJMB',score:5062,gameMode:'rescue-v2',missionTitle:'Home safe · Pip rested 2/3 · bonus 250',version:'rescue-2.26'};
 const entries=[old,row('AAA0',4000,'2026-09-14'),row('BBB0',6000,'2026-09-14',{approvedAt:'2026-09-15T04:00:00Z'})];
 assert.deepEqual(D.standings(entries,'alltime','2026-09-15').map(e=>e.score),[6000,5062,4000]);assert.equal(D.standings(entries,'winners','2026-09-15')[0].playerName,'AAA0');assert.equal(old.score,5062);
 const tie=[row('BBB0',4000,'2026-09-14',{approvedAt:'2026-09-14T19:00:00Z'}),row('AAA0',4000,'2026-09-14')];assert.equal(D.standings(tie,'daily','2026-09-14')[0].playerName,'AAA0');
});

test('the carried pasture stays intact at the orchard gate and cows arrive through seeded refills',()=>{
 const day='2026-09-14',pasture=R.create(0,D.streams(day,0)),board=pasture.board.slice(),rng=D.streams(day,1),orchard=R.create(1,rng,board);
 assert.deepEqual(orchard.board,board);assert.ok(!orchard.board.includes(3));
 for(let i=0;i<10&&!orchard.board.includes(3);i++){orchard.distance=10;R.rescue(orchard,R.groups(orchard.board)[0][0],rng);}
 assert.ok(orchard.board.includes(3),'cows begin arriving when orchard spaces refill');
});
