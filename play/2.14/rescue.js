(() => {
  'use strict';
  const R = window.RescueRules;
  const $ = id => document.getElementById(id);
  const names = ['sheep', 'pigs', 'hens', 'cows'];
  const singular = ['Sheep', 'Pig', 'Hen', 'Cow'];
  const chapterWords = ['ONE', 'TWO', 'THREE'];
  const eyes = '<circle cx="25" cy="32" r="2.3" fill="#293c37"/><circle cx="39" cy="32" r="2.3" fill="#293c37"/>';
  function icon(type) {
    if(type===7)return '<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke-linecap="round"><path d="M8 14C-1 3 61 1 57 15C52 25 6 22 10 13C14 7 48 8 50 13" stroke="#765e42" stroke-width="5"/><path d="M13 27Q37 36 54 25M19 37Q38 45 47 35M27 47Q36 52 40 45M31 55L27 59" stroke="#9b7d50" stroke-width="5"/><path d="M6 32L2 35M54 42L60 39M20 55L16 57" stroke="#b59158" stroke-width="2"/></g><path d="M46 19L55 16L53 25Z" fill="#765e42"/></svg>';
    if(type===6)return '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 30L5 3L25 16Q32 12 39 16L59 3L56 32Q61 55 32 60Q3 55 8 30Z" fill="#101719" stroke="#b6d59b" stroke-width="2"/><path d="M15 32Q21 22 28 32M36 32Q43 22 50 32" fill="none" stroke="#dcf296" stroke-width="4" stroke-linecap="round"/><path d="M15 40Q32 45 49 40Q44 59 32 56Q20 57 15 40Z" fill="#fff5cd"/><path d="M29 35L35 35L32 39Z" fill="#d79f96"/><path d="M22 44V50M32 45V53M42 44V50" stroke="#b4ae8a"/><path d="M16 38L2 34M48 38L62 34" stroke="#b6d59b" stroke-width="2"/></svg>';
    if(type===5)return '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M8 30L5 3L25 16Q32 12 39 16L59 3L56 32Q61 51 44 57L32 61L20 57Q3 51 8 30Z" fill="#101719" stroke="#657477" stroke-width="2"/><path d="M12 13L15 26L23 21M52 13L49 26L41 21" fill="#574c62"/><path d="M13 32Q23 25 29 34Q20 43 13 32M35 34Q43 25 52 32Q44 43 35 34" fill="#ffb574"/><path d="M22 30V37M43 30V37" stroke="#0b1416" stroke-width="3"/><path d="M29 41L35 41L32 45Z" fill="#b87f9a"/><path d="M20 50Q32 39 45 50L39 49L38 54L34 47L29 47L26 54L25 49Z" fill="#f7efd8"/><path d="M17 43L2 39M17 47L1 48M47 43L62 39M47 47L63 48" stroke="#c4c0b0" stroke-width="1.2"/></svg>';

    const faces = [
      '<g fill="#f9f5e6" stroke="#c8c6ac" stroke-width="1.2"><circle cx="20" cy="18" r="9"/><circle cx="32" cy="15" r="10"/><circle cx="44" cy="18" r="9"/><circle cx="15" cy="29" r="9"/><circle cx="49" cy="29" r="9"/><circle cx="20" cy="43" r="10"/><circle cx="33" cy="46" r="10"/><circle cx="45" cy="43" r="10"/></g><path d="M17 25Q7 18 10 33L21 36M47 25Q57 18 54 33L43 36" fill="#59665c"/><rect x="20" y="21" width="24" height="29" rx="11" fill="#59665c"/><circle cx="26" cy="32" r="2" fill="#fff5db"/><circle cx="38" cy="32" r="2" fill="#fff5db"/><path d="M29 41h6l-3 3z" fill="#e3c9ad"/>',
      '<path d="M13 26L9 7Q24 8 26 20M38 20Q40 8 55 7L51 28" fill="#b56e68" stroke="#87584f" stroke-width="1.2"/><ellipse cx="32" cy="33" rx="23" ry="23" fill="#f1beb0"/>' + eyes + '<ellipse cx="32" cy="42" rx="12" ry="8" fill="#cb827d"/><ellipse cx="28" cy="42" rx="2" ry="3" fill="#82554e"/><ellipse cx="36" cy="42" rx="2" ry="3" fill="#82554e"/><path d="M17 35h4M43 35h4" stroke="#db978a" stroke-width="3" stroke-linecap="round"/>',
      '<path d="M24 17Q17 1 27 6Q32 -3 37 7Q49 2 40 20" fill="#b95739"/><path d="M12 29Q4 23 6 36L16 45M50 29Q60 23 58 36L48 45" fill="#dbaa50"/><ellipse cx="32" cy="34" rx="22" ry="22" fill="#fff0b5"/>' + eyes + '<path d="M25 39L32 47L39 39L32 35Z" fill="#d68a37"/><path d="M29 46Q25 57 32 55Q40 55 35 46" fill="#b95739"/>',
      '<path d="M17 21Q7 18 7 29L19 33M47 21Q57 18 57 29L45 33" fill="#6c8079"/><path d="M19 19L16 7L26 16M45 19L48 7L38 16" fill="#f1d9a5"/><rect x="16" y="13" width="32" height="42" rx="14" fill="#f0eee0"/><path d="M18 19Q34 12 32 31L19 34Z" fill="#50665f"/><circle cx="25" cy="30" r="2.3" fill="#fff8e0"/><circle cx="39" cy="30" r="2.3" fill="#293c37"/><rect x="18" y="39" width="28" height="16" rx="8" fill="#caa49a"/><circle cx="26" cy="46" r="2" fill="#775e59"/><circle cx="38" cy="46" r="2" fill="#775e59"/>',
      '<path d="M10 26L7 3L26 17L38 17L57 3L54 29L48 46L32 59L16 46Z" fill="#536967"/><path d="M13 13L16 28L24 21M51 13L48 28L40 21" fill="#a5aaa0"/><path d="M12 30L27 35L32 48L37 35L52 30L47 46L32 58L17 46Z" fill="#d5d8ca"/><path d="M19 28L27 30M37 30L45 28" stroke="#243b37" stroke-width="3" stroke-linecap="round"/><path d="M27 45L37 45L32 50Z" fill="#243b37"/>'
    ];
    return `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">${faces[type]}</svg>`;
  }
  const S = window.RescueServices, A = window.RescueAudio;
  let state = R.create(), selected = [], busy = false, total = 0, bankedScore = 0, bankedMoves = 0;
  let bankedBiggest = {count:0,type:0}, pipUsed = [false,false,false], finalResult = null, shareCard = null, shareReady = false;
  let soundOn = true, best = 0, dialogAction = null, dialogSecondary = null;
  let lastFocus = null, generation = 0, ready = false, dialogGeneration = 0, dialogView = '';
  let fieldEntryBoard = null,fieldEntryCats={},fieldEntryDistance=state.distance,fieldEntryWait=state.windWait;
  let startedAt = Date.now(), runNonce = newNonce(), keyboardInput = false;
  let submission = {pending:false,done:false,message:''};
  try { soundOn = localStorage.getItem('aw-rescue-sound') !== '0'; best = Number(localStorage.getItem('aw-rescue-best-v2')) || 0; } catch {}
  let profileUnlocked=false;
  let playerProfile={initials:'',badge:0};
  try{playerProfile=S.readProfile(localStorage);}catch{}
  function rememberProfile(){try{S.saveProfile(playerProfile,localStorage);}catch{}}
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelector('.brand-wolf').innerHTML = icon(4);
  A.setEnabled(soundOn);
  function newNonce() { return window.crypto?.randomUUID?.() || `rescue-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  const tone = (kind,options) => A.play(kind,options);
  function soundLabel() {
    $('sound').setAttribute('aria-pressed', String(soundOn));
    $('sound').setAttribute('aria-label', `Turn sound ${soundOn ? 'off' : 'on'}`);
    $('sound').innerHTML = `${soundOn ? '🔊' : '🔇'}<span>Sound ${soundOn ? 'on' : 'off'}</span>`;
  }
  function say(message) { $('feedback').textContent = message; }
  function openDialog({eyebrow,title,copy,details='',action,run,secondary='',secondaryRun,view=''}) {
    dialogGeneration++; dialogView = view;
    $('story-dialog').classList.toggle('leaderboard-view',view==='leaderboard');
    if (!$('story-dialog').open) lastFocus = document.activeElement;
    $('dialog-eyebrow').textContent = eyebrow;
    $('dialog-title').textContent = title;
    $('dialog-copy').textContent = copy;
    $('dialog-details').innerHTML = details;
    document.querySelector('.dialog-art').innerHTML = view === 'results' ? icon(0)+icon(1)+icon(2)+icon(3) : icon(0)+icon(4);
    $('dialog-action').textContent = action;
    $('dialog-secondary').textContent = secondary;
    $('dialog-secondary').hidden = !secondary;
    dialogAction = run; dialogSecondary = secondaryRun;
    if (!$('story-dialog').open) $('story-dialog').showModal();
    $('story-dialog').scrollTop = 0;
    // Pointer users should not have Safari scroll a dialog toward its last button.
    $('dialog-title').focus({preventScroll:true});
    $('story-dialog').scrollTop = 0;
  }
  function closeDialog() {
    dialogGeneration++; dialogView = ''; dialogAction = null; dialogSecondary = null;
    $('story-dialog').close();
    if (keyboardInput && lastFocus?.isConnected) lastFocus.focus({preventScroll:true});
    scheduleFit();
  }
  function intro() {
    ready = false;
    openDialog({eyebrow:'A SMALL ADVENTURE IN THREE CHAPTERS',title:'The gate was left open.',
      copy:'The animals wandered out. The wolves noticed. Bring the herds home with a whistle, and a little help from Pip the sheepdog.',
      details:'<div class="instruction"><b>1.</b> Select 3+ matching animals touching side to side.</div><div class="instruction"><b>2.</b> Whistle them home. A herd of 3 brings wolves two steps closer; 5+ holds them off.</div><div class="instruction"><b>3.</b> Fill the animal goals. Let Pip rest for a bonus at the end.</div><p class="dialog-tip">No clock. The wolves wait for your move. 🔊 Use the speaker button to turn sound on or off.</p>',
      action:'Let’s bring them home', run:() => {ready=true; startedAt=Date.now(); tone('gate'); closeDialog(); select(30);} });
  }
  function render() {
    const c = R.CHAPTERS[state.chapter];
    $('retry').textContent=state.status==='lost'?'Play again':'Restart field';
    document.body.className = `chapter-${state.chapter}`;
    $('chapter-label').textContent = `CHAPTER ${chapterWords[state.chapter]} · ${c.time.toUpperCase()}`;
    $('field-title').textContent = c.name;
    $('story-title').textContent = ['The gate was left open.','Follow the little footprints.','Leave no herd behind.'][state.chapter];
    $('story-text').textContent = c.story;
    $('total-home').textContent = total + state.saved.reduce((a,b)=>a+b,0);
    $('pip-rest-hint').textContent = `Pip bonus: up to +${R.restBonus(pipUsed.filter(used=>!used).length)}`;
    document.querySelectorAll('[data-stop]').forEach((el,i)=>{el.className=i===state.chapter?'current':i<state.chapter?'complete':'';if(i===state.chapter)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $('goals').innerHTML = c.goal.map((n,i)=>n?`<div class="goal ${state.saved[i]>=n?'done':''}" aria-label="${Math.min(n,state.saved[i])} of ${n} ${names[i]} home">${icon(i)}<div class="goal-copy"><strong>${state.saved[i]>=n?`${n} ✓`:`${state.saved[i]} / ${n}`}</strong><span>${names[i]}${state.chapter===2?'':' home'}</span></div><div class="goal-progress" style="width:${Math.min(100,state.saved[i]/n*100)}%"></div></div>`:'').join('');
    $('wolf-label').textContent = state.distance>0?`Wolves are ${state.distance} ${state.distance===1?'step':'steps'} away`:'The wolves reached the field';
    $('wolf-effect').textContent = R.pressure(state.moves+1)?`Long field: wolves advance +${R.pressure(state.moves+1)} extra per whistle`:`Whistle ${state.moves+1} · extra wolf pressure from 18`;
    document.querySelector('.wolf-trail').classList.toggle('danger',state.distance<=2);
    $('trail-steps').innerHTML = Array.from({length:11},(_,i)=>`<span class="trail-step ${i===state.distance?'active':''}">${i===state.distance?icon(4):''}</span>`).join('');
    const windIndices=Object.keys(state.cats).map(Number).filter(i=>state.board[i]===R.DUST);
    $('cat-warning').hidden=!windIndices.length;
    $('cat-warning').textContent=windIndices.length?`Scatters surrounding animals in ${state.cats[windIndices[0]]} rescues · ${3-state.cats[windIndices[0]]}/3 filled`:'';
    const watchedArea=new Set(windIndices.flatMap(i=>R.windRing(state.board,i))),blastArea=new Set();
    const playable = new Set(R.groups(state.board).flat());
    $('board').innerHTML = state.board.map((t,i)=>`<button class="animal ${watchedArea.has(i)?'wind-neighbor':''} ${blastArea.has(i)?'blast-warning':''} ${R.isSpecial(t)?`magic-cat dust-devil`:''} ${playable.has(i)?'hint':''}" data-cell="${i}" data-type="${t}" aria-label="${R.isSpecial(t)?`Dust devil, ${3-state.cats[i]} of 3 turns complete. Scatters surrounding animals after three rescues. Pip can lead animals clear`:singular[t]}, row ${Math.floor(i/6)+1}, column ${i%6+1}" aria-pressed="false" tabindex="${i===30?0:-1}">${icon(R.isSpecial(t)?7:t)}${R.isSpecial(t)?`<span class="cat-life" aria-hidden="true">${Array.from({length:3},(_,dot)=>`<i class="${dot<3-state.cats[i]?'lit':''}"></i>`).join('')}</span>`:''}</button>`).join('');
    $('bark').disabled = !state.bark || busy || state.status!=='playing';
    $('bark').innerHTML = `<span aria-hidden="true">🐕</span><span>${state.bark?'Pip, bark!':'Good dog, Pip.'}<small>${state.bark?(Object.keys(state.cats).length?'+3 steps · clear the gust':'+3 steps · regroup · once'):'Bark used this field'}</small></span>`;
    renderSelection(); scheduleFit();
  }
  function renderSelection() {
    const chosen=new Set(selected);
    $('board').setAttribute('aria-busy',String(busy));
    $('board').classList.toggle('has-selection',selected.length>0);
    [...$('board').children].forEach((el,i)=>{el.classList.toggle('selected',chosen.has(i));el.setAttribute('aria-pressed',String(chosen.has(i)));el.disabled=busy||state.status!=='playing';});
    $('whistle').disabled=!selected.length||busy||state.status!=='playing';
    $('whistle-label').textContent=selected.length?`Whistle ${selected.length} home`:'Choose a herd';
  }
  function select(i) {
    if(!ready||busy||state.status!=='playing'||$('story-dialog').open)return;
    if(R.isSpecial(state.board[i])){selected=[];renderSelection();say(`A dust devil! ${3-state.cats[i]}/3 turns complete. After three rescues it scatters up to eight surrounding animals, then becomes the animal making the largest herd. Clear below it to move it down.`);return;}

    const g=R.group(state.board,i);
    if(g.length<3){selected=[];renderSelection();say(`Only ${g.length} here. Find 3+ matching animals touching side to side.`);return;}
    if(selected.includes(i)){commit();return;}
    selected=g; tone('select',{animal:state.board[i]}); renderSelection();
    const step=R.wolfStep(g.length)-R.pressure(state.moves+1)-R.burstPreview(state).cats.length;
    const effect=step>0?'Wolves step back!':step===0?'Wolves stay put.':`Wolves ${-step} ${step===-1?'step':'steps'} closer${state.distance<=-step?' — finish the goal!':'.'}`;
    say(`${g.length} ${names[state.board[i]]} (+${R.herdPoints(g.length)} pts). ${effect}`);
  }
  function commit() {
    if(!ready||busy||!selected.length||state.status!=='playing'||$('story-dialog').open)return;
    busy=true;
    const start=selected[0],ticket=generation,activeCell=document.activeElement?.dataset?.cell;
    selected.forEach(i=>$('board').children[i].classList.add('rescuing'));
    const blast=R.burstPreview(state);
    blast.cats.forEach(i=>$('board').children[i].classList.add('cat-bursting'));
    blast.animals.forEach(i=>$('board').children[i].classList.add('burst-rescued'));
    renderSelection(); $('bark').disabled=true; tone('rescue',{animal:state.board[start]});
    setTimeout(()=>{
      if(ticket!==generation)return;
      const previousDistance=state.distance;
      const result=R.rescue(state,start);
      selected=[];busy=!!result.rotations?.length&&!reducedMotion.matches;render();
      if(!result.ok)return;
      const trail=$('trail-steps').children,from=trail[previousDistance],to=trail[state.distance];
      const wolf=to?.querySelector?.('svg');
      if(wolf&&!reducedMotion.matches&&previousDistance!==state.distance){
        const offset=from.getBoundingClientRect().left-to.getBoundingClientRect().left;
        wolf.animate([{transform:`translateX(${offset}px)`},{transform:'translateX(0)'}],{duration:450,easing:'ease-in-out'});
      }
      if(state.distance<previousDistance)tone('snarl',{delay:.32});
      else if(state.distance>previousDistance)tone('whimper',{delay:.32});
      if(result.catAppeared>=0)$('board').children[result.catAppeared].classList.add('cat-appearing');
      animateWind(result.rotations);
      if(busy)setTimeout(()=>{if(ticket!==generation)return;busy=false;render();},2500);
      result.gifts.forEach(gift=>gift.finalCells.forEach(i=>$('board').children[i].classList.add('gift-arrival')));
      [...result.burstCats,...result.burstAnimals].forEach(i=>$('board').children[i].classList.add('new-arrival'));
      result.cleared.forEach(i=>$('board').children[i].classList.add('new-arrival'));
      if(keyboardInput&&activeCell!==undefined){
        [...$('board').children].forEach(el=>{el.tabIndex=-1;});
        const cell=$('board').children[Number(activeCell)];
        if(cell){cell.tabIndex=0;cell.focus({preventScroll:true});}
      }
      say(`${result.count} ${names[result.type]} home! ${result.step>0?'The pack backs away.':result.step===0?'The pack holds back.':`The pack moves ${-result.step} ${result.step===-1?'step':'steps'} closer.`}${result.catAppeared>=0?' A dust devil rolls in!':''}${result.rotations.length?' Whoosh! Nearby animals scatter.':''}${result.gifts.length?` The wind settles into ${names[result.gifts[0].type]}, making a herd of ${result.gifts[0].size}.`:''}${result.regrouped?' A new herd gathered.':''}`);
      if(state.status!=='playing'){
        // Let the final wolf position and rescue feedback remain visible.
        setTimeout(()=>{if(ticket===generation)finishField();},reducedMotion.matches?350:result.rotations.length?2700:900);
      }
    },reducedMotion.matches?0:230);
  }
  function animateWind(rotations){
    if(!rotations.length)return;
    tone('whoosh');
    if(reducedMotion.matches)return;
    const cells=$('board').children;
    for(const rotation of rotations){
      const destinations=rotation.moves.map(move=>move.to);
      for(const [j,move] of rotation.moves.entries()){
        const svg=cells[move.to]?.querySelector?.('svg');if(!svg)continue;
        const to=cells[move.to].getBoundingClientRect();
        const positions=[move.from,destinations[(j+1)%destinations.length],destinations[(j+2)%destinations.length],destinations[(j+3)%destinations.length],move.to];
        const frame=index=>{const at=cells[index].getBoundingClientRect();return {transform:`translate(${at.left-to.left}px,${at.top-to.top}px)`,opacity:1};};
        // Three temporary arrangements, with a pause at each, then the real result.
        const [start,first,second,third,end]=positions.map(frame);
        svg.animate([{...start,offset:0},{...first,offset:.18},{...first,offset:.25},{...second,offset:.43},{...second,offset:.5},{...third,offset:.68},{...third,offset:.75},{...end,offset:1}],{duration:2400,easing:'ease-in-out'});
      }
      cells[rotation.index]?.classList.add('wind-turn');
      if(rotation.completed===3)cells[rotation.index]?.classList.add('wind-finished');
    }
  }
  function startField(chapter, carriedBoard = null,cats={},distance=R.CHAPTERS[chapter].distance,wait=null) {
    generation++;busy=false;selected=[];ready=true;
    state=R.create(chapter,Math.random,carriedBoard,cats,undefined,wait);fieldEntryWait=state.windWait;state.distance=distance;fieldEntryDistance=distance;fieldEntryBoard=state.board.slice();fieldEntryCats={...state.cats};render();window.scrollTo(0,0);
    say('Select a herd of 3+ matching animals that touch.');
  }
  function freshAdventure() {
    total=0;bankedScore=0;bankedMoves=0;bankedBiggest={count:0,type:0};pipUsed=[false,false,false];
    finalResult=null;submission={pending:false,done:false,message:''};
    if(shareCard)URL.revokeObjectURL(shareCard.url);shareCard=null;shareReady=false;
    runNonce=newNonce();startedAt=Date.now();closeDialog();startField(0);
  }
  function leaveFinishedAdventure(){ready=false;closeDialog();say('Adventure over. Rest here, or choose Play again for a new journey.');}
  function finishField() {
    if(state.status==='lost'){
      ready=false;
      openDialog({view:'lost',eyebrow:'ADVENTURE OVER · THE ANIMALS ARE SHELTERING',title:'The wolves caught up.',
        copy:'Pip led the animals to safety. This adventure has ended. Start a new journey from field one, or leave the game here.',
        action:'Play again · start at field 1',run:freshAdventure,secondary:'Not now',secondaryRun:leaveFinishedAdventure});return;
    }
    tone('win');
    if(state.chapter===2){
      const rested=pipUsed.filter(used=>!used).length,bonus=R.restBonus(rested);
      finalResult=Object.freeze({score:bankedScore+state.score+bonus,herdingScore:bankedScore+state.score,bonus,rested,
        saved:total+state.saved.reduce((a,b)=>a+b,0),biggest:{...(state.biggest.count>bankedBiggest.count?state.biggest:bankedBiggest)},
        moves:bankedMoves+state.moves,durationMs:Date.now()-startedAt,nonce:runNonce,personalBest:bankedScore+state.score+bonus>best});
      if(finalResult.score>best){best=finalResult.score;try{localStorage.setItem('aw-rescue-best-v2',String(best));}catch{}}
      showResults();prepareShare(finalResult);return;
    }
    const next=R.CHAPTERS[state.chapter+1],rested=pipUsed.slice(0,state.chapter+1).filter(used=>!used).length;
    // One transition screen. Never close/reopen the same dialog during its tap.
    openDialog({eyebrow:`FIELD ${state.chapter+1} OF 3 COMPLETE`,title:['The sheep are safe.','Out of the orchard.'][state.chapter],copy:`${R.CHAPTERS[state.chapter].ending} ${next.story}`,
      details:`<div class="stat-line"><span><strong>${total+state.saved.reduce((a,b)=>a+b,0)}</strong>animals home</span><span><strong>${rested}</strong>fields Pip rested</span></div><p class="dialog-tip">Next: ${next.name}. Your animals carry forward. The wolves stay ${state.distance} steps away. Pip gets a fresh bark. Dust devils wait three rescues, scatter surrounding animals, then settle into an animal. Pip can lead the animals clear.</p>`,
      action:`Continue to field ${state.chapter+2}`,run:()=>{
        total+=state.saved.reduce((a,b)=>a+b,0);bankedScore+=state.score;bankedMoves+=state.moves;
        if(state.biggest.count>bankedBiggest.count)bankedBiggest={...state.biggest};
        const chapter=state.chapter+1,board=state.board.slice(),cats={...state.cats},distance=state.distance,wait=state.windWait;closeDialog();tone('gate');startField(chapter,board,cats,distance,wait);
      }});
  }
  function showResults() {
    const r=finalResult;if(!r)return;
    openDialog({view:'results',eyebrow:'ADVENTURE COMPLETE · ALL THREE FIELDS',title:'Everyone is home.',copy:R.CHAPTERS[2].ending,
      details:`<div class="stat-line"><span><strong>${r.saved}</strong>animals home</span><span><strong>${r.score.toLocaleString()}</strong>total points</span></div><div class="result-actions"><button id="post-score" class="primary" type="button">${submission.done?'🏆 Score status & leaderboard':'🏆 Add my high score'}</button><button id="share-score" class="primary" type="button" ${shareReady?'':'disabled'}>${shareReady?'Share my score ↗':'Preparing card…'}</button></div><p id="result-status" class="dialog-tip" role="status"></p><p class="score-breakdown">${r.herdingScore.toLocaleString()} herding + <b>${r.bonus} Pip rest bonus</b><br>Pip rested in ${r.rested}/3 fields · personal best ${best.toLocaleString()}</p><div class="biggest-herd">${icon(r.biggest.type)}<span>Biggest herd: <b>${r.biggest.count} ${names[r.biggest.type]}</b></span></div><p id="share-status" class="dialog-tip" role="status"></p><button id="copy-caption" class="text-button" type="button">Copy game link</button><details><summary>Preview share image</summary><img id="share-preview" class="share-preview" alt="Your Angry Wolves score card" hidden></details>`,
      action:'Play again · start at field 1',run:freshAdventure});
    $('result-status').textContent=r.rank?`🏆 High score! You placed #${r.rank} on the top 20 board.`:submission.message || 'Add your three letters and badge before starting another adventure.';
    const ticket=dialogGeneration;
    $('share-score').addEventListener('click',async()=>{
      $('share-score').disabled=true;
      $('share-status').textContent='Choose an app to share your score image and game link.';
      try{
        const outcome=await window.RescueShare.share(r,shareCard);
        if(ticket!==dialogGeneration)return;
        $('share-status').textContent=outcome==='shared'?'Your share is ready.':outcome==='cancelled'?'Sharing cancelled. Your score is still here.':'Image sharing is unavailable in this browser. Use Copy game link.';
      }catch{if(ticket===dialogGeneration)$('share-status').textContent='Sharing could not open. Try again or copy the game link.';}
      finally{if(ticket===dialogGeneration)$('share-score').disabled=false;}
    });
    $('post-score').addEventListener('click',showLeaderboard);
    $('copy-caption').addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(S.GAME_URL);if(ticket===dialogGeneration)$('share-status').textContent='Game link copied.';}
      catch{if(ticket===dialogGeneration)$('share-status').textContent=S.GAME_URL;}
    });
    attachShare();
  }
  async function prepareShare(result) {
    try{
      const card=await window.RescueShare.makeCard(result,icon);
      if(finalResult!==result){URL.revokeObjectURL(card.url);return;}
      if(shareCard)URL.revokeObjectURL(shareCard.url);shareCard=card;shareReady=true;attachShare();
    }catch{if(finalResult!==result)return;shareReady=true;if(dialogView==='results'){$('share-status').textContent='The image could not be prepared. You can still share your score and link.';$('share-score').disabled=false;$('share-score').textContent='Share my score ↗';}}
  }
  function attachShare(){
    if(dialogView!=='results'||!shareCard)return;
    $('share-preview').src=shareCard.url;$('share-preview').hidden=false;
    $('share-score').disabled=false;$('share-score').textContent='Share my score ↗';
  }
  function showLeaderboard() {
    if(busy)return;
    const {initials,badge}=playerProfile;
    const badgeChoices=S.PICKER_BADGES.includes(badge)?S.PICKER_BADGES:[...S.PICKER_BADGES,badge];
    const locked=/^[A-Z]{3}$/.test(initials)&&!profileUnlocked;
    const form=finalResult&&!submission.done?`<form id="score-form"><p id="player-lock-status" class="dialog-tip">${locked?'Saved player locked. Your previous scores keep their original name.':'Choose a player for this and future scores. Previous scores keep their original name.'}</p><button id="toggle-player-lock" type="button" class="text-button">${locked?'Change player':'Lock player'}</button><fieldset id="player-fields" class="player-fields" ${locked?'disabled':''}><label class="initials-label" for="score-initials">Your three letters</label><input id="score-initials" maxlength="3" minlength="3" pattern="[A-Za-z]{3}" required autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC" aria-label="Three-letter player name"><fieldset class="badge-picker"><legend>Choose your shepherd badge</legend>${badgeChoices.map(i=>`<label><input type="radio" name="shepherd-badge" value="${i}" ${i===badge?'checked':''}><span title="${S.BADGE_NAMES[i]}" aria-label="${S.BADGE_NAMES[i]}">${S.BADGES[i]}</span></label>`).join('')}</fieldset></fieldset><button id="submit-score" class="primary" type="submit" ${submission.pending?'disabled':''}>${submission.pending?'Saving…':`Post ${finalResult.score.toLocaleString()} points`}</button></form>`:'';
    openDialog({view:'leaderboard',eyebrow:'THE SHEPHERDS’ BOARD',title:'The top shepherds',copy:'Top 20 adventures. Beat the lowest score to join; earlier scores win ties.',
      details:`<p id="submit-status" class="dialog-tip" role="status"></p><p id="leaderboard-status" role="status">Loading scores…</p><ol id="leaderboard-list" class="leaderboard-list" tabindex="0" aria-label="Top scores. Scroll for more."></ol><button id="refresh-scores" class="text-button" type="button">Refresh scores</button>${form?`<details class="score-entry"><summary>Add your score · ${finalResult.score.toLocaleString()} points</summary>${form}</details>`:''}`,
      action:finalResult?'Back to my score':'Back to the field',run:finalResult?showResults:closeDialog});
    $('submit-status').textContent=submission.message;
    if($('score-initials')){
      $('score-initials').value=initials;
      $('toggle-player-lock').addEventListener('click',()=>{
        if($('player-fields').disabled){
          profileUnlocked=true;$('player-fields').disabled=false;$('toggle-player-lock').textContent='Lock player';
          $('player-lock-status').textContent='Edit your player. Previous scores keep their original name.';
        }else if(/^[A-Z]{3}$/.test(playerProfile.initials)){
          profileUnlocked=false;rememberProfile();$('player-fields').disabled=true;$('toggle-player-lock').textContent='Change player';
          $('player-lock-status').textContent='Saved player locked.';
        }else{$('player-lock-status').textContent='Enter three letters before locking your player.';}
      });
      $('score-initials').addEventListener('input',e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);playerProfile.initials=e.target.value;rememberProfile();});
      $('score-form').addEventListener('change',e=>{if(e.target.name==='shepherd-badge'){playerProfile.badge=Number(e.target.value);rememberProfile();}});
      $('score-form').addEventListener('submit',postScore);
    }
    $('refresh-scores').addEventListener('click',loadLeaderboard);
    loadLeaderboard();
  }
  async function loadLeaderboard(){
    if(dialogView!=='leaderboard')return;
    const ticket=dialogGeneration;
    $('leaderboard-status').textContent='Loading scores…';$('refresh-scores').disabled=true;
    try{
      const entries=await S.leaderboard();if(ticket!==dialogGeneration)return;
      $('leaderboard-list').replaceChildren();
      entries.forEach((entry,i)=>{
        const row=document.createElement('li'),rank=document.createElement('span'),name=document.createElement('strong'),score=document.createElement('span'),herd=document.createElement('small');
        rank.className='rank';rank.textContent=String(i+1);name.textContent=S.decodeName(entry.playerName);score.textContent=entry.score.toLocaleString();
        const animal=S.ANIMALS.includes(entry.biggestHerdAnimal)?entry.biggestHerdAnimal:'🐑';
        herd.textContent=`Biggest herd ${Math.max(0,Math.min(36,Number(entry.biggestHerdCount)||0))} ${animal}`;
        row.append(rank,name,score,herd);$('leaderboard-list').append(row);
      });
      if(finalResult && !submission.done && $('submit-score')) {
        const eligible=S.qualifies(entries,finalResult.score);
        $('submit-score').disabled=submission.pending||!eligible;
        $('submit-status').textContent=eligible ? submission.message || 'Your score qualifies! Choose three letters and a badge.' : `This time you need more than ${entries[S.LIMIT-1].score.toLocaleString()} points to enter the top 20.`;
      }
      if(finalResult && submission.done && submission.playerName && !finalResult.rank) {
        const rank=S.verifiedRank(entries,finalResult,submission.playerName);
        if(rank) {
          finalResult=Object.freeze({...finalResult,rank,playerLabel:S.decodeName(submission.playerName)});
          submission.message=`High score saved! You placed #${rank} on the top 20 board.`;
          $('submit-status').textContent=submission.message;
          if(shareCard)URL.revokeObjectURL(shareCard.url);shareCard=null;shareReady=false;prepareShare(finalResult);
        }
      }
      $('leaderboard-status').textContent=entries.length?'Completed adventures · highest score first':'The pasture is fresh. Be the first shepherd on the board!';
    }catch{if(ticket===dialogGeneration)$('leaderboard-status').textContent='The score sheet is taking a break. Tap Refresh to try again.';}
    finally{if(ticket===dialogGeneration)$('refresh-scores').disabled=false;}
  }
  async function postScore(event){
    event.preventDefault();if(submission.pending||submission.done||!finalResult)return;
    const initials=$('score-initials').value,badge=Number(document.querySelector('input[name="shepherd-badge"]:checked').value),result=finalResult;
    try{S.encodeName(initials,badge);}catch(error){$('submit-status').textContent=error.message;return;}
    submission.pending=true;submission.message='Saving this adventure…';$('submit-status').textContent=submission.message;$('submit-score').disabled=true;
    try{
      const entries=await S.leaderboard();
      if(finalResult!==result)return;
      if(!S.qualifies(entries,result.score))throw new Error(`The board has changed. You need more than ${entries[S.LIMIT-1].score.toLocaleString()} points for the top 20.`);
      const response=await S.submit(result,initials,badge);
      if(finalResult!==result)return;
      submission.done=true;submission.playerName=S.encodeName(initials,badge);submission.message=response.message;
      playerProfile={initials,badge};profileUnlocked=false;rememberProfile();
      if(dialogView==='leaderboard'){$('score-form')?.remove();$('submit-status').textContent=submission.message;loadLeaderboard();}
      else if(dialogView==='results')showResults();
    }catch(error){if(finalResult===result){submission.message=error.message||'Could not save. Your score is still here; try again.';if($('submit-status'))$('submit-status').textContent=submission.message;}}
    finally{if(finalResult===result){submission.pending=false;if($('submit-score'))$('submit-score').disabled=false;}}
  }
  // Let Safari complete a native tap after scrolling; pointer-up position checks
  // can reject a valid tap when the browser bars or keyboard move the viewport.
  function bindDialogButton(id,getAction){
    let lastActivation=-Infinity,pressedGeneration=null;
    $(id).addEventListener('pointerdown',()=>{pressedGeneration=dialogGeneration;});
    $(id).addEventListener('pointercancel',()=>{pressedGeneration=null;});
    $(id).addEventListener('click',event=>{
      if(event.detail>0&&pressedGeneration!==dialogGeneration)return;
      pressedGeneration=null;
      const now=performance.now();
      if(event.detail>0&&now-lastActivation<450)return;
      lastActivation=now;const action=getAction();if(action)action();
    });
  }
  $('board').addEventListener('click',e=>{const cell=e.target.closest('[data-cell]');if(cell)select(Number(cell.dataset.cell));});
  $('board').addEventListener('keydown',e=>{
    const cell=e.target.closest('[data-cell]');if(!cell)return;
    const i=Number(cell.dataset.cell);let next=i;
    if(e.key==='ArrowLeft')next=Math.max(i-i%6,i-1);else if(e.key==='ArrowRight')next=Math.min(i-i%6+5,i+1);
    else if(e.key==='ArrowUp')next=Math.max(0,i-6);else if(e.key==='ArrowDown')next=Math.min(35,i+6);else return;
    e.preventDefault();cell.tabIndex=-1;$('board').children[next].tabIndex=0;$('board').children[next].focus({preventScroll:true});
  });
  document.addEventListener('pointerdown',()=>{keyboardInput=false;},{passive:true});
  document.addEventListener('keydown',e=>{
    keyboardInput=true;
    if(e.code==='Space'&&!$('story-dialog').open&&!e.repeat&&(e.target===document.body||e.target.closest('#board')||e.target.closest('#whistle'))){e.preventDefault();commit();}
    if(e.key==='Escape'&&!$('story-dialog').open){selected=[];renderSelection();say('Choose a different herd when you are ready.');}
  });
  $('whistle').addEventListener('click',commit);
  $('bark').addEventListener('click',()=>{
    if(!ready||busy||$('story-dialog').open||!state.bark||state.status!=='playing')return;
    const previousDistance=state.distance,catIndices=Object.keys(state.cats).map(Number),ticket=generation;
    tone('bark');
    const finish=()=>{
      if(ticket!==generation)return;
      if(!R.bark(state)){busy=false;renderSelection();return;}
      busy=false;pipUsed[state.chapter]=true;selected=[];
      if(state.distance>previousDistance)tone('whimper',{delay:.4});render();
      catIndices.forEach(i=>$('board').children[i].classList.add('new-arrival'));
      say(catIndices.length?'Woof! Pip leads the animals clear. The gust fades and animals fill the gap.':'Good dog! Wolves back 3 steps. The animals regrouped.');
    };
    if(catIndices.length){busy=true;selected=[];renderSelection();$('bark').disabled=true;catIndices.forEach(i=>$('board').children[i].classList.add('cat-vanishing'));setTimeout(finish,reducedMotion.matches?0:230);}else finish();
  });
  $('retry').addEventListener('click',()=>{
    if(busy)return;
    if(state.status==='lost'){freshAdventure();return;}
    openDialog({eyebrow:'A FRESH START',title:'Try this field again?',copy:'Earlier fields stay complete. This field’s animals, points, and wolf distance reset. Pip gets another bark, but any bark already used still counts against the rest bonus.',action:'Restart this field',run:()=>{closeDialog();startField(state.chapter,fieldEntryBoard,fieldEntryCats,fieldEntryDistance,fieldEntryWait);},secondary:'Keep playing',secondaryRun:closeDialog});
  });
  $('guide').addEventListener('click',()=>{
    if(busy)return;
    openDialog({eyebrow:'YOU ARE THE SHEPHERD',title:'Think first. Then whistle.',copy:'Select a herd, see what will happen, then whistle it home. Fill the animal goals to continue with the same board.',
      details:'<div class="instruction"><b>Find a herd.</b> 3+ matching animals must touch horizontally or vertically. Diagonals do not count.</div><div class="instruction"><b>Whistle.</b> Tap the button or your selected herd again. Spaces refill from above.</div><div class="instruction"><b>Watch the pack.</b> 3 animals: two steps closer. 4: one step closer. 5–7: stay put. 8+: one step back.</div><div class="instruction"><b>Let Pip rest.</b> No rest: +0. One field: +100. Two: +250. All three: +500. Paid once when everyone is home. Using Pip on any attempt counts, even after retrying.</div><div class="instruction"><b>Call Pip once per attempt.</b> His bark adds three steps and regroups the animals. It costs no move.</div><div class="instruction"><b>Points.</b> 10 per animal plus a bigger-herd bonus. Successful fields and Pip’s final bonus make your leaderboard score.</div><div class="instruction"><b>Dust devils.</b> A gust arrives in one of the four middle columns of the top row after a random wait of 2–5 successful rescues, starting in field one. If only an outside column refills, it waits for a middle opening. Arrival does not fill a dot. You have three more rescues to steer it by clearing animals below. After the third rescue and gravity, it randomly shuffles the surrounding eight tiles, including diagonals (five at an edge, three at a corner). Animals stay playable until then. Only the gust becomes the animal making the largest herd; ties are chosen randomly. No immediate points are awarded. Pip disperses the gust early. A fresh 2–5 rescue wait begins after it leaves. Progress and the wait carry between fields.</div><div class="instruction"><b>Plan ahead.</b> Animals stay on the board between fields. Later arrivals spread out. From whistle 18, wolves advance one extra step each move; from 26, two extra steps—even big herds cannot hold them off forever. Finish before the pressure catches you.</div><div class="instruction"><b>Keyboard.</b> Arrow keys move, Enter selects, Space whistles. Escape clears selection.</div><div class="instruction"><b>Sound.</b> Use 🔊 / 🔇 at the top. Safari starts sound after a tap—there is no microphone permission to grant. Raise media volume and check Bluetooth if quiet. On older Safari versions, turn Silent Mode off.<button id="test-sound" class="text-button" type="button">Turn on and test sound</button><span id="sound-test-status" role="status"></span><div id="voice-preview" class="voice-preview" aria-label="Try the animal sounds"><button type="button" data-voice="sheep">🐑 Sheep</button><button type="button" data-voice="pig">🐷 Pig</button><button type="button" data-voice="hen">🐔 Hen</button><button type="button" data-voice="cow">🐮 Cow</button><button type="button" data-voice="bark">🐕 Pip</button><button type="button" data-voice="snarl">🐺 Snarl</button><button type="button" data-voice="whimper">🐺 Whimper</button></div></div>',
      action:'Back to the field',run:closeDialog});
    $('voice-preview').addEventListener('click',event=>{
      const button=event.target.closest('[data-voice]');if(!button)return;
      soundOn=true;A.setEnabled(true);soundLabel();try{localStorage.setItem('aw-rescue-sound','1');}catch{}
      const voice=button.dataset.voice,animal=['sheep','pig','hen','cow'].indexOf(voice),ticket=dialogGeneration;
      A.play(animal>=0?'rescue':voice,{animal}).then(played=>{if(ticket===dialogGeneration)$('sound-test-status').textContent=played?'Sound sent. You can try another animal.':'Tap again to start sound, and check your media volume.';});
    });
    $('test-sound').addEventListener('click',()=>{soundOn=true;A.reset();A.setEnabled(true);soundLabel();const ticket=dialogGeneration;A.play('gate').then(played=>{if(ticket===dialogGeneration)$('sound-test-status').textContent=played?'Sound test sent. If you heard nothing, raise media volume and check Bluetooth or Silent Mode.':'Safari did not start audio. Tap Test sound again, or reload this page.';});try{localStorage.setItem('aw-rescue-sound','1');}catch{}});
  });
  $('sound').addEventListener('click',()=>{soundOn=!soundOn;A.setEnabled(soundOn);soundLabel();try{localStorage.setItem('aw-rescue-sound',soundOn?'1':'0');}catch{}if(soundOn)tone('gate');});
  $('leaderboard').addEventListener('click',showLeaderboard);
  bindDialogButton('dialog-action',()=>dialogAction);bindDialogButton('dialog-secondary',()=>dialogSecondary);
  $('story-dialog').addEventListener('cancel',e=>{e.preventDefault();if(dialogView==='lost'){leaveFinishedAdventure();return;}if(dialogView==='leaderboard'&&finalResult)showResults();else if(ready&&state.status==='playing')closeDialog();});
  let fitFrame=0;
  function scheduleFit(){if(!fitFrame)fitFrame=requestAnimationFrame(fitViewport);}
  function fitViewport(){
    fitFrame=0;
    const viewport=window.visualViewport;
    if(viewport&&Math.abs(viewport.scale-1)>.01)return;
    const height=Math.floor(Math.min(window.innerHeight,viewport?.height||window.innerHeight));
    document.documentElement.style.setProperty('--visible-height',`${height}px`);
    document.documentElement.style.setProperty('--visible-top',`${Math.floor(viewport?.offsetTop||0)}px`);
    if(window.matchMedia('(max-width:700px)').matches){
      const area=document.querySelector('.play-area');
      const others=['.goals','.wolf-trail','.cat-warning','.feedback','.actions','.board-foot'];
      let reserved=0;
      for(const selector of others){const el=area.querySelector(selector),css=getComputedStyle(el);reserved+=el.getBoundingClientRect().height+parseFloat(css.marginTop)+parseFloat(css.marginBottom);}
      const size=Math.max(80,Math.floor(Math.min(area.clientWidth,area.clientHeight-reserved-3)));
      document.documentElement.style.setProperty('--field-size',`${size}px`);
    }
  }
  window.addEventListener('resize',scheduleFit,{passive:true});window.visualViewport?.addEventListener('resize',scheduleFit,{passive:true});window.visualViewport?.addEventListener('scroll',scheduleFit,{passive:true});
  window.addEventListener('pageshow',scheduleFit,{passive:true});
  new ResizeObserver(scheduleFit).observe(document.querySelector('.play-area'));
  fieldEntryBoard=state.board.slice();soundLabel();render();intro();
})();
