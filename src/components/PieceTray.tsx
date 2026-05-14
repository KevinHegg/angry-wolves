import type { PieceType } from '../game/types';
export function PieceTray({pieces,selected,onSelect}:{pieces:PieceType[];selected?:PieceType;onSelect:(p:PieceType)=>void}){return <div className='tray'>{pieces.map((p,i)=><button aria-label={`piece ${p}`} key={p+i} className={selected===p?'sel':''} onClick={()=>onSelect(p)}>{p}</button>)}</div>}
