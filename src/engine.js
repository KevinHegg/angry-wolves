import { ANIMALS, CLEAR_SIZE, COLS, NIGHTS, ROWS, THREATS } from "./content.js";

export const MODES = Object.freeze({ MAP: "map", PLAYING: "playing", TOOL_CHOICE: "tool-choice", NIGHT_COMPLETE: "night-complete", GAME_OVER: "game-over" });
const EMPTY = null;
const SHAPES = [
  [[1, 1], [1, 1]],
  [[1, 1, 1]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[0, 1, 1], [1, 1, 0]]
];
const ANIMAL_IDS = Object.keys(ANIMALS);

export function emptyGrid(value = EMPTY) {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(value));
}

function cloneGrid(grid) { return grid.map((row) => row.slice()); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function hashSeed(raw) {
  const text = String(raw || "moonlit-rescue");
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0 || 1;
}
function nextRandom(state) {
  state.rng = (Math.imul(1664525, state.rng) + 1013904223) >>> 0;
  return state.rng / 4294967296;
}
function pick(state, values) { return values[Math.floor(nextRandom(state) * values.length)]; }
function shuffled(state, values) {
  const copy = values.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRandom(state) * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function pushEvent(state, type, detail = {}) {
  state.events.push({ type, ...detail });
  if (state.events.length > 12) state.events.shift();
}
function centerX(matrix) { return Math.floor((COLS - matrix[0].length) / 2); }
function rotateMatrix(matrix) { return matrix[0].map((_, x) => matrix.map((row) => row[x]).reverse()); }
function makePiece(state, forcedAnimal = null, forcedShape = null) {
  const animal = forcedAnimal || (nextRandom(state) < 0.57 ? currentCall(state).animal : pick(state, ANIMAL_IDS));
  const matrix = (forcedShape || pick(state, SHAPES)).map((row) => row.slice());
  return { animal, matrix, x: centerX(matrix), y: 0 };
}
function occupiedCells(piece) {
  const cells = [];
  piece.matrix.forEach((row, rowIndex) => row.forEach((filled, colIndex) => {
    if (filled) cells.push([piece.x + colIndex, piece.y + rowIndex]);
  }));
  return cells;
}
function isBlocked(state, x, y) {
  return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && (state.board[y][x] !== EMPTY || state.overlay[y][x] === "fence" || state.overlay[y][x] === "mud"));
}
function collides(state, piece, dx = 0, dy = 0, matrix = piece.matrix) {
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (!matrix[row][col]) continue;
      const x = piece.x + col + dx;
      const y = piece.y + row + dy;
      if (isBlocked(state, x, y)) return true;
    }
  }
  return false;
}

function seededLowerField(state, density = 14) {
  const open = [];
  for (let y = Math.floor(ROWS * .42); y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) open.push([x, y]);
  for (const [x, y] of shuffled(state, open).slice(0, density)) state.board[y][x] = pick(state, ANIMAL_IDS);
}
function placeOverlay(state, kind, count) {
  const open = [];
  for (let y = 2; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (state.board[y][x] === EMPTY && state.overlay[y][x] === EMPTY) open.push([x, y]);
    }
  }
  for (const [x, y] of shuffled(state, open).slice(0, count)) state.overlay[y][x] = kind;
}
function setupBoardForCall(state, call) {
  state.board = emptyGrid();
  state.overlay = emptyGrid();
  state.moon = 0;
  state.moonPaused = 0;
  state.callProgress = 0;
  state.callRescues = 0;
  state.dropCount = 0;
  state.held = null;
  state.canHold = true;
  state.forceNextAnimal = null;
  state.manualStart = !call.tutorial;
  if (call.scripted) {
    for (let x = 1; x <= 6; x += 1) state.board[ROWS - 1][x] = "sheep";
    state.current = makePiece(state, "sheep", [[1, 1], [1, 1]]);
    state.next = makePiece(state, "chicken");
  } else {
    seededLowerField(state, 14 + state.callIndex * 2);
    if (call.eggs) placeOverlay(state, "egg", call.eggs);
    if (call.mud) placeOverlay(state, "mud", call.mud);
    state.current = makePiece(state);
    state.next = makePiece(state);
  }
  pushEvent(state, "call-start", { call: call.id });
}

export function currentNight(state) { return NIGHTS[state.nightIndex] ?? NIGHTS[0]; }
export function currentCall(state) { return currentNight(state).calls[state.callIndex] ?? currentNight(state).calls[0]; }

export function createGame(seed = "moonlit") {
  const state = {
    mode: MODES.MAP,
    rng: hashSeed(seed),
    initialSeed: String(seed),
    nightIndex: 0,
    callIndex: 0,
    board: emptyGrid(),
    overlay: emptyGrid(),
    current: null,
    next: null,
    held: null,
    canHold: true,
    tools: [],
    forceNextAnimal: null,
    manualStart: false,
    moon: 0,
    moonPaused: 0,
    callProgress: 0,
    callRescues: 0,
    totalRescues: 0,
    score: 0,
    dropCount: 0,
    events: [],
    lastThreat: null,
    completedNight: null
  };
  return state;
}

export function startNight(state, nightIndex = 0) {
  state.mode = MODES.PLAYING;
  state.nightIndex = clamp(Number(nightIndex) || 0, 0, NIGHTS.length - 1);
  state.callIndex = 0;
  state.tools = [];
  state.score = 0;
  state.totalRescues = 0;
  state.completedNight = null;
  setupBoardForCall(state, currentCall(state));
  return state;
}

export function startDebugCall(state, nightIndex = 0, callIndex = 0) {
  state.mode = MODES.PLAYING;
  state.nightIndex = clamp(Number(nightIndex) || 0, 0, NIGHTS.length - 1);
  state.callIndex = clamp(Number(callIndex) || 0, 0, currentNight(state).calls.length - 1);
  state.tools = [];
  state.score = 0;
  state.totalRescues = 0;
  state.completedNight = null;
  setupBoardForCall(state, currentCall(state));
  return state;
}

export function beginNextCall(state, toolId) {
  const call = currentCall(state);
  if (toolId && call.toolChoices.includes(toolId)) state.tools.push(toolId);
  state.callIndex += 1;
  if (state.callIndex >= currentNight(state).calls.length) {
    state.mode = MODES.NIGHT_COMPLETE;
    state.completedNight = currentNight(state).id;
    pushEvent(state, "night-complete", { night: currentNight(state).id });
    return state;
  }
  state.mode = MODES.PLAYING;
  setupBoardForCall(state, currentCall(state));
  return state;
}

export function move(state, dx) {
  if (state.mode !== MODES.PLAYING || !state.current || collides(state, state.current, dx, 0)) return false;
  state.manualStart = true;
  state.current.x += dx;
  pushEvent(state, "move");
  return true;
}

export function rotate(state) {
  if (state.mode !== MODES.PLAYING || !state.current) return false;
  state.manualStart = true;
  const matrix = rotateMatrix(state.current.matrix);
  for (const kick of [0, -1, 1, -2, 2]) {
    if (!collides(state, state.current, kick, 0, matrix)) {
      state.current.matrix = matrix;
      state.current.x += kick;
      pushEvent(state, "rotate");
      return true;
    }
  }
  return false;
}

export function softDrop(state, fromPlayer = true) {
  if (state.mode !== MODES.PLAYING || !state.current) return false;
  if (!fromPlayer && !state.manualStart) return false;
  if (fromPlayer) state.manualStart = true;
  if (!collides(state, state.current, 0, 1)) {
    state.current.y += 1;
    return true;
  }
  lockPiece(state);
  return false;
}

export function hardDrop(state) {
  if (state.mode !== MODES.PLAYING || !state.current) return false;
  state.manualStart = true;
  while (!collides(state, state.current, 0, 1)) state.current.y += 1;
  lockPiece(state);
  return true;
}

export function swapHold(state) {
  if (state.mode !== MODES.PLAYING || !state.current || !state.canHold) return false;
  state.manualStart = true;
  if (!state.held) {
    state.held = { animal: state.current.animal, matrix: state.current.matrix.map((row) => row.slice()) };
    state.current = state.next;
    state.current.x = centerX(state.current.matrix);
    state.current.y = 0;
    state.next = makePiece(state);
  } else {
    const old = { animal: state.current.animal, matrix: state.current.matrix.map((row) => row.slice()) };
    state.current = { ...state.held, x: centerX(state.held.matrix), y: 0 };
    state.held = old;
  }
  state.canHold = false;
  pushEvent(state, "swap");
  return true;
}

function findGroups(board) {
  const seen = new Set();
  const groups = [];
  for (let y = 0; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) {
    const animal = board[y][x];
    const key = `${x},${y}`;
    if (!animal || seen.has(key)) continue;
    const cells = [];
    const queue = [[x, y]];
    seen.add(key);
    while (queue.length) {
      const [cx, cy] = queue.shift();
      cells.push([cx, cy]);
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        const neighborKey = `${nx},${ny}`;
        if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS || seen.has(neighborKey) || board[ny][nx] !== animal) continue;
        seen.add(neighborKey);
        queue.push([nx, ny]);
      }
    }
    if (cells.length >= CLEAR_SIZE) groups.push({ animal, cells });
  }
  return groups;
}
function applyGravity(state) {
  for (let x = 0; x < COLS; x += 1) {
    const stack = [];
    for (let y = ROWS - 1; y >= 0; y -= 1) if (state.board[y][x]) stack.push({ tile: state.board[y][x], overlay: state.overlay[y][x] === "egg" ? "egg" : EMPTY });
    for (let y = ROWS - 1; y >= 0; y -= 1) {
      if (state.overlay[y][x] === "mud" || state.overlay[y][x] === "fence") {
        state.board[y][x] = EMPTY;
        continue;
      }
      const next = stack.shift();
      state.board[y][x] = next?.tile ?? EMPTY;
      state.overlay[y][x] = next?.overlay ?? EMPTY;
    }
  }
}
function resolveRescues(state) {
  let rescues = 0;
  let chain = 0;
  const rescuedAnimals = [];
  while (chain < 6) {
    const groups = findGroups(state.board);
    if (!groups.length) break;
    chain += 1;
    for (const group of groups) {
      let eggs = 0;
      for (const [x, y] of group.cells) {
        if (state.overlay[y][x] === "egg") eggs += 1;
        state.board[y][x] = EMPTY;
        state.overlay[y][x] = EMPTY;
      }
      rescues += 1;
      rescuedAnimals.push({ animal: group.animal, size: group.cells.length, eggs });
      state.totalRescues += 1;
      state.callRescues += 1;
      state.score += group.cells.length * 10 + eggs * 25 + (chain - 1) * 15;
      if (group.animal === currentCall(state).animal) state.callProgress += 1;
    }
    applyGravity(state);
  }
  if (rescues) state.moon = Math.max(0, state.moon - rescues * 2);
  return rescuedAnimals;
}
function randomOpenCells(state, count) {
  const cells = [];
  for (let y = 1; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) {
    if (state.board[y][x] === EMPTY && state.overlay[y][x] === EMPTY) cells.push([x, y]);
  }
  return shuffled(state, cells).slice(0, count);
}
export function applyThreat(state, threatId = currentCall(state).threat) {
  const threat = THREATS[threatId];
  if (!threat) return [];
  const affected = [];
  if (threatId === "mud" || threatId === "fence") {
    for (const [x, y] of randomOpenCells(state, threatId === "mud" ? 3 : 2)) {
      state.overlay[y][x] = threatId;
      affected.push([x, y]);
    }
  } else if (threatId === "scatter") {
    const occupied = [];
    for (let y = 2; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) if (state.board[y][x]) occupied.push([x, y]);
    const targets = randomOpenCells(state, 3);
    for (const [index, [x, y]] of shuffled(state, occupied).slice(0, targets.length).entries()) {
      const [targetX, targetY] = targets[index];
      state.board[targetY][targetX] = state.board[y][x];
      state.overlay[targetY][targetX] = state.overlay[y][x] === "egg" ? "egg" : EMPTY;
      state.board[y][x] = EMPTY;
      if (state.overlay[y][x] !== "fence") state.overlay[y][x] = EMPTY;
      affected.push([targetX, targetY]);
    }
    applyGravity(state);
  }
  state.moon = 0;
  state.lastThreat = threatId;
  pushEvent(state, "wolf-attack", { threat: threatId, affected: affected.length });
  return affected;
}
function advanceMoon(state) {
  if (state.moonPaused > 0) {
    state.moonPaused -= 1;
    pushEvent(state, "moon-paused");
    return;
  }
  state.moon = Math.min(6, state.moon + 1);
}
function spawnNext(state) {
  state.current = state.next;
  state.current.x = centerX(state.current.matrix);
  state.current.y = 0;
  state.next = makePiece(state, state.forceNextAnimal);
  state.forceNextAnimal = null;
  state.canHold = true;
  if (collides(state, state.current)) {
    state.mode = MODES.GAME_OVER;
    pushEvent(state, "game-over");
  }
}
function lockPiece(state) {
  for (const [x, y] of occupiedCells(state.current)) {
    if (y >= 0) state.board[y][x] = state.current.animal;
  }
  state.dropCount += 1;
  advanceMoon(state);
  const rescues = resolveRescues(state);
  if (rescues.length) pushEvent(state, "rescue", { rescues });
  if (state.callProgress >= currentCall(state).target) {
    if (state.callIndex === currentNight(state).calls.length - 1) {
      state.mode = MODES.NIGHT_COMPLETE;
      state.completedNight = currentNight(state).id;
      pushEvent(state, "night-complete", { night: currentNight(state).id });
    } else {
      state.mode = MODES.TOOL_CHOICE;
      pushEvent(state, "call-complete", { call: currentCall(state).id });
    }
    return;
  }
  if (state.moon >= 6) applyThreat(state);
  spawnNext(state);
  pushEvent(state, "lock", { rescued: rescues.length });
}

export function useTool(state, toolId) {
  if (state.mode !== MODES.PLAYING) return false;
  const index = state.tools.indexOf(toolId);
  if (index === -1) return false;
  state.tools.splice(index, 1);
  if (toolId === "lantern") state.moonPaused = Math.max(state.moonPaused, 3);
  if (toolId === "whistle") {
    state.forceNextAnimal = currentCall(state).animal;
    state.next.animal = currentCall(state).animal;
  }
  if (toolId === "bucket") {
    for (let y = 0; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) if (state.overlay[y][x] === "mud") state.overlay[y][x] = EMPTY;
  }
  pushEvent(state, "tool", { tool: toolId });
  return true;
}

export function debugSnapshot(state) {
  return {
    mode: state.mode,
    night: currentNight(state).id,
    call: currentCall(state).id,
    rng: state.rng,
    moon: state.moon,
    moonPaused: state.moonPaused,
    progress: state.callProgress,
    score: state.score,
    current: state.current && { animal: state.current.animal, x: state.current.x, y: state.current.y, matrix: state.current.matrix },
    next: state.next && { animal: state.next.animal, matrix: state.next.matrix },
    board: cloneGrid(state.board),
    overlay: cloneGrid(state.overlay)
  };
}

export function forceResolve(state) { return resolveRescues(state); }
