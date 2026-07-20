import { ANIMALS, COLS, NIGHTS, ROWS, THREATS, TOOLS } from "./content.js";
import { BarnAudio } from "./audio.js";
import { MODES, beginNextCall, createGame, currentCall, currentNight, hardDrop, move, rotate, softDrop, startDebugCall, startNight, swapHold, useTool } from "./engine.js";
import { completeNight, loadSave, saveProgress } from "./storage.js";

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzAgQNERb-xsiBTOT7PqjcV1afxD4GGASoop3MCFMh93XAYkk8RXqodP324iW0HpsLHPQ/exec";
const params = new URLSearchParams(location.search);
const seed = params.get("seed") || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
let save = loadSave();
if (params.get("mute") === "1") save.soundOn = false;
let state = createGame(seed);
const audio = new BarnAudio(save.soundOn);
let toastTimer = 0;
let gameLoop = 0;
let overlayKind = "";
let touchStart = null;

const $ = (selector) => document.querySelector(selector);
const elements = {
  mapScreen: $("#mapScreen"), gameScreen: $("#gameScreen"), farmMap: $("#farmMap"), continueButton: $("#continueButton"), howButton: $("#howButton"),
  mapButton: $("#mapButton"), soundButton: $("#soundButton"), nightLabel: $("#nightLabel"), callTitle: $("#callTitle"), callPrompt: $("#callPrompt"),
  callProgress: $("#callProgress"), rescueMeter: $("#rescueMeterFill"), threatCard: $("#threatCard"), threatIcon: $("#threatIcon"), threatName: $("#threatName"),
  threatDescription: $("#threatDescription"), moonTrack: $("#moonTrack"), gameCanvas: $("#gameCanvas"), nextCanvas: $("#nextCanvas"), holdButton: $("#holdButton"),
  toolRack: $("#toolRack"), toast: $("#toast"), overlay: $("#overlay"), overlayEyebrow: $("#overlayEyebrow"), overlayTitle: $("#overlayTitle"),
  overlayBody: $("#overlayBody"), overlayActions: $("#overlayActions"), closeOverlay: $("#closeOverlay")
};
const ctx = elements.gameCanvas.getContext("2d");
const nextCtx = elements.nextCanvas.getContext("2d");

function animalMeta(id) { return ANIMALS[id] || ANIMALS.sheep; }
function showToast(text, duration = 1700) {
  clearTimeout(toastTimer);
  elements.toast.textContent = text;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), duration);
}
function vibrate(ms) { try { if (navigator.vibrate && save.soundOn) navigator.vibrate(ms); } catch {} }
function setScreen(which) {
  const map = which === "map";
  elements.mapScreen.classList.toggle("hidden", !map);
  elements.gameScreen.classList.toggle("hidden", map);
  elements.mapButton.classList.toggle("hidden", map);
}
function openOverlay({ kind, eyebrow = "MOONLIT RESCUE", title, body = "", actions = [], closable = true }) {
  overlayKind = kind;
  elements.overlayEyebrow.textContent = eyebrow;
  elements.overlayTitle.textContent = title;
  elements.overlayBody.innerHTML = body;
  elements.overlayActions.replaceChildren();
  for (const action of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = action.label;
    button.className = action.className || "primary-button";
    button.addEventListener("click", action.onClick);
    elements.overlayActions.append(button);
  }
  elements.closeOverlay.classList.toggle("hidden", !closable);
  elements.overlay.classList.remove("hidden");
}
function closeOverlay() {
  elements.overlay.classList.add("hidden");
  overlayKind = "";
}
function buildToolChoices() {
  const call = currentCall(state);
  const container = document.createElement("div");
  container.className = "tool-choices";
  for (const toolId of call.toolChoices) {
    const tool = TOOLS[toolId];
    const choice = document.createElement("button");
    choice.className = "tool-choice";
    choice.type = "button";
    choice.innerHTML = `<span class="tool-choice-icon">${tool.icon}</span><span><strong>${tool.name}</strong><span>${tool.description}</span></span>`;
    choice.addEventListener("click", () => { closeOverlay(); beginNextCall(state, toolId); showToast(`${tool.name} packed for the next Call.`); render(); });
    container.append(choice);
  }
  return container;
}
function showToolChoice() {
  const call = currentCall(state);
  openOverlay({
    kind: "tool-choice", eyebrow: "CALL COMPLETE", title: `${call.title} is safe!`,
    body: `<p>Pick one practical tool for the next rescue. There is no wrong answer—just a different plan.</p>`, actions: [], closable: false
  });
  elements.overlayActions.replaceChildren(buildToolChoices());
}
function showNightComplete() {
  const night = currentNight(state);
  if (!save.completedNights.includes(night.id)) save = completeNight(save, night.id, state.nightIndex, state.score, state.totalRescues);
  openOverlay({
    kind: "night-complete", eyebrow: "DAWN BREAKS", title: `${night.landmark} restored`,
    body: `<p>${night.note}</p><div class="result-stats"><div class="result-stat"><b>${state.totalRescues}</b><span>herds home</span></div><div class="result-stat"><b>${state.score}</b><span>lantern points</span></div></div>`,
    actions: [
      { label: "Return to the farm", onClick: () => { closeOverlay(); state.mode = MODES.MAP; setScreen("map"); renderMap(); } },
      { label: "Post your score", className: "text-button", onClick: postScore }
    ], closable: false
  });
  audio.tone("dawn");
}
function showGameOver() {
  openOverlay({
    kind: "game-over", eyebrow: "THE FIELD IS FULL", title: "The barn gate closes for tonight.",
    body: `<p>You brought ${state.totalRescues} herd${state.totalRescues === 1 ? "" : "s"} home. Tomorrow's moon is a fresh chance.</p><div class="result-stats"><div class="result-stat"><b>${state.score}</b><span>lantern points</span></div><div class="result-stat"><b>${currentCall(state).title}</b><span>last call</span></div></div>`,
    actions: [
      { label: "Try this Night again", onClick: () => { closeOverlay(); startNight(state, state.nightIndex); setScreen("game"); render(); } },
      { label: "Return to the farm", className: "text-button", onClick: () => { closeOverlay(); state.mode = MODES.MAP; setScreen("map"); renderMap(); } }
    ], closable: false
  });
}
function showHowToPlay() {
  openOverlay({
    kind: "how", eyebrow: "ONE RULE AT A TIME", title: "Bring the herd home.",
    body: `<ul><li><b>Make 7 matching animals touch</b> to rescue a herd.</li><li>Every drop fills the <b>moon track</b>. A rescue pushes the wolves back two steps.</li><li>At six moon steps, the visible wolf threat happens.</li><li>After each Call, choose a tool. Lantern pauses wolves, Whistle calls the target animal, Bucket clears mud.</li></ul><p>Tap the field to rotate. Swipe sideways to steer, down to drop. The Next card swaps once per drop.</p>`,
    actions: [{ label: "Got it", onClick: closeOverlay }]
  });
}
async function postScore() {
  const response = prompt("Name for the Moonlit Rescue board (up to 10 letters/numbers):", save.playerName || "");
  if (response === null) return;
  const playerName = String(response).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (!playerName) { showToast("A short name is needed to post a score."); return; }
  save.playerName = playerName;
  saveProgress(save);
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ playerName, score: state.score, gameMode: "night-rescue-v1", missionTitle: `${currentNight(state).title} · ${currentCall(state).title}`, bestChain: 0, biggestHerdCount: 7, biggestHerdAnimal: currentCall(state).animal, herdsCleared: state.totalRescues, pace: 1, durationMs: Math.max(9000, state.dropCount * 700), nonce: `${Date.now()}-${Math.random()}`, clientTimestamp: Date.now(), version: "moonlit-rescue-1" })
    });
    showToast("Score sent to the moonlit board.");
  } catch { showToast("Score board is resting. Your local win is safe."); }
}

function renderMap() {
  elements.farmMap.replaceChildren();
  NIGHTS.forEach((night, index) => {
    const previous = NIGHTS[index - 1];
    const unlocked = index === 0 || save.completedNights.includes(previous.id);
    const completed = save.completedNights.includes(night.id);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `night-card${completed ? " is-complete" : ""}${unlocked ? "" : " is-locked"}`;
    card.style.setProperty("--landmark-color", night.landmarkColor);
    card.disabled = !unlocked;
    card.innerHTML = `<span class="night-number">NIGHT ${index + 1}</span><strong>${night.title}</strong><span class="landmark">${completed ? "Restored: " : "Restore: "}${night.landmark}</span><span class="night-stamp">${completed ? "✦" : unlocked ? night.landmarkIcon : "🔒"}</span>`;
    card.addEventListener("click", () => { save.selectedNight = index; saveProgress(save); beginNight(index); });
    elements.farmMap.append(card);
  });
  const selected = clampNight(save.selectedNight);
  elements.continueButton.textContent = save.completedNights.includes(NIGHTS[selected]?.id) ? "Play again" : `Start Night ${selected + 1}`;
}
function clampNight(index) { return Math.max(0, Math.min(NIGHTS.length - 1, Number(index) || 0)); }
function beginNight(index) {
  audio.wake();
  startNight(state, index);
  setScreen("game");
  showToast(index === 0 ? "One clear action. Get the sheep inside." : `${currentNight(state).title}: the moon is rising.`);
  render();
}

function drawRoundedRect(context, x, y, width, height, radius, fill, stroke = "") {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  if (fill) { context.fillStyle = fill; context.fill(); }
  if (stroke) { context.strokeStyle = stroke; context.stroke(); }
}
function drawAnimal(context, id, x, y, size, alpha = 1) {
  const meta = animalMeta(id);
  const cx = x + size / 2;
  const cy = y + size / 2;
  context.save();
  context.globalAlpha = alpha;
  drawRoundedRect(context, x + 2, y + 2, size - 4, size - 4, size * .22, meta.color, "rgba(16,24,38,.23)");
  context.fillStyle = "rgba(255,255,255,.2)";
  context.fillRect(x + 7, y + 7, size - 14, 4);
  if (id === "sheep") {
    context.fillStyle = "#fffaf0";
    for (const [dx, dy] of [[-.17,-.05],[.13,-.15],[.2,.13],[-.16,.15]]) { context.beginPath(); context.arc(cx + size * dx, cy + size * dy, size * .19, 0, Math.PI * 2); context.fill(); }
    context.fillStyle = meta.accent; context.beginPath(); context.ellipse(cx, cy + size * .06, size * .16, size * .2, 0, 0, Math.PI * 2); context.fill();
  } else if (id === "chicken") {
    context.fillStyle = "#ffd36e"; context.beginPath(); context.ellipse(cx, cy + size * .04, size * .24, size * .26, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = meta.accent; context.beginPath(); context.arc(cx, cy - size * .19, size * .08, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#eb8d3d"; context.beginPath(); context.moveTo(cx + size*.2, cy); context.lineTo(cx + size*.34, cy + size*.06); context.lineTo(cx + size*.2, cy + size*.1); context.fill();
  } else if (id === "pig") {
    context.fillStyle = "#ffc0c8"; context.beginPath(); context.arc(cx, cy, size * .25, 0, Math.PI * 2); context.fill();
    context.fillStyle = "#f06e92"; context.beginPath(); context.ellipse(cx, cy + size * .11, size * .17, size * .12, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = meta.accent; context.beginPath(); context.arc(cx - size*.07, cy + size*.1, size*.022, 0, Math.PI*2); context.arc(cx + size*.07, cy + size*.1, size*.022, 0, Math.PI*2); context.fill();
  } else {
    context.fillStyle = "#e3d4ff"; context.beginPath(); context.ellipse(cx, cy + size*.03, size*.23, size*.25, 0, 0, Math.PI*2); context.fill();
    context.strokeStyle = meta.accent; context.lineWidth = Math.max(2, size*.06); context.beginPath(); context.moveTo(cx-size*.14, cy-size*.18); context.lineTo(cx-size*.22, cy-size*.34); context.moveTo(cx+size*.14, cy-size*.18); context.lineTo(cx+size*.22, cy-size*.34); context.stroke();
  }
  context.fillStyle = "#28243b";
  context.beginPath(); context.arc(cx - size*.075, cy - size*.035, Math.max(1.3,size*.035), 0, Math.PI*2); context.arc(cx + size*.075, cy - size*.035, Math.max(1.3,size*.035), 0, Math.PI*2); context.fill();
  context.restore();
}
function drawOverlay(context, kind, x, y, size) {
  const cx = x + size / 2; const cy = y + size / 2;
  context.save();
  if (kind === "egg") {
    context.fillStyle = "#fff0a6"; context.beginPath(); context.ellipse(cx, cy, size*.14, size*.2, 0, 0, Math.PI*2); context.fill();
    context.strokeStyle = "#d69a3e"; context.lineWidth = 1.5; context.stroke();
  } else if (kind === "mud") {
    context.fillStyle = "rgba(92,55,37,.8)"; context.beginPath(); context.ellipse(cx, cy, size*.34, size*.2, 0, 0, Math.PI*2); context.fill();
    context.fillStyle = "rgba(204,150,93,.45)"; context.beginPath(); context.arc(cx-size*.12, cy-size*.03, size*.06, 0, Math.PI*2); context.arc(cx+size*.1, cy+size*.05, size*.045, 0, Math.PI*2); context.fill();
  } else if (kind === "fence") {
    context.strokeStyle = "#d4a064"; context.lineWidth = Math.max(2, size*.08); context.beginPath(); context.moveTo(x+size*.22,y+size*.12); context.lineTo(x+size*.78,y+size*.88); context.moveTo(x+size*.78,y+size*.12); context.lineTo(x+size*.22,y+size*.88); context.stroke();
  }
  context.restore();
}
function drawPiece(context, piece, cell, alpha = 1) {
  if (!piece) return;
  piece.matrix.forEach((row, rowIndex) => row.forEach((filled, colIndex) => {
    if (!filled) return;
    const x = (piece.x + colIndex) * cell;
    const y = (piece.y + rowIndex) * cell;
    if (y >= 0) drawAnimal(context, piece.animal, x, y, cell, alpha);
  }));
}
function ghostPiece() {
  const clone = { animal: state.current.animal, matrix: state.current.matrix, x: state.current.x, y: state.current.y };
  const blocked = (piece, dx, dy) => piece.matrix.some((row, ry) => row.some((filled, rx) => {
    if (!filled) return false;
    const x = piece.x + rx + dx; const y = piece.y + ry + dy;
    return x < 0 || x >= COLS || y >= ROWS || (y >= 0 && (state.board[y][x] || state.overlay[y][x] === "mud" || state.overlay[y][x] === "fence"));
  }));
  while (!blocked(clone, 0, 1)) clone.y += 1;
  return clone;
}
function renderBoard() {
  const canvas = elements.gameCanvas;
  const cell = canvas.width / COLS;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const field = ctx.createLinearGradient(0, 0, 0, canvas.height);
  field.addColorStop(0, "#477b60"); field.addColorStop(1, "#214b48");
  ctx.fillStyle = field; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y += 1) for (let x = 0; x < COLS; x += 1) {
    drawRoundedRect(ctx, x * cell + 2, y * cell + 2, cell - 4, cell - 4, cell*.14, y < 2 ? "rgba(91,142,104,.24)" : "rgba(23,74,58,.28)", "rgba(223,243,196,.08)");
    if ((x + y * 3) % 4 === 0) { ctx.strokeStyle = "rgba(214,246,177,.13)"; ctx.beginPath(); ctx.moveTo(x*cell + cell*.35, y*cell+cell*.68); ctx.lineTo(x*cell+cell*.45, y*cell+cell*.47); ctx.stroke(); }
  }
  state.board.forEach((row, y) => row.forEach((tile, x) => { if (tile) drawAnimal(ctx, tile, x * cell, y * cell, cell); }));
  state.overlay.forEach((row, y) => row.forEach((overlay, x) => { if (overlay) drawOverlay(ctx, overlay, x * cell, y * cell, cell); }));
  if (state.mode === MODES.PLAYING && state.current) { drawPiece(ctx, ghostPiece(), cell, .19); drawPiece(ctx, state.current, cell); }
  const call = currentCall(state);
  ctx.fillStyle = "rgba(255,244,190,.88)"; ctx.font = "700 18px ui-rounded, system-ui"; ctx.textAlign = "left";
  ctx.fillText(`${animalMeta(call.animal).name.toUpperCase()} PEN`, 12, canvas.height - 13);
}
function renderNext() {
  nextCtx.clearRect(0, 0, 92, 92);
  if (!state.next) return;
  const piece = state.next;
  const widest = piece.matrix[0].length;
  const cell = Math.min(24, 70 / Math.max(widest, piece.matrix.length));
  const width = widest * cell; const height = piece.matrix.length * cell;
  const display = { ...piece, x: Math.round((92 / cell - widest) / 2), y: Math.round((92 / cell - piece.matrix.length) / 2) };
  drawPiece(nextCtx, display, cell);
}
function renderHUD() {
  const call = currentCall(state); const night = currentNight(state); const threat = THREATS[call.threat];
  elements.nightLabel.textContent = `NIGHT ${state.nightIndex + 1} · ${night.title.toUpperCase()}`;
  elements.callTitle.textContent = call.title;
  elements.callPrompt.textContent = call.prompt;
  elements.callProgress.textContent = `${state.callProgress} / ${call.target}`;
  elements.rescueMeter.style.width = `${Math.min(100, state.callProgress / call.target * 100)}%`;
  elements.threatIcon.textContent = threat.icon;
  elements.threatName.textContent = state.moonPaused ? "Lantern light" : threat.name;
  elements.threatDescription.textContent = state.moonPaused ? `Wolves paused for ${state.moonPaused} more drop${state.moonPaused === 1 ? "" : "s"}.` : threat.description;
  elements.threatCard.classList.toggle("is-imminent", state.moon >= 4 && !state.moonPaused);
  elements.moonTrack.replaceChildren();
  for (let index = 0; index < 6; index += 1) {
    const pip = document.createElement("span");
    pip.className = `moon-pip${index < state.moon ? " is-filled" : ""}${state.moonPaused ? " is-paused" : ""}`;
    elements.moonTrack.append(pip);
  }
  elements.toolRack.replaceChildren();
  if (!state.tools.length) elements.toolRack.innerHTML = `<span class="eyebrow" style="align-self:center;opacity:.7">TOOLS EARNED<br>BETWEEN CALLS</span>`;
  state.tools.forEach((toolId) => {
    const tool = TOOLS[toolId];
    const button = document.createElement("button");
    button.className = "tool-button"; button.type = "button"; button.dataset.tool = toolId; button.title = tool.description;
    button.innerHTML = `<span class="tool-icon">${tool.icon}</span>${tool.short}`;
    button.addEventListener("click", () => act(() => useTool(state, toolId)));
    elements.toolRack.append(button);
  });
}
function processEvents() {
  while (state.events.length) {
    const event = state.events.shift();
    if (event.type === "move") audio.tone("move");
    if (event.type === "rotate") audio.tone("rotate");
    if (event.type === "lock") audio.tone("lock");
    if (event.type === "rescue") {
      const first = event.rescues[0]; audio.tone("rescue", first.animal); vibrate(18);
      const count = event.rescues.length; showToast(`${count > 1 ? "Chain rescue! " : ""}${animalMeta(first.animal).plural} sprinted to ${animalMeta(first.animal).pen}.`);
    }
    if (event.type === "wolf-attack") { audio.tone("attack"); vibrate([30, 35, 30]); showToast(`${THREATS[event.threat].name}: the wolves made their move!`, 2100); }
    if (event.type === "tool") { audio.tone("tool"); showToast(`${TOOLS[event.tool].name} used.`); }
    if (event.type === "call-complete") { audio.tone("rescue"); setTimeout(showToolChoice, 250); }
    if (event.type === "night-complete") setTimeout(showNightComplete, 250);
    if (event.type === "game-over") setTimeout(showGameOver, 250);
  }
}
function render() {
  if (state.mode === MODES.MAP) { setScreen("map"); renderMap(); return; }
  setScreen("game"); renderHUD(); renderBoard(); renderNext(); processEvents();
}
function act(action) {
  audio.wake();
  action();
  render();
}

elements.continueButton.addEventListener("click", () => beginNight(clampNight(save.selectedNight)));
elements.howButton.addEventListener("click", showHowToPlay);
elements.mapButton.addEventListener("click", () => { state.mode = MODES.MAP; setScreen("map"); renderMap(); });
elements.soundButton.addEventListener("click", () => {
  save.soundOn = !save.soundOn; saveProgress(save); audio.setEnabled(save.soundOn); if (save.soundOn) audio.wake();
  elements.soundButton.textContent = save.soundOn ? "♬" : "×"; elements.soundButton.setAttribute("aria-pressed", String(save.soundOn));
});
elements.closeOverlay.addEventListener("click", closeOverlay);
elements.holdButton.addEventListener("click", () => act(() => swapHold(state)));
document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
  const action = button.dataset.action;
  if (action === "left") act(() => move(state, -1));
  if (action === "right") act(() => move(state, 1));
  if (action === "rotate") act(() => rotate(state));
  if (action === "drop") act(() => hardDrop(state));
}));
window.addEventListener("keydown", (event) => {
  if (elements.overlay.classList.contains("hidden") === false || state.mode !== MODES.PLAYING) return;
  const handlers = { ArrowLeft: () => move(state, -1), a: () => move(state, -1), ArrowRight: () => move(state, 1), d: () => move(state, 1), ArrowDown: () => softDrop(state), s: () => softDrop(state), " ": () => hardDrop(state), x: () => rotate(state), z: () => rotate(state), c: () => swapHold(state) };
  const handler = handlers[event.key.toLowerCase()] || handlers[event.key];
  if (handler) { event.preventDefault(); act(handler); }
});
elements.gameCanvas.addEventListener("pointerdown", (event) => { touchStart = { x: event.clientX, y: event.clientY }; elements.gameCanvas.setPointerCapture?.(event.pointerId); });
elements.gameCanvas.addEventListener("pointerup", (event) => {
  if (!touchStart || state.mode !== MODES.PLAYING) return;
  const dx = event.clientX - touchStart.x; const dy = event.clientY - touchStart.y; touchStart = null;
  if (Math.abs(dy) > 55 && dy > Math.abs(dx)) act(() => hardDrop(state));
  else if (Math.abs(dx) > 26) act(() => move(state, Math.sign(dx)));
  else act(() => rotate(state));
});

clearInterval(gameLoop);
gameLoop = setInterval(() => { if (state.mode === MODES.PLAYING && elements.overlay.classList.contains("hidden")) act(() => softDrop(state, false)); }, 760);
elements.soundButton.textContent = save.soundOn ? "♬" : "×";
elements.soundButton.setAttribute("aria-pressed", String(save.soundOn));

const debugCall = params.get("debugCall");
if (debugCall) {
  let nightIndex = 0; let callIndex = 0;
  NIGHTS.forEach((night, nIndex) => { const found = night.calls.findIndex((call) => call.id === debugCall); if (found >= 0) { nightIndex = nIndex; callIndex = found; } });
  startDebugCall(state, nightIndex, callIndex); setScreen("game"); render(); showToast(`Debug Call: ${currentCall(state).title}`);
} else if (params.get("night")) {
  const index = NIGHTS.findIndex((night) => night.id === params.get("night"));
  beginNight(index >= 0 ? index : 0);
} else {
  renderMap();
}
