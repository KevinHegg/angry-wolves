const STORAGE_KEY = "last-line-state-v1";
const DAILY_ROUNDS = 3;
const DEV_MODE = new URLSearchParams(location.search).get("dev") === "1";

const puzzles = [
  ["Arithmetic", "2, 4, 8, 16, ?", ["18", "24", "32", "30"], 2, "Each value doubles."],
  ["Arithmetic", "3, 6, 12, 24, ?", ["36", "48", "42", "30"], 1, "Multiply by 2 each step."],
  ["Symbol", "●○●○● ?", ["○", "●", "△", "□□"], 0, "Alternating symbols."],
  ["Symbol", "▲▲■ ▲▲■ ▲▲ ?", ["■", "▲", "●", "□□"], 0, "Repeating 3-symbol block."],
  ["Words", "Mercury, Venus, Earth, ?", ["Mars", "Jupiter", "Moon", "Saturn"], 0, "Planets in order from sun."],
  ["Words", "Mon, Wed, Fri, ?", ["Sat", "Sun", "Tue", "Mon"], 0, "Every other weekday."],
  ["Letter", "A1, B2, C3, D4, ?", ["F6", "E5", "E4", "D5"], 1, "Letter and number both increase by one."],
  ["Letter", "Z, X, V, T, ?", ["S", "R", "Q", "P"], 1, "Move backward by 2 letters."],
  ["Shape", "■, ■■, ■■■, ?", ["■■■■", "■■", "□□□□", "■■■■■"], 0, "One more square each term."],
  ["Shape", "1 triangle, 2 triangles, 4 triangles, ?", ["5", "6", "8", "10"], 2, "Triangle count doubles."],
  ["Rule Shift", "5, 10, 20, 23, 46, ?", ["49", "92", "52", "43"], 0, "Pattern alternates ×2 then +3."],
  ["Rule Shift", "AB, BC, CD, DE, ?", ["EF", "DF", "EG", "FE"], 0, "Both letters shift one forward."],
  ["Arithmetic", "10, 9, 7, 4, ?", ["3", "0", "1", "2"], 1, "Subtract 1,2,3, then 4."],
  ["Words", "Circle, Square, Circle, Square, ?", ["Triangle", "Square", "Circle", "Hexagon"], 2, "Alternating two categories."],
  ["Letter", "ACE, BDF, CEG, ?", ["DFH", "CEH", "DEG", "ADF"], 0, "Each letter in triplet moves forward one."],
  ["Shape", "⬟⬟, ⬟⬟⬟, ⬟⬟⬟⬟, ?", ["⬟⬟⬟⬟⬟", "⬟⬟", "⬟⬟⬟", "⬟"], 0, "Add one shape each line."],
  ["Rule Shift", "2, 5, 11, 23, ?", ["35", "47", "46", "44"], 1, "Multiply by 2 and add 1."],
  ["Symbol", "☆, ★, ☆, ★, ?", ["★", "☆", "✦", "✧"], 1, "Alternating hollow/filled star."],
  ["Words", "Red, Orange, Yellow, ?", ["Blue", "Green", "Purple", "Cyan"], 1, "Rainbow sequence."],
  ["Letter", "M, O, Q, S, ?", ["T", "U", "V", "W"], 1, "Advance by 2 letters."],
  ["Rule Shift", "1, 2, 6, 7, 21, ?", ["22", "42", "24", "63"], 0, "Alternates ×1? actually +1 then ×3."],
  ["Arithmetic", "100, 50, 25, ?", ["12.5", "10", "5", "20"], 0, "Halves each step."],
];

const state = loadState();
bootstrap();

function bootstrap() {
  window.LastLineDebug = { getTodayKey, seededIndices, reset: resetToday, state: () => state };
  renderStart();
  setupModals();
  document.querySelector("#statsButton").onclick = () => renderStats();
}

function getTodayKey() { return new Date().toISOString().slice(0, 10); }
function hashString(s) { return [...s].reduce((a,c)=>((a<<5)-a+c.charCodeAt(0))|0, 0) >>> 0; }
function seededIndices(day) {
  let seed = hashString(`last-line-${day}`); const arr = [...Array(puzzles.length).keys()];
  for (let i = arr.length - 1; i > 0; i--) { seed = (1664525 * seed + 1013904223) >>> 0; const j = seed % (i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr.slice(0, DAILY_ROUNDS);
}
function loadState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"days":{},"stats":{"played":0,"won":0,"streak":0,"bestTime":null,"history":[]}}');
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetToday() { delete state.days[getTodayKey()]; saveState(); renderStart(); }

function renderStart() {
  const today = getTodayKey();
  const done = state.days[today]?.completed;
  const s = document.querySelector("#startScreen");
  document.querySelector("#roundScreen").classList.add("hidden");
  document.querySelector("#resultScreen").classList.add("hidden");
  s.classList.remove("hidden");
  s.innerHTML = `<div class="card"><h2>Daily Puzzle ${today}</h2><p class="meta">3 rounds. Pick the only valid final line.</p></div>
    ${done ? `<div class="card">Already completed today.<br><span class="accent">Come back tomorrow.</span></div>` : ""}
    <button class="btn" id="startBtn" ${done && !DEV_MODE ? "disabled" : ""}>${done ? "Completed" : "Start Today"}</button>
    <button class="btn secondary" id="howBtn">How to Play</button>
    ${DEV_MODE ? '<button class="btn secondary" id="resetBtn">Dev Reset Today</button>' : ''}`;
  s.querySelector("#startBtn").onclick = () => startRun();
  s.querySelector("#howBtn").onclick = () => document.querySelector("#howModal").showModal();
  if (DEV_MODE) s.querySelector("#resetBtn").onclick = resetToday;
}

function startRun() {
  const day = getTodayKey();
  const indices = seededIndices(day);
  const run = { day, indices, idx: 0, answers: [], startTime: performance.now(), roundStart: performance.now() };
  renderRound(run);
}

function renderRound(run) {
  const round = puzzles[run.indices[run.idx]];
  const [category, prompt, choices] = round;
  const screen = document.querySelector("#roundScreen");
  document.querySelector("#startScreen").classList.add("hidden"); screen.classList.remove("hidden");
  screen.innerHTML = `<div class="card"><div class="meta">Round ${run.idx+1}/${DAILY_ROUNDS} · ${category}</div><h3>${prompt}</h3><div class="timer" id="timer"></div></div>
  <div id="choices"></div><button id="submitBtn" class="btn" disabled>Submit</button><div id="feedback" class="card hidden"></div>`;
  let selected = -1;
  const choicesEl = screen.querySelector("#choices");
  choices.forEach((c,i)=>{ const b=document.createElement("button"); b.className="choice"; b.textContent=`${String.fromCharCode(65+i)}. ${c}`; b.onclick=()=>{selected=i; [...choicesEl.children].forEach(x=>x.classList.remove("selected")); b.classList.add("selected"); screen.querySelector("#submitBtn").disabled=false;}; choicesEl.appendChild(b); });
  const timerEl = screen.querySelector("#timer");
  const t = setInterval(()=> timerEl.textContent = `⏱ ${Math.floor((performance.now()-run.startTime)/1000)}s`, 200);
  screen.querySelector("#submitBtn").onclick = ()=>{
    const correct = selected === round[3];
    run.answers.push({correct, selected, correctIndex: round[3]});
    [...choicesEl.children].forEach((n,i)=>n.classList.add(i===round[3]?"correct":(i===selected?"incorrect":"")));
    const fb = screen.querySelector("#feedback"); fb.classList.remove("hidden"); fb.innerHTML = `<strong>${correct?"Correct":"Not quite"}</strong><p>${round[4]}</p><button class="btn" id="nextBtn">${run.idx===DAILY_ROUNDS-1?"See Results":"Next Round"}</button>`;
    screen.querySelector("#submitBtn").disabled=true;
    screen.querySelector("#nextBtn").onclick = ()=>{clearInterval(t); run.idx++; run.idx>=DAILY_ROUNDS ? finish(run) : renderRound(run);};
  };
}

function finish(run) {
  const totalTime = Math.floor((performance.now()-run.startTime)/1000);
  const totalCorrect = run.answers.filter(a=>a.correct).length;
  const win = totalCorrect===3;
  state.days[run.day] = { completed: true, totalCorrect, totalTime, marks: run.answers.map(a=>a.correct?"🟩":"🟥") };
  state.stats.played += 1; if (win) { state.stats.won += 1; state.stats.streak += 1; } else state.stats.streak = 0;
  state.stats.bestTime = state.stats.bestTime === null ? totalTime : Math.min(state.stats.bestTime, totalTime);
  state.stats.history.unshift({day: run.day, totalCorrect, totalTime}); state.stats.history = state.stats.history.slice(0, 30);
  saveState();
  renderResults(run.day);
}
function renderResults(day) {
  document.querySelector("#roundScreen").classList.add("hidden");
  const d = state.days[day];
  const idx = Math.abs(hashString(day)) % 1000;
  const share = `Last Line #${String(idx).padStart(3,"0")}\n${d.marks.join("")}\n⏱ ${d.totalTime}s`;
  const r = document.querySelector("#resultScreen"); r.classList.remove("hidden");
  r.innerHTML = `<div class="card"><h2>Results</h2><p>${d.totalCorrect}/3 correct</p><p>Time: ${d.totalTime}s</p><p>Streak: <span class="accent">${state.stats.streak}</span></p></div>
  <button class="btn" id="shareBtn">Share Result</button>
  <button class="btn secondary" id="leaderBtn">Submit to Leaderboard (mock)</button>
  <button class="btn secondary" id="homeBtn">Back Home</button>`;
  r.querySelector("#shareBtn").onclick = async ()=>{ await navigator.clipboard.writeText(share); alert("Copied result text"); };
  r.querySelector("#leaderBtn").onclick = ()=> console.log("Mock leaderboard payload", { day, score: d.totalCorrect, time: d.totalTime });
  r.querySelector("#homeBtn").onclick = renderStart;
}

function setupModals(){
  document.querySelector("#howModal").innerHTML = `<h3>How to Play</h3><p>Each round, study the pattern and pick the only valid final line.</p><ul><li>3 rounds each day.</li><li>One guess per round.</li><li>Streak grows only on 3/3 days.</li></ul><button class="btn" onclick="this.closest('dialog').close()">Close</button>`;
}
function renderStats(){
  const st = state.stats;
  const modal = document.querySelector("#statsModal");
  modal.innerHTML = `<h3>Stats</h3><p>Played: ${st.played}</p><p>Perfect days: ${st.won}</p><p>Current streak: <span class="accent">${st.streak}</span></p><p>Best time: ${st.bestTime ?? "-"}s</p><button class="btn" onclick="this.closest('dialog').close()">Close</button>`;
  modal.showModal();
}
