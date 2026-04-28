(() => {
  // =========================
  // Angry Wolves — game.js
  // Tap left/right halves = move
  // Swipe up = rotate
  // Press and hold = hold
  // =========================

  // ===== Config =====
  function runtimeFlag(name, fallback=false){
    try{
      const params = new URLSearchParams(window.location.search);
      if(params.has(name)){
        const value = String(params.get(name) || "").toLowerCase();
        return !["0", "false", "off", "no"].includes(value);
      }
      return fallback;
    }catch{
      return fallback;
    }
  }
  function runtimeNumber(name, fallback){
    try{
      const params = new URLSearchParams(window.location.search);
      if(!params.has(name)) return fallback;
      const value = Number(params.get(name));
      return Number.isFinite(value) ? value : fallback;
    }catch{
      return fallback;
    }
  }
  function runtimeParam(name, fallback=""){
    try{
      const params = new URLSearchParams(window.location.search);
      if(!params.has(name)) return fallback;
      return String(params.get(name) || fallback).trim();
    }catch{
      return fallback;
    }
  }

  const REFRESH_V2_DEFAULT_ENABLED = true;
  const REFRESH_V2_FORCED_LEGACY = runtimeFlag("v1", false) || runtimeFlag("legacy", false);
  const REFRESH_V2_ENABLED = !REFRESH_V2_FORCED_LEGACY && runtimeFlag("v2", REFRESH_V2_DEFAULT_ENABLED);
  const SIMPLE_HERD_GRAVITY_ENABLED = REFRESH_V2_ENABLED && runtimeFlag("simpleHerdGravity", true);
  const FARM_BOARD_RENDERER_ENABLED = REFRESH_V2_ENABLED && runtimeFlag("farmBoard", true);
  const VECTOR_ANIMAL_TOKENS_ENABLED = REFRESH_V2_ENABLED && runtimeFlag("vectorAnimals", true);
  const HUMOR_AUDIO_ENABLED = REFRESH_V2_ENABLED && runtimeFlag("humorAudio", true);
  const V2_ONBOARDING_ENABLED = REFRESH_V2_ENABLED && runtimeFlag("v2Onboarding", true);
  const DEBUG_SCORE = runtimeFlag("debugScore", false);
  const AUDIO_DEBUG = runtimeFlag("audioDebug", false);
  const AUDIO_RESET = runtimeFlag("audioReset", false);
  // Query-only helpers for review screenshots; all are off by default.
  const DEBUG_MISSION_ID = runtimeParam("debugMission", "");
  const DEBUG_SPECIAL_ID = runtimeParam("debugSpecial", "");
  const DEBUG_BOARD = runtimeParam("debugBoard", "");
  const DEBUG_SLOW = runtimeFlag("debugSlow", false);

  const LEGACY_COLS = 10;
  const LEGACY_ROWS = 13;
  const V2_COLS = 9;
  const V2_ROWS = 12;
  const COLS = REFRESH_V2_ENABLED ? V2_COLS : LEGACY_COLS;
  const ROWS = REFRESH_V2_ENABLED ? V2_ROWS : LEGACY_ROWS;
  const CLEAR_THRESHOLD = 10;
  const V2_CLEAR_THRESHOLD = Math.max(8, Math.min(10, Math.round(runtimeNumber("herdThreshold", 9))));
  const ACTIVE_CLEAR_THRESHOLD = REFRESH_V2_ENABLED ? V2_CLEAR_THRESHOLD : CLEAR_THRESHOLD;
  const BIG_GROUP_THRESHOLD = REFRESH_V2_ENABLED ? 11 : 13;
  const V2_NEAR_CLEAR_MARGIN = 2;
  const V2_HERD_HINT_MAX_GROUPS = 3;
  const V2_HERD_SCORE_PER_TILE = 5;
  const V2_HERD_SCORE_EXTRA_PER_TILE = 8;
  const V2_EGG_MULTIPLIER_PER_EGG = 0.2;
  const V2_EGG_MULTIPLIER_CAP_EGGS = 4;
  const V2_TURD_PENALTY_PER_TURD = 0.18;
  const V2_TURD_PENALTY_CAP_TURDS = 3;
  const V2_TURD_MIN_MULTIPLIER = 0.55;
  const V2_CHAIN_BONUS_BASE = 18;
  const V2_CHAIN_BONUS_STEP = 9;
  const V2_CHAIN_BONUS_CAP = 120;
  const V2_GHOST_TOKEN_ALPHA = 0.24;
  const V2_GHOST_TOKEN_BASE_ALPHA = 0.52;
  const V2_GHOST_CELL_FILL = "rgba(234, 222, 176, 0.035)";
  const V2_GHOST_CELL_STROKE = "rgba(238, 226, 184, 0.42)";
  const V2_GHOST_CELL_LINE_WIDTH = 0.018;
  const V2_DROP_LANE_TOP_ALPHA = 0.015;
  const V2_DROP_LANE_BOTTOM_ALPHA = 0.055;
  const V2_BOARD_CELL_NUDGE_PX = 1;
  const DEFAULT_SFX_VOLUME = 0.65;

  const LEGACY_BASE_FALL_MS = 650;
  const V2_BASE_FALL_MS = DEBUG_SLOW ? 1300 : 800;
  const V2_SETTLED_BASE_FALL_MS = LEGACY_BASE_FALL_MS;
  const BASE_FALL_MS = REFRESH_V2_ENABLED ? V2_BASE_FALL_MS : LEGACY_BASE_FALL_MS;
  const MIN_FALL_MS  = 120;
  const LEVEL_EVERY_LOCKS = 12;
  const V2_OPENING_RAMP_GRACE_LOCKS = 6;
  const V2_POST_HERD_RAMP_GRACE_LOCKS = 3;
  const V2_BASE_FALL_BLEND_LOCKS = LEVEL_EVERY_LOCKS * 2;

  const USE_REVISED_MISSION_DECK = true;
  const USE_MISSION_ONLY_SPECIALS = true;
  const USE_WEIGHTED_MISSION_SPECIALS = true;
  const USE_ANGRY_WOLVES_MISSION = true;
  const USE_NEW_TOUCH_CONTROLS = true;
  const USE_ENHANCED_CHAOS_AUDIO = true;
  const USE_TUNED_CLUTTER_SPAWNS = true;
  const USE_MISSION_BRIEF_SPECIAL_CARDS = true;
  const USE_BRIEF_HELP_SHORTCUT = true;
  const USE_IOS_AUDIO_RESUME_FIXES = true;

  // touch movement + gesture tuning
  const TOUCH_MOVE_STEP_X = USE_NEW_TOUCH_CONTROLS ? 18 : 22;
  const TOUCH_MOVE_STEP_Y = USE_NEW_TOUCH_CONTROLS ? 20 : 22;
  const TOUCH_ROTATE_SWIPE_MIN = USE_NEW_TOUCH_CONTROLS ? 22 : 26;
  const UP_DOMINANCE = 1.08;
  const TOUCH_HOLD_SWAP_MS = USE_NEW_TOUCH_CONTROLS ? 250 : 320;
  const TOUCH_HOLD_CANCEL_PX = USE_NEW_TOUCH_CONTROLS ? 16 : 12;
  const USE_DOUBLE_TAP_SWAP = !USE_NEW_TOUCH_CONTROLS;
  const DOUBLE_TAP_MS = 260;
  const DOUBLE_TAP_SLOP = 28;
  const TOUCH_ROTATE_ANGLE_MAX = USE_NEW_TOUCH_CONTROLS ? 34 : 30;
  const TOUCH_ROTATE_INTENT_ANGLE = USE_NEW_TOUCH_CONTROLS ? 48 : 42;
  const TOUCH_TAP_MAX_MS = USE_NEW_TOUCH_CONTROLS ? 220 : 260;
  const ROTATE_SIDE_MIN = 4;
  const V2_ONBOARDING_STORAGE_KEY = "angry-wolves-v2-onboarding-seen";
  const V2_RUNS_STARTED_KEY = "angry-wolves-v2-runs-started";
  const BOARD_CLEAR_ANIM_MS = 430;
  const BOARD_CONVERT_PREVIEW_ANIM_MS = 140;
  const BOARD_CONVERT_ANIM_MS = 520;
  const BOARD_FALL_ANIM_MS = 430;
  const BOARD_PHASE_GAP_MS = 132;
  const CLEAR_AUDIO_STAGGER_MS = 72;
  const RUN_END_REVEAL_MIN_MS = 4600;
  const SHARE_GRID_COLS = 6;
  const SHARE_GRID_ROWS = 6;
  const GAME_MODE = REFRESH_V2_ENABLED ? "v2-prototype" : "standard";
  // Optional score/version tag sent to the leaderboard backend.
  const GAME_VERSION = REFRESH_V2_ENABLED ? "v0.36-v2-ios-audio-share" : "v0.27";
  // Paste your deployed Google Apps Script web app URL here.
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAgQNERb-xsiBTOT7PqjcV1afxD4GGASoop3MCFMh93XAYkk8RXqodP324iW0HpsLHPQ/exec";
  const LEADERBOARD_PREVIEW_LIMIT = 5;
  const LEADERBOARD_FULL_LIMIT = 20;
  const LEADERBOARD_CACHE_MS = 15000;
  const SCORE_NAME_MAX = 10;
  const PLAYER_NAME_STORAGE_KEY = "angry-wolves-player-name";

  const LEGACY_GLOBAL_SPECIAL_SPAWN_WEIGHTS = Object.freeze({
    normal: 0.88,
    blackSheep: 0.08,
    wolves: 0.04
  });
  const ACTIVE_GLOBAL_SPECIAL_SPAWN_WEIGHTS = USE_MISSION_ONLY_SPECIALS
    ? Object.freeze({ normal: 1, blackSheep: 0, wolves: 0 })
    : LEGACY_GLOBAL_SPECIAL_SPAWN_WEIGHTS;

  const LEGACY_CLUTTER_TUNING = Object.freeze({
    startEggs: 8,
    startTurds: 5,
    restockEggChance: 0.5,
    restockTurdChance: 0.5,
    maxEggRestock: 99,
    maxTurdRestock: 99,
    eggSoftCap: 999,
    turdSoftCap: 999,
    totalSoftCap: 999,
    chaosOverflowAllowance: 0
  });
  const TUNED_CLUTTER_TUNING = Object.freeze({
    startEggs: 9,
    startTurds: 9,
    restockEggChance: 0.58,
    restockTurdChance: 0.46,
    maxEggRestock: 4,
    maxTurdRestock: 3,
    eggSoftCap: 15,
    turdSoftCap: 12,
    totalSoftCap: 24,
    chaosOverflowAllowance: 3
  });
  const ACTIVE_CLUTTER_TUNING = USE_TUNED_CLUTTER_SPAWNS ? TUNED_CLUTTER_TUNING : LEGACY_CLUTTER_TUNING;

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
    BUNKER: 22,
    SALT: 23,
    RAIN: 24,
    ROOSTER: 25,
    CRATE: 26,
  };

  const POWER = { NONE:0, EGG:1, TURD:2, MUD:3 };
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
    [TILE.BUNKER]: "🧨",
    [TILE.SALT]: "🧂",
    [TILE.RAIN]: "🪣",
    [TILE.ROOSTER]: "📣",
    [TILE.CRATE]: "📦",
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
    [TILE.BUNKER]: "#ff6b66",
    [TILE.SALT]: "#f4f6ff",
    [TILE.RAIN]: "#99ddff",
    [TILE.ROOSTER]: "#ffb86a",
    [TILE.CRATE]: "#c8874d",
  };

  const VECTOR_TOKEN_META = {
    [TILE.SHEEP]: { base: "#f5f0df", shade: "#d8d1ba", ink: "#4b3d33", accent: "#fffaf0" },
    [TILE.GOAT]: { base: "#d8ad78", shade: "#9a6840", ink: "#3c281c", accent: "#f0d6ad" },
    [TILE.CHICKEN]: { base: "#f4ca55", shade: "#c78329", ink: "#4a2c15", accent: "#f15b3d" },
    [TILE.COW]: { base: "#f1ead8", shade: "#24201d", ink: "#2c241d", accent: "#d6b17c" },
    [TILE.PIG]: { base: "#ef9db1", shade: "#bf5f78", ink: "#5d2b39", accent: "#ffd0dc" },
    [TILE.WOLF]: { base: "#68717e", shade: "#343a44", ink: "#171a20", accent: "#f0d19d" },
    [TILE.BLACK_SHEEP]: { base: "#252733", shade: "#111219", ink: "#f1ead8", accent: "#8ee6ff" }
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
    [TILE.FEED]: { accent: "#b8f2a8", badge: "✦" },
    [TILE.BUNKER]: { accent: "#ffcf9f", badge: "✹" },
    [TILE.SALT]: { accent: "#e4ecff", badge: "↘" },
    [TILE.RAIN]: { accent: "#9ae3ff", badge: "≈" },
    [TILE.ROOSTER]: { accent: "#ffd08c", badge: "!" },
    [TILE.CRATE]: { accent: "#ffc78b", badge: "¤" }
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
    TILE.BUNKER,
    TILE.SALT,
    TILE.RAIN,
    TILE.ROOSTER,
    TILE.CRATE,
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
    BUNKER_O:     { matrix:[[1,1],[1,1]], tile:TILE.BUNKER, rotates:false },
    PACK_HOWL_L:  { matrix:[[1,0,0],[1,1,1],[0,0,0]], tile:TILE.WOLF, rotates:true },
    SALT_T:       { matrix:[[1,1,1],[0,1,0],[0,0,0]], tile:TILE.SALT, rotates:true },
    RAIN_O:       { matrix:[[1,1],[1,1]], tile:TILE.RAIN, rotates:false },
    ROOSTER_L:    { matrix:[[1,0,0],[1,1,1],[0,0,0]], tile:TILE.ROOSTER, rotates:true },
    CRATE_S:      { matrix:[[0,1,1],[1,1,0],[0,0,0]], tile:TILE.CRATE, rotates:true },
    EGG_SPREAD_L: { matrix:[[1,0,0],[1,1,1],[0,0,0]], tile:TILE.SEEDER_EGG, rotates:true },
    MUCK_WAGON_Z: { matrix:[[1,1,0],[0,1,1],[0,0,0]], tile:TILE.SEEDER_TURD, rotates:true },
    PRODUCE_O:    { matrix:[[1,1],[1,1]], rotates:false },
    CASHOUT_1:    { matrix:[[1]], tile:TILE.CASHOUT, rotates:false }
  };

  // ===== DOM =====
  const appEl = document.getElementById("app");
  const stageEl = document.getElementById("stage");
  const hudEl = document.getElementById("hud");
  const stageMissionBarEl = document.getElementById("stageMissionBar");
  const stageCopyrightEl = document.getElementById("stageCopyright");
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");

  const scoreEl  = document.getElementById("score");
  const levelEl  = document.getElementById("level");
  const clearsEl = document.getElementById("clears");
  const comboEl = document.getElementById("combo");
  const comboBestEl = document.getElementById("comboBest");
  const nextCardEl = document.getElementById("nextCard");
  const nextCardHintEl = document.getElementById("nextCardHint");
  const nextPreviewEl = document.getElementById("nextPreview");
  const holdPreviewEl = document.getElementById("holdPreview");
  const holdButton = document.getElementById("holdButton");
  const holdButtonHintEl = holdButton ? holdButton.querySelector(".planHint") : null;
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
  const missionDrawerToggle = document.getElementById("missionDrawerToggle");
  const missionDrawerEl = document.getElementById("missionDrawer");
  const missionDrawerTitleEl = document.getElementById("missionDrawerTitle");
  const missionDrawerBodyEl = document.getElementById("missionDrawerBody");
  const missionDrawerObjectiveEl = document.getElementById("missionDrawerObjective");
  const missionDrawerRewardEl = document.getElementById("missionDrawerReward");
  const missionDrawerRuleEl = document.getElementById("missionDrawerRule");
  const missionDrawerSpecialInfoEl = document.getElementById("missionDrawerSpecialInfo");
  const missionDrawerSpecialsEl = document.getElementById("missionDrawerSpecials");
  const missionDrawerHelpButton = document.getElementById("missionDrawerHelpButton");
  const missionDrawerActionButton = document.getElementById("missionDrawerActionButton");
  const missionSpecialNameEl = document.getElementById("missionSpecialName");
  const missionSpecialInfoEl = document.getElementById("missionSpecialInfo");
  const missionSpecialPreviewEl = document.getElementById("missionSpecialPreview");

  const gear = document.getElementById("gear");
  const leaderboardButton = document.getElementById("leaderboardButton");
  const helpButton = document.getElementById("helpButton");
  const wolfHowlButton = document.getElementById("wolfHowlButton");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const closeModal = document.getElementById("closeModal");
  const soundToggle = document.getElementById("soundToggle");
  const sfxVolumeInput = document.getElementById("sfxVolume");
  const sfxVolumeValueEl = document.getElementById("sfxVolumeValue");
  const goofyToggle = document.getElementById("goofyToggle");
  const testSoundButton = document.getElementById("testSoundButton");
  const gameOverBackdrop = document.getElementById("gameOverBackdrop");
  const restartButton = document.getElementById("restartButton");
  const shareButton = document.getElementById("shareButton");
  const closeGameOverButton = document.getElementById("closeGameOverButton");
  const gameOverTitleEl = document.getElementById("gameOverTitle");
  const gameOverNoteEl = document.getElementById("gameOverNote");
  const scoreSubmitSectionEl = document.getElementById("scoreSubmitSection");
  const scoreSubmitRowEl = scoreSubmitSectionEl ? scoreSubmitSectionEl.querySelector(".leaderboardSubmitRow") : null;
  const scoreSubmitHintEl = document.getElementById("scoreSubmitHint");
  const scoreNameInputEl = document.getElementById("scoreNameInput");
  const scoreSubmitButton = document.getElementById("scoreSubmitButton");
  const scoreSkipButton = document.getElementById("scoreSkipButton");
  const scoreSubmitStatusEl = document.getElementById("scoreSubmitStatus");
  const leaderboardPreviewStateEl = document.getElementById("leaderboardPreviewState");
  const leaderboardPreviewListEl = document.getElementById("leaderboardPreviewList");
  const leaderboardOpenPreviewButton = document.getElementById("leaderboardOpenPreview");
  const leaderboardBackdrop = document.getElementById("leaderboardBackdrop");
  const closeLeaderboardButton = document.getElementById("closeLeaderboardButton");
  const leaderboardModalStateEl = document.getElementById("leaderboardModalState");
  const leaderboardModalListEl = document.getElementById("leaderboardModalList");
  const missionBriefBackdrop = document.getElementById("missionBriefBackdrop");
  const missionBriefTitleEl = document.getElementById("missionBriefTitle");
  const missionBriefBodyEl = document.getElementById("missionBriefBody");
  const missionBriefObjectiveEl = document.getElementById("missionBriefObjective");
  const missionBriefBonusEl = document.getElementById("missionBriefBonus");
  const missionBriefRuleEl = document.getElementById("missionBriefRule");
  const missionBriefSpecialInfoEl = document.getElementById("missionBriefSpecialInfo");
  const missionBriefSpecialsEl = document.getElementById("missionBriefSpecials");
  const missionBriefHelpButton = document.getElementById("missionBriefHelpButton");
  const missionStartButton = document.getElementById("missionStartButton");
  const helpBackdrop = document.getElementById("helpBackdrop");
  const closeHelpButton = document.getElementById("closeHelp");
  const helpGeneralSpecialsEl = document.getElementById("helpGeneralSpecials");
  const helpGeneralSpecialsFoldEl = helpGeneralSpecialsEl ? helpGeneralSpecialsEl.closest(".helpFold") : null;
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
  let nextSpawnAt = 0;

  let score = 0;
  let level = 1;
  let locks = 0;
  let herdsCleared = 0;
  let currentCombo = 0;
  let bestCombo = 0;
  let bestHerd = null;
  let holdUsed = false;
  let mission = null;
  let runEndTitle = "Run Over 🐺";
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
  let runStarted = !REFRESH_V2_ENABLED;
  let manualPaused = false;
  let missionDrawerOpen = false;
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
  let boardAudioCues = [];
  let banner = { text:"", t:0, ttl: 900 };
  let toastTimer = 0;
  let pendingGameOverRevealTimer = 0;
  let runEndPulseActive = false;
  let wolfHowlFxTimer = 0;
  const WOLF_BADGE_HOWL_MS = 640;
  let shareSnapshot = null;
  let lastMissionMeterAudio = null;
  let pendingTap = null;
  let runStartedAtMs = Date.now();
  let runId = "";
  let leaderboardEntries = [];
  let leaderboardLoading = false;
  let leaderboardError = "";
  let leaderboardLastLoadedAt = 0;
  let leaderboardSubmitPending = false;
  let leaderboardSubmitDismissed = false;
  let leaderboardSubmitTone = "";
  let leaderboardSubmitMessage = "";
  let submittedRunId = "";
  let submittedLeaderboardRank = 0;

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

  const LEGACY_MISSION_SPECIAL_LIBRARY = {
    bomb: {
      title: "Barn Buster",
      desc: () => "2x2 bomb square. Blows up nearby settled tiles.",
      short: "Nearby blast.",
      help: "2x2 gold-frame bomb. It blows up nearby settled tiles when it lands.",
      every: 5,
      tile: TILE.BOMB,
      specKey: "BOMB_T",
      onLock: missionBombBlast,
      leaveLonelyTurd: false
    },
    reaper: {
      title: "Cull Comb",
      desc: () => "Gold-frame line. Deletes the biggest animal group, then turns useful.",
      short: "Clips the biggest group.",
      help: "Gold-frame line. It removes the biggest group on the board, then turns into the touched animal.",
      every: 5,
      tile: TILE.REAPER,
      specKey: "REAPER_I",
      onLock: missionReapLargestGroup
    },
    morph: {
      title: "Mystery Crate",
      desc: () => "Gold-frame L. Turns into whatever animal it touches first.",
      short: "Turns into what it touches.",
      help: "Gold-frame L. It turns into the first nearby animal it matches.",
      every: 4,
      tile: TILE.MORPH,
      specKey: "MORPH_L",
      onLock: missionMorphPiece
    },
    seeder: {
      title: "Nest Bomber",
      desc: () => "Gold-frame zigzag. Scatters the same egg-and-turd mess it arrived with.",
      short: "Scatters eggs and turds.",
      help: "Gold-frame zigzag. It scatters the same egg-and-turd mess around its landing zone.",
      every: 5,
      tile: TILE.SEEDER,
      specKey: "SEEDER_S",
      onLock: missionSeedOverlay,
      usesSeederMatrix: true
    },
    brand: {
      title: "Branding Iron",
      desc: () => "Gold-frame T. Turns into the touched animal and converts nearby animals to match.",
      short: "Converts nearby animals to match.",
      help: "Gold-frame T. It becomes the touched animal and converts nearby animals to match.",
      every: 5,
      tile: TILE.BRAND,
      specKey: "BRAND_T",
      onLock: missionBrandPiece
    },
    feed: {
      title: "Feed Wagon",
      desc: () => "Gold-frame L. Turns useful and scatters only eggs around itself.",
      short: "Drops eggs nearby.",
      help: "Gold-frame L. It becomes the touched animal and scatters only eggs around itself.",
      every: 5,
      tile: TILE.FEED,
      specKey: "FEED_L",
      onLock: missionFeedPiece
    },
    bunker: {
      title: "Bunker Buster",
      desc: () => "2x2 square. Chain-blasts touching wreckage. Whiffs leave extra turds.",
      short: "Chain blast. Rude whiffs.",
      help: "2x2 gold-frame square. It chain-blasts touching wreckage. Whiffs leave four turds, three in the lower barn.",
      every: 5,
      tile: TILE.BUNKER,
      specKey: "BUNKER_O",
      onLock: missionBunkerBlast,
      leaveLonelyTurd: false
    },
    produce: {
      title: "Barn Goods",
      desc: ({ animal=TILE.SHEEP } = {}) => {
        const product = productInfoForAnimal(animal);
        return `${product.specialTitle} hits the right producer, drops an egg, and tags that group for goods. Misses leave a turd.`;
      },
      short: "Hit the right producer for goods.",
      help: "Gold-frame producer crate. Hit the right animal to tag goods and leave an egg. Misses leave a turd.",
      every: 5,
      tile: TILE.WOOL,
      specKey: "PRODUCE_O",
      onLock: missionProducePiece,
      usesProductAnimal: true,
      previewAnimal: TILE.COW
    }
  };

  const SHARED_MISSION_SPECIAL_LIBRARY = {
    angry_wolf: {
      title: "Angry Wolf",
      desc: () => "2x2 wolf raid. Blasts a patch and muddies the floor. Great if you hate having plans.",
      short: "Blasts nearby tiles and muddies the lane.",
      help: "Blasts the landing patch. Hit: leaves 2 mud traps. Whiff: leaves 1 mud trap.",
      tile: TILE.WOLF,
      specKey: "WOLVES_2",
      onLock: missionAngryWolfPiece,
      leaveLonelyTurd: false
    },
    pack_howl: {
      title: "Pack Howl",
      desc: () => "Wolf L-piece. Becomes the touched animal, scrambles nearby animals, and drops one mud trap.",
      short: "Scrambles 4 animals and drops mud.",
      help: "Becomes the touched animal. Nearby: scrambles 4 animals and drops 1 mud trap.",
      tile: TILE.WOLF,
      specKey: "PACK_HOWL_L",
      onLock: missionPackHowlPiece,
      leaveLonelyTurd: false
    },
    salt_lick: {
      title: "Salt Lick",
      desc: () => "Gold-frame T. Turns useful and coaxes up to 2 nearby animals to match.",
      short: "Coaxes 2 nearby animals to match.",
      help: "Gold-frame T. It becomes the touched animal and coaxes up to 2 nearby animals to match.",
      tile: TILE.SALT,
      specKey: "SALT_T",
      onLock: missionSaltLickPiece,
      leaveLonelyTurd: false
    },
    rain_barrel: {
      title: "Rain Barrel",
      desc: () => "2x2 bucket. Washes up to 4 nearby eggs, turds, or mud traps.",
      short: "Cleans nearby eggs, turds, and mud.",
      help: "2x2 bucket. It washes up to 4 nearby eggs, turds, or mud traps. If clean, it drops 1 egg.",
      tile: TILE.RAIN,
      specKey: "RAIN_O",
      onLock: missionRainBarrelPiece,
      leaveLonelyTurd: false
    },
    rooster_call: {
      title: "Rooster Call",
      desc: () => "Gold-frame L. Rallies nearby chickens and lays a couple of combo eggs.",
      short: "Rallies chickens and drops eggs.",
      help: "Gold-frame L. It rallies nearby chickens and drops a couple of combo eggs.",
      tile: TILE.ROOSTER,
      specKey: "ROOSTER_L",
      onLock: missionRoosterCallPiece,
      leaveLonelyTurd: false
    },
    egg_basket: {
      title: "Egg Basket",
      desc: () => "Egg L-piece. Turns into the touched animal and plants four eggs nearby.",
      short: "Plants eggs nearby.",
      help: "Becomes the touched animal and plants 4 egg bonuses around the landing zone.",
      tile: TILE.SEEDER_EGG,
      specKey: "EGG_SPREAD_L",
      onLock: missionEggBasketPiece,
      leaveLonelyTurd: false
    },
    muck_wagon: {
      title: "Muck Wagon",
      desc: () => "Poop zigzag. Turns useful, then drops three turds nearby.",
      short: "Drops turds nearby.",
      help: "Becomes the touched animal and drops 3 turds nearby. Turds trim herd payouts.",
      tile: TILE.SEEDER_TURD,
      specKey: "MUCK_WAGON_Z",
      onLock: missionMuckWagonPiece,
      leaveLonelyTurd: false
    },
    barnstorm_crate: {
      title: "Barnstorm Crate",
      desc: () => "Gold-frame zigzag. Turns useful, then sprays a tight pocket of eggs, turds, and bad ideas.",
      short: "Local spray of eggs, turds, and chaos.",
      help: "Gold-frame zigzag. It turns into the touched animal, then sprays a local patch of eggs, turds, and matching nonsense.",
      tile: TILE.CRATE,
      specKey: "CRATE_S",
      onLock: missionBarnstormCratePiece,
      leaveLonelyTurd: false
    },
    barn_goods: {
      title: "Barn Goods",
      desc: ({ animal=null } = {}) => {
        if(!animal){
          return "Producer crate. Hit the matching animal, drop an egg, and tag that herd for one good. Misses leave a turd.";
        }
        const product = productInfoForAnimal(animal);
        return `${product.specialTitle} hits the right producer, drops an egg, and tags that group for goods. Misses leave a turd.`;
      },
      short: "Hit the right producer for goods.",
      help: "Hit the right producer to tag 1 good and drop 1 egg. Miss: drops 1 turd.",
      tile: TILE.WOOL,
      specKey: "PRODUCE_O",
      onLock: missionProducePiece,
      usesProductAnimal: true,
      previewAnimal: TILE.COW,
      leaveLonelyTurd: false
    },
    bunker_buster: {
      title: "Bunker Buster",
      desc: () => "2x2 square. Precise chain blast. Whiffs still leave a nasty calling card.",
      short: "Precise chain blast.",
      help: "2x2 square. Hit: chain-blasts the touched cluster. Whiff: drops 4 turds.",
      tile: TILE.BUNKER,
      specKey: "BUNKER_O",
      onLock: missionBunkerBlast,
      leaveLonelyTurd: false
    }
  };

  const MISSION_SPECIAL_LIBRARY = {
    ...LEGACY_MISSION_SPECIAL_LIBRARY,
    ...SHARED_MISSION_SPECIAL_LIBRARY
  };

  const LEGACY_MISSION_DEFS = [
    { id:"sheep_roundup", type:"animal", animal:TILE.SHEEP, target:17, bonus:145, special:"bomb", title:"Sheep Sweep" },
    { id:"goat_roundup", type:"animal", animal:TILE.GOAT, target:17, bonus:145, special:"morph", title:"Goat Evac" },
    { id:"chicken_roundup", type:"animal", animal:TILE.CHICKEN, target:18, bonus:150, special:"seeder", title:"Coop Cleanup" },
    { id:"cow_roundup", type:"animal", animal:TILE.COW, target:16, bonus:150, special:"reaper", title:"Moo Move" },
    { id:"pig_roundup", type:"animal", animal:TILE.PIG, target:18, bonus:150, special:"bomb", title:"Hog Panic" },
    { id:"clear_four", type:"clears", target:4, bonus:180, special:"bomb", title:"Quad Clear" },
    { id:"combo_three", type:"combo", target:4, bonus:215, special:"morph", title:"Chain Fever" },
    { id:"huff_puff", type:"destroy", animal:TILE.PIG, target:15, bonus:195, special:"bunker", title:"Huff and Puff", weight:1.5 },
    { id:"score_320", type:"score", target:380, bonus:210, special:"reaper", title:"Sunrise Scramble" },
    { id:"build_ten", type:"build_group", target:12, bonus:210, special:"brand", title:"Barn Weave" },
    { id:"feed_three", type:"clears", target:4, bonus:175, special:"feed", title:"Feed Rush" },
    { id:"wool_patrol", type:"product", animal:TILE.SHEEP, target:2, bonus:175, special:"produce", title:"Wool Patrol", weight:1.5 },
    { id:"cheese_chase", type:"product", animal:TILE.GOAT, target:2, bonus:175, special:"produce", title:"Cheese Chase", weight:1.5 },
    { id:"egg_run", type:"product", animal:TILE.CHICKEN, target:2, bonus:170, special:"produce", title:"Egg Run", weight:1.5 },
    { id:"milk_run", type:"product", animal:TILE.COW, target:2, bonus:180, special:"produce", title:"Milk Run", weight:1.5 },
    { id:"pigskin_parade", type:"product", animal:TILE.PIG, target:2, bonus:175, special:"produce", title:"Pigskin Parade", weight:1.5 }
  ];

  const REVISED_MISSION_DEFS = [
    {
      id: "sheep_sweep",
      title: "Sheep Sweep",
      type: "animal",
      animal: TILE.SHEEP,
      target: 17,
      bonus: 150,
      hint: "17 sheep",
      objective: "Clear 17 sheep",
      brief: "Leave no fluff behind.",
      specialEvery: 4.3,
      specials: [{ id: "salt_lick", weight: 3 }, { id: "rain_barrel", weight: 1 }]
    },
    {
      id: "goat_evac",
      title: "Goat Evac",
      type: "animal",
      animal: TILE.GOAT,
      target: 17,
      bonus: 150,
      hint: "17 goats",
      objective: "Clear 17 goats",
      brief: "The fence already lost.",
      specialEvery: 4.2,
      specials: [{ id: "salt_lick", weight: 3 }, { id: "barnstorm_crate", weight: 1 }]
    },
    {
      id: "coop_cleanup",
      title: "Coop Cleanup",
      type: "animal",
      animal: TILE.CHICKEN,
      target: 18,
      bonus: 155,
      hint: "18 chickens",
      objective: "Clear 18 chickens",
      brief: "The rooster wants overtime.",
      specialEvery: 4.0,
      specials: [{ id: "rooster_call", weight: 3 }, { id: "barnstorm_crate", weight: 1 }]
    },
    {
      id: "moo_move",
      title: "Moo Move",
      type: "animal",
      animal: TILE.COW,
      target: 16,
      bonus: 155,
      hint: "16 cows",
      objective: "Clear 16 cows",
      brief: "The dairy aisle is jammed.",
      specialEvery: 4.3,
      specials: [{ id: "salt_lick", weight: 3 }, { id: "rain_barrel", weight: 1 }]
    },
    {
      id: "hog_panic",
      title: "Hog Panic",
      type: "animal",
      animal: TILE.PIG,
      target: 17,
      bonus: 155,
      hint: "17 pigs",
      objective: "Clear 17 pigs",
      brief: "Somebody yelled free snacks.",
      specialEvery: 4.0,
      specials: [{ id: "barnstorm_crate", weight: 3 }, { id: "bunker_buster", weight: 1 }]
    },
    {
      id: "quad_clear",
      title: "Quad Clear",
      type: "large_clears",
      target: 4,
      minSize: 13,
      bonus: 190,
      hint: "4 herds 13+",
      objective: "Clear 4 herds of 13+",
      brief: "Big barn. Big appetite.",
      specialEvery: 4.1,
      specials: [{ id: "salt_lick", weight: 2 }, { id: "bunker_buster", weight: 1 }]
    },
    {
      id: "chain_fever",
      title: "Chain Fever",
      type: "combo",
      target: 4,
      bonus: 215,
      hint: "hit x4",
      objective: "Hit a x4 chain",
      brief: "One settle. Four problems.",
      specialEvery: 4.0,
      specials: [{ id: "rooster_call", weight: 3 }, { id: "barnstorm_crate", weight: 1 }]
    },
    {
      id: "barn_weave",
      title: "Barn Weave",
      type: "build_group",
      target: 12,
      bonus: 210,
      hint: "build 12 live",
      objective: "Build a live herd of 12",
      brief: "Knit it tight. Do not cash it early.",
      specialEvery: 4.2,
      specials: [{ id: "salt_lick", weight: 3 }, { id: "rain_barrel", weight: 1 }]
    },
    {
      id: "farmers_market",
      title: "Farmers Market",
      type: "product",
      target: 3,
      bonus: 205,
      goodsAnimals: ANIMALS,
      hint: "cash 3 goods",
      objective: "Cash 3 goods",
      brief: "The locals brought exact change.",
      specialEvery: 3.9,
      specials: [{ id: "barn_goods", weight: 3 }, { id: "rain_barrel", weight: 1 }]
    },
    {
      id: "mud_season",
      title: "Mud Season",
      type: "turds",
      target: 6,
      bonus: 180,
      hint: "clear 6 turds",
      objective: "Clear 6 turds",
      brief: "Boots are no longer optional.",
      specialEvery: 4.0,
      specials: [{ id: "rain_barrel", weight: 3 }, { id: "barnstorm_crate", weight: 1 }]
    },
    {
      id: "salt_and_battery",
      title: "Salt and Battery",
      type: "large_clears",
      target: 2,
      minSize: 11,
      bonus: 220,
      hint: "2 herds 11+",
      objective: "Clear 2 herds of 11+",
      brief: "Build them chunky. Cash them loud.",
      specialEvery: 4.1,
      specials: [{ id: "salt_lick", weight: 3 }, { id: "rooster_call", weight: 1 }],
      weight: 0.9
    },
    {
      id: "angry_wolves",
      title: "Angry Wolves",
      type: "large_clears",
      target: 2,
      minSize: 12,
      bonus: 660,
      hint: "2 herds 12+",
      objective: "Clear 2 herds of 12+",
      brief: "Mini-boss rules: the wolves wreck first.",
      specialEvery: 2.8,
      specials: [{ id: "angry_wolf", weight: 3 }, { id: "pack_howl", weight: 2 }],
      weight: 0.55,
      marquee: true
    }
  ].filter((entry) => USE_ANGRY_WOLVES_MISSION || entry.id !== "angry_wolves");

  const V2_MISSION_DEFS = [
    {
      id: "v2_sheep_sweep_intro",
      title: "Sheep Sweep",
      family: "species",
      type: "animal",
      animal: TILE.SHEEP,
      target: ACTIVE_CLEAR_THRESHOLD,
      bonus: 90,
      hint: `clear ${ACTIVE_CLEAR_THRESHOLD} sheep`,
      objective: `Clear ${ACTIVE_CLEAR_THRESHOLD} sheep`,
      brief: "Round up the fluff.",
      specialEvery: 99,
      specials: [],
      onboarding: true,
      weight: 0
    },
    {
      id: "v2_sheep_sweep",
      title: "Sheep Sweep",
      family: "species",
      type: "animal",
      animal: TILE.SHEEP,
      target: ACTIVE_CLEAR_THRESHOLD * 2,
      bonus: 120,
      hint: `${ACTIVE_CLEAR_THRESHOLD * 2} sheep`,
      objective: `Clear ${ACTIVE_CLEAR_THRESHOLD * 2} sheep`,
      brief: "Round up the fluff.",
      specialEvery: 5.2,
      specials: [{ id: "salt_lick", weight: 3 }, { id: "egg_basket", weight: 1 }],
      weight: 2.4
    },
    {
      id: "v2_pig_panic",
      title: "Pig Panic",
      family: "species",
      type: "animal",
      animal: TILE.PIG,
      target: ACTIVE_CLEAR_THRESHOLD * 2,
      bonus: 130,
      hint: `${ACTIVE_CLEAR_THRESHOLD * 2} pigs`,
      objective: `Clear ${ACTIVE_CLEAR_THRESHOLD * 2} pigs`,
      brief: "Egg Basket helps. Muck Wagon drops turds.",
      specialEvery: 4.8,
      specials: [{ id: "egg_basket", weight: 2 }, { id: "muck_wagon", weight: 1 }],
      weight: 1.55
    },
    {
      id: "v2_goat_rodeo",
      title: "Goat Rodeo",
      family: "species",
      type: "animal",
      animal: TILE.GOAT,
      target: ACTIVE_CLEAR_THRESHOLD * 2,
      bonus: 135,
      hint: `${ACTIVE_CLEAR_THRESHOLD * 2} goats`,
      objective: `Clear ${ACTIVE_CLEAR_THRESHOLD * 2} goats`,
      brief: "Salt Lick pulls goats. Muck Wagon drops turds.",
      specialEvery: 4.8,
      specials: [{ id: "salt_lick", weight: 3 }, { id: "muck_wagon", weight: 1 }],
      weight: 1.45
    },
    {
      id: "v2_egg_rush",
      title: "Egg Rush",
      family: "special",
      type: "egg_clear",
      target: 2,
      bonus: 155,
      hint: "2 egg herds",
      objective: "Clear 2 herds with eggs",
      brief: "Egg Basket plants bonuses. Cash the omelet.",
      specialEvery: 4.1,
      specials: [{ id: "egg_basket", weight: 3 }, { id: "rooster_call", weight: 1 }],
      weight: 1.35
    },
    {
      id: "v2_mud_season",
      title: "Poop Patrol",
      family: "hazard",
      type: "turds",
      target: 3,
      bonus: 145,
      hint: "clean 3 turds",
      objective: "Clean 3 turds",
      brief: "Rain Barrel washes turds. Muck Wagon makes more.",
      specialEvery: 3.9,
      specials: [{ id: "rain_barrel", weight: 3 }, { id: "muck_wagon", weight: 1 }],
      weight: 1.25
    },
    {
      id: "v2_wolf_alert",
      title: "Wolf Alert",
      family: "hazard",
      type: "wolf",
      target: 1,
      bonus: 210,
      hint: "weather 1 howl",
      objective: "Weather 1 wolf event",
      brief: "Pack Howl scrambles animals and drops mud. Keep playing.",
      specialEvery: 2.5,
      specials: [{ id: "pack_howl", weight: 3 }, { id: "rain_barrel", weight: 1 }],
      minRunsStarted: 2,
      weight: 0.75
    },
    {
      id: "v2_chain_reaction",
      title: "Chain Reaction",
      family: "chain",
      type: "combo",
      target: 3,
      bonus: 180,
      hint: "hit x3",
      objective: "Hit a x3 chain",
      brief: "Gravity gets to be funny.",
      specialEvery: 4.0,
      specials: [{ id: "rooster_call", weight: 2 }, { id: "egg_basket", weight: 1 }],
      weight: 1.05
    },
    {
      id: "v2_barn_cash",
      title: "Barn Cash",
      family: "special",
      type: "product",
      target: 2,
      bonus: 170,
      goodsAnimals: ANIMALS,
      hint: "cash 2 goods",
      objective: "Cash 2 goods",
      brief: "Tiny market. Loud register.",
      specialEvery: 3.8,
      specials: [{ id: "barn_goods", weight: 3 }, { id: "egg_basket", weight: 1 }],
      weight: 1.0
    },
    {
      id: "angry_wolves",
      title: "Angry Wolves",
      family: "hazard",
      type: "large_clears",
      target: 2,
      minSize: Math.min(ACTIVE_CLEAR_THRESHOLD + 2, 12),
      bonus: 900,
      hint: `2 herds ${Math.min(ACTIVE_CLEAR_THRESHOLD + 2, 12)}+`,
      objective: `Clear 2 herds of ${Math.min(ACTIVE_CLEAR_THRESHOLD + 2, 12)}+`,
      brief: "Angry Wolf blasts tiles and leaves mud. Big bonus if you survive it.",
      specialEvery: 2.6,
      specials: [{ id: "angry_wolf", weight: 3 }, { id: "pack_howl", weight: 2 }],
      minRunsStarted: 3,
      weight: 0.22,
      marquee: true
    }
  ].filter((entry) => USE_ANGRY_WOLVES_MISSION || entry.id !== "angry_wolves");

  const ACTIVE_MISSION_DEFS = REFRESH_V2_ENABLED
    ? V2_MISSION_DEFS
    : USE_REVISED_MISSION_DECK
      ? REVISED_MISSION_DEFS
      : LEGACY_MISSION_DEFS;

  // ===== Audio (silent unlock, no popups) =====
  let audioCtx = null;
  let masterGain = null;
  resetAudioPrefsIfRequested();
  let soundOn = loadSoundPref();
  let sfxVolumePrefWasStored = hasStoredSfxVolumePref();
  let sfxVolume = loadSfxVolumePref();
  let goofyAnimalSounds = loadGoofyAnimalPref();
  let audioUnlocked = false;
  let audioPrimeOnResume = false;
  let pendingAudioResume = null;
  let ambienceClock = 0;
  let audioDirector = null;
  let audioDebugPanelEl = null;
  let lastAudioResumeAttempt = "none";
  let lastAudioSoundEvent = "none";
  let lastAudioError = "";

  function storedSfxVolumeRaw(){
    try{
      return localStorage.getItem("aw_sfx_volume");
    }catch{
      return null;
    }
  }
  function hasStoredSfxVolumePref(){
    return storedSfxVolumeRaw() !== null;
  }
  function audioDebugLog(label, data={}){
    if(label){
      if(label.startsWith("resume:")) lastAudioResumeAttempt = label;
      if(label.startsWith("test:") || label.startsWith("sfx:")) lastAudioSoundEvent = label;
    }
    if(data?.message) lastAudioError = data.message;
    syncAudioDebugPanel();
    if(!AUDIO_DEBUG) return;
    try{
      console.log("[Angry Wolves audio]", label, {
        soundOn,
        sfxVolume,
        goofyAnimalSounds,
        audioState: audioCtx?.state || "none",
        unlocked: audioUnlocked,
        storedSfxVolume: storedSfxVolumeRaw(),
        ...data
      });
    }catch{}
  }
  function syncAudioDebugPanel(){
    if(!AUDIO_DEBUG) return;
    try{
      if(!audioDebugPanelEl){
        audioDebugPanelEl = document.createElement("div");
        audioDebugPanelEl.setAttribute("aria-live", "polite");
        audioDebugPanelEl.style.cssText = [
          "position:fixed",
          "left:8px",
          "right:8px",
          "bottom:calc(env(safe-area-inset-bottom, 0px) + 8px)",
          "z-index:9999",
          "padding:5px 7px",
          "border-radius:8px",
          "background:rgba(0,0,0,0.72)",
          "color:#ffe39a",
          "font:700 10px/1.25 system-ui,-apple-system,sans-serif",
          "pointer-events:none",
          "text-align:left"
        ].join(";");
        document.body.appendChild(audioDebugPanelEl);
      }
      audioDebugPanelEl.textContent = `audio ${soundOn ? "on" : "off"} · ${Math.round((sfxVolume || 0) * 100)}% · ${audioCtx?.state || "none"} · resume ${lastAudioResumeAttempt} · sound ${lastAudioSoundEvent}${lastAudioError ? ` · ${lastAudioError}` : ""}`;
    }catch{}
  }
  function resetAudioPrefsIfRequested(){
    if(!AUDIO_RESET) return;
    try{
      localStorage.setItem("aw_sound", "1");
      localStorage.setItem("aw_sfx_volume", String(DEFAULT_SFX_VOLUME));
      localStorage.setItem("aw_goofy_animals", "1");
      console.log("[Angry Wolves audio] audioReset restored defaults", {
        soundOn: true,
        sfxVolume: DEFAULT_SFX_VOLUME,
        goofyAnimalSounds: true
      });
    }catch{}
  }
  function loadSoundPref(){
    try{
      const v = localStorage.getItem("aw_sound");
      return v === null ? true : (v === "1");
    }catch{
      return true;
    }
  }
  function loadSfxVolumePref(){
    try{
      const raw = storedSfxVolumeRaw();
      if(raw === null || raw === "") return DEFAULT_SFX_VOLUME;
      const v = Number(raw);
      return Number.isFinite(v) ? clamp(v, 0, 1) : DEFAULT_SFX_VOLUME;
    }catch{
      return DEFAULT_SFX_VOLUME;
    }
  }
  function loadGoofyAnimalPref(){
    try{
      const v = localStorage.getItem("aw_goofy_animals");
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
  function saveSfxVolumePref(){
    try{
      localStorage.setItem("aw_sfx_volume", String(sfxVolume));
      sfxVolumePrefWasStored = true;
    }catch{}
  }
  function saveGoofyAnimalPref(){
    try{
      localStorage.setItem("aw_goofy_animals", goofyAnimalSounds ? "1" : "0");
    }catch{}
  }
  function ensureAudio(){
    if(audioCtx?.state === "closed"){
      audioCtx = null;
      masterGain = null;
      audioDirector = null;
    }
    if(audioCtx) return;
    try{
      audioDebugLog("ensureAudio:create");
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = soundOn ? sfxVolume : 0.0;
      masterGain.connect(audioCtx.destination);
      audioCtx.onstatechange = () => {
        if(audioCtx?.state === "running") audioUnlocked = true;
        audioDebugLog("statechange");
      };
      if(HUMOR_AUDIO_ENABLED) audioDirector = createAudioDirector();
    }catch(err){
      lastAudioError = err?.message || "AudioContext failed";
      audioDebugLog("ensureAudio:failed", { message:lastAudioError });
      audioCtx = null; masterGain = null;
    }
  }
  function syncMasterGain(){
    if(masterGain && audioCtx){
      masterGain.gain.setValueAtTime(soundOn ? sfxVolume : 0.0, audioCtx.currentTime);
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
  function resumeAudioContext(opts={}){
    const { prime=true } = opts;
    if(!soundOn) return Promise.resolve(false);
    ensureAudio();
    if(!audioCtx) return Promise.resolve(false);
    syncMasterGain();
    if(audioCtx.state === "running"){
      audioUnlocked = true;
      if(prime) primeAudioContext();
      audioPrimeOnResume = false;
      audioDebugLog("resume:already-running", { prime });
      return Promise.resolve(true);
    }
    if(audioCtx.state === "closed"){
      audioCtx = null;
      masterGain = null;
      audioDirector = null;
      ensureAudio();
      if(!audioCtx) return Promise.resolve(false);
    }
    if(prime) audioPrimeOnResume = true;
    if(pendingAudioResume) return pendingAudioResume;
    audioDebugLog("resume:attempt", { prime });
    const resumeCall = typeof audioCtx.resume === "function" ? audioCtx.resume() : Promise.resolve();
    pendingAudioResume = Promise.resolve(resumeCall)
      .then(() => {
        const running = !!audioCtx && audioCtx.state === "running";
        if(running){
          audioUnlocked = true;
          if(audioPrimeOnResume) primeAudioContext();
        }
        audioDebugLog("resume:result", { running });
        return running;
      })
      .catch((err) => {
        audioDebugLog("resume:error", { message: err?.message || String(err || "") });
        return false;
      })
      .finally(() => {
        audioPrimeOnResume = false;
        pendingAudioResume = null;
      });
    return pendingAudioResume;
  }
  function prepareAudioPlayback(){
    if(!soundOn) return false;
    ensureAudio();
    if(!audioCtx || !masterGain) return false;
    syncMasterGain();
    if(audioCtx.state !== "running"){
      if(USE_IOS_AUDIO_RESUME_FIXES){
        resumeAudioContext({ prime:false });
      }
      audioDebugLog("prepare:not-running");
      return false;
    }
    return true;
  }
  function nudgeAudioWake(){
    if(!USE_IOS_AUDIO_RESUME_FIXES) return;
    if(!soundOn || !audioUnlocked || !audioCtx) return;
    window.setTimeout(() => {
      resumeAudioContext({ prime:false });
    }, 40);
  }
  function safeResumeAudioFromGesture(){
    if(!soundOn) return;
    return resumeAudioContext({ prime:true });
  }
  function unlockAudioSilently(){
    safeResumeAudioFromGesture();
  }
  function ensureAudibleSfxDefaultIfMissing(){
    const raw = storedSfxVolumeRaw();
    const missing = raw === null || raw === "" || raw === "null" || raw === "undefined";
    const invalid = raw !== null && raw !== "" && !Number.isFinite(Number(raw));
    if(!missing && !invalid) return false;
    sfxVolume = DEFAULT_SFX_VOLUME;
    saveSfxVolumePref();
    syncMasterGain();
    syncSoundBtn();
    audioDebugLog("sfx:restored-default", { reason: missing ? "missing" : "invalid" });
    return true;
  }
  function restoreAudibleSfxDefault(reason="explicit-test"){
    sfxVolume = DEFAULT_SFX_VOLUME;
    saveSfxVolumePref();
    syncMasterGain();
    syncSoundBtn();
    audioDebugLog("sfx:restored-default", { reason });
  }
  function playAudioTestCueFromGesture(){
    if(!soundOn){
      soundOn = true;
      saveSoundPref();
      audioDebugLog("test:enabled-sound");
    }
    ensureAudibleSfxDefaultIfMissing();
    if(sfxVolume <= 0){
      restoreAudibleSfxDefault("explicit-test-volume-zero");
    }
    syncSoundBtn();
    let played = false;
    const resumePromise = safeResumeAudioFromGesture();
    const playCue = (source) => {
      if(played) return;
      if(!prepareAudioPlayback()){
        audioDebugLog("test:not-ready", { source });
        return;
      }
      played = true;
      audioDebugLog("test:play", { source });
      playGameEventSound("ui_button_tap");
      animalVoice(TILE.PIG, "toggle", 0.82);
      showToast(`Test sound: ${Math.round(sfxVolume * 100)}%`, 1200);
    };
    playCue("gesture");
    Promise.resolve(resumePromise).then((running) => {
      if(running) playCue("resume");
      else if(!played){
        showToast("Safari is still waking audio. Tap Test again.", 1800);
        audioDebugLog("test:resume-not-running");
      }
    });
  }
  audioDebugLog("settings-loaded", {
    sfxVolumePrefWasStored,
    audioReset: AUDIO_RESET,
    defaultSfxVolume: DEFAULT_SFX_VOLUME
  });

  function playTone({type="sine", f1=220, f2=110, dur=0.12, gain=0.16, noise=false}){
    if(!prepareAudioPlayback()) return;

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
    if(!prepareAudioPlayback()) return;
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

  const AUDIO_ANIMAL_NAMES = {
    [TILE.SHEEP]: "sheep",
    [TILE.GOAT]: "goat",
    [TILE.CHICKEN]: "chicken",
    [TILE.COW]: "cow",
    [TILE.PIG]: "pig",
    [TILE.WOLF]: "wolf",
    [TILE.BLACK_SHEEP]: "black_sheep"
  };

  function createAudioDirector(){
    const buses = new Map();
    const cooldowns = new Map();
    const busLevels = {
      ui: 0.44,
      piece: 0.58,
      animal: 0.78,
      herd: 0.82,
      mission: 0.76,
      wolf: 0.88,
      clutter: 0.5,
      ambience: 0.32
    };
    const eventCooldowns = {
      ui_button_tap: 26,
      piece_move: 34,
      piece_rotate: 54,
      piece_invalid: 140,
      barnyard_contact_chaos: 110,
      herd_near: 900,
      mission_progress: 120,
      reward_countdown: 160,
      wolf_threat: 700,
      ambient_barn: 4200
    };

    function bus(name="piece"){
      const key = busLevels[name] === undefined ? "piece" : name;
      if(buses.has(key)) return buses.get(key);
      const g = audioCtx.createGain();
      g.gain.value = busLevels[key];
      g.connect(masterGain);
      buses.set(key, g);
      return g;
    }

    function canPlay(key, ms=0){
      if(!ms) return true;
      const now = performance.now();
      const last = cooldowns.get(key) || 0;
      if(now - last < ms) return false;
      cooldowns.set(key, now);
      return true;
    }

    function varied(freq, cents=18){
      const bend = (Math.random() * 2 - 1) * cents;
      return Math.max(28, freq * Math.pow(2, bend / 1200));
    }

    function startAt(delay=0){
      return audioCtx.currentTime + Math.max(0, delay);
    }

    function shapeGain(g, t0, dur, gain, attack=0.008, release=0.04){
      const peakAt = t0 + Math.max(0.004, attack);
      const endAt = t0 + Math.max(0.018, dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), peakAt);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain * 0.18), Math.max(peakAt + 0.004, endAt - release));
      g.gain.exponentialRampToValueAtTime(0.0001, endAt);
    }

    function route(source, g, busName, filterOpts=null){
      if(filterOpts){
        const f = audioCtx.createBiquadFilter();
        f.type = filterOpts.type || "lowpass";
        f.frequency.setValueAtTime(filterOpts.freq || 1200, audioCtx.currentTime);
        if(filterOpts.q !== undefined) f.Q.setValueAtTime(filterOpts.q, audioCtx.currentTime);
        source.connect(f);
        f.connect(g);
      } else {
        source.connect(g);
      }
      g.connect(bus(busName));
    }

    function tone(opts={}){
      if(!prepareAudioPlayback()) return false;
      const {
        type = "sine",
        f1 = 220,
        f2 = null,
        dur = 0.12,
        gain = 0.08,
        bus: busName = "piece",
        delay = 0,
        attack = 0.008,
        release = 0.04,
        pitchJitter = 18,
        filter = null
      } = opts;
      const t0 = startAt(delay);
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(varied(f1, pitchJitter), t0);
      if(f2) osc.frequency.exponentialRampToValueAtTime(varied(Math.max(36, f2), pitchJitter), t0 + Math.max(0.016, dur));
      shapeGain(g, t0, dur, gain, attack, release);
      route(osc, g, busName, filter);
      osc.start(t0);
      osc.stop(t0 + dur + 0.035);
      return true;
    }

    function noise(opts={}){
      if(!prepareAudioPlayback()) return false;
      const {
        dur = 0.08,
        gain = 0.05,
        bus: busName = "piece",
        delay = 0,
        filter = { type:"bandpass", freq:900, q:0.8 },
        attack = 0.004,
        release = 0.035
      } = opts;
      const t0 = startAt(delay);
      const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for(let i=0; i<bufferSize; i++){
        const tail = 1 - i / bufferSize;
        data[i] = (Math.random() * 2 - 1) * tail * tail;
      }
      const src = audioCtx.createBufferSource();
      const g = audioCtx.createGain();
      src.buffer = buffer;
      shapeGain(g, t0, dur, gain, attack, release);
      route(src, g, busName, filter);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
      return true;
    }

    function sequence(notes, opts={}){
      const {
        step = 0.07,
        bus: busName = "piece",
        type = "triangle",
        gain = 0.055,
        delay = 0,
        pitchJitter = 14
      } = opts;
      notes.forEach((note, idx) => {
        const data = typeof note === "number" ? { f: note } : note;
        tone({
          type: data.type || type,
          f1: data.f,
          f2: data.f2 || data.f,
          dur: data.d || step * 0.9,
          gain: data.g || gain,
          bus: data.bus || busName,
          delay: delay + idx * step,
          pitchJitter
        });
      });
      return true;
    }

    function woodTick(delay=0, gain=0.042){
      noise({ dur:0.028, gain:gain * 0.55, bus:"ui", delay, filter:{ type:"bandpass", freq:1250, q:1.2 } });
      tone({ type:"triangle", f1:360, f2:280, dur:0.035, gain, bus:"ui", delay, pitchJitter:10 });
    }

    function barnThump(intensity=1, delay=0){
      const heft = clamp(intensity, 0.5, 1.8);
      noise({ dur:0.07 + heft * 0.018, gain:0.055 * heft, bus:"piece", delay, filter:{ type:"lowpass", freq:520, q:0.5 } });
      tone({ type:"square", f1:105, f2:58, dur:0.09 + heft * 0.025, gain:0.06 * heft, bus:"piece", delay, pitchJitter:8 });
    }

    function wolfVoice(style="tap", intensity=1, delay=0){
      const epic = style === "angry_victory";
      const victory = epic || style === "victory";
      const tiny = style === "threat";
      const heft = clamp(intensity, 0.65, 1.8);
      const dur = epic ? 1.45 : victory ? 0.72 : tiny ? 0.24 : 0.36;
      const start = epic ? 132 : victory ? 164 : tiny ? 140 : 176;
      const top = epic ? 520 : victory ? 455 : tiny ? 210 : 390;
      tone({ type:"triangle", f1:start, f2:top, dur, gain:(epic ? 0.09 : 0.06) * heft, bus:"wolf", delay, attack:0.03, release:0.16, pitchJitter:9 });
      tone({ type:"sawtooth", f1:start * 0.52, f2:top * 0.35, dur:dur * 0.92, gain:(epic ? 0.032 : 0.022) * heft, bus:"wolf", delay:delay + 0.02, attack:0.04, release:0.2, pitchJitter:7, filter:{ type:"lowpass", freq:620, q:0.6 } });
      if(epic){
        sequence([
          { f:196, d:0.16, g:0.028 },
          { f:247, d:0.16, g:0.03 },
          { f:330, d:0.2, g:0.035 },
          { f:494, d:0.22, g:0.028 }
        ], { bus:"wolf", type:"triangle", step:0.18, delay:delay + 0.56, pitchJitter:8 });
        noise({ dur:0.22, gain:0.035, bus:"wolf", delay:delay + 0.92, filter:{ type:"bandpass", freq:760, q:0.7 } });
      } else if(!tiny){
        tone({ type:"square", f1:310, f2:160, dur:0.08, gain:0.024, bus:"wolf", delay:delay + dur * 0.72, pitchJitter:16 });
      }
    }

    function sheepBleat(id, heft, delay=0){
      const black = id === "black_sheep";
      const top = black ? 360 : 535;
      const mid = black ? 260 : 390;
      tone({ type:"triangle", f1:top, f2:mid, dur:0.13 + heft * 0.025, gain:0.05 * heft, bus:"animal", delay, pitchJitter:34, filter:{ type:"bandpass", freq:black ? 420 : 640, q:0.7 } });
      tone({ type:"sine", f1:mid * 0.96, f2:mid * 0.72, dur:0.14, gain:0.028 * heft, bus:"animal", delay:delay + 0.065, pitchJitter:44 });
      tone({ type:"triangle", f1:top * 0.84, f2:mid * 0.78, dur:0.07, gain:0.024 * heft, bus:"animal", delay:delay + 0.135, pitchJitter:38 });
    }

    function goatYodel(heft, delay=0){
      sequence([
        { f:315, f2:430, d:0.052, g:0.038 * heft, type:"triangle" },
        { f:620, f2:710, d:0.058, g:0.044 * heft, type:"square" },
        { f:420, f2:285, d:0.07, g:0.034 * heft, type:"triangle" }
      ], { bus:"animal", step:0.052, delay, pitchJitter:26 });
      tone({ type:"square", f1:520, f2:260, dur:0.105, gain:0.026 * heft, bus:"animal", delay:delay + 0.09, pitchJitter:28, filter:{ type:"bandpass", freq:980, q:1.1 } });
    }

    function chickenClucks(heft, delay=0){
      noise({ dur:0.032, gain:0.024 * heft, bus:"animal", delay, filter:{ type:"bandpass", freq:1800, q:1.15 } });
      sequence([
        { f:930, d:0.028, g:0.038 * heft, type:"square" },
        { f:760, d:0.027, g:0.032 * heft, type:"square" },
        { f:1040, d:0.027, g:0.032 * heft, type:"triangle" },
        { f:690, d:0.032, g:0.026 * heft, type:"square" }
      ], { bus:"animal", step:0.031, delay:delay + 0.012, pitchJitter:30 });
      noise({ dur:0.028, gain:0.016 * heft, bus:"animal", delay:delay + 0.108, filter:{ type:"bandpass", freq:1350, q:1.05 } });
    }

    function cowMoo(heft, delay=0){
      tone({ type:"sawtooth", f1:128, f2:78, dur:0.2 + heft * 0.045, gain:0.064 * heft, bus:"animal", delay, pitchJitter:7, filter:{ type:"lowpass", freq:500, q:0.65 } });
      tone({ type:"sine", f1:88, f2:62, dur:0.24 + heft * 0.045, gain:0.05 * heft, bus:"animal", delay:delay + 0.016, pitchJitter:5 });
      tone({ type:"triangle", f1:154, f2:104, dur:0.13, gain:0.024 * heft, bus:"animal", delay:delay + 0.09, pitchJitter:8, filter:{ type:"lowpass", freq:440, q:0.7 } });
    }

    function pigOink(heft, delay=0){
      noise({ dur:0.048, gain:0.036 * heft, bus:"animal", delay, filter:{ type:"bandpass", freq:720, q:1.45 } });
      tone({ type:"square", f1:215, f2:285, dur:0.065, gain:0.046 * heft, bus:"animal", delay:delay + 0.016, pitchJitter:26 });
      tone({ type:"triangle", f1:285, f2:180, dur:0.065, gain:0.036 * heft, bus:"animal", delay:delay + 0.072, pitchJitter:26 });
      noise({ dur:0.034, gain:0.022 * heft, bus:"animal", delay:delay + 0.125, filter:{ type:"bandpass", freq:520, q:1.2 } });
    }

    function animalVoice(animal, event="chirp", intensity=1, opts={}){
      const id = AUDIO_ANIMAL_NAMES[animal] || animal;
      const delay = opts.delay || 0;
      const heft = clamp(intensity, 0.55, 1.75);
      if(id === "wolf") {
        wolfVoice(event, heft, delay);
        return true;
      }
      if(!goofyAnimalSounds){
        tone({ type:"triangle", f1:260 + (Number(animal) || 1) * 32, f2:210, dur:0.075, gain:0.035 * heft, bus:"animal", delay });
        return true;
      }
      if(id === "cow"){
        cowMoo(heft, delay);
      } else if(id === "pig"){
        pigOink(heft, delay);
      } else if(id === "sheep" || id === "black_sheep"){
        sheepBleat(id, heft, delay);
      } else if(id === "goat"){
        goatYodel(heft, delay);
      } else if(id === "chicken"){
        chickenClucks(heft, delay);
      } else {
        tone({ type:"triangle", f1:300, f2:210, dur:0.08, gain:0.04 * heft, bus:"animal", delay });
      }
      return true;
    }

    function barnyardContactChaos(payload={}){
      const settleAnimal = payload.animal;
      const neighbors = Array.isArray(payload.neighbors) ? payload.neighbors : [];
      const contactCount = Math.max(0, payload.contactCount || 0);
      const voices = [];
      if(ANIMALS.includes(settleAnimal)) voices.push(settleAnimal);
      for(const animal of neighbors){
        if(ANIMALS.includes(animal) && !voices.includes(animal)) voices.push(animal);
        if(voices.length >= 3) break;
      }
      if(!voices.length) return false;
      const bump = clamp(0.86 + contactCount * 0.055, 0.9, 1.28);
      barnThump(bump);
      noise({ dur:0.052, gain:0.022 + Math.min(4, contactCount) * 0.004, bus:"animal", delay:0.02, filter:{ type:"bandpass", freq:980, q:0.75 } });
      voices.forEach((animal, index) => {
        animalVoice(animal, index === 0 ? "bump" : "panic", 0.68 + index * 0.09, { delay:0.028 + index * 0.052 });
      });
      if(voices.length > 1){
        sequence([
          { f:300, f2:250, d:0.045, g:0.024, type:"triangle" },
          { f:420, f2:360, d:0.045, g:0.022, type:"square" }
        ], { bus:"animal", step:0.046, delay:0.11, pitchJitter:18 });
      }
      haptic(10 + Math.min(14, voices.length * 4 + contactCount));
      return true;
    }

    function animalChorus(animal, size=ACTIVE_CLEAR_THRESHOLD, mode="clear"){
      const count = mode === "settle" ? 1 : clamp(Math.round(size / 5), 2, 4);
      for(let i=0; i<count; i++){
        animalVoice(animal, mode === "settle" ? "settle" : "chorus", 0.85 + i * 0.12, { delay:i * 0.045 });
      }
    }

    const recipes = {
      animal_voice: ({ animal=null, event="chirp", intensity=1 }={}) => animalVoice(animal, event, intensity),
      ui_button_tap: () => woodTick(0, 0.034),
      ui_open_modal: () => {
        noise({ dur:0.12, gain:0.042, bus:"ui", filter:{ type:"bandpass", freq:720, q:0.55 } });
        tone({ type:"triangle", f1:240, f2:320, dur:0.08, gain:0.024, bus:"ui", delay:0.035 });
      },
      ui_close_modal: () => {
        woodTick(0, 0.034);
        tone({ type:"square", f1:210, f2:130, dur:0.05, gain:0.028, bus:"ui", delay:0.025 });
      },
      piece_move: () => {
        woodTick(0, 0.024);
        noise({ dur:0.03, gain:0.014, bus:"piece", filter:{ type:"bandpass", freq:620, q:0.9 } });
      },
      piece_rotate: () => {
        woodTick(0, 0.03);
        tone({ type:"triangle", f1:520, f2:720, dur:0.052, gain:0.034, bus:"piece", delay:0.026, pitchJitter:11 });
      },
      piece_invalid: () => {
        tone({ type:"square", f1:170, f2:95, dur:0.105, gain:0.05, bus:"piece", pitchJitter:8 });
        noise({ dur:0.038, gain:0.025, bus:"piece", delay:0.015, filter:{ type:"lowpass", freq:360, q:0.8 } });
        haptic(8);
      },
      piece_hard_drop: ({ distance=1 }={}) => {
        barnThump(1 + Math.min(8, distance) * 0.08);
        haptic(12);
      },
      piece_land: ({ animal=null, size=4 }={}) => {
        barnThump(0.9);
        if(animal) animalVoice(animal, "settle", 0.68, { delay:0.035 });
      },
      barnyard_contact_chaos: (payload={}) => barnyardContactChaos(payload),
      piece_swap: () => {
        sequence([392, 554], { bus:"piece", type:"triangle", step:0.045, gain:0.04, pitchJitter:12 });
        woodTick(0.05, 0.024);
      },
      piece_spawn: ({ animal=null, specialId="" }={}) => {
        if(["angry_wolf", "pack_howl"].includes(specialId) || animal === TILE.WOLF) return recipes.wolf_alert();
        if(specialId){
          sequence([330, 440, 392], { bus:"mission", type:"triangle", step:0.045, gain:0.032, pitchJitter:20 });
          return true;
        }
        if(animal) animalVoice(animal, "spawn", 0.55);
        return true;
      },
      herd_near: ({ animal=null, size=0 }={}) => {
        if(animal) {
          animalVoice(animal, "murmur", 0.42 + size / 18);
          animalVoice(animal, "murmur", 0.36 + size / 20, { delay:0.055 });
        } else {
          sequence([330, 360], { bus:"herd", type:"triangle", step:0.055, gain:0.026 });
        }
      },
      herd_complete: ({ animal=null, size=ACTIVE_CLEAR_THRESHOLD, mode="clear" }={}) => {
        barnThump(1.05 + size / 24);
        if(animal) animalChorus(animal, size, mode);
        if(size >= BIG_GROUP_THRESHOLD){
          sequence([392, 494, 587], { bus:"herd", type:"triangle", step:0.055, gain:0.035, delay:0.11 });
        }
        haptic(size >= BIG_GROUP_THRESHOLD ? 18 : 10);
      },
      chain_bonus: ({ depth=2 }={}) => {
        const capped = Math.min(5, Math.max(2, depth));
        sequence(Array.from({ length:capped }, (_, i) => ({ f:360 + i * 86, d:0.052, g:0.032 + i * 0.006, type:i % 2 ? "square" : "triangle" })), {
          bus:"herd",
          step:0.048,
          pitchJitter:12
        });
        if(depth >= 3) noise({ dur:0.09, gain:0.03, bus:"herd", delay:0.16, filter:{ type:"bandpass", freq:1180, q:0.8 } });
        if(depth >= 4) {
          animalVoice(TILE.CHICKEN, "party", 0.75, { delay:0.18 });
          animalVoice(TILE.PIG, "party", 0.72, { delay:0.23 });
          animalVoice(TILE.GOAT, "party", 0.68, { delay:0.28 });
        }
        haptic(depth >= 4 ? 28 : 14);
      },
      mission_start: () => {
        sequence([392, 523, 659], { bus:"mission", type:"triangle", step:0.07, gain:0.045 });
        animalVoice(TILE.CHICKEN, "rooster", 0.65, { delay:0.11 });
      },
      level_up: () => {
        sequence([392, 494, 587, 784], { bus:"mission", type:"square", step:0.06, gain:0.045, pitchJitter:8 });
        barnThump(0.72, 0.14);
      },
      mission_progress: ({ ratio=0 }={}) => {
        const base = 360 + clamp(ratio, 0, 1) * 320;
        sequence([base, base + 70], { bus:"mission", type:ratio > 0.75 ? "square" : "triangle", step:0.045, gain:0.028 + ratio * 0.016, pitchJitter:8 });
      },
      reward_countdown_start: () => sequence([620, 520, 420], { bus:"mission", type:"square", step:0.06, gain:0.046 }),
      reward_countdown: ({ remaining=0 }={}) => {
        const urgency = 1 - clamp(remaining / REWARD_COUNTDOWN_START, 0, 1);
        tone({ type:"square", f1:420 + urgency * 280, f2:360 + urgency * 180, dur:0.052, gain:0.04 + urgency * 0.02, bus:"mission" });
      },
      mission_complete: ({ rare=false }={}) => {
        sequence(rare ? [392, 523, 659, 880, 988] : [523, 659, 784, 988], {
          bus:"mission",
          type:"triangle",
          step: rare ? 0.075 : 0.065,
          gain: rare ? 0.058 : 0.048,
          pitchJitter:8
        });
        if(rare) {
          animalVoice(TILE.CHICKEN, "party", 0.7, { delay:0.24 });
          noise({ dur:0.12, gain:0.032, bus:"mission", delay:0.28, filter:{ type:"bandpass", freq:980, q:0.75 } });
        }
      },
      game_over: () => sequence([
        { f:392, d:0.12, g:0.05, type:"sawtooth" },
        { f:330, d:0.14, g:0.044, type:"sawtooth" },
        { f:262, d:0.18, g:0.038, type:"sawtooth" }
      ], { bus:"mission", step:0.11, pitchJitter:6 }),
      egg_bonus: () => {
        tone({ type:"triangle", f1:620, f2:820, dur:0.075, gain:0.04, bus:"clutter", pitchJitter:12 });
        woodTick(0.04, 0.02);
      },
      turd_penalty: () => {
        noise({ dur:0.07, gain:0.05, bus:"clutter", filter:{ type:"lowpass", freq:260, q:0.7 } });
        tone({ type:"sawtooth", f1:155, f2:86, dur:0.09, gain:0.028, bus:"clutter", delay:0.02 });
      },
      special_activate: ({ specialId="", hit=false, animal=null, count=0, style="" }={}) => {
        if(["angry_wolf", "pack_howl"].includes(specialId)) return recipes.wolf_havoc({ hit, count:count || (hit ? 4 : 0), style });
        if(["bunker_buster", "bunker", "bomb"].includes(specialId)) {
          barnThump(hit ? 1.55 : 0.9);
          noise({ dur:0.11, gain:0.055, bus:"mission", filter:{ type:"lowpass", freq:460, q:0.8 } });
          return true;
        }
        if(specialId === "rain_barrel") return sequence([294, 392, 330], { bus:"mission", type:"sine", step:0.06, gain:0.04 });
        if(specialId === "rooster_call") return animalVoice(TILE.CHICKEN, "rooster", 0.9);
        if(specialId === "egg_basket") {
          sequence([520, 660, 780], { bus:"mission", type:"triangle", step:0.045, gain:0.036 });
          return recipes.egg_bonus();
        }
        if(specialId === "muck_wagon") {
          noise({ dur:0.09, gain:0.052, bus:"clutter", filter:{ type:"lowpass", freq:320, q:0.7 } });
          tone({ type:"sawtooth", f1:190, f2:92, dur:0.1, gain:0.032, bus:"clutter", delay:0.03 });
          return true;
        }
        if(specialId === "barnstorm_crate") {
          sequence([480, 350, 620], { bus:"mission", type:"triangle", step:0.04, gain:0.04 });
          noise({ dur:0.08, gain:0.035, bus:"mission", delay:0.07, filter:{ type:"bandpass", freq:1100, q:0.9 } });
          return true;
        }
        if(animal) return animalVoice(animal, "special", 0.8);
        return sequence([392, 523], { bus:"mission", type:"triangle", step:0.05, gain:0.035 });
      },
      wolf_alert: () => {
        if(!canPlay("wolf_alert", 350)) return false;
        tone({ type:"sawtooth", f1:180, f2:112, dur:0.16, gain:0.054, bus:"wolf", pitchJitter:8, filter:{ type:"lowpass", freq:520, q:0.8 } });
        wolfVoice("threat", 0.85, 0.08);
        haptic(14);
      },
      wolf_threat: () => {
        tone({ type:"sawtooth", f1:112, f2:86, dur:0.2, gain:0.035, bus:"wolf", filter:{ type:"lowpass", freq:360, q:0.5 } });
        animalVoice(randChoice(ANIMALS), "panic", 0.48, { delay:0.05 });
      },
      wolf_havoc: ({ count=0, style="" }={}) => {
        barnThump(1.55 + Math.min(8, count) * 0.05);
        noise({ dur:0.16, gain:0.07, bus:"wolf", filter:{ type:"lowpass", freq:420, q:0.8 } });
        tone({ type:"square", f1:240, f2:72, dur:0.18, gain:0.052, bus:"wolf", delay:0.02 });
        wolfVoice(style || "tap", 1.05, 0.1);
        haptic(24);
      },
      wolf_howl: ({ style="tap", intensity=1 }={}) => wolfVoice(style, intensity),
      angry_wolves_complete: () => {
        wolfVoice("angry_victory", 1.3);
        sequence([196, 247, 330, 392, 523], { bus:"mission", type:"triangle", step:0.14, gain:0.042, delay:0.36, pitchJitter:8 });
        haptic(34);
      },
      ambient_barn: () => {
        if(Math.random() < 0.5) animalVoice(randChoice(ANIMALS), "ambient", 0.28);
        else tone({ type:"triangle", f1:130 + Math.random() * 42, f2:92 + Math.random() * 28, dur:0.16, gain:0.018, bus:"ambience", pitchJitter:28 });
      }
    };

    function playGameEventSound(eventName, payload={}){
      const cooldown = eventCooldowns[eventName] || 0;
      if(!canPlay(eventName, cooldown)) return false;
      const recipe = recipes[eventName];
      if(!recipe) return false;
      recipe(payload);
      return true;
    }

    return {
      animalVoice,
      playGameEventSound,
      syncVolumes(){
        for(const [name, g] of buses){
          g.gain.setValueAtTime(busLevels[name] ?? 0.5, audioCtx.currentTime);
        }
      }
    };
  }

  function playGameEventSound(eventName, payload={}){
    if(!HUMOR_AUDIO_ENABLED) return false;
    ensureAudio();
    if(!audioDirector && audioCtx && masterGain) audioDirector = createAudioDirector();
    if(!audioDirector) return false;
    const played = audioDirector.playGameEventSound(eventName, payload);
    if(played) audioDebugLog(`sfx:${eventName}`);
    return played;
  }

  function animalVoice(type, event="chirp", intensity=1){
    if(playGameEventSound("animal_voice", { animal:type, event, intensity })) return true;
    if(HUMOR_AUDIO_ENABLED && audioDirector) return audioDirector.animalVoice(type, event, intensity);
    return false;
  }

  function playBarnyard(animal, size, mode="clear"){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound(mode === "settle" ? "piece_land" : "herd_complete", { animal, size, mode })) return;
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

  function playBarnyardContactChaos(contactChaos, settleAnimal){
    if(!contactChaos?.neighborAnimals?.length) return false;
    return HUMOR_AUDIO_ENABLED && playGameEventSound("barnyard_contact_chaos", {
      animal: settleAnimal,
      neighbors: contactChaos.neighborAnimals,
      contactCount: contactChaos.contactCount || 0
    });
  }

  function playLevelUpJingle(){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("level_up")) return;
    playJingle([392, 494, 587, 784], { step:0.075, type:"square", gain:0.07 });
  }

  function playMissionJingle(){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("mission_complete", { rare: mission?.id === "angry_wolves" })) return;
    playJingle([523, 659, 784, 988], { step:0.07, type:"triangle", gain:0.08 });
  }

  function playMissionMeterPulse(ratio, delta=1){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("mission_progress", { ratio, delta })) return;
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
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("reward_countdown_start")) return;
    playJingle([
      { f: 620, d: 0.07, g: 0.05, type: "triangle" },
      { f: 520, d: 0.08, g: 0.055, type: "square" }
    ], { step: 0.065, type: "square", gain: 0.055 });
  }

  function playRewardCountdownPulse(remaining){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("reward_countdown", { remaining })) return;
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
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("piece_swap")) return;
    playJingle([
      { f: 440, d: 0.06, g: 0.05, type: "triangle" },
      { f: 554, d: 0.06, g: 0.05, type: "triangle" }
    ], { step:0.05 });
  }

  function playGameOverJingle(){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("game_over")) return;
    playJingle([
      { f: 392, d: 0.12, g: 0.07, type: "sawtooth" },
      { f: 330, d: 0.14, g: 0.065, type: "sawtooth" },
      { f: 262, d: 0.18, g: 0.06, type: "sawtooth" }
    ], { step:0.11 });
  }

  function triggerWolfHowlFx(duration=WOLF_BADGE_HOWL_MS){
    if(!wolfHowlButton) return;
    wolfHowlButton.classList.remove("isHowling");
    void wolfHowlButton.offsetWidth;
    wolfHowlButton.classList.add("isHowling");
    if(wolfHowlFxTimer){
      clearTimeout(wolfHowlFxTimer);
    }
    wolfHowlFxTimer = window.setTimeout(() => {
      wolfHowlButton.classList.remove("isHowling");
      wolfHowlFxTimer = 0;
    }, duration);
  }

  function playWolfHowl(options="tap"){
    const settings = typeof options === "string" ? { style: options } : (options || {});
    const style = settings.style || "tap";
    const epic = style === "angry_victory";
    const triumphant = epic || style === "victory";
    const intensity = Number.isFinite(settings.intensity)
      ? settings.intensity
      : epic ? 1.25 : triumphant ? 1 : 0.82;
    if(settings.fromGesture) safeResumeAudioFromGesture();
    if(settings.animateBadge !== false){
      triggerWolfHowlFx(epic ? 1120 : triumphant ? 760 : WOLF_BADGE_HOWL_MS);
    }
    if(HUMOR_AUDIO_ENABLED && playGameEventSound(epic ? "angry_wolves_complete" : "wolf_howl", { style, intensity, source:settings.source || "" })) return;
    if(!prepareAudioPlayback()) return;
    playTone({
      type:"triangle",
      f1: epic ? 176 : triumphant ? 230 : 200,
      f2: epic ? 540 : triumphant ? 520 : 420,
      dur: epic ? 0.88 : triumphant ? 0.34 : 0.28,
      gain: (epic ? 0.085 : triumphant ? 0.08 : 0.06) * intensity
    });
    playTone({
      type:"sine",
      f1: epic ? 102 : triumphant ? 128 : 116,
      f2: epic ? 228 : triumphant ? 190 : 166,
      dur: epic ? 0.82 : triumphant ? 0.3 : 0.24,
      gain: (epic ? 0.05 : triumphant ? 0.048 : 0.038) * intensity
    });
    if(triumphant){
      playJingle([
        { f: epic ? 294 : 392, d: epic ? 0.18 : 0.11, g: epic ? 0.04 : 0.032, type: "triangle" },
        { f: epic ? 392 : 494, d: epic ? 0.22 : 0.14, g: epic ? 0.04 : 0.034, type: "triangle" },
        { f: epic ? 523 : 0, d: epic ? 0.26 : 0.01, g: epic ? 0.045 : 0, type: "triangle" }
      ].filter((note) => note.f > 0), { step: epic ? 0.16 : 0.08, type: "triangle", gain: epic ? 0.04 : 0.03 });
    }
    if(epic){
      playTone({ type:"sawtooth", f1:96, f2:164, dur:0.96, gain:0.03 });
    }
  }

  function playDropThump(){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("piece_hard_drop")) return;
    playTone({type:"square", f1:100, f2:65, dur:0.06, gain:0.08});
  }

  function playInvalidMove(){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("piece_invalid")) return;
    playTone({type:"square", f1:190, f2:96, dur:0.08, gain:0.04});
  }

  function playMoveTick(){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("piece_move")) return;
    playTone({type:"triangle", f1:420, f2:390, dur:0.035, gain:0.028});
  }

  function playRotateTick(){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("piece_rotate")) return;
    playTone({type:"triangle", f1:520, f2:690, dur:0.05, gain:0.04});
  }

  function playLockTick(){
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("piece_land")) return;
    playTone({type:"square", f1:170, f2:120, dur:0.05, gain:0.05});
    playTone({noise:true, dur:0.025, gain:0.018});
  }

  function playChainBonusSting(depth){
    if(!USE_ENHANCED_CHAOS_AUDIO || depth <= 1) return;
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("chain_bonus", { depth })) return;
    const capped = Math.min(5, depth);
    const notes = Array.from({ length: capped - 1 }, (_, idx) => ({
      f: 420 + idx * 62,
      d: 0.055 + idx * 0.008,
      g: 0.03 + idx * 0.005,
      type: idx % 2 ? "square" : "triangle"
    }));
    playJingle(notes, { step: 0.05, type: "triangle", gain: 0.04 });
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
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("piece_spawn", { animal, specialId: piece?.specialId || "", kind: piece?.kind || "" })) return;
    if(piece?.kind === "MISSION_SPECIAL"){
      const specialId = piece.specialId;
      if(["bomb", "bunker", "bunker_buster"].includes(specialId)){
        playJingle([330, 247, 196], { step:0.07, type:"sawtooth", gain:0.05 });
      } else if(["reaper", "salt_lick"].includes(specialId)){
        playJingle([659, 523], { step:0.06, type:"triangle", gain:0.045 });
      } else if(["morph", "produce", "barn_goods"].includes(specialId)){
        playJingle([392, 523, 659], { step:0.05, type:"triangle", gain:0.04 });
      } else if(["seeder", "barnstorm_crate", "egg_basket", "muck_wagon"].includes(specialId)){
        playJingle([523, 440], { step:0.07, type:"square", gain:0.04 });
      } else if(["brand", "feed", "rooster_call"].includes(specialId)){
        playJingle([330, 392, 523], { step:0.06, type:"triangle", gain:0.04 });
      } else if(specialId === "rain_barrel"){
        playJingle([294, 392, 330], { step:0.07, type:"sine", gain:0.04 });
      } else if(["angry_wolf", "pack_howl"].includes(specialId)){
        playJingle([220, 196, 165], { step:0.08, type:"sawtooth", gain:0.05 });
      }
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
    if(HUMOR_AUDIO_ENABLED && playGameEventSound("ambient_barn")) return;
    if(Math.random() < (USE_ENHANCED_CHAOS_AUDIO ? 0.1 : 0.08)){
      playJingle([
        { f: 165 + Math.random()*35, d: 0.08, g: 0.03, type: "sine" },
        { f: 220 + Math.random()*25, d: 0.06, g: 0.02, type: "triangle" }
      ], { step:0.12 });
    } else if(USE_ENHANCED_CHAOS_AUDIO && Math.random() < 0.035){
      playTone({ type:"triangle", f1:140 + Math.random()*28, f2:90 + Math.random()*18, dur:0.14, gain:0.022 });
    }
  }

  function playSpecialCue(specialId, payload={}){
    return HUMOR_AUDIO_ENABLED && playGameEventSound("special_activate", { specialId, ...payload });
  }

  function maybePlayNearHerdMurmur(){
    if(!HUMOR_AUDIO_ENABLED || !REFRESH_V2_ENABLED || gameOver) return;
    const nearMin = Math.max(2, ACTIVE_CLEAR_THRESHOLD - V2_NEAR_CLEAR_MARGIN);
    const near = findAnimalGroups(board, nearMin)
      .filter((group) => group.cells.length < ACTIVE_CLEAR_THRESHOLD)
      .sort((a, b) => b.cells.length - a.cells.length)[0];
    if(!near) return;
    playGameEventSound("herd_near", { animal: near.animal, size: near.cells.length, threshold: ACTIVE_CLEAR_THRESHOLD });
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
  function weightedChoice(arr, weightFn=(entry) => entry?.weight ?? 1){
    if(!arr?.length) return null;
    let total = 0;
    for(const entry of arr){
      total += Math.max(0, Number(weightFn(entry)) || 0);
    }
    if(total <= 0) return arr[0];
    let roll = Math.random() * total;
    for(const entry of arr){
      roll -= Math.max(0, Number(weightFn(entry)) || 0);
      if(roll <= 0) return entry;
    }
    return arr[arr.length - 1];
  }
  function clone2(m){ return m.map(r => r.slice()); }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
  function fmtChain(v){ return `x${Math.max(0, v|0)}`; }
  function missionProgressText(value, target){ return `${Math.min(value, target)} / ${target}`; }
  function quipForAnimal(animal){ return randChoice(CLEAR_QUIPS[animal] || ["Barnyard bedlam."]); }
  function missionSpecialEntry(id){
    return id ? (MISSION_SPECIAL_LIBRARY[id] || null) : null;
  }
  function missionSpecialLoadout(sourceMission=mission){
    if(!sourceMission) return [];
    if(Array.isArray(sourceMission.specials) && sourceMission.specials.length){
      return sourceMission.specials;
    }
    if(sourceMission.special){
      return [{ id: sourceMission.special, weight: 1 }];
    }
    return [];
  }
  function missionPrimarySpecialId(sourceMission=mission){
    return missionSpecialLoadout(sourceMission)[0]?.id || null;
  }
  function missionSecondarySpecialId(sourceMission=mission){
    return missionSpecialLoadout(sourceMission)[1]?.id || null;
  }
  function missionSpecialEvery(sourceMission=mission){
    if(!sourceMission) return 5;
    if(Number.isFinite(sourceMission.specialEvery)) return sourceMission.specialEvery;
    return missionSpecialEntry(missionPrimarySpecialId(sourceMission))?.every ?? 5;
  }
  function describeSpecial(id, opts={}){
    const entry = missionSpecialEntry(id);
    if(!entry) return "";
    return typeof entry.desc === "function" ? entry.desc(opts) : (entry.desc || "");
  }
  function specialJoinRateLabel(sourceMission=mission){
    const every = missionSpecialEvery(sourceMission);
    return Number.isFinite(every) ? `About every ${every.toFixed(every % 1 ? 1 : 0)} settles` : "";
  }
  function productInfoForAnimal(animal){
    return PRODUCT_INFO[animal] || PRODUCT_INFO[TILE.SHEEP];
  }
  function animalWord(animal){
    return ANIMAL_NAME[animal] || "animals";
  }
  function animalTieBreakIndex(animal){
    const idx = ANIMALS.indexOf(animal);
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  }
  function lowerBarnStartRow(){
    return Math.floor(ROWS / 2);
  }
  function overlayCounts(){
    const counts = { eggs: 0, turds: 0, mud: 0 };
    for(let y=0; y<ROWS; y++){
      for(let x=0; x<COLS; x++){
        if(overlay[y][x] === POWER.EGG) counts.eggs++;
        if(overlay[y][x] === POWER.TURD) counts.turds++;
        if(overlay[y][x] === POWER.MUD) counts.mud++;
      }
    }
    return counts;
  }
  function clutterSoftSpawnChance(power, spawnedSoFar=0, opts={}){
    const counts = overlayCounts();
    const tuning = ACTIVE_CLUTTER_TUNING;
    const existingType = power === POWER.EGG ? counts.eggs : counts.turds;
    const typeSoftCap = (power === POWER.EGG ? tuning.eggSoftCap : tuning.turdSoftCap)
      + ((opts.allowOverflow ? tuning.chaosOverflowAllowance : 0) || 0);
    const totalSoftCap = tuning.totalSoftCap + ((opts.allowOverflow ? tuning.chaosOverflowAllowance : 0) || 0);
    let chance = power === POWER.EGG ? tuning.restockEggChance : tuning.restockTurdChance;
    const typeCount = existingType + spawnedSoFar;
    const totalCount = counts.eggs + counts.turds + counts.mud + spawnedSoFar;
    if(typeCount >= typeSoftCap) chance *= 0.18;
    else if(typeCount >= Math.max(0, typeSoftCap - 2)) chance *= 0.42;
    if(totalCount >= totalSoftCap) chance *= 0.22;
    else if(totalCount >= Math.max(0, totalSoftCap - 2)) chance *= 0.5;
    return chance;
  }
  function rollRestockCount(power, consumed, opts={}){
    const tuning = ACTIVE_CLUTTER_TUNING;
    const maxSpawn = power === POWER.EGG ? tuning.maxEggRestock : tuning.maxTurdRestock;
    let spawned = 0;
    for(let i=0; i<Math.max(0, consumed|0); i++){
      if(Math.random() < clutterSoftSpawnChance(power, spawned, opts)) spawned++;
      if(spawned >= maxSpawn) break;
    }
    return spawned;
  }
  function formatRestockToast(eggs, turds){
    const parts = [];
    if(eggs > 0) parts.push(`+${eggs} 🥚`);
    if(turds > 0) parts.push(`+${turds} 💩`);
    return parts.length ? `Lower barn ${parts.join(" ")}` : "";
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
  function currentMissionBonus(){
    return mission && mission.done ? mission.cashBonus : 0;
  }
  function currentTotalScore(){
    return Math.max(0, (score + currentMissionBonus())|0);
  }
  function leaderboardConfigured(){
    return !!APPS_SCRIPT_URL && !APPS_SCRIPT_URL.includes("PASTE_APPS_SCRIPT_WEB_APP_URL_HERE");
  }
  function sanitizeLeaderboardName(raw){
    return String(raw || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, SCORE_NAME_MAX);
  }
  function loadStoredLeaderboardName(){
    try{
      return sanitizeLeaderboardName(localStorage.getItem(PLAYER_NAME_STORAGE_KEY));
    }catch{
      return "";
    }
  }
  function saveStoredLeaderboardName(name){
    try{
      localStorage.setItem(PLAYER_NAME_STORAGE_KEY, sanitizeLeaderboardName(name));
    }catch{}
  }
  function generateNonce(){
    if(window.crypto?.randomUUID) return window.crypto.randomUUID();
    if(window.crypto?.getRandomValues){
      const buf = new Uint32Array(4);
      window.crypto.getRandomValues(buf);
      return Array.from(buf, (v) => v.toString(16).padStart(8, "0")).join("-");
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
  function leaderboardMetaLine(entry, compact=false){
    const parts = [];
    if(entry.missionTitle) parts.push(entry.missionTitle);
    if(entry.bestChain > 0){
      parts.push(compact ? `${entry.bestChain}x 🔗` : `Best ${fmtChain(entry.bestChain)}`);
    }
    if(entry.biggestHerdCount > 0 && entry.biggestHerdAnimal) parts.push(`${entry.biggestHerdCount} ${entry.biggestHerdAnimal}`);
    return parts.join(" · ");
  }
  function normalizeLeaderboardEntry(entry, index=0){
    if(!entry) return null;
    const normalized = {
      rank: Math.max(1, Number(entry.rank) || index + 1),
      playerName: sanitizeLeaderboardName(entry.playerName ?? entry.player_name ?? ""),
      score: Math.max(0, Number(entry.score) || 0),
      missionTitle: String(entry.missionTitle ?? entry.mission_title ?? "").trim().slice(0, 80),
      bestChain: Math.max(0, Number(entry.bestChain ?? entry.best_chain) || 0),
      biggestHerdCount: Math.max(0, Number(entry.biggestHerdCount ?? entry.biggest_herd_count) || 0),
      biggestHerdAnimal: String(entry.biggestHerdAnimal ?? entry.biggest_herd_animal ?? "").trim().slice(0, 8),
      gameMode: String(entry.gameMode ?? entry.game_mode ?? GAME_MODE).trim() || GAME_MODE,
      sourceNonce: String(entry.sourceNonce ?? entry.source_nonce ?? "").trim()
    };
    if(!normalized.playerName) normalized.playerName = "ANON";
    return normalized;
  }
  function rankLeaderboardEntries(entries){
    const indexed = Array.isArray(entries)
      ? entries.map((entry, index) => ({ entry: normalizeLeaderboardEntry(entry, index), index })).filter((row) => row.entry)
      : [];
    indexed.sort((a, b) => {
      const scoreDelta = b.entry.score - a.entry.score;
      if(scoreDelta) return scoreDelta;
      const chainDelta = b.entry.bestChain - a.entry.bestChain;
      if(chainDelta) return chainDelta;
      const herdDelta = b.entry.biggestHerdCount - a.entry.biggestHerdCount;
      if(herdDelta) return herdDelta;
      return a.index - b.index;
    });
    return indexed.slice(0, LEADERBOARD_FULL_LIMIT).map(({ entry }, index) => ({
      ...entry,
      rank: index + 1
    }));
  }
  function leaderboardEntryFromSubmission(submission){
    if(!submission) return null;
    return normalizeLeaderboardEntry({
      rank: LEADERBOARD_FULL_LIMIT,
      playerName: submission.playerName,
      score: submission.score,
      missionTitle: submission.missionTitle,
      bestChain: submission.bestChain,
      biggestHerdCount: submission.biggestHerdCount,
      biggestHerdAnimal: submission.biggestHerdAnimal,
      gameMode: submission.gameMode,
      sourceNonce: submission.nonce
    });
  }
  function mergeSubmittedLeaderboardEntry(submission, entries=leaderboardEntries){
    const optimisticEntry = leaderboardEntryFromSubmission(submission);
    if(!optimisticEntry) return rankLeaderboardEntries(entries);
    const next = Array.isArray(entries) ? entries.slice() : [];
    const existingIndex = next.findIndex((entry) => leaderboardEntryMatchesSubmission(entry, submission));
    if(existingIndex >= 0){
      next[existingIndex] = { ...next[existingIndex], ...optimisticEntry };
    } else {
      next.push(optimisticEntry);
    }
    return rankLeaderboardEntries(next);
  }
  function leaderboardEntryMatchesSubmission(entry, submission){
    if(!entry || !submission) return false;
    if(entry.sourceNonce && submission.nonce && entry.sourceNonce === submission.nonce) return true;
    return entry.playerName === submission.playerName
      && entry.score === submission.score
      && entry.missionTitle === submission.missionTitle
      && entry.bestChain === submission.bestChain
      && entry.biggestHerdCount === submission.biggestHerdCount
      && entry.biggestHerdAnimal === submission.biggestHerdAnimal;
  }
  function leaderboardRankForSubmission(submission){
    const found = leaderboardEntries.find((entry) => leaderboardEntryMatchesSubmission(entry, submission));
    return found ? found.rank : 0;
  }
  function leaderboardCutoffScore(){
    if(!leaderboardEntries.length) return 0;
    const ranked = leaderboardEntries.slice(0, LEADERBOARD_FULL_LIMIT);
    return ranked[ranked.length - 1]?.score || 0;
  }
  function leaderboardIsFull(){
    return leaderboardEntries.length >= LEADERBOARD_FULL_LIMIT;
  }
  function qualifiesForPublicLeaderboard(score=currentTotalScore()){
    const total = Math.max(0, Number(score) || 0);
    if(total <= 0) return false;
    if(!leaderboardIsFull()) return true;
    return total > leaderboardCutoffScore();
  }
  function shouldOfferScoreSubmission(){
    if(!gameOver || !leaderboardConfigured() || leaderboardSubmitDismissed || submittedRunId === runId) return false;
    if(currentTotalScore() <= 0) return false;
    if(leaderboardLoading && !leaderboardEntries.length) return true;
    if(leaderboardIsFull() && !qualifiesForPublicLeaderboard()) return false;
    return true;
  }
  function scoreSubmissionHintText(){
    if(!leaderboardConfigured()) return "Set APPS_SCRIPT_URL to enable score posts.";
    if(leaderboardLoading && !leaderboardEntries.length) return "Barn board is loading. You can still send this run.";
    if(leaderboardEntries.length < LEADERBOARD_FULL_LIMIT) return "The public board is still filling up. Any positive run can post.";
    if(!qualifiesForPublicLeaderboard()){
      return `Public cutoff right now: ${leaderboardCutoffScore()} coins. Beat it to make the top 20.`;
    }
    return `Public cutoff right now: ${leaderboardCutoffScore()} coins.`;
  }
  function setSubmitStatus(message="", tone=""){
    leaderboardSubmitMessage = message;
    leaderboardSubmitTone = tone;
  }
  function buildScoreSubmission(playerName){
    return {
      playerName,
      score: currentTotalScore(),
      gameMode: GAME_MODE,
      missionTitle: mission?.title ?? shareSnapshot?.missionTitle ?? "Barn Trouble",
      bestChain: bestCombo,
      biggestHerdCount: bestHerd?.count || 0,
      biggestHerdAnimal: bestHerd ? (TILE_LABEL[bestHerd.animal] || "") : "",
      herdsCleared,
      pace: level,
      cols: COLS,
      rows: ROWS,
      durationMs: Math.max(0, Date.now() - runStartedAtMs),
      nonce: generateNonce(),
      clientTimestamp: Date.now(),
      version: GAME_VERSION
    };
  }
  function shareLeaderboardLine(){
    return submittedLeaderboardRank > 0 ? `Barn Board: #${submittedLeaderboardRank}` : "";
  }
  function parseJsonSafely(text){
    try{
      return text ? JSON.parse(text) : {};
    }catch{
      return {};
    }
  }
  function setLeaderboardState(el, message="", tone=""){
    if(!el) return;
    el.textContent = message;
    el.classList.remove("hidden", "success", "error");
    if(!message) el.classList.add("hidden");
    if(tone === "success") el.classList.add("success");
    if(tone === "error") el.classList.add("error");
  }
  function renderLeaderboardList(target, entries, opts={}){
    if(!target) return;
    target.innerHTML = "";
    const compact = !!opts.compact;
    if(!entries.length){
      if(opts.emptyText === ""){
        return;
      }
      const empty = document.createElement("div");
      empty.className = "leaderboardEmpty";
      empty.textContent = opts.emptyText || "No public scores yet.";
      target.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    entries.forEach((entry, index) => {
      const row = document.createElement("div");
      row.className = "leaderboardRow";

      const rank = document.createElement("div");
      rank.className = "leaderboardRank";
      rank.textContent = `#${entry.rank || index + 1}`;

      const nameBlock = document.createElement("div");
      nameBlock.className = "leaderboardNameBlock";

      const name = document.createElement("div");
      name.className = "leaderboardName";
      name.textContent = entry.playerName || "ANON";

      const meta = document.createElement("div");
      meta.className = "leaderboardMeta";
      meta.textContent = leaderboardMetaLine(entry, compact) || (compact ? "Public board" : "Approved public score");

      const scoreValue = document.createElement("div");
      scoreValue.className = "leaderboardScore";
      scoreValue.textContent = `${Math.max(0, entry.score|0)}`;

      nameBlock.appendChild(name);
      nameBlock.appendChild(meta);
      row.appendChild(rank);
      row.appendChild(nameBlock);
      row.appendChild(scoreValue);
      frag.appendChild(row);
    });
    target.appendChild(frag);
  }
  function syncLeaderboardViews(){
    const previewMessage = !leaderboardConfigured()
      ? "Leaderboard not connected yet."
      : leaderboardLoading && !leaderboardEntries.length
        ? "Loading scores…"
        : leaderboardError
          ? leaderboardError
          : leaderboardEntries.length
            ? "Top public scores"
            : "No public scores yet.";
    const previewTone = leaderboardError ? "error" : "";
    setLeaderboardState(leaderboardPreviewStateEl, previewMessage, previewTone);
    setLeaderboardState(leaderboardModalStateEl, previewMessage, previewTone);

    renderLeaderboardList(leaderboardPreviewListEl, leaderboardEntries.slice(0, LEADERBOARD_PREVIEW_LIMIT), {
      compact: true,
      emptyText: ""
    });
    renderLeaderboardList(leaderboardModalListEl, leaderboardEntries.slice(0, LEADERBOARD_FULL_LIMIT), {
      compact: false,
      emptyText: ""
    });
  }
  function syncScoreSubmissionUI(){
    if(!scoreSubmitSectionEl) return;
    const alreadyHandled = submittedRunId === runId;
    const shouldShow = !!(!leaderboardSubmitDismissed && gameOver && (shouldOfferScoreSubmission() || alreadyHandled || leaderboardSubmitPending || leaderboardSubmitMessage));
    scoreSubmitSectionEl.classList.toggle("hidden", !shouldShow);
    if(!shouldShow) return;

    if(scoreNameInputEl && !scoreNameInputEl.value){
      scoreNameInputEl.value = loadStoredLeaderboardName();
    }

    const disabled = leaderboardSubmitPending || alreadyHandled || !leaderboardConfigured();
    if(scoreNameInputEl) scoreNameInputEl.disabled = disabled;
    if(scoreSubmitButton) scoreSubmitButton.disabled = disabled;
    if(scoreSkipButton) scoreSkipButton.disabled = leaderboardSubmitPending;
    if(scoreSkipButton) scoreSkipButton.textContent = alreadyHandled ? "Done" : "Skip";
    if(scoreSubmitRowEl) scoreSubmitRowEl.classList.toggle("hidden", alreadyHandled);
    if(scoreSubmitHintEl) scoreSubmitHintEl.textContent = alreadyHandled && leaderboardSubmitMessage ? leaderboardSubmitMessage : scoreSubmissionHintText();
    setLeaderboardState(scoreSubmitStatusEl, alreadyHandled ? "" : leaderboardSubmitMessage, leaderboardSubmitTone);
  }
  async function refreshLeaderboard(opts={}){
    const force = !!opts.force;
    const preserveSubmission = opts.preserveSubmission || null;
    if(leaderboardLoading) return;
    if(!leaderboardConfigured()){
      leaderboardEntries = [];
      leaderboardError = "Leaderboard not connected yet.";
      leaderboardLoading = false;
      syncLeaderboardViews();
      syncScoreSubmissionUI();
      return;
    }
    if(!force && leaderboardEntries.length && (Date.now() - leaderboardLastLoadedAt) < LEADERBOARD_CACHE_MS){
      syncLeaderboardViews();
      syncScoreSubmissionUI();
      return;
    }

    leaderboardLoading = true;
    if(!leaderboardEntries.length) leaderboardError = "";
    syncLeaderboardViews();
    syncScoreSubmissionUI();

    try{
      const url = new URL(APPS_SCRIPT_URL);
      url.searchParams.set("limit", LEADERBOARD_FULL_LIMIT);
      url.searchParams.set("gameMode", GAME_MODE);
      const res = await fetch(url.toString(), {
        method: "GET",
        cache: "no-store"
      });
      const data = parseJsonSafely(await res.text());
      if(!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
      leaderboardEntries = rankLeaderboardEntries(Array.isArray(data.entries) ? data.entries : []);
      if(preserveSubmission){
        leaderboardEntries = mergeSubmittedLeaderboardEntry(preserveSubmission, leaderboardEntries);
      }
      leaderboardLastLoadedAt = Date.now();
      leaderboardError = "";
    }catch(err){
      if(preserveSubmission){
        leaderboardEntries = mergeSubmittedLeaderboardEntry(preserveSubmission, leaderboardEntries);
        leaderboardLastLoadedAt = Date.now();
      }
      leaderboardError = leaderboardEntries.length ? "Leaderboard refresh failed." : "Leaderboard offline right now.";
    }finally{
      leaderboardLoading = false;
      syncLeaderboardViews();
      syncScoreSubmissionUI();
    }
  }
  async function submitCurrentScore(){
    if(leaderboardSubmitPending) return;
    if(!shouldOfferScoreSubmission()) return;
    const playerName = sanitizeLeaderboardName(scoreNameInputEl?.value);
    if(!playerName){
      setSubmitStatus("Use 1-10 letters or numbers.", "error");
      syncScoreSubmissionUI();
      if(scoreNameInputEl) scoreNameInputEl.focus();
      return;
    }
    if(!leaderboardConfigured()){
      setSubmitStatus("Set APPS_SCRIPT_URL before posting scores.", "error");
      syncScoreSubmissionUI();
      return;
    }

    leaderboardSubmitPending = true;
    setSubmitStatus("Sending this run to the barn board…", "");
    syncScoreSubmissionUI();

    try{
      const payload = buildScoreSubmission(playerName);
      const publicCutoffBeforeSubmit = leaderboardIsFull() ? leaderboardCutoffScore() : 0;
      const likelyOffBoard = leaderboardIsFull() && payload.score <= publicCutoffBeforeSubmit;
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });
      const data = parseJsonSafely(await res.text());
      if(!res.ok || data.ok === false){
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }

      saveStoredLeaderboardName(playerName);
      submittedRunId = runId;
      submittedLeaderboardRank = 0;
      if(data.status === "suspect"){
        setSubmitStatus("Saved for review. It will stay off the public board for now.", "");
      } else {
        leaderboardEntries = mergeSubmittedLeaderboardEntry(payload, leaderboardEntries);
        leaderboardLastLoadedAt = Date.now();
        leaderboardError = "";
        submittedLeaderboardRank = leaderboardRankForSubmission(payload);
        syncLeaderboardViews();
        setSubmitStatus(
          likelyOffBoard
            ? "Run logged for barn tuning. The public board still shows only the top 20."
            : submittedLeaderboardRank > 0
              ? `Run logged to the public barn board at #${submittedLeaderboardRank}.`
              : "Run logged to the public barn board.",
          "success"
        );
        refreshLeaderboard({ force: true, preserveSubmission: payload }).then(() => {
          submittedLeaderboardRank = leaderboardRankForSubmission(payload);
          syncLeaderboardViews();
          syncScoreSubmissionUI();
        });
      }
    }catch(err){
      const message = typeof err?.message === "string" ? err.message.trim() : "";
      setSubmitStatus(message && !/^HTTP \d+$/i.test(message) ? message : "Could not reach the barn board.", "error");
    }finally{
      leaderboardSubmitPending = false;
      syncScoreSubmissionUI();
    }
  }
  function dismissCurrentScoreSubmission(){
    leaderboardSubmitDismissed = true;
    syncScoreSubmissionUI();
  }
  function openLeaderboard(){
    playGameEventSound("ui_open_modal");
    setOverlayOpen(leaderboardBackdrop, true);
    refreshLeaderboard({ force: !leaderboardEntries.length });
    draw();
  }
  function closeLeaderboard(){
    playGameEventSound("ui_close_modal");
    setOverlayOpen(leaderboardBackdrop, false);
    draw();
  }
  function resetRunLeaderboardState(){
    runStartedAtMs = Date.now();
    runId = generateNonce();
    submittedRunId = "";
    submittedLeaderboardRank = 0;
    leaderboardSubmitPending = false;
    leaderboardSubmitDismissed = false;
    leaderboardSubmitTone = "";
    leaderboardSubmitMessage = "";
    if(scoreNameInputEl) scoreNameInputEl.value = loadStoredLeaderboardName();
    syncLeaderboardViews();
    syncScoreSubmissionUI();
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
      const herdBadge = TILE_LABEL[bestHerd.animal] || animalWord(bestHerd.animal);
      return `I built ${bestHerd.count} ${herdBadge} in Angry Wolves for ${totalScore} coins.`;
    }
    return `I stirred up the barn in Angry Wolves for ${totalScore} coins.`;
  }
  function shareTextBody(){
    const lines = [
      shareBragLine(),
      `Mission: ${mission?.title ?? "Barn Trouble"}`,
      `Play: ${shareUrl()}`
    ];
    const leaderboardLine = shareLeaderboardLine();
    if(leaderboardLine) lines.push(leaderboardLine);
    return lines.join("\n");
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
    if(mission.type === "destroy") return `${missionProgressText(mission.progress, mission.target)} ${animalWord(mission.animal)} wrecked`;
    if(mission.type === "clears") return `${missionProgressText(mission.progress, mission.target)} clears`;
    if(mission.type === "combo") return `${fmtChain(bestCombo)} / ${fmtChain(mission.target)}`;
    if(mission.type === "wolf") return `${missionProgressText(mission.progress, mission.target)} wolves`;
    if(mission.type === "score") return `${missionProgressText(score, mission.target)} coins`;
    if(mission.type === "level") return `Lv ${level}/${mission.target}`;
    if(mission.type === "big_group") return `${missionProgressText(mission.progress, mission.target)} jumbo`;
    if(mission.type === "large_clears") return `${missionProgressText(mission.progress, mission.target)} of ${mission.minSize}+`;
    if(mission.type === "variety") return `${missionProgressText(mission.progress, mission.target)} species`;
    if(mission.type === "egg_clear") return `${missionProgressText(mission.progress, mission.target)} egg herds`;
    if(mission.type === "product"){
      return mission.animal
        ? `${missionProgressText(mission.progress, mission.target)} ${productInfoForAnimal(mission.animal).plural}`
        : `${missionProgressText(mission.progress, mission.target)} goods`;
    }
    if(mission.type === "build_group") return `${missionCurrentProgress()} live`;
    if(mission.type === "turds") return `${missionProgressText(mission.progress, mission.target)} ${REFRESH_V2_ENABLED ? "messes" : "turds"}`;
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
    return `Then clear the reward herd within ${REWARD_COUNTDOWN_START} settles when the coin lands. Miss it and the run ends.`;
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
    return !!piece && piece.kind === "MISSION_SPECIAL";
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
    if(r < ACTIVE_GLOBAL_SPECIAL_SPAWN_WEIGHTS.wolves) return "WOLVES";
    if(r < ACTIVE_GLOBAL_SPECIAL_SPAWN_WEIGHTS.wolves + ACTIVE_GLOBAL_SPECIAL_SPAWN_WEIGHTS.blackSheep) return "BLACKSHEEP";
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

  function missionSpecialProductAnimal(sourceMission=mission, opts={}){
    if(opts.productAnimal) return opts.productAnimal;
    if(sourceMission?.animal) return sourceMission.animal;
    if(Array.isArray(sourceMission?.goodsAnimals) && sourceMission.goodsAnimals.length){
      return randChoice(sourceMission.goodsAnimals);
    }
    return randChoice(ANIMALS);
  }

  function createMissionSpecialPiece(opts={}){
    const {
      forSpawn = false,
      specialId = missionPrimarySpecialId(),
      sourceMission = mission,
      productAnimal = null
    } = opts;
    const entry = missionSpecialEntry(specialId);
    if(!entry) return null;

    if(entry.usesProductAnimal){
      const specialAnimal = missionSpecialProductAnimal(sourceMission, { productAnimal });
      const product = productInfoForAnimal(specialAnimal);
      return {
        kind: "MISSION_SPECIAL",
        specialId,
        productAnimal: specialAnimal,
        productTile: product.tile,
        x: Math.floor(COLS/2)-1,
        y: 0,
        matrix: SPECIAL.PRODUCE_O.matrix.map((row) => row.map((v) => v ? product.tile : 0)),
        rotates: false
      };
    }

    if(entry.usesSeederMatrix){
      return {
        kind: "MISSION_SPECIAL",
        specialId,
        x: Math.floor(COLS/2)-1,
        y: 0,
        matrix: createSeederMatrix({ randomize: forSpawn }),
        rotates: true
      };
    }

    const spec = SPECIAL[entry.specKey];
    if(!spec) return null;
    const centeredX = Math.floor((COLS - spec.matrix[0].length) / 2);
    return {
      kind: "MISSION_SPECIAL",
      specialId,
      x: centeredX,
      y: 0,
      matrix: materializeSpecMatrix(spec),
      rotates: !!spec.rotates
    };
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
    const cols = 4;
    const rows = REFRESH_V2_ENABLED && el === nextPreviewEl ? 3 : 4;
    const grid = Array.from({length:rows}, () => Array(cols).fill(0));
    let m = trimmedMatrix(piece);
    const activeTiles = [];
    for(let y=0;y<m.length;y++){
      for(let x=0;x<m[y].length;x++){
        if(m[y][x]) activeTiles.push({ x, y, tile: m[y][x] });
      }
    }
    const straightLine = activeTiles.length === 4 && (
      activeTiles.every((cell) => cell.y === activeTiles[0].y) ||
      activeTiles.every((cell) => cell.x === activeTiles[0].x)
    );
    if(rows === 3 && straightLine){
      m = [activeTiles.map((cell) => cell.tile)];
    }
    const offsetY = straightLine && rows === 3
      ? 1
      : clamp(Math.round((rows - m.length) / 2), 0, Math.max(0, rows - m.length));
    const offsetX = clamp(Math.round((cols - (m[0]?.length || 0)) / 2), 0, Math.max(0, cols - (m[0]?.length || 0)));

    for(let y=0;y<m.length;y++){
      for(let x=0;x<m[y].length;x++){
        if(m[y][x] && grid[offsetY + y]?.[offsetX + x] !== undefined) grid[offsetY + y][offsetX + x] = m[y][x];
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

  function createHelpSpecialPiece(specialId, opts={}){
    const sourceMission = {
      animal: opts.animal ?? TILE.COW,
      goodsAnimals: opts.goodsAnimals ?? ANIMALS,
      specials: [{ id: specialId, weight: 1 }]
    };
    return createMissionSpecialPiece({
      specialId,
      sourceMission,
      forSpawn: false,
      productAnimal: opts.productAnimal ?? opts.animal ?? TILE.COW
    });
  }

  function renderHelpSpecialList(el, entries){
    if(!el) return;
    el.innerHTML = entries.map((entry, idx) => `
      <div class="helpSpecialCard">
        <div id="${entry.id}-${idx}" class="previewGrid helpSpecialPreview"></div>
        <p class="helpText"><b>${entry.name}</b> ${entry.text}</p>
      </div>
    `).join("");
    entries.forEach((entry, idx) => {
      renderPreview(document.getElementById(`${entry.id}-${idx}`), entry.piece);
    });
  }

  function renderHelpSpecials(){
    if(helpGeneralSpecialsFoldEl){
      helpGeneralSpecialsFoldEl.hidden = !!USE_MISSION_ONLY_SPECIALS;
    }
    if(helpGeneralSpecialsEl){
      if(USE_MISSION_ONLY_SPECIALS){
        helpGeneralSpecialsEl.innerHTML = "";
      } else {
        renderHelpSpecialList(helpGeneralSpecialsEl, [
          {
            id: "help-wolf",
            name: "Wolf Pack",
            text: "2x2 trouble piece. When it settles, it blasts nearby settled tiles. If it whiffs completely, it leaves 1 mud trap.",
            piece: helpPieceFromSpec(SPECIAL.WOLVES_2, "WOLVES")
          },
          {
            id: "help-blacksheep",
            name: "Black Sheep",
            text: "2x2 wild card. It joins the neighboring animal it fits best. If it lands isolated, it leaves a 🥚 behind before joining at random.",
            piece: helpPieceFromSpec(SPECIAL.BLACKSHEEP_2, "BLACKSHEEP")
          }
        ]);
      }
    }

    const helpSpecialIds = USE_WEIGHTED_MISSION_SPECIALS
      ? ["egg_basket", "muck_wagon", "rain_barrel", "angry_wolf", "pack_howl", "salt_lick", "rooster_call", "barn_goods", "bunker_buster"]
      : ["bomb", "bunker", "reaper", "morph", "seeder", "brand", "feed", "produce"];

    renderHelpSpecialList(helpMissionSpecialsEl, [
      ...helpSpecialIds.map((specialId) => {
        const entry = missionSpecialEntry(specialId);
        return {
          id: `help-${specialId}`,
          name: entry?.title || specialId,
          text: entry?.help || "",
          piece: createHelpSpecialPiece(specialId, { animal: specialId === "barn_goods" || specialId === "produce" ? TILE.COW : TILE.COW })
        };
      }),
      {
        id: "help-cashout",
        name: "Reward Coin",
        text: "Gold-frame reward piece. Once it lands, the mission meter becomes a 10-settle countdown. Clear its pulsing herd before 0 or the run ends.",
        piece: helpPieceFromSpec(SPECIAL.CASHOUT_1, "MISSION_CASHOUT")
      }
    ]);
  }

  function v2OnboardingSeen(){
    if(!V2_ONBOARDING_ENABLED) return true;
    try{
      if(runtimeFlag("resetOnboarding", false)){
        localStorage.removeItem(V2_ONBOARDING_STORAGE_KEY);
        localStorage.removeItem(V2_RUNS_STARTED_KEY);
        return false;
      }
      return localStorage.getItem(V2_ONBOARDING_STORAGE_KEY) === "1";
    }catch{
      return false;
    }
  }

  function markV2OnboardingSeen(){
    if(!V2_ONBOARDING_ENABLED) return;
    try{
      localStorage.setItem(V2_ONBOARDING_STORAGE_KEY, "1");
    }catch{}
  }

  function v2RunsStarted(){
    try{
      return Math.max(0, Number(localStorage.getItem(V2_RUNS_STARTED_KEY)) || 0);
    }catch{
      return 0;
    }
  }

  function bumpV2RunsStarted(){
    if(!REFRESH_V2_ENABLED) return v2RunsStarted();
    const nextCount = v2RunsStarted() + 1;
    try{
      localStorage.setItem(V2_RUNS_STARTED_KEY, String(nextCount));
    }catch{}
    return nextCount;
  }

  function v2MissionPool(runsStarted=v2RunsStarted()){
    if(!V2_ONBOARDING_ENABLED || v2OnboardingSeen()){
      return V2_MISSION_DEFS.filter((entry) => !entry.onboarding && (!entry.minRunsStarted || runsStarted >= entry.minRunsStarted));
    }
    const intro = V2_MISSION_DEFS.find((entry) => entry.onboarding);
    return intro ? [intro] : V2_MISSION_DEFS;
  }

  function missionDebugKey(value=""){
    return String(value || "").trim().toLowerCase().replace(/^v2_/, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function debugMissionDefinition(){
    if(!REFRESH_V2_ENABLED || !DEBUG_MISSION_ID) return null;
    const wanted = missionDebugKey(DEBUG_MISSION_ID);
    const candidates = [...V2_MISSION_DEFS, ...ACTIVE_MISSION_DEFS];
    return candidates.find((entry) => {
      const ids = [entry.id, entry.title].map(missionDebugKey);
      return ids.includes(wanted) || ids.includes(`v2_${wanted}`);
    }) || null;
  }

  function newMission(){
    const runsStarted = REFRESH_V2_ENABLED ? bumpV2RunsStarted() : 0;
    const pool = REFRESH_V2_ENABLED ? v2MissionPool(runsStarted) : ACTIVE_MISSION_DEFS;
    const debugDef = debugMissionDefinition();
    const def = debugDef || weightedChoice(pool.length ? pool : ACTIVE_MISSION_DEFS, (entry) => entry?.weight ?? 1);
    if(REFRESH_V2_ENABLED && def?.onboarding && !debugDef) markV2OnboardingSeen();
    const tunedBonus = Math.max(def?.marquee ? 200 : 80, Math.round(def.bonus * 0.6));
    return {
      ...def,
      specials: Array.isArray(def.specials) ? def.specials.map((entry) => ({ ...entry })) : undefined,
      goodsAnimals: Array.isArray(def.goodsAnimals) ? def.goodsAnimals.slice() : undefined,
      bonus: tunedBonus,
      progress: 0,
      seenAnimals: [],
      done: false,
      ready: false,
      cashBonus: tunedBonus,
    };
  }

  function missionSpecialRule(specialId=missionPrimarySpecialId(), sourceMission=mission){
    const entry = missionSpecialEntry(specialId);
    if(!entry) return null;
    if(specialId === "produce" && sourceMission?.animal){
      const product = productInfoForAnimal(sourceMission.animal);
      return {
        ...entry,
        title: product.specialTitle,
        desc: describeSpecial(specialId, { animal: sourceMission.animal }),
        short: entry.short,
        every: missionSpecialEvery(sourceMission),
        tile: product.tile
      };
    }
    const genericGoodsMission = entry.usesProductAnimal && !sourceMission?.animal;
    return {
      ...entry,
      desc: describeSpecial(specialId, { animal: genericGoodsMission ? null : (sourceMission?.animal ?? entry.previewAnimal ?? TILE.COW) }),
      every: missionSpecialEvery(sourceMission)
    };
  }

  function missionSpecialLegendTitle(sourceMission=mission){
    const loadout = missionSpecialLoadout(sourceMission);
    if(!loadout.length) return REFRESH_V2_ENABLED ? "No specials yet" : "Mission legend";
    const names = loadout
      .map(({ id }) => missionSpecialRule(id, sourceMission)?.title)
      .filter(Boolean);
    return names.length > 1
      ? `Special duo: ${names.join(" + ")}`
      : `Special: ${names[0]}`;
  }

  function missionSpecialLegendInfo(sourceMission=mission, opts={}){
    const compact = !!opts.compact;
    const loadout = missionSpecialLoadout(sourceMission);
    if(!loadout.length) return REFRESH_V2_ENABLED ? "Just build herds. Wolves can wait." : "No mission special this run.";
    const primary = missionSpecialRule(loadout[0]?.id, sourceMission);
    const secondary = missionSpecialRule(loadout[1]?.id, sourceMission);
    if(!secondary){
      return compact
        ? `${primary?.title || "Special"} uses the real Next queue.`
        : `${primary?.desc || "Mission piece."} It always comes through the real Next queue.`;
    }
    return compact
      ? `Common: ${primary?.title}. Rare: ${secondary?.title}.`
      : `${primary?.title} is the common pull. ${secondary?.title} is the rarer troublemaker. Both arrive through the real Next queue.`;
  }

  function missionBriefRuleCopy(){
    if(REFRESH_V2_ENABLED) return `Finish the tiny job. Then cash the reward herd within ${REWARD_COUNTDOWN_START} settles.`;
    return `Goal first. Then clear the reward herd in ${REWARD_COUNTDOWN_START} settles.`;
  }

  function missionBriefSpecialHeaderCopy(sourceMission=mission){
    if(!USE_MISSION_BRIEF_SPECIAL_CARDS){
      return missionSpecialLegendInfo(sourceMission, { compact:false });
    }
    const loadout = missionSpecialLoadout(sourceMission);
    if(!loadout.length) return REFRESH_V2_ENABLED ? "No specials here. Learn the herd shape first." : "No mission special this run.";
    return loadout.length > 1
      ? "Common first. Rare second. Both show up in real Next."
      : "This special shows up in the real Next queue.";
  }

  function missionBriefSpecialRoleLabel(specialId, idx, total){
    if(total <= 1) return "Mission special";
    const common = idx === 0;
    if(["angry_wolf", "pack_howl"].includes(specialId)) return common ? "Common troublemaker" : "Rare troublemaker";
    if(specialId === "salt_lick") return common ? "Common pull" : "Rare pull";
    if(specialId === "rain_barrel") return common ? "Common cleanup" : "Rare cleanup";
    if(specialId === "rooster_call") return common ? "Common combo" : "Rare combo";
    if(specialId === "egg_basket") return common ? "Common egg spread" : "Rare egg spread";
    if(specialId === "muck_wagon") return common ? "Common turd spread" : "Rare turd spread";
    if(specialId === "barnstorm_crate") return common ? "Common mayhem" : "Rare troublemaker";
    if(specialId === "barn_goods") return common ? "Common cash-in" : "Rare cash-in";
    if(["bunker_buster", "bunker"].includes(specialId)) return common ? "Common breaker" : "Rare troublemaker";
    return common ? "Common special" : "Rare special";
  }

  function missionBriefSpecialLines(specialId, sourceMission=mission){
    switch(specialId){
      case "angry_wolf":
        return ["On hit: blasts patch + 2 mud traps.", "On whiff: leaves 1 mud trap."];
      case "pack_howl":
        return ["On lock: becomes the touched animal.", "Nearby: scrambles 4 animals + 1 mud trap."];
      case "salt_lick":
        return ["Nearby: pulls up to 2 animals in.", "If nobody moves: drops 1 egg."];
      case "rain_barrel":
        return ["On lock: washes up to 4 eggs/turds/mud.", "If clean: drops 1 egg."];
      case "rooster_call":
        return ["Nearby: flips up to 2 chickens to match.", "On lock: drops 2 eggs."];
      case "egg_basket":
        return ["On lock: becomes the touched animal.", "Nearby: plants 4 eggs."];
      case "muck_wagon":
        return ["Nearby: drops 3 turds.", "Turds trim herd coins."];
      case "barnstorm_crate":
        return ["On lock: sprays 2 eggs + 1 turd.", "Nearby: flips 1 animal to match."];
      case "barn_goods":
      case "produce":
        return ["On producer hit: tags 1 good + 1 egg.", "On whiff: drops 1 turd."];
      case "bunker_buster":
      case "bunker":
        return ["On hit: chain-blasts the touched cluster.", "On whiff: drops 4 turds."];
      default: {
        const rule = missionSpecialRule(specialId, sourceMission);
        return [rule?.short || rule?.desc || "Mission special through Next."];
      }
    }
  }

  function missionBriefSpecialCards(sourceMission=mission){
    const loadout = missionSpecialLoadout(sourceMission);
    if(!loadout.length) return [];
    const selected = USE_MISSION_BRIEF_SPECIAL_CARDS ? loadout : [loadout[0]];
    const totalCards = selected.length;
    return selected.map((entry, idx) => {
      const rule = missionSpecialRule(entry?.id, sourceMission);
      const previewAnimal = sourceMission?.animal ?? rule?.previewAnimal ?? TILE.COW;
      return {
        id: entry?.id,
        role: missionBriefSpecialRoleLabel(entry?.id, idx, totalCards),
        title: rule?.title || "Mission special",
        lines: missionBriefSpecialLines(entry?.id, sourceMission).filter(Boolean).slice(0, 2),
        piece: createMissionSpecialPiece({
          sourceMission,
          specialId: entry?.id,
          productAnimal: previewAnimal
        })
      };
    });
  }

  function renderMissionSpecialCardsInto(container, sourceMission=mission, idPrefix="mission-brief-special"){
    if(!container) return;
    const cards = missionBriefSpecialCards(sourceMission);
    if(!cards.length){
      container.innerHTML = "";
      return;
    }
    container.innerHTML = cards.map((card, idx) => `
      <article class="missionBriefSpecialCard${cards.length === 1 ? " missionBriefSpecialCardSolo" : ""}">
        <div class="missionBriefSpecialRole">${card.role}</div>
        <div class="missionBriefSpecialName">${card.title}</div>
        <div class="missionBriefSpecialLines">
          ${card.lines.map((line) => `<div class="missionBriefSpecialLine">${line}</div>`).join("")}
        </div>
        <div id="${idPrefix}-${idx}" class="previewGrid missionBriefPreviewGrid"></div>
      </article>
    `).join("");
    cards.forEach((card, idx) => {
      renderPreview(document.getElementById(`${idPrefix}-${idx}`), card.piece);
    });
  }

  function renderMissionBriefSpecialCards(sourceMission=mission){
    renderMissionSpecialCardsInto(missionBriefSpecialsEl, sourceMission, "mission-brief-special");
  }

  function missionLegendPreviewPiece(sourceMission=mission){
    return createMissionSpecialPiece({
      sourceMission,
      specialId: missionPrimarySpecialId(sourceMission),
      productAnimal: sourceMission?.animal ?? TILE.COW
    });
  }

  function missionCashoutEvery(){
    return 3;
  }

  function missionSpecialWarmth(){
    return clamp(missionSpecialCharge, 0, 1);
  }

  function debugSpecialId(){
    if(!REFRESH_V2_ENABLED || !DEBUG_SPECIAL_ID) return "";
    const key = DEBUG_SPECIAL_ID.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return missionSpecialEntry(key) ? key : "";
  }

  function maybeQueueMissionSpecial(){
    if(!mission || mission.done || mission.ready) return false;
    const forcedSpecial = debugSpecialId();
    const debugSpecial = forcedSpecial
      ? { id: forcedSpecial, weight: 1 }
      : null;
    const loadout = debugSpecial ? [debugSpecial] : missionSpecialLoadout();
    if(!loadout.length) return false;
    if(missionSpecialPending || isMissionSpecialPiece(current)) return false;

    const averageStep = 1 / missionSpecialEvery();
    const jitteredStep = averageStep * (0.65 + Math.random() * 0.7);
    missionSpecialCharge = clamp(missionSpecialCharge + jitteredStep, 0, 1.5);
    if(debugSpecial) missionSpecialCharge = Math.max(missionSpecialCharge, 1);

    if(missionSpecialCharge < 1) return false;

    missionSpecialPending = true;
    missionSpecialCharge = Math.max(0, missionSpecialCharge - 1);
    const selected = USE_WEIGHTED_MISSION_SPECIALS
      ? weightedChoice(loadout, (entry) => entry?.weight ?? 1)
      : loadout[0];
    queuedMissionSpecial = createMissionSpecialPiece({
      forSpawn: true,
      specialId: selected?.id || loadout[0]?.id,
      sourceMission: mission
    });
    return true;
  }

  function primeDebugMissionSpecial(){
    const forcedSpecial = debugSpecialId();
    if(!forcedSpecial || !mission || mission.done || mission.ready) return;
    missionSpecialPending = true;
    queuedMissionSpecial = createMissionSpecialPiece({
      forSpawn: true,
      specialId: forcedSpecial,
      sourceMission: mission
    });
  }

  function missionPressureMultiplier(){
    return (mission && mission.ready && !mission.done) ? 0.93 : 1;
  }

  function missionReadyLockBonus(){
    return 3 + level;
  }

  function speedRampLockCount(){
    if(!REFRESH_V2_ENABLED) return locks;
    const graceLocks = herdsCleared > 0 ? V2_POST_HERD_RAMP_GRACE_LOCKS : V2_OPENING_RAMP_GRACE_LOCKS;
    return Math.max(0, locks - graceLocks);
  }

  function baseFallMsForPace(){
    if(!REFRESH_V2_ENABLED) return LEGACY_BASE_FALL_MS;
    const blend = clamp(speedRampLockCount() / V2_BASE_FALL_BLEND_LOCKS, 0, 1);
    return Math.round(V2_BASE_FALL_MS + (V2_SETTLED_BASE_FALL_MS - V2_BASE_FALL_MS) * blend);
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

  function missionDisplayLabel(sourceMission=mission){
    if(!sourceMission) return "Warm up the barn";
    if(REFRESH_V2_ENABLED && sourceMission.hint) return `${sourceMission.title} — ${sourceMission.hint}`;
    return sourceMission.hint ? `${sourceMission.title} (${sourceMission.hint})` : sourceMission.title;
  }

  function missionObjectiveLabel(){
    if(!mission) return "Warm up the barn";
    if(mission.objective) return mission.objective;
    if(mission.type === "animal") return `Clear ${mission.target} ${animalWord(mission.animal)}`;
    if(mission.type === "destroy") return `Destroy ${mission.target} ${animalWord(mission.animal)}`;
    if(mission.type === "clears") return `Clear ${mission.target} herds of ${ACTIVE_CLEAR_THRESHOLD}+`;
    if(mission.type === "combo") return `${fmtChain(mission.target)} combo`;
    if(mission.type === "wolf") return `Trigger ${mission.target} wolf tantrum${mission.target === 1 ? "" : "s"}`;
    if(mission.type === "score") return `Score ${mission.target} coins`;
    if(mission.type === "level") return `Reach pace ${mission.target}`;
    if(mission.type === "big_group") return `Clear ${mission.target} jumbo groups`;
    if(mission.type === "large_clears") return `Clear ${mission.target} herds of ${mission.minSize}+`;
    if(mission.type === "variety") return `Clear ${mission.target} different animals`;
    if(mission.type === "egg_clear") return `Clear ${mission.target} egg herds`;
    if(mission.type === "product") return mission.animal ? `Cash in ${mission.target} ${productInfoForAnimal(mission.animal).plural}` : `Cash ${mission.target} goods`;
    if(mission.type === "turds") return REFRESH_V2_ENABLED ? `Clean ${mission.target} mess markers` : `Clear ${mission.target} turds`;
    if(mission.type === "special_use") return `Use your mission special ${mission.target} time${mission.target === 1 ? "" : "s"}`;
    if(mission.type === "locks") return `Complete ${mission.target} settles`;
    return mission.title;
  }

  function missionBriefCopy(){
    if(!mission) return "The barn is quiet. It will not stay that way.";
    if(mission.brief) return mission.brief;
    if(mission.type === "variety") return "Mix the barn. Cash the confusion.";
    if(mission.type === "egg_clear") return "Eggs make the coins louder.";
    if(mission.type === "combo") return `One settle. Hit ${fmtChain(mission.target)} before the barn untangles itself.`;
    if(mission.type === "product") return "Hit the right producer. Misses drop a turd.";
    if(mission.type === "build_group") return "Build it huge, but do not cash it early.";
    if(mission.type === "large_clears") return "Chunky herds only. Tiny clears do not count.";
    if(mission.type === "turds") return "Bring boots. The floor is trying to win.";
    return "The barn picked a fresh problem for you.";
  }

  function renderMissionDrawer(){
    if(!missionDrawerEl) return;
    if(missionDrawerTitleEl) missionDrawerTitleEl.textContent = mission?.title ?? "Mission warming up";
    if(missionDrawerBodyEl) missionDrawerBodyEl.textContent = missionBriefCopy();
    if(missionDrawerObjectiveEl) missionDrawerObjectiveEl.textContent = missionObjectiveLabel();
    if(missionDrawerRewardEl) missionDrawerRewardEl.textContent = `+${mission?.bonus ?? 0} coins`;
    if(missionDrawerRuleEl) missionDrawerRuleEl.textContent = missionBriefRuleCopy();
    if(missionDrawerSpecialInfoEl) missionDrawerSpecialInfoEl.textContent = missionBriefSpecialHeaderCopy(mission);
    if(missionDrawerActionButton){
      missionDrawerActionButton.textContent = runStarted ? "Resume" : "Start";
      missionDrawerActionButton.setAttribute("aria-label", runStarted ? "Resume game" : "Start mission");
    }
    renderMissionSpecialCardsInto(missionDrawerSpecialsEl, mission, "mission-drawer-special");
  }

  function syncMissionDrawerUI(){
    if(stageMissionBarEl) stageMissionBarEl.classList.toggle("drawerOpen", !!missionDrawerOpen);
    if(missionDrawerEl) missionDrawerEl.classList.toggle("hidden", !missionDrawerOpen);
    if(missionDrawerToggle){
      missionDrawerToggle.textContent = missionDrawerOpen ? "▴" : "▾";
      missionDrawerToggle.setAttribute("aria-expanded", missionDrawerOpen ? "true" : "false");
      missionDrawerToggle.setAttribute("aria-label", missionDrawerOpen ? "Hide mission details" : "Show mission details");
    }
    renderMissionDrawer();
  }

  function gameplayShouldPause(){
    return !!(gameOver || manualPaused || modalOpenCount > 0 || missionDrawerOpen || (REFRESH_V2_ENABLED && !runStarted));
  }

  function syncPausedState(){
    paused = gameplayShouldPause();
  }

  function setMissionDrawerOpen(open){
    if(!REFRESH_V2_ENABLED || !missionDrawerEl) return;
    missionDrawerOpen = !!open && !gameOver;
    syncPausedState();
    syncMissionDrawerUI();
    updateHUD();
    if(W > 0 && H > 0) draw();
  }

  function openMissionDrawer(){
    if(!REFRESH_V2_ENABLED) return;
    setMissionDrawerOpen(true);
  }

  function closeMissionDrawerAndMaybeStart(){
    if(!REFRESH_V2_ENABLED) return;
    if(USE_IOS_AUDIO_RESUME_FIXES) unlockAudioSilently();
    const wasStarting = !runStarted;
    runStarted = true;
    manualPaused = false;
    if(wasStarting) runStartedAtMs = Date.now();
    missionDrawerOpen = false;
    syncPausedState();
    syncMissionDrawerUI();
    if(wasStarting) playGameEventSound("mission_start");
    else playGameEventSound("ui_close_modal");
    updateHUD();
    if(W > 0 && H > 0) draw();
  }

  function openMissionBriefing(){
    if(missionBriefTitleEl) missionBriefTitleEl.textContent = mission?.title ?? "Mission Briefing";
    if(missionBriefBodyEl) missionBriefBodyEl.textContent = missionBriefCopy();
    if(missionBriefObjectiveEl) missionBriefObjectiveEl.textContent = missionObjectiveLabel();
    if(missionBriefBonusEl) missionBriefBonusEl.textContent = `Cash out +${mission?.bonus ?? 0}`;
    if(missionBriefRuleEl) missionBriefRuleEl.textContent = missionBriefRuleCopy();
    if(missionBriefSpecialInfoEl) missionBriefSpecialInfoEl.textContent = missionBriefSpecialHeaderCopy(mission);
    renderMissionBriefSpecialCards(mission);
    setOverlayOpen(missionBriefBackdrop, true);
  }

  function closeMissionBriefing(){
    if(USE_IOS_AUDIO_RESUME_FIXES) unlockAudioSilently();
    playGameEventSound("mission_start");
    setOverlayOpen(missionBriefBackdrop, false);
    draw();
  }

  function stageRunSummary(){
    const missionBonus = mission && mission.done ? mission.cashBonus : 0;
    return missionBonus > 0
      ? `${Math.max(0, score|0)} herding + ${missionBonus} bonus`
      : `${Math.max(0, score|0)} herding`;
  }

  function awaitingRunEndReveal(){
    return !!(gameOver && (pendingGameOverRevealTimer || boardAnimations.length || particles.length));
  }

  function runEndVisualsSettled(now=performance.now()){
    return !boardAnimations.length && !particles.length && boardAnimationEndsAt() <= (now + 20);
  }
  function shouldDrawRunEndPulse(){
    return !!(gameOver && runEndPulseActive);
  }

  function syncStageRunActions(){
    const runEnded = !!gameOver;
    const revealReady = runEnded && !awaitingRunEndReveal();
    if(stageMissionBarEl) stageMissionBarEl.classList.toggle("runEnded", runEnded);
    if(stageRunActionsEl) stageRunActionsEl.classList.toggle("hidden", !revealReady);
    if(!runEnded) return;
    if(stageMissionTitleEl) stageMissionTitleEl.textContent = runEndTitle;
    if(stageMissionProgressTextEl){
      stageMissionProgressTextEl.textContent = revealReady
        ? stageRunSummary()
        : runEndPulseLine();
    }
  }

  function missionReadyStatusText(){
    return hasRewardCoinOnBoard()
      ? `Clear the reward herd in ${rewardCountdownLabel()} for +${mission.cashBonus}.`
      : `Goal hit. Coin in ${Math.max(0, missionCashoutEvery() - cashoutCharge)} settles. Bonus +${mission.cashBonus}.`;
  }

  function missionActiveStatusText(){
    if(!mission) return "Start dropping pieces";
    if(REFRESH_V2_ENABLED){
      if(mission.type === "animal") return `${missionProgressText(mission.progress, mission.target)} ${animalWord(mission.animal)}`;
      if(mission.type === "clears") return `${missionProgressText(mission.progress, mission.target)} herds`;
      if(mission.type === "variety") return `${missionProgressText(mission.progress, mission.target)} species`;
      if(mission.type === "egg_clear") return `${missionProgressText(mission.progress, mission.target)} egg herds`;
      if(mission.type === "turds") return `${missionProgressText(mission.progress, mission.target)} messes`;
      if(mission.type === "wolf") return `${missionProgressText(mission.progress, mission.target)} scares`;
      if(mission.type === "large_clears") return `${missionProgressText(mission.progress, mission.target)} big herds`;
    }
    if(mission.type === "animal") return `${missionProgressText(mission.progress, mission.target)} ${animalWord(mission.animal)} cleared`;
    if(mission.type === "destroy") return `${missionProgressText(mission.progress, mission.target)} ${animalWord(mission.animal)} wrecked`;
    if(mission.type === "combo") return `Best chain ${fmtChain(bestCombo)} / ${fmtChain(mission.target)}`;
    if(mission.type === "wolf") return `${missionProgressText(mission.progress, mission.target)} wolf raids`;
    if(mission.type === "score") return `${missionProgressText(score, mission.target)} coins`;
    if(mission.type === "level") return `Pace ${level} / ${mission.target}`;
    if(mission.type === "big_group") return `${missionProgressText(mission.progress, mission.target)} jumbo clears`;
    if(mission.type === "large_clears") return `${missionProgressText(mission.progress, mission.target)} herds of ${mission.minSize}+`;
    if(mission.type === "variety") return `${missionProgressText(mission.progress, mission.target)} species cleared`;
    if(mission.type === "egg_clear") return `${missionProgressText(mission.progress, mission.target)} egg herds`;
    if(mission.type === "product"){
      return mission.animal
        ? `${missionProgressText(mission.progress, mission.target)} ${productInfoForAnimal(mission.animal).plural} cashed`
        : `${missionProgressText(mission.progress, mission.target)} goods cashed`;
    }
    if(mission.type === "build_group") return `Live herd ${missionCurrentProgress()} / ${mission.target}`;
    if(mission.type === "turds") return `${missionProgressText(mission.progress, mission.target)} ${REFRESH_V2_ENABLED ? "messes cleaned" : "turds cleared"}`;
    if(mission.type === "special_use") return `${missionProgressText(mission.progress, mission.target)} specials used`;
    if(mission.type === "locks") return `${missionProgressText(locks, mission.target)} settles`;
    return `${missionProgressText(mission.progress, mission.target)} clears`;
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
      missionSpecialNameEl.textContent = "Mission legend";
      missionSpecialInfoEl.textContent = "Mission legend will appear here.";
      renderPreview(missionSpecialPreviewEl, null);
      renderMissionDrawer();
      return;
    }
    const progressRatio = missionProgressRatio();
    const progressWidth = `${Math.round(progressRatio * 100)}%`;
    const countdownMode = !!(mission.ready && !mission.done && hasRewardCoinOnBoard());
    syncMissionMeterCountdownUI(countdownMode);
    if(missionMeterFillEl) missionMeterFillEl.style.width = progressWidth;
    if(stageMissionMeterFillEl) stageMissionMeterFillEl.style.width = progressWidth;
    syncMissionMeterAudio();
    const specialQueued = isMissionSpecialPiece(next);
    const specialHeatingUp = missionSpecialPending && !specialQueued;
    const specialWarmth = Math.round(missionSpecialWarmth() * 100);

    if(mission.done){
      missionTitleEl.textContent = missionDisplayLabel();
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = missionDisplayLabel();
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = compactMissionProgress();
      missionSpecialNameEl.textContent = "Mission banked";
      missionSpecialInfoEl.textContent = `Howl, cash, move on: +${mission.cashBonus}.`;
      renderPreview(missionSpecialPreviewEl, createCashoutPiece());
    } else if(mission.ready){
      missionTitleEl.textContent = missionDisplayLabel();
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = missionDisplayLabel();
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = compactMissionProgress();
      missionSpecialNameEl.textContent = hasRewardCoinOnBoard() ? "Reward herd live" : "Reward coin charging";
      missionSpecialInfoEl.textContent = missionReadyStatusText();
      renderPreview(missionSpecialPreviewEl, createCashoutPiece());
    } else {
      missionTitleEl.textContent = missionDisplayLabel();
      if(stageMissionTitleEl) stageMissionTitleEl.textContent = missionDisplayLabel();
      if(stageMissionProgressTextEl) stageMissionProgressTextEl.textContent = compactMissionProgress();
      missionSpecialNameEl.textContent = missionSpecialLegendTitle();
      missionSpecialInfoEl.textContent = specialQueued
        ? isCompactUI()
          ? "Next is holding one."
          : `Next already holds a mission piece. ${missionSpecialLegendInfo(mission, { compact:false })}`
        : specialHeatingUp
          ? isCompactUI()
            ? "Charge is hot. Watch Next."
            : `${missionSpecialLegendInfo(mission, { compact:false })} Charge is primed, so watch Next after this settle.`
          : isCompactUI()
            ? missionSpecialLegendInfo(mission, { compact:true })
            : `${missionSpecialLegendInfo(mission, { compact:false })} ${specialJoinRateLabel()} average. Queue heat ${specialWarmth}%.`;
      renderPreview(missionSpecialPreviewEl, missionLegendPreviewPiece());
    }
    missionProgressEl.textContent = mission.done
      ? `Bonus banked: +${mission.cashBonus} coins`
      : mission.ready
        ? missionReadyStatusText()
        : missionActiveStatusText();
    renderMissionDrawer();
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
    banner.text = `Objective met. Coin next. Clear the reward herd within ${REWARD_COUNTDOWN_START} settles for +${mission.cashBonus}.`;
    banner.t = performance.now();
    playMissionJingle();
    updateMissionUI();
    updateHUD();
  }

  function bumpMission(event, value){
    if(!mission || mission.done || mission.ready) return;
    if(event === "animal" && mission.type === "animal" && mission.animal === value.animal){
      mission.progress += value.amount;
    } else if(event === "animal" && mission.type === "variety"){
      const animal = value?.animal;
      if(ANIMALS.includes(animal)){
        const seen = new Set(Array.isArray(mission.seenAnimals) ? mission.seenAnimals : []);
        seen.add(animal);
        mission.seenAnimals = Array.from(seen);
        mission.progress = mission.seenAnimals.length;
      }
    } else if(event === "destroy" && mission.type === "destroy" && mission.animal === value.animal){
      mission.progress += value.amount;
    } else if(event === "clears" && mission.type === "clears"){
      mission.progress += value;
    } else if(event === "combo" && mission.type === "combo"){
      mission.progress = Math.max(mission.progress, value);
    } else if(event === "wolf" && mission.type === "wolf"){
      mission.progress += value;
    } else if(event === "big_group" && mission.type === "big_group"){
      mission.progress += value;
    } else if(event === "large_clear" && mission.type === "large_clears"){
      if(value.size >= (mission.minSize || BIG_GROUP_THRESHOLD)) mission.progress += 1;
    } else if(event === "product" && mission.type === "product" && mission.animal === value.animal){
      mission.progress += value.amount;
    } else if(event === "product" && mission.type === "product" && !mission.animal){
      mission.progress += value.amount;
    } else if(event === "egg_clear" && mission.type === "egg_clear"){
      mission.progress += value?.amount ?? 1;
    } else if(event === "turds" && mission.type === "turds"){
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
    if(clearPendingHerdsBeforeSpawn()) return;
    if(mission && mission.ready && !mission.done && !hasRewardCoinOnBoard() && cashoutCharge >= missionCashoutEvery()){
      current = preparePiece(createCashoutPiece());
      cashoutCharge = 0;
    } else if(missionSpecialPending && mission && !mission.done && !mission.ready){
      current = preparePiece(next ?? newPiece());
      next = ensureQueuedMissionSpecial();
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

  function clearPendingHerdsBeforeSpawn(){
    if(gameOver || current || boardAnimations.length) return false;
    if(findAnimalGroupsToClear().length === 0) return false;

    const summary = resolveBoard();
    if(!summary || summary.groupsCleared <= 0) return false;

    applyChainResult(summary);
    if(summary.rewardEarned){
      finishMissionEarned();
      return true;
    }

    current = null;
    nextSpawnAt = performance.now() + Math.max(0, summary.animationWaitMs || 0);
    updateHUD();
    draw();
    return true;
  }

  function updateLevel(){
    const prevLevel = level;
    level = 1 + Math.floor(speedRampLockCount() / LEVEL_EVERY_LOCKS);
    fallInterval = Math.max(
      MIN_FALL_MS,
      Math.floor(baseFallMsForPace() * Math.pow(0.88, level-1) * missionPressureMultiplier())
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
    syncPausedState();
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
    syncPausedState();
    updateHUD();
  }

  function openSettings(){
    if(USE_IOS_AUDIO_RESUME_FIXES) unlockAudioSilently();
    playGameEventSound("ui_open_modal");
    setOverlayOpen(modalBackdrop, true);
    draw();
  }

  function closeSettings(){
    if(USE_IOS_AUDIO_RESUME_FIXES) unlockAudioSilently();
    playGameEventSound("ui_close_modal");
    setOverlayOpen(modalBackdrop, false);
    draw();
  }

  function openHelp(){
    if(USE_IOS_AUDIO_RESUME_FIXES) unlockAudioSilently();
    playGameEventSound("ui_open_modal");
    setOverlayOpen(helpBackdrop, true);
    draw();
  }

  function closeHelp(){
    if(USE_IOS_AUDIO_RESUME_FIXES) unlockAudioSilently();
    playGameEventSound("ui_close_modal");
    setOverlayOpen(helpBackdrop, false);
    draw();
  }

  function updateGameOverStats(){
    const missionBonus = currentMissionBonus();
    const herdScore = Math.max(0, score|0);
    const totalScore = currentTotalScore();
    if(gameOverTitleEl) gameOverTitleEl.textContent = runEndTitle;
    if(gameOverNoteEl) gameOverNoteEl.textContent = runEndNote;
    if(finalScoreEl) finalScoreEl.textContent = `${herdScore} (herding) + ${missionBonus} (bonus) = ${totalScore}`;
    if(finalLevelEl) finalLevelEl.textContent = level;
    if(finalClearsEl) finalClearsEl.textContent = herdsCleared;
    if(finalBestEl) finalBestEl.innerHTML = bestHerdSummary(bestHerd);
    if(finalComboEl) finalComboEl.textContent = fmtChain(bestCombo);
    syncLeaderboardViews();
    syncScoreSubmissionUI();
  }

  function defaultRunEndTitle(){
    if(mission && mission.done) return "Mission Succeeded! 🐺";
    if(mission && mission.ready && !mission.done) return "Mission Failed 💥";
    return "Run Over 🐺";
  }

  function defaultRunEndNote(){
    return mission && mission.ready && !mission.done
      ? `You had +${mission.cashBonus} coins on the line, but the barn buried the coin before you could earn them.`
      : "The barn got crowded.";
  }

  function runEndPulseLine(){
    if(mission && mission.done) return "Coins banked. Let the barn settle.";
    if(mission && mission.ready && !mission.done) return "No bonus this time. Let the barn settle.";
    return "Let the barn settle...";
  }

  function shareMissionStatus(){
    if(mission && mission.done) return "Mission Succeeded! 🐺";
    if(mission) return "Mission Failed 💥";
    return runEndTitle || "Run Over 🐺";
  }

  function finishMissionEarned(){
    rewardCountdown = null;
    updateHUD();
    const howlStyle = mission?.id === "angry_wolves" ? "angry_victory" : "victory";
    gameOverNow({
      title: "Mission Succeeded! 🐺",
      note: `${mission.title} paid out +${mission.cashBonus} coins after the reward group cleared.`,
      playSound: false,
      howl: true,
      howlStyle
    });
  }

  function gameOverNow(opts={}){
    if(pendingGameOverRevealTimer){
      clearTimeout(pendingGameOverRevealTimer);
      pendingGameOverRevealTimer = 0;
    }
    runEndPulseActive = false;
    runEndTitle = opts.title ?? defaultRunEndTitle();
    runEndNote = opts.note ?? defaultRunEndNote();
    gameOver = true;
    missionDrawerOpen = false;
    manualPaused = false;
    syncMissionDrawerUI();
    rewardCountdown = null;
    pendingTap = null;
    current = null;
    nextSpawnAt = 0;
    if(!shareSnapshot) rememberShareSnapshot();
    updateHUD();
    if(opts.playSound !== false) playGameOverJingle();
    if(opts.howl) playWolfHowl(opts.howlStyle || "victory");
    updateGameOverStats();
    refreshLeaderboard({ force: !leaderboardEntries.length });
    const pulseDelay = opts.delayMs ?? RUN_END_REVEAL_MIN_MS;
    const reveal = () => {
      pendingGameOverRevealTimer = 0;
      runEndPulseActive = false;
      updateGameOverStats();
      setOverlayOpen(gameOverBackdrop, true);
      draw();
    };
    const settleThenPulse = () => {
      const now = performance.now();
      if(opts.waitForBoard !== false && !runEndVisualsSettled(now)){
        const extraWait = Math.max(120, Math.min(240, Math.max(0, boardAnimationEndsAt() - now) + 80));
        pendingGameOverRevealTimer = window.setTimeout(settleThenPulse, extraWait);
        draw();
        return;
      }
      runEndPulseActive = true;
      if(pulseDelay > 0){
        pendingGameOverRevealTimer = window.setTimeout(reveal, pulseDelay);
      } else {
        reveal();
        return;
      }
      draw();
    };
    settleThenPulse();
    draw();
  }

  function closeGameOverPanel(){
    playGameEventSound("ui_close_modal");
    setOverlayOpen(gameOverBackdrop, false);
    draw();
  }

  function openGameOverPanel(){
    if(!gameOver) return;
    playGameEventSound("ui_open_modal");
    if(pendingGameOverRevealTimer){
      clearTimeout(pendingGameOverRevealTimer);
      pendingGameOverRevealTimer = 0;
    }
    runEndPulseActive = false;
    updateGameOverStats();
    refreshLeaderboard({ force: !leaderboardEntries.length });
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

        // turds: roughly egg-matched rhythm; wolf specials own true mud traps.
        if(((2*xx + y + turdPhase) % 6) === 3){
          turdCandidates.push([x,y]);
        }
      }
    }

    shuffleInPlace(eggCandidates);
    shuffleInPlace(turdCandidates);

    const occupied = new Set();
    const blockedByPower = new Map([
      [POWER.EGG, new Set()],
      [POWER.TURD, new Set()]
    ]);
    const blockAround = (power, x, y) => {
      const blocked = blockedByPower.get(power);
      for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=x+dx, ny=y+dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        blocked.add(ny*COLS+nx);
      }
    };
    const pools = {
      [POWER.EGG]: eggCandidates,
      [POWER.TURD]: turdCandidates
    };
    const remaining = {
      [POWER.EGG]: ACTIVE_CLUTTER_TUNING.startEggs,
      [POWER.TURD]: ACTIVE_CLUTTER_TUNING.startTurds
    };
    const tryPlace = (power) => {
      if(remaining[power] <= 0) return false;
      const pool = pools[power];
      const samePowerBlocked = blockedByPower.get(power);
      while(pool.length){
        const [x, y] = pool.shift();
        const key = y*COLS+x;
        if(occupied.has(key) || samePowerBlocked.has(key)) continue;
        overlay[y][x] = power;
        occupied.add(key);
        blockAround(power, x, y);
        remaining[power]--;
        return true;
      }
      return false;
    };

    const firstPower = Math.random() < 0.5 ? POWER.EGG : POWER.TURD;
    let power = firstPower;
    let safety = 0;
    while((remaining[POWER.EGG] > 0 || remaining[POWER.TURD] > 0) && safety++ < 80){
      const placed = tryPlace(power);
      power = power === POWER.EGG ? POWER.TURD : POWER.EGG;
      if(!placed) tryPlace(power);
    }
  }

  function applyDebugBoardPreset(){
    if(!REFRESH_V2_ENABLED || !DEBUG_BOARD) return;
    const preset = DEBUG_BOARD.toLowerCase();
    const startRow = Math.max(1, lowerBarnStartRow() - 1);
    const slots = [];
    for(let y = startRow; y < ROWS; y++){
      for(let x = 0; x < COLS; x++){
        slots.push([x, y]);
      }
    }
    shuffleInPlace(slots);
    const placeOverlay = (power, count) => {
      let placed = 0;
      for(const [x, y] of slots){
        if(overlay[y][x] !== POWER.NONE) continue;
        overlay[y][x] = power;
        placed++;
        if(placed >= count) break;
      }
    };
    if(preset === "empty"){
      overlay = makeOverlay();
    } else if(preset === "eggs"){
      overlay = makeOverlay();
      placeOverlay(POWER.EGG, 10);
    } else if(preset === "turds" || preset === "poop"){
      overlay = makeOverlay();
      placeOverlay(POWER.TURD, 10);
    } else if(preset === "mud"){
      overlay = makeOverlay();
      placeOverlay(POWER.MUD, 10);
    } else if(preset === "mud_lane"){
      overlay = makeOverlay();
      const y = ROWS - 1;
      const startX = clamp(Math.floor(COLS / 2) - 2, 0, Math.max(0, COLS - 4));
      for(let x = startX; x < Math.min(COLS, startX + 4); x++){
        overlay[y][x] = POWER.MUD;
      }
    } else if(preset === "wolf_hit"){
      overlay = makeOverlay();
      const row = Math.max(2, startRow);
      const startX = clamp(Math.floor(COLS / 2) - 1, 0, Math.max(0, COLS - 2));
      for(let y = row; y < Math.min(ROWS, row + 2); y++){
        for(let x = startX; x < Math.min(COLS, startX + 2); x++){
          board[y][x] = randChoice(ANIMALS);
        }
      }
    } else if(preset === "wolf"){
      overlay = makeOverlay();
      placeOverlay(POWER.MUD, 6);
      const row = Math.max(2, startRow);
      for(let x = 1; x < Math.min(COLS - 1, 5); x++){
        board[row][x] = randChoice(ANIMALS);
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
    banner.text = `Reward clock: ${rewardCountdownLabel()}. Mission failed.`;
    banner.t = performance.now();
    updateHUD();
    gameOverNow({
      title: "Mission Failed 💥",
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
    if(opts.settleAnimal && ANIMALS.includes(opts.settleAnimal)){
      const playedContactChaos = playBarnyardContactChaos(opts.contactChaos, opts.settleAnimal);
      if(!playedContactChaos) playBarnyard(opts.settleAnimal, 4, "settle");
    }
    if(opts.playLockTick !== false) playLockTick();
    if(!summary?.groupsCleared) maybePlayNearHerdMurmur();
    if(opts.hapticMs) haptic(opts.hapticMs);
    if(!gameOver){
      const waitMs = Math.max(0, summary?.animationWaitMs || 0);
      if(waitMs > 0){
        current = null;
        nextSpawnAt = performance.now() + waitMs;
        updateHUD();
        draw();
      } else {
        spawnNext();
      }
    }
    return false;
  }

  function wolvesExplode(piece, opts={}){
    const label = opts.label || "Wolf pack";
    const extraTurds = Math.max(0, opts.extraTurds|0);
    const howlStyle = opts.howlStyle || "";
    const wolfSettleStyle = howlStyle || (label === "Angry Wolf" ? "victory" : "tap");
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
      bumpDestroyedAnimals(popped);
      spawnPopParticles(popped);
      const extraPlaced = extraTurds ? placeMudTrapsForPiece(piece, extraTurds, { radius: 2 }) : { turds: 0 };
      banner.text = `${label} blasted ${popped.length} tiles${extraPlaced.turds ? ` and kicked up ${extraPlaced.turds} mud trap${extraPlaced.turds === 1 ? "" : "s"}` : ""}.`;
      banner.t = performance.now();
      if(!playSpecialCue("angry_wolf", { hit:true, count:popped.length, style:wolfSettleStyle, source:"angry_wolf_settle" })){
        playTone({type:"sawtooth", f1:120, f2:45, dur:0.20, gain:0.20});
        playTone({type:"square", f1:80, f2:40, dur:0.16, gain:0.16});
        playWolfHowl({ style:wolfSettleStyle, source:"angry_wolf_settle", animateBadge:false });
      }
      haptic(18);
      bumpMission("wolf", 1);
    } else {
      const whiffMud = placeMudTrapsForPiece(piece, 1, { radius: 1 });
      banner.text = whiffMud.turds
        ? `${label} whiffed and still left 1 mud trap behind.`
        : `${label} whiffed, but the barn had no empty mud spot.`;
      banner.t = performance.now();
      playSpecialCue("angry_wolf", { hit:false, style:"tap", source:"angry_wolf_whiff" });
      playGameEventSound("turd_penalty");
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

  function touchingAnimalSummary(piece){
    const counts = touchingAnimalCounts(piece);
    const entries = ANIMALS
      .map((animal) => ({ animal, count: counts.get(animal) || 0 }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count);
    return {
      contactCount: entries.reduce((total, entry) => total + entry.count, 0),
      neighborAnimals: entries.map((entry) => entry.animal)
    };
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

  function scatterLowerHalfOverlays(power, count=1, excludedKeys=new Set()){
    const candidates = [];
    const startRow = lowerBarnStartRow();
    for(let y=startRow; y<ROWS; y++){
      for(let x=0; x<COLS; x++){
        const key = keyForCell(x, y);
        if(excludedKeys.has(key)) continue;
        candidates.push([x,y]);
      }
    }
    if(!candidates.length) return 0;
    shuffleInPlace(candidates);
    let placed = 0;
    for(const [x,y] of candidates){
      overlay[y][x] = power;
      placed++;
      if(placed >= count) break;
    }
    return placed;
  }

  function restockLowerBarnOverlays(eggs=0, turds=0){
    let eggCount = Math.max(0, eggs|0);
    let turdCount = Math.max(0, turds|0);
    if(!eggCount && !turdCount) return { eggs: 0, turds: 0 };

    const emptyCandidates = [];
    const occupiedCandidates = [];
    for(let y = ROWS - 1; y >= lowerBarnStartRow(); y--){
      for(let x = 0; x < COLS; x++){
        if(overlay[y][x] !== POWER.NONE) continue;
        const candidate = { x, y };
        if(board[y][x] === TILE.EMPTY){
          emptyCandidates.push(candidate);
        } else {
          occupiedCandidates.push(candidate);
        }
      }
    }
    shuffleInPlace(emptyCandidates);
    shuffleInPlace(occupiedCandidates);

    const selected = [];
    const used = new Set();
    const spacedFromChosen = (candidate) => selected.every(({x, y}) => Math.max(Math.abs(candidate.x - x), Math.abs(candidate.y - y)) > 1);
    const takeCandidate = (pool, requireSpacing) => {
      for(const candidate of pool){
        const key = keyForCell(candidate.x, candidate.y);
        if(used.has(key)) continue;
        if(requireSpacing && !spacedFromChosen(candidate)) continue;
        used.add(key);
        selected.push(candidate);
        return candidate;
      }
      return null;
    };
    const takeSlot = () =>
      takeCandidate(emptyCandidates, true) ||
      takeCandidate(emptyCandidates, false) ||
      takeCandidate(occupiedCandidates, true) ||
      takeCandidate(occupiedCandidates, false);

    const queue = [];
    let nextPower = eggCount >= turdCount ? POWER.EGG : POWER.TURD;
    while(eggCount > 0 || turdCount > 0){
      if(nextPower === POWER.EGG){
        if(eggCount > 0){
          queue.push(POWER.EGG);
          eggCount--;
        } else if(turdCount > 0){
          queue.push(POWER.TURD);
          turdCount--;
        }
        nextPower = POWER.TURD;
      } else {
        if(turdCount > 0){
          queue.push(POWER.TURD);
          turdCount--;
        } else if(eggCount > 0){
          queue.push(POWER.EGG);
          eggCount--;
        }
        nextPower = POWER.EGG;
      }
    }

    const placed = { eggs: 0, turds: 0 };
    for(const power of queue){
      const slot = takeSlot();
      if(!slot) break;
      overlay[slot.y][slot.x] = power;
      if(power === POWER.EGG) placed.eggs++;
      if(power === POWER.TURD) placed.turds++;
    }
    return placed;
  }

  function distanceToPieceCell(piece, x, y){
    let best = Number.MAX_SAFE_INTEGER;
    for(const [px, py] of footprintCells(piece)){
      best = Math.min(best, Math.abs(px - x) + Math.abs(py - y));
    }
    return best;
  }

  function nearbyCellsForPiece(piece, radius=2, opts={}){
    const includeFootprint = !!opts.includeFootprint;
    const seen = new Set();
    const footprint = footprintCells(piece);
    const footprintKeys = new Set(footprint.map(([x, y]) => keyForCell(x, y)));
    const cells = [];
    for(const [x, y] of footprint){
      for(let dy = -radius; dy <= radius; dy++){
        for(let dx = -radius; dx <= radius; dx++){
          const nx = x + dx;
          const ny = y + dy;
          if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
          const key = keyForCell(nx, ny);
          if(!includeFootprint && footprintKeys.has(key)) continue;
          if(seen.has(key)) continue;
          seen.add(key);
          cells.push([nx, ny]);
        }
      }
    }
    cells.sort((a, b) => distanceToPieceCell(piece, a[0], a[1]) - distanceToPieceCell(piece, b[0], b[1]));
    return cells;
  }

  function nearbyAnimalCells(piece, radius=2, opts={}){
    return nearbyCellsForPiece(piece, radius, opts).filter(([x, y]) => ANIMALS.includes(board[y][x]));
  }

  let mudHazardLockSummary = null;

  function beginMudHazardTracking(){
    mudHazardLockSummary = { destroyed: 0, cells: [] };
  }

  function finishMudHazardTracking(){
    const summary = mudHazardLockSummary;
    mudHazardLockSummary = null;
    return summary || { destroyed: 0, cells: [] };
  }

  function shouldMudDestroyLandingCell(x, y){
    return REFRESH_V2_ENABLED && overlay[y]?.[x] === POWER.MUD && board[y]?.[x] === TILE.EMPTY;
  }

  function consumeMudLandingCell(x, y, tile){
    overlay[y][x] = POWER.NONE;
    rewardMap[y][x] = false;
    productMap[y][x] = 0;
    if(mudHazardLockSummary){
      mudHazardLockSummary.destroyed++;
      mudHazardLockSummary.cells.push([x, y, tile]);
    }
  }

  function placeLandingTileWithMud(x, y, tile){
    if(shouldMudDestroyLandingCell(x, y)){
      consumeMudLandingCell(x, y, tile);
      return false;
    }
    board[y][x] = tile;
    return true;
  }

  function appendMudHazardResult(summary){
    if(!summary?.destroyed) return;
    const count = summary.destroyed;
    bumpMission("turds", count);
    banner.text = `${banner.text ? `${banner.text} ` : ""}Empty mud ate ${count} falling tile${count === 1 ? "" : "s"} and disappeared.`;
    banner.t = performance.now();
    playGameEventSound("turd_penalty");
    haptic(14);
  }

  function placePieceAsAnimal(piece, animal){
    const placedCells = [];
    for(const [x, y] of footprintCells(piece)){
      if(placeLandingTileWithMud(x, y, animal)) placedCells.push([x, y, animal]);
    }
    return { placedCells };
  }

  function convertNearbyAnimalsTo(piece, animal, count=1, opts={}){
    const includeMatching = !!opts.includeMatching;
    const candidates = nearbyAnimalCells(piece, opts.radius ?? 2).filter(([x, y]) => includeMatching || board[y][x] !== animal);
    let converted = 0;
    for(const [x, y] of candidates){
      board[y][x] = animal;
      converted++;
      if(converted >= count) break;
    }
    return converted;
  }

  function clearNearbyOverlays(piece, opts={}){
    const max = opts.max ?? 4;
    const radius = opts.radius ?? 2;
    const candidates = nearbyCellsForPiece(piece, radius, { includeFootprint: true });
    const mud = candidates.filter(([x, y]) => overlay[y][x] === POWER.MUD);
    const turds = candidates.filter(([x, y]) => overlay[y][x] === POWER.TURD);
    const eggs = candidates.filter(([x, y]) => overlay[y][x] === POWER.EGG);
    const ordered = [...mud, ...turds, ...eggs];
    const cleared = { eggs: 0, turds: 0, mud: 0 };
    for(const [x, y] of ordered){
      if(overlay[y][x] === POWER.NONE) continue;
      if(overlay[y][x] === POWER.EGG) cleared.eggs++;
      if(overlay[y][x] === POWER.TURD) cleared.turds++;
      if(overlay[y][x] === POWER.MUD) cleared.mud++;
      overlay[y][x] = POWER.NONE;
      if((cleared.eggs + cleared.turds + cleared.mud) >= max) break;
    }
    return cleared;
  }

  function scatterNearbyOverlays(piece, opts={}){
    let eggs = Math.max(0, opts.eggs|0);
    let turds = Math.max(0, opts.turds|0);
    const candidates = nearbyCellsForPiece(piece, opts.radius ?? 2, { includeFootprint: true }).filter(([x, y]) => overlay[y][x] === POWER.NONE);
    shuffleInPlace(candidates);
    const queue = [];
    while(eggs > 0 || turds > 0){
      if(eggs > 0){
        queue.push(POWER.EGG);
        eggs--;
      }
      if(turds > 0){
        queue.push(POWER.TURD);
        turds--;
      }
    }
    const placed = { eggs: 0, turds: 0 };
    for(const power of queue){
      const slot = candidates.shift();
      if(!slot) break;
      const [x, y] = slot;
      overlay[y][x] = power;
      if(power === POWER.EGG) placed.eggs++;
      if(power === POWER.TURD) placed.turds++;
    }
    return placed;
  }

  function placeMudTrapsForPiece(piece, count=1, opts={}){
    const placed = placePowerMarkersForPiece(piece, POWER.MUD, count, opts);
    return { turds: placed.mud, mud: placed.mud };
  }

  function placeTurdMessesForPiece(piece, count=1, opts={}){
    return placePowerMarkersForPiece(piece, POWER.TURD, count, opts);
  }

  function placePowerMarkersForPiece(piece, power, count=1, opts={}){
    const target = Math.max(0, count|0);
    const placed = { eggs: 0, turds: 0, mud: 0 };
    if(!piece || target <= 0) return placed;
    const radius = opts.radius ?? 2;
    const used = new Set();
    const canPlaceMarker = ([x, y]) =>
      x >= 0 && x < COLS &&
      y >= 0 && y < ROWS &&
      board[y][x] === TILE.EMPTY &&
      overlay[y][x] === POWER.NONE;
    const placedCount = () => placed.eggs + placed.turds + placed.mud;
    const tryCells = (cells) => {
      for(const cell of cells){
        if(placedCount() >= target) return;
        const [x, y] = cell;
        const key = keyForCell(x, y);
        if(used.has(key)) continue;
        used.add(key);
        if(!canPlaceMarker(cell)) continue;
        overlay[y][x] = power;
        if(power === POWER.EGG) placed.eggs++;
        if(power === POWER.TURD) placed.turds++;
        if(power === POWER.MUD) placed.mud++;
      }
    };

    tryCells(nearbyCellsForPiece(piece, radius, { includeFootprint: false }));
    tryCells(footprintCells(piece));

    const nearestEmptyCells = [];
    for(let y=0; y<ROWS; y++){
      for(let x=0; x<COLS; x++){
        nearestEmptyCells.push([x, y]);
      }
    }
    nearestEmptyCells.sort((a, b) => {
      const d = distanceToPieceCell(piece, a[0], a[1]) - distanceToPieceCell(piece, b[0], b[1]);
      if(d !== 0) return d;
      if(a[1] !== b[1]) return b[1] - a[1];
      return a[0] - b[0];
    });
    tryCells(nearestEmptyCells);

    return placed;
  }

  function panicNearbyAnimals(piece, count=1, opts={}){
    const avoidAnimal = opts.avoidAnimal ?? null;
    const candidates = nearbyAnimalCells(piece, opts.radius ?? 2);
    let panicked = 0;
    for(const [x, y] of candidates){
      const currentAnimal = board[y][x];
      const pool = ANIMALS.filter((animal) => animal !== currentAnimal && animal !== avoidAnimal);
      if(!pool.length) continue;
      board[y][x] = randChoice(pool);
      panicked++;
      if(panicked >= count) break;
    }
    return panicked;
  }

  function bumpDestroyedAnimals(entries){
    if(!entries?.length) return;
    const tallies = new Map();
    for(const entry of entries){
      const tile = Array.isArray(entry) ? entry[2] : entry?.tile;
      if(!ANIMALS.includes(tile)) continue;
      tallies.set(tile, (tallies.get(tile) || 0) + 1);
    }
    for(const [animal, amount] of tallies){
      bumpMission("destroy", { animal, amount });
    }
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
      if(board[y][x] !== animal) continue;
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
      bumpDestroyedAnimals(popped);
      spawnPopParticles(popped);
      banner.text = `Barn Buster popped ${popped.length} tiles.`;
      banner.t = performance.now();
      if(!playSpecialCue("bomb", { hit:true, count:popped.length })){
        playTone({type:"sawtooth", f1:180, f2:50, dur:0.16, gain:0.18});
      }
    } else {
      const turdsPlaced = markFootprintOverlays(piece, POWER.TURD, 2);
      banner.text = `Barn Buster whiffed and dropped ${turdsPlaced} turd${turdsPlaced === 1 ? "" : "s"}.`;
      banner.t = performance.now();
      playSpecialCue("bomb", { hit:false });
      playGameEventSound("turd_penalty");
    }
  }

  function missionBunkerBlast(piece){
    const queued = [];
    const destroyed = new Set();
    for(const [x,y] of footprintCells(piece)){
      for(let dy=-1; dy<=1; dy++){
        for(let dx=-1; dx<=1; dx++){
          const nx = x + dx;
          const ny = y + dy;
          if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
          if(board[ny][nx] === TILE.EMPTY) continue;
          const key = ny * COLS + nx;
          if(destroyed.has(key)) continue;
          destroyed.add(key);
          queued.push([nx, ny]);
        }
      }
    }

    for(let i=0; i<queued.length; i++){
      const [x,y] = queued[i];
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx = x + dx;
        const ny = y + dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        if(board[ny][nx] === TILE.EMPTY) continue;
        const key = ny * COLS + nx;
        if(destroyed.has(key)) continue;
        destroyed.add(key);
        queued.push([nx, ny]);
      }
    }

    const popped = [];
    for(const key of destroyed){
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
      bumpDestroyedAnimals(popped);
      spawnPopParticles(popped);
      banner.text = `Bunker Buster chain-blasted ${popped.length} tiles.`;
      banner.t = performance.now();
      if(!playSpecialCue("bunker_buster", { hit:true, count:popped.length })){
        playTone({type:"sawtooth", f1:150, f2:46, dur:0.2, gain:0.2});
        playTone({type:"square", f1:220, f2:82, dur:0.16, gain:0.11});
      }
      haptic(20);
      return;
    }

    const excluded = new Set(footprintCells(piece).map(([x,y]) => keyForCell(x, y)));
    const footprintTurds = markOneFootprintOverlay(piece, POWER.TURD) ? 1 : 0;
    const lowerTurds = scatterLowerHalfOverlays(POWER.TURD, 3, excluded);
    banner.text = `Bunker Buster whiffed and dropped ${footprintTurds + lowerTurds} turd${footprintTurds + lowerTurds === 1 ? "" : "s"}.`;
    banner.t = performance.now();
    playSpecialCue("bunker_buster", { hit:false });
    playGameEventSound("turd_penalty");
  }

  function missionReapLargestGroup(piece){
    const best = findLargestAnimalGroup();
    if(best){
      bumpMission("destroy", { animal: best.animal, amount: best.cells.length });
      for(const [x,y] of best.cells){
        board[y][x] = TILE.EMPTY;
        overlay[y][x] = POWER.NONE;
        rewardMap[y][x] = false;
        productMap[y][x] = 0;
      }
      spawnPopParticles(best.cells.map(([x,y]) => [x,y,best.animal]));
      banner.text = `Cull Comb clipped ${best.cells.length} ${TILE_LABEL[best.animal]}.`;
      banner.t = performance.now();
      if(!playSpecialCue("reaper", { hit:true, animal:best.animal, count:best.cells.length })){
        playTone({type:"triangle", f1:620, f2:260, dur:0.14, gain:0.10});
      }
    }
    const landAnimal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, landAnimal);
    banner.text = `Cull Comb clipped and turned into ${TILE_LABEL[landAnimal]}.`;
    banner.t = performance.now();
  }

  function missionMorphPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    banner.text = `Mystery Crate revealed ${TILE_LABEL[animal]}.`;
    banner.t = performance.now();
    playSpecialCue("morph", { hit:true, animal }) || playBarnyard(animal, 6);
  }

  function missionSeedOverlay(piece){
    const landAnimal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, landAnimal);
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
    banner.text = `Nest Bomber dropped ${eggsPlaced} eggs and ${turdsPlaced} turd${turdsPlaced === 1 ? "" : "s"}.`;
    banner.t = performance.now();
    if(!playSpecialCue("seeder", { hit:true, animal:landAnimal, eggs:eggsPlaced, turds:turdsPlaced })){
      playTone({type:"square", f1:500, f2:200, dur:0.10, gain:0.07});
    }
  }

  function missionBrandPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    for(const [x,y] of footprintCells(piece)){
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx = x + dx, ny = y + dy;
        if(nx<0||nx>=COLS||ny<0||ny>=ROWS) continue;
        if(ANIMALS.includes(board[ny][nx])) board[ny][nx] = animal;
      }
    }
    banner.text = `Branding Iron rallied a ${GROUP_NAME[animal] || "group"} of ${TILE_LABEL[animal]}.`;
    banner.t = performance.now();
    playSpecialCue("brand", { hit:true, animal }) || playBarnyard(animal, 7);
  }

  function missionFeedPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
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
    if(!playSpecialCue("feed", { hit:true, animal, eggs:eggsPlaced })){
      playTone({type:"triangle", f1:480, f2:260, dur:0.12, gain:0.07});
    }
  }

  function missionAngryWolfPiece(piece){
    wolvesExplode(piece, {
      label: "Angry Wolf",
      extraTurds: 2,
      howlStyle: USE_ENHANCED_CHAOS_AUDIO ? "victory" : ""
    });
  }

  function missionPackHowlPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    const panicked = panicNearbyAnimals(piece, 4, { radius: 2, avoidAnimal: animal });
    const sprayed = placeMudTrapsForPiece(piece, 1, { radius: 2 });
    banner.text = panicked > 0
      ? `Pack Howl panicked ${panicked} animals${sprayed.turds ? ` and dropped ${sprayed.turds} mud trap${sprayed.turds === 1 ? "" : "s"}` : ""}.`
      : "Pack Howl still scared the barn crooked.";
    banner.t = performance.now();
    if(!playSpecialCue("pack_howl", { hit:panicked > 0, count:panicked, style:"threat" })){
      if(USE_ENHANCED_CHAOS_AUDIO) playWolfHowl("tap");
      playTone({ type:"square", f1:260, f2:144, dur:0.16, gain:0.07 });
    }
    bumpMission("wolf", 1);
  }

  function missionSaltLickPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    const converted = convertNearbyAnimalsTo(piece, animal, 2, { radius: 2 });
    if(converted === 0) markOneFootprintOverlay(piece, POWER.EGG);
    banner.text = converted > 0
      ? `Salt Lick coaxed ${converted} nearby animal${converted === 1 ? "" : "s"} into ${TILE_LABEL[animal]}.`
      : "Salt Lick behaved and left one polite 🥚.";
    banner.t = performance.now();
    playSpecialCue("salt_lick", { hit:converted > 0, animal, count:converted }) || playBarnyard(animal, 7);
  }

  function missionRainBarrelPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    const cleared = clearNearbyOverlays(piece, { max: 4, radius: 2 });
    const clearedMesses = (cleared.turds || 0) + (cleared.mud || 0);
    if(clearedMesses > 0) bumpMission("turds", clearedMesses);
    if((cleared.eggs + clearedMesses) === 0){
      markOneFootprintOverlay(piece, POWER.EGG);
      banner.text = "Rain Barrel found no mess, so it left one useful 🥚.";
    } else {
      banner.text = `Rain Barrel washed ${clearedMesses} mess marker${clearedMesses === 1 ? "" : "s"} and ${cleared.eggs} egg${cleared.eggs === 1 ? "" : "s"}.`;
    }
    banner.t = performance.now();
    if(!playSpecialCue("rain_barrel", { hit:(cleared.eggs + clearedMesses) > 0, animal, cleared })){
      playTone({ type:"sine", f1:360, f2:180, dur:0.15, gain:0.07 });
    }
  }

  function missionRoosterCallPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    let rallied = 0;
    for(const [x, y] of nearbyAnimalCells(piece, 2)){
      if(board[y][x] !== TILE.CHICKEN) continue;
      board[y][x] = animal;
      rallied++;
      if(rallied >= 2) break;
    }
    const eggsPlaced = scatterNearbyOverlays(piece, { eggs: 2, radius: 2 }).eggs;
    banner.text = `Rooster Call rallied ${rallied} chicken${rallied === 1 ? "" : "s"} and laid ${eggsPlaced} combo egg${eggsPlaced === 1 ? "" : "s"}.`;
    banner.t = performance.now();
    if(!playSpecialCue("rooster_call", { hit:rallied > 0, animal, eggs:eggsPlaced })){
      playTone({ type:"square", f1:760, f2:540, dur:0.1, gain:0.07 });
    }
  }

  function missionEggBasketPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    const eggsPlaced = scatterNearbyOverlays(piece, { eggs: 4, radius: 2 }).eggs;
    banner.text = `Egg Basket planted ${eggsPlaced} egg${eggsPlaced === 1 ? "" : "s"} around the ${animalWord(animal)}.`;
    banner.t = performance.now();
    if(!playSpecialCue("egg_basket", { hit:eggsPlaced > 0, animal, eggs:eggsPlaced })){
      playGameEventSound("egg_bonus");
      playTone({ type:"triangle", f1:620, f2:820, dur:0.1, gain:0.06 });
    }
  }

  function missionMuckWagonPiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    const turdsPlaced = placeTurdMessesForPiece(piece, 3, { radius: 2 }).turds;
    banner.text = `Muck Wagon dropped ${turdsPlaced} turd${turdsPlaced === 1 ? "" : "s"}. Turds trim herd coins.`;
    banner.t = performance.now();
    if(!playSpecialCue("muck_wagon", { hit:turdsPlaced > 0, animal, turds:turdsPlaced })){
      playGameEventSound("turd_penalty");
    }
  }

  function missionBarnstormCratePiece(piece){
    const animal = chooseLandingAnimal(piece);
    placePieceAsAnimal(piece, animal);
    const converted = convertNearbyAnimalsTo(piece, animal, 1, { radius: 2 });
    const scattered = scatterNearbyOverlays(piece, { eggs: 2, turds: 1, radius: 2 });
    banner.text = `Barnstorm Crate sprayed ${scattered.eggs} 🥚, ${scattered.turds} 💩, and ${converted ? "one matching ringer" : "pure bad ideas"}.`;
    banner.t = performance.now();
    if(!playSpecialCue("barnstorm_crate", { hit:converted > 0, animal, scattered })){
      playTone({ type:"triangle", f1:480, f2:220, dur:0.12, gain:0.07 });
      playTone({ noise:true, dur:0.05, gain:0.03 });
    }
  }

  function missionProducePiece(piece){
    const product = productInfoForAnimal(piece.productAnimal || mission?.animal || TILE.SHEEP);
    const counts = touchingAnimalCounts(piece);
    const matchedProducer = (counts.get(piece.productAnimal || mission?.animal || TILE.SHEEP) || 0) > 0;
    const landingAnimal = matchedProducer
      ? (piece.productAnimal || mission?.animal || TILE.SHEEP)
      : chooseAnimalFromCounts(counts);

    placePieceAsAnimal(piece, landingAnimal);

    if(matchedProducer){
      markProductPiece(piece, landingAnimal);
      markOneFootprintOverlay(piece, POWER.EGG);
      banner.text = `${product.specialTitle} hit ${animalWord(landingAnimal)}. It dropped an egg and tagged that group for one ${product.noun}.`;
      banner.t = performance.now();
      if(!playSpecialCue("barn_goods", { hit:true, animal:landingAnimal })){
        playBarnyard(landingAnimal, 7);
        playTone({type:"triangle", f1:560, f2:320, dur:0.08, gain:0.06});
      }
    } else {
      markOneFootprintOverlay(piece, POWER.TURD);
      banner.text = `${product.specialTitle} missed and turned into ${TILE_LABEL[landingAnimal]} after dropping 1 turd.`;
      banner.t = performance.now();
      if(!playSpecialCue("barn_goods", { hit:false, animal:landingAnimal })){
        playTone({type:"square", f1:240, f2:150, dur:0.08, gain:0.05});
      }
      playGameEventSound("turd_penalty");
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
    if(REFRESH_V2_ENABLED){
      const comboSteps = depth - 1;
      const stairStep = Math.max(0, depth - 2);
      return Math.min(
        V2_CHAIN_BONUS_CAP,
        Math.round(comboSteps * V2_CHAIN_BONUS_BASE + ((stairStep * (stairStep + 1)) / 2) * V2_CHAIN_BONUS_STEP)
      );
    }
    return fib(depth + 3);
  }

  function herdBaseScore(count){
    if(!REFRESH_V2_ENABLED) return count;
    return count * V2_HERD_SCORE_PER_TILE;
  }

  function herdSizeBonus(count){
    if(count < ACTIVE_CLEAR_THRESHOLD) return 0;
    if(REFRESH_V2_ENABLED){
      return Math.max(0, count - ACTIVE_CLEAR_THRESHOLD) * V2_HERD_SCORE_EXTRA_PER_TILE;
    }
    const step = count - ACTIVE_CLEAR_THRESHOLD;
    if(step <= 7) return fib(step + 3);

    let bonus = 55;
    for(let extra = 1; extra <= step - 7; extra++){
      bonus += 5 * (extra + 1);
    }
    return bonus;
  }

  function herdEggMultiplier(eggs){
    if(!REFRESH_V2_ENABLED) return Math.pow(2, Math.max(0, eggs|0));
    return 1 + Math.min(Math.max(0, eggs|0), V2_EGG_MULTIPLIER_CAP_EGGS) * V2_EGG_MULTIPLIER_PER_EGG;
  }

  function herdTurdMultiplier(turds){
    if(!REFRESH_V2_ENABLED) return 1 / Math.pow(2, Math.max(0, turds|0));
    const penalty = Math.min(Math.max(0, turds|0), V2_TURD_PENALTY_CAP_TURDS) * V2_TURD_PENALTY_PER_TURD;
    return Math.max(V2_TURD_MIN_MULTIPLIER, 1 - penalty);
  }

  function scoreHerdClear(count, eggs=0, turds=0){
    const base = herdBaseScore(count);
    const sizeBonus = herdSizeBonus(count);
    const beforeModifiers = base + sizeBonus;
    if(!REFRESH_V2_ENABLED){
      const afterEggs = eggs ? Math.floor(beforeModifiers * Math.pow(2, Math.max(0, eggs|0))) : beforeModifiers;
      const total = turds ? Math.max(1, Math.floor(afterEggs / Math.pow(2, Math.max(0, turds|0)))) : afterEggs;
      return {
        count,
        base,
        sizeBonus,
        eggs,
        turds,
        eggMultiplier: herdEggMultiplier(eggs),
        turdMultiplier: herdTurdMultiplier(turds),
        eggBonus: Math.max(0, afterEggs - beforeModifiers),
        turdPenalty: Math.max(0, afterEggs - total),
        total
      };
    }
    const eggMultiplier = herdEggMultiplier(eggs);
    const turdMultiplier = herdTurdMultiplier(turds);
    const afterEggs = beforeModifiers * eggMultiplier;
    const total = Math.max(1, Math.round(afterEggs * turdMultiplier));
    return {
      count,
      base,
      sizeBonus,
      eggs,
      turds,
      eggMultiplier,
      turdMultiplier,
      eggBonus: Math.round(afterEggs - beforeModifiers),
      turdPenalty: Math.max(0, Math.round(afterEggs - total)),
      total
    };
  }

  function debugScoreBreakdown(kind, data){
    if(!DEBUG_SCORE) return;
    try{
      console.log("[Angry Wolves score]", kind, data);
    }catch{}
  }

  function debugScoreSamples(){
    if(!DEBUG_SCORE) return;
    try{
      const rows = [
        ["9 herd, clean", scoreHerdClear(9, 0, 0)],
        ["12 herd, clean", scoreHerdClear(12, 0, 0)],
        ["9 herd, 1 egg", scoreHerdClear(9, 1, 0)],
        ["9 herd, 3 eggs", scoreHerdClear(9, 3, 0)],
        ["12 herd, 2 eggs, 1 turd", scoreHerdClear(12, 2, 1)]
      ].map(([label, row]) => ({
        label,
        base: row.base,
        sizeBonus: row.sizeBonus,
        eggs: row.eggs,
        eggMultiplier: row.eggMultiplier,
        turds: row.turds,
        turdMultiplier: row.turdMultiplier,
        total: row.total
      }));
      console.table(rows);
      console.log("[Angry Wolves score] chain samples", {
        x2: chainBonusForDepth(2),
        x3: chainBonusForDepth(3),
        x4: chainBonusForDepth(4),
        normalMissionMin: 80,
        angryWolves: Math.round(900 * 0.6)
      });
    }catch{}
  }

  // ===== Cluster clearing =====
  function findAnimalGroups(sourceBoard=board, minSize=ACTIVE_CLEAR_THRESHOLD){
    const seen = Array.from({length: ROWS}, () => Array(COLS).fill(false));
    const out = [];

    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if(seen[y][x]) continue;
        const t = sourceBoard[y][x];
        if(!ANIMALS.includes(t)){
          seen[y][x] = true;
          continue;
        }
        const cells = floodSameAnimal(x,y,t,seen,sourceBoard);
        if(cells.length >= minSize) out.push({ animal: t, cells });
      }
    }
    return out;
  }

  function findAnimalGroupsToClear(){
    return findAnimalGroups(board, ACTIVE_CLEAR_THRESHOLD);
  }

  function floodSameAnimal(sx,sy,animal,seen,sourceBoard=board){
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
        if(sourceBoard[ny][nx] === animal){
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

  function connectedAnimalComponentExcluding(sx, sy, animal, blocked, cache){
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

    let componentId = startKey;
    for(const [x, y] of cells){
      const key = keyForCell(x, y);
      if(key < componentId) componentId = key;
    }

    const component = { id: componentId, size: cells.length };
    for(const [x, y] of cells) cache.set(keyForCell(x, y), component);
    return component;
  }

  function choosePerimeterConversionAnimal(x, y, blocked, cache){
    const candidateScores = new Map();

    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x + dx;
      const ny = y + dy;
      if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      const key = keyForCell(nx, ny);
      if(blocked.has(key)) continue;
      const animal = board[ny][nx];
      if(!ANIMALS.includes(animal)) continue;
      const component = connectedAnimalComponentExcluding(nx, ny, animal, blocked, cache);
      if(!component) continue;
      if(!candidateScores.has(animal)){
        candidateScores.set(animal, {
          mergedSize: 0,
          touchingEdges: 0,
          components: new Set()
        });
      }
      const score = candidateScores.get(animal);
      score.touchingEdges++;
      if(!score.components.has(component.id)){
        score.components.add(component.id);
        score.mergedSize += component.size;
      }
    }

    let bestAnimal = null;
    let bestMergedSize = -1;
    let bestTouchingEdges = -1;
    for(const animal of ANIMALS){
      const score = candidateScores.get(animal);
      if(!score) continue;
      if(
        score.mergedSize > bestMergedSize ||
        (score.mergedSize === bestMergedSize && score.touchingEdges > bestTouchingEdges) ||
        (score.mergedSize === bestMergedSize && score.touchingEdges === bestTouchingEdges && animalTieBreakIndex(animal) < animalTieBreakIndex(bestAnimal))
      ){
        bestAnimal = animal;
        bestMergedSize = score.mergedSize;
        bestTouchingEdges = score.touchingEdges;
      }
    }

    return bestMergedSize > 0 ? bestAnimal : null;
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
    let consumedEggs = 0;
    let consumedTurds = 0;
    let animationEndsAt = performance.now();
    while(true){
      if(gameOver) break;
      const clears = findAnimalGroupsToClear();
      if(clears.length === 0) break;
      cascadeDepth++;
      const simpleGravity = SIMPLE_HERD_GRAVITY_ENABLED;
      const clearConversionData = simpleGravity
        ? {
            blocked: new Set(clears.flatMap((group) => group.cells.map(([x, y]) => keyForCell(x, y)))),
            conversions: new Map()
          }
        : buildClearConversions(clears);
      const { blocked: clearedKeys, conversions } = clearConversionData;
      const clearedTileLookup = new Map();
      const clearSoundCues = [];
      for(const group of clears){
        for(const [x,y] of group.cells) clearedTileLookup.set(keyForCell(x, y), group.animal);
      }

      for(const group of clears){
        const { animal, cells } = group;
        let eggs=0, turds=0;
        for(const [x,y] of cells){
          if(overlay[y][x] === POWER.EGG) eggs++;
          if(overlay[y][x] === POWER.TURD) turds++;
        }

        const scoreBreakdown = scoreHerdClear(cells.length, eggs, turds);
        const gain = scoreBreakdown.total;
        if(scoreBreakdown.sizeBonus > 0){
          bumpMission("big_group", 1);
        }
        bumpMission("large_clear", { size: cells.length });

        consumedEggs += eggs;
        consumedTurds += turds;
        if(turds > 0) bumpMission("turds", turds);
        if(eggs > 0) bumpMission("egg_clear", { animal, amount: 1, eggs });
        if(!bestHerd || cells.length > bestHerd.count || (cells.length === bestHerd.count && gain > bestHerd.gain)){
          bestHerd = { animal, count: cells.length, gain };
        }
        debugScoreBreakdown("herd-clear", {
          animal: animalWord(animal),
          chainDepth: cascadeDepth,
          ...scoreBreakdown
        });
        const clearedReward = cells.some(([x,y]) => rewardMap[y][x]);
        if(clearedReward){
          rewardEarned = true;
        }
        const clearedProductTokens = new Set(
          cells
            .map(([x,y]) => productMap[y][x])
            .filter(Boolean)
        );
        if(clearedProductTokens.size && mission && mission.type === "product" && (!mission.animal || mission.animal === animal)){
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
        bumpMission("destroy", { animal, amount: cells.length });
        bumpMission("clears", 1);
        if(gameOver) break;
        const chainTag = cascadeDepth > 1 ? `Chain ${fmtChain(cascadeDepth)}! ` : "";
        banner.text = `${chainTag}${quipForAnimal(animal)} Cleared ${cells.length} ${animalWord(animal)} ${TILE_LABEL[animal]} +${gain}${eggs?` 🥚+${scoreBreakdown.eggBonus}`:""}${turds?` 💩-${scoreBreakdown.turdPenalty}`:""}`;
        banner.t = performance.now();

        spawnPopParticles(cells.map(([x,y]) => [x,y,animal]));
        clearSoundCues.push({ animal, size: cells.length });
        haptic(12);
      }

      const clearFx = [];
      const previewFx = [];
      const convertFx = [];
      const fallFx = [];
      for(const key of clearedKeys){
        const [xStr, yStr] = key.split(",");
        const x = Number(xStr);
        const y = Number(yStr);
        const originalTile = clearedTileLookup.get(key) || TILE.EMPTY;
        const convertedTile = simpleGravity ? TILE.EMPTY : (conversions.get(key) || TILE.EMPTY);
        if(!simpleGravity && convertedTile){
          previewFx.push({
            type: "preview",
            x,
            y,
            fromTile: originalTile,
            toTile: convertedTile,
            duration: BOARD_CONVERT_PREVIEW_ANIM_MS
          });
          convertFx.push({
            type: "convert",
            x,
            y,
            fromTile: originalTile,
            toTile: convertedTile,
            duration: BOARD_CONVERT_ANIM_MS
          });
        } else if(originalTile !== TILE.EMPTY){
          clearFx.push({
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
        fallFx.push({
          type: "fall",
          x: move.x,
          fromY: move.fromY,
          toY: move.toY,
          tile: move.tile,
          duration: BOARD_FALL_ANIM_MS + Math.max(0, move.toY - move.fromY) * 32
        });
      }
      let phaseCursor = animationEndsAt;
      const phaseStartFor = (entries) => {
        if(!entries.length) return null;
        const needsGap = phaseCursor > (performance.now() + 16);
        return phaseCursor + (needsGap ? BOARD_PHASE_GAP_MS : 0);
      };
      const queuePhase = (entries, onStart) => {
        if(!entries.length) return;
        const phaseStart = phaseStartFor(entries);
        if(onStart) onStart(phaseStart);
        phaseCursor = queueBoardAnimations(entries, phaseStart) || phaseCursor;
      };
      const herdSoundPhaseStart = phaseStartFor(clearFx) ?? phaseStartFor(previewFx) ?? phaseStartFor(convertFx) ?? phaseStartFor(fallFx);
      if(herdSoundPhaseStart != null){
        clearSoundCues.forEach((cue, index) => {
          queueBoardAudioCue(herdSoundPhaseStart + index * CLEAR_AUDIO_STAGGER_MS, () => playBarnyard(cue.animal, cue.size));
        });
      }
      queuePhase(clearFx);
      queuePhase(previewFx);
      queuePhase(convertFx);
      queuePhase(fallFx);
      animationEndsAt = Math.max(animationEndsAt, phaseCursor);
    }
    const restocked = restockLowerBarnOverlays(
      rollRestockCount(POWER.EGG, consumedEggs),
      rollRestockCount(POWER.TURD, consumedTurds)
    );
    const chainBonus = chainBonusForDepth(cascadeDepth);
    if(chainBonus > 0){
      debugScoreBreakdown("chain-bonus", { chainDepth: cascadeDepth, chainBonus });
      score += chainBonus;
      totalGain += chainBonus;
      playChainBonusSting(cascadeDepth);
      if(!rewardEarned){
        banner.text = `Chain ${fmtChain(cascadeDepth)} paid out +${chainBonus} bonus coins.`;
        banner.t = performance.now();
      }
    }
    syncPassiveMissionProgress();
    if(rewardEarned && mission && mission.ready && !mission.done){
      mission.done = true;
      banner.text = mission.id === "angry_wolves"
        ? `Angry Wolves cleared. The barn survived. +${mission.cashBonus} coins.`
        : `Reward group cleared. Mission earned: +${mission.cashBonus} coins.`;
      banner.t = performance.now();
      rememberShareSnapshot(preResolveSnapshot);
      playMissionJingle();
      if(mission.id === "angry_wolves"){
        showToast(`🐺 Angry Wolves tamed · +${mission.cashBonus}`, 3200);
        haptic(28);
      }
    } else {
      rememberShareSnapshot();
    }
    updateHUD();
    return {
      groupsCleared,
      totalGain,
      rewardEarned,
      chainDepth: cascadeDepth,
      chainBonus,
      restockedEggs: restocked.eggs,
      restockedTurds: restocked.turds,
      animationWaitMs: Math.max(0, animationEndsAt - performance.now())
    };
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
    const restockText = formatRestockToast(summary.restockedEggs || 0, summary.restockedTurds || 0);
    showToast(`🪙 x${summary.totalGain}${chainText}${restockText ? ` · ${restockText}` : ""}`, 2600);
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

    if(current.kind === "MISSION_SPECIAL"){
      const entry = missionSpecialEntry(current.specialId);
      const landedLonely = !pieceTouchesSettledTiles(current);
      beginMudHazardTracking();
      entry?.onLock?.(current);
      if((entry?.leaveLonelyTurd ?? true) && maybeDropLonelyMissionTurd(current, landedLonely)){
        banner.text += " It landed alone and left 1 turd.";
      }
      const mudSummary = finishMudHazardTracking();
      appendMudHazardResult(mudSummary);
      settleBoardNow();
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
      if(!playGameEventSound("egg_bonus")){
        playTone({type:"triangle", f1:720, f2:360, dur:0.16, gain:0.08});
      }
      updateHUD();
      if(!gameOver) spawnNext();
      return;
    }

    const contactChaos = touchingAnimalSummary(current);
    beginMudHazardTracking();
    let placedCells = [];
    for(let r=0;r<current.matrix.length;r++){
      for(let c=0;c<current.matrix[r].length;c++){
        const v = current.matrix[r][c];
        if(!v) continue;
        const x = current.x + c;
        const y = current.y + r;
        if(y < 0){ gameOverNow(); return; }
        if(placeLandingTileWithMud(x, y, v)) placedCells.push([x, y, v]);
      }
    }

    if(current.kind === "BLACKSHEEP"){
      const choice = chooseConversionAnimalForBlackSheep(current);
      placedCells = placedCells
        .filter(([x, y]) => board[y][x] === TILE.BLACK_SHEEP)
        .map(([x, y]) => {
          board[y][x] = choice.animal;
          return [x, y, choice.animal];
        });
      if(!choice.hadNeighbor){
        markOneFootprintOverlay(current, POWER.EGG);
        banner.text = "Black sheep landed alone, left an egg, and joined in anyway.";
        banner.t = performance.now();
      }
    }
    const mudSummary = finishMudHazardTracking();
    appendMudHazardResult(mudSummary);
    if(mudSummary.destroyed > 0) settleBoardNow();

    const landedCells = placedCells.length ? placedCells.map(([x, y]) => [x, y]) : footprintCells(current);
    const settleAnimal = current.kind === "BLACKSHEEP"
      ? board[landedCells[0]?.[1] ?? 0]?.[landedCells[0]?.[0] ?? 0] ?? pieceLeadAnimal(current)
      : pieceLeadAnimal(current);

    registerLockCycle();
    const summary = resolveBoard();
    finishLockResolution(summary, { settleAnimal, contactChaos, hapticMs: contactChaos.contactCount ? 14 : 10 });
  }

  function holdCurrent(){
    if(paused || gameOver || !current || holdUsed || !next) return;
    const outgoing = clonePiece(current);
    const incoming = preparePiece(next);
    next = outgoing;
    current = incoming;
    if(collides(current,0,0)) return gameOverNow();
    held = null;
    holdUsed = true;
    rotateSlowUses = 4;
    rotateSlowUntil = 0;
    banner.text = "Swapped the current tetrad with the queued one.";
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
    else {
      playInvalidMove();
      haptic(6);
    }
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
      if(!playGameEventSound("piece_hard_drop", { distance:moved })) playDropThump();
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
    if(!current.rotates){
      playInvalidMove();
      return false;
    }
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
    playInvalidMove();
    draw();
    return false;
  }

  function getGhostY(piece){
    let y = piece.y;
    while(!collides(piece, 0, (y - piece.y) + 1)) y++;
    return y;
  }

  function pieceCellsAt(piece, targetY=piece?.y){
    if(!piece) return [];
    const cells = [];
    const m = piece.matrix;
    for(let r=0;r<m.length;r++){
      for(let c=0;c<m[r].length;c++){
        const tile = m[r][c];
        if(!tile) continue;
        const x = piece.x + c;
        const y = targetY + r;
        if(x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
        cells.push([x, y, tile]);
      }
    }
    return cells;
  }

  function cellKeySet(cells){
    return new Set(cells.map(([x, y]) => keyForCell(x, y)));
  }

  function groupTouchesCellSet(group, keys){
    return group.cells.some(([x, y]) => keys.has(keyForCell(x, y)));
  }

  function simulatedLandingBoard(piece=current){
    if(!piece) return null;
    const ghostY = getGhostY(piece);
    const simulated = board.map((row) => row.slice());
    const ghostCells = [];
    for(const [x, y, tile] of pieceCellsAt(piece, ghostY)){
      if(!ANIMALS.includes(tile)) continue;
      simulated[y][x] = tile;
      ghostCells.push([x, y]);
    }
    return { board: simulated, ghostY, ghostCells };
  }

  function v2HerdPreviewGroups(){
    if(!REFRESH_V2_ENABLED) return { near: [], landing: [] };
    const nearMin = Math.max(2, ACTIVE_CLEAR_THRESHOLD - V2_NEAR_CLEAR_MARGIN);
    const near = findAnimalGroups(board, nearMin)
      .filter((group) => group.cells.length < ACTIVE_CLEAR_THRESHOLD)
      .sort((a, b) => b.cells.length - a.cells.length)
      .slice(0, V2_HERD_HINT_MAX_GROUPS);

    const landingState = current ? simulatedLandingBoard(current) : null;
    if(!landingState || !landingState.ghostCells.length) return { near, landing: [] };
    const ghostKeys = cellKeySet(landingState.ghostCells);
    const landing = findAnimalGroups(landingState.board, ACTIVE_CLEAR_THRESHOLD)
      .filter((group) => groupTouchesCellSet(group, ghostKeys))
      .sort((a, b) => b.cells.length - a.cells.length)
      .slice(0, V2_HERD_HINT_MAX_GROUPS);
    return { near, landing };
  }

  function v2HerdHintLookup(groups){
    const lookup = new Map();
    if(!groups) return lookup;
    for(const group of groups.near || []){
      for(const [x, y] of group.cells){
        lookup.set(keyForCell(x, y), { ...(lookup.get(keyForCell(x, y)) || {}), herdCandidate:true });
      }
    }
    for(const group of groups.landing || []){
      for(const [x, y] of group.cells){
        lookup.set(keyForCell(x, y), { ...(lookup.get(keyForCell(x, y)) || {}), landingCandidate:true });
      }
    }
    return lookup;
  }

  function tileThreatenedByWolf(x, y){
    if(!REFRESH_V2_ENABLED) return false;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx = x + dx;
      const ny = y + dy;
      if(nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue;
      if(board[ny][nx] === TILE.WOLF) return true;
    }
    return false;
  }

  function v2TileState(x, y, hintLookup=null, extra={}){
    if(!REFRESH_V2_ENABLED) return extra;
    return {
      ...(hintLookup?.get(keyForCell(x, y)) || {}),
      scared: tileThreatenedByWolf(x, y),
      ...extra
    };
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

  function boardAnimationEndsAt(){
    let end = 0;
    for(const entry of boardAnimations){
      end = Math.max(end, entry.start + entry.duration);
    }
    return end;
  }

  function queueBoardAnimations(entries, startAt){
    if(!entries?.length) return;
    const start = Math.max(performance.now(), startAt ?? boardAnimationEndsAt());
    for(const entry of entries){
      boardAnimations.push({ ...entry, start });
    }
    return start + Math.max(...entries.map((entry) => entry.duration));
  }

  function queueBoardAudioCue(startAt, fn){
    if(typeof fn !== "function") return;
    boardAudioCues.push({
      start: Math.max(performance.now(), startAt ?? performance.now()),
      fn
    });
  }

  function stepBoardAudioCues(now=performance.now()){
    if(!boardAudioCues.length) return;
    const remaining = [];
    for(const cue of boardAudioCues){
      if(now >= cue.start){
        try{ cue.fn(); }catch{}
      } else {
        remaining.push(cue);
      }
    }
    boardAudioCues = remaining;
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
    pad = FARM_BOARD_RENDERER_ENABLED ? (compact ? 15 : 18) : (compact ? 8 : 14);

    const topReserve = compact ? Math.floor((FARM_BOARD_RENDERER_ENABLED ? 6 : 18) * dpr) : 0;
    const bottomReserve = compact ? Math.floor((FARM_BOARD_RENDERER_ENABLED ? 4 : 16) * dpr) : Math.floor((FARM_BOARD_RENDERER_ENABLED ? 6 : 14) * dpr);

    const v2CellNudgeWidth = REFRESH_V2_ENABLED ? V2_BOARD_CELL_NUDGE_PX * COLS : 0;
    const usableWidth = REFRESH_V2_ENABLED
      ? Math.min(rect.width, Math.max(260, window.innerWidth - 58 + v2CellNudgeWidth), compact ? 360 + v2CellNudgeWidth : 440 + v2CellNudgeWidth)
      : rect.width;
    const targetW = Math.max(220, Math.floor(usableWidth * dpr) - Math.floor((FARM_BOARD_RENDERER_ENABLED ? 0 : (compact ? 10 : 8)) * dpr));
    const targetH = Math.max(280, Math.floor(rect.height * dpr) - topReserve - bottomReserve - Math.floor((FARM_BOARD_RENDERER_ENABLED ? 0 : (compact ? 2 : 8)) * dpr));

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
    const appRect = (appEl || document.body).getBoundingClientRect();
    const boardLeftInApp = Math.max(0, Math.floor(rect.left - appRect.left + boardOffset));
    const stagePadTop = Math.floor(parseFloat(getComputedStyle(stageEl).paddingTop) || 0);
    if(compact){
      if(hudEl){
        hudEl.style.width = `${canvasCssW}px`;
        hudEl.style.maxWidth = `${canvasCssW}px`;
        if(REFRESH_V2_ENABLED){
          hudEl.style.marginLeft = `${boardLeftInApp}px`;
          hudEl.style.marginRight = "auto";
        }
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
        hudEl.style.removeProperty("margin-left");
        hudEl.style.removeProperty("margin-right");
      }
      if(stageMissionBarEl){
        if(REFRESH_V2_ENABLED){
          stageMissionBarEl.style.width = `${canvasCssW}px`;
          stageMissionBarEl.style.left = `${boardOffset}px`;
          stageMissionBarEl.style.right = "auto";
        } else {
          stageMissionBarEl.style.removeProperty("width");
          stageMissionBarEl.style.removeProperty("left");
          stageMissionBarEl.style.removeProperty("right");
        }
      }
    }
    if(toastEl){
      toastEl.style.left = `${boardOffset + Math.floor(canvasCssW / 2)}px`;
      toastEl.style.top = `${stagePadTop + Math.floor(canvasCssH / 2)}px`;
    }
    if(stageCopyrightEl){
      stageCopyrightEl.style.left = `${boardOffset}px`;
      stageCopyrightEl.style.top = `${stagePadTop + canvasCssH + 5}px`;
      stageCopyrightEl.style.width = `${canvasCssW}px`;
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

  function drawEggGlyph(cx, cy, size){
    const s = size;
    ctx.save();
    const grad = ctx.createRadialGradient(cx - s * 0.12, cy - s * 0.18, s * 0.05, cx, cy, s * 0.42);
    grad.addColorStop(0, "#fff8cf");
    grad.addColorStop(0.52, "#ffe279");
    grad.addColorStop(1, "#d99a28");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.31, s * 0.42, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(96, 59, 10, 0.42)";
    ctx.lineWidth = Math.max(1, s * 0.05);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#fffbe3";
    ctx.beginPath();
    ctx.ellipse(cx - s * 0.1, cy - s * 0.16, s * 0.09, s * 0.13, 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function overlayMarkerGeometry(gx, gy, size=cell, power=POWER.EGG, opts={}){
    const centeredMudTrap = REFRESH_V2_ENABLED && power === POWER.MUD && !opts.aboveTiles;
    const markerSize = centeredMudTrap
      ? Math.max(18, size * 0.66)
      : Math.max(12, size * 0.38);
    return {
      cx: centeredMudTrap ? gx + size * 0.5 : gx + size * 0.25,
      cy: centeredMudTrap ? gy + size * 0.5 : gy + size * 0.74,
      size: markerSize
    };
  }

  function drawMudSplatGlyph(cx, cy, size){
    const s = size;
    ctx.save();
    ctx.globalAlpha *= 0.98;
    ctx.fillStyle = "rgba(47, 28, 15, 0.22)";
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.1, s * 0.5, s * 0.2, 0.05, 0, Math.PI * 2);
    ctx.fill();

    const spots = [
      [0, 0, 0.34, 0.24, 0.12],
      [-0.27, -0.06, 0.18, 0.13, -0.38],
      [0.25, -0.04, 0.19, 0.12, 0.32],
      [-0.14, 0.2, 0.22, 0.12, 0.18],
      [0.13, 0.18, 0.2, 0.12, -0.24],
      [-0.34, 0.18, 0.09, 0.06, 0.42],
      [0.36, 0.16, 0.1, 0.06, -0.36],
      [-0.18, -0.29, 0.08, 0.05, 0],
      [0.2, -0.27, 0.07, 0.05, 0]
    ];

    ctx.fillStyle = "#6b3b20";
    for(const [dx, dy, rx, ry, rot] of spots){
      ctx.beginPath();
      ctx.ellipse(cx + s * dx, cy + s * dy, s * rx, s * ry, rot, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha *= 0.28;
    ctx.fillStyle = "#f1b26b";
    ctx.beginPath();
    ctx.ellipse(cx - s * 0.12, cy - s * 0.08, s * 0.16, s * 0.07, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPowerMarker(cx, cy, size, power, opts={}){
    const egg = power === POWER.EGG;
    const mudTrap = power === POWER.MUD && REFRESH_V2_ENABLED && !opts.aboveTiles;
    const halo = egg
      ? "rgba(255, 216, 77, 0.28)"
      : (mudTrap ? "rgba(92, 54, 28, 0.2)" : "rgba(126, 71, 36, 0.3)");
    ctx.save();
    ctx.globalAlpha *= opts.aboveTiles ? 0.96 : (mudTrap ? 0.9 : 0.78);
    ctx.fillStyle = halo;
    ctx.beginPath();
    if(mudTrap) ctx.ellipse(cx, cy + size * 0.04, size * 0.56, size * 0.38, 0, 0, Math.PI * 2);
    else ctx.arc(cx, cy, size * 0.52, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha *= opts.aboveTiles ? 1 : 0.92;
    if(egg) drawEggGlyph(cx, cy, size);
    else if(mudTrap) drawMudSplatGlyph(cx, cy, size);
    else drawTurdGlyph(cx, cy + size * 0.02, size * 0.86);
    ctx.restore();
  }

  function isVectorAnimalTile(tile){
    return ANIMALS.includes(tile) || tile === TILE.WOLF || tile === TILE.BLACK_SHEEP;
  }

  function tokenScaleForState(state={}){
    const activeLift = state.active ? 0.035 * Math.sin(performance.now() / 115) : 0;
    if(state.ghost) return 0.92;
    if(state.clearing) return 0.84;
    return (state.active ? 1.04 : 1) + activeLift;
  }

  function tokenAlphaForState(state={}){
    if(state.ghost) return V2_GHOST_TOKEN_ALPHA;
    if(state.clearing) return 0.74;
    return 1;
  }

  function drawTokenShadow(cx, cy, s, state={}){
    if(state.ghost) return;
    ctx.save();
    ctx.globalAlpha = state.active ? 0.26 : 0.16;
    ctx.fillStyle = "#0c1308";
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.24, s * 0.3, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawTokenBase(cx, cy, s, meta, state={}){
    const fill = ctx.createRadialGradient(cx - s*0.16, cy - s*0.18, s*0.07, cx, cy, s*0.42);
    fill.addColorStop(0, meta.accent);
    fill.addColorStop(0.38, meta.base);
    fill.addColorStop(1, meta.shade);

    ctx.save();
    ctx.globalAlpha *= state.ghost ? V2_GHOST_TOKEN_BASE_ALPHA : 1;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.02, s * 0.31, s * 0.27, 0, 0, Math.PI * 2);
    ctx.fill();
    if(!state.ghost){
      ctx.globalAlpha *= 0.16;
      ctx.fillStyle = "#fff8df";
      ctx.beginPath();
      ctx.ellipse(cx - s * 0.1, cy - s * 0.12, s * 0.13, s * 0.08, -0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTokenEyes(cx, cy, s, opts={}){
    const {
      dx = s * 0.1,
      y = -s * 0.05,
      r = s * 0.028,
      ink = "#1a110d",
      scared = false
    } = opts;
    ctx.save();
    ctx.fillStyle = scared ? "#fff8dc" : ink;
    ctx.beginPath();
    ctx.arc(cx - dx, cy + y, scared ? r * 1.65 : r, 0, Math.PI * 2);
    ctx.arc(cx + dx, cy + y, scared ? r * 1.65 : r, 0, Math.PI * 2);
    ctx.fill();
    if(scared){
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(cx - dx, cy + y, r * 0.62, 0, Math.PI * 2);
      ctx.arc(cx + dx, cy + y, r * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTokenModifierBadges(cx, cy, s, state={}){
    if(!state.bonus && !state.muddy && !state.scared) return;
    ctx.save();
    if(state.bonus || state.muddy){
      const power = state.bonus ? POWER.EGG : POWER.TURD;
      const marker = overlayMarkerGeometry(cx - s / 2, cy - s / 2, s, power, { aboveTiles:true });
      drawPowerMarker(marker.cx, marker.cy, marker.size, state.bonus ? POWER.EGG : POWER.TURD, { aboveTiles:true });
    }
    if(state.scared){
      ctx.fillStyle = "#f8f2d8";
      ctx.font = `900 ${Math.floor(s * 0.18)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("!", cx + s * 0.31, cy - s * 0.28);
    }
    ctx.restore();
  }

  function renderSheepToken(targetCtx, x, y, size, state={}){
    const s = size;
    const meta = VECTOR_TOKEN_META[state.blackSheep ? TILE.BLACK_SHEEP : TILE.SHEEP];
    drawTokenBase(x, y + s * 0.03, s * 0.72, meta, state);
    ctx.save();
    const woolFill = state.blackSheep ? "#242b35" : "#fff6dc";
    const woolShade = state.blackSheep ? "#171c24" : "#eadfc0";
    const woolStroke = state.blackSheep ? "rgba(8, 10, 14, 0.42)" : "rgba(116, 93, 59, 0.22)";
    const faceFill = state.blackSheep ? "#e5d9bb" : "#2b2724";
    const eyeFill = state.blackSheep ? "#201b16" : "#fff9e8";
    const puffs = [
      [-0.26,-0.05,0.13], [-0.19,-0.21,0.14], [-0.03,-0.28,0.15],
      [0.15,-0.24,0.14], [0.29,-0.08,0.13], [-0.28,0.12,0.13],
      [-0.11,0.07,0.18], [0.08,0.05,0.18], [0.26,0.12,0.13],
      [-0.12,0.25,0.12], [0.08,0.27,0.12]
    ];
    ctx.lineWidth = Math.max(1, s * 0.026);
    puffs.forEach(([dx, dy, r], index)=>{
      ctx.fillStyle = index % 3 === 0 ? woolShade : woolFill;
      ctx.strokeStyle = woolStroke;
      ctx.beginPath();
      ctx.ellipse(x + s*dx, y + s*dy, s*r, s*r*0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.fillStyle = faceFill;
    ctx.beginPath();
    ctx.ellipse(x + s*0.17, y + s*0.03, s*0.12, s*0.15, -0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x - s*0.18, y + s*0.31, s*0.04, s*0.025, 0, 0, Math.PI * 2);
    ctx.ellipse(x + s*0.09, y + s*0.32, s*0.04, s*0.025, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = eyeFill;
    ctx.beginPath();
    ctx.arc(x + s*0.2, y - s*0.01, s*0.018, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    void targetCtx;
  }

  function renderGoatToken(targetCtx, x, y, size, state={}){
    const s = size;
    const meta = VECTOR_TOKEN_META[TILE.GOAT];
    drawTokenBase(x, y + s * 0.02, s * 0.78, meta, state);
    ctx.save();
    const outline = "rgba(80, 50, 27, 0.38)";
    ctx.lineWidth = Math.max(1, s * 0.026);
    ctx.fillStyle = "#f0dbc0";
    ctx.strokeStyle = outline;
    ctx.beginPath();
    ctx.moveTo(x - s*0.1, y - s*0.2);
    ctx.lineTo(x - s*0.34, y - s*0.46);
    ctx.lineTo(x - s*0.24, y - s*0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s*0.1, y - s*0.2);
    ctx.lineTo(x + s*0.34, y - s*0.46);
    ctx.lineTo(x + s*0.24, y - s*0.12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = meta.base;
    ctx.beginPath();
    ctx.moveTo(x - s*0.24, y - s*0.06);
    ctx.lineTo(x - s*0.43, y + s*0.01);
    ctx.lineTo(x - s*0.21, y + s*0.1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + s*0.24, y - s*0.06);
    ctx.lineTo(x + s*0.43, y + s*0.01);
    ctx.lineTo(x + s*0.21, y + s*0.1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = meta.base;
    ctx.strokeStyle = outline;
    ctx.beginPath();
    ctx.moveTo(x, y - s*0.28);
    ctx.lineTo(x + s*0.24, y - s*0.11);
    ctx.lineTo(x + s*0.18, y + s*0.17);
    ctx.lineTo(x + s*0.04, y + s*0.31);
    ctx.lineTo(x - s*0.17, y + s*0.19);
    ctx.lineTo(x - s*0.23, y - s*0.11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f1d2a5";
    ctx.beginPath();
    ctx.ellipse(x + s*0.02, y + s*0.13, s*0.13, s*0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = meta.accent;
    ctx.beginPath();
    ctx.moveTo(x - s*0.02, y + s*0.28);
    ctx.lineTo(x + s*0.11, y + s*0.28);
    ctx.lineTo(x + s*0.04, y + s*0.45);
    ctx.closePath();
    ctx.fill();
    drawTokenEyes(x, y, s, { dx:s*0.1, y:-s*0.03, r:s*0.025, ink:meta.ink, scared: state.scared });
    ctx.fillStyle = meta.ink;
    ctx.beginPath();
    ctx.ellipse(x + s*0.02, y + s*0.15, s*0.026, s*0.018, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    void targetCtx;
  }

  function renderChickenToken(targetCtx, x, y, size, state={}){
    const s = size;
    const meta = VECTOR_TOKEN_META[TILE.CHICKEN];
    drawTokenBase(x, y, s, meta, state);
    ctx.save();
    ctx.fillStyle = meta.accent;
    for(const [dx, dy, r] of [[-0.11, -0.32, 0.06], [0, -0.4, 0.075], [0.12, -0.32, 0.06]]){
      ctx.beginPath();
      ctx.arc(x + s*dx, y + s*dy, s*r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#f07a22";
    ctx.beginPath();
    ctx.moveTo(x + s*0.19, y - s*0.03);
    ctx.lineTo(x + s*0.42, y + s*0.04);
    ctx.lineTo(x + s*0.19, y + s*0.12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(111, 74, 25, 0.28)";
    ctx.lineWidth = Math.max(1, s * 0.025);
    ctx.stroke();
    ctx.fillStyle = "#fff5bf";
    ctx.beginPath();
    ctx.ellipse(x - s*0.08, y + s*0.08, s*0.12, s*0.18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    drawTokenEyes(x, y, s, { dx:s*0.075, y:-s*0.08, r:s*0.024, ink:meta.ink, scared: state.scared });
    ctx.restore();
    void targetCtx;
  }

  function renderCowToken(targetCtx, x, y, size, state={}){
    const s = size;
    const meta = VECTOR_TOKEN_META[TILE.COW];
    drawTokenBase(x, y, s, meta, state);
    ctx.save();
    ctx.fillStyle = meta.shade;
    ctx.beginPath();
    ctx.ellipse(x - s*0.16, y - s*0.02, s*0.1, s*0.08, -0.35, 0, Math.PI * 2);
    ctx.ellipse(x + s*0.18, y + s*0.08, s*0.12, s*0.09, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e8d7aa";
    ctx.lineWidth = Math.max(2, s*0.035);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - s*0.18, y - s*0.24);
    ctx.lineTo(x - s*0.28, y - s*0.34);
    ctx.moveTo(x + s*0.18, y - s*0.24);
    ctx.lineTo(x + s*0.28, y - s*0.34);
    ctx.stroke();
    ctx.fillStyle = "#e8c9b4";
    ctx.beginPath();
    ctx.ellipse(x, y + s*0.13, s*0.17, s*0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    drawTokenEyes(x, y, s, { dx:s*0.1, y:-s*0.07, r:s*0.024, ink:meta.ink, scared: state.scared });
    ctx.restore();
    void targetCtx;
  }

  function renderPigToken(targetCtx, x, y, size, state={}){
    const s = size;
    const meta = VECTOR_TOKEN_META[TILE.PIG];
    drawTokenBase(x, y, s, meta, state);
    ctx.save();
    ctx.fillStyle = meta.base;
    ctx.beginPath();
    ctx.moveTo(x - s*0.28, y - s*0.18);
    ctx.lineTo(x - s*0.4, y - s*0.28);
    ctx.lineTo(x - s*0.34, y - s*0.04);
    ctx.moveTo(x + s*0.28, y - s*0.18);
    ctx.lineTo(x + s*0.4, y - s*0.28);
    ctx.lineTo(x + s*0.34, y - s*0.04);
    ctx.fill();
    ctx.fillStyle = meta.accent;
    ctx.beginPath();
    ctx.ellipse(x, y + s*0.08, s*0.18, s*0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = meta.ink;
    ctx.beginPath();
    ctx.arc(x - s*0.055, y + s*0.08, s*0.018, 0, Math.PI * 2);
    ctx.arc(x + s*0.055, y + s*0.08, s*0.018, 0, Math.PI * 2);
    ctx.fill();
    drawTokenEyes(x, y, s, { dx:s*0.1, y:-s*0.08, r:s*0.024, ink:meta.ink, scared: state.scared });
    ctx.restore();
    void targetCtx;
  }

  function renderWolfToken(targetCtx, x, y, size, state={}){
    const s = size;
    const meta = VECTOR_TOKEN_META[TILE.WOLF];
    drawTokenBase(x, y, s, meta, state);
    ctx.save();
    ctx.fillStyle = meta.shade;
    ctx.beginPath();
    ctx.moveTo(x - s*0.22, y - s*0.2);
    ctx.lineTo(x - s*0.34, y - s*0.42);
    ctx.lineTo(x - s*0.08, y - s*0.27);
    ctx.moveTo(x + s*0.22, y - s*0.2);
    ctx.lineTo(x + s*0.34, y - s*0.42);
    ctx.lineTo(x + s*0.08, y - s*0.27);
    ctx.fill();
    ctx.fillStyle = meta.accent;
    ctx.beginPath();
    ctx.moveTo(x, y + s*0.03);
    ctx.lineTo(x + s*0.16, y + s*0.11);
    ctx.lineTo(x, y + s*0.18);
    ctx.lineTo(x - s*0.16, y + s*0.11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#17100c";
    ctx.lineWidth = Math.max(1.4, s*0.025);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - s*0.16, y - s*0.08);
    ctx.lineTo(x - s*0.04, y - s*0.035);
    ctx.moveTo(x + s*0.16, y - s*0.08);
    ctx.lineTo(x + s*0.04, y - s*0.035);
    ctx.moveTo(x - s*0.08, y + s*0.18);
    ctx.quadraticCurveTo(x, y + s*0.25, x + s*0.12, y + s*0.18);
    ctx.stroke();
    ctx.restore();
    void targetCtx;
  }

  const VECTOR_TOKEN_RENDERERS = {
    [TILE.SHEEP]: renderSheepToken,
    [TILE.GOAT]: renderGoatToken,
    [TILE.CHICKEN]: renderChickenToken,
    [TILE.COW]: renderCowToken,
    [TILE.PIG]: renderPigToken,
    [TILE.WOLF]: renderWolfToken,
    [TILE.BLACK_SHEEP]: (targetCtx, x, y, size, state={}) => renderSheepToken(targetCtx, x, y, size, { ...state, blackSheep: true })
  };

  function drawVectorAnimalToken(tile, gx, gy, size, state={}){
    const renderer = VECTOR_TOKEN_RENDERERS[tile];
    if(!renderer) return false;
    const cx = gx + size / 2;
    const cy = gy + size / 2;
    const scale = tokenScaleForState(state);
    const alpha = tokenAlphaForState(state);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    drawTokenShadow(cx, cy, size, state);
    renderer(ctx, cx, cy, size * 0.92, state);
    drawTokenModifierBadges(cx, cy, size, state);
    ctx.restore();
    return true;
  }

  function drawFarmCellState(gx, gy, state={}, opts={}){
    const {
      missionTile = false,
      specialMeta = null
    } = opts;
    const inset = Math.max(2.5, cell * 0.07);
    const x = gx + inset;
    const y = gy + inset;
    const w = cell - inset * 2;
    const h = cell - inset * 2;
    const r = Math.max(6, cell * 0.12);
    const active = state.active || state.falling;
    const ghost = !!state.ghost;
    const clearing = !!state.clearing;
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 125);

    ctx.save();
    if(!active && !ghost && !clearing){
      ctx.restore();
      return;
    }

    if(!ghost){
      ctx.globalAlpha = active ? 0.14 : 0.08;
      roundRectFill(x + cell*0.02, y + cell*0.05, w, h, r, "#0b1207");
    }

    let fill = "rgba(255, 246, 206, 0.045)";
    let stroke = "rgba(239, 226, 171, 0.28)";
    let lineWidth = Math.max(1, cell * 0.018);
    let dashed = false;

    if(ghost){
      fill = V2_GHOST_CELL_FILL;
      stroke = V2_GHOST_CELL_STROKE;
      lineWidth = Math.max(1, cell * V2_GHOST_CELL_LINE_WIDTH);
      dashed = true;
    } else if(clearing){
      fill = `rgba(255, 212, 117, ${0.12 + pulse * 0.1})`;
      stroke = `rgba(255, 235, 173, ${0.56 + pulse * 0.26})`;
      lineWidth = Math.max(1.6, cell * 0.034);
    } else if(active){
      fill = "rgba(255, 232, 153, 0.1)";
      stroke = "rgba(255, 230, 157, 0.64)";
      lineWidth = Math.max(1.5, cell * 0.032);
    }

    ctx.globalAlpha = 1;
    roundRectFill(x, y, w, h, r, fill);
    ctx.strokeStyle = missionTile && !ghost
      ? "rgba(255, 214, 117, 0.78)"
      : stroke;
    ctx.lineWidth = missionTile && !ghost ? Math.max(lineWidth, cell * 0.034) : lineWidth;
    if(dashed) ctx.setLineDash([Math.max(4, cell * 0.16), Math.max(3, cell * 0.1)]);
    roundRectStroke(x, y, w, h, r);
    if(dashed) ctx.setLineDash([]);

    if(specialMeta){
      const badge = Math.max(8, cell * 0.18);
      ctx.globalAlpha = 0.88;
      roundRectFill(gx + cell - badge - inset, gy + inset, badge, badge, Math.max(3, badge * 0.22), specialMeta.accent);
      ctx.fillStyle = "#20140c";
      ctx.font = `900 ${Math.floor(badge * 0.68)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(specialMeta.badge, gx + cell - badge/2 - inset, gy + inset + badge/2 + 1);
    }
    ctx.restore();
  }

  function drawFarmBoardSurface(px){
    const outer = Math.max(12, cell * 0.24);
    const boardW = COLS * cell;
    const boardH = ROWS * cell;
    const frame = ctx.createLinearGradient(0, 0, 0, H);
    frame.addColorStop(0, "#8a5a2e");
    frame.addColorStop(0.45, "#5a371e");
    frame.addColorStop(1, "#2f1e12");

    roundRectFill(0, 0, W, H, 22, "#1f140c");
    ctx.save();
    ctx.globalAlpha = 0.94;
    roundRectFill(px - outer, px - outer, boardW + outer * 2, boardH + outer * 2, 22, frame);
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#f6d49a";
    ctx.lineWidth = Math.max(1, cell * 0.03);
    for(let x=0; x<=COLS; x++){
      const gx = px - outer * 0.5 + x * cell;
      ctx.beginPath();
      ctx.moveTo(gx, px - outer * 0.7);
      ctx.lineTo(gx, px + boardH + outer * 0.7);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.36;
    ctx.lineWidth = Math.max(2, cell * 0.055);
    roundRectStroke(px - outer + 2, px - outer + 2, boardW + outer * 2 - 4, boardH + outer * 2 - 4, 20);
    ctx.restore();

    ctx.save();
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const gx = px + x*cell;
        const gy = px + y*cell;
        const cellGrad = ctx.createLinearGradient(gx, gy, gx, gy + cell);
        const checker = (x + y) % 2;
        cellGrad.addColorStop(0, checker ? "#6f8a49" : "#789553");
        cellGrad.addColorStop(0.62, checker ? "#536d38" : "#5f7a42");
        cellGrad.addColorStop(1, checker ? "#435b31" : "#4c6537");
        roundRectFill(gx+2, gy+2, cell-4, cell-4, Math.max(8, cell * 0.14), cellGrad);
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = "#d9e3a6";
        ctx.lineWidth = Math.max(1, cell * 0.018);
        for(let blade=0; blade<3; blade++){
          const bx = gx + cell * (0.25 + blade * 0.18);
          const by = gy + cell * (0.35 + ((x*7 + y*5 + blade*3) % 5) * 0.08);
          ctx.beginPath();
          ctx.moveTo(bx, by + cell*0.08);
          ctx.quadraticCurveTo(bx + cell*0.03, by, bx + cell*0.08, by - cell*0.07);
          ctx.stroke();
        }
        ctx.globalAlpha = 0.54;
        ctx.strokeStyle = "rgba(239, 226, 171, 0.22)";
        ctx.lineWidth = Math.max(1, cell * 0.022);
        roundRectStroke(gx+2, gy+2, cell-4, cell-4, Math.max(8, cell * 0.14));
        ctx.globalAlpha = 1;
      }
    }

    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = "rgba(245, 225, 177, 0.7)";
    ctx.lineWidth = Math.max(2, cell * 0.04);
    for(let y=1; y<ROWS; y+=3){
      const gy = px + y * cell;
      ctx.beginPath();
      ctx.moveTo(px + cell * 0.08, gy);
      ctx.lineTo(px + boardW - cell * 0.08, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFarmTile(x,y,t,px,withEmoji,state={}){
    const gx = px + x*cell;
    const gy = px + y*cell;
    const specialMeta = SPECIAL_TILE_META[t];
    const missionTile = MISSION_TILES.has(t);
    const base = TILE_COLOR[t] || "#ddd";
    const r = Math.max(9, cell * 0.2);

    if(withEmoji && VECTOR_ANIMAL_TOKENS_ENABLED && isVectorAnimalTile(t)){
      drawFarmCellState(gx, gy, state, { missionTile, specialMeta });
      drawVectorAnimalToken(t, gx, gy, cell, state);
      return;
    }

    ctx.save();
    ctx.globalAlpha = 0.32;
    roundRectFill(gx + cell*0.12, gy + cell*0.16, cell*0.78, cell*0.74, r, "#140b07");
    ctx.globalAlpha = 1;

    const face = ctx.createLinearGradient(gx, gy, gx, gy + cell);
    face.addColorStop(0, "#fff3d5");
    face.addColorStop(0.18, base);
    face.addColorStop(1, "#6f4931");
    roundRectFill(gx+3, gy+2, cell-6, cell-7, r, face);

    ctx.globalAlpha = 0.18;
    roundRectFill(gx+7, gy+7, cell-14, cell-16, Math.max(7, r-3), "#fff8df");
    ctx.globalAlpha = 1;

    ctx.strokeStyle = missionTile ? "rgba(255, 209, 102, 0.98)" : "rgba(48, 26, 16, 0.58)";
    ctx.lineWidth = Math.max(1.5, cell * (missionTile ? 0.07 : 0.045));
    roundRectStroke(gx+3, gy+2, cell-6, cell-7, r);

    if(specialMeta){
      ctx.globalAlpha = 0.18;
      roundRectFill(gx+6, gy+5, cell-12, cell-13, Math.max(7, r-4), specialMeta.accent);
      ctx.globalAlpha = 0.98;
      const badge = Math.max(8, cell * 0.2);
      roundRectFill(gx + cell - badge - cell*0.08, gy + cell*0.08, badge, badge, Math.max(3, badge*0.22), specialMeta.accent);
      ctx.fillStyle = "#1b120d";
      ctx.font = `900 ${Math.floor(cell*0.2)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(specialMeta.badge, gx + cell - badge/2 - cell*0.08, gy + cell*0.08 + badge/2 + 1);
    }

    if(withEmoji && t === TILE.CASHOUT){
      drawCashoutCoin(gx, gy);
      ctx.restore();
      return;
    }

    if(withEmoji && t === TILE.SEEDER_TURD){
      drawTurdGlyph(gx + cell/2, gy + cell/2 + 1, cell * 0.5);
      ctx.restore();
      return;
    }

    if(withEmoji){
      ctx.font = `${Math.floor(cell*0.58)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#1a0e08";
      ctx.fillText(TILE_LABEL[t] || "?", gx + cell/2 + 1, gy + cell/2 + 2);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.fillText(TILE_LABEL[t] || "?", gx + cell/2, gy + cell/2);
    }
    ctx.restore();
  }

  function drawV2FarmOverlay(px, aboveTiles=false){
    ctx.save();
    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const p = overlay[y][x];
        if(p === POWER.NONE) continue;
        const hasTile = board[y][x] !== TILE.EMPTY;
        if(aboveTiles !== hasTile) continue;

        const gx = px + x*cell;
        const gy = px + y*cell;
        const marker = overlayMarkerGeometry(gx, gy, cell, p, { aboveTiles });
        drawPowerMarker(marker.cx, marker.cy, marker.size, p, { aboveTiles });
      }
    }
    ctx.restore();
  }

  function drawHerdCellGroup(px, group, opts={}){
    const {
      fill = "rgba(255, 209, 102, 0.10)",
      stroke = "rgba(255, 209, 102, 0.72)",
      lineWidth = Math.max(2, cell * 0.045)
    } = opts;
    if(!group?.cells?.length) return;

    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    for(const [x, y] of group.cells){
      const gx = px + x*cell;
      const gy = px + y*cell;
      roundRectFill(gx + cell*0.09, gy + cell*0.09, cell*0.82, cell*0.82, Math.max(6, cell*0.13), fill);
      roundRectStroke(gx + cell*0.09, gy + cell*0.09, cell*0.82, cell*0.82, Math.max(6, cell*0.13));
    }
    ctx.restore();
  }

  function drawHerdGroupLabel(px, group, label, opts={}){
    if(!group?.cells?.length || !label) return;
    const {
      fill = "rgba(35, 20, 11, 0.9)",
      text = "#ffe39a"
    } = opts;
    const topY = Math.min(...group.cells.map(([, y]) => y));
    const topCells = group.cells.filter(([, y]) => y === topY);
    const minX = Math.min(...topCells.map(([x]) => x));
    const maxX = Math.max(...topCells.map(([x]) => x));
    const cx = px + ((minX + maxX + 1) * cell) / 2;
    const cy = px + topY * cell + cell * 0.18;
    const fontSize = Math.max(9, Math.floor(cell * 0.17));
    ctx.save();
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const padX = Math.max(8, cell * 0.18);
    const pillW = Math.max(cell * 1.02, ctx.measureText(label).width + padX * 2);
    const pillH = Math.max(15, cell * 0.34);
    ctx.globalAlpha = 0.98;
    roundRectFill(cx - pillW / 2, cy - pillH / 2, pillW, pillH, pillH / 2, fill);
    ctx.strokeStyle = "rgba(255, 238, 182, 0.34)";
    ctx.lineWidth = Math.max(1, cell * 0.018);
    roundRectStroke(cx - pillW / 2, cy - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fillStyle = text;
    ctx.fillText(label, cx, cy + 1);
    ctx.restore();
  }

  function drawV2HerdHints(px, groups=null){
    if(!REFRESH_V2_ENABLED) return;
    const { near, landing } = groups || v2HerdPreviewGroups();
    near.forEach((group) => {
      drawHerdCellGroup(px, group, {
        fill: "rgba(255, 255, 255, 0.035)",
        stroke: "rgba(255, 240, 185, 0.42)",
        lineWidth: Math.max(1.2, cell * 0.022)
      });
    });
    landing.forEach((group) => {
      drawHerdCellGroup(px, group, {
        fill: "rgba(255, 209, 102, 0.1)",
        stroke: "rgba(255, 226, 139, 0.74)",
        lineWidth: Math.max(1.7, cell * 0.034)
      });
    });
  }

  function drawV2HerdHintLabels(px, groups=null){
    if(!REFRESH_V2_ENABLED) return;
    const { near, landing } = groups || v2HerdPreviewGroups();
    near.forEach((group) => {
      const left = ACTIVE_CLEAR_THRESHOLD - group.cells.length;
      if(left <= 2) drawHerdGroupLabel(px, group, `${left} more`);
    });
    landing.forEach((group) => {
      drawHerdGroupLabel(px, group, `${group.cells.length} herd`, {
        fill: "rgba(64, 39, 13, 0.9)",
        text: "#ffeeb7"
      });
    });
  }

  function drawFloatingTile(gx, gy, tile, opts={}){
    const {
      alpha = 1,
      scale = 1,
      state = {}
    } = opts;
    const specialMeta = SPECIAL_TILE_META[tile];
    const missionTile = MISSION_TILES.has(tile);

    if(FARM_BOARD_RENDERER_ENABLED && VECTOR_ANIMAL_TOKENS_ENABLED && isVectorAnimalTile(tile)){
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(gx + cell/2, gy + cell/2);
      ctx.scale(scale, scale);
      ctx.translate(-(gx + cell/2), -(gy + cell/2));
      drawFarmCellState(gx, gy, state);
      drawVectorAnimalToken(tile, gx, gy, cell, state);
      ctx.restore();
      return;
    }

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
        drawFloatingTile(px + fx.x * cell, gy, fx.tile, { alpha, scale, state:{ clearing:true } });
        continue;
      }
      if(fx.type === "preview"){
        const gx = px + fx.x * cell;
        const gy = px + fx.y * cell;
        const pulse = 0.45 + 0.55 * Math.sin(t * Math.PI);
        const accent = TILE_COLOR[fx.toTile] || "#ffd166";

        ctx.save();
        ctx.globalAlpha = 0.22 + pulse * 0.22;
        roundRectFill(gx + 6, gy + 6, cell - 12, cell - 12, 9, "#0b0d14");
        ctx.globalAlpha = 0.46 + pulse * 0.28;
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(2, Math.floor(cell * 0.08));
        roundRectStroke(gx + 5, gy + 5, cell - 10, cell - 10, 9);
        ctx.restore();

        drawFloatingTile(gx, gy, fx.toTile, {
          alpha: 0.34 + pulse * 0.3,
          scale: 0.78 + pulse * 0.08
        });
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

        drawFloatingTile(gx, gy, fx.tile, { alpha: 0.28 + (1 - t) * 0.26, scale: 0.96, state:{ active:true } });
      }
    }
    ctx.restore();
  }

  function drawOverlay(px, aboveTiles=false){
    if(FARM_BOARD_RENDERER_ENABLED){
      drawV2FarmOverlay(px, aboveTiles);
      return;
    }
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

  function drawTile(x,y,t,px,withEmoji,state={}){
    if(FARM_BOARD_RENDERER_ENABLED){
      drawFarmTile(x, y, t, px, withEmoji, state);
      return;
    }
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
        drawTile(x,y,v,px,true, { active: dx === 0 && dy === 0, falling: true });
      }
    }
  }

  function drawV2DropLane(piece, px){
    if(!FARM_BOARD_RENDERER_ENABLED || !piece) return;
    const ghostY = getGhostY(piece);
    if(ghostY <= piece.y) return;
    ctx.save();
    const seen = new Set();
    for(const [x, y, tile] of pieceCellsAt(piece, piece.y)){
      if(!tile) continue;
      const top = Math.max(0, y + 1);
      const bottom = ghostY + (y - piece.y);
      if(bottom <= top) continue;
      const key = `${x}:${top}:${bottom}`;
      if(seen.has(key)) continue;
      seen.add(key);
      const gx = px + x*cell + cell*0.34;
      const gy = px + top*cell + cell*0.08;
      const h = (bottom - top + 1)*cell - cell*0.16;
      const lane = ctx.createLinearGradient(0, gy, 0, gy + h);
      lane.addColorStop(0, `rgba(238, 224, 177, ${V2_DROP_LANE_TOP_ALPHA})`);
      lane.addColorStop(1, `rgba(229, 207, 145, ${V2_DROP_LANE_BOTTOM_ALPHA})`);
      ctx.globalAlpha = 1;
      roundRectFill(gx, gy, cell*0.32, h, cell*0.16, lane);
    }
    ctx.restore();
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

        if(FARM_BOARD_RENDERER_ENABLED){
          ctx.globalAlpha = 1;
          drawFarmCellState(gx, gy, { ghost:true });
          if(VECTOR_ANIMAL_TOKENS_ENABLED && isVectorAnimalTile(v)){
            drawVectorAnimalToken(v, gx, gy, cell, { ghost:true });
          }
          if(!(VECTOR_ANIMAL_TOKENS_ENABLED && isVectorAnimalTile(v))){
            ctx.globalAlpha = 0.1;
            roundRectFill(gx+4, gy+5, cell-8, cell-10, Math.max(9, cell*0.2), "#120905");
            ctx.globalAlpha = 0.34;
            ctx.strokeStyle = "rgba(238, 226, 184, 0.5)";
            ctx.lineWidth = Math.max(1, Math.floor(cell*0.026));
            ctx.setLineDash([Math.max(4, cell * 0.16), Math.max(3, cell * 0.1)]);
            roundRectStroke(gx+5, gy+4, cell-10, cell-10, Math.max(9, cell*0.2));
            ctx.setLineDash([]);
          }
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = 0.12;
          roundRectFill(gx+3, gy+3, cell-6, cell-6, 10, "#000");
          ctx.globalAlpha = 0.22;
          ctx.strokeStyle = "rgba(255,255,255,0.55)";
          ctx.lineWidth = Math.max(1, Math.floor(cell*0.055));
          roundRectStroke(gx+3, gy+3, cell-6, cell-6, 10);
        }
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

  function computeShareViewport(snapshot, cols=SHARE_GRID_COLS, rows=SHARE_GRID_ROWS){
    const viewport = { left:0, top:0, cols:Math.min(cols, COLS), rows:Math.min(rows, ROWS) };
    let minX = COLS;
    let minY = ROWS;
    let maxX = -1;
    let maxY = -1;

    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        if(
          snapshot.board[y][x] !== TILE.EMPTY ||
          snapshot.overlay[y][x] !== POWER.NONE ||
          snapshot.rewardMap[y][x] ||
          snapshot.productMap[y][x]
        ){
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if(maxX < 0 || maxY < 0){
      viewport.left = Math.max(0, Math.floor((COLS - viewport.cols) / 2));
      viewport.top = Math.max(0, Math.floor((ROWS - viewport.rows) / 2));
      return viewport;
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    viewport.left = clamp(Math.round(centerX - (viewport.cols - 1) / 2), 0, Math.max(0, COLS - viewport.cols));
    viewport.top = clamp(Math.round(centerY - (viewport.rows - 1) / 2), 0, Math.max(0, ROWS - viewport.rows));
    return viewport;
  }

  function drawShareOverlay(targetCtx, snapshot, bx, by, tileSize, aboveTiles=false, viewport={ left:0, top:0, cols:COLS, rows:ROWS }){
    targetCtx.save();
    for(let vy=0;vy<viewport.rows;vy++){
      for(let vx=0;vx<viewport.cols;vx++){
        const x = viewport.left + vx;
        const y = viewport.top + vy;
        const power = snapshot.overlay[y][x];
        if(power === POWER.NONE) continue;
        const hasTile = snapshot.board[y][x] !== TILE.EMPTY;
        if(aboveTiles !== hasTile) continue;
        const gx = bx + vx * tileSize;
        const gy = by + vy * tileSize;
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

  function drawShareRewardMarkers(targetCtx, snapshot, bx, by, tileSize, viewport={ left:0, top:0, cols:COLS, rows:ROWS }){
    targetCtx.save();
    for(let vy=0;vy<viewport.rows;vy++){
      for(let vx=0;vx<viewport.cols;vx++){
        const x = viewport.left + vx;
        const y = viewport.top + vy;
        if(!snapshot.rewardMap[y][x]) continue;
        const gx = bx + vx * tileSize;
        const gy = by + vy * tileSize;
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

  function drawShareProductTags(targetCtx, snapshot, bx, by, tileSize, viewport={ left:0, top:0, cols:COLS, rows:ROWS }){
    targetCtx.save();
    for(let vy=0;vy<viewport.rows;vy++){
      for(let vx=0;vx<viewport.cols;vx++){
        const x = viewport.left + vx;
        const y = viewport.top + vy;
        const token = snapshot.productMap[y][x];
        if(!token) continue;
        const info = snapshot.productTokenInfo.get(token);
        if(!info) continue;
        const gx = bx + vx * tileSize;
        const gy = by + vy * tileSize;
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

  function drawShareBoard(targetCtx, snapshot, bx, by, tileSize, viewport={ left:0, top:0, cols:COLS, rows:ROWS }){
    for(let vy=0;vy<viewport.rows;vy++){
      for(let vx=0;vx<viewport.cols;vx++){
        const gx = bx + vx * tileSize;
        const gy = by + vy * tileSize;
        targetCtx.globalAlpha = 0.26;
        targetCtx.fillStyle = "#f5f7fb";
        targetCtx.fillRect(gx+2, gy+2, tileSize-4, tileSize-4);
        targetCtx.globalAlpha = 1;
      }
    }
    drawShareOverlay(targetCtx, snapshot, bx, by, tileSize, false, viewport);
    for(let vy=0;vy<viewport.rows;vy++){
      for(let vx=0;vx<viewport.cols;vx++){
        const x = viewport.left + vx;
        const y = viewport.top + vy;
        const tile = snapshot.board[y][x];
        if(tile !== TILE.EMPTY) drawShareTile(targetCtx, bx + vx * tileSize, by + vy * tileSize, tileSize, tile);
      }
    }
    drawShareRewardMarkers(targetCtx, snapshot, bx, by, tileSize, viewport);
    drawShareProductTags(targetCtx, snapshot, bx, by, tileSize, viewport);
    drawShareOverlay(targetCtx, snapshot, bx, by, tileSize, true, viewport);
  }

  function drawShareWolfBadge(targetCtx, cx, cy, size){
    const radius = size / 2;
    const gradient = targetCtx.createRadialGradient(cx - size * 0.18, cy - size * 0.22, size * 0.08, cx, cy, radius);
    gradient.addColorStop(0, "#ffddad");
    gradient.addColorStop(0.18, "#c39b68");
    gradient.addColorStop(0.62, "#6a7384");
    gradient.addColorStop(1, "#232731");

    targetCtx.save();
    targetCtx.shadowColor = "rgba(0,0,0,0.32)";
    targetCtx.shadowBlur = size * 0.2;
    targetCtx.shadowOffsetY = size * 0.08;
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    targetCtx.fillStyle = gradient;
    targetCtx.fill();
    targetCtx.restore();

    targetCtx.save();
    targetCtx.strokeStyle = "rgba(255,255,255,0.14)";
    targetCtx.lineWidth = Math.max(2, size * 0.05);
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius - 1, 0, Math.PI * 2);
    targetCtx.stroke();

    targetCtx.font = `900 ${Math.floor(size * 0.72)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    targetCtx.textAlign = "center";
    targetCtx.textBaseline = "middle";
    targetCtx.fillText("🐺", cx, cy + size * 0.04);

    targetCtx.strokeStyle = "rgba(24,17,15,0.94)";
    targetCtx.lineWidth = Math.max(3, size * 0.07);
    targetCtx.lineCap = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(cx - size * 0.24, cy - size * 0.2);
    targetCtx.lineTo(cx - size * 0.04, cy - size * 0.11);
    targetCtx.moveTo(cx + size * 0.24, cy - size * 0.2);
    targetCtx.lineTo(cx + size * 0.04, cy - size * 0.11);
    targetCtx.stroke();
    targetCtx.restore();
  }

  async function buildShareImageBlob(){
    const snapshot = shareSnapshot || captureShareSnapshot();
    const card = document.createElement("canvas");
    card.width = 1080;
    card.height = 1110;
    const targetCtx = card.getContext("2d");

    const bg = targetCtx.createLinearGradient(0, 0, 0, card.height);
    bg.addColorStop(0, "#0b0b10");
    bg.addColorStop(0.55, "#060608");
    bg.addColorStop(1, "#040405");
    targetCtx.fillStyle = bg;
    targetCtx.fillRect(0, 0, card.width, card.height);

    const outerPad = 40;
    roundRectFillFor(targetCtx, outerPad, outerPad, card.width - outerPad*2, card.height - outerPad*2, 28, "rgba(9, 9, 14, 0.92)");
    roundRectStrokeFor(targetCtx, outerPad, outerPad, card.width - outerPad*2, card.height - outerPad*2, 28, "rgba(255,255,255,0.07)", 2);

    const missionBonus = mission && mission.done ? mission.cashBonus : 0;
    const groupScore = Math.max(0, score|0);
    const totalScore = groupScore + missionBonus;
    const shareViewport = computeShareViewport(snapshot);
    const boardWrapX = outerPad;
    const boardWrapY = 350;
    const boardWrapW = card.width - boardWrapX * 2;
    const boardWrapH = card.height - boardWrapY - 96;
    const boardCell = Math.floor(Math.min((boardWrapW - 32) / shareViewport.cols, (boardWrapH - 32) / shareViewport.rows));
    const boardPixelW = boardCell * shareViewport.cols;
    const boardPixelH = boardCell * shareViewport.rows;
    const boardX = Math.floor(boardWrapX + (boardWrapW - boardPixelW) / 2);
    const boardY = Math.floor(boardWrapY + (boardWrapH - boardPixelH) / 2);
    const contentX = boardX;
    const badgeSize = 64;
    const titleY = 116;

    drawShareWolfBadge(targetCtx, contentX + badgeSize / 2, titleY - 8, badgeSize);

    targetCtx.fillStyle = "#f2ede2";
    targetCtx.font = "900 54px system-ui, -apple-system, sans-serif";
    targetCtx.textAlign = "left";
    targetCtx.fillText("Angry Wolves", contentX + badgeSize + 18, titleY);

    targetCtx.fillStyle = "#ffd166";
    targetCtx.font = "900 38px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(shareMissionStatus(), contentX, 178);

    targetCtx.fillStyle = "#f2ede2";
    targetCtx.font = "700 30px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(mission?.title ?? snapshot.missionTitle ?? "Barn Trouble", contentX, 226);

    targetCtx.fillStyle = "#ffd166";
    targetCtx.font = "900 34px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(`${groupScore} group + ${missionBonus} bonus = ${totalScore}`, contentX, 274);

    targetCtx.fillStyle = "#b9af9f";
    targetCtx.font = "600 22px system-ui, -apple-system, sans-serif";
    targetCtx.fillText(`Pace ${level} · Groups ${herdsCleared} · Best chain ${fmtChain(bestCombo)}`, contentX, 314);
    targetCtx.fillText(bestGroupPlain(bestHerd), contentX, 344);

    roundRectFillFor(targetCtx, boardWrapX, boardWrapY, boardWrapW, boardWrapH, 24, "#050507");
    roundRectStrokeFor(targetCtx, boardWrapX, boardWrapY, boardWrapW, boardWrapH, 24, "rgba(255,255,255,0.06)", 2);
    drawShareBoard(targetCtx, snapshot, boardX, boardY, boardCell, shareViewport);

    targetCtx.fillStyle = "#7dd3fc";
    targetCtx.font = "700 22px system-ui, -apple-system, sans-serif";
    targetCtx.textAlign = "center";
    targetCtx.fillText(`Play it here: ${shareUrl()}`, card.width / 2, card.height - 42);

    return await new Promise((resolve, reject) => {
      card.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not build share image.")), "image/jpeg", 0.9);
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
    const text = shareTextBody();
    const url = shareUrl();

    if(shareButton) shareButton.disabled = true;
    try{
      if(navigator.share){
        let file = null;
        try{
          const blob = await buildShareImageBlob();
          file = new File([blob], "angry-wolves-result.jpg", { type: blob.type || "image/jpeg" });
        }catch{}

        const shareAttempts = [];
        if(file && (!navigator.canShare || navigator.canShare({ files: [file] }))){
          shareAttempts.push(() => navigator.share({ title, text, url, files: [file] }));
          shareAttempts.push(() => navigator.share({ title, text, files: [file] }));
          shareAttempts.push(() => navigator.share({ title, url, files: [file] }));
          shareAttempts.push(() => navigator.share({ title, files: [file] }));
        }
        shareAttempts.push(() => navigator.share({ title, text, url }));
        shareAttempts.push(() => navigator.share({ title, text }));
        shareAttempts.push(() => navigator.share({ title, url }));

        for(const attempt of shareAttempts){
          try{
            await attempt();
            return;
          }catch(err){
            if(err && err.name === "AbortError") return;
          }
        }
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
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const px = pad*dpr;
    const herdHintGroups = REFRESH_V2_ENABLED ? v2HerdPreviewGroups() : null;
    const herdHintLookup = REFRESH_V2_ENABLED ? v2HerdHintLookup(herdHintGroups) : null;

    if(FARM_BOARD_RENDERER_ENABLED){
      drawFarmBoardSurface(px);
    } else {
      roundRectFill(0,0,W,H,18, "#050507");

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
    }

    drawV2HerdHints(px, herdHintGroups);

    drawOverlay(px, false);

    for(let y=0;y<ROWS;y++){
      for(let x=0;x<COLS;x++){
        const t = board[y][x];
        if(t !== TILE.EMPTY) drawTile(x,y,t,px,true, v2TileState(x, y, herdHintLookup));
      }
    }

    drawRewardPulse(px);
    drawProductTags(px);

    drawOverlay(px, true);
    drawBoardAnimations(px);

    if(current && !paused){
      const gy = getGhostY(current);
      drawV2DropLane(current, px);
      drawShadow(current, 0, gy-current.y, px);
    }
    if(current) drawPiece(current,0,0,px);
    drawV2HerdHintLabels(px, herdHintGroups);

    stepParticles();
    drawParticles();

    if(shouldDrawRunEndPulse()){
      const pulse = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(performance.now() / 240));
      const panelW = Math.min(W * 0.84, 520 * dpr);
      const panelH = 94 * dpr;
      const panelX = Math.floor((W - panelW) / 2);
      const panelY = Math.floor((H - panelH) / 2);
      ctx.save();
      ctx.globalAlpha = 0.76;
      roundRectFill(panelX, panelY, panelW, panelH, 16 * dpr, "rgba(5,5,10,0.88)");
      ctx.globalAlpha = pulse;
      roundRectStroke(panelX, panelY, panelW, panelH, 16 * dpr, "rgba(255, 209, 102, 0.92)", Math.max(2, Math.floor(3 * dpr)));
      ctx.fillStyle = "#f2ede2";
      ctx.font = `900 ${Math.floor(26 * dpr)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(runEndTitle || "Game Over", W / 2, panelY + panelH * 0.42);
      ctx.fillStyle = `rgba(125, 211, 252, ${0.8 + 0.2 * pulse})`;
      ctx.font = `700 ${Math.floor(13 * dpr)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(runEndPulseLine(), W / 2, panelY + panelH * 0.72);
      ctx.restore();
    }

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
    if(!USE_DOUBLE_TAP_SWAP) return;
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
      if(drift > TOUCH_HOLD_CANCEL_PX || gesture.rotated) return;
      holdCurrent();
      gesture = null;
      holdTouchTimer = null;
      draw();
    }, TOUCH_HOLD_SWAP_MS);
  }

  // ===== Tap/Swipe behavior =====
  // Tap: move only (left/right half)
  // Tap Next: swap current piece with next
  // Press and hold stays as touch fallback
  // Swipe straight-ish up on left/right half: rotate only
  function onPointerDown(e){
    e.preventDefault();
    unlockAudioSilently();
    const now = performance.now();
    const touchLike = e.pointerType === "touch" || e.pointerType === "pen" || (!e.pointerType && IS_TOUCH);
    flushPendingTap(now);
    const priorTap = USE_DOUBLE_TAP_SWAP && touchLike && pendingTap && (now - pendingTap.t) < DOUBLE_TAP_MS ? pendingTap : null;
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
    const rotateIntent = upDist >= 8 && rotateAngle <= TOUCH_ROTATE_INTENT_ANGLE;
    if(Math.hypot(totalDx, totalDy) > TOUCH_HOLD_CANCEL_PX) clearHoldTouchTimer();

    if(!rotateIntent){
      while(gesture.movedX <= -TOUCH_MOVE_STEP_X){ move(-1); gesture.movedX += TOUCH_MOVE_STEP_X; }
      while(gesture.movedX >=  TOUCH_MOVE_STEP_X){ move( 1); gesture.movedX -= TOUCH_MOVE_STEP_X; }
      while(gesture.movedY >=  TOUCH_MOVE_STEP_Y){ dropOne(); gesture.movedY -= TOUCH_MOVE_STEP_Y; }
    }

    if(!gesture.rotated && upDist >= TOUCH_ROTATE_SWIPE_MIN && rotateAngle <= TOUCH_ROTATE_ANGLE_MAX){
      const rect = canvas.getBoundingClientRect();
      const rotateCWFromHalf = gesture.startX >= rect.left + rect.width / 2;
      const rotated = rotate(rotateCWFromHalf);
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
      if(dt < TOUCH_TAP_MAX_MS && dist < 10 && !rotated) executeTapMove(e.clientX);
      gesture = null;
      return;
    }

    if(dt < TOUCH_TAP_MAX_MS && dist < 10 && !rotated){
      if(USE_DOUBLE_TAP_SWAP){
        if(priorTap && Math.hypot(e.clientX - priorTap.x, e.clientY - priorTap.y) <= DOUBLE_TAP_SLOP){
          holdCurrent();
        } else {
          pendingTap = { x: e.clientX, y: e.clientY, t: performance.now() };
        }
      } else {
        executeTapMove(e.clientX);
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
    if(USE_DOUBLE_TAP_SWAP && gesture?.priorTap){
      pendingTap = gesture.priorTap;
      flushPendingTap(performance.now());
    }
    gesture = null;
  });
  window.addEventListener("pointerdown", unlockAudioSilently, {passive:true});
  window.addEventListener("pointerup", safeResumeAudioFromGesture, {passive:true});
  window.addEventListener("touchstart", unlockAudioSilently, {passive:true});
  window.addEventListener("click", unlockAudioSilently, {passive:true});
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible"){
      if(USE_IOS_AUDIO_RESUME_FIXES) nudgeAudioWake();
      else unlockAudioSilently();
    }
  });
  if(USE_IOS_AUDIO_RESUME_FIXES){
    window.addEventListener("pageshow", nudgeAudioWake, {passive:true});
    window.addEventListener("focus", nudgeAudioWake, {passive:true});
    window.addEventListener("pagehide", () => {
      audioPrimeOnResume = false;
      pendingAudioResume = null;
    }, {passive:true});
  }

  // ===== Keyboard (non-touch) =====
  if(!IS_TOUCH){
    window.addEventListener("keydown", (e) => {
      unlockAudioSilently();
      if(gameOver) return;
      const k = e.key;
      const lk = k.toLowerCase();
      if(["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," "].includes(k)) e.preventDefault();

      if(lk === "p"){ manualPaused = !manualPaused; updateHUD(); draw(); return; }
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

  function applyRefreshV2Shell(){
    document.documentElement.classList.toggle("refreshV2", REFRESH_V2_ENABLED);
    document.body.classList.toggle("refreshV2", REFRESH_V2_ENABLED);
    if(!REFRESH_V2_ENABLED) return;
    const subtitle = document.querySelector(".title .sub");
    if(subtitle) subtitle.textContent = `Build ${ACTIVE_CLEAR_THRESHOLD}+ herds. Gravity makes chains.`;
  }

  // ===== Tighten the on-page help line without touching the rest of the app =====
  function patchHelpLine(){
    const helpPrimary = document.querySelector("#help > div:first-child");
    if(helpPrimary){
      helpPrimary.innerHTML = USE_NEW_TOUCH_CONTROLS
        ? "<b>Touch:</b> tap side = ←/→ · drag = steer/drop · swipe ↑ left/right = ↺/↻ · tap Next = swap"
        : "<b>Touch:</b> tap side = ←/→ · drag = steer/drop · swipe ↑ left/right = ↺/↻ · double tap or hold = swap";
    }
    if(REFRESH_V2_ENABLED){
      const helpFoldByTitle = (title) => Array.from(document.querySelectorAll(".helpFold"))
        .find((fold) => fold.querySelector("summary")?.textContent?.trim() === title);
      const coreFold = helpFoldByTitle("Core Loop")?.querySelector(".helpFoldBody");
      if(coreFold){
        coreFold.innerHTML = `
          <div class="helpMiniDiagram" aria-hidden="true">
            <span>🐑</span><span>🐑</span><span>🐑</span><span>+</span><span>⬇</span><span>=</span><span>🪙</span>
          </div>
          <p class="helpText">Make <b>${ACTIVE_CLEAR_THRESHOLD}+</b> matching animals touch. That clears a herd for coins.</p>
          <p class="helpText">Bigger herd = more coins. Gravity can drop animals into a new herd for a chain bonus.</p>
          <p class="helpText">🥚 boosts a herd. 💩 turds trim herd coins.</p>
          <p class="helpText">Wolf mud splats eat one falling tile, then disappear.</p>
        `;
      }
      const missionFold = helpFoldByTitle("Missions")?.querySelector(".helpFoldBody");
      if(missionFold){
        missionFold.innerHTML = `
          <p class="helpText">The strip above the board shows one tiny job. Finish it, then cash the reward herd.</p>
          <p class="helpText">Early missions stay simple. Wolf nonsense arrives later, because manners.</p>
          <p class="helpText"><b>Egg Basket</b> plants 4 eggs. <b>Muck Wagon</b> drops 3 turds.</p>
          <p class="helpText">Special pieces always appear in the real <b>Next</b> tray.</p>
        `;
      }
      const scoringFold = helpFoldByTitle("Scoring And Multipliers")?.querySelector(".helpFoldBody");
      if(scoringFold){
        scoringFold.innerHTML = `
          <p class="helpText">Each animal in a cleared herd is worth <b>${V2_HERD_SCORE_PER_TILE}</b> coins. Bigger-than-${ACTIVE_CLEAR_THRESHOLD} herds add a modest size bonus.</p>
          <p class="helpText">🥚 adds +${Math.round(V2_EGG_MULTIPLIER_PER_EGG * 100)}% each, capped at ${Math.round((1 + V2_EGG_MULTIPLIER_CAP_EGGS * V2_EGG_MULTIPLIER_PER_EGG) * 100)}%. No egg jackpots from outer space.</p>
          <p class="helpText">Turds shave the payout, but they will not erase the whole herd.</p>
          <p class="helpText">Chains add a separate bounded combo bonus. Angry Wolves is the rare big payout.</p>
        `;
      }
    }
  }

  function syncSwapHints(){
    if(nextCardHintEl){
      nextCardHintEl.textContent = IS_TOUCH
        ? (USE_NEW_TOUCH_CONTROLS ? "Tap to swap" : "Double tap to swap")
        : "Click to swap";
    }
    if(holdButtonHintEl){
      holdButtonHintEl.textContent = IS_TOUCH
        ? (USE_NEW_TOUCH_CONTROLS ? "Tap Next or hold" : "Double tap or hold")
        : "Click here, tap Next, or press C";
    }
  }

  // ===== Settings toggle (simple) =====
  function syncSoundBtn(){
    if(soundToggle) soundToggle.textContent = soundOn ? "ON" : "OFF";
    if(goofyToggle) goofyToggle.textContent = goofyAnimalSounds ? "ON" : "OFF";
    if(sfxVolumeInput) sfxVolumeInput.value = String(Math.round(sfxVolume * 100));
    if(sfxVolumeValueEl) sfxVolumeValueEl.textContent = `${Math.round(sfxVolume * 100)}%`;
  }
  if(gear){
    gear.addEventListener("click", openSettings);
  }
  if(leaderboardButton){
    leaderboardButton.addEventListener("click", openLeaderboard);
  }
  if(helpButton){
    helpButton.addEventListener("click", openHelp);
  }
  if(missionBriefHelpButton){
    missionBriefHelpButton.hidden = !USE_BRIEF_HELP_SHORTCUT;
    if(USE_BRIEF_HELP_SHORTCUT){
      missionBriefHelpButton.addEventListener("click", openHelp);
    }
  }
  if(wolfHowlButton){
    let lastWolfHowlTap = 0;
    const onHowlTap = (e) => {
      if(e?.cancelable) e.preventDefault();
      const now = performance.now();
      if(now - lastWolfHowlTap < 420) return;
      lastWolfHowlTap = now;
      playWolfHowl({ style:"tap", intensity:0.9, source:"badge", fromGesture:true, animateBadge:true });
    };
    wolfHowlButton.addEventListener("pointerdown", onHowlTap, {passive:false});
    wolfHowlButton.addEventListener("touchstart", onHowlTap, {passive:false});
    wolfHowlButton.addEventListener("click", onHowlTap, {passive:false});
  }
  if(testSoundButton){
    let lastTestSoundTap = 0;
    const onTap = (e) => {
      if(e?.cancelable) e.preventDefault();
      const now = performance.now();
      if(now - lastTestSoundTap < 420) return;
      lastTestSoundTap = now;
      playAudioTestCueFromGesture();
    };
    testSoundButton.addEventListener("pointerdown", onTap, {passive:false});
    testSoundButton.addEventListener("touchstart", onTap, {passive:false});
    testSoundButton.addEventListener("click", onTap, {passive:false});
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
    return !!(target instanceof Element && target.closest(".helpScroll, .leaderboardList, .missionDrawer"));
  }
  if(IS_TOUCH){
    document.addEventListener("touchmove", (e) => {
      if(!e.cancelable) return;
      if(canTouchScroll(e.target)) return;
      e.preventDefault();
    }, { passive:false, capture:true });

    let lastTouchEnd = 0;
    document.addEventListener("touchend", (e) => {
      if(!e.cancelable) return;
      const now = performance.now();
      if((now - lastTouchEnd) < 320){
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive:false, capture:true });

    document.addEventListener("gesturestart", (e) => {
      if(e.cancelable) e.preventDefault();
    }, { passive:false, capture:true });

    document.addEventListener("gesturechange", (e) => {
      if(e.cancelable) e.preventDefault();
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
  if(leaderboardBackdrop){
    leaderboardBackdrop.addEventListener("click", (e) => {
      if(e.target === leaderboardBackdrop) closeLeaderboard();
    });
  }
  if(shareButton){
    shareButton.addEventListener("click", shareResults);
  }
  if(closeLeaderboardButton){
    closeLeaderboardButton.addEventListener("click", closeLeaderboard);
  }
  if(leaderboardOpenPreviewButton){
    leaderboardOpenPreviewButton.addEventListener("click", openLeaderboard);
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
  if(missionDrawerToggle){
    missionDrawerToggle.addEventListener("click", () => {
      if(missionDrawerOpen && runStarted) setMissionDrawerOpen(false);
      else openMissionDrawer();
    });
  }
  if(missionDrawerActionButton){
    missionDrawerActionButton.addEventListener("click", closeMissionDrawerAndMaybeStart);
  }
  if(missionDrawerHelpButton){
    missionDrawerHelpButton.addEventListener("click", openHelp);
  }
  if(scoreNameInputEl){
    scoreNameInputEl.value = loadStoredLeaderboardName();
    scoreNameInputEl.addEventListener("input", () => {
      const clean = sanitizeLeaderboardName(scoreNameInputEl.value);
      if(clean !== scoreNameInputEl.value) scoreNameInputEl.value = clean;
      if(leaderboardSubmitTone === "error"){
        setSubmitStatus("", "");
        syncScoreSubmissionUI();
      }
    });
    scoreNameInputEl.addEventListener("keydown", (e) => {
      if(e.key !== "Enter") return;
      e.preventDefault();
      submitCurrentScore();
    });
  }
  if(scoreSubmitButton){
    scoreSubmitButton.addEventListener("click", submitCurrentScore);
  }
  if(scoreSkipButton){
    scoreSkipButton.addEventListener("click", dismissCurrentScoreSubmission);
  }
  if(holdButton){
    holdButton.addEventListener("click", holdCurrent);
  }
  if(nextCardEl){
    nextCardEl.addEventListener("click", holdCurrent);
  }
  if(soundToggle){
    let lastSoundToggleTap = 0;
    const onTap = (e) => {
      e.preventDefault();
      const now = performance.now();
      if(now - lastSoundToggleTap < 380) return;
      lastSoundToggleTap = now;
      soundOn = !soundOn;
      if(soundOn){
        ensureAudibleSfxDefaultIfMissing();
      }
      saveSoundPref();
      syncMasterGain();
      if(soundOn){
        unlockAudioSilently();
        if(!playGameEventSound("ui_button_tap")) playRotateTick();
        Promise.resolve(safeResumeAudioFromGesture()).then((running) => {
          if(running) playMoveTick();
        });
      }
      syncSoundBtn();
      // if user turns it ON, it will unlock on the next touch
    };
    soundToggle.addEventListener("click", onTap, {passive:false});
    soundToggle.addEventListener("touchend", onTap, {passive:false});
  }
  if(sfxVolumeInput){
    sfxVolumeInput.addEventListener("input", () => {
      sfxVolume = clamp(Number(sfxVolumeInput.value) / 100, 0, 1);
      saveSfxVolumePref();
      syncMasterGain();
      if(audioDirector?.syncVolumes) audioDirector.syncVolumes();
      syncSoundBtn();
      audioDebugLog("sfx:input");
    });
    sfxVolumeInput.addEventListener("change", () => {
      safeResumeAudioFromGesture();
      playGameEventSound("ui_button_tap");
    });
  }
  if(goofyToggle){
    let lastGoofyToggleTap = 0;
    const onTap = (e) => {
      e.preventDefault();
      const now = performance.now();
      if(now - lastGoofyToggleTap < 380) return;
      lastGoofyToggleTap = now;
      goofyAnimalSounds = !goofyAnimalSounds;
      saveGoofyAnimalPref();
      safeResumeAudioFromGesture();
      syncSoundBtn();
      if(goofyAnimalSounds) animalVoice(TILE.PIG, "toggle", 0.8);
      else playGameEventSound("ui_button_tap");
    };
    goofyToggle.addEventListener("click", onTap, {passive:false});
    goofyToggle.addEventListener("touchend", onTap, {passive:false});
  }

  // ===== Game loop =====
  function tick(now){
    requestAnimationFrame(tick);
    if(!lastFrameTime) lastFrameTime = now;
    const dt = Math.min(50, now - lastFrameTime);
    lastFrameTime = now;
    flushPendingTap(now);
    stepBoardAnimations(now);
    stepBoardAudioCues(now);
    if(paused || gameOver){
      if(particles.length || boardAnimations.length || (mission && mission.ready && !mission.done && hasRewardCoinOnBoard()) || pendingGameOverRevealTimer){
        draw();
      }
      return;
    }

    if(!current && nextSpawnAt && now >= nextSpawnAt){
      nextSpawnAt = 0;
      spawnNext();
      draw();
      return;
    }
    if(!current){
      if(particles.length || boardAnimations.length || (mission && mission.ready && !mission.done && hasRewardCoinOnBoard())){
        draw();
      }
      return;
    }

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
    if(USE_IOS_AUDIO_RESUME_FIXES) unlockAudioSilently();
    if(pendingGameOverRevealTimer){
      clearTimeout(pendingGameOverRevealTimer);
      pendingGameOverRevealTimer = 0;
    }
    clearHoldTouchTimer();
    gesture = null;
    board = makeBoard();
    sprinkleOverlayGeometric();
    applyDebugBoardPreset();
    clearRewardMap();
    clearProductMarks();
    mission = newMission();
    missionSpecialCharge = 0;
    missionSpecialPending = false;
    queuedMissionSpecial = null;
    cashoutCharge = 0;
    rewardCountdown = null;
    runEndTitle = "Run Over 🐺";
    runEndNote = "The barn got crowded.";
    score=0; level=1; locks=0; herdsCleared=0;
    bestHerd = null;
    held=null; currentCombo=0; bestCombo=0; holdUsed=false;
    fallInterval = BASE_FALL_MS;
    fallTimer = 0;
    nextSpawnAt = 0;
    rotateSlowUntil = 0;
    rotateSlowUses = 4;
    ambienceClock = 0;
    paused=false; gameOver=false;
    current=null; next=null;
    particles=[]; boardAnimations=[]; boardAudioCues=[]; banner={text:"",t:0,ttl:900};
    pendingTap = null;
    lastMissionMeterAudio = null;
    runEndPulseActive = false;
    runStarted = !REFRESH_V2_ENABLED;
    manualPaused = false;
    missionDrawerOpen = false;
    resetRunLeaderboardState();
    setOverlayOpen(modalBackdrop, false);
    setOverlayOpen(gameOverBackdrop, false);
    setOverlayOpen(leaderboardBackdrop, false);
    setOverlayOpen(missionBriefBackdrop, false);
    primeDebugMissionSpecial();
    next = newPiece();
    spawnNext();
    rememberShareSnapshot();
    updateHUD();
    if(REFRESH_V2_ENABLED){
      showToast(`Review the barn job, then tap Start.`, 2200);
      setMissionDrawerOpen(true);
    } else {
      openMissionBriefing();
    }
    draw();
  }

  // ===== Init =====
  function init(){
    injectViewportCSS();
    applyRefreshV2Shell();
    patchHelpLine();
    syncSwapHints();
    installToastObserver();
    ensureAudio();
    syncMasterGain();
    renderHelpSpecials();

    sprinkleOverlayGeometric();
    applyDebugBoardPreset();
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
    boardAudioCues = [];
    nextSpawnAt = 0;
    pendingGameOverRevealTimer = 0;
    runEndPulseActive = false;
    runStarted = !REFRESH_V2_ENABLED;
    manualPaused = false;
    missionDrawerOpen = false;
    resetRunLeaderboardState();

    primeDebugMissionSpecial();
    next = newPiece();
    spawnNext();
    rememberShareSnapshot();

    updateHUD();
    syncSoundBtn();
    updateGameOverStats();
    refreshLeaderboard({ force: true });
    debugScoreSamples();
    if(REFRESH_V2_ENABLED){
      showToast(`Review the barn job, then tap Start.`, 2200);
      setMissionDrawerOpen(true);
    } else {
      openMissionBriefing();
    }

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
