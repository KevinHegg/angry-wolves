// Publish the game, not the repository's notes, backend, tests or working files.
const fs=require('node:fs');
const path=require('node:path');
const ASSETS=['rescue.js','rescue-engine.js','rescue-services.js','rescue-share.js','rescue-audio.js','rescue-voices.js','rescue.css'];
function buildSite(destination,root=path.join(__dirname,'..')){
  if(!destination)throw new Error('Choose an empty output directory.');
  const output=path.resolve(destination);
  if(fs.existsSync(output)&&fs.readdirSync(output).length)throw new Error('Output directory must be empty.');
  const copy=relative=>{
    const target=path.join(output,relative);
    fs.mkdirSync(path.dirname(target),{recursive:true});
    fs.copyFileSync(path.join(root,relative),target);
  };
  for(const name of ['index.html','classic.html','COPYRIGHT.txt'])copy(name);
  // Keep old runtime assets for players with a cached entry page. Entry URLs
  // themselves redirect to the current root, as maintained by the packager.
  for(const entry of fs.readdirSync(path.join(root,'play'),{withFileTypes:true})){
    if(!entry.isDirectory()||!/^2\.\d+$/.test(entry.name))continue;
    for(const name of ['index.html',...ASSETS]){
      const relative=`play/${entry.name}/${name}`;
      if(fs.existsSync(path.join(root,relative)))copy(relative);
    }
  }
  fs.writeFileSync(path.join(output,'.nojekyll'),'');
  return output;
}
if(require.main===module){
  if(!process.argv[2])throw new Error('Usage: node scripts/build-site.cjs <empty-output-directory>');
  console.log(buildSite(process.argv[2]));
}
module.exports={buildSite,ASSETS};
