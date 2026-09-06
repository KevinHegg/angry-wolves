// Reproducible tuning aid, not a claim about human playtest success rates.
const R = require('../rescue-engine.js');
const trials = 1000;
function seeded(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
for (const strategy of ['random', 'goal-aware']) {
  const rows = [];
  for (let chapter = 0; chapter < R.CHAPTERS.length; chapter++) {
    let wins = 0, moves = 0;
    for (let seed = 1; seed <= trials; seed++) {
      const rng = seeded(seed), state = R.create(chapter, rng);
      while (state.status === 'playing' && state.moves < 100) {
        if (state.distance <= 2 && state.bark) R.bark(state, rng);
        const groups = R.groups(state.board);
        const value = group => {
          const type = state.board[group[0]];
          return 2 * Math.min(Math.max(0, R.CHAPTERS[chapter].goal[type] - state.saved[type]), group.length) + group.length;
        };
        if (strategy === 'goal-aware') groups.sort((a, b) => value(b) - value(a));
        R.rescue(state, groups[strategy === 'random' ? Math.floor(rng() * groups.length) : 0][0], rng);
      }
      if (state.status === 'won') wins++;
      moves += state.moves;
    }
    rows.push({ chapter: chapter + 1, wins: `${wins}/${trials}`, averageMoves: moves / trials });
  }
  console.log(strategy, JSON.stringify(rows));
}

for (const policy of ['emergency bark', 'let Pip rest']) {
  let wins=0;const bases=[],bonuses=[];
  for(let seed=1;seed<=trials;seed++){
    const rng=seeded(seed);let score=0,rests=0,won=true,carry=null,cats={},distance=R.CHAPTERS[0].distance;
    for(let chapter=0;chapter<3;chapter++){
      const state=R.create(chapter,rng,carry,cats);state.distance=distance;
      while(state.status==='playing'&&state.moves<100){
        if(policy==='emergency bark'&&state.distance<=2&&state.bark)R.bark(state,rng);
        const groups=R.groups(state.board);
        const value=g=>2*Math.min(Math.max(0,R.CHAPTERS[chapter].goal[state.board[g[0]]]-state.saved[state.board[g[0]]]),g.length)+g.length;
        groups.sort((a,b)=>value(b)-value(a));R.rescue(state,groups[0][0],rng);
      }
      if(state.status!=='won'){won=false;break;}
      carry=state.board.slice();cats={...state.cats};distance=state.distance;score+=state.score;rests+=state.bark;
    }
    if(won){wins++;bases.push(score);bonuses.push(R.restBonus(rests));}
  }
  bases.sort((a,b)=>a-b);
  console.log(policy,JSON.stringify({wins:`${wins}/${trials}`,medianBase:bases[Math.floor(bases.length/2)],meanBonus:Math.round(bonuses.reduce((a,b)=>a+b,0)/bonuses.length)}));
}
