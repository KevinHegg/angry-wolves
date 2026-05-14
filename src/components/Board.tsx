import { colorToCss, colorToName } from '../game/colors';
import type { Level, PieceType, SimulationResult } from '../game/types';
export function Board({level,placed,selected,onPlace,onToggle,result}:{level:Level;placed:Record<string,PieceType>;selected?:PieceType;onPlace:(id:string)=>void;onToggle:(id:string)=>void;result?:SimulationResult|null}){
return <div className='board'>{level.nodes.map(n=>{const p=n.fixedPiece??placed[n.id];const sig=result?.nodeSignals[n.id];
return <button key={n.id} className='node' style={{left:`${n.x*24+6}%`,top:`${n.y*24+12}%`,borderColor:sig?.active?colorToCss(sig.color):'#2d4b44'}} onClick={()=>n.fixedPiece==='SWITCH'?onToggle(n.id):onPlace(n.id)}>
<div>{p??n.label}</div><small>{sig?colorToName(sig.color):''}</small></button>;})}</div>}
