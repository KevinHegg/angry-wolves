const SAVE_KEY = "aw_rescue_v1";
const LEGACY_SOUND_KEY = "aw_sound";
const LEGACY_NAME_KEY = "aw_leaderboard_name";

const defaultSave = () => ({
  version: 1,
  completedNights: [],
  selectedNight: 0,
  soundOn: true,
  reducedMotion: false,
  playerName: "",
  stats: { nightsWon: 0, rescues: 0, bestScore: 0 }
});

function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, value) { try { localStorage.setItem(key, value); } catch {} }

export function loadSave() {
  const fallback = defaultSave();
  try {
    const parsed = JSON.parse(safeGet(SAVE_KEY) || "null");
    if (parsed?.version === 1) return { ...fallback, ...parsed, stats: { ...fallback.stats, ...parsed.stats } };
  } catch {}
  const legacySound = safeGet(LEGACY_SOUND_KEY);
  const legacyName = safeGet(LEGACY_NAME_KEY);
  return { ...fallback, soundOn: legacySound === null ? true : legacySound === "1", playerName: String(legacyName || "").slice(0, 10) };
}

export function saveProgress(save) {
  safeSet(SAVE_KEY, JSON.stringify({ ...defaultSave(), ...save }));
  safeSet(LEGACY_SOUND_KEY, save.soundOn ? "1" : "0");
  if (save.playerName) safeSet(LEGACY_NAME_KEY, String(save.playerName).toUpperCase().slice(0, 10));
}

export function completeNight(save, nightId, nightIndex, score, rescues) {
  const completedNights = Array.from(new Set([...save.completedNights, nightId]));
  const next = {
    ...save,
    completedNights,
    selectedNight: Math.max(save.selectedNight || 0, Math.min(nightIndex + 1, 4)),
    stats: {
      nightsWon: Math.max(save.stats?.nightsWon || 0, completedNights.length),
      rescues: (save.stats?.rescues || 0) + rescues,
      bestScore: Math.max(save.stats?.bestScore || 0, score)
    }
  };
  saveProgress(next);
  return next;
}

export function resetProgress(save) {
  const next = { ...defaultSave(), soundOn: save.soundOn, playerName: save.playerName };
  saveProgress(next);
  return next;
}

export { SAVE_KEY };
