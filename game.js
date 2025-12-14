(() => {
  // =========================
  // Angry Wolves — game.js (tap=move only, swipe-up=rotate only)
  // =========================

  // ===== Config =====
  const COLS = 10;
  const ROWS = 13;                 // fewer rows => bigger tiles
  const CLEAR_THRESHOLD = 10;

  const BASE_FALL_MS = 650;
  const MIN_FALL_MS  = 120;
  const LEVEL_EVERY_LOCKS = 12;

  // gesture step distances (movement happens only while finger moves)
  const STEP_X = 22;
  const STEP_Y = 22;
  const SWIPE_UP_MIN = 28;

  // special spawn weights
  const WEIGHT_NORMAL = 0.88;
  const WEIGHT_BLACKSHEEP = 0.08;
  const WEIGHT_WOLVES = 0.04;

  // background overlay counts (does NOT block falling)
  const EGGS_COUNT  = 9;   // more eggs than poop
  const TURDS_COUNT = 4;   // sparse

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

  // ===== Shapes =====
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
    WOLVES_2:     { matrix:[[1,1],[1,1]], tile:TILE.WOLF,       rotates:false },
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
  const soundToggle = document.getElementById("soundToggle");

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

  // render metrics
  let W=0, H=0, cell=0;
  let pad = 14;

  // particles
  let particles = [];

  // banner
  let banner = { text:"", t:0, ttl: 900 };

  // touch tracking
  const IS_TOUCH = (("ontouchstart" in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
  let gesture = null;

  // ===== Audio (iOS-safe) =====
  let audioCtx = null;
  let masterGain = null;
  let soundOn = loadSoundPref();
  let audioUnlocked = false;
  let ambienceClock = 0;

  function loadSoundPref(){
    const v = localStorage.getItem("aw_sound");
    return v === null ? true : (v === "1");
  }
  function saveSoundPref(){
    localStorage.setItem("aw_sound", soundOn ? "1" : "0");
  }

  function ensureAudio(){
    if(audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.95; // louder than before (still safe)
      masterGain.connect(audioCtx.destination);
    } catch {
      audioCtx = null;
      masterGain = null;
    }
  }

  // call only from a user gesture
  function unlockAudioSilently(){
    if(!soundOn) return;
    ensureAudio();
    if(!audioCtx) return;
    if(audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    audioUnlocked = true;
  }

  function playTone({type="sine", f1=220, f2=110, dur=0.12, gain=0.14, noise=false}){
    if(!soundOn) return;
    if(!audioUnlocked) return; // only after a touch gesture
    if(!audioCtx || !masterGain) return;

    // If iOS re-suspends, try to resume without UI spam.
    if(audioCtx.state === "suspended") {
      audioCtx.resume();
      // Don't early-return: sometimes it resumes fast enough.
    }

    const t0 = audioCtx.currentTime;

    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    g.connect(masterGain);

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
      src.start(t0);
      src.stop(t0 + dur);
      return;
    }

    const osc = audioCtx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40,f2), t0 + dur);
    osc.connect(g);
    osc.start(t0);
    osc.stop(t0 + dur);
  }

  function playBarnyard(animal, size){
    const big = Math.min(0.20, 0.10 + size/180);
    if(animal === TILE.COW){
      playTone({type:"sawtooth", f1:150, f2:70, dur:0.16+big, gain:0.16});
      playTone({type:"sine", f1:95, f2:55, dur:0.18+big, gain:0.12});
    } else if(animal === TILE.PIG){
      playTone({type:"square", f1:210, f2:95, dur:0.12+big, gain:0.15});
      playTone({type:"square", f1:170, f2:85, dur:0.10+big, gain:0.12});
    } else if(animal === TILE.SHEEP){
      playTone({type:"triangle", f1:450, f2:300, dur:0.11+big, gain:0.13});
    } else if(animal === TILE.GOAT){
      playTone({type:"triangle", f1:340, f2:170, dur:0.14+big, gain:0.13});
      playTone({type:"sine", f1:280, f2:150, dur:0.10+big, gain:0.10});
    } else if(animal === TILE.CHICKEN){
      playTone({noise:true, dur:0.06+big, gain:0.11});
      playTone({type:"square", f1:720, f2:460, dur:0.07+big, gain:0.10});
    } else {
      playTone({type:"sine", f1:240, f2:120, dur:0.10+big, gain:0.10});
    }
  }

  function playAmbienceTick(){
    if(!soundOn || !audioUnlocked) return;
    if(Math.random() < 0.03){
      playTone({type:"sine", f1:110 + Math.random()*30, f2:80, dur:0.06, gain:0.04});
    }
  }

  // ===== Haptics =====
  function haptic(ms=10){
    try{ if("vibrate" in navigator) navigator.vibrate(ms); }catch{}
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
    if(scoreEl) scoreEl.textContent = Math.max(0, score|0);
    if(levelEl) levelEl.textContent = level;
    if(clearsEl) clearsEl.textContent = herdsCleared;

    const best = computeBestGroup();
    if(bestEl){
      bestEl.textContent = !best ? "Best: —" : `Best: ${best.count} ${TILE_LABEL[best.animal]} (${GROUP_NAME[best.animal]})`;
    }
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

  // ===== Overlay pattern: geometric lattice with random phase =====
  function sprinkleOverlayGeometric(){
    overlay = makeOverlay();

    // only paint the lower ~55% of the board (background flavor)
    const startRow = Math.floor(ROWS * 0.45);

    // random phase shift so each run differs but stays geometric
    const eggPhase  = Math.floor(Math.random()*6);   // modulus 6
    const turdPhase = Math.floor(Math.random()*11);  // modulus 11
    const xShift = Math.floor(Math.random()*3);      // small shift

    const eggCandidates = [];
    const turdCandidates = [];

    for(let y=startRow; y<ROWS; y++){
      for(let x=0; x<COLS; x++){
        const xx = (x + xShift) % COLS;

        // egg lattice: gentle diagonal/chevron feel (regular, not dense)
        // (xx + 2y) mod 6 hits ~1/6 of cells
        if(((xx + 2*y + eggPhase) % 6) === 1){
          eggCandidates.push([x,y]);
        }

        // turd lattice: rarer, different rhythm
        // (xx + y) mod 11 hits ~1/11 of cells
        if(((xx + y + turdPhase) % 11) === 4){
          turdCandidates.push([x,y]);
        }
      }
    }

    // prefer spacing: don’t place adjacent overlays
    const used = new Set();
    const blockAround = (x,y) => {
      for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        used.add(ny*COLS+nx);
      }
    };

    // Shuffle candidates but keep geometry (we shuffle within the candidate list)
    shuffleInPlace(eggCandidates);
    shuffleInPlace(turdCandidates);

    let eggsLeft = EGGS_COUNT;
    for(const [x,y] of eggCandidates){
      if(eggsLeft <= 0) break;
      const key = y*COLS+x;
      if(used.has(key)) continue;
      overlay[y][x] = POWER.EGG;
      blockAround(x,y);
      eggsLeft--;
    }

    let turdsLeft = TURDS_COUNT;
    for(const [x,y] of turdCandidates){
      if(turdsLeft <= 0) break;
      const key = y*COLS+x;
      if(used.has(key)) continue;
      overlay[y][x] = POWER.TURD;
      blockAround(x,y);
      turdsLeft--;
    }
  }

  function shuffleInPlace(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
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
    const around = [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
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
      playTone({type:"sawtooth", f1:120, f2:45, dur:0.20, gain:0.18});
      playTone({type:"square", f1:80, f2:40, dur:0.16, gain:0.14});
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

  // ===== Cluster clearing =====
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

        // base: 1 coin per tile cleared
        score += cells.length;

        // Fibonacci bonus for 11+ (bonus starts at 11)
        if(cells.length >= 11){
          const bonusIndex = cells.length - 8; // 11->3 => fib(3)=2
          score += fib(bonusIndex);
        }

        // egg/turd modifiers: doubles / halves (per overlay hit)
        let eggs=0, turds=0;
        for(const [x,y] of cells){
          if(overlay[y][x] === POWER.EGG) eggs++;
          if(overlay[y][x] === POWER.TURD) turds++;
        }
        if(eggs)  score = Math.floor(score * Math.pow(2, eggs));
        if(turds) score = Math.floor(score / Math.pow(2, turds));

        // clear tiles + clear overlay marks
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

  // ===== Viewport CSS + iPhone fit =====
  function injectViewportCSS(){
    const css = `
      html, body { height: 100%; margin:0; padding:0; overscroll-behavior:none; }
      body { padding-top: calc(env(safe-area-inset-top, 0px) + 8px);
             padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px); }
      canvas { display:block; touch-action:none; }
      .aw-backdrop { position:fixed; inset:0; display:none; align-items:center; justify-content:center;
                     background: rgba(0,0,0,0.62); z-index:9999;
                     padding-top: env(safe-area-inset-top, 0px);
                     padding-bottom: env(safe-area-inset-bottom, 0px); }
      .aw-modal { width:min(92vw, 520px); background:#0b0b10; color:#fff; border-radius:14px;
                  border:1px solid rgba(255,255,255,0.12); padding:14px 14px 10px; }
      .aw-modal h2 { margin: 4px 0 10px; font-size: 18px; }
      .aw-modal button { font-size:16px; padding:10px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.18);
                         background:#141421; color:#fff; }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function fitCanvasToViewport(){
    const vv = window.visualViewport;
    const vh = vv ? vv.height : window.innerHeight;
    const r = canvas.getBoundingClientRect();
    const top = r.top;
    const safeBottom = 10;
    const targetH = Math.max(240, Math.floor(vh - top - safeBottom));
    canvas.style.width = "100%";
    canvas.style.height = `${targetH}px`;
    resize();
  }

  function resize(){
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const targetW = Math.floor(rect.width * dpr);
    const targetH = Math.floor(rect.height * dpr);

    const padPx = pad*2*dpr;
    const cellByW = Math.floor((targetW - padPx) / COLS);
    const cellByH = Math.floor((targetH - padPx) / ROWS);
    cell = Math.max(6, Math.min(cellByW, cellByH));

    W = cell * COLS + padPx;
    H = cell * ROWS + padPx;

    canvas.width = W;
    canvas.height = H;
    draw();
  }

  // ===== Drawing helpers =====
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
    // subtle, embedded look
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.filter = "grayscale(0.60) saturate(0.65) contrast(0.92)";

    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const p = overlay[y][x];
        if(p === POWER.NONE) continue;

        const gx = px + x*cell;
        const gy = px + y*cell;

        ctx.save();
        ctx.translate(gx + cell/2, gy + cell/2);
        ctx.rotate((x+y)%2 ? -0.10 : 0.08);
        ctx.font = `${Math.floor(cell*0.50)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fff";
        ctx.fillText(p === POWER.EGG ? "🥚" : "💩", 0, 1);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function drawTile(x,y,t,px,withEmoji){
    const gx = px + x*cell;
    const gy = px + y*cell;

    ctx.globalAlpha = 0.96;
    roundRectFill(gx+1, gy+1, cell-2, cell-2, 10, TILE_COLOR[t] || "#ddd");
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(1, Math.floor(cell*0.06));
    roundRectStroke(gx+2, gy+2, cell-4, cell-4, 9);
    ctx.restore();

    if(withEmoji){
      ctx.font = `${Math.floor(cell*0.66)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.20;
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
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
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
    roundRectFill(0,0,W,H,18, "#050507");

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const px = pad*dpr;

    // faint grid
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const gx = px + x*cell;
        const gy = px + y*cell;
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(gx+2, gy+2, cell-4, cell-4);
        ctx.globalAlpha = 1;
      }
    }

    drawOverlay(px);

    // placed tiles
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const t = board[y][x];
        if(t !== TILE.EMPTY) drawTile(x,y,t,px,true);
      }
    }

    // ghost shadow
    if(current && !paused){
      const gy = getGhostY(current);
      drawShadow(current, 0, gy-current.y, px);
    }

    if(current) drawPiece(current,0,0,px);

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

  // ===== Touch controls (tap=move only; swipe-up=rotate only) =====
  function onPointerDown(e){
    e.preventDefault();

    // Unlock audio silently (no popups)
    unlockAudioSilently();
    suppressAnySoundUnlockedToasts();

    gesture = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      movedX: 0,
      movedY: 0,
      t0: performance.now(),
      rotated: false,
    };
  }

  function onPointerMove(e){
    if(!IS_TOUCH || !gesture) return;

    const nx = e.clientX, ny = e.clientY;
    const dx = nx - gesture.lastX;
    const dy = ny - gesture.lastY;

    gesture.lastX = nx; gesture.lastY = ny;
    gesture.movedX += dx;
    gesture.movedY += dy;

    // horizontal drift => step moves
    while(gesture.movedX <= -STEP_X){ move(-1); gesture.movedX += STEP_X; }
    while(gesture.movedX >=  STEP_X){ move( 1); gesture.movedX -= STEP_X; }

    // downward drift => step drops
    while(gesture.movedY >= STEP_Y){ dropOne(); gesture.movedY -= STEP_Y; }

    // swipe-up => rotate (once per gesture)
    const upDist = gesture.startY - ny;
    if(!gesture.rotated && upDist >= SWIPE_UP_MIN){
      const totalDx = nx - gesture.startX;
      // up-left => CCW, up-right or straight => CW
      rotate(totalDx < 0 ? false : true);
      gesture.rotated = true;
    }
  }

  function onPointerUp(e){
    e.preventDefault();
    if(!gesture) return;

    // TAP: move 1 tile left/right based on screen half.
    // Tap should NEVER rotate.
    const dt = performance.now() - gesture.t0;
    const dist = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY);

    if(dt < 260 && dist < 10){
      const rect = canvas.getBoundingClientRect();
      const mid = rect.left + rect.width/2;
      move(e.clientX < mid ? -1 : 1);
    }

    gesture = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown, {passive:false});
  canvas.addEventListener("pointermove", onPointerMove, {passive:true});
  canvas.addEventListener("pointerup", onPointerUp, {passive:false});
  canvas.addEventListener("pointercancel", () => { gesture = null; });

  // ===== Keyboard controls (only when NOT touch) =====
  if(!IS_TOUCH){
    window.addEventListener("keydown", (e) => {
      if(gameOver) return;

      const k = e.key;
      const lk = k.toLowerCase();
      if(["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," "].includes(k)) e.preventDefault();

      if(lk === "p"){ paused = !paused; draw(); return; }
      if(lk === "r"){ restart(); return; }
      if(paused) return;

      if(k === "ArrowLeft" || lk === "a") move(-1);
      else if(k === "ArrowRight" || lk === "d") move(1);
      else if(k === "ArrowDown" || lk === "s") dropOne();
      else if(k === "ArrowUp" || lk === "x") rotate(true);
      else if(lk === "z") rotate(false);
      else if(k === " ") dropOne();
    }, { passive:false });
  }

  // ===== Settings modal (close always works) =====
  function buildSettingsModal(){
    if(!gear) return;

    const headings = Array.from(document.querySelectorAll("h1,h2,h3"));
    const h = headings.find(el => (el.textContent || "").trim().toLowerCase() === "settings");
    if(!h) return;

    const nodes = [];
    let n = h;
    while(n){
      nodes.push(n);
      const next = n.nextElementSibling;
      if(!next) break;
      if(next.matches("h1,h2,h3") && (next.textContent || "").trim().toLowerCase() !== "settings") break;
      n = next;
    }

    const backdrop = document.createElement("div");
    backdrop.className = "aw-backdrop";
    backdrop.setAttribute("aria-hidden", "true");

    const modal = document.createElement("div");
    modal.className = "aw-modal";
    backdrop.appendChild(modal);

    for(const el of nodes){
      modal.appendChild(el);
    }

    let doneBtn = modal.querySelector("#closeModal");
    if(!doneBtn){
      doneBtn = Array.from(modal.querySelectorAll("button")).find(b => (b.textContent||"").trim().toLowerCase() === "done") || null;
    }
    if(!doneBtn){
      doneBtn = document.createElement("button");
      doneBtn.textContent = "Done";
      modal.appendChild(doneBtn);
    }
    doneBtn.id = "closeModal";

    document.body.appendChild(backdrop);

    function open(){
      backdrop.style.display = "flex";
      backdrop.setAttribute("aria-hidden", "false");
      haptic(8);
    }
    function close(){
      backdrop.style.display = "none";
      backdrop.setAttribute("aria-hidden", "true");
      haptic(8);
    }

    gear.addEventListener("click", (e)=>{ e.preventDefault(); open(); }, {passive:false});
    gear.addEventListener("touchend", (e)=>{ e.preventDefault(); open(); }, {passive:false});

    doneBtn.addEventListener("click", (e)=>{ e.preventDefault(); close(); }, {passive:false});
    doneBtn.addEventListener("touchend", (e)=>{ e.preventDefault(); close(); }, {passive:false});

    backdrop.addEventListener("click", (e)=>{ if(e.target === backdrop) close(); }, {passive:true});
    backdrop.addEventListener("touchend", (e)=>{ if(e.target === backdrop) close(); }, {passive:true});

    close();
  }

  function syncSoundBtn(){
    if(!soundToggle) return;
    soundToggle.textContent = soundOn ? "ON" : "OFF";
  }

  if(soundToggle){
    const onTap = (e) => {
      e.preventDefault();
      soundOn = !soundOn;
      saveSoundPref();
      syncSoundBtn();
      // re-unlock if user turned it on
      if(soundOn) unlockAudioSilently();
    };
    soundToggle.addEventListener("click", onTap, {passive:false});
    soundToggle.addEventListener("touchend", onTap, {passive:false});
  }

  // ===== Suppress “Sound unlocked” toast if any exists =====
  function suppressAnySoundUnlockedToasts(){
    // If you have a custom toast element, hide it.
    const toasts = Array.from(document.querySelectorAll("*"))
      .filter(el => el && el.textContent && el.textContent.trim().toLowerCase() === "sound unlocked");
    for(const el of toasts){
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    }
  }

  // ===== Fix help text if your HTML still says tap rotates =====
  function patchHelpText(){
    const all = Array.from(document.querySelectorAll("body *"));
    for(const el of all){
      if(!el || !el.textContent) continue;
      if(el.textContent.includes("Tap = rotate")){
        el.textContent = "Touch: swipe ←/→ move · swipe ↓ drop · swipe ↑ rotate (up-left CCW / up-right CW). Tap left/right halves = nudge.";
        break;
      }
    }
  }

  // ===== Game loop =====
  function tick(){
    requestAnimationFrame(tick);
    if(paused || gameOver) return;

    fallTimer += 16;
    ambienceClock += 16;

    if(ambienceClock > 500){
      ambienceClock = 0;
      playAmbienceTick();
    }

    if(fallTimer >= fallInterval){
      fallTimer = 0;
      if(!collides(current,0,1)) current.y += 1;
      else lockPiece();
      draw();
    } else if(particles.length || banner.text){
      draw();
    }
  }

  // ===== Restart =====
  function restart(){
    board = makeBoard();
    sprinkleOverlayGeometric();
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

  // ===== Init =====
  function init(){
    injectViewportCSS();
    patchHelpText();

    sprinkleOverlayGeometric();

    next = newPiece();
    spawnNext();

    updateHUD();
    buildSettingsModal();
    syncSoundBtn();

    fitCanvasToViewport();
    const ro = new ResizeObserver(() => fitCanvasToViewport());
    ro.observe(canvas);

    window.addEventListener("resize", fitCanvasToViewport, {passive:true});
    if(window.visualViewport){
      window.visualViewport.addEventListener("resize", fitCanvasToViewport, {passive:true});
      window.visualViewport.addEventListener("scroll", fitCanvasToViewport, {passive:true});
    }

    requestAnimationFrame(tick);
  }

  init();
})();
