# Hungry Wolf · Bring them home

A small, mobile-first rescue puzzle in three chapters. The gate was left open; bring the animals through the pasture and orchard to the barn before the wolf arrives.

[Play Hungry Wolf](https://kevinhegg.github.io/angry-wolves/). The repository keeps its original `angry-wolves` name.

## How to play

- Select 3+ matching animals touching horizontally or vertically. Nothing is preselected when a game starts.
- Press **Whistle** or select the same herd again to send it home. Empty spaces refill from above.
- For the first 14 whistles in each field, herds of 3–4 bring the wolf one step closer; 5–6 hold it still; 7+ push it one step toward the forest. The wolf starts five steps away and cannot retreat beyond ten.
- Field goals: **14 sheep**, then **18 pigs and 18 hens**, then **14 of each animal**.
- The opening board has 11, 12 and 13 sheep/pigs/hens, with those counts randomly assigned to species. Cows join refills in the orchard. Rescue goals do not bias the refill species. At least one herd is playable; larger herds occur naturally.
- **Pip, bark!** sends the wolf back up to three steps and regroups the existing animals without using a move. There are **three barks for the whole adventure**, usable in any field. Open circles are available; filled circles are spent. Barks never replenish between fields.
- Pip's bonus is awarded once, on winning: **350 points with two barks unused**, or **1,000 points with all three unused**. One or zero barks unused earns no bonus. Existing leaderboard scores retain the bonuses earned under their original rules.
- The board, wolf distance, remaining barks and dust-devil countdown carry between fields. Only the field goals and move-pressure counter reset.
- Dust devils arrive in one of the four middle columns of the top row after a random 2–5-rescue wait. If no middle column refills, the gust waits. Arrival does not fill a dot. After three further rescues, gravity falls first, then the gust scatters up to eight neighboring animals, including diagonals. It becomes the animal that forms the largest herd; ties are random. This transformation awards no immediate points. Pip leaves the gust's position and countdown unchanged.
- Later refills become more scattered. From whistle 15 in a field: herds of 3–5 move the wolf two steps closer, while 6+ hold it still. From whistle 30, every herd moves it two steps closer. The wolf’s eyes glow red at whistle 15 and grow larger at whistle 30. The trail labels the next whistle; a warning appears before each threshold and selecting a herd previews its movement. The later rule prevents extending a field indefinitely with large herds.
- The last gate closes before a winning whistle can bring the wolf into the pen. The winning preview and wolf marker show this outcome.
- On phones, landscape shows a rotation prompt and quick instructions. Open popups, selections and in-flight game animations resume when you turn back to portrait.
- On laptops and desktops, the same portrait interface sits centered horizontally and vertically inside a rounded frame over a woodland background. Desktop popups share that center. The board grows with the available height, with compact controls in short windows. Mouse clicks select a herd and operate every control; click Whistle or the selected herd again to rescue it.
- There is no clock. Sound is optional; use the speaker control or the sound test under **?**.
- **Restart game** immediately starts a fresh adventure. After a loss, **Play again** starts field one and **Not now** leaves the finished board inactive.
- Winning adventures can join the top-20 leaderboard with three letters and an animal badge. Save player locks the choice; Change player unlocks it. Existing scores retain their original names. Share creates an illustrated score card and includes the main game URL. Daily cards carry the gold challenge frame, prominent Daily Challenge title, challenge date and any verified rank.

Keyboard: Tab into the board, arrow keys move focus, Enter selects, Space whistles, Escape clears selection.

## Daily challenge and Leaderboards (v2.46 feature)

The daily puzzle changes at midnight Eastern, with repeatable seeded animal arrivals, wind and Pip regrouping. The existing board carries between fields; cows join orchard refills. Daily adventures and unposted results resume after a reload on the same device. Daily play requires working browser storage; free play remains available without it. During a daily run, **Restart game** becomes **Give up** and returns to the daily/free-play chooser without beginning another run.

**Leaderboards** has two tabs: **Daily Challenge** (default) and **All-Time**. Daily shows current standings and your exact rank against all eligible players, with a pinned You row if you are outside the top 20. Choose past dates for their standings or Daily records for scores across dates, including late posts. All-Time keeps the original adventure scores. First place is Leading during an open challenge. Earlier scores win ties; each player contributes their best eligible daily score. Refreshes retain the last valid standings on failure. Standings currently come from the published score sheet and are provisional. Official final results, gold winner badges, daily-win counts and the server clock require the backend activation described in [LEADERBOARD_CONSOLIDATION.md](LEADERBOARD_CONSOLIDATION.md). After a daily win, **Play free** starts a fresh random board. The opening screen marks today complete and keeps the saved daily result available for posting. Each browser/device can start once per day. A win, loss or Give up consumes that attempt. Reloading resumes the same run; changing player initials or badge does not reset it. Daily play uses a gold header and board border. The next day’s puzzle becomes available at midnight Eastern. Free play remains available.

The compact **Game menu** is separate from **How to play**. An active daily attempt offers **Continue daily adventure**. After a win, loss or Give up, **Start free play** is the only new-game action until the next day; **View daily score** only opens an unposted result. Help and leaderboards return to the menu or score they came from. Viewing a saved daily score preserves an unfinished free-play game in the current page. Modal actions stay fixed beneath one scrolling content area; leaderboards scroll their score rows, and player editing uses its own view with **Save player** before **Post score**.

See [DAILY_CHALLENGE_SETUP.md](DAILY_CHALLENGE_SETUP.md) for the data flow and maintenance notes.

## Develop and verify

No dependencies. Serve this folder with any static server:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/`. The root page uses the packaged release assets, so run the packager after editing runtime source files:

```sh
node scripts/package-rescue.cjs
node --test tests/*.test.cjs
node tests/rescue-balance.cjs
node scripts/audit-animal-distribution.cjs
git diff --check
```

The balance script compares seeded automated strategies, including complete adventures with carried state. These are tuning comparisons, not estimates of human win rates.

## Files

- `index.html`, `rescue.css`, `rescue.js`: game interface and adventure flow.
- `rescue-engine.js`: independent game rules.
- `rescue-daily.js`: daily dates, random streams and shared leaderboard aggregation.
- `rescue-voices.js`, `rescue-audio.js`: synthesized calls, gesture-based audio and recovery.
- `rescue-services.js`: score-sheet connection, player encoding and submission payloads.
- `rescue-share.js`: local PNG card generation and native sharing.
- `scripts/package-rescue.cjs`: copies runtime assets and maintains historical URL redirects.
- `HUNGRY_WOLF_AUDIT.md`: September 2026 audit, fixes, remaining priorities and launch recommendations.
- `ROLLBACK_PLAN.md`: checkpoints and historical experiments, including the retired cats.

## Release and rollback

Players use `https://kevinhegg.github.io/angry-wolves/`. Release **2.51** simplifies later wolf movement: from whistle 15, herds of 3–5 bring it two steps closer and 6+ hold it still; from whistle 30, every herd brings it two steps closer. The trail preview and help copy match these rules. Restart game dims and disables after three Free play restarts until the orchard. The masthead wolf has a CSS-only red-eye pulse, suppressed by reduced-motion preferences. Official winner finalization remains inactive pending Google authorization. The root loads immutable assets from `play/2.51/`; the version appears only on the opening screen. All historical `play/2.x/` entry pages and `classic.html` redirect to the main URL. The temporary refresh query bypasses old cached redirects and is removed from the address bar.

For a new release, update the version in root HTML, `rescue-services.js`, the packager and release tests, then package and verify. Keep `GAME_URL` at the root. The Pages workflow publishes `tune/v2-clarity-economy-audio`; no merge to `main` is required. `scripts/build-site.cjs` builds a public artifact containing only the entry pages, copyright notice and versioned runtime assets. Backend source, tests and development notes are excluded. Confirm the Pages build, published bytes and final browser URL before reporting a release as live.

To roll back, restore the chosen checkpoint's runtime sources and package them under a new release version. Historical customer URLs intentionally open the current game; they are not independent rollback targets. Preserve unrelated work and score-sheet changes.

The leaderboard posts to a public Google Form and reads a published CSV containing only approved score columns. The spreadsheet and raw form responses remain restricted to the owner. A sheet formula rejects malformed names, implausible values, replayed nonces and durations outside the allowed range before copying a row into the public feed. Profiles and daily adventures persist on the device; free-play progress does not survive a reload. Google may cache the published feed for several minutes, so a posted score can take a moment to appear. This is a casual honor-system board, not a server-verified competition.

## Rights

Copyright © 2026 Kevin Hegg. See [COPYRIGHT.txt](COPYRIGHT.txt) for the rights notice and permission to share game links and generated scorecards. There is no open-source license.
