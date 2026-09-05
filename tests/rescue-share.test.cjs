const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const S=require('../rescue-services');
const result={score:2114,saved:126,biggest:{count:10,type:1},rested:2,bonus:250};
function harness(navigator){
 const window={RescueServices:S};
 class File {constructor(parts,name,options){this.parts=parts;this.name=name;this.type=options.type;}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../rescue-share.js'),'utf8'),{window,navigator,File});
 return window.RescueShare;
}
test('native share receives the prepared PNG and exact score caption',async()=>{
 let sent;const h=harness({canShare:()=>true,share:data=>{sent=data;return Promise.resolve();}});
 assert.equal(await h.share(result,{blob:'prepared-image'}),'shared');
 assert.equal(sent.files[0].name,'angry-wolves-score.png');assert.equal(sent.files[0].type,'image/png');
 assert.ok(sent.text.includes('2,114'));assert.ok(sent.text.includes('10 🐷'));assert.ok(sent.text.includes(S.GAME_URL));
});
test('text-only native sharing includes a public game URL',async()=>{
 let sent;const h=harness({canShare:()=>false,share:data=>{sent=data;return Promise.resolve();}});
 await h.share(result,null);assert.equal(sent.url,S.GAME_URL);assert.equal(sent.files,undefined);
});
test('unsupported sharing falls back and cancellation never claims success',async()=>{
 assert.equal(await harness({}).share(result,null),'fallback');
 assert.equal(await harness({share:()=>Promise.reject({name:'AbortError'})}).share(result,null),'cancelled');
});
