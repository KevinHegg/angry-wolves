// The existing bound project keeps its code in one Code.gs file.
const fs=require('node:fs'),path=require('node:path');
const FILES=['Leaderboard.gs','DailyBoards.gs','DailyRules.gs','ConsolidatedBoards.gs'];
function bundle(root=path.join(__dirname,'..')){
  return FILES.map(name=>`// Source: apps-script/${name}\n`+fs.readFileSync(path.join(root,'apps-script',name),'utf8')).join('\n\n');
}
if(require.main===module){
  if(!process.argv[2])throw Error('Usage: node scripts/build-apps-script.cjs <output-Code.gs>');
  fs.writeFileSync(process.argv[2],bundle());
}
module.exports={bundle};
