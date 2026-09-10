// The main URL loads immutable versioned assets; customer version URLs redirect home.
const fs=require('node:fs');
const version='2.28';
const destination=`play/${version}`;
fs.mkdirSync(destination,{recursive:true});
for(const name of ['rescue.js','rescue-engine.js','rescue-services.js','rescue-share.js','rescue-audio.js','rescue-voices.js','rescue.css']){
 fs.copyFileSync(name,`${destination}/${name}`);
}
function redirect(target){return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hungry Wolf · Bring them home</title><link rel="canonical" href="https://kevinhegg.github.io/angry-wolves/"><meta http-equiv="refresh" content="0;url=${target}"><script>location.replace('${target}');</script><a href="${target}">Play Hungry Wolf</a></html>\n`;}
// The refresh query avoids a cached main-page redirect back to an old version.
// index.html removes only that query parameter once the current entry page loads.
for(const dir of fs.readdirSync('play',{withFileTypes:true}))if(dir.isDirectory()&&/^2\.\d+$/.test(dir.name)){
 fs.writeFileSync(`play/${dir.name}/index.html`,redirect(`../../?refresh=${version}`));
}
fs.writeFileSync('classic.html',redirect(`./?refresh=${version}`));
