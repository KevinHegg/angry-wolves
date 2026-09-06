# Angry Wolves · Bring them home

A small, mobile-first rescue puzzle in three chapters. The gate was left open; bring the animals through the pasture and orchard to the barn before the wolves arrive.

## Play

Serve this folder with any static web server, for example:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

- Select 3+ matching animals touching horizontally or vertically.
- Press **Whistle** or select the same herd again to send them home.
- Herds of 3 move wolves two steps closer; 4 moves them one step closer; 5–7 hold them off; 8+ push them back.
- **Pip, bark!** pushes wolves back three steps and regroups the animals, once per field.
- Complete the visible animal goals to continue with the same board of animals. A loss ends the adventure: Play again starts at field one; Not now leaves the finished board inactive.
- Let Pip rest in 1 / 2 / 3 fields for a final bonus of 100 / 250 / 500. A bark on any attempt counts, even after a retry.
- Later refills become more scattered. From whistle 18 in a field, wolves advance one extra step; from 26, two extra steps. Building herds is useful, but indefinite score farming is impossible.
- There is no real-time clock. Sound is optional; the speaker button shows its state.
- Completed adventures can join the leaderboard with three letters and one of ten animal badges, or be shared as an illustrated score card.

Keyboard: Tab into the board, arrow keys to move focus, Enter to select, Space to whistle, Escape to clear a selection.

## Files

- `index.html`, `rescue.css`, `rescue.js`: default rescue game and interface.
- `rescue-engine.js`: independent, testable game rules.
- `rescue-voices.js`: original synthesized animal calls.
- `rescue-audio.js`: gesture-based audio initialization and recovery.
- `rescue-services.js`: existing score-sheet connection, badge encoding, and share captions.
- `rescue-share.js`: local PNG score-card generation and native sharing.
- `classic.html`: redirects old bookmarks to the current rescue game. The old `game.js` and `styles.css` remain for restoration from Git history.
- `RESCUE_STORY_NOTES.md`: design decisions, tuning evidence, and verification.
- `ROLLBACK_PLAN.md`: restoration instructions.

No dependencies. After editing the root rescue files, run `node scripts/package-rescue.cjs` to refresh the self-contained `play/2.7/` release. Future releases should use a new directory and update the root redirect, classic redirect, share URL, and packaging version together. The folder remains compatible with static GitHub Pages hosting. The leaderboard uses the existing Apps Script deployment and sheet, filtered to the `rescue-v2` scoring category. Only an explicit player submission writes a score.

## Verify

```sh
node --test tests/*.test.cjs
node tests/rescue-balance.cjs
```

The second command simulates 1,000 seeded games per chapter for random and goal-aware strategies. It is a tuning aid, not a human playtest.

## Live game and rollback

Play at https://kevinhegg.github.io/angry-wolves/play/2.7/. Pages publishes the current `tune/v2-clarity-economy-audio` branch. No merge to `main` is required.

The old game is no longer linked in the interface. Its files remain available for rollback. See `ROLLBACK_PLAN.md` for restoration instructions and `RESCUE_V2_NOTES.md` for the scoring, Safari, leaderboard, and share update.

## Magic cat experiment

From field two, one black cat can arrive in a puff of smoke. It cannot be herded. After 2–4 successful rescues it vanishes, leaving a gap that collapses and refills. Pip can scare it away immediately; when a cat is present he clears it instead of shuffling the board. The cat’s countdown carries between fields. Wolves start one step closer in fields two and three.

Checkpoint: `checkpoint/pre-magic-cat-2.5` (`ef94e39`). The complete previous playable release remains at `play/2.5/`. See `ROLLBACK_PLAN.md` for selective rollback.

The cat now has a 50% chance on eligible refills from the first rescue in fields two and three, with one rescue between visits. Only one cat can appear at a time.
