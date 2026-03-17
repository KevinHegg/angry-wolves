(() => {
  // =========================
  // Angry Wolves — game.js
  // Tap left/right halves = move
  // Swipe up = rotate
  // Press and hold = hold
  // =========================

  // ===== Config =====
  const COLS = 10;
  const ROWS = 13;                 // bigger tiles (reduced rows)
  const CLEAR_THRESHOLD = 10;
  const BIG_GROUP_THRESHOLD = 13;

  const BASE_FALL_MS = 650;
  const MIN_FALL_MS  = 120;
  const LEVEL_EVERY_LOCKS = 12;

  // movement while finger moves
  const STEP_X = 22;
  const STEP_Y = 22;

  // rotate gesture
  const SWIPE_UP_MIN = 26;
  const UP_DOMINANCE = 1.08;
  const HOLD_TOUCH_MS = 320;
  const HOLD_MOVE_CANCEL = 12;
  const DOUBLE_TAP_MS = 260;
  const DOUBLE_TAP_SLOP = 28;
  const ROTATE_ANGLE_MAX = 30;
  const ROTATE_INTENT_ANGLE = 42;
  const ROTATE_SIDE_MIN = 4;
  const BOARD_CLEAR_ANIM_MS = 180;
  const BOARD_CONVERT_ANIM_MS = 220;
  const BOARD_FALL_ANIM_MS = 210;

  // special spawn weights
  const WEIGHT_NORMAL = 0.88;
  const WEIGHT_BLACKSHEEP = 0.08;
  const WEIGHT_WOLVES = 0.04;

  // background overlay counts (sparse + more eggs than poop)
  const EGGS_COUNT  = 8;
  const TURDS_COUNT = 5;
  const REWARD_COUNTDOWN_START = 10;

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
    SEEDER_EGG: 13,
    SEEDER_TURD: 14,
    BRAND: 15,
    FEED: 16,
    WOOL: 17,
    CHEESE: 18,
    PRODUCE_EGG: 19,
    MILK: 20,
    FOOTBALL: 21,
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
    [TILE.CASHOUT]: "✦",
    [TILE.SEEDER_EGG]: "🥚",
    [TILE.SEEDER_TURD]: "💩",
    [TILE.BRAND]: "🧲",
    [TILE.FEED]: "🌾",
    [TILE.WOOL]: "🧶",
    [TILE.CHEESE]: "🧀",
    [TILE.PRODUCE_EGG]: "🥚",
    [TILE.MILK]: "🥛",
    [TILE.FOOTBALL]: "🏈",
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
    [TILE.SEEDER_EGG]: "#f6d54a",
    [TILE.SEEDER_TURD]: "#e08c6a",
    [TILE.BRAND]: "#c2afff",
    [TILE.FEED]: "#9edb8c",
    [TILE.WOOL]: "#d8cbff",
    [TILE.CHEESE]: "#ffd76f",
    [TILE.PRODUCE_EGG]: "#fff0a6",
    [TILE.MILK]: "#d8efff",
    [TILE.FOOTBALL]: "#d39a66",
  };

  const SPECIAL_TILE_META = {
    [TILE.WOLF]: { accent: "#d7dfef", badge: "🐺" },
    [TILE.BLACK_SHEEP]: { accent: "#8ee6ff", badge: "↺" },
    [TILE.BOMB]: { accent: "#ffc29d", badge: "💣" },
    [TILE.REAPER]: { accent: "#9cf5df", badge: "✂" },
    [TILE.MORPH]: { accent: "#b8c9ff", badge: "?" },
    [TILE.SEEDER]: { accent: "#fff0a6", badge: "+" },
    [TILE.CASHOUT]: { accent: "#f6dc88", badge: "¤" },
    [TILE.SEEDER_EGG]: { accent: "#fff0a6", badge: "+" },
    [TILE.SEEDER_TURD]: { accent: "#fff0a6", badge: "+" },
    [TILE.BRAND]: { accent: "#d3bcff", badge: "↔" },
    [TILE.FEED]: { accent: "#b8f2a8", badge: "✦" }
  };

  const GROUP_NAME = {
    [TILE.SHEEP]: "flock",
    [TILE.GOAT]: "trip",
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

  const PRODUCT_INFO = {
    [TILE.SHEEP]:   { tile: TILE.WOOL, noun: "wool bundle", plural: "wool bundles", title: "Wool Patrol", specialTitle: "Wool Wagon" },
    [TILE.GOAT]:    { tile: TILE.CHEESE, noun: "cheese wedge", plural: "cheese wedges", title: "Cheese Chase", specialTitle: "Cheese Cart" },
    [TILE.CHICKEN]: { tile: TILE.PRODUCE_EGG, noun: "egg crate", plural: "egg crates", title: "Egg Run", specialTitle: "Egg Basket" },
    [TILE.COW]:     { tile: TILE.MILK, noun: "milk bottle", plural: "milk bottles", title: "Milk Run", specialTitle: "Milk Crate" },
    [TILE.PIG]:     { tile: TILE.FOOTBALL, noun: "football", plural: "footballs", title: "Pigskin Parade", specialTitle: "Pigskin Crate" },
  };

  const MISSION_TILES = new Set([
    TILE.BOMB,
    TILE.REAPER,
    TILE.MORPH,
    TILE.SEEDER,
    TILE.CASHOUT,
    TILE.SEEDER_EGG,
    TILE.SEEDER_TURD,
    TILE.BRAND,
    TILE.FEED,
    TILE.WOOL,
    TILE.CHEESE,
    TILE.PRODUCE_EGG,
    TILE.MILK,
    TILE.FOOTBALL,
  ]);

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
    BOMB_T:       { matrix:[[1,1],[1,1]], tile:TILE.BOMB, rotates:false },
    REAPER_I:     { matrix:[[1,1,1,1]], tile:TILE.REAPER, rotates:true },
    MORPH_L:      { matrix:[[1,0,0],[1,1,1],[0,0,0]], tile:TILE.MORPH, rotates:true },
    SEEDER_S:     { matrix:[[0,1,1],[1,1,0],[0,0,0]], tile:TILE.SEEDER, rotates:true },
    BRAND_T:      { matrix:[[1,1,1],[0,1,0],[0,0,0]], tile:TILE.BRAND, rotates:true },
    FEED_L:       { matrix:[[1,0,0],[1,1,1],[0,0,0]], tile:TILE.FEED, rotates:true },
    PRODUCE_O:    { matrix:[[1,1],[1,1]], rotates:false },
    CASHOUT_1:    { matrix:[[1]], tile:TILE.CASHOUT, rotates:false }
  };

  // ===== DOM =====
  const stageEl = document.getElementById("stage");
  const hudEl = document.getElementById("hud");
  const stageMissionBarEl = document.getElementById("stageMissionBar");
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  const scoreEl  = document.getElementById("score");
  const levelEl  = document.getElementById("level");
  const clearsEl = document.getElementById("clears");
  const comboEl = document.getElementById("combo");
  const comboBestEl = document.getElementById("comboBest");
  const nextPreviewEl = document.getElementById("nextPreview");
  const holdPreviewEl = document.getElementById("holdPreview");
  const holdButton = document.getElementById("holdButton");
  const missionTitleEl = document.getElementById("missionTitle");
  const missionProgressEl = document.getElementById("missionProgress");
  const missionMeterEl = document.getElementById("missionMeter");
  const missionMeterFillEl = document.getElementById("missionMeterFill");
  const missionMeterLabelEl = document.getElementById("missionMeterLabel");
  const stageMissionTitleEl = document.getElementById("stageMissionTitle");
  const stageMissionProgressTextEl = document.getElementById("stageMissionProgressText");
  const stageMissionMeterEl = document.querySelector(".stageMissionMeter");
  const stageMissionMeterFillEl = document.getElementById("stageMissionMeterFill");
  const stageMissionMeterLabelEl = document.getElementById("stageMissionMeterLabel");
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
  const shareButton = document.getElementById("shareButton");
  const closeGameOverButton = document.getElementById("closeGameOverButton");
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
  const helpGeneralSpecialsEl = document.getElementById("helpGeneralSpecials");
  const helpMissionSpecialsEl = document.getElementById("helpMissionSpecials");
  const toastEl = document.getElementById("toast");
  const finalScoreEl = document.getElementById("finalScore");
  const finalLevelEl = document.getElementById("finalLevel");
  const finalClearsEl = document.getElementById("finalClears");
  const finalBestEl = document.getElementById("finalBest");
  const finalComboEl = document.getElementById("finalCombo");
  const stageRunActionsEl = document.getElementById("stageRunActions");
  const stageStartButton = document.getElementById("stageStartButton");
  const stageResultsButton = document.getElementById("stageResultsButton");

  // ===== State =====
  let board = makeBoard();
  let overlay = makeOverlay();
  let rewardMap = makeRewardMap();
  let productMap = makeProductMap();
  let nextProductToken = 1;
  let productTokenInfo = new Map();

  let current = null;
  let next = null;
  let held = null;

  let score = 0;
  let level = 1;
  let locks = 0;
  let herdsCleared = 0;
  let currentCombo = 0;
  let bestCombo = 0;
  let bestHerd = null;
  let holdUsed = false;
  let mission = null;
  let runEndTitle = "Run Over";
  let runEndNote = "The barn got crowded.";
  let missionSpecialCharge = 0;
  let missionSpecialPending = false;
  let queuedMissionSpecial = null;
  let cashoutCharge = 0;
  let rewardCountdown = null;

  let fallTimer = 0;
  let fallInterval = BASE_FALL_MS;
  let rotateSlowUntil = 0;
  let rotateSlowUses = 4;
  let paused = false;
  let gameOver = false;
  let modalOpenCount = 0;
  let lastFrameTime = 0;

  // render metrics
  let W=0, H=0, cell=0;
  let pad = 14;

  // particles
  let particles = [];
  let boardAnimations = [];
  let banner = { text:"", t:0, ttl: 900 };
  let toastTimer = 0;
  let shareSnapshot = null;
  let lastMissionMeterAudio = null;
  let pendingTap = null;

  // touch tracking
  const IS_TOUCH = (("ontouchstart" in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
  let gesture = null;
  let holdTouchTimer = null;

  const CLEAR_QUIPS = {
    [TILE.SHEEP]: ["Wool done.", "That flock got absolutely sheepish.", "The meadow trembles."],
    [TILE.GOAT]: ["Goat chaos unlocked.", "That trip just ate the leaderboard.", "Pure cliff-certified nonsense."],
    [TILE.CHICKEN]: ["Hen-demonium.", "Certified coop catastrophe.", "Somebody alert the rooster union."],
    [TILE.COW]: ["Udderly excessive.", "The dairy lobby is furious.", "That was a premium moo-ve."],
    [TILE.PIG]: ["Hog wild.", "That sty just went full goblin mode.", "Oink if you love combos."]
  };

  const SPECIAL_RULES = {
    bomb: {
      title: "Barn Buster",
      desc: "On average, a bomb tetrad barges in about every 5 settles. It detonates nearby settled tiles.",
      short: "Surprise bomb tetrad, about every 5 settles on average.",
      every: 5,
      tile: TILE.BOMB
    },
    reaper: {
      title: "Cull Comb",
      desc: "On average, a scissor tetrad barges in about every 5 settles. It deletes the biggest animal group on the board, then turns into the touching animal so you can place it usefully.",
      short: "Surprise scissor tetrad, about every 5 settles on average.",
      every: 5,
      tile: TILE.REAPER
    },
    morph: {
      title: "Mystery Crate",
      desc: "On average, a question-mark tetrad barges in about every 4 settles. It becomes whatever animal touches it first.",
      short: "Surprise mystery tetrad, about every 4 settles on average.",
      every: 4,
      tile: TILE.MORPH
    },
    seeder: {
      title: "Nest Bomber",
      desc: "On average, a nest tetrad barges in about every 5 settles. Its cells are a random mix of eggs and turds, and it seeds that same mess around its landing zone.",
      short: "Surprise nest tetrad, about every 5 settles on average.",
      every: 5,
      tile: TILE.SEEDER
    },
    brand: {
      title: "Branding Iron",
      desc: "On average, a branding tetrad barges in about every 5 settles. It becomes the touched animal and converts nearby animals to match, helping build a big group fast.",
      short: "Surprise branding tetrad, about every 5 settles on average.",
      every: 5,
      tile: TILE.BRAND
    },
    feed: {
      title: "Feed Wagon",
      desc: "On average, a feed tetrad barges in about every 5 settles. It becomes the touched animal and scatters only eggs around itself.",
      short: "Surprise feed tetrad, about every 5 settles on average.",
      every: 5,
      tile: TILE.FEED
    },
    produce: {
      title: "Barn Goods",
      desc: "On average, a product tetrad barges in about every 5 settles. Land it on the right producer to tag that group and leave an egg behind. Miss and it leaves a turd before joining whatever it touched.",
      short: "Surprise product tetrad, about every 5 settles on average.",
      every: 5,
      tile: TILE.WOOL
    }
  };

  const MISSION_DEFS = [
    { id:"sheep_roundup", type:"animal", animal:TILE.SHEEP, target:17, bonus:145, special:"bomb", title:"Sheep Sweep" },
    { id:"goat_roundup", type:"animal", animal:TILE.GOAT, target:17, bonus:145, special:"morph", title:"Goat Evac" },
    { id:"chicken_roundup", type:"animal", animal:TILE.CHICKEN, target:18, bonus:150, special:"seeder", title:"Coop Cleanup" },
    { id:"cow_roundup", type:"animal", animal:TILE.COW, target:16, bonus:150, special:"reaper", title:"Moo Move" },
    { id:"pig_roundup", type:"animal", animal:TILE.PIG, target:18, bonus:150, special:"bomb", title:"Hog Panic" },
    { id:"clear_four", type:"clears", target:4, bonus:180, special:"bomb", title:"Quad Clear" },
    { id:"combo_three", type:"combo", target:4, bonus:215, special:"morph", title:"Chain Fever" },
    { id:"wolf_twice", type:"wolf", target:2, bonus:240, special:"bomb", title:"Wolf Rampage" },
    { id:"score_320", type:"score", target:380, bonus:210, special:"reaper", title:"Sunrise Scramble" },
    { id:"build_ten", type:"build_group", target:12, bonus:210, special:"brand", title:"Barn Weave" },
    { id:"feed_three", type:"clears", target:4, bonus:175, special:"feed", title:"Feed Rush" },
    { id:"wool_patrol", type:"product", animal:TILE.SHEEP, target:2, bonus:175, special:"produce", title:"Wool Patrol" },
    { id:"cheese_chase", type:"product", animal:TILE.GOAT, target:2, bonus:175, special:"produce", title:"Cheese Chase" },
    { id:"egg_run", type:"product", animal:TILE.CHICKEN, target:2, bonus:170, special:"produce", title:"Egg Run" },
    { id:"milk_run", type:"product", animal:TILE.COW, target:2, bonus:180, special:"produce", title:"Milk Run" },
    { id:"pigskin_parade", type:"product", animal:TILE.PIG, target:2, bonus:175, special:"produce", title:"Pigskin Parade" }
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
    const heft = clamp(size / 18, 0, 1);

    if(!isBig){
      const shape = 0.05;
      const gainBoost = 0.58;
      if(animal === TILE.COW){
        playTone({type:"sawtooth", f1:170, f2:115, dur:0.10 + shape, gain:0.12 * gainBoost});
        playTone({type:"sine", f1:120, f2:90, dur:0.11 + shape, gain:0.08 * gainBoost});
      } else if(animal === TILE.PIG){
        playTone({type:"square", f1:255, f2:170, dur:0.08 + shape, gain:0.11 * gainBoost});
        playTone({type:"square", f1:205, f2:145, dur:0.07 + shape, gain:0.08 * gainBoost});
      } else if(animal === TILE.SHEEP){
        playTone({type:"triangle", f1:470, f2:360, dur:0.09 + shape, gain:0.09 * gainBoost});
      } else if(animal === TILE.GOAT){
        playTone({type:"triangle", f1:360, f2:240, dur:0.09 + shape, gain:0.09 * gainBoost});
        playTone({type:"sine", f1:320, f2:210, dur:0.08 + shape, gain:0.06 * gainBoost});
      } else if(animal === TILE.CHICKEN){
        playTone({noise:true, dur:0.045 + shape, gain:0.07 * gainBoost});
        playTone({type:"square", f1:680, f2:560, dur:0.05 + shape, gain:0.07 * gainBoost});
      } else {
        playTone({type:"sine", f1:280, f2:180, dur:0.08 + shape, gain:0.06 * gainBoost});
      }
      return;
    }

    if(animal === TILE.COW){
      playTone({type:"sawtooth", f1:156, f2:94, dur:0.18 + heft * 0.05, gain:0.14});
      playTone({type:"sine", f1:102, f2:62, dur:0.22 + heft * 0.06, gain:0.11});
      playJingle([
        { f: 132, d: 0.11, g: 0.05, type: "triangle" },
        { f: 96, d: 0.16, g: 0.05, type: "triangle" }
      ], { step:0.09 });
    } else if(animal === TILE.PIG){
      playJingle([
        { f: 278, d: 0.06, g: 0.08, type: "square" },
        { f: 220, d: 0.05, g: 0.07, type: "square" },
        { f: 250, d: 0.06, g: 0.08, type: "square" }
      ], { step:0.05 });
      playTone({type:"triangle", f1:210, f2:136, dur:0.11 + heft * 0.03, gain:0.05});
    } else if(animal === TILE.SHEEP){
      playJingle([
        { f: 430, d: 0.10, g: 0.07, type: "triangle" },
        { f: 318, d: 0.14, g: 0.07, type: "triangle" }
      ], { step:0.07 });
      playTone({type:"sine", f1:360, f2:250, dur:0.16 + heft * 0.04, gain:0.05});
    } else if(animal === TILE.GOAT){
      playJingle([
        { f: 340, d: 0.08, g: 0.07, type: "triangle" },
        { f: 270, d: 0.10, g: 0.07, type: "triangle" },
        { f: 320, d: 0.08, g: 0.06, type: "sine" }
      ], { step:0.055 });
    } else if(animal === TILE.CHICKEN){
      playTone({noise:true, dur:0.07 + heft * 0.02, gain:0.08});
      playJingle([
        { f: 880, d: 0.05, g: 0.06, type: "square" },
        { f: 760, d: 0.05, g: 0.06, type: "square" },
        { f: 930, d: 0.04, g: 0.05, type: "triangle" }
      ], { step:0.045 });
    } else {
      playTone({type:"sine", f1:240, f2:120, dur:0.12 + heft * 0.04, gain:0.10});
    }
  }

  function playLevelUpJingle(){
    playJingle([392, 494, 587, 784], { step:0.075, type:"square", gain:0.07 });
  }

  function playMissionJingle(){
    playJingle([523, 659, 784, 988], { step:0.07, type:"triangle", gain:0.08 });
  }

  function playMissionMeterPulse(ratio, delta=1){
    const urgency = clamp(ratio, 0, 1);
    const notes = [];
    const count = delta >= 2 || urgency > 0.72 ? 2 : 1;
    const base = 260 + urgency * 360;
    const step = 0.08 - urgency * 0.03;
    const noteType = urgency > 0.78 ? "square" : "triangle";
    for(let i=0;i<count;i++){
      notes.push({
        f: base + i * (40 + urgency * 55),
        d: 0.065 - urgency * 0.018,
        g: 0.04 + urgency * 0.022,
        type: noteType
      });
    }
    playJingle(notes, { step, type: noteType, gain: 0.05 });
  }

  function playRewardCountdownStart(){
    playJingle([
      { f: 620, d: 0.07, g: 0.05, type: "triangle" },
      { f: 520, d: 0.08, g: 0.055, type: "square" }
    ], { step: 0.065, type: "square", gain: 0.055 });
  }

  function playRewardCountdownPulse(remaining){
    const urgency = 1 - clamp(remaining / REWARD_COUNTDOWN_START, 0, 1);
    const notes = [];
    const count = remaining <= 3 ? 3 : remaining <= 6 ? 2 : 1;
    const base = 360 + urgency * 360;
    const step = 0.095 - urgency * 0.04;
    for(let i=0;i<count;i++){
      notes.push({
        f: base + i * (24 + urgency * 30),
        d: 0.06 - urgency * 0.012,
        g: 0.042 + urgency * 0.026,
        type: "square"
      });
    }
    playJingle(notes, { step, type: "square", gain: 0.06 });
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
    } else if(piece?.kind === "MISSION_BRAND"){
      playJingle([392, 494, 440], { step:0.05, type:"triangle", gain:0.04 });
    } else if(piece?.kind === "MISSION_FEED"){
      playJingle([330, 392, 523], { step:0.06, type:"triangle", gain:0.04 });
    } else if(piece?.kind === "MISSION_PRODUCE"){
      playJingle([392, 523, 659], { step:0.05, type:"square", gain:0.04 });
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
  function makeRewardMap(){ return Array.from({length: ROWS}, () => Array(COLS).fill(false)); }
  function makeProductMap(){ return Array.from({length: ROWS}, () => Array(COLS).fill(0)); }
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function clone2(m){ return m.map(r => r.slice()); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function fmtChain(v){ return `x${Math.max(0, v|0)}`; }
  function missionProgressText(value, target){ return `${Math.min(value, target)} / ${target}`; }
  function quipForAnimal(animal){ return randChoice(CLEAR_QUIPS[animal] || ["Barnyard bedlam."]); }
  function specialJoinRateLabel(rule){
    return rule ? `About every ${rule.every} settles on average` : "";
  }
  function productInfoForAnimal(animal){
    return PRODUCT_INFO[animal] || PRODUCT_INFO[TILE.SHEEP];
  }
  function animalWord(animal){
    return ANIMAL_NAME[animal] || "animals";
  }
  function bestHerdSummary(best){
    if(!best) return "-";
    return `${best.count} ${TILE_LABEL[best.animal]} (${GROUP_NAME[best.animal] || "group"}) · <span class="coinInline small" aria-hidden="true"></span> x ${best.gain}`;
  }
  function bestGroupPlain(best){
    if(!best) return "No big groups yet";
    return `${best.count} ${TILE_LABEL[best.animal]} (${GROUP_NAME[best.animal] || "group"}) · coin x ${best.gain}`;
  }
  function shareUrl(){
    return "https://kevinhegg.github.io/angry-wolves/";
  }
  function shareBragLine(){
    const missionName = mission?.title ?? shareSnapshot?.missionTitle ?? "Barn Trouble";
    const missionBonus = mission && mission.done ? mission.cashBonus : 0;
    const groupScore = Math.max(0, score|0);
    const totalScore = groupScore + missionBonus;
    if(mission?.done){
      return `I beat ${missionName} in Angry Wolves for ${totalScore} coins.`;
    }
    if(bestCombo >= 3){
      return `I kicked up a ${fmtChain(bestCombo)} chain in Angry Wolves and still hauled in ${totalScore} coins.`;
    }
    if(bestHerd){
      return `I built a ${bestHerd.count}-${GROUP_NAME[bestHerd.animal] || "group"} in Angry Wolves for ${totalScore} coins.`;
    }
    return `I stirred up the barn in Angry Wolves for ${totalScore} coins.`;
  }
  function captureShareSnapshot(){
    return {
      board: clone2(board),
      overlay: clone2(overlay),
      rewardMap: clone2(rewardMap),
      productMap: clone2(productMap),
      productTokenInfo: new Map(Array.from(productTokenInfo.entries(), ([token, info]) => [token, { ...info }])),
      missionTitle: mission?.title ?? "Barn Trouble"
    };
  }
  function rememberShareSnapshot(snapshot=captureShareSnapshot()){
    shareSnapshot = snapshot;
  }
  function compactMissionProgress(){
    if(!mission) return "Start dropping";
    if(mission.done) return `+${mission.cashBonus} earned`;
    if(mission.ready){
      if(hasRewardCoinOnBoard()) return rewardCountdownLabel();
      return `Coin in ${Math.max(0, missionCashoutEvery() - cashoutCharge)} settles`;
    }
    if(mission.type === "animal") return `${missionProgressText(mission.progress, mission.target)} ${animalWord(mission.animal)}`;
    if(mission.type === "clears") return `${missionProgressText(mission.progress, mission.target)} clears`;
    if(mission.type === "combo") return `${fmtChain(bestCombo)} best`;
    if(mission.type === "wolf") return `${missionProgressText(mission.progress, mission.target)} wolves`;
    if(mission.type === "score") return `${missionProgressText(score, mission.target)} coins`;
    if(mission.type === "level") return `Lv ${level}/${mission.target}`;
    if(mission.type === "big_group") return `${missionProgressText(mission.progress, mission.target)} jumbo`;
    if(mission.type === "product") return `${missionProgressText(mission.progress, mission.target)} ${productInfoForAnimal(mission.animal).plural}`;
    if(mission.type === "build_group") return `${missionCurrentProgress()} live`;
    if(mission.type === "special_use") return `${missionProgressText(mission.progress, mission.target)} specials`;
    if(mission.type === "locks") return `${missionProgressText(locks, mission.target)} settles`;
    return `${missionProgressText(mission.progress, mission.target)}`;
  }
  function hasRewardCoinOnBoard(){
    return rewardMap.some((row) => row.some(Boolean));
  }
  function clearRewardMap(){
    rewardMap = makeRewardMap();
  }
  function rewardCountdownValue(){
    return Number.isFinite(rewardCountdown) ? rewardCountdown : REWARD_COUNTDOWN_START;
  }
  function rewardCountdownLabel(){
    const value = rewardCountdownValue();
    return `${value} settle${value === 1 ? "" : "s"} left`;
  }
  function syncMissionMeterCountdownUI(active){
    if(missionMeterEl) missionMeterEl.classList.toggle("countdownMode", active);
    if(stageMissionMeterEl) stageMissionMeterEl.classList.toggle("countdownMode", active);
    if(missionMeterLabelEl) missionMeterLabelEl.textContent = active ? rewardCountdownLabel() : "";
    if(stageMissionMeterLabelEl) stageMissionMeterLabelEl.textContent = active ? rewardCountdownLabel() : "";
  }
  function missionCashoutObjectiveCopy(){
    return `After that, a reward coin barges in every ${missionCashoutEvery()} settles until one lands. Once it lands, you get ${REWARD_COUNTDOWN_START} settles to clear its pulsing group or the run ends.`;
  }
  function missionCurrentProgress(){
    if(!mission) return 0;
    if(mission.type === "score") return score;
    if(mission.type === "level") return level;
    if(mission.type === "locks") return locks;
    if(mission.type === "build_group"){
      return findLargestAnimalGroup()?.cells.length || 0;
    }
    return mission.progress ?? 0;
  }
  function missionProgressRatio(){
    if(!mission) return 0;
    if(mission.done) return 1;
    if(mission.ready && hasRewardCoinOnBoard()){
      return clamp(rewardCountdownValue() / REWARD_COUNTDOWN_START, 0, 1);
    }
    if(mission.ready) return 1;
    return clamp(missionCurrentProgress() / Math.max(1, mission.target), 0, 1);
  }
  function missionMeterAudioState(){
    if(!mission) return { key:"idle", mode:"idle", step:0, ratio:0 };
    if(mission.done) return { key:"done", mode:"done", step:0, ratio:1 };
    if(mission.ready && hasRewardCoinOnBoard()){
      const remaining = rewardCountdownValue();
      return {
        key:`countdown:${remaining}`,
        mode:"countdown",
        step: remaining,
        ratio: clamp(remaining / REWARD_COUNTDOWN_START, 0, 1)
      };
    }
    if(mission.ready){
      return { key:`ready:${cashoutCharge}`, mode:"ready", step:cashoutCharge, ratio:1 };
    }
    const progress = Math.min(missionCurrentProgress(), mission.target);
    return {
      key:`progress:${progress}`,
      mode:"progress",
      step: progress,
      ratio: clamp(progress / Math.max(1, mission.target), 0, 1)
    };
  }
  function syncMissionMeterAudio(){
    const nextState = missionMeterAudioState();
    if(!lastMissionMeterAudio){
      lastMissionMeterAudio = nextState;
      return;
    }
    const prevState = lastMissionMeterAudio;
    if(nextState.key === prevState.key) return;
    lastMissionMeterAudio = nextState;
    if(gameOver) return;
    if(nextState.mode === "progress" && prevState.mode === "progress" && nextState.step > prevState.step){
      playMissionMeterPulse(nextState.ratio, nextState.step - prevState.step);
      return;
    }
    if(nextState.mode === "countdown" && prevState.mode === "countdown" && nextState.step < prevState.step){
      playRewardCountdownPulse(nextState.step);
      return;
    }
    if(nextState.mode === "countdown" && prevState.mode !== "countdown"){
      playRewardCountdownStart();
    }
  }
  function showToast(text, ms=1050){
    if(!toastEl) return;
    if(toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = text;
    toastEl.classList.remove("toastLive");
    void toastEl.offsetWidth;
    toastEl.classList.remove("hidden");
    toastEl.classList.add("toastLive");
    toastTimer = window.setTimeout(() => {
      toastEl.classList.add("hidden");
      toastEl.classList.remove("toastLive");
      toastTimer = 0;
    }, ms);
  }
  function isMissionSpecialPiece(piece){
    return !!piece && [
      "MISSION_BOMB",
      "MISSION_REAPER",
      "MISSION_MORPH",
      "MISSION_SEEDER",
      "MISSION_BRAND",
      "MISSION_FEED",
      "MISSION_PRODUCE",
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

  function createSeederMatrix({ randomize=false } = {}){
    const shape = SPECIAL.SEEDER_S.matrix;
    const active = [];
    for(let r=0;r<shape.length;r++){
      for(let c=0;c<shape[r].length;c++){
        if(shape[r][c]) active.push([r,c]);
      }
    }
    const out = shape.map((row) => row.map(() => 0));
    let eggCount = 2;
    if(randomize){
      eggCount = 1 + Math.floor(Math.random() * (active.length - 1));
    }
    const picks = active.slice();
    shuffleInPlace(picks);
    const eggSet = new Set(picks.slice(0, eggCount).map(([r,c]) => `${r},${c}`));
    for(const [r,c] of active){
      out[r][c] = eggSet.has(`${r},${c}`) ? TILE.SEEDER_EGG : TILE.SEEDER_TURD;
    }
    return out;
  }

  function createMissionSpecialPiece(opts={}){
    const { forSpawn = false } = opts;
    if(!mission) return null;
    if(mission.special === "bomb"){
      return { kind:"MISSION_BOMB", x: Math.floor(COLS/2)-1, y:0, matrix: materializeSpecMatrix(SPECIAL.BOMB_T), rotates:SPECIAL.BOMB_T.rotates };
    }
    if(mission.special === "reaper"){
      return { kind:"MISSION_REAPER", x: Math.floor(COLS/2)-2, y:0, matrix: materializeSpecMatrix(SPECIAL.REAPER_I), rotates:true };
    }
    if(mission.special === "morph"){
      return { kind:"MISSION_MORPH", x: Math.floor(COLS/2)-1, y:0, matrix: materializeSpecMatrix(SPECIAL.MORPH_L), rotates:true };
    }
    if(mission.special === "seeder"){
      return {
        kind:"MISSION_SEEDER",
        x: Math.floor(COLS/2)-1,
        y:0,
        matrix: createSeederMatrix({ randomize: forSpawn }),
        rotates:true
      };
    }
    if(mission.special === "brand"){
      return { kind:"MISSION_BRAND", x: Math.floor(COLS/2)-1, y:0, matrix: materializeSpecMatrix(SPECIAL.BRAND_T), rotates:true };
    }
    if(mission.special === "feed"){
      return { kind:"MISSION_FEED", x: Math.floor(COLS/2)-1, y:0, matrix: materializeSpecMatrix(SPECIAL.FEED_L), rotates:true };
    }
    if(mission.special === "produce"){
      const product = productInfoForAnimal(mission.animal);
      return {
        kind:"MISSION_PRODUCE",
        productAnimal: mission.animal,
        productTile: product.tile,
        x: Math.floor(COLS/2)-1,
        y: 0,
        matrix: SPECIAL.PRODUCE_O.matrix.map((row) => row.map((v) => v ? product.tile : 0)),
        rotates:false
      };
    }
    return null;
  }

  function createCashoutPiece(){
    return { kind:"MISSION_CASHOUT", x: Math.floor(COLS/2), y:0, matrix: materializeSpecMatrix(SPECIAL.CASHOUT_1), rotates:false };
  }

  function ensureQueuedMissionSpecial(){
    if(!queuedMissionSpecial) queuedMissionSpecial = createMissionSpecialPiece({ forSpawn: true });
    return queuedMissionSpecial;
  }

  function queuedNextPiece(){
    if(mission && mission.ready && !mission.done && !hasRewardCoinOnBoard() && cashoutCharge >= missionCashoutEvery()){
      return createCashoutPiece();
    }
    if(missionSpecialPending && mission && !mission.done && !mission.ready){
      return ensureQueuedMissionSpecial();
    }
    return next;
  }

  function clonePiece(piece){
    if(!piece) return null;
    return { ...piece, matrix: clone2(piece.matrix) };
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
      const label = TILE_LABEL[tile] || "?";
      const fg = tile === TILE.CASHOUT ? "#6f4300" : "#fff";
      const special = SPECIAL_TILE_META[tile];
      const missionFrame = MISSION_TILES.has(tile)
        ? ", 0 0 0 2px rgba(255,209,102,0.82), 0 0 16px rgba(255,209,102,0.24)"
        : "";
      const bg = tile === TILE.CASHOUT
        ? "radial-gradient(circle at 34% 28%, #fff7cb 0 18%, #f7d568 19% 42%, #d4991d 64%, #8d5600 100%)"
        : (TILE_COLOR[tile] || "#666");
      const style = special
        ? `background:linear-gradient(135deg, rgba(255,255,255,0.22), rgba(255,255,255,0.02) 42%), ${bg}; border-color:${special.accent}; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 0 1px ${special.accent}, 0 0 14px rgba(0,0,0,0.18)${missionFrame}; color:${fg};`
        : `background:${bg}; color:${fg};`;
      return `<span class="previewCell filled" style="${style}">${label}</span>`;
    }).join("");
  }

  function helpPieceFromSpec(spec, kind="HELP"){
    return { kind, x: 0, y: 0, matrix: materializeSpecMatrix(spec), rotates: !!spec.rotates };
  }

  function createSeederPreviewPiece(){
    return { kind:"MISSION_SEEDER", x:0, y:0, matrix:createSeederMatrix({ randomize:false }), rotates:true };
  }

  function createProducePreviewPiece(animal=TILE.COW){
    const product = productInfoForAnimal(animal);
    return {
      kind:"MISSION_PRODUCE",
      productAnimal: animal,
      productTile: product.tile,
      x:0,
      y:0,
      matrix: SPECIAL.PRODUCE_O.matrix.map((row) => row.map((v) => v ? product.tile : 0)),
      rotates:false
    };
  }

  function renderHelpSpecialList(el, entries){
    if(!el) return;
    el.innerHTML = entries.map((entry, idx) => `
      <div class="helpSpecialCard">
        <div id="${entry.id}-${idx}" class="previewGrid helpSpecialPreview"></div>
        <div class="helpSpecialCopy">
          <div class="helpSpecialName">${entry.name}</div>
          <div class="helpSpecialText">${entry.text}</div>
        </div>
      </div>
    `).join("");
    entries.forEach((entry, idx) => {
      renderPreview(document.getElementById(`${entry.id}-${idx}`), entry.piece);
    });
  }

  function renderHelpSpecials(){
    renderHelpSpecialList(helpGeneralSpecialsEl, [
      {
        id: "help-wolf",
        name: "Wolf Pack",
        text: "These are real trouble. When they settle, they blast nearby settled tiles. If they whiff completely, they still leave one rude 💩 behind.",
        piece: helpPieceFromSpec(SPECIAL.WOLVES_2, "WOLVES")
      },
      {
        id: "help-blacksheep",
        name: "Black Sheep",
        text: "These are wild cards, not trouble. They convert into the neighboring animal they fit best. If they land isolated, they leave an egg behind before joining at random.",
        piece: helpPieceFromSpec(SPECIAL.BLACKSHEEP_2, "BLACKSHEEP")
      }
    ]);

    renderHelpSpecialList(helpMissionSpecialsEl, [
      {
        id: "help-bomb",
        name: "Barn Buster",
        text: "Mission-only square tetrad with the shared gold mission frame. It blows up nearby settled tiles when it lands.",
        piece: helpPieceFromSpec(SPECIAL.BOMB_T, "MISSION_BOMB")
      },
      {
        id: "help-reaper",
        name: "Cull Comb",
        text: "Mission-only tetrad with the shared gold mission frame. It removes the biggest group currently on the board, then turns into the touching animal so you can place it usefully.",
        piece: helpPieceFromSpec(SPECIAL.REAPER_I, "MISSION_REAPER")
      },
      {
        id: "help-morph",
        name: "Mystery Crate",
        text: "Mission-only tetrad with the shared gold mission frame. It turns into the first nearby animal it matches.",
        piece: helpPieceFromSpec(SPECIAL.MORPH_L, "MISSION_MORPH")
      },
      {
        id: "help-seeder",
        name: "Nest Bomber",
        text: "Mission-only tetrad with the shared gold mission frame. It spawns with a random egg-and-turd mix, then scatters that same mix around its landing zone.",
        piece: createSeederPreviewPiece()
      },
      {
        id: "help-brand",
        name: "Branding Iron",
        text: "Mission-only tetrad with the shared gold mission frame. It becomes the touched animal and converts nearby animals to match, helping build groups.",
        piece: helpPieceFromSpec(SPECIAL.BRAND_T, "MISSION_BRAND")
      },
      {
        id: "help-feed",
        name: "Feed Wagon",
        text: "Mission-only tetrad with the shared gold mission frame. It becomes the touched animal and scatters only eggs around itself.",
        piece: helpPieceFromSpec(SPECIAL.FEED_L, "MISSION_FEED")
      },
      {
        id: "help-produce",
        name: "Barn Goods",
        text: "Mission-only tetrad with the shared gold mission frame. Its icon changes by mission: wool, cheese, eggs, milk, or footballs. Land it on the matching producer to tag that group and leave an egg; miss and it leaves a turd before joining whatever it touched.",
        piece: createProducePreviewPiece(TILE.COW)
      },
      {
        id: "help-cashout",
        name: "Reward Coin",
        text: "Mission-only reward piece with the shared gold mission frame. Once it lands, you get 10 settles to clear its pulsing group or the run ends.",
        piece: helpPieceFromSpec(SPECIAL.CASHOUT_1, "MISSION_CASHOUT")
      }
    ]);
  }

  function newMission(){
    const def = randChoice(MISSION_DEFS);
    const tunedBonus = Math.max(80, Math.round(def.bonus * 0.6));
    return {
      ...def,
      bonus: tunedBonus,
      progress: 0,
      done: false,
      ready: false,
      cashBonus: tunedBonus,
    };
  }

  function missionSpecialRule(){
    if(!mission) return null;
    if(mission.special === "produce"){
      const product = productInfoForAnimal(mission.animal);
      return {
        title: product.specialTitle,
        desc: `On average, a ${product.noun} tetrad barges in about every 5 settles. Land it on ${animalWord(mission.animal)} to tag that group and leave an egg behind. Miss and it leaves a turd before joining whatever it touched.`,
        short: `Surprise ${product.noun} tetrad, about every 5 settles on average.`,
        every: 5,
        tile: product.tile
      };
    }
    return SPECIAL_RULES[mission.special];
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
    queuedMissionSpecial = createMissionSpecialPiece({ forSpawn: true });
    return true;
  }

  function missionPressureMultiplier(){
    return (mission && mission.ready && !mission.done) ? 0.93 : 1;
  }

  function missionReadyLockBonus(){
    return 3 + level;
  }

  function registerLockCycle(opts={}){
    locks++;
    if(mission && !mission.done){
      if(mission.ready){
        const rewardCoinWaiting = hasRewardCoinOnBoard();
        const bonusGain = (!opts.skipCashout && !rewardCoinWaiting) ? missionReadyLockBonus() : 0;
        if(bonusGain > 0){
          mission.cashBonus += bonusGain;
          banner.text = `Greed pays... for now. Bonus swelled to +${mission.cashBonus}.`;
          banner.t = performance.now();
        }
        if(!opts.skipCashout && !rewardCoinWaiting){
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
    if(mission.type === "animal") return `Clear ${mission.target} ${animalWord(mission.animal)}`;
    if(mission.type === "clears") return `Clear ${mission.target} big groups (${BIG_GROUP_THRESHOLD}+)`;
    if(mission.type === "combo") return `${fmtChain(mission.target)} combo`;
    if(mission.type === "wolf") return `Trigger ${mission.target} wolf tantrum${mission.target === 1 ? "" : "s"}`;
    if(mission.type === "score") return `Score ${mission.target} coins`;
    if(mission.type === "level") return `Reach pace ${mission.target}`;
    if(mission.type === "big_group") return `Clear ${mission.target} jumbo groups`;
    if(mission.type === "product") return `Cash in ${mission.target} ${productInfoForAnimal(mission.animal).plural}`;
    if(mission.type === "special_use") return `Use your mission special ${mission.target} time${mission.target === 1 ? "" : "s"}`;
    if(mission.type === "locks") return `Complete ${mission.target} settles`;
    return mission.title;
  }

  function missionBriefCopy(){
    if(!mission) return "The barn is quiet. It will not stay that way.";
    if(mission.type === "animal") return `Clear enough ${animalWord(mission.animal)} ${TILE_LABEL[mission.animal]} to hit the goal. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "clears") return `Clear enough big groups of ${BIG_GROUP_THRESHOLD} or more animals to hit the goal. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "combo") return `Build your chain by clearing a group, letting the perimeter flip into nearby animals, and then letting straight gravity trigger another clear. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "wolf") return `Trigger enough wolf blasts to hit the goal. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "score") return `Rack up coins fast. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "level") return `Stay alive long enough to reach the target pace. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "big_group") return `Build oversized clusters and clear them to hit the goal. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "product"){
      const product = productInfoForAnimal(mission.animal);
      return `Drop the ${product.noun} tetrad onto ${animalWord(mission.animal)}. A clean hit turns it into ${animalWord(mission.animal)}, leaves an egg behind, and tags that group. Clear that tagged group to cash in one ${product.noun}. Miss and it drops a turd before joining whatever it touched. Hit the goal, then ${missionCashoutObjectiveCopy().charAt(0).toLowerCase()}${missionCashoutObjectiveCopy().slice(1)}`;
    }
    if(mission.type === "build_group") return `Build a live group up to the target size without clearing it too soon. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "special_use") return `Use your mission special on purpose to hit the goal. ${missionCashoutObjectiveCopy()}`;
    if(mission.type === "locks") return `Complete the required settles. ${missionCashoutObjectiveCopy()}`;
    return `The barn demands something weird from you today. Finish the objective, then ${missionCashoutObjectiveCopy().charAt(0).toLowerCase()}${missionCashoutObjectiveCopy().slice(1)}`;
  }

  function openMissionBriefing(){
    const specialRule = missionSpecialRule();
    if(missionBriefTitleEl) missionBriefTitleEl.textContent = mission?.title ?? "Mission Briefing";
    if(missionBriefBodyEl) missionBriefBodyEl.textContent = missionBriefCopy();
    if(missionBriefObjectiveEl) missionBriefObjectiveEl.textContent = missionObjectiveLabel();
    if(missionBriefBonusEl) missionBriefBonusEl.textContent = `Earn at least +${mission?.bonus ?? 0} coins`;
    if(missionBriefSpecialNameEl) missionBriefSpecialNameEl.textContent = specialRule ? specialRule.title : "No special";
    if(missionBriefSpecialInfoEl) missionBriefSpecialInfoEl.textContent = specialRule ? `${specialRule.desc} Lone drops leave a turd.` : "No special tetrad assigned.";
    renderPreview(missionBriefPreviewEl, createMissionSpecialPiece());
    setOverlayOpen(missionBriefBackdrop, true);
  }

  function closeMissionBriefing(){
    setOverlayOpen(missionBriefBackdrop, false);
    draw();
  }

  function stageRunSummary(){
    const missionBonus = mission && mission.done ? mission.cashBonus : 0;
    return missionBonus > 0
      ? `${Math.max(0, score|0)} herding + ${missionBonus} bonus`
      : `${Math.max(0, score|0)} herding`;
  }

  function syncStageRunActions(){
    const runEnded = !!gameOver;
    if(stageMissionBarEl) stageMissionBarEl.classList.toggle("runEnded", runEnded);
    if(stageRunActionsEl) stageRunActionsEl.classList.toggle("hidden", !runEnded);
    if(!runEnded) return;
    if(stageMissionTitleEl) stageMissionTitleEl.textContent = runEndTitle;
    if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = stageRunSummary();
  }

  function updateMissionUI(){
    syncStageRunActions();
    if(gameOver){
      syncMissionMeterCountdownUI(false);
      return;
    }
    if(!missionTitleEl || !missionProgressEl || !missionSpecialNameEl || !missionSpecialInfoEl) return;
    if(!mission){
      syncMissionMeterCountdownUI(false);
      missionTitleEl.textContent = "Warm up the barn";
      missionProgressEl.textContent = "Start dropping pieces";
      if(missionMeterFillEl) missionMeterFillEl.style.width = "0%";
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = "Mission warming up";
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = "Start dropping";
      if(stageMissionMeterFillEl) stageMissionMeterFillEl.style.width = "0%";
      missionSpecialNameEl.textContent = "Special tetrad: warming up";
      missionSpecialInfoEl.textContent = "Mission tricks will appear here.";
      renderPreview(missionSpecialPreviewEl, null);
      return;
    }
    const progressRatio = missionProgressRatio();
    const progressWidth = `${Math.round(progressRatio * 100)}%`;
    const countdownMode = !!(mission.ready && !mission.done && hasRewardCoinOnBoard());
    syncMissionMeterCountdownUI(countdownMode);
    if(missionMeterFillEl) missionMeterFillEl.style.width = progressWidth;
    if(stageMissionMeterFillEl) stageMissionMeterFillEl.style.width = progressWidth;
    syncMissionMeterAudio();
    const specialRule = missionSpecialRule();
    const specialQueued = missionSpecialPending;
    const specialWarmth = Math.round(missionSpecialWarmth() * 100);
    const objectiveLabel = missionObjectiveLabel();

    if(mission.done){
      missionTitleEl.textContent = `${mission.title} earned`;
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = mission.title;
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = compactMissionProgress();
      missionSpecialNameEl.textContent = "Mission earned";
      missionSpecialInfoEl.textContent = `You earned +${mission.cashBonus} coins.`;
      renderPreview(missionSpecialPreviewEl, createCashoutPiece());
    } else if(mission.ready){
      missionTitleEl.textContent = `${mission.title} ready`;
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = mission.title;
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = compactMissionProgress();
      missionSpecialNameEl.textContent = hasRewardCoinOnBoard() ? "Reward clock live" : "Reward coin incoming";
      missionSpecialInfoEl.textContent = isCompactUI()
        ? hasRewardCoinOnBoard()
          ? `Clear the pulsing reward group for +${mission.cashBonus}. ${rewardCountdownLabel()}.`
          : `Coin in ${Math.max(0, missionCashoutEvery() - cashoutCharge)} settles, then clear it in a group.`
        : hasRewardCoinOnBoard()
          ? `The reward coin has landed and turned into an animal. Clear the pulsing reward group within ${rewardCountdownLabel()} to earn +${mission.cashBonus}, or the run ends.`
          : `Objective met. Keep playing if you dare: the barn speeds up, your bonus grows every settle, and a reward coin appears every ${missionCashoutEvery()} settles until one lands. Once it lands, the ${REWARD_COUNTDOWN_START}-settle reward clock starts.`;
      renderPreview(missionSpecialPreviewEl, createCashoutPiece());
    } else {
      missionTitleEl.textContent = mission.title;
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = mission.title;
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = compactMissionProgress();
      missionSpecialNameEl.textContent = specialRule ? `Special tetrad: ${specialRule.title}` : "Special tetrad: none";
      missionSpecialInfoEl.textContent = specialRule
        ? isCompactUI()
          ? specialQueued
            ? "Mission tetrad is primed."
            : `${specialJoinRateLabel(specialRule)} · ${specialWarmth}% primed`
          : `${specialRule.desc} Lone drops leave a turd. ${specialQueued ? "That mission tetrad is primed and can drop at any moment." : `Its odds are warming up (${specialWarmth}%).`}`
        : "No special tetrad assigned.";
      renderPreview(missionSpecialPreviewEl, createMissionSpecialPiece());
    }

    if(mission.type === "animal"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `Goal met. Clear the pulsing reward group in ${rewardCountdownLabel()} to earn +${mission.cashBonus}.`
            : `Goal met. Keep clearing ${animalWord(mission.animal)} while the reward coin charges.`
          : `${missionProgressText(mission.progress, mission.target)} ${animalWord(mission.animal)} cleared`;
      return;
    }

    if(mission.type === "combo"){
      missionProgressEl.textContent = mission.done
        ? `Crowd goes feral: +${mission.cashBonus}`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `Combo landed. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
            : `Combo landed. The bonus keeps fattening until the reward coin lands.`
          : `Best cascade this run: ${fmtChain(bestCombo)} (${missionProgressText(mission.progress, mission.target)})`;
      return;
    }

    if(mission.type === "wolf"){
      missionProgressEl.textContent = mission.done
        ? `The barn insurance rates exploded. +${mission.cashBonus}`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `Wolf mission complete. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
            : `Wolf mission complete. Survive until the reward coin lands.`
          : `${missionProgressText(mission.progress, mission.target)} wolf tantrums`;
      return;
    }

    if(mission.type === "score"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `Target score hit. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
            : `Target score hit. The reward coin still has to land and clear.`
          : `${missionProgressText(score, mission.target)} coins scored`;
      return;
    }

    if(mission.type === "level"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `You reached the target pace. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
            : `You reached the target pace. Wait for the reward coin to land.`
          : `Current pace ${level} (${missionProgressText(level, mission.target)})`;
      return;
    }

    if(mission.type === "big_group"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `Jumbo group goal complete. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
            : `Jumbo group goal complete. Extra settles grow the bonus until the reward coin lands.`
          : `${missionProgressText(mission.progress, mission.target)} jumbo groups cleared`;
      return;
    }

    if(mission.type === "product"){
      const product = productInfoForAnimal(mission.animal);
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `Goods loaded. Clear the pulsing reward group in ${rewardCountdownLabel()} to earn +${mission.cashBonus}.`
            : `Goods loaded. Wait for the reward coin to land, then clear its group.`
          : `${missionProgressText(mission.progress, mission.target)} ${product.plural} cashed in`;
      return;
    }

    if(mission.type === "build_group"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `Live group goal reached. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
            : `Live group goal reached. Wait for the reward coin to land.`
          : `${missionCurrentProgress()} / ${mission.target} live in the biggest group`;
      return;
    }

    if(mission.type === "special_use"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `Special requirement met. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
            : `Special requirement met. The reward coin is on its way.`
          : `${missionProgressText(mission.progress, mission.target)} mission specials used`;
      return;
    }

    if(mission.type === "locks"){
      missionProgressEl.textContent = mission.done
        ? `Bonus earned: +${mission.cashBonus} coins`
        : mission.ready
          ? hasRewardCoinOnBoard()
            ? `You completed the required settles. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
            : `You completed the required settles. Stay alive until the reward coin lands.`
          : `${missionProgressText(locks, mission.target)} settles completed`;
      return;
    }

    missionProgressEl.textContent = mission.done
      ? `Bonus earned: +${mission.cashBonus} coins`
      : mission.ready
        ? hasRewardCoinOnBoard()
          ? `Clear goal done. Clear the pulsing reward group in ${rewardCountdownLabel()}.`
          : `Clear goal done. The bonus grows until the reward coin lands.`
        : `${missionProgressText(mission.progress, mission.target)} clears`;
  }

  function completeMission(){
    if(!mission || mission.done || mission.ready) return;
    mission.ready = true;
    mission.cashBonus = mission.bonus;
    missionSpecialPending = false;
    queuedMissionSpecial = null;
    missionSpecialCharge = 0;
    cashoutCharge = 0;
    rewardCountdown = null;
    banner.text = `Objective met! Survive until the reward coin lands. Once it does, you get ${REWARD_COUNTDOWN_START} settles to clear it for +${mission.cashBonus}.`;
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
    } else if(event === "product" && mission.type === "product" && mission.animal === value.animal){
      mission.progress += value.amount;
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
    else if(mission.type === "build_group") mission.progress = missionCurrentProgress();
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
    if(mission && mission.ready && !mission.done && !hasRewardCoinOnBoard() && cashoutCharge >= missionCashoutEvery()){
      current = preparePiece(createCashoutPiece());
      cashoutCharge = 0;
    } else if(missionSpecialPending && mission && !mission.done && !mission.ready){
      current = preparePiece(ensureQueuedMissionSpecial());
      missionSpecialPending = false;
      queuedMissionSpecial = null;
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
      banner.text = `Pace ${level}! The barn got meaner.`;
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
    renderPreview(nextPreviewEl, queuedNextPiece());
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
    const missionBonus = mission && mission.done ? mission.cashBonus : 0;
    const herdScore = Math.max(0, score|0);
    const totalScore = Math.max(0, (score + missionBonus)|0);
    if(gameOverTitleEl) gameOverTitleEl.textContent = runEndTitle;
    if(gameOverNoteEl) gameOverNoteEl.textContent = runEndNote;
    if(finalScoreEl) finalScoreEl.textContent = `${herdScore} (herding) + ${missionBonus} (bonus) = ${totalScore}`;
    if(finalLevelEl) finalLevelEl.textContent = level;
    if(finalClearsEl) finalClearsEl.textContent = herdsCleared;
    if(finalBestEl) finalBestEl.innerHTML = bestHerdSummary(bestHerd);
    if(finalComboEl) finalComboEl.textContent = fmtChain(bestCombo);
  }

  function finishMissionEarned(){
    rewardCountdown = null;
    updateHUD();
    gameOverNow({
      title: "Mission Earned",
      note: `${mission.title} earned +${mission.cashBonus} coins after the reward group cleared.`,
      playSound: false
    });
  }

  function gameOverNow(opts={}){
    runEndTitle = opts.title ?? "Run Over";
    runEndNote = opts.note ?? (
      mission && mission.ready && !mission.done
        ? `You had +${mission.cashBonus} coins on the line, but the barn buried the coin before you could earn them.`
        : "The barn got crowded."
    );
    gameOver = true;
    rewardCountdown = null;
    pendingTap = null;
    boardAnimations = [];
    if(!shareSnapshot) rememberShareSnapshot();
    if(opts.playSound !== false) playGameOverJingle();
    updateGameOverStats();
    setOverlayOpen(gameOverBackdrop, true);
    draw();
  }

  function closeGameOverPanel(){
    setOverlayOpen(gameOverBackdrop, false);
    draw();
  }

  function openGameOverPanel(){
    if(!gameOver) return;
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

  function pieceTouchesSettledTiles(piece){
    for(const [x,y] of footprintCells(piece)){
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx = x + dx;
        const ny = y + dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        if(board[ny][nx] !== TILE.EMPTY) return true;
      }
    }
    return false;
  }

  function maybeDropLonelyMissionTurd(piece, landedLonely){
    if(!landedLonely) return false;
    return markOneFootprintOverlay(piece, POWER.TURD);
  }

  function startRewardCountdown(){
    rewardCountdown = REWARD_COUNTDOWN_START;
  }

  function advanceRewardCountdown(){
    if(!mission || mission.done || !mission.ready || !hasRewardCoinOnBoard() || !Number.isFinite(rewardCountdown)) return false;
    rewardCountdown = Math.max(0, rewardCountdown - 1);
    if(rewardCountdown > 0){
      banner.text = `Reward clock: ${rewardCountdownLabel()}. Clear the pulsing group before it expires.`;
      banner.t = performance.now();
      updateHUD();
      return false;
    }
    gameOverNow({
      title: "Reward Clock Expired",
      note: `The reward coin survived the full ${REWARD_COUNTDOWN_START}-settle clock, so the barn shut the gates before you could cash it in.`
    });
    return true;
  }

  function finishLockResolution(summary, opts={}){
    applyChainResult(summary);
    if(summary.rewardEarned){
      finishMissionEarned();
      return true;
    }
    if(advanceRewardCountdown()) return true;
    if(!gameOver) spawnNext();
    if(opts.settleAnimal && ANIMALS.includes(opts.settleAnimal)){
      playBarnyard(opts.settleAnimal, 4, "settle");
    }
    if(opts.playLockTick !== false) playLockTick();
    if(opts.hapticMs) haptic(opts.hapticMs);
    return false;
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
      rewardMap[y][x] = false;
      productMap[y][x] = 0;
    }

    if(popped.length){
      spawnPopParticles(popped);
      banner.text = `🐺 BOOM (${popped.length} tiles). The coop lawyers have concerns.`;
      banner.t = performance.now();
      playTone({type:"sawtooth", f1:120, f2:45, dur:0.20, gain:0.20});
      playTone({type:"square", f1:80, f2:40, dur:0.16, gain:0.16});
      haptic(18);
      bumpMission("wolf", 1);
    } else if(markOneFootprintOverlay(piece, POWER.TURD)){
      banner.text = "Wolf pack whiffed and still left a rude 💩 behind.";
      banner.t = performance.now();
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
    return {
      animal: (bestCount <= 0) ? randChoice(ANIMALS) : randChoice(tied),
      hadNeighbor: bestCount > 0
    };
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

  function touchingAnimalCounts(piece){
    const counts = new Map(ANIMALS.map((animal) => [animal, 0]));
    for(const [x,y] of footprintCells(piece)){
      for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){
        const nx = x + dx;
        const ny = y + dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        const t = board[ny][nx];
        if(ANIMALS.includes(t)) counts.set(t, counts.get(t) + 1);
      }
    }
    return counts;
  }

  function chooseAnimalFromCounts(counts){
    let bestCount = 0;
    for(const animal of ANIMALS) bestCount = Math.max(bestCount, counts.get(animal) || 0);
    const tied = ANIMALS.filter((animal) => (counts.get(animal) || 0) === bestCount);
    return bestCount > 0 ? randChoice(tied) : randChoice(ANIMALS);
  }

  function chooseLandingAnimal(piece){
    return chooseAnimalFromCounts(touchingAnimalCounts(piece));
  }

  function markOneFootprintOverlay(piece, power){
    const cells = footprintCells(piece);
    if(!cells.length) return false;
    const [x,y] = randChoice(cells);
    overlay[y][x] = power;
    return true;
  }

  function markFootprintOverlays(piece, power, count=1){
    const cells = footprintCells(piece).slice();
    if(!cells.length) return 0;
    shuffleInPlace(cells);
    let placed = 0;
    for(const [x,y] of cells){
      overlay[y][x] = power;
      placed++;
      if(placed >= count) break;
    }
    return placed;
  }

  function clearProductMarks(){
    productMap = makeProductMap();
    productTokenInfo = new Map();
    nextProductToken = 1;
  }

  function markProductPiece(piece, animal){
    const token = nextProductToken++;
    const product = productInfoForAnimal(animal);
    productTokenInfo.set(token, {
      animal,
      tile: product.tile,
      label: TILE_LABEL[product.tile],
      noun: product.noun,
      plural: product.plural
    });
    for(const [x,y] of footprintCells(piece)){
      productMap[y][x] = token;
    }
    return token;
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
      rewardMap[y][x] = false;
      productMap[y][x] = 0;
    }
    if(popped.length){
      spawnPopParticles(popped);
      banner.text = `Barn Buster popped ${popped.length} tiles.`;
      banner.t = performance.now();
      playTone({type:"sawtooth", f1:180, f2:50, dur:0.16, gain:0.18});
    } else {
      const turdsPlaced = markFootprintOverlays(piece, POWER.TURD, 2);
      banner.text = `Barn Buster whiffed and dropped ${turdsPlaced} rude 💩.`;
      banner.t = performance.now();
    }
  }

  function missionReapLargestGroup(piece){
    const best = findLargestAnimalGroup();
    if(best){
      for(const [x,y] of best.cells){
        board[y][x] = TILE.EMPTY;
        overlay[y][x] = POWER.NONE;
        rewardMap[y][x] = false;
        productMap[y][x] = 0;
      }
      spawnPopParticles(best.cells.map(([x,y]) => [x,y,best.animal]));
      banner.text = `Cull Comb clipped ${best.cells.length} ${TILE_LABEL[best.animal]}.`;
      banner.t = performance.now();
      playTone({type:"triangle", f1:620, f2:260, dur:0.14, gain:0.10});
    }
    const landAnimal = chooseLandingAnimal(piece);
    for(const [x,y] of footprintCells(piece)) board[y][x] = landAnimal;
    banner.text = `Cull Comb clipped and turned into ${TILE_LABEL[landAnimal]}.`;
    banner.t = performance.now();
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
    for(const row of piece.matrix){
      for(const v of row){
        if(v === TILE.SEEDER_EGG) eggs++;
        if(v === TILE.SEEDER_TURD) turds++;
      }
    }
    let eggsPlaced = 0;
    let turdsPlaced = 0;
    for(const [x,y] of candidates){
      if(overlay[y][x] !== POWER.NONE) continue;
      if(eggsPlaced < eggs){
        overlay[y][x] = POWER.EGG;
        eggsPlaced++;
      } else if(turdsPlaced < turds){
        overlay[y][x] = POWER.TURD;
        turdsPlaced++;
      }
      if(eggsPlaced >= eggs && turdsPlaced >= turds) break;
    }
    banner.text = `Nest Bomber dropped ${eggsPlaced} eggs and ${turdsPlaced} turds.`;
    banner.t = performance.now();
    playTone({type:"square", f1:500, f2:200, dur:0.10, gain:0.07});
  }

  function missionBrandPiece(piece){
    const animal = chooseLandingAnimal(piece);
    for(const [x,y] of footprintCells(piece)) board[y][x] = animal;
    for(const [x,y] of footprintCells(piece)){
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx = x + dx, ny = y + dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        if(ANIMALS.includes(board[ny][nx])) board[ny][nx] = animal;
      }
    }
    banner.text = `Branding Iron rallied a ${GROUP_NAME[animal] || "group"} of ${TILE_LABEL[animal]}.`;
    banner.t = performance.now();
    playBarnyard(animal, 7);
  }

  function missionFeedPiece(piece){
    const animal = chooseLandingAnimal(piece);
    for(const [x,y] of footprintCells(piece)) board[y][x] = animal;
    const candidates = [];
    for(const [x,y] of footprintCells(piece)){
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]]){
        const nx = x + dx, ny = y + dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        candidates.push([nx,ny]);
      }
    }
    shuffleInPlace(candidates);
    let eggsPlaced = 0;
    for(const [x,y] of candidates){
      if(overlay[y][x] !== POWER.NONE) continue;
      overlay[y][x] = POWER.EGG;
      eggsPlaced++;
      if(eggsPlaced >= 3) break;
    }
    banner.text = `Feed Wagon sweetened the barn with ${eggsPlaced} eggs.`;
    banner.t = performance.now();
    playTone({type:"triangle", f1:480, f2:260, dur:0.12, gain:0.07});
  }

  function missionProducePiece(piece){
    const product = productInfoForAnimal(piece.productAnimal || mission?.animal || TILE.SHEEP);
    const counts = touchingAnimalCounts(piece);
    const matchedProducer = (counts.get(piece.productAnimal || mission?.animal || TILE.SHEEP) || 0) > 0;
    const landingAnimal = matchedProducer
      ? (piece.productAnimal || mission?.animal || TILE.SHEEP)
      : chooseAnimalFromCounts(counts);

    for(const [x,y] of footprintCells(piece)){
      board[y][x] = landingAnimal;
    }

    if(matchedProducer){
      markProductPiece(piece, landingAnimal);
      markOneFootprintOverlay(piece, POWER.EGG);
      banner.text = `${product.specialTitle} hit ${animalWord(landingAnimal)}. It dropped an egg and tagged that group for one ${product.noun}.`;
      banner.t = performance.now();
      playBarnyard(landingAnimal, 7);
      playTone({type:"triangle", f1:560, f2:320, dur:0.08, gain:0.06});
    } else {
      markOneFootprintOverlay(piece, POWER.TURD);
      banner.text = `${product.specialTitle} missed and turned into ${TILE_LABEL[landingAnimal]} after dropping a rude 💩.`;
      banner.t = performance.now();
      playTone({type:"square", f1:240, f2:150, dur:0.08, gain:0.05});
    }
  }

  // ===== Scoring =====
  function fib(n){
    if(n <= 0) return 0;
    if(n === 1 || n === 2) return 1;
    let a=1,b=1;
    for(let i=3;i<=n;i++){ const c=a+b; a=b; b=c; }
    return b;
  }

  function chainBonusForDepth(depth){
    if(depth <= 1) return 0;
    return fib(depth + 3);
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
    const moves = [];
    for(let x=0;x<COLS;x++){
      let write = ROWS-1;
      for(let y=ROWS-1;y>=0;y--){
        const t = board[y][x];
        if(t !== TILE.EMPTY){
          if(write !== y){
            moves.push({ x, fromY: y, toY: write, tile: t });
            board[write][x] = t;
            rewardMap[write][x] = rewardMap[y][x];
            productMap[write][x] = productMap[y][x];
            board[y][x] = TILE.EMPTY;
            rewardMap[y][x] = false;
            productMap[y][x] = 0;
          }
          write--;
        }
      }
    }
    return moves;
  }

  function keyForCell(x, y){
    return `${x},${y}`;
  }

  function connectedAnimalSizeExcluding(sx, sy, animal, blocked, cache){
    const startKey = keyForCell(sx, sy);
    if(cache.has(startKey)) return cache.get(startKey);

    const q = [[sx, sy]];
    const seen = new Set([startKey]);
    const cells = [];

    while(q.length){
      const [x, y] = q.pop();
      cells.push([x, y]);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx = x + dx;
        const ny = y + dy;
        if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
        const key = keyForCell(nx, ny);
        if(blocked.has(key) || seen.has(key)) continue;
        if(board[ny][nx] !== animal) continue;
        seen.add(key);
        q.push([nx, ny]);
      }
    }

    const size = cells.length;
    for(const [x, y] of cells) cache.set(keyForCell(x, y), size);
    return size;
  }

  function choosePerimeterConversionAnimal(x, y, blocked, cache){
    const candidateSizes = new Map();

    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x + dx;
      const ny = y + dy;
      if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      const key = keyForCell(nx, ny);
      if(blocked.has(key)) continue;
      const animal = board[ny][nx];
      if(!ANIMALS.includes(animal)) continue;
      const size = connectedAnimalSizeExcluding(nx, ny, animal, blocked, cache);
      candidateSizes.set(animal, Math.max(candidateSizes.get(animal) || 0, size));
    }

    let bestSize = 0;
    let tied = [];
    for(const [animal, size] of candidateSizes){
      if(size > bestSize){
        bestSize = size;
        tied = [animal];
      } else if(size === bestSize){
        tied.push(animal);
      }
    }

    if(bestSize <= 0 || !tied.length) return null;
    return tied.length === 1 ? tied[0] : randChoice(tied);
  }

  function buildClearConversions(clears){
    const blocked = new Set();
    for(const group of clears){
      for(const [x,y] of group.cells) blocked.add(keyForCell(x, y));
    }

    const cache = new Map();
    const conversions = new Map();
    for(const group of clears){
      for(const [x,y] of group.cells){
        const animal = choosePerimeterConversionAnimal(x, y, blocked, cache);
        if(animal) conversions.set(keyForCell(x, y), animal);
      }
    }
    return { blocked, conversions };
  }

  function settleBoardNow(){
    return applyGravity();
  }

  function resolveBoard(){
    const preResolveSnapshot = captureShareSnapshot();
    let cascadeDepth = 0;
    let totalGain = 0;
    let groupsCleared = 0;
    let rewardEarned = false;
    while(true){
      if(gameOver) break;
      const clears = findAnimalGroupsToClear();
      if(clears.length === 0) break;
      cascadeDepth++;
      const { blocked: clearedKeys, conversions } = buildClearConversions(clears);
      const clearedTileLookup = new Map();
      for(const group of clears){
        for(const [x,y] of group.cells) clearedTileLookup.set(keyForCell(x, y), group.animal);
      }

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
        if(!bestHerd || cells.length > bestHerd.count || (cells.length === bestHerd.count && gain > bestHerd.gain)){
          bestHerd = { animal, count: cells.length, gain };
        }
        const clearedReward = cells.some(([x,y]) => rewardMap[y][x]);
        if(clearedReward){
          rewardEarned = true;
        }
        const clearedProductTokens = new Set(
          cells
            .map(([x,y]) => productMap[y][x])
            .filter(Boolean)
        );
        if(clearedProductTokens.size && mission && mission.type === "product" && mission.animal === animal){
          bumpMission("product", { animal, amount: clearedProductTokens.size });
          banner.text = `${clearedProductTokens.size} ${productInfoForAnimal(animal).noun}${clearedProductTokens.size === 1 ? "" : "s"} cashed in.`;
          banner.t = performance.now();
        }
        score += gain;
        totalGain += gain;
        groupsCleared++;
        syncPassiveMissionProgress();

        herdsCleared++;
        bumpMission("animal", { animal, amount: cells.length });
        bumpMission("clears", 1);
        if(gameOver) break;
        const chainTag = cascadeDepth > 1 ? `Chain ${fmtChain(cascadeDepth)}! ` : "";
        banner.text = `${chainTag}${quipForAnimal(animal)} Cleared ${cells.length} ${animalWord(animal)} ${TILE_LABEL[animal]} +${gain}${eggs?` 🥚x${eggs}`:""}${turds?` 💩x${turds}`:""}`;
        banner.t = performance.now();

        spawnPopParticles(cells.map(([x,y]) => [x,y,animal]));
        playBarnyard(animal, cells.length);
        haptic(12);
      }

      const resolveFx = [];
      for(const key of clearedKeys){
        const [xStr, yStr] = key.split(",");
        const x = Number(xStr);
        const y = Number(yStr);
        const originalTile = clearedTileLookup.get(key) || TILE.EMPTY;
        const convertedTile = conversions.get(key) || TILE.EMPTY;
        if(convertedTile){
          resolveFx.push({
            type: "convert",
            x,
            y,
            fromTile: originalTile,
            toTile: convertedTile,
            duration: BOARD_CONVERT_ANIM_MS
          });
        } else if(originalTile !== TILE.EMPTY){
          resolveFx.push({
            type: "clear",
            x,
            y,
            tile: originalTile,
            duration: BOARD_CLEAR_ANIM_MS
          });
        }
        board[y][x] = convertedTile;
        overlay[y][x] = POWER.NONE;
        rewardMap[y][x] = false;
        productMap[y][x] = 0;
      }

      const gravityMoves = settleBoardNow();
      for(const move of gravityMoves){
        resolveFx.push({
          type: "fall",
          x: move.x,
          fromY: move.fromY,
          toY: move.toY,
          tile: move.tile,
          duration: BOARD_FALL_ANIM_MS + Math.max(0, move.toY - move.fromY) * 26
        });
      }
      if(resolveFx.length) queueBoardAnimations(resolveFx);
    }
    const chainBonus = chainBonusForDepth(cascadeDepth);
    if(chainBonus > 0){
      score += chainBonus;
      totalGain += chainBonus;
      if(!rewardEarned){
        banner.text = `Chain ${fmtChain(cascadeDepth)} paid out +${chainBonus} bonus coins.`;
        banner.t = performance.now();
      }
    }
    syncPassiveMissionProgress();
    if(rewardEarned && mission && mission.ready && !mission.done){
      mission.done = true;
      banner.text = `Reward group cleared. Mission earned: +${mission.cashBonus} coins.`;
      banner.t = performance.now();
      rememberShareSnapshot(preResolveSnapshot);
      playMissionJingle();
    } else {
      rememberShareSnapshot();
    }
    updateHUD();
    return { groupsCleared, totalGain, rewardEarned, chainDepth: cascadeDepth, chainBonus };
  }

  function applyChainResult(summary){
    if(!summary || summary.groupsCleared <= 0){
      currentCombo = 0;
      updateHUD();
      return;
    }
    currentCombo = summary.chainDepth || 1;
    bestCombo = Math.max(bestCombo, currentCombo);
    bumpMission("combo", currentCombo);
    const chainText = summary.chainDepth > 1 ? ` · ${fmtChain(summary.chainDepth)} +${summary.chainBonus}` : "";
    showToast(`🪙 x${summary.totalGain}${chainText}`, 1850);
    updateHUD();
  }

  // ===== Locking =====
  function lockPiece(){
    if(current.kind === "WOLVES"){
      wolvesExplode(current);
      settleBoardNow();
      registerLockCycle();
      const summary = resolveBoard();
      finishLockResolution(summary, { playLockTick:false });
      return;
    }

    if(current.kind === "MISSION_BOMB"){
      missionBombBlast(current);
      settleBoardNow();
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      finishLockResolution(summary);
      return;
    }

    if(current.kind === "MISSION_REAPER"){
      const landedLonely = !pieceTouchesSettledTiles(current);
      missionReapLargestGroup(current);
      if(maybeDropLonelyMissionTurd(current, landedLonely)) banner.text += " It landed alone and left a rude 💩.";
      settleBoardNow();
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      finishLockResolution(summary);
      return;
    }

    if(current.kind === "MISSION_MORPH"){
      const landedLonely = !pieceTouchesSettledTiles(current);
      missionMorphPiece(current);
      if(maybeDropLonelyMissionTurd(current, landedLonely)) banner.text += " It landed alone and left a rude 💩.";
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      finishLockResolution(summary);
      return;
    }

    if(current.kind === "MISSION_SEEDER"){
      const landedLonely = !pieceTouchesSettledTiles(current);
      missionSeedOverlay(current);
      if(maybeDropLonelyMissionTurd(current, landedLonely)) banner.text += " It landed alone and left a rude 💩.";
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      finishLockResolution(summary);
      return;
    }

    if(current.kind === "MISSION_BRAND"){
      const landedLonely = !pieceTouchesSettledTiles(current);
      missionBrandPiece(current);
      if(maybeDropLonelyMissionTurd(current, landedLonely)) banner.text += " It landed alone and left a rude 💩.";
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      finishLockResolution(summary);
      return;
    }

    if(current.kind === "MISSION_FEED"){
      const landedLonely = !pieceTouchesSettledTiles(current);
      missionFeedPiece(current);
      if(maybeDropLonelyMissionTurd(current, landedLonely)) banner.text += " It landed alone and left a rude 💩.";
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      finishLockResolution(summary);
      return;
    }

    if(current.kind === "MISSION_PRODUCE"){
      missionProducePiece(current);
      bumpMission("special_use", 1);
      registerLockCycle();
      const summary = resolveBoard();
      finishLockResolution(summary);
      return;
    }

    if(current.kind === "MISSION_CASHOUT"){
      const rewardAnimal = chooseLandingAnimal(current);
      for(const [x,y] of footprintCells(current)){
        board[y][x] = rewardAnimal;
        rewardMap[y][x] = true;
      }
      startRewardCountdown();
      registerLockCycle({ skipCashout: true, skipMissionCharge: true });
      banner.text = `Reward coin settled as ${TILE_LABEL[rewardAnimal]}. Clear that pulsing group within ${REWARD_COUNTDOWN_START} settles for +${mission.cashBonus}.`;
      banner.t = performance.now();
      playTone({type:"triangle", f1:720, f2:360, dur:0.16, gain:0.08});
      updateHUD();
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
      const choice = chooseConversionAnimalForBlackSheep(current);
      for(const [x,y] of footprintCells(current)) board[y][x] = choice.animal;
      if(!choice.hadNeighbor){
        markOneFootprintOverlay(current, POWER.EGG);
        banner.text = "Black sheep landed alone, left an egg, and joined in anyway.";
        banner.t = performance.now();
      }
    }

    const landedCells = footprintCells(current);
    const settleAnimal = current.kind === "BLACKSHEEP"
      ? board[landedCells[0]?.[1] ?? 0]?.[landedCells[0]?.[0] ?? 0] ?? pieceLeadAnimal(current)
      : pieceLeadAnimal(current);

    registerLockCycle();
    const summary = resolveBoard();
    finishLockResolution(summary, { settleAnimal, hapticMs:10 });
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

  function easeOutCubic(t){
    return 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  }

  function queueBoardAnimations(entries){
    if(!entries?.length) return;
    const start = performance.now();
    for(const entry of entries){
      boardAnimations.push({ ...entry, start });
    }
  }

  function stepBoardAnimations(now=performance.now()){
    if(!boardAnimations.length) return;
    boardAnimations = boardAnimations.filter((entry) => (now - entry.start) < entry.duration);
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

    const topReserve = compact ? Math.floor(18 * dpr) : 0;
    const bottomReserve = 0;

    const targetW = Math.max(220, Math.floor(rect.width * dpr) - Math.floor((compact ? 10 : 8) * dpr));
    const targetH = Math.max(280, Math.floor(rect.height * dpr) - topReserve - bottomReserve - Math.floor((compact ? 2 : 8) * dpr));

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
    const canvasCssW = Math.floor(W / dpr);
    const canvasCssH = Math.floor(H / dpr);
    const boardOffset = Math.max(0, Math.floor((rect.width - canvasCssW) / 2));
    const stagePadTop = Math.floor(parseFloat(getComputedStyle(stageEl).paddingTop) || 0);
    if(compact){
      if(hudEl){
        hudEl.style.width = `${canvasCssW}px`;
        hudEl.style.maxWidth = `${canvasCssW}px`;
      }
      if(stageMissionBarEl){
        stageMissionBarEl.style.width = `${canvasCssW}px`;
        stageMissionBarEl.style.left = `${boardOffset}px`;
        stageMissionBarEl.style.right = "auto";
      }
    } else {
      if(hudEl){
        hudEl.style.removeProperty("width");
        hudEl.style.removeProperty("max-width");
      }
      if(stageMissionBarEl){
        stageMissionBarEl.style.removeProperty("width");
        stageMissionBarEl.style.removeProperty("left");
        stageMissionBarEl.style.removeProperty("right");
      }
    }
    if(toastEl){
      toastEl.style.left = `${boardOffset + Math.floor(canvasCssW / 2)}px`;
      toastEl.style.top = `${stagePadTop + Math.floor(canvasCssH / 2)}px`;
    }
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
  function roundRectPathFor(targetCtx, x, y, w, h, r){
    const rr = Math.min(r, w/2, h/2);
    targetCtx.beginPath();
    targetCtx.moveTo(x+rr, y);
    targetCtx.arcTo(x+w, y, x+w, y+h, rr);
    targetCtx.arcTo(x+w, y+h, x, y+h, rr);
    targetCtx.arcTo(x, y+h, x, y, rr);
    targetCtx.arcTo(x, y, x+w, y, rr);
    targetCtx.closePath();
  }
  function roundRectFillFor(targetCtx, x, y, w, h, r, color){
    roundRectPathFor(targetCtx, x, y, w, h, r);
    targetCtx.fillStyle = color;
    targetCtx.fill();
  }
  function roundRectStrokeFor(targetCtx, x, y, w, h, r, color, lineWidth=1){
    roundRectPathFor(targetCtx, x, y, w, h, r);
    targetCtx.strokeStyle = color;
    targetCtx.lineWidth = lineWidth;
    targetCtx.stroke();
  }

  function drawCashoutCoin(gx, gy){
    const cx = gx + cell / 2;
    const cy = gy + cell / 2;
    const radius = cell * 0.29;
    const gradient = ctx.createRadialGradient(cx - cell * 0.08, cy - cell * 0.1, cell * 0.05, cx, cy, radius);
    gradient.addColorStop(0, "#fff6c9");
    gradient.addColorStop(0.28, "#ffd86f");
    gradient.addColorStop(0.66, "#d79a20");
    gradient.addColorStop(1, "#8a5400");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = "rgba(255, 246, 206, 0.8)";
    ctx.lineWidth = Math.max(1.5, cell * 0.045);
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.96;
    ctx.fillStyle = "#714100";
    ctx.font = `900 ${Math.floor(cell * 0.26)}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", cx, cy + 1);
    ctx.restore();
  }

  function drawTurdGlyph(cx, cy, size){
    const s = size;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.2, s * 0.34, s * 0.2, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - s * 0.02, s * 0.26, s * 0.17, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - s * 0.18, s * 0.17, s * 0.12, 0, 0, Math.PI * 2);
    ctx.ellipse(cx, cy - s * 0.31, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#7b4322";
    ctx.fill();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(cx + s * 0.06, cy + s * 0.06, s * 0.24, s * 0.15, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "#f0b08d";
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath();
    ctx.arc(cx - s * 0.12, cy - s * 0.08, s * 0.12, Math.PI * 1.1, Math.PI * 1.88);
    ctx.stroke();
    ctx.restore();
  }

  function drawFloatingTile(gx, gy, tile, opts={}){
    const {
      alpha = 1,
      scale = 1
    } = opts;
    const specialMeta = SPECIAL_TILE_META[tile];
    const missionTile = MISSION_TILES.has(tile);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(gx + cell/2, gy + cell/2);
    ctx.scale(scale, scale);
    const ox = -cell/2;
    const oy = -cell/2;

    roundRectFill(ox+1, oy+1, cell-2, cell-2, 10, TILE_COLOR[tile] || "#ddd");

    if(specialMeta){
      ctx.save();
      ctx.globalAlpha *= 0.18;
      roundRectFill(ox+3, oy+3, cell-6, cell-6, 10, specialMeta.accent);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha *= 0.28;
    ctx.strokeStyle = specialMeta ? specialMeta.accent : "#ffffff";
    ctx.lineWidth = Math.max(1, Math.floor(cell * 0.06));
    roundRectStroke(ox+2, oy+2, cell-4, cell-4, 9);
    ctx.restore();

    if(missionTile){
      ctx.save();
      ctx.strokeStyle = "rgba(255, 209, 102, 0.9)";
      ctx.lineWidth = Math.max(1.5, Math.floor(cell * 0.06));
      roundRectStroke(ox+4, oy+4, cell-8, cell-8, 8);
      ctx.restore();
    }

    if(tile === TILE.CASHOUT){
      drawCashoutCoin(ox, oy);
      ctx.restore();
      return;
    }

    if(tile === TILE.SEEDER_TURD){
      drawTurdGlyph(0, 1, cell * 0.66);
      ctx.restore();
      return;
    }

    ctx.font = `${Math.floor(cell*0.66)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha *= 0.22;
    ctx.fillStyle = "#000";
    ctx.fillText(TILE_LABEL[tile] || "?", 1, 2);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = tile === TILE.CASHOUT ? "#6f4300" : "#fff";
    ctx.fillText(TILE_LABEL[tile] || "?", 0, 1);
    ctx.restore();
  }

  function drawBoardAnimations(px, now=performance.now()){
    if(!boardAnimations.length) return;
    ctx.save();
    for(const fx of boardAnimations){
      const t = clamp((now - fx.start) / fx.duration, 0, 1);
      if(fx.type === "clear"){
        const scale = 1 - t * 0.72;
        const alpha = 0.85 - t * 0.85;
        const gy = px + fx.y * cell - t * cell * 0.08;
        drawFloatingTile(px + fx.x * cell, gy, fx.tile, { alpha, scale });
        continue;
      }
      if(fx.type === "convert"){
        const gx = px + fx.x * cell;
        const gy = px + fx.y * cell;
        if(t < 0.45){
          drawFloatingTile(gx, gy, fx.fromTile, { alpha: 0.7 - t * 0.9, scale: 1 - t * 0.22 });
        } else {
          const reveal = (t - 0.45) / 0.55;
          drawFloatingTile(gx, gy, fx.toTile, { alpha: 0.35 + reveal * 0.65, scale: 0.84 + reveal * 0.2 });
        }
        continue;
      }
      if(fx.type === "fall"){
        const progress = easeOutCubic(t);
        const gx = px + fx.x * cell;
        const fromGy = px + fx.fromY * cell;
        const toGy = px + fx.toY * cell;
        const gy = fromGy + (toGy - fromGy) * progress;

        ctx.save();
        ctx.globalAlpha = 0.14 * (1 - t);
        ctx.strokeStyle = TILE_COLOR[fx.tile] || "#fff";
        ctx.lineWidth = Math.max(3, Math.floor(cell * 0.12));
        ctx.beginPath();
        ctx.moveTo(gx + cell/2, fromGy + cell/2);
        ctx.lineTo(gx + cell/2, toGy + cell/2);
        ctx.stroke();
        ctx.restore();

        drawFloatingTile(gx, gy, fx.tile, { alpha: 0.28 + (1 - t) * 0.26, scale: 0.96 });
      }
    }
    ctx.restore();
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

        if(!aboveTiles){
          const bg = p === POWER.EGG ? TILE_COLOR[TILE.SEEDER_EGG] : TILE_COLOR[TILE.SEEDER_TURD];
          ctx.globalAlpha = 0.62;
          roundRectFill(gx+4, gy+4, cell-8, cell-8, 9, bg);
          ctx.globalAlpha = 0.42;
          ctx.strokeStyle = accent;
          ctx.lineWidth = Math.max(1, Math.floor(cell*0.075));
          roundRectStroke(gx+4, gy+4, cell-8, cell-8, 9);
          if(p === POWER.EGG){
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = "#000";
            ctx.font = `${Math.floor(cell*0.46)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🥚", gx + cell/2 + 1, gy + cell/2 + 2);
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#fff";
            ctx.fillText("🥚", gx + cell/2, gy + cell/2 + 1);
          } else {
            ctx.globalAlpha = 1;
            drawTurdGlyph(gx + cell/2, gy + cell/2 + 1, cell * 0.66);
          }
        } else {
          const badgeW = Math.max(18, cell*0.32);
          const badgeH = Math.max(14, cell*0.22);
          ctx.globalAlpha = 0.95;
          roundRectFill(gx + cell - badgeW - 4, gy + 4, badgeW, badgeH, 7, accent);
          if(p === POWER.EGG){
            ctx.fillStyle = "#1d120a";
            ctx.font = `${Math.floor(cell*0.18)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🥚", gx + cell - badgeW/2 - 4, gy + 4 + badgeH/2 + 1);
          } else {
            drawTurdGlyph(gx + cell - badgeW/2 - 4, gy + 4 + badgeH/2 + 1, badgeH * 1.25);
          }
        }
      }
    }
    ctx.restore();
  }

  function drawTile(x,y,t,px,withEmoji){
    const gx = px + x*cell;
    const gy = px + y*cell;
    const specialMeta = SPECIAL_TILE_META[t];
    const missionTile = MISSION_TILES.has(t);

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

    if(missionTile){
      ctx.save();
      ctx.strokeStyle = "rgba(255, 209, 102, 0.95)";
      ctx.lineWidth = Math.max(2, Math.floor(cell*0.07));
      roundRectStroke(gx+4, gy+4, cell-8, cell-8, 8);
      ctx.globalAlpha = 0.34;
      ctx.strokeStyle = "rgba(255, 243, 193, 0.88)";
      ctx.lineWidth = Math.max(1, Math.floor(cell*0.035));
      roundRectStroke(gx+7, gy+7, cell-14, cell-14, 6);
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.strokeStyle = specialMeta ? specialMeta.accent : "#ffffff";
    ctx.lineWidth = Math.max(1, Math.floor(cell*(specialMeta ? 0.07 : 0.06)));
    roundRectStroke(gx+2, gy+2, cell-4, cell-4, 9);
    ctx.restore();

    if(withEmoji && t === TILE.CASHOUT){
      drawCashoutCoin(gx, gy);
      return;
    }

    if(withEmoji && t === TILE.SEEDER_TURD){
      drawTurdGlyph(gx + cell/2, gy + cell/2 + 1, cell * 0.68);
      return;
    }

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

  function drawRewardPulse(px){
    if(!hasRewardCoinOnBoard()) return;
    const pulse = (Math.sin(performance.now() / 180) + 1) / 2;
    ctx.save();
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if(!rewardMap[y][x]) continue;
        const gx = px + x * cell;
        const gy = px + y * cell;
        ctx.globalAlpha = 0.3 + pulse * 0.28;
        ctx.fillStyle = "#ffd86f";
        ctx.beginPath();
        ctx.arc(gx + cell/2, gy + cell/2, cell * (0.34 + pulse * 0.1), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.2 + pulse * 0.2;
        ctx.strokeStyle = `rgba(255, 214, 90, ${0.55 + pulse * 0.4})`;
        ctx.lineWidth = Math.max(2, Math.floor(cell * 0.08));
        roundRectStroke(gx + 2, gy + 2, cell - 4, cell - 4, 10);
        ctx.globalAlpha = 0.92;
        ctx.strokeStyle = `rgba(255, 247, 191, ${0.78 + pulse * 0.18})`;
        ctx.lineWidth = Math.max(2, Math.floor(cell * 0.05));
        roundRectStroke(gx + 5, gy + 5, cell - 10, cell - 10, 8);
        const badgeR = cell * 0.15;
        const badgeX = gx + cell * 0.77;
        const badgeY = gy + cell * 0.23;
        const coinGradient = ctx.createRadialGradient(badgeX - badgeR * 0.3, badgeY - badgeR * 0.35, badgeR * 0.1, badgeX, badgeY, badgeR);
        coinGradient.addColorStop(0, "#fff7cf");
        coinGradient.addColorStop(0.28, "#ffd76c");
        coinGradient.addColorStop(0.66, "#d89b1f");
        coinGradient.addColorStop(1, "#8a5400");
        ctx.globalAlpha = 1;
        ctx.fillStyle = coinGradient;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 245, 202, 0.82)";
        ctx.lineWidth = Math.max(1, cell * 0.03);
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeR * 0.74, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawProductTags(px){
    ctx.save();
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const token = productMap[y][x];
        if(!token) continue;
        const info = productTokenInfo.get(token);
        if(!info) continue;
        const gx = px + x * cell;
        const gy = px + y * cell;
        const badgeW = Math.max(20, cell * 0.34);
        const badgeH = Math.max(16, cell * 0.24);
        ctx.globalAlpha = 0.96;
        roundRectFill(gx + 4, gy + 4, badgeW, badgeH, 7, "rgba(255, 209, 102, 0.98)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#1d120a";
        ctx.font = `${Math.floor(cell*0.18)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(info.label, gx + 4 + badgeW/2, gy + 4 + badgeH/2 + 1);
      }
    }
    ctx.restore();
  }

  function drawShareTurdGlyph(targetCtx, cx, cy, s){
    targetCtx.save();
    targetCtx.beginPath();
    targetCtx.ellipse(cx, cy + s * 0.2, s * 0.34, s * 0.2, 0, 0, Math.PI * 2);
    targetCtx.ellipse(cx, cy - s * 0.02, s * 0.26, s * 0.17, 0, 0, Math.PI * 2);
    targetCtx.ellipse(cx, cy - s * 0.18, s * 0.17, s * 0.12, 0, 0, Math.PI * 2);
    targetCtx.ellipse(cx, cy - s * 0.31, s * 0.1, s * 0.08, 0, 0, Math.PI * 2);
    targetCtx.fillStyle = "#7b4322";
    targetCtx.fill();
    targetCtx.globalAlpha = 0.18;
    targetCtx.fillStyle = "#000";
    targetCtx.beginPath();
    targetCtx.ellipse(cx + s * 0.06, cy + s * 0.06, s * 0.24, s * 0.15, -0.3, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
  }

  function drawShareCoinGlyph(targetCtx, cx, cy, radius){
    const gradient = targetCtx.createRadialGradient(cx - radius * 0.28, cy - radius * 0.32, radius * 0.12, cx, cy, radius);
    gradient.addColorStop(0, "#fff7cf");
    gradient.addColorStop(0.28, "#ffd76c");
    gradient.addColorStop(0.66, "#d89b1f");
    gradient.addColorStop(1, "#8a5400");
    targetCtx.fillStyle = gradient;
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.strokeStyle = "rgba(255, 244, 201, 0.76)";
    targetCtx.lineWidth = Math.max(1, radius * 0.16);
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
    targetCtx.stroke();
  }

  function drawShareTile(targetCtx, gx, gy, tileSize, tile){
    const specialMeta = SPECIAL_TILE_META[tile];
    const missionTile = MISSION_TILES.has(tile);
    roundRectFillFor(targetCtx, gx+1, gy+1, tileSize-2, tileSize-2, 10, TILE_COLOR[tile] || "#ddd");

    if(specialMeta){
      targetCtx.save();
      targetCtx.globalAlpha = 0.16;
      roundRectFillFor(targetCtx, gx+3, gy+3, tileSize-6, tileSize-6, 10, specialMeta.accent);
      targetCtx.globalAlpha = 0.92;
      roundRectStrokeFor(targetCtx, gx+2, gy+2, tileSize-4, tileSize-4, 9, specialMeta.accent, Math.max(2, Math.floor(tileSize*0.08)));
      const badgeR = Math.max(8, tileSize * 0.14);
      targetCtx.globalAlpha = 0.98;
      targetCtx.fillStyle = specialMeta.accent;
      targetCtx.beginPath();
      targetCtx.arc(gx + tileSize - badgeR - 4, gy + badgeR + 4, badgeR, 0, Math.PI*2);
      targetCtx.fill();
      targetCtx.fillStyle = "#101014";
      targetCtx.font = `900 ${Math.floor(tileSize*0.22)}px system-ui`;
      targetCtx.textAlign = "center";
      targetCtx.textBaseline = "middle";
      targetCtx.fillText(specialMeta.badge, gx + tileSize - badgeR - 4, gy + badgeR + 5);
      targetCtx.restore();
    }

    if(missionTile){
      roundRectStrokeFor(targetCtx, gx+4, gy+4, tileSize-8, tileSize-8, 8, "rgba(255, 209, 102, 0.95)", Math.max(2, Math.floor(tileSize*0.07)));
      targetCtx.save();
      targetCtx.globalAlpha = 0.34;
      roundRectStrokeFor(targetCtx, gx+7, gy+7, tileSize-14, tileSize-14, 6, "rgba(255, 243, 193, 0.88)", Math.max(1, Math.floor(tileSize*0.035)));
      targetCtx.restore();
    }

    roundRectStrokeFor(targetCtx, gx+2, gy+2, tileSize-4, tileSize-4, 9, specialMeta ? specialMeta.accent : "rgba(255,255,255,0.26)", Math.max(1, Math.floor(tileSize*0.05)));

    if(tile === TILE.CASHOUT){
      drawShareCoinGlyph(targetCtx, gx + tileSize/2, gy + tileSize/2, tileSize * 0.28);
      return;
    }
    if(tile === TILE.SEEDER_TURD){
      drawShareTurdGlyph(targetCtx, gx + tileSize/2, gy + tileSize/2 + 1, tileSize * 0.68);
      return;
    }

    targetCtx.font = `${Math.floor(tileSize*0.62)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
    targetCtx.textAlign = "center";
    targetCtx.textBaseline = "middle";
    targetCtx.globalAlpha = 0.18;
    targetCtx.fillStyle = "#000";
    targetCtx.fillText(TILE_LABEL[tile] || "?", gx + tileSize/2 + 1, gy + tileSize/2 + 2);
    targetCtx.globalAlpha = 1;
    targetCtx.fillStyle = "#fff";
    targetCtx.fillText(TILE_LABEL[tile] || "?", gx + tileSize/2, gy + tileSize/2 + 1);
  }

  function drawShareOverlay(targetCtx, snapshot, bx, by, tileSize, aboveTiles=false){
    targetCtx.save();
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const power = snapshot.overlay[y][x];
        if(power === POWER.NONE) continue;
        const hasTile = snapshot.board[y][x] !== TILE.EMPTY;
        if(aboveTiles !== hasTile) continue;
        const gx = bx + x * tileSize;
        const gy = by + y * tileSize;
        const accent = power === POWER.EGG ? "#ffd84d" : "#ff6a5b";
        if(!aboveTiles){
          const bg = power === POWER.EGG ? TILE_COLOR[TILE.SEEDER_EGG] : TILE_COLOR[TILE.SEEDER_TURD];
          targetCtx.globalAlpha = 0.58;
          roundRectFillFor(targetCtx, gx+4, gy+4, tileSize-8, tileSize-8, 9, bg);
          targetCtx.globalAlpha = 0.38;
          roundRectStrokeFor(targetCtx, gx+4, gy+4, tileSize-8, tileSize-8, 9, accent, Math.max(1, Math.floor(tileSize*0.075)));
          if(power === POWER.EGG){
            targetCtx.globalAlpha = 0.9;
            targetCtx.font = `${Math.floor(tileSize*0.42)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
            targetCtx.textAlign = "center";
            targetCtx.textBaseline = "middle";
            targetCtx.fillStyle = "#fff";
            targetCtx.fillText("🥚", gx + tileSize/2, gy + tileSize/2 + 1);
          } else {
            targetCtx.globalAlpha = 0.92;
            drawShareTurdGlyph(targetCtx, gx + tileSize/2, gy + tileSize/2 + 1, tileSize * 0.62);
          }
        } else {
          const badgeW = Math.max(18, tileSize * 0.32);
          const badgeH = Math.max(14, tileSize * 0.22);
          targetCtx.globalAlpha = 0.92;
          roundRectFillFor(targetCtx, gx + tileSize - badgeW - 4, gy + 4, badgeW, badgeH, 7, accent);
          if(power === POWER.EGG){
            targetCtx.fillStyle = "#1d120a";
            targetCtx.font = `${Math.floor(tileSize*0.17)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
            targetCtx.textAlign = "center";
            targetCtx.textBaseline = "middle";
            targetCtx.fillText("🥚", gx + tileSize - badgeW/2 - 4, gy + 4 + badgeH/2 + 1);
          } else {
            drawShareTurdGlyph(targetCtx, gx + tileSize - badgeW/2 - 4, gy + 4 + badgeH/2 + 1, badgeH * 1.22);
          }
        }
      }
    }
    targetCtx.restore();
  }

  function drawShareRewardMarkers(targetCtx, snapshot, bx, by, tileSize){
    targetCtx.save();
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if(!snapshot.rewardMap[y][x]) continue;
        const gx = bx + x * tileSize;
        const gy = by + y * tileSize;
        targetCtx.globalAlpha = 0.35;
        targetCtx.fillStyle = "#ffd86f";
        targetCtx.beginPath();
        targetCtx.arc(gx + tileSize/2, gy + tileSize/2, tileSize * 0.36, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.globalAlpha = 0.9;
        roundRectStrokeFor(targetCtx, gx + 2, gy + 2, tileSize - 4, tileSize - 4, 10, "rgba(255, 214, 90, 0.9)", Math.max(2, Math.floor(tileSize * 0.07)));
        roundRectStrokeFor(targetCtx, gx + 6, gy + 6, tileSize - 12, tileSize - 12, 8, "rgba(255, 247, 191, 0.9)", Math.max(1, Math.floor(tileSize * 0.04)));
        drawShareCoinGlyph(targetCtx, gx + tileSize * 0.78, gy + tileSize * 0.23, tileSize * 0.11);
      }
    }
    targetCtx.restore();
  }

  function drawShareProductTags(targetCtx, snapshot, bx, by, tileSize){
    targetCtx.save();
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const token = snapshot.productMap[y][x];
        if(!token) continue;
        const info = snapshot.productTokenInfo.get(token);
        if(!info) continue;
        const gx = bx + x * tileSize;
        const gy = by + y * tileSize;
        const badgeW = Math.max(20, tileSize * 0.34);
        const badgeH = Math.max(16, tileSize * 0.24);
        roundRectFillFor(targetCtx, gx + 4, gy + 4, badgeW, badgeH, 7, "rgba(255, 209, 102, 0.98)");
        targetCtx.fillStyle = "#1d120a";
        targetCtx.font = `${Math.floor(tileSize*0.18)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
        targetCtx.textAlign = "center";
        targetCtx.textBaseline = "middle";
        targetCtx.fillText(info.label, gx + 4 + badgeW/2, gy + 4 + badgeH/2 + 1);
      }
    }
    targetCtx.restore();
  }

  function drawShareBoard(targetCtx, snapshot, bx, by, tileSize){
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const gx = bx + x * tileSize;
        const gy = by + y * tileSize;
        targetCtx.globalAlpha = 0.26;
        targetCtx.fillStyle = "#f5f7fb";
        targetCtx.fillRect(gx+2, gy+2, tileSize-4, tileSize-4);
        targetCtx.globalAlpha = 1;
      }
    }
    drawShareOverlay(targetCtx, snapshot, bx, by, tileSize, false);
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const tile = snapshot.board[y][x];
        if(tile !== TILE.EMPTY) drawShareTile(targetCtx, bx + x * tileSize, by + y * tileSize, tileSize, tile);
      }
    }
    drawShareRewardMarkers(targetCtx, snapshot, bx, by, tileSize);
    drawShareProductTags(targetCtx, snapshot, bx, by, tileSize);
    drawShareOverlay(targetCtx, snapshot, bx, by, tileSize, true);
  }

  async function buildShareImageBlob(){
    const snapshot = shareSnapshot || captureShareSnapshot();
    const card = document.createElement("canvas");
    card.width = 1200;
    card.height = 1600;
    const targetCtx = card.getContext("2d");

    const bg = targetCtx.createLinearGradient(0, 0, 0, card.height);
    bg.addColorStop(0, "#0b0b10");
    bg.addColorStop(0.55, "#060608");
    bg.addColorStop(1, "#040405");
    targetCtx.fillStyle = bg;
    targetCtx.fillRect(0, 0, card.width, card.height);

    const outerPad = 64;
    roundRectFillFor(targetCtx, outerPad, 48, card.width - outerPad*2, card.height - 96, 30, "rgba(9, 9, 14, 0.92)");
    roundRectStrokeFor(targetCtx, outerPad, 48, card.width - outerPad*2, card.height - 96, 30, "rgba(255,255,255,0.07)", 2);

    const missionBonus = mission && mission.done ? mission.cashBonus : 0;
    const groupScore = Math.max(0, score|0);
    const totalScore = groupScore + missionBonus;

    targetCtx.fillStyle = "#f2ede2";
    targetCtx.font = "900 62px system-ui, -apple-system, sans-serif";
    targetCtx.textAlign = "left";
    targetCtx.fillText("Angry Wolves", 108, 132);

    targetCtx.fillStyle = "#ffd166";
    targetCtx.font = "900 46px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(runEndTitle || "Run Over", 108, 190);

    targetCtx.fillStyle = "#7dd3fc";
    targetCtx.font = "700 27px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(shareBragLine(), 108, 232);

    targetCtx.fillStyle = "#f2ede2";
    targetCtx.font = "700 34px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(mission?.title ?? snapshot.missionTitle ?? "Barn Trouble", 108, 286);

    targetCtx.fillStyle = "#ffd166";
    targetCtx.font = "900 38px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(`${groupScore} group + ${missionBonus} bonus = ${totalScore}`, 108, 342);

    targetCtx.fillStyle = "#b9af9f";
    targetCtx.font = "600 25px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(`Pace ${level} · Groups ${herdsCleared} · Best chain ${fmtChain(bestCombo)}`, 108, 384);
    targetCtx.fillText(bestGroupPlain(bestHerd), 108, 420);

    const boardWrapX = 92;
    const boardWrapY = 474;
    const boardWrapW = card.width - boardWrapX * 2;
    const boardWrapH = card.height - boardWrapY - 190;
    roundRectFillFor(targetCtx, boardWrapX, boardWrapY, boardWrapW, boardWrapH, 24, "#050507");
    roundRectStrokeFor(targetCtx, boardWrapX, boardWrapY, boardWrapW, boardWrapH, 24, "rgba(255,255,255,0.06)", 2);
    const boardCell = Math.floor(Math.min((boardWrapW - 44) / COLS, (boardWrapH - 44) / ROWS));
    const boardPixelW = boardCell * COLS;
    const boardPixelH = boardCell * ROWS;
    const boardX = Math.floor(boardWrapX + (boardWrapW - boardPixelW) / 2);
    const boardY = Math.floor(boardWrapY + (boardWrapH - boardPixelH) / 2);
    drawShareBoard(targetCtx, snapshot, boardX, boardY, boardCell);

    targetCtx.fillStyle = "#7dd3fc";
    targetCtx.font = "700 24px system-ui, -apple-system, sans-serif";
    targetCtx.textAlign = "center";
    targetCtx.fillText(`Play it here: ${shareUrl()}`, card.width / 2, card.height - 74);

    return await new Promise((resolve, reject) => {
      card.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not build share image.")), "image/png");
    });
  }

  async function copyShareText(text){
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(text);
      return;
    }
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }

  async function shareResults(){
    const missionBonus = mission && mission.done ? mission.cashBonus : 0;
    const groupScore = Math.max(0, score|0);
    const totalScore = groupScore + missionBonus;
    const title = `Angry Wolves · ${mission?.title ?? "Barn Trouble"}`;
    const text = `${shareBragLine()}\nMission: ${mission?.title ?? "Barn Trouble"}\n${groupScore} group score + ${missionBonus} bonus = ${totalScore}\nPlay here: ${shareUrl()}`;

    if(shareButton) shareButton.disabled = true;
    try{
      if(navigator.share){
        try{
          const blob = await buildShareImageBlob();
          const file = new File([blob], "angry-wolves-result.png", { type: "image/png" });
          if(navigator.canShare?.({ files: [file] })){
            await navigator.share({ title, text, files: [file] });
            return;
          }
        }catch{}
        await navigator.share({ title, text, url: shareUrl() });
        return;
      }
      await copyShareText(text);
      showToast("Share text copied.", 1450);
    }catch(err){
      if(err && err.name === "AbortError") return;
      try{
        await copyShareText(text);
        showToast("Share text copied.", 1450);
      }catch{
        showToast("Share failed.", 1450);
      }
    }finally{
      if(shareButton) shareButton.disabled = false;
    }
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
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "#f5f7fb";
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

    drawRewardPulse(px);
    drawProductTags(px);

    drawOverlay(px, true);
    drawBoardAnimations(px);

    if(current && !paused){
      const gy = getGhostY(current);
      drawShadow(current, 0, gy-current.y, px);
    }
    if(current) drawPiece(current,0,0,px);

    stepParticles();
    drawParticles();

  }

  function clearHoldTouchTimer(){
    if(!holdTouchTimer) return;
    clearTimeout(holdTouchTimer);
    holdTouchTimer = null;
  }

  function executeTapMove(clientX){
    const rect = canvas.getBoundingClientRect();
    const mid = rect.left + rect.width/2;
    move(clientX < mid ? -1 : 1);
  }

  function flushPendingTap(now=performance.now()){
    if(!pendingTap || gesture) return;
    if(now - pendingTap.t < DOUBLE_TAP_MS) return;
    const tap = pendingTap;
    pendingTap = null;
    executeTapMove(tap.x);
  }

  function armHoldTouchGesture(){
    clearHoldTouchTimer();
    if(!gesture?.touchLike || paused || gameOver || holdUsed || !current) return;
    holdTouchTimer = setTimeout(() => {
      if(!gesture) return;
      const drift = Math.hypot(gesture.lastX - gesture.startX, gesture.lastY - gesture.startY);
      if(drift > HOLD_MOVE_CANCEL || gesture.rotated) return;
      holdCurrent();
      gesture = null;
      holdTouchTimer = null;
      draw();
    }, HOLD_TOUCH_MS);
  }

  // ===== Tap/Swipe behavior =====
  // Tap: move only (left/right half)
  // Double tap or press and hold: hold/swap current piece
  // Swipe up-left / up-right within a narrow cone: rotate only
  function onPointerDown(e){
    e.preventDefault();
    unlockAudioSilently();
    const now = performance.now();
    const touchLike = e.pointerType === "touch" || e.pointerType === "pen" || (!e.pointerType && IS_TOUCH);
    flushPendingTap(now);
    const priorTap = touchLike && pendingTap && (now - pendingTap.t) < DOUBLE_TAP_MS ? pendingTap : null;
    if(priorTap) pendingTap = null;
    gesture = {
      startX: e.clientX,
      startY: e.clientY,
      lastX:  e.clientX,
      lastY:  e.clientY,
      movedX: 0,
      movedY: 0,
      t0: now,
      rotated: false,
      priorTap,
      touchLike
    };
    armHoldTouchGesture();
  }

  function onPointerMove(e){
    if(!gesture?.touchLike) return;

    const nx = e.clientX, ny = e.clientY;
    const dx = nx - gesture.lastX;
    const dy = ny - gesture.lastY;

    gesture.lastX = nx; gesture.lastY = ny;
    gesture.movedX += dx;
    gesture.movedY += dy;

    const totalDx = nx - gesture.startX;
    const totalDy = ny - gesture.startY;
    const upDist  = -totalDy;
    const rotateAngle = upDist > 0 ? (Math.atan2(Math.abs(totalDx), upDist) * 180 / Math.PI) : 90;
    const rotateIntent = upDist >= 8 && rotateAngle <= ROTATE_INTENT_ANGLE;
    if(Math.hypot(totalDx, totalDy) > HOLD_MOVE_CANCEL) clearHoldTouchTimer();

    if(!rotateIntent){
      while(gesture.movedX <= -STEP_X){ move(-1); gesture.movedX += STEP_X; }
      while(gesture.movedX >=  STEP_X){ move( 1); gesture.movedX -= STEP_X; }
      while(gesture.movedY >=  STEP_Y){ dropOne(); gesture.movedY -= STEP_Y; }
    }

    if(!gesture.rotated && upDist >= SWIPE_UP_MIN && rotateAngle <= ROTATE_ANGLE_MAX && Math.abs(totalDx) >= ROTATE_SIDE_MIN){
      const rotated = rotate(totalDx > 0);
      if(rotated) triggerTouchRotateSlowdown();
      gesture.rotated = true;
      gesture.movedX = 0;
      gesture.movedY = 0;
      clearHoldTouchTimer();
      return;
    }
  }

  function onPointerUp(e){
    e.preventDefault();
    clearHoldTouchTimer();
    if(!gesture) return;

    const dt   = performance.now() - gesture.t0;
    const dist = Math.hypot(e.clientX - gesture.startX, e.clientY - gesture.startY);
    const priorTap = gesture.priorTap;
    const rotated = gesture.rotated;
    const touchLike = gesture.touchLike;

    if(!touchLike){
      if(dt < 260 && dist < 10 && !rotated) executeTapMove(e.clientX);
      gesture = null;
      return;
    }

    if(dt < 260 && dist < 10 && !rotated){
      if(priorTap && Math.hypot(e.clientX - priorTap.x, e.clientY - priorTap.y) <= DOUBLE_TAP_SLOP){
        holdCurrent();
      } else {
        pendingTap = { x: e.clientX, y: e.clientY, t: performance.now() };
      }
    } else if(priorTap){
      pendingTap = priorTap;
      flushPendingTap(performance.now());
    }

    gesture = null;
  }

  canvas.addEventListener("pointerdown", onPointerDown, {passive:false});
  canvas.addEventListener("pointermove", onPointerMove, {passive:true});
  canvas.addEventListener("pointerup",   onPointerUp,   {passive:false});
  canvas.addEventListener("pointercancel", () => {
    clearHoldTouchTimer();
    if(gesture?.priorTap){
      pendingTap = gesture.priorTap;
      flushPendingTap(performance.now());
    }
    gesture = null;
  });
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
    helpPrimary.innerHTML = "<b>Touch:</b> tap a side nudge · drag ←/→ move · drag ↓ drop · swipe ↑↖/↑↗ rotate · double tap or press and hold = hold";
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
  function canTouchScroll(target){
    return !!(target instanceof Element && target.closest(".helpScroll"));
  }
  if(IS_TOUCH){
    document.addEventListener("touchmove", (e) => {
      if(!e.cancelable) return;
      if(canTouchScroll(e.target)) return;
      e.preventDefault();
    }, { passive:false, capture:true });
  }
  if(restartButton){
    restartButton.addEventListener("click", () => {
      setOverlayOpen(gameOverBackdrop, false);
      restart();
    });
  }
  if(closeGameOverButton){
    closeGameOverButton.addEventListener("click", closeGameOverPanel);
  }
  if(gameOverBackdrop){
    gameOverBackdrop.addEventListener("click", (e) => {
      if(e.target === gameOverBackdrop) closeGameOverPanel();
    });
  }
  if(shareButton){
    shareButton.addEventListener("click", shareResults);
  }
  if(stageStartButton){
    stageStartButton.addEventListener("click", restart);
  }
  if(stageResultsButton){
    stageResultsButton.addEventListener("click", openGameOverPanel);
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
    flushPendingTap(now);
    stepBoardAnimations(now);
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
    } else if(particles.length || boardAnimations.length || (mission && mission.ready && !mission.done && hasRewardCoinOnBoard())){
      draw();
    }
  }

  // ===== Restart =====
  function restart(){
    clearHoldTouchTimer();
    gesture = null;
    board = makeBoard();
    sprinkleOverlayGeometric();
    clearRewardMap();
    clearProductMarks();
    mission = newMission();
    missionSpecialCharge = 0;
    missionSpecialPending = false;
    queuedMissionSpecial = null;
    cashoutCharge = 0;
    rewardCountdown = null;
    runEndTitle = "Run Over";
    runEndNote = "The barn got crowded.";
    score=0; level=1; locks=0; herdsCleared=0;
    bestHerd = null;
    held=null; currentCombo=0; bestCombo=0; holdUsed=false;
    fallInterval = BASE_FALL_MS;
    fallTimer = 0;
    rotateSlowUntil = 0;
    rotateSlowUses = 4;
    ambienceClock = 0;
    paused=false; gameOver=false;
    current=null; next=null;
    particles=[]; boardAnimations=[]; banner={text:"",t:0,ttl:900};
    pendingTap = null;
    lastMissionMeterAudio = null;
    setOverlayOpen(modalBackdrop, false);
    setOverlayOpen(gameOverBackdrop, false);
    setOverlayOpen(missionBriefBackdrop, false);
    next = newPiece();
    spawnNext();
    rememberShareSnapshot();
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
    renderHelpSpecials();

    sprinkleOverlayGeometric();
    clearRewardMap();
    clearProductMarks();
    mission = newMission();
    missionSpecialCharge = 0;
    missionSpecialPending = false;
    queuedMissionSpecial = null;
    cashoutCharge = 0;
    rewardCountdown = null;
    bestHerd = null;
    lastMissionMeterAudio = null;
    pendingTap = null;
    boardAnimations = [];

    next = newPiece();
    spawnNext();
    rememberShareSnapshot();

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
