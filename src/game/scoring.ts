export const computeScore=(timeLeft:number,penalties:number,hints:number)=>Math.max(0,1000+timeLeft*20-penalties*25-hints*100);
