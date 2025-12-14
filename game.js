(() => {
  // ===== Config =====
  const COLS = 10;
  const ROWS = 16;
  const CLEAR_THRESHOLD = 10;

  const BASE_FALL_MS = 650;
  const MIN_FALL_MS  = 120;
  const LEVEL_EVERY_LOCKS = 12;

  // gesture step distances (no “hold-to-repeat”)
  const STEP_X = 22;
  const STEP_Y = 22;
  const SWIPE_UP_MIN = 26;

  // special spawn weights
  const WEIGHT_NORMAL = 0.88;
  const WEIGHT_BLACKSHEEP = 0.08;
  const WEIGHT_WOLVES = 0.04;

  // background overlay counts
  const INITIAL_EGGS = 10;
  const INITIAL_TURDS = 10;

  // ===== Tiles =====
  const TILE = {
    EMPTY: 0,
    SHEEP: 1,
    GOAT: 2,
    CHICKEN: 3,
    COW: 4,
    PIG: 5,
    WOLF: 6,
    BLACK_SHEEP: 7,
  };

  const POWER = { NONE:0, EGG:1, TURD:2 };
  const ANIMALS = [TILE.SHEEP, TILE.GOAT, TILE.CHICKEN, TILE.COW, TILE.PIG];

  const TILE_LABEL = {
    [TILE.SHEEP]: "🐑",
    [TILE.GOAT]: "🐐",
    [TILE.CHICKEN]: "🐔",
    [TILE.COW]: "🐄",
    [TILE.PIG]: "🐖",
    [TILE.WOLF]: "🐺",
    [TILE.BLACK_SHEEP]: "🐑‍⬛",
  };

  const TILE_COLOR = {
    [TILE.SHEEP]: "#cbd5e1",
    [TILE.GOAT]: "#d7b68c",
    [TILE.CHICKEN]: "#f3e6a4",
    [TILE.COW]: "#b9c7ff",
    [TILE.PIG]: "#ffc0cb",
    [TILE.WOLF]: "#7b8799",
    [TILE.BLACK_SHEEP]: "#12121a",
  };

  const GROUP_NAME = {
    [TILE.SHEEP]: "flock",
    [TILE.GOAT]: "herd",
    [TILE.CHICKEN]: "flock",
    [TILE.COW]: "herd",
    [TILE.PIG]: "sounder",
  };

  const SHAPES = {
    I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O: [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    T: [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    S: [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
    Z: [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    J: [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
    L: [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
  };
  const SHAPE_KEYS = Object.keys(SHAPES);

  const SPECIAL = {
    WOLVES_2: { matrix:[[1,1],[1,1]], tile:TILE.WOLF, rotates:false },
    BLACKSHEEP_2: { matrix:[[1,1],[1,1]], tile:TILE.BLACK_SHEEP, rotates:false }
  };

  // ===== DOM =====
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  const scoreEl  = document.getElementById("score");
  const levelEl  = document.getElementById("level");
  const clearsEl = document.getElementById("clears");
  const bestEl   = document.getElementById("best");

  const gear = document.getElementById("gear");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const closeModal = document.getElementById("closeModal");
  const soundToggle = document.getElementById("soundToggle");

  const toastEl = document.getElementById("toast");

  // ===== State =====
  let board = makeBoard();
  let overlay = makeOverlay();

  let current = null;
  let next = null;

  let score = 0;
  let level = 1;
  let locks = 0;
  let herdsCleared = 0;

  let fallTimer = 0;
  let fallInterval = BASE_FALL_MS;
  let paused = false;
  let gameOver = false;

  let W=0, H=0, cell=0, pad=10;

  // particles
  let particles = [];

  // banner
  let banner = { text:"", t:0, ttl: 900 };

  // touch tracking
  let touch = null;
  const IS_TOUCH = (("ontouchstart" in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));

  // ===== Audio =====
  let audioCtx = null;
  let soundOn = loadSoundPref();

  function loadSoundPref(){
    const v = localStorage.getItem("aw_sound");
    return v === null ? true : (v === "1");
  }
  function saveSoundPref(){
    localStorage.setItem("aw_sound", soundOn ? "1" : "0");
  }

  function ensureAudio(){
    if(audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { audioCtx = null; }
  }

  function unlockAudio(){
    ensureAudio();
    if(audioCtx && audioCtx.state === "suspended"){
      audioCtx.resume();
    }
  }

  function playTone({type="sine", f1=220, f2=110, dur=0.12, gain=0.12, noise=false}){
    if(!audioCtx || !soundOn) return;
    const t0 = audioCtx.currentTime;

    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    if(noise){
      const bufferSize = Math.floor(audioCtx.sampleRate * dur);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0;i<bufferSize;i++){
        data[i] = (Math.random()*2-1) * Math.pow(1 - i/bufferSize, 2);
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(g);
      g.connect(audioCtx.destination);
      src.start(t0);
      src.stop(t0 + dur);
      return;
    }

    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40,f2), t0 + dur);

    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  function playBarnyard(animal, size){
    if(!soundOn) return;
    const big = Math.min(0.18, 0.10 + size/200);
    if(animal === TILE.COW){
      playTone({type:"sawtooth", f1:150, f2:70, dur:0.16+big, gain:0.14});
      playTone({type:"sine", f1:95, f2:55, dur:0.18+big, gain:0.10});
    } else if(animal === TILE.PIG){
      playTone({type:"square", f1:190, f2:90, dur:0.12+big, gain:0.13});
      playTone({type:"square", f1:160, f2:80, dur:0.10+big, gain:0.10});
    } else if(animal === TILE.SHEEP){
      playTone({type:"triangle", f1:430, f2:280, dur:0.11+big, gain:0.12});
    } else if(animal === TILE.GOAT){
      playTone({type:"triangle", f1:320, f2:160, dur:0.14+big, gain:0.12});
      playTone({type:"sine", f1:260, f2:140, dur:0.10+big, gain:0.09});
    } else if(animal === TILE.CHICKEN){
      playTone({noise:true, dur:0.06+big, gain:0.10});
      playTone({type:"square", f1:700, f2:420, dur:0.07+big, gain:0.09});
    } else {
      playTone({type:"sine", f1:240, f2:120, dur:0.10+big, gain:0.10});
    }
  }

  function playAmbienceTick(){
    if(!audioCtx || !soundOn) return;
    if(Math.random() < 0.03){
      playTone({type:"sine", f1:110 + Math.random()*30, f2:80, dur:0.06, gain:0.03});
    }
  }

  // ===== Utilities =====
  function makeBoard(){ return Array.from({length: ROWS}, () => Array(COLS).fill(TILE.EMPTY)); }
  function makeOverlay(){ return Array.from({length: ROWS}, () => Array(COLS).fill(POWER.NONE)); }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function clone2(m){ return m.map(r => r.slice()); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function rotateCW(mat){
    const n = mat.length, m = mat[0].length;
    const out = Array.from({length: m}, () => Array(n).fill(0));
    for(let r=0;r<n;r++) for(let c=0;c<m;c++) out[c][n-1-r] = mat[r][c];
    return out;
  }
  function rotateCCW(mat){
    const n = mat.length, m = mat[0].length;
    const out = Array.from({length: m}, () => Array(n).fill(0));
    for(let r=0;r<n;r++) for(let c=0;c<m;c++) out[m-1-c][r] = mat[r][c];
    return out;
  }

  function showToast(msg, ms=900){
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.add("hidden"), ms);
  }

  function haptic(ms=10){
    try{ if("vibrate" in navigator) navigator.vibrate(ms); }catch{}
  }

  // ===== Pieces =====
  function weightedSpawnKind(){
    const r = Math.random();
    if(r < WEIGHT_WOLVES) return "WOLVES";
    if(r < WEIGHT_WOLVES + WEIGHT_BLACKSHEEP) return "BLACKSHEEP";
    return "NORMAL";
  }

  function newPiece(){
    const kind = weightedSpawnKind();

    if(kind === "WOLVES"){
      return { kind, x: Math.floor(COLS/2)-1, y: 0, matrix: clone2(SPECIAL.WOLVES_2.matrix), tile: TILE.WOLF, rotates:false };
    }
    if(kind === "BLACKSHEEP"){
      return { kind, x: Math.floor(COLS/2)-1, y: 0, matrix: clone2(SPECIAL.BLACKSHEEP_2.matrix), tile: TILE.BLACK_SHEEP, rotates:false };
    }

    const shapeKey = randChoice(SHAPE_KEYS);
    const animal = randChoice(ANIMALS);
    const base = SHAPES[shapeKey];
    const m = base.map(row => row.map(v => v ? animal : 0));
    return { kind, shapeKey, x: Math.floor(COLS/2)-2, y: 0, matrix: m, rotates:true };
  }

  function collides(piece, dx=0, dy=0, testMatrix=null){
    const m = testMatrix ?? piece.matrix;
    for(let r=0;r<m.length;r++){
      for(let c=0;c<m[r].length;c++){
        const v = m[r][c];
        if(!v) continue;
        const x = piece.x + c + dx;
        const y = piece.y + r + dy;
        if(x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
        if(board[y][x] !== TILE.EMPTY) return true;
      }
    }
    return false;
  }

  function spawnNext(){
    current = next ?? newPiece();
    next = newPiece();
    if(collides(current,0,0)) gameOverNow();
  }

  function updateLevel(){
    level = 1 + Math.floor(locks / LEVEL_EVERY_LOCKS);
    fallInterval = Math.max(MIN_FALL_MS, Math.floor(BASE_FALL_MS * Math.pow(0.88, level-1)));
    updateHUD();
  }

  function updateHUD(){
    scoreEl.textContent = Math.max(0, score|0);
    levelEl.textContent = level;
    clearsEl.textContent = herdsCleared;

    const best = computeBestGroup();
    if(!best) bestEl.textContent = "Best: —";
    else bestEl.textContent = `Best: ${best.count} ${TILE_LABEL[best.animal]} (${GROUP_NAME[best.animal]})`;
  }

  function gameOverNow(){
    gameOver = true;
    paused = true;
    draw();
    setTimeout(() => {
      alert("Game Over!\n\nTap OK to restart.");
      restart();
    }, 20);
  }

  // ===== Overlay (does NOT block falling) =====
  function sprinkleOverlay(){
    overlay = makeOverlay();
    const startRow = Math.max(ROWS-7, 0);
    placeOverlay(POWER.EGG, INITIAL_EGGS, startRow);
    placeOverlay(POWER.TURD, INITIAL_TURDS, startRow);
  }
  function placeOverlay(type, n, startRow){
    let tries = 0;
    while(n > 0 && tries < 8000){
      tries++;
      const x = Math.floor(Math.random()*COLS);
      const y = startRow + Math.floor(Math.random()*(ROWS-startRow));
      if(overlay[y][x] === POWER.NONE){
        overlay[y][x] = type;
        n--;
      }
    }
  }

  // ===== Wolves blast / Black sheep convert =====
  function footprintCells(piece){
    const cells = [];
    const m = piece.matrix;
    for(let r=0;r<m.length;r++){
      for(let c=0;c<m[r].length;c++){
        if(!m[r][c]) continue;
        const x = piece.x + c;
        const y = piece.y + r;
        if(x>=0 && x<COLS && y>=0 && y<ROWS) cells.push([x,y]);
      }
    }
    return cells;
  }

  function wolvesExplode(piece){
    const blast = new Set();
    const cells = footprintCells(piece);
    const around = [
      [0,0],[1,0],[-1,0],[0,1],[0,-1],
      [1,1],[1,-1],[-1,1],[-1,-1]
    ];
    for(const [x,y] of cells){
      for(const [dx,dy] of around){
        const nx=x+dx, ny=y+dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        blast.add(ny*COLS + nx);
      }
    }

    const popped = [];
    for(const key of blast){
      const x = key % COLS;
      const y = Math.floor(key / COLS);
      if(board[y][x] !== TILE.EMPTY){
        popped.push([x,y, board[y][x]]);
        board[y][x] = TILE.EMPTY;
      }
      overlay[y][x] = POWER.NONE;
    }

    if(popped.length){
      spawnPopParticles(popped);
      banner.text = `🐺 BOOM (${popped.length} tiles)`;
      banner.t = performance.now();
      if(soundOn){
        playTone({type:"sawtooth", f1:120, f2:45, dur:0.20, gain:0.18});
        playTone({type:"square", f1:80, f2:40, dur:0.16, gain:0.12});
      }
      haptic(18);
    }
  }

  function chooseConversionAnimalForBlackSheep(piece){
    const counts = new Map(ANIMALS.map(a => [a,0]));
    const cells = footprintCells(piece);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for(const [x,y] of cells){
      for(const [dx,dy] of dirs){
        const nx=x+dx, ny=y+dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        const t = board[ny][nx];
        if(ANIMALS.includes(t)) counts.set(t, counts.get(t)+1);
      }
    }
    let bestCount = -1;
    for(const a of ANIMALS) bestCount = Math.max(bestCount, counts.get(a));
    const tied = ANIMALS.filter(a => counts.get(a) === bestCount);
    return (bestCount <= 0) ? randChoice(ANIMALS) : randChoice(tied);
  }

  // ===== Scoring =====
  function fib(n){
    if(n <= 0) return 0;
    if(n === 1 || n === 2) return 1;
    let a=1,b=1;
    for(let i=3;i<=n;i++){ const c=a+b; a=b; b=c; }
    return b;
  }

  // ===== Cluster clearing (ONLY animals; no rows) =====
  function findAnimalGroupsToClear(){
    const seen = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    const out = [];

    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if(seen[y][x]) continue;
        const t = board[y][x];
        if(!ANIMALS.includes(t)){
          seen[y][x] = true;
          continue;
        }
        const cells = floodSameAnimal(x,y,t,seen);
        if(cells.length >= CLEAR_THRESHOLD){
          out.push({ animal: t, cells });
        }
      }
    }
    return out;
  }

  function floodSameAnimal(sx,sy,animal,seen){
    const q = [[sx,sy]];
    const cells = [];
    seen[sy][sx] = true;

    while(q.length){
      const [x,y] = q.pop();
      cells.push([x,y]);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        if(seen[ny][nx]) continue;
        if(board[ny][nx] === animal){
          seen[ny][nx] = true;
          q.push([nx,ny]);
        }
      }
    }
    return cells;
  }

  function applyGravity(){
    for(let x=0;x<COLS;x++){
      let write = ROWS-1;
      for(let y=ROWS-1;y>=0;y--){
        const t = board[y][x];
        if(t !== TILE.EMPTY){
          if(write !== y){
            board[write][x] = t;
            board[y][x] = TILE.EMPTY;
          }
          write--;
        }
      }
    }
    // overlay does NOT fall
  }

  function resolveBoard(){
    while(true){
      const clears = findAnimalGroupsToClear();
      if(clears.length === 0) break;

      for(const group of clears){
        const { animal, cells } = group;

        // base
        score += cells.length;

        // fib bonus for >10
        if(cells.length >= 11){
          const bonusIndex = cells.length - 8; // 11->3 => +2
          score += fib(bonusIndex);
        }

        // collect overlays
        let eggs=0, turds=0;
        for(const [x,y] of cells){
          if(overlay[y][x] === POWER.EGG) eggs++;
          if(overlay[y][x] === POWER.TURD) turds++;
        }
        if(eggs) score = Math.floor(score * Math.pow(2, eggs));
        if(turds) score = Math.floor(score / Math.pow(2, turds));

        // clear tiles + overlays under them
        for(const [x,y] of cells){
          board[y][x] = TILE.EMPTY;
          overlay[y][x] = POWER.NONE;
        }

        herdsCleared++;
        banner.text = `Cleared ${cells.length} ${TILE_LABEL[animal]} (${GROUP_NAME[animal]})${eggs?` 🥚x${eggs}`:""}${turds?` 💩x${turds}`:""}`;
        banner.t = performance.now();

        spawnPopParticles(cells.map(([x,y]) => [x,y,animal]));
        playBarnyard(animal, cells.length);
        haptic(12);
      }

      applyGravity();
    }

    updateHUD();
  }

  function computeBestGroup(){
    const seen = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    let best = null;

    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if(seen[y][x]) continue;
        const t = board[y][x];
        if(!ANIMALS.includes(t)){
          seen[y][x] = true;
          continue;
        }
        const cells = floodSameAnimal(x,y,t,seen);
        if(!best || cells.length > best.count){
          best = { animal: t, count: cells.length };
        }
      }
    }
    return best;
  }

  // ===== Locking =====
  function lockPiece(){
    if(current.kind === "WOLVES"){
      wolvesExplode(current);
      locks++;
      updateLevel();
      resolveBoard();
      spawnNext();
      return;
    }

    // place
    for(let r=0;r<current.matrix.length;r++){
      for(let c=0;c<current.matrix[r].length;c++){
        const v = current.matrix[r][c];
        if(!v) continue;
        const x = current.x + c;
        const y = current.y + r;
        if(y < 0){ gameOverNow(); return; }
        board[y][x] = v;
      }
    }

    // black sheep convert
    if(current.kind === "BLACKSHEEP"){
      const chosen = chooseConversionAnimalForBlackSheep(current);
      for(const [x,y] of footprintCells(current)){
        board[y][x] = chosen;
      }
    }

    locks++;
    updateLevel();
    resolveBoard();
    spawnNext();
    haptic(10);
  }

  // ===== Movement =====
  function move(dx){
    if(paused) return;
    if(!collides(current, dx, 0)){
      current.x += dx;
    } else {
      haptic(6);
    }
    draw();
  }

  function dropOne(){
    if(paused) return;
    if(!collides(current, 0, 1)){
      current.y += 1;
    } else {
      lockPiece();
    }
    draw();
  }

  function rotate(dirCW=true){
    if(paused) return;
    if(!current.rotates) return;
    const test = dirCW ? rotateCW(current.matrix) : rotateCCW(current.matrix);
    for(const k of [0,-1,1,-2,2]){
      if(!collides(current, k, 0, test)){
        current.matrix = test;
        current.x += k;
        haptic(6);
        break;
      }
    }
    draw();
  }

  function getGhostY(piece){
    let y = piece.y;
    while(!collides(piece, 0, (y - piece.y) + 1)) y++;
    return y;
  }

  // ===== Particles =====
  function spawnPopParticles(popped){
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const px = pad*dpr;
    for(const [x,y,t] of popped){
      const cx = px + x*cell + cell/2;
      const cy = px + y*cell + cell/2;
      const n = 6 + Math.floor(Math.random()*6);
      for(let i=0;i<n;i++){
        particles.push({
          x: cx, y: cy,
          vx: (Math.random()*2-1) * (0.9 + Math.random()*1.3),
          vy: (Math.random()*2-1) * (0.9 + Math.random()*1.3) - 1.2,
          life: 24 + Math.floor(Math.random()*16),
          color: TILE_COLOR[t] || "#ddd"
        });
      }
    }
  }

  function stepParticles(){
    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.10;
      p.life -= 1;
    }
    particles = particles.filter(p => p.life > 0);
  }

  // ===== Drawing =====
  function resize(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const targetW = Math.floor(rect.width * dpr);

    cell = Math.floor((targetW - pad*2*dpr) / COLS);
    W = cell * COLS + pad*2*dpr;
    H = cell * ROWS + pad*2*dpr;
    canvas.width = W;
    canvas.height = H;
    draw();
  }

  function roundRectFill(x,y,w,h,r,color){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }
  function roundRectStroke(x,y,w,h,r){
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    ctx.closePath();
    ctx.stroke();
  }

  function drawOverlay(px){
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const p = overlay[y][x];
        if(p === POWER.NONE) continue;
        const gx = px + x*cell;
        const gy = px + y*cell;
        ctx.save();
        ctx.translate(gx + cell/2, gy + cell/2);
        ctx.rotate((x+y)%2 ? -0.12 : 0.10);
        ctx.globalAlpha = 0.45;
        ctx.font = `${Math.floor(cell*0.62)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(p === POWER.EGG ? "🥚" : "💩", 0, 1);
        ctx.restore();
      }
    }
  }

  function drawTile(x,y,t,px,withEmoji){
    const gx = px + x*cell;
    const gy = px + y*cell;

    ctx.globalAlpha = 0.96;
    roundRectFill(gx+1, gy+1, cell-2, cell-2, 10, TILE_COLOR[t] || "#ddd");
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1, Math.floor(cell*0.06));
    roundRectStroke(gx+2, gy+2, cell-4, cell-4, 9);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.16;
    roundRectFill(gx+3, gy+3, cell-6, Math.floor((cell-6)*0.38), 8, "#ffffff");
    ctx.restore();

    if(withEmoji){
      ctx.font = `${Math.floor(cell*0.68)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#000";
      ctx.fillText(TILE_LABEL[t] || "?", gx + cell/2 + 1, gy + cell/2 + 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.fillText(TILE_LABEL[t] || "?", gx + cell/2, gy + cell/2 + 1);
    }
  }

  function drawPiece(piece, dx, dy, px){
    const m = piece.matrix;
    for(let r=0;r<m.length;r++){
      for(let c=0;c<m[r].length;c++){
        const v = m[r][c];
        if(!v) continue;
        const x = piece.x + c + dx;
        const y = piece.y + r + dy;
        if(y < 0) continue;
        drawTile(x,y,v,px,true);
      }
    }
  }

  function drawShadow(piece, dx, dy, px){
    const m = piece.matrix;
    ctx.save();
    for(let r=0;r<m.length;r++){
      for(let c=0;c<m[r].length;c++){
        const v = m[r][c];
        if(!v) continue;
        const x = piece.x + c + dx;
        const y = piece.y + r + dy;
        if(y < 0) continue;
        const gx = px + x*cell;
        const gy = px + y*cell;

        ctx.globalAlpha = 0.12;
        roundRectFill(gx+3, gy+3, cell-6, cell-6, 10, "#000");
        ctx.globalAlpha = 0.26;
        ctx.strokeStyle = "rgba(255,255,255,0.65)";
        ctx.lineWidth = Math.max(1, Math.floor(cell*0.055));
        roundRectStroke(gx+3, gy+3, cell-6, cell-6, 10);
      }
    }
    ctx.restore();
  }

  function drawParticles(){
    if(!particles.length) return;
    ctx.save();
    for(const p of particles){
      ctx.globalAlpha = clamp(p.life/40, 0, 0.9);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1.5, cell*0.08), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(){
    ctx.clearRect(0,0,W,H);

    // dark frame
    roundRectFill(0,0,W,H,18, "#050507");

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const px = pad*dpr;

    // faint grid
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const gx = px + x*cell;
        const gy = px + y*cell;
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(gx+2, gy+2, cell-4, cell-4);
        ctx.globalAlpha = 1;
      }
    }

    // overlay behind
    drawOverlay(px);

    // tiles
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const t = board[y][x];
        if(t !== TILE.EMPTY) drawTile(x,y,t,px,true);
      }
    }

    // ghost
    if(current && !paused){
      const gy = getGhostY(current);
      drawShadow(current, 0, gy-current.y, px);
    }

    // current
    if(current) drawPiece(current,0,0,px);

    // particles
    stepParticles();
    drawParticles();

    // banner
    if(banner.text){
      const age = performance.now() - banner.t;
      if(age < banner.ttl){
        const a = Math.max(0, 1 - age / banner.ttl);
        ctx.save();
        ctx.globalAlpha = 0.70 * a;
        ctx.fillStyle = "#000";
        ctx.fillRect(0,0,W, Math.floor(cell*1.2));
        ctx.globalAlpha = 1 * a;
        ctx.fillStyle = "#fff";
        ctx.font = `${Math.floor(cell*0.55)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(banner.text, W/2, Math.floor(cell*0.6));
        ctx.restore();
      } else banner.text = "";
    }
  }

  // ===== Touch controls (step-based, no hold repeat) =====
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    unlockAudio(); // key for iOS
    if(audioCtx && soundOn) showToast("Sound unlocked", 550);

    touch = {
      x0: e.clientX, y0: e.clientY,
      x: e.clientX, y: e.clientY,
      movedX: 0, movedY: 0,
      t0: performance.now(),
      didRotate: false
    };
  });

  canvas.addEventListener("pointermove", (e) => {
    if(!IS_TOUCH || !touch) return;

    const nx = e.clientX, ny = e.clientY;
    const dx = nx - touch.x;
    const dy = ny - touch.y;
    touch.x = nx; touch.y = ny;

    touch.movedX += dx;
    touch.movedY += dy;

    while(touch.movedX <= -STEP_X){ move(-1); touch.movedX += STEP_X; }
    while(touch.movedX >=  STEP_X){ move( 1); touch.movedX -= STEP_X; }

    while(touch.movedY >= STEP_Y){ dropOne(); touch.movedY -= STEP_Y; }

    const totalUp = touch.y0 - ny;
    if(!touch.didRotate && totalUp >= SWIPE_UP_MIN){
      const totalDx = nx - touch.x0;
      rotate(totalDx < 0 ? false : true);
      touch.didRotate = true;
      touch.x0 = nx; touch.y0 = ny;
    }
  });

  canvas.addEventListener("pointerup", (e) => {
    e.preventDefault();
    if(!touch) return;

    const dt = performance.now() - touch.t0;
    const dist = Math.hypot((e.clientX - touch.x0),(e.clientY - touch.y0));
    if(dt < 220 && dist < 10){
      rotate(true);
    }
    touch = null;
  });
  canvas.addEventListener("pointercancel", () => { touch = null; });

  // ===== Settings UI =====
  function openModal(){ modalBackdrop.classList.remove("hidden"); }
  function closeModalFn(){ modalBackdrop.classList.add("hidden"); }
  gear.addEventListener("pointerdown", (e) => { e.preventDefault(); openModal(); });
  closeModal.addEventListener("pointerdown", (e) => { e.preventDefault(); closeModalFn(); });
  modalBackdrop.addEventListener("pointerdown", (e) => { if(e.target === modalBackdrop) closeModalFn(); });

  function syncSoundBtn(){
    soundToggle.textContent = soundOn ? "ON" : "OFF";
  }
  soundToggle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    soundOn = !soundOn;
    saveSoundPref();
    syncSoundBtn();
    unlockAudio();
    playTone({type:"sine", f1: soundOn ? 520 : 180, f2: soundOn ? 380 : 120, dur:0.06, gain:0.06});
  });

  // ===== Game loop =====
  function tick(){
    requestAnimationFrame(tick);
    if(paused || gameOver) return;

    fallTimer += 16;
    if(fallTimer >= fallInterval){
      fallTimer = 0;
      if(!collides(current,0,1)) current.y += 1;
      else lockPiece();
      draw();
      playAmbienceTick();
    } else if(particles.length || banner.text){
      draw();
    }
  }

  // ===== Restart =====
  function restart(){
    board = makeBoard();
    sprinkleOverlay();
    score=0; level=1; locks=0; herdsCleared=0;
    fallInterval = BASE_FALL_MS;
    paused=false; gameOver=false;
    current=null; next=null;
    particles=[]; banner={text:"",t:0,ttl:900};
    next = newPiece();
    spawnNext();
    updateHUD();
    draw();
  }

  function sprinkleOverlay(){
    overlay = makeOverlay();
    const startRow = Math.max(ROWS-7, 0);
    placeOverlay(POWER.EGG, INITIAL_EGGS, startRow);
    placeOverlay(POWER.TURD, INITIAL_TURDS, startRow);
  }

  // ===== Init =====
  function resizeObserver(){
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);
    window.addEventListener("resize", resize, {passive:true});
  }

  function init(){
    syncSoundBtn();
    resizeObserver();
    sprinkleOverlay();
    next = newPiece();
    spawnNext();
    updateHUD();
    resize();
    requestAnimationFrame(tick);
  }

  init();
})();
