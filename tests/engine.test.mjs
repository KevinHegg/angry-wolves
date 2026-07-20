import assert from "node:assert/strict";
import test from "node:test";
import { COLS, ROWS } from "../src/content.js";
import { MODES, applyThreat, beginNextCall, createGame, currentCall, debugSnapshot, forceResolve, hardDrop, startNight, useTool } from "../src/engine.js";

test("the scripted first flock rescues at least seven sheep in one drop", () => {
  const state = createGame("first-flock");
  startNight(state, 0);
  hardDrop(state);
  assert.equal(state.callProgress, 1);
  assert.equal(state.mode, MODES.TOOL_CHOICE);
  assert.ok(state.totalRescues >= 1);
  assert.equal(state.moon, 0);
});

test("a seven-animal connected group becomes a rescue", () => {
  const state = createGame("seven");
  startNight(state, 0);
  state.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  state.overlay = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  for (let x = 0; x < 7; x += 1) state.board[ROWS - 1][x] = "sheep";
  const rescued = forceResolve(state);
  assert.equal(rescued.length, 1);
  assert.equal(rescued[0].size, 7);
  assert.equal(state.callProgress, 1);
});

test("wolf attacks create their advertised board effects", () => {
  for (const threat of ["mud", "fence", "scatter"]) {
    const state = createGame(`threat-${threat}`);
    startNight(state, 1);
    const affected = applyThreat(state, threat);
    assert.equal(state.lastThreat, threat);
    if (threat !== "scatter") assert.ok(affected.length > 0);
    assert.equal(state.moon, 0);
  }
});

test("every earned tool has a distinct predictable effect", () => {
  const state = createGame("tools");
  startNight(state, 0);
  state.tools = ["lantern", "whistle", "bucket"];
  state.moon = 4;
  state.overlay[9][2] = "mud";
  assert.equal(useTool(state, "lantern"), true);
  assert.equal(state.moonPaused, 3);
  assert.equal(useTool(state, "whistle"), true);
  assert.equal(state.next.animal, currentCall(state).animal);
  assert.equal(useTool(state, "bucket"), true);
  assert.equal(state.overlay[9][2], null);
});

test("seeded play remains reproducible", () => {
  const left = createGame("same-night");
  const right = createGame("same-night");
  startNight(left, 2); startNight(right, 2);
  hardDrop(left); hardDrop(right);
  hardDrop(left); hardDrop(right);
  assert.deepEqual(debugSnapshot(left), debugSnapshot(right));
});

test("completing a Call moves to the next authored Call with the selected tool", () => {
  const state = createGame("next-call");
  startNight(state, 0);
  hardDrop(state);
  beginNextCall(state, "lantern");
  assert.equal(state.mode, MODES.PLAYING);
  assert.equal(state.callIndex, 1);
  assert.deepEqual(state.tools, ["lantern"]);
});
