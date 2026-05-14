import { describe,it,expect } from 'vitest';
import { COLORS,mixColors } from './colors';
import { applyGate, simulateLevel } from './logic';
import { levels } from './levels';

describe('logic',()=>{
 it('mixColors',()=>expect(mixColors([COLORS.GREEN,COLORS.BLUE])).toBe(COLORS.CYAN));
 it('AND',()=>expect(applyGate('AND',[{active:true,color:1},{active:true,color:2}]).active).toBe(true));
 it('OR',()=>expect(applyGate('OR',[{active:false,color:1},{active:true,color:2}]).active).toBe(true));
 it('XOR',()=>expect(applyGate('XOR',[{active:true,color:1},{active:true,color:2}]).active).toBe(false));
 it('NOT',()=>expect(applyGate('NOT',[{active:false,color:0}]).active).toBe(true));
 it('filter',()=>expect(applyGate('FILTER_RED',[{active:true,color:COLORS.WHITE}]).color).toBe(COLORS.RED));
 it('success condition',()=>{const r=simulateLevel(levels[1],{s1:'AND'},{}) ;expect(r.success).toBe(true)});
 it('wrong color',()=>{const r=simulateLevel(levels[2],{s1:'OR'},{}) ;expect(r.success).toBe(false)});
});
