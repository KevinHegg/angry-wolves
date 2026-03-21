# Rollback Plan

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
