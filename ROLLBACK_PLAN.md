# Rollback Plan

This file covers the current mission-special pass and the planned V2 barnyard-core refresh work.

## V2 Mission Polish Pass

Files changed for this focused tuning pass:

- [game.js](/Users/kevinhegg/Documents/angry-wolves-tune-v2-mission-polish/game.js)
- [styles.css](/Users/kevinhegg/Documents/angry-wolves-tune-v2-mission-polish/styles.css)
- [MISSION_LADDER_V2.md](/Users/kevinhegg/Documents/angry-wolves-tune-v2-mission-polish/MISSION_LADDER_V2.md)
- [ROLLBACK_PLAN.md](/Users/kevinhegg/Documents/angry-wolves-tune-v2-mission-polish/ROLLBACK_PLAN.md)
- [refresh-assets/v2-mission-polish/](/Users/kevinhegg/Documents/angry-wolves-tune-v2-mission-polish/refresh-assets/v2-mission-polish/)

What this pass changes:

- Keeps the V2 mission ladder and chained loop intact.
- Scales early animal-herd missions down to 1 herd while the player has fewer than 2 completed jobs or is inside the first 2 runs.
- Delays `Barn Cash` until at least 5 completed jobs or 5 runs.
- Changes `Wolf Alert` wording to `survive 1 howl`.
- Changes `Rain Barrel` so it clears up to 4 nearby mud traps only; if no mud is nearby, it drops 1 egg.
- Adds clearer Pack Howl feedback: scrambled cells pulse and the banner says how many animals changed.
- Adds clearer mud trap feedback: a mud-eat splat animation, squelch sound, and `Mud ate X tile(s).` banner.
- Adds a restrained danger treatment plus start warning cue for Angry Wolves.
- Expands `?debugMissionFlow=1` logs for mission choice, targets, rewards, cashouts, and misses.
- Updates V2 score metadata to `GAME_VERSION = "v0.38-v2-mission-polish"`.

To revert only early mission scaling:

- Remove `v2ScaledMissionDefinition()` and use the selected mission definition directly in `newMission()`.
- Or change the scaling condition so it always returns the original `entry`.

To revert only the Barn Cash unlock delay:

- Restore `v2_barn_cash.unlockJobs` and `v2_barn_cash.minRunsStarted` from `5` to `4` in `LADDER_V2_MISSION_DEFS`.

To revert only Rain Barrel behavior:

- In `missionRainBarrelPiece()`, call `clearNearbyOverlays(piece, { max: 4, radius: 2 })` without the `types: [POWER.MUD]` filter.
- Restore the prior Rain Barrel copy in `SHARED_MISSION_SPECIAL_LIBRARY` and `missionBriefSpecialLines()`.

To revert only wolf/mud feedback:

- Remove the `scramble` and `mud_eat` cases from `drawBoardAnimations()`.
- Change `panicNearbyAnimals()` back to returning a count instead of changed-cell objects.
- Restore the previous Pack Howl and mud banner strings.

To revert only Angry Wolves presentation:

- Remove the `missionDanger`/`missionMarquee` class toggles in `syncMissionDrawerUI()`.
- Remove the matching CSS rules in `styles.css`.
- Replace `playMissionStartCue()` calls with the prior `playGameEventSound("mission_start")` behavior.

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
