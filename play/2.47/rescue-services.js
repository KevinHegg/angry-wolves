/* Compatible with the existing Apps Script / Sheet schema. */
(function(root) {
  'use strict';
  const LIMIT = 20;
  const MODE = 'rescue-v2';
  const VERSION = 'rescue-2.47';
  // Set after deploying the bound Apps Script web app as the owner (public GET access).
  const LEADERBOARD_API_URL = '';
  const POLL_INTERVAL_MS = 60000;
  const D = typeof module !== 'undefined' && module.exports ? require('./rescue-daily') : root.RescueDaily;
  const PUBLIC_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS9kSCHFoHdSz4DIlk1F5mctQh7BtwCtYBJAHZxkFBSpGMeEq20Gob2HFQ9aTYv7-u6mXx1e9SVaNgd/pub?gid=0&single=true&output=csv';
  const FORM_RESPONSE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdvsK8P6XsN8WJ9Yf8A6RX_0842rSTuNXF1YVAiPQRlGztlkA/formResponse';
  const FORM_FIELDS = Object.freeze({
    playerName:'entry.602229481',score:'entry.606939749',gameMode:'entry.795048849',missionTitle:'entry.1116020990',
    bestChain:'entry.830989316',biggestHerdCount:'entry.383796915',biggestHerdAnimal:'entry.1081676941',
    herdsCleared:'entry.2116392978',pace:'entry.1175581020',durationMs:'entry.153276338',nonce:'entry.838273620',
    clientTimestamp:'entry.2140214557',version:'entry.1540726080'
  });
  // Kept as an alias for release checks and older callers that inspect the endpoint.
  const URL = PUBLIC_CSV_URL;
  const GAME_URL = 'https://kevinhegg.github.io/angry-wolves/';
  // Stable badge IDs: never reorder; the Sheet stores ABC0 and the UI displays ABC 🐕.
  const BADGES = Object.freeze(['🐕', '🐑', '🐏', '🐐', '🦮', '🥾', '🌾', '🧺', '🏡', '🌄', '🐺', '🐶', '🐷', '🐽', '🐮', '🐄', '🐓', '🐔', '🐥', '🐣']);
  const BADGE_NAMES = Object.freeze(['Sheepdog', 'Sheep', 'Ram', 'Goat', 'Faithful hound', 'Walking boot', 'Wheat', 'Basket', 'Farmhouse', 'Sunrise', 'Wily wolf', 'Pip’s puppy eyes', 'Pig parade', 'Snuffling snout', 'Moo crew', 'Meadow cow', 'Dawn rooster', 'Hen house hero', 'Little peeper', 'Great eggscape']);
  const BADGE_IDS = '0123456789ABCDEFGHIJ';
  const PICKER_BADGES = Object.freeze([0,1,10,11,12,14,16,17,18,19]);
  const ANIMALS = Object.freeze(['🐑', '🐷', '🐔', '🐮']);
  function encodeName(initials, badge) {
    const name = String(initials).trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(name) || !Number.isInteger(badge) || badge < 0 || badge >= BADGES.length) throw new Error('Choose three letters and a shepherd badge.');
    return name + BADGE_IDS[badge];
  }
  function decodeName(value) {
    const match = /^([A-Z]{3})([0-9A-J])$/.exec(String(value));
    return match ? `${match[1]} ${BADGES[BADGE_IDS.indexOf(match[2])]}` : '??? 🐑';
  }
  function readProfile(storage) {
    try {
      const initials=storage.getItem('aw-rescue-initials') || '', badge=Number(storage.getItem('aw-rescue-badge')) || 0;
      return {initials:/^[A-Z]{0,3}$/.test(initials)?initials:'',badge:Number.isInteger(badge)&&badge>=0&&badge<BADGES.length?badge:0};
    } catch { return {initials:'',badge:0}; }
  }
  function saveProfile(profile, storage) {
    try { storage.setItem('aw-rescue-initials',profile.initials); storage.setItem('aw-rescue-badge',String(profile.badge)); } catch {}
  }
  function payload(result, initials, badge) {
    return {
      playerName: encodeName(initials, badge), score: result.score, gameMode: result.challengeDate ? D.MODE : MODE,
      ...(result.challengeDate ? {challengeDate:result.challengeDate,dailyRuleset:D.RULESET,dailyStartedAt:result.dailyStartedAt}:{}),
      missionTitle: `${result.challengeDate ? `Daily ${result.challengeDate} · ` : "Home safe · "}Pip barks saved ${result.rested}/3 · bonus ${result.bonus}`,
      bestChain: 0, biggestHerdCount: result.biggest.count,
      biggestHerdAnimal: ANIMALS[result.biggest.type], herdsCleared: result.moves,
      pace: 3, durationMs: result.durationMs, nonce: result.nonce,
      clientTimestamp: Date.now(), version: VERSION
    };
  }
  async function requestText(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, {...options, signal: controller.signal});
      if (!response.ok) throw new Error('The score sheet is unavailable. Please try again.');
      return await response.text();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The score sheet took too long. Try again; your score is still here.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  function parseCsv(text) {
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<String(text).length;i++){
      const char=text[i];
      if(quoted){
        if(char==='"'&&text[i+1]==='"'){cell+='"';i++;}
        else if(char==='"')quoted=false;
        else cell+=char;
      }else if(char==='"')quoted=true;
      else if(char===','){row.push(cell);cell='';}
      else if(char==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}
      else cell+=char;
    }
    if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
    return rows;
  }
  function csvEntries(text) {
    const rows=parseCsv(text),headers=(rows.shift()||[]).map(value=>value.trim());
    if(!['player_name','score','game_mode','approved_at'].every(key=>headers.includes(key)))throw Error('The score feed is unavailable. Please try again.');
    return rows.filter(row=>row.some(value=>String(value).trim())).map(row=>{
      const value=Object.fromEntries(headers.map((header,index)=>[header,row[index]??'']));
      return {playerName:value.player_name,score:Number(value.score),gameMode:value.game_mode,missionTitle:value.mission_title,
        bestChain:Number(value.best_chain),biggestHerdCount:Number(value.biggest_herd_count),biggestHerdAnimal:value.biggest_herd_animal,
        herdsCleared:Number(value.herds_cleared),pace:Number(value.pace),durationMs:Number(value.duration_ms),version:value.version,
        approvedAt:value.approved_at};
    });
  }
  async function publicEntries() {
    let lastError;
    for(let attempt=0;attempt<2;attempt++){
      try{return csvEntries(await requestText(`${PUBLIC_CSV_URL}&refresh=${Date.now()}-${attempt}`,{cache:'no-store'}));}
      catch(error){lastError=error;if(attempt===0)await new Promise(resolve=>setTimeout(resolve,1000));}
    }
    throw new Error(lastError?.message?.includes('too long')?lastError.message:'Could not refresh scores. Please try again shortly.');
  }
  async function board(view="alltime",date="") {
    const today=D.dayKey(),selectedDate=date||today,raw=await publicEntries();
    const entries=D.standings(raw,view,selectedDate,today);
    const yesterday=D.standings(raw,'daily',D.shiftDay(today,-1),today)[0]||null;
    return {ok:true,api:'daily-1',ruleset:D.RULESET,serverTime:Date.now(),today,date:selectedDate,
      weekStart:D.weekStart(selectedDate),entries,yesterday};
  }
  async function consolidatedBoard(view='daily',date='',player='',scope='standings'){
    if(LEADERBOARD_API_URL){
      const query=new URLSearchParams({api:'leaderboards-2',board:view,date,player,scope,refresh:String(Date.now())});
      const data=JSON.parse(await requestText(`${LEADERBOARD_API_URL}?${query}`,{cache:'no-store'}));
      if(!data.ok)throw Error(data.error||'Could not refresh standings.');
      if(data.api!=='leaderboards-2'||!data.authoritative||!Number.isFinite(data.serverTime)||!Array.isArray(data.entries)||!Array.isArray(data.dates)||!data.dates.every(D.validDay)||!D.validDay(data.today)||!D.validDay(data.date)||!Number.isFinite(Date.parse(data.updatedAt))||!Number.isInteger(data.total)||data.total<0||!Number.isInteger(data.participantCount)||data.participantCount<0||!['unverified','open','finalizing','finalized'].includes(data.status)||data.view!==view||data.scope!==scope||data.entries.some(e=>!Number.isInteger(e.rank)||e.rank<1||!Number.isFinite(e.score)||!/^([A-Z]{3})([0-9A-J])$/.test(e.playerName)))throw Error('The standings service needs an update.');
      return data;
    }
    // Live ranks remain available before the official finalization endpoint is activated.
    // Never infer a gold winner badge from the player's device clock.
    const raw=await publicEntries();return D.summary(raw,view,date,{player,scope});
  }
  async function leaderboard(){return (await board()).entries;}
  async function submit(result, initials, badge) {
    const data=payload(result,initials,badge),body=new URLSearchParams();
    for(const [key,field] of Object.entries(FORM_FIELDS))body.set(field,String(data[key]??''));
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
    try{
      await fetch(FORM_RESPONSE_URL,{method:'POST',mode:'no-cors',keepalive:true,body,signal:controller.signal});
      return {status:'received',message:result.challengeDate?'Daily score received. The public board may take a moment to refresh.':'Score received. The public board may take a moment to refresh.'};
    }catch(error){
      if(error.name==='AbortError')throw new Error('The score recorder took too long. Your score is still here; try again.');
      throw new Error('Could not save this score. Please try again.');
    }finally{clearTimeout(timer);}
  }
  function qualifies(entries, score) {
    return entries.length < LIMIT || score > entries[LIMIT-1].score;
  }
  function verifiedRank(entries, result, playerName) {
    const matches = entries.map((entry,i) => ({entry,rank:entry.rank||i+1})).filter(({entry:e}) =>
      e.playerName === playerName && e.score === result.score &&
      (!result.challengeDate || D.challengeDate(e)===result.challengeDate) &&
      e.durationMs === result.durationMs && e.herdsCleared === result.moves &&
      e.biggestHerdCount === result.biggest.count && e.biggestHerdAnimal === ANIMALS[result.biggest.type] && e.version === VERSION);
    return matches.length === 1 ? matches[0].rank : null;
  }
  function caption(result) {
    return `${result.rank ? `🏆 ${result.rankBoard==='daily'?'Daily':'Top 20'} high score · #${result.rank} · ${result.playerLabel}\n` : result.personalBest ? '🏆 New personal best!\n' : ''}${result.challengeDate?`Daily challenge · ${result.challengeDate}\n`:""}I brought ${result.saved} animals home in Hungry Wolf! 🏡\n${result.score.toLocaleString('en-US')} points · biggest herd: ${result.biggest.count} ${ANIMALS[result.biggest.type]}\n${result.rested===3?'No Pip used':`${result.rested} Pip barks saved`} (+${result.bonus.toLocaleString('en-US')} bonus).\nCan you beat my herd? ${GAME_URL}`;
  }
  const api = {consolidatedBoard,LEADERBOARD_API_URL,POLL_INTERVAL_MS,board,LIMIT,qualifies,verifiedRank,MODE,VERSION,URL,PUBLIC_CSV_URL,FORM_RESPONSE_URL,FORM_FIELDS,parseCsv,csvEntries,GAME_URL,BADGES,BADGE_NAMES,PICKER_BADGES,readProfile,saveProfile,ANIMALS,encodeName,decodeName,payload,leaderboard,submit,caption};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RescueServices = api;
})(typeof window !== 'undefined' ? window : globalThis);
