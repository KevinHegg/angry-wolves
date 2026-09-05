(() => {
  'use strict';
  const S = window.RescueServices;
  async function makeCard(result, icon) {
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 630;
    const ctx = canvas.getContext('2d');
    const token = new Image();
    const svg = icon(result.biggest.type).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    token.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await token.decode();
    ctx.fillStyle = '#192e2c'; ctx.fillRect(0,0,1200,630);
    ctx.fillStyle = '#f8f0dc'; ctx.beginPath(); ctx.roundRect(26,26,1148,578,24); ctx.fill();
    ctx.fillStyle = '#315d45'; ctx.font = 'bold 24px system-ui'; ctx.fillText('ANGRY WOLVES',66,84);
    if (result.rank || result.personalBest) {
      ctx.textAlign = 'right'; ctx.fillStyle = '#315d45'; ctx.font = 'bold 23px system-ui';
      ctx.fillText(result.rank ? `TOP 20 HIGH SCORE · #${result.rank}` : 'NEW PERSONAL BEST',1117,84);
      if (result.rank) { ctx.font = '20px system-ui'; ctx.fillText(result.playerLabel,1117,115); }
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#75765f'; ctx.font = '17px system-ui'; ctx.fillText('BRING THEM HOME',66,113);
    ctx.fillStyle = '#263a33'; ctx.font = '58px Georgia'; ctx.fillText('Home safe. Wolves hungry.',66,195);
    ctx.font = 'bold 96px system-ui'; ctx.fillText(result.score.toLocaleString('en-US'),66,321);
    ctx.font = '23px system-ui'; ctx.fillStyle = '#63705d'; ctx.fillText('HERDING POINTS',70,359);
    ctx.fillStyle = '#e3e8cc'; ctx.beginPath(); ctx.roundRect(705,224,412,268,20); ctx.fill();
    ctx.drawImage(token,728,248,174,174);
    ctx.fillStyle = '#315d45'; ctx.font = 'bold 65px system-ui'; ctx.fillText(String(result.biggest.count),920,326);
    ctx.font = '19px system-ui'; ctx.fillText('BIGGEST HERD',922,365);
    ctx.font = '24px Georgia'; ctx.fillText(['A woolly stampede!','A proper pig parade!','The great hen escape!','A magnificent moo-ve!'][result.biggest.type],735,465);
    ctx.fillStyle = '#263a33'; ctx.font = '24px system-ui'; ctx.fillText(`${result.saved} animals home · all three gates shut`,70,418);
    ctx.font = '21px system-ui'; ctx.fillStyle = '#63705d'; ctx.fillText(`Pip rested ${result.rested}/3 fields · +${result.bonus} bonus`,70,461);
    ctx.fillStyle = '#d7caa9'; ctx.fillRect(66,521,1051,1);
    ctx.font = 'bold 20px system-ui'; ctx.fillStyle = '#315d45'; ctx.fillText('CAN YOU BEAT MY HERD?',66,564);
    ctx.font = '20px system-ui'; ctx.textAlign = 'right'; ctx.fillText('kevinhegg.github.io/angry-wolves',1117,564);
    const blob = await new Promise((resolve,reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not make the card.')), 'image/png'));
    return {blob, url:URL.createObjectURL(blob)};
  }
  // Card generation happens before the click so Safari retains user activation for share().
  async function share(result, card) {
    const text = S.caption(result);
    if (!navigator.share) return 'fallback';
    const file = card ? new File([card.blob], 'angry-wolves-score.png', {type:'image/png'}) : null;
    const data = file && navigator.canShare?.({files:[file]})
      ? {title:'Angry Wolves · Home safe!', text, files:[file]}
      : {title:'Angry Wolves · Home safe!', text, url:S.GAME_URL};
    try { await navigator.share(data); return 'shared'; }
    catch (error) { if (error.name === 'AbortError') return 'cancelled'; throw error; }
  }
  window.RescueShare = {makeCard,share};
})();
