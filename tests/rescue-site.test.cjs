const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {buildSite,ASSETS}=require('../scripts/build-site.cjs');
const root=path.join(__dirname,'..');
test('Pages artifact includes only playable assets and preserves historical URLs',t=>{
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'hungry-wolf-site-'));
  t.after(()=>fs.rmSync(output,{recursive:true,force:true}));
  buildSite(output);
  const expected=['index.html','classic.html','COPYRIGHT.txt','.nojekyll'];
  for(const version of fs.readdirSync(path.join(root,'play')).filter(name=>/^2\.\d+$/.test(name))){
    for(const name of ['index.html',...ASSETS]){
      const relative=`play/${version}/${name}`;
      if(fs.existsSync(path.join(root,relative)))expected.push(relative);
    }
  }
  const actual=fs.readdirSync(output,{recursive:true}).filter(name=>fs.statSync(path.join(output,name)).isFile());
  assert.deepEqual(actual.sort(),expected.sort());
  for(const name of expected.filter(name=>name!=='.nojekyll')){
    assert.deepEqual(fs.readFileSync(path.join(output,name)),fs.readFileSync(path.join(root,name)),name);
  }
  for(const name of ['apps-script','tests','README.md','HUNGRY_WOLF_AUDIT.md','.git','rescue.js']){
    assert.equal(fs.existsSync(path.join(output,name)),false,name+' must not be published');
  }
});
test('site builder refuses to overwrite a nonempty directory',t=>{
  const output=fs.mkdtempSync(path.join(os.tmpdir(),'hungry-wolf-preserve-'));
  t.after(()=>fs.rmSync(output,{recursive:true,force:true}));
  fs.writeFileSync(path.join(output,'keep.txt'),'Keep this file');
  assert.throws(()=>buildSite(output),/must be empty/);
  assert.equal(fs.readFileSync(path.join(output,'keep.txt'),'utf8'),'Keep this file');
});
