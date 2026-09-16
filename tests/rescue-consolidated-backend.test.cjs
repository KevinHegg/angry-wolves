const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function backend(){
 let now=Date.parse('2026-09-15T03:59:59Z'),locked=false,allow=true,writes=0,failWrite=false;
 const sheets=new Map(),triggers=[];
 function sheet(name){if(sheets.has(name))return sheets.get(name);const rows=[],s={rows,setFrozenRows(){},getLastRow:()=>rows.length,appendRow:r=>rows.push(r),getRange:(r,c,h=1,w=1)=>({
  getValues:()=>Array.from({length:h},(_,i)=>Array.from({length:w},(_,j)=>rows[r-1+i]?.[c-1+j]??'')),
  setValues:values=>{if(failWrite)throw Error('Write unavailable');assert.equal(values.length,h);assert.ok(values.every(v=>v.length===w));writes++;values.forEach((line,i)=>{rows[r-1+i]??=[];line.forEach((v,j)=>rows[r-1+i][c-1+j]=v);});}
 })};sheets.set(name,s);return s;}
 class Clock extends Date{static now(){return now;}}
 const context=vm.createContext({Date:Clock,SpreadsheetApp:{openById:()=>({getSheetByName:name=>sheets.get(name),insertSheet:sheet}),flush(){}},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked||!allow)return false;locked=true;return true;},releaseLock(){locked=false;}})},ScriptApp:{getProjectTriggers:()=>triggers,newTrigger:name=>({timeBased(){return this;},everyHours(){return this;},create(){triggers.push({getHandlerFunction:()=>name});}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({data:JSON.parse(text),setMimeType(){return this;}})}});
 for(const file of ['DailyRules.gs','DailyBoards.gs','Leaderboard.gs','ConsolidatedBoards.gs'])vm.runInContext(fs.readFileSync('apps-script/'+file,'utf8'),context);
 vm.runInContext("getSheet_(SETTINGS.PUBLIC_SHEET,PUBLIC_HEADERS)",context);
 const add=(name,score,date='2026-09-14',posted=date+'T18:00:00Z')=>sheet('public').rows.push([posted,name,score,'rescue-daily-v1',`Daily ${date} · Pip rested 3/3 · bonus 1000`,0,12,'🐑',25,3,180000,'rescue-2.45','secret-nonce']);
 return {context,sheets,add,read:(board='daily',date='',player='')=>context.doGet({parameter:{api:'leaderboards-2',board,date,player}}).data,setTime:value=>now=Date.parse(value),setLock:value=>allow=value,setFailure:value=>failWrite=value,writes:()=>writes,locked:()=>locked,triggers};
}
test('official backend uses its clock, snapshots all players once, and never modifies source rows',()=>{
 const b=backend();b.add('BBB0',4000);b.add('AAA0',4000);b.add('AAA0',3000);const before=JSON.stringify(b.sheets.get('public').rows);
 let data=b.read();assert.equal(data.status,'open');assert.equal(data.entries[0].leading,true);assert.equal(data.winner,null);assert.equal(data.participantCount,2);assert.doesNotMatch(JSON.stringify(data),/secret-nonce/);
 b.setTime('2026-09-15T04:00:30Z');assert.equal(b.read('daily','2026-09-14').status,'finalizing');
 b.setTime('2026-09-15T04:01:00Z');data=b.read('daily','2026-09-14','BBB0');assert.equal(data.status,'finalized');assert.equal(data.winner.playerName,'AAA0');assert.equal(data.yourStanding.rank,2);
 const writes=b.writes(),snapshot=JSON.stringify(b.sheets.get('daily_final_results').rows);assert.equal(JSON.stringify(b.sheets.get('public').rows),before);
 for(let i=0;i<3;i++)assert.equal(b.read('alltime').entries[0].dailyWins,1);
 assert.equal(b.writes(),writes);assert.equal(JSON.stringify(b.sheets.get('daily_final_results').rows),snapshot);assert.equal(b.locked(),false);
 b.add('TOP0',9000);assert.equal(b.read('daily','2026-09-14').winner.playerName,'AAA0');assert.equal(b.read('alltime').entries[0].playerName,'TOP0');
});
test('lock and write failures do not finalize twice; setup installs only one trigger',()=>{
 const b=backend();b.add('AAA0',4000);b.setTime('2026-09-15T04:01:00Z');b.setLock(false);assert.equal(b.read().ok,false);assert.equal(b.sheets.has('daily_final_results'),false);
 b.setLock(true);b.setFailure(true);assert.equal(b.read().ok,false);assert.equal(b.locked(),false);
 b.setFailure(false);assert.equal(b.read().ok,true);b.context.setupDailyFinalization();b.context.setupDailyFinalization();assert.equal(b.triggers.length,1);
 assert.equal(b.read('alltime').entries[0].dailyWins,1);
});
test('malformed requests and incomplete snapshots fail closed without writing more results',()=>{
 const b=backend();b.add('AAA0',4000);assert.equal(b.read('weekly').ok,false);assert.equal(b.read('daily','2999-01-01').ok,false);assert.equal(b.sheets.has('daily_final_results'),false);
 b.setTime('2026-09-15T04:01:00Z');b.read();const final=b.sheets.get('daily_final_results');final.rows.pop();const writes=b.writes();assert.equal(b.read().ok,false);assert.equal(b.writes(),writes);
});
test('duplicate completion markers cannot duplicate a daily award',()=>{
 const b=backend();b.add('AAA0',4000);b.setTime('2026-09-15T04:01:00Z');b.read();const final=b.sheets.get('daily_final_results');final.rows.push(final.rows[1].slice());assert.equal(b.read().ok,false);
});
test('missing source history or damaged archive metadata never becomes an empty finalized day',()=>{
 const b=backend();b.setTime('2026-09-15T04:01:00Z');b.sheets.delete('public');assert.equal(b.read().ok,false);assert.equal(b.sheets.has('public'),false);assert.equal(b.sheets.has('daily_final_results'),false);
 const c=backend();c.add('AAA0',4000);c.setTime('2026-09-15T04:01:00Z');c.read();c.sheets.get('daily_final_results').rows[1][1]='invalid';const writes=c.writes();assert.equal(c.read().ok,false);assert.equal(c.writes(),writes);
});
test('deploying the standings endpoint does not enable the dormant direct score intake',()=>{
 const b=backend(),before=JSON.stringify([...b.sheets]);
 const result=b.context.doPost({postData:{contents:JSON.stringify({playerName:'AAA0',score:9000})}}).data;
 assert.equal(result.ok,false);assert.equal(result.reasons[0],'form_intake_only');assert.equal(b.writes(),0);assert.equal(JSON.stringify([...b.sheets]),before);
});
