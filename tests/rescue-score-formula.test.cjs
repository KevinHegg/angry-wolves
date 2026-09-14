const test=require('node:test'),assert=require('node:assert/strict');
const {publicScoreFormula}=require('../scripts/public-score-formula.cjs');
test('form row insertion cannot shift the intake start or desynchronize columns',()=>{
 for(const end of [1001,5001]){
  const formula=publicScoreFormula(end),refs=[...formula.matchAll(/INDIRECT\("'Form Responses 1'!([A-N])2:([A-N])(\d+)"\)/g)];
  assert.equal(refs.length,38);
  assert.ok(refs.every(m=>m[1]===m[2]&&Number(m[3])===end));
  // Simulate Sheets adjusting direct references after Forms inserts response row 2.
  const insertRow=source=>source.replace(/'Form Responses 1'![A-N]\d+:[A-N]\d+/g,(range,offset)=>source.slice(offset-10,offset)==='INDIRECT("'?range:range.replace(/\d+/g,n=>Number(n)+1));
  assert.equal(insertRow(insertRow(insertRow(formula))),formula);
  assert.match(formula,/MATCH\(INDIRECT.*=ROW\(INDIRECT.*\)-1/);
  assert.match(formula,/\*35/);assert.match(formula,/\^rescue-\(v2\|daily-v1\)\$/);
 }
});
