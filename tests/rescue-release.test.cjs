const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const version='2.52';
test('main game loads matching immutable release assets without redirecting',()=>{
 const source=read('index.html');assert.doesNotMatch(source,/location.replace/);
 for(const name of ['rescue.js','rescue-daily.js','rescue-engine.js','rescue-services.js','rescue-share.js','rescue-audio.js','rescue-voices.js','rescue.css']){
  assert.equal(read(`play/${version}/${name}`),read(name));
  assert.ok(source.includes(`play/${version}/${name}`));
 }
 assert.doesNotMatch(read('rescue.js'),/save-card|Save score image/);
});
test('link previews point at the published score-free card image',()=>{
 const source=read('index.html'),image=fs.readFileSync(path.join(__dirname,'..','hungry-wolf-card.png'));
 assert.ok(source.includes('<meta property="og:image" content="https://kevinhegg.github.io/angry-wolves/hungry-wolf-card.png">'));
 assert.ok(source.includes('<meta name="twitter:card" content="summary_large_image">'));assert.ok(source.includes('<meta property="og:url" content="https://kevinhegg.github.io/angry-wolves/">'));
 assert.equal(image.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(image.readUInt32BE(16),1200);assert.equal(image.readUInt32BE(20),630);
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
