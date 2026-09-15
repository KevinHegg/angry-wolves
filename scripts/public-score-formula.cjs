// Paste this formula into public!A50 only. Never overwrite the historical rows.
// INDIRECT keeps the start fixed when Google Forms inserts a response row.
// Increase the shared bound before 1,000 responses; every column stays aligned.
function publicScoreFormula(lastRow=1001){
 if(!Number.isInteger(lastRow)||lastRow<2)throw new Error('Expected a response row bound');
 const ref=c=>`INDIRECT("'Form Responses 1'!${c}2:${c}${lastRow}")`;
 const num=(c,fallback=-1)=>`IFERROR(VALUE(${ref(c)}),${fallback})`;
 const match=(c,pattern)=>`REGEXMATCH(${ref(c)},"${pattern}")`;
 const columns=[`TEXT(${ref('A')},"yyyy-mm-dd")&"T12:00:00."&TEXT(ROW(${ref('A')})-2,"000")&"Z"`,ref('B'),num('C'),ref('D'),ref('E'),num('F',0),num('G',0),ref('H'),num('I',0),num('J',0),num('K',0),ref('N'),ref('L')];
 const conditions=[`LEN(${ref('B')})>0`,match('B','^[A-Z]{3}[0-9A-J]$'),match('D','^rescue-(v2|daily-v1)$')];
 for(const [c,min,max]of [['C',0,999999],['F',0,99],['G',0,36],['I',0,200],['J',0,10],['K',8000,86400000]])conditions.push(`${num(c)}>=${min}`,`${num(c)}<=${max}`);
 // Scores are not a clock: large herds and the no-Pip bonus can be earned quickly.
 conditions.push(`LEN(${ref('L')})>0`,`MATCH(${ref('L')},${ref('L')},0)=ROW(${ref('L')})-1`,match('N','^rescue-2\\.[0-9]+$'),`IF(${ref('D')}="rescue-daily-v1",${match('E','^Daily [0-9]{4}-[0-9]{2}-[0-9]{2} · ')},TRUE)`);
 return `=ARRAYFORMULA(IFERROR(FILTER({${columns.join(',')}},${conditions.join(',')}),))`;
}
if(require.main===module)console.log(publicScoreFormula());
module.exports={publicScoreFormula};
