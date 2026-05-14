export type ColorMask = 0|1|2|3|4|5|6|7;
export type PieceType = 'AND'|'OR'|'XOR'|'NOT'|'MIXER'|'FILTER_RED'|'FILTER_GREEN'|'FILTER_BLUE'|'SWITCH';
export type NodeType = 'input'|'socket'|'gate'|'filter'|'mixer'|'switch'|'output'|'diode';
export interface Signal { active:boolean; color:ColorMask }
export interface Node { id:string; type:NodeType; label:string; x:number; y:number; fixedPiece?:PieceType; inputSignal?:Signal; }
export interface Edge { from:string; to:string }
export interface Socket { nodeId:string }
export interface Level {
  id:number; name:string; timerSeconds:number; requiredActive:boolean; requiredColor:ColorMask;
  nodes:Node[]; edges:Edge[]; sockets:Socket[]; availablePieces:PieceType[]; hints:string[];
}
export interface SimulationResult { output:Signal; success:boolean; reason:string; nodeSignals:Record<string,Signal>; activeEdges:string[] }
