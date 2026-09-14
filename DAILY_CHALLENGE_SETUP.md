# Daily challenge and score service — v2.42

The daily game and five leaderboard periods are implemented without a scheduler. `rescue-daily.js` derives the day from `America/New_York`; the first load after Eastern midnight automatically uses the new date seed.

## Player rules

- Daily play uses the same opening and repeatable animal, wind and Pip-regroup choices for everyone on a date.
- Free play remains random. The ordinary herd, Pip, wolf and field rules are shared by both modes.
- Daily retries are unlimited and explicitly chosen. After winning, the main action starts free play; the opening panel marks today complete and offers the saved result and an optional replay. A player contributes only their best approved score for each day.
- Weekly totals add those daily bests from Monday through Sunday Eastern.
- All time ranks the top 20 approved free-play and daily adventures without altering older scores.
- Daily records ranks the top 20 daily challenge results across every date, including non-winners and late posts. Keep only each player’s best score per challenge date before taking the top 20; earlier scores win ties. Rows show challenge date and biggest herd. Existing public history is included automatically.
- Daily winners keeps one champion for each completed day. Yesterday's winner appears on the opening panel for the next day only.
- A daily score must be posted on its challenge date in Eastern time. A game crossing midnight keeps its board. Late results can appear on All time and Daily records, but cannot alter Daily, Weekly or Daily winners.
- Daily progress, random-stream state and an unposted result persist in `hw-daily-adventure` local storage. `hw-daily-completed` separately records the latest completed date and personal daily best so free play or giving up a replay cannot erase completion. Existing v2.40 completed saves migrate automatically, including a win saved during the ending animation. Safari back-cache restores refresh the opening chooser without resetting active play. Free-play progress does not persist. Clearing browser data removes device history; blocked storage retains completion for the current page session only.
- During daily play, the board link says **Give up**. It clears the saved daily run and returns to the daily/free-play chooser.

## Data flow

The private spreadsheet is `hungry-wolves-data`:

`https://docs.google.com/spreadsheets/d/1-OrglIP8N9Ol9ftACs1CjAq494sAp18CDxU-V7g7xoc/`

It is restricted to the owner. The tabs are:

- `Form Responses 1`: raw form submissions; private.
- `public`: 48 migrated scores in rows 2–49 plus a validation/filter formula in A50; only this tab is published.
- `private` and `suspect`: retained for a future Apps Script moderation service; private.

The browser posts to the public Google Form in `rescue-services.js`. The form accepts 13 required fields and writes into `Form Responses 1`. The A50 formula copies only rows with the expected player/mode/version formats, bounded numeric values, a plausible duration, a first-occurrence nonce and a valid daily-title prefix.

The browser reads this published CSV:

`https://docs.google.com/spreadsheets/d/e/2PACX-1vS9kSCHFoHdSz4DIlk1F5mctQh7BtwCtYBJAHZxkFBSpGMeEq20Gob2HFQ9aTYv7-u6mXx1e9SVaNgd/pub?gid=0&single=true&output=csv`

`rescue-services.js` parses approved rows and uses `RescueDaily.standings` for Daily, Weekly, All time, Daily records and Daily winners. Published form timestamps are normalized to a safe ISO timestamp on the correct sheet date; form row order preserves earlier-score tie priority.

Google's published-sheet response allows cross-origin reads and may cache for up to five minutes. A resolved form POST therefore reports that the score was received; it does not claim an immediate public rank. Refreshing later verifies the rank from the public feed.

## Validation and limits

Run:

```sh
node scripts/package-rescue.cjs
node --test tests/*.test.cjs
git diff --check
```

Tests cover Eastern midnight and daylight-saving transitions, repeatable streams, exact resume, cow refills, all leaderboard periods, ties, historical scores, Google Form field mapping, CSV parsing and the daily **Give up** flow. Verify the anonymous form and CSV URLs with an unsigned request before release. Do not send a production QA score.

This no-OAuth fallback is intentionally lightweight. It keeps raw responses private and adds useful validation, but it does not provide Apps Script locks, cache-based rate limiting, a private review queue or a trustworthy POST response. The current formula scans the first 1,000 response rows. Extend every `A2:A1001`-style bound together before that limit is reached.

The bound Apps Script project remains in Drive as a future upgrade path. Google blocked its requested Sheets scope during authorization, so it is not deployed and the client does not reference it.

## Rollback

Baseline frontend commit: `8064df6` (v2.39). Restore the v2.39 runtime sources and package a fresh version; historical version URLs intentionally redirect home. Keep all existing score rows. To stop new submissions without changing the game, turn off **Accepting responses** in the Form. To disable the published board, stop publishing the `public` tab, then point a fresh client release at another read service. Neither rollback needs a scheduled job or Codex automation.
