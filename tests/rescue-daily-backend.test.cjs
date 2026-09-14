const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function backend(rows=[]){
 let writes=0;
 const sheet={getLastRow:()=>rows.length+1,getRange:()=>({getValues:()=>rows}),appendRow:()=>{writes++;}};
 const context=vm.createContext({SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({data:JSON.parse(text),setMimeType(){return this;}})}});
 for(const file of ['DailyRules.gs','DailyBoards.gs','Leaderboard.gs'])vm.runInContext(fs.readFileSync('apps-script/'+file,'utf8'),context);
 return {ctx:context,read:(board,date)=>context.doGet({parameter:{board,date}}).data,writes:()=>writes};
}
test('deployed daily rules must exactly match browser rules',()=>{assert.equal(fs.readFileSync('apps-script/DailyRules.gs','utf8'),fs.readFileSync('rescue-daily.js','utf8'));});
test('daily backend reads all approved history, exposes no nonce and never edits a row',()=>{
 const today=require('../rescue-daily').dayKey(),rows=[];
 for(let i=0;i<80;i++)rows.push([today+'T18:00:00Z','AAA0',5000-i,'rescue-daily-v1',`Daily ${today} · Pip rested 3/3 · bonus 1000`,0,12,'🐑',25,3,180000,'rescue-2.40','private-nonce']);
 rows.push([today+'T18:00:00Z','BBB1',100,'rescue-daily-v1',`Daily ${today} · Pip rested 0/3 · bonus 0`,0,8,'🐷',25,3,180000,'rescue-2.40','private-nonce-2']);
 const b=backend(rows),original=JSON.stringify(rows),data=b.read('daily',today);assert.equal(data.api,'daily-1');assert.equal(data.entries.length,2);assert.equal(data.entries[1].playerName,'BBB1');assert.doesNotMatch(JSON.stringify(data),/private-nonce/);assert.equal(b.writes(),0);assert.equal(JSON.stringify(rows),original);
});
test('backend rejects bad board names, impossible dates and future dates',()=>{
 const b=backend();for(const [board,date] of [['weekly','2026-02-30'],['wrong','2026-09-14'],['daily','2999-01-01']])assert.equal(b.read(board,date).ok,false);
});
test('daily payload requires matching date/ruleset and allows an old adventure to finish for all-time',()=>{
 const b=backend(),D=require('../rescue-daily'),date=D.dayKey(),payload={gameMode:D.MODE,challengeDate:date,dailyRuleset:D.RULESET,dailyStartedAt:Date.now(),missionTitle:'Pip rested 3/3 · bonus 1000'};
 b.ctx.validateDailyPayload_(payload);assert.match(payload.missionTitle,new RegExp('^Daily '+date));
 assert.throws(()=>b.ctx.validateDailyPayload_({...payload,challengeDate:'2999-01-01'}));assert.throws(()=>b.ctx.validateDailyPayload_({...payload,dailyRuleset:'unknown'}));
 assert.throws(()=>b.ctx.validateDailyPayload_({...payload,dailyStartedAt:0}));
 const yesterday=D.shiftDay(date,-1);assert.doesNotThrow(()=>b.ctx.validateDailyPayload_({...payload,challengeDate:yesterday,dailyStartedAt:Date.parse(yesterday+'T18:00:00Z')}));
});

test('the optional backend supports all-time daily records without writing to the sheet',()=>{
 const D=require('../rescue-daily'),today=D.dayKey(),day=D.shiftDay(today,-9),rows=[[day+'T18:00:00Z','AAA0',6000,D.MODE,`Daily ${day} · Pip rested 3/3 · bonus 1000`,0,19,'🐷',25,3,180000,'rescue-2.40','secret-1'],[day+'T18:01:00Z','BBB0',5500,D.MODE,`Daily ${day} · Pip rested 3/3 · bonus 1000`,0,18,'🐑',25,3,180000,'rescue-2.40','secret-2']];
 const b=backend(rows),records=b.read('daily-alltime',today);assert.equal(records.ok,true);assert.deepEqual(records.entries.map(e=>e.score),[6000,5500]);assert.equal(records.entries[1].challengeDate,day);assert.equal(b.writes(),0);assert.doesNotMatch(JSON.stringify(records),/secret-/);
});
