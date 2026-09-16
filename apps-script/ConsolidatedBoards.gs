/* Official clock and immutable daily results. The public score history is read-only. */
const DAILY_FINAL_HEADERS=['challenge_date','finalized_at','rank','entry_json'];
function readScoreHistory_(){
  const sheet=getSpreadsheet_().getSheetByName(SETTINGS.PUBLIC_SHEET);
  if(!sheet||!sheet.getLastRow()||sheet.getRange(1,1,1,PUBLIC_HEADERS.length).getValues()[0].some((value,i)=>value!==PUBLIC_HEADERS[i]))throw Error('The approved score history is unavailable.');
  const last=sheet.getLastRow();
  return last<2?[]:sheet.getRange(2,1,last-1,PUBLIC_HEADERS.length).getValues().map(function(values){
    const r=rowToObject_(PUBLIC_HEADERS,values);
    return {playerName:r.player_name,score:Number(r.score),gameMode:r.game_mode,missionTitle:r.mission_title,
      biggestHerdCount:Number(r.biggest_herd_count),biggestHerdAnimal:r.biggest_herd_animal,herdsCleared:Number(r.herds_cleared),
      durationMs:Number(r.duration_ms),version:r.version,approvedAt:r.approved_at instanceof Date?r.approved_at.toISOString():String(r.approved_at||'')};
  });
}
function readFinalResults_(sheet){
  const last=sheet.getLastRow();if(last<2)return [];
  const groups=new Map();
  for(const row of sheet.getRange(2,1,last-1,4).getValues()){
    const day=String(row[0]),group=groups.get(day)||{date:day,entries:[]};
    if(Number(row[2])===0){if(group.finalizedAt)throw Error('Duplicate finalized daily date.');const meta=JSON.parse(row[3]);group.finalizedAt=String(row[1]);group.closesAt=meta.closesAt;group.count=meta.count;}
    else group.entries.push({...JSON.parse(row[3]),rank:Number(row[2])});
    groups.set(day,group);
  }
  return [...groups.values()].map(group=>{
    group.entries.sort((a,b)=>a.rank-b.rank);
    if(!RescueDaily.validDay(group.date)||!group.finalizedAt||group.date>=RescueDaily.dayKey()||Date.parse(group.finalizedAt)<Date.parse(RescueDaily.closesAt(group.date))||!Number.isFinite(Date.parse(group.finalizedAt))||Date.parse(group.finalizedAt)>Date.now()||group.entries.length!==group.count||group.entries.some((e,i)=>e.rank!==i+1))throw Error('Incomplete daily finalization.');
    const eligible=RescueDaily.standings(group.entries,'daily',group.date,RescueDaily.dayKey(),Infinity);
    if(eligible.length!==group.entries.length||eligible.some((entry,i)=>entry.playerName!==group.entries[i].playerName||entry.score!==group.entries[i].score))throw Error('Invalid finalized daily standings.');
    return group;
  });
}
function officialDailyState_(){
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))throw Error('Standings are updating. Please refresh shortly.');
  try{
    const now=Date.now(),entries=readScoreHistory_(),sheet=getSheet_('daily_final_results',DAILY_FINAL_HEADERS),history=readFinalResults_(sheet);
    for(const record of RescueDaily.finalize(entries,history,now)){
      // One rectangular write contains the completion marker and every participant.
      const rows=[[record.date,record.finalizedAt,0,JSON.stringify({count:record.entries.length,closesAt:record.closesAt})],
        ...record.entries.map(entry=>[record.date,record.finalizedAt,entry.rank,JSON.stringify(entry)])];
      sheet.getRange(sheet.getLastRow()+1,1,rows.length,4).setValues(rows);history.push(record);
    }
    SpreadsheetApp.flush();return {entries,history,now};
  }finally{lock.releaseLock();}
}
function consolidatedBoardResponse_(e){
  try{
    const p=e&&e.parameter||{},view=String(p.board||'daily'),date=String(p.date||'');
    if(!['daily','alltime'].includes(view)||(date&&(!RescueDaily.validDay(date)||date>RescueDaily.dayKey())))throw Error('Invalid leaderboard request.');
    const data=officialDailyState_();
    return jsonResponse(RescueDaily.summary(data.entries,view,date,{scope:p.scope,player:String(p.player||''),serverTime:data.now,finalizations:data.history}));
  }catch(error){return jsonResponse({ok:false,error:error.message||'Could not refresh standings.'});}
}
function finalizeDailyChallenges(){officialDailyState_();}
// Optional owner-run setup. Requests also finalize closed days, so no Codex run is needed.
function setupDailyFinalization(){
  getSheet_('daily_final_results',DAILY_FINAL_HEADERS);
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='finalizeDailyChallenges'))ScriptApp.newTrigger('finalizeDailyChallenges').timeBased().everyHours(1).create();
  finalizeDailyChallenges();
}
