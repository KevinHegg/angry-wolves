const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const version='2.28';
test('main game loads matching immutable release assets without redirecting',()=>{
 const source=read('index.html');assert.doesNotMatch(source,/location.replace/);
 for(const name of ['rescue.js','rescue-engine.js','rescue-services.js','rescue-share.js','rescue-audio.js','rescue-voices.js','rescue.css']){
  assert.equal(read(`play/${version}/${name}`),read(name));
  assert.ok(source.includes(`play/${version}/${name}`));
 }
 assert.doesNotMatch(read('rescue.js'),/save-card|Save score image/);
});
test('every customer version URL and classic route redirects to the base URL',()=>{
 const root='https://kevinhegg.github.io/angry-wolves/';
 for(const dir of fs.readdirSync(path.join(__dirname,'../play'))){
  if(!/^2\.\d+$/.test(dir))continue;
  const html=read(`play/${dir}/index.html`),target=html.match(/location.replace\('([^']+)'\)/)[1];
  for(const suffix of ['', 'index.html'])assert.equal(new URL(target,`${root}play/${dir}/${suffix}`).href,root+`?refresh=${version}`);
  assert.doesNotMatch(html,/src=|id="board"/);
 }
 assert.ok(read('classic.html').includes(`location.replace('./?refresh=${version}')`));
});
