import type { ColorMask } from './types';
export const COLORS = { NONE:0, RED:1, GREEN:2, BLUE:4, YELLOW:3, MAGENTA:5, CYAN:6, WHITE:7 } as const;
export const colorToName=(c:ColorMask)=>({0:'NONE',1:'RED',2:'GREEN',3:'YELLOW',4:'BLUE',5:'MAGENTA',6:'CYAN',7:'WHITE'}[c]);
export const colorToCss=(c:ColorMask)=>({0:'#303540',1:'#ff4d4d',2:'#5bff8f',3:'#ffe866',4:'#58a6ff',5:'#ff6dff',6:'#51fff2',7:'#ffffff'}[c]);
export const mixColors=(colors:ColorMask[]):ColorMask=> colors.reduce((a,b)=> (a|b) as ColorMask,0 as ColorMask);
