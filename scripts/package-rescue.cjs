// Keep each published release self-contained so Safari cannot mix cached versions.
const fs=require('node:fs');
const version='2.5';
const destination=`play/${version}`;
fs.mkdirSync(destination,{recursive:true});
for(const name of ['index.html','rescue.js','rescue-engine.js','rescue-services.js','rescue-share.js','rescue-audio.js','rescue-voices.js','rescue.css']){
 const source=fs.readFileSync(name,'utf8');
 fs.writeFileSync(`${destination}/${name}`,name==='index.html'?source.replace(`  <script>location.replace('play/${version}/');</script>\n`,''):source);
}
