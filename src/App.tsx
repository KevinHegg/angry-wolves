import { useState } from 'react';
import { GameScreen } from './components/GameScreen';
import { HowToPlay } from './components/HowToPlay';
import { LevelSelect } from './components/LevelSelect';

export default function App(){const progress=JSON.parse(localStorage.getItem('logic-fuse-progress')||'{"completed":[]}'); const [level,setLevel]=useState<number|null>(null);const [how,setHow]=useState(false);
return <main>{how&&<HowToPlay onClose={()=>setHow(false)}/>} {level?<GameScreen levelId={level} onDone={()=>setLevel(null)}/>:<LevelSelect completed={progress.completed||[]} onPick={setLevel} onHow={()=>setHow(true)}/>}</main>}
