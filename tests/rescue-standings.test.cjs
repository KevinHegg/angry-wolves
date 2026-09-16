const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../rescue-daily');
const now=Date.parse('2026-09-15T18:00:00Z'),day='2026-09-15';
const row=(playerName,score,date=day,extra={})=>({playerName,score,gameMode:D.MODE,missionTitle:`Daily ${date} · Pip rested 3/3 · bonus 1000`,approvedAt:date+'T18:00:00Z',...extra});
const summary=(rows,options={})=>D.summary(rows,'daily',day,{serverTime:now,...options});
test('full daily ranks count players, deduplicate before limiting, and move after a better result',()=>{
 const rows=Array.from({length:86},(_,i)=>row('A'+String.fromCharCode(65+Math.floor(i/26))+String.fromCharCode(65+i%26)+'0',9000-i));
 rows.push(row('AAA0',1),row('AAA0',8900),row('OLD0',99999,day,{gameMode:'standard'}));
 const player=rows[84].playerName,original=JSON.stringify(rows),first=summary(rows,{player});
 assert.equal(first.entries.length,20);assert.equal(first.total,86);assert.equal(first.participantCount,86);assert.equal(first.yourStanding.rank,85);
 assert.equal(first.entries.some(e=>e.isYou),false);assert.equal(first.yourStanding.isYou,true);
 const changed=summary([...rows,row(rows[85].playerName,10000)],{player});assert.equal(changed.yourStanding.rank,86);assert.equal(changed.participantCount,86);
 assert.equal(JSON.stringify(rows),original);assert.equal(first.entries[0].leading,true);assert.equal(first.winner,null);assert.equal(first.entries[0].winnerDate,'');
});
test('ties retain submission order and then identity order; unranked players get no invented rank',()=>{
 const rows=[row('BBB0',4000),row('AAA0',4000),row('EAR0',4000,day,{approvedAt:day+'T17:59:59Z'}),row('BBB0',4000,day,{approvedAt:day+'T19:00:00Z'})];
 const result=summary(rows,{player:'NON0'});assert.deepEqual(result.entries.map(e=>e.playerName),['EAR0','AAA0','BBB0']);assert.equal(result.yourStanding,null);assert.equal(result.participantCount,3);
 assert.equal(summary([]).entries.length,0);assert.equal(summary([]).participantCount,0);
});
test('shared closing times follow Eastern daylight saving and backend clock governs rollover',()=>{
 assert.equal(D.closesAt('2026-03-07'),'2026-03-08T05:00:00.000Z');assert.equal(D.closesAt('2026-03-08'),'2026-03-09T04:00:00.000Z');
 assert.equal(D.closesAt('2026-11-01'),'2026-11-02T05:00:00.000Z');
 const before=D.summary([], 'daily','',{serverTime:Date.parse('2026-09-15T03:59:59Z'),now});
 const after=D.summary([], 'daily','',{serverTime:Date.parse('2026-09-15T04:00:00Z'),now:0});
 assert.equal(before.today,'2026-09-14');assert.equal(after.today,day);assert.equal(after.status,'open');
 assert.equal(D.summary([],'daily','2026-09-14',{serverTime:Date.parse('2026-09-15T04:00:00Z')}).status,'finalizing');
 assert.throws(()=>D.summary([],'daily','2026-09-16',{serverTime:now}));
});
test('closed days finalize once, preserve earlier ties, and keep snapshots despite late arrivals',()=>{
 const rows=[row('BBB0',4000,'2026-09-14'),row('AAA0',4000,'2026-09-14'),row('LAG0',8000,'2026-09-14',{approvedAt:day+'T04:00:00Z'}),row('NEW0',6000)];
 const close=Date.parse(D.closesAt('2026-09-14'));
 assert.equal(D.finalize(rows,[],close+59999).length,0);
 const records=D.finalize(rows,[],close+60000);assert.equal(records.length,1);assert.equal(records[0].entries[0].playerName,'AAA0');
 assert.equal(D.finalize(rows,records,now).length,0);
 const extra=[...rows,row('TOP0',10000,'2026-09-14')],final=D.summary(extra,'daily','2026-09-14',{serverTime:now,finalizations:records});
 assert.equal(final.status,'finalized');assert.equal(final.entries[0].winnerDate,'2026-09-14');assert.equal(final.entries[0].leading,false);assert.equal(final.total,2);assert.equal(final.winner.playerName,'AAA0');
 const archive=D.summary(extra,'daily','',{serverTime:now,scope:'records',finalizations:records});assert.ok(archive.entries.some(e=>e.playerName==='LAG0'));
});
test('a device clock cannot finalize or award wins, and duplicate records never multiply badges',()=>{
 const rows=[row('WIN0',5000,'2026-09-14'),row('WIN0',6000),row('OLD0',7000,day,{gameMode:'rescue-v2',missionTitle:'Home safe · bonus 250'})];
 const history=D.finalize(rows,[],now),duplicate=[...history,...history];
 const unofficial=D.summary(rows,'daily','2026-09-14',{now,finalizations:duplicate});
 assert.equal(unofficial.authoritative,false);assert.equal(unofficial.status,'unverified');assert.equal(unofficial.winner,null);assert.equal(unofficial.yesterday,null);assert.equal(unofficial.entries[0].dailyWins,0);assert.equal(unofficial.entries[0].winnerDate,'');
 const official=D.summary(rows,'alltime','',{serverTime:now,finalizations:duplicate});
 assert.deepEqual(official.entries.map(e=>e.score),[7000,6000,5000]);assert.equal(official.entries[0].dailyWins,0);assert.equal(official.entries[1].dailyWins,1);assert.equal(official.entries[2].dailyWins,1);
 assert.equal(official.yesterday.playerName,'WIN0');assert.equal(summary(rows,{finalizations:duplicate}).winner,null);
});
test('empty closed days have no winner and old winner history is not limited to twenty days',()=>{
 const rows=Array.from({length:30},(_,i)=>row('WIN0',5000,D.shiftDay(day,-i-1)));
 const history=D.finalize(rows,[],now),result=D.summary(rows,'alltime','',{serverTime:now,finalizations:history});
 assert.equal(history.length,30);assert.equal(result.entries[0].dailyWins,30);assert.equal(result.dates.length,31);
 const empty=D.finalize([],[],now);assert.equal(empty.length,1);assert.deepEqual(empty[0].entries,[]);assert.equal(D.summary([],'daily','2026-09-14',{serverTime:now,finalizations:empty}).winner,null);
 const old=D.summary([],'daily','2026-09-01',{serverTime:now});assert.ok(old.dates.includes('2026-09-01'));
});
