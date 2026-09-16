# Leaderboards consolidation — v2.46

Implemented from `codex/leaderboard-consolidation`, based on production v2.45 (`7e4877713c3b6e908a210f4d925ba73a567adbd1`). The v2.46 frontend is released; the official results backend remains inactive. Production score rows, the Form, Sheet formulas, identities and saved games were not changed. The wolf pressure and Pip bonus rules changed for new games only; historical scores retain their original values.

## Interface and ranking

There is one Leaderboards panel. Daily Challenge opens by default; All-Time is the only other tab. Daily's date selector holds Today, past dates and Daily records across all dates. The old Weekly and standalone Winners destinations are removed; their underlying compatibility helpers remain available for older clients.

Daily ranks use the full approved history, keeping each encoded player's best eligible score on a date before displaying 20 leaders. A player is the existing three-letter plus badge identity, not an authenticated person. Rank is score descending, then the existing approved timestamp ascending, then encoded identity ascending. Repeated attempts never inflate the participant count. Your current rank and participant count remain above the list; an additional You row remains outside it when needed.

All-Time preserves the existing approved-adventure score metric, including compatible `rescue-v2` and `rescue-daily-v1` scores. It does not recalculate old bonuses or merge the old falling-tile modes. Gold daily-win counts decorate names without affecting order. Daily records still include each player's best result per date, including late posts; dated daily standings and winners exclude late posts under the existing rules.

Refresh runs on opening, after submitting, on focus/visibility/pageshow return, and every 60 seconds while the panel is visible. Requests coalesce; changing views or posting invalidates older responses. Polling stops on close and pauses while hidden, sideways or editing. Failed refreshes retain the last valid view and its original update time, explicitly marked Out of date. HTML or malformed score feeds are errors, not an empty ranking.

## Official results backend — activation required

The upgrade is saved in the existing bound Apps Script, but authorization and deployment are blocked; `LEADERBOARD_API_URL` in `rescue-services.js` remains empty. Until activated, the UI computes full live standings from the existing published CSV and explicitly says official winner status is unavailable. It does **not** award gold badges or infer finalized winners from a device clock. Google can cache this fallback feed for several minutes.

### Owner-session activation attempt — 2026-09-14

- Opened the Sheet's existing **Hungry Wolf Leaderboard** project as its owner.
- Backed up its original single `Code.gs` to `.codex-safety/leaderboard-apps-script-2026-09-14/Code.gs` (local safety copy; do not include in a release).
- Uploaded the four source files as one 31,287-character bundle into the existing `Code.gs`. The editor's saved readback exactly matched the generated file. Regenerate with `node scripts/build-apps-script.cjs /tmp/hungry-wolf-Code.gs`; do not also add separate copies of the source files to this project.
- `ALLOW_DIRECT_POST` is false. The web app rejects direct score POSTs before touching a Sheet; the current Google Form remains the sole intake path. GET reads and finalization remain available after authorization.
- Running `setupDailyFinalization()` reached Google's **This app is blocked** screen. Setup did not execute. No finalization tab, trigger, deployment or client endpoint was created, and no production score was submitted or changed.
- The script uses an Apps Script-managed **Default** Cloud project. A standard Cloud project would expose OAuth configuration, but switching away from Default cannot be reversed and revokes old project authorizations. No switch was made.
- Prepared, but did not create, a dedicated Cloud project. Google's creation form requires a billing-account choice. Paused before linking billing or creating the project; OAuth activation still requires verification afterward.

To activate official results in a later release:

1. The current source bundle is already saved in the bound project's `Code.gs`. For subsequent updates, run `node scripts/package-rescue.cjs` to keep DailyRules identical to the browser rules, then `node scripts/build-apps-script.cjs /tmp/hungry-wolf-Code.gs` and replace that one editor file. Do not change the Google Form intake or the public validation formula.
2. Authorize the project as the Sheet owner. Prior setup encountered a Google Sheets OAuth block; that must be resolved through the normal Google authorization flow. This branch does not change permissions or bypass it.
3. Deploy an Apps Script web app executing as the owner with anonymous GET access. The new request is `?api=leaderboards-2&board=daily&date=YYYY-MM-DD&player=ABC0&scope=standings` (empty date means Today). `board=alltime` retains the all-time metric; `scope=records` is Daily records. The browser uses this endpoint for reads only; keep the Form for submissions.
4. Put that deployment's `/exec` URL in `LEADERBOARD_API_URL`. The frontend requires the `leaderboards-2` response, server timestamp, complete participant count and personal rank. Confirm it works anonymously and cross-origin from the game origin.
5. Optionally run `setupDailyFinalization()` once as owner. It installs one hourly trigger; repeated setup does not duplicate it. GET requests also finalize eligible closed days, so neither Codex nor a daily prompt is required.
6. Verify today's Leading label, closing time, yesterday's dated final result, and gold counts against the Sheet. Package, rerun tests/build, and deploy the backend-connected client only when authorized. Never submit production QA scores.

The backend derives time and closing boundaries from the shared `America/New_York` schedule, including daylight saving. It waits one minute after midnight before finalization to allow Sheet calculation; late-post eligibility remains unchanged. A script lock protects an additive `daily_final_results` tab. One rectangular write per date stores a rank-zero completion marker plus **every** participant's final row. This avoids truncating winner/rank history or putting an entire day into one size-limited Sheet cell.

Finalized snapshots are immutable and win counts are derived from unique finalized dates. Repeated requests and trigger runs cannot award a second win. Missing source history, incomplete snapshots, duplicate markers, invalid archive metadata and lock/write errors fail closed. The source score tabs are read only. Empty finalized dates have no winner. On first activation, existing closed daily dates are backfilled using the preserved eligibility and tie rules; the original approved scores are not rewritten. Later score corrections can affect All-Time/Daily records, but changing an official final result requires a deliberate owner maintenance decision.

The new tab remains private; the API returns only score metadata already approved for public display, never source nonces or raw Form responses. Protect the tab from manual edits if other Sheet editors are added.

## Verification

Run from the repository:

```sh
node scripts/package-rescue.cjs
node --test tests/*.test.cjs
node scripts/build-site.cjs /tmp/hungry-wolf-2.46-site

git diff --check
```

Use a new empty build directory when repeating the build. Tests cover rank changes, 86 participants, personal ranks below 20, repeated attempts, ties, unranked players, clock rollover/DST, refresh failure/recovery, submission races, immutable finalization, duplicate prevention and existing game regressions. Browser QA uses local mock scores with production posting disabled.

The feature branch passed the automated suite, static site build and browser viewport checks at 393×650, 320×568 and 1280×800. Five complete leader rows and the personal standing remained visible on a short phone viewport; at 320×568, leader rows scrolled while the personal rank and footer stayed visible. Arrow/Home tab navigation, dated gold labels, Save/Post visibility and player-editor focus were checked. These are browser viewport checks, not physical iPhone Safari tests. No production test scores were sent.

Changed source files: `rescue.js`, `rescue.css`, `rescue-daily.js`, `rescue-services.js`, `index.html`; backend: `apps-script/Leaderboard.gs`, `apps-script/DailyRules.gs`, new `apps-script/ConsolidatedBoards.gs`; tests: `tests/rescue-flow.test.cjs`, `tests/rescue-services.test.cjs`, `tests/rescue-release.test.cjs`, new `tests/rescue-standings.test.cjs` and `tests/rescue-consolidated-backend.test.cjs`; packaging: `scripts/package-rescue.cjs`, new `scripts/build-apps-script.cjs`, generated `play/2.46/`, `classic.html` and historic entry redirects; documentation: this file, `README.md`, `DAILY_CHALLENGE_SETUP.md`, `ROLLBACK_PLAN.md`. Unrelated existing work in `MISSION_LADDER_V2.md` is preserved.

## Rollback

To reverse v2.46, restore the v2.45 runtime sources from the baseline into a new release, package and deploy normally. Do not delete or rewrite score rows. `LEADERBOARD_API_URL` is already empty; preserve `daily_final_results` for any later backend activation. An optional hourly trigger can be disabled without deleting final results. Historical version URLs continue redirecting to the base game URL.
