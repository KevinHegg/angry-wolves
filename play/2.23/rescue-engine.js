/* Pure rules shared by the browser and the dependency-free Node tests. */
(function (root) {
  'use strict';
  const SIZE = 6;
  const CAT = 4, GOOD_CAT = 5, DUST = 6;
  const isCat = t => t === CAT || t === GOOD_CAT;
  const isSpecial = t => isCat(t) || t === DUST;
  const WIND_SETTINGS = Object.freeze({enabled:true,maxCats:1,firstChapter:0,waitMin:2,waitMax:5,minLife:3,maxLife:3,cooldown:1,kind:"wind"});
  const CAT_SETTINGS = Object.freeze({enabled:true,maxCats:1,firstChapter:1,chance:.25,goodChance:.65,minMoves:2,minLife:2,maxLife:3,cooldown:1});
  const REST_BONUSES = Object.freeze([0, 100, 250, 500]);
  function restBonus(rested) { return REST_BONUSES[Math.max(0, Math.min(3, Math.floor(rested)))]; }
  function wolfStep(count) { return count === 3 ? -1 : count < 7 ? 0 : 1; }
  function herdPoints(count) { return count * 10 + Math.max(0, count - 3) ** 2 * 2; }
  function pressure(moves) { return moves >= 26 ? 2 : moves >= 18 ? 1 : 0; }
  const CHAPTERS = [
    { name: 'The open pasture', time: 'Late afternoon', goal: [14, 0, 0, 0], types: 4, distance: 5,
      story: 'The gate is open. The sheep have wandered out. Get 14 sheep home before the wolves reach the field.',
      ending: 'The sheep are through the gate. But there is trouble down by the orchard.' },
    { name: 'Trouble in the orchard', time: 'Sunset', goal: [0, 18, 18, 0], types: 4, distance: 6,
      story: 'The pigs and hens heard the howling. They are hiding in the orchard. Bring 18 of each back to the lane.',
      ending: 'The orchard is quiet. One last herd is stranded beside the woods.' },
    { name: 'The last gate', time: 'Nightfall', goal: [14, 14, 14, 14], types: 4, distance: 5,
      story: 'The barn lantern is lit. The pack is close. Bring 14 of every animal home, then shut the last gate.',
      ending: 'The last gate swings shut. Every herd is home. The wolves will have to go hungry tonight.' }
  ];
  function neighbors(i) {
    return [i % SIZE ? i - 1 : -1, i % SIZE < SIZE - 1 ? i + 1 : -1,
      i >= SIZE ? i - SIZE : -1, i < SIZE * (SIZE - 1) ? i + SIZE : -1].filter(n => n >= 0);
  }
  function group(board, start) {
    if (!Number.isInteger(start) || start < 0 || start >= board.length) return [];
    if (isSpecial(board[start])) return [];
    const found = new Set([start]), todo = [start];
    while (todo.length) for (const n of neighbors(todo.pop())) {
      if (board[n] === board[start] && !found.has(n)) { found.add(n); todo.push(n); }
    }
    return [...found];
  }
  function groups(board) {
    const seen = new Set(), result = [];
    for (let i = 0; i < board.length; i++) if (!seen.has(i)) {
      const g = group(board, i); seen.add(i); g.forEach(n => seen.add(n)); if (g.length >= 3) result.push(g);
    }
    return result;
  }
  const animal = (types, rng) => Math.floor(rng() * types);
  function ensureMove(board, types, rng) {
    if (groups(board).length) return false;
    // A flock gathers when no move exists. No turn or resource is consumed.
    const t = animal(types, rng);
    const first = [30,33,24,27,18,21,12,15,6,9,0,3].find(i=>![board[i],board[i+1],board[i+2]].some(isSpecial));
    board[first] = board[first+1] = board[first+2] = t;
    return true;
  }
  function openingBoard(rng) {
    // Choose a balanced count mix before shuffling: no species gets priority.
    const mixes=[];
    for(let a=8;a<=10;a++)for(let b=8;b<=10;b++)for(let c=8;c<=10;c++){
      const d=36-a-b-c;
      if(d>=8&&d<=10&&![a,b,c,d].every(n=>n===9))mixes.push([a,b,c,d]);
    }
    const counts=mixes[Math.floor(rng()*mixes.length)];
    const board=counts.flatMap((count,type)=>Array(count).fill(type));
    for(let i=board.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[board[i],board[j]]=[board[j],board[i]];}
    if(!groups(board).length){
      // Swap, rather than create animals, to preserve the chosen counts.
      const type=animal(4,rng),row=Math.floor(rng()*6),col=Math.floor(rng()*4);
      const targets=[row*6+col,row*6+col+1,row*6+col+2];
      for(const to of targets)if(board[to]!==type){
        const from=board.findIndex((t,i)=>t===type&&!targets.includes(i));
        [board[to],board[from]]=[board[from],board[to]];
      }
    }
    return board;
  }
  function create(chapter = 0, rng = Math.random, carriedBoard = null, carriedCats = {}, settings = WIND_SETTINGS, carriedWait = null, carriedBarks = 3) {
    const c = CHAPTERS[chapter];
    const board = carriedBoard ? carriedBoard.slice() : chapter===0 ? openingBoard(rng) : Array.from({ length: SIZE * SIZE }, () => animal(c.types, rng));
    // Standalone later-field test starts retain their useful herd; actual play carries the board.
    const first = c.goal.findIndex(n => n > 0);
    if (!carriedBoard && chapter !== 0) {
      board[30] = board[31] = board[32] = first;
      if (chapter !== 0) board[33] = first;
    }
    return { chapter, board, windWait:carriedWait??windWait(rng), catSettings:settings, cats:Object.fromEntries(board.flatMap((t,i)=>isSpecial(t)?[[i,Math.min(3,Math.max(1,carriedCats[i]||3))]]:[])),catCooldown:0, saved: [0, 0, 0, 0], distance: c.distance, bark: carriedBarks, moves: 0, score: 0, biggest: {count: 0, type: 0}, status: 'playing' };
  }
  function rescue(state, start, rng = Math.random) {
    if (state.status !== 'playing') return { ok: false };
    const settings=state.catSettings||CAT_SETTINGS;
    const g = group(state.board, start);
    if (g.length < 3) return { ok: false };
    const type = state.board[start], count = g.length, cleared = new Set(g);
    state.saved[type] += count;
    state.score += herdPoints(count);
    state.moves++;
    if (count > state.biggest.count) state.biggest = {count, type};
    const preview=burstPreview(state),burstAnimals=[];
    for(const key of Object.keys(state.cats))state.cats[key]--;
    for(const i of preview.animals)if(!cleared.has(i)){
      state.saved[state.board[i]]++;cleared.add(i);burstAnimals.push(i);
    }
    for(const i of preview.cats)cleared.add(i);
    const step = wolfStep(count) - pressure(state.moves) - preview.cats.length;
    state.distance = Math.max(0, Math.min(10, state.distance + step));
    if(preview.cats.length)state.catCooldown=settings.cooldown;
    const filled=collapse(state,cleared,rng);
    const gifts=[],rotations=[];
    for(const i of Object.keys(state.cats).map(Number))if(state.board[i]===DUST){
      if(state.cats[i]===0){
        const moves=scatterWind(state.board,i,rng);rotations.push({index:i,moves,completed:3});
        const gift=windGift(state,i,rng);state.board[i]=gift.type;delete state.cats[i];gifts.push(gift);
      }
    }
    for(const i of Object.keys(state.cats).map(Number))if(state.board[i]===GOOD_CAT && state.cats[i]<=0){
      const gift=bestGift(state,i);gift.cells.forEach(n=>state.board[n]=gift.type);delete state.cats[i];
      gift.size=Math.max(...gift.finalCells.map(n=>group(state.board,n).length));gifts.push(gift);
    }
    if(gifts.length)state.catCooldown=settings.cooldown;
    // A last-turn rescue succeeds before the pack can enter the field.
    if (CHAPTERS[state.chapter].goal.every((n, i) => state.saved[i] >= n)) state.status = 'won';
    else if (state.distance <= 0) state.status = 'lost';
    let catAppeared=-1;
    if(settings.kind==='wind'){
      if(gifts.length)state.windWait=windWait(rng);
      else if(settings.enabled && !Object.keys(state.cats).length && state.status==='playing'){
        state.windWait--;
        if(state.windWait<=0){
          const top=filled.filter(i=>i>0&&i<SIZE-1);
          // If only an outside column refilled, wait for an interior opening.
          if(top.length){catAppeared=top[Math.floor(rng()*top.length)];state.board[catAppeared]=DUST;state.cats[catAppeared]=3;}
          else state.windWait=0;
        }
      }
    }else     if(Object.keys(state.cats).length<settings.maxCats){
      if(state.catCooldown>0)state.catCooldown--;
      else if(settings.enabled && state.chapter>=settings.firstChapter && state.moves>=settings.minMoves && state.status==='playing' && rng()<settings.chance){
        catAppeared=filled[Math.floor(rng()*filled.length)];state.board[catAppeared]=settings.kind==='wind'?DUST:rng()<settings.goodChance?GOOD_CAT:CAT;
        state.cats[catAppeared]=settings.minLife+Math.floor(rng()*(settings.maxLife-settings.minLife+1));
      }
    }
    const regrouped = ensureMove(state.board, CHAPTERS[state.chapter].types, rng);
    return { ok: true, count, type, step, cleared: g, regrouped,burstCats:preview.cats,burstAnimals,catAppeared,gifts,rotations };
  }
  function windWait(rng){return WIND_SETTINGS.waitMin+Math.floor(rng()*(WIND_SETTINGS.waitMax-WIND_SETTINGS.waitMin+1));}
  function windRing(board,index){
    const row=Math.floor(index/SIZE),col=index%SIZE,ring=[];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      const r=row+dy,c=col+dx;
      if((dx||dy)&&r>=0&&r<SIZE&&c>=0&&c<SIZE&&!isSpecial(board[r*SIZE+c]))ring.push(r*SIZE+c);
    }
    return ring;
  }
  function scatterWind(board,index,rng=Math.random){
    const ring=windRing(board,index),sources=ring.slice(),before=board.slice();
    for(let j=sources.length-1;j>0;j--){const k=Math.floor(rng()*(j+1));[sources[j],sources[k]]=[sources[k],sources[j]];}
    const moves=ring.map((to,j)=>({from:sources[j],to,type:before[sources[j]]}));
    moves.forEach(m=>board[m.to]=m.type);return moves;
  }
  function windGift(state,index,rng=Math.random){
    const choices=[];let largest=0;
    for(let type=0;type<CHAPTERS[state.chapter].types;type++){
      const board=state.board.slice();board[index]=type;const size=group(board,index).length;
      if(size>largest){choices.length=0;largest=size;}if(size===largest)choices.push(type);
    }
    return {cells:[index],finalCells:[index],type:choices[Math.floor(rng()*choices.length)],size:largest};
  }
  // Always include the cat plus one animal neighbor; no extra gap or fall.
  function bestGift(state,index){
    const pool=[index,...neighbors(index).filter(i=>!isSpecial(state.board[i]))],take=Math.min(2,pool.length);
    const subsets=[];
    function choose(start,cells){if(cells.length===take){subsets.push(cells);return;}for(let n=start;n<pool.length;n++)choose(n+1,[...cells,pool[n]]);}
    choose(1,[index]);let best=null;
    for(const cells of subsets)for(let type=0;type<CHAPTERS[state.chapter].types;type++){
      const board=state.board.slice();cells.forEach(i=>board[i]=type);
      const finalCells=cells.slice();
      const size=Math.max(...finalCells.map(n=>group(board,n).length)),need=Math.max(0,CHAPTERS[state.chapter].goal[type]-state.saved[type]);
      if(!best||size>best.size||(size===best.size&&need>best.need))best={cells,finalCells,type,size,need};
    }
    return best;
  }
  function catNeighbors(state){
    return [...new Set(Object.keys(state.cats).map(Number).filter(i=>state.board[i]===CAT).flatMap(neighbors))].filter(i=>!isSpecial(state.board[i]));
  }
  function burstPreview(state){
    const cats=Object.keys(state.cats).map(Number).filter(i=>state.cats[i]===1&&state.board[i]===CAT);
    const animals=[...new Set(cats.flatMap(neighbors))].filter(i=>!isSpecial(state.board[i]));
    return {cats,animals};
  }
  function collapse(state,cleared,rng){
    const filled=[],nextCats={};
    for (let col = 0; col < SIZE; col++) {
      const survivors = [];
      for (let row = SIZE - 1; row >= 0; row--) {
        const i = row * SIZE + col;
        if (!cleared.has(i)) survivors.push({type:state.board[i],turns:state.cats[i]});
      }
      for (let row = SIZE - 1; row >= 0; row--){
        const index=row*SIZE+col,tile=survivors[SIZE-1-row];
        state.board[index]=tile?.type??null;
        if(isSpecial(tile?.type))nextCats[index]=tile.turns;
      }
    }
    state.cats=nextCats;
    // Later arrivals spread out, but existing herds are never rearranged.
    const types = CHAPTERS[state.chapter].types;
    const scatter = Math.min(.6, Math.max(0, state.moves - 8) * .03);
    for (let i = state.board.length - 1; i >= 0; i--) if (state.board[i] === null) {
      let next = animal(types, rng);
      if (scatter > 0 && rng() < scatter) {
        const adjacent = neighbors(i).map(n => state.board[n]);
        const counts = Array.from({length:types},(_,t)=>adjacent.filter(v=>v===t).length);
        const choices = counts.map((n,t)=>n===Math.min(...counts)?t:-1).filter(t=>t>=0);
        next = choices[Math.floor(rng()*choices.length)];
      }
      state.board[i] = next;filled.push(i);
    }
    return filled;
  }
  function bark(state, rng = Math.random) {
    if (state.status !== 'playing' || !state.bark) return false;
    state.bark--;
    state.distance = Math.min(10, state.distance + 3);
    const catIndices=Object.keys(state.cats).map(Number).filter(i=>isCat(state.board[i]));
    if(catIndices.length){
      collapse(state,new Set(catIndices),rng);state.windWait=windWait(rng);state.catCooldown=CAT_SETTINGS.cooldown;
      ensureMove(state.board,CHAPTERS[state.chapter].types,rng);return true;
    }
    const animals=state.board.map((t,i)=>isSpecial(t)?-1:i).filter(i=>i>=0);
    for (let i = animals.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [state.board[animals[i]], state.board[animals[j]]] = [state.board[animals[j]], state.board[animals[i]]];
    }
    ensureMove(state.board, CHAPTERS[state.chapter].types, rng);
    return true;
  }
  const api = { SIZE, CAT, GOOD_CAT, DUST, isCat, isSpecial, WIND_SETTINGS, windRing, scatterWind, windGift, bestGift, catNeighbors, CAT_SETTINGS, CHAPTERS, REST_BONUSES, restBonus, wolfStep, herdPoints, pressure, neighbors, group, groups, create, rescue, bark, burstPreview };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RescueRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
