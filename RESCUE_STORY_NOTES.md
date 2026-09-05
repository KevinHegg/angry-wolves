# Bring them home — story and gameplay revision

Date: 2026-09-05. Working branch: `tune/v2-clarity-economy-audio`. Local changes only.

## Diagnosis

The old default asked players to learn falling tetrads, rotations and swaps, large connected-herd thresholds, mission-specific specials, a second reward-herd cashout, and scoring modifiers together. Animal characters gave it personality, but the central player action and the wolves' role did not establish a clear story. Adding another explanation would leave that conflict in place.

## Implemented direction

The player is a shepherd bringing lost herds home. Pip the sheepdog helps once per field. Three chapters give the adventure a beginning, escalation, and finish:

1. **The open pasture:** bring 12 sheep home; eight steps of wolf distance. Three animal types teach grouping without a severe opening threat.
2. **Trouble in the orchard:** bring 12 pigs and 12 hens home; seven steps. Multiple goals require choosing useful herds.
3. **The last gate:** cows join the board. Bring 10 of each of four animal types home; six steps. The extra animal type fragments the board and makes planning matter.

The player selects a connected group and sees both its size and the wolf consequence before committing. Whistling is the main action, and barking is the emergency action. There are no hidden touch gestures. Keyboard and pointer input use the same rules.

A herd of 3–4 advances the wolves one step; 5–7 holds them still; 8+ pushes them back one step. Pip's single free bark regroups the board and adds three steps, capped at ten. Every chapter replenishes his bark. Invalid selections are free. If no legal herd remains, a small flock gathers without spending a move. Completing the objective on the last step wins before the wolves arrive.

Rescues count immediately toward goals. Chapter completion is explicit, with narrative transitions and a final safe-barn ending. Failed chapters have a gentle shelter-and-retry outcome. Retrying discards only that field's points and rescues, and keeps prior chapters complete. Larger herds earn more points: `10 × size + 2 × max(0, size − 3)²`. A separate local best records completed adventures.

## Presentation

Warm field-board colors, four distinct SVG animal faces, an illustrated barn and landscape on desktop, chapter colors shifting toward night, a wolf moving along a visible approach track, highlighted selected groups, and a compact mobile action row. Motion respects the reduced-motion preference. Optional synthesized whistle/bark/chapter cues require no audio assets. Sound defaults off. Native buttons, dialog focus handling, and a board operated with arrow keys support keyboard play.

## Verification

- Eight Node rule tests pass: connectivity boundaries, invalid moves, wolf movement, gravity order, bark limits, final-step victory, loss/final-state guards, and seeded multi-game invariants.
- Seeded simulation: 1,000 runs per chapter, both strategies using Pip when two or fewer steps remain. Final chapter: random choices win 607/1,000; goal-aware choices win 872/1,000. These are automated tuning comparisons, not human engagement evidence. Earlier fields are deliberately forgiving.
- Browser playthrough completed all three chapters and reached **Everyone is home**, with an actual total of 138 animals and 2,378 points in that run.
- Browser loss test advanced wolves to zero; **Try this field again** restored the final field while keeping the 57 animals from prior chapters in that separate run.
- Verified actual board selection, repeatable whistle actions, Enter/Space/arrow controls, invalid-selection feedback without a penalty, bark consumption, help without state advancement, restart cancellation, restart reset, and sound-toggle state.
- Inspected desktop and 390×844 / 375×667 viewport layouts. The four final-chapter goal cards do not overflow. At 375×667, the action row ends at approximately y=648. The footer can scroll on short displays.
- No rescue-game browser console errors observed. Audible output and physical iPhone Safari were not independently verified.
- Verified classic-link navigation opens the original V2 canvas game. Byte comparison confirms `classic.html` matches the previous index, and existing `game.js` / `styles.css` were not changed by this pass.

## Scope and remaining uncertainty

This is a deliberate replacement of the default gameplay, with the previous game retained alongside it. It adds no dependencies and does not modify the leaderboard or publish a deployment. A human playtest is still needed to judge enjoyment and long-term replay value. Runs are intentionally short, and progress within an unfinished adventure resets on reload; only sound preference and the best completed score persist.
