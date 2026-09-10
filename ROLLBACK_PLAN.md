# Rollback Plan

This file covers the current mission-special pass and the planned V2 barnyard-core refresh work.

## V2 Clarity + Economy + Audio Pass

Files changed for this pass:

- [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js)
- [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html)
- [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css)
- [MISSION_LADDER_V2.md](/Users/kevinhegg/Documents/angry-wolves/MISSION_LADDER_V2.md)
- [AUDIO_DESIGN.md](/Users/kevinhegg/Documents/angry-wolves/AUDIO_DESIGN.md)
- [CLARITY_ECONOMY_AUDIO_V2.md](/Users/kevinhegg/Documents/angry-wolves/CLARITY_ECONOMY_AUDIO_V2.md)
- [refresh-assets/clarity-economy-audio-v2/](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/clarity-economy-audio-v2/)

What this pass changes:

- Keeps chained missions and persistent board carryover.
- Adds `V2_NEXT_JOB_CEREMONY_ENABLED`, disabled with `?nextJobCeremony=0`.
- Adds `V2_JOB_PATIENCE_ENABLED`, disabled with `?jobPatience=0`.
- Adds `V2_FRESH_JOB_BONUS_ENABLED`, disabled with `?freshJobBonus=0`.
- Adds `V2_CASCADE_COMPRESSION_ENABLED`, disabled with `?cascadeCompression=0`.
- Adds `V2_HERD_SCORE_COMPRESSION_ENABLED`, disabled with `?herdCompression=0`.
- Adds default-off `V2_OFF_MISSION_DAMPING_ENABLED`, enabled only with `?offMissionDamping=1`.
- Adds `V2_AUDIO_ANIMALS_ENABLED`, disabled with `?audioAnimals=0`.
- Updates `GAME_VERSION` to `v0.40-v2-clarity-economy-audio`.
- Adds a score receipt to the run-over panel.
- Makes First Flock start on a clean board.
- Reconciles Rain Barrel to mud-only cleanup, Wolf Alert to "survive 1 howl", and Barn Cash to a 5-job/5-run unlock.

To disable the full clarity/economy layer while keeping V2:

- Open with `?nextJobCeremony=0&jobPatience=0&freshJobBonus=0&cascadeCompression=0&herdCompression=0`.

To disable only job patience:

- Open with `?jobPatience=0`.
- This removes objective expiration and Fresh Job timing pressure, but the chained mission loop still works.

To disable only fresh bonuses:

- Open with `?freshJobBonus=0`.
- Or set `V2_FRESH_JOB_BONUS_ENABLED = false`.

To disable only cascade/large-herd scoring compression:

- Open with `?cascadeCompression=0&herdCompression=0`.
- Mission rewards, streak rewards, and normal chain visuals/audio remain intact.

To disable only transition ceremony:

- Open with `?nextJobCeremony=0`.
- Jobs still chain immediately, but the mission strip pulse, carryover toast, and short transition pause are skipped.

To disable animal-forward audio:

- Open with `?audioAnimals=0`.
- For the larger V2 audio rollback, open with `?humorAudio=0`.

To revert copy-only changes:

- Restore `LADDER_V2_MISSION_DEFS`, `missionBriefSpecialLines`, `patchHelpLine`, and `SHARED_MISSION_SPECIAL_LIBRARY` in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).
- Restore [MISSION_LADDER_V2.md](/Users/kevinhegg/Documents/angry-wolves/MISSION_LADDER_V2.md) from the prior version.

To return to the pre-ladder V2 deck:

- Open with `?missionLadder=0`.
- To also disable chained jobs, open with `?missionLadder=0&chainedMissions=0`.

To return to the legacy production path:

- Open with `?v1=1` or `?v2=0`.

## V2 Mission Ladder Operationalization Pass

Files changed for the mission ladder pass:

- [game.js](/Users/kevinhegg/Documents/angry-wolves-mission-ladder/game.js)
- [index.html](/Users/kevinhegg/Documents/angry-wolves-mission-ladder/index.html)
- [MISSION_LADDER_V2.md](/Users/kevinhegg/Documents/angry-wolves-mission-ladder/MISSION_LADDER_V2.md)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves-mission-ladder/ROLLBACK_PLAN.md)
- [refresh-assets/mission-ladder-v2/](/Users/kevinhegg/Documents/angry-wolves-mission-ladder/refresh-assets/mission-ladder-v2/)

What this pass changes:

- Adds `V2_MISSION_LADDER_ENABLED`, enabled by default for V2 and disabled with `?missionLadder=0`.
- Adds `V2_CHAINED_MISSIONS_ENABLED`, enabled by default with the ladder and disabled with `?chainedMissions=0`.
- Preserves the prior V2 mission deck as `LEGACY_V2_MISSION_DEFS`.
- Adds the new ladder deck in `LADDER_V2_MISSION_DEFS`.
- Adds chained jobs: cashing a reward starts the next job instead of ending the run.
- Missing a reward countdown now resets the job streak and starts the next job when chained missions are enabled.
- Adds flat capped job streak bonuses: +0, +20, +40, then +60 cap.
- Adds mission progress types for animal-herd clears, mud cleaned, and wolf events.
- Updates Muck Wagon and Barn Goods misses to create mud traps instead of generic turd penalties in V2 ladder play.
- Updates V2 leaderboard metadata to include mission/job fields and `GAME_VERSION = "v0.37-v2-mission-ladder"`.

To disable only the new mission ladder:

- Open the game with `?missionLadder=0`.
- Or set `V2_MISSION_LADDER_ENABLED = false` in [game.js](/Users/kevinhegg/Documents/angry-wolves-mission-ladder/game.js).
- This uses `LEGACY_V2_MISSION_DEFS` while leaving V2 board, renderer, audio, and scoring intact.

To disable only chained missions:

- Open the game with `?chainedMissions=0`.
- Or set `V2_CHAINED_MISSIONS_ENABLED = false`.
- This keeps the ladder deck but returns reward cashout/miss behavior to the prior one-job run structure.

To remove only the streak bonus:

- Set `V2_STREAK_BONUS_CAP = 0` and change `V2_STREAK_BONUS_BY_STREAK` to `[0]`.
- Or leave the constants and have `missionStreakBonus()` return `0`.

To revert mission copy only:

- Restore the mission objects in `LADDER_V2_MISSION_DEFS`.
- Restore special copy in `SHARED_MISSION_SPECIAL_LIBRARY` and `missionBriefSpecialLines`.
- The old V2 deck remains in `LEGACY_V2_MISSION_DEFS` for reference.

To revert debug helpers:

- Remove or ignore `?debugMissionFlow=1`, `?debugMissionTier=...`, `?debugMissionState=...`, and `?debugNoLeaderboard=1`.
- The existing debug helpers remain query-gated and off by default.

To revert the entire pass:

- Revert the mission ladder commit once approved/committed, or apply the safety patch generated before this pass if needed.
- For immediate runtime rollback without code changes, open with `?missionLadder=0&chainedMissions=0`.
- For full V2 rollback, open with `?v1=1` or `?v2=0`.

## V2 Barnyard-Core Planning Branch

- Branch: `refresh/v2-barnyard-core`
- Baseline SHA: `969747d137b0640c22d39ce9291a3f084010328a`
- Baseline file: [REFRESH_V2_BASELINE.md](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_BASELINE.md)
- Planning file: [REFRESH_V2_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_PLAN.md)

This setup step does not change gameplay. It creates a safe planning branch and records the baseline before any V2 implementation.

### V2 Stability + Tuning Pass

Files changed for the scoring, ghost, and audio reliability pass:

- [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js)
- [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md)
- [refresh-assets/stability-tuning-pass/](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/stability-tuning-pass/)

What this pass changes:

- V2 scoring moves from egg/turd exponentials to bounded linear modifiers.
- V2 score submissions are tagged with `GAME_MODE = "v2-prototype"` and `GAME_VERSION = "v0.35-v2-score-stable"` so prototype scores do not mix with the standard public board.
- The V2 ghost landing footprint and drop lane are quieter via named ghost/drop-lane constants near the top of [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).
- Audio settings now default SFX volume to `DEFAULT_SFX_VOLUME = 0.65` instead of accidentally reading missing storage as `0`.
- Settings now includes a small `Test Sound` button.
- Debug helpers: `?debugScore=1`, `?audioDebug=1`, and `?audioReset=1`.

To revert only V2 scoring:

- Restore `GAME_MODE`, `GAME_VERSION`, `chainBonusForDepth`, `herdSizeBonus`, and the herd scoring block in `resolveBoard` from the prior version of [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).
- Remove the V2 scoring constants: `V2_HERD_SCORE_PER_TILE`, `V2_HERD_SCORE_EXTRA_PER_TILE`, `V2_EGG_MULTIPLIER_PER_EGG`, `V2_EGG_MULTIPLIER_CAP_EGGS`, `V2_TURD_PENALTY_PER_TURD`, `V2_TURD_PENALTY_CAP_TURDS`, `V2_TURD_MIN_MULTIPLIER`, `V2_CHAIN_BONUS_BASE`, `V2_CHAIN_BONUS_STEP`, and `V2_CHAIN_BONUS_CAP`.
- Or temporarily open/play with `?v1=1` to bypass the V2 scoring path entirely.

To revert only ghost/drop-lane tuning:

- Restore the prior values for `tokenAlphaForState`, ghost handling in `drawTokenBase`, ghost handling in `drawFarmCellState`, and `drawV2DropLane`.
- Or tune only the constants `V2_GHOST_TOKEN_ALPHA`, `V2_GHOST_TOKEN_BASE_ALPHA`, `V2_GHOST_CELL_FILL`, `V2_GHOST_CELL_STROKE`, `V2_GHOST_CELL_LINE_WIDTH`, `V2_DROP_LANE_TOP_ALPHA`, and `V2_DROP_LANE_BOTTOM_ALPHA`.

To revert only audio settings/debug changes:

- Remove the `Test Sound` row from [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html).
- Remove `testSoundButton`, `AUDIO_DEBUG`, `AUDIO_RESET`, `DEFAULT_SFX_VOLUME`, `resetAudioPrefsIfRequested`, `audioDebugLog`, `ensureAudibleSfxDefaultIfMissing`, `playAudioTestCueFromGesture`, and the related event listener changes from [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).
- Restore `loadSfxVolumePref` to the previous behavior only if the missing-storage `0%` default is intentionally desired.

### Setup Verification On 2026-04-26

- Verified current branch: `refresh/v2-barnyard-core`.
- Verified current `HEAD`: `969747d137b0640c22d39ce9291a3f084010328a`.
- Verified source materials are present: `REFRESH_BRIEF.pdf`, `REFRESH_BRIEF_IMAGE2.pdf`, refresh screenshots, and V2 concept/reference images in `refresh-assets/`.
- This verification step updates documentation only and does not add gameplay edits.
- Note: the working tree now includes later uncommitted V2 prototype changes from follow-up exploration. The rollback baseline remains the SHA above.

### Planned V2 Safety Switches

These flags live near the existing top-of-file switches in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js):

- `REFRESH_V2_ENABLED`
- `SIMPLE_HERD_GRAVITY_ENABLED`
- `FARM_BOARD_RENDERER_ENABLED`
- `VECTOR_ANIMAL_TOKENS_ENABLED`
- `HUMOR_AUDIO_ENABLED`
- `V2_ONBOARDING_ENABLED`

Expected rollback behavior:

- Open the current branch with `?v1=1` or `?v2=0` to force the current v0.27 path without editing code.
- Set `REFRESH_V2_DEFAULT_ENABLED = false` in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js) to make the current v0.27 path the default again.
- Set `REFRESH_V2_ENABLED = false` to keep the current v0.27 game path reachable if the default/query helper is removed later.
- Keep V2 subflags dependent on `REFRESH_V2_ENABLED` so partial experiments do not leak into normal play.
- Do not delete the current resolver, renderer, mission, or audio paths until their V2 replacements have passed mobile and desktop testing.
- If a deployed branch needs both versions available, prefer a temporary query/local override for V2 testing while defaulting to the current game.

### V2 Prototype Pass 1

Files changed for the first playable V2 prototype:

- [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js)
- [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md)
- [refresh-assets/11-v2-prototype-main.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/11-v2-prototype-main.png)
- [refresh-assets/12-legacy-v1-reference.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/12-legacy-v1-reference.png)

Verification note on 2026-04-26:

- The first playable V2 prototype is already present in the current working tree.
- `node --check game.js` and `git diff --check` pass.
- The current working tree also includes later V2 visual, audio, onboarding, and review-prep changes layered on top of the first prototype. Use the feature flags below to isolate each subsystem for review.

What the V2 flags currently gate:

- `REFRESH_V2_ENABLED`: master V2 mode, currently defaulted on for this feature branch.
- `SIMPLE_HERD_GRAVITY_ENABLED`: disables perimeter conversion and uses clean vanish -> straight gravity -> recheck chains.
- `FARM_BOARD_RENDERER_ENABLED`: enables the larger warm board, physical token rendering, stronger ghost/drop-lane clarity, and secondary egg/turd treatment.
- `VECTOR_ANIMAL_TOKENS_ENABLED`: enables the V2 canvas vector animal token set; currently on when V2 is on.
- `HUMOR_AUDIO_ENABLED`: enables the V2 `AudioDirector`, procedural animal voices, event SFX grammar, and wolf/mission cues.
- `V2_ONBOARDING_ENABLED`: skips the heavy mission briefing and starts with a small toast plus thin mission strip.

To revert only the simple herd resolver:

- Set `SIMPLE_HERD_GRAVITY_ENABLED = false`.
- This restores the perimeter-conversion chain path while leaving the V2 layout visible.

To revert only the larger board / farm rendering:

- Set `FARM_BOARD_RENDERER_ENABLED = false`.
- This restores the dark/glassy canvas renderer while leaving V2 mission/threshold behavior available.

To revert only the vector animal token art:

- Set `VECTOR_ANIMAL_TOKENS_ENABLED = false`, or open with `?vectorAnimals=0`.
- This keeps the warm farm board while restoring emoji/glyph tile contents for animal pieces.

To revert only the V2 onboarding behavior:

- Set `V2_ONBOARDING_ENABLED = false`.
- This brings back the mission briefing before play.

To revert the V2 board dimensions and threshold:

- Set `REFRESH_V2_DEFAULT_ENABLED = false`, or open with `?v1=1`.
- If keeping V2 enabled but tuning only, adjust `V2_COLS`, `V2_ROWS`, and `V2_CLEAR_THRESHOLD` near the top of [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).
- For quick threshold testing without editing code, open with `?herdThreshold=8`, `?herdThreshold=9`, or `?herdThreshold=10`.

### V2 Visual Language Pass

Files changed for the barnyard tabletop visual pass:

- [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js)
- [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css)
- [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md)
- [refresh-assets/13-v2-vector-tokens-main.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/13-v2-vector-tokens-main.png)
- [refresh-assets/14-v2-emoji-fallback.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/14-v2-emoji-fallback.png)
- [refresh-assets/15-v2-legacy-renderer-fallback.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/15-v2-legacy-renderer-fallback.png)
- [refresh-assets/16-v2-inapp-renderer-check.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/16-v2-inapp-renderer-check.png)

Verification note on 2026-04-26:

- The V2 visual language pass is already present in the current working tree.
- Rendering strategy is canvas vector tokens, not SVG symbols, so the existing board canvas remains the single rendering surface.
- `FARM_BOARD_RENDERER_ENABLED` and `VECTOR_ANIMAL_TOKENS_ENABLED` both default on when V2 is enabled.
- `node --check game.js` and `git diff --check` pass with this visual path present.

What this pass adds:

- `FARM_BOARD_RENDERER_ENABLED` now draws a warm top-down pasture board with wood framing, muted grass cells, subtle texture, drop-lane clarity, and secondary egg/turd treatment.
- `VECTOR_ANIMAL_TOKENS_ENABLED` now draws reusable canvas vector tokens for sheep, goats, chickens, cows, pigs, wolves, and black sheep.
- Active, ghost, herd-candidate, clearing, scared, egg-modified, and muddy token states are rendered in the V2 path.
- V2 canvas sizing now uses a mobile width guard so the board remains large without spilling horizontally.

To revert only the V2 farm/tabletop board surface:

- Set `FARM_BOARD_RENDERER_ENABLED = false`, or open with `?farmBoard=0`.
- The simple V2 resolver, V2 board dimensions, and compact mission strip remain available, but the canvas returns to the legacy dark tile renderer.

To revert only vector animals:

- Set `VECTOR_ANIMAL_TOKENS_ENABLED = false`, or open with `?vectorAnimals=0`.
- This preserves the warm board and V2 UI shell while returning animal contents to emoji/glyph rendering.

To revert both visual experiments while keeping V2 mechanics:

- Set both `FARM_BOARD_RENDERER_ENABLED = false` and `VECTOR_ANIMAL_TOKENS_ENABLED = false`.

To revert the full V2 visual pass:

- Open with `?v1=1` or `?v2=0`, or set `REFRESH_V2_DEFAULT_ENABLED = false`.
- If code revert is needed, revert this visual-pass commit only after confirming no later V2 work depends on the token renderer helpers.

### V2 Cell Styling And Opening Pace Cleanup

Files changed for this cleanup/tuning pass:

- [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md)

What this pass changes:

- Removes the circular/medallion-style animal token frame in the V2 vector renderer.
- Moves settled, active, ghost, herd-preview, and clearing emphasis onto the square cell treatment.
- Reduces V2 herd-preview line weight and active-piece background layering.
- Splits fall timing into legacy and V2 constants so the old game can keep its original opening speed.
- Slows V2 opening fall speed from `650ms` to `800ms`, roughly 23% slower.
- Blends V2 base fall speed back toward the legacy `650ms` base over `24` effective ramp locks so later-game pace stays close to the prior curve.
- Adds V2 opening ramp grace: `6` settled pieces before normal speed ramp if no herd has cleared, or `3` settled pieces after the first herd clears.

To revert only the V2 cell styling cleanup:

- Restore the previous `drawTokenBase`, `drawFarmTile`, `drawFarmCellState`, `drawFloatingTile`, `drawPiece`, `drawShadow`, `drawHerdCellGroup`, and `drawV2HerdHints` implementations in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).
- Or open with `?vectorAnimals=0` to bypass the V2 animal token rendering while keeping the V2 board surface.
- Or open with `?farmBoard=0` to bypass the full V2 farm-board renderer.

To revert only the opening pace tuning:

- Change `V2_BASE_FALL_MS` from `800` back to `650`.
- Remove `V2_SETTLED_BASE_FALL_MS` / `V2_BASE_FALL_BLEND_LOCKS` and have `baseFallMsForPace()` return the single base value.
- Set `V2_OPENING_RAMP_GRACE_LOCKS` and `V2_POST_HERD_RAMP_GRACE_LOCKS` to `0`, or have `speedRampLockCount()` return `locks` whenever V2 is enabled.
- Legacy timing remains `LEGACY_BASE_FALL_MS = 650`.

### V2 Humor Audio Pass

Files changed for the audio redesign pass:

- [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js)
- [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html)
- [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css)
- [AUDIO_DESIGN.md](/Users/kevinhegg/Documents/angry-wolves/AUDIO_DESIGN.md)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md)

Verification note on 2026-04-26:

- The V2 humor audio pass is already present in the current working tree.
- `HUMOR_AUDIO_ENABLED` defaults on only when V2 is enabled, and `?humorAudio=0` bypasses `AudioDirector` while leaving the older procedural helpers active.
- The implementation remains procedural Web Audio only: no new assets, no dependencies, and no silent-switch bypass.
- `node --check game.js` and `git diff --check` pass with this audio path present.

What this pass adds:

- `AudioDirector` with lightweight SFX buses, event recipes, cooldowns, random pitch variation, and optional haptic pairings.
- Public helpers `animalVoice(type, event, intensity)`, `playGameEventSound(eventName, payload)`, and `safeResumeAudioFromGesture()`.
- Procedural cartoon voices for sheep, goats, chickens, cows, pigs, and wolves.
- V2 event sounds for UI, movement, rotation, invalid moves, hard drops, settles, near-herds, herd clears, chains, mission progress/completion, special pieces, wolf havoc, and Angry Wolves completion.
- Settings controls for SFX volume and goofy animal voices.
- Additional iPhone Safari resume nudges on gesture, `visibilitychange`, `pageshow`, `focus`, and `pagehide` cleanup, without bypassing silent mode.

To revert only the V2 humor audio director:

- Open with `?humorAudio=0`, or set `HUMOR_AUDIO_ENABLED = false` in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).
- This keeps the older procedural helpers active and bypasses `AudioDirector`.

To revert only the new settings controls:

- Remove the `SFX Volume` and `Goofy Animals` rows from [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html).
- Remove `.audioVolumeRow`, `.rangeControl`, `.rangeValue`, and `.rangeControl input[type="range"]` from [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css).
- Remove the `sfxVolumeInput`, `sfxVolumeValueEl`, and `goofyToggle` DOM bindings plus their event listeners from [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).

To revert only the iPhone audio lifecycle additions:

- Remove the `pointerup` resume listener and the `pagehide` cleanup added in this pass.
- Keep `USE_IOS_AUDIO_RESUME_FIXES` available for the earlier audio-resume behavior.

To revert the long Angry Wolves howl only:

- In `playWolfHowl`, remove the `angry_wolves_complete` dispatch for `style === "angry_victory"` or shorten the `wolfVoice("angry_victory")` recipe in `createAudioDirector`.

To revert the full audio pass:

- Set `HUMOR_AUDIO_ENABLED = false` first and verify the game remains playable.
- Then revert the audio-pass commit, including [AUDIO_DESIGN.md](/Users/kevinhegg/Documents/angry-wolves/AUDIO_DESIGN.md), after confirming no later V2 work depends on `AudioDirector`.

### V2 Onboarding And Mission Presentation Pass

Files changed for this onboarding pass:

- [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js)
- [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html)
- [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md)

What this pass adds:

- A first-run V2 onboarding mission: `Sheep Sweep — clear 9 sheep` at the current V2 threshold, with no mission specials.
- A small V2 mission deck: `Sheep Sweep`, `Barn Mixer`, `Egg Money`, `Mud Season`, `Wolf Alert`, and rare `Angry Wolves`.
- New V2 mission types for species variety and egg-herd clears.
- Short active mission strip copy using `Mission Name — goal hint`.
- V2 help ordering that puts controls first, core loop second, and missions/specials third.
- A `?resetOnboarding=1` dev/testing shortcut to replay the first-run teaching mission.

Verification note on 2026-04-26:

- The onboarding path is gated by `V2_ONBOARDING_ENABLED`, which only defaults on when V2 is enabled.
- `?resetOnboarding=1` clears the V2 onboarding/run counters so the first-run mission can be replayed safely during review.
- `Wolf Alert` and `Angry Wolves` stay out of the first-run pool through `minRunsStarted` gates.
- `Angry Wolves` completion still routes through the long `angry_wolves_complete` howl when the reward group ends the run.
- `node --check game.js` and `git diff --check` passed with this onboarding path present.

To revert only the first-run onboarding behavior:

- Set `V2_ONBOARDING_ENABLED = false` to restore the mission briefing path.
- Or remove the `v2OnboardingSeen`, `markV2OnboardingSeen`, `v2RunsStarted`, `bumpV2RunsStarted`, and `v2MissionPool` helpers from [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js) and have `newMission()` draw directly from `ACTIVE_MISSION_DEFS`.

To revert only the V2 mission deck:

- Replace `V2_MISSION_DEFS` in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js) with the previous one-mission `Barnyard Warmup` deck.
- Remove the `variety` and `egg_clear` mission handling from `bumpMission`, `missionObjectiveLabel`, `missionActiveStatusText`, and `compactMissionProgress`.

To revert only the active mission strip copy:

- Change `missionDisplayLabel()` back to the previous parenthetical format for V2.

To revert only the help changes:

- Restore the previous help section order in [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html).
- Remove `.helpMiniDiagram` from [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css).
- Remove the V2 Core Loop / Missions rewrite inside `patchHelpLine()` in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).

To revert only wolf/Angry Wolves onboarding timing:

- Remove or lower the `minRunsStarted` gates on `v2_wolf_alert` and `angry_wolves`.
- To disable Angry Wolves entirely, set `USE_ANGRY_WOLVES_MISSION = false`.

### V2 Review / Playtest Prep

Files added or updated for review prep:

- [REFRESH_V2_PLAYTEST.md](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_PLAYTEST.md)
- [REFRESH_V2_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_PLAN.md)
- [ANGRY_WOLVES_CONTEXT.md](/Users/kevinhegg/Documents/angry-wolves/ANGRY_WOLVES_CONTEXT.md)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md)
- [refresh-assets/17-v2-review-first-run-board.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/17-v2-review-first-run-board.png)
- [refresh-assets/18-v2-review-played-board.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/18-v2-review-played-board.png)
- [refresh-assets/19-v2-review-mobile-390x844.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/19-v2-review-mobile-390x844.png)
- [refresh-assets/20-v2-review-mobile-430x932.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/20-v2-review-mobile-430x932.png)
- [refresh-assets/22-v2-review-current-first-run.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/22-v2-review-current-first-run.png)
- [refresh-assets/23-v2-review-current-played-board.png](/Users/kevinhegg/Documents/angry-wolves/refresh-assets/23-v2-review-current-played-board.png)
- [REFRESH_V2_REVIEW_CURRENT_DIFF.patch](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_REVIEW_CURRENT_DIFF.patch)

What this prep adds:

- A review checklist covering iPhone Safari, desktop browser, audio, mechanics clarity, leaderboard regression, known issues, and tuning questions.
- Fresh V2 screenshots for in-app review and CDP mobile-emulated 390/430 CSS-pixel phone viewports.
- No intentional gameplay, scoring, leaderboard, or audio behavior changes.

Verification note on 2026-04-26:

- The current in-app browser was on `http://localhost:8000/index.html?resetOnboarding=1&review=clean`.
- Captured fresh current-review board screenshots `22` and `23` in [refresh-assets](/Users/kevinhegg/Documents/angry-wolves/refresh-assets).
- Regenerated [REFRESH_V2_REVIEW_CURRENT_DIFF.patch](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_REVIEW_CURRENT_DIFF.patch) from the current working tree.
- `node --check game.js` and `git diff --check` passed.

To revert only this review prep:

- Remove [REFRESH_V2_PLAYTEST.md](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_PLAYTEST.md), [REFRESH_V2_REVIEW_CURRENT_DIFF.patch](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_REVIEW_CURRENT_DIFF.patch), and the `17` through `20`, `22`, and `23` review screenshots from [refresh-assets](/Users/kevinhegg/Documents/angry-wolves/refresh-assets).
- Remove this review-prep section from [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md).
- Optionally remove the matching context/status note from [REFRESH_V2_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_PLAN.md) and [ANGRY_WOLVES_CONTEXT.md](/Users/kevinhegg/Documents/angry-wolves/ANGRY_WOLVES_CONTEXT.md).

### Revert Only V2 Planning Docs

Remove these files if this planning setup needs to be backed out:

- [REFRESH_V2_BASELINE.md](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_BASELINE.md)
- [REFRESH_V2_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/REFRESH_V2_PLAN.md)

Then remove this V2 section from [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves/ROLLBACK_PLAN.md).

### Revert Entire V2 Branch

The safest full rollback is to leave `refresh/v2-barnyard-core` unmerged and return to the approved branch or `main`.

If V2 implementation has already begun, first set all V2 flags to `false`, verify the current game path still works, then either revert the V2 commits or abandon the branch.

## Mission-First Specials / UX Pass

This pass is isolated on branch `codex/mission-first-specials-pass` and is designed to roll back by config first, code revert second.

## Files Changed

- `game.js`
- `index.html`
- `styles.css`
- `ROLLBACK_PLAN.md`

## Primary Safety Switches

All feature switches live near the top of [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).

- `USE_REVISED_MISSION_DECK`
- `USE_MISSION_ONLY_SPECIALS`
- `USE_WEIGHTED_MISSION_SPECIALS`
- `USE_ANGRY_WOLVES_MISSION`
- `USE_NEW_TOUCH_CONTROLS`
- `USE_ENHANCED_CHAOS_AUDIO`
- `USE_TUNED_CLUTTER_SPAWNS`
- `USE_MISSION_BRIEF_SPECIAL_CARDS`
- `USE_BRIEF_HELP_SHORTCUT`
- `USE_IOS_AUDIO_RESUME_FIXES`

## Restore Prior Mission Deck

Set these in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js):

- `USE_REVISED_MISSION_DECK = false`
- `USE_ANGRY_WOLVES_MISSION = false`

This restores `LEGACY_MISSION_DEFS` and removes the revised 10-12 mission deck without touching the rest of the refactor.

## Restore Prior Special Spawn Behavior

Set these in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js):

- `USE_MISSION_ONLY_SPECIALS = false`
- `USE_WEIGHTED_MISSION_SPECIALS = false`

This re-enables legacy global wolf/black-sheep spawning through `LEGACY_GLOBAL_SPECIAL_SPAWN_WEIGHTS` and returns missions to the older single-special path.

## Revert Only Touch Controls

Set this in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js):

- `USE_NEW_TOUCH_CONTROLS = false`

That restores the previous touch timings, brings back double-tap swap as the main touch swap gesture, and leaves desktop controls untouched.

## Revert Only Audio Changes

Set this in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js):

- `USE_ENHANCED_CHAOS_AUDIO = false`

This keeps the game playable but removes the richer mission/special/chain audio layer, including the tuned chaos cues. If a full audio text rollback is wanted too, revert the small copy tweaks in [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html).

## Revert Only Egg/Turd Tuning

Set this in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js):

- `USE_TUNED_CLUTTER_SPAWNS = false`

That restores `LEGACY_CLUTTER_TUNING`, including start counts and the older no-soft-cap restock behavior.

## Revert Only UI Copy / Help Copy

Revert these files:

- [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html)
- [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css)

This removes the Next-card swap hint, shortened help text, and the updated mission/help wording without touching gameplay logic.

## Revert Mission Briefing / Audio Polish Pass

Set these in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js):

- `USE_MISSION_BRIEF_SPECIAL_CARDS = false`
- `USE_BRIEF_HELP_SHORTCUT = false`
- `USE_IOS_AUDIO_RESUME_FIXES = false`

This focused follow-up pass touches the same four files but can be backed out piecemeal:

- Mission briefing layout changes:
  Set `USE_MISSION_BRIEF_SPECIAL_CARDS = false` to collapse the new two-card briefing back to a simpler single-special summary, then revert the mission-brief markup/styles in [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html) and [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css) if a full visual rollback is wanted.
- Help-button-before-start changes:
  Set `USE_BRIEF_HELP_SHORTCUT = false` to hide the mission-brief `?` button immediately. The shared help modal still works from the HUD button.
- Special explainer copy/rendering changes:
  Set `USE_MISSION_BRIEF_SPECIAL_CARDS = false` to stop rendering the new per-special explainer cards. If needed, revert the briefing-copy helpers in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js) without touching mission logic.
- iPhone audio lifecycle changes:
  Set `USE_IOS_AUDIO_RESUME_FIXES = false` to remove the added `pageshow` / `focus` / visible-resume nudges and the safe pre-play resume attempt. Existing sound enable/disable behavior remains.

## Revert V2 Mission Drawer / 9x12 / Wolf Mud Pass

This pass touches [index.html](/Users/kevinhegg/Documents/angry-wolves/index.html), [styles.css](/Users/kevinhegg/Documents/angry-wolves/styles.css), and [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js).

- Revert only the board geometry:
  Change `V2_COLS` from `9` back to `8` and restore the prior `GAME_VERSION` string. This keeps the rest of V2 intact but separates score/leaderboard metadata again.
- Revert only the mission drawer:
  Remove the `missionDrawer*` markup/styles and restore the V2 startup branch in `init()` / `restart()` to the previous toast-or-briefing behavior. The legacy mission briefing modal is still preserved.
- Revert only the mobile top offset:
  Set `--v2-mobile-browser-offset: 0px` in the mobile `body.refreshV2` CSS block and remove the V2 `#app` margin-top/min-height overrides.
- Revert only Angry Wolf mud fallback:
  Change `wolvesExplode()` back to using `scatterNearbyOverlays()` / `markOneFootprintOverlay()` and remove `placeMudTrapsForPiece()`. This restores the previous opportunistic mud placement.
- Revert only debug screenshot helpers:
  Remove the `debugBoard=empty`, `debugBoard=mud_lane`, and `debugBoard=wolf_hit` cases from `applyDebugBoardPreset()`. All helpers are query-gated and off by default.

## Full Feature Revert

Fastest safe option:

1. Leave the branch unmerged.
2. Revert `game.js`, `index.html`, and `styles.css` to their pre-pass state.

Config-only fallback:

1. Set every feature flag above to `false`.
2. Keep the branch for review, but the runtime behavior will be close to legacy mode.

## Legacy Snapshots Preserved In Code

The refactor intentionally keeps restorable legacy data in [game.js](/Users/kevinhegg/Documents/angry-wolves/game.js):

- `LEGACY_MISSION_DEFS`
- `LEGACY_MISSION_SPECIAL_LIBRARY`
- `LEGACY_GLOBAL_SPECIAL_SPAWN_WEIGHTS`
- `LEGACY_CLUTTER_TUNING`

These exist so rollback does not depend on reconstructing deleted behavior.

## 2026-09-05 — Bring them home rescue story

The default page now runs a separate three-chapter rescue game. The existing falling-block engine and its CSS were preserved byte-for-byte at the start of this pass.

- Immediate per-visit rollback: open `classic.html` or use `?story=0` on the default URL.
- Existing `v1`, `v2`, and `legacy` query parameters are forwarded to `classic.html` unchanged.
- Restore the old default without touching any prior gameplay edits: copy `classic.html` over `index.html`. The unused `rescue.js`, `rescue-engine.js`, and `rescue.css` may safely remain.
- Exact pre-pass copies of `index.html`, `game.js`, `styles.css`, `ROLLBACK_PLAN.md`, `ANGRY_WOLVES_CONTEXT.md`, and `README.md` are in `.codex-safety/story-rescue-before/`. These include the uncommitted work present when this pass began. Do not reset to Git HEAD to undo this pass; that would discard earlier work.
- Story tuning lives in `rescue-engine.js`: `CHAPTERS` sets animal goals, animal variety, and initial wolf distance. `rescue()` sets the 5/8 herd thresholds. `bark()` sets the three-step rescue margin and ten-step distance cap. `create()` gives one bark per field.
- Story local storage uses only `aw-rescue-sound` and `aw-rescue-best`. Classic scores and leaderboard settings are separate.
- Restore documentation selectively from the snapshot if desired; do not overwrite later edits wholesale.

See `RESCUE_STORY_NOTES.md` for reasoning and verification. Nothing was committed, pushed, merged, or published by this pass.

## Rescue 2.0 — 2026-09-05

Previous published game: commit `2c7b000`. Exact pre-update runtime and documentation copies are in `.codex-safety/rescue-v2-before/`.

- Restore the earlier rescue game by restoring only `index.html`, `rescue.js`, `rescue-engine.js`, and `rescue.css` from that snapshot. Extra service/audio/share files may remain unused. Preserve unrelated work.
- Change wolf movement in `rescue-engine.js: wolfStep()` and rest awards in `REST_BONUSES` to retune this version.
- `pipUsed` in `rescue.js` deliberately persists across field retries and resets only for a new adventure.
- The leaderboard category is `rescue-v2`. Badge indices 0–9 in `rescue-services.js` are permanent because the existing sheet stores them with the initials. Do not reorder them.
- No Apps Script changes are required for this version. It uses the already-deployed endpoint and existing columns. The QA test category is `rescue-v2-qa` and is not displayed to players.
- Public navigation no longer links to the old falling-block game. Legacy assets remain preserved.


## Rescue 2.1 — flow and cache repair

This supersedes the historical per-visit rollback links above. Root and `classic.html` now route to `play/2.1/`; old query parameters no longer opt into the falling-block game. Published releases contain their own runtime assets. For a future release, use a new numbered folder to avoid Safari combining cached entry pages with newer scripts.

- Previous published release: `1fc6db9`. Pre-change runtime copies: `.codex-safety/rescue-v21-before/`.
- Restore a prior release deliberately from its Git version; do not recreate player-facing classic links as a routine rollback.
- Top-board limit is `LIMIT = 20` in `rescue-services.js`. The sheet retains its history; only the highest 20 rescue scores appear. A new tied score does not displace an older score.
- Rank is added to the share image only after a matching public score is returned. Review-pending submissions do not claim a rank.
- Run `node scripts/package-rescue.cjs` after source changes, and include the generated release files in the same commit.


## Rescue 2.2 — Safari audio, identity and sharing

The previous release remains intact in `play/2.1/`. Root and classic redirects now point to `play/2.2/`. Restore the redirects to 2.1 for a release rollback without changing score history.

Audio requests `navigator.audioSession.type = playback` where supported, before creating/resuming Web Audio. Muting returns it to auto. Sound is still initiated by a gesture; no microphone access is requested. Browsers without this API retain the existing sound path and may need Silent Mode off.

Badge IDs 0–9 retain their original meanings. IDs A–J add animal variations without changing the four-character sheet format. The new picker offers ten animals; an already-selected legacy badge remains available. Do not reorder the badge arrays or IDs. Initials and badge drafts save on input/change and survive dialog reopening even when storage is unavailable within the same page session.

Native sharing sends a PNG plus the game URL, with no duplicate score caption. Targets that cannot receive files get only the link.


## Rescue 2.3 — carried boards and bounded scoring

`play/2.2/` remains intact. To roll back this release, restore root and classic redirects to that directory. No historical sheet rows were renamed or deleted.

- `create(chapter, rng, carriedBoard)` copies the outgoing board for the next field. A retry restores that field’s entry board; goals, score, moves, wolf distance and bark reset. Pip usage for the rest award remains recorded across retries.
- `pressure(moves)` adds one wolf step starting at move 18 and two from 26. Set its return value to zero to disable. `rescue()` scatters newly generated animals after move 8, increasing by .03 per move to a maximum .6 chance of choosing a least-adjacent animal. Set `scatter` to zero to disable. Existing tiles are never rearranged by this tuning.
- `herdPoints(count)` is shared by score awards and previews. Base scoring and the existing score category remain unchanged; this release does not clear earlier leaderboard entries.
- Player profiles preload locked when three saved initials exist. Change player unlocks fields. Existing scores retain the identity used for their submission. Without authenticated player ownership, initials are not a safe key for renaming or deleting old records.
- Dialog buttons use native click activation instead of touch-release position checks, with a short duplicate-click guard. This avoids rejecting taps when Safari’s visible viewport moves during a touch.


## Rescue 2.4 — woodland details

Visual-only update: decorative overhead wire fence with wooden posts around dialog headings, plus inline SVG barnyard and conifer trail endpoints. The heading still receives programmatic focus for screen-reader announcements; only its default outline is suppressed. Interactive controls retain their focus indicators. Existing game rules are unchanged. Previous release remains in `play/2.3/`.

Verified the intro and active field visually at 393 × 650; all 37 existing tests pass.


## Rescue 2.5 — animal calls

Original locally synthesized sheep, pig, hen, cow, dog and wolf calls live in `rescue-voices.js`. Tune pitch, duration, modulation, noise and vocal formants in `VOICES`. `rescue-audio.js` caches the short/full buffers and replaces earlier herd calls instead of stacking them. Wolf responses follow actual distance changes, including Pip’s bark, and are delayed slightly after the herd sound. No response plays when distance is unchanged at a clamp. Muting/backgrounding closes the audio context and cancels sounds. The prior release remains intact in `play/2.4/`.

39 tests pass, including non-silent bounded voice generation, short/full variants, replacement of selection sounds, delayed wolf playback, and existing gameplay/regression tests. These checks do not establish perceived realism or audible output on a physical iPhone. The help screen includes buttons to audition each voice.


## Rescue 2.6 — reversible magic-cat trial

Checkpoint tag: `checkpoint/pre-magic-cat-2.5`, commit `ef94e39`. Exact pre-experiment copies of the four changed core files are in `.codex-safety/pre-magic-cat/`. The existing unrelated Sheet/document changes were not included or reset.

Full play rollback: change the root `index.html` redirect and both redirects/links in `classic.html` to `play/2.5/`, commit and publish those entry changes. The previous directory remains self-contained. Do not reset the working tree or overwrite unrelated files. Anyone already on a 2.6 link can use the 2.5 release directly after a rollback.

Selective tuning: `rescue-engine.js` exports `CAT_SETTINGS`: enabled=true, firstChapter=1, chance=.25 per eligible rescue, minMoves=2, lifetime 2–4, cooldown=2. Set enabled=false to prevent new cats; an existing cat will still expire. To undo the extra wolf difficulty, restore chapter distances from 6/5 to 7/6 for fields two/three. Package edits into a new release directory before publishing.

The cat has type CAT=4, distinct from normal animal types 0–3; its artwork is icon 5 because icon 4 already represents the wolf. It never counts toward goals, points, herds or animal sound selection. Spawn only replaces a newly generated refill, at most one cat exists, and forced legal-herd generation preserves it. Successful rescues age it; mere selection, invalid moves and Pip do not advance the turn counter. Expiry and Pip removal use the same collapse/refill function as herds. Pip keeps the +3 wolf-distance effect but preserves other columns when removing a cat instead of shuffling them. A retry restores that field’s entry board and cat countdown.

Verification: 45 tests pass, including cat lifetime, no scoring, exact gravity, carry-over, one-cat limit, first-field exclusion and invalid actions. Browser play verified a naturally spawned black cat, its help text, Pip dismissal, and a separate 2→1→vanished lifecycle with no console errors. Simulated goal-aware whole-adventure completion with emergency Pip usage is 626/1000 versus 736/1000 before this experiment; no-Pip completion is 384/1000 versus 475/1000. Simulations are tuning evidence, not predicted human outcomes.


## Rescue 2.7 — explicit loss ending and more cat visits

Previous full release remains at `play/2.6/`; the cat-free checkpoint `checkpoint/pre-magic-cat-2.5` is unchanged.

A loss now sets play inactive and offers Play again from field one or Not now. Not now closes the dialog but leaves the lost board and controls disabled, with a clear finished message and a Play again link. Escape follows the same rest behavior. Replay resets the entire adventure, not only the lost field. Pointer clicks on dialog buttons must begin in that dialog generation; no screen-coordinate checks are used. This prevents a gesture begun on an earlier screen activating a newly appeared button.

Cat tuning: chance .25→.5, minimum field rescues 2→1, cooldown 2→1. One-cat cap and 2–4 rescue lifespan are unchanged. Restore those three settings to reduce frequency independently of the loss-flow fix.

47 tests pass. Browser play produced a real loss and verified the two choices, all-disabled resting board, and replay at the pasture with zero animals home. The exact Safari touch behavior remains subject to physical-device confirmation.

## Rescue 2.8 — multiple cats and magical bursts

Local checkpoint: `checkpoint/pre-cat-bursts-2.7` at `4eb4ada`. The complete prior release remains in `play/2.7/`. To play the prior rules immediately, serve/open that directory. To undo this experiment in source, restore the runtime files, packaging script and relevant tests from the checkpoint, then package a new version; preserve unrelated Sheet/document edits. Publication authorized by the user after local acceptance; publish this release on the existing Pages branch with its rollback tag.

`CAT_SETTINGS.maxCats=3` caps visitors. Each new cat has an independent 2–4 successful-rescue timer, carried with its tile through gravity and across fields. Existing arrival chance .5, firstChapter=1, minMoves=1 and cooldown=1 remain. Set enabled=false to stop new arrivals; existing cats still burst. Setting maxCats=1 reduces concurrency but retains bursts; use the checkpoint to restore harmless expiration.

At timer zero, the cat and its orthogonal animal neighbors clear before gravity. Neighbors count toward goals but award no points; selected-herd animals and overlapping blast neighbors count once. Each burst adds one wolf step. Other cats never chain-react. Goal completion retains last-turn priority over wolf arrival. Pip removes all cats quietly with normal gravity and +3 wolf distance, consuming no move and adding no blast points, rescues or penalty. The next burst areas have dashed outlines and a text warning; the guide explains the rules.

Verification: 49 dependency-free tests pass, including timer/board consistency over seeded games, overlapping bursts, no chain reactions, carry-over, Pip clearing all cats and the existing end-game flow. Browser play observed three simultaneous cats, a warning with three marked neighbors, a burst with two extra rescues, and Pip quietly dismissing the remaining two. Seeded goal-focused adventure completion was 444/1000 with emergency Pip versus 222/1000 resting him throughout; these are tuning checks, not human success predictions.

## Rescue 2.9 — gentler, two-faced cat trial

Previous published checkpoint is commit `40e7ac4`; the exact release is preserved in `play/2.8/`. Publication authorized by the user on 2026-09-06. The pre-release checkpoint is `checkpoint/pre-friendly-cat-2.8`. To remove cats from future games, set `CAT_SETTINGS.enabled=false` in `rescue-engine.js`, then package a fresh release. Set true to restore them. Tests can pass an override as the fifth `create()` argument; no dependencies or changes to the core herd scoring are required. Existing cats in an in-progress state finish their timers.

Defaults: maxCats=1 (was 3), chance=.25 (was .5), minMoves=2, goodChance=.65, minLife=2/maxLife=3, firstChapter=1. CAT=4 remains evil; GOOD_CAT=5 is friendly. Both are excluded from herds and preserved by forced-move generation. Pip dismisses either without a gift or burst. Timers never exceed three, including carried cats.

Evil cats retain the prior burst, neighbor-goal credit/no points, and extra wolf step. After the normal rescue and gravity, an expiring friendly cat converts itself plus its orthogonal animal neighbors into the type creating the largest connected herd through its tile. It tries each available animal; ties favor the largest unfinished goal, then animal order. Other cats are never converted. Transformation grants no immediate score, goal credit or extra wolf movement; players must whistle the resulting herd. A warm glow marks the gift. Distinct black faces show a wide grin/curved eyes versus amber eyes/fangs, with green versus plum tile treatments.

52 tests pass, including largest-herd selection, no immediate friendly score, cat exclusion, disabled arrivals, cap/timer invariants and existing evil behavior/flow. Browser play verified the friendly face, countdown and an 18-sheep gift with no console errors. Seeded whole-adventure goal-aware completion: emergency Pip 681/1000 (2.8:444); no Pip 479/1000 (2.8:222). This is comparative tuning evidence, not human-play prediction. All earlier checkpoints and unrelated Sheet changes are preserved.

## Rescue 2.10 — face-safe counters and visible evil-cat neighbors

Local UI update; production remains 2.9 pending publication. Prior release is preserved at `play/2.9/`, commit `6e851bc`. No gameplay or distribution rules changed. Cat countdowns are three dots in a reserved strip below the SVG face; lit dots indicate rescues remaining and the accessible label retains the exact number. Evil-cat neighbors have dashed outlines throughout the countdown, strengthened on the final rescue. They remain playable; freezing was a brainstorm, not an implemented rule. Guide copy makes this explicit.

Distribution audit: `node scripts/audit-animal-distribution.cjs` observes actual refills across 2,000 seeded adventures without changing RNG calls. Of 136,350 last-field refills: sheep 24.92%, pigs 25.14%, hens 24.86%, cows 25.08%. All 1,997 adventures reaching that field entered with zero cows: fields one and two contain only three species and the board carries forward. These are refill proportions before cat replacement or friendly transformation, not a guarantee of equal board counts at every moment. No cow weighting change was made.

52 existing tests pass. Browser verification at 393×650 confirmed the cat face ends two pixels above its counter strip, the grin stays visible, and the whistle remains within the viewport. No physical iPhone test is claimed.

### 2.10 follow-up — any three tiles, no freezing

The good cat now evaluates every available three-tile subset of its tile plus orthogonal animal neighbors, and every available animal type. It selects the largest resulting connected herd touching a chosen tile, with the existing unfinished-goal tie-break. If its own tile is excluded, it disappears and its column collapses/refills normally. Candidate evaluation accounts for that fall, treating the unknown new top tile as nonmatching; the actual random refill may extend the resulting herd. Only three tiles are assigned, and no immediate points or goal credit are awarded. Other cats remain untouched. Pip still dismisses it without a gift. Animal probabilities and challenge modes are unchanged.

`catNeighbors()` now supplies the visible evil-cat warning from arrival, including left/right/below on the top row and all four neighbors in the interior. The final-turn burst preview uses the same board geometry. These are playable marked tiles, not frozen tiles.

54 tests pass, including top-row/interior warning geometry, gifts that exclude the cat, gravity, and surviving tile validity. Seeded adventure completion with emergency Pip: 690/1000; median base score 2356 (unchanged versus 2.9). Without Pip: 475/1000, median base 2352 (2.9:2376). This change limits tiles converted but does not guarantee smaller herds or lower scores. Local changes remain unpublished; published rollback remains 2.9 (`6e851bc`).

### 2.10 final tuning — cat plus two neighbors

Supersedes the any-three follow-up above: the good cat always includes its own tile plus two orthogonal animal neighbors. It searches neighbor pairs and available animal types for the largest connected herd, retaining the unfinished-goal tie-break. It transforms in place, so there is no secondary collapse/refill. Existing evil warning and dot-counter changes remain. Production is still 2.9; this change is local.

55 tests pass, including all 36 cat positions and seeded transformations without extra movement. Comparing the same seeded tuning runs with the prior any-three implementation: mean gift herd 10.41 → 10.36, median 10 → 10, 95th percentile 17 → 17. Emergency-Pip whole-adventure completion 690/1000 → 693/1000; median base score 2356 → 2346. No-Pip completion and median base remained 475/1000 and 2352. This simplifies tile movement but does not appreciably reduce large herds or scoring.

### 2.10 latest tuning — cat plus one neighbor

Supersedes the cat-plus-two tuning above. The good cat transforms its own tile plus one orthogonal animal neighbor, choosing the animal and neighbor that form the largest connected herd. No secondary gap, gravity or immediate score is introduced. Guide, selection message, README and release package match this rule.

55 tests pass. Same seeded comparison: average gift herd 10.36 → 9.34, median 10 → 9, 95th percentile 17 → 16. Emergency-Pip adventure median base score 2346 → 2298, completion 693/1000 → 679/1000; no-Pip median base 2352 → 2322, completion 475/1000 → 470/1000. This modestly reduces gift strength while retaining large connections when the existing board supports them. Still local and unpublished; live remains 2.9.

### 2.10 publication — smaller opening herd

Publication authorized by the user. First-field setup now guarantees three sheep rather than four; the fourth tile retains its random animal, so naturally larger groups can still form. Carried boards and later-field rules are unchanged. Together with the cat-plus-one gift, face-safe dots and arrival-time evil warning, this is release 2.10. Previous production is saved at `checkpoint/pre-small-gift-2.9` (`6e851bc`) and `play/2.9/`. Disable cats via `CAT_SETTINGS.enabled=false` and package/deploy a fresh release if desired.

56 tests pass. Seeded first-field goal-aware play averages 4.02 rescues versus 3.47 before reducing the guaranteed sheep. First-field completion remains 1000/1000 for this strategy; this is a gentler opening adjustment, not a major difficulty increase. Whole-adventure emergency-Pip completion is 676/1000. Earlier 'local/unpublished' notes above describe preparation stages, superseded by this publication authorization.

## Rescue 2.11 — continuous wolf journey (local)

The wolf now carries its exact final distance between fields instead of resetting to chapter presets. Retrying a field restores that field's entry distance; a new adventure starts at the normal first-field distance. Last-turn goal completion still wins, including at distance zero; zero is carried exactly. The next rescue resolves normal wolf movement and loss rules. After the final rescue, the wolf slides to its new marker (450ms; no animation with reduced motion), and the transition dialog waits 900ms (350ms reduced motion) with a generation guard. The transition text reports the carried distance. This may change difficulty compared with the old preset reset.

57 tests pass, including carry at distances 0/1/4/8/10, field retry and fresh-adventure reset. Cat replacement is discussion only: existing cat rules remain unchanged. Published rollback remains 2.10 (`a039399`, `play/2.10/`). To undo just the carry behavior restore startField/transition/retry handling from that release and package a new version. Changes are not published yet.

### 2.11 dust-devil experiment (local, not published)

Supersedes cat appearances with one dust devil from field two. `WIND_SETTINGS` is the default rules configuration: enabled=true, maxCats=1, chance=.25, minMoves=2, minLife=maxLife=3, firstChapter=1, cooldown=1. Set enabled=false to stop new gusts; existing ones finish normally. The engine retains legacy cat rules for rollback tests, but new games spawn only DUST=6. The internal timer map retains its prior name for compatibility. Prior local wolf-fix/cat source copies are in `.codex-safety/pre-dust-devil/`; complete public rollback remains `play/2.10/` at `a039399`.

After each successful herd rescue and gravity, an existing gust rotates its orthogonal animal neighbors clockwise in compass order (above, right, below, left), skipping out-of-board positions. No animals are frozen. Invalid selections, transitions and Pip do not consume rotations. Newly spawned gusts start with three empty dots and do not rotate immediately. Dots fill for each completed rotation; after the third rotation, only the gust is replaced in place by the animal producing the largest connected herd through that tile. Tied animal types are selected uniformly using the game RNG; no goal-based tie preference. This awards no immediate points or goal credit. Pip disperses the gust early, with normal gap refill and +3 wolf distance, foregoing the final choice.

Inline SVG dust funnel and marked neighbors show the effect. Animal icons slide clockwise; a short original filtered-noise whoosh plays on a separate audio lane with existing Safari resume/mute handling. Reduced motion suppresses movement. Progress, board and continuous wolf distance carry between fields. The balance script now models the continuous wolf distance used by the controller.

64 tests pass, including every edge/corner rotation, conservation, three-turn completion, random tie choice, no immediate score, arrival timing, carry, Pip, audio routing/mute and existing wolf flow. Browser play verified 0→1→2→replacement, progress carried through a field transition, and a 393×650 layout with the whistle above the bottom edge. No browser errors; physical iPhone audio still needs device testing. No new dependencies or leaderboard/backend changes.

### 2.11 publication authorization

The user authorized production publication of the tested dust-devil version. Publish on the existing Pages branch; no merge to main. Previous production checkpoint: `checkpoint/pre-dust-devil-2.10` at `a039399`, with the complete earlier release retained at `play/2.10/`. This supersedes the local/unpublished status above. All 64 tests pass before deployment.

## Rescue 2.12 — delayed scattering dust devil (local)

Supersedes the continuous clockwise rotation. Gusts now enter only newly refilled top-row cells, beginning in field one after a randomly chosen 2–5 successful-rescue wait. Arrival has zero filled dots and is not one of the three countdown turns. Existing gusts age after each successful rescue; nothing scatters on turns one/two. After turn three and normal gravity, a Fisher–Yates shuffle permutes the surrounding eight animal tiles, including diagonals (five at an edge, three at a corner). It preserves animal counts and may legitimately leave matching-looking tiles in place. The gust then becomes the animal creating the largest connected herd through its own tile, with uniform random tie-breaking. Only that tile is converted; no score/goal credit is awarded automatically. Whoosh and movement animation occur only at the scatter.

A new 2–5 rescue wait begins after conversion or Pip dismissal; it does not advance while a gust exists. Active countdown, visit wait, board and wolf position all carry between fields. Retry restores the entry countdown and wait. Settings: `WIND_SETTINGS.enabled` disables new visits; waitMin/waitMax tune the interval. The active countdown remains three. User-facing guide, labels and outlined area reflect the new behavior.

67 tests pass: 36 board positions, interior/edge/corner affected areas, animal conservation, no scatter until turn three, no aging on arrival, top-row entry, largest-herd ties, visit-wait carry/retry and sound behavior. Seeded goal-focused adventure results: emergency Pip 782/1000 completed, median base 2304; no Pip 593/1000, median base 2320. These are tuning checks, not human outcomes.

This version remains local and unpublished. Previous production is 2.11 at `1f9b263`, fully preserved in `play/2.11/`; pre-edit engine/controller copies are in `.codex-safety/pre-scattering-wind/`. Restore the earlier release to revert, or disable arrivals and package a new version. No backend/leaderboard changes.

### 2.12 publication authorization

The user authorized publishing the delayed-scatter version. All 67 tests pass before deployment. Previous production is saved as `checkpoint/pre-scattering-wind-2.11` at `1f9b263` and in `play/2.11/`. This supersedes the local/unpublished status above. Publish only the game changes on the existing Pages branch; preserve unrelated Sheet/document edits.

## Rescue 2.13 — selection clarity, middle-column arrivals, staged scatter (local)

Selected scatter-neighbor tiles now explicitly retain the normal solid yellow outline and shadow; the dotted warning no longer overrides selection. No freezing is added. Gusts spawn only on newly refilled top-row cells in columns 2–5. If the scheduled arrival finds only outside-column refills, it waits at zero until an interior opening appears, preserving existing board tiles.

The scatter animates through two temporary permutations with short pauses before settling into the actual shuffled result (1400ms). These intermediate arrangements are visual only and consume no game RNG. Board interaction stays locked until 1500ms, and an end-of-field dialog waits 1700ms so it cannot hide the scatter. Generation guards prevent stale timers from acting on a restarted adventure. Reduced-motion users get the final arrangement immediately. Existing whoosh remains.

68 tests pass, including deferred edge-only refills and middle-column arrival bounds. Browser play verified a marked/selected animal has a solid 3px yellow outline, scatter feedback completes, and controls recover without console errors. Previous production remains 2.12 (`0188010`, `play/2.12/`); changes are local and unpublished. Revert the engine arrival filter and controller/CSS animation-selection changes to restore prior behavior, then package a new release.

### 2.13 publication authorization and version label

The user authorized publishing and requested a subtle version number. The opening screen now shows a small muted version label derived from `RescueServices.VERSION`, keeping it consistent with submissions and release packaging. Previous production is saved at `checkpoint/pre-scatter-clarity-2.12` (`0188010`) and `play/2.12/`. This supersedes the local/unpublished status above. All 68 tests pass before publication.

## Rescue 2.14 — compact scores, corner version, longer wind

Publication explicitly authorized. Leaderboard hides the decorative animal header, uses tighter title/copy/spacing, and puts scores into a 240px scroll block with five 48px rows visible. The return action stays outside the scrolling details. An eligible score form remains available under an 'Add your score' disclosure so it cannot push the initial five rows out of view. Opening-screen version text is replaced by subtle bottom-right labels on the game and dialogs.

Scatter now runs three temporary shuffle passes before the final result, lasting 2400ms. Input unlocks at 2500ms; field completion waits 2700ms. The synthesized wind sound lasts 2.4 seconds, with gentle noise pulses and faded ends, using existing sound toggle and Safari media routing. Rules and final permutation are unchanged.

68 tests pass. Browser verification at 393×550 with live read-only leaderboard data found five fully visible rows, a 240px list with 384px scroll content, and the return button bottom at y=498. Return action closes the dialog; version reads v2.14. Physical iPhone sound requires device acceptance. Previous production checkpoint: `checkpoint/pre-compact-scores-2.13` at `37c8cb9`, complete prior release at `play/2.13/`. No Sheet/backend edits are included.

## Rescue 2.15 — whole-tile scatter and longer adventures

Publication explicitly authorized. Scatter moves the complete animal buttons (background, border and figure), with grid bounds captured before animations begin. Existing three temporary arrangements, 2.4-second wind audio and input lock remain. Pip shows 'Send wolf back 3 steps' plus one filled/empty availability dot labeled as one bark per field; it is not a recharge timer.

First-field starting wolf distance is now 5, the middle of the 0–10 track. Subsequent transitions still preserve the final wolf position. Rescue goals rise from 12 / 12+12 / 10 of each to 14 / 16+16 / 12 of each (94 required animals versus 76). No scoring formula, rest bonus or wind frequency changes.

69 tests pass, including complete-tile scatter destinations, final-step victory, replay and distance carryover. Browser checked at 393×650: controls fit, initial wolf at 5, Pip use moved the wolf from 6 to 9 and emptied its indicator. No browser console errors. Seeded 1,000-adventure goal-aware simulations: emergency-bark policy 631 wins vs 774 previously; never-bark 358 vs 582. These are tuning comparisons, not human success rates. A larger trial goal increase was too severe and was reduced before release.

Rollback checkpoint: checkpoint/pre-longer-adventure-2.14 at efa784a; complete old release remains at play/2.14/. To undo just difficulty, restore CHAPTERS goals/story and initial distance in rescue-engine.js, then package a new release. To revert everything, point index.html and classic.html redirects to play/2.14/ and commit/push on the publishing branch. Wind can still be disabled with WIND_SETTINGS.enabled=false and repackaging. No Sheet/backend edits included.

## Rescue 2.16 — nasal oinks, spent-bark dot and higher goals

Publication explicitly authorized. Replaced the pig's generic pulsed voice with a dedicated two-part synthesized oink: moving rounded-to-nasal formants, rising/falling pitch, restrained throat noise and a pause between calls. Full sound lasts 720ms; short preview 300ms. Other voices and Safari playback routing are unchanged. Device listening remains the user's acceptance check.

Pip's dot is now open when available and filled when spent, with existing text labels preserved. Orchard requires 18 pigs and 18 hens; final field requires 14 of each animal. First field remains 14 sheep and starting wolf distance remains 5. Total minimum rescues: 106 animals. All 70 tests pass, including dot lifecycle and audio bounds/fades. Seeded tuning simulation gives 507/1000 wins with emergency bark and 264/1000 without, not a prediction of human success rates.

Prior production: checkpoint/pre-oink-goals-2.15 at dc150be, complete release play/2.15/. Roll back by pointing root/classic redirects to play/2.15/ and committing/pushing the publishing branch. To undo only goals, restore CHAPTERS orchard/final goals and matching story copy, then package a new release. No Sheet/backend changes included.

## Rescue 2.17 — Pip cannot disperse wind

Correction to the published gameplay: Pip still sends wolves back three steps and shuffles animals, but dust devils stay at the same indices with unchanged countdowns and visit waits. Animal-only shuffle excludes special tiles. Removed gust disappearance animation and corrected feedback, accessibility labels and help. Legacy cat-only dismissal remains for rollback compatibility. All 70 tests pass, including gust position/timer/wait preservation through a bark. Previous release play/2.16/ and checkpoint/pre-pip-wind-2.16 at 8c2ff05 remain available for rollback via root/classic redirects.

## Rescue 2.18 — balanced opening and lower pig grunt

Opening boards choose one of the six permutations of counts 11/12/13 for sheep, pigs and hens, then Fisher–Yates shuffle the bag. No species is favored and no sheep are inserted. If no legal herd exists, count-preserving swaps gather a random species into a random horizontal triple. Larger herds are left to chance. Carried boards and normal refill rules remain unchanged. A four-species opening/refill experiment reduced simulated full-adventure completion to 21/1000 and was rejected; cows still join in field three. First-field goal-aware average rescues rose from about 4.84 to 6.2; full-adventure emergency-bark wins 571/1000 vs 237/1000 without bark. Simulations are not human win-rate claims.

Pig now uses a lower double grunt (620ms), rougher throat pulse and a brief nasal snort, with less vowel sweep; short preview 250ms. All 70 tests pass, including 1,000 balanced opening boards, species-count variation, playable herds, audio bounds and all carryover/flow tests. Physical-phone listening remains to be judged by the user.

Prior production checkpoint/pre-balanced-opening-2.17 at 1be3e43; old playable release play/2.17/. Restore redirects there and publish to roll back completely, or restore opening board construction and pig synthesis independently and package a fresh release. No Sheet/backend edits.

## Rescue 2.19 — stable board, root share link and visible score submission

Mobile warning and rescue feedback now share a permanently reserved 48px message area below the board. Header spacing recovers the extra 16px, so the board is not reduced to make room. The fit calculation measures this fixed message area instead of the conditional warning. Long rescue feedback can scroll within its space without changing board geometry. The main share/copy/caption URL is now https://kevinhegg.github.io/angry-wolves/; versioned release loading is retained for Safari cache isolation.

Score entry opens first and expanded. The Post Score button is associated with score-form using the HTML form attribute and placed outside the scrolling dialog details beside the existing return action. It hides on other views and after submission. Leaderboard dialogs anchor 12px from the visible viewport top. Scores remain scrollable. Restored the barn SVG's intended 2px stroke, which previous global version replacements had inadvertently changed.

70 tests pass. Browser play at 393×650 verified a constant 292px board while warning text appeared/disappeared, including field carryover. Completed an adventure, opened score entry, and verified Post Score at y=423–467 on a 393×550 viewport. At height 350, Post Score ended at y=267 and return at y=319. Empty submission correctly focused initials via native form validation; no test score sent. Browser console had no errors. Shared URLs are tested as the literal root URL.

Prior production checkpoint/pre-stable-layout-2.18 at c11bcb7, complete release play/2.18/. Root/classic redirects can restore that version. No game-rule or Sheet/backend changes included.

## Rescue 2.20 — four animals throughout

User explicitly chose all four animals in every field. Every chapter now uses four refill species. Opening counts are 8–10 of each, total 36, selected uniformly from 18 non-identical balanced count combinations, then shuffled. Count-preserving fallback still guarantees a legal herd of an unbiased random species. Field goals remain 14 sheep; 18 pigs and hens; 14 of each. Wolf rules, Pip, wind and board carryover remain unchanged. Help and final-field story no longer imply cows only arrive at the end.

71 tests pass. Added deterministic checks for all four refill choices in every chapter and updated the 1,000-opening distribution test. The two-adventure UI flow test now uses controlled legal herds instead of relying on its old strategy surviving every difficulty revision. Fixed the existing distribution audit to carry wolf distance and wind wait exactly as production does. Across 2,000 audit runs, each species accounted for approximately 25% of refills in each field; final-field entry averaged 10.61 cows among 108 reached final fields instead of zero.

Difficulty caveat communicated before publication: the simple seeded emergency-bark strategy won 21/1000 adventures; never-bark won 0/1000. This is not a human win-rate forecast. No compensating goal/wolf changes were made, so the requested four-species change can be judged independently. Prior production checkpoint/pre-all-animals-2.19 at b98b4ce and complete play/2.19/ remain for rollback. Restore root/classic redirects there to roll back. No Sheet/backend edits.

## Rescue 2.21 — gentler wolf movement

Requested curve: herd of 3 brings wolves one step closer; 4–6 hold them still; 7+ push them one step toward the forest. Selection previews already use the shared wolfStep function. Intro, help, desktop rule key and README now agree. Four-species distribution, rescue goals, Pip bark, and extra pressure from whistles 18/26 are unchanged.

72 tests pass, including every changed herd-size boundary and interaction with late-field pressure. Same seeded 1,000-adventure goal-aware simulation before/after: emergency bark 21 -> 569 wins; never bark 0 -> 107 wins. This demonstrates a substantial easing while retaining Pip's value, not a human win-rate prediction. Standalone goal-aware field completion is 965/1000, 896/1000, 924/1000 with emergency bark; standalone starts do not model carried board/distance, so full-adventure results are the relevant comparison.

Previous production checkpoint/pre-gentler-wolf-2.20 at e06395c; complete prior release play/2.20/. Repoint root/classic redirects there for rollback, or restore wolfStep and matching copy and package a new version. No Sheet/backend changes.

## Rescue 2.22 — opening-only version and immediate game restart

Version text is now only in the opening dialog. Removed the gameplay corner badge and desktop footer version; other dialogs hide the shared load-version element. Restart field becomes a larger 13px semibold Restart game link, preserving the existing footer height and board size. It immediately calls freshAdventure without a confirmation dialog, discarding unfinished progress and resetting field, score, wolf, Pip, wind and submission state. Existing generation guards invalidate delayed animations when restarting.

74 tests pass, including unfinished field restart state reset and version-label visibility. Updated old field-retry tests to retain transition coverage without expecting a removed behavior. Prior production checkpoint/pre-restart-game-2.21 at f7b75e6, release play/2.21/, remain for rollback via root/classic redirects. No game balance or Sheet/backend edits.

## Rescue 2.23 — three shared Pip barks

Pip starts each adventure with three barks, usable in any field. Each use decrements one charge; remaining charges carry through chapter transitions rather than replenishing. Three dots show open=available and filled=spent, plus a remaining-barks text label. Restart restores all three. Wolf retreat, animal regrouping and preservation of dust position/countdown are unchanged. Rest bonuses still count fields in which Pip was not used, not remaining charges. Updated help and chapter transition copy accordingly.

75 tests pass, including spending multiple barks in a field, carrying 1 and 0 charges between fields, rejecting a fourth use, restoring three on restart, and preserving field-based rest bonuses. The anti-farming bound rises to 44 moves because three barks can buy nine moves at full pressure. Simulation/audit tools now carry charges as production does and compute rests by whether a field consumed a charge. Same seeded 1,000-adventure emergency-bark strategy: 735 wins vs 569 with one bark per field; never-bark remains 107. Not a human win-rate claim.

Previous release play/2.22/ and checkpoint/pre-shared-pip-2.22 at c66884c remain for rollback via root/classic redirects. No Sheet/backend edits.

## Rescue 2.24 — cows join in the orchard

Requested progression: field one has only sheep, pigs and hens, with a shuffled opening count mix of 11/12/13 assigned without species preference. Cows enter normal refills in field two and remain available in field three. The carried board is not replaced or seeded at transitions. Goals, wolf curve, shared three-bark pool, pressure and rest bonuses remain unchanged. Orchard story and help explain building cow herds ahead of the final field.

75 tests pass, including opening balance and every available refill type per chapter. Across 2,000 audit adventures, field-one refills were 32.98/33.41/33.61% and zero cows; orchard/final refills were about 25% each. Final-field entry averaged 9.43 cows. Same seeded 1,000-adventure strategy: emergency-bark wins 979 vs 735 in 2.23; no-bark wins 681 vs 107. This is substantially more forgiving and was explicitly communicated; these are simulation comparisons, not human win-rate claims.

Previous production checkpoint/pre-orchard-cows-2.23 at 59a1428 and complete play/2.23/ remain for rollback via root/classic redirects. No Sheet/backend edits.

## Rescue 2.25 — herds of four advance the wolf

Requested base movement: 3–4 animals move wolves one step closer, 5–6 hold still, 7+ push back one. Updated shared rules, intro, help, desktop key and README. Existing late-field pressure, cows from the orchard, goals and three shared Pip barks remain unchanged.

75 tests pass, including movement boundaries and late pressure. Same seeded 1,000-adventure simulation: emergency bark 846 wins (previously 979); no bark 245 (previously 681). These are strategy comparisons, not human success forecasts. Prior checkpoint/pre-four-herd-pressure-2.24 at 1957cf0 and play/2.24/ remain for rollback via root/classic redirects. No Sheet/backend edits.

## Rescue 2.26 — customer URLs converge on the main game

User requested version URLs redirect to the base URL. Root index now hosts the game directly and loads seven immutable assets under play/2.26/. All 26 customer version index pages (2.1–2.26), including explicit index.html visits, and classic.html redirect to the root using a refresh query to bypass stale cached root redirects. Root clears only refresh from the displayed URL. Added canonical links. Packaging now maintains these redirects automatically. All older JS/CSS assets are retained; no gameplay changes.

76 tests pass. Browser verified play/2.21/ and play/2.1/index.html both end at the clean local root, show v2.26 opening screen and load 36 game tiles without console errors.

IMPORTANT: prior rollback instructions that merely point root at an old play folder are superseded: those entry pages now redirect back to root. The complete prior deployment is preserved in checkpoint/pre-base-url-2.25 at 238a6aa. For a complete routing rollback, restore index.html, classic.html, scripts/package-rescue.cjs, tests/rescue-release.test.cjs, rescue-services.js and all play/*/index.html files from that checkpoint, preserving unrelated work, then commit/push. For future gameplay rollback while retaining base URLs, restore old runtime sources and package them as a new version. No Sheet/backend edits.

## Rescue 2.27 — visible submission feedback and smoother wind

Investigated report that changing initials/badge would not post. Live read-only board was full with cutoff 3238; no production score was sent. Confirmed UI defect: eligibility, rejection and review messages were below the player form inside scrolling content while the submit button was pinned outside, so the reason for a disabled/unsuccessful post could be off-screen. Status now stays directly above Post Score, outside scrolling content, across errors, review and success. Submission normalizes and snapshots the displayed initials/badge and persists that exact draft before the request; saving feedback names the player. Specific cause of the user's past attempt remains unconfirmed without the requested initials/status message; no claim of a backend fix.

Wind synthesis uses two swept low-pass stages plus a low-frequency/DC filter and three smooth swells over the same 2.4-second scatter. Lower sharp-change energy is regression tested. No gameplay or Sheet/backend changes.

78 tests pass, including changed player -> lock -> post -> reload -> post again with the same badge, plus smooth wind bounds. Local browser fixture with stubbed score service (outside repo, not packaged) verified NEW with cow badge sends NEWE, shows rank confirmation, persists as locked across reload and submits again. No console errors and no test leaderboard writes. Existing moderation and top-20 qualification rules remain intact.

Prior checkpoint/pre-player-feedback-wind-2.26 at 17ddd85. Roll back by restoring prior root/runtime/package files from Git and republishing; historical customer URLs intentionally redirect to root. Do not restore the old root-to-version redirect pattern in isolation.

## v2.28 — Hungry Wolf, keyboard-free player editor, ending audio

Checkpoint: `checkpoint/pre-hungry-wolf-2.27` (d025fb2). Game title and share card now read Hungry Wolf; repository, URL, storage keys and leaderboard mode stay compatible. Three on-screen letter selectors replace keyboard entry; a pinned Save player / Change player button saves and locks initials and badge. Posting remains a separate pinned action. Ending turns skip wind presentation; wins use a plaintive howl and losses a deep howl. Wind is more softly filtered. Field summaries show shared Pips used and remaining. No balance rules changed.

Validation: 82 Node tests, diff whitespace check, browser save/change/post using isolated local service (OEW + wolf submitted as OEWA). No production QA score sent. iPhone sound character still needs listening on device. To roll back, restore these runtime files from the checkpoint and package as a new version; old customer version URLs redirect home and are not rollback targets.

## v2.29 — Score-read recovery and clearer Pip rewards

Checkpoint: `checkpoint/pre-score-recovery-2.28` (6ac8d48). Pip rest tiers change from 0/100/250/500 to 0/100/300/650; eligibility still counts fields without a bark. Intro and help explain the three shared barks, indicators, carryover and rewards. Leaderboard reads retry once after a network, HTTP or malformed-response failure using fresh URLs; POSTs are not automatically repeated. Refresh errors distinguish a confirmed received score from a failed read and label existing rows as previously loaded.

Evidence: direct production read returned 20 rows in 1.6 seconds; old browser read timed out; revised local browser with the real endpoint loaded 20 rows. This supports intermittent availability, not proof of a repaired Google backend. No backend or sheet data changed. 84 tests pass, including bounded retry and bonus tiers. Restore checkpoint runtime and package under a fresh version to roll back.

## v2.30 — Wolf ending beat

Checkpoint `checkpoint/pre-wolf-ending-2.29` (6f5f161). Terminal rescues hold the board for 2.6 seconds. At 0.5 seconds the wolf retreats/diminishes on a win or lifts/enlarges on a loss, accompanied by a new rounded, pitch-shaped howl. Suppress ordinary movement calls on terminal moves and avoid repeating the howl when opening results. Reduced motion omits animation while retaining timing. Generation guards prevent an abandoned ending from opening after Restart game. No balance changes.

Validation: 85 tests including deferred ending, exactly one call, restart cancellation, audio bounds, and terminal wind suppression; local browser victory and loss flow. To roll back, restore checkpoint runtime and package under a new version.

## v2.31 — Two-second ending and singular wolf copy

Checkpoint `checkpoint/pre-ending-timing-2.30` (c3fee4c). Start the result timer inside the ending animation callback and wait 2000 ms; omit the normal trail-motion animation on terminal turns. The immediate-panel report was not independently reproduced. Player-facing story, instructions, status and share-card wording now consistently use one wolf; repository URL is preserved. 85 tests pass, including verification that the result timer is not scheduled before the ending starts. Restore checkpoint runtime and repackage under a fresh version to roll back.

## v2.32 — Remove opening herd preselection

Remove the intro action's lingering select(30) call. Opening and restarting now leave selection empty and the whistle disabled until the player chooses a herd. 86 tests pass, including a controlled opening board that would previously select a herd. This was present in current source, not a fresh-link behavior. No balance change.

## v2.33 — Clear select-then-whistle prompts

Empty selection shows Choose a herd and Tap 3+ matching animals. A selected herd shows Whistle N home and Tap Whistle to bring them home. Opening preselection remains removed. Release commit `3dd0ed3`.

## v2.34 — Bug, logic, mobile UI and language audit

Checkpoint: `checkpoint/pre-audit-2.33` at `3dd0ed3`. Preserve the existing wolf rules, goals, dust-devil cadence and Pip bonus tiers. Dead-board/Pip fallback now swaps existing animals to gather a legal herd instead of overwriting species, correcting a count-preservation bug. Over the same 1,000-seed full-adventure strategies, emergency-Pip wins changed from 846 to 853 and never-Pip wins from 245 to 254; these are small simulation differences, not human win-rate estimates.

Fixed partial legacy initials, editing during a pending post, hidden late submission errors, stale leaderboard responses and field-transition dialog races. Returning players start with a compact saved identity; Change player expands the keyboard-free editor, Save player collapses it, and its controls remain pinned above Post/Back. Dialog details scroll while primary actions remain visible on short screens. Large desktop screens put the chapter heading beside the playing area to lift controls without shrinking the board. Wolf feedback respects the endpoints; restarted adventures stop previous audio. Updated current instructions, sharing labels and README. Full evidence and recommendations: `HUNGRY_WOLF_AUDIT.md`.

Validation: 93 Node tests pass and `git diff --check` passes. Browser checks at 393×650, 393×550 and 320×568; no production QA score posted. Local stub verified changed initials/badge sent as PEWE. Instrumented real browser ending delays were 2009ms for a win and 2003ms for a loss, with wolf animation and corresponding audio startup. This is not a physical iPhone listening check. No Sheet/backend changes, tracking, ads or monetization added.

To roll back, restore the runtime sources and root HTML from the checkpoint, then package them as a new release with matching version references. Do not point the root at an old `play/2.x/` index: historical entry pages redirect home. Preserve unrelated work and backend edits.


## v2.35 — Retro audio refinement and a public-file-only Pages build

Checkpoint: `checkpoint/pre-retro-audio-2.34` at `efc45ed`. Preserve all game rules, goals, Pip bonuses, dust-devil timing and the two-second ending pause. Rounder additive synth voices use softer attacks and tails, less noise, quieter selection previews and more consistent output levels. Pig calls use two nasal oinks; the wind has a quiet swept tone beneath its filtered gusts. Ending howls last 1.82 / 1.92 seconds, within the result pause. New calls release the previous voice over 18ms to avoid abrupt cutoffs. Gate/field-complete cues use soft triangle notes. No recordings, soundfonts or dependencies were added. Help now previews wind and both ending howls as well as the animal calls.

The opening screen adds a small copyright link. `COPYRIGHT.txt` reserves only applicable rights and permits game/scorecard sharing; it does not establish copyrightability or trademark clearance. The name, public URL and repository visibility remain unchanged.

Pages now uses `.github/workflows/pages.yml` and `scripts/build-site.cjs` to publish only root entry pages, the notice and versioned runtime files. Old runtime files remain for cached entry pages; old version entry URLs still redirect home. Development notes, tests and Apps Script source are excluded from the Pages artifact. This does not hide the public repository or browser-delivered game code. A private-source/public-Pages setup still requires an eligible GitHub plan or a separate public build repository.

Validation: 96 Node tests pass, including output levels, finite samples, howl lengths, replacement-voice fades and the exact public file allowlist. Browser checks cover sound startup for all ten preview buttons and the opening/Help controls at 393×550 and 320×568. Physical iPhone listening remains a player acceptance check.

To revert audio, restore `rescue-audio.js` and `rescue-voices.js` from the checkpoint and package under a fresh version; keep the public-file-only workflow. Full runtime rollback follows the usual fresh-version process. Do not revert Pages to copying the repository root merely to undo a sound change. `main` and unrelated Sheet/backend work remain untouched.
