/* Compatible with the existing Apps Script / Sheet schema. */
(function(root) {
  'use strict';
  const LIMIT = 20;
  const MODE = 'rescue-v2';
  const VERSION = 'rescue-2.4';
  const URL = 'https://script.google.com/macros/s/AKfycbzAgQNERb-xsiBTOT7PqjcV1afxD4GGASoop3MCFMh93XAYkk8RXqodP324iW0HpsLHPQ/exec';
  const GAME_URL = 'https://kevinhegg.github.io/angry-wolves/play/2.4/';
  // Stable badge IDs: never reorder; the Sheet stores ABC0 and the UI displays ABC 🐕.
  const BADGES = Object.freeze(['🐕', '🐑', '🐏', '🐐', '🦮', '🥾', '🌾', '🧺', '🏡', '🌄', '🐺', '🐶', '🐷', '🐽', '🐮', '🐄', '🐓', '🐔', '🐥', '🐣']);
  const BADGE_NAMES = Object.freeze(['Sheepdog', 'Sheep', 'Ram', 'Goat', 'Faithful hound', 'Walking boot', 'Wheat', 'Basket', 'Farmhouse', 'Sunrise', 'Wily wolf', 'Pip’s puppy eyes', 'Pig parade', 'Snuffling snout', 'Moo crew', 'Meadow cow', 'Dawn rooster', 'Hen house hero', 'Little peeper', 'Great eggscape']);
  const BADGE_IDS = '0123456789ABCDEFGHIJ';
  const PICKER_BADGES = Object.freeze([0,1,10,11,12,14,16,17,18,19]);
  const ANIMALS = Object.freeze(['🐑', '🐷', '🐔', '🐮']);
  function encodeName(initials, badge) {
    const name = String(initials).trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(name) || !Number.isInteger(badge) || badge < 0 || badge >= BADGES.length) throw new Error('Choose three letters and a shepherd badge.');
    return name + BADGE_IDS[badge];
  }
  function decodeName(value) {
    const match = /^([A-Z]{3})([0-9A-J])$/.exec(String(value));
    return match ? `${match[1]} ${BADGES[BADGE_IDS.indexOf(match[2])]}` : '??? 🐑';
  }
  function readProfile(storage) {
    try {
      const initials=storage.getItem('aw-rescue-initials') || '', badge=Number(storage.getItem('aw-rescue-badge')) || 0;
      return {initials:/^[A-Z]{0,3}$/.test(initials)?initials:'',badge:Number.isInteger(badge)&&badge>=0&&badge<BADGES.length?badge:0};
    } catch { return {initials:'',badge:0}; }
  }
  function saveProfile(profile, storage) {
    try { storage.setItem('aw-rescue-initials',profile.initials); storage.setItem('aw-rescue-badge',String(profile.badge)); } catch {}
  }
  function payload(result, initials, badge) {
    return {
      playerName: encodeName(initials, badge), score: result.score, gameMode: MODE,
      missionTitle: `Home safe · Pip rested ${result.rested}/3 · bonus ${result.bonus}`,
      bestChain: 0, biggestHerdCount: result.biggest.count,
      biggestHerdAnimal: ANIMALS[result.biggest.type], herdsCleared: result.moves,
      pace: 3, durationMs: result.durationMs, nonce: result.nonce,
      clientTimestamp: Date.now(), version: VERSION
    };
  }
  async function request(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(url, {...options, signal: controller.signal});
      const data = await response.json();
      if (!response.ok) throw new Error('The score sheet is unavailable. Please try again.');
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The score sheet took too long. Try again; your score is still here.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function leaderboard() {
    const data = await request(`${URL}?gameMode=${MODE}&limit=${LIMIT}`, {cache:'no-store'});
    if (!data.ok || !Array.isArray(data.entries)) throw new Error('Could not load the shepherds’ board.');
    return data.entries.filter(e => e.gameMode === MODE && /^[A-Z]{3}[0-9A-J]$/.test(e.playerName) && Number.isFinite(e.score) && e.score >= 0)
      .sort((a,b) => b.score-a.score).slice(0,LIMIT);
  }
  async function submit(result, initials, badge) {
    const data = await request(URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(payload(result, initials, badge))});
    if (data.reasons?.includes('replay_nonce')) return {status:'received', message:'This adventure was already received. It may still be awaiting review.'};
    if (!data.ok) throw new Error(data.message || data.error || 'Could not save this score. Please try again.');
    const isPublic = data.status === 'accepted' && data.promoted === true;
    return {status:isPublic ? 'public' : 'review', message:isPublic ? 'Score saved! The board shows the top 20 adventures.' : 'Score saved for review. It will appear once approved.'};
  }
  function qualifies(entries, score) {
    return entries.length < LIMIT || score > entries[LIMIT-1].score;
  }
  function verifiedRank(entries, result, playerName) {
    const matches = entries.map((entry,i) => ({entry,rank:i+1})).filter(({entry:e}) =>
      e.playerName === playerName && e.score === result.score &&
      e.durationMs === result.durationMs && e.herdsCleared === result.moves &&
      e.biggestHerdCount === result.biggest.count && e.biggestHerdAnimal === ANIMALS[result.biggest.type] && e.version === VERSION);
    return matches.length === 1 ? matches[0].rank : null;
  }
  function caption(result) {
    return `${result.rank ? `🏆 Top 20 high score · #${result.rank} · ${result.playerLabel}\n` : result.personalBest ? '🏆 New personal best!\n' : ''}I brought ${result.saved} animals home in Angry Wolves! 🏡\n${result.score.toLocaleString('en-US')} points · biggest herd: ${result.biggest.count} ${ANIMALS[result.biggest.type]}\nPip rested in ${result.rested}/3 fields (+${result.bonus}).\nCan you beat my herd? ${GAME_URL}`;
  }
  const api = {LIMIT,qualifies,verifiedRank,MODE,VERSION,URL,GAME_URL,BADGES,BADGE_NAMES,PICKER_BADGES,readProfile,saveProfile,ANIMALS,encodeName,decodeName,payload,leaderboard,submit,caption};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RescueServices = api;
})(typeof window !== 'undefined' ? window : globalThis);
