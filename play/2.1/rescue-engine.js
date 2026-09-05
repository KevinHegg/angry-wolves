/* Pure rules shared by the browser and the dependency-free Node tests. */
(function (root) {
  'use strict';
  const SIZE = 6;
  const REST_BONUSES = Object.freeze([0, 100, 250, 500]);
  function restBonus(rested) { return REST_BONUSES[Math.max(0, Math.min(3, Math.floor(rested)))]; }
  function wolfStep(count) { return count === 3 ? -2 : count === 4 ? -1 : count < 8 ? 0 : 1; }
  const CHAPTERS = [
    { name: 'The open pasture', time: 'Late afternoon', goal: [12, 0, 0, 0], types: 3, distance: 8,
      story: 'The gate is open. The sheep have wandered out. Get 12 sheep home before the wolves reach the field.',
      ending: 'The sheep are through the gate. But there is trouble down by the orchard.' },
    { name: 'Trouble in the orchard', time: 'Sunset', goal: [0, 12, 12, 0], types: 3, distance: 7,
      story: 'The pigs and hens heard the howling. They are hiding in the orchard. Bring 12 of each back to the lane.',
      ending: 'The orchard is quiet. One last herd is stranded beside the woods.' },
    { name: 'The last gate', time: 'Nightfall', goal: [10, 10, 10, 10], types: 4, distance: 6,
      story: 'The barn lantern is lit. The pack is close. The cows have joined the herd. Bring 10 of every animal home, then shut the last gate.',
      ending: 'The last gate swings shut. Every herd is home. The wolves will have to go hungry tonight.' }
  ];
  function neighbors(i) {
    return [i % SIZE ? i - 1 : -1, i % SIZE < SIZE - 1 ? i + 1 : -1,
      i >= SIZE ? i - SIZE : -1, i < SIZE * (SIZE - 1) ? i + SIZE : -1].filter(n => n >= 0);
  }
  function group(board, start) {
    if (!Number.isInteger(start) || start < 0 || start >= board.length) return [];
    const found = new Set([start]), todo = [start];
    while (todo.length) for (const n of neighbors(todo.pop())) {
      if (board[n] === board[start] && !found.has(n)) { found.add(n); todo.push(n); }
    }
    return [...found];
  }
  function groups(board) {
    const seen = new Set(), result = [];
    for (let i = 0; i < board.length; i++) if (!seen.has(i)) {
      const g = group(board, i); g.forEach(n => seen.add(n)); if (g.length >= 3) result.push(g);
    }
    return result;
  }
  const animal = (types, rng) => Math.floor(rng() * types);
  function ensureMove(board, types, rng) {
    if (groups(board).length) return false;
    // A flock gathers when no move exists. No turn or resource is consumed.
    const t = animal(types, rng);
    board[30] = board[31] = board[32] = t;
    return true;
  }
  function create(chapter = 0, rng = Math.random) {
    const c = CHAPTERS[chapter];
    const board = Array.from({ length: SIZE * SIZE }, () => animal(c.types, rng));
    // Every field opens with an obvious, useful herd.
    const first = c.goal.findIndex(n => n > 0);
    board[30] = board[31] = board[32] = board[33] = first;
    return { chapter, board, saved: [0, 0, 0, 0], distance: c.distance, bark: 1, moves: 0, score: 0, biggest: {count: 0, type: 0}, status: 'playing' };
  }
  function rescue(state, start, rng = Math.random) {
    if (state.status !== 'playing') return { ok: false };
    const g = group(state.board, start);
    if (g.length < 3) return { ok: false };
    const type = state.board[start], count = g.length, cleared = new Set(g);
    state.saved[type] += count;
    state.score += count * 10 + Math.max(0, count - 3) ** 2 * 2;
    state.moves++;
    if (count > state.biggest.count) state.biggest = {count, type};
    const step = wolfStep(count);
    state.distance = Math.max(0, Math.min(10, state.distance + step));
    for (let col = 0; col < SIZE; col++) {
      const survivors = [];
      for (let row = SIZE - 1; row >= 0; row--) {
        const i = row * SIZE + col;
        if (!cleared.has(i)) survivors.push(state.board[i]);
      }
      for (let row = SIZE - 1; row >= 0; row--)
        state.board[row * SIZE + col] = survivors[SIZE - 1 - row] ?? animal(CHAPTERS[state.chapter].types, rng);
    }
    // A last-turn rescue succeeds before the pack can enter the field.
    if (CHAPTERS[state.chapter].goal.every((n, i) => state.saved[i] >= n)) state.status = 'won';
    else if (state.distance <= 0) state.status = 'lost';
    const regrouped = ensureMove(state.board, CHAPTERS[state.chapter].types, rng);
    return { ok: true, count, type, step, cleared: g, regrouped };
  }
  function bark(state, rng = Math.random) {
    if (state.status !== 'playing' || !state.bark) return false;
    state.bark = 0;
    state.distance = Math.min(10, state.distance + 3);
    for (let i = state.board.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [state.board[i], state.board[j]] = [state.board[j], state.board[i]];
    }
    ensureMove(state.board, CHAPTERS[state.chapter].types, rng);
    return true;
  }
  const api = { SIZE, CHAPTERS, REST_BONUSES, restBonus, wolfStep, neighbors, group, groups, create, rescue, bark };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RescueRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
