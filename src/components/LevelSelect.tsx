import { levels } from '../game/levels';
export function LevelSelect({completed,onPick,onHow}:{completed:number[];onPick:(n:number)=>void;onHow:()=>void}){return <div className='screen'><h1>Logic Fuse</h1><button onClick={onHow}>How to Play</button>{levels.map(l=><button key={l.id} onClick={()=>onPick(l.id)}>Stage {l.id}: {l.name} {completed.includes(l.id)?'✅':''}</button>)}</div>}
