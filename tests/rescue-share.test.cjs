const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const S=require('../rescue-services');
const result={score:2114,saved:126,biggest:{count:10,type:1},rested:2,bonus:250};
function harness(navigator,extra={}){
 const window={RescueServices:S};
 class File {constructor(parts,name,options){this.parts=parts;this.name=name;this.type=options.type;}}
 vm.runInNewContext(fs.readFileSync(require.resolve('../rescue-share.js'),'utf8'),{window,navigator,File,...extra});
 return window.RescueShare;
}
test('native share receives the prepared PNG, score text and link without repeating the link',async()=>{
 let sent;const h=harness({canShare:()=>true,share:data=>{sent=data;return Promise.resolve();}});
 assert.equal(await h.share(result,{blob:'prepared-image'}),'shared');
 assert.equal(sent.files[0].name,'hungry-wolf-score.png');assert.equal(sent.files[0].type,'image/png');
 assert.equal(sent.text,S.caption(result,false));assert.ok(!sent.text.includes(S.GAME_URL));assert.equal(sent.url,'https://kevinhegg.github.io/angry-wolves/');
});
test('text-only native sharing includes the score text and a public game URL',async()=>{
 let sent;const h=harness({canShare:()=>false,share:data=>{sent=data;return Promise.resolve();}});
 await h.share(result,null);assert.equal(sent.url,'https://kevinhegg.github.io/angry-wolves/');assert.equal(sent.files,undefined);assert.match(sent.text,/2,114 points · biggest herd: 10 🐷/);assert.ok(!sent.text.includes(S.GAME_URL));
});
test('desktop image tools appear only without file sharing, copy synchronously and download otherwise',async()=>{
 const items=[],clicks=[];class ClipboardItem{constructor(data){this.data=data;}}
 const document={createElement:()=>({click(){clicks.push(this);},remove(){}}),body:{append(){}}},card={blob:'png-bytes',url:'blob:card'};
 const h=harness({clipboard:{write:list=>{items.push(...list);return Promise.resolve();}}},{ClipboardItem,document});
 assert.equal(h.canShareImage(result,card),false);assert.equal(h.canCopyImage(),true);
 const pending=h.copyImage(card);assert.equal(items[0].data['image/png'],'png-bytes','the clipboard item exists before any await');assert.equal(await pending,true);
 h.saveImage({...result,challengeDate:'2026-09-14'},card);assert.equal(clicks[0].download,'hungry-wolf-daily-2026-09-14.png');assert.equal(clicks[0].href,'blob:card');
 const plain=harness({clipboard:{writeText(){}}});assert.equal(plain.canCopyImage(),false);assert.equal(await plain.copyImage(card),false);
 assert.equal(harness({canShare:()=>true,share(){}}).canShareImage(result,card),true);assert.equal(harness({canShare:()=>true,share(){}}).canShareImage(result,null),false);
});
test('card address comes from GAME_URL and the poster card is score-free',async()=>{
 const texts=[];const ctx=new Proxy({fillText:text=>texts.push(String(text))},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
 const window={RescueServices:S},source=fs.readFileSync(require.resolve('../rescue-share.js'),'utf8');assert.doesNotMatch(source,/'kevinhegg\.github\.io/);
 vm.runInNewContext(source,{window,document:{createElement:()=>({getContext:()=>ctx,toBlob:fn=>fn('png')})},Image:class{async decode(){}},URL:{createObjectURL:()=> 'blob:card'}});
 await window.RescueShare.makeCard(result,()=>'<svg></svg>');assert.ok(texts.includes('https://kevinhegg.github.io/angry-wolves'));
 texts.length=0;await window.RescueShare.makeCard({poster:true,biggest:{type:0}},()=>'<svg></svg>');
 for(const line of ['Bring them home.','A cozy puzzle with an impatient wolf.','Gather herds.','Time your whistle.','THINK FIRST. THEN WHISTLE.','https://kevinhegg.github.io/angry-wolves'])assert.ok(texts.includes(line),line);
 assert.ok(!texts.some(t=>/\d|TOTAL POINTS|BIGGEST HERD|BEAT MY HERD/.test(t)));
});
test('unsupported sharing falls back and cancellation never claims success',async()=>{
 assert.equal(await harness({}).share(result,null),'fallback');
 assert.equal(await harness({share:()=>Promise.reject({name:'AbortError'})}).share(result,null),'cancelled');
});
test('score image draws verified rank and player, or personal best only',async()=>{
 const texts=[];const ctx=new Proxy({fillText:text=>texts.push(text)},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
 const window={RescueServices:S};
 vm.runInNewContext(fs.readFileSync(require.resolve('../rescue-share.js'),'utf8'),{window,document:{createElement:()=>({getContext:()=>ctx,toBlob:fn=>fn('png')})},Image:class{async decode(){}},URL:{createObjectURL:()=> 'blob:card'}});
 await window.RescueShare.makeCard({...result,rank:7,playerLabel:'ABC 🐑'},()=>'<svg></svg>');
 assert.ok(texts.includes('TOP 20 HIGH SCORE · #7'));assert.ok(texts.includes('ABC 🐑'));assert.ok(texts.includes('TOTAL POINTS'));
 texts.length=0;await window.RescueShare.makeCard({...result,personalBest:true},()=>'<svg></svg>');assert.ok(texts.includes('NEW PERSONAL BEST'));assert.ok(!texts.some(t=>String(t).includes('TOP 20')));
});


test('daily sharing carries a dated daily image and keeps the root link',async()=>{
 let sent;const h=harness({canShare:()=>true,share:data=>{sent=data;return Promise.resolve();}});
 await h.share({...result,challengeDate:'2026-09-14'},{blob:'daily-image'});
 assert.equal(sent.files[0].name,'hungry-wolf-daily-2026-09-14.png');
 assert.equal(sent.title,'Hungry Wolf · Daily Challenge');assert.equal(sent.url,S.GAME_URL);assert.match(sent.text,/Daily challenge · 2026-09-14/);
});
test('daily card has gold challenge framing, date and verified daily rank',async()=>{
 const texts=[],fills=[];let strokes=0;
 const ctx=new Proxy({fillText:text=>texts.push(text),fill(){fills.push(this.fillStyle);},stroke(){strokes++;}},{get:(obj,key)=>key in obj?obj[key]:()=>{}});
 const window={RescueServices:S};
 vm.runInNewContext(fs.readFileSync(require.resolve('../rescue-share.js'),'utf8'),{window,document:{createElement:()=>({getContext:()=>ctx,toBlob:fn=>fn('png')})},Image:class{async decode(){}},URL:{createObjectURL:()=> 'blob:card'}});
 await window.RescueShare.makeCard({...result,challengeDate:'2026-09-14',rank:1,rankBoard:'daily',playerLabel:'FAM 🐑'},()=>'<svg></svg>');
 assert.ok(texts.includes('DAILY CHALLENGE'));assert.ok(texts.includes('MONDAY, SEP 14, 2026'));
 assert.ok(texts.includes('DAILY HIGH SCORE · #1'));assert.ok(texts.includes('FAM 🐑'));
 assert.ok(texts.includes('ONE DAILY CHALLENGE. ONE CHANCE.'));assert.ok(fills.includes('#ecd597'));assert.equal(strokes,1);
 texts.length=0;fills.length=0;strokes=0;
 await window.RescueShare.makeCard(result,()=>'<svg></svg>');
 assert.ok(texts.includes('BRING THEM HOME'));assert.ok(!texts.includes('DAILY CHALLENGE'));assert.ok(!fills.includes('#ecd597'));assert.equal(strokes,0);
});
