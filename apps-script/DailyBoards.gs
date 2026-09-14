/* Additive daily views over approved score history; never rewrites score rows. */
function dailyBoardResponse_(e) {
  try {
    const now=Date.now(),today=RescueDaily.dayKey(now),params=e&&e.parameter||{};
    const board=String(params.board||'daily'),date=String(params.date||today);
    if(!['daily','weekly','alltime','daily-alltime','winners'].includes(board)||!RescueDaily.validDay(date)||date>today)throw Error('Invalid leaderboard request.');
    const sheet=getSheet_(SETTINGS.PUBLIC_SHEET,PUBLIC_HEADERS),last=sheet.getLastRow();
    const entries=last<2?[]:sheet.getRange(2,1,last-1,PUBLIC_HEADERS.length).getValues().map(function(values){
      const r=rowToObject_(PUBLIC_HEADERS,values);
      return {playerName:r.player_name,score:Number(r.score),gameMode:r.game_mode,missionTitle:r.mission_title,
        biggestHerdCount:Number(r.biggest_herd_count),biggestHerdAnimal:r.biggest_herd_animal,herdsCleared:Number(r.herds_cleared),
        durationMs:Number(r.duration_ms),version:r.version,approvedAt:r.approved_at instanceof Date?r.approved_at.toISOString():String(r.approved_at||'')};
    });
    return jsonResponse({ok:true,api:'daily-1',ruleset:RescueDaily.RULESET,serverTime:now,today:today,date:date,weekStart:RescueDaily.weekStart(date),
      entries:RescueDaily.standings(entries,board,date,today),yesterday:RescueDaily.standings(entries,'daily',RescueDaily.shiftDay(today,-1),today)[0]||null});
  }catch(err){return jsonResponse({ok:false,error:err.message||'Could not load daily scores.'});}
}
function validateDailyPayload_(payload) {
  if(payload.gameMode!==RescueDaily.MODE)return;
  const date=String(payload.challengeDate||''),today=RescueDaily.dayKey();
  if(payload.dailyRuleset!==RescueDaily.RULESET||!RescueDaily.validDay(date)||date>today)throw Error('This daily challenge is no longer open for posting. Start today’s challenge.');
  if(!Number.isFinite(payload.dailyStartedAt)||RescueDaily.dayKey(payload.dailyStartedAt)!==date)throw Error('The daily challenge start date is missing. Start a new daily adventure.');
  // The date prefix is the only new stored metadata. Existing columns and rows stay intact.
  const details=String(payload.missionTitle||'').replace(/^Daily \d{4}-\d{2}-\d{2} · /,'');
  payload.missionTitle='Daily '+date+' · '+details;
}
