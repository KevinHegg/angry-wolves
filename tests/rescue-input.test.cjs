const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function controls(){
 const source=fs.readFileSync(require.resolve('../rescue.js'),'utf8');
 const begin=source.indexOf('  function bindDialogButton('),end=source.indexOf("  $('board').addEventListener",begin);
 assert.ok(begin>=0&&end>begin);
 const handlers={},button={addEventListener:(name,fn)=>handlers[name]=fn};let count=0,clock=100;
 const context={$:()=>button,performance:{now:()=>clock},dialogGeneration:1,Math};
 vm.createContext(context);vm.runInContext(source.slice(begin,end)+'\nthis.bind=bindDialogButton;',context);
 context.bind('gate',()=>()=>count++);
 return {handlers,context,count:()=>count,setTime:value=>clock=value};
}
test('first gate click works immediately after page load',()=>{
 const c=controls();c.handlers.click({detail:1});assert.equal(c.count(),1);
});
test('native taps after scrolling work without pointer-coordinate assumptions',()=>{
 const c=controls();assert.equal(c.handlers.pointerup,undefined);c.handlers.click({detail:1});assert.equal(c.count(),1);
 c.setTime(1100);c.handlers.click({detail:1});assert.equal(c.count(),2);
});
test('duplicate taps cannot trigger the next screen and keyboard activation remains available',()=>{
 const c=controls();c.handlers.click({detail:1});c.context.dialogGeneration++;c.handlers.click({detail:1});assert.equal(c.count(),1);
 c.handlers.click({detail:0});assert.equal(c.count(),2);
});
