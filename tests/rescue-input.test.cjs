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
test('touch release plus Safari synthetic click activates a gate only once',()=>{
 const c=controls();const e={pointerId:1,pointerType:'touch',clientX:20,clientY:20,preventDefault(){}};
 c.handlers.pointerdown(e);c.handlers.pointerup(e);c.handlers.click({detail:1});assert.equal(c.count(),1);
 c.setTime(1000);c.handlers.click({detail:1});assert.equal(c.count(),2);
});
test('a scroll or changed dialog cannot activate an old gate',()=>{
 const c=controls();const e={pointerId:1,pointerType:'touch',clientX:20,clientY:20,preventDefault(){}};
 c.handlers.pointerdown(e);c.handlers.pointerup({...e,clientY:80});assert.equal(c.count(),0);
 c.handlers.pointerdown(e);c.context.dialogGeneration++;c.handlers.pointerup(e);assert.equal(c.count(),0);
});
