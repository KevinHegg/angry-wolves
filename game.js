(() => {
  // =========================
  // Angry Wolves — game.js
  // Tap left/right halves = move
  // Swipe up = rotate only
  // =========================

  // ===== Config =====
  const COLS = 10;
  const ROWS = 13;                 // bigger tiles (reduced rows)
  const CLEAR_THRESHOLD = 10;

  const BASE_FALL_MS = 650;
  const MIN_FALL_MS  = 120;
  const LEVEL_EVERY_LOCKS = 12;

  // movement while finger moves
  const STEP_X = 22;
  const STEP_Y = 22;

  // rotate gesture
  const SWIPE_UP_MIN = 34;         // higher to prevent accidental rotation
  const UP_DOMINANCE = 1.25;       // must be this much more vertical than horizontal

  // special spawn weights
  const WEIGHT_NORMAL = 0.88;
  const WEIGHT_BLACKSHEEP = 0.08;
  const WEIGHT_WOLVES = 0.04;

  // background overlay counts (sparse + more eggs than poop)
  const EGGS_COUNT  = 8;
  const TURDS_COUNT = 3;

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
    [TILE.SHEEP]: "#eaf4ff",
    [TILE.GOAT]: "#e6c79a",
    [TILE.CHICKEN]: "#ffe889",
    [TILE.COW]: "#b9c6ff",
    [TILE.PIG]: "#ffb6c9",
    [TILE.WOLF]: "#93a1b5",
    [TILE.BLACK_SHEEP]: "#1b1b24",
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
  const stageEl = document.getElementById("stage");
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  const scoreEl  = document.getElementById("score");
  const levelEl  = document.getElementById("level");
  const clearsEl = document.getElementById("clears");
  const comboEl = document.getElementById("combo");
  const comboBestEl = document.getElementById("comboBest");
  const bestEl   = document.getElementById("best");
  const nextPreviewEl = document.getElementById("nextPreview");
  const holdPreviewEl = document.getElementById("holdPreview");
  const holdButton = document.getElementById("holdButton");
  const missionTitleEl = document.getElementById("missionTitle");
  const missionProgressEl = document.getElementById("missionProgress");

  const gear = document.getElementById("gear");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const closeModal = document.getElementById("closeModal");
  const soundToggle = document.getElementById("soundToggle");
  const gameOverBackdrop = document.getElementById("gameOverBackdrop");
  const restartButton = document.getElementById("restartButton");
  const gameOverTitleEl = document.getElementById("gameOverTitle");
  const gameOverNoteEl = document.getElementById("gameOverNote");
  const finalScoreEl = document.getElementById("finalScore");
  const finalLevelEl = document.getElementById("finalLevel");
  const finalClearsEl = document.getElementById("finalClears");
  const finalBestEl = document.getElementById("finalBest");
  const finalComboEl = document.getElementById("finalCombo");

  // ===== State =====
  let board = makeBoard();
  let overlay = makeOverlay();

  let current = null;
  let next = null;
  let held = null;

  let score = 0;
  let level = 1;
  let locks = 0;
  let herdsCleared = 0;
  let currentCombo = 1;
  let bestCombo = 1;
  let holdUsed = false;
  let mission = null;
  let runEndTitle = "Run Over";
  let runEndNote = "The barn got crowded.";

  let fallTimer = 0;
  let fallInterval = BASE_FALL_MS;
  let paused = false;
  let gameOver = false;
  let modalOpenCount = 0;
  let lastFrameTime = 0;

  // render metrics
  let W=0, H=0, cell=0;
  let pad = 14;

  // particles
  let particles = [];
  let banner = { text:"", t:0, ttl: 900 };

  // touch tracking
  const IS_TOUCH = (("ontouchstart" in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
  let gesture = null;

  const CLEAR_QUIPS = {
    [TILE.SHEEP]: ["Wool done.", "That flock got absolutely sheepish.", "The meadow trembles."],
    [TILE.GOAT]: ["Goat chaos unlocked.", "That herd just ate the leaderboard.", "Pure cliff-certified nonsense."],
    [TILE.CHICKEN]: ["Hen-demonium.", "Certified coop catastrophe.", "Somebody alert the rooster union."],
    [TILE.COW]: ["Udderly excessive.", "The dairy lobby is furious.", "That was a premium moo-ve."],
    [TILE.PIG]: ["Hog wild.", "That sty just went full goblin mode.", "Oink if you love combos."]
  };

  // ===== Audio (silent unlock, no popups) =====
  let audioCtx = null;
  let masterGain = null;
  let soundOn = loadSoundPref();
  let audioUnlocked = false;
  let ambienceClock = 0;

  function loadSoundPref(){
    try{
      const v = localStorage.getItem("aw_sound");
      return v === null ? true : (v === "1");
    }catch{
      return true;
    }
  }
  function saveSoundPref(){
    try{
      localStorage.setItem("aw_sound", soundOn ? "1" : "0");
    }catch{}
  }
  function ensureAudio(){
    if(audioCtx) return;
    try{
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(audioCtx.destination);
    }catch{
      audioCtx = null; masterGain = null;
    }
  }
  function unlockAudioSilently(){
    if(!soundOn) return;
    ensureAudio();
    if(!audioCtx) return;
    if(audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    audioUnlocked = true;
  }

  function playTone({type="sine", f1=220, f2=110, dur=0.12, gain=0.16, noise=false}){
    if(!soundOn || !audioUnlocked || !audioCtx || !masterGain) return;
    if(audioCtx.state === "suspended") audioCtx.resume();

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

  function playJingle(notes, opts={}){
    if(!soundOn || !audioUnlocked || !audioCtx || !masterGain) return;
    const {
      step = 0.08,
      type = "square",
      gain = 0.08
    } = opts;
    const start = audioCtx.currentTime;

    notes.forEach((note, idx) => {
      const freq = typeof note === "number" ? note : note.f;
      const dur = typeof note === "number" ? step : (note.d ?? step);
      const noteGain = typeof note === "number" ? gain : (note.g ?? gain);
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const t0 = start + idx * step;

      osc.type = typeof note === "number" ? type : (note.type ?? type);
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(noteGain, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t0);
      osc.stop(t0 + dur);
    });
  }

  function playBarnyard(animal, size){
    const big = Math.min(0.22, 0.10 + size/170);
    if(animal === TILE.COW){
      playTone({type:"sawtooth", f1:150, f2:70, dur:0.16+big, gain:0.18});
      playTone({type:"sine", f1:95, f2:55, dur:0.18+big, gain:0.13});
    } else if(animal === TILE.PIG){
      playTone({type:"square", f1:210, f2:95, dur:0.12+big, gain:0.17});
      playTone({type:"square", f1:170, f2:85, dur:0.10+big, gain:0.13});
    } else if(animal === TILE.SHEEP){
      playTone({type:"triangle", f1:450, f2:300, dur:0.11+big, gain:0.14});
    } else if(animal === TILE.GOAT){
      playTone({type:"triangle", f1:340, f2:170, dur:0.14+big, gain:0.14});
      playTone({type:"sine", f1:280, f2:150, dur:0.10+big, gain:0.11});
    } else if(animal === TILE.CHICKEN){
      playTone({noise:true, dur:0.06+big, gain:0.12});
      playTone({type:"square", f1:720, f2:460, dur:0.07+big, gain:0.11});
    } else {
      playTone({type:"sine", f1:240, f2:120, dur:0.10+big, gain:0.11});
    }
  }

  function playLevelUpJingle(){
    playJingle([392, 494, 587, 784], { step:0.075, type:"square", gain:0.07 });
  }

  function playMissionJingle(){
    playJingle([523, 659, 784, 988], { step:0.07, type:"triangle", gain:0.08 });
  }

  function playHoldJingle(){
    playJingle([
      { f: 440, d: 0.06, g: 0.05, type: "triangle" },
      { f: 554, d: 0.06, g: 0.05, type: "triangle" }
    ], { step:0.05 });
  }

  function playGameOverJingle(){
    playJingle([
      { f: 392, d: 0.12, g: 0.07, type: "sawtooth" },
      { f: 330, d: 0.14, g: 0.065, type: "sawtooth" },
      { f: 262, d: 0.18, g: 0.06, type: "sawtooth" }
    ], { step:0.11 });
  }

  function playDropThump(){
    playTone({type:"square", f1:100, f2:65, dur:0.06, gain:0.08});
  }

  function playMoveTick(){
    playTone({type:"triangle", f1:420, f2:390, dur:0.035, gain:0.028});
  }

  function playRotateTick(){
    playTone({type:"triangle", f1:520, f2:690, dur:0.05, gain:0.04});
  }

  function playLockTick(){
    playTone({type:"square", f1:170, f2:120, dur:0.05, gain:0.05});
    playTone({noise:true, dur:0.025, gain:0.018});
  }

  function pieceLeadAnimal(piece){
    if(!piece) return null;
    for(const row of piece.matrix){
      for(const v of row){
        if(v) return v;
      }
    }
    return null;
  }

  function playSpawnCue(piece){
    const animal = pieceLeadAnimal(piece);
    if(animal === TILE.WOLF){
      playJingle([220, 196], { step:0.08, type:"sawtooth", gain:0.045 });
    } else if(animal === TILE.BLACK_SHEEP){
      playJingle([311, 277], { step:0.07, type:"triangle", gain:0.04 });
    } else if(animal){
      playJingle([{ f: 392 + animal * 12, d: 0.05, g: 0.03, type: "triangle" }], { step:0.05 });
    }
  }

  function playAmbienceTick(){
    if(!soundOn || !audioUnlocked) return;
    if(Math.random() < 0.08){
      playJingle([
        { f: 165 + Math.random()*35, d: 0.08, g: 0.03, type: "sine" },
        { f: 220 + Math.random()*25, d: 0.06, g: 0.02, type: "triangle" }
      ], { step:0.12 });
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
  function fmtChain(v){ return `x${Math.max(1, v|0)}`; }
  function missionProgressText(value, target){ return `${Math.min(value, target)} / ${target}`; }
  function quipForAnimal(animal){ return randChoice(CLEAR_QUIPS[animal] || ["Barnyard bedlam."]); }

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
      return { kind, x: Math.floor(COLS/2)-1, y: 0, matrix: clone2(SPECIAL.WOLVES_2.matrix), rotates:false };
    }
    if(kind === "BLACKSHEEP"){
      return { kind, x: Math.floor(COLS/2)-1, y: 0, matrix: clone2(SPECIAL.BLACKSHEEP_2.matrix), rotates:false };
    }

    const shapeKey = randChoice(SHAPE_KEYS);
    const animal = randChoice(ANIMALS);
    const base = SHAPES[shapeKey];
    const m = base.map(row => row.map(v => v ? animal : 0));
    return { kind, shapeKey, x: Math.floor(COLS/2)-2, y: 0, matrix: m, rotates:true };
  }

  function clonePiece(piece){
    if(!piece) return null;
    return {
      kind: piece.kind,
      shapeKey: piece.shapeKey,
      x: piece.x,
      y: piece.y,
      matrix: clone2(piece.matrix),
      rotates: piece.rotates
    };
  }

  function preparePiece(piece){
    const fresh = clonePiece(piece);
    if(!fresh) return null;
    fresh.y = 0;
    fresh.x = Math.floor((COLS - fresh.matrix[0].length) / 2);
    return fresh;
  }

  function trimmedMatrix(piece){
    if(!piece) return Array.from({length:4}, () => Array(4).fill(0));
    const rows = piece.matrix.map(row => row.slice());
    const activeRows = rows.filter(row => row.some(Boolean));
    if(!activeRows.length) return Array.from({length:4}, () => Array(4).fill(0));

    let minCol = 99;
    let maxCol = -1;
    for(const row of activeRows){
      row.forEach((v, idx) => {
        if(v){
          minCol = Math.min(minCol, idx);
          maxCol = Math.max(maxCol, idx);
        }
      });
    }

    return activeRows.map(row => row.slice(minCol, maxCol + 1));
  }

  function renderPreview(el, piece){
    if(!el) return;
    const grid = Array.from({length:4}, () => Array(4).fill(0));
    const m = trimmedMatrix(piece);
    const offsetY = Math.floor((4 - m.length) / 2);
    const offsetX = Math.floor((4 - (m[0]?.length || 0)) / 2);

    for(let y=0;y<m.length;y++){
      for(let x=0;x<m[y].length;x++){
        if(m[y][x]) grid[offsetY + y][offsetX + x] = m[y][x];
      }
    }

    el.innerHTML = grid.flat().map((tile) => {
      if(!tile) return '<span class="previewCell"></span>';
      const bg = TILE_COLOR[tile] || "#666";
      const label = TILE_LABEL[tile] || "?";
      return `<span class="previewCell filled" style="background:${bg}">${label}</span>`;
    }).join("");
  }

  function randomMission(){
    const animal = randChoice(ANIMALS);
    const animalTarget = 14 + Math.floor(Math.random() * 5);
    const clearTarget = 3 + Math.floor(Math.random() * 2);
    const comboTarget = 2 + Math.floor(Math.random() * 2);
    const missions = [
      {
        type: "animal",
        title: `Wrangle ${TILE_LABEL[animal]} trouble`,
        progress: 0,
        target: animalTarget,
        bonus: 80 + animalTarget * 4,
        done: false,
        animal
      },
      {
        type: "clears",
        title: `Clear ${clearTarget} proper herds`,
        progress: 0,
        target: clearTarget,
        bonus: 95 + clearTarget * 20,
        done: false
      },
      {
        type: "combo",
        title: `Trigger a ${fmtChain(comboTarget)} combo`,
        progress: 0,
        target: comboTarget,
        bonus: 140 + comboTarget * 35,
        done: false
      },
      {
        type: "wolf",
        title: "Detonate one premium wolf tantrum",
        progress: 0,
        target: 1,
        bonus: 180,
        done: false
      }
    ];
    return randChoice(missions);
  }

  function updateMissionUI(){
    if(!missionTitleEl || !missionProgressEl) return;
    if(!mission){
      missionTitleEl.textContent = "Warm up the barn";
      missionProgressEl.textContent = "Start dropping pieces";
      return;
    }
    missionTitleEl.textContent = mission.done ? `${mission.title} complete` : mission.title;

    if(mission.type === "animal"){
      missionProgressEl.textContent = mission.done
        ? `Bonus banked: +${mission.bonus} coins`
        : `${missionProgressText(mission.progress, mission.target)} ${TILE_LABEL[mission.animal]} cleared`;
      return;
    }

    if(mission.type === "combo"){
      missionProgressEl.textContent = mission.done
        ? `Crowd goes feral: +${mission.bonus}`
        : `Current best this run: ${fmtChain(bestCombo)} (${missionProgressText(mission.progress, mission.target)})`;
      return;
    }

    if(mission.type === "wolf"){
      missionProgressEl.textContent = mission.done
        ? `The barn insurance rates exploded. +${mission.bonus}`
        : `${missionProgressText(mission.progress, mission.target)} wolf tantrums`;
      return;
    }

    missionProgressEl.textContent = mission.done
      ? `Bonus banked: +${mission.bonus} coins`
      : `${missionProgressText(mission.progress, mission.target)} clears`;
  }

  function completeMission(){
    if(!mission || mission.done) return;
    mission.done = true;
    score += mission.bonus;
    banner.text = `Mission complete! ${mission.title}. Farmer impressed. +${mission.bonus}`;
    banner.t = performance.now();
    playMissionJingle();
    updateMissionUI();
    updateHUD();
    gameOverNow({
      title: "Mission Complete",
      note: `${mission.title} complete. Bonus secured: +${mission.bonus} coins.`,
      playSound: false
    });
  }

  function bumpMission(event, value){
    if(!mission || mission.done) return;
    if(event === "animal" && mission.type === "animal" && mission.animal === value.animal){
      mission.progress += value.amount;
    } else if(event === "clears" && mission.type === "clears"){
      mission.progress += value;
    } else if(event === "combo" && mission.type === "combo"){
      mission.progress = Math.max(mission.progress, value);
    } else if(event === "wolf" && mission.type === "wolf"){
      mission.progress += value;
    }
    if(mission.progress >= mission.target) completeMission();
    else updateMissionUI();
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
    current = preparePiece(next ?? newPiece());
    next = newPiece();
    holdUsed = false;
    currentCombo = 1;
    playSpawnCue(current);
    updateHUD();
    if(collides(current,0,0)) gameOverNow();
  }

  function updateLevel(){
    const prevLevel = level;
    level = 1 + Math.floor(locks / LEVEL_EVERY_LOCKS);
    fallInterval = Math.max(MIN_FALL_MS, Math.floor(BASE_FALL_MS * Math.pow(0.88, level-1)));
    if(level > prevLevel){
      banner.text = `Level ${level}! The barn got meaner.`;
      banner.t = performance.now();
      playLevelUpJingle();
    }
    updateHUD();
  }

  function updateHUD(){
    if(scoreEl) scoreEl.textContent = Math.max(0, score|0);
    if(levelEl) levelEl.textContent = level;
    if(clearsEl) clearsEl.textContent = herdsCleared;
    if(comboEl) comboEl.textContent = fmtChain(currentCombo);
    if(comboBestEl) comboBestEl.textContent = fmtChain(bestCombo);

    const best = computeBestGroup();
    if(bestEl){
      bestEl.textContent = !best ? "Best: —" : `Best: ${best.count} ${TILE_LABEL[best.animal]} (${GROUP_NAME[best.animal]})`;
    }
    renderPreview(nextPreviewEl, next);
    renderPreview(holdPreviewEl, held);
    if(holdButton) holdButton.disabled = paused || gameOver || !current || holdUsed;
    updateMissionUI();
  }

  function setOverlayOpen(el, open){
    if(!el) return;
    const wasOpen = !el.classList.contains("hidden");
    if(open === wasOpen) return;
    el.classList.toggle("hidden", !open);
    modalOpenCount += open ? 1 : -1;
    modalOpenCount = Math.max(0, modalOpenCount);
    paused = gameOver || modalOpenCount > 0;
    updateHUD();
  }

  function openSettings(){
    setOverlayOpen(modalBackdrop, true);
    draw();
  }

  function closeSettings(){
    setOverlayOpen(modalBackdrop, false);
    draw();
  }

  function updateGameOverStats(){
    const best = computeBestGroup();
    if(gameOverTitleEl) gameOverTitleEl.textContent = runEndTitle;
    if(gameOverNoteEl) gameOverNoteEl.textContent = runEndNote;
    if(finalScoreEl) finalScoreEl.textContent = Math.max(0, score|0);
    if(finalLevelEl) finalLevelEl.textContent = level;
    if(finalClearsEl) finalClearsEl.textContent = herdsCleared;
    if(finalBestEl) finalBestEl.textContent = best ? `${best.count} ${TILE_LABEL[best.animal]}` : "-";
    if(finalComboEl) finalComboEl.textContent = fmtChain(bestCombo);
  }

  function gameOverNow(opts={}){
    runEndTitle = opts.title ?? "Run Over";
    runEndNote = opts.note ?? "The barn got crowded.";
    gameOver = true;
    if(opts.playSound !== false) playGameOverJingle();
    updateGameOverStats();
    setOverlayOpen(gameOverBackdrop, true);
    draw();
  }

  // ===== Overlay: geometric lattice, sparse, more eggs than poop =====
  function shuffleInPlace(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]] = [arr[j],arr[i]];
    }
  }

  function sprinkleOverlayGeometric(){
    overlay = makeOverlay();

    const startRow = Math.floor(ROWS * 0.45); // only lower part
    const eggPhase  = Math.floor(Math.random()*6);
    const turdPhase = Math.floor(Math.random()*11);
    const xShift = Math.floor(Math.random()*3);

    const eggCandidates = [];
    const turdCandidates = [];

    for(let y=startRow; y<ROWS; y++){
      for(let x=0; x<COLS; x++){
        const xx = (x + xShift) % COLS;

        // eggs: 1/6-ish density lattice
        if(((xx + 2*y + eggPhase) % 6) === 1){
          eggCandidates.push([x,y]);
        }

        // turds: rarer rhythm
        if(((xx + y + turdPhase) % 11) === 4){
          turdCandidates.push([x,y]);
        }
      }
    }

    shuffleInPlace(eggCandidates);
    shuffleInPlace(turdCandidates);

    const blocked = new Set();
    const blockAround = (x,y) => {
      for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        blocked.add(ny*COLS+nx);
      }
    };

    let eggsLeft = EGGS_COUNT;
    for(const [x,y] of eggCandidates){
      if(eggsLeft <= 0) break;
      const key = y*COLS+x;
      if(blocked.has(key)) continue;
      overlay[y][x] = POWER.EGG;
      blockAround(x,y);
      eggsLeft--;
    }

    let turdsLeft = TURDS_COUNT;
    for(const [x,y] of turdCandidates){
      if(turdsLeft <= 0) break;
      const key = y*COLS+x;
      if(blocked.has(key)) continue;
      overlay[y][x] = POWER.TURD;
      blockAround(x,y);
      turdsLeft--;
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
      banner.text = `🐺 BOOM (${popped.length} tiles). The coop lawyers have concerns.`;
      banner.t = performance.now();
      playTone({type:"sawtooth", f1:120, f2:45, dur:0.20, gain:0.20});
      playTone({type:"square", f1:80, f2:40, dur:0.16, gain:0.16});
      haptic(18);
      bumpMission("wolf", 1);
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
        if(cells.length >= CLEAR_THRESHOLD) out.push({ animal: t, cells });
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
  }

  function resolveBoard(){
    let chainDepth = 0;
    while(true){
      if(gameOver) break;
      const clears = findAnimalGroupsToClear();
      if(clears.length === 0) break;
      chainDepth++;
      bestCombo = Math.max(bestCombo, chainDepth);
      bumpMission("combo", chainDepth);

      for(const group of clears){
        const { animal, cells } = group;
        let gain = cells.length;

        if(cells.length >= 11){
          const bonusIndex = cells.length - 8; // 11->3 => fib(3)=2
          gain += fib(bonusIndex);
        }

        let eggs=0, turds=0;
        for(const [x,y] of cells){
          if(overlay[y][x] === POWER.EGG) eggs++;
          if(overlay[y][x] === POWER.TURD) turds++;
        }
        if(eggs)  gain = Math.floor(gain * Math.pow(2, eggs));
        if(turds) gain = Math.max(1, Math.floor(gain / Math.pow(2, turds)));
        if(chainDepth > 1) gain += Math.floor(gain * 0.35 * (chainDepth - 1));
        score += gain;

        for(const [x,y] of cells){
          board[y][x] = TILE.EMPTY;
          overlay[y][x] = POWER.NONE;
        }

        herdsCleared++;
        currentCombo = chainDepth;
        bumpMission("animal", { animal, amount: cells.length });
        bumpMission("clears", 1);
        if(gameOver) break;
        banner.text = `${chainDepth > 1 ? `${fmtChain(chainDepth)} chain! ` : ""}${quipForAnimal(animal)} Cleared ${cells.length} ${TILE_LABEL[animal]} (${GROUP_NAME[animal]}) +${gain}${eggs?` 🥚x${eggs}`:""}${turds?` 💩x${turds}`:""}`;
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
        if(!best || cells.length > best.count) best = { animal: t, count: cells.length };
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
      if(!gameOver) spawnNext();
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
      for(const [x,y] of footprintCells(current)) board[y][x] = chosen;
    }

    locks++;
    updateLevel();
    resolveBoard();
    if(!gameOver) spawnNext();
    playLockTick();
    haptic(10);
  }

  function holdCurrent(){
    if(paused || gameOver || !current || holdUsed) return;
    const outgoing = preparePiece(current);
    if(held){
      current = preparePiece(held);
      held = outgoing;
      if(collides(current,0,0)) return gameOverNow();
    } else {
      held = outgoing;
      spawnNext();
    }
    holdUsed = true;
    banner.text = held ? "Pocketed that chaos for later." : "Hold slot ready. Strategy hat on.";
    banner.t = performance.now();
    playHoldJingle();
    updateHUD();
    draw();
  }

  // ===== Movement =====
  function move(dx){
    if(paused || !current) return;
    if(!collides(current, dx, 0)){
      current.x += dx;
      playMoveTick();
    }
    else haptic(6);
    draw();
  }

  function dropOne(){
    if(paused || !current) return;
    if(!collides(current, 0, 1)){
      current.y += 1;
      playMoveTick();
    }
    else lockPiece();
    draw();
  }

  function hardDrop(){
    if(paused || !current) return;
    let moved = 0;
    while(!collides(current, 0, 1)){
      current.y += 1;
      moved++;
    }
    if(moved){
      score += moved;
      playDropThump();
    }
    lockPiece();
    draw();
  }

  function rotate(dirCW=true){
    if(paused || !current) return;
    if(!current.rotates) return;
    const test = dirCW ? rotateCW(current.matrix) : rotateCCW(current.matrix);
    for(const k of [0,-1,1,-2,2]){
      if(!collides(current, k, 0, test)){
        current.matrix = test;
        current.x += k;
        haptic(6);
        playRotateTick();
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
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }

  function fitCanvasToViewport(){
    resize();
  }

  function resize(){
    const rect = stageEl.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    const targetW = Math.max(220, Math.floor(rect.width * dpr) - Math.floor(8 * dpr));
    const targetH = Math.max(280, Math.floor(rect.height * dpr) - Math.floor(8 * dpr));

    const padPx = pad*2*dpr;
    const cellByW = Math.floor((targetW - padPx) / COLS);
    const cellByH = Math.floor((targetH - padPx) / ROWS);
    cell = Math.max(6, Math.min(cellByW, cellByH));

    W = cell * COLS + padPx;
    H = cell * ROWS + padPx;

    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${Math.floor(W / dpr)}px`;
    canvas.style.height = `${Math.floor(H / dpr)}px`;
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

  function drawOverlay(px, aboveTiles=false){
    ctx.save();
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const p = overlay[y][x];
        if(p === POWER.NONE) continue;

        const hasTile = board[y][x] !== TILE.EMPTY;
        if(aboveTiles !== hasTile) continue;

        const gx = px + x*cell;
        const gy = px + y*cell;
        const accent = p === POWER.EGG ? "#ffd84d" : "#ff6a5b";
        const icon = p === POWER.EGG ? "🥚" : "💩";

        if(!aboveTiles){
          ctx.globalAlpha = 0.24;
          roundRectFill(gx+2, gy+2, cell-4, cell-4, 10, p === POWER.EGG ? "#5c4710" : "#4a1717");
          ctx.globalAlpha = 0.32;
          ctx.strokeStyle = accent;
          ctx.lineWidth = Math.max(1, Math.floor(cell*0.08));
          roundRectStroke(gx+3, gy+3, cell-6, cell-6, 10);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(gx + cell/2, gy + cell/2, Math.max(6, cell*0.22), 0, Math.PI*2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.font = `${Math.floor(cell*0.42)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#fff";
          ctx.fillText(icon, gx + cell/2, gy + cell/2 + 1);
        } else {
          const badgeW = Math.max(18, cell*0.32);
          const badgeH = Math.max(14, cell*0.22);
          ctx.globalAlpha = 0.95;
          roundRectFill(gx + cell - badgeW - 4, gy + 4, badgeW, badgeH, 7, accent);
          ctx.fillStyle = "#1d120a";
          ctx.font = `${Math.floor(cell*0.18)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(icon, gx + cell - badgeW/2 - 4, gy + 4 + badgeH/2 + 1);
        }
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
    ctx.globalAlpha = 0.24;
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

    drawOverlay(px, false);

    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const t = board[y][x];
        if(t !== TILE.EMPTY) drawTile(x,y,t,px,true);
      }
    }

    drawOverlay(px, true);

    if(current && !paused){
      const gy = getGhostY(current);
      drawShadow(current, 0, gy-current.y, px);
    }
    if(current) drawPiece(current,0,0,px);

    stepParticles();
    drawParticles();

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

  // ===== Tap/Swipe behavior FIX =====
  // Tap: move only (left/right half)
  // Swipe up: rotate only
  function onPointerDown(e){
    e.preventDefault();
    unlockAudioSilently();
    gesture = {
      startX: e.clientX,
      startY: e.clientY,
      lastX:  e.clientX,
      lastY:  e.clientY,
      movedX: 0,
      movedY: 0,
      t0: performance.now(),
      rotated: false
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

    while(gesture.movedX <= -STEP_X){ move(-1); gesture.movedX += STEP_X; }
    while(gesture.movedX >=  STEP_X){ move( 1); gesture.movedX -= STEP_X; }
    while(gesture.movedY >=  STEP_Y){ dropOne(); gesture.movedY -= STEP_Y; }

    const totalDx = nx - gesture.startX;
    const totalDy = ny - gesture.startY;
    const upDist  = -totalDy;

    // Rotate ONLY on a clear upward swipe (dominantly vertical), once per gesture
    if(!gesture.rotated && upDist >= SWIPE_UP_MIN && upDist >= Math.abs(totalDx) * UP_DOMINANCE){
      rotate(totalDx < 0 ? false : true); // up-left CCW, up-right/straight CW
      gesture.rotated = true;
    }
  }

  function onPointerUp(e){
    e.preventDefault();
    if(!gesture) return;

    const dt   = performance.now() - gesture.t0;
    const dist = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY);

    // TAP: move one tile based on which half of screen was tapped
    // (Never rotate on tap)
    if(dt < 260 && dist < 10){
      const rect = canvas.getBoundingClientRect();
      const mid = rect.left + rect.width/2;
      move(e.clientX < mid ? -1 : 1);
    }

    gesture = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown, {passive:false});
  canvas.addEventListener("pointermove", onPointerMove, {passive:true});
  canvas.addEventListener("pointerup",   onPointerUp,   {passive:false});
  canvas.addEventListener("pointercancel", () => { gesture = null; });
  window.addEventListener("pointerdown", unlockAudioSilently, {passive:true});
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible") unlockAudioSilently();
  });

  // ===== Keyboard (non-touch) =====
  if(!IS_TOUCH){
    window.addEventListener("keydown", (e) => {
      unlockAudioSilently();
      if(gameOver) return;
      const k = e.key;
      const lk = k.toLowerCase();
      if(["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," "].includes(k)) e.preventDefault();

      if(lk === "p"){ paused = !paused; updateHUD(); draw(); return; }
      if(lk === "r"){ restart(); return; }
      if(lk === "c"){ holdCurrent(); return; }
      if(paused) return;

      if(k === "ArrowLeft" || lk === "a") move(-1);
      else if(k === "ArrowRight" || lk === "d") move(1);
      else if(k === "ArrowDown" || lk === "s") dropOne();
      else if(k === " " || lk === "f") hardDrop();
      else if(k === "ArrowUp" || lk === "x" || lk === "w" || lk === "e") rotate(true);
      else if(lk === "z" || lk === "q") rotate(false);
    }, { passive:false });
  }

  // ===== “Sound unlocked” popup killer =====
  function killSoundUnlockedToasts(){
    const nodes = Array.from(document.querySelectorAll("*"));
    for(const el of nodes){
      const t = (el.textContent || "").trim().toLowerCase();
      if(t === "sound unlocked"){
        el.style.display = "none";
        el.setAttribute("aria-hidden","true");
      }
    }
  }
  function installToastObserver(){
    killSoundUnlockedToasts();
    const mo = new MutationObserver(() => killSoundUnlockedToasts());
    mo.observe(document.documentElement, {subtree:true, childList:true, characterData:true});
  }

  // ===== Fix the on-page help line without touching the rest of the app =====
  function patchHelpLine(){
    const helpPrimary = document.querySelector("#help > div:first-child");
    if(!helpPrimary) return;
    helpPrimary.innerHTML = "<b>Touch:</b> swipe ←/→ move · swipe ↓ drop · swipe ↑ rotate (up-left CCW / up-right CW). Tap left/right halves = nudge.";
  }

  // ===== Settings toggle (simple) =====
  function syncSoundBtn(){
    if(soundToggle) soundToggle.textContent = soundOn ? "ON" : "OFF";
  }
  if(gear){
    gear.addEventListener("click", openSettings);
  }
  if(closeModal){
    closeModal.addEventListener("click", closeSettings);
  }
  if(modalBackdrop){
    modalBackdrop.addEventListener("click", (e) => {
      if(e.target === modalBackdrop) closeSettings();
    });
  }
  if(restartButton){
    restartButton.addEventListener("click", () => {
      setOverlayOpen(gameOverBackdrop, false);
      restart();
    });
  }
  if(holdButton){
    holdButton.addEventListener("click", holdCurrent);
  }
  if(soundToggle){
    const onTap = (e) => {
      e.preventDefault();
      soundOn = !soundOn;
      saveSoundPref();
      syncSoundBtn();
      // if user turns it ON, it will unlock on the next touch
    };
    soundToggle.addEventListener("click", onTap, {passive:false});
    soundToggle.addEventListener("touchend", onTap, {passive:false});
  }

  // ===== Game loop =====
  function tick(now){
    requestAnimationFrame(tick);
    if(!lastFrameTime) lastFrameTime = now;
    const dt = Math.min(50, now - lastFrameTime);
    lastFrameTime = now;
    if(paused || gameOver) return;

    fallTimer += dt;
    ambienceClock += dt;

    if(ambienceClock > 520){
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
    mission = randomMission();
    runEndTitle = "Run Over";
    runEndNote = "The barn got crowded.";
    score=0; level=1; locks=0; herdsCleared=0;
    held=null; currentCombo=1; bestCombo=1; holdUsed=false;
    fallInterval = BASE_FALL_MS;
    fallTimer = 0;
    ambienceClock = 0;
    paused=false; gameOver=false;
    current=null; next=null;
    particles=[]; banner={text:"",t:0,ttl:900};
    setOverlayOpen(modalBackdrop, false);
    setOverlayOpen(gameOverBackdrop, false);
    next = newPiece();
    spawnNext();
    updateHUD();
    draw();
  }

  // ===== Init =====
  function init(){
    injectViewportCSS();
    patchHelpLine();
    installToastObserver();

    sprinkleOverlayGeometric();
    mission = randomMission();

    next = newPiece();
    spawnNext();

    updateHUD();
    syncSoundBtn();
    updateGameOverStats();

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
