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
    BOMB: 8,
    REAPER: 9,
    MORPH: 10,
    SEEDER: 11,
    CASHOUT: 12,
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
    [TILE.BLACK_SHEEP]: "🐑",
    [TILE.BOMB]: "💣",
    [TILE.REAPER]: "✂️",
    [TILE.MORPH]: "❓",
    [TILE.SEEDER]: "🥚",
    [TILE.CASHOUT]: "🪙",
  };

  const TILE_COLOR = {
    [TILE.SHEEP]: "#eaf4ff",
    [TILE.GOAT]: "#e6c79a",
    [TILE.CHICKEN]: "#ffe889",
    [TILE.COW]: "#b9c6ff",
    [TILE.PIG]: "#ffb6c9",
    [TILE.WOLF]: "#6f7c91",
    [TILE.BLACK_SHEEP]: "#1b1b24",
    [TILE.BOMB]: "#ff875d",
    [TILE.REAPER]: "#7ef0d1",
    [TILE.MORPH]: "#5e8dff",
    [TILE.SEEDER]: "#f6d54a",
    [TILE.CASHOUT]: "#c89a2f",
  };

  const SPECIAL_TILE_META = {
    [TILE.WOLF]: { accent: "#d7dfef", badge: "🐺" },
    [TILE.BLACK_SHEEP]: { accent: "#8ee6ff", badge: "↺" },
    [TILE.BOMB]: { accent: "#ffc29d", badge: "💣" },
    [TILE.REAPER]: { accent: "#9cf5df", badge: "✂" },
    [TILE.MORPH]: { accent: "#b8c9ff", badge: "?" },
    [TILE.SEEDER]: { accent: "#fff0a6", badge: "+" },
    [TILE.CASHOUT]: { accent: "#f6dc88", badge: "¤" }
  };

  const GROUP_NAME = {
    [TILE.SHEEP]: "flock",
    [TILE.GOAT]: "herd",
    [TILE.CHICKEN]: "flock",
    [TILE.COW]: "herd",
    [TILE.PIG]: "sounder",
  };

  const ANIMAL_NAME = {
    [TILE.SHEEP]: "sheep",
    [TILE.GOAT]: "goats",
    [TILE.CHICKEN]: "chickens",
    [TILE.COW]: "cows",
    [TILE.PIG]: "pigs",
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
    BLACKSHEEP_2: { matrix:[[1,1],[1,1]], tile:TILE.BLACK_SHEEP, rotates:false },
    BOMB_T:       { matrix:[[1,1,1],[0,1,0],[0,0,0]], tile:TILE.BOMB, rotates:true },
    REAPER_I:     { matrix:[[1,1,1,1]], tile:TILE.REAPER, rotates:true },
    MORPH_L:      { matrix:[[1,0,0],[1,1,1],[0,0,0]], tile:TILE.MORPH, rotates:true },
    SEEDER_S:     { matrix:[[0,1,1],[1,1,0],[0,0,0]], tile:TILE.SEEDER, rotates:true },
    CASHOUT_1:    { matrix:[[1]], tile:TILE.CASHOUT, rotates:false }
  };

  // ===== DOM =====
  const stageEl = document.getElementById("stage");
  const canvas = document.getElementById("c");
  const mobileTapZone = document.getElementById("mobileTapZone");
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
  const missionMeterFillEl = document.getElementById("missionMeterFill");
  const stageMissionTitleEl = document.getElementById("stageMissionTitle");
  const stageMissionProgressTextEl = document.getElementById("stageMissionProgressText");
  const stageMissionMeterFillEl = document.getElementById("stageMissionMeterFill");
  const missionSpecialNameEl = document.getElementById("missionSpecialName");
  const missionSpecialInfoEl = document.getElementById("missionSpecialInfo");
  const missionSpecialPreviewEl = document.getElementById("missionSpecialPreview");

  const gear = document.getElementById("gear");
  const helpButton = document.getElementById("helpButton");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const closeModal = document.getElementById("closeModal");
  const soundToggle = document.getElementById("soundToggle");
  const gameOverBackdrop = document.getElementById("gameOverBackdrop");
  const restartButton = document.getElementById("restartButton");
  const gameOverTitleEl = document.getElementById("gameOverTitle");
  const gameOverNoteEl = document.getElementById("gameOverNote");
  const missionBriefBackdrop = document.getElementById("missionBriefBackdrop");
  const missionBriefTitleEl = document.getElementById("missionBriefTitle");
  const missionBriefBodyEl = document.getElementById("missionBriefBody");
  const missionBriefObjectiveEl = document.getElementById("missionBriefObjective");
  const missionBriefBonusEl = document.getElementById("missionBriefBonus");
  const missionBriefSpecialNameEl = document.getElementById("missionBriefSpecialName");
  const missionBriefSpecialInfoEl = document.getElementById("missionBriefSpecialInfo");
  const missionBriefPreviewEl = document.getElementById("missionBriefPreview");
  const missionStartButton = document.getElementById("missionStartButton");
  const helpBackdrop = document.getElementById("helpBackdrop");
  const closeHelpButton = document.getElementById("closeHelp");
  const toastEl = document.getElementById("toast");
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
  let currentCombo = 0;
  let bestCombo = 0;
  let holdUsed = false;
  let mission = null;
  let runEndTitle = "Run Over";
  let runEndNote = "The barn got crowded.";
  let missionSpecialCharge = 0;
  let missionSpecialPending = false;
  let cashoutCharge = 0;

  let fallTimer = 0;
  let fallInterval = BASE_FALL_MS;
  let rotateSlowUntil = 0;
  let rotateSlowUses = 4;
  let paused = false;
  let gameOver = false;
  let modalOpenCount = 0;
  let lastFrameTime = 0;
  let lastTapTime = 0;
  let lastTapX = 0;
  let lastTapY = 0;

  // render metrics
  let W=0, H=0, cell=0;
  let pad = 14;

  // particles
  let particles = [];
  let banner = { text:"", t:0, ttl: 900 };
  let toastTimer = 0;

  // touch tracking
  const IS_TOUCH = (("ontouchstart" in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
  let gesture = null;
  let tapZoneGesture = null;

  const CLEAR_QUIPS = {
    [TILE.SHEEP]: ["Wool done.", "That flock got absolutely sheepish.", "The meadow trembles."],
    [TILE.GOAT]: ["Goat chaos unlocked.", "That herd just ate the leaderboard.", "Pure cliff-certified nonsense."],
    [TILE.CHICKEN]: ["Hen-demonium.", "Certified coop catastrophe.", "Somebody alert the rooster union."],
    [TILE.COW]: ["Udderly excessive.", "The dairy lobby is furious.", "That was a premium moo-ve."],
    [TILE.PIG]: ["Hog wild.", "That sty just went full goblin mode.", "Oink if you love combos."]
  };

  const SPECIAL_RULES = {
    bomb: {
      title: "Barn Buster",
      desc: "On average, a bomb tetrad drops in as the next piece every 5 settles. It detonates nearby settled tiles.",
      short: "Bomb tetrad drops about every 5 settles.",
      every: 5,
      tile: TILE.BOMB
    },
    reaper: {
      title: "Cull Comb",
      desc: "On average, a scissor tetrad drops in as the next piece every 5 settles. It deletes the biggest animal group on the board.",
      short: "Scissor tetrad drops about every 5 settles.",
      every: 5,
      tile: TILE.REAPER
    },
    morph: {
      title: "Mystery Crate",
      desc: "On average, a question-mark tetrad drops in as the next piece every 4 settles. It becomes whatever animal touches it first.",
      short: "Question-mark tetrad drops about every 4 settles.",
      every: 4,
      tile: TILE.MORPH
    },
    seeder: {
      title: "Nest Bomber",
      desc: "On average, a nest tetrad drops in as the next piece every 5 settles. It seeds eggs and turds around its landing zone.",
      short: "Nest tetrad drops about every 5 settles.",
      every: 5,
      tile: TILE.SEEDER
    }
  };

  const MISSION_DEFS = [
    { id:"sheep_roundup", type:"animal", animal:TILE.SHEEP, target:17, bonus:150, special:"bomb", title:"Sheep Sweep" },
    { id:"goat_roundup", type:"animal", animal:TILE.GOAT, target:17, bonus:150, special:"morph", title:"Goat Evac" },
    { id:"chicken_roundup", type:"animal", animal:TILE.CHICKEN, target:18, bonus:155, special:"seeder", title:"Coop Cleanup" },
    { id:"cow_roundup", type:"animal", animal:TILE.COW, target:16, bonus:160, special:"reaper", title:"Moo Move" },
    { id:"pig_roundup", type:"animal", animal:TILE.PIG, target:18, bonus:155, special:"bomb", title:"Hog Panic" },
    { id:"clear_three", type:"clears", target:3, bonus:155, special:"reaper", title:"Triple Clear" },
    { id:"clear_four", type:"clears", target:4, bonus:190, special:"bomb", title:"Quad Clear" },
    { id:"combo_two", type:"combo", target:2, bonus:185, special:"morph", title:"Chain Starter" },
    { id:"combo_three", type:"combo", target:3, bonus:240, special:"morph", title:"Chain Fever" },
    { id:"wolf_once", type:"wolf", target:1, bonus:220, special:"bomb", title:"Wolf Pop" },
    { id:"wolf_twice", type:"wolf", target:2, bonus:300, special:"bomb", title:"Wolf Rampage" },
    { id:"score_220", type:"score", target:220, bonus:160, special:"seeder", title:"Coin Sprint" },
    { id:"score_320", type:"score", target:320, bonus:220, special:"reaper", title:"Sunrise Scramble" },
    { id:"level_three", type:"level", target:3, bonus:200, special:"morph", title:"Level Rush" },
    { id:"level_four", type:"level", target:4, bonus:260, special:"bomb", title:"Boot Test" },
    { id:"big_group_two", type:"big_group", target:2, bonus:210, special:"reaper", title:"Jumbo Duo" },
    { id:"special_once", type:"special_use", target:1, bonus:150, special:"seeder", title:"Special Trial" },
    { id:"special_twice", type:"special_use", target:2, bonus:240, special:"seeder", title:"Special Encore" },
    { id:"locks_eight", type:"locks", target:8, bonus:160, special:"morph", title:"Steady Hands" },
    { id:"locks_twelve", type:"locks", target:12, bonus:240, special:"reaper", title:"Mud Marathon" }
  ];

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
      masterGain.gain.value = soundOn ? 1.0 : 0.0;
      masterGain.connect(audioCtx.destination);
    }catch{
      audioCtx = null; masterGain = null;
    }
  }
  function syncMasterGain(){
    if(masterGain && audioCtx){
      masterGain.gain.setValueAtTime(soundOn ? 1.0 : 0.0, audioCtx.currentTime);
    }
  }
  function primeAudioContext(){
    if(!audioCtx || !masterGain || audioCtx.state !== "running") return;
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    osc.frequency.setValueAtTime(440, t0);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t0);
    osc.stop(t0 + 0.01);
  }
  function unlockAudioSilently(){
    if(!soundOn) return;
    ensureAudio();
    if(!audioCtx) return;
    syncMasterGain();
    const markUnlocked = () => {
      audioUnlocked = true;
      primeAudioContext();
    };
    if(audioCtx.state === "suspended"){
      audioCtx.resume().then(markUnlocked).catch(() => {});
      return;
    }
    markUnlocked();
  }

  function playTone({type="sine", f1=220, f2=110, dur=0.12, gain=0.16, noise=false}){
    if(!soundOn) return;
    ensureAudio();
    if(!audioCtx || !masterGain || audioCtx.state !== "running") return;
    syncMasterGain();

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
    if(!soundOn) return;
    ensureAudio();
    if(!audioCtx || !masterGain || audioCtx.state !== "running") return;
    syncMasterGain();
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

  function playBarnyard(animal, size, mode="clear"){
    const isBig = mode === "clear";
    const shape = Math.min(0.24, isBig ? (0.10 + size/170) : 0.05);
    const gainBoost = isBig ? 1 : 0.58;
    if(animal === TILE.COW){
      playTone({type:"sawtooth", f1:isBig ? 145 : 170, f2:isBig ? 62 : 115, dur:(isBig ? 0.18 : 0.10)+shape, gain:0.18*gainBoost});
      playTone({type:"sine", f1:isBig ? 92 : 120, f2:isBig ? 52 : 90, dur:(isBig ? 0.20 : 0.11)+shape, gain:0.13*gainBoost});
      if(isBig) playTone({type:"triangle", f1:118, f2:72, dur:0.15, gain:0.08});
    } else if(animal === TILE.PIG){
      playTone({type:"square", f1:isBig ? 235 : 255, f2:isBig ? 92 : 170, dur:(isBig ? 0.13 : 0.08)+shape, gain:0.17*gainBoost});
      playTone({type:"square", f1:isBig ? 185 : 205, f2:isBig ? 84 : 145, dur:(isBig ? 0.11 : 0.07)+shape, gain:0.13*gainBoost});
      if(isBig) playTone({type:"triangle", f1:310, f2:180, dur:0.09, gain:0.06});
    } else if(animal === TILE.SHEEP){
      playTone({type:"triangle", f1:isBig ? 430 : 470, f2:isBig ? 250 : 360, dur:(isBig ? 0.15 : 0.09)+shape, gain:0.14*gainBoost});
      if(isBig) playTone({type:"sine", f1:360, f2:230, dur:0.12, gain:0.07});
    } else if(animal === TILE.GOAT){
      playTone({type:"triangle", f1:isBig ? 330 : 360, f2:isBig ? 150 : 240, dur:(isBig ? 0.15 : 0.09)+shape, gain:0.14*gainBoost});
      playTone({type:"sine", f1:isBig ? 285 : 320, f2:isBig ? 140 : 210, dur:(isBig ? 0.12 : 0.08)+shape, gain:0.10*gainBoost});
    } else if(animal === TILE.CHICKEN){
      playTone({noise:true, dur:(isBig ? 0.08 : 0.045)+shape, gain:0.11*gainBoost});
      playTone({type:"square", f1:isBig ? 760 : 680, f2:isBig ? 420 : 560, dur:(isBig ? 0.08 : 0.05)+shape, gain:0.10*gainBoost});
      if(isBig) playTone({type:"triangle", f1:920, f2:720, dur:0.05, gain:0.05});
    } else {
      playTone({type:"sine", f1:isBig ? 240 : 280, f2:isBig ? 120 : 180, dur:(isBig ? 0.12 : 0.08)+shape, gain:0.11*gainBoost});
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
        if(v && ANIMALS.includes(v)) return v;
      }
    }
    return null;
  }

  function playSpawnCue(piece){
    const animal = pieceLeadAnimal(piece);
    if(piece?.kind === "MISSION_BOMB"){
      playJingle([330, 247], { step:0.08, type:"sawtooth", gain:0.05 });
    } else if(piece?.kind === "MISSION_REAPER"){
      playJingle([659, 523], { step:0.06, type:"triangle", gain:0.045 });
    } else if(piece?.kind === "MISSION_MORPH"){
      playJingle([392, 523, 659], { step:0.05, type:"triangle", gain:0.04 });
    } else if(piece?.kind === "MISSION_SEEDER"){
      playJingle([523, 440], { step:0.07, type:"square", gain:0.04 });
    } else if(animal === TILE.WOLF){
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
  function fmtChain(v){ return `x${Math.max(0, v|0)}`; }
  function missionProgressText(value, target){ return `${Math.min(value, target)} / ${target}`; }
  function quipForAnimal(animal){ return randChoice(CLEAR_QUIPS[animal] || ["Barnyard bedlam."]); }
  function specialJoinRateLabel(rule){
    return rule ? `About every ${rule.every} settles` : "";
  }
  function animalWord(animal){
    return ANIMAL_NAME[animal] || "animals";
  }
  function groupSummary(animal, count){
    if(!animal || !count) return "-";
    return `${count} ${animalWord(animal)} block${count === 1 ? "" : "s"}`;
  }
  function formatBestGroup(best){
    if(!best) return "Largest cluster left: -";
    return `Largest cluster left: ${groupSummary(best.animal, best.count)}`;
  }
  function missionCurrentProgress(){
    if(!mission) return 0;
    if(mission.type === "score") return score;
    if(mission.type === "level") return level;
    if(mission.type === "locks") return locks;
    return mission.progress ?? 0;
  }
  function missionProgressRatio(){
    if(!mission) return 0;
    if(mission.done || mission.ready) return 1;
    return clamp(missionCurrentProgress() / Math.max(1, mission.target), 0, 1);
  }
  function showToast(text, ms=1050){
    if(!toastEl) return;
    if(toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = text;
    toastEl.classList.remove("hidden");
    toastTimer = window.setTimeout(() => {
      toastEl.classList.add("hidden");
      toastTimer = 0;
    }, ms);
  }
  function isMissionSpecialPiece(piece){
    return !!piece && [
      "MISSION_BOMB",
      "MISSION_REAPER",
      "MISSION_MORPH",
      "MISSION_SEEDER",
    ].includes(piece.kind);
  }

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
      return { kind, x: Math.floor(COLS/2)-1, y: 0, matrix: materializeSpecMatrix(SPECIAL.WOLVES_2), rotates:false };
    }
    if(kind === "BLACKSHEEP"){
      return { kind, x: Math.floor(COLS/2)-1, y: 0, matrix: materializeSpecMatrix(SPECIAL.BLACKSHEEP_2), rotates:false };
    }

    const shapeKey = randChoice(SHAPE_KEYS);
    const animal = randChoice(ANIMALS);
    const base = SHAPES[shapeKey];
    const m = base.map(row => row.map(v => v ? animal : 0));
    return { kind, shapeKey, x: Math.floor(COLS/2)-2, y: 0, matrix: m, rotates:true };
  }

  function materializeSpecMatrix(spec){
    return spec.matrix.map((row) => row.map((v) => v ? spec.tile : 0));
  }

  function createMissionSpecialPiece(){
    if(!mission) return null;
    if(mission.special === "bomb"){
      return { kind:"MISSION_BOMB", x: Math.floor(COLS/2)-1, y:0, matrix: materializeSpecMatrix(SPECIAL.BOMB_T), rotates:true };
    }
    if(mission.special === "reaper"){
      return { kind:"MISSION_REAPER", x: Math.floor(COLS/2)-2, y:0, matrix: materializeSpecMatrix(SPECIAL.REAPER_I), rotates:true };
    }
    if(mission.special === "morph"){
      return { kind:"MISSION_MORPH", x: Math.floor(COLS/2)-1, y:0, matrix: materializeSpecMatrix(SPECIAL.MORPH_L), rotates:true };
    }
    if(mission.special === "seeder"){
      return { kind:"MISSION_SEEDER", x: Math.floor(COLS/2)-1, y:0, matrix: materializeSpecMatrix(SPECIAL.SEEDER_S), rotates:true };
    }
    return null;
  }

  function createCashoutPiece(){
    return { kind:"MISSION_CASHOUT", x: Math.floor(COLS/2), y:0, matrix: materializeSpecMatrix(SPECIAL.CASHOUT_1), rotates:false };
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
      const special = SPECIAL_TILE_META[tile];
      const style = special
        ? `background:linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 42%), ${bg}; border-color:${special.accent}; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 0 1px ${special.accent}, 0 0 14px rgba(0,0,0,0.18);`
        : `background:${bg}`;
      return `<span class="previewCell filled" style="${style}">${label}</span>`;
    }).join("");
  }

  function newMission(){
    const def = randChoice(MISSION_DEFS);
    return {
      ...def,
      progress: 0,
      done: false,
      ready: false,
      cashBonus: def.bonus,
    };
  }

  function missionSpecialRule(){
    return mission ? SPECIAL_RULES[mission.special] : null;
  }

  function missionCashoutEvery(){
    return 3;
  }

  function missionSpecialWarmth(){
    return clamp(missionSpecialCharge, 0, 1);
  }

  function maybeQueueMissionSpecial(){
    if(!mission || mission.done || mission.ready) return false;
    const specialRule = missionSpecialRule();
    if(!specialRule) return false;
    if(missionSpecialPending || isMissionSpecialPiece(current)) return false;

    const averageStep = 1 / specialRule.every;
    const jitteredStep = averageStep * (0.65 + Math.random() * 0.7);
    missionSpecialCharge = clamp(missionSpecialCharge + jitteredStep, 0, 1.5);

    if(missionSpecialCharge < 1) return false;

    missionSpecialPending = true;
    missionSpecialCharge = Math.max(0, missionSpecialCharge - 1);
    return true;
  }

  function missionPressureMultiplier(){
    return (mission && mission.ready && !mission.done) ? 0.84 : 1;
  }

  function missionReadyLockBonus(){
    return 18 + level * 4;
  }

  function registerLockCycle(opts={}){
    locks++;
    if(mission && !mission.done){
      if(mission.ready){
        const bonusGain = opts.skipCashout ? 0 : missionReadyLockBonus();
        if(bonusGain > 0){
          mission.cashBonus += bonusGain;
          banner.text = `Greed pays... for now. Bonus swelled to +${mission.cashBonus}.`;
          banner.t = performance.now();
        }
        if(!opts.skipCashout){
          cashoutCharge++;
          const locksLeft = Math.max(0, missionCashoutEvery() - cashoutCharge);
          if(locksLeft > 0){
            banner.text = `Earn coin in ${locksLeft} more settle${locksLeft === 1 ? "" : "s"}. Bonus at risk: +${mission.cashBonus}.`;
            banner.t = performance.now();
          }
        }
      } else if(!opts.skipMissionCharge){
        maybeQueueMissionSpecial();
      }
    }
    syncPassiveMissionProgress();
    updateLevel();
  }

  function isCompactUI(){
    return window.innerWidth <= 760;
  }

  function missionObjectiveLabel(){
    if(!mission) return "Warm up the barn";
    if(mission.type === "animal") return `Clear ${mission.target} ${animalWord(mission.animal)} blocks`;
    if(mission.type === "clears") return `Clear ${mission.target} big groups`;
    if(mission.type === "combo") return `${fmtChain(mission.target)} combo`;
    if(mission.type === "wolf") return `Trigger ${mission.target} wolf tantrum${mission.target === 1 ? "" : "s"}`;
    if(mission.type === "score") return `Score ${mission.target} coins`;
    if(mission.type === "level") return `Reach level ${mission.target}`;
    if(mission.type === "big_group") return `Clear ${mission.target} jumbo groups`;
    if(mission.type === "special_use") return `Use your mission special ${mission.target} time${mission.target === 1 ? "" : "s"}`;
    if(mission.type === "locks") return `Survive ${mission.target} settles`;
    return mission.title;
  }

  function missionBriefCopy(){
    if(!mission) return "The barn is quiet. It will not stay that way.";
    if(mission.type === "animal") return `Clear enough ${animalWord(mission.animal)} blocks ${TILE_LABEL[mission.animal]} to hit the goal. Then you can grab the reward coin or keep playing for a bigger payout while the barn speeds up.`;
    if(mission.type === "clears") return "Clear enough herds to make the reward coin appear. Every extra settle after that sweetens the bonus and raises the risk.";
    if(mission.type === "combo") return "Your chain goes up whenever a settled piece clears one or more herds. A settle that clears nothing resets it.";
    if(mission.type === "wolf") return "You are actively encouraging wolf misconduct. Finish the mission, then flirt with disaster until the reward coin shows up.";
    if(mission.type === "score") return "Rack up coins fast. After you hit the target, you can stall for an even fatter mission payout if your nerves hold.";
    if(mission.type === "level") return "Stay alive long enough for the barn to get mean. Once the mission pops, it gets meaner still until you collect the coin.";
    if(mission.type === "big_group") return "Build oversized clusters and clear them. Then choose between a tidy win and a greedier, shakier finish.";
    if(mission.type === "special_use") return "Lean on the mission special on purpose. Completing the objective arms the reward coin, and every extra settle fattens the bonus.";
    if(mission.type === "locks") return "Survive the required settles, then decide how much longer you want to tempt the barn gods before collecting the coin.";
    return "The barn demands something weird from you today. Finish the objective, then choose whether to collect the coin or get greedy.";
  }

  function openMissionBriefing(){
    const specialRule = missionSpecialRule();
    if(missionBriefTitleEl) missionBriefTitleEl.textContent = mission?.title ?? "Mission Briefing";
    if(missionBriefBodyEl) missionBriefBodyEl.textContent = missionBriefCopy();
    if(missionBriefObjectiveEl) missionBriefObjectiveEl.textContent = missionObjectiveLabel();
    if(missionBriefBonusEl) missionBriefBonusEl.textContent = `Base reward: +${mission?.bonus ?? 0} coins`;
    if(missionBriefSpecialNameEl) missionBriefSpecialNameEl.textContent = specialRule ? specialRule.title : "No special";
    if(missionBriefSpecialInfoEl) missionBriefSpecialInfoEl.textContent = specialRule ? specialRule.desc : "No special tetrad assigned.";
    renderPreview(missionBriefPreviewEl, createMissionSpecialPiece());
    setOverlayOpen(missionBriefBackdrop, true);
  }

  function closeMissionBriefing(){
    setOverlayOpen(missionBriefBackdrop, false);
    draw();
  }

  function updateMissionUI(){
    if(!missionTitleEl || !missionProgressEl || !missionSpecialNameEl || !missionSpecialInfoEl) return;
    if(!mission){
      missionTitleEl.textContent = "Warm up the barn";
      missionProgressEl.textContent = "Start dropping pieces";
      if(missionMeterFillEl) missionMeterFillEl.style.width = "0%";
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = "Mission warming up";
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = "Start dropping pieces";
      if(stageMissionMeterFillEl) stageMissionMeterFillEl.style.width = "0%";
      missionSpecialNameEl.textContent = "Special tetrad: warming up";
      missionSpecialInfoEl.textContent = "Mission tricks will appear here.";
      renderPreview(missionSpecialPreviewEl, null);
      return;
    }
    const progressRatio = missionProgressRatio();
    const progressWidth = `${Math.round(progressRatio * 100)}%`;
    if(missionMeterFillEl) missionMeterFillEl.style.width = progressWidth;
    if(stageMissionMeterFillEl) stageMissionMeterFillEl.style.width = progressWidth;
    const specialRule = missionSpecialRule();
    const specialQueued = missionSpecialPending;
    const specialWarmth = Math.round(missionSpecialWarmth() * 100);
    const objectiveLabel = missionObjectiveLabel();

    if(mission.done){
      missionTitleEl.textContent = `${mission.title} earned`;
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = `${mission.title} earned`;
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = `+${mission.cashBonus} coins earned`;
      missionSpecialNameEl.textContent = "Mission earned";
      missionSpecialInfoEl.textContent = `You earned +${mission.cashBonus} coins.`;
      renderPreview(missionSpecialPreviewEl, createCashoutPiece());
    } else if(mission.ready){
      missionTitleEl.textContent = `${mission.title} ready`;
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = `${mission.title} ready`;
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = `Goal met · coin in ${Math.max(0, missionCashoutEvery() - cashoutCharge)} settles`;
      missionSpecialNameEl.textContent = "Reward coin incoming";
      missionSpecialInfoEl.textContent = isCompactUI()
        ? `Coin in ${Math.max(0, missionCashoutEvery() - cashoutCharge)} settles. Bonus +${mission.cashBonus} at risk.`
        : `Objective met. Keep playing if you dare: the barn speeds up, your bonus grows every settle, and a cash-out coin appears every ${missionCashoutEvery()} settles so you can end the run and earn it.`;
      renderPreview(missionSpecialPreviewEl, createCashoutPiece());
    } else {
      missionTitleEl.textContent = mission.title;
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = `${mission.title} · ${objectiveLabel}`;
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = `${Math.round(progressRatio * 100)}% to goal`;
      missionSpecialNameEl.textContent = specialRule ? `Special tetrad: ${specialRule.title}` : "Special tetrad: none";
      missionSpecialInfoEl.textContent = specialRule
        ? isCompactUI()
          ? specialQueued
            ? "Primed to drop next."
            : `${specialJoinRateLabel(specialRule)} · warming up ${specialWarmth}%`
          : `${specialRule.desc} ${specialQueued ? "It is primed to drop as the next piece." : `Chance is warming up (${specialWarmth}%).`}`
        : "No special tetrad assigned.";
      renderPreview(missionSpecialPreviewEl, createMissionSpecialPiece());
    }

    if(mission.type === "animal"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? `Goal met. Keep clearing ${animalWord(mission.animal)} blocks for score while the coin charges.`
          : `${missionProgressText(mission.progress, mission.target)} ${animalWord(mission.animal)} blocks cleared`;
      if(stageMissionProgressTextEl && !mission.done && !mission.ready){
        stageMissionProgressTextEl.textContent = `${missionProgressText(mission.progress, mission.target)} ${animalWord(mission.animal)} blocks`;
      }
      return;
    }

    if(mission.type === "combo"){
      missionProgressEl.textContent = mission.done
        ? `Crowd goes feral: +${mission.cashBonus}`
        : mission.ready
          ? `Combo landed. The bonus keeps fattening while the barn gets nastier.`
          : `Best chain this run: ${fmtChain(bestCombo)} (${missionProgressText(mission.progress, mission.target)})`;
      return;
    }

    if(mission.type === "wolf"){
      missionProgressEl.textContent = mission.done
        ? `The barn insurance rates exploded. +${mission.cashBonus}`
        : mission.ready
          ? `Wolf mission complete. Survive the greed window and grab the coin.`
          : `${missionProgressText(mission.progress, mission.target)} wolf tantrums`;
      return;
    }

    if(mission.type === "score"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? `Target score hit. Now decide how greedy you feel.`
          : `${missionProgressText(score, mission.target)} coins scored`;
      return;
    }

    if(mission.type === "level"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? `You reached the target level. Grab the coin now or keep riding the speed-up.`
          : `Current level ${level} (${missionProgressText(level, mission.target)})`;
      return;
    }

    if(mission.type === "big_group"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? `Jumbo herd goal complete. Extra settles now mean extra danger and extra bonus.`
          : `${missionProgressText(mission.progress, mission.target)} jumbo herds cleared`;
      return;
    }

    if(mission.type === "special_use"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? `Special requirement met. The coin will let you earn the mission soon.`
          : `${missionProgressText(mission.progress, mission.target)} mission specials used`;
      return;
    }

    if(mission.type === "locks"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? `You survived the required settles. Anything after this is pure greed.`
          : `${missionProgressText(locks, mission.target)} settles survived`;
      if(stageMissionProgressTextEl && !mission.done && !mission.ready){
        stageMissionProgressTextEl.textContent = `${missionProgressText(locks, mission.target)} settles survived`;
      }
      return;
    }

    missionProgressEl.textContent = mission.done
      ? `Bonus earned: +${mission.cashBonus} coins`
      : mission.ready
        ? `Clear goal done. The bonus grows until you grab the coin or wash out.`
        : `${missionProgressText(mission.progress, mission.target)} clears`;
    if(stageMissionProgressTextEl && !mission.done && !mission.ready){
      stageMissionProgressTextEl.textContent = `${missionProgressText(mission.progress, mission.target)} toward the goal`;
    }
  }

  function completeMission(){
    if(!mission || mission.done || mission.ready) return;
    mission.ready = true;
    mission.cashBonus = mission.bonus;
    missionSpecialPending = false;
    missionSpecialCharge = 0;
    cashoutCharge = 0;
    banner.text = `Objective met! Push your luck or grab the coin. Bonus at risk: +${mission.cashBonus}`;
    banner.t = performance.now();
    playMissionJingle();
    updateMissionUI();
    updateHUD();
  }

  function bumpMission(event, value){
    if(!mission || mission.done || mission.ready) return;
    if(event === "animal" && mission.type === "animal" && mission.animal === value.animal){
      mission.progress += value.amount;
    } else if(event === "clears" && mission.type === "clears"){
      mission.progress += value;
    } else if(event === "combo" && mission.type === "combo"){
      mission.progress = Math.max(mission.progress, value);
    } else if(event === "wolf" && mission.type === "wolf"){
      mission.progress += value;
    } else if(event === "big_group" && mission.type === "big_group"){
      mission.progress += value;
    } else if(event === "special_use" && mission.type === "special_use"){
      mission.progress += value;
    }
    if(["score","level","locks"].includes(mission.type)){
      mission.progress = mission.type === "score" ? score : mission.type === "level" ? level : locks;
    }
    if(mission.progress >= mission.target) completeMission();
    else updateMissionUI();
  }

  function syncPassiveMissionProgress(){
    if(!mission || mission.done || mission.ready) return;
    if(mission.type === "score") mission.progress = score;
    else if(mission.type === "level") mission.progress = level;
    else if(mission.type === "locks") mission.progress = locks;
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
    if(mission && mission.ready && !mission.done && cashoutCharge >= missionCashoutEvery()){
      current = preparePiece(createCashoutPiece());
      cashoutCharge = 0;
    } else if(missionSpecialPending && mission && !mission.done && !mission.ready){
      current = preparePiece(createMissionSpecialPiece());
      missionSpecialPending = false;
    } else {
      current = preparePiece(next ?? newPiece());
      next = newPiece();
    }
    if(!next) next = newPiece();
    holdUsed = false;
    rotateSlowUses = 4;
    rotateSlowUntil = 0;
    playSpawnCue(current);
    updateHUD();
    if(collides(current,0,0)) gameOverNow();
  }

  function updateLevel(){
    const prevLevel = level;
    level = 1 + Math.floor(locks / LEVEL_EVERY_LOCKS);
    fallInterval = Math.max(
      MIN_FALL_MS,
      Math.floor(BASE_FALL_MS * Math.pow(0.88, level-1) * missionPressureMultiplier())
    );
    if(level > prevLevel){
      banner.text = `Level ${level}! The barn got meaner.`;
      banner.t = performance.now();
      playLevelUpJingle();
    }
    syncPassiveMissionProgress();
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
      bestEl.textContent = formatBestGroup(best);
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

  function openHelp(){
    setOverlayOpen(helpBackdrop, true);
    draw();
  }

  function closeHelp(){
    setOverlayOpen(helpBackdrop, false);
    draw();
  }

  function updateGameOverStats(){
    const best = computeBestGroup();
    if(gameOverTitleEl) gameOverTitleEl.textContent = runEndTitle;
    if(gameOverNoteEl) gameOverNoteEl.textContent = runEndNote;
    if(finalScoreEl) finalScoreEl.textContent = Math.max(0, score|0);
    if(finalLevelEl) finalLevelEl.textContent = level;
    if(finalClearsEl) finalClearsEl.textContent = herdsCleared;
    if(finalBestEl) finalBestEl.textContent = best ? `${groupSummary(best.animal, best.count)} ${TILE_LABEL[best.animal]}` : "-";
    if(finalComboEl) finalComboEl.textContent = fmtChain(bestCombo);
  }

  function gameOverNow(opts={}){
    runEndTitle = opts.title ?? "Run Over";
    runEndNote = opts.note ?? (
      mission && mission.ready && !mission.done
        ? `You had +${mission.cashBonus} coins on the line, but the barn buried the coin before you could earn them.`
        : "The barn got crowded."
    );
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

  function findLargestAnimalGroup(){
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
        if(!best || cells.length > best.cells.length) best = { animal: t, cells };
      }
    }
    return best;
  }

  function chooseLandingAnimal(piece){
    const counts = new Map(ANIMALS.map(a => [a, 0]));
    for(const [x,y] of footprintCells(piece)){
      for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){
        const nx = x + dx, ny = y + dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        const t = board[ny][nx];
        if(ANIMALS.includes(t)) counts.set(t, counts.get(t)+1);
      }
    }
    let bestCount = 0;
    for(const a of ANIMALS) bestCount = Math.max(bestCount, counts.get(a));
    const tied = ANIMALS.filter(a => counts.get(a) === bestCount);
    return bestCount > 0 ? randChoice(tied) : randChoice(ANIMALS);
  }

  function missionBombBlast(piece){
    const hit = new Set();
    for(const [x,y] of footprintCells(piece)){
      for(let dy=-1; dy<=1; dy++){
        for(let dx=-1; dx<=1; dx++){
          const nx = x + dx, ny = y + dy;
          if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
          hit.add(ny*COLS + nx);
        }
      }
    }

    const popped = [];
    for(const key of hit){
      const x = key % COLS;
      const y = Math.floor(key / COLS);
      if(board[y][x] !== TILE.EMPTY){
        popped.push([x,y,board[y][x]]);
        board[y][x] = TILE.EMPTY;
      }
      overlay[y][x] = POWER.NONE;
    }
    if(popped.length){
      spawnPopParticles(popped);
      banner.text = `Barn Buster popped ${popped.length} tiles.`;
      banner.t = performance.now();
      playTone({type:"sawtooth", f1:180, f2:50, dur:0.16, gain:0.18});
    }
  }

  function missionReapLargestGroup(){
    const best = findLargestAnimalGroup();
    if(!best) return;
    for(const [x,y] of best.cells){
      board[y][x] = TILE.EMPTY;
      overlay[y][x] = POWER.NONE;
    }
    spawnPopParticles(best.cells.map(([x,y]) => [x,y,best.animal]));
    banner.text = `Cull Comb clipped ${best.cells.length} ${TILE_LABEL[best.animal]}.`;
    banner.t = performance.now();
    playTone({type:"triangle", f1:620, f2:260, dur:0.14, gain:0.10});
  }

  function missionMorphPiece(piece){
    const animal = chooseLandingAnimal(piece);
    for(const [x,y] of footprintCells(piece)) board[y][x] = animal;
    banner.text = `Mystery Crate revealed ${TILE_LABEL[animal]}.`;
    banner.t = performance.now();
    playBarnyard(animal, 6);
  }

  function missionSeedOverlay(piece){
    const landAnimal = chooseLandingAnimal(piece);
    for(const [x,y] of footprintCells(piece)) board[y][x] = landAnimal;
    const candidates = [];
    for(const [x,y] of footprintCells(piece)){
      for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]]){
        const nx = x + dx, ny = y + dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        candidates.push([nx,ny]);
      }
    }
    shuffleInPlace(candidates);
    let eggs = 0, turds = 0;
    for(const [x,y] of candidates){
      if(overlay[y][x] !== POWER.NONE) continue;
      overlay[y][x] = eggs < 3 ? POWER.EGG : POWER.TURD;
      if(eggs < 3) eggs++;
      else if(++turds >= 2) break;
    }
    banner.text = `Nest Bomber left gifts. Some are rude.`;
    banner.t = performance.now();
    playTone({type:"square", f1:500, f2:200, dur:0.10, gain:0.07});
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

  function herdNeighborCount(x, y, animal){
    let count = 0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x + dx;
      const ny = y + dy;
      if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if(board[ny][nx] === animal) count++;
    }
    return count;
  }

  function applyHerdNudges(){
    const moves = [];
    for(let y=ROWS-1;y>=0;y--){
      for(let x=0;x<COLS;x++){
        const animal = board[y][x];
        if(!ANIMALS.includes(animal)) continue;
        if(y < ROWS-1 && board[y+1][x] === TILE.EMPTY) continue;

        const currentScore = herdNeighborCount(x, y, animal);
        let bestMove = null;

        for(const dir of [-1, 1]){
          const nx = x + dir;
          if(nx < 0 || nx >= COLS) continue;
          if(board[y][nx] !== TILE.EMPTY) continue;
          if(y < ROWS-1 && board[y+1][nx] === TILE.EMPTY) continue;
          const score = herdNeighborCount(nx, y, animal);
          if(score <= currentScore) continue;
          if(!bestMove || score > bestMove.score) bestMove = { fromX: x, toX: nx, y, score };
        }

        if(bestMove) moves.push(bestMove);
      }
    }

    if(!moves.length) return false;

    const claimed = new Set();
    for(const move of moves){
      const key = `${move.toX},${move.y}`;
      if(claimed.has(key)) continue;
      if(board[move.y][move.fromX] === TILE.EMPTY || board[move.y][move.toX] !== TILE.EMPTY) continue;
      board[move.y][move.toX] = board[move.y][move.fromX];
      board[move.y][move.fromX] = TILE.EMPTY;
      claimed.add(key);
    }
    return claimed.size > 0;
  }

  function boardSignature(){
    return board.map((row) => row.join(",")).join("|");
  }

  function stabilizeBoardAfterGravity(maxPasses=6){
    const seen = new Set();
    for(let pass=0; pass<maxPasses; pass++){
      const signature = boardSignature();
      if(seen.has(signature)) break;
      seen.add(signature);
      if(!applyHerdNudges()) break;
      applyGravity();
    }
  }

  function settleBoardNow(){
    applyGravity();
    stabilizeBoardAfterGravity();
  }

  function resolveBoard(){
    let cascadeDepth = 0;
    let totalGain = 0;
    let groupsCleared = 0;
    while(true){
      if(gameOver) break;
      const clears = findAnimalGroupsToClear();
      if(clears.length === 0) break;
      cascadeDepth++;

      for(const group of clears){
        const { animal, cells } = group;
        let gain = cells.length;

        if(cells.length >= 11){
          const bonusIndex = cells.length - 8; // 11->3 => fib(3)=2
          gain += fib(bonusIndex);
          bumpMission("big_group", 1);
        }

        let eggs=0, turds=0;
        for(const [x,y] of cells){
          if(overlay[y][x] === POWER.EGG) eggs++;
          if(overlay[y][x] === POWER.TURD) turds++;
        }
        if(eggs)  gain = Math.floor(gain * Math.pow(2, eggs));
        if(turds) gain = Math.max(1, Math.floor(gain / Math.pow(2, turds)));
        if(cascadeDepth > 1) gain += Math.floor(gain * 0.2 * (cascadeDepth - 1));
        score += gain;
        totalGain += gain;
        groupsCleared++;
        syncPassiveMissionProgress();

        for(const [x,y] of cells){
          board[y][x] = TILE.EMPTY;
          overlay[y][x] = POWER.NONE;
        }

        herdsCleared++;
        bumpMission("animal", { animal, amount: cells.length });
        bumpMission("clears", 1);
        if(gameOver) break;
        banner.text = `${cascadeDepth > 1 ? `Cascade ${cascadeDepth}! ` : ""}${quipForAnimal(animal)} Cleared ${cells.length} ${GROUP_NAME[animal]} blocks ${TILE_LABEL[animal]} +${gain}${eggs?` 🥚x${eggs}`:""}${turds?` 💩x${turds}`:""}`;
        banner.t = performance.now();

        spawnPopParticles(cells.map(([x,y]) => [x,y,animal]));
        playBarnyard(animal, cells.length);
        haptic(12);
      }

      settleBoardNow();
    }
    updateHUD();
    return { groupsCleared, totalGain };
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

  function applyChainResult(summary){
    if(!summary || summary.groupsCleared <= 0){
      currentCombo = 0;
      updateHUD();
      return;
    }
    currentCombo += summary.groupsCleared;
    bestCombo = Math.max(bestCombo, currentCombo);
    bumpMission("combo", currentCombo);
    showToast(`+${summary.totalGain} coins${currentCombo > 1 ? ` · ${fmtChain(currentCombo)} chain` : ""}`);
    updateHUD();
  }

  // ===== Locking =====
  function lockPiece(){
    if(current.kind === "WOLVES"){
      wolvesExplode(current);
      settleBoardNow();
      registerLockCycle();
      const summary = resolveBoard();
      applyChainResult(summary);
      if(!gameOver) spawnNext();
      return;
    }

    if(current.kind === "MISSION_BOMB"){
      missionBombBlast(current);
      settleBoardNow();
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      applyChainResult(summary);
      if(!gameOver) spawnNext();
      playLockTick();
      return;
    }

    if(current.kind === "MISSION_REAPER"){
      missionReapLargestGroup();
      settleBoardNow();
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      applyChainResult(summary);
      if(!gameOver) spawnNext();
      playLockTick();
      return;
    }

    if(current.kind === "MISSION_MORPH"){
      missionMorphPiece(current);
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      applyChainResult(summary);
      if(!gameOver) spawnNext();
      playLockTick();
      return;
    }

    if(current.kind === "MISSION_SEEDER"){
      missionSeedOverlay(current);
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      applyChainResult(summary);
      if(!gameOver) spawnNext();
      playLockTick();
      return;
    }

    if(current.kind === "MISSION_CASHOUT"){
      registerLockCycle({ skipCashout: true, skipMissionCharge: true });
      mission.done = true;
      score += mission.cashBonus;
      banner.text = `Mission earned! +${mission.cashBonus} coins hauled out of the barn.`;
      banner.t = performance.now();
      playMissionJingle();
      updateHUD();
      gameOverNow({
        title: "Mission Earned",
        note: `${mission.title} earned +${mission.cashBonus} coins after a very greedy run.`,
        playSound: false
      });
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

    const landedCells = footprintCells(current);
    const settleAnimal = current.kind === "BLACKSHEEP"
      ? board[landedCells[0]?.[1] ?? 0]?.[landedCells[0]?.[0] ?? 0] ?? pieceLeadAnimal(current)
      : pieceLeadAnimal(current);

    registerLockCycle();
    const summary = resolveBoard();
    applyChainResult(summary);
    if(!gameOver) spawnNext();
    if(settleAnimal && ANIMALS.includes(settleAnimal)) playBarnyard(settleAnimal, 4, "settle");
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
    rotateSlowUses = 4;
    rotateSlowUntil = 0;
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
      syncPassiveMissionProgress();
    }
    lockPiece();
    draw();
  }

  function triggerTouchRotateSlowdown(){
    if(!IS_TOUCH || rotateSlowUses <= 0) return;
    rotateSlowUses--;
    rotateSlowUntil = performance.now() + 1400;
  }

  function rotate(dirCW=true){
    if(paused || !current) return false;
    if(!current.rotates) return false;
    const test = dirCW ? rotateCW(current.matrix) : rotateCCW(current.matrix);
    for(const k of [0,-1,1,-2,2]){
      if(!collides(current, k, 0, test)){
        current.matrix = test;
        current.x += k;
        haptic(6);
        playRotateTick();
        draw();
        return true;
      }
    }
    draw();
    return false;
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
    const compact = isCompactUI();
    pad = compact ? 8 : 14;

    const mobileTapZoneHeight = compact && mobileTapZone ? Math.floor(90 * dpr) : 0;
    const topReserve = compact ? Math.floor(40 * dpr) : 0;
    const bottomReserve = compact ? Math.floor(8 * dpr) : 0;

    const targetW = Math.max(220, Math.floor(rect.width * dpr) - Math.floor((compact ? 2 : 8) * dpr));
    const targetH = Math.max(280, Math.floor(rect.height * dpr) - mobileTapZoneHeight - topReserve - bottomReserve - Math.floor((compact ? 2 : 8) * dpr));

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
    stageEl.style.setProperty("--cell-size-px", `${Math.max(12, Math.floor(cell / dpr))}px`);
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
    const specialMeta = SPECIAL_TILE_META[t];

    ctx.globalAlpha = 0.96;
    roundRectFill(gx+1, gy+1, cell-2, cell-2, 10, TILE_COLOR[t] || "#ddd");
    ctx.globalAlpha = 1;

    if(specialMeta){
      ctx.save();
      ctx.globalAlpha = 0.16;
      roundRectFill(gx+3, gy+3, cell-6, cell-6, 10, specialMeta.accent);
      ctx.globalAlpha = 0.92;
      ctx.strokeStyle = specialMeta.accent;
      ctx.lineWidth = Math.max(2, Math.floor(cell*0.08));
      roundRectStroke(gx+2, gy+2, cell-4, cell-4, 9);
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = Math.max(1, Math.floor(cell*0.05));
      ctx.beginPath();
      ctx.moveTo(gx + cell*0.18, gy + cell*0.76);
      ctx.lineTo(gx + cell*0.76, gy + cell*0.18);
      ctx.moveTo(gx + cell*0.24, gy + cell*0.9);
      ctx.lineTo(gx + cell*0.9, gy + cell*0.24);
      ctx.stroke();
      const badgeR = Math.max(7, cell*0.14);
      ctx.globalAlpha = 0.98;
      ctx.fillStyle = specialMeta.accent;
      ctx.beginPath();
      ctx.arc(gx + cell - badgeR - 4, gy + badgeR + 4, badgeR, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#101014";
      ctx.font = `900 ${Math.floor(cell*0.22)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(specialMeta.badge, gx + cell - badgeR - 4, gy + badgeR + 5);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = specialMeta ? specialMeta.accent : "#ffffff";
    ctx.lineWidth = Math.max(1, Math.floor(cell*(specialMeta ? 0.07 : 0.06)));
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
      const rotated = rotate(totalDx < 0 ? false : true); // up-left CCW, up-right/straight CW
      if(rotated) triggerTouchRotateSlowdown();
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
      const now = performance.now();
      const doubleTap = (now - lastTapTime) < 280 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 26;
      lastTapTime = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
      if(doubleTap){
        holdCurrent();
        gesture = null;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const mid = rect.left + rect.width/2;
      move(e.clientX < mid ? -1 : 1);
    }

    gesture = null;
  }

  function tapZoneSingleAction(clientX, rect){
    const rel = (clientX - rect.left) / Math.max(1, rect.width);
    if(rel < 0.34){
      move(-1);
      return;
    }
    if(rel > 0.66){
      move(1);
      return;
    }
    rotate(true);
  }

  function onTapZonePointerDown(e){
    e.preventDefault();
    unlockAudioSilently();
    tapZoneGesture = {
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      movedX: 0,
      movedY: 0,
      t0: performance.now()
    };
  }

  function onTapZonePointerMove(e){
    if(!IS_TOUCH || !tapZoneGesture) return;
    const dx = e.clientX - tapZoneGesture.lastX;
    tapZoneGesture.lastX = e.clientX;
    tapZoneGesture.movedX += dx;
    tapZoneGesture.movedY = e.clientY - tapZoneGesture.startY;
    while(tapZoneGesture.movedX <= -STEP_X){ move(-1); tapZoneGesture.movedX += STEP_X; }
    while(tapZoneGesture.movedX >=  STEP_X){ move( 1); tapZoneGesture.movedX -= STEP_X; }
  }

  function onTapZonePointerUp(e){
    e.preventDefault();
    if(!tapZoneGesture) return;
    const dt = performance.now() - tapZoneGesture.t0;
    const dist = Math.hypot(e.clientX - tapZoneGesture.startX, e.clientY - tapZoneGesture.startY);
    if(dt < 280 && dist < 12){
      const now = performance.now();
      const doubleTap = (now - lastTapTime) < 300 && Math.hypot(e.clientX - lastTapX, e.clientY - lastTapY) < 32;
      lastTapTime = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
      if(doubleTap){
        hardDrop();
        tapZoneGesture = null;
        return;
      }
      tapZoneSingleAction(e.clientX, mobileTapZone.getBoundingClientRect());
    }
    tapZoneGesture = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown, {passive:false});
  canvas.addEventListener("pointermove", onPointerMove, {passive:true});
  canvas.addEventListener("pointerup",   onPointerUp,   {passive:false});
  canvas.addEventListener("pointercancel", () => { gesture = null; });
  if(mobileTapZone){
    mobileTapZone.addEventListener("pointerdown", onTapZonePointerDown, {passive:false});
    mobileTapZone.addEventListener("pointermove", onTapZonePointerMove, {passive:true});
    mobileTapZone.addEventListener("pointerup", onTapZonePointerUp, {passive:false});
    mobileTapZone.addEventListener("pointercancel", () => { tapZoneGesture = null; });
  }
  window.addEventListener("pointerdown", unlockAudioSilently, {passive:true});
  window.addEventListener("touchstart", unlockAudioSilently, {passive:true});
  window.addEventListener("click", unlockAudioSilently, {passive:true});
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

  // ===== Tighten the on-page help line without touching the rest of the app =====
  function patchHelpLine(){
    const helpPrimary = document.querySelector("#help > div:first-child");
    if(!helpPrimary) return;
    helpPrimary.innerHTML = "<b>Touch:</b> swipe ←/→ move · ↓ drop · ↑ rotate/slows briefly · double-tap hold";
  }

  // ===== Settings toggle (simple) =====
  function syncSoundBtn(){
    if(soundToggle) soundToggle.textContent = soundOn ? "ON" : "OFF";
  }
  if(gear){
    gear.addEventListener("click", openSettings);
  }
  if(helpButton){
    helpButton.addEventListener("click", openHelp);
  }
  if(closeModal){
    closeModal.addEventListener("click", closeSettings);
  }
  if(closeHelpButton){
    closeHelpButton.addEventListener("click", closeHelp);
  }
  if(modalBackdrop){
    modalBackdrop.addEventListener("click", (e) => {
      if(e.target === modalBackdrop) closeSettings();
    });
  }
  if(helpBackdrop){
    helpBackdrop.addEventListener("click", (e) => {
      if(e.target === helpBackdrop) closeHelp();
    });
  }
  if(restartButton){
    restartButton.addEventListener("click", () => {
      setOverlayOpen(gameOverBackdrop, false);
      restart();
    });
  }
  if(missionStartButton){
    missionStartButton.addEventListener("click", closeMissionBriefing);
  }
  if(holdButton){
    holdButton.addEventListener("click", holdCurrent);
  }
  if(soundToggle){
    const onTap = (e) => {
      e.preventDefault();
      soundOn = !soundOn;
      saveSoundPref();
      syncMasterGain();
      if(soundOn){
        unlockAudioSilently();
        setTimeout(() => {
          playRotateTick();
          playMoveTick();
        }, 90);
      }
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

    const activeFallInterval = now < rotateSlowUntil ? Math.floor(fallInterval * 1.8) : fallInterval;
    if(fallTimer >= activeFallInterval){
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
    mission = newMission();
    missionSpecialCharge = 0;
    missionSpecialPending = false;
    cashoutCharge = 0;
    runEndTitle = "Run Over";
    runEndNote = "The barn got crowded.";
    score=0; level=1; locks=0; herdsCleared=0;
    held=null; currentCombo=0; bestCombo=0; holdUsed=false;
    fallInterval = BASE_FALL_MS;
    fallTimer = 0;
    rotateSlowUntil = 0;
    rotateSlowUses = 4;
    lastTapTime = 0;
    ambienceClock = 0;
    paused=false; gameOver=false;
    current=null; next=null;
    particles=[]; banner={text:"",t:0,ttl:900};
    setOverlayOpen(modalBackdrop, false);
    setOverlayOpen(gameOverBackdrop, false);
    setOverlayOpen(missionBriefBackdrop, false);
    next = newPiece();
    spawnNext();
    updateHUD();
    openMissionBriefing();
    draw();
  }

  // ===== Init =====
  function init(){
    injectViewportCSS();
    patchHelpLine();
    installToastObserver();
    ensureAudio();
    syncMasterGain();

    sprinkleOverlayGeometric();
    mission = newMission();
    missionSpecialCharge = 0;
    missionSpecialPending = false;
    cashoutCharge = 0;

    next = newPiece();
    spawnNext();

    updateHUD();
    syncSoundBtn();
    updateGameOverStats();
    openMissionBriefing();

    fitCanvasToViewport();
    const ro = new ResizeObserver(() => fitCanvasToViewport());
    ro.observe(stageEl);

    window.addEventListener("resize", fitCanvasToViewport, {passive:true});
    if(window.visualViewport){
      window.visualViewport.addEventListener("resize", fitCanvasToViewport, {passive:true});
      window.visualViewport.addEventListener("scroll", fitCanvasToViewport, {passive:true});
    }

    requestAnimationFrame(tick);
  }

  init();
})();
