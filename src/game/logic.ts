import { COLORS, colorToName, mixColors } from './colors';
import type { Level, PieceType, Signal, SimulationResult } from './types';

const off:Signal={active:false,color:COLORS.NONE};
export function applyGate(piece:PieceType, inputs:Signal[], switchOn=true):Signal {
  const activeInputs=inputs.filter(i=>i.active);
  switch(piece){
    case 'AND': return {active: inputs.length>0 && inputs.every(i=>i.active), color: mixColors(activeInputs.map(i=>i.color))};
    case 'OR': return {active: activeInputs.length>0, color: mixColors(activeInputs.map(i=>i.color))};
    case 'XOR': return activeInputs.length===1?{active:true,color:activeInputs[0].color}:off;
    case 'NOT': { const i=inputs[0]??off; return {active:!i.active,color: i.color||COLORS.WHITE}; }
    case 'MIXER': return {active:activeInputs.length>0,color:mixColors(activeInputs.map(i=>i.color))};
    case 'FILTER_RED': {const i=inputs.find(x=>x.active&&(x.color&COLORS.RED)); return i?{active:true,color:COLORS.RED}:off;}
    case 'FILTER_GREEN': {const i=inputs.find(x=>x.active&&(x.color&COLORS.GREEN)); return i?{active:true,color:COLORS.GREEN}:off;}
    case 'FILTER_BLUE': {const i=inputs.find(x=>x.active&&(x.color&COLORS.BLUE)); return i?{active:true,color:COLORS.BLUE}:off;}
    case 'SWITCH': return switchOn?(inputs[0]??off):off;
  }
}

export function simulateLevel(level:Level, placed:Record<string,PieceType>, switches:Record<string,boolean>):SimulationResult{
  const incoming:Record<string,string[]>={}; level.nodes.forEach(n=>incoming[n.id]=[]); level.edges.forEach(e=>incoming[e.to].push(e.from));
  const signals:Record<string,Signal>={}; level.nodes.forEach(n=>signals[n.id]=n.inputSignal??off);
  for(let iter=0;iter<8;iter++){
    for(const n of level.nodes){
      const ins=incoming[n.id].map(id=>signals[id]??off);
      if(n.type==='input') continue;
      const piece=n.fixedPiece??placed[n.id];
      if(!piece){ signals[n.id]=ins[0]??off; continue; }
      signals[n.id]=applyGate(piece,ins,switches[n.id]??true);
    }
  }
  const outputNode=level.nodes.find(n=>n.type==='output')!;
  const output=signals[outputNode.id]??off;
  const success=output.active===level.requiredActive && output.color===level.requiredColor;
  let reason='Puzzle Solved!';
  if(!success){ reason=!output.active?'Output inactive':`Wrong color: got ${colorToName(output.color)}, need ${colorToName(level.requiredColor)}`; }
  const activeEdges=level.edges.filter(e=>signals[e.from]?.active && signals[e.to]?.active).map(e=>`${e.from}->${e.to}`);
  return {output,success,reason,nodeSignals:signals,activeEdges};
}
