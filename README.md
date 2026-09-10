# Hungry Wolf · Bring them home

A small, mobile-first rescue puzzle in three chapters. The gate was left open; bring the animals through the pasture and orchard to the barn before the wolf arrives.

[Play Hungry Wolf](https://kevinhegg.github.io/angry-wolves/). The repository keeps its original `angry-wolves` name.

## How to play

- Select 3+ matching animals touching horizontally or vertically. Nothing is preselected when a game starts.
- Press **Whistle** or select the same herd again to send it home. Empty spaces refill from above.
- Herds of 3–4 bring the wolf one step closer; 5–6 hold it still; 7+ push it one step toward the forest. The wolf starts five steps away and cannot retreat beyond ten.
- Field goals: **14 sheep**, then **18 pigs and 18 hens**, then **14 of each animal**.
- The opening board has 11, 12 and 13 sheep/pigs/hens, with those counts randomly assigned to species. Cows join refills in the orchard. Rescue goals do not bias the refill species. At least one herd is playable; larger herds occur naturally.
- **Pip, bark!** sends the wolf back up to three steps and regroups the existing animals without using a move. There are **three barks for the whole adventure**, usable in any field. Open circles are available; filled circles are spent. Barks never replenish between fields.
- Pip's bonus is awarded once, on winning: **100 / 300 / 650 points** for **1 / 2 / 3 fields without a bark**; zero for using him in every field. This counts fields without a bark, not unused barks.
- The board, wolf distance, remaining barks and dust-devil countdown carry between fields. Only the field goals and move-pressure counter reset.
- Dust devils arrive in one of the four middle columns of the top row after a random 2–5-rescue wait. If no middle column refills, the gust waits. Arrival does not fill a dot. After three further rescues, gravity falls first, then the gust scatters up to eight neighboring animals, including diagonals. It becomes the animal that forms the largest herd; ties are random. This transformation awards no immediate points. Pip leaves the gust's position and countdown unchanged.
- Later refills become more scattered. From whistle 18 in a field, the wolf advances one extra step; from 26, two extra steps. Even large herds cannot hold it off indefinitely.
- On phones, landscape shows a rotation prompt and quick instructions. Open popups, selections and in-flight game animations resume when you turn back to portrait.
- On laptops and desktops, the same portrait interface sits inside a rounded frame over a woodland background. The board grows with the available height, with compact controls in short windows. Mouse clicks select a herd and operate every control; click Whistle or the selected herd again to rescue it.
- There is no clock. Sound is optional; use the speaker control or the sound test under **?**.
- **Restart game** immediately starts a fresh adventure. After a loss, **Play again** starts field one and **Not now** leaves the finished board inactive.
- Winning adventures can join the top-20 leaderboard with three letters and an animal badge. Save player locks the choice; Change player unlocks it. Existing scores retain their original names. Share creates an illustrated score card and includes the main game URL.

Keyboard: Tab into the board, arrow keys move focus, Enter selects, Space whistles, Escape clears selection.

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
- `rescue-voices.js`, `rescue-audio.js`: synthesized calls, gesture-based audio and recovery.
- `rescue-services.js`: score-sheet connection, player encoding and submission payloads.
- `rescue-share.js`: local PNG card generation and native sharing.
- `scripts/package-rescue.cjs`: copies runtime assets and maintains historical URL redirects.
- `HUNGRY_WOLF_AUDIT.md`: September 2026 audit, fixes, remaining priorities and launch recommendations.
- `ROLLBACK_PLAN.md`: checkpoints and historical experiments, including the retired cats.

## Release and rollback

Players use `https://kevinhegg.github.io/angry-wolves/`. The current release is **2.37**. Root HTML loads immutable assets from `play/2.37/`; the version appears only on the opening screen. All historical `play/2.x/` entry pages and `classic.html` redirect to the main URL. The temporary refresh query bypasses old cached redirects and is removed from the address bar.

For a new release, update the version in root HTML, `rescue-services.js`, the packager and release tests, then package and verify. Keep `GAME_URL` at the root. The Pages workflow publishes `tune/v2-clarity-economy-audio`; no merge to `main` is required. `scripts/build-site.cjs` builds a public artifact containing only the entry pages, copyright notice and versioned runtime assets. Backend source, tests and development notes are excluded. Confirm the Pages build, published bytes and final browser URL before reporting a release as live.

To roll back, restore the chosen checkpoint's runtime sources and package them under a new release version. Historical customer URLs intentionally open the current game; they are not independent rollback targets. Preserve unrelated work and score-sheet changes.

The leaderboard uses the existing Apps Script deployment and Sheet, filtered to `rescue-v2`. Only explicit player submission writes a score. Profiles persist on the device; adventures and unposted results currently do not survive a page reload. The leaderboard is a casual honor-system board, not a server-verified competition.

## Rights

Copyright © 2026 Kevin Hegg. See [COPYRIGHT.txt](COPYRIGHT.txt) for the rights notice and permission to share game links and generated scorecards. There is no open-source license.
