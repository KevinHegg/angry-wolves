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
- Herds of 3–4 let wolves move closer; 5–7 hold them off; 8+ push them back.
- **Pip, bark!** pushes wolves back three steps and regroups the animals, once per field.
- Complete the visible animal goals to continue. A failed field can be retried without losing earlier chapters.
- There is no real-time clock. Sound is optional. Best completed-adventure points are stored on this device.

Keyboard: Tab into the board, arrow keys to move focus, Enter to select, Space to whistle, Escape to clear a selection.

## Files

- `index.html`, `rescue.css`, `rescue.js`: default rescue game and interface.
- `rescue-engine.js`: independent, testable game rules.
- `classic.html`, `game.js`, `styles.css`: preserved falling-block version, including its existing leaderboard integration.
- `RESCUE_STORY_NOTES.md`: design decisions, tuning evidence, and verification.
- `ROLLBACK_PLAN.md`: restoration instructions.

No install or build step; no dependencies. The folder remains compatible with static GitHub Pages hosting. The rescue game makes no leaderboard submissions and uses a separate local best-score key.

## Verify

```sh
node --test tests/rescue-engine.test.cjs
node tests/rescue-balance.cjs
```

The second command simulates 1,000 seeded games per chapter for random and goal-aware strategies. It is a tuning aid, not a human playtest.

## Classic version

Use the **Classic falling-block game** link, visit `classic.html`, or append `?story=0` to the default URL. Existing `v1`, `v2`, and `legacy` query parameters route to the classic page and retain their original behavior there.

The previous README is preserved with the pre-change snapshot in `.codex-safety/story-rescue-before/README.md`. Older V2 documents describe the classic version.
