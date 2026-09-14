/* Daily rules: dates, repeatable randomness and standings. No services or timers. */
(function(root){
  'use strict';
  const RULESET='daily-1',MODE='rescue-daily-v1',ZONE='America/New_York';
  function dayKey(now=Date.now()){
    if(typeof Utilities!=='undefined')return Utilities.formatDate(new Date(now),ZONE,'yyyy-MM-dd');
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
    const part=t=>parts.find(p=>p.type===t).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }
  function validDay(day){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(day+'T12:00:00Z'))&&new Date(day+'T12:00:00Z').toISOString().slice(0,10)===day;}
  function shiftDay(day,n){if(!validDay(day))throw Error('Invalid challenge date.');const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
  function weekStart(day){const weekday=new Date(day+'T12:00:00Z').getUTCDay();return shiftDay(day,-((weekday+6)%7));}
  function label(day,year=false){if(!validDay(day))return '';return new Date(day+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'numeric',...(year?{year:'numeric'}:{})});}
  function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
  function generator(seed){let state=seed>>>0;const rng=()=>{let t=state=(state+0x6D2B79F5)>>>0;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};rng.state=()=>state;return rng;}
  function streams(day,chapter,saved){
    if(!validDay(day)||!Number.isInteger(chapter)||chapter<0||chapter>2)throw Error('Invalid daily challenge.');
    const result={};for(const key of ['animals','wind','regroup'])result[key]=generator(saved?.[key]??hash(`${RULESET}|${day}|${chapter}|${key}`));
    result.snapshot=()=>Object.fromEntries(['animals','wind','regroup'].map(k=>[k,result[k].state()]));return result;
  }
  function challengeDate(entry){const match=/^Daily (\d{4}-\d{2}-\d{2}) ·/.exec(entry.missionTitle||'');return entry.gameMode===MODE&&match&&validDay(match[1])?match[1]:'';}
  function compare(a,b){return b.score-a.score||String(a.approvedAt||'').localeCompare(String(b.approvedAt||''))||String(a.playerName).localeCompare(String(b.playerName));}
  function dailyBest(entries){const players=new Map();for(const e of entries.slice().sort(compare))if(!players.has(e.playerName))players.set(e.playerName,e);return [...players.values()];}
  function standings(entries,board,day,today=day){
    if(!validDay(day)||!validDay(today))throw Error('Invalid leaderboard date.');
    const valid=entries.filter(e=>['rescue-v2',MODE].includes(e.gameMode)&&/^[A-Z]{3}[0-9A-J]$/.test(e.playerName)&&Number.isFinite(e.score)&&e.score>=0);
    const daily=valid.filter(e=>{const d=challengeDate(e);return d&&e.approvedAt&&Number.isFinite(Date.parse(e.approvedAt))&&dayKey(e.approvedAt)===d&&d<=today;}).map(e=>({...e,challengeDate:challengeDate(e)}));
    let result;
    if(board==='daily')result=dailyBest(daily.filter(e=>e.challengeDate===day));
    else if(board==='weekly'){
      const start=weekStart(day),end=shiftDay(start,6),days=new Map(),players=new Map();
      for(const e of daily.filter(e=>e.challengeDate>=start&&e.challengeDate<=end).sort(compare)){
        const key=e.challengeDate+'|'+e.playerName;if(days.has(key))continue;days.set(key,true);
        const p=players.get(e.playerName)||{...e,score:0,daysPlayed:0};p.score+=e.score;p.daysPlayed++;
        if(e.approvedAt>p.approvedAt)p.approvedAt=e.approvedAt;
        if(e.biggestHerdCount>p.biggestHerdCount){p.biggestHerdCount=e.biggestHerdCount;p.biggestHerdAnimal=e.biggestHerdAnimal;}
        players.set(e.playerName,p);
      }result=[...players.values()];
    }else if(board==='winners'){
      const days=new Map();for(const e of daily.filter(e=>e.challengeDate<today).sort(compare))if(!days.has(e.challengeDate))days.set(e.challengeDate,e);
      result=[...days.values()];
    }else if(board==='alltime')result=valid;
    else throw Error('Unknown leaderboard.');
    return result.slice().sort(compare).slice(0,20).map((e,i)=>({...e,rank:i+1}));
  }
  const api={RULESET,MODE,ZONE,dayKey,validDay,shiftDay,weekStart,label,streams,challengeDate,standings};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RescueDaily=api;
})(typeof window!=='undefined'?window:globalThis);
