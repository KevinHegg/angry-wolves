const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('release is self-contained and old entry routes lead to the rescue game',()=>{
 for(const name of ['rescue.js','rescue-engine.js','rescue-services.js','rescue-share.js','rescue-audio.js','rescue-voices.js','rescue.css'])assert.equal(read(`play/2.16/${name}`),read(name));
 const source=read('index.html');assert.match(source,/location.replace\('play\/2.16\/'\)/);
 assert.equal(read('play/2.16/index.html'),source.replace("  <script>location.replace('play/2.16/');</script>\n",''));
 assert.doesNotMatch(read('play/2.16/index.html'),/classic.html|location.replace/);
 assert.match(read('classic.html'),/location.replace\('play\/2.16\/'\)/);
 assert.doesNotMatch(read('rescue.js'),/save-card|Save score image/);
});
